import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import type { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { decodeFloatEmbedding, judgeJson, parseJsonObject } from "../lib/reusable/bedrock.js";
import { contentFingerprint, normalizeEmail, randomOpaqueToken, randomPublicSlug, stableStringify } from "../lib/reusable/core.js";
import { createProtectedSingleTable } from "../lib/reusable/infrastructure.js";
import { DynamoSessionStore } from "../lib/reusable/session-store.js";
import { objectRecord, rejectUnknownKeys, requiredString, stringArray } from "../lib/reusable/validation.js";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const reusableDir = resolve(packageDir, "lib", "reusable");

async function filesBelow(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = resolve(directory, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  }));
  return nested.flat();
}

test("provides deterministic project-neutral fingerprints", () => {
  assert.equal(stableStringify({ beta: 2, alpha: 1 }), '{"alpha":1,"beta":2}');
  assert.equal(contentFingerprint({ beta: 2, alpha: 1 }), contentFingerprint({ alpha: 1, beta: 2 }));
  assert.equal(normalizeEmail("  PERSON@Example.COM "), "person@example.com");
  assert.match(randomOpaqueToken(), /^[A-Za-z0-9_-]{40,}$/);
  assert.match(randomPublicSlug(), /^[A-Za-z0-9_-]{22}$/);
  assert.throws(() => randomOpaqueToken(12), /between 16 and 128/);
});

test("provides strict reusable validation primitives", () => {
  const value = objectRecord({ title: " Example ", tags: ["One", "Two"] });
  rejectUnknownKeys(value, ["title", "tags"]);
  assert.equal(requiredString(value.title, { maxLength: 20 }), "Example");
  assert.deepEqual(stringArray(value.tags, { maxItems: 3, itemMaxLength: 10 }), ["One", "Two"]);
  assert.throws(() => rejectUnknownKeys({ unexpected: true }, ["expected"]), /unknown fields/);
  assert.throws(() => stringArray(["Same", "same"], { maxItems: 3, itemMaxLength: 10 }), /duplicate/);
});

test("decodes supported embedding responses and extracts JSON", () => {
  const body = new TextEncoder().encode(JSON.stringify({ embeddings: { float: [[0.1, 0.2, 0.3]] } }));
  assert.deepEqual(decodeFloatEmbedding(body, 3), [0.1, 0.2, 0.3]);
  assert.throws(() => decodeFloatEmbedding(body, 2), /2 finite numbers/);
  assert.deepEqual(parseJsonObject("```json\n{\"result\":true}\n```"), { result: true });
  assert.deepEqual(parseJsonObject("Result: {\"result\":true}"), { result: true });
});

test("passes an explicit abort signal to JSON model calls", async () => {
  let abortSignal: AbortSignal | undefined;
  const client = {
    send: async (_command: unknown, options?: { abortSignal?: AbortSignal }) => {
      abortSignal = options?.abortSignal;
      return { output: { message: { content: [{ text: '{"result":true}' }] } } };
    },
  } as unknown as BedrockRuntimeClient;
  assert.deepEqual(await judgeJson({ prompt: "test", modelId: "test-model", timeoutMs: 1_000, client }), { result: true });
  assert.ok(abortSignal);
});

test("loads configurable expiring sessions without a product identity namespace", async () => {
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

test("creates a protected on-demand single-table primitive", () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "ReusableFoundationTest");
  createProtectedSingleTable(stack, "Store", { tableName: "generic-test-store" });
  const template = Template.fromStack(stack);
  template.hasResourceProperties("AWS::DynamoDB::Table", {
    TableName: "generic-test-store",
    BillingMode: "PAY_PER_REQUEST",
    DeletionProtectionEnabled: true,
    PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
  });
});

test("keeps the reusable boundary free of product identities and fixed API routes", async () => {
  const files = (await filesBelow(reusableDir)).filter((path) => /\.(?:ts|md)$/.test(path));
  const prohibited = [
    /pitchyour|vibemate|vibesafari|headhunt|recruit|candidate|job description/i,
    /\/v\d+\//i,
    /https?:\/\/[a-z0-9]/i,
  ];
  const violations: string[] = [];
  for (const path of files) {
    const source = await readFile(path, "utf8");
    for (const pattern of prohibited) {
      const match = source.match(pattern);
      if (match) violations.push(`${path.replace(`${reusableDir}/`, "")}: ${match[0]}`);
    }
  }
  assert.deepEqual(violations, []);
});
