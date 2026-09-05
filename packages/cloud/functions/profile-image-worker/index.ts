import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import type { DynamoDBRecord, DynamoDBStreamEvent } from "aws-lambda";
import sharp from "sharp";
import { buildProfileImagePrompt, profileImageSourceHash, readyProfileImage } from "../shared/profile-image.js";
import type { OwnerPitchProfile } from "../shared/contracts.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

const s3 = new S3Client({});
const secrets = new SecretsManagerClient({});
let cachedApiKey: string | undefined;

interface DirectProfileImageEvent { profileId: string; versionId: string; retryFailed?: boolean; replaceRejected?: boolean }

interface ImageReview {
  pass: boolean;
  hasReadableText: boolean;
  animalCount: number;
  usesColor: boolean;
  reason: string;
}

class PermanentImageError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "PermanentImageError";
  }
}

function secretApiKey(secretString: string | undefined): string {
  if (!secretString?.trim()) throw new Error("Gemini secret is empty");
  const raw = secretString.trim();
  if (!raw.startsWith("{")) return raw;
  const parsed = JSON.parse(raw) as { API_KEY?: unknown; GEMINI_CONFIG?: { API_KEY?: unknown } };
  const value = parsed.GEMINI_CONFIG?.API_KEY ?? parsed.API_KEY;
  if (typeof value !== "string" || !value.trim()) throw new Error("Gemini secret has no API key");
  return value.trim();
}

async function apiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;
  const response = await secrets.send(new GetSecretValueCommand({ SecretId: requiredEnvironment("GEMINI_IMAGE_SECRET_ARN") }));
  cachedApiKey = secretApiKey(response.SecretString);
  return cachedApiKey;
}

export function parseGeminiImage(payload: unknown): { bytes: Buffer; mimeType: string } {
  const candidate = (payload as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: unknown; mimeType?: unknown } }> } }> })?.candidates?.[0];
  const image = candidate?.content?.parts?.find((part) => typeof part.inlineData?.data === "string")?.inlineData;
  if (!image || typeof image.data !== "string") throw new PermanentImageError("NO_IMAGE", "Gemini returned no image");
  const mimeType = typeof image.mimeType === "string" ? image.mimeType.toLowerCase() : "image/png";
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) throw new PermanentImageError("UNSUPPORTED_IMAGE", "Gemini returned an unsupported image type");
  const bytes = Buffer.from(image.data, "base64");
  if (!bytes.length || bytes.length > 8 * 1024 * 1024) throw new PermanentImageError("INVALID_IMAGE_SIZE", "Gemini image size is invalid");
  return { bytes, mimeType };
}

async function geminiRequest(modelId: string, body: Record<string, unknown>) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": await apiKey() },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(90_000),
  });
  const payload = await response.json();
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) cachedApiKey = undefined;
    const code = response.status >= 400 && response.status < 500 && response.status !== 429 ? `GEMINI_${response.status}` : "GEMINI_TRANSIENT";
    if (code !== "GEMINI_TRANSIENT") throw new PermanentImageError(code, `Gemini request failed with ${response.status}`);
    throw new Error(`Gemini request failed with ${response.status}`);
  }
  return payload;
}

async function callGemini(prompt: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const payload = await geminiRequest(requiredEnvironment("GEMINI_IMAGE_MODEL_ID"), {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } },
  });
  return parseGeminiImage(payload);
}

export function parseImageReview(payload: unknown): ImageReview {
  const text = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> })?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text;
  if (typeof text !== "string") throw new Error("Image review returned no JSON");
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const value = JSON.parse(cleaned) as Partial<ImageReview>;
  if (typeof value.pass !== "boolean" || typeof value.hasReadableText !== "boolean" || !Number.isInteger(value.animalCount) || typeof value.usesColor !== "boolean" || typeof value.reason !== "string") {
    throw new Error("Image review JSON is invalid");
  }
  return value as ImageReview;
}

