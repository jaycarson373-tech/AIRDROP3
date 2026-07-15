"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { CopyCaButton } from "./copy-ca-button";
import { pumpRunnerConfig } from "./pump-runner-config";

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
  normalRewardAmount?: number;
  time: string;
  status: string;
  txSig: string | null;
};

type StatsResponse = {
  currentEpoch: number;
  totalEpochs: number;
  lastRewardAirdropped: number;
  totalRewardAirdropped: number;
  totalSolValueAirdropped: number;
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

type Holder = {
  rank: number;
  address: string;
  balance: number;
  percentage: string;
  currentMultiplier: string | null;
  currentMultiplierBps: number | null;
  currentHoldTime: string | null;
  currentStreak: number | null;
  totalRewardEarned: number;
  rewardEpochs?: number;
  lastAirdropAt: string | null;
};

type WalletReceipt = {
  epochId: string;
  rewardAmount: number;
  dropSolValue: number;
  txSig: string | null;
  time: string;
  status: string;
};

type WalletLookupResponse = {
  wallet: string;
  sourceBalance: number;
  eligible: boolean;
  eligibilityMinimum: number;
  status: string;
  multiplierBps: number | null;
  currentStreak?: number;
  totalRewardReceived: number;
  totalDropSolValue: number;
  lastAirdropAt: string | null;
  receipts: WalletReceipt[];
  error?: string;
};

type HoldersResponse = {
  topHolders: Holder[];
  totalSupply?: number;
  uniqueHolders?: number;
};

type RunnerLiveData = {
  stats: StatsResponse;
  market: MarketResponse;
  holders: HoldersResponse;
  countdown: string;
};

const refreshMs = 12_000;
const tokenLabel = pumpRunnerConfig.tokenLabel;
const sourceSymbol = pumpRunnerConfig.ticker;
const rewardSymbol = pumpRunnerConfig.currentRunner.ticker;

const emptyStats: StatsResponse = {
  currentEpoch: 0,
  totalEpochs: 0,
  lastRewardAirdropped: 0,
  totalRewardAirdropped: 0,
  totalSolValueAirdropped: 0,
  latestEligibleHolders: 0,
  averageMultiplier: null,
  nextDropTime: new Date().toISOString(),
  roundHistory: [],
  recentRewards: []
};

const emptyMarket: MarketResponse = {
  reward: emptyMarketToken(rewardSymbol),
  source: emptyMarketToken(sourceSymbol),
  sol: emptyMarketToken("SOL"),
  updatedAt: new Date().toISOString()
};

const emptyHolders: HoldersResponse = {
  topHolders: [],
  totalSupply: 0,
  uniqueHolders: 0
};

function emptyMarketToken(symbol: string): MarketToken {
  return {
    priceUsd: null,
    change24h: null,
    marketCapUsd: null,
    fdvUsd: null,
    volume24hUsd: null,
    liquidityUsd: null,
    url: null,
    symbol
  };
}

async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return fallback;
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

function useRunnerLiveData(): RunnerLiveData {
  const [stats, setStats] = useState<StatsResponse>(emptyStats);
  const [market, setMarket] = useState<MarketResponse>(emptyMarket);
  const [holders, setHolders] = useState<HoldersResponse>(emptyHolders);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [nextStats, nextMarket, nextHolders] = await Promise.all([
        getJson<StatsResponse>("/api/stats", emptyStats),
        getJson<MarketResponse>("/api/market", emptyMarket),
        getJson<HoldersResponse>("/api/holders", emptyHolders)
      ]);

      if (!active) return;
      setStats(nextStats);
      setMarket(nextMarket);
      setHolders(nextHolders);
    };

    load();
    const refreshTimer = window.setInterval(load, refreshMs);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return {
    stats,
    market,
    holders,
    countdown: formatCountdown(Date.parse(stats.nextDropTime) - now)
  };
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatUsd(value: number | null | undefined, fallback = "Awaiting") {
  if (!Number.isFinite(value ?? NaN) || !value) return fallback;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatPrice(value: number | null | undefined, fallback: string = pumpRunnerConfig.marketTickerFallback.price) {
  if (!Number.isFinite(value ?? NaN) || !value) return fallback;
  const maximumFractionDigits = value < 0.0001 ? 10 : value < 0.01 ? 8 : value < 1 ? 6 : 4;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits })}`;
}

function formatCompactUsd(value: number | null | undefined, fallback: string) {
  if (!Number.isFinite(value ?? NaN) || !value) return fallback;
  return `$${value.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}`;
}

function formatCount(value: number | null | undefined, fallback = "Awaiting") {
  if (!Number.isFinite(value ?? NaN) || value === null || value === undefined) return fallback;
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function formatTokenAmount(value: number | null | undefined, symbol: string, fallback = "Awaiting first drop") {
  if (!Number.isFinite(value ?? NaN) || !value) return fallback;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${symbol}`;
}

