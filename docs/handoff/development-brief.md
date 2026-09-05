# PitchYourOwner — Hackathon Development Execution Brief

> Scope: hackathon execution only. This is not a product specification. `docs/product-design.md`
> remains the canonical product contract and `packages/cloud/README.md` remains the canonical
> engineering reference. Nothing here overrides either.

You have full access to the repository. Inspect the existing implementation before
changing anything; this brief deliberately does not restate what you can read in the
code. Where it names a file or behavior, verify it against HEAD before acting.

## Context you need

PitchYourOwner is a phone-first friend-discovery app. A person asks the AI assistant
they already use (ChatGPT or Claude) to write an introduction of them from context that
assistant can actually access. Sensitive topics are excluded inside that AI before
anything transfers. The owner brings back a JSON profile, edits it on our site, and
explicitly publishes. Matching runs on the approved profile only.

We are entering a hackathon judged in two rounds:

**Round 1 — Written review**
Problem Definition & Impact 35% | Technical Implementation 30% | Results / Demonstration 20% | Open-Source Quality 15%

**Round 2 — Live demo**
User Value 30% | User Experience 25% | Results / Demonstration 20% | Product Maturity 15% | Future Development 10%

The approved product framing, which the whole submission and demo are built on, is:
**"Agents introducing their owners to each other."** We claim three agent roles — the
owner's assistant writes the pitch, a judge model explains each pair, and an assistant
drafts the first email after connection. Roles 1 and 3 ship today. Role 2 does not:
it is currently a deterministic string template. JTBD-1 exists to make our central
claim true. If JTBD-1 does not land, the entire submission framing has to change.

A parallel Marketing workstream is writing the submission document, recruiting a real
user cohort, and building the demo script. They depend on specific artifacts from you.
Each JTBD below names what they need and in what form. Producing that evidence is part
of "done," not an afterthought.

## Standing constraints — these apply to every JTBD

1. Protect the working product. No refactoring, no architecture changes, no dependency
   additions, no new screens unless a JTBD explicitly asks for one.
2. Do not compromise the product guardrails in `AGENTS.md`. In particular: `history_scope`
   and `confidence` never enter matching or peer responses; `animal_persona` is excluded
   from embeddings, ranking and match explanations; contact information appears only
   after mutual acceptance; no swipe decks, popularity signals, follower mechanics or
   engagement loops.
3. `npm test` and `npm run build` must pass from `packages/cloud` before any handoff.
   Run `npm run synth` if you touch infrastructure.
4. Never make a generated runtime copy the only place a contract changes. Change the
   canonical source and run `npm run sync:contracts`.
5. Any script you add that touches AWS must be read-only unless stated otherwise, must
   target the exact hackathon stack and table, and must never print email addresses,
   session tokens, upload tokens, or invitation tokens to stdout, logs, or files.
6. Verify every UI change at 375px and 320px, including keyboard access, and the
   loading, empty, error and retry states of the affected screen.

## File ownership — avoid collisions with Marketing

Marketing is editing the root `README.md` in parallel. Ownership is split:

- **You own:** the Architecture section, Current constraints, External services,
  Repository structure, Local development, Deployed environment, and all of
  `packages/cloud/README.md`.
- **Marketing owns:** the opening problem statement, the Current product section,
  a new Results section, and a new `ROADMAP.md`.

Coordinate before editing outside your sections.

---

# P0 — MUST COMPLETE

## JTBD-1 — Generate real match explanations with the judge model

**Objective.** Replace the deterministic template that currently produces the three
match answers with a model-generated explanation, computed once when an edge is written
and persisted on that edge, so the read path needs no change.

**Why it matters.** The three questions on a match are the only screen where this
product delivers its value. Today `why_it_matters_now` is a single hard-coded sentence
identical for every match in the system, and `what_we_both_care_about` asserts a shared
focus that is usually just the peer's own top item, because the exact-string overlap
check effectively never fires on free-text Traditional Chinese. Our README already
advertises a judge model that does not run. This is a contradiction a technical judge
can find in ninety seconds, and it is the difference between an impressive build and a
convincing shell.

