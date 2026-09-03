# PitchYourOwner — Product Brief & PRD｜產品規格

_Last updated｜最後更新: 2026-09-03_
_Role｜角色: what must be delivered, and the criteria for calling it done · governed by
[`constitution.md`](constitution.md)_
_必須交付什麼，以及判定完成的標準 · 受 [`constitution.md`](constitution.md) 規範_

> **This document is the spec the team builds against.** The original, untouched product
> memo lives at [`/README.md`](../README.md) and is frozen — it is the north star. The
> visual and interaction source of truth is
> [`/PitchYourOwner App (offline).html`](../PitchYourOwner%20App%20(offline).html), described in
> [`design.md`](design.md).
>
> **本文件是團隊的執行規格。** 原始且未經修改的產品備忘錄保存於
> [`/README.md`](../README.md)，已凍結，是北極星。視覺與互動的事實來源是上述 HTML，
> 說明見 [`design.md`](design.md)。

**Implementation is deliberately out of scope.** This document states *what must be
true for the user*, never how it is built. No framework, database, hosting, API, or
infrastructure decision belongs here or in any other document right now.

**實作細節刻意不在範圍內。** 本文件只陳述 *對使用者而言必須成立什麼*，絕不說明如何建造。
框架、資料庫、託管、API 與基礎設施決策目前都不屬於本文件或任何其他文件。

**Language note:** where English and Chinese differ, the **English is authoritative**.

**語言說明：** 中英文有出入時 **以英文為準**。

---

## 0. Problem, users, outcome｜問題、使用者、成果

- **Problem:** Conventional profiles reduce people to job titles, schools, and broad
  interest labels. Two people both tagged "photography" may be pursuing entirely
  different questions. Labels categorize; they don't reveal what someone repeatedly
  studies, what they're trying to solve, or why it matters to them.
  **問題：** 傳統個人檔案將人壓縮成職稱、學校與廣泛興趣標籤。兩個同樣標記「攝影」的人，
  關心的問題可能完全不同。標籤只能分類，無法呈現一個人反覆研究什麼、正在解決什麼。

- **Users:** People who already use ChatGPT / Claude / Gemini as a thinking partner and
  have accumulated real conversation history. For the MVP: 10–30 pre-recruited AI users
  across several distinct interest areas.
  **使用者：** 已將 ChatGPT／Claude／Gemini 當作思考夥伴、並累積真實對話紀錄的人。
  MVP 階段：10–30 位橫跨數個不同興趣領域、預先招募的使用者。

- **Desired outcome:** A user hands one prompt to their own AI, confirms once, and
  receives a small number of explainable friend matches grounded in specific shared
  attention.
  **期望成果：** 使用者將一段提示詞交給自己的 AI、確認一次，就能得到少量可解釋、
  且建立在具體共同關注上的朋友配對。

- **The proposition under test:** An AI-generated, owner-approved pitch produces a
  friend match that feels *more relevant* than a conventional self-written profile.
  **待驗證的命題：** 由 AI 產生、owner 核准的介紹，能產生比自寫檔案 *更相關* 的配對。

### Product question｜產品核心問題

> Can an AI agent describe its owner well enough to identify a relevant friend?
> AI Agent 能否準確介紹自己的 owner，並找出一位真正相關的朋友？

### Durable principles｜長期原則

1. **The agent prepares; the owner publishes.**｜**Agent 準備內容；owner 決定發布。**
2. **Relevance comes from shared depth**, not broad labels.｜**相關性來自共享的深度。**
3. **Review is consolidated and explicit.** One confirmation question, one answer.
   Silence, ambiguity, or edits without explicit confirmation do not authorize
   publication.｜**審核集中且需明確同意。** 未回覆、回覆不明確或僅修改而未確認，
   都不構成發布授權。
4. **Data access is narrow by design.** Short-lived, single-use, write-only, draft-only.
   **資料存取權限依設計最小化。** 短期、一次性、僅可寫入、僅能建立草稿。
5. **Introductions require mutual consent.**｜**引介需要雙方同意。**

---

## 1. User journey｜使用者旅程

The whole product is one loop, seven steps. Screen `1a` in the HTML walks it.

整個產品是一個七步的循環。HTML 中的畫面 `1a` 可完整走過一遍。

```
START ──► PICK AI ──► HANDOFF ──► REVIEW ──► PUBLISHED ──► MATCHES ──► MATCH DETAIL
開始      選擇 AI     交接        審核       已發布        配對        配對詳情
                                    │
                          the consent moment
                              同意的那一刻
```

