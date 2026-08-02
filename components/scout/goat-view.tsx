"use client";

import { ArrowUpRight, CheckCircle2, Clock3, Coins, Radio, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatToken, shortWallet } from "./format";
import { useScout } from "./scout-provider";

const CYCLE_MS = 5 * 60 * 1000;

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
    () => lastUpdated?.toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "NOT INDEXED",
    [lastUpdated]
  );
  const eligibilityLabel = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL?.trim() || "SET AFTER SUPPLY CONFIRMATION";
  const receipts = stats.recentRewards.slice(0, 8);

  return (
    <div className="goat-home">
      <section className="goat-hero" id="distribution">
        <img className="goat-hero__backdrop" src="/brand/goat-banner.png" alt="" aria-hidden="true" />
        <div className="goat-hero__shade" aria-hidden="true" />
        <div className="goat-hero__copy">
          <div className="goat-eyebrow"><i /> THE POORGOAT THESIS</div>
          <h1>HE MADE MEMECOINS<br /><span>BELIEVABLE AGAIN.</span></h1>
          <p>
            <strong>$GOAT</strong> is a holder distribution engine built around the conviction of
            <a href="https://x.com/PoorGoat_" target="_blank" rel="noreferrer"> @PoorGoat_</a>.
            Every five minutes, the reward budget splits evenly between <b>$ANSEM</b> and <b>$CATE</b>,
            then moves to eligible GOAT holders.
          </p>
          <div className="goat-hero__actions">
            <a className="goat-button goat-button--solid" href="#mechanism">SEE THE MECHANISM</a>
            <a className="goat-button" href="https://x.com/PoorGoat_" target="_blank" rel="noreferrer">
              FOLLOW POORGOAT <ArrowUpRight size={15} />
            </a>
          </div>
          <div className="goat-hero__proof">
            <span>THE COMMUNITY-REPORTED RUN</span>
            <strong>$2M / 2 MONTHS</strong>
            <small>A community claim presented as the GOAT thesis—not an independently audited performance record.</small>
          </div>
        </div>

        <div className="goat-engine">
          <div className="goat-engine__head">
            <span><i /> GOAT DISTRIBUTION ENGINE</span>
            <strong>{live ? "ONLINE" : "PRELAUNCH"}</strong>
          </div>
          <div className="goat-engine__clock">
            <span>NEXT 50 / 50 DISTRIBUTION</span>
            <strong>{clockLabel(remaining)}</strong>
            <small>FIVE-MINUTE UTC CYCLE</small>
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
          <div className="goat-engine__progress"><i style={{ width: `${progress * 100}%` }} /></div>
          <div className="goat-engine__foot">
            <span>INDEX {indexTime}</span>
            <span>{live ? "REAL RECEIPTS ONLY" : "WORKER GATED"}</span>
          </div>
        </div>
      </section>

      <section className="goat-stats" aria-label="GOAT protocol status">
        <Stat label="CYCLE" value="05:00" note="AUTOMATIC UTC BOUNDARY" />
        <Stat label="REWARD SPLIT" value="50 / 50" note="$ANSEM + $CATE" />
        <Stat
          label="SETTLED CYCLES"
          value={stats.totalEpochs > 0 ? stats.totalEpochs.toLocaleString() : "NO SETTLED CYCLE"}
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
          <h2>HOLD GOAT.<br />RECEIVE ANSEM + CATE.</h2>
          <p>No wallet connection. No signing. No claim transaction. Eligibility comes from the on-chain GOAT holder snapshot.</p>
        </div>
        <div className="goat-steps">
          <article><span>01</span><Clock3 /><strong>FIVE-MINUTE SNAPSHOT</strong><p>The worker reads the live holder set at each UTC boundary.</p></article>
          <article><span>02</span><Coins /><strong>REWARD BUDGET SPLITS</strong><p>Exactly half routes to ANSEM and half routes to CATE.</p></article>
          <article><span>03</span><ShieldCheck /><strong>PRO-RATA ALLOCATION</strong><p>Both reward assets are allocated across the same eligible GOAT holder set.</p></article>
          <article><span>04</span><CheckCircle2 /><strong>RECEIPTS PUBLISH</strong><p>Amounts appear publicly only after the transactions settle on Solana.</p></article>
        </div>
      </section>

      <section className="goat-lore" id="lore">
        <div className="goat-lore__mark">
          <img src="/brand/goat-logo.png" alt="GOAT emblem" width={1254} height={1254} />
        </div>
        <div className="goat-lore__copy">
          <span>WHY GOAT</span>
          <h2>THE HORNS<br />STAY ON.</h2>
          <p>
            PoorGoat became a symbol of high-conviction memecoin culture: backing conviction, defending the thesis,
            and helping traders believe that real communities could run again. GOAT turns that story into a simple
            holder mechanism—own GOAT and participate in the assets tied to the run.
          </p>
          <div>
            <strong>ANSEM</strong><small>THE SIGNAL</small>
            <strong>CATE</strong><small>THE COMEBACK</small>
            <strong>GOAT</strong><small>THE HOLDER ENGINE</small>
          </div>
        </div>
      </section>

      <section className="goat-receipts" id="receipts">
        <div className="goat-section-head goat-section-head--row">
          <div><span>ON-CHAIN LEDGER</span><h2>REAL RECEIPTS.<br />NO FILLER DATA.</h2></div>
          <Radio size={22} />
        </div>
        <div className="goat-receipts__table" role="table" aria-label="Recent GOAT reward receipts">
          <div className="goat-receipts__row goat-receipts__row--head" role="row">
            <span>WALLET</span><span>ASSET</span><span>AMOUNT</span><span>CYCLE</span><span>PROOF</span>
          </div>
          {receipts.length ? receipts.map((receipt, index) => (
            <div className="goat-receipts__row" role="row" key={`${receipt.wallet}-${receipt.epoch}-${index}`}>
              <strong>{shortWallet(receipt.wallet)}</strong>
              <span>${receipt.rewardAsset || "TOKEN"}</span>
              <span>{formatToken(receipt.rewardAmount, receipt.rewardAsset || "TOKENS")}</span>
              <span>#{receipt.epoch}</span>
              {receipt.txSig ? (
                <a href={`https://solscan.io/tx/${receipt.txSig}`} target="_blank" rel="noreferrer">VERIFY <ArrowUpRight size={12} /></a>
              ) : <span>NOT SETTLED</span>}
            </div>
          )) : (
            <div className="goat-receipts__empty">NO SETTLED GOAT DISTRIBUTION YET. THE FIRST VERIFIED RECEIPTS WILL APPEAR HERE.</div>
          )}
        </div>
      </section>

      <section className="goat-final">
        <span>GOAT / FIVE-MINUTE HOLDER DISTRIBUTIONS</span>
        <h2>MEMECOINS<br />BELIEVE AGAIN.</h2>
        <p>50% ANSEM. 50% CATE. Every five minutes. Built around the trader the community calls the GOAT.</p>
      </section>

      <div className="goat-banner-bottom">
        <img src="/brand/goat-banner.png" alt="GOAT market banner" width={2172} height={724} />
        <div><span>THE GOAT THESIS</span><strong>CONVICTION COMPOUNDS.</strong></div>
      </div>
    </div>
  );
}
