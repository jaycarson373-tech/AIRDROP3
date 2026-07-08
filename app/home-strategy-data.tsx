"use client";

import { useEffect, useState } from "react";

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
  totalPfpRewardSol: number;
  pfpRewardWalletBalanceSol: number | null;
  latestEligibleHolders: number;
  nextDropTime: string;
  roundHistory: Round[];
  recentRewards: Reward[];
};

type TokenMarket = {
  priceUsd: number | null;
  change24h: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  url: string | null;
  symbol: string;
};

type MarketResponse = {
  ansem: TokenMarket;
  source: TokenMarket;
  updatedAt: string;
};

const emptyStats: StatsResponse = {
  currentEpoch: 0,
  totalEpochs: 0,
  lastRewardAirdropped: 0,
  totalRewardAirdropped: 0,
  totalPfpRewardSol: 0,
  pfpRewardWalletBalanceSol: null,
  latestEligibleHolders: 0,
  nextDropTime: new Date().toISOString(),
  roundHistory: [],
  recentRewards: []
};

const REFRESH_MS = 12_000;
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "CIH";
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "HOODX";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "1M";

const emptyMarket: MarketResponse = {
  ansem: {
    priceUsd: null,
    change24h: null,
    marketCapUsd: null,
    fdvUsd: null,
    url: null,
    symbol: REWARD_SYMBOL
  },
  source: {
    priceUsd: null,
    change24h: null,
    marketCapUsd: null,
    fdvUsd: null,
    url: null,
    symbol: SOURCE_SYMBOL
  },
  updatedAt: new Date(0).toISOString()
};

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
  if (!Number.isFinite(value) || value <= 0) return "0";
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

