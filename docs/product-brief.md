# PitchYourOwner — Product Brief & PRD｜產品規格

_Last updated: 2026-09-03_
_Role: what must be delivered, and the criteria for calling it done · governed by
[`constitution.md`](constitution.md)_

> **This document is the spec the devs build against.** The original, untouched product
> memo lives at [`/README.md`](../README.md) and is frozen — it is the north star, not
> the work order. Where this document adds detail, it adds it *under* that vision; it
> never contradicts it. If you think it does, raise it with the PM.
>
> 本文件是開發團隊的執行規格。原始產品備忘錄保存於 [`/README.md`](../README.md)，
> 已凍結，作為北極星參考。本文件只在該願景之下補充實作細節，不得與之衝突。

A requirement stays in this document even after it ships. Nothing here is crossed out
on completion — status lives only in [`log.md`](log.md).

---

## 0. Problem, users, outcome

- **Problem:** Conventional profiles reduce people to job titles, schools, and broad
  interest labels. Two people both tagged "photography" may be pursuing entirely
  different questions. Labels categorize; they don't reveal what someone repeatedly
  studies, what they're trying to solve, or why it matters to them.
  傳統個人檔案只能分類，無法呈現一個人反覆研究什麼、正在解決什麼。

- **Users:** People who already use ChatGPT/Claude as a thinking partner and have
  accumulated real conversation history. For the MVP: 10–30 pre-recruited AI users
  across several distinct interest areas.

- **Desired outcome:** A user hands one prompt to their own AI, confirms once, and
  receives a small number of explainable friend matches grounded in specific shared
  attention — an interest, a motivation, an active problem, or a recurring question.

- **The proposition under test:** An AI-generated, owner-approved pitch produces a
  friend match that feels *more relevant* than a conventional self-written profile.
  由 AI 產生、owner 核准的介紹，能比自寫檔案產生更相關的配對。

### Product question

> Can an AI agent describe its owner well enough to identify a relevant friend?
> AI Agent 能否準確介紹自己的 owner，並找出一位真正相關的朋友？

### Durable principles (from the north star — do not trade these away for demo speed)

1. **The agent prepares; the owner publishes.** The agent drafts from behaviour-grounded
   patterns; the owner is the final editor and publisher of every field.
   Agent 準備內容；owner 決定發布。
2. **Relevance comes from shared depth**, not from broad labels or complementary skills.
3. **Review is consolidated and explicit.** One confirmation question, one answer.
   Silence, ambiguity, or edits without explicit confirmation do not authorize upload.
4. **Data access is narrow by design.** Short-lived, single-use, write-only, draft-only.
5. **Introductions require mutual consent.**

---

## 1. Product requirements

Six steps, mapping 1:1 to the six MVP capabilities in the north star. One step per
independently shippable unit of behaviour.

---

### Step 1 — Phone prompt handoff｜手機提示詞交接

The product must:

- Present the promise, the supported AI assistants, an estimated time, and the
  statement **"Raw chats are not uploaded."｜不會上傳原始對話** before any action.
- Create a short-lived upload session on **Let my agent pitch me**, and generate a
  prompt containing that session's one-time identifier.
- Let the user get that prompt into their AI assistant by copy, share sheet, or deep
  link, and show the session expiry.
- Show one clear path: **Create prompt → Ask your AI → Confirm once → Pitch ready**.

#### Acceptance criteria

- **R1.1** — Given a user on the start screen, when they tap **Let my agent pitch me**,
  then a new upload session row exists with a random single-use id, a hashed
  write-only token, and an `expires_at` no more than 30 minutes in the future.
- **R1.2** — Given a generated prompt, when it is inspected, then it contains the
  session id and instructs the assistant to analyze **only authorized and accessible**
  history or memory, and to exclude raw conversations and verbatim excerpts.
- **R1.3** — Given the handoff screen, when the user taps Copy, then the full prompt is
  on the clipboard and a confirmation is shown; Share opens the OS share sheet.
- **R1.4** — Given the handoff screen, when it renders, then the session expiry time is
  visible.
- **R1.5** (negative) — Given a session past `expires_at`, when its token is used, then
  the request is rejected with a distinct expired-session error and nothing is written.

---

### Step 2 — Structured owner-pitch generation｜結構化 owner pitch 產生

This step is executed by the user's own AI assistant. What we own is **the prompt** and
**the schema it must produce**. Getting this prompt right is product work, not copy —
it is the highest-leverage artifact in the project.

