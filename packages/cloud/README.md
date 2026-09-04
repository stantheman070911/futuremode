# PitchYourOwner cloud implementation

This package contains the complete runnable application: a framework-free browser SPA,
an AWS CDK stack, Lambda handlers, contract synchronization, tests, and synthetic demo
tools.

Product behavior belongs in
[`docs/product-design.md`](../../docs/product-design.md). The canonical profile contract
is
[`config/pitchyourowner-profile-schema.json`](../../config/pitchyourowner-profile-schema.json).
This file owns engineering setup, runtime architecture, APIs, persistence, configuration,
deployment, and troubleshooting.

## Package layout

| Path | Purpose |
| --- | --- |
| `bin/pitchyourowner-cloud.ts` | CDK application entry point |
| `lib/pitchyourowner-cloud-stack.ts` | Infrastructure and Lambda wiring |
| `lib/reusable/` | Product-neutral serverless primitives; its README defines the reuse boundary |
| `functions/shared/` | Authentication, validation, HTTP, email, and DynamoDB helpers |
| `functions/*/index.ts` | API, worker, and custom-resource handlers |
| `static/` | Browser SPA and generated runtime copies of schema/prompts |
| `scripts/sync-*.mjs` | Copy canonical contracts into runtime locations |
| `scripts/demo/` | Cloud-backed synthetic fixture and smoke-test tools |
| `test/` | Node contract, filter, rate-limit, prompt, and CDK tests |
| `assets/fonts/` | Source font files and licenses copied into the website |

## Development

Requirements:

- Node.js 20 or newer. Lambda runtime is Node.js 22.
- npm.
- AWS credentials only for CDK deployment or cloud-backed demo scripts.

```bash
npm ci
npm test
npm run build
npm run synth
```

- `npm test` runs the Node test suite with `tsx`.
- `npm run build` runs strict TypeScript checking with `tsc --noEmit`.
- `npm run synth` synthesizes the CDK stack.
- There is no separate lint script.
- Both build and test run `npm run sync:contracts` first.

To run individual checks without the synchronization pre-scripts:

```bash
node --check static/app.js
npx tsc --noEmit
node --import tsx --test test/**/*.test.ts
```

### Generated contracts

Do not edit these runtime files directly:

- `config/pitchyourowner-profile-schema.json`
- `static/pitchyourowner-profile-schema.json`
- `static/owner-pitch-prompt-en.txt`
- `static/owner-pitch-prompt-zh-Hant.txt`

Their sources are the repository-level profile schema and the two files under
`docs/get_info_prompt_*.md`. Synchronize them with:

```bash
npm run sync:contracts
```

The test suite compares prompt sources and runtime copies byte for byte.

### Local UI preview

The SPA uses root-relative assets, so opening `static/index.html` through `file://` is
not a valid preview. Start a static server:

```bash
python3 -m http.server 8000 --directory static
```

Open `http://localhost:8000/?demo=1`. The local server does not provide `/v1/*`;
only the explicitly labelled seeded demo works without a deployed backend.

## Runtime architecture

```text
Browser
  │
  ▼
CloudFront distribution
  ├── default origin: private S3 bucket through origin access control
  ├── /v1/* origin: API Gateway HTTP API
  └── viewer-request function: extensionless GET routes → /index.html
           │
           ▼
Lambda handlers
  ├── verification request / confirm
  ├── profile publish / access / drafts
  ├── matching trigger / matching worker
  ├── matches and invitations
  ├── support request
  ├── optional outbox relay / email dispatch
  └── DynamoDB vector-index custom resource
           │
           ▼
DynamoDB single table + native vector index
```

CloudFront applies HTTPS redirect, HSTS, CSP, frame denial, content-type protection, and
no-referrer headers. API responses use `Cache-Control: no-store`. The S3 bucket is
private and retained; the DynamoDB table uses on-demand billing, AWS-managed encryption,
TTL, point-in-time recovery, deletion protection, and `RETAIN`.

### Request flow

1. Verification request creates the rate-limit reservations and ten-minute OTP challenge
   atomically, then sends email through Resend or SES.
2. Successful OTP confirmation deletes the challenge and creates a 30-day opaque session.
   Only the SHA-256 token hash is stored.
3. Profile publication validates the strict envelope, creates a Cohere embedding, then
   atomically writes the immutable version, current pointer, idempotency receipt, and
   archival update for the previous version.
