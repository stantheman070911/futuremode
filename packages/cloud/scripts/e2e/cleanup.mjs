#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
const path = resolve(String(process.env.PYO_E2E_ARTIFACT_FILE || ""));
if (!path || process.env.PYO_E2E_CONFIRM !== "cleanup-isolated-e2e") throw new Error("explicit E2E artifact and cleanup confirmation are required");
const artifact = JSON.parse(await readFile(path, "utf8")); assert.equal(artifact.tableName, "pitchyourowner-e2e-profile-store");
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION || "ap-southeast-1" }));
const items = []; let start;
do { const page = await dynamo.send(new ScanCommand({ TableName: artifact.tableName, FilterExpression: "testRunId = :run", ExpressionAttributeValues: { ":run": artifact.runId }, ExclusiveStartKey: start, ConsistentRead: true })); items.push(...(page.Items || [])); start = page.LastEvaluatedKey; } while (start);
if (items.some((item) => item.cleanupSafe !== true)) throw new Error("refusing cleanup: an item is not cleanupSafe");
for (let index = 0; index < items.length; index += 25) await dynamo.send(new BatchWriteCommand({ RequestItems: { [artifact.tableName]: items.slice(index, index + 25).map((item) => ({ DeleteRequest: { Key: { pk: item.pk, sk: item.sk } } })) } }));
const remaining = await dynamo.send(new ScanCommand({ TableName: artifact.tableName, FilterExpression: "testRunId = :run", ExpressionAttributeValues: { ":run": artifact.runId }, Select: "COUNT", ConsistentRead: true })); assert.equal(remaining.Count, 0); console.log(JSON.stringify({ cleaned: true, runId: artifact.runId, deleted: items.length }));
