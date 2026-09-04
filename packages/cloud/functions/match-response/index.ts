import { GetCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { json, parseJsonBody } from "../shared/http.js";
import { sha256 } from "../shared/security.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

type UiLanguage = "zh" | "en";

function publicProfileUrl(slug: unknown): string | undefined {
  if (typeof slug !== "string" || !slug) return undefined;
  return `${requiredEnvironment("PUBLIC_SITE_ORIGIN")}/p/${encodeURIComponent(slug)}`;
}

function uiLanguage(locale: unknown): UiLanguage {
  return String(locale ?? "").toLowerCase().startsWith("zh") ? "zh" : "en";
}

function revealCopy(language: UiLanguage) {
  if (language === "zh") {
    return {
      subject: "你們在 PitchYourOwner 上互相有興趣",
      label: "PitchYourOwner 介紹",
      title: "你們都選擇了有興趣。",
      body: "你現在可以直接聯絡對方。",
      contactAction: "用 email 聯絡",
      emailLabel: "Email",
      manage: "管理 Profile",
      support: "Support",
      text: (otherEmail: string) => `你們都選擇了有興趣。你現在可以直接聯絡對方：${otherEmail}`,
    };
  }
  return {
    subject: "Your PitchYourOwner introduction is mutual",
    label: "PitchYourOwner Introduction",
    title: "You both accepted.",
    body: "You can now contact each other directly.",
    contactAction: "Contact by email",
    emailLabel: "Email",
    manage: "Manage Profile",
    support: "Support",
    text: (otherEmail: string) => `You both accepted. You can now contact each other at ${otherEmail}.`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function revealEmailHtml(otherEmail: string, siteOrigin: string, language: UiLanguage): string {
  const copy = revealCopy(language);
  const safeEmail = escapeHtml(otherEmail);
  const mailtoHref = `mailto:${safeEmail}`;
  return `<!doctype html>
<html lang="${language === "zh" ? "zh-Hant" : "en"}">
  <body style="margin:0;background:#ffffff;color:#111a3a;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:620px;margin:0 auto;padding:24px 18px;">
      <p style="margin:0 0 12px 0;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#6f5cff;">${escapeHtml(copy.label)}</p>
      <h1 style="margin:0 0 16px 0;font-size:28px;line-height:1.12;color:#111a3a;">${escapeHtml(copy.title)}</h1>
      <p style="margin:0 0 18px 0;font-size:16px;line-height:1.58;color:#34394d;">${escapeHtml(copy.body)}</p>
      <p style="margin:0 0 14px 0;font-size:17px;line-height:1.7;color:#111a3a;">
        <a href="${mailtoHref}" style="color:#4f46e5;text-decoration:underline;font-weight:800;word-break:break-all;">${escapeHtml(copy.contactAction)}</a>
      </p>
      <p style="margin:0;font-size:16px;line-height:1.58;color:#34394d;">
        ${escapeHtml(copy.emailLabel)}:
        <a href="${mailtoHref}" style="color:#4f46e5;text-decoration:underline;font-weight:800;word-break:break-all;">${safeEmail}</a>
      </p>
      <p style="margin:28px 0 0 0;font-size:13px;line-height:1.7;color:#686b7d;">
        <a href="${escapeHtml(siteOrigin)}/manage" style="color:#4f46e5;text-decoration:underline;">${escapeHtml(copy.manage)}</a> ·
        <a href="${escapeHtml(siteOrigin)}/support" style="color:#4f46e5;text-decoration:underline;">${escapeHtml(copy.support)}</a>
      </p>
    </div>
  </body>
</html>`;
}

async function profileLocale(tableName: string, profileId: unknown, fallback?: unknown): Promise<unknown> {
  const id = String(profileId ?? "");
  if (!id) return fallback;
  const current = (await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${id}`, sk: "CURRENT" },
    ConsistentRead: true,
    ProjectionExpression: "versionId",
  }))).Item;
  if (!current?.versionId) return fallback;
  const version = (await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${id}`, sk: `VERSION#${current.versionId}` },
    ConsistentRead: true,
    ProjectionExpression: "locale",
  }))).Item;
  return version?.locale ?? fallback;
}

