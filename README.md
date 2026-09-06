# PitchYourOwner

> **Your agent knows you. Let it pitch you.**｜**你的 Agent 了解你，讓它來介紹你。**

## 問題與目標｜Problem and goals

Two people can both write "photography" on every profile they have ever filled in, and
it tells you nothing. One has spent three months on low-light street work; the other
studies how a shoulder line carries emotion in a portrait. No profile field separates
them, and neither would ever find the choreographer working on the identical question
from inside a body instead of behind a lens.

Meanwhile, the AI assistant each of them talks to every day already holds that signal —
recurring questions, unsolved problems, sustained attention, evolving goals — richer
than any profile, and trapped in a chat window with no owner-controlled way out.

兩個人的個人檔案都寫著「攝影」，這個詞什麼也說明不了。一位鑽研三個月的低光街拍，
另一位在意的是肩線如何在人像中傳達情緒。任何個人檔案欄位都分不出這兩人，也永遠不會
讓他們遇到正在思考同一個問題、只是從身體而非鏡頭出發的編舞者。同時，兩人每天在聊的
AI 助理早就握有這個訊號——反覆出現的問題、尚未解決的難題、持續投入的注意力——卻被
困在聊天視窗裡，owner 沒有辦法把它帶出來。

**目標使用者｜Target users.** Individuals who already use ChatGPT, Claude, or a similar
assistant daily and want to meet people working on the same question — a friend-discovery
audience, phone-first. This is explicitly not a recruiting product, dating product,
public profile directory, or engagement feed.

**預期影響｜Expected impact.** PitchYourOwner asks the AI assistant an owner already uses
to write their introduction, resolve privacy decisions before anything leaves that
assistant, and — after mutual acceptance — draft the first message. Three agent roles,
two independent human approval gates: exclusion inside the owner's own AI, and explicit
publication on this site. The owner keeps the signal their assistant already holds, and
gets matched on substance rather than on a keyword both people happened to type.

PitchYourOwner 請 owner 已在使用的 AI 助理撰寫介紹、在任何內容離開該助理之前先處理隱私
決定，並在雙方互相同意後起草第一封訊息。三個 agent 角色，兩個獨立的人工核准關卡：
在 owner 自己的 AI 中排除敏感內容，以及在本站明確發布。

## 核心功能｜Core features

- **Passwordless email OTP sign-in.** No password storage; hashed opaque sessions.
- **Owner-pitch prompt in the owner's own assistant.** Choose ChatGPT, Claude, or another
  assistant and a prompt language, then open or share the complete prompt. In the chosen
  AI, the owner reviews a concise synthesis, resolves every detected security/privacy item
  in one reply, and requests JSON with an exact confirmation phrase.
- **Two independent human approval gates.** Exclusion happens inside the owner's own AI;
  publication is a separate explicit action on a document-style visual confirmation page.
  The backend never calls the owner's assistant and never receives the source conversations
  — only the owner-approved profile JSON.
- **Embedding-based matching.** Bedrock Cohere `embed-v4` profile embeddings, DynamoDB
  native vector candidate search, and an Amazon Nova Pro match judge.
- **Grounded match explanations.** Each match is presented as three plain-language
  questions with evidence labels, so the owner can see what the match is based on.
- **Mutual-consent introductions.** Contact information appears only after both owners
  accept the invitation.
- **Labelled seeded demo.** Runs in the browser without an account or backend and never
  represents its synthetic profiles as live users.

The interface is Traditional Chinese only, by deliberate scope decision. If you cannot
read Chinese, [`docs/walkthrough-en.md`](docs/walkthrough-en.md) is an annotated English
walkthrough of the full journey using real screenshots of the deployed app.

介面僅提供繁體中文，這是刻意的範圍決定。產品行為與 UX 契約以
[`docs/product-design.md`](docs/product-design.md) 為準；Profile 的 machine-readable
契約以
[`config/pitchyourowner-profile-schema.json`](config/pitchyourowner-profile-schema.json)
為準。

## 系統架構｜Architecture

```text
Vanilla-JS mobile SPA
        │
        ▼
CloudFront
  ├── private S3 static origin
  └── same-origin /v1/* → API Gateway HTTP API
                              │
                              ├── Email OTP and hashed opaque sessions
                              ├── Profile drafts, versions, and owner controls
                              ├── Bedrock Cohere profile embeddings
                              ├── DynamoDB native vector candidate search
                              ├── Bedrock Nova Pro match judge
                              ├── Matches and mutual-consent invitations
                              └── Support requests
                                      │
                                      ▼
                         DynamoDB single-table storage
```

