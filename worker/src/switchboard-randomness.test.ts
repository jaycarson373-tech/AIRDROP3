import assert from "node:assert/strict";
import test from "node:test";
import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

const authority = Keypair.fromSeed(Uint8Array.from({ length: 32 }, (_, index) => index + 1));
process.env.HELIUS_RPC_URL = "https://api.devnet.solana.com";
process.env.SOURCE_TOKEN_MINT = "11111111111111111111111111111111";
process.env.TREASURY_WALLET_SECRET = bs58.encode(authority.secretKey);
process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE = "test-service-role";
process.env.REWARD_MODE = "sol";
process.env.SOLANA_CLUSTER = "devnet";

const {
  casinoRandomnessCommitBinding,
  casinoRandomnessRevealBinding,
  deriveCasinoRandomnessKeypair
} = await import("./switchboard-randomness.js");

const firstRound = {
  round_id: "CS-2026-07-28T12:00:00.000Z",
  snapshot_hash: "ab".repeat(32)
};

test("derives a deterministic, round-bound Switchboard randomness account", () => {
  const first = deriveCasinoRandomnessKeypair(authority, firstRound);
  const replay = deriveCasinoRandomnessKeypair(authority, firstRound);
  const next = deriveCasinoRandomnessKeypair(authority, {
    ...firstRound,
    round_id: "CS-2026-07-28T12:15:00.000Z"
  });

  assert.equal(first.publicKey.toBase58(), replay.publicKey.toBase58());
  assert.notEqual(first.publicKey.toBase58(), next.publicKey.toBase58());
});

test("binds commit and reveal memos to the round, snapshot, account, and commit", () => {
  const account = deriveCasinoRandomnessKeypair(authority, firstRound).publicKey;
  const commit = casinoRandomnessCommitBinding(firstRound, account);
  const reveal = casinoRandomnessRevealBinding(firstRound, account, "commit-signature");

  assert.equal(
    commit,
    `CASINO_SB_COMMIT_V1|${firstRound.round_id}|${firstRound.snapshot_hash}|${account.toBase58()}`
  );
  assert.equal(
    reveal,
    `CASINO_SB_REVEAL_V1|${firstRound.round_id}|${firstRound.snapshot_hash}|${account.toBase58()}|commit-signature`
  );
});
