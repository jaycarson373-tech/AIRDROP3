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
    { label: "Volume velocity", value: volumeVelocity === null ? "Indexing" : `${volumeVelocity.toFixed(2)}x`, connected: volumeVelocity !== null },
    { label: "Recent buy pressure", value: buyShare === null ? "Indexing" : formatPercent(buyShare * 100), connected: buyShare !== null },
    { label: "Market attention", value: attention === null ? "Feed connecting" : `${attention}/100`, connected: attention !== null },
    { label: "Smart-wallet activity", value: smartWallets === null ? "Feed connecting" : `${smartWallets}/100`, connected: smartWallets !== null },
    { label: "AI narrative", value: narrative === null ? "Feed connecting" : `${narrative}/100`, connected: narrative !== null },
    { label: "1h price action", value: formatPercent(numericMetric(signal, "change1h")), connected: numericMetric(signal, "change1h") !== null }
  ];
}

function confidenceScore(signal: ScoutSignal | null) {
  if (!signal) return null;
  const connected = [
    signal.scout_score,
    signal.price_usd,
    signal.market_cap_usd,
    signal.liquidity_usd,
    signal.volume_24h_usd,
    signal.holder_count
  ].filter((value) => value !== null && value !== undefined).length;
  return Math.round((connected / 6) * 100);
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
  const { stats } = useScout();
  const countdown = useCountdown(stats.nextDropTime);

  if (!signal) {
    return (
      <section className="scout-panel scout-panel--signal scout-panel--empty">
        <div className="scout-panel__head">
          <div><span className="scout-kicker">Current Runner</span><h2>NO VERIFIED TARGET</h2></div>
          <StatusBadge label="Scanner online" tone="queued" />
        </div>
        <div className="runner-no-target" role="status">
          <span><time>{formatClock(new Date())}</time><strong>ONLINE</strong><em>SCANNER REMAINS ONLINE</em></span>
          <span><time>{formatClock(new Date())}</time><strong>INDEXING</strong><em>RANKING VERIFIED MARKET INPUTS</em></span>
          <span><time>{formatClock(new Date())}</time><strong>SEEKING TARGET</strong><em>WAITING FOR AUTHENTICATED MOMENTUM SIGNAL</em></span>
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
          <strong>{signal.scout_score === null ? "Indexing" : signal.scout_score}</strong>
          {signal.scout_score !== null ? <small>/100</small> : null}
        </div>
        <div className="scout-score-track" aria-label={`Momentum score ${signal.scout_score ?? 0} out of 100`}>
          <i style={{ width: `${signal.scout_score ?? 0}%` }} />
        </div>
      </div>

      <div className="scout-metric-grid scout-metric-grid--four">
        <Metric label="Price" value={signal.price_usd ? `$${signal.price_usd.toPrecision(5)}` : "Indexing"} />
        <Metric label="Market cap" value={formatMoney(signal.market_cap_usd)} />
        <Metric label="Liquidity" value={formatMoney(signal.liquidity_usd)} />
        <Metric label="24h volume" value={formatMoney(signal.volume_24h_usd)} />
      </div>

      <div className="scout-signal-reason">
        <Terminal size={17} aria-hidden="true" />
        <div>
          <span className="scout-label">Selection logic</span>
          <p>{signal.selection_reason || signal.reasons[0] || "Live market factors are being indexed."}</p>
        </div>
      </div>

      <div className="scout-panel__footer">
        <span><Clock3 size={15} /> Selected {formatTime(signal.selected_at ?? signal.detected_at)}</span>
        <span><Radio size={15} /> Next Runner airdrop {countdown.label}</span>
        <a href={`https://dexscreener.com/solana/${signal.mint}`} target="_blank" rel="noreferrer">
          Open chart <ExternalLink size={14} />
        </a>
      </div>
    </section>
  );
}

function ScorePanel({ signal }: { signal: ScoutSignal | null }) {
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
        <div className="runner-factor-states" role="status">
          {["VOLUME", "BUY PRESSURE", "MARKET ATTENTION", "SMART WALLETS", "AI NARRATIVE"].map((label, index) => (
            <span key={label}><small>{label}</small><strong>{index < 2 ? "INDEXING" : "CONNECTING"}</strong></span>
          ))}
        </div>
      )}
      <p className="scout-note">Volume and market activity are live. Smart-wallet and AI narrative feeds remain clearly marked until connected.</p>
    </section>
  );
}

