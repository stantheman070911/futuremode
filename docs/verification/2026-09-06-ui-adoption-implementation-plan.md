# PitchYourOwner UI adoption implementation plan

Date: 2026-09-06 (Asia/Taipei)

Status: implemented, locally verified, and deployed to the Hackathon production environment.

## Goal

Apply the Owner-approved Expected Adoption visuals to the existing phone web app without changing its routes, state transitions, API contract, profile schema, prompt, matching logic, or consent model. The locally verified static UI bundle was deployed after the Owner's explicit approval.

## Immutable product contracts

- The journey remains `Email OTP → choose AI → one-action handoff → JSON paste → directly editable final review → confirm and upload → matching → invitation → mutual acceptance`.
- The handoff keeps one primary action that opens the selected assistant and attempts to copy/share the complete current prompt as fallback.
- `config/pitchyourowner-profile-schema.json`, generated prompt files, API request/response bodies, route handling, match weighting, pagination, and invitation decisions do not change.
- The final review keeps only the configured schema fields. `history_scope` becomes visible and directly editable at the top; no extra review route is added.
- Signed-in match list/detail keep the current numeric score and pagination. The synthetic label remains conditional on the profile being synthetic.
- Public, email, token, and social-card surfaces never show a match score. Profile `confidence` stays owner-review-only.
- Public profile, My Pitch, Invitations, Connected, Settings, and the existing four-tab navigation keep the current UI this round.
- `#ai`, `#ai-final`, personality tests, psychology matching, `interaction_observations`, new dashboard/network/folders, Instagram/LINE fields, fixed QR, and fixed dynamic-profile substitutes stay excluded.

## Screen-by-screen adoption

| Existing route/state | Visual update | Logic that must remain unchanged |
| --- | --- | --- |
| `/` | Reference hero and static topic discovery section; only two approval checkpoints | `begin` and demo entry actions |
| `/signin` email | Reference sign-in shell, decorative collage, step 1 of 6 | Email validation and verification request |
| `/signin` OTP | Reference verify shell and provided fixed illustration, step 2 of 6 | Challenge, countdown, resend, change-email, OTP confirmation |
| `/assistant` | Reference choose-AI shell and provided illustration, step 3 of 6 | Existing AI options and selected state |
| `/handoff` | Reference black prompt-object shell, step 4 of 6 | Current prompt content and one-action open/copy/share fallback |
| `/import` paste | Current import form plus step 5 of 6 | Parser, duplicate/unknown-field rejection, local draft preservation |
| `/import` edit | Current document editor plus step 6 of 6 and visible `history_scope` | Direct field editing and same confirm/upload action |
| `/matches` searching | Reference blue search animation | Current recent-publish window, polling, countdown, paused/error/empty branches |
| `/matches` results | Current list, new title, circular dynamic peer image | Score, pagination, synthetic-only label, current match data |
| `/matches/:id` | Current detail with circular dynamic peer image | Score, profile fields, three explanations, evidence labels, invitation action |
| `/matches/:id` outgoing | Reference waiting shell using both dynamic owner and peer images | Existing outgoing state and links to current tabs |
| `/accept` token | Reference incoming shell without psychology or score | Current token preview and Accept/Not now response |

## Verification gates

1. Automated regression: `npm test` and `npm run build` pass before and after the UI change.
2. Contract regression tests assert six steps, visible `history_scope`, one-action handoff, unchanged four-tab routes, score visibility rules, conditional synthetic label, and excluded fields/screens.
3. Local end-to-end environment serves the real static app with deterministic mock API responses; its OTP is test-only and never appears in production UI.
4. Browser verification uses a unique per-task scope at 375 px and 320 px. It covers normal, loading/searching, empty, error/retry, outgoing, and incoming states where applicable.
5. Each implementation screenshot is compared side by side with its approved reference/Expected Adoption screenshot. `design-qa.md` records findings and must end with `final result: passed`.

## Owner confirmation path

Start the isolated, in-memory test environment:

