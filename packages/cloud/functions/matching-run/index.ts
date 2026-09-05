import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { ScanCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { judgeJson } from "../../lib/reusable/bedrock.js";
import { objectRecord, rejectUnknownKeys, requiredString, stringArray } from "../../lib/reusable/validation.js";
import { randomPublicSlug, sha256 } from "../shared/security.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";
import type { OwnerPitchProfile } from "../shared/contracts.js";

const bedrock = new BedrockRuntimeClient({});

interface CurrentProfile extends Record<string, unknown> {
  profileId: string;
  versionId: string;
  email?: string;
  displayName?: string;
  publicSlug?: string;
  matchingState?: string;
  visibility?: string;
  emailHash?: string;
  isTestProfile?: boolean;
  testRunId?: string;
  cleanupSafe?: boolean;
  isFixtureProfile?: boolean;
  fixtureAudienceEmailHash?: string;
}

interface ProfileVersion extends Record<string, unknown> {
  profileId: string;
  versionId: string;
  profile: OwnerPitchProfile;
  fieldEmbeddings?: Record<string, number[]>;
  embedding?: number[];
}

export interface LoadedProfile { current: CurrentProfile; version: ProfileVersion }
interface MatchingScope { includeTestProfiles: boolean; testRunId?: string }

const WEIGHTS = { interests: 0.30, active_problems: 0.25, motivations: 0.20, recurring_topics: 0.15, friend_intent: 0.10 } as const;
export type SimilarityField = keyof typeof WEIGHTS;
export const MATCHABLE_FIELDS = ["summary", "interests", "motivations", "active_problems", "recurring_topics", "friend_intent"] as const;
export type MatchableField = typeof MATCHABLE_FIELDS[number];
const MATCH_EXPLANATION_TIMEOUT_MS = 20_000;
const MATCH_EXPLANATION_CONCURRENCY = 2;
const EXPLANATION_KEYS = new Set(["what_we_both_care_about", "why_it_matters_now", "what_we_could_discuss", "evidence_labels"]);
const JUDGE_OUTPUT_KEYS = new Set(["a_to_b", "b_to_a"]);

export interface ExplanationNarrative {
  strongestSignal: string;
  whatWeBothCareAbout: string;
  whyItMattersNow: string;
  whatWeCouldDiscuss: string;
  evidenceLabels: MatchableField[];
}

export interface PairExplanationResult {
  left: ExplanationNarrative;
  right: ExplanationNarrative;
  source: "model" | "fallback";
  modelLatencyMs: number;
}

type JudgeCall = (prompt: string) => Promise<unknown>;
type TransactionWriter = (command: TransactWriteCommand) => Promise<unknown>;

function matchingScope(event?: unknown): MatchingScope {
  const raw = event && typeof event === "object" && !Array.isArray(event) ? event as Record<string, unknown> : {};
  const testRunId = typeof raw.testRunId === "string" && /^[A-Za-z0-9_.:-]{6,120}$/.test(raw.testRunId) ? raw.testRunId : undefined;
  const allowed = requiredEnvironment("ENVIRONMENT") === "e2e";
  return { includeTestProfiles: allowed && raw.includeTestProfiles === true && Boolean(testRunId), testRunId };
}

export function isCurrentMatchable(current: Record<string, unknown> | undefined): current is CurrentProfile {
  return Boolean(current?.profileId && current.email && String(current.matchingState ?? "active") === "active" && String(current.visibility ?? "public") !== "private");
}

export function haveCompatibleMatchLanguage(left: Record<string, unknown>, right: Record<string, unknown>): boolean {
  const normalize = (value: unknown) => Array.isArray(value) ? value.map(String) : ["zh", "en"];
  const values = new Set(normalize(left.matchLanguages));
  return normalize(right.matchLanguages).some((language) => values.has(language));
}

export function cosineSimilarity(left: number[] | undefined, right: number[] | undefined): number {
  if (!left?.length || left.length !== right?.length) return 0;
  let dot = 0; let leftNorm = 0; let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]; leftNorm += left[index] ** 2; rightNorm += right[index] ** 2;
  }
  if (!leftNorm || !rightNorm) return 0;
  return Math.max(0, Math.min(1, (dot / Math.sqrt(leftNorm * rightNorm) + 1) / 2));
}

function vector(profile: ProfileVersion, field: SimilarityField): number[] | undefined {
  return profile.fieldEmbeddings?.[field] ?? profile.embedding;
}

