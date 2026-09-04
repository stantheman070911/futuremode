import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { DynamoDBStreamEvent } from "aws-lambda";
import { requiredEnvironment } from "../shared/storage.js";

const sqs = new SQSClient({});

export async function handler(event: DynamoDBStreamEvent): Promise<void> {
  for (const record of event.Records) {
    if (record.eventName !== "INSERT" || !record.dynamodb?.NewImage) continue;
    const item = unmarshall(record.dynamodb.NewImage as Parameters<typeof unmarshall>[0]);
    if (item.entityType !== "EMAIL_OUTBOX" || item.status !== "PENDING") continue;
    await sqs.send(new SendMessageCommand({
      QueueUrl: requiredEnvironment("OUTBOX_QUEUE_URL"),
      MessageBody: JSON.stringify({ eventId: item.eventId }),
    }));
  }
}
