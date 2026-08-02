import assert from "node:assert/strict";
import test from "node:test";
import { allocateRewardBudget } from "./reward-split.js";

test("splits the GOAT reward budget evenly without losing a lamport", () => {
  const allocations = allocateRewardBudget(1_000_001n, [5_000, 5_000]);
  assert.deepEqual(allocations, [500_000n, 500_001n]);
  assert.equal(allocations.reduce((sum, amount) => sum + amount, 0n), 1_000_001n);
});

test("rejects incomplete or invalid reward splits", () => {
  assert.throws(() => allocateRewardBudget(1_000n, [5_000]), /at least two/);
  assert.throws(() => allocateRewardBudget(1_000n, [6_000, 3_000]), /totaling 10000/);
  assert.throws(() => allocateRewardBudget(-1n, [5_000, 5_000]), /cannot be negative/);
});
