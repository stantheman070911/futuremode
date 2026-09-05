# JTBD-7 — Technical documentation claim reconciliation

Date: 2026-09-05

Each changed claim and its code/deployment basis:

- **Candidate retrieval:** changed “native vector candidate search” to the shipped small-cohort scan plus in-memory field-vector ranking; the vector index is provisioned but the matching worker does not query it.
- **Judge location:** documented one Amazon Nova Pro call per unordered pair at edge-write time, returning both directions; the read path uses persisted explanations.
- **Judge safety path:** documented the 20-second timeout, concurrency of two, strict output/evidence-label validation, and persisted grounded fallback on any judge failure.
- **Persisted evidence:** documented `explanationSource` and `explanationModelLatencyMs` on directed similarity edges.
- **Result size:** replaced stale ten-per-page product language with the shipped maximum of five ordered candidates while noting retained pagination.
- **Public score:** clarified that the API retains `similarity_score` for compatibility but the signed-in UI does not display it.
- **Email delivery:** replaced the stale disabled claim with the deployed `MatchingEmailDeliveryState=ENABLED` behavior for invitation and connection email; the fallback matching schedule remains disabled.
- **Configuration:** changed `matchJudgeModelId` from “legacy unused” to its active Nova Pro role and corrected `matchingEmailDeliveryEnabled` to the repository's current `true` setting.
- **Reporting:** documented the exact read-only live funnel command, runtime-only team classification, and the known first-edge timestamp limitation.
- **Isolated E2E:** changed the stale 10+1 pagination description to the eleven-candidate pool capped to the deterministic top five.

The README problem statement, Current product, and Results sections remain owned by Marketing and were not changed as part of this job.
