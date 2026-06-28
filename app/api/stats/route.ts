import { NextResponse } from "next/server";

type EpochRow = {
  epoch_id: string;
  status: string | null;
  eligible_count: number | null;
  reward_bought: string | number | null;
  reward_distributed: string | number | null;
  golden_winner_wallet: string | null;
  golden_base_reward: string | number | null;
  golden_bonus_reward: string | number | null;
  golden_multiplier: number | null;
  golden_capped: boolean | null;
  golden_tx_sig: string | null;
  started_at: string | null;
  completed_at: string | null;
};

type ClaimRow = {
  epoch_id: string;
  amount_claimed: string | number | null;
  tx_sig: string | null;
};

type BuyRow = {
  epoch_id: string;
  tx_sig: string | null;
};

type PayoutRow = {
  epoch_id: string;
  wallet: string;
  reward_amount: string | number | null;
  normal_reward_amount: string | number | null;
  golden_bonus_reward: string | number | null;
  is_golden: boolean | null;
  golden_multiplier: number | null;
  golden_capped: boolean | null;
  status: string | null;
  tx_sig: string | null;
  updated_at: string | null;
  created_at: string | null;
};

type EpochPayoutSummary = {
  rewardAmount: number;
  normalRewardAmount: number;
  goldenBonusReward: number;
  recipients: number;
  latestTime: string | null;
  latestTxSig: string | null;
  golden: PayoutRow | null;
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

function epochNumber(epochId: string, fallback: number) {
  const timestamp = Date.parse(epochId);
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 300000) : fallback;
}

function rowTime(row: Pick<EpochRow, "epoch_id" | "started_at">) {
  return Date.parse(row.started_at ?? row.epoch_id) || 0;
}

function payoutTime(row: Pick<PayoutRow, "updated_at" | "created_at" | "epoch_id">) {
  return Date.parse(row.updated_at ?? row.created_at ?? row.epoch_id) || 0;
}

function nextDropTime() {
  const fiveMinutes = 300000;
  return new Date(Math.ceil(Date.now() / fiveMinutes) * fiveMinutes).toISOString();
}

function durationLabel(startedAt: string | null, completedAt: string | null) {
  if (!startedAt || !completedAt) return "0s";
  const ms = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt));
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

