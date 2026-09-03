# PitchYourOwner — Implementation Plan｜實作計畫

_Last updated｜最後更新: 2026-09-03_
_Role｜角色: how the approved brief is built and verified · governed by
[`constitution.md`](constitution.md)_
_已核准規格的建造與驗證方式 · 受 [`constitution.md`](constitution.md) 規範_

The **executable work queue**, not just an architecture description. Architecture is
planned broadly; only the next few tasks are planned precisely. Re-plan the next slice
once the current one lands.

這是 **可執行的工作佇列**，不只是架構描述。架構做大方向規劃，只有接下來幾項任務做精確
規劃。當目前的切片完成後，再規劃下一個切片。

---

## 1. Architecture｜架構

| Concern｜面向 | Selected implementation｜選用方案 | Why (one line)｜理由（一行） |
| --- | --- | --- |
| Application framework｜應用框架 | Next.js (App Router) + TypeScript | One codebase for UI and the submission endpoint; no separate backend to run｜UI 與提交端點共用一份程式碼，不需另外維運後端 |
| Client target｜用戶端目標 | Mobile web / PWA at 375px｜行動網頁 / PWA，375px | Judges open a URL on their own phone; no store review, no Expo Go install｜評審用自己的手機開網址；免上架審核、免安裝 Expo Go |
| Hosting｜託管 | Vercel | Preview URL per branch, zero deploy config｜每個分支自動產生預覽網址，零部署設定 |
| Database / auth｜資料庫與驗證 | Supabase (Postgres + Auth) | Postgres gives us the matching query directly; auth is free｜Postgres 可直接寫配對查詢；驗證功能免費附帶 |
| Styling｜樣式 | Tailwind + shadcn/ui | One component library, no bespoke CSS (brief § 6)｜單一元件庫，不寫客製 CSS（規格 § 6） |
| Submission endpoint｜提交端點 | Next.js Route Handler (`POST /api/submit_owner_pitch`) | The tool contract is one HTTP endpoint; MCP is not needed for the demo｜工具契約就是一個 HTTP 端點；展示不需要 MCP |
| Schema validation｜結構驗證 | Zod, `.strict()` | Rejects unknown fields rather than ignoring them (brief R4.3)｜拒絕未知欄位而非忽略（規格 R4.3） |
| Matching｜配對 | SQL over normalized tags in Postgres｜在 Postgres 中對正規化標籤做 SQL 查詢 | Explainable by construction — the query returns *which* items overlapped｜天生可解釋：查詢直接回傳 *哪些* 項目重疊 |
| Notifications｜通知 | In-app notification centre｜App 內通知中心 | Real push is out of scope (brief § 3)｜真實推播不在範圍內（規格 § 3） |
| Lint / types｜檢查與型別 | ESLint + `tsc --noEmit` | Ships with the Next.js template｜Next.js 樣板已內建 |
| Tests｜測試 | Vitest | Fast, no config; used for the submission endpoint and matching only｜快速、免設定；僅用於提交端點與配對 |

**Decision — no embeddings, no vector search.** Explainability is a hard requirement
(constitution Law IV, brief R5.2). A weighted overlap query over normalized tags can
always name the items behind a score; a similarity vector cannot. This is the simpler
option *and* the more correct one.

**決策：不使用 embedding，不使用向量搜尋。** 可解釋性是硬性需求（憲法法則四、規格
R5.2）。對正規化標籤做加權重疊查詢，永遠能指出分數背後的具體項目；相似度向量做不到。
這既是比較簡單的選項，*也是* 比較正確的選項。

**Decision — mobile web over native.** The brief's language is "phone app", and the
share-sheet/deep-link story is slightly weaker on web. Web wins on hackathon
throughput: no build queue, no device provisioning, and the demo is a URL. Copy +
Web Share API covers R1.3.

**決策：行動網頁而非原生 App。** 規格中的用語是「手機 App」，網頁在分享選單與深層連結
上略遜一籌。但在 hackathon 的產出效率上網頁勝出：沒有建置佇列、不需配置裝置，展示就是
一個網址。複製功能加上 Web Share API 已足以滿足 R1.3。

Project identifiers, credentials, and provisioning status are configuration facts —
they live in [`log.md`](log.md) § Configuration state, not here.

專案識別碼、憑證與開通狀態屬於組態事實，存放於 [`log.md`](log.md) § Configuration
state，不放在此處。

