#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

const required = (name) => { const value = String(process.env[name] || "").trim(); if (!value) throw new Error(`${name} is required`); return value; };
const region = process.env.AWS_REGION || "ap-southeast-1";
const stackName = required("PYO_E2E_STACK");
const outputsFile = resolve(required("PYO_E2E_ARTIFACT_FILE"));
const stackKey = required("PYO_E2E_STACK_KEY");
const runId = required("PYO_TEST_RUN_ID");
if (required("PYO_E2E_CONFIRM") !== "seed-isolated-e2e") throw new Error("PYO_E2E_CONFIRM must equal seed-isolated-e2e");
if (stackName !== "PitchYourOwner-e2e" || stackKey !== "PitchYourOwner-e2e") throw new Error("only the exact PitchYourOwner-e2e stack is allowed");
if (/hackathon|prod/i.test(`${stackName} ${outputsFile}`)) throw new Error("production or hackathon targets are forbidden");

const cfn = new CloudFormationClient({ region });
const described = await cfn.send(new DescribeStacksCommand({ StackName: stackName }));
const stack = described.Stacks?.[0];
if (!stack || !stack.Tags?.some((tag) => tag.Key === "Environment" && tag.Value === "e2e")) throw new Error("CloudFormation Environment tag must be e2e");
const outputs = Object.fromEntries((stack.Outputs || []).map((item) => [item.OutputKey, item.OutputValue]));
const tableName = String(outputs.ProfileTableName || "");
if (tableName !== "pitchyourowner-e2e-profile-store") throw new Error(`unexpected E2E table: ${tableName || "missing"}`);

