import { config } from "./config.js";
import { supabase } from "./db.js";
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
};

const DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAY_MS = 3 * DAY_MS;
const SEVEN_DAY_MS = 7 * DAY_MS;
const THIRTY_DAY_MS = 30 * DAY_MS;

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

function holderMultiplierBps(eligibleSince: string | null, nowMs: number) {
  const sinceMs = Date.parse(eligibleSince ?? "");
  if (!Number.isFinite(sinceMs)) return 10_000;

  const heldMs = Math.max(0, nowMs - sinceMs);
  if (heldMs >= THIRTY_DAY_MS) return 100_000;
  if (heldMs >= SEVEN_DAY_MS) return 50_000;
  if (heldMs >= THREE_DAY_MS) return 20_000;
  if (heldMs >= DAY_MS) return 15_000;
  return 10_000;
}

async function getHolderStates() {
  const result = await supabase
    .from("holder_states")
    .select(
      "wallet,source_balance,source_balance_raw,highest_source_balance_raw,eligible_since,current_streak_epochs,current_multiplier_bps,permanently_ineligible,ineligible_reason"
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
      // written once and a sell can reset its streak without excluding it.
      if (eligibleByWallet.has(state.wallet)) continue;

      const current = currentByWallet.get(state.wallet);
      const droppedBelowThreshold = !current || current.uiBalance < config.eligibilityMin;

      if (droppedBelowThreshold) {
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
      const soldAnyAmount = existing && holder.rawBalance < previousRaw;

      if (soldAnyAmount) {
        updates.push({
          wallet: holder.wallet,
          source_balance: holder.uiBalance.toString(),
          source_balance_raw: holder.rawBalance.toString(),
          highest_source_balance_raw: highestRaw > holder.rawBalance ? highestRaw.toString() : holder.rawBalance.toString(),
          eligible_since: now,
          permanently_ineligible: false,
          ineligible_reason: null,
          ineligible_at: null,
          last_seen_at: now,
          last_epoch_id: epochId,
          updated_at: now,
          current_streak_epochs: 0,
          current_multiplier_bps: 10_000
        });
        eligible.push({ ...holder, eligibleSince: now, holdMultiplierBps: 10_000 });
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

    const reset = eligibleHolders.filter((holder) => {
      const previous = stateByWallet.get(holder.wallet);
      return previous ? holder.rawBalance < parseRaw(previous.source_balance_raw) : false;
    }).length;
    if (reset > 0) console.log(`[${epochId}] holder-state reset ${reset} balance-decrease streaks to 1.00x`);
    return eligible;
  } catch (error) {
    if (isMissingHolderStateTable(error)) {
      console.warn(`[${epochId}] holder_states table missing; never-sold eligibility tracking is disabled`);
      return eligibleHolders;
    }
    throw error;
  }
}