export function weightedSimilarity(left: ProfileVersion, right: ProfileVersion) {
  const components = Object.fromEntries(Object.keys(WEIGHTS).map((field) => [field, cosineSimilarity(vector(left, field as SimilarityField), vector(right, field as SimilarityField))])) as Record<SimilarityField, number>;
  const score = Object.entries(WEIGHTS).reduce((sum, [field, weight]) => sum + components[field as SimilarityField] * weight, 0);
  return { score, components };
}

function profileForExplanation(profile: OwnerPitchProfile): Record<MatchableField, string | string[]> {
  return {
    summary: profile.summary,
    interests: profile.interests,
    motivations: profile.motivations,
    active_problems: profile.active_problems,
    recurring_topics: profile.recurring_topics,
    friend_intent: profile.friend_intent,
  };
}

function valuesFor(profile: OwnerPitchProfile, field: MatchableField): string[] {
  const value = profile[field];
  return Array.isArray(value) ? value : [value];
}

function firstValue(profile: OwnerPitchProfile, field: SimilarityField): string {
  return valuesFor(profile, field)[0] || "尚未具體描述的關注";
}

function exactShared(left: OwnerPitchProfile, right: OwnerPitchProfile): { value: string; labels: MatchableField[] } | undefined {
  const comparable = MATCHABLE_FIELDS.filter((field) => field !== "summary") as MatchableField[];
  for (const leftField of comparable) {
    for (const leftValue of valuesFor(left, leftField)) {
      const normalized = leftValue.trim().toLocaleLowerCase();
      if (!normalized) continue;
      for (const rightField of comparable) {
        if (valuesFor(right, rightField).some((value) => value.trim().toLocaleLowerCase() === normalized)) {
          return { value: leftValue, labels: [...new Set([leftField, rightField])] };
        }
      }
    }
  }
  return undefined;
}

function strongestComponent(components: Record<SimilarityField, number>): SimilarityField {
  return (Object.entries(components) as Array<[SimilarityField, number]>)
    .sort((left, right) => right[1] - left[1])[0]?.[0] ?? "interests";
}

const COMPONENT_LABELS: Record<SimilarityField, string> = {
  interests: "持續興趣",
  active_problems: "正在解的問題",
  motivations: "當前動機",
  recurring_topics: "反覆討論的主題",
  friend_intent: "想認識的人與交流方向",
};

export function fallbackExplanation(left: OwnerPitchProfile, right: OwnerPitchProfile, components: Record<SimilarityField, number>): ExplanationNarrative {
  const strongest = strongestComponent(components);
  const leftSignal = firstValue(left, strongest);
  const rightSignal = firstValue(right, strongest);
  const shared = exactShared(left, right);
  const strongestLabel = COMPONENT_LABELS[strongest];
  if (shared) {
    return {
      strongestSignal: shared.value,
      whatWeBothCareAbout: `你們都明確提到「${shared.value}」。`,
      whyItMattersNow: `五項配對訊號中，「${strongestLabel}」最接近：你提到「${leftSignal}」，對方提到「${rightSignal}」。`,
      whatWeCouldDiscuss: `可以先交換各自最近如何處理「${shared.value}」，以及目前仍未解決的限制。`,
      evidenceLabels: [...new Set([...shared.labels, strongest])].slice(0, 3),
    };
  }
  return {
    strongestSignal: `${leftSignal} ↔ ${rightSignal}`,
    whatWeBothCareAbout: `你目前關注「${leftSignal}」，對方則關注「${rightSignal}」；兩份介紹沒有逐字相同的共同主題。`,
    whyItMattersNow: `五項配對訊號中，「${strongestLabel}」最接近，但這是兩個不同切入點，仍需透過對話確認是否真的有交集。`,
    whatWeCouldDiscuss: `可以先比較「${leftSignal}」與「${rightSignal}」各自正在面對的限制，再判斷是否值得繼續交流。`,
    evidenceLabels: [strongest],
  };
}

