"use client";

import { ExternalLink, Filter, Radio, Search, Send, Settings2, ShieldCheck, Users } from "lucide-react";
import { FormEvent, useState } from "react";
import { scoutPublicConfig, shortAddress } from "../../lib/scout-public";
import { formatClock, formatMoney, formatPercent, formatTime, formatToken, shortWallet } from "./format";
import { useCountdown } from "./hooks";
import { ActivityFeed, CatScanner } from "./terminal-view";
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
  if (!signals.length) return <EmptyState title="No cat runners yet" body="The first active cat-token runner appears here once Cat Strategy has a live signal." />;
  return (
    <div className="scout-table-wrap">
      <table className="scout-table">
        <thead>
          <tr>
            <th>Cat</th><th>Score</th><th>Entry MC</th><th>Current MC</th>{compact ? null : <th>Move</th>}<th>Detected</th><th>Status</th><th aria-label="Chart" />
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
      <PageHeading eyebrow="Cat Board" title="Cat runners." body="Track the active cat-token runner and every signal recorded by Cat Strategy." />
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
      <div className="scout-page-note"><ShieldCheck size={17} /><p>Cat Strategy data reflects records currently connected to the protocol. It is informational, not a promise of future performance.</p></div>
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
      <PageHeading eyebrow="Cat Search" title="Search cat-runner records." body="Filter the Cat Strategy signal table by token, market cap, status, or record time." action={<StatusBadge label="Public data" tone="muted" />} />
      <form className="scout-search-form" onSubmit={search}>
        <Search size={21} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Show active cat runners" aria-label="Search cat runners" />
        <button className="scout-button scout-button--primary" type="submit" disabled={busy}>{busy ? "Searching" : "Search"}</button>
      </form>
      <div className="scout-query-examples">
        {["Active cat runners", "Under 500k market cap", "Detected in the last hour", "Positive momentum"].map((example) => (
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
      ) : <EmptyState title="Search the cat tape" body="Search by market cap, time, status, or token. Results come from the same public signal feed." />}
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
      <PageHeading eyebrow="History" title="Cat Strategy record." body="Review previous cat runners as they were recorded by the protocol." />
      <div className="scout-overview-grid">
        <Metric label="Records" value={completed.length.toLocaleString()} />
        <Metric label="Active Now" value={signals.active ? `$${signals.active.symbol}` : "NO LIVE RUNNER"} />
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
      <PageHeading eyebrow="Cat Receipts" title="Verify every drop." body="Each settled holder drop links back to its epoch, wallet count, token amount, and transaction proof." />
      <CatScanner />
      <div className="scout-overview-grid">
        <Metric label="Settled Epochs" value={stats.totalEpochs.toLocaleString()} />
        <Metric label="Cat Dropped" value={formatToken(stats.totalRewardAirdropped, scoutPublicConfig.rewardSymbol)} />
        <Metric label="SOL Value Dropped" value={`${stats.totalSolValueAirdropped.toFixed(4)} SOL`} />
        <Metric label="Eligible Holders" value={stats.latestEligibleHolders.toLocaleString()} />
      </div>
      <section className="scout-panel scout-panel--table">
        <div className="scout-panel__head"><div><span className="scout-kicker">Epoch history</span><h2>Settled cat drops</h2></div><Radio size={20} /></div>
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
        ) : <EmptyState title="The first settled cat drop appears after launch" body="Epochs appear here only after holder payouts are recorded as settled." />}
      </section>
      <section className="scout-panel scout-panel--table">
        <div className="scout-panel__head"><div><span className="scout-kicker">Wallet feed</span><h2>Recent cat drops</h2></div><Users size={20} /></div>
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
        ) : <EmptyState title="No wallet drops yet" body="Individual receipts will populate after the first completed Cat Strategy epoch." />}
      </section>
    </div>
  );
}

