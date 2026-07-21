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
import { shortAddress } from "../../lib/scout-public";
import { formatMoney, formatPercent, formatTime, formatToken } from "./format";
import { useCountdown } from "./hooks";
import { ScoutActionLinks } from "./scout-shell";
import { useScout } from "./scout-provider";
import type { ScoutSignal } from "./types";
import { EmptyState, ErrorState, Metric, Skeleton, StatusBadge } from "./ui";

function numericMetric(signal: ScoutSignal, key: string) {
  const value = Number(signal.metrics?.[key]);
  return Number.isFinite(value) ? value : null;
}

function scoreFactors(signal: ScoutSignal) {
  const buys = numericMetric(signal, "buys1h");
  const sells = numericMetric(signal, "sells1h");
  const totalTrades = (buys ?? 0) + (sells ?? 0);
  const buyShare = totalTrades > 0 ? (buys ?? 0) / totalTrades : null;
  return [
    { label: "Liquidity", value: formatMoney(signal.liquidity_usd), connected: signal.liquidity_usd !== null },
    { label: "24h volume", value: formatMoney(signal.volume_24h_usd), connected: signal.volume_24h_usd !== null },
    { label: "1h price action", value: formatPercent(numericMetric(signal, "change1h")), connected: numericMetric(signal, "change1h") !== null },
    { label: "Recent buy share", value: buyShare === null ? "Unavailable" : formatPercent(buyShare * 100), connected: buyShare !== null },
    { label: "Holder growth", value: signal.holder_count === null ? "Adapter pending" : signal.holder_count.toLocaleString(), connected: signal.holder_count !== null },
    { label: "Social velocity", value: "Adapter pending", connected: false },
    { label: "Smart wallets", value: "Adapter pending", connected: false },
    { label: "Telegram velocity", value: "Adapter pending", connected: false }
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

const DAY_MS = 24 * 60 * 60 * 1000;
const MULTIPLIER_MILESTONES = [
  { afterMs: DAY_MS, multiplierBps: 12_500 },
  { afterMs: 3 * DAY_MS, multiplierBps: 15_000 },
  { afterMs: 7 * DAY_MS, multiplierBps: 20_000 }
];

function multiplierLabel(multiplierBps: number | null) {
  return multiplierBps ? `${(multiplierBps / 10_000).toFixed(2)}x` : "Indexing";
}

function milestoneLabel(eligibleSince: string | null, eligible: boolean) {
  if (!eligible) return { label: "Starts when eligible", progress: 0 };
  const sinceMs = Date.parse(eligibleSince ?? "");
  if (!Number.isFinite(sinceMs)) return { label: "Waiting for first cycle", progress: 0 };
  const heldMs = Math.max(0, Date.now() - sinceMs);
  const next = MULTIPLIER_MILESTONES.find((milestone) => heldMs < milestone.afterMs);
  if (!next) return { label: "2.00x maximum reached", progress: 100 };
  const remainingMs = next.afterMs - heldMs;
  const remaining = remainingMs < DAY_MS
    ? `${Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)))}h`
    : `${Math.max(1, Math.ceil(remainingMs / DAY_MS))}d`;
  return {
    label: `${remaining} to ${(next.multiplierBps / 10_000).toFixed(2)}x`,
    progress: Math.min(100, (heldMs / (7 * DAY_MS)) * 100)
  };
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
          <div><span className="scout-kicker">Current Runner</span><h2>Awaiting target</h2></div>
          <StatusBadge label="Monitoring" tone="queued" />
        </div>
        <EmptyState
          title="No active runner yet"
          body="Runner is online and ranking verified market signals. The strongest signal appears here when the scanner locks on."
        />
        <div className="scout-signal-placeholder" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </section>
    );
  }

  return (
    <section className="scout-panel scout-panel--signal">
      <div className="scout-panel__head">
        <SignalIdentity signal={signal} />
        <StatusBadge label="Target acquired" />
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
        <span><Radio size={15} /> Next scan cycle {countdown.label}</span>
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
        <EmptyState title="Factors pending" body="Score factors appear as soon as Runner locks onto a verified market signal." />
      )}
      <p className="scout-note">Runner ranks connected market data only. Any unavailable input stays clearly marked as pending.</p>
    </section>
  );
}

