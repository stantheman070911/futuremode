# PitchYourOwner

> **Your agent knows you. Let it pitch you.**｜**你的 Agent 了解你，讓它來介紹你。**

## 問題與目標｜Problem & Goal

傳統交友／認識新朋友的個人檔案把人壓縮成職稱、學校、廣泛興趣標籤與自行撰寫的簡介，很難呈現一個人反覆研究什麼、正在解決什麼問題。PitchYourOwner 讓使用者請自己已經在用的 AI 助理（ChatGPT、Claude 等），從授權且實際可存取的對話脈絡中整理出具體興趣、動機、當前問題與反覆討論的主題，經 owner 一次審核核准後，用這份「Agent 介紹」去找少量真正相關的朋友——不是招募、不是約會、也不是追蹤者網路。

Conventional profiles compress people into job titles, schools, and broad interest labels — they rarely reveal what someone repeatedly studies or is trying to solve. PitchYourOwner asks the AI assistant a person already uses as a thinking partner to draft a pitch from authorized conversation patterns, has the owner review and approve it once, then uses that approved pitch to find a small number of people worth meeting — not recruiting, dating, or a follower network.

目標使用者是已將 AI 助理當作思考夥伴、擁有足夠授權對話脈絡的人。首輪驗證對象約 10–30 位橫跨數個興趣領域的預先招募參與者，驗證的核心命題是：**由 AI 產生並經 owner 核准的介紹，能否比傳統自行撰寫的個人檔案，帶來更相關的朋友配對。**

## 核心功能｜Core Features

1. 手機優先的提示詞交接 — 網站生成完整 extraction prompt，交給使用者選定的 AI｜Phone-first prompt handoff to the user's chosen AI assistant
2. 結構化 owner pitch 產生（summary／interests／motivations／active problems／recurring topics／friend intent／history scope）｜Structured owner-pitch generation
3. AI 端一次整合式 security／privacy 決定確認，網站端獨立唯讀發布審核｜One consolidated AI security/privacy confirmation, plus a separate site publication review
4. 手機通用貼回流程，加上電腦端 24 小時單次 write-only draft API｜Universal phone paste-back plus a 24-hour single-use computer draft API
5. 以 embedding 檢索 + LLM judge 的可解釋朋友配對（不是關鍵字比對）｜Explainable friend matching via embedding retrieval + an LLM judge
6. 強配對通知與雙向邀請，雙方同意後才揭露聯絡方式｜Strong-match notification and mutual-consent invitations

## 系統架構｜System Architecture

```text
Mobile-first Web/PWA (packages/cloud/static — vanilla JS, no framework)
        │
        ▼
CloudFront + private S3 (single origin, same-origin /v1/* API)
        │
        ▼
API Gateway HTTP API
        │
        ├── Email OTP sign-in / session (opaque token, hashed)
        ├── Profile publish → Bedrock Cohere embedding → DynamoDB
        ├── Immediate matching trigger → DynamoDB native vector search
        │     → Bedrock Nova match judge → explainable match + evidence labels
        ├── Matches / Invitations (mutual-consent state machine)
        ├── Computer draft API (24h, single-use, write-only, draft-only)
        └── Support requests → SNS
        │
        ▼
DynamoDB single-table (PITR, TTL, deletion protection)
        + SQS outbox / SES or Resend email delivery (disabled for in-app-only demo)
```

前端是純 vanilla JS 的手機優先 PWA，沒有框架依賴；後端是 AWS CDK 定義的 serverless stack（API Gateway + Lambda + DynamoDB），矩陣配對用 Amazon Bedrock 的 embedding 模型做候選檢索，再用另一個 Bedrock 模型當 judge 產生可解釋的配對理由。所有 PitchYourOwner 資源使用獨立命名，與同帳號下其他既有 stack 隔離。

The frontend is a dependency-free, mobile-first vanilla-JS PWA. The backend is an AWS CDK-defined serverless stack (API Gateway + Lambda + DynamoDB). Matching uses Bedrock embeddings for candidate retrieval and a second Bedrock model as an LLM judge that produces an explainable, evidence-labeled reason for each match. All PitchYourOwner resources use isolated naming from any other stack in the same account.

## 使用技術｜Tech Stack

| 類型｜Type | 技術／服務｜Tech / Service | 用途｜Purpose |
| --- | --- | --- |
| AI 模型｜AI model | Amazon Bedrock — Cohere `embed-v4` (profile embeddings), Amazon Nova Pro (match judge) | 候選檢索與可解釋配對理由｜Candidate retrieval and explainable match reasoning |
| 前端｜Frontend | Vanilla JavaScript PWA (`packages/cloud/static`), no framework | 手機優先的完整申請、貼回、審核、配對、邀請流程｜Full phone-first flow |
| 後端｜Backend | AWS CDK — API Gateway HTTP API, Lambda (Node.js 22, ARM64), DynamoDB (single-table + native vector index) | Auth、profile、matching、invitation API｜Auth, profile, matching, and invitation API |
| Email｜Email | Amazon SES or Resend (configurable) | Email OTP 登入、配對／引介通知（本次 Demo 停用寄信，僅站內）｜OTP sign-in and match/invitation email (disabled for the in-app-only demo) |
| End-user AI assistant｜End-user AI | ChatGPT / Claude, invoked directly by the end user in their own session | 產生 owner pitch；不由本產品後端呼叫｜Generates the owner pitch; never called by our backend directly |
| Sponsor 技術｜Sponsor tech | 待隊伍依實際符合的 Challenge／Bounty 確認再填｜TODO — fill in only what the team actually qualifies for | — |

