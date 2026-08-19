import { CopyCaButton } from "./copy-ca-button";
import { MarketTicker } from "./market-ticker";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "Trump Strategy";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "TSTRAT";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "#";
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/";
const EPOCH_MINUTES = process.env.NEXT_PUBLIC_EPOCH_MINUTES ?? "5";
const LOGO_SRC = "/brand/trump-strategy-logo.svg";

const rewards = [
  { symbol: "WLFI", split: "50%" },
  { symbol: "TRUMP", split: "50%" }
];

function compactAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Page() {
  return (
    <div className="page trump-strategy-page has-market-ticker">
      <MarketTicker logoSrc={LOGO_SRC} projectName={PROJECT_NAME} xUrl={X_URL} contractAddress={CONTRACT_ADDRESS} />

      <main>
        <section className="trump-hero" id="initiation">
          <div className="trump-rain" aria-hidden="true" />
          <div className="container trump-hero-inner">
            <div className="trump-copy">
              <div className="trump-kicker">TRUMP STRATEGY ON SOLANA</div>
              <h1>BUY ALL CRYPTO ASSETS.</h1>
              <p className="trump-subtitle">Hold {SOURCE_SYMBOL}. Receive WLFI + TRUMP every {EPOCH_MINUTES} minutes.</p>
              <p className="trump-lead">
                Trump Strategy turns the thesis into a simple holder machine: creator-fee rewards route into the two
                Trump-family-connected crypto names, split evenly between WLFI and TRUMP, then distributed to eligible
                holders on a live epoch schedule.
              </p>
              <div className="trump-actions">
                <a className="trump-button" href={BUY_URL}>
                  Buy {SOURCE_SYMBOL}
                </a>
                {CONTRACT_ADDRESS ? <CopyCaButton address={CONTRACT_ADDRESS} label={compactAddress(CONTRACT_ADDRESS)} /> : null}
                <a className="trump-button secondary" href="#terminal">
                  View Strategy
                </a>
              </div>
            </div>

            <div className="trump-terminal" id="terminal" aria-label="Trump Strategy terminal">
              <div className="terminal-topline">
                <span>STRATEGY LIVE</span>
                <span>{EPOCH_MINUTES}M EPOCH</span>
              </div>
              <div className="terminal-logo-lockup">
                <img src={LOGO_SRC} alt={`${PROJECT_NAME} logo`} />
                <div>
                  <strong>{PROJECT_NAME}</strong>
                  <span>{SOURCE_SYMBOL} HOLDER REWARDS</span>
                </div>
              </div>
              <div className="terminal-grid">
                {rewards.map((reward) => (
                  <article key={reward.symbol}>
                    <span>{reward.symbol}</span>
                    <strong>{reward.split}</strong>
                  </article>
                ))}
                <article>
                  <span>Cadence</span>
                  <strong>{EPOCH_MINUTES} MIN</strong>
                </article>
                <article>
                  <span>Mode</span>
                  <strong>HOLDER DROP</strong>
                </article>
              </div>
              <div className="terminal-log">
                <p>THESIS: JUST BUY ALL CRYPTO ASSETS.</p>
                <p>REWARD ROUTE: 50% WLFI / 50% TRUMP.</p>
                <p>STATUS: AWAITING LIVE RECEIPTS.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="trump-band" id="rewards">
          <div className="container trump-band-grid">
            <article>
              <span>01</span>
              <h2>Hold {SOURCE_SYMBOL}</h2>
              <p>Eligible wallets are read directly from holder snapshots. No forms, no claim page, no manual entry.</p>
            </article>
            <article>
              <span>02</span>
              <h2>Split the rewards</h2>
              <p>Every reward epoch is positioned around a clean 50/50 route into WLFI and TRUMP.</p>
            </article>
            <article>
              <span>03</span>
              <h2>Publish receipts</h2>
              <p>Live distributions should be backed by real transaction receipts once the worker is active.</p>
            </article>
          </div>
        </section>

        <section className="trump-thesis" id="faq">
          <div className="container">
            <p>
              Trump Strategy is an experimental community token and holder-distribution project. Reward availability,
              eligibility, timing, and token routing depend on live backend configuration.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
