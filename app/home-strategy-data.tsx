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
  goldenMultiplier: number;
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
  averageMultiplier: number | null;
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
    currentMultiplier: string | null;
    currentMultiplierBps: number | null;
    currentHoldTime: string | null;
    currentStreak: number | null;
    totalAnsemEarned: number;
    lastFeedingAt: string | null;
    permanentlyIneligible: boolean;
    ineligibleReason: string | null;
  }>;
};

const emptyStats: StatsResponse = {
  currentEpoch: 0,
  totalEpochs: 0,
  lastRewardAirdropped: 0,
  totalRewardAirdropped: 0,
  latestEligibleHolders: 0,
  averageMultiplier: null,
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

function formatMultiplier(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN) || !value) return "Awaiting live state";
  return `${value.toFixed(2)}x`;
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
      <span>Next Feeding</span>
      <strong>{countdown}</strong>
    </div>
  );
}

export function LiveProtocolDashboard() {
  const { stats } = useProtocolData();
  const rounds = stats?.roundHistory ?? [];
  const todaysFeedings = countToday(rounds);

  return (
    <section className="section live-section feeding-section" id="dashboard">
      <div className="container">
        <div className="section-kicker">Feeding stats</div>
        <div className="section-head split-head">
          <h2>The protocol feeds live.</h2>
          <p>Live values come from the existing reward backend. No fake production data.</p>
        </div>
        <div className="lux-grid dashboard-grid feeding-grid">
          <MetricCard label="ANSEM Purchased" value={formatAmount(sumRounds(rounds, "rewardBought"), "ANSEM")} />
          <MetricCard label="Today's Feedings" value={stats ? formatCount(todaysFeedings) : "Loading"} />
          <MetricCard label="Current Epoch" value={stats ? formatCount(stats.currentEpoch) : "Loading"} />
          <MetricCard label="Eligible Bulls" value={stats ? formatCount(stats.latestEligibleHolders) : "Loading"} strong />
          <MetricCard label="Average Multiplier" value={formatMultiplier(stats?.averageMultiplier)} muted />
        </div>
      </div>
    </section>
  );
}

