# PitchYourOwner — Constitution｜專案憲法

_Last updated｜最後更新: 2026-09-03_
_Role｜角色: the permanent rules every other document and every agent session must obey_
_永久規則，所有其他文件與所有 agent 工作階段都必須遵守_

This is the only document a coding agent may not edit on its own. Changes here are
human-approved (PM), deliberate, and rare.

這是唯一不允許 coding agent 自行修改的文件。此處的變更必須由 PM 核准，且應謹慎而罕見。

## Law 0 — The north star is frozen｜法則零：北極星文件已凍結

[`/README.md`](../README.md) is the original, untouched product memo. It is the
project's north-star reference and is **read-only for the life of the hackathon** —
nobody, human or agent, edits it. When the live PRD and the north star disagree, that
is a signal to talk to the PM, not to edit either file silently.

[`/README.md`](../README.md) 是原始且未經修改的產品備忘錄，作為專案的北極星參考，
在整個 hackathon 期間 **唯讀**：無論是人或 agent 都不得修改。當現行 PRD 與北極星
文件不一致時，應與 PM 討論，而不是私下修改任一份文件。

## Law I — What each document owns｜法則一：各文件的權責範圍

| Document｜文件 | Question it answers｜回答的問題 | Owns｜擁有 | Must not contain｜不得包含 |
| --- | --- | --- | --- |
| **/README.md** | What was the original vision?｜原始願景是什麼？ | Frozen product memo｜已凍結的產品備忘錄 | Anything. It is never edited.｜任何內容。永不修改。 |
| **docs/product-brief.md** | What are we building, and why?｜我們在建什麼，為什麼？ | Requirements, user-visible behaviour, acceptance criteria, scope decisions｜需求、使用者可見行為、驗收標準、範圍決策 | Implementation detail, status, history｜實作細節、狀態、歷史 |
| **docs/plan.md** | How are we building it?｜我們如何建造？ | Architecture, constraints, the work queue, verification rules｜架構、限制、工作佇列、驗證規則 | A record of what already happened｜已發生事項的紀錄 |
| **docs/log.md** | What is actually true right now?｜現在實際是什麼狀態？ | Status, verification results, blockers, decisions, the immediate objective｜狀態、驗證結果、阻礙、決策、當前目標 | Requirements; instructions for how future work should be built｜需求；未來工作的建造指示 |
| **docs/runbook.md** | How do we deploy, demo, and recover?｜如何部署、展示與復原？ | Operational + demo procedure｜維運與展示程序 | Present status — point at log.md instead｜當前狀態，改為指向 log.md |
| Code + tests + Git | What actually exists?｜實際存在什麼？ | Machine truth｜機器事實 | — |

The documents **control** the work. They may never override what the repository, the
test suite, and Git history actually demonstrate. When a document and the code
disagree, the code is right and the document is wrong until proven otherwise.

文件 **控制** 工作內容，但永遠不能凌駕於儲存庫、測試套件與 Git 歷史所實際呈現的事實。
當文件與程式碼不一致時，除非另有證明，否則以程式碼為準，文件為錯。

**Routing a change｜變更歸屬:**

| Kind of change｜變更類型 | Action｜處理方式 |
| --- | --- |
| Product scope or acceptance criteria｜產品範圍或驗收標準 | Update product-brief.md (PM approves); update plan.md only if implementation must change; note the consequence in log.md｜更新 product-brief.md（需 PM 核准）；僅在實作必須改變時更新 plan.md；於 log.md 記錄影響 |
| Architecture, implementation, sequencing｜架構、實作、順序 | Update plan.md; update log.md if current state changed; leave product-brief.md untouched unless product behaviour changed｜更新 plan.md；若現況改變則更新 log.md；除非產品行為改變，否則不動 product-brief.md |
| Deploy or demo procedure｜部署或展示程序 | Update runbook.md｜更新 runbook.md |
| Status, blocker, completion, priority｜狀態、阻礙、完成、優先序 | Update log.md only｜僅更新 log.md |
| Resolved problem with no lasting constraint｜已解決且無長期影響的問題 | Record it nowhere｜不必記錄 |

**One fact, one home.** A document may reference a fact another document owns, but
never keeps its own copy.

**一項事實，只有一個歸屬。** 文件可以引用其他文件擁有的事實，但絕不保留自己的副本。

## Law II — Document authority is asymmetric｜法則二：文件權限不對等

Do not let an agent freely edit all documents — that is how an agent quietly "solves" a
hard requirement by rewriting the requirement instead of the code.

不要讓 agent 自由修改所有文件；那正是 agent 會透過改寫需求（而非修改程式碼）來
「解決」困難需求的途徑。

| Document｜文件 | Who may change it｜誰可以修改 |
| --- | --- |
| /README.md | Nobody. Frozen (Law 0).｜無人。已凍結（法則零）。 |
| constitution.md | PM only. An agent may propose a change; it may never apply one unasked.｜僅限 PM。Agent 可提出建議，但絕不得自行套用。 |
| product-brief.md | PM-approved. A dev or agent may propose an amendment when implementation exposes a genuine product ambiguity, but does not merge it unasked.｜需 PM 核准。當實作揭露真正的產品模糊時，開發者或 agent 可提出修訂，但不得自行合併。 |
| plan.md | Senior dev + agents, collaboratively — the normal working document.｜資深開發者與 agent 協作，日常工作文件。 |
| log.md | Mostly agent-maintained, append-only. Correct a factual error; do not rewrite history.｜主要由 agent 維護，僅追加。可更正事實錯誤，但不得改寫歷史。 |
| runbook.md | Senior dev + presentation owner.｜資深開發者與簡報負責人。 |

