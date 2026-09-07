#!/usr/bin/env node
import { createHash } from "node:crypto";
import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? String(args[index + 1] || "").trim().toLowerCase() : "";
};
const firstEmail = value("--first-email");
const secondEmail = value("--second-email");
const apply = args.includes("--apply");
const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !email.endsWith("@futuremode.test");
if (!validEmail(firstEmail) || !validEmail(secondEmail) || firstEmail === secondEmail) throw new Error("two distinct exact real emails are required");
if (apply && process.env.PYO_JOURNEY_PAIR_CONFIRM !== `reset-pair:${firstEmail}:${secondEmail}`) throw new Error("exact journey pair reset confirmation is required");

const region = process.env.AWS_REGION || "ap-southeast-1";
const stackName = process.env.PYO_JOURNEY_TEST_STACK || "PitchYourOwner-hackathon";
if (stackName !== "PitchYourOwner-hackathon") throw new Error("only the exact Hackathon stack is allowed");
const sha256 = (input) => createHash("sha256").update(String(input)).digest("hex");
const profileId = (email) => sha256(`pitchyourowner-profile:${sha256(email)}`).slice(0, 32);
const firstProfileId = profileId(firstEmail);
const secondProfileId = profileId(secondEmail);
const pairId = sha256([firstProfileId, secondProfileId].sort().join(":" )).slice(0, 32);

const cloudFormation = new CloudFormationClient({ region });
const stack = (await cloudFormation.send(new DescribeStacksCommand({ StackName: stackName }))).Stacks?.[0];
if (!stack?.Tags?.some((tag) => tag.Key === "Environment" && tag.Value === "hackathon")) throw new Error("target stack is not tagged as hackathon");
const outputs = Object.fromEntries((stack.Outputs || []).map((output) => [output.OutputKey, output.OutputValue]));
const tableName = String(outputs.ProfileTableName || "");
if (tableName !== "pitchyourowner-hackathon-profile-store") throw new Error("unexpected production table");

const secret = await new SecretsManagerClient({ region }).send(new GetSecretValueCommand({ SecretId: "pitchyourowner/hackathon/manual-test-accounts" }));
const configuration = JSON.parse(secret.SecretString || "{}");
const firstJourney = configuration.journeyAccounts?.[firstEmail];
const secondJourney = configuration.journeyAccounts?.[secondEmail];
const allowed = (firstJourney && Array.isArray(firstJourney.visibleToEmails) && firstJourney.visibleToEmails.includes(secondEmail))
  || (secondJourney && Array.isArray(secondJourney.visibleToEmails) && secondJourney.visibleToEmails.includes(firstEmail));
if (!allowed) throw new Error("pair is not an approved journey-test audience relationship");

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
const removableTypes = new Set(["INVITATION", "INVITATION_TOKEN", "INVITATION_POINTER", "CONNECTION", "EMAIL_OUTBOX", "MANUAL_TEST_INBOX"]);
const relationItems = (items) => items.filter((item) => removableTypes.has(String(item.entityType)) && (item.pairId === pairId || Object.values(item).some((entry) => typeof entry === "string" && entry.includes(pairId))));
async function deleteItems(items) {
  for (let index = 0; index < items.length; index += 25) {
    let pending = items.slice(index, index + 25).map((item) => ({ DeleteRequest: { Key: { pk: item.pk, sk: item.sk } } }));
    for (let attempt = 0; pending.length && attempt < 5; attempt += 1) {
      const result = await dynamo.send(new BatchWriteCommand({ RequestItems: { [tableName]: pending } }));
      pending = result.UnprocessedItems?.[tableName] || [];
    }
    if (pending.length) throw new Error("journey pair reset left unprocessed items");
  }
}

let items = await scanAll();
let removable = relationItems(items);
const summary = {
  apply,
  firstEmailHashPrefix: sha256(firstEmail).slice(0, 12),
  secondEmailHashPrefix: sha256(secondEmail).slice(0, 12),
  firstProfileId,
  secondProfileId,
  pairId,
  recordsToDelete: removable.length,
  entityCounts: Object.fromEntries([...new Set(removable.map((item) => String(item.entityType)))].sort().map((type) => [type, removable.filter((item) => item.entityType === type).length])),
};
if (!apply) {
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}
await deleteItems(removable);
items = await scanAll();
removable = relationItems(items);
if (removable.length) throw new Error("journey pair reset postcondition failed");
console.log(JSON.stringify({ ...summary, completed: true }, null, 2));
