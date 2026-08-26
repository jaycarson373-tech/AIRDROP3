import { config } from "./config.js";
import { supabase } from "./db.js";
import { holdingMultiplierBps } from "./selection.js";
import type { Holder } from "./snapshot.js";

type HolderStateRow = {
  wallet: string;
  source_balance: string | number | null;
  source_balance_raw: string | null;
  highest_source_balance_raw: string | null;
  eligible_since: string | null;
  current_streak_epochs: number | null;
  current_multiplier_bps: number | null;
  permanently_ineligible: boolean | null;
  sell_events: number | null;
  last_sell_at: string | null;
};

function parseRaw(value: unknown) {
  try {
    return BigInt(String(value ?? "0"));
  } catch {
    return 0n;
  }
}

function isMissingHolderStateTable(error: unknown) {
  const message = JSON.stringify(error);
  return message.includes("holder_states") || message.includes("42P01") || message.includes("PGRST205");
}

async function getHolderStates() {
  const result = await supabase
    .from("holder_states")
    .select(
      "wallet,source_balance,source_balance_raw,highest_source_balance_raw,eligible_since,current_streak_epochs,current_multiplier_bps,permanently_ineligible,sell_events,last_sell_at"
    )
    .limit(10000);
  if (result.error) throw result.error;
  return (result.data ?? []) as HolderStateRow[];
}

async function upsertHolderStates(rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const result = await supabase.from("holder_states").upsert(rows, { onConflict: "wallet" });
  if (result.error) throw result.error;
}

export async function applyHolderState(epochId: string, eligibleHolders: Holder[], currentHolders = eligibleHolders) {
  try {
    const now = new Date();
    const nowIso = now.toISOString();
    const states = await getHolderStates();
    const stateByWallet = new Map(states.map((state) => [state.wallet, state]));
    const eligibleByWallet = new Map(eligibleHolders.map((holder) => [holder.wallet, holder]));
    const currentByWallet = new Map(currentHolders.map((holder) => [holder.wallet, holder]));
    const updates: Record<string, unknown>[] = [];
    const eligible: Holder[] = [];

    for (const state of states) {
      if (eligibleByWallet.has(state.wallet)) continue;
      const current = currentByWallet.get(state.wallet);
      updates.push({
        wallet: state.wallet,
        source_balance: current?.uiBalance.toString() ?? "0",
        source_balance_raw: current?.rawBalance.toString() ?? "0",
        highest_source_balance_raw: state.highest_source_balance_raw ?? state.source_balance_raw ?? "0",
        eligible_since: null,
        last_seen_at: nowIso,
        last_epoch_id: epochId,
        updated_at: nowIso,
        current_streak_epochs: 0,
        current_multiplier_bps: 10_000,
        permanently_ineligible: false,
        ineligible_reason: current ? "dropped_below_threshold" : "not_in_snapshot"
      });
    }

    for (const holder of eligibleHolders) {
      const existing = stateByWallet.get(holder.wallet);
      const previousRaw = parseRaw(existing?.source_balance_raw);
      const highestRaw = parseRaw(existing?.highest_source_balance_raw);
      const soldSinceLastRound = Boolean(existing && previousRaw > 0n && holder.rawBalance < previousRaw);
      const eligibleSince = soldSinceLastRound || !existing?.eligible_since ? nowIso : existing.eligible_since;
      const multiplierBps = holdingMultiplierBps(eligibleSince, now.getTime());
      const streak = soldSinceLastRound ? 1 : (existing?.current_streak_epochs ?? 0) + 1;

      updates.push({
        wallet: holder.wallet,
        source_balance: holder.uiBalance.toString(),
        source_balance_raw: holder.rawBalance.toString(),
        highest_source_balance_raw: (highestRaw > holder.rawBalance ? highestRaw : holder.rawBalance).toString(),
        eligible_since: eligibleSince,
        last_seen_at: nowIso,
        last_epoch_id: epochId,
        updated_at: nowIso,
        current_streak_epochs: streak,
        current_multiplier_bps: multiplierBps,
        permanently_ineligible: false,
        ineligible_reason: null,
        ineligible_at: null,
        sell_events: (existing?.sell_events ?? 0) + (soldSinceLastRound ? 1 : 0),
        last_sell_at: soldSinceLastRound ? nowIso : existing?.last_sell_at ?? null
      });

      eligible.push({ ...holder, holdingMultiplierBps: multiplierBps });
    }

    await upsertHolderStates(updates);
    return eligible;
  } catch (error) {
    if (isMissingHolderStateTable(error)) {
      throw new Error("Pump Money holder-state migration is missing; refusing to run without loyalty tracking");
    }
    throw error;
  }
}
