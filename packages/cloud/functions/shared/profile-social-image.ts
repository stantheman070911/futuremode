function escapeXml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[character] ?? character));
}

function clampText(value: unknown, limit: number): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function visualTextWidth(text: string): number {
  return Array.from(String(text || "")).reduce((total, character) => {
    const code = character.codePointAt(0) || 0;
    return total + (code >= 0x2e80 ? 2 : 1);
  }, 0);
}

function clampVisualText(value: unknown, maxUnits: number): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (visualTextWidth(text) <= maxUnits) return text;
  let output = "";
  let width = 0;
  for (const character of Array.from(text)) {
    const characterWidth = visualTextWidth(character);
    if (width + characterWidth > Math.max(1, maxUnits - 1)) break;
    output += character;
    width += characterWidth;
  }
  return `${output.trim()}…`;
}

function linesFor(value: unknown, maxChars: number, maxLines: number): string[] {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  const hasWordBoundaries = normalized.includes(" ");
  const words = hasWordBoundaries ? normalized.split(" ").filter(Boolean) : Array.from(normalized);
  const separator = hasWordBoundaries ? " " : "";
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current}${separator}${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (!lines.length) lines.push("PitchYourOwner Profile");
  if (lines.length === maxLines && words.join(separator).length > lines.join(separator).length) {
    lines[maxLines - 1] = clampText(lines[maxLines - 1], Math.max(8, maxChars - 1));
  }
  return lines.slice(0, maxLines);
}

export interface SocialImageProfile {
  profileHeadline?: string;
  profileMarkdown?: string;
  locale?: string;
  skills?: string[];
  animalSlug?: string;
}

export function renderProfileSocialSvg(input: { profile: SocialImageProfile; slug: string; publicOrigin?: string; fontBase64?: string }): string {
  const publicOrigin = String(input.publicOrigin || "https://pitchyourowner.oysterun.com").replace(/\/+$/, "");
  const profileUrl = `${publicOrigin}/p/${input.slug}`;
  const headline = input.profile.profileHeadline || "PitchYourOwner Profile";
  const animal = input.profile.animalSlug || "otter";
  const skills = (input.profile.skills ?? []).slice(0, 3).map((skill) => clampVisualText(skill, 20));
  const headlineLines = linesFor(headline, 26, 3);
  const prompt = String(input.profile.locale || "").startsWith("zh")
    ? "讓相關的人從你的作品開始認識你"
    : "Meet people through the work you already chose to share";
  const skillNodes = skills.map((skill, index) => {
    const x = 86 + index * 255;
    return `<g transform="translate(${x} 416)"><rect width="226" height="48" rx="24" fill="#fffdf8" stroke="#17213d" stroke-width="3"/><text x="22" y="31" font-size="16" font-weight="700" fill="#17213d"># ${escapeXml(skill)}</text></g>`;
  }).join("");
  const titleNodes = headlineLines.map((line, index) => `<text x="84" y="${180 + index * 55}" font-size="48" font-weight="700" fill="#17213d">${escapeXml(line)}</text>`).join("");
  const fontFace = input.fontBase64
    ? `<defs><style>@font-face{font-family:PitchYourOwnerOg;src:url(data:font/otf;base64,${input.fontBase64}) format('opentype');font-weight:700;}</style></defs>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="PitchYourOwnerOg, Arial, Helvetica, sans-serif">
  ${fontFace}
  <rect width="1200" height="630" fill="#fff6ec"/>
  <circle cx="1030" cy="82" r="138" fill="#eee7ff"/>
  <circle cx="113" cy="555" r="168" fill="#e8fff4"/>
  <rect x="42" y="42" width="1116" height="546" rx="34" fill="#ffffff" stroke="#17213d" stroke-width="8"/>
  <g transform="translate(82 78)">
    <rect width="282" height="58" rx="29" fill="#ff674d" stroke="#17213d" stroke-width="4"/>
    <circle cx="34" cy="29" r="16" fill="#fff6ec" stroke="#17213d" stroke-width="3"/>
    <path d="M28 29h12M34 23v12" stroke="#17213d" stroke-width="3" stroke-linecap="round"/>
    <text x="62" y="38" font-size="25" font-weight="700" fill="#17213d" letter-spacing="1">PitchYourOwner</text>
  </g>
  ${titleNodes}
  <text x="84" y="358" font-size="30" font-weight="700" fill="#7258e8">${escapeXml(animal)}</text>
  <text x="84" y="392" font-size="22" font-weight="700" fill="#3d435f">${escapeXml(prompt)}</text>
  ${skillNodes}
  <g transform="translate(850 205)">
    <rect width="238" height="238" rx="28" fill="#fff0b8" stroke="#17213d" stroke-width="5"/>
    <text x="119" y="102" text-anchor="middle" font-size="24" font-weight="700" fill="#17213d">OPEN</text>
    <text x="119" y="136" text-anchor="middle" font-size="24" font-weight="700" fill="#17213d">PROFILE</text>
    <path d="M84 164h70M154 164l-24-24M154 164l-24 24" stroke="#17213d" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <text x="84" y="518" font-size="25" font-weight="700" fill="#17213d">${escapeXml(profileUrl)}</text>
  <text x="938" y="522" text-anchor="middle" font-size="20" font-weight="700" fill="#17213d">PITCHYOUROWNER NETWORK</text>
</svg>`;
}
