"use client";

import { ExternalLink, Filter, Radio, Search, Send, Settings2, ShieldCheck, Users } from "lucide-react";
import { FormEvent, useState } from "react";
import { scoutPublicConfig, shortAddress } from "../../lib/scout-public";
import { formatMoney, formatPercent, formatTime, formatToken, shortWallet } from "./format";
import { CasinoTerminalView } from "./casino-view";
import { SignalLogo } from "./signal-logo";
import { useScout } from "./scout-provider";
import type { ScoutSignal } from "./types";
import { EmptyState, ErrorState, Metric, PrelaunchNotice, Skeleton, StatusBadge } from "./ui";

function PageHeading({ eyebrow, title, body, action }: { eyebrow: string; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="scout-page-heading">
      <div><span className="scout-kicker">{eyebrow}</span><h1>{title}</h1><p>{body}</p></div>
      {action ? <div>{action}</div> : null}
    </div>
  );
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

function marketCapPerformance(signal: ScoutSignal) {
  const current = signalMetric(signal, "currentMarketCapUsd");
  if (!signal.market_cap_usd || current === null) return null;
  return ((current / signal.market_cap_usd) - 1) * 100;
}

function SignalTable({ signals, compact = false }: { signals: ScoutSignal[]; compact?: boolean }) {
  if (!signals.length) return <EmptyState title="No verified records yet" body="Records appear only after Casino receives a verified settlement signal." />;
  return (
    <div className="scout-table-wrap">
      <table className="scout-table">
        <thead>
          <tr>
            <th>Asset</th><th>Score</th><th>Entry MC</th><th>Current MC</th>{compact ? null : <th>Move</th>}<th>Detected</th><th>Status</th><th aria-label="Chart" />
          </tr>
        </thead>
        <tbody>
          {signals.map((signal) => (
            <tr key={signal.id} className={signal.status === "active" ? "is-active" : ""}>
              <td><div className="scout-table-token"><SignalLogo signal={signal} small /><span><strong>${signal.symbol}</strong><small>{signal.name}</small></span></div></td>
              <td><strong>{signal.scout_score === null ? "NOT RECORDED" : `${signal.scout_score}/100`}</strong></td>
              <td>{formatMoney(signal.market_cap_usd)}</td>
              <td>{formatMoney(signalMetric(signal, "currentMarketCapUsd"))}</td>
              {compact ? null : <td className={(marketCapPerformance(signal) ?? 0) > 0 ? "is-positive" : (marketCapPerformance(signal) ?? 0) < 0 ? "is-negative" : ""}>{formatPercent(marketCapPerformance(signal))}</td>}
              <td>{formatTime(signal.detected_at)}</td>
              <td><SignalStatus signal={signal} /></td>
              <td><a className="scout-icon-link" href={`https://dexscreener.com/solana/${signal.mint}`} target="_blank" rel="noreferrer" aria-label={`Open ${signal.symbol} chart`}><ExternalLink size={15} /></a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SignalsView() {
  const { launchState, signals, state, error, refresh } = useScout();
  const [filter, setFilter] = useState<"all" | "active" | "queued" | "archived">("all");
  const rows = filter === "all"
    ? signals.signals
    : signals.signals.filter((signal) => signal.status === filter || (filter === "archived" && ["passed", "rejected", "archived"].includes(signal.status)));
  return (
    <div className="scout-page">
      <PageHeading eyebrow="Casino Ledger" title="Verified records." body="Track every public record connected to Casino settlement." />
      {launchState === "prelaunch" ? <PrelaunchNotice /> : <>
      <div className="scout-filter-bar">
        <Filter size={16} />
        {(["all", "active", "queued", "archived"] as const).map((value) => (
          <button className={filter === value ? "is-active" : ""} type="button" onClick={() => setFilter(value)} key={value}>{value}</button>
        ))}
        <span>{rows.length} records</span>
      </div>
      <section className="scout-panel scout-panel--table">
        {state === "loading" ? <Skeleton rows={6} /> : state === "error" && error ? <ErrorState message={error} retry={() => void refresh()} /> : <SignalTable signals={rows} />}
      </section>
      <div className="scout-page-note"><ShieldCheck size={17} /><p>Casino displays only records currently connected to the protocol. No result is final until its on-chain settlement is confirmed.</p></div>
      </>}
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
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/scout/search?q=${encodeURIComponent(query.trim())}`);
      const payload = await response.json() as SearchPayload;
      if (!response.ok) throw new Error(payload.error || "Search failed");
      setResult(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scout-page">
      <PageHeading eyebrow="Record Search" title="Search settlement records." body="Filter the Casino public ledger by asset, status, or record time." action={<StatusBadge label="Public data" tone="muted" />} />
      <form className="scout-search-form" onSubmit={search}>
        <Search size={21} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Show verified records" aria-label="Search records" />
        <button className="scout-button scout-button--primary" type="submit" disabled={busy}>{busy ? "Searching" : "Search"}</button>
      </form>
      <div className="scout-query-examples">
        {["Active records", "Under 500k market cap", "Detected in the last hour", "Positive momentum"].map((example) => (
          <button type="button" onClick={() => setQuery(example)} key={example}>{example}</button>
        ))}
      </div>
      {error ? <ErrorState message={error} /> : null}
      {result ? (
        <section className="scout-panel scout-panel--table">
          <div className="scout-search-interpretation">
            <span>Applied filters</span>
            <strong>{result.interpretedAs.maximumMarketCapUsd ? `Cap below ${formatMoney(result.interpretedAs.maximumMarketCapUsd)}` : "Any market cap"}</strong>
            <strong>{result.interpretedAs.detectedSince ? `Since ${formatTime(result.interpretedAs.detectedSince)}` : "Any time"}</strong>
            <strong>{result.interpretedAs.positiveMomentumOnly ? "Positive momentum" : "Any momentum"}</strong>
          </div>
          <SignalTable signals={result.results} compact />
        </section>
      ) : <EmptyState title="Search the public ledger" body="Search by market cap, time, status, or token. Results come from the verified feed." />}
    </div>
  );
}

export function PerformanceView() {
  const { signals } = useScout();
  const completed = signals.signals.filter((signal) => signal.status !== "queued");
  const scored = completed.filter((signal) => signal.scout_score !== null);
  const averageScore = scored.length ? scored.reduce((sum, signal) => sum + Number(signal.scout_score), 0) / scored.length : null;
  return (
    <div className="scout-page">
      <PageHeading eyebrow="History" title="Casino record." body="Review previous public records as they were received by the protocol." />
      <div className="scout-overview-grid">
        <Metric label="Records" value={completed.length.toLocaleString()} />
        <Metric label="Active Now" value={signals.active ? `$${signals.active.symbol}` : "NO LIVE ROUND"} />
        <Metric label="Average Score" value={averageScore === null ? "NOT RECORDED" : averageScore.toFixed(1)} />
        <Metric label="Public Delay" value={`${signals.publicDelaySeconds}s`} />
      </div>
      <section className="scout-panel scout-panel--table"><SignalTable signals={completed} /></section>
    </div>
  );
}

export function ReceiptsView() {
  const { stats, state } = useScout();
  return (
    <div className="scout-page">
      <PageHeading eyebrow="Casino Results" title="Verify every round." body="Every settled result links to its round, recipient count, amount, and transaction proof." />
      <div className="scout-overview-grid">
        <Metric label="Verified Rounds" value={stats.totalEpochs.toLocaleString()} />
        <Metric label="Tokens Distributed" value={formatToken(stats.totalRewardAirdropped, scoutPublicConfig.rewardSymbol)} />
        <Metric label="Distributed Value" value={`${stats.totalSolValueAirdropped.toFixed(4)} SOL`} />
        <Metric label="Recorded Recipients" value={stats.latestEligibleHolders.toLocaleString()} />
      </div>
      <section className="scout-panel scout-panel--table">
        <div className="scout-panel__head"><div><span className="scout-kicker">Round history</span><h2>Verified settlements</h2></div><Radio size={20} /></div>
        {state === "loading" ? <Skeleton rows={5} /> : stats.roundHistory.length ? (
          <div className="scout-table-wrap">
            <table className="scout-table">
              <thead><tr><th>Epoch</th><th>Started</th><th>Eligible</th><th>Bought</th><th>Distributed</th><th>SOL value</th><th>Status</th><th>Transaction</th></tr></thead>
              <tbody>{stats.roundHistory.map((row) => (
                <tr key={`${row.epoch}-${row.startedAt}`}>
                  <td>#{row.epoch}</td><td>{formatTime(row.startedAt)}</td><td>{row.eligibleCount.toLocaleString()}</td>
                  <td>{formatToken(row.rewardBought, scoutPublicConfig.rewardSymbol)}</td><td>{formatToken(row.distributedPump, scoutPublicConfig.rewardSymbol)}</td>
                  <td>{row.solValueAirdropped.toFixed(4)} SOL</td><td><StatusBadge label={row.status} /></td>
                  <td>{row.txSig ? <a className="scout-icon-link" href={`https://solscan.io/tx/${row.txSig}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a> : "NOT RECORDED"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="No verified settlement yet" body="Rounds appear here only after recipient transactions are recorded as settled." />}
      </section>
      <section className="scout-panel scout-panel--table">
        <div className="scout-panel__head"><div><span className="scout-kicker">Recipient feed</span><h2>Recent verified payouts</h2></div><Users size={20} /></div>
        {stats.recentRewards.length ? (
          <div className="scout-table-wrap">
            <table className="scout-table">
              <thead><tr><th>Wallet</th><th>Epoch</th><th>Amount</th><th>Time</th><th>Status</th><th>Receipt</th></tr></thead>
              <tbody>{stats.recentRewards.map((row, index) => (
                <tr key={`${row.wallet}-${row.epoch}-${index}`}>
                  <td>{shortWallet(row.wallet)}</td><td>#{row.epoch}</td><td>{formatToken(row.rewardAmount, scoutPublicConfig.rewardSymbol)}</td>
                  <td>{formatTime(row.time)}</td><td>{row.status}</td>
                  <td>{row.txSig ? <a className="scout-icon-link" href={`https://solscan.io/tx/${row.txSig}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a> : "NOT RECORDED"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="No recipient receipts yet" body="Individual proofs populate after the first completed Casino settlement." />}
      </section>
    </div>
  );
}

export function DocsView() {
  return (
    <div className="scout-page scout-page--docs">
      <PageHeading eyebrow="Documentation" title="How Casino works." body="Ten two-dimensional games rotate on a shared five-minute clock. Results publish only after settlement." />
      <div className="scout-doc-layout">
        <aside><a href="#lifecycle">Round cycle</a><a href="#weight">Eligibility</a><a href="#treasury">Settlement</a></aside>
        <div className="scout-doc-content">
          <section id="lifecycle"><span className="scout-kicker">01</span><h2>Round cycle</h2><p>Casino rotates through ten games. A new game begins on each five-minute UTC boundary.</p></section>
          <section id="weight"><span className="scout-kicker">02</span><h2>Eligibility</h2><p>Eligibility is read from the configured strategy rules. Never infer eligibility from an unverified screen state.</p></section>
          <section id="treasury"><span className="scout-kicker">03</span><h2>Settlement</h2><p>Recipients and amounts appear publicly only after a real transaction receipt is available.</p></section>
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
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/scout/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-scout-admin-secret": secret },
        body: JSON.stringify({ mint, name, symbol, activate })
      });
      const payload = await response.json() as { error?: string; activated?: boolean };
      if (!response.ok) throw new Error(payload.error || "Signal submission failed");
      setMessage(payload.activated ? "Record activated." : "Record queued.");
      setMint("");
      setName("");
      setSymbol("");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signal submission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scout-page scout-page--narrow">
      <PageHeading eyebrow="Restricted console" title="Add a settlement asset." body="Submit a Solana mint to the Casino public ledger." action={<StatusBadge label="Protected" tone="risk" />} />
      <section className="scout-panel scout-admin-panel">
        <div className="scout-panel__head"><div><span className="scout-kicker">Asset intake</span><h2>Queue a settlement asset</h2></div><Settings2 size={21} /></div>
        <form onSubmit={submit}>
          <label>Admin secret<input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="off" required /></label>
          <label>Solana mint<input value={mint} onChange={(event) => setMint(event.target.value)} placeholder="Token mint" required /></label>
          <div className="scout-form-grid">
            <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional" /></label>
            <label>Symbol<input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="Optional" /></label>
          </div>
          <label className="scout-checkbox"><input type="checkbox" checked={activate} onChange={(event) => setActivate(event.target.checked)} /><span>Activate after enrichment</span></label>
          <button className="scout-button scout-button--primary" type="submit" disabled={busy}>{busy ? "Authenticating" : "Submit asset"}<Send size={16} /></button>
          {message ? <p className="scout-admin-message" role="status">{message}</p> : null}
        </form>
      </section>
    </div>
  );
}

export function TerminalPageView() {
  return <CasinoTerminalView />;
}
