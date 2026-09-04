import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { loadSession, profileIdForEmailHash } from "../shared/auth.js";
import { publicProfile, type OwnerPitchProfile } from "../shared/contracts.js";
import { json, parseJsonBody } from "../shared/http.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

type MatchSide = "A" | "B";

interface MatchRecord extends Record<string, unknown> {
  matchId: string;
  profileA: string;
  profileB: string;
  emailA?: string;
  emailB?: string;
  createdAt?: string;
  expiresAt?: number;
  introReason?: string;
  reasonA?: string;
  reasonB?: string;
  whatWeBothCareAbout?: string;
  whyItMattersNow?: string;
  whatWeCouldDiscuss?: string;
  evidenceLabels?: string[];
  isTestProfile?: boolean;
  cleanupSafe?: boolean;
  testRunId?: string;
}

function sideFor(match: MatchRecord, profileId: string): MatchSide | undefined {
  if (match.profileA === profileId) return "A";
  if (match.profileB === profileId) return "B";
  return undefined;
}

async function responseFor(tableName: string, matchId: string, side: MatchSide) {
  return (await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `MATCH#${matchId}`, sk: `RESPONSE#${side}` },
    ConsistentRead: true,
  }))).Item;
}

async function currentProfile(tableName: string, profileId: string) {
  const current = (await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${profileId}`, sk: "CURRENT" },
    ConsistentRead: true,
  }))).Item;
  if (!current?.versionId) return undefined;
  const version = (await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${profileId}`, sk: `VERSION#${current.versionId}` },
    ConsistentRead: true,
    ProjectionExpression: "profileId, versionId, profile, displayName, locale, createdAt",
  }))).Item;
  return version ? { current, version } : undefined;
}

async function authorizedMatch(tableName: string, profileId: string, matchId: string): Promise<MatchRecord> {
  const [pointer, match] = await Promise.all([
    documentDynamo.send(new GetCommand({
      TableName: tableName,
      Key: { pk: `PROFILE#${profileId}`, sk: `MATCH#${matchId}` },
      ConsistentRead: true,
    })),
    documentDynamo.send(new GetCommand({
      TableName: tableName,
      Key: { pk: `MATCH#${matchId}`, sk: "META" },
      ConsistentRead: true,
    })),
  ]);
  if (!pointer.Item || !match.Item) throw new Error("match_not_found");
  return match.Item as MatchRecord;
}

async function matchView(tableName: string, profileId: string, match: MatchRecord) {
  const ownSide = sideFor(match, profileId);
  if (!ownSide) throw new Error("match_not_found");
  const peerSide: MatchSide = ownSide === "A" ? "B" : "A";
  const peerId = peerSide === "A" ? match.profileA : match.profileB;
  const [ownResponse, peerResponse, peer] = await Promise.all([
    responseFor(tableName, match.matchId, ownSide),
    responseFor(tableName, match.matchId, peerSide),
    currentProfile(tableName, peerId),
  ]);
  if (!peer?.version?.profile) throw new Error("peer_profile_not_found");
  const mutual = ownResponse?.decision === "accept" && peerResponse?.decision === "accept";
  const peerEmail = peerSide === "A" ? match.emailA : match.emailB;
  const ownReason = ownSide === "A" ? match.reasonA : match.reasonB;
  const profile = publicProfile(peer.version.profile as OwnerPitchProfile);
  const displayName = typeof peer.version.displayName === "string" ? peer.version.displayName : "Another owner";
  const state = mutual
    ? "connected"
    : ownResponse?.decision === "pass"
      ? "not_now"
      : ownResponse?.decision === "accept"
        ? "outgoing"
        : peerResponse?.decision === "accept"
          ? "incoming"
          : "suggested";
  return {
    match_id: match.matchId,
    state,
    created_at: match.createdAt,
    expires_at: match.expiresAt ? new Date(Number(match.expiresAt) * 1_000).toISOString() : undefined,
    peer: {
      display_name: displayName,
      profile,
      contact_email: mutual ? peerEmail : undefined,
    },
    explanation: {
      what_we_both_care_about: match.whatWeBothCareAbout || match.introReason || "You share a specific recurring interest.",
      why_it_matters_now: match.whyItMattersNow || ownReason || "The topic appears in both current owner pitches.",
      what_we_could_discuss: match.whatWeCouldDiscuss || "Compare the concrete approaches each of you is trying now.",
      evidence_labels: Array.isArray(match.evidenceLabels) ? match.evidenceLabels : ["interests", "active_problems"],
    },
    own_response: ownResponse?.decision,
    peer_response: peerResponse?.decision,
    can_invite: !ownResponse,
  };
}

