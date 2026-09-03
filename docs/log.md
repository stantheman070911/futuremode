# PitchYourOwner — Development Log｜開發日誌

_Last updated｜最後更新: 2026-09-03_
_Role｜角色: what is verified true right now · governed by
[`constitution.md`](constitution.md)_
_目前經驗證為真的事實 · 受 [`constitution.md`](constitution.md) 規範_

**Append-only and operational — not a diary.** Replace a stale line with the new true
statement; do not narrate the journey.

**僅追加且以維運為主，不是日記。** 用新的事實敘述取代過時的那一行，不要敘述過程。

Entry format｜條目格式:

```
YYYY-MM-DD / Session N
Completed:        [P-IDs]
Verified:         [what passed, against what]
Changed decision: [what changed, and which doc was updated]
Known issue:      [what is broken]
Current blocker:  [what is waiting on what]
Next:             [P-ID]
```

Session entries may be single-language for speed. Structure and headings stay bilingual.

工作階段條目可只用單一語言以求速度；結構與標題維持雙語。

---

## Phase｜階段

**Product and design.** Implementation is deliberately out of scope (constitution Law
IV-b). No framework, hosting, or infrastructure decision has been made, and none should
be recorded until the PM lifts that law here.

**產品與設計階段。** 實作刻意不在範圍內（憲法法則四之二）。尚未做出任何框架、託管或
基礎設施決策，在 PM 於此處解除該法則前，也不應記錄任何此類決策。

## Design source of truth｜設計事實來源

[`/PitchYourOwner App (offline).html`](../PitchYourOwner%20App%20(offline).html) —
committed, 6.2 MB. Contains 15 screens: one clickable flow (`1a`, with an Upload-path
switch), `1b`–`1m`, and `2a`–`2b` (the two upload transports). Read by
[`design.md`](design.md).

上述 HTML 已提交，6.2 MB，含 15 個畫面：一個可點擊流程（`1a`，含上傳路徑切換）、
`1b`–`1m`，以及 `2a`–`2b`（兩種上傳傳輸方式）。由 [`design.md`](design.md) 解讀。

## Verification results｜驗證結果

| Check｜檢查項目 | Verified result｜驗證結果 |
| --- | --- |
| Design extracted｜設計已擷取 | 2026-09-03 — all 15 screens, palette (14 colours), type (3 families), geometry and motion read from the HTML into design.md｜15 個畫面、色彩、字體、幾何與動態皆已讀入設計文件 |
| Documentation structure｜文件結構 | 2026-09-03 — six documents in place; all bilingual; every internal link resolves｜六份文件就位，全部雙語，所有內部連結可解析 |
| Frozen north star｜已凍結的北極星 | 2026-09-03 — `/README.md` byte-identical to the original brief (sha256 `ca4a4f83…`)｜與原始規格位元組相同 |
| Stack references removed｜技術堆疊參照已移除 | 2026-09-03 — no framework, database, hosting, or infrastructure reference remains in any document except the out-of-scope declarations themselves｜除了「不在範圍」的宣告本身，所有文件都不再出現相關參照 |
| Acceptance criteria｜驗收標準 | Not yet verified — no evidence gathered. Blocked on P-001｜尚未驗證，未蒐集證據，卡在 P-001 |

Only put a result here once it has actually been checked.

只有實際檢查過的結果才能寫在這裡。

## Step status｜步驟狀態

| Step (from product-brief.md)｜步驟 | Design｜設計 | Spec｜規格 | Open condition｜未決條件 |
| --- | --- | --- | --- |
| Step 1 — Start and handoff｜開始與交接 | Done (`1b`, `1d`)｜已完成 | Done | Empty/expired states — P-003｜空狀態與過期狀態 |
| Step 2 — Pitch generation｜介紹產生 | n/a — happens in the user's AI｜不適用 | Done | Prompt itself — P-004｜提示詞本身 |
| Step 3 — Consent moment｜同意時刻 | Done (`1j`)｜已完成 | Done | Prompt wording — P-004｜提示詞措辭 |
| Step 4 — Publication + My Pitch｜發布與我的介紹 | Done (`1f`, `2a`, `2b`)｜已完成 | Done | Failed-validation state for `2a` undesigned｜`2a` 的驗證失敗狀態尚未設計 |
| Step 5 — Matching｜配對 | Done (`1h`)｜已完成 | Done | Sample set — P-005｜範例集合 |
| Step 6 — Notification + invitation｜通知與邀請 | Done (`1k`, `1m`)｜已完成 | Done | Empty state for Matches — P-003｜配對空狀態 |

## Open items｜未決項目

1. **The prompt does not exist yet.** P-004 has no dependencies and carries ~40% of the
   acceptance criteria (all of Step 2 and most of Step 3). Its failure mode is invisible
   until it is run against real assistants. **Highest risk in the project.**
   **提示詞尚不存在。** P-004 無依賴，承載約四成驗收標準，且在對真實助理實測前看不出
   失敗徵兆。**專案中風險最高的項目。**
