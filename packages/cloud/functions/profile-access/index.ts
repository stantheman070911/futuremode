import { BatchWriteCommand, GetCommand, PutCommand, QueryCommand, TransactWriteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { loadSession, profileIdForEmailHash } from "../shared/auth.js";
import { profileAnimalPersona, type OwnerPitchProfile } from "../shared/contracts.js";
import { json, parseJsonBody } from "../shared/http.js";
import { profileImagePresentation } from "../shared/profile-image.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";
import { randomPublicSlug } from "../shared/security.js";

interface DeletionKey { pk: string; sk: string }

async function queryPartition(tableName: string, pk: string): Promise<Array<Record<string, unknown>>> {
  const items: Array<Record<string, unknown>> = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await documentDynamo.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": pk },
      ExclusiveStartKey: startKey,
      ConsistentRead: true,
    }));
    items.push(...(page.Items ?? []));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return items;
}

function deletionKeys(items: Array<Record<string, unknown>>): DeletionKey[] {
  const keys: DeletionKey[] = [];
  for (const item of items) {
    if (typeof item.pk === "string" && typeof item.sk === "string") keys.push({ pk: item.pk, sk: item.sk });
    if (Array.isArray(item.cleanupKeys)) {
      for (const key of item.cleanupKeys) {
        if (key && typeof key === "object" && typeof key.pk === "string" && typeof key.sk === "string") keys.push(key as DeletionKey);
      }
    }
  }
  return [...new Map(keys.map((key) => [`${key.pk}\u0000${key.sk}`, key])).values()];
}

async function deleteKeys(tableName: string, keys: DeletionKey[]): Promise<void> {
  for (let index = 0; index < keys.length; index += 25) {
    let pending = keys.slice(index, index + 25).map((Key) => ({ DeleteRequest: { Key } }));
    for (let attempt = 0; pending.length && attempt < 5; attempt += 1) {
      const result = await documentDynamo.send(new BatchWriteCommand({ RequestItems: { [tableName]: pending } }));
      pending = (result.UnprocessedItems?.[tableName] ?? []) as typeof pending;
    }
    if (pending.length) throw new Error("profile deletion left unprocessed items");
  }
}

