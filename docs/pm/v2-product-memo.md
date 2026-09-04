This is the second version of the proposal for the
Hackathon


# PitchYourOwner Product Memo — Version 2

## Executive Summary｜執行摘要

PitchYourOwner is a phone-first friend-discovery product in which every person is the owner of an AI agent, and every agent has one job: pitch its owner to people worth meeting. PitchYourOwner 是一個以手機為核心的朋友探索產品。每個人都是自己 AI Agent 的 owner，而每個 Agent 都有一項任務：向值得認識的人介紹自己的 owner。

The product gives the user a structured prompt for an AI assistant such as ChatGPT or Claude. The assistant summarizes the interests, motivations, recurring topics, and active problems visible in the history or memory the user has authorized. The result is not a résumé or psychological diagnosis. It is an owner-approved pitch grounded in what the person repeatedly discusses. 產品提供一段給 ChatGPT、Claude 等 AI 助理使用的結構化提示詞。AI 根據使用者已授權的對話紀錄或記憶，整理其興趣、動機、反覆討論的主題與目前正在解決的問題。結果不是履歷或心理診斷，而是一份以反覆對話為依據、並經 owner 核准的介紹。

A photographer may repeatedly discuss lighting, composition, lenses, subject direction, and color. A dancer may explore body language, timing, balance, expression, and how small movement changes affect an audience. Similar patterns exist for athletes, teachers, founders, musicians, researchers, chefs, filmmakers, students, hobbyists, and people in nearly every field. 攝影師可能反覆討論燈光、構圖、鏡頭、被攝者引導與色彩；舞者可能持續探索肢體語言、節奏、平衡、表達，以及動作的細微變化如何影響觀眾。運動員、教師、創業者、音樂家、研究者、廚師、影像創作者、學生與各種興趣者，也都會形成類似的對話模式。

Version 1 relied on Claude Code and Codex histories, which produced strong signals but mostly represented software builders. Version 2 expands the source from coding history to general AI conversations and changes the experience from a desktop analyzer to a phone app. 第一版依賴 Claude Code 與 Codex 紀錄，雖然能產生高品質訊號，卻主要代表軟體開發者。第二版將訊號來源擴展到一般 AI 對話，並把體驗從電腦端分析工具改為手機應用程式。

The hackathon proposition is deliberately focused: Hackathon 的核心命題應保持明確：

> Can an AI agent pitch its owner well enough to find a relevant friend? 一個 AI Agent 是否能準確地介紹自己的 owner，並幫他找到一位真正相關的朋友？

PitchYourOwner matches people who share specific interests, motivations, active problems, or recurring discussion topics. The main goal is friend finding—not recruiting, professional networking, follower growth, or maximizing time in the app. PitchYourOwner 配對的是共享具體興趣、相同動機、正在解決相似問題，或反覆討論相同主題的人。主要目標是找到朋友，而不是招募、職業人脈經營、追蹤者成長，或最大化使用時間。

**Positioning｜產品定位**

> Your agent knows you. Let it pitch you. 你的 Agent 了解你，讓它來介紹你。

**Core matching principle｜核心配對原則**

> Meet someone who cares about the same thing, for the same reason, right now. 認識一個此刻因相同理由，關心相同事情的人。


## 1. Problem｜問題

Conventional profiles compress people into job titles, schools, broad interest labels, public posts, and self-written bios. These fields can categorize people, but they rarely show what someone repeatedly thinks about or is motivated to solve. 傳統個人檔案將人壓縮成職稱、學校、廣泛興趣、公開貼文與自行撰寫的簡介。這些欄位可以分類，卻很少顯示一個人反覆思考什麼，或真正想解決什麼。

Two people may both choose “photography” while caring about completely different subjects. One may study low-light street photography; another may focus on posture, skin tone, and subject direction. Meanwhile, a portrait photographer and a contemporary dancer may share an unusually specific interest in how posture and tension communicate emotion. 兩個人可能都選擇「攝影」，但真正關心的內容完全不同。一人可能研究低光源街頭攝影，另一人則專注姿勢、膚色與被攝者引導。反而一位人像攝影師與一位現代舞者，可能都高度關注姿勢與張力如何傳達情緒。

