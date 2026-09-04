# PitchYourOwner — UX Implementation Plan｜使用者體驗實作計畫

_Product + UI/UX working plan for the coding agent · created 2026-09-04_

This plan covers **user journey, flow, and experience only**. It deliberately excludes
architecture, infrastructure, and code-quality work except where a technical fact
directly produces a visible experience problem.

Every item was verified against the current build in `packages/cloud/static/`
(`app.js`, `styles.css`, `index.html`) and walked at 375px.

Scope note: unless an item says otherwise, all changes live in
[`packages/cloud/static/app.js`](../../packages/cloud/static/app.js) and
[`packages/cloud/static/styles.css`](../../packages/cloud/static/styles.css).

---

## How to read an item

| Field | Meaning |
| --- | --- |
| **Problem** | What the user experiences today |
| **Desired UX** | What should happen from the user's point of view |
| **Change** | The interface / copy / flow change |
| **Instructions** | Behavior a coding agent should implement |
| **Affects** | Screens and functions |
| **States** | Loading, empty, error, success, disabled, validation, responsive |
| **Done when** | Acceptance criteria |
| **Priority** | P0 critical / P1 important / P2 polish |

---

## Summary of findings

| # | Issue | Phase | Priority |
| --- | --- | --- | --- |
| 1.1 | Publishing lands the user on "no matches" while matching is still running | 1 | P0 |
| 1.2 | Returning from the AI leaves the next step as the quietest button | 1 | P0 |
| 1.3 | The "what to do in ChatGPT" guide only appears after the user has left | 1 | P0 |
| 1.4 | "Load hackathon sample" lets a real user publish a fictional pitch | 1 | P0 |
| 1.5 | The offline demo cannot reach Connected, the product's payoff | 1 | P0 |
| 1.6 | The interface mixes English and Chinese with no language control | 1 | P1 · last |
| 1.7 | Raw error codes are shown to users | 1 | P0 |
| 1.8 | The verification-code screen has no resend, timer, or limit feedback | 1 | P0 |
| 2.1 | "Edit" on My Pitch opens Settings, which cannot edit a pitch | 2 | P1 |
| 2.2 | "Refresh my pitch" does not state its consequence | 2 | P1 |
| 2.3 | Signed-in users tapping the wordmark get the marketing page | 2 | P1 |
| 2.4 | Onboarding has no back navigation and no safe exit | 2 | P1 |
| 2.5 | Four different progress conventions in one linear flow | 2 | P1 |
| 2.6 | "Not now" makes a match vanish silently | 2 | P1 |
| 2.7 | Invite sends instantly with no explanation of what is shared | 2 | P1 |
| 2.8 | Connected renders as a one-line notice | 2 | P1 |
| 2.9 | The Computer API is unexplained, uncopyable, and hidden | 2 | P1 |
| 2.10 | No way to pause matching short of deleting everything | 2 | P1 |
| 2.11 | Deleting everything uses a browser confirm dialog | 2 | P1 |
| 3.1 | Machine values shown as user-facing labels | 3 | P1 |
| 3.2 | The same evidence chips repeat under all three match questions | 3 | P1 |
| 3.3 | Action hierarchy differs from screen to screen | 3 | P1 |
| 3.4 | Empty states handled three different ways | 3 | P1 |
| 3.5 | The same concept has different names in different places | 3 | P2 |
| 3.6 | Success and error messages behave identically | 3 | P2 |
| 4.1 | The start screen never states the data boundary | 4 | P2 |
| 4.2 | The prompt is an unexplained wall of text | 4 | P2 |
| 4.3 | The JSON field's placeholder does not match reality | 4 | P2 |
| 4.4 | Navigation labels are below comfortable reading size | 4 | P2 |
| 4.5 | Settings actions are under the 44px minimum target | 4 | P2 |
| 4.6 | Loading screens are silent to assistive technology | 4 | P2 |
| 4.7 | Support is unreachable from where problems happen | 4 | P2 |

### If time is short

Build in this order: **1.1 → 1.2 → 1.4 → 1.5 → 1.3 → 1.7 → 1.8 → 1.6**.

The first four are the difference between a journey that tells the truth about itself
and one that appears broken at its two most important moments — right after you approve
your pitch, and right after you come back from your AI. Each is surgical and touches one
or two screens.

**1.6 is deliberately last** and is all-or-nothing: it is the only item that touches
every screen, and a partial language conversion leaves the product worse than it is
today. If it cannot be completed in one pass, skip it.

Phase 2 items are independently shippable in any order. Phases 3 and 4 assume Phase 1
has landed.

---

# Phase 1 — Critical Journey Fixes

Blockers and moments where the product currently tells the user something untrue,
strands them, or hides the next step.

## 1.1 — Publishing your pitch lands you on "no matches"

**Priority: P0**

**Problem.** `publishProfile()` calls `POST /v1/matching-runs`, which returns
immediately while matching runs in the background. The app then navigates to
`/matches`, which fetches before any match exists and renders the empty state:
**"No filler. 目前還沒有能具體說明理由的配對."** The single most important moment in
the product — you just approved your pitch — reads as a failure. The user has no way
to know whether the system is still working or has genuinely found nobody.

**Desired UX.** After approving, the user sees their agent working, with an honest
sense of what is happening. Matches appear on their own when ready. If nothing is
found after a reasonable wait, the app says so plainly and offers one clear retry.

**Change.** Introduce a third Matches state — **searching** — between loading and
empty. It auto-refreshes, so the user never has to guess whether to press a button.

**Instructions.**
- On successful publish, record the publish time in memory and in local storage
  (survives a reload).
- `/matches` now has four states: `loading` (first fetch), `searching`, `empty`,
  `list`.
- Enter `searching` when the matches list is empty **and** a publish happened less
  than 3 minutes ago. Show: heading "Your agent is looking"｜「你的 Agent 正在尋找」,
  body explaining it is comparing your pitch against other owners and that this
  usually takes under a minute, plus a live "Checking again in Ns" line.
- While `searching`, re-fetch every 6 seconds. Stop after 3 minutes or as soon as at
  least one match returns.
- When a match arrives during `searching`, render the list and announce it via the
  existing `#live-region` ("1 match found"｜「找到 1 個配對」).
- After the window expires with no match, fall through to the existing honest empty
  state, but add a line explaining that matching runs again whenever a new owner
  publishes, and keep **Check again** as a manual action.
- Never show a bare spinner without explanatory text.

**Affects.** `publishProfile()`, `matchesScreen()`, `loadMatches()`, new local-storage
key for last publish time.

**States.**
- *Loading:* first fetch only, existing "Looking for specific overlap" copy.
- *Searching:* explanatory copy + countdown; polling must pause when the tab is
  hidden and resume on focus.
- *Empty:* only after the searching window ends.
- *Error:* if the fetch fails during polling, stop polling, show the error notice and
  a **Try again** action; do not keep silently retrying.
- *Responsive:* copy must not clip at 320px.

