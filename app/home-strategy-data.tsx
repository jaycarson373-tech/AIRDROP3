"use client";

import { useEffect, useMemo, useState } from "react";

type Round = {
  epoch: number;
  status: string;
  startedAt: string;
  duration: string;
  rewardBought: number;
  distributedPump: number;
  txSig: string | null;
};

type Reward = {
  epoch: number;
  wallet: string;
  rewardAmount: number;
  time: string;
  status: string;
  txSig: string | null;
};

type StatsResponse = {
  currentEpoch: number;
  totalEpochs: number;
  totalRewardAirdropped: number;
  latestEligibleHolders: number;
  nextDropTime: string;
  roundHistory: Round[];
  recentRewards: Reward[];
};

type HoldersResponse = {
  topHolders: Array<{
    rank: number;
    address: string;
    balance: number;
    percentage: string;
  }>;
};

const emptyStats: StatsResponse = {
  currentEpoch: 0,
  totalEpochs: 0,
  totalRewardAirdropped: 0,
  latestEligibleHolders: 0,
  nextDropTime: new Date().toISOString(),
  roundHistory: [],
  recentRewards: []
};

const emptyHolders: HoldersResponse = { topHolders: [] };
const REFRESH_MS = 12_000;

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function compactAddress(address: string) {
  if (!address) return "–";
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  if (!Number.isFinite(value) || value <= 0) return "–";
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

function formatRewardAmount(value: number, symbol: string) {
  if (!Number.isFinite(value) || value <= 0) return "Awaiting first drop";
  return `${formatNumber(value)} ${symbol}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "–" : date.toLocaleString();
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function statusClass(status: string) {
  if (status === "completed" || status === "settled") return "status-pill completed";
  if (status === "failed") return "status-pill failed";
  if (status === "skipped" || status === "dry_run") return "status-pill skipped";
  return "status-pill running";
}

function statusLabel(status: string) {
  return status.replace(/_/g, " ").toUpperCase();
}

export function useStrategyData() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [holders, setHolders] = useState<HoldersResponse | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [nextStats, nextHolders] = await Promise.all([
        getJson<StatsResponse>("/api/stats", emptyStats),
        getJson<HoldersResponse>("/api/holders", emptyHolders)
      ]);

      if (!active) return;
      setStats(nextStats);
      setHolders(nextHolders);
    };

    load();
    const refreshTimer = window.setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return { stats, holders, now };
}

export function BlackBullTreasuryCard({
  sourceSymbol,
  rewardSymbol
}: {
  sourceSymbol: string;
  rewardSymbol: string;
}) {
  const { stats, now } = useStrategyData();
  const nextDropTime = stats?.nextDropTime ? Date.parse(stats.nextDropTime) : 0;
  const countdown = nextDropTime ? formatCountdown(nextDropTime - now) : "Loading";

  return (
    <aside className="treasury-card" aria-live="polite">
      <div className="treasury-head">
        <span>GRASS Drop Queue</span>
        <i>LIVE</i>
      </div>
      <div className="treasury-grid">
        <Metric label="Next GRASS Drop" value={countdown} strong />
        <Metric label="Epoch Countdown" value={countdown} />
        <Metric
          label={`Eligible ${sourceSymbol} Holders`}
          value={stats ? formatNumber(stats.latestEligibleHolders, 0) : "Loading"}
        />
        <Metric
          label={`Total ${rewardSymbol} Airdropped`}
          value={stats ? formatRewardAmount(stats.totalRewardAirdropped, rewardSymbol) : "Loading"}
        />
      </div>
      <div className="eligibility-strip">
        <span>Requirement</span>
        <strong>Hold {sourceSymbol}</strong>
        <em>50 winners every epoch, one lucky bonus drop</em>
      </div>
    </aside>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "metric metric-strong" : "metric"}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

export function StrategyDataSections({
  sourceSymbol,
  rewardSymbol
}: {
  sourceSymbol: string;
  rewardSymbol: string;
}) {
  const { stats, holders } = useStrategyData();
  const rounds = stats?.roundHistory ?? [];
  const rewards = stats?.recentRewards ?? [];
  const topHolders = holders?.topHolders ?? [];
  const distributedRounds = useMemo(
    () => rounds.filter((round) => round.distributedPump > 0),
    [rounds]
  );
  const maxDistributed = useMemo(
    () => Math.max(...distributedRounds.map((round) => round.distributedPump), 0),
    [distributedRounds]
  );

  return (
    <>
      <section className="section" id="status">
        <div className="container">
            <div className="section-head">
              <h2>Strategy Status</h2>
              <p className="lead">
              Bulls eat grass. Hold {sourceSymbol}. Every 5 minutes, eligible holders are entered for {rewardSymbol} rewards.
            </p>
          </div>
          <div className="status-grid">
            <StatusItem label="Current loop" value="The bull keeps eating" tone="live" />
            <StatusItem label="Distribution interval" value="Every 5 minutes" />
            <StatusItem label="Eligibility" value={`Hold $${sourceSymbol}`} />
            <StatusItem label="Reward" value={`Get $${rewardSymbol}`} />
          </div>
        </div>
      </section>

      <section className="section" id="history">
        <div className="container split-section">
          <div className="history-card distribution-card">
            <div className="history-head">
              <h3>{rewardSymbol} Airdropped</h3>
              <span>{distributedRounds.length ? "Latest drops" : "No drops yet"}</span>
            </div>
            {distributedRounds.length ? (
              <>
                <div className="distribution-bars" aria-label="Recent distribution history">
                  {distributedRounds.slice(0, 8).reverse().map((round) => (
                    <div className="distribution-bar" key={`${round.epoch}-${round.startedAt}`}>
                      <span
                        style={{
                          height: `${maxDistributed > 0 ? Math.max(10, (round.distributedPump / maxDistributed) * 100) : 10}%`
                        }}
                      />
                      <small>#{round.epoch}</small>
                    </div>
                  ))}
                </div>
                <div className="distribution-total">
                  <span>Total {rewardSymbol} airdropped</span>
                  <strong>{stats ? formatRewardAmount(stats.totalRewardAirdropped, rewardSymbol) : "Loading"}</strong>
                </div>
              </>
            ) : (
              <div className="empty-state">No GRASS drops yet.</div>
            )}
          </div>

          <div className="history-card holders-card" id="leaderboard">
            <div className="history-head">
              <h3>Eligible {sourceSymbol} Holders</h3>
              <span>{topHolders.length ? "Latest snapshot" : "Holder data loading"}</span>
            </div>
            {topHolders.length ? (
              <div className="holder-list">
                {topHolders.slice(0, 8).map((holder) => (
                  <div className="holder-line" key={holder.address}>
                    <b>#{holder.rank}</b>
                    <span className="mono">{compactAddress(holder.address)}</span>
                    <strong>{formatNumber(holder.balance)} ${sourceSymbol}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">Holder data loading.</div>
            )}
          </div>
        </div>
      </section>

      <section className="section" id="activity">
        <div className="container">
          <div className="history-card">
            <div className="history-head">
              <h3>Last Winners</h3>
              <span>{rewards.length ? "Real GRASS payout events" : "Winners coming soon"}</span>
            </div>
            {rewards.length ? (
              <div className="activity-feed padded">
                {rewards.slice(0, 8).map((reward) => (
                  <div className="activity-row" key={`${reward.epoch}-${reward.wallet}-${reward.time}`}>
                    <div>
                      <strong className="mono">{compactAddress(reward.wallet)}</strong>
                      <span>Epoch #{reward.epoch} - {formatDate(reward.time)}</span>
                    </div>
                    <div className="activity-meta">
                      <span className="mono">{formatNumber(reward.rewardAmount, 4)} ${rewardSymbol}</span>
                      <span className={statusClass(reward.status)}>{statusLabel(reward.status)}</span>
                      {reward.txSig ? (
                        <a className="details-button" href={`https://solscan.io/tx/${reward.txSig}`} target="_blank" rel="noreferrer">
                          Solscan
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">The pasture is quiet. Winners will show after settled payouts.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function StatusItem({ label, value, tone }: { label: string; value: string; tone?: "live" | "danger" }) {
  return (
    <div className={tone ? `status-item ${tone}` : "status-item"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
