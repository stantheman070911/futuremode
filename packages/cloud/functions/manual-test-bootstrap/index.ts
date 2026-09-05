import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { loadSession, profileIdForEmailHash } from "../shared/auth.js";
import { PROFILE_SCHEMA } from "../shared/contracts.js";
import { json } from "../shared/http.js";
import { isAllowedManualTestRecord, manualTestAccount, manualTestProfile } from "../shared/manual-test.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

export function prefilledManualTestDraft(personaKey: Parameters<typeof manualTestProfile>[0]) {
  return { status: "prefilled_draft", schema: PROFILE_SCHEMA, profile: manualTestProfile(personaKey), locale: "zh-Hant" };
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const session = await loadSession(event.headers.authorization);
    const account = await manualTestAccount(session.email);
    if (!account) return json(404, { error: "manual_test_account_not_found" });
    const profileId = profileIdForEmailHash(session.emailHash);
    const tableName = requiredEnvironment("TABLE_NAME");
    const current = (await documentDynamo.send(new GetCommand({
      TableName: tableName,
      Key: { pk: `PROFILE#${profileId}`, sk: "CURRENT" },
      ConsistentRead: true,
    }))).Item;
    if (current) {
      if (!isAllowedManualTestRecord(current, account.cohortId)) throw new Error("manual_test_profile_collision");
      return json(200, {
        status: "profile_ready",
        profile_id: profileId,
      });
    }
    return json(200, prefilledManualTestDraft(account.personaKey));
  } catch (error) {
    const message = error instanceof Error ? error.message : "manual test bootstrap failed";
    if (/session|bearer/.test(message)) return json(401, { error: "invalid_cloud_session" });
    console.error(JSON.stringify({ event: "manual_test_bootstrap_failed", message }));
    return json(503, { error: "manual_test_bootstrap_failed" });
  }
}
