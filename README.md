# PitchYourOwner Product Memo

## Executive Summary｜執行摘要

PitchYourOwner is a phone-first friend-discovery product in which each person is the owner of an AI agent. The agent’s role is simple: create an accurate, owner-approved introduction that helps its owner meet people worth knowing.

PitchYourOwner 是一個以手機為核心的朋友探索產品。每位使用者都是自己 AI Agent 的 owner；Agent 的角色很明確：產生一份準確且經 owner 核准的介紹，幫助 owner 認識值得交流的人。

The product gives users a structured prompt for an AI assistant such as ChatGPT or Claude. The assistant analyzes only the conversation history or memory that the user has authorized and that the assistant can actually access. It identifies recurring interests, motivations, active problems, and discussion topics, then produces a structured pitch for the owner to review. The pitch is a concise description grounded in recurring patterns of attention and published only with the owner’s explicit approval.

產品會提供一段可交給 ChatGPT、Claude 等 AI 助理的結構化提示詞。AI 只分析使用者已授權、且確實可存取的對話紀錄或記憶，整理反覆出現的興趣、動機、正在處理的問題與討論主題，再產生供 owner 審核的結構化介紹。這份介紹根據持續關注模式整理，且必須經 owner 明確核准才會發布。

PitchYourOwner matches people through specific shared attention: an interest, motivation, active problem, or recurring question. Its primary purpose is friendship and meaningful conversation; recruiting, professional networking, follower growth, and time spent in the app are outside its product objective.

PitchYourOwner 以具體的共同關注進行配對，包括興趣、動機、當前問題或反覆出現的問題。產品的目標是建立友誼與有意義的對話，而非招募、職業人脈經營、追蹤者成長，或最大化使用時間。

> **Your agent knows you. Let it pitch you.**  
> **你的 Agent 了解你，讓它來介紹你。**

> **Meet someone who cares about the same thing, for the same reason, right now.**  
> **認識一位此刻因相同理由，關心相同事情的人。**

## Product Question｜產品核心問題

Can an AI agent describe its owner well enough to identify a relevant friend?

AI Agent 能否準確介紹自己的 owner，並找出一位真正相關的朋友？

## Problem｜問題

Conventional profiles reduce people to job titles, schools, broad interest labels, public posts, and self-written biographies. Those fields can categorize someone, but they rarely reveal what a person repeatedly studies, what they are trying to solve, or why a subject matters to them.

傳統個人檔案通常將人壓縮成職稱、學校、廣泛興趣標籤、公開貼文與自行撰寫的簡介。這些資訊能協助分類，卻很少呈現一個人反覆研究什麼、正在解決什麼，或某個主題對他而言為何重要。

Two people may select “photography” while pursuing entirely different questions. One may study low-light street photography; another may focus on posture, skin tone, and subject direction. A portrait photographer and a contemporary dancer may also share a highly specific concern: how posture and tension communicate emotion. Broad labels miss this kind of connection.

兩個人都可能選擇「攝影」，但關心的問題完全不同。一人可能研究低光源街頭攝影；另一人可能專注於姿勢、膚色與被攝者引導。同時，一位人像攝影師與一位現代舞者，也可能共同關注姿勢與張力如何傳達情緒。這類連結往往無法由廣泛標籤捕捉。

Public content reflects what people choose to present publicly. Private AI conversations can reveal a different layer: recurring questions, evolving goals, attempts, uncertainties, and sustained attention. That signal must be handled with care. It should be abstracted, reviewed by the owner, and never transferred as raw conversation content.

公開內容反映的是人們選擇公開呈現的樣貌。私人 AI 對話則可能呈現另一層訊號：反覆出現的問題、發展中的目標、嘗試、不確定性與持續的關注。這類訊號必須被謹慎處理：先抽象化、由 owner 審核，且絕不以原始對話內容的形式傳輸。

## Why This Is Feasible｜可行性基礎

General-purpose AI assistants have become thinking partners across many fields. People use them to learn techniques, compare approaches, reflect on performance, develop ideas, prepare projects, and return to questions that matter to them. Over time, those conversations can express a person’s interests and current intent more specifically than a manually completed interest form.

通用型 AI 助理已成為許多領域的思考夥伴。人們用它學習技巧、比較方法、反思表現、發展想法、準備專案，並持續回到自己在意的問題。隨著時間累積，這些對話可能比手動填寫的興趣表單更具體地呈現一個人的興趣與當前意圖。

