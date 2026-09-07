import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appUrl = new URL("../static/app.js", import.meta.url);
const stylesUrl = new URL("../static/styles.css", import.meta.url);
const pairingUrl = new URL("../functions/pairing/index.ts", import.meta.url);
const publicProfileUrl = new URL("../functions/public-profile/index.ts", import.meta.url);

test("keeps social-link intent private until an authenticated owner claims it", async () => {
  const pairing = await readFile(pairingUrl, "utf8");
  assert.match(pairing, /INTEREST_INTENT_LIFETIME_SECONDS = 30 \* DAY/);
  assert.match(pairing, /INTEREST_INTENT#\$\{tokenHash\}/);
  assert.match(pairing, /source: "public_profile"/);
  assert.doesNotMatch(pairing.slice(pairing.indexOf("async function createInterestIntent"), pairing.indexOf("async function claimInterest")), /targetEmail|recipientEmail/);
  assert.match(pairing, /ownerProfileId = :owner, claimedAt = :now/);
  assert.match(pairing, /INTEREST#\$\{target\.profileId\}/);
  assert.match(pairing, /interest_self_not_allowed/);
});

test("adds Interested as a private fourth invitation state without changing match pagination", async () => {
  const [app, styles, pairing] = await Promise.all([
    readFile(appUrl, "utf8"),
    readFile(stylesUrl, "utf8"),
    readFile(pairingUrl, "utf8"),
  ]);
  assert.match(app, /"invites\.interested": "想認識"/);
  assert.match(app, /id="interested" class="invitation-section"/);
  assert.match(app, /data-action="remove-interest"/);
  assert.match(app, /\/matches\/\$\{encodeURIComponent\(item\.match_id\)\}\?from=interested/);
  assert.match(app, /returnToInterest \? "\/invitations#interested" : "\/matches"/);
  assert.match(styles, /\.interest-card-main\{/);
  assert.match(pairing, /interested,/);
  assert.match(pairing, /INTEREST#\$\{peer\.profileId\}/);
  assert.match(pairing, /invitationPeerIds\.has\(targetProfileId\)/);
  assert.doesNotMatch(pairing.slice(pairing.indexOf("async function createResultSet"), pairing.indexOf("async function loadResultSet")), /INTEREST#/);
});

test("public profile uses the production flat detail style and explicit interest CTA", async () => {
  const page = await readFile(publicProfileUrl, "utf8");
  assert.match(page, /--paper:#f4f2ed/);
  assert.match(page, /--blue:#0f5ae0/);
  assert.match(page, /class="profile-lead"/);
  assert.match(page, /border-radius:50%/);
  assert.match(page, /我也想認識這位 Owner/);
  assert.match(page, /href="\/interest\/\$\{encodeURIComponent\(slug\)\}"/);
  assert.doesNotMatch(page, /box-shadow:8px 8px 0/);
  assert.doesNotMatch(page, /background:var\(--yellow\)/);
});

test("never auto-sends an invitation while saving or claiming interest", async () => {
  const [app, pairing] = await Promise.all([readFile(appUrl, "utf8"), readFile(pairingUrl, "utf8")]);
  const clientInterest = app.slice(app.indexOf("async function claimPendingInterest"), app.indexOf("function shell"));
  assert.match(clientInterest, /\/v1\/interests\/claim/);
  assert.doesNotMatch(clientInterest, /\/v1\/matches\/[^\s"'`]+\/invitations/);
  const claim = pairing.slice(pairing.indexOf("async function claimInterest"), pairing.indexOf("async function removeInterest"));
  assert.doesNotMatch(claim, /EMAIL_OUTBOX|INVITATION#/);
});

test("uses the approved concise pre-profile interest state", async () => {
  const app = await readFile(appUrl, "utf8");
  const screen = app.slice(app.indexOf("function interestScreen"), app.indexOf("function assistantScreen"));
  assert.match(app, /"interest\.profileTitle": "先讓你的 Agent 介紹你。"/);
  assert.match(app, /"interest\.header": "建立介紹"/);
  assert.match(screen, /interest\.profileTitle/);
  assert.match(screen, /interest\.profileBody/);
  assert.match(screen, /interest-back text-action/);
  assert.doesNotMatch(screen, /profilePortrait|target\.summary|match-detail-person/);
});
