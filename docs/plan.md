# PitchYourOwner — Delivery Plan｜交付計畫

_Last updated｜最後更新: 2026-09-03_
_Role｜角色: how the approved brief gets delivered and verified · governed by
[`constitution.md`](constitution.md)_
_已核准規格的交付與驗證方式 · 受 [`constitution.md`](constitution.md) 規範_

> **Implementation is out of scope right now.** This plan sequences product, design, and
> content work only. No framework, database, hosting, or infrastructure decision appears
> here — and none should be added until the PM says the project has moved into
> implementation.
>
> **實作目前不在範圍內。** 本計畫只安排產品、設計與內容工作。此處不出現任何框架、
> 資料庫、託管或基礎設施決策；在 PM 宣告專案進入實作階段前，也不應加入。

The **executable work queue**, not a description. Plan the next few tasks precisely;
re-plan once the current slice lands.

這是 **可執行的工作佇列**，不是描述。精確規劃接下來幾項任務，完成一個切片後再重新規劃。

---

## 1. What is settled and what is open｜已定與未定

| Settled｜已定 | Where｜出處 |
| --- | --- |
| The product concept and its five durable principles｜產品概念與五項長期原則 | [`product-brief.md`](product-brief.md) § 0 |
| The seven-step user journey｜七步使用者旅程 | [`product-brief.md`](product-brief.md) § 1 |
| Four-area information architecture｜四區資訊架構 | [`product-brief.md`](product-brief.md) § 1 |
| Visual direction, palette, type, geometry｜視覺方向、色彩、字體、幾何 | [`design.md`](design.md) |
| Every screen and its chosen variant｜所有畫面與選定版本 | [`design.md`](design.md) § 7 |
| 34 acceptance criteria｜34 條驗收標準 | [`product-brief.md`](product-brief.md) § 2 |

| Open｜未定 | Owner｜負責 |
| --- | --- |
| Everything about implementation｜所有實作相關事項 | Deliberately not being decided｜刻意暫不決定 |
| Whether a separate marketing landing page is wanted｜是否需要獨立行銷網頁 | PM — see [`product-brief.md`](product-brief.md) § 3 |
| The prompt text itself｜提示詞本身 | PM — P-004 |
| Contrast pass on the muted greys｜弱化灰階的對比檢查 | Design — P-006 |

## 2. Working conventions｜工作慣例

- **The HTML is the design source of truth.** Read it before writing a spec sentence
  about a screen. When a document disagrees with it, the HTML wins.
  **HTML 是設計的事實來源。** 在撰寫任何畫面規格前先讀它；文件與它衝突時以 HTML 為準。
- **One branch per work-queue item**, named for the task: `p-004-prompt-template`.
  **每項工作一個分支**，以任務命名。
- **Open a PR; never commit to `main`.**｜**開 PR，絕不直接提交到 `main`。**
- **Bilingual EN / 繁中 on every user-facing string and every document.**
  所有使用者可見文字與所有文件皆為雙語。
- **A task is done when its named acceptance criteria pass** — not when it looks right.
  **任務在其指名的驗收標準通過時才算完成**，而不是看起來對就算完成。

---

## 3. Work queue｜工作佇列

Bounded, independently verifiable tasks. **A completed task is removed from this queue**
— status lives in [`log.md`](log.md).

有界限、可獨立驗證的任務。**完成的任務要從此佇列移除**，狀態記錄在 [`log.md`](log.md)。

`PM` = product manager｜產品經理 · `DEV` = developer｜開發者 ·
`DES` = design/product｜設計與產品 · `PP` = presentation/packaging｜簡報與包裝

