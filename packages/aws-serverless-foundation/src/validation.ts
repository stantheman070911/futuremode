export type UnknownRecord = Record<string, unknown>;

export function objectRecord(value: unknown, label = "value"): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as UnknownRecord;
}

export function rejectUnknownKeys(value: UnknownRecord, allowed: Iterable<string>, label = "value"): void {
  const allowedKeys = new Set(allowed);
  const unknown = Object.keys(value).filter((key) => !allowedKeys.has(key));
  if (unknown.length) throw new Error(`${label} contains unknown fields: ${unknown.join(", ")}`);
}

export function requiredString(value: unknown, options: { label?: string; maxLength: number; singleLine?: boolean }): string {
  const label = options.label ?? "value";
  if (typeof value !== "string") throw new Error(`${label} must be a string`);
  const normalized = value.trim();
  if (!normalized || normalized.length > options.maxLength) {
    throw new Error(`${label} must contain 1-${options.maxLength} characters`);
  }
  if (options.singleLine && /[\r\n]/.test(normalized)) throw new Error(`${label} cannot contain newlines`);
  return normalized;
}

export function stringArray(value: unknown, options: {
  label?: string;
  maxItems: number;
  itemMaxLength: number;
  uniqueCaseInsensitive?: boolean;
}): string[] {
  const label = options.label ?? "value";
  if (!Array.isArray(value) || value.length > options.maxItems) {
    throw new Error(`${label} must contain at most ${options.maxItems} items`);
  }
  const normalized = value.map((entry, index) => requiredString(entry, {
    label: `${label}[${index}]`,
    maxLength: options.itemMaxLength,
  }));
  if (options.uniqueCaseInsensitive !== false) {
    const folded = normalized.map((entry) => entry.toLocaleLowerCase());
    if (new Set(folded).size !== folded.length) throw new Error(`${label} contains duplicate items`);
  }
  return normalized;
}

export function enumValue<const T extends string>(value: unknown, allowed: readonly T[], label = "value"): T {
  if (!allowed.includes(value as T)) throw new Error(`${label} must be one of: ${allowed.join(", ")}`);
  return value as T;
}
