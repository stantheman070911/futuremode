#!/usr/bin/env node
import {
  DEFAULT_ALLOWED_EMAILS,
  DEFAULT_FIXTURE_PATH,
  assertFixture,
  defaultManifestPath,
  embedDocument,
  getExistingCurrent,
  itemsForProfile,
  payloadForProfile,
  putManifest,
  putRunManifestItem,
  readJson,
  runtimeConfigFromArgs,
  canonicalMatchingDocument,
  parseArgs,
  testProfileId,
  writeItemsTransactionally,
} from "./lib/fixture-utils.mjs";

const args = parseArgs();
const fixturePath = args.fixture || DEFAULT_FIXTURE_PATH;
const fixture = await readJson(fixturePath);
assertFixture(fixture, DEFAULT_ALLOWED_EMAILS);
const config = await runtimeConfigFromArgs(args);
const confirm = args.confirm === true || args.confirm === "true";
const manifestPath = args.manifest || defaultManifestPath(fixture.testRunId);

const planned = [];
for (const profile of fixture.profiles) {
  const profileId = testProfileId(fixture.testRunId, profile.id);
  const existing = await getExistingCurrent(config.tableName, profileId);
  if (existing && (!existing.isTestProfile || existing.testRunId !== fixture.testRunId || !existing.cleanupSafe)) {
    throw new Error(`refusing to overwrite non-test profile item for ${profile.id} (${profileId})`);
  }
  if (existing && confirm) {
    throw new Error(`test profile already installed for ${profile.id}; run remove-fake-profiles first`);
  }
  const payload = payloadForProfile(fixture, profile);
  planned.push({
    profile,
    payload,
    profileId,
    alreadyInstalled: Boolean(existing),
    canonicalLength: canonicalMatchingDocument(payload).length,
  });
}

console.log(JSON.stringify({
  action: "install-fake-profiles",
  dryRun: !confirm,
  tableName: config.tableName,
  publicSiteOrigin: config.publicSiteOrigin,
  embeddingModelId: config.embeddingModelId,
  testRunId: fixture.testRunId,
  fixture: fixturePath,
  profiles: planned.map((entry) => ({
    id: entry.profile.id,
    email: entry.profile.email,
    profileId: entry.profileId,
    headline: entry.payload.profile.headline,
    alreadyInstalled: entry.alreadyInstalled,
    canonicalLength: entry.canonicalLength,
  })),
}, null, 2));

if (!confirm) {
  console.log("Dry run only. Re-run with --confirm to write fixture profiles and create embeddings.");
  process.exit(0);
}

const installed = [];
const allItems = [];
for (const entry of planned) {
  const vector = await embedDocument(canonicalMatchingDocument(entry.payload), config);
  const built = itemsForProfile({
    fixture,
    profile: entry.profile,
    payload: entry.payload,
    vector,
    config,
  });
  installed.push({
    fixtureId: entry.profile.id,
    label: entry.profile.label || entry.profile.id,
    email: built.email,
    profileId: built.profileId,
    versionId: built.versionId,
    publicSlug: built.publicSlug,
    publicUrl: built.publicUrl,
  });
  allItems.push(...built.items);
}

await writeItemsTransactionally(config.tableName, allItems);
const manifest = {
  schema: "pitchyourowner.test-fixture-run.v1",
  testRunId: fixture.testRunId,
  testScenario: fixture.testScenario || fixture.name || "fixture",
  createdAt: new Date().toISOString(),
  fixture: fixturePath,
  tableName: config.tableName,
  publicSiteOrigin: config.publicSiteOrigin,
  embeddingModelId: config.embeddingModelId,
  embeddingDimensions: config.embeddingDimensions,
  profiles: installed,
};
await putRunManifestItem(config.tableName, manifest);
await putManifest(manifestPath, manifest);
console.log(JSON.stringify({ installed: true, manifestPath, ...manifest }, null, 2));
