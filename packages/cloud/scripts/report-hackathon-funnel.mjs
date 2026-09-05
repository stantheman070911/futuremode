#!/usr/bin/env node
import { createHash } from "node:crypto";
import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const STACK_NAME = "PitchYourOwner-hackathon";
const TABLE_NAME = "pitchyourowner-hackathon-profile-store";
const REGION = "ap-southeast-1";
const CATEGORIES = ["real", "team", "fixture", "test", "unclassified"];
const LABELS = {
  real: "Real non-team",
  team: "Team",
  fixture: "Private fixture",
  test: "Isolated test",
  unclassified: "Unclassified live",
};

const showExample = process.argv.includes("--example");
const unknownFlags = process.argv.slice(2).filter((value) => value !== "--example");
if (unknownFlags.length) throw new Error("unsupported command-line flag");
if (process.env.AWS_REGION && process.env.AWS_REGION !== REGION) throw new Error(`AWS_REGION must be ${REGION}`);
if (process.env.AWS_DEFAULT_REGION && process.env.AWS_DEFAULT_REGION !== REGION) throw new Error(`AWS_DEFAULT_REGION must be ${REGION}`);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseTeamHashes() {
  const supplied = Object.prototype.hasOwnProperty.call(process.env, "PYO_TEAM_EMAILS");
  const values = String(process.env.PYO_TEAM_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (values.some((value) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value))) {
    throw new Error("PYO_TEAM_EMAILS contains an invalid email address");
  }
  return { supplied, hashes: new Set(values.map(sha256)) };
}

function markdown(value) {
  return String(value ?? "—")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\|/g, "\\|")
    .replace(/\s+/g, " ")
    .trim() || "—";
}

function timestamp(value) {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function percentile(values, ratio) {
  if (!values.length) return undefined;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)];
}

function duration(value) {
  if (!Number.isFinite(value)) return "—";
  return `${(value / 1_000).toFixed(3)} s`;
}

function emptyCounts() {
  return Object.fromEntries(CATEGORIES.map((category) => [category, 0]));
}

function add(counts, category, amount = 1) {
  counts[category] = (counts[category] || 0) + amount;
}

const team = parseTeamHashes();
const cloudFormation = new CloudFormationClient({ region: REGION });
const described = await cloudFormation.send(new DescribeStacksCommand({ StackName: STACK_NAME }));
const stack = described.Stacks?.[0];
if (!stack?.Tags?.some((tag) => tag.Key === "Environment" && tag.Value === "hackathon")) {
  throw new Error("refusing to read a stack that is not tagged Environment=hackathon");
}
const outputs = Object.fromEntries((stack.Outputs || []).map((entry) => [entry.OutputKey, entry.OutputValue]));
if (outputs.ProfileTableName !== TABLE_NAME) throw new Error(`unexpected profile table for ${STACK_NAME}`);

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));
const projectionNames = { "#status": "status" };
const relevantEntityValues = {
  ":current": "PROFILE_CURRENT",
  ":version": "PROFILE_VERSION",
  ":invitation": "INVITATION",
  ":connection": "CONNECTION",
  ":edge": "SIMILARITY_EDGE",
};
const projection = [
  "pk", "sk", "entityType", "profileId", "versionId", "emailHash", "displayName",
  "isTestProfile", "isFixtureProfile", "createdAt", "updatedAt", "ownerProfileId",
  "ownerVersionId", "candidateProfileId", "candidateVersionId", "peerProfileId", "pairId",
  "senderProfileId", "recipientProfileId", "#status", "respondedAt", "connectedAt",
  "calculatedAt", "explanationSource", "explanationModelLatencyMs", "whatWeBothCareAbout",
  "whyItMattersNow", "whatWeCouldDiscuss", "evidenceLabels",
].join(", ");
const items = [];
let start;
do {
  const page = await dynamo.send(new ScanCommand({
    TableName: TABLE_NAME,
    ProjectionExpression: projection,
    ExpressionAttributeNames: projectionNames,
    FilterExpression: "entityType IN (:current, :version, :invitation, :connection, :edge)",
    ExpressionAttributeValues: relevantEntityValues,
    ExclusiveStartKey: start,
    ConsistentRead: true,
  }));
  items.push(...(page.Items || []));
  start = page.LastEvaluatedKey;
} while (start);