Public content reflects what people choose to perform publicly, not necessarily what they investigate privately. AI conversations can reveal a different layer: recurring questions, evolving goals, attempts, uncertainties, and depth of attention. 公開內容反映人們選擇公開展示的內容，未必是他們私下真正研究的問題。AI 對話則可能呈現另一層訊號：反覆問題、演變中的目標、嘗試、不確定性與關注深度。

Version 1 used coding histories, but that narrowed the population to makers and engineers. The broader problem is: 第一版利用程式開發紀錄，卻將使用族群限制在創作者與工程師。更廣泛的問題是：

> How can an AI agent turn private conversation patterns into a safe, owner-approved pitch, then use that pitch to find a relevant friend? AI Agent 如何將私密對話模式轉化為安全、經 owner 核准的介紹，並以此找到相關朋友？


## 2. Why Now｜為什麼是現在

General-purpose AI assistants are becoming thinking partners for people across many domains. People use them to learn techniques, compare approaches, reflect on performance, develop ideas, prepare projects, and return to questions that matter. 通用型 AI 助理正在成為各領域人們的思考夥伴。人們用它學習技巧、比較方法、反思表現、發展想法、準備專案，並反覆思考自己重視的問題。

Over time, the conversation pattern can become more expressive than a manually completed interest form. It may reveal: 隨著時間累積，對話模式可能比手動填寫的興趣表單更具表達力。它可以呈現：

- recurring interests;｜反覆出現的興趣；
- current motivations;｜目前的動機；
- active problems;｜正在處理的問題；
- specific techniques and questions;｜具體技巧與問題；
- learning direction;｜學習方向；
- evidence of practice or application.｜練習或實際應用的跡象。

This creates a new friend-discovery layer: 這形成一個新的朋友探索層：

> Private AI conversations → agent-generated owner pitch → owner resolves specific security/privacy concerns in the AI → paste into the site → owner reviews publication → structured profile → explainable friend match. 私密 AI 對話 → Agent 產生 owner 介紹 → owner 在 AI 頁處理具體 security／privacy 疑慮 → 貼回網站 → owner 審核發布 → 結構化檔案 → 可解釋的朋友配對。

The phone is the orchestrator, but it does not analyze the full archive itself. It provides the prompt, hands the work to the chosen AI, accepts the confirmed JSON through paste-back, and renders the exact profile for a separate publication decision. 手機是整個流程的協調者，但不自行分析完整對話紀錄。它提供提示詞、將分析交給使用者選擇的 AI、透過貼回方式接收已確認 JSON，並精確渲染最終檔案，供使用者另行決定是否發布。

Historical access differs by provider, account, memory setting, and product capability. PitchYourOwner must never promise complete-history access. If an assistant lacks enough context, it should declare the limitation and use selected chats or a user-provided export—not invent a profile and not force a multi-round interview. 不同 AI 服務、帳戶、記憶設定與產品能力，對歷史紀錄的存取程度不同。若 AI 缺乏足夠脈絡，應清楚說明限制，改用指定對話或使用者提供的匯出資料，而不是虛構檔案，也不應強迫使用者進入多輪訪談。


## 3. Product Thesis｜產品論點

### The agent can pitch the owner better than a blank form｜Agent 能比空白表單更好地介紹 owner

Writing “Who am I?” from scratch is difficult. Confirming “Does this describe me accurately?” is easier. The agent starts from behavior-grounded patterns, while the owner remains the final editor and publisher. 從零回答「我是誰？」很困難；確認「這是否準確描述我？」則容易得多。Agent 從有行為依據的模式開始整理，而 owner 保有最終編輯與發布權。

### Friend relevance comes from shared depth, not broad labels｜朋友的相關性來自共享的深度，而不是廣泛標籤

A strong match should have one or more of the following: 好的配對應至少具備以下一項：

- the same specific interest;｜相同的具體興趣；
- the same motivation;｜相同的動機；
- the same problem being solved;｜正在解決相同問題；
- the same recurring discussion topic.｜反覆討論相同主題。

