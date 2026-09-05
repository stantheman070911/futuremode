import assert from "node:assert/strict";
import test from "node:test";
import type { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import {
  buildExplanationPrompt,
  fallbackExplanation,
  fixtureCandidateIsVisible,
  haveCompatibleMatchLanguage,
  isCurrentMatchable,
  MATCHABLE_FIELDS,
  normalizePairExplanation,
  persistPair,
  type LoadedProfile,
  type SimilarityField,
} from "../functions/matching-run/index.js";
import type { OwnerPitchProfile } from "../functions/shared/contracts.js";

const confidence = {
  summary: "high",
  interests: "high",
  motivations: "high",
  active_problems: "high",
  recurring_topics: "high",
  friend_intent: "medium",
} as const;

function profile(overrides: Partial<OwnerPitchProfile> = {}): OwnerPitchProfile {
  return {
    history_scope: "PRIVATE_SCOPE_SENTINEL",
    animal_persona: "PRIVATE_ANIMAL_SENTINEL",
    summary: "正在把長時間 AI agent 變成一般人可以操作的產品。",
    interests: ["持久登入的瀏覽器 session"],
    motivations: ["降低非技術使用者的部署門檻"],
    active_problems: ["如何隔離多使用者 browser profile"],
    recurring_topics: ["agent runtime 的持久狀態"],
    friend_intent: "想認識也在處理 agent 部署與瀏覽器基礎設施的人。",
    confidence,
    ...overrides,
  };
}

const components: Record<SimilarityField, number> = {
  interests: 0.9,
  active_problems: 0.8,
  motivations: 0.7,
  recurring_topics: 0.6,
  friend_intent: 0.5,
};

function loaded(id: string, ownerProfile: OwnerPitchProfile, vector: number[]): LoadedProfile {
  return {
    current: { profileId: id, versionId: `${id}-version`, email: `${id}@example.com` },
    version: {
      profileId: id,
      versionId: `${id}-version`,
      profile: ownerProfile,
      fieldEmbeddings: Object.fromEntries(Object.keys(components).map((field) => [field, vector])),
    },
  };
}

test("only active current profiles with email can enter matching", () => {
  assert.equal(isCurrentMatchable({ profileId: "one", email: "one@example.com" }), true);
  assert.equal(isCurrentMatchable({ profileId: "one", email: "one@example.com", matchingState: "active" }), true);
  assert.equal(isCurrentMatchable({ profileId: "one", email: "one@example.com", matchingState: "paused" }), false);
  assert.equal(isCurrentMatchable({ profileId: "one", email: "one@example.com", matchingState: "disabled" }), false);
  assert.equal(isCurrentMatchable({ profileId: "one", matchingState: "active" }), false);
});

test("requires at least one shared match language", () => {
  assert.equal(haveCompatibleMatchLanguage(
    { profileId: "one", matchLanguages: ["zh"] },
    { profileId: "two", matchLanguages: ["en"] },
  ), false);
  assert.equal(haveCompatibleMatchLanguage(
    { profileId: "one", matchLanguages: ["zh", "en"] },
    { profileId: "two", matchLanguages: ["en"] },
  ), true);
  assert.equal(haveCompatibleMatchLanguage(
    { profileId: "one" },
    { profileId: "two", matchLanguages: ["zh"] },
  ), true);
});

test("shows a private fixture only to its audience email hash", () => {
  const fixture = { profileId: "fixture", isFixtureProfile: true, fixtureAudienceEmailHash: "viewer-hash" };
  assert.equal(fixtureCandidateIsVisible(fixture, "viewer-hash"), true);
  assert.equal(fixtureCandidateIsVisible(fixture, "someone-else"), false);
  assert.equal(fixtureCandidateIsVisible(fixture), false);
  assert.equal(fixtureCandidateIsVisible({ profileId: "real" }, "someone-else"), true);
});

test("sends only the six matchable fields to the explanation model", () => {
  const left = profile();
  const right = profile({ summary: "用舞者的身體提示研究姿勢如何傳達情緒。" });
  const prompt = buildExplanationPrompt(left, right);
  for (const field of MATCHABLE_FIELDS) assert.match(prompt, new RegExp(`"${field}"`));
  assert.doesNotMatch(prompt, /PRIVATE_SCOPE_SENTINEL|PRIVATE_ANIMAL_SENTINEL/);
  assert.doesNotMatch(prompt, /history_scope|confidence|animal_persona|profileId|versionId|emailHash|@example\.com/);
  assert.match(prompt, /不得使用人名/);
  assert.match(prompt, /跨領域的間接連結/);
});

test("strictly validates both directional explanations and evidence labels", () => {
  const leftFallback = fallbackExplanation(profile(), profile(), components);
  const rightFallback = fallbackExplanation(profile(), profile(), components);
  const valid = {
    a_to_b: {
      what_we_both_care_about: "你們都在處理持久登入的瀏覽器 session。",
      why_it_matters_now: "你正在降低部署摩擦，對方正在處理登入狀態恢復。",
      what_we_could_discuss: "可以比較 browser profile 的隔離邊界。",
      evidence_labels: ["interests", "active_problems"],
    },
    b_to_a: {
      what_we_both_care_about: "你們都把 agent runtime 的持久狀態列為反覆主題。",
      why_it_matters_now: "你正在處理狀態恢復，對方正在把同一能力產品化。",
      what_we_could_discuss: "可以交換長任務中斷後的恢復策略。",
      evidence_labels: ["recurring_topics"],
    },
  };
  const normalized = normalizePairExplanation(valid, leftFallback, rightFallback);
  assert.deepEqual(normalized.left.evidenceLabels, ["interests", "active_problems"]);
  assert.throws(() => normalizePairExplanation({ ...valid, unexpected: true }, leftFallback, rightFallback), /unknown fields/);
  assert.throws(() => normalizePairExplanation({
    ...valid,
    a_to_b: { ...valid.a_to_b, evidence_labels: ["history_scope"] },
  }, leftFallback, rightFallback), /matchable field names/);
});

test("fallback distinguishes exact overlap from a two-sided oblique connection", () => {
  const exact = fallbackExplanation(
    profile({ interests: ["持久登入"] }),
    profile({ interests: ["別的興趣"], recurring_topics: ["持久登入"] }),
    components,
  );
  assert.match(exact.whatWeBothCareAbout, /都明確提到「持久登入」/);
  const oblique = fallbackExplanation(
    profile({ interests: ["瀏覽器 session 隔離"] }),
    profile({
      summary: "研究舞台動作如何改變觀眾感受。",
      interests: ["舞台上的身體引導"],
      motivations: ["讓演出者得到清楚但不過度的提示"],
      active_problems: ["如何不打斷舞者動勢"],
      recurring_topics: ["肩線與呼吸的關係"],
      friend_intent: "想認識研究現場表演的人。",
    }),
    components,
  );
  assert.match(oblique.whatWeBothCareAbout, /瀏覽器 session 隔離/);
  assert.match(oblique.whatWeBothCareAbout, /舞台上的身體引導/);
  assert.match(oblique.whatWeBothCareAbout, /沒有逐字相同的共同主題/);
  assert.doesNotMatch(oblique.whatWeBothCareAbout, /你們都/);
});

test("a judge failure persists both fallback edges and reports the fallback path", async () => {
  let written: TransactWriteCommand | undefined;
  const ticks = [100, 137];
  const result = await persistPair(
    "exact-hackathon-table",
    loaded("owner-a-id", profile({ interests: ["瀏覽器 session 隔離"] }), [1, 0]),
    loaded("owner-b-id", profile({ interests: ["舞台上的身體引導"] }), [0.8, 0.2]),
    "2026-09-05T00:00:00.000Z",
    true,
    {
      judgeCall: async () => { throw new Error("simulated throttle"); },
      transactionWriter: async (command) => { written = command; },
      nowMs: () => ticks.shift() ?? 137,
      onFallback: () => {},
    },
  );
  assert.deepEqual(result, { source: "fallback", modelLatencyMs: 37 });
  const puts = written?.input.TransactItems ?? [];
  assert.equal(puts.length, 2);
  for (const put of puts) {
    assert.equal(put.Put?.Item?.explanationSource, "fallback");
    assert.equal(put.Put?.Item?.explanationModelLatencyMs, 37);
    assert.ok(put.Put?.Item?.whatWeBothCareAbout);
  }
});

test("one successful judge call persists both directional model explanations", async () => {
  let judgeCalls = 0;
  let written: TransactWriteCommand | undefined;
  const ticks = [200, 229];
  const result = await persistPair(
    "exact-hackathon-table",
    loaded("owner-a-id", profile(), [1, 0]),
    loaded("owner-b-id", profile({ interests: ["讓舞者得到不打斷動勢的即時提示"] }), [0.8, 0.2]),
    "2026-09-05T00:00:00.000Z",
    true,
    {
      judgeCall: async () => {
        judgeCalls += 1;
        return {
          a_to_b: {
            what_we_both_care_about: "你在處理瀏覽器 session，對方在處理舞者的即時提示，兩者都關心不中斷使用者正在進行的工作。",
            why_it_matters_now: "這是間接連結：你正在降低 agent 操作摩擦，對方正在避免提示打斷舞者動勢。",
            what_we_could_discuss: "可以比較系統提示在不中斷工作流時，應該保留多少控制權給使用者。",
            evidence_labels: ["interests", "active_problems"],
          },
          b_to_a: {
            what_we_both_care_about: "你在研究舞者提示，對方在設計 agent 操作流程，兩者的交集是如何讓工具配合人的節奏。",
            why_it_matters_now: "你的限制來自身體動勢，對方的限制來自部署與 session；這個連結並非相同專業領域。",
            what_we_could_discuss: "可以交換何時顯示提示、何時保持安靜，以及使用者如何介入系統。",
            evidence_labels: ["summary", "interests"],
          },
        };
      },
      transactionWriter: async (command) => { written = command; },
      nowMs: () => ticks.shift() ?? 229,
    },
  );
  assert.equal(judgeCalls, 1);
  assert.deepEqual(result, { source: "model", modelLatencyMs: 29 });
  const puts = written?.input.TransactItems ?? [];
  assert.equal(puts.length, 2);
  assert.equal(puts[0].Put?.Item?.explanationSource, "model");
  assert.equal(puts[0].Put?.Item?.explanationModelLatencyMs, 29);
  assert.notEqual(puts[0].Put?.Item?.whatWeBothCareAbout, puts[1].Put?.Item?.whatWeBothCareAbout);
});
