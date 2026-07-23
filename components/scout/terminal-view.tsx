"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Clock3,
  ExternalLink,
  Gauge,
  Radio,
  Terminal
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { scoutPublicConfig } from "../../lib/scout-public";
import { formatClock, formatMoney, formatPercent, formatTime } from "./format";
import { useCountdown } from "./hooks";
import { useScout } from "./scout-provider";
import { SignalLogo } from "./signal-logo";
import type { ScoutSignal } from "./types";
import { Metric, StatusBadge } from "./ui";

function numericMetric(signal: ScoutSignal, key: string) {
  const raw = signal.metrics?.[key];
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function firstNumericMetric(signal: ScoutSignal, keys: string[]) {
  for (const key of keys) {
    const value = numericMetric(signal, key);
    if (value !== null) return value;
  }
  return null;
}

function scoreFactors(signal: ScoutSignal) {
  const buys = numericMetric(signal, "buys1h");
  const sells = numericMetric(signal, "sells1h");
  const totalTrades = (buys ?? 0) + (sells ?? 0);
  const buyShare = totalTrades > 0 ? (buys ?? 0) / totalTrades : null;
  const volumeVelocity = signal.liquidity_usd && signal.volume_24h_usd ? signal.volume_24h_usd / signal.liquidity_usd : null;
  const attention = firstNumericMetric(signal, ["attentionScore", "attention_score"]);
  const smartWallets = firstNumericMetric(signal, ["smartWalletScore", "smart_wallet_score"]);
  const narrative = firstNumericMetric(signal, ["narrativeScore", "narrative_score"]);
  return [
    { label: "Liquidity", value: formatMoney(signal.liquidity_usd), connected: signal.liquidity_usd !== null },
    { label: "24h volume", value: formatMoney(signal.volume_24h_usd), connected: signal.volume_24h_usd !== null },
    { label: "Volume velocity", value: volumeVelocity === null ? "Unavailable" : `${volumeVelocity.toFixed(2)}x`, connected: volumeVelocity !== null },
    { label: "Recent buy pressure", value: buyShare === null ? "Unavailable" : formatPercent(buyShare * 100), connected: buyShare !== null },
    { label: "Market attention", value: attention === null ? "Unavailable" : `${attention}/100`, connected: attention !== null },
    { label: "Smart-wallet activity", value: smartWallets === null ? "Unavailable" : `${smartWallets}/100`, connected: smartWallets !== null },
    { label: "Narrative", value: narrative === null ? "Unavailable" : `${narrative}/100`, connected: narrative !== null },
    { label: "1h price action", value: formatPercent(numericMetric(signal, "change1h")), connected: numericMetric(signal, "change1h") !== null }
  ];
}

function verifiedConfidence(signal: ScoutSignal | null) {
  if (!signal) return null;
  const value = firstNumericMetric(signal, ["confidence", "confidenceScore", "confidence_score"]);
  return value === null ? null : Math.max(0, Math.min(100, value));
}

const BUFFETT_BASKET_ASSETS = [
  {
    symbol: "AAPL.x",
    name: "Apple",
    weight: "50%",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    logo: "/brand/apple-logo.svg"
  },
  {
    symbol: "BRK.Bx",
    name: "Berkshire Hathaway",
    weight: "50%",
    mint: "Xs6B6zawENwAbWVi7w92rjazLuAr5Az59qgWKcNb45x",
    logo: "/brand/berkshire-logo.svg"
  }
];

const BUFFETT_BASKET_MINTS = new Set(BUFFETT_BASKET_ASSETS.map((asset) => asset.mint));

function cleanActiveSignal(signal: ScoutSignal | null) {
  return signal && BUFFETT_BASKET_MINTS.has(signal.mint) ? signal : null;
}

function SignalIdentity({ signal }: { signal: ScoutSignal }) {
  return (
    <div className="scout-signal-identity">
      <SignalLogo signal={signal} />
      <div>
        <span className="scout-label">Current portfolio asset</span>
        <h2>${signal.symbol}</h2>
        <p>{signal.name}</p>
      </div>
    </div>
  );
}

function CurrentSignalPanel({ signal }: { signal: ScoutSignal | null }) {
  const { stats, state } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const reconnecting = state === "error" || state === "stale";
  const idleStatus = state === "loading" ? "Starting..." : reconnecting ? "Reconnecting..." : "Watching...";

  if (!signal) {
    return (
      <section className="scout-panel scout-panel--signal scout-panel--empty">
        <div className="scout-panel__head">
          <div><span className="scout-kicker">Buffett Basket</span><h2>CALCULATING BASKET</h2></div>
          <StatusBadge label={state === "loading" ? "Starting" : reconnecting ? "Reconnecting" : "Basket online"} tone="queued" />
        </div>
        <div className="scout-metric-grid scout-metric-grid--four runner-idle-metrics" role="status">
          <Metric label="Current Basket" value="AAPL.x / BRK.Bx" />
          <Metric label="Status" value={idleStatus} />
          <Metric label="Basket Split" value="50 / 50" />
          <Metric label="Holder State" value="Awaiting first snapshot" />
          <Metric label="Minimum Hold" value="1,000,000+" />
          <Metric label="Sell Rule" value="Ineligible forever" />
          <Metric label="Epoch" value={`${scoutPublicConfig.epochMinutes} min`} />
          <Metric label="Portfolio" value="Apple + Berkshire" />
        </div>
        <div className="runner-no-target-copy">
          <strong>Awaiting first settled distribution.</strong>
          <p>Buffettcoin is configured for a 50/50 Apple and Berkshire basket. Eligible holders receive the basket once the first holder snapshot settles.</p>
        </div>
      </section>
    );
  }

  const currentMarketCap = numericMetric(signal, "currentMarketCapUsd");
  const marketCapChange = signal.market_cap_usd && currentMarketCap !== null
    ? ((currentMarketCap / signal.market_cap_usd) - 1) * 100
    : null;

  return (
    <section className="scout-panel scout-panel--signal">
      <div className="scout-panel__head">
        <SignalIdentity signal={signal} />
        <StatusBadge label="Basket verified" />
      </div>

      <div className="scout-signal-score">
        <div>
          <span className="scout-label">Portfolio Weight</span>
          <strong>{signal.scout_score === null ? "--" : signal.scout_score}</strong>
          {signal.scout_score !== null ? <small>/100</small> : null}
        </div>
        <div className="scout-score-track" aria-label={signal.scout_score === null ? "Basket score unavailable" : `Basket score ${signal.scout_score} out of 100`}>
          <i style={{ width: `${signal.scout_score ?? 0}%` }} />
        </div>
      </div>

      <div className="scout-metric-grid scout-metric-grid--four">
        <Metric label="Entry price" value={signal.price_usd === null ? "Unavailable" : `$${signal.price_usd.toPrecision(5)}`} />
        <Metric label="Entry MC" value={formatMoney(signal.market_cap_usd)} />
        <Metric label="Current market cap" value={formatMoney(currentMarketCap)} />
        <Metric label="Since entry" value={formatPercent(marketCapChange)} />
        <Metric label="Entry liquidity" value={formatMoney(signal.liquidity_usd)} />
        <Metric label="Confidence" value={verifiedConfidence(signal) === null ? "Unavailable" : `${verifiedConfidence(signal)}%`} />
        <Metric label="Current score" value={signal.scout_score === null ? "--" : `${signal.scout_score}/100`} />
        <Metric label="Scan time" value={formatTime(signal.detected_at)} />
      </div>

      <div className="scout-signal-reason">
        <Terminal size={17} aria-hidden="true" />
        <div>
          <span className="scout-label">Distribution logic</span>
          <p>{signal.selection_reason || signal.reasons[0] || "Buffettcoin distributes a 50/50 basket of AAPL.x and BRK.Bx to eligible long-term holders."}</p>
        </div>
      </div>

      <div className="scout-panel__footer">
        <span><Clock3 size={15} /> {signal.selected_at ? `Selected ${formatTime(signal.selected_at)}` : "Selection time unavailable"}</span>
        <span><Radio size={15} /> Next 50/50 basket distribution {countdown.label}</span>
        <a href={`https://dexscreener.com/solana/${signal.mint}`} target="_blank" rel="noreferrer">
          Open chart <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}

function ScorePanel({ signal }: { signal: ScoutSignal | null }) {
  const { state } = useScout();
  const factors = signal ? scoreFactors(signal) : [];
  return (
    <section className="scout-panel scout-panel--factors">
      <div className="scout-panel__head">
        <div><span className="scout-kicker">Portfolio Ledger</span><h2>Basket accounting</h2></div>
        <Gauge size={22} aria-hidden="true" />
      </div>
      {signal ? (
        <div className="scout-factor-list">
          {factors.map((factor) => (
            <div key={factor.label}>
              <span>{factor.label}</span>
              <strong className={factor.connected ? "" : "is-muted"}>{factor.value}</strong>
            </div>
          ))}
        </div>
      ) : (
        <div className="runner-scanner-idle" role="status">
          <strong>{state === "loading" ? "STARTING..." : state === "error" || state === "stale" ? "RECONNECTING..." : "READY"}</strong>
          <span>AAPL.x / BRK.Bx basket configured.</span>
          <span>Waiting for the first settled distribution record.</span>
          <small>Amounts appear once a transaction is verified.</small>
        </div>
      )}
      <p className="scout-note">Buffettcoin publishes holder-weight and distribution data only after receipts are verified.</p>
    </section>
  );
}

export function ActivityFeed() {
  const { signals, stats, state, lastUpdated } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const updatedAt = lastUpdated ?? new Date();
  const idleLines = state === "loading"
    ? [
        { time: formatClock(updatedAt), status: "LEDGER", output: "STARTING" },
        { time: formatClock(updatedAt), status: "HOLDER FEED", output: "CONNECTING" },
        { time: formatClock(updatedAt), status: "BASKET", output: "INITIALIZING" },
        { time: formatClock(updatedAt), status: "ASSET", output: "AAPL.x / BRK.Bx" }
      ]
    : state === "error" || state === "stale"
    ? [
        { time: formatClock(updatedAt), status: "LEDGER", output: "RECONNECTING" },
        { time: formatClock(updatedAt), status: "HOLDER FEED", output: "STATUS UNAVAILABLE" },
        { time: formatClock(updatedAt), status: "BASKET", output: "AAPL.x / BRK.Bx" },
        { time: formatClock(updatedAt), status: "NEXT DROP", output: countdown.label }
      ]
    : [
        { time: formatClock(updatedAt), status: "LEDGER", output: "ONLINE" },
        { time: formatClock(updatedAt), status: "HOLDER FEED", output: "CONNECTED" },
        { time: formatClock(updatedAt), status: "BASKET", output: "BUFFETTCOIN" },
        { time: formatClock(updatedAt), status: "AWAITING", output: "VERIFIED ASSET" },
        { time: formatClock(updatedAt), status: "NEXT DROP", output: countdown.label }
      ];
  const activeLines = signals.active ? [
    { time: formatClock(signals.active.updated_at), status: "LEDGER", output: "ONLINE" },
    { time: formatClock(signals.active.updated_at), status: "BASKET ASSET VERIFIED", output: `$${signals.active.symbol}` },
    ...(signals.active.selected_at ? [
      { time: formatClock(signals.active.selected_at), status: "BASKET ASSET LOCKED", output: `$${signals.active.symbol}` }
    ] : []),
    ...(verifiedConfidence(signals.active) === null ? [] : [
      { time: formatClock(signals.active.updated_at), status: "CONFIDENCE", output: `${verifiedConfidence(signals.active)}%` }
    ]),
    { time: formatClock(updatedAt), status: "NEXT DROP", output: countdown.label }
  ] : [];
  const eventLines = signals.events.slice(0, 5).map((event) => {
    const joined = Array.isArray(event.signal) ? event.signal[0] : event.signal;
    return {
      time: formatClock(event.created_at),
      status: event.event_type.replaceAll("_", " ").toUpperCase(),
      output: joined ? `$${joined.symbol}` : "BUFFETTCOIN PROTOCOL"
    };
  });
  const lines = signals.active ? [...activeLines, ...eventLines].slice(0, 16) : idleLines;
  return (
    <section className="scout-panel scout-panel--feed">
      <div className="scout-panel__head">
        <div><span className="scout-kicker">Live tape</span><h2>Buffettcoin feed</h2></div>
        <Activity size={21} aria-hidden="true" />
      </div>
      <div className="runner-terminal-log" aria-label="Live index feed">
        <div className="runner-terminal-log__track">
          {[...lines, ...lines].map((line, index) => (
            <span aria-hidden={index >= lines.length} key={`${line.time}-${line.status}-${index}`}>
              <time>{line.time}</time><strong>{line.status}</strong><em>{line.output}</em>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HolderMultiplierPanel() {
  const { stats } = useScout();
  return (
    <section className="scout-panel scout-panel--protocol scout-multiplier-panel">
      <div className="scout-panel__head">
        <div><span className="scout-kicker">Holder Weight</span><h2>Shareholder-style weight.</h2></div>
        <span className="runner-average-multiplier">AVG {stats.averageMultiplier === null ? "—" : `${stats.averageMultiplier.toFixed(2)}x`}</span>
      </div>
      <div className="runner-multiplier-tiers" aria-label="Holder weight milestones">
        <span><small>START</small><strong>1.00x</strong></span>
        <span><small>1 DAY</small><strong>1.50x</strong></span>
        <span><small>1 WEEK</small><strong>2.00x</strong></span>
        <span><small>1 MONTH</small><strong>3.00x</strong></span>
        <span><small>3 MONTHS</small><strong>5.00x</strong></span>
      </div>
      <div className="runner-multiplier-flow" aria-label="How Buffettcoin holder weight works">
        <span>Hold longer</span><i>→</i><span>Multiplier increases</span><i>→</i><span>Distribution weight grows</span><i>→</i><span>Sell once = out forever</span>
      </div>
      <p className="scout-note">Buffettcoin uses holder-weight rules to split each AAPL.x / BRK.Bx distribution among eligible wallets. Keep holding to preserve weight. Sell once and that wallet is permanently ineligible for future Buffettcoin distributions.</p>
      <Link className="scout-text-link" href="/docs#access">View holder rules <ArrowRight size={15} /></Link>
    </section>
  );
}

export function ScoutTerminalView() {
  const { signals, stats, state, lastUpdated } = useScout();
  const [treadmillBoost, setTreadmillBoost] = useState(false);
  const previousActiveId = useRef<string | null | undefined>(undefined);
  const countdown = useCountdown(stats.nextDropTime);
  const reconnecting = state === "error" || state === "stale";
  const scannerStatus = state === "loading" ? "STARTING" : reconnecting ? "RECONNECTING" : "ONLINE";
  const activeSignal = cleanActiveSignal(signals.active);
  const activeSymbol = activeSignal ? `$${activeSignal.symbol}` : "AAPL.x / BRK.Bx";
  const rankedSignals = activeSignal
    ? [...signals.signals.filter((signal) => BUFFETT_BASKET_MINTS.has(signal.mint))]
        .sort((left, right) => (right.scout_score ?? -1) - (left.scout_score ?? -1))
        .slice(0, 6)
    : [];
  const activeConfidence = verifiedConfidence(activeSignal);
  const tapeItems = activeSignal
    ? [
        ...rankedSignals.map((signal) => ({
          id: signal.id,
          symbol: `$${signal.symbol}`,
          score: signal.scout_score === null ? "SCORE UNAVAILABLE" : `${signal.scout_score}/100`,
          status: signal.id === activeSignal?.id ? "ACTIVE" : signal.status.toUpperCase()
        })),
        { id: "cycle", symbol: "NEXT DISTRIBUTION", score: countdown.label, status: stats.currentEpoch > 0 ? `EPOCH ${stats.currentEpoch}` : "EPOCH UNAVAILABLE" },
        { id: "protocol", symbol: "$BUFFETT", score: signals.access === "premium" ? "REAL TIME" : `${signals.publicDelaySeconds}S DELAY`, status: "BASKET LIVE" }
      ]
    : [
        { id: "engine", symbol: "BUFFETT BASKET", score: scannerStatus, status: state === "loading" ? "INITIALIZING" : reconnecting ? "RECONNECTING" : "CALCULATING" },
        { id: "feed", symbol: "HOLDER LEDGER", score: state === "loading" ? "CONNECTING" : reconnecting ? "STATUS UNAVAILABLE" : "CONNECTED", status: "WEIGHTING" },
        { id: "target", symbol: "AAPL.x / BRK.Bx", score: "50 / 50", status: "VERIFYING" },
        { id: "drop", symbol: "NEXT DISTRIBUTION", score: countdown.label, status: "SCHEDULED" }
      ];

  useEffect(() => {
    const nextActiveId = activeSignal?.id ?? null;
    const previous = previousActiveId.current;
    previousActiveId.current = nextActiveId;
    if (previous === undefined || !nextActiveId || nextActiveId === previous) return;
    setTreadmillBoost(true);
    const timeout = window.setTimeout(() => setTreadmillBoost(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [activeSignal?.id]);

  return (
    <>
      <section className={`scout-hero runner-hero${treadmillBoost ? " is-runner-boost" : ""}`}>
        <div className="runner-brand-masthead ri-brand-masthead">
          <img src="/brand/buffettcoin-mark.png" alt="Buffettcoin" />
          <div><span>BUFFETTCOIN</span><strong>50/50</strong><small>APPLE // BERKSHIRE // HOLDER RECEIPTS</small></div>
        </div>
        <div className="scout-hero__copy">
          <div className="runner-hero__statusline">
            <StatusBadge label={state === "loading" ? "Basket starting" : reconnecting ? "Basket reconnecting" : "Basket online"} />
            <span>{activeSignal ? (signals.access === "premium" ? "REAL-TIME BASKET FEED" : `BASKET FEED · ${signals.publicDelaySeconds}S DELAY`) : state === "loading" ? "CONNECTING HOLDER LEDGER" : reconnecting ? "HOLDER LEDGER STATUS UNAVAILABLE" : "50/50 APPLE + BERKSHIRE BASKET"}</span>
          </div>
          <p className="scout-eyebrow">BUFFETTCOIN // THE ONCHAIN SHAREHOLDER BASKET</p>
          <h1>Own Buffett's<br /><span>portfolio.</span></h1>
          <p className="scout-hero__body">Every 5 minutes Buffettcoin distributes a 50/50 basket of AAPL.x and BRK.Bx to eligible holders. Hold 1,000,000+ {scoutPublicConfig.tokenLabel}. Sell once and that wallet is ineligible forever.</p>
          <div className="runner-hero-mechanism" aria-label="Buffettcoin basket mechanism">
            <span><small>Mandate</small><strong>{scoutPublicConfig.basketLabel}</strong></span>
            <span><small>Settlement</small><strong>{scoutPublicConfig.epochMinutes}-minute epochs</strong></span>
            <span><small>Eligibility</small><strong>{scoutPublicConfig.minimumHolding.toLocaleString()}+ {scoutPublicConfig.tokenLabel}</strong></span>
          </div>
          <nav className="runner-hero-links" aria-label="BUFFETTCOIN protocol links">
            <Link href="/runners">View basket <ArrowRight size={13} /></Link>
            <Link href="/terminal">Open ledger <ArrowRight size={13} /></Link>
          </nav>
          <p className="scout-hero__delay"><Clock3 size={15} /> APPLE. BERKSHIRE. HOLDER-WEIGHTED RECEIPTS.</p>
        </div>
        <div className="scout-hero__terminal buffett-basket-card">
          <div className="scout-terminal-bar"><span><i /> BUFFETTCOIN PORTFOLIO</span><small>{lastUpdated ? `UPDATED ${formatClock(lastUpdated)}` : "INITIALIZING"}</small></div>
          <div className="buffett-stock-grid" aria-label="Buffettcoin 50/50 portfolio">
            {BUFFETT_BASKET_ASSETS.map((asset) => (
              <article key={asset.mint}>
                <img src={asset.logo} alt={`${asset.name} logo`} />
                <div>
                  <span>{asset.name}</span>
                  <strong>{asset.symbol}</strong>
                  <code>{asset.mint.slice(0, 6)}...{asset.mint.slice(-5)}</code>
                </div>
                <em>{asset.weight}</em>
              </article>
            ))}
          </div>
          <div className="buffett-basket-summary">
            <Metric label="Basket" value="AAPL.x / BRK.Bx" detail="50 / 50 split" />
            <Metric label="Next Distribution" value={countdown.label} detail={`${scoutPublicConfig.epochMinutes}-minute epoch`} />
            <Metric label="Eligibility" value="1,000,000+" detail={scoutPublicConfig.tokenLabel} />
            <Metric label="Sell Rule" value="Ineligible" detail="Forever after sell" />
          </div>
          {state === "loading" ? <div className="runner-terminal-state"><i /><strong>VALUING</strong><span>CONNECTING BUFFETTCOIN LEDGER</span></div> : null}
        </div>
        <div className="scout-live-strip">
          <Metric label="Basket Assets" value="2" detail={scoutPublicConfig.basketAssets.join(" + ")} />
          <Metric label="Active Basket" value={activeSignal ? activeSymbol : scoutPublicConfig.basketLabel} detail={activeSignal?.name ?? "Apple + Berkshire"} />
          <Metric label="Average Weight" value={stats.averageMultiplier === null ? "—" : `${stats.averageMultiplier.toFixed(2)}x`} detail="Eligible holders" />
          <div className="runner-next-distribution"><Metric label="Next Distribution" value={countdown.label} detail={`${scoutPublicConfig.epochMinutes}-minute epoch`} /></div>
        </div>
        <div className="runner-hero-tape" aria-label="Live Buffettcoin ledger tape">
          <div className="runner-hero-tape__track">
            {[...tapeItems, ...tapeItems, ...tapeItems, ...tapeItems].map((item, index) => (
              <span key={`${item.id}-${index}`}><i />{item.symbol}<strong>{item.score}</strong><em>{item.status}</em></span>
            ))}
          </div>
        </div>
      </section>

      <section className="buffett-origin-section" aria-labelledby="buffett-origin-title">
        <div className="buffett-origin-card">
          <div>
            <span className="scout-kicker">Origin clip</span>
            <h2 id="buffett-origin-title">“Why don’t you call it Buffettcoin?”</h2>
            <p>
              The thesis starts from Buffett’s own line: create your own coin. Buffettcoin turns that joke into a clean
              onchain shareholder basket: Apple, Berkshire, holder conviction, and public receipts.
            </p>
          </div>
          <a href="https://www.youtube.com/watch?v=HVm7Pfb0ilY&t=149s" target="_blank" rel="noreferrer">
            Watch the clip <ExternalLink size={15} />
          </a>
        </div>
      </section>

      <section className="scout-terminal-section" id="terminal">
        <div className="scout-section-heading scout-section-heading--inline">
          <div><span className="scout-kicker">Buffettcoin Board</span><h2>Apple and Berkshire, settled onchain.</h2></div>
          <p>Track the basket mandate, holder weights, and settled AAPL.x / BRK.Bx receipts from one clean ledger.</p>
        </div>
        <div className="scout-terminal-grid">
          <CurrentSignalPanel signal={activeSignal} />
          <ScorePanel signal={activeSignal} />
          <ActivityFeed />
          <HolderMultiplierPanel />
        </div>
      </section>
    </>
  );
}
