import { ScanCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomPublicSlug, sha256 } from "../shared/security.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";
import type { OwnerPitchProfile } from "../shared/contracts.js";
import { MATCHING_ALGORITHM_VERSION } from "../shared/matching.js";

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
  isManualTestProfile?: boolean;
  testRunId?: string;
  testCohortId?: string;
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
const PAIR_WRITE_CONCURRENCY = 2;

export interface ExplanationNarrative {
  strongestSignal: string;
  whatWeBothCareAbout: string;
  whyItMattersNow: string;
  whatWeCouldDiscuss: string;
  evidenceLabels: MatchableField[];
}

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

export function embeddingExplanation(left: OwnerPitchProfile, right: OwnerPitchProfile, components: Record<SimilarityField, number>): ExplanationNarrative {
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
    whatWeBothCareAbout: `你目前關注「${leftSignal}」，對方則關注「${rightSignal}」。`,
    whyItMattersNow: `你們的「${strongestLabel}」在五項配對訊號中最接近。`,
    whatWeCouldDiscuss: `可以從「${leftSignal}」與「${rightSignal}」之間的實際關聯開始聊。`,
    evidenceLabels: [strongest],
  };
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
    transactionWriter?: TransactionWriter;
  } = {},
): Promise<void> {
  const similarity = weightedSimilarity(left.version, right.version);
  const leftExplanation = embeddingExplanation(left.version.profile, right.version.profile, similarity.components);
  const rightExplanation = embeddingExplanation(right.version.profile, left.version.profile, similarity.components);
  const common = {
    entityType: "SIMILARITY_EDGE",
    pairId: pairId(left.current.profileId, right.current.profileId),
    compositeScore: similarity.score,
    components: similarity.components,
    calculationVersion: MATCHING_ALGORITHM_VERSION,
    calculatedAt: now,
    explanationSource: "embedding",
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
    ...(owner.current.isTestProfile === true ? {
      isTestProfile: true,
      cleanupSafe: true,
      testRunId: owner.current.testRunId,
      ...(owner.current.isManualTestProfile === true ? { isManualTestProfile: true, testCohortId: owner.current.testCohortId } : {}),
    } : {}),
  });
  const writes: ConstructorParameters<typeof TransactWriteCommand>[0]["TransactItems"] = [
    { Put: { TableName: tableName, Item: make(left, right, leftExplanation) } },
  ];
  if (writeReverse) writes.push({ Put: { TableName: tableName, Item: make(right, left, rightExplanation) } });
  const command = new TransactWriteCommand({ TransactItems: writes });
  await (options.transactionWriter ?? ((request) => documentDynamo.send(request)))(command);
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
  let scope = matchingScope(event);
  const items = await scanAll(tableName);
  const requestedId = event && typeof event === "object" ? String((event as Record<string, unknown>).profileId ?? "") : "";
  if (!scope.includeTestProfiles && requestedId) {
    const requestedCurrent = items.find((item) => item.entityType === "PROFILE_CURRENT" && item.profileId === requestedId) as CurrentProfile | undefined;
    const cohortId = process.env.MANUAL_TEST_COHORT_ID;
    if (cohortId
      && requestedCurrent?.isTestProfile === true
      && requestedCurrent.isManualTestProfile === true
      && requestedCurrent.cleanupSafe === true
      && requestedCurrent.testCohortId === cohortId
      && requestedCurrent.testRunId === cohortId) {
      scope = { includeTestProfiles: true, testRunId: cohortId };
    }
  }
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
  await forEachBounded(pairTasks, PAIR_WRITE_CONCURRENCY, async ({ seed, candidate, writeReverse }) => {
    await persistPair(tableName, seed, candidate, new Date().toISOString(), writeReverse);
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
    matching_algorithm: MATCHING_ALGORITHM_VERSION,
    duration_ms: Date.now() - runStartedAt,
    test_run_id: scope.testRunId,
  };
  console.info(JSON.stringify(report));
  return report;
}