function ActivityFeed() {
  const { signals } = useScout();
  return (
    <section className="scout-panel scout-panel--feed">
      <div className="scout-panel__head">
        <div><span className="scout-kicker">Live tape</span><h2>Scanner feed</h2></div>
        <Activity size={21} aria-hidden="true" />
      </div>
      {signals.events.length ? (
        <div className="scout-event-list">
          {signals.events.slice(0, 8).map((event) => {
            const joined = Array.isArray(event.signal) ? event.signal[0] : event.signal;
            return (
              <div className="scout-event" key={event.id}>
                <span className="scout-event__rail" aria-hidden="true" />
                <div>
                  <strong>{event.event_type.replaceAll("_", " ")}</strong>
                  <p>{joined ? `$${joined.symbol} · ${shortAddress(joined.mint)}` : "Runner protocol"}</p>
                </div>
                <time>{formatTime(event.created_at)}</time>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Feed is listening" body="New detections, ranking changes, target locks, and public releases will appear here." />
      )}
    </section>
  );
}

export function WalletStatusPanel() {
  const { wallet, stats, clearAccess } = useScout();
  const countdown = useCountdown(stats.nextDropTime);

  if (!wallet) return null;

  const multiplier = multiplierLabel(wallet.multiplierBps);
  const milestone = milestoneLabel(wallet.eligibleSince, wallet.eligible);

  return (
    <section className="scout-panel scout-holder-status">
      <div className="scout-holder-status__head">
        <div><span className="scout-kicker">Holder Status</span><h2>{shortAddress(wallet.wallet, 7, 5)}</h2></div>
        <StatusBadge label={wallet.eligible ? "Eligible" : "Below threshold"} tone={wallet.eligible ? "live" : "muted"} />
        <button className="scout-wallet-status__disconnect" type="button" onClick={clearAccess}>Disconnect</button>
      </div>
      <div className="scout-holder-status__grid">
        <Metric label="Wallet Status" value="Connected" detail={shortAddress(wallet.wallet, 5, 4)} />
        <Metric label="Current Multiplier" value={multiplier} detail="Never-sold hold boost" />
        <Metric label="Holding Streak" value={`${wallet.currentStreak.toLocaleString()} cycles`} detail="Consecutive eligible cycles" />
        <Metric label="Current Distribution Weight" value={wallet.multiplierBps ? `${multiplier} base` : "Indexing"} detail="Multiplier applied each cycle" />
        <Metric label="Next Distribution" value={countdown.label} />
        <Metric label="Eligibility Status" value={wallet.eligible ? "Eligible" : "Below threshold"} detail={`${formatToken(wallet.sourceBalance, "RUNNER")} held`} />
      </div>
      <div className="scout-holder-milestone">
        <div><span>Eligible since</span><strong>{wallet.eligibleSince ? formatTime(wallet.eligibleSince) : "Not active"}</strong></div>
        <div><span>Next multiplier milestone</span><strong>{milestone.label}</strong></div>
        <i aria-label={`Multiplier milestone progress ${Math.round(milestone.progress)} percent`}><span style={{ width: `${milestone.progress}%` }} /></i>
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
  const { signals, stats, state, error, refresh, lastUpdated } = useScout();
  const [treadmillBoost, setTreadmillBoost] = useState(false);
  const previousActiveId = useRef<string | null | undefined>(undefined);
  const countdown = useCountdown(stats.nextDropTime);
  const activeSymbol = signals.active ? `$${signals.active.symbol}` : "AWAITING";
  const rankedSignals = [...signals.signals]
    .sort((left, right) => (right.scout_score ?? -1) - (left.scout_score ?? -1))
    .slice(0, 6);
  const activeConfidence = confidenceScore(signals.active);
  const scannerQueue = rankedSignals.length ? rankedSignals : Array.from({ length: 6 }, () => null);
  const tapeItems = [
    ...rankedSignals.map((signal) => ({
      id: signal.id,
      symbol: `$${signal.symbol}`,
      score: signal.scout_score === null ? "INDEXING" : `${signal.scout_score}/100`,
      status: signal.id === signals.active?.id ? "TARGET LOCKED" : signal.status.toUpperCase()
    })),
    { id: "cycle", symbol: "NEXT MARKET UPDATE", score: countdown.label, status: `CYCLE ${stats.currentEpoch}` },
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
          <p className="scout-eyebrow">Live momentum. Updated every five minutes.</p>
          <h1>Never miss a<br /><span>runner again.</span></h1>
          <p className="scout-hero__body">Runner continuously scans, ranks, and locks onto the market's strongest momentum signal—so you can own the runner instead of chasing it.</p>
          <ScoutActionLinks />
          <p className="scout-hero__delay"><Clock3 size={15} /> THE MARKET NEVER STOPS. NEITHER DO WE.</p>
        </div>
        <div className="scout-hero__terminal runner-scanner-panel">
          <div className="scout-terminal-bar"><span><i /> MOMENTUM SCANNER ONLINE</span><small>{lastUpdated ? `UPDATED ${formatTime(lastUpdated.toISOString())}` : "CONNECTING"}</small></div>
          <div className="runner-scanner-console" aria-label="Momentum Scanner">
            <div className="runner-scanner-console__head">
              <span>SCANNING MARKET <i className="runner-cursor" aria-hidden="true" /></span>
              <strong>{rankedSignals.length ? `${rankedSignals.length} SIGNALS RANKED` : "INDEXING"}</strong>
            </div>
            <div className="runner-scan-pipeline" aria-label="Scanner pipeline">
              <span>DISCOVER</span><i>→</i><span>SCORE</span><i>→</i><span>RANK</span><i>→</i><span>LOCK</span>
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
              <small>{signals.active ? `LOCKED · ${activeConfidence ?? 0}% CONFIDENCE` : "AWAITING VERIFIED SIGNAL"}</small>
            </div>
            <div className="runner-scanner-metrics">
              <Metric label="Current Runner" value={activeSymbol} detail={signals.active?.name} />
              <Metric label="Momentum" value={signals.active?.scout_score === null || signals.active?.scout_score === undefined ? "Scanning" : `${signals.active.scout_score}/100`} />
              <Metric label="Scan Cycle" value={`#${stats.currentEpoch.toLocaleString()}`} />
              <Metric label="Next Update" value={countdown.label} />
            </div>
          </div>
          {state === "loading" ? <Skeleton rows={2} /> : state === "error" && error ? <ErrorState message={error} retry={() => void refresh()} /> : null}
          {state === "stale" && error ? <p className="scout-stale-note">Live refresh delayed. Showing the last verified data.</p> : null}
        </div>
        <div className="scout-live-strip">
          <Metric label="Signals Ranked" value={signals.signals.length.toLocaleString()} detail="Live market set" />
          <Metric label="Current Runner" value={activeSymbol} detail={signals.active?.name ?? "Scanner seeking target"} />
          <Metric label="Momentum Score" value={signals.active?.scout_score === null || signals.active?.scout_score === undefined ? "Scanning" : `${signals.active.scout_score}/100`} detail="Strongest verified signal" />
          <div className="runner-next-distribution"><Metric label="Next Market Update" value={countdown.label} detail="Five-minute cycle" /></div>
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
          <div><span className="scout-kicker">Runner Terminal</span><h2>Own the runner. Don't chase it.</h2></div>
          <p>The scanner leads. Holder rewards strengthen long-term access and distribution weight.</p>
        </div>
        <div className="scout-terminal-grid">
          <WalletStatusPanel />
          <CurrentSignalPanel signal={signals.active} />
          <ScorePanel signal={signals.active} />
          <ActivityFeed />
          <HolderMultiplierPanel />
        </div>
      </section>
    </>
  );
}
