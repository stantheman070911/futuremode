# PitchYourOwner — Agent Instructions｜Agent 指示

## Read these first｜請先閱讀

Before doing anything in this repository, read [`docs/README.md`](docs/README.md). It
explains the five-document system, who owns which document, and the working loop.

在這個儲存庫做任何事之前，請先閱讀 [`docs/README.md`](docs/README.md)。它說明五份文件
的系統、各文件的負責人，以及工作循環。

The short version｜簡短版:

| Document｜文件 | Question｜問題 | May you edit it?｜可以修改嗎？ |
| --- | --- | --- |
| `/README.md` | The original, frozen product memo｜原始且已凍結的產品備忘錄 | **Never｜絕不** |
| `docs/constitution.md` | Permanent rules｜永久規則 | Propose only — never apply unasked｜只能建議，絕不自行套用 |
| `docs/product-brief.md` | Requirements + acceptance criteria｜需求與驗收標準 | Propose only — PM approves｜只能建議，需 PM 核准 |
| `docs/plan.md` | Architecture + work queue｜架構與工作佇列 | Yes, collaboratively｜可以，協作進行 |
| `docs/log.md` | What is true right now｜現在的事實 | Yes, append-only｜可以，僅追加 |
| `docs/runbook.md` | Deploy + demo procedure｜部署與展示程序 | Yes｜可以 |

**When a document and the code disagree, the code is right.**

**當文件與程式碼不一致時，以程式碼為準。**

Never resolve a failing acceptance criterion by editing the acceptance criterion.
Requirements live in `docs/product-brief.md`; whether they're met lives in
`docs/log.md`. Keeping those separate is the point of the system.

絕不透過修改驗收標準來解決未通過的驗收標準。需求存放於 `docs/product-brief.md`，
是否達成則存放於 `docs/log.md`。將兩者分開正是這套系統的用意。

Pick one bounded task from `docs/plan.md` § 5, implement it, run the gate, verify
against the criteria the task names, then update `docs/plan.md` and `docs/log.md`.

從 `docs/plan.md` § 5 挑一項有界限的任務，實作它，執行檢查關卡，依該任務指名的標準
驗證，然後更新 `docs/plan.md` 與 `docs/log.md`。

## Language convention｜語言慣例

All documents are bilingual English + 繁體中文. Headings and table cells use
`Heading｜標題`; prose is an English paragraph followed by its Chinese counterpart.
Commands, file paths, code identifiers, and variable names stay untranslated. When you
edit a document, keep both languages in sync — a change to one half without the other
is an incomplete edit.

所有文件皆為英文與繁體中文雙語。標題與表格儲存格使用 `Heading｜標題`；段落以英文在前、
中文在後。指令、檔案路徑、程式識別字與變數名稱維持原文。當你修改文件時，必須同步更新
兩種語言；只改其中一半的修改視為未完成。

---

### Rules for Coding｜開發規則

#### Prime Directive｜最高原則

**There is nothing so useless as doing efficiently that which should not be done at all.**

**沒有什麼比高效率地做一件根本不該做的事更沒用。**

Before optimizing execution, confirm that the proposed work is necessary, appropriate,
and aligned with the actual objective.

在優化執行方式之前，先確認這項工作是必要的、適當的，且與真正的目標一致。

#### 1. Read Before You Write｜先閱讀，再撰寫

Inspect the relevant files, code, configuration, documentation, and surrounding context
before making changes.

在做任何修改前，先檢視相關的檔案、程式碼、設定、文件與周邊脈絡。

Do not modify code you have not first understood in context.

不要修改你尚未在脈絡中理解的程式碼。

#### 2. Understand Before You Modify｜先理解，再修改

Determine what the existing system does, why it behaves that way, and what constraints
it operates under before proposing a change.

在提出變更前，先弄清楚現有系統做什麼、為何如此運作，以及它受到哪些限制。

Do not treat symptoms without understanding the underlying behavior.

不要在不理解底層行為的情況下處理表面症狀。

#### 3. State Assumptions Explicitly｜明確陳述假設

