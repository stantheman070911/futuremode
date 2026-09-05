# PitchYourOwner — Round 1 submission

> **Status note, not for the final submission.** This draft is written using the
> approved headline framing — "agents introducing their owners to each other" — which
> assumes Development's real, model-generated match explanations (JTBD-1) ship before
> lock. **That is not yet confirmed.** If it slips, the brief's own contingency applies:
> drop this headline, lead Section 3 with "consent-first portability of AI context"
> instead, and demote the middle agent from a claim to a roadmap item. Do not resolve
> this by editing it out — get the PM's confirmation first, then delete this note.
>
> Two things below are marked `[VERIFY AGAINST LIVE APP BEFORE LOCK]` because the
> product-design contract and the Development brief describe them differently as of
> this draft (the contract says no numeric score is ever shown; the Development brief
> says one currently is, pending JTBD-2). Confirm against the deployed app before this
> document is final, not against either document alone.

---

## 1. The gap between your profile and your attention

Two people can both write "photography" on every profile they have ever filled in, and
it tells you nothing. One has spent three months on low-light street work; the other
studies how a shoulder line carries emotion in a portrait. No profile field separates
them, and neither would ever find the choreographer working on the identical question
from inside a body instead of behind a lens.

Every profile you have ever filled in has done this to you. It reduces you to a job
title and a handful of broad interest labels — categories, not the thing you actually
think about.

## 2. Why now

Meanwhile, the AI assistant each of those people talks to every day already holds the
signal a profile can't capture: recurring questions, unsolved problems, sustained
attention, evolving goals. It is richer than any form, built without anyone filling
one in, and it is trapped in a chat window with no owner-controlled way out.

Assistants became thinking partners before anyone built a way to let what they know
introduce their owner to someone else. That gap — not a missing feature, a missing
capability class — is what this submission is about.

> Your assistant already knows what you actually care about. It just had no way to
> introduce you to anyone. We gave it one.

## 3. What we built

**PitchYourOwner is agents introducing their owners to each other.** Three agent
roles, two independent human approval gates:

1. **The owner's own assistant** — ChatGPT, Claude, or another AI the owner already
   uses — writes the pitch from context it can actually access, and resolves privacy
   decisions before anything leaves it.
2. **A judge model** reads both owners' approved profiles and explains, in three plain
   questions, why this specific pair might have something to talk about.
3. **After mutual acceptance**, an assistant drafts the first message from both
   profiles and the match's own explanation — closing the loop where it opened.

The two approval gates are in two different products: exclusion happens inside the
owner's own AI; publication happens explicitly on this site and creates a stored
approval timestamp. Nothing that exists only in a browser counts as consent.

**The cast is real product data**, not invented personas — our own fixture profiles,
built to stress-test the same specificity the product asks of every owner:

- A **contemporary choreographer**, working out how weight transfer and shoulder-line
  detail survive at stage distance and under mixed lighting — animal persona: *a pink
  alpaca who reads emotion through the feet.*
- A **documentary cinematographer**, working out when consent to be filmed is
  genuinely revocable mid-shoot, and how lens choice and editing order can misrepresent
  a subject's agency — animal persona: *a red fox carrying a storyboard through set.*
- A **cross-border tax analyst**, separating which legal test applies — treaty text,
  domestic law, or substance-over-form — before any number gets computed — animal
  persona: *a sharp-eyed, bespectacled professional eagle.*

None of the three has ever met the other two. Nothing about their fields overlaps on a
conventional profile. What they share is the shape of their problem: a specific,
current, unfinished question that a job title cannot express.

## 4. How it works, technically

- **A published profile contract** (`config/pitchyourowner-profile-schema.json`) is
  the single canonical source for every field and its limits — prompts, UI, and server
  validation all read from it, so a limit is never duplicated and never drifts.
- **An executable prompt contract** (`docs/get_info_prompt_en.md`,
  `docs/get_info_prompt_ch.md`) tells the assistant exactly what to produce: a concise
  synthesis first, then one consolidated exclusion question, then exactly one JSON
  object matching the schema above — nothing else.
- **Exclusion before transfer.** The assistant lists the specific, named topics it
  found in the content it is about to hand over and asks once which to exclude. The
  site never receives the source conversation — only the object the owner approved
  after that question was answered.
- **Two independent approval gates**, as described in Section 3.
- **A single-use, write-only agent capability** already exists in the product:
  `POST /v1/upload-sessions` creates a 24-hour, single-use draft capability; a caller
  holding it can create exactly one profile draft (`POST /v1/profile-drafts`) and
  cannot read one back or publish one. This is the piece an MCP server would wrap to
  let an assistant submit a draft directly — see `ROADMAP.md`.
- **A product-neutral, reusable serverless library** (`packages/cloud/lib/reusable/`)
  underlies the stack: deterministic serialization and content fingerprints, strict
  validation primitives, configurable DynamoDB and session helpers, and configurable
  Bedrock embedding/judge calls. Its stated reuse boundary is explicit: it excludes
  route names, product schemas, model prompts, and UI copy — callers supply the
  product's own decisions, so infrastructure stays reusable without treating one
  product's choices as platform defaults.
- **Matching** combines cosine similarity across five weighted profile fields with a
  deterministic, evidence-labelled explanation. `[VERIFY AGAINST LIVE APP BEFORE
  LOCK]` — no numeric score is shown to any user, and each owner sees at most five
  suggested matches.
- **Two measured numbers**, from Development:
  - Median publish-to-first-match latency: `[PENDING — Development funnel/performance
    report]`
  - Bedrock cost per published profile: `[PENDING — Development funnel/performance
    report]`

## 5. Results

_This section does not exist until real people have gone through the product. Numbers
below are excluded from all fixture and test data and come from
`docs/handoff/recruiting-kit.md`'s cohort and Development's read-only funnel report._

| Metric | Value |
|---|---|
| Real published profiles | `[PENDING]` |
| Invitations sent | `[PENDING]` |
| Mutual connections | `[PENDING]` |
| People who gave written permission to be quoted | `[PENDING]` |

**One real pairing, quoted in full:** `[PENDING — one anonymized real pairing: both
animal personas and the three generated explanation answers, with permission, once a
real mutual connection exists and Development has confirmed whether the explanation is
model-generated or fallback.]`

**What cohort members said, in their own words** (the two one-liners collected per
person — did the pitch describe them accurately, and would they actually message the
person they were shown): `[PENDING]`

## 6. What we deliberately did not build, and what comes next

No swipe deck. No follower count, popularity signal, or engagement loop. No identity,
expertise, or employment verification — a pitch is a conversation-derived description
of current attention, not proof of anything, and the product does not claim otherwise.
No production-grade session design, no abuse operations (block, report, an age
policy) — an honest gap for a closed hackathon cohort, not a hidden one. No claim of
match quality or accuracy: we report what happened, not how well it worked.

What we would build next — an MCP server for direct agent submission, a full
agent-to-agent introduction handshake, retrieval that scales matching past an
all-pairs pass, the abuse operations above, a production session redesign, and
match-quality instrumentation that never becomes a public score — is in full in
[`ROADMAP.md`](../ROADMAP.md).
