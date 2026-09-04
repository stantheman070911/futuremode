import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { renderProfileSocialSvg } from "../shared/profile-social-image.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

let cachedFontBase64 = "";
let cachedFontBuffer: Uint8Array | undefined;
let cachedFontPath = "";
let wasmReady: Promise<void> | undefined;

function fontPath(): string {
  if (!cachedFontPath) cachedFontPath = join(__dirname, "og-font.ttf");
  return cachedFontPath;
}

function fontBuffer(): Uint8Array {
  if (!cachedFontBuffer) cachedFontBuffer = readFileSync(fontPath());
  return cachedFontBuffer;
}

function fontBase64(): string {
  if (!cachedFontBase64) {
    cachedFontBase64 = Buffer.from(fontBuffer()).toString("base64");
  }
  return cachedFontBase64;
}

async function ensureWasmReady(): Promise<void> {
  if (!wasmReady) {
    wasmReady = initWasm(readFileSync(join(__dirname, "node_modules", "@resvg", "resvg-wasm", "index_bg.wasm")));
  }
  await wasmReady;
}

function text(statusCode: number, body: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
    body,
  };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const slug = String(event.pathParameters?.slug ?? "").toLowerCase().replace(/\.png$/i, "");
    if (!/^[a-z0-9-]{3,48}$/.test(slug)) return text(404, "not found");
    const tableName = requiredEnvironment("TABLE_NAME");
    const publicOrigin = process.env.PUBLIC_SITE_ORIGIN || "https://pitchyourowner.oysterun.com";
    const slugItem = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `SLUG#${slug}`, sk: "META" } }))).Item;
    if (!slugItem?.profileId) return text(404, "not found");
    const profilePk = `PROFILE#${slugItem.profileId}`;
    const current = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: profilePk, sk: "CURRENT" }, ConsistentRead: true }))).Item;
    if (!current || current.deletedAt || !["public", "unlisted", "matched-only"].includes(String(current.visibility ?? "public"))) return text(404, "not found");
    const requestedVersion = event.queryStringParameters?.version;
    const versionId = requestedVersion || current.versionId;
    const version = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: profilePk, sk: `VERSION#${versionId}` } }))).Item;
    if (!version || version.profileId !== slugItem.profileId) return text(404, "not found");
    await ensureWasmReady();
    const svg = renderProfileSocialSvg({
      profile: { ...version, animalSlug: current.animalSlug ?? version.animalSlug },
      slug,
      publicOrigin,
      fontBase64: fontBase64(),
    });
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font: {
        fontBuffers: [fontBuffer()],
        loadSystemFonts: false,
        defaultFontFamily: "PitchYourOwnerOg",
      },
    }).render().asPng();
    return {
      statusCode: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=300, s-maxage=300",
        "x-content-type-options": "nosniff",
      },
      isBase64Encoded: true,
      body: Buffer.from(png).toString("base64"),
    };
  } catch {
    return text(503, "service unavailable");
  }
}