```bash
cd /Users/wanghsuanchung/OysterunAgents/FutureMore/futuremode-repo/packages/cloud
npm run preview:ui-adoption
```

Open `http://127.0.0.1:4176`. Use any well-formed email address and the test-only OTP `246810`. The preview process prints the same OTP and resets all server-side test state when stopped; it never publishes to AWS or production.

For the fastest deterministic UI pass, paste the synthetic fixture from `scripts/manual-test/ui-adoption-sample-profile.json`. For a full handoff pass, choose an AI, press the single handoff action, return to the same handoff screen, and continue to import. Verify, in order:

1. Start hero and topic section; both CTAs enter the same sign-in route.
2. Email and OTP screens show steps 1/6 and 2/6; resend and change-email still work.
3. Choose AI is step 3/6; selection changes only the existing selected assistant state.
4. Handoff is step 4/6; one primary action still opens/shares and provides copy fallback.
5. JSON paste is step 5/6; invalid/unknown JSON is rejected without publishing.
6. Final review is step 6/6; all schema fields, including `history_scope`, are directly editable and publish from the same page.
7. Matching search appears after publish, then resolves through the current polling behavior.
8. Match list/detail keep scores and full existing fields; only the profile image shape changes; synthetic label appears only on seeded synthetic data.
9. Sending an invitation shows both dynamic profile images in the waiting state.
10. The token invitation page has Accept and Not now, and contains no score or psychology fields.
11. My Pitch, Invitations, Connected, Settings, and all four tabs retain their current behavior and layout.

## Completed verification

- `npm test`: 76 / 76 passed.
- `npm run build`: passed.
- `node --check static/app.js`: passed.
- Browser journey: actual test OTP, invalid OTP retry, JSON validation failure with input retention, direct editable review, publish, matching polling, result list, detail, outgoing invitation, and incoming token decision were exercised.
- Responsive checks: 375 × 812 and 320 × 700; no horizontal overflow on the adopted screens.
- Source-diff guard: no changes under `config/pitchyourowner-profile-schema.json`, `prompts/`, `packages/cloud/src/`, or `packages/cloud/lib/`. Current `publicProfileDocument`, `pitchScreen`, `invitationsScreen`, `settingsScreen`, and `connectionScreen` function bodies remain byte-for-byte unchanged from `HEAD`.

## Production deployment and human-path verification

- Production URL: `https://d1vuzznd4gxltu.cloudfront.net`
- Stack: `PitchYourOwner-hackathon`, `ap-southeast-1`
- CloudFormation: `UPDATE_COMPLETE` at `2026-09-06T00:43:13Z`
- Pre-deploy CDK diff: only the `CloudWebsite` bucket-deployment asset hash changed; no Lambda, API, table, matching, prompt, or schema infrastructure changed.
- Deployed byte check: production `app.js` and `styles.css` SHA-256 hashes exactly matched the local files after CloudFront invalidation.
- Test-account readiness: the reserved Host Owner synthetic account was reset, OTP request and confirmation returned 202/200, `/v1/profiles/me` returned the expected clean 404, and `/v1/manual-test/bootstrap` returned a complete nine-field `prefilled_draft` without publishing it.
- Browser control mode: `interactive_browser_per_session`
- Backend: `@executeautomation/playwright-mcp-server@1.0.12`
- Scope: `pyo-prod-ui-adoption-20260906-0845-root`
- Registry: `/Users/wanghsuanchung/.oysterun-browser-mcp/registry/pyo-prod-ui-adoption-20260906-0845-root.json`
- Evidence: `packages/cloud/evidence/ui-adoption-production-20260906/`
- Cleanup: browser controller stopped; listener and tmux session both absent.

The production human path covered Start, Email, OTP, Choose AI, the one-action ChatGPT handoff, JSON import, directly editable final review, publish, matching search, result list, match detail, outgoing waiting with both dynamic portraits, the recipient test inbox, score-free token preview, Accept, mutual connection, My Pitch, Invitations, Settings, and the public profile at 375 px and 320 px. Synthetic labels appeared on synthetic profiles; the public profile omitted score, confidence, and `history_scope`.
