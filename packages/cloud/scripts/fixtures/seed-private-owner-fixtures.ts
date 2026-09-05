#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { embedText } from "../../lib/reusable/bedrock.js";
import { canonicalMatchingDocument, PROFILE_SCHEMA, validateOwnerPitchProfile } from "../../functions/shared/contracts.js";

const required = (name: string): string => {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};
const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");
const region = process.env.AWS_REGION || "ap-southeast-1";
const stackName = required("PYO_FIXTURE_STACK");
if (required("PYO_FIXTURE_CONFIRM") !== "seed-private-owner-fixtures") throw new Error("confirmation phrase is incorrect");
if (stackName !== "PitchYourOwner-hackathon") throw new Error("only the exact Hackathon stack is allowed");

const viewerEmailHash = sha256(required("PYO_FIXTURE_VIEWER_EMAIL").toLowerCase());
const fixtureSetId = "hackathon-private-owner-fixtures-v1";
const cfn = new CloudFormationClient({ region });
const described = await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
const stack = described.Stacks?.[0];
if (!stack?.Tags?.some((tag) => tag.Key === "Environment" && tag.Value === "hackathon")) throw new Error("target stack is not tagged as hackathon");
const outputs = Object.fromEntries((stack.Outputs || []).map((item) => [item.OutputKey, item.OutputValue]));
const tableName = String(outputs.ProfileTableName || "");
if (tableName !== "pitchyourowner-hackathon-profile-store") throw new Error(`unexpected table: ${tableName}`);

const rawProfiles = JSON.parse(await readFile(new URL("./private-owner-profiles.json", import.meta.url), "utf8")) as Array<{ key: string; profile: unknown }>;
const profiles = rawProfiles.map(({ key, profile }) => ({ key, profile: validateOwnerPitchProfile(profile) }));
if (profiles.length !== 3 || new Set(profiles.map(({ key }) => key)).size !== 3) throw new Error("expected three unique fixtures");
const invitationEmails = new Map([
  ["public-finance-analyst", required("PYO_E2E_EMAIL_B").toLowerCase()],
  ["documentary-filmmaker-cinematographer", required("PYO_E2E_EMAIL_C").toLowerCase()],
]);
for (const email of invitationEmails.values()) {
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.endsWith(".invalid")) throw new Error("controlled fixture email is invalid");
}

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } });
const embed = (text: string) => embedText({ text, modelId: "global.cohere.embed-v4:0", dimensions: 1_024 });
const installed: Array<{ key: string; profileId: string; animalPersona: string }> = [];

for (const { key, profile } of profiles) {
  const profileId = sha256(`pitchyourowner-private-fixture:${viewerEmailHash}:${key}`).slice(0, 32);
  const versionId = `fixture-${sha256(JSON.stringify(profile)).slice(0, 24)}`;
  const currentKey = { pk: `PROFILE#${profileId}`, sk: "CURRENT" };
  const existing = (await dynamo.send(new GetCommand({ TableName: tableName, Key: currentKey, ConsistentRead: true }))).Item;
  if (existing && (existing.isFixtureProfile !== true || existing.fixtureAudienceEmailHash !== viewerEmailHash || existing.fixtureSetId !== fixtureSetId)) {
    throw new Error(`refusing to overwrite non-owned profile ${profileId}`);
  }
  const fieldTexts: Record<string, string> = {
    interests: profile.interests.join("\n"),
    active_problems: profile.active_problems.join("\n"),
    motivations: profile.motivations.join("\n"),
    recurring_topics: profile.recurring_topics.join("\n"),
    friend_intent: profile.friend_intent,
  };
  const [embedding, fieldPairs] = await Promise.all([
    embed(canonicalMatchingDocument(profile)),
    Promise.all(Object.entries(fieldTexts).map(async ([field, text]) => [field, await embed(text)] as const)),
  ]);
  const now = new Date().toISOString();
  const controlledEmail = invitationEmails.get(key);
  const email = controlledEmail ?? `${key}@fixture.pitchyourowner.invalid`;
  const fixtureMeta = { isFixtureProfile: true, fixtureAudienceEmailHash: viewerEmailHash, fixtureSetId, fixtureInvitationEnabled: Boolean(controlledEmail), cleanupSafe: true };
  await dynamo.send(new TransactWriteCommand({ TransactItems: [
    { Put: { TableName: tableName, Item: {
      pk: `PROFILE#${profileId}`, sk: `VERSION#${versionId}`, entityType: "PROFILE_VERSION", schema: PROFILE_SCHEMA,
      profileId, versionId, emailHash: sha256(email), displayName: profile.animal_persona, profile, locale: "zh-Hant",
      embedding, fieldEmbeddings: Object.fromEntries(fieldPairs), embedding_status: "READY", profile_scope: "ACTIVE", is_matchable: 1,
      createdAt: now, ...fixtureMeta,
    } } },
    { Put: { TableName: tableName, Item: {
      ...currentKey, entityType: "PROFILE_CURRENT", profileId, versionId, email, emailHash: sha256(email), displayName: profile.animal_persona,
      visibility: "matched-only", matchingState: "active", matchLanguages: ["zh"], updatedAt: now, ...fixtureMeta,
    } } },
  ] }));
  installed.push({ key, profileId, animalPersona: profile.animal_persona });
}

console.log(JSON.stringify({ installed: true, tableName, fixtureSetId, audienceHashPrefix: viewerEmailHash.slice(0, 12), profiles: installed }, null, 2));
