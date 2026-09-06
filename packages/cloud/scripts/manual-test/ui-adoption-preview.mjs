#!/usr/bin/env node
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const host = "127.0.0.1";
const port = Number(process.env.PYO_UI_PREVIEW_PORT || 4176);
const staticRoot = resolve(import.meta.dirname, "../../static");
const verificationCode = "246810";

let publishedProfile = null;
let publishedAt = 0;
let matchState = "suggested";
let invitationDecision = null;

const ownerImage = "/ui-reference/avatar-otter-radio.png";
const peerImage = "/ui-reference/avatar-alpaca-dancer.png";
const peerProfile = {
  animal_persona: "用腳尖讀懂情緒的粉色羊駝",
  summary: "當代舞者，研究細微姿勢與張力變化如何改變情緒表達。",
  interests: ["姿勢與張力", "編舞引導", "低光下的動作"],
  motivations: ["協助表演者傳達情緒，同時避免過度指導"],
  active_problems: ["給出有用的肢體提示，同時不打斷表演者的動勢"],
  recurring_topics: ["肩線提示", "動作前的呼吸", "手勢強度"],
  friend_intent: "正在測試細微提示如何改變觀眾感受的人。",
};
const explanation = {
  what_we_both_care_about: "你們都關注姿勢與張力如何承載情緒——你透過鏡頭，對方透過身體。",
  why_it_matters_now: "你們都想清楚引導一個人，同時避免過度指導。",
  what_we_could_discuss: "交換本週正在測試的肩線提示與短指令。",
  evidence_labels: ["interests", "active_problems", "recurring_topics"],
};

function profileResponse() {
  return {
    profile: publishedProfile,
    profile_id: "ui-preview-owner",
    version_id: "ui-preview-v1",
    public_slug: "ui-preview-owner",
    visibility: "public",
    matching_state: "active",
    profile_image_url: ownerImage,
    profile_image: { status: "ready", detail_url: ownerImage, thumbnail_url: ownerImage, revision: "ui-preview" },
  };
}

function matchResponse() {
  return {
    match_id: "ui-preview-match",
    connection_id: "ui-preview-connection",
    state: matchState,
    can_invite: matchState === "suggested",
    similarity_score: 86,
    strongest_shared_signal: "肩線、呼吸與低光如何改變觀眾感受",
    peer: {
      display_name: "UI Test Owner",
      summary: peerProfile.summary,
      profile: peerProfile,
      profile_image_url: peerImage,
      profile_image: { status: "ready", detail_url: peerImage, thumbnail_url: peerImage, revision: "ui-preview" },
      is_synthetic: true,
    },
    explanation,
  };
}

function json(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
  });
  response.end(payload);
}

