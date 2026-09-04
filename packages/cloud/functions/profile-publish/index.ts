import { GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { embedText } from "../../lib/reusable/bedrock.js";
import { loadSession, profileIdForEmailHash } from "../shared/auth.js";
import { canonicalMatchingDocument, payloadHash, PROFILE_SCHEMA, validatePublishPayload } from "../shared/contracts.js";
import { json, parseJsonBody } from "../shared/http.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

async function embed(document: string): Promise<number[]> {
  return embedText({
    text: document,
    modelId: requiredEnvironment("EMBEDDING_MODEL_ID"),
    dimensions: Number(requiredEnvironment("EMBEDDING_DIMENSIONS")),
  });
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const session = await loadSession(event.headers.authorization);
    const tableName = requiredEnvironment("TABLE_NAME");
    const profileId = profileIdForEmailHash(session.emailHash);

    if (event.requestContext.http.method === "GET") {
      const versionId = event.pathParameters?.versionId;
      if (!versionId) return json(404, { error: "profile_version_not_found" });
      const version = await documentDynamo.send(new GetCommand({
        TableName: tableName,
        Key: { pk: `PROFILE#${profileId}`, sk: `VERSION#${versionId}` },
        ConsistentRead: true,
        ProjectionExpression: "profileId, versionId, displayName, profile, locale, createdAt, payloadHash, embedding_status",
      }));
      return version.Item ? json(200, version.Item) : json(404, { error: "profile_version_not_found" });
    }

    const idempotencyKey = event.headers["idempotency-key"];
    if (!idempotencyKey || idempotencyKey.length > 128) return json(400, { error: "idempotency_key_required" });
    const payload = validatePublishPayload(parseJsonBody(event.body));
    const digest = payloadHash(payload);
    const idempotencyPk = `IDEMPOTENCY#${session.emailHash}`;
    const existing = await documentDynamo.send(new GetCommand({
      TableName: tableName,
      Key: { pk: idempotencyPk, sk: idempotencyKey },
      ConsistentRead: true,
    }));
    if (existing.Item) {
      if (existing.Item.payloadHash !== digest) return json(409, { error: "idempotency_key_conflict" });
      return json(200, {
        profile_id: existing.Item.profileId,
        version_id: existing.Item.versionId,
        status: "published",
        matching_status: "queued",
        idempotent_replay: true,
      });
    }

    const currentKey = { pk: `PROFILE#${profileId}`, sk: "CURRENT" };
    const current = await documentDynamo.send(new GetCommand({ TableName: tableName, Key: currentKey, ConsistentRead: true }));
    const previousVersion = current.Item?.versionId
      ? await documentDynamo.send(new GetCommand({
        TableName: tableName,
        Key: { pk: `PROFILE#${profileId}`, sk: `VERSION#${current.Item.versionId}` },
        ConsistentRead: true,
      }))
      : undefined;
    const versionId = crypto.randomUUID();
    const matchingDocument = canonicalMatchingDocument(payload.profile);
    const vector = await embed(matchingDocument);
    const createdAt = new Date().toISOString();
    const expiresAt = Math.floor(Date.now() / 1_000) + 24 * 60 * 60;
    const transaction: ConstructorParameters<typeof TransactWriteCommand>[0]["TransactItems"] = [
      {
        Put: {
          TableName: tableName,
          Item: {
            pk: `PROFILE#${profileId}`,
            sk: `VERSION#${versionId}`,
            entityType: "PROFILE_VERSION",
            schema: PROFILE_SCHEMA,
            profileId,
            versionId,
            emailHash: session.emailHash,
            displayName: payload.display_name,
            profile: payload.profile,
            locale: payload.locale,
            payloadHash: digest,
            approvedAt: payload.consent.approvedAt,
            embedding: vector,
            embedding_status: "READY",
            profile_scope: "ACTIVE",
            is_matchable: 1,
            createdAt,
          },
          ConditionExpression: "attribute_not_exists(pk)",
        },
      },
      {
        Put: {
          TableName: tableName,
          Item: {
            ...currentKey,
            entityType: "PROFILE_CURRENT",
            profileId,
            versionId,
            email: session.email,
            emailHash: session.emailHash,
            displayName: payload.display_name,
            visibility: "matched-only",
            matchingState: "active",
            matchLanguages: payload.locale === "zh-Hant" ? ["zh", "en"] : ["en"],
            updatedAt: createdAt,
          },
          ConditionExpression: current.Item ? "versionId = :expectedVersion" : "attribute_not_exists(pk)",
          ExpressionAttributeValues: current.Item ? { ":expectedVersion": current.Item.versionId } : undefined,
        },
      },
      {
        Put: {
          TableName: tableName,
          Item: {
            pk: idempotencyPk,
            sk: idempotencyKey,
            entityType: "IDEMPOTENCY_RECEIPT",
            payloadHash: digest,
            profileId,
            versionId,
            createdAt,
            expiresAt,
          },
          ConditionExpression: "attribute_not_exists(pk)",
        },
      },
    ];
    if (current.Item?.versionId && previousVersion?.Item) {
      transaction.push({
        Put: {
          TableName: tableName,
          Item: { ...previousVersion.Item, profile_scope: "ARCHIVE", is_matchable: 0 },
          ConditionExpression: "versionId = :versionId AND profile_scope = :active",
          ExpressionAttributeValues: { ":versionId": current.Item.versionId, ":active": "ACTIVE" },
        },
      });
    }
    await documentDynamo.send(new TransactWriteCommand({ TransactItems: transaction }));
    return json(201, {
      profile_id: profileId,
      version_id: versionId,
      status: "published",
      matching_status: "queued",
      idempotent_replay: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "publish failed";
    if (/session|bearer/.test(message)) return json(401, { error: "invalid_cloud_session" });
    if (/payload|schema|string|profile|confidence|locale|consent|body|required|duplicate|unknown/.test(message)) {
      return json(400, { error: "invalid_publish_payload", detail: message });
    }
    console.error(JSON.stringify({
      event: "profile_publish_failed",
      errorName: error instanceof Error ? error.name : "UnknownError",
      message,
    }));
    return json(503, { error: "profile_publish_failed" });
  }
}
