import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { html } from "../shared/http.js";
import { renderCloudProfileHtml, renderPrivateProfileHtml } from "../shared/profile-html.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const slug = String(event.pathParameters?.slug ?? "").toLowerCase();
    if (!/^[a-z0-9-]{3,48}$/.test(slug)) return html(404, renderPrivateProfileHtml());
    const tableName = requiredEnvironment("TABLE_NAME");
    const slugItem = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `SLUG#${slug}`, sk: "META" } }))).Item;
    if (!slugItem?.profileId) return html(404, renderPrivateProfileHtml());
    const profilePk = `PROFILE#${slugItem.profileId}`;
    const current = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: profilePk, sk: "CURRENT" }, ConsistentRead: true }))).Item;
    if (!current || current.deletedAt || !["public", "unlisted", "matched-only"].includes(String(current.visibility ?? "public"))) return html(404, renderPrivateProfileHtml());
    const requestedVersion = event.queryStringParameters?.version;
    const versionId = requestedVersion || current.versionId;
    const version = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: profilePk, sk: `VERSION#${versionId}` } }))).Item;
    if (!version || version.profileId !== slugItem.profileId) return html(404, renderPrivateProfileHtml());
    const stories = await documentDynamo.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :story)",
      ExpressionAttributeValues: { ":pk": profilePk, ":story": `VERSION#${versionId}#STORY#` },
    }));
    const versions = await documentDynamo.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk AND begins_with(sk, :version)",
      FilterExpression: "entityType = :entityType",
      ExpressionAttributeValues: { ":pk": profilePk, ":version": "VERSION#", ":entityType": "PROFILE_VERSION" },
      ProjectionExpression: "versionId, createdAt",
      ScanIndexForward: false,
    }));
    return html(200, renderCloudProfileHtml({
      profile: { ...version, animalSlug: current.animalSlug ?? version.animalSlug },
      stories: stories.Items ?? [],
      slug,
      versions: versions.Items ?? [],
      selectedVersionId: versionId,
      publicOrigin: process.env.PUBLIC_SITE_ORIGIN,
    }));
  } catch {
    return html(503, renderPrivateProfileHtml());
  }
}