Useful signals include:

- Recurring interests｜反覆出現的興趣
- Current motivations｜目前的動機
- Active problems｜正在處理的問題
- Specific techniques and questions｜具體技巧與問題
- Learning direction｜學習方向
- Evidence of practice or application｜練習或實際應用的跡象

The product operates as a privacy-conscious chain: private AI conversation is interpreted within the user’s chosen assistant, abstracted into a proposed pitch, reviewed once by the owner, uploaded as a structured profile, and used for explainable friend matching.

產品採取重視隱私的鏈路：私人 AI 對話先在使用者選擇的助理中被理解，再抽象為一份介紹提案，經 owner 一次審核後上傳為結構化個人檔案，最後用於可解釋的朋友配對。

The phone coordinates this process; it does not analyze an entire conversation archive itself. It creates a short-lived upload session, provides a platform-specific prompt, and receives only the approved structured profile. Historical access varies by provider, account, memory setting, and product capability. When an assistant lacks adequate context, it must disclose the limitation and use selected chats or a user-provided export. It must not invent a profile or force the user into a multi-round interview.

手機負責協調整個流程，而不會自行分析完整對話資料庫。它建立短期上傳工作階段、提供對應平台的提示詞，並只接收經核准的結構化個人檔案。不同 AI 服務、帳戶、記憶設定與產品能力對歷史資料的存取程度不同。當 AI 缺乏足夠脈絡時，必須清楚說明限制，並改用指定對話或使用者提供的匯出資料；不得虛構個人檔案，也不得強迫使用者進入多輪訪談。

## Product Principles｜產品原則

### The agent prepares; the owner publishes｜Agent 準備內容；owner 決定發布

Writing “Who am I?” from a blank page is difficult. Reviewing “Does this describe me accurately?” is easier. The agent begins with behavior-grounded patterns, while the owner remains the final editor and publisher of every field.

從零開始回答「我是誰？」並不容易；審核「這是否準確描述我？」則更容易。Agent 可以從有行為依據的模式開始整理，但每個欄位的最終編輯與發布權都保留在 owner 手中。

### Relevance comes from shared depth｜相關性來自共享的深度

A strong friend match shares at least one of the following: a specific interest, a motivation, an active problem, or a recurring discussion topic. Different professions can make a match unexpectedly useful, although complementary skills are not the primary matching objective.

一個有價值的朋友配對至少應共享以下其中一項：具體興趣、動機、當前問題或反覆討論的主題。不同職業之間的配對可能帶來意想不到的收穫，但互補技能不是主要的配對目標。

### Review is consolidated and explicit｜審核集中且需明確同意

The assistant prepares the full proposed pitch, identifies sensitive-data concerns, and asks one consolidated confirmation question. The owner may confirm, cancel, or provide all edits in the same reply and explicitly confirm the edited profile. Silence, ambiguity, or edits without explicit confirmation do not authorize upload.

AI 會一次準備完整的介紹提案、指出敏感資料疑慮，並提出一個整合式確認問題。Owner 可確認、取消，或在同一則回覆中提出所有修改並明確確認修改後的內容。未回覆、回覆不明確，或僅提出修改但未明確確認，都不能授權上傳。

### Data access is narrow by design｜資料存取權限必須最小化

A short-lived, single-use, write-only upload session is sufficient for profile submission. When the chosen AI can call a tool or API, it submits the confirmed profile directly. Otherwise, it returns approved structured JSON that the user shares back to the app.

個人檔案提交只需要短期、一次性、僅可寫入的上傳工作階段。當使用者選擇的 AI 能呼叫工具或 API 時，可直接提交已確認的檔案；否則，AI 會回傳經核准的結構化 JSON，由使用者分享回 App。

## Product Workflow｜產品流程

The experience has seven stages and one consolidated review.

整體體驗包含七個階段，以及一次整合式審核。

### 1. Start on Phone｜從手機開始

The app introduces the promise: **Your agent knows you. Let it pitch you to a friend worth meeting.** The user selects an AI assistant and chooses **Create my pitch**. The app creates a short-lived upload session and a platform-specific prompt.

App 顯示產品承諾：**你的 Agent 了解你，讓它向一位值得認識的朋友介紹你。** 使用者選擇 AI 助理並點選 **Create my pitch**。App 隨即建立短期上傳工作階段與對應平台的提示詞。