export function DocsView() {
  return (
    <div className="scout-page scout-page--docs">
      <PageHeading eyebrow="Documentation" title="How Cat Strategy works." body="The short version: hold CSTR, build weight, receive the active cat-token runner when epochs settle." />
      <div className="scout-doc-layout">
        <aside><a href="#lifecycle">Lifecycle</a><a href="#weight">Holder Weight</a><a href="#treasury">Cat Runner</a></aside>
        <div className="scout-doc-content">
          <section id="lifecycle"><span className="scout-kicker">01</span><h2>Cat lifecycle</h2><p>Cat Strategy keeps one active cat-token runner in focus. Each epoch snapshots holders and records settled drops.</p></section>
          <section id="weight"><span className="scout-kicker">02</span><h2>Holder Weight</h2><p>Hold at least {formatToken(scoutPublicConfig.minimumHolding, "CSTR")} to qualify. Selling or transferring resets multiplier progress to base weight.</p></section>
          <section id="treasury"><span className="scout-kicker">03</span><h2>Cat Runner</h2><p>The active reward token is configured through the reward mint. When the worker buys and distributes it, receipts appear publicly.</p></section>
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
      setMessage(payload.activated ? "Cat runner activated." : "Cat runner queued.");
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
      <PageHeading eyebrow="Restricted console" title="Add a cat runner." body="Submit a Solana mint for the Cat Strategy public board." action={<StatusBadge label="Protected" tone="risk" />} />
      <section className="scout-panel scout-admin-panel">
        <div className="scout-panel__head"><div><span className="scout-kicker">Cat intake</span><h2>Queue the next cat runner</h2></div><Settings2 size={21} /></div>
        <form onSubmit={submit}>
          <label>Admin secret<input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="off" required /></label>
          <label>Solana mint<input value={mint} onChange={(event) => setMint(event.target.value)} placeholder="Cat-token mint" required /></label>
          <div className="scout-form-grid">
            <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional" /></label>
            <label>Symbol<input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="Optional" /></label>
          </div>
          <label className="scout-checkbox"><input type="checkbox" checked={activate} onChange={(event) => setActivate(event.target.checked)} /><span>Activate after enrichment</span></label>
          <button className="scout-button scout-button--primary" type="submit" disabled={busy}>{busy ? "Authenticating" : "Submit cat runner"}<Send size={16} /></button>
          {message ? <p className="scout-admin-message" role="status">{message}</p> : null}
        </form>
      </section>
    </div>
  );
}

export function TerminalPageView() {
  const { launchState, signals, stats, state, error, refresh } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const active = signals.active;
  const factors = active ? [
    ["Liquidity", formatMoney(active.liquidity_usd)],
    ["24h Volume", formatMoney(active.volume_24h_usd)],
    ["1h Move", formatPercent(Number(active.metrics.change1h ?? Number.NaN))],
    ["Token Age", active.token_age_seconds === null ? "NOT RECORDED" : `${Math.max(1, Math.round(active.token_age_seconds / 60))}m`]
  ] : [];

  return (
    <div className="scout-page">
      <PageHeading eyebrow="Cat Terminal" title="Track the active cat runner." body="Monitor the active cat-token target, holder weights, and the next distribution." action={<StatusBadge label={launchState === "live" ? "Cat Strategy live" : "Prelaunch"} tone={launchState === "live" ? "live" : "muted"} />} />
      {launchState === "prelaunch" ? <PrelaunchNotice /> : state === "loading" ? <div className="runner-terminal-state"><i /><strong>CONNECTING</strong><span>CAT STRATEGY DATA</span></div> : state === "error" && error ? <ErrorState message={error} retry={() => void refresh()} /> : (
        <div className="scout-desk-layout">
          <section className="scout-panel scout-desk-primary">
            <div className="scout-terminal-bar"><span><i /> {active ? "ACTIVE CAT RUNNER" : "CAT STRATEGY ONLINE"}</span><small>{active ? formatClock(active.detected_at) : "NO LIVE RUNNER"}</small></div>
            {active ? (
              <>
                <div className="scout-desk-token"><SignalLogo signal={active} small /><div><span>Active cat runner</span><h2>${active.symbol}</h2><p>{active.name}</p></div><strong>{active.scout_score ?? "NOT RECORDED"}{active.scout_score === null ? null : <small>/100</small>}</strong></div>
                <div className="scout-desk-factors">{factors.map(([label, value]) => <Metric label={label} value={value} key={label} />)}</div>
                <div className="scout-panel__footer"><span>{shortAddress(active.mint)}</span><a href={`https://dexscreener.com/solana/${active.mint}`} target="_blank" rel="noreferrer">Chart <ExternalLink size={14} /></a></div>
              </>
            ) : (
              <div className="runner-terminal-empty" role="status">
                <div className="scout-desk-factors">
                  <Metric label="Active Cat" value="Not assigned" />
                  <Metric label="Status" value="NO LIVE RUNNER" />
                  <Metric label="Minimum" value={`${scoutPublicConfig.minimumHolding.toLocaleString()} CSTR`} />
                  <Metric label="Multiplier" value="Base until streak builds" />
                </div>
              </div>
            )}
          </section>
          <section className="scout-panel scout-countdown-panel"><span className="scout-kicker">Next Cat Drop</span><strong>{countdown.label}</strong><p>{countdown.processing ? "Distribution is processing. Timer resumes at the next confirmed boundary." : "Eligible holders receive the active cat runner weighted by holder state."}</p><i><span style={{ width: `${countdown.progress * 100}%` }} /></i></section>
          <ActivityFeed />
        </div>
      )}
    </div>
  );
}
