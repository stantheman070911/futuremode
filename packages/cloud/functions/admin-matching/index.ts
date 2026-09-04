import { SearchVectorsCommand } from "@aws-sdk/client-dynamodb";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { haveCompatibleMatchLanguage, isCurrentMatchable, judgeMatchCandidates } from "../matching-run/index.js";
import { loadSession } from "../shared/auth.js";
import { json } from "../shared/http.js";
import { documentDynamo, rawDynamo, requiredEnvironment } from "../shared/storage.js";

const lambda = new LambdaClient({});

interface MatchItem {
  pk: string;
  sk: string;
  entityType: "MATCH";
  matchId: string;
  profileA?: string;
  profileB?: string;
  emailA?: string;
  emailB?: string;
  status?: string;
  judgeModelId?: string;
  judgeDecision?: string;
  mutualScore?: number;
  seedInterestScore?: number;
  candidateInterestScore?: number;
  introReason?: string;
  reasonA?: string;
  reasonB?: string;
  createdAt?: string;
  expiresAt?: number;
}

interface OutboxItem {
  pk: string;
  sk: string;
  entityType: "EMAIL_OUTBOX";
  eventId?: string;
  matchId?: string;
  status?: string;
  to?: string;
  subject?: string;
  text?: string;
  createdAt?: string;
}

interface ActiveProfile {
  profileId: string;
  versionId: string;
  emailHash: string;
  embedding: number[];
  profileHeadline?: string;
  profileMarkdown?: string;
  skills?: string[];
  locale?: string;
  isTestProfile?: boolean;
  testRunId?: string;
  cleanupSafe?: boolean;
}

interface CurrentProfile extends Record<string, unknown> {
  profileId: string;
  email?: string;
  matchingState?: string;
  matchLanguages?: string[];
  publicSlug?: string;
  isTestProfile?: boolean;
  testRunId?: string;
  cleanupSafe?: boolean;
}

interface CandidateProfile extends ActiveProfile {
  score?: number;
  rank: number;
}

interface AdminMatchingScope {
  includeTestProfiles: boolean;
  testRunId?: string;
}