Different professions may make the match surprising, but complementarity is not the primary objective. The product should first prove that shared attention can create friendship relevance. 不同職業可能讓配對更有驚喜，但互補性不是主要目標。產品應先證明，共同關注能創造朋友之間的相關性。

### Two explicit checkpoints protect two different decisions｜兩個明確關卡保護兩種不同決定

The hackathon flow should not become a multi-round onboarding interview. The AI prepares the entire proposed pitch and asks one consolidated content-review question in the AI chat. After the owner pastes the confirmed JSON into PitchYourOwner, the site offers editable fields and then a separate read-only publication review. AI confirmation approves the content transfer; website confirmation authorizes publication. Hackathon 流程不應變成多輪 onboarding 訪談。AI 一次準備完整介紹，並在 AI 對話中提出一個整合式內容確認問題。Owner 將確認後的 JSON 貼入 PitchYourOwner 後，網站先提供可編輯欄位，再提供獨立的唯讀發布審核。AI 端確認核准內容移轉；網站端確認才授權發布。

### Phone paste-back is universal; computer automation creates drafts｜手機以貼回為通用路徑；電腦自動化只建立草稿

The phone path does not depend on whether ChatGPT or Claude can call an external API: the AI returns final JSON and the owner pastes it into the site. Computer users may generate a 24-hour, single-use, write-only upload capability for a normal HTTP POST. That API creates a draft only and cannot bypass final site review. The MVP does not need a permanent VM, WebMCP, or Remote MCP. 手機流程不依賴 ChatGPT 或 Claude 是否能呼叫外部 API：AI 回傳最終 JSON，由 owner 貼回網站。電腦使用者可產生 24 小時、一次性、僅可寫入的 capability，透過一般 HTTP POST 建立草稿；此 API 無法繞過網站最終審核。MVP 不需要永久 VM、WebMCP 或 Remote MCP。


## 4. Product Workflow｜產品流程

The workflow has eight stages and two explicit owner checkpoints. 整體流程有八個階段與兩個明確的 owner 關卡。

### 1. Start on Phone｜從手機開始

The app explains: **Your agent knows you. Let it pitch you to a friend worth meeting.** The user signs in with email, chooses an AI assistant, and taps **Create my pitch**. The site then presents the complete platform-specific prompt as the primary handoff object. App 顯示：**你的 Agent 了解你，讓它向一位值得認識的朋友介紹你。** 使用者以電子郵件登入、選擇 AI 助理並點選 **Create my pitch**，網站接著將完整的對應平台提示詞作為主要交接物件。

### 2. Hand Off the Prompt｜交付提示詞

One primary handoff action carries the complete prompt into ChatGPT, Claude, or another assistant and opens it. ChatGPT uses a prefilled deep link with a clipboard attempt; a visible secondary Copy action remains available without becoming a prerequisite. Other assistants use the same primary handoff where supported, with the same fallback. The prompt asks the assistant to analyze only history or memory the user authorized and the assistant can actually access. 單一主要交接操作會把完整 prompt 帶入 ChatGPT、Claude 或其他助理並開啟。ChatGPT 使用預填 deep link 並嘗試複製到剪貼簿；同時保留可見的次要 Copy 操作，但它不是前置步驟。其他助理在支援時採同樣主要交接與 fallback。提示詞要求 AI 只分析使用者已授權且系統確實可存取的紀錄或記憶。

### 3. Generate the Owner Pitch｜產生 Owner Pitch

The assistant returns one structured proposal containing: AI 一次回傳結構化提案，內容包括：

- `summary` — a short owner pitch;｜簡短的 owner 介紹；
- `interests` — specific interests;｜具體興趣；
- `motivations` — why these topics matter now;｜目前重視這些主題的原因；
- `active_problems` — problems being solved;｜正在解決的問題；
- `recurring_topics` — repeatedly discussed questions;｜反覆討論的問題；
- `friend_intent` — the desired friend or conversation;｜希望認識的朋友或對話類型；
- `history_scope` — what context was and was not available;｜可用與不可用的歷史範圍；
- `confidence` — qualitative owner-review metadata, never public and never used in matching.｜供 owner 審核的定性信心資料，不公開也不參與配對。

### 4. Sensitive-Data Check｜敏感資料檢查