**Criteria improved.** R2 User Value 30%, R1 Technical Implementation 30%,
Results/Demonstration 20% in both rounds.

**Priority.** P0, highest. Start here.

**Expected user-facing outcome.** Opening two different matches produces two visibly
different, specific explanations. Each answer references something a reader can find in
one or both of the two profiles on screen. No answer is generic enough to apply to
any other pair in the system.

**Technical requirements.**

- Run the call at edge-write time inside the matching worker, in the function that
  persists a pair. Do not add a call to the read path — match list and detail latency
  must not regress.
- One model call per unordered pair, returning both directions in a single response.
  Explanations are directional today; keep that.
- Use the judge model id already present in CDK context. Check whether the matching
  worker's Lambda already receives it as an environment variable and whether its IAM
  role can invoke that model; wire both if absent. Reuse the existing JSON-returning
  Bedrock helper in `lib/reusable/` rather than writing a new client.
- Model input is the six shareable profile fields of both owners and nothing else.
  Exclude `history_scope`, `confidence`, and `animal_persona`. Exclude all identifiers,
  emails, hashes and version ids.
- Model output is strict JSON containing, for each direction:
  `what_we_both_care_about`, `why_it_matters_now`, `what_we_could_discuss`, and
  `evidence_labels` (one to three entries, each drawn only from the six matchable field
  names). Validate the shape and reject unknown fields before persisting.
- Output language is Traditional Chinese, matching the deployed UI.
- The prompt must instruct the model to ground every sentence in content actually
  present in the two profiles, to name the specific thing rather than the category, to
  state plainly when the connection is oblique rather than manufacturing a shared
  interest, and to never assert expertise, credentials or facts not in the input.
- Set an explicit timeout. On timeout, error, throttle, or invalid JSON, fall back to
  the existing deterministic explanation and persist that instead. A judge failure must
  never fail the matching run or leave an edge unwritten.
- Cap concurrency so a publish into a fifteen-person cohort does not throttle Bedrock.
- Record on the edge which path produced the explanation (model or fallback) and the
  model latency, so we can report coverage.

**Also fix the fallback so it is not a lie.** In the deterministic path, only claim a
mutual focus when the overlap check actually returned a shared item. Otherwise phrase
it two-sidedly, naming each owner's own item, and derive the "why now" sentence from the
strongest scoring component rather than emitting the same fixed sentence for every pair.

**Acceptance criteria.**

- Publishing a profile into a cohort of three or more produces edges whose three answers
  differ materially between candidates. Verify by reading three matches for the same
  owner and confirming no sentence repeats verbatim across them.
- `what_we_both_care_about` for a genuinely overlapping pair names the overlapping
  subject. For a non-overlapping pair, it does not assert a shared focus.
- `evidence_labels` contains only matchable field names.
- A simulated Bedrock failure produces the deterministic fallback, the run completes,
  every expected edge exists, and the pipeline reports the fallback path.
- No `history_scope`, `confidence`, `animal_persona`, email or identifier appears in
  any model request payload. Assert this in a test.
- Match list and detail response times are unchanged.
- `npm test` and `npm run build` pass.

**Dependencies.** None. Start immediately.

**Do not build.** No re-ranking, no scoring changes, no new weights, no threshold tuning,
no changes to embeddings or to the five weighted components, no read-path caching layer,
no streaming, no new API route, no UI change on the match screens.

**Evidence to hand Marketing.**

1. Two screenshots of the same match detail screen, before and after, at 375px.
2. Three screenshots of three different matches for one owner, showing distinct answers.
3. The matching worker's reported run duration, pair count, and model-vs-fallback split
   for one real publish into the live cohort.
