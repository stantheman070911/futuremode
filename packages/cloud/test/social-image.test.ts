import assert from "node:assert/strict";
import test from "node:test";
import { clampVisualText, renderSocialSvg, visualTextWidth } from "../functions/shared/social-image.js";

test("renders one escaped 1200 by 630 social image with a real QR matrix", () => {
  const svg = renderSocialSvg({
    profile: { displayName: "<script>owner</script>", animalPersona: "跳著舞的粉色羊駝", summary: "舞蹈 & 身體語言", signals: ["肩線提示", "低光 movement", "情緒表達"] },
    profileUrl: "https://example.com/p/stable_slug_123",
  });
  assert.match(svg, /width="1200" height="630"/);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;owner&lt;\/script&gt;/);
  assert.ok((svg.match(/fill="#17213d"/g) ?? []).length > 100, "QR should contain a populated module matrix");
  assert.match(svg, /掃描查看完整介紹/);
});

test("clamps mixed CJK and technical text by visual width", () => {
  const value = clampVisualText("跨境 pass-through entity 的 treaty 判斷與雙重課稅", 24);
  assert.ok(visualTextWidth(value) <= 24);
  assert.match(value, /…$/);
});