**Done when.**
1. Publishing a pitch never shows "no matches" as the first screen.
2. A match created within ~60s of publishing appears without the user pressing anything.
3. The searching state clearly says the system is still working, not that it failed.
4. Polling stops after the window, on error, and when the user leaves the screen.
5. Verified at 375px and 320px.

---

## 1.2 — Coming back from ChatGPT leaves the user on a screen whose next step is the least visible button

**Priority: P0**

**Problem.** The handoff screen's primary action navigates the whole tab away to
ChatGPT/Claude. When the user comes back (browser Back), they land on the same
handoff screen showing the same giant prompt and the same primary button — **Open
ChatGPT with my prompt** — as though nothing happened. The action they actually need,
**"Security checked · Paste final JSON"**, is the third, quietest button on the page.
There is also no back link to change AI or language, and the header shows the string
"Back to ChatGPT" as inert uppercase text that looks like a control but does nothing.

**Desired UX.** Handing off feels like a round trip. When you return, the app
recognizes it, welcomes you back, and puts "paste your JSON" front and centre. Opening
the AI again is still possible but no longer the loudest thing on screen.

**Change.** Make `/handoff` a two-phase screen: **before handoff** and **after
handoff**.

**Instructions.**
- When the user triggers the primary open action, record that the handoff was launched
  (with a timestamp) alongside the existing saved prompt/AI/locale.
- On returning to `/handoff` with a launched handoff — detect via page load,
  `pageshow`, and `visibilitychange` — render the "after handoff" phase:
  - A short welcome-back line: "Back from ChatGPT? Paste the JSON it gave you."｜
    「從 ChatGPT 回來了嗎？貼上它給你的 JSON。」
  - **Primary:** "Paste final JSON"｜「貼上最終 JSON」 → `/import`.
  - **Secondary:** "Open ChatGPT again"｜「再次開啟 ChatGPT」.
  - **Tertiary text action:** "Copy prompt again".
  - Collapse the prompt box to a summary row with "Show full prompt" so the returning
    user is not re-reading 11,000 characters.
- In the "before handoff" phase keep today's order: prompt visible and primary, one
  primary open action, visible Copy fallback.
- Replace the inert "Back to ChatGPT" text with a real back link to `/assistant`
  labelled "Change AI or language"｜「更改 AI 或語言」.
- Fix the step indicator: the handoff screen must show segment 2 of 4 active, and use
  the same eyebrow format as the other onboarding screens (see 2.5).

**Affects.** `handoffScreen()`, `launchAiWithPrompt()`, handoff storage record, click
handler.

**States.**
- *Before handoff:* prompt fully visible; primary = open.
- *After handoff:* prompt collapsed; primary = paste.
- *Error:* if the prompt failed to load, keep today's blocking message and disable both
  open and copy.
- *Disabled:* both open and copy disabled while the prompt is still loading.
- *Edge:* a hard reload must preserve which phase the user is in.

**Done when.**
1. Returning from the AI shows a different, correct screen than leaving for it.
2. "Paste final JSON" is the primary action after a handoff.
3. There is a working back path to `/assistant` from `/handoff`.
4. No control on the screen is inert text.
5. Phase survives reload; verified at 375px and 320px.

---

## 1.3 — The instructions for what to do inside ChatGPT only appear after the user has already left

**Priority: P0**

**Problem.** `/import` contains an excellent four-step guide explaining that the AI's
first reply is a preview, that the user must answer every `S1`/`S2` item, add the exact
confirmation phrase, and only then copy the JSON. But `/import` is reached *after* the
ChatGPT round trip. At the moment the user needs this — sitting in ChatGPT looking at a
preview and a list of security items — they have never seen it. They are most likely to
copy the first reply, come back, and hit a validation error.

**Desired UX.** Before leaving, the user knows exactly what will happen in the AI and
what they are supposed to bring back.

**Change.** Add a compact "what happens next" preview to `/handoff`, directly above the
primary action. Keep the full four-step guide on `/import` as the recovery reference.

**Instructions.**
- On `/handoff` (before-handoff phase), above the primary button, add a three-item list:
  1. "Your AI replies with a short preview — don't copy this one."｜「AI 會先回一段簡短預覽 — 這一則不要複製。」
  2. "It lists only the real privacy items it found. Answer them all in one message and add 確認安全並產生 JSON."｜「它只列出實際發現的隱私項目。在同一則訊息回答全部，並加上『確認安全並產生 JSON』。」
  3. "Copy the next reply — it will be only JSON, starting with `{`."｜「複製下一則回答 — 它只會是 JSON，以 `{` 開頭。」
- Use the existing `.json-guide` component so nothing new is designed.
- Keep the four-step guide on `/import` unchanged; it now reads as "here's what should
  have happened" when someone hits an error.

**Affects.** `handoffScreen()`, reuse of `.json-guide`.

**States.**
- *Responsive:* the list plus the prompt box plus three actions must not force a
  horizontal scroll at 320px; the prompt box may shrink.

**Done when.**
1. A first-time user can state, before leaving the site, which reply they are supposed
   to copy back.
2. The same three steps use identical wording on `/handoff` and `/import`.
3. No horizontal scroll at 320px.

---

## 1.4 — "Load hackathon sample" lets a real user publish someone else's profile

**Priority: P0**

**Problem.** On the empty `/import` screen, every user — signed in, in production —
sees **Load hackathon sample**, which fills the form with a fictional portrait
photographer. A user can publish that as their own pitch in two taps. It also
undermines the product's core promise ("this came from *your* conversations") at the
exact screen where trust is being established.

**Desired UX.** Real users only ever see their own content. Demo affordances exist only
in demo mode.

**Change.** Gate the sample button behind the same condition that gates the seeded
demo flow.

**Instructions.**
- Render **Load hackathon sample** only when the demo flow is available (localhost,
  `?demo`, or persisted demo mode) — the same condition already used for
  **Preview seeded flow** on the start screen.
- When it does render in demo mode, label it "Load demo pitch"｜「載入示範介紹」 and
  add a one-line caption: "Sample data for demonstration."｜「示範用資料。」

**Affects.** `importScreen()` empty state.

**States.** *Edge:* if a user is in demo mode and then signs in, the app must not carry
the sample into a real published profile — signing out already clears demo state; keep
that behavior.

**Done when.**
1. A signed-in production user never sees a sample-loading control.
2. In demo mode the control is present and visibly labelled as demonstration data.

---

## 1.5 — The offline demo cannot reach "Connected", the product's whole point

**Priority: P0**

**Problem.** In demo mode, `Invite` sets the match to `outgoing` and stops. The
Invitations screen then shows Connected · 0 forever. The payoff of the entire product
thesis — mutual consent, then contact revealed — has no demonstrable path without two
live accounts, a working backend, and a real model verdict. Anyone evaluating the
product offline sees the setup but never the resolution.

**Desired UX.** In the seeded walkthrough, inviting produces the full outcome: the
other side accepts, the state becomes Connected, and contact plus an opening question
appear — clearly labelled as demonstration.

**Change.** Script the peer response in demo mode.

