# PitchYourOwner — Operations & Demo Runbook｜維運與展示手冊

_Role｜角色: the procedure for deploying and demoing the system · governed by
[`constitution.md`](constitution.md)_
_部署與展示系統的程序 · 受 [`constitution.md`](constitution.md) 規範_

This document states the **procedure**, not the current status — for what has actually
been done, see [`log.md`](log.md).

本文件陳述 **程序**，而非當前狀態。實際已完成的事項請見 [`log.md`](log.md)。

Scope note: this is a hackathon prototype in vibe mode (constitution Law V). There is no
production, no real user data, and no backup/restore or secret-rotation procedure. If
this project ever takes real users, that changes and this document grows first.

範圍說明：本專案是處於 vibe mode 的 hackathon 原型（憲法法則五）。沒有正式環境、沒有
真實使用者資料，也沒有備份還原或金鑰輪替程序。若本專案日後接受真實使用者，這一點就會
改變，且本文件必須先行擴充。

---

## Secret handling｜機密資訊處理

Applies to every step below｜適用於以下所有步驟:

- Generate each secret independently — never reuse one value across two purposes.
  每個機密都獨立產生，絕不將同一個值用於兩種用途。
- Use a real generator: `openssl rand -base64 32`. A length check is not a strength check.
  使用真正的產生器：`openssl rand -base64 32`。檢查長度不等於檢查強度。
- Different values in local and deployed environments. A leaked local secret should cost
  nothing.
  本地與部署環境使用不同的值。本地機密外洩應該毫無代價。
- Never place a secret in chat, a commit, shell history, a screenshot, or this document.
  Confirm presence by **variable name only**.
  絕不將機密放入對話、提交、shell 歷史、螢幕截圖或本文件。確認存在時 **只使用變數名稱**。
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only. If it ever appears in a
  `NEXT_PUBLIC_*` variable or reaches the browser bundle, that is an incident: rotate it
  and note it in log.md.
  `SUPABASE_SERVICE_ROLE_KEY` 僅限伺服器端。若它出現在 `NEXT_PUBLIC_*` 變數或進入瀏覽器
  bundle，即屬事故：立即輪替並記錄於 log.md。

## Variables｜變數

| Variable｜變數 | Source｜來源 | Same value in every environment?｜各環境是否同值？ |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings｜Supabase 專案設定 | yes｜是 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings｜Supabase 專案設定 | yes｜是 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings — **server only**｜**僅伺服器端** | yes｜是 |
| `UPLOAD_TOKEN_SECRET` | `openssl rand -base64 32` | **no** — different per environment｜**否**，每個環境不同 |
| `NEXT_PUBLIC_APP_URL` | Vercel deployment URL｜Vercel 部署網址 | no｜否 |

Every variable is listed by name in the committed `.env.example`. Adding a variable
without adding it there is how the next person's local build breaks.

所有變數都以名稱列在已提交的 `.env.example` 中。新增變數卻沒有同步加入該檔，正是
下一個人本地建置失敗的原因。

## Configuration probes｜組態探測

Prove a secret is *configured* without printing it.

在不列印機密的前提下，證明它 *已設定*。

| Probe｜探測 | Configured (fail-closed) response｜已設定時的回應 | Misconfiguration signal｜設定錯誤的徵兆 |
| --- | --- | --- |
| `POST /api/submit_owner_pitch` with no token｜未帶 token | 401 | 500 = `UPLOAD_TOKEN_SECRET` missing｜遺失 |
| `POST /api/submit_owner_pitch` with a used token｜使用已用過的 token | 409 duplicate｜重複 | 200 = `used_at` not being set｜未被設定 |
| Any page load｜任一頁面載入 | 200 | 500 referencing Supabase = env vars missing on Vercel｜Vercel 上缺少環境變數 |

---

## Routine release｜例行發布

Every deployment that changes schema or application code.

每一次變更結構或應用程式碼的部署。

1. Run the gate locally and read the **exit status**:
   在本地執行檢查關卡，並讀取 **結束狀態碼**：
   `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && pnpm build`
2. If the change includes a migration｜若變更包含 migration:
   - A migration that only **adds** (a table, a column, an index) may proceed.
     只做 **新增**（資料表、欄位、索引）的 migration 可以直接進行。
   - A migration that **alters or drops** existing data does not run against the demo
     database within 24 hours of the demo. Add a new column instead.
     **修改或刪除** 既有資料的 migration，在展示前 24 小時內不得對展示資料庫執行；
     改為新增欄位。
3. Push the branch and open a PR. Vercel builds a preview URL.
   推送分支並開 PR。Vercel 會建立預覽網址。
4. **Open the preview URL on a real phone**, not a resized desktop window, and walk the
   acceptance criteria for the step you changed.
   **在真實手機上開啟預覽網址**，而非縮小的桌面視窗，並逐條走過你所變更步驟的驗收標準。
5. Merge to `main`. Vercel promotes to the demo URL.
   合併到 `main`。Vercel 會發布到展示網址。
6. Re-check the critical path end to end: create session → submit → My Pitch → Matches
   → Invite. This path cannot ship broken.
   重新端到端檢查關鍵路徑：建立工作階段 → 提交 → 我的介紹 → 配對 → 邀請。
   這條路徑絕不能帶著故障上線。

## Deploying the demo database｜部署展示資料庫

1. `supabase db push` applies `supabase/migrations/` in order.
   `supabase db push` 會依序套用 `supabase/migrations/`。
2. `supabase db reset` re-applies migrations **and** re-runs `supabase/seed.sql`. This
   destroys all data in the demo database — it is the right move before a demo and the
   wrong move during one.
   `supabase db reset` 會重新套用 migration **並** 重跑 `supabase/seed.sql`，這會摧毀
   展示資料庫中的所有資料。展示前執行是對的，展示中執行是錯的。
