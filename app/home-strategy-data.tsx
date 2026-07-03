"use client";

import { useEffect, useMemo, useState } from "react";

type Round = {
  epoch: number;
  status: string;
  startedAt: string;
  duration: string;
  rewardBought: number;
  distributedPump: number;
  eligibleCount?: number;
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

const REFRESH_MS = 12_000;
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "ANSEMFY";
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "500K";

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

function formatAmount(value: number, symbol: string, maximumFractionDigits = 4) {
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

function useProtocolData() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    const load = async () => {
      const nextStats = await getJson<StatsResponse>("/api/stats", emptyStats);
      if (active) setStats(nextStats);
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

  return { stats, now };
}

export function HeroCountdown() {
  const { stats, now } = useProtocolData();
  const nextDropTime = stats?.nextDropTime ? Date.parse(stats.nextDropTime) : 0;
  const countdown = nextDropTime ? formatCountdown(nextDropTime - now) : "Loading";

  return (
    <div className="hero-countdown ansemfy-countdown" aria-live="polite">
      <span>Next ANSEM Airdrop</span>
      <strong>{countdown}</strong>
      <div className="hero-total-distributed">
        <span>Total {REWARD_SYMBOL} Airdropped</span>
        <b>{stats ? formatAmount(stats.totalRewardAirdropped, REWARD_SYMBOL, 4) : "Loading"}</b>
      </div>
      <div className="hero-total-distributed">
        <span>Eligible Holders</span>
        <b>{stats ? formatCount(stats.latestEligibleHolders) : "Loading"}</b>
      </div>
    </div>
  );
}

export function RewardExplanation() {
  const steps = [
    ["Hold ANSEMFY", `${ELIGIBILITY_LABEL}+ ${SOURCE_LABEL}`],
    ["Creator fees buy ANSEM", "Airdrops every epoch"],
    ["Automatic airdrops", "No claiming"],
    ["Generate your PFP", "Ansemfy in seconds"],
    ["Join the movement", "Post and tag @Ansemfy_"]
  ];

  return (
    <section className="section ansemfy-how-section" id="how">
      <div className="container">
        <div className="section-kicker">How it works</div>
        <div className="section-head split-head">
          <h2>The token powers the army.</h2>
          <p>Hold ANSEMFY for automatic ANSEM airdrops. Use the generator to become visible inside the movement.</p>
        </div>
        <div className="ansemfy-split-cards" aria-label="Creator fee split">
          <article className="ansemfy-split-card primary">
            <span>80%</span>
            <strong>ANSEM airdrops</strong>
            <p>Creator fees buy and airdrop {REWARD_SYMBOL} to eligible holders.</p>
          </article>
          <article className="ansemfy-split-card">
            <span>20%</span>
            <strong>PFP bonus reserve</strong>
            <p>Reserved for holders using an Ansemified profile picture once verification is connected.</p>
          </article>
        </div>
        <div className="reward-flow ansemfy-flow">
          {steps.map(([title, body], index) => (
            <article className="reward-flow-card ansemfy-flow-card" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="share-example ansemfy-principles">
          {[
            ["Army", "The generator is the front door."],
            ["Auto", "Airdrops settle directly to eligible holders."],
            ["PFP", "Your profile becomes the signal."]
          ].map(([title, body]) => (
            <article className="share-card" key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LatestGeneratedProfiles() {
  const cards = useMemo(() => Array.from({ length: 30 }, (_, index) => index), []);

  return (
    <section className="section ansemfy-gallery-section" id="gallery">
      <div className="container">
        <div className="section-kicker">Latest Ansemfied</div>
        <div className="section-head split-head">
          <h2>An army of profiles.</h2>
          <p>The live generated wall connects to storage next. The visual system is ready for every new Ansemified PFP.</p>
        </div>
        <div className="ansemfy-avatar-wall" aria-label="Ansemified profile wall">
          {[0, 1].map((row) => (
            <div className="ansemfy-avatar-track" key={row}>
              {cards.map((item) => (
                <img
                  className={`ansemfy-avatar-tile variant-${item % 10}`}
                  src="/brand/ansemfy-pfp-example.jpg"
                  alt=""
                  key={`${row}-${item}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LiveAnsemAirdrops() {
  const { stats, now } = useProtocolData();
  const rounds = stats?.roundHistory ?? [];
  const latestRound = rounds[0];
  const nextDropTime = stats?.nextDropTime ? Date.parse(stats.nextDropTime) : 0;
  const countdown = nextDropTime ? formatCountdown(nextDropTime - now) : "Loading";
  const latestTx = latestRound?.txSig ?? stats?.recentRewards?.find((reward) => reward.txSig)?.txSig ?? null;

  return (
    <section className="section ansemfy-airdrop-section" id="airdrops">
      <div className="container">
        <div className="section-kicker">Live ANSEM airdrops</div>
        <div className="section-head split-head">
          <h2>The movement feeds itself.</h2>
          <p>Creator fees buy ANSEM. Settled airdrops and transaction proof come straight from Supabase.</p>
        </div>
        <div className="lux-grid dashboard-grid airdrop-grid">
          <MetricCard label={`Total ${REWARD_SYMBOL} Distributed`} value={stats ? formatAmount(stats.totalRewardAirdropped, REWARD_SYMBOL, 4) : "Loading"} strong />
          <MetricCard label="Eligible Holders" value={stats ? formatCount(stats.latestEligibleHolders) : "Loading"} />
          <MetricCard label="Next Epoch" value={countdown} />
          <MetricCard label="Current Epoch" value={stats ? formatCount(stats.currentEpoch) : "Loading"} />
          <MetricCard label={`${REWARD_SYMBOL} Bought Last Epoch`} value={latestRound ? formatAmount(latestRound.rewardBought, REWARD_SYMBOL, 4) : "Awaiting live epoch"} />
          <MetricCard label="Latest TX" value={latestTx ? compactAddress(latestTx) : "Awaiting tx"} />
        </div>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  strong
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <article className={strong ? "metric-card metric-card-strong" : "metric-card"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function RecentAirdrops() {
  const { stats } = useProtocolData();
  const rounds = stats?.roundHistory ?? [];
  const rewards = stats?.recentRewards ?? [];

  return (
    <section className="section recent-airdrops-section ansemfy-history-section">
      <div className="container">
        <div className="section-kicker">Airdrop proof</div>
        <div className="section-head split-head">
          <h2>Receipts, not promises.</h2>
          <p>Only settled backend records are counted as distributed rewards.</p>
        </div>
        <div className="history-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Epoch</th>
                  <th>{REWARD_SYMBOL} Bought</th>
                  <th>Eligible Holders</th>
                  <th>Distributed</th>
                  <th>TX</th>
                </tr>
              </thead>
              <tbody>
                {rounds.length ? (
                  rounds.slice(0, 8).map((round) => (
                    <tr key={`${round.epoch}-${round.startedAt}`}>
                      <td>#{round.epoch}</td>
                      <td>{formatAmount(round.rewardBought, REWARD_SYMBOL)}</td>
                      <td>{round.eligibleCount ? formatCount(round.eligibleCount) : statusLabel(round.status)}</td>
                      <td>{formatAmount(round.distributedPump, REWARD_SYMBOL)}</td>
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
                    <td colSpan={5}>Awaiting settled ANSEM airdrops.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="history-card compact-rewards-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>{REWARD_SYMBOL} Received</th>
                  <th>Time</th>
                  <th>TX</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length ? (
                  rewards.slice(0, 12).map((reward) => (
                    <tr key={`${reward.wallet}-${reward.time}-${reward.rewardAmount}`}>
                      <td>{compactAddress(reward.wallet)}</td>
                      <td>{formatAmount(reward.rewardAmount, REWARD_SYMBOL)}</td>
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
                    <td colSpan={4}>Awaiting settled holder transfers.</td>
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
