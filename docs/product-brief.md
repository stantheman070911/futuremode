# PitchYourOwner — Product Brief & PRD｜產品規格

_Last updated｜最後更新: 2026-09-03_
_Role｜角色: what must be delivered, and the criteria for calling it done · governed by
[`constitution.md`](constitution.md)_
_必須交付什麼，以及判定完成的標準 · 受 [`constitution.md`](constitution.md) 規範_

> **This document is the spec the devs build against.** The original, untouched product
> memo lives at [`/README.md`](../README.md) and is frozen — it is the north star, not
> the work order. Where this document adds detail, it adds it *under* that vision; it
> never contradicts it. If you think it does, raise it with the PM.
>
> **本文件是開發團隊的執行規格。** 原始且未經修改的產品備忘錄保存於
> [`/README.md`](../README.md)，已凍結，是北極星而非工單。本文件只在該願景 *之下*
> 補充細節，絕不與之衝突。若你認為有衝突，請提報 PM。

A requirement stays in this document even after it ships. Nothing here is crossed out
on completion — status lives only in [`log.md`](log.md).

需求即使已交付仍留在本文件中。此處不會因完成而劃掉任何項目；狀態只存在於
[`log.md`](log.md)。

**Language note:** where the English and Chinese differ, the **English is authoritative**
for acceptance criteria — that is the language the tests are written in.

**語言說明：** 當中英文有出入時，驗收標準 **以英文為準**，因為測試是以英文撰寫。

---

## 0. Problem, users, outcome｜問題、使用者、成果

- **Problem:** Conventional profiles reduce people to job titles, schools, and broad
  interest labels. Two people both tagged "photography" may be pursuing entirely
  different questions. Labels categorize; they don't reveal what someone repeatedly
  studies, what they're trying to solve, or why it matters to them.
  **問題：** 傳統個人檔案將人壓縮成職稱、學校與廣泛興趣標籤。兩個同樣標記「攝影」的人，
  關心的問題可能完全不同。標籤只能分類，無法呈現一個人反覆研究什麼、正在解決什麼，
  或某件事對他為何重要。

- **Users:** People who already use ChatGPT/Claude as a thinking partner and have
  accumulated real conversation history. For the MVP: 10–30 pre-recruited AI users
  across several distinct interest areas.
  **使用者：** 已將 ChatGPT／Claude 當作思考夥伴、並累積了真實對話紀錄的人。
  MVP 階段：10–30 位橫跨數個不同興趣領域、預先招募的 AI 使用者。

- **Desired outcome:** A user hands one prompt to their own AI, confirms once, and
  receives a small number of explainable friend matches grounded in specific shared
  attention — an interest, a motivation, an active problem, or a recurring question.
  **期望成果：** 使用者將一段提示詞交給自己的 AI、確認一次，就能得到少量可解釋的朋友
  配對，且這些配對建立在具體的共同關注上：興趣、動機、當前問題或反覆出現的問題。

- **The proposition under test:** An AI-generated, owner-approved pitch produces a
  friend match that feels *more relevant* than a conventional self-written profile.
  **待驗證的命題：** 由 AI 產生、owner 核准的介紹，能產生比傳統自寫檔案 *更相關* 的
  朋友配對。

### Product question｜產品核心問題

> Can an AI agent describe its owner well enough to identify a relevant friend?
> AI Agent 能否準確介紹自己的 owner，並找出一位真正相關的朋友？

### Durable principles｜長期原則

From the north star — do not trade these away for demo speed.

出自北極星文件；不得為了展示速度而交換掉這些原則。

1. **The agent prepares; the owner publishes.** The agent drafts from behaviour-grounded
   patterns; the owner is the final editor and publisher of every field.
   **Agent 準備內容；owner 決定發布。** Agent 依有行為依據的模式草擬，owner 是每個欄位
   的最終編輯者與發布者。
2. **Relevance comes from shared depth**, not from broad labels or complementary skills.
   **相關性來自共享的深度**，而非廣泛標籤或互補技能。
