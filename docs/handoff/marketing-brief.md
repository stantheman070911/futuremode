# PitchYourOwner — Hackathon Submission & Positioning Brief

> Scope: hackathon execution only. This is not a product specification.
> `docs/product-design.md` remains the canonical product contract. Nothing here overrides it.
> If this brief and the product contract ever disagree, the product contract wins and you
> escalate to the PM.

> **PM resolution, 2026-09-05.** Real per-pair judge-model explanations are deployed;
> the "agents introducing their owners to each other" framing is locked. The PM's last
> instruction said the match-list score was still live. Commits `9d8df3f` and `fd19eb9`
> subsequently added code and deployment evidence for its removal, but Marketing still
> needs the PM's explicit confirmation and a visible live recheck before publishing a
> global score-free claim or a match-list screenshot.

You have access to the repository and the deployed application. Where this brief
describes product behavior, verify it by using the app rather than assuming.

## Context you need

We are entering a hackathon judged in two rounds, with these weights:

**Round 1 — Written review**
Problem Definition & Impact 35% | Technical Implementation 30% | Results / Demonstration 20% | Open-Source Quality 15%

**Round 2 — Live demo**
User Value 30% | User Experience 25% | Results / Demonstration 20% | Product Maturity 15% | Future Development 10%

A parallel Development workstream is shipping the remaining must-have changes before
submission. The judge-model change that makes the central framing true is already
deployed and verified; the score removal, funnel report, share assets, CI evidence, and
demo-path timings remain tracked in the dependency section below.

Our assessed position: Technical Implementation and Product Maturity are already strong
and need no more work. We are losing points in two places. First, Problem Definition &
Impact is our heaviest criterion and its *impact* half is empty — the repository
currently states outright that no real validation cohort has been completed. Second,
there is no roadmap anywhere, so Future Development scores zero. Both of those are your
workstream, and neither requires engineering.

---

# THE PRODUCT, ACCURATELY

## What it does

A person asks the AI assistant they already use — ChatGPT or Claude — to write an
introduction of them, drawn from conversations that assistant can actually access. The
assistant produces a short synthesis, then lists the specific potentially sensitive
topics it found in what it is about to hand over, and asks once which to exclude. The
person answers, and the assistant returns a structured profile as JSON. They paste it
into our site, edit any field inline, and explicitly approve publication. Only then does
anything become matchable. Matching runs on the approved profile, surfaces a small
number of people, and explains each pairing. Either side can send one invitation.
Contact details appear only after both people accept. After connecting, an assistant
receives both approved profiles and the match reason through an owner-triggered handoff,
then drafts the first email.

## The primary problem

Every profile you have ever filled in reduced you to a job title and a few broad
interest labels. Those categorize you; they do not describe what you actually think
about. Two people both write "photography" — one studies low-light street work, the
other how shoulder line carries emotion in a portrait. No profile system can tell them
apart, and neither of them would ever find the choreographer working on the identical
question from inside a body rather than behind a lens.

Meanwhile, the assistant each of them talks to every day holds exactly that signal:
recurring questions, unsolved problems, sustained attention, evolving goals. It is
richer than any form and it is trapped in a chat window with no owner-controlled way out.

## The target user

People whose work is too specific for a profile: practitioners and specialists with a
deep, current, unfinished problem. Our own fixture profiles are precisely this audience
and you should use them as the named cast — a contemporary choreographer working on how
weight transfer reads to a distant audience, a documentary cinematographer working out
when consent is genuinely revocable mid-shoot, a cross-border tax analyst separating
which legal test applies before any number is computed. Use them by name in the
submission. Vivid, credible, specific demo data outperforms generic personas.

## Core job to be done

> "Help me find the small number of people who are currently thinking about the same
> specific thing I am, and tell me why, without making me write a profile or hand over my
> private conversations."

## Positioning — this is the approved framing

**Headline, both rounds: agents introducing their owners to each other.**

The product has three agent roles: the owner's own assistant writes the pitch and
handles the privacy decisions; a judge model reads both approved profiles and explains
why this specific pair should talk; after mutual acceptance an assistant drafts the
first email. Friend-finding is the *outcome*, not the category.

Lead with this rather than with "friend discovery." Friend discovery is a category
judges have watched fail for fifteen years, and it immediately invites comparison to
dating and professional networking — comparisons our own documentation currently spends
four sentences disclaiming. Leading with what we are not is a weak opening. Lead with
the agent framing and the disclaimers become unnecessary.

