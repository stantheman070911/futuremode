import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { profileAnimalPersona, publicProfile, type OwnerPitchProfile } from "../shared/contracts.js";
import { html, json } from "../shared/http.js";
import { profileImageUrl, profileSocialImageUrl } from "../shared/profile-image.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function meta(name: string, content: string, property = false): string {
  return `<meta ${property ? "property" : "name"}="${escapeHtml(name)}" content="${escapeHtml(content)}">`;
}

function list(title: string, values: unknown): string {
  const items = Array.isArray(values) ? values.filter((entry) => typeof entry === "string" && entry.trim()) : [];
  return items.length ? `<section><h2>${escapeHtml(title)}</h2><ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "";
}

function shell({ title, description, canonical, image, body, privateProfile = false }: {
  title: string; description: string; canonical: string; image: string; body: string; privateProfile?: boolean;
}): string {
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${escapeHtml(canonical)}">
  ${privateProfile ? meta("robots", "noindex, nofollow") : ""}
  ${meta("og:type", "profile", true)}${meta("og:site_name", "PitchYourOwner", true)}${meta("og:title", title, true)}${meta("og:description", description, true)}${meta("og:url", canonical, true)}${meta("og:image", image, true)}${meta("og:image:secure_url", image, true)}${meta("og:image:type", "image/png", true)}${meta("og:image:width", "1200", true)}${meta("og:image:height", "630", true)}
  ${meta("twitter:card", "summary_large_image")}${meta("twitter:title", title)}${meta("twitter:description", description)}${meta("twitter:image", image)}
  <style>:root{color-scheme:light;--ink:#17213d;--paper:#fff6ec;--card:#fffdf8;--violet:#7258e8;--yellow:#ffcf55}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,'Noto Sans TC',sans-serif}header,main,footer{width:min(760px,calc(100% - 28px));margin:auto}header{padding:22px 0;font-weight:900}main{padding:20px 0 52px}.card{background:var(--card);border:3px solid var(--ink);border-radius:25px;box-shadow:8px 8px 0 var(--ink);overflow:hidden}.hero{padding:26px;background:var(--yellow);border-bottom:3px solid var(--ink)}.portrait{display:block;width:min(280px,100%);aspect-ratio:1;margin:0 auto 22px;object-fit:cover;background:#fffdf8;border:2px solid var(--ink);border-radius:18px}.portrait-placeholder{display:grid;place-items:center;color:var(--violet);font-size:52px;font-weight:900}.animal{margin:0 0 8px;color:var(--violet);font-weight:900}.content{padding:24px}h1{font-size:clamp(2rem,8vw,3.5rem);line-height:1;margin:0}h2{font-size:1rem;text-transform:uppercase;letter-spacing:.08em;margin:26px 0 8px}p,li{line-height:1.65}ul{padding-left:1.3rem}.cta{display:block;margin-top:28px;padding:17px 20px;background:var(--violet);border:3px solid var(--ink);border-radius:18px;color:#fff;text-align:center;text-decoration:none;font-weight:900;box-shadow:5px 5px 0 var(--ink)}footer{padding:0 0 30px;color:#686b7d;font-size:.85rem}@media(max-width:375px){.hero,.content{padding:20px}.card{box-shadow:5px 5px 0 var(--ink)}}</style></head><body><header>PitchYourOwner</header><main>${body}</main><footer>Your agent knows you. Let it pitch you.</footer></body></html>`;
}

async function loadPublicProfile(tableName: string, slug: string) {
  const pointer = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PUBLIC_SLUG#${slug}`, sk: "PROFILE" }, ConsistentRead: true }))).Item;
  if (!pointer?.profileId) return undefined;
  const current = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${pointer.profileId}`, sk: "CURRENT" }, ConsistentRead: true }))).Item;
  if (!current?.versionId) return undefined;
  if (current.visibility === "private" || current.matchingState === "paused") return { privateProfile: true, current };
  const version = (await documentDynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${pointer.profileId}`, sk: `VERSION#${current.versionId}` }, ConsistentRead: true }))).Item;
  if (!version?.profile) return undefined;
  const rawProfile = version.profile as OwnerPitchProfile;
  return {
    privateProfile: false,
    current,
    version,
    displayName: profileAnimalPersona(rawProfile),
    profile: { ...publicProfile(rawProfile), animal_persona: profileAnimalPersona(rawProfile) },
  };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const slug = String(event.pathParameters?.slug ?? "").trim();
  if (!/^[A-Za-z0-9_-]{10,80}$/.test(slug)) return event.rawPath.startsWith("/v1/") ? json(404, { error: "public_profile_not_found" }) : html(404, "找不到這份介紹");
  const loaded = await loadPublicProfile(requiredEnvironment("TABLE_NAME"), slug);
  if (!loaded) return event.rawPath.startsWith("/v1/") ? json(404, { error: "public_profile_not_found" }) : html(404, "找不到這份介紹");
  const origin = requiredEnvironment("PUBLIC_SITE_ORIGIN").replace(/\/$/, "");
  const canonical = `${origin}/p/${encodeURIComponent(slug)}`;
  const genericImage = `${origin}/og/site.png`;
  if (loaded.privateProfile) {
    if (event.rawPath.startsWith("/v1/")) return json(200, { visibility: "private" });
    return html(200, shell({ title: "此介紹目前設為不公開", description: "這位 owner 目前沒有公開介紹。", canonical, image: genericImage, privateProfile: true, body: `<div class="card"><div class="hero"><p class="animal">PitchYourOwner</p><h1>此介紹目前設為不公開</h1></div><div class="content"><p>這位 owner 已暫停公開與配對。之後恢復公開時，同一個網址仍可使用。</p><a class="cta" href="/">建立我的 Owner Pitch</a></div></div>` }), {
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    });
  }
  if (!loaded.profile || !loaded.version || !loaded.displayName) return event.rawPath.startsWith("/v1/") ? json(404, { error: "public_profile_not_found" }) : html(404, "找不到這份介紹");
  const { profile, displayName, current, version } = loaded;
  const isManualTest = current.isManualTestProfile === true;
  const image = profileSocialImageUrl(current, origin) ?? genericImage;
  const profileImage = profileImageUrl(current, origin, "detail");
  if (event.rawPath.startsWith("/v1/")) return json(200, { visibility: "public", public_slug: slug, version_id: version.versionId, display_name: displayName, profile, profile_image_url: profileImage, test_data: isManualTest });
  const portrait = profileImage
    ? `<img class="portrait" src="${escapeHtml(profileImage)}" alt="${escapeHtml(displayName)}的動物角色" width="768" height="768">`
    : `<div class="portrait portrait-placeholder" aria-label="角色圖片準備中">${escapeHtml(displayName.slice(0, 1))}</div>`;
  const body = `<article class="card"><div class="hero">${portrait}${isManualTest ? '<p class="animal">測試資料 · 非真實人物</p>' : ""}<h1>${escapeHtml(displayName)}</h1></div><div class="content"><p>${escapeHtml(profile.summary)}</p>${list("興趣", profile.interests)}${list("動機", profile.motivations)}${list("正在解的問題", profile.active_problems)}${list("反覆討論", profile.recurring_topics)}<section><h2>想認識的人</h2><p>${escapeHtml(profile.friend_intent)}</p></section><a class="cta" href="/">讓你的 Agent 也介紹你</a></div></article>`;
  return html(200, shell({ title: `${displayName}｜PitchYourOwner`, description: String(profile.summary).slice(0, 180), canonical, image, body, privateProfile: isManualTest }), {
    "cache-control": "public, max-age=0, s-maxage=60",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  });
}