export async function GET() {
  const config = supabaseConfig();

  if (!config) {
    return NextResponse.json({
      currentEpoch: 0,
      totalEpochs: 0,
      lastRewardAirdropped: 0,
      totalRewardAirdropped: 0,
      latestEligibleHolders: 0,
      nextDropTime: nextDropTime(),
      epochHistory: [],
      roundHistory: [],
      recentRewards: [],
      latestGolden: null
    });
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/epochs?select=epoch_id,status,eligible_count,reward_bought,reward_distributed,golden_winner_wallet,golden_base_reward,golden_bonus_reward,golden_multiplier,golden_capped,golden_tx_sig,started_at,completed_at&order=started_at.desc&limit=25`,
      {
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`
        },
        cache: "no-store"
      }
    );

    if (!response.ok) throw new Error(`Supabase epochs error ${response.status}`);
    const rows = (await response.json()) as EpochRow[];
    const epochIds = rows.map((row) => row.epoch_id);
    const claims = epochIds.length
      ? await fetch(
          `${config.url}/rest/v1/claims?select=epoch_id,amount_claimed,tx_sig&epoch_id=in.(${epochIds.map(encodeURIComponent).join(",")})`,
          {
            headers: {
              apikey: config.key,
              Authorization: `Bearer ${config.key}`
            },
            cache: "no-store"
          }
        )
      : null;
    const claimRows = claims?.ok ? ((await claims.json()) as ClaimRow[]) : [];
    const claimsByEpoch = new Map(claimRows.map((claim) => [claim.epoch_id, claim]));
    const buys = epochIds.length
      ? await fetch(`${config.url}/rest/v1/buys?select=epoch_id,tx_sig&epoch_id=in.(${epochIds.map(encodeURIComponent).join(",")})`, {
          headers: {
            apikey: config.key,
            Authorization: `Bearer ${config.key}`
          },
          cache: "no-store"
        })
      : null;
    const buyRows = buys?.ok ? ((await buys.json()) as BuyRow[]) : [];
    const buysByEpoch = new Map(buyRows.map((buy) => [buy.epoch_id, buy]));
    const settledPayouts = await fetch(
      `${config.url}/rest/v1/payouts?select=epoch_id,wallet,reward_amount,normal_reward_amount,golden_bonus_reward,is_golden,golden_multiplier,golden_capped,status,tx_sig,updated_at,created_at&status=eq.settled&order=updated_at.desc&limit=1000`,
      {
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`
        },
        cache: "no-store"
      }
    );
    const payoutRows = settledPayouts.ok ? ((await settledPayouts.json()) as PayoutRow[]) : [];
    const payoutsByEpoch = new Map<string, EpochPayoutSummary>();

    for (const payout of payoutRows) {
      const summary =
        payoutsByEpoch.get(payout.epoch_id) ??
        ({
          rewardAmount: 0,
          normalRewardAmount: 0,
          goldenBonusReward: 0,
          recipients: 0,
          latestTime: null,
          latestTxSig: null,
          golden: null
        } satisfies EpochPayoutSummary);
      const currentTime = payoutTime(payout);
      const latestTime = Date.parse(summary.latestTime ?? "") || 0;

      summary.rewardAmount += toNumber(payout.reward_amount);
      summary.normalRewardAmount += toNumber(payout.normal_reward_amount);
      summary.goldenBonusReward += toNumber(payout.golden_bonus_reward);
      summary.recipients += 1;
      if (currentTime >= latestTime) {
        summary.latestTime = payout.updated_at ?? payout.created_at ?? payout.epoch_id;
        summary.latestTxSig = payout.tx_sig;
      }
      if (payout.is_golden && (!summary.golden || currentTime >= payoutTime(summary.golden))) {
        summary.golden = payout;
      }
      payoutsByEpoch.set(payout.epoch_id, summary);
    }

    const completed = rows.filter((row) => row.status === "completed");
    const latest = rows[0];
    const displayEpochById = new Map(
      [...rows]
        .sort((a, b) => rowTime(a) - rowTime(b))
        .map((row, index) => [row.epoch_id, index + 1])
    );
    const completedDisplayEpochById = new Map(
      [...completed]
        .sort((a, b) => rowTime(a) - rowTime(b))
        .map((row, index) => [row.epoch_id, index + 1])
    );

    const epochHistory = completed
      .filter((row) => (payoutsByEpoch.get(row.epoch_id)?.rewardAmount ?? 0) > 0)
      .slice(0, 10)
      .map((row, index) => {
        const payoutSummary = payoutsByEpoch.get(row.epoch_id);
        return {
          epoch: completedDisplayEpochById.get(row.epoch_id) ?? completed.length - index,
          rewardAmount: payoutSummary?.rewardAmount ?? 0,
          recipients: payoutSummary?.recipients ?? 0,
          timestamp: payoutSummary?.latestTime ?? row.completed_at ?? row.started_at ?? row.epoch_id,
          status: row.status ?? "unknown"
        };
      });

    const roundHistory = rows.slice(0, 10).map((row, index) => {
      const claim = claimsByEpoch.get(row.epoch_id);
      const buy = buysByEpoch.get(row.epoch_id);
      const payoutSummary = payoutsByEpoch.get(row.epoch_id);
      const goldenPayout = payoutSummary?.golden;
      return {
        epoch: displayEpochById.get(row.epoch_id) ?? rows.length - index,
        status: row.status ?? "unknown",
        startedAt: row.started_at ?? row.epoch_id,
        duration: durationLabel(row.started_at, row.completed_at),
        claimedSol: toNumber(claim?.amount_claimed),
        rewardBought: toNumber(row.reward_bought),
        normalRewardsSent: payoutSummary?.normalRewardAmount ?? 0,
        distributedPump: payoutSummary?.rewardAmount ?? 0,
        goldenWinnerWallet: goldenPayout?.wallet ?? null,
        goldenBaseReward: toNumber(goldenPayout?.normal_reward_amount),
        goldenBonusReward: toNumber(goldenPayout?.golden_bonus_reward),
        goldenTotalReward: toNumber(goldenPayout?.reward_amount),
        goldenMultiplier: goldenPayout?.golden_multiplier ?? row.golden_multiplier ?? 10,
        goldenCapped: goldenPayout?.golden_capped ?? false,
        goldenTxSig: goldenPayout?.tx_sig ?? null,
        txSig: payoutSummary?.latestTxSig ?? claim?.tx_sig ?? buy?.tx_sig ?? null
      };
    });

    const recentRewards = payoutRows.slice(0, 20).map((row) => ({
      epoch: displayEpochById.get(row.epoch_id) ?? epochNumber(row.epoch_id, 0),
      wallet: row.wallet,
      rewardAmount: toNumber(row.reward_amount),
      normalRewardAmount: toNumber(row.normal_reward_amount),
      goldenBonusReward: toNumber(row.golden_bonus_reward),
      isGolden: row.is_golden ?? false,
      goldenMultiplier: row.golden_multiplier ?? 1,
      goldenCapped: row.golden_capped ?? false,
      time: row.updated_at ?? row.created_at ?? row.epoch_id,
      status: row.status ?? "unknown",
      txSig: row.tx_sig
    }));
    const latestGoldenRow = payoutRows.find((row) => row.is_golden);
    const latestGolden = latestGoldenRow
      ? {
          wallet: latestGoldenRow.wallet,
          baseReward: toNumber(latestGoldenRow.normal_reward_amount),
          bonusReward: toNumber(latestGoldenRow.golden_bonus_reward),
          totalReward: toNumber(latestGoldenRow.reward_amount),
          multiplier: latestGoldenRow.golden_multiplier ?? 10,
          capped: latestGoldenRow.golden_capped ?? false,
          txSig: latestGoldenRow.tx_sig
        }
      : null;
    const totalRewardAirdropped = Array.from(payoutsByEpoch.values()).reduce(
      (sum, summary) => sum + summary.rewardAmount,
      0
    );

    return NextResponse.json({
      currentEpoch: completed.length,
      totalEpochs: completed.length,
      lastRewardAirdropped: epochHistory[0]?.rewardAmount ?? 0,
      totalRewardAirdropped,
      latestEligibleHolders: toNumber(latest?.eligible_count),
      nextDropTime: nextDropTime(),
      epochHistory,
      roundHistory,
      recentRewards,
      latestGolden
    });
  } catch (error) {
    console.error("stats route failed", error);
    return NextResponse.json({
      currentEpoch: 0,
      totalEpochs: 0,
      lastRewardAirdropped: 0,
      totalRewardAirdropped: 0,
      latestEligibleHolders: 0,
      nextDropTime: nextDropTime(),
      epochHistory: [],
      roundHistory: [],
      recentRewards: [],
      latestGolden: null
    });
  }
}
