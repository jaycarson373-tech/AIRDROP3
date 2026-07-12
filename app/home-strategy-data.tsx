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

type MarketToken = {
  priceUsd: number | null;
  change24h: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  url: string | null;
  symbol: string;
};

type MarketResponse = {
  reward: MarketToken;
  source: MarketToken;
  sol: MarketToken;
  updatedAt: string;
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
  fallenBulls?: Array<{
    address: string;
    balance: number;
    currentMultiplier: string | null;
    currentMultiplierBps: number | null;
    currentStreak: number | null;
    totalRewardEarned: number;
    lastAirdropAt: string | null;
    ineligibleReason: string;
    ineligibleAt: string | null;
    lastSeenAt: string | null;
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
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "RTP";
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "PUMP";
const emptyMarket: MarketResponse = {
  reward: {
    priceUsd: null,
    change24h: null,
    marketCapUsd: null,
    fdvUsd: null,
    volume24hUsd: null,
    liquidityUsd: null,
    url: null,
    symbol: REWARD_SYMBOL
  },
  source: {
    priceUsd: null,
    change24h: null,
    marketCapUsd: null,
    fdvUsd: null,
    volume24hUsd: null,
    liquidityUsd: null,
    url: null,
    symbol: SOURCE_SYMBOL
  },
  sol: {
    priceUsd: null,
    change24h: null,
    marketCapUsd: null,
    fdvUsd: null,
    volume24hUsd: null,
    liquidityUsd: null,
    url: null,
    symbol: "SOL"
  },
  updatedAt: new Date().toISOString()
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
  if (!Number.isFinite(value) || value <= 0) return "Awaiting";
  return value.toLocaleString(undefined, { maximumFractionDigits });
}

function formatCount(value: number) {
  if (!Number.isFinite(value) || value < 0) return "Awaiting";
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatUsd(value: number | null | undefined, maximumFractionDigits = 0) {
  if (!Number.isFinite(value ?? NaN) || !value) return "Awaiting";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits })}`;
}

function formatTokenPrice(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN) || !value) return "Awaiting price";
  const maximumFractionDigits = value < 0.0001 ? 10 : value < 0.01 ? 8 : value < 1 ? 6 : 4;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits })}`;
}

function formatCompact(value: number, maximumFractionDigits = 2) {
  if (!Number.isFinite(value) || value <= 0) return "Awaiting";
  return value.toLocaleString(undefined, {
    notation: "compact",
    maximumFractionDigits
  });
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

export function useMarketData() {
  const [market, setMarket] = useState<MarketResponse | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const nextMarket = await getJson<MarketResponse>("/api/market", emptyMarket);
      if (active) setMarket(nextMarket);
    };

    load();
    const refreshTimer = window.setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  return market;
}

export function HeroCountdown() {
  const { stats, now } = useProtocolData();
  const nextDropTime = stats?.nextDropTime ? Date.parse(stats.nextDropTime) : 0;
  const msUntilDrop = nextDropTime ? nextDropTime - now : 0;
  const latestRound = stats?.roundHistory?.[0];
  const isDistributing = latestRound?.status === "running" || (Boolean(nextDropTime) && msUntilDrop <= 0);
  const countdown = nextDropTime ? formatCountdown(msUntilDrop) : "Loading";
  const totalDistributed =
    stats && stats.totalRewardAirdropped > 0
      ? `${stats.totalRewardAirdropped.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${REWARD_SYMBOL}`
      : "Awaiting first drop";

  return (
    <div className={isDistributing ? "hero-countdown is-distributing" : "hero-countdown"} aria-live="polite">
      <span>{isDistributing ? "Airdrop in progress" : "$PUMP payouts every 10 minutes"}</span>
      <strong>{isDistributing ? "DISTRIBUTING AIRDROP" : countdown}</strong>
      <div className="hero-payout-note">
        {isDistributing ? "Eligible holders are being paid now." : "Next automatic payout window."}
      </div>
      <div className="hero-total-distributed">
        <span>Total $PUMP Paid</span>
        <b>{totalDistributed}</b>
      </div>
    </div>
  );
}

