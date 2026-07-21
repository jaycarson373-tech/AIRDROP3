"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Gauge,
  KeyRound,
  Radio,
  Search,
  ShieldCheck,
  Terminal
} from "lucide-react";
import { useState } from "react";
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

function AccessPanel() {
  const { wallet, accessToken, accessBusy, unlockScout, lookupWallet } = useScout();
  const [address, setAddress] = useState("");
  const eligibility = wallet?.eligible ? "Eligible" : wallet ? "Below threshold" : "Wallet not checked";

  return (
    <section className="scout-access-section" id="access">
      <div className="scout-section-heading">
        <span className="scout-kicker">Runner access</span>
        <h2>Hold $RUNNER. Receive the runners.</h2>
        <p>Eligible holders receive weighted token drops as Runner rotates through the strongest opportunities in the market.</p>
      </div>
      <div className="scout-access-layout">
        <div className="scout-panel scout-panel--access">
          <div className="scout-access-tier"><KeyRound size={19} /><span>Runner Pro</span><strong>{formatToken(scoutPublicConfig.minimumHolding, "RUNNER")}</strong></div>
          <ul className="scout-check-list">
            <li><CheckCircle2 size={16} /> Current runner access</li>
            <li><CheckCircle2 size={16} /> Momentum terminal access</li>
            <li><CheckCircle2 size={16} /> Holder distributions</li>
            <li><CheckCircle2 size={16} /> Watchlists and history</li>
          </ul>
          <button className="scout-button scout-button--primary" type="button" onClick={unlockScout} disabled={accessBusy || Boolean(accessToken)}>
            {accessToken ? "Runner Pro unlocked" : accessBusy ? "Verifying wallet" : "Verify holder access"}
          </button>
        </div>
        <div className="scout-panel scout-panel--lookup">
          <span className="scout-label">Public wallet lookup</span>
          <h3>Check eligibility</h3>
          <form onSubmit={(event) => { event.preventDefault(); if (address.trim()) void lookupWallet(address.trim()); }}>
            <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Solana wallet address" aria-label="Solana wallet address" />
            <button className="scout-icon-button" type="submit" aria-label="Look up wallet"><ArrowRight size={18} /></button>
          </form>
          <div className="scout-wallet-result">
            <Metric label="Status" value={eligibility} />
            <Metric label="Balance" value={wallet ? formatToken(wallet.sourceBalance, "RUNNER") : "—"} />
            <Metric label="Epoch streak" value={wallet ? wallet.currentStreak.toLocaleString() : "—"} />
            <Metric label="Current weight" value={wallet?.multiplierBps ? `${(wallet.multiplierBps / 10_000).toFixed(2)}x` : "—"} />
          </div>
          <p className="scout-note">A balance decrease resets the epoch bonus to 1.00x. Eligibility returns whenever the wallet holds at least {formatToken(scoutPublicConfig.minimumHolding, "RUNNER")}.</p>
        </div>
      </div>
    </section>
  );
}

function ProductRail() {
  const products = [
    { icon: Radio, label: "Current Runner", detail: "Live selection and transparent scoring", href: "/terminal" },
    { icon: Search, label: "Momentum", detail: "Query the complete Runner signal record", href: "/search" },
    { icon: Bot, label: "Telegram", detail: "Alerts for communities without the noise", href: "/docs#telegram" },
    { icon: KeyRound, label: "API", detail: "Selections and history for products and funds", href: "/api" }
  ];
  return (
    <section className="scout-products">
      <div className="scout-section-heading scout-section-heading--inline">
        <div><span className="scout-kicker">Momentum layer</span><h2>Built to stay open.</h2></div>
        <p>Runner turns live market momentum into a queryable record, a community alert layer, and a deterministic distribution input.</p>
      </div>
      <div className="scout-product-grid">
        {products.map(({ icon: Icon, ...product }) => (
          <Link href={product.href} key={product.label}>
            <Icon size={20} />
            <strong>{product.label}</strong>
            <span>{product.detail}</span>
            <ArrowRight size={16} />
          </Link>
        ))}
      </div>
    </section>
  );
}

