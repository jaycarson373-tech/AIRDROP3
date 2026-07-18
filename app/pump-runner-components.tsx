"use client";

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
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
  basket?: Record<string, MarketToken>;
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

type ActiveFundAsset = {
  rank: string;
  token: string;
  ticker: string;
  mint: string;
  logoSrc: string;
  detectedMarketCap: string;
  currentMarketCap: string;
  returnSinceDetection: string;
  amountAcquired: string;
  status: string;
  dexScreenerUrl: string;
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
  basket: {},
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

function formatChange(value: number | null | undefined, fallback = "+0.0%") {
  if (!Number.isFinite(value ?? NaN) || value === null || value === undefined) return fallback;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
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

function displayCountdown(live: RunnerLiveData) {
  return live.countdown === "00:00" ? "Processing distribution..." : live.countdown;
}

function displaySettledSol(value: number | null | undefined) {
  if (!Number.isFinite(value ?? NaN) || !value) return "Awaiting first settled distribution";
  return formatSolAmount(value);
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

function activeFundAsset(live: RunnerLiveData): ActiveFundAsset {
  const basket: readonly ActiveFundAsset[] = pumpRunnerConfig.runnerBoard;
  const activeIndex = basket.findIndex((asset) => asset.mint === pumpRunnerConfig.rewardMint);
  if (activeIndex >= 0) return basket[activeIndex];
  return {
    rank: "01",
    token: pumpRunnerConfig.currentRunner.name,
    ticker: pumpRunnerConfig.currentRunner.ticker,
    mint: pumpRunnerConfig.currentRunner.mint,
    logoSrc: pumpRunnerConfig.currentRunner.logoSrc,
    detectedMarketCap: pumpRunnerConfig.currentRunner.detectedMarketCap,
    currentMarketCap: pumpRunnerConfig.currentRunner.currentMarketCap,
    returnSinceDetection: "Live",
    amountAcquired: pumpRunnerConfig.currentRunner.amountAcquired,
    status: pumpRunnerConfig.currentRunner.status,
    dexScreenerUrl: pumpRunnerConfig.currentRunner.dexScreenerUrl
  };
}

function assetPrice(asset: ActiveFundAsset, live: RunnerLiveData) {
  const basketPrice = live.market.basket?.[asset.mint]?.priceUsd;
  if (basketPrice !== undefined) return formatPrice(basketPrice, "Live");
  return asset.mint === pumpRunnerConfig.rewardMint ? formatPrice(live.market.reward.priceUsd, "Live") : "Live";
}

export function MarketTicker({ live }: { live: RunnerLiveData }) {
  const source = live.market.source;
  const activeAsset = activeFundAsset(live);
  const holderCount = live.holders.uniqueHolders ?? live.stats.latestEligibleHolders;
  const items = [
    `CURRENT SELECTION ${activeAsset.ticker}`,
    `${activeAsset.ticker} PRICE ${assetPrice(activeAsset, live)}`,
    `AI RUNNER DROPS`,
    `DISTRIBUTED VALUE ${formatSolAmount(live.stats.totalSolValueAirdropped)}`,
    `TOTAL EPOCHS ${formatCount(live.stats.totalEpochs || live.stats.currentEpoch, "0")}`,
    `TOTAL HOLDERS ${formatCount(holderCount, pumpRunnerConfig.marketTickerFallback.holderCount)}`,
    `${tokenLabel} PRICE ${formatPrice(source.priceUsd)}`,
    `NEXT DISTRIBUTION ${displayCountdown(live)}`,
    `AI SCANNER ${pumpRunnerConfig.scannerStatus}`,
    `RUNNER VAULT ${pumpRunnerConfig.treasuryStatus}`
  ];

  return (
    <div className="runner-ticker" aria-label="Live Runner market ticker">
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
    <div className="ptf-background" aria-hidden="true">
      <span className="ptf-orbit ptf-orbit-one" />
      <span className="ptf-orbit ptf-orbit-two" />
      {Array.from({ length: 12 }).map((_, index) => (
        <span className="ptf-floating-pill" key={index} />
      ))}
      <span className="ptf-watermark" />
    </div>
  );
}

function RunnerNav() {
  const ca = pumpRunnerConfig.contractAddress;
  return (
    <header className="runner-nav">
      <a className="runner-brand" href="#top" aria-label="Runner home">
        <img className="runner-brand-logo" src={pumpRunnerConfig.logoSrc} alt="" />
        <span>
          <strong>{pumpRunnerConfig.name}</strong>
          <small>Never miss a runner</small>
        </span>
      </a>
      <nav className="runner-links" aria-label="Primary navigation">
        <a href="#board">Runners</a>
        <a href="#scanner">AI Scanner</a>
        <a href="#eligibility">Holders</a>
        <a href="#drops">Receipts</a>
      </nav>
      <div className="runner-actions">
        {ca ? <CopyCaButton address={ca} label={compactAddress(ca)} /> : <span className="mini-button mono ca-placeholder">CA SOON</span>}
        {pumpRunnerConfig.xUrl ? (
          <a className="runner-small-button" href={pumpRunnerConfig.xUrl} target="_blank" rel="noreferrer">
            X
          </a>
        ) : null}
        <a className="runner-small-button runner-buy-button" href={pumpRunnerConfig.buyUrl} target="_blank" rel="noreferrer">
          Buy RUNNER
        </a>
      </div>
    </header>
  );
}

function HeaderBanner() {
  const links = [
    { label: "DexScreener", href: pumpRunnerConfig.dexScreenerUrl },
    { label: "Pump.fun", href: pumpRunnerConfig.pumpFunUrl },
    { label: "Buy $RUNNER", href: pumpRunnerConfig.buyUrl },
    { label: "X", href: pumpRunnerConfig.xUrl }
  ].filter((link) => link.href);

  return (
    <section className="ptf-footer-links" aria-label="Runner links">
      <div className="ptf-footer-links-inner">
        {links.map((link) => (
          <a href={link.href} key={link.label} target="_blank" rel="noreferrer">
            {link.label}
          </a>
        ))}
      </div>
    </section>
  );
}

function HeroMotion() {
  return (
    <>
      <div className="ptf-chart-field" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, index) => (
          <span className={`ptf-chart-line ptf-chart-${index + 1}`} key={index} />
        ))}
      </div>
      <div className="ptf-floating-logos" aria-hidden="true">
        <span className="ptf-hero-pill" />
      </div>
    </>
  );
}

