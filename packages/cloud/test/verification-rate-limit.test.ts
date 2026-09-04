import assert from "node:assert/strict";
import test from "node:test";
import { GetCommand, QueryCommand, TransactWriteCommand, type DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  claimVerificationCapacity,
  VerificationRateLimitError,
  verificationRateLimitsFromEnvironment,
  verificationSourceHash,
} from "../functions/verification-request/rate-limit.js";

class FakeDocumentClient {
  cooldownExpiresAt = 0;
  emailTokens: Array<{ sk: string }> = [];
  ipTokens: Array<{ sk: string }> = [];
  transaction?: TransactWriteCommand;

  async send(command: GetCommand | QueryCommand | TransactWriteCommand): Promise<Record<string, unknown>> {
    if (command instanceof GetCommand) {
      return this.cooldownExpiresAt ? { Item: { expiresAt: this.cooldownExpiresAt } } : {};
    }
    if (command instanceof QueryCommand) {
      const pk = String(command.input.ExpressionAttributeValues?.[":pk"] ?? "");
      return { Items: pk.startsWith("RATE#EMAIL#") ? this.emailTokens : this.ipTokens };
    }
    this.transaction = command;
    return {};
  }
}

const limits = { cooldownSeconds: 60, emailHourlyLimit: 5, ipHourlyLimit: 20 };
const challengeItem = { pk: "EMAIL#email-hash", sk: "CHALLENGE#challenge-id", expiresAt: 1_700_000_600 };

test("builds atomic email, hashed-IP, cooldown, and challenge reservations", async () => {
  const fake = new FakeDocumentClient();
  await claimVerificationCapacity({
    client: fake as unknown as DynamoDBDocumentClient,
    tableName: "profiles",
    emailHash: "email-hash",
    sourceIp: "203.0.113.42",
    challengeItem,
    now: 1_700_000_000,
    limits,
  });
  const transaction = fake.transaction?.input.TransactItems;
  assert.equal(transaction?.length, 4);
  const serialized = JSON.stringify(transaction);
  assert.doesNotMatch(serialized, /203\.0\.113\.42/);
  assert.match(serialized, new RegExp(verificationSourceHash("203.0.113.42")));
  assert.match(serialized, /VERIFICATION_COOLDOWN/);
  assert.match(serialized, /CHALLENGE#challenge-id/);
});

test("rejects an email still inside its exact cooldown", async () => {
  const fake = new FakeDocumentClient();
  fake.cooldownExpiresAt = 1_700_000_045;
  await assert.rejects(
    () => claimVerificationCapacity({
      client: fake as unknown as DynamoDBDocumentClient,
      tableName: "profiles",
      emailHash: "email-hash",
      sourceIp: "203.0.113.42",
      challengeItem,
      now: 1_700_000_000,
      limits,
    }),
    (error) => error instanceof VerificationRateLimitError && error.retryAfterSeconds === 45,
  );
});

test("rejects an email after all hourly tokens are consumed", async () => {
  const fake = new FakeDocumentClient();
  const bucket = Math.floor(1_700_000_000 / 3_600);
  fake.emailTokens = Array.from({ length: 5 }, (_, index) => ({ sk: `HOUR#${bucket}#TOKEN#${String(index + 1).padStart(4, "0")}` }));
  await assert.rejects(
    () => claimVerificationCapacity({
      client: fake as unknown as DynamoDBDocumentClient,
      tableName: "profiles",
      emailHash: "email-hash",
      sourceIp: "203.0.113.42",
      challengeItem,
      now: 1_700_000_000,
      limits,
    }),
    VerificationRateLimitError,
  );
  assert.equal(fake.transaction, undefined);
});

test("loads bounded defaults and rejects unsafe environment values", () => {
  assert.deepEqual(verificationRateLimitsFromEnvironment({}), limits);
  assert.throws(() => verificationRateLimitsFromEnvironment({ VERIFICATION_EMAIL_HOURLY_LIMIT: "0" }), /whole number/);
  assert.throws(() => verificationRateLimitsFromEnvironment({ VERIFICATION_IP_HOURLY_LIMIT: "unlimited" }), /whole number/);
});
