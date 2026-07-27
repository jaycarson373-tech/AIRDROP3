"use client";

import Link from "next/link";
import { Activity, ArrowRight, Cat, ExternalLink, Radio, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { cateCall, type CatScannerCall } from "../../lib/cat-scanner-public";
import { scoutPublicConfig, shortAddress } from "../../lib/scout-public";
import { formatClock, formatMoney, formatTime, formatToken, shortWallet } from "./format";
import { useCountdown } from "./hooks";
import { useScout } from "./scout-provider";
import { SignalLogo } from "./signal-logo";
import type { ScoutSignal } from "./types";
import { Metric, PrelaunchNotice, StatusBadge } from "./ui";

function signalMetric(signal: ScoutSignal | null, key: string) {
  const raw = signal?.metrics?.[key];
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function activeName(signal: ScoutSignal | null) {
  return signal ? `$${signal.symbol}` : "No runner selected";
}

function Hero() {
  const { launchState, signals, stats } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const active = signals.active;

  return (
    <section className="cat-hero">
      <div className="cat-hero__grid" aria-hidden="true" />
      <img
        className="cat-hero__banner"
        src="/brand/cat-strategy-banner.jpg"
        alt="Cat Strategy"
      />
      <div className="cat-hero__copy">
        <p className="scout-kicker">CSTR // CAT FAMILY RUNNER STRATEGY</p>
        <h1>Own the cat runner. Do not chase it.</h1>
        <p className="cat-hero__body">
          Cat Strategy tracks cat-token momentum, buys the active cat runner, and drops it to the eligible $CSTR family on five-minute epochs.
        </p>
        <div className="cat-hero__actions">
          {scoutPublicConfig.buyUrl ? (
            <a className="scout-button scout-button--primary" href={scoutPublicConfig.buyUrl} target="_blank" rel="noreferrer">
              Buy $CSTR <ArrowRight size={18} />
            </a>
          ) : null}
          <Link className="scout-button scout-button--secondary" href="/airdrop-history">View Cat Drops</Link>
        </div>
        {launchState === "live" ? (
          <div className="cat-hero__strip">
            <Metric label="Active Cat" value={activeName(active)} />
            <Metric label="Next Drop" value={countdown.label} />
            <Metric label="Eligible" value={stats.latestEligibleHolders.toLocaleString()} />
            <Metric label="Epoch" value={stats.currentEpoch > 0 ? `#${stats.currentEpoch}` : "NOT RECORDED"} />
          </div>
        ) : null}
      </div>

      {launchState === "prelaunch" ? <PrelaunchNotice /> : <div className="cat-live-card">
        <div className="cat-live-card__brand">
          <img src="/brand/cat-strategy-logo.jpg" alt="" />
          <span><strong>CAT STRATEGY</strong><small>CAT META ENGINE</small></span>
        </div>
        <div className="scout-panel__head">
          <div><span className="scout-kicker">Current Strategy</span><h2>{activeName(active)}</h2></div>
          <StatusBadge label={active ? "Active cat" : "Waiting"} tone={active ? "live" : "queued"} />
        </div>
        {active ? (
          <div className="cat-active-signal">
            <SignalLogo signal={active} />
            <div>
              <strong>{active.name}</strong>
              <span>{shortAddress(active.mint, 6, 6)}</span>
            </div>
          </div>
        ) : (
          <div className="cat-empty-target">
            <Cat size={42} />
            <strong>The first runner is selected at launch.</strong>
            <span>The active token appears here once the strategy has a live signal.</span>
          </div>
        )}
        <div className="scout-metric-grid scout-metric-grid--two">
          <Metric label="Price" value={active?.price_usd ? `$${active.price_usd.toPrecision(5)}` : "NOT RECORDED"} />
          <Metric label="Market Cap" value={formatMoney(active?.market_cap_usd)} />
          <Metric label="Liquidity" value={formatMoney(active?.liquidity_usd)} />
          <Metric label="24h Volume" value={formatMoney(active?.volume_24h_usd)} />
        </div>
        <div className="cat-countdown">
          <span>Next holder drop</span>
          <strong>{countdown.label}</strong>
          <i style={{ width: `${Math.round(countdown.progress * 100)}%` }} />
        </div>
      </div>}
    </section>
  );
}

function LiveTreasury() {
  const { launchState, signals, stats, state } = useScout();
  const active = signals.active;
  const countdown = useCountdown(stats.nextDropTime);

  return (
    <section className="scout-section" id="strategy">
      <div className="scout-section__head">
        <span className="scout-kicker">Cat Board</span>
        <h2>Live Cat Strategy</h2>
        <p>The active cat-token runner, holder snapshot, and verified distribution state.</p>
      </div>

      {launchState === "prelaunch" ? <PrelaunchNotice /> : <div className="cat-dashboard">
        <article className="scout-panel cat-dashboard__primary">
          <div className="scout-panel__head">
            <div><span className="scout-kicker">Current Cat Runner</span><h2>{activeName(active)}</h2></div>
            <StatusBadge label={active ? "Selected by Cat Strategy" : state === "loading" ? "Connecting" : "Scanning cats"} tone={active ? "live" : "queued"} />
          </div>
          {active ? (
            <>
              <div className="cat-active-signal cat-active-signal--large">
                <SignalLogo signal={active} />
                <div>
                  <strong>{active.name}</strong>
                  <span>{shortAddress(active.mint, 7, 7)}</span>
                </div>
              </div>
              <div className="scout-metric-grid scout-metric-grid--four">
                <Metric label="Token Price" value={active.price_usd ? `$${active.price_usd.toPrecision(5)}` : "NOT RECORDED"} />
                <Metric label="Market Cap" value={formatMoney(active.market_cap_usd)} />
                <Metric label="Liquidity" value={formatMoney(active.liquidity_usd)} />
                <Metric label="Holders" value={active.holder_count?.toLocaleString() ?? "NOT RECORDED"} />
                <Metric label="Buy Pressure" value={signalMetric(active, "buys1h") ?? "NOT RECORDED"} />
                <Metric label="Cat Score" value={active.scout_score === null ? "NOT RECORDED" : `${active.scout_score}/100`} />
                <Metric label="Selected" value={active.selected_at ? formatTime(active.selected_at) : "NOT RECORDED"} />
                <Metric label="Public Delay" value={`${scoutPublicConfig.publicDelaySeconds}s`} />
              </div>
              <div className="cat-panel-actions">
                <a href={`https://dexscreener.com/solana/${active.mint}`} target="_blank" rel="noreferrer">Chart <ExternalLink size={15} /></a>
                <a href={`https://pump.fun/coin/${active.mint}`} target="_blank" rel="noreferrer">Pump.fun <ExternalLink size={15} /></a>
              </div>
            </>
          ) : (
            <div className="cat-empty-target cat-empty-target--wide">
              <Terminal size={40} />
              <strong>The first runner is selected at launch.</strong>
              <span>Once a cat-token target is selected, this card shows token, chart, snapshot, and drop state.</span>
            </div>
          )}
        </article>

        <aside className="scout-panel cat-dashboard__side">
          <div className="cat-countdown cat-countdown--big">
            <span>Next Cat Drop</span>
            <strong>{countdown.label}</strong>
            <i style={{ width: `${Math.round(countdown.progress * 100)}%` }} />
          </div>
          <div className="scout-metric-grid scout-metric-grid--two">
            <Metric label="Eligible Holders" value={stats.latestEligibleHolders.toLocaleString()} />
            <Metric label="Total Cat Dropped" value={formatToken(stats.totalRewardAirdropped, scoutPublicConfig.rewardSymbol)} />
            <Metric label="SOL Value Dropped" value={`${stats.totalSolValueAirdropped.toLocaleString(undefined, { maximumFractionDigits: 3 })} SOL`} />
            <Metric label="Avg Multiplier" value={stats.averageMultiplier ? `${(stats.averageMultiplier / 10000).toFixed(2)}x` : "1.00x"} />
          </div>
        </aside>
      </div>}
    </section>
  );
}

function formatScannerTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
    timeZoneName: "short"
  }).format(new Date(value));
}

