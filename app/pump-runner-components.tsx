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
  totalRewardEarned: number;
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
    `ACTIVE SCAN ${pumpRunnerConfig.currentRunner.ticker}`,
    `${pumpRunnerConfig.currentRunner.ticker} PRICE ${formatPrice(scan.priceUsd, "Awaiting scan price")}`,
    `TOTAL SOL VALUE AIRDROPPED ${formatSolAmount(live.stats.totalSolValueAirdropped)}`,
    `TOTAL EPOCHS ${formatCount(live.stats.totalEpochs || live.stats.currentEpoch, "0")}`,
    `TOTAL HOLDERS ${formatCount(holderCount, pumpRunnerConfig.marketTickerFallback.holderCount)}`,
    `${tokenLabel} PRICE ${formatPrice(source.priceUsd)}`,
    `NEXT AIRDROP ${live.countdown}`,
    `SCANNER ${pumpRunnerConfig.scannerStatus}`,
    `TREASURY ${pumpRunnerConfig.treasuryStatus}`
  ];

  return (
    <div className="runner-ticker" aria-label="Live Copy Cat market ticker">
      <div className="runner-ticker-track">
        {[0, 1].map((copy) => (
          <div className="runner-ticker-group" key={copy}>
            {items.map((item) => (
              <span key={`${copy}-${item}`}>{item}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RunnerNav() {
  const ca = pumpRunnerConfig.contractAddress;
  return (
    <header className="runner-nav">
      <a className="runner-brand" href="#top" aria-label="Copy Cat home">
        <img className="runner-brand-logo" src={pumpRunnerConfig.logoSrc} alt="" />
        <span>
          <strong>{pumpRunnerConfig.name}</strong>
          <small>{tokenLabel} copies smart wallets</small>
        </span>
      </a>
      <nav className="runner-links" aria-label="Primary navigation">
        <a href="#board">Board</a>
        <a href="#scanner">Scanner</a>
        <a href="#eligibility">Eligibility</a>
        <a href="#drops">Drops</a>
      </nav>
      <div className="runner-actions">
        {ca ? <CopyCaButton address={ca} label={compactAddress(ca)} /> : null}
        {pumpRunnerConfig.xUrl ? (
          <a className="runner-small-button" href={pumpRunnerConfig.xUrl} target="_blank" rel="noreferrer">
            X
          </a>
        ) : null}
        <a className="runner-small-button runner-buy-button" href={pumpRunnerConfig.buyUrl} target="_blank" rel="noreferrer">
          Buy
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
          COPY CAT SCANNER ONLINE
        </div>
        <h1>COPY THE SMART MONEY.</h1>
        <p className="runner-hero-subtitle">
          Copy Cat aggregates smart-wallet scans, buys the active scan with 100% of fees, and airdrops it to eligible {tokenLabel} holders.
        </p>
        <p className="runner-hero-line">Hold {tokenLabel}. The scanner copies the flow. Your wallet receives the airdrop.</p>
        <div className="runner-hero-actions">
          <a className="runner-button" href={pumpRunnerConfig.buyUrl} target="_blank" rel="noreferrer">
            Buy {tokenLabel} <ArrowRight size={18} />
          </a>
          <a className="runner-button runner-button-secondary" href="#drops">
            View Scan Drops
          </a>
        </div>
        <div className="runner-sequence" aria-label="Copy Cat process">
          <span>SCAN</span>
          <span>BUY</span>
          <span>AIRDROP</span>
        </div>
      </div>

      <div className="runner-hero-panel" aria-label="Copy Cat live terminal">
        <div className="runner-panel-top">
          <div className="runner-panel-title">
            <img className="runner-token-logo" src={pumpRunnerConfig.currentRunner.logoSrc} alt="" />
            <div>
              <span>ACTIVE SCAN</span>
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
            <span>Buying</span>
            <strong>{pumpRunnerConfig.currentRunner.amountAcquired}</strong>
          </div>
        </div>
        <div className="runner-drop-card">
          <span>NEXT AIRDROP</span>
          <strong>{live.countdown}</strong>
          <small>Every {pumpRunnerConfig.epochMinutes} minutes</small>
        </div>
        <div className="runner-track-display">
          <div className="runner-track-line" />
          <div className="runner-track-lane" />
          <div className="runner-scan-line" />
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

export function RunnerLeaderboard() {
  const [tab, setTab] = useState("Today");
  const summary = pumpRunnerConfig.treasuryStatistics;
  const summaryItems = [
    ["Smart-wallet scans today", summary.runnersCaughtToday],
    ["Average entry market cap", summary.averageEntryMarketCap],
    ["Average return", summary.averageReturn],
    ["Active scan", summary.bestRunner],
    ["Total distributed today", summary.totalDistributedToday]
  ];

  return (
    <section className="runner-section" id="board">
      <div className="runner-section-heading">
        <span className="runner-kicker">Live Copy Board</span>
        <h2>TODAY'S SCAN</h2>
        <p>The active smart-wallet scan being bought and airdropped to eligible {tokenLabel} holders.</p>
      </div>
      <div className="runner-tabs" role="tablist" aria-label="Copy Cat board range">
        {["Today", "This Week", "All Time"].map((item) => (
          <button
            aria-selected={tab === item}
            className={tab === item ? "is-active" : ""}
            key={item}
            onClick={() => setTab(item)}
            role="tab"
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <div className="runner-summary-grid">
        {summaryItems.map(([label, value]) => (
          <div className="runner-stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="runner-table-wrap">
        <table className="runner-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Token</th>
              <th>Ticker</th>
              <th>Detected MC</th>
              <th>Current MC</th>
              <th>Return</th>
              <th>Bought</th>
              <th>Status</th>
              <th>Chart</th>
            </tr>
          </thead>
          <tbody>
            {pumpRunnerConfig.runnerBoard.map((runner) => (
              <tr key={`${tab}-${runner.rank}-${runner.ticker}`}>
                <td>{runner.rank}</td>
                <td>{runner.token}</td>
                <td>{runner.ticker}</td>
                <td>{runner.detectedMarketCap}</td>
                <td>{runner.currentMarketCap}</td>
                <td className="runner-positive">{runner.returnSinceDetection}</td>
                <td>{runner.amountAcquired}</td>
                <td>
                  <span className="runner-status-chip">{runner.status}</span>
                </td>
                <td>
                  <a href={runner.dexScreenerUrl} target="_blank" rel="noreferrer" aria-label={`Open ${runner.ticker} chart`}>
                    <ExternalLink size={16} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ScannerStatus({ live }: { live: RunnerLiveData }) {
  const selectedRunners = pumpRunnerConfig.runnerBoard.filter((runner) => runner.status !== "Scanning").length;
  const rows = [
    ["SCANNER STATUS", "ONLINE"],
    ["ACTIVE SCAN", rewardSymbol],
    ["ELIGIBLE HOLDERS", formatCount(live.stats.latestEligibleHolders, "0")],
    ["SCANS SELECTED", selectedRunners.toString()],
    ["LIVE DROP EPOCHS", formatCount(live.stats.totalEpochs || live.stats.currentEpoch, "0")],
    [`${rewardSymbol} AIRDROPPED`, formatTokenAmount(live.stats.totalRewardAirdropped, rewardSymbol, `0 ${rewardSymbol}`)]
  ];

  return (
    <section className="runner-section" id="scanner">
      <div className="runner-section-heading">
        <span className="runner-kicker">Signal Engine</span>
        <h2>THE COPY SCANNER</h2>
        <p>
          Copy Cat is powered by an aggregated smart-wallet mechanism built to track flow, liquidity, volume, holder growth and emerging market activity across Pump.fun.
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
          <p>The exact aggregation methodology remains private to protect the strategy and prevent copy trading.</p>
        </div>
      </div>
    </section>
  );
}

function CopyCatOrigin() {
  return (
    <section className="runner-section runner-origin" id="origin">
      <div className="runner-section-heading">
        <span className="runner-kicker">The Name</span>
        <h2>CC WAS THE FIRST COPY CAT.</h2>
        <p>
          Our logo nods to CC, short for CopyCat, the first cloned cat. The idea is simple: copy the signal, not the noise.
        </p>
      </div>
      <div className="runner-origin-grid">
        <article className="runner-info-card">
          <h3>01 · Aggregate</h3>
          <p>Smart wallets are grouped into one private scan feed so the system can spot movement early.</p>
        </article>
        <article className="runner-info-card">
          <h3>02 · Copy</h3>
          <p>100% of usable fees buy the active scan token instead of splitting into side rails.</p>
        </article>
        <article className="runner-info-card">
          <h3>03 · Drop</h3>
          <p>Eligible holders above 1,000,000 {tokenLabel} receive the scan token through scheduled airdrops.</p>
        </article>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      label: "01",
      title: "Smart wallets surface a scan",
      body: "The private aggregation layer watches selected wallets and active Pump.fun tokens for high-quality setups."
    },
    {
      label: "02",
      title: "Fees buy the scan",
      body: "100% of usable creator-fee revenue is routed into the active token selected by the scan engine."
    },
    {
      label: "03",
      title: "Holders receive the drop",
      body: `The scan token is distributed to eligible ${tokenLabel} holders during scheduled airdrop epochs.`
    }
  ];

  return (
    <section className="runner-section runner-how" id="how">
      <div className="runner-section-heading">
        <span className="runner-kicker">How It Works</span>
        <h2>COPY THE FLOW</h2>
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
      <strong className="runner-bold-line">Hold {tokenLabel}. Receive the scans our system copies.</strong>
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
          <h3>To qualify for active-scan airdrops, a wallet must:</h3>
          <ul>
            <li>Hold at least {required}</li>
            <li>Be holding at the eligibility snapshot</li>
            <li>Continue holding through the active epoch</li>
            <li>Meet basic wallet and anti-abuse requirements</li>
          </ul>
          <p>{pumpRunnerConfig.rentCopy}</p>
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
        <span className="runner-kicker">Loyalty Weight</span>
        <h2>KEEP COPYING</h2>
        <p>Consistent holders receive a modest loyalty multiplier on their eligible distribution weight.</p>
      </div>
      <div className="runner-meter-card">
        <div className="runner-distance-meter" aria-label="Seven day multiplier meter">
          <span>START</span>
          <div>
            <i style={{ width: "72%" }} />
          </div>
          <span>7 DAY COPY WEIGHT</span>
        </div>
        <div className="runner-tier-grid">
          {pumpRunnerConfig.multiplierTiers.map((tier) => (
            <div className="runner-tier" key={tier.label}>
              <span>{tier.label}</span>
              <strong>{tier.multiplier}</strong>
            </div>
          ))}
        </div>
        <p>Selling or transferring {tokenLabel} resets the wallet's hold multiplier. The multiplier affects distribution weight, not a fixed reward.</p>
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
      token: "Next scanner batch",
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
        <h2>RECENT DROPS</h2>
        <p>Each scan stays on the record: scan market cap, live market cap, amount dropped and the current SOL value of the distribution.</p>
      </div>
      <div className="runner-drop-ledger">
        <article className="runner-drop-feature">
          <div>
            <span>Scan 01</span>
            <strong>{activeRunner.token}</strong>
            <small>{activeRunner.ticker} scanned at {activeRunner.detectedMarketCap} · {activeRunnerScanTime}</small>
          </div>
          <a href={activeRunner.dexScreenerUrl} target="_blank" rel="noreferrer">
            Open chart <ExternalLink size={15} />
          </a>
        </article>
        <div className="runner-drop-metrics">
          <div>
            <span>Scanned MC</span>
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

export function RunnerPerformanceChart() {
  const maxMarketCap = Math.max(...pumpRunnerConfig.performanceRows.map((row) => row.currentMarketCap));

  return (
    <section className="runner-section" id="history">
      <div className="runner-section-heading">
        <span className="runner-kicker">Past Copy Results</span>
        <h2>COPY HISTORY</h2>
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
      <p className="runner-disclaimer">Past scanner results do not guarantee future performance. Tokens selected by the system may lose some or all of their value.</p>
    </section>
  );
}

export function RiskDisclosure() {
  return (
    <p className="runner-risk">
      {pumpRunnerConfig.riskCopy}
    </p>
  );
}

function FaqSection() {
  const faqs = [
    {
      question: "What is Copy Cat?",
      answer:
        `Copy Cat is a holder-reward system that aggregates smart-wallet scans, buys the active scan with fees and distributes that token to eligible ${tokenLabel} holders.`
    },
    {
      question: "How many tokens must I hold?",
      answer: `A wallet must hold at least ${pumpRunnerConfig.minimumHolding.toLocaleString()} ${tokenLabel} at the eligibility snapshot.`
    },
    {
      question: "How often are drops distributed?",
      answer: `Scan-token distributions are processed in scheduled epochs. The current interface is set to ${pumpRunnerConfig.epochMinutes}-minute epochs.`
    },
    {
      question: "What happens when I sell?",
      answer:
        `Selling or transferring ${tokenLabel} resets the wallet's hold multiplier. Depending on snapshot rules, it may also remove the wallet from the current distribution epoch.`
    },
    {
      question: "Are scan profits guaranteed?",
      answer:
        "No. Meme tokens are highly volatile, and scanner selections may decline in value. The scanner is a selection system, not a guarantee of performance."
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
      <h2>THE NEXT COPY IS ALREADY MOVING.</h2>
      <p>Hold {tokenLabel} and stay eligible for every scheduled active-scan drop routed through the system.</p>
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
        <a href="#drops">Airdrop history</a>
        <a href="#faq">Terms</a>
        <a href="#faq">Risk disclosure</a>
      </div>
      <p>Built to scan. Built to copy. Built to drop.</p>
      <p>{pumpRunnerConfig.rentCopy}</p>
      <RiskDisclosure />
    </footer>
  );
}

export function PumpRunnerHome() {
  const live = useRunnerLiveData();

  return (
    <div className="pump-runner-page">
      <MarketTicker live={live} />
      <RunnerNav />
      <main>
        <HeroSection live={live} />
        <RunnerLeaderboard />
        <ScannerStatus live={live} />
        <CopyCatOrigin />
        <HowItWorks />
        <EligibilityCard live={live} />
        <HoldMultiplier />
        <AirdropFeed live={live} />
        <RunnerPerformanceChart />
        <FaqSection />
        <FinalCta />
      </main>
      <RunnerFooter />
    </div>
  );
}
