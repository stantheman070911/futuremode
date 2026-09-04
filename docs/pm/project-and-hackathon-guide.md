# PitchYourOwner — Project and Hackathon Guide

This file is the persistent source of truth for agents working in this repository. Keep product work aligned with the decisions below. Treat event details as time-sensitive and re-check the official page before any submission, prize, or schedule decision.

## Communication Language

- Reply to every user question in **Traditional Chinese (繁體中文)**.
- Use another language only when the user explicitly requests it.
- Preserve source-language quotations, code, identifiers, API fields, filenames, and commands when translating them would reduce accuracy.

## Naming

- The project is **PitchYourOwner**.
- Tagline: **Your agent knows you. Let it pitch you.**
- Every user is the **owner** of an AI agent. The agent pitches its owner to another owner who may become a relevant friend.
- The repository folder is named `FutureMore`, but the event's official spelling is **FUTUREMODE** and its hackathon program is **BUILDMODE**. Do not call the official event “FutureMore.” Do not rename the repository unless the user asks.

## Official Event Facts

Research checked on **2026-09-03 (Asia/Taipei)** against the official FUTUREMODE hackathon page.

- Event: **FUTUREMODE 2026 — BUILDMODE Hackathon**.
- Venue: **Taipei Expo Dome / 台北花博爭艷館**.
- Hackathon dates: **September 4–6, 2026**.
- Expected attendance: **600+** developers, designers, creators, founders, AI builders, students, researchers, product leads, and domain experts.
- Team size: **1–5 people**. Solo participation is allowed.
- Coding experience is not required; multidisciplinary teams are encouraged.
- Application deadline was **August 29, 2026 at 10:00 PM** and the official page now says applications are closed.
- Final submission deadline: **September 6 at 11:00 AM**. Use 11:00 AM as the hard deadline; do not infer extra time from the visual agenda.
- Demo Day and awards are on **September 6**.
- The current plan requires participant check-in on all three days, although participants may come and go after checking in.
- A valid FUTUREMODE pass can be used to participate if a complimentary Builder Pass was not granted.
- There are no general restrictions on datasets or AI tools, but participants are responsible for licenses, usage rights, and commercial-use restrictions.
- The public page does **not** currently specify the exact submission form fields, repository requirements, demo length, pitch-deck format, or whether pre-existing code must be disclosed. Do not invent these requirements. Confirm them through the organizer's FAQ, onsite announcement, or submission form before final delivery.

## Track Choice

Primary target: **Track 02 — AI for Everyday Life / 日常生活 AI**.

Why:

- The track explicitly welcomes consumer apps that improve how people live and communicate.
- PitchYourOwner is a phone-first friend-discovery experience for general AI users, not only developers.
- The strongest user outcome is a relevant human relationship, which is an everyday-life benefit.

Secondary framing: **Track 01 — AI Agents & Automation / AI Agent 與自動化**.

- The agent analyzes authorized context, creates an owner pitch, checks sensitive information, and submits an approved structured profile.
- Use this framing only if the implementation demonstrates a real agent/tool workflow rather than a single prompt wrapped in an app.

Do not position the project primarily as Future of Work, recruiting, professional networking, or a developer-only tool. Do not add blockchain, voice, or other sponsor technology merely to chase a bounty unless it strengthens the core experience.

## Judging Criteria and Required Evidence

The official criteria are innovation, technical execution, product vision, real-world impact, user experience, and effective sponsor-technology use where applicable. Build the demo and pitch to supply evidence for each criterion.

