"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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
  lastRewardAirdropped: number;
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
  lastRewardAirdropped: 0,
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
  if (!address) return "Awaiting";
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  if (!Number.isFinite(value) || value <= 0) return "Awaiting";
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

function formatCount(value: number) {
  if (!Number.isFinite(value) || value < 0) return "Awaiting";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatAmount(value: number, symbol: string, maximumFractionDigits = 2) {
  if (!Number.isFinite(value) || value <= 0) return "Awaiting live distribution";
  return `${formatNumber(value, maximumFractionDigits)} ${symbol}`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Awaiting" : date.toLocaleString();
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function statusLabel(status: string) {
  if (status === "completed" || status === "settled") return "Settled";
  if (status === "running") return "Running";
  return status.replace(/_/g, " ");
}

export function useProtocolData() {
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

export function HeroCountdown() {
  const { stats, now } = useProtocolData();
  const nextDropTime = stats?.nextDropTime ? Date.parse(stats.nextDropTime) : 0;
  const countdown = nextDropTime ? formatCountdown(nextDropTime - now) : "Loading";

  return (
    <div className="hero-countdown" aria-live="polite">
      <span>Next ANSEM Airdrop</span>
      <strong>{countdown}</strong>
    </div>
  );
}

export function LiveProtocolDashboard() {
  const { stats, now } = useProtocolData();
  const rounds = stats?.roundHistory ?? [];
  const latestRound = rounds[0];
  const nextDropTime = stats?.nextDropTime ? Date.parse(stats.nextDropTime) : 0;
  const countdown = nextDropTime ? formatCountdown(nextDropTime - now) : "Loading";

  return (
    <section className="section live-section" id="dashboard">
      <div className="container">
        <div className="section-kicker">Live protocol</div>
        <div className="section-head split-head">
          <h2>Conviction Ledger</h2>
          <p>
            Live values come from the existing reward backend. Conviction-specific fields are labeled until the
            holder-streak backend is connected.
          </p>
        </div>
        <div className="lux-grid dashboard-grid">
          <MetricCard label="Total ANSEM Purchased" value={formatAmount(sumRounds(rounds, "rewardBought"), "ANSEM")} />
          <MetricCard label="Total ANSEM Distributed" value={stats ? formatAmount(stats.totalRewardAirdropped, "ANSEM") : "Loading"} strong />
          <MetricCard label="Current Epoch" value={stats ? formatCount(stats.currentEpoch) : "Loading"} />
          <MetricCard label="Next Distribution" value={countdown} strong />
          <MetricCard label="Eligible Holders" value={stats ? formatCount(stats.latestEligibleHolders) : "Loading"} />
          <MetricCard label="Average Conviction" value="Awaiting streak backend" muted />
          <MetricCard label="Highest Conviction" value="Awaiting streak backend" muted />
          <MetricCard label="Longest Holder" value="Awaiting streak backend" muted />
          <MetricCard label="Total Creator Fees" value="Awaiting fee aggregate" muted />
          <MetricCard label="Current ANSEM Bought" value={latestRound ? formatAmount(latestRound.rewardBought, "ANSEM") : "Awaiting next buy"} />
        </div>
      </div>
    </section>
  );
}
function sumRounds(rounds: Round[], key: "rewardBought" | "distributedPump") {
  return rounds.reduce((sum, round) => sum + (Number.isFinite(round[key]) ? round[key] : 0), 0);
}

function MetricCard({
  label,
  value,
  strong,
  muted
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <article className={strong ? "metric-card metric-card-strong" : muted ? "metric-card metric-card-muted" : "metric-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

const convictionSteps = [
  ["Epoch 1", "1.00x"],
  ["288 Epochs / 1 Day", "1.25x"],
  ["576 Epochs / 2 Days", "1.75x"],
  ["1,008 Epochs / 3.5 Days", "2.50x"],
  ["1,440 Epochs / 5 Days", "4.00x"],
  ["1,728 Epochs / 6 Days", "7.00x"],
  ["2,016 Epochs / 1 Week", "10.00x MAX"]
];

const ranks = ["Initiate", "Disciple", "Stoic", "Sage", "Ascended", "Nietzschean"];

export function ConvictionSection() {
  return (
    <section className="section conviction-section" id="conviction">
      <div className="container conviction-layout">
        <div>
          <div className="section-kicker">Conviction</div>
          <h2>Patience becomes weight.</h2>
          <p className="lead">
            The longer an eligible holder continuously holds, the larger share of every ANSEM distribution they receive.
          </p>
          <div className="conviction-scale">
            {convictionSteps.map(([age, multiplier]) => (
              <div className="scale-row" key={age}>
                <span>{age}</span>
                <strong>{multiplier}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="conviction-card">
          <span>10x Conviction Bonus</span>
          <h3>Current Conviction</h3>
          <div className="conviction-progress" aria-hidden="true">
            <i />
          </div>
          <strong>Awaiting live streak backend</strong>
          <p>Maximum multiplier remains 10x. Existing bonus mechanics are preserved.</p>
          <div className="max-row">
            <span>Maximum</span>
            <b>10x</b>
          </div>
        </div>
      </div>
      <div className="container rank-strip" aria-label="Conviction ranks">
        {ranks.map((rank) => (
          <span key={rank}>{rank}</span>
        ))}
      </div>
    </section>
  );
}

export function PermanentEligibility() {
  return (
    <section className="section eligibility-section" id="eligibility">
      <div className="container warning-layout">
        <div>
          <div className="section-kicker">Eligibility rules</div>
          <h2>Holding is everything.</h2>
        </div>
        <div className="warning-card">
          <span>Requirements</span>
          <strong>Hold 1,000,000+ BULL</strong>
          <ul className="eligibility-rules">
            <li>Every 5 minutes is one epoch.</li>
            <li>Your multiplier increases as your consecutive eligible epoch streak grows.</li>
            <li>Selling any amount of BULL immediately resets your streak to 0.</li>
            <li>Falling below 1,000,000 BULL also resets your streak.</li>
            <li>Stay eligible for 2,016 consecutive epochs, or 1 week, to unlock the 10x Nietzschean Bull multiplier.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export function HolderLookup() {
  const [wallet, setWallet] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(Boolean(wallet.trim()));
  };

  return (
    <section className="section lookup-section" id="lookup">
      <div className="container split-section">
        <div>
          <div className="section-kicker">Holder lookup</div>
          <h2>Measure conviction.</h2>
          <p className="lead">
            Wallet-level streak, eligibility status, estimated reward, and rank require the conviction backend endpoint.
          </p>
        </div>
        <form className="lookup-card" onSubmit={handleSubmit}>
          <label htmlFor="wallet">Wallet address</label>
          <div className="lookup-row">
            <input
              id="wallet"
              value={wallet}
              onChange={(event) => setWallet(event.target.value)}
              placeholder="Paste wallet address"
            />
            <button type="submit">Lookup</button>
          </div>
          <div className="lookup-result">
            {submitted ? (
              <>
                <strong>{compactAddress(wallet)}</strong>
                <span>Awaiting live backend integration for conviction status.</span>
              </>
            ) : (
              <span>Enter a wallet to check eligibility once lookup integration is live.</span>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}

export function AirdropHistory() {
  const { stats } = useProtocolData();
  const rounds = stats?.roundHistory ?? [];

  return (
    <section className="section history-section" id="airdrops">
      <div className="container">
        <div className="section-kicker">Airdrop history</div>
        <div className="section-head split-head">
          <h2>ANSEM Distributions</h2>
          <p>Settled epochs only. Failed or skipped worker attempts are not counted as protocol epochs.</p>
        </div>
        <div className="history-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Epoch</th>
                  <th>ANSEM Purchased</th>
                  <th>Recipients</th>
                  <th>Average Multiplier</th>
                  <th>Total Distributed</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {rounds.length ? (
                  rounds.map((round) => (
                    <tr key={`${round.epoch}-${round.startedAt}`}>
                      <td>#{round.epoch}</td>
                      <td>{formatAmount(round.rewardBought, "ANSEM")}</td>
                      <td>{round.distributedPump > 0 ? "Settled" : statusLabel(round.status)}</td>
                      <td>Awaiting conviction backend</td>
                      <td>{formatAmount(round.distributedPump, "ANSEM")}</td>
                      <td>
                        {round.txSig ? (
                          <a href={`https://solscan.io/tx/${round.txSig}`} target="_blank" rel="noreferrer">
                            Solscan
                          </a>
                        ) : (
                          "Awaiting tx"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>Awaiting settled ANSEM airdrops.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
