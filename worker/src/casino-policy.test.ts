import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateCasinoFees,
  gameForRound,
  selectCasinoWinners,
  snapshotHash,
  type CasinoFeePolicy
} from "./casino-policy.js";

const policy: CasinoFeePolicy = {
  roundPayoutBps: 8_000,
  jackpotBps: 2_000,
  topThreeSplitBps: [5_000, 3_000, 2_000],
  jackpotInterval: 25
};

test("rotates through all ten games", () => {
  assert.equal(gameForRound(1), "PONG");
  assert.equal(gameForRound(10), "SLOTS");
  assert.equal(gameForRound(11), "PONG");
});

test("splits each round 80/20 and top three 50/30/20 without losing lamports", () => {
  const allocation = allocateCasinoFees(1_000_003n, 0n, 1, policy);
  assert.equal(allocation.roundPoolLamports, 800_002n);
  assert.equal(allocation.jackpotContributionLamports, 200_001n);
  assert.deepEqual(allocation.winnerRoundPayoutsLamports, [400_002n, 240_000n, 160_000n]);
  assert.equal(
    allocation.winnerRoundPayoutsLamports.reduce((sum, amount) => sum + amount, 0n),
    allocation.roundPoolLamports
  );
  assert.equal(allocation.roundPoolLamports + allocation.jackpotContributionLamports, 1_000_003n);
});

test("carries jackpot and pays the full balance to first place every 25th round", () => {
  const allocation = allocateCasinoFees(1_000_000n, 4_800_000n, 25, policy);
  assert.equal(allocation.isJackpotRound, true);
  assert.equal(allocation.jackpotPayoutLamports, 5_000_000n);
  assert.equal(allocation.jackpotClosingLamports, 0n);
  assert.deepEqual(allocation.winnerTotalPayoutsLamports, [5_400_000n, 240_000n, 160_000n]);
});

test("winner selection is deterministic, unique, and bound to the round", () => {
  const entrants = ["11111111111111111111111111111111", "wallet-b", "wallet-c", "wallet-d"].map((wallet) => ({
    wallet
  }));
  const randomness = "ab".repeat(32);
  const first = selectCasinoWinners("CS-00000001", "PONG", randomness, entrants);
  const replay = selectCasinoWinners("CS-00000001", "PONG", randomness, entrants);
  const nextRound = selectCasinoWinners("CS-00000002", "CRASH", randomness, entrants);

  assert.deepEqual(first, replay);
  assert.equal(new Set(first.map((winner) => winner.wallet)).size, 3);
  assert.notDeepEqual(first, nextRound);
});

test("snapshot commitment is order-independent", () => {
  const one = snapshotHash([
    { wallet: "a", rawBalance: 10n },
    { wallet: "b", rawBalance: 20n }
  ]);
  const two = snapshotHash([
    { wallet: "b", rawBalance: 20n },
    { wallet: "a", rawBalance: 10n }
  ]);
  assert.equal(one, two);
});
