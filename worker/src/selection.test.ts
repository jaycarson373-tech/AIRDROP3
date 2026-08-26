import assert from "node:assert/strict";
import test from "node:test";
import { holdingMultiplierBps, splitEvenly, weightedDeterministicSelect } from "./selection.js";

test("holding multiplier follows Pump Money milestones", () => {
  const now = Date.UTC(2026, 0, 31);
  assert.equal(holdingMultiplierBps(new Date(now - 12 * 60 * 60 * 1000).toISOString(), now), 10_000);
  assert.equal(holdingMultiplierBps(new Date(now - 24 * 60 * 60 * 1000).toISOString(), now), 15_000);
  assert.equal(holdingMultiplierBps(new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), now), 20_000);
  assert.equal(holdingMultiplierBps(new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(), now), 50_000);
  assert.equal(holdingMultiplierBps(new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(), now), 100_000);
});

test("selection is deterministic and unique", () => {
  const candidates = Array.from({ length: 30 }, (_, index) => ({ item: index, stableId: `wallet-${index}`, weightBps: 10_000 }));
  const first = weightedDeterministicSelect("round-seed", candidates, 10);
  const second = weightedDeterministicSelect("round-seed", candidates, 10);
  assert.deepEqual(first, second);
  assert.equal(new Set(first).size, 10);
});

test("equal split preserves the exact round total", () => {
  const shares = splitEvenly(103n, 10);
  assert.equal(shares.reduce((sum, value) => sum + value, 0n), 103n);
  assert.ok(shares.every((value) => value === 10n || value === 11n));
});