| # | Step｜步驟 | User does｜使用者做什麼 | Product does｜產品做什麼 | Screen |
| --- | --- | --- | --- | --- |
| 1 | Start｜開始 | Reads the promise, taps **Let my agent pitch me**｜閱讀承諾並點擊主要按鈕 | States the promise, the privacy fact, and ~3 min｜陳述承諾、隱私事實與預估時間 | `1b` |
| 2 | Pick AI｜選擇 AI | Picks ChatGPT, Claude, or another assistant｜選擇助理 | Opens an upload session, notes which assistants can submit directly｜開啟上傳工作階段 | `1a` step 2 |
| 3 | Handoff｜交接 | Copies the prompt, opens their assistant｜複製提示詞並開啟助理 | Shows the literal prompt and the session expiry｜顯示提示詞原文與到期時間 | `1d` |
| 4 | Review｜審核 | Reviews every field, edits, **confirms once**｜審核每個欄位、修改、確認一次 | Shows the full proposal and what was removed; holds the publish action｜顯示完整提案與已移除內容，並掌握發布操作 | `1j`, `2a`, `2b` |
| 5 | Published｜已發布 | Sees confirmation｜看到確認 | Publishes and starts matching｜發布並開始配對 | `1a` step 5 |
| 6 | Matches｜配對 | Reads why each match exists｜閱讀每個配對成立的原因 | Shows a small explainable set｜顯示少量可解釋的配對 | `1a` step 6 |
| 7 | Match detail｜配對詳情 | **Invite** or **Not now**｜邀請或暫不 | Answers the three questions｜回答三個問題 | `1h` |

**Entry into the loop happens on the phone; the thinking happens inside the user's own
AI; the result comes back for one consolidated confirmation.** The product never reads a
conversation archive itself.

**流程在手機上啟動，思考在使用者自己的 AI 中發生，結果回到 App 進行一次整合式確認。**
產品本身絕不讀取對話資料庫。

### Information architecture｜資訊架構

Four areas, four tabs, always visible after publication.

四個區域、四個分頁，發布後恆常可見。

| Area｜區域 | Purpose｜用途 | Screen |
| --- | --- | --- |
| **Matches**｜**配對** | Explainable strong matches｜可解釋的強配對 | `1a` step 6, `1h` |
| **Invitations**｜**邀請** | Incoming and outgoing, mutual consent｜收到與送出，雙方同意 | `1k` |
| **My Pitch**｜**我的介紹** | Approved profile, scope, confidence, refresh｜已核准的檔案 | `1f` |
| **Settings**｜**設定** | Visibility, data, export, deletion｜可見性、資料、匯出、刪除 | `1l` |

---

## 2. Product requirements｜產品需求

Six steps, mapping 1:1 to the six MVP capabilities in the north star.

六個步驟，與北極星文件的六項 MVP 能力一對一對應。

---

### Step 1 — Start and prompt handoff｜開始與提示詞交接

Screens: `1b` (start), `1a` step 2 (pick AI), `1d` (handoff).

The product must｜產品必須:

- Open on the promise — **"Your agent knows you. Let it pitch you."｜你的 Agent 了解你，
  讓它來介紹你。** — with the supported assistants, an estimated time (~3 min), and the
  privacy fact **"Raw chats are not uploaded · 不上傳原始對話"** stated as a fact, not a
  footnote.
  以產品承諾開場，並陳述支援的助理、預估時間與隱私事實；隱私是事實陳述，不是註腳。
- Let the user choose their assistant, and say plainly which can submit directly and
  which need the copy-and-paste fallback.
  讓使用者選擇助理，並明確說明哪些可直接提交、哪些需要複製貼上的備援路徑。
- Open a time-limited upload session when the user starts, and show when it expires.
  使用者開始時建立有時限的上傳工作階段，並顯示到期時間。
- Show the literal prompt text, with a one-tap copy and a way to open the assistant.
  顯示提示詞原文，並提供一鍵複製與開啟助理的方式。
- Show progress as four named steps: **PROMPT → ASK AI → CONFIRM → READY**.
  以四個具名步驟顯示進度。
- State on this screen that the upload session is single-use and write-only — it can
  create one draft and cannot read the user's profile.
  在此畫面說明上傳工作階段為一次性且僅可寫入：只能建立一份草稿，無法讀取使用者檔案。

#### Acceptance criteria｜驗收標準

- **R1.1** — Given a user on the start screen, when they begin, then a time-limited
  single-use upload session exists and the user can see when it expires.
  當使用者開始時，應存在有時限、一次性的上傳工作階段，且使用者看得到到期時間。
- **R1.2** — Given the generated prompt, when it is read, then it instructs the assistant
  to analyze **only authorized and accessible** history, to flag or generalize sensitive
  details, to show every field and ask once for CONFIRM / CANCEL / CONFIRM AFTER EDITS,
  and to exclude raw conversation text.
  閱讀提示詞時，它必須要求助理只分析已授權且可存取的紀錄、標記或概括化敏感資訊、
  顯示所有欄位並只詢問一次確認，且排除原始對話文字。
- **R1.3** — Given the handoff screen, when the user copies, then the full prompt is on
  the clipboard and the control confirms it (`Copy` → `Copied ✓`).
  在交接頁複製時，完整提示詞應進入剪貼簿，且控制項顯示確認狀態。
