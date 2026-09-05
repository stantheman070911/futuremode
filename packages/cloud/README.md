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
| `scripts/report-hackathon-funnel.mjs` | Read-only live funnel and matching-path report |
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
  ├── /p/* origin: dynamic public-profile HTML
  ├── /og/* origin: dynamic 1200×630 PNG social cards
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

The native vector index is provisioned for a future retrieval path. The current
Hackathon matcher deliberately scans the small eligible cohort and ranks the field
embeddings in memory; it does not query the vector index.

CloudFront applies HTTPS redirect, HSTS, CSP, frame denial, content-type protection, and
no-referrer headers. API responses use `Cache-Control: no-store`. The S3 bucket is
private and retained; the DynamoDB table uses on-demand billing, AWS-managed encryption,
TTL, point-in-time recovery, deletion protection, and `RETAIN`.

### Request flow

1. Verification request creates the rate-limit reservations and ten-minute OTP challenge
   atomically, then sends email through Resend or SES.
2. Successful OTP confirmation deletes the challenge and creates a 30-day opaque session.
   Only the SHA-256 token hash is stored.
3. Profile publication validates the strict envelope, creates one canonical and five
   field-specific Cohere embeddings, assigns a stable public slug, then
   atomically writes the immutable version, current pointer, idempotency receipt, and
   archival update for the previous version.
4. The browser calls `POST /v1/matching-runs`. The trigger invokes the matching worker
   asynchronously.
5. The matching worker scans the small active cohort, calculates each eligible unordered
   pair once, and calls Amazon Nova Pro once for both directional explanations. Calls are
   limited to two concurrent pairs and time out after 20 seconds. Strict output validation
   accepts only the six matchable fields as evidence labels; timeout, provider, throttle,
   or shape failures persist the pair with a grounded deterministic fallback instead.
   Every edge records whether its explanation came from the model or fallback and the
   model-call latency. The stored composite remains 30% interests, 25% active problems,
   20% motivations, 15% recurring topics, and 10% friend intent.
6. Matches creates a 30-day immutable ordered result set capped at the five highest
   composite scores. Pagination is retained for a future cap change; reload, detail, and
   Back keep the result set stable, and only explicit Refresh considers a newer graph
   revision.
7. Invite transactionally creates one 14-day hashed token and one recipient outbox item.
   The public token preview is read-only. Accept creates two connection records and two
   connection-email outbox items; Not now reveals neither reason nor contact data.

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
| `PATCH /v1/profiles/me` | Owner session | Set `visibility` to `public` or `private`; matching state follows automatically |
| `DELETE /v1/profiles/me` | Owner session | Delete owner data; body must contain `{"confirm":"DELETE"}` |
| `POST /v1/upload-sessions` | Owner session | Create a 24-hour, single-use draft capability |
| `POST /v1/profile-drafts` | Upload capability | Create one draft; cannot read or publish |
| `GET /v1/profile-drafts` | Owner session | List up to ten newest owner drafts |
| `GET /v1/profile-drafts/{draftId}` | Owning session | Read one owner draft |
| `POST /v1/matching-runs` | Owner session with current profile | Start the worker asynchronously |
| `GET /v1/public-profiles/{slug}` | Public | Read the allowlisted public profile, or only `{visibility:"private"}` |
| `GET /p/{slug}` | Public | Render crawler-friendly public profile HTML or a generic private notice |
| `GET /og/{slug}` | Public | Render the generic social-card PNG (`site.png`) |
| `GET /og/profile/{slug}` | Public profile only | Render a version-checked profile social-card PNG with QR |
| `GET /v1/matches` | Public owner session | Read one stable result set capped at five candidates |
| `POST /v1/matches/refresh` | Public owner session | Reuse or replace the set according to graph revision |
| `GET /v1/matches/{matchId}` | Public owner session in the result set | Read one match detail |
| `POST /v1/matches/{matchId}/invitations` | Public owner session | Explicitly send one idempotent invitation |
| `GET /v1/invitations` | Owner session | Group incoming, outgoing, and connected matches |
| `POST /v1/invitation-tokens/preview` | Public possession token | Read invitation preview without mutation |
| `POST /v1/invitation-tokens/respond` | Public possession token | Explicitly Accept or Not now once |
| `GET /v1/connections/{connectionId}` | Connected owner session | Read only that owner's peer snapshot and peer email |
| `POST /v1/support-requests` | Public, IP-hash rate-limited | Store and forward a support request |

### Publish envelope

```json
{
  "schema": "pitchyourowner.profile-publish.v1",
  "profile": {
    "history_scope": "可使用選定的近期對話；無法使用已刪除對話。",
    "animal_persona": "追著舞台光線的銀狐",
    "summary": "精簡而具體的 owner pitch。",
    "interests": ["反覆出現的具體興趣"],
    "motivations": ["此刻為什麼重要"],
    "active_problems": ["尚未解決的具體問題"],
    "recurring_topics": ["反覆追問的主題"],
    "friend_intent": "希望認識的人或想展開的對話。",
    "confidence": {
      "summary": "high",
      "interests": "high",
      "motivations": "medium",
      "active_problems": "medium",
      "recurring_topics": "medium",
      "friend_intent": "low"
    }
  },
  "locale": "zh-Hant",
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
  "locale": "zh-Hant",
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
| `PROFILE#<profileId> / EDGE#<score>#<candidateId>` | Directed, versioned edge with persisted explanation source and model latency |
| `PROFILE#<profileId> / RESULT_SET_CURRENT` | Owner's current immutable result-set pointer |
| `IDEMPOTENCY#<emailHash> / <key>` | 24-hour publish receipt |
| `UPLOAD#<tokenHash> / META` | 24-hour draft capability |
| `PUBLIC_SLUG#<slug> / PROFILE` | Stable public-route pointer |
| `MATCHING_GRAPH / REVISION` | Eligible-cohort revision |
| `RESULT_SET#<id> / META` | Ordered candidate snapshot with 30-day expiry |
| `INVITATION#<pairId> / META` | Sender consent, recipient and state |
| `INVITE_TOKEN#<tokenHash> / META` | Hashed single-use 14-day response capability |
| `PROFILE#<profileId> / CONNECTION#<pairId>` | Owner-specific peer snapshot and exchanged contact |
| `OUTBOX#<eventId> / META` | Durable `PENDING`/`SENDING`/`SENT` email record |
| `SUPPORT#<requestId> / META` | 90-day support request |

Profile IDs are stable hashes derived from normalized verified-email hashes. Raw session,
upload, and invitation-response tokens are never stored. Matching invitation and
connection email delivery is enabled in the Hackathon stack and has been verified through
real inboxes; the scheduled fallback matching run remains disabled.

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

`history_scope`, `confidence`, and `animal_persona` are excluded from embeddings, ranking,
and public match explanations. The worker persists every eligible pair as two directed
edges with five cosine components, their weighted composite, both profile versions, a
deterministic tie-break key, and model-generated directional explanations. One strict
JSON judge call serves both directions; any judge failure persists the grounded
deterministic fallback, so matching still completes. The API retains a numeric score for
compatibility, but the signed-in browser UI never displays it. Result sets expose at most
the five highest composites with the existing deterministic tie-break.

Normal runs exclude test profiles. Production rejects `includeTestProfiles` even for a
direct Lambda invocation; only `ENVIRONMENT=e2e` accepts the explicitly scoped fixture
run. The current all-pairs pass is intentional for the small Hackathon cohort and is not
a network-scale retrieval design.

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
| `matchJudgeModelId` | `apac.amazon.nova-pro-v1:0` | Bedrock model used once per unordered pair for both directional explanations |
| `matchJudgeMinMutualScore` | Legacy setting | Retained for deploy compatibility; no public score threshold |
| `emailProvider` | `resend` | `resend` or `ses` |
| `verificationEmailEnabled` | `true` | OTP delivery availability |
| `matchingEmailDeliveryEnabled` | `true` | DynamoDB-stream and SQS invitation/connection email consumers |
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

GitHub Actions runs `npm ci`, `npm test`, and `npm run build` on every push and pull
request. Deployment remains deliberately manual: a green commit is not proof that the
Hackathon environment contains the same static assets or Lambdas.

## Read-only live funnel report

The report command reads only the exact tagged Hackathon stack and table. It separates
fixtures and isolated tests from live profiles, reports the funnel and explanation path,
and never projects raw email or token fields:

```bash
AWS_PROFILE=<profile> AWS_REGION=ap-southeast-1 npm run report:funnel -- --example
```

For a quotable real-non-team versus team split, supply the complete team addresses only
through the runtime environment. They are normalized and hashed in memory and are never
printed:

```bash
PYO_TEAM_EMAILS=<comma-separated-team-addresses> \
  AWS_PROFILE=<profile> AWS_REGION=ap-southeast-1 \
  npm run report:funnel -- --example
```

Matching reruns overwrite each edge's `calculatedAt`. The report therefore labels timing
as publish to the earliest **currently persisted** edge; after a rerun it must not be
quoted as historical first-match latency.

## Isolated cloud E2E verification

Fixture mutation is allowed only in the exact `PitchYourOwner-e2e` stack and
`pitchyourowner-e2e-profile-store` table. The seed verifies the CloudFormation
`Environment=e2e` tag and fails closed if any target or confirmation variable is absent.
It creates twelve cleanup-safe, 24-hour profiles; the three controlled addresses are read
only from environment variables and are never written to source, logs, screenshots, or
the sanitized report.

```bash
export AWS_REGION=ap-southeast-1
export PYO_E2E_STACK=PitchYourOwner-e2e
export PYO_E2E_STACK_KEY=PitchYourOwner-e2e
export PYO_E2E_ARTIFACT_FILE=/tmp/pyo-e2e-artifact.json
export PYO_TEST_RUN_ID=<unique-run-id>
export PYO_E2E_EMAIL_A=<controlled-address>
export PYO_E2E_EMAIL_B=<controlled-address>
export PYO_E2E_EMAIL_C=<controlled-address>

PYO_E2E_CONFIRM=seed-isolated-e2e npm run e2e:seed
PYO_E2E_CONFIRM=run-isolated-e2e npm run e2e:run
PYO_E2E_CONFIRM=cleanup-isolated-e2e npm run e2e:cleanup
```

The automated run covers an eleven-candidate pool capped to the deterministic top five,
stable result sets,
detail allowlists, invitation idempotency, captured styled email, preview-without-mutation,
Not now finality, Accept and two connection records/emails, owner-specific contact views,
Public/Private behavior, stable unavailable placeholders, and a deployed 1200×630 PNG.
External email delivery remains disabled. The artifact contains short-lived session tokens
and must stay mode `0600` outside the repository; cleanup deletes only records carrying
the exact run ID and `cleanupSafe=true`.

## Operations and troubleshooting

### Clean routes

The CloudFront function rewrites extensionless **GET** routes such as `/matches` to
`/index.html`. It intentionally does not rewrite `/v1/*` or paths containing a dot.
A `HEAD` request to a clean SPA route may receive an S3 error even when browser `GET`
works; test navigation with `GET`. `/p/*` and `/og/*` bypass the SPA rewrite and are
served dynamically through the API origin.

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
successful run can still return no matches when no current-version candidate satisfies
Public status, language compatibility, and test scope.

### OTP delivery

Verification returns `email_delivery_disabled` when
`verificationEmailEnabled=false`. Rate-limit responses include
`retryAfterSeconds`. A provider failure can leave the atomically created challenge and
rate reservations in DynamoDB until TTL; retry behavior must still respect the cooldown.

### Contract drift

Run `npm run sync:contracts`, then `npm test`. Do not patch generated copies to make a
test pass; change the canonical schema or prompt source first.