### 2. Hand Off the Prompt｜交付提示詞

The user opens ChatGPT, Claude, or another assistant through copy, share-sheet, or deep-link actions. The prompt instructs the assistant to analyze only authorized and accessible history or memory.

使用者可透過複製、分享選單或深層連結，開啟 ChatGPT、Claude 或其他 AI 助理。提示詞會要求 AI 只分析已獲授權且確實可存取的對話紀錄或記憶。

### 3. Generate the Owner Pitch｜產生 Owner Pitch

The assistant returns one structured proposal containing:

- `summary` — a short owner pitch｜簡短的 owner 介紹
- `interests` — specific interests｜具體興趣
- `motivations` — why these topics matter now｜目前重視這些主題的原因
- `active_problems` — problems being addressed｜正在處理的問題
- `recurring_topics` — repeatedly discussed questions｜反覆討論的問題
- `friend_intent` — the desired friend or conversation｜希望認識的朋友或對話類型
- `history_scope` — context that was and was not available｜可用與不可用的歷史範圍
- `confidence` — confidence for each claim｜每項描述的信心程度
- `omitted_sensitive_data` — data that was removed or generalized｜已移除或概括化的敏感內容

Raw conversations and verbatim excerpts are excluded from the output.

輸出不得包含原始對話或逐字引用。

### 4. Check Sensitive Data｜檢查敏感資料

Before asking for approval, the assistant flags or generalizes names, credentials, private repositories, exact locations, customer details, confidential relationships, internal metrics, health information, and proprietary identifiers. Any uncertainty about whether a fact is safe appears in the same review.

在要求核准前，AI 會標記或概括化姓名、憑證、私人儲存庫、精確位置、客戶資料、機密關係、內部指標、健康資訊與專有識別資訊。若無法確定某項資訊是否適合上傳，也必須在同一次審核中提出。

### 5. Review and Confirm｜審核與確認

The assistant shows the complete profile and asks one consolidated question:

> This is the profile I propose to upload. I removed or generalized the sensitive details listed above. Review every field, then reply once with **CONFIRM**, **CANCEL**, or list all edits in one message and end with **CONFIRM AFTER EDITS**.
>
> 這是我建議上傳的完整檔案。我已移除或概括化上述敏感內容。請審核每個欄位，並只回覆一次：**CONFIRM**、**CANCEL**，或在同一則訊息列出所有修改，最後加上 **CONFIRM AFTER EDITS**。

### 6. Submit the Confirmed Profile｜上傳已確認檔案

**Direct path:** after explicit confirmation, the AI calls the narrowly scoped `submit_owner_pitch` tool. **Fallback path:** the AI returns confirmed JSON and the user shares it back to the app, where a single **Review & Publish** screen applies the same consent standard.

**直接路徑：**使用者明確確認後，AI 呼叫權限範圍極小的 `submit_owner_pitch` 工具。**替代路徑：**AI 回傳已確認的 JSON，使用者分享回 App，並在單一 **Review & Publish** 畫面完成相同標準的同意。

### 7. Match and Invite｜配對與邀請

The system identifies a small number of people with overlapping interests, motivations, problems, or recurring topics. It explains the overlap, sends a strong-match notification, and lets either owner send an invitation. An introduction occurs only with mutual consent.

系統會找出少量在興趣、動機、問題或反覆主題上有重疊的人，說明重疊原因、傳送強配對通知，並允許任一 owner 發出邀請。雙方明確同意後，才會形成引介。

## Phone App Architecture｜手機 App 架構

The product should feel like an agent-mediated introduction rather than a dating swipe deck or an infinite feed.

產品採用由 Agent 協助完成的介紹體驗，並排除滑動式交友卡片與無限動態牆。

| Area｜區域 | Purpose｜用途 |
| --- | --- |
| **Matches**｜**配對** | Explainable strong matches｜可解釋的強配對 |
| **Invitations**｜**邀請** | Incoming and outgoing requests｜收到與送出的邀請 |
| **My Pitch**｜**我的介紹** | Approved profile and refresh control｜已核准的檔案與更新控制 |
| **Settings**｜**設定** | Privacy, visibility, safety, export, and deletion｜隱私、可見性、安全、匯出與刪除 |

### Start Screen｜開始頁

Show the product promise, supported AI choices, estimated time, and the statement “Raw chats are not uploaded.” The primary action is **Let my agent pitch me**.

