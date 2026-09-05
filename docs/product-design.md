# PitchYourOwner — Product behavior｜產品行為

This document is the canonical product and experience contract for the implemented
application. The repository
[`README.md`](../README.md) owns the project overview, while
[`packages/cloud/README.md`](../packages/cloud/README.md) owns implementation,
configuration, API, persistence, and deployment details.

本文件是目前已實作產品與體驗的唯一正式契約。專案總覽由
[`README.md`](../README.md) 負責；實作、設定、API、資料保存與部署則由
[`packages/cloud/README.md`](../packages/cloud/README.md) 負責。

## 1. Product contract｜產品契約

PitchYourOwner helps people find a small number of relevant human friends through an
owner-approved pitch derived by an AI assistant the owner already uses. Relevance comes
from specific recurring attention: interests, motivations, active problems, and recurring
topics.

PitchYourOwner 讓使用者透過自己已在使用的 AI 助理，從實際可存取的脈絡整理一份經 owner
核准的介紹，再以具體、反覆出現的興趣、動機、當前問題與討論主題，找出少量值得認識的
人類朋友。

> **Your agent knows you. Let it pitch you.**
>
> **你的 Agent 了解你，讓它來介紹你。**

The application does not verify identity, expertise, or intent. A pitch is a
conversation-derived, owner-approved description of current attention, not proof. The
product is not recruiting, professional networking, dating, a public directory, a
follower network, or an engagement feed.

本產品不驗證身分、專業能力或意圖。Pitch 是由對話衍生、經 owner 核准的目前關注描述，
不是證明。產品不是招募、職業人脈、約會、公開名錄、追蹤者網路或互動 feed。

## 2. Implemented owner journey｜已實作的 Owner 旅程

### Start and sign-in｜開始與登入

The start screen states the promise and previews two separate review checkpoints:
security/privacy decisions in the chosen AI and final publication approval in
PitchYourOwner. Sign-in uses an emailed six-digit OTP; there is no password.

開始頁先說明產品承諾與兩個不同的審核關卡：在選定 AI 中處理 security/privacy 決定，
以及回到 PitchYourOwner 進行最終發布核准。登入使用 Email 六位數 OTP，不設密碼。

After verification, an owner with a published profile goes to Matches. An owner without a
published profile resumes a local draft when one exists, otherwise goes to Choose AI.

驗證後，已有 published profile 的 owner 進入 Matches；尚未發布 profile 的 owner 若有本機
草稿則接續草稿，否則進入 Choose AI。

### Choose and hand off to an AI｜選擇並交接給 AI

The owner selects ChatGPT, Claude, or another assistant. The Hackathon interface and
deployed prompt are Traditional Chinese only. The website loads the complete prompt and
makes it visible.

- ChatGPT and Claude: the primary action attempts to copy the prompt, puts the full prompt
  in the destination URL's `q` parameter, and opens the provider.
- Other AI: the primary action uses the Web Share API when available, otherwise copies
  the prompt.
- A visible copy action remains available as the fallback.

Owner 選擇 ChatGPT、Claude 或其他 AI。Hackathon 介面與部署的 prompt 只使用繁體中文；
網站會載入並顯示完整 prompt。

- ChatGPT／Claude：主要操作會嘗試複製 prompt，將全文放入目的網址的 `q` 參數後開啟
  provider。
- 其他 AI：支援時使用 Web Share API，否則複製 prompt。
- 畫面始終保留可見的 Copy 備援。

The handoff state stores the selected assistant, locale, prompt, and launch timestamp in
the browser. When the owner returns, Paste final JSON becomes the primary action and the
prompt is collapsed. PitchYourOwner does not claim to observe what the external AI is
doing.

交接狀態會在瀏覽器保存選定 AI、語言、prompt 與開啟時間。Owner 回來後，Paste final JSON
會成為主要操作，prompt 則收合。PitchYourOwner 不宣稱能觀測外部 AI 的處理狀態。

