import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import profiles from "../config/manual-test-profiles.json" with { type: "json" };
import { validateOwnerPitchProfile } from "../functions/shared/contracts.js";
import { prefilledManualTestDraft } from "../functions/manual-test-bootstrap/index.js";
import { ownerCanSeeCandidate } from "../functions/pairing/index.js";
import { parseManualTestConfiguration } from "../functions/shared/manual-test.js";

function configuration(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    enabled: true,
    cohortId: "manual-cohort",
    verificationCode: "123456",
    accounts: Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`test10${String(index).padStart(2, "0")}@futuremode.test`, "public_finance_analyst"])),
    journeyCohortId: "journey-cohort",
    journeyAccounts: { "owner@example.com": { scenarioKey: "deployment-boundary-otter", displayCode: "R01", visibleToEmails: ["viewer@example.com"] } },
    ...overrides,
  });
}

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

test("separates fixed-code synthetic accounts from real-email journey accounts", () => {
  const parsed = parseManualTestConfiguration(configuration());
  assert.equal(Object.keys(parsed.accounts).length, 10);
  assert.equal(parsed.journeyCohortId, "journey-cohort");
  assert.deepEqual(parsed.journeyAccounts["owner@example.com"], { scenarioKey: "deployment-boundary-otter", displayCode: "R01", visibleToEmails: ["viewer@example.com"] });
  assert.throws(() => parseManualTestConfiguration(configuration({ journeyAccounts: { "test1099@futuremode.test": { scenarioKey: "invalid-overlap" } } })), /journey_test_email_invalid/);
  assert.throws(() => parseManualTestConfiguration(configuration({ journeyAccounts: { "owner@example.com": { scenarioKey: "valid-scenario", displayCode: "R01", visibleToEmails: [] } } })), /journey_test_audience_invalid/);
  assert.throws(() => parseManualTestConfiguration(configuration({ journeyAccounts: {
    "one@example.com": { scenarioKey: "scenario-one", displayCode: "R01", visibleToEmails: ["viewer@example.com"] },
    "two@example.com": { scenarioKey: "scenario-two", displayCode: "R01", visibleToEmails: ["viewer@example.com"] },
  } })), /journey_test_display_code_duplicate/);
});

