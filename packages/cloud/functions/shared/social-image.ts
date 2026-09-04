import QRCode from "qrcode";

export function escapeXml(value: unknown): string {
  return String(value ?? "").replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character] ?? character));
}

export function visualTextWidth(value: string): number {
  return Array.from(value).reduce((total, character) => total + ((character.codePointAt(0) || 0) >= 0x2e80 ? 2 : 1), 0);
}

export function clampVisualText(value: unknown, maxUnits: number): string {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (visualTextWidth(normalized) <= maxUnits) return normalized;
  let output = "";
  for (const character of normalized) {
    if (visualTextWidth(`${output}${character}…`) > maxUnits) break;
    output += character;
  }
  return `${output.trim()}…`;
}

export function linesFor(value: unknown, maxUnits: number, maxLines: number): string[] {
  const source = String(value ?? "").replace(/\s+/g, " ").trim();
  const characters = Array.from(source);
  const lines: string[] = [];
  let line = "";
  for (const character of characters) {
    if (visualTextWidth(line + character) > maxUnits && line) {
      lines.push(line.trim());
      line = character;
      if (lines.length === maxLines) break;
    } else line += character;
  }
  if (line && lines.length < maxLines) lines.push(line.trim());
  if (!lines.length) lines.push("讓你的 Agent 介紹你");
  if (lines.length === maxLines && visualTextWidth(source) > lines.reduce((sum, item) => sum + visualTextWidth(item), 0)) {
    lines[maxLines - 1] = clampVisualText(lines[maxLines - 1], maxUnits - 1);
  }
  return lines;
}

function qrSvg(value: string, x: number, y: number, size: number): string {
  const qr = QRCode.create(value, { errorCorrectionLevel: "H" });
  const modules = qr.modules;
  const quiet = 4;
  const count = modules.size + quiet * 2;
  const cell = size / count;
  const squares: string[] = [`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="18" fill="#fff"/>`];
  for (let row = 0; row < modules.size; row += 1) {
    for (let column = 0; column < modules.size; column += 1) {
      if (modules.get(row, column)) squares.push(`<rect x="${(x + (column + quiet) * cell).toFixed(2)}" y="${(y + (row + quiet) * cell).toFixed(2)}" width="${(cell + 0.15).toFixed(2)}" height="${(cell + 0.15).toFixed(2)}" fill="#17213d"/>`);
    }
  }
  return squares.join("");
}

export interface SocialProfile {
  displayName: string;
  animalPersona: string;
  summary: string;
  signals: string[];
}

export function renderSocialSvg(input: { profile?: SocialProfile; profileUrl?: string; fontBase64?: string }): string {
  const profile = input.profile;
  const title = profile?.displayName || "PitchYourOwner";
  const animal = profile?.animalPersona || "你的 Agent 已經知道，誰值得認識你";
  const summary = profile?.summary || "把反覆出現的興趣、動機與難題，變成一份你確認過的介紹。";
  const titleLines = linesFor(title, 25, 2);
  const summaryLines = linesFor(summary, profile ? 47 : 58, 3);
  const signals = (profile?.signals ?? ["AI-assisted pitch", "Owner review", "Explainable matches"]).slice(0, 3).map((item) => clampVisualText(item, 23));
  const fontFace = input.fontBase64 ? `<defs><style>@font-face{font-family:PyoOg;src:url(data:font/otf;base64,${input.fontBase64}) format('opentype');font-weight:700}</style></defs>` : "";
  const qr = profile && input.profileUrl ? qrSvg(input.profileUrl, 900, 205, 205) : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" font-family="PyoOg,Arial,sans-serif">${fontFace}
  <rect width="1200" height="630" fill="#fff6ec"/><circle cx="1080" cy="72" r="170" fill="#eee7ff"/><circle cx="92" cy="594" r="170" fill="#e8fff4"/>
  <rect x="38" y="38" width="1124" height="554" rx="34" fill="#fffdf8" stroke="#17213d" stroke-width="8"/>
  <g transform="translate(78 74)"><rect width="292" height="58" rx="29" fill="#ffcf55" stroke="#17213d" stroke-width="4"/><text x="28" y="39" font-size="25" font-weight="700" fill="#17213d">PitchYourOwner</text></g>
  ${titleLines.map((line, index) => `<text x="78" y="${205 + index * 57}" font-size="50" font-weight="700" fill="#17213d">${escapeXml(line)}</text>`).join("")}
  <text x="78" y="${titleLines.length > 1 ? 325 : 270}" font-size="27" font-weight="700" fill="#7258e8">${escapeXml(clampVisualText(animal, 39))}</text>
  ${summaryLines.map((line, index) => `<text x="78" y="${365 + index * 34}" font-size="23" font-weight="700" fill="#3d435f">${escapeXml(line)}</text>`).join("")}
  ${signals.map((signal, index) => `<g transform="translate(${78 + index * 255} 490)"><rect width="232" height="48" rx="24" fill="#fff" stroke="#17213d" stroke-width="3"/><text x="18" y="31" font-size="16" font-weight="700" fill="#17213d"># ${escapeXml(signal)}</text></g>`).join("")}
  ${qr}${profile ? `<text x="1002" y="440" text-anchor="middle" font-size="18" font-weight="700" fill="#17213d">掃描查看完整介紹</text>` : `<text x="910" y="286" font-size="70" font-weight="700" fill="#7258e8">→</text><text x="835" y="335" font-size="21" font-weight="700" fill="#17213d">讓 Agent 找到值得認識的人</text>`}
  <text x="78" y="568" font-size="18" font-weight="700" fill="#686b7d">Your agent knows you. Let it pitch you.</text></svg>`;
}