### External AI response contract｜外部 AI 回應契約

The executable prompts are
[`get_info_prompt_en.md`](get_info_prompt_en.md) and
[`get_info_prompt_ch.md`](get_info_prompt_ch.md). They require the assistant to:

1. use only context it can actually access and the owner authorized;
2. research the owner's field from accessible context and make the professional craft,
   active problems, and recurring questions vivid without fabricating expertise;
3. produce a concise synthesis rather than a field-by-field questionnaire;
4. list the concrete potentially sensitive topics found in the proposed transfer;
5. ask one consolidated exclusion question, accepting topic numbers or
   `none`／`全部保留`; and
6. then return exactly one profile JSON object with no prose or Markdown.

可執行 prompts 要求 AI：

1. 只使用實際可存取且 owner 已授權的脈絡；
2. 從可存取脈絡研究 owner 的專業領域，具體呈現其 craft、正在解的問題與反覆追問，
   但不捏造專業能力；
3. 先給精簡整體摘要，不進行逐欄問卷；
4. 列出擬傳輸內容中具體、可辨識的潛在敏感主題；
5. 只問一次「哪些主題應該排除？」，接受編號或 `none`／`全部保留`；以及
6. 接著只輸出一個 profile JSON object，不附 prose 或 Markdown。

The exact interaction copy is: `哪些主題應該排除？若要排除，回覆編號，例如：2、4；若全部保留，回覆 none 或 全部保留。`
This AI-chat answer authorizes generation of the transfer payload; it does not publish
anything.

### Import, edit, and publish｜匯入、編輯與發布

The import screen accepts the profile object directly and also unwraps a top-level
`profile` object for recovery compatibility. It rejects non-JSON text, known transport
debug payloads, review previews, unknown profile fields, malformed values, missing
confidence entries, and configured size-limit violations.

Import 畫面可直接接收 profile object，也會為了復原相容性解開最外層的 `profile` object。
非 JSON 文字、已知傳輸 debug payload、review preview、未知 profile 欄位、格式錯誤、
缺少 confidence 或超過設定上限的內容都會被拒絕。

Valid content opens the original final-review document as a directly editable page.
`history_scope` appears first; `animal_persona`, narrative text, and individual topic
blocks can be edited inline; topic blocks can be added or removed; and qualitative
confidence controls appear beside all six target fields. Edits are saved in browser
storage. The JSON paste page and this visual edit/final-confirmation page are the only
two PitchYourOwner import screens.

合法內容會直接開啟原本 final review 的文件式畫面並可直接編輯；`history_scope` 置頂，
`animal_persona`、段落文字與每個主題 block 都可行內修改，主題可新增或刪除，六個目標
欄位旁都顯示定性 confidence。修改會保存於瀏覽器。JSON 貼上頁與這個視覺化編輯／最終
確認頁，是 PitchYourOwner 匯入流程僅有的兩個畫面。

There is no separate `display_name` input. The owner-approved `animal_persona` is the
Hackathon profile's presentation name. Only **確認並上傳** on the visual-edit page
creates the `approvedAt` value and sends the strict publish envelope. The server
validates the envelope again and publishes atomically; no client-only state counts as
consent. Failed retries reuse the same locally persisted idempotency key and approval
timestamp while the draft is unchanged.

流程沒有獨立的 `display_name` 輸入；owner 核准的 `animal_persona` 就是 Hackathon profile
的顯示名稱。只有視覺化編輯頁的 **確認並上傳** 會建立 `approvedAt` 並送出嚴格 publish
envelope；server 會再次驗證並以原子交易發布。草稿未改變時，失敗重試沿用保存在本機的
同一個 idempotency key 與核准時間。任何僅存在 client 的狀態都不構成同意。

### Match and invitation｜配對與邀請

After publication, the browser starts matching through the authenticated API and polls
Matches every six seconds for up to three minutes while results are pending. An empty
state never inserts filler profiles. Profile publication is committed before matching is
triggered; a matching-trigger failure keeps the profile published and shows a recoverable
matching-only state instead of reporting a publish failure.

