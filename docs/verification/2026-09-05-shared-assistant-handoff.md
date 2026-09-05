# Shared assistant handoff verification — 2026-09-05

## Outcome

The post-connection **用 ChatGPT 寫信** and **用 Claude 寫信** actions now call the same `openProviderWithPrompt` implementation as the existing onboarding assistant handoff. The earlier 4,000-character branch was removed, so a long first-email prompt is no longer replaced by a bare provider home page.

## Automated checks

- `npm test`: 47/47 passed.
- `npm run build`: passed.
- `node --check static/app.js`: passed.
- `git diff --check`: passed.
- Browser evaluation confirmed a 5,000-character ChatGPT prompt still produces a URL containing `?q=`.
- Production deployment completed with CloudFormation status `UPDATE_COMPLETE`.

## Production Human Path

- URL: `https://d1vuzznd4gxltu.cloudfront.net/connections/demo-ren-h?demo=1&verify=shared-handoff`
- Viewport: 375 × 812.
- The ChatGPT and Claude actions were each clicked through the visible production UI.
- Both actions preserved the original connection page.
- In the verification browser, clipboard permission was unavailable; the page displayed the complete manual-copy fallback for each provider instead of losing or truncating the prompt.
- The browser controller cannot assert an iOS-level app switch. The deployed buttons nevertheless use the same provider URL builder and the same opening function as the already proven onboarding button.

## Evidence

- `docs/verification/evidence/2026-09-05-mobile-audit/10-shared-handoff-fallback-375-2026-09-05T05-55-05-645Z.png`
- `docs/verification/evidence/2026-09-05-mobile-audit/ui-dump-2026-09-05T05-54-10-351Z.md`
- `docs/verification/evidence/2026-09-05-mobile-audit/ui-dump-2026-09-05T05-54-37-540Z.md`
- `docs/verification/evidence/2026-09-05-mobile-audit/ui-dump-2026-09-05T05-55-39-129Z.md`

## Browser control record

```text
browser_control_mode=interactive_browser_per_session
backend=@executeautomation/playwright-mcp-server@1.0.12
scope=pyo-mobile-audit-20260905
registry_path=/Users/wanghsuanchung/.oysterun-browser-mcp/registry/pyo-mobile-audit-20260905.json
mcp_endpoint=http://127.0.0.1:52833/mcp
health_endpoint=http://127.0.0.1:52833/health
tmux_session=oysterun_ibps_pyo-mobile-audit-20260905
current_url_sequence=/connections/demo-ren-h?demo=1&verify=shared-handoff -> ChatGPT click (original page retained) -> Claude click (original page retained)
cleanup_status=stopped after terminal verification
```

