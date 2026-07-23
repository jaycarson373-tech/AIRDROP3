"use client";

import {
  ExternalLink,
  Filter,
  Radio,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Users
} from "lucide-react";
import { FormEvent, useState } from "react";
import { scoutPublicConfig, shortAddress } from "../../lib/scout-public";
import { formatClock, formatMoney, formatPercent, formatTime, formatToken, shortWallet } from "./format";
import { useCountdown } from "./hooks";
import { useScout } from "./scout-provider";
import { ActivityFeed, HolderMultiplierPanel } from "./terminal-view";
import { SignalLogo } from "./signal-logo";
import type { ScoutSignal } from "./types";
import { EmptyState, ErrorState, Metric, Skeleton, StatusBadge } from "./ui";

function PageHeading({ eyebrow, title, body, action }: { eyebrow: string; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="scout-page-heading">
      <div><span className="scout-kicker">{eyebrow}</span><h1>{title}</h1><p>{body}</p></div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

function SignalMark({ signal }: { signal: ScoutSignal }) {
  return <SignalLogo signal={signal} small />;
}

function SignalStatus({ signal }: { signal: ScoutSignal }) {
  const tone = signal.status === "active" ? "live" : signal.status === "rejected" ? "risk" : signal.status === "queued" ? "queued" : "muted";
  return <StatusBadge label={signal.status} tone={tone} />;
}

function signalMetric(signal: ScoutSignal, key: string) {
  const raw = signal.metrics?.[key];
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

const BUFFETT_BASKET_MINTS = new Set([
  "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
  "Xs6B6zawENwAbWVi7w92rjazLuAr5Az59qgWKcNb45x"
]);

function isBuffettBasketSignal(signal: ScoutSignal) {
  return BUFFETT_BASKET_MINTS.has(signal.mint);
}

function activeBasketSignal(signal: ScoutSignal | null) {
  return signal && isBuffettBasketSignal(signal) ? signal : null;
}

function marketCapPerformance(signal: ScoutSignal) {
  const current = signalMetric(signal, "currentMarketCapUsd");
  if (!signal.market_cap_usd || current === null) return null;
  return ((current / signal.market_cap_usd) - 1) * 100;
}

function SignalTable({ signals, compact = false }: { signals: ScoutSignal[]; compact?: boolean }) {
  if (!signals.length) return <EmptyState title="No basket assets yet" body="The first settled AAPL.x or BRK.Bx basket record will appear here once it is recorded." />;
  return (
    <div className="scout-table-wrap">
      <table className="scout-table">
        <thead><tr><th>Asset</th><th>Score</th><th>Entry MC</th><th>Current MC</th>{compact ? null : <th>Since entry</th>}<th>Entry time</th><th>Status</th><th aria-label="Chart" /></tr></thead>
        <tbody>{signals.map((signal) => (
          <tr key={signal.id} className={signal.status === "active" ? "is-active" : ""}>
            <td><div className="scout-table-token"><SignalMark signal={signal} /><span><strong>${signal.symbol}</strong><small>{signal.name}</small></span></div></td>
            <td><strong>{signal.scout_score === null ? "--" : `${signal.scout_score}/100`}</strong></td>
            <td>{formatMoney(signal.market_cap_usd)}</td><td>{formatMoney(signalMetric(signal, "currentMarketCapUsd"))}</td>
            {compact ? null : <td className={(marketCapPerformance(signal) ?? 0) > 0 ? "is-positive" : (marketCapPerformance(signal) ?? 0) < 0 ? "is-negative" : ""}>{formatPercent(marketCapPerformance(signal))}</td>}
            <td>{formatTime(signal.detected_at)}</td><td><SignalStatus signal={signal} /></td>
            <td><a className="scout-icon-link" href={`https://dexscreener.com/solana/${signal.mint}`} target="_blank" rel="noreferrer" aria-label={`Open ${signal.symbol} chart`}><ExternalLink size={15} /></a></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function SignalsView() {
  const { signals, state, error, refresh } = useScout();
  const [filter, setFilter] = useState<"all" | "active" | "queued" | "archived">("all");
  const basketSignals = signals.signals.filter(isBuffettBasketSignal);
  const rows = filter === "all" ? basketSignals : basketSignals.filter((signal) => signal.status === filter || (filter === "archived" && ["passed", "rejected", "archived"].includes(signal.status)));
  return (
    <div className="scout-page">
      <PageHeading eyebrow="Buffett basket ledger" title="Apple and Berkshire receipts." body="Track basket assets, current values, basket scores, status, and the distributions tied to each record." />
      <div className="scout-filter-bar"><Filter size={16} />{(["all", "active", "queued", "archived"] as const).map((value) => <button className={filter === value ? "is-active" : ""} type="button" onClick={() => setFilter(value)} key={value}>{value}</button>)}<span>{rows.length} records</span></div>
      <section className="scout-panel scout-panel--table">{state === "loading" ? <Skeleton rows={6} /> : state === "error" && error ? <ErrorState message={error} retry={() => void refresh()} /> : <SignalTable signals={rows} />}</section>
      <div className="scout-page-note"><ShieldCheck size={17} /><p>Buffettcoin basket data reflects verified market and holder data currently connected to the protocol. It is informational, not a promise of future performance.</p></div>
    </div>
  );
}

type SearchPayload = {
  query: string;
  interpretedAs: { maximumMarketCapUsd: number | null; detectedSince: string | null; positiveMomentumOnly: boolean };
  results: ScoutSignal[];
  error?: string;
};

export function SearchView() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/scout/search?q=${encodeURIComponent(query.trim())}`);
      const payload = await response.json() as SearchPayload;
      if (!response.ok) throw new Error(payload.error || "Search failed");
      setResult(payload);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "Search failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="scout-page">
      <PageHeading eyebrow="Basket Search" title="Search the basket ledger." body="Filter Buffettcoin basket assets by token, market cap, status, or record time." action={<StatusBadge label="Public data" tone="muted" />} />
      <form className="scout-search-form" onSubmit={search}><Search size={21} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Show active basket assets" aria-label="Search basket assets" /><button className="scout-button scout-button--primary" type="submit" disabled={busy}>{busy ? "Searching" : "Search"}</button></form>
      <div className="scout-query-examples">{["AAPL.x records", "BRK.Bx records", "Active basket assets", "Recorded in the last hour"].map((example) => <button type="button" onClick={() => setQuery(example)} key={example}>{example}</button>)}</div>
      {error ? <ErrorState message={error} /> : null}
      {result ? <section className="scout-panel scout-panel--table"><div className="scout-search-interpretation"><span>Applied filters</span><strong>{result.interpretedAs.maximumMarketCapUsd ? `Cap below ${formatMoney(result.interpretedAs.maximumMarketCapUsd)}` : "Any market cap"}</strong><strong>{result.interpretedAs.detectedSince ? `Since ${formatTime(result.interpretedAs.detectedSince)}` : "Any time"}</strong><strong>{result.interpretedAs.positiveMomentumOnly ? "Positive performance" : "Any performance"}</strong></div><SignalTable signals={result.results.filter(isBuffettBasketSignal)} compact /></section> : <EmptyState title="Search basket assets" body="Search by market cap, time, status, or token. Every result comes from the verified Buffettcoin ledger." />}
    </div>
  );
}

export function PerformanceView() {
  const { signals } = useScout();
  const completed = signals.signals.filter((signal) => isBuffettBasketSignal(signal) && signal.status !== "queued");
  const scored = completed.filter((signal) => signal.scout_score !== null);
  const averageScore = scored.length ? scored.reduce((sum, signal) => sum + Number(signal.scout_score), 0) / scored.length : null;
  const active = activeBasketSignal(signals.active);
  return (
    <div className="scout-page">
      <PageHeading eyebrow="Basket history" title="Buffettcoin records." body="Review verified AAPL.x / BRK.Bx records exactly as published. No backfilled winners." />
      <div className="scout-overview-grid"><Metric label="Basket records" value={completed.length.toLocaleString()} /><Metric label="Active now" value={active ? `$${active.symbol}` : "Calculating"} /><Metric label="Average Basket Score" value={averageScore === null ? "Awaiting verified data" : averageScore.toFixed(1)} /><Metric label="Public delay" value={`${signals.publicDelaySeconds}s`} /></div>
      <section className="scout-panel scout-panel--table"><SignalTable signals={completed} /></section>
      <div className="scout-page-note"><ShieldCheck size={17} /><p>Past basket records do not guarantee future performance. Tokenized assets and digital tokens can move rapidly.</p></div>
    </div>
  );
}

export function ReceiptsView() {
  const { stats, signals, state } = useScout();
  return (
    <div className="scout-page">
      <PageHeading eyebrow="Dividend receipts" title="Verify every dividend." body="Each settled holder dividend links back to its recorded epoch and transaction." />
      <div className="scout-overview-grid"><Metric label="Settled epochs" value={stats.totalEpochs.toLocaleString()} /><Metric label="Basket distributed" value={formatToken(stats.totalRewardAirdropped, scoutPublicConfig.rewardSymbol)} /><Metric label="SOL value distributed" value={`${stats.totalSolValueAirdropped.toFixed(4)} SOL`} /><Metric label="Eligible holders" value={stats.latestEligibleHolders.toLocaleString()} /></div>
      <section className="scout-panel scout-panel--table"><div className="scout-panel__head"><div><span className="scout-kicker">Epoch history</span><h2>Settled distributions</h2></div><Radio size={20} /></div>
        {state === "loading" ? <Skeleton rows={5} /> : stats.roundHistory.length ? <div className="scout-table-wrap"><table className="scout-table"><thead><tr><th>Epoch</th><th>Started</th><th>Eligible</th><th>Bought</th><th>Distributed</th><th>SOL value</th><th>Status</th><th>Transaction</th></tr></thead><tbody>{stats.roundHistory.map((row) => <tr key={`${row.epoch}-${row.startedAt}`}><td>#{row.epoch}</td><td>{formatTime(row.startedAt)}</td><td>{row.eligibleCount.toLocaleString()}</td><td>{formatToken(row.rewardBought, scoutPublicConfig.rewardSymbol)}</td><td>{formatToken(row.distributedPump, scoutPublicConfig.rewardSymbol)}</td><td>{row.solValueAirdropped.toFixed(4)} SOL</td><td><StatusBadge label={row.status} /></td><td>{row.txSig ? <a className="scout-icon-link" href={`https://solscan.io/tx/${row.txSig}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a> : "Pending"}</td></tr>)}</tbody></table></div> : <EmptyState title="Awaiting first settled distribution" body="Epochs appear here only after holder payouts are recorded as settled." />}
      </section>
      <section className="scout-panel scout-panel--table"><div className="scout-panel__head"><div><span className="scout-kicker">Wallet feed</span><h2>Recent dividends</h2></div><Users size={20} /></div>{stats.recentRewards.length ? <div className="scout-table-wrap"><table className="scout-table"><thead><tr><th>Wallet</th><th>Epoch</th><th>Dividend</th><th>Time</th><th>Status</th><th>Receipt</th></tr></thead><tbody>{stats.recentRewards.map((row, index) => <tr key={`${row.wallet}-${row.epoch}-${index}`}><td>{shortWallet(row.wallet)}</td><td>#{row.epoch}</td><td>{formatToken(row.rewardAmount, scoutPublicConfig.rewardSymbol)}</td><td>{formatTime(row.time)}</td><td>{row.status}</td><td>{row.txSig ? <a className="scout-icon-link" href={`https://solscan.io/tx/${row.txSig}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a> : "Pending"}</td></tr>)}</tbody></table></div> : <EmptyState title="No settled dividends yet" body="Individual wallet receipts will populate after the first completed Buffettcoin dividend epoch." />}</section>
    </div>
  );
}

export function DocsView() {
  return (
    <div className="scout-page scout-page--docs">
      <PageHeading eyebrow="Documentation" title="How BUFFETTCOIN verifies, weights, and distributes." body="See how the Buffett basket, holder snapshots, eligibility, and weighted distributions work." />
      <div className="scout-doc-layout">
        <aside><a href="#lifecycle">Basket lifecycle</a><a href="#score">Basket Score</a><a href="#access">Holder Weight</a><a href="#treasury">Buffett Basket</a></aside>
        <div className="scout-doc-content">
          <section id="lifecycle"><span className="scout-kicker">01</span><h2>Basket lifecycle</h2><p>Buffettcoin uses a fixed basket: 50% AAPL.x and 50% BRK.Bx. The worker rotates configured basket assets by epoch and records settled receipts.</p></section>
          <section id="score"><span className="scout-kicker">02</span><h2>Basket Score</h2><p>The public board can show market, liquidity, activity, and holder participation data when connected. The score is informational, not a guarantee.</p></section>
          <section id="access"><span className="scout-kicker">03</span><h2>Holder Weight</h2><p>Hold at least {formatToken(scoutPublicConfig.minimumHolding, "BUFFETT")} to qualify. Existing holder-state rules determine distribution weight and eligibility at each snapshot. Sell once and the wallet is permanently ineligible.</p></section>
          <section id="treasury"><span className="scout-kicker">04</span><h2>Buffett Basket</h2><p>The basket is simple by design: Apple and Berkshire exposure, distributed through the same transparent holder-reward rail.</p></section>
        </div>
      </div>
    </div>
  );
}

export function AdminView() {
  const { refresh } = useScout();
  const [secret, setSecret] = useState("");
  const [mint, setMint] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [activate, setActivate] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/scout/signals", { method: "POST", headers: { "Content-Type": "application/json", "x-scout-admin-secret": secret }, body: JSON.stringify({ mint, name, symbol, activate }) });
      const payload = await response.json() as { error?: string; activated?: boolean };
      if (!response.ok) throw new Error(payload.error || "Signal submission failed");
      setMessage(payload.activated ? "Basket asset authenticated and activated." : "Basket asset authenticated and queued.");
      setMint(""); setName(""); setSymbol(""); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Signal submission failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="scout-page scout-page--narrow">
      <PageHeading eyebrow="Restricted console" title="Add a basket asset." body="Submit a Solana mint for a verified Buffettcoin basket record. Your admin secret stays in this browser session only." action={<StatusBadge label="Protected" tone="risk" />} />
      <section className="scout-panel scout-admin-panel"><div className="scout-panel__head"><div><span className="scout-kicker">Basket intake</span><h2>Queue the next basket asset</h2></div><Settings2 size={21} /></div>
        <form onSubmit={submit}><label>Admin secret<input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="off" required /></label><label>Solana mint<input value={mint} onChange={(event) => setMint(event.target.value)} placeholder="Basket asset mint" required /></label><div className="scout-form-grid"><label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional" /></label><label>Symbol<input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="Optional" /></label></div><label className="scout-checkbox"><input type="checkbox" checked={activate} onChange={(event) => setActivate(event.target.checked)} /><span>Activate for the next epoch after enrichment</span></label><button className="scout-button scout-button--primary" type="submit" disabled={busy}>{busy ? "Authenticating" : "Submit basket asset"}<Send size={16} /></button>{message ? <p className="scout-admin-message" role="status">{message}</p> : null}</form>
      </section>
      <div className="scout-page-note"><ShieldCheck size={17} /><p>For launch, run the database migration and reset first, keep worker gates off, verify AAPL.x and BRK.Bx, then enable the worker gates.</p></div>
    </div>
  );
}

export function TerminalPageView() {
  const { signals, stats, state, error, refresh } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const active = activeBasketSignal(signals.active);
  const factors = active ? [["Liquidity", formatMoney(active.liquidity_usd)], ["24h volume", formatMoney(active.volume_24h_usd)], ["1h movement", formatPercent(Number(active.metrics.change1h ?? Number.NaN))], ["Token age", active.token_age_seconds === null ? "Unavailable" : `${Math.max(1, Math.round(active.token_age_seconds / 60))}m`]] : [];
  return (
    <div className="scout-page">
      <PageHeading eyebrow="BUFFETTCOIN Terminal" title="Track the Buffett basket." body="Monitor the active basket asset, holder weights, and the next AAPL.x / BRK.Bx distribution." action={<StatusBadge label="Basket live" tone="live" />} />
      {state === "loading" ? <div className="runner-terminal-state"><i /><strong>VALUING</strong><span>CONNECTING BUFFETTCOIN LEDGER</span></div> : state === "error" && error ? <ErrorState message={error} retry={() => void refresh()} /> : (
        <div className="scout-desk-layout">
          <section className="scout-panel scout-desk-primary">
            <div className="scout-terminal-bar"><span><i /> {active ? "ACTIVE BUFFETT BASKET ASSET" : "BUFFETT BASKET ONLINE"}</span><small>{active ? formatClock(active.detected_at) : "CALCULATING"}</small></div>
            {active ? (
              <>
                <div className="scout-desk-token"><SignalMark signal={active} /><div><span>Active basket asset</span><h2>${active.symbol}</h2><p>{active.name}</p></div><strong>{active.scout_score ?? "--"}{active.scout_score === null ? null : <small>/100</small>}</strong></div>
                <div className="scout-desk-factors">{factors.map(([label, value]) => <Metric label={label} value={value} key={label} />)}</div>
                <div className="scout-panel__footer"><span>{shortAddress(active.mint)}</span><a href={`https://dexscreener.com/solana/${active.mint}`} target="_blank" rel="noreferrer">Chart <ExternalLink size={14} /></a></div>
              </>
            ) : (
              <div className="runner-terminal-empty" role="status">
                <div className="scout-desk-factors">
                  <Metric label="Active basket asset" value="Not assigned" />
                  <Metric label="Status" value="Calculating..." />
                  <Metric label="Basket" value="Awaiting first asset" />
                  <Metric label="Score" value="Awaiting authenticated data" />
                  <Metric label="Liquidity" value="Unavailable" />
                  <Metric label="24h Volume" value="Unavailable" />
                  <Metric label="Asset age" value="Awaiting asset" />
                  <Metric label="Current Score" value="--" />
                </div>
                <div className="runner-no-target-copy"><strong>No active basket asset yet.</strong><p>The first verified Buffettcoin basket asset will appear here after authentication.</p></div>
              </div>
            )}
          </section>
          <section className="scout-panel scout-countdown-panel"><span className="scout-kicker">{active ? "Next Buffettcoin distribution" : "Next snapshot"}</span><strong>{countdown.label}</strong><p>{active ? (countdown.processing ? "The current distribution is processing. The timer resumes at the next confirmed boundary." : "Eligible holders receive AAPL.x / BRK.Bx weighted by verified holdings.") : "The basket remains online while it awaits an authenticated asset."}</p><i><span style={{ width: `${countdown.progress * 100}%` }} /></i></section>
          <HolderMultiplierPanel />
          <ActivityFeed />
        </div>
      )}
    </div>
  );
}
