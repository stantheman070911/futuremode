# PitchYourOwner — PM reading pack

This folder groups the current product-management references for the Hackathon build.
Where historical discussion conflicts with a later confirmed decision, follow the
Project and Hackathon Guide and the Canonical Product Design.

本資料夾集中整理 PitchYourOwner Hackathon 版本目前供 PM 使用的正式參考資料。若歷史討論
與較新的確認決定衝突，請以「專案與 Hackathon Guide」及「Canonical Product Design」為準。

## Recommended reading order｜建議閱讀順序

1. [Project and Hackathon Guide｜專案與 Hackathon Guide](project-and-hackathon-guide.md)
   — product name, scope, confirmed decisions, event constraints, privacy boundary,
   architecture, MVP, and validation priorities.｜產品名稱、範圍、已確認決定、活動限制、
   隱私邊界、架構、MVP 與驗證優先順序。
2. [Canonical Product Design｜正式產品設計](../product-design.md)
   — the authoritative product and experience specification.｜產品與體驗的唯一正式規格。
3. [V2 Product Memo｜V2 產品備忘錄](v2-product-memo.md)
   — why the project broadened from developer work history to cross-domain friend
   discovery.｜為何從開發者工作紀錄擴展為跨領域朋友探索。
4. [AWS Integration Decision Report｜AWS 整合決策報告](aws-integration-decision-report.md)
   — repository comparison, resolved requirement batches, architecture choices, and
   implementation implications.｜Repository 比較、分批需求決定、架構選擇與實作影響。
5. [Cross-persona Corrected Experiment｜跨 Persona 修正版實驗](cross-persona-corrected-experiment.md)
   — self-contained experiment design, corrected results, known flaws, and next
   validation direction.｜可獨立閱讀的實驗設計、修正結果、已知缺陷與下一步驗證方向。
6. [AWS Build and Verification Report｜AWS 建置與驗證報告](aws-build-and-verification-report.md)
   — implemented flow, deployed stack, automated and browser verification, and current
   operational risks.｜已實作流程、已部署 stack、自動化與瀏覽器驗證及目前維運風險。
7. [Computer API｜電腦版 API](../computer-api.md)
   — 24-hour, single-use, write-only draft upload contract and final owner-review
   boundary.｜24 小時、單次、write-only 草稿上傳契約與 owner 最終審核邊界。

## Current decision precedence｜目前決策優先順序

1. Latest explicit Host Owner decision recorded in the Project and Hackathon Guide.
2. Canonical Product Design.
3. V2 Product Memo.
4. Decision and implementation reports.
5. Historical alternatives inside the reports, which remain context only.

1. 專案與 Hackathon Guide 所記錄的最新 Host Owner 明確決定。
2. Canonical Product Design。
3. V2 Product Memo。
4. 決策與實作報告。
5. 報告內保留的歷史選項；只作脈絡，不是現行需求。

No credential, upload token, session token, password, or private conversation content
is included in this reading pack. Operational URLs and non-secret deployment identifiers
appear where they are necessary to verify the current implementation.

本資料包不包含任何 credential、upload token、session token、password 或私人對話內容；
僅在驗證現行實作所需時保留 operational URL 與非機密部署識別資料。
