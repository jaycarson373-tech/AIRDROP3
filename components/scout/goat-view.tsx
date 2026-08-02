"use client";

import { ArrowUpRight, CheckCircle2, Clock3, Coins, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatToken, shortWallet } from "./format";
import { useScout } from "./scout-provider";

const CYCLE_MS = 5 * 60 * 1000;
const AWAITING_LAUNCH = "Awaiting launch.";
const POORGOAT_X_URL = "https://x.com/PoorGoat_";
const POORGOAT_PUBLIC_WALLET_URL = "https://solscan.io/account/HDixbrzwwLXczhDBk1JVrurPQsuLE8FUKnW2pucSXN3o";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function clockLabel(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="goat-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function ActionLink({ href, children, solid = false }: { href: string | null; children: React.ReactNode; solid?: boolean }) {
  const className = `goat-button${solid ? " goat-button--solid" : ""}${href ? "" : " is-disabled"}`;
  if (!href) return <span className={className} aria-disabled="true">{children}</span>;
  return <a className={className} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{children}</a>;
}

export function GoatTerminalView() {
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
  const indexTime = useMemo(
    () => lastUpdated?.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "AWAITING LAUNCH",
    [lastUpdated]
  );
  const eligibilityLabel = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL?.trim() || "SET AFTER SUPPLY CONFIRMATION";
  const sourceMint = process.env.NEXT_PUBLIC_CA?.trim() || process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT?.trim();
  const configuredBuyUrl = process.env.NEXT_PUBLIC_BUY_URL?.trim();
  const buyUrl = configuredBuyUrl || (sourceMint ? `https://jup.ag/swap/SOL-${sourceMint}` : null);
  const portfolioWalletUrl = process.env.NEXT_PUBLIC_POORGOAT_WALLET_URL?.trim() || POORGOAT_PUBLIC_WALLET_URL;

  const rewardTotal = (symbol: "ANSEM" | "CATE") => {
    const row = stats.rewardBreakdown.find((entry) => entry.asset.trim().toUpperCase() === symbol);
    return row && row.transfers > 0 && row.total > 0 ? formatToken(row.total, symbol) : AWAITING_LAUNCH;
  };

  const latestReceipt = stats.recentRewards.find((receipt) => Boolean(receipt.txSig));
  const latestTx = latestReceipt?.txSig ?? null;

  return (
    <div className="goat-home">
      <section className="goat-hero" id="distribution">
        <img className="goat-hero__backdrop" src="/brand/goat-hero.jpg" alt="" aria-hidden="true" />
        <div className="goat-hero__shade" aria-hidden="true" />
        <div className="goat-hero__copy">
          <div className="goat-eyebrow"><i /> THE GOAT THESIS</div>
          <h1>THE GOAT OF<br /><span>THE CYCLE.</span></h1>
          <p className="goat-hero__subhead">Hold the GOAT.<br />Receive the GOAT&apos;s biggest convictions.</p>
          <div className="goat-hero__body">
            <p><a href={POORGOAT_X_URL} target="_blank" rel="noreferrer">Poor Goat</a> became one of the most recognizable portfolios on Crypto Twitter this cycle.</p>
            <p>GOAT celebrates the meme with monthly reward drops inspired by his highest-conviction holdings.</p>
          </div>
          <div className="goat-hero__actions">
            <ActionLink href={buyUrl} solid>BUY GOAT <ArrowUpRight size={15} /></ActionLink>
            <ActionLink href="#terminal">VIEW GOAT TERMINAL</ActionLink>
          </div>
          <div className="goat-hero__proof">
            <span>THE GOAT OF THE CYCLE</span>
            <strong>CONVICTION COMPOUNDS.</strong>
            <small>MONTHLY CONVICTION. TRANSPARENT ON-CHAIN REWARDS.</small>
          </div>
        </div>

        <div className="goat-engine" id="terminal">
          <div className="goat-engine__head">
            <span><i /> GOAT TERMINAL</span>
            <strong>{live ? "ONLINE" : "PRELAUNCH"}</strong>
          </div>
          <div className="goat-engine__clock">
            <span>NEXT 50 / 50 DISTRIBUTION</span>
            <strong className={live ? undefined : "is-awaiting"}>{live ? clockLabel(remaining) : AWAITING_LAUNCH}</strong>
            <small>{live ? "FIVE-MINUTE UTC CYCLE" : AWAITING_LAUNCH.toUpperCase()}</small>
          </div>
          <div className="goat-split" aria-label="Reward allocation: 50 percent ANSEM and 50 percent CATE">
            <article>
              <span>01 / ANSEM</span>
              <strong>50%</strong>
              <small>OF EACH REWARD BUDGET</small>
            </article>
            <div className="goat-split__axis"><i /><b>50 / 50</b><i /></div>
            <article>
              <span>02 / CATE</span>
              <strong>50%</strong>
              <small>OF EACH REWARD BUDGET</small>
            </article>
          </div>
          <div className="goat-engine__flow">
            <span>SNAPSHOT</span><i>→</i><span>CLAIM</span><i>→</i><span>SPLIT</span><i>→</i><span>DISTRIBUTE</span>
          </div>
          <div className="goat-engine__metrics">
            <div><span>TOTAL CATE DROPPED</span><strong>{rewardTotal("CATE")}</strong></div>
            <div><span>TOTAL ANSEM DROPPED</span><strong>{rewardTotal("ANSEM")}</strong></div>
            <div><span>NEXT EPOCH</span><strong>{live ? clockLabel(remaining) : AWAITING_LAUNCH}</strong></div>
            <div>
              <span>LATEST TX</span>
              {latestTx ? <a href={`https://solscan.io/tx/${latestTx}`} target="_blank" rel="noreferrer">{shortWallet(latestTx)} <ArrowUpRight size={11} /></a> : <strong>{AWAITING_LAUNCH}</strong>}
            </div>
          </div>
          <div className="goat-engine__progress"><i style={{ width: `${live ? progress * 100 : 0}%` }} /></div>
          <div className="goat-engine__foot">
            <span>INDEX {indexTime}</span>
            <span>{live ? "REAL RECEIPTS ONLY" : "WORKER GATED"}</span>
          </div>
        </div>
      </section>

      <section className="goat-stats" aria-label="GOAT protocol status">
        <Stat label="EPOCH" value="05:00" note="AUTOMATIC UTC BOUNDARY" />
        <Stat label="REWARD SPLIT" value="50 / 50" note="$ANSEM + $CATE" />
        <Stat
          label="SETTLED EPOCHS"
          value={stats.totalEpochs > 0 ? stats.totalEpochs.toLocaleString() : AWAITING_LAUNCH}
          note="VERIFIED TRANSACTIONS ONLY"
        />
        <Stat
          label="HOLDER THRESHOLD"
          value={eligibilityLabel}
          note="FINALIZED WHEN SUPPLY IS PROVIDED"
        />
      </section>

      <section className="goat-mechanism" id="mechanism">
        <div className="goat-section-head">
          <span>THE MECHANISM</span>
          <h2>HOLD THE GOAT.<br />RECEIVE THE CONVICTIONS.</h2>
          <p>No wallet connection. No signing. No claim transaction. Eligibility comes from the on-chain GOAT holder snapshot.</p>
        </div>
        <div className="goat-steps">
          <article><span>01</span><Clock3 /><strong>FIVE-MINUTE SNAPSHOT</strong><p>The worker reads the live holder set at each UTC boundary.</p></article>
          <article><span>02</span><Coins /><strong>REWARD BUDGET SPLITS</strong><p>Exactly half routes to ANSEM and half routes to CATE.</p></article>
          <article><span>03</span><ShieldCheck /><strong>PRO-RATA ALLOCATION</strong><p>Both reward assets are allocated across the same eligible GOAT holder set.</p></article>
          <article><span>04</span><CheckCircle2 /><strong>RECEIPTS PUBLISH</strong><p>Amounts appear publicly only after the transactions settle on Solana.</p></article>
        </div>
      </section>

      <section className="goat-origins" id="origins">
        <div className="goat-origins__intro">
          <span>ORIGINS</span>
          <h2>DOGE + GOAT.<br />A DECADE IN THE MAKING.</h2>
        </div>
        <div className="goat-origins__story">
          <p>In 2014, Dogecoin co-creator Jackson Palmer created a GitHub repository called doge4goat.</p>
          <p>Its message was simple:</p>
          <blockquote>&ldquo;Doge + Goat = a better world.&rdquo;</blockquote>
          <p>More than a decade later...</p>
          <strong>GOAT finally gets its coin.</strong>
          <div className="goat-origins__actions">
            <a className="goat-button" href="https://web.archive.org/web/20150415202948/https://github.com/ummjackson" target="_blank" rel="noreferrer">VIEW JACKSON PALMER ARCHIVE <ArrowUpRight size={13} /></a>
            <a className="goat-button" href="https://web.archive.org/web/20180611025950/https://github.com/ummjackson/doge4goat" target="_blank" rel="noreferrer">VIEW DOGE4GOAT ARCHIVE <ArrowUpRight size={13} /></a>
          </div>
        </div>
      </section>

      <section className="goat-cinematic" aria-label="The GOAT of the cycle">
        <img src="/brand/goat-divider.jpg" alt="GOAT seated on a throne before the herd" width={1280} height={720} />
        <div><span>THE GOAT OF THE CYCLE</span><strong>CONVICTION COMPOUNDS.</strong></div>
      </section>

      <section className="goat-lore" id="portfolio">
        <div className="goat-lore__mark">
          <img src="/brand/goat-logo.png" alt="GOAT emblem" width={1254} height={1254} />
        </div>
        <div className="goat-lore__copy">
          <span>POOR GOAT / THE PORTFOLIO</span>
          <h2>THE GOAT</h2>
          <div className="goat-lore__proof">
            <span>THE RUN</span>
            <strong>$0 <i>→</i> $2M</strong>
            <small>IN TWO MONTHS</small>
          </div>
          <p>From zero to $2 million in two months. Poor Goat turned conviction into one of the most recognizable portfolios on Crypto Twitter.</p>
          <p>His highest-conviction positions in CATE and ANSEM became the thesis behind GOAT.</p>
          <p>The timeline crowned the GOAT.</p>
          <p>GOAT gave him the coin.</p>
          <div className="goat-lore__action">
            <ActionLink href={portfolioWalletUrl} solid>VIEW PUBLIC WALLET <ArrowUpRight size={13} /></ActionLink>
            <ActionLink href={POORGOAT_X_URL}>FOLLOW @POORGOAT_ <ArrowUpRight size={13} /></ActionLink>
          </div>
        </div>
      </section>

      <section className="goat-final">
        <span>THE GOAT OF THE CYCLE</span>
        <h2>CONVICTION<br />COMPOUNDS.</h2>
        <p>Hold the GOAT. Receive the GOAT&apos;s biggest convictions.</p>
      </section>
    </div>
  );
}
