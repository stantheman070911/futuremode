# How this project is documented｜本專案的文件系統

Five documents, split by the **question each answers** rather than by topic. Each stays
short, is obviously current or obviously stale, and a session loads only the one it
needs.

五份文件，依照 **各自回答的問題** 切分，而非依主題切分。每份都保持簡短，容易看出是最新
還是過期，且每次工作階段只需載入所需的那一份。

The split exists for one reason beyond tidiness: **a hard requirement can't be "solved"
by quietly rewriting the requirement.** What must be true, how it's built, and whether
it actually is live in three different files with three different owners.

這樣切分除了整潔之外還有一個關鍵理由：**困難的需求無法透過偷偷改寫需求來「解決」。**
「必須成立什麼」、「如何建造」與「實際是否成立」分別存放在三份文件、由三個角色負責。

| Document｜文件 | Question it answers｜回答的問題 | Who may change it｜誰可以修改 |
| --- | --- | --- |
| [`/README.md`](../README.md) | What was the original vision?｜原始願景是什麼？ | **Nobody — frozen｜無人，已凍結** |
| [`constitution.md`](constitution.md) | How must this be built?｜必須如何建造？ | PM only｜僅 PM |
| [`product-brief.md`](product-brief.md) | What are we building, and why?｜我們在建什麼，為什麼？ | PM-approved｜需 PM 核准 |
| [`/PitchYourOwner App (offline).html`](../PitchYourOwner%20App%20(offline).html) | What does it look like?｜它長什麼樣子？ | **Design source of truth｜設計事實來源** |
| [`design.md`](design.md) | What is the design system?｜設計系統是什麼？ | Read from the HTML｜讀自 HTML |
| [`plan.md`](plan.md) | How is it delivered?｜如何交付？ | Team + agents｜團隊與 agent |
| [`log.md`](log.md) | What is true right now?｜現在的事實為何？ | Anyone, append-only｜任何人，僅追加 |
| [`runbook.md`](runbook.md) | How do we run the demo?｜如何展示？ | PP + PM｜簡報負責人與 PM |

**When a document and the HTML disagree, the HTML is right.** The documents describe
the design; they do not define it. The same rule that puts code above documentation puts
the design source above the design write-up.

**當文件與 HTML 不一致時，以 HTML 為準。** 文件描述設計，但不定義設計。
如同程式碼高於文件，設計來源也高於設計說明。

## Current phase｜當前階段

**Product and design. Implementation is deliberately out of scope** (constitution Law
IV-b). No document may specify a framework, database, hosting, API, or infrastructure
choice. Requirements are written as *what must be true for the user*.

**產品與設計階段，實作刻意不在範圍內**（憲法法則四之二）。任何文件都不得指定框架、
資料庫、託管、API 或基礎設施。需求一律寫成 *對使用者而言必須成立什麼*。

---

## Where to start, by role｜各角色的起點

### PM (product manager)｜產品經理

Own [`constitution.md`](constitution.md) and [`product-brief.md`](product-brief.md). No
one else merges changes to either.

你負責 [`constitution.md`](constitution.md) 與 [`product-brief.md`](product-brief.md)。
其他人不得合併對這兩份文件的修改。

Your working loop: keep acceptance criteria testable and the out-of-scope list honest;
run the completion audit (plan.md § 7, task P-012) after each milestone — the agent that
built a feature is not a reliable judge of whether it's done.

你的工作循環：讓驗收標準保持可測試、讓「不做清單」保持誠實；每個里程碑後執行完成度稽核
（plan.md § 7，任務 P-012）。建造功能的 agent 無法可靠判斷該功能是否真的完成。

**Your first task is P-004**, the prompt template. It has no dependency on anyone, it's
the highest-risk unknown in the project, and it's product work, not copy.

**你的第一個任務是 P-004**，也就是提示詞模板。它不依賴任何程式碼，是專案中風險最高的
未知數，而且它是產品工作，不是文案工作。

### DEV (developer)｜開發者

No implementation is being asked for yet. Your immediate value is **P-001** — walk all
13 screens in the HTML and log every place it disagrees with
[`product-brief.md`](product-brief.md), and every state the spec requires that the HTML
does not draw.

