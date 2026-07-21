"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Filter,
  KeyRound,
  LockKeyhole,
  Radio,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Users
} from "lucide-react";
import { FormEvent, useState } from "react";
import { scoutPublicConfig, shortAddress } from "../../lib/scout-public";
import { formatMoney, formatPercent, formatTime, formatToken, shortWallet } from "./format";
import { useCountdown } from "./hooks";
import { useScout } from "./scout-provider";
import { HolderMultiplierPanel, WalletStatusPanel } from "./terminal-view";
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
  return <span className="scout-token-mark scout-token-mark--small" aria-hidden="true">{signal.symbol.slice(0, 2).toUpperCase()}</span>;
}

function SignalStatus({ signal }: { signal: ScoutSignal }) {
  const tone = signal.status === "active" ? "live" : signal.status === "rejected" ? "risk" : signal.status === "queued" ? "queued" : "muted";
  return <StatusBadge label={signal.status} tone={tone} />;
}

function SignalTable({ signals, compact = false }: { signals: ScoutSignal[]; compact?: boolean }) {
  if (!signals.length) return <EmptyState title="No runner signals yet" body="The first verified market signal will appear here when Runner detects it." />;
  return (
    <div className="scout-table-wrap">
      <table className="scout-table">
        <thead><tr><th>Token</th><th>Momentum Score</th><th>Market cap</th><th>Liquidity</th>{compact ? null : <th>24h volume</th>}<th>Detected</th><th>Status</th><th aria-label="Chart" /></tr></thead>
        <tbody>{signals.map((signal) => (
          <tr key={signal.id} className={signal.status === "active" ? "is-active" : ""}>
            <td><div className="scout-table-token"><SignalMark signal={signal} /><span><strong>${signal.symbol}</strong><small>{signal.name}</small></span></div></td>
            <td><strong>{signal.scout_score === null ? "Indexing" : `${signal.scout_score}/100`}</strong></td>
            <td>{formatMoney(signal.market_cap_usd)}</td><td>{formatMoney(signal.liquidity_usd)}</td>
            {compact ? null : <td>{formatMoney(signal.volume_24h_usd)}</td>}
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
  const rows = filter === "all" ? signals.signals : signals.signals.filter((signal) => signal.status === filter || (filter === "archived" && ["passed", "rejected", "archived"].includes(signal.status)));
  return (
    <div className="scout-page">
      <PageHeading eyebrow="Signal record" title="Every detected runner." body="Review detected tokens, momentum scores, current targets, and past signals." />
      <div className="scout-filter-bar"><Filter size={16} />{(["all", "active", "queued", "archived"] as const).map((value) => <button className={filter === value ? "is-active" : ""} type="button" onClick={() => setFilter(value)} key={value}>{value}</button>)}<span>{rows.length} records</span></div>
      <section className="scout-panel scout-panel--table">{state === "loading" ? <Skeleton rows={6} /> : state === "error" && error ? <ErrorState message={error} retry={() => void refresh()} /> : <SignalTable signals={rows} />}</section>
      <div className="scout-page-note"><ShieldCheck size={17} /><p>Momentum Score reflects the market adapters currently connected to the protocol. It is a ranking signal, not a promise of future performance.</p></div>
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
  const { accessToken, signals, unlockScout } = useScout();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/scout/search?q=${encodeURIComponent(query.trim())}`, { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined });
      const payload = await response.json() as SearchPayload;
      if (!response.ok) throw new Error(payload.error || "Search failed");
      setResult(payload);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : "Search failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="scout-page">
      <PageHeading eyebrow="Runner Search" title="Search the signal record." body="Filter Runner's recorded signals by token, market cap, status, momentum, or detection time." action={<StatusBadge label={signals.access === "premium" ? "Runner Pro" : "Public data"} tone={signals.access === "premium" ? "live" : "muted"} />} />
      <form className="scout-search-form" onSubmit={search}><Search size={21} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Show me runners under $500k detected today" aria-label="Search Runner signals" /><button className="scout-button scout-button--primary" type="submit" disabled={busy}>{busy ? "Searching" : "Search"}</button></form>
      <div className="scout-query-examples">{["Runners under $500k", "Signals detected in the last hour", "Active signals", "Rising tokens today"].map((example) => <button type="button" onClick={() => setQuery(example)} key={example}>{example}</button>)}</div>
      {error ? <ErrorState message={error} /> : null}
      {result ? <section className="scout-panel scout-panel--table"><div className="scout-search-interpretation"><span>Applied filters</span><strong>{result.interpretedAs.maximumMarketCapUsd ? `Cap below ${formatMoney(result.interpretedAs.maximumMarketCapUsd)}` : "Any market cap"}</strong><strong>{result.interpretedAs.detectedSince ? `Since ${formatTime(result.interpretedAs.detectedSince)}` : "Any time"}</strong><strong>{result.interpretedAs.positiveMomentumOnly ? "Positive momentum" : "Any momentum"}</strong></div><SignalTable signals={result.results} compact /></section> : <EmptyState title="Search Runner" body="Search by market cap, time, status, token, or momentum. Every result comes from Runner's recorded signal data." />}
      {!accessToken ? <div className="scout-upgrade-bar"><LockKeyhole size={18} /><div><strong>Signals release publicly after one minute.</strong><p>Verify a qualifying wallet for the immediate feed.</p></div><button type="button" onClick={unlockScout}>Unlock Runner Pro <ArrowRight size={15} /></button></div> : null}
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
      <PageHeading eyebrow="Signal history" title="What Runner found and when." body="Review recorded signals and scores exactly as they were published. No backfilled winners." />
      <div className="scout-overview-grid"><Metric label="Signals recorded" value={completed.length.toLocaleString()} /><Metric label="Active now" value={signals.active ? `$${signals.active.symbol}` : "Waiting"} /><Metric label="Average Momentum Score" value={averageScore === null ? "Awaiting data" : averageScore.toFixed(1)} /><Metric label="Public delay" value={`${signals.publicDelaySeconds}s`} /></div>
      <section className="scout-panel scout-panel--table"><SignalTable signals={completed} /></section>
      <div className="scout-page-note"><ShieldCheck size={17} /><p>Past Runner signals do not guarantee future performance. Token prices can fall rapidly and liquidity can disappear.</p></div>
    </div>
  );
}

export function ReceiptsView() {
  const { stats, signals, state } = useScout();
  return (
    <div className="scout-page">
      <PageHeading eyebrow="Onchain receipts" title="Verify every distribution." body="Each settled holder payout links back to its recorded cycle and transaction." />
      <div className="scout-overview-grid"><Metric label="Settled epochs" value={stats.totalEpochs.toLocaleString()} /><Metric label="Tokens distributed" value={formatToken(stats.totalRewardAirdropped, signals.active?.symbol ?? "tokens")} /><Metric label="SOL value distributed" value={`${stats.totalSolValueAirdropped.toFixed(4)} SOL`} /><Metric label="Eligible holders" value={stats.latestEligibleHolders.toLocaleString()} /></div>
      <section className="scout-panel scout-panel--table"><div className="scout-panel__head"><div><span className="scout-kicker">Epoch history</span><h2>Settled distributions</h2></div><Radio size={20} /></div>
        {state === "loading" ? <Skeleton rows={5} /> : stats.roundHistory.length ? <div className="scout-table-wrap"><table className="scout-table"><thead><tr><th>Epoch</th><th>Started</th><th>Eligible</th><th>Bought</th><th>Distributed</th><th>SOL value</th><th>Status</th><th>Transaction</th></tr></thead><tbody>{stats.roundHistory.map((row) => <tr key={`${row.epoch}-${row.startedAt}`}><td>#{row.epoch}</td><td>{formatTime(row.startedAt)}</td><td>{row.eligibleCount.toLocaleString()}</td><td>{formatToken(row.rewardBought, signals.active?.symbol ?? "tokens")}</td><td>{formatToken(row.distributedPump, signals.active?.symbol ?? "tokens")}</td><td>{row.solValueAirdropped.toFixed(4)} SOL</td><td><StatusBadge label={row.status} /></td><td>{row.txSig ? <a className="scout-icon-link" href={`https://solscan.io/tx/${row.txSig}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a> : "Pending"}</td></tr>)}</tbody></table></div> : <EmptyState title="Awaiting first settled distribution" body="Epochs appear here only after holder payouts are recorded as settled." />}
      </section>
      <section className="scout-panel scout-panel--table"><div className="scout-panel__head"><div><span className="scout-kicker">Wallet feed</span><h2>Recent payouts</h2></div><Users size={20} /></div>{stats.recentRewards.length ? <div className="scout-table-wrap"><table className="scout-table"><thead><tr><th>Wallet</th><th>Epoch</th><th>Amount</th><th>Time</th><th>Status</th><th>Receipt</th></tr></thead><tbody>{stats.recentRewards.map((row, index) => <tr key={`${row.wallet}-${row.epoch}-${index}`}><td>{shortWallet(row.wallet)}</td><td>#{row.epoch}</td><td>{formatToken(row.rewardAmount, signals.active?.symbol ?? "tokens")}</td><td>{formatTime(row.time)}</td><td>{row.status}</td><td>{row.txSig ? <a className="scout-icon-link" href={`https://solscan.io/tx/${row.txSig}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a> : "Pending"}</td></tr>)}</tbody></table></div> : <EmptyState title="No settled wallet payouts" body="Individual wallet receipts will populate after the first completed Runner distribution." />}</section>
    </div>
  );
}

export function ApiView() {
  const [copied, setCopied] = useState(false);
  const endpoint = "/api/scout/v1/runners";
  return (
    <div className="scout-page scout-page--narrow">
      <PageHeading eyebrow="Runner API" title="Use Runner data through the API." body="Fetch current and historical Runner signals for bots, dashboards, alerts, and research tools." />
      <section className="scout-api-hero">
        <div><StatusBadge label="Pilot access" tone="queued" /><h2>Fetch current and historical Runner signals.</h2><p>Use a Runner-issued API key. Public clients never receive database credentials or treasury permissions.</p></div>
        <pre><code>curl -H &quot;x-scout-api-key: $RUNNER_KEY&quot; {endpoint}</code></pre>
        <button type="button" onClick={async () => { await navigator.clipboard.writeText(endpoint); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy endpoint"}</button>
      </section>
      <div className="scout-doc-grid">
        <article><Code2 size={20} /><h3>Signal data</h3><p>Read current and historical signals with scores, market data, risk flags, and timestamps.</p></article>
        <article><Search size={20} /><h3>Search signals</h3><p>Filter by token, market cap, status, momentum, or detection time.</p></article>
        <article><ShieldCheck size={20} /><h3>Protected access</h3><p>Keys are hashed, can expire, and only grant specific read permissions. Treasury routes stay separate.</p></article>
      </div>
      <div className="scout-page-note"><KeyRound size={17} /><p>API access is currently a managed pilot. Self-serve keys and billing are not live yet.</p></div>
    </div>
  );
}

export function PricingView() {
  const plans = [
    { name: "Public", price: "$0", detail: "The released Runner feed, delayed by one minute.", items: ["Public terminal", "Released signal history", "Public receipts"], action: "Open terminal", href: "/terminal", featured: false },
    { name: "Runner Pro", price: `Hold ${formatToken(scoutPublicConfig.minimumHolding, "RUNNER")}`, detail: "Immediate Runner signals for eligible holders.", items: ["Real-time scanner", "Advanced signal search", "Watchlists", "Holder multiplier"], action: "Open terminal", href: "/", featured: true },
    { name: "Runner API", price: "Pilot", detail: "Runner signal data for bots and dashboards.", items: ["API credentials", "Historical signals", "Telegram alerts", "Configurable filters"], action: "Read API docs", href: "/api", featured: false }
  ];
  return (
    <div className="scout-page">
      <PageHeading eyebrow="Access" title="Choose how you access Runner." body="The public feed has a one-minute delay. Eligible holders receive immediate signals. API access is in pilot." />
      <div className="scout-pricing-grid">{plans.map((plan) => <article className={plan.featured ? "is-featured" : ""} key={plan.name}><span className="scout-kicker">{plan.name}</span><h2>{plan.price}</h2><p>{plan.detail}</p><ul>{plan.items.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul><Link className={`scout-button ${plan.featured ? "scout-button--primary" : "scout-button--secondary"}`} href={plan.href}>{plan.action}<ArrowRight size={16} /></Link></article>)}</div>
      <p className="scout-note">Paid subscriptions and self-serve API access are not live yet. Only the access shown above is available.</p>
    </div>
  );
}

export function DocsView() {
  return (
    <div className="scout-page scout-page--docs">
      <PageHeading eyebrow="Documentation" title="How Runner finds and ranks momentum." body="See how signals enter the scanner, how scores are calculated, and how holder access works." />
      <div className="scout-doc-layout">
        <aside><a href="#lifecycle">Signal lifecycle</a><a href="#score">Momentum Score</a><a href="#access">Holder Multiplier</a><a href="#telegram">Telegram</a><a href="#treasury">Treasury</a></aside>
        <div className="scout-doc-content">
          <section id="lifecycle"><span className="scout-kicker">01</span><h2>Signal lifecycle</h2><p>A verified source submits a Solana mint. Runner reads the connected market data, calculates its Momentum Score, ranks it, and records the result. The strongest qualified signal can become the current Runner at the next five-minute cycle. Eligible holders see it immediately; the public feed follows after the configured delay.</p></section>
          <section id="score"><span className="scout-kicker">02</span><h2>Momentum Score</h2><p>The current implementation scores available DexScreener liquidity, volume velocity, recent buy share, one-hour price action, and token age. Holder growth, X, Telegram, narrative, and smart-wallet adapters remain visibly unavailable until connected. The score is never a guarantee.</p></section>
          <section id="access"><span className="scout-kicker">03</span><h2>Holder Multiplier</h2><p>Hold at least {formatToken(scoutPublicConfig.minimumHolding, "RUNNER")} to unlock Runner Pro. The distribution multiplier starts at 1.00x, reaches 1.25x after one day, 1.50x after three days, and 2.00x after seven days of continuous holding. Each eligible five-minute cycle builds the streak. Any balance decrease resets the streak and multiplier to 1.00x; falling below the minimum pauses eligibility.</p></section>
          <section id="telegram"><span className="scout-kicker">04</span><h2>Telegram bot</h2><p>Commands include <code>/runner</code>, <code>/top</code>, <code>/new</code>, <code>/search</code>, <code>/scan</code>, <code>/watch</code>, <code>/unwatch</code>, <code>/performance</code>, and <code>/help</code>. Group alerts can filter by minimum score and maximum market cap. Only allow-listed source channels or administrators can submit treasury signals.</p><pre><code>POST /api/scout/telegram{"\n"}x-telegram-bot-api-secret-token: $TELEGRAM_WEBHOOK_SECRET</code></pre></section>
          <section id="treasury"><span className="scout-kicker">05</span><h2>Treasury boundary</h2><p>When dynamic selection is enabled, the current Runner can enter the reward-token purchase process. Signal selection is verified and repeatable. Treasury actions remain separate from public signal data and holder access.</p></section>
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
      setMessage(payload.activated ? "Signal authenticated and activated." : "Signal authenticated and queued.");
      setMint(""); setName(""); setSymbol(""); await refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Signal submission failed"); }
    finally { setBusy(false); }
  }

  return (
    <div className="scout-page scout-page--narrow">
      <PageHeading eyebrow="Restricted console" title="Add a verified signal." body="Submit a Solana mint to the scanner. Your admin secret stays in this browser session only." action={<StatusBadge label="Protected" tone="risk" />} />
      <section className="scout-panel scout-admin-panel"><div className="scout-panel__head"><div><span className="scout-kicker">Signal intake</span><h2>Queue the next runner</h2></div><Settings2 size={21} /></div>
        <form onSubmit={submit}><label>Admin secret<input type="password" value={secret} onChange={(event) => setSecret(event.target.value)} autoComplete="off" required /></label><label>Solana mint<input value={mint} onChange={(event) => setMint(event.target.value)} placeholder="Runner token mint" required /></label><div className="scout-form-grid"><label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional" /></label><label>Symbol<input value={symbol} onChange={(event) => setSymbol(event.target.value)} placeholder="Optional" /></label></div><label className="scout-checkbox"><input type="checkbox" checked={activate} onChange={(event) => setActivate(event.target.checked)} /><span>Activate for the next epoch after enrichment</span></label><button className="scout-button scout-button--primary" type="submit" disabled={busy}>{busy ? "Authenticating" : "Submit signal"}<Send size={16} /></button>{message ? <p className="scout-admin-message" role="status">{message}</p> : null}</form>
      </section>
      <div className="scout-page-note"><ShieldCheck size={17} /><p>For launch, run the database migration and reset first, keep worker gates off, submit the first runner, verify it here, then enable dynamic selection and the worker gates.</p></div>
    </div>
  );
}

export function TerminalPageView() {
  const { signals, stats, state, error, refresh } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const active = signals.active;
  const factors = active ? [["Liquidity", formatMoney(active.liquidity_usd)], ["24h volume", formatMoney(active.volume_24h_usd)], ["1h movement", formatPercent(Number(active.metrics.change1h ?? Number.NaN))], ["Token age", active.token_age_seconds ? `${Math.max(1, Math.round(active.token_age_seconds / 60))}m` : "Unavailable"]] : [];
  return (
    <div className="scout-page">
      <PageHeading eyebrow="Runner Terminal" title="Track the current Runner." body="See the selected token, Momentum Score, market inputs, and scanner timeline in one view." action={<StatusBadge label={signals.access === "premium" ? "Runner Pro" : "Public feed"} tone={signals.access === "premium" ? "live" : "muted"} />} />
        {state === "loading" ? <Skeleton rows={7} /> : state === "error" && error ? <ErrorState message={error} retry={() => void refresh()} /> : <div className="scout-desk-layout">
        <WalletStatusPanel />
        <section className="scout-panel scout-desk-primary"><div className="scout-terminal-bar"><span><i /> ACTIVE MOMENTUM SIGNAL</span><small>{active ? formatTime(active.detected_at) : "LISTENING"}</small></div>{active ? <><div className="scout-desk-token"><SignalMark signal={active} /><div><span>Current runner</span><h2>${active.symbol}</h2><p>{active.name}</p></div><strong>{active.scout_score ?? "—"}<small>/100</small></strong></div><div className="scout-desk-factors">{factors.map(([label, value]) => <Metric label={label} value={value} key={label} />)}</div><div className="scout-panel__footer"><span>{shortAddress(active.mint)}</span><a href={`https://dexscreener.com/solana/${active.mint}`} target="_blank" rel="noreferrer">Chart <ExternalLink size={14} /></a></div></> : <EmptyState title="Awaiting first Runner signal" body="The scanner is online and waiting for its first verified market signal." />}</section>
        <section className="scout-panel scout-countdown-panel"><span className="scout-kicker">Next five-minute cycle</span><strong>{countdown.label}</strong><p>{countdown.processing ? "The current cycle is processing. The timer resumes at the next confirmed boundary." : "Runner reranks the market and carries the current signal into the next distribution cycle."}</p><i><span style={{ width: `${countdown.progress * 100}%` }} /></i></section>
        <HolderMultiplierPanel />
        <section className="scout-panel scout-panel--feed"><div className="scout-panel__head"><div><span className="scout-kicker">Public timeline</span><h2>Signal events</h2></div><Radio size={20} /></div>{signals.events.length ? <div className="scout-event-list">{signals.events.slice(0, 12).map((event) => <div className="scout-event" key={event.id}><span className="scout-event__rail" /><div><strong>{event.event_type.replaceAll("_", " ")}</strong><p>{formatTime(event.created_at)}</p></div></div>)}</div> : <EmptyState title="No events recorded" body="The first signal lifecycle will appear here." />}</section>
      </div>}
    </div>
  );
}
