# PitchYourOwner — Product Design｜產品設計

_Canonical product and experience specification · updated 2026-09-04_

_產品與體驗的唯一正式規格 · 更新於 2026-09-04_

The original [`README.md`](../README.md) is a frozen product memo retained for context.
This document is the current source of truth for what the experience should be.

原始 [`README.md`](../README.md) 是保留作為脈絡的凍結產品備忘錄。本文件是目前產品
體驗的唯一正式依據。

[`design/prototype.html`](../design/prototype.html) is the current interactive visual
exploration. It still contains alternatives from the decision phase; the next prototype
must implement the confirmed direction below. When it differs from this document, this
document wins.

[`design/prototype.html`](../design/prototype.html) 是目前的互動式視覺探索，仍保留決策階段
的多種方案；下一版 prototype 必須實作下列已確認方向。若與本文件不同，以本文件為準。

## 0. Confirmed prototype direction｜已確認的 Prototype 方向

All five product-design decisions were completed on 2026-09-04. These are requirements
for the next prototype and implementation plan; unselected variants remain reference
material, not fallback requirements.

五項產品設計決策已於 2026-09-04 全部完成。以下內容是下一版 prototype 與 implementation
plan 的必要條件；未選方案只保留作為參考，不是備援需求。

| Surface｜畫面 | Confirmed direction｜已確認方向 | Required treatment｜必要處理 |
| --- | --- | --- |
| Confidence｜信心 | Retain for owner review only｜只保留於 owner review | Qualitative `high`／`medium`／`low`; never public and never used in matching｜使用定性等級；不公開，也不參與配對 |
| Start｜開始 | **1b — Typographic promise** | Lead with the promise and preview both owner-review checkpoints｜先呈現產品承諾，並預告兩個 owner review 關卡 |
| Handoff｜交接 | **1d — Prompt is the object** | Make the complete prompt visible and primary; show copy, open, and return actions without unobservable live status｜完整 prompt 為主體；顯示複製、開啟與返回操作，不呈現無法觀測的即時狀態 |
| My Pitch｜我的介紹 | **1f — Document fields** | Show all configured fields in a document layout; move `history_scope` to the top; show confidence only to the owner during review｜以文件式版面呈現全部欄位；`history_scope` 移到頂部；confidence 只在 owner review 顯示 |
| Match detail｜配對詳情 | **1h — Three questions** | Answer the three explanation questions and label the supporting profile evidence; do not expose confidence or a numeric score｜回答三個配對問題並標示所依據的 profile 欄位；不顯示 confidence 或數字分數 |

## 1. Product intent｜產品意圖

PitchYourOwner is a phone-first friend-discovery experience. A person asks the AI that
already knows their interests and questions to prepare an introduction; the person
reviews it; the product uses only the approved abstraction to find a small number of
people worth meeting.

PitchYourOwner 是以手機為核心的朋友探索體驗。使用者請已熟悉其興趣與問題的 AI 準備
一份介紹，親自審核後，產品只使用經核准的抽象資訊，找出少量值得認識的人。

> **Your agent knows you. Let it pitch you.**
>
> **你的 Agent 了解你，讓它來介紹你。**

### Product question｜產品核心問題

Can an AI agent describe its owner well enough to identify a relevant friend?

AI Agent 能否準確介紹自己的 owner，並找出一位真正相關的朋友？

### Audience｜目標使用者

People who already use an AI assistant as a thinking partner and have enough authorized
conversation context to reveal recurring interests, motivations, problems, or questions.
The first validation cohort is approximately 10–30 pre-recruited participants across
several interest areas.

已將 AI 助理當作思考夥伴，且擁有足夠、經授權的對話脈絡，能呈現反覆興趣、動機、問題
或疑問的使用者。首輪驗證對象約為 10–30 位橫跨數個興趣領域的預先招募參與者。

### Outcome under test｜待驗證成果

An AI-generated, owner-approved pitch should produce a friend match that feels more
relevant than a conventional self-written profile.

由 AI 產生並經 owner 核准的介紹，應比傳統自行撰寫的個人檔案帶來更相關的朋友配對。

