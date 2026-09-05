# Published Profile sharing verification — 2026-09-05

## Scope

This ledger covers the owner-facing share flow deployed to the Hackathon environment
from commit `44e4fea`. It does not claim that every social platform renders the same
preview or that third-party caches have refreshed.

## Implemented contract

- My Pitch renders the actual `/og/profile/{slug}.png?version={version_id}` image.
- Copy public link, native Web Share, View public Profile, X, Facebook, Threads, and
  Copy post text all use the same `/p/{slug}` URL. Download PNG fetches the versioned
  `/og/profile/{slug}.png` image whose QR points back to that public URL.
- Web Share absence or failure falls back to Copy public link; cancelling the share
  sheet does not produce an error.
- Instagram has no first-class one-click action. The UI directs the owner to download
  the PNG and post it manually.
- A Private Profile renders an explanatory disabled state and does not render an image
  request.
- The publish-success notice keeps matching as the primary path and adds a secondary
  View/share public Profile action.
- The share panel does not render `history_scope`, `confidence`, email, identifiers, or
  internal match scores.

## Automated evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Sharing contract tests | PASS | `packages/cloud/test/profile-sharing.test.ts` |
| Full cloud test suite | PASS — 63/63 | `npm test` from `packages/cloud` |
| TypeScript build | PASS | `npm run build` from `packages/cloud` |
| JavaScript syntax and whitespace | PASS | `node --check static/app.js`; `git diff --check` |
| GitHub CI | PASS | CI run `33965129550` for `44e4fea` |

## Deployed evidence

| Check | Result | Evidence |
| --- | --- | --- |
| CloudFormation deployment | PASS | `PitchYourOwner-hackathon` reached `UPDATE_COMPLETE` at `2026-09-05T12:09:30Z` |
| Public app | PASS | `GET https://d1vuzznd4gxltu.cloudfront.net/` returned HTTP 200 after invalidation |
| Share runtime asset | PASS | Deployed `app.js` contains the My Pitch share panel, native Web Share, and X/Facebook/Threads targets |
| Native image-worker asset | PASS | CDK asset contains Linux arm64 `sharp`; a post-deploy stale-profile smoke invocation returned HTTP 200 with no `FunctionError` |
| Public Profile and metadata | PASS | One current non-fixture Public Profile returned HTTP 200 with the versioned `og:image` metadata; slug omitted from this ledger |
| Social-card endpoint | PASS | The referenced live endpoint returned a 1200×630 RGBA PNG |
| Profile-image endpoint | PASS | The same Public Profile returned a 768×768 WebP detail image |
| Current-profile backfill | PASS — no work required | Dry run found 0 eligible current non-fixture profiles; no Lambda invocation was made |

## Third-party platform matrix

| Surface | Implemented behavior | Observed platform rendering |
| --- | --- | --- |
| Native system share | `navigator.share({ title, text, url })`; Copy fallback | PENDING |
| X | Best-effort intent with encoded text and URL | PENDING |
| Facebook | Sharer receives public URL and quote; expected to rely primarily on OG metadata | PENDING |
| Threads | Best-effort intent with encoded text and URL | PENDING |
| Instagram | No one-click web action; Download PNG plus copied text | PENDING manual check |
| Generic compatible crawler | Public page contains OG/Twitter Card metadata | Live metadata and 1200×630 PNG verified; preview-debugger check PENDING |

## Remaining gates

1. Browser tooling was unavailable during this implementation pass, so the My Pitch
   public and Private states still need captured visual checks at 375px and 320px,
   including keyboard traversal and live-region announcements.
2. Use a dated preview debugger or real posting surface for each
   platform. Record the URL, visible title/description/image, and cache behavior.
3. Until those checks pass, public wording is limited to: the Profile URL contains
   Open Graph and Twitter Card metadata that compatible platforms may use to render a
   preview; the receiving platform controls the result.