function Mechanics() {
  const steps = [
    ["01", "Track", "Runner ranks live tokens by momentum, liquidity, volume, holder growth, and market strength."],
    ["02", "Lock", "The strongest runner becomes the active selection."],
    ["03", "Drop", "Eligible holders receive a weighted share at the snapshot."],
    ["04", "Verify", "Selections, buys, and settled payouts remain auditable onchain."]
  ];
  return (
    <section className="scout-mechanics">
      <div className="scout-section-heading"><span className="scout-kicker">How Runner works</span><h2>Momentum, made accountable.</h2></div>
      <div className="scout-step-grid">
        {steps.map(([index, title, body]) => <div key={index}><span>{index}</span><strong>{title}</strong><p>{body}</p></div>)}
      </div>
      <p className="scout-disclosure"><ShieldCheck size={17} /> Selections and holder drops operate on five-minute epochs. Public users can inspect activity; only an authorized Runner source can queue a new active mint.</p>
    </section>
  );
}

export function ScoutTerminalView() {
  const { signals, stats, state, error, refresh, lastUpdated } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const activeSymbol = signals.active ? `$${signals.active.symbol}` : "AWAITING";
  const scannerSymbols = [
    "$DOG", "$CAT", "$BULL", "$PONKE", "$PNUT", "$TRIPLET",
    "$GOAT", "$MEW", "$WIF", "$ANSEM", "$TROLL", "$KINS"
  ];

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
        <div className="scout-hero__copy">
          <StatusBadge label={signals.active ? "Scanner online" : "Scanner online"} />
          <img className="runner-hero__logo" src="/brand/runner-logo.jpg" alt="Runner" />
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
              <span>SCANNING</span>
              <strong>{activeSymbol}</strong>
            </div>
            <div className="runner-symbol-stream" aria-hidden="true">
              {scannerSymbols.map((symbol, index) => (
                <span className={signals.active?.symbol && symbol === `$${signals.active.symbol}` ? "is-active" : ""} style={{ animationDelay: `${index * 120}ms` }} key={`${symbol}-${index}`}>
                  {symbol}
                </span>
              ))}
            </div>
            <div className="runner-lock-panel">
              <span>TARGET ACQUIRED</span>
              <strong>{activeSymbol}</strong>
              <small>{signals.active ? "Promoted to Current Runner" : "Awaiting authenticated signal"}</small>
            </div>
            <div className="runner-scanner-metrics">
              <Metric label="Current Runner" value={activeSymbol} detail={signals.active?.name} />
              <Metric label="Momentum" value={signals.active?.scout_score === null || signals.active?.scout_score === undefined ? "Scanning" : `${signals.active.scout_score}/100`} />
              <Metric label="Epoch" value={stats.currentEpoch.toLocaleString()} />
              <Metric label="Next Drop" value={countdown.label} />
            </div>
          </div>
          {state === "loading" ? <Skeleton rows={5} /> : state === "error" && error ? <ErrorState message={error} retry={() => void refresh()} /> : <CurrentSignalPanel signal={signals.active} />}
          {state === "stale" && error ? <p className="scout-stale-note">Live refresh delayed. Showing the last verified data.</p> : null}
        </div>
        <div className="scout-live-strip">
          <Metric label="Current Runner" value={activeSymbol} detail={signals.active?.name} />
          <Metric label="Momentum" value={signals.active?.scout_score === null || signals.active?.scout_score === undefined ? "Scanning" : `${signals.active.scout_score}/100`} />
          <Metric label="Next Drop" value={countdown.label} detail="Live epoch timer" />
          <Metric label="Eligible Holders" value={stats.latestEligibleHolders.toLocaleString()} detail={`Minimum ${formatToken(scoutPublicConfig.minimumHolding, "RUNNER")}`} />
        </div>
      </section>

      <section className="scout-terminal-section" id="terminal">
        <div className="scout-section-heading scout-section-heading--inline">
          <div><span className="scout-kicker">Runner Terminal</span><h2>The momentum market, live.</h2></div>
          <p>Real connected metrics only. Missing adapters stay marked unavailable until they are integrated.</p>
        </div>
        <div className="scout-terminal-grid">
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

      <ProductRail />
      <Mechanics />
      <AccessPanel />

      <section className="scout-final-cta">
        <div><span className="scout-kicker">Momentum terminal</span><h2>Own the runner. Don't chase it.</h2><p>Use the live terminal, unlock the early feed, or bring Runner alerts into your community.</p></div>
        <div className="scout-final-cta__actions">
          <Link className="scout-button scout-button--primary" href="/terminal">Open terminal <ArrowRight size={17} /></Link>
          <Link className="scout-button scout-button--secondary" href="/docs#telegram">Add Telegram bot <Bot size={17} /></Link>
        </div>
      </section>
    </>
  );
}