### Non-goals｜非目標

- Recruiting, professional networking, dating, follower growth, or maximizing time in
  product.｜招募、職業人脈、交友約會、追蹤者成長或最大化產品使用時間。
- Group matching, events, or messaging beyond making an introduction.
  群組配對、活動，或完成引介後的站內訊息功能。
- Verifying identity, expertise, or intent. A pitch is a reviewed interpretation, not
  proof.｜驗證身分、專業能力或意圖。介紹是經審核的詮釋，不是證明。

## 2. Experience principles｜體驗原則

1. **The agent prepares; the owner publishes.** Reviewing a grounded draft is easier
   than writing from a blank page, but the owner remains the final editor and publisher.
   **Agent 準備內容；owner 決定發布。** 審核有依據的草稿比從空白開始容易，但 owner
   保有最終編輯與發布權。
2. **Relevance comes from shared depth.** Match on a specific interest, present
   motivation, active problem, or recurring question—not a broad category.
   **相關性來自共享的深度。** 配對依據是具體興趣、目前動機、當前問題或反覆疑問，
   不是廣泛分類。
3. **Consent has two distinct checkpoints.** The AI chat asks once only for decisions
   about specific detected security/privacy concerns and confirmation that those
   decisions may be applied. After paste-back, PitchYourOwner asks once for final
   publication approval. Silence, ambiguity, or edits without the relevant approval
   never count as consent.
   **同意有兩個目的不同的關卡。** AI 對話頁只針對實際偵測到的 security／privacy 疑慮，
   一次取得處理選擇與套用確認；貼回後，
   PitchYourOwner 再一次取得最終發布授權。未回覆、模糊回覆，或僅修改但未完成相應核准，
   都不構成同意。
4. **The data boundary is visible.** The AI discloses what context it could access and
   completes sensitive-data handling before transfer. The site shows exactly which
   final profile fields it will store and does not repeat sensitive-data processing.
   **資料邊界必須可見。** AI 說明實際可存取的脈絡，並在傳輸前完成敏感資料處理；網站
   顯示將儲存的最終 profile 欄位，不重複執行敏感資料處理。
5. **A match explains itself.** The reason to meet must be concrete and readable without
   a score or opaque ranking language.
   **配對必須能自我解釋。** 值得認識的理由需具體且可讀，不依賴分數或不透明的排序語言。
6. **The product creates introductions, not engagement loops.** A few strong candidates
   and honest empty states are preferable to filler.
   **產品促成引介，不製造互動循環。** 少量強候選人與誠實的空白狀態，勝過湊數內容。

## 3. Core user journey｜核心使用者旅程

> Understand the promise → choose an AI → hand off the prompt → confirm the complete
> security/privacy decisions in the AI → paste JSON → edit fields → final publish review → understand a
> match → invite → mutually accept
>
> 理解承諾 → 選擇 AI → 交付提示詞 → 在 AI 處理具體 security／privacy 決定 → 貼回 JSON → 編輯欄位 →
> 最終發布審核 → 理解配對 → 邀請 → 雙方接受

### 1. Understand and begin｜理解並開始

The start screen states the outcome, estimated effort, supported assistants, and the two
owner-review checkpoints. The user selects an assistant and chooses **Let my agent pitch me**.

開始頁說明成果、預估投入時間、支援的助理，以及兩個 owner review 關卡。使用者選擇助理
並點選 **Let my agent pitch me**。

### 2. Hand off to the chosen AI｜交付給選定的 AI

The product gives the user one clear sequence—**Create prompt → Ask your AI → Resolve
security/privacy items → Copy JSON back**—and lets them copy or share the prompt. A visible expiry prevents
surprise when an old handoff can no longer be completed.

產品呈現單一明確流程：**建立提示詞 → 詢問你的 AI → 處理 security／privacy 項目 → 複製 JSON 回網站**，並允許
複製或分享提示詞。清楚顯示到期時間，避免舊交接失效時造成意外。

### 3. Generate a grounded proposal｜產生有依據的提案