async function loadMatchReview(tableName: string, matchId: string, tokenValue: string) {
  const tokenKey = { pk: `MATCH_TOKEN#${sha256(tokenValue)}`, sk: "META" };
  const tokenResult = await documentDynamo.send(new GetCommand({ TableName: tableName, Key: tokenKey, ConsistentRead: true }));
  const token = tokenResult.Item;
    if (!token || token.matchId !== matchId || token.expiresAt < Math.floor(Date.now() / 1_000)) {
      throw new Error("invalid_or_expired_match_token");
    }
  const matchResult = await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `MATCH#${matchId}`, sk: "META" },
    ConsistentRead: true,
  }));
  const match = matchResult.Item;
  if (!match?.matchId) throw new Error("match_not_found");
  const side = token.side === "A" ? "A" : "B";
  const recipientProfileId = side === "A" ? match.profileA : match.profileB;
  const peerProfileId = side === "A" ? match.profileB : match.profileA;
  const recipientLocale = await profileLocale(tableName, recipientProfileId, side === "A" ? match.localeA : match.localeB);
  const reasonForRecipient = side === "A" ? match.reasonA : match.reasonB;
  const peerEmail = side === "A" ? match.emailB : match.emailA;
  const [responseA, responseB] = await Promise.all(["A", "B"].map(async (responseSide) => (
    await documentDynamo.send(new GetCommand({
      TableName: tableName,
      Key: { pk: `MATCH#${matchId}`, sk: `RESPONSE#${responseSide}` },
      ConsistentRead: true,
    }))
  ).Item));
  const ownResponse = side === "A" ? responseA : responseB;
  const peerResponse = side === "A" ? responseB : responseA;
  const peerPk = `PROFILE#${peerProfileId}`;
  const peerCurrent = (await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: peerPk, sk: "CURRENT" },
    ConsistentRead: true,
  }))).Item;
  if (!peerCurrent || peerCurrent.deletedAt) throw new Error("peer_profile_not_found");
  const peerVersion = (await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: peerPk, sk: `VERSION#${peerCurrent.versionId}` },
    ConsistentRead: true,
  }))).Item;
  if (!peerVersion) throw new Error("peer_profile_not_found");
  const stories = await documentDynamo.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :story)",
    ExpressionAttributeValues: { ":pk": peerPk, ":story": `VERSION#${peerCurrent.versionId}#STORY#` },
  }));
  const decisionA = responseA?.decision ?? match.responseA;
  const decisionB = responseB?.decision ?? match.responseB;
  const mutual = decisionA === "accept" && decisionB === "accept";
  const closed = decisionA === "pass" || decisionB === "pass" || ["CLOSED", "MUTUAL_ACCEPT"].includes(String(match.status ?? ""));
  return {
    matchId,
    status: match.status,
    side,
    uiLanguage: uiLanguage(recipientLocale),
    recipientLocale,
    recipientProfileId,
    peerProfileId,
    response: ownResponse?.decision ?? token.decision,
    peerResponse: peerResponse?.decision,
    canRespond: !ownResponse && !token.usedAt && !closed,
    mutual,
    contactEmail: mutual ? peerEmail : undefined,
    expiresAt: token.expiresAt,
    introReason: match.introReason,
    reasonForRecipient,
    judge: {
      modelId: match.judgeModelId,
      decision: match.judgeDecision,
      mutualScore: match.mutualScore,
      seedInterestScore: match.seedInterestScore,
      candidateInterestScore: match.candidateInterestScore,
      risks: match.risks,
    },
    peer: {
      profileId: peerProfileId,
      headline: peerVersion.profileHeadline,
      markdown: peerVersion.profileMarkdown,
      locale: peerVersion.locale,
      skills: peerVersion.skills ?? [],
      activity: peerVersion.activity,
      publicUrl: ["public", "unlisted", "matched-only"].includes(String(peerCurrent.visibility ?? "public")) ? publicProfileUrl(peerCurrent.publicSlug) : undefined,
      visibility: peerCurrent.visibility,
      stories: stories.Items?.map((story) => ({
        title: story.title,
        summary: story.summary,
        markdown: story.markdown,
      })) ?? [],
    },
  };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const matchId = event.pathParameters?.matchId;
    const method = event.requestContext.http.method;
    if (method === "GET") {
      const token = event.queryStringParameters?.token;
      if (!matchId || typeof token !== "string") return json(400, { error: "invalid_match_review" });
      return json(200, await loadMatchReview(requiredEnvironment("TABLE_NAME"), matchId, token));
    }
    const body = parseJsonBody(event.body) as { token?: unknown; decision?: unknown };
    if (!matchId || typeof body.token !== "string" || !["accept", "pass"].includes(String(body.decision))) {
      return json(400, { error: "invalid_match_response" });
    }
    const tableName = requiredEnvironment("TABLE_NAME");
    const tokenKey = { pk: `MATCH_TOKEN#${sha256(body.token)}`, sk: "META" };
    const tokenResult = await documentDynamo.send(new GetCommand({ TableName: tableName, Key: tokenKey, ConsistentRead: true }));
    const token = tokenResult.Item;
    if (!token || token.matchId !== matchId || token.usedAt || token.expiresAt < Math.floor(Date.now() / 1_000)) {
      return json(401, { error: "invalid_or_expired_match_token" });
    }
    const responseSide = token.side === "A" ? "A" : "B";
    const existingResponse = (await documentDynamo.send(new GetCommand({
      TableName: tableName,
      Key: { pk: `MATCH#${matchId}`, sk: `RESPONSE#${responseSide}` },
      ConsistentRead: true,
    }))).Item;
    if (existingResponse?.decision) {
      return json(409, { error: "match_response_already_recorded", decision: existingResponse.decision });
    }
    const now = new Date().toISOString();
    await documentDynamo.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: tableName,
            Item: {
              pk: `MATCH#${matchId}`,
              sk: `RESPONSE#${responseSide}`,
              entityType: "MATCH_RESPONSE",
              matchId,
              side: responseSide,
              decision: body.decision,
              createdAt: now,
              expiresAt: token.expiresAt,
            },
            ConditionExpression: "attribute_not_exists(pk)",
          },
        },
      ],
    }));
    const matchResult = await documentDynamo.send(new GetCommand({
      TableName: tableName,
      Key: { pk: `MATCH#${matchId}`, sk: "META" },
      ConsistentRead: true,
    }));
    const match = matchResult.Item;
    if (!match?.matchId) throw new Error("match_not_found");
    const [responseA, responseB] = await Promise.all(["A", "B"].map(async (side) => (
      await documentDynamo.send(new GetCommand({
        TableName: tableName,
        Key: { pk: `MATCH#${matchId}`, sk: `RESPONSE#${side}` },
        ConsistentRead: true,
      }))
    ).Item));
    const mutual = responseA?.decision === "accept" && responseB?.decision === "accept";
    if (mutual) {
      const revealA = `${matchId}-reveal-a`;
      const revealB = `${matchId}-reveal-b`;
      const expiresAt = Math.floor(Date.now() / 1_000) + 30 * 24 * 60 * 60;
      const [languageA, languageB] = await Promise.all([
        profileLocale(tableName, match.profileA, match.localeA).then(uiLanguage),
        profileLocale(tableName, match.profileB, match.localeB).then(uiLanguage),
      ]);
      try {
        await documentDynamo.send(new TransactWriteCommand({
          TransactItems: [
            ...[
              [revealA, match.emailA, match.emailB, languageA],
              [revealB, match.emailB, match.emailA, languageB],
            ].map(([eventId, to, otherEmail, language]) => {
              const copy = revealCopy(language as UiLanguage);
              return ({
              Put: {
                TableName: tableName,
                Item: {
                  pk: `OUTBOX#${eventId}`,
                  sk: "META",
                  entityType: "EMAIL_OUTBOX",
                  eventId,
                  status: "PENDING",
                  to,
                  subject: copy.subject,
                  text: copy.text(String(otherEmail)),
                  html: revealEmailHtml(String(otherEmail), requiredEnvironment("PUBLIC_SITE_ORIGIN"), language as UiLanguage),
                  createdAt: now,
                  expiresAt,
                },
                ConditionExpression: "attribute_not_exists(pk)",
              },
            }); }),
          ],
        }));
      } catch (error) {
        if (!(error instanceof Error) || !/TransactionCanceled/.test(error.name)) throw error;
      }
    }
    return json(200, { accepted: body.decision === "accept", mutual });
  } catch (error) {
    const message = error instanceof Error ? error.message : "match_response_failed";
    console.error(JSON.stringify({
      event: "match_response_failed",
      message,
      errorName: error instanceof Error ? error.name : "UnknownError",
      matchId: event.pathParameters?.matchId,
      method: event.requestContext.http.method,
    }));
    if (message === "invalid_or_expired_match_token") return json(401, { error: message });
    if (message === "match_not_found" || message === "peer_profile_not_found") return json(404, { error: message });
    return json(503, { error: "match_response_failed" });
  }
}
