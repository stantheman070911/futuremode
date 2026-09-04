# PitchYourOwner

> **Your agent knows you. Let it pitch you.**

PitchYourOwner turns recurring patterns in a person's authorized AI conversations into an owner-reviewed pitch, then introduces two people who care about the same specific thing for the same reason right now.

PitchYourOwner 將使用者授權且 AI 確實能存取的對話脈絡，整理成經 owner 審核的介紹，再找出此刻因相同理由關心同一件具體事情的兩個人。

## Try the 90-second judge demo

Open this URL in a private window:

**https://d1vuzznd4gxltu.cloudfront.net/?demo=1**

Select **Preview seeded flow**, then walk through:

`Choose AI and language → inspect the full prompt → paste/load the synthetic pitch → edit → final review + display name → match → three-question explanation → invite`

The demo profiles and match are synthetic. They show the complete interaction without pretending that a seeded result is a live participant match.

## What is different

Conventional discovery asks a person to write a broad profile from scratch. PitchYourOwner asks an AI the person already uses to propose specific, recurring signals, then keeps the owner in control of what is transferred and published.

The match is grounded in seven profile dimensions:

- `summary`
- `interests`
- `motivations`
- `active_problems`
- `recurring_topics`
- `friend_intent`
- `history_scope`

`confidence` is owner-review metadata only. It is never public and never used for matching. A 1–40 character `display_name` is entered by the owner during final review and is not inferred by the AI.

## Phone round-trip

1. Sign in by email OTP.
2. Choose ChatGPT, Claude, or another AI and choose Traditional Chinese or English.
3. Use the primary handoff action to open the AI with the complete prompt. A visible **Copy prompt** fallback remains available.
4. The AI gives one concise synthesis, lists only specific security/privacy decisions it actually found, and waits for one batch confirmation.
5. After confirmation, the AI returns one parseable profile JSON object with no Markdown or wrapper.
6. Paste the JSON into PitchYourOwner, edit the rendered fields, then review the exact stored version.
7. Add a display name, publish, and open an explainable match.

Handoff state survives a hard reload or discarded browser tab. Returning owners with an existing pitch go to Matches; an owner with only a local draft returns to Import.

## Computer API

A signed-in owner can mint a 24-hour, single-use, write-only upload token. A computer agent can POST one draft, but it cannot publish or read profile data. On the phone, **Resume computer draft** loads the newest draft into the same edit and final-review path.

See [Computer API](docs/computer-api.md).

## Privacy boundary

Sensitive-data detection, labeling, omission, and generalization happen in the user's chosen AI before transfer. PitchYourOwner receives only the JSON the user brings back, renders every imported field, and requires a separate final publication confirmation.

The app does not claim that an assistant can read a complete account history. `history_scope` must state what was and was not accessible. Profiles are labeled conversation-derived and owner-approved, not verified identity or expertise.

## Implementation

The working stack lives in [`packages/cloud`](packages/cloud):

- static phone-first SPA on S3 + CloudFront;
- API Gateway HTTP API;
- Lambda functions for OTP, profile draft/publish/access, matching, invitations, and support;
- DynamoDB profile/match store with point-in-time recovery;
- Amazon Bedrock embeddings and match judging;
- CDK deployment in `ap-southeast-1`.

Local verification:

```sh
cd packages/cloud
npm ci
npm test
npm run build
```

## Known limits

- The long prefilled ChatGPT and Claude URLs still need a real-device matrix on iOS Safari, iOS Chrome, and Android Chrome. The visible Copy fallback is the stage-safe path if a deep link fails.
- Matching intentionally uses a scan-and-judge loop for a hackathon cohort below 50 participants. It is approximately O(n) Bedrock work per publish and O(n²) across the cohort; it is not the production-scale architecture.
- Matching email delivery and the fallback schedule are disabled in the hackathon environment. Invitations work in-app.
- Block/report, an age policy, and stronger legal copy are required before recruiting unvetted external participants. They are intentionally outside this judge-demo build.

## Product references

- [Canonical product design](docs/product-design.md)
- [V2 product memo](docs/pm/v2-product-memo.md)
- [Customer flow and page inventory](docs/pm/customer-flow-and-page-inventory.md)
- [AWS build and verification](docs/pm/aws-build-and-verification-report.md)
- [PM reading guide](docs/pm/README.md)
