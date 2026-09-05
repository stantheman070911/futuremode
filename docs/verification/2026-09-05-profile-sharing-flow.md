# Published Profile sharing verification — 2026-09-05

## Scope

This ledger covers the owner-facing share flow implemented in the current working tree.
It does not claim that the change is deployed, that every social platform renders the
same preview, or that third-party caches have refreshed.

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

## Third-party platform matrix

| Surface | Implemented behavior | Observed platform rendering |
| --- | --- | --- |
| Native system share | `navigator.share({ title, text, url })`; Copy fallback | PENDING |
| X | Best-effort intent with encoded text and URL | PENDING |
| Facebook | Sharer receives public URL and quote; expected to rely primarily on OG metadata | PENDING |
| Threads | Best-effort intent with encoded text and URL | PENDING |
| Instagram | No one-click web action; Download PNG plus copied text | PENDING manual check |
| Generic compatible crawler | Public page contains OG/Twitter Card metadata | Existing metadata implementation evidence only; preview-debugger check PENDING |

## Remaining gates

1. Browser tooling was unavailable during this implementation pass, so the My Pitch
   public and Private states still need captured visual checks at 375px and 320px,
   including keyboard traversal and live-region announcements.
2. Deploy through the normal Development release process; this pass did not deploy.
3. After deployment, use a dated preview debugger or real posting surface for each
   platform. Record the URL, visible title/description/image, and cache behavior.
4. Until those checks pass, public wording is limited to: the Profile URL contains
   Open Graph and Twitter Card metadata that compatible platforms may use to render a
   preview; the receiving platform controls the result.