export function AirdroppedStat() {
  const { stats } = useProtocolData();
  const totalAirdropped = stats?.totalRewardAirdropped ?? 0;

  return (
    <>
      <strong>{totalAirdropped > 0 ? formatCompact(totalAirdropped, 2) : "Awaiting"}</strong>
      <span>{REWARD_SYMBOL} airdropped</span>
    </>
  );
}

export function LiveProtocolDashboard() {
  const { stats, now } = useProtocolData();
  const market = useMarketData();
  const rounds = stats?.roundHistory ?? [];
  const nextDropTime = stats?.nextDropTime ? Date.parse(stats.nextDropTime) : 0;
  const countdown = nextDropTime ? formatCountdown(nextDropTime - now) : "Loading";
  const latestRound = rounds[0];

  return (
    <section className="section live-section airdrop-section" id="dashboard">
      <div className="container">
        <div className="section-kicker">Live dashboard</div>
        <div className="section-head split-head">
          <h2>Return to Pump dashboard.</h2>
          <p>Live values come from the reward backend. Total payouts, eligible holders, $PUMP bought, and transactions update from Supabase.</p>
        </div>
        <div className="lux-grid dashboard-grid airdrop-grid">
          <MetricCard label="Total $PUMP Paid" value={stats ? formatAmount(stats.totalRewardAirdropped, REWARD_SYMBOL, 4) : "Loading"} strong />
          <MetricCard label="$PUMP Price" value={market ? formatTokenPrice(market.reward.priceUsd) : "Loading"} strong />
          <MetricCard label="Eligible Holders" value={stats ? formatCount(stats.latestEligibleHolders) : "Loading"} />
          <MetricCard label="$PUMP Bought" value={latestRound ? formatAmount(latestRound.rewardBought, REWARD_SYMBOL, 4) : "Awaiting live distribution"} />
          <MetricCard label="Next $PUMP Payout" value={countdown} />
          <MetricCard label="Avg Holder Multiplier" value={stats?.averageMultiplier ? formatMultiplier(stats.averageMultiplier) : "Live epoch score"} muted />
          <MetricCard label="Last Drop TX" value={latestRound?.txSig ? compactAddress(latestRound.txSig) : "Awaiting tx"} muted />
        </div>
      </div>
    </section>
  );
}

