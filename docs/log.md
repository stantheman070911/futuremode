# PitchYourOwner — Development Log｜開發日誌

_Last updated｜最後更新: 2026-09-03_
_Role｜角色: what is verified true right now · governed by
[`constitution.md`](constitution.md)_
_目前經驗證為真的事實 · 受 [`constitution.md`](constitution.md) 規範_

This document is what makes a brand-new session (human or agent) productive after 30
seconds of reading. It is **append-only and operational — not a diary.** Replace a stale
line with the new true statement; do not narrate the journey.

這份文件讓全新的工作階段（無論是人或 agent）在閱讀 30 秒後就能開始有效工作。它是
**僅追加且以維運為主的文件，不是日記。** 用新的事實敘述取代過時的那一行，不要敘述
過程。

Entry format｜條目格式:

```
YYYY-MM-DD / Session N
Completed:        [P-IDs]
Verified:         [what passed, against what]
Changed decision: [what changed, and which doc was updated]
Known issue:      [what is broken]
Current blocker:  [what is waiting on what]
Next:             [P-ID]
Commit:           [sha]
```

Session entries may be written in a single language for speed — this is the one place
where bilingual is optional, because entries are ephemeral and replaced often. Structure
and headings stay bilingual.

為求速度，工作階段條目可以只用單一語言撰寫。這是唯一允許不雙語的地方，因為條目是
短暫且經常被取代的。結構與標題仍維持雙語。

---

## Deployed state｜部署狀態

Nothing deployed. No application code exists yet — the repository currently contains
documentation only.

尚未部署。目前沒有任何應用程式碼，儲存庫只包含文件。

## Verification results｜驗證結果

| Check｜檢查項目 | Verified result｜驗證結果 |
| --- | --- |
| Documentation structure｜文件結構 | 2026-09-03 — five-document system in place; `/README.md` confirmed byte-identical to the original brief (sha256 `ca4a4f83…`, verified by `cmp` + `shasum`)｜五份文件系統已就位；`/README.md` 經確認與原始規格位元組完全相同 |
| Internal doc links｜文件內部連結 | 2026-09-03 — every relative `.md` link across `docs/` and `CLAUDE.md` resolves to an existing file｜`docs/` 與 `CLAUDE.md` 中所有相對 `.md` 連結都指向存在的檔案 |
| Gate command｜檢查關卡 | Not yet run — no code to gate. Blocked on P-001｜尚未執行，無程式碼可檢查。卡在 P-001 |

Only put a result here once it has actually been run. A row that says what *should*
pass is a plan, not a log.

只有實際執行過的結果才能寫在這裡。描述「應該會通過」的資料列屬於計畫，不是日誌。

## Configuration state｜組態狀態

Identifiers and provisioning facts other documents reference. Read here, not copied
elsewhere.

其他文件所引用的識別碼與開通事實。在此讀取，不要複製到別處。

| Value｜項目 | Confirmed state｜已確認狀態 |
| --- | --- |
| Git repository｜Git 儲存庫 | Initialized. Remote `origin` = `github.com/stantheman070911/futuremode`, default branch `main`. `gh` authenticated as `stantheman070911`｜已初始化，遠端與預設分支如左，`gh` 已登入 |
| Node version｜Node 版本 | Not confirmed on team machines｜尚未在團隊機器上確認 |
| Supabase project｜Supabase 專案 | Not created｜尚未建立 |
| Vercel project｜Vercel 專案 | Not created｜尚未建立 |
| `SUPABASE_URL` / anon key | Not provisioned｜尚未開通 |
| `SUPABASE_SERVICE_ROLE_KEY` | Not provisioned — server-side only, never client-reachable｜尚未開通；僅限伺服器端，絕不可被用戶端存取 |

Confirm presence of a secret by variable name only. Never paste a value here.

確認機密資訊只能以變數名稱為之。絕不在此貼上實際值。

## Step status｜步驟狀態

| Step (from product-brief.md)｜步驟 | Status｜狀態 | Open condition｜未決條件 |
| --- | --- | --- |
| Step 1 — Prompt handoff｜提示詞交接 | Not started｜尚未開始 | Blocked on P-001｜卡在 P-001 |
| Step 2 — Pitch generation｜介紹產生 | Not started｜尚未開始 | P-004 can start now; needs no code｜P-004 可立即開始，不需程式碼 |
| Step 3 — Sensitive-data + confirmation｜敏感資料與確認 | Not started｜尚未開始 | Part of P-004｜屬於 P-004 |
| Step 4 — Submission + My Pitch｜提交與我的介紹 | Not started｜尚未開始 | Blocked on P-002｜卡在 P-002 |
| Step 5 — Explainable matching｜可解釋配對 | Not started｜尚未開始 | Blocked on P-002｜卡在 P-002 |
| Step 6 — Notification + invitation｜通知與邀請 | Not started｜尚未開始 | Blocked on P-007｜卡在 P-007 |