## Law III — Retention｜法則三：保留原則

Every line must answer one of: what must the product do; how must it be built or
verified; what is true right now; what operational step is next. A sentence that
answers none of these belongs in Git history or nowhere.

每一行都必須回答以下其中之一：產品必須做什麼；必須如何建造或驗證；現在的事實為何；
下一個維運步驟是什麼。無法回答其中任何一項的句子，應留在 Git 歷史中，或根本不該存在。

When state changes, the new statement **replaces** the old one — log.md is not a diary
of superseded status.

當狀態改變時，新的敘述 **取代** 舊的敘述；log.md 不是累積過時狀態的日記。

## Law IV — Engineering rules｜法則四：工程規則

Non-negotiable, regardless of what any single session decides in the moment:

不可妥協，無論任何單次工作階段當下如何決定：

- Never mark a task complete solely because an agent says it is complete. Completion
  requires the acceptance criteria in product-brief.md to be independently verified.
  絕不僅因為 agent 宣稱完成就標記任務完成。完成必須經由 product-brief.md 的驗收標準
  獨立驗證。
- Every must-have requirement has an observable acceptance criterion before work on it
  starts.｜每項必要需求在動工前都必須有可觀察的驗收標準。
- Never weaken, skip, or remove a failing test to make the suite green. Fix the cause.
  絕不透過削弱、跳過或刪除失敗的測試讓套件變綠。修正根本原因。
- No new dependency without a one-line reason in plan.md for why it is required.
  新增任何依賴套件，都必須在 plan.md 以一行說明其必要性。
- Secrets never enter source code, chat, or committed files.
  機密資訊絕不進入原始碼、對話或已提交的檔案。
- Work lands in small, independently verifiable increments.
  工作以小型、可獨立驗證的增量交付。

Project-specific, born from what this product actually is:

以下為本產品特有的規則，源自產品本質：

- **Raw conversation content never enters the system.** The submission endpoint
  rejects it, and no code path stores, logs, or forwards it. This is a product promise
  in the north star, not a nice-to-have.
  **原始對話內容永不進入系統。** 提交端點必須拒絕它，且不得有任何程式路徑儲存、
  記錄或轉發它。這是北極星文件中的產品承諾，不是加分項。
- **No profile is published without `owner_confirmed: true`.** A draft that has not
  been explicitly confirmed is never matchable, never visible to another user.
  **未帶 `owner_confirmed: true` 的檔案不得發布。** 未經明確確認的草稿永遠不可配對，
  也不對其他使用者可見。
- **Upload tokens are short-lived, single-use, write-only, and draft-only.** A token
  that can read a profile, list users, or write anything but one draft is a bug.
  **上傳 token 必須短期、一次性、僅可寫入、且僅能建立草稿。** 若 token 能讀取檔案、
  列出使用者，或寫入草稿以外的任何內容，即為 bug。
- **Every match must be able to state its own reason.** If a match cannot name the
  shared interest, motivation, problem, or topic behind it, it is not shown.
  Explainability is a hard requirement — this rules out opaque similarity scoring as
  the sole ranking mechanism.
  **每個配對都必須能說出自己的理由。** 若配對無法指出背後共享的興趣、動機、問題或
  主題，就不得顯示。可解釋性是硬性需求，因此排除以不透明相似度評分作為唯一排序機制。
- **No engagement mechanics.** No public scores, follower counts, popularity rankings,
  infinite feeds, or swipe decks. If a task drifts toward one, stop and ask the PM.
  **不得加入互動誘導機制。** 不得有公開分數、追蹤者數量、人氣排行、無限動態牆或
  滑動卡片。若任務開始朝這些方向偏移，請停下並詢問 PM。

## Law V — Risk mode｜法則五：風險模式

This project is in **vibe mode** for the hackathon: a prototype, ~10–30 pre-recruited
participants, no payments, no production users.

本專案在 hackathon 期間處於 **vibe mode**：原型階段、約 10–30 位預先招募的參與者、
無金流、無正式使用者。

Vibe mode buys speed on UI, styling, seed data, and iteration. It does **not** relax
the five project-specific rules in Law IV — those are the product's thesis, and a demo
that violates them is a demo of a different product. Treat the submission endpoint and
the consent flow as engineering mode even while everything around them is vibe mode.

Vibe mode 讓 UI、樣式、種子資料與迭代得以加速，但 **不放寬** 法則四中的五項產品專屬
規則：那些規則就是產品的核心主張，違反它們的展示等於在展示另一個產品。即使周邊全部
處於 vibe mode，提交端點與同意流程仍須以 engineering mode 對待。

Moving a surface from vibe to engineering mode is a one-way door.

將任一介面從 vibe mode 轉為 engineering mode 是單向決定，不可回頭。

## Law VI — Amendments｜法則六：修訂

An amendment exists only to reconcile or explicitly change an existing rule. Once
accepted, fold it into the relevant Law above and delete the amendment.

修訂只用於調和或明確變更既有規則。一旦被接受，就應併入上述對應法則並刪除該修訂條目。

_Active amendments｜生效中的修訂: none｜無_
