import { SearchVectorsCommand } from "@aws-sdk/client-dynamodb";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { GetCommand, ScanCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { randomOpaqueToken, sha256 } from "../shared/security.js";
import { documentDynamo, rawDynamo, requiredEnvironment } from "../shared/storage.js";
import type { OwnerPitchProfile } from "../shared/contracts.js";

const bedrock = new BedrockRuntimeClient({});

interface ActiveProfile {
  profileId: string;
  versionId: string;
  emailHash: string;
  embedding: number[];
  profile?: OwnerPitchProfile;
  displayName?: string;
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
  matchIntervalDays?: number;
  isTestProfile?: boolean;
  testRunId?: string;
  cleanupSafe?: boolean;
}

interface CandidateProfile extends ActiveProfile {
  score?: number;
  rank: number;
}

interface EmailProfilePreview {
  displayName?: string;
  summary?: string;
  interests?: string[];
}

type UiLanguage = "zh" | "en";

interface EmailCopy {
  subject: string;
  preheader: string;
  heroLabel: string;
  heroTitle: string;
  reasonTitle: string;
  recipientReasonTitle: string;
  profileLabel: string;
  profileNameLabel: string;
  interestsLabel: string;
  interestedCta: string;
  passCta: string;
  eligibilityNote: string;
  manage: string;
  privacy: string;
  terms: string;
  support: string;
}

interface RankedCandidate {
  candidateId: string;
  decision: "strong_match" | "possible_match" | "weak_match" | "reject";
  seedInterestScore: number;
  candidateInterestScore: number;
  mutualScore: number;
  reasonForSeed: string;
  reasonForCandidate: string;
  introReason: string;
  whatWeBothCareAbout: string;
  whyItMattersNow: string;
  whatWeCouldDiscuss: string;
  evidenceLabels: string[];
  risks: string[];
}

interface JudgeResult {
  seedId: string;
  rankedCandidates: RankedCandidate[];
  bestCandidateId: string;
  bestIntroReason: string;
}

interface MatchingScope {
  includeTestProfiles: boolean;
  testRunId?: string;
}

function matchingScope(event?: unknown): MatchingScope {
  const raw = event && typeof event === "object" && !Array.isArray(event) ? event as Record<string, unknown> : {};
  const includeTestProfiles = raw.includeTestProfiles === true;
  const testRunId = typeof raw.testRunId === "string" && /^[a-zA-Z0-9_.:-]{6,120}$/.test(raw.testRunId) ? raw.testRunId : undefined;
  return { includeTestProfiles: Boolean(includeTestProfiles && testRunId), testRunId };
}

function profileScopeFilter(scope: MatchingScope) {
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

function isProfileInScope(profile: ActiveProfile | CurrentProfile | undefined, scope: MatchingScope): boolean {
  if (!profile) return false;
  if (scope.includeTestProfiles) {
    return profile.isTestProfile === true && profile.cleanupSafe === true && profile.testRunId === scope.testRunId;
  }
  return profile.isTestProfile !== true;
}

function matchingLanguages(value: unknown): string[] {
  if (!Array.isArray(value)) return ["zh", "en"];
  const normalized = [...new Set(value.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean))];
  return normalized.filter((entry) => entry === "zh" || entry === "en");
}

export function isCurrentMatchable(current: Record<string, unknown> | undefined): current is CurrentProfile {
  return Boolean(current?.profileId && current.email && String(current.matchingState ?? "active") === "active");
}

export function haveCompatibleMatchLanguage(left: CurrentProfile, right: CurrentProfile): boolean {
  const leftLanguages = new Set(matchingLanguages(left.matchLanguages));
  return matchingLanguages(right.matchLanguages).some((language) => leftLanguages.has(language));
}

function text(value: unknown, max: number): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function uiLanguage(locale: unknown): UiLanguage {
  return String(locale ?? "").toLowerCase().startsWith("zh") ? "zh" : "en";
}

function emailCopy(language: UiLanguage): EmailCopy {
  if (language === "zh") {
    return {
      subject: "PitchYourOwner 找到一位值得認識的人",
      preheader: "PitchYourOwner 找到一份可能與你相關的 Profile。",
      heroLabel: "PitchYourOwner 配對",
      heroTitle: "有人可能值得你認識。",
      reasonTitle: "為什麼這個配對可能有價值",
      recipientReasonTitle: "對你來說",
      profileLabel: "對方 Profile",
      profileNameLabel: "名稱",
      interestsLabel: "Interests",
      interestedCta: "我有興趣 — 我想要這個介紹 →",
      passCta: "略過 — 這次不需要",
      eligibilityNote: "你收到這封信，是因為你的 approved Profile 可以參與 PitchYourOwner matching。",
      manage: "管理 Profile",
      privacy: "Privacy",
      terms: "Terms",
      support: "Support",
    };
  }
  return {
    subject: "PitchYourOwner found someone worth meeting",
    preheader: "PitchYourOwner found a profile that may be worth meeting.",
    heroLabel: "PitchYourOwner Match",
    heroTitle: "Someone may be worth meeting.",
    reasonTitle: "Why this match may be useful",
    recipientReasonTitle: "For you",
    profileLabel: "Matched Profile",
    profileNameLabel: "Name",
    interestsLabel: "Interests",
    interestedCta: "INTERESTED — I WANT THIS INTRODUCTION →",
    passCta: "PASS — NOT THIS ONE",
    eligibilityNote: "You are receiving this because your approved Profile is eligible for PitchYourOwner matching.",
    manage: "Manage Profile",
    privacy: "Privacy",
    terms: "Terms",
    support: "Support",
  };
}

function profileForJudge(profile: ActiveProfile) {
  return {
    id: profile.profileId,
    summary: text(profile.profile?.summary, 480),
    locale: text(profile.locale, 20),
    interests: profile.profile?.interests ?? [],
    motivations: profile.profile?.motivations ?? [],
    activeProblems: profile.profile?.active_problems ?? [],
    recurringTopics: profile.profile?.recurring_topics ?? [],
    friendIntent: text(profile.profile?.friend_intent, 320),
  };
}

async function loadProfileVersion(tableName: string, profileId: string, versionId: string): Promise<ActiveProfile | undefined> {
  const result = await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${profileId}`, sk: `VERSION#${versionId}` },
    ConsistentRead: true,
    ProjectionExpression: "profileId, versionId, emailHash, embedding, profile, displayName, locale, isTestProfile, testRunId, cleanupSafe",
  }));
  const item = result.Item as ActiveProfile | undefined;
  if (!item?.profileId || !item.versionId || !item.emailHash) return undefined;
  return item;
}

