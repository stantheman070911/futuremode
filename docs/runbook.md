# PitchYourOwner — Demo Runbook｜展示手冊

_Role｜角色: the procedure for presenting the product · governed by
[`constitution.md`](constitution.md)_
_呈現產品的程序 · 受 [`constitution.md`](constitution.md) 規範_

This document states the **procedure**, not the current status — for what has actually
been done, see [`log.md`](log.md).

本文件陳述 **程序**，而非當前狀態。實際已完成的事項請見 [`log.md`](log.md)。

**Scope:** the project is in a product and design phase. There is no deployment, no
hosting, and no real user data, so this runbook covers the demo only. If the project
moves into implementation, an operations section gets added then — not before.

**範圍：** 專案處於產品與設計階段，沒有部署、託管或真實使用者資料，因此本手冊只涵蓋展示。
若專案進入實作階段，屆時再新增維運章節，現在不加。

---

## What is being demonstrated｜展示什麼

Not software. **An argument, shown through a designed product:**

不是軟體，而是 **透過已設計的產品所呈現的論點**：

1. An agent can describe its owner **specifically** — "low-light portraiture", not
   "photography".｜Agent 能 **具體地** 介紹它的 owner。
2. The owner stays in control — **one review, one confirmation, nothing published
   otherwise.**｜Owner 保有控制權：一次審核、一次確認，否則不發布。
3. A match can **explain itself** — it names the shared interest, the shared reason, and
   what the two could discuss today.｜配對能 **自我解釋**。

Everything on screen serves one of those three. If a moment in the demo serves none of
them, cut it.

畫面上的每個元素都服務於這三點之一。若展示中的某個環節三者皆不服務，就刪掉它。

---

## Before the demo｜展示前

- [ ] [`/PitchYourOwner App (offline).html`](../PitchYourOwner%20App%20(offline).html) open in a browser,
      **loaded and rendered before you go on stage** — it is a large file.
      HTML 已在瀏覽器開啟並完成載入渲染；檔案很大，務必事先開好。
- [ ] Screen `1a` reset to step 1｜畫面 `1a` 重設到第一步
- [ ] A second tab holding `1j` (the consent moment) and `1h` (match detail), so you can
      jump straight to either without hunting.
      第二個分頁預先開好 `1j` 與 `1h`，以便直接跳轉
- [ ] Screen recording of the full `1a` walkthrough saved locally as the fallback
      完整流程的螢幕錄影已存於本機作為備援
- [ ] Zoom level set so the 402px frame fills the screen without cropping
      縮放比例設定為 402px 框架滿版且不裁切
- [ ] Display sleep disabled; notifications silenced
      關閉螢幕休眠；靜音通知
- [ ] The three sentences above rehearsed — the argument, not the click path
      上述三句論點已演練過；要記的是論點，不是點擊路徑

## The path｜展示路徑

Walk `1a`. Seven steps, roughly three minutes.

走過 `1a`，七個步驟，約三分鐘。

| Step｜步驟 | Say this｜說明重點 |
| --- | --- |
| 1. Start｜開始 | The promise, and the privacy fact stated as a fact: **raw chats are not uploaded**｜承諾，以及以事實陳述的隱私 |
| 2. Pick AI｜選擇 AI | "Your own assistant, reading only what you authorized."｜你自己的助理，只讀你授權的內容 |
| 3. Handoff｜交接 | Show the **real prompt text**. This is the seam between two apps, and we made it visible rather than hiding it.｜展示提示詞原文；這是兩個 App 之間的接縫，我們選擇讓它可見 |
| 4. Review｜審核 | **Slow down here.** Read the removed items aloud: client names → "a returning client". This is the product.｜**在此放慢。** 朗讀被移除的項目。這就是產品 |
| 5. Published｜已發布 | Three numbers: fields published, items removed, **0 raw chats**｜三個數字 |
| 6. Matches｜配對 | "Two people. No feed, no scores, no rankings."｜兩個人。沒有動態牆、分數或排行 |
| 7. Match detail｜配對詳情 | Read the three questions. Then **Invite** — and stop on mutual consent.｜朗讀三個問題，然後邀請，並停在雙方同意 |

**The strongest moment is step 4.** Do not rush it to reach the matches — the consent
screen is what separates this from every other profile product.

**最強的時刻是第 4 步。** 不要為了趕到配對而快轉；同意畫面正是本產品與其他所有檔案型
產品的區別所在。

## If something fails｜若出狀況

| Failure｜狀況 | Response｜處理 |
| --- | --- |
| HTML won't load or renders slowly｜HTML 無法載入或渲染緩慢 | Cut to the screen recording and keep talking. Do not reload on stage.｜切到螢幕錄影並繼續講述，不要在台上重新載入 |
| Clicked past a screen｜點過頭 | Use `↻ RESTART`, or jump to the second tab. Never apologize for it — narrate forward.｜使用重啟或跳到第二分頁；不必道歉，繼續往前講 |
| Asked "is this real?"｜被問「這是真的嗎？」 | Answer plainly: this is the designed product; the matching logic and prompt are specified and tested against real assistants, implementation is next.｜坦白回答：這是已設計的產品，配對邏輯與提示詞已規格化並對真實助理測試過，實作是下一步 |
| Asked about the stack｜被問技術堆疊 | "Deliberately undecided. The product argument had to be right first."｜刻意尚未決定；產品論點必須先正確 |
| Running long｜時間不足 | Cut steps 2 and 6. Never cut step 4.｜刪掉第 2 與第 6 步，絕不刪第 4 步 |

## Questions to expect｜可預期的提問

| Question｜提問 | Answer｜回答 |
| --- | --- |
| "How do you get the chat history?"｜如何取得對話紀錄？ | We don't. The user's own assistant reads it; we receive only an owner-approved summary.｜我們不取得；由使用者自己的助理讀取，我們只收到經 owner 核准的摘要 |
| "What if the AI makes things up?"｜AI 若虛構？ | Confidence labels plus one mandatory owner review. Nothing publishes unconfirmed.｜信心標籤加上一次強制的 owner 審核；未確認不發布 |
| "How is this not a dating app?"｜這與交友軟體有何不同？ | Mutual consent, no feed, no scores, no swiping — and matching is on shared attention, not attractiveness.｜雙方同意、無動態牆、無分數、無滑動；配對依據共同關注 |
| "What's the business model?"｜商業模式？ | Out of scope for the MVP. The question under test is whether the match feels more relevant.｜MVP 不處理；待驗證的是配對是否更相關 |

## After the demo｜展示後

Record in [`log.md`](log.md): which screens people reacted to, which questions came up
more than once, and anything that landed differently from expected. Questions asked
twice are product feedback, not audience noise.

在 [`log.md`](log.md) 中記錄：觀眾對哪些畫面有反應、哪些問題被問超過一次，以及任何與
預期不同的反應。被問兩次的問題是產品回饋，不是雜訊。
