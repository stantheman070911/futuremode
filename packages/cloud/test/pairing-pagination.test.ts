import assert from "node:assert/strict";
import test from "node:test";
import { paginateResultSetItems } from "../functions/pairing/index.js";

test("serves the complete ordered result set ten profiles per page", () => {
  const ordered = Array.from({ length: 11 }, (_, index) => ({
    candidateId: `candidate-${index + 1}`,
    candidateVersionId: `version-${index + 1}`,
    edgeSk: `edge-${index + 1}`,
    pairId: `pair-${index + 1}`,
  }));
  const first = paginateResultSetItems(ordered, 1);
  const second = paginateResultSetItems(ordered, 2);
  assert.equal(first.total, 11);
  assert.equal(first.totalPages, 2);
  assert.equal(first.items.length, 10);
  assert.deepEqual(first.items, ordered.slice(0, 10));
  assert.equal(second.safePage, 2);
  assert.deepEqual(second.items, ordered.slice(10));
});