The AI uses only context the owner authorized and the assistant can actually access. It
produces one complete proposal and generalizes sensitive details. It prioritizes repeated or explicitly important signals,
distinguishes user-stated facts from cross-conversation inference, and excludes resolved
or one-off matters from claims about current attention. When context is insufficient, it
says so and offers selected chats or a user-provided export; it never invents a profile
or starts a forced multi-round interview.

AI 只使用 owner 已授權且助理確實可存取的脈絡，產生一份完整提案，並概括化敏感細節。
內容優先採用反覆出現或被明確指出為重要的訊號，區分使用者
明確陳述與跨對話歸納，並排除已解決或一次性的事項，不將其描述為目前關注。若脈絡不足，
AI 必須坦白說明，並提供指定對話或使用者匯出資料的方式；不得虛構檔案，也不得強迫進入
多輪訪談。

### 4. Resolve transfer risks, then authorize publication｜先處理傳輸風險，再授權發布

The AI chat first shows a concise synthesis instead of expanding every schema field
line by line. It scans the proposed transfer across authentication secrets, private
infrastructure, identifying personal data, third-party data, organizational secrets,
highly sensitive personal data, re-identification combinations, and sharing rights.
It asks only about issues actually detected—never whether the profile matches chat
history and never a generic or open profile question. Every issue has an `S1`, `S2`, ...
identifier, a concrete risk, and explicit remove/replace/authorized-keep options where
appropriate. The owner chooses all options in one message and adds the exact security
confirmation phrase. After every decision and explicit confirmation, the AI returns
exactly one parseable profile JSON object with no surrounding prose or Markdown; it
does not publish the profile.

AI 對話頁先顯示精簡的整體摘要，不把 schema 欄位逐欄展開，並針對 authentication secrets、
私人基礎設施、可識別個人資料、第三方資料、組織機密、高敏感個資、組合識別風險與分享
權限掃描擬傳輸內容。它只詢問實際偵測到的問題，不詢問 profile 是否吻合聊天歷史，也不問
一般或開放式 profile 問題。每項問題使用 `S1`、`S2`… 編號，說明具體風險，並在適用時提供
明確的移除／替換／經授權保留選項。Owner 在一則訊息選完所有項目並加入確切的 security
確認語。完成全部決定與明確確認後，AI 只回傳一個可直接解析、前後沒有說明或 Markdown 的
profile JSON，不直接發布。

On PitchYourOwner, the owner pastes the JSON into an editable field form. **Continue**
opens a separate read-only review. **Confirm & upload** is the only publication action;
**Back to edit** preserves all edits. The site does not show a privacy ledger and does
not detect, filter, label, or rewrite sensitive data.

回到 PitchYourOwner 後，owner 將 JSON 貼入可編輯欄位表單。點選 **Continue** 進入獨立的
唯讀審核頁；只有 **Confirm & upload** 會發布，**Back to edit** 會保留所有修改。網站不顯示
privacy ledger，也不偵測、過濾、標示或改寫敏感資料。

### 5. See My Pitch｜查看我的介紹

The published pitch becomes the owner’s controlled representation in the product. The
owner can understand every claim, see its status, change visibility, refresh the pitch,
or delete it.

發布後的介紹成為 owner 在產品中可控的呈現。Owner 能理解每項描述、查看狀態、調整
可見性、重新產生介紹或刪除。

### 6. Understand a match｜理解配對

The product surfaces a small number of candidates only when it can name meaningful
shared attention. Each match explains what both people care about, why it matters now,
and what they could discuss. No numeric score is shown.

產品只在能指出有意義的共同關注時，呈現少量候選人。每個配對都說明雙方共同關心什麼、
此刻為何重要，以及可以聊什麼。不顯示任何數字分數。

### 7. Invite with mutual consent｜以雙方同意完成邀請

Either owner may send an invitation. The recipient sees the shared reason and a
suggested opening question, then chooses **Accept** or **Not now**. Only acceptance
creates an introduction. A decline reveals no private reason to the sender.

