# JTBD-2 verification — no public score, five-result cap

Date: 2026-09-05  
Implementation commit: `9d8df3f`  
Deployed stack: `PitchYourOwner-hackathon` in `ap-southeast-1`

## What changed

- The signed-in match card no longer renders `similarity_score` or any numeric
  compatibility score. The API response field remains unchanged.
- `MAX_MATCH_RESULTS` is a named backend constant set to five.
- Newly created result sets take the first five entries only after the existing
  composite-descending and candidate-ID tie-break ordering.
- Previously persisted result sets are also limited to their first five items when
  loaded. The result-set ID, ordering, pagination implementation, reload behavior,
  detail context, and Back context remain unchanged.
- The isolated E2E assertions now expect five displayed candidates from eleven eligible
  candidates and confirm that an out-of-range page remains on the same stable set.
- The canonical English and Traditional Chinese product contract now specifies the
  five-candidate maximum.

## Verification

- `node --check static/app.js`: passed.
- `npm test`: 53/53 passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- CloudFormation deployment completed with `UPDATE_COMPLETE`.
- Fetching the deployed `app.js` confirmed that no `class="similarity-score"` render
  path remains.
- Source inspection confirms that the cap is applied after the existing deterministic
  sort and before result-set persistence, and that legacy sets use the same first-five
  view.

The 375 px before/after screenshot pair is intentionally not duplicated here. The PM
reassigned that screenshot packet to the real-phone demo session. This report contains
the Development-owned code, contract, test, and deployed-state evidence.

## Brief corrections

- Capping only newly created result sets would have left existing 30-day result sets
  above five until replaced. The implementation therefore also caps legacy sets at read
  time while preserving their identity and ordering.
- With `PAGE_SIZE=10` and a five-result cap, the current product has only one page. The
  pagination code remains intact as required, and the E2E now verifies out-of-range page
  clamping instead of a no-longer-possible 10+1 split.
