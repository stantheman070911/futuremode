import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { json, parseJsonBody } from "../shared/http.js";
import { sha256 } from "../shared/security.js";
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

function optionalContact(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") throw new Error("invalid contact");
  const contact = value.trim();
  if (!contact || contact.length > 320 || /[\r\n]/.test(contact)) throw new Error("invalid contact");
  return contact;
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
    const body = parseJsonBody(event.body) as { contact?: unknown; category?: unknown; message?: unknown };
    const unknown = Object.keys(body).filter((key) => !["contact", "category", "message"].includes(key));
    if (unknown.length) return json(400, { error: "unknown_support_field" });
    const contact = optionalContact(body.contact);
    const category = String(body.category ?? "other").trim().toLowerCase();
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
        contact,
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
      Message: [`Request: ${requestId}`, `Category: ${category}`, `Reply contact: ${contact || "not provided"}`, `Created: ${createdAt}`, "", message].join("\n"),
    }));
    return json(202, { requestId, retainedDays: 90 });
  } catch (error) {
    if (error instanceof SupportRateLimitError) return json(429, { error: "support_request_limited" }, { "retry-after": "86400" });
    const message = error instanceof Error ? error.message : "support request failed";
    if (/contact|body|message/.test(message)) return json(400, { error: "invalid_support_request" });
    console.error(JSON.stringify({ event: "support_request_failed", errorName: error instanceof Error ? error.name : "UnknownError", message }));
    throw error;
  }
}