**Instructions.**
- In demo mode, after the user invites, show the outgoing state with a line:
  "Waiting for Ren H."｜「等待 Ren H. 回覆」 plus a visible, honestly labelled
  **Simulate Ren accepting**｜「模擬 Ren 接受」 action.
- Choosing it moves the demo match to `connected`, populates a demo contact address,
  and routes to the Connected view built in 2.8.
- Every simulated element must carry a visible "Demo" marker; never present a simulated
  acceptance as a real one.
- `Not now` in demo mode should also demonstrate its real consequence (see 2.6).

**Affects.** `decideMatch()` demo branch, `matchDetailScreen()`, `loadInvitations()`
demo branch.

**States.**
- *Success:* Connected view with contact and opening question.
- *Edge:* after the demo reaches connected, Invitations must show Connected · 1 and
  Outgoing · 0.

**Done when.**
1. Starting from **Preview seeded flow**, a person can reach the Connected state with
   contact visible, without a backend.
2. Every simulated step is visibly labelled as simulated.

---

## 1.6 — The interface is a fixed mix of English and Chinese with no way to choose

**Priority: P1 — do this LAST in Phase 1, and only as one complete pass**

> **Scheduling decision (2026-09-04).** This is the widest-reaching item in the plan and
> the only one that touches every screen. A half-finished language pass is worse than
> today's consistent-but-mixed state, because the user would then see three conventions
> instead of one. Therefore: complete items 1.1–1.5, 1.7 and 1.8 first, then attempt
> this one. If it cannot be finished across **every** screen listed below in a single
> pass, abandon it and leave the current copy untouched — do not ship a partial
> conversion.

**Problem.** Headings, buttons, and navigation are English; body copy, hints, and error
messages are Traditional Chinese. `index.html` declares `lang="zh-Hant"` regardless.
The only language control anywhere is **Prompt language**, which changes the text sent
to the AI, not the interface. A Chinese-speaking user reads English buttons; an
English-speaking user cannot read the explanations that carry the privacy promise. The
canonical design explicitly requires the interface to use the user's selected language
rather than duplicating both.

**Desired UX.** The user picks a language once — or gets a sensible default — and the
whole interface speaks it, including errors, empty states, and the prompt handed to
their AI.

**Change.** One language setting for the whole product. Move it forward so it is chosen
before the journey starts, and remove the separate "Prompt language" concept.

**Instructions.**
- Introduce a single string table with `en` and `zh-Hant` entries covering every
  user-visible string, including button labels, hints, notices, empty states, and error
  copy.
- Default from the browser language; persist the user's choice; apply it to the
  document `lang` attribute.
- Put a compact language toggle on the start screen and in Settings. Remove the
  standalone **Prompt language** selector from `/assistant`; the one language setting
  now selects the prompt file too.
- If full coverage cannot land in one pass, sequence it: (a) the seven onboarding
  screens Start → Sign in → Assistant → Handoff → Import → Review → Matches, (b) match
  and invitation screens, (c) Settings and info pages. Never leave a single screen half
  translated — a screen is either fully converted or untouched.
- No screen may show both languages for the same string.

**Affects.** Every screen function, `index.html` (`lang`, skip link), the assistant
screen's language grid, the prompt file selection.

**States.**
- *Edge:* switching language must re-render the current screen in place without losing
  a draft, a partially typed form, or the handoff phase.
- *Responsive:* Chinese and English copy must both fit at 320px; check the start
  screen headline and the two checkpoint cards.

**Done when.**
1. Selecting a language changes every visible string on the converted screens.
2. `<html lang>` matches the selected language.
3. No converted screen mixes the two languages.
4. The prompt handed to the AI matches the selected language.
5. Changing language mid-draft loses nothing.

---

## 1.7 — Users are shown raw error codes

**Priority: P0**

**Problem.** The API client surfaces `body.detail || body.error || "HTTP <status>"`
straight into the error banner. Real users see strings such as
`invalid_cloud_session`, `match_not_found`, `invalid_invitation_decision`, and
`HTTP 429`. None of these tell a person what happened or what to do, and several occur
in the most fragile parts of the journey (sign-in, publish, invite).

**Desired UX.** Every failure says, in plain language, what went wrong and what the
user can do next.

**Change.** Map known error identifiers to human sentences with a recovery action;
never display an unmapped identifier verbatim.

**Instructions.**
- Add a lookup from error identifier to `{ message, action }` covering at minimum:
  expired or invalid session, rate limited / too many code requests, match not found,
  match expired, decision already recorded, profile not published yet, publish failed,
  network offline.
- Each mapped error shows the sentence plus, where relevant, one recovery control
  (Sign in again, Try again, Back to matches).
- For unmapped errors show a generic sentence — "Something went wrong. Please try
  again."｜「發生問題，請再試一次。」 — and log the raw identifier to the console only.
- Session expiry deserves special handling: explain that the session ended, preserve any
  local draft, and route to sign-in with a note that the draft is safe.

**Affects.** `api()`, the shared error notice in `shell()`, all catch blocks.

**States.**
- *Error:* banner keeps `role="alert"` and existing focus behavior.
- *Offline:* detect a failed fetch with no response and say the device appears offline.
- *Edge:* a session that expires mid-edit must never discard the draft.

**Done when.**
1. No snake_case identifier or `HTTP nnn` string appears in the UI.
2. Every mapped error offers a next action.
3. Session expiry during editing preserves the draft and explains what happened.

---

## 1.8 — The verification-code screen has no resend, no timer, and no rate-limit feedback

**Priority: P0**

**Problem.** After requesting a code the user sees a six-digit field, a Verify button,
and **Change email**. If the mail is slow or lands in spam there is no resend. The
backend enforces cooldowns and hourly limits, so a user who navigates away and retries
gets an opaque failure. This is the first interaction in the product and the highest-
abandonment point in any OTP flow.

**Desired UX.** The user can see where the code went, wait with a visible countdown,
resend once the countdown ends, and understand any limit in plain words.

**Change.** Add resend with countdown and human rate-limit copy.

**Instructions.**
- Show the destination email prominently (already partially present) and keep
  **Change email**.
- Add **Resend code**｜「重新寄送驗證碼」, disabled with a live countdown for 30 seconds
  after each send: "Resend available in 24s"｜「24 秒後可重新寄送」.
- On resend, restart the countdown and confirm via the live region.
- Map cooldown and hourly-limit responses to plain copy explaining how long to wait and
  offering **Change email** as the alternative.
- Auto-submit is not required; keep `autocomplete="one-time-code"` and the numeric
  keypad.
- On an incorrect code, keep the entered value, show the reason, and let the user
  correct it without re-requesting.

**Affects.** `signinScreen()`, the `request-code` and `confirm-code` submit handlers.

**States.**
- *Disabled:* resend disabled during countdown, verify disabled while submitting.
- *Validation:* fewer than six digits blocks submission with an inline message.
- *Error:* wrong code, expired challenge, rate limited each get distinct copy.
- *Success:* routed by existing returning-owner logic.

