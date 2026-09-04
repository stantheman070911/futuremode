const STORAGE_KEY = "pitchyourowner.session.v1";
const DRAFT_KEY = "pitchyourowner.draft.v1";
const HANDOFF_KEY = "pitchyourowner.handoff.v1";
const DISPLAY_NAME_KEY = "pitchyourowner.display-name.v1";
const DEMO_KEY = "pitchyourowner.demo.v1";
const DEMO_DRAFT_KEY = "pitchyourowner.demo-draft.v1";
const DEMO_MATCH_KEY = "pitchyourowner.demo-match.v1";
const LAST_PUBLISH_KEY = "pitchyourowner.last-publish.v1";
const MATCH_SEARCH_WINDOW_MS = 3 * 60 * 1000;
const MATCH_POLL_INTERVAL_MS = 6 * 1000;
let CONFIDENCE_FIELDS = ["summary", "interests", "motivations", "active_problems", "recurring_topics", "friend_intent"];
let CONFIDENCE_LEVELS = ["high", "medium", "low"];
let ARRAY_FIELDS = ["interests", "motivations", "active_problems", "recurring_topics"];
let PROFILE_SCHEMA_CONFIG = null;
const FIELD_META = {
  history_scope: ["History scope", "AI 實際使用與無法存取的資料範圍"],
  summary: ["Summary", "一句具體的 owner pitch"],
  interests: ["Interests", "每行一個具體、持續關注的興趣"],
  motivations: ["Motivations", "每行一個目前重要的動機"],
  active_problems: ["Active problems", "每行一個仍在處理的問題"],
  recurring_topics: ["Recurring topics", "每行一個反覆討論的主題"],
  friend_intent: ["Friend intent", "希望認識怎樣的人，以及想聊什麼"],
};
let FIELD_ORDER = ["history_scope", "summary", "interests", "motivations", "active_problems", "recurring_topics", "friend_intent"];
const SAMPLE_PROFILE = {
  summary: "Portrait photographer exploring how subtle posture and direction change the emotion of a frame.",
  interests: ["Subject direction", "Posture and tension", "Low-light portraiture", "Film emulation"],
  motivations: ["Create portraits that feel natural without leaving the subject unsupported"],
  active_problems: ["Directing a stranger clearly in under 90 seconds"],
  recurring_topics: ["Shoulder-line cues", "Skin tone under mixed light", "Pre-shoot briefing"],
  friend_intent: "Someone who practises the same problem weekly, such as a dancer, director, or photographer.",
  history_scope: "Recent ChatGPT conversations and saved memory were available; voice chats and deleted conversations were not available.",
  confidence: { summary: "high", interests: "high", motivations: "medium", active_problems: "medium", recurring_topics: "medium", friend_intent: "low" },
};
const DEMO_MATCH = {
  match_id: "demo-ren-h",
  state: "suggested",
  peer: {
    display_name: "Ren H.",
    profile: {
      summary: "Contemporary dancer studying how small changes in posture and tension alter emotional expression.",
      interests: ["Posture and tension", "Choreographic direction", "Movement under low light"],
      motivations: ["Help performers communicate emotion without over-directing them"],
      active_problems: ["Giving a useful physical cue without breaking a performer’s momentum"],
      recurring_topics: ["Shoulder-line cues", "Breath before movement", "Gesture intensity"],
      friend_intent: "Someone testing how small cues change what an audience feels.",
    },
  },
  explanation: {
    what_we_both_care_about: "How posture and tension carry emotion — yours through a lens, Ren’s through a body.",
    why_it_matters_now: "You are both trying to direct a person clearly without over-directing them.",
    what_we_could_discuss: "Ren is testing shoulder-line cues in low light while you are rewriting a 90-second pre-shoot brief.",
    evidence_labels: ["interests", "active_problems", "recurring_topics"],
  },
  can_invite: true,
};
const SAVED_DEMO_MATCH = readJson(DEMO_MATCH_KEY);
const DEMO_QUERY_ENABLED = new URLSearchParams(location.search).has("demo");
const PERSISTED_DEMO_ENABLED = readJson(DEMO_KEY)?.enabled === true;
const DEMO_AVAILABLE = ["127.0.0.1", "localhost"].includes(location.hostname) || DEMO_QUERY_ENABLED || PERSISTED_DEMO_ENABLED;
const SAVED_HANDOFF = readJson(HANDOFF_KEY);

const runtime = {
  session: readJson(STORAGE_KEY),
  draft: readJson(DRAFT_KEY),
  selectedAi: ["ChatGPT", "Claude", "Other AI"].includes(SAVED_HANDOFF?.selectedAi) ? SAVED_HANDOFF.selectedAi : "ChatGPT",
  locale: ["zh-Hant", "en"].includes(SAVED_HANDOFF?.locale) ? SAVED_HANDOFF.locale : "zh-Hant",
  displayName: readJson(DISPLAY_NAME_KEY) || "",
  challengeId: null,
  signinEmail: "",
  prompt: typeof SAVED_HANDOFF?.prompt === "string" ? SAVED_HANDOFF.prompt : "",
  handoffLaunchedAt: Number(SAVED_HANDOFF?.launchedAt) || 0,
  showFullPrompt: false,
  busy: false,
  error: "",
  notice: "",
  profile: null,
  profileLoaded: false,
  matches: null,
  invitations: null,
  match: null,
  uploadSession: null,
  supportRequestId: null,
  demo: DEMO_QUERY_ENABLED || PERSISTED_DEMO_ENABLED,
  demoDraft: readJson(DEMO_DRAFT_KEY) === true,
  demoMatch: SAVED_DEMO_MATCH?.match_id === DEMO_MATCH.match_id ? SAVED_DEMO_MATCH : structuredClone(DEMO_MATCH),
  pendingMatchDecision: null,
  lastPublishAt: Number(readJson(LAST_PUBLISH_KEY)) || 0,
  matchesPollError: false,
};

let matchesPollTimer = null;
let matchesCountdownTimer = null;
let nextMatchCheckAt = 0;

function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}

function writeJson(key, value) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
}

function resetDemoMatch() {
  runtime.demoMatch = structuredClone(DEMO_MATCH);
  writeJson(DEMO_MATCH_KEY, runtime.demoMatch);
}

function saveDemoMatch() {
  writeJson(DEMO_MATCH_KEY, runtime.demoMatch);
}

function clearHandoff() {
  runtime.prompt = "";
  runtime.handoffLaunchedAt = 0;
  runtime.showFullPrompt = false;
  writeJson(HANDOFF_KEY, null);
}

function saveHandoff() {
  writeJson(HANDOFF_KEY, {
    selectedAi: runtime.selectedAi,
    locale: runtime.locale,
    prompt: runtime.prompt,
    launchedAt: runtime.handoffLaunchedAt || null,
  });
}

