import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";
import type { OwnerPitchProfile } from "../functions/shared/contracts.js";
import { buildProfileImagePrompt, profileImagePresentation, profileImageUrl, profileSocialImageUrl, readyProfileImage } from "../functions/shared/profile-image.js";
import { createProfileImageDerivatives, imageReviewPass, parseGeminiImage, parseImageReview } from "../functions/profile-image-worker/index.js";

const profile: OwnerPitchProfile = {
  animal_persona: "戴著護目鏡、會鑽進系統底層查管線的工程羊駝",
  summary: "把 agent demo 變成一般人能可靠使用的產品。",
  interests: ["agent runtime"],
  motivations: ["降低使用門檻"],
  active_problems: ["保存 authenticated browser state"],
  recurring_topics: ["local-first deployment"],
  friend_intent: "想認識正在解 agent infrastructure 問題的人。",
  history_scope: "PRIVATE_HISTORY_SCOPE_SENTINEL",
  confidence: {
    summary: "high",
    interests: "high",
    motivations: "medium",
    active_problems: "high",
    recurring_topics: "high",
    friend_intent: "medium",
  },
};

test("profile image prompt uses only owner-approved public profile fields", () => {
  const prompt = buildProfileImagePrompt(profile);
  assert.match(prompt, /工程羊駝/);
  assert.match(prompt, /agent runtime/);
  assert.doesNotMatch(prompt, /PRIVATE_HISTORY_SCOPE_SENTINEL/);
  assert.doesNotMatch(prompt, /confidence/);
});

test("Gemini parser accepts supported inline images and rejects missing images", () => {
  const parsed = parseGeminiImage({ candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: Buffer.from("image").toString("base64") } }] } }] });
  assert.equal(parsed.mimeType, "image/png");
  assert.equal(parsed.bytes.toString(), "image");
  assert.throws(() => parseGeminiImage({ candidates: [] }), /no image/i);
});

test("image quality gate rejects text even when the reviewer pass flag is wrong", () => {
  const payload = { candidates: [{ content: { parts: [{ text: JSON.stringify({ pass: true, hasReadableText: true, animalCount: 1, usesColor: false, reason: "visible label" }) }] } }] };
  const review = parseImageReview(payload);
  assert.equal(review.hasReadableText, true);
  assert.equal(imageReviewPass(review), false);
  assert.throws(() => parseImageReview({ candidates: [{ content: { parts: [{ text: "{}" }] } }] }), /invalid/);
});

test("profile image derivatives are WebP at list and detail dimensions", async () => {
  const source = Buffer.from(`<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg"><rect width="1024" height="1024" fill="#fffaf0"/><circle cx="512" cy="512" r="260" fill="none" stroke="#000" stroke-width="18"/></svg>`);
  const result = await createProfileImageDerivatives(source);
  const [thumbnail, detail] = await Promise.all([sharp(result.thumbnail).metadata(), sharp(result.detail).metadata()]);
  assert.deepEqual([thumbnail.format, thumbnail.width, thumbnail.height], ["webp", 192, 192]);
  assert.deepEqual([detail.format, detail.width, detail.height], ["webp", 768, 768]);
});

test("profile image URL exists only for READY metadata matching CURRENT", () => {
  const current = {
    versionId: "v2",
    publicSlug: "abcdefghij",
    profileImage: { status: "READY", versionId: "v2", sourceHash: "1234567890abcdef9999", thumbnailKey: "thumb", detailKey: "detail", updatedAt: "2026-09-05T00:00:00.000Z" },
  };
  assert.ok(readyProfileImage(current));
  assert.equal(profileImageUrl(current, "https://example.test/", "thumbnail"), "https://example.test/profile-images/abcdefghij/thumbnail.webp?v=1234567890abcdef");
  assert.deepEqual(profileImagePresentation(current, "https://example.test"), {
    status: "ready",
    revision: "1234567890abcdef",
    thumbnail_url: "https://example.test/profile-images/abcdefghij/thumbnail.webp?v=1234567890abcdef",
    detail_url: "https://example.test/profile-images/abcdefghij/detail.webp?v=1234567890abcdef",
  });
  assert.equal(profileSocialImageUrl(current, "https://example.test"), "https://example.test/og/profile/abcdefghij.png?version=v2&image=1234567890abcdef");
  assert.equal(profileImageUrl({ ...current, versionId: "v3" }, "https://example.test", "detail"), undefined);
  assert.equal(profileSocialImageUrl({ ...current, versionId: "v3" }, "https://example.test"), undefined);
});

test("profile image presentation distinguishes pending and current-version failure", () => {
  assert.deepEqual(profileImagePresentation({ versionId: "v1", publicSlug: "abcdefghij" }, "https://example.test"), { status: "pending" });
  assert.deepEqual(profileImagePresentation({ versionId: "v1", publicSlug: "abcdefghij", profileImage: { status: "FAILED", versionId: "v1" } }, "https://example.test"), { status: "failed" });
  assert.deepEqual(profileImagePresentation({ versionId: "v2", publicSlug: "abcdefghij", profileImage: { status: "FAILED", versionId: "v1" } }, "https://example.test"), { status: "pending" });
});

test("frontend has a stable placeholder and no image regeneration control", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("../static/app.js", import.meta.url), "utf8"),
    readFile(new URL("../static/styles.css", import.meta.url), "utf8"),
  ]);
  assert.match(app, /function profilePortrait/);
  assert.match(styles, /\.profile-portrait\.placeholder/);
  assert.doesNotMatch(app, /重新生成圖片/);
});