**Done when.**
1. A user who did not receive the code can resend without restarting.
2. The countdown is visible and the control is disabled while it runs.
3. Rate limits read as sentences, not codes.
4. A wrong code does not clear the field or the challenge.

---

# Phase 2 — Flow and Usability Improvements

Journeys that work but cost the user more steps, more guessing, or more anxiety than
they should.

## 2.1 — "Edit" on My Pitch opens Settings, which cannot edit a pitch

**Priority: P1**

**Problem.** The My Pitch header shows an **Edit** action that navigates to
`/settings`. Settings contains the Computer API, delete, sign out, and info links —
nothing that edits a pitch. The only real way to change a published pitch is
**Refresh my pitch**, which discards the draft and sends the user back to choosing an
AI, i.e. redoing the entire ChatGPT round trip to fix a typo.

**Desired UX.** Correcting a word in your own pitch takes a few seconds and never
requires going back to the AI.

**Change.** Make **Edit** load the published pitch into the editable form.

**Instructions.**
- **Edit** loads the currently published profile into the draft, navigates to the
  `/import` edit state with all fields prefilled, and continues through the existing
  read-only review to publish a new version.
- While editing an existing pitch, the eyebrow reads "Editing your published pitch"｜
  「編輯已發布的介紹」 rather than the onboarding step counter.
- The review screen's publish button reads "Publish changes"｜「發布修改」 in this mode.
- Cancelling returns to My Pitch with the published version untouched.
- The previously published version stays live until the new one is confirmed.

**Affects.** `pitchScreen()` header action, `importScreen()`, `reviewScreen()`,
publish flow.

**States.**
- *Loading:* if the profile has not loaded, disable Edit rather than navigating.
- *Error:* a failed publish keeps every edit and offers retry.
- *Edge:* an unpublished draft already in progress must prompt before being replaced —
  offer "Resume your draft" or "Edit published pitch".

**Done when.**
1. Edit opens an editable, prefilled form.
2. A one-word change can be published without returning to the AI.
3. Cancelling changes nothing.
4. The live pitch is only replaced on confirmation.

---

## 2.2 — "Refresh my pitch" does not say what it will do

**Priority: P1**

**Problem.** The button clears the local draft and jumps to `/assistant`. Users
reasonably read "refresh" as "update this from my AI automatically." Nothing warns them
that they are about to redo the whole handoff, and nothing tells them what happens to
the pitch that is currently live and matching.

**Desired UX.** The user understands they are starting a new pitch from scratch, and
that their current one keeps working until the new one is approved.

**Change.** Rename and explain.

**Instructions.**
- Rename to "Create a new pitch"｜「建立新的介紹」.
- Add supporting text below it: "Your agent writes a fresh pitch. Your current pitch
  stays live until you publish the new one."｜「你的 Agent 會重新撰寫一份介紹。在你發布新版
  之前，目前的介紹仍會繼續運作。」
- No modal is needed; the explanatory line is enough.

**Affects.** `pitchScreen()`.

**Done when.** The label and supporting copy describe the actual consequence, and the
existing behavior is unchanged.

---

## 2.3 — Signed-in users who tap the wordmark land on the marketing page

**Priority: P1**

**Problem.** The wordmark in every header links to `/`, which always renders the
start screen — the promise, the two checkpoints, and **Let my agent pitch me**. A
signed-in owner with a published pitch taps their product's logo and gets the landing
page for people who have not signed up. Recovering requires pressing the sign-up
button, which silently re-routes them.

**Desired UX.** The wordmark behaves like a home button: signed-out it is the promise,
signed-in it is your Matches.

**Change.** Make the wordmark destination depend on session state.

**Instructions.**
- When a session exists, the wordmark links to `/matches`.
- When no session exists, it links to `/`.
- Additionally, visiting `/` with a session should route by state — published pitch →
  `/matches`, local draft → `/import`, otherwise `/assistant` — reusing the existing
  returning-owner logic instead of rendering the marketing screen.

**Affects.** `shell()` header, route handling for `/`.

**States.** *Edge:* demo mode should behave like signed-in so the walkthrough is not
interrupted.

**Done when.**
1. A signed-in user never sees the marketing start screen unless they sign out.
2. The wordmark always reaches a sensible home.

---

## 2.4 — Onboarding has no back navigation and no safe exit

**Priority: P1**

**Problem.** `/assistant`, `/handoff`, `/import`, and `/review` deliberately hide the
bottom navigation so the user is not pulled out of an unfinished flow. But none of them
except `/review` offers any backward control either. A user who picked the wrong AI, or
wants English instead of Chinese, or wants to re-read the prompt after landing on
`/import`, has only the browser Back button — which on a PWA-style page is not visible.
A returning owner with a saved draft is routed straight to `/import` with no navigation
at all.

**Desired UX.** Every onboarding screen has one obvious way back and one obvious way
out, without abandoning work.

**Change.** Add a consistent back affordance to the onboarding chain and a safe exit for
users who already have a published pitch.

**Instructions.**
- Add a back control to `/handoff` (→ `/assistant`), `/import` (→ `/handoff`), matching
  the existing `/review` → `/import` pattern and the "Back to matches" link style
  already used on match detail.
- Back never discards a draft or the saved handoff.
- When the user already has a published pitch, show a quiet "Leave and go to Matches"｜
  「離開並前往配對」 exit on onboarding screens; the draft persists.
- Do not add the bottom navigation to onboarding screens.

**Affects.** `handoffScreen()`, `importScreen()` (both states), `reviewScreen()`.

**States.**
- *Edge:* going back from `/import` to `/handoff` must preserve a parsed draft, so
  returning forward shows the edit form, not the paste box.

**Done when.**
1. Every onboarding screen has a visible back control.
2. Back never loses entered content.
3. Owners with a published pitch can leave onboarding without losing the draft.

---

## 2.5 — Progress indicators contradict each other

**Priority: P1**

**Problem.** Four different progress conventions appear in one linear flow:
sign-in uses "STEP 1 / 2 · SIGN IN"; the assistant screen says "STEP 1 / 4 · CHOOSE AI";
the handoff screen has no step eyebrow at all and instead shows a four-segment bar with
only the **first** segment active — while being step two; import says "STEP 3 / 4" with
no bar; review says "STEP 4 / 4" with no bar. The user cannot tell how far along they
are or how much is left.

**Desired UX.** One consistent, truthful progress signal across the whole pitch-creation
journey.

**Change.** Standardize on the eyebrow plus the four-segment bar on all four onboarding
screens, with the correct segment active.

**Instructions.**
- Use the same header block on `/assistant`, `/handoff`, `/import`, `/review`: eyebrow
  text `STEP n / 4 · <NAME>` plus the `.progress` bar with segments 1..n filled.
- Correct the handoff screen to step 2 with two segments filled.
- Keep sign-in outside this counter — it is authentication, not pitch creation — but
  make its eyebrow visually identical in style.
- When editing an existing pitch (2.1), replace the counter with the editing eyebrow
  rather than showing a false step 3 of 4.

