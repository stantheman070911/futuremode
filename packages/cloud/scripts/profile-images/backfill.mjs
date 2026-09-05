import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const includeFixtures = args.has("--include-fixtures");
const retryFailed = args.has("--retry-failed");
const environment = process.env.PYO_STACK_ENVIRONMENT || "hackathon";
const stackName = process.env.PYO_STACK_NAME || `PitchYourOwner-${environment}`;
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-southeast-1";

const cloudformation = new CloudFormationClient({ region });
const stack = (await cloudformation.send(new DescribeStacksCommand({ StackName: stackName }))).Stacks?.[0];
if (!stack) throw new Error(`Stack not found: ${stackName}`);
const outputs = Object.fromEntries((stack.Outputs || []).map((output) => [output.OutputKey, output.OutputValue]));
const tableName = outputs.ProfileTableName;
const functionName = outputs.ProfileImageWorkerFunctionName;
if (!tableName || !functionName) throw new Error("Profile image stack outputs are missing; deploy the image feature before backfill");

const document = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
const lambda = new LambdaClient({ region });
const eligible = [];
let startKey;
do {
  const page = await document.send(new ScanCommand({
    TableName: tableName,
    FilterExpression: "entityType = :type",
    ExpressionAttributeValues: { ":type": "PROFILE_CURRENT" },
    ProjectionExpression: "pk, profileId, versionId, profileImage, isTestProfile, isFixtureProfile",
    ExclusiveStartKey: startKey,
  }));
  for (const item of page.Items || []) {
    if (!item.profileId || !item.versionId) continue;
    if (!includeFixtures && (item.isTestProfile === true || item.isFixtureProfile === true)) continue;
    if (item.profileImage?.status === "READY" && item.profileImage?.versionId === item.versionId) continue;
    if (!retryFailed && item.profileImage?.status === "FAILED" && item.profileImage?.versionId === item.versionId) continue;
    eligible.push({ profileId: item.profileId, versionId: item.versionId, ...(retryFailed ? { retryFailed: true } : {}) });
  }
  startKey = page.LastEvaluatedKey;
} while (startKey);

console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", stackName, region, eligibleCurrentProfiles: eligible.length, includeFixtures, retryFailed }, null, 2));
if (!apply) {
  console.log("No Lambda invocation was made. Re-run with --apply after reviewing the count.");
  process.exit(0);
}

for (const target of eligible) {
  await lambda.send(new InvokeCommand({ FunctionName: functionName, InvocationType: "Event", Payload: Buffer.from(JSON.stringify(target)) }));
}
console.log(JSON.stringify({ queued: eligible.length }));
