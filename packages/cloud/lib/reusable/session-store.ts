import { GetCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { bearerToken } from "./http.js";
import { sha256 } from "./core.js";

export interface ExpiringSession {
  expiresAt: number;
}

export class DynamoSessionStore<TSession extends ExpiringSession> {
  constructor(private readonly options: {
    client: DynamoDBDocumentClient;
    tableName: string;
    partitionKeyName?: string;
    sortKeyName?: string;
    partitionPrefix?: string;
    sortKeyValue?: string;
    nowInSeconds?: () => number;
  }) {}

  async loadFromAuthorization(authorization: string | undefined): Promise<TSession> {
    return this.load(bearerToken(authorization));
  }

  async load(token: string): Promise<TSession> {
    const prefix = this.options.partitionPrefix ?? "SESSION#";
    const partitionKeyName = this.options.partitionKeyName ?? "pk";
    const sortKeyName = this.options.sortKeyName ?? "sk";
    const result = await this.options.client.send(new GetCommand({
      TableName: this.options.tableName,
      Key: {
        [partitionKeyName]: `${prefix}${sha256(token)}`,
        [sortKeyName]: this.options.sortKeyValue ?? "META",
      },
      ConsistentRead: true,
    }));
    const session = result.Item as TSession | undefined;
    const now = this.options.nowInSeconds?.() ?? Math.floor(Date.now() / 1_000);
    if (!session || !Number.isFinite(session.expiresAt) || session.expiresAt < now) throw new Error("invalid session");
    return session;
  }
}