When information is uncertain or incomplete, state the assumption being made before
acting on it.

當資訊不確定或不完整時，先陳述你所做的假設，再據此行動。

Do not silently convert uncertainty into fact.

不要默默地把不確定當成事實。

#### 4. Do Not Invent Architecture｜不要發明架構

Work with the architecture that actually exists.

依照實際存在的架構工作。

Do not fabricate abstractions, services, interfaces, dependencies, conventions, or
future requirements that are not supported by the repository or the task.

不要虛構儲存庫或任務並不支持的抽象層、服務、介面、依賴、慣例或未來需求。

#### 5. Prefer the Smallest Correct Change｜偏好最小的正確變更

Make the simplest change that fully solves the problem.

做出能完整解決問題的最簡單變更。

Minimize affected files, dependencies, abstractions, and behavioral surface area.
Complexity requires justification.

盡量減少受影響的檔案、依賴、抽象層與行為表面。複雜度必須有正當理由。

#### 6. Do Not Refactor for Display｜不要為了展示而重構

Do not rewrite, restructure, generalize, or modernize unrelated code merely to
demonstrate sophistication.

不要僅為了展現技巧，而改寫、重組、泛化或現代化無關的程式碼。

Refactoring is justified only when it materially improves the requested change,
correctness, maintainability, or safety.

只有當重構實質改善了所要求的變更、正確性、可維護性或安全性時，才有正當理由。

#### 7. Every Change Must Be Explainable｜每項變更都必須能被解釋

Each meaningful action should have a clear reason tied to evidence, requirements, or an
identified problem.

每個有意義的動作都應有清楚的理由，並連結到證據、需求或已識別的問題。

If a change cannot be explained simply, reconsider whether it should be made.

如果一項變更無法被簡單解釋，就重新考慮它是否該被做。

#### 8. Verify the Result, Not Just the Edit｜驗證結果，而不只是修改本身

After making changes, inspect the resulting behavior and output.

做完修改後，檢視最終的行為與輸出。

Do not assume that syntactically valid code or a successful edit means the task is
complete.

不要以為語法正確的程式碼或成功的編輯就代表任務完成。

#### 9. Test Before Delivery｜交付前先測試

Run the relevant tests, checks, builds, linters, type checks, or validation commands
before declaring the work complete.

在宣告工作完成前，執行相關的測試、檢查、建置、linter、型別檢查或驗證指令。

If verification cannot be performed, state exactly what was not verified and why.

若無法執行驗證，請明確說明哪些未被驗證以及原因。

#### 10. Learn From Repeated Failures｜從重複的失敗中學習

When the same class of error occurs more than once, record the lesson and adjust the
approach so it is not repeated.

當同一類錯誤發生超過一次時，記錄教訓並調整做法，避免重蹈覆轍。

Repeated mistakes should produce durable improvements in reasoning, process, tests, or
documentation.

重複的錯誤應轉化為推理、流程、測試或文件上的長久改善。

#### 11. Preserve What Does Not Need to Change｜保留不需要改變的部分

Treat existing working behavior as a constraint.

將既有可運作的行為視為限制條件。

Avoid unrelated edits and preserve established interfaces, conventions, and behavior
unless changing them is necessary to accomplish the task.

避免無關的修改，並保留既有的介面、慣例與行為，除非變更它們是完成任務所必需。

#### 12. Completion Requires Evidence｜完成需要證據

A task is complete only when｜任務只有在以下條件全部成立時才算完成:

* the relevant context was inspected;｜相關脈絡已被檢視；
* the requested change was implemented;｜所要求的變更已被實作；
* assumptions and limitations are explicit;｜假設與限制已明確陳述；
* unnecessary scope was avoided;｜已避免不必要的範圍；
* the resulting behavior was verified; and｜最終行為已被驗證；且
* relevant tests or checks were run successfully, or any inability to run them was
  clearly disclosed.｜相關測試或檢查已成功執行，或已清楚揭露無法執行的原因。

**Default operating principle: understand first, change minimally, verify rigorously.**

**預設運作原則：先理解，最小變更，嚴格驗證。**
