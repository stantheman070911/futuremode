# PitchYourOwner — Development Log

_Last updated: 2026-09-03_
_Role: what is verified true right now · governed by [`constitution.md`](constitution.md)_

This document is what makes a brand-new session (human or agent) productive after 30
seconds of reading. It is **append-only and operational — not a diary.** Replace a stale
line with the new true statement; do not narrate the journey.

Entry format:

```
YYYY-MM-DD / Session N
Completed:        [P-IDs]
Verified:         [what passed, against what]
Changed decision: [what changed, and which doc was updated]
Known issue:      [what is broken]
Current blocker:  [what is waiting on what]
Next:             [P-ID]
Commit:           [sha]
```

---

## Deployed state

Nothing deployed. No application code exists yet — the repository currently contains
documentation only.

## Verification results

| Check | Verified result |
| --- | --- |
| Documentation structure | 2026-09-03 — five-document system in place; `/README.md` confirmed byte-identical to the original brief (sha256 `ca4a4f83…`, verified by `cmp` + `shasum`) |
| Internal doc links | 2026-09-03 — every relative `.md` link across `docs/` and `CLAUDE.md` resolves to an existing file |
| Gate command | Not yet run — no code to gate. Blocked on P-001 |

Only put a result here once it has actually been run. A row that says what *should*
pass is a plan, not a log.

## Configuration state

| Value | Confirmed state |
| --- | --- |
| Git repository | Initialized. Remote `origin` = `github.com/stantheman070911/futuremode`, default branch `main`. `gh` authenticated as `stantheman070911` |
| Node version | Not confirmed on team machines |
| Supabase project | Not created |
| Vercel project | Not created |
| `SUPABASE_URL` / anon key | Not provisioned |
| `SUPABASE_SERVICE_ROLE_KEY` | Not provisioned — server-side only, never client-reachable |

Confirm presence of a secret by variable name only. Never paste a value here.

## Step status

| Step (from product-brief.md) | Status | Open condition |
| --- | --- | --- |
| Step 1 — Prompt handoff | Not started | Blocked on P-001 |
| Step 2 — Pitch generation | Not started | P-004 can start now; needs no code |
| Step 3 — Sensitive-data + confirmation | Not started | Part of P-004 |
| Step 4 — Submission + My Pitch | Not started | Blocked on P-002 |
| Step 5 — Explainable matching | Not started | Blocked on P-002 |
| Step 6 — Notification + invitation | Not started | Blocked on P-007 |

## Open items

1. **Tech stack is decided but unprovisioned.** Next.js + Supabase + Vercel is chosen
   (plan.md § 1); no accounts or projects exist yet.
2. **Prompt quality is the project's largest unknown.** P-004 has no code dependency and
   its failure mode is invisible until tested against real assistants. Start it first,
   in parallel with P-001.
3. **Only `main` exists.** plan.md § 2 requires a branch per work-queue item; nobody
   has branched yet. The first task to start should be the first to branch.

## Deferred

- Real push notifications — waits on the demo being complete and time remaining.
- Deep links into ChatGPT/Claude beyond copy + share — waits on P-005 landing.
- QR handoff — waits on a demonstrated phone→desktop need.
- Profile export/deletion UI — the capability is a constraint; the polished screen waits
  on the core loop working end to end.

## Immediate objective

Two things, in parallel:

- **SD:** P-001 — scaffold, provision Supabase and Vercel, get the gate
  command green. Everything else is blocked on this.
- **PM:** P-004 — draft the prompt template. It needs no code and it is the highest-risk
  unknown in the project.

**JD** is blocked until P-001 lands. Useful in the meantime: read
`product-brief.md` Steps 1 and 4, and sketch the 375px layouts for P-005 and P-008.

**PP** should start P-013 planning against the brief, not against working software.

Must **not** happen while these are open: no UI work against a stack that isn't
scaffolded, and no schema changes outside `supabase/migrations/`.

---

## Session history

```
2026-09-03 / Session 1
Completed:        Documentation system setup
Verified:         /README.md byte-identical to original docs/product-brief.md
                  (cmp + sha256 match)
Changed decision: Stack chosen — Next.js PWA + Supabase + Vercel over Expo (PM
                  decision); plan.md § 1 records the reasoning
Changed decision: Original brief archived as /README.md at root rather than
                  docs/archive/ (PM decision); constitution Law 0 freezes it
Known issue:      /README.md H1 restored to the bilingual original
                  ("Product Memo｜產品備忘錄"). Upstream c27620b had dropped the
                  Chinese half; Law 0 requires the archive be byte-identical to the
                  original brief. Revert only if the English-only title was deliberate.
Current blocker:  None
Next:             P-001 (SD), P-004 (PM), in parallel
Branch:           docs/doc-system-setup
```
