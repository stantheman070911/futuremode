# Gemini profile image operations

This runbook records the approved secret-handling, generation, versioning, and image-delivery rules for profile mascots. The engineering architecture and deployment commands remain canonical in [`packages/cloud/README.md`](../../packages/cloud/README.md).

## Approved product behavior

- Use `gemini-3.1-flash-lite-image` for profile mascot generation.
- Do not expose a **regenerate image** action.
- A missing, pending, or failed image always renders the standard placeholder. Image generation must never block profile publication, matching, invitations, or contact exchange.
- For each owner email, generate an image only for the latest published profile version referenced by `PROFILE#<profileId> / CURRENT`.
- Do not backfill archived profile versions. If a newer profile version is published, only that new current version is eligible for generation.
- A generation job must re-check the current `versionId` before writing its result. A late result for an older version is discarded and must not replace the current image.

## Secret source and repository policy

The current workstation has a Gemini API key in the separately maintained `AudioGeneration/config.json`, under `GEMINI_CONFIG.API_KEY`. As explicitly requested by the Host Owner, a local copy exists at `futuremode-repo/.secrets/gemini-config.json`. The complete `.secrets/` directory is ignored by Git and the copied file has mode `600`; it is local runtime input, not source-controlled project content.

Never put the key in source code, CDK context, a committed `.env` file, CloudFormation parameters, build output, logs, or a Lambda environment variable. This repository ignores `.env`, `.env.*`, and `.secrets/` as an additional guard, but ignore rules are not a substitute for AWS secret storage.

## Store the key for Lambda

Use AWS Secrets Manager in the same account and region as the Hackathon stack:

- Region: `ap-southeast-1`
- Recommended secret name: `pitchyourowner/hackathon/gemini-image-api-key`
- Secret value: the raw value of `GEMINI_CONFIG.API_KEY`

Create or update the secret from the AWS console or the repository's local one-time script. The script reads the ignored local config and sends the value directly through the AWS SDK without printing it. After creation, verify only the secret name, ARN, and `LastChangedDate`; never retrieve the value into logs as a verification step.

From `packages/cloud`, preview and then apply the repository script:

```bash
npm run images:secret
npm run images:secret -- --apply
```

The script reads `.secrets/gemini-config.json` by default and never prints the key.

CDK should import the secret by name, grant `secretsmanager:GetSecretValue` only to the image-worker Lambda, and pass only the secret ARN through an environment variable such as `GEMINI_IMAGE_SECRET_ARN`. The secret value itself must not be placed in the Lambda configuration.

At runtime, the image worker should:

1. Read `GEMINI_IMAGE_SECRET_ARN`.
2. Call `GetSecretValue` through the AWS SDK.
3. Cache the resulting key in module memory for warm invocations.
4. Use it only for the Gemini request.
5. Never log the key, request authorization headers, raw provider response, or the complete owner profile.

Rotating the secret updates Secrets Manager without requiring a code change. A warm Lambda may keep the previous key briefly; invalidate the module cache on an authentication error and retry once with a fresh secret read.

## Latest-profile generation and backfill

The backfill input is the set of current profile pointers, not every `VERSION#...` item:

1. Read each `PROFILE#<profileId> / CURRENT` item once.
2. Resolve its current `versionId` and current published profile.
3. Skip records that already have a ready image for the same profile version and generation-source hash.
4. Enqueue one idempotent job keyed by `profileId + versionId + sourceHash`.
5. Immediately before saving, confirm that `CURRENT.versionId` still equals the job's `versionId`.
6. Save image metadata against that current version. Never generate or surface an image for an archived version.

The source sent to Gemini must contain only owner-approved public profile fields needed to convey the animal persona and professional character. It must exclude email, `history_scope`, confidence metadata, tokens, IDs, and session data.

## Image processing and traffic budget

Compression is required. The current `gemini-3.1-flash-lite-image` comparison output is a 1024×1024 JPEG of 241,679 bytes (about 236 KiB). Loading ten originals on one matching page transfers about 2.42 MB before HTTP overhead; 1,000 such original-image loads transfer about 242 MB. That is unnecessarily expensive for a phone-first list.

After validating and decoding the provider image, create and store these derivatives:

| Use | Output | Initial target |
| --- | --- | --- |
| Match list and compact cards | 192×192 WebP | 15–40 KB |
| Profile detail, invitation, and connection pages | 768×768 WebP | 50–120 KB |
| Social sharing card | Existing 1200×630 composed asset | Generated separately and cached |

Use `sharp` with metadata removed. Start with WebP quality 82–85 for the thumbnail and 85–88 for the detail image, then verify the black line work visually. Compare lossy and lossless WebP on representative mascots because sparse monochrome drawings may compress better losslessly. Do not load the 1024×1024 provider original in matching lists.

The deployed worker uses `gemini-3.5-flash-lite` as a low-cost vision quality gate. It rejects readable text or text-like marks, meaningful color, and anything other than one depicted animal. A new profile can be generated up to three times before the image is marked failed and the UI continues to show its placeholder. When an operator replaces a previously ready image, a rejected replacement leaves the old ready image in place.

The first six production backfill images were materially smaller than the initial budget: thumbnails were 2.8–4.5 KB and detail images were 18.6–34.6 KB. Keep the larger initial targets above as guardrails, and monitor real outputs rather than inflating image quality or dimensions merely to approach them.

Store image objects in a private S3 bucket behind the application's authorized/public-profile delivery path. Use immutable keys containing `profileId`, `versionId`, and content hash, plus long-lived cache headers. Public delivery must still respect the current profile visibility state; a previously cached image URL must not reveal a profile after it becomes private.

## Deployment verification

- Confirm the repository contains no API-key value or copied `config.json`.
- Confirm only the image-worker role can read the Gemini secret.
- Confirm Lambda configuration exposes only the secret ARN.
- Publish a profile without an image and verify the placeholder appears immediately.
- Complete one current-version job and verify the thumbnail and detail derivative render.
- Publish a newer version while an older job is running and verify the older result is discarded.
- Make the profile private and verify its image is no longer publicly retrievable through the app route.
- Verify there is no regenerate control in owner, public, match, invitation, or connection UI.
