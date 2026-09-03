# How this project is documented

Five documents, split by the **question each answers** rather than by topic. Each stays
short, is obviously current or obviously stale, and a session loads only the one it
needs.

The split exists for one reason beyond tidiness: **a hard requirement can't be "solved"
by quietly rewriting the requirement.** What must be true, how it's built, and whether
it actually is live in three different files with three different owners.

| Document | Question it answers | Who may change it |
| --- | --- | --- |
| [`/README.md`](../README.md) | What was the original vision? | **Nobody — frozen** |
| [`constitution.md`](constitution.md) | How must this be built? | PM only |
| [`product-brief.md`](product-brief.md) | What are we building, and why? | PM-approved |
| [`plan.md`](plan.md) | How are we building it? | SD + agents |
| [`log.md`](log.md) | What is true right now? | Anyone, append-only |
| [`runbook.md`](runbook.md) | How do we deploy and demo it? | SD + PP |
| Code + tests + Git | What actually exists? | **Machine truth** |

That last row is the rule everything defers to. The documents *control* the work; they
never override what the repository and the tests actually demonstrate. **When a document
and the code disagree, the code is right.**

---

## Where to start, by role

### PM (product manager)

Own [`constitution.md`](constitution.md) and [`product-brief.md`](product-brief.md). No
one else merges changes to either.

Your working loop: keep acceptance criteria testable and the out-of-scope list honest;
run the completion audit (plan.md § 7, task P-012) after each milestone — the agent that
built a feature is not a reliable judge of whether it's done.

**Your first task is P-004**, the prompt template. It has no code dependency, it's the
highest-risk unknown in the project, and it's product work, not copy.

### SD (senior developer)

Own [`plan.md`](plan.md) and the surfaces the constitution flags as engineering-mode:
the submission endpoint, the token model, and the consent check.

Everything upstream is blocked on **P-001** — scaffold and provision. Do that
first, then P-002. Your tasks are the ones with real invariants: P-003, P-007, P-010.

You also decide the shape of new plan.md entries when a slice lands. Plan the next few
tasks precisely; don't predict the whole project.

### JD (junior developer)

Work the queue in [`plan.md`](plan.md) § 5 — your tasks are P-005, P-006, P-008, P-009,
P-011, and each one names its files, its verification, and its stopping condition.

Two things worth internalizing:

- **"Done when" is the whole contract.** When those criteria pass, stop. Don't keep
  improving a task past its stopping condition — pick up the next one.
- **Verify on a real phone at 375px**, not a resized desktop window, and check the
  acceptance criteria one at a time rather than eyeballing the screen.

You're blocked until P-001 lands. Until then: read product-brief.md Steps 1 and 4 and
sketch the layouts.

### PP (presentation / packaging)

Own the demo half of [`runbook.md`](runbook.md) and task **P-013**.

Start against the brief, not against working software — the argument the demo makes is
already decided (the pitch is *specific*, and the match can *explain itself*). Build the
run-of-show and the fallbacks now; slot the real screens in as they land.

Your source for the product story is [`/README.md`](../README.md), the frozen original
memo. It's the most complete statement of the vision and it will not move under you.

---

## The working loop

1. Read [`log.md`](log.md) first — it's the 30-second answer to "where are we?"
2. Confirm the app currently works before changing it.
3. Pick **one** bounded item from [`plan.md`](plan.md) § 5.
4. Branch: `p-005-prompt-handoff`. Implement it.
5. Run the gate: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. Read the
   **exit status**, not the tail of the output.
6. Compare the result against the named acceptance criteria in
   [`product-brief.md`](product-brief.md), criterion by criterion — not against a vague
   sense that it should work now.
7. Review the diff for anything unintended. Open a PR; check the Vercel preview on a
   phone.
8. Merge. Remove the finished task from plan.md § 5, and append the result to log.md.
9. Only start the next item if the tree is clean.

## What "done" is not

- Not "the agent says it's done."
- Not "the build is green" — a green build proves generation, not reachability.
- Not "it looked right when I tried it."

Done is: the named acceptance criteria in the brief were checked one at a time, and
there is evidence for each.

## Conventions in one place

Environment setup, package manager, branch and commit format, migration and seed rules:
[`plan.md`](plan.md) § 2. Deploy and demo procedure: [`runbook.md`](runbook.md).

## Decisions made during setup

Where the source guide offered options, the simplest hackathon-appropriate one was
taken:

| Decision | Choice | Why |
| --- | --- | --- |
| Filenames | lowercase (`plan.md`, not `PLAN.md`) | Matches the existing `product-brief.md`; one convention, no renames |
| BRIEF.md's role | Played by `product-brief.md` | The team already refers to it by that name |
| Archive of the original | Root `/README.md`, byte-identical, frozen | Doubles as the repo front page; verified identical by sha256 |
| Runbook scope | Deploy + demo only | No production, no real data — backup/restore and secret rotation would be process theatre here |
| Risk mode | Vibe mode, with the consent and submission paths held to engineering mode | Speed everywhere it's cheap; rigor only where the product's thesis lives |
| Extra docs | None | Five documents is the system. A sixth would go stale before the demo |