function countToday(rounds: Round[]) {
  const today = new Date().toDateString();
  return rounds.filter((round) => new Date(round.startedAt).toDateString() === today).length;
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

const multiplierTiers = [
  ["Bull", "Bull", "0-4 min", "1.00×"],
  ["Conviction", "Conviction", "5-14 min", "2.00×"],
  ["Strong", "Strong Bull", "15-29 min", "5.00×"],
  ["Diamond", "Diamond Bull", "30+ min", "10.00×"]
];

const ranks = ["Initiate", "Holder", "Conviction", "Strong Bull", "Diamond Bull", "Final Bull"];

export function ConvictionSection() {
  return (
    <section className="section conviction-section" id="conviction">
      <div className="container">
        <div className="section-kicker">Current Multiplier</div>
        <div className="section-head split-head">
          <h2>Stay longer. Earn a larger share.</h2>
          <p>Every 5 minutes = one epoch.</p>
        </div>
        <div className="multiplier-grid">
          {multiplierTiers.map(([icon, title, time, multiplier]) => (
            <article className="multiplier-card" key={title}>
              <span>{icon}</span>
              <h3>{title}</h3>
              <p>{time}</p>
              <strong>{multiplier}</strong>
            </article>
          ))}
        </div>
        <div className="reset-warning-card">
          <span>Permanent rule</span>
          <strong>Selling any amount of $BULL permanently removes eligibility.</strong>
          <p>Dropping below 1,000,000 $BULL also permanently removes eligibility.</p>
        </div>
        <div className="conviction-card streak-card">
          <span>Live hold time</span>
          <h3>Current Multiplier</h3>
          <div className="streak-readout">
            <div>
              <span>Current Multiplier</span>
              <strong>Live after next tracked epoch</strong>
            </div>
            <div>
              <span>Current Hold Time</span>
              <strong>Live after next tracked epoch</strong>
            </div>
            <div>
              <span>Next Milestone</span>
              <strong>5 min</strong>
            </div>
          </div>
          <div className="conviction-progress" aria-hidden="true">
            <i />
          </div>
          <p>Selling ends eligibility. The Bull only remembers continuous holding.</p>
          <div className="max-row">
            <span>Maximum</span>
            <b>10×</b>
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
        <div className="eligibility-flow">
          {["Hold 1,000,000+ $BULL", "Every 5 Minutes", "Hold Time Builds", "Sell = Forever Out"].map((item, index) => (
            <article className="eligibility-card" key={item}>
              <span>{index + 1}</span>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function RewardExplanation() {
  return (
    <section className="section reward-explainer-section" id="how">
      <div className="container">
        <div className="section-kicker">How rewards work</div>
        <div className="section-head split-head">
          <h2>Simple: hold BULL, receive ANSEM.</h2>
          <p>Your multiplier increases your share of every distribution.</p>
        </div>
        <div className="reward-flow">
          {[
            "Hold at least 1,000,000 $BULL",
            "Creator fees buy ANSEM every 5 minutes",
            "ANSEM is distributed to every eligible holder",
            "Your multiplier increases your share"
          ].map((item) => (
            <article className="reward-flow-card" key={item}>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
        <div className="share-example">
          {[
            ["Holder A", "1×", "receives one share"],
            ["Holder B", "5×", "receives five shares"],
            ["Holder C", "10×", "receives ten shares"]
          ].map(([holder, multiplier, copy]) => (
            <article className="share-card" key={holder}>
              <span>{holder}</span>
              <strong>{multiplier}</strong>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BullBoard() {
  const { stats, holders } = useProtocolData();
  const recentRewards = stats?.recentRewards ?? [];

  const earnedByWallet = useMemo(() => {
    const totals = new Map<string, number>();
    for (const reward of recentRewards) {
      totals.set(reward.wallet, (totals.get(reward.wallet) ?? 0) + reward.rewardAmount);
    }
    return totals;
  }, [recentRewards]);

  const rows = holders?.topHolders ?? [];

  return (
    <section className="section bull-board-section" id="bull-board">
      <div className="container">
        <div className="section-kicker">Live bull board</div>
        <div className="section-head split-head">
          <h2>THE BULL BOARD</h2>
          <p>Top eligible holders appear first. Permanent-ineligible wallets are removed from the board.</p>
        </div>
        <div className="history-card bull-board-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Current Multiplier</th>
                  <th>Current Hold Time</th>
                  <th>Total ANSEM Earned</th>
                  <th>Last Feeding</th>
                  <th>Current Streak</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.slice(0, 25).map((holder) => {
                    const lastReward = recentRewards.find((reward) => reward.wallet === holder.address);
                    const recentEarned = holder.totalAnsemEarned ?? earnedByWallet.get(holder.address) ?? 0;
                    return (
                      <tr key={holder.address}>
                        <td>{compactAddress(holder.address)}</td>
                        <td>{holder.currentMultiplier ?? "Awaiting live state"}</td>
                        <td>{holder.currentHoldTime ?? "Awaiting live state"}</td>
                        <td>{recentEarned > 0 ? formatAmount(recentEarned, "ANSEM") : "Awaiting holder totals"}</td>
                        <td>{holder.lastFeedingAt ? formatDate(holder.lastFeedingAt) : lastReward ? formatDate(lastReward.time) : "Awaiting feeding"}</td>
                        <td>{holder.currentStreak !== null && holder.currentStreak !== undefined ? `${holder.currentStreak} epochs` : "Awaiting live state"}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>Awaiting live holder board.</td>
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

export function RecentFeedings() {
  const { stats } = useProtocolData();
  const rewards = stats?.recentRewards ?? [];

  return (
    <section className="section recent-feedings-section" id="feedings">
      <div className="container">
        <div className="section-kicker">Recent feedings</div>
        <div className="section-head split-head">
          <h2>Proof the Bull is eating.</h2>
          <p>Settled ANSEM transfers from the live reward backend.</p>
        </div>
        <div className="history-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Multiplier</th>
                  <th>ANSEM Received</th>
                  <th>Time</th>
                  <th>TX Link</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length ? (
                  rewards.slice(0, 50).map((reward) => (
                    <tr key={`${reward.wallet}-${reward.time}-${reward.rewardAmount}`}>
                      <td>{compactAddress(reward.wallet)}</td>
                      <td>{reward.goldenMultiplier > 1 ? `${reward.goldenMultiplier.toFixed(2)}x bonus` : "Live"}</td>
                      <td>{formatAmount(reward.rewardAmount, "ANSEM")}</td>
                      <td>{formatDate(reward.time)}</td>
                      <td>
                        {reward.txSig ? (
                          <a href={`https://solscan.io/tx/${reward.txSig}`} target="_blank" rel="noreferrer">
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
                    <td colSpan={5}>Awaiting settled ANSEM feedings.</td>
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
            Wallet-level status uses the live holder-state tracker after the first tracked epoch.
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

export function FeedingHistory() {
  const { stats } = useProtocolData();
  const rounds = stats?.roundHistory ?? [];

  return (
    <section className="section history-section" id="feedings-history">
      <div className="container">
        <div className="section-kicker">Feeding history</div>
        <div className="section-head split-head">
          <h2>ANSEM Distributions</h2>
          <p>Settled feedings only. Failed or skipped worker attempts are not counted.</p>
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
                      <td>Live holder state</td>
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
                    <td colSpan={6}>Awaiting settled ANSEM feedings.</td>
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
