import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { profileAnimalPersona, publicProfile, type OwnerPitchProfile } from "../shared/contracts.js";
import { renderSocialSvg } from "../shared/social-image.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

let wasmReady: Promise<void> | undefined;
let font: Uint8Array | undefined;
function fontBuffer() { return font ??= readFileSync(join(__dirname, "og-font.otf")); }
async function initialize() { await (wasmReady ??= initWasm(readFileSync(join(__dirname, "node_modules", "@resvg", "resvg-wasm", "index_bg.wasm")))); }
function plain(statusCode: number, body: string): APIGatewayProxyResultV2 { return { statusCode, headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" }, body }; }

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const raw = String(event.pathParameters?.slug ?? "").replace(/\.png$/i, "");
    const origin = requiredEnvironment("PUBLIC_SITE_ORIGIN").replace(/\/$/, "");
    let svg: string;
    if (raw === "site") svg = renderSocialSvg({ fontBase64: Buffer.from(fontBuffer()).toString("base64") });
    else {
      if (!/^[A-Za-z0-9_-]{10,80}$/.test(raw)) return plain(404, "not found");
      const tableName = requiredEnvironment("TABLE_NAME");
      const pointer = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PUBLIC_SLUG#${raw}`, sk: "PROFILE" }, ConsistentRead: true }))).Item;
      if (!pointer?.profileId) return plain(404, "not found");
      const current = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${pointer.profileId}`, sk: "CURRENT" }, ConsistentRead: true }))).Item;
      if (!current?.versionId || current.visibility === "private" || current.matchingState === "paused") return plain(404, "not found");
      const versionId = event.queryStringParameters?.version || String(current.versionId);
      if (versionId !== current.versionId) return plain(404, "not found");
      const version = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${pointer.profileId}`, sk: `VERSION#${versionId}` }, ConsistentRead: true }))).Item;
      if (!version?.profile) return plain(404, "not found");
      const profile = version.profile as OwnerPitchProfile;
      const shareable = publicProfile(profile);
      svg = renderSocialSvg({
        profile: {
          animalPersona: profileAnimalPersona(profile),
          summary: shareable.summary,
          signals: [...shareable.interests, ...shareable.active_problems, ...shareable.recurring_topics].slice(0, 3),
        },
        profileUrl: `${origin}/p/${encodeURIComponent(raw)}`,
        fontBase64: Buffer.from(fontBuffer()).toString("base64"),
      });
    }
    await initialize();
    const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 }, font: { fontBuffers: [fontBuffer()], loadSystemFonts: false, defaultFontFamily: "PyoOg" } }).render().asPng();
    return { statusCode: 200, headers: { "content-type": "image/png", "cache-control": "public, max-age=300, s-maxage=300", "x-content-type-options": "nosniff" }, isBase64Encoded: true, body: Buffer.from(png).toString("base64") };
  } catch (error) {
    console.error(JSON.stringify({ event: "social_image_failed", message: error instanceof Error ? error.message : "unknown" }));
    return plain(503, "service unavailable");
  }
}
