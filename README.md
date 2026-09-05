# PitchYourOwner

> **Your agent knows you. Let it pitch you.**｜**你的 Agent 了解你，讓它來介紹你。**

PitchYourOwner is a phone-first friend-discovery application. An owner asks the AI
assistant they already use to derive a structured pitch from context that assistant can
actually access. The owner resolves any concrete security or privacy concerns in the AI,
edits the returned profile on PitchYourOwner, and explicitly approves publication.
Matching uses only the approved profile and explains why two owners may have something
specific to discuss.

PitchYourOwner 是手機優先的朋友探索應用程式。Owner 請自己已在使用的 AI 助理，從該助理
實際可存取的脈絡整理結構化介紹；先在 AI 端處理具體的安全或隱私問題，再回到
PitchYourOwner 編輯並明確核准發布。配對只使用經核准的介紹，並具體說明雙方為何值得
交談。

PitchYourOwner is not a recruiting product, dating product, public profile directory, or
engagement feed.

## Current product｜目前產品

The implemented journey is:

1. Passwordless email OTP sign-in.
2. Choose ChatGPT, Claude, or another assistant and a prompt language.
3. Open or share the complete owner-pitch prompt.
4. In the chosen AI, review a concise synthesis, resolve every detected
   security/privacy item in one reply, and request JSON with the exact confirmation
   phrase.
5. Paste the JSON into PitchYourOwner, then edit and explicitly publish from the
   document-style visual confirmation page.
6. Publish the profile, create its embedding, and start matching.
7. Review a match through three plain-language questions and evidence labels.
8. Invite the other owner. Contact information appears only after both owners accept.

The browser also contains an explicitly labelled seeded demo. It runs without an account
or backend and never represents its synthetic profiles as live users.

產品行為與 UX 契約以
[`docs/product-design.md`](docs/product-design.md) 為準。Profile 的 machine-readable
契約以
[`config/pitchyourowner-profile-schema.json`](config/pitchyourowner-profile-schema.json)
為準。

## Architecture｜系統架構

```text
Vanilla-JS mobile SPA
        │
        ▼
CloudFront
  ├── private S3 static origin
  └── same-origin /v1/* → API Gateway HTTP API
                              │
                              ├── Email OTP and hashed opaque sessions
                              ├── Profile drafts, versions, and owner controls
                              ├── Bedrock Cohere profile embeddings
                              ├── DynamoDB native vector candidate search
                              ├── Bedrock Nova Pro match judge
                              ├── Matches and mutual-consent invitations
                              └── Support requests
                                      │
                                      ▼
                         DynamoDB single-table storage
```

The AWS CDK stack also defines an optional DynamoDB-stream → SQS → email outbox,
CloudWatch alarms, an SNS operations topic, and an AWS Budget. Matching email delivery
and the fallback schedule are disabled in the current Hackathon configuration; matching
is started through the authenticated API after publication and invitations are handled
in the application.

The end user's ChatGPT, Claude, or other assistant is not called by the backend.
PitchYourOwner receives the owner-approved profile JSON, not the source conversations.

## Repository structure｜儲存庫結構

| Path | Ownership |
| --- | --- |
| `docs/product-design.md` | Current product behavior, consent boundaries, and UX constraints |
| `docs/get_info_prompt_ch.md`, `docs/get_info_prompt_en.md` | Executable owner-pitch prompt sources |
| `config/pitchyourowner-profile-schema.json` | Canonical profile field and validation configuration |
| `packages/cloud/static/` | Framework-free browser application and generated runtime contracts |
| `packages/cloud/functions/` | Lambda handlers and shared validation/authentication code |
| `packages/cloud/lib/` | CDK stack and product-neutral serverless building blocks |
| `packages/cloud/scripts/` | Contract synchronization and synthetic demo tools |
| `packages/cloud/test/` | Contract, matching-filter, rate-limit, prompt, and CDK tests |
| `packages/cloud/README.md` | Engineering, API, data-model, configuration, and deployment reference |

`docs/product-memo-v1.md` is a frozen source memo retained for provenance. It is not a
current specification.

## Local development｜本機開發

Requirements:

- Node.js 20 or newer; deployed Lambdas use Node.js 22.
- npm.
- AWS credentials only for deployment or cloud-backed demo scripts.

```bash
cd packages/cloud
npm ci
npm test
npm run build
npm run synth
```

`npm test` and `npm run build` first synchronize the canonical schema and prompts into
their runtime locations. There is no separate lint command; strict TypeScript compilation
and the test suite are the repository's automated code checks.

For a backend-free UI walkthrough:

```bash
python3 -m http.server 8000 --directory packages/cloud/static
```

Open `http://localhost:8000/?demo=1`. This server does not proxy `/v1/*`; use only the
seeded demo locally. See [`packages/cloud/README.md`](packages/cloud/README.md) for
configuration, deployment, API, persistence, and troubleshooting details.

## Deployed environment｜部署環境

- Application: <https://d1vuzznd4gxltu.cloudfront.net>
- Stack: `PitchYourOwner-hackathon`
- Region: `ap-southeast-1`

This is a manually deployed Hackathon environment, not a production service or an
automatic deployment of every repository commit. Repository HEAD remains the source for
reproducible behavior.

## Current constraints｜目前限制

- Matching has been exercised with synthetic photographer, dancer, and sound-designer
  profiles. No real 10–30-person validation cohort has been completed, so the repository
  does not claim real-user match quality.
- Matching scans the small active cohort and judges candidates per seed. Its provider
  work approaches O(n²) across a cohort and is intentionally sized for fewer than about
  50 Hackathon participants.
- Browser sessions are opaque tokens stored in `localStorage`; production use would
  require a stronger browser-session and CSRF design.
- Block, report, age-policy, and production abuse operations are not implemented.
- Matching emails and notification deep links are not active in the current deployment.
- ChatGPT and Claude prefilled links retain a visible copy fallback because cross-browser
  real-device behavior is provider- and browser-dependent.
- `/privacy` and `/terms` are concise product-boundary notices, not production legal
  documents.

## External services and assets｜外部服務與素材

- Amazon Bedrock: Cohere `embed-v4` for embeddings and Amazon Nova Pro for match judging.
- Amazon DynamoDB, Lambda, API Gateway, S3, CloudFront, SQS, SNS, CloudWatch, AWS Budgets,
  and optionally SES.
- Resend is the default OTP email provider.
- DM Sans and Noto Sans CJK font files are distributed under their included SIL Open Font
  License files in `packages/cloud/assets/fonts/`.

No source conversation history is sent to these application services. Synthetic demo
profiles use reserved `.invalid` addresses and are isolated from normal matching by
explicit test metadata.

## License

MIT — see [`LICENSE`](LICENSE).