export function buildExplanationPrompt(left: OwnerPitchProfile, right: OwnerPitchProfile): string {
  return [
    "你是兩位 owner 之間的配對說明 agent。",
    "請為雙方各寫一份有方向性的繁體中文說明。",
    "每一句都必須能由下方 A 或 B 的內容直接支持，並點出具體事情，不要只寫抽象類別。",
    "如果沒有具體的共同議題，what_we_both_care_about 必須分別寫出 A 與 B 各自的議題，並明確使用「跨領域的間接連結」或「斜向連結」，不得捏造共同興趣。",
    "不得推論輸入中沒有的專業能力、資歷、身分、成就或事實。",
    "不得寫某一方可以分享某種經驗、提供某種資源或幫助另一方，除非輸入明確寫出那項經驗、資源或能力。",
    "A_TO_B 是給 A 閱讀：一律稱 A 為「你」、B 為「對方」。B_TO_A 是給 B 閱讀：一律稱 B 為「你」、A 為「對方」。不得使用人名，也不得用「我／我們」指稱任何一方。兩個方向可以強調不同價值。",
    "evidence_labels 必須有 1–3 個值，而且只能選自 summary、interests、motivations、active_problems、recurring_topics、friend_intent。",
    "只輸出符合下列結構的 JSON，不要 Markdown、code fence、前言或結語：",
    '{"a_to_b":{"what_we_both_care_about":"...","why_it_matters_now":"...","what_we_could_discuss":"...","evidence_labels":["interests"]},"b_to_a":{"what_we_both_care_about":"...","why_it_matters_now":"...","what_we_could_discuss":"...","evidence_labels":["interests"]}}',
    `A:\n${JSON.stringify(profileForExplanation(left), null, 2)}`,
    `B:\n${JSON.stringify(profileForExplanation(right), null, 2)}`,
  ].join("\n\n");
}

function normalizeDirectionalExplanation(value: unknown, label: string, strongestSignal: string): ExplanationNarrative {
  const raw = objectRecord(value, label);
  rejectUnknownKeys(raw, EXPLANATION_KEYS, label);
  const evidence = stringArray(raw.evidence_labels, {
    label: `${label}.evidence_labels`,
    maxItems: 3,
    itemMaxLength: 40,
  });
  if (evidence.length < 1 || evidence.some((field) => !MATCHABLE_FIELDS.includes(field as MatchableField))) {
    throw new Error(`${label}.evidence_labels must contain 1-3 matchable field names`);
  }
  return {
    strongestSignal,
    whatWeBothCareAbout: requiredString(raw.what_we_both_care_about, { label: `${label}.what_we_both_care_about`, maxLength: 600, singleLine: true }),
    whyItMattersNow: requiredString(raw.why_it_matters_now, { label: `${label}.why_it_matters_now`, maxLength: 600, singleLine: true }),
    whatWeCouldDiscuss: requiredString(raw.what_we_could_discuss, { label: `${label}.what_we_could_discuss`, maxLength: 600, singleLine: true }),
    evidenceLabels: evidence as MatchableField[],
  };
}

export function normalizePairExplanation(value: unknown, fallbackLeft: ExplanationNarrative, fallbackRight: ExplanationNarrative): Pick<PairExplanationResult, "left" | "right"> {
  const raw = objectRecord(value, "match explanation");
  rejectUnknownKeys(raw, JUDGE_OUTPUT_KEYS, "match explanation");
  return {
    left: normalizeDirectionalExplanation(raw.a_to_b, "match explanation.a_to_b", fallbackLeft.strongestSignal),
    right: normalizeDirectionalExplanation(raw.b_to_a, "match explanation.b_to_a", fallbackRight.strongestSignal),
  };
}

async function defaultJudgeCall(prompt: string): Promise<unknown> {
  return judgeJson({
    client: bedrock,
    modelId: requiredEnvironment("MATCH_JUDGE_MODEL_ID"),
    prompt,
    maxTokens: 1_500,
    temperature: 0.1,
    timeoutMs: MATCH_EXPLANATION_TIMEOUT_MS,
  });
}

export async function generatePairExplanations(
  left: OwnerPitchProfile,
  right: OwnerPitchProfile,
  components: Record<SimilarityField, number>,
  options: { judgeCall?: JudgeCall; nowMs?: () => number; onFallback?: (error: unknown, latencyMs: number) => void } = {},
): Promise<PairExplanationResult> {
  const fallbackLeft = fallbackExplanation(left, right, components);
  const fallbackRight = fallbackExplanation(right, left, components);
  const clock = options.nowMs ?? Date.now;
  const startedAt = clock();
  try {
    const generated = normalizePairExplanation(
      await (options.judgeCall ?? defaultJudgeCall)(buildExplanationPrompt(left, right)),
      fallbackLeft,
      fallbackRight,
    );
    return { ...generated, source: "model", modelLatencyMs: Math.max(0, clock() - startedAt) };
  } catch (error) {
    const modelLatencyMs = Math.max(0, clock() - startedAt);
    if (options.onFallback) options.onFallback(error, modelLatencyMs);
    else console.warn(JSON.stringify({
      event: "match_explanation_fallback",
      errorName: error instanceof Error ? error.name : "UnknownError",
      model_latency_ms: modelLatencyMs,
    }));
    return { left: fallbackLeft, right: fallbackRight, source: "fallback", modelLatencyMs };
  }
}

