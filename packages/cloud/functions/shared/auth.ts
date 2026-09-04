import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { bearerToken } from "./http.js";
import { sha256 } from "./security.js";
import { documentDynamo, requiredEnvironment } from "./storage.js";

export interface CloudSession {
  pk: string;
  sk: string;
  emailHash: string;
  email: string;
  expiresAt: number;
}

export async function loadSession(authorization: string | undefined): Promise<CloudSession> {
  const token = bearerToken(authorization);
  const result = await documentDynamo.send(new GetCommand({
    TableName: requiredEnvironment("TABLE_NAME"),
    Key: { pk: `SESSION#${sha256(token)}`, sk: "META" },
    ConsistentRead: true,
  }));
  const session = result.Item as CloudSession | undefined;
  if (!session || session.expiresAt < Math.floor(Date.now() / 1_000)) throw new Error("invalid session");
  return session;
}

export function profileIdForEmailHash(emailHash: string): string {
  // Stable protocol namespace: changing this during the PitchYourOwner rebrand
  // would fork every existing owner's Cloud Profile identity.
  return sha256(`pitchyourowner-profile:${emailHash}`).slice(0, 32);
}
