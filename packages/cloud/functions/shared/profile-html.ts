function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[character] ?? character));
}

function escapeAttribute(value: unknown): string {
  return escapeHtml(value).replace(/\n/g, " ");
}

function inlineMarkdown(value: unknown): string {
  const codeSpans: string[] = [];
  let rendered = escapeHtml(value).replace(/`([^`\n]+)`/g, (_match, content: string) => {
    const token = `\u0000CODE${codeSpans.length}\u0000`;
    codeSpans.push(`<code>${content}</code>`);
    return token;
  });
  rendered = rendered
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, "$1<em>$2</em>");
  return rendered.replace(/\u0000CODE(\d+)\u0000/g, (_match, index: string) => codeSpans[Number(index)] ?? "");
}

function markdown(value: unknown): string {
  const lines = String(value ?? "").replace(/\r/g, "").split("\n");
  const output: string[] = [];
  let list = false;
  const close = () => { if (list) { output.push("</ul>"); list = false; } };
  for (const line of lines) {
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (heading) { close(); const level = Math.min(4, heading[1].length + 1); output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`); }
    else if (item) { if (!list) { output.push("<ul>"); list = true; } output.push(`<li>${inlineMarkdown(item[1])}</li>`); }
    else if (!line.trim()) close();
    else { close(); output.push(`<p>${inlineMarkdown(line)}</p>`); }
  }
  close();
  return output.join("\n");
}

interface PublicProfileVersion {
  profileHeadline?: string;
  profileMarkdown?: string;
  locale?: string;
  skills?: string[];
  animalSlug?: string;
  activity?: { periodStart?: string; periodEnd?: string; tokenTotal?: number; daily?: Array<{ date: string; tokens?: number }> };
  createdAt?: string;
  versionId?: string;
}

interface PublicStory { title?: string; summary?: string; markdown?: string }

function tokenValue(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function axisDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(date);
  } catch {
    return date.toISOString().slice(5, 10);
  }
}