function parseBody(event: APIGatewayProxyEventV2): Record<string, unknown> {
  if (!event.body) return {};
  try {
    const parsed = JSON.parse(event.body);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function adminMatchingScope(event: APIGatewayProxyEventV2): AdminMatchingScope {
  const body = parseBody(event);
  const includeTestProfiles = body.includeTestProfiles === true;
  const testRunId = typeof body.testRunId === "string" && /^[a-zA-Z0-9_.:-]{6,120}$/.test(body.testRunId) ? body.testRunId : undefined;
  return { includeTestProfiles: Boolean(includeTestProfiles && testRunId), testRunId };
}

function profileScopeFilter(scope: AdminMatchingScope) {
  if (scope.includeTestProfiles) {
    return {
      expression: "entityType = :type AND profile_scope = :active AND is_matchable = :true AND isTestProfile = :testTrue AND testRunId = :testRunId",
      values: { ":type": "PROFILE_VERSION", ":active": "ACTIVE", ":true": 1, ":testTrue": true, ":testRunId": scope.testRunId },
    };
  }
  return {
    expression: "entityType = :type AND profile_scope = :active AND is_matchable = :true AND attribute_not_exists(isTestProfile)",
    values: { ":type": "PROFILE_VERSION", ":active": "ACTIVE", ":true": 1 },
  };
}

function isProfileInScope(profile: ActiveProfile | CurrentProfile | undefined, scope: AdminMatchingScope): boolean {
  if (!profile) return false;
  if (scope.includeTestProfiles) {
    return profile.isTestProfile === true && profile.cleanupSafe === true && profile.testRunId === scope.testRunId;
  }
  return profile.isTestProfile !== true;
}

function adminHashes(): Set<string> {
  return new Set(requiredEnvironment("ADMIN_EMAIL_HASHES").split(",").map((entry) => entry.trim()).filter(Boolean));
}

async function assertAdmin(event: APIGatewayProxyEventV2) {
  const session = await loadSession(event.headers.authorization);
  if (!adminHashes().has(session.emailHash)) throw new Error("not_admin");
  return session;
}

function redactEmail(value: unknown): string {
  const email = String(value ?? "");
  const [name, domain] = email.split("@");
  if (!name || !domain) return "";
  return `${name.slice(0, 2)}***@${domain}`;
}

function summarizeMatch(item: MatchItem) {
  return {
    matchId: item.matchId,
    status: item.status,
    profileA: item.profileA,
    profileB: item.profileB,
    emailA: redactEmail(item.emailA),
    emailB: redactEmail(item.emailB),
    judgeModelId: item.judgeModelId,
    judgeDecision: item.judgeDecision,
    mutualScore: item.mutualScore,
    seedInterestScore: item.seedInterestScore,
    candidateInterestScore: item.candidateInterestScore,
    introReason: item.introReason,
    reasonA: item.reasonA,
    reasonB: item.reasonB,
    createdAt: item.createdAt,
    expiresAt: item.expiresAt,
  };
}

function summarizeOutbox(item: OutboxItem) {
  return {
    eventId: item.eventId,
    matchId: item.matchId,
    status: item.status,
    to: redactEmail(item.to),
    subject: item.subject,
    text: item.text,
    createdAt: item.createdAt,
  };
}

async function listState() {
  const tableName = requiredEnvironment("TABLE_NAME");
  const [profiles, matches, outbox] = await Promise.all([
    documentDynamo.send(new ScanCommand({
      TableName: tableName,
      Select: "COUNT",
      FilterExpression: "entityType = :type AND profile_scope = :active AND is_matchable = :true AND attribute_not_exists(isTestProfile)",
      ExpressionAttributeValues: { ":type": "PROFILE_VERSION", ":active": "ACTIVE", ":true": 1 },
    })),
    documentDynamo.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: "entityType = :type",
      ExpressionAttributeValues: { ":type": "MATCH" },
      ProjectionExpression: "pk, sk, entityType, matchId, profileA, profileB, emailA, emailB, #status, judgeModelId, judgeDecision, mutualScore, seedInterestScore, candidateInterestScore, introReason, reasonA, reasonB, createdAt, expiresAt",
      ExpressionAttributeNames: { "#status": "status" },
    })),
    documentDynamo.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: "entityType = :type",
      ExpressionAttributeValues: { ":type": "EMAIL_OUTBOX" },
      ProjectionExpression: "pk, sk, entityType, eventId, matchId, #status, #to, subject, #text, createdAt",
      ExpressionAttributeNames: { "#status": "status", "#to": "to", "#text": "text" },
    })),
  ]);
  const matchItems = ((matches.Items ?? []) as MatchItem[])
    .sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")))
    .slice(0, 50)
    .map(summarizeMatch);
  const outboxItems = ((outbox.Items ?? []) as OutboxItem[])
    .sort((left, right) => String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? "")))
    .slice(0, 50)
    .map(summarizeOutbox);
  return {
    activeProfileCount: profiles.Count ?? 0,
    matchCount: matches.Count ?? 0,
    outboxCount: outbox.Count ?? 0,
    matches: matchItems,
    outbox: outboxItems,
  };
}

async function runMatching(scope: AdminMatchingScope) {
  const response = await lambda.send(new InvokeCommand({
    FunctionName: requiredEnvironment("MATCHING_RUN_FUNCTION_NAME"),
    InvocationType: "RequestResponse",
    Payload: new TextEncoder().encode(JSON.stringify({ manual: true, source: "admin", ...scope })),
  }));
  const payloadText = response.Payload ? new TextDecoder().decode(response.Payload) : "{}";
  const payload = JSON.parse(payloadText || "{}") as Record<string, unknown>;
  if (response.FunctionError) {
    throw new Error(`matching run failed: ${response.FunctionError}`);
  }
  return payload;
}

