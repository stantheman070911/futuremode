# JTBD-4 — Real-phone demo rehearsal

Date: 2026-09-05
Status: preparation complete; real-phone evidence pending

## Prepared recovery path

`packages/cloud/scripts/demo/paste-fallback-profile.json` is clearly labelled by its
path and `history_scope` as disclosed stage-recovery data. It contains only the exact
profile object accepted by the paste screen, not a publish envelope or account data.

Canonical server validation passed with all nine configured keys, the complete six-field
confidence map, and no email-shaped content. The remaining acceptance check is to paste
and publish it through the deployed phone flow with the designated primary account.

## Rehearsal environment

| Item | Run 1 | Run 2 |
| --- | --- | --- |
| Deployed commit | Pending | Pending |
| Primary phone / browser / viewport | Pending | Pending |
| Second phone / browser / viewport | Pending | Pending |
| Assistant | Pending | Pending |
| Primary account role | Fresh controlled account | Reset or fresh controlled account |
| Peer account role | Public, active, controlled peer | Same controlled peer after cleanup check |
| Outcome | Pending | Pending |

Actual addresses, OTPs, sessions, and tokens must not be written here.

## Per-step wall-clock timing

| Step | Run 1 | Run 2 | Result / recovery notes |
| --- | ---: | ---: | --- |
| Sign in | Pending | Pending | |
| Choose assistant and create prompt | Pending | Pending | |
| Hand off, answer exclusion question, receive JSON | Pending | Pending | |
| Return and paste | Pending | Pending | |
| Edit one field and publish | Pending | Pending | |
| Wait for matches | Pending | Pending | |
| Open match and send invitation | Pending | Pending | |
| Second device receives and accepts | Pending | Pending | Contact must be absent before acceptance |
| Both owners view contact | Pending | Pending | Contact must appear only after acceptance |
| Generate first-email prompt | Pending | Pending | |
| Total | Pending | Pending | |

## Required screenshot packet

- one comparable pre-JTBD-1 match-detail view at 375px;
- the deployed model-generated view for the same pair at 375px;
- three deployed match details for one owner, showing materially distinct answers;
- the post-JTBD-2 match list at 375px with no public score.

Existing screenshots from earlier browser verification may provide historical context,
but no resized or fabricated image is accepted as real-phone evidence.

## Live versus pre-staged disclosure

Pending the completed rehearsal. The intended rule is that every product action is live;
only account/browser readiness and the disclosed malformed-output fallback JSON are
pre-staged.