### Ownership boundaries｜權責邊界

Which directory owns what, so a change lands in one predictable place.

哪個目錄負責什麼，讓每次修改都落在可預期的位置。

| Location｜位置 | Owns｜負責 |
| --- | --- |
| `app/(app)/` | The four areas: Matches, Invitations, My Pitch, Settings｜四大區域：配對、邀請、我的介紹、設定 |
| `app/(onboarding)/` | Start screen, prompt handoff, fallback Review & Publish｜開始頁、提示詞交接、備援的審核與發布頁 |
| `app/api/submit_owner_pitch/` | The submission endpoint and nothing else｜僅提交端點，別無其他 |
| `lib/schema.ts` | The single Zod definition of the profile contract｜個人檔案契約的唯一 Zod 定義 |
| `lib/prompt.ts` | The generated prompt template (Steps 2 + 3 live here)｜產生的提示詞模板（Step 2 與 3 在此） |
| `lib/matching.ts` | Scoring and explanation generation｜評分與解釋產生 |
| `supabase/migrations/` | Schema; the only place DDL is written｜結構定義；唯一撰寫 DDL 之處 |
| `components/ui/` | shadcn primitives — not edited by hand｜shadcn 基礎元件，不手動修改 |

---

## 2. Development environment｜開發環境

### Setup｜設定

```bash
node -v                 # 20 or 22 LTS — anything else is unsupported
pnpm install
cp .env.example .env.local   # fill from log.md § Configuration state
pnpm dev                     # http://localhost:3000
```

### Conventions｜慣例

- **Package manager: pnpm.** Do not mix in `npm install` — the lockfile is authoritative.
  **套件管理器使用 pnpm。** 不要混用 `npm install`，以 lockfile 為準。
- **`.env.example` is committed and lists every variable by name.** `.env.local` is
  gitignored and never committed, pasted into chat, or printed. No exceptions.
  **`.env.example` 需提交，並逐一列出所有變數名稱。** `.env.local` 加入 gitignore，
  絕不提交、絕不貼到對話、絕不列印。無例外。
- **Branch per work-queue item:** `p-003-submit-endpoint`. Never commit to `main`.
  **每項工作佇列任務開一個分支：** 例如 `p-003-submit-endpoint`。絕不直接提交到 `main`。
- **Commit message:** `P-003: reject unknown fields in submit payload`.
  **提交訊息格式：** `P-003: reject unknown fields in submit payload`。
- **Open a PR to `main`.** Vercel builds a preview URL per PR; that URL is what gets
  reviewed, not the diff alone.
  **對 `main` 開 PR。** Vercel 會為每個 PR 建立預覽網址；審查的對象是那個網址，
  而不只是 diff。
- **Schema changes go through `supabase/migrations/`**, never through the Supabase
  dashboard. A dashboard-only change is invisible to everyone else's local database.
  **結構變更一律透過 `supabase/migrations/`**，絕不透過 Supabase 後台。只在後台做的
  變更，對其他人的本地資料庫是不可見的。
- **Seed data lives in `supabase/seed.sql`** and is the demo's participant set. Never
  seed real people's data.
  **種子資料放在 `supabase/seed.sql`**，即展示用的參與者集合。絕不放入真實人物的資料。
- **Bilingual copy** (EN + 繁中) lives in one place per surface, not scattered inline.
  **雙語文案**（英文 + 繁中）每個介面集中於一處，不要散落在各行程式碼中。

### The gate｜檢查關卡

Everything below must pass before a task is called complete:

以下全部通過，任務才算完成：

