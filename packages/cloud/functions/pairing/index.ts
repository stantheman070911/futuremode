import { DeleteCommand, GetCommand, PutCommand, QueryCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { loadSession, profileIdForEmailHash } from "../shared/auth.js";
import { profileAnimalPersona, publicProfile, type OwnerPitchProfile } from "../shared/contracts.js";
import { json, parseJsonBody } from "../shared/http.js";
import { profileImageUrl } from "../shared/profile-image.js";
import { randomOpaqueToken, sha256 } from "../shared/security.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";
import { MATCHING_ALGORITHM_VERSION, MATCH_PAGE_SIZE } from "../shared/matching.js";

interface CurrentProfile extends Record<string, unknown> { profileId: string; versionId: string; email: string; emailHash?: string; displayName?: string; publicSlug?: string; visibility?: string; matchingState?: string; isTestProfile?: boolean; isManualTestProfile?: boolean; isJourneyTestProfile?: boolean; cleanupSafe?: boolean; testRunId?: string; testCohortId?: string; testScenarioKey?: string; testDisplayCode?: string; testAudienceEmailHashes?: string[]; isFixtureProfile?: boolean; fixtureAudienceEmailHash?: string; fixtureInvitationEnabled?: boolean; manualTestVisible?: boolean }
interface ProfileVersion extends Record<string, unknown> { profileId: string; versionId: string; displayName?: string; profile: OwnerPitchProfile }
interface Edge extends Record<string, unknown> {
  sk: string; pairId: string; ownerProfileId: string; ownerVersionId: string; candidateProfileId: string; candidateVersionId: string;
  compositeScore: number; strongestSignal?: string; whatWeBothCareAbout?: string; whyItMattersNow?: string; whatWeCouldDiscuss?: string; evidenceLabels?: string[];
}
interface ResultSetItem { candidateId: string; candidateVersionId: string; edgeSk: string; pairId: string }

const DAY = 86_400;
const INTEREST_INTENT_LIFETIME_SECONDS = 30 * DAY;
const INTEREST_INTENT_HOURLY_LIMIT = 30;
const RESULT_SET_FRESHNESS_SECONDS = 60;
const genericAnimal = "帶著好奇心探索的水獺";

function escapeHtml(value: unknown): string { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;"); }
function compact(value: unknown, max = 360): string { const result = String(value ?? "").replace(/\s+/g, " ").trim(); return result.length > max ? `${result.slice(0, max - 1)}…` : result; }
function profileIsPublic(current: Record<string, unknown> | undefined): current is CurrentProfile { return Boolean(current?.profileId && current.versionId && current.email && current.visibility !== "private" && String(current.matchingState ?? "active") === "active"); }
function stringList(value: unknown): string[] { return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []; }

export function ownerCanSeeCandidate(owner: Record<string, unknown>, candidate: Record<string, unknown>): boolean {
  if (owner.isTestProfile === true) {
    if (owner.cleanupSafe !== true || typeof owner.testRunId !== "string") return false;
    if (candidate.isTestProfile === true) return owner.cleanupSafe === true
      && candidate.cleanupSafe === true
      && owner.testRunId === candidate.testRunId;
    return (candidate.isFixtureProfile === true
      && candidate.cleanupSafe === true
      && candidate.manualTestVisible === true)
      || (owner.isJourneyTestProfile === true
      && typeof candidate.emailHash === "string"
      && stringList(owner.testAudienceEmailHashes).includes(candidate.emailHash));
  }
  if (candidate.isTestProfile === true) return Boolean(owner.emailHash
    && candidate.isJourneyTestProfile === true
    && candidate.cleanupSafe === true
    && stringList(candidate.testAudienceEmailHashes).includes(String(owner.emailHash)));
  if (candidate.isFixtureProfile === true) return Boolean(owner.emailHash && candidate.fixtureAudienceEmailHash === owner.emailHash);
  return true;
}

function testMetadata(record: Record<string, unknown>): Record<string, unknown> {
  if (record.isTestProfile !== true || record.cleanupSafe !== true || typeof record.testRunId !== "string") return {};
  return {
    isTestProfile: true,
    cleanupSafe: true,
    testRunId: record.testRunId,
    testCohortId: record.testCohortId,
    ...(record.isManualTestProfile === true ? { isManualTestProfile: true } : {}),
    ...(record.isJourneyTestProfile === true ? {
      isJourneyTestProfile: true,
      testScenarioKey: record.testScenarioKey,
      testDisplayCode: record.testDisplayCode,
      testAudienceEmailHashes: record.testAudienceEmailHashes,
    } : {}),
  };
}

function testPresentation(record: Record<string, unknown> | undefined): Record<string, unknown> {
  if (record?.isTestProfile !== true && record?.isFixtureProfile !== true) return {};
  return {
    is_synthetic: true,
    ...(typeof record.testDisplayCode === "string" ? { test_display_code: record.testDisplayCode } : {}),
  };
}

export function candidateCanReceiveInvitation(candidate: Record<string, unknown>): boolean {
  if (candidate.isFixtureProfile !== true) return true;
  const email = String(candidate.email ?? "").trim().toLowerCase();
  return candidate.fixtureInvitationEnabled === true && email.includes("@") && !email.endsWith(".invalid");
}

export function publicSimilarityScore(value: unknown): number {
  const score = Number(value);
  return Math.round(Math.max(0, Math.min(1, Number.isFinite(score) ? score : 0)) * 100);
}

export function resultSetNeedsRevisionCheck(input: { requested: boolean; refresh: boolean; empty?: boolean; createdAt?: unknown; nowMs?: number }): boolean {
  if (input.refresh) return true;
  // A pinned, non-empty result set must stay stable while the owner paginates.
  // An empty set created while the asynchronous matching run is still working
  // is not a useful stable snapshot: keep checking the graph revision so even
  // an older cached frontend can recover as soon as the edges are ready.
  if (input.requested) return input.empty === true;
  const createdAt = Date.parse(String(input.createdAt ?? ""));
  if (!Number.isFinite(createdAt)) return true;
  return (input.nowMs ?? Date.now()) - createdAt >= RESULT_SET_FRESHNESS_SECONDS * 1_000;
}

export function invitationEventAt(item: Record<string, unknown>, state: string, connection?: Record<string, unknown>): string | undefined {
  const value = state === "connected"
    ? connection?.connectedAt ?? item.respondedAt ?? item.createdAt
    : item.createdAt;
  return typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : undefined;
}

export function sortInvitationEntries<T extends Record<string, unknown>>(entries: T[]): T[] {
  return [...entries].sort((left, right) => {
    const leftTime = Date.parse(String(left.event_at ?? ""));
    const rightTime = Date.parse(String(right.event_at ?? ""));
    return (Number.isFinite(rightTime) ? rightTime : 0) - (Number.isFinite(leftTime) ? leftTime : 0);
  });
}

async function getCurrent(tableName: string, profileId: string): Promise<CurrentProfile | undefined> {
  return (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${profileId}`, sk: "CURRENT" }, ConsistentRead: true }))).Item as CurrentProfile | undefined;
}

async function getVersion(tableName: string, profileId: string, versionId: string): Promise<ProfileVersion | undefined> {
  return (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${profileId}`, sk: `VERSION#${versionId}` }, ConsistentRead: true }))).Item as ProfileVersion | undefined;
}

