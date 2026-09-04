import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

export interface EmailMessage {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string[];
}

export async function sendSesEmail(message: EmailMessage, client = new SESv2Client({})): Promise<void> {
  await client.send(new SendEmailCommand({
    FromEmailAddress: message.from,
    Destination: { ToAddresses: message.to },
    ReplyToAddresses: message.replyTo,
    Content: {
      Simple: {
        Subject: { Data: message.subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: message.text, Charset: "UTF-8" },
          ...(message.html?.trim() ? { Html: { Data: message.html, Charset: "UTF-8" } } : {}),
        },
      },
    },
  }));
}
