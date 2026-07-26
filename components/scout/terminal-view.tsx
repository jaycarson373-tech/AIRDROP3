"use client";

import Link from "next/link";
import { Activity, ArrowRight, Cat, ExternalLink, Radio, Terminal } from "lucide-react";
import { scoutPublicConfig, shortAddress } from "../../lib/scout-public";
import { formatClock, formatMoney, formatTime, formatToken, shortWallet } from "./format";
import { useCountdown } from "./hooks";
import { useScout } from "./scout-provider";
import { SignalLogo } from "./signal-logo";
import type { ScoutSignal } from "./types";
import { Metric, StatusBadge } from "./ui";

function signalMetric(signal: ScoutSignal | null, key: string) {
  const raw = signal?.metrics?.[key];
  if (raw === null || raw === undefined || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function activeName(signal: ScoutSignal | null) {
  return signal ? `$${signal.symbol}` : "Awaiting cat runner";
}

function Hero() {
  const { signals, stats, state } = useScout();
  const countdown = useCountdown(stats.nextDropTime);
  const active = signals.active;

  return (
    <section className="cat-hero">
      <div className="cat-hero__grid" aria-hidden="true" />
      <div className="cat-orbit" aria-hidden="true">
        <span>CAT</span><span>CSTR</span><span>MEOW</span><span>RUN</span>
      </div>
      <div className="cat-hero__copy">
        <StatusBadge label={state === "loading" ? "Cat strat starting" : "Cat strat online"} />
        <img className="cat-hero__logo" src="/brand/cat-strat-mark.svg" alt="Cat Strat" />
        <p className="scout-kicker">CSTR CAT RUNNER META</p>
        <h1>Own the cat runner. Do not chase it.</h1>
        <p className="cat-hero__body">
          Cat Strat tracks cat-token momentum, buys the active cat runner, and drops it to eligible $CSTR holders on five-minute epochs.
        </p>
        <div className="cat-hero__actions">
          {scoutPublicConfig.buyUrl ? (
            <a className="scout-button scout-button--primary" href={scoutPublicConfig.buyUrl} target="_blank" rel="noreferrer">
              Buy $CSTR <ArrowRight size={18} />
            </a>
          ) : (
            <button className="scout-button scout-button--primary" type="button" disabled>Buy link pending</button>
          )}
          <Link className="scout-button scout-button--secondary" href="/airdrop-history">View Cat Drops</Link>
        </div>
        <div className="cat-hero__strip">
          <Metric label="Active Cat" value={activeName(active)} />
          <Metric label="Next Drop" value={countdown.label} />
          <Metric label="Eligible" value={stats.latestEligibleHolders.toLocaleString()} />
          <Metric label="Epoch" value={stats.currentEpoch > 0 ? `#${stats.currentEpoch}` : "--"} />
        </div>
      </div>

      <div className="cat-live-card">
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
            <strong>Awaiting first cat runner</strong>
            <span>The active token appears here once the strategy has a live signal.</span>
          </div>
        )}
        <div className="scout-metric-grid scout-metric-grid--two">
          <Metric label="Price" value={active?.price_usd ? `$${active.price_usd.toPrecision(5)}` : "Pending"} />
          <Metric label="Market Cap" value={formatMoney(active?.market_cap_usd)} />
          <Metric label="Liquidity" value={formatMoney(active?.liquidity_usd)} />
          <Metric label="24h Volume" value={formatMoney(active?.volume_24h_usd)} />
        </div>
        <div className="cat-countdown">
          <span>Next holder drop</span>
          <strong>{countdown.label}</strong>
          <i style={{ width: `${Math.round(countdown.progress * 100)}%` }} />
        </div>
      </div>
    </section>
  );
}

function LiveTreasury() {
  const { signals, stats, state } = useScout();
  const active = signals.active;
  const countdown = useCountdown(stats.nextDropTime);

  return (
    <section className="scout-section" id="strategy">
      <div className="scout-section__head">
        <span className="scout-kicker">Cat Board</span>
        <h2>Live Cat Strategy</h2>
        <p>The active cat-token runner, holder snapshot, and verified distribution state.</p>
      </div>

      <div className="cat-dashboard">
        <article className="scout-panel cat-dashboard__primary">
          <div className="scout-panel__head">
            <div><span className="scout-kicker">Current Cat Runner</span><h2>{activeName(active)}</h2></div>
            <StatusBadge label={active ? "Selected by Cat Strat" : state === "loading" ? "Starting" : "Scanning cats"} tone={active ? "live" : "queued"} />
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
                <Metric label="Token Price" value={active.price_usd ? `$${active.price_usd.toPrecision(5)}` : "Unavailable"} />
                <Metric label="Market Cap" value={formatMoney(active.market_cap_usd)} />
                <Metric label="Liquidity" value={formatMoney(active.liquidity_usd)} />
                <Metric label="Holders" value={active.holder_count?.toLocaleString() ?? "Unavailable"} />
                <Metric label="Buy Pressure" value={signalMetric(active, "buys1h") ?? "Unavailable"} />
                <Metric label="Cat Score" value={active.scout_score === null ? "--" : `${active.scout_score}/100`} />
                <Metric label="Selected" value={active.selected_at ? formatTime(active.selected_at) : "Pending"} />
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
              <strong>Strategy is live. Cat runner pending.</strong>
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
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["01", "Track cat meta", "Cat Strat watches the active cat-token lane and keeps one current runner in focus."],
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
  const { stats, state, lastUpdated } = useScout();
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
      ? [{ time: formatClock(updatedAt), status: "CAT TAPE", output: "LOADING SETTLED RECEIPTS" }]
      : state === "error" || state === "stale"
        ? [{ time: formatClock(updatedAt), status: "CAT TAPE", output: "RECONNECTING TO SUPABASE" }]
        : [
            { time: formatClock(updatedAt), status: "CAT TAPE", output: "AWAITING FIRST SETTLED CAT DROP" },
            { time: formatClock(updatedAt), status: "NEXT DROP", output: countdown.label }
          ];
  return (
    <section className="scout-panel scout-panel--feed">
      <div className="scout-panel__head">
        <div><span className="scout-kicker">Live Tape</span><h2>Cat Strat Feed</h2></div>
        <Activity size={21} aria-hidden="true" />
      </div>
      <div className="runner-terminal-log" aria-label="Live Cat Strat feed">
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
            {epoch.txSig ? <a href={`https://solscan.io/tx/${epoch.txSig}`} target="_blank" rel="noreferrer">Proof <ExternalLink size={14} /></a> : <span>Pending proof</span>}
          </article>
        ))}
        {!stats.roundHistory.length ? (
          <div className="scout-panel cat-empty-target cat-empty-target--wide">
            <Radio size={36} />
            <strong>Awaiting first settled cat epoch.</strong>
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
      <HowItWorks />
      <HolderWeight />
      <ActivityFeed />
      <ReceiptsPreview />
      <FinalCta />
    </>
  );
}