function parseJsonObject(textValue: string): unknown {
  const raw = textValue.trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : raw;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(candidate.slice(start, end + 1));
    throw new Error("match judge did not return JSON");
  }
}

function boundedScore(value: unknown): number {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function decision(value: unknown): RankedCandidate["decision"] {
  return value === "strong_match" || value === "possible_match" || value === "weak_match" || value === "reject" ? value : "reject";
}

function normalizeJudgeResult(value: unknown, seedId: string, candidateIds: Set<string>): JudgeResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid match judge result");
  const raw = value as Record<string, unknown>;
  const rankedCandidates = Array.isArray(raw.rankedCandidates)
    ? raw.rankedCandidates
      .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object" && !Array.isArray(entry)))
      .map((entry): RankedCandidate => ({
        candidateId: text(entry.candidateId, 128),
        decision: decision(entry.decision),
        seedInterestScore: boundedScore(entry.seedInterestScore),
        candidateInterestScore: boundedScore(entry.candidateInterestScore),
        mutualScore: boundedScore(entry.mutualScore),
        reasonForSeed: text(entry.reasonForSeed, 1_000),
        reasonForCandidate: text(entry.reasonForCandidate, 1_000),
        introReason: text(entry.introReason, 1_000),
        whatWeBothCareAbout: text(entry.whatWeBothCareAbout, 1_000),
        whyItMattersNow: text(entry.whyItMattersNow, 1_000),
        whatWeCouldDiscuss: text(entry.whatWeCouldDiscuss, 1_000),
        evidenceLabels: Array.isArray(entry.evidenceLabels)
          ? entry.evidenceLabels.map((label) => text(label, 80)).filter((label) => ["summary", "interests", "motivations", "active_problems", "recurring_topics", "friend_intent"].includes(label)).slice(0, 6)
          : [],
        risks: Array.isArray(entry.risks) ? entry.risks.map((risk) => text(risk, 240)).filter(Boolean).slice(0, 5) : [],
      }))
      .filter((entry) => candidateIds.has(entry.candidateId))
    : [];
  rankedCandidates.sort((left, right) => right.mutualScore - left.mutualScore);
  const bestCandidateId = candidateIds.has(text(raw.bestCandidateId, 128))
    ? text(raw.bestCandidateId, 128)
    : rankedCandidates[0]?.candidateId ?? "";
  return {
    seedId,
    rankedCandidates,
    bestCandidateId,
    bestIntroReason: text(raw.bestIntroReason || rankedCandidates.find((entry) => entry.candidateId === bestCandidateId)?.introReason, 1_000),
  };
}

