# PitchYourOwner Pairing Stack 建置報告

更新日期：2026-09-04（Asia/Taipei）

狀態：實作、本機驗證、AWS 隔離部署與線上端到端驗證完成

目標：以 VibeMate 已驗證的 serverless 架構為基礎，完成 PitchYourOwner Hackathon 第一版的手機 profile 匯入、發布、跨領域配對與雙向邀請。

## 1. 本次採用的最終產品決策

所有衝突均依 Host Owner 日期較晚的回覆處理：

| 主題 | 最終決定 |
|---|---|
| 產品名稱 | PitchYourOwner |
| 目標 | 找朋友；共享具體興趣、動機、問題或反覆主題 |
| Start | 1b — Typographic promise |
| Handoff | 1d — Prompt is the object |
| My Pitch | 1f — Document fields，`history_scope` 置頂 |
| Match detail | 1h — Three questions + evidence labels |
| 手機匯入 | AI 先顯示精簡摘要，只列出實際偵測到且具選項的 security／privacy 問題；Owner 一次回答所有 S 編號並輸入「確認安全並產生 JSON」後，AI 只輸出 JSON → 貼回網站 |
| 網站審核 | 可編輯欄位 → 獨立唯讀發布審核 → Confirm & upload／Back to edit |
| 電腦自動化 | 一般 HTTP draft API；24 小時、一次性、write-only、draft-only |
| WebMCP / Remote MCP | Hackathon 排除 |
| Confidence | 保留，只有 owner review 可見；不公開、不參與 matching |
| 敏感資料 | 在 AI 頁處理；PitchYourOwner 不偵測、不過濾、不改寫、不保存 privacy ledger |
| Matching | 發布後立即觸發；通知與邀請作為 re-entry，不設無限 feed 或公開分數 |

## 2. 與 VibeMate 的關係

重用的是架構模式，不是舊產品 contract：

- 私有 S3 靜態站台、CloudFront OAC 與同源 `/v1/*` API。
- API Gateway HTTP API、Node.js Lambda 與 DynamoDB 單表。
- Email OTP、opaque session token、Resend。
- Bedrock Cohere embedding、DynamoDB vector search、Nova match judge。
- DynamoDB PITR、TTL、deletion protection 與 retain policy。
- SQS/DLQ、CloudWatch alarm、SNS operations topic 與 AWS Budget。

以下內容已替換：VibeMate 的 Markdown/skills/stories profile contract、desktop analyzer、公開 profile、weekly email-first matching 與舊網站畫面。

`VibeMate-dev` 僅被讀取以取得架構與既有 secret parameter；沒有修改其 CloudFormation stack、table、bucket、API 或網站。

## 3. 已實作產品流程

1. Email OTP 登入。
2. 選擇 ChatGPT、Claude 或其他 AI。
3. 以完整 prompt 為主要物件，提供複製、開啟 AI 與返回說明。AI 第一則顯示精簡摘要，只列出實際偵測到的 security／privacy 問題；每項都有 `S1`、`S2`… 編號、具體風險及處理選項，不逐欄展示 schema，也不詢問介紹是否符合聊天歷史。
4. Owner 在一則訊息選完所有 S 編號並加上「確認安全並產生 JSON」後，AI 下一則只輸出可解析 JSON；使用者將該 JSON 貼回網站。
5. 將七個核心欄位與 confidence 渲染成可編輯控制項。
6. 進入獨立唯讀最終發布審核。
7. 發布 profile、建立 embedding 並立即啟動 matching。
8. 顯示 Matches list。
9. Match detail 回答三個問題，並顯示 evidence labels；不顯示 confidence 或 numeric score。
10. 發送 invitation；雙方接受後才揭露註冊 email。
11. Settings 可建立電腦用 24 小時 draft token。

## 4. Profile 與 matching contract

Schema：`pitchyourowner.profile-publish.v1`

七個核心欄位：

- `summary`
- `interests`
- `motivations`
- `active_problems`
- `recurring_topics`
- `friend_intent`
- `history_scope`

`confidence` 對 `summary`、`interests`、`motivations`、`active_problems`、`recurring_topics`、`friend_intent` 使用 `high | medium | low`。它只支援 owner review。

Matching document 使用前六個配對欄位，明確排除 `history_scope` 與 `confidence`。Peer-facing API 也排除這兩者。

初始 judge 維度為：specific interest 30%、active problem 25%、motivation 20%、recurring topic 15%、friend intent／practical compatibility 10%。只有 `strong_match` 且超過門檻才建立配對。

## 5. API 覆蓋

