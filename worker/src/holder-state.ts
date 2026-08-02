import { config } from "./config.js";
import { supabase } from "./db.js";
import { hasDetectedSale, holderMultiplierBps } from "./holder-policy.js";
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
  ineligible_reason: string | null;
  ineligible_at: string | null;
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
      "wallet,source_balance,source_balance_raw,highest_source_balance_raw,eligible_since,current_streak_epochs,current_multiplier_bps,permanently_ineligible,ineligible_reason,ineligible_at"
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

export async function applyHolderState(epochId: string, eligibleHolders: Holder[], currentHolders = eligibleHolders): Promise<Holder[]> {
  try {
    const now = new Date().toISOString();
    const nowMs = Date.parse(now);
    const states = await getHolderStates();
    const stateByWallet = new Map(states.map((state) => [state.wallet, state]));
    const eligibleByWallet = new Map(eligibleHolders.map((holder) => [holder.wallet, holder]));
    const currentByWallet = new Map(currentHolders.map((holder) => [holder.wallet, holder]));
    const updates: Record<string, unknown>[] = [];
    const eligible: Holder[] = [];
    for (const state of states) {
      // Eligible wallets are handled in the second pass so each wallet is
      // written once.
      if (eligibleByWallet.has(state.wallet)) continue;

      const current = currentByWallet.get(state.wallet);
      const previousRaw = parseRaw(state.source_balance_raw);
      const currentRaw = current?.rawBalance ?? 0n;
      const soldAnyAmount = hasDetectedSale(previousRaw, currentRaw);
      const droppedBelowThreshold = !current || current.uiBalance < config.eligibilityMin;

      if (state.permanently_ineligible || soldAnyAmount || state.ineligible_reason === "balance_decreased") {
        updates.push({
          wallet: state.wallet,
          source_balance: current?.uiBalance.toString() ?? state.source_balance ?? "0",
          source_balance_raw: current?.rawBalance.toString() ?? state.source_balance_raw ?? "0",
          highest_source_balance_raw: state.highest_source_balance_raw ?? state.source_balance_raw ?? "0",
          eligible_since: null,
          permanently_ineligible: true,
          ineligible_reason: "balance_decreased",
          ineligible_at: state.ineligible_at ?? now,
          last_seen_at: now,
          last_epoch_id: epochId,
          updated_at: now,
          current_streak_epochs: 0,
          current_multiplier_bps: 10_000
        });
      } else if (droppedBelowThreshold) {
        updates.push({
          wallet: state.wallet,
          source_balance: current?.uiBalance.toString() ?? state.source_balance ?? "0",
          source_balance_raw: current?.rawBalance.toString() ?? state.source_balance_raw ?? "0",
          highest_source_balance_raw: state.highest_source_balance_raw ?? state.source_balance_raw ?? "0",
          eligible_since: null,
          permanently_ineligible: false,
          ineligible_reason: "dropped_below_threshold",
          ineligible_at: now,
          last_seen_at: now,
          last_epoch_id: epochId,
          updated_at: now,
          current_streak_epochs: 0,
          current_multiplier_bps: 10_000
        });
      } else {
        updates.push({
          wallet: state.wallet,
          source_balance: current.uiBalance.toString(),
          source_balance_raw: current.rawBalance.toString(),
          highest_source_balance_raw:
            parseRaw(state.highest_source_balance_raw) > current.rawBalance
              ? state.highest_source_balance_raw ?? current.rawBalance.toString()
              : current.rawBalance.toString(),
          last_seen_at: now,
          last_epoch_id: epochId,
          updated_at: now,
          permanently_ineligible: false,
          ineligible_reason: null,
          ineligible_at: null,
          current_streak_epochs: 0,
          current_multiplier_bps: 10_000
        });
      }
    }

    for (const holder of eligibleHolders) {
      const existing = stateByWallet.get(holder.wallet);

      const previousRaw = parseRaw(existing?.source_balance_raw);
      const highestRaw = parseRaw(existing?.highest_source_balance_raw);
      const soldAnyAmount = existing ? hasDetectedSale(previousRaw, holder.rawBalance) : false;

      if (existing?.permanently_ineligible || soldAnyAmount || existing?.ineligible_reason === "balance_decreased") {
        updates.push({
          wallet: holder.wallet,
          source_balance: holder.uiBalance.toString(),
          source_balance_raw: holder.rawBalance.toString(),
          highest_source_balance_raw: highestRaw > holder.rawBalance ? highestRaw.toString() : holder.rawBalance.toString(),
          eligible_since: null,
          permanently_ineligible: true,
          ineligible_reason: "balance_decreased",
          ineligible_at: existing?.ineligible_at ?? now,
          last_seen_at: now,
          last_epoch_id: epochId,
          updated_at: now,
          current_streak_epochs: 0,
          current_multiplier_bps: 10_000
        });
        continue;
      }

      const nextStreak = existing ? (existing.current_streak_epochs ?? 0) + 1 : 1;
      const eligibleSince = existing?.eligible_since ?? now;
      const nextHighest = highestRaw > holder.rawBalance ? highestRaw : holder.rawBalance;
      const nextMultiplierBps = holderMultiplierBps(eligibleSince, nowMs);

      updates.push({
        wallet: holder.wallet,
        source_balance: holder.uiBalance.toString(),
        source_balance_raw: holder.rawBalance.toString(),
        highest_source_balance_raw: nextHighest.toString(),
        eligible_since: eligibleSince,
        last_seen_at: now,
        last_epoch_id: epochId,
        updated_at: now,
        current_streak_epochs: nextStreak,
        current_multiplier_bps: nextMultiplierBps,
        permanently_ineligible: false,
        ineligible_reason: null,
        ineligible_at: null
      });

      eligible.push({ ...holder, eligibleSince, holdMultiplierBps: nextMultiplierBps });
    }

    await upsertHolderStates(updates);

    const disqualified = eligibleHolders.filter((holder) => {
      const previous = stateByWallet.get(holder.wallet);
      return previous ? hasDetectedSale(parseRaw(previous.source_balance_raw), holder.rawBalance) : false;
    }).length;
    if (disqualified > 0) console.log(`[${epochId}] holder-state disqualified ${disqualified} balance-decrease wallets`);
    return eligible;
  } catch (error) {
    if (isMissingHolderStateTable(error)) {
      console.warn(`[${epochId}] holder_states table missing; sell-once eligibility tracking is disabled`);
      return eligibleHolders;
    }
    throw error;
  }
}