**Secondary framing, for the Round 1 technical section only: consent-first portability
of AI context.** Everything an assistant knows about you is locked inside a provider.
We built a working protocol for getting a minimal, owner-approved slice of it out: a
published profile contract, an executable prompt contract, sensitive-topic exclusion
resolved before transfer, two independent approval gates, and a single-use write-only
capability an agent can use to submit a draft directly. Keep this out of the Round 2
opening — it is abstract, and Round 2 rewards immediately understandable value.

## Value proposition, one line

> Your assistant already knows what you actually care about. It just had no way to
> introduce you to anyone. We gave it one.

## Why our solution is meaningfully different

- The introduction is derived from behavior, not self-description. Reviewing "is this
  accurate?" is a job people can do well; writing "who am I?" from a blank page is not.
- Privacy is resolved before transfer, not after. Sensitive topics are identified and
  excluded inside the user's own assistant. Our servers never receive the source
  conversations — only the object the owner approved.
- There are two independent approval gates, in two different products. Exclusion happens
  in the AI; publication happens on our site and requires an explicit action that creates
  the stored approval timestamp. Nothing that exists only in a browser counts as consent.
- Every match receives a three-part, evidence-labelled explanation. The score-free
  presentation is the approved design, but the global score-free claim remains withheld
  until the new deployment evidence noted above is confirmed and visibly reverified.
- Contact details are exchanged only on mutual acceptance, and declining reveals nothing
  to the other party.

---

# CLAIMS DISCIPLINE

## Claims we can make today

- The site never receives the user's conversation history.
- Sensitive-topic exclusion happens inside the user's own assistant, before transfer.
- Publication requires an explicit approval that is validated and recorded server-side.
- `history_scope` and per-field confidence are visible only to the owner and never enter
  matching or anything a peer sees.
- Contact information is exchanged only after both people accept.
- Deleting an account removes the profile, its versions, drafts, matches, invitation
  tokens and sessions together.
- Invitations are single-use and expire; opening an invitation link changes nothing until
  the recipient explicitly chooses.
- Every published version stores the owner's approval timestamp and a payload hash.

## Claims we must avoid

- **Do not claim we verify identity, expertise, employment or intent.** We do not, by
  design, and the product documentation says so. A pitch is a conversation-derived
  description of current attention, not proof of anything.
- **Do not claim match quality, accuracy rates, or that matches are "good."** We have no
  instrument that measures this. Report what happened — how many people connected — not
  how well it worked.
- **Do not describe this as an AI dating, recruiting, professional-networking or social
  feed product.** Each is explicitly out of scope and describing it that way invites the
  wrong comparison set.
- **Do not claim the assistant reads a user's full account history.** Access varies by
  provider, account and memory setting; the prompt requires the assistant to disclose
  what it actually used, and the product surfaces that as `history_scope`.
- **Do not claim production readiness.** Browser sessions are opaque tokens in
  localStorage, abuse operations are not implemented, and the privacy and terms pages are
  product-boundary notices rather than legal documents. All of this is honestly
  documented, and the honesty scores under Product Maturity. Overclaiming would cost us
  more than it gains.
- **Do not quote any number produced by synthetic or fixture profiles as a user result.**

## Recommended terminology

**Use:** owner, pitch, hand off, approve, publish, match, explanation, invitation, mutual
acceptance, connection. The animal persona is the public presentation name — call it
that, not a username or a display name. Say "the owner's assistant," not "our AI."

**Avoid:** profile score, compatibility, ranking, matchmaking, algorithm, feed, swipe,
recommendation engine, network, connections in the LinkedIn sense.

---

# YOUR JOBS TO BE DONE

## P0-M1 — Recruit and run a real user cohort

**Objective.** Get 10–15 real people to sign in, hand off to their assistant, publish a
pitch, and where possible send and accept an invitation. Start this today; it is the only
item on either workstream with a lead time that cannot be compressed.

**Why it matters.** Problem Definition & Impact is 35% of Round 1 and its impact half is
currently empty. Results is another 20% in Round 1 and 20% in Round 2, and User Value is
30% in Round 2. This single job touches more judged weight than anything else either team
will do, and it requires no engineering at all.