3. **Review is consolidated and explicit.** One confirmation question, one answer.
   Silence, ambiguity, or edits without explicit confirmation do not authorize upload.
   **審核集中且需明確同意。** 一個確認問題、一個回答。未回覆、回覆不明確，或僅提出
   修改而未明確確認，都不構成上傳授權。
4. **Data access is narrow by design.** Short-lived, single-use, write-only, draft-only.
   **資料存取權限依設計最小化。** 短期、一次性、僅可寫入、僅能建立草稿。
5. **Introductions require mutual consent.**｜**引介需要雙方同意。**

---

## 1. Product requirements｜產品需求

Six steps, mapping 1:1 to the six MVP capabilities in the north star. One step per
independently shippable unit of behaviour.

六個步驟，與北極星文件的六項 MVP 能力一對一對應。每個步驟是一個可獨立交付的行為單元。

---

### Step 1 — Phone prompt handoff｜手機提示詞交接

The product must｜產品必須:

- Present the promise, the supported AI assistants, an estimated time, and the
  statement **"Raw chats are not uploaded."｜不會上傳原始對話** before any action.
  在任何操作前，先呈現產品承諾、支援的 AI 助理、預估時間，以及該聲明。
- Create a short-lived upload session on **Let my agent pitch me**, and generate a
  prompt containing that session's one-time identifier.
  點擊 **Let my agent pitch me** 時建立短期上傳工作階段，並產生含有該工作階段一次性
  識別碼的提示詞。
- Let the user get that prompt into their AI assistant by copy, share sheet, or deep
  link, and show the session expiry.
  讓使用者透過複製、分享選單或深層連結，將提示詞送入 AI 助理，並顯示工作階段到期時間。
- Show one clear path: **Create prompt → Ask your AI → Confirm once → Pitch ready**.
  顯示單一明確路徑：**建立提示詞 → 詢問你的 AI → 一次確認 → Pitch ready**。

#### Acceptance criteria｜驗收標準

- **R1.1** — Given a user on the start screen, when they tap **Let my agent pitch me**,
  then a new upload session row exists with a random single-use id, a hashed
  write-only token, and an `expires_at` no more than 30 minutes in the future.
  當使用者在開始頁點擊該按鈕，應產生一筆新的上傳工作階段，含隨機一次性 id、
  已雜湊的僅寫入 token，且 `expires_at` 不超過 30 分鐘後。
- **R1.2** — Given a generated prompt, when it is inspected, then it contains the
  session id and instructs the assistant to analyze **only authorized and accessible**
  history or memory, and to exclude raw conversations and verbatim excerpts.
  檢視產生的提示詞時，應包含 session id，並指示助理 **只分析已授權且可存取的**
  紀錄或記憶，且排除原始對話與逐字引用。
- **R1.3** — Given the handoff screen, when the user taps Copy, then the full prompt is
  on the clipboard and a confirmation is shown; Share opens the OS share sheet.
  在交接頁點擊複製時，完整提示詞應進入剪貼簿並顯示確認；分享則開啟系統分享選單。
- **R1.4** — Given the handoff screen, when it renders, then the session expiry time is
  visible.｜交接頁渲染時，工作階段到期時間必須可見。
- **R1.5** (negative｜反例) — Given a session past `expires_at`, when its token is used,
  then the request is rejected with a distinct expired-session error and nothing is
  written.｜當已過 `expires_at` 的工作階段 token 被使用時，請求應以明確的過期錯誤被拒絕，
  且不寫入任何資料。

---

### Step 2 — Structured owner-pitch generation｜結構化 owner pitch 產生

This step is executed by the user's own AI assistant. What we own is **the prompt** and
**the schema it must produce**. Getting this prompt right is product work, not copy —
it is the highest-leverage artifact in the project.

本步驟由使用者自己的 AI 助理執行。我們負責的是 **提示詞** 與 **它必須產出的結構**。
把提示詞做對是產品工作，不是文案工作，它是專案中槓桿最高的產出物。

The product must specify a prompt that produces exactly one structured proposal with
these fields:

產品必須定義一段提示詞，產出恰好一份含以下欄位的結構化提案：