**Affects.** `assistantScreen()`, `handoffScreen()`, `importScreen()`, `reviewScreen()`.

**Done when.**
1. All four screens show a step counter and a bar.
2. The filled segments match the stated step on every screen.
3. Editing mode does not display the onboarding counter.

---

## 2.6 — "Not now" makes a match silently disappear

**Priority: P1**

**Problem.** Choosing **Not now** records the decision and the match vanishes from the
list, because the list filters out `not_now`. There is no confirmation, no explanation,
and no way back. A user who taps it by accident — the two buttons sit side by side, and
`Not now` is on the left where thumbs land — loses that person permanently with no
feedback that anything happened.

**Desired UX.** Passing on a match is calm, reversible for a moment, and clearly
explained: the other person is not told, and you will not be shown them again right away.

**Change.** Confirm the outcome and keep passed matches visible but out of the way.

**Instructions.**
- After **Not now**, return to `/matches` and show a transient confirmation: "Passed.
  They are not told."｜「已略過，對方不會收到通知。」
- Add a collapsed **Passed**｜「已略過」 section at the bottom of the Matches list showing
  passed matches; expanding lets the user open the detail again.
- Keep the neutral framing throughout — never the word "rejected."
- **Resolved (2026-09-04): a recorded decision cannot be reversed.** The invitations
  endpoint rejects any attempt to change an existing decision, so build the
  non-reversible variant: no "Invite after all" control. On a passed match's detail,
  state plainly that the decision is recorded and this person will not be suggested
  again, and offer only a back link to Matches.
- Because the decision is final, the confirmation in the previous instruction is not
  optional — **Not now** must not fire on a single unconfirmed tap. Use the same inline
  confirmation pattern as 2.7: "Pass on <Name>? This cannot be undone. They are not
  told."｜「略過 <Name>？此決定無法復原，對方不會收到通知。」

**Affects.** `decideMatch()`, `matchesScreen()`, `matchDetailScreen()`.

**States.**
- *Empty:* if all matches are passed, the Matches empty state must say so rather than
  claiming nothing was found.
- *Success:* transient confirmation, announced to the live region.

**Done when.**
1. Passing requires a confirmation and then produces visible feedback.
2. Passed matches remain findable but expose no reversal control.
3. The passed detail states that the decision is final.
4. No copy frames the decision as rejection, and the other party's view is unchanged.

---

## 2.7 — Invite sends instantly with no explanation of what is shared

**Priority: P1**

**Problem.** **Invite <name>** posts immediately. The user has never been told what the
other person will see — display name, pitch, the shared reason — or that their contact
address is only revealed if both accept. In a product whose entire promise is consent
and control, the one outbound action is the least explained.

**Desired UX.** Before the first invitation, the user knows exactly what is shared and
what stays private, and confirms deliberately.

**Change.** Add a lightweight confirmation step for the invite action.

**Instructions.**
- Tapping **Invite** opens an inline confirmation panel on the same screen — not a
  browser dialog — stating: "<Name> will see your display name, your published pitch,
  and the shared reason. Your email is shared only if you both accept."｜
  「<Name> 會看到你的顯示名稱、已發布的介紹與共同理由。只有雙方都接受時才會交換 Email。」
- Actions: **Send invitation** (primary) and **Cancel**.
- Show this confirmation for the first invitation in a session; afterwards send directly
  but keep the same sentence visible as static copy under the button.
- Accepting an incoming invitation gets the same treatment: state that accepting reveals
  contact details to both sides.

**Affects.** `matchDetailScreen()`, `decideMatch()`.

**States.**
- *Loading:* the send button shows a busy label and is disabled during the request.
- *Error:* failure keeps the panel open with a retry.
- *Success:* the state updates to outgoing with confirmation copy.

**Done when.**
1. No invitation is sent on a single unconfirmed tap the first time.
2. The confirmation names exactly what is shared and what is withheld.
3. Accepting is equally explained.

---

## 2.8 — Connected is the product's payoff and currently renders as a one-line notice

**Priority: P1**

**Problem.** When both people accept, the detail screen shows a success banner:
`You both accepted. Contact: <email>`. The email is plain text with no copy control and
no mail link. The "suggested opening question" the design promises is not surfaced as
such — it is buried as the third of three explanation paragraphs, which the user has
already read. The most rewarding moment in the journey is the least designed screen.

**Desired UX.** Reaching Connected feels like an outcome. The user immediately sees who
they are connected to, how to reach them, and a concrete first thing to say.

**Change.** Build a dedicated Connected block at the top of the match detail.

**Instructions.**
- When state is `connected`, render above the three questions: peer display name, a
  clear "You are connected"｜「你們已連結」 heading, the contact address with a **Copy**
  control and a mail link, and a highlighted **Start with this**｜「可以這樣開場」 block
  containing the "what we could discuss" text.
- Keep the three questions below as context.
- Remove the invite/pass actions in this state.
- Add a quiet "Report a problem"｜「回報問題」 text link that opens Support with the
  match reference prefilled in the message field — contact exchange is where safety
  concerns first appear.

**Affects.** `matchDetailScreen()`, Support screen prefill.

**States.**
- *Success:* copy-to-clipboard confirms via the live region.
- *Error:* if the clipboard is unavailable, the address remains selectable text.
- *Responsive:* long email addresses must wrap, not overflow, at 320px.

**Done when.**
1. Connected is visually distinct from suggested and outgoing.
2. Contact can be copied in one tap.
3. An opening line is presented as an action, not as prose.
4. No overflow at 320px.

---

## 2.9 — The Computer API is unexplained, uncopyable, and hidden

**Priority: P1**

**Problem.** Settings shows a row labelled "24-hour draft upload / 單次、write-only，只能
建立 draft" with a button labelled only **Create**. Pressing it dumps a submit URL and a
bearer token into two black blocks with no copy buttons, an ISO timestamp presented raw
as the expiry, and a one-line note containing a JSON body example. There is no
explanation of what a person does with this, no link to instructions, and no
indication that the return path is **Resume computer draft** on the Import screen. The
feature is effectively undiscoverable and unusable without reading the repository docs.

**Desired UX.** A user on a computer understands in one screen what this does, gets the
two values they need with one tap each, knows when it expires in human terms, and knows
exactly where to come back to.

**Change.** Rewrite the Computer API section as a short explained task.

**Instructions.**
- Retitle: "Upload a pitch from your computer"｜「從電腦上傳介紹」.
- Add two sentences of explanation: what it is for, and that it can only create a draft
  — it can never publish, read, or change anything.
- Button label: "Create upload link"｜「建立上傳連結」.
- After creation show: the submit URL with a **Copy** control, the token with a **Copy**
  control and a warning that it is shown once, and the expiry as human text
  ("Expires in 24 hours"｜「24 小時後到期」) alongside the exact time.
- Add a direct **Resume computer draft**｜「接續電腦草稿」 action in this section as well
  as on Import, so the round trip is discoverable from where it started.
- Add a link to the request format rather than embedding a JSON snippet in body copy.