**What to do.** Recruit specialists rather than generalists — the more specific someone's
current work is, the better the product performs and the better the story reads. Aim for
variety across fields, because cross-field pairings are the most striking evidence. Ask
explicitly for permission to quote their pitch, their animal persona and their match
explanation in a public submission, and record who agreed. Ask each person, in one
sentence afterwards, whether the pitch described them accurately and whether they would
message the person they were shown.

**Definition of done.** At least ten real published profiles, at least three invitations
sent, at least one mutual connection, written permission from at least two people to
quote them, and the qualitative one-liners collected.

**What you receive from Development.** A read-only reporting script that outputs the
funnel as a Markdown table, excluding fixtures, plus one anonymized example pairing.

---

## P0-M2 — Build the two visual proof assets

**Objective.** Two artifacts that make our strongest claims visible rather than asserted.

**Why it matters.** These argue our heaviest criterion visually and cost almost nothing.

**Asset one — the before/after panel.** One image. Left: a real public bio or LinkedIn
summary for a consenting cohort member. Right: the pitch their assistant produced for
the same person, showing the specific interests and unsolved problems. The gap between
those two panels *is* our problem statement and it argues better than three paragraphs.
This is the single strongest asset for Round 1 Problem Definition, and it opens Round 2.

**Asset two — the exclusion recording.** A short screen recording of a real assistant
session: the assistant lists the specific sensitive topics it found, the user replies
with a number, and the published profile afterwards does not contain that topic. Fifteen
seconds. This is the most impressive thing the product does and no judge has ever seen it,
because it happens inside someone else's app.

**Definition of done.** Both assets exist, both are cleared by the person shown, and both
are usable at presentation resolution and embedded in the submission document.

---

## P0-M3 — Write the Round 1 submission document

**Objective.** The Round 1 artifact. This document *is* the product for that round.

**Structure — lead with the problem for two full sections before naming what we built:**

1. **The gap between your profile and your attention.** The photography example. Open
   here. No product mentioned yet.
2. **Why now.** Assistants became thinking partners, and that context is trapped. This
   section earns the 35%.
3. **What we built.** Three agents, two consent gates. Frame it as the agent story.
4. **How it works technically.** The published profile contract, the executable prompt
   contract, exclusion before transfer, the write-only single-use agent upload capability,
   the product-neutral reusable serverless library with a stated reuse boundary, and the
   two measured numbers Development will supply.
5. **Results.** The funnel with real people in it, plus one real pairing quoted in full
   with the explanation the system generated. This section does not exist today and is
   worth 20%.
6. **What we deliberately did not build, and what comes next.** No swipe deck, no
   follower count, no engagement loop, no identity verification claim. Then the roadmap.

**Definition of done.** Every claim traceable to something in the repository or the
funnel report. No claim from the avoid list. Both visual assets embedded.

---

## P0-M4 — Restructure the root README and write ROADMAP.md

**Objective.** The README is the second thing a judge reads and the first thing they
scroll. `ROADMAP.md` is ten free points currently scoring zero.

**Why it matters.** Open-Source Quality 15% in Round 1, Future Development 10% in Round 2.

**File ownership — Development is editing this file in parallel.**

- **You own:** the opening problem statement, the Current product section, a new Results
  section, and all of `ROADMAP.md`.
- **Development owns:** Architecture, Current constraints, External services, Repository
  structure, Local development, Deployed environment.

Coordinate before editing outside your sections.

**Roadmap content, grounded in what exists.** An MCP server so an assistant can submit a
profile directly instead of the user copying JSON — the single-use write-only draft
capability that would back this already exists in the product. Direct agent-to-agent
introduction handshake. Retrieval that scales past the current small-cohort all-pairs
pass. Abuse operations: block, report, age policy. A production browser-session design.
Match-quality instrumentation, which the product currently has no signal for at all.

**Definition of done.** A judge opening the README sees the problem, the outcome, and the
results within the first screenful. `ROADMAP.md` exists and is linked.

---

## P0-M5 — Write and rehearse the Round 2 demo

**Objective.** A five-minute demo run on a real phone, mirrored, structured as
before → product → outcome.

**Beat sheet:**

