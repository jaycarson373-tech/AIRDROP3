import { ArrowRight } from "lucide-react";
import { CopyCaButton } from "./copy-ca-button";
import {
  AirdroppedStat,
  BullBoard,
  HeroCountdown,
  RewardModelSection,
  HolderLookup,
  LiveProtocolDashboard,
  MarketVolumeSection,
  PermanentEligibility,
  RecentAirdrops,
  RewardExplanation
} from "./home-strategy-data";

const PROJECT_NAME = "Return to Pump";
const DEFAULT_CA = "";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? DEFAULT_CA;
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? (CONTRACT_ADDRESS ? `https://pump.fun/coin/${CONTRACT_ADDRESS}` : "https://pump.fun/");
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "";

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <img className="brand-logo" src="/logo.png" alt={`${PROJECT_NAME} logo`} />
          <span>
            Return to Pump
            <small>RTP rewards rail</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#dashboard">Live Data</a>
          <a href="#strategy">Anti-Hood</a>
          <a href="#how">Rewards</a>
          <a href="#reward-model">Reward Model</a>
          <a href="#board">Board</a>
          <a href="#airdrops">Airdrops</a>
        </nav>
        <div className="nav-actions">
          {CONTRACT_ADDRESS ? (
            <CopyCaButton address={CONTRACT_ADDRESS} label={shortAddress(CONTRACT_ADDRESS)} />
          ) : null}
          {X_URL ? (
            <a className="mini-button x-button" href={X_URL} target="_blank" rel="noreferrer">
              X
            </a>
          ) : null}
          <a className="cta secondary" href="/dashboard">
            View Airdrops
          </a>
        </div>
      </div>
    </header>
  );
}

export default function Page() {
  return (
    <div className="page hood-strategy-page hood-bank-page rtp-page">
      <div className="hood-bank-bg-rotator" aria-hidden="true">
        <span className="hood-bank-bg-layer bg-layer-one" />
        <span className="rtp-cloud-pulse" />
      </div>
      <Navbar />

      <main>
        <section className="hero hood-hero" id="top">
          <div className="hero-shade" aria-hidden="true" />

          <div className="container hero-inner">
            <div className="hero-copy-stack">
              <div className="section-kicker">RETURN TO PUMP</div>
              <h1>
                <span>Return</span>
                <span>to Pump.</span>
              </h1>
              <p className="hero-subtitle">
                Ticker RTP. Hold RTP. Get paid $PUMP.
              </p>
              <p className="hero-lead">
                Robinhood restricted meme-stock trading in 2021. In 2023, it ended SOL support and put unsupported balances on a sale deadline. Return to Pump is the counter-trade: every 10 minutes, creator fees buy $PUMP and airdrop it to eligible RTP holders.
              </p>
              <div className="hero-actions">
                <a className="cta" href={BUY_URL} target="_blank" rel="noreferrer">
                  Buy RTP <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="#airdrops">
                  View $PUMP Drops
                </a>
              </div>
            </div>
            <HeroCountdown />
          </div>
        </section>

        <section className="bank-statstrip" aria-label="Return to Pump live rail">
          <div className="container bank-statstrip-inner">
            <div>
              <strong>100%</strong>
              <span>to $PUMP</span>
            </div>
            <div>
              <strong>10 MIN</strong>
              <span>epochs</span>
            </div>
            <div>
              <strong>1M+</strong>
              <span>RTP eligible</span>
            </div>
            <div>
              <AirdroppedStat />
            </div>
          </div>
        </section>

        <MarketVolumeSection />
        <LiveProtocolDashboard />
        <VaultSection />
        <RewardExplanation />
        <RewardModelSection />
        <PermanentEligibility />
        <BullBoard />
        <RecentAirdrops />
        <HolderLookup />

        <section className="section faq-section" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Holder notes.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body="Hold at least 1,000,000 $RTP and stay above that threshold." />
              <FaqItem title="How often are rewards sent?" body="Creator fees buy $PUMP every 10 minutes when live conditions are met." />
              <FaqItem title="How does it work?" body="The backend claims fees, buys $PUMP, scans eligible RTP holders, and sends rewards automatically." />
              <FaqItem title="Who gets boosted?" body="The weighting skews toward smaller eligible RTP bags and wallets with lower SOL balances." />
              <FaqItem title="Why RTP?" body="Return to Pump is for people who want the Pump rail, on-chain receipts, and none of the brokerage drama." />
              <FaqItem title="Is there claiming?" body="No. The backend handles airdrops automatically. No wallet connection is required to receive rewards." />
            </div>
          </div>
        </section>

        <section className="section final-bull-section">
          <div className="final-bull-art" aria-hidden="true" />
          <div className="container final-bull-copy">
            <h2>THE RETURN FLIGHT IS LIVE. $PUMP PAID. RECEIPTS POSTED.</h2>
            <p>Hold $RTP.</p>
            <p>Get the drop.</p>
            <strong>Return to Pump.</strong>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/logo.png" alt={`${PROJECT_NAME} logo`} />
            <strong>Return to Pump</strong>
          </div>
          <p>Hold RTP. Get paid $PUMP every 10 minutes.</p>
          <div className="footer-links">
            <a href="#dashboard">Live Data</a>
            <a href="#strategy">Anti-Hood</a>
            <a href="#reward-model">Reward Model</a>
            <a href="#board">Board</a>
            <a href="#airdrops">Airdrops</a>
            {X_URL ? (
              <a href={X_URL} target="_blank" rel="noreferrer">
                X
              </a>
            ) : null}
          </div>
          {CONTRACT_ADDRESS ? (
            <div className="footer-ca">
              <span>CA:</span>
              <span>{CONTRACT_ADDRESS}</span>
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

function VaultSection() {
  return (
    <section className="section strategy-thesis-section" id="strategy">
      <div className="black-bull-glow" aria-hidden="true" />
      <div className="container black-bull-grid">
        <aside className="black-bull-card">
          <div className="black-bull-portrait">
            <img src="/logo.png" alt="Return to Pump mark" />
          </div>
          <div className="black-bull-card-head">
            <span>RTP stack</span>
            <strong>Return to Pump</strong>
          </div>
          <div className="bull-signal-list">
            <span>Creator fees</span>
            <span>$PUMP buys</span>
            <span>Holder scan</span>
            <span>Receipts live</span>
          </div>
        </aside>

        <div className="black-bull-copy">
          <div className="section-kicker">Anti-Hood lane</div>
          <h2>FEES IN. $PUMP OUT. RECEIPTS LIVE.</h2>
          <div className="lore-copy">
            <p>Robinhood made users remember the fine print. RTP makes the receipts public.</p>
            <p>Eligible wallets are scanned every 10 minutes and paid automatically when rewards are available.</p>
            <p>No bridge. No claiming. Hold RTP, get $PUMP, watch the ledger move.</p>
          </div>
        </div>
      </div>
      <div className="container black-bull-timeline" aria-label="Return to Pump reward model">
        {["Creator fees", "Buy $PUMP", "Holder scan", "Airdrop", "Receipt ledger"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

function FaqItem({ title, body }: { title: string; body: string }) {
  return (
    <article className="faq-item">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