**Affects.** `settingsScreen()`, `resumeComputerDraft()`.

**States.**
- *Loading:* the create button is disabled and busy while the request runs.
- *Success:* values shown once with copy confirmation.
- *Empty:* "Resume computer draft" with no draft available keeps today's honest notice.
- *Error:* a failed creation explains and offers retry.
- *Responsive:* tokens wrap; no horizontal scroll at 320px.

**Done when.**
1. A first-time reader can explain what the upload link does and cannot do.
2. URL and token each copy in one tap.
3. Expiry is stated in human terms.
4. The resume path is reachable from Settings.

---

## 2.10 — There is no way to pause matching

**Priority: P1**

**Problem.** The only controls over participation are delete-everything and sign-out.
A user who wants to stop being matched for a while — travelling, busy, uncomfortable —
must delete their pitch. The design lists pause as a required control, and the API
already supports an active/paused state; only the interface is missing.

**Desired UX.** Stopping and resuming matching is a single, clearly explained toggle
that does not destroy anything.

**Change.** Add a matching visibility control to Settings.

**Instructions.**
- Add a Matching section above Data with a toggle: "Find me new matches"｜
  「為我尋找新配對」.
- Explain the consequence next to it: paused means no new matches are created; existing
  matches and invitations remain, and the user can still accept them.
- Reflect the current server state on load; show a busy state while changing; confirm
  the new state in words.
- When matching is paused, show a persistent, quiet banner on the Matches screen
  explaining why no new matches appear and offering one tap to resume.

**Affects.** `settingsScreen()`, `matchesScreen()`, profile load.

**States.**
- *Loading:* toggle disabled until the current state is known.
- *Error:* a failed change reverts the toggle and explains.
- *Empty:* paused plus zero matches must say "paused", not "nothing found".

**Done when.**
1. A user can pause and resume matching without deleting anything.
2. The consequence is stated before the change.
3. The Matches empty state distinguishes paused from no-results.

---

## 2.11 — Deleting everything uses a browser confirm dialog

**Priority: P1**

**Problem.** `Delete` calls `window.confirm("Delete this pitch, its matches, and account
data?")`. A native dialog cannot be styled, is easy to dismiss accidentally, does not
enumerate consequences, and is exactly the pattern the canonical design forbids for
destructive actions ("explain consequences before confirmation"). The user also is not
told that this signs them out and cannot be undone.

**Desired UX.** Deletion is deliberate, fully explained, and clearly irreversible.

**Change.** Replace the native dialog with an in-page confirmation.

**Instructions.**
- Tapping Delete reveals an in-page panel listing exactly what is removed: the published
  pitch, all matches, all invitations including connected ones, and the session on this
  device.
- State plainly that it cannot be undone and that people already connected will no
  longer see the pitch.
- Require an explicit destructive action labelled "Delete everything"｜「刪除全部資料」,
  styled with the existing `.button.danger`, alongside **Cancel**.
- On success, route to the signed-out start screen with a brief confirmation.

**Affects.** `settingsScreen()`, `deleteProfile()`.

**States.**
- *Loading:* the destructive button is busy and disabled during the request.
- *Error:* failure keeps the account intact and explains; do not sign the user out.
- *Success:* signed out with confirmation.

**Done when.**
1. No `window.confirm` remains in the delete path.
2. The consequences are enumerated before confirmation.
3. A failed deletion does not sign the user out.

---

# Phase 3 — UI/UX Consistency

Same concept, same word, same component, same behavior — everywhere.

## 3.1 — Machine values are shown as user-facing labels

**Priority: P1**

**Problem.** The interface prints internal identifiers directly. Match cards show
`suggested` / `outgoing` / `connected` as the status label. Match detail evidence chips
read `EVIDENCE · INTERESTS`, `EVIDENCE · ACTIVE_PROBLEMS`, `EVIDENCE · RECURRING_TOPICS`
— snake_case field names in uppercase. The Invitations screen reuses the same raw states.
The canonical design says field names are not UI labels.

**Desired UX.** Everything on screen reads as language a person would use.

**Change.** Map every state and field identifier to a human label in both languages.

**Instructions.**
- States: `suggested` → "Suggested"｜「建議配對」; `outgoing` → "Waiting for them"｜
  「等待對方」; `incoming` → "Waiting for you"｜「等你決定」; `connected` → "Connected"｜
  「已連結」; `not_now` → "Passed"｜「已略過」.
- Evidence fields: `interests` → "Interests"｜「興趣」; `motivations` → "Motivations"｜
  「動機」; `active_problems` → "Active problems"｜「當前問題」; `recurring_topics` →
  "Recurring topics"｜「反覆主題」; `friend_intent` → "Friend intent"｜「交友意圖」.
- Any unmapped value falls back to sentence case with underscores replaced by spaces —
  never raw.
- Reuse the same mapping in match cards, match detail, invitations, and My Pitch so a
  concept is never named two ways.

**Affects.** `matchesScreen()`, `matchDetailScreen()`, `invitationsScreen()`,
`profileDocument()`.

**Done when.** No snake_case or internal state string is visible anywhere in the UI.

---

## 3.2 — The same three evidence chips repeat under all three match questions

**Priority: P1**

**Problem.** Match detail renders the entire `evidence_labels` array beneath each of
the three questions, so the identical three chips appear three times on one screen.
Instead of showing which part of the pitch supports which claim, it reads as decorative
templating — on the exact screen that carries the product's differentiator, explainable
matching.

**Desired UX.** The user sees, once and clearly, which parts of both pitches the
explanation is grounded in.

**Change.** Show the evidence once, framed as the basis of the whole explanation.

**Instructions.**
- Remove the per-question chip rows.
- Below the three questions, add a single labelled row: "Based on"｜「依據」 followed by
  the human field labels from 3.1.
- If the backend later supplies per-question evidence, attach chips per question and
  drop the summary row — but do not block this change on that.
- Keep the existing `.evidence-label` styling; this is a placement change, not a
  redesign.

**Affects.** `matchDetailScreen()`, `matchesScreen()` card evidence row.

**States.** *Empty:* if no evidence labels are returned, omit the row entirely rather
than rendering an empty label strip.

**Done when.**
1. Each evidence label appears at most once per screen.
2. The row is omitted when there is nothing to show.

---

## 3.3 — Action hierarchy differs from screen to screen

**Priority: P1**

**Problem.** There is no consistent rule for where the primary action sits. The handoff
screen stacks three full-width buttons (primary, quiet, quiet) so the tertiary action
looks like a peer of the primary. Import stacks a form button then two quiet buttons.
Review and match detail use the two-column `.button-row` with primary on the right.
Settings uses borderless blue text buttons inside rows. Users cannot learn one pattern.

**Desired UX.** On every screen it is immediately obvious what the main action is.

**Change.** Adopt one hierarchy rule and apply it everywhere.

**Instructions.**
- One primary action per screen, full width, at the bottom of the content.
- At most one secondary action, directly beneath, using the outlined style.
- Any further actions become text links, not full-width buttons.
- Where two actions are genuinely paired (Back to edit / Confirm, Not now / Invite),
  keep the existing two-column row with the primary on the right.
