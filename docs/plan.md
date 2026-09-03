# PitchYourOwner — Implementation Plan

_Last updated: 2026-09-03_
_Role: how the approved brief is built and verified · governed by
[`constitution.md`](constitution.md)_

The **executable work queue**, not just an architecture description. Architecture is
planned broadly; only the next few tasks are planned precisely. Re-plan the next slice
once the current one lands.

---

## 1. Architecture

| Concern | Selected implementation | Why (one line) |
| --- | --- | --- |
| Application framework | Next.js (App Router) + TypeScript | One codebase for UI and the submission endpoint; no separate backend to run |
| Client target | Mobile web / PWA at 375px | Judges open a URL on their own phone; no store review, no Expo Go install |
| Hosting | Vercel | Preview URL per branch, zero deploy config |
| Database / auth | Supabase (Postgres + Auth) | Postgres gives us the matching query directly; auth is free |
| Styling | Tailwind + shadcn/ui | One component library, no bespoke CSS (brief § 6) |
| Submission endpoint | Next.js Route Handler (`POST /api/submit_owner_pitch`) | The tool contract is one HTTP endpoint; MCP is not needed for the demo |
| Schema validation | Zod, `.strict()` | Rejects unknown fields rather than ignoring them (brief R4.3) |
| Matching | SQL over normalized tags in Postgres | Explainable by construction — the query returns *which* items overlapped |
| Notifications | In-app notification centre | Real push is out of scope (brief § 3) |
| Lint / types | ESLint + `tsc --noEmit` | Ships with the Next.js template |
| Tests | Vitest | Fast, no config; used for the submission endpoint and matching only |

**Decision — no embeddings, no vector search.** Explainability is a hard requirement
(constitution Law IV, brief R5.2). A weighted overlap query over normalized tags can
always name the items behind a score; a similarity vector cannot. This is the simpler
option *and* the more correct one.

**Decision — mobile web over native.** The brief's language is "phone app", and the
share-sheet/deep-link story is slightly weaker on web. Web wins on hackathon
throughput: no build queue, no device provisioning, and the demo is a URL. Copy +
Web Share API covers R1.3.

Project identifiers, credentials, and provisioning status are configuration facts —
they live in [`log.md`](log.md) § Configuration state, not here.

### Ownership boundaries

| Location | Owns |
| --- | --- |
| `app/(app)/` | The four areas: Matches, Invitations, My Pitch, Settings |
| `app/(onboarding)/` | Start screen, prompt handoff, fallback Review & Publish |
| `app/api/submit_owner_pitch/` | The submission endpoint and nothing else |
| `lib/schema.ts` | The single Zod definition of the profile contract |
| `lib/prompt.ts` | The generated prompt template (Steps 2 + 3 live here) |
| `lib/matching.ts` | Scoring and explanation generation |
| `supabase/migrations/` | Schema; the only place DDL is written |
| `components/ui/` | shadcn primitives — not edited by hand |

---

## 2. Development environment

### Setup

```bash
node -v                 # 20 or 22 LTS — anything else is unsupported
pnpm install
cp .env.example .env.local   # fill from log.md § Configuration state
pnpm dev                     # http://localhost:3000
```

### Conventions

- **Package manager: pnpm.** Do not mix in `npm install` — the lockfile is authoritative.
- **`.env.example` is committed and lists every variable by name.** `.env.local` is
  gitignored and never committed, pasted into chat, or printed. No exceptions.
- **Branch per work-queue item:** `p-003-submit-endpoint`. Never commit to `main`.
- **Commit message:** `P-003: reject unknown fields in submit payload`.
- **Open a PR to `main`.** Vercel builds a preview URL per PR; that URL is what gets
  reviewed, not the diff alone.
- **Schema changes go through `supabase/migrations/`**, never through the Supabase
  dashboard. A dashboard-only change is invisible to everyone else's local database.
- **Seed data lives in `supabase/seed.sql`** and is the demo's participant set. Never
  seed real people's data.
- **Bilingual copy** (EN + 繁中) lives in one place per surface, not scattered inline.

### The gate

Everything below must pass before a task is called complete:

