import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { readyProfileImage, type ProfileImageVariant } from "../shared/profile-image.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

const s3 = new S3Client({});

function response(statusCode: number, body = "", headers: Record<string, string> = {}): APIGatewayProxyResultV2 {
  return { statusCode, body, headers };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const slug = String(event.pathParameters?.slug ?? "").trim();
  const filename = String(event.pathParameters?.variant ?? "").trim();
  const variant = filename.replace(/\.webp$/i, "") as ProfileImageVariant;
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(slug) || !["thumbnail", "detail"].includes(variant)) return response(404);

  const tableName = requiredEnvironment("TABLE_NAME");
  const pointer = (await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PUBLIC_SLUG#${slug}`, sk: "PROFILE" },
    ConsistentRead: true,
  }))).Item;
  if (!pointer?.profileId) return response(404);
  const current = (await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${pointer.profileId}`, sk: "CURRENT" },
    ConsistentRead: true,
  }))).Item;
  if (!current || current.visibility === "private" || current.matchingState === "paused") return response(404, "", { "cache-control": "no-store" });
  const image = readyProfileImage(current);
  const key = variant === "thumbnail" ? image?.thumbnailKey : image?.detailKey;
  if (!key) return response(404, "", { "cache-control": "no-store" });

  const object = await s3.send(new GetObjectCommand({ Bucket: requiredEnvironment("PROFILE_IMAGE_BUCKET_NAME"), Key: key }));
  if (!object.Body) return response(404);
  const bytes = await object.Body.transformToByteArray();
  return {
    statusCode: 200,
    isBase64Encoded: true,
    body: Buffer.from(bytes).toString("base64"),
    headers: {
      "content-type": "image/webp",
      "content-length": String(bytes.byteLength),
      "cache-control": "public,max-age=60,must-revalidate",
      "x-content-type-options": "nosniff",
    },
  };
}
