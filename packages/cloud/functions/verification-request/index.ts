import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { sendEmail } from "../shared/email.js";
import { json, parseJsonBody } from "../shared/http.js";
import { manualTestAccount } from "../shared/manual-test.js";
import { normalizeEmail, sha256, verificationCode } from "../shared/security.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";
import { claimVerificationCapacity, VerificationRateLimitError, verificationRateLimitsFromEnvironment } from "./rate-limit.js";

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    if (process.env.EMAIL_DELIVERY_ENABLED !== "true") {
      return json(503, { error: "email_delivery_disabled", verificationAvailable: false });
    }
    const body = parseJsonBody(event.body) as { email?: unknown };
    const email = normalizeEmail(body.email);
    const testAccount = await manualTestAccount(email);
    const emailHash = sha256(email);
    const challengeId = crypto.randomUUID();
    const code = testAccount?.verificationCode ?? verificationCode();
    const now = Math.floor(Date.now() / 1_000);
    const expiresAt = now + 10 * 60;
    await claimVerificationCapacity({
      client: documentDynamo,
      tableName: requiredEnvironment("TABLE_NAME"),
      emailHash,
      sourceIp: event.requestContext?.http?.sourceIp || "unknown",
      now,
      limits: verificationRateLimitsFromEnvironment(),
      challengeItem: {
        pk: `EMAIL#${emailHash}`,
        sk: `CHALLENGE#${challengeId}`,
        entityType: "EMAIL_CHALLENGE",
        challengeId,
        email,
        emailHash,
        codeHash: sha256(`${challengeId}:${code}`),
        attempts: 0,
        createdAt: new Date().toISOString(),
        expiresAt,
      },
    });
    if (!testAccount) {
      await sendEmail({
        to: email,
        subject: "Your PitchYourOwner verification code",
        text: [`Your PitchYourOwner verification code is ${code}.`, "", "It expires in 10 minutes. If you did not request it, ignore this email.", "", `Privacy: ${requiredEnvironment("PUBLIC_SITE_ORIGIN")}/privacy`, `Support: ${requiredEnvironment("PUBLIC_SITE_ORIGIN")}/support`].join("\n"),
      });
    }
    return json(202, { challengeId, expiresInSeconds: 600, manualTestAccount: Boolean(testAccount) });
  } catch (error) {
    if (error instanceof VerificationRateLimitError) {
      return json(429, { error: "verification_request_limited", retryAfterSeconds: error.retryAfterSeconds }, { "retry-after": String(error.retryAfterSeconds) });
    }
    const message = error instanceof Error ? error.message : "request failed";
    console.error(JSON.stringify({
      event: "verification_request_failed",
      provider: process.env.EMAIL_PROVIDER || "ses",
      errorName: error instanceof Error ? error.name : "UnknownError",
      message,
    }));
    return json(message.includes("email") || message.includes("body") ? 400 : 503, { error: "verification_request_failed" });
  }
}
