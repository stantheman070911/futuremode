import { GetCommand, PutCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { json, parseJsonBody } from "../shared/http.js";
import { normalizeEmail, randomOpaqueToken, sha256 } from "../shared/security.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const challengeId = event.pathParameters?.challengeId;
    if (!challengeId) return json(400, { error: "challenge_id_required" });
    const body = parseJsonBody(event.body) as { email?: unknown; code?: unknown };
    const email = normalizeEmail(body.email);
    if (typeof body.code !== "string" || !/^\d{6}$/.test(body.code)) return json(400, { error: "invalid_code" });
    const emailHash = sha256(email);
    const tableName = requiredEnvironment("TABLE_NAME");
    const key = { pk: `EMAIL#${emailHash}`, sk: `CHALLENGE#${challengeId}` };
    const challenge = await documentDynamo.send(new GetCommand({ TableName: tableName, Key: key, ConsistentRead: true }));
    const item = challenge.Item;
    const now = Math.floor(Date.now() / 1_000);
    const valid = item
      && item.expiresAt > now
      && item.attempts < 5
      && item.codeHash === sha256(`${challengeId}:${body.code}`);
    if (!valid) {
      if (item && item.expiresAt > now && item.attempts < 5) {
        await documentDynamo.send(new PutCommand({
          TableName: tableName,
          Item: { ...item, attempts: item.attempts + 1 },
          ConditionExpression: "codeHash = :codeHash AND attempts = :attempts",
          ExpressionAttributeValues: { ":codeHash": item.codeHash, ":attempts": item.attempts },
        }));
      }
      return json(400, { error: "invalid_or_expired_code" });
    }
    const accessToken = randomOpaqueToken();
    const tokenHash = sha256(accessToken);
    const expiresAt = now + 30 * 24 * 60 * 60;
    await documentDynamo.send(new TransactWriteCommand({
      TransactItems: [
        {
          Delete: {
            TableName: tableName,
            Key: key,
            ConditionExpression: "codeHash = :codeHash AND attempts < :max",
            ExpressionAttributeValues: { ":codeHash": item.codeHash, ":max": 5 },
          },
        },
        {
          Put: {
            TableName: tableName,
            Item: {
              pk: `SESSION#${tokenHash}`,
              sk: "META",
              entityType: "CLOUD_SESSION",
              email,
              emailHash,
              createdAt: new Date().toISOString(),
              expiresAt,
            },
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
        {
          Put: {
            TableName: tableName,
            Item: {
              pk: `EMAIL#${emailHash}`,
              sk: `SESSION#${tokenHash}`,
              entityType: "EMAIL_SESSION_POINTER",
              sessionPk: `SESSION#${tokenHash}`,
              createdAt: new Date().toISOString(),
              expiresAt,
            },
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
      ],
    }));
    return json(200, { accessToken, expiresInSeconds: 30 * 24 * 60 * 60 });
  } catch {
    return json(503, { error: "verification_confirmation_failed" });
  }
}
