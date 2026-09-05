#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";

const site = String(process.env.PYO_SITE_URL || "").replace(/\/$/, "");
const email = String(process.env.PYO_MANUAL_TEST_ACCOUNT || "").trim().toLowerCase();
const apply = process.argv.includes("--apply");
if (site !== "https://d1vuzznd4gxltu.cloudfront.net") throw new Error("exact Hackathon site URL is required");
if (!/^test10\d{2}@futuremode\.test$/.test(email)) throw new Error("an exact allowlisted synthetic email is required");
if (process.env.PYO_MANUAL_TEST_CONFIRM !== `reset:${email}`) throw new Error("exact reset confirmation is required");

const region = "ap-southeast-1";
const tableName = "pitchyourowner-hackathon-profile-store";
const bucketName = "pitchyourowner-hackathon-profile-images-448049822315";
const sha256 = (value) => createHash("sha256").update(String(value)).digest("hex");
const emailHash = sha256(email);
const profileId = sha256(`pitchyourowner-profile:${emailHash}`).slice(0, 32);
const configuration = JSON.parse(await readFile(resolve(import.meta.dirname, "../../../../.secrets/manual-test-accounts.json"), "utf8"));
assert.equal(configuration.enabled, true);
assert.equal(configuration.cohortId, "hackathon-manual-20260905");
assert.ok(configuration.accounts[email]);

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } });
const s3 = new S3Client({ region });

async function fetchJson(path, options = {}) {
  const response = await fetch(`${site}${path}`, options);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function authenticate() {
  const requested = await fetchJson("/v1/email-verifications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
  assert.equal(requested.response.status, 202);
  assert.equal(requested.body.manualTestAccount, true);
  const confirmed = await fetchJson(`/v1/email-verifications/${encodeURIComponent(requested.body.challengeId)}/confirm`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, code: configuration.verificationCode }) });
  assert.equal(confirmed.response.status, 200);
  assert.equal(confirmed.body.manualTestAccount, true);
  return confirmed.body.accessToken;
}

async function scanManualCohort() {
  const items = [];
  let start;
  do {
    const page = await dynamo.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: "testCohortId = :cohort AND cleanupSafe = :yes",
      ExpressionAttributeValues: { ":cohort": configuration.cohortId, ":yes": true },
      ExclusiveStartKey: start,
      ConsistentRead: true,
    }));
    items.push(...(page.Items || []));
    start = page.LastEvaluatedKey;
  } while (start);
  return items;
}

function containsExact(value, targets) {
  if (typeof value === "string") return targets.has(value);
  if (Array.isArray(value)) return value.some((entry) => containsExact(entry, targets));
  if (value && typeof value === "object") return Object.values(value).some((entry) => containsExact(entry, targets));
  return false;
}

const current = (await dynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${profileId}`, sk: "CURRENT" }, ConsistentRead: true }))).Item;
if (current) assert.equal(current.isManualTestProfile === true && current.cleanupSafe === true && current.testCohortId === configuration.cohortId, true, "refusing to reset a non-manual profile");
const publicSlug = typeof current?.publicSlug === "string" ? current.publicSlug : undefined;
const cohort = await scanManualCohort();
const directTargets = new Set([profileId, email, emailHash, ...(publicSlug ? [publicSlug] : [])]);
const directlyRelated = cohort.filter((item) => containsExact(item, directTargets));
const pairIds = new Set(directlyRelated.flatMap((item) => typeof item.pairId === "string" ? [item.pairId] : []));
const related = [...new Map(cohort.filter((item) => containsExact(item, new Set([...directTargets, ...pairIds]))).map((item) => [`${item.pk}\u0000${item.sk}`, item])).values()];

const objectKeys = [];
let continuation;
do {
  const page = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: `profiles/${profileId}/`, ContinuationToken: continuation }));
  objectKeys.push(...(page.Contents || []).flatMap((object) => object.Key ? [object.Key] : []));
  continuation = page.IsTruncated ? page.NextContinuationToken : undefined;
} while (continuation);

const plan = { account: email, profileId, profilePresent: Boolean(current), cohortRecords: related.length, pairRecords: pairIds.size, imageObjects: objectKeys.length, apply };
if (!apply) {
  console.log(JSON.stringify(plan, null, 2));
  process.exit(0);
}

if (current) {
  const token = await authenticate();
  const deleted = await fetchJson("/v1/profiles/me", { method: "DELETE", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ confirm: "DELETE" }) });
  assert.equal(deleted.response.status, 200);
  assert.equal(deleted.body.profile_id, profileId);
}

for (let index = 0; index < related.length; index += 25) {
  await dynamo.send(new BatchWriteCommand({ RequestItems: { [tableName]: related.slice(index, index + 25).map((item) => ({ DeleteRequest: { Key: { pk: item.pk, sk: item.sk } } })) } }));
}
for (let index = 0; index < objectKeys.length; index += 1000) {
  await s3.send(new DeleteObjectsCommand({ Bucket: bucketName, Delete: { Objects: objectKeys.slice(index, index + 1000).map((Key) => ({ Key })), Quiet: true } }));
}

const afterCurrent = await dynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${profileId}`, sk: "CURRENT" }, ConsistentRead: true }));
assert.equal(afterCurrent.Item, undefined);
const afterCohort = await scanManualCohort();
assert.equal(afterCohort.filter((item) => containsExact(item, new Set([...directTargets, ...pairIds]))).length, 0);
const afterObjects = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, Prefix: `profiles/${profileId}/`, MaxKeys: 1 }));
assert.equal(afterObjects.KeyCount, 0);
console.log(JSON.stringify({ ...plan, reset: true, remainingRelatedCohortRecords: 0, remainingImageObjects: 0 }, null, 2));
