import { NextResponse } from "next/server";

type EpochRow = { epoch_id: string };
type SnapshotRow = {
  wallet: string;
  source_balance: string | number | null;
};
type HolderStateRow = {
  wallet: string;
  source_balance: string | number | null;
  current_streak_epochs: number | null;
  current_multiplier_bps: number | null;
  eligible_since: string | null;
  permanently_ineligible: boolean | null;
  ineligible_reason: string | null;
};
type PayoutRow = {
  wallet: string;
  reward_amount: string | number | null;
  updated_at: string | null;
  created_at: string | null;
};

function supabaseConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

async function getJson<T>(url: string, key: string) {
  const response = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    },
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Supabase error ${response.status}`);
  return (await response.json()) as T;
}

async function getJsonOrNull<T>(url: string, key: string) {
  try {
    return await getJson<T>(url, key);
  } catch (error) {
    console.warn("optional holders query failed", error);
    return null;
  }
}

function multiplierLabel(bps: number | null | undefined) {
  return `${((bps ?? 10000) / 10000).toFixed(2)}x`;
}

function holdTimeLabel(streakEpochs: number | null | undefined) {
  const minutes = Math.max(0, Number(streakEpochs ?? 0) * 5);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export async function GET() {
  const config = supabaseConfig();
  if (!config) return NextResponse.json({ topHolders: [], totalSupply: 0, uniqueHolders: 0 });

  try {
    const holderStates = await getJsonOrNull<HolderStateRow[]>(
      `${config.url}/rest/v1/holder_states?select=wallet,source_balance,current_streak_epochs,current_multiplier_bps,eligible_since,permanently_ineligible,ineligible_reason&order=current_multiplier_bps.desc,current_streak_epochs.desc,source_balance.desc&limit=50`,
      config.key
    );
    const activeStates = (holderStates ?? []).filter((row) => !row.permanently_ineligible);
    const payoutRows = await getJsonOrNull<PayoutRow[]>(
      `${config.url}/rest/v1/payouts?select=wallet,reward_amount,updated_at,created_at&status=eq.settled&order=updated_at.desc&limit=1000`,
      config.key
    );
    const payoutsByWallet = new Map<string, { total: number; lastRewardAt: string | null }>();
    for (const payout of payoutRows ?? []) {
      const current = payoutsByWallet.get(payout.wallet) ?? { total: 0, lastRewardAt: null };
      current.total += toNumber(payout.reward_amount);
      current.lastRewardAt ??= payout.updated_at ?? payout.created_at;
      payoutsByWallet.set(payout.wallet, current);
    }

    if (activeStates.length) {
      const totalSupply = activeStates.reduce((sum, row) => sum + toNumber(row.source_balance), 0);
      const topHolders = activeStates.map((row, index) => {
        const balance = toNumber(row.source_balance);
        const payout = payoutsByWallet.get(row.wallet);
        return {
          rank: index + 1,
          address: row.wallet,
          balance,
          percentage: totalSupply > 0 ? ((balance / totalSupply) * 100).toFixed(2) : "0.00",
          currentMultiplier: multiplierLabel(row.current_multiplier_bps),
          currentMultiplierBps: row.current_multiplier_bps ?? 10000,
          currentHoldTime: holdTimeLabel(row.current_streak_epochs),
          currentStreak: row.current_streak_epochs ?? 0,
          totalAnsemEarned: payout?.total ?? 0,
          lastFeedingAt: payout?.lastRewardAt ?? null,
          permanentlyIneligible: false,
          ineligibleReason: null
        };
      });

      return NextResponse.json({ topHolders, totalSupply, uniqueHolders: activeStates.length });
    }

    const epochs = await getJson<EpochRow[]>(
      `${config.url}/rest/v1/epochs?select=epoch_id&order=started_at.desc&limit=1`,
      config.key
    );
    const epochId = epochs[0]?.epoch_id;
    if (!epochId) return NextResponse.json({ topHolders: [], totalSupply: 0, uniqueHolders: 0 });

    const snapshots = await getJson<SnapshotRow[]>(
      `${config.url}/rest/v1/snapshots?select=wallet,source_balance&epoch_id=eq.${encodeURIComponent(epochId)}&order=source_balance.desc&limit=50`,
      config.key
    );

    const totalSupply = snapshots.reduce((sum, row) => sum + toNumber(row.source_balance), 0);
    const topHolders = snapshots.map((row, index) => {
      const balance = toNumber(row.source_balance);
      return {
        rank: index + 1,
        address: row.wallet,
        balance,
        percentage: totalSupply > 0 ? ((balance / totalSupply) * 100).toFixed(2) : "0.00",
        currentMultiplier: null,
        currentMultiplierBps: null,
        currentHoldTime: null,
        currentStreak: null,
        totalAnsemEarned: payoutsByWallet.get(row.wallet)?.total ?? 0,
        lastFeedingAt: payoutsByWallet.get(row.wallet)?.lastRewardAt ?? null,
        permanentlyIneligible: false,
        ineligibleReason: null
      };
    });

    return NextResponse.json({ topHolders, totalSupply, uniqueHolders: snapshots.length });
  } catch (error) {
    console.error("holders route failed", error);
    return NextResponse.json({ topHolders: [], totalSupply: 0, uniqueHolders: 0 });
  }
}