4. The browser calls `POST /v1/matching-runs`. The trigger invokes the matching worker
   asynchronously.
5. The matching worker scans the active in-scope cohort, runs DynamoDB vector search for
   each seed, hydrates immutable profile versions, applies active-state and language
   filters, and asks Nova Pro to judge the candidates.
6. A qualifying pair is written atomically as one match, two profile pointers, response
   capability records, and optional email outbox records.
7. Each owner records one immutable invitation decision. Contact email is returned only
   after both sides accept.

Publishing and starting matching are separate requests. A published profile remains
published if the subsequent matching-trigger request fails.

## API

All responses are JSON. Owner routes require
`Authorization: Bearer <opaque-session-token>` unless noted.

| Method and path | Authentication | Behavior |
| --- | --- | --- |
| `POST /v1/email-verifications` | Public, rate-limited | Send a six-digit OTP |
| `POST /v1/email-verifications/{challengeId}/confirm` | Public | Exchange OTP for a session token |
| `POST /v1/profile-versions` | Owner session + `Idempotency-Key` | Validate, embed, and publish a profile version |
| `GET /v1/profile-versions/{versionId}` | Owning session | Read one version belonging to the owner |
| `GET /v1/profiles/me` | Owner session | Read the current profile and matching state |
| `PATCH /v1/profiles/me` | Owner session | Set `matching_state` to `active` or `paused` |
| `DELETE /v1/profiles/me` | Owner session | Delete owner data; body must contain `{"confirm":"DELETE"}` |
| `POST /v1/upload-sessions` | Owner session | Create a 24-hour, single-use draft capability |
| `POST /v1/profile-drafts` | Upload capability | Create one draft; cannot read or publish |
| `GET /v1/profile-drafts` | Owner session | List up to ten newest owner drafts |
| `GET /v1/profile-drafts/{draftId}` | Owning session | Read one owner draft |
| `POST /v1/matching-runs` | Owner session with current profile | Start the worker asynchronously |
| `GET /v1/matches` | Owner session | Read at most 24 match views |
| `GET /v1/matches/{matchId}` | Participating owner | Read one match view |
| `POST /v1/matches/{matchId}/invitations` | Participating owner | Record `invite`, `accept`, or `not_now` |
| `GET /v1/invitations` | Owner session | Group incoming, outgoing, and connected matches |
| `POST /v1/support-requests` | Public, IP-hash rate-limited | Store and forward a support request |

### Publish envelope

```json
{
  "schema": "pitchyourowner.profile-publish.v1",
  "display_name": "Ari C.",
  "profile": {
    "history_scope": "Selected recent chats were available; deleted chats were not.",
    "summary": "A concise owner pitch.",
    "interests": ["A specific recurring interest"],
    "motivations": ["Why it matters now"],
    "active_problems": ["An unresolved problem"],
    "recurring_topics": ["A recurring question"],
    "friend_intent": "The person or conversation the owner hopes to find.",
    "confidence": {
      "summary": "high",
      "interests": "high",
      "motivations": "medium",
      "active_problems": "medium",
      "recurring_topics": "medium",
      "friend_intent": "low"
    }
  },
  "locale": "en",
  "consent": {
    "approvedAt": "2026-09-04T08:00:00.000Z"
  }
}
```

The server rejects unknown fields, empty required strings, configured length/count
violations, case-insensitive duplicate array items, incomplete confidence maps,
unsupported locales, invalid approval timestamps, and changed payloads replayed under an
existing idempotency key.

### Computer draft capability

`POST /v1/upload-sessions` returns:

```json
{
  "submit_url": "https://<site>/v1/profile-drafts",
  "upload_token": "<secret>",
  "expires_at": "<ISO timestamp>",
  "expires_in_seconds": 86400,
  "capability": "single-use write-only draft creation"
}
```

The external client submits:

```http
POST <submit_url>
Authorization: Bearer <upload_token>
Content-Type: application/json
```

```json
{
  "locale": "en",
  "profile": {
    "...": "the exact configured profile object"
  }
}
```

HTTP `201` with `status: "draft"` is the only success response. The token is stored
only as a hash, expires after 24 hours, and is marked used in the same transaction that
creates the seven-day draft. It cannot read, edit, or publish. Publication always uses an
owner session after the website's final review.

## Persistence model

The single table uses `pk` and `sk` string keys.