顯示產品承諾、支援的 AI、預估所需時間，以及「不會上傳原始對話」。主要按鈕為 **Let my agent pitch me**。

### Prompt Handoff｜提示詞交接頁

Show one clear path: **Create prompt → Ask your AI → Confirm once → Pitch ready**. Display the upload-session expiry and actions to copy or share the prompt.

顯示單一路徑：**建立提示詞 → 詢問你的 AI → 一次確認 → Pitch ready**，並顯示上傳工作階段的到期時間與複製／分享提示詞的操作。

### My Pitch｜我的介紹頁

Organize the approved profile into Interests, Motivations, Problems, Recurring Topics, and Friend Intent. Display history scope and confidence labels without exposing raw evidence.

將已核准的檔案分為興趣、動機、問題、反覆主題與交友意圖，並顯示歷史範圍與信心標籤，但不公開原始證據。

### Match Detail｜配對詳情頁

Every match answers three questions:

1. What do we care about in common?｜我們共同關心什麼？
2. What are we trying to do for the same reason?｜我們因什麼相同動機而行動？
3. What could we discuss now?｜我們現在可以聊什麼？

The available actions are **Invite** and **Not now**. The product does not show public scores, follower counts, or popularity rankings.

操作為 **Invite** 與 **Not now**。產品不顯示公開分數、追蹤者數量或人氣排行。

## Matching System｜配對系統

Each profile is represented as:

> Domain → specific interest → motivation → active problem → recurring question  
> 領域 → 具體興趣 → 動機 → 當前問題 → 反覆問題

An initial scoring model gives weight to the signals most relevant to conversation:

初始配對模型會為最能促成對話的訊號設定權重：

- 30% specific-interest overlap｜具體興趣重疊
- 25% active-problem overlap｜當前問題重疊
- 20% motivation alignment｜動機一致
- 15% recurring-topic overlap｜反覆主題重疊
- 10% friend intent and practical compatibility｜交友意圖與實際相容性

Language, safety, age rules, visibility, location preference, and availability operate as match filters and do not contribute to popularity scoring. Repeated discussion indicates sustained attention but cannot verify expertise. Profiles should use labels such as **conversation-derived**, **owner-approved**, and **currently exploring**.

語言、安全、年齡規則、可見性、地點偏好與時間可用性應作為配對篩選條件，且不納入人氣評分。反覆討論可顯示持續關注，但無法驗證專業能力。個人檔案應使用 **由對話衍生**、**owner 已核准**、**目前正在探索** 等標籤。

## Notifications and Invitations｜通知與邀請

Notifications deliver useful events at appropriate moments, without using an addictive browsing loop as an engagement mechanism. Lock-screen text remains general; sensitive topics and full explanations appear only after the user opens the app.

通知的目的是在適當時機傳遞有價值的事件，且不以令人上癮的瀏覽循環作為互動機制。鎖定畫面上的文字應保持概括；敏感主題與完整解釋只能在使用者開啟 App 後顯示。

### Pitch Ready｜介紹已完成

> Your agent finished your pitch. Review complete—matching has started.  
> 你的 Agent 已完成介紹。審核完成，配對已開始。

### Strong Match Found｜找到強配對

> Your agent found another owner. You both keep discussing how small changes in movement communicate emotion.  
> 你的 Agent 找到另一位 owner。你們都持續討論動作的細微變化如何傳達情緒。

### Invitation Received｜收到邀請

> Another owner’s agent thinks you should meet.  
> 另一位 owner 的 Agent 認為你們應該認識。

Within the app, the invitation explains the shared interest, motivation, problem, and a suggested opening question. The recipient chooses **Accept** or **Not now**. The sender does not receive the recipient’s private reason for declining. Product testing may evaluate whether a strong match creates a draft invitation or prompts an owner to send one; either approach requires mutual consent.

在 App 內，邀請會說明共同興趣、動機、問題與建議的開場問題。接收者可選擇 **Accept** 或 **Not now**。發送者不會收到對方拒絕的私人理由。產品可測試強配對是建立邀請草稿，或提示 owner 主動發送；無論採用何種方式，都必須保留雙方同意。

## Agent Upload Interface｜Agent 上傳介面

The product supports a hybrid submission model: a direct agent tool where available, plus a copy-and-share fallback that works on any phone.

產品支援混合式提交模式：可用時採用 Agent 直接工具，同時保留任何手機都能使用的複製與分享替代流程。