async function requirePublicOwner(tableName: string, profileId: string): Promise<CurrentProfile> {
  const current = await getCurrent(tableName, profileId);
  if (!current) throw new Error("profile_required");
  if (!profileIsPublic(current)) throw new Error("public_profile_required");
  return current;
}

async function queryEdges(tableName: string, profileId: string): Promise<Edge[]> {
  const result = await documentDynamo.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :edge)",
    ExpressionAttributeValues: { ":pk": `PROFILE#${profileId}`, ":edge": "EDGE#" },
    ScanIndexForward: true,
    ConsistentRead: true,
  }));
  return (result.Items ?? []) as Edge[];
}

async function graphRevision(tableName: string): Promise<number> {
  const item = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: "MATCHING_GRAPH", sk: "REVISION" }, ConsistentRead: true }))).Item;
  return Number(item?.revision ?? 0);
}

async function validEdges(tableName: string, owner: CurrentProfile): Promise<Edge[]> {
  const edges = await queryEdges(tableName, owner.profileId);
  const result: Edge[] = [];
  const seen = new Set<string>();
  for (const edge of edges) {
    if (edge.ownerVersionId !== owner.versionId || seen.has(edge.candidateProfileId)) continue;
    const candidate = await getCurrent(tableName, edge.candidateProfileId);
    if (!profileIsPublic(candidate) || candidate.versionId !== edge.candidateVersionId || !ownerCanSeeCandidate(owner, candidate)) continue;
    seen.add(edge.candidateProfileId); result.push(edge);
  }
  return result.sort((left, right) => Number(right.compositeScore) - Number(left.compositeScore) || left.candidateProfileId.localeCompare(right.candidateProfileId));
}

async function createResultSet(tableName: string, owner: CurrentProfile) {
  const [edges, revision] = await Promise.all([validEdges(tableName, owner), graphRevision(tableName)]);
  const resultSetId = randomOpaqueToken(18);
  const now = new Date().toISOString();
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * DAY;
  const fixtureMeta = testMetadata(owner);
  const items: ResultSetItem[] = edges.map((edge) => ({ candidateId: edge.candidateProfileId, candidateVersionId: edge.candidateVersionId, edgeSk: edge.sk, pairId: edge.pairId }));
  await documentDynamo.send(new TransactWriteCommand({ TransactItems: [
    { Put: { TableName: tableName, Item: { pk: `RESULT_SET#${resultSetId}`, sk: "META", entityType: "MATCH_RESULT_SET", resultSetId, ownerProfileId: owner.profileId, ownerVersionId: owner.versionId, graphRevision: revision, matchingAlgorithm: MATCHING_ALGORITHM_VERSION, items, createdAt: now, expiresAt, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
    { Put: { TableName: tableName, Item: { pk: `PROFILE#${owner.profileId}`, sk: "RESULT_SET_CURRENT", entityType: "MATCH_RESULT_POINTER", resultSetId, graphRevision: revision, createdAt: now, expiresAt, ...fixtureMeta } } },
  ] }));
  return { resultSetId, graphRevision: revision, items, expiresAt };
}

async function loadResultSet(tableName: string, owner: CurrentProfile, requested?: string, refresh = false) {
  const pointer = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${owner.profileId}`, sk: "RESULT_SET_CURRENT" }, ConsistentRead: true }))).Item;
  const id = requested || String(pointer?.resultSetId ?? "");
  const existing = id ? (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `RESULT_SET#${id}`, sk: "META" }, ConsistentRead: true }))).Item : undefined;
  const now = Math.floor(Date.now() / 1000);
  if (existing?.ownerProfileId === owner.profileId && existing.matchingAlgorithm !== MATCHING_ALGORITHM_VERSION) return createResultSet(tableName, owner);
  if (existing?.ownerProfileId === owner.profileId && Number(existing.expiresAt) > now) {
    const items = Array.isArray(existing.items) ? existing.items as ResultSetItem[] : [];
    const view = { resultSetId: id, graphRevision: Number(existing.graphRevision), items, expiresAt: Number(existing.expiresAt) };
    if (!resultSetNeedsRevisionCheck({ requested: Boolean(requested), refresh, empty: items.length === 0, createdAt: existing.createdAt })) return view;
    if (Number(existing.graphRevision) === await graphRevision(tableName)) return view;
  }
  if (requested && !refresh) throw new Error("result_set_not_found");
  return createResultSet(tableName, owner);
}

async function invitation(tableName: string, pairId: string) {
  return (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `INVITATION#${pairId}`, sk: "META" }, ConsistentRead: true }))).Item;
}

function validPublicSlug(value: unknown): string {
  const slug = String(value ?? "").trim();
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(slug)) throw new Error("interest_target_not_found");
  return slug;
}

async function publicTargetForSlug(tableName: string, slug: string): Promise<CurrentProfile> {
  const pointer = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PUBLIC_SLUG#${slug}`, sk: "PROFILE" }, ConsistentRead: true }))).Item;
  if (!pointer?.profileId) throw new Error("interest_target_not_found");
  const target = await getCurrent(tableName, String(pointer.profileId));
  if (!profileIsPublic(target)) throw new Error("interest_target_unavailable");
  return target;
}

async function publicTargetPresentation(tableName: string, target: CurrentProfile, publicSlug = target.publicSlug) {
  const version = await getVersion(tableName, target.profileId, target.versionId);
  if (!version?.profile) throw new Error("interest_target_not_found");
  const profile = publicProfile(version.profile);
  return {
    profile_id: target.profileId,
    public_slug: publicSlug,
    display_name: profileAnimalPersona(version.profile),
    animal_persona: profileAnimalPersona(version.profile),
    summary: profile.summary,
    profile_image_url: profileImageUrl(target, requiredEnvironment("PUBLIC_SITE_ORIGIN"), "thumbnail"),
    ...testPresentation(target),
  };
}

async function reserveInterestIntent(tableName: string, sourceIp: string) {
  const hour = Math.floor(Date.now() / 3_600_000);
  try {
    await documentDynamo.send(new UpdateCommand({
      TableName: tableName,
      Key: { pk: `RATE#INTEREST#${sha256(sourceIp || "unknown")}`, sk: `HOUR#${hour}` },
      UpdateExpression: "SET expiresAt = if_not_exists(expiresAt, :expires) ADD requests :one",
      ConditionExpression: "attribute_not_exists(requests) OR requests < :limit",
      ExpressionAttributeValues: { ":expires": Math.floor(Date.now() / 1000) + 2 * 3_600, ":one": 1, ":limit": INTEREST_INTENT_HOURLY_LIMIT },
    }));
  } catch (error) {
    if (error instanceof Error && /ConditionalCheckFailed/.test(error.name + error.message)) throw new Error("interest_rate_limited");
    throw error;
  }
}

