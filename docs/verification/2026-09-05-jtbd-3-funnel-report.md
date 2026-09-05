# JTBD-3 — Live funnel report verification

Date: 2026-09-05  
Stack: `PitchYourOwner-hackathon`  
Table: `pitchyourowner-hackathon-profile-store`  
Implementation status: complete  
Evidence status: conditional on cohort classification and timestamp limitations below

## What shipped

`packages/cloud/scripts/report-hackathon-funnel.mjs` is a read-only DynamoDB report that:

- refuses to read any stack or table other than the exact tagged hackathon deployment;
- separates private fixtures and isolated test profiles from live profiles;
- separates team and real non-team profiles when `PYO_TEAM_EMAILS` is supplied;
- reports the requested funnel, unique-pair explanation path split, and timing percentiles;
- optionally prints only two animal personas and the three explanation answers;
- projects no raw email or token fields, hashes the runtime team allowlist in memory, and redacts any email-shaped text in the optional example.

Run it from `packages/cloud`:

```sh
AWS_PROFILE=<profile> AWS_REGION=ap-southeast-1 npm run report:funnel -- --example
```

For a quotable real-versus-team split, provide the complete team allowlist at runtime without committing it:

```sh
PYO_TEAM_EMAILS=<comma-separated-team-addresses> AWS_PROFILE=<profile> AWS_REGION=ap-southeast-1 npm run report:funnel -- --example
```

The report never prints the supplied addresses.

## Live result at verification time

No team allowlist was available, so the script deliberately withheld the real-versus-team split rather than guessing.

| Metric | Real non-team | Team | Private fixture | Isolated test | Unclassified live |
| --- | ---: | ---: | ---: | ---: | ---: |
| Profiles published | 0 | 0 | 3 | 0 | 5 |
| Invitations sent | 0 | 0 | 2 | 0 | 2 |
| Invitations accepted | 0 | 0 | 0 | 0 | 2 |
| Invitations declined | 0 | 0 | 0 | 0 | 0 |
| Mutual connections formed | 0 | 0 | 0 | 0 | 2 |
| Distinct owners with a connection | 0 | 0 | 0 | 0 | 3 |

| Explanation path | Real non-team | Team | Private fixture | Isolated test | Unclassified live |
| --- | ---: | ---: | ---: | ---: | ---: |
| Model pairs | 0 | 0 | 3 | 0 | 4 |
| Fallback pairs | 0 | 0 | 0 | 0 | 0 |

For the JTBD-1 selected owner specifically, the seven candidates comprise:

- 3 private fixtures;
- 0 isolated test profiles;
- 4 non-fixture live profiles whose team status is not persisted.

Therefore the requested “real non-team humans versus team accounts” split is not derivable from the table alone. A complete runtime team allowlist is required before Marketing quotes that split.

## Manual reconciliation

A separate read-only spot check sampled two owners with connection records. Both had a corresponding connected invitation and the reciprocal connection record:

```json
{"owners_spot_checked":2,"owners_reconciled":2,"identifiers_printed":false}
```

The live report printed no email addresses, session tokens, upload tokens, or invitation tokens. `npm test` passed 53/53 and `npm run build` passed.

## Timing limitation discovered

The brief asks for profile-publish to **first** edge-write latency from existing timestamps. The current edge `Put` overwrites `SIMILARITY_EDGE.calculatedAt` on every matching rerun and persists no separate first-write timestamp. Historical first-edge latency therefore cannot be reconstructed after a rerun.

The script reports publish to the earliest **currently persisted** edge and prints a warning directly beneath the table. At verification time the unclassified-live proxy was median 4,386.962 seconds and p90 5,951.857 seconds; these values were inflated by the JTBD-1 rerun and must not be quoted as first-match latency.

Persisting a true first-write timestamp or event would resolve this, but the JTBD explicitly forbids new persisted counters or an event pipeline. No persistence change was made.

## Fixture-only acceptance

Classification is test-first and fixture-second; neither category can enter the real-user bucket. Consequently a table containing only fixture rows reports zero in the real-user section. The live table itself is mixed, so an isolated AWS fixture-only table was not created merely for this check.
