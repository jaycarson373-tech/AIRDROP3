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
import { formatClock, formatMoney, formatPercent, formatTime } from "./format";
import { useCountdown } from "./hooks";
import { useScout } from "./scout-provider";
import type { ScoutSignal } from "./types";
import { Metric, StatusBadge } from "./ui";

function numericMetric(signal: ScoutSignal, key: string) {
  const value = Number(signal.metrics?.[key]);
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
    { label: "AI narrative", value: narrative === null ? "Unavailable" : `${narrative}/100`, connected: narrative !== null },
    { label: "1h price action", value: formatPercent(numericMetric(signal, "change1h")), connected: numericMetric(signal, "change1h") !== null }
  ];
}

function verifiedConfidence(signal: ScoutSignal | null) {
  if (!signal) return null;
  const value = firstNumericMetric(signal, ["confidence", "confidenceScore", "confidence_score"]);
  return value === null ? null : Math.max(0, Math.min(100, value));
}

function formatTokenAge(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return "Unavailable";
  if (seconds < 60 * 60) return `${Math.max(1, Math.floor(seconds / 60))}m`;
  if (seconds < 24 * 60 * 60) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function SignalIdentity({ signal }: { signal: ScoutSignal }) {
  return (
    <div className="scout-signal-identity">
      <span className="scout-token-mark" aria-hidden="true">{signal.symbol.slice(0, 2).toUpperCase()}</span>
      <div>
        <span className="scout-label">Current Runner</span>
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
  const idleStatus = state === "loading" ? "Starting..." : reconnecting ? "Reconnecting..." : "Scanning...";

  if (!signal) {
    return (
      <section className="scout-panel scout-panel--signal scout-panel--empty">
        <div className="scout-panel__head">
          <div><span className="scout-kicker">Current Runner</span><h2>NO VERIFIED TARGET</h2></div>
          <StatusBadge label={state === "loading" ? "Starting" : reconnecting ? "Reconnecting" : "Scanner online"} tone="queued" />
        </div>
        <div className="scout-metric-grid scout-metric-grid--four runner-idle-metrics" role="status">
          <Metric label="Current Runner" value="No verified target" />
          <Metric label="Status" value={idleStatus} />
          <Metric label="Confidence" value="Awaiting first scan" />
          <Metric label="Momentum" value="Awaiting authenticated signal" />
          <Metric label="Liquidity" value="Unavailable" />
          <Metric label="24h Volume" value="Unavailable" />
          <Metric label="Token Age" value="Awaiting target" />
          <Metric label="Current Score" value="--" />
        </div>
        <div className="runner-no-target-copy">
          <strong>No verified runner yet.</strong>
          <p>Runner continuously scans the market. The first authenticated momentum signal will appear here.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="scout-panel scout-panel--signal">
      <div className="scout-panel__head">
        <SignalIdentity signal={signal} />
        <StatusBadge label="Signal verified" />
      </div>

      <div className="scout-signal-score">
        <div>
          <span className="scout-label">Momentum</span>
          <strong>{signal.scout_score === null ? "--" : signal.scout_score}</strong>
          {signal.scout_score !== null ? <small>/100</small> : null}
        </div>
        <div className="scout-score-track" aria-label={signal.scout_score === null ? "Momentum score unavailable" : `Momentum score ${signal.scout_score} out of 100`}>
          <i style={{ width: `${signal.scout_score ?? 0}%` }} />
        </div>
      </div>

      <div className="scout-metric-grid scout-metric-grid--four">
        <Metric label="Price" value={signal.price_usd === null ? "Unavailable" : `$${signal.price_usd.toPrecision(5)}`} />
        <Metric label="Market cap" value={formatMoney(signal.market_cap_usd)} />
        <Metric label="Liquidity" value={formatMoney(signal.liquidity_usd)} />
        <Metric label="24h volume" value={formatMoney(signal.volume_24h_usd)} />
        <Metric label="Token age" value={formatTokenAge(signal.token_age_seconds)} />
        <Metric label="Confidence" value={verifiedConfidence(signal) === null ? "Unavailable" : `${verifiedConfidence(signal)}%`} />
        <Metric label="Current score" value={signal.scout_score === null ? "--" : `${signal.scout_score}/100`} />
        <Metric label="Status" value="Signal verified" />
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
        <span><Radio size={15} /> Next Runner airdrop {countdown.label}</span>
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
        <div><span className="scout-kicker">Momentum Scanner</span><h2>Signal factors</h2></div>
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
      <p className="scout-note">Runner publishes factor values only after the underlying data and selected target are verified.</p>
    </section>
  );
}

export function ActivityFeed() {
  const { signals, stats, state, lastUpdated } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const updatedAt = lastUpdated ?? new Date();
  const idleLines = state === "loading"
    ? [
        { time: formatClock(updatedAt), status: "SCANNER", output: "STARTING" },
        { time: formatClock(updatedAt), status: "MARKET FEED", output: "CONNECTING" },
        { time: formatClock(updatedAt), status: "INDEXING", output: "INITIALIZING" },
        { time: formatClock(updatedAt), status: "TARGET", output: "NO VERIFIED SIGNAL" }
      ]
    : state === "error" || state === "stale"
    ? [
        { time: formatClock(updatedAt), status: "SCANNER", output: "RECONNECTING" },
        { time: formatClock(updatedAt), status: "MARKET FEED", output: "STATUS UNAVAILABLE" },
        { time: formatClock(updatedAt), status: "TARGET", output: "NO VERIFIED SIGNAL" },
        { time: formatClock(updatedAt), status: "NEXT SCAN", output: countdown.label }
      ]
    : [
        { time: formatClock(updatedAt), status: "SCANNER", output: "ONLINE" },
        { time: formatClock(updatedAt), status: "MARKET FEED", output: "CONNECTED" },
        { time: formatClock(updatedAt), status: "INDEXING", output: "MARKET" },
        { time: formatClock(updatedAt), status: "AWAITING", output: "VERIFIED SIGNAL" },
        { time: formatClock(updatedAt), status: "NEXT SCAN", output: countdown.label }
      ];
  const activeLines = signals.active ? [
    { time: formatClock(signals.active.updated_at), status: "SCANNER", output: "ONLINE" },
    { time: formatClock(signals.active.updated_at), status: "SIGNAL VERIFIED", output: `$${signals.active.symbol}` },
    ...(signals.active.selected_at ? [
      { time: formatClock(signals.active.selected_at), status: "TARGET LOCKED", output: `$${signals.active.symbol}` }
    ] : []),
    ...(verifiedConfidence(signals.active) === null ? [] : [
      { time: formatClock(signals.active.updated_at), status: "CONFIDENCE", output: `${verifiedConfidence(signals.active)}%` }
    ]),
    { time: formatClock(updatedAt), status: "NEXT AIRDROP", output: countdown.label }
  ] : [];
  const eventLines = signals.events.slice(0, 5).map((event) => {
    const joined = Array.isArray(event.signal) ? event.signal[0] : event.signal;
    return {
      time: formatClock(event.created_at),
      status: event.event_type.replaceAll("_", " ").toUpperCase(),
      output: joined ? `$${joined.symbol}` : "RUNNER PROTOCOL"
    };
  });
  const lines = signals.active ? [...activeLines, ...eventLines].slice(0, 16) : idleLines;
  return (
    <section className="scout-panel scout-panel--feed">
      <div className="scout-panel__head">
        <div><span className="scout-kicker">Live tape</span><h2>Scanner feed</h2></div>
        <Activity size={21} aria-hidden="true" />
      </div>
      <div className="runner-terminal-log" aria-label="Live market scanner log">
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
        <div><span className="scout-kicker">Holder Multiplier</span><h2>Hold longer. Scale to 10x.</h2></div>
        <span className="runner-average-multiplier">AVG {stats.averageMultiplier === null ? "—" : `${stats.averageMultiplier.toFixed(2)}x`}</span>
      </div>
      <div className="runner-multiplier-tiers" aria-label="Runner multiplier milestones">
        <span><small>START</small><strong>1.00x</strong></span>
        <span><small>1 DAY</small><strong>1.50x</strong></span>
        <span><small>3 DAYS</small><strong>2.00x</strong></span>
        <span><small>7 DAYS</small><strong>5.00x</strong></span>
        <span><small>30 DAYS</small><strong>10.00x</strong></span>
      </div>
      <div className="runner-multiplier-flow" aria-label="How the Holder Multiplier works">
        <span>Hold longer</span><i>→</i><span>Multiplier increases</span><i>→</i><span>Distribution weight grows</span><i>→</i><span>Receive larger distributions</span>
      </div>
      <p className="scout-note">Continuous holding reaches 1.50x after one day, 2.00x after three days, 5.00x after seven days, and 10.00x after 30 days. Any balance decrease resets the hold multiplier to 1.00x. The multiplier scales distribution weight at each five-minute cycle.</p>
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
  const activeSymbol = signals.active ? `$${signals.active.symbol}` : "NO VERIFIED TARGET";
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
    { label: "AI Narrative", connected: signals.active ? firstNumericMetric(signals.active, ["narrativeScore", "narrative_score"]) !== null : false }
  ];
  const connectedInputCount = scannerInputs.filter((input) => input.connected).length;
  const idleStream = ["SEARCHING...", "WATCHING LIVE MARKET FEED...", "AWAITING VERIFIED SIGNAL...", "NO AUTHENTICATED RUNNER DETECTED."];
  const tapeItems = signals.active
    ? [
        ...rankedSignals.map((signal) => ({
          id: signal.id,
          symbol: `$${signal.symbol}`,
          score: signal.scout_score === null ? "SCORE UNAVAILABLE" : `${signal.scout_score}/100`,
          status: signal.id === signals.active?.id ? "TARGET LOCKED" : signal.status.toUpperCase()
        })),
        { id: "cycle", symbol: "NEXT RUNNER AIRDROP", score: countdown.label, status: stats.currentEpoch > 0 ? `CYCLE ${stats.currentEpoch}` : "CYCLE UNAVAILABLE" },
        { id: "scanner", symbol: "RUNNER", score: signals.access === "premium" ? "REAL TIME" : `${signals.publicDelaySeconds}S DELAY`, status: "SCANNING" }
      ]
    : [
        { id: "scanner", symbol: "SCANNER", score: scannerStatus, status: state === "loading" ? "INITIALIZING" : reconnecting ? "RECONNECTING" : "SCANNING MARKET" },
        { id: "feed", symbol: "MARKET FEED", score: state === "loading" ? "CONNECTING" : reconnecting ? "STATUS UNAVAILABLE" : "CONNECTED", status: "INDEXING" },
        { id: "target", symbol: "CURRENT RUNNER", score: "NO VERIFIED TARGET", status: "SEARCHING" },
        { id: "scan", symbol: "NEXT SCAN", score: countdown.label, status: "SCHEDULED" }
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
        <div className="runner-brand-masthead"><img src="/brand/runner-banner.jpg" alt="Runner" /></div>
        <div className="scout-hero__copy">
          <div className="runner-hero__statusline">
            <StatusBadge label={state === "loading" ? "Scanner starting" : reconnecting ? "Scanner reconnecting" : "Scanner online"} />
            <span>{signals.active ? (signals.access === "premium" ? "REAL-TIME VERIFIED FEED" : `VERIFIED FEED · ${signals.publicDelaySeconds}S DELAY`) : state === "loading" ? "CONNECTING MARKET FEED" : reconnecting ? "MARKET FEED STATUS UNAVAILABLE" : "WATCHING LIVE MARKET FEED"}</span>
          </div>
          <p className="scout-eyebrow">Custom aggregator · Five-minute Runner airdrops</p>
          <h1>Never miss a<br /><span>runner again.</span></h1>
          <p className="scout-hero__body">Every five minutes, Runner's custom aggregator scans market activity, ranks the strongest momentum signal, and airdrops that runner to eligible holders.</p>
          <p className="scout-hero__delay"><Clock3 size={15} /> THE MARKET NEVER STOPS. NEITHER DO WE.</p>
        </div>
        <div className="scout-hero__terminal runner-scanner-panel">
          <div className="scout-terminal-bar"><span><i /> MOMENTUM SCANNER {scannerStatus}</span><small>{lastUpdated ? `UPDATED ${formatClock(lastUpdated)}` : "INITIALIZING"}</small></div>
          <div className="runner-scanner-console" aria-label="Momentum Scanner">
            <div className="runner-scanner-console__head">
              <span>SCANNING MARKET... <i className="runner-cursor" aria-hidden="true" /></span>
              <strong>{signals.active ? `${rankedSignals.length} VERIFIED SIGNAL${rankedSignals.length === 1 ? "" : "S"}` : "NO VERIFIED RUNNER"}</strong>
            </div>
            <div className="runner-scan-pipeline" aria-label="Scanner pipeline">
              <span>DISCOVER</span><i>→</i><span>SCORE</span><i>→</i><span>RANK</span><i>→</i><span>LOCK</span>
            </div>
            <div className="runner-scanner-inputs" aria-label="Aggregator data inputs">
              {scannerInputs.map((input) => (
                <span className={input.connected ? "is-live" : "is-connecting"} key={input.label}>
                  <small>{input.label}</small><strong>{signals.active ? (input.connected ? "LIVE" : "UNAVAILABLE") : "AWAITING TARGET"}</strong>
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
              <div className="runner-ranking-table__head"><span>Rank</span><span>Signal</span><span>Momentum</span><span>Confidence</span></div>
              {signals.active ? rankedSignals.slice(0, 4).map((signal, index) => {
                const score = signal.scout_score;
                const confidence = verifiedConfidence(signal);
                return (
                  <div className={signal.id === signals.active?.id ? "is-locked" : ""} key={signal.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>${signal.symbol}</strong>
                    <span className="runner-rank-score"><i><b style={{ width: `${score ?? 0}%` }} /></i><em>{score ?? "--"}</em></span>
                    <span>{confidence === null ? "UNAVAILABLE" : `${confidence}%`}</span>
                  </div>
                );
              }) : (
                <div className="runner-ranking-empty">
                  <span>--</span><strong>NO VERIFIED TARGET</strong><span>--</span><span>AWAITING FIRST SCAN</span>
                </div>
              )}
            </div>
            <div className={`runner-lock-panel ${signals.active ? "is-acquired" : "is-seeking"}`}>
              <span>{signals.active ? "TARGET ACQUIRED" : "SEARCHING..."}</span>
              <strong>{signals.active ? activeSymbol : "NO MOMENTUM LEADER DETECTED"}</strong>
              <small>{signals.active ? `AUTHENTICATED · SIGNAL VERIFIED · ${activeConfidence === null ? "CONFIDENCE UNAVAILABLE" : `${activeConfidence}% CONFIDENCE`}` : "WAITING FOR SUFFICIENT CONFIDENCE"}</small>
            </div>
            <div className="runner-scanner-metrics">
              <Metric label="Current Runner" value={signals.active ? activeSymbol : "No verified target"} detail={signals.active?.name} />
              <Metric label="Status" value={signals.active ? "Signal verified" : state === "loading" ? "Starting..." : reconnecting ? "Reconnecting..." : "Scanning..."} />
              <Metric label="Confidence" value={signals.active ? (activeConfidence === null ? "Unavailable" : `${activeConfidence}%`) : "Awaiting first scan"} />
              <Metric label={signals.active ? "Current Score" : "Next Scan"} value={signals.active ? (signals.active.scout_score === null ? "--" : `${signals.active.scout_score}/100`) : countdown.label} />
            </div>
          </div>
          {state === "loading" ? <div className="runner-terminal-state"><i /><strong>INDEXING</strong><span>CONNECTING MARKET FEEDS</span></div> : null}
        </div>
        <div className="scout-live-strip">
          <Metric label="Scanner Inputs" value={signals.active ? `${connectedInputCount}/4 verified` : "Awaiting target"} detail="Volume · Attention · Wallets · AI" />
          <Metric label="Current Runner" value={signals.active ? activeSymbol : "No verified target"} detail={signals.active?.name ?? "Scanner remains online"} />
          <Metric label="Momentum" value={signals.active?.scout_score === null || signals.active?.scout_score === undefined ? "Awaiting authenticated signal" : `${signals.active.scout_score}/100`} detail={signals.active ? "Verified signal" : "No score published"} />
          <div className="runner-next-distribution"><Metric label={signals.active ? "Next Runner Airdrop" : "Next Scan"} value={countdown.label} detail="Five-minute cycle" /></div>
        </div>
        <div className="runner-hero-tape" aria-label="Live Runner market tape">
          <div className="runner-hero-tape__track">
            {[...tapeItems, ...tapeItems, ...tapeItems, ...tapeItems].map((item, index) => (
              <span key={`${item.id}-${index}`}><i />{item.symbol}<strong>{item.score}</strong><em>{item.status}</em></span>
            ))}
          </div>
        </div>
      </section>

      <section className="scout-terminal-section" id="terminal">
        <div className="scout-section-heading scout-section-heading--inline">
          <div><span className="scout-kicker">Runner Terminal</span><h2>Scan. Rank. Lock. Airdrop.</h2></div>
          <p>The custom aggregator finds the strongest runner and moves it into the next five-minute distribution cycle.</p>
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
