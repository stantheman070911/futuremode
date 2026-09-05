import { ScanCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomPublicSlug, sha256 } from "../shared/security.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";
import type { OwnerPitchProfile } from "../shared/contracts.js";

interface CurrentProfile extends Record<string, unknown> {
  profileId: string;
  versionId: string;
  email?: string;
  displayName?: string;
  publicSlug?: string;
  matchingState?: string;
  visibility?: string;
  isTestProfile?: boolean;
  testRunId?: string;
  cleanupSafe?: boolean;
}

interface ProfileVersion extends Record<string, unknown> {
  profileId: string;
  versionId: string;
  profile: OwnerPitchProfile;
  fieldEmbeddings?: Record<string, number[]>;
  embedding?: number[];
}

interface LoadedProfile { current: CurrentProfile; version: ProfileVersion }
interface MatchingScope { includeTestProfiles: boolean; testRunId?: string }

const WEIGHTS = { interests: 0.30, active_problems: 0.25, motivations: 0.20, recurring_topics: 0.15, friend_intent: 0.10 } as const;
export type SimilarityField = keyof typeof WEIGHTS;

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

function exactShared(left: string[], right: string[]): string | undefined {
  const rightValues = new Map(right.map((item) => [item.trim().toLocaleLowerCase(), item]));
  return left.find((item) => rightValues.has(item.trim().toLocaleLowerCase()));
}

function explanation(left: OwnerPitchProfile, right: OwnerPitchProfile, components: Record<SimilarityField, number>) {
  const strongest = (Object.entries(components) as Array<[SimilarityField, number]>).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "interests";
  const strongestValue = right[strongest];
  const shared = exactShared(left.interests, right.interests)
    ?? exactShared(left.active_problems, right.active_problems)
    ?? (Array.isArray(strongestValue) ? strongestValue[0] : strongestValue);
  const signal = String(shared || right.interests?.[0] || right.active_problems?.[0] || "一個正在深入探索的問題");
  return {
    strongestSignal: signal,
    whatWeBothCareAbout: `你們的介紹都把「${signal}」放在目前關注的核心。`,
    whyItMattersNow: "這不是只有領域名稱相同，而是兩邊都正在投入時間理解或解決的具體議題。",
    whatWeCouldDiscuss: `可以先交換各自對「${signal}」最近一次實作、卡住的地方與下一個想驗證的做法。`,
    evidenceLabels: [strongest, strongest === "interests" ? "active_problems" : "interests"],
  };
}

function edgeSortKey(score: number, candidateId: string): string {
  const inverted = String(Math.max(0, 1_000_000 - Math.round(score * 1_000_000))).padStart(7, "0");
  return `EDGE#${inverted}#${candidateId}`;
}

function inScope(profile: CurrentProfile, scope: MatchingScope): boolean {
  if (scope.includeTestProfiles) return profile.isTestProfile === true && profile.cleanupSafe === true && profile.testRunId === scope.testRunId;
  return profile.isTestProfile !== true;
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

function loadedProfiles(items: Array<Record<string, unknown>>, scope: MatchingScope): LoadedProfile[] {
  const versions = new Map<string, ProfileVersion>();
  for (const item of items) if (item.entityType === "PROFILE_VERSION" && item.profileId && item.versionId) versions.set(`${item.profileId}:${item.versionId}`, item as ProfileVersion);
  return items
    .filter((item) => item.entityType === "PROFILE_CURRENT" && item.versionId && isCurrentMatchable(item) && inScope(item as CurrentProfile, scope))
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

async function persistPair(tableName: string, left: LoadedProfile, right: LoadedProfile, now: string): Promise<void> {
  const similarity = weightedSimilarity(left.version, right.version);
  const leftExplanation = explanation(left.version.profile, right.version.profile, similarity.components);
  const rightExplanation = explanation(right.version.profile, left.version.profile, similarity.components);
  const common = {
    entityType: "SIMILARITY_EDGE",
    pairId: pairId(left.current.profileId, right.current.profileId),
    compositeScore: similarity.score,
    components: similarity.components,
    calculationVersion: "field-embedding-v1",
    calculatedAt: now,
  };
  const make = (owner: LoadedProfile, peer: LoadedProfile, narrative: ReturnType<typeof explanation>) => ({
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
  await documentDynamo.send(new TransactWriteCommand({ TransactItems: [
    { Put: { TableName: tableName, Item: make(left, right, leftExplanation) } },
    { Put: { TableName: tableName, Item: make(right, left, rightExplanation) } },
  ] }));
}

export async function handler(event?: unknown): Promise<Record<string, unknown>> {
  const tableName = requiredEnvironment("TABLE_NAME");
  const scope = matchingScope(event);
  const profiles = loadedProfiles(await scanAll(tableName), scope);
  for (const profile of profiles) await ensurePublicSlug(tableName, profile);
  const requestedId = event && typeof event === "object" ? String((event as Record<string, unknown>).profileId ?? "") : "";
  const seeds = requestedId ? profiles.filter((entry) => entry.current.profileId === requestedId) : profiles;
  let pairs = 0;
  const completed = new Set<string>();
  for (const seed of seeds) {
    for (const candidate of profiles) {
      if (candidate.current.profileId === seed.current.profileId) continue;
      const id = pairId(seed.current.profileId, candidate.current.profileId);
      if (completed.has(id)) continue;
      await persistPair(tableName, seed, candidate, new Date().toISOString());
      completed.add(id); pairs += 1;
    }
  }
  // A publish does not advance the readable graph revision until every incident
  // edge has been materialized. This prevents Refresh from snapshotting a new
  // cohort revision before its asynchronous matching run is actually ready.
  await documentDynamo.send(new UpdateCommand({
    TableName: tableName,
    Key: { pk: "MATCHING_GRAPH", sk: "REVISION" },
    UpdateExpression: "SET updatedAt = :now ADD revision :one",
    ExpressionAttributeValues: { ":now": new Date().toISOString(), ":one": 1 },
  }));
  return { status: "complete", profiles: profiles.length, seed_profiles: seeds.length, pairs_written: pairs, test_run_id: scope.testRunId };
}
