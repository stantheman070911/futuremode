import { GetCommand, PutCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { loadSession, profileIdForEmailHash } from "../shared/auth.js";
import { profileAnimalPersona, publicProfile, type OwnerPitchProfile } from "../shared/contracts.js";
import { json, parseJsonBody } from "../shared/http.js";
import { randomOpaqueToken, sha256 } from "../shared/security.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

interface CurrentProfile extends Record<string, unknown> { profileId: string; versionId: string; email: string; emailHash?: string; displayName?: string; publicSlug?: string; visibility?: string; matchingState?: string; isTestProfile?: boolean; cleanupSafe?: boolean; testRunId?: string; isFixtureProfile?: boolean; fixtureAudienceEmailHash?: string; fixtureInvitationEnabled?: boolean }
interface ProfileVersion extends Record<string, unknown> { profileId: string; versionId: string; displayName?: string; profile: OwnerPitchProfile }
interface Edge extends Record<string, unknown> {
  sk: string; pairId: string; ownerProfileId: string; ownerVersionId: string; candidateProfileId: string; candidateVersionId: string;
  compositeScore: number; strongestSignal?: string; whatWeBothCareAbout?: string; whyItMattersNow?: string; whatWeCouldDiscuss?: string; evidenceLabels?: string[];
}
interface ResultSetItem { candidateId: string; candidateVersionId: string; edgeSk: string; pairId: string }

const DAY = 86_400;
const PAGE_SIZE = 10;
const RESULT_SET_FRESHNESS_SECONDS = 60;
const genericAnimal = "帶著好奇心探索的水獺";

function escapeHtml(value: unknown): string { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;"); }
function compact(value: unknown, max = 360): string { const result = String(value ?? "").replace(/\s+/g, " ").trim(); return result.length > max ? `${result.slice(0, max - 1)}…` : result; }
function profileIsPublic(current: Record<string, unknown> | undefined): current is CurrentProfile { return Boolean(current?.profileId && current.versionId && current.email && current.visibility !== "private" && String(current.matchingState ?? "active") === "active"); }

export function ownerCanSeeCandidate(owner: Record<string, unknown>, candidate: Record<string, unknown>): boolean {
  if (candidate.isFixtureProfile === true) return Boolean(owner.emailHash && candidate.fixtureAudienceEmailHash === owner.emailHash);
  if (candidate.isTestProfile === true) return owner.isTestProfile === true && owner.testRunId === candidate.testRunId;
  return true;
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

export function resultSetNeedsRevisionCheck(input: { requested: boolean; refresh: boolean; createdAt?: unknown; nowMs?: number }): boolean {
  if (input.refresh) return true;
  if (input.requested) return false;
  const createdAt = Date.parse(String(input.createdAt ?? ""));
  if (!Number.isFinite(createdAt)) return true;
  return (input.nowMs ?? Date.now()) - createdAt >= RESULT_SET_FRESHNESS_SECONDS * 1_000;
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
  const fixtureMeta = owner.isTestProfile === true && owner.cleanupSafe === true && owner.testRunId ? { isTestProfile: true, cleanupSafe: true, testRunId: owner.testRunId } : {};
  const items: ResultSetItem[] = edges.map((edge) => ({ candidateId: edge.candidateProfileId, candidateVersionId: edge.candidateVersionId, edgeSk: edge.sk, pairId: edge.pairId }));
  await documentDynamo.send(new TransactWriteCommand({ TransactItems: [
    { Put: { TableName: tableName, Item: { pk: `RESULT_SET#${resultSetId}`, sk: "META", entityType: "MATCH_RESULT_SET", resultSetId, ownerProfileId: owner.profileId, ownerVersionId: owner.versionId, graphRevision: revision, items, createdAt: now, expiresAt, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
    { Put: { TableName: tableName, Item: { pk: `PROFILE#${owner.profileId}`, sk: "RESULT_SET_CURRENT", entityType: "MATCH_RESULT_POINTER", resultSetId, graphRevision: revision, createdAt: now, expiresAt, ...fixtureMeta } } },
  ] }));
  return { resultSetId, graphRevision: revision, items, expiresAt };
}

async function loadResultSet(tableName: string, owner: CurrentProfile, requested?: string, refresh = false) {
  const pointer = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${owner.profileId}`, sk: "RESULT_SET_CURRENT" }, ConsistentRead: true }))).Item;
  const id = requested || String(pointer?.resultSetId ?? "");
  const existing = id ? (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `RESULT_SET#${id}`, sk: "META" }, ConsistentRead: true }))).Item : undefined;
  const now = Math.floor(Date.now() / 1000);
  if (existing?.ownerProfileId === owner.profileId && Number(existing.expiresAt) > now) {
    const view = { resultSetId: id, graphRevision: Number(existing.graphRevision), items: existing.items as ResultSetItem[], expiresAt: Number(existing.expiresAt) };
    if (!resultSetNeedsRevisionCheck({ requested: Boolean(requested), refresh, createdAt: existing.createdAt })) return view;
    if (Number(existing.graphRevision) === await graphRevision(tableName)) return { resultSetId: id, graphRevision: Number(existing.graphRevision), items: existing.items as ResultSetItem[], expiresAt: Number(existing.expiresAt) };
  }
  if (requested && !refresh) throw new Error("result_set_not_found");
  return createResultSet(tableName, owner);
}

async function invitation(tableName: string, pairId: string) {
  return (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `INVITATION#${pairId}`, sk: "META" }, ConsistentRead: true }))).Item;
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
  return {
    match_id: item.pairId,
    state: stateFor(invite, owner.profileId),
    peer: {
      profile_id: item.candidateId,
      public_slug: peerCurrent.publicSlug,
      display_name: profileAnimalPersona(peerVersion.profile),
      animal_persona: profileAnimalPersona(peerVersion.profile),
      summary: shareable.summary,
      is_fixture: peerCurrent.isFixtureProfile === true,
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
  const total = set.items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const slice = set.items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  return {
    result_set_id: set.resultSetId,
    graph_revision: set.graphRevision,
    expires_at: new Date(set.expiresAt * 1000).toISOString(),
    page: safePage,
    page_size: PAGE_SIZE,
    total,
    total_pages: totalPages,
    matches: await Promise.all(slice.map((item) => edgeView(tableName, owner, item))),
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
function emailList(title: string, values: string[]): string {
  return values.length ? `<h3 style="margin:20px 0 6px">${escapeHtml(title)}</h3><ul style="margin:0;padding-left:22px;line-height:1.65">${values.map((value) => `<li>${escapeHtml(compact(value, 240))}</li>`).join("")}</ul>` : "";
}

export function renderInvitationEmail(input: { inviterName: string; animal: string; summary: string; profile?: EmailProfile; reason: string; acceptUrl: string; profileUrl?: string }) {
  const title = `${input.animal} 想認識你`;
  const detail = input.profile ? `${emailList("興趣", input.profile.interests)}${emailList("動機", input.profile.motivations)}${emailList("正在解的問題", input.profile.active_problems)}${emailList("反覆討論", input.profile.recurring_topics)}<h3 style="margin:20px 0 6px">想認識的人</h3><p style="line-height:1.6">${escapeHtml(compact(input.profile.friend_intent, 320))}</p>` : "";
  const textDetail = input.profile ? `\n\n興趣：${input.profile.interests.join("、")}\n動機：${input.profile.motivations.join("、")}\n正在解的問題：${input.profile.active_problems.join("、")}\n反覆討論：${input.profile.recurring_topics.join("、")}\n想認識的人：${input.profile.friend_intent}` : "";
  const body = `<div style="max-width:680px;margin:auto;padding:20px;font-family:Arial,'Noto Sans TC',sans-serif;color:#17213d;background:#fff6ec"><div style="border:3px solid #17213d;border-radius:24px;box-shadow:8px 8px 0 #17213d;background:#fffdf8;overflow:hidden"><div style="padding:22px;background:#ffcf55;border-bottom:3px solid #17213d"><div style="font-weight:900">PitchYourOwner 邀請</div><h1 style="margin:8px 0 0">${escapeHtml(title)}</h1></div><div style="padding:22px"><h2>${escapeHtml(input.inviterName)}</h2><p style="line-height:1.6">${escapeHtml(compact(input.summary, 480))}</p>${detail}<h3>為什麼值得聊</h3><p style="line-height:1.6">${escapeHtml(compact(input.reason, 480))}</p><a href="${escapeHtml(input.acceptUrl)}" style="display:block;margin:24px 0 14px;padding:17px;background:#7258e8;color:#fff;border:3px solid #17213d;border-radius:18px;text-align:center;text-decoration:none;font-weight:900">查看介紹並決定</a>${input.profileUrl ? `<a href="${escapeHtml(input.profileUrl)}" style="display:block;text-align:center;color:#17213d">公開介紹頁</a>` : ""}<p style="margin-top:24px;color:#686b7d;font-size:13px">開啟連結不會自動接受。你必須在頁面上再次選擇「接受」或「現在不要」。連結 14 天內有效，持有連結的人可以代你做出這一次決定，請勿轉寄。</p></div></div></div>`;
  return { subject: `PitchYourOwner｜${input.inviterName} 想認識你`, text: `${title}\n\n${input.summary}${textDetail}\n\n為什麼值得聊：${input.reason}\n\n查看介紹並決定：${input.acceptUrl}\n\n開啟連結不會自動接受。這是單次使用的決定連結，請勿轉寄。`, html: `<!doctype html><html lang="zh-Hant"><body style="margin:0;background:#fff6ec">${body}</body></html>` };
}

export function renderConnectionEmail(peerName: string, peerEmail: string) {
  return { subject: `PitchYourOwner｜你和 ${peerName} 都接受了`, text: `你們都接受了這次介紹。\n\n${peerName} 的 Email：${peerEmail}\n\n請尊重對方的聯絡與回覆節奏。`, html: `<!doctype html><html lang="zh-Hant"><body style="margin:0;background:#fff6ec"><div style="max-width:640px;margin:auto;padding:24px;font-family:Arial,'Noto Sans TC',sans-serif;color:#17213d"><div style="border:3px solid #17213d;border-radius:24px;box-shadow:8px 8px 0 #17213d;background:#fffdf8;padding:24px"><div style="font-weight:900;color:#7258e8">PitchYourOwner 連結成功</div><h1>你們都接受了</h1><p>${escapeHtml(peerName)} 的 Email：</p><p style="font-size:20px;font-weight:900">${escapeHtml(peerEmail)}</p><p>請尊重對方的聯絡與回覆節奏。</p></div></div></body></html>` };
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
  const fixtureMeta = owner.isTestProfile === true && owner.cleanupSafe === true && owner.testRunId ? { isTestProfile: true, cleanupSafe: true, testRunId: owner.testRunId } : {};
  const snapshot = { display_name: profileAnimalPersona(ownVersion.profile), profile: { ...publicProfile(ownVersion.profile), animal_persona: profileAnimalPersona(ownVersion.profile) } };
  await documentDynamo.send(new TransactWriteCommand({ TransactItems: [
    { Put: { TableName: tableName, Item: { pk: `INVITATION#${pairId}`, sk: "META", entityType: "INVITATION", pairId, senderProfileId: owner.profileId, recipientProfileId: peer.profileId, senderEmail: owner.email, recipientEmail: peer.email, senderSnapshot: snapshot, explanation: { whatWeBothCareAbout: edge.whatWeBothCareAbout, whyItMattersNow: edge.whyItMattersNow, whatWeCouldDiscuss: edge.whatWeCouldDiscuss, evidenceLabels: edge.evidenceLabels }, status: "pending", tokenHash, createdAt: now, expiresAt, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
    { Put: { TableName: tableName, Item: { pk: `INVITE_TOKEN#${tokenHash}`, sk: "META", entityType: "INVITATION_TOKEN", pairId, status: "active", createdAt: now, expiresAt, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
    { Put: { TableName: tableName, Item: { pk: `PROFILE#${owner.profileId}`, sk: `INVITE#${now}#${pairId}`, entityType: "INVITATION_POINTER", pairId, role: "sender", createdAt: now, expiresAt, ...fixtureMeta } } },
    { Put: { TableName: tableName, Item: { pk: `PROFILE#${peer.profileId}`, sk: `INVITE#${now}#${pairId}`, entityType: "INVITATION_POINTER", pairId, role: "recipient", createdAt: now, expiresAt, ...fixtureMeta } } },
    { Put: { TableName: tableName, Item: { pk: `OUTBOX#${eventId}`, sk: "META", entityType: "EMAIL_OUTBOX", eventId, kind: "invitation", status: "PENDING", to: peer.email, ...email, createdAt: now, expiresAt: expiresAt + 7 * DAY, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
  ] }));
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
    const fixtureMeta = invite.isTestProfile === true && invite.cleanupSafe === true && invite.testRunId ? { isTestProfile: true, cleanupSafe: true, testRunId: invite.testRunId } : {};
    const eventA = randomOpaqueToken(18); const eventB = randomOpaqueToken(18);
    const senderName = String((invite.senderSnapshot as Record<string, unknown>)?.display_name ?? "另一位 owner");
    const recipient = await getCurrent(tableName, String(invite.recipientProfileId));
    const recipientVersion = recipient ? await getVersion(tableName, recipient.profileId, recipient.versionId) : undefined;
    const recipientName = recipientVersion?.profile ? profileAnimalPersona(recipientVersion.profile) : "另一位 owner";
    const recipientSnapshot = recipientVersion?.profile ? { display_name: recipientName, profile: { ...publicProfile(recipientVersion.profile), animal_persona: profileAnimalPersona(recipientVersion.profile) } } : { display_name: recipientName, profile: { animal_persona: genericAnimal } };
    const emailA = renderConnectionEmail(recipientName, String(invite.recipientEmail));
    const emailB = renderConnectionEmail(senderName, String(invite.senderEmail));
    transaction.push(
      { Put: { TableName: tableName, Item: { pk: `PROFILE#${invite.senderProfileId}`, sk: `CONNECTION#${token.pairId}`, entityType: "CONNECTION", pairId: token.pairId, peerProfileId: invite.recipientProfileId, peerEmail: invite.recipientEmail, peerDisplayName: recipientName, peerSnapshot: recipientSnapshot, explanation: invite.explanation, connectedAt: now, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
      { Put: { TableName: tableName, Item: { pk: `PROFILE#${invite.recipientProfileId}`, sk: `CONNECTION#${token.pairId}`, entityType: "CONNECTION", pairId: token.pairId, peerProfileId: invite.senderProfileId, peerEmail: invite.senderEmail, peerDisplayName: senderName, peerSnapshot: invite.senderSnapshot, explanation: invite.explanation, connectedAt: now, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
      { Put: { TableName: tableName, Item: { pk: `OUTBOX#${eventA}`, sk: "META", entityType: "EMAIL_OUTBOX", eventId: eventA, kind: "connection", status: "PENDING", to: invite.senderEmail, ...emailA, createdAt: now, expiresAt: Math.floor(Date.now() / 1000) + 21 * DAY, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
      { Put: { TableName: tableName, Item: { pk: `OUTBOX#${eventB}`, sk: "META", entityType: "EMAIL_OUTBOX", eventId: eventB, kind: "connection", status: "PENDING", to: invite.recipientEmail, ...emailB, createdAt: now, expiresAt: Math.floor(Date.now() / 1000) + 21 * DAY, ...fixtureMeta }, ConditionExpression: "attribute_not_exists(pk)" } },
    );
  }
  await documentDynamo.send(new TransactWriteCommand({ TransactItems: transaction }));
  return { state: decision === "accept" ? "connected" : "not_now", connection_id: decision === "accept" ? token.pairId : undefined };
}

async function connectionView(tableName: string, ownerId: string, pairId: string) {
  const connection = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${ownerId}`, sk: `CONNECTION#${pairId}` }, ConsistentRead: true }))).Item;
  if (!connection) throw new Error("connection_not_found");
  const peer = await getCurrent(tableName, String(connection.peerProfileId));
  const version = profileIsPublic(peer) ? await getVersion(tableName, peer.profileId, peer.versionId) : undefined;
  const snapshot = version?.profile ? { display_name: profileAnimalPersona(version.profile), profile: { ...publicProfile(version.profile), animal_persona: profileAnimalPersona(version.profile) } } : connection.peerSnapshot;
  return { connection_id: pairId, connected_at: connection.connectedAt, peer: { ...(snapshot as Record<string, unknown>), contact_email: connection.peerEmail }, explanation: connection.explanation };
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
    return { match_id: item.pairId, connection_id: state === "connected" ? item.pairId : undefined, state, peer: { display_name: displayName, animal_persona: profileAnimalPersona(profile), summary: profile?.summary ?? "" }, explanation: { what_we_both_care_about: (item.explanation as Record<string, unknown>)?.whatWeBothCareAbout ?? "你們有一個值得深入聊的共同關注。", evidence_labels: (item.explanation as Record<string, unknown>)?.evidenceLabels ?? [] } };
  };
  return {
    incoming: await Promise.all(items.filter((item) => item?.recipientProfileId === ownerId && item.status === "pending").map((item) => view(item!, "incoming"))),
    outgoing: await Promise.all(items.filter((item) => item?.senderProfileId === ownerId && item.status === "pending").map((item) => view(item!, "outgoing"))),
    connected: await Promise.all(items.filter((item) => item?.status === "connected").map((item) => view(item!, "connected"))),
  };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const tableName = requiredEnvironment("TABLE_NAME");
    const method = event.requestContext.http.method;
    if (method === "POST" && event.rawPath === "/v1/invitation-tokens/preview") {
      const body = parseJsonBody(event.body) as { token?: unknown };
      const { invite } = await previewToken(tableName, String(body.token ?? ""));
      return json(200, { invitation_id: invite.pairId, expires_at: new Date(Number(invite.expiresAt) * 1000).toISOString(), inviter: invite.senderSnapshot, explanation: invite.explanation });
    }
    if (method === "POST" && event.rawPath === "/v1/invitation-tokens/respond") {
      const body = parseJsonBody(event.body) as { token?: unknown; decision?: unknown };
      if (body.decision !== "accept" && body.decision !== "not_now") return json(400, { error: "invalid_invitation_decision" });
      return json(200, await respondToken(tableName, String(body.token ?? ""), body.decision));
    }
    const session = await loadSession(event.headers.authorization);
    const profileId = profileIdForEmailHash(session.emailHash);
    const pairId = event.pathParameters?.matchId || event.pathParameters?.connectionId;
    if (method === "GET" && event.rawPath === "/v1/invitations") return json(200, await invitationLists(tableName, profileId));
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
    if (["profile_required", "public_profile_required", "fixture_invitation_unavailable"].includes(message)) return json(409, { error: message });
    if (["match_not_found", "peer_profile_not_found", "result_set_not_found", "connection_not_found"].includes(message)) return json(404, { error: message });
    if (message.includes("invitation_token_invalid")) return json(410, { error: "invitation_token_invalid" });
    if (message.includes("ConditionalCheckFailed") || message.includes("TransactionCanceled")) return json(409, { error: "invitation_already_answered" });
    console.error(JSON.stringify({ event: "pairing_failed", message }));
    return json(503, { error: "pairing_failed" });
  }
}
