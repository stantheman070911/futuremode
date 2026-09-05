# Round 2 demo script

Five minutes, on a real phone, mirrored. Structure: before → product → outcome. Timings
below are targets from `docs/handoff/marketing-brief.md`; replace the "actual" column
once Development hands off JTBD-4's per-step wall-clock measurements, and mark each step
live or pre-staged exactly as they confirm — do not guess.

Terminology and claims for anything said out loud: `docs/handoff/terminology-and-claims.md`.
The framing is locked: the owner's assistant writes the pitch, the deployed judge model
explains each pair, and after mutual acceptance the owner's assistant drafts the first
message.

## Pre-staging checklist (fill in once JTBD-4 lands)

- [ ] Browser state prepared: `[PENDING — Development pre-staging procedure]`
- [ ] Two accounts ready: `[PENDING]`
- [ ] Second device state: `[PENDING]`
- [ ] Fallback demo-paste JSON located at: `[PENDING — packages/cloud/scripts path]`
- [ ] Two consecutive clean end-to-end runs completed and timed
- [ ] PM has confirmed the new match-list score-removal handoff and the list has been
      visibly reverified; until then, do not capture or publish that screen

## Beat sheet

| Target time | Actual | Beat | Live or pre-staged | What happens |
|---|---|---|---|---|
| 0:00 | `[ ]` | **Before** | Live | Show the before/after panel (P0-M2, asset one). "Everyone in this room has this gap." Then transition: "PitchYourOwner is agents introducing their owners to each other." No app on screen yet. |
| 0:40 | `[ ]` | **Hand off** | Pre-staged (per JTBD-4) | Sign in, choose the assistant, one tap. Cut to the pre-recorded assistant session — do not wait live for a third-party model. |
| 1:10 | `[ ]` | **The exclusion moment** | Pre-recorded clip (P0-M2, asset two) | The assistant lists what it found that might not be wanted public; presenter replies with a number. Show the published profile: it is not there. Say: "The site never saw the conversation. It only ever receives what I approved." |
| 1:50 | `[ ]` | **Edit and publish** | Live | Paste, change one line live so the room sees it is genuinely editable, tap Confirm and upload. |
| 2:30 | `[ ]` | **The match** | Live | Open one match and read the three judge-model answers aloud. If using the cleared verification example, emphasize that the model says 「跨領域的間接連結」and「斜向連結」instead of inventing a shared interest. This demonstrates grounded restraint, not match quality. |
| 3:20 | `[ ]` | **Outcome** | Live, second device | Send the invitation. Switch to the second phone. Show contact details absent. Accept. They appear on both sides. Say: "Neither of us saw the other's email until we both said yes." |
| 4:15 | `[ ]` | **The last agent** | Live | Tap "Ask AI to write your first message." The site hands a complete prompt containing both approved profiles and the match reason to the selected assistant, which drafts the message. The loop closes where it opened. |
| 4:45 | `[ ]` | **Close on people** | Live | State the real number from the funnel report (`[PENDING — Development JTBD-3]`) and one sentence of roadmap from `ROADMAP.md`. Never end on a settings screen. |

## Recovery

If the assistant returns malformed output on stage, paste the committed fallback JSON
(`[PENDING — exact path from Development]`) instead of narrating a fix live.

## Definition of done

Three full rehearsals on the actual demo phone, timed under five minutes, presenter able
to recover from a failed paste using the fallback JSON without breaking the beat.