async function createInterestIntent(tableName: string, rawSlug: unknown, sourceIp: string) {
  const slug = validPublicSlug(rawSlug);
  await reserveInterestIntent(tableName, sourceIp);
  const target = await publicTargetForSlug(tableName, slug);
  const token = randomOpaqueToken(32);
  const tokenHash = sha256(token);
  const now = new Date().toISOString();
  const expiresAt = Math.floor(Date.now() / 1000) + INTEREST_INTENT_LIFETIME_SECONDS;
  await documentDynamo.send(new PutCommand({
    TableName: tableName,
    Item: {
      pk: `INTEREST_INTENT#${tokenHash}`,
      sk: "META",
      entityType: "INTEREST_INTENT",
      targetProfileId: target.profileId,
      publicSlug: slug,
      source: "public_profile",
      status: "active",
      createdAt: now,
      expiresAt,
    },
    ConditionExpression: "attribute_not_exists(pk)",
  }));
  return {
    token,
    expires_at: new Date(expiresAt * 1000).toISOString(),
    target: await publicTargetPresentation(tableName, target, slug),
  };
}

async function claimInterest(tableName: string, ownerProfileId: string, rawToken: unknown) {
  const token = String(rawToken ?? "").trim();
  if (!token) throw new Error("interest_intent_invalid");
  const tokenHash = sha256(token);
  const key = { pk: `INTEREST_INTENT#${tokenHash}`, sk: "META" };
  const intent = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: key, ConsistentRead: true }))).Item;
  const nowEpoch = Math.floor(Date.now() / 1000);
  if (!intent || Number(intent.expiresAt) <= nowEpoch) throw new Error("interest_intent_invalid");
  if (intent.status === "claimed" && intent.ownerProfileId === ownerProfileId) {
    const target = await getCurrent(tableName, String(intent.targetProfileId));
    return { claimed: true, idempotent_replay: true, target: profileIsPublic(target) ? await publicTargetPresentation(tableName, target, String(intent.publicSlug ?? target.publicSlug ?? "")) : undefined };
  }
  if (intent.status !== "active") throw new Error("interest_intent_invalid");
  const target = await getCurrent(tableName, String(intent.targetProfileId));
  if (!profileIsPublic(target) || (target.publicSlug && target.publicSlug !== intent.publicSlug)) throw new Error("interest_target_unavailable");
  if (target.profileId === ownerProfileId) throw new Error("interest_self_not_allowed");
  const now = new Date().toISOString();
  try {
    await documentDynamo.send(new TransactWriteCommand({ TransactItems: [
      { Update: {
        TableName: tableName,
        Key: key,
        UpdateExpression: "SET #status = :claimed, ownerProfileId = :owner, claimedAt = :now",
        ConditionExpression: "#status = :active AND expiresAt > :epoch",
        ExpressionAttributeNames: { "#status": "status" },
        ExpressionAttributeValues: { ":claimed": "claimed", ":active": "active", ":owner": ownerProfileId, ":now": now, ":epoch": nowEpoch },
      } },
      { Put: {
        TableName: tableName,
        Item: {
          pk: `PROFILE#${ownerProfileId}`,
          sk: `INTEREST#${target.profileId}`,
          entityType: "PROFILE_INTEREST",
          ownerProfileId,
          targetProfileId: target.profileId,
          publicSlug: String(intent.publicSlug),
          source: String(intent.source ?? "public_profile"),
          createdAt: now,
        },
      } },
    ] }));
  } catch (error) {
    if (!(error instanceof Error) || !/ConditionalCheckFailed|TransactionCanceled/.test(error.name + error.message)) throw error;
    const replay = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: key, ConsistentRead: true }))).Item;
    if (replay?.status !== "claimed" || replay.ownerProfileId !== ownerProfileId) throw error;
    return { claimed: true, idempotent_replay: true, target: await publicTargetPresentation(tableName, target, String(intent.publicSlug)) };
  }
  return { claimed: true, idempotent_replay: false, target: await publicTargetPresentation(tableName, target, String(intent.publicSlug)) };
}

async function removeInterest(tableName: string, ownerProfileId: string, targetProfileId: unknown) {
  const target = String(targetProfileId ?? "").trim();
  if (!/^[a-f0-9]{32}$/.test(target)) throw new Error("interest_target_not_found");
  await documentDynamo.send(new DeleteCommand({ TableName: tableName, Key: { pk: `PROFILE#${ownerProfileId}`, sk: `INTEREST#${target}` } }));
  return { removed: true, target_profile_id: target };
}

function stateFor(invite: Record<string, unknown> | undefined, ownerId: string): string {
  if (!invite) return "suggested";
  if (invite.status === "connected") return "connected";
  if (invite.status === "not_now") return invite.senderProfileId === ownerId ? "outgoing" : "not_now";
  if (invite.status === "revoked") return "unavailable";
  return invite.senderProfileId === ownerId ? "outgoing" : "incoming";
}