function edgeSortKey(score: number, candidateId: string): string {
  const inverted = String(Math.max(0, 1_000_000 - Math.round(score * 1_000_000))).padStart(7, "0");
  return `EDGE#${inverted}#${candidateId}`;
}

function inScope(profile: CurrentProfile, scope: MatchingScope, fixtureAudienceEmailHash?: string): boolean {
  if (scope.includeTestProfiles) return profile.isTestProfile === true && profile.cleanupSafe === true && profile.testRunId === scope.testRunId;
  if (profile.isTestProfile === true) return false;
  if (profile.isFixtureProfile === true) return Boolean(fixtureAudienceEmailHash && profile.fixtureAudienceEmailHash === fixtureAudienceEmailHash);
  return true;
}

export function fixtureCandidateIsVisible(profile: Record<string, unknown>, audienceEmailHash?: string): boolean {
  return inScope(profile as CurrentProfile, { includeTestProfiles: false }, audienceEmailHash);
}

async function scanAll(tableName: string): Promise<Array<Record<string, unknown>>> {
  const items: Array<Record<string, unknown>> = [];
  let start: Record<string, unknown> | undefined;
  do {
    const page = await documentDynamo.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey: start, ConsistentRead: true }));
    items.push(...(page.Items ?? [])); start = page.LastEvaluatedKey;
  } while (start);
  return items;
}

function loadedProfiles(items: Array<Record<string, unknown>>, scope: MatchingScope, fixtureAudienceEmailHash?: string): LoadedProfile[] {
  const versions = new Map<string, ProfileVersion>();
  for (const item of items) if (item.entityType === "PROFILE_VERSION" && item.profileId && item.versionId) versions.set(`${item.profileId}:${item.versionId}`, item as ProfileVersion);
  return items
    .filter((item) => item.entityType === "PROFILE_CURRENT" && item.versionId && isCurrentMatchable(item) && inScope(item as CurrentProfile, scope, fixtureAudienceEmailHash))
    .map((current) => ({ current: current as CurrentProfile, version: versions.get(`${current.profileId}:${current.versionId}`) }))
    .filter((entry): entry is LoadedProfile => Boolean(entry.version?.profile));
}

async function ensurePublicSlug(tableName: string, entry: LoadedProfile): Promise<void> {
  if (entry.current.publicSlug) return;
  const publicSlug = randomPublicSlug();
  await documentDynamo.send(new TransactWriteCommand({ TransactItems: [
    { Put: { TableName: tableName, Item: { pk: `PUBLIC_SLUG#${publicSlug}`, sk: "PROFILE", entityType: "PUBLIC_PROFILE_POINTER", profileId: entry.current.profileId, createdAt: new Date().toISOString() }, ConditionExpression: "attribute_not_exists(pk)" } },
    { Update: { TableName: tableName, Key: { pk: `PROFILE#${entry.current.profileId}`, sk: "CURRENT" }, UpdateExpression: "SET publicSlug = :slug, visibility = if_not_exists(visibility, :public)", ExpressionAttributeValues: { ":slug": publicSlug, ":public": "public", ":version": entry.current.versionId }, ConditionExpression: "attribute_not_exists(publicSlug) AND versionId = :version" } },
  ] }));
  entry.current.publicSlug = publicSlug;
}

function pairId(left: string, right: string): string { return sha256([left, right].sort().join(":" )).slice(0, 32); }

