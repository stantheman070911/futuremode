import { BatchWriteCommand, GetCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { loadSession, profileIdForEmailHash } from "../shared/auth.js";
import { json, parseJsonBody } from "../shared/http.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

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
      const version = (await documentDynamo.send(new GetCommand({
        TableName: tableName,
        Key: { pk: profilePk, sk: `VERSION#${current.versionId}` },
        ConsistentRead: true,
        ProjectionExpression: "profileId, versionId, profile, locale, createdAt, approvedAt, embedding_status",
      }))).Item;
      if (!version) return json(404, { error: "profile_version_not_found" });
      return json(200, {
        profile_id: profileId,
        version_id: current.versionId,
        profile: version.profile,
        locale: version.locale,
        matching_state: current.matchingState ?? "active",
        updated_at: current.updatedAt,
      });
    }

    if (method === "PATCH") {
      const body = parseJsonBody(event.body) as { matching_state?: unknown };
      if (!['active', 'paused'].includes(String(body.matching_state))) return json(400, { error: "invalid_matching_state" });
      await documentDynamo.send(new UpdateCommand({
        TableName: tableName,
        Key: { pk: profilePk, sk: "CURRENT" },
        UpdateExpression: "SET matchingState = :state, updatedAt = :now",
        ExpressionAttributeValues: { ":state": body.matching_state, ":now": new Date().toISOString() },
        ConditionExpression: "attribute_exists(pk)",
      }));
      return json(200, { profile_id: profileId, matching_state: body.matching_state });
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
