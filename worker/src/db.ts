import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

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