| Criterion | PitchYourOwner evidence |
| --- | --- |
| Innovation | An AI agent turns authorized conversation patterns into an owner-approved pitch and uses it to find a relevant friend. The profile is behavior-grounded rather than written from a blank form. |
| Technical execution | Show a live phone-completable flow: prompt handoff, structured extraction, specific security/privacy decisions and confirmation in the AI, JSON paste/edit, final publish review, match computation, notification, and invitation. |
| Product vision | A future network in which agents recognize when their owners should meet, while owners retain control over identity and consent. |
| Real-world impact | Help people from different fields find each other through shared interests, motivations, active problems, and recurring questions. |
| User experience | Reach a complete pitch quickly, ask only concrete security/privacy decisions in one batch, explain every match, and avoid an infinite feed. |
| Sponsor technology | If using OpenAI, demonstrate grounded structured extraction and an honest context boundary. Do not add MCP merely for sponsor framing; the Hackathon scope uses phone paste-back plus an optional HTTP draft API. |

The presentation must make the differentiation precise:

> Conventional discovery asks people to declare broad interests. PitchYourOwner asks an authorized AI agent to propose a specific pitch from recurring conversation patterns, then lets the owner review and confirm it once.

Do not claim this is the first product of its kind or that no competitor exists unless a current, sourced competitive review supports the claim.

## Product Goal

The hackathon question is:

> Can an AI agent pitch its owner well enough to produce a friend match that feels more relevant than a conventional self-written profile?

Match people who have one or more of these signals:

1. the same specific interest;
2. the same motivation;
3. the same active problem;
4. the same recurring discussion topic.

The primary use case is **friend finding**. Complementary expertise can enrich an explanation, but it is not the main matching objective.

## Product Non-Goals

- Do not turn the MVP into LinkedIn, recruiting, dating, a follower network, or a public content feed.
- Do not optimize for endless browsing, daily streaks, or time spent in the app.
- Cold start and long-term retention are not the core hackathon questions.
- Do not require a desktop computer. A participant must be able to complete the demonstrated flow on a phone.
- Do not depend on a permanent VM for every subscriber.
- Do not use multi-round onboarding or a long interview to generate the initial profile.

## Required Phone Workflow

1. The user completes email OTP sign-in on the PitchYourOwner website.
2. The website creates a prompt for the user's chosen AI.
3. One primary handoff action carries the complete prompt into the chosen assistant and opens it. For ChatGPT, the site uses a prefilled deep link and also attempts to copy the prompt as a fallback. A visible secondary **Copy prompt** action remains available for long-URL, permission, and in-app-browser failures; users do not have to press it before the primary action. Other assistants use the same primary handoff where supported, with the same visible copy fallback.
4. The assistant analyzes only history, memory, selected chats, exports, or workspace sessions that the user authorized and the assistant can actually access.
5. The assistant shows a concise synthesis rather than expanding every schema field, scans the proposed transfer for security/privacy concerns, and asks only the specific concerns it actually found. Every concern has an `S1`, `S2`, ... identifier, a concrete risk, and directly selectable handling options. It never asks whether the profile matches the user's chat history or any general/open profile question.
6. The owner answers every listed security/privacy item in one message and adds the exact confirmation phrase **CONFIRM SECURITY AND GENERATE JSON／確認安全並產生 JSON**. When nothing requires a decision, the assistant states that explicitly and requests only the same security confirmation. This is not a multi-round profile interview or a line-by-line review.
7. Only after every listed risk decision and exact security confirmation does the assistant return one parseable profile JSON object with no prose or Markdown. The phone user pastes it into the website.
8. The website renders an editable field form. Continue/Enter opens a separate read-only final review; rejecting it returns to the edit form, while confirming publishes the profile.
9. The app immediately computes explainable friend matches and can send a strong-match notification or mutual invitation.

Never assume that an AI assistant can read a user's complete account history. The generated profile must disclose `history_scope`. When context is insufficient, use selected chats or an export and say so. Never fabricate missing history.

## Review and Consent Contract

The AI must not run a multi-round questionnaire, ask the owner to inspect every profile field line by line, or ask whether the profile matches the user's chat history. It first shows a concise overall synthesis, then lists only security/privacy concerns actually found in the proposed transfer. The website provides editable fields and a separate final publish review because the owner must see exactly what PitchYourOwner will store.

Every detected concern must be specific and decision-ready:

- identify it as `S1`, `S2`, ...;
- name the risk type and affected profile area without repeating the raw sensitive value;
- offer explicit actions such as **remove**, **replace with the shown safe abstraction**, or—only where reasonably safe—**keep with an explicit authorization acknowledgment**;
- require all selections in one owner response ending with **CONFIRM SECURITY AND GENERATE JSON／確認安全並產生 JSON**.

Authentication secrets and system-control material can only be removed. Third-party or organizational confidential material cannot offer a keep-original option when sharing authority is unknown. If no issue requires a decision, the AI must say so explicitly and ask only for the exact security confirmation phrase. Generic questions such as “Is there anything sensitive?” or “Does this look accurate?” are forbidden.

Rules:

- Silence, ambiguity, unanswered risk identifiers, forbidden choices, or the missing exact security confirmation phrase do not authorize transfer from the AI chat.
- The first response is human-readable and concise. After exact confirmation, the next response is JSON only, with no code fence, preface, or closing text.
- Sensitive-data detection, labeling, omission, and generalization happen on the AI chat page. PitchYourOwner does not repeat that processing.
- The website import page is editable; the next page is a read-only final review with explicit **Confirm & upload** and **Back to edit** actions.
- The site never assumes that AI-chat confirmation alone authorizes publication.
- Never set a hidden consent flag on the user's behalf.

## Profile Schema

The MVP profile should contain only:

```json
{
  "summary": "Short owner pitch",
  "interests": [],
  "motivations": [],
  "active_problems": [],
  "recurring_topics": [],
  "friend_intent": "What kind of friend or conversation is wanted",
  "history_scope": "What the assistant could and could not inspect",
  "confidence": {}
}
```

The seven core fields originate in the pulled repository's executable extraction prompts. `confidence` is retained as configurable review metadata and is enabled and required in the Hackathon profile contract. It is not an eighth public profile dimension. The machine-readable contract is `config/pitchyourowner-profile-schema.json`; derive prompt, UI, and API validation from it rather than duplicating field rules. Confidence is visible only to the owner during review, qualitative (`high`, `medium`, `low`), never public, and never used as a matching signal or weight.

## Confirmed Product Design Direction — 2026-09-04

The Host Owner completed all five visual/product decisions. These choices are requirements for the next prototype and implementation plan; older alternatives remain research references only.

1. **Confidence:** retain it as owner-review-only metadata. Do not publish it or use it in matching.
2. **Start — 1b, Typographic promise:** lead with the product promise and preview both owner-review checkpoints.
3. **Handoff — 1d, Prompt is the object:** show the complete prompt as the primary object, with a clear copy/open/return path and no unobservable cross-app live status.
4. **My Pitch — 1f, Document fields:** use the complete document-style field layout and move `history_scope` to the top. Show qualitative confidence beside the fields only during owner review.
5. **Match detail — 1h, Three questions:** answer the three explanation questions in narrative form and add evidence labels that name the supporting profile fields. Do not show confidence or a numeric match score.

Exclude `omitted_sensitive_data`. Mark claims as **conversation-derived**, **owner-approved**, and **currently exploring**, not as verified expertise or verified proof of identity.

## Upload Architecture

Preferred Hackathon architecture: universal phone paste-back, plus a narrow HTTP API for computer users. Do not build WebMCP or Remote MCP for this version.

### Primary phone path

`Email OTP → prompt goes to AI → AI creates a concise preview and specific security/privacy decisions → owner resolves every listed item and confirms security → final JSON → paste into site → editable fields → read-only final review → confirm and upload → immediate matching`

The website must:

- parse only the configured profile schema;
- render all fields with a title, label, and editable control;
- preserve edits when returning from final review;
- reject missing, malformed, unknown, duplicate, or oversized content without partially publishing;
- never run sensitive-data detection, filtering, or a privacy ledger after the JSON reaches PitchYourOwner.

### Computer API path