const currents = items.filter((item) => item.entityType === "PROFILE_CURRENT");
const currentById = new Map(currents.map((item) => [item.profileId, item]));

function profileCategory(profileId) {
  const profile = currentById.get(profileId);
  if (!profile) return "unclassified";
  if (profile?.isTestProfile === true) return "test";
  if (profile?.isFixtureProfile === true) return "fixture";
  if (profile?.emailHash && team.hashes.has(profile.emailHash)) return "team";
  return team.supplied ? "real" : "unclassified";
}

function pairCategory(leftId, rightId) {
  const categories = new Set([profileCategory(leftId), profileCategory(rightId)]);
  for (const category of ["test", "fixture", "team", "unclassified"]) {
    if (categories.has(category)) return category;
  }
  return "real";
}

const metrics = {
  profiles: emptyCounts(),
  invitations: emptyCounts(),
  accepted: emptyCounts(),
  declined: emptyCounts(),
  connections: emptyCounts(),
  connectedOwners: Object.fromEntries(CATEGORIES.map((category) => [category, new Set()])),
  embeddingPairs: emptyCounts(),
  modelPairs: emptyCounts(),
  fallbackPairs: emptyCounts(),
};

for (const profile of currents) add(metrics.profiles, profileCategory(profile.profileId));

const invitations = items.filter((item) => item.entityType === "INVITATION");
const invitationByPair = new Map(invitations.map((item) => [item.pairId, item]));
for (const invitation of invitations) {
  const category = pairCategory(invitation.senderProfileId, invitation.recipientProfileId);
  add(metrics.invitations, category);
  if (invitation.status === "connected") add(metrics.accepted, category);
  if (invitation.status === "not_now") add(metrics.declined, category);
}

const connections = items.filter((item) => item.entityType === "CONNECTION");
const ownersByConnection = new Map();
for (const connection of connections) {
  const ownerId = String(connection.pk || "").startsWith("PROFILE#") ? String(connection.pk).slice(8) : undefined;
  if (!connection.pairId || !ownerId) continue;
  const owners = ownersByConnection.get(connection.pairId) || new Set();
  owners.add(ownerId);
  ownersByConnection.set(connection.pairId, owners);
}
for (const [pairId, owners] of ownersByConnection) {
  if (owners.size < 2) continue;
  const invitation = invitationByPair.get(pairId);
  const pairOwners = invitation
    ? [invitation.senderProfileId, invitation.recipientProfileId]
    : [...owners].slice(0, 2);
  const category = pairCategory(pairOwners[0], pairOwners[1]);
  add(metrics.connections, category);
  for (const ownerId of owners) metrics.connectedOwners[category].add(ownerId);
}

const edges = items.filter((item) => item.entityType === "SIMILARITY_EDGE" && item.pairId);
const edgeByPair = new Map();
for (const edge of edges) {
  const existing = edgeByPair.get(edge.pairId);
  if (!existing || String(edge.calculatedAt || "") > String(existing.calculatedAt || "")) edgeByPair.set(edge.pairId, edge);
}
for (const edge of edgeByPair.values()) {
  const category = pairCategory(edge.ownerProfileId, edge.candidateProfileId);
  if (edge.explanationSource === "embedding") add(metrics.embeddingPairs, category);
  if (edge.explanationSource === "model") add(metrics.modelPairs, category);
  if (edge.explanationSource === "fallback") add(metrics.fallbackPairs, category);
}

const versions = new Map(items
  .filter((item) => item.entityType === "PROFILE_VERSION" && item.profileId && item.versionId)
  .map((item) => [`${item.profileId}:${item.versionId}`, item]));
