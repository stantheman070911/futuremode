#!/usr/bin/env node
import {
  DEFAULT_ALLOWED_EMAILS,
  DEFAULT_FIXTURE_PATH,
  assertFixture,
  defaultManifestPath,
  dynamo,
  parseArgs,
  queryProfileItems,
  readJson,
  runtimeConfigFromArgs,
  testProfileId,
} from "./lib/fixture-utils.mjs";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

const args = parseArgs();
const fixturePath = args.fixture || DEFAULT_FIXTURE_PATH;
const fixture = await readJson(fixturePath);
assertFixture(fixture, DEFAULT_ALLOWED_EMAILS);
const config = await runtimeConfigFromArgs(args);
const manifestPath = args.manifest || defaultManifestPath(fixture.testRunId);

const profiles = [];
let ok = true;
for (const profile of fixture.profiles) {
  const profileId = testProfileId(fixture.testRunId, profile.id);
  const items = await queryProfileItems(config.tableName, profileId);
  const current = items.find((item) => item.sk === "CURRENT");
  const version = items.find((item) => item.entityType === "PROFILE_VERSION" && item.profile_scope === "ACTIVE");
  const stories = items.filter((item) => item.entityType === "PROFILE_STORY");
  const slugItem = current?.publicSlug
    ? (await dynamo.send(new GetCommand({
      TableName: config.tableName,
      Key: { pk: `SLUG#${current.publicSlug}`, sk: "META" },
      ConsistentRead: true,
    }))).Item
    : undefined;
  const checks = {
    currentExists: Boolean(current),
    versionExists: Boolean(version),
    storyCount: stories.length,
    expectedStoryCount: profile.stories.length,
    slugExists: Boolean(slugItem),
    embeddingReady: Array.isArray(version?.embedding) && version.embedding.length === config.embeddingDimensions && version.embedding_status === "READY",
    cleanupSafe: Boolean(current?.cleanupSafe && version?.cleanupSafe && slugItem?.cleanupSafe),
    testRunIdMatches: current?.testRunId === fixture.testRunId && version?.testRunId === fixture.testRunId && slugItem?.testRunId === fixture.testRunId,
  };
  const profileOk = checks.currentExists
    && checks.versionExists
    && checks.storyCount === checks.expectedStoryCount
    && checks.slugExists
    && checks.embeddingReady
    && checks.cleanupSafe
    && checks.testRunIdMatches;
  if (!profileOk) ok = false;
  profiles.push({
    id: profile.id,
    email: profile.email,
    profileId,
    publicSlug: current?.publicSlug,
    publicUrl: current?.publicSlug ? `${config.publicSiteOrigin}/p/${current.publicSlug}` : undefined,
    checks,
    ok: profileOk,
  });
}

console.log(JSON.stringify({
  ok,
  action: "verify-fake-profiles",
  tableName: config.tableName,
  testRunId: fixture.testRunId,
  fixture: fixturePath,
  manifestPath,
  profiles,
}, null, 2));

process.exit(ok ? 0 : 1);
