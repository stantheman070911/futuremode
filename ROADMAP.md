# Roadmap

What PitchYourOwner deliberately did not build for the hackathon, and what a next
iteration would prioritize. Nothing here is scheduled work — it names the next
problem, grounded in what already exists in this repository, not a wishlist.

## MCP server for direct agent submission

Today an owner copies a JSON object out of their assistant and pastes it into
PitchYourOwner by hand. The product already has the piece that would remove that step:
`POST /v1/upload-sessions` creates a 24-hour, single-use, write-only capability, and
`POST /v1/profile-drafts` lets an agent holding that capability create exactly one
draft — it cannot read a profile back or publish one. An MCP server wrapping that
capability would let an assistant submit the draft directly, with the owner still
reviewing and approving it on this site before anything publishes. The consent
boundary does not move; only the copy-paste step disappears.

## Agent-to-agent introduction handshake

The third agent role — drafting the first message after mutual acceptance — currently
runs after a human has already accepted an invitation on this site. The next step is
letting the two owners' assistants exchange the opening message directly once mutual
consent exists, so the handoff back to a chat window is one action instead of two.

## Retrieval that scales past the current cohort

Matching currently runs an all-pairs pass per publish, judged candidate by candidate.
This is intentional and correct for a cohort under about fifty people, and it is the
honest boundary today — not a defect to hide. Past that size, matching needs a
retrieval step (approximate nearest-neighbor candidate generation) ahead of the
per-pair judge call, so judge-model cost and latency stop scaling with cohort size.

## Abuse operations

Block, report, and an age policy are not implemented. None of them are complex in
isolation; none of them shipped for the hackathon because a closed, invited cohort
does not yet need them. A production deployment does.

## A production browser-session design

Sessions today are opaque bearer tokens in `localStorage`. That is a reasonable
boundary for a reviewed, single-environment hackathon deployment and an explicit gap
for anything broader — the next step is a proper session and CSRF design before this
runs unsupervised in front of strangers.

## Match-quality instrumentation

The product has no signal today for whether a match was actually good — only whether
someone connected. The honest next step is asking the two questions this cohort
answered qualitatively (did the pitch describe you accurately; would you message the
person you were shown) as a structured, ongoing signal rather than a one-time
interview, without ever turning it into a public score.
