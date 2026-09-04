import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { json, parseJsonBody } from "../shared/http.js";
import { normalizeEmail, sha256 } from "../shared/security.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

const sns = new SNSClient({});
const CATEGORIES = new Set(["login", "profile", "matching", "privacy", "delivery", "abuse", "security", "other"]);

class SupportRateLimitError extends Error {}

function cleanMessage(value: unknown): string {
  if (typeof value !== "string") throw new Error("invalid message");
  const message = value.trim();
  if (message.length < 20 || message.length > 5_000) throw new Error("invalid message");
  return message;
}

async function claimCapacity(tableName: string, sourceIp: string, now: number): Promise<void> {
  const day = new Date(now * 1_000).toISOString().slice(0, 10);
  try {
    await documentDynamo.send(new UpdateCommand({
      TableName: tableName,
      Key: { pk: `RATE#SUPPORT#${day}#${sha256(sourceIp)}`, sk: "META" },
      UpdateExpression: "SET expiresAt = :expiresAt, updatedAt = :updatedAt ADD #count :one",
      ConditionExpression: "attribute_not_exists(#count) OR #count < :limit",
      ExpressionAttributeNames: { "#count": "count" },
      ExpressionAttributeValues: { ":one": 1, ":limit": 5, ":expiresAt": now + 2 * 24 * 60 * 60, ":updatedAt": new Date(now * 1_000).toISOString() },
    }));
  } catch (error) {
    if (error instanceof Error && error.name === "ConditionalCheckFailedException") throw new SupportRateLimitError("support request limit reached");
    throw error;
  }
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const body = parseJsonBody(event.body) as { email?: unknown; category?: unknown; message?: unknown };
    const email = normalizeEmail(body.email);
    const category = String(body.category ?? "").trim().toLowerCase();
    if (!CATEGORIES.has(category)) return json(400, { error: "invalid_support_category" });
    const message = cleanMessage(body.message);
    const tableName = requiredEnvironment("TABLE_NAME");
    const now = Math.floor(Date.now() / 1_000);
    await claimCapacity(tableName, event.requestContext.http.sourceIp || "unknown", now);
    const requestId = `VM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const createdAt = new Date().toISOString();
    await documentDynamo.send(new PutCommand({
      TableName: tableName,
      Item: {
        pk: `SUPPORT#${requestId}`,
        sk: "META",
        entityType: "SUPPORT_REQUEST",
        requestId,
        email,
        emailHash: sha256(email),
        category,
        message,
        status: "OPEN",
        createdAt,
        expiresAt: now + 90 * 24 * 60 * 60,
      },
      ConditionExpression: "attribute_not_exists(pk)",
    }));
    await sns.send(new PublishCommand({
      TopicArn: requiredEnvironment("OPERATIONS_TOPIC_ARN"),
      Subject: `[PitchYourOwner Support] ${category} · ${requestId}`.slice(0, 100),
      Message: [`Request: ${requestId}`, `Category: ${category}`, `Reply email: ${email}`, `Created: ${createdAt}`, "", message].join("\n"),
    }));
    return json(202, { requestId, retainedDays: 90 });
  } catch (error) {
    if (error instanceof SupportRateLimitError) return json(429, { error: "support_request_limited" }, { "retry-after": "86400" });
    const message = error instanceof Error ? error.message : "support request failed";
    if (/email|body|message/.test(message)) return json(400, { error: "invalid_support_request" });
    console.error(JSON.stringify({ event: "support_request_failed", errorName: error instanceof Error ? error.name : "UnknownError", message }));
    throw error;
  }
}