async function edgeView(tableName: string, owner: CurrentProfile, item: ResultSetItem, detail = false) {
  const edge = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${owner.profileId}`, sk: item.edgeSk }, ConsistentRead: true }))).Item as Edge | undefined;
  const peerCurrent = await getCurrent(tableName, item.candidateId);
  if (!edge || edge.ownerVersionId !== owner.versionId || edge.candidateVersionId !== item.candidateVersionId || !profileIsPublic(peerCurrent) || peerCurrent.versionId !== item.candidateVersionId || !ownerCanSeeCandidate(owner, peerCurrent)) {
    return { match_id: item.pairId, state: "unavailable", unavailable: true };
  }
  const [peerVersion, invite] = await Promise.all([getVersion(tableName, item.candidateId, item.candidateVersionId), invitation(tableName, item.pairId)]);
  if (!peerVersion?.profile) return { match_id: item.pairId, state: "unavailable", unavailable: true };
  const shareable = publicProfile(peerVersion.profile);
  const origin = requiredEnvironment("PUBLIC_SITE_ORIGIN");
  return {
    match_id: item.pairId,
    state: stateFor(invite, owner.profileId),
    peer: {
      profile_id: item.candidateId,
      public_slug: peerCurrent.publicSlug,
      display_name: profileAnimalPersona(peerVersion.profile),
      animal_persona: profileAnimalPersona(peerVersion.profile),
      summary: shareable.summary,
      profile_image_url: profileImageUrl(peerCurrent, origin, detail ? "detail" : "thumbnail"),
      is_fixture: peerCurrent.isFixtureProfile === true,
      ...testPresentation(peerCurrent),
      ...(detail ? { profile: { ...shareable, animal_persona: profileAnimalPersona(peerVersion.profile) } } : {}),
    },
    strongest_shared_signal: edge.strongestSignal,
    similarity_score: publicSimilarityScore(edge.compositeScore),
    explanation: {
      what_we_both_care_about: edge.whatWeBothCareAbout,
      why_it_matters_now: edge.whyItMattersNow,
      what_we_could_discuss: edge.whatWeCouldDiscuss,
      evidence_labels: edge.evidenceLabels ?? ["interests", "active_problems"],
    },
    can_invite: !invite && candidateCanReceiveInvitation(peerCurrent),
  };
}

async function listResult(tableName: string, owner: CurrentProfile, requestedSet: string | undefined, page: number, refresh: boolean) {
  const set = await loadResultSet(tableName, owner, requestedSet, refresh);
  const { total, totalPages, safePage, items } = paginateResultSetItems(set.items, page);
  return {
    result_set_id: set.resultSetId,
    graph_revision: set.graphRevision,
    expires_at: new Date(set.expiresAt * 1000).toISOString(),
    page: safePage,
    page_size: MATCH_PAGE_SIZE,
    total,
    total_pages: totalPages,
    matches: await Promise.all(items.map((item) => edgeView(tableName, owner, item))),
  };
}

export function paginateResultSetItems(items: ResultSetItem[], page: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / MATCH_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    total,
    totalPages,
    safePage,
    items: items.slice((safePage - 1) * MATCH_PAGE_SIZE, safePage * MATCH_PAGE_SIZE),
  };
}

async function findAuthorizedEdge(tableName: string, owner: CurrentProfile, pairId: string): Promise<{ edge: Edge; peer: CurrentProfile; peerVersion: ProfileVersion }> {
  const edge = (await validEdges(tableName, owner)).find((candidate) => candidate.pairId === pairId);
  if (!edge) throw new Error("match_not_found");
  const peer = await getCurrent(tableName, edge.candidateProfileId);
  if (!profileIsPublic(peer)) throw new Error("peer_profile_not_found");
  const peerVersion = await getVersion(tableName, peer.profileId, peer.versionId);
  if (!peerVersion?.profile) throw new Error("peer_profile_not_found");
  return { edge, peer, peerVersion };
}

type EmailProfile = Pick<OwnerPitchProfile, "interests" | "motivations" | "active_problems" | "recurring_topics" | "friend_intent">;
type PublicProfile = Omit<OwnerPitchProfile, "history_scope" | "confidence">;
interface ProfilePresentation { display_name?: string; profile?: Partial<PublicProfile>; profile_image_url?: string; public_slug?: string }

const EMAIL_COLORS = { paper: "#f4f2ed", white: "#ffffff", ink: "#131313", muted: "#74746d", line: "#d3d0c7", blue: "#0f5ae0" } as const;

function emailShell(content: string): string {
  return `<!doctype html><html lang="zh-Hant"><body style="margin:0;background:${EMAIL_COLORS.paper};color:${EMAIL_COLORS.ink}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:${EMAIL_COLORS.paper}"><tr><td align="center" style="padding:20px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:${EMAIL_COLORS.white};border:1px solid ${EMAIL_COLORS.line};border-radius:2px;font-family:Arial,'Noto Sans TC',sans-serif;text-align:left"><tr><td style="padding:24px 20px">${content}</td></tr></table></td></tr></table></body></html>`;
}

function emailEyebrow(value: string): string {
  return `<div style="margin:0 0 18px;color:${EMAIL_COLORS.muted};font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase">${escapeHtml(value)}</div>`;
}

function emailList(title: string, values: string[]): string {
  return values.length ? `<div style="margin-top:18px;padding-top:16px;border-top:1px solid ${EMAIL_COLORS.line}"><div style="margin:0 0 8px;color:${EMAIL_COLORS.muted};font-size:11px;font-weight:700;letter-spacing:.08em">${escapeHtml(title)}</div><ul style="margin:0;padding-left:20px;line-height:1.6">${values.map((value) => `<li style="margin:0 0 5px">${escapeHtml(compact(value, 240))}</li>`).join("")}</ul></div>` : "";
}

function promptJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function promptProfile(presentation: ProfilePresentation): PublicProfile {
  const profile = presentation.profile ?? {};
  return {
    animal_persona: compact(profile.animal_persona ?? presentation.display_name ?? genericAnimal, 80),
    summary: compact(profile.summary, 480),
    interests: Array.isArray(profile.interests) ? profile.interests.map((item) => compact(item, 120)) : [],
    motivations: Array.isArray(profile.motivations) ? profile.motivations.map((item) => compact(item, 160)) : [],
    active_problems: Array.isArray(profile.active_problems) ? profile.active_problems.map((item) => compact(item, 180)) : [],
    recurring_topics: Array.isArray(profile.recurring_topics) ? profile.recurring_topics.map((item) => compact(item, 140)) : [],
    friend_intent: compact(profile.friend_intent, 320),
  };
}

export function buildFirstEmailPrompt(input: { sender: ProfilePresentation; recipient: ProfilePresentation; explanation?: Record<string, unknown> }): string {
  const sender = promptProfile(input.sender);
  const recipient = promptProfile(input.recipient);
  const explanation = input.explanation ?? {};
  const matchReason = {
    what_we_both_care_about: compact(explanation.whatWeBothCareAbout ?? explanation.what_we_both_care_about, 480),
    why_it_matters_now: compact(explanation.whyItMattersNow ?? explanation.why_it_matters_now, 480),
    what_we_could_discuss: compact(explanation.whatWeCouldDiscuss ?? explanation.what_we_could_discuss, 480),
  };
  return `<PITCHYOUROWNER_FIRST_EMAIL>
<TASK>
你正在協助 A 寫第一封 Email 給剛認識的 B。雙方已經同意這次介紹。請根據兩人的介紹與配對理由，寫出一封自然、專業、讓人想回覆的繁體中文 Email。
</TASK>
<A_PROFILE>
${promptJson(sender)}
</A_PROFILE>
<B_PROFILE>
${promptJson(recipient)}
</B_PROFILE>
<MATCH_REASON>
${promptJson(matchReason)}
</MATCH_REASON>
<INSTRUCTIONS>
請把信寫成 A 親自寄給 B 的第一人稱內容。
信件開頭需要自然說明：雙方是在 PitchYourOwner 上互相接受介紹後取得聯繫，讓收件者清楚知道這封信的來源。
清楚呈現 A 現在最值得被認識的專業方向、為什麼特別想認識 B、雙方最具體的交流主題、一個容易回覆的具體問題，以及一個低壓力的下一步。
語氣自然、具體、專業、有魅力，像真正理解雙方工作的共同朋友促成交流；內容約 180–260 個中文字。直接完成信件，不需要詢問其他問題。
</INSTRUCTIONS>
<OUTPUT_FORMAT>
主旨：《PitchYourOwner》{雙方最具體的交流主題}

內文：
{可以直接複製寄出的完整信件}
</OUTPUT_FORMAT>
</PITCHYOUROWNER_FIRST_EMAIL>`;
}

export function renderInvitationEmail(input: { inviterName: string; animal: string; summary: string; profile?: EmailProfile; reason: string; acceptUrl: string; profileUrl?: string }) {
  const title = `${input.animal} 想認識你`;
  const byline = compact(input.inviterName, 80) && compact(input.inviterName, 80) !== compact(input.animal, 80)
    ? `<p style="margin:10px 0 0;color:${EMAIL_COLORS.muted};font-size:14px">${escapeHtml(input.inviterName)}</p>`
    : "";
  const detail = input.profile ? `${emailList("興趣", input.profile.interests)}${emailList("動機", input.profile.motivations)}${emailList("正在解的問題", input.profile.active_problems)}${emailList("反覆討論", input.profile.recurring_topics)}<div style="margin-top:18px;padding-top:16px;border-top:1px solid ${EMAIL_COLORS.line}"><div style="margin-bottom:8px;color:${EMAIL_COLORS.muted};font-size:11px;font-weight:700;letter-spacing:.08em">想認識的人</div><p style="margin:0;line-height:1.6">${escapeHtml(compact(input.profile.friend_intent, 320))}</p></div>` : "";
  const textDetail = input.profile ? `\n\n興趣：${input.profile.interests.join("、")}\n動機：${input.profile.motivations.join("、")}\n正在解的問題：${input.profile.active_problems.join("、")}\n反覆討論：${input.profile.recurring_topics.join("、")}\n想認識的人：${input.profile.friend_intent}` : "";
  const content = `${emailEyebrow("PITCHYOUROWNER · 邀請")}<h1 style="margin:0;color:${EMAIL_COLORS.blue};font-size:28px;line-height:1.22;letter-spacing:-.02em;overflow-wrap:anywhere">${escapeHtml(title)}</h1>${byline}<p style="margin:20px 0 0;font-size:16px;line-height:1.65">${escapeHtml(compact(input.summary, 480))}</p>${detail}<div style="margin-top:22px;padding:18px 0;border-top:1px solid ${EMAIL_COLORS.line};border-bottom:1px solid ${EMAIL_COLORS.line}"><div style="margin-bottom:8px;color:${EMAIL_COLORS.muted};font-size:11px;font-weight:700;letter-spacing:.08em">為什麼值得聊</div><p style="margin:0;font-size:17px;font-weight:700;line-height:1.55">${escapeHtml(compact(input.reason, 480))}</p></div><a href="${escapeHtml(input.acceptUrl)}" style="display:block;margin:22px 0 12px;padding:15px 16px;background:${EMAIL_COLORS.blue};color:#ffffff;border:1px solid ${EMAIL_COLORS.blue};border-radius:2px;text-align:center;text-decoration:none;font-weight:700">查看介紹並決定</a>${input.profileUrl ? `<a href="${escapeHtml(input.profileUrl)}" style="display:block;padding:10px;text-align:center;color:${EMAIL_COLORS.blue};text-decoration:underline">公開介紹頁</a>` : ""}<p style="margin:20px 0 0;color:${EMAIL_COLORS.muted};font-size:12px;line-height:1.6">開啟連結不會自動接受。你必須在頁面上再次選擇「接受」或「現在不要」。連結 14 天內有效，請勿轉寄。</p>`;
  return { subject: `PitchYourOwner｜${input.inviterName} 想認識你`, text: `${title}\n\n${input.summary}${textDetail}\n\n為什麼值得聊：${input.reason}\n\n查看介紹並決定：${input.acceptUrl}\n\n開啟連結不會自動接受。這是單次使用的決定連結，請勿轉寄。`, html: emailShell(content) };
}

export function renderConnectionEmail(peerName: string, peerEmail: string, connectionUrl?: string) {
  const content = `${emailEyebrow("PITCHYOUROWNER · 連結成功")}<h1 style="margin:0;font-size:28px;line-height:1.22;letter-spacing:-.02em">你們都接受了</h1><p style="margin:18px 0 8px;line-height:1.6">${escapeHtml(peerName)} 的 Email：</p><div style="padding:14px;background:${EMAIL_COLORS.white};border:1px solid ${EMAIL_COLORS.line};border-radius:2px;font-size:18px;font-weight:700;overflow-wrap:anywhere"><a href="mailto:${escapeHtml(peerEmail)}" style="color:${EMAIL_COLORS.blue}">${escapeHtml(peerEmail)}</a></div>${connectionUrl ? `<a href="${escapeHtml(connectionUrl)}" style="display:block;margin:20px 0 0;padding:15px 16px;background:${EMAIL_COLORS.blue};color:#ffffff;border:1px solid ${EMAIL_COLORS.blue};border-radius:2px;text-align:center;text-decoration:none;font-weight:700">查看連結與撰寫第一封信</a>` : ""}<p style="margin:20px 0 0;color:${EMAIL_COLORS.muted};font-size:13px;line-height:1.6">請尊重對方的聯絡與回覆節奏。</p>`;
  return { subject: `PitchYourOwner｜你和 ${peerName} 都接受了`, text: `你們都接受了這次介紹。\n\n${peerName} 的 Email：${peerEmail}${connectionUrl ? `\n\n查看連結與撰寫第一封信：${connectionUrl}` : ""}\n\n請尊重對方的聯絡與回覆節奏。`, html: emailShell(content) };
}

async function sendInvite(tableName: string, owner: CurrentProfile, pairId: string) {
  const existing = await invitation(tableName, pairId);
  if (existing) {
    if (existing.senderProfileId !== owner.profileId) throw new Error("invitation_already_exists");
    return { invitation_id: pairId, state: stateFor(existing, owner.profileId), idempotent_replay: true };
  }
  const { edge, peer, peerVersion } = await findAuthorizedEdge(tableName, owner, pairId);
  if (!candidateCanReceiveInvitation(peer)) throw new Error("fixture_invitation_unavailable");
  const ownVersion = await getVersion(tableName, owner.profileId, owner.versionId);
  if (!ownVersion?.profile) throw new Error("profile_required");
  const rawToken = randomOpaqueToken(32);
  const tokenHash = sha256(rawToken);
  const eventId = randomOpaqueToken(18);
  const now = new Date().toISOString();
  const expiresAt = Math.floor(Date.now() / 1000) + 14 * DAY;
  const origin = requiredEnvironment("PUBLIC_SITE_ORIGIN").replace(/\/$/, "");
  const email = renderInvitationEmail({
    inviterName: profileAnimalPersona(ownVersion.profile), animal: profileAnimalPersona(ownVersion.profile), summary: ownVersion.profile.summary, profile: publicProfile(ownVersion.profile),
    reason: String(edge.whatWeBothCareAbout ?? edge.strongestSignal ?? "你們有值得深入聊的共同關注。"), acceptUrl: `${origin}/accept#token=${encodeURIComponent(rawToken)}`,
    profileUrl: owner.publicSlug ? `${origin}/p/${encodeURIComponent(owner.publicSlug)}` : undefined,
  });
  const fixtureMeta = testMetadata(owner);
  const capturedTestDelivery = owner.isManualTestProfile === true
    && peer.isManualTestProfile === true
    && owner.testCohortId === peer.testCohortId
    && peer.email.endsWith("@futuremode.test");
  const snapshot = { display_name: profileAnimalPersona(ownVersion.profile), public_slug: owner.publicSlug, profile_image_url: profileImageUrl(owner, origin, "detail"), profile: { ...publicProfile(ownVersion.profile), animal_persona: profileAnimalPersona(ownVersion.profile) }, ...testPresentation(owner) };
  const writes: ConstructorParameters<typeof TransactWriteCommand>[0]["TransactItems"] = [
    { Put: { TableName: tableName, Item: { pk: `INVITATION#${pairId}`, sk: "META", entityType: "INVITATION", pairId, senderProfileId: owner.profileId, recipientProfileId: peer.profileId, senderEmail: owner.email, recipientEmail: peer.email, senderSnapshot: snapshot, explanation: { whatWeBothCareAbout: edge.whatWeBothCareAbout, whyItMattersNow: edge.whyItMattersNow, whatWeCouldDiscuss: edge.whatWeCouldDiscuss, evidenceLabels: edge.evidenceLabels }, status: "pending", tokenHash, createdAt: now, expiresAt, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
    { Put: { TableName: tableName, Item: { pk: `INVITE_TOKEN#${tokenHash}`, sk: "META", entityType: "INVITATION_TOKEN", pairId, status: "active", createdAt: now, expiresAt, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
    { Put: { TableName: tableName, Item: { pk: `PROFILE#${owner.profileId}`, sk: `INVITE#${now}#${pairId}`, entityType: "INVITATION_POINTER", pairId, role: "sender", createdAt: now, expiresAt, ...fixtureMeta } } },
    { Put: { TableName: tableName, Item: { pk: `PROFILE#${peer.profileId}`, sk: `INVITE#${now}#${pairId}`, entityType: "INVITATION_POINTER", pairId, role: "recipient", createdAt: now, expiresAt, ...fixtureMeta } } },
    { Put: { TableName: tableName, Item: { pk: `OUTBOX#${eventId}`, sk: "META", entityType: "EMAIL_OUTBOX", eventId, kind: "invitation", pairId, ownerProfileId: owner.profileId, peerProfileId: peer.profileId, status: capturedTestDelivery ? "CAPTURED" : "PENDING", to: peer.email, ...email, createdAt: now, expiresAt: expiresAt + 7 * DAY, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
    { Delete: { TableName: tableName, Key: { pk: `PROFILE#${owner.profileId}`, sk: `INTEREST#${peer.profileId}` } } },
  ];
  if (capturedTestDelivery) writes.push({ Put: { TableName: tableName, Item: {
    pk: `PROFILE#${peer.profileId}`,
    sk: `TEST_INBOX#${now}#${pairId}`,
    entityType: "MANUAL_TEST_INBOX",
    pairId,
    fromProfileId: owner.profileId,
    fromDisplayName: profileAnimalPersona(ownVersion.profile),
    acceptUrl: `${origin}/accept#token=${encodeURIComponent(rawToken)}`,
    createdAt: now,
    expiresAt,
    ...fixtureMeta,
  }, ConditionExpression: "attribute_not_exists(pk)" } });
  await documentDynamo.send(new TransactWriteCommand({ TransactItems: writes }));
  return { invitation_id: pairId, state: "outgoing", idempotent_replay: false };
}

async function previewToken(tableName: string, rawToken: string) {
  const hash = sha256(rawToken);
  const token = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `INVITE_TOKEN#${hash}`, sk: "META" }, ConsistentRead: true }))).Item;
  if (!token || token.status !== "active" || Number(token.expiresAt) <= Math.floor(Date.now() / 1000)) throw new Error("invitation_token_invalid");
  const invite = await invitation(tableName, String(token.pairId));
  if (!invite || invite.status !== "pending" || invite.tokenHash !== hash) throw new Error("invitation_token_invalid");
  return { token, invite };
}

async function respondToken(tableName: string, rawToken: string, decision: "accept" | "not_now") {
  const { token, invite } = await previewToken(tableName, rawToken);
  const now = new Date().toISOString();
  const hash = sha256(rawToken);
  const transaction: ConstructorParameters<typeof TransactWriteCommand>[0]["TransactItems"] = [
    { Update: { TableName: tableName, Key: { pk: `INVITE_TOKEN#${hash}`, sk: "META" }, UpdateExpression: "SET #status = :used, usedAt = :now", ConditionExpression: "#status = :active AND expiresAt > :epoch", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":used": "used", ":active": "active", ":now": now, ":epoch": Math.floor(Date.now() / 1000) } } },
    { Update: { TableName: tableName, Key: { pk: `INVITATION#${token.pairId}`, sk: "META" }, UpdateExpression: "SET #status = :decision, respondedAt = :now", ConditionExpression: "#status = :pending AND tokenHash = :hash", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":decision": decision === "accept" ? "connected" : "not_now", ":pending": "pending", ":hash": hash, ":now": now } } },
  ];
  if (decision === "accept") {
    const fixtureMeta = testMetadata(invite);
    const capturedTestDelivery = invite.isManualTestProfile === true;
    const eventA = randomOpaqueToken(18); const eventB = randomOpaqueToken(18);
    const origin = requiredEnvironment("PUBLIC_SITE_ORIGIN").replace(/\/$/, "");
    const senderName = String((invite.senderSnapshot as Record<string, unknown>)?.display_name ?? "另一位 owner");
    const recipient = await getCurrent(tableName, String(invite.recipientProfileId));
    const recipientVersion = recipient ? await getVersion(tableName, recipient.profileId, recipient.versionId) : undefined;
    const recipientName = recipientVersion?.profile ? profileAnimalPersona(recipientVersion.profile) : "另一位 owner";
    const recipientSnapshot = recipientVersion?.profile ? { display_name: recipientName, public_slug: recipient?.publicSlug, profile_image_url: profileImageUrl(recipient, origin, "detail"), profile: { ...publicProfile(recipientVersion.profile), animal_persona: profileAnimalPersona(recipientVersion.profile) }, ...testPresentation(recipient) } : { display_name: recipientName, profile: { animal_persona: genericAnimal } };
    const connectionUrl = `${origin}/connections/${encodeURIComponent(String(token.pairId))}`;
    const emailA = renderConnectionEmail(recipientName, String(invite.recipientEmail), connectionUrl);
    const emailB = renderConnectionEmail(senderName, String(invite.senderEmail), connectionUrl);
    transaction.push(
      { Put: { TableName: tableName, Item: { pk: `PROFILE#${invite.senderProfileId}`, sk: `CONNECTION#${token.pairId}`, entityType: "CONNECTION", pairId: token.pairId, peerProfileId: invite.recipientProfileId, peerEmail: invite.recipientEmail, peerDisplayName: recipientName, peerSnapshot: recipientSnapshot, explanation: invite.explanation, connectedAt: now, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
      { Put: { TableName: tableName, Item: { pk: `PROFILE#${invite.recipientProfileId}`, sk: `CONNECTION#${token.pairId}`, entityType: "CONNECTION", pairId: token.pairId, peerProfileId: invite.senderProfileId, peerEmail: invite.senderEmail, peerDisplayName: senderName, peerSnapshot: invite.senderSnapshot, explanation: invite.explanation, connectedAt: now, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
      { Put: { TableName: tableName, Item: { pk: `OUTBOX#${eventA}`, sk: "META", entityType: "EMAIL_OUTBOX", eventId: eventA, kind: "connection", pairId: token.pairId, ownerProfileId: invite.senderProfileId, peerProfileId: invite.recipientProfileId, status: capturedTestDelivery ? "CAPTURED" : "PENDING", to: invite.senderEmail, ...emailA, createdAt: now, expiresAt: Math.floor(Date.now() / 1000) + 21 * DAY, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
      { Put: { TableName: tableName, Item: { pk: `OUTBOX#${eventB}`, sk: "META", entityType: "EMAIL_OUTBOX", eventId: eventB, kind: "connection", pairId: token.pairId, ownerProfileId: invite.recipientProfileId, peerProfileId: invite.senderProfileId, status: capturedTestDelivery ? "CAPTURED" : "PENDING", to: invite.recipientEmail, ...emailB, createdAt: now, expiresAt: Math.floor(Date.now() / 1000) + 21 * DAY, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
    );
  }
  await documentDynamo.send(new TransactWriteCommand({ TransactItems: transaction }));
  return { state: decision === "accept" ? "connected" : "not_now", connection_id: decision === "accept" ? token.pairId : undefined };
}

async function manualTestInbox(tableName: string, owner: CurrentProfile) {
  const cohortId = process.env.MANUAL_TEST_COHORT_ID;
  if (!cohortId || owner.isManualTestProfile !== true || owner.cleanupSafe !== true || owner.testCohortId !== cohortId) {
    throw new Error("manual_test_inbox_unavailable");
  }
  const result = await documentDynamo.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
    ExpressionAttributeValues: { ":pk": `PROFILE#${owner.profileId}`, ":prefix": "TEST_INBOX#" },
    ScanIndexForward: false,
    ConsistentRead: true,
  }));
  return { messages: (result.Items ?? []).map((item) => ({
    invitation_id: item.pairId,
    from_display_name: item.fromDisplayName,
    accept_url: item.acceptUrl,
    created_at: item.createdAt,
    expires_at: new Date(Number(item.expiresAt) * 1000).toISOString(),
  })) };
}

async function connectionView(tableName: string, ownerId: string, pairId: string) {
  const connection = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${ownerId}`, sk: `CONNECTION#${pairId}` }, ConsistentRead: true }))).Item;
  if (!connection) throw new Error("connection_not_found");
  const peerId = String(connection.peerProfileId);
  const [peer, reciprocal, owner] = await Promise.all([
    getCurrent(tableName, peerId),
    documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${peerId}`, sk: `CONNECTION#${pairId}` }, ConsistentRead: true })).then((result) => result.Item),
    getCurrent(tableName, ownerId),
  ]);
  const [peerVersion, ownerVersion] = await Promise.all([
    profileIsPublic(peer) ? getVersion(tableName, peer.profileId, peer.versionId) : undefined,
    owner ? getVersion(tableName, owner.profileId, owner.versionId) : undefined,
  ]);
  const origin = requiredEnvironment("PUBLIC_SITE_ORIGIN");
  const peerFallback = peerVersion?.profile ? { display_name: profileAnimalPersona(peerVersion.profile), public_slug: peer?.publicSlug, profile_image_url: profileImageUrl(peer, origin, "detail"), profile: { ...publicProfile(peerVersion.profile), animal_persona: profileAnimalPersona(peerVersion.profile) } } : undefined;
  const ownerFallback = ownerVersion?.profile ? { display_name: profileAnimalPersona(ownerVersion.profile), public_slug: owner?.publicSlug, profile_image_url: profileImageUrl(owner, origin, "detail"), profile: { ...publicProfile(ownerVersion.profile), animal_persona: profileAnimalPersona(ownerVersion.profile) } } : undefined;
  const peerSnapshot = (connection.peerSnapshot ?? peerFallback ?? { display_name: genericAnimal, profile: { animal_persona: genericAnimal } }) as ProfilePresentation;
  const selfSnapshot = (reciprocal?.peerSnapshot ?? ownerFallback ?? { display_name: genericAnimal, profile: { animal_persona: genericAnimal } }) as ProfilePresentation;
  return {
    connection_id: pairId,
    connected_at: connection.connectedAt,
    self: selfSnapshot,
    peer: { ...peerSnapshot, ...(peer ? { public_slug: peer.publicSlug, profile_image_url: profileImageUrl(peer, origin, "detail"), ...testPresentation(peer) } : {}), contact_email: connection.peerEmail },
    explanation: connection.explanation,
    first_email_prompt: buildFirstEmailPrompt({ sender: selfSnapshot, recipient: peerSnapshot, explanation: connection.explanation as Record<string, unknown> | undefined }),
  };
}

async function invitationLists(tableName: string, ownerId: string) {
  const pointers = await documentDynamo.send(new QueryCommand({ TableName: tableName, KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)", ExpressionAttributeValues: { ":pk": `PROFILE#${ownerId}`, ":prefix": "INVITE#" }, ScanIndexForward: false, ConsistentRead: true }));
  const items = await Promise.all((pointers.Items ?? []).map(async (pointer) => invitation(tableName, String(pointer.pairId))));
  const view = async (item: Record<string, unknown>, state: string) => {
    const peerId = item.senderProfileId === ownerId ? String(item.recipientProfileId) : String(item.senderProfileId);
    const peer = await getCurrent(tableName, peerId);
    const version = profileIsPublic(peer) ? await getVersion(tableName, peerId, peer.versionId) : undefined;
    const senderSnapshot = item.senderSnapshot as { display_name?: string; profile?: OwnerPitchProfile } | undefined;
    const connection = state === "connected" ? (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${ownerId}`, sk: `CONNECTION#${item.pairId}` }, ConsistentRead: true }))).Item : undefined;
    const connectedSnapshot = connection?.peerSnapshot as { display_name?: string; profile?: OwnerPitchProfile } | undefined;
    const permittedSenderSnapshot = peerId === item.senderProfileId ? senderSnapshot : undefined;
    const profile = version?.profile ?? connectedSnapshot?.profile ?? permittedSenderSnapshot?.profile;
    const displayName = profile ? profileAnimalPersona(profile) : connectedSnapshot?.display_name ?? permittedSenderSnapshot?.display_name ?? "另一位 owner";
    return {
      match_id: item.pairId,
      connection_id: state === "connected" ? item.pairId : undefined,
      state,
      event_at: invitationEventAt(item, state, connection),
      event_type: state === "incoming" ? "received" : state === "outgoing" ? "sent" : "connected",
      peer: { display_name: displayName, animal_persona: profileAnimalPersona(profile), summary: profile?.summary ?? "", profile_image_url: profileImageUrl(peer, requiredEnvironment("PUBLIC_SITE_ORIGIN"), "thumbnail"), ...testPresentation(peer) },
      explanation: { what_we_both_care_about: (item.explanation as Record<string, unknown>)?.whatWeBothCareAbout ?? "你們有一個值得深入聊的共同關注。", evidence_labels: (item.explanation as Record<string, unknown>)?.evidenceLabels ?? [] },
    };
  };
  const invitationPeerIds = new Set(items.flatMap((item) => {
    if (!item) return [];
    return [String(item.senderProfileId) === ownerId ? String(item.recipientProfileId) : String(item.senderProfileId)];
  }));
  const interestPointers = await documentDynamo.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
    ExpressionAttributeValues: { ":pk": `PROFILE#${ownerId}`, ":prefix": "INTEREST#" },
    ScanIndexForward: false,
    ConsistentRead: true,
  }));
  const owner = await getCurrent(tableName, ownerId);
  const edges = owner && profileIsPublic(owner) ? await validEdges(tableName, owner) : [];
  const interested = (await Promise.all((interestPointers.Items ?? []).map(async (interest) => {
    const targetProfileId = String(interest.targetProfileId ?? "");
    if (!targetProfileId || invitationPeerIds.has(targetProfileId)) return undefined;
    const target = await getCurrent(tableName, targetProfileId);
    if (!profileIsPublic(target) || !ownerCanSeeCandidate(owner ?? {}, target)) return undefined;
    const version = await getVersion(tableName, target.profileId, target.versionId);
    if (!version?.profile) return undefined;
    const edge = edges.find((candidate) => candidate.candidateProfileId === target.profileId);
    if (edge && owner) {
      const match = await edgeView(tableName, owner, { candidateId: target.profileId, candidateVersionId: target.versionId, edgeSk: edge.sk, pairId: edge.pairId });
      if (match.unavailable) return undefined;
      return { ...match, state: "interested", target_profile_id: target.profileId, interested_at: interest.createdAt, event_at: interest.createdAt, event_type: "interested", source: interest.source };
    }
    const peer = await publicTargetPresentation(tableName, target, String(interest.publicSlug ?? target.publicSlug ?? ""));
    return { target_profile_id: target.profileId, state: "preparing", interested_at: interest.createdAt, event_at: interest.createdAt, event_type: "interested", source: interest.source, peer };
  }))).filter(Boolean) as Array<Record<string, unknown>>;
  const [incoming, outgoing, connected] = await Promise.all([
    Promise.all(items.filter((item) => item?.recipientProfileId === ownerId && item.status === "pending").map((item) => view(item!, "incoming"))),
    Promise.all(items.filter((item) => item?.senderProfileId === ownerId && item.status === "pending").map((item) => view(item!, "outgoing"))),
    Promise.all(items.filter((item) => item?.status === "connected").map((item) => view(item!, "connected"))),
  ]);
  return {
    incoming: sortInvitationEntries(incoming),
    interested: sortInvitationEntries(interested),
    outgoing: sortInvitationEntries(outgoing),
    connected: sortInvitationEntries(connected),
  };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const tableName = requiredEnvironment("TABLE_NAME");
    const method = event.requestContext.http.method;
    if (method === "POST" && event.rawPath === "/v1/interest-intents") {
      const body = parseJsonBody(event.body) as { public_slug?: unknown };
      return json(201, await createInterestIntent(tableName, body.public_slug, event.requestContext.http.sourceIp));
    }
    if (method === "POST" && event.rawPath === "/v1/invitation-tokens/preview") {
      const body = parseJsonBody(event.body) as { token?: unknown };
      const { invite } = await previewToken(tableName, String(body.token ?? ""));
      const sender = await getCurrent(tableName, String(invite.senderProfileId));
      const inviter = { ...(invite.senderSnapshot as Record<string, unknown>), ...(sender ? { public_slug: sender.publicSlug, profile_image_url: profileImageUrl(sender, requiredEnvironment("PUBLIC_SITE_ORIGIN"), "detail"), ...testPresentation(sender) } : {}) };
      return json(200, { invitation_id: invite.pairId, expires_at: new Date(Number(invite.expiresAt) * 1000).toISOString(), inviter, explanation: invite.explanation });
    }
    if (method === "POST" && event.rawPath === "/v1/invitation-tokens/respond") {
      const body = parseJsonBody(event.body) as { token?: unknown; decision?: unknown };
      if (body.decision !== "accept" && body.decision !== "not_now") return json(400, { error: "invalid_invitation_decision" });
      return json(200, await respondToken(tableName, String(body.token ?? ""), body.decision));
    }
    const session = await loadSession(event.headers.authorization);
    const profileId = profileIdForEmailHash(session.emailHash);
    if (method === "POST" && event.rawPath === "/v1/interests/claim") {
      const body = parseJsonBody(event.body) as { token?: unknown };
      return json(200, await claimInterest(tableName, profileId, body.token));
    }
    if (method === "DELETE" && event.pathParameters?.targetProfileId) {
      return json(200, await removeInterest(tableName, profileId, event.pathParameters.targetProfileId));
    }
    const pairId = event.pathParameters?.matchId || event.pathParameters?.connectionId;
    if (method === "GET" && event.rawPath === "/v1/invitations") return json(200, await invitationLists(tableName, profileId));
    if (method === "GET" && event.rawPath === "/v1/manual-test/inbox") {
      const current = await getCurrent(tableName, profileId);
      if (!current) throw new Error("profile_required");
      return json(200, await manualTestInbox(tableName, current));
    }
    if (method === "GET" && event.pathParameters?.connectionId) return json(200, await connectionView(tableName, profileId, String(event.pathParameters.connectionId)));
    const owner = await requirePublicOwner(tableName, profileId);
    if (method === "GET" && event.rawPath === "/v1/matches") {
      const page = Number.parseInt(event.queryStringParameters?.page ?? "1", 10) || 1;
      return json(200, await listResult(tableName, owner, event.queryStringParameters?.set, page, false));
    }
    if (method === "POST" && event.rawPath === "/v1/matches/refresh") return json(200, await listResult(tableName, owner, event.queryStringParameters?.set, 1, true));
    if (method === "GET" && pairId) {
      const result = await findAuthorizedEdge(tableName, owner, pairId);
      return json(200, await edgeView(tableName, owner, { candidateId: result.peer.profileId, candidateVersionId: result.peer.versionId, edgeSk: result.edge.sk, pairId }, true));
    }
    if (method === "POST" && pairId && event.rawPath.endsWith("/invitations")) return json(200, await sendInvite(tableName, owner, pairId));
    return json(404, { error: "route_not_found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "pairing_failed";
    if (/session|bearer/.test(message)) return json(401, { error: "invalid_cloud_session" });
    if (["profile_required", "public_profile_required", "fixture_invitation_unavailable", "interest_self_not_allowed"].includes(message)) return json(409, { error: message });
    if (message === "interest_target_not_found") return json(404, { error: message });
    if (message === "interest_target_unavailable") return json(410, { error: message });
    if (message === "interest_intent_invalid") return json(410, { error: message });
    if (message === "interest_rate_limited") return json(429, { error: message, retryAfterSeconds: 3600 });
    if (message === "manual_test_inbox_unavailable") return json(404, { error: message });
    if (["match_not_found", "peer_profile_not_found", "result_set_not_found", "connection_not_found"].includes(message)) return json(404, { error: message });
    if (message.includes("invitation_token_invalid")) return json(410, { error: "invitation_token_invalid" });
    if (message.includes("ConditionalCheckFailed") || message.includes("TransactionCanceled")) return json(409, { error: "invitation_already_answered" });
    console.error(JSON.stringify({ event: "pairing_failed", message }));
    return json(503, { error: "pairing_failed" });
  }
}