export function CatScanner() {
  const [calls, setCalls] = useState<CatScannerCall[]>([cateCall]);

  useEffect(() => {
    let mounted = true;
    void fetch("/api/cat-scanner", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { calls?: CatScannerCall[] }) => {
        if (mounted && payload.calls?.length) setCalls(payload.calls);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="scout-section cat-scanner-section" id="cat-scanner">
      <div className="scout-section__head">
        <span className="scout-kicker">CAT Scanner</span>
        <h2>Every call. Every receipt.</h2>
        <p>Entry market cap is fixed at call time. Current market cap updates from the verified live pair once its contract is configured. Epoch and distribution totals update from settled receipts.</p>
      </div>
      <div className="cat-scanner-table" role="table" aria-label="Cat Strategy call ledger">
        <div className="cat-scanner-table__head" role="row">
          <span>Call</span><span>Token</span><span>Called</span><span>Entry MC</span><span>Current MC</span><span>Multiple</span><span>Epochs</span><span>Total Airdropped</span><span>Status</span><span />
        </div>
        {calls.map((call, index) => {
          const multiple = call.calledMarketCapUsd > 0 ? call.currentMarketCapUsd / call.calledMarketCapUsd : null;
          return (
            <article className="cat-scanner-row" role="row" key={call.id}>
              <span className="cat-scanner-call">#{String(index + 1).padStart(2, "0")}</span>
              <span className="cat-scanner-token">
                {call.logoUrl ? <img src={call.logoUrl} alt="" referrerPolicy="no-referrer" /> : <i>{call.symbol.slice(0, 2)}</i>}
                <strong>${call.symbol}<small>{call.name}</small></strong>
              </span>
              <time dateTime={call.calledAt}>{formatScannerTime(call.calledAt)}</time>
              <strong>{formatMoney(call.calledMarketCapUsd)}</strong>
              <strong className="cat-scanner-current">{formatMoney(call.currentMarketCapUsd)}<small>{call.currentValueSource.toUpperCase()}</small></strong>
              <strong className="cat-scanner-return">{multiple ? `${multiple.toFixed(1)}x` : "NOT RECORDED"}</strong>
              <strong>{call.epochCount}</strong>
              <strong>{formatToken(call.totalAirdropped, "TOKENS")}</strong>
              <span className="cat-scanner-status">{call.rewardStatus === "next" ? "NEXT REWARD" : "DISTRIBUTED"}</span>
              <span>{call.chartUrl ? <a href={call.chartUrl} target="_blank" rel="noreferrer" aria-label={`Open ${call.symbol} chart`}><ExternalLink size={15} /></a> : null}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["01", "Track cat meta", "Cat Strategy watches the active cat-token lane and keeps one current runner in focus."],
    ["02", "Buy the active cat", "Treasury buyback flow points at the configured reward token for that epoch."],
    ["03", "Snapshot holders", `Wallets holding ${scoutPublicConfig.minimumHolding.toLocaleString()}+ $CSTR are included in the holder snapshot.`],
    ["04", "Drop receipts", "The cat runner is distributed by weight, with settled receipts published onchain."]
  ];
  return (
    <section className="scout-section">
      <div className="scout-section__head">
        <span className="scout-kicker">Mechanic</span>
        <h2>Cat Runner Loop</h2>
      </div>
      <div className="cat-step-grid">
        {steps.map(([number, title, body]) => (
          <article className="scout-panel" key={number}>
            <span className="cat-step-number">{number}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function HolderWeight() {
  const tiers = [
    ["Base", "1.00x"],
    ["15 min", "1.20x"],
    ["1 hour", "1.50x"],
    ["4 hours", "2.00x"],
    ["12 hours", "2.50x"],
    ["1 day", "3.00x"],
    ["3 days", "5.00x"],
    ["1 week", "10.00x"],
    ["1 month", "25.00x"]
  ];
  return (
    <section className="scout-section" id="holders">
      <div className="scout-section__head">
        <span className="scout-kicker">Holder Weight</span>
        <h2>Hold Longer. Weigh Heavier.</h2>
        <p>Selling or transferring resets multiplier progress back to base. It does not permanently ban the wallet.</p>
      </div>
      <div className="cat-tier-grid">
        {tiers.map(([label, value]) => (
          <div className="cat-tier" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ActivityFeed() {
  const { launchState, stats, state, lastUpdated } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const updatedAt = lastUpdated ?? new Date();
  const walletLines = stats.recentRewards.slice(0, 8).map((reward) => ({
    time: formatClock(reward.time),
    status: "CAT DROP SETTLED",
    output: `${shortWallet(reward.wallet)} · ${formatToken(reward.rewardAmount, scoutPublicConfig.rewardSymbol)}`
  }));
  const epochLines = stats.roundHistory.slice(0, 6).map((epoch) => ({
    time: formatClock(epoch.startedAt),
    status: `EPOCH ${epoch.epoch} ${epoch.status.toUpperCase()}`,
    output: `${formatToken(epoch.distributedPump, scoutPublicConfig.rewardSymbol)} · ${epoch.eligibleCount.toLocaleString()} HOLDERS`
  }));
  const settledLines = [...walletLines, ...epochLines].slice(0, 12);
  const lines = settledLines.length
    ? settledLines
    : state === "loading"
      ? [{ time: formatClock(updatedAt), status: "CAT TAPE", output: "CONNECTING TO RECEIPTS" }]
      : state === "error" || state === "stale"
        ? [{ time: formatClock(updatedAt), status: "CAT TAPE", output: "RECONNECTING TO SUPABASE" }]
        : [
            { time: formatClock(updatedAt), status: "CAT TAPE", output: "NO SETTLED CAT DROPS YET" },
            { time: formatClock(updatedAt), status: "NEXT DROP", output: countdown.label }
          ];

  if (launchState === "prelaunch") {
    return <PrelaunchNotice />;
  }

  return (
    <section className="scout-panel scout-panel--feed">
      <div className="scout-panel__head">
        <div><span className="scout-kicker">Live Tape</span><h2>Cat Strategy Feed</h2></div>
        <Activity size={21} aria-hidden="true" />
      </div>
      <div className="runner-terminal-log" aria-label="Live Cat Strategy feed">
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

function ReceiptsPreview() {
  const { stats } = useScout();
  return (
    <section className="scout-section" id="receipts">
      <div className="scout-section__head">
        <span className="scout-kicker">Receipts</span>
        <h2>Onchain Cat Drops</h2>
        <p>Every settled epoch publishes the wallet count, token amount, SOL value, and transaction proof.</p>
      </div>
      <div className="cat-receipt-list">
        {stats.roundHistory.slice(0, 5).map((epoch) => (
          <article className="scout-panel cat-receipt" key={epoch.epoch}>
            <Metric label="Epoch" value={`#${epoch.epoch}`} />
            <Metric label="Tokens" value={formatToken(epoch.distributedPump, scoutPublicConfig.rewardSymbol)} />
            <Metric label="SOL Value" value={`${epoch.solValueAirdropped.toLocaleString(undefined, { maximumFractionDigits: 3 })} SOL`} />
            <Metric label="Holders" value={epoch.eligibleCount.toLocaleString()} />
            {epoch.txSig ? <a href={`https://solscan.io/tx/${epoch.txSig}`} target="_blank" rel="noreferrer">Proof <ExternalLink size={14} /></a> : <span>NOT RECORDED</span>}
          </article>
        ))}
        {!stats.roundHistory.length ? (
          <div className="scout-panel cat-empty-target cat-empty-target--wide">
            <Radio size={36} />
            <strong>The first settled cat epoch appears after launch.</strong>
            <span>Receipts appear here as soon as a distribution is recorded.</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="cat-final-cta">
      <span className="scout-kicker">Cat Meta</span>
      <h2>The next cat runner does not wait.</h2>
      <p>Hold $CSTR, build multiplier weight, and stay eligible for the active cat-token runner drops.</p>
      <div className="cat-hero__actions">
        {scoutPublicConfig.buyUrl ? <a className="scout-button scout-button--primary" href={scoutPublicConfig.buyUrl} target="_blank" rel="noreferrer">Buy $CSTR</a> : null}
        <Link className="scout-button scout-button--secondary" href="/airdrop-history">View Receipts</Link>
      </div>
    </section>
  );
}

export function ScoutTerminalView() {
  return (
    <>
      <Hero />
      <LiveTreasury />
      <CatScanner />
      <HowItWorks />
      <HolderWeight />
      <ActivityFeed />
      <ReceiptsPreview />
      <FinalCta />
    </>
  );
}