4. Estimated Bedrock cost per published profile, showing your arithmetic.
5. One anonymized example pair — two animal personas plus the three generated answers,
   with no emails — that Marketing can quote verbatim in the submission.

---

## JTBD-2 — Remove the public similarity score and cap the result set

**Objective.** Two small, independent changes that bring the shipped product back in
line with our own written product contract.

**Why it matters.** The match list currently renders a similarity score out of 100 on
every card. Three separate documents in this repository forbid a public score
(`docs/product-design.md` sections 2 and 5, and guardrail 5 in `AGENTS.md`). The number
is also misleading: cosine similarity is remapped so that everything lands in a narrow
high band regardless of who is on screen. Separately, every eligible public profile
currently becomes a match, so at a cohort of thirty everyone sees everyone — which makes
our stated promise of "a small number of relevant friends" false, and turns the product
into the directory it explicitly claims not to be.

**Criteria improved.** R2 User Experience 25%, R1 Technical Implementation 30%.

**Priority.** P0.

**Expected user-facing outcome.** Match cards show the peer, the shared signal, and the
state — no number. An owner sees at most five suggested matches.

**Technical requirements.**

- Remove the score element from the match card in the browser app. Leave the API field
  in place; only the display goes.
- Introduce a named constant for the maximum result-set size, set it to 5, and apply it
  where the ordered result set is built. Do not delete the pagination code — it must
  continue to work if the cap is raised later.
- The isolated E2E script currently asserts a ten-plus-one split across two pages. Update
  that assertion to match the new cap. Do not weaken any other assertion in that script.

**Acceptance criteria.**

- No numeric score appears anywhere in the signed-in UI at 375px or 320px.
- An owner with more than five eligible candidates receives exactly five, highest
  composite first, with the existing deterministic tie-break preserved.
- Result-set stability across reload, detail and Back is unchanged.
- `npm test` and `npm run build` pass.

**Dependencies.** None.

**Do not build.** No score threshold, no new ranking signal, no "why this is capped"
explanatory UI, no settings control for the cap.

**Evidence to hand Marketing.** One before-and-after screenshot pair of the match list
at 375px.

---

## JTBD-3 — Produce a funnel and performance report from live data

**Objective.** A read-only script that reports what the product actually did for real
people, plus the two performance numbers that demonstrate engineering rigor.

**Why it matters.** Round 1 weights Results at 20% and Problem Definition & Impact at
35%, and the impact half of that criterion is currently empty — our own README states
that no real validation cohort has been completed. Marketing is recruiting 10–15 real
users right now. Without a way to count what happened, that recruiting produces a story
with no numbers in it.

**Criteria improved.** R1 Results 20%, R1 Problem/Impact 35%, R1 Technical 30%,
R2 Results 20%.

**Priority.** P0.

**Expected user-facing outcome.** None. This is a reporting tool.

**Technical requirements.**

- Add one script under `packages/cloud/scripts/` that reads the hackathon table and
  prints a Markdown table: profiles published, invitations sent, invitations accepted,
  invitations declined, mutual connections formed, and the count of distinct owners with
  at least one connection.
- Exclude every test and fixture profile from all counts. Report those separately and
  labelled, so nobody accidentally quotes a synthetic number.
- Report median and p90 elapsed time from profile publish to first edge written for that
  owner, derived from timestamps already persisted on the records.
- Report the model-versus-fallback split for generated explanations.
- Accept a flag that prints one anonymized example pairing — the two animal personas and
  the three generated answers only.
- Read-only. Never print or write an email address, session token, upload token or
  invitation token. Verify the target table name explicitly before reading.

**Acceptance criteria.**

- Running it against the live hackathon table produces the table with no secrets in the
  output, and the numbers reconcile against a manual spot check of two owners.
- Running it against a table with only fixtures reports zeroes in the real-user section
  rather than fixture counts.

**Dependencies.** Numbers are only meaningful once Marketing's cohort has published.
Build the script first so it is waiting when they arrive.