| Field｜欄位 | Meaning｜意義 |
| --- | --- |
| `summary` | a short owner pitch｜簡短的 owner 介紹 |
| `interests` | specific interests｜具體興趣 |
| `motivations` | why these topics matter now｜目前重視這些主題的原因 |
| `active_problems` | problems being addressed｜正在處理的問題 |
| `recurring_topics` | repeatedly discussed questions｜反覆討論的問題 |
| `friend_intent` | the desired friend or conversation｜希望認識的朋友或對話類型 |
| `history_scope` | what context was and was not available｜可用與不可用的歷史範圍 |
| `confidence` | confidence per claim｜每項描述的信心程度 |
| `omitted_sensitive_data` | whether data was removed or generalized｜是否已移除或概括化敏感內容 |

The prompt must instruct the assistant, when it lacks adequate context, to **disclose
the limitation** and fall back to selected chats or a user-provided export — never to
invent a profile and never to force a multi-round interview.

當助理缺乏足夠脈絡時，提示詞必須要求它 **明確說明限制**，並改用指定對話或使用者提供的
匯出資料；絕不虛構檔案，也絕不強迫進入多輪訪談。

#### Acceptance criteria｜驗收標準

- **R2.1** — Given the prompt run against an assistant with usable history, when it
  completes, then it returns a single JSON object carrying all nine fields.
  對有可用紀錄的助理執行提示詞，完成時應回傳單一 JSON 物件，含全部九個欄位。
- **R2.2** — Given any returned profile, when it is inspected, then it contains no raw
  conversation content and no verbatim excerpts.
  檢視任何回傳的檔案時，不得含有原始對話內容或逐字引用。
- **R2.3** — Given `interests`, `motivations`, `active_problems`, and `recurring_topics`,
  when inspected, then each entry is a specific claim, not a broad label — "low-light
  street photography" passes; "photography" does not.
  檢視這四個欄位時，每一項都必須是具體描述而非廣泛標籤：「低光源街頭攝影」通過，
  「攝影」不通過。
- **R2.4** — Given `history_scope`, when inspected, then it names both what was
  available and what was not.
  檢視 `history_scope` 時，必須同時指出哪些可用、哪些不可用。
- **R2.5** (negative｜反例) — Given an assistant with no accessible history, when the
  prompt is run, then it states the limitation and requests selected chats or an export
  rather than producing a profile.
  對沒有可存取紀錄的助理執行提示詞時，它應說明限制並要求指定對話或匯出資料，
  而非產出檔案。

_Verification for this step is human judgement against a fixed rubric, not an automated
test. See [`plan.md`](plan.md) § 6 for the rubric and the sample set._

_本步驟的驗證是依固定評分準則的人工判斷，不是自動化測試。準則與樣本集見
[`plan.md`](plan.md) § 6。_

---

### Step 3 — Sensitive-data check and one consolidated confirmation｜敏感資料檢查與整合式確認

The product must｜產品必須:

- Instruct the assistant to flag or generalize, **before** asking for approval: names,
  credentials, private repositories, exact locations, customer details, confidential
  relationships, internal metrics, health information, and proprietary identifiers.
  Any uncertainty about whether a fact is safe appears in the same review.
  要求助理在請求核准 **之前** 標記或概括化：姓名、憑證、私人儲存庫、精確位置、客戶資料、
  機密關係、內部指標、健康資訊與專有識別資訊。任何關於某項資訊是否安全的不確定，
  都必須出現在同一次審核中。
- Present the complete proposed profile and ask exactly **one** consolidated question:
  呈現完整的提案檔案，並提出恰好 **一個** 整合式問題：

  > This is the profile I propose to upload. I removed or generalized the sensitive
  > details listed above. Review every field, then reply once with **CONFIRM**,
  > **CANCEL**, or list all edits in one message and end with **CONFIRM AFTER EDITS**.
  >
  > 這是我建議上傳的完整檔案。我已移除或概括化上述敏感內容。請審核每個欄位，
  > 並只回覆一次：**CONFIRM**、**CANCEL**，或在同一則訊息列出所有修改，
  > 最後加上 **CONFIRM AFTER EDITS**。