- **R1.4** — Given the start and handoff screens, when they render, then the privacy fact
  and the session expiry are both visible without scrolling.
  開始頁與交接頁渲染時，隱私事實與到期時間都必須不需捲動即可見。
- **R1.5** (negative｜反例) — Given an expired session, when the user returns, then the
  expired state is stated plainly with a one-tap way to start a new session, and no
  profile is created.
  當工作階段過期後使用者返回時，應明確顯示過期狀態並提供一鍵重新開始，且不建立檔案。

---

### Step 2 — Structured owner-pitch generation｜結構化 owner pitch 產生

Executed inside the user's own AI. What the product owns is **the prompt** and **the
shape of what comes back**. Getting this prompt right is product work, not copy — it is
the highest-leverage artifact in the project.

在使用者自己的 AI 中執行。產品負責的是 **提示詞** 與 **回傳內容的結構**。
把提示詞做對是產品工作，不是文案工作，它是專案中槓桿最高的產出物。

The proposal must carry these fields｜提案必須包含以下欄位:

| Field｜欄位 | Meaning｜意義 |
| --- | --- |
| Summary｜摘要 | a short owner pitch｜簡短的 owner 介紹 |
| Interests｜興趣 | specific interests｜具體興趣 |
| Motivations｜動機 | why these topics matter now｜目前重視這些主題的原因 |
| Active problems｜當前問題 | problems being addressed｜正在處理的問題 |
| Recurring topics｜反覆主題 | repeatedly discussed questions｜反覆討論的問題 |
| Friend intent｜交友意圖 | the desired friend or conversation｜希望認識的對象 |
| History scope｜歷史範圍 | what context was and was not available｜可用與不可用的範圍 |
| Confidence｜信心程度 | confidence per field｜每個欄位的信心程度 |
| Removed sensitive data｜已移除的敏感資料 | what was removed or generalized｜已移除或概括化的內容 |

When the assistant lacks adequate context it must **say so** and fall back to selected
chats or a user-provided export — never invent a profile, never force a multi-round
interview.

當助理缺乏足夠脈絡時，必須 **明確說明**，並改用指定對話或使用者提供的匯出資料；
絕不虛構檔案，也絕不強迫進入多輪訪談。

#### Acceptance criteria｜驗收標準

- **R2.1** — Given the prompt run against an assistant with usable history, when it
  completes, then all nine fields come back.
  對有可用紀錄的助理執行提示詞，完成時九個欄位都必須回傳。
- **R2.2** — Given any returned proposal, when it is read, then it contains no raw
  conversation content and no verbatim excerpts.
  閱讀任何回傳的提案時，不得含有原始對話內容或逐字引用。
- **R2.3** — Given interests, motivations, active problems, and recurring topics, when
  read, then each entry is a specific claim, not a broad label — "low-light portraiture"
  passes; "photography" does not.
  這四個欄位的每一項都必須是具體描述而非廣泛標籤。
- **R2.4** — Given history scope, when read, then it names both what was available and
  what was not (e.g. "ChatGPT chats · 6 mo READ / Voice chats NOT AVAILABLE").
  歷史範圍必須同時指出哪些可用、哪些不可用。
- **R2.5** (negative｜反例) — Given an assistant with no accessible history, when the
  prompt is run, then it states the limitation and asks for selected chats or an export
  rather than producing a profile.
  當助理沒有可存取的紀錄時，應說明限制並要求指定對話或匯出資料，而非產出檔案。

_Verified by human judgement against a fixed rubric — see [`plan.md`](plan.md) § 4._

_以固定評分準則的人工判斷驗證，見 [`plan.md`](plan.md) § 4。_

---

### Step 3 — Sensitive-data check and one consolidated confirmation｜敏感資料檢查與整合式確認

**This is the consent moment, and it is the product.** It gets the loudest typography in
the app (`design.md` § 1). Screen `1j`.

**這是同意的那一刻，也就是產品本身。** 它使用全 App 最強烈的字級（`design.md` § 1）。

The product must｜產品必須:

- Have the assistant flag or generalize, **before** asking for approval: names,
  credentials, private repositories, exact locations, customer details, confidential
  relationships, internal metrics, health information, and proprietary identifiers.
  在請求核准 **之前** 標記或概括化上述各類敏感資訊。
- Show what was removed, as `original → generalized` pairs — e.g. "Studio client names →
  'a returning client'", "Exact home neighbourhood → 'Taipei'", "Private repo name →
  omitted" — with a count: **SENSITIVE DATA · 3 ITEMS REMOVED**.
  以「原值 → 概括化後」成對顯示已移除的內容，並附上數量。
