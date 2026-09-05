# JTBD-1 verification — model-generated match explanations

> **Historical experiment.** This path was removed from active matching on 2026-09-06.
> Current matching uses stored field embeddings and deterministic field evidence only.

Date: 2026-09-05  
Implementation commits: `e70a99d`, `4070078`  
Deployed stack: `PitchYourOwner-hackathon` in `ap-southeast-1`

## Outcome

The matching worker now calls the configured Amazon Nova Pro judge once per unordered
pair at edge-write time. The one response contains both directional explanations. The
strictly validated result, its `model` or `fallback` source, and model latency are stored
on each directional edge. The match list and detail read paths were not changed.

The request contains only `summary`, `interests`, `motivations`, `active_problems`,
`recurring_topics`, and `friend_intent`. It does not add history scope, confidence,
animal persona, email, hashes, profile/version identifiers, or other record metadata.

## Live run

The final live verification invoked `pitchyourowner-hackathon-matching-run` for one real
owner against the currently visible cohort.

| Measure | Result |
| --- | ---: |
| Profiles visible to the run | 8 |
| Seed owners | 1 |
| Unordered pairs written | 7 |
| Model explanations | 7 |
| Fallback explanations | 0 |
| Whole-run wall time | 19,495 ms |
| Per-model-call latency | 4,030–5,552 ms |
| Median model latency | 4,875 ms |
| p90 model latency (nearest rank) | 5,552 ms |

Three matches for the same owner were inspected. Their nine answer strings were all
unique, every evidence label was one of the six allowed matchable fields, and none used
the forbidden first-person/name pattern found during the first live pass. The first live
pass also produced 7/7 model explanations, but exposed wording weaknesses; commit
`4070078` tightened the prompt before this final run.

## Failure behavior

The automated test simulates a judge throttle. The worker catches the failure, creates
both directional deterministic explanations, persists both edges with
`explanationSource=fallback` and latency, and reports the fallback result. The fallback
claims a shared subject only after an exact overlap; otherwise it names both owners'
different subjects and says that no verbatim shared topic was found.

## Contract and build evidence

- `npm test`: 53/53 passed.
- `npm run build`: passed.
- Hackathon `npm run synth`: passed.
- CloudFormation update: completed successfully.
- A prompt-contract test checks that only the six matchable fields enter the model
  request and that owner-only/public-presentation metadata and record identifiers do not.
- Strict parsing rejects unknown top-level/directional fields and evidence labels outside
  the six allowed field names.
- A success-path test proves one judge call writes two different directional narratives.
- No files under `packages/cloud/functions/pairing/` or `packages/cloud/static/` changed,
  so model work is absent from the read path. This is structural latency evidence rather
  than a before/after API benchmark.

## Estimated judge cost

AWS Price List API prices for Nova Pro standard inference in Singapore on 2026-09-05:

- Input: USD 0.00108 per 1K tokens.
- Output: USD 0.00432 per 1K tokens.

Nova Pro's token-count endpoint does not support this inference profile. For a
conservative estimate, this report treats every Unicode character as one token. The
seven live requests contained 30,926 input characters and approximately 6,130 output
characters across both directions:

`30,926 / 1,000 × 0.00108 + 6,130 / 1,000 × 0.00432 = USD 0.05988`

That is at most approximately USD 0.060 for this seven-candidate publish, or USD 0.0086
per pair under the conservative assumption. Actual billed token count should be lower
where multiple Latin characters form one token.

## Anonymized example for submission

Owner persona:

> 戴著護目鏡、專拆系統邊界的工程水獺：愛把複雜部署問題拆成可實作的取捨。

Peer persona:

> 織巢園丁鳥：蒐集研究、故事與現場線索，再把它們編成讓人願意靠近的空間。

What we both care about:

> 你對 AI agent 的可靠性與恢復設計感興趣，而對方則關注 AI 陪伴、同理與心理支持。這兩者在 AI 系統的使用者體驗上有跨領域的間接連結。

Why it matters now:

> 你正在解決長時間 agent session 的恢復與續跑問題，而對方則研究 LLM 心理支持中的長期信任與互動。這兩個議題在使用者對 AI 系統的長期依賴與信任上有著斜向連結。

What we could discuss:

> 你可以與對方討論如何在 AI agent 的設計中融入心理支持元素，使系統不僅可靠，還能提供情感上的陪伴與支持。這可以包括如何在 agent 的操作模型中加入自我揭露與節奏匹配的設計準則，以及如何在系統恢復與續跑時維持使用者的信任與情感連結。

This example contains no emails, profile/version identifiers, pair IDs, session data, or
tokens.

## Evidence still required

The requested 375 px before/after screenshot and three-match screenshot set have not
been captured. This session's in-app/Chrome browser inventory was empty, so there was no
compliant visible browser surface for stepwise screenshot verification. Data-path and
deployed-worker acceptance checks are complete; the screenshot packet remains a
Marketing handoff blocker until a browser surface is available.
