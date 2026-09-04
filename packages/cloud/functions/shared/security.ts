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

export function randomOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function verificationCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