#### Acceptance criteria｜驗收標準

- **R3.1** — Given a profile draft containing a person's full name, an exact address, or
  an employer-internal metric, when the review is presented, then that item appears in
  the omitted/generalized list and not in the profile body.
  當草稿含有全名、精確地址或雇主內部指標時，審核中該項應出現在已移除／已概括清單，
  而不在檔案內容中。
- **R3.2** — Given the review, when it is presented, then it asks exactly one question
  and shows every field of the profile.
  審核呈現時，必須恰好問一個問題，並顯示檔案的每個欄位。
- **R3.3** — Given a reply of **CONFIRM**, when submission occurs, then
  `owner_confirmed` is `true`.｜回覆 **CONFIRM** 後提交時，`owner_confirmed` 應為 `true`。
- **R3.4** (negative｜反例) — Given a reply that lists edits but does **not** end with
  **CONFIRM AFTER EDITS**, when the assistant proceeds, then it does not submit and
  re-asks the consolidated question.
  當回覆列出修改但 **未** 以 **CONFIRM AFTER EDITS** 結尾時，助理不得提交，
  且必須重新提出整合式問題。
- **R3.5** (negative｜反例) — Given **CANCEL**, silence, or an ambiguous reply, then
  nothing is submitted.｜遇到 **CANCEL**、未回覆或模糊回覆時，不得提交任何內容。
- **R3.6** — Given a submission arriving with `owner_confirmed` absent or `false`, when
  the server processes it, then it is rejected and no draft is created.
  當提交的 `owner_confirmed` 缺少或為 `false` 時，伺服器應拒絕，且不建立草稿。

---

### Step 4 — Submission and My Pitch｜上傳與我的介紹頁

Two paths, both ending at the same consent standard.

兩條路徑，最終都適用相同的同意標準。

- **Direct path:** the assistant calls the narrowly scoped `submit_owner_pitch` tool
  with the session id and the confirmed profile.
  **直接路徑：** 助理以 session id 與已確認的檔案，呼叫權限範圍極小的
  `submit_owner_pitch` 工具。
- **Fallback path:** the assistant returns confirmed JSON, the user pastes or shares it
  back to the app, and a single **Review & Publish** screen applies the same standard.
  The fallback must work on any phone with no integration at all.
  **備援路徑：** 助理回傳已確認的 JSON，使用者貼上或分享回 App，由單一
  **Review & Publish** 畫面套用相同標準。備援必須在完全沒有整合能力的任何手機上都可用。

After publication, **My Pitch** shows the approved profile grouped into Interests,
Motivations, Problems, Recurring Topics, and Friend Intent, with history scope and
confidence labels — and never any raw evidence.

發布後，**我的介紹頁** 依興趣、動機、問題、反覆主題與交友意圖分組顯示已核准的檔案，
並附上歷史範圍與信心標籤，且絕不顯示任何原始證據。

#### Acceptance criteria｜驗收標準

- **R4.1** — Given a valid unexpired session and `owner_confirmed: true`, when
  `submit_owner_pitch` is called, then one draft profile is created and the session is
  marked used.
  當工作階段有效未過期且 `owner_confirmed: true` 時，呼叫該工具應建立一份草稿檔案，
  並將工作階段標記為已使用。
- **R4.2** — Given a session already marked used, when it is submitted again, then the
  request is rejected as a duplicate and no second profile is created.
  當工作階段已標記使用後再次提交，請求應以重複為由被拒絕，且不建立第二份檔案。
- **R4.3** — Given a payload with unknown fields, raw conversation content, or a size
  over the configured cap, when it is submitted, then it is rejected with a specific
  reason and nothing is written.
  當 payload 含未知欄位、原始對話內容，或大小超過設定上限時，應以明確理由被拒絕，
  且不寫入任何資料。
- **R4.4** — Given a submission token, when it is used to attempt reading a profile,
  listing users, or changing settings, then every such attempt fails.
  當提交 token 被用來嘗試讀取檔案、列出使用者或變更設定時，所有嘗試都必須失敗。
