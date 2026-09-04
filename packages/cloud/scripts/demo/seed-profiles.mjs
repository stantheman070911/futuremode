#!/usr/bin/env node
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { DEMO_PROFILES, REGION, TEST_RUN_ID, demoProfileId, embed, matchingDocument, outputs, sha256 } from "./lib.mjs";

const stack = await outputs();
const tableName = stack.ProfileTableName;
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), { marshallOptions: { removeUndefinedValues: true } });
const now = new Date().toISOString();
const installed = [];

for (const demo of DEMO_PROFILES) {
  const profileId = demoProfileId(demo.email);
  const versionId = `demo-${sha256(`${TEST_RUN_ID}:${demo.id}:v1`).slice(0, 24)}`;
  const existing = (await dynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${profileId}`, sk: "CURRENT" }, ConsistentRead: true }))).Item;
  if (existing && (!existing.isTestProfile || existing.testRunId !== TEST_RUN_ID || !existing.cleanupSafe)) {
    throw new Error(`refusing to overwrite non-demo profile ${profileId}`);
  }
  const embedding = await embed(demo.profile);
  const emailHash = sha256(demo.email);
  const testMeta = { isTestProfile: true, cleanupSafe: true, testRunId: TEST_RUN_ID };
  await dynamo.send(new TransactWriteCommand({ TransactItems: [
    { Put: { TableName: tableName, Item: {
      pk: `PROFILE#${profileId}`, sk: `VERSION#${versionId}`, entityType: "PROFILE_VERSION",
      schema: "pitchyourowner.profile-publish.v1", profileId, versionId, emailHash,
      profile: demo.profile, displayName: demo.displayName, locale: "en",
      profileHeadline: demo.profile.summary, profileMarkdown: matchingDocument(demo.profile),
      skills: [...demo.profile.interests, ...demo.profile.recurring_topics].slice(0, 16),
      embedding, embedding_status: "READY", profile_scope: "ACTIVE", is_matchable: 1,
      createdAt: now, ...testMeta,
    } } },
    { Put: { TableName: tableName, Item: {
      pk: `PROFILE#${profileId}`, sk: "CURRENT", entityType: "PROFILE_CURRENT",
      profileId, versionId, email: demo.email, emailHash, displayName: demo.displayName,
      visibility: "matched-only", matchingState: "active", matchLanguages: ["en", "zh"],
      updatedAt: now, ...testMeta,
    } } },
  ] }));
  installed.push({ id: demo.id, profileId, displayName: demo.displayName });
}

console.log(JSON.stringify({ installed: true, testRunId: TEST_RUN_ID, tableName, profiles: installed }, null, 2));
