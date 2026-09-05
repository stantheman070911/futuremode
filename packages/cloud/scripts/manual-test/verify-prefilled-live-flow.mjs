#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import jsQR from "jsqr";
import { PNG } from "pngjs";

const site = String(process.env.PYO_SITE_URL || "").replace(/\/$/, "");
const email = String(process.env.PYO_MANUAL_TEST_ACCOUNT || "").trim().toLowerCase();
const confirmation = process.env.PYO_MANUAL_TEST_CONFIRM;
if (site !== "https://d1vuzznd4gxltu.cloudfront.net") throw new Error("exact Hackathon site URL is required");
if (!/^test100[1-9]@futuremode\.test$/.test(email)) throw new Error("use a disposable allowlisted account from test1001 through test1009; test1000 is reserved for the Host Owner");
if (confirmation !== "reset-and-verify-prefilled-live-flow") throw new Error("explicit manual-test confirmation is required");

const secretPath = resolve(import.meta.dirname, "../../../../.secrets/manual-test-accounts.json");
const configuration = JSON.parse(await readFile(secretPath, "utf8"));
assert.equal(configuration.enabled, true);
assert.equal(configuration.cohortId, "hackathon-manual-20260905");
assert.ok(configuration.accounts[email]);
assert.match(configuration.verificationCode, /^\d{6}$/);