- Destructive actions always use the danger style and never sit adjacent to a primary.
- Apply first to `/handoff` (which currently has three stacked buttons) and `/import`.

**Affects.** `handoffScreen()`, `importScreen()`, `settingsScreen()`,
`pitchScreen()`, `styles.css` button classes.

**Done when.**
1. No screen has more than one primary-styled button.
2. No screen has more than two full-width buttons.
3. Paired decisions consistently place the primary on the right.

---

## 3.4 — Empty states are handled three different ways

**Priority: P1**

**Problem.** Matches and My Pitch have designed empty states with a heading, an
explanation, and a next action. Invitations instead always renders all three sections
and repeats the notice "目前沒有項目" up to three times, so a new user's first view of
Invitations is three identical grey boxes. Settings and match detail have no empty
handling at all.

**Desired UX.** Empty means one clear, honest message with a next step — never repeated
placeholder rows.

**Change.** Standardize on the `.empty` pattern and hide sections that have nothing.

**Instructions.**
- Invitations: if all three groups are empty, render a single `.empty` block explaining
  that invitations appear when you invite someone or someone invites you, with a primary
  action to view Matches.
- If at least one group has items, render only the non-empty groups with their counts.
- Every empty state must have: a short heading, one explanatory sentence, and at most
  one action.
- Never render the same placeholder notice more than once on a screen.

**Affects.** `invitationsScreen()`, `matchesScreen()`, `pitchScreen()`.

**Done when.**
1. Invitations shows one empty message, not three.
2. Empty sections are hidden rather than filled with placeholders.
3. All empty states follow the same structure.

---

## 3.5 — The same concept has different names in different places

**Priority: P2**

**Problem.** The bottom navigation says **Invites** while the screen it opens is titled
**Invitations**. The publish action is called "Confirm & upload" on review, "Publish"
in the notice text, and "發布" in Chinese copy — with "upload" implying a file operation
that does not exist. "Pitch", "profile", "介紹", and "檔案" are used interchangeably.
Buttons mix imperative English with descriptive Chinese.

**Desired UX.** One name per concept, everywhere, in both languages.

**Change.** Fix a small glossary and apply it.

**Instructions.**
- Adopt: **Matches**｜配對 · **Invitations**｜邀請 · **My Pitch**｜我的介紹 ·
  **Settings**｜設定. Change the nav label to "Invitations" so it matches its screen.
- The publish action is **Publish**｜發布 everywhere; retire "upload" for this action
  (keep "upload" only for the Computer API, where a real upload happens).
- Use **pitch**｜介紹 in all user-facing copy; reserve "profile" for API and schema
  contexts that users never see.
- Record the glossary at the top of the string table introduced in 1.6 so future copy
  inherits it.

**Affects.** `bottomNav()`, `reviewScreen()`, `publishProfile()` notices, string table.

**Done when.** No user-facing concept has two names, and the nav label matches the page
title it opens.

---

## 3.6 — Success messages and error messages behave the same way

**Priority: P2**

**Problem.** Both success notices and errors render as the same persistent banner at the
top of the screen, cleared only by navigating. A copy confirmation therefore stays
pinned above the fold while the user scrolls a 420px prompt box, and an important error
can be visually indistinguishable from a stale success from two actions ago.

**Desired UX.** Success is brief and near the thing you just did. Errors persist until
addressed.

**Change.** Separate transient confirmations from blocking errors.

**Instructions.**
- Success confirmations auto-dismiss after roughly 4 seconds and are always announced
  to the existing live region.
- Where a confirmation relates to a specific control (copy prompt, copy token, copy
  contact), show it adjacent to that control rather than at the top of the page.
- Errors remain persistent, keep `role="alert"`, keep focus behavior, and clear only on
  a new action or navigation.
- Never show a success and an error banner simultaneously.

**Affects.** `shell()`, `copyPrompt()`, `launchAiWithPrompt()`, `decideMatch()`,
Settings copy controls.

**States.** *Reduced motion:* dismissal must not rely on animation; the existing
`prefers-reduced-motion` rule stays.

**Done when.**
1. Success notices disappear on their own; errors do not.
2. Copy confirmations appear near their control.
3. Screen-reader users are notified of both.

---

# Phase 4 — Product Polish

Smaller changes that measurably reduce confusion.

## 4.1 — The start screen asks for commitment before explaining the data boundary

**Priority: P2**

**Problem.** The start screen promises the outcome and previews two checkpoints, but
never says what happens to the user's conversation data — the first question any
thoughtful person asks about this product. Privacy exists only behind
Settings → Privacy, which is unreachable before sign-in in practice.

**Change.** Add one sentence and one link before the primary action.

**Instructions.**
- Below the checkpoint pair, add: "PitchYourOwner never sees your conversations — only
  the pitch you approve."｜「PitchYourOwner 不會看到你的對話，只會收到你核准的介紹。」
- Add quiet Privacy · Terms links in the start-screen footer; both routes are already
  public.

**Affects.** `startScreen()`.

**Done when.** The data boundary is stated before the primary action, and Privacy is
reachable without signing in.

---

## 4.2 — The prompt is an unexplained 11,000-character wall

**Priority: P2**

**Problem.** The handoff screen shows the full prompt in a 420px black monospace block.
This is the confirmed design direction and should stay — but nothing tells the user what
they are looking at or why it is so long, so it reads as intimidating boilerplate rather
than the product's carefully written safety contract.

**Change.** Frame the prompt without hiding it.

**Instructions.**
- Above the prompt box add one line: "This is exactly what your AI is asked to do —
  including the privacy checks it must run before sending anything back."｜
  「這就是我們請你的 AI 執行的完整內容，包含它在回傳任何資料前必須執行的隱私檢查。」
- Keep the prompt fully visible and scrollable in the before-handoff phase; collapsing
  applies only to the after-handoff phase (1.2).

**Affects.** `handoffScreen()`.

**Done when.** The prompt has a one-line explanation and remains fully visible before
handoff.

---

## 4.3 — The JSON paste field gives no example of what is expected

**Priority: P2**

**Problem.** The textarea placeholder is `{ "summary": "..." }`, which is not what the
AI produces and does not help someone who pasted the wrong thing. The excellent, very
specific error messages only appear after a failed attempt.

**Change.** Make the expectation visible before the mistake.

**Instructions.**
- Change the placeholder to describe the shape: "Paste your AI's final reply. It starts
  with { and ends with } — nothing else."｜「貼上 AI 的最後一則回答。它以 { 開頭、以 } 結尾，
  沒有其他文字。」
- Keep the existing validation messages unchanged; they are already the strongest copy
  in the product.

**Affects.** `importScreen()` empty state.

**Done when.** The placeholder describes the expected content, not a fake schema.

---

## 4.4 — Bottom-navigation labels are below comfortable reading size

**Priority: P2**

**Problem.** Navigation labels render at 9px uppercase monospace with letter spacing.
The touch targets are compliant at 58px, but the labels themselves are hard to read at
arm's length, and uppercase monospace reduces word-shape recognition.

