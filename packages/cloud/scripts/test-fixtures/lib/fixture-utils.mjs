import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";

export const DEFAULT_ALLOWED_EMAILS = new Set([
  "accounting-founder@fixture.pitchyourowner.invalid",
  "accounting-builder@fixture.pitchyourowner.invalid",
]);

const LIB_DIR = dirname(fileURLToPath(import.meta.url));
export const TEST_FIXTURES_DIR = resolve(LIB_DIR, "..");
export const CLOUD_PACKAGE_DIR = resolve(TEST_FIXTURES_DIR, "..", "..");
export const DEFAULT_OUTPUTS_PATH = resolve(CLOUD_PACKAGE_DIR, "cdk-outputs.json");
export const DEFAULT_FIXTURE_PATH = resolve(TEST_FIXTURES_DIR, "fixtures", "accounting-match-pair.json");
export const DEFAULT_STACK_OUTPUT_KEY = "PitchYourOwner-dev";
export const DEFAULT_EMBEDDING_MODEL_ID = "global.cohere.embed-v4:0";
export const DEFAULT_EMBEDDING_DIMENSIONS = 1024;
export const DEFAULT_PUBLIC_SITE_ORIGIN = "https://pitchyourowner.oysterun.com";
export const DEFAULT_VECTOR_INDEX_NAME = "profile-matching-v1";
export const CURRENT_PRIVACY_VERSION = "2026-08-18";
export const CURRENT_TERMS_VERSION = "2026-08-18";

export const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-southeast-1";

export const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});
export const bedrock = new BedrockRuntimeClient({ region: AWS_REGION });

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const entry = argv[index];
    if (!entry.startsWith("--")) {
      if (!args._) args._ = [];
      args._.push(entry);
      continue;
    }
    const [rawKey, inlineValue] = entry.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function normalizeEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`invalid email: ${value}`);
  return email;
}

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function payloadHash(payload) {
  return sha256(stableStringify(payload));
}

export function testProfileId(testRunId, fixtureId) {
  return sha256(`pitchyourowner-test-profile:${testRunId}:${fixtureId}`).slice(0, 32);
}

export function publicSlugFor(testRunId, fixtureId, animalSlug) {
  const cleanAnimal = String(animalSlug || "otter")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "otter";
  return `${cleanAnimal}-${sha256(`${testRunId}:${fixtureId}`).slice(0, 8)}`;
}

export async function readJson(path) {
  return JSON.parse(await readFile(resolve(path), "utf8"));
}

export async function loadOutputs(outputsPath = DEFAULT_OUTPUTS_PATH, stackKey = DEFAULT_STACK_OUTPUT_KEY) {
  const outputs = await readJson(outputsPath);
  const stack = outputs[stackKey];
  if (!stack) throw new Error(`stack output ${stackKey} not found in ${outputsPath}`);
  return stack;
}

export function runtimeConfig(args) {
  return {
    tableName: args.table || args.tableName,
    publicSiteOrigin: (args.publicSiteOrigin || DEFAULT_PUBLIC_SITE_ORIGIN).replace(/\/$/, ""),
    embeddingModelId: args.embeddingModelId || DEFAULT_EMBEDDING_MODEL_ID,
    embeddingDimensions: Number(args.embeddingDimensions || DEFAULT_EMBEDDING_DIMENSIONS),
    vectorIndexName: args.vectorIndexName || DEFAULT_VECTOR_INDEX_NAME,
  };
}

export async function runtimeConfigFromArgs(args) {
  const config = runtimeConfig(args);
  if (config.tableName) return config;
  const outputs = await loadOutputs(args.outputs || DEFAULT_OUTPUTS_PATH, args.stack || DEFAULT_STACK_OUTPUT_KEY);
  return {
    ...config,
    tableName: outputs.ProfileTableName,
    publicSiteOrigin: (args.publicSiteOrigin || outputs.CloudWebsiteUrl || config.publicSiteOrigin).replace(/\/$/, ""),
    vectorIndexName: args.vectorIndexName || outputs.VectorIndexName || config.vectorIndexName,
  };
}

export function canonicalMatchingDocument(payload) {
  const skills = [...new Set(payload.skills.map((skill) => skill.trim()))].sort((a, b) => a.localeCompare(b));
  const stories = payload.stories
    .map((story) => `- ${story.title.trim()} — ${(story.summary ?? story.markdown).trim().slice(0, 1_200)}`)
    .join("\n\n");
  return [
    "# Personal profile",
    payload.profile.markdown.trim().slice(0, 60_000),
    "# Skills and matching keywords",
    skills.join("\n").slice(0, 10_000),
    "# Owner-approved story signals",
    stories.slice(0, 30_000),
  ].join("\n\n").slice(0, 100_000);
}