- **R4.5** — Given confirmed JSON pasted into the fallback screen, when the user
  publishes, then the resulting profile is byte-equivalent in content to what the
  direct path would have produced.
  當已確認的 JSON 貼入備援畫面並發布時，產生的檔案內容應與直接路徑的結果等價。
- **R4.6** — Given a published profile, when My Pitch renders, then all five groups plus
  history scope and confidence labels are shown, and every claim is labelled
  **conversation-derived** and **owner-approved**.
  當已發布的檔案在我的介紹頁渲染時，應顯示全部五個分組加上歷史範圍與信心標籤，
  且每項描述都標示為 **由對話衍生** 與 **owner 已核准**。
- **R4.7** — Given a draft that was never confirmed, when matching runs, then that
  profile is not matchable and is not visible to any other user.
  當草稿從未被確認時，配對執行後該檔案不可配對，且對任何其他使用者不可見。

---

### Step 5 — Explainable friend matching｜可解釋的朋友配對

The product must｜產品必須:

- Represent each profile along the ladder **domain → specific interest → motivation →
  active problem → recurring question**.
  以 **領域 → 具體興趣 → 動機 → 當前問題 → 反覆問題** 的階梯表示每份檔案。
- Score with these weights｜以下列權重評分: 30% specific-interest overlap｜具體興趣重疊,
  25% active-problem overlap｜當前問題重疊, 20% motivation alignment｜動機一致,
  15% recurring-topic overlap｜反覆主題重疊, 10% friend intent and practical
  compatibility｜交友意圖與實際相容性.
- Apply language, safety, age, visibility, location preference, and availability as
  **filters only** — they never contribute to a score.
  語言、安全、年齡、可見性、地點偏好與時間可用性 **僅作為篩選條件**，絕不納入評分。
- Return a small number of matches, each of which answers three questions:
  回傳少量配對，每則都必須回答三個問題：
  1. What do we care about in common?｜我們共同關心什麼？
  2. What are we trying to do for the same reason?｜我們因什麼相同動機而行動？
  3. What could we discuss now?｜我們現在可以聊什麼？

#### Acceptance criteria｜驗收標準

- **R5.1** — Given two profiles with a specific overlapping interest, when matching
  runs, then they appear in each other's match set with a score reflecting the weights
  above.
  當兩份檔案有具體重疊的興趣時，配對執行後應互相出現在對方的配對集合中，
  且分數反映上述權重。
- **R5.2** — Given any surfaced match, when Match Detail renders, then it names the
  concrete shared items behind it and answers all three questions.
  任何被呈現的配對，在配對詳情頁渲染時都必須指出背後具體的共享項目，並回答三個問題。
- **R5.3** (negative｜反例) — Given a candidate pair whose only commonality is a broad
  domain label with no shared specific interest, motivation, problem, or topic, then no
  match is surfaced.
  當候選組合唯一的共同點只是廣泛領域標籤，且無共享的具體興趣、動機、問題或主題時，
  不得呈現配對。
- **R5.4** — Given a match set, when it renders, then it shows no public score, follower
  count, or popularity ranking to the user.
  配對集合渲染時，不得向使用者顯示公開分數、追蹤者數量或人氣排行。
- **R5.5** — Given a filter mismatch (language, safety, age, visibility), then the pair
  is excluded regardless of overlap score.
  當篩選條件不符（語言、安全、年齡、可見性）時，無論重疊分數多高都必須排除該組合。
- **R5.6** — Given a match, when its explanation is generated, then it contains no raw
  conversation content.｜配對的解釋產生時，不得含有原始對話內容。

---

### Step 6 — Notification and mutual invitation｜通知與雙向邀請

The product must｜產品必須:

- Notify on **Pitch Ready**, **Strong Match Found**, and **Invitation Received**.
  在 **介紹已完成**、**找到強配對** 與 **收到邀請** 時發出通知。
