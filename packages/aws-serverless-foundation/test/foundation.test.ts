import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { decodeFloatEmbedding, parseJsonObject } from "../src/bedrock.js";
import { contentFingerprint, normalizeEmail, randomOpaqueToken, stableStringify } from "../src/core.js";
import { createProtectedSingleTable, createReliableQueue } from "../src/infrastructure.js";
import { DynamoSessionStore } from "../src/session-store.js";
import { objectRecord, rejectUnknownKeys, requiredString, stringArray } from "../src/validation.js";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = resolve(packageDir, "src");

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = resolve(directory, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  }));
  return nested.flat();
}

test("provides deterministic neutral fingerprints", () => {
  assert.equal(stableStringify({ beta: 2, alpha: 1 }), '{"alpha":1,"beta":2}');
  assert.equal(contentFingerprint({ beta: 2, alpha: 1 }), contentFingerprint({ alpha: 1, beta: 2 }));
  assert.equal(normalizeEmail("  PERSON@Example.COM "), "person@example.com");
  assert.match(randomOpaqueToken(), /^[A-Za-z0-9_-]{40,}$/);
});

test("provides strict validation primitives", () => {
  const value = objectRecord({ title: " Example ", tags: ["One", "Two"] });
  rejectUnknownKeys(value, ["title", "tags"]);
  assert.equal(requiredString(value.title, { maxLength: 20 }), "Example");
  assert.deepEqual(stringArray(value.tags, { maxItems: 3, itemMaxLength: 10 }), ["One", "Two"]);
  assert.throws(() => rejectUnknownKeys({ unexpected: true }, ["expected"]), /unknown fields/);
  assert.throws(() => stringArray(["Same", "same"], { maxItems: 3, itemMaxLength: 10 }), /duplicate/);
});

test("decodes supported embedding responses and extracts JSON objects", () => {
  const body = new TextEncoder().encode(JSON.stringify({ embeddings: { float: [[0.1, 0.2, 0.3]] } }));
  assert.deepEqual(decodeFloatEmbedding(body, 3), [0.1, 0.2, 0.3]);
  assert.throws(() => decodeFloatEmbedding(body, 2), /2 finite numbers/);
  assert.deepEqual(parseJsonObject("```json\n{\"result\":true}\n```"), { result: true });
  assert.deepEqual(parseJsonObject("Result: {\"result\":true}"), { result: true });
  assert.throws(() => parseJsonObject("[]"), /JSON object/);
});

test("loads configurable expiring sessions", async () => {
  let commandInput: unknown;
  const client = {
    send: async (command: { input: unknown }) => {
      commandInput = command.input;
      return { Item: { expiresAt: 2_000, subject: "subject-1" } };
    },
  } as unknown as DynamoDBDocumentClient;
  const store = new DynamoSessionStore<{ expiresAt: number; subject: string }>({
    client,
    tableName: "test-table",
    partitionPrefix: "AUTH#",
    nowInSeconds: () => 1_000,
  });
  const session = await store.load("secret");
  assert.equal(session.subject, "subject-1");
  assert.equal((commandInput as { TableName?: string }).TableName, "test-table");
  assert.equal((commandInput as { ConsistentRead?: boolean }).ConsistentRead, true);
});

test("creates protected storage and a reliable queue pair", () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "FoundationTest");
  createProtectedSingleTable(stack, "Store", { tableName: "generic-test-store" });
  createReliableQueue(stack, "WorkQueue", { queueName: "generic-work" });
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::DynamoDB::Table", {
    TableName: "generic-test-store",
    BillingMode: "PAY_PER_REQUEST",
    DeletionProtectionEnabled: true,
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
  });
  template.resourceCountIs("AWS::SQS::Queue", 2);
});

test("keeps the source boundary free of fixed routes and external URLs", async () => {
  const files = (await filesBelow(sourceDir)).filter((path) => path.endsWith(".ts"));
  const prohibited = [
    /\/v\d+\//i,
    /https?:\/\/[a-z0-9]/i,
  ];
  const violations: string[] = [];
  for (const path of files) {
    const source = await readFile(path, "utf8");
    for (const pattern of prohibited) {
      const match = source.match(pattern);
      if (match) violations.push(`${path.replace(`${sourceDir}/`, "")}: ${match[0]}`);
    }
  }
  assert.deepEqual(violations, []);
});
