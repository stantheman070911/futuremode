import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { loadSession, profileIdForEmailHash } from "../shared/auth.js";
import { PROFILE_SCHEMA } from "../shared/contracts.js";
import { json } from "../shared/http.js";
import { isAllowedManualTestRecord, manualTestAccount, manualTestProfile } from "../shared/manual-test.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

const lambda = new LambdaClient({});

function parseLambdaResult(payload: Uint8Array | undefined): { statusCode?: number; body?: string } {
  if (!payload) throw new Error("manual_test_publish_empty");
  return JSON.parse(new TextDecoder().decode(payload)) as { statusCode?: number; body?: string };
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
    let published = false;
    if (current) {
      if (!isAllowedManualTestRecord(current, account.cohortId)) throw new Error("manual_test_profile_collision");
    } else {
      const publishEvent = {
        version: "2.0",
        routeKey: "POST /v1/profile-versions",
        rawPath: "/v1/profile-versions",
        rawQueryString: "",
        headers: {
          authorization: event.headers.authorization,
          "idempotency-key": `manual-test-${account.cohortId}-${account.personaKey}-v1`,
        },
        requestContext: { http: { method: "POST", path: "/v1/profile-versions", protocol: "HTTP/1.1", sourceIp: "manual-test-bootstrap", userAgent: "manual-test-bootstrap" } },
        body: JSON.stringify({
          schema: PROFILE_SCHEMA,
          profile: manualTestProfile(account.personaKey),
          locale: "zh-Hant",
          consent: { approvedAt: "2026-09-05T00:00:00.000Z" },
        }),
        isBase64Encoded: false,
        _manualTest: { cohortId: account.cohortId },
      };
      const result = await lambda.send(new InvokeCommand({
        FunctionName: requiredEnvironment("PROFILE_PUBLISH_FUNCTION_NAME"),
        InvocationType: "RequestResponse",
        Payload: new TextEncoder().encode(JSON.stringify(publishEvent)),
      }));
      if (result.FunctionError) throw new Error(`manual_test_publish_${result.FunctionError}`);
      const response = parseLambdaResult(result.Payload);
      if (!response.statusCode || response.statusCode >= 300) throw new Error(`manual_test_publish_${response.statusCode ?? "invalid"}:${response.body ?? ""}`);
      published = response.statusCode === 201;
    }
    await lambda.send(new InvokeCommand({
      FunctionName: requiredEnvironment("MATCHING_RUN_FUNCTION_NAME"),
      InvocationType: "Event",
      Payload: new TextEncoder().encode(JSON.stringify({ profileId })),
    }));
    return json(published ? 201 : 200, {
      status: published ? "profile_assigned" : "profile_ready",
      profile_id: profileId,
      matching_status: "queued",
      image_status: published ? "pending" : "existing",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "manual test bootstrap failed";
    if (/session|bearer/.test(message)) return json(401, { error: "invalid_cloud_session" });
    console.error(JSON.stringify({ event: "manual_test_bootstrap_failed", message }));
    return json(503, { error: "manual_test_bootstrap_failed" });
  }
}