- Keep lock-screen/preview text general; sensitive topics and full explanations appear
  only after the user opens the app.
  鎖定畫面與預覽文字保持概括；敏感主題與完整解釋只在使用者開啟 App 後顯示。
- Let either owner send an invitation. The recipient chooses **Accept** or **Not now**.
  An introduction occurs only on mutual consent.
  任一 owner 都可發出邀請。接收者選擇 **Accept** 或 **Not now**。只有雙方同意才形成引介。
- Never disclose the recipient's private reason for declining to the sender.
  絕不向發送者揭露接收者拒絕的私人理由。
- Provide rate limits, block, and report.｜提供頻率限制、封鎖與檢舉。

#### Acceptance criteria｜驗收標準

- **R6.1** — Given a published pitch, when matching completes, then a Pitch Ready
  notification is delivered.
  當介紹已發布且配對完成時，應送出「介紹已完成」通知。
- **R6.2** — Given a strong match, when the notification is delivered, then its preview
  text names no sensitive topic; the full explanation appears only in-app.
  當強配對的通知送出時，預覽文字不得提及敏感主題；完整解釋只在 App 內顯示。
- **R6.3** — Given an invitation, when the recipient accepts, then and only then does
  each side see the other as an introduction.
  當接收者接受邀請時，且僅在此時，雙方才會以引介的形式看見對方。
- **R6.4** (negative｜反例) — Given **Not now**, then the sender sees only that the
  invitation was not accepted, with no reason, and cannot immediately re-send (rate
  limit applies).
  當選擇 **Not now** 時，發送者只會看到邀請未被接受、沒有理由，且不能立即重送
  （適用頻率限制）。
- **R6.5** — Given any match or invitation screen, when it renders, then **Invite** and
  **Not now** are the only actions offered.
  任何配對或邀請畫面渲染時，只能提供 **Invite** 與 **Not now** 兩個操作。

---

## 2. Should-haves｜次要需求

Wanted, not blocking. If one becomes load-bearing, move it up and tell the PM.

想要但不阻塞。若其中一項變成關鍵，請將它上移並告知 PM。

- Deep links into ChatGPT/Claude beyond copy + share.
  複製與分享以外，進入 ChatGPT／Claude 的深層連結。
- QR handoff for phone→desktop.｜手機到桌機的 QR 交接。
- Refresh / re-pitch flow on My Pitch.｜我的介紹頁的重新產生流程。
- Profile export and deletion UI (the *capability* is a constraint below; the polished
  screen is a should-have).
  檔案匯出與刪除介面（該 *能力* 屬於下方的限制條件；精緻畫面才是次要需求）。
- More than one match per user in the demo set.｜展示集合中每位使用者不只一個配對。

---

## 3. Explicitly out of scope｜明確不做的範圍

This list is as load-bearing as the requirements. Do not build these.

這份清單與需求同樣關鍵。不要建造以下項目。

- **Swipe decks, infinite feeds, or any engagement loop.** The north star rules these
  out by name.｜**滑動卡片、無限動態牆或任何互動誘導循環。** 北極星文件已明文排除。
- **Public scores, follower counts, popularity rankings.**
  **公開分數、追蹤者數量、人氣排行。**
- **Recruiting, professional networking, follower growth, or time-in-app** as product
  objectives.｜將 **招募、職業人脈、追蹤者成長或使用時長** 作為產品目標。
- **Any storage, logging, or forwarding of raw conversation content.**
  **任何對原始對話內容的儲存、記錄或轉發。**
- **Reading the user's chat history ourselves.** The phone coordinates; it never
  analyzes a conversation archive.
  **由我們自行讀取使用者的對話紀錄。** 手機只負責協調，絕不分析對話資料庫。
- **Multi-round interview flows** to fill gaps when the AI lacks context.
  當 AI 缺乏脈絡時，用 **多輪訪談流程** 來補足缺口。
- **Verifying identity or expertise.** Every claim is conversation-derived and
  owner-approved, never proof.
  **驗證身分或專業能力。** 每項描述都是由對話衍生且經 owner 核准，絕非證明。
