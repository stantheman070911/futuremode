import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mediaDir = resolve(packageDir, "static", "assets", "memory");

function countSignature(buffer: Buffer, signature: number[]): number {
  let count = 0;
  for (let index = 0; index <= buffer.length - signature.length; index += 1) {
    if (signature.every((byte, offset) => buffer[index + offset] === byte)) count += 1;
  }
  return count;
}

for (const [provider, basename, expectedHeight] of [
  ["ChatGPT", "chatgpt-enable-memory", 1208],
  ["Claude", "claude-enable-memory", 1304],
] as const) {
  test(`${provider} memory guidance ships as a proportionally scaled animation and reduced-motion poster`, async () => {
    const [gif, png] = await Promise.all([
      readFile(resolve(mediaDir, `${basename}.gif`)),
      readFile(resolve(mediaDir, `${basename}.png`)),
    ]);

    assert.equal(gif.subarray(0, 6).toString("ascii"), "GIF89a");
    assert.equal(gif.readUInt16LE(6), 600);
    assert.equal(gif.readUInt16LE(8), expectedHeight);
    assert.ok(countSignature(gif, [0x21, 0xf9, 0x04]) > 20, "GIF should contain many animation frames");
    assert.ok(gif.byteLength < 4 * 1024 * 1024, "GIF should remain practical on mobile");

    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
    assert.equal(png.readUInt32BE(16), 600);
    assert.equal(png.readUInt32BE(20), expectedHeight);
  });
}
