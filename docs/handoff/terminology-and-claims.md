# Terminology and claims — one page, for anyone speaking or writing about this submission

Derived from `docs/handoff/marketing-brief.md`. If this page and that brief ever
disagree, the brief wins — this is a quick-reference, not a new source of truth.

## Say it this way

**Headline:** agents introducing their owners to each other. Friend-finding is the
outcome, not the category — lead with the agent framing, not "friend discovery."

**The three roles:** the owner's assistant writes the pitch and handles exclusion; the
deployed judge model reads two approved profiles and explains the pair; after mutual
acceptance, an owner-triggered handoff gives the chosen assistant both profiles and the
match explanation so it can draft the first message.

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
- Every published version stores the owner's approval timestamp and a payload hash.
- The deployed matching worker calls Amazon Nova Pro once per pair to generate two
  directional explanations, with a truthful deterministic fallback for model,
  timeout, or validation failure.

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

## One temporarily blocked claim

Do not say that the whole interface is score-free and do not publish a match-list
screenshot yet. The match detail screen is safe to show. The PM's last instruction said
the match-list score was still live; commits `9d8df3f` and `fd19eb9` now contain removal
and deployment evidence, but Marketing has not received the PM's explicit handoff or
completed a visible live recheck. Only add the broader "no compatibility score" claim
after both happen.

This does not change the locked framing above. Per-pair judge-model explanations are
deployed and verified; this score-removal confirmation is a separate release gate.