| 方法與路徑 | 用途 |
|---|---|
| `POST /v1/email-verifications` | 發送 OTP |
| `POST /v1/email-verifications/{challengeId}/confirm` | 確認 OTP 並建立 session |
| `POST /v1/profile-versions` | 發布 owner 明確核准的 profile version |
| `GET /v1/profile-versions/{versionId}` | 讀取特定 owner version |
| `GET/PATCH/DELETE /v1/profiles/me` | 取得、停用 matching、刪除 owner 資料 |
| `POST /v1/upload-sessions` | 建立 24 小時電腦 draft capability |
| `POST /v1/profile-drafts` | 單次 write-only draft submission |
| `GET /v1/profile-drafts` | Owner 列出自己的 drafts |
| `GET /v1/profile-drafts/{draftId}` | Owner 讀取自己的 draft |
| `POST /v1/matching-runs` | 發布後立即啟動 matching |
| `GET /v1/matches` | Match list |
| `GET /v1/matches/{matchId}` | 三問題解釋與 evidence labels |
| `POST /v1/matches/{matchId}/invitations` | Invite／Accept／Not now |
| `GET /v1/invitations` | Incoming、outgoing、connected invitations |
| `POST /v1/support-requests` | 支援請求 |

## 6. 本機自動化與瀏覽器驗證

- TypeScript build：通過。
- Node test suite：22 / 22 通過（含 prompt/runtime 同步與兩階段輸出契約 regression）。
- 靜態 JavaScript syntax：通過。
- CDK synth：通過。
- 新增 regression：vector custom-resource 必須依賴 provider 的 `lambda:GetFunction` policy，避免首次建 stack 的 IAM race。
- 手機流程已在 375px 與 320px 以真實 Playwright browser 逐步操作。
- 已比較 confirmed reference 與 implementation screenshot；Start、Handoff、My Pitch、Match detail 均依 1b／1d／1f／1h 實作。
- 320px Match detail 無水平裁切；主要 CTA、bottom navigation 與三問題區塊可操作。
- 線上 API smoke test：24 小時 token、單次使用、draft read、reviewed publish、profile read 與精準清理全部通過。

瀏覽器證據位於：

`prompts/2026-09-04_001_pitchyourowner-build_artifacts/browser-qa/`

其中 `09-match-detail-375-*` 保留首次發現 loading-state bug 的證據；修正後證據為 `10-match-detail-fixed-375-*` 與 `11-match-detail-320-*`。

## 7. AWS 隔離與營運保護

- Stack：`PitchYourOwner-hackathon`
- Region：`ap-southeast-1`
- AWS account：與 VibeMate 相同，但所有應用資源使用獨立 `pitchyourowner-hackathon-*` 名稱。
- Matching schedule：`DISABLED`；發布後由 API 非同步觸發。
- Matching email delivery：`DISABLED`；Hackathon 以 in-app invitations 為主。
- Verification email：`ENABLED`。
- Monthly AWS Budget：USD 100。
- Table：PITR、TTL、AWS-managed encryption、deletion protection、RETAIN。

### 首次部署問題與修正

首次建立 stack 時，CDK async custom-resource framework 在 inline IAM policy 完成可用前先呼叫向量 worker，`lambda:GetFunction` 收到 403，導致 vector index resource 失敗並觸發 rollback。

修正方式：

1. 對 provider framework 明確加入 `lambda:GetFunction` 與 `lambda:InvokeFunction` 的最小資源權限。
2. 讓 vector custom resource 顯式依賴該 inline policy。
3. 新增 CDK template regression test，確保此依賴不會被移除。

第二次以 Hackathon 名稱建立時，AWS IAM role 已完成建立，但 Lambda 在約 20 秒後仍暫時無法 assume role，CloudFormation 因此回滾。這是帳號內可重現的 IAM eventual-consistency 延遲，不是 trust policy 或應用權限錯誤；同一份 template 在完整清理後第三次建立成功，所有 Lambda 均正常建立。

兩次失敗部署所產生的 retained 空資料表與網站 bucket 已先確認精確名稱、`ItemCount = 0`／物件內容，再停用該空表的 deletion protection 並刪除。沒有刪除或修改 VibeMate 資源。

## 8. 線上驗證結果

### 可檢查環境

- CloudFront app：`https://d1vuzznd4gxltu.cloudfront.net`
- API Gateway：`https://be1tnhx22c.execute-api.ap-southeast-1.amazonaws.com`
- CloudFormation：`PitchYourOwner-hackathon`，`CREATE_COMPLETE`
- DynamoDB vector index：`profile-matching-v1`，`ACTIVE`，1024 dimensions

### HTTP 與 browser

| 檢查 | 結果 |
|---|---|
| `GET /` | 200 `text/html` |
| `GET /matches` clean route | 200 `text/html` |
| 中文 extraction prompt | 200 `text/plain` |
| machine-readable profile schema | 200 `application/json` |
| 未授權 `GET /v1/matches` | 401 `application/json` |
| 375px 真實 CloudFront 首頁 | Playwright 開啟與截圖成功 |

Live browser evidence：`prompts/2026-09-04_001_pitchyourowner-build_artifacts/browser-qa/15-live-start-375-2026-09-03T18-05-30-232Z.png`

### 跨職業 pairing 實驗

Synthetic photographer、dancer、sound designer 共 3 份 profile：