| Time | Beat | What happens |
|---|---|---|
| 0:00 | **Before** | The two panels. My public bio; what I actually asked my assistant about for three months. "Everyone in this room has this gap." No app on screen yet. |
| 0:40 | **Hand off** | Sign in, choose the assistant, one tap. Cut to the pre-recorded assistant session here. Do not wait live for a third-party model. |
| 1:10 | **The exclusion moment** | The assistant lists what it found that I might not want public. I reply with a number. Show the published profile: it is not there. "The site never saw the conversation. It only ever receives what I approved." |
| 1:50 | **Edit and publish** | Paste, change one line live so they see it is genuinely mine to edit, approve. |
| 2:30 | **The match** | Open one. Read the three answers aloud. This is the beat the whole product exists to produce. |
| 3:20 | **Outcome** | Send the invitation. Switch to the second phone. Show contact details absent. Accept. They appear on both sides. "Neither of us saw the other's email until we both said yes." |
| 4:15 | **The last agent** | Tap the write-my-first-email action. An assistant drafts it from both profiles and the match reason. The loop closes where it opened. |
| 4:45 | **Close on people** | The real number from the funnel report, and one sentence of roadmap. Never end on a settings screen. |

**Definition of done.** Three full rehearsals on the actual demo phone, timed to under
five minutes, with the presenter able to recover from a failed paste using the fallback
JSON Development is committing.

---

## P1-M6 — Annotated English walkthrough

**Objective.** A section of the README with annotated screenshots of the full journey,
captioned in English.

**Why it matters.** The interface is Traditional Chinese only. That is a deliberate scope
decision and we are not changing it — localizing the app would cost days and risk the
best-polished surface we have. But a judge who cannot read Chinese must still be able to
follow what the product does, or Round 1 Results suffers for a reason unrelated to the
product's quality.

**Definition of done.** Eight to ten captioned screenshots covering sign-in through
connection. Reuse the existing verification screenshots in `docs/verification/evidence/`
where they are current.

---

## P1-M7 — Terminology and claims sheet for the team

**Objective.** A one-page internal reference so the submission, the README, the demo
script and anything anyone says on stage use the same words and make the same claims.
Derived from the claims and terminology sections above.

---

# WHAT DEVELOPMENT IS PRODUCING FOR YOU

Do not write around missing evidence. Write the narrative with placeholders and fill them
when each artifact arrives.

| What is coming | Why it matters to you | Evidence you receive | How to use it |
|---|---|---|---|
| **Real model-generated match explanations — shipped and verified** | This is the evidence the headline framing rests on. The deployed worker now calls Amazon Nova Pro once per pair and keeps a truthful fallback path. | `docs/verification/2026-09-05-jtbd-1-model-explanations.md`: 7/7 model explanations, 0 fallbacks, latency/cost figures, and one anonymized public-use example | Quote the example pairing verbatim in the Round 1 Results section. At demo beat 2:30, make the model's refusal to invent shared ground the point. |
| **Funnel and performance report** | Turns your recruiting into numbers | Markdown table of profiles, invitations, acceptances, connections, excluding fixtures; publish-to-match latency; cost per profile | Results section of the submission; the closing line of the demo |
| **Score removal and five-result cap — code/deployment evidence arrived; PM confirmation pending** | Aligns the screenshots you take with the intended score-free, small-result experience | `docs/verification/2026-09-05-jtbd-2-score-cap.md`; a fresh visible match-list check is still required | Do not publish the broad claim or a new match-list screenshot until the PM confirms the handoff and the list is visibly reverified. |
| **Rebranded public profile page and social card** | Your shareable assets | Regenerated 1200×630 PNG; public profile screenshot | Submission imagery and any link preview |
| **CI badge** | Open-Source Quality | Green badge | First screenful of the README |
| **Documentation corrections** | Prevents the submission contradicting the repository | A note per corrected claim | Reconcile against your sections before submitting |
| **Demo path timings and staging procedure** | Your demo script must match what actually happens | Per-step timings; which steps are live vs pre-staged | Set the beat sheet to real durations, not hoped-for ones |

## Framing resolution

The PM confirmed that the model-generated explanation path shipped and passed live
verification. Use **"agents introducing their owners to each other"** as the headline in
both rounds. Keep *consent-first portability of AI context* in the Round 1 technical
section only. The former contingency is retired; do not reintroduce it into drafts.

---

# REPORTING

Report to the PM: cohort progress by number, which assets are complete, and any place
where the story you want to tell is not supported by what the product actually does.
That last one is the most important thing you can escalate — positioning must never get
ahead of implementation, and you are closer to that line than anyone.