function formatSolValue(tokenAmount: number | null | undefined, tokenPriceUsd: number | null | undefined, solPriceUsd: number | null | undefined) {
  if (!Number.isFinite(tokenAmount ?? NaN) || !tokenAmount || !Number.isFinite(tokenPriceUsd ?? NaN) || !tokenPriceUsd || !Number.isFinite(solPriceUsd ?? NaN) || !solPriceUsd) {
    return "0 SOL";
  }

  return `${((tokenAmount * tokenPriceUsd) / solPriceUsd).toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL`;
}

function formatUsdValue(tokenAmount: number | null | undefined, tokenPriceUsd: number | null | undefined) {
  if (!Number.isFinite(tokenAmount ?? NaN) || !tokenAmount || !Number.isFinite(tokenPriceUsd ?? NaN) || !tokenPriceUsd) {
    return "$0";
  }

  return `$${(tokenAmount * tokenPriceUsd).toLocaleString(undefined, { maximumFractionDigits: 4 })}`;
}

function formatSolAmount(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN) || !value) return "0 SOL";
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 5 })} SOL`;
}

function formatTime(value: string | null | undefined) {
  const date = new Date(value ?? "");
  return Number.isNaN(date.getTime()) ? "Queued" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function compactAddress(address: string) {
  if (!address) return "Not set";
  if (address.length <= 12) return address;
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}

function transactionUrl(signature: string | null) {
  return signature ? `https://solscan.io/tx/${signature}` : null;
}

function statusText(status: string) {
  if (status === "settled" || status === "completed") return "Confirmed";
  if (status === "running") return "Processing";
  return status.replace(/_/g, " ");
}