```bash
pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

---

## 3. Engineering constraints

### Consent and submission

- **`owner_confirmed` is verified server-side on every submission.** A client-supplied
  flag alone never publishes. Reason: it is the entire consent model.
- **The Zod schema is `.strict()`.** Unknown fields are a rejection, not a silent drop.
  Reason: an ignored unknown field is how raw content sneaks in.
- **Payloads are size-capped before parsing.** Reason: reject oversized input cheaply.
- **A profile is `status = 'draft'` until published.** Only `published` rows are
  matchable. Reason: brief R4.7.

### Tokens

- **Tokens are stored as a SHA-256 hash, never plaintext.** The plaintext exists only
  in the generated prompt.
- **The token grants exactly one operation: create one draft.** There is no read path,
  no list path, no update path bound to it. Reason: brief R4.4.
- **`used_at` is set in the same transaction as the insert.** Reason: two concurrent
  submissions must not both succeed (brief R4.2).

### Logging

- **Never log a token, a profile body, or a match explanation.** Log ids and outcomes.
  Reason: the product promise is that this content is minimized everywhere.

### Matching

- **Every score carries the items that produced it.** `lib/matching.ts` returns
  `{ score, overlaps: { interests: [...], problems: [...], ... } }` — never a bare
  number. Reason: an unexplainable match cannot be shown (brief R5.2).
- **Filters are applied as a `WHERE` clause, never as score weights.** Reason: brief R5.5.

---

## 4. Implementation method, by step

### Step 1 + 4 — Sessions and submission

Data model (the whole thing):

```
upload_sessions  id · user_id · token_hash · expires_at · used_at
profiles         id · user_id · summary · friend_intent · history_scope
                 confidence(jsonb) · status(draft|published) · created_at
profile_tags     profile_id · kind(interest|motivation|active_problem|recurring_topic)
                 · value · normalized       -- normalized = lowercased, trimmed
matches          a_profile · b_profile · score · overlaps(jsonb)
invitations      from_profile · to_profile · status(pending|accepted|declined)
```

`profile_tags` is the key decision: one row per claim, rather than JSON arrays on
`profiles`. It makes the matching query a plain join and makes the overlap set fall out
of that same query — which is what makes matches explainable for free.

Flow: create session → prompt carries session id → assistant POSTs → validate size,
schema, `owner_confirmed`, session validity → insert profile + tags, mark session used,
all in one transaction → deep link back to the app.

### Step 2 + 3 — The prompt

`lib/prompt.ts` holds one template. It is the product, not a string constant — changes
to the consolidated-confirmation wording need PM approval (brief § 7). Test it by
running it against real ChatGPT and Claude accounts, not by unit test.

### Step 5 — Matching

One SQL query joining `profile_tags` to itself on `normalized`, grouped by candidate,
weighted 30/25/20/15/10 per brief R5. Filters as `WHERE`. Returns overlap arrays
alongside the score. The three Match Detail questions are rendered from those arrays.

---

## 5. Work queue

Bounded, independently verifiable tasks. **A completed task is removed from this
queue** — status lives in [`log.md`](log.md).

`Owner: SD` = senior dev · `JD` = junior dev · `PM` = product manager · `PP` = presentation/packaging

```
P-001 — Scaffold Next.js + Supabase + Vercel, gate command green
Owner:            SD
Requirement:      infrastructure for all
Depends on:       none
Files:            repo root, app/, .env.example, package.json
Implementation:   Next.js + TS + Tailwind + shadcn into the existing repo; Supabase
                  project; Vercel link; .gitignore + .env.example; pnpm scripts for
                  typecheck/lint/test/build
Verification:     gate command exits 0; a deployed preview URL loads on a phone
Done when:        another dev can clone, install, and run `pnpm dev` from
                  docs/plan.md § 2 alone