```bash
pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

---

## 3. Engineering constraints｜工程限制

### Consent and submission｜同意與提交

- **`owner_confirmed` is verified server-side on every submission.** A client-supplied
  flag alone never publishes. Reason: it is the entire consent model.
  **每次提交都必須在伺服器端驗證 `owner_confirmed`。** 僅憑用戶端傳來的旗標絕不發布。
  理由：這就是整個同意模型。
- **The Zod schema is `.strict()`.** Unknown fields are a rejection, not a silent drop.
  Reason: an ignored unknown field is how raw content sneaks in.
  **Zod schema 使用 `.strict()`。** 未知欄位應被拒絕，而非默默丟棄。理由：被忽略的
  未知欄位正是原始內容混入的途徑。
- **Payloads are size-capped before parsing.** Reason: reject oversized input cheaply.
  **在解析前先限制 payload 大小。** 理由：以低成本拒絕過大的輸入。
- **A profile is `status = 'draft'` until published.** Only `published` rows are
  matchable. Reason: brief R4.7.
  **檔案在發布前為 `status = 'draft'`。** 只有 `published` 的資料列可參與配對。
  理由：規格 R4.7。

### Tokens｜權杖

- **Tokens are stored as a SHA-256 hash, never plaintext.** The plaintext exists only
  in the generated prompt.
  **Token 以 SHA-256 雜湊儲存，絕不明文。** 明文只存在於產生的提示詞中。
- **The token grants exactly one operation: create one draft.** There is no read path,
  no list path, no update path bound to it. Reason: brief R4.4.
  **Token 只授予一項操作：建立一份草稿。** 不綁定任何讀取、列表或更新路徑。
  理由：規格 R4.4。
- **`used_at` is set in the same transaction as the insert.** Reason: two concurrent
  submissions must not both succeed (brief R4.2).
  **`used_at` 與插入操作在同一交易中設定。** 理由：兩個並行提交不得同時成功
  （規格 R4.2）。

### Logging｜日誌

- **Never log a token, a profile body, or a match explanation.** Log ids and outcomes.
  Reason: the product promise is that this content is minimized everywhere.
  **絕不記錄 token、檔案內容或配對解釋。** 只記錄識別碼與結果。理由：產品承諾是這類
  內容在任何地方都要最小化。

### Matching｜配對

- **Every score carries the items that produced it.** `lib/matching.ts` returns
  `{ score, overlaps: { interests: [...], problems: [...], ... } }` — never a bare
  number. Reason: an unexplainable match cannot be shown (brief R5.2).
  **每個分數都必須帶著產生它的項目。** `lib/matching.ts` 回傳
  `{ score, overlaps: { interests: [...], problems: [...], ... } }`，絕不只回傳數字。
  理由：無法解釋的配對不得顯示（規格 R5.2）。
- **Filters are applied as a `WHERE` clause, never as score weights.** Reason: brief R5.5.
  **篩選條件以 `WHERE` 子句實作，絕不作為評分權重。** 理由：規格 R5.5。

---

## 4. Implementation method, by step｜各步驟實作方式

### Step 1 + 4 — Sessions and submission｜工作階段與提交

Data model (the whole thing)｜資料模型（全部）:

```
upload_sessions  id · user_id · token_hash · expires_at · used_at
profiles         id · user_id · summary · friend_intent · history_scope
                 confidence(jsonb) · status(draft|published) · created_at
profile_tags     profile_id · kind(interest|motivation|active_problem|recurring_topic)
                 · value · normalized       -- normalized = lowercased, trimmed
matches          a_profile · b_profile · score · overlaps(jsonb)
invitations      from_profile · to_profile · status(pending|accepted|declined)
```

`profile_tags` is the key decision: one row per claim, rather than JSON arrays on
`profiles`. It makes the matching query a plain join and makes the overlap set fall out
of that same query — which is what makes matches explainable for free.

`profile_tags` 是關鍵決策：每項描述一列，而不是在 `profiles` 上放 JSON 陣列。這讓配對
查詢變成單純的 join，且重疊集合會直接從同一個查詢產出，配對的可解釋性因此毫不費力地
達成。

Flow: create session → prompt carries session id → assistant POSTs → validate size,
schema, `owner_confirmed`, session validity → insert profile + tags, mark session used,
all in one transaction → deep link back to the app.

流程：建立工作階段 → 提示詞夾帶 session id → AI 助理 POST → 驗證大小、結構、
`owner_confirmed` 與工作階段有效性 → 在單一交易中插入檔案與標籤並標記工作階段已使用
→ 以深層連結返回 App。

### Step 2 + 3 — The prompt｜提示詞

`lib/prompt.ts` holds one template. It is the product, not a string constant — changes
to the consolidated-confirmation wording need PM approval (brief § 7). Test it by
running it against real ChatGPT and Claude accounts, not by unit test.

`lib/prompt.ts` 只放一份模板。它是產品本身，不是字串常數；整合式確認的措辭若要更動，
必須經 PM 核准（規格 § 7）。測試方式是對真實的 ChatGPT 與 Claude 帳號實際執行，
而不是寫單元測試。

### Step 5 — Matching｜配對

One SQL query joining `profile_tags` to itself on `normalized`, grouped by candidate,
weighted 30/25/20/15/10 per brief R5. Filters as `WHERE`. Returns overlap arrays
alongside the score. The three Match Detail questions are rendered from those arrays.

一個 SQL 查詢，以 `normalized` 對 `profile_tags` 自我 join，依候選人分組，並依規格 R5
以 30/25/20/15/10 加權。篩選條件放在 `WHERE`。回傳分數的同時回傳重疊陣列。配對詳情頁
的三個問題即由這些陣列渲染而成。

---

## 5. Work queue｜工作佇列

Bounded, independently verifiable tasks. **A completed task is removed from this
queue** — status lives in [`log.md`](log.md).

有界限、可獨立驗證的任務。**完成的任務要從此佇列移除**，狀態記錄在 [`log.md`](log.md)。

`Owner: SD` = senior dev｜資深開發者 · `JD` = junior dev｜初階開發者 ·
`PM` = product manager｜產品經理 · `PP` = presentation/packaging｜簡報與包裝

```
P-001 — Scaffold Next.js + Supabase + Vercel, gate command green
        建立 Next.js + Supabase + Vercel 骨架，讓檢查關卡通過
