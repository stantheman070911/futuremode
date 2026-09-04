import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";

interface Parser { normalizeJsonInput(value: unknown): { source: string; smartQuotes: boolean }; duplicateJsonKey(value: string): string | null }

async function parser(): Promise<Parser> {
  const source = await readFile(new URL("../static/profile-json.js", import.meta.url), "utf8");
  const context: Record<string, unknown> = {};
  runInNewContext(source, context);
  return context.ProfileJson as Parser;
}

test("normalizes a BOM, complete fence, and typographic JSON delimiters", async () => {
  const value = "\uFEFF```json\n{“summary”:“追著光線的攝影師”}\n```";
  const normalized = (await parser()).normalizeJsonInput(value);
  assert.equal(normalized.smartQuotes, true);
  assert.deepEqual(JSON.parse(normalized.source), { summary: "追著光線的攝影師" });
});

test("preserves typographic punctuation inside standard JSON strings", async () => {
  const value = '{"summary":"她研究“光”如何改變情緒"}';
  const normalized = (await parser()).normalizeJsonInput(value);
  assert.equal(normalized.source, value);
  assert.equal(JSON.parse(normalized.source).summary, "她研究“光”如何改變情緒");
});

test("detects duplicate keys per object without rejecting the same key in nested objects", async () => {
  const instance = await parser();
  assert.equal(instance.duplicateJsonKey('{"summary":"a","summary":"b"}'), "summary");
  assert.equal(instance.duplicateJsonKey('{"summary":"a","nested":{"summary":"b"}}'), null);
});
