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
| [`plan.md`](plan.md) | How are we building it?｜我們如何建造？ | SD + agents｜資深開發者與 agent |
| [`log.md`](log.md) | What is true right now?｜現在的事實為何？ | Anyone, append-only｜任何人，僅追加 |
| [`runbook.md`](runbook.md) | How do we deploy and demo it?｜如何部署與展示？ | SD + PP｜資深開發者與簡報負責人 |
| Code + tests + Git | What actually exists?｜實際存在什麼？ | **Machine truth｜機器事實** |

That last row is the rule everything defers to. The documents *control* the work; they
never override what the repository and the tests actually demonstrate. **When a document
and the code disagree, the code is right.**

最後一列是所有規則的最終依據。文件 *控制* 工作，但永遠不能凌駕於儲存庫與測試所實際
呈現的事實。**當文件與程式碼不一致時，以程式碼為準。**

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

**Your first task is P-004**, the prompt template. It has no code dependency, it's the
highest-risk unknown in the project, and it's product work, not copy.

**你的第一個任務是 P-004**，也就是提示詞模板。它不依賴任何程式碼，是專案中風險最高的
未知數，而且它是產品工作，不是文案工作。

### SD (senior developer)｜資深開發者

Own [`plan.md`](plan.md) and the surfaces the constitution flags as engineering-mode:
the submission endpoint, the token model, and the consent check.

你負責 [`plan.md`](plan.md)，以及憲法標示為 engineering mode 的介面：提交端點、token
模型與同意檢查。

Everything upstream is blocked on **P-001** — scaffold and provision. Do that first,
then P-002. Your tasks are the ones with real invariants: P-003, P-007, P-010.

所有後續工作都卡在 **P-001**：建立骨架與開通服務。先完成它，再做 P-002。你的任務是
具有真正不變條件的那些：P-003、P-007、P-010。

You also decide the shape of new plan.md entries when a slice lands. Plan the next few
tasks precisely; don't predict the whole project.

當一個切片完成時，也由你決定 plan.md 新條目的形式。精確規劃接下來幾項任務即可，
不要試圖預測整個專案。

### JD (junior developer)｜初階開發者

Work the queue in [`plan.md`](plan.md) § 5 — your tasks are P-005, P-006, P-008, P-009,
P-011, and each one names its files, its verification, and its stopping condition.

依照 [`plan.md`](plan.md) § 5 的工作佇列進行。你的任務是 P-005、P-006、P-008、P-009、
P-011，每一項都已列出涉及的檔案、驗證方式與停止條件。

Two things worth internalizing｜兩件值得內化的事:

- **"Done when" is the whole contract.** When those criteria pass, stop. Don't keep
  improving a task past its stopping condition — pick up the next one.
  **「Done when」就是完整的契約。** 當那些條件通過時就停手。不要在超過停止條件後
  持續「優化」，直接進行下一項。
- **Verify on a real phone at 375px**, not a resized desktop window, and check the
  acceptance criteria one at a time rather than eyeballing the screen.
  **在真實手機上以 375px 驗證**，而不是縮小的桌面瀏覽器視窗；並逐條檢查驗收標準，
  而不是用眼睛掃過畫面。

You're blocked until P-001 lands. Until then: read product-brief.md Steps 1 and 4 and
sketch the layouts.

在 P-001 完成前你會被卡住。在那之前：閱讀 product-brief.md 的 Step 1 與 Step 4，
並先畫出版面草圖。

### PP (presentation / packaging)｜簡報與整體包裝

Own the demo half of [`runbook.md`](runbook.md) and task **P-013**.

你負責 [`runbook.md`](runbook.md) 中的展示部分，以及任務 **P-013**。

Start against the brief, not against working software — the argument the demo makes is
already decided (the pitch is *specific*, and the match can *explain itself*). Build the
run-of-show and the fallbacks now; slot the real screens in as they land.

從規格文件開始，而不是等軟體可用。展示要傳達的論點已經確定：介紹是 *具體的*，配對能
*自我解釋*。現在就建立流程腳本與備援方案，等畫面完成後再放進去。

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
4. Branch: `p-005-prompt-handoff`. Implement it.
   開分支：`p-005-prompt-handoff`，然後實作。
5. Run the gate: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Read the
   **exit status**, not the tail of the output.
   執行檢查關卡：`pnpm typecheck && pnpm lint && pnpm test && pnpm build`。看
   **結束狀態碼**，而不是輸出的尾巴。
6. Compare the result against the named acceptance criteria in
   [`product-brief.md`](product-brief.md), criterion by criterion — not against a vague
   sense that it should work now.
   將結果逐條對照 [`product-brief.md`](product-brief.md) 中指名的驗收標準，而不是
   憑「應該可以了」的模糊感覺。
7. Review the diff for anything unintended. Open a PR; check the Vercel preview on a
   phone.
   檢查 diff 是否有非預期變更。開 PR，並在手機上檢查 Vercel 預覽。
8. Merge. Remove the finished task from plan.md § 5, and append the result to log.md.
   合併。從 plan.md § 5 移除已完成的任務，並將結果追加到 log.md。
9. Only start the next item if the tree is clean.
   只有在工作樹乾淨時，才開始下一項。

## What "done" is not｜什麼不算「完成」

- Not "the agent says it's done."｜不是「agent 說完成了」。
- Not "the build is green" — a green build proves generation, not reachability.
  不是「build 是綠的」；build 通過只證明產生成功，不證明可存取。
- Not "it looked right when I tried it."｜不是「我試了一下看起來沒問題」。

Done is: the named acceptance criteria in the brief were checked one at a time, and
there is evidence for each.

完成的定義是：規格文件中指名的驗收標準已逐條檢查，且每一條都有證據。

## Conventions in one place｜慣例集中處

Environment setup, package manager, branch and commit format, migration and seed rules:
[`plan.md`](plan.md) § 2. Deploy and demo procedure: [`runbook.md`](runbook.md).

環境設定、套件管理器、分支與提交格式、migration 與種子資料規則：[`plan.md`](plan.md)
§ 2。部署與展示程序：[`runbook.md`](runbook.md)。

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
| Runbook scope｜Runbook 範圍 | Deploy + demo only｜僅部署與展示 | No production, no real data — backup/restore and secret rotation would be process theatre here｜無正式環境、無真實資料，備份還原與金鑰輪替在此只是形式主義 |
| Risk mode｜風險模式 | Vibe mode, with the consent and submission paths held to engineering mode｜Vibe mode，但同意與提交路徑維持 engineering mode | Speed everywhere it's cheap; rigor only where the product's thesis lives｜在成本低處全力求快；只在產品核心主張所在處嚴謹 |
| Extra docs｜額外文件 | None｜無 | Five documents is the system. A sixth would go stale before the demo｜五份文件就是完整系統；第六份會在展示前就過期 |