Owner:            SD
Requirement:      infrastructure for all｜所有人的基礎建設
Depends on:       none
Files:            repo root, app/, .env.example, package.json
Implementation:   Next.js + TS + Tailwind + shadcn into the existing repo; Supabase
                  project; Vercel link; .gitignore + .env.example; pnpm scripts for
                  typecheck/lint/test/build
                  在既有儲存庫中建立 Next.js + TS + Tailwind + shadcn；開通 Supabase
                  專案；連結 Vercel；建立 .gitignore 與 .env.example；設定 pnpm scripts
Verification:     gate command exits 0; a deployed preview URL loads on a phone
                  檢查關卡結束碼為 0；部署的預覽網址能在手機上開啟
Done when:        another dev can clone, install, and run `pnpm dev` from
                  docs/plan.md § 2 alone
                  另一位開發者僅憑 docs/plan.md § 2 就能 clone、安裝並執行 `pnpm dev`
```
```
P-002 — Schema + migrations + seed｜結構、migration 與種子資料
Owner:            SD
Requirement:      BRIEF R4, R5
Depends on:       P-001
Files:            supabase/migrations/*, supabase/seed.sql
Implementation:   the five tables in § 4; seed 12 synthetic participants across 4
                  distinct interest areas, including two pairs that should match and
                  one pair sharing only a broad domain label
                  § 4 的五張表；建立 12 位橫跨 4 個興趣領域的合成參與者，其中包含兩組
                  應該配對成功的組合，以及一組僅共享廣泛領域標籤的組合
Verification:     migration applies to a clean database; seed produces the intended
                  match/non-match pairs
                  migration 能套用到乾淨資料庫；種子資料產生預期的配對與非配對組合
Done when:        the R5.3 negative case exists in seed data
                  種子資料中存在 R5.3 的反例
```
```
P-003 — submit_owner_pitch endpoint｜提交端點
Owner:            SD
Requirement:      BRIEF R3.6, R4.1–R4.4
Depends on:       P-002
Files:            app/api/submit_owner_pitch/, lib/schema.ts
Implementation:   size cap → Zod .strict() → owner_confirmed check → session validity
                  → transactional insert + mark used
                  大小上限 → Zod .strict() → owner_confirmed 檢查 → 工作階段有效性
                  → 交易中插入並標記已使用
Verification:     Vitest covering each rejection path separately: expired, duplicate,
                  unknown field, missing confirmation, oversized
                  Vitest 分別涵蓋每條拒絕路徑：過期、重複、未知欄位、缺少確認、過大
Done when:        R4.1, R4.2, R4.3, R4.4 and R3.6 each have a passing test
                  R4.1、R4.2、R4.3、R4.4 與 R3.6 各自都有通過的測試
```
```
P-004 — Prompt template｜提示詞模板
Owner:            PM (drafts) + SD (wires in)｜PM 撰寫，SD 接入
Requirement:      BRIEF R1.2, R2.1–R2.5, R3.1–R3.5
Depends on:       P-001
Files:            lib/prompt.ts
Implementation:   the full prompt: scope restriction, nine-field schema, sensitive-data
                  pass, the exact consolidated-confirmation wording from BRIEF § Step 3
                  完整提示詞：範圍限制、九欄位結構、敏感資料檢查，以及規格 Step 3 中
                  一字不差的整合式確認措辭
Verification:     run against real ChatGPT and Claude accounts; score against the
                  rubric in § 6 below
                  對真實 ChatGPT 與 Claude 帳號實測，並依 § 6 的評分準則評估
Done when:        3 of 3 test runs on each assistant produce a valid nine-field object
                  with no verbatim excerpts
                  每個助理 3 次測試皆產生有效的九欄位物件，且無逐字引用
```
```
P-005 — Start screen + prompt handoff｜開始頁與提示詞交接
Owner:            JD
Requirement:      BRIEF R1.1, R1.3, R1.4
Depends on:       P-003, P-004
Files:            app/(onboarding)/
Implementation:   promise + assistant picker + "Raw chats are not uploaded"; create
                  session on tap; copy button and Web Share API; expiry countdown
                  產品承諾 + 助理選擇器 +「不會上傳原始對話」；點擊建立工作階段；
                  複製按鈕與 Web Share API；到期倒數
Verification:     manual pass on a real phone at 375px; copy lands full prompt on
                  clipboard
                  在真實手機 375px 上人工驗收；複製能將完整提示詞放入剪貼簿
Done when:        R1.1, R1.3, R1.4 pass, and R1.5 shows a clear expired state
                  R1.1、R1.3、R1.4 通過，且 R1.5 顯示明確的過期狀態
```
```
P-006 — Fallback Review & Publish screen｜備援審核與發布頁
Owner:            JD
Requirement:      BRIEF R4.5, edge case "malformed JSON"｜邊界案例「格式錯誤的 JSON」
Depends on:       P-003
Files:            app/(onboarding)/review/
Implementation:   paste JSON → parse with the same lib/schema.ts → render every field
                  → single publish action
                  貼上 JSON → 以同一份 lib/schema.ts 解析 → 渲染所有欄位 → 單一發布動作
Verification:     paste a valid payload and three malformed ones; compare the resulting
                  row against a direct-path row
                  貼上一份有效與三份格式錯誤的 payload；將結果資料列與直接路徑的比對
Done when:        R4.5 holds and malformed input names what is missing without
                  partially publishing
                  R4.5 成立，且格式錯誤的輸入會指出缺少什麼，並且不會部分發布
```
```
P-007 — Matching query + explanations｜配對查詢與解釋
Owner:            SD
Requirement:      BRIEF R5.1, R5.3, R5.5, R5.6
Depends on:       P-002
Files:            lib/matching.ts
Implementation:   weighted self-join over profile_tags returning score + overlap arrays;
                  filters as WHERE
                  對 profile_tags 做加權自我 join，回傳分數與重疊陣列；篩選放在 WHERE
Verification:     Vitest against the seed set: the two intended pairs match, the
                  broad-domain-only pair does not
                  以種子資料執行 Vitest：兩組預期組合配對成功，僅共享廣泛領域者不配對
Done when:        R5.1 and R5.3 both have passing tests over seed data
                  R5.1 與 R5.3 在種子資料上都有通過的測試
```
```
P-008 — My Pitch screen｜我的介紹頁
Owner:            JD
Requirement:      BRIEF R4.6
Depends on:       P-003
Files:            app/(app)/pitch/
Implementation:   five groups + history scope + confidence labels + the
                  conversation-derived / owner-approved labels
                  五個分組 + 歷史範圍 + 信心標籤 + 由對話衍生／owner 已核准 標籤
Verification:     manual pass against R4.6 field by field｜逐欄位對照 R4.6 人工驗收
Done when:        every field in R4.6 is on screen and no raw evidence is shown
                  R4.6 的所有欄位都在畫面上，且不顯示任何原始證據
```
```
P-009 — Matches list + Match Detail｜配對列表與配對詳情
Owner:            JD
Requirement:      BRIEF R5.2, R5.4, R6.5
Depends on:       P-007
Files:            app/(app)/matches/
Implementation:   render the three questions from the overlap arrays; Invite / Not now
                  only; no score shown
                  由重疊陣列渲染三個問題；只提供 Invite / Not now；不顯示分數
Verification:     manual pass; confirm no numeric score reaches the DOM
                  人工驗收；確認沒有任何數字分數進入 DOM
Done when:        R5.2, R5.4, R6.5 pass｜R5.2、R5.4、R6.5 通過
```
```
P-010 — Invitations + mutual consent｜邀請與雙方同意
Owner:            SD
Requirement:      BRIEF R6.3, R6.4, edge case "simultaneous invite"｜邊界案例「同時邀請」
Depends on:       P-009
Files:            app/(app)/invitations/
Implementation:   invite → pending → accept reveals both sides; decline returns no
                  reason; rate limit on re-send; simultaneous invites collapse to one
                  邀請 → 待處理 → 接受後雙方互相顯示；拒絕不回傳理由；重送有頻率限制；
                  同時邀請收斂為一筆
Verification:     Vitest on the state machine including the simultaneous case
                  以 Vitest 測試狀態機，包含同時邀請的情況
Done when:        R6.3 and R6.4 have passing tests｜R6.3 與 R6.4 有通過的測試
```
```
P-011 — In-app notification centre｜App 內通知中心
Owner:            JD
Requirement:      BRIEF R6.1, R6.2
Depends on:       P-007, P-010
Files:            app/(app)/
Implementation:   three notification types; preview text carries no sensitive topic
                  三種通知類型；預覽文字不得帶有敏感主題
Verification:     manual: generate one of each and inspect preview text
                  人工：各產生一則並檢查預覽文字
Done when:        R6.1 and R6.2 pass｜R6.1 與 R6.2 通過
```
```
P-012 — Completion audit｜完成度稽核
Owner:            PM
Requirement:      all｜全部
Depends on:       P-003..P-011
Files:            docs/log.md
Implementation:   run the audit prompt in § 7 below; every criterion without evidence
                  becomes a new queue item
                  執行下方 § 7 的稽核提示詞；每條缺少證據的標準都成為新的佇列項目
Done when:        every BRIEF acceptance criterion has named evidence or a logged gap
                  規格中每條驗收標準都有指名的證據，或已記錄的缺口
```
```
P-013 — Demo run-of-show｜展示流程腳本
Owner:            PP (with PM)｜PP 主導，PM 協同
Requirement:      the demo, not the product｜展示本身，而非產品
Depends on:       P-005, P-009
Files:            docs/runbook.md § Demo
Implementation:   scripted path, seeded accounts, fallback plan for a failed live AI
                  call, screen recording as backup
                  腳本化流程、預先建立的帳號、現場 AI 呼叫失敗的備援方案、螢幕錄影備份
Verification:     full dry run on the actual demo phone and network
                  在實際展示用的手機與網路上完整彩排
Done when:        the run-of-show has been executed start to finish twice
                  流程腳本已從頭到尾執行兩次
```

---

## 6. Verification matrix｜驗證矩陣

| Area｜範圍 | Required verification｜必要驗證 |
| --- | --- |
| Submission endpoint (P-003)｜提交端點 | Vitest, one test per rejection path. A green build is not evidence — each rejection is asserted separately｜Vitest，每條拒絕路徑一個測試。build 通過不算證據，每條拒絕都要單獨斷言 |
| Prompt (P-004)｜提示詞 | Human rubric, 3 runs × 2 assistants. Rubric: nine fields present · zero verbatim excerpts · every claim specific not broad (R2.3) · history_scope names both sides · one consolidated question｜人工評分準則，3 次 × 2 個助理。準則：九欄位齊全 · 零逐字引用 · 每項描述具體而非廣泛（R2.3）· history_scope 兩面俱陳 · 僅一個整合式問題 |
| Matching (P-007)｜配對 | Vitest over seed data, asserting both a positive pair and the R5.3 negative pair｜以種子資料執行 Vitest，同時斷言正例與 R5.3 反例 |
| UI steps (P-005, P-006, P-008, P-009, P-011)｜UI 步驟 | Manual pass on a real phone at 375px against the named acceptance criteria, criterion by criterion｜在真實手機 375px 上，逐條對照指名的驗收標準人工驗收 |
| Invitations (P-010)｜邀請 | Vitest on the state machine, including simultaneous invite｜以 Vitest 測試狀態機，含同時邀請 |
| Every task｜所有任務 | The gate command in § 2, exit code read directly｜§ 2 的檢查關卡指令，直接讀取結束碼 |

### What counts as evidence｜什麼才算證據

- A route is not verified until it has been requested over HTTP. A green build proves
  generation, not reachability.
  路由未經 HTTP 實際請求就不算已驗證。build 通過只證明產生成功，不證明可存取。
- Read a command's **exit status**, not the tail of its output.
  讀取指令的 **結束狀態碼**，而不是輸出的尾巴。
- A width claim is measured in device emulation or on a real phone, never a resized
  desktop window.
  寬度相關的宣稱，必須以裝置模擬或真實手機量測，絕不用縮小的桌面視窗。
- A verifier that has never been observed to fail is not evidence — break the condition
  once and confirm the check catches it. This applies especially to the P-003 rejection
  tests: send a payload that *should* pass and confirm it does.
  從未見過失敗的驗證器不算證據；刻意破壞條件一次，確認檢查會抓到。這對 P-003 的拒絕
  測試尤其重要：送出一份 *應該* 通過的 payload，確認它確實通過。
- An empty response can pass a check vacuously — assert shape and size, not just
  absence of error.
  空回應可能讓檢查空洞地通過；要斷言形狀與大小，而不只是「沒有錯誤」。

---

## 7. Completion audit｜完成度稽核

The agent that builds a feature is not a reliable judge of whether it is finished. After
each milestone, run this as a **separate pass** (P-012):

建造功能的 agent 無法可靠判斷它是否完成。每個里程碑後，將以下內容作為 **獨立的一次
檢查** 執行（P-012）：

> Assume the implementation is incomplete. Compare each acceptance criterion in
> docs/product-brief.md against the repository and provide evidence that it is
> satisfied. Any criterion without evidence is incomplete.
>
> 假設實作是不完整的。將 docs/product-brief.md 中的每條驗收標準與儲存庫逐一比對，
> 並提出滿足該標準的證據。任何沒有證據的標準即視為未完成。

Gaps become new work-queue items and the cycle repeats until none turn up.

缺口成為新的工作佇列項目，循環持續進行，直到不再出現缺口。

---

## 8. Remaining sequence｜剩餘順序

Priority order, not a schedule. An item leaves this list when it lands.

這是優先順序，不是時程表。項目完成後即從此清單移除。

1. P-001, P-002 (SD) — unblocks everyone｜解除所有人的阻塞
2. P-004 (PM) — can run fully in parallel; needs no code｜可完全並行，不需程式碼
3. P-003 (SD), then P-005 + P-006 (JD)
4. P-007 (SD), then P-008 + P-009 (JD)
5. P-010 (SD), P-011 (JD)
6. P-012 (PM) audit｜稽核, P-013 (PP) demo｜展示

P-013 starts as soon as P-005 and P-009 exist — do not leave the demo to the last hour.

P-005 與 P-009 一存在就啟動 P-013；不要把展示留到最後一小時。

---

## 9. Brief → implementation traceability｜規格與實作對照

So every requirement's coverage can be checked without re-reading the brief.

讓每項需求的覆蓋情況都能被檢查，而不必重讀整份規格。

| Brief requirement｜規格需求 | Implementation｜實作 | Verification｜驗證 |
| --- | --- | --- |
| R1.1, R1.3, R1.4 | P-005 | Manual, matrix row "UI steps"｜人工，矩陣「UI 步驟」列 |
| R1.2, R2.*, R3.1–R3.5 | P-004, `lib/prompt.ts` | Human rubric, matrix row "Prompt"｜人工準則，矩陣「提示詞」列 |
| R1.5, R3.6, R4.1–R4.4 | P-003, `app/api/submit_owner_pitch/` | Vitest, matrix row "Submission endpoint"｜Vitest，矩陣「提交端點」列 |
| R4.5 | P-006 | Manual + row comparison｜人工加資料列比對 |
| R4.6 | P-008 | Manual, criterion by criterion｜人工，逐條檢查 |
| R4.7 | P-003 (`status`) + P-007 (query filter)｜查詢篩選 | Vitest over seed data｜以種子資料執行 Vitest |
| R5.1, R5.3, R5.5, R5.6 | P-007, `lib/matching.ts` | Vitest, matrix row "Matching"｜Vitest，矩陣「配對」列 |
| R5.2, R5.4 | P-009 | Manual｜人工 |
| R6.1, R6.2 | P-011 | Manual｜人工 |
| R6.3, R6.4 | P-010 | Vitest, matrix row "Invitations"｜Vitest，矩陣「邀請」列 |
| R6.5 | P-009 | Manual｜人工 |
