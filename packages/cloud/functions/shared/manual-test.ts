import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import profiles from "../../config/manual-test-profiles.json" with { type: "json" };
import { validateOwnerPitchProfile, type OwnerPitchProfile } from "./contracts.js";
import { sha256 } from "./security.js";
import { requiredEnvironment } from "./storage.js";

const secrets = new SecretsManagerClient({});

export interface ManualTestAccount {
  email: string;
  personaKey: keyof typeof profiles;
}

export interface JourneyTestAccount {
  email: string;
  scenarioKey: string;
  displayCode: string;
  visibleToEmailHashes: string[];
  cohortId: string;
}

interface JourneyTestAccountConfiguration {
  scenarioKey: string;
  displayCode: string;
  visibleToEmails: string[];
}

interface ManualTestConfiguration {
  enabled: boolean;
  cohortId: string;
  verificationCode: string;
  accounts: Record<string, keyof typeof profiles>;
  journeyCohortId?: string;
  journeyAccounts: Record<string, JourneyTestAccountConfiguration>;
}

let cachedConfiguration: Promise<ManualTestConfiguration> | undefined;

function validConfigurationId(value: unknown, error: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_.:-]{6,120}$/.test(value)) throw new Error(error);
  return value;
}

export function parseManualTestConfiguration(value: string): ManualTestConfiguration {
  const raw = JSON.parse(value) as Partial<ManualTestConfiguration>;
  if (raw.enabled !== true) throw new Error("manual_test_accounts_disabled");
  const cohortId = validConfigurationId(raw.cohortId, "manual_test_cohort_invalid");
  if (typeof raw.verificationCode !== "string" || !/^\d{6}$/.test(raw.verificationCode)) throw new Error("manual_test_code_invalid");
  if (!raw.accounts || typeof raw.accounts !== "object" || Array.isArray(raw.accounts)) throw new Error("manual_test_accounts_invalid");
  const accounts = Object.fromEntries(Object.entries(raw.accounts).map(([email, personaKey]) => {
    const normalized = email.trim().toLowerCase();
    if (!/^test10\d{2}@futuremode\.test$/.test(normalized)) throw new Error("manual_test_email_invalid");
    if (typeof personaKey !== "string" || !(personaKey in profiles)) throw new Error("manual_test_persona_invalid");
    return [normalized, personaKey as keyof typeof profiles];
  }));
  if (Object.keys(accounts).length !== 10) throw new Error("manual_test_account_count_invalid");
  const journeySource = raw.journeyAccounts ?? {};
  if (typeof journeySource !== "object" || Array.isArray(journeySource)) throw new Error("journey_test_accounts_invalid");
  const journeyEntries = Object.entries(journeySource);
  const journeyCohortId = journeyEntries.length
    ? validConfigurationId(raw.journeyCohortId, "journey_test_cohort_invalid")
    : undefined;
  const journeyAccounts = Object.fromEntries(journeyEntries.map(([email, configuration]) => {
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.endsWith("@futuremode.test")) throw new Error("journey_test_email_invalid");
    if (!configuration || typeof configuration !== "object" || Array.isArray(configuration)) throw new Error("journey_test_account_invalid");
    const scenarioKey = validConfigurationId((configuration as Partial<JourneyTestAccountConfiguration>).scenarioKey, "journey_test_scenario_invalid");
    const displayCode = String((configuration as Partial<JourneyTestAccountConfiguration>).displayCode ?? "").trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9-]{1,11}$/.test(displayCode)) throw new Error("journey_test_display_code_invalid");
    const visibleToSource = (configuration as Partial<JourneyTestAccountConfiguration>).visibleToEmails;
    if (!Array.isArray(visibleToSource) || visibleToSource.length < 1 || visibleToSource.length > 10) throw new Error("journey_test_audience_invalid");
    const visibleToEmails = [...new Set(visibleToSource.map((value) => {
      const audienceEmail = String(value).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(audienceEmail) || audienceEmail.endsWith("@futuremode.test")) throw new Error("journey_test_audience_email_invalid");
      return audienceEmail;
    }))];
    return [normalized, { scenarioKey, displayCode, visibleToEmails }];
  }));
  if (new Set(Object.values(journeyAccounts).map((account) => account.displayCode)).size !== journeyEntries.length) throw new Error("journey_test_display_code_duplicate");
  return { enabled: true, cohortId, verificationCode: raw.verificationCode, accounts, journeyCohortId, journeyAccounts };
}

export async function manualTestConfiguration(): Promise<ManualTestConfiguration> {
  if (process.env.MANUAL_TEST_ACCOUNTS_ENABLED !== "true") throw new Error("manual_test_accounts_disabled");
  if (!cachedConfiguration) {
    cachedConfiguration = secrets.send(new GetSecretValueCommand({ SecretId: requiredEnvironment("MANUAL_TEST_ACCOUNTS_SECRET_ARN") }))
      .then((result) => parseManualTestConfiguration(result.SecretString ?? ""))
      .catch((error) => {
        cachedConfiguration = undefined;
        throw error;
      });
  }
  return cachedConfiguration;
}

export async function journeyTestAccount(email: string): Promise<JourneyTestAccount | undefined> {
  const normalized = email.trim().toLowerCase();
  try {
    const config = await manualTestConfiguration();
    const account = config.journeyAccounts[normalized];
    return account && config.journeyCohortId
      ? { email: normalized, scenarioKey: account.scenarioKey, displayCode: account.displayCode, visibleToEmailHashes: account.visibleToEmails.map(sha256), cohortId: config.journeyCohortId }
      : undefined;
  } catch (error) {
    if (error instanceof Error && error.message === "manual_test_accounts_disabled") return undefined;
    throw error;
  }
}

export async function manualTestAccount(email: string): Promise<(ManualTestAccount & { cohortId: string; verificationCode: string }) | undefined> {
  const normalized = email.trim().toLowerCase();
  try {
    const config = await manualTestConfiguration();
    const personaKey = config.accounts[normalized];
    return personaKey ? { email: normalized, personaKey, cohortId: config.cohortId, verificationCode: config.verificationCode } : undefined;
  } catch (error) {
    if (error instanceof Error && error.message === "manual_test_accounts_disabled") return undefined;
    throw error;
  }
}

export function manualTestProfile(personaKey: keyof typeof profiles): OwnerPitchProfile {
  return validateOwnerPitchProfile(profiles[personaKey]);
}

export function isAllowedManualTestRecord(record: Record<string, unknown> | undefined, cohortId: string): boolean {
  return Boolean(record?.isTestProfile === true
    && record.cleanupSafe === true
    && record.isManualTestProfile === true
    && record.testCohortId === cohortId
    && record.testRunId === cohortId);
}

export function resetManualTestConfigurationCache(): void {
  cachedConfiguration = undefined;
}
