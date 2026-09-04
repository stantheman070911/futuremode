#!/usr/bin/env node
import {
  DEFAULT_ALLOWED_EMAILS,
  DEFAULT_FIXTURE_PATH,
  assertFixture,
  defaultManifestPath,
  deleteKeys,
  dynamo,
  parseArgs,
  queryProfileItems,
  readJson,
  runtimeConfigFromArgs,
  testProfileId,
} from "./lib/fixture-utils.mjs";
import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const args = parseArgs();
const fixturePath = args.fixture || DEFAULT_FIXTURE_PATH;
const fixture = await readJson(fixturePath);
assertFixture(fixture, DEFAULT_ALLOWED_EMAILS);
const config = await runtimeConfigFromArgs(args);
const confirm = args.confirm === true || args.confirm === "true";
const manifestPath = args.manifest || defaultManifestPath(fixture.testRunId);

const keys = [];
const profileSummaries = [];
for (const profile of fixture.profiles) {
  const profileId = testProfileId(fixture.testRunId, profile.id);
  const items = await queryProfileItems(config.tableName, profileId);
  const current = items.find((item) => item.sk === "CURRENT");
  if (items.length && (!current?.isTestProfile || current.testRunId !== fixture.testRunId || !current.cleanupSafe)) {
    throw new Error(`refusing cleanup: PROFILE#${profileId} is not an installed cleanup-safe fixture profile`);
  }
  for (const item of items) {
    const isFixtureItem = item.isTestProfile && item.testRunId === fixture.testRunId && item.cleanupSafe;
    const isMatchPointerForFixture = item.entityType === "PROFILE_MATCH_POINTER" && Array.isArray(item.cleanupKeys);
    if (!isFixtureItem && !isMatchPointerForFixture) {
      throw new Error(`refusing cleanup: non-test item found under PROFILE#${profileId} ${item.sk}`);
    }
    keys.push({ pk: item.pk, sk: item.sk });
    if (item.entityType === "PROFILE_CURRENT" && item.publicSlug) {
      const slug = await dynamo.send(new GetCommand({
        TableName: config.tableName,
        Key: { pk: `SLUG#${item.publicSlug}`, sk: "META" },
        ConsistentRead: true,
      }));
      if (slug.Item) {
        if (!slug.Item.isTestProfile || slug.Item.testRunId !== fixture.testRunId || !slug.Item.cleanupSafe) {
          throw new Error(`refusing cleanup: non-test slug points to fixture profile ${item.publicSlug}`);
        }
        keys.push({ pk: slug.Item.pk, sk: slug.Item.sk });
      }
    }
    if (item.entityType === "PROFILE_MATCH_POINTER" && Array.isArray(item.cleanupKeys)) {
      keys.push(...item.cleanupKeys.filter((key) => key?.pk && key?.sk).map((key) => ({ pk: key.pk, sk: key.sk })));
    }
  }
  profileSummaries.push({ id: profile.id, email: profile.email, profileId, itemCount: items.length });
}

const runItem = await dynamo.send(new GetCommand({
  TableName: config.tableName,
  Key: { pk: `TEST_RUN#${fixture.testRunId}`, sk: "META" },
  ConsistentRead: true,
}));
if (runItem.Item) {
  if (!runItem.Item.cleanupSafe || runItem.Item.testRunId !== fixture.testRunId) {
    throw new Error("refusing cleanup: TEST_RUN item is not cleanupSafe");
  }
  keys.push({ pk: runItem.Item.pk, sk: runItem.Item.sk });
}

const strayOutbox = await dynamo.send(new ScanCommand({
  TableName: config.tableName,
  FilterExpression: "testRunId = :testRunId AND cleanupSafe = :safe",
  ExpressionAttributeValues: { ":testRunId": fixture.testRunId, ":safe": true },
  ProjectionExpression: "pk, sk",
}));
keys.push(...(strayOutbox.Items ?? []).map((item) => ({ pk: item.pk, sk: item.sk })));

const uniqueKeys = [...new Map(keys.map((key) => [`${key.pk}\u0000${key.sk}`, key])).values()];
console.log(JSON.stringify({
  action: "remove-fake-profiles",
  dryRun: !confirm,
  tableName: config.tableName,
  testRunId: fixture.testRunId,
  fixture: fixturePath,
  manifestPath,
  profiles: profileSummaries,
  deleteCount: uniqueKeys.length,
  deleteKeys: uniqueKeys,
}, null, 2));

if (!confirm) {
  console.log("Dry run only. Re-run with --confirm to delete fixture profiles and related match/outbox/token records.");
  process.exit(0);
}

const deleted = await deleteKeys(config.tableName, uniqueKeys);
console.log(JSON.stringify({ removed: true, testRunId: fixture.testRunId, deleted }, null, 2));
