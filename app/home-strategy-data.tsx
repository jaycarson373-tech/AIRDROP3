"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Round = {
  epoch: number;
  status: string;
  startedAt: string;
  duration: string;
  claimedSol?: number;
  rewardBought: number;
  distributedPump: number;
  eligibleCount?: number;
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
    holderBoost: string;
    solBalanceTier: string;
    solBoost: string;
    finalWeight: number | null;
    totalRewardEarned: number;
    lastAirdropAt: string | null;
    permanentlyIneligible: boolean;
    ineligibleReason: string | null;
  }>;
};

type MarketPrice = {
  symbol: string;
  priceUsd: number | null;
  change24h: number | null;
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
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "BULLSTRAT";
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const SOURCE_MINT = process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "YLkZ3NSYF1Xyj4eEzhg4PDjda1wJkr3zYXuNCpCpump";
const REWARD_MINT = process.env.NEXT_PUBLIC_ANSEM_TOKEN_MINT ?? process.env.NEXT_PUBLIC_REWARD_TOKEN_MINT ?? "9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump";
const SOL_MINT = process.env.NEXT_PUBLIC_SOL_MINT ?? "So11111111111111111111111111111111111111112";
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

function formatCurrency(value: number | null) {
  if (!Number.isFinite(value ?? NaN) || value === null) return "Awaiting market pair";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: value < 1 ? 6 : 2 })}`;
}

function formatPercent(value: number | null) {
  if (!Number.isFinite(value ?? NaN) || value === null) return "Awaiting";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
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
  const totalDistributed =
    stats && stats.totalRewardAirdropped > 0
      ? `${stats.totalRewardAirdropped.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${REWARD_SYMBOL}`
      : "Awaiting first airdrop";

  return (
    <div className="hero-countdown" aria-live="polite">
      <span>Next ANSEM Airdrop</span>
      <strong>{countdown}</strong>
      <div className="hero-total-distributed">
        <span>Total {REWARD_SYMBOL} Airdropped</span>
        <b>{totalDistributed}</b>
      </div>
      <div className="hero-total-distributed">
        <span>Total Epochs</span>
        <b>{stats ? formatCount(stats.totalEpochs) : "Loading"}</b>
      </div>
    </div>
  );
}

export function LiveProtocolDashboard() {
  const { stats, now } = useProtocolData();
  const rounds = stats?.roundHistory ?? [];
  const nextDropTime = stats?.nextDropTime ? Date.parse(stats.nextDropTime) : 0;
  const countdown = nextDropTime ? formatCountdown(nextDropTime - now) : "Loading";
  const latestRound = rounds[0];
  const claimedToday = sumRounds(rounds, "claimedSol");

  return (
    <section className="section live-section airdrop-section" id="dashboard">
      <div className="container">
        <div className="section-kicker">Live strategy dashboard</div>
        <div className="section-head split-head">
          <h2>Two engines. One bull thesis.</h2>
          <p>Live airdrop values come from Supabase. SOL long, PnL, buyback, and burn fields stay marked as awaiting live strategy integration until real transactions exist.</p>
        </div>
        <div className="lux-grid dashboard-grid airdrop-grid">
          <MetricCard label={`Total ${REWARD_SYMBOL} Airdropped`} value={stats ? formatAmount(stats.totalRewardAirdropped, REWARD_SYMBOL, 4) : "Loading"} strong />
          <MetricCard label="SOL Long Allocation" value="Awaiting long integration" muted />
          <MetricCard label="Current SOL PnL" value="Awaiting perp data" muted />
          <MetricCard label={`${SOURCE_LABEL} Burned`} value="Awaiting burn tx" muted />
          <MetricCard label="Eligible Holders" value={stats ? formatCount(stats.latestEligibleHolders) : "Loading"} />
          <MetricCard label="Next Epoch" value={countdown} />
          <MetricCard label="Total Epochs" value={stats ? formatCount(stats.totalEpochs) : "Loading"} />
          <MetricCard label="Creator Fees Seen" value={claimedToday > 0 ? `${formatNumber(claimedToday, 4)} SOL recent` : "Awaiting live claims"} />
        </div>
      </div>
    </section>
  );
}

function sumRounds(rounds: Round[], key: "rewardBought" | "distributedPump" | "claimedSol") {
  return rounds.reduce((sum, round) => sum + (Number.isFinite(round[key] ?? NaN) ? Number(round[key]) : 0), 0);
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

export function RewardExplanation() {
  return (
    <section className="section reward-explainer-section bull-flow-section" id="how">
      <div className="container">
        <div className="section-kicker">How it works</div>
        <div className="section-head split-head">
          <h2>Fees split into ANSEM and SOL.</h2>
          <p>The ANSEM side runs the proven airdrop path. The SOL long side is tracked separately so burns only come from realized strategy profit.</p>
        </div>
        <div className="reward-flow">
          {[
            `Hold at least ${ELIGIBILITY_LABEL} ${SOURCE_LABEL}`,
            "Creator fees enter the strategy",
            "50% buys ANSEM for holder airdrops",
            "50% funds the SOL long reserve",
            `Realized profits buy back and burn ${SOURCE_LABEL}`
          ].map((item) => (
            <article className="reward-flow-card" key={item}>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
        <div className="share-example bull-split-example">
          {[
            ["ANSEM Engine", "50%", "Buy and airdrop ANSEM to eligible holders."],
            ["SOL Engine", "50%", "Reserve for scaled SOL perpetual long strategy."],
            ["Burn Engine", "Profit only", `Realized profits buy back and burn ${SOURCE_SYMBOL}.`]
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

export function LiveMarketDashboard() {
  const prices = useMarketPrices();

  return (
    <section className="section market-dashboard-section" id="markets">
      <div className="container">
        <div className="section-kicker">Live market dashboard</div>
        <div className="section-head split-head">
          <h2>Market tape.</h2>
          <p>Prices load from live market pairs when available. Missing pairs are labeled instead of guessed.</p>
        </div>
        <div className="lux-grid dashboard-grid">
          {prices.map((price) => (
            <MetricCard
              key={price.symbol}
              label={`${price.symbol} Price`}
              value={`${formatCurrency(price.priceUsd)} / ${formatPercent(price.change24h)} 24h`}
            />
          ))}
          <MetricCard label="Current SOL Long Entry" value="Awaiting position data" muted />
          <MetricCard label="Unrealized PnL" value="Awaiting perp data" muted />
          <MetricCard label="Realized PnL" value="Awaiting close tx" muted />
        </div>
      </div>
    </section>
  );
}

function useMarketPrices() {
  const [prices, setPrices] = useState<MarketPrice[]>([
    { symbol: "SOL", priceUsd: null, change24h: null },
    { symbol: REWARD_SYMBOL, priceUsd: null, change24h: null },
    { symbol: SOURCE_SYMBOL, priceUsd: null, change24h: null }
  ]);

  useEffect(() => {
    let active = true;
    const tokens = [
      ["SOL", SOL_MINT],
      [REWARD_SYMBOL, REWARD_MINT],
      [SOURCE_SYMBOL, SOURCE_MINT]
    ].filter(([, mint]) => Boolean(mint));

    const load = async () => {
      const next = await Promise.all(
        tokens.map(async ([symbol, mint]) => {
          try {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, { cache: "no-store" });
            if (!response.ok) throw new Error("price fetch failed");
            const data = (await response.json()) as {
              pairs?: Array<{ priceUsd?: string; priceChange?: { h24?: number } }>;
            };
            const pair = data.pairs?.find((entry) => Number(entry.priceUsd) > 0) ?? data.pairs?.[0];
            return {
              symbol,
              priceUsd: pair?.priceUsd ? Number(pair.priceUsd) : null,
              change24h: Number.isFinite(pair?.priceChange?.h24) ? pair?.priceChange?.h24 ?? null : null
            };
          } catch {
            return { symbol, priceUsd: null, change24h: null };
          }
        })
      );
      if (active) setPrices(next);
    };

    load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return prices;
}

export function PermanentEligibility() {
  return (
    <section className="section eligibility-section" id="eligibility">
      <div className="container warning-layout">
        <div>
          <div className="section-kicker">Eligibility</div>
          <h2>Hold {ELIGIBILITY_LABEL}+ {SOURCE_LABEL}.</h2>
          <p className="lead">Eligibility is scanned every epoch. The configured environment value is the source of truth for live launches.</p>
        </div>
        <div className="eligibility-flow">
          {[`${ELIGIBILITY_LABEL}+ ${SOURCE_LABEL}`, "Holder Snapshot", "ANSEM Airdrop", "Proof TX", "Live Ledger"].map((item, index) => (
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
        <div className="section-kicker">Holder board</div>
        <div className="section-head split-head">
          <h2>BULL BOARD</h2>
          <p>Top eligible holders by live backend state, showing {SOURCE_LABEL} held, strategy weight, total {REWARD_SYMBOL} earned, and last settled airdrop.</p>
          <a className="cta secondary" href="/fallen-bulls">
            Ineligible Wallets
          </a>
        </div>
        <div className="history-card bull-board-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>{SOURCE_LABEL} Held</th>
                  <th>Supply Share</th>
                  <th>Strategy Weight</th>
                  <th>Total {REWARD_SYMBOL} Earned</th>
                  <th>Last Airdrop</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.slice(0, 25).map((holder) => {
                    const lastReward = recentRewards.find((reward) => reward.wallet === holder.address);
                    const recentEarned = holder.totalRewardEarned ?? earnedByWallet.get(holder.address) ?? 0;
                    return (
                      <tr key={holder.address}>
                        <td>{compactAddress(holder.address)}</td>
                        <td>{formatNumber(holder.balance, 0)}</td>
                        <td>{holder.percentage}%</td>
                        <td>{holder.finalWeight ? formatNumber(holder.finalWeight, 0) : "Live balance weight"}</td>
                        <td>{recentEarned > 0 ? formatAmount(recentEarned, REWARD_SYMBOL) : "Awaiting holder totals"}</td>
                        <td>{holder.lastAirdropAt ? formatDate(holder.lastAirdropAt) : lastReward ? formatDate(lastReward.time) : "Awaiting airdrop"}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6}>Awaiting Bull Board.</td>
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

export function RecentAirdrops() {
  const { stats } = useProtocolData();
  const rounds = stats?.roundHistory ?? [];
  const rewards = stats?.recentRewards ?? [];

  return (
    <section className="section recent-airdrops-section" id="airdrops">
      <div className="container">
        <div className="section-kicker">ANSEM airdrops</div>
        <div className="section-head split-head">
          <h2>Tracked on-chain.</h2>
          <p>Settled ANSEM transfers from the live backend. Failed or skipped attempts are not counted.</p>
        </div>
        <div className="history-card bull-history-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Epoch</th>
                  <th>ANSEM Bought</th>
                  <th>Eligible Holders</th>
                  <th>Amount Distributed</th>
                  <th>TX Link</th>
                </tr>
              </thead>
              <tbody>
                {rounds.length ? (
                  rounds.slice(0, 12).map((round) => (
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
                  <th>TX Link</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length ? (
                  rewards.slice(0, 20).map((reward) => (
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

export function SolLongStrategy() {
  return (
    <section className="section sol-long-section" id="long">
      <div className="container split-section">
        <div>
          <div className="section-kicker">SOL long strategy</div>
          <h2>Scaled exposure, separate from airdrops.</h2>
          <p className="lead">The worker now protects the SOL reserve and caps the ANSEM buy side at the configured split. The SOL-long executor and PnL feed should write real position data before this panel shows numbers.</p>
        </div>
        <div className="history-card strategy-status-card">
          {[
            ["Total Allocated", "Awaiting strategy wallet integration"],
            ["Average Entry", "Awaiting position data"],
            ["Current SOL Price", "Loaded in market dashboard"],
            ["Unrealized PnL", "Awaiting perp data"],
            ["Realized PnL", "Awaiting close tx"],
            ["Last Position Update", "Awaiting live integration"]
          ].map(([label, value]) => (
            <div className="strategy-status-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BuybackBurnSection() {
  return (
    <section className="section buyback-burn-section" id="burns">
      <div className="container">
        <div className="section-kicker">Buyback & burn</div>
        <div className="section-head split-head">
          <h2>Profits reduce supply.</h2>
          <p>Buybacks and burns are only displayed when realized SOL-long profit transactions exist. No placeholders are counted as burned supply.</p>
        </div>
        <div className="lux-grid dashboard-grid">
          <MetricCard label="Profit Realized" value="Awaiting close tx" muted />
          <MetricCard label={`${SOURCE_LABEL} Bought`} value="Awaiting buyback tx" muted />
          <MetricCard label={`${SOURCE_LABEL} Burned`} value="Awaiting burn tx" muted />
          <MetricCard label="Total Burned" value="Awaiting burn ledger" muted />
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
          <h2>Check your strategy status.</h2>
          <p className="lead">Wallet-level status uses the live holder-state tracker after the first tracked epoch.</p>
        </div>
        <form className="lookup-card" onSubmit={handleSubmit}>
          <label htmlFor="wallet">Wallet address</label>
          <div className="lookup-row">
            <input id="wallet" value={wallet} onChange={(event) => setWallet(event.target.value)} placeholder="Paste wallet address" />
            <button type="submit">Lookup</button>
          </div>
          <div className="lookup-result">
            {submitted ? (
              <>
                <strong>{compactAddress(wallet)}</strong>
                <span>Awaiting live backend integration for wallet-level strategy status.</span>
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
