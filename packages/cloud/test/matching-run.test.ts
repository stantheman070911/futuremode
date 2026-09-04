import assert from "node:assert/strict";
import test from "node:test";
import { haveCompatibleMatchLanguage, isCurrentMatchable } from "../functions/matching-run/index.js";

test("only active current profiles with email can enter matching", () => {
  assert.equal(isCurrentMatchable({ profileId: "one", email: "one@example.com" }), true);
  assert.equal(isCurrentMatchable({ profileId: "one", email: "one@example.com", matchingState: "active" }), true);
  assert.equal(isCurrentMatchable({ profileId: "one", email: "one@example.com", matchingState: "paused" }), false);
  assert.equal(isCurrentMatchable({ profileId: "one", email: "one@example.com", matchingState: "disabled" }), false);
  assert.equal(isCurrentMatchable({ profileId: "one", matchingState: "active" }), false);
});

test("requires at least one shared match language", () => {
  assert.equal(haveCompatibleMatchLanguage(
    { profileId: "one", matchLanguages: ["zh"] },
    { profileId: "two", matchLanguages: ["en"] },
  ), false);
  assert.equal(haveCompatibleMatchLanguage(
    { profileId: "one", matchLanguages: ["zh", "en"] },
    { profileId: "two", matchLanguages: ["en"] },
  ), true);
  assert.equal(haveCompatibleMatchLanguage(
    { profileId: "one" },
    { profileId: "two", matchLanguages: ["zh"] },
  ), true);
});