export async function persistPair(
  tableName: string,
  left: LoadedProfile,
  right: LoadedProfile,
  now: string,
  writeReverse = true,
  options: {
    judgeCall?: JudgeCall;
    transactionWriter?: TransactionWriter;
    nowMs?: () => number;
    onFallback?: (error: unknown, latencyMs: number) => void;
  } = {},
): Promise<Pick<PairExplanationResult, "source" | "modelLatencyMs">> {
  const similarity = weightedSimilarity(left.version, right.version);
  const generated = await generatePairExplanations(left.version.profile, right.version.profile, similarity.components, options);
  const common = {
    entityType: "SIMILARITY_EDGE",
    pairId: pairId(left.current.profileId, right.current.profileId),
    compositeScore: similarity.score,
    components: similarity.components,
    calculationVersion: "field-embedding-v1",
    calculatedAt: now,
    explanationSource: generated.source,
    explanationModelLatencyMs: generated.modelLatencyMs,
  };
  const make = (owner: LoadedProfile, peer: LoadedProfile, narrative: ExplanationNarrative) => ({
    pk: `PROFILE#${owner.current.profileId}`,
    sk: edgeSortKey(similarity.score, peer.current.profileId),
    ...common,
    ownerProfileId: owner.current.profileId,
    ownerVersionId: owner.version.versionId,
    candidateProfileId: peer.current.profileId,
    candidateVersionId: peer.version.versionId,
    ...narrative,
    ...(owner.current.isTestProfile === true ? { isTestProfile: true, cleanupSafe: true, testRunId: owner.current.testRunId } : {}),
  });
  const writes: ConstructorParameters<typeof TransactWriteCommand>[0]["TransactItems"] = [
    { Put: { TableName: tableName, Item: make(left, right, generated.left) } },
  ];
  if (writeReverse) writes.push({ Put: { TableName: tableName, Item: make(right, left, generated.right) } });
  const command = new TransactWriteCommand({ TransactItems: writes });
  await (options.transactionWriter ?? ((request) => documentDynamo.send(request)))(command);
  return { source: generated.source, modelLatencyMs: generated.modelLatencyMs };
}

async function forEachBounded<T>(items: T[], concurrency: number, work: (item: T) => Promise<void>): Promise<void> {
  let nextIndex = 0;
  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await work(items[currentIndex]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
}

export async function handler(event?: unknown): Promise<Record<string, unknown>> {
  const runStartedAt = Date.now();
  const tableName = requiredEnvironment("TABLE_NAME");
  const scope = matchingScope(event);
  const items = await scanAll(tableName);
  const requestedId = event && typeof event === "object" ? String((event as Record<string, unknown>).profileId ?? "") : "";
  const regularProfiles = loadedProfiles(items, scope);
  const requestedOwner = requestedId ? regularProfiles.find((entry) => entry.current.profileId === requestedId) : undefined;
  const profiles = requestedOwner && !scope.includeTestProfiles
    ? loadedProfiles(items, scope, requestedOwner.current.emailHash)
    : regularProfiles;
  for (const profile of profiles) if (profile.current.isFixtureProfile !== true) await ensurePublicSlug(tableName, profile);
  const seeds = requestedId ? profiles.filter((entry) => entry.current.profileId === requestedId) : profiles;
  const completed = new Set<string>();
  const pairTasks: Array<{ seed: LoadedProfile; candidate: LoadedProfile; writeReverse: boolean }> = [];
  for (const seed of seeds) {
    for (const candidate of profiles) {
      if (candidate.current.profileId === seed.current.profileId) continue;
      const id = pairId(seed.current.profileId, candidate.current.profileId);
      if (completed.has(id)) continue;
      completed.add(id);
      pairTasks.push({ seed, candidate, writeReverse: candidate.current.isFixtureProfile !== true });
    }
  }
  let modelExplanations = 0;
  let fallbackExplanations = 0;
  await forEachBounded(pairTasks, MATCH_EXPLANATION_CONCURRENCY, async ({ seed, candidate, writeReverse }) => {
    const result = await persistPair(tableName, seed, candidate, new Date().toISOString(), writeReverse);
    if (result.source === "model") modelExplanations += 1;
    else fallbackExplanations += 1;
  });
  // A publish does not advance the readable graph revision until every incident
  // edge has been materialized. This prevents Refresh from snapshotting a new
  // cohort revision before its asynchronous matching run is actually ready.
  await documentDynamo.send(new UpdateCommand({
    TableName: tableName,
    Key: { pk: "MATCHING_GRAPH", sk: "REVISION" },
    UpdateExpression: "SET updatedAt = :now ADD revision :one",
    ExpressionAttributeValues: { ":now": new Date().toISOString(), ":one": 1 },
  }));
  const report = {
    event: "matching_run_complete",
    status: "complete",
    profiles: profiles.length,
    seed_profiles: seeds.length,
    pairs_written: pairTasks.length,
    explanation_paths: { model: modelExplanations, fallback: fallbackExplanations },
    duration_ms: Date.now() - runStartedAt,
    test_run_id: scope.testRunId,
  };
  console.info(JSON.stringify(report));
  return report;
}