目前尚未要求實作。你當前的價值在 **P-001**：走過 HTML 的 13 個畫面，記錄每一處與
[`product-brief.md`](product-brief.md) 不一致之處，以及規格要求但 HTML 未繪製的狀態。

That pass is what makes implementation cheap later: it surfaces the ambiguities while
they are still free to fix.

這次檢查能讓日後的實作成本大幅降低：它在模糊之處仍可免費修正時就把它們揪出來。

**Do not record stack decisions in these documents**, even good ones — constitution Law
IV-b. Keep them wherever you like until the PM lifts that law.

**不要在這些文件中記錄技術堆疊決策**，即使是好的決策（憲法法則四之二）。
在 PM 解除該法則前，請自行保存。

### DES (design / product)｜設計與產品

Your tasks are **P-003** (the states the HTML does not draw) and **P-006** (contrast).
P-006 needs nothing from anyone — start it today.

你的任務是 **P-003**（HTML 未繪製的狀態）與 **P-006**（對比檢查）。
P-006 不依賴任何人，今天就能開始。

Two things worth internalizing｜兩件值得內化的事:

- **Everything you add must follow [`design.md`](design.md)** — one accent, 2px corners,
  1px hairlines, mono micro-labels, confidence as a word not a score. A new state that
  invents a new pattern is worse than an ugly one that reuses an existing pattern.
  **你新增的一切都必須遵循 [`design.md`](design.md)。** 一個發明新樣式的新狀態，
  比一個沿用既有樣式但較不好看的狀態更糟。
- **Measure contrast, don't judge it.** `#8A8A82` at 9.5px carries most of the product's
  metadata, and eyes adapt to low contrast within seconds.
  **對比要量測，不要用看的。** 弱化灰階承載了產品大部分的中繼資訊，而眼睛會在幾秒內
  適應低對比。

### PP (presentation / packaging)｜簡報與整體包裝

Own [`runbook.md`](runbook.md) and task **P-008**.

你負責 [`runbook.md`](runbook.md) 與任務 **P-008**。

**You are not blocked on anything.** The demo runs on the HTML, which already exists.
The argument is already decided and written down in runbook.md: the pitch is *specific*,
the owner *stays in control*, and the match *explains itself*.

**你沒有任何阻塞。** 展示以既有的 HTML 進行。論點已經確定並寫在 runbook.md 中。

Your source for the product story is [`/README.md`](../README.md), the frozen original
memo. It's the most complete statement of the vision and it will not move under you.

產品故事的來源是 [`/README.md`](../README.md)，即已凍結的原始備忘錄。它是願景最完整的
陳述，而且不會在你腳下變動。

---

## The working loop｜工作循環

1. Read [`log.md`](log.md) first — it's the 30-second answer to "where are we?"
   先讀 [`log.md`](log.md)，它能在 30 秒內回答「我們現在到哪了？」
2. Confirm the app currently works before changing it.
   在修改之前，先確認應用程式目前可以運作。
3. Pick **one** bounded item from [`plan.md`](plan.md) § 5.
   從 [`plan.md`](plan.md) § 5 挑選 **一項** 有界限的工作。
4. Branch: `p-004-prompt-template`. Do the work.
   開分支：`p-004-prompt-template`，然後執行。
5. Check it against the HTML — the design source of truth — before checking it against
   any document.
   先對照 HTML（設計事實來源）檢查，再對照任何文件。
6. Compare the result against the named acceptance criteria in
   [`product-brief.md`](product-brief.md), criterion by criterion — not against a vague
   sense that it should work now.
   將結果逐條對照 [`product-brief.md`](product-brief.md) 中指名的驗收標準，而不是
   憑「應該可以了」的模糊感覺。
7. Review the diff for anything unintended. Open a PR.
   檢查 diff 是否有非預期變更，並開 PR。
8. Merge. Remove the finished task from plan.md § 3, and append the result to log.md.
   合併。從 plan.md § 3 移除已完成的任務，並將結果追加到 log.md。
