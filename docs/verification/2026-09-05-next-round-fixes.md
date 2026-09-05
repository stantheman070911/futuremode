# Next-round UI, email, and first-message verification

Date: 2026-09-05 (Asia/Taipei)

## Runtime

```text
interactive_stepwise_runtime=true
browser_transport=interactive_browser_mcp_executeautomation
browser_control_mode=interactive_browser_per_session
backend=@executeautomation/playwright-mcp-server@1.0.12
scope=pyo-matching-repair-20260905
registry_path=/Users/wanghsuanchung/.oysterun-browser-mcp/registry/pyo-matching-repair-20260905.json
mcp_endpoint=http://127.0.0.1:50603/mcp
health_endpoint=http://127.0.0.1:50603/health
tmux_session=oysterun_ibps_pyo-matching-repair-20260905
target=https://d1vuzznd4gxltu.cloudfront.net
browser_close_policy=stop after terminal verification and retained evidence
```

## Automated gates

- `npm test`: 47/47 passed.
- `npm run build`: passed.
- `node --check static/app.js`: passed.
- `git diff --check`: passed.
- Production root returned `200`; unauthenticated `/v1/connections/not-a-real-id` returned `401`.
- Deployed prompt and static assets contain the accepted neutral scope copy, concise animal guidance, exact `寄送邀請` CTA, removed invitation description, connection handoff, Demo connection repair, and manual-copy fallback.

## Action ledger

| Step | Action | Expected | Observed | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Open Demo assistant at 375 × 812 and create the prompt | Memory notice opens immediately over the prompt page | Passed; modal is closeable and uses the neutral no-memory copy | `12-memory-modal-final-375-2026-09-05T05-19-11-961Z.png`, `ui-dump-2026-09-05T05-18-56-728Z.md` |
| 2 | Open Invitations at 375 × 812 | No removed description or empty placeholder gap | Passed | `13-invitations-final-375-2026-09-05T05-19-40-342Z.png`, `ui-dump-2026-09-05T05-19-27-167Z.md` |
| 3 | Open the Demo match and choose `寄送邀請` | Exact CTA remains compact and independent of the animal title | Passed | `ui-dump-2026-09-05T05-20-29-906Z.md`, earlier 320/390 match-detail screenshots in the evidence directory |
| 4 | Simulate mutual acceptance and open Invitations | Connected card uses a valid connection route | Initial run exposed `/connections/undefined`; fixed and reverified as `/connections/demo-ren-h` | `ui-dump-2026-09-05T05-21-31-856Z.md`, `ui-dump-2026-09-05T05-25-45-309Z.md` |
| 5 | Open the connected card | Styled connection page shows the approved peer profile, peer email, and both AI actions | Passed at 375 px without horizontal overflow | `14-connection-ai-final-375-2026-09-05T05-26-18-913Z.png`, `15-connection-ai-actions-final-375-2026-09-05T05-26-38-415Z.png`, `ui-dump-2026-09-05T05-26-04-809Z.md` |
| 6 | Click `用 ChatGPT 寫信` | Open a new assistant tab and preserve the connection page | Passed; original URL remained `/connections/demo-ren-h`. Test browser denied clipboard permission, so the complete prompt appeared in the manual-copy field | `16-connection-prompt-fallback-final-375-2026-09-05T05-32-17-955Z.png`, `ui-dump-2026-09-05T05-31-56-354Z.md` |
| 7 | Click `用 Claude 寫信` | Same canonical prompt and preserved original page | Passed; the original URL remained the connection route and the Claude-specific status was announced | `ui-dump-2026-09-05T05-32-54-120Z.md` |

The earlier stepwise pass in the same evidence directory also covers the 390 px visual editor, 390/320 px match detail, exact invitation CTA, and 320 px Invitations layout. The Owner had already verified the complete production journey, so this round intentionally limited browser work to modified surfaces and the new post-consent handoff.

## Result

```text
pass=true
product_blockers=none
remaining_manual_assertion=real recipient-side inbox arrival and rendering
cleanup_status=stopped
```
