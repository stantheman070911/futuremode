# PitchYourOwner — Operations & Demo Runbook

_Role: the procedure for deploying and demoing the system · governed by
[`constitution.md`](constitution.md)_

This document states the **procedure**, not the current status — for what has actually
been done, see [`log.md`](log.md).

Scope note: this is a hackathon prototype in vibe mode (constitution Law V). There is no
production, no real user data, and no backup/restore or secret-rotation procedure. If
this project ever takes real users, that changes and this document grows first.

---

## Secret handling

Applies to every step below.

- Generate each secret independently — never reuse one value across two purposes.
- Use a real generator: `openssl rand -base64 32`. A length check is not a strength check.
- Different values in local and deployed environments. A leaked local secret should cost
  nothing.
- Never place a secret in chat, a commit, shell history, a screenshot, or this document.
  Confirm presence by **variable name only**.
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only. If it ever appears in a
  `NEXT_PUBLIC_*` variable or reaches the browser bundle, that is an incident: rotate it
  and note it in log.md.

## Variables

| Variable | Source | Same value in every environment? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings — **server only** | yes |
| `UPLOAD_TOKEN_SECRET` | `openssl rand -base64 32` | **no** — different per environment |
| `NEXT_PUBLIC_APP_URL` | Vercel deployment URL | no |

Every variable is listed by name in the committed `.env.example`. Adding a variable
without adding it there is how the next person's local build breaks.

## Configuration probes

Prove a secret is *configured* without printing it.

| Probe | Configured (fail-closed) response | Misconfiguration signal |
| --- | --- | --- |
| `POST /api/submit_owner_pitch` with no token | 401 | 500 = `UPLOAD_TOKEN_SECRET` missing |
| `POST /api/submit_owner_pitch` with a used token | 409 duplicate | 200 = `used_at` not being set |
| Any page load | 200 | 500 referencing Supabase = env vars missing on Vercel |

---

## Routine release

Every deployment that changes schema or application code.

1. Run the gate locally and read the **exit status**:
   `pnpm install --frozen-lockfile && pnpm typecheck && pnpm lint && pnpm test && pnpm build`
2. If the change includes a migration:
   - A migration that only **adds** (a table, a column, an index) may proceed.
   - A migration that **alters or drops** existing data does not run against the demo
     database within 24 hours of the demo. Add a new column instead.
3. Push the branch and open a PR. Vercel builds a preview URL.
4. **Open the preview URL on a real phone**, not a resized desktop window, and walk the
   acceptance criteria for the step you changed.
5. Merge to `main`. Vercel promotes to the demo URL.
6. Re-check the critical path end to end: create session → submit → My Pitch → Matches
   → Invite. This path cannot ship broken.

## Deploying the demo database

1. `supabase db push` applies `supabase/migrations/` in order.
2. `supabase db reset` re-applies migrations **and** re-runs `supabase/seed.sql`. This
   destroys all data in the demo database — it is the right move before a demo and the
   wrong move during one.
3. After seeding, confirm the intended pairs: the two matching pairs appear and the
   broad-domain-only pair does not (brief R5.3).

---

## Demo run-of-show (P-013)

Owned by the presentation/packaging teammate, with the PM.

### Before the demo

- [ ] `supabase db reset` to a known-good seeded state, then **do not touch the database
      again**.
- [ ] Demo accounts logged in on the demo phone, browser cache warm.
- [ ] Screen recording of the full happy path saved locally as the fallback.
- [ ] Live AI call rehearsed on the venue network — this is the step most likely to fail
      in front of judges.
- [ ] Phone on Do Not Disturb; screen timeout extended; brightness up.
- [ ] The demo URL loaded and confirmed on a second device.

### The path

1. Start screen — state the promise and **"Raw chats are not uploaded."**
2. Tap **Let my agent pitch me** → show the generated prompt and the expiry.
3. Hand the prompt to a real assistant. Show the consolidated confirmation question and
   the sensitive-data list. **Confirm once.**
4. Return to the app — My Pitch is populated.
5. Matches — open one and read the three questions it answers.
6. Invite → accept from the second account → introduction.

The argument the demo makes: the pitch is *specific*, and the match can *explain itself*.
Both are visible on screen; neither needs narration.

### If the live AI call fails

Do not debug on stage. Switch to the fallback path (paste the pre-prepared confirmed
JSON into Review & Publish) and say so plainly — the fallback is a designed product
path, not a workaround, and demonstrating it is a feature.

If the app itself fails, cut to the screen recording and keep talking.

---

## Troubleshooting

### Submission returns 500

Check the Vercel function log for the request id. Most likely: a Supabase env var is
missing on Vercel (set locally but never added to the project), or the service role key
is absent. Confirm by the probe table above, not by printing values.

### Submission returns 422 with a valid-looking payload

The Zod schema is `.strict()` — an unknown field is a rejection by design. The error
names the offending field. This is correct behaviour, not a bug (brief R4.3).

### A profile publishes but never matches

Check `status` is `published`, not `draft` (brief R4.7), then check `profile_tags` was
populated — a profile row with no tag rows scores zero against everyone.

### Preview URL works, demo URL does not

Environment variables set on a preview deployment do not automatically apply to
production. A variable change does not reach a running deployment until redeploy.

## Recovery

- A stuck upload session self-recovers by expiry. The user starts a new one; there is no
  manual requeue and none is needed.
- A used session is a **terminal** state. Never manually clear `used_at` to "fix" a demo
  — create a new session instead. Clearing it defeats the single-use guarantee that the
  product is arguing for.

## Monitoring

There is no monitoring, deliberately — this is a prototype with a known audience and a
known demo window. The check that matters is step 6 of Routine release, run by a human.
