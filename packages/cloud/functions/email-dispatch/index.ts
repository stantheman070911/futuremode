import { DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
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
    await sendEmail({
      to: String(item.to),
      subject: String(item.subject),
      text: String(item.text),
      html: typeof item.html === "string" ? item.html : undefined,
    });
    await documentDynamo.send(new DeleteCommand({
      TableName: requiredEnvironment("TABLE_NAME"),
      Key: key,
    }));
  }
}