任一 owner 都能發出邀請。接收者會看到共同理由與建議的開場問題，並選擇 **Accept** 或
**Not now**。只有接受後才形成引介；拒絕時不向發送者揭露任何私人理由。

## 4. Information architecture｜資訊架構

The signed-in product has four areas. Onboarding is a temporary journey into them, not a
fifth permanent destination.

登入後的產品只有四個區域。Onboarding 是進入這四區的暫時旅程，不是第五個常駐目的地。

| Area｜區域 | User question｜使用者問題 | Primary content｜主要內容 |
| --- | --- | --- |
| **Matches｜配對** | Who may be worth meeting, and why?｜誰值得認識，為什麼？ | A short list of explainable matches｜少量可解釋的配對 |
| **Invitations｜邀請** | Who is waiting for my decision?｜誰在等我的決定？ | Incoming, sent, and accepted introductions｜收到、送出與已接受的引介 |
| **My Pitch｜我的介紹** | What is my agent sharing about me?｜我的 Agent 正在分享什麼？ | Approved pitch, scope, confidence, visibility｜已核准介紹、範圍、信心與可見性 |
| **Settings｜設定** | How do I control privacy and safety?｜如何控制隱私與安全？ | Visibility, language, block, report, export, delete｜可見性、語言、封鎖、檢舉、匯出、刪除 |

## 5. Screen and interaction specification｜畫面與互動規格

### Start｜開始

- Lead with the promise and one primary action.｜以產品承諾與單一主要操作開場。
- Show supported AI choices, estimated time, and the owner-review checkpoints before
  the user acts.｜操作前顯示支援的 AI、預估時間與 owner review 關卡。
- Do not require profile forms before the value proposition is understood.
  在使用者理解價值主張前，不要求填寫個人檔案表單。

### Prompt handoff｜提示詞交接

- Show current step, remaining steps, expiry, and clear **Copy prompt** and **Share**
  actions.｜顯示目前步驟、剩餘步驟、到期時間，以及清楚的 **Copy prompt** 與 **Share** 操作。
- Confirm successful copy without interrupting progress.｜以不中斷流程的方式確認複製成功。
- When expired, explain what happened and provide one action to create a fresh handoff.
  到期時說明原因，並提供單一操作重新建立交接。

### Import, edit, and final review｜匯入、編輯與最終審核

- Accept pasted or shared structured content, then render the full pitch in human
  language before asking for approval.｜接收貼上或分享的結構化內容後，先以人類可讀方式
  顯示完整介紹，再要求核准。
- Name missing or malformed content precisely; never partially publish.
  精確指出缺少或格式錯誤的內容；不得部分發布。
- Keep edit, cancel, and publish consequences explicit.｜清楚說明編輯、取消與發布的後果。

### My Pitch｜我的介紹

- Lead with the summary, then group details into **Interests, Motivations, Active
  Problems, Recurring Topics,** and **Friend Intent**.
  先顯示摘要，再將細節分為 **興趣、動機、當前問題、反覆主題** 與 **交友意圖**。
- Show **conversation-derived**, **owner-approved**, and **currently exploring** where
  relevant. These labels communicate provenance, not achievement.
  在適當位置顯示 **由對話衍生、owner 已核准、目前正在探索**。這些標籤說明來源，
  不代表成就。
- Show accessible-history scope and confidence without exposing raw evidence.
  顯示可存取的歷史範圍與信心程度，但不揭露原始證據。

### Matches and Match Detail｜配對與配對詳情

- The list prioritizes the shared reason over biography, avatar, or status.
  列表的視覺優先順序以共同理由為先，高於簡介、頭像或狀態。
- Every detail answers: **What do we care about in common? Why does it matter to both
  of us now? What could we discuss?**
  每個詳情都回答：**我們共同關心什麼？此刻為何對雙方重要？我們可以聊什麼？**
- Match actions are **Invite** and **Not now**. No score, follower count, popularity,
  swipe gesture, or urgency device appears.
  配對操作為 **Invite** 與 **Not now**。不得出現分數、追蹤者數量、人氣、滑動手勢或
  製造急迫感的設計。