**Change.** Increase legibility without changing the design language.

**Instructions.**
- Raise the navigation label size to 11px and keep the existing weight and treatment.
- Verify all four labels still fit on one line at 320px after the Invitations rename
  (3.5); if not, keep "Invites" in the nav but retitle the page to match instead.

**Affects.** `styles.css` `.bottom-nav a`, `bottomNav()`.

**Done when.** Labels are at least 11px and no label wraps or truncates at 320px.

---

## 4.5 — Settings row actions are smaller than the minimum touch target

**Priority: P2**

**Problem.** Buttons inside settings rows are borderless text with only 10px padding
and no minimum height. Although the row is 58px tall, the tappable area is roughly
36–40px, below the 44px minimum the design requires, and the borderless style makes
them read as labels rather than controls.

**Change.** Enforce the minimum target and make them look tappable.

**Instructions.**
- Give settings-row actions a minimum height and width of 44px.
- Keep the blue text treatment but ensure a visible focus ring and a pressed state.
- Verify the row does not overflow at 320px with the longest label.

**Affects.** `styles.css` `.settings-row button`.

**Done when.** Every settings action is at least 44×44px, keyboard-focusable with a
visible ring, and does not overflow at 320px.

---

## 4.6 — Loading screens do not announce themselves

**Priority: P2**

**Problem.** Loading states render as centred text ("Loading your pitch", "Opening match
reason") with no `aria-busy` and no live-region announcement, so screen-reader users get
silence between navigation and content.

**Change.** Announce transitions.

**Instructions.**
- Mark loading containers as busy and announce the loading message to the existing live
  region on entry, and the result on completion.
- Keep the current copy — it is specific and good.

**Affects.** `pitchScreen()`, `matchesScreen()`, `matchDetailScreen()`,
`invitationsScreen()`, `announce()`.

**Done when.** Every asynchronous screen announces both start and completion.

---

## 4.7 — Support cannot be reached from where problems happen

**Priority: P2**

**Problem.** Support is only linked from Settings → Information. The moments that
generate support requests — a failed paste, a failed publish, a connected match that
goes wrong — offer no route to it.

**Change.** Surface Support contextually.

**Instructions.**
- Add a quiet "Something not working?"｜「遇到問題？」 text link to the persistent error
  banner and to the Import error state, routing to `/support`.
- Prefill the Support message with the screen name and, where relevant, the match
  reference — never the pitch content, tokens, or codes, consistent with existing
  Support copy.

**Affects.** `shell()` error notice, `importScreen()`, `infoScreen("support")`.

**Done when.** Support is one tap from any error state, and prefilled context never
includes sensitive values.

---

# Execution checklists

## Phase 1 — Critical Journey Fixes

- [ ] 1.1 Add a `searching` state to Matches with auto-polling after publish, stopping on
      result, timeout, error, or tab blur
- [ ] 1.1 Replace the immediate post-publish empty state; announce found matches
- [ ] 1.2 Record handoff launch; render an after-handoff phase on return
- [ ] 1.2 Promote "Paste final JSON" to primary after handoff; demote Open to secondary
- [ ] 1.2 Replace the inert "Back to ChatGPT" text with a real back link to `/assistant`
- [ ] 1.3 Add the three-step "what happens in your AI" list above the handoff action
- [ ] 1.3 Align that wording with the existing `/import` four-step guide
- [ ] 1.4 Gate "Load hackathon sample" behind demo mode and relabel it
- [ ] 1.5 Add a labelled simulated peer acceptance so demo mode reaches Connected
- [ ] 1.6 **(do last; all-or-nothing)** Build the two-language string table and apply it to every screen
- [ ] 1.6 Add one language toggle (Start + Settings); remove the separate prompt-language picker
- [ ] 1.6 Set `<html lang>` from the selection; preserve drafts across a language switch
- [ ] 1.6 If the pass cannot cover every screen, revert it entirely rather than shipping partial
- [ ] 1.7 Map error identifiers to human sentences with recovery actions
- [ ] 1.7 Handle session expiry without losing the draft
- [ ] 1.8 Add Resend code with a 30s countdown and human rate-limit copy
- [ ] 1.8 Preserve the entered code on a wrong-code error

## Phase 2 — Flow and Usability

- [ ] 2.1 Make My Pitch "Edit" open the prefilled editable form; keep the live version until publish
- [ ] 2.2 Rename "Refresh my pitch" and state its consequence
- [ ] 2.3 Route the wordmark and `/` by session state
- [ ] 2.4 Add back controls to `/handoff` and `/import`; add a safe exit for owners with a pitch
- [ ] 2.5 Apply one step-counter + progress-bar pattern to all four onboarding screens; fix handoff to 2/4
- [ ] 2.6 Require confirmation for "Not now" (it is irreversible), add a collapsed Passed section, keep neutral framing
- [ ] 2.7 Add an inline confirmation for Invite and Accept naming exactly what is shared
- [ ] 2.8 Build the Connected block: contact with copy, opening question, report link
- [ ] 2.9 Rewrite the Computer API section with explanation, copy controls, human expiry, resume link
- [ ] 2.10 Add the matching pause toggle and the paused banner on Matches
- [ ] 2.11 Replace `window.confirm` delete with an in-page enumerated confirmation

## Phase 3 — Consistency

- [ ] 3.1 Map all states and field names to human labels in both languages
- [ ] 3.2 Render evidence labels once as a "Based on" row; omit when empty
- [ ] 3.3 Apply the one-primary / one-secondary / text-link hierarchy, starting with `/handoff`
- [ ] 3.4 Give Invitations a single empty state; hide empty groups
- [ ] 3.5 Apply the glossary; rename the nav label to match its page; retire "upload" for publish
- [ ] 3.6 Auto-dismiss success notices; anchor copy confirmations to their control; keep errors persistent

## Phase 4 — Polish

- [ ] 4.1 Add the data-boundary line and Privacy/Terms links to the start screen
- [ ] 4.2 Add the one-line prompt explanation above the prompt box
- [ ] 4.3 Rewrite the JSON textarea placeholder
- [ ] 4.4 Raise nav label size to 11px and verify at 320px
- [ ] 4.5 Enforce 44×44px settings actions with visible focus
- [ ] 4.6 Announce loading start and completion on all asynchronous screens
- [ ] 4.7 Link Support from error states with safe prefilled context

---

# Verification pass for every phase

Run this before calling any phase done:

1. Complete the full journey at **375px** and again at **320px** — no horizontal scroll,
   no clipped text, no overlapped controls.
2. Complete the journey **keyboard-only** — every control reachable, visible focus,
   no gesture-only action.
3. Trigger each state deliberately: loading, empty, error, success, disabled, offline.
4. Reload the page at every step — drafts, handoff phase, and language must survive.
5. Walk the seeded demo path start to finish, ending at Connected.
6. Confirm no screen shows a raw identifier, a duplicated placeholder, or two languages
   for the same string.