## 安裝與執行｜Install & Run

```bash
cd packages/cloud
npm ci
npm test         # 20/20 unit + contract + CDK-template tests
npm run build    # tsc --noEmit
npx cdk synth    # generates the CloudFormation template

# Deploy to an isolated PitchYourOwner-* stack (requires AWS credentials and
# these parameters at deploy time — never commit them):
npx cdk deploy --parameters SenderEmail=<verified-sender> \
  --parameters ResendApiKey=<resend-api-key> \
  --parameters OperationsAlertEmail=<alerts-address>

# Optional: seed a synthetic cross-profession fixture for a live demo
npm run demo:seed
npm run demo:match
npm run demo:clean
```

本機也可以直接開啟 `packages/cloud/static/index.html` 走完手機端 UI（無登入時可用 **Preview seeded flow** 走完整個 demo 資料流程，不需要後端）。

The static UI can also be opened directly for a no-backend walkthrough via the **Preview seeded flow** button, which uses the built-in seeded demo dataset.

## 作品展示｜Demo

- 作品展示網址｜Demo URL: `https://d1vuzznd4gxltu.cloudfront.net`（Hackathon 環境，`PitchYourOwner-hackathon` stack，`ap-southeast-1`；非正式生產環境｜hackathon environment only, not a production deployment）
- 評選影片｜Judging video: **TODO** — record before submission, ≤ 2:00, YouTube set to "anyone with the link"

## 限制與未來工作｜Limitations & Future Work

- 完整驗證計畫（10–30 位招募參與者、盲測比較真人反應）尚未執行；目前只以 synthetic cross-profession fixture（攝影師／舞者／音效設計師）驗證資料與 pipeline 可運作，不代表真人配對品質。
  Full validation (10–30 recruited participants, blinded comparison) has not run; only a synthetic fixture has verified the pipeline works end-to-end, not real-user match quality.
- AWS 部署身分目前對應 root identity；正式化前應改為 least-privilege deploy role。
  The AWS deploy identity currently maps to a root identity; should move to a least-privilege deploy role before any non-hackathon use.
- Block／report、年齡政策與正式濫用防護尚未完成；若對外招募真實使用者需先補上。
  Block/report, age policy, and production abuse operations are not yet built; required before recruiting real external users.
- WebMCP／Remote MCP 與電腦端自動化上傳的原生 tool-call 整合刻意排除於本次 Hackathon 範圍之外，僅提供一般 HTTP draft API。
  WebMCP/Remote MCP and native tool-call upload integration are deliberately out of scope for this hackathon version; only a plain HTTP draft API is provided.
- ChatGPT 與 Claude 的長預填連結尚未在 iOS Safari、iOS Chrome、Android Chrome 做完真機矩陣測試；若 deep link 失效，可見的 **Copy prompt** 是現場備援路徑。
  The long prefilled ChatGPT and Claude URLs still need a real-device matrix on iOS Safari, iOS Chrome, and Android Chrome; the visible **Copy prompt** fallback is the stage-safe path if a deep link fails.
- 配對刻意使用 scan-and-judge 迴圈，只針對 50 人以下的 hackathon 規模：每次發布約 O(n) 次 Bedrock 工作，整個 cohort 為 O(n²)，不是生產規模的架構。
  Matching intentionally uses a scan-and-judge loop sized for a hackathon cohort under 50 participants — roughly O(n) Bedrock work per publish and O(n²) across the cohort. It is not the production-scale architecture.
- 本次 Hackathon 環境停用配對通知信與 fallback 排程，邀請僅在站內運作。
  Matching email delivery and the fallback schedule are disabled in the hackathon environment; invitations work in-app only.

## 第三方服務、資料與素材｜Third-Party Services, Data & Assets

- **Amazon Bedrock**（Cohere `embed-v4` embedding 模型、Amazon Nova Pro 判斷模型）— 依 AWS Bedrock 服務條款使用。
- **Amazon SES** 或 **Resend**（依部署設定擇一）— 用於 Email OTP 與通知信；本次 demo 環境停用寄信，僅站內顯示。
- 使用者自己的 **ChatGPT／Claude** 帳號 — 由終端使用者在自己的 session 直接呼叫，PitchYourOwner 後端不會呼叫或存取；PitchYourOwner 只接收使用者已核准的結構化 JSON，不會收到原始對話紀錄。
- 字型：`OFL-DM-Sans.txt`、`OFL-Noto-Sans-CJK.txt`（皆為 SIL Open Font License，授權檔案已隨附於 `packages/cloud/assets/fonts/`）。
- 儲存庫內已確認不含 API Key、Token、密碼或個人資料（僅使用 `CfnParameter` 於部署時輸入，`noEcho: true`）。

Repository scanned and confirmed to contain no committed API keys, tokens, passwords, or personal data — secrets are supplied only at deploy time via CDK parameters (`noEcho: true`), never committed.

## 團隊成員｜Team

| 姓名｜Name | 分工｜Role |
| --- | --- |
| | |

*(TODO — 請填入實際隊伍成員與分工｜fill in actual team roster before submission)*

## License

MIT — see [LICENSE](LICENSE).