Before approval, the assistant flags or generalizes names, credentials, private repositories, exact locations, customer details, confidential relationships, internal metrics, health information, and proprietary identifiers. If it is unsure whether a fact is safe, it surfaces that concern in the same review. 在詢問是否核准前，AI 應標記或概括化姓名、憑證、私人儲存庫、精確位置、客戶資料、機密關係、內部指標、健康資訊與專有識別資訊。若不確定某項資訊是否適合上傳，應在同一次審核中提出疑慮。

### 5. One AI Q&A: Resolve Transfer Risks｜一次 AI 問答：處理傳輸風險

The assistant shows a concise synthesis instead of exporting every schema field for line-by-line review. It then lists only security/privacy issues actually found in the proposed transfer. Every issue has an `S1`, `S2`, ... identifier, a concrete risk, and explicit remove/replace/authorized-keep options where appropriate. It never asks whether the pitch matches chat history or asks a general/open profile question. AI 先顯示精簡整體摘要，不把所有 schema 欄位展開讓使用者逐行審核；接著只列出擬傳輸內容中實際發現的 security／privacy 問題。每項問題都有 `S1`、`S2`… 編號、具體風險，以及適用時可直接選擇的移除／替換／經授權保留選項。AI 不詢問介紹是否符合聊天歷史，也不問一般或開放式 profile 問題。

The owner resolves every listed item in one message and adds **CONFIRM SECURITY AND GENERATE JSON／確認安全並產生 JSON**. If no issue requires a decision, the AI says so and requests only the same security confirmation. Only then does it return one parseable profile JSON object with no prose or Markdown. There is no multi-round questionnaire. Owner 在一則訊息選完所有列出的項目，並加入 **CONFIRM SECURITY AND GENERATE JSON／確認安全並產生 JSON**。若沒有需要決定的問題，AI 明確告知並只要求同一個安全確認語；之後才回傳一個前後沒有說明文字或 Markdown、可直接解析的 profile JSON。不進行多輪問卷。

### 6. Paste Back and Edit｜貼回並編輯

On phone, the AI returns confirmed JSON and the owner pastes it into the site. The site parses the configured schema and renders a title, label, and editable control for every field. If the owner wants substantive changes, they can edit here or return to the AI. PitchYourOwner does not repeat sensitive-data detection, filtering, rewriting, or a privacy ledger. 手機上，AI 回傳確認後的 JSON，由 owner 貼入網站。網站依設定的 schema 解析，並為每個欄位顯示標題、標籤與可編輯控制項。若需要實質修改，owner 可在此編輯或返回 AI；PitchYourOwner 不重做敏感資料偵測、過濾、改寫或隱私清單。

### 7. Final Publication Review｜最終發布審核

The next page is read-only and shows exactly what PitchYourOwner will store. The owner chooses **Confirm & upload** or **Back to edit**. This second checkpoint is the only action that authorizes publication. 下一頁為唯讀，精確顯示 PitchYourOwner 將儲存的內容。Owner 可選擇 **Confirm & upload** 或 **Back to edit**；只有這個第二關卡能授權發布。

### 8. Match and Invite｜配對與邀請

The system finds a small number of people who share interests, motivations, problems, or recurring topics. It explains the overlap, sends a strong-match notification, and allows either owner to send a mutual invitation. 系統找出少量共享興趣、動機、問題或反覆主題的人，說明重疊原因、傳送強配對通知，並允許任一 owner 發出雙向邀請。


## 5. Phone App and Page Architecture｜手機應用程式與頁面架構

The app should feel like an agent-mediated introduction, not a dating swipe deck or infinite feed. 應用程式應讓人感覺像由 Agent 協助完成的介紹，而不是滑動式交友卡片或無限動態牆。

Recommended navigation: 建議主要導覽：

- **Matches** — explainable strong matches;｜可解釋的強配對；
- **Invitations** — incoming and outgoing requests;｜收到與送出的邀請；
- **My Pitch** — the approved profile and refresh control;｜核准的檔案與更新控制；
- **Settings** — privacy, visibility, safety, export, deletion.｜隱私、可見性、安全、匯出與刪除。

