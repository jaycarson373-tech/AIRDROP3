import type { CSSProperties } from "react";
import { CopyCaButton } from "./copy-ca-button";
import { MarketTicker } from "./market-ticker";
import { PumpMoneyTerminal } from "./pump-money-terminal";

const PROJECT_NAME = "Pump Money";
const SOURCE_SYMBOL = "PMONEY";
const REWARD_SYMBOL = "PUMP";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_PMONEY_MINT ?? "";
const BUY_URL = process.env.NEXT_PUBLIC_PUMP_MONEY_BUY_URL ?? "";
const X_URL = process.env.NEXT_PUBLIC_PUMP_MONEY_X_URL ?? "";
const EPOCH_MINUTES = 5;
const LAUNCH_STATE = process.env.NEXT_PUBLIC_LAUNCH_STATE === "live" ? "live" : "prelaunch";

function compactAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Page() {
  return (
    <div className="page pump-money-page has-market-ticker">
      <MarketTicker projectName={PROJECT_NAME} xUrl={X_URL} contractAddress={CONTRACT_ADDRESS} />

      <main>
        <section className="pm-hero" id="initiation">
          <div className="pm-grid" aria-hidden="true" />
          <div className="pm-bill-rain" aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => (
              <span key={index} style={{ "--bill-index": index } as CSSProperties}>P$</span>
            ))}
          </div>

          <div className="container pm-hero-inner">
            <div className="pm-copy">
              <div className="pm-kicker"><i /> FIVE-MINUTE HOLDER REWARDS</div>
              <h1>PUMP<br />MONEY.</h1>
              <p className="pm-subtitle">The money printer for pump.fun.</p>
              <p className="pm-lead">
                Hold ${SOURCE_SYMBOL}. Every {EPOCH_MINUTES} minutes, creator fees buy ${REWARD_SYMBOL} and ten
                eligible wallets split the round equally. Hold longer and avoid selling to strengthen your odds.
              </p>

              <div className="pm-actions">
                {BUY_URL ? <a className="pm-button" href={BUY_URL} target="_blank" rel="noreferrer">BUY ${SOURCE_SYMBOL}</a> : null}
                {CONTRACT_ADDRESS ? <CopyCaButton address={CONTRACT_ADDRESS} label={compactAddress(CONTRACT_ADDRESS)} /> : null}
                <a className="pm-button pm-button-ghost" href="#terminal">VIEW MONEY PRINTER</a>
              </div>

              <div className="pm-quick-proof" aria-label="Pump Money rules">
                <span>10 WINNERS</span>
                <span>EQUAL SHARE</span>
                <span>NO WALLET CONNECT</span>
              </div>
            </div>

            <PumpMoneyTerminal epochMinutes={EPOCH_MINUTES} rewardSymbol={REWARD_SYMBOL} launchState={LAUNCH_STATE} />
          </div>
        </section>

        <section className="pm-machine" id="rewards">
          <div className="container">
            <div className="pm-section-heading">
              <span>THE MECHANISM</span>
              <h2>FEES IN. $PUMP OUT.</h2>
              <p>Every round is automatic, recorded, and backed by real onchain receipts.</p>
            </div>

            <div className="pm-flow">
              <article><b>01</b><strong>SNAPSHOT</strong><p>Read the eligible ${SOURCE_SYMBOL} holder set at the five-minute boundary.</p></article>
              <article><b>02</b><strong>BUY</strong><p>Use the round&apos;s verified creator-fee budget to buy ${REWARD_SYMBOL}.</p></article>
              <article><b>03</b><strong>SELECT</strong><p>Select ten wallets using a finalized Solana seed and loyalty-weighted odds.</p></article>
              <article><b>04</b><strong>PRINT</strong><p>Split the purchased ${REWARD_SYMBOL} equally and publish every transaction.</p></article>
            </div>
          </div>
        </section>

        <section className="pm-loyalty" id="odds">
          <div className="container pm-loyalty-inner">
            <div>
              <span className="pm-label">MONEY LIKES PATIENCE</span>
              <h2>HOLD LONGER.<br />GET STRONGER.</h2>
              <p>
                Every eligible wallet starts with a base chance. Continuous holding increases the loyalty multiplier.
                A balance decrease resets the streak to 1.0x.
              </p>
            </div>
            <div className="pm-tier-grid" aria-label="Loyalty multiplier milestones">
              <article><span>START</span><strong>1.0x</strong></article>
              <article><span>1 DAY</span><strong>1.5x</strong></article>
              <article><span>3 DAYS</span><strong>2.0x</strong></article>
              <article><span>7 DAYS</span><strong>5.0x</strong></article>
              <article><span>30 DAYS</span><strong>10.0x</strong></article>
            </div>
          </div>
        </section>

        <section className="pm-proof" id="faq">
          <div className="container pm-proof-inner">
            <span className="pm-label">REAL RECEIPTS ONLY</span>
            <h2>IF IT DIDN&apos;T SETTLE, IT DOESN&apos;T COUNT.</h2>
            <p>
              Pump Money displays completed rounds only after payouts confirm. No fabricated winners, no placeholder
              distribution totals, and no claim page. Hold the token and the worker handles the rest.
            </p>
            {X_URL ? <a href={X_URL} target="_blank" rel="noreferrer">FOLLOW PUMP MONEY ON X</a> : null}
          </div>
        </section>
      </main>

      <footer className="pm-footer">
        <div className="container">
          <strong>PUMP MONEY</strong>
          <p>Experimental holder rewards. Timing and availability depend on confirmed creator fees and onchain settlement.</p>
        </div>
      </footer>
    </div>
  );
}