| Partition / sort-key pattern | Entity |
| --- | --- |
| `EMAIL#<emailHash> / CHALLENGE#<id>` | OTP challenge |
| `EMAIL#<emailHash> / SESSION#<tokenHash>` | Session cleanup pointer |
| `SESSION#<tokenHash> / META` | 30-day owner session |
| `RATE#EMAIL#...`, `RATE#IP#...` | OTP cooldown and hourly reservations |
| `PROFILE#<profileId> / CURRENT` | Current version, owner email, visibility, languages, matching state |
| `PROFILE#<profileId> / VERSION#<id>` | Immutable profile, approval data, and embedding |
| `PROFILE#<profileId> / DRAFT#<id>` | Seven-day Computer API draft |
| `PROFILE#<profileId> / MATCH#<id>` | Owner-to-match pointer and cleanup keys |
| `IDEMPOTENCY#<emailHash> / <key>` | 24-hour publish receipt |
| `UPLOAD#<tokenHash> / META` | 24-hour draft capability |
| `MATCH#<matchId> / META` | Explanation, participants, scores, and 30-day expiry |
| `MATCH#<matchId> / RESPONSE#A|B` | Immutable invitation decision |
| `MATCH_TOKEN#<tokenHash> / META` | Reserved email-response capability |
| `OUTBOX#<eventId> / META` | Optional email message |
| `SUPPORT#<requestId> / META` | 90-day support request |

Profile IDs are stable hashes derived from normalized verified-email hashes. Raw session,
upload, and match-response tokens are never stored. The current browser application does
not consume `MATCH_TOKEN` records; matching email delivery is disabled.

Deleting a profile follows cleanup keys stored on its match pointers so the shared match,
both pointers, responses, tokens, and related outbox records are removed together.

## Matching behavior

The matching document includes only:

- `summary`
- `interests`
- `motivations`
- `active_problems`
- `recurring_topics`
- `friend_intent`

`history_scope` and `confidence` are excluded from embeddings, judge input, and peer
responses. Candidate retrieval uses cosine distance in the DynamoDB vector index. The
judge applies 30% interest, 25% active problem, 20% motivation, 15% recurring topic, and
10% friend-intent weighting.

The worker persists only `strong_match` decisions whose mutual score also meets
`MATCH_JUDGE_MIN_MUTUAL_SCORE`. The judge prompt defines `strong_match` as 75–100, so
the effective floor remains 75 when the model follows that contract even though the
current CDK context sets the secondary numeric threshold to 65.

Normal runs exclude test profiles. The worker intentionally scans and judges the small
active cohort and is not a production-scale retrieval pipeline.

## Authentication and rate limits

- OTP challenges expire after 10 minutes and allow at most five incorrect attempts.
- Verification requests have a 60-second per-email cooldown by default.
- Defaults allow five verification emails per email address per hour and twenty per
  hashed source IP per hour.
- Source IPs are hashed before storage.
- Owner sessions expire after 30 days.
- Support accepts 20–5,000 characters, optional contact up to 320 characters, and at most
  five requests per source-IP hash per UTC day.

The browser stores the opaque owner token in `localStorage`. This is the current
Hackathon session model, not a production cookie/CSRF architecture.

## Configuration

CDK context lives in `cdk.json`. These values are consumed by the application:

| Context key | Current default | Effect |
| --- | --- | --- |
| `environment` | `dev` | Stack ID and resource-name suffix |
| `region` | `ap-southeast-1` | Deployment region |
| `embeddingModelId` | `global.cohere.embed-v4:0` | Bedrock embedding inference profile |
| `embeddingDimensions` | `1024` | Embedding and vector-index dimensions |
| `matchJudgeModelId` | `apac.amazon.nova-pro-v1:0` | Bedrock match judge |
| `matchJudgeMinMutualScore` | `65` in `cdk.json` | Secondary persisted-match threshold |
| `emailProvider` | `resend` | `resend` or `ses` |
| `verificationEmailEnabled` | `true` | OTP delivery availability |
| `matchingEmailDeliveryEnabled` | `false` | DynamoDB-stream and SQS email consumers |
| `verificationCooldownSeconds` | `60` | Per-email resend cooldown |
| `verificationEmailHourlyLimit` | `5` | Per-email hourly reservation count |
| `verificationIpHourlyLimit` | `20` | Per-source-IP hourly reservation count |
| `matchingSchedule` | weekly cron expression | Expression only; schedule state is hard-coded `DISABLED` |
| `monthlyBudgetUsd` | `100` | Tagged AWS cost budget |