### Start Screen｜開始頁

Show the promise, supported AI choices, time required, and the two owner-review checkpoints. The primary action is **Let my agent pitch me**. 顯示產品承諾、支援的 AI、預估時間，以及兩個 owner review 關卡。主要按鈕為 **Let my agent pitch me**。

### Prompt Handoff｜提示詞交接頁

Show one progress path: **Open AI with the prompt → Resolve detected security/privacy items → Return final JSON**. The complete prompt is the main object, with one primary prefill-and-open action, a visible secondary Copy fallback, and clear return instructions. The owner chooses Traditional Chinese or English before creating the prompt. 顯示單一路徑：**帶入 prompt 並開啟 AI → 處理偵測到的 security／privacy 項目 → 帶回最終 JSON**。完整提示詞是主要物件，並提供單一預填並開啟操作、可見的次要 Copy 備援與清楚的返回說明。Owner 在建立 prompt 前選擇繁體中文或英文。

### My Pitch｜我的介紹頁

Organize the result into Interests, Motivations, Problems, Recurring Topics, and Friend Intent. Show history scope and confidence without exposing raw evidence. 將結果分成興趣、動機、問題、反覆主題與交友意圖，並顯示歷史範圍與信心標籤，但不公開原始證據。

### Match Detail｜配對詳情頁

Every match should answer three questions: 每個配對應回答三個問題：

1. What do we care about in common?｜我們共同關心什麼？
2. What are we trying to do for the same reason?｜我們因什麼相同動機而行動？
3. What could we discuss now?｜我們現在可以聊什麼？

The actions are **Invite** and **Not now**. There is no public score, follower count, or popularity ranking. 操作是 **Invite** 與 **Not now**，不顯示公開分數、追蹤者數量或人氣排行。


## 6. Matching System｜配對系統

Profiles should be represented as: 個人檔案應表示為：

> Domain → specific interest → motivation → active problem → recurring question. 領域 → 具體興趣 → 動機 → 當前問題 → 反覆問題。

A testable starting score is: 可測試的初始權重如下：

- 30% specific interest overlap;｜具體興趣重疊；
- 25% active problem overlap;｜當前問題重疊；
- 20% motivation alignment;｜動機一致；
- 15% recurring topic overlap;｜反覆主題重疊；
- 10% friend intent and practical compatibility.｜交友意圖與實際相容性。

Language, safety, age rules, visibility, location preference, and availability act as filters rather than popularity signals. Repeated discussion demonstrates sustained attention, not verified expertise. Use labels such as **conversation-derived**, **owner-approved**, and **currently exploring**. 語言、安全、年齡規則、可見性、地點偏好與時間可用性應作為篩選條件，而不是人氣訊號。反覆討論只能證明持續關注，不能證明專業能力。應使用 **由對話衍生**、**owner 已核准**、**目前正在探索** 等標籤。


## 7. Match Notifications and Invitations｜配對通知與邀請

Retention is not the central hackathon problem. Notifications deliver a useful event and bring the owner back at the right moment—not manufacture an addictive loop. 留存不是此次 Hackathon 的核心問題。通知的作用是傳遞有價值的事件，讓 owner 在正確時機回來，而不是製造上癮循環。

### Pitch Ready｜介紹已完成

> Your agent finished your pitch. Review complete—matching has started. 你的 Agent 已完成介紹。審核完成，配對已開始。

### Strong Match Found｜找到強配對

> Your agent found another owner. You both keep discussing how small changes in movement communicate emotion. 你的 Agent 找到另一位 owner。你們都持續討論動作的細微變化如何傳達情緒。

Lock-screen text stays general. Sensitive topics and full explanations appear only after opening the app. 鎖定畫面文字應保持概括；敏感主題與完整解釋只能在開啟 App 後顯示。

### Invitation Received｜收到邀請

> Another owner's agent thinks you should meet. 另一位 owner 的 Agent 認為你們應該認識。

Inside the app, explain the shared interest, motivation, problem, and suggested opening question. The user chooses **Accept** or **Not now**. The sender receives no private reason for rejection. App 內說明共同興趣、動機、問題與建議開場題。使用者可選 **Accept** 或 **Not now**，發送者不會收到拒絕的私人理由。

