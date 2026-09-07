#!/usr/bin/env node
import { createHash } from "node:crypto";
import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { GetSecretValueCommand, PutSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const args = process.argv.slice(2);
const action = args[0];
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? String(args[index + 1] || "").trim() : "";
};
const apply = args.includes("--apply");
const email = value("--email").toLowerCase();
const scenarioKey = value("--scenario");
const allowedActions = new Set(["status", "add", "reset", "remove"]);
if (!allowedActions.has(action)) throw new Error("action must be status, add, reset, or remove");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith("@futuremode.test")) throw new Error("an exact real email is required");
if (action === "add" && !/^[A-Za-z0-9_.:-]{6,120}$/.test(scenarioKey)) throw new Error("--scenario is required for add");
if (apply && process.env.PYO_JOURNEY_TEST_CONFIRM !== `${action}:${email}`) throw new Error("exact confirmation phrase is required");

const region = process.env.AWS_REGION || "ap-southeast-1";
const stackName = process.env.PYO_JOURNEY_TEST_STACK || "PitchYourOwner-hackathon";
if (stackName !== "PitchYourOwner-hackathon") throw new Error("only the exact Hackathon stack is allowed");
const secretId = "pitchyourowner/hackathon/manual-test-accounts";
const journeyCohortId = process.env.PYO_JOURNEY_TEST_COHORT_ID || "hackathon-journey-20260907";
const sha256 = (input) => createHash("sha256").update(String(input)).digest("hex");
const emailHash = sha256(email);
const profileId = sha256(`pitchyourowner-profile:${emailHash}`).slice(0, 32);

const cloudFormation = new CloudFormationClient({ region });
const stack = (await cloudFormation.send(new DescribeStacksCommand({ StackName: stackName }))).Stacks?.[0];
if (!stack?.Tags?.some((tag) => tag.Key === "Environment" && tag.Value === "hackathon")) throw new Error("target stack is not tagged as hackathon");
const outputs = Object.fromEntries((stack.Outputs || []).map((output) => [output.OutputKey, output.OutputValue]));
const tableName = String(outputs.ProfileTableName || "");
const bucketName = String(outputs.ProfileImageBucketName || "");
if (tableName !== "pitchyourowner-hackathon-profile-store" || !bucketName.startsWith("pitchyourowner-hackathon-profile-images-")) throw new Error("unexpected production resources");

const secrets = new SecretsManagerClient({ region });
const secretResult = await secrets.send(new GetSecretValueCommand({ SecretId: secretId }));
const configuration = JSON.parse(secretResult.SecretString || "{}");
if (configuration.enabled !== true || !configuration.accounts || typeof configuration.accounts !== "object") throw new Error("manual test configuration is invalid");
configuration.journeyCohortId ||= journeyCohortId;
if (configuration.journeyCohortId !== journeyCohortId) throw new Error("journey cohort does not match the approved environment");
configuration.journeyAccounts ||= {};
if (typeof configuration.journeyAccounts !== "object" || Array.isArray(configuration.journeyAccounts)) throw new Error("journey account configuration is invalid");

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } });
const s3 = new S3Client({ region });

async function scanAll() {
  const items = [];
  let start;
  do {
    const page = await dynamo.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey: start, ConsistentRead: true }));
    items.push(...(page.Items || []));
    start = page.LastEvaluatedKey;
  } while (start);
  return items;
}

function contains(value, targets) {
  if (typeof value === "string") return [...targets].some((target) => value.includes(target));
  if (Array.isArray(value)) return value.some((entry) => contains(entry, targets));
  if (value && typeof value === "object") return Object.values(value).some((entry) => contains(entry, targets));
  return false;
}

function relatedItems(items) {
  const targets = new Set([email, emailHash, profileId, `PROFILE#${profileId}`, `EMAIL#${emailHash}`, `RATE#EMAIL#${emailHash}`, `IDEMPOTENCY#${emailHash}`]);
  const direct = items.filter((item) => contains(item, targets));
  const pairIds = new Set(direct.flatMap((item) => typeof item.pairId === "string" ? [item.pairId] : []));
  const resultSetIds = new Set(direct.flatMap((item) => typeof item.resultSetId === "string" ? [item.resultSetId] : []));
  const expanded = new Set([...targets, ...pairIds, ...resultSetIds]);
  const related = items.filter((item) => contains(item, expanded));
  return { related, pairIds, resultSetIds };
}

async function imageKeys() {
  const keys = [];
  let continuation;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: `profiles/${profileId}/`, ContinuationToken: continuation }));
    keys.push(...(page.Contents || []).flatMap((object) => object.Key ? [object.Key] : []));
    continuation = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuation);
  return keys;
}