function HeroStats({ live }: { live: RunnerLiveData }) {
  const activeAsset = activeFundAsset(live);
  const stats = [
    ["Current Runner", activeAsset.ticker],
    ["Runner Value", displaySettledSol(live.stats.totalSolValueAirdropped)],
    ["Next Distribution", displayCountdown(live)],
    ["Eligible Holders", formatCount(live.stats.latestEligibleHolders, "0")]
  ];

  return (
    <div className="ptf-hero-stat-grid" aria-label="Runner hero stats">
      {stats.map(([label, value]) => (
        <span key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
        </span>
      ))}
    </div>
  );
}

function HeroSection({ live }: { live: RunnerLiveData }) {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const heroStyle = {
    "--hero-x": `${pointer.x}px`,
    "--hero-y": `${pointer.y}px`
  } as CSSProperties;

  return (
    <section
      className="runner-hero"
      id="top"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - rect.left) / rect.width - 0.5) * 28,
          y: ((event.clientY - rect.top) / rect.height - 0.5) * 22
        });
      }}
      onPointerLeave={() => setPointer({ x: 0, y: 0 })}
      style={heroStyle}
    >
      <div className="ptf-hero-bg" aria-hidden="true" />
      <HeroMotion />
      <div className="runner-hero-overlay" aria-hidden="true" />
      <div className="runner-hero-copy">
        <div className="ptf-hero-logo-shell">
          <img className="ptf-hero-logo" src={pumpRunnerConfig.logoSrc} alt="Runner logo" />
        </div>
        <h1>RUNNER</h1>
        <p className="runner-hero-subtitle">AI animal-token scanner</p>
        <p className="runner-hero-thesis">Never miss a runner.</p>
        <p className="runner-hero-line">
          Runner scans Pump.fun for animal tokens with real momentum.
          <br />Hold 1,000,000+ {tokenLabel}.
          <br />Receive weighted runner drops every 5 minutes.
        </p>
        <div className="runner-hero-actions">
          <a className="runner-button" href={pumpRunnerConfig.buyUrl} target="_blank" rel="noreferrer">
            Buy {tokenLabel} <ArrowRight size={18} />
          </a>
          <a className="runner-button runner-button-secondary" href="#board">
            View Live Runners
          </a>
        </div>
        <HeroStats live={live} />
      </div>
    </section>
  );
}

