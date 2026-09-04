# PitchYourOwner — Repository guide｜儲存庫指南

## Canonical sources｜正式來源

Use one owner for each kind of information:

| Topic | Canonical source |
| --- | --- |
| Project overview, repository map, quick start, current limits | `README.md` |
| Product behavior, consent boundaries, UX constraints | `docs/product-design.md` |
| Profile fields and validation limits | `config/pitchyourowner-profile-schema.json` |
| Engineering, API, persistence, configuration, deployment | `packages/cloud/README.md` |
| Product-neutral library scope and exclusions | `packages/cloud/lib/reusable/README.md` |
| Owner-pitch prompt behavior | `docs/get_info_prompt_en.md`, `docs/get_info_prompt_ch.md` |

每一類資訊只維持一個正式來源。修改內容時更新其 canonical source，再更新必要的摘要或
產生檔，不要建立平行規格。

`docs/product-memo-v1.md` is a frozen source memo retained for provenance. Do not edit
it and do not treat it as current behavior.

`docs/product-memo-v1.md` 是為了來源脈絡保留的凍結 memo；不得修改，也不得當作目前
產品行為。

## Generated files｜產生檔案

The browser copies of the schema and prompts are generated:

- `packages/cloud/config/pitchyourowner-profile-schema.json`
- `packages/cloud/static/pitchyourowner-profile-schema.json`
- `packages/cloud/static/owner-pitch-prompt-en.txt`
- `packages/cloud/static/owner-pitch-prompt-zh-Hant.txt`

Run `npm run sync:contracts` from `packages/cloud` after changing a canonical source.
Build and test run this synchronization automatically. Never make a runtime copy the only
place where a contract changes.

## Working standard｜工作標準

- Treat executable code and configuration as the authority for current behavior.
  Product changes must also update `docs/product-design.md` in English and Traditional
  Chinese.
- Keep implementation and deployment details in `packages/cloud/README.md`; keep
  product behavior out of that file except where needed to explain an invariant.
- Make the smallest change that fully serves the requested behavior. Preserve unrelated
  working behavior.
- Do not add speculative systems, duplicate planning documents, or historical reports.
- For UI work, verify the complete affected journey at 375px and 320px, keyboard access,
  labels, contrast, loading, empty, error, retry, and interrupted states.
- Run `npm test` and `npm run build` from `packages/cloud` before handoff. Run
  `npm run synth` when infrastructure or CDK-facing configuration changes.

## Product guardrails｜產品護欄

Do not compromise these to simplify implementation:

1. The chosen AI uses only owner-authorized context it can actually access.
2. Security/privacy decisions happen in the AI before transfer; the website does not
   repeat that processing or store a privacy ledger.
3. Every published pitch receives a separate editable review and explicit final
   publication approval on PitchYourOwner.
4. `history_scope` and `confidence` are owner-only and never enter matching or peer
   responses.
5. Every shown match names concrete shared attention and answers the three explanation
   questions without a public score.
6. Contact information appears only after mutual acceptance.
7. Do not add swipe decks, popularity signals, follower mechanics, or engagement loops.

不得為了簡化實作而犧牲授權範圍、兩階段同意、owner-only metadata、可解釋配對與雙方
同意；也不得把產品改造成滑卡、人氣、追蹤者或互動循環。