The product must:

- Specify a prompt that produces exactly one structured proposal with these fields:

  | Field | Meaning |
  | --- | --- |
  | `summary` | a short owner pitch｜簡短的 owner 介紹 |
  | `interests` | specific interests｜具體興趣 |
  | `motivations` | why these topics matter now｜目前重視的原因 |
  | `active_problems` | problems being addressed｜正在處理的問題 |
  | `recurring_topics` | repeatedly discussed questions｜反覆討論的問題 |
  | `friend_intent` | the desired friend or conversation｜希望認識的對象 |
  | `history_scope` | what context was and was not available｜可用與不可用的歷史範圍 |
  | `confidence` | confidence per claim｜每項描述的信心程度 |
  | `omitted_sensitive_data` | whether data was removed or generalized｜是否已移除敏感內容 |

- Instruct the assistant, when it lacks adequate context, to **disclose the limitation**
  and fall back to selected chats or a user-provided export — never to invent a profile
  and never to force a multi-round interview.

#### Acceptance criteria

- **R2.1** — Given the prompt run against an assistant with usable history, when it
  completes, then it returns a single JSON object carrying all nine fields.
- **R2.2** — Given any returned profile, when it is inspected, then it contains no raw
  conversation content and no verbatim excerpts.
- **R2.3** — Given `interests`, `motivations`, `active_problems`, and `recurring_topics`,
  when inspected, then each entry is a specific claim, not a broad label — "low-light
  street photography" passes; "photography" does not.
- **R2.4** — Given `history_scope`, when inspected, then it names both what was
  available and what was not.
- **R2.5** (negative) — Given an assistant with no accessible history, when the prompt
  is run, then it states the limitation and requests selected chats or an export rather
  than producing a profile.

_Verification for this step is human judgement against a fixed rubric, not an automated
test. See [`plan.md`](plan.md) § Verification matrix for the rubric and the sample set._

---

### Step 3 — Sensitive-data check and one consolidated confirmation｜敏感資料檢查與整合式確認

The product must:

- Instruct the assistant to flag or generalize, **before** asking for approval: names,
  credentials, private repositories, exact locations, customer details, confidential
  relationships, internal metrics, health information, and proprietary identifiers.
  Any uncertainty about whether a fact is safe appears in the same review.
- Present the complete proposed profile and ask exactly **one** consolidated question:

  > This is the profile I propose to upload. I removed or generalized the sensitive
  > details listed above. Review every field, then reply once with **CONFIRM**,
  > **CANCEL**, or list all edits in one message and end with **CONFIRM AFTER EDITS**.
  >
  > 這是我建議上傳的完整檔案。我已移除或概括化上述敏感內容。請審核每個欄位，
  > 並只回覆一次：**CONFIRM**、**CANCEL**，或在同一則訊息列出所有修改，
  > 最後加上 **CONFIRM AFTER EDITS**。

#### Acceptance criteria

- **R3.1** — Given a profile draft containing a person's full name, an exact address, or
  an employer-internal metric, when the review is presented, then that item appears in
  the omitted/generalized list and not in the profile body.
- **R3.2** — Given the review, when it is presented, then it asks exactly one question
  and shows every field of the profile.
- **R3.3** — Given a reply of **CONFIRM**, when submission occurs, then
  `owner_confirmed` is `true`.
- **R3.4** (negative) — Given a reply that lists edits but does **not** end with
  **CONFIRM AFTER EDITS**, when the assistant proceeds, then it does not submit and
  re-asks the consolidated question.
- **R3.5** (negative) — Given **CANCEL**, silence, or an ambiguous reply, then nothing
  is submitted.
- **R3.6** — Given a submission arriving with `owner_confirmed` absent or `false`, when
  the server processes it, then it is rejected and no draft is created.

---

### Step 4 — Submission and My Pitch｜上傳與我的介紹頁

Two paths, both ending at the same consent standard.

- **Direct path:** the assistant calls the narrowly scoped `submit_owner_pitch` tool
  with the session id and the confirmed profile.
- **Fallback path:** the assistant returns confirmed JSON, the user pastes or shares it
  back to the app, and a single **Review & Publish** screen applies the same standard.
  The fallback must work on any phone with no integration at all.

After publication, **My Pitch** shows the approved profile grouped into Interests,
Motivations, Problems, Recurring Topics, and Friend Intent, with history scope and
confidence labels — and never any raw evidence.

