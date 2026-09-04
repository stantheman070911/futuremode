import { createHash, randomBytes, randomInt } from "node:crypto";

export function normalizeEmail(value: unknown): string {
  if (typeof value !== "string") throw new Error("email is required");
  const email = value.trim().toLowerCase();
  if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("invalid email");
  return email;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function randomOpaqueToken(bytes = 32): string {
  if (!Number.isSafeInteger(bytes) || bytes < 16 || bytes > 128) throw new Error("token byte length must be between 16 and 128");
  return randomBytes(bytes).toString("base64url");
}

export function numericVerificationCode(digits = 6): string {
  if (!Number.isSafeInteger(digits) || digits < 4 || digits > 9) throw new Error("verification code length must be between 4 and 9");
  const upperBound = 10 ** digits;
  return randomInt(0, upperBound).toString().padStart(digits, "0");
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function contentFingerprint(value: unknown): string {
  return sha256(stableStringify(value));
}
