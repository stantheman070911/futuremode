import assert from "node:assert/strict";
import test from "node:test";
import type { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import {
  embeddingExplanation,
  configuredTestRunId,
  fixtureCandidateIsVisible,
  haveCompatibleMatchLanguage,
  isCurrentMatchable,
  isVisibleManualTestCandidate,
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

test("manual matching includes only the cohort and explicitly safe fixtures", () => {
  assert.equal(isVisibleManualTestCandidate({ isTestProfile: true, cleanupSafe: true, testRunId: "cohort-a" }, "cohort-a"), true);
  assert.equal(isVisibleManualTestCandidate({ isTestProfile: true, cleanupSafe: true, testRunId: "cohort-b" }, "cohort-a"), false);
  assert.equal(isVisibleManualTestCandidate({ profileId: "real" }, "cohort-a"), false);
  assert.equal(isVisibleManualTestCandidate({ isFixtureProfile: true, cleanupSafe: true, manualTestVisible: true }, "cohort-a"), true);
  assert.equal(isVisibleManualTestCandidate({ isFixtureProfile: true, cleanupSafe: false, manualTestVisible: true }, "cohort-a"), false);
});

test("recognizes only configured cleanup-safe manual and journey cohorts", () => {
  const previousManual = process.env.MANUAL_TEST_COHORT_ID;
  const previousJourney = process.env.JOURNEY_TEST_COHORT_ID;
  process.env.MANUAL_TEST_COHORT_ID = "manual-cohort";
  process.env.JOURNEY_TEST_COHORT_ID = "journey-cohort";
  try {
    assert.equal(configuredTestRunId({ isTestProfile: true, isManualTestProfile: true, cleanupSafe: true, testRunId: "manual-cohort", testCohortId: "manual-cohort" }), "manual-cohort");
    assert.equal(configuredTestRunId({ isTestProfile: true, isJourneyTestProfile: true, cleanupSafe: true, testRunId: "journey-cohort", testCohortId: "journey-cohort" }), "journey-cohort");
    assert.equal(configuredTestRunId({ isTestProfile: true, isJourneyTestProfile: true, cleanupSafe: true, testRunId: "other", testCohortId: "other" }), undefined);
    assert.equal(configuredTestRunId({ isTestProfile: true, isJourneyTestProfile: true, cleanupSafe: false, testRunId: "journey-cohort", testCohortId: "journey-cohort" }), undefined);
  } finally {
    if (previousManual === undefined) delete process.env.MANUAL_TEST_COHORT_ID; else process.env.MANUAL_TEST_COHORT_ID = previousManual;
    if (previousJourney === undefined) delete process.env.JOURNEY_TEST_COHORT_ID; else process.env.JOURNEY_TEST_COHORT_ID = previousJourney;
  }
});

test("unchanged fixture versions update metadata without regenerating embeddings", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) => readFile(new URL("../scripts/fixtures/seed-private-owner-fixtures.ts", import.meta.url), "utf8"));
  assert.match(source, /existing\?\.versionId === versionId/);
  assert.match(source, /SET manualTestVisible = :yes/);
  assert.match(source, /continue;/);
  assert.ok(source.indexOf("existing?.versionId === versionId") < source.indexOf("const [embedding, fieldPairs]"));
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
