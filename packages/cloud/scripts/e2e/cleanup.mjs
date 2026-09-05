#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
const path = resolve(String(process.env.PYO_E2E_ARTIFACT_FILE || ""));
if (!path || process.env.PYO_E2E_CONFIRM !== "cleanup-isolated-e2e") throw new Error("explicit E2E artifact and cleanup confirmation are required");
const artifact = JSON.parse(await readFile(path, "utf8")); assert.equal(artifact.tableName, "pitchyourowner-e2e-profile-store");
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-1" }));
const s3 = new S3Client({ region: process.env.AWS_REGION || "ap-southeast-1" });
const items = []; let start;
do { const page = await dynamo.send(new ScanCommand({ TableName: artifact.tableName, FilterExpression: "testRunId = :run", ExpressionAttributeValues: { ":run": artifact.runId }, ExclusiveStartKey: start, ConsistentRead: true })); items.push(...(page.Items || [])); start = page.LastEvaluatedKey; } while (start);
if (items.some((item) => item.cleanupSafe !== true)) throw new Error("refusing cleanup: an item is not cleanupSafe");
const publishActor = artifact.publishActor;
if (publishActor) {
  const sha256 = (value) => createHash("sha256").update(String(value)).digest("hex");
  assert.match(publishActor.email, /^publish-[a-f0-9]{12}@pitchyourowner\.invalid$/);
  assert.equal(publishActor.emailHash, sha256(publishActor.email));
  assert.equal(publishActor.profileId, sha256(`pitchyourowner-profile:${publishActor.emailHash}`).slice(0, 32));
  let publishStart;
  do {
    const page = await dynamo.send(new ScanCommand({ TableName: artifact.tableName, FilterExpression: "profileId = :profileId OR emailHash = :emailHash OR pk = :profilePk OR pk = :idempotencyPk", ExpressionAttributeValues: { ":profileId": publishActor.profileId, ":emailHash": publishActor.emailHash, ":profilePk": `PROFILE#${publishActor.profileId}`, ":idempotencyPk": `IDEMPOTENCY#${publishActor.emailHash}` }, ExclusiveStartKey: publishStart, ConsistentRead: true }));
    for (const item of page.Items || []) {
      const belongsToPublishActor = item.profileId === publishActor.profileId || item.emailHash === publishActor.emailHash || item.pk === `PROFILE#${publishActor.profileId}` || item.pk === `IDEMPOTENCY#${publishActor.emailHash}`;
      if (!belongsToPublishActor) throw new Error("refusing cleanup: unexpected publish actor record");
      items.push(item);
    }
    publishStart = page.LastEvaluatedKey;
  } while (publishStart);
}
const uniqueItems = [...new Map(items.map((item) => [`${item.pk}\u0000${item.sk}`, item])).values()];
for (let index = 0; index < uniqueItems.length; index += 25) await dynamo.send(new BatchWriteCommand({ RequestItems: { [artifact.tableName]: uniqueItems.slice(index, index + 25).map((item) => ({ DeleteRequest: { Key: { pk: item.pk, sk: item.sk } } })) } }));
if (artifact.profileImageBucketName) {
  assert.match(artifact.profileImageBucketName, /^pitchyourowner-e2e-profile-images-/);
  const prefix = `e2e/${artifact.runId}/`;
  let token;
  do {
    const listed = await s3.send(new ListObjectsV2Command({ Bucket: artifact.profileImageBucketName, Prefix: prefix, ContinuationToken: token }));
    const objects = (listed.Contents || []).flatMap((object) => object.Key ? [{ Key: object.Key }] : []);
    if (objects.length) await s3.send(new DeleteObjectsCommand({ Bucket: artifact.profileImageBucketName, Delete: { Objects: objects, Quiet: true } }));
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (token);
}
const remaining = await dynamo.send(new ScanCommand({ TableName: artifact.tableName, FilterExpression: "testRunId = :run", ExpressionAttributeValues: { ":run": artifact.runId }, Select: "COUNT", ConsistentRead: true })); assert.equal(remaining.Count, 0); console.log(JSON.stringify({ cleaned: true, runId: artifact.runId, deleted: items.length }));
