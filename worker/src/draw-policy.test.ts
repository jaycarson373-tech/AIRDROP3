import assert from "node:assert/strict";
import test from "node:test";
import { equalRewardShares, selectWeightedRecipients } from "./draw-policy.js";

const candidates = Array.from({ length: 40 }, (_, index) => ({
  wallet: `wallet-${String(index).padStart(2, "0")}`,
  uiBalance: 1_000_000 + index * 100_000,
  holdMultiplierBps: 10_000 + index * 100
}));

test("selects ten unique winners deterministically", () => {
  const first = selectWeightedRecipients("2026-08-11T16:15:00.000Z", candidates, 10);
  const second = selectWeightedRecipients("2026-08-11T16:15:00.000Z", candidates, 10);
  assert.equal(first.length, 10);
  assert.equal(new Set(first.map(({ wallet }) => wallet)).size, 10);
  assert.deepEqual(first, second);
});

test("returns every eligible holder when fewer than ten qualify", () => {
  const selected = selectWeightedRecipients("small-pool", candidates.slice(0, 7), 10);
  assert.equal(selected.length, 7);
});

test("larger balances and longer holds increase selection frequency", () => {
  const field = [
    { wallet: "base", uiBalance: 1_000_000, holdMultiplierBps: 10_000 },
    { wallet: "weighted", uiBalance: 9_000_000, holdMultiplierBps: 13_500 }
  ];
  let weightedWins = 0;
  for (let index = 0; index < 500; index += 1) {
    if (selectWeightedRecipients(`epoch-${index}`, field, 1)[0].wallet === "weighted") weightedWins += 1;
  }
  assert.ok(weightedWins > 350, `expected weighted wallet to win materially more often; got ${weightedWins}/500`);
});

test("equal shares differ by at most one raw unit and preserve the pool", () => {
  const shares = equalRewardShares(candidates.slice(0, 10).map(({ wallet }) => wallet), 103n);
  assert.equal(shares.reduce((sum, share) => sum + share.amount, 0n), 103n);
  assert.equal(shares[0].amount, 11n);
  assert.equal(shares[9].amount, 10n);
});
