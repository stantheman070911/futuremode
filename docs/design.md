# PitchYourOwner — Design System & Screen Inventory｜設計系統與畫面清單

_Last updated｜最後更新: 2026-09-03_
_Role｜角色: what the product looks like and how it behaves · governed by
[`constitution.md`](constitution.md)_
_產品的外觀與行為 · 受 [`constitution.md`](constitution.md) 規範_

> **Source of truth:** [`/PitchYourOwner App (offline).html`](../PitchYourOwner%20App%20(offline).html)
> is the design source of truth. Everything in this document is read *from* that file.
> When this document and the HTML disagree, **the HTML is right** — the same way code
> beats documentation everywhere else in this system.
>
> **設計事實來源：** 上述 HTML 檔案是設計的事實來源。本文件的一切都是從該檔案讀出來的。
> 當本文件與 HTML 不一致時，**以 HTML 為準**，如同本系統中程式碼永遠勝過文件。

Open the HTML in a browser. Screen `1a` is a clickable walkthrough of the whole loop —
including an **Upload path** switch between the two transports; `1b`–`1m` and `2a`–`2b`
are static screens you can pick from.

用瀏覽器開啟該 HTML。畫面 `1a` 是完整流程的可點擊操作，並含一個在兩種上傳路徑之間切換的
**Upload path** 開關；`1b`–`1m` 與 `2a`–`2b` 是可挑選的靜態畫面。

---

## 1. Direction｜設計方向

Quiet Swiss minimalism on a brutalist skeleton.

以粗獷主義為骨架的安靜瑞士極簡主義。

- Hairline 1px rules, 2px corners.｜1px 細線分隔，2px 圓角。
- Mono micro-labels carry all metadata.｜所有中繼資訊由等寬小標籤承載。
- **One accent (`#0F5AE0`), reserved for consent, overlap, and the primary action.
  Nothing else is colored.**
  **只有一個強調色（`#0F5AE0`），保留給同意、重疊與主要操作。其他一切都不上色。**
- **The consent moment is the product**, so it gets the loudest typography in the app.
  **同意的那一刻就是產品本身**，因此它使用全 App 最強烈的字級。
- Every claim is stamped **conversation-derived · owner-approved**, never "verified".
  每項描述都標示為 **由對話衍生 · owner 已核准**，絕不標示為「已驗證」。
- No feed, no scores, no rankings — stated on screen, not just in the spec.
  沒有動態牆、分數或排行；這一點直接寫在畫面上，而不只寫在規格裡。

## 2. Frame｜畫面框架

| Property｜屬性 | Value｜值 |
| --- | --- |
| Reference device｜參考裝置 | 402 × 874 (iPhone)｜以此為基準 |
| Canvas behind the phone｜手機外的畫布 | `#E7E4DD` |
| App surface｜App 表面 | `#F4F2ED` |
| Primary navigation｜主要導覽 | Four tabs: Matches · Invitations · My Pitch · Settings｜四個分頁 |
| Language｜語言 | EN primary, 繁中 paired underneath｜英文為主，繁中在下方成對呈現 |

## 3. Palette｜色彩

Read directly from the HTML. Frequency shows intent: the greys do the work, the accent
is rare on purpose.

直接讀自 HTML。使用頻率反映意圖：灰階承擔主要工作，強調色刻意稀少。

| Token｜代號 | Hex | Use｜用途 |
| --- | --- | --- |
| Accent｜強調色 | `#0F5AE0` | **Consent, overlap, primary action only**｜僅用於同意、重疊、主要操作 |
| Accent hover｜強調色滑過 | `#0A44AA` | Hover on primary action｜主要操作滑過狀態 |
| Accent tint｜強調色淡底 | `#EDF2FD` | Rare accent fill｜少量強調底色 |
| Accent light｜強調色淺 | `#7FA9F5` | Accent on dark surfaces｜深色表面上的強調 |
| Ink｜主文字 | `#131313` | Headings, primary text, the black prompt slab｜標題、主要文字、黑色提示詞區塊 |
| Ink secondary｜次文字 | `#3D3D38` | Lead paragraphs｜引導段落 |
| Body｜內文 | `#5C5C55` | Body copy, descriptions｜內文與描述 |
| Muted｜弱化 | `#7E7E76`, `#6E6E68` | Secondary metadata｜次要中繼資訊 |
| Micro-label｜微標籤 | `#8A8A82` | Mono uppercase labels — the most used color in the app｜等寬大寫標籤，全 App 使用最多 |
| Disabled｜停用 | `#A9A59C`, `#C9C5BA` | Inactive, placeholder｜非作用中、佔位 |
| Surface｜表面 | `#F4F2ED` | App background｜App 背景 |
| Canvas｜畫布 | `#E7E4DD` | Behind the device｜裝置外的底色 |
| Fill｜填色 | `#EDEAE2`, `#E8E6E0`, `#E4E1D9` | Cards, subtle blocks｜卡片與淡色區塊 |
| Hairline｜細線 | `#DEDAD1`, `#D8D4CA` | 1px borders and rules｜1px 邊框與分隔線 |

