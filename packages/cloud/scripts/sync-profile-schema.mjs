#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(packageDir, "..", "..", "config", "pitchyourowner-profile-schema.json");
const targets = [
  resolve(packageDir, "config", "pitchyourowner-profile-schema.json"),
  resolve(packageDir, "static", "pitchyourowner-profile-schema.json"),
];
const raw = await readFile(source, "utf8");
const schema = JSON.parse(raw);
if (!schema?.core_fields || !schema?.field_order || !schema?.optional_fields?.confidence) {
  throw new Error("profile schema config is incomplete");
}
const serialized = `${JSON.stringify(schema, null, 2)}\n`;
for (const target of targets) {
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, serialized, "utf8");
}
console.log(`Synced profile schema to ${targets.length} runtime targets.`);