**Do not build.** No dashboard, no analytics service, no event pipeline, no new
persisted counters, no CloudWatch custom metrics.

**Evidence to hand Marketing.** The rendered Markdown table, refreshed on the last day
before Round 1 submission and again before the Round 2 demo, plus the anonymized example
pairing.

---

## JTBD-4 — Harden and rehearse the primary demo path

**Objective.** Guarantee that the five-minute live demo cannot fail on anything we
control, and reduce the one dependency we don't.

**Why it matters.** Round 2 weights Results at 20% and User Experience at 25%. The one
live dependency outside our control is a third-party assistant's response time during
the handoff step. A demo that stalls waiting for ChatGPT loses more points than any
feature gains.

**Criteria improved.** R2 Results 20%, R2 UX 25%, R2 Product Maturity 15%.

**Priority.** P0, but execute after JTBD-1 and 2 so you rehearse the final build.

**Expected user-facing outcome.** No new behavior. A demo that survives a bad network.

**Technical requirements.**

- Walk the full path on a real phone against the deployed environment: sign in, choose
  assistant, hand off, return, paste, edit one field, publish, wait for matches, open a
  match, invite, accept from a second device, view contact, generate the first email.
- Record the actual wall-clock duration of each step.
- Commit one known-good profile JSON under the demo scripts directory, clearly labelled
  as a demo paste fallback, valid against the current schema, so the presenter can
  recover instantly if the assistant returns malformed output on stage.
- Document the pre-staging procedure in `packages/cloud/README.md`: which browser state
  to prepare, which two accounts to use, what to have open on the second device.
- Fix any defect the walkthrough exposes on the primary path. Report but do not fix
  defects off the primary path without checking with the PM first.

**Acceptance criteria.**

- Two consecutive clean end-to-end runs on a real phone, timings recorded.
- The fallback JSON pastes, validates and publishes successfully.
- The pre-staging procedure is written down and a second person can follow it.

**Dependencies.** JTBD-1 and JTBD-2 must be deployed first.

**Do not build.** No demo mode changes, no seeded shortcuts on the live path, no
skip-the-AI button. The handoff is the product; we stage around it, we don't fake it.

**Evidence to hand Marketing.** Per-step timings, and a confirmed statement of which
steps are live versus pre-staged so the demo script matches reality.

---

# P1 — HIGH VALUE

## JTBD-5 — Bring the public profile page and social card onto the app's design system

**Objective.** Restyle the shared surfaces to the tokens the app already uses.

**Why it matters.** The signed-in app is a restrained editorial system — paper ground,
near-black ink, a single blue, monospace labels, hairline rules. The public profile page
and the 1200×630 social card are a different visual language entirely: cream, violet,
yellow, thick borders, hard offset shadows. The social card is what appears whenever
anyone shares a pitch, and it currently reads as though two teams built this product.

**Criteria improved.** R2 User Experience 25%.

**Priority.** P1.

**Expected user-facing outcome.** A shared link and its preview card look like the same
product as the app.

**Technical requirements.** Reuse the exact token values from the app stylesheet. Keep
the QR code, the 1200×630 dimensions, the private-profile notice behavior, the caching
headers and the content security policy exactly as they are. Typography may change;
structure should not.

**Acceptance criteria.** The card is still exactly 1200×630, the QR still decodes at
both full and half size, the private notice still renders, and the existing social image
tests pass.

**Do not build.** No new social card variants, no per-match cards, no dynamic OG for
routes that don't have one today.

**Evidence to hand Marketing.** The regenerated card as a PNG, and a screenshot of the
public profile page at 375px — both usable directly in the submission.

---

## JTBD-6 — Add continuous integration and a status badge

**Objective.** One workflow running install, test and build on push and pull request,
with a badge in the root README.

**Why it matters.** There are 47 passing tests that nothing runs automatically, and the
repository README itself notes that a clean commit is not proof the deployed environment
matches. Open-Source Quality is 15% of Round 1, and an unverified test suite reads as an
untested one. This is the cheapest credibility available.

