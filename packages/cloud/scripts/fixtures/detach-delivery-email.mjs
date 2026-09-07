#!/usr/bin/env node
import { createHash } from "node:crypto";
import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const args = process.argv.slice(2);
const argument = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? String(args[index + 1] || "").trim() : "";
};
const email = argument("--email").toLowerCase();
const apply = args.includes("--apply");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith(".invalid")) throw new Error("an exact deliverable fixture email is required");
if (apply && process.env.PYO_FIXTURE_DETACH_CONFIRM !== `detach:${email}`) throw new Error("exact fixture detach confirmation is required");

const region = process.env.AWS_REGION || "ap-southeast-1";
const stackName = process.env.PYO_FIXTURE_STACK || "PitchYourOwner-hackathon";
if (stackName !== "PitchYourOwner-hackathon") throw new Error("only the exact Hackathon stack is allowed");
const sha256 = (input) => createHash("sha256").update(String(input)).digest("hex");
const cloudFormation = new CloudFormationClient({ region });
const stack = (await cloudFormation.send(new DescribeStacksCommand({ StackName: stackName }))).Stacks?.[0];
if (!stack?.Tags?.some((tag) => tag.Key === "Environment" && tag.Value === "hackathon")) throw new Error("target stack is not tagged as hackathon");
const outputs = Object.fromEntries((stack.Outputs || []).map((output) => [output.OutputKey, output.OutputValue]));
const tableName = String(outputs.ProfileTableName || "");
if (tableName !== "pitchyourowner-hackathon-profile-store") throw new Error("unexpected profile table");

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } });
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
function contains(value, target) {
  if (typeof value === "string") return value.includes(target);
  if (Array.isArray(value)) return value.some((entry) => contains(entry, target));
  if (value && typeof value === "object") return Object.values(value).some((entry) => contains(entry, target));
  return false;
}
const removableTypes = new Set(["INVITATION", "INVITATION_TOKEN", "INVITATION_POINTER", "CONNECTION", "EMAIL_OUTBOX", "MANUAL_TEST_INBOX"]);
function plan(items) {
  const fixtures = items.filter((item) => item.entityType === "PROFILE_CURRENT" && item.isFixtureProfile === true && String(item.email || "").toLowerCase() === email);
  if (fixtures.length !== 1) throw new Error(`expected exactly one fixture using the email, found ${fixtures.length}`);
  const fixture = fixtures[0];
  if (fixture.cleanupSafe !== true || typeof fixture.profileId !== "string" || typeof fixture.versionId !== "string") throw new Error("fixture is not cleanup-safe");
  const direct = items.filter((item) => removableTypes.has(String(item.entityType)) && contains(item, email));
  const pairIds = new Set(direct.flatMap((item) => typeof item.pairId === "string" ? [item.pairId] : []));
  const removable = items.filter((item) => removableTypes.has(String(item.entityType)) && (contains(item, email) || [...pairIds].some((pairId) => contains(item, pairId))));
  return { fixture, pairIds, removable };
}
async function deleteItems(items) {
  for (let index = 0; index < items.length; index += 25) {
    let pending = items.slice(index, index + 25).map((item) => ({ DeleteRequest: { Key: { pk: item.pk, sk: item.sk } } }));
    for (let attempt = 0; pending.length && attempt < 5; attempt += 1) {
      const result = await dynamo.send(new BatchWriteCommand({ RequestItems: { [tableName]: pending } }));
      pending = result.UnprocessedItems?.[tableName] || [];
    }
    if (pending.length) throw new Error("fixture detach left unprocessed items");
  }
}

let items = await scanAll();
let migration = plan(items);
const invalidEmail = `detached-${migration.fixture.profileId}@fixture.pitchyourowner.invalid`;
const summary = {
  apply,
  fixtureId: migration.fixture.profileId,
  fixtureSetId: migration.fixture.fixtureSetId,
  relatedPairs: migration.pairIds.size,
  recordsToDelete: migration.removable.length,
  replacementDomain: "fixture.pitchyourowner.invalid",
};
if (!apply) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

await deleteItems(migration.removable);
const values = { ":emailHash": sha256(invalidEmail), ":no": false, ":yes": true, ":set": migration.fixture.fixtureSetId };
await dynamo.send(new UpdateCommand({
  TableName: tableName,
  Key: { pk: `PROFILE#${migration.fixture.profileId}`, sk: "CURRENT" },
  UpdateExpression: "SET email = :email, emailHash = :emailHash, fixtureInvitationEnabled = :no",
  ConditionExpression: "isFixtureProfile = :yes AND cleanupSafe = :yes AND fixtureSetId = :set",
  ExpressionAttributeValues: { ...values, ":email": invalidEmail },
}));
await dynamo.send(new UpdateCommand({
  TableName: tableName,
  Key: { pk: `PROFILE#${migration.fixture.profileId}`, sk: `VERSION#${migration.fixture.versionId}` },
  UpdateExpression: "SET emailHash = :emailHash, fixtureInvitationEnabled = :no",
  ConditionExpression: "isFixtureProfile = :yes AND cleanupSafe = :yes AND fixtureSetId = :set",
  ExpressionAttributeValues: values,
}));

items = await scanAll();
if (items.some((item) => item.entityType === "PROFILE_CURRENT" && item.isFixtureProfile === true && String(item.email || "").toLowerCase() === email)) throw new Error("fixture email detach postcondition failed");
if (items.some((item) => removableTypes.has(String(item.entityType)) && contains(item, email))) throw new Error("fixture relationship cleanup postcondition failed");
console.log(JSON.stringify({ ...summary, completed: true }, null, 2));
