#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { DEMO_PROFILES, REGION, STACK_ENVIRONMENT, TEST_RUN_ID, demoProfileId, outputs, sha256 } from "./lib.mjs";

const client = new LambdaClient({ region: REGION });
const stack = await outputs();
const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), { marshallOptions: { removeUndefinedValues: true } });
const sessions = new Map();
for (const demo of DEMO_PROFILES) {
  const token = randomBytes(32).toString("base64url");
  const email = demo.email.toLowerCase();
  const expiresAt = Math.floor(Date.now() / 1_000) + 60 * 60;
  await dynamo.send(new PutCommand({ TableName: stack.ProfileTableName, Item: {
    pk: `SESSION#${sha256(token)}`, sk: "META", entityType: "CLOUD_SESSION",
    email, emailHash: sha256(email), expiresAt,
    isTestProfile: true, cleanupSafe: true, testRunId: TEST_RUN_ID,
  } }));
  sessions.set(demoProfileId(email), token);
}
const response = await client.send(new InvokeCommand({
  FunctionName: `pitchyourowner-${STACK_ENVIRONMENT}-matching-run`,
  InvocationType: "RequestResponse",
  Payload: new TextEncoder().encode(JSON.stringify({ includeTestProfiles: true, testRunId: TEST_RUN_ID })),
}));
if (response.FunctionError) throw new Error(`matching Lambda failed: ${response.FunctionError}`);
const result = JSON.parse(new TextDecoder().decode(response.Payload));
if (result.created < 1) throw new Error(`expected at least one cross-profession match: ${JSON.stringify(result)}`);

let selected;
for (const [profileId, token] of sessions) {
  const pointers = await dynamo.send(new QueryCommand({
    TableName: stack.ProfileTableName,
    KeyConditionExpression: "pk = :pk AND begins_with(sk, :match)",
    ExpressionAttributeValues: { ":pk": `PROFILE#${profileId}`, ":match": "MATCH#" },
  }));
  const pointer = pointers.Items?.[0];
  if (pointer?.matchId) { selected = { profileId, token, pointer }; break; }
}
if (!selected) throw new Error("matching created no profile pointer");
const peerToken = sessions.get(String(selected.pointer.peerProfileId));
if (!peerToken) throw new Error("matched peer is outside the synthetic fixture");
const site = String(stack.CloudWebsiteUrl).replace(/\/$/, "");
const request = async (path, token, options = {}) => {
  const apiResponse = await fetch(`${site}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await apiResponse.json();
  if (!apiResponse.ok) throw new Error(`${path} returned ${apiResponse.status}: ${JSON.stringify(body)}`);
  return { status: apiResponse.status, body };
};
const list = await request("/v1/matches", selected.token);
const detail = await request(`/v1/matches/${selected.pointer.matchId}`, selected.token);
const invitationA = await request(`/v1/matches/${selected.pointer.matchId}/invitations`, selected.token, { method: "POST", body: JSON.stringify({ decision: "invite" }) });
const invitationB = await request(`/v1/matches/${selected.pointer.matchId}/invitations`, peerToken, { method: "POST", body: JSON.stringify({ decision: "accept" }) });
if (!invitationB.body.mutual || !invitationB.body.peer?.contact_email) throw new Error("mutual acceptance did not reveal peer contact");
console.log(JSON.stringify({
  matching: result,
  api: {
    matchListStatus: list.status,
    matchCount: list.body.matches?.length ?? 0,
    detailStatus: detail.status,
    evidenceLabels: detail.body.explanation?.evidence_labels ?? [],
    firstInvitationStatus: invitationA.status,
    secondInvitationStatus: invitationB.status,
    mutual: invitationB.body.mutual,
    contactRevealedAfterMutualAcceptance: Boolean(invitationB.body.peer?.contact_email),
  },
}, null, 2));