const latencies = Object.fromEntries(CATEGORIES.map((category) => [category, []]));
for (const current of currents) {
  const published = timestamp(versions.get(`${current.profileId}:${current.versionId}`)?.createdAt);
  if (published === undefined) continue;
  const firstPersistedEdge = edges
    .filter((edge) => edge.ownerProfileId === current.profileId && edge.ownerVersionId === current.versionId)
    .map((edge) => timestamp(edge.calculatedAt))
    .filter((value) => value !== undefined && value >= published)
    .sort((left, right) => left - right)[0];
  if (firstPersistedEdge !== undefined) latencies[profileCategory(current.profileId)].push(firstPersistedEdge - published);
}

console.log("# PitchYourOwner live funnel report");
console.log("");
console.log(`- Generated: ${new Date().toISOString()}`);
console.log(`- Stack: \`${STACK_NAME}\``);
console.log(`- Table: \`${TABLE_NAME}\``);
console.log(`- Team classification: ${team.supplied ? "complete from PYO_TEAM_EMAILS" : "INCOMPLETE — real non-team and team values are withheld as Unclassified live"}`);
console.log("");
console.log("## Funnel");
console.log("");
console.log(`| Metric | ${CATEGORIES.map((category) => LABELS[category]).join(" | ")} |`);
console.log(`| --- | ${CATEGORIES.map(() => "---:").join(" | ")} |`);
const rows = [
  ["Profiles published", metrics.profiles],
  ["Invitations sent", metrics.invitations],
  ["Invitations accepted", metrics.accepted],
  ["Invitations declined", metrics.declined],
  ["Mutual connections formed", metrics.connections],
  ["Distinct owners with a connection", Object.fromEntries(CATEGORIES.map((category) => [category, metrics.connectedOwners[category].size]))],
];
for (const [label, counts] of rows) console.log(`| ${label} | ${CATEGORIES.map((category) => counts[category]).join(" | ")} |`);

console.log("");
console.log("## Matching calculation path");
console.log("");
console.log(`| Path | ${CATEGORIES.map((category) => LABELS[category]).join(" | ")} |`);
console.log(`| --- | ${CATEGORIES.map(() => "---:").join(" | ")} |`);
console.log(`| Embedding-only pairs | ${CATEGORIES.map((category) => metrics.embeddingPairs[category]).join(" | ")} |`);
console.log(`| Model pairs | ${CATEGORIES.map((category) => metrics.modelPairs[category]).join(" | ")} |`);
console.log(`| Legacy fallback pairs | ${CATEGORIES.map((category) => metrics.fallbackPairs[category]).join(" | ")} |`);

console.log("");
console.log("## Publish-to-edge timing");
console.log("");
console.log("| Cohort | Profiles measured | Median | p90 |");
console.log("| --- | ---: | ---: | ---: |");
for (const category of CATEGORIES) {
  console.log(`| ${LABELS[category]} | ${latencies[category].length} | ${duration(percentile(latencies[category], 0.5))} | ${duration(percentile(latencies[category], 0.9))} |`);
}
console.log("");
console.log("> Timing limitation: matching reruns overwrite each edge's `calculatedAt`. The table does not retain the first edge-write timestamp, so these values are publish → earliest currently persisted edge and must not be quoted as historical first-match latency after a rerun.");

if (showExample) {
  const preferred = ["real", "unclassified", "team"];
  const example = [...edgeByPair.values()].find((edge) => preferred.includes(pairCategory(edge.ownerProfileId, edge.candidateProfileId))
    && currentById.get(edge.ownerProfileId)?.displayName
    && currentById.get(edge.candidateProfileId)?.displayName
    && edge.whatWeBothCareAbout && edge.whyItMattersNow && edge.whatWeCouldDiscuss);
  console.log("");
  console.log("## Anonymized example pairing");
  console.log("");
  if (!example) {
    console.log("No eligible non-synthetic example is currently available.");
  } else {
    console.log(`- Animal persona A: ${markdown(currentById.get(example.ownerProfileId).displayName)}`);
    console.log(`- Animal persona B: ${markdown(currentById.get(example.candidateProfileId).displayName)}`);
    console.log(`- What both care about: ${markdown(example.whatWeBothCareAbout)}`);
    console.log(`- Why it matters now: ${markdown(example.whyItMattersNow)}`);
    console.log(`- What they could discuss: ${markdown(example.whatWeCouldDiscuss)}`);
  }
}