```
```
P-002 — Schema + migrations + seed
Owner:            SD
Requirement:      BRIEF R4, R5
Depends on:       P-001
Files:            supabase/migrations/*, supabase/seed.sql
Implementation:   the five tables in § 4; seed 12 synthetic participants across 4
                  distinct interest areas, including two pairs that should match and
                  one pair sharing only a broad domain label
Verification:     migration applies to a clean database; seed produces the intended
                  match/non-match pairs
Done when:        the R5.3 negative case exists in seed data
```
```
P-003 — submit_owner_pitch endpoint
Owner:            SD
Requirement:      BRIEF R3.6, R4.1–R4.4
Depends on:       P-002
Files:            app/api/submit_owner_pitch/, lib/schema.ts
Implementation:   size cap → Zod .strict() → owner_confirmed check → session validity
                  → transactional insert + mark used
Verification:     Vitest covering each rejection path separately: expired, duplicate,
                  unknown field, missing confirmation, oversized
Done when:        R4.1, R4.2, R4.3, R4.4 and R3.6 each have a passing test
```
```
P-004 — Prompt template
Owner:            PM (drafts) + SD (wires in)
Requirement:      BRIEF R1.2, R2.1–R2.5, R3.1–R3.5
Depends on:       P-001
Files:            lib/prompt.ts
Implementation:   the full prompt: scope restriction, nine-field schema, sensitive-data
                  pass, the exact consolidated-confirmation wording from BRIEF § Step 3
Verification:     run against real ChatGPT and Claude accounts; score against the
                  rubric in § 6 below
Done when:        3 of 3 test runs on each assistant produce a valid nine-field object
                  with no verbatim excerpts
```
```
P-005 — Start screen + prompt handoff
Owner:            JD
Requirement:      BRIEF R1.1, R1.3, R1.4
Depends on:       P-003, P-004
Files:            app/(onboarding)/
Implementation:   promise + assistant picker + "Raw chats are not uploaded"; create
                  session on tap; copy button and Web Share API; expiry countdown
Verification:     manual pass on a real phone at 375px; copy lands full prompt on
                  clipboard
Done when:        R1.1, R1.3, R1.4 pass, and R1.5 shows a clear expired state
```
```
P-006 — Fallback Review & Publish screen
Owner:            JD
Requirement:      BRIEF R4.5, edge case "malformed JSON"
Depends on:       P-003
Files:            app/(onboarding)/review/
Implementation:   paste JSON → parse with the same lib/schema.ts → render every field
                  → single publish action
Verification:     paste a valid payload and three malformed ones; compare the resulting
                  row against a direct-path row
Done when:        R4.5 holds and malformed input names what is missing without
                  partially publishing
```
```
P-007 — Matching query + explanations
Owner:            SD
Requirement:      BRIEF R5.1, R5.3, R5.5, R5.6
Depends on:       P-002
Files:            lib/matching.ts
Implementation:   weighted self-join over profile_tags returning score + overlap arrays;
                  filters as WHERE
Verification:     Vitest against the seed set: the two intended pairs match, the
                  broad-domain-only pair does not
Done when:        R5.1 and R5.3 both have passing tests over seed data
```
```
P-008 — My Pitch screen
Owner:            JD
Requirement:      BRIEF R4.6
Depends on:       P-003
Files:            app/(app)/pitch/
Implementation:   five groups + history scope + confidence labels + the
                  conversation-derived / owner-approved labels
Verification:     manual pass against R4.6 field by field
Done when:        every field in R4.6 is on screen and no raw evidence is shown
```
```
P-009 — Matches list + Match Detail
Owner:            JD
Requirement:      BRIEF R5.2, R5.4, R6.5
Depends on:       P-007
Files:            app/(app)/matches/
Implementation:   render the three questions from the overlap arrays; Invite / Not now
                  only; no score shown
Verification:     manual pass; confirm no numeric score reaches the DOM
Done when:        R5.2, R5.4, R6.5 pass
```
```
P-010 — Invitations + mutual consent
Owner:            SD
Requirement:      BRIEF R6.3, R6.4, edge case "simultaneous invite"
Depends on:       P-009
Files:            app/(app)/invitations/
Implementation:   invite → pending → accept reveals both sides; decline returns no
                  reason; rate limit on re-send; simultaneous invites collapse to one
Verification:     Vitest on the state machine including the simultaneous case
Done when:        R6.3 and R6.4 have passing tests
```
```
P-011 — In-app notification centre
Owner:            JD
Requirement:      BRIEF R6.1, R6.2
Depends on:       P-007, P-010
Files:            app/(app)/
Implementation:   three notification types; preview text carries no sensitive topic
Verification:     manual: generate one of each and inspect preview text
Done when:        R6.1 and R6.2 pass
```
```
P-012 — Completion audit
Owner:            PM
Requirement:      all
Depends on:       P-003..P-011
Files:            docs/log.md
Implementation:   run the audit prompt in § 7 below; every criterion without evidence
                  becomes a new queue item
Done when:        every BRIEF acceptance criterion has named evidence or a logged gap
```
```
P-013 — Demo run-of-show
Owner:            PP (with PM)
Requirement:      the demo, not the product
Depends on:       P-005, P-009
Files:            docs/runbook.md § Demo
Implementation:   scripted path, seeded accounts, fallback plan for a failed live AI
                  call, screen recording as backup
Verification:     full dry run on the actual demo phone and network
Done when:        the run-of-show has been executed start to finish twice
```

---

## 6. Verification matrix

| Area | Required verification |
| --- | --- |
| Submission endpoint (P-003) | Vitest, one test per rejection path. A green build is not evidence — each rejection is asserted separately |
| Prompt (P-004) | Human rubric, 3 runs × 2 assistants. Rubric: nine fields present · zero verbatim excerpts · every claim specific not broad (R2.3) · history_scope names both sides · one consolidated question |
| Matching (P-007) | Vitest over seed data, asserting both a positive pair and the R5.3 negative pair |
| UI steps (P-005, P-006, P-008, P-009, P-011) | Manual pass on a real phone at 375px against the named acceptance criteria, criterion by criterion |
| Invitations (P-010) | Vitest on the state machine, including simultaneous invite |
| Every task | The gate command in § 2, exit code read directly |

### What counts as evidence

- A route is not verified until it has been requested over HTTP. A green build proves
  generation, not reachability.
- Read a command's **exit status**, not the tail of its output.
- A width claim is measured in device emulation or on a real phone, never a resized
  desktop window.
- A verifier that has never been observed to fail is not evidence — break the condition
  once and confirm the check catches it. This applies especially to the P-003 rejection
  tests: send a payload that *should* pass and confirm it does.
- An empty response can pass a check vacuously — assert shape and size, not just
  absence of error.

---

## 7. Completion audit

The agent that builds a feature is not a reliable judge of whether it is finished. After
each milestone, run this as a **separate pass** (P-012):

> Assume the implementation is incomplete. Compare each acceptance criterion in
> docs/product-brief.md against the repository and provide evidence that it is
> satisfied. Any criterion without evidence is incomplete.

Gaps become new work-queue items and the cycle repeats until none turn up.

---

## 8. Remaining sequence

Priority order, not a schedule. An item leaves this list when it lands.

1. P-001, P-002 (SD) — unblocks everyone
2. P-004 (PM) — can run fully in parallel; needs no code
3. P-003 (SD), then P-005 + P-006 (JD)
4. P-007 (SD), then P-008 + P-009 (JD)
5. P-010 (SD), P-011 (JD)
6. P-012 (PM) audit, P-013 (PP) demo

P-013 starts as soon as P-005 and P-009 exist — do not leave the demo to the last hour.

---

## 9. Brief → implementation traceability

| Brief requirement | Implementation | Verification |
| --- | --- | --- |
| R1.1, R1.3, R1.4 | P-005 | Manual, matrix row "UI steps" |
| R1.2, R2.*, R3.1–R3.5 | P-004, `lib/prompt.ts` | Human rubric, matrix row "Prompt" |
| R1.5, R3.6, R4.1–R4.4 | P-003, `app/api/submit_owner_pitch/` | Vitest, matrix row "Submission endpoint" |
| R4.5 | P-006 | Manual + row comparison |
| R4.6 | P-008 | Manual, criterion by criterion |
| R4.7 | P-003 (`status`) + P-007 (query filter) | Vitest over seed data |
| R5.1, R5.3, R5.5, R5.6 | P-007, `lib/matching.ts` | Vitest, matrix row "Matching" |
| R5.2, R5.4 | P-009 | Manual |
| R6.1, R6.2 | P-011 | Manual |
| R6.3, R6.4 | P-010 | Vitest, matrix row "Invitations" |
| R6.5 | P-009 | Manual |