`sesDailyQuota` and `sesDailyWarningThreshold` are present in `cdk.json` but are not
read by the stack.

CloudFormation requires three deployment parameters:

| Parameter | Use |
| --- | --- |
| `SenderEmail` | Verified From address for Resend or SES |
| `ResendApiKey` | Resend secret, stored as a no-echo parameter |
| `OperationsAlertEmail` | SNS subscription and Budget notifications |

Lambda environment variables are created by CDK and should not be configured manually.
Demo scripts additionally recognize `AWS_REGION` / `AWS_DEFAULT_REGION`,
`PYO_STACK_KEY`, `PYO_STACK_ENVIRONMENT`, and `PYO_OUTPUTS_FILE`.

## Deployment

Use standard AWS credential resolution. The package's `diff` and `deploy:dev` scripts
refer to a maintainer-local AWS profile, so portable automation should call CDK directly.

```bash
npx cdk synth -c environment=hackathon -c region=ap-southeast-1

npx cdk deploy \
  -c environment=hackathon \
  -c region=ap-southeast-1 \
  --require-approval broadening \
  --outputs-file cdk-outputs-hackathon.json \
  --parameters SenderEmail=<verified-sender> \
  --parameters ResendApiKey=<resend-api-key> \
  --parameters OperationsAlertEmail=<alerts-address>
```

The stack name is `PitchYourOwner-<environment>`; resources use the isolated
`pitchyourowner-<environment>-*` prefix. Never deploy this package over another
product's stack.

The current manually deployed Hackathon environment is:

- App: <https://d1vuzznd4gxltu.cloudfront.net>
- API: <https://be1tnhx22c.execute-api.ap-southeast-1.amazonaws.com>
- Stack: `PitchYourOwner-hackathon`
- Region: `ap-southeast-1`

There is no CI/CD workflow in this repository. A successful local commit is not proof
that the manual environment contains the same static assets or Lambdas.

## Synthetic cloud verification

The fixture uses reserved `.invalid` email addresses and fixed metadata:
`isTestProfile=true`, `cleanupSafe=true`, and
`testRunId=pitchyourowner-cross-profession-demo-v1`. Normal matching excludes it.

After producing the deployment outputs file:

```bash
npm run demo:seed
npm run demo:match
npm run demo:api
npm run demo:clean
```

- `demo:seed` refuses to replace a current record unless it belongs to the same
  cleanup-safe fixture.
- `demo:match` invokes the worker with explicit test scope and exercises list, detail,
  invite, accept, and contact reveal.
- `demo:api` exercises capability creation, draft upload, replay rejection, owner read,
  reviewed publish, profile read, deletion, and exact cleanup.
- `demo:clean` deletes only records carrying all three fixture markers.

These commands call the deployed AWS environment and mutate its synthetic test records.

## Operations and troubleshooting

### Clean routes

The CloudFront function rewrites extensionless **GET** routes such as `/matches` to
`/index.html`. It intentionally does not rewrite `/v1/*` or paths containing a dot.
A `HEAD` request to a clean SPA route may receive an S3 error even when browser `GET`
works; test navigation with `GET`.

### Vector-index deployment

The native DynamoDB vector index is created by an asynchronous custom resource. The stack
explicitly grants the provider framework `lambda:GetFunction` and
`lambda:InvokeFunction` and makes the index depend on that policy to avoid a first-create
IAM race. If a deployment rolls back during Lambda or index creation, inspect the exact
retained PitchYourOwner table and bucket before cleanup; deletion protection and
`RETAIN` are intentional.

### Empty matches after publication

Publication and matching start are separate API calls. Confirm that
`POST /v1/profile-versions` succeeded, then confirm `POST /v1/matching-runs` returned
HTTP `202`. The worker runs asynchronously; the browser polls for three minutes. A
successful run can still return no matches when no candidate satisfies active state,
language compatibility, test scope, and the strong-match threshold.

### OTP delivery

Verification returns `email_delivery_disabled` when
`verificationEmailEnabled=false`. Rate-limit responses include
`retryAfterSeconds`. A provider failure can leave the atomically created challenge and
rate reservations in DynamoDB until TTL; retry behavior must still respect the cooldown.

### Contract drift

Run `npm run sync:contracts`, then `npm test`. Do not patch generated copies to make a
test pass; change the canonical schema or prompt source first.
