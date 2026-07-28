import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { config } from "./config.js";
import type { ScheduledCasinoGameResult } from "./casino-policy.js";

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRole, {
  auth: { persistSession: false }
});

export type EpochStatus = "running" | "completed" | "failed" | "skipped";

export type PayoutMetadata = {
  normalRewardAmountRaw?: string;
  normalRewardAmount?: string;
  rewardMint?: string;
  rewardAsset?: string;
};

export type CasinoRoundRow = {
  round_id: string;
  round_sequence: number | string;
  epoch_id: string;
  game: string;
  status: "awaiting_randomness" | "ready" | "settling" | "settled" | "skipped" | "failed";
  eligible_count: number;
  snapshot_hash: string;
  claimed_lamports: string | number;
  round_pool_lamports: string | number;
  jackpot_opening_lamports: string | number;
  jackpot_contribution_lamports: string | number;
  jackpot_payout_lamports: string | number;
  jackpot_closing_lamports: string | number;
  is_jackpot_round: boolean;
  randomness_provider: string | null;
  randomness_account: string | null;
  randomness_commit_slot: number | string | null;
  randomness_hex: string | null;
  randomness_commit_tx_sig: string | null;
  randomness_reveal_tx_sig: string | null;
  randomness_verified_at: string | null;
  settlement_tx_sig: string | null;
  settlement_transaction_base64: string | null;
  settlement_last_valid_block_height: number | string | null;
  started_at: string;
  playback_started_at: string | null;
  playback_ends_at: string | null;
  results_committed_at: string | null;
  results_hash: string | null;
};

function assertNoError<T>(result: { data: T; error: unknown }, label: string): T {
  if (result.error) throw new Error(`${label}: ${JSON.stringify(result.error)}`);
  return result.data;
}

function warnNonFatal(label: string, error: unknown) {
  console.warn(`${label}: ${JSON.stringify(error)}`);
}

export async function getEpoch(epochId: string) {
  const result = await supabase.from("epochs").select("*").eq("epoch_id", epochId).maybeSingle();
  return assertNoError(result, "get epoch");
}

export async function startEpoch(epochId: string, scoutSignalId?: string | null) {
  const result = await supabase
    .from("epochs")
    .upsert({ epoch_id: epochId, status: "running", started_at: new Date().toISOString(), scout_signal_id: scoutSignalId ?? null })
    .select()
    .single();
  if (result.error && JSON.stringify(result.error).includes("scout_signal_id")) {
    const fallback = await supabase
      .from("epochs")
      .upsert({ epoch_id: epochId, status: "running", started_at: new Date().toISOString() })
      .select()
      .single();
    return assertNoError(fallback, "start epoch fallback");
  }
  return assertNoError(result, "start epoch");
}

export async function completeEpoch(
  epochId: string,
  fields: {
    eligible_count: number;
    reward_bought: string;
    reward_distributed: string;
    status?: EpochStatus;
  }
) {
  const result = await supabase
    .from("epochs")
    .update({
      ...fields,
      status: fields.status ?? "completed",
      completed_at: new Date().toISOString()
    })
    .eq("epoch_id", epochId);
  assertNoError(result, "complete epoch");
}

export async function failEpoch(epochId: string, error: unknown) {
  const result = await supabase
    .from("epochs")
    .update({
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      completed_at: new Date().toISOString()
    })
    .eq("epoch_id", epochId);
  assertNoError(result, "fail epoch");
}

export async function persistSnapshot(
  epochId: string,
  rows: { wallet: string; source_balance: string; source_balance_raw: string; holder_pct: string }[]
) {
  if (!rows.length) return;
  const result = await supabase.from("snapshots").upsert(
    rows.map((row) => ({ epoch_id: epochId, ...row })),
    { onConflict: "epoch_id,wallet" }
  );
  assertNoError(result, "persist snapshot");
}

export async function getClaim(epochId: string) {
  const result = await supabase.from("claims").select("*").eq("epoch_id", epochId).maybeSingle();
  return assertNoError(result, "get claim");
}

export async function recordClaim(epochId: string, amountClaimed: string, txSig: string | null) {
  const result = await supabase
    .from("claims")
    .upsert({ epoch_id: epochId, amount_claimed: amountClaimed, tx_sig: txSig });
  assertNoError(result, "record claim");
}

