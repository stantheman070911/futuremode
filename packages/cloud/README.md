# PitchYourOwner cloud stack

This package is an isolated AWS implementation of the confirmed PitchYourOwner hackathon flow. It reuses VibeMate's proven infrastructure pattern without changing the `VibeMate-dev` stack.

## Product flow

1. The owner signs in with an email verification code.
2. The site gives the owner one prompt to paste into ChatGPT, Claude, or another agent.
3. The AI page extracts seven profile dimensions and asks the owner for one consolidated content confirmation.
4. On phone, the owner pastes the final JSON back into the site. The site renders editable fields, followed by a separate read-only publication review.
5. On computer, an authenticated owner may create a 24-hour, single-use upload capability and let an agent create a draft through the API. The owner still reviews and publishes on the site.
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

## Deployed hackathon environment

- App: `https://d1vuzznd4gxltu.cloudfront.net`
- API: `https://be1tnhx22c.execute-api.ap-southeast-1.amazonaws.com`
- Stack: `PitchYourOwner-hackathon`
- Region: `ap-southeast-1`

The matching schedule and matching email are disabled. Profile publication invokes matching asynchronously, and invitations are handled in-app.