## 4. Typography｜字體

| Family｜字族 | Use｜用途 |
| --- | --- |
| **Instrument Sans** | All headings, UI, and body copy｜所有標題、介面與內文 |
| **IBM Plex Mono** | Micro-labels, metadata, step counters, session ids, stamps — always uppercase with wide tracking｜微標籤、中繼資訊、步驟計數、session id、標記；一律大寫並加寬字距 |
| **Noto Sans TC** | 繁體中文｜Traditional Chinese pairs |

| Role｜角色 | Spec｜規格 |
| --- | --- |
| Display｜展示標題 | `600 27–28px / 1.15`, tracking `-.02em`–`-.025em` |
| Section heading｜區段標題 | `600 15–16px` |
| Body｜內文 | `500 14–15.5px / 1.45–1.5` |
| Chinese pair｜中文對照 | `400 11.5–12.5px / 1.6–1.7` Noto Sans TC, in a muted grey｜以弱化灰階呈現 |
| Micro-label｜微標籤 | `500 9–10.5px` mono, uppercase, tracking `.08em`–`.16em` |

**The Chinese line is always visually subordinate** — smaller, lighter, muted — never a
second heading competing with the English.

**中文那一行永遠在視覺上是次要的**：更小、更輕、更弱化，絕不成為與英文競爭的第二個標題。

## 5. Geometry and motion｜幾何與動態

- **Corner radius: 2px** everywhere (104 occurrences). Circles only for avatars and
  status dots. 14px appears twice, for the device frame only.
  **圓角一律 2px**（出現 104 次）。只有頭像與狀態點使用圓形。14px 僅用於裝置外框。
- **Borders: 1px hairline** in `#DEDAD1`. Rules are structure, not decoration.
  **邊框為 1px 細線**，使用 `#DEDAD1`。分隔線是結構，不是裝飾。
- **Primary action bar: 56px tall**, full-width, accent background, white label.
  **主要操作列高 56px**，滿版寬度，強調色底、白色文字。
- Motion is minimal: `pyoIn` (6px rise + fade on enter) and `pyoPulse` (opacity
  .35 ↔ 1 for waiting states). Nothing else animates.
  動態極簡：`pyoIn`（進場上移 6px 並淡入）與 `pyoPulse`（等待狀態的透明度呼吸）。
  其他一律不做動畫。

## 6. Recurring components｜重複使用的元件

| Component｜元件 | Behaviour｜行為 |
| --- | --- |
| **Mono micro-label**｜微標籤 | Uppercase mono in `#8A8A82`. Carries every piece of metadata: step counters, session ids, scope, confidence, timestamps.｜承載所有中繼資訊 |
| **Provenance stamp row**｜來源標記列 | `CONVERSATION-DERIVED · OWNER-APPROVED · NOT VERIFIED`. Appears on every profile and match.｜出現在每份檔案與每個配對上 |
| **Privacy strip**｜隱私提示條 | Accent dot + mono line, e.g. `Raw chats are not uploaded · 不上傳原始對話`. Privacy is stated as a fact, not a footnote.｜隱私以事實陳述，而非註腳 |
| **Prompt slab**｜提示詞區塊 | Black `#131313` block holding the literal prompt text, with a copy action.｜黑色區塊承載提示詞原文與複製操作 |
| **Sensitive-data list**｜敏感資料清單 | `SENSITIVE DATA · N ITEMS REMOVED`, each row showing `original → generalized`.｜逐列顯示原值與概括化後的值 |
| **Overlap ledger**｜重疊對照 | Two columns (You / Them) with an accent bar naming the shared thing.｜雙欄對照，以強調色標示共同點 |
| **Tab bar**｜分頁列 | Four fixed tabs, always visible on the four main areas.｜四個固定分頁 |
| **Confidence label**｜信心標籤 | `HIGH` / `MEDIUM` / `LOW` as a mono word — never a number, never a bar chart with a score.｜以文字呈現，絕不用數字或分數 |

---

## 7. Screen inventory｜畫面清單

Every screen in the HTML, with its id. **Bold = chosen for v1.**

HTML 中的所有畫面與代號。**粗體為 v1 選定版本。**