async function request(path, options = {}) {
  const response = await fetch(`${site}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("json") ? await response.json() : await response.text();
  return { response, body };
}

async function authenticate() {
  const requested = await request("/v1/email-verifications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email }),
  });
  assert.equal(requested.response.status, 202);
  assert.equal(requested.body.manualTestAccount, true);
  const confirmed = await request(`/v1/email-verifications/${encodeURIComponent(requested.body.challengeId)}/confirm`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, code: configuration.verificationCode }),
  });
  assert.equal(confirmed.response.status, 200);
  assert.equal(confirmed.body.manualTestAccount, true);
  assert.ok(confirmed.body.accessToken);
  return confirmed.body.accessToken;
}

const authenticated = (token, path, options = {}) => request(path, {
  ...options,
  headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(options.headers || {}) },
});

const timeline = [];
let token = await authenticate();
const existing = await authenticated(token, "/v1/profiles/me");
if (existing.response.status === 200) {
  const deleted = await authenticated(token, "/v1/profiles/me", { method: "DELETE", body: JSON.stringify({ confirm: "DELETE" }) });
  assert.equal(deleted.response.status, 200);
  timeline.push("existing synthetic profile removed through authenticated product API");
} else assert.equal(existing.response.status, 404);

token = await authenticate();
const bootstrap = await authenticated(token, "/v1/manual-test/bootstrap", { method: "POST", body: "{}" });
assert.equal(bootstrap.response.status, 200);
assert.equal(bootstrap.body.status, "prefilled_draft");
assert.equal(bootstrap.body.locale, "zh-Hant");
assert.equal(bootstrap.body.schema, "pitchyourowner.profile-publish.v1");
for (const field of ["history_scope", "animal_persona", "summary", "interests", "motivations", "active_problems", "recurring_topics", "friend_intent", "confidence"]) assert.ok(bootstrap.body.profile[field]);
timeline.push("bootstrap returned a complete prefilled draft");

const beforePublish = await authenticated(token, "/v1/profiles/me");
assert.equal(beforePublish.response.status, 404);
timeline.push("no published profile existed before explicit publish");

const approvedAt = new Date().toISOString();
const published = await authenticated(token, "/v1/profile-versions", {
  method: "POST",
  headers: { "idempotency-key": `manual-live-verify-${crypto.randomUUID()}` },
  body: JSON.stringify({ schema: bootstrap.body.schema, profile: bootstrap.body.profile, locale: bootstrap.body.locale, consent: { approvedAt } }),
});
assert.equal(published.response.status, 201);
timeline.push("canonical publish created the profile version");

let presentation = await authenticated(token, "/v1/profiles/me");
assert.equal(presentation.response.status, 200);
assert.equal(presentation.body.manual_test, true);
assert.ok(["pending", "ready"].includes(presentation.body.profile_image.status));
const firstImageState = presentation.body.profile_image.status;
timeline.push(`first profile image state was ${firstImageState}`);

const earlyCard = await request(`/og/profile/${encodeURIComponent(published.body.public_slug)}.png?version=${encodeURIComponent(published.body.version_id)}`);
assert.equal(earlyCard.response.status, 404);
assert.match(earlyCard.response.headers.get("cache-control") || "", /no-store/);
timeline.push("portraitless card URL was rejected with no-store");

const startedAt = Date.now();
while (presentation.body.profile_image.status === "pending" && Date.now() - startedAt < 150_000) {
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 3_000));
  presentation = await authenticated(token, "/v1/profiles/me");
  assert.equal(presentation.response.status, 200);
}
assert.equal(presentation.body.profile_image.status, "ready");
assert.match(presentation.body.profile_image.revision, /^[a-f0-9]{16}$/);
assert.match(presentation.body.profile_image.thumbnail_url, /thumbnail\.webp\?v=/);
assert.match(presentation.body.profile_image.detail_url, /detail\.webp\?v=/);
timeline.push("production Gemini portrait reached READY with revisioned WebP URLs");

const publicProfile = await request(`/p/${encodeURIComponent(published.body.public_slug)}?verify=manual-live-flow`);
assert.equal(publicProfile.response.status, 200);
assert.match(publicProfile.body, /<img class="portrait"/);
assert.match(publicProfile.body, new RegExp(`image=${presentation.body.profile_image.revision}`));
timeline.push("public profile advertised the READY revisioned social card");

const cardPath = `/og/profile/${encodeURIComponent(published.body.public_slug)}.png?version=${encodeURIComponent(published.body.version_id)}&image=${encodeURIComponent(presentation.body.profile_image.revision)}`;
const cardResponse = await fetch(`${site}${cardPath}`);
assert.equal(cardResponse.status, 200);
assert.match(cardResponse.headers.get("content-type") || "", /image\/png/);
assert.match(cardResponse.headers.get("cache-control") || "", /max-age=0/);
const cardBytes = Buffer.from(await cardResponse.arrayBuffer());
const card = PNG.sync.read(cardBytes);
assert.deepEqual([card.width, card.height], [1200, 630]);
const qr = jsQR(new Uint8ClampedArray(card.data), card.width, card.height);
assert.equal(qr?.data, `${site}/p/${published.body.public_slug}`);
let darkPortraitPixels = 0;
for (let y = 205; y < 330; y += 1) {
  for (let x = 730; x < 855; x += 1) {
    const offset = (y * card.width + x) * 4;
    if (card.data[offset] < 150 && card.data[offset + 1] < 150 && card.data[offset + 2] < 150) darkPortraitPixels += 1;
  }
}
assert.ok(darkPortraitPixels > 50, `portrait area is unexpectedly blank (${darkPortraitPixels} dark pixels)`);
timeline.push("1200x630 social card contained visible portrait ink and a QR linking to the public profile");

const staleCard = await request(`${cardPath.replace(/image=[^&]+/, "image=0000000000000000")}`);
assert.equal(staleCard.response.status, 404);
assert.match(staleCard.response.headers.get("cache-control") || "", /no-store/);
timeline.push("stale image revision was rejected with no-store");

console.log(JSON.stringify({
  passed: true,
  account: email,
  persona: configuration.accounts[email],
  initialImageState: firstImageState,
  finalImageState: presentation.body.profile_image.status,
  imageRevision: presentation.body.profile_image.revision,
  publicProfileUrl: `${site}/p/${published.body.public_slug}`,
  socialCardUrl: `${site}${cardPath}`,
  socialCard: { width: card.width, height: card.height, bytes: cardBytes.byteLength, darkPortraitPixels, qr: qr?.data },
  timeline,
}, null, 2));