export async function recordBuy(
  epochId: string,
  baseSpentLamports: string,
  rewardReceivedRaw: string,
  rewardReceived: string,
  txSig: string | null,
  metadata?: {
    pfpRewardLamports?: string;
    pfpRewardTxSig?: string | null;
  }
) {
  const row = {
    epoch_id: epochId,
    base_spent_lamports: baseSpentLamports,
    reward_received_raw: rewardReceivedRaw,
    reward_received: rewardReceived,
    reward_mint: config.rewardTokenMint.toBase58(),
    reward_asset: config.rewardTokenSymbol,
    tx_sig: txSig,
    ...(metadata?.pfpRewardLamports !== undefined ? { pfp_reward_lamports: metadata.pfpRewardLamports } : {}),
    ...(metadata?.pfpRewardTxSig !== undefined ? { pfp_reward_tx_sig: metadata.pfpRewardTxSig } : {})
  };
  const result = await supabase.from("buys").upsert(row);
  if (result.error) {
    warnNonFatal("record buy with extended metadata failed; retrying minimal buy row", result.error);
    const fallback = await supabase.from("buys").upsert({
      epoch_id: epochId,
      base_spent_lamports: baseSpentLamports,
      reward_received_raw: rewardReceivedRaw,
      reward_received: rewardReceived,
      tx_sig: txSig
    });
    assertNoError(fallback, "record buy fallback");
    return;
  }
  assertNoError(result, "record buy");
}

export async function getBuy(epochId: string) {
  const result = await supabase.from("buys").select("*").eq("epoch_id", epochId).maybeSingle();
  return assertNoError(result, "get buy");
}

export async function recordPfpReward(epochId: string, pfpRewardLamports: string, pfpRewardTxSig: string | null) {
  const result = await supabase.from("buys").upsert({
    epoch_id: epochId,
    base_spent_lamports: "0",
    reward_received_raw: "0",
    reward_received: "0",
    tx_sig: null,
    pfp_reward_lamports: pfpRewardLamports,
    pfp_reward_tx_sig: pfpRewardTxSig
  });
  if (result.error) {
    warnNonFatal("record PFP reward failed; continuing epoch", result.error);
  }
}

function payoutMetadataFields(metadata: PayoutMetadata | undefined, rewardAmountRaw: string, rewardAmount: string) {
  return {
    normal_reward_amount_raw: metadata?.normalRewardAmountRaw ?? rewardAmountRaw,
    normal_reward_amount: metadata?.normalRewardAmount ?? rewardAmount,
    golden_bonus_reward_raw: "0",
    golden_bonus_reward: "0",
    golden_multiplier: 1,
    is_golden: false,
    golden_capped: false,
    reward_mint: metadata?.rewardMint ?? config.rewardTokenMint.toBase58(),
    reward_asset: metadata?.rewardAsset ?? config.rewardTokenSymbol
  };
}

function withoutRewardIdentity<T extends Record<string, unknown>>(row: T) {
  const { reward_mint: _rewardMint, reward_asset: _rewardAsset, ...rest } = row;
  return rest;
}

export async function planPayout(
  epochId: string,
  wallet: string,
  rewardAmountRaw: string,
  rewardAmount: string,
  metadata?: PayoutMetadata
) {
  const idempotencyKey = `${epochId}:${wallet}`;
  const row = {
    epoch_id: epochId,
    wallet,
    reward_amount_raw: rewardAmountRaw,
    reward_amount: rewardAmount,
    ...payoutMetadataFields(metadata, rewardAmountRaw, rewardAmount),
    idempotency_key: idempotencyKey,
    status: "planned",
    updated_at: new Date().toISOString()
  };
  const result = await supabase
    .from("payouts")
    .upsert(row, { onConflict: "idempotency_key", ignoreDuplicates: true })
    .select()
    .maybeSingle();
  if (result.error) {
    warnNonFatal("plan payout with reward identity failed; retrying minimal payout row", result.error);
    const fallback = await supabase
      .from("payouts")
      .upsert(withoutRewardIdentity(row), { onConflict: "idempotency_key", ignoreDuplicates: true })
      .select()
      .maybeSingle();
    return assertNoError(fallback, "plan payout fallback");
  }
  return assertNoError(result, "plan payout");
}

export async function dryRunPayout(
  epochId: string,
  wallet: string,
  rewardAmountRaw: string,
  rewardAmount: string,
  metadata?: PayoutMetadata
) {
  const row = {
    epoch_id: epochId,
    wallet,
    reward_amount_raw: rewardAmountRaw,
    reward_amount: rewardAmount,
    ...payoutMetadataFields(metadata, rewardAmountRaw, rewardAmount),
    idempotency_key: `${epochId}:${wallet}`,
    status: "dry_run",
    updated_at: new Date().toISOString()
  };
  const result = await supabase.from("payouts").upsert(row);
  if (result.error) {
    warnNonFatal("dry-run payout with reward identity failed; retrying minimal payout row", result.error);
    const fallback = await supabase.from("payouts").upsert(withoutRewardIdentity(row));
    assertNoError(fallback, "dry-run payout fallback");
    return;
  }
  assertNoError(result, "dry-run payout");
}