export function ActivityFeed() {
  const { signals, stats, lastUpdated } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const updatedAt = lastUpdated ?? new Date();
  const liveLines = [
    { time: formatClock(updatedAt), status: "LIVE", output: "SCANNER ONLINE" },
    { time: formatClock(updatedAt), status: "CONNECTED", output: "NETWORK SOLANA" },
    ...signals.signals.slice(0, 5).flatMap((signal) => [
      { time: formatClock(signal.updated_at), status: "SCANNING", output: `$${signal.symbol}` },
      { time: formatClock(signal.updated_at), status: "MOMENTUM", output: signal.scout_score === null ? "INDEXING" : `${signal.scout_score}/100` }
    ]),
    ...(signals.active ? [
      { time: formatClock(signals.active.updated_at), status: "SIGNAL VERIFIED", output: `$${signals.active.symbol}` },
      { time: formatClock(signals.active.selected_at ?? signals.active.updated_at), status: "LOCKED", output: `TARGET $${signals.active.symbol}` }
    ] : [
      { time: formatClock(updatedAt), status: "SEEKING TARGET", output: "NO VERIFIED SIGNAL" }
    ]),
    { time: formatClock(updatedAt), status: "NEXT AIRDROP", output: countdown.label }
  ];
  const eventLines = signals.events.slice(0, 5).map((event) => {
    const joined = Array.isArray(event.signal) ? event.signal[0] : event.signal;
    return {
      time: formatClock(event.created_at),
      status: event.event_type.replaceAll("_", " ").toUpperCase(),
      output: joined ? `$${joined.symbol}` : "RUNNER PROTOCOL"
    };
  });
  const lines = [...liveLines, ...eventLines].slice(0, 16);
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
        <div><span className="scout-kicker">Holder Multiplier</span><h2>Hold longer. Increase your weight.</h2></div>
        <span className="runner-average-multiplier">AVG {stats.averageMultiplier === null ? "—" : `${stats.averageMultiplier.toFixed(2)}x`}</span>
      </div>
      <div className="runner-multiplier-tiers" aria-label="Runner multiplier milestones">
        <span><small>START</small><strong>1.00x</strong></span>
        <span><small>1 DAY</small><strong>1.25x</strong></span>
        <span><small>3 DAYS</small><strong>1.50x</strong></span>
        <span><small>7 DAYS</small><strong>2.00x</strong></span>
      </div>
      <div className="runner-multiplier-flow" aria-label="How the Holder Multiplier works">
        <span>Hold longer</span><i>→</i><span>Multiplier increases</span><i>→</i><span>Distribution weight grows</span><i>→</i><span>Receive larger distributions</span>
      </div>
      <p className="scout-note">Every consecutive eligible cycle builds the streak. Any balance decrease resets the hold multiplier to 1.00x. The multiplier scales distribution weight at each five-minute cycle.</p>
      <Link className="scout-text-link" href="/docs#access">View multiplier rules <ArrowRight size={15} /></Link>
    </section>
  );
}

