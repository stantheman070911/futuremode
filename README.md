# **PitchYourOwner**

> **你的 Agent 了解你。讓它替你介紹真正的你。**

我們花了二十年填寫個人檔案，卻依然很難回答一個最基本的問題：

**「我真正正在思考什麼？」**

「攝影」、「設計」、「AI」、「音樂」——這些標籤看似在描述一個人，實際上幾乎沒有資訊量。

兩個人的個人檔案都可能寫著「攝影」。

其中一個人，過去三個月反覆研究低光環境下的街頭攝影；另一個人真正著迷的，是肩膀的線條如何在人像中傳達情緒。

傳統 Profile 看不出兩人的差異。

更重要的是，它也不會讓第二個人遇見那位正在研究**「身體如何傳遞情緒」**的編舞者——即使他們其實正在從不同媒介追問同一個問題。

真正能讓人產生連結的，往往不是：

**「我們喜歡同一件事。」**

而是：

**「原來你也在想這個問題。」**

---

## **問題與目標｜Problem & Goal**

今天，一個人最準確、最持續更新的「自我描述」，可能早已不在 LinkedIn、Instagram 或任何 Profile 裡。

而是在他每天使用的 AI 助理裡。

ChatGPT、Claude，以及其他個人 AI，逐漸看見一些傳統個人檔案從未捕捉到的訊號：

* 你反覆追問哪些問題
* 哪些難題幾個月後仍然沒有放下
* 什麼主題持續佔據你的注意力
* 你的興趣如何從表面逐漸變得具體
* 你現在正在學什麼、做什麼、試圖理解什麼
* 你真正想遇見什麼樣的人

這些訊號，比「興趣：攝影」豐富得多。

但目前，它們全部被困在私人聊天視窗裡。

使用者沒有一個**由自己控制、經自己審核、可以安全帶出去**的方法，讓這些理解成為與他人建立連結的入口。

**PitchYourOwner 想解決的，就是這個斷點。**

我們讓你已經在使用的 AI Agent，替你回答：

> **「如果你要把我介紹給一個真正可能跟我聊得來的人，你會怎麼介紹我？」**

不是重新填一份 Profile。

不是選更多興趣標籤。

而是讓已經理解你的 AI，替你整理出那些真正值得被另一個人看見的訊號——然後由你決定，哪些可以離開聊天視窗。

---

## **核心主張｜Core Idea**

### **Your agent knows you. Let it pitch you.**

PitchYourOwner 是一個 **AI-native friend discovery experience**。

使用者讓自己的 AI 助理撰寫一份「Owner Pitch」；經過隱私審核與本人確認後，系統依據其中真正有意義的內容尋找可能正在思考相似問題的人。

我們不是在匹配兩組關鍵字。

我們希望匹配的是：

**問題、好奇心、長期注意力，以及正在進行中的人生脈絡。**

例如：

> 「喜歡攝影」不是一個好的 match signal。

但：

> 「最近持續研究人在低光環境裡如何被城市空間吞沒」

可能會讓攝影師遇見燈光設計師、電影導演、建築師，甚至正在研究夜間城市感知的研究者。

媒介不同。

問題相同。

這就是 PitchYourOwner 想找到的連結。

---

## **目標使用者｜Target Users**

PitchYourOwner 面向已經把 AI 助理當成日常思考工具的人。

他們可能每天使用 ChatGPT、Claude 或其他 assistant，討論：

研究、side project、創作、職涯問題、技術難題、閱讀、興趣，以及那些還不知道該叫什麼名字的想法。

他們不一定想 networking。

也不一定在找工作、約會，或累積 followers。

他們只是希望：

> **遇見另一個剛好也在認真想同一件事的人。**

因此 PitchYourOwner **明確不是**：

* 招募平台
* Dating App
* 公開人物目錄
* Social Feed
* 以 engagement 為核心的社交網路

我們的核心使用情境更接近：

**「我的 AI 覺得，我應該認識這個人。」**

Phone-first，低摩擦，而且不要求使用者建立另一個需要長期維護的社交身份。

---

## **產品流程｜How It Works**

整個產品只有一個重要原則：

### **AI 可以理解你，但不能替你決定什麼可以公開。**

