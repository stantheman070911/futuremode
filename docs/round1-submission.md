# PitchYourOwner — Round 1 submission

> **Update required — 2026-09-06.** Judge-model matching claims in this draft are
> superseded. Current matching is embedding-only, paginates the complete eligible set at
> ten per page, and shows the composite score only in authenticated match views.

> **Lock note, not for the final submission.** The PM has confirmed the headline
> framing: real, per-pair judge-model explanations are deployed and verified. One
> separate product claim remains withheld. The PM's last instruction said the match-list
> score was live; new commits now contain removal and deployment evidence, but the PM has
> not yet confirmed that handoff and this workstream could not perform a visible live
> recheck. Do not claim that the interface is score-free or use a match-list screenshot
> until both happen. Real-cohort outcome numbers remain placeholders and may be filled
> only from the reporting path that excludes fixture and team profiles.

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
3. **After mutual acceptance**, the owner triggers one more handoff: the site gives
   their chosen assistant both approved profiles and the match's own explanation, and
   that assistant drafts the first message — closing the loop where it opened.

The two approval gates are in two different products: exclusion happens inside the
owner's own AI; publication happens explicitly on this site and creates a stored
approval timestamp. Nothing that exists only in a browser counts as consent.

**The demo cast is clearly labelled fixture data**, built to stress-test the same
specificity the product asks of every owner. It is narrative material, not a user
result:

- A **contemporary choreographer**, working out how weight transfer and shoulder-line
  detail survive at stage distance and under mixed lighting — animal persona: *a pink
  alpaca who reads emotion through the feet.*
- A **documentary cinematographer**, working out when consent to be filmed is
  genuinely revocable mid-shoot, and how lens choice and editing order can misrepresent
  a subject's agency — animal persona: *a red fox carrying a storyboard through set.*
- A **cross-border tax analyst**, separating which legal test applies — treaty text,
  domestic law, or substance-over-form — before any number gets computed — animal
  persona: *a sharp-eyed, bespectacled professional eagle.*

These synthetic profiles are not cohort evidence. Their fields do not overlap on a
conventional profile; the fixture set exists to demonstrate the signal the product is
trying to surface — a specific, current, unfinished question that a job title cannot
express.

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
- **Matching** combines cosine similarity across five weighted profile fields. At
  edge-write time, one Amazon Nova Pro judge call reads only the six matchable fields
  from both approved profiles and generates two directional, evidence-labelled
  explanations. Strict validation rejects unsupported fields and labels; timeout,
  model, or parsing failure uses a truthful deterministic fallback without dropping
  the pair.
- **Two measured numbers**, from Development:
  - Median publish-to-first-match latency: `[PENDING — Development funnel/performance
    report]`
  - Bedrock cost per published profile: `[PENDING — Development funnel/performance
    report]`

## 5. Results

### Live judge-model verification

On September 5, the deployed matching worker processed one owner against seven visible
candidates. This is technical evidence about the explanation path, not a real-user
outcome or a claim of match quality.

| Measure | Result |
|---|---:|
| Pairs processed | 7 |
| Model-generated explanations | 7 |
| Deterministic fallbacks | 0 |
| Median model-call latency | 4.875 seconds |
| Estimated judge cost for the full seven-pair run | approximately USD 0.060 |

The cost estimate is deliberately conservative: the verification counted every
Unicode character as a token because Nova Pro's token-count endpoint does not support
this inference profile. Full method and build evidence are recorded in
[`docs/verification/2026-09-05-jtbd-1-model-explanations.md`](verification/2026-09-05-jtbd-1-model-explanations.md).

The same report cleared this anonymized pairing for public use. Quoted verbatim:

**Owner persona**

> 戴著護目鏡、專拆系統邊界的工程水獺：愛把複雜部署問題拆成可實作的取捨。

**Peer persona**

> 織巢園丁鳥：蒐集研究、故事與現場線索，再把它們編成讓人願意靠近的空間。

**What we both care about**

> 你對 AI agent 的可靠性與恢復設計感興趣，而對方則關注 AI 陪伴、同理與心理支持。這兩者在 AI 系統的使用者體驗上有跨領域的間接連結。

**Why it matters now**

> 你正在解決長時間 agent session 的恢復與續跑問題，而對方則研究 LLM 心理支持中的長期信任與互動。這兩個議題在使用者對 AI 系統的長期依賴與信任上有著斜向連結。

**What we could discuss**

> 你可以與對方討論如何在 AI agent 的設計中融入心理支持元素，使系統不僅可靠，還能提供情感上的陪伴與支持。這可以包括如何在 agent 的操作模型中加入自我揭露與節奏匹配的設計準則，以及如何在系統恢復與續跑時維持使用者的信任與情感連結。

The important result is restraint. The judge called the relationship a
「跨領域的間接連結」and a「斜向連結」instead of manufacturing a shared interest that
was not present. This one run shows the shipped explanation path can describe an
oblique, cross-domain connection without pretending the two profiles say the same
thing; it does not establish that the match is good.

### Real-cohort outcomes

_These numbers do not exist until real people complete the flow. They must come from
Development's read-only funnel report, which excludes fixture and team profiles._

| Metric | Value |
|---|---|
| Real published profiles | `[PENDING]` |
| Invitations sent | `[PENDING]` |
| Mutual connections | `[PENDING]` |
| People who gave written permission to be quoted | `[PENDING]` |

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