```
P-001 — Walk the HTML and log every gap｜逐畫面走過 HTML 並記錄落差
Owner:            PM + DEV
Depends on:       none
Deliverable:      A list of every place the HTML and product-brief.md disagree, and
                  every screen state the HTML does not cover
                  列出 HTML 與規格不一致之處，以及 HTML 未涵蓋的畫面狀態
Verification:     Open 1a and click all seven steps; open 1b–1m
                  開啟 1a 點完七步；逐一開啟 1b–1m
Done when:        Each gap is either a new queue item or a logged decision
                  每個落差都成為新的佇列項目或已記錄的決策
```
```
P-002 — Content inventory for all 13 screens｜13 個畫面的內容清單
Owner:            PM
Depends on:       P-001
Deliverable:      Every user-facing string, EN + 繁中, in one place, sourced from the
                  HTML — headings, labels, micro-labels, empty states, error states
                  所有使用者可見文字的雙語版本集中一處，來源為 HTML
Verification:     Every string in the HTML appears; every screen in design.md § 7 covered
                  HTML 中的每個字串都在其中；design.md § 7 的每個畫面都涵蓋
Done when:        A reviewer can check copy without opening the HTML
                  審查者不需開啟 HTML 就能檢查文案
```
```
P-003 — Empty, error and waiting states｜空狀態、錯誤狀態與等待狀態
Owner:            DES + PM
Depends on:       P-001
Deliverable:      The states in product-brief.md § 4 that the HTML does not draw:
                  matching-in-progress, no matches, expired session, malformed result
                  規格 § 4 中 HTML 未繪製的狀態
Verification:     Each state has copy (EN + 繁中) and a described layout following design.md
                  每個狀態都有雙語文案與依循設計文件的版面說明
Done when:        Every row of product-brief.md § 4 has a defined screen
                  規格 § 4 的每一列都有明確的畫面
```
```
P-004 — Prompt template｜提示詞模板
Owner:            PM
Depends on:       none — start immediately｜無依賴，立即開始
Deliverable:      The full prompt: scope restriction, nine fields, sensitive-data pass,
                  and the exact consolidated-confirmation wording from BRIEF Step 3
                  完整提示詞：範圍限制、九個欄位、敏感資料檢查，以及規格 Step 3 的確認措辭
Verification:     Run against real ChatGPT and Claude accounts; score against the rubric
                  in § 4 below｜對真實帳號實測，並依下方 § 4 的準則評分
Done when:        3 of 3 runs on each assistant produce all nine fields with no verbatim
                  excerpts and every claim specific rather than broad
                  每個助理 3 次測試都產出九個欄位、無逐字引用、且每項描述具體
```
```
P-005 — Sample profile and match set｜範例檔案與配對集合
Owner:            PM
Depends on:       P-004
Deliverable:      Profiles for the demo participants, including the two pairs that
                  should match and one pair sharing only a broad domain label
                  展示參與者的檔案，含兩組應配對的組合與一組僅共享廣泛領域的組合
Verification:     Apply the § 5 weights by hand; the intended pairs rank top and the
                  broad-domain pair does not appear
                  以人工套用權重；預期組合排在最前，廣泛領域組合不出現
Done when:        The R5.3 negative case exists in the sample set
                  範例集合中存在 R5.3 的反例
```
```
P-006 — Accessibility and contrast pass｜無障礙與對比檢查
Owner:            DES
Depends on:       P-002
Deliverable:      Contrast measurements for every text colour on its actual background,
                  especially #8A8A82 and #A9A59C at 9–10.5px mono
                  每個文字色在其實際背景上的對比量測，特別是小字級的弱化灰階
Verification:     Measured with a contrast tool, not judged by eye
                  以對比工具量測，不憑肉眼判斷
Done when:        Every combination passes WCAG AA or has a logged, approved exception
                  每組組合皆通過 AA，或有已記錄並核准的例外
```
```
P-007 — Bilingual copy review｜雙語文案審查
Owner:            PM + PP
Depends on:       P-002
Deliverable:      Native-quality 繁中 for every paired string; English tightened
                  每個配對字串的道地繁中；英文收緊
Verification:     Read aloud on a phone-width screen｜在手機寬度畫面上朗讀
Done when:        No string reads as translated｜沒有任何字串讀起來像翻譯
```
```
P-008 — Demo run-of-show｜展示流程腳本
Owner:            PP (with PM)｜PP 主導，PM 協同
Depends on:       P-002, P-005
Deliverable:      Scripted path through the HTML's 1a flow, the argument each screen
                  makes, and a fallback if anything fails
                  以 HTML 的 1a 流程為主的腳本、每個畫面的論點，以及失敗時的備援
Verification:     Full dry run on the actual demo device and network
                  在實際展示裝置與網路上完整彩排
Done when:        Executed start to finish twice｜從頭到尾執行兩次
```
```
P-009 — Completion audit｜完成度稽核
Owner:            PM
Depends on:       P-002..P-008
Deliverable:      Evidence for every acceptance criterion in product-brief.md § 2
                  規格 § 2 中每條驗收標準的證據
Verification:     Run the audit prompt in § 5 below｜執行下方 § 5 的稽核提示詞
Done when:        Every criterion has named evidence or a logged gap
                  每條標準都有指名的證據或已記錄的缺口
```

