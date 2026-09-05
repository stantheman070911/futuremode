import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { SQSEvent } from "aws-lambda";
import { sendEmail } from "../shared/email.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

export async function handler(event: SQSEvent): Promise<void> {
  for (const record of event.Records) {
    const message = JSON.parse(record.body) as { eventId?: string };
    if (!message.eventId) continue;
    const key = { pk: `OUTBOX#${message.eventId}`, sk: "META" };
    const outbox = await documentDynamo.send(new GetCommand({
      TableName: requiredEnvironment("TABLE_NAME"),
      Key: key,
      ConsistentRead: true,
    }));
    const item = outbox.Item;
    if (!item) continue;
    if (item.status === "SENT" || item.status === "SENDING") continue;
    const tableName = requiredEnvironment("TABLE_NAME");
    if (String(item.to ?? "").trim().toLowerCase().endsWith(".test")) {
      await documentDynamo.send(new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: "SET #status = :captured, capturedAt = :now",
        ConditionExpression: "#status = :pending",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":captured": "CAPTURED", ":pending": "PENDING", ":now": new Date().toISOString() },
      })).catch(() => undefined);
      continue;
    }
    const claimedAt = new Date().toISOString();
    try {
      await documentDynamo.send(new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: "SET #status = :sending, claimedAt = :now ADD attempts :one",
        ConditionExpression: "#status = :pending",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":sending": "SENDING", ":pending": "PENDING", ":now": claimedAt, ":one": 1 },
      }));
    } catch (error) {
      if (error instanceof Error && error.name === "ConditionalCheckFailedException") continue;
      throw error;
    }
    let providerMessageId: string;
    try {
      providerMessageId = await sendEmail({
        to: String(item.to),
        subject: String(item.subject),
        text: String(item.text),
        html: typeof item.html === "string" ? item.html : undefined,
      });
    } catch (error) {
      await documentDynamo.send(new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: "SET #status = :pending, lastErrorAt = :now REMOVE claimedAt",
        ConditionExpression: "#status = :sending AND claimedAt = :claimedAt",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":pending": "PENDING", ":sending": "SENDING", ":now": new Date().toISOString(), ":claimedAt": claimedAt },
      })).catch(() => undefined);
      throw error;
    }
    // Deliberately do not reset SENDING if this durable finalization fails: a
    // queue retry will observe the claim and must not send the provider email twice.
    await documentDynamo.send(new UpdateCommand({
      TableName: tableName,
      Key: key,
      UpdateExpression: "SET #status = :sent, sentAt = :now, providerMessageId = :providerId REMOVE claimedAt",
      ConditionExpression: "#status = :sending AND claimedAt = :claimedAt",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":sent": "SENT", ":sending": "SENDING", ":now": new Date().toISOString(), ":providerId": providerMessageId, ":claimedAt": claimedAt },
    }));
  }
}