export function MarketTicker({ live }: { live: RunnerLiveData }) {
  const source = live.market.source;
  const scan = live.market.reward;
  const holderCount = live.holders.uniqueHolders ?? live.stats.latestEligibleHolders;
  const items = [
    `CURRENT INDEX DROP ${pumpRunnerConfig.currentRunner.ticker}`,
    `${pumpRunnerConfig.currentRunner.ticker} PRICE ${formatPrice(scan.priceUsd, "Awaiting index price")}`,
    `TOTAL SOL VALUE DROPPED ${formatSolAmount(live.stats.totalSolValueAirdropped)}`,
    `TOTAL EPOCHS ${formatCount(live.stats.totalEpochs || live.stats.currentEpoch, "0")}`,
    `TOTAL HOLDERS ${formatCount(holderCount, pumpRunnerConfig.marketTickerFallback.holderCount)}`,
    `${tokenLabel} PRICE ${formatPrice(source.priceUsd)}`,
    `NEXT AIRDROP ${live.countdown}`,
    `INDEX ENGINE ${pumpRunnerConfig.scannerStatus}`,
    `TREASURY ${pumpRunnerConfig.treasuryStatus}`
  ];

  return (
    <div className="runner-ticker" aria-label="Live SMI6900 market ticker">
      <div className="runner-ticker-track">
        {[0, 1].map((copy) => (
          <div className="runner-ticker-group" key={copy}>
            {items.map((item) => (
              <span key={`${copy}-${item}`}>
                <i aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedBackground() {
  return (
    <div className="smi-background" aria-hidden="true">
      <span className="smi-city-bg smi-city-bg-primary" />
      <span className="smi-city-bg smi-city-bg-secondary" />
      <span className="smi-aurora smi-aurora-one" />
      <span className="smi-aurora smi-aurora-two" />
      <span className="smi-ring smi-ring-one" />
      <span className="smi-ring smi-ring-two" />
      <span className="smi-watermark" />
    </div>
  );
}

function RunnerNav() {
  const ca = pumpRunnerConfig.contractAddress;
  return (
    <header className="runner-nav">
      <a className="runner-brand" href="#top" aria-label="SMI6900 home">
        <img className="runner-brand-logo" src={pumpRunnerConfig.logoSrc} alt="" />
        <span>
          <strong>{pumpRunnerConfig.name}</strong>
          <small>The Solana Meme Index</small>
        </span>
      </a>
      <nav className="runner-links" aria-label="Primary navigation">
        <a href="#board">Index</a>
        <a href="#scanner">Engine</a>
        <a href="#eligibility">Holders</a>
        <a href="#drops">Receipts</a>
      </nav>
      <div className="runner-actions">
        {ca ? <CopyCaButton address={ca} label={compactAddress(ca)} /> : null}
        {pumpRunnerConfig.xUrl ? (
          <a className="runner-small-button" href={pumpRunnerConfig.xUrl} target="_blank" rel="noreferrer">
            X
          </a>
        ) : null}
        <a className="runner-small-button runner-buy-button" href={pumpRunnerConfig.buyUrl} target="_blank" rel="noreferrer">
          Buy SMI6900
        </a>
      </div>
    </header>
  );
}

function HeroSection({ live }: { live: RunnerLiveData }) {
  return (
    <section className="runner-hero" id="top">
      <div className="runner-hero-copy">
        <div className="runner-live-pill">
          <span className="runner-live-dot" />
          SMI6900 INDEX ONLINE
        </div>
        <h1>
          THE SOLANA
          <span>MEME INDEX.</span>
        </h1>
        <p className="runner-hero-subtitle">
          SMI6900 rotates into the strongest memes on Solana.
        </p>
        <p className="runner-hero-line">Hold the index. Build weight. Receive the active basket drop every epoch.</p>
        <div className="runner-hero-actions">
          <a className="runner-button" href={pumpRunnerConfig.buyUrl} target="_blank" rel="noreferrer">
            Buy {tokenLabel} <ArrowRight size={18} />
          </a>
          <a className="runner-button runner-button-secondary" href="#drops">
            View Index Drops
          </a>
        </div>
        <div className="copy-terminal-strip" aria-label="SMI6900 index terminal preview">
          <span>Rotating baskets</span>
          <strong>Weighted holders</strong>
          <small>Onchain receipts</small>
        </div>
      </div>

      <div className="runner-hero-panel" aria-label="SMI6900 live index terminal">
        <div className="live-index-label">
          <span className="runner-live-dot" />
          LIVE INDEX
        </div>
        <div className="runner-panel-top">
          <div className="runner-panel-title">
            <img className="runner-token-logo" src={pumpRunnerConfig.currentRunner.logoSrc} alt="" />
            <div>
              <span>CURRENT DROP</span>
              <strong>{pumpRunnerConfig.currentRunner.ticker}</strong>
              <small>{pumpRunnerConfig.currentRunner.name}</small>
            </div>
          </div>
          <a className="runner-panel-link" href={pumpRunnerConfig.currentRunner.dexScreenerUrl} target="_blank" rel="noreferrer">
            Chart <ExternalLink size={14} />
          </a>
        </div>
        <div className="runner-current-card">
          <div className="runner-current-row">
            <span>Status</span>
            <strong>{pumpRunnerConfig.currentRunner.status}</strong>
          </div>
          <div className="runner-current-row">
            <span>Mint</span>
            <strong>{pumpRunnerConfig.currentRunner.mint ? compactAddress(pumpRunnerConfig.currentRunner.mint) : "Set reward mint"}</strong>
          </div>
          <div className="runner-current-row">
            <span>Index Weight</span>
            <strong>{pumpRunnerConfig.currentRunner.amountAcquired}</strong>
          </div>
        </div>
        <div className="runner-drop-card">
          <span>NEXT AIRDROP</span>
          <strong>{live.countdown}</strong>
          <small>Every {pumpRunnerConfig.epochMinutes} minutes</small>
        </div>
        <div className="copy-terminal-card" aria-label="SMI6900 live index terminal">
          <div><span>index.size</span><strong>{pumpRunnerConfig.runnerBoard.length} assets</strong></div>
          <div><span>active.drop</span><strong>{pumpRunnerConfig.currentRunner.ticker}</strong></div>
          <div><span>basket.route</span><strong>weighted basket</strong></div>
          <div><span>next.drop</span><strong>{live.countdown}</strong></div>
        </div>
        <div className="runner-hero-stats">
          <span>
            <small>Eligible</small>
            <strong>{formatCount(live.stats.latestEligibleHolders, "0")}</strong>
          </span>
          <span>
            <small>SOL Value Airdropped</small>
            <strong>{formatSolAmount(live.stats.totalSolValueAirdropped)}</strong>
          </span>
          <span>
            <small>Epoch</small>
            <strong>{formatCount(live.stats.currentEpoch, "00")}</strong>
          </span>
        </div>
      </div>
    </section>
  );
}

function IndexStrip({ live }: { live: RunnerLiveData }) {
  const items = pumpRunnerConfig.runnerBoard;

  return (
    <section className="index-strip" aria-label="Live SMI6900 index strip">
      <div className="index-strip-track">
        {[...items, ...items].map((item, index) => (
          <a className="index-strip-card" href={item.dexScreenerUrl} key={`${item.rank}-${index}`} target="_blank" rel="noreferrer">
            <img src={item.logoSrc} alt="" loading="lazy" />
            <span>
              <strong>{item.ticker}</strong>
              <small>{index === 0 ? formatPrice(live.market.reward.priceUsd, "Live") : item.status}</small>
            </span>
            <em>{item.amountAcquired}</em>
          </a>
        ))}
      </div>
    </section>
  );
}

export function CopySignalBoard({ live }: { live: RunnerLiveData }) {
  const summary = pumpRunnerConfig.treasuryStatistics;
  const liveActiveMarketCap = live.market.reward.marketCapUsd ?? live.market.reward.fdvUsd;
  const activeCopy = pumpRunnerConfig.runnerBoard[0];
  const summaryItems = [
    ["Index assets", summary.runnersCaughtToday],
    ["Index mode", summary.averageEntryMarketCap],
    ["Current drop MC", formatCompactUsd(liveActiveMarketCap, summary.averageReturn)],
    ["Current drop", summary.bestRunner],
    ["Total distributed today", summary.totalDistributedToday]
  ];

  return (
    <section className="runner-section" id="board">
      <div className="runner-section-heading">
        <span className="runner-kicker">Current Index</span>
        <h2>CURRENT INDEX</h2>
        <p>The live basket shows the current drop asset and tracked Solana meme slots feeding the index.</p>
      </div>
      <div className="runner-summary-grid">
        {summaryItems.map(([label, value]) => (
          <div className="runner-stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="copy-signal-card">
        <img src={activeCopy.logoSrc} alt="" />
        <div>
          <span>Active Basket Asset</span>
          <strong>{activeCopy.token}</strong>
          <small>{activeCopy.ticker} · {activeCopy.detectedMarketCap} · {activeCopy.status}</small>
        </div>
        <a href={activeCopy.dexScreenerUrl} target="_blank" rel="noreferrer">
          Chart <ExternalLink size={15} />
        </a>
      </div>
      <div className="smi-index-grid" aria-label="Current SMI6900 index assets">
        {pumpRunnerConfig.runnerBoard.map((asset) => (
          <article className="smi-index-asset" key={`${asset.rank}-${asset.ticker}`}>
            <img src={asset.logoSrc} alt="" loading="lazy" />
            <div>
              <span>{asset.rank}</span>
              <strong>{asset.ticker}</strong>
              <small>{asset.token}</small>
            </div>
            <div>
              <span>Weight</span>
              <strong>{asset.amountAcquired}</strong>
              <small>{asset.status}</small>
            </div>
            <a href={asset.dexScreenerUrl} target="_blank" rel="noreferrer" aria-label={`Open ${asset.ticker} chart`}>
              <ExternalLink size={16} />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ScannerStatus({ live }: { live: RunnerLiveData }) {
  const selectedCopies = pumpRunnerConfig.runnerBoard.filter((runner) => /^scanned/i.test(runner.status)).length;
  const rows = [
    ["INDEX ENGINE", "ONLINE"],
    ["CURRENT DROP", rewardSymbol],
    ["INDEX ASSETS", pumpRunnerConfig.runnerBoard.length.toString()],
    ["ELIGIBLE HOLDERS", formatCount(live.stats.latestEligibleHolders, "0")],
    ["BASKET SLOTS", Math.max(selectedCopies, pumpRunnerConfig.runnerBoard.length).toString()],
    ["LIVE DROP EPOCHS", formatCount(live.stats.totalEpochs || live.stats.currentEpoch, "0")],
    [`${rewardSymbol} AIRDROPPED`, formatTokenAmount(live.stats.totalRewardAirdropped, rewardSymbol, `0 ${rewardSymbol}`)]
  ];

  return (
    <section className="runner-section" id="scanner">
      <div className="runner-section-heading">
        <span className="runner-kicker">Index Engine</span>
        <h2>THE INDEX ENGINE</h2>
        <p>
          A rotating basket built around Solana meme momentum.
        </p>
      </div>
      <div className="runner-scanner-layout">
        <div className="runner-card-grid">
          {pumpRunnerConfig.scannerCards.map((card) => (
            <article className="runner-info-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
        <div className="runner-terminal">
          {rows.map(([label, value]) => (
            <div className="runner-terminal-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
          <p>The exact methodology remains private so the index can rotate before the trade becomes obvious.</p>
        </div>
      </div>
    </section>
  );
}

function CopyCatOrigin() {
  return (
    <section className="runner-section runner-origin" id="origin">
      <div className="runner-section-heading">
        <span className="runner-kicker">Index Thesis</span>
        <h2>THE INDEX NEVER SLEEPS.</h2>
        <p>
          It scans. It rotates. It snapshots. It drops.
        </p>
      </div>
      <div className="runner-origin-grid">
        <article className="runner-info-card">
          <h3>01 · Add</h3>
          <p>New coins, old coins, AI coins and 6900 coins can enter the basket.</p>
        </article>
        <article className="runner-info-card">
          <h3>02 · Weight</h3>
          <p>Holder balances and streaks determine distribution weight.</p>
        </article>
        <article className="runner-info-card">
          <h3>03 · Drop</h3>
          <p>Eligible holders receive basket drops with onchain receipts.</p>
        </article>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      label: "01",
      title: "Assets enter the index",
      body: "The index can add new launches, older leaders, AI rotations and 6900-coded meme assets."
    },
    {
      label: "02",
      title: "The active basket gets bought",
      body: "Fees can route into the current drop asset or a weighted mix of index coins."
    },
    {
      label: "03",
      title: "Holders receive the drop",
      body: `The current index reward is distributed to eligible ${tokenLabel} holders during scheduled epochs.`
    }
  ];

  return (
    <section className="runner-section runner-how" id="how">
      <div className="runner-section-heading">
        <span className="runner-kicker">How It Works</span>
      <h2>HOLD THE INDEX. WEIGH HEAVIER.</h2>
      </div>
      <div className="runner-step-list">
        {steps.map((step) => (
          <article className="runner-step" key={step.label}>
            <span>{step.label}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
      <strong className="runner-bold-line">Hold {tokenLabel}. Stay eligible for the active basket.</strong>
    </section>
  );
}

export function EligibilityCard({ live }: { live: RunnerLiveData }) {
  const [lookup, setLookup] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [walletResult, setWalletResult] = useState<WalletLookupResponse | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");
  const match = useMemo(() => {
    if (!submitted) return null;
    return live.holders.topHolders.find((holder) => holder.address.toLowerCase() === submitted.toLowerCase()) ?? null;
  }, [live.holders.topHolders, submitted]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = lookup.trim();
    setSubmitted(address);
    setWalletResult(null);
    setWalletError("");
    if (!address) return;

    setWalletLoading(true);
    try {
      const response = await fetch(`/api/wallet?address=${encodeURIComponent(address)}`, { cache: "no-store" });
      const data = (await response.json()) as WalletLookupResponse;
      if (!response.ok) throw new Error(data.error ?? "Wallet lookup failed");
      setWalletResult(data);
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Wallet lookup failed");
    } finally {
      setWalletLoading(false);
    }
  };

  const required = `${pumpRunnerConfig.minimumHolding.toLocaleString()} ${tokenLabel}`;
  const connectedLabel = walletLoading
    ? "CHECKING WALLET"
    : walletResult
      ? walletResult.eligible
        ? "ELIGIBLE"
        : walletResult.status.replace(/_/g, " ").toUpperCase()
      : submitted
        ? match
          ? "ELIGIBLE IN LIVE HOLDER DATA"
          : "NOT FOUND IN LIVE HOLDER DATA"
        : "WALLET NOT CONNECTED";
  const balanceLabel = walletResult
    ? `${walletResult.sourceBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${tokenLabel}`
    : match
      ? `${match.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${tokenLabel}`
      : "-";
  const currentReceiptValue = walletResult ? formatUsdValue(walletResult.totalRewardReceived, live.market.reward.priceUsd) : "$0";

  return (
    <section className="runner-section runner-eligibility" id="eligibility">
      <div className="runner-section-heading">
        <span className="runner-kicker">Holder Rules</span>
        <h2>ELIGIBILITY</h2>
      </div>
      <div className="runner-eligibility-grid">
        <div className="runner-check-card">
          <h3>To qualify for index airdrops, a wallet must:</h3>
          <ul>
            <li>Hold at least {required}</li>
            <li>Be holding at the eligibility snapshot</li>
            <li>Continue holding through the active epoch</li>
            <li>Meet basic wallet and anti-abuse requirements</li>
          </ul>
        </div>
        <div className="runner-wallet-card">
          <div className="runner-wallet-row">
            <span>Your balance</span>
            <strong>{balanceLabel}</strong>
          </div>
          <div className="runner-wallet-row">
            <span>Required balance</span>
            <strong>{required}</strong>
          </div>
          <div className="runner-wallet-row">
            <span>Eligibility</span>
            <strong>{connectedLabel}</strong>
          </div>
          <form className="runner-lookup" onSubmit={handleSubmit}>
            <label htmlFor="wallet-lookup">Public wallet lookup</label>
            <div>
              <input
                id="wallet-lookup"
                onChange={(event) => setLookup(event.target.value)}
                placeholder="Paste Solana wallet"
                type="text"
                value={lookup}
              />
              <button type="submit">Check</button>
            </div>
          </form>
          {walletError ? <p className="runner-wallet-error">{walletError}</p> : null}
          {walletResult ? (
            <div className="runner-wallet-results">
              <div className="runner-wallet-result-grid">
                <span>
                  <small>{rewardSymbol} received</small>
                  <strong>{formatTokenAmount(walletResult.totalRewardReceived, rewardSymbol, `0 ${rewardSymbol}`)}</strong>
                </span>
                <span>
                  <small>Drop value</small>
                  <strong>{formatSolAmount(walletResult.totalDropSolValue)}</strong>
                </span>
                <span>
                  <small>Current value</small>
                  <strong>{currentReceiptValue}</strong>
                </span>
                <span>
                  <small>Held streak</small>
                  <strong>{formatCount(walletResult.currentStreak ?? 0, "0")} epochs</strong>
                </span>
              </div>
              <div className="runner-wallet-receipts">
                {walletResult.receipts.length ? (
                  walletResult.receipts.slice(0, 6).map((receipt) => {
                    const txUrl = transactionUrl(receipt.txSig);
                    return (
                      <div className="runner-wallet-receipt" key={`${receipt.epochId}-${receipt.txSig ?? receipt.time}`}>
                        <span>{formatTime(receipt.time)}</span>
                        <strong>{formatTokenAmount(receipt.rewardAmount, rewardSymbol)}</strong>
                        <span>{formatSolAmount(receipt.dropSolValue)}</span>
                        {txUrl ? (
                          <a href={txUrl} target="_blank" rel="noreferrer">
                            Receipt
                          </a>
                        ) : (
                          <span>No tx</span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p>No settled airdrops for this wallet yet.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function HoldMultiplier() {
  return (
    <section className="runner-section runner-multiplier">
      <div className="runner-section-heading">
        <span className="runner-kicker">Epoch Multiplier</span>
        <h2>HOLD MORE EPOCHS</h2>
        <p>Consistent holders receive a higher index-weight multiplier the longer they stay eligible.</p>
      </div>
      <div className="runner-meter-card">
        <div className="runner-distance-meter" aria-label="Seven day multiplier meter">
          <span>START</span>
          <div>
            <i style={{ width: "100%" }} />
          </div>
          <span>7 DAY INDEX WEIGHT</span>
        </div>
        <div className="runner-tier-grid">
          {pumpRunnerConfig.multiplierTiers.map((tier) => (
            <div className="runner-tier" key={tier.label}>
              <span>{tier.label}</span>
              <strong>{tier.multiplier}</strong>
            </div>
          ))}
        </div>
        <p>Selling or transferring {tokenLabel} resets the wallet's epoch multiplier. The multiplier affects distribution weight, not a fixed reward.</p>
      </div>
    </section>
  );
}

export function HolderPayoutBoard({ live }: { live: RunnerLiveData }) {
  const rows = live.holders.topHolders.filter((holder) => holder.totalRewardEarned > 0 || (holder.currentStreak ?? 0) > 0);

  return (
    <section className="runner-section" id="payouts">
      <div className="runner-section-heading">
        <span className="runner-kicker">Wallet Payouts</span>
        <h2>EPOCH WEIGHT BOARD</h2>
        <p>Wallet rewards ranked by index tokens received, held-epoch streak and current multiplier.</p>
      </div>
      <div className="runner-table-wrap">
        <table className="runner-table runner-holder-payouts">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Wallet</th>
              <th>Tokens received</th>
              <th>Reward epochs</th>
              <th>Held streak</th>
              <th>Multiplier</th>
              <th>Last drop</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((holder, index) => (
                <tr key={holder.address}>
                  <td>#{index + 1}</td>
                  <td>{compactAddress(holder.address)}</td>
                  <td className="runner-positive">{formatTokenAmount(holder.totalRewardEarned, rewardSymbol, `0 ${rewardSymbol}`)}</td>
                  <td>{formatCount(holder.rewardEpochs ?? 0, "0")}</td>
                  <td>{formatCount(holder.currentStreak ?? 0, "0")}</td>
                  <td>{holder.currentMultiplier ?? "1.00x"}</td>
                  <td>{holder.lastAirdropAt ? formatTime(holder.lastAirdropAt) : "Awaiting"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7}>Payout board fills in after the first settled index drop.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AirdropFeed({ live }: { live: RunnerLiveData }) {
  const [filter, setFilter] = useState("All Drops");
  const activeRunner = pumpRunnerConfig.runnerBoard[0];
  const activeRunnerCurrentMarketCap = formatCompactUsd(live.market.reward.marketCapUsd ?? live.market.reward.fdvUsd, activeRunner.currentMarketCap);
  const activeRunnerScanTime = activeRunner.status.replace(/^Scanned\s+/i, "");
  const totalRunnerDropped = live.stats.totalRewardAirdropped
    ? formatTokenAmount(live.stats.totalRewardAirdropped, rewardSymbol, `0 ${rewardSymbol}`)
    : `0 ${rewardSymbol}`;
  const totalSolValueDropped = formatSolAmount(live.stats.totalSolValueAirdropped);
  const currentValueDropped = formatSolValue(live.stats.totalRewardAirdropped, live.market.reward.priceUsd, live.market.sol.priceUsd);
  const completedRows = live.stats.recentRewards.map((reward) => ({
    time: formatTime(reward.time),
    token: rewardSymbol,
    distributed: formatTokenAmount(reward.rewardAmount, rewardSymbol),
    wallets: "1 wallet",
    signature: reward.txSig,
    status: statusText(reward.status)
  }));
  const upcomingRows = [
    {
      time: live.countdown,
      token: "Next index batch",
      distributed: "Queued",
      wallets: `${formatCount(live.stats.latestEligibleHolders, "0")} eligible wallets`,
      signature: null,
      status: "Upcoming"
    }
  ];
  const rows = filter === "Completed" ? completedRows : filter === "Upcoming" ? upcomingRows : [...completedRows, ...upcomingRows];

  return (
    <section className="runner-section" id="drops">
      <div className="runner-section-heading">
        <span className="runner-kicker">Onchain Feed</span>
        <h2>INDEX DROP LEDGER</h2>
        <p>Each index drop stays on the record: basket asset, live market cap, amount dropped and current SOL value of the distribution.</p>
      </div>
      <div className="runner-drop-ledger">
        <article className="runner-drop-feature">
          <div>
            <span>Index Drop 01</span>
            <strong>{activeRunner.token}</strong>
            <small>{activeRunner.ticker} · {activeRunner.detectedMarketCap} · {activeRunnerScanTime}</small>
          </div>
          <a href={activeRunner.dexScreenerUrl} target="_blank" rel="noreferrer">
            Open chart <ExternalLink size={15} />
          </a>
        </article>
        <div className="runner-drop-metrics">
          <div>
            <span>Index Entry</span>
            <strong>{activeRunner.detectedMarketCap}</strong>
          </div>
          <div>
            <span>Current MC</span>
            <strong>{activeRunnerCurrentMarketCap}</strong>
          </div>
          <div>
            <span>Total tokens dropped</span>
            <strong>{totalRunnerDropped}</strong>
          </div>
          <div>
            <span>Total SOL value</span>
            <strong>{totalSolValueDropped}</strong>
          </div>
          <div>
            <span>Current drop value</span>
            <strong>{currentValueDropped}</strong>
          </div>
        </div>
      </div>
      <div className="runner-tabs" role="tablist" aria-label="Airdrop feed filter">
        {["All Drops", "Completed", "Upcoming"].map((item) => (
          <button
            aria-selected={filter === item}
            className={filter === item ? "is-active" : ""}
            key={item}
            onClick={() => setFilter(item)}
            role="tab"
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <div className="runner-feed">
        {rows.length ? (
          rows.map((row, index) => {
            const txUrl = transactionUrl(row.signature);
            return (
              <article className="runner-feed-row" key={`${row.time}-${row.token}-${index}`}>
                <span>{row.time}</span>
                <strong>{row.token}</strong>
                <span>{row.distributed}</span>
                <span>{row.wallets}</span>
                <span>{row.status}</span>
                {txUrl ? (
                  <a href={txUrl} target="_blank" rel="noreferrer">
                    View Transaction
                  </a>
                ) : (
                  <span>Awaiting txn</span>
                )}
              </article>
            );
          })
        ) : (
          <article className="runner-feed-row">
            <span>Queued</span>
            <strong>First drop</strong>
            <span>Awaiting distribution</span>
            <span>{formatCount(live.stats.latestEligibleHolders, "0")} eligible wallets</span>
            <span>Upcoming</span>
            <span>Awaiting txn</span>
          </article>
        )}
      </div>
    </section>
  );
}

export function CopyHistoryChart() {
  const maxMarketCap = Math.max(...pumpRunnerConfig.performanceRows.map((row) => row.currentMarketCap));

  return (
    <section className="runner-section" id="history">
      <div className="runner-section-heading">
        <span className="runner-kicker">Index History</span>
        <h2>BASKET HISTORY</h2>
      </div>
      <div className="runner-chart">
        {pumpRunnerConfig.performanceRows.map((row) => (
          <div className="runner-chart-row" key={row.ticker}>
            <span>{row.ticker}</span>
            <div className="runner-chart-bars">
              <i className="entry" style={{ width: `${Math.max(8, (row.entryMarketCap / maxMarketCap) * 100)}%` }} />
              <i className="current" style={{ width: `${Math.max(8, (row.currentMarketCap / maxMarketCap) * 100)}%` }} />
            </div>
            <strong>+{row.changePercent}%</strong>
          </div>
        ))}
      </div>
      <p className="runner-disclaimer">Past index selections do not guarantee future performance. Tokens selected by the system may lose some or all of their value.</p>
    </section>
  );
}

function FaqSection() {
  const faqs = [
    {
      question: "What is SMI6900?",
      answer:
        `SMI6900 is a holder-reward meme index that can buy selected index assets and distribute them to eligible ${tokenLabel} holders.`
    },
    {
      question: "How many tokens must I hold?",
      answer: `A wallet must hold at least ${pumpRunnerConfig.minimumHolding.toLocaleString()} ${tokenLabel} at the eligibility snapshot.`
    },
    {
      question: "How often are drops distributed?",
      answer: `Index-token distributions are processed in scheduled epochs. The current interface is set to ${pumpRunnerConfig.epochMinutes}-minute epochs.`
    },
    {
      question: "What happens when I sell?",
      answer:
        `Selling or transferring ${tokenLabel} resets the wallet's hold multiplier. Depending on snapshot rules, it may also remove the wallet from the current distribution epoch.`
    },
    {
      question: "Are index profits guaranteed?",
      answer:
        "No. Meme tokens are highly volatile, and index selections may decline in value. The index engine is a selection system, not a guarantee of performance."
    },
    {
      question: "Why is there a minimum holding requirement?",
      answer:
        "The minimum reduces extremely small distributions and helps prevent network rent and transaction costs from making airdrops inefficient."
    }
  ];

  return (
    <section className="runner-section" id="faq">
      <div className="runner-section-heading">
        <span className="runner-kicker">FAQ</span>
        <h2>FAST ANSWERS</h2>
      </div>
      <div className="runner-faq-grid">
        {faqs.map((faq) => (
          <article className="runner-info-card" key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="runner-final-cta">
      <h2>THE NEXT INDEX DROP IS ALREADY LOADING.</h2>
      <p>Hold {tokenLabel} and stay eligible for every scheduled basket drop routed through the system.</p>
      <div className="runner-hero-actions">
        <a className="runner-button" href={pumpRunnerConfig.buyUrl} target="_blank" rel="noreferrer">
          Buy {tokenLabel}
        </a>
        <a className="runner-button runner-button-secondary" href="#drops">
          View Drops
        </a>
        <a className="runner-button runner-button-secondary" href={pumpRunnerConfig.dexScreenerUrl} target="_blank" rel="noreferrer">
          Open DexScreener
        </a>
      </div>
    </section>
  );
}

function RunnerFooter() {
  const ca = pumpRunnerConfig.contractAddress;

  return (
    <footer className="runner-footer">
      <div>
        <strong>{pumpRunnerConfig.name}</strong>
        <span>{tokenLabel}</span>
      </div>
      <div className="runner-footer-links">
        {ca ? <CopyCaButton address={ca} label={compactAddress(ca)} /> : null}
        {pumpRunnerConfig.xUrl ? (
          <a href={pumpRunnerConfig.xUrl} target="_blank" rel="noreferrer">
            X
          </a>
        ) : null}
        {pumpRunnerConfig.telegramUrl ? (
          <a href={pumpRunnerConfig.telegramUrl} target="_blank" rel="noreferrer">
            Telegram
          </a>
        ) : null}
        <a href={pumpRunnerConfig.dexScreenerUrl} target="_blank" rel="noreferrer">
          DexScreener
        </a>
        <a href={pumpRunnerConfig.pumpFunUrl} target="_blank" rel="noreferrer">
          Pump.fun
        </a>
        <a href="#drops">Receipts</a>
        <a href="#faq">Terms</a>
        <a href="#faq">Risk disclosure</a>
      </div>
      <p className="runner-risk">
        SMI6900 is an experimental Solana meme index project. Digital assets are volatile. Verify all onchain activity independently.
      </p>
    </footer>
  );
}

export function PumpRunnerHome() {
  const live = useRunnerLiveData();

  return (
    <div className="pump-runner-page">
      <AnimatedBackground />
      <MarketTicker live={live} />
      <RunnerNav />
      <main>
        <HeroSection live={live} />
        <IndexStrip live={live} />
        <CopySignalBoard live={live} />
        <ScannerStatus live={live} />
        <CopyCatOrigin />
        <HowItWorks />
        <EligibilityCard live={live} />
        <HoldMultiplier />
        <HolderPayoutBoard live={live} />
        <AirdropFeed live={live} />
        <CopyHistoryChart />
        <FaqSection />
        <FinalCta />
      </main>
      <RunnerFooter />
    </div>
  );
}