const emailA = required("PYO_E2E_EMAIL_A");
const emailB = required("PYO_E2E_EMAIL_B");
const emailC = required("PYO_E2E_EMAIL_C");
const sha256 = (value) => createHash("sha256").update(String(value)).digest("hex");
const profileId = (email) => sha256(`pitchyourowner-profile:${sha256(email.trim().toLowerCase())}`).slice(0, 32);
const vector = (...values) => { const result = Array(1024).fill(0); values.forEach((value, index) => { result[index] = value; }); return result; };
const confidence = { summary: "high", interests: "high", motivations: "high", active_problems: "high", recurring_topics: "high", friend_intent: "high" };
const profiles = [
  ["A", emailA, "Ari", "追著舞台光線的銀狐", "用人像攝影研究微小姿態與情緒閱讀，持續把身體提示轉成可重複、又不讓被攝者僵硬的引導方法。", ["肩線與身體張力", "低光人像", "動作中的情緒"], [1, .25, .1]],
  ["B", emailB, "Ren", "跳著舞的粉色羊駝", "當代舞者，研究肩線、呼吸和張力如何在動作完成前讓意圖被觀眾讀懂。", ["肩線與身體張力", "動作中的情緒", "舞台光線"], [.995, .24, .1]],
  ["C", emailC, "Mika", "叼著分鏡穿過片場的赤狐", "電影導演，反覆測試演員走位、攝影距離與微表情如何共同改變一場戲的情緒方向。", ["動作中的情緒", "演員走位", "低光場景"], [.97, .27, .12]],
  ["D", "fixture-d@pitchyourowner.invalid", "Noa", "聽見空白的藍鯨", "聲音設計師，研究沉默、節奏和環境聲如何控制敘事注意力。", ["聲音敘事", "沉默的節奏"], [.72, .5, .1]],
  ["E", "fixture-e@pitchyourowner.invalid", "Lin", "校準世界的翠鳥", "互動設計師，專注把複雜工作流程變成手機上能理解的決策。", ["行動 UX", "複雜流程簡化"], [.55, .7, .2]],
  ["F", "fixture-f@pitchyourowner.invalid", "Jo", "戴著眼鏡的專業老鷹", "跨境稅務規劃師，持續研究 treaty、pass-through rule 與雙重課稅的實務判斷。", ["跨境稅務", "treaty 判斷"], [.15, .98, .1]],
  ["G", "fixture-g@pitchyourowner.invalid", "Sam", "拆解節拍的章魚", "音樂製作人，研究 groove、編曲留白與現場演出的動態關係。", ["編曲留白", "現場節拍"], [.58, .35, .6]],
  ["H", "fixture-h@pitchyourowner.invalid", "Wei", "追著路徑的牧羊犬", "機器人研究者，正在解長時間任務恢復、狀態持久化與人機協作。", ["agent runtime", "任務恢復"], [.2, .45, .95]],
  ["I", "fixture-i@pitchyourowner.invalid", "Uma", "收藏問題的雪鴞", "科學記者，擅長從研究方法、證據限制與敘事責任之間找到可追問的問題。", ["科學敘事", "證據限制"], [.35, .56, .66]],
  ["J", "fixture-j@pitchyourowner.invalid", "Tao", "沿著紋理散步的黑貓", "陶藝創作者，研究土質、燒成曲線與手感如何留下製作過程。", ["陶土材料", "燒成曲線"], [.42, .26, .3]],
  ["K", "fixture-k@pitchyourowner.invalid", "Yu", "在城市縫隙築巢的燕子", "都市規劃師，關注步行尺度、公共空間與日常交通選擇。", ["步行城市", "公共空間"], [.3, .6, .42]],
  ["L", "fixture-l@pitchyourowner.invalid", "Bo", "把數字排成隊的河狸", "資料工程師，專注事件流、資料品質與可恢復的分析管線。", ["資料品質", "事件流"], [.12, .38, .87]],
];

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), { marshallOptions: { removeUndefinedValues: true } });
const now = new Date().toISOString();
const expiresAt = Math.floor(Date.now() / 1000) + 86_400;
const testMeta = { isTestProfile: true, cleanupSafe: true, testRunId: runId, expiresAt };
const sessionTokens = {};
for (const [id, email, displayName, animal, summary, interests, coefficients] of profiles) {
  const idValue = profileId(email); const versionId = `e2e-${sha256(`${runId}:${id}`).slice(0, 20)}`; const slug = `e2e_${id.toLowerCase()}_${sha256(runId).slice(0, 12)}`;
  const existing = (await dynamo.send(new GetCommand({ TableName: tableName, Key: { pk: `PROFILE#${idValue}`, sk: "CURRENT" }, ConsistentRead: true }))).Item;
  if (existing && (!existing.isTestProfile || existing.testRunId !== runId || !existing.cleanupSafe)) throw new Error(`refusing to overwrite profile ${id}`);
  const embedding = vector(...coefficients);
  const profile = { animal_persona: animal, summary, interests, motivations: ["把領域裡的隱性方法變成可以交換的具體做法"], active_problems: [`如何在真實限制下推進：${interests[0]}`], recurring_topics: interests.slice(0, 3), friend_intent: "想認識會帶著具體案例、失敗與下一個實驗來聊天的人。", history_scope: "隔離 E2E fixture；未使用任何私人聊天內容。", confidence };
  await dynamo.send(new TransactWriteCommand({ TransactItems: [
    { Put: { TableName: tableName, Item: { pk: `PROFILE#${idValue}`, sk: `VERSION#${versionId}`, entityType: "PROFILE_VERSION", schema: "pitchyourowner.profile-publish.v1", profileId: idValue, versionId, emailHash: sha256(email), profile, displayName, locale: "zh-Hant", embedding, fieldEmbeddings: Object.fromEntries(["interests", "active_problems", "motivations", "recurring_topics", "friend_intent"].map((field) => [field, embedding])), embedding_status: "READY", profile_scope: "ACTIVE", is_matchable: 1, createdAt: now, ...testMeta } } },
    { Put: { TableName: tableName, Item: { pk: `PROFILE#${idValue}`, sk: "CURRENT", entityType: "PROFILE_CURRENT", profileId: idValue, versionId, email, emailHash: sha256(email), displayName, publicSlug: slug, visibility: "public", matchingState: "active", matchLanguages: ["zh"], updatedAt: now, ...testMeta } } },
    { Put: { TableName: tableName, Item: { pk: `PUBLIC_SLUG#${slug}`, sk: "PROFILE", entityType: "PUBLIC_PROFILE_POINTER", profileId: idValue, createdAt: now, ...testMeta } } },
  ] }));
  if (["A", "B", "C"].includes(id)) {
    const token = randomBytes(32).toString("base64url"); sessionTokens[id] = token;
    await dynamo.send(new TransactWriteCommand({ TransactItems: [
      { Put: { TableName: tableName, Item: { pk: `SESSION#${sha256(token)}`, sk: "META", entityType: "CLOUD_SESSION", email, emailHash: sha256(email), createdAt: now, expiresAt, ...testMeta } } },
      { Put: { TableName: tableName, Item: { pk: `EMAIL#${sha256(email)}`, sk: `SESSION#${sha256(token)}`, entityType: "EMAIL_SESSION_POINTER", sessionPk: `SESSION#${sha256(token)}`, createdAt: now, expiresAt, ...testMeta } } },
    ] }));
  }
}
const publishEmail = `publish-${sha256(runId).slice(0, 12)}@pitchyourowner.invalid`;
const publishEmailHash = sha256(publishEmail);
const publishProfileId = profileId(publishEmail);
const publishToken = randomBytes(32).toString("base64url");
sessionTokens.P = publishToken;
await dynamo.send(new TransactWriteCommand({ TransactItems: [
  { Put: { TableName: tableName, Item: { pk: `SESSION#${sha256(publishToken)}`, sk: "META", entityType: "CLOUD_SESSION", email: publishEmail, emailHash: publishEmailHash, createdAt: now, expiresAt, ...testMeta } } },
  { Put: { TableName: tableName, Item: { pk: `EMAIL#${publishEmailHash}`, sk: `SESSION#${sha256(publishToken)}`, entityType: "EMAIL_SESSION_POINTER", sessionPk: `SESSION#${sha256(publishToken)}`, emailHash: publishEmailHash, createdAt: now, expiresAt, ...testMeta } } },
] }));
await dynamo.send(new TransactWriteCommand({ TransactItems: [{ Put: { TableName: tableName, Item: { pk: "MATCHING_GRAPH", sk: "REVISION", entityType: "MATCHING_GRAPH_REVISION", revision: 1, updatedAt: now } } }] }));
const artifact = { stackName, stackKey, tableName, siteUrl: outputs.CloudWebsiteUrl, matchingFunctionName: outputs.MatchingRunFunctionName, runId, sessionTokens, publishActor: { email: publishEmail, emailHash: publishEmailHash, profileId: publishProfileId } };
await writeFile(outputsFile, JSON.stringify(artifact, null, 2), { mode: 0o600 });
console.log(JSON.stringify({ seeded: true, environment: "e2e", runId, profiles: profiles.length, outputsFile }, null, 2));
