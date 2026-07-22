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

function SignalIdentity({ signal }: { signal: ScoutSignal }) {
  return (
    <div className="scout-signal-identity">
      <SignalLogo signal={signal} />
      <div>
        <span className="scout-label">Active Index Component</span>
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
          <div><span className="scout-kicker">Index Component</span><h2>CALCULATING INDEX</h2></div>
          <StatusBadge label={state === "loading" ? "Starting" : reconnecting ? "Reconnecting" : "Index online"} tone="queued" />
        </div>
        <div className="scout-metric-grid scout-metric-grid--four runner-idle-metrics" role="status">
          <Metric label="Current Component" value="Not yet assigned" />
          <Metric label="Status" value={idleStatus} />
          <Metric label="Index State" value="Calculating" />
          <Metric label="Holder State" value="Awaiting first snapshot" />
          <Metric label="Liquidity" value="Unavailable" />
          <Metric label="24h Volume" value="Unavailable" />
          <Metric label="Token Age" value="Awaiting target" />
          <Metric label="Current Score" value="--" />
        </div>
        <div className="runner-no-target-copy">
          <strong>No active index component yet.</strong>
          <p>RI6900 remains online while the first verified component and holder snapshot are authenticated.</p>
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
        <StatusBadge label="Component verified" />
      </div>

      <div className="scout-signal-score">
        <div>
          <span className="scout-label">Index Score</span>
          <strong>{signal.scout_score === null ? "--" : signal.scout_score}</strong>
          {signal.scout_score !== null ? <small>/100</small> : null}
        </div>
        <div className="scout-score-track" aria-label={signal.scout_score === null ? "Index score unavailable" : `Index score ${signal.scout_score} out of 100`}>
          <i style={{ width: `${signal.scout_score ?? 0}%` }} />
        </div>
      </div>

      <div className="scout-metric-grid scout-metric-grid--four">
        <Metric label="Entry price" value={signal.price_usd === null ? "Unavailable" : `$${signal.price_usd.toPrecision(5)}`} />
        <Metric label="Entry MC" value={formatMoney(signal.market_cap_usd)} />
        <Metric label="Current MC" value={formatMoney(currentMarketCap)} />
        <Metric label="Since entry" value={formatPercent(marketCapChange)} />
        <Metric label="Entry liquidity" value={formatMoney(signal.liquidity_usd)} />
        <Metric label="Confidence" value={verifiedConfidence(signal) === null ? "Unavailable" : `${verifiedConfidence(signal)}%`} />
        <Metric label="Current score" value={signal.scout_score === null ? "--" : `${signal.scout_score}/100`} />
        <Metric label="Scan time" value={formatTime(signal.detected_at)} />
      </div>

      <div className="scout-signal-reason">
        <Terminal size={17} aria-hidden="true" />
        <div>
          <span className="scout-label">Selection logic</span>
          <p>{signal.selection_reason || signal.reasons[0] || "Selection rationale unavailable."}</p>
        </div>
      </div>

      <div className="scout-panel__footer">
        <span><Clock3 size={15} /> {signal.selected_at ? `Selected ${formatTime(signal.selected_at)}` : "Selection time unavailable"}</span>
        <span><Radio size={15} /> Next index rebalance {countdown.label}</span>
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
        <div><span className="scout-kicker">RI6900 Index Engine</span><h2>Component factors</h2></div>
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
          <strong>{state === "loading" ? "STARTING..." : state === "error" || state === "stale" ? "RECONNECTING..." : "SEARCHING..."}</strong>
          <span>No momentum leader detected.</span>
          <span>Waiting for sufficient confidence.</span>
          <small>Signal factors remain unavailable until a target is authenticated.</small>
        </div>
      )}
      <p className="scout-note">RI6900 publishes component, holder-weight, and distribution data only after the underlying records are verified.</p>
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
        { time: formatClock(updatedAt), status: "INDEXING", output: "INITIALIZING" },
        { time: formatClock(updatedAt), status: "COMPONENT", output: "NOT YET ASSIGNED" }
      ]
    : state === "error" || state === "stale"
    ? [
        { time: formatClock(updatedAt), status: "LEDGER", output: "RECONNECTING" },
        { time: formatClock(updatedAt), status: "HOLDER FEED", output: "STATUS UNAVAILABLE" },
        { time: formatClock(updatedAt), status: "COMPONENT", output: "NOT YET ASSIGNED" },
        { time: formatClock(updatedAt), status: "NEXT DROP", output: countdown.label }
      ]
    : [
        { time: formatClock(updatedAt), status: "LEDGER", output: "ONLINE" },
        { time: formatClock(updatedAt), status: "HOLDER FEED", output: "CONNECTED" },
        { time: formatClock(updatedAt), status: "INDEXING", output: "RI6900" },
        { time: formatClock(updatedAt), status: "AWAITING", output: "VERIFIED COMPONENT" },
        { time: formatClock(updatedAt), status: "NEXT DROP", output: countdown.label }
      ];
  const activeLines = signals.active ? [
    { time: formatClock(signals.active.updated_at), status: "LEDGER", output: "ONLINE" },
    { time: formatClock(signals.active.updated_at), status: "COMPONENT VERIFIED", output: `$${signals.active.symbol}` },
    ...(signals.active.selected_at ? [
      { time: formatClock(signals.active.selected_at), status: "COMPONENT LOCKED", output: `$${signals.active.symbol}` }
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
      output: joined ? `$${joined.symbol}` : "RI6900 PROTOCOL"
    };
  });
  const lines = signals.active ? [...activeLines, ...eventLines].slice(0, 16) : idleLines;
  return (
    <section className="scout-panel scout-panel--feed">
      <div className="scout-panel__head">
        <div><span className="scout-kicker">Live tape</span><h2>RI6900 feed</h2></div>
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
        <div><span className="scout-kicker">Index Multiplier</span><h2>Persistence compounds to 25x.</h2></div>
        <span className="runner-average-multiplier">AVG {stats.averageMultiplier === null ? "—" : `${stats.averageMultiplier.toFixed(2)}x`}</span>
      </div>
      <div className="runner-multiplier-tiers" aria-label="Index multiplier milestones">
        <span><small>START</small><strong>1.00x</strong></span>
        <span><small>15 MIN</small><strong>1.20x</strong></span>
        <span><small>1 HOUR</small><strong>1.50x</strong></span>
        <span><small>4 HOURS</small><strong>2.00x</strong></span>
        <span><small>12 HOURS</small><strong>2.50x</strong></span>
        <span><small>1 DAY</small><strong>3.00x</strong></span>
        <span><small>3 DAYS</small><strong>5.00x</strong></span>
        <span><small>1 WEEK</small><strong>10.00x</strong></span>
        <span><small>1 MONTH</small><strong>25.00x</strong></span>
      </div>
      <div className="runner-multiplier-flow" aria-label="How the RI6900 Index Multiplier works">
        <span>Hold longer</span><i>→</i><span>Multiplier increases</span><i>→</i><span>Distribution weight grows</span><i>→</i><span>Sell once = out forever</span>
      </div>
      <p className="scout-note">RI6900 converts uninterrupted holding time into distribution weight: 1.20x after 15 minutes, 1.50x after one hour, 2.00x after four hours, 2.50x after 12 hours, 3.00x after one day, 5.00x after three days, 10.00x after one week, and 25.00x after one month. Any balance decrease permanently ends eligibility.</p>
      <Link className="scout-text-link" href="/docs#access">View multiplier rules <ArrowRight size={15} /></Link>
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
  const activeSymbol = signals.active ? `$${signals.active.symbol}` : "CALCULATING";
  const rankedSignals = signals.active
    ? [...signals.signals]
        .sort((left, right) => (right.scout_score ?? -1) - (left.scout_score ?? -1))
        .slice(0, 6)
    : [];
  const activeConfidence = verifiedConfidence(signals.active);
  const scannerInputs = [
    { label: "Volume", connected: signals.active?.volume_24h_usd !== null && signals.active?.volume_24h_usd !== undefined },
    { label: "Attention", connected: signals.active ? firstNumericMetric(signals.active, ["attentionScore", "attention_score"]) !== null : false },
    { label: "Smart Wallets", connected: signals.active ? firstNumericMetric(signals.active, ["smartWalletScore", "smart_wallet_score"]) !== null : false },
    { label: "Narrative", connected: signals.active ? firstNumericMetric(signals.active, ["narrativeScore", "narrative_score"]) !== null : false }
  ];
  const idleStream = ["INDEXING HOLDERS...", "VERIFYING HOLD TIME...", "CALCULATING WEIGHTS...", "AWAITING FIRST COMPONENT..."];
  const tapeItems = signals.active
    ? [
        ...rankedSignals.map((signal) => ({
          id: signal.id,
          symbol: `$${signal.symbol}`,
          score: signal.scout_score === null ? "SCORE UNAVAILABLE" : `${signal.scout_score}/100`,
          status: signal.id === signals.active?.id ? "TARGET LOCKED" : signal.status.toUpperCase()
        })),
        { id: "cycle", symbol: "NEXT REBALANCE", score: countdown.label, status: stats.currentEpoch > 0 ? `EPOCH ${stats.currentEpoch}` : "EPOCH UNAVAILABLE" },
        { id: "protocol", symbol: "$RI6900", score: signals.access === "premium" ? "REAL TIME" : `${signals.publicDelaySeconds}S DELAY`, status: "INDEX LIVE" }
      ]
    : [
        { id: "engine", symbol: "RI6900 INDEX", score: scannerStatus, status: state === "loading" ? "INITIALIZING" : reconnecting ? "RECONNECTING" : "CALCULATING" },
        { id: "feed", symbol: "HOLDER LEDGER", score: state === "loading" ? "CONNECTING" : reconnecting ? "STATUS UNAVAILABLE" : "CONNECTED", status: "INDEXING" },
        { id: "target", symbol: "INDEX COMPONENT", score: "NOT YET ASSIGNED", status: "VERIFYING" },
        { id: "drop", symbol: "NEXT REBALANCE", score: countdown.label, status: "SCHEDULED" }
      ];

  useEffect(() => {
    const nextActiveId = signals.active?.id ?? null;
    const previous = previousActiveId.current;
    previousActiveId.current = nextActiveId;
    if (previous === undefined || !nextActiveId || nextActiveId === previous) return;
    setTreadmillBoost(true);
    const timeout = window.setTimeout(() => setTreadmillBoost(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [signals.active?.id]);

  return (
    <>
      <section className={`scout-hero runner-hero${treadmillBoost ? " is-runner-boost" : ""}`}>
        <div className="runner-treadmill" aria-hidden="true" />
        <div className="runner-market-grid" aria-hidden="true">
          <span className="runner-chart-line runner-chart-line--1" />
          <span className="runner-chart-line runner-chart-line--2" />
          <span className="runner-chart-line runner-chart-line--3" />
          <span className="runner-chart-line runner-chart-line--4" />
          <span className="runner-chart-line runner-chart-line--5" />
          <span className="runner-chart-line runner-chart-line--6" />
          <span className="runner-volume-bars" />
          <span className="runner-radar-sweep" />
        </div>
        <div className="runner-brand-masthead ri-brand-masthead">
          <img src="/brand/ri6900-emblem.jpg" alt="Runner Index 6900" />
          <div><span>RUNNER INDEX</span><strong>6900</strong><small>RI6900 // WEIGHTED HOLDER PROTOCOL</small></div>
        </div>
        <div className="scout-hero__copy">
          <div className="runner-hero__statusline">
            <StatusBadge label={state === "loading" ? "Index starting" : reconnecting ? "Index reconnecting" : "Index online"} />
            <span>{signals.active ? (signals.access === "premium" ? "REAL-TIME INDEX FEED" : `INDEX FEED · ${signals.publicDelaySeconds}S DELAY`) : state === "loading" ? "CONNECTING HOLDER LEDGER" : reconnecting ? "HOLDER LEDGER STATUS UNAVAILABLE" : "CONTINUOUS WEIGHT CALCULATION"}</span>
          </div>
          <p className="scout-eyebrow">RI6900 // CONTINUOUS HOLDER INDEX</p>
          <h1>Persistence,<br /><span>indexed.</span></h1>
          <p className="scout-hero__body">Runner Index 6900 converts verified hold time into measurable distribution weight. Eligible wallets holding {scoutPublicConfig.minimumHolding.toLocaleString()}+ $RI6900 advance from 1.00x to 25.00x while the protocol rebalances every five minutes. Sell once and eligibility is permanently forfeited.</p>
          <div className="runner-hero-mechanism" aria-label="RI6900 index mechanism">
            <span><small>Holder minimum</small><strong>{scoutPublicConfig.minimumHolding.toLocaleString()}+ $RI6900</strong></span>
            <span><small>Rebalance interval</small><strong>Every 5 minutes</strong></span>
            <span><small>Maximum weight</small><strong>25.00x at 1 month</strong></span>
          </div>
          <nav className="runner-hero-links" aria-label="RI6900 protocol links">
            <Link href="/runners">View index components <ArrowRight size={13} /></Link>
            <Link href="/terminal">Open live terminal <ArrowRight size={13} /></Link>
          </nav>
          <p className="scout-hero__delay"><Clock3 size={15} /> HOLD TIME BECOMES WEIGHT. WEIGHT BECOMES DISTRIBUTION.</p>
        </div>
        <div className="scout-hero__terminal runner-scanner-panel">
          <div className="scout-terminal-bar"><span><i /> RI6900 INDEX ENGINE {scannerStatus}</span><small>{lastUpdated ? `UPDATED ${formatClock(lastUpdated)}` : "INITIALIZING"}</small></div>
          <div className="runner-scanner-console" aria-label="RI6900 Index Engine">
            <div className="runner-scanner-console__head">
              <span>CALCULATING INDEX... <i className="runner-cursor" aria-hidden="true" /></span>
              <strong>{signals.active ? `${rankedSignals.length} VERIFIED COMPONENT${rankedSignals.length === 1 ? "" : "S"}` : "AWAITING FIRST COMPONENT"}</strong>
            </div>
            <div className="runner-scan-pipeline" aria-label="RI6900 indexing pipeline">
              <span>VERIFY</span><i>→</i><span>INDEX</span><i>→</i><span>WEIGHT</span><i>→</i><span>DISTRIBUTE</span>
            </div>
            <div className="runner-scanner-inputs" aria-label="Aggregator data inputs">
              {scannerInputs.map((input) => (
                <span className={input.connected ? "is-live" : "is-connecting"} key={input.label}>
                  <small>{input.label}</small><strong>{signals.active ? (input.connected ? "LIVE" : "UNAVAILABLE") : "AWAITING COMPONENT"}</strong>
                </span>
              ))}
            </div>
            <div className="runner-symbol-stream" aria-hidden="true">
              <div className="runner-symbol-stream__track">
                {signals.active
                  ? [...rankedSignals, ...rankedSignals].map((signal, index) => (
                      <span className={signal.id === signals.active?.id ? "is-active" : ""} key={`${signal.id}-${index}`}>${signal.symbol}</span>
                    ))
                  : [...idleStream, ...idleStream].map((message, index) => <span key={`${message}-${index}`}>{message}</span>)}
              </div>
            </div>
            <div className="runner-ranking-table">
              <div className="runner-ranking-table__head"><span>Rank</span><span>Component</span><span>Index weight</span><span>Status</span></div>
              {signals.active ? rankedSignals.slice(0, 4).map((signal, index) => {
                const score = signal.scout_score;
                const confidence = verifiedConfidence(signal);
                return (
                  <div className={signal.id === signals.active?.id ? "is-locked" : ""} key={signal.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>${signal.symbol}</strong>
                    <span className="runner-rank-score"><i><b style={{ width: `${score ?? 0}%` }} /></i><em>{score ?? "--"}</em></span>
                    <span>{confidence === null ? "VERIFIED" : `${confidence}%`}</span>
                  </div>
                );
              }) : (
                <div className="runner-ranking-empty">
                  <span>--</span><strong>NO INDEX COMPONENT</strong><span>--</span><span>CALCULATING</span>
                </div>
              )}
            </div>
            <div className={`runner-lock-panel ${signals.active ? "is-acquired" : "is-seeking"}`}>
              <span>{signals.active ? "COMPONENT ACTIVE" : "INDEX CALCULATING..."}</span>
              <strong>{signals.active ? activeSymbol : "NO COMPONENT ASSIGNED"}</strong>
              <small>{signals.active ? `VERIFIED · WEIGHT LOCKED · ${activeConfidence === null ? "INDEX LIVE" : `${activeConfidence}% SCORE`}` : "WAITING FOR VERIFIED COMPONENT AND HOLDER SNAPSHOT"}</small>
            </div>
            <div className="runner-scanner-metrics">
              <Metric label="Index Component" value={signals.active ? activeSymbol : "Not assigned"} detail={signals.active?.name} />
              <Metric label="Status" value={signals.active ? "Weight locked" : state === "loading" ? "Starting..." : reconnecting ? "Reconnecting..." : "Calculating"} />
              <Metric label="Eligible Rule" value="Never sold" />
              <Metric label={signals.active ? "Index Score" : "Next Rebalance"} value={signals.active ? (signals.active.scout_score === null ? "--" : `${signals.active.scout_score}/100`) : countdown.label} />
            </div>
          </div>
          {state === "loading" ? <div className="runner-terminal-state"><i /><strong>INDEXING</strong><span>CONNECTING RI6900 LEDGER</span></div> : null}
        </div>
        <div className="scout-live-strip">
          <Metric label="Components Recorded" value={signals.signals.length.toLocaleString()} detail="Verified index ledger" />
          <Metric label="Active Component" value={signals.active ? activeSymbol : "Calculating"} detail={signals.active?.name ?? "Index remains online"} />
          <Metric label="Average Weight" value={stats.averageMultiplier === null ? "—" : `${stats.averageMultiplier.toFixed(2)}x`} detail="Verified hold time" />
          <div className="runner-next-distribution"><Metric label="Next Rebalance" value={countdown.label} detail="Five-minute epoch" /></div>
        </div>
        <div className="runner-hero-tape" aria-label="Live RI6900 index tape">
          <div className="runner-hero-tape__track">
            {[...tapeItems, ...tapeItems, ...tapeItems, ...tapeItems].map((item, index) => (
              <span key={`${item.id}-${index}`}><i />{item.symbol}<strong>{item.score}</strong><em>{item.status}</em></span>
            ))}
          </div>
        </div>
      </section>

      <section className="scout-terminal-section" id="terminal">
        <div className="scout-section-heading scout-section-heading--inline">
          <div><span className="scout-kicker">RI6900 Index Board</span><h2>Every eligible wallet has a measurable weight.</h2></div>
          <p>Track verified components, continuous hold time, multiplier weight, and settled distributions from one institutional-grade ledger.</p>
        </div>
        <div className="scout-terminal-grid">
          <CurrentSignalPanel signal={signals.active} />
          <ScorePanel signal={signals.active} />
          <ActivityFeed />
          <HolderMultiplierPanel />
        </div>
      </section>
    </>
  );
}