3. After seeding, confirm the intended pairs: the two matching pairs appear and the
   broad-domain-only pair does not (brief R5.3).
   植入種子後確認預期組合：兩組應配對的出現，僅共享廣泛領域的那組不出現（規格 R5.3）。

---

## Demo run-of-show (P-013)｜展示流程腳本

Owned by the presentation/packaging teammate, with the PM.

由簡報與包裝負責人主導，PM 協同。

### Before the demo｜展示前

- [ ] `supabase db reset` to a known-good seeded state, then **do not touch the database
      again**.｜重置到已知良好的種子狀態，之後 **不再碰資料庫**。
- [ ] Demo accounts logged in on the demo phone, browser cache warm.
      展示手機上已登入展示帳號，瀏覽器快取已預熱。
- [ ] Screen recording of the full happy path saved locally as the fallback.
      完整順利流程的螢幕錄影已存於本機作為備援。
- [ ] Live AI call rehearsed on the venue network — this is the step most likely to fail
      in front of judges.｜在會場網路上彩排現場 AI 呼叫；這是最可能在評審面前失敗的步驟。
- [ ] Phone on Do Not Disturb; screen timeout extended; brightness up.
      手機開啟勿擾模式；延長螢幕逾時；亮度調高。
- [ ] The demo URL loaded and confirmed on a second device.
      展示網址已在第二台裝置上載入並確認。

### The path｜展示路徑

1. Start screen — state the promise and **"Raw chats are not uploaded."**
   開始頁：說明產品承諾與 **「不會上傳原始對話」**。
2. Tap **Let my agent pitch me** → show the generated prompt and the expiry.
   點擊 **Let my agent pitch me** → 展示產生的提示詞與到期時間。
3. Hand the prompt to a real assistant. Show the consolidated confirmation question and
   the sensitive-data list. **Confirm once.**
   將提示詞交給真實的 AI 助理。展示整合式確認問題與敏感資料清單。**確認一次。**
4. Return to the app — My Pitch is populated.
   返回 App：我的介紹頁已填入內容。
5. Matches — open one and read the three questions it answers.
   配對：開啟一則，讀出它回答的三個問題。
6. Invite → accept from the second account → introduction.
   邀請 → 從第二個帳號接受 → 完成引介。

The argument the demo makes: the pitch is *specific*, and the match can *explain itself*.
Both are visible on screen; neither needs narration.

展示要傳達的論點：介紹是 *具體的*，配對能 *自我解釋*。兩者都在畫面上看得見，
都不需要旁白解說。

### If the live AI call fails｜若現場 AI 呼叫失敗

Do not debug on stage. Switch to the fallback path (paste the pre-prepared confirmed
JSON into Review & Publish) and say so plainly — the fallback is a designed product
path, not a workaround, and demonstrating it is a feature.

不要在台上除錯。切換到備援路徑（將預先準備好、已確認的 JSON 貼入審核與發布頁），
並坦白說明：備援是設計中的產品路徑，不是權宜之計，展示它本身就是一項功能。

If the app itself fails, cut to the screen recording and keep talking.

若 App 本身失敗，切到螢幕錄影並繼續講述。

---

## Troubleshooting｜疑難排解

### Submission returns 500｜提交回傳 500

Check the Vercel function log for the request id. Most likely: a Supabase env var is
missing on Vercel (set locally but never added to the project), or the service role key
is absent. Confirm by the probe table above, not by printing values.

依 request id 查看 Vercel function 日誌。最可能的原因：Vercel 上缺少某個 Supabase
環境變數（本地有設但沒加到專案），或缺少 service role key。用上方的探測表確認，
不要列印實際值。

### Submission returns 422 with a valid-looking payload｜看似有效的 payload 卻回傳 422

The Zod schema is `.strict()` — an unknown field is a rejection by design. The error
names the offending field. This is correct behaviour, not a bug (brief R4.3).

Zod schema 使用 `.strict()`，未知欄位依設計就會被拒絕。錯誤訊息會指出問題欄位。
這是正確行為，不是 bug（規格 R4.3）。

### A profile publishes but never matches｜檔案已發布卻從不配對

Check `status` is `published`, not `draft` (brief R4.7), then check `profile_tags` was
populated — a profile row with no tag rows scores zero against everyone.

確認 `status` 是 `published` 而非 `draft`（規格 R4.7），再確認 `profile_tags` 有被寫入；
沒有標籤資料列的檔案，對任何人的分數都是零。

### Preview URL works, demo URL does not｜預覽網址正常，展示網址不正常

Environment variables set on a preview deployment do not automatically apply to
production. A variable change does not reach a running deployment until redeploy.

設定在預覽部署上的環境變數不會自動套用到正式環境。變數變更在重新部署前，
不會傳達到執行中的部署。

## Recovery｜復原

- A stuck upload session self-recovers by expiry. The user starts a new one; there is no
  manual requeue and none is needed.
  卡住的上傳工作階段會因到期而自行復原。使用者重新建立一個即可；沒有也不需要手動重排。
- A used session is a **terminal** state. Never manually clear `used_at` to "fix" a demo
  — create a new session instead. Clearing it defeats the single-use guarantee that the
  product is arguing for.
  已使用的工作階段是 **終端** 狀態。絕不要為了「修好展示」而手動清除 `used_at`，
  應改為建立新的工作階段。清除它會破壞本產品所主張的一次性保證。

## Monitoring｜監控

There is no monitoring, deliberately — this is a prototype with a known audience and a
known demo window. The check that matters is step 6 of Routine release, run by a human.

刻意不設監控：這是面向已知觀眾、有已知展示時段的原型。真正重要的檢查是例行發布的
第 6 步，由人執行。