- **Native iOS/Android apps.** Mobile web only for this hackathon — see
  [`plan.md`](plan.md) § 1.
  **原生 iOS／Android App。** 本次 hackathon 只做行動網頁，見 [`plan.md`](plan.md) § 1。
- **Real push notifications.** In-app notification centre for the demo; the acceptance
  criteria above are satisfied by in-app delivery.
  **真實推播通知。** 展示使用 App 內通知中心；上述驗收標準以 App 內送達即算滿足。
- **Group matching, events, messaging beyond the introduction.**
  **群組配對、活動，以及引介之後的訊息功能。**

---

## 4. Constraints｜限制條件

Product-level constraints that bound the solution space.

界定解決方案空間的產品層級限制。

- Must be completable end to end on a phone.｜必須能在手機上端到端完成。
- Must work for a user whose AI assistant has **no** integration capability — the
  copy-and-share fallback is not optional.
  即使使用者的 AI 助理 **沒有** 整合能力也必須可用；複製與分享的備援路徑不是選配。
- Raw histories never enter PitchYourOwner; verbatim excerpts excluded by default.
  原始紀錄永不進入 PitchYourOwner；逐字引用預設排除。
- Upload authority is short-lived, single-use, write-only, and draft-only.
  上傳權限為短期、一次性、僅可寫入、且僅能建立草稿。
- Profiles support visibility control, deletion, blocking, and reporting.
  檔案支援可見性控制、刪除、封鎖與檢舉。
- Every claim is presented as conversation-derived and owner-approved.
  每項描述都標示為由對話衍生且經 owner 核准。
- Bilingual EN/繁中 for all user-facing copy.｜所有使用者可見文案皆為英文與繁中雙語。

---

## 5. Edge cases｜邊界案例

Cases the product must handle correctly that are easy to omit from a first pass.

產品必須正確處理、但第一版容易遺漏的情況。

| Case｜情況 | Required behaviour｜必要行為 |
| --- | --- |
| AI has no accessible history｜AI 無可存取紀錄 | Disclose the limitation; offer selected-chat or export input; never invent a profile｜說明限制；提供指定對話或匯出資料作為輸入；絕不虛構檔案 |
| Session expires mid-flow｜流程中工作階段過期 | Clear expired-session state with a one-tap way to start a new session｜明確的過期狀態，並提供一鍵重新建立 |
| User submits the same session twice｜同一工作階段提交兩次 | Second submission rejected as duplicate; first profile untouched｜第二次以重複為由拒絕；第一份檔案不受影響 |
| AI returns malformed or partial JSON｜AI 回傳格式錯誤或不完整的 JSON | Fallback screen shows a specific parse error and what is missing; no partial publish｜備援畫面顯示明確的解析錯誤與缺少項目；不得部分發布 |
| User edits then confirms in one reply｜使用者在同一則回覆中修改並確認 | Edited profile is what gets submitted, not the original draft｜提交的是修改後的檔案，而非原始草稿 |
| Profile has zero viable matches｜檔案沒有任何可行配對 | Honest empty state; no filler or padded matches｜誠實的空狀態；不得填充或湊數 |
| Both owners invite each other simultaneously｜雙方同時互相邀請 | Resolves to one accepted introduction, not two｜收斂為一筆已接受的引介，而非兩筆 |
| User deletes their profile｜使用者刪除檔案 | It leaves all match sets immediately, including already-surfaced ones｜立即從所有配對集合移除，包含已呈現的 |
| Oversized payload｜Payload 過大 | Rejected before parsing, with a size-specific error｜在解析前拒絕，並回傳大小相關的明確錯誤 |

---

## 6. Cross-cutting requirements｜跨面向需求

Requirements that apply across every surface, not just one step.

適用於所有介面、而非單一步驟的需求。

### Privacy and security｜隱私與安全

- The submission endpoint validates against a strict schema and **rejects unknown
  fields** rather than ignoring them.
  提交端點以嚴格結構驗證，並 **拒絕未知欄位** 而非忽略它們。
- Tokens are stored hashed, never in plaintext.｜Token 以雜湊儲存，絕不明文。
- No secret, token, or profile body is written to application logs.
  機密、token 或檔案內容都不得寫入應用程式日誌。