- A zero-match state is honest and explains that the product will not pad results.
  零配對狀態需誠實，並說明產品不會為了湊數而填充結果。

### Invitations｜邀請

- Incoming invitations show the shared reason and opening question before identity
  details that are unnecessary to decide.｜收到的邀請先顯示共同理由與開場問題，再顯示
  決策所需的身分資訊。
- Recipient actions are **Accept** and **Not now**. The latter is neutral, private, and
  not framed as rejection.｜接收者操作為 **Accept** 與 **Not now**。後者保持中性與私密，
  不塑造成拒絕。
- Prevent immediate repeated invitations after **Not now**.
  選擇 **Not now** 後，避免對方立即重複邀請。

### Settings｜設定

- Keep privacy and safety controls understandable without technical vocabulary.
  隱私與安全控制不使用技術術語也能理解。
- Visibility, block, report, export, and delete are easy to find and explain their
  consequences before confirmation.｜可見性、封鎖、檢舉、匯出與刪除容易找到，並在確認前
  說明後果。

## 6. Pitch content model｜介紹內容模型

The pitch contains seven public/matchable profile dimensions plus configurable owner-only
confidence metadata. Field names are not UI labels; the UI
uses natural language appropriate to the selected language.

介紹包含七個可公開／可配對的 profile 維度，以及可設定、僅 owner 可見的 confidence metadata。
欄位名稱不是 UI 標籤；介面應依選定語言使用自然文案。

| Part｜部分 | Purpose｜用途 |
| --- | --- |
| Summary｜摘要 | A concise, specific introduction｜簡潔而具體的介紹 |
| Interests｜興趣 | Specific subjects of sustained attention｜持續關注的具體主題 |
| Motivations｜動機 | Why those subjects matter now｜這些主題此刻為何重要 |
| Active problems｜當前問題 | What the owner is trying to understand or change｜Owner 正試圖理解或改變什麼 |
| Recurring topics｜反覆主題 | Questions the owner returns to｜Owner 持續回到的問題 |
| Friend intent｜交友意圖 | The person or conversation they hope to find｜希望找到的人或對話 |
| History scope｜歷史範圍 | What context was and was not available｜哪些脈絡可用、哪些不可用 |
| Confidence｜信心（owner only） | Qualitative review aid; never public and never used in matching｜定性的審核輔助；不公開且不參與配對 |

Specificity is the quality bar: **“low-light street photography”** is useful;
**“photography”** alone is not. Claims should describe current attention without
presenting inference as identity or expertise.

具體性是品質標準：**「低光源街頭攝影」**有用；只有**「攝影」**則不足。描述應呈現目前
關注，不能把推論當作身分或專業能力。

## 7. Matching behavior｜配對行為

A viable match shares at least one concrete interest, motivation, active problem, or
recurring topic. Language, safety, age, visibility, location preference, and availability
may exclude a candidate; they never become popularity signals.

可行配對至少共享一項具體興趣、動機、當前問題或反覆主題。語言、安全、年齡、可見性、
地點偏好與時間可用性可排除候選人，但絕不成為人氣訊號。

The explanation is the product output. Ranking logic may evolve, but no match appears
unless the interface can name the shared evidence in plain language. Different domains
may still connect when the underlying concern is specific—for example, portrait
photography and dance through an interest in how posture communicates emotion.

配對解釋本身就是產品產出。排序邏輯可以演進，但介面若無法以白話指出共同依據，就不得
呈現該配對。不同領域仍可能因具體的底層關注而連結，例如人像攝影與舞蹈都關心姿勢如何
傳達情緒。

## 8. Trust, privacy, and safety｜信任、隱私與安全

> Authorized private context → inference inside the chosen AI → abstraction → sensitive
> detail check and specific security/privacy decisions in the AI → final JSON → publication approval
> in PitchYourOwner → shared pitch
>
> 經授權的私密脈絡 → 在選定 AI 中推論 → 抽象化 → 在 AI 進行敏感細節檢查與具體 security／privacy 決定 →
> 最終 JSON → 在 PitchYourOwner 授權發布 → 分享介紹