async function ensurePublicSlug(tableName: string, profileId: string, current: Record<string, unknown>): Promise<string> {
  if (typeof current.publicSlug === "string" && current.publicSlug) return current.publicSlug;
  const publicSlug = randomPublicSlug();
  await documentDynamo.send(new PutCommand({
    TableName: tableName,
    Item: { pk: `PUBLIC_SLUG#${publicSlug}`, sk: "PROFILE", entityType: "PUBLIC_PROFILE_POINTER", profileId, createdAt: new Date().toISOString() },
    ConditionExpression: "attribute_not_exists(pk)",
  }));
  await documentDynamo.send(new UpdateCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${profileId}`, sk: "CURRENT" },
    UpdateExpression: "SET publicSlug = if_not_exists(publicSlug, :slug), visibility = if_not_exists(visibility, :public)",
    ExpressionAttributeValues: { ":slug": publicSlug, ":public": "public" },
    ConditionExpression: "attribute_exists(pk)",
  }));
  return publicSlug;
}

async function revokePendingInvitations(tableName: string, profileId: string, now: string): Promise<void> {
  const pointers = await documentDynamo.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :prefix)",
    ExpressionAttributeValues: { ":pk": `PROFILE#${profileId}`, ":prefix": "INVITE#" },
    ConsistentRead: true,
  }));
  for (const pointer of pointers.Items ?? []) {
    if (!pointer.pairId) continue;
    const invite = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `INVITATION#${pointer.pairId}`, sk: "META" }, ConsistentRead: true }))).Item;
    if (invite?.status !== "pending" || !invite.tokenHash) continue;
    try {
      await documentDynamo.send(new TransactWriteCommand({ TransactItems: [
        { Update: { TableName: tableName, Key: { pk: `INVITATION#${pointer.pairId}`, sk: "META" }, UpdateExpression: "SET #status = :revoked, revokedAt = :now", ConditionExpression: "#status = :pending", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":revoked": "revoked", ":pending": "pending", ":now": now } } },
        { Update: { TableName: tableName, Key: { pk: `INVITE_TOKEN#${invite.tokenHash}`, sk: "META" }, UpdateExpression: "SET #status = :revoked, revokedAt = :now", ConditionExpression: "#status = :active", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":revoked": "revoked", ":active": "active", ":now": now } } },
      ] }));
    } catch (error) {
      if (!(error instanceof Error) || !/ConditionalCheckFailed|TransactionCanceled/.test(error.name + error.message)) throw error;
    }
  }
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const session = await loadSession(event.headers.authorization);
    const tableName = requiredEnvironment("TABLE_NAME");
    const profileId = profileIdForEmailHash(session.emailHash);
    const profilePk = `PROFILE#${profileId}`;
    const current = (await documentDynamo.send(new GetCommand({
      TableName: tableName,
      Key: { pk: profilePk, sk: "CURRENT" },
      ConsistentRead: true,
    }))).Item;
    if (!current) return json(404, { error: "profile_not_found" });
    const method = event.requestContext.http.method;

    if (method === "GET") {
      const publicSlug = await ensurePublicSlug(tableName, profileId, current);
      const version = (await documentDynamo.send(new GetCommand({
        TableName: tableName,
        Key: { pk: profilePk, sk: `VERSION#${current.versionId}` },
        ConsistentRead: true,
        ProjectionExpression: "profileId, versionId, displayName, profile, locale, createdAt, approvedAt, embedding_status",
      }))).Item;
      if (!version) return json(404, { error: "profile_version_not_found" });
      return json(200, {
        profile_id: profileId,
        version_id: current.versionId,
        display_name: profileAnimalPersona(version.profile as OwnerPitchProfile),
        profile: version.profile,
        locale: version.locale,
        public_slug: publicSlug,
        visibility: current.visibility === "private" || current.matchingState === "paused" ? "private" : "public",
        matching_state: current.matchingState ?? "active",
        manual_test: current.isManualTestProfile === true,
        profile_image: profileImagePresentation(current, requiredEnvironment("PUBLIC_SITE_ORIGIN")),
        updated_at: current.updatedAt,
      });
    }

    if (method === "PATCH") {
      const body = parseJsonBody(event.body) as { visibility?: unknown };
      if (!['public', 'private'].includes(String(body.visibility))) return json(400, { error: "invalid_profile_visibility" });
      const visibility = String(body.visibility) as "public" | "private";
      const matchingState = visibility === "public" ? "active" : "paused";
      const now = new Date().toISOString();
      const publicSlug = await ensurePublicSlug(tableName, profileId, current);
      await documentDynamo.send(new TransactWriteCommand({ TransactItems: [
        { Update: {
          TableName: tableName,
          Key: { pk: profilePk, sk: "CURRENT" },
          UpdateExpression: "SET visibility = :visibility, matchingState = :state, updatedAt = :now ADD statusVersion :one",
          ExpressionAttributeValues: { ":visibility": visibility, ":state": matchingState, ":now": now, ":one": 1 },
          ConditionExpression: "attribute_exists(pk)",
        } },
        { Update: {
          TableName: tableName,
          Key: { pk: "MATCHING_GRAPH", sk: "REVISION" },
          UpdateExpression: "SET updatedAt = :now ADD revision :one",
          ExpressionAttributeValues: { ":one": 1, ":now": now },
        } },
      ] }));
      if (visibility === "private") await revokePendingInvitations(tableName, profileId, now);
      return json(200, { profile_id: profileId, public_slug: publicSlug, visibility, matching_state: matchingState });
    }

    if (method === "DELETE") {
      const body = parseJsonBody(event.body) as { confirm?: unknown };
      if (body.confirm !== "DELETE") return json(400, { error: "delete_confirmation_required" });
      const [profileItems, idempotencyItems, ownerItems, rateItems] = await Promise.all([
        queryPartition(tableName, profilePk),
        queryPartition(tableName, `IDEMPOTENCY#${session.emailHash}`),
        queryPartition(tableName, `EMAIL#${session.emailHash}`),
        queryPartition(tableName, `RATE#EMAIL#${session.emailHash}`),
      ]);
      const sessionKeys = ownerItems
        .map((item) => item.sessionPk)
        .filter((value): value is string => typeof value === "string")
        .map((pk) => ({ pk, sk: "META" }));
      sessionKeys.push({ pk: session.pk, sk: "META" });
      if (typeof current.publicSlug === "string") sessionKeys.push({ pk: `PUBLIC_SLUG#${current.publicSlug}`, sk: "PROFILE" });
      await deleteKeys(tableName, deletionKeys([...profileItems, ...idempotencyItems, ...ownerItems, ...rateItems, ...sessionKeys]));
      return json(200, { deleted: true, profile_id: profileId });
    }

    return json(405, { error: "method_not_allowed" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "request failed";
    if (/session|bearer/.test(message)) return json(401, { error: "invalid_cloud_session" });
    console.error(JSON.stringify({ event: "profile_access_failed", message }));
    return json(503, { error: "profile_access_failed" });
  }
}
