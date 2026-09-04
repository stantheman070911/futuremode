import { DynamoDBClient, type DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, type TranslateConfig } from "@aws-sdk/lib-dynamodb";

export function requiredEnvironment(name: string, source: NodeJS.ProcessEnv = process.env): string {
  const value = source[name];
  if (!value) throw new Error(`missing environment variable ${name}`);
  return value;
}

export function createDynamoClients(options: {
  clientConfig?: DynamoDBClientConfig;
  translateConfig?: TranslateConfig;
} = {}): { raw: DynamoDBClient; document: DynamoDBDocumentClient } {
  const raw = new DynamoDBClient(options.clientConfig ?? {});
  const document = DynamoDBDocumentClient.from(raw, options.translateConfig ?? {
    marshallOptions: { removeUndefinedValues: true },
  });
  return { raw, document };
}