- The generated prompt instructs the chosen AI to identify, label, omit, or generalize
  sensitive content and show that handling to the owner before transfer. PitchYourOwner
  does not repeat this processing and does not receive a sensitive-data ledger.
  產生的提示詞要求選定 AI 在傳輸前辨識、標示、移除或概括敏感內容，並向 owner 顯示處理
  結果。PitchYourOwner 不重複此處理，也不接收 sensitive-data ledger。
- Every shared claim is visibly owner-approved and conversation-derived.
  每項分享的描述都明確標示為 owner 已核准且由對話衍生。
- Unapproved pitches are invisible and never used for matching.
  未核准的介紹不可見，也不得用於配對。
- Deleting a pitch removes it from future and already-surfaced match sets.
  刪除介紹後，需從未來及已呈現的配對集合中移除。
- Blocking, reporting, and invitation limits are available wherever contact risk
  appears.｜凡出現接觸風險之處，都需提供封鎖、檢舉與邀請頻率限制。
- Notification previews remain general; sensitive topics and full explanations appear
  only after the product is opened.｜通知預覽保持概括；敏感主題與完整解釋只在開啟產品後顯示。

## 9. Visual and inclusive design direction｜視覺與共融設計方向

- **Character:** calm, human, editorial, and trustworthy—an agent-mediated introduction,
  not a dating marketplace or productivity dashboard.
  **性格：**冷靜、人性、具編輯感且可信賴；像由 Agent 協助的引介，不像交友市集或
  生產力儀表板。
- **Hierarchy:** the pitch and the reason for a match are the visual protagonists.
  Navigation, metadata, and provenance labels remain quiet but legible.
  **層級：**介紹內容與配對理由是視覺主角；導覽、中繼資料與來源標籤低調但清楚可讀。
- **Restraint:** one clear primary action per state. Avoid decorative metrics, dense
  dashboards, gamification, novelty gestures, and artificial urgency.
  **克制：**每個狀態只有一個清楚的主要操作。避免裝飾性指標、密集儀表板、遊戲化、
  新奇手勢與人造急迫感。
- **Phone-first:** design at 375px; remain usable without clipping or horizontal scroll
  at 320px.｜**手機優先：**以 375px 設計，並在 320px 下維持可用，不裁切或水平捲動。
- **Accessibility:** touch targets are at least 44×44px; text meets WCAG AA contrast;
  every control has a visible or programmatic label and works without gesture-only
  access.｜**無障礙：**觸控目標至少 44×44px；文字符合 WCAG AA 對比；每個控制項都有
  可見或程式化標籤，且不依賴手勢才能操作。
- **Language:** all user-facing copy is available in English and Traditional Chinese;
  the interface uses the user’s selected language rather than duplicating both in every
  component.｜**語言：**所有使用者可見文案皆提供英文與繁體中文；介面依使用者選擇
  顯示語言，不在每個元件中同時重複兩種語言。

## 10. Required states and edge cases｜必要狀態與邊界案例

| Situation｜情況 | Experience requirement｜體驗要求 |
| --- | --- |
| AI has insufficient context｜AI 脈絡不足 | Disclose the limitation; offer selected chats or an export; do not fabricate｜說明限制；提供指定對話或匯出資料；不得虛構 |
| Handoff expires｜交接到期 | Explain expiry and offer one-tap restart｜說明到期並提供一鍵重啟 |
| Imported pitch is malformed｜匯入介紹格式錯誤 | Name the missing/problematic part; preserve input; publish nothing｜指出缺少或有問題的部分；保留輸入；不得發布 |
| Owner edits the pitch｜Owner 修改介紹 | Review and publish the edited version, never the superseded draft｜審核並發布修改後版本，不得發布已被取代的草稿 |
| No viable matches｜沒有可行配對 | Show an honest empty state; never pad recommendations｜顯示誠實的空白狀態；不得填充推薦 |
| Both owners invite simultaneously｜雙方同時邀請 | Resolve as one accepted introduction｜收斂為一筆已接受的引介 |
| Owner chooses Not now｜Owner 選擇 Not now | Keep the reason private and prevent immediate re-invitation｜保持原因私密，並避免立即重新邀請 |
| Owner deletes the pitch｜Owner 刪除介紹 | Remove it from all match surfaces and explain the consequence before deletion｜從所有配對介面移除，並在刪除前說明後果 |

