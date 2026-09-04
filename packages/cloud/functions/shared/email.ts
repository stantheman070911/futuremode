import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { requiredEnvironment } from "./storage.js";

const ses = new SESv2Client({});

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function sender(): string {
  return process.env.EMAIL_SENDER || process.env.SES_SENDER || requiredEnvironment("SES_SENDER");
}

function provider(): "ses" | "resend" {
  const value = (process.env.EMAIL_PROVIDER || "ses").trim().toLowerCase();
  if (value === "ses" || value === "resend") return value;
  throw new Error("unsupported email provider");
}

async function sendWithSes(message: EmailMessage): Promise<void> {
  await ses.send(new SendEmailCommand({
    FromEmailAddress: sender(),
    Destination: { ToAddresses: [message.to] },
    Content: {
      Simple: {
        Subject: { Data: message.subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: message.text, Charset: "UTF-8" },
          ...(message.html?.trim()
            ? { Html: { Data: message.html, Charset: "UTF-8" } }
            : {}),
        },
      },
    },
  }));
}

async function sendWithResend(message: EmailMessage): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${requiredEnvironment("RESEND_API_KEY")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: sender(),
      to: [message.to],
      subject: message.subject,
      text: message.text,
      ...(message.html?.trim() ? { html: message.html } : {}),
    }),
  });
  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json() as { name?: string; message?: string };
      detail = [body.name, body.message].filter(Boolean).join(": ");
    } catch {
      detail = await response.text().catch(() => "");
    }
    throw new Error(`resend_email_failed:${response.status}${detail ? `:${detail.slice(0, 240)}` : ""}`);
  }
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (provider() === "resend") return sendWithResend(message);
  return sendWithSes(message);
}
