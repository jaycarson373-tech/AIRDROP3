"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Gauge,
  Radio,
  Terminal
} from "lucide-react";
import { scoutPublicConfig, shortAddress } from "../../lib/scout-public";
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
          body="Runner is online. The strongest authenticated momentum signal will populate this terminal and become eligible for the next drop."
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
        <span><Radio size={15} /> Next drop {countdown.label}</span>
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
        <EmptyState title="Factors pending" body="Score factors appear as soon as Runner locks onto an authenticated token signal." />
      )}
      <p className="scout-note">Scores use connected market data only. Missing social, holder, and smart-wallet adapters are never replaced with invented values.</p>
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
        <EmptyState title="Feed is listening" body="Signal detections, selections, public releases, and holder drops will appear here." />
      )}
    </section>
  );
}

function WalletStatusPanel() {
  const { wallet, stats, clearAccess } = useScout();
  const countdown = useCountdown(stats.nextDropTime);

  if (!wallet) return null;

  return (
    <section className="scout-panel scout-wallet-status">
      <div className="scout-wallet-status__head">
        <div><span className="scout-kicker">Wallet status</span><strong>{shortAddress(wallet.wallet, 7, 5)}</strong></div>
        <StatusBadge label={wallet.eligible ? "Eligible" : "Below threshold"} tone={wallet.eligible ? "live" : "muted"} />
      </div>
      <div className="scout-wallet-status__grid">
        <Metric label="Eligibility" value={wallet.eligible ? "Eligible" : "Below threshold"} />
        <Metric label="Current Weight" value={wallet.multiplierBps ? `${(wallet.multiplierBps / 10_000).toFixed(2)}x` : "Indexing"} />
        <Metric label="Epoch Streak" value={wallet.currentStreak.toLocaleString()} />
        <Metric label="Next Distribution" value={countdown.label} />
        <Metric label="Connected Wallet" value={shortAddress(wallet.wallet, 5, 4)} detail={wallet.wallet} />
      </div>
      <button className="scout-wallet-status__disconnect" type="button" onClick={clearAccess}>Disconnect</button>
    </section>
  );
}

export function ScoutTerminalView() {
  const { signals, stats, state, error, refresh, lastUpdated } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const activeSymbol = signals.active ? `$${signals.active.symbol}` : "AWAITING";
  const rankedSignals = [...signals.signals]
    .sort((left, right) => (right.scout_score ?? -1) - (left.scout_score ?? -1))
    .slice(0, 6);
  const activeConfidence = confidenceScore(signals.active);

  return (
    <>
      <section className="scout-hero runner-hero">
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
          <p className="scout-eyebrow">Live momentum terminal</p>
          <h1>Own the runner.<br /><span>Don't chase it.</span></h1>
          <p className="scout-hero__body">Runner continuously scans the market, identifies the strongest momentum token, and distributes weighted airdrops to eligible $RUNNER holders every 5 minutes.</p>
          <ScoutActionLinks />
          <p className="scout-hero__delay"><Clock3 size={15} /> Hold {formatToken(scoutPublicConfig.minimumHolding, "RUNNER")} to become eligible.</p>
        </div>
        <div className="scout-hero__terminal runner-scanner-panel">
          <div className="scout-terminal-bar"><span><i /> MOMENTUM SCANNER ONLINE</span><small>{lastUpdated ? `UPDATED ${formatTime(lastUpdated.toISOString())}` : "CONNECTING"}</small></div>
          <div className="runner-scanner-console" aria-label="Momentum Scanner">
            <div className="runner-scanner-console__head">
              <span>SCANNING MARKET <i className="runner-cursor" aria-hidden="true" /></span>
              <strong>{rankedSignals.length ? `${rankedSignals.length} SIGNALS RANKED` : "INDEXING"}</strong>
            </div>
            <div className="runner-symbol-stream" aria-label="Ranked momentum signals">
              {(rankedSignals.length ? rankedSignals : Array.from({ length: 6 }, () => null)).map((signal, index) => (
                <span className={signal?.id === signals.active?.id ? "is-active" : ""} style={{ animationDelay: `${index * 110}ms` }} key={signal?.id ?? `indexing-${index}`}>
                  {signal ? `$${signal.symbol}` : "INDEXING"}
                </span>
              ))}
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
            <div className="runner-lock-panel">
              <span>{signals.active ? "TARGET ACQUIRED" : "SEEKING TARGET"}</span>
              <strong>{activeSymbol}</strong>
              <small>{signals.active ? `LOCKED · ${activeConfidence ?? 0}% CONFIDENCE` : "AWAITING AUTHENTICATED SIGNAL"}</small>
            </div>
            <div className="runner-scanner-metrics">
              <Metric label="Current Runner" value={activeSymbol} detail={signals.active?.name} />
              <Metric label="Momentum" value={signals.active?.scout_score === null || signals.active?.scout_score === undefined ? "Scanning" : `${signals.active.scout_score}/100`} />
              <Metric label="Epoch" value={stats.currentEpoch.toLocaleString()} />
              <Metric label="Next Drop" value={countdown.label} />
            </div>
          </div>
          {state === "loading" ? <Skeleton rows={2} /> : state === "error" && error ? <ErrorState message={error} retry={() => void refresh()} /> : null}
          {state === "stale" && error ? <p className="scout-stale-note">Live refresh delayed. Showing the last verified data.</p> : null}
        </div>
        <div className="scout-live-strip">
          <Metric label="Indexed Signals" value={signals.signals.length.toLocaleString()} detail="Connected market feed" />
          <Metric label="Current Epoch" value={stats.currentEpoch.toLocaleString()} detail="Five-minute cycle" />
          <Metric label="Next Drop" value={countdown.label} detail="Live epoch timer" />
          <Metric label="Eligible Holders" value={stats.latestEligibleHolders.toLocaleString()} detail={`Minimum ${formatToken(scoutPublicConfig.minimumHolding, "RUNNER")}`} />
        </div>
      </section>

      <section className="scout-terminal-section" id="terminal">
        <div className="scout-section-heading scout-section-heading--inline">
          <div><span className="scout-kicker">Runner Terminal</span><h2>Live market state</h2></div>
          <p>Connected metrics only. Missing adapters remain explicitly unavailable.</p>
        </div>
        <div className="scout-terminal-grid">
          <WalletStatusPanel />
          <CurrentSignalPanel signal={signals.active} />
          <ScorePanel signal={signals.active} />
          <ActivityFeed />
          <section className="scout-panel scout-panel--protocol">
            <div className="scout-panel__head"><div><span className="scout-kicker">Airdrop rail</span><h2>Distribution state</h2></div><CircleDollarSign size={21} /></div>
            <div className="scout-metric-grid">
              <Metric label="Epoch" value={stats.currentEpoch.toLocaleString()} />
              <Metric label="Eligible" value={stats.latestEligibleHolders.toLocaleString()} />
              <Metric label="Distributed" value={formatToken(stats.totalRewardAirdropped, signals.active?.symbol ?? "tokens")} />
              <Metric label="SOL value" value={`${stats.totalSolValueAirdropped.toFixed(4)} SOL`} />
            </div>
            <Link className="scout-text-link" href="/airdrop-history">Open public receipts <ArrowRight size={15} /></Link>
          </section>
        </div>
      </section>
    </>
  );
}
