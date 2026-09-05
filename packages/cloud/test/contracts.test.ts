import assert from "node:assert/strict";
import test from "node:test";
import { canonicalMatchingDocument, payloadHash, publicProfile, validateOwnerPitchProfile, validatePublishPayload } from "../functions/shared/contracts.js";
import { profileIdForEmailHash } from "../functions/shared/auth.js";

const profile = {
  animal_persona: "追著光線的銀狐",
  summary: "Portrait photographer exploring how subtle posture changes emotion in a frame.",
  interests: ["Subject direction", "Posture and tension"],
  motivations: ["Create portraits that feel natural"],
  active_problems: ["Directing a stranger in under 90 seconds"],
  recurring_topics: ["Shoulder-line cues", "Mixed-light skin tone"],
  friend_intent: "Someone who practises a similar problem every week.",
  history_scope: "Recent selected chats were available; deleted and voice chats were unavailable.",
  confidence: {
    summary: "high",
    interests: "high",
    motivations: "medium",
    active_problems: "medium",
    recurring_topics: "medium",
    friend_intent: "low",
  },
} as const;

const payload = {
  schema: "pitchyourowner.profile-publish.v1",
  profile,
  locale: "zh-Hant",
  consent: { approvedAt: "2026-09-04T08:00:00.000Z" },
} as const;

test("validates the public animal persona, seven matching fields, and owner-only confidence", () => {
  const parsed = validatePublishPayload(payload);
  assert.equal(parsed.profile.summary, profile.summary);
  assert.equal(parsed.profile.animal_persona, profile.animal_persona);
  assert.equal(parsed.profile.confidence.friend_intent, "low");
});

test("uses animal_persona without accepting separate display-name metadata", () => {
  assert.throws(() => validatePublishPayload({ ...payload, display_name: "Ari C." }), /unknown fields/);
  assert.equal(validatePublishPayload(payload).profile.animal_persona, "追著光線的銀狐");
});

test("matching document excludes scope and confidence", () => {
  const document = canonicalMatchingDocument(validateOwnerPitchProfile(profile));
  assert.match(document, /Subject direction/);
  assert.match(document, /Directing a stranger/);
  assert.doesNotMatch(document, /deleted and voice chats/);
  assert.doesNotMatch(document, /confidence|medium|low/i);
  assert.doesNotMatch(document, /追著光線的銀狐/);
});

test("peer projection excludes scope and confidence", () => {
  const peer = publicProfile(validateOwnerPitchProfile(profile));
  assert.equal("history_scope" in peer, false);
  assert.equal("confidence" in peer, false);
  assert.deepEqual(peer.interests, profile.interests);
});

test("rejects unknown fields, duplicates, and incomplete confidence", () => {
  assert.throws(() => validateOwnerPitchProfile({ ...profile, privacy_ledger: [] }), /unknown fields/);
  assert.throws(() => validateOwnerPitchProfile({ ...profile, interests: ["Posture", "posture"] }), /duplicate/);
  const { friend_intent: _friend, ...incomplete } = profile.confidence;
  assert.throws(() => validateOwnerPitchProfile({ ...profile, confidence: incomplete }), /friend_intent/);
});

test("produces stable hashes across object key order", () => {
  const first = payloadHash(validatePublishPayload(payload));
  const { consent, ...remaining } = payload;
  const second = payloadHash(validatePublishPayload({ consent, ...remaining }));
  assert.equal(first, second);
});

test("uses one stable cloud identity per verified email hash", () => {
  assert.equal(profileIdForEmailHash("same-email-hash"), profileIdForEmailHash("same-email-hash"));
  assert.notEqual(profileIdForEmailHash("same-email-hash"), profileIdForEmailHash("another-email-hash"));
});
