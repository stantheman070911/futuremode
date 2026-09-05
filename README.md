# PitchYourOwner

[![CI](https://github.com/stantheman070911/futuremode/actions/workflows/ci.yml/badge.svg)](https://github.com/stantheman070911/futuremode/actions/workflows/ci.yml)

> **Your agent knows you. Let it pitch you.**｜**你的 Agent 了解你，讓它來介紹你。**

## The problem｜問題所在

Two people can both write "photography" on every profile they have ever filled in, and
it tells you nothing. One has spent three months on low-light street work; the other
studies how a shoulder line carries emotion in a portrait. No profile field separates
them, and neither would ever find the choreographer working on the identical question
from inside a body instead of behind a lens.

Meanwhile, the AI assistant each of them talks to every day already holds that signal —
recurring questions, unsolved problems, sustained attention, evolving goals — richer
than any profile, and trapped in a chat window with no owner-controlled way out.

兩個人的個人檔案都寫著「攝影」，這個詞什麼也說明不了。一位鑽研三個月的低光街拍，
另一位在意的是肩線如何在人像中傳達情緒。任何個人檔案欄位都分不出這兩人，也永遠不會
讓他們遇到正在思考同一個問題、只是從身體而非鏡頭出發的編舞者。同時，兩人每天在聊的
AI 助理早就握有這個訊號——反覆出現的問題、尚未解決的難題、持續投入的注意力——卻被
困在聊天視窗裡，owner 沒有辦法把它帶出來。

## What we built｜我們做的事

**PitchYourOwner is agents introducing their owners to each other.** The owner's own
assistant writes the pitch and resolves privacy decisions before transfer. A deployed
judge model reads two approved profiles and explains why that pair might have something
to discuss. After mutual acceptance, one owner-triggered handoff gives the chosen
assistant both profiles and that explanation so it can draft the first message. Two
independent human approval gates remain in control: exclusion inside the owner's AI,
then explicit publication on this site.

**PitchYourOwner 讓 agents 彼此介紹自己的 owners。** Owner 自己的 AI 助理先寫 pitch，並在
傳輸前完成隱私決定；已部署的 judge model 讀取兩份經核准的介紹，說明這兩人為何可能值得
一聊；雙方都接受後，owner 再主動觸發一次 handoff，把兩份介紹與配對理由交給所選 AI
助理起草第一封訊息。過程保留兩個獨立的人工核准關卡：先在 owner 自己的 AI 中排除主題，
再於本站明確核准發布。

## Current product｜目前產品

The implemented journey is:

1. Passwordless email OTP sign-in.
2. Choose ChatGPT, Claude, or another assistant and a prompt language.
3. Open or share the complete owner-pitch prompt.
4. In the chosen AI, review a concise synthesis and the concrete potentially sensitive
   topics it found, then answer the single exclusion question once with topic numbers
   or `none`／`全部保留`. The assistant's next response is the profile JSON.
5. Paste the JSON into PitchYourOwner, then edit and explicitly publish from the
   document-style visual confirmation page.
6. Publish the profile, create its embedding, and start matching.
7. Review a match through three plain-language questions and evidence labels.
8. Invite the other owner. Contact information appears only after both owners accept.
9. From the connection view, hand both approved profiles and the match explanation to
   the chosen assistant so it can draft the first message.

The browser also contains an explicitly labelled seeded demo. It runs without an account
or backend and never represents its synthetic profiles as live users.

產品行為與 UX 契約以
[`docs/product-design.md`](docs/product-design.md) 為準。Profile 的 machine-readable
契約以
[`config/pitchyourowner-profile-schema.json`](config/pitchyourowner-profile-schema.json)
為準。

The interface is Traditional Chinese only, by deliberate scope decision. If you cannot
read Chinese, [`docs/walkthrough-en.md`](docs/walkthrough-en.md) is an annotated
English walkthrough of the full journey using real screenshots of the deployed app.

介面僅提供繁體中文，這是刻意的範圍決定。

## Results｜成果

_Real-cohort recruiting is owner-run. This section reports only what actually happened,
excluding all fixture and test profiles, and will be updated as the cohort completes._

| Metric | Value |
| --- | --- |
| Real published profiles | `[PENDING — P0-M1 cohort]` |
| Invitations sent | `[PENDING — P0-M1 cohort]` |
| Mutual connections | `[PENDING — P0-M1 cohort]` |
| Median publish-to-first-match latency | `[PENDING — Development funnel report]` |
| Explanation source (model vs. fallback) | `[PENDING — Development funnel report]` |

Separately, a September 5 live technical verification of the deployed judge processed
seven pairs: seven model explanations, zero fallbacks, 4.875 seconds median model
latency, and approximately USD 0.060 estimated judge cost for the run. These are
explanation-path measurements, not cohort outcomes or evidence of match quality. The
full method and a public-use anonymized example are in
[`docs/verification/2026-09-05-jtbd-1-model-explanations.md`](docs/verification/2026-09-05-jtbd-1-model-explanations.md).

No cohort number in this section is drawn from synthetic or fixture data. See
[`docs/round1-submission.md`](docs/round1-submission.md) for the full narrative and
[`ROADMAP.md`](ROADMAP.md) for what is next.

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
                              ├── Small-cohort field-vector ranking
                              ├── Bedrock Nova Pro judge at pair-edge write
                              │     └── strict validation → grounded fallback on failure
                              ├── Matches and mutual-consent invitations
                              └── Support requests
                                      │
                                      ▼
                         DynamoDB single-table storage
```

The AWS CDK stack also defines a provisioned native vector index, a DynamoDB-stream →
SQS → email outbox, CloudWatch alarms, an SNS operations topic, and an AWS Budget. The
current small Hackathon cohort is scanned and ranked in memory rather than queried through
that index. Invitation and connection email delivery is enabled and verified; the
fallback matching schedule remains disabled because matching starts through the
authenticated API after publication.

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
| `packages/cloud/scripts/` | Contract synchronization, synthetic demo tools, and read-only live reporting |
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