發布後，瀏覽器透過 authenticated API 啟動 matching；結果尚未完成時，Matches 最多三分鐘
每六秒檢查一次。空白狀態不會加入 filler profile。Profile publication 會先完成並在本機
確認，再觸發 matching；matching trigger 失敗時 profile 仍維持已發布，只顯示可恢復的
配對狀態，不會誤報為發布失敗。

Every shown match answers:

1. What do both owners care about?
2. Why does it matter now?
3. What could they discuss?

Evidence labels name the profile fields supporting the explanation. The interface does
not expose the embedding score, LLM score, confidence, follower count, popularity, or
ranking language.

每個顯示的 match 都回答：雙方共同關心什麼、為何此刻重要、現在可以討論什麼。Evidence
labels 會指出說明所依據的 profile 欄位。介面不顯示 embedding score、LLM score、
confidence、追蹤者數、人氣或排名語言。

The suggesting owner can press Invite. Only that explicit action creates one recipient
email and one single-use 14-day token. Opening the email link is read-only; the recipient
then explicitly chooses Accept or Not now on the dedicated page. The Invite click is the
sender's consent, so Accept creates the mutual connection and two connection emails.
Contact email appears only in each authenticated connection view after mutual consent.

建議方可按 Invite；只有這個明確操作才會建立一封收件者 Email 與一個 14 天、單次使用
token。開啟 Email 連結只會預覽，收件者必須在專用頁明確選 Accept 或 Not now。Invite
本身就是寄件者同意，因此收件者 Accept 後會建立雙向 connection 與兩封 connection
Email。只有互相同意後，各自的 authenticated connection 頁才顯示對方 Email。

## 3. Profile contract｜Profile 契約

The machine-readable authority is
[`config/pitchyourowner-profile-schema.json`](../config/pitchyourowner-profile-schema.json).
Do not duplicate field limits in prompts, UI code, or documentation.

| Data | Use | Visibility |
| --- | --- | --- |
| `summary` | Matching and owner pitch | Owner and matched peers |
| `interests` | Matching and owner pitch | Owner and matched peers |
| `motivations` | Matching and owner pitch | Owner and matched peers |
| `active_problems` | Matching and owner pitch | Owner and matched peers |
| `recurring_topics` | Matching and owner pitch | Owner and matched peers |
| `friend_intent` | Matching and owner pitch | Owner and matched peers |
| `history_scope` | Discloses accessible context | Owner only |
| `animal_persona` | Memorable professional presentation metaphor | Public |
| `confidence` | Qualitative extraction-review metadata | Edit and final review only |

`confidence` is required and contains exactly the six matchable field names with
`high`, `medium`, or `low` values. It is never a truth score. The server excludes
`history_scope` and `confidence` from both the matching document and peer responses.

`confidence` 為必填，且必須剛好包含六個可配對欄位，值只能是 `high`、`medium` 或
`low`；它不是事實分數。Server 會從 matching document 與 peer response 同時排除
`history_scope` 和 `confidence`。

## 4. Data and consent boundaries｜資料與同意邊界

```text
Authorized context
  → inference and sensitive-data handling inside the chosen AI
  → owner-confirmed profile JSON
  → editable PitchYourOwner final document
  → explicit 確認並上傳 publication approval
  → published profile used for matching
```

- PitchYourOwner never receives the source conversation history.
- Sensitive-data detection, removal, or generalization happens in the chosen AI before
  transfer. The website does not repeat that processing or store a privacy ledger.
- Authentication secrets and system-control material must be removed by the AI prompt;
  unknown sharing rights cannot be treated as consent.
- Every published version stores the owner approval timestamp and a stable payload hash.
- Peer responses contain only the six shareable fields and, after mutual acceptance,
  contact email.