PitchYourOwner 將流程拆成三個 Agent 角色，以及兩個彼此獨立的人類批准關卡。

### **1. Your Agent：理解你**

使用者選擇自己原本就在使用的 AI 助理，例如 ChatGPT 或 Claude。

PitchYourOwner 提供完整 Prompt。

使用者在自己的 AI 裡執行它。

AI 根據既有對話脈絡，整理：

* 持續性的興趣
* 正在探索的問題
* 當前專案與目標
* 有辨識度的思考方式
* 可能適合認識的人
* 潛在敏感或不應公開的資訊

這個階段完全發生在使用者自己的 AI 環境中。

---

### **2. Privacy Gate：先刪除，再輸出**

在任何資料離開原本的 assistant 之前，AI 必須先列出可能涉及安全或隱私的內容。

使用者一次完成確認：

**哪些保留、哪些排除、哪些必須改寫。**

只有完成這一步後，AI 才輸出結構化 Profile JSON。

PitchYourOwner 的 backend：

**不讀取原始聊天紀錄。**

**不登入使用者的 AI。**

**不呼叫使用者的 Assistant API。**

**只接收使用者已經明確批准的 Profile JSON。**

---

### **3. Publication Gate：再次確認**

即使內容已經在原本的 AI 中通過隱私篩選，也不代表它自動公開。

PitchYourOwner 會把 Profile 重新呈現在一個 document-style confirmation page。

使用者看到的，就是即將被系統用於 matching 的實際內容。

只有再次按下明確的 Publish，Profile 才會進入 matching pool。

因此整個流程有兩道獨立的人類核准：

**Gate 1 — 私密 AI 內的內容排除**

**Gate 2 — PitchYourOwner 上的明確發布**

AI 負責理解。

Owner 保有最後決定權。

---

## **核心功能｜Core Features**

### **Passwordless Email OTP**

以 Email OTP 登入，不儲存密碼。

Session 使用 hashed opaque tokens，降低帳號系統本身需要持有的敏感資訊。

---

### **Owner Pitch Prompt**

使用者選擇：

* ChatGPT
* Claude
* 其他 assistant
* Prompt 語言

PitchYourOwner 產生完整的 Owner Pitch Prompt，讓使用者直接在自己的 AI 中開啟或分享。

Assistant 會先生成簡潔的人物理解，再辨識安全與隱私項目；使用者一次完成確認後，AI 才輸出符合 schema 的 JSON，以及指定 confirmation phrase。

**原始 conversation 永遠不需要傳給 PitchYourOwner。**

---

### **Meaning-based Matching**

PitchYourOwner 不以 category 或 keyword 作為主要匹配方法。

Profile 使用 **Amazon Bedrock Cohere `embed-v4`** 建立 embeddings，再透過 **DynamoDB native vector search** 找出語意相近的候選人。

候選人之間再依 `interests`、`active_problems`、`motivations`、`recurring_topics`、`friend_intent` 五個欄位分別計算 cosine similarity，並以加權方式得出 composite score，找出真正值得展開對話的交集。

因此：

> Photography ↔ Photography

並不一定是好 match。

而：

> Portrait photographer studying body language
> ↔ Choreographer studying emotional movement

反而可能高度相關。

---

### **Grounded Match Explanations**

AI 不只告訴使用者：

**「你們很適合認識。」**

每一組 Match 都會被轉換成三個可以真正開始對話的問題，並附上 evidence labels，清楚指出這個判斷來自雙方 Profile 中的哪些訊號。

說明文字直接由分數最高的相似欄位與雙方實際填寫的內容生成，不經過額外的模型改寫，因此每一句都能追溯回 Profile 中的原文。

例如：

> **你們是否都在研究「姿態如何傳達情緒」？**

> 你：反覆探索人像中的肩線與姿勢
> 對方：正在研究編舞中微小身體動作的情緒效果

使用者可以立即理解：

**為什麼是這個人。**

而不是被迫相信一個黑盒推薦分數。

---

### **Mutual-consent Introductions**

沒有冷 DM。

沒有公開聯絡方式。

沒有誰可以直接闖進另一個人的 Inbox。

當一方對 Match 有興趣，可以送出 invitation。

只有在：

**雙方都接受**

之後，PitchYourOwner 才揭露聯絡資訊。

