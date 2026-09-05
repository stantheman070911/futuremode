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

test("asks one concrete topic-exclusion question before JSON-only output", async () => {
  const [zh, en, app] = await Promise.all([
    text(resolve(repoDir, "docs/get_info_prompt_ch.md")),
    text(resolve(repoDir, "docs/get_info_prompt_en.md")),
    text(resolve(packageDir, "static/app.js")),
  ]);
  assert.match(zh, /第一則回答不要輸出 JSON/);
  assert.match(zh, /哪些主題應該排除/);
  assert.match(zh, /none 或 全部保留/);
  assert.match(zh, /Google 任職經歷/);
  assert.match(zh, /animal_persona/);
  assert.match(zh, /專業吸引力/);
  assert.match(zh, /JSON only/i);
  assert.match(zh, /根物件必須且只能依序包含/);
  assert.match(zh, /session、event、sender、timestamp、origin、URL/);
  assert.match(en, /Do not output JSON in the first response/);
  assert.match(en, /animal_persona/);
  assert.match(en, /exactly these nine keys/);
  assert.match(en, /Which topics should be excluded/);
  assert.match(en, /reply `none` or `keep all`/);
  assert.match(en, /Employment at Google/);
  assert.doesNotMatch(en, /S1|CONFIRM SECURITY AND GENERATE JSON|only permitted option/);
  assert.match(en, /output JSON only/i);
  assert.match(en, /root object is the PitchYourOwner profile itself/i);
  assert.match(en, /Do not add `schema`/);
  assert.match(en, /session, event, sender, timestamp, origin, URL/);
  assert.doesNotMatch(zh, /這份整體介紹是否準確代表/);
  assert.doesNotMatch(en, /Does this overall pitch accurately represent/);
  assert.doesNotMatch(`${zh}\n${en}`, /"status":\s*"review_required"/);
  assert.match(app, /一次選擇要排除的主題/);
  assert.match(app, /JSON 語法錯誤/);
  assert.doesNotMatch(app, /一次問完準確性/);
  assert.match(app, /json-guide/);
  assert.match(app, /ProfileJson\.normalizeJsonInput/);
  assert.match(app, /data-action="launch-ai-with-prompt"/);
  assert.match(app, /data-action="copy-prompt"/);
  assert.match(app, /runtime\.handoffLaunchedAt = Date\.now\(\)/);
  assert.match(app, /Promise\.race\(\[/);
  assert.match(app, /setTimeout\(\(\) => resolve\(false\), 900\)/);
  assert.match(app, /runtime\.showFullPrompt = !copied/);
  assert.match(app, /copied \? "handoff\.promptCopied" : "notice\.copyUnavailable"/);
  assert.match(app, /target\.searchParams\.set\("q", String\(prompt \|\| ""\)\)/);
  assert.match(app, /https:\/\/chatgpt\.com\//);
  assert.match(app, /https:\/\/claude\.ai\/new/);
  assert.match(app, /window\.open\(target, "_blank", "noopener,noreferrer"\)/);
  assert.doesNotMatch(app, /window\.location\.assign\(target\.toString\(\)\)/);
  assert.match(app, /role="dialog" aria-modal="true"/);
  assert.match(app, /data-action="confirm-memory-notice"/);
  assert.match(app, /data-action="dismiss-memory-notice"/);
  assert.match(app, /data-action="open-memory-notice"/);
  assert.match(app, /memoryNoticeSeen/);
  assert.doesNotMatch(app, /data-action="open-ai"/);
  assert.match(app, /pitchyourowner\.handoff\.v1/);
  assert.match(app, /owner-pitch-prompt-zh-Hant\.txt/);
  assert.doesNotMatch(app, /display_name: runtime\.displayName/);
  assert.match(app, /data-form="publish-profile" novalidate/);
  assert.match(app, /type="button" class="button primary" data-action="confirm-publish"/);
  assert.match(app, /if \(form\.dataset\.form === "publish-profile"\) return/);
  assert.match(app, /data-action="remove-profile-item"/);
  assert.match(app, /data-action="add-profile-item"/);
  assert.match(app, /publishAttemptForDraft/);
  assert.match(app, /pitchyourowner\.import-mode\.v1/);
  assert.match(app, /runtime\.importJson = JSON\.stringify\(runtime\.draft, null, 2\)/);
  assert.match(app, /notice\.publishedMatchingPending/);
  assert.match(app, /runtime\.busy = false;\s*throw error;/);
  assert.match(app, /\[1, 2, 3\]\.map/);
  for (const field of ["history_scope", "animal_persona", "summary", "interests", "motivations", "active_problems", "recurring_topics", "friend_intent"]) {
    assert.match(app, new RegExp(`\\b${field}\\b`));
  }
  assert.match(app, /CONFIDENCE_FIELDS = PROFILE_SCHEMA_CONFIG\.optional_fields\.confidence\.targets/);
  assert.match(app, /confidenceControl\(profile, "summary"\)/);
  assert.match(app, /confidenceControl\(profile, "friend_intent"\)/);
  assert.doesNotMatch(app, /data-form="review-profile"/);
  assert.doesNotMatch(app, /name="display_name"/);
  assert.match(app, /Resume computer draft/);
  assert.match(app, /data-form="support-request"/);
  assert.match(app, /profileDocument\(runtime\.profile\.profile, false\)/);
  assert.match(app, /new URLSearchParams\(location\.search\)\.has\("demo"\)/);
});