export async function settlePayout(epochId: string, wallet: string, txSig: string) {
  const result = await supabase
    .from("payouts")
    .update({ status: "settled", tx_sig: txSig, updated_at: new Date().toISOString() })
    .eq("epoch_id", epochId)
    .eq("wallet", wallet);
  assertNoError(result, "settle payout");
}

export async function failPayout(epochId: string, wallet: string, error: unknown) {
  const result = await supabase
    .from("payouts")
    .update({
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
      updated_at: new Date().toISOString()
    })
    .eq("epoch_id", epochId)
    .eq("wallet", wallet);
  assertNoError(result, "fail payout");
}

export async function createCasinoRound(
  epochId: string,
  snapshotHash: string,
  eligibleCount: number,
  claimedLamports: string
): Promise<CasinoRoundRow> {
  const existing = await supabase.from("casino_rounds").select("*").eq("epoch_id", epochId).maybeSingle();
  const existingRow = assertNoError(existing, "get casino round");
  if (existingRow) {
    if (existingRow.snapshot_hash !== snapshotHash) {
      throw new Error(`Casino snapshot commitment mismatch for ${epochId}`);
    }
    return existingRow as CasinoRoundRow;
  }

  const roundId = `CS-${epochId}`;
  const result = await supabase
    .from("casino_rounds")
    .insert({
      round_id: roundId,
      epoch_id: epochId,
      game: "PENDING",
      status: "awaiting_randomness",
      eligible_count: eligibleCount,
      snapshot_hash: snapshotHash,
      claimed_lamports: claimedLamports
    })
    .select()
    .single();
  return assertNoError(result, "create casino round") as CasinoRoundRow;
}

export async function getCasinoRoundForEpoch(epochId: string) {
  const result = await supabase.from("casino_rounds").select("*").eq("epoch_id", epochId).maybeSingle();
  return assertNoError(result, "get casino round for epoch") as CasinoRoundRow | null;
}

export async function setCasinoRoundGame(roundId: string, game: string): Promise<CasinoRoundRow> {
  const result = await supabase
    .from("casino_rounds")
    .update({ game })
    .eq("round_id", roundId)
    .select()
    .single();
  return assertNoError(result, "set casino round game") as CasinoRoundRow;
}

export async function setCasinoRoundClaim(roundId: string, claimedLamports: bigint) {
  const result = await supabase
    .from("casino_rounds")
    .update({ claimed_lamports: claimedLamports.toString() })
    .eq("round_id", roundId);
  assertNoError(result, "set casino round claim");
}

export async function casinoJackpotOpening(roundSequence: number) {
  const result = await supabase
    .from("casino_rounds")
    .select("round_sequence,status,jackpot_closing_lamports")
    .lt("round_sequence", roundSequence)
    .order("round_sequence", { ascending: false })
    .limit(1)
    .maybeSingle();
  const previous = assertNoError(result, "get casino jackpot opening") as
    | { status: string; jackpot_closing_lamports: string | number }
    | null;
  if (!previous) return 0n;
  if (previous.status !== "settled" && previous.status !== "skipped") {
    throw new Error("Casino rounds must settle in sequence before the jackpot can advance");
  }
  return BigInt(previous.jackpot_closing_lamports ?? 0);
}

export async function pendingCasinoRounds() {
  const result = await supabase
    .from("casino_rounds")
    .select("*")
    .in("status", ["awaiting_randomness", "ready", "settling"])
    .order("round_sequence", { ascending: true });
  return assertNoError(result, "get pending casino rounds") as CasinoRoundRow[];
}

export async function casinoSnapshot(epochId: string) {
  const result = await supabase
    .from("snapshots")
    .select("wallet,source_balance,source_balance_raw,holder_pct")
    .eq("epoch_id", epochId)
    .order("wallet", { ascending: true });
  return assertNoError(result, "get casino snapshot") as Array<{
    wallet: string;
    source_balance: string | number;
    source_balance_raw: string;
    holder_pct: string | number;
  }>;
}

export async function markCasinoRoundReady(
  roundId: string,
  fields: {
    roundPoolLamports: bigint;
    jackpotOpeningLamports: bigint;
    jackpotContributionLamports: bigint;
    jackpotPayoutLamports: bigint;
    jackpotClosingLamports: bigint;
    isJackpotRound: boolean;
    playbackStartedAt: string;
    playbackEndsAt: string;
    resultsHash: string;
  }
) {
  const result = await supabase
    .from("casino_rounds")
    .update({
      status: "ready",
      round_pool_lamports: fields.roundPoolLamports.toString(),
      jackpot_opening_lamports: fields.jackpotOpeningLamports.toString(),
      jackpot_contribution_lamports: fields.jackpotContributionLamports.toString(),
      jackpot_payout_lamports: fields.jackpotPayoutLamports.toString(),
      jackpot_closing_lamports: fields.jackpotClosingLamports.toString(),
      is_jackpot_round: fields.isJackpotRound,
      playback_started_at: fields.playbackStartedAt,
      playback_ends_at: fields.playbackEndsAt,
      results_committed_at: new Date().toISOString(),
      results_hash: fields.resultsHash,
      error: null
    })
    .eq("round_id", roundId);
  assertNoError(result, "mark casino round ready");
}

