# Marketing workstream — status to PM, 2026-09-05

Per the reporting requirement in `docs/handoff/marketing-brief.md`: cohort progress by
number, which assets are complete, and where the story we want to tell is not yet
supported by what the product actually does.

## 1. Cohort progress (P0-M1)

**Zero confirmed P0-M1 non-team cohort completions are visible to this workstream as of
this report.** Recruiting has been escalated to and accepted by the project owner. I
have not substituted fixture data, team accounts, or estimates for cohort progress.

The execution kit is ready for the owner's first session:
`docs/handoff/recruiting-kit.md` now includes a specialist-naming worksheet, EN/ZH
outreach messages, a 45-minute facilitated session, a live tracker, an exact written
quotation-permission request, a separate before/after-panel permission request, and the
exact two post-session questions. The submission and README are wired to accept real
numbers as soon as Development's fixture-excluding funnel report exists.

## 2. Assets — status

| Deliverable | Status | Notes |
|---|---|---|
| `docs/handoff/recruiting-kit.md` (P0-M1 support) | **Done** | Outreach, session script, tracker, exact written permission language, separate before/after permission, and the exact two post-session questions. Execution belongs to the project owner. |
| P0-M2 visual assets (before/after panel, exclusion recording) | **Not started** | Structurally cannot start — both require a real, consenting cohort member's actual bio and a real assistant session recording. Blocked on Section 1. |
| `docs/round1-submission.md` (P0-M3) | **Drafted; framing locked, cohort results pending** | Removed the JTBD-1 contingency. Added the cleared anonymized pairing verbatim and the live-run figures: 7 pairs, 7 model explanations, 0 fallbacks, 4.875 s median model latency, approximately USD 0.060 estimated run cost. Real-cohort figures remain `[PENDING]`. The score-free claim and match-list imagery remain withheld pending PM handoff confirmation and visible recheck. |
| README (opening problem statement, Current product, new Results section) (P0-M4) | **Done**, within my ownership boundary | Three-agent story is explicit, the AI exclusion step is corrected, and technical verification is separated from pending real-cohort outcomes. Left Development-owned sections from `## Architecture` onward untouched. |
| `ROADMAP.md` (P0-M4) | **Done** | Six items, each grounded in something that already exists in the repo (e.g., the MCP-server item cites the actual upload-capability API routes), not a wishlist. |
| `docs/round2-demo-script.md` (P0-M5) | **Framing locked; not rehearsed** | Removed the JTBD-1 hedge, added the model's honest oblique-link beat, and made the third-agent handoff precise. Actual timings and fallback JSON remain `[PENDING]`; match-list rehearsal/capture waits for score removal. |
| `docs/walkthrough-en.md` (P1-M6) | **Done** | 10 captioned screenshots, sign-in through connection, all real captures from `docs/verification/evidence/`. Two are explicitly labelled demo data; the rest are live UI. |
| `docs/handoff/terminology-and-claims.md` (P1-M7) | **Done** | Three roles and the deployed explanation path are locked; the global score-free claim is explicitly blocked until the new score-removal handoff is PM-confirmed and visibly reverified. |

## 3. Where the story isn't supported by the product yet — escalate, don't guess

- **The score state changed during this workstream.** The PM's last instruction said the
  match-list score was still live. Main then advanced to `fd19eb9`, including removal
  commit `9d8df3f` and a deployment report stating that the live `app.js` no longer has
  a score-render path and result sets are capped at five. A direct fetch of the deployed
  asset agrees at source level, but this is not a visible UI pass. Because the PM said
  they would announce when the change shipped, keep the global score-free claim and
  match-list imagery blocked until that explicit handoff and a visible recheck.

- **A fresh live browser walkthrough is still unavailable in this workstream.** The
  compliant browser inventory returned no available browser surface, so I did not use a
  standalone script as a substitute. Code inspection and the retained verification
  artifacts support the edits above, but they are not a new live UI pass.

- **Real-cohort outcomes remain entirely placeholder.** The technical Results evidence
  is now real and cited, but real published-profile, invitation, connection, and quote
  numbers must still come from Development's fixture-excluding funnel script.

- **The funnel script appeared in the shared worktree but is not handed off yet.**
  `packages/cloud/scripts/report-hackathon-funnel.mjs` and its `package.json` command are
  currently uncommitted Development changes. Without the owner-supplied
  `PYO_TEAM_EMAILS` classification input, the script deliberately withholds the real
  non-team and team counts as `Unclassified live`. Do not quote its output until
  Development commits the script and the owner provides the complete team list.

- **P0-M2's two visual assets don't exist yet**, for the same reason. The before/after
  panel is called out in the brief as the single strongest asset for Round 1 Problem
  Definition — worth prioritizing as soon as the first cohort member is signed off, not
  after the full cohort completes.

## Bottom line

The three-agent story is now backed end to end, and the public-use explanation example
is in the Round 1 draft. The critical remaining work is external: owner-run cohort
execution, Development's fixture-excluding funnel report, the two participant-cleared
visual assets, PM confirmation of the new score-removal handoff, and a compliant fresh
live walkthrough.
