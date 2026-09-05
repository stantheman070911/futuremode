import assert from "node:assert/strict";
import test from "node:test";
import profiles from "../config/manual-test-profiles.json" with { type: "json" };
import { validateOwnerPitchProfile } from "../functions/shared/contracts.js";
import { ownerCanSeeCandidate } from "../functions/pairing/index.js";

test("ships ten distinct schema-valid manual test personas", () => {
  const entries = Object.entries(profiles);
  assert.equal(entries.length, 10);
  const animals = entries.map(([, profile]) => validateOwnerPitchProfile(profile).animal_persona);
  assert.equal(new Set(animals).size, 10);
});

test("manual test owners and real owners are mutually isolated", () => {
  const cohort = { isTestProfile: true, cleanupSafe: true, testRunId: "cohort-a" };
  const other = { isTestProfile: true, cleanupSafe: true, testRunId: "cohort-b" };
  const real = { profileId: "real" };
  assert.equal(ownerCanSeeCandidate(cohort, { ...cohort, profileId: "peer" }), true);
  assert.equal(ownerCanSeeCandidate(cohort, other), false);
  assert.equal(ownerCanSeeCandidate(cohort, real), false);
  assert.equal(ownerCanSeeCandidate({ ...cohort, emailHash: "audience" }, { isFixtureProfile: true, fixtureAudienceEmailHash: "audience" }), false);
  assert.equal(ownerCanSeeCandidate(real, cohort), false);
  assert.equal(ownerCanSeeCandidate(real, { profileId: "other-real" }), true);
});