function activityBars(activity: PublicProfileVersion["activity"], locale: string): { bars: string; start: string; end: string } {
  const daily = new Map((activity?.daily ?? []).map((item) => [item.date, tokenValue(item.tokens)]));
  const proposedEnd = new Date(`${activity?.periodEnd ?? new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const end = Number.isNaN(proposedEnd.getTime()) ? new Date() : proposedEnd;
  end.setUTCHours(0, 0, 0, 0);
  const days = Array.from({ length: 84 }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (83 - index));
    const key = date.toISOString().slice(0, 10);
    return { date, key, tokens: daily.get(key) ?? 0 };
  });
  const buckets = Array.from({ length: 28 }, (_, index) => {
    const window = days.slice(index * 3, index * 3 + 3);
    return { start: window[0], end: window.at(-1)!, tokens: window.reduce((total, day) => total + day.tokens, 0) };
  });
  const maximum = Math.max(1, ...buckets.map((bucket) => bucket.tokens));
  const bars = buckets.map((bucket) => {
    const height = bucket.tokens ? Math.max(4, Math.round((bucket.tokens / maximum) * 100)) : 1;
    const label = `${bucket.start.key}—${bucket.end.key}: ${bucket.tokens.toLocaleString()} estimated tokens`;
    return `<span class="usage-bar${bucket.tokens ? " has-usage" : ""}" style="height:${height}%" title="${label}"><span class="sr-only">${label}</span></span>`;
  }).join("");
  return { bars, start: axisDate(days[0].date, locale), end: axisDate(end, locale) };
}

export function renderCloudProfileHtml(input: {
  profile: PublicProfileVersion;
  stories: PublicStory[];
  slug: string;
  versions: Array<{ versionId?: string; createdAt?: string }>;
  selectedVersionId?: string;
  publicOrigin?: string;
}): string {
  const { profile, stories, slug, versions, selectedVersionId } = input;
  const publicOrigin = String(input.publicOrigin || "https://pitchyourowner.oysterun.com").replace(/\/+$/, "");
  const profileUrl = `${publicOrigin}/p/${encodeURIComponent(slug)}`;
  const imageUrl = `${publicOrigin}/og/profile/${encodeURIComponent(slug)}.png${selectedVersionId ? `?version=${encodeURIComponent(selectedVersionId)}` : ""}`;
  const headline = profile.profileHeadline ?? "PitchYourOwner Profile";
  const description = (profile.profileMarkdown ?? headline).replace(/[#*_`>\-[\]()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 180) || headline;
  const skillTags = (profile.skills ?? []).slice(0, 10).map((skill) => `<span>${escapeHtml(skill)}</span>`).join("");
  const storyCards = stories.map((story) => `<details><summary><strong>${escapeHtml(story.title)}</strong><small>${escapeHtml(story.summary)}</small></summary><div>${markdown(story.markdown)}</div></details>`).join("");
  const versionLinks = versions.map((version) => `<a${version.versionId === selectedVersionId ? " aria-current=\"page\"" : ""} href="/p/${encodeURIComponent(slug)}?version=${encodeURIComponent(version.versionId ?? "")}">${escapeHtml((version.createdAt ?? "").slice(0, 10) || "Profile version")}</a>`).join("");
  const usage = activityBars(profile.activity, profile.locale ?? "en");
  const rendered = `<!doctype html><html lang="${escapeHtml(profile.locale ?? "en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(headline)}</title><meta name="description" content="${escapeAttribute(description)}"><meta property="og:type" content="profile"><meta property="og:site_name" content="PitchYourOwner"><meta property="og:title" content="${escapeAttribute(headline)}"><meta property="og:description" content="${escapeAttribute(description)}"><meta property="og:url" content="${escapeAttribute(profileUrl)}"><meta property="og:image" content="${escapeAttribute(imageUrl)}"><meta property="og:image:secure_url" content="${escapeAttribute(imageUrl)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeAttribute(headline)}"><meta name="twitter:description" content="${escapeAttribute(description)}"><meta name="twitter:image" content="${escapeAttribute(imageUrl)}"><style>
  :root{--ink:#17213d;--cream:#fff6ec;--coral:#ff5a36;--violet:#5b5bf7;--line:#c9c9da}*{box-sizing:border-box}body{margin:0;color:var(--ink);background:var(--cream);font:16px/1.55 ui-rounded,"Arial Rounded MT Bold",system-ui,sans-serif}main{max-width:920px;margin:auto;padding:54px 22px 90px}.badge,.skills span{display:inline-block;padding:7px 12px;background:#fff;border:2px solid var(--ink);border-radius:99px;box-shadow:2px 2px 0 var(--ink)}h1{margin:22px 0 34px;font-size:clamp(40px,7vw,76px);line-height:.98;letter-spacing:-.04em}.profile{padding:28px;background:#fff;border:3px solid var(--ink);border-radius:20px;box-shadow:7px 7px 0 var(--ink)}.skills{display:flex;flex-wrap:wrap;gap:9px;margin:30px 0}.activity{margin:42px 0}.usage-chart{position:relative;padding:24px 26px 18px;color:#f5f5f7;background:#08090b;border-radius:16px;overflow:hidden}.usage-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.usage-heading small,.usage-heading span{display:block;color:#8e929d;font:600 11px/1.2 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}.usage-heading h2{margin:5px 0 0;font:650 20px/1.2 system-ui,sans-serif;letter-spacing:-.02em}.usage-total{text-align:right;font:650 22px/1 system-ui,sans-serif}.usage-total span{margin-top:6px}.chart-area{position:relative;height:220px;margin-top:25px;padding:16px 0 18px 38px}.chart-grid{position:absolute;left:38px;right:0;border-top:1px solid #25272d}.chart-grid.top{top:16px}.chart-grid.middle{top:50%;opacity:.7}.chart-grid.bottom{bottom:18px}.chart-y{position:absolute;left:0;color:#70737d;font:11px/1 system-ui,sans-serif}.chart-y.top{top:11px}.chart-y.bottom{bottom:13px}.usage-bars{position:relative;z-index:1;display:grid;grid-template-columns:repeat(28,minmax(2px,1fr));align-items:end;gap:7px;height:100%}.usage-bar{display:block;min-height:2px;background:#2c2e34;border-radius:4px 4px 1px 1px;transition:background .15s ease}.usage-bar.has-usage{background:#777b87}.usage-bar:hover{background:#a9acb5}.chart-axis{display:flex;justify-content:space-between;margin:2px 0 0 38px;color:#777b84;font:11px/1 system-ui,sans-serif}.usage-note{display:block;margin-top:14px;color:#8e929d;font:600 11px/1.3 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}details{margin:14px 0;background:#fff;border:3px solid var(--ink);border-radius:16px;box-shadow:4px 4px 0 var(--coral)}summary{display:grid;gap:5px;padding:18px 20px;cursor:pointer}summary small{font-weight:400}details>div{padding:20px;border-top:2px solid var(--ink)}nav{display:flex;flex-wrap:wrap;gap:8px;margin-top:38px;padding-top:24px;border-top:2px dashed var(--line)}nav a{color:var(--violet)}nav a[aria-current=page]{font-weight:800}footer{margin-top:42px;color:#67677f;font-size:13px}@media(max-width:600px){main{padding-top:30px}.profile{padding:20px}.usage-chart{padding:20px 16px 15px;border-radius:13px}.usage-heading{display:block}.usage-total{margin-top:14px;text-align:left}.chart-area{height:180px;margin-top:17px;padding-left:31px}.chart-grid{left:31px}.usage-bars{gap:3px}.chart-axis{margin-left:31px}}
  </style></head><body><main><span class="badge">PITCHYOUROWNER NETWORK · ${escapeHtml(String(profile.animalSlug ?? "otter").toUpperCase())}</span><h1>${escapeHtml(profile.profileHeadline ?? "PitchYourOwner Profile")}</h1><article class="profile">${markdown(profile.profileMarkdown)}</article><section class="skills" aria-label="Skills">${skillTags}</section><section class="activity"><div class="usage-chart"><header class="usage-heading"><div><small>PERSONAL USAGE</small><h2>84-day activity</h2></div><strong class="usage-total">${Number(profile.activity?.tokenTotal ?? 0).toLocaleString()}<span>estimated session tokens</span></strong></header><div class="chart-area"><span class="chart-y top">100%</span><span class="chart-y bottom">0%</span><i class="chart-grid top"></i><i class="chart-grid middle"></i><i class="chart-grid bottom"></i><div class="usage-bars" role="img" aria-label="84-day session token activity grouped into 28 three-day windows">${usage.bars}</div></div><div class="chart-axis"><span>${escapeHtml(usage.start)}</span><span>${escapeHtml(usage.end)}</span></div><small class="usage-note">28 three-day windows · relative token volume</small></div></section><section><h2>Selected stories</h2>${storyCards}</section>${versions.length > 1 ? `<nav aria-label="Profile versions"><strong>Previous versions</strong>${versionLinks}</nav>` : ""}<footer>Published through PitchYourOwner · only owner-approved Profile content is shown.</footer></main></body></html>`;
  const trust = `<a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/support">Support</a><a href="/manage">Manage Profile</a><span>Published through PitchYourOwner · only owner-approved Profile content is shown.</span>`;
  return rendered.replace("<footer>Published through PitchYourOwner · only owner-approved Profile content is shown.</footer>", `<footer><nav aria-label="PitchYourOwner trust and support">${trust}</nav></footer>`);
}

export function renderPrivateProfileHtml(): string {
  return "<!doctype html><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Private PitchYourOwner Profile</title><style>body{margin:0;display:grid;min-height:100vh;place-items:center;background:#fff6ec;color:#17213d;font:18px/1.5 system-ui}main{max-width:560px;padding:36px;background:white;border:3px solid;border-radius:20px;box-shadow:7px 7px #17213d}h1{font-size:42px;line-height:1}nav{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}a{color:#5b5bf7}</style><main><small>PITCHYOUROWNER NETWORK</small><h1>This Profile is shared only with matched people.</h1><p>PitchYourOwner shares this Profile through the controlled matching flow.</p><nav><a href=\"/privacy\">Privacy</a><a href=\"/terms\">Terms</a><a href=\"/support\">Support</a><a href=\"/manage\">Manage Profile</a></nav></main>";
}