9. Only start the next item if the tree is clean.
   只有在工作樹乾淨時，才開始下一項。

## What "done" is not｜什麼不算「完成」

- Not "the agent says it's done."｜不是「agent 說完成了」。
- Not "the screen looks finished" — a screen can look finished and still fail three
  criteria.｜不是「畫面看起來完成了」；畫面可能看起來完成卻仍有三條標準未通過。
- Not "it looked right when I tried it."｜不是「我試了一下看起來沒問題」。

Done is: the named acceptance criteria in the brief were checked one at a time, and
there is evidence for each.

完成的定義是：規格文件中指名的驗收標準已逐條檢查，且每一條都有證據。

## Conventions in one place｜慣例集中處

Working conventions and the branch/PR rule: [`plan.md`](plan.md) § 2. Visual system and
screen inventory: [`design.md`](design.md). Demo procedure: [`runbook.md`](runbook.md).

工作慣例與分支／PR 規則：[`plan.md`](plan.md) § 2。視覺系統與畫面清單：
[`design.md`](design.md)。展示程序：[`runbook.md`](runbook.md)。

## Language convention｜語言慣例

All documents are bilingual English + 繁體中文, following the north star's style:
`Heading｜標題` for headings and table cells, and an English paragraph followed by its
Chinese counterpart for prose. Commands, file paths, code identifiers, and variable
names are left untranslated — they have no translation.

所有文件皆為英文與繁體中文雙語，並沿用北極星文件的風格：標題與表格儲存格使用
`Heading｜標題`，段落則以英文在前、中文在後。指令、檔案路徑、程式識別字與變數名稱
維持原文，因為它們沒有對應翻譯。

When the two versions disagree, the **English is authoritative** for acceptance criteria
and engineering rules — that is the language the tests and code are written in.

當兩個版本不一致時，驗收標準與工程規則 **以英文為準**，因為測試與程式碼是以英文撰寫。

## Decisions made during setup｜建置期間的決策

Where the source guide offered options, the simplest hackathon-appropriate one was
taken.

在來源指南提供選項之處，一律選擇最適合 hackathon 的最簡單方案。

| Decision｜決策 | Choice｜選擇 | Why｜理由 |
| --- | --- | --- |
| Filenames｜檔名 | lowercase (`plan.md`, not `PLAN.md`)｜小寫 | Matches the existing `product-brief.md`; one convention, no renames｜與現有 `product-brief.md` 一致；統一慣例，免除重新命名 |
| BRIEF.md's role｜BRIEF.md 的角色 | Played by `product-brief.md`｜由 `product-brief.md` 擔任 | The team already refers to it by that name｜團隊已習慣此名稱 |
| Archive of the original｜原始文件封存 | Root `/README.md`, byte-identical, frozen｜根目錄 `/README.md`，位元組完全相同，已凍結 | Doubles as the repo front page; verified identical by sha256｜同時作為儲存庫首頁；以 sha256 驗證一致 |
| Runbook scope｜Runbook 範圍 | Demo only｜僅展示 | No deployment exists; an operations section gets written when there is something to operate｜目前沒有部署，等有東西可維運時再寫維運章節 |
| Design source｜設計來源 | The HTML outranks the docs｜HTML 高於文件 | Same rule as code over documentation — the written design follows the real one｜與程式碼高於文件同理 |
| Implementation｜實作 | Out of scope, enforced by Law IV-b｜不在範圍內，由法則四之二強制 | Developer's call: get design, journey and landing right first｜開發者的決定：先把設計、旅程與進入介面做對 |
| Risk mode｜風險模式 | Vibe mode, with the consent and submission paths held to engineering mode｜Vibe mode，但同意與提交路徑維持 engineering mode | Speed everywhere it's cheap; rigor only where the product's thesis lives｜在成本低處全力求快；只在產品核心主張所在處嚴謹 |
| Extra docs｜額外文件 | One added: `design.md`｜新增一份 | **Reverses Session 1's "no extra docs".** Design is now a primary deliverable, so it gets its own home instead of being wedged into the brief｜**推翻第一次工作階段的決定。** 設計現在是主要交付物，因此給它獨立的位置 |
