import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateOwnerPitchProfile } from "../functions/shared/contracts.js";

test("private owner fixtures are three valid, distinct profiles", async () => {
  const fixtures = JSON.parse(await readFile(new URL("../scripts/fixtures/private-owner-profiles.json", import.meta.url), "utf8")) as Array<{ key: string; profile: unknown }>;
  assert.equal(fixtures.length, 3);
  assert.equal(new Set(fixtures.map(({ key }) => key)).size, 3);
  const profiles = fixtures.map(({ profile }) => validateOwnerPitchProfile(profile));
  assert.equal(new Set(profiles.map(({ animal_persona }) => animal_persona)).size, 3);
});