**前端｜Frontend.** A framework-free mobile SPA served from a private S3 origin through
CloudFront. It calls the API same-origin at `/v1/*`, so there is no CORS surface.

**後端｜Backend.** API Gateway HTTP API in front of Node.js 22 Lambda handlers, which own
authentication, profile drafts and versions, matching, invitations, and support requests.

**模型｜Models.** Lambdas call Amazon Bedrock directly: Cohere `embed-v4` to embed a
published profile, and Amazon Nova Pro to judge and explain candidate matches. The end
user's ChatGPT, Claude, or other assistant is never called by the backend.

**資料庫｜Database.** One DynamoDB single-table design holds sessions, profiles, embeddings,
matches, and invitations, and serves candidate search through native vector search.

**外部服務｜External services.** Resend delivers OTP email. The CDK stack also defines an
optional DynamoDB-stream → SQS → email outbox, CloudWatch alarms, an SNS operations topic,
and an AWS Budget. Matching email delivery and the fallback schedule are disabled in the
current Hackathon configuration; matching is started through the authenticated API after
publication, and invitations are handled in the application.

## 使用技術｜Technology used

| 類別 | 技術／服務 | 用途 |
| --- | --- | --- |
| AI 模型 | Amazon Bedrock — Cohere `embed-v4` | Published-profile embeddings for candidate search |
| AI 模型 | Amazon Bedrock — Amazon Nova Pro | Match judging and grounded match explanations |
| AI 模型 | ChatGPT / Claude / other assistant (owner-operated) | Runs the owner-pitch prompt and the privacy gate; never called by the backend |
| 前端 | Vanilla JavaScript, HTML, CSS (no framework) | Phone-first SPA, seeded browser demo |
| 前端 | Amazon CloudFront + private Amazon S3 | Static hosting and same-origin `/v1/*` API routing |
| 後端 | Amazon API Gateway HTTP API + AWS Lambda (Node.js 22, TypeScript) | Auth, profiles, matching, invitations, support |
| 後端 | Amazon DynamoDB (single table, native vector search) | Sessions, profiles, embeddings, matches, invitations |
| 後端 | AWS CDK | Infrastructure as code for the whole stack |
| 後端 | Amazon SQS, SNS, CloudWatch, AWS Budgets, SES (optional) | Email outbox, alarms, operations topic, cost guardrail |
| 後端 | Resend | Passwordless OTP email delivery |
| Sponsor 技術 | 未使用｜None | This project does not use any sponsor technology |

## 安裝與執行｜Installation and running

Requirements:

- Node.js 20 or newer; deployed Lambdas use Node.js 22.
- npm.
- AWS credentials only for deployment or cloud-backed demo scripts.

```bash
git clone https://github.com/stantheman070911/futuremode.git
cd futuremode/packages/cloud
npm ci
npm test      # syncs canonical schema + prompts, then runs the suite
npm run build # strict TypeScript compilation
npm run synth # CDK synth
```

For a backend-free UI walkthrough:

```bash
python3 -m http.server 8000 --directory packages/cloud/static
# open http://localhost:8000/?demo=1
```

This server does not proxy `/v1/*`; use only the seeded demo locally. There is no separate
lint command — strict TypeScript compilation and the test suite are the repository's
automated code checks. See [`packages/cloud/README.md`](packages/cloud/README.md) for
configuration, deployment, API, persistence, and troubleshooting details.

儲存庫結構｜Repository structure:

| Path | Ownership |
| --- | --- |
| `docs/product-design.md` | Current product behavior, consent boundaries, and UX constraints |
| `docs/get_info_prompt_ch.md`, `docs/get_info_prompt_en.md` | Executable owner-pitch prompt sources |
| `config/pitchyourowner-profile-schema.json` | Canonical profile field and validation configuration |
| `packages/cloud/static/` | Framework-free browser application and generated runtime contracts |
| `packages/cloud/functions/` | Lambda handlers and shared validation/authentication code |
| `packages/cloud/lib/` | CDK stack and product-neutral serverless building blocks |
| `packages/cloud/scripts/` | Contract synchronization and synthetic demo tools |
| `packages/cloud/test/` | Contract, matching-filter, rate-limit, prompt, and CDK tests |
| `packages/cloud/README.md` | Engineering, API, data-model, configuration, and deployment reference |

