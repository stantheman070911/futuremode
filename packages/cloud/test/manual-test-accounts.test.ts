import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import profiles from "../config/manual-test-profiles.json" with { type: "json" };
import { validateOwnerPitchProfile } from "../functions/shared/contracts.js";
import { prefilledManualTestDraft } from "../functions/manual-test-bootstrap/index.js";
import { ownerCanSeeCandidate } from "../functions/pairing/index.js";

test("ships ten distinct schema-valid manual test personas", () => {
  const entries = Object.entries(profiles);
  assert.equal(entries.length, 10);
  const animals = entries.map(([, profile]) => validateOwnerPitchProfile(profile).animal_persona);
  assert.equal(new Set(animals).size, 10);
});

test("manual test bootstrap returns a complete prefilled draft without publishing", () => {
  const draft = prefilledManualTestDraft("public_finance_analyst");
  assert.equal(draft.status, "prefilled_draft");
  assert.equal(draft.locale, "zh-Hant");
  assert.equal(draft.profile.animal_persona, "戴著圓框眼鏡的稅務老鷹");
  assert.deepEqual(validateOwnerPitchProfile(draft.profile), draft.profile);
});

test("routes the prefilled draft into visual edit and assigns cohort metadata only on canonical publish", async () => {
  const [bootstrap, publish, app] = await Promise.all([
    readFile(new URL("../functions/manual-test-bootstrap/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../functions/profile-publish/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../static/app.js", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(bootstrap, /InvokeCommand|PROFILE_PUBLISH_FUNCTION_NAME|MATCHING_RUN_FUNCTION_NAME/);
  assert.match(publish, /manualTestAccount\(session\.email\)/);
  assert.doesNotMatch(publish, /_manualTest/);
  assert.match(app, /bootstrap\.status === "prefilled_draft"/);
  assert.match(app, /runtime\.draft = validateProfileClient\(bootstrap\.profile\)/);
  assert.match(app, /navigate\("\/import"\)/);
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
