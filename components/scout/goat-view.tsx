"use client";

import { ArrowUpRight, CheckCircle2, Clock3, Coins, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatToken, shortWallet } from "./format";
import { LeaderboardSection } from "./leaderboard-view";
import { explorerTxUrl, projectConfig } from "./project-config";
import { useScout } from "./scout-provider";

const CYCLE_MS = 5 * 60 * 1000;
const AWAITING_FIRST_DRAW = "AWAITING FIRST DRAW";

function pad(value: number) { return String(value).padStart(2, "0"); }
function clockLabel(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

function ActionLink({ href, children, solid = false }: { href: string | null; children: React.ReactNode; solid?: boolean }) {
  const className = `goat-button${solid ? " goat-button--solid" : ""}${href ? "" : " is-disabled"}`;
  if (!href) return <span className={className} aria-disabled="true">{children}</span>;
  const external = href.startsWith("http");
  return <a className={className} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{children}</a>;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="goat-stat"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function MoneyRain() {
  return <div className="pump-money-rain" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index}>$</i>)}</div>;
}

export function PumpMoneyView() {
  const { launchState, stats, state, lastUpdated } = useScout();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const remaining = now === null ? CYCLE_MS : CYCLE_MS - (now % CYCLE_MS);
  const progress = now === null ? 0 : (now % CYCLE_MS) / CYCLE_MS;
  const live = launchState === "live" && state !== "error";
  const hasSettledDraw = stats.totalEpochs > 0;
  const indexTime = useMemo(
    () => lastUpdated?.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "PRELAUNCH",
    [lastUpdated]
  );
  const eligibilityLabel = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL?.trim() || "SET AT LAUNCH";
  const buyUrl = projectConfig.buyUrl || (projectConfig.pumpMoneyMint ? `https://jup.ag/swap/SOL-${projectConfig.pumpMoneyMint}` : null);
  const pumpBreakdown = stats.rewardBreakdown.find((entry) => entry.asset.trim().toUpperCase() === "PUMP");
  const totalPump = pumpBreakdown && pumpBreakdown.transfers > 0 && pumpBreakdown.total > 0
    ? formatToken(pumpBreakdown.total, "PUMP")
    : AWAITING_FIRST_DRAW;
  const latestReceipt = stats.recentRewards.find((receipt) => Boolean(receipt.txSig));

  return (
    <div className="goat-home pump-money-home">
      <section className="goat-hero pump-money-hero" id="draw">
        <img className="goat-hero__backdrop" src="/brand/pump-money-hero.png" alt="Mint-green Pump Money bills moving through a digital market" />
        <div className="goat-hero__shade" aria-hidden="true" />
        <MoneyRain />
        <div className="goat-hero__copy">
          <div className="goat-eyebrow"><i /> EVERY FIVE MINUTES</div>
          <h1>PUMP<br /><span>MONEY.</span></h1>
          <p className="goat-hero__subhead">Hold PUMP. Ten holders get paid.</p>
          <div className="goat-hero__body">
            <p>Every five minutes, Pump Money selects ten eligible holders and splits the PUMP reward pool equally.</p>
            <p className="goat-hero__quote">MORE BALANCE. MORE TIME. LESS SELLING. MORE WEIGHT.</p>
            <p>No wallet connect. No claim forms. Settled onchain receipts only.</p>
          </div>
          <div className="goat-hero__actions">
            <ActionLink href={buyUrl} solid>BUY PUMP MONEY <ArrowUpRight size={15} /></ActionLink>
            <ActionLink href="#terminal">VIEW LIVE DRAW</ActionLink>
          </div>
          <div className="goat-hero__proof">
            <span>WEIGHTED HOLDER DRAW</span>
            <strong>10 WINNERS. EQUAL SHARES.</strong>
            <small>SELECTION WEIGHT REWARDS BALANCE + CONTINUOUS HOLDING.</small>
          </div>
        </div>

        <div className="goat-engine" id="terminal">
          <div className="goat-engine__head"><span><i /> PUMP MONEY ENGINE</span><strong>{live ? "ONLINE" : "PRELAUNCH"}</strong></div>
          <div className="goat-engine__clock">
            <span>NEXT HOLDER DRAW</span>
            <strong className={live ? undefined : "is-awaiting"}>{live ? clockLabel(remaining) : AWAITING_FIRST_DRAW}</strong>
            <small>{live ? "FIVE-MINUTE UTC CYCLE" : "WORKER NOT ACTIVE"}</small>
          </div>
          <div className="goat-split pump-draw-grid" aria-label="Ten holder draw with equal PUMP shares">
            <article><span>ELIGIBLE POOL</span><strong>{live && stats.latestEligibleHolders > 0 ? stats.latestEligibleHolders.toLocaleString() : "—"}</strong><small>VERIFIED HOLDERS</small></article>
            <div className="goat-split__axis"><i /><b>→</b><i /></div>
            <article><span>WINNERS</span><strong>10</strong><small>EQUAL PUMP SHARES</small></article>
          </div>
          <div className="goat-engine__flow"><span>SNAPSHOT</span><i>→</i><span>WEIGHT</span><i>→</i><span>DRAW 10</span><i>→</i><span>DISTRIBUTE</span></div>
          <div className="goat-engine__metrics">
            <div><span>NEXT DRAW</span><strong>{live ? clockLabel(remaining) : AWAITING_FIRST_DRAW}</strong></div>
            <div><span>REWARD</span><strong>PUMP</strong></div>
            <div><span>WINNERS PER DRAW</span><strong>10</strong></div>
            <div><span>WINNER ALLOCATION</span><strong>EQUAL SHARE</strong></div>
            <div><span>TOTAL PUMP DISTRIBUTED</span><strong>{totalPump}</strong></div>
            <div><span>TOTAL HOLDERS REWARDED</span><strong>{stats.totalHoldersRewarded > 0 ? stats.totalHoldersRewarded.toLocaleString() : AWAITING_FIRST_DRAW}</strong></div>
            <div><span>HOLDER THRESHOLD</span><strong>{eligibilityLabel}</strong></div>
            <div><span>LATEST TX</span>{latestReceipt?.txSig ? <a href={explorerTxUrl(latestReceipt.txSig)} target="_blank" rel="noopener noreferrer">{shortWallet(latestReceipt.txSig)} <ArrowUpRight size={11} /></a> : <strong>{AWAITING_FIRST_DRAW}</strong>}</div>
          </div>
          <div className="goat-engine__progress"><i style={{ width: `${live ? progress * 100 : 0}%` }} /></div>
          <div className="goat-engine__foot"><span>INDEX {hasSettledDraw ? indexTime : "PRELAUNCH"}</span><span>REAL RECEIPTS ONLY</span></div>
        </div>
      </section>

      <section className="goat-stats" aria-label="Pump Money status">
        <Stat label="STATUS" value={live ? "ONLINE" : "PRELAUNCH"} note="WORKER-GATED" />
        <Stat label="DRAW CYCLE" value="05:00" note="UTC BOUNDARY" />
        <Stat label="WINNERS" value="10" note="UNIQUE HOLDERS" />
        <Stat label="PAYOUT" value="EQUAL" note="PUMP TOKEN SHARES" />
      </section>

      <section className="goat-mechanism" id="mechanism">
        <div className="goat-section-head">
          <span>HOW IT WORKS</span>
          <h2>HOLD LONGER.<br />GET MORE WEIGHT.</h2>
          <p>Every five minutes, a verified holder snapshot enters a weighted draw. Balance and continuous holding improve selection weight. Detected selling reduces or ends eligibility under the published holder policy.</p>
        </div>
        <div className="goat-steps">
          <article><span>01</span><Clock3 /><strong>HOLD</strong><p>Hold the Pump Money token in your wallet.</p></article>
          <article><span>02</span><ShieldCheck /><strong>SNAPSHOT</strong><p>The worker verifies the eligible holder set.</p></article>
          <article><span>03</span><Coins /><strong>DRAW TEN</strong><p>Ten unique wallets are selected by weighted draw.</p></article>
          <article><span>04</span><CheckCircle2 /><strong>PAY EQUALLY</strong><p>The PUMP pool splits equally across the winners.</p></article>
        </div>
        <p className="goat-mechanism__rule">SELECTION WEIGHT FAVORS LARGER BALANCES, LONGER CONTINUOUS HOLDS, AND WALLETS WITHOUT DETECTED SELLING. NO GUARANTEED WINNERS.</p>
      </section>

      <section className="goat-cinematic pump-money-cinematic" aria-label="Pump Money never stops">
        <img src="/brand/pump-money-hero.png" alt="Pump Money digital market with raining bills" width={1536} height={1024} />
        <div><span>THE MONEY KEEPS MOVING</span><strong>EVERY FIVE MINUTES.</strong></div>
      </section>

      <LeaderboardSection />

      <section className="goat-final pump-money-final">
        <img src="/brand/pump-money-logo.png" alt="Pump Money dollar-bill pump" width={220} height={220} />
        <span>PUMP MONEY</span>
        <h2>HOLD.<br />GET DRAWN.</h2>
        <p>Ten holders. Equal PUMP shares. Every five minutes.</p>
      </section>
    </div>
  );
}
