#!/usr/bin/env node
import {
  DEFAULT_ALLOWED_EMAILS,
  DEFAULT_FIXTURE_PATH,
  assertFixture,
  deleteKeys,
  dynamo,
  parseArgs,
  queryProfileItems,
  readJson,
  runtimeConfigFromArgs,
  testProfileId,
} from "./lib/fixture-utils.mjs";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";

const args = parseArgs();
const fixturePath = args.fixture || DEFAULT_FIXTURE_PATH;
const fixture = await readJson(fixturePath);
assertFixture(fixture, DEFAULT_ALLOWED_EMAILS);
const config = await runtimeConfigFromArgs(args);
const confirm = args.confirm === true || args.confirm === "true";

const keys = [];
const profiles = [];
for (const profile of fixture.profiles) {
  const profileId = testProfileId(fixture.testRunId, profile.id);
  const items = await queryProfileItems(config.tableName, profileId);
  const current = items.find((item) => item.sk === "CURRENT");
  if (!current?.isTestProfile || current.testRunId !== fixture.testRunId || !current.cleanupSafe) {
    throw new Error(`refusing reset: fixture profile is not installed or not cleanupSafe: ${profile.id}`);
  }
  const pointers = items.filter((item) => item.entityType === "PROFILE_MATCH_POINTER");
  for (const pointer of pointers) {
    if (Array.isArray(pointer.cleanupKeys)) {
      keys.push(...pointer.cleanupKeys.filter((key) => key?.pk && key?.sk).map((key) => ({ pk: key.pk, sk: key.sk })));
    }
    keys.push({ pk: pointer.pk, sk: pointer.sk });
  }
  profiles.push({ id: profile.id, email: profile.email, profileId, pointerCount: pointers.length });
}

const testItems = await dynamo.send(new ScanCommand({
  TableName: config.tableName,
  FilterExpression: "testRunId = :testRunId AND cleanupSafe = :safe AND entityType IN (:match, :token, :outbox)",
  ExpressionAttributeValues: {
    ":testRunId": fixture.testRunId,
    ":safe": true,
    ":match": "MATCH",
    ":token": "MATCH_RESPONSE_TOKEN",
    ":outbox": "EMAIL_OUTBOX",
  },
  ProjectionExpression: "pk, sk, entityType",
}));
keys.push(...(testItems.Items ?? []).map((item) => ({ pk: item.pk, sk: item.sk })));

const uniqueKeys = [...new Map(keys.map((key) => [`${key.pk}\u0000${key.sk}`, key])).values()];
console.log(JSON.stringify({
  action: "reset-fake-matches",
  dryRun: !confirm,
  tableName: config.tableName,
  testRunId: fixture.testRunId,
  fixture: fixturePath,
  profiles,
  deleteCount: uniqueKeys.length,
  deleteKeys: uniqueKeys,
}, null, 2));

if (!confirm) {
  console.log("Dry run only. Re-run with --confirm to delete fake match artifacts while keeping fake profiles.");
  process.exit(0);
}

const deleted = await deleteKeys(config.tableName, uniqueKeys);
console.log(JSON.stringify({ reset: true, testRunId: fixture.testRunId, deleted }, null, 2));