- Ask exactly **one** consolidated question, headed **"Does this describe you?｜這是否
  準確描述你？"**, with every field visible and editable:
  提出恰好 **一個** 整合式問題，並讓每個欄位都可見且可編輯：

  > Review every field, then reply once with **CONFIRM**, **CANCEL**, or list all edits
  > in one message and end with **CONFIRM AFTER EDITS**.
  >
  > 請審核每個欄位，並只回覆一次：**CONFIRM**、**CANCEL**，或在同一則訊息列出所有修改，
  > 最後加上 **CONFIRM AFTER EDITS**。

- State that editing any field re-opens the review, and that **nothing publishes until
  the owner confirms**.
  說明修改任何欄位都會重新開啟審核，且 **在 owner 確認前不會發布任何內容**。
- Offer exactly two actions: **Cancel** and **Confirm & publish｜確認並發布**.
  只提供兩個操作。

#### Acceptance criteria｜驗收標準

- **R3.1** — Given a proposal containing a person's full name, an exact address, or an
  employer-internal metric, when the review is shown, then that item appears in the
  removed/generalized list and not in the profile body.
  當提案含有全名、精確地址或雇主內部指標時，該項應出現在已移除清單，而不在檔案內容中。
- **R3.2** — Given the review, when it is shown, then it asks exactly one question, shows
  every field, and shows the count of removed items.
  審核呈現時，必須恰好問一個問題、顯示每個欄位，並顯示已移除項目的數量。
- **R3.3** — Given an explicit confirmation, when the user confirms, then and only then
  is the profile published.
  只有在使用者明確確認時，檔案才會被發布。
- **R3.4** (negative｜反例) — Given edits listed without an explicit confirmation, then
  nothing publishes and the review is re-presented.
  當只列出修改而未明確確認時，不得發布，且必須重新呈現審核。
- **R3.5** (negative｜反例) — Given a cancel, silence, or an ambiguous response, then
  nothing publishes.｜遇到取消、未回覆或模糊回應時，不得發布。
- **R3.6** — Given any attempt to publish that does not carry the owner's explicit
  confirmation, then it is refused and no profile is created.
  任何未帶有 owner 明確確認的發布嘗試，都必須被拒絕且不建立檔案。

---

### Step 4 — Publication and My Pitch｜發布與我的介紹頁

**Same consent standard, two transports.** Both land on the same published state, and
**neither is a silent write** — nothing goes live without the owner acting in the app.
Screens `2a` and `2b`.

**相同的同意標準，兩種傳輸方式。** 兩者最終抵達相同的已發布狀態，且 **都不是無聲寫入**：
未經 owner 在 App 中操作，任何內容都不會上線。

#### Transport A — Owner uploads (`2a`)｜owner 自行帶回

The agent hands its result back and the owner carries it in. **The app owns the review
and holds the publish button.** This path must work on any phone, with any assistant, and
with no integration whatsoever.

Agent 將結果交回，由 owner 帶進 App。**審核與發布按鈕都由 App 掌握。**
此路徑必須在任何手機、任何助理、完全沒有整合的情況下都可用。

Three ways in｜三種帶回方式: **paste from clipboard** (fastest｜最快) · **the share
sheet** from the AI app｜從 AI App 分享 · **scan the session QR** for desktop → phone｜
掃描工作階段 QR 以完成桌機到手機的傳遞.

On arrival the app shows what it received, that it validates, and — stated explicitly —
**RAW CONVERSATION TEXT · NONE FOUND**.

收到後，App 會顯示收到什麼、是否通過驗證，並明確標示 **未發現原始對話文字**。

#### Transport B — Agent posts (`2b`)｜Agent 直接提交

The confirmation already happened inside the AI. The app's job is therefore to **prove
what arrived** and let the owner discard it before it goes live — **never a silent
write**.

確認已在 AI 中完成，因此 App 的職責是 **證明收到了什麼**，並讓 owner 在上線前丟棄它：
**絕不是無聲寫入**。

The receipt shows: owner confirmed, the number of fields, that sensitive items were
omitted and how many, that raw conversation content is absent, and that the upload
authority is now spent and was write-only. The draft is labelled **DRAFT · NOT LIVE
YET**, with two actions: **Discard** and **Publish this draft**.

收據會顯示：owner 已確認、欄位數量、已省略的敏感項目與數量、不含原始對話內容，
以及上傳權限已用盡且僅可寫入。草稿標示為 **尚未上線**，並提供丟棄與發布兩個操作。

On publication the user sees a confirmation — **"Pitch ready. Matching started.｜你的
Agent 已完成介紹。審核完成，配對已開始。"** — with three counts: fields published,
items removed, and **0 raw chats**.

發布後使用者會看到確認訊息，以及三個數字：已發布欄位數、已移除項目數，以及 **0 筆原始對話**。

**My Pitch** (`1f`) shows the approved profile as a document: Summary, Interests,
Motivations, Active Problems, Recurring Topics, Friend Intent — each with a confidence
label as a **word** (`HIGH` / `MEDIUM` / `LOW`), never a score. It states the history
scope and offers **Refresh my pitch**.