function FundStrip({ live }: { live: RunnerLiveData }) {
  const items = pumpRunnerConfig.runnerBoard;

  return (
    <section className="fund-strip" aria-label="Live Runner strip">
      <div className="fund-strip-track">
        {[...items, ...items].map((item, fund) => (
          <a className="fund-strip-card" href={item.dexScreenerUrl} key={`${item.rank}-${fund}`} target="_blank" rel="noreferrer">
            <img src={item.logoSrc} alt="" loading="lazy" />
            <span>
              <strong>{item.ticker}</strong>
              <small>{fund === 0 ? assetPrice(item, live) : item.status}</small>
            </span>
            <em>{item.amountAcquired}</em>
          </a>
        ))}
      </div>
    </section>
  );
}

export function CopySignalBoard({ live }: { live: RunnerLiveData }) {
  const activeCopy = activeFundAsset(live);
  const selectedPrice = assetPrice(activeCopy, live);
  const treasuryValue = displaySettledSol(live.stats.totalSolValueAirdropped);
  const feedRows = live.stats.recentRewards.slice(0, 4).map((reward) => ({
    label: "Distribution completed",
    value: formatTokenAmount(reward.rewardAmount, rewardSymbol, `0 ${rewardSymbol}`),
    meta: reward.txSig ? compactAddress(reward.txSig) : statusText(reward.status)
  }));
  const activityRows = feedRows.length
    ? feedRows
    : [
        { label: "AI scanning animal runners", value: "Live", meta: "signal engine" },
        { label: `Runner buying ${activeFundAsset(live).ticker}`, value: "Queued", meta: "next epoch" },
        { label: "Distribution route armed", value: `${formatCount(live.stats.latestEligibleHolders, "0")} holders`, meta: "eligible" }
      ];
  const metrics = [
    ["Runner Value", treasuryValue],
    ["Next Distribution", displayCountdown(live)],
    ["Eligible Holders", formatCount(live.stats.latestEligibleHolders, "0")],
    ["Epoch", formatCount(live.stats.currentEpoch || live.stats.totalEpochs, "0")]
  ];

  return (
    <section className="runner-section" id="board">
      <div className="runner-section-heading">
        <span className="runner-kicker">Live Runners</span>
        <h2>CURRENT RUNNER</h2>
        <p>A clean terminal for the active runner, next drop and holder-weight flow.</p>
      </div>
      <div className="ptf-treasury-card">
        <div className="ptf-treasury-main">
          <div className="ptf-treasury-head">
            <div>
              <span className="runner-kicker">Current Runner</span>
              <h3>{activeCopy.ticker}</h3>
              <p>{activeCopy.token} · {selectedPrice} · AI selected</p>
            </div>
            <a href={activeCopy.dexScreenerUrl} target="_blank" rel="noreferrer">
              Active chart <ExternalLink size={15} />
            </a>
          </div>
          <div className="ptf-selection-focus">
            {activeCopy.logoSrc ? <img src={activeCopy.logoSrc} alt="" loading="lazy" /> : null}
            <div>
              <span>AI selected runner</span>
              <strong>{activeCopy.token}</strong>
              <small>{compactAddress(activeCopy.mint)} · {activeCopy.status}</small>
            </div>
            <a href={activeCopy.dexScreenerUrl} target="_blank" rel="noreferrer">
              Chart <ExternalLink size={15} />
            </a>
          </div>
          <div className="ptf-dashboard-metrics">
            {metrics.map(([label, value]) => (
              <span key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </span>
            ))}
          </div>
        </div>
        <aside className="ptf-treasury-side">
          <div className="ptf-countdown-card">
            <span>Next Runner Drop</span>
            <strong>{displayCountdown(live)}</strong>
            <p>When this reaches zero, the system processes the next eligible runner drop.</p>
          </div>
          <div className="ptf-activity-feed">
            <span>Live Scanner Activity</span>
            {activityRows.map((row) => (
              <div className="ptf-activity-row" key={`${row.label}-${row.value}`}>
                <strong>{row.label}</strong>
                <small>{row.value}</small>
                <em>{row.meta}</em>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

export function ScannerStatus({ live }: { live: RunnerLiveData }) {
  const selectedCopies = pumpRunnerConfig.runnerBoard.filter((runner) => /^scanned/i.test(runner.status)).length;
  const rows = [
    ["AI SCANNER", "ONLINE"],
    ["CURRENT DROP", rewardSymbol],
    ["RUNNERS TRACKED", pumpRunnerConfig.runnerBoard.length.toString()],
    ["ELIGIBLE HOLDERS", formatCount(live.stats.latestEligibleHolders, "0")],
    ["ANIMAL WATCHLIST", Math.max(selectedCopies, pumpRunnerConfig.runnerBoard.length).toString()],
    ["LIVE DROP EPOCHS", formatCount(live.stats.totalEpochs || live.stats.currentEpoch, "0")],
    [`${rewardSymbol} AIRDROPPED`, formatTokenAmount(live.stats.totalRewardAirdropped, rewardSymbol, `0 ${rewardSymbol}`)]
  ];

  return (
    <section className="runner-section" id="scanner">
      <div className="runner-section-heading">
        <span className="runner-kicker">AI Scanner</span>
        <h2>RUNNER ENGINE</h2>
        <p>
          An AI scanning system built to catch animal-token momentum before it is obvious.
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
          <p>The exact methodology remains private so Runner can catch movement before the trade becomes obvious.</p>
        </div>
      </div>
    </section>
  );
}

function CopyCatOrigin() {
  return (
    <section className="runner-section runner-origin" id="origin">
      <div className="runner-section-heading">
        <span className="runner-kicker">Runner Thesis</span>
        <h2>THE AI NEVER SLEEPS.</h2>
        <p>It scans. It spots. It snapshots. It drops.</p>
      </div>
      <div className="runner-origin-grid">
        <article className="runner-info-card">
          <h3>01 · Add</h3>
          <p>New animal-token launches and active rotations can enter the watchlist.</p>
        </article>
        <article className="runner-info-card">
          <h3>02 · Weight</h3>
          <p>Holder balances and streaks determine distribution weight.</p>
        </article>
        <article className="runner-info-card">
          <h3>03 · Drop</h3>
          <p>Eligible holders receive runner drops with onchain receipts.</p>
        </article>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      label: "01",
      title: "The AI scans Pump.fun",
      body: "Runner watches animal-token activity, liquidity, attention and rotation strength."
    },
    {
      label: "02",
      title: "Strong animal tokens enter rotation",
      body: "The strongest active runner becomes the current selection."
    },
    {
      label: "03",
      title: `Hold 1M+ ${tokenLabel}`,
      body: "Eligible wallets stay in the holder snapshot while Runner rotates."
    },
    {
      label: "04",
      title: "Receive runner drops",
      body: `Eligible holders receive weighted runner distributions every ${pumpRunnerConfig.epochMinutes} minutes.`
    },
    {
      label: "05",
      title: "Hold longer to build weight",
      body: "Longer holding duration increases holder weight for future basket drops."
    }
  ];

  return (
    <section className="runner-section runner-how" id="how">
      <div className="runner-section-heading">
        <span className="runner-kicker">How It Works</span>
      <h2>NEVER MISS A RUNNER.</h2>
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
      <strong className="runner-bold-line">Hold {tokenLabel}. Stay eligible for every runner the AI catches.</strong>
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
        <h2>ELIGIBILITY AND WEIGHT</h2>
        <p>A wallet must hold at least {pumpRunnerConfig.minimumHolding.toLocaleString()} {tokenLabel} at the eligibility snapshot to qualify for the next distribution.</p>
      </div>
      <div className="runner-eligibility-grid">
        <div className="runner-check-card">
          <h3>To qualify for runner drops, a wallet must:</h3>
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
                placeholder="Paste wallet address"
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
                  <p>No settled distributions for this wallet yet.</p>
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
        <p>Consistent holders receive a higher holder-weight multiplier the longer they stay eligible.</p>
      </div>
      <div className="runner-meter-card">
        <div className="runner-distance-meter" aria-label="Seven day multiplier meter">
          <span>START</span>
          <div>
            <i style={{ width: "100%" }} />
          </div>
          <span>7 DAY HOLDER WEIGHT</span>
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
        <p>Wallet rewards ranked by runner tokens received, held-epoch streak and current multiplier.</p>
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
              rows.map((holder, fund) => (
                <tr key={holder.address}>
                  <td>#{fund + 1}</td>
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
                <td colSpan={7}>Payout board fills in after the first settled runner drop.</td>
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
      token: "Next runner drop",
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
        <h2>RUNNER DROP LEDGER</h2>
        <p>Onchain receipts for completed and queued runner drops.</p>
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
          rows.map((row, fund) => {
            const txUrl = transactionUrl(row.signature);
            return (
              <article className="runner-feed-row" key={`${row.time}-${row.token}-${fund}`}>
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
        <span className="runner-kicker">Rotation History</span>
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
      <p className="runner-disclaimer">Past AI selections do not guarantee future performance. Tokens selected by the system may lose some or all of their value.</p>
    </section>
  );
}

function FaqSection() {
  const faqs = [
    {
      question: "What is Runner?",
      answer:
        "Runner is an AI scanning system for animal-token runners. It accumulates selected Pump.fun tokens and distributes them to eligible $RUNNER holders every five minutes."
    },
    {
      question: "How many tokens must I hold?",
      answer: `A wallet must hold at least ${pumpRunnerConfig.minimumHolding.toLocaleString()} ${tokenLabel} at the eligibility snapshot to qualify for the next distribution.`
    },
    {
      question: "How often are drops distributed?",
      answer: `Runner drops run on scheduled ${pumpRunnerConfig.epochMinutes}-minute epochs when the vault has eligible assets after reserves.`
    },
    {
      question: "What happens when I sell?",
      answer:
        `Selling or transferring ${tokenLabel} resets holder weight and may remove the wallet from the active snapshot. Hold longer to build more weight.`
    },
    {
      question: "Are returns guaranteed?",
      answer:
        "No. Pump.fun tokens are volatile. Runner is an AI selection system, not a promise of profit or future performance."
    },
    {
      question: "Why is there a minimum holding requirement?",
      answer:
        "The 1M+ threshold keeps distributions meaningful and helps avoid network costs eating tiny allocations."
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
    <section className="runner-section runner-final-cta">
      <span className="runner-kicker">THE SCANNER IS LIVE</span>
      <h2>Never miss a runner.</h2>
      <p>Hold 1,000,000+ {tokenLabel} and remain eligible for scheduled animal-token runner drops every five minutes.</p>
      <div className="runner-hero-actions">
        <a className="runner-button" href={pumpRunnerConfig.buyUrl} target="_blank" rel="noreferrer">
          Buy {tokenLabel} <ArrowRight size={18} />
        </a>
        <a className="runner-button runner-button-secondary" href="#drops">
          View Drops
        </a>
        <a className="runner-button runner-button-secondary" href={pumpRunnerConfig.dexScreenerUrl} target="_blank" rel="noreferrer">
          Open DexScreener
        </a>
      </div>
      <p className="runner-disclaimer">
        Runner is an experimental AI scanner for Pump.fun tokens. Digital assets are highly volatile and may lose some or all of their value. Verify all addresses, eligibility rules, and onchain activity independently.
      </p>
    </section>
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
        <CopySignalBoard live={live} />
        <HowItWorks />
        <EligibilityCard live={live} />
        <HoldMultiplier />
        <AirdropFeed live={live} />
        <FaqSection />
        <FinalCta />
      </main>
      <HeaderBanner />
    </div>
  );
}