async function loadProfileVersion(tableName: string, profileId: string, versionId: string): Promise<ActiveProfile | undefined> {
  const result = await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${profileId}`, sk: `VERSION#${versionId}` },
    ConsistentRead: true,
    ProjectionExpression: "profileId, versionId, emailHash, embedding, profileHeadline, profileMarkdown, skills, locale, isTestProfile, testRunId, cleanupSafe",
  }));
  const item = result.Item as ActiveProfile | undefined;
  if (!item?.profileId || !item.versionId || !item.emailHash) return undefined;
  return item;
}

async function loadCurrentProfile(tableName: string, profileId: string): Promise<CurrentProfile | undefined> {
  const result = await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${profileId}`, sk: "CURRENT" },
    ConsistentRead: true,
  }));
  return result.Item as CurrentProfile | undefined;
}

async function generateMatchReport(scope: AdminMatchingScope) {
  const tableName = requiredEnvironment("TABLE_NAME");
  const profiles: ActiveProfile[] = [];
  const profileFilter = profileScopeFilter(scope);
  let exclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const page = await documentDynamo.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey: exclusiveStartKey,
      FilterExpression: profileFilter.expression,
      ExpressionAttributeValues: profileFilter.values,
      ProjectionExpression: "profileId, versionId, emailHash, embedding, profileHeadline, profileMarkdown, skills, locale, isTestProfile, testRunId, cleanupSafe",
    }));
    profiles.push(...((page.Items ?? []) as ActiveProfile[]));
    exclusiveStartKey = page.LastEvaluatedKey;
  } while (exclusiveStartKey && profiles.length < 50);
  profiles.length = Math.min(profiles.length, 50);
  const profileIdsInScope = new Set(profiles.map((profile) => profile.profileId));
  const currentByProfileId = new Map<string, CurrentProfile>();
  for (const profile of profiles) {
    const current = await loadCurrentProfile(tableName, profile.profileId);
    if (isCurrentMatchable(current) && isProfileInScope(current, scope)) currentByProfileId.set(profile.profileId, current);
  }
  const pairReports = new Map<string, Record<string, unknown>>();
  let judged = 0;
  let rejectedSeeds = 0;
  for (const seed of profiles) {
    const seedCurrent = currentByProfileId.get(seed.profileId);
    if (!seedCurrent || !Array.isArray(seed.embedding)) continue;
    const result = await rawDynamo.send(new SearchVectorsCommand({
      TableName: tableName,
      IndexName: requiredEnvironment("VECTOR_INDEX_NAME"),
      SearchVector: seed.embedding.map((value) => ({ N: String(value) })),
      TopK: Math.min(50, Math.max(10, profiles.length + 8)),
      SearchConditionExpression: "#scope = :active AND #matchable = :true",
      ExpressionAttributeNames: { "#scope": "profile_scope", "#matchable": "is_matchable" },
      ExpressionAttributeValues: { ":active": { S: "ACTIVE" }, ":true": { N: "1" } },
      ProjectionExpression: "profileId, versionId, emailHash",
    }));
    const candidateRefs = (result.SearchResults ?? [])
      .map((entry): { profileId: string; versionId: string; score?: number } | undefined => {
        if (!entry.Item) return undefined;
        const decoded = unmarshall(entry.Item) as ActiveProfile;
        if (!decoded.profileId || !decoded.versionId || !decoded.emailHash || decoded.profileId === seed.profileId || !profileIdsInScope.has(decoded.profileId)) return undefined;
        return { profileId: decoded.profileId, versionId: decoded.versionId, score: entry.Score };
      })
      .filter((entry): entry is { profileId: string; versionId: string; score?: number } => Boolean(entry));
    const candidates = (await Promise.all(candidateRefs.map(async (candidate, index): Promise<CandidateProfile | undefined> => {
      const hydrated = await loadProfileVersion(tableName, candidate.profileId, candidate.versionId);
      const current = currentByProfileId.get(candidate.profileId) ?? await loadCurrentProfile(tableName, candidate.profileId);
      if (current && isCurrentMatchable(current)) currentByProfileId.set(candidate.profileId, current);
      if (!hydrated || !current || !isCurrentMatchable(current) || !isProfileInScope(hydrated, scope) || !isProfileInScope(current, scope) || !haveCompatibleMatchLanguage(seedCurrent, current)) return undefined;
      return { ...hydrated, score: candidate.score, rank: index + 1 };
    }))).filter((entry): entry is CandidateProfile => Boolean(entry));
    if (!candidates.length) continue;
    try {
      const judge = await judgeMatchCandidates(seed, candidates);
      judged += 1;
      for (const ranked of judge.rankedCandidates) {
        const candidate = candidates.find((entry) => entry.profileId === ranked.candidateId);
        if (!candidate) continue;
        const candidateCurrent = currentByProfileId.get(candidate.profileId);
        const pairKey = [seed.profileId, candidate.profileId].sort().join(":");
        const previous = pairReports.get(pairKey);
        if (previous && Number(previous.mutualScore ?? 0) >= ranked.mutualScore) continue;
        pairReports.set(pairKey, {
          pairKey,
          seedProfileId: seed.profileId,
          candidateProfileId: candidate.profileId,
          seedHeadline: seed.profileHeadline,
          candidateHeadline: candidate.profileHeadline,
          seedPublicSlug: seedCurrent.publicSlug,
          candidatePublicSlug: candidateCurrent?.publicSlug,
          seedEmail: redactEmail(seedCurrent.email),
          candidateEmail: redactEmail(candidateCurrent?.email),
          embeddingRank: candidate.rank,
          embeddingScore: candidate.score,
          decision: ranked.decision,
          seedInterestScore: ranked.seedInterestScore,
          candidateInterestScore: ranked.candidateInterestScore,
          mutualScore: ranked.mutualScore,
          introReason: ranked.introReason || judge.bestIntroReason,
          reasonForSeed: ranked.reasonForSeed,
          reasonForCandidate: ranked.reasonForCandidate,
          risks: ranked.risks,
        });
      }
    } catch (error) {
      rejectedSeeds += 1;
      console.error(JSON.stringify({
        event: "admin_match_report_judge_failed",
        seedProfileId: seed.profileId,
        errorName: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "judge failed",
      }));
    }
  }
  const candidates = [...pairReports.values()]
    .sort((left, right) => Number(right.mutualScore ?? 0) - Number(left.mutualScore ?? 0))
    .slice(0, 5);
  return {
    generatedAt: new Date().toISOString(),
    judgeModelId: requiredEnvironment("MATCH_JUDGE_MODEL_ID"),
    includeTestProfiles: scope.includeTestProfiles,
    testRunId: scope.testRunId,
    activeProfileCount: profiles.length,
    judgedSeedCount: judged,
    rejectedSeedCount: rejectedSeeds,
    candidatePairCount: pairReports.size,
    topCandidates: candidates,
  };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    await assertAdmin(event);
    const scope = adminMatchingScope(event);
    if (event.requestContext.http.method === "GET") {
      return json(200, await listState());
    }
    if (event.requestContext.http.method === "POST" && event.rawPath.endsWith("/matching-runs")) {
      const result = await runMatching(scope);
      return json(200, { run: result, state: await listState() });
    }
    if (event.requestContext.http.method === "POST" && event.rawPath.endsWith("/match-report")) {
      return json(200, { report: await generateMatchReport(scope), state: await listState() });
    }
    return json(405, { error: "method_not_allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "admin request failed";
    if (/session|bearer/.test(message)) return json(401, { error: "invalid_cloud_session" });
    if (/not_admin/.test(message)) return json(403, { error: "admin_required" });
    console.error(JSON.stringify({
      event: "admin_matching_failed",
      errorName: error instanceof Error ? error.name : "UnknownError",
      message,
    }));
    return json(503, { error: "admin_matching_failed" });
  }
}
