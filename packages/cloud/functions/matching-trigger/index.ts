import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { loadSession, profileIdForEmailHash } from "../shared/auth.js";
import { json } from "../shared/http.js";
import { documentDynamo, requiredEnvironment } from "../shared/storage.js";

const lambda = new LambdaClient({});

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    const session = await loadSession(event.headers.authorization);
    const profileId = profileIdForEmailHash(session.emailHash);
    const current = await documentDynamo.send(new GetCommand({
      TableName: requiredEnvironment("TABLE_NAME"),
      Key: { pk: `PROFILE#${profileId}`, sk: "CURRENT" },
      ConsistentRead: true,
    }));
    if (!current.Item) return json(409, { error: "publish_profile_before_matching" });
    if (current.Item.visibility === "private" || current.Item.matchingState === "paused") return json(409, { error: "public_profile_required" });
    await lambda.send(new InvokeCommand({
      FunctionName: requiredEnvironment("MATCHING_RUN_FUNCTION_NAME"),
      InvocationType: "Event",
      Payload: new TextEncoder().encode(JSON.stringify({ trigger: "profile_publish", profileId })),
    }));
    return json(202, { status: "matching_started", profile_id: profileId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "matching trigger failed";
    if (/session|bearer/.test(message)) return json(401, { error: "invalid_cloud_session" });
    console.error(JSON.stringify({ event: "matching_trigger_failed", message }));
    return json(503, { error: "matching_trigger_failed" });
  }
}
