import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appUrl = new URL("../static/app.js", import.meta.url);
const stylesUrl = new URL("../static/styles.css", import.meta.url);
const productContractUrl = new URL("../../../docs/product-design.md", import.meta.url);
const developmentPlanUrl = new URL("../../../docs/handoff/development-brief.md", import.meta.url);

test("connects the real versioned social image to My Pitch", async () => {
  const [app, styles] = await Promise.all([
    readFile(appUrl, "utf8"),
    readFile(stylesUrl, "utf8"),
  ]);

  assert.match(app, /function publicProfileSharePanel\(\)/);
  assert.match(app, /imageUrl\.searchParams\.set\("version", versionId\)/);
  assert.match(app, /class="public-share-card"/);
  assert.match(app, /width="1200" height="630"/);
  assert.match(app, /\$\{publicProfileSharePanel\(\)\}/);
  assert.match(styles, /\.public-share-card\{/);
  assert.match(styles, /aspect-ratio:1200\/630/);
});

test("uses VibeMate-style platform intents with portable fallbacks", async () => {
  const app = await readFile(appUrl, "utf8");

  assert.match(app, /https:\/\/twitter\.com\/intent\/tweet\?text=/);
  assert.match(app, /https:\/\/www\.facebook\.com\/sharer\/sharer\.php\?u=/);
  assert.match(app, /https:\/\/www\.threads\.net\/intent\/post\?text=/);
  assert.doesNotMatch(app, /instagram\.com\/.*(?:share|intent)/i);
  assert.match(app, /navigator\.share\(\{ title: share\.title, text: share\.caption, url: share\.publicUrl \}\)/);
  assert.match(app, /if \(error\?\.name === "AbortError"\) return/);
  assert.match(app, /copyPublicProfileLink\(\{ fallback: true \}\)/);
  assert.match(app, /data-action="copy-public-profile-link"/);
  assert.match(app, /data-action="copy-public-profile-post"/);
  assert.match(app, /download="pitchyourowner-/);
});

test("keeps sharing optional, private-safe, accessible, and claim-disciplined", async () => {
  const [app, productContract, developmentPlan] = await Promise.all([
    readFile(appUrl, "utf8"),
    readFile(productContractUrl, "utf8"),
    readFile(developmentPlanUrl, "utf8"),
  ]);

  assert.match(app, /runtime\.profile\?\.visibility === "private"/);
  assert.match(app, /share\.privateBody/);
  assert.match(app, /id="profile-share" tabindex="-1"/);
  assert.match(app, /announce\(runtime\.notice\)/);
  assert.match(app, /data-action="open-published-share"/);
  assert.match(productContract, /must never claim that every social platform will display the preview/);
  assert.match(developmentPlan, /A metadata unit\s+test, successful PNG request, or in-app preview does not prove platform rendering/);
  assert.doesNotMatch(app, /任何社群平台都會正常顯示/);
});