| Id | Screen｜畫面 | Notes｜說明 |
| --- | --- | --- |
| `1a` | Live interactive flow｜可操作流程 | START → PICK AI → HANDOFF → **REVIEW (switchable: `2a` or `2b`)** → PUBLISHED → MATCHES → MATCH DETAIL｜審核步驟可在兩種上傳路徑間切換 |
| **`1b`** | **Start A — typographic promise**｜排版式承諾 | The claim is the whole screen; privacy stated as fact.｜主張佔滿整個畫面 |
| `1c` | Start B — the agent speaks first｜Agent 先開口 | Agent's voice + two trust numbers (1 review, 0 raw chats).｜以 Agent 口吻開場，加兩個信任數字 |
| **`1d`** | **Prompt handoff A — the prompt is the object**｜提示詞即主體 | Black slab holds the real prompt; 4-step rule is the only progress UI.｜黑色區塊承載提示詞原文 |
| `1e` | Prompt handoff B — the seam as a live wire｜狀態帳本 | Status ledger between two apps, waiting.｜兩個 App 之間的狀態帳本 |
| **`1f`** | **My Pitch A — confidence in the margin**｜信心置於邊欄 | Reads like a document; confidence is a mono word, not a score.｜像文件一樣閱讀 |
| `1g` | My Pitch B — scope ledger on top｜歷史範圍置頂 | What the agent could and couldn't see comes first.｜先說明可見與不可見的範圍 |
| **`1h`** | **Match detail A — three questions, numbered**｜三個編號問題 | The memo's own structure. **Safest for the demo.**｜最適合展示 |
| `1i` | Match detail B — side-by-side ledger｜並排對照 | Your field vs theirs; ends on a suggested opening line.｜雙欄對照，收在建議開場白 |
| **`1j`** | **Review & Publish — the consent moment**｜同意時刻 | Fallback paste path. The loudest screen in the app.｜備援貼上路徑，App 中最強烈的畫面 |
| **`1k`** | **Invitations — incoming & outgoing**｜收到與送出的邀請 | Mutual consent stated; a decline is private.｜明示雙方同意；拒絕理由不外流 |
| **`1l`** | **Settings — privacy, visibility, export, deletion**｜隱私與資料 | Ends on "We never held your raw chats."｜以此句作結 |
| **`1m`** | **Lock screen — strong-match notification**｜鎖定畫面通知 | Deliberately vague; topics only appear in-app.｜刻意概括 |

### The upload step — two transports｜上傳步驟：兩種傳輸方式

**Same consent standard, two transports.** Both land on the same published state, and
**neither is a silent write.**

**相同的同意標準，兩種傳輸方式。** 兩者最終抵達相同的已發布狀態，且 **都不是無聲寫入**。

| Id | Screen｜畫面 | Notes｜說明 |
| --- | --- | --- |
| **`2a`** | **Owner uploads**｜owner 自行帶回 | The agent hands back its result, the owner carries it in. **The app owns the review and holds the publish button.** Works on any phone with any assistant. Three ways in: paste from clipboard (fastest), the share sheet, or scan the session QR (desktop → phone). Shows what arrived, that it validates, and **RAW CONVERSATION TEXT · NONE FOUND**.｜App 掌握審核與發布按鈕，適用任何手機與任何助理 |
| **`2b`** | **Agent posts**｜Agent 直接提交 | The confirmation already happened inside the AI, so the app's job is to **prove what arrived** and let the owner discard before it goes live. Shows a receipt (owner confirmed, field count, items omitted, raw conversation NONE, token SPENT · WRITE-ONLY), the state **DRAFT · NOT LIVE YET**, and two actions: **Discard** / **Publish this draft**.｜App 的職責是證明收到了什麼，並讓 owner 在上線前丟棄 |

**Both are in v1.** `2a` is the path that always works; `2b` is the path that is faster
when the assistant can submit for itself. The product promise — *nothing goes live
without the owner* — is preserved in both, which is why `2b` shows a receipt and a
discard rather than a success message.

**兩者都納入 v1。** `2a` 是永遠可用的路徑；`2b` 是助理能自行提交時較快的路徑。
「未經 owner 不上線」的產品承諾在兩者中都被保留，這正是 `2b` 顯示收據與丟棄選項、
而非成功訊息的原因。

### Chosen variants for v1｜v1 選定版本

`1b` start · `1d` handoff · `1f` My Pitch · `1h` match detail · **both `2a` and `2b`
upload paths** — plus `1j`, `1k`, `1l`, `1m`, which have one direction each.

Rationale: `1h` is called out in the HTML itself as the safest demo choice, and `1b` /
`1d` / `1f` are the variants that state the product's argument most directly rather than
most cleverly. **`1c`, `1e`, `1g`, `1i` are not rejected** — they are the alternates to
reach for if a screen is not landing.

理由：HTML 本身標註 `1h` 最適合展示；`1b`／`1d`／`1f` 是最直接陳述產品主張的版本，
而非最花俏的。**`1c`、`1e`、`1g`、`1i` 並未被否決**，而是當某個畫面效果不佳時的備選。

---

## 8. Bilingual pairing rule｜雙語配對規則

Read from the HTML, applies to every user-facing surface:

讀自 HTML，適用於所有使用者可見的介面：

- English carries the meaning; 繁中 sits beneath it, smaller and muted.
  英文承載意義；繁中置於下方，字級更小、色彩更弱。
- Micro-labels may pair inline with `·`, e.g. `INTERESTS · 興趣`.
  微標籤可用 `·` 行內配對，例如 `INTERESTS · 興趣`。
- Not every line needs a pair. The HTML pairs the lines that carry the promise, the
  consent, and the privacy claim — and leaves incidental UI English-only.
  並非每一行都需要配對。HTML 只為承載承諾、同意與隱私主張的句子配上中文，
  其餘次要介面文字維持英文。
- Chinese is never the only language on a control.
  控制項上絕不只有中文。