- The consent state (`owner_confirmed`) is checked server-side, never trusted from the
  client alone.
  同意狀態（`owner_confirmed`）必須在伺服器端檢查，絕不僅信任用戶端。

### Design and consistency｜設計與一致性

- One component library, one type scale, one spacing scale. No bespoke one-off styles.
  單一元件庫、單一字級系統、單一間距系統。不做一次性的客製樣式。
- Four areas only: **Matches · Invitations · My Pitch · Settings**.
  只有四個區域：**配對 · 邀請 · 我的介紹 · 設定**。
- The product should feel like an agent-mediated introduction, not a dating app.
  產品應給人「由 Agent 協助的引介」的感受，而非交友軟體。

### Accessibility and interaction｜無障礙與互動

- Minimum 44×44px touch targets.｜觸控目標最小 44×44px。
- Text contrast meets WCAG AA.｜文字對比度符合 WCAG AA。
- Every interactive control is reachable and labelled.
  每個互動控制項都可觸及且有標籤。

### Responsive behaviour｜響應式行為

- Designed for 375px width first. No horizontal scroll, no clipped content at 320px.
  以 375px 寬度優先設計。在 320px 下不得有水平捲動或內容被裁切。
- Must be usable in mobile Safari and mobile Chrome.
  必須能在行動版 Safari 與 Chrome 上使用。

---

## 7. Editorial / review gates｜文案與審查關卡

Copy review, bilingual polish, and deck alignment are **not** completion gates for the
engineering step they touch. Track them as open items in [`log.md`](log.md) instead of
blocking a step's status on them.

文案審查、雙語潤飾與簡報對齊 **不是** 其所涉工程步驟的完成關卡。請在
[`log.md`](log.md) 中以未決項目追蹤，而不要因此阻擋步驟狀態。

The one exception: the Step 3 consolidated-confirmation wording is a **product
requirement**, not copy. Changing it requires PM approval.

唯一例外：Step 3 的整合式確認措辭是 **產品需求**，不是文案。變更它需要 PM 核准。

---

## 8. Success metrics｜成功指標

Measured across the 10–30 participant set. These do not gate the build; they are what
the demo argues.

以 10–30 位參與者的集合衡量。這些不阻擋開發，而是展示所要論證的內容。

**North star｜北極星指標:** relevant friend matches accepted per confirmed owner pitch.
每份已確認 owner pitch 所產生的相關朋友配對接受數。

| Area｜面向 | Metrics｜指標 |
| --- | --- |
| Pitch quality｜介紹品質 | prompt→preview completion · confirmation rate · fields edited/removed · sensitive-data concern rate · user-rated accuracy｜提示詞到預覽完成率 · 確認率 · 被編輯或移除的欄位 · 敏感資料疑慮率 · 使用者評估準確度 |
| Transfer quality｜傳輸品質 | direct-tool success · fallback success · median prompt→pitch-ready time · expired/duplicate session rate｜直接工具成功率 · 備援成功率 · 提示詞到完成的中位時間 · 過期或重複率 |
| Match quality｜配對品質 | notification open rate · invitation send rate · mutual acceptance · conversation started · "would you have found this person otherwise?"｜通知開啟率 · 邀請發送率 · 雙方接受率 · 實際開始對話 ·「若沒有此產品你原本會找到這個人嗎？」 |

### Core experiment｜核心實驗

For each participant, build a conventional profile (broad interests + short self-written
bio) and an owner-approved PitchYourOwner profile. Show one blind match from each,
without naming the system, and ask:

為每位參與者建立一份傳統檔案（廣泛興趣 + 簡短自我介紹）與一份經 owner 核准的
PitchYourOwner 檔案。各展示一個盲測配對，不揭露系統名稱，並詢問：

1. Which person would you rather meet?｜你較想認識哪一位？
2. Does the explanation feel specific to you?｜配對說明是否讓你感覺與自己相關？
3. Would you accept an invitation now?｜你現在會接受邀請嗎？
