import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HolderStateRow = {
  wallet: string;
  source_balance: string | number | null;
  eligible_since: string | null;
  current_streak_epochs: number | null;
  current_multiplier_bps: number | null;
  permanently_ineligible: boolean | null;
  ineligible_reason: string | null;
  last_seen_at: string | null;
};

type PayoutRow = {
  epoch_id: string;
  wallet: string;
  reward_amount: string | number | null;
  reward_amount_raw: string | number | null;
  status: string | null;
  tx_sig: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type BuyRow = {
  epoch_id: string;
  base_spent_lamports: string | number | null;
  reward_received: string | number | null;
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

function supabaseHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`
  };
}

async function getJson<T>(url: string, key: string) {
  const response = await fetch(url, {
    headers: supabaseHeaders(key),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`Supabase error ${response.status}`);
  return (await response.json()) as T;
}

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const THREE_DAY_MS = 3 * DAY_MS;
const SEVEN_DAY_MS = 7 * DAY_MS;

function fallbackMultiplierBps(eligibleSince: string | null) {
  const sinceMs = Date.parse(eligibleSince ?? "");
  if (!Number.isFinite(sinceMs)) return 10_000;
  const heldMs = Math.max(0, Date.now() - sinceMs);
  if (heldMs >= SEVEN_DAY_MS) return 20_000;
  if (heldMs >= THREE_DAY_MS) return 15_000;
  if (heldMs >= DAY_MS) return 12_500;
  return 10_000;
}

function multiplierBps(holder: HolderStateRow | null) {
  if (!holder) return null;
  return Math.max(holder.current_multiplier_bps ?? 10_000, fallbackMultiplierBps(holder.eligible_since));
}

function minimumHolding() {
  const parsed = Number(process.env.ELIGIBILITY_MIN ?? process.env.NEXT_PUBLIC_ELIGIBILITY_MIN ?? 1_000_000);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1_000_000;
}

function dropSolValue(payout: PayoutRow, buy: BuyRow | undefined) {
  const rewardReceived = toNumber(buy?.reward_received);
  const baseSpentLamports = toNumber(buy?.base_spent_lamports);
  const rewardAmount = toNumber(payout.reward_amount);
  if (!rewardReceived || !baseSpentLamports || !rewardAmount) return 0;
  return (rewardAmount / rewardReceived) * (baseSpentLamports / 1_000_000_000);
}

export async function GET(request: NextRequest) {
  const config = supabaseConfig();
  if (!config) return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });

  const rawAddress = request.nextUrl.searchParams.get("address")?.trim() ?? "";
  let wallet: string;
  try {
    wallet = new PublicKey(rawAddress).toBase58();
  } catch {
    return NextResponse.json({ error: "Invalid Solana wallet" }, { status: 400 });
  }

  try {
    const [holderStates, payouts] = await Promise.all([
      getJson<HolderStateRow[]>(
        `${config.url}/rest/v1/holder_states?select=wallet,source_balance,eligible_since,current_streak_epochs,current_multiplier_bps,permanently_ineligible,ineligible_reason,last_seen_at&wallet=eq.${encodeURIComponent(wallet)}&limit=1`,
        config.key
      ),
      getJson<PayoutRow[]>(
        `${config.url}/rest/v1/payouts?select=epoch_id,wallet,reward_amount,reward_amount_raw,status,tx_sig,updated_at,created_at&wallet=eq.${encodeURIComponent(wallet)}&status=eq.settled&order=updated_at.desc`,
        config.key
      )
    ]);

    const epochIds = Array.from(new Set(payouts.map((payout) => payout.epoch_id))).filter(Boolean);
    const buys = epochIds.length
      ? await getJson<BuyRow[]>(
          `${config.url}/rest/v1/buys?select=epoch_id,base_spent_lamports,reward_received&epoch_id=in.(${epochIds.map(encodeURIComponent).join(",")})`,
          config.key
        )
      : [];
    const buysByEpoch = new Map(buys.map((buy) => [buy.epoch_id, buy]));
    const holder = holderStates[0] ?? null;
    const sourceBalance = toNumber(holder?.source_balance);
    const min = minimumHolding();
    const eligible = !!holder && !holder.permanently_ineligible && !holder.ineligible_reason && sourceBalance >= min;
    const receipts = payouts.map((payout) => ({
      epochId: payout.epoch_id,
      rewardAmount: toNumber(payout.reward_amount),
      rewardAmountRaw: String(payout.reward_amount_raw ?? "0"),
      dropSolValue: dropSolValue(payout, buysByEpoch.get(payout.epoch_id)),
      txSig: payout.tx_sig,
      time: payout.updated_at ?? payout.created_at ?? payout.epoch_id,
      status: payout.status ?? "settled"
    }));

    const totalRewardReceived = receipts.reduce((sum, receipt) => sum + receipt.rewardAmount, 0);
    const totalDropSolValue = receipts.reduce((sum, receipt) => sum + receipt.dropSolValue, 0);

    return NextResponse.json({
      wallet,
      sourceBalance,
      eligible,
      eligibilityMinimum: min,
      status: eligible ? "eligible" : holder ? holder.ineligible_reason ?? "below_threshold" : "not_found",
      multiplierBps: multiplierBps(holder),
      eligibleSince: holder?.eligible_since ?? null,
      currentStreak: holder?.current_streak_epochs ?? 0,
      lastSeenAt: holder?.last_seen_at ?? null,
      totalRewardReceived,
      totalDropSolValue,
      lastAirdropAt: receipts[0]?.time ?? null,
      receipts
    });
  } catch (error) {
    console.error("wallet route failed", error);
    return NextResponse.json({ error: "Wallet lookup failed" }, { status: 500 });
  }
}