Computer users or their agent may POST the final schema directly with a random, single-use, write-only token that expires after 24 hours. The POST creates a draft only and cannot bypass the website's final publish review. The capability cannot read profiles, list users, or change settings.

Do not add a WebMCP or Remote MCP surface to the Hackathon scope. A normal authenticated HTTP POST is sufficient for computer users.

## Matching and Explanation

Use this initial, testable weighting:

- 30% specific-interest overlap;
- 25% active-problem overlap;
- 20% motivation alignment;
- 15% recurring-topic overlap;
- 10% friend intent and practical compatibility.

Language, age/safety rules, visibility, location preference, and availability are filters, not popularity signals.

Every match explanation must answer:

1. What do these owners care about in common?
2. Why does it matter to both of them?
3. What could they discuss now?

Do not expose an opaque public compatibility percentage.

## Notifications and Invitations

Notifications are a re-entry mechanism, not the core product loop.

- **Pitch ready:** “Your agent finished your pitch. Review complete—matching has started.”
- **Strong match:** “Your agent found another owner. You both keep discussing [generalized topic].”
- **Invitation:** “Another owner's agent thinks you should meet.”

Keep lock-screen text general. Put specific or potentially sensitive match reasoning behind the app's authenticated view. Connections require mutual acceptance. Offer **Accept** and **Not now**; do not reveal a private rejection reason to the sender.

## Privacy and Safety Requirements

- The generated prompt instructs the chosen AI to identify, label, omit, or generalize sensitive content and show the result to the owner before transfer.
- PitchYourOwner does not detect, filter, transform, label, or keep a ledger of sensitive data after the user transfers the confirmed JSON.
- Provide profile visibility control, deletion, block, report, and rate limits.
- Require mutual consent before direct contact.
- Do not represent inferred interests as psychological truth.
- Store the minimum audit record needed to prove which profile version the owner approved.

## Hackathon MVP and Demo

Build these six capabilities before secondary features:

1. phone prompt handoff;
2. structured owner-pitch generation;
3. exhaustive sensitive-data scanning and one consolidated batch of concrete security/privacy decisions on the AI page;
4. website JSON paste, editable fields, final review, and publish;
5. explainable friend matching;
6. strong-match notification plus mutual invitation.

Recommended demo story:

1. A dancer opens PitchYourOwner on a phone.
2. The app hands a prompt to the dancer's AI assistant.
3. The assistant proposes a concise pitch preview and lists only the specific security/privacy concerns it found, each with explicit options.
4. The dancer resolves every listed concern, confirms security in ChatGPT, and copies the final JSON.
5. The dancer pastes it into PitchYourOwner, reviews the rendered fields, and confirms publication.
6. The system finds a portrait photographer who repeatedly explores the same relationship between subtle body movement and emotional expression.
7. The app explains the shared interest, motivation, and problem.
8. One owner sends an invitation; the other accepts; the app proposes a conversation starter.

Keep a seeded fallback dataset and recorded demo path in case provider history access, venue Wi-Fi, deep links, push notifications, or tool calling fail during judging. Clearly label simulated components; do not pretend a mock is live.

## Validation Plan

Use approximately **10–30 pre-recruited AI users** across several interests. This is enough for the hackathon test; network-scale cold start is out of scope.

Compare two blinded profiles/matches:

- Control: broad interests plus a short self-written bio.
- PitchYourOwner: agent-derived interests, motivations, problems, and recurring topics, approved once.

Measure:

- which person the participant would rather meet;
- whether the explanation feels specific and accurate;
- AI-page content-confirmation, site-edit, final-review, and publish completion rates;
- paste/import, edit, review, and publish completion rates;
- invitation send and mutual-acceptance rates;
- whether a conversation starts;
- whether the participant would have found that person otherwise.

North Star for the hackathon: **relevant friend matches accepted per confirmed owner pitch**.

## Event Prizes Relevant to Planning

The official page currently lists:

