import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import profiles from "../../config/manual-test-profiles.json" with { type: "json" };
import { validateOwnerPitchProfile, type OwnerPitchProfile } from "./contracts.js";
import { requiredEnvironment } from "./storage.js";

const secrets = new SecretsManagerClient({});

export interface ManualTestAccount {
  email: string;
  personaKey: keyof typeof profiles;
}

interface ManualTestConfiguration {
  enabled: boolean;
  cohortId: string;
  verificationCode: string;
  accounts: Record<string, keyof typeof profiles>;
}

let cachedConfiguration: Promise<ManualTestConfiguration> | undefined;

function parseConfiguration(value: string): ManualTestConfiguration {
  const raw = JSON.parse(value) as Partial<ManualTestConfiguration>;
  if (raw.enabled !== true) throw new Error("manual_test_accounts_disabled");
  if (typeof raw.cohortId !== "string" || !/^[A-Za-z0-9_.:-]{6,120}$/.test(raw.cohortId)) throw new Error("manual_test_cohort_invalid");
  if (typeof raw.verificationCode !== "string" || !/^\d{6}$/.test(raw.verificationCode)) throw new Error("manual_test_code_invalid");
  if (!raw.accounts || typeof raw.accounts !== "object" || Array.isArray(raw.accounts)) throw new Error("manual_test_accounts_invalid");
  const accounts = Object.fromEntries(Object.entries(raw.accounts).map(([email, personaKey]) => {
    const normalized = email.trim().toLowerCase();
    if (!/^test10\d{2}@futuremode\.test$/.test(normalized)) throw new Error("manual_test_email_invalid");
    if (typeof personaKey !== "string" || !(personaKey in profiles)) throw new Error("manual_test_persona_invalid");
    return [normalized, personaKey as keyof typeof profiles];
  }));
  if (Object.keys(accounts).length !== 10) throw new Error("manual_test_account_count_invalid");
  return { enabled: true, cohortId: raw.cohortId, verificationCode: raw.verificationCode, accounts };
}

export async function manualTestConfiguration(): Promise<ManualTestConfiguration> {
  if (process.env.MANUAL_TEST_ACCOUNTS_ENABLED !== "true") throw new Error("manual_test_accounts_disabled");
  if (!cachedConfiguration) {
    cachedConfiguration = secrets.send(new GetSecretValueCommand({ SecretId: requiredEnvironment("MANUAL_TEST_ACCOUNTS_SECRET_ARN") }))
      .then((result) => parseConfiguration(result.SecretString ?? ""))
      .catch((error) => {
        cachedConfiguration = undefined;
        throw error;
      });
  }
  return cachedConfiguration;
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