export function MarketVolumeSection() {
  const robinhoodVolume = 750_000_000;
  const solanaVolume = 1_800_000_000;
  const combinedVolume = robinhoodVolume + solanaVolume;
  const robinhoodShare = (robinhoodVolume / combinedVolume) * 100;
  const solanaShare = 100 - robinhoodShare;

  return (
    <section className="section market-volume-section" id="volume">
      <div className="container volume-panel">
        <div className="volume-head">
          <div className="section-kicker">Volume today</div>
          <h2>Hood volume is not the whole market.</h2>
        </div>
        <div className="volume-race" aria-label="Robinhood volume versus Solana volume">
          <div className="volume-card hood-volume-card">
            <span>Robinhood volume</span>
            <strong>$750M</strong>
            <small>{robinhoodShare.toFixed(1)}% of combined volume</small>
          </div>
          <div className="volume-divider" aria-hidden="true">
            <b>VS</b>
          </div>
          <div className="volume-card sol-volume-card">
            <span>Solana volume</span>
            <strong>$1.8B</strong>
            <small>{solanaShare.toFixed(1)}% of combined volume</small>
          </div>
        </div>
        <div className="volume-verdict">
          <strong>Solana is 2.4x Robinhood volume today.</strong>
          <span>Return to Pump sits where attention comes back on-chain.</span>
        </div>
        <div className="volume-bars" aria-hidden="true">
          <i className="hood-volume-bar" style={{ width: `${robinhoodShare}%` }} />
          <i className="sol-volume-bar" style={{ width: `${solanaShare}%` }} />
        </div>
        <div className="volume-foot">
          <span>Robinhood $750M</span>
          <span>Solana $1.8B</span>
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

const hoodModelCards = [
  ["01", "Fees collected", "Creator fees are pulled every 10 minutes."],
  ["02", "$PUMP bought", "Fees buy $PUMP for eligible holders."],
  ["03", "Holders paid", "Lower-balance and lower-SOL wallets get boosted weighting."],
  ["04", "Receipts posted", "Completed payouts are listed with transaction proof."]
];

const solBoostCards = [
  ["Claim", "fees"],
  ["Buy", "$PUMP"],
  ["Airdrop", "holders"],
  ["Receipt", "posted"]
];

const holderMultiplierCards = [
  ["1 hour", "1.5x", "first hold boost"],
  ["1 day", "2x", "day-one weight"],
  ["1 week", "5x", "sticky holder tier"],
  ["1 month", "10x", "max loyalty weight"]
];

export function RewardModelSection() {
  return (
    <section className="section conviction-section" id="reward-model">
      <div className="container">
        <div className="section-kicker">Reward model</div>
        <div className="section-head split-head">
          <h2>Hold RTP. Earn $PUMP.</h2>
          <p>For holders who want the Pump rail without waiting on Hood narratives. Rewards run every 10 minutes and stack holder-time multipliers with smaller-holder weighting.</p>
        </div>
        <div className="multiplier-grid">
          {hoodModelCards.map(([value, title, copy]) => (
            <article className="multiplier-card" key={title}>
              <span>{value}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
              <strong>{title}</strong>
            </article>
          ))}
        </div>
        <div className="rank-strip boost-strip" aria-label="Return to Pump payout loop">
          {solBoostCards.map(([tier, boost]) => (
            <span key={tier}>{tier}: {boost}</span>
          ))}
        </div>
        <div className="holder-multiplier-ladder" aria-label="Holder multiplier ladder">
          <div className="holder-multiplier-copy">
            <span>Holder multiplier</span>
            <h3>Longer hold. Bigger payout weight.</h3>
            <p>Multiplier applies to the live holder score before each $PUMP airdrop. It stacks with the smaller-wallet and lower-SOL tilt.</p>
          </div>
          <div className="holder-multiplier-tiers">
            {holderMultiplierCards.map(([time, multiplier, copy]) => (
              <article className="holder-multiplier-tier" key={time}>
                <span>{time}</span>
                <strong>{multiplier}</strong>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="conviction-card streak-card">
          <span>Automatic rewards</span>
          <h3>$PUMP rewards for RTP holders</h3>
          <div className="streak-readout">
            <div>
              <span>Hold</span>
              <strong>1M+ RTP</strong>
            </div>
            <div>
              <span>Earn</span>
              <strong>$PUMP</strong>
            </div>
            <div>
              <span>Max boost</span>
              <strong>10x</strong>
            </div>
          </div>
          <div className="conviction-progress" aria-hidden="true">
            <i />
          </div>
          <p>No bridge. No claiming. No staking. Eligible wallets are paid every 10 minutes, with boosted weighting for hold time, smaller bags, and lower-SOL wallets.</p>
          <div className="max-row">
            <span>Payout split</span>
            <b>100% to holders</b>
          </div>
        </div>
      </div>
      <div className="container rank-strip" aria-label="Reward model">
        {["Fees collected", "$PUMP bought", "Eligible holders paid", "TX proof posted"].map((rank) => (
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
          <h2>Hold 1M+ RTP.</h2>
        </div>
        <div className="eligibility-flow">
          {[`1M+ $${SOURCE_SYMBOL}`, "Fees claimed", "$PUMP bought", "Airdrop sent", "Receipt posted"].map((item, index) => (
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
          <div className="section-kicker">How rewards pay</div>
        <div className="section-head split-head">
          <h2>Creator fees become holder rewards.</h2>
          <p>Every 10 minutes follows the same loop. Collect fees, buy $PUMP, boost smaller wallets, pay eligible RTP holders, post the receipt.</p>
        </div>
        <div className="reward-flow">
          {[
            `Hold 1M+ $${SOURCE_SYMBOL}`,
            "Creator fees are collected",
            "$PUMP is bought",
            "Holder-time multiplier is applied",
            "Smaller wallets get boosted weighting",
            "Eligible holders get paid automatically",
            "Transaction proof is posted"
          ].map((item) => (
            <article className="reward-flow-card" key={item}>
              <strong>{item}</strong>
            </article>
          ))}
        </div>
        <div className="share-example">
          {[
            ["Eligibility", "1M+ RTP", "minimum balance"],
            ["Rewards", "$PUMP", "every 10 minutes"],
            ["Multiplier", "1.5x-10x", "1h / 1d / 1w / 1m"],
            ["Weighting", "Skewed", "smaller wallets boosted"],
            ["Proof", "On-chain", "settled transactions"]
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
    <section className="section bull-board-section" id="board">
      <div className="container">
        <div className="section-kicker">RTP board</div>
        <div className="section-head split-head">
          <h2>RTP BOARD</h2>
          <p>Clean holder table showing RTP balance, holder weight, earned $PUMP, and latest payout activity.</p>
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
                  <th>$RTP Held</th>
                  <th>Status</th>
                  <th>Hold Multiplier</th>
                  <th>Rail</th>
                  <th>Receipt</th>
                  <th>Holder Weight</th>
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
                        <td>{holder.permanentlyIneligible ? "Out" : "Eligible"}</td>
                        <td>{holder.currentMultiplier ?? "1.00x"}</td>
                        <td>$PUMP</td>
                        <td>{holder.lastAirdropAt ? "Posted" : "Awaiting"}</td>
                        <td>{holder.finalWeight ? formatNumber(holder.finalWeight, 0) : "Scored live"}</td>
                        <td>{recentEarned > 0 ? formatAmount(recentEarned, REWARD_SYMBOL) : "Awaiting holder totals"}</td>
                        <td>{holder.lastAirdropAt ? formatDate(holder.lastAirdropAt) : lastReward ? formatDate(lastReward.time) : "Awaiting airdrop"}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9}>Awaiting Return to Pump board.</td>
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
  const rewards = stats?.recentRewards ?? [];

  return (
    <section className="section recent-airdrops-section" id="airdrops">
      <div className="container">
        <div className="section-kicker">Payout history</div>
        <div className="section-head split-head">
          <h2>Receipts or it did not happen.</h2>
          <p>Settled $PUMP transfers from the live backend. Failed or skipped attempts are not counted.</p>
        </div>
        <div className="history-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Wallet</th>
                  <th>Asset</th>
                  <th>{REWARD_SYMBOL} Paid</th>
                  <th>Time</th>
                  <th>TX Link</th>
                </tr>
              </thead>
              <tbody>
                {rewards.length ? (
                  rewards.slice(0, 50).map((reward) => (
                    <tr key={`${reward.wallet}-${reward.time}-${reward.rewardAmount}`}>
                      <td>{compactAddress(reward.wallet)}</td>
                      <td>{reward.goldenMultiplier > 1 ? `${reward.goldenMultiplier.toFixed(2)}x Bank Bonus` : "Base"}</td>
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
                    <td colSpan={5}>Awaiting settled $PUMP payouts.</td>
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
          <h2>Check your RTP status.</h2>
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
                <span>Awaiting live backend integration for wallet-level RTP status.</span>
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
    <section className="section history-section" id="airdrops-history">
      <div className="container">
        <div className="section-kicker">Payout history</div>
        <div className="section-head split-head">
          <h2>{REWARD_SYMBOL} Payouts</h2>
          <p>Settled payouts only. Failed or skipped worker attempts are not counted.</p>
        </div>
        <div className="history-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Epoch</th>
                  <th>{REWARD_SYMBOL} Bought</th>
                  <th>Recipients</th>
                  <th>Holder Weight</th>
                  <th>Total Paid</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {rounds.length ? (
                  rounds.map((round) => (
                    <tr key={`${round.epoch}-${round.startedAt}`}>
                      <td>#{round.epoch}</td>
                      <td>{formatAmount(round.rewardBought, REWARD_SYMBOL)}</td>
                      <td>{round.distributedPump > 0 ? "Settled" : statusLabel(round.status)}</td>
                      <td>RTP Score</td>
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
                    <td colSpan={6}>Awaiting settled $PUMP payouts.</td>
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