**Criteria improved.** R1 Open-Source Quality 15%, R1 Technical Implementation 30%.

**Priority.** P1.

**Technical requirements.** Node 20 or newer, `npm ci`, `npm test`, `npm run build`,
working directory `packages/cloud`. No AWS credentials, no deployment step, no secrets.
Badge goes in the first screenful of the root README — coordinate placement with
Marketing, who owns that section.

**Acceptance criteria.** The workflow passes green on the default branch and the badge
renders.

**Do not build.** No deployment automation, no matrix builds, no coverage reporting, no
release workflow, no additional tests.

**Evidence to hand Marketing.** The green badge URL.

---

## JTBD-7 — Correct the technical sections of the documentation

**Objective.** Make every factual claim in the sections you own true as of HEAD.

**Why it matters.** The root README's architecture diagram advertises a judge model in
the matching path that does not currently run — after JTBD-1 this becomes true, and the
claim should be made accurate rather than removed. Separately, the constraints list
states that matching emails are not active in the current deployment. That is no longer
correct; email delivery has been confirmed working end to end. Leaving it in tells a
judge that half our product is switched off.

**Criteria improved.** R1 Open-Source Quality 15%, R1 Technical 30%, R1 Results 20%.

**Priority.** P1, and it must be done after JTBD-1 so the corrected text describes the
shipped behavior.

**Technical requirements.**

- Remove the stale claim that matching emails and notification deep links are inactive.
- Make the architecture description match what JTBD-1 actually ships, including where
  the judge call happens and what the fallback does.
- Reconcile the two READMEs: one of them currently calls the judge model a legacy unused
  setting. After JTBD-1 that is wrong in a different direction.
- Re-check every remaining bullet in the constraints list against HEAD. Keep the honest
  ones — the O(n²) note, the localStorage session note, the absent abuse operations.
  Judges reward acknowledged limits; they punish stale ones.

**Acceptance criteria.** No statement in your sections is falsifiable by reading the
code or using the deployed app.

**Do not build.** Do not rewrite the problem statement, the product description, or the
results section — Marketing owns those.

**Evidence to hand Marketing.** A one-line note per changed claim, so they can keep the
submission document consistent with the repository.

---

## JTBD-8 — Add a recovery affordance when the assistant returns prose instead of JSON

**Objective.** One piece of guidance on the paste screen for the most common failure in
the funnel.

**Why it matters.** The single highest-drop-off step is "find the JSON in your
assistant's second reply and paste it." The paste parser is already well hardened —
it handles code fences, smart quotes, duplicate keys and wrapped objects — but there is
no path back when the assistant simply never emits clean JSON.

**Criteria improved.** R2 User Experience 25%, R2 Results 20%.

**Priority.** P1.

**Expected user-facing outcome.** When parsing fails, the user is told exactly what to
send back to their assistant to fix it, and can copy that instruction with one tap.

**Technical requirements.** Extend the existing error handling on the paste screen. Add
a short copyable Traditional Chinese instruction telling the assistant to output only the
JSON object with no prose or Markdown. Follow the existing copy-to-clipboard pattern
including its fallback. No new screen, no new route.

**Acceptance criteria.** Pasting prose produces the guidance; the instruction copies;
the clipboard-unavailable fallback still works; verified at 375px and 320px.

**Do not build.** No retry-through-the-API, no server-side repair of malformed JSON, no
LLM call to fix the paste.

**Evidence to hand Marketing.** A screenshot of the recovery state at 375px.

---

# P2 — ONLY IF P0 AND P1 ARE COMPLETE AND STABLE

## JTBD-9 — Connect the generated social card to the owner's sharing flow

**Owner decision.** Activated for implementation on 2026-09-05. Reuse VibeMate's
platform-specific share mechanism and manual fallbacks, while following the
PitchYourOwner visual system and privacy contract.