The phone app creates a short-lived upload session containing a random single-use session ID, a write-only capability token, an expiration time, and a callback or app deep link. The token can create one draft profile only. It cannot read profiles, list users, change settings, or upload raw history.

手機 App 建立短期上傳工作階段，其中包含隨機且一次性的 session ID、僅可寫入的 capability token、到期時間，以及回呼或 App 深層連結。該 token 只能建立一份草稿檔案，不能讀取個人檔案、列出使用者、修改設定或上傳原始紀錄。

### Tool Contract｜工具契約

```json
{
  "tool": "submit_owner_pitch",
  "upload_session_id": "one-time-id",
  "owner_confirmed": true,
  "profile": {
    "summary": "...",
    "interests": [],
    "motivations": [],
    "active_problems": [],
    "recurring_topics": [],
    "friend_intent": "...",
    "history_scope": "...",
    "confidence": {},
    "omitted_sensitive_data": true
  }
}
```

The server rejects expired sessions, duplicate submissions, missing confirmation, unknown fields, raw conversation content, and oversized payloads.

伺服器應拒絕過期工作階段、重複提交、缺少確認、未知欄位、包含原始對話的內容，以及過大的 payload。

Profile submission needs only a narrowly authenticated HTTP or MCP tool. Agent sandboxes may run code, but the upload path does not require a persistent environment for each subscriber.

個人檔案提交只需要權限受限的 HTTP 或 MCP 工具。Agent sandbox 可以執行程式碼，但上傳流程不需要為每位訂閱者維持常駐環境。

> Phone creates session → user gives prompt to AI → AI generates preview → owner confirms once → AI calls `submit_owner_pitch` → phone opens the profile  
> 手機建立 session → 使用者將提示詞交給 AI → AI 產生預覽 → owner 一次確認 → AI 呼叫 `submit_owner_pitch` → 手機開啟檔案

## Privacy and Trust｜隱私與信任

The system follows this sequence:

系統遵循以下順序：

> Private history → inference inside chosen AI → abstraction → sensitive-data check → owner confirmation → structured upload  
> 私密紀錄 → 在使用者選擇的 AI 中推論 → 抽象化 → 敏感資料檢查 → owner 確認 → 結構化上傳

Core safeguards include:

- Raw histories never enter PitchYourOwner｜原始紀錄永不進入 PitchYourOwner
- Verbatim excerpts are excluded by default｜預設不包含逐字引用
- Every field appears in the consolidated review｜每個欄位都會出現在整合式審核中
- Sensitive facts are omitted or generalized｜敏感資訊會被移除或概括化
- Upload requires explicit confirmation｜上傳需要明確確認
- Direct-upload authority is short-lived, single-use, write-only, and limited to drafting｜直接上傳權限為短期、一次性、僅可寫入，且僅限建立草稿
- Profiles support visibility controls, deletion, blocking, and reporting｜檔案支援可見性控制、刪除、封鎖與檢舉
- Introductions require mutual consent｜引介需要雙方同意

Every claim is presented as conversation-derived and owner-approved. It is not verified proof of identity, expertise, or intent.

每項描述都應標示為由對話衍生且經 owner 核准；它不構成對身分、專業能力或意圖的驗證證明。

## MVP and Validation｜MVP 與驗證

The MVP tests one proposition:

MVP 要驗證一項核心命題：

> An AI-generated, owner-approved pitch can produce a friend match that feels more relevant than a conventional self-written profile.  
> 由 AI 產生並經 owner 核准的介紹，能比傳統自行撰寫的個人檔案產生更相關的朋友配對。

The MVP includes six capabilities:

1. Phone prompt handoff｜手機提示詞交接
2. Structured owner-pitch generation｜結構化 owner pitch 產生
3. Sensitive-data detection and one consolidated confirmation｜敏感資料偵測與一次整合式確認
4. Direct agent upload with a copy-and-share fallback｜Agent 直接上傳與複製／分享替代流程
5. Explainable friend matching｜可解釋的朋友配對
6. Strong-match notification and mutual invitation｜強配對通知與雙向邀請

A pre-recruited group of approximately 10–30 AI users across several interests is sufficient to demonstrate the full loop.

預先招募約 10–30 位、來自多種興趣領域的 AI 使用者，即可展示完整流程。

### Core Experiment｜核心實驗