export function imageReviewPass(review: ImageReview): boolean {
  return review.pass && !review.hasReadableText && review.animalCount === 1 && !review.usesColor;
}

async function reviewImage(bytes: Buffer, mimeType: string): Promise<ImageReview> {
  const payload = await geminiRequest(requiredEnvironment("GEMINI_IMAGE_REVIEW_MODEL_ID"), {
    contents: [{ parts: [
      { text: "Inspect this AI-agent animal mascot. Return JSON only with exactly these fields: {\"pass\":boolean,\"hasReadableText\":boolean,\"animalCount\":number,\"usesColor\":boolean,\"reason\":string}. animalCount means the number of depicted animal subjects, never the number of written characters. Set pass=false if there is any readable text, letter, word, number, label, logo, watermark, signature, more than one depicted animal, or meaningful color beyond black ink and a warm-white background. A small functional prop is allowed. Be strict." },
      { inlineData: { mimeType, data: bytes.toString("base64") } },
    ] }],
    generationConfig: { responseMimeType: "application/json", temperature: 0 },
  });
  const review = parseImageReview(payload);
  review.pass = imageReviewPass(review);
  return review;
}

export async function createProfileImageDerivatives(source: Buffer): Promise<{ thumbnail: Buffer; detail: Buffer }> {
  const image = sharp(source, { failOn: "error", limitInputPixels: 20_000_000 }).rotate();
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new PermanentImageError("INVALID_IMAGE", "Image dimensions are missing");
  const thumbnail = await image.clone().resize(192, 192, { fit: "cover" }).webp({ quality: 84, effort: 5 }).toBuffer();
  const detail = await image.clone().resize(768, 768, { fit: "cover", withoutEnlargement: true }).webp({ quality: 87, effort: 5 }).toBuffer();
  return { thumbnail, detail };
}

async function currentAndVersion(tableName: string, profileId: string, versionId: string) {
  const current = (await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${profileId}`, sk: "CURRENT" },
    ConsistentRead: true,
  }))).Item;
  if (!current || current.versionId !== versionId) return {};
  const version = (await documentDynamo.send(new GetCommand({
    TableName: tableName,
    Key: { pk: `PROFILE#${profileId}`, sk: `VERSION#${versionId}` },
    ConsistentRead: true,
    ProjectionExpression: "profileId, versionId, profile",
  }))).Item;
  return { current, version };
}

