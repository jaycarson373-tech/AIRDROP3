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
    const completed = rows.filter((row) => row.status === "completed" || row.status === "skipped");
    const latest = rows[0];

    const epochHistory = completed.slice(0, 10).map((row, index) => ({
      epoch: epochNumber(row.epoch_id, completed.length - index),
      rewardAmount: toNumber(row.reward_distributed),
      recipients: toNumber(row.eligible_count),
      timestamp: row.completed_at ?? row.started_at ?? row.epoch_id,
      status: row.status ?? "unknown"
    }));

    return NextResponse.json({
      currentEpoch: latest ? epochNumber(latest.epoch_id, rows.length) : 0,
      totalEpochs: rows.length,
      lastRewardAirdropped: epochHistory[0]?.rewardAmount ?? 0,
      totalRewardAirdropped: completed.reduce((sum, row) => sum + toNumber(row.reward_distributed), 0),
      nextDropTime: nextDropTime(),
      epochHistory
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