2. **The HTML does not draw every state the spec requires.** Matching-in-progress, no
   matches, expired session, and **the failed-validation state for Transport A (`2a`)**
   are specified in product-brief.md § 4 and § 8 but not designed. P-003.
   **HTML 未繪製規格要求的所有狀態。** 配對進行中、無配對、工作階段過期，以及
   **路徑 A（`2a`）的驗證失敗狀態**，皆已在規格中定義但尚未設計。
3. **Contrast is unverified.** `#8A8A82` and `#A9A59C` at 9–10.5px carry most of the
   product's metadata and are the most likely accessibility failure. P-006.
   **對比尚未驗證。** 小字級的弱化灰階承載了產品大部分的中繼資訊，是最可能的無障礙缺口。
4. **Marketing landing page undecided.** The HTML covers the app. Whether a separate
   public web page is wanted is a PM decision — see product-brief.md § 3.
   **行銷網頁尚未決定。** HTML 涵蓋的是 App；是否另需對外網頁由 PM 決定。

## Deferred｜延後項目

- Alternate variants `1c`, `1e`, `1g`, `1i` — kept as fallbacks if a chosen screen is not
  landing｜備選版本保留，作為選定畫面效果不佳時的替代
- Refresh / re-pitch flow｜重新產生流程 — waits on the core loop being demonstrable
- Android start-screen variant｜Android 版開始頁 — waits on time remaining
- Everything about implementation｜所有實作事項 — waits on an explicit PM decision
  recorded here｜等 PM 明確決策並記錄於此

## Immediate objective｜當前目標

- **PM:** P-004 — write the prompt. No dependencies, highest risk, start now.
  **PM：** P-004 — 撰寫提示詞。無依賴、風險最高，立即開始。
- **PM + DEV:** P-001 — walk all 13 screens in the HTML and log every gap against
  product-brief.md.
  **PM 與開發者：** P-001 — 走過 HTML 的 13 個畫面，逐一記錄與規格的落差。
- **DES:** blocked on P-001 for P-003; P-006 (contrast) can start immediately.
  **設計：** P-003 卡在 P-001；P-006 對比檢查可立即開始。
- **PP:** start P-008 against the HTML — the demo does not wait on software.
  **簡報：** 依 HTML 開始 P-008；展示不必等軟體。

Must **not** happen while these are open: no framework, hosting, or infrastructure
decision recorded in any document; no edits to `/README.md`; no design decision that is
not first visible in the HTML.

在這些項目未結束前 **不得** 發生：任何文件記錄框架、託管或基礎設施決策；修改
`/README.md`；做出任何未先呈現在 HTML 中的設計決策。

---

## Session history｜工作階段歷史

```
2026-09-03 / Session 1
Completed:        Documentation system setup; all documents bilingual EN + 繁中
Verified:         /README.md byte-identical to original brief (cmp + sha256);
                  all internal links resolve
Changed decision: Original brief archived as /README.md at root (PM); constitution
                  Law 0 freezes it
Changed decision: All documents bilingual, not just product-brief.md (PM)
Next:             P-001, P-004
```
```
2026-09-03 / Session 2
Completed:        Pivot to product-and-design phase
Verified:         Design extracted from PitchYourOwner App (offline).html — 13 screens,
                  palette, type, geometry, motion — into new docs/design.md;
                  no stack references remain in any document
Changed decision: Implementation is out of scope (DEV: "先把實作細節丟掉，著重在
                  design、User Journey、Landing Page"). The Session 1 stack decision
                  is REVERSED and every trace removed from the docs.
                  Constitution gains Law IV-b.
Changed decision: PitchYourOwner App (offline).html is the design source of truth; documentation
                  follows it, not the reverse. Constitution Law I and II updated.
Changed decision: Sixth document added — docs/design.md. Session 1 had recorded
                  "no extra docs"; design is now a primary deliverable, so it gets a
                  home rather than being wedged into the brief.
Changed decision: plan.md reframed from implementation plan to delivery plan;
                  runbook.md reduced to demo procedure only.
Known issue:      Prompt (P-004) still does not exist — highest risk
Current blocker:  None
Next:             P-004 (PM), P-001 (PM + DEV)
```
```
2026-09-03 / Session 2 (cont.)
Completed:        Design source updated mid-session
Verified:         HTML replaced with "PitchYourOwner App (offline).html" (6.2 MB).
                  Palette, type and geometry unchanged; screen set grew 13 → 15.
                  New: 2a "owner uploads" and 2b "agent posts" — the review step now
                  has two transports, and 1a switches between them.
Changed decision: Both upload transports are in v1, not one path plus a fallback.
                  Neither is a silent write: 2b holds the result as DRAFT · NOT LIVE
                  YET with a receipt and a Discard action. product-brief.md Step 4
                  rewritten; R4.8, R4.9, R4.10 added (34 → 37 criteria).
Changed decision: QR handoff (desktop → phone) moves from should-have into Transport A
                  as one of three documented ways to bring a result back.
Known issue:      Failed-validation state for 2a is not designed — logged as open item
Next:             P-004 (PM), P-001 (PM + DEV)
```
