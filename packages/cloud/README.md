# PitchYourOwner cloud stack

This package is an isolated AWS implementation of the confirmed PitchYourOwner hackathon flow. It reuses VibeMate's proven infrastructure pattern without changing the `VibeMate-dev` stack.

## Product flow

1. The owner signs in with an email verification code.
2. The owner chooses ChatGPT, Claude, or another assistant plus Traditional Chinese or English. One primary handoff action carries the matching prompt into the AI and opens it; a visible **Copy prompt** fallback remains available when a deep link or clipboard permission fails.
3. The AI page extracts seven profile dimensions and asks the owner for one consolidated content confirmation.
4. On phone, the owner pastes the final JSON back into the site. The site renders editable fields, followed by a separate read-only publication review where the owner adds a 1–40 character display name outside the agent-derived profile.
5. On computer, an authenticated owner may create a 24-hour, single-use upload capability and let an agent create a draft through the API. **Resume computer draft** loads it into the same edit and final-review path.
6. Publishing creates an embedding and starts matching. Match pages explain three questions and require mutual invitation acceptance before contact details are revealed.

`confidence` is stored for owner review only. It is excluded from matching and peer-facing responses. `history_scope` is visible to the owner but is also excluded from matching and peer-facing responses.

## Development

```sh
npm ci
npm run build
npm test
npx cdk synth
```

Deploy only to an isolated `PitchYourOwner-*` stack. The Hackathon environment uses `PitchYourOwner-hackathon`; required secret parameters must be supplied at deployment time and must never be committed.

## Cross-profession matching fixture

The demo fixture contains synthetic photographer, dancer, and sound-designer profiles. These records are tagged `isTestProfile`, `cleanupSafe`, and a fixed test run ID, so production matching excludes them.

```sh
AWS_PROFILE=screenmark-root-bootstrap npm run demo:seed
AWS_PROFILE=screenmark-root-bootstrap npm run demo:match
AWS_PROFILE=screenmark-root-bootstrap npm run demo:api
AWS_PROFILE=screenmark-root-bootstrap npm run demo:clean
```

The seed command refuses to overwrite any record that is not explicitly marked as the same cleanup-safe test run.

`demo:api` verifies the 24-hour single-use draft capability, replay rejection, owner draft read, reviewed publish, profile read, and exact cleanup without printing tokens or real email addresses.

## Judge-ready seeded demo

Open the deployed app in a private window with the explicit demo flag:

`https://d1vuzznd4gxltu.cloudfront.net/?demo=1`

Select **Preview seeded flow** to complete `/assistant → /handoff → /import → /review → /matches → match detail → invite` without email, an account, or an external AI. The profiles and match are synthetic and the UI labels this as a seeded preview; it must not be presented as a live participant match.

## Known limits

- Real-device support for the long prefilled ChatGPT and Claude URLs remains to be verified on iOS Safari, iOS Chrome, and Android Chrome. The app therefore keeps a visible Copy fallback.
- Matching intentionally scans the small active cohort and asks Bedrock to judge candidates per publish. This is approximately O(n) provider work per publish and O(n²) across a full cohort, which is acceptable for the hackathon target of fewer than 50 participants and is not a production-scale design.
- Matching email delivery is disabled in the hackathon environment; invitations are handled in-app.

## Deployed hackathon environment

- App: `https://d1vuzznd4gxltu.cloudfront.net`
- API: `https://be1tnhx22c.execute-api.ap-southeast-1.amazonaws.com`
- Stack: `PitchYourOwner-hackathon`
- Region: `ap-southeast-1`

The matching schedule and matching email are disabled. Profile publication invokes matching asynchronously, and invitations are handled in-app.