- FUTUREMODE overall: **US$3,000 / US$2,000 / US$1,000** for first/second/third.
- OpenAI, available to all participants according to the page: **US$100 API credits per participant**, **one month of ChatGPT/Codex Pro per participant**, and **US$50,000 total in credit prizes for the overall top three**.
- ElevenLabs for Track 02: **110k credits per participant** and **1.1m credits for the top three**; participant name and email must be provided 48 hours before the event for the coupon according to the page.

Prize and sponsor details may change. Re-check the official page and onsite bounty announcement before selecting sponsor-specific work. Do not introduce voice solely for ElevenLabs eligibility unless voice improves the core friend-introduction experience.

## Submission Readiness Checklist

- Confirm the official submission form, required fields, demo duration, repository/video/deck requirements, and IP/pre-existing-code rules.
- Confirm Track 02 selection and whether a second track or sponsor bounty may be entered.
- Ensure every team member has a valid pass and completes required daily check-in.
- Finish the working end-to-end path before polishing speculative screens.
- Test the entire phone flow on venue-like mobile networking.
- Prepare a seeded offline/failure-safe demo.
- Prepare a one-sentence problem, one-sentence novelty, live demo, architecture diagram, privacy explanation, validation result, and clear ask.
- Preserve source and dataset licenses.
- Do not include real credentials, private histories, or unapproved personal data in the demo.
- Re-check the **11:00 AM, September 6** submission deadline onsite.

## Repository Map

This GitHub PM reading-pack copy uses the following browsable paths. Local Oysterun
website and artifact paths mentioned elsewhere in historical reports describe the
original working environment and may not exist in this repository.

- PM reading-pack index: `docs/pm/README.md`
- Current PitchYourOwner V2 memo: `docs/pm/v2-product-memo.md`
- Canonical product design: `docs/product-design.md`
- AWS integration decision report: `docs/pm/aws-integration-decision-report.md`
- Cross-persona corrected experiment: `docs/pm/cross-persona-corrected-experiment.md`
- AWS build and verification report: `docs/pm/aws-build-and-verification-report.md`
- Computer API: `docs/computer-api.md`
- Oysterun website root: `.oysterun/site/`
- Current site post: `.oysterun/site/posts/vibesafari-v2/index.html`
- Current public route: `/sites/futuremore/posts/vibesafari-v2/`
- Current decision post: `.oysterun/site/posts/pitchyourowner-two-decisions/index.html`
- Current decision route: `/sites/futuremore/posts/pitchyourowner-two-decisions/`
- Designer/PM extraction playbook: `.oysterun/site/posts/profile-extraction-design-playbook/index.html`
- Designer/PM playbook route: `/sites/futuremore/posts/profile-extraction-design-playbook/`
- Configurable profile contract: `config/pitchyourowner-profile-schema.json`
- AWS implementation: `futuremode-repo/packages/cloud/`
- AWS build and verification report: `prompts/2026-09-04_001_pitchyourowner-pairing-stack-build-report.md`
- Deployed Hackathon app: `https://d1vuzznd4gxltu.cloudfront.net`
- Deployed stack: `PitchYourOwner-hackathon` in `ap-southeast-1`

The legacy memo filename and website slug still contain `vibesafari`. Treat the document title and visible product name, **PitchYourOwner**, as authoritative. Do not rename or remove existing routes without checking inbound links and asking when the change could break them.

## Sources

Official sources checked on 2026-09-03:

1. FUTUREMODE, **Hackathon — FUTUREMODE**: https://www.futuremode.xyz/hackathon
   - Source for dates, venue, attendance, team size, tracks, schedule, judging criteria, FAQ, participation rules, prizes, and sponsors.
2. OpenAI, **MCP and Connectors | OpenAI API**: https://developers.openai.com/api/docs/guides/tools-connectors-mcp
   - Historical exploration source for remote MCP support and security guidance. Remote MCP and WebMCP are now outside the Hackathon MVP.

When event facts conflict with this file, the latest organizer announcement and onsite instructions win. Record material updates here with the source and date checked.
