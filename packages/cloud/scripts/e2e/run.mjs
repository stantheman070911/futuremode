#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import jsQR from "jsqr";
import { PNG } from "pngjs";

const required = (name) => { const value = String(process.env[name] || "").trim(); if (!value) throw new Error(`${name} is required`); return value; };
if (required("PYO_E2E_CONFIRM") !== "run-isolated-e2e") throw new Error("PYO_E2E_CONFIRM must equal run-isolated-e2e");
const artifactPath = resolve(required("PYO_E2E_ARTIFACT_FILE"));
const artifact = JSON.parse(await readFile(artifactPath, "utf8"));
assert.equal(artifact.stackName, "PitchYourOwner-e2e");
assert.equal(artifact.tableName, "pitchyourowner-e2e-profile-store");
const region = process.env.AWS_REGION || "ap-southeast-1";
const site = String(artifact.siteUrl).replace(/\/$/, "");
const tokens = artifact.sessionTokens;
const headers = (actor) => ({ authorization: `Bearer ${tokens[actor]}`, "content-type": "application/json" });
async function api(path, actor, options = {}) {
  const response = await fetch(`${site}${path}`, { ...options, headers: { ...(actor ? headers(actor) : { "content-type": "application/json" }), ...(options.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${path} returned ${response.status}:${body.error || "unknown"}`);
  return body;
}

const publishProfile = {
  history_scope: `隔離 E2E 首次發布驗證 ${artifact.runId}；未使用任何私人聊天內容。`,
  animal_persona: "校準發布管線的綠色水獺",
  summary: "用一個全新隔離帳號驗證介紹發布、公開連結與重試不會建立重複版本。",
  interests: ["發布管線可靠性"],
  motivations: ["讓使用者重試時不會丟失或重複資料"],
  active_problems: ["如何同時確保 public slug 與 idempotency receipt 一致"],
  recurring_topics: ["全新帳號的首次發布"],
  friend_intent: "想認識同樣關心可恢復網路流程與資料一致性的人。",
  confidence: { summary: "high", interests: "high", motivations: "high", active_problems: "high", recurring_topics: "high", friend_intent: "high" },
};
const publishApprovedAt = new Date().toISOString();
const publishBody = JSON.stringify({ schema: "pitchyourowner.profile-publish.v1", profile: publishProfile, locale: "zh-Hant", consent: { approvedAt: publishApprovedAt } });
const publishKey = `e2e-first-publish-${artifact.runId}`;
const firstPublish = await api("/v1/profile-versions", "P", { method: "POST", headers: { "idempotency-key": publishKey }, body: publishBody });
assert.equal(firstPublish.idempotent_replay, false);
assert.match(firstPublish.public_slug, /^[A-Za-z0-9_-]{22}$/);
const publishReplay = await api("/v1/profile-versions", "P", { method: "POST", headers: { "idempotency-key": publishKey }, body: publishBody });
assert.equal(publishReplay.idempotent_replay, true);
assert.equal(publishReplay.version_id, firstPublish.version_id);
assert.equal(publishReplay.public_slug, firstPublish.public_slug);
const publishedOwner = await api("/v1/profiles/me", "P");
assert.equal(publishedOwner.display_name, publishProfile.animal_persona);
assert.equal(publishedOwner.public_slug, firstPublish.public_slug);
const deprecatedResponse = await fetch(`${site}/v1/profile-versions`, { method: "POST", headers: { ...headers("P"), "idempotency-key": `${publishKey}-deprecated` }, body: JSON.stringify({ schema: "pitchyourowner.profile-publish.v1", display_name: "Legacy name", profile: publishProfile, locale: "zh-Hant", consent: { approvedAt: publishApprovedAt } }) });
assert.equal(deprecatedResponse.status, 400);
assert.equal((await deprecatedResponse.json()).error, "invalid_publish_payload");
assert.equal((await api("/v1/profiles/me", "P", { method: "DELETE", body: '{"confirm":"DELETE"}' })).deleted, true);

const lambda = new LambdaClient({ region });
const invoked = await lambda.send(new InvokeCommand({ FunctionName: artifact.matchingFunctionName, InvocationType: "RequestResponse", Payload: new TextEncoder().encode(JSON.stringify({ includeTestProfiles: true, testRunId: artifact.runId })) }));
const matching = JSON.parse(new TextDecoder().decode(invoked.Payload));
assert.equal(matching.status, "complete");
assert.equal(matching.profiles, 12);
assert.equal(matching.pairs_written, 66);

const first = await api("/v1/matches?page=1", "A");
assert.equal(first.total, 5); assert.equal(first.matches.length, 5); assert.equal(first.page, 1); assert.equal(first.total_pages, 1);
assert.deepEqual(first.matches.slice(0, 2).map((item) => item.peer.display_name), ["跳著舞的粉色羊駝", "叼著分鏡穿過片場的赤狐"]);
const second = await api(`/v1/matches?set=${encodeURIComponent(first.result_set_id)}&page=2`, "A");
assert.equal(second.result_set_id, first.result_set_id); assert.equal(second.page, 1); assert.deepEqual(second.matches.map((item) => item.match_id), first.matches.map((item) => item.match_id));
const reloaded = await api(`/v1/matches?set=${encodeURIComponent(first.result_set_id)}&page=1`, "A");
assert.deepEqual(reloaded.matches.map((item) => item.match_id), first.matches.map((item) => item.match_id));
const unchanged = await api(`/v1/matches/refresh?set=${encodeURIComponent(first.result_set_id)}`, "A", { method: "POST", body: "{}" });
assert.equal(unchanged.result_set_id, first.result_set_id);

const matchB = first.matches[0]; const matchC = first.matches[1];
for (const match of [matchB, matchC]) {
  const detail = await api(`/v1/matches/${match.match_id}`, "A");
  assert.ok(detail.peer.profile.interests.length); assert.ok(detail.explanation.what_we_both_care_about); assert.ok(detail.explanation.why_it_matters_now); assert.ok(detail.explanation.what_we_could_discuss);
  assert.equal("confidence" in detail.peer.profile, false); assert.equal("history_scope" in detail.peer.profile, false); assert.equal("contact_email" in detail.peer, false);
}

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
async function records() {
  const all = []; let start;
  do { const page = await dynamo.send(new ScanCommand({ TableName: artifact.tableName, FilterExpression: "testRunId = :run", ExpressionAttributeValues: { ":run": artifact.runId }, ExclusiveStartKey: start, ConsistentRead: true })); all.push(...(page.Items || [])); start = page.LastEvaluatedKey; } while (start);
  return all;
}
assert.equal((await records()).filter((item) => item.entityType === "EMAIL_OUTBOX").length, 0);

await api(`/v1/matches/${matchB.match_id}/invitations`, "A", { method: "POST", body: '{"decision":"invite"}' });
await api(`/v1/matches/${matchB.match_id}/invitations`, "A", { method: "POST", body: '{"decision":"invite"}' });
let items = await records();
let invitationOutboxes = items.filter((item) => item.entityType === "EMAIL_OUTBOX" && item.kind === "invitation");
assert.equal(invitationOutboxes.length, 1); assert.match(invitationOutboxes[0].html, /PitchYourOwner 邀請/); assert.match(invitationOutboxes[0].html, /跳著|銀狐/); assert.match(invitationOutboxes[0].html, /興趣/); assert.match(invitationOutboxes[0].html, /正在解的問題/); assert.match(invitationOutboxes[0].html, /請勿轉寄/);
const tokenB = decodeURIComponent(String(invitationOutboxes[0].html).match(/#token=([^"<]+)/)?.[1] || ""); assert.ok(tokenB);
const bBoxPk = invitationOutboxes[0].pk;
const inviteBefore = items.find((item) => item.pk === `INVITATION#${matchB.match_id}`); assert.equal(inviteBefore.status, "pending");
await api("/v1/invitation-tokens/preview", null, { method: "POST", body: JSON.stringify({ token: tokenB }) });
assert.equal((await records()).find((item) => item.pk === `INVITATION#${matchB.match_id}`).status, "pending");
await api("/v1/invitation-tokens/respond", null, { method: "POST", body: JSON.stringify({ token: tokenB, decision: "not_now" }) });
assert.equal((await records()).filter((item) => item.entityType === "CONNECTION").length, 0);
let replayStatus = 0; try { await api("/v1/invitation-tokens/respond", null, { method: "POST", body: JSON.stringify({ token: tokenB, decision: "accept" }) }); } catch { replayStatus = 1; } assert.equal(replayStatus, 1);

await api(`/v1/matches/${matchC.match_id}/invitations`, "A", { method: "POST", body: '{"decision":"invite"}' });
items = await records(); invitationOutboxes = items.filter((item) => item.entityType === "EMAIL_OUTBOX" && item.kind === "invitation"); assert.equal(invitationOutboxes.length, 2);
const cBox = invitationOutboxes.find((item) => item.pk !== bBoxPk); assert.ok(cBox);
const tokenC = decodeURIComponent(String(cBox.html).match(/#token=([^"<]+)/)?.[1] || ""); assert.ok(tokenC);
const accepted = await api("/v1/invitation-tokens/respond", null, { method: "POST", body: JSON.stringify({ token: tokenC, decision: "accept" }) });
assert.equal(accepted.state, "connected");
items = await records(); assert.equal(items.filter((item) => item.entityType === "CONNECTION" && item.pairId === matchC.match_id).length, 2); assert.equal(items.filter((item) => item.entityType === "EMAIL_OUTBOX" && item.kind === "connection").length, 2);
const connectionA = await api(`/v1/connections/${matchC.match_id}`, "A"); const connectionC = await api(`/v1/connections/${matchC.match_id}`, "C");
assert.equal(connectionA.peer.display_name, "叼著分鏡穿過片場的赤狐"); assert.equal(connectionC.peer.display_name, "追著舞台光線的銀狐"); assert.ok(connectionA.peer.contact_email); assert.ok(connectionC.peer.contact_email);
let unauthorizedConnection = 0; try { await api(`/v1/connections/${matchC.match_id}`, "B"); } catch { unauthorizedConnection = 1; } assert.equal(unauthorizedConnection, 1);
let anonymousConnection = 0; try { await api(`/v1/connections/${matchC.match_id}`, null); } catch { anonymousConnection = 1; } assert.equal(anonymousConnection, 1);

const profileC = await api("/v1/profiles/me", "C");
assert.equal(profileC.profile_image.status, "ready"); assert.match(profileC.profile_image.revision, /^[a-f0-9]{16}$/);
const publicBefore = await api(`/v1/public-profiles/${profileC.public_slug}`, null); assert.equal(publicBefore.visibility, "public"); assert.equal("confidence" in publicBefore.profile, false); assert.equal("history_scope" in publicBefore.profile, false);
const publicHtml = await fetch(`${site}/p/${profileC.public_slug}`, { headers: { "user-agent": "facebookexternalhit/1.1" } }); const publicMarkup = await publicHtml.text(); assert.equal(publicHtml.status, 200);
for (const name of ["og:title", "og:description", "og:url", "og:image", "og:image:secure_url", "og:image:type", "og:image:width", "og:image:height", "twitter:card", "twitter:title", "twitter:description", "twitter:image"]) assert.match(publicMarkup, new RegExp(`(?:property|name)="${name}"`));
assert.doesNotMatch(publicMarkup, /confidence|history_scope|result_set|contact_email|#token=/i);
await api("/v1/profiles/me", "C", { method: "PATCH", body: '{"visibility":"private"}' });
const privateView = await api(`/v1/public-profiles/${profileC.public_slug}`, null); assert.deepEqual(privateView, { visibility: "private" });
const privateHtml = await fetch(`${site}/p/${profileC.public_slug}`); const privateMarkup = await privateHtml.text(); assert.equal(privateHtml.status, 200); assert.match(privateMarkup, /此介紹目前設為不公開/); assert.match(privateMarkup, /noindex, nofollow/); assert.doesNotMatch(privateMarkup, /Mika|赤狐|電影導演/);
const cardUrl = `${site}/og/profile/${profileC.public_slug}.png?version=${encodeURIComponent(profileC.version_id)}&image=${encodeURIComponent(profileC.profile_image.revision)}`;
const privateImage = await fetch(cardUrl); assert.equal(privateImage.status, 404); assert.match(privateImage.headers.get("cache-control") || "", /no-store/);
const retainedConnection = await api(`/v1/connections/${matchC.match_id}`, "A"); assert.equal(retainedConnection.peer.display_name, "叼著分鏡穿過片場的赤狐"); assert.ok(retainedConnection.peer.contact_email); assert.match(retainedConnection.peer.profile.summary, /電影導演/);
const stableAfterPrivacy = await api(`/v1/matches?set=${encodeURIComponent(first.result_set_id)}&page=1`, "A"); assert.equal(stableAfterPrivacy.result_set_id, first.result_set_id); assert.ok(stableAfterPrivacy.matches.some((item) => item.match_id === matchC.match_id && item.unavailable));
await api("/v1/profiles/me", "C", { method: "PATCH", body: '{"visibility":"public"}' });
const changed = await api(`/v1/matches/refresh?set=${encodeURIComponent(first.result_set_id)}`, "A", { method: "POST", body: "{}" }); assert.notEqual(changed.result_set_id, first.result_set_id);
const missingRevision = await fetch(`${site}/og/profile/${profileC.public_slug}.png?version=${encodeURIComponent(profileC.version_id)}`); assert.equal(missingRevision.status, 404); assert.match(missingRevision.headers.get("cache-control") || "", /no-store/);
const staleRevision = await fetch(`${site}/og/profile/${profileC.public_slug}.png?version=${encodeURIComponent(profileC.version_id)}&image=0000000000000000`); assert.equal(staleRevision.status, 404); assert.match(staleRevision.headers.get("cache-control") || "", /no-store/);
const image = await fetch(cardUrl); assert.equal(image.status, 200); assert.match(image.headers.get("content-type") || "", /image\/png/); assert.match(image.headers.get("cache-control") || "", /max-age=0/); const imageBytes = Buffer.from(await image.arrayBuffer()); assert.equal(imageBytes.readUInt32BE(16), 1200); assert.equal(imageBytes.readUInt32BE(20), 630);
const png = PNG.sync.read(imageBytes); const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height); assert.equal(decoded?.data, `${site}/p/${profileC.public_slug}`);
const half = { width: Math.floor(png.width / 2), height: Math.floor(png.height / 2), data: new Uint8ClampedArray(Math.floor(png.width / 2) * Math.floor(png.height / 2) * 4) };
for (let y = 0; y < half.height; y += 1) for (let x = 0; x < half.width; x += 1) { const source = ((y * 2) * png.width + x * 2) * 4; const target = (y * half.width + x) * 4; half.data.set(png.data.subarray(source, source + 4), target); }
assert.equal(jsQR(half.data, half.width, half.height)?.data, `${site}/p/${profileC.public_slug}`);

const report = { passed: true, runId: artifact.runId, siteUrl: site, assertions: { firstPublishWithoutDisplayName: true, publicSlugLength: 22, publishIdempotentReplay: true, deprecatedDisplayNameRejected: true, profiles: 12, eligibleCandidates: 11, cappedCandidates: 5, page1: 5, deterministicTopTwo: true, unchangedGraphReusesSet: true, changedGraphCreatesSet: true, inviteIdempotent: true, previewReadOnly: true, rejectFinal: true, connectionRecords: 2, connectionEmails: 2, unauthorizedConnectionRejected: true, privacyPlaceholderStable: true, connectedSnapshotRetainedWhenPrivate: true, privateSocialImageRevoked: true, missingSocialImageRevisionRejected: true, staleSocialImageRevisionRejected: true, socialImage: "1200x630", socialQrDecodedAt: ["1200x630", "600x315"] } };
const reportPath = artifactPath.replace(/\.json$/, "-report.json"); await writeFile(reportPath, JSON.stringify(report, null, 2)); console.log(JSON.stringify({ passed: true, reportPath }, null, 2));
