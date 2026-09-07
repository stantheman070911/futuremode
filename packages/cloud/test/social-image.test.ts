import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";
import { portraitPngDataUri } from "../functions/profile-og-image/index.js";
import { clampVisualText, renderSocialSvg, visualTextWidth } from "../functions/shared/social-image.js";

test("renders one escaped 1200 by 630 social image with a real QR matrix", () => {
  const svg = renderSocialSvg({
    profile: { animalPersona: "<script>跳舞羊駝</script>", summary: "舞蹈 & 身體語言", signals: ["肩線提示", "低光 movement", "情緒表達"] },
    profileUrl: "https://example.com/p/stable_slug_123",
    portraitDataUri: "data:image/png;base64,YWJj",
  });
  assert.match(svg, /width="1200" height="630"/);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;跳舞羊駝&lt;\/script&gt;/);
  assert.ok((svg.match(/fill="#17213d"/g) ?? []).length > 100, "QR should contain a populated module matrix");
  assert.match(svg, /掃描查看完整介紹/);
  assert.match(svg, /<image href="data:image\/png;base64,YWJj"/);
  assert.match(svg, /<rect x="78" y="74" width="165" height="165" rx="27"/);
  assert.match(svg, /<image[^>]+x="83" y="79" width="155" height="155"/);
  assert.match(svg, /transform="translate\(278 74\)"/);
  assert.match(svg, /<text x="278" y="205"/);
  assert.match(svg, /<g transform="translate\(78 490\)"/);
});

test("converts stored WebP portraits to a PNG data URI supported by the social-card renderer", async () => {
  const webp = await sharp({ create: { width: 192, height: 192, channels: 4, background: "#111111" } }).webp().toBuffer();
  const uri = await portraitPngDataUri(webp);
  assert.match(uri, /^data:image\/png;base64,/);
  const metadata = await sharp(Buffer.from(uri.split(",")[1], "base64")).metadata();
  assert.deepEqual([metadata.format, metadata.width, metadata.height], ["png", 192, 192]);
});

test("clamps mixed CJK and technical text by visual width", () => {
  const value = clampVisualText("跨境 pass-through entity 的 treaty 判斷與雙重課稅", 24);
  assert.ok(visualTextWidth(value) <= 24);
  assert.match(value, /…$/);
});