- considered 3；judged 3；created 2；rejected 0。
- Match list 200，共 2 組；match detail 200。
- 取樣 explanation evidence labels：`interests`、`active_problems`。
- 第一方 invite 200；第二方 accept 200；`mutual = true`。
- 聯絡 email 只在 mutual acceptance 後揭露。

這證明目前 stack 的跨職業資料路徑可運作；它不是 production 配對品質或真人有效性的證明。

### Computer draft API 與發布

- 建立 upload session：201，`expires_in_seconds = 86400`。
- Capability：`single-use write-only draft creation`。
- 建立 draft：201，`status = draft`。
- 相同 token 重播：401，成功拒絕。
- Owner 讀取 draft：200，`source = computer_api`。
- 網站權限下 reviewed publish：201，`status = published`。
- 讀取 published profile：200；刪除：200。

### 清理結果

- 跨職業 fixture 刪除 25 筆關聯資料。
- `isTestProfile && cleanupSafe` 殘留筆數：0。
- 最終 table scan：`Count = 0`、`ScannedCount = 0`。
- Smoke test 沒有輸出 upload token、session token 或真實 email。

## 9. 目前剩餘風險

- AWS deploy profile 目前對應 root identity；Hackathon 後應改為 least-privilege deploy role。
- Browser 使用 localStorage 保存 opaque session token，適合目前 serverless Hackathon，但正式版應評估 HttpOnly secure cookie 與 CSRF 模型。
- AI provider 可存取的 history/memory 範圍不一致；`history_scope` 必須誠實描述，但不能作為 matching signal。
- Match judge 仍需要真人 cohort 評估。Synthetic photographer／dancer／sound-designer fixture 只能驗證資料與 pipeline，不代表 production matching 品質。
- Block/report、age policy 與 production abuse operations 尚未完成，若對外公開招募真實使用者，必須排入下一階段。

## 10. 2026-09-04 Prompt 與手機指引修正

先前 prompt 會要求 AI 展開完整 profile，造成使用者必須逐欄閱讀與核對；這也讓第一則自然語言回答容易被誤貼到只接受 JSON 的網站欄位。較新的 Host Owner 決定已取代該行為：

1. 第一則回答不是 JSON，只包含精簡 owner pitch、合併後的主要配對訊號、想認識的人，以及最多兩句的資料範圍說明。
2. 確認問題只能是擬傳輸內容中實際偵測到的 security／privacy 問題；每項使用 `S1`、`S2`… 編號，說明具體風險並提供明確選項。不得詢問 profile 是否吻合聊天歷史，也不得提出一般或開放式問題。
3. Owner 必須在一則訊息選完全部 S 編號並加上「確認安全並產生 JSON」。若沒有問題，AI 明確告知並只要求同一確認語。只有完成這項安全決策契約後，AI 下一則才只輸出合法 JSON object。
4. 網站 Import 頁提供四步圖文指引；若貼入第一則自然語言摘要，顯示可直接採取行動的錯誤訊息，指示回 AI 回答全部 S 編號、加入「確認安全並產生 JSON」並複製下一則回答。
5. Canonical docs prompt 會在 build/test 前同步到 runtime static prompt，並由 regression test 防止兩份內容漂移。

驗證結果：

- AWS stack 於 `2026-09-04T01:44:29.262Z` 完成最終更新並維持 `UPDATE_COMPLETE`；CloudFront 線上 prompt 與 canonical prompt 的 SHA-256 完全相同，且 prompt／`app.js` 均包含 `S1/S2`、八類內部掃描規則、具體風險／替代文字範例、「確認安全並產生 JSON」及新版復原指令。
- 375px 與 320px 的真實 stepwise browser 驗證通過；四步指引沒有水平裁切。
- 實際將自然語言摘要貼入 JSON 欄位並送出後，頁面以 `role="alert"` 指示回 AI 回答所有 S 編號選項並加入確切安全確認語。
- 最新 screenshots：[Import guide · 375px](assets/aws-build/04-import-guide-375-2026-09-04T01-34-02-799Z.png)、[Prose error · 375px](assets/aws-build/06-prose-error-top-375-2026-09-04T01-34-50-122Z.png)、[Prose error · 320px](assets/aws-build/07-prose-error-320-2026-09-04T01-35-08-177Z.png)、[Live start · 375px](assets/aws-build/08-live-start-375-2026-09-04T01-38-20-910Z.png)。
- `interactive_stepwise_runtime=true`
- `browser_control_mode=interactive_browser_per_session`
- `backend=@executeautomation/playwright-mcp-server@1.0.12`
- `scope=pyo-security-confirm-20260904`
- `registry_path=/Users/wanghsuanchung/.oysterun-browser-mcp/registry/pyo-security-confirm-20260904.json`
- `mcp_endpoint=http://127.0.0.1:58168/mcp`
- `current_url_sequence=local / → /assistant → /handoff → /import; live https://d1vuzznd4gxltu.cloudfront.net/`
- `cleanup_status=stopped`
- `pass/fail/blocker=PASS`