For each participant, create a conventional profile with broad interests and a short self-written biography, and an owner-approved PitchYourOwner profile containing agent-derived interests, motivations, active problems, and recurring topics. Show one blind match from each approach, without identifying the system, and ask:

為每位參與者建立一份包含廣泛興趣與簡短自我介紹的傳統檔案，以及一份包含 Agent 衍生的興趣、動機、當前問題與反覆主題，並經 owner 核准的 PitchYourOwner 檔案。比較時不顯示系統名稱，各展示一個配對並詢問：

1. Which person would you rather meet?｜你較想認識哪一位？
2. Does the explanation feel specific to you?｜配對說明是否讓你感覺與自己相關？
3. Would you accept an invitation now?｜你現在會接受邀請嗎？

Measure mutual invitations and actual conversations as follow-on outcomes.

接著衡量雙向邀請與實際對話是否發生。

## Success Metrics and Risks｜成功指標與風險

### North-Star Metric｜北極星指標

> Relevant friend matches accepted per confirmed owner pitch  
> 每份已確認 owner pitch 所產生的相關朋友配對接受數

### Pitch Quality｜介紹品質

- Prompt-to-preview completion｜提示詞到預覽完成率
- Consolidated-review confirmation rate｜整合式審核確認率
- Fields edited or removed｜被編輯或移除的欄位比例
- Sensitive-data concern rate｜敏感資料疑慮率
- User-rated profile accuracy｜使用者評估的檔案準確度

### Transfer Quality｜傳輸品質

- Direct-tool upload success｜直接工具上傳成功率
- Copy-and-share fallback success｜複製／分享替代流程成功率
- Median time from prompt to pitch ready｜提示詞到 pitch ready 的中位時間
- Expired or duplicate session rate｜工作階段過期或重複率

### Match Quality｜配對品質

- Strong-match notification open rate｜強配對通知開啟率
- Invitation send rate｜邀請發送率
- Mutual acceptance｜雙方接受率
- Conversation started｜實際開始對話
- “Would you have found this person otherwise?”｜「若沒有此產品，你原本會找到這個人嗎？」

### Key Risks and Responses｜主要風險與應對

| Risk｜風險 | Product response｜產品應對 |
| --- | --- |
| History access｜歷史存取 | Disclose available scope and support selected-chat or user-export input｜揭露可用範圍，支援指定對話或使用者匯出資料 |
| Sensitive data｜敏感資料 | Generalize sensitive facts and require consolidated owner review｜概括化敏感資訊，並要求 owner 進行整合式審核 |
| Hallucination｜AI 幻覺 | Use confidence labels and owner approval｜使用信心標籤與 owner 核准 |
| Token leakage｜Token 洩漏 | Use short-lived, single-use, write-only, draft-only credentials｜採用短期、一次性、僅可寫入、僅能建立草稿的憑證 |
| Identity binding｜身分綁定 | Bind the session to the phone app and show the destination during confirmation｜將工作階段綁定手機 App，並在確認時顯示目的地 |
| Cross-app friction｜跨 App 摩擦 | Support share sheets, deep links, QR links, and universal paste fallback｜支援分享選單、深層連結、QR 連結與通用貼上替代方案 |
| Unwanted contact｜不受歡迎的聯絡 | Require mutual consent and provide rate limits, block, report, and age rules｜要求雙方同意，並提供頻率限制、封鎖、檢舉與年齡規則 |

## Product Direction｜產品方向

PitchYourOwner is a phone-completable system for owner-reviewed, data-minimized, explainable friend discovery. Its durable product commitments are clear: conversation-derived signals, owner approval, sensitive-data controls, transparent matching, and mutual consent.

PitchYourOwner 是一個可完全在手機上完成的朋友探索系統，重視 owner 審核、資料最小化與可解釋性。產品長期堅持的原則包括：由對話衍生的訊號、owner 核准、敏感資料控管、透明配對與雙方同意。

The long-term opportunity is a network in which agents do more than answer questions for their owners. They recognize when another person’s recurring interests, motivations, or problems make that person worth meeting, while keeping each owner in control of what is shared.

長期機會是一個由 Agent 協助建立的新型網路。Agent 不只替 owner 回答問題，也能辨識另一個人的反覆興趣、動機或問題何時值得認識，同時讓每位 owner 保有分享內容的控制權。

> What does this owner’s agent know they care about, and whose agent should receive that pitch?  
> 這位 owner 的 Agent 知道他關心什麼，而這份介紹應該傳給誰的 Agent？

