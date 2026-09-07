import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function source(path: string): Promise<string> {
  return readFile(resolve(packageDir, path), "utf8");
}

test("adopts the approved six-step visual shell without adding product routes", async () => {
  const app = await source("static/app.js");
  assert.match(app, /\[1, 2, 3, 4, 5, 6\]\.map/);
  assert.match(app, /progressHeader\(codeStep \? 2 : 1/);
  assert.match(app, /progressHeader\(3, "assistant\.step"\)/);
  assert.match(app, /progressHeader\(4, "handoff\.step"\)/);
  assert.match(app, /progressHeader\(5, "import\.stepPaste"\)/);
  assert.match(app, /progressHeader\(6, "import\.stepEdit"\)/);
  assert.match(app, /"progress\.aria": "步驟 \{step\} \/ 6"/);
  assert.match(app, /static-topic-orbit four/);
  for (const excludedPath of ["/style-prompt", "/ai-final", "/dashboard", "/network", "/my-profile"]) {
    assert.doesNotMatch(app, new RegExp(`href=["']${excludedPath.replace("/", "\\/")}`));
  }
  assert.doesNotMatch(app, /interaction_observations|BFI-2|Social Styles|FIRO-B/);
});

test("keeps the existing handoff, schema review, navigation, and matching contracts", async () => {
  const [app, styles] = await Promise.all([source("static/app.js"), source("static/styles.css")]);
  assert.match(app, /data-action="launch-ai-with-prompt"/);
  assert.match(app, /await launchAiWithPrompt\(\)/);
  assert.doesNotMatch(app, /data-action="open-ai"/);
  assert.match(app, /textarea\("history_scope", "scope-editor", 3\)/);
  assert.doesNotMatch(app, /type="hidden" name="history_scope"/);
  assert.match(app, /data-form="publish-profile" novalidate/);
  assert.match(app, /data-action="confirm-publish"/);
  assert.match(app, /const links = \[\["matches", "\/matches", "nav\.matches"\], \["invitations", "\/invitations", "nav\.invites"\], \["pitch", "\/pitch", "nav\.pitch"\], \["settings", "\/settings", "nav\.settings"\]\]/);
  assert.match(app, /testDataMarker\(match\.peer\)/);
  assert.match(app, /similarity-score/);
  assert.match(app, /result\.total_pages > 1/);
  assert.match(styles, /\.match-results-list \.profile-portrait,\.match-detail-person \.profile-portrait\{border-radius:50%\}/);
  assert.doesNotMatch(styles, /(?:^|,)\.profile-portrait\{[^}]*border-radius:50%/m);
});

test("binds waiting to both live profile presentations and keeps token surfaces score-free", async () => {
  const app = await source("static/app.js");
  assert.match(app, /profilePortrait\(runtime\.profile, "thumbnail", "invite-avatar-image"\)/);
  assert.match(app, /profilePortrait\(match\.peer, "thumbnail", "invite-avatar-image"\)/);
  assert.match(app, /if \(match\.state === "outgoing"\) return shell/);
  const acceptSource = app.slice(app.indexOf("function acceptScreen()"), app.indexOf("async function loadInvitationPreview"));
  assert.doesNotMatch(acceptSource, /similarity-score|similarity_score|confidence|psych|BFI|FIRO/);
  assert.doesNotMatch(acceptSource, /publicProfileDocument/);
  assert.match(acceptSource, /data-decision="not_now"/);
  assert.match(acceptSource, /data-decision="accept"/);
  const publicDocumentSource = app.slice(app.indexOf("function publicProfileDocument"), app.indexOf("function acceptScreen"));
  assert.doesNotMatch(publicDocumentSource, /similarity-score|similarity_score|confidence/);
});

test("ships only permitted fixed decorative reference images", async () => {
  const app = await source("static/app.js");
  assert.doesNotMatch(app, /public-profile-qr|icon-bfi2|icon-social-styles|icon-firo-b/);
  assert.match(app, /\/ui-reference\/verify-email-animals\.png/);
  assert.match(app, /\/ui-reference\/choose-ai-otter\.png/);
  const listSource = app.slice(app.indexOf("function matchesScreen"), app.indexOf("async function loadMatches"));
  assert.doesNotMatch(listSource, /ui-reference\/avatar/);
  const detailSource = app.slice(app.indexOf("function matchDetailScreen"), app.indexOf("async function loadMatch"));
  assert.doesNotMatch(detailSource, /ui-reference\/avatar/);
});