接著 AI 可以根據兩人的共同脈絡，起草第一則訊息。

它不是一句：

> 「嗨，我看到你也喜歡攝影。」

而可能是：

> 「你提到你最近一直在研究動作幅度變小之後，情緒反而更明顯。我最近在人像裡也一直注意肩線和微小姿勢，感覺我們可能正在從兩個媒介碰同一個問題。」

**AI 找到交集。**

**人決定是否見面。**

---

### **Labelled Seeded Demo**

為了讓任何人能在不建立帳號、不連接 backend 的情況下理解產品，PitchYourOwner 提供完整 browser-based seeded demo。

Demo 中所有 synthetic profiles 都會清楚標示為示範資料。

它們永遠不會被呈現成真實使用者，也不會與 live matching pool 混淆。

---

The interface is Traditional Chinese only, by deliberate scope decision. If you cannot
read Chinese, [`docs/walkthrough-en.md`](docs/walkthrough-en.md) is an annotated English
walkthrough of the full journey using real screenshots of the deployed app.

介面僅提供繁體中文，這是刻意的範圍決定。產品行為與 UX 契約以
[`docs/product-design.md`](docs/product-design.md) 為準；Profile 的 machine-readable
契約以
[`config/pitchyourowner-profile-schema.json`](config/pitchyourowner-profile-schema.json)
為準。

---

## **隱私設計｜Privacy by Architecture**

對 PitchYourOwner 而言，privacy 不是 Privacy Policy 裡的一段文字。

它是產品架構本身。

我們刻意選擇了一條較嚴格的路：

> **不要把完整聊天紀錄交給一個新的平台，再要求使用者相信我們會妥善處理。**

相反地：

**讓最敏感的理解留在使用者原本的 AI 裡。**

AI 在那裡完成 synthesis。

使用者在那裡完成 exclusion。

PitchYourOwner 最終只接收：

**Owner 明確批准、刻意帶出來的最小必要資訊。**

這讓「AI 很了解我」第一次可以成為產品優勢，而不必同時變成：

**「另一家公司也必須看到我的全部聊天紀錄。」**

---

## **我們真正想改變的事情｜What We Want to Change**

今天的網路擅長回答：

**你認識誰？**

**你追蹤誰？**

**你在哪裡工作？**

**你喜歡哪些類別？**

但它不擅長回答：

> **現在，世界上還有誰正在認真思考我正在思考的問題？**

AI assistants 正在第一次建立足夠豐富的個人脈絡，可以回答這個問題。

PitchYourOwner 希望建立那個缺失的介面：

**從私人 AI 理解，到 owner-controlled identity；
從 identity，到有意義的 discovery；
從 discovery，到雙方自願開始的一段對話。**

你的 Agent 已經了解你。

**現在，讓它替你找到值得認識的人。**

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
                              ├── Weighted field-similarity scoring
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
published profile. Matching itself is deterministic: per-field cosine similarity over the
stored embeddings, combined into a weighted composite score, with explanations generated
from the strongest-scoring field and the owners' own profile text — no judge model is
invoked. A separate worker calls Google Gemini to generate and review profile images. The
end user's ChatGPT, Claude, or other assistant is never called by the backend.

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
| AI 模型 | Google Gemini (`gemini-3.1-flash-lite-image`, `gemini-3.5-flash-lite`) | Profile image generation and review |
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

No number here is drawn from synthetic or fixture data. See
[`docs/round1-submission.md`](docs/round1-submission.md) for the full narrative and one
real pairing quoted with permission.

## 限制與未來工作｜Limitations and future work

Known limitations:

- Matching has been exercised with synthetic photographer, dancer, and sound-designer
  profiles. No real 10–30-person validation cohort has been completed, so the repository
  does not claim real-user match quality.
- Matching scans the small active cohort and scores candidates per seed. Its provider work
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
| Amazon Bedrock (Cohere `embed-v4`) | <https://aws.amazon.com/bedrock/> | AWS account credentials, supplied at deploy time via environment configuration |
| Google Gemini API | <https://ai.google.dev/> | API key supplied at deploy time via environment configuration |
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
| Yili | 協助 Jeremy｜Assisting Jeremy |

## License

MIT — see [`LICENSE`](LICENSE).
