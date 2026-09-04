import { GetCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { loadSession, profileIdForEmailHash } from "../shared/auth.js";
import { validateOwnerPitchProfile } from "../shared/contracts.js";
import { bearerToken, json, parseJsonBody } from "../shared/http.js";
import { randomOpaqueToken, sha256 } from "../shared/security.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

function uploadSessionPath(event: APIGatewayProxyEventV2): boolean {
  return event.rawPath === "/v1/upload-sessions";
}

function draftIdFrom(event: APIGatewayProxyEventV2): string | undefined {
  const value = event.pathParameters?.draftId;
  return typeof value === "string" && /^[a-f0-9-]{20,64}$/i.test(value) ? value : undefined;
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const tableName = requiredEnvironment("TABLE_NAME");
    const method = event.requestContext.http.method;

    if (method === "POST" && uploadSessionPath(event)) {
      const session = await loadSession(event.headers.authorization);
      const uploadToken = randomOpaqueToken();
      const tokenHash = sha256(uploadToken);
      const now = Math.floor(Date.now() / 1_000);
      const expiresAt = now + 24 * 60 * 60;
      await documentDynamo.send(new TransactWriteCommand({
        TransactItems: [{
          Put: {
            TableName: tableName,
            Item: {
              pk: `UPLOAD#${tokenHash}`,
              sk: "META",
              entityType: "PROFILE_DRAFT_UPLOAD_TOKEN",
              profileId: profileIdForEmailHash(session.emailHash),
              emailHash: session.emailHash,
              createdAt: new Date(now * 1_000).toISOString(),
              expiresAt,
            },
            ConditionExpression: "attribute_not_exists(pk)",
          },
        }],
      }));
      return json(201, {
        submit_url: `${requiredEnvironment("PUBLIC_SITE_ORIGIN")}/v1/profile-drafts`,
        upload_token: uploadToken,
        expires_at: new Date(expiresAt * 1_000).toISOString(),
        expires_in_seconds: 24 * 60 * 60,
        capability: "single-use write-only draft creation",
      });
    }

    if (method === "POST" && event.rawPath === "/v1/profile-drafts") {
      const token = bearerToken(event.headers.authorization);
      const tokenKey = { pk: `UPLOAD#${sha256(token)}`, sk: "META" };
      const upload = (await documentDynamo.send(new GetCommand({
        TableName: tableName,
        Key: tokenKey,
        ConsistentRead: true,
      }))).Item;
      const now = Math.floor(Date.now() / 1_000);
      if (!upload || upload.usedAt || Number(upload.expiresAt) <= now) return json(401, { error: "invalid_or_expired_upload_token" });
      const body = parseJsonBody(event.body) as Record<string, unknown>;
      const bodyKeys = Object.keys(body);
      if (bodyKeys.some((key) => !["profile", "locale"].includes(key))) return json(400, { error: "unknown_draft_field" });
      const profile = validateOwnerPitchProfile(body.profile);
      const locale = body.locale === "en" ? "en" : "zh-Hant";
      const draftId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await documentDynamo.send(new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: tableName,
              Item: {
                pk: `PROFILE#${upload.profileId}`,
                sk: `DRAFT#${draftId}`,
                entityType: "PROFILE_DRAFT",
                draftId,
                profileId: upload.profileId,
                profile,
                locale,
                status: "draft",
                source: "computer_api",
                createdAt,
                expiresAt: now + 7 * 24 * 60 * 60,
              },
              ConditionExpression: "attribute_not_exists(pk)",
            },
          },
          {
            Update: {
              TableName: tableName,
              Key: tokenKey,
              UpdateExpression: "SET usedAt = :usedAt, draftId = :draftId",
              ConditionExpression: "attribute_not_exists(usedAt) AND expiresAt > :now",
              ExpressionAttributeValues: { ":usedAt": createdAt, ":draftId": draftId, ":now": now },
            },
          },
        ],
      }));
      return json(201, { draft_id: draftId, profile_id: upload.profileId, status: "draft" });
    }

    const session = await loadSession(event.headers.authorization);
    const profileId = profileIdForEmailHash(session.emailHash);
    if (method === "GET" && draftIdFrom(event)) {
      const draftId = draftIdFrom(event)!;
      const draft = (await documentDynamo.send(new GetCommand({
        TableName: tableName,
        Key: { pk: `PROFILE#${profileId}`, sk: `DRAFT#${draftId}` },
        ConsistentRead: true,
      }))).Item;
      return draft ? json(200, {
        draft_id: draft.draftId,
        status: draft.status,
        profile: draft.profile,
        locale: draft.locale,
        source: draft.source,
        created_at: draft.createdAt,
      }) : json(404, { error: "profile_draft_not_found" });
    }
    if (method === "GET" && event.rawPath === "/v1/profile-drafts") {
      const drafts = await documentDynamo.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :draft)",
        ExpressionAttributeValues: { ":pk": `PROFILE#${profileId}`, ":draft": "DRAFT#" },
        ProjectionExpression: "draftId, #status, profile, locale, #source, createdAt",
        ExpressionAttributeNames: { "#status": "status", "#source": "source" },
        ScanIndexForward: false,
        Limit: 10,
      }));
      return json(200, { drafts: drafts.Items ?? [] });
    }
    return json(405, { error: "method_not_allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "draft request failed";
    if (/session|bearer/.test(message)) return json(401, { error: "invalid_authorization" });
    if (/profile|confidence|string|duplicate|unknown|body/.test(message)) return json(400, { error: "invalid_profile_draft", detail: message });
    console.error(JSON.stringify({ event: "profile_draft_failed", message }));
    return json(503, { error: "profile_draft_failed" });
  }
}