Every asynchronous surface must also define loading, success, empty, error, retry, and
offline/interrupted states in context; a spinner without an explanation is insufficient.

每個非同步介面都需在脈絡中定義載入、成功、空白、錯誤、重試與離線／中斷狀態；只有
沒有說明的轉圈指示並不足夠。

## 11. Experience acceptance criteria｜體驗驗收標準

The experience is ready to evaluate when all of the following are observable:

當以下條件皆可觀察時，體驗才可進入評估：

1. A new user can explain the promise and the two owner-review checkpoints before beginning.
   新使用者在開始前能說明產品承諾與兩個 owner review 關卡。
2. The entire journey can be completed on a phone, including the universal copy/share
   fallback.｜完整旅程能在手機上完成，包含通用的複製／分享備援。
3. The owner completes one batch of decisions covering every detected security/privacy
   issue in the AI and one final
   publication confirmation in PitchYourOwner. The site shows every imported field,
   supports editing before the read-only review, and preserves edits when returning.
   Owner 在 AI 以一批回答處理所有實際偵測到的 security／privacy 問題，並在 PitchYourOwner 完成一次最終發布確認；
   網站顯示所有匯入欄位、在唯讀審核前允許編輯，返回時保留修改。
4. No unapproved pitch appears to another person or participates in matching.
   未核准的介紹不會被他人看見，也不會參與配對。
5. Every surfaced match names concrete shared attention and answers the three Match
   Detail questions.｜每個呈現的配對都指出具體的共同關注，並回答配對詳情的三個問題。
6. A pair sharing only a broad category is not surfaced.｜只共享廣泛分類的兩人不會被呈現。
7. No user-facing surface exposes private decline reasons, numeric match scores, or
   popularity signals.｜任何使用者介面都不揭露私密拒絕原因、數字配對分數或人氣訊號。
8. An introduction appears only after the recipient accepts, including simultaneous
   invitation cases.｜只有接收者接受後才形成引介，包含雙方同時邀請的情況。
9. Expired handoffs, malformed imports, insufficient AI context, zero matches, and
   deletion each have an understandable recovery or completion state.
   交接到期、匯入錯誤、AI 脈絡不足、零配對與刪除，都有可理解的復原或完成狀態。
10. The affected journey passes at 375px and 320px, with 44px touch targets, WCAG AA
    text contrast, labelled controls, and no gesture-only action.
    受影響旅程在 375px 與 320px 下通過檢查，包含 44px 觸控目標、WCAG AA 文字對比、
    有標籤的控制項，且沒有只能靠手勢完成的操作。

## 12. Validation｜驗證方式

The primary measure is **relevant friend matches accepted per confirmed owner pitch**.
For each participant, compare one blind match from a conventional self-written profile
with one from an owner-approved agent pitch, then ask:

主要指標是 **每份已確認 owner pitch 所產生的相關朋友配對接受數**。為每位參與者各展示
一個傳統自寫檔案與一個經 owner 核准的 Agent 介紹所產生的盲測配對，並詢問：

1. Which person would you rather meet?｜你較想認識哪一位？
2. Does the explanation feel specific to you?｜配對說明是否讓你感覺與自己相關？
3. Would you accept an invitation now?｜你現在會接受邀請嗎？

Also observe where people abandon the prompt-to-pitch journey, what they edit or remove,
whether they trust the privacy explanation, whether invitations are mutually accepted,
and whether a conversation actually begins.

同時觀察使用者在提示詞到介紹的旅程中於何處離開、修改或移除什麼、是否信任隱私說明、
邀請是否獲雙方接受，以及對話是否真的開始。
