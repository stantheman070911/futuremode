import profileSchemaConfig from "../../config/pitchyourowner-profile-schema.json" with { type: "json" };
import { contentFingerprint, stableStringify } from "../../lib/reusable/core.js";

export const PROFILE_SCHEMA = "pitchyourowner.profile-publish.v1" as const;
type CoreProfileField = keyof typeof profileSchemaConfig.core_fields;
export const CORE_PROFILE_FIELDS = profileSchemaConfig.field_order
  .filter((field): field is CoreProfileField => field !== "confidence" && field in profileSchemaConfig.core_fields);
export const CONFIDENCE_FIELDS = profileSchemaConfig.optional_fields.confidence.targets as ConfidenceField[];
export const CONFIDENCE_LEVELS = profileSchemaConfig.optional_fields.confidence.allowed_values as ConfidenceLevel[];

export type ConfidenceLevel = "high" | "medium" | "low";
export type ConfidenceField = Exclude<CoreProfileField, "history_scope">;

export interface OwnerPitchProfile {
  summary: string;
  interests: string[];
  motivations: string[];
  active_problems: string[];
  recurring_topics: string[];
  friend_intent: string;
  history_scope: string;
  confidence: Record<ConfidenceField, ConfidenceLevel>;
}

export interface PublishPayload {
  schema: typeof PROFILE_SCHEMA;
  display_name: string;
  profile: OwnerPitchProfile;
  locale: "zh-Hant" | "en";
  consent: {
    approvedAt: string;
  };
}

const PROFILE_KEYS = new Set([...CORE_PROFILE_FIELDS, "confidence"]);
const PAYLOAD_KEYS = new Set(["schema", "display_name", "profile", "locale", "consent"]);

function objectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: Set<string>, label: string): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`${label} contains unknown fields: ${unknown.join(", ")}`);
}

function requiredString(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") throw new Error(`${label} must be a string`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) throw new Error(`${label} must contain 1-${maxLength} characters`);
  return normalized;
}

function stringArray(value: unknown, label: string, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error(`${label} must contain at most ${maxItems} items`);
  const normalized = value.map((entry, index) => requiredString(entry, `${label}[${index}]`, maxLength));
  const folded = normalized.map((entry) => entry.toLocaleLowerCase());
  if (new Set(folded).size !== folded.length) throw new Error(`${label} contains duplicate items`);
  return normalized;
}

function confidenceMap(value: unknown): Record<ConfidenceField, ConfidenceLevel> {
  const raw = objectRecord(value, "profile.confidence");
  rejectUnknownKeys(raw, new Set(CONFIDENCE_FIELDS), "profile.confidence");
  return Object.fromEntries(CONFIDENCE_FIELDS.map((field) => {
    const level = raw[field];
    if (!CONFIDENCE_LEVELS.includes(level as ConfidenceLevel)) {
      throw new Error(`profile.confidence.${field} must be high, medium, or low`);
    }
    return [field, level];
  })) as Record<ConfidenceField, ConfidenceLevel>;
}

export function validateOwnerPitchProfile(value: unknown): OwnerPitchProfile {
  const raw = objectRecord(value, "profile");
  rejectUnknownKeys(raw, PROFILE_KEYS, "profile");
  return {
    summary: requiredString(raw.summary, "profile.summary", profileSchemaConfig.core_fields.summary.max_length),
    interests: stringArray(raw.interests, "profile.interests", profileSchemaConfig.core_fields.interests.max_items, profileSchemaConfig.core_fields.interests.item_max_length),
    motivations: stringArray(raw.motivations, "profile.motivations", profileSchemaConfig.core_fields.motivations.max_items, profileSchemaConfig.core_fields.motivations.item_max_length),
    active_problems: stringArray(raw.active_problems, "profile.active_problems", profileSchemaConfig.core_fields.active_problems.max_items, profileSchemaConfig.core_fields.active_problems.item_max_length),
    recurring_topics: stringArray(raw.recurring_topics, "profile.recurring_topics", profileSchemaConfig.core_fields.recurring_topics.max_items, profileSchemaConfig.core_fields.recurring_topics.item_max_length),
    friend_intent: requiredString(raw.friend_intent, "profile.friend_intent", profileSchemaConfig.core_fields.friend_intent.max_length),
    history_scope: requiredString(raw.history_scope, "profile.history_scope", profileSchemaConfig.core_fields.history_scope.max_length),
    confidence: confidenceMap(raw.confidence),
  };
}

export function validatePublishPayload(value: unknown): PublishPayload {
  const raw = objectRecord(value, "payload");
  rejectUnknownKeys(raw, PAYLOAD_KEYS, "payload");
  if (raw.schema !== PROFILE_SCHEMA) throw new Error("unsupported payload schema");
  if (!['zh-Hant', 'en'].includes(String(raw.locale))) throw new Error("locale is unsupported");
  const displayName = requiredString(raw.display_name, "payload.display_name", 40);
  if (/[\r\n]/.test(displayName)) throw new Error("payload.display_name cannot contain newlines");
  const consent = objectRecord(raw.consent, "consent");
  rejectUnknownKeys(consent, new Set(["approvedAt"]), "consent");
  const approvedAt = requiredString(consent.approvedAt, "consent.approvedAt", 64);
  if (Number.isNaN(Date.parse(approvedAt))) throw new Error("consent.approvedAt must be an ISO date");
  return {
    schema: PROFILE_SCHEMA,
    display_name: displayName,
    profile: validateOwnerPitchProfile(raw.profile),
    locale: raw.locale as PublishPayload["locale"],
    consent: { approvedAt },
  };
}

export function canonicalMatchingDocument(profile: OwnerPitchProfile): string {
  return [
    `Summary: ${profile.summary}`,
    `Specific interests:\n${profile.interests.map((item) => `- ${item}`).join("\n")}`,
    `Motivations:\n${profile.motivations.map((item) => `- ${item}`).join("\n")}`,
    `Active problems:\n${profile.active_problems.map((item) => `- ${item}`).join("\n")}`,
    `Recurring topics:\n${profile.recurring_topics.map((item) => `- ${item}`).join("\n")}`,
    `Friend intent: ${profile.friend_intent}`,
  ].join("\n\n").slice(0, 20_000);
}

export function publicProfile(profile: OwnerPitchProfile): Omit<OwnerPitchProfile, "history_scope" | "confidence"> {
  const { history_scope: _scope, confidence: _confidence, ...shareable } = profile;
  return shareable;
}

export function payloadHash(payload: PublishPayload | OwnerPitchProfile): string {
  return contentFingerprint(payload);
}

export { stableStringify };