export async function judgeMatchCandidates(seed: ActiveProfile, candidates: CandidateProfile[]): Promise<JudgeResult> {
  const candidateIds = new Set(candidates.map((candidate) => candidate.profileId));
  const prompt = [
    "You are the PitchYourOwner match judge.",
    "",
    "Given one seed owner pitch and candidate owner pitches retrieved by embedding similarity, decide which person is the best friend introduction.",
    "",
    "Judge from both perspectives:",
    "- Would the seed owner likely be interested in the candidate?",
    "- Would the candidate likely be interested in the seed owner?",
    "",
    "Apply these weights internally: 30% specific-interest overlap, 25% active-problem overlap, 20% motivation alignment, 15% recurring-topic overlap, and 10% friend-intent compatibility.",
    "Strong matches share a specific interest, motivation, active problem, or recurring question. They may come from different professions when the underlying concern is concrete.",
    "Weak matches share only a broad category, job title, generic soft skill, or shallow keyword with no credible reason to talk now.",
    "Never use history_scope or confidence for matching. Never describe an inferred interest as verified expertise.",
    "",
    "Language rules:",
    "- Use each Profile's locale for that recipient-specific reason.",
    "- If a Profile locale starts with zh, write that Profile's reason in Traditional Chinese.",
    "- If a Profile locale is en or unknown, write that Profile's reason in English.",
    "- reasonForSeed must use the seed Profile's locale.",
    "- reasonForCandidate must use that candidate Profile's locale.",
    "- introReason can be concise English unless both Profiles use zh, then use Traditional Chinese.",
    "- Do not translate names, interest terms, product names, or other distinctive terms.",
    "",
    "Return JSON only with this shape:",
    "{\"seedId\":\"...\",\"rankedCandidates\":[{\"candidateId\":\"...\",\"decision\":\"strong_match|possible_match|weak_match|reject\",\"seedInterestScore\":0,\"candidateInterestScore\":0,\"mutualScore\":0,\"reasonForSeed\":\"...\",\"reasonForCandidate\":\"...\",\"introReason\":\"...\",\"whatWeBothCareAbout\":\"...\",\"whyItMattersNow\":\"...\",\"whatWeCouldDiscuss\":\"...\",\"evidenceLabels\":[\"interests\",\"active_problems\"],\"risks\":[\"...\"]}],\"bestCandidateId\":\"...\",\"bestIntroReason\":\"...\"}",
    "",
    "Scoring must use a 0-100 scale, not 0-10:",
    "- strong_match: mutualScore 75-100",
    "- possible_match: mutualScore 55-74",
    "- weak_match: mutualScore 30-54",
    "- reject: mutualScore 0-29",
    "",
    `Seed Profile:\n${JSON.stringify(profileForJudge(seed), null, 2)}`,
    "",
    `Candidate Profiles:\n${JSON.stringify(candidates.map((candidate) => ({
      embeddingRank: candidate.rank,
      embeddingScore: candidate.score,
      ...profileForJudge(candidate),
    })), null, 2)}`,
  ].join("\n");
  const response = await bedrock.send(new ConverseCommand({
    modelId: requiredEnvironment("MATCH_JUDGE_MODEL_ID"),
    messages: [{ role: "user", content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens: 4096, temperature: 0.1 },
  }));
  const responseText = response.output?.message?.content?.map((entry) => entry.text ?? "").join("\n") ?? "";
  return normalizeJudgeResult(parseJsonObject(responseText), seed.profileId, candidateIds);
}

function emailText({
  language,
  introReason,
  reasonForRecipient,
  peer,
  acceptUrl,
  passUrl,
  siteOrigin,
}: {
  language: UiLanguage;
  introReason: string;
  reasonForRecipient: string;
  peer: EmailProfilePreview;
  acceptUrl: string;
  passUrl: string;
  siteOrigin: string;
}): string {
  const copy = emailCopy(language);
  const interests = Array.isArray(peer.interests) ? peer.interests.map((interest) => text(interest, 120)).filter(Boolean).slice(0, 8) : [];
  return [
    copy.preheader,
    "",
    `${copy.reasonTitle}:`,
    introReason,
    reasonForRecipient ? `\n${copy.recipientReasonTitle}: ${reasonForRecipient}` : "",
    "",
    `${copy.profileLabel}:`,
    peer.displayName ? `${copy.profileNameLabel}: ${text(peer.displayName, 40)}` : "",
    `Summary: ${profileSummary(peer.summary)}`,
    interests.length ? `${copy.interestsLabel}: ${interests.join(", ")}` : "",
    "",
    `${copy.interestedCta}: ${acceptUrl}`,
    `${copy.passCta}: ${passUrl}`,
    "",
    `${copy.manage}: ${siteOrigin}/manage`,
    `${copy.privacy}: ${siteOrigin}/privacy`,
    `${copy.terms}: ${siteOrigin}/terms`,
    `${copy.support}: ${siteOrigin}/support`,
  ].filter(Boolean).join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripMarkdown(value: unknown): string {
  return String(value ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>#-]+/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, Math.max(0, max - 1)).trim()}…` : value;
}

function profileSummary(value: unknown): string {
  const stripped = stripMarkdown(value);
  return truncate(stripped || "This approved Profile is available for PitchYourOwner matching review.", 520);
}

function compactEmailText(value: unknown, max = 360): string {
  return truncate(stripMarkdown(value), max);
}

function paragraphHtml(value: string): string {
  return escapeHtml(value).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");
}

function emailHtml({
  language,
  introReason,
  reasonForRecipient,
  peer,
  acceptUrl,
  passUrl,
  siteOrigin,
}: {
  language: UiLanguage;
  introReason: string;
  reasonForRecipient: string;
  peer: EmailProfilePreview;
  acceptUrl: string;
  passUrl: string;
  siteOrigin: string;
}): string {
  const copy = emailCopy(language);
  const interests = Array.isArray(peer.interests) ? peer.interests.map((interest) => text(interest, 120)).filter(Boolean).slice(0, 8) : [];
  const displayName = text(peer.displayName, 40);
  const shortIntroReason = compactEmailText(introReason, 360);
  const shortRecipientReason = compactEmailText(reasonForRecipient, 360);
  const shortProfileSummary = truncate(profileSummary(peer.summary), 300);
  const actionButtons = `
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;margin:20px 0 8px 0;border-collapse:separate;">
            <tr>
              <td>
                <a href="${escapeHtml(acceptUrl)}" style="display:block;width:100%;box-sizing:border-box;background:#ff553d;color:#ffffff;text-decoration:none;text-align:center;border:5px solid #17213d;border-radius:32px;box-shadow:0 12px 0 #17213d;padding:20px 16px;font-size:22px;line-height:1.1;font-weight:900;letter-spacing:.01em;text-transform:uppercase;">${escapeHtml(copy.interestedCta)}</a>
              </td>
            </tr>
            <tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr>
              <td>
                <a href="${escapeHtml(passUrl)}" style="display:block;width:100%;box-sizing:border-box;background:#fffdf8;color:#17213d;text-decoration:none;text-align:center;border:4px solid #17213d;border-radius:28px;box-shadow:0 9px 0 #17213d;padding:16px 16px;font-size:18px;line-height:1.1;font-weight:900;letter-spacing:.01em;text-transform:uppercase;">${escapeHtml(copy.passCta)}</a>
              </td>
            </tr>
          </table>`;
  return `<!doctype html>
<html lang="${language === "zh" ? "zh-Hant" : "en"}">
  <body style="margin:0;background:#fff6ec;color:#17213d;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(copy.preheader)}</div>
    <div style="max-width:680px;margin:0 auto;padding:22px 14px 34px;">
      <div style="background:#fffdf8;border:3px solid #17213d;border-radius:24px;box-shadow:8px 8px 0 #17213d;overflow:hidden;">
        <div style="padding:18px 20px;border-bottom:3px solid #17213d;background:#ffcf55;">
          <p style="margin:0;font-size:12px;letter-spacing:.16em;text-transform:uppercase;font-weight:900;color:#17213d;">${escapeHtml(copy.heroLabel)}</p>
          <h1 style="margin:8px 0 0 0;font-size:34px;line-height:1.03;letter-spacing:-.04em;color:#17213d;">${escapeHtml(copy.heroTitle)}</h1>
        </div>
        <div style="padding:20px 20px 8px;">
          <h2 style="margin:0 0 8px 0;font-size:20px;line-height:1.2;color:#17213d;">${escapeHtml(copy.reasonTitle)}</h2>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.5;color:#34394d;">${paragraphHtml(shortIntroReason)}</p>
          ${shortRecipientReason ? `<h2 style="margin:18px 0 8px 0;font-size:20px;line-height:1.2;color:#17213d;">${escapeHtml(copy.recipientReasonTitle)}</h2><p style="margin:0 0 14px 0;font-size:15px;line-height:1.5;color:#34394d;">${paragraphHtml(shortRecipientReason)}</p>` : ""}
        </div>
        <div style="margin:6px 14px 0;padding:16px 16px;border:2px solid #17213d;border-radius:18px;background:#ffffff;">
          <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:.13em;text-transform:uppercase;font-weight:900;color:#7258e8;">${escapeHtml(copy.profileLabel)}</p>
          <h3 style="margin:0 0 10px 0;font-size:23px;line-height:1.18;letter-spacing:-.02em;color:#17213d;">${escapeHtml(displayName || "Another owner")}</h3>
          <p style="margin:0 0 14px 0;font-size:15px;line-height:1.5;color:#34394d;">${escapeHtml(shortProfileSummary)}</p>
          ${interests.length ? `<p style="margin:0 0 4px 0;font-size:14px;line-height:1.65;color:#17213d;"><strong>${escapeHtml(copy.interestsLabel)}:</strong> ${interests.map(escapeHtml).join(", ")}</p>` : ""}
        </div>
        <div style="padding:20px;background:#fff6ec;border-top:2px solid #17213d;">
          ${actionButtons}
          <p style="margin:0;font-size:13px;line-height:1.75;color:#686b7d;">
        ${escapeHtml(copy.eligibilityNote)}<br>
        <a href="${escapeHtml(siteOrigin)}/manage" style="color:#7258e8;text-decoration:underline;font-weight:700;">${escapeHtml(copy.manage)}</a> ·
        <a href="${escapeHtml(siteOrigin)}/privacy" style="color:#7258e8;text-decoration:underline;font-weight:700;">${escapeHtml(copy.privacy)}</a> ·
        <a href="${escapeHtml(siteOrigin)}/terms" style="color:#7258e8;text-decoration:underline;font-weight:700;">${escapeHtml(copy.terms)}</a> ·
        <a href="${escapeHtml(siteOrigin)}/support" style="color:#7258e8;text-decoration:underline;font-weight:700;">${escapeHtml(copy.support)}</a>
          </p>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

export async function handler(event?: unknown): Promise<{ considered: number; created: number; judged: number; rejected: number; includeTestProfiles: boolean; testRunId?: string }> {
  const tableName = requiredEnvironment("TABLE_NAME");
  const judgeMinimumScore = Number(process.env.MATCH_JUDGE_MIN_MUTUAL_SCORE ?? 75);
  const scope = matchingScope(event);
  const profileFilter = profileScopeFilter(scope);
  const active = await documentDynamo.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: profileFilter.expression,
    ExpressionAttributeValues: profileFilter.values,
    ProjectionExpression: "profileId, versionId, emailHash, embedding, profile, displayName, locale, isTestProfile, testRunId, cleanupSafe",
  }));
  const profiles = (active.Items ?? []) as ActiveProfile[];
  const profileIdsInScope = new Set(profiles.map((profile) => profile.profileId));
  const windowId = new Date().toISOString().slice(0, 10);
  const seen = new Set<string>();
  let created = 0;
  let judged = 0;
  let rejected = 0;

  for (const profile of profiles) {
    const seedCurrent = (await documentDynamo.send(new GetCommand({
      TableName: tableName,
      Key: { pk: `PROFILE#${profile.profileId}`, sk: "CURRENT" },
      ConsistentRead: true,
    }))).Item;
    if (!isCurrentMatchable(seedCurrent) || !isProfileInScope(seedCurrent, scope)) continue;
    const result = await rawDynamo.send(new SearchVectorsCommand({
      TableName: tableName,
      IndexName: requiredEnvironment("VECTOR_INDEX_NAME"),
      SearchVector: profile.embedding.map((value) => ({ N: String(value) })),
      TopK: Math.min(50, Math.max(10, profiles.length + 8)),
      SearchConditionExpression: "#scope = :active AND #matchable = :true",
      ExpressionAttributeNames: { "#scope": "profile_scope", "#matchable": "is_matchable" },
      ExpressionAttributeValues: { ":active": { S: "ACTIVE" }, ":true": { N: "1" } },
      ProjectionExpression: "profileId, versionId, emailHash, locale",
    }));
    const candidateRefs = (result.SearchResults ?? [])
      .map((entry): { profileId: string; versionId: string; score?: number } | undefined => {
        if (!entry.Item) return undefined;
        const decoded = unmarshall(entry.Item) as ActiveProfile;
        if (!decoded.profileId || !decoded.versionId || !decoded.emailHash || !profileIdsInScope.has(decoded.profileId)) return undefined;
        return { profileId: decoded.profileId, versionId: decoded.versionId, score: entry.Score };
      })
      .filter((entry): entry is { profileId: string; versionId: string; score?: number } => Boolean(entry && entry.profileId !== profile.profileId));
    const candidates = (await Promise.all(candidateRefs.map(async (candidate, index): Promise<CandidateProfile | undefined> => {
      // DynamoDB vector search does not reliably return every projected
      // application attribute. Hydrate the immutable Profile version before
      // sending candidates to the LLM judge; otherwise the judge may see empty
      // profile text and reject valid introductions.
      const hydrated = await loadProfileVersion(tableName, candidate.profileId, candidate.versionId);
      return hydrated ? { ...hydrated, score: candidate.score, rank: index + 1 } : undefined;
    }))).filter((entry): entry is CandidateProfile => Boolean(entry));
    const currentByProfileId = new Map<string, CurrentProfile>();
    currentByProfileId.set(profile.profileId, seedCurrent);
    for (const candidate of candidates) {
      const current = (await documentDynamo.send(new GetCommand({
        TableName: tableName,
        Key: { pk: `PROFILE#${candidate.profileId}`, sk: "CURRENT" },
        ConsistentRead: true,
      }))).Item;
      if (isCurrentMatchable(current) && isProfileInScope(current, scope) && haveCompatibleMatchLanguage(seedCurrent, current)) {
        currentByProfileId.set(candidate.profileId, current);
      }
    }
    const eligibleCandidates = candidates.filter((candidate) => currentByProfileId.has(candidate.profileId));
    if (!eligibleCandidates.length) continue;
    let judge: JudgeResult;
    try {
      judge = await judgeMatchCandidates(profile, eligibleCandidates);
      judged += 1;
    } catch (error) {
      rejected += 1;
      console.error(JSON.stringify({
        event: "match_judge_failed",
        seedProfileId: profile.profileId,
        errorName: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : "judge failed",
      }));
      continue;
    }
    const candidate = eligibleCandidates.find((entry) => entry.profileId === judge.bestCandidateId);
    const chosen = candidate ? judge.rankedCandidates.find((entry) => entry.candidateId === candidate.profileId) : undefined;
    if (!candidate || !chosen || chosen.decision !== "strong_match" || chosen.mutualScore < judgeMinimumScore) {
      rejected += 1;
      continue;
    }
    const pair = [profile.profileId, candidate.profileId].sort();
    const pairKey = pair.join(":");
    if (seen.has(pairKey)) continue;
    seen.add(pairKey);
    const [left, right] = pair.map((profileId) => profileId === profile.profileId ? seedCurrent : currentByProfileId.get(profileId));
    if (!left?.email || !right?.email) continue;
    const matchId = sha256(`${windowId}:${pairKey}`).slice(0, 32);
    const tokenA = randomOpaqueToken();
    const tokenB = randomOpaqueToken();
    const tokenHashA = sha256(tokenA);
    const tokenHashB = sha256(tokenB);
    const expiresAt = Math.floor(Date.now() / 1_000) + 30 * 24 * 60 * 60;
    const siteOrigin = requiredEnvironment("PUBLIC_SITE_ORIGIN");
    const reasonByProfileId = new Map([
      [profile.profileId, chosen.reasonForSeed],
      [candidate.profileId, chosen.reasonForCandidate],
    ]);
    const profileByProfileId = new Map<string, ActiveProfile | CandidateProfile>([
      [profile.profileId, profile],
      [candidate.profileId, candidate],
    ]);
    const peerPreviewFor = (profileId: string): EmailProfilePreview => {
      const peerProfileId = pair.find((entry) => entry !== profileId) ?? "";
      const peerProfile = profileByProfileId.get(peerProfileId);
      return {
        displayName: peerProfile?.displayName,
        summary: peerProfile?.profile?.summary,
        interests: peerProfile?.profile?.interests,
      };
    };
    const languageFor = (profileId: string) => uiLanguage(profileByProfileId.get(profileId)?.locale);
    const eventA = `${matchId}-a`;
    const eventB = `${matchId}-b`;
    const revealA = `${matchId}-reveal-a`;
    const revealB = `${matchId}-reveal-b`;
    const sharedCleanupKeys = [
      { pk: `MATCH#${matchId}`, sk: "META" },
      { pk: `MATCH#${matchId}`, sk: "RESPONSE#A" },
      { pk: `MATCH#${matchId}`, sk: "RESPONSE#B" },
      { pk: `MATCH_TOKEN#${tokenHashA}`, sk: "META" },
      { pk: `MATCH_TOKEN#${tokenHashB}`, sk: "META" },
      ...[eventA, eventB, revealA, revealB].map((eventId) => ({ pk: `OUTBOX#${eventId}`, sk: "META" })),
      ...pair.map((profileId) => ({ pk: `PROFILE#${profileId}`, sk: `MATCH#${matchId}` })),
    ];
    const testMeta = scope.includeTestProfiles
      ? { isTestProfile: true, cleanupSafe: true, testRunId: scope.testRunId }
      : {};
    try {
      await documentDynamo.send(new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName,
              Item: {
                pk: `MATCH#${matchId}`,
                sk: "META",
                entityType: "MATCH",
                matchId,
                profileA: pair[0],
                profileB: pair[1],
                emailA: left.email,
                emailB: right.email,
                status: "AWAITING_RESPONSES",
                score: candidate.score,
                judgeModelId: requiredEnvironment("MATCH_JUDGE_MODEL_ID"),
                judgeDecision: chosen.decision,
                mutualScore: chosen.mutualScore,
                seedInterestScore: chosen.seedInterestScore,
                candidateInterestScore: chosen.candidateInterestScore,
                introReason: judge.bestIntroReason || chosen.introReason,
                reasonA: reasonByProfileId.get(pair[0]),
                reasonB: reasonByProfileId.get(pair[1]),
                whatWeBothCareAbout: chosen.whatWeBothCareAbout,
                whyItMattersNow: chosen.whyItMattersNow,
                whatWeCouldDiscuss: chosen.whatWeCouldDiscuss,
                evidenceLabels: chosen.evidenceLabels,
                localeA: profileByProfileId.get(pair[0])?.locale,
                localeB: profileByProfileId.get(pair[1])?.locale,
                risks: chosen.risks,
                windowId,
                expiresAt,
                createdAt: new Date().toISOString(),
                ...testMeta,
              },
              ConditionExpression: "attribute_not_exists(pk)",
            },
          },
          ...[["A", tokenHashA], ["B", tokenHashB]].map(([side, tokenHash]) => ({
            Put: {
              TableName: tableName,
              Item: {
                pk: `MATCH_TOKEN#${tokenHash}`,
                sk: "META",
                entityType: "MATCH_RESPONSE_TOKEN",
                matchId,
                side,
                expiresAt,
                ...testMeta,
              },
              ConditionExpression: "attribute_not_exists(pk)",
            },
          })),
          ...pair.map((profileId, index) => ({
            Put: {
              TableName: tableName,
              Item: {
                pk: `PROFILE#${profileId}`,
                sk: `MATCH#${matchId}`,
                entityType: "PROFILE_MATCH_POINTER",
                profileId,
                peerProfileId: pair[index === 0 ? 1 : 0],
                matchId,
                cleanupKeys: sharedCleanupKeys,
                expiresAt,
                createdAt: new Date().toISOString(),
                ...testMeta,
              },
              ConditionExpression: "attribute_not_exists(pk)",
            },
          })),
          ...[[eventA, left.email, tokenA, pair[0]], [eventB, right.email, tokenB, pair[1]]].map(([eventId, email, token, profileId]) => {
            const acceptUrl = `${siteOrigin}/matches/${matchId}/accept#token=${token}`;
            const passUrl = `${siteOrigin}/matches/${matchId}/pass#token=${token}`;
            const language = languageFor(String(profileId));
            const copy = emailCopy(language);
            return ({
            Put: {
              TableName: tableName,
              Item: {
                pk: `OUTBOX#${eventId}`,
                sk: "META",
                entityType: "EMAIL_OUTBOX",
                eventId,
                status: "PENDING",
                to: email,
                subject: copy.subject,
                text: emailText({
                  language,
                  introReason: judge.bestIntroReason || chosen.introReason,
                  reasonForRecipient: reasonByProfileId.get(String(profileId)) ?? "",
                  peer: peerPreviewFor(String(profileId)),
                  acceptUrl,
                  passUrl,
                  siteOrigin,
                }),
                html: emailHtml({
                  language,
                  introReason: judge.bestIntroReason || chosen.introReason,
                  reasonForRecipient: reasonByProfileId.get(String(profileId)) ?? "",
                  peer: peerPreviewFor(String(profileId)),
                  acceptUrl,
                  passUrl,
                  siteOrigin,
                }),
                matchId,
                reason: reasonByProfileId.get(String(profileId)),
                createdAt: new Date().toISOString(),
                expiresAt,
                ...testMeta,
              },
              ConditionExpression: "attribute_not_exists(pk)",
            },
          }); }),
        ],
      }));
      created += 1;
    } catch (error) {
      if (!(error instanceof Error) || !/TransactionCanceled/.test(error.name)) throw error;
    }
  }
  return { considered: profiles.length, created, judged, rejected, includeTestProfiles: scope.includeTestProfiles, testRunId: scope.testRunId };
}
