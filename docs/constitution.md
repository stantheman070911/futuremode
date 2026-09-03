# PitchYourOwner — Constitution

_Last updated: 2026-09-03_
_Role: the permanent rules every other document and every agent session must obey_

This is the only document a coding agent may not edit on its own. Changes here are
human-approved (PM), deliberate, and rare.

## Law 0 — The north star is frozen

[`/README.md`](../README.md) is the original, untouched product memo. It is the
project's north-star reference and is **read-only for the life of the hackathon** —
nobody, human or agent, edits it. When the live PRD and the north star disagree, that
is a signal to talk to the PM, not to edit either file silently.

## Law I — What each document owns

| Document | Question it answers | Owns | Must not contain |
| --- | --- | --- | --- |
| **/README.md** | What was the original vision? | Frozen product memo | Anything. It is never edited. |
| **docs/product-brief.md** | What are we building, and why? | Requirements, user-visible behaviour, acceptance criteria, scope decisions | Implementation detail, status, history |
| **docs/plan.md** | How are we building it? | Architecture, constraints, the work queue, verification rules | A record of what already happened |
| **docs/log.md** | What is actually true right now? | Status, verification results, blockers, decisions, the immediate objective | Requirements; instructions for how future work should be built |
| **docs/runbook.md** | How do we deploy, demo, and recover? | Operational + demo procedure | Present status — point at log.md instead |
| Code + tests + Git | What actually exists? | Machine truth | — |

The documents **control** the work. They may never override what the repository, the
test suite, and Git history actually demonstrate. When a document and the code
disagree, the code is right and the document is wrong until proven otherwise.

**Routing a change:**

| Kind of change | Action |
| --- | --- |
| Product scope or acceptance criteria | Update product-brief.md (PM approves); update plan.md only if implementation must change; note the consequence in log.md |
| Architecture, implementation, sequencing | Update plan.md; update log.md if current state changed; leave product-brief.md untouched unless product behaviour changed |
| Deploy or demo procedure | Update runbook.md |
| Status, blocker, completion, priority | Update log.md only |
| Resolved problem with no lasting constraint | Record it nowhere |

**One fact, one home.** A document may reference a fact another document owns, but
never keeps its own copy.

## Law II — Document authority is asymmetric

| Document | Who may change it |
| --- | --- |
| /README.md | Nobody. Frozen (Law 0). |
| constitution.md | PM only. An agent may propose a change; it may never apply one unasked. |
| product-brief.md | PM-approved. A dev or agent may propose an amendment when implementation exposes a genuine product ambiguity, but does not merge it unasked. |
| plan.md | Senior dev + agents, collaboratively — the normal working document. |
| log.md | Mostly agent-maintained, append-only. Correct a factual error; do not rewrite history. |
| runbook.md | Senior dev + presentation owner. |

## Law III — Retention

Every line must answer one of: what must the product do; how must it be built or
verified; what is true right now; what operational step is next. A sentence that
answers none of these belongs in Git history or nowhere.

When state changes, the new statement **replaces** the old one — log.md is not a diary
of superseded status.

## Law IV — Engineering rules

Non-negotiable, regardless of what any single session decides in the moment:

- Never mark a task complete solely because an agent says it is complete. Completion
  requires the acceptance criteria in product-brief.md to be independently verified.
- Every must-have requirement has an observable acceptance criterion before work on it
  starts.
- Never weaken, skip, or remove a failing test to make the suite green. Fix the cause.
- No new dependency without a one-line reason in plan.md for why it is required.
- Secrets never enter source code, chat, or committed files.
- Work lands in small, independently verifiable increments.

Project-specific, born from what this product actually is:

- **Raw conversation content never enters the system.** The submission endpoint
  rejects it, and no code path stores, logs, or forwards it. This is a product promise
  in the north star, not a nice-to-have.
- **No profile is published without `owner_confirmed: true`.** A draft that has not
  been explicitly confirmed is never matchable, never visible to another user.
- **Upload tokens are short-lived, single-use, write-only, and draft-only.** A token
  that can read a profile, list users, or write anything but one draft is a bug.
- **Every match must be able to state its own reason.** If a match cannot name the
  shared interest, motivation, problem, or topic behind it, it is not shown.
  Explainability is a hard requirement — this rules out opaque similarity scoring as
  the sole ranking mechanism.
- **No engagement mechanics.** No public scores, follower counts, popularity rankings,
  infinite feeds, or swipe decks. If a task drifts toward one, stop and ask the PM.

## Law V — Risk mode

This project is in **vibe mode** for the hackathon: a prototype, ~10–30 pre-recruited
participants, no payments, no production users.

Vibe mode buys speed on UI, styling, seed data, and iteration. It does **not** relax
the five project-specific rules in Law IV — those are the product's thesis, and a demo
that violates them is a demo of a different product. Treat the submission endpoint and
the consent flow as engineering mode even while everything around them is vibe mode.

Moving a surface from vibe to engineering mode is a one-way door.

## Law VI — Amendments

An amendment exists only to reconcile or explicitly change an existing rule. Once
accepted, fold it into the relevant Law above and delete the amendment.

_Active amendments: none._