## Open items｜未決項目

Numbered, each with what's blocking it. State clearly when an item is deferred rather
than dropped — a hold must not quietly become an acceptance.

逐項編號並說明阻礙為何。若項目是延後而非放棄，必須明確標示；暫緩不得悄悄變成接受。

1. **Tech stack is decided but unprovisioned.** Next.js + Supabase + Vercel is chosen
   (plan.md § 1); no accounts or projects exist yet.
   **技術堆疊已決定但尚未開通。** 已選定 Next.js + Supabase + Vercel（plan.md § 1），
   但尚未建立任何帳號或專案。
2. **Prompt quality is the project's largest unknown.** P-004 has no code dependency and
   its failure mode is invisible until tested against real assistants. Start it first,
   in parallel with P-001.
   **提示詞品質是專案最大的未知數。** P-004 不依賴程式碼，且在對真實助理實測前看不出
   失敗徵兆。應優先啟動，與 P-001 並行。
3. **Only `main` exists.** plan.md § 2 requires a branch per work-queue item; nobody
   has branched yet. The first task to start should be the first to branch.
   **目前只有 `main` 分支。** plan.md § 2 要求每項工作佇列任務開一個分支，但尚無人開
   分支。第一個啟動的任務應該是第一個開分支的。

## Deferred｜延後項目

Things intentionally not being done now, and the condition that reopens them.

刻意暫不進行的事項，以及重啟它們的條件。

- Real push notifications｜真實推播通知 — waits on the demo being complete and time
  remaining｜等展示完成且仍有時間
- Deep links into ChatGPT/Claude beyond copy + share｜複製與分享以外的深層連結 —
  waits on P-005 landing｜等 P-005 完成
- QR handoff｜QR 交接 — waits on a demonstrated phone→desktop need｜等出現實際的
  手機到桌機需求
- Profile export/deletion UI｜檔案匯出與刪除介面 — the capability is a constraint; the
  polished screen waits on the core loop working end to end｜該能力屬於限制條件；
  精緻畫面等核心流程端到端可用後再做

## Immediate objective｜當前目標

Two things, in parallel｜兩件事並行:

- **SD:** P-001 — scaffold, provision Supabase and Vercel, get the gate command green.
  Everything else is blocked on this.
  **資深開發者：** P-001 — 建立骨架、開通 Supabase 與 Vercel、讓檢查關卡通過。
  其他所有工作都卡在這裡。
- **PM:** P-004 — draft the prompt template. It needs no code and it is the highest-risk
  unknown in the project.
  **產品經理：** P-004 — 撰寫提示詞模板。不需程式碼，且是專案中風險最高的未知數。

**JD** is blocked until P-001 lands. Useful in the meantime: read `product-brief.md`
Steps 1 and 4, and sketch the 375px layouts for P-005 and P-008.

**初階開發者** 在 P-001 完成前被卡住。在此期間可做：閱讀 `product-brief.md` 的 Step 1
與 Step 4，並為 P-005 與 P-008 畫出 375px 版面草圖。

**PP** should start P-013 planning against the brief, not against working software.

**簡報負責人** 應依規格文件開始規劃 P-013，不必等軟體可用。

Must **not** happen while these are open: no UI work against a stack that isn't
scaffolded, and no schema changes outside `supabase/migrations/`.

在這些項目未結束前 **不得** 發生：不得對尚未建立骨架的技術堆疊做 UI 開發，
也不得在 `supabase/migrations/` 之外變更結構。

---

## Session history｜工作階段歷史

```
2026-09-03 / Session 1
Completed:        Documentation system setup; all documents converted to bilingual
                  EN + 繁中
Verified:         /README.md byte-identical to original docs/product-brief.md
                  (cmp + sha256 match); all internal doc links resolve
Changed decision: Stack chosen — Next.js PWA + Supabase + Vercel over Expo (PM
                  decision); plan.md § 1 records the reasoning
Changed decision: Original brief archived as /README.md at root rather than
                  docs/archive/ (PM decision); constitution Law 0 freezes it
Changed decision: All documents bilingual, not just product-brief.md (PM decision);
                  convention recorded in docs/README.md § Language convention
Known issue:      /README.md H1 restored to the bilingual original
                  ("Product Memo｜產品備忘錄"). Upstream c27620b had dropped the
                  Chinese half; Law 0 requires the archive be byte-identical to the
                  original brief. Revert only if the English-only title was deliberate.
Current blocker:  None
Next:             P-001 (SD), P-004 (PM), in parallel
Branch:           docs/doc-system-setup (PR #1)
```
