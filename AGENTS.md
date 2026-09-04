# PitchYourOwner — Workspace Guide｜工作區指南

## Read first｜請先閱讀

[`docs/product-design.md`](docs/product-design.md) is the canonical product and design
source. Read it before changing this repository.

[`docs/product-design.md`](docs/product-design.md) 是產品與設計的唯一正式依據。修改此
儲存庫前，請先閱讀。

[`README.md`](README.md) is now the official Hackathon submission README, structured to
match the organizer-provided [`README-template.md`](README-template.md) and
[`submission-checklist.md`](submission-checklist.md) at the repo root. Keep it in that
shape; product/design changes still belong in `docs/product-design.md` first, then get
summarized here.

[`README.md`](README.md) 現在是符合官方 [`README-template.md`](README-template.md) 與
[`submission-checklist.md`](submission-checklist.md) 格式的正式繳交 README。請維持此格式；
產品／設計變更仍先寫入 `docs/product-design.md`，再摘要回此處。

The original product memo moved to [`docs/product-memo-v1.md`](docs/product-memo-v1.md),
preserved as historical context and must not be edited. When it overlaps with the
canonical design brief, follow the design brief.

原始產品備忘錄已搬移至 [`docs/product-memo-v1.md`](docs/product-memo-v1.md)，僅保留作為
歷史脈絡，不得修改。當內容與正式設計規格重疊時，以設計規格為準。

[`design/prototype.html`](design/prototype.html) is a self-contained visual exploration,
not a source of product truth. Use it to evaluate direction; resolve any conflict in
favor of the canonical design brief.

[`design/prototype.html`](design/prototype.html) 是獨立的視覺探索，不是產品正式依據。
可用於評估方向；若有衝突，以正式設計規格為準。

[`docs/get_info_prompt_en.md`](docs/get_info_prompt_en.md) and
[`docs/get_info_prompt_ch.md`](docs/get_info_prompt_ch.md) are retained executable prompt
artifacts. They are not the product specification; keep them unless the PM explicitly
retires or replaces them.

[`docs/get_info_prompt_en.md`](docs/get_info_prompt_en.md) 與
[`docs/get_info_prompt_ch.md`](docs/get_info_prompt_ch.md) 是保留的可執行提示詞產出物，
並非產品規格；除非 PM 明確停用或替換，否則不得刪除。

## Working standard｜工作標準

- Prioritize product intent, user journeys, information architecture, UI structure,
  interaction behavior, accessibility, privacy, and trust.
  優先處理產品意圖、使用者旅程、資訊架構、UI 結構、互動行為、無障礙、隱私與信任。
- Keep implementation, infrastructure, deployment, and operational notes out of this
  repository unless they create a material experience constraint.
  實作、基礎設施、部署與維運筆記不放入本儲存庫，除非它們構成重要的體驗限制。
- Make the smallest change that fully serves the intended experience. Do not add
  speculative systems, abstractions, or documents.
  做出能完整服務預期體驗的最小變更。不要新增臆測性的系統、抽象層或文件。
- Preserve working behavior that is outside the requested change.
  保留不在本次變更範圍內的既有可用行為。
- Verify the result at the experience level. For UI work, check the complete affected
  journey at 375px and 320px, keyboard access, labels, contrast, loading, empty, error,
  and recovery states.
  從體驗層級驗證結果。UI 工作需在 375px 與 320px 檢查完整受影響旅程，並確認鍵盤操作、
  標籤、對比、載入、空白、錯誤與復原狀態。
- Product changes belong in `docs/product-design.md`; update both English and 繁體中文.
  Do not create a second source of truth.
  產品變更寫入 `docs/product-design.md`，並同步更新英文與繁體中文。不得建立第二份正式依據。

## Product guardrails｜產品護欄

Never compromise these to simplify implementation:

不得為了簡化實作而犧牲以下原則：

1. The owner reviews and explicitly approves every published pitch.｜每份發布的介紹皆由 owner 完整審核並明確核准。
2. Every shown match explains the concrete shared attention behind it.｜每個呈現的配對都要說明背後具體的共同關注。
3. Introductions require mutual consent.｜引介需要雙方同意。
4. No engagement loops, swipe decks, popularity signals, or public scores.｜不得加入互動誘導循環、滑動卡片、人氣訊號或公開分數。
