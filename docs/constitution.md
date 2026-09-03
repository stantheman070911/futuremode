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
| **/PitchYourOwner App (offline).html** | What does it look like?｜它長什麼樣子？ | Visual design, layout, components, UX｜視覺、版面、元件、UX | — Design truth｜設計事實 |
| **docs/design.md** | What is the design system?｜設計系統是什麼？ | Palette, type, geometry, screen inventory — all read from the HTML｜色彩、字體、幾何、畫面清單，皆讀自 HTML | Design decisions not in the HTML｜HTML 中沒有的設計決策 |
| **docs/plan.md** | How is it delivered?｜如何交付？ | Sequencing, the work queue, verification rules｜順序、工作佇列、驗證規則 | A record of what already happened｜已發生事項的紀錄 |
| **docs/log.md** | What is actually true right now?｜現在實際是什麼狀態？ | Status, verification results, blockers, decisions, the immediate objective｜狀態、驗證結果、阻礙、決策、當前目標 | Requirements; instructions for how future work should be built｜需求；未來工作的建造指示 |
| **docs/runbook.md** | How do we run the demo?｜如何進行展示？ | Demo procedure｜展示程序 | Present status — point at log.md instead｜當前狀態，改為指向 log.md |
| Git | What actually exists?｜實際存在什麼？ | Machine truth｜機器事實 | — |

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
| Demo procedure｜展示程序 | Update runbook.md｜更新 runbook.md |
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
| /PitchYourOwner App (offline).html | Design owner. It is the design source of truth; documentation follows it, not the reverse.｜設計負責人。它是設計事實來源，文件跟隨它，而非相反。 |
| design.md | Anyone, but only to record what the HTML already shows.｜任何人，但只能記錄 HTML 已呈現的內容。 |
| plan.md | Team + agents, collaboratively — the normal working document.｜團隊與 agent 協作，日常工作文件。 |
| log.md | Mostly agent-maintained, append-only. Correct a factual error; do not rewrite history.｜主要由 agent 維護，僅追加。可更正事實錯誤，但不得改寫歷史。 |
| runbook.md | Presentation owner + PM.｜簡報負責人與 PM。 |

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
- Never weaken or delete a criterion to make it pass. Fix the thing it measures.
  絕不透過削弱或刪除標準讓它通過。修正它所衡量的對象。
- Secrets and real user data never enter documents, chat, or committed files.
  機密資訊與真實使用者資料絕不進入文件、對話或已提交的檔案。
- Work lands in small, independently verifiable increments.
  工作以小型、可獨立驗證的增量交付。

Project-specific, born from what this product actually is:

以下為本產品特有的規則，源自產品本質：

- **Raw conversation content never enters the product.** It is refused on the way in,
  and nothing stores, logs, or forwards it. This is a product promise in the north star,
  not a nice-to-have, and the app says so on screen.
  **原始對話內容永不進入產品。** 它在入口就被拒絕，且不被儲存、記錄或轉發。
  這是北極星文件中的產品承諾，不是加分項，且 App 會在畫面上明說這一點。
- **Nothing is published without the owner's explicit confirmation.** A proposal that
  has not been explicitly confirmed is never matchable and never visible to another
  user. Silence, ambiguity, or edits without confirmation do not authorize publication.
  **未經 owner 明確確認的內容不得發布。** 未經明確確認的提案永遠不可配對，
  也不對其他使用者可見。未回覆、回覆不明確或僅修改而未確認，都不構成授權。
- **Publication authority is short-lived, single-use, write-only, and draft-only.**
  Authority that can read a profile, list users, or do anything but create one draft is
  a defect.
  **發布權限必須短期、一次性、僅可寫入、且僅能建立草稿。** 若該權限能讀取檔案、
  列出使用者，或做草稿以外的任何事，即為缺陷。
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

## Law IV-b — Implementation is out of scope｜法則四之二：實作不在範圍內

The project is in a **product and design phase**. No document may contain a framework,
database, hosting, API, deployment, or infrastructure decision. A requirement is written
as *what must be true for the user*, never as how it is built.

本專案處於 **產品與設計階段**。任何文件都不得包含框架、資料庫、託管、API、部署或基礎
設施決策。需求一律寫成 *對使用者而言必須成立什麼*，絕不寫成如何建造。

Bad｜錯誤: "Store the submission and trigger a background job."
Good｜正確: "When the user confirms, the profile is published and they see a confirmation."

An agent that finds itself specifying a technology has left the current scope. Stop and
ask the PM.

若 agent 發現自己正在指定某項技術，就已經超出當前範圍。請停下並詢問 PM。

This law is lifted only by an explicit PM decision recorded in log.md.

此法則只能由 PM 明確決策並記錄於 log.md 後解除。

## Law V — Risk mode｜法則五：風險模式

This project is in **vibe mode** for the hackathon: a prototype, ~10–30 pre-recruited
participants, no payments, no production users.

本專案在 hackathon 期間處於 **vibe mode**：原型階段、約 10–30 位預先招募的參與者、
無金流、無正式使用者。

Vibe mode buys speed on layout, styling, sample data, and iteration. It does **not**
relax the five project-specific rules in Law IV — those are the product's thesis, and a
demo that violates them is a demo of a different product. The consent moment in
particular is held to the strictest standard even while everything around it moves fast.

Vibe mode 讓版面、樣式、範例資料與迭代得以加速，但 **不放寬** 法則四中的五項產品專屬
規則：那些規則就是產品的核心主張，違反它們的展示等於在展示另一個產品。尤其是同意的
那一刻，即使周邊一切都在快速推進，它仍須維持最嚴格的標準。

Moving a surface from vibe to engineering mode is a one-way door.

將任一介面從 vibe mode 轉為 engineering mode 是單向決定，不可回頭。

## Law VI — Amendments｜法則六：修訂

An amendment exists only to reconcile or explicitly change an existing rule. Once
accepted, fold it into the relevant Law above and delete the amendment.

修訂只用於調和或明確變更既有規則。一旦被接受，就應併入上述對應法則並刪除該修訂條目。

_Active amendments｜生效中的修訂: none｜無_