Product management can test whether a strong match creates a draft invitation or merely prompts one owner to send it. Mutual consent remains mandatory. 產品設計可測試強配對是否建立邀請草稿，或只提示 owner 主動發送；兩種設計都必須保留雙方同意。


## 8. Computer Draft API｜電腦端草稿 API

The Hackathon architecture uses universal paste-back on phone and a normal HTTP API for computer users. WebMCP and Remote MCP are not in scope. Hackathon 架構在手機使用通用貼回流程，在電腦則提供一般 HTTP API；WebMCP 與 Remote MCP 不在範圍內。

An authenticated computer user can request a short-lived upload capability containing: 已登入的電腦使用者可取得短期上傳 capability，內容包括：

- a random, single-use session ID;｜隨機且一次性的 session ID；
- a write-only capability token;｜僅可寫入的 capability token；
- profile schema version;｜個人檔案 schema 版本；
- expiration time;｜到期時間；
- a draft submission URL.｜草稿提交網址。

The token can create only one draft profile. It cannot read profiles, list users, or change settings. Token 只能建立一份草稿檔案，不能讀取檔案、列出使用者或修改設定。

### HTTP Contract｜HTTP 契約

```json
{
  "locale": "zh-Hant",
  "profile": {
    "summary": "...",
    "interests": [],
    "motivations": [],
    "active_problems": [],
    "recurring_topics": [],
    "friend_intent": "...",
    "history_scope": "...",
    "confidence": {
      "summary": "high",
      "interests": "medium",
      "motivations": "medium",
      "active_problems": "high",
      "recurring_topics": "high",
      "friend_intent": "medium"
    }
  }
}
```

The server rejects expired or reused tokens, unknown fields, malformed content, and oversized payloads. A successful POST creates a draft only. The owner must still open the site's rendered review and confirm publication. 伺服器拒絕過期或重複使用的 token、未知欄位、格式錯誤與過大的 payload。成功的 POST 只建立草稿；owner 仍須開啟網站的渲染審核並確認發布。

### Runtime Decision｜Runtime 決策

A permanent per-subscriber VM is unnecessary. Agent sandboxes can run code, but profile submission only needs a narrow authenticated HTTP POST. 不需要為每位訂閱者建立永久 VM。Agent sandbox 可以執行程式碼，但個人檔案提交只需要權限受限的一般 HTTP POST。

> Computer owner creates 24-hour capability → agent POSTs the profile → server creates draft → owner reviews on site → owner publishes. 電腦端 owner 建立 24 小時 capability → Agent POST 個人檔案 → 伺服器建立草稿 → owner 在網站審核 → owner 發布。


## 9. Privacy and Trust｜隱私與信任

The architecture follows: 系統架構遵循：

> Private history → inference and sensitive-data handling inside chosen AI → owner resolves every detected security/privacy item → structured paste or draft → owner confirms publication on site. 私密紀錄 → 在選定 AI 中完成推論與敏感資料處理 → owner 處理所有偵測到的 security／privacy 項目 → 結構化貼回或草稿 → owner 在網站確認發布。

Core safeguards: 核心保護措施：

- every field appears in the AI content review and the site's final publication review;｜每個欄位都出現在 AI 內容審核與網站最終發布審核中；
- sensitive-data handling finishes in the AI chat before transfer;｜敏感資料處理在移轉前於 AI 對話完成；
- publication requires explicit site confirmation;｜發布需要網站上的明確確認；
- computer draft authority is 24-hour, one-time, write-only, and draft-only;｜電腦草稿權限為 24 小時、一次性、僅可寫入且只能建立草稿；
- profiles support visibility, deletion, block, and report;｜檔案支援可見性、刪除、封鎖與檢舉；
- introductions require mutual consent.｜引介需要雙方同意。

Every claim should be marked conversation-derived and owner-approved, not verified proof of identity, expertise, or intent. 每項描述都應標示為由對話衍生且經 owner 核准，而不是經驗證的身分、專業能力或意圖證明。


## 10. MVP and Validation｜MVP 與驗證

The hackathon MVP needs to prove: Hackathon MVP 只需要證明：