function rehydrateHandoff() {
  const saved = readJson(HANDOFF_KEY);
  if (!saved) return;
  runtime.selectedAi = ["ChatGPT", "Claude", "Other AI"].includes(saved.selectedAi) ? saved.selectedAi : runtime.selectedAi;
  runtime.locale = ["zh-Hant", "en"].includes(saved.locale) ? saved.locale : runtime.locale;
  runtime.prompt = typeof saved.prompt === "string" ? saved.prompt : runtime.prompt;
  runtime.handoffLaunchedAt = Number(saved.launchedAt) || 0;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function announce(message) {
  document.getElementById("live-region").textContent = message;
}

function navigate(path) {
  if (path !== "/matches") stopMatchesPolling();
  history.pushState({}, "", path);
  runtime.error = "";
  runtime.notice = "";
  runtime.match = null;
  runtime.pendingMatchDecision = null;
  window.scrollTo(0, 0);
  render();
}

function isRecentPublish() {
  return runtime.lastPublishAt > 0 && Date.now() - runtime.lastPublishAt < MATCH_SEARCH_WINDOW_MS;
}

function stopMatchesPolling() {
  clearTimeout(matchesPollTimer);
  clearInterval(matchesCountdownTimer);
  matchesPollTimer = null;
  matchesCountdownTimer = null;
  nextMatchCheckAt = 0;
}

function updateMatchCountdown() {
  const line = document.querySelector("[data-match-countdown]");
  if (!line) return;
  const seconds = Math.max(0, Math.ceil((nextMatchCheckAt - Date.now()) / 1000));
  line.textContent = `Checking again in ${seconds}s`;
}

function ensureMatchesPolling() {
  if (location.pathname !== "/matches" || document.hidden || !isRecentPublish() || runtime.matchesPollError || runtime.matches?.length) {
    stopMatchesPolling();
    return;
  }
  if (matchesPollTimer) return;
  nextMatchCheckAt = Date.now() + MATCH_POLL_INTERVAL_MS;
  updateMatchCountdown();
  matchesCountdownTimer = setInterval(updateMatchCountdown, 1000);
  matchesPollTimer = setTimeout(async () => {
    stopMatchesPolling();
    await loadMatches({ polling: true });
  }, MATCH_POLL_INTERVAL_MS);
}

async function api(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (runtime.session?.accessToken && !headers.authorization) headers.authorization = `Bearer ${runtime.session.accessToken}`;
  const response = await fetch(path, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.detail || body.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

function shell(content, { nav = false, active = "", action = "" } = {}) {
  return `<div class="app-shell"><section class="screen ${nav ? "" : "no-nav"}">
    <header class="wordmark"><a href="/" data-link>PITCHYOUROWNER</a>${action}</header>
    ${runtime.error ? `<div class="notice error" role="alert" tabindex="-1">${esc(runtime.error)}</div>` : ""}
    ${runtime.notice ? `<div class="notice success">${esc(runtime.notice)}</div>` : ""}
    ${content}
  </section>${nav ? bottomNav(active) : ""}</div>`;
}

function focusErrorNotice() {
  requestAnimationFrame(() => {
    const notice = document.querySelector('[role="alert"]');
    notice?.focus({ preventScroll: true });
    notice?.scrollIntoView({ block: "start" });
  });
}

function bottomNav(active) {
  const links = [["matches", "/matches", "Matches"], ["invitations", "/invitations", "Invites"], ["pitch", "/pitch", "My Pitch"], ["settings", "/settings", "Settings"]];
  return `<nav class="bottom-nav" aria-label="主要導覽">${links.map(([key, href, label]) => `<a href="${href}" data-link class="${active === key ? "active" : ""}" ${active === key ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav>`;
}

function handoffButtonLabel() {
  if (runtime.selectedAi === "ChatGPT") return "Open ChatGPT with my prompt";
  if (runtime.selectedAi === "Claude") return "Open Claude with my prompt";
  return "Share prompt to my AI";
}

function promptFileForLocale() {
  return runtime.locale === "en" ? "/owner-pitch-prompt-en.txt" : "/owner-pitch-prompt-zh-Hant.txt";
}

async function copyPromptBestEffort(prompt) {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(prompt);
    return true;
  } catch {
    return false;
  }
}

async function launchAiWithPrompt() {
  const prompt = String(runtime.prompt || "").trim();
  if (!prompt) throw new Error("Prompt 尚未完成載入，請稍後再試。");
  runtime.handoffLaunchedAt = Date.now();
  runtime.showFullPrompt = false;
  saveHandoff();

  if (runtime.selectedAi === "Other AI") {
    if (navigator.share) {
      await navigator.share({ title: "PitchYourOwner owner pitch prompt", text: prompt });
      render();
      return;
    }
    const copied = await copyPromptBestEffort(prompt);
    if (!copied) throw new Error("這個瀏覽器無法分享或複製 Prompt，請長按上方 Prompt 手動複製。");
    runtime.notice = "Prompt 已複製，現在可貼到你選擇的 AI。";
    announce(runtime.notice);
    render();
    return;
  }

  await copyPromptBestEffort(prompt);
  const target = new URL(runtime.selectedAi === "Claude" ? "https://claude.ai/new" : "https://chatgpt.com/");
  target.searchParams.set("q", prompt);
  window.location.assign(target.toString());
}

async function copyPrompt() {
  const prompt = String(runtime.prompt || "").trim();
  if (!prompt) throw new Error("Prompt 尚未完成載入，請稍後再試。");
  if (!await copyPromptBestEffort(prompt)) throw new Error("這個瀏覽器無法複製 Prompt，請長按上方 Prompt 手動複製。");
  runtime.notice = "Prompt copied. Open your AI and paste it to continue.";
  announce(runtime.notice);
  render();
}

function startScreen() {
  return shell(`<div class="hero">
    <h1>Your agent<br>knows you.<span>Let it pitch you.</span></h1>
    <p class="zh">你的 Agent 了解你，<br>讓它來介紹你。</p>
    <p class="promise">認識一位此刻因相同理由、關心相同事情的人。</p>
  </div>
  <div class="checkpoint" aria-label="兩個 owner 確認關卡">
    <div><strong>1</strong><span>在 AI 處理安全決定<br>Resolve privacy risks</span></div>
    <div><strong>2</strong><span>在網站授權發布<br>Approve publishing</span></div>
  </div>
  <button class="button primary" data-action="begin">Let my agent pitch me</button>
  ${DEMO_AVAILABLE ? '<button class="button quiet" style="margin-top:9px" data-action="demo-flow">Preview seeded flow</button>' : ""}
  <p class="subtle" style="text-align:center;margin:10px 0 0">手機可完成 · 約 3 分鐘</p>`);
}

function signinScreen() {
  const codeStep = Boolean(runtime.challengeId);
  return shell(`<div>
    <p class="eyebrow">${codeStep ? "STEP 2 / 2 · VERIFY" : "STEP 1 / 2 · SIGN IN"}</p>
    <h1 class="page-title">${codeStep ? "Check your email" : "Start with your email"}</h1>
    <p class="page-intro">${codeStep ? `六位數驗證碼已寄到 ${esc(runtime.signinEmail)}。` : "登入後，prompt、draft、pitch 與 invitation 才能由同一位 owner 控制。"}</p>
    <form class="form" data-form="${codeStep ? "confirm-code" : "request-code"}">
      ${codeStep ? `<label class="field"><span class="field-label">Verification code</span><input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>` : `<label class="field"><span class="field-label">Email</span><input name="email" type="email" inputmode="email" autocomplete="email" required placeholder="owner@example.com"></label>`}
      <button class="button primary" ${runtime.busy ? "disabled" : ""}>${runtime.busy ? "處理中" : codeStep ? "Verify and continue" : "Send verification code"}</button>
    </form>
    ${codeStep ? `<button class="button quiet" style="margin-top:9px;width:100%" data-action="change-email">Change email</button>` : ""}
  </div>`);
}

function assistantScreen() {
  return shell(`<p class="eyebrow">STEP 1 / 4 · CHOOSE AI</p>
    <h1 class="page-title">Who knows you best?</h1>
    <p class="page-intro">選擇平常最常一起思考、且能存取相關脈絡的 AI。</p>
    <div class="assistant-grid">${["ChatGPT", "Claude", "Other AI"].map((name) => `<button class="assistant-card" data-action="select-ai" data-ai="${name}" aria-pressed="${runtime.selectedAi === name}"><strong>${name}</strong><span>${runtime.selectedAi === name ? "Selected" : "Choose"}</span></button>`).join("")}</div>
    <div class="divider-label">Prompt language</div>
    <div class="language-grid" role="group" aria-label="Prompt language">${[["zh-Hant", "繁體中文"], ["en", "English"]].map(([locale, label]) => `<button class="language-card" data-action="select-locale" data-locale="${locale}" aria-pressed="${runtime.locale === locale}">${label}</button>`).join("")}</div>
    <div style="margin-top:auto;padding-top:28px"><button class="button primary" style="width:100%" data-action="create-prompt">Create my prompt</button></div>`, { action: '<a href="/settings" data-link class="text-action">Account</a>' });
}

function handoffScreen() {
  const promptReady = Boolean(String(runtime.prompt || "").trim());
  const afterHandoff = runtime.handoffLaunchedAt > 0;
  const prompt = `<div class="prompt-box" aria-label="完整 extraction prompt">${esc(runtime.prompt || "正在載入 prompt…")}</div>`;
  const actions = afterHandoff
    ? `<p class="page-intro">從 ${esc(runtime.selectedAi)} 回來了嗎？貼上它給你的 JSON。</p>
      <button class="button primary" style="width:100%" data-action="go-import">貼上最終 JSON</button>
      <button class="button quiet" style="margin-top:9px;width:100%" data-action="launch-ai-with-prompt" ${promptReady ? "" : "disabled"}>再次開啟 ${esc(runtime.selectedAi)}</button>
      <button class="text-action handoff-text-action" data-action="copy-prompt" ${promptReady ? "" : "disabled"}>Copy prompt again</button>`
    : `${prompt}
      <p class="subtle">AI 第一則會顯示精簡預覽，並一次列出實際發現的 security／privacy 項目；不會問介紹是否符合聊天歷史。選完所有 S 編號並加上「確認安全並產生 JSON」後，再複製下一則純 JSON。</p>
      <button class="button primary" style="width:100%" data-action="launch-ai-with-prompt" ${promptReady ? "" : "disabled"}>${esc(handoffButtonLabel())}</button>
      <p class="subtle" style="text-align:center;margin:9px 0 0">一次完成：將完整 Prompt 帶入 ${esc(runtime.selectedAi)} 並開啟；也會嘗試複製到剪貼簿作為備援。</p>
      <button class="button quiet" style="margin-top:9px;width:100%" data-action="copy-prompt" ${promptReady ? "" : "disabled"}>Copy prompt</button>`;
  const collapsedPrompt = afterHandoff
    ? `<div class="settings-row"><span>Extraction prompt ready</span><button data-action="toggle-full-prompt">${runtime.showFullPrompt ? "Hide full prompt" : "Show full prompt"}</button></div>${runtime.showFullPrompt ? prompt : ""}`
    : "";
  return shell(`<p class="eyebrow">STEP 2 / 4 · HAND OFF</p>
    <div class="prompt-meta"><a href="/assistant" data-link>更改 AI 或語言</a><span>${runtime.locale === "en" ? "English" : "繁體中文"}</span></div>
    <h1 class="page-title">${afterHandoff ? "Bring your pitch back" : `Hand this to ${esc(runtime.selectedAi)}`}</h1>
    <div class="progress" aria-label="Step 2 of 4"><span></span><span class="active"></span><span></span><span></span></div>
    ${!promptReady ? '<div class="notice error">Prompt 尚未完成載入，請返回上一步再試。</div>' : ""}
    ${collapsedPrompt}
    ${actions}`);
}

function parseJsonCandidate(value) {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("這不是最終 JSON。請回到 AI，逐項回覆它列出的 S 編號 security／privacy 選項，並在同一則訊息最後加上「確認安全並產生 JSON」，再複製下一則回答。");
  }
  if (parsed?.schema === "routec.message_debug_info.v1" || parsed?.matrix_event_id || parsed?.host_session_id) {
    throw new Error("這看起來是除錯／傳輸資料，不是你的 Owner Pitch。請回到 AI，完成 security／privacy 確認後，只複製包含 summary、interests、motivations、active_problems、recurring_topics、friend_intent、history_scope 與 confidence 的最後一則 JSON。");
  }
  if (parsed?.status === "review_required") {
    throw new Error("這仍是待確認預覽。請回到 AI，選完所有 S 編號 security／privacy 項目並加上「確認安全並產生 JSON」，再貼上下一則純 JSON。");
  }
  return parsed && typeof parsed === "object" && parsed.profile ? parsed.profile : parsed;
}

function validateProfileClient(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) throw new Error("JSON 必須是一個 profile object");
  const allowed = new Set([...FIELD_ORDER, "confidence"]);
  const unknown = Object.keys(profile).filter((key) => !allowed.has(key));
  if (unknown.length) throw new Error(`包含不支援欄位：${unknown.join(", ")}`);
  for (const field of FIELD_ORDER) {
    const config = PROFILE_SCHEMA_CONFIG?.core_fields?.[field];
    if (ARRAY_FIELDS.includes(field)) {
      if (!Array.isArray(profile[field]) || profile[field].some((item) => typeof item !== "string" || !item.trim())) throw new Error(`${field} 必須是非空字串陣列`);
      if (config?.max_items && profile[field].length > config.max_items) throw new Error(`${field} 最多 ${config.max_items} 項`);
      if (config?.item_max_length && profile[field].some((item) => item.trim().length > config.item_max_length)) throw new Error(`${field} 的單項文字過長`);
    } else if (typeof profile[field] !== "string" || !profile[field].trim()) throw new Error(`${field} 必須是非空字串`);
    else if (config?.max_length && profile[field].trim().length > config.max_length) throw new Error(`${field} 最多 ${config.max_length} 字元`);
  }
  if (!profile.confidence || typeof profile.confidence !== "object") throw new Error("缺少 confidence");
  for (const field of CONFIDENCE_FIELDS) if (!CONFIDENCE_LEVELS.includes(profile.confidence[field])) throw new Error(`confidence.${field} 必須是 ${CONFIDENCE_LEVELS.join("、")}`);
  return profile;
}

function importScreen() {
  if (!runtime.draft) {
    return shell(`<p class="eyebrow">STEP 3 / 4 · PASTE JSON</p>
      <h1 class="page-title">Bring your pitch back</h1>
      <p class="page-intro">AI 的第一則預覽不是要貼的內容。先完成傳輸前的 security／privacy 決定，再貼上最終 JSON。</p>
      <ol class="json-guide">
        <li><strong>閱讀精簡預覽</strong><span>這不是逐欄 profile 審核；AI 不會問它是否符合你的聊天歷史。</span></li>
        <li><strong>處理具體風險</strong><span>AI 只列出實際發現的 security／privacy 問題。每個 <code>S1、S2…</code> 都有明確風險與處理選項。</span></li>
        <li><strong>一次回覆所有選項</strong><span>例如 <code>S1-A、S2-B，確認安全並產生 JSON</code>。若沒有項目，只回覆確認語。</span></li>
        <li><strong>複製下一則回答</strong><span>它應該只有以 <code>{</code> 開始、以 <code>}</code> 結束的 JSON。</span></li>
      </ol>
      <form class="form" data-form="parse-json">
        <label class="field"><span class="field-label">Owner pitch JSON</span><textarea class="tall" name="json" required placeholder='{ "summary": "..." }'></textarea></label>
        <button class="button primary">Render editable fields</button>
      </form>
      ${DEMO_AVAILABLE && runtime.demo && !runtime.session ? '<button class="button quiet" style="margin-top:9px" data-action="load-sample">載入示範介紹</button><p class="subtle" style="margin:7px 0 0">示範用資料。</p>' : ""}
      ${runtime.session && !runtime.demo ? '<button class="button quiet" style="margin-top:9px" data-action="resume-computer-draft">Resume computer draft</button>' : ""}`);
  }
  return shell(`<p class="eyebrow">STEP 3 / 4 · EDIT FIELDS</p>
    <h1 class="page-title">Make it sound like you</h1>
    <p class="page-intro">每一個欄位都可編輯。Continue 只會打開唯讀審核，不會直接發布。</p>
    <form data-form="review-profile">
      ${editableFields(runtime.draft)}
      <div class="button-row"><button type="button" class="button" data-action="replace-json">Paste again</button><button class="button primary">Continue to review</button></div>
    </form>`);
}

function editableFields(profile) {
  return FIELD_ORDER.map((field) => {
    const [label, hint] = FIELD_META[field];
    const value = ARRAY_FIELDS.includes(field) ? profile[field].join("\n") : profile[field];
    const confidence = CONFIDENCE_FIELDS.includes(field) ? `<select name="confidence.${field}" aria-label="${label} confidence">${CONFIDENCE_LEVELS.map((level) => `<option value="${level}" ${profile.confidence[field] === level ? "selected" : ""}>${level}</option>`).join("")}</select>` : "";
    return `<section class="edit-card"><div class="confidence-row"><div><div class="field-label">${label}</div><p class="field-hint">${hint}</p></div>${confidence}</div><textarea name="${field}" aria-label="${label}" required>${esc(value)}</textarea></section>`;
  }).join("");
}

function profileFromForm(form) {
  const data = new FormData(form);
  const profile = { confidence: {} };
  for (const field of FIELD_ORDER) {
    const value = String(data.get(field) || "").trim();
    profile[field] = ARRAY_FIELDS.includes(field) ? value.split(/\n+/).map((item) => item.trim()).filter(Boolean) : value;
  }
  for (const field of CONFIDENCE_FIELDS) profile.confidence[field] = String(data.get(`confidence.${field}`) || "low");
  return validateProfileClient(profile);
}

function reviewScreen() {
  if (!runtime.draft) return importScreen();
  return shell(`<p class="eyebrow">STEP 4 / 4 · REVIEW & PUBLISH</p>
    <h1 class="page-title">Publish this pitch?</h1>
    <p class="page-intro">這是 PitchYourOwner 將儲存的完整版本。此頁唯讀；若要修改，請返回上一頁。</p>
    ${profileDocument(runtime.draft, true)}
    <form class="form" data-form="publish-profile">
      <label class="field"><span class="field-label">Display name</span><span class="field-hint">Shown to a match before you connect. Use a first name or a handle.</span><input name="display_name" autocomplete="nickname" minlength="1" maxlength="40" required value="${esc(runtime.displayName)}"></label>
      <div class="button-row"><button type="button" class="button" data-action="back-edit">Back to edit</button><button class="button primary" ${runtime.busy ? "disabled" : ""}>${runtime.busy ? "Publishing" : "Confirm & upload"}</button></div>
    </form>`);
}

function profileDocument(profile, showConfidence) {
  const listOrText = (field) => ARRAY_FIELDS.includes(field)
    ? `<div class="tag-list">${profile[field].map((item) => `<span class="tag">${esc(item)}</span>`).join("")}</div>`
    : `<p>${esc(profile[field])}</p>`;
  return `<div class="document">
    <section class="scope-block"><div class="field-label">History scope · 歷史範圍</div><p>${esc(profile.history_scope)}</p></section>
    <p class="doc-summary">${esc(profile.summary)}</p>
    ${["interests", "motivations", "active_problems", "recurring_topics", "friend_intent"].map((field) => `<section class="doc-field"><div class="doc-field-head"><span class="field-label">${FIELD_META[field][0]}</span>${showConfidence ? `<span class="confidence">${esc(profile.confidence[field])}</span>` : ""}</div>${listOrText(field)}</section>`).join("")}
    <div class="provenance"><span>Conversation-derived</span><span>Owner-approved</span><span>Currently exploring</span></div>
  </div>`;
}

function pitchScreen() {
  if (!runtime.profileLoaded) {
    loadProfile();
    return shell('<div class="loading">Loading your pitch</div>', { nav: true, active: "pitch" });
  }
  if (!runtime.profile) return shell(`<div class="empty"><p class="eyebrow">MY PITCH</p><h2>No pitch yet</h2><p>先讓你的 AI 產生 owner pitch，再貼回並發布。</p><a class="button primary" href="/assistant" data-link>Create my pitch</a></div>`, { nav: true, active: "pitch" });
  return shell(`<h1 class="page-title">My Pitch</h1><p class="page-intro">我的介紹 · owner 已核准</p>${profileDocument(runtime.profile.profile, false)}<button class="button" style="width:100%" data-action="refresh-pitch">Refresh my pitch</button>`, { nav: true, active: "pitch", action: '<a href="/settings" data-link class="text-action">Edit</a>' });
}

async function loadProfile() {
  runtime.profileLoaded = true;
  if (runtime.demo) { runtime.profile = { profile: structuredClone(SAMPLE_PROFILE), profile_id: "demo-owner" }; queueMicrotask(render); return; }
  try {
    runtime.profile = await api("/v1/profiles/me");
    runtime.locale = runtime.profile.locale === "en" ? "en" : "zh-Hant";
    if (runtime.profile.display_name) {
      runtime.displayName = runtime.profile.display_name;
      writeJson(DISPLAY_NAME_KEY, runtime.displayName);
    }
  }
  catch (error) { if (error.status !== 404) runtime.error = error.message; }
  render();
}

function matchesScreen() {
  if (!runtime.matches) {
    loadMatches();
    return shell('<div class="loading">Looking for specific overlap</div>', { nav: true, active: "matches" });
  }
  const visible = runtime.matches.filter((match) => match.state !== "not_now");
  if (!visible.length && runtime.matchesPollError) {
    stopMatchesPolling();
    return shell(`<div class="empty"><p class="eyebrow">MATCHES</p><h2>Matching paused</h2><p>我們暫時無法檢查新配對。你的 pitch 已安全保存。</p><button class="button primary" data-action="retry-matches">Try again</button></div>`, { nav: true, active: "matches" });
  }
  if (!visible.length && isRecentPublish()) {
    queueMicrotask(ensureMatchesPolling);
    return shell(`<div class="empty"><p class="eyebrow">MATCHES · SEARCHING</p><h2>你的 Agent 正在尋找</h2><p>正在把你的 pitch 與其他 owners 比較。通常一分鐘內就能完成。</p><p class="status-label" data-match-countdown aria-live="polite">Checking again in 6s</p></div>`, { nav: true, active: "matches" });
  }
  if (!visible.length) {
    stopMatchesPolling();
    if (runtime.demo && runtime.matches.some((match) => match.state === "not_now")) {
      return shell(`<div class="empty"><p class="eyebrow">DEMO · MATCH PASSED</p><h2>Demo match passed</h2><p>這個決定已記錄且無法復原；Ren H. 不會收到通知，也不會再次被推薦。</p></div>`, { nav: true, active: "matches" });
    }
    return shell(`<div class="empty"><p class="eyebrow">MATCHES</p><h2>No filler.</h2><p>目前還沒有能具體說明理由的配對。每當有新的 owner 發布 pitch，系統會再次進行配對。</p><button class="button primary" data-action="refresh-matches">Check again</button></div>`, { nav: true, active: "matches" });
  }
  stopMatchesPolling();
  return shell(`<h1 class="page-title">Matches</h1><p class="page-intro">少量、具體、可以解釋的朋友配對。</p><div class="match-list">${visible.map((match) => `<a class="match-card" href="/matches/${encodeURIComponent(match.match_id)}" data-link><div class="match-card-head"><h2>${esc(match.peer.display_name)}</h2><span class="status-label">${esc(match.state)}</span></div>${runtime.demo ? '<div class="evidence" style="margin-top:10px"><span class="evidence-label">Demo</span></div>' : ""}<p>${esc(match.explanation.what_we_both_care_about)}</p><div class="evidence" style="margin-top:12px">${match.explanation.evidence_labels.map((label) => `<span class="evidence-label">${esc(label)}</span>`).join("")}</div></a>`).join("")}</div>`, { nav: true, active: "matches" });
}

async function loadMatches({ polling = false } = {}) {
  const wasSearching = polling || (Array.isArray(runtime.matches) && runtime.matches.length === 0 && isRecentPublish());
  if (runtime.demo) {
    runtime.matches = isRecentPublish() && Date.now() - runtime.lastPublishAt < MATCH_POLL_INTERVAL_MS
      ? []
      : [structuredClone(runtime.demoMatch)];
    runtime.matchesPollError = false;
    if (wasSearching && runtime.matches.length) announce("找到 1 個配對");
    queueMicrotask(render);
    return;
  }
  try {
    runtime.matches = (await api("/v1/matches")).matches || [];
    runtime.matchesPollError = false;
    if (wasSearching && runtime.matches.length) announce(`${runtime.matches.length} match${runtime.matches.length === 1 ? "" : "es"} found`);
  }
  catch (error) {
    runtime.matches = [];
    runtime.matchesPollError = true;
    runtime.error = error.message;
    stopMatchesPolling();
  }
  render();
}

function matchDetailScreen(matchId) {
  if (!runtime.match || runtime.match.match_id !== matchId) {
    loadMatch(matchId);
    return shell('<div class="loading">Opening match reason</div>', { nav: true, active: "matches" });
  }
  const match = runtime.match;
  const initial = match.peer.display_name === "Another owner" ? "O" : match.peer.display_name.slice(0, 1).toUpperCase();
  const explanation = match.explanation;
  const questions = [
    ["01 · What we both care about", explanation.what_we_both_care_about],
    ["02 · Same reason, right now", explanation.why_it_matters_now],
    ["03 · What we could discuss today", explanation.what_we_could_discuss],
  ];
  const demoMarker = runtime.demo ? '<div class="evidence"><span class="evidence-label">Demo · simulated data</span></div>' : "";
  const connectedBlock = match.state === "connected" ? `<div class="notice success" style="margin-bottom:18px">
      ${runtime.demo ? '<div class="evidence"><span class="evidence-label">Demo · simulated acceptance</span></div>' : ""}
      <h2 style="margin:10px 0 6px">You are connected</h2>
      <a href="mailto:${esc(match.peer.contact_email)}" style="overflow-wrap:anywhere">${esc(match.peer.contact_email)}</a>
      <div class="doc-field" style="margin-top:14px"><span class="field-label">Start with this</span><p>${esc(explanation.what_we_could_discuss)}</p></div>
    </div>` : "";
  let decisionArea;
  if (match.state === "connected") decisionArea = "";
  else if (match.state === "outgoing") decisionArea = `${runtime.demo ? '<div class="notice"><span class="evidence-label">Demo</span><p style="margin:8px 0 0">等待 Ren H. 回覆</p></div><button class="button primary" style="margin-top:9px;width:100%" data-action="simulate-demo-accept">Demo · 模擬 Ren 接受</button>' : '<div class="notice">Invitation sent. Contact appears only after mutual acceptance.</div>'}`;
  else if (match.state === "not_now") decisionArea = `<div class="notice">已略過。此決定已記錄且無法復原；對方不會收到通知。</div>`;
  else if (runtime.pendingMatchDecision?.matchId === matchId && runtime.pendingMatchDecision.decision === "not_now") decisionArea = `<div class="notice"><strong>略過 ${esc(match.peer.display_name)}？</strong><p>此決定無法復原，對方不會收到通知。</p><div class="button-row"><button class="button" data-action="cancel-match-decision">Cancel</button><button class="button primary" data-action="confirm-match-decision" data-match-id="${esc(matchId)}">Confirm pass</button></div></div>`;
  else decisionArea = `<div class="button-row"><button class="button" data-action="match-decision" data-decision="not_now" data-match-id="${esc(matchId)}">Not now</button><button class="button primary" data-action="match-decision" data-decision="${match.state === "incoming" ? "accept" : "invite"}" data-match-id="${esc(matchId)}">${match.state === "incoming" ? "Accept" : `Invite ${esc(match.peer.display_name)}`}</button></div>`;
  return shell(`<a href="/matches" data-link class="eyebrow" style="text-decoration:none">Back to matches</a>
    ${demoMarker}
    <div class="person"><div class="initial">${esc(initial)}</div><div><h1>${esc(match.peer.display_name)}</h1><p>${esc(match.peer.profile.interests?.[0] || "Owner pitch")}</p></div></div>
    ${connectedBlock}
    <div class="question-card">${questions.map(([label, text]) => `<section class="question"><div class="step-label">${label}</div><h2>${esc(text)}</h2><div class="evidence">${explanation.evidence_labels.map((evidence) => `<span class="evidence-label">Evidence · ${esc(evidence)}</span>`).join("")}</div></section>`).join("")}</div>
    <div class="provenance"><span>Conversation-derived</span><span>Owner-approved</span><span>Not verified</span></div>
    ${decisionArea}`, { nav: true, active: "matches" });
}

async function loadMatch(matchId) {
  if (runtime.demo && matchId === DEMO_MATCH.match_id) { runtime.match = structuredClone(runtime.demoMatch); queueMicrotask(render); return; }
  try { runtime.match = await api(`/v1/matches/${encodeURIComponent(matchId)}`); }
  catch (error) { runtime.error = error.message; runtime.match = { match_id: matchId, peer: { display_name: "Unavailable", profile: {} }, explanation: { what_we_both_care_about: "Match unavailable", why_it_matters_now: "", what_we_could_discuss: "", evidence_labels: [] }, state: "not_now" }; }
  render();
}

function invitationsScreen() {
  if (!runtime.invitations) {
    loadInvitations();
    return shell('<div class="loading">Loading invitations</div>', { nav: true, active: "invitations" });
  }
  const sections = [["Incoming", runtime.invitations.incoming], ["Outgoing", runtime.invitations.outgoing], ["Connected", runtime.invitations.connected]];
  return shell(`<h1 class="page-title">Invitations</h1><p class="page-intro">邀請需要雙方同意；Not now 的理由不會傳給對方。</p>${sections.map(([label, items]) => `<div class="divider-label">${label} · ${items.length}</div><div class="match-list">${items.length ? items.map((match) => `<a class="match-card" href="/matches/${encodeURIComponent(match.match_id)}" data-link><div class="match-card-head"><h2>${esc(match.peer.display_name)}</h2><span class="status-label">${esc(match.state)}</span></div>${runtime.demo ? '<div class="evidence" style="margin-top:10px"><span class="evidence-label">Demo · simulated</span></div>' : ""}<p>${esc(match.explanation.what_we_both_care_about)}</p></a>`).join("") : '<div class="notice">目前沒有項目</div>'}</div>`).join("")}`, { nav: true, active: "invitations" });
}

async function loadInvitations() {
  if (runtime.demo) {
    const match = structuredClone(runtime.demoMatch);
    runtime.invitations = { incoming: [], outgoing: match.state === "outgoing" ? [match] : [], connected: match.state === "connected" ? [match] : [] };
    queueMicrotask(render);
    return;
  }
  try { runtime.invitations = await api("/v1/invitations"); }
  catch (error) { runtime.invitations = { incoming: [], outgoing: [], connected: [] }; runtime.error = error.message; }
  render();
}

function settingsScreen() {
  return shell(`<h1 class="page-title">Settings</h1><p class="page-intro">Account、matching 與 computer API。</p>
    <div class="settings-group"><div class="divider-label">Computer API</div><div class="settings-row"><div><strong>24-hour draft upload</strong><div class="subtle">單次、write-only，只能建立 draft</div></div><button data-action="create-upload-session">Create</button></div></div>
    ${runtime.uploadSession ? `<div class="notice">Submit URL</div><div class="api-token">${esc(runtime.uploadSession.submit_url)}</div><div class="notice" style="margin-top:8px">Bearer token · ${esc(runtime.uploadSession.expires_at)}</div><div class="api-token">${esc(runtime.uploadSession.upload_token)}</div><p class="subtle">此 token 只顯示於目前畫面。POST body：<code>{"profile": {…}, "locale": "${esc(runtime.locale)}"}</code></p>` : ""}
    <div class="settings-group"><div class="divider-label">Data</div><div class="settings-row"><span>Delete pitch and account data</span><button data-action="delete-profile">Delete</button></div><div class="settings-row"><span>Sign out on this device</span><button data-action="signout">Sign out</button></div></div>
    <div class="settings-group"><div class="divider-label">Information</div><div class="settings-row"><a href="/privacy" data-link>Privacy</a></div><div class="settings-row"><a href="/terms" data-link>Terms</a></div><div class="settings-row"><a href="/support" data-link>Support</a></div></div>`, { nav: true, active: "settings" });
}

function infoScreen(kind) {
  const copy = {
    privacy: ["Privacy", "PitchYourOwner stores only the owner pitch you explicitly publish, account/session records, matches, and invitation decisions. The selected AI handles content preparation before transfer."],
    terms: ["Terms", "Owner pitches are conversation-derived interpretations, not verified identity or expertise. Use the product respectfully and do not upload information you are not authorized to share."],
    support: ["Support", "Send the exact error message and what you were trying to do. Do not include your profile JSON, upload token, verification code, or other secrets."],
  }[kind];
  const support = kind === "support" ? (runtime.supportRequestId
    ? `<div class="notice success" role="status">Support request ${esc(runtime.supportRequestId)} was sent.</div><button class="button quiet" style="margin-top:16px;width:100%" data-action="new-support-request">Send another request</button>`
    : `<form class="form" data-form="support-request"><label class="field"><span class="field-label">Message</span><textarea name="message" minlength="20" maxlength="5000" required placeholder="What happened, what you expected, and the approximate time"></textarea></label><label class="field"><span class="field-label">Contact (optional)</span><input name="contact" maxlength="320" placeholder="Email or another way to reply"></label><button class="button primary" ${runtime.busy ? "disabled" : ""}>${runtime.busy ? "Sending" : "Send support request"}</button></form>`)
    : "";
  return shell(`<a href="/settings" data-link class="eyebrow" style="text-decoration:none">Back to settings</a><h1 class="page-title">${copy[0]}</h1><p class="page-intro" style="color:var(--ink)">${copy[1]}</p>${support}`);
}

function render() {
  const app = document.getElementById("app");
  const path = location.pathname.replace(/\/$/, "") || "/";
  if (!runtime.session && !runtime.demo && !["/", "/signin", "/privacy", "/terms", "/support"].includes(path)) {
    history.replaceState({}, "", "/signin");
    app.innerHTML = signinScreen();
    return;
  }
  if (path === "/") app.innerHTML = startScreen();
  else if (path === "/signin") app.innerHTML = signinScreen();
  else if (path === "/assistant") app.innerHTML = assistantScreen();
  else if (path === "/handoff") app.innerHTML = handoffScreen();
  else if (path === "/import") app.innerHTML = importScreen();
  else if (path === "/review") app.innerHTML = reviewScreen();
  else if (path === "/pitch") app.innerHTML = pitchScreen();
  else if (path === "/matches") app.innerHTML = matchesScreen();
  else if (/^\/matches\/[^/]+$/.test(path)) app.innerHTML = matchDetailScreen(decodeURIComponent(path.split("/").pop()));
  else if (path === "/invitations") app.innerHTML = invitationsScreen();
  else if (path === "/settings") app.innerHTML = settingsScreen();
  else if (["/privacy", "/terms", "/support"].includes(path)) app.innerHTML = infoScreen(path.slice(1));
  else { history.replaceState({}, "", "/"); app.innerHTML = startScreen(); }
}

document.addEventListener("click", async (event) => {
  const link = event.target.closest("a[data-link]");
  if (link) { event.preventDefault(); navigate(new URL(link.href).pathname); return; }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  try {
    runtime.error = "";
    if (action === "begin") runtime.session ? await routeReturningOwner() : navigate("/signin");
    if (action === "demo-flow") { runtime.demo = true; runtime.draft = null; runtime.demoDraft = false; runtime.profile = null; runtime.profileLoaded = false; runtime.matches = null; runtime.invitations = null; runtime.match = null; runtime.displayName = "Ari C."; resetDemoMatch(); writeJson(DEMO_KEY, { enabled: true }); writeJson(DRAFT_KEY, null); writeJson(DEMO_DRAFT_KEY, null); writeJson(DISPLAY_NAME_KEY, runtime.displayName); navigate("/assistant"); }
    if (action === "change-email") { runtime.challengeId = null; runtime.signinEmail = ""; render(); }
    if (action === "select-ai") { runtime.selectedAi = button.dataset.ai; render(); }
    if (action === "select-locale") { runtime.locale = button.dataset.locale === "en" ? "en" : "zh-Hant"; render(); }
    if (action === "create-prompt") {
      const response = await fetch(promptFileForLocale(), { cache: "no-store" });
      if (!response.ok) throw new Error(`Prompt 載入失敗（HTTP ${response.status}）`);
      runtime.prompt = await response.text();
      runtime.handoffLaunchedAt = 0;
      runtime.showFullPrompt = false;
      saveHandoff();
      navigate("/handoff");
    }
    if (action === "launch-ai-with-prompt") await launchAiWithPrompt();
    if (action === "copy-prompt") await copyPrompt();
    if (action === "toggle-full-prompt") { runtime.showFullPrompt = !runtime.showFullPrompt; render(); }
    if (action === "go-import") navigate("/import");
    if (action === "load-sample") { runtime.draft = structuredClone(SAMPLE_PROFILE); runtime.demoDraft = true; writeJson(DRAFT_KEY, runtime.draft); writeJson(DEMO_DRAFT_KEY, true); render(); }
    if (action === "resume-computer-draft") await resumeComputerDraft();
    if (action === "replace-json") { runtime.draft = null; runtime.demoDraft = false; writeJson(DRAFT_KEY, null); writeJson(DEMO_DRAFT_KEY, null); render(); }
    if (action === "back-edit") {
      const displayName = String(document.querySelector('input[name="display_name"]')?.value || "").trim();
      if (displayName && displayName.length <= 40 && !/[\r\n]/.test(displayName)) {
        runtime.displayName = displayName;
        writeJson(DISPLAY_NAME_KEY, runtime.displayName);
      }
      navigate("/import");
    }
    if (action === "refresh-pitch") { runtime.draft = null; writeJson(DRAFT_KEY, null); navigate("/assistant"); }
    if (action === "refresh-matches") { runtime.matchesPollError = false; runtime.matches = null; render(); }
    if (action === "retry-matches") { runtime.error = ""; runtime.matchesPollError = false; runtime.matches = null; render(); }
    if (action === "match-decision" && runtime.demo && button.dataset.decision === "not_now") {
      runtime.pendingMatchDecision = { matchId: button.dataset.matchId, decision: "not_now" };
      render();
      requestAnimationFrame(() => document.querySelector('[data-action="confirm-match-decision"]')?.scrollIntoView({ block: "center" }));
    } else if (action === "match-decision") await decideMatch(button.dataset.matchId, button.dataset.decision);
    if (action === "cancel-match-decision") { runtime.pendingMatchDecision = null; render(); }
    if (action === "confirm-match-decision") { runtime.pendingMatchDecision = null; await decideMatch(button.dataset.matchId, "not_now"); }
    if (action === "simulate-demo-accept") connectDemoMatch();
    if (action === "create-upload-session") { runtime.uploadSession = await api("/v1/upload-sessions", { method: "POST", body: "{}" }); render(); }
    if (action === "delete-profile") await deleteProfile();
    if (action === "signout") signout();
    if (action === "new-support-request") { runtime.supportRequestId = null; render(); }
  } catch (error) {
    runtime.error = error.message || "操作失敗";
    render();
    focusErrorNotice();
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  runtime.busy = true;
  runtime.error = "";
  render();
  try {
    const formData = new FormData(form);
    if (form.dataset.form === "request-code") {
      runtime.signinEmail = String(formData.get("email") || "").trim();
      const result = await api("/v1/email-verifications", { method: "POST", body: JSON.stringify({ email: runtime.signinEmail }) });
      runtime.challengeId = result.challengeId;
      runtime.notice = "驗證碼已寄出";
    } else if (form.dataset.form === "confirm-code") {
      const result = await api(`/v1/email-verifications/${encodeURIComponent(runtime.challengeId)}/confirm`, { method: "POST", body: JSON.stringify({ email: runtime.signinEmail, code: String(formData.get("code") || "") }) });
      const wasDemo = runtime.demo;
      if (wasDemo) {
        runtime.demo = false;
        runtime.matches = null;
        runtime.invitations = null;
        runtime.match = null;
        runtime.displayName = "";
        writeJson(DEMO_KEY, null);
        writeJson(DEMO_MATCH_KEY, null);
        writeJson(DISPLAY_NAME_KEY, null);
      }
      if (runtime.demoDraft) {
        runtime.draft = null;
        runtime.demoDraft = false;
        writeJson(DRAFT_KEY, null);
        writeJson(DEMO_DRAFT_KEY, null);
      }
      runtime.session = { accessToken: result.accessToken, email: runtime.signinEmail };
      writeJson(STORAGE_KEY, runtime.session);
      runtime.profileLoaded = false;
      await routeReturningOwner();
    } else if (form.dataset.form === "parse-json") {
      runtime.draft = validateProfileClient(parseJsonCandidate(String(formData.get("json") || "")));
      runtime.demoDraft = false;
      writeJson(DRAFT_KEY, runtime.draft);
      writeJson(DEMO_DRAFT_KEY, null);
    } else if (form.dataset.form === "review-profile") {
      runtime.draft = profileFromForm(form);
      writeJson(DRAFT_KEY, runtime.draft);
      navigate("/review");
    } else if (form.dataset.form === "publish-profile") {
      runtime.displayName = validateDisplayName(formData.get("display_name"));
      writeJson(DISPLAY_NAME_KEY, runtime.displayName);
      await publishProfile();
    } else if (form.dataset.form === "support-request") {
      const result = await api("/v1/support-requests", { method: "POST", body: JSON.stringify({ category: "other", message: String(formData.get("message") || ""), contact: String(formData.get("contact") || "") }) });
      runtime.supportRequestId = result.requestId;
    }
  } catch (error) {
    runtime.error = error.message || "操作失敗";
  } finally {
    runtime.busy = false;
    render();
    if (runtime.error) focusErrorNotice();
  }
});

async function publishProfile() {
  runtime.busy = true;
  render();
  if (runtime.demo) {
    runtime.profile = { profile: structuredClone(runtime.draft), profile_id: "demo-owner", version_id: "demo-v1" };
    runtime.profileLoaded = true;
    runtime.draft = null;
    runtime.demoDraft = false;
    resetDemoMatch();
    runtime.matches = null;
    runtime.lastPublishAt = Date.now();
    writeJson(LAST_PUBLISH_KEY, runtime.lastPublishAt);
    writeJson(DRAFT_KEY, null);
    writeJson(DEMO_DRAFT_KEY, null);
    clearHandoff();
    runtime.busy = false;
    navigate("/matches");
    return;
  }
  const result = await api("/v1/profile-versions", {
    method: "POST",
    headers: { "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ schema: "pitchyourowner.profile-publish.v1", display_name: runtime.displayName, profile: runtime.draft, locale: runtime.locale, consent: { approvedAt: new Date().toISOString() } }),
  });
  await api("/v1/matching-runs", { method: "POST", body: "{}" });
  runtime.busy = false;
  runtime.profile = { profile: runtime.draft, profile_id: result.profile_id, version_id: result.version_id };
  runtime.profileLoaded = true;
  runtime.draft = null;
  runtime.demoDraft = false;
  runtime.matches = null;
  runtime.lastPublishAt = Date.now();
  writeJson(LAST_PUBLISH_KEY, runtime.lastPublishAt);
  writeJson(DRAFT_KEY, null);
  writeJson(DEMO_DRAFT_KEY, null);
  clearHandoff();
  runtime.notice = "Pitch published. Matching started.";
  navigate("/matches");
}

async function decideMatch(matchId, decision) {
  if (runtime.demo && matchId === DEMO_MATCH.match_id) {
    runtime.demoMatch.state = decision === "not_now" ? "not_now" : "outgoing";
    runtime.demoMatch.can_invite = false;
    saveDemoMatch();
    runtime.match = structuredClone(runtime.demoMatch);
    runtime.matches = [structuredClone(runtime.demoMatch)];
    runtime.invitations = null;
    if (decision === "not_now") {
      navigate("/matches");
      runtime.notice = "已略過，對方不會收到通知。";
      announce(runtime.notice);
      render();
    } else {
      runtime.notice = "Demo invitation sent";
      announce(runtime.notice);
      render();
      requestAnimationFrame(() => document.querySelector('[data-action="simulate-demo-accept"]')?.scrollIntoView({ block: "center" }));
    }
    return;
  }
  runtime.match = await api(`/v1/matches/${encodeURIComponent(matchId)}/invitations`, { method: "POST", body: JSON.stringify({ decision }) });
  runtime.matches = null;
  runtime.invitations = null;
  runtime.notice = decision === "not_now" ? "已暫時略過" : runtime.match.state === "connected" ? "雙方已接受，聯絡方式已開放" : "Invitation sent";
  render();
}

function connectDemoMatch() {
  runtime.demoMatch.state = "connected";
  runtime.demoMatch.can_invite = false;
  runtime.demoMatch.peer.contact_email = "ren.demo@example.com";
  saveDemoMatch();
  runtime.matches = [structuredClone(runtime.demoMatch)];
  runtime.invitations = null;
  navigate(`/matches/${encodeURIComponent(runtime.demoMatch.match_id)}`);
  runtime.notice = "Demo · Ren H. simulated acceptance";
  announce(runtime.notice);
  render();
}

async function deleteProfile() {
  if (!window.confirm("Delete this pitch, its matches, and account data?")) return;
  try { await api("/v1/profiles/me", { method: "DELETE", body: JSON.stringify({ confirm: "DELETE" }) }); } catch (error) { if (error.status !== 404) throw error; }
  signout();
}

function signout() {
  runtime.session = null;
  runtime.profile = null;
  runtime.profileLoaded = false;
  runtime.matches = null;
  runtime.invitations = null;
  runtime.draft = null;
  runtime.demoDraft = false;
  runtime.demo = false;
  runtime.displayName = "";
  clearHandoff();
  writeJson(STORAGE_KEY, null);
  writeJson(DRAFT_KEY, null);
  writeJson(DEMO_DRAFT_KEY, null);
  writeJson(DISPLAY_NAME_KEY, null);
  writeJson(DEMO_KEY, null);
  writeJson(DEMO_MATCH_KEY, null);
  writeJson(LAST_PUBLISH_KEY, null);
  runtime.lastPublishAt = 0;
  runtime.matchesPollError = false;
  stopMatchesPolling();
  navigate("/");
}

function validateDisplayName(value) {
  const displayName = String(value || "").trim();
  if (!displayName || displayName.length > 40 || /[\r\n]/.test(displayName)) throw new Error("Display name 必須是 1–40 字元，且不能換行。");
  return displayName;
}

async function routeReturningOwner() {
  try {
    runtime.profile = await api("/v1/profiles/me");
    runtime.profileLoaded = true;
    runtime.locale = runtime.profile.locale === "en" ? "en" : "zh-Hant";
    runtime.displayName = runtime.profile.display_name || runtime.displayName;
    if (runtime.displayName) writeJson(DISPLAY_NAME_KEY, runtime.displayName);
    navigate("/matches");
  } catch (error) {
    if (error.status !== 404) throw error;
    runtime.profile = null;
    runtime.profileLoaded = true;
    navigate(runtime.draft ? "/import" : "/assistant");
  }
}

async function resumeComputerDraft() {
  const result = await api("/v1/profile-drafts");
  const draft = Array.isArray(result.drafts)
    ? [...result.drafts].sort((left, right) => String(right.createdAt || right.created_at || "").localeCompare(String(left.createdAt || left.created_at || "")))[0]
    : null;
  if (!draft?.profile) {
    runtime.notice = "No computer draft is available yet.";
    render();
    return;
  }
  runtime.draft = validateProfileClient(draft.profile);
  runtime.demoDraft = false;
  runtime.locale = draft.locale === "en" ? "en" : "zh-Hant";
  writeJson(DRAFT_KEY, runtime.draft);
  writeJson(DEMO_DRAFT_KEY, null);
  runtime.notice = "Computer draft loaded. Review every field before publishing.";
  render();
}

async function loadProfileSchemaConfig() {
  try {
    const response = await fetch("/pitchyourowner-profile-schema.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`schema config returned ${response.status}`);
    PROFILE_SCHEMA_CONFIG = await response.json();
    FIELD_ORDER = PROFILE_SCHEMA_CONFIG.field_order.filter((field) => field !== "confidence");
    ARRAY_FIELDS = Object.entries(PROFILE_SCHEMA_CONFIG.core_fields).filter(([, config]) => config.type === "string_array").map(([field]) => field);
    CONFIDENCE_FIELDS = PROFILE_SCHEMA_CONFIG.optional_fields.confidence.targets;
    CONFIDENCE_LEVELS = PROFILE_SCHEMA_CONFIG.optional_fields.confidence.allowed_values;
  } catch (error) {
    console.warn("Using embedded profile schema fallback", error);
  }
}

window.addEventListener("popstate", () => {
  if (location.pathname !== "/matches") stopMatchesPolling();
  render();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopMatchesPolling();
  else if (location.pathname === "/matches") ensureMatchesPolling();
  else if (location.pathname === "/handoff") { rehydrateHandoff(); render(); }
});
window.addEventListener("pageshow", () => {
  if (location.pathname === "/handoff") { rehydrateHandoff(); render(); }
});
loadProfileSchemaConfig().finally(render);