#### Acceptance criteria

- **R4.1** — Given a valid unexpired session and `owner_confirmed: true`, when
  `submit_owner_pitch` is called, then one draft profile is created and the session is
  marked used.
- **R4.2** — Given a session already marked used, when it is submitted again, then the
  request is rejected as a duplicate and no second profile is created.
- **R4.3** — Given a payload with unknown fields, raw conversation content, or a size
  over the configured cap, when it is submitted, then it is rejected with a specific
  reason and nothing is written.
- **R4.4** — Given a submission token, when it is used to attempt reading a profile,
  listing users, or changing settings, then every such attempt fails.
- **R4.5** — Given confirmed JSON pasted into the fallback screen, when the user
  publishes, then the resulting profile is byte-equivalent in content to what the
  direct path would have produced.
- **R4.6** — Given a published profile, when My Pitch renders, then all five groups plus
  history scope and confidence labels are shown, and every claim is labelled
  **conversation-derived** and **owner-approved**.
- **R4.7** — Given a draft that was never confirmed, when matching runs, then that
  profile is not matchable and is not visible to any other user.

---

### Step 5 — Explainable friend matching｜可解釋的朋友配對

The product must:

- Represent each profile along the ladder **domain → specific interest → motivation →
  active problem → recurring question**.
- Score with these weights: 30% specific-interest overlap, 25% active-problem overlap,
  20% motivation alignment, 15% recurring-topic overlap, 10% friend intent and
  practical compatibility.
- Apply language, safety, age, visibility, location preference, and availability as
  **filters only** — they never contribute to a score.
- Return a small number of matches, each of which answers three questions:
  1. What do we care about in common?｜我們共同關心什麼？
  2. What are we trying to do for the same reason?｜我們因什麼相同動機而行動？
  3. What could we discuss now?｜我們現在可以聊什麼？

#### Acceptance criteria

- **R5.1** — Given two profiles with a specific overlapping interest, when matching
  runs, then they appear in each other's match set with a score reflecting the weights
  above.
- **R5.2** — Given any surfaced match, when Match Detail renders, then it names the
  concrete shared items behind it and answers all three questions.
- **R5.3** (negative) — Given a candidate pair whose only commonality is a broad domain
  label with no shared specific interest, motivation, problem, or topic, then no match
  is surfaced.
- **R5.4** — Given a match set, when it renders, then it shows no public score, follower
  count, or popularity ranking to the user.
- **R5.5** — Given a filter mismatch (language, safety, age, visibility), then the pair
  is excluded regardless of overlap score.
- **R5.6** — Given a match, when its explanation is generated, then it contains no raw
  conversation content.

---

### Step 6 — Notification and mutual invitation｜通知與雙向邀請

The product must:

- Notify on **Pitch Ready**, **Strong Match Found**, and **Invitation Received**.
- Keep lock-screen/preview text general; sensitive topics and full explanations appear
  only after the user opens the app.
- Let either owner send an invitation. The recipient chooses **Accept** or **Not now**.
  An introduction occurs only on mutual consent.
- Never disclose the recipient's private reason for declining to the sender.
- Provide rate limits, block, and report.

#### Acceptance criteria

- **R6.1** — Given a published pitch, when matching completes, then a Pitch Ready
  notification is delivered.
- **R6.2** — Given a strong match, when the notification is delivered, then its preview
  text names no sensitive topic; the full explanation appears only in-app.
- **R6.3** — Given an invitation, when the recipient accepts, then and only then does
  each side see the other as an introduction.
- **R6.4** (negative) — Given **Not now**, then the sender sees only that the invitation
  was not accepted, with no reason, and cannot immediately re-send (rate limit applies).
- **R6.5** — Given any match or invitation screen, when it renders, then **Invite** and
  **Not now** are the only actions offered.

---

## 2. Should-haves

Wanted, not blocking. If one becomes load-bearing, move it up and tell the PM.

- Deep links into ChatGPT/Claude beyond copy + share sheet.
- QR handoff for phone→desktop.
- Refresh / re-pitch flow on My Pitch.
- Profile export and deletion UI (the *capability* is a constraint below; the polished
  screen is a should-have).
- More than one match per user in the demo set.

---

## 3. Explicitly out of scope

This list is as load-bearing as the requirements. Do not build these.

- **Swipe decks, infinite feeds, or any engagement loop.** The north star rules these
  out by name.
