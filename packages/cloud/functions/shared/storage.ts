import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const rawDynamo = new DynamoDBClient({});
export const documentDynamo = DynamoDBDocumentClient.from(rawDynamo, {
  marshallOptions: { removeUndefinedValues: true },
});

export function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`missing environment variable ${name}`);
  return value;
}