export async function generateCurrentProfileImage(input: DirectProfileImageEvent): Promise<{ status: string }> {
  const tableName = requiredEnvironment("TABLE_NAME");
  const { current, version } = await currentAndVersion(tableName, input.profileId, input.versionId);
  if (!current || !version?.profile) return { status: "STALE" };
  if (current.isFixtureProfile === true) return { status: "SKIPPED_FIXTURE" };
  if (current.isTestProfile === true) {
    const cohortId = process.env.MANUAL_TEST_COHORT_ID;
    const allowed = Boolean(cohortId
      && current.isManualTestProfile === true
      && current.cleanupSafe === true
      && current.testCohortId === cohortId
      && current.testRunId === cohortId);
    if (!allowed) return { status: "SKIPPED_FIXTURE" };
  }
  const existing = current.profileImage as { status?: string; versionId?: string } | undefined;
  if (readyProfileImage(current) && !input.replaceRejected) return { status: "READY" };
  if (existing?.status === "FAILED" && existing.versionId === input.versionId && !input.retryFailed) return { status: "FAILED" };

  const profile = version.profile as OwnerPitchProfile;
  const sourceHash = profileImageSourceHash(profile);
  const prefix = `profiles/${input.profileId}/${input.versionId}/${sourceHash}`;
  try {
    let accepted: { bytes: Buffer; mimeType: string } | undefined;
    let rejectionReason = "";
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const retryInstruction = attempt === 1 ? "" : `\n\nQUALITY RETRY ${attempt}: The previous output was rejected because ${rejectionReason}. Correct that issue. There must be exactly one animal and absolutely no readable or text-like marks.`;
      const generated = await callGemini(`${buildProfileImagePrompt(profile)}${retryInstruction}`);
      const review = await reviewImage(generated.bytes, generated.mimeType);
      if (review.pass) { accepted = generated; break; }
      rejectionReason = review.reason.slice(0, 240);
    }
    if (!accepted) throw new PermanentImageError("QUALITY_REJECTED", "Generated image failed the visual contract");
    const { thumbnail, detail } = await createProfileImageDerivatives(accepted.bytes);
    const bucketName = requiredEnvironment("PROFILE_IMAGE_BUCKET_NAME");
    const [thumbnailKey, detailKey] = [`${prefix}/thumbnail.webp`, `${prefix}/detail.webp`];
    await Promise.all([
      s3.send(new PutObjectCommand({ Bucket: bucketName, Key: thumbnailKey, Body: thumbnail, ContentType: "image/webp", CacheControl: "public,max-age=31536000,immutable" })),
      s3.send(new PutObjectCommand({ Bucket: bucketName, Key: detailKey, Body: detail, ContentType: "image/webp", CacheControl: "public,max-age=31536000,immutable" })),
    ]);
    await documentDynamo.send(new UpdateCommand({
      TableName: tableName,
      Key: { pk: `PROFILE#${input.profileId}`, sk: "CURRENT" },
      UpdateExpression: "SET profileImage = :image",
      ConditionExpression: "versionId = :versionId",
      ExpressionAttributeValues: {
        ":versionId": input.versionId,
        ":image": { status: "READY", versionId: input.versionId, sourceHash, thumbnailKey, detailKey, updatedAt: new Date().toISOString() },
      },
    }));
    return { status: "READY" };
  } catch (error) {
    if (!(error instanceof PermanentImageError)) throw error;
    if (readyProfileImage(current) && input.replaceRejected) return { status: "READY_RETAINED" };
    await documentDynamo.send(new UpdateCommand({
      TableName: tableName,
      Key: { pk: `PROFILE#${input.profileId}`, sk: "CURRENT" },
      UpdateExpression: "SET profileImage = :image",
      ConditionExpression: "versionId = :versionId",
      ExpressionAttributeValues: {
        ":versionId": input.versionId,
        ":image": { status: "FAILED", versionId: input.versionId, sourceHash, failureCode: error.code, updatedAt: new Date().toISOString() },
      },
    }));
    return { status: "FAILED" };
  }
}

function directEvent(value: unknown): value is DirectProfileImageEvent {
  const event = value as Partial<DirectProfileImageEvent>;
  return typeof event?.profileId === "string" && typeof event.versionId === "string";
}

function streamTarget(record: DynamoDBRecord): DirectProfileImageEvent | undefined {
  if (record.eventName !== "INSERT" && record.eventName !== "MODIFY") return undefined;
  if (!record.dynamodb?.NewImage) return undefined;
  const item = unmarshall(record.dynamodb.NewImage as Record<string, AttributeValue>);
  if (item.entityType !== "PROFILE_CURRENT" || typeof item.profileId !== "string" || typeof item.versionId !== "string") return undefined;
  const image = item.profileImage as { status?: string; versionId?: string } | undefined;
  if (image?.versionId === item.versionId && (image.status === "READY" || image.status === "FAILED")) return undefined;
  return { profileId: item.profileId, versionId: item.versionId };
}

export async function handler(event: DynamoDBStreamEvent | DirectProfileImageEvent) {
  if (directEvent(event)) return generateCurrentProfileImage(event);
  const targets = new Map<string, DirectProfileImageEvent>();
  for (const record of event.Records ?? []) {
    const target = streamTarget(record);
    if (target) targets.set(`${target.profileId}:${target.versionId}`, target);
  }
  const results = [];
  for (const target of targets.values()) results.push(await generateCurrentProfileImage(target));
  return { processed: results.length, results };
}