**我的介紹頁**（`1f`）以文件形式呈現已核准的檔案，每個欄位附上文字形式的信心標籤，
絕不使用分數。它會說明歷史範圍，並提供重新產生介紹的操作。

#### Acceptance criteria｜驗收標準

- **R4.1** — Given an explicitly confirmed proposal and a valid session, when it is
  submitted, then one profile is created and the session can no longer be used.
  當提案已明確確認且工作階段有效時，提交後應建立一份檔案，且該工作階段不能再使用。
- **R4.2** — Given a session that has already been used, when it is submitted again, then
  it is refused and no second profile is created.
  當工作階段已被使用後再次提交，應被拒絕且不建立第二份檔案。
- **R4.3** — Given a submission containing raw conversation content, unexpected content,
  or an implausibly large amount of data, then it is refused with a specific reason and
  nothing is saved.
  當提交含有原始對話內容、非預期內容或不合理的大量資料時，應以明確理由拒絕且不儲存。
- **R4.4** — Given the authority granted for one submission, when it is used to attempt
  anything other than creating that one draft — reading a profile, listing users,
  changing settings — then every such attempt fails.
  為單次提交所授予的權限，若被用於建立該草稿以外的任何行為，都必須失敗。
- **R4.5** — Given a confirmed result brought back through Transport A, when the user
  publishes, then the resulting profile is equivalent to what Transport B would have
  produced, and the app's own review was shown first.
  透過路徑 A 帶回的已確認結果，發布後產生的檔案應與路徑 B 等價，且事前顯示過 App 的審核。
- **R4.8** — Given Transport A, when a result arrives, then the app states what it
  received, that it validates, and that no raw conversation text was found — before any
  publish action is available.
  在路徑 A 中，結果抵達時 App 必須先說明收到什麼、是否通過驗證、且未發現原始對話文字，
  然後才提供發布操作。
- **R4.9** — Given Transport B, when the agent has posted, then the profile is held as a
  draft that is **not live**, a receipt is shown, and **Discard** is offered alongside
  **Publish**. A submission never publishes itself.
  在路徑 B 中，Agent 提交後檔案應保持為 **尚未上線** 的草稿，顯示收據，並同時提供
  丟棄與發布。提交本身絕不會自動發布。
- **R4.10** — Given Transport A, when the user has no clipboard access, then the share
  sheet and the session QR remain as working alternatives.
  在路徑 A 中，若使用者無法使用剪貼簿，分享選單與工作階段 QR 仍必須可用。
- **R4.6** — Given a published profile, when My Pitch renders, then all six field groups,
  the history scope, and a word-form confidence label per group are shown, and the
  profile is stamped **conversation-derived · owner-approved**.
  已發布的檔案在我的介紹頁渲染時，應顯示六個欄位群組、歷史範圍與每組的文字信心標籤，
  並標示為由對話衍生且經 owner 核准。
- **R4.7** — Given a proposal that was never confirmed, when matching runs, then it is
  not matchable and is not visible to any other user.
  從未被確認的提案不可配對，且對任何其他使用者不可見。

---

### Step 5 — Explainable friend matching｜可解釋的朋友配對

Screens: `1a` step 6 (list), `1h` (detail).

The product must｜產品必須:

- Understand each profile along the ladder **domain → specific interest → motivation →
  active problem → recurring question**.
  以 **領域 → 具體興趣 → 動機 → 當前問題 → 反覆問題** 的階梯理解每份檔案。
- Weight relevance｜相關性權重: 30% specific-interest overlap｜具體興趣重疊,
  25% active-problem overlap｜當前問題重疊, 20% motivation alignment｜動機一致,
  15% recurring-topic overlap｜反覆主題重疊, 10% friend intent and practical
  compatibility｜交友意圖與實際相容性.
- Treat language, safety, age, visibility, location preference, and availability as
  **filters only** — they never contribute to relevance.
  將語言、安全、年齡、可見性、地點偏好與時間可用性視為 **僅供篩選**，絕不納入相關性。
- Show a small set — the demo shows two — each labelled with the *kind* of overlap
  (`SHARED INTEREST`, `SAME PROBLEM`, `SAME MOTIVATION`) and a plain sentence naming it.
  只顯示少量配對，每則標示重疊的 *類型* 並以一句話說明。
- Answer three questions on the detail screen｜在詳情頁回答三個問題:
  1. What do we both care about?｜我們共同關心什麼？
  2. Same reason, right now?｜我們因什麼相同動機而行動？
  3. What could we discuss today?｜我們現在可以聊什麼？
- State on the list screen: **"No feed, no scores, no rankings.｜沒有動態牆、分數或排行。"**
  在列表畫面明示這一點。

#### Acceptance criteria｜驗收標準

- **R5.1** — Given two profiles sharing a specific interest, motivation, problem, or
  recurring topic, when matching runs, then they appear in each other's set, ordered by
  the weights above.
  當兩份檔案共享具體的興趣、動機、問題或反覆主題時，應互相出現在對方的集合中，
  並依上述權重排序。
