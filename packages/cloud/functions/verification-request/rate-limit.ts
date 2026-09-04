import { GetCommand, QueryCommand, TransactWriteCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { sha256 } from "../shared/security.js";

export interface VerificationRateLimits {
  cooldownSeconds: number;
  emailHourlyLimit: number;
  ipHourlyLimit: number;
}

export interface VerificationChallengeItem {
  pk: string;
  sk: string;
  [key: string]: unknown;
}

export class VerificationRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("verification request is temporarily limited");
    this.name = "VerificationRateLimitError";
    this.retryAfterSeconds = Math.max(1, Math.ceil(retryAfterSeconds));
  }
}

function boundedInteger(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`verification rate limit must be a whole number from ${minimum} to ${maximum}`);
  }
  return parsed;
}

export function verificationRateLimitsFromEnvironment(environment: NodeJS.ProcessEnv = process.env): VerificationRateLimits {
  return {
    cooldownSeconds: boundedInteger(environment.VERIFICATION_COOLDOWN_SECONDS, 60, 1, 3_600),
    emailHourlyLimit: boundedInteger(environment.VERIFICATION_EMAIL_HOURLY_LIMIT, 5, 1, 100),
    ipHourlyLimit: boundedInteger(environment.VERIFICATION_IP_HOURLY_LIMIT, 20, 1, 1_000),
  };
}

export function verificationSourceHash(sourceIp: string): string {
  return sha256(`pitchyourowner:verification-source:v1:${sourceIp || "unknown"}`);
}

function tokenPrefix(hourBucket: number): string {
  return `HOUR#${hourBucket}#TOKEN#`;
}

function tokenKey(prefix: string, token: number): string {
  return `${prefix}${String(token).padStart(4, "0")}`;
}

function firstFreeToken(items: Array<{ sk?: unknown }>, prefix: string, limit: number): number | undefined {
  const used = new Set(items.map((item) => item.sk).filter((value): value is string => typeof value === "string"));
  for (let token = 1; token <= limit; token += 1) {
    if (!used.has(tokenKey(prefix, token))) return token;
  }
  return undefined;
}

async function currentTokens(client: DynamoDBDocumentClient, tableName: string, pk: string, prefix: string): Promise<Array<{ sk?: unknown }>> {
  const result = await client.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
    ExpressionAttributeValues: { ":pk": pk, ":prefix": prefix },
    ProjectionExpression: "sk",
    ConsistentRead: true,
  }));
  return result.Items ?? [];
}

export interface ClaimVerificationCapacityInput {
  client: DynamoDBDocumentClient;
  tableName: string;
  emailHash: string;
  sourceIp: string;
  challengeItem: VerificationChallengeItem;
  now: number;
  limits: VerificationRateLimits;
}

export async function claimVerificationCapacity(input: ClaimVerificationCapacityInput): Promise<void> {
  const { client, tableName, emailHash, sourceIp, challengeItem, now, limits } = input;
  const emailPk = `RATE#EMAIL#${emailHash}`;
  const ipPk = `RATE#IP#${verificationSourceHash(sourceIp)}`;
  const cooldownKey = { pk: emailPk, sk: "COOLDOWN" };
  const hourBucket = Math.floor(now / 3_600);
  const nextHour = (hourBucket + 1) * 3_600;
  const hourlyExpiry = nextHour + 3_600;
  const prefix = tokenPrefix(hourBucket);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const cooldown = await client.send(new GetCommand({ TableName: tableName, Key: cooldownKey, ConsistentRead: true }));
    const cooldownExpiry = Number(cooldown.Item?.expiresAt ?? 0);
    if (cooldownExpiry > now) throw new VerificationRateLimitError(cooldownExpiry - now);

    const [emailTokens, ipTokens] = await Promise.all([
      currentTokens(client, tableName, emailPk, prefix),
      currentTokens(client, tableName, ipPk, prefix),
    ]);
    const emailToken = firstFreeToken(emailTokens, prefix, limits.emailHourlyLimit);
    const ipToken = firstFreeToken(ipTokens, prefix, limits.ipHourlyLimit);
    if (emailToken === undefined || ipToken === undefined) throw new VerificationRateLimitError(nextHour - now);

    try {
      await client.send(new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName,
              Item: {
                pk: emailPk,
                sk: tokenKey(prefix, emailToken),
                entityType: "VERIFICATION_RATE_TOKEN",
                scope: "EMAIL",
                createdAt: new Date(now * 1_000).toISOString(),
                expiresAt: hourlyExpiry,
              },
              ConditionExpression: "attribute_not_exists(pk)",
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: {
                pk: ipPk,
                sk: tokenKey(prefix, ipToken),
                entityType: "VERIFICATION_RATE_TOKEN",
                scope: "IP_HASH",
                createdAt: new Date(now * 1_000).toISOString(),
                expiresAt: hourlyExpiry,
              },
              ConditionExpression: "attribute_not_exists(pk)",
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: {
                ...cooldownKey,
                entityType: "VERIFICATION_COOLDOWN",
                createdAt: new Date(now * 1_000).toISOString(),
                expiresAt: now + limits.cooldownSeconds,
              },
              ConditionExpression: "attribute_not_exists(pk) OR expiresAt <= :now",
              ExpressionAttributeValues: { ":now": now },
            },
          },
          {
            Put: {
              TableName: tableName,
              Item: challengeItem,
              ConditionExpression: "attribute_not_exists(pk)",
            },
          },
        ],
      }));
      return;
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "TransactionCanceledException") throw error;
    }
  }

  throw new VerificationRateLimitError(limits.cooldownSeconds);
}