`docs/product-memo-v1.md` is a frozen source memo retained for provenance. It is not a
current specification.

## 作品展示｜Demo

- 作品展示網址｜Application: <https://d1vuzznd4gxltu.cloudfront.net>
- 評選影片｜Judging video: N/A

Stack `PitchYourOwner-hackathon`, region `ap-southeast-1`. This is a manually deployed
Hackathon environment, not a production service or an automatic deployment of every
repository commit. Repository HEAD remains the source for reproducible behavior.

成果｜Results. _Real-cohort recruiting is in progress. This table reports what actually
happened, excluding all fixture and test profiles, and will be updated as the cohort
completes._

| Metric | Value |
| --- | --- |
| Real published profiles | `[PENDING — P0-M1 cohort]` |
| Invitations sent | `[PENDING — P0-M1 cohort]` |
| Mutual connections | `[PENDING — P0-M1 cohort]` |
| Median publish-to-first-match latency | `[PENDING — Development funnel report]` |
| Explanation source (model vs. fallback) | `[PENDING — Development funnel report]` |

No number here is drawn from synthetic or fixture data. See
[`docs/round1-submission.md`](docs/round1-submission.md) for the full narrative and one
real pairing quoted with permission.

## 限制與未來工作｜Limitations and future work

Known limitations:

- Matching has been exercised with synthetic photographer, dancer, and sound-designer
  profiles. No real 10–30-person validation cohort has been completed, so the repository
  does not claim real-user match quality.
- Matching scans the small active cohort and judges candidates per seed. Its provider work
  approaches O(n²) across a cohort and is intentionally sized for fewer than about 50
  Hackathon participants.
- Browser sessions are opaque tokens stored in `localStorage`; production use would require
  a stronger browser-session and CSRF design.
- Block, report, age-policy, and production abuse operations are not implemented.
- Matching emails and notification deep links are not active in the current deployment.
- ChatGPT and Claude prefilled links retain a visible copy fallback because cross-browser
  real-device behavior is provider- and browser-dependent.
- `/privacy` and `/terms` are concise product-boundary notices, not production legal
  documents.

Future work: complete the real validation cohort and publish its funnel numbers, replace
the per-seed O(n²) judging pass with a scalable ranking stage, harden browser sessions,
add block/report and age-policy operations, and enable matching email and notification
deep links. [`ROADMAP.md`](ROADMAP.md) tracks the ordered plan.

## 第三方服務、資料與素材｜Third-party services, data, and assets

| 項目 | 來源 | 授權／取用方式 |
| --- | --- | --- |
| Amazon Bedrock (Cohere `embed-v4`, Amazon Nova Pro) | <https://aws.amazon.com/bedrock/> | AWS account credentials, supplied at deploy time via environment configuration |
| AWS DynamoDB, Lambda, API Gateway, S3, CloudFront, SQS, SNS, CloudWatch, Budgets, SES (optional) | <https://aws.amazon.com/> | Same AWS account credentials; provisioned by the CDK stack |
| Resend (default OTP email provider) | <https://resend.com/> | API key supplied at deploy time via environment configuration |
| DM Sans | <https://fonts.google.com/specimen/DM+Sans> | SIL Open Font License, license file included in `packages/cloud/assets/fonts/` |
| Noto Sans CJK | <https://fonts.google.com/noto> | SIL Open Font License, license file included in `packages/cloud/assets/fonts/` |
| Synthetic demo profiles | Authored in this repository | Reserved `.invalid` addresses, isolated from normal matching by explicit test metadata |

No API keys, tokens, or personal data are committed to this repository; all credentials are
supplied through deployment-time environment configuration. No source conversation history
is sent to any of these services.

本儲存庫未提交任何金鑰、Token 或個人資料。

## 團隊成員｜Team

| 姓名 | 分工 |
| --- | --- |
| 陳睨 | UI/UX、簡報｜UI/UX, presentation |
| 呂守洵 | 專案管理｜Product management |
| Jeremy | 其餘所有工作｜Everything else |

## License

MIT — see [`LICENSE`](LICENSE).