export async function persistCasinoGameResults(
  roundId: string,
  game: string,
  results: ScheduledCasinoGameResult[]
) {
  if (!results.length) return;
  const rows = results.map((result) => {
    const resultHash = createHash("sha256")
      .update(
        [
          roundId,
          game,
          result.playIndex,
          result.wallet,
          result.score,
          result.tieBreak,
          result.summary,
          JSON.stringify(result.outcome),
          result.scheduledAt
        ].join(":")
      )
      .digest("hex");
    return {
      round_id: roundId,
      wallet: result.wallet,
      sequence_index: result.playIndex,
      game,
      score: result.score,
      tie_break: result.tieBreak,
      summary: result.summary,
      outcome: result.outcome,
      result_hash: resultHash,
      scheduled_at: result.scheduledAt
    };
  });
  const result = await supabase.from("casino_game_results").upsert(rows, { onConflict: "round_id,wallet" });
  assertNoError(result, "persist casino game results");
}

export async function markCasinoRoundSettling(roundId: string) {
  const result = await supabase.from("casino_rounds").update({ status: "settling" }).eq("round_id", roundId);
  assertNoError(result, "mark casino round settling");
}

export async function markCasinoRoundBroadcast(
  roundId: string,
  fields: {
    txSig: string;
    transactionBase64: string;
    lastValidBlockHeight: number;
  }
) {
  const result = await supabase
    .from("casino_rounds")
    .update({
      status: "settling",
      settlement_tx_sig: fields.txSig,
      settlement_transaction_base64: fields.transactionBase64,
      settlement_last_valid_block_height: fields.lastValidBlockHeight,
      error: null
    })
    .eq("round_id", roundId);
  assertNoError(result, "record casino settlement broadcast");
}

export async function recordCasinoWinner(
  roundId: string,
  winner: {
    position: number;
    wallet: string;
    selectionScore: string;
    roundPayoutLamports: bigint;
    jackpotPayoutLamports: bigint;
    totalPayoutLamports: bigint;
    status: "planned" | "settled" | "failed" | "dry_run";
    txSig?: string | null;
    error?: string | null;
  }
) {
  const result = await supabase.from("casino_winners").upsert(
    {
      round_id: roundId,
      position: winner.position,
      wallet: winner.wallet,
      selection_score: winner.selectionScore,
      round_payout_lamports: winner.roundPayoutLamports.toString(),
      jackpot_payout_lamports: winner.jackpotPayoutLamports.toString(),
      total_payout_lamports: winner.totalPayoutLamports.toString(),
      status: winner.status,
      tx_sig: winner.txSig ?? null,
      error: winner.error ?? null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "round_id,position" }
  );
  assertNoError(result, "record casino winner");
}

export async function settleCasinoRound(roundId: string, txSig: string) {
  const result = await supabase
    .from("casino_rounds")
    .update({
      status: "settled",
      settlement_tx_sig: txSig,
      settled_at: new Date().toISOString(),
      error: null
    })
    .eq("round_id", roundId);
  assertNoError(result, "settle casino round");
}

export async function completeCasinoDryRun(roundId: string) {
  const result = await supabase
    .from("casino_rounds")
    .update({
      status: "skipped",
      settled_at: new Date().toISOString(),
      error: "Verified dry run completed; settlement was disabled"
    })
    .eq("round_id", roundId);
  assertNoError(result, "complete casino dry run");
}

export async function skipCasinoRound(
  roundId: string,
  jackpotOpeningLamports: bigint,
  jackpotContributionLamports: bigint,
  reason: string
) {
  const result = await supabase
    .from("casino_rounds")
    .update({
      status: "skipped",
      jackpot_opening_lamports: jackpotOpeningLamports.toString(),
      jackpot_contribution_lamports: jackpotContributionLamports.toString(),
      jackpot_closing_lamports: (jackpotOpeningLamports + jackpotContributionLamports).toString(),
      settled_at: new Date().toISOString(),
      error: reason
    })
    .eq("round_id", roundId);
  assertNoError(result, "skip casino round");
}

export async function failCasinoRound(roundId: string, error: unknown) {
  const result = await supabase
    .from("casino_rounds")
    .update({
      status: "failed",
      error: error instanceof Error ? error.message : String(error)
    })
    .eq("round_id", roundId);
  assertNoError(result, "fail casino round");
}
