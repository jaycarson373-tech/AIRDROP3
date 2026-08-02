import assert from "node:assert/strict";
import test from "node:test";
import { hasDetectedSale, holderMultiplierBps } from "./holder-policy.js";

test("a decrease of one raw token unit is a detected sale", () => {
  assert.equal(hasDetectedSale(1_000_000n, 999_999n), true);
  assert.equal(hasDetectedSale(1_000_000n, 1_000_000n), false);
  assert.equal(hasDetectedSale(1_000_000n, 1_000_001n), false);
});

test("holding multipliers remain modest and time based", () => {
  const since = "2026-01-01T00:00:00.000Z";
  const atDays = (days: number) => Date.parse(since) + days * 24 * 60 * 60 * 1000;

  assert.equal(holderMultiplierBps(since, atDays(0)), 10_000);
  assert.equal(holderMultiplierBps(since, atDays(1)), 10_500);
  assert.equal(holderMultiplierBps(since, atDays(3)), 11_000);
  assert.equal(holderMultiplierBps(since, atDays(7)), 12_000);
  assert.equal(holderMultiplierBps(since, atDays(30)), 13_500);
});
