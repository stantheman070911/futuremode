import { DynamoSessionStore } from "../../lib/reusable/session-store.js";
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
  return new DynamoSessionStore<CloudSession>({
    client: documentDynamo,
    tableName: requiredEnvironment("TABLE_NAME"),
  }).loadFromAuthorization(authorization);
}

export function profileIdForEmailHash(emailHash: string): string {
  // Stable protocol namespace: changing this during the PitchYourOwner rebrand
  // would fork every existing owner's Cloud Profile identity.
  return sha256(`pitchyourowner-profile:${emailHash}`).slice(0, 32);
}
