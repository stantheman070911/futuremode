import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoDir = resolve(packageDir, "..", "..");

async function text(path: string): Promise<string> {
  return readFile(path, "utf8");
}

test("ships the canonical owner-pitch prompts without runtime drift", async () => {
  const pairs = [
    [resolve(repoDir, "docs/get_info_prompt_ch.md"), resolve(packageDir, "static/owner-pitch-prompt-zh-Hant.txt")],
    [resolve(repoDir, "docs/get_info_prompt_en.md"), resolve(packageDir, "static/owner-pitch-prompt-en.txt")],
  ];
  for (const [source, runtime] of pairs) assert.equal(await text(runtime), await text(source));
});

test("asks only concrete security/privacy decisions before JSON-only output", async () => {
  const [zh, en, app] = await Promise.all([
    text(resolve(repoDir, "docs/get_info_prompt_ch.md")),
    text(resolve(repoDir, "docs/get_info_prompt_en.md")),
    text(resolve(packageDir, "static/app.js")),
  ]);
  assert.match(zh, /第一則回答不要輸出 JSON/);
  assert.match(zh, /S1.*S2/s);
  assert.match(zh, /確認安全並產生 JSON/);
  assert.match(zh, /唯一允許選項/);
  assert.match(zh, /不得把上述八類掃描範圍變成/);
  assert.match(zh, /output JSON only/i);
  assert.match(zh, /根物件必須且只能包含以下八個 key/);
  assert.match(zh, /不要加入 `schema`/);
  assert.match(zh, /routec\.message_debug_info\.v1/);
  assert.match(zh, /host_session_id/);
  assert.match(en, /Do not output JSON in the first response/);
  assert.match(en, /S1.*S2/s);
  assert.match(en, /CONFIRM SECURITY AND GENERATE JSON/);
  assert.match(en, /only permitted option/);
  assert.match(en, /Do not turn the eight scan categories above/);
  assert.match(en, /output JSON only/i);
  assert.match(en, /root object is the PitchYourOwner profile itself/i);
  assert.match(en, /Do not add `schema`/);
  assert.match(en, /routec\.message_debug_info\.v1/);
  assert.match(en, /matrix_event_id/);
  assert.doesNotMatch(zh, /這份整體介紹是否準確代表/);
  assert.doesNotMatch(en, /Does this overall pitch accurately represent/);
  assert.doesNotMatch(`${zh}\n${en}`, /"status":\s*"review_required"/);
  assert.match(app, /這不是最終 JSON/);
  assert.match(app, /確認安全並產生 JSON/);
  assert.doesNotMatch(app, /一次問完準確性/);
  assert.match(app, /json-guide/);
  assert.match(app, /routec\.message_debug_info\.v1/);
  assert.match(app, /訊息除錯資料，不是 Owner Pitch/);
  assert.match(app, /data-action="launch-ai-with-prompt"/);
  assert.match(app, /target\.searchParams\.set\("q", prompt\)/);
  assert.match(app, /https:\/\/chatgpt\.com\//);
  assert.doesNotMatch(app, /data-action="copy-prompt"/);
  assert.doesNotMatch(app, /data-action="open-ai"/);
});