- **R5.2** — Given any surfaced match, when the detail screen renders, then it names the
  concrete shared items and answers all three questions.
  任何被呈現的配對，詳情頁都必須指出具體的共享項目並回答三個問題。
- **R5.3** (negative｜反例) — Given a pair whose only commonality is a broad domain label,
  then no match is surfaced.
  當唯一的共同點只是廣泛領域標籤時，不得呈現配對。
- **R5.4** — Given any match screen, when it renders, then no score, follower count, or
  ranking is shown.｜任何配對畫面渲染時，都不得顯示分數、追蹤者數量或排行。
- **R5.5** — Given a filter mismatch, then the pair is excluded regardless of overlap.
  當篩選條件不符時，無論重疊程度都必須排除。
- **R5.6** — Given a match explanation, when it renders, then it contains no raw
  conversation content, and the match carries the stamp **conversation-derived ·
  owner-approved · not verified**.
  配對解釋不得含有原始對話內容，且必須帶有上述來源標記。

---

### Step 6 — Notification and mutual invitation｜通知與雙向邀請

Screens: `1k` (invitations), `1m` (lock screen).

The product must｜產品必須:

- Notify on **Pitch ready · matching started** and **Your agent found another owner**.
  在介紹完成與找到配對時發出通知。
- Keep lock-screen text deliberately general — "One specific overlap. Open to see why.｜
  找到一個具體的共同關注" — with topics and explanations appearing **only after the user
  opens the app**.
  鎖定畫面文字刻意概括；主題與解釋 **只在使用者開啟 App 後** 顯示。
- Let either owner invite. The recipient chooses **Accept** or **Not now**. An
  introduction happens only on mutual consent, stated on screen as
  **需雙方同意才會引介**.
  任一 owner 都可邀請；接收者選擇接受或暫不；只有雙方同意才形成引介，並在畫面上明示。
- Show incoming and outgoing invitations separately, with outgoing states such as
  `SENT · 2D` and `NO ANSWER`.
  分別顯示收到與送出的邀請，並顯示送出狀態。
- On acceptance, give **both sides the same suggested opening question — and nothing
  else is shared**.
  接受後，**雙方收到相同的建議開場問題，且不分享其他任何內容**。
- **A decline is private — the sender never sees the reason.｜拒絕的理由不會傳給對方。**

#### Acceptance criteria｜驗收標準

- **R6.1** — Given a published pitch, when matching completes, then the user is notified.
  介紹發布且配對完成後，使用者應收到通知。
- **R6.2** — Given a strong match, when the notification appears on a locked screen, then
  it names no interest, topic, or person's detail; the explanation appears only in-app.
  強配對通知在鎖定畫面出現時，不得提及任何興趣、主題或個人細節。
- **R6.3** — Given an invitation, when the recipient accepts, then and only then do both
  sides see the introduction and the same suggested opening question.
  只有在接收者接受時，雙方才會看到引介與相同的建議開場問題。
- **R6.4** (negative｜反例) — Given **Not now**, then the sender sees only that it was not
  accepted, with no reason, and cannot immediately re-send.
  選擇暫不時，發送者只會看到未被接受、沒有理由，且不能立即重送。
- **R6.5** — Given any match or invitation screen, then **Invite / Accept** and **Not
  now** are the only actions offered.
  任何配對或邀請畫面，都只提供這兩個操作。

---

## 3. Landing surface｜進入介面

**The start screen is the product's landing surface** (`1b`, alternate `1c`). It must
carry the whole argument before any interaction:

**開始頁就是產品的進入介面**（`1b`，備選 `1c`）。它必須在任何互動前承載完整論點：

| Element｜元素 | Content｜內容 |
| --- | --- |
| Promise｜承諾 | **Your agent knows you. Let it pitch you.｜你的 Agent 了解你，讓它來介紹你。** |
| Sub-promise｜次要承諾 | Meet someone who cares about the same thing, for the same reason, right now.｜認識一位此刻因相同理由，關心相同事情的人。 |
| Trust fact｜信任事實 | Raw chats are not uploaded · 不上傳原始對話 |
| Primary CTA｜主要行動 | **Let my agent pitch me** + `~3 MIN` |
| Supporting｜輔助 | Works with ChatGPT, Claude, Gemini |

The alternate (`1c`) opens in the agent's own voice and answers the trust question with
two numbers — **1** review and confirm, **0** raw chats uploaded — before it is asked.

備選版本（`1c`）以 Agent 的口吻開場，並在信任問題被提出前就用兩個數字回答它。

> **Open question for the PM:** the HTML covers the *app*. If a separate marketing
> landing page (a public web page describing the product) is also wanted, it is not in
> the HTML and needs a decision. The content above is what it would be built from.
>
> **待 PM 決定：** HTML 涵蓋的是 *App*。若另外需要一個對外的行銷網頁，它不在 HTML 中，
> 需要決策。上表即為建置該頁的內容基礎。

