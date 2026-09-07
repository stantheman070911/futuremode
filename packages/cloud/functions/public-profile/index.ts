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
  return items.length ? `<section class="profile-section"><h2>${escapeHtml(title)}</h2><div class="tags">${items.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}</div></section>` : "";
}

function shell({ title, description, canonical, image, body, privateProfile = false }: {
  title: string; description: string; canonical: string; image: string; body: string; privateProfile?: boolean;
}): string {
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f4f2ed">
  <title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${escapeHtml(canonical)}">
  ${privateProfile ? meta("robots", "noindex, nofollow") : ""}
  ${meta("og:type", "profile", true)}${meta("og:site_name", "PitchYourOwner", true)}${meta("og:title", title, true)}${meta("og:description", description, true)}${meta("og:url", canonical, true)}${meta("og:image", image, true)}${meta("og:image:secure_url", image, true)}${meta("og:image:type", "image/png", true)}${meta("og:image:width", "1200", true)}${meta("og:image:height", "630", true)}
  ${meta("twitter:card", "summary_large_image")}${meta("twitter:title", title)}${meta("twitter:description", description)}${meta("twitter:image", image)}
  <style>@font-face{font-family:PitchSans;src:url('/fonts/dm-sans-variable.ttf') format('truetype');font-weight:100 900;font-display:swap}:root{color-scheme:light;--paper:#f4f2ed;--white:#fff;--ink:#131313;--muted:#74746d;--line:#d3d0c7;--blue:#0f5ae0;--soft:#ebe8e0;font-family:PitchSans,'Noto Sans TC',system-ui,sans-serif}*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#dfddd6;color:var(--ink)}body{font-size:16px;line-height:1.45}.app-shell{width:100%;max-width:430px;min-height:100dvh;margin:0 auto;background:var(--paper);overflow-x:hidden;box-shadow:0 0 0 1px rgba(19,19,19,.12)}header,main,footer{padding-left:24px;padding-right:24px}.wordmark{min-height:68px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);font:600 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;color:var(--muted)}.wordmark a{color:inherit;text-decoration:none}.wordmark span{color:var(--blue);letter-spacing:.04em}.content{padding-top:28px;padding-bottom:34px}.profile-lead{display:grid;grid-template-columns:96px minmax(0,1fr);gap:14px;align-items:center;margin-bottom:24px}.portrait{display:block;width:96px;height:96px;aspect-ratio:1;object-fit:cover;background:var(--white);border:1px solid var(--line);border-radius:50%}.portrait-placeholder{display:grid;place-items:center;color:var(--blue);font-size:34px;font-weight:800}.animal{margin:0 0 6px;color:var(--muted);font:600 10px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase}.test-label{color:var(--blue)}h1{margin:0;color:var(--blue);font-size:28px;line-height:1.12;letter-spacing:-.035em;overflow-wrap:anywhere}.summary{margin:0;padding:22px 0;border-top:1px solid var(--line);font-size:19px;line-height:1.55}.profile-section{padding:20px 0;border-top:1px solid var(--line)}.profile-section h2{margin:0 0 11px;color:var(--muted);font:600 10px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase}.profile-section p{margin:0;line-height:1.6}.tags{display:flex;flex-wrap:wrap;gap:6px}.tag{border:1px solid var(--ink);border-radius:2px;background:var(--white);padding:5px 8px;font-size:13px;line-height:1.25}.cta{min-height:52px;margin-top:22px;display:flex;align-items:center;justify-content:center;padding:13px 16px;border:1px solid var(--blue);border-radius:2px;background:var(--blue);color:#fff;text-align:center;text-decoration:none;font-weight:700}.cta:focus-visible{outline:3px solid rgba(15,90,224,.28);outline-offset:3px}footer{padding-top:20px;padding-bottom:calc(28px + env(safe-area-inset-bottom));border-top:1px solid var(--line);color:var(--muted);font-size:12px}@media(max-width:359px){header,main,footer{padding-left:18px;padding-right:18px}.profile-lead{grid-template-columns:76px minmax(0,1fr)}.portrait{width:76px;height:76px}h1{font-size:24px}}@media(min-width:431px){body{padding:24px 0}.app-shell{min-height:calc(100dvh - 48px);border-radius:20px}}</style></head><body><div class="app-shell"><header class="wordmark"><a href="/">PITCHYOUROWNER</a><span>${privateProfile ? "介紹狀態" : "公開介紹"}</span></header><main>${body}</main><footer>Your agent knows you. Let it pitch you.</footer></div></body></html>`;
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
    return html(200, shell({ title: "此介紹目前設為不公開", description: "這位 owner 目前沒有公開介紹。", canonical, image: genericImage, privateProfile: true, body: `<div class="content"><p class="animal">PitchYourOwner</p><h1>此介紹目前設為不公開</h1><p class="summary" style="margin-top:22px">這位 owner 已暫停公開與配對。之後恢復公開時，同一個網址仍可使用。</p><a class="cta" href="/">建立我的 Owner Pitch</a></div>` }), {
      "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; font-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
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
  const body = `<article class="content"><div class="profile-lead">${portrait}<div>${isManualTest ? '<p class="animal test-label">測試資料 · 非真實人物</p>' : '<p class="animal">Owner 親自確認的公開介紹</p>'}<h1>${escapeHtml(displayName)}</h1></div></div><p class="summary">${escapeHtml(profile.summary)}</p>${list("興趣", profile.interests)}${list("動機", profile.motivations)}${list("正在處理", profile.active_problems)}${list("反覆討論", profile.recurring_topics)}<section class="profile-section"><h2>想認識的人</h2><p>${escapeHtml(profile.friend_intent)}</p></section><a class="cta" href="/interest/${encodeURIComponent(slug)}">我也想認識這位 Owner</a></article>`;
  return html(200, shell({ title: `${displayName}｜PitchYourOwner`, description: String(profile.summary).slice(0, 180), canonical, image, body, privateProfile: isManualTest }), {
    "cache-control": "public, max-age=0, s-maxage=60",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; font-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  });
}