async function deleteItems(items) {
  for (let index = 0; index < items.length; index += 25) {
    let pending = items.slice(index, index + 25).map((item) => ({ DeleteRequest: { Key: { pk: item.pk, sk: item.sk } } }));
    for (let attempt = 0; pending.length && attempt < 5; attempt += 1) {
      const result = await dynamo.send(new BatchWriteCommand({ RequestItems: { [tableName]: pending } }));
      pending = result.UnprocessedItems?.[tableName] || [];
    }
    if (pending.length) throw new Error("journey reset left unprocessed DynamoDB items");
  }
}

async function deleteImages(keys) {
  for (let index = 0; index < keys.length; index += 1000) {
    await s3.send(new DeleteObjectsCommand({ Bucket: bucketName, Delete: { Objects: keys.slice(index, index + 1000).map((Key) => ({ Key })), Quiet: true } }));
  }
}

async function inspect() {
  const items = await scanAll();
  const { related, pairIds, resultSetIds } = relatedItems(items);
  const current = items.find((item) => item.pk === `PROFILE#${profileId}` && item.sk === "CURRENT");
  const fixtureConflicts = items.filter((item) => item.entityType === "PROFILE_CURRENT" && item.isFixtureProfile === true && String(item.email || "").toLowerCase() === email);
  const keys = await imageKeys();
  return { items, related, pairIds, resultSetIds, current, fixtureConflicts, keys };
}

function summary(state) {
  return {
    action,
    apply,
    emailHashPrefix: emailHash.slice(0, 12),
    profileId,
    registeredInJourneyAllowlist: Boolean(configuration.journeyAccounts[email]),
    scenarioKey: configuration.journeyAccounts[email]?.scenarioKey,
    profilePresent: Boolean(state.current),
    relatedRecords: state.related.length,
    pairRecords: state.pairIds.size,
    resultSets: state.resultSetIds.size,
    imageObjects: state.keys.length,
    fixtureEmailConflicts: state.fixtureConflicts.length,
  };
}

let state = await inspect();
if (action === "status") {
  console.log(JSON.stringify(summary(state), null, 2));
  process.exit(0);
}

if (action === "add") {
  if (state.fixtureConflicts.length) throw new Error("refusing add: the email is still assigned to a fixture");
  if (configuration.accounts[email]) throw new Error("refusing add: the email is a synthetic manual account");
  const existing = configuration.journeyAccounts[email];
  if (existing && existing.scenarioKey !== scenarioKey) throw new Error("refusing add: journey account exists with another scenario");
  if (!apply) {
    console.log(JSON.stringify({ ...summary(state), plannedScenarioKey: scenarioKey }, null, 2));
    process.exit(0);
  }
  configuration.journeyAccounts[email] = { scenarioKey };
  await secrets.send(new PutSecretValueCommand({ SecretId: secretId, SecretString: JSON.stringify(configuration) }));
} else {
  if (!configuration.journeyAccounts[email]) throw new Error("refusing reset/remove: email is not an approved journey account");
  if (state.fixtureConflicts.length) throw new Error("refusing reset/remove: detach the fixture email first");
  if (state.current && !(state.current.isTestProfile === true && state.current.isJourneyTestProfile === true && state.current.cleanupSafe === true && state.current.testRunId === journeyCohortId)) {
    throw new Error("refusing reset/remove: current profile is not an owned cleanup-safe journey profile");
  }
  if (!apply) {
    console.log(JSON.stringify(summary(state), null, 2));
    process.exit(0);
  }
  await deleteItems(state.related);
  await deleteImages(state.keys);
  if (state.related.length) {
    await dynamo.send(new UpdateCommand({
      TableName: tableName,
      Key: { pk: "MATCHING_GRAPH", sk: "REVISION" },
      UpdateExpression: "SET updatedAt = :now ADD revision :one",
      ExpressionAttributeValues: { ":now": new Date().toISOString(), ":one": 1 },
    }));
  }
  if (action === "remove") {
    delete configuration.journeyAccounts[email];
    await secrets.send(new PutSecretValueCommand({ SecretId: secretId, SecretString: JSON.stringify(configuration) }));
  }
}

state = await inspect();
const expectedAllowlist = action === "remove" ? false : true;
if (Boolean(configuration.journeyAccounts[email]) !== expectedAllowlist) throw new Error("journey allowlist postcondition failed");
if ((action === "reset" || action === "remove") && (state.related.length || state.keys.length || state.current)) throw new Error("journey reset postcondition failed");
console.log(JSON.stringify({ ...summary(state), completed: true }, null, 2));