---

## 4. User states and empty states｜使用者狀態與空狀態

| State｜狀態 | Required behaviour｜必要行為 |
| --- | --- |
| Never started｜尚未開始 | Start screen with the full promise｜完整承諾的開始頁 |
| Session open, no result yet｜工作階段開啟但無結果 | Handoff screen with expiry and the paste fallback offered｜顯示到期時間並提供貼上備援 |
| Session expired｜工作階段過期 | Plainly stated, one tap to restart｜明確說明並一鍵重啟 |
| Result returned, not confirmed｜已回傳但未確認 | Review screen; nothing published｜審核畫面；不發布任何內容 |
| Published, matching running｜已發布、配對進行中 | Confirmation with counts; matching in progress｜確認畫面與數字；配對進行中 |
| Published, no matches yet｜已發布但尚無配對 | Honest empty state — no filler, no padded matches｜誠實的空狀態，不填充、不湊數 |
| Invitation sent｜已送出邀請 | "Ren decides next" — sender waits, sees no reason if declined｜發送者等待，被拒時看不到理由 |
| Invitation accepted｜邀請已接受 | Both sides get the same opening question｜雙方收到相同開場問題 |
| Profile deleted｜檔案已刪除 | Leaves all match sets immediately, including already-surfaced ones｜立即從所有配對集合移除 |

---

## 5. Should-haves｜次要需求

- The alternate variants `1c`, `1e`, `1g`, `1i` as fallbacks if a chosen screen is not
  landing.｜當選定畫面效果不佳時，改用備選版本。
- Refresh / re-pitch flow on My Pitch.｜我的介紹頁的重新產生流程。
- A failed-validation state for Transport A.｜路徑 A 的驗證失敗狀態。
- More than two matches per user in the demo set.｜展示中每位使用者超過兩個配對。
- An Android variant of the start screen.｜開始頁的 Android 版本。
- Empty state for Matches while matching is still running.｜配對進行中的空狀態。

---

## 6. Explicitly out of scope｜明確不做的範圍

- **Implementation, infrastructure, and stack decisions of any kind.** Not deferred to a
  later section of these docs — simply not being decided yet.
  **任何實作、基礎設施與技術堆疊決策。** 不是延後到本文件的其他章節，而是現階段根本不做決定。
- **Swipe decks, infinite feeds, or any engagement loop.**｜滑動卡片、無限動態牆或互動誘導循環。
- **Public scores, follower counts, popularity rankings.**｜公開分數、追蹤者數量、人氣排行。
- **Recruiting, professional networking, follower growth, time-in-app** as objectives.
  將招募、職業人脈、追蹤者成長或使用時長作為目標。
- **Any storage, logging, or forwarding of raw conversation content.**
  對原始對話內容的任何儲存、記錄或轉發。
- **Reading the user's chat history ourselves.**｜由我們自行讀取使用者的對話紀錄。
- **Multi-round interview flows** when the AI lacks context.｜AI 缺乏脈絡時的多輪訪談。
- **Verifying identity or expertise.** Claims are conversation-derived and
  owner-approved, never proof.｜驗證身分或專業能力。
- **Group matching, events, messaging beyond the introduction.**｜群組配對、活動、
  引介之後的訊息功能。

---

## 7. Constraints｜限制條件

- Completable end to end on a phone at 402×874.｜可在 402×874 的手機上端到端完成。
- Must work for a user whose assistant has **no** integration capability — the
  copy-and-paste fallback is not optional.
  即使助理沒有整合能力也必須可用；複製貼上備援不是選配。
- Raw histories never enter the product; verbatim excerpts excluded by default.
  原始紀錄永不進入產品；逐字引用預設排除。
- Publication authority is short-lived, single-use, write-only, draft-only.
  發布權限為短期、一次性、僅可寫入、僅能建立草稿。
- Users can control visibility, export their profile, block, report, and delete
  everything.｜使用者可控制可見性、匯出檔案、封鎖、檢舉並刪除所有資料。
- Every claim is presented as conversation-derived and owner-approved.
  每項描述都標示為由對話衍生且經 owner 核准。
- Bilingual EN / 繁中 on every user-facing surface, per [`design.md`](design.md) § 8.
  所有使用者可見介面皆為雙語，規則見 [`design.md`](design.md) § 8。

---

## 8. Edge cases｜邊界案例