test("routes the prefilled draft into visual edit and assigns cohort metadata only on canonical publish", async () => {
  const [bootstrap, publish, app] = await Promise.all([
    readFile(new URL("../functions/manual-test-bootstrap/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../functions/profile-publish/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../static/app.js", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(bootstrap, /InvokeCommand|PROFILE_PUBLISH_FUNCTION_NAME|MATCHING_RUN_FUNCTION_NAME/);
  assert.match(publish, /manualTestAccount\(session\.email\)/);
  assert.match(publish, /journeyTestAccount\(session\.email\)/);
  assert.match(publish, /isJourneyTestProfile: true/);
  assert.match(publish, /testDisplayCode: journeyAccount\.displayCode/);
  assert.match(publish, /testAudienceEmailHashes: journeyAccount\.visibleToEmailHashes/);
  assert.doesNotMatch(publish, /_manualTest/);
  assert.match(app, /bootstrap\.status === "prefilled_draft"/);
  assert.match(app, /runtime\.draft = validateProfileClient\(bootstrap\.profile\)/);
  assert.match(app, /navigate\("\/import"\)/);
  assert.match(app, /await refreshMatches\(\{ polling: true \}\)/);
});

test("real-email journey accounts retain real OTP and do not trigger prefilled bootstrap", async () => {
  const [request, confirm, app, publicProfile] = await Promise.all([
    readFile(new URL("../functions/verification-request/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../functions/verification-confirm/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../static/app.js", import.meta.url), "utf8"),
    readFile(new URL("../functions/public-profile/index.ts", import.meta.url), "utf8"),
  ]);
  assert.match(request, /const testAccount = await manualTestAccount\(email\)/);
  assert.doesNotMatch(request, /journeyTestAccount/);
  assert.match(confirm, /journeyTestAccount: Boolean\(journeyAccount\)/);
  assert.match(app, /if \(result\.manualTestAccount\)/);
  assert.doesNotMatch(app, /if \(result\.journeyTestAccount\)/);
  assert.match(publicProfile, /測試資料•非真實人/);
});

test("journey lifecycle tools are dry-run-first and scope destructive writes to exact confirmed identities", async () => {
  const [journeyTool, pairResetTool, fixtureTool] = await Promise.all([
    readFile(new URL("../scripts/manual-test/manage-journey-account.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/manual-test/reset-journey-pair.mjs", import.meta.url), "utf8"),
    readFile(new URL("../scripts/fixtures/detach-delivery-email.mjs", import.meta.url), "utf8"),
  ]);
  assert.match(journeyTool, /PYO_JOURNEY_TEST_CONFIRM/);
  assert.match(journeyTool, /only the exact Hackathon stack is allowed/);
  assert.match(journeyTool, /current profile is not an owned cleanup-safe journey profile/);
  assert.match(journeyTool, /--adopt-existing/);
  assert.match(journeyTool, /Prefix: `profiles\/\$\{profileId\}\//);
  assert.match(pairResetTool, /PYO_JOURNEY_PAIR_CONFIRM/);
  assert.match(pairResetTool, /reset-pair:\$\{firstEmail\}:\$\{secondEmail\}/);
  assert.match(pairResetTool, /pair is not an approved journey-test audience relationship/);
  assert.match(pairResetTool, /const removableTypes = new Set\(\["INVITATION", "INVITATION_TOKEN", "INVITATION_POINTER", "CONNECTION", "EMAIL_OUTBOX", "MANUAL_TEST_INBOX"\]\)/);
  assert.match(pairResetTool, /journey pair reset postcondition failed/);
  assert.match(fixtureTool, /PYO_FIXTURE_DETACH_CONFIRM/);
  assert.match(fixtureTool, /expected exactly one fixture using the email/);
  assert.match(fixtureTool, /cleanupSafe/);
});

test("manual test owners can see only their cohort and explicitly safe fixtures", () => {
  const cohort = { isTestProfile: true, isManualTestProfile: true, cleanupSafe: true, testRunId: "cohort-a" };
  const other = { isTestProfile: true, cleanupSafe: true, testRunId: "cohort-b" };
  const real = { profileId: "real" };
  assert.equal(ownerCanSeeCandidate(cohort, { ...cohort, profileId: "peer" }), true);
  assert.equal(ownerCanSeeCandidate(cohort, other), false);
  assert.equal(ownerCanSeeCandidate(cohort, real), false);
  assert.equal(ownerCanSeeCandidate(cohort, { isFixtureProfile: true, cleanupSafe: true, manualTestVisible: true }), true);
  assert.equal(ownerCanSeeCandidate(cohort, { isFixtureProfile: true, cleanupSafe: true, manualTestVisible: false }), false);
  assert.equal(ownerCanSeeCandidate(cohort, { isFixtureProfile: true, cleanupSafe: false, manualTestVisible: true }), false);
  assert.equal(ownerCanSeeCandidate(real, cohort), false);
  assert.equal(ownerCanSeeCandidate(real, { profileId: "other-real" }), true);
  const journey = { isTestProfile: true, isJourneyTestProfile: true, cleanupSafe: true, testRunId: "journey-a", testAudienceEmailHashes: ["viewer-hash"] };
  assert.equal(ownerCanSeeCandidate(journey, { ...journey, profileId: "journey-peer" }), true);
  assert.equal(ownerCanSeeCandidate(journey, cohort), false);
  assert.equal(ownerCanSeeCandidate(journey, real), false);
  assert.equal(ownerCanSeeCandidate(journey, { profileId: "allowed-real", emailHash: "viewer-hash" }), true);
  assert.equal(ownerCanSeeCandidate(journey, { isFixtureProfile: true, cleanupSafe: true, manualTestVisible: true }), true);
  assert.equal(ownerCanSeeCandidate({ isTestProfile: true, testRunId: "journey-a" }, { isFixtureProfile: true, cleanupSafe: true, manualTestVisible: true }), false);
  assert.equal(ownerCanSeeCandidate({ profileId: "viewer", emailHash: "viewer-hash" }, journey), true);
  assert.equal(ownerCanSeeCandidate({ profileId: "other", emailHash: "other-hash" }, journey), false);
});