async function bodyJson(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function api(request, response, pathname) {
  if (request.method === "POST" && pathname === "/v1/email-verifications") {
    return json(response, 202, { challengeId: "ui-preview-challenge", expiresInSeconds: 600 });
  }
  if (request.method === "POST" && pathname === "/v1/email-verifications/ui-preview-challenge/confirm") {
    const body = await bodyJson(request);
    if (body.code !== verificationCode) return json(response, 400, { error: "invalid_or_expired_code" });
    return json(response, 200, { accessToken: "ui-preview-access-token", manualTestAccount: false });
  }
  if (request.method === "GET" && pathname === "/v1/profiles/me") {
    return publishedProfile ? json(response, 200, profileResponse()) : json(response, 404, { error: "profile_not_found" });
  }
  if (request.method === "POST" && pathname === "/v1/profile-versions") {
    const body = await bodyJson(request);
    publishedProfile = body.profile;
    publishedAt = Date.now();
    matchState = "suggested";
    return json(response, 201, { profile_id: "ui-preview-owner", version_id: "ui-preview-v1", public_slug: "ui-preview-owner" });
  }
  if (request.method === "PATCH" && pathname === "/v1/profiles/me") {
    const body = await bodyJson(request);
    return json(response, 200, { visibility: body.visibility, matching_state: body.visibility === "public" ? "active" : "paused", public_slug: "ui-preview-owner" });
  }
  if (request.method === "DELETE" && pathname === "/v1/profiles/me") {
    publishedProfile = null;
    return json(response, 200, { status: "deleted" });
  }
  if (request.method === "POST" && pathname === "/v1/matching-runs") return json(response, 202, { status: "queued" });
  if (request.method === "GET" && pathname === "/v1/matches") {
    const ready = publishedAt && Date.now() - publishedAt >= 4_000;
    const matches = ready ? [matchResponse()] : [];
    return json(response, 200, { matches, page: 1, total_pages: 1, total: matches.length, result_set_id: "ui-preview-set" });
  }
  if (request.method === "POST" && pathname === "/v1/matches/refresh") {
    return json(response, 200, { matches: [matchResponse()], page: 1, total_pages: 1, total: 1, result_set_id: "ui-preview-set" });
  }
  if (request.method === "GET" && pathname === "/v1/matches/ui-preview-match") return json(response, 200, matchResponse());
  if (request.method === "POST" && pathname === "/v1/matches/ui-preview-match/invitations") {
    matchState = "outgoing";
    return json(response, 201, { state: matchState });
  }
  if (request.method === "GET" && pathname === "/v1/invitations") {
    const match = matchResponse();
    return json(response, 200, {
      incoming: matchState === "incoming" ? [match] : [],
      outgoing: matchState === "outgoing" ? [match] : [],
      connected: matchState === "connected" ? [match] : [],
    });
  }
  if (request.method === "POST" && pathname === "/v1/invitation-tokens/preview") {
    return json(response, 200, {
      inviter: matchResponse().peer,
      explanation: { whatWeBothCareAbout: explanation.what_we_both_care_about, whatWeCouldDiscuss: explanation.what_we_could_discuss },
    });
  }
  if (request.method === "POST" && pathname === "/v1/invitation-tokens/respond") {
    const body = await bodyJson(request);
    invitationDecision = body.decision;
    matchState = body.decision === "accept" ? "connected" : "not_now";
    return json(response, 200, { state: matchState });
  }
  if (request.method === "GET" && pathname === "/v1/connections/ui-preview-connection") {
    return json(response, 200, { connection_id: "ui-preview-connection", peer: { ...matchResponse().peer, contact_email: "ui-preview@example.invalid" }, explanation, first_email_prompt: "UI preview first-email prompt" });
  }
  if (request.method === "POST" && pathname === "/v1/upload-sessions") {
    return json(response, 201, { submit_url: `http://${host}:${port}/v1/profile-drafts`, upload_token: "ui-preview-write-only-token", expires_at: new Date(Date.now() + 86_400_000).toISOString() });
  }
  if (request.method === "GET" && pathname === "/v1/profile-drafts") return json(response, 404, { error: "profile_draft_not_found" });
  if (request.method === "POST" && pathname === "/v1/support-requests") return json(response, 201, { requestId: "ui-preview-support" });
  return json(response, 404, { error: "ui_preview_route_not_found", method: request.method, pathname, invitationDecision });
}

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".png", "image/png"],
  [".ttf", "font/ttf"],
]);

async function staticFile(request, response, pathname) {
  const requested = pathname === "/" || !extname(pathname) ? "/index.html" : pathname;
  const file = resolve(staticRoot, `.${decodeURIComponent(requested)}`);
  if (file !== staticRoot && !file.startsWith(`${staticRoot}${sep}`)) return json(response, 403, { error: "forbidden" });
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("not a file");
    const content = await readFile(file);
    response.writeHead(200, {
      "content-type": mime.get(extname(file)) || "application/octet-stream",
      "content-length": content.byteLength,
      "cache-control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    json(response, 404, { error: "static_file_not_found", pathname });
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);
    if (url.pathname.startsWith("/v1/")) await api(request, response, url.pathname);
    else await staticFile(request, response, url.pathname);
  } catch (error) {
    json(response, 500, { error: "ui_preview_failed", message: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, host, () => {
  console.log(`PitchYourOwner UI adoption preview: http://${host}:${port}`);
  console.log(`Test-only email OTP: ${verificationCode}`);
  console.log("Paste fixture: scripts/manual-test/ui-adoption-sample-profile.json");
  console.log("State is in memory and resets when this process stops. Nothing is published.");
});

for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
