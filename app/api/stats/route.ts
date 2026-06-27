import { NextResponse } from "next/server";

type EpochRow = {
  epoch_id: string;
  status: string | null;
  eligible_count: number | null;
  reward_bought: string | number | null;
  reward_distributed: string | number | null;
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
      nextDropTime: nextDropTime(),
      epochHistory: []
    });
  }

  try {
    const response = await fetch(
      `${config.url}/rest/v1/epochs?select=epoch_id,status,eligible_count,reward_bought,reward_distributed,started_at,completed_at&order=started_at.desc&limit=25`,
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
    const completed = rows.filter((row) => row.status === "completed" || row.status === "skipped");
    const latest = rows[0];

    const epochHistory = completed.slice(0, 10).map((row, index) => ({
      epoch: epochNumber(row.epoch_id, completed.length - index),
      rewardAmount: toNumber(row.reward_distributed),
      recipients: toNumber(row.eligible_count),
      timestamp: row.completed_at ?? row.started_at ?? row.epoch_id,
      status: row.status ?? "unknown"
    }));

    const roundHistory = rows.slice(0, 10).map((row, index) => {
      const claim = claimsByEpoch.get(row.epoch_id);
      const buy = buysByEpoch.get(row.epoch_id);
      return {
        epoch: epochNumber(row.epoch_id, rows.length - index),
        status: row.status ?? "unknown",
        startedAt: row.started_at ?? row.epoch_id,
        duration: durationLabel(row.started_at, row.completed_at),
        claimedSol: toNumber(claim?.amount_claimed),
        distributedPump: toNumber(row.reward_distributed),
        txSig: claim?.tx_sig ?? buy?.tx_sig ?? null
      };
    });

    return NextResponse.json({
      currentEpoch: latest ? epochNumber(latest.epoch_id, rows.length) : 0,
      totalEpochs: rows.length,
      lastRewardAirdropped: epochHistory[0]?.rewardAmount ?? 0,
      totalRewardAirdropped: completed.reduce((sum, row) => sum + toNumber(row.reward_distributed), 0),
      nextDropTime: nextDropTime(),
      epochHistory,
      roundHistory
    });
  } catch (error) {
    console.error("stats route failed", error);
    return NextResponse.json({
      currentEpoch: 0,
      totalEpochs: 0,
      lastRewardAirdropped: 0,
      totalRewardAirdropped: 0,
      nextDropTime: nextDropTime(),
      epochHistory: []
    });
  }
}
