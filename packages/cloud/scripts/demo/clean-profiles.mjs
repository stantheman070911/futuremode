#!/usr/bin/env node
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { BatchWriteCommand, DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { REGION, TEST_RUN_ID, outputs } from "./lib.mjs";

const stack = await outputs();
const tableName = stack.ProfileTableName;
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), { marshallOptions: { removeUndefinedValues: true } });
const found = [];
let startKey;
do {
  const page = await dynamo.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: "isTestProfile = :yes AND cleanupSafe = :yes AND testRunId = :run",
    ExpressionAttributeValues: { ":yes": true, ":run": TEST_RUN_ID },
    ProjectionExpression: "pk, sk",
    ExclusiveStartKey: startKey,
  }));
  found.push(...(page.Items ?? []));
  startKey = page.LastEvaluatedKey;
} while (startKey);

for (let index = 0; index < found.length; index += 25) {
  await dynamo.send(new BatchWriteCommand({ RequestItems: { [tableName]: found.slice(index, index + 25).map((Key) => ({ DeleteRequest: { Key } })) } }));
}
console.log(JSON.stringify({ cleaned: true, testRunId: TEST_RUN_ID, deletedItems: found.length }, null, 2));