export async function embedDocument(document, config) {
  const response = await bedrock.send(new InvokeModelCommand({
    modelId: config.embeddingModelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      input_type: "search_document",
      texts: [document],
      embedding_types: ["float"],
      output_dimension: config.embeddingDimensions,
      max_tokens: 128_000,
      truncate: "RIGHT",
    }),
  }));
  const decoded = JSON.parse(new TextDecoder().decode(response.body));
  const vector = Array.isArray(decoded.embeddings)
    ? decoded.embeddings[0]
    : decoded.embeddings?.float?.[0] ?? decoded.embeddings_by_type?.float?.[0];
  if (!Array.isArray(vector) || vector.length !== config.embeddingDimensions) {
    throw new Error(`invalid embedding response: expected ${config.embeddingDimensions}, got ${vector?.length ?? "none"}`);
  }
  return vector;
}

export function assertFixture(fixture, allowedEmails = DEFAULT_ALLOWED_EMAILS) {
  if (!fixture || typeof fixture !== "object") throw new Error("fixture must be an object");
  if (!fixture.testRunId || !/^[a-zA-Z0-9_.:-]{6,120}$/.test(fixture.testRunId)) throw new Error("fixture.testRunId is required");
  if (!Array.isArray(fixture.profiles) || fixture.profiles.length < 2) throw new Error("fixture.profiles must contain at least two profiles");
  const emailProfiles = fixture.profiles.filter((profile) => Boolean(profile.email));
  if (emailProfiles.length !== 2) throw new Error("P0 fixture must have exactly one email-enabled pair: two profiles with email");
  const seenEmails = new Set();
  for (const profile of fixture.profiles) {
    if (!profile.id || !/^[a-zA-Z0-9_.:-]{3,80}$/.test(profile.id)) throw new Error("profile.id is required");
    if (profile.email) {
      const email = normalizeEmail(profile.email);
      if (!allowedEmails.has(email)) throw new Error(`email is not in fixture allowlist: ${email}`);
      if (seenEmails.has(email)) throw new Error(`duplicate fixture email: ${email}`);
      seenEmails.add(email);
    }
    if (!profile.profile?.headline || !profile.profile?.markdown || !profile.profile?.locale) throw new Error(`profile ${profile.id} is missing profile fields`);
    if (!Array.isArray(profile.skills) || profile.skills.length < 3 || profile.skills.length > 10) throw new Error(`profile ${profile.id} must have 3-10 skills`);
    if (!Array.isArray(profile.stories) || profile.stories.length < 1) throw new Error(`profile ${profile.id} must have stories`);
    if (!profile.preferences?.animalSlug) throw new Error(`profile ${profile.id} is missing preferences.animalSlug`);
  }
}

export function payloadForProfile(fixture, profile) {
  const now = fixture.approvedAt || new Date().toISOString();
  return {
    schema: "pitchyourowner.profile-publish.v1",
    localProfileId: `fixture-${fixture.testRunId}-${profile.id}`,
    analysisId: `fixture-${fixture.testRunId}`,
    profile: {
      markdown: profile.profile.markdown,
      headline: profile.profile.headline,
      locale: profile.profile.locale,
      promptVersion: profile.profile.promptVersion || "fixture-v1",
    },
    skills: profile.skills,
    stories: profile.stories,
    activity: profile.activity,
    preferences: {
      matchIntervalDays: profile.preferences.matchIntervalDays ?? 1,
      matchLanguages: profile.preferences.matchLanguages ?? ["zh", "en"],
      visibility: profile.preferences.visibility ?? "public",
      animalSlug: profile.preferences.animalSlug,
    },
    consent: {
      approvedAt: now,
      privacyVersion: CURRENT_PRIVACY_VERSION,
      termsVersion: CURRENT_TERMS_VERSION,
    },
  };
}

