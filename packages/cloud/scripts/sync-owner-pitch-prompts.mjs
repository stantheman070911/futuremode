#!/usr/bin/env node
import { copyFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoDir = resolve(packageDir, "..", "..");
const prompts = [
  ["docs/get_info_prompt_ch.md", "static/owner-pitch-prompt-zh-Hant.txt"],
  ["docs/get_info_prompt_en.md", "static/owner-pitch-prompt-en.txt"],
];

for (const [source, target] of prompts) {
  await copyFile(resolve(repoDir, source), resolve(packageDir, target));
}
console.log(`Synced ${prompts.length} owner-pitch prompts to the website runtime.`);
