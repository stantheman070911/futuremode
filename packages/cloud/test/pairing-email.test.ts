import assert from "node:assert/strict";
import test from "node:test";
import { ownerCanSeeCandidate, renderConnectionEmail, renderInvitationEmail } from "../functions/pairing/index.js";

test("authorizes fixture edges only for their intended owner", () => {
  const fixture = { isFixtureProfile: true, fixtureAudienceEmailHash: "owner-hash" };
  assert.equal(ownerCanSeeCandidate({ emailHash: "owner-hash" }, fixture), true);
  assert.equal(ownerCanSeeCandidate({ emailHash: "other-hash" }, fixture), false);
  assert.equal(ownerCanSeeCandidate({}, fixture), false);
  assert.equal(ownerCanSeeCandidate({}, { profileId: "real" }), true);
});

test("invitation email uses the site style and does not expose contact data", () => {
  const rendered = renderInvitationEmail({
    inviterName: "Ari <Owner>",
    animal: "追著舞台光線的銀狐",
    summary: "用人像攝影研究姿勢與情緒。",
    profile: { interests: ["肩線提示"], motivations: ["讓被攝者更自然"], active_problems: ["低光引導"], recurring_topics: ["姿勢與情緒"], friend_intent: "想認識反覆測試身體語言的人。" },
    reason: "兩人都在測試肩線提示。",
    acceptUrl: "https://example.test/accept#token=opaque-token",
    profileUrl: "https://example.test/p/example-slug",
  });
  assert.match(rendered.html, /PitchYourOwner 邀請/);
  assert.match(rendered.html, /追著舞台光線的銀狐/);
  assert.match(rendered.html, /查看介紹並決定/);
  assert.match(rendered.html, /#token=opaque-token/);
  assert.match(rendered.html, /請勿轉寄/);
  assert.match(rendered.html, /肩線提示/);
  assert.match(rendered.html, /低光引導/);
  assert.match(rendered.html, /Ari &lt;Owner&gt;/);
  assert.doesNotMatch(rendered.html, /mailto:|confidence|history_scope|match score/i);
});

test("connection email contains only the intended peer contact", () => {
  const rendered = renderConnectionEmail("Mika & Co.", "peer@example.test");
  assert.match(rendered.html, /你們都接受了/);
  assert.match(rendered.html, /Mika &amp; Co\./);
  assert.match(rendered.html, /peer@example\.test/);
  assert.doesNotMatch(rendered.html, /token=|confidence|history_scope/i);
});