function formatCount(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatAmount(value: number, symbol: string, maximumFractionDigits = 4) {
  if (!Number.isFinite(value) || value <= 0) return `0 ${symbol}`;
  return `${formatNumber(value, maximumFractionDigits)} ${symbol}`;
}

function formatTotalAmount(value: number, symbol: string, maximumFractionDigits = 4) {
  if (!Number.isFinite(value) || value < 0) return `0 ${symbol}`;
  return `${value.toLocaleString(undefined, { maximumFractionDigits })} ${symbol}`;
}

function formatPrice(value: number | null) {
  if (!Number.isFinite(value) || value === null || value <= 0) return "$0";
  const maximumFractionDigits = value < 0.01 ? 6 : value < 1 ? 4 : 2;
  return `$${value.toLocaleString(undefined, {
    maximumFractionDigits,
    minimumFractionDigits: value >= 1 ? 2 : 0
  })}`;
}

function formatMoney(value: number | null) {
  if (!Number.isFinite(value) || value === null || value <= 0) return "$0";
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatSol(value: number | null | undefined) {
  if (!Number.isFinite(value) || value === null || value === undefined || value < 0) return "Loading";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL`;
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
  const [market, setMarket] = useState<MarketResponse | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [nextStats, nextMarket] = await Promise.all([
        getJson<StatsResponse>("/api/stats", emptyStats),
        getJson<MarketResponse>("/api/market", emptyMarket)
      ]);
      if (active) {
        setStats(nextStats);
        setMarket(nextMarket);
      }
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

  return { stats, market, now };
}

export function HeroCountdown() {
  const { stats, market, now } = useProtocolData();
  const nextDropTime = stats?.nextDropTime ? Date.parse(stats.nextDropTime) : 0;
  const countdown = nextDropTime ? formatCountdown(nextDropTime - now) : "Loading";
  const latestDistributionTx = stats?.recentRewards?.find((reward) => reward.txSig)?.txSig ?? null;
  const eligibleHolders = stats?.roundHistory?.length ? stats.latestEligibleHolders : 0;
  const sourceMarketCap = market?.source.marketCapUsd ?? market?.source.fdvUsd ?? null;

  return (
    <div className="hero-countdown ansemfy-countdown ansemfication-stats" aria-live="polite">
      <div className="ansemfication-stat">
        <span>{REWARD_SYMBOL} Price</span>
        <strong>{formatPrice(market?.ansem.priceUsd ?? null)}</strong>
      </div>
      <div className="ansemfication-stat">
        <span>{SOURCE_SYMBOL} Price</span>
        <strong>{formatPrice(market?.source.priceUsd ?? null)}</strong>
      </div>
      <div className="ansemfication-stat">
        <span>{SOURCE_SYMBOL} Market Cap</span>
        <strong>{formatMoney(sourceMarketCap)}</strong>
      </div>
      <div className="ansemfication-stat primary">
        <span>Total {REWARD_SYMBOL} Airdropped</span>
        <strong>{stats ? formatTotalAmount(stats.totalRewardAirdropped, REWARD_SYMBOL, 4) : `0 ${REWARD_SYMBOL}`}</strong>
      </div>
      <div className="ansemfication-stat">
        <span>Eligible Holders</span>
        <strong>{stats ? formatCount(eligibleHolders) : "0"}</strong>
      </div>
      <div className="ansemfication-stat">
        <span>Hood Board</span>
        <strong>0</strong>
      </div>
      <div className="ansemfication-stat">
        <span>Next Epoch</span>
        <strong>{countdown === "Loading" ? "0" : countdown}</strong>
      </div>
      <div className="ansemfication-stat">
        <span>Latest {REWARD_SYMBOL} Distribution</span>
        <strong>{stats ? (latestDistributionTx ? compactAddress(latestDistributionTx) : "0") : "0"}</strong>
      </div>
    </div>
  );
}

export function RewardExplanation() {
  return (
    <section className="section ansemfy-how-section" id="rewards">
      <div className="container">
        <div className="section-kicker">Reward Route</div>
        <div className="section-head split-head">
          <h2>100% automated {REWARD_SYMBOL} airdrops.</h2>
          <p>Clean, live, and provable.</p>
        </div>
        <div className="ansemfy-split-cards terminal-reward-route" aria-label="Creator fee route">
          <article className="ansemfy-split-card primary">
            <span>100%</span>
            <strong>{REWARD_SYMBOL} Buybacks</strong>
            <p>Usable creator fees buy {REWARD_SYMBOL} after reserves are protected.</p>
          </article>
          <article className="ansemfy-split-card">
            <span>5m</span>
            <strong>Holder Airdrops</strong>
            <p>{REWARD_SYMBOL} is distributed proportionally to eligible {ELIGIBILITY_LABEL}+ {SOURCE_LABEL} holders. Wallets above 5% are excluded.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

export function HallOfBulls() {
  const { stats } = useProtocolData();

  return (
    <section className="section bullify-army-section" id="army">
      <div className="container">
        <div className="section-kicker">The Hood Board</div>
        <div className="section-head split-head">
          <h2>The cats still in the hood.</h2>
          <p>
            Eligible wallets, reward totals and proof links will live here as the protocol grows.
          </p>
        </div>

        <div className="hall-bulls-stats" aria-label="Hood Board totals">
          <article>
            <span>Total {REWARD_SYMBOL} Sent</span>
            <strong>{stats ? formatAmount(stats.totalRewardAirdropped, REWARD_SYMBOL, 4) : `0 ${REWARD_SYMBOL}`}</strong>
          </article>
          <article>
            <span>Eligible Holders</span>
            <strong>{stats ? formatCount(stats.latestEligibleHolders) : "0"}</strong>
          </article>
          <article>
            <span>Hood Board</span>
            <strong>0</strong>
          </article>
        </div>

        <div className="bullify-leaderboard hall-bulls-leaderboard" aria-label="Hood Board leaderboard">
          <div className="bullify-leaderboard-head hall-bulls-head">
            <span>Rank</span>
            <span>Wallet</span>
            <span>Source Balance</span>
            <span>Rewards Won</span>
            <span>Hold Time</span>
            <span>Last Drop</span>
            <span>Status</span>
          </div>
          <div className="bullify-leaderboard-empty hall-bulls-empty">
            <span className="bullify-empty-pfp" aria-hidden="true" />
            <strong>The Hood Board is warming up.</strong>
            <p>Eligible wallets and reward totals will appear here after live epochs settle.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    ["①", `Hold ${ELIGIBILITY_LABEL}+ ${SOURCE_LABEL}`],
    ["②", `Fees buy ${REWARD_SYMBOL}`],
    ["③", "5%+ wallets excluded"],
    ["④", "Drops settle every 5 minutes"],
    ["⑤", "Receipts hit Solscan"]
  ];

  return (
    <section className="section ansemfy-how-section" id="how">
      <div className="container">
        <div className="section-kicker">How Cat in Hood Works</div>
        <div className="section-head split-head">
          <h2>Hold CIH. Watch HoodX drop.</h2>
          <p>Automatic holder rewards, live every five minutes.</p>
        </div>
        <div className="reward-flow ansemfy-flow">
          {steps.map(([number, title]) => (
            <article className="reward-flow-card ansemfy-flow-card" key={title}>
              <span>{number}</span>
              <strong>{title}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const pfpTiles = Array.from(
  { length: 48 },
  (_, index) => `/brand/cat-pfps/cat-in-hood-pfp-${String(index + 1).padStart(2, "0")}.png`
);

export function CatPfpConveyor() {
  const loopedTiles = [...pfpTiles, ...pfpTiles];

  return (
    <section className="section cat-pfp-conveyor-section" id="pfps">
      <div className="container">
        <div className="section-kicker">Cat PFPs</div>
        <div className="section-head split-head">
          <h2>Pick a cat. Wear the hood.</h2>
          <p>Download a ready-to-use Cat in Hood PFP and join the timeline.</p>
        </div>
      </div>
      <div className="cat-pfp-conveyor" aria-label="Downloadable Cat in Hood PFP conveyor">
        <div className="cat-pfp-track">
          {loopedTiles.map((src, index) => {
            const fileNumber = (index % pfpTiles.length) + 1;
            return (
              <a
                className="cat-pfp-tile"
                href={src}
                download={`cat-in-hood-pfp-${String(fileNumber).padStart(2, "0")}.png`}
                key={`${src}-${index}`}
                title="Download this Cat in Hood PFP"
              >
                <img src={src} alt={`Cat in Hood PFP option ${fileNumber}`} loading="lazy" />
                <span>Download</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LatestHoodActivity() {
  return (
    <section className="section bullify-latest-section" id="latest">
      <div className="container">
        <div className="section-kicker">Hood Board</div>
        <div className="section-head split-head">
          <h2>Proof before hype.</h2>
          <p>The board stays empty until live reward records and holder snapshots settle.</p>
        </div>
        <div className="verified-holder-grid" aria-label="Verified holder flow">
          {[
            ["01", "Snapshot holders"],
            ["02", "Exclude 5%+ wallets"],
            ["03", "Buy HoodX"],
            ["04", "Settle transfers"]
          ].map(([number, label]) => (
            <article key={label}>
              <span>{number}</span>
              <strong>{label}</strong>
            </article>
          ))}
        </div>
        <div className="bullify-profile-marquee" aria-label="Latest Hood Activity">
          <div className="bullify-profile-track">
            {Array.from({ length: 18 }).map((_, index) => (
              <span className="bullify-profile-skeleton" key={`bullified-profile-${index}`} />
            ))}
          </div>
        </div>
        <p className="bullify-profile-empty">No Hood Board activity yet.</p>
      </div>
    </section>
  );
}

export function LiveAnsemAirdrops() {
  const { stats, now } = useProtocolData();
  const rounds = stats?.roundHistory ?? [];
  const rewards = stats?.recentRewards ?? [];
  const latestRound = rounds[0];
  const hasSettledDistribution = Boolean(stats && stats.totalRewardAirdropped > 0);
  const nextDropTime = stats?.nextDropTime ? Date.parse(stats.nextDropTime) : 0;
  const countdown = nextDropTime ? formatCountdown(nextDropTime - now) : "Loading";
  const latestTx = latestRound?.txSig ?? stats?.recentRewards?.find((reward) => reward.txSig)?.txSig ?? null;

  return (
    <section className="section ansemfy-airdrop-section" id="airdrops">
      <div className="container">
        <div className="section-kicker">Live HoodX Drops</div>
        <div className="section-head split-head">
          <h2>Live {REWARD_SYMBOL} Airdrops</h2>
          <p>Automatic holder transfers and transaction proof come straight from the live reward records.</p>
        </div>
        <div className="lux-grid dashboard-grid airdrop-grid">
          <MetricCard label={`Total ${REWARD_SYMBOL} Distributed`} value={stats ? formatAmount(stats.totalRewardAirdropped, REWARD_SYMBOL, 4) : `0 ${REWARD_SYMBOL}`} strong />
          <MetricCard label="Eligible Holders" value={hasSettledDistribution && stats ? formatCount(stats.latestEligibleHolders) : "0"} />
          <MetricCard label="Next Epoch" value={countdown === "Loading" ? "0" : countdown} />
          <MetricCard label="Current Epoch" value={hasSettledDistribution && stats ? formatCount(stats.currentEpoch) : "0"} />
          <MetricCard label={`${REWARD_SYMBOL} Bought Last Epoch`} value={hasSettledDistribution && latestRound ? formatAmount(latestRound.rewardBought, REWARD_SYMBOL, 4) : `0 ${REWARD_SYMBOL}`} />
          <MetricCard label="Latest TX" value={hasSettledDistribution && latestTx ? compactAddress(latestTx) : "0"} />
        </div>
        <div className="history-card bullify-proof-card">
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
                    <td colSpan={5}>Awaiting settled reward drops.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="history-card bullify-proof-card compact-rewards-card">
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
                    <td colSpan={5}>Awaiting settled {REWARD_SYMBOL} airdrops.</td>
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