- Deleting an owner profile removes its versions, drafts, match pointers, associated
  match records, idempotency receipts, and known sessions.

- PitchYourOwner 不接收來源對話紀錄。
- 敏感資料偵測、移除或概括在傳輸前由選定 AI 完成；網站不重複處理，也不保存 privacy
  ledger。
- Authentication secrets 與系統控制資料必須由 AI prompt 移除；分享權限未知不等於同意。
- 每個 published version 保存 owner 核准時間與 stable payload hash。
- Peer response 只包含六個可分享欄位；雙方接受後才加上 contact email。
- 刪除 owner profile 會移除其版本、草稿、match pointers、關聯 match records、
  idempotency receipts 與已知 sessions。

## 5. Matching contract｜配對契約

The matcher stores one field embedding for `interests`, `active_problems`, `motivations`,
`recurring_topics`, and `friend_intent`. It materializes two directed edges per eligible
pair and combines cosine similarity with these weights:

- 30% specific-interest overlap
- 25% active-problem overlap
- 20% motivation alignment
- 15% recurring-topic overlap
- 10% friend-intent compatibility

Every eligible pair is persisted with both profile-version IDs, five component scores,
the composite score, and deterministic explanations. Current profile status and version
are checked again at read time. Numeric scores are internal and never displayed. Normal
matching excludes all test profiles; isolated E2E is the only environment allowed to
include them. Result-set snapshots expire after 30 days.

每個符合資格的 pair 都會保存雙方 profile version、五個分項分數、加權總分與確定性的
三段說明；讀取時再檢查目前公開狀態與版本。數字分數只供內部排序，不顯示給使用者。
一般 matching 排除所有 test profile，只有隔離 E2E 環境可明確納入；result set 30 天後到期。

## 6. Current interface ownership｜目前介面範圍

The signed-in application has four persistent areas:

| Area | Current responsibility |
| --- | --- |
| Matches | Suggested, incoming, outgoing, connected, searching, and empty states |
| Invitations | Incoming, outgoing, and connected matches |
| My Pitch | Published owner profile without confidence; edit and regenerate entry points |
| Settings | Public/Private status, Computer API capability, delete, sign out, Privacy, Terms, and Support |

Onboarding uses `/assistant`, `/handoff`, and `/import` without the
persistent navigation. The browser restores authentication progress, prompt handoff,
draft edits, publish-retry identity, demo state, and recent matching progress from
`localStorage`.

Onboarding 使用 `/assistant`、`/handoff` 與 `/import`，不顯示常駐 navigation。瀏覽器會從
`localStorage` 復原登入進度、prompt handoff、草稿修改、發布重試識別、demo state 與近期
matching 進度。舊 `/review` URL 會安全返回 `/import`，不會自動發布。

The Hackathon UI is Traditional Chinese only. Layout is constrained to a 430px mobile
column, includes a 320px compact breakpoint, exposes a skip link and live region, and
supports reduced-motion preferences.

Hackathon 介面只使用繁體中文。版面限制在 430px 手機欄寬，另有 320px compact
breakpoint，並提供 skip link、live region 與 reduced-motion 支援。

## 7. Seeded demonstration｜Seeded 示範

The static browser demo is available on localhost, when the URL has `?demo`, or after
demo mode has been persisted. It uses synthetic owner and peer profiles, visibly labels
the data and simulated acceptance, and can reach Connected without calling any API.

Cloud-backed fixture scripts use separate synthetic photographer, dancer, and
sound-designer records. Those records carry `isTestProfile`, `cleanupSafe`, and a fixed
`testRunId`; normal matching excludes them and cleanup scripts target only that exact
fixture.

靜態瀏覽器 demo 只在 localhost、帶有 `?demo` 的網址，或已保存 demo mode 時可用。它使用
synthetic profiles，清楚標示資料與模擬接受狀態，而且不呼叫 API 也能完成 Connected。
Cloud fixture 另以明確 test metadata 隔離，正常 matching 不會納入。