async function matchList(tableName: string, profileId: string) {
  const pointers = await documentDynamo.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :match)",
    ExpressionAttributeValues: { ":pk": `PROFILE#${profileId}`, ":match": "MATCH#" },
    ScanIndexForward: false,
  }));
  const views = await Promise.all((pointers.Items ?? []).slice(0, 24).map(async (pointer) => {
    const matchId = String(pointer.matchId ?? "");
    if (!matchId) return undefined;
    const match = (await documentDynamo.send(new GetCommand({
      TableName: tableName,
      Key: { pk: `MATCH#${matchId}`, sk: "META" },
    }))).Item as MatchRecord | undefined;
    if (!match) return undefined;
    try { return await matchView(tableName, profileId, match); } catch { return undefined; }
  }));
  return views.filter(Boolean).sort((left, right) => String(right!.created_at ?? "").localeCompare(String(left!.created_at ?? "")));
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const session = await loadSession(event.headers.authorization);
    const profileId = profileIdForEmailHash(session.emailHash);
    const tableName = requiredEnvironment("TABLE_NAME");
    const method = event.requestContext.http.method;
    const matchId = event.pathParameters?.matchId;

    if (method === "GET" && event.rawPath === "/v1/matches") {
      return json(200, { matches: await matchList(tableName, profileId) });
    }
    if (method === "GET" && event.rawPath === "/v1/invitations") {
      const matches = await matchList(tableName, profileId);
      return json(200, {
        incoming: matches.filter((match) => match!.state === "incoming"),
        outgoing: matches.filter((match) => match!.state === "outgoing"),
        connected: matches.filter((match) => match!.state === "connected"),
      });
    }
    if (method === "GET" && matchId) {
      const match = await authorizedMatch(tableName, profileId, matchId);
      return json(200, await matchView(tableName, profileId, match));
    }
    if (method === "POST" && matchId && event.rawPath.endsWith("/invitations")) {
      const body = parseJsonBody(event.body) as { decision?: unknown };
      const decision = body.decision === "not_now" ? "pass" : body.decision === "invite" || body.decision === "accept" ? "accept" : undefined;
      if (!decision) return json(400, { error: "invalid_invitation_decision" });
      const match = await authorizedMatch(tableName, profileId, matchId);
      if (match.expiresAt && Number(match.expiresAt) <= Math.floor(Date.now() / 1_000)) return json(410, { error: "match_expired" });
      const ownSide = sideFor(match, profileId)!;
      const peerSide: MatchSide = ownSide === "A" ? "B" : "A";
      const existing = await responseFor(tableName, matchId, ownSide);
      if (existing?.decision) {
        if (existing.decision === decision) return json(200, await matchView(tableName, profileId, match));
        return json(409, { error: "invitation_decision_already_recorded" });
      }
      await documentDynamo.send(new PutCommand({
        TableName: tableName,
        Item: {
          pk: `MATCH#${matchId}`,
          sk: `RESPONSE#${ownSide}`,
          entityType: "MATCH_RESPONSE",
          matchId,
          side: ownSide,
          decision,
          createdAt: new Date().toISOString(),
          expiresAt: match.expiresAt,
          ...(match.isTestProfile === true && match.cleanupSafe === true && match.testRunId
            ? { isTestProfile: true, cleanupSafe: true, testRunId: match.testRunId }
            : {}),
        },
        ConditionExpression: "attribute_not_exists(pk)",
      }));
      const peerResponse = await responseFor(tableName, matchId, peerSide);
      return json(200, {
        ...(await matchView(tableName, profileId, match)),
        mutual: decision === "accept" && peerResponse?.decision === "accept",
      });
    }
    return json(404, { error: "route_not_found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "pairing failed";
    if (/session|bearer/.test(message)) return json(401, { error: "invalid_cloud_session" });
    if (message.includes("match_not_found") || message.includes("peer_profile_not_found")) return json(404, { error: message });
    console.error(JSON.stringify({ event: "pairing_failed", message }));
    return json(503, { error: "pairing_failed" });
  }
}