export function itemsForProfile({ fixture, profile, payload, vector, config }) {
  const createdAt = fixture.createdAt || new Date().toISOString();
  const profileId = testProfileId(fixture.testRunId, profile.id);
  const versionId = `test-${sha256(`${fixture.testRunId}:${profile.id}:version`).slice(0, 24)}`;
  const email = normalizeEmail(profile.email);
  const emailHash = sha256(email);
  const publicSlug = publicSlugFor(fixture.testRunId, profile.id, payload.preferences.animalSlug);
  const digest = payloadHash(payload);
  const testMeta = {
    isTestProfile: true,
    cleanupSafe: true,
    testRunId: fixture.testRunId,
    testScenario: fixture.testScenario || fixture.name || "fixture",
    testOwnerLabel: profile.label || profile.id,
  };
  const version = {
    pk: `PROFILE#${profileId}`,
    sk: `VERSION#${versionId}`,
    entityType: "PROFILE_VERSION",
    profileId,
    versionId,
    emailHash,
    locale: payload.profile.locale,
    profileHeadline: payload.profile.headline,
    promptVersion: payload.profile.promptVersion,
    profileMarkdown: payload.profile.markdown,
    skills: payload.skills,
    activity: payload.activity,
    matchIntervalDays: payload.preferences.matchIntervalDays,
    matchLanguages: payload.preferences.matchLanguages,
    visibility: payload.preferences.visibility,
    animalSlug: payload.preferences.animalSlug,
    publicSlug,
    analysisId: payload.analysisId,
    payloadHash: digest,
    approvedAt: payload.consent.approvedAt,
    privacyVersion: payload.consent.privacyVersion,
    termsVersion: payload.consent.termsVersion,
    embedding: vector,
    embedding_status: "READY",
    profile_scope: "ACTIVE",
    is_matchable: 1,
    createdAt,
    ...testMeta,
  };
  const current = {
    pk: `PROFILE#${profileId}`,
    sk: "CURRENT",
    entityType: "PROFILE_CURRENT",
    profileId,
    versionId,
    email,
    emailHash,
    visibility: payload.preferences.visibility,
    animalSlug: payload.preferences.animalSlug,
    publicSlug,
    matchingState: "active",
    matchIntervalDays: payload.preferences.matchIntervalDays,
    matchLanguages: payload.preferences.matchLanguages,
    updatedAt: createdAt,
    ...testMeta,
  };
  const slug = {
    pk: `SLUG#${publicSlug}`,
    sk: "META",
    entityType: "PROFILE_SLUG",
    profileId,
    createdAt,
    ...testMeta,
  };
  const stories = payload.stories.map((story) => ({
    pk: `PROFILE#${profileId}`,
    sk: `VERSION#${versionId}#STORY#${story.id}`,
    entityType: "PROFILE_STORY",
    profileId,
    versionId,
    ...story,
    createdAt,
    ...testMeta,
  }));
  return {
    profileId,
    versionId,
    publicSlug,
    publicUrl: `${config.publicSiteOrigin}/p/${publicSlug}`,
    email,
    items: [version, current, slug, ...stories],
  };
}

export async function getExistingCurrent(tableName, profileId) {
  const result = await dynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${profileId}`, sk: "CURRENT" },
    ConsistentRead: true,
  }));
  return result.Item;
}

export async function queryProfileItems(tableName, profileId) {
  const result = await dynamo.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "pk = :pk",
    ExpressionAttributeValues: { ":pk": `PROFILE#${profileId}` },
    ConsistentRead: true,
  }));
  return result.Items ?? [];
}

export async function deleteKeys(tableName, keys) {
  const unique = [...new Map(keys.map((key) => [`${key.pk}\u0000${key.sk}`, key])).values()];
  for (let index = 0; index < unique.length; index += 25) {
    const chunk = unique.slice(index, index + 25);
    await dynamo.send(new BatchWriteCommand({
      RequestItems: {
        [tableName]: chunk.map((Key) => ({ DeleteRequest: { Key } })),
      },
    }));
  }
  return unique.length;
}

export async function putManifest(path, manifest) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const outputPath = resolve(path);
  await mkdir(resolve(outputPath, ".."), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

export function defaultManifestPath(testRunId) {
  return resolve(TEST_FIXTURES_DIR, "runs", `${testRunId}_manifest.json`);
}

export async function scanTestMatches(tableName, testRunId) {
  const matches = await dynamo.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: "entityType = :type AND testRunId = :testRunId",
    ExpressionAttributeValues: { ":type": "MATCH", ":testRunId": testRunId },
  }));
  return matches.Items ?? [];
}

export async function writeItemsTransactionally(tableName, items) {
  for (let index = 0; index < items.length; index += 100) {
    const chunk = items.slice(index, index + 100);
    await dynamo.send(new TransactWriteCommand({
      TransactItems: chunk.map((Item) => ({
        Put: {
          TableName: tableName,
          Item,
          ConditionExpression: "attribute_not_exists(pk)",
        },
      })),
    }));
  }
}

export async function putRunManifestItem(tableName, manifest) {
  await dynamo.send(new PutCommand({
    TableName: tableName,
    Item: {
      pk: `TEST_RUN#${manifest.testRunId}`,
      sk: "META",
      entityType: "TEST_FIXTURE_RUN",
      ...manifest,
      cleanupSafe: true,
      createdAt: manifest.createdAt,
    },
    ConditionExpression: "attribute_not_exists(pk)",
  }));
}