> An AI-generated, owner-approved pitch can produce a friend match that feels more relevant than a conventional self-written profile. 由 AI 產生並經 owner 核准的介紹，能比傳統自行撰寫的個人檔案產生更相關的朋友配對。

It requires six capabilities: 需要六項能力：

1. phone prompt handoff;｜手機提示詞交接；
2. structured owner-pitch generation;｜結構化 owner pitch 產生；
3. one consolidated AI content review plus a separate site publication review;｜一次整合式 AI 內容審核，加上獨立網站發布審核；
4. universal phone paste-back and an optional computer draft API;｜通用手機貼回流程與可選的電腦草稿 API；
5. explainable friend matching;｜可解釋的朋友配對；
6. strong-match notification and mutual invitation.｜強配對通知與雙向邀請。

Cold start is not the main hackathon question. A pre-recruited group of approximately 10–30 AI users across several interests is sufficient to demonstrate the loop. 冷啟動不是此次 Hackathon 的主要問題。預先招募約 10–30 位、來自多種興趣領域的 AI 使用者，就足以展示完整流程。

### Core Experiment｜核心實驗

Create two profile versions for each participant: 為每位參與者建立兩種檔案：

- **Control:** broad interests and a short self-written bio;｜控制組：廣泛興趣與簡短自我介紹；
- **PitchYourOwner:** agent-derived interests, motivations, active problems, and recurring topics, passed through explicit security/privacy decisions in the AI chat and separately approved for publication on the site.｜PitchYourOwner 組：由 Agent 衍生的興趣、動機、當前問題與反覆主題，先在 AI 對話完成明確 security／privacy 決定，再於網站另行核准發布。

Show one blind match from each system and ask: 比較時不顯示系統名稱，各展示一個配對並詢問：

1. Which person would you rather meet?｜你較想認識哪一位？
2. Does the explanation feel specific to you?｜配對說明是否讓你感覺與自己相關？
3. Would you accept an invitation now?｜你現在會接受邀請嗎？

Then measure mutual invitation and actual conversation. 接著衡量是否產生雙向邀請與實際對話。


## 11. Success Metrics and Risks｜成功指標與風險

**North Star metric｜北極星指標**

> Relevant friend matches accepted per confirmed owner pitch. 每份已確認 owner pitch 所產生的相關朋友配對接受數。

**Pitch quality｜介紹品質**

- prompt-to-preview completion;｜提示詞到預覽完成率；
- AI content-confirmation and site publication-confirmation rates;｜AI 內容確認率與網站發布確認率；
- fields edited or removed;｜編輯或移除欄位比例；
- sensitive-data concern rate;｜敏感資料疑慮率；
- user-rated profile accuracy.｜使用者評估的準確度。

**Transfer quality｜傳輸品質**

- phone paste-back success;｜手機貼回成功率；
- computer draft API success;｜電腦草稿 API 成功率；
- median time from prompt to pitch ready;｜提示詞到 pitch ready 的中位時間；
- expired or duplicate session rate.｜session 過期或重複率。

**Match quality｜配對品質**

- strong-match notification open rate;｜強配對通知開啟率；
- invitation send rate;｜邀請發送率；
- mutual acceptance;｜雙方接受率；
- conversation started;｜實際開始對話；
- “Would you have found this person otherwise?”｜「若沒有此產品，你原本會找到這個人嗎？」

**Main risks｜主要風險**

- **History access:** require scope disclosure and selected-chat fallback.｜**歷史存取：**要求揭露範圍並提供指定對話替代流程。
- **Sensitive data:** instruct the chosen AI to identify, label, omit, or generalize it before transfer; the site does not repeat this processing.｜**敏感資料：**要求選定 AI 在移轉前完成辨識、標記、移除或概括；網站不重複處理。
- **Hallucination:** confidence labels and owner approval.｜**AI 幻覺：**信心標籤與 owner 核准。
- **Token leakage:** short-lived, single-use, write-only, draft-only credentials.｜**Token 洩漏：**短期、一次性、僅可寫入、僅能建立草稿。
- **Identity binding:** bind the session to the phone app and show destination during confirmation.｜**身分綁定：**session 綁定手機 App，確認時顯示目的地。
- **Transfer friction:** share sheets, deep links, QR links, and universal paste fallback.｜**跨 App 摩擦：**分享選單、深層連結、QR 與通用貼上替代方案。
- **Unwanted contact:** mutual consent, rate limits, block, report, and age rules.｜**不受歡迎的聯絡：**雙方同意、頻率限制、封鎖、檢舉與年齡規則。