| Case｜情況 | Required behaviour｜必要行為 |
| --- | --- |
| AI has no accessible history｜AI 無可存取紀錄 | Say so; offer selected chats or an export; never invent｜明說；提供指定對話或匯出；絕不虛構 |
| Session expires mid-flow｜流程中過期 | Plain expired state, one tap to restart｜明確過期狀態並一鍵重啟 |
| Same session used twice｜同一工作階段用兩次 | Second attempt refused; first profile untouched｜第二次被拒；第一份不受影響 |
| Assistant returns a malformed result｜回傳格式錯誤 | Say what is missing; never publish partially｜指出缺什麼；絕不部分發布 |
| User edits then confirms｜先修改再確認 | The edited version publishes, not the original｜發布修改後的版本 |
| No viable matches｜沒有可行配對 | Honest empty state｜誠實的空狀態 |
| Both owners invite simultaneously｜雙方同時邀請 | One introduction, not two｜收斂為一次引介 |
| User deletes everything｜使用者刪除所有資料 | Pitch, matches and invitations go; state plainly that raw chats were never held｜全部移除，並明說我們從未持有原始對話 |

---

## 9. Cross-cutting requirements｜跨面向需求

### Privacy and trust｜隱私與信任

- Privacy is **stated on screen as a fact**, not buried in a policy.
  隱私 **直接在畫面上以事實陳述**，不埋在條款裡。
- The consent state is checked by the product before publishing, never assumed.
  發布前必須由產品確認同意狀態，絕不假設。
- No raw conversation content, credential, or profile body is retained anywhere it is
  not needed.｜任何不需要的地方都不保留原始對話內容、憑證或檔案內容。
- Settings ends on: **"We never held your raw chats, so there is nothing else to
  delete.｜我們從未持有你的原始對話。"**

### Design and consistency｜設計與一致性

- Follow [`design.md`](design.md). One accent, 2px corners, 1px hairlines, mono
  micro-labels.｜遵循設計文件：單一強調色、2px 圓角、1px 細線、等寬微標籤。
- Four areas only: Matches · Invitations · My Pitch · Settings.｜只有四個區域。
- The product should feel like an agent-mediated introduction, not a dating app.
  產品應像由 Agent 協助的引介，而非交友軟體。

### Accessibility and interaction｜無障礙與互動

- Minimum 44×44px touch targets. The 56px primary action bar satisfies this.
  觸控目標最小 44×44px；56px 的主要操作列已滿足。
- Text contrast meets WCAG AA. **Check the muted greys (`#8A8A82`, `#A9A59C`) against
  `#F4F2ED` at small mono sizes — this is the most likely place to fail.**
  文字對比度符合 WCAG AA。**特別檢查弱化灰階在小字級下的對比，這是最可能不合格之處。**
- Every interactive control is reachable and labelled.｜每個互動控制項都可觸及且有標籤。

### Responsive behaviour｜響應式行為

- Designed at 402px. No horizontal scroll, no clipped content down to 320px.
  以 402px 設計。至 320px 都不得有水平捲動或內容被裁切。
- Must be usable one-handed; primary actions sit within thumb reach at the bottom.
  必須可單手操作；主要操作位於底部拇指可及範圍。

---

## 10. Review gates｜審查關卡

Copy review and bilingual polish are **not** completion gates for the screen they touch.
Track them as open items in [`log.md`](log.md).

文案審查與雙語潤飾 **不是** 其所涉畫面的完成關卡；請在 [`log.md`](log.md) 中追蹤。

Two exceptions, both **product requirements**, not copy — changing either needs PM
approval:

兩個例外，皆屬 **產品需求** 而非文案，變更需 PM 核准：

1. The consolidated-confirmation wording in Step 3.｜Step 3 的整合式確認措辭。
2. The privacy fact **"Raw chats are not uploaded · 不上傳原始對話"** and the provenance
   stamp **conversation-derived · owner-approved · not verified**.
   隱私事實與來源標記。

---

## 11. Success metrics｜成功指標

**North star｜北極星指標:** relevant friend matches accepted per confirmed owner pitch.
每份已確認 owner pitch 所產生的相關朋友配對接受數。

| Area｜面向 | Metrics｜指標 |
| --- | --- |
| Pitch quality｜介紹品質 | start→review completion · confirmation rate · fields edited · items removed · user-rated accuracy｜開始到審核完成率 · 確認率 · 被編輯欄位 · 移除項目 · 使用者評估準確度 |
| Handoff quality｜交接品質 | direct submission success · paste-fallback success · median start→ready time · expired session rate｜直接提交成功率 · 貼上備援成功率 · 中位完成時間 · 過期率 |
| Match quality｜配對品質 | notification open rate · invitation send rate · mutual acceptance · conversation started · "would you have found this person otherwise?"｜通知開啟率 · 邀請發送率 · 雙方接受率 · 實際開始對話 |

### Core experiment｜核心實驗

For each participant, build a conventional profile (broad interests + short self-written
bio) and an owner-approved PitchYourOwner profile. Show one blind match from each,
without naming the system, and ask:

為每位參與者建立一份傳統檔案與一份經 owner 核准的檔案。各展示一個盲測配對，
不揭露系統名稱，並詢問：

1. Which person would you rather meet?｜你較想認識哪一位？
2. Does the explanation feel specific to you?｜配對說明是否讓你感覺與自己相關？
3. Would you accept an invitation now?｜你現在會接受邀請嗎？