- **Public scores, follower counts, popularity rankings.**
- **Recruiting, professional networking, follower growth, or time-in-app** as product
  objectives.
- **Any storage, logging, or forwarding of raw conversation content.**
- **Reading the user's chat history ourselves.** The phone coordinates; it never
  analyzes a conversation archive.
- **Multi-round interview flows** to fill gaps when the AI lacks context.
- **Verifying identity or expertise.** Every claim is conversation-derived and
  owner-approved, never proof.
- **Native iOS/Android apps.** Mobile web only for this hackathon — see
  [`plan.md`](plan.md) § Architecture.
- **Real push notifications.** In-app notification centre for the demo; the acceptance
  criteria above are satisfied by in-app delivery.
- **Group matching, events, messaging beyond the introduction.**

---

## 4. Constraints

- Must be completable end to end on a phone.
- Must work for a user whose AI assistant has **no** integration capability — the
  copy-and-share fallback is not optional.
- Raw histories never enter PitchYourOwner; verbatim excerpts excluded by default.
- Upload authority is short-lived, single-use, write-only, and draft-only.
- Profiles support visibility control, deletion, blocking, and reporting.
- Every claim is presented as conversation-derived and owner-approved.
- Bilingual EN/繁中 for all user-facing copy.

---

## 5. Edge cases

| Case | Required behaviour |
| --- | --- |
| AI has no accessible history | Disclose the limitation; offer selected-chat or export input; never invent a profile |
| Session expires mid-flow | Clear expired-session state with a one-tap way to start a new session |
| User submits the same session twice | Second submission rejected as duplicate; first profile untouched |
| AI returns malformed or partial JSON | Fallback screen shows a specific parse error and what is missing; no partial publish |
| User edits then confirms in one reply | Edited profile is what gets submitted, not the original draft |
| Profile has zero viable matches | Honest empty state; no filler or padded matches |
| Both owners invite each other simultaneously | Resolves to one accepted introduction, not two |
| User deletes their profile | It leaves all match sets immediately, including already-surfaced ones |
| Oversized payload | Rejected before parsing, with a size-specific error |

---

## 6. Cross-cutting requirements

### Privacy and security

- The submission endpoint validates against a strict schema and **rejects unknown
  fields** rather than ignoring them.
- Tokens are stored hashed, never in plaintext.
- No secret, token, or profile body is written to application logs.
- The consent state (`owner_confirmed`) is checked server-side, never trusted from the
  client alone.

### Design and consistency

- One component library, one type scale, one spacing scale. No bespoke one-off styles.
- Four areas only: **Matches · Invitations · My Pitch · Settings**.
- The product should feel like an agent-mediated introduction, not a dating app.

### Accessibility and interaction

- Minimum 44×44px touch targets.
- Text contrast meets WCAG AA.
- Every interactive control is reachable and labelled.

### Responsive behaviour

- Designed for 375px width first. No horizontal scroll, no clipped content at 320px.
- Must be usable in mobile Safari and mobile Chrome.

---

## 7. Editorial / review gates

Copy review, bilingual polish, and deck alignment are **not** completion gates for the
engineering step they touch. Track them as open items in [`log.md`](log.md) instead of
blocking a step's status on them.

The one exception: the Step 3 consolidated-confirmation wording is a **product
requirement**, not copy. Changing it requires PM approval.

---

## 8. Success metrics

Measured across the 10–30 participant set. These do not gate the build; they are what
the demo argues.

**North star:** relevant friend matches accepted per confirmed owner pitch.
每份已確認 owner pitch 所產生的相關朋友配對接受數。

| Area | Metrics |
| --- | --- |
| Pitch quality | prompt→preview completion · confirmation rate · fields edited/removed · sensitive-data concern rate · user-rated accuracy |
| Transfer quality | direct-tool success · fallback success · median prompt→pitch-ready time · expired/duplicate session rate |
| Match quality | notification open rate · invitation send rate · mutual acceptance · conversation started · "would you have found this person otherwise?" |

### Core experiment

For each participant, build a conventional profile (broad interests + short self-written
bio) and an owner-approved PitchYourOwner profile. Show one blind match from each,
without naming the system, and ask:

1. Which person would you rather meet?｜你較想認識哪一位？
2. Does the explanation feel specific to you?｜配對說明是否讓你感覺與自己相關？
3. Would you accept an invitation now?｜你現在會接受邀請嗎？
