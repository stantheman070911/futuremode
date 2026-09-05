# Marketing workstream — status to PM, 2026-09-05

Per the reporting requirement in `docs/handoff/marketing-brief.md`: cohort progress by
number, which assets are complete, and where the story we want to tell is not yet
supported by what the product actually does.

## 1. Cohort progress (P0-M1)

**Zero confirmed real published profiles as of this report.** No recruiting has been
executed by me — I don't have access to real contacts, Discord/Slack, or a phone to run
a live session, so actual outreach and onboarding has to run through you/the team.

What exists instead is the execution kit, so the first session can start without more
planning: `docs/handoff/recruiting-kit.md` — a specialist-naming worksheet, EN/ZH
outreach messages for personal-network and hackathon-community channels, a 45-minute
live-session facilitator script, and a tracking table. The plan behind it (in this
conversation): 12-18 completed profiles is realistic within 48 hours of the first live
session running, against the brief's 10-15 target, *if* run as 1-2 synchronous cohort
sessions rather than an async link.

**Ask:** tell me when the first session is scheduled or has run, and I'll fold real
numbers into the submission doc and README immediately — those are wired to accept
them (see Section 2).

## 2. Assets — status

| Deliverable | Status | Notes |
|---|---|---|
| `docs/handoff/recruiting-kit.md` (P0-M1 support) | **Done** | Outreach + session script + tracker. Waiting on execution, not content. |
| P0-M2 visual assets (before/after panel, exclusion recording) | **Not started** | Structurally cannot start — both require a real, consenting cohort member's actual bio and a real assistant session recording. Blocked on Section 1. |
| `docs/round1-submission.md` (P0-M3) | **Drafted, not lockable** | Full six-section structure written per the brief. Results section and the one quoted pairing are `[PENDING]` — waiting on the cohort and on Development's funnel report (their JTBD-3). Two technical claims are flagged `[VERIFY AGAINST LIVE APP BEFORE LOCK]` — see Section 3. Written under the approved headline framing with an explicit status note that it is contingent on Development's JTBD-1 — not resolved by me. |
| README (opening problem statement, Current product, new Results section) (P0-M4) | **Done**, within my ownership boundary | Left everything from `## Architecture` onward untouched, per the file-ownership split with Development. Results table is `[PENDING]` placeholders wired to the same evidence as the submission doc. |
| `ROADMAP.md` (P0-M4) | **Done** | Six items, each grounded in something that already exists in the repo (e.g., the MCP-server item cites the actual upload-capability API routes), not a wishlist. |
| `docs/round2-demo-script.md` (P0-M5) | **Drafted, not rehearsed** | Full beat sheet with target times; actual timings, live-vs-staged flags, and the fallback JSON path are `[PENDING]` on Development's JTBD-4. Rehearsal itself needs a real phone and presenter — I can't do that part. |
| `docs/walkthrough-en.md` (P1-M6) | **Done** | 10 captioned screenshots, sign-in through connection, all real captures from `docs/verification/evidence/`. Two are explicitly labelled demo data; the rest are live UI. |
| `docs/handoff/terminology-and-claims.md` (P1-M7) | **Done** | One-pager derived directly from the brief's claims/terminology sections, including the same JTBD-1 open question. |

## 3. Where the story isn't supported by the product yet — escalate, don't guess

- **JTBD-1 (real match explanations) is unconfirmed.** Everything under the approved
  "agents introducing their owners to each other" headline assumes it ships. I have not
  resolved this either direction, per your original instruction — `round1-submission.md`
  and the terminology sheet both carry the same explicit flag and point to the brief's
  contingency (fall back to "consent-first portability of AI context") if it slips.
  **This needs your call before the submission draft locks, not mine.**

- **Contradiction found between the two source documents on the match-score claim.**
  `docs/product-design.md` (the canonical contract) states no numeric score is ever
  shown. The Development brief's JTBD-2 says a score out of 100 currently renders on
  every match card and still needs removing. I checked today's screenshots in
  `docs/verification/evidence/` and the match-detail capture shows no visible score —
  but I can't confirm whether that capture predates or postdates the fix. I did not
  assert either way in the submission doc; it's flagged `[VERIFY AGAINST LIVE APP
  BEFORE LOCK]`. **Two-minute check against the live app resolves this — worth doing
  before anyone treats "no score" as a safe claim.**

- **The entire Results section, in both the README and the submission doc, is
  currently placeholder.** This is the biggest single gap against judged weight (35%
  Problem/Impact + 20% Results in Round 1 alone) and it is entirely downstream of
  Section 1 above — nothing else is blocking it.

- **P0-M2's two visual assets don't exist yet**, for the same reason. The before/after
  panel is called out in the brief as the single strongest asset for Round 1 Problem
  Definition — worth prioritizing as soon as the first cohort member is signed off, not
  after the full cohort completes.

## Bottom line

Everything that doesn't require a real human to have gone through the product is done
and wired to receive real numbers the moment they exist. Everything that does is
waiting on the first live cohort session. That session is the one thing blocking four
of the five remaining gaps above.
