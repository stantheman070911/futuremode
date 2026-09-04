#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DEMO_PROFILES, REGION, TEST_RUN_ID, demoProfileId, outputs, sha256 } from "./lib.mjs";

const stack = await outputs();
const tableName = stack.ProfileTableName;
const site = String(stack.CloudWebsiteUrl).replace(/\/$/, "");
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
  marshallOptions: { removeUndefinedValues: true },
});
const ownerToken = randomBytes(32).toString("base64url");
const email = "api-smoke@demo.pitchyourowner.invalid";
const emailHash = sha256(email);
const profileId = demoProfileId(email);
const ownerSessionKey = { pk: `SESSION#${sha256(ownerToken)}`, sk: "META" };
let uploadKey;

async function api(path, token, options = {}) {
  const response = await fetch(`${site}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
  return { status: response.status, body };
}

async function queryKeys(pk) {
  const keys = [];
  let startKey;
  do {
    const page = await dynamo.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": pk },
      ProjectionExpression: "pk, sk",
      ExclusiveStartKey: startKey,
      ConsistentRead: true,
    }));
    keys.push(...(page.Items ?? []));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return keys;
}

async function cleanup() {
  const queried = await Promise.all([
    queryKeys(`PROFILE#${profileId}`),
    queryKeys(`IDEMPOTENCY#${emailHash}`),
  ]);
  const keys = [...queried.flat(), ownerSessionKey, ...(uploadKey ? [uploadKey] : [])];
  const unique = [...new Map(keys.map((key) => [`${key.pk}\u0000${key.sk}`, key])).values()];
  for (let index = 0; index < unique.length; index += 25) {
    await dynamo.send(new BatchWriteCommand({
      RequestItems: { [tableName]: unique.slice(index, index + 25).map((Key) => ({ DeleteRequest: { Key } })) },
    }));
  }
  return unique.length;
}

try {
  await dynamo.send(new PutCommand({
    TableName: tableName,
    Item: {
      ...ownerSessionKey,
      entityType: "CLOUD_SESSION",
      email,
      emailHash,
      expiresAt: Math.floor(Date.now() / 1_000) + 60 * 60,
      isTestProfile: true,
      cleanupSafe: true,
      testRunId: TEST_RUN_ID,
    },
  }));

  const uploadSession = await api("/v1/upload-sessions", ownerToken, { method: "POST", body: "{}" });
  if (uploadSession.status !== 201 || uploadSession.body.expires_in_seconds !== 86_400) {
    throw new Error(`upload session contract failed: ${JSON.stringify(uploadSession)}`);
  }
  uploadKey = { pk: `UPLOAD#${sha256(uploadSession.body.upload_token)}`, sk: "META" };

  const draft = await api("/v1/profile-drafts", uploadSession.body.upload_token, {
    method: "POST",
    body: JSON.stringify({ profile: DEMO_PROFILES[0].profile, locale: "en" }),
  });
  if (draft.status !== 201 || draft.body.status !== "draft") throw new Error(`draft upload failed: ${JSON.stringify(draft)}`);

  const replay = await api("/v1/profile-drafts", uploadSession.body.upload_token, {
    method: "POST",
    body: JSON.stringify({ profile: DEMO_PROFILES[0].profile, locale: "en" }),
  });
  if (replay.status !== 401) throw new Error(`single-use token replay returned ${replay.status}`);

  const draftRead = await api(`/v1/profile-drafts/${draft.body.draft_id}`, ownerToken);
  if (draftRead.status !== 200 || draftRead.body.source !== "computer_api") {
    throw new Error(`owner draft read failed: ${JSON.stringify(draftRead)}`);
  }

  const publish = await api("/v1/profile-versions", ownerToken, {
    method: "POST",
    headers: { "Idempotency-Key": `api-smoke-${Date.now()}` },
    body: JSON.stringify({
      schema: "pitchyourowner.profile-publish.v1",
      display_name: DEMO_PROFILES[0].displayName,
      profile: draftRead.body.profile,
      locale: "en",
      consent: { approvedAt: new Date().toISOString() },
    }),
  });
  if (publish.status !== 201 || publish.body.status !== "published") {
    throw new Error(`reviewed publish failed: ${JSON.stringify(publish)}`);
  }

  const profileRead = await api("/v1/profiles/me", ownerToken);
  if (profileRead.status !== 200 || profileRead.body.profile_id !== profileId) {
    throw new Error(`published profile read failed: ${JSON.stringify(profileRead)}`);
  }

  const profileDelete = await api("/v1/profiles/me", ownerToken, {
    method: "DELETE",
    body: JSON.stringify({ confirm: "DELETE" }),
  });
  if (profileDelete.status !== 200 || !profileDelete.body.deleted) {
    throw new Error(`profile cleanup endpoint failed: ${JSON.stringify(profileDelete)}`);
  }

  const removed = await cleanup();
  console.log(JSON.stringify({
    uploadSession: { status: uploadSession.status, expiresInSeconds: uploadSession.body.expires_in_seconds, capability: uploadSession.body.capability },
    draftUpload: { status: draft.status, draftStatus: draft.body.status },
    tokenReplay: { status: replay.status, rejected: replay.status === 401 },
    ownerDraftRead: { status: draftRead.status, source: draftRead.body.source },
    reviewedPublish: { status: publish.status, profileStatus: publish.body.status },
    publishedProfileRead: { status: profileRead.status },
    cleanup: { profileDeleteStatus: profileDelete.status, exactKeysRemoved: removed },
  }, null, 2));
} catch (error) {
  await cleanup();
  throw error;
}