---

## 4. Verification｜驗證

| Area｜範圍 | Required verification｜必要驗證 |
| --- | --- |
| Prompt (P-004)｜提示詞 | Human rubric, 3 runs × 2 assistants. Rubric: nine fields present · zero verbatim excerpts · every claim specific not broad (R2.3) · history scope names both sides · exactly one consolidated question｜人工準則，3 次 × 2 個助理 |
| Copy (P-002, P-007)｜文案 | Every string traced to the HTML or logged as an addition｜每個字串都可追溯至 HTML，或已記錄為新增 |
| States (P-003)｜狀態 | Every row of product-brief.md § 4 has a screen｜規格 § 4 每一列都有畫面 |
| Contrast (P-006)｜對比 | Measured, not eyeballed｜量測而非目測 |
| Matching logic (P-005)｜配對邏輯 | Weights applied by hand to the sample set, positive and negative pair both asserted｜人工套用權重，正反例都要驗證 |
| Demo (P-008)｜展示 | Two full dry runs on the real device｜在實機上完整彩排兩次 |

### What counts as evidence｜什麼才算證據

- A screen is not verified until it has been seen at 402px on a real phone, not a
  resized desktop window.
  畫面必須在真實手機上以 402px 檢視過才算驗證，不能用縮小的桌面視窗。
- A contrast claim is measured with a tool. Eyes adapt; tools don't.
  對比宣稱必須用工具量測。眼睛會適應，工具不會。
- A prompt that worked once is not verified — run it three times, on two assistants.
  只成功一次的提示詞不算驗證；要在兩個助理上各跑三次。
- A criterion "looks satisfied" is not evidence. Name the screen or the run that shows it.
  「看起來滿足」不是證據；要指出證明它的畫面或執行紀錄。
- An empty result can satisfy a check vacuously — assert what is present, not just the
  absence of an error.
  空結果可能讓檢查空洞地通過；要斷言存在什麼，而不只是沒有錯誤。

---

## 5. Completion audit｜完成度稽核

Run as a **separate pass** (P-009), because whoever built a thing is not a reliable
judge of whether it is finished:

作為 **獨立的一次檢查** 執行（P-009），因為建造者無法可靠判斷自己是否完成：

> Assume the work is incomplete. Compare each acceptance criterion in
> docs/product-brief.md against the HTML, the content inventory, and the sample set, and
> provide evidence that it is satisfied. Any criterion without evidence is incomplete.
>
> 假設工作是不完整的。將 docs/product-brief.md 的每條驗收標準與 HTML、內容清單、
> 範例集合逐一比對，並提出滿足的證據。任何沒有證據的標準即視為未完成。

Gaps become new queue items and the cycle repeats.

缺口成為新的佇列項目，循環持續進行。

---

## 6. Sequence｜順序

Priority order, not a schedule.

優先順序，不是時程表。

1. **P-004 (PM)** — start now, no dependencies, highest risk｜立即開始，無依賴，風險最高
2. **P-001 (PM + DEV)** — establishes what is actually missing｜確立實際缺少什麼
3. P-002 (PM), then P-003 (DES) and P-006 (DES) in parallel｜然後並行
4. P-005 (PM), P-007 (PM + PP)
5. P-008 (PP) — start as soon as P-002 exists｜P-002 一存在就開始
6. P-009 (PM) audit｜稽核

---

## 7. Requirement → deliverable traceability｜需求與交付對照

| Requirement｜需求 | Delivered by｜交付於 | Verified by｜驗證方式 |
| --- | --- | --- |
| R1.1–R1.5 | HTML `1b`, `1d` + P-002, P-003 | Screen review at 402px｜402px 畫面審查 |
| R2.1–R2.5 | P-004 | Human rubric｜人工準則 |
| R3.1–R3.6 | HTML `1j` + P-004 | Rubric + screen review｜準則加畫面審查 |
| R4.1–R4.7 | HTML `1f`, `1j` + P-002, P-003 | Screen review + state coverage｜畫面審查與狀態覆蓋 |
| R5.1–R5.6 | HTML `1h` + P-005 | Weights applied by hand｜人工套用權重 |
| R6.1–R6.5 | HTML `1k`, `1m` + P-003 | Screen review｜畫面審查 |
