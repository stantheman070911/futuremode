# PitchYourOwner UI adoption design QA

Date: 2026-09-06 (Asia/Taipei)

## Scope and visual targets

- Current production: `https://d1vuzznd4gxltu.cloudfront.net`
- New reference: `/Users/wanghsuanchung/Downloads/pitchyourowner_ui_design/pitchyourowner-complete-flow.html`
- Approved Expected Adoption evidence: `/Users/wanghsuanchung/OysterunAgents/FutureMore/.oysterun/site/assets/pitchyourowner-ui-migration-comparison/`
- Implemented preview: `http://127.0.0.1:4176`
- Tested viewports: 375 × 812 and 320 × 700.

## Visual comparison

The approved Expected Adoption image is on the left and the implemented app is on the right in each retained comparison:

- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-01-start.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-02-start-topic.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-03-signin.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-04-verify.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-05-choose.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-06-handoff.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-07-import.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-08-review.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-09-matching.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-10-list.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-11-detail.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-12-waiting.png`
- `packages/cloud/evidence/ui-adoption-20260906/qa/compare-13-incoming.png`

Visual checks passed:

- Start retains the reference hero and four-topic constellation; point 03 is absent. Topic content is explicitly static and has no interactive/live behavior.
- Sign-in, OTP, and AI choice retain the approved visual shell and use six-segment progress.
- Handoff keeps the black prompt object with the current dynamic prompt and one primary action.
- Import and final review retain the Current document UI; `history_scope` is visible and editable at the top.
- Matching search uses the reference animation while the central portrait remains dynamic. Match list/detail retain Current cards and data, with only the dynamic portrait cropped circularly.
- Waiting is the outgoing state at the existing match route and binds both owner and peer dynamic images.
- Incoming uses the approved invitation shell and contains no score, confidence, or psychology content.
- Line length, spacing, border treatment, image crop, heading hierarchy, bottom navigation, and responsive wrapping were checked at both viewports. No adopted screen has horizontal overflow.
- Reduced-motion CSS disables the new search and invitation animations.

## Behavior and contract checks

- Actual local API path exercised: email request → invalid OTP → retry with `246810` → publish → matching polling → match → invitation outgoing → token preview/decision.
- Keyboard path exercised: skip link and Start CTA receive focus; Enter on the focused CTA navigates to `/signin`.
- JSON failure path exercised: incomplete JSON is rejected, the original textarea value remains present, and no draft is published.
- Matching loading, empty, paused, and retry-related states were rendered and retained as evidence.
- Token page text scan returned `score=false` and `psych=false`; both Accept and Not now remain available.
- Static source comparison confirms `publicProfileDocument`, `pitchScreen`, `invitationsScreen`, `settingsScreen`, and `connectionScreen` are unchanged from `HEAD`.
- No diff exists in `config/pitchyourowner-profile-schema.json`, `prompts/`, `packages/cloud/src/`, or `packages/cloud/lib/`.
- Final automated result: 76 tests passed, 0 failed; TypeScript build, JavaScript syntax check, and whitespace diff check passed.

## Browser verification report

```text
browser_control_mode=interactive_browser_per_session
backend=@executeautomation/playwright-mcp-server@1.0.12
scope=pyo-ui-adoption-implementation-20260906-root-09
registry_path=/Users/wanghsuanchung/.oysterun-browser-mcp/registry/pyo-ui-adoption-implementation-20260906-root-09.json
mcp_endpoint=http://127.0.0.1:63017/mcp
health_endpoint=http://127.0.0.1:63017/health
tmux_session=oysterun_ibps_pyo-ui-adoption-implementation-20260906-root-09
screenshots=/Users/wanghsuanchung/OysterunAgents/FutureMore/futuremode-repo/packages/cloud/evidence/ui-adoption-20260906/{current,reference,implementation,qa}/
ui_dumps=/Users/wanghsuanchung/OysterunAgents/FutureMore/futuremode-repo/packages/cloud/evidence/ui-adoption-20260906/{current,qa}/ui-dump-*.md
current_url_sequence=https://d1vuzznd4gxltu.cloudfront.net/ -> file:///Users/wanghsuanchung/Downloads/pitchyourowner_ui_design/pitchyourowner-complete-flow.html#start...#incoming -> http://127.0.0.1:4176/
cleanup_status=stopped
```

final result: passed
