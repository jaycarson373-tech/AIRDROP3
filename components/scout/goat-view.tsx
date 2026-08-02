"use client";

import { ArrowUpRight, CheckCircle2, Clock3, Coins, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatToken, shortWallet } from "./format";
import { LeaderboardSection } from "./leaderboard-view";
import { explorerTxUrl, projectConfig } from "./project-config";
import { useScout } from "./scout-provider";

const CYCLE_MS = 5 * 60 * 1000;
const AWAITING_FIRST_EPOCH = "AWAITING FIRST EPOCH";

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
  return <a className={className} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>{children}</a>;
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
  const eligibilityLabel = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL?.trim() || AWAITING_FIRST_EPOCH;
  const buyUrl = projectConfig.buyUrl || (projectConfig.goatMint ? `https://jup.ag/swap/SOL-${projectConfig.goatMint}` : null);
  const hasSettledEpoch = stats.totalEpochs > 0;

  const rewardTotal = (symbol: "ANSEM" | "CATE") => {
    const row = stats.rewardBreakdown.find((entry) => entry.asset.trim().toUpperCase() === symbol);
    return row && row.transfers > 0 && row.total > 0 ? formatToken(row.total, symbol) : AWAITING_FIRST_EPOCH;
  };

  const latestReceipt = stats.recentRewards.find((receipt) => Boolean(receipt.txSig));
  const latestTx = latestReceipt?.txSig ?? null;

  return (
    <div className="goat-home">
      <section className="goat-hero" id="distribution">
        <img className="goat-hero__backdrop" src="/brand/goat-hero.jpg" alt="" aria-hidden="true" />
        <div className="goat-hero__shade" aria-hidden="true" />
        <div className="goat-hero__copy">
          <div className="goat-eyebrow"><i /> THE 2026 GOAT COIN</div>
          <h1>A GOAT EMERGED<br /><span>ONCHAIN.</span></h1>
          <p className="goat-hero__subhead">Hold GOAT. Receive the GOAT&apos;s conviction plays.</p>
          <div className="goat-hero__body">
            <p>Back in 2014, Dogecoin co-creator Jackson Palmer created doge4goat with one line:</p>
            <p className="goat-hero__quote">&ldquo;doge + goat = a better world.&rdquo;</p>
            <p>More than a decade later, Poor Goat became one of the main characters of this cycle through his conviction in ANSEM and CATE. Now comes the 2026 Goat Coin.</p>
          </div>
          <div className="goat-hero__actions">
            <ActionLink href={buyUrl} solid>BUY GOAT <ArrowUpRight size={15} /></ActionLink>
            <ActionLink href="#terminal">VIEW GOAT TERMINAL</ActionLink>
          </div>
          {projectConfig.poorGoatXUrl ? <a className="goat-hero__follow" href={projectConfig.poorGoatXUrl} target="_blank" rel="noopener noreferrer">FOLLOW POOR GOAT <ArrowUpRight size={12} /></a> : null}
          <div className="goat-hero__proof">
            <span>THE 2026 GOAT COIN</span>
            <strong>THE GOAT FINALLY GOT HIS COIN.</strong>
            <small>INSPIRED BY POOR GOAT&apos;S CONVICTION PLAYS.</small>
          </div>
        </div>

        <div className="goat-engine" id="terminal">
          <div className="goat-engine__head">
            <span><i /> GOAT TERMINAL</span>
            <strong>{live ? "ONLINE" : "PRELAUNCH"}</strong>
          </div>
          <div className="goat-engine__clock">
            <span>NEXT 50 / 50 DISTRIBUTION</span>
            <strong className={live ? undefined : "is-awaiting"}>{live ? clockLabel(remaining) : AWAITING_FIRST_EPOCH}</strong>
            <small>{live ? "FIVE-MINUTE UTC CYCLE" : "PRELAUNCH"}</small>
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
            <span>SNAPSHOT</span><i>→</i><span>QUALIFY</span><i>→</i><span>SPLIT</span><i>→</i><span>DISTRIBUTE</span>
          </div>
          <div className="goat-engine__metrics">
            <div><span>NEXT EPOCH</span><strong>{live ? clockLabel(remaining) : AWAITING_FIRST_EPOCH}</strong></div>
            <div><span>CURRENT SPLIT</span><strong>50% ANSEM / 50% CATE</strong></div>
            <div><span>TOTAL ANSEM DISTRIBUTED</span><strong>{rewardTotal("ANSEM")}</strong></div>
            <div><span>TOTAL CATE DISTRIBUTED</span><strong>{rewardTotal("CATE")}</strong></div>
            <div><span>TOTAL HOLDERS REWARDED</span><strong>{stats.totalHoldersRewarded > 0 ? stats.totalHoldersRewarded.toLocaleString() : AWAITING_FIRST_EPOCH}</strong></div>
            <div>
              <span>LATEST TX</span>
              {latestTx ? <a href={explorerTxUrl(latestTx)} target="_blank" rel="noopener noreferrer">{shortWallet(latestTx)} <ArrowUpRight size={11} /></a> : <strong>{AWAITING_FIRST_EPOCH}</strong>}
            </div>
            <div><span>HOLDER THRESHOLD</span><strong>{eligibilityLabel}</strong></div>
            <div><span>LAST UPDATED</span><strong>{hasSettledEpoch ? indexTime : AWAITING_FIRST_EPOCH}</strong></div>
          </div>
          <div className="goat-engine__progress"><i style={{ width: `${live ? progress * 100 : 0}%` }} /></div>
          <div className="goat-engine__foot">
            <span>INDEX {indexTime}</span>
            <span>{live ? "REAL RECEIPTS ONLY" : "WORKER GATED"}</span>
          </div>
        </div>
      </section>

      <section className="goat-stats" aria-label="GOAT protocol status">
        <Stat label="STATUS" value={live ? "ONLINE" : "PRELAUNCH"} note="WORKER-GATED" />
        <Stat label="EPOCH" value="05:00" note="AUTOMATIC UTC BOUNDARY" />
        <Stat label="CURRENT SPLIT" value="50 / 50" note="$ANSEM + $CATE" />
        <Stat label="HOLDER THRESHOLD" value={eligibilityLabel} note="ONCHAIN SNAPSHOT RULE" />
      </section>

      <section className="goat-mechanism" id="mechanism">
        <div className="goat-section-head">
          <span>THE MECHANISM</span>
          <h2>HOLD GOAT.<br />RECEIVE ANSEM + CATE.</h2>
          <p>Every five minutes, the reward budget splits evenly between ANSEM and CATE and routes to eligible GOAT holders. No claim page. No manual forms. Real onchain receipts only.</p>
        </div>
        <div className="goat-steps">
          <article><span>01</span><Clock3 /><strong>HOLD GOAT</strong><p>Holding GOAT is the entry.</p></article>
          <article><span>02</span><ShieldCheck /><strong>SNAPSHOT</strong><p>The worker reads the eligible holder set every five minutes.</p></article>
          <article><span>03</span><Coins /><strong>SPLIT</strong><p>The reward budget splits 50 / 50 between ANSEM and CATE.</p></article>
          <article><span>04</span><CheckCircle2 /><strong>DISTRIBUTE</strong><p>Settled rewards route to eligible holders and receipts publish onchain.</p></article>
        </div>
        <p className="goat-mechanism__rule">NEVER-SELL RULE: ANY DETECTED BALANCE DECREASE ENDS ELIGIBILITY. MODEST HOLDING WEIGHT: 1.05× / 1 DAY · 1.10× / 3 DAYS · 1.20× / 7 DAYS · 1.35× / 30 DAYS.</p>
      </section>

      <section className="goat-origins" id="origins">
        <div className="goat-origins__intro">
          <span>2014 → 2026</span>
          <h2>DOGE + GOAT =<br />A BETTER WORLD.</h2>
        </div>
        <div className="goat-origins__story">
          <p>In 2014, Dogecoin co-creator Jackson Palmer created a GitHub repository called doge4goat.</p>
          <p>Its message was simple:</p>
          <blockquote>&ldquo;Doge + Goat = a better world.&rdquo;</blockquote>
          <p>More than a decade later, a new GOAT emerged onchain.</p>
          <strong>Now comes the 2026 Goat Coin.</strong>
          <div className="goat-origins__actions">
            <a className="goat-button" href="https://web.archive.org/web/20150415202948/https://github.com/ummjackson" target="_blank" rel="noopener noreferrer">VIEW JACKSON PALMER ARCHIVE <ArrowUpRight size={13} /></a>
            <a className="goat-button" href="https://web.archive.org/web/20180611025950/https://github.com/ummjackson/doge4goat" target="_blank" rel="noopener noreferrer">VIEW DOGE4GOAT ARCHIVE <ArrowUpRight size={13} /></a>
          </div>
        </div>
      </section>

      <section className="goat-cinematic" aria-label="The GOAT of the cycle">
        <img src="/brand/goat-divider.jpg" alt="GOAT seated on a throne before the herd" width={1280} height={720} />
        <div><span>2014 → 2026</span><strong>THE GOAT FINALLY GOT HIS COIN.</strong></div>
      </section>

      <section className="goat-lore" id="portfolio">
        <div className="goat-profile-card">
          {projectConfig.poorGoatXUrl ? (
            <a className="goat-profile-card__image" href={projectConfig.poorGoatXUrl} target="_blank" rel="noopener noreferrer" aria-label="Follow Poor Goat on X">
              <img src="/brand/goat-logo.png" alt="Poor Goat profile" width={1254} height={1254} />
            </a>
          ) : <div className="goat-profile-card__image"><img src="/brand/goat-logo.png" alt="Poor Goat profile" width={1254} height={1254} /></div>}
          <div className="goat-profile-card__identity"><span>POOR GOAT</span><strong>@PoorGoat_</strong><small>THE BLACK BULL</small></div>
          <div className="goat-profile-card__actions">
            {projectConfig.poorGoatXUrl ? <ActionLink href={projectConfig.poorGoatXUrl} solid>FOLLOW <ArrowUpRight size={13} /></ActionLink> : null}
            {projectConfig.poorGoatWalletUrl ? <ActionLink href={projectConfig.poorGoatWalletUrl}>VIEW WALLET <ArrowUpRight size={13} /></ActionLink> : null}
            {projectConfig.poorGoatProofUrl ? <ActionLink href={projectConfig.poorGoatProofUrl}>PORTFOLIO PROOF <ArrowUpRight size={13} /></ActionLink> : null}
          </div>
        </div>
        <div className="goat-lore__copy">
          <span>THE MAIN CHARACTER</span>
          <h2>THE GOAT OF THIS CYCLE.</h2>
          <p>Poor Goat became one of the most recognizable traders on Crypto Twitter through conviction in ANSEM and CATE.</p>
          <p>He backed the thesis while the timeline chased candles.</p>
          <p>The market gave him the nickname.</p>
          <p>GOAT gave it a ticker.</p>
        </div>
      </section>

      <section className="goat-black-bull">
        <div><span>THE BLACK BULL</span><h2>THE HORNS STAY ON.</h2><p>Poor Goat held the thesis while the timeline rotated. His conviction in ANSEM and CATE became part of the story behind the 2026 Goat Coin.</p></div>
        <article><span>ANOTHER GOAT OF THE CYCLE</span><h3>ANSEM IS A GOAT TOO.</h3><p>ANSEM helped define this memecoin cycle. GOAT recognizes both sides of the conviction story—without implying official endorsement.</p></article>
      </section>

      <LeaderboardSection />

      <section className="goat-final">
        <span>THE 2026 GOAT COIN</span>
        <h2>A GOAT EMERGED<br />ONCHAIN.</h2>
        <p>Hold GOAT. Receive ANSEM + CATE.</p>
      </section>
    </div>
  );
}