## Strategic Direction｜策略方向

PitchYourOwner should keep owner review, data minimization, explainable matching, mutual consent, conversation-derived signals, and a phone-completable workflow. PitchYourOwner 應保留 owner 審核、資料最小化、可解釋配對、雙方同意、由對話衍生的訊號，以及可完全在手機上完成的流程。

It should change: 產品應改變：

- developer network → friend discovery for all AI users;｜開發者人脈網路 → 面向所有 AI 使用者的朋友探索；
- work-history profile → owner pitch;｜工作紀錄檔案 → owner pitch；
- complementarity-first → shared interest, motivation, problem, and topic;｜互補優先 → 共同興趣、動機、問題與主題；
- desktop analyzer → phone-orchestrated agent handoff;｜電腦端分析器 → 手機協調的 Agent 交接；
- unstructured onboarding → one consolidated AI content review plus one explicit site publication review.｜非結構化 onboarding → 一次整合式 AI 內容審核加一次明確網站發布審核。

It should add universal paste-back, a computer-only draft HTTP API, sensitive-data instructions for the chosen AI, strong-match notifications, mutual invitations, and owner-only confidence/history-scope labels. 產品應增加通用貼回流程、僅供電腦使用的草稿 HTTP API、提供給選定 AI 的敏感資料指令、強配對通知、雙向邀請，以及僅供 owner 檢視的 confidence／history-scope 標籤。

The strongest positioning is: 最有力的產品定位是：

> **Your agent knows you. Let it pitch you.** 你的 Agent 了解你，讓它來介紹你。

The long-term opportunity is a network where agents do not merely answer questions for their owners. They also recognize when another person's recurring interests, motivations, or problems make that person worth meeting. 長期機會是一個新的網路：Agent 不只替 owner 回答問題，也能辨識何時另一個人的反覆興趣、動機或問題，讓對方成為值得認識的人。

The essential question is: 核心問題是：

> What does this owner's agent know they care about, and whose agent should receive that pitch? 這位 owner 的 Agent 知道他關心什麼，而這份介紹應該傳給誰的 Agent？


## Technical References｜技術參考

- [Codex cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environment)
- [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk)
- [OpenAI Agent sandboxes](https://developers.openai.com/api/docs/guides/agents/sandboxes)


## Original Prompt｜原始提示詞

```text
Now I want you to write a new MD file with the same format as the existing MD file, but the content should be changed. The proposal for version 2 is changed to mapping all people with specific interests. For example, a very professional photographer usually discusses photography techniques with the AI, so there will be a lot of this kind of highly professional discussion in their chat history. Similarly, a professional dancer might be interested in body language, exploring how different degrees or specific ways of performing can yield better results. These would be their topics of interest, and the same applies to other professionals. The problem with our previous approach is that if we only use Claude or Codex chat histories, we only get users who are professional makers or software engineers. Since this is a very limited field, I want to make this even broader to attract more people from different areas. To achieve this, the idea is to change the computer-based application into a phone-based application. The design will work as follows: 1. We have a phone app that provides the user with a prompt. 2. The user passes this prompt to their AI agent session (like ChatGPT or Claude). 3. The agent uses the person's chat history to answer the questions in the prompt. 4. Once the answer is obtained, it is passed back to our app, and their profile is uploaded. The ultimate target of this project is to match people in different sub-areas who share the same interests, discuss the same issues, or are solving the same problems. In this era, we can make this matching process much more efficient. The core problem we need to solve now is how to design this app. What I just described is just the workflow, but the main challenges are: • How do we make users stick to this app? • How do we keep them browsing profiles on the app? • How do we design the pages and the entire immersive workflow to keep users entertained and engaged in the app?So now, can you write another doc with the same format, but using new content?
```
