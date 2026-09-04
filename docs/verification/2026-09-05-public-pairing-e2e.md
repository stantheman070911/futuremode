# Public pairing implementation verification

Date: 2026-09-05  
Production: `https://d1vuzznd4gxltu.cloudfront.net`  
Isolated E2E: `https://d380wo655pk1nk.cloudfront.net`

## Outcome

The Public/Private profile, durable similarity, stable pagination, profile detail, mutual invitation, connection, Traditional Chinese UI, and social-card implementation passed its automated gates. Production is deployed with matching-email delivery disabled until the Owner completes the final real-browser and real-inbox verification.

## Automated gates

- Package tests: 36 passed, 0 failed.
- TypeScript: `tsc --noEmit` passed.
- Browser JavaScript: `node --check` passed for `static/app.js` and `static/profile-json.js`.
- Canonical/runtime schema and Traditional Chinese prompt copies are byte-identical.
- Git whitespace validation passed.
- CloudFormation production stack status: `UPDATE_COMPLETE`.
- Production mail provider: Resend.
- Production OTP email: enabled.
- Production matching email: disabled.
- Production profile fixtures: 0 `PROFILE_CURRENT` items and 0 `testRunId` items.

## Isolated journey

Run `pyo-e2e-20260905-002` used a dedicated stack, table, CloudFront distribution, and 24-hour fixture TTL. It verified:

- 12 profiles; A receives 11 candidates, split 10 + 1 across two pages;
- deterministic B/C top-two order;
- unchanged graph reuses a result set and changed graph creates a new result set;
- detail responses expose only permitted public profile and explanation fields;
- Invite is idempotent and captured email HTML is generated once;
- invitation preview is read-only;
- B's Not now choice is final and creates no connection;
- C's Accept creates exactly two owner-scoped connection records and two connection-email outboxes;
- unrelated and unauthenticated users cannot access a connection;
- a Private candidate becomes an unavailable stable placeholder without reordering or leaked profile data;
- an existing mutual connection retains its immutable shared snapshot after a profile becomes Private;
- a Private profile no longer serves its personalized social image;
- social PNG is exactly 1200 × 630 and its QR decodes at 1200 × 630 and 600 × 315.

Cleanup removed 191 E2E records. The post-cleanup query returned zero records for the run.

## Production smoke checks

- `/` returns the Traditional Chinese PitchYourOwner app.
- `/owner-pitch-prompt-zh-Hant.txt` contains the single consolidated question `哪些主題應該排除？`.
- The removed `S1`/security-confirmation boilerplate is absent from that artifact.
- `/og/site.png` returns a valid 1200 × 630 PNG through `GET`.
- A missing public profile returns 404.
- Unauthenticated `/v1/matches` returns 401.
- `/accept` returns the safe generic Traditional Chinese app shell; opening it does not mutate state.

## Final manual release gate

The browser controller had no connected in-app browser, and mailbox arrival cannot be asserted without the Owner's inboxes. Complete these checks before enabling production matching email:

1. Upload or confirm the three controlled profiles in production.
2. At 320 px, 375 px, and desktop, verify Matches, 10-per-page pagination, detail/Back/reload, Invite, Not now, Accept, Public/Private, QR private notice, and the two-owner connection page.
3. Confirm the Resend custom sender domain is verified.
4. Enable delivery in the controlled verification environment first.
5. Send A→B and choose Not now; confirm no contact disclosure or extra email.
6. Send A→C and choose Accept; confirm exactly one connection email reaches A and one reaches C, each revealing only the peer email.
7. Check sender, subject, Yahoo/Gmail/custom-domain inbox and spam placement, mobile HTML, link destination, and that opening the link alone never changes state.
8. Enable production matching email only after all seven checks pass.

No email address, raw invitation token, or session credential is stored in this report.
