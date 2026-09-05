import assert from "node:assert/strict";
import test from "node:test";
import type { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import {
  embeddingExplanation,
  fixtureCandidateIsVisible,
  haveCompatibleMatchLanguage,
  isCurrentMatchable,
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

test("embedding explanation distinguishes exact overlap from a two-sided connection", () => {
  const exact = embeddingExplanation(
    profile({ interests: ["持久登入"] }),
    profile({ interests: ["別的興趣"], recurring_topics: ["持久登入"] }),
    components,
  );
  assert.match(exact.whatWeBothCareAbout, /都明確提到「持久登入」/);
  const oblique = embeddingExplanation(
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
  assert.doesNotMatch(oblique.whatWeBothCareAbout, /你們都/);
  assert.deepEqual(oblique.evidenceLabels, ["interests"]);
});

test("persists embedding-only scores and deterministic evidence in both directions", async () => {
  let written: TransactWriteCommand | undefined;
  await persistPair(
    "exact-hackathon-table",
    loaded("owner-a-id", profile({ interests: ["瀏覽器 session 隔離"] }), [1, 0]),
    loaded("owner-b-id", profile({ interests: ["舞台上的身體引導"] }), [0.8, 0.2]),
    "2026-09-05T00:00:00.000Z",
    true,
    {
      transactionWriter: async (command) => { written = command; },
    },
  );
  const puts = written?.input.TransactItems ?? [];
  assert.equal(puts.length, 2);
  for (const put of puts) {
    assert.equal(put.Put?.Item?.calculationVersion, "field-embedding-v2");
    assert.equal(put.Put?.Item?.explanationSource, "embedding");
    assert.equal(put.Put?.Item?.explanationModelLatencyMs, undefined);
    assert.equal(typeof put.Put?.Item?.compositeScore, "number");
    assert.ok(put.Put?.Item?.whatWeBothCareAbout);
  }
});