**Objective.** Surface the owner's real public Profile URL and generated social card in
My Pitch, so the owner can see and share what was published without discovering the URL
inside Settings.

**Expected user-facing outcome.** My Pitch contains a **分享公開介紹** section with the
actual versioned 1200×630 OG image, Copy link, More sharing options, View public Profile,
X, Facebook, Threads, Download PNG, and Copy post text. Publishing still continues into
matching; its success notice offers a secondary **查看／分享公開介紹** action.

**Mechanism.** Every share destination and copied post uses the same `/p/{slug}` URL;
the downloaded `/og/profile/{slug}.png` encodes that URL in its QR. More sharing options
uses `navigator.share({ title, text, url })` when available and falls back to copying
the link. X receives text plus URL through its intent; Facebook receives the URL and
relies primarily on the page's Open Graph preview; Threads receives best-effort
prefilled text plus URL. Instagram is deliberately absent as a one-click action:
Download PNG plus Copy post text is the supported manual path.

**Claims discipline.** Say only that compatible platforms may render the page's Open
Graph/Twitter Card metadata. Do not claim universal platform support. A metadata unit
test, successful PNG request, or in-app preview does not prove platform rendering.
Record real-platform or preview-debugger verification separately, including the checked
date and any cache behavior.

**Privacy and state requirements.** The card remains generated from the approved public
Profile; do not add a social-card editor. Never show `history_scope`, `confidence`, email,
identifiers, or internal scores. Private Profiles show an explanatory disabled state and
make no request for the private OG image. Copy and share outcomes use the existing live
region and do not claim that a post was published.

**Acceptance criteria.** The My Pitch preview URL includes the current `version_id`;
Copy link and Copy post text work; absent or failed Web Share falls back to Copy link;
aborting the share sheet does not show an error; platform links are correctly encoded;
the public page opens separately; the PNG is downloadable; Private disables the actions;
and the layout is verified at 375px and 320px with keyboard access. Existing social-image,
privacy-revocation, test, and build gates remain green.

**Do not build.** No new route, no social-card editor or variants, no per-match share
card, no Instagram one-click promise, and no share step added to the required publish
flow.

**Evidence to hand Marketing.** A 375px My Pitch screenshot containing the real card, a
Private-state screenshot, the copied public URL, the 1200×630 PNG, and a platform check
ledger that keeps implemented metadata separate from observed third-party rendering.

- Reduce publish-to-first-match latency if the JTBD-3 measurements show it exceeds ten
  seconds at cohort size.

Nothing else. If you finish P1 and these two, stop and tell the PM rather than finding
more work.

---

# EXPLICITLY OUT OF SCOPE — DO NOT BUILD

These are defensible engineering tasks that will not move a judging criterion enough to
justify the hours, and several would destabilize something that currently works.

- **Localizing the app to English.** The interface is Traditional Chinese only and the
  English copy block in the browser app is unreachable dead code. Marketing is handling
  judge comprehension with an annotated English walkthrough instead. Do not wire up the
  locale switch, do not surface the English prompt, and do not delete the dead copy —
  deleting it has no judge visibility and non-zero regression risk.
- **Optimizing the all-pairs matching pass.** It is intentional and correct below fifty
  people. If asked in judging, the correct answer is to say so.
- **Expanding test coverage.** Wiring the existing suite into CI scores; writing more
  tests does not.
- **A production browser-session or CSRF redesign.** Documented as out of scope; the
  honest boundary already scores under Product Maturity.
- Block, report, age policy, abuse operations, notifications, deep links, the weekly
  matching schedule.
- Any new screen, route, or feature not named in this brief.

---

# REPORTING

After each JTBD, report to the PM: what changed, what you verified, what evidence you
produced and where it is, and anything you discovered that contradicts this brief. If a
JTBD turns out to cost materially more than expected, stop and escalate rather than
absorbing the overrun — the priority order exists to be re-cut.
