# Terminology and claims — one page, for anyone speaking or writing about this submission

Derived from `docs/handoff/marketing-brief.md`. If this page and that brief ever
disagree, the brief wins — this is a quick-reference, not a new source of truth.

## Say it this way

**Headline:** agents introducing their owners to each other. Friend-finding is the
outcome, not the category — lead with the agent framing, not "friend discovery."

**One line:** Your assistant already knows what you actually care about. It just had
no way to introduce you to anyone. We gave it one.

**Words to use:** owner, pitch, hand off, approve, publish, match, explanation,
invitation, mutual acceptance, connection. The animal persona is the public
presentation name — call it that, never a username or display name. Say "the owner's
assistant," never "our AI."

**Words to avoid, always:** profile score, compatibility, ranking, matchmaking,
algorithm, feed, swipe, recommendation engine, network, connections in the LinkedIn
sense, friend discovery (as the lead framing), dating, recruiting.

## Claims we can make today

- The site never receives the user's conversation history.
- Sensitive-topic exclusion happens inside the user's own assistant, before transfer.
- Publication requires an explicit approval that is validated and recorded
  server-side.
- `history_scope` and per-field confidence are visible only to the owner and never
  enter matching or anything a peer sees.
- Contact information is exchanged only after both people accept.
- Deleting an account removes the profile, its versions, drafts, matches, invitation
  tokens and sessions together.
- Invitations are single-use and expire; opening one changes nothing until the
  recipient explicitly chooses.
- The interface shows no compatibility score, follower count, or popularity signal.
- Every published version stores the owner's approval timestamp and a payload hash.

## Claims we must never make

- That we verify identity, expertise, employment, or intent. We do not, by design.
- Match quality, accuracy rates, or that matches are "good." Report what happened
  (how many connected), never how well it worked.
- That this is an AI dating, recruiting, professional-networking, or social-feed
  product.
- That the assistant reads a user's full account history. Access varies by provider
  and setting; `history_scope` discloses only what was actually used.
- Production readiness. Sessions are opaque `localStorage` tokens, abuse operations
  are not implemented, and `/privacy` and `/terms` are product-boundary notices, not
  legal documents.
- Any number produced by a synthetic or fixture profile, quoted as a user result.

## The one open question — do not resolve it yourself

The headline framing above assumes the judge model ships real, per-pair match
explanations (Development JTBD-1). Today that path is a deterministic template. If
JTBD-1 does not land before the submission is locked, the brief's contingency applies:
drop the "agents introducing" headline, lead with **consent-first portability of AI
context** instead, and demote the middle agent to a roadmap item. The PM confirms
which path is live — if you don't know which one is confirmed, ask before you write or
say anything that assumes one over the other.