export function ScoutTerminalView() {
  const { signals, stats, state, lastUpdated } = useScout();
  const [treadmillBoost, setTreadmillBoost] = useState(false);
  const previousActiveId = useRef<string | null | undefined>(undefined);
  const countdown = useCountdown(stats.nextDropTime);
  const activeSymbol = signals.active ? `$${signals.active.symbol}` : "AWAITING";
  const rankedSignals = [...signals.signals]
    .sort((left, right) => (right.scout_score ?? -1) - (left.scout_score ?? -1))
    .slice(0, 6);
  const activeConfidence = confidenceScore(signals.active);
  const scannerInputs = [
    { label: "Volume", connected: signals.active?.volume_24h_usd !== null && signals.active?.volume_24h_usd !== undefined },
    { label: "Attention", connected: signals.active ? firstNumericMetric(signals.active, ["attentionScore", "attention_score"]) !== null : false },
    { label: "Smart Wallets", connected: signals.active ? firstNumericMetric(signals.active, ["smartWalletScore", "smart_wallet_score"]) !== null : false },
    { label: "AI Narrative", connected: signals.active ? firstNumericMetric(signals.active, ["narrativeScore", "narrative_score"]) !== null : false }
  ];
  const connectedInputCount = scannerInputs.filter((input) => input.connected).length;
  const scannerQueue = rankedSignals.length ? rankedSignals : Array.from({ length: 6 }, () => null);
  const tapeItems = [
    ...rankedSignals.map((signal) => ({
      id: signal.id,
      symbol: `$${signal.symbol}`,
      score: signal.scout_score === null ? "INDEXING" : `${signal.scout_score}/100`,
      status: signal.id === signals.active?.id ? "TARGET LOCKED" : signal.status.toUpperCase()
    })),
    { id: "cycle", symbol: "NEXT RUNNER AIRDROP", score: countdown.label, status: `CYCLE ${stats.currentEpoch}` },
    { id: "scanner", symbol: "RUNNER", score: signals.access === "premium" ? "REAL TIME" : `${signals.publicDelaySeconds}S DELAY`, status: "SCANNING" }
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
            <StatusBadge label="Scanner online" />
            <span>{signals.access === "premium" ? "REAL-TIME FEED" : `PUBLIC FEED · ${signals.publicDelaySeconds}S DELAY`}</span>
          </div>
          <p className="scout-eyebrow">Custom aggregator · Five-minute Runner airdrops</p>
          <h1>Never miss a<br /><span>runner again.</span></h1>
          <p className="scout-hero__body">Every five minutes, Runner's custom aggregator scans market activity, ranks the strongest momentum signal, and airdrops that runner to eligible holders.</p>
          <p className="scout-hero__delay"><Clock3 size={15} /> THE MARKET NEVER STOPS. NEITHER DO WE.</p>
        </div>
        <div className="scout-hero__terminal runner-scanner-panel">
          <div className="scout-terminal-bar"><span><i /> MOMENTUM SCANNER ONLINE</span><small>{lastUpdated ? `UPDATED ${formatClock(lastUpdated)}` : "INDEXING"}</small></div>
          <div className="runner-scanner-console" aria-label="Momentum Scanner">
            <div className="runner-scanner-console__head">
              <span>SCANNING MARKET <i className="runner-cursor" aria-hidden="true" /></span>
              <strong>{rankedSignals.length ? `${rankedSignals.length} SIGNALS RANKED` : "INDEXING"}</strong>
            </div>
            <div className="runner-scan-pipeline" aria-label="Scanner pipeline">
              <span>DISCOVER</span><i>→</i><span>SCORE</span><i>→</i><span>RANK</span><i>→</i><span>LOCK</span>
            </div>
            <div className="runner-scanner-inputs" aria-label="Aggregator data inputs">
              {scannerInputs.map((input) => (
                <span className={input.connected ? "is-live" : "is-connecting"} key={input.label}>
                  <small>{input.label}</small><strong>{input.connected ? "LIVE" : "CONNECTING"}</strong>
                </span>
              ))}
            </div>
            <div className="runner-symbol-stream" aria-hidden="true">
              <div className="runner-symbol-stream__track">
                {[...scannerQueue, ...scannerQueue].map((signal, index) => (
                  <span className={signal?.id === signals.active?.id ? "is-active" : ""} key={`${signal?.id ?? "indexing"}-${index}`}>
                    {signal ? `$${signal.symbol}` : "INDEXING"}
                  </span>
                ))}
              </div>
            </div>
            <div className="runner-ranking-table">
              <div className="runner-ranking-table__head"><span>Rank</span><span>Signal</span><span>Momentum</span><span>Confidence</span></div>
              {(rankedSignals.length ? rankedSignals : Array.from({ length: 4 }, () => null)).slice(0, 4).map((signal, index) => {
                const score = signal?.scout_score ?? null;
                const confidence = confidenceScore(signal);
                return (
                  <div className={signal?.id === signals.active?.id ? "is-locked" : ""} key={signal?.id ?? `rank-${index}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{signal ? `$${signal.symbol}` : "—"}</strong>
                    <span className="runner-rank-score"><i><b style={{ width: `${score ?? 0}%` }} /></i><em>{score ?? "…"}</em></span>
                    <span>{confidence === null ? "INDEXING" : `${confidence}%`}</span>
                  </div>
                );
              })}
            </div>
            <div className={`runner-lock-panel ${signals.active ? "is-acquired" : "is-seeking"}`}>
              <span>{signals.active ? "TARGET ACQUIRED" : "SEEKING TARGET"}</span>
              <strong>{activeSymbol}</strong>
              <small>{signals.active ? `AUTHENTICATED · SIGNAL VERIFIED · ${activeConfidence ?? 0}% CONFIDENCE` : "NO VERIFIED SIGNAL"}</small>
            </div>
            <div className="runner-scanner-metrics">
              <Metric label="Current Runner" value={activeSymbol} detail={signals.active?.name} />
              <Metric label="Momentum" value={signals.active?.scout_score === null || signals.active?.scout_score === undefined ? "Scanning" : `${signals.active.scout_score}/100`} />
              <Metric label="Scan Cycle" value={`#${stats.currentEpoch.toLocaleString()}`} />
              <Metric label="Next Airdrop" value={countdown.label} />
            </div>
          </div>
          {state === "loading" ? <div className="runner-terminal-state"><i /><strong>INDEXING</strong><span>CONNECTING MARKET FEEDS</span></div> : null}
        </div>
        <div className="scout-live-strip">
          <Metric label="Scanner Inputs" value={`${connectedInputCount}/4 live`} detail="Volume · Attention · Wallets · AI" />
          <Metric label="Current Runner" value={activeSymbol} detail={signals.active?.name ?? "Scanner seeking target"} />
          <Metric label="Momentum Score" value={signals.active?.scout_score === null || signals.active?.scout_score === undefined ? "Scanning" : `${signals.active.scout_score}/100`} detail="Strongest verified signal" />
          <div className="runner-next-distribution"><Metric label="Next Runner Airdrop" value={countdown.label} detail="Five-minute cycle" /></div>
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
