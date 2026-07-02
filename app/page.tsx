import { ArrowRight } from "lucide-react";
import { CopyCaButton } from "./copy-ca-button";
import {
  BullBoard,
  HeroCountdown,
  HoodBonusSection,
  HolderLookup,
  LiveProtocolDashboard,
  PermanentEligibility,
  RecentAirdrops,
  RewardExplanation
} from "./home-strategy-data";

const PROJECT_NAME = "HOOD Strategy";
const DEFAULT_CA = "8u3oshsLdVmkLnGi4WuPUZVYLLzHccXFajHKQYNzpump";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "https://pump.fun";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? DEFAULT_CA;

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <img className="brand-logo" src="/brand/hood-strategy-logo.png" alt={`${PROJECT_NAME} logo`} />
          <span>
            HOOD Strategy
            <small>Market Rewards</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#dashboard">Live Data</a>
          <a href="#strategy">Strategy</a>
          <a href="#how">Rewards</a>
          <a href="#hood-bonus">Reward Model</a>
          <a href="#hood-board">Board</a>
          <a href="#airdrops">Airdrops</a>
        </nav>
        <div className="nav-actions">
          {CONTRACT_ADDRESS ? (
            <CopyCaButton address={CONTRACT_ADDRESS} label={shortAddress(CONTRACT_ADDRESS)} />
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
    <div className="page hood-strategy-page">
      <Navbar />

      <main>
        <section className="hero hood-hero" id="top">
          <div className="hero-art hero-mountains" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />

          <div className="container hero-inner">
            <div className="hero-copy-stack">
              <div className="section-kicker">Public market reward strategy</div>
              <h1>
                <span>HOOD</span>
                <span>Strategy</span>
              </h1>
              <p className="hero-subtitle">
                The Robinhood meta, rebuilt for the trenches.
              </p>
              <p className="hero-lead">
                Robinhood is bringing memecoins to retail. HOOD Strategy turns that narrative into an airdrop engine for eligible $HOOD holders.
              </p>
              <div className="hero-actions">
                <a className="cta" href="#strategy">
                  View Strategy <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="#airdrops">
                  View Rewards
                </a>
              </div>
            </div>
            <HeroCountdown />
          </div>
        </section>

        <LiveProtocolDashboard />
        <StrategySection />
        <RewardExplanation />
        <HoodBonusSection />
        <PermanentEligibility />
        <BullBoard />
        <RecentAirdrops />
        <HolderLookup />

        <section className="section faq-section" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Strategy notes.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body="Hold at least 250,000 $HOOD and stay above that threshold." />
              <FaqItem title="How often are rewards sent?" body="Creator fees fund rewards every epoch when live conditions are met." />
              <FaqItem title="How are rewards weighted?" body="Eligible wallets are weighted by the amount of $HOOD they hold. The minimum is 250,000 $HOOD." />
              <FaqItem title="Does supply matter?" body="Yes. More $HOOD held means a larger share of each distribution." />
              <FaqItem title="Is there claiming?" body="No. The backend handles airdrops automatically. No wallet connection is required to receive rewards." />
            </div>
          </div>
        </section>

        <section className="section final-bull-section">
          <div className="final-bull-art" aria-hidden="true" />
          <div className="container final-bull-copy">
            <h2>RETAIL META. PUBLIC STRATEGY. LIVE REWARDS.</h2>
            <p>Hold $HOOD.</p>
            <p>Track the engine.</p>
            <strong>Let the strategy run.</strong>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/brand/hood-strategy-logo.png" alt={`${PROJECT_NAME} logo`} />
            <strong>HOOD Strategy</strong>
          </div>
          <p>The Robinhood meta, rebuilt for the trenches.</p>
          <div className="footer-links">
            <a href="#dashboard">Live Data</a>
            <a href="#strategy">Strategy</a>
            <a href="#hood-bonus">Reward Model</a>
            <a href="#hood-board">Board</a>
            <a href="#airdrops">Airdrops</a>
            <a href={process.env.NEXT_PUBLIC_X_URL ?? "https://x.com"} target="_blank" rel="noreferrer">
              X
            </a>
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

function StrategySection() {
  return (
    <section className="section strategy-thesis-section" id="strategy">
      <div className="black-bull-glow" aria-hidden="true" />
      <div className="container black-bull-grid">
        <aside className="black-bull-card">
          <div className="black-bull-portrait">
            <img src="/brand/hood-strategy-logo.png" alt="HOOD Strategy mark" />
          </div>
          <div className="black-bull-card-head">
            <span>Strategy stack</span>
            <strong>HOOD Strategy</strong>
          </div>
          <div className="bull-signal-list">
            <span>Airdrop tech</span>
            <span>Retail meta</span>
            <span>HOOD stock thesis</span>
            <span>Trenches redistribution</span>
          </div>
        </aside>

        <div className="black-bull-copy">
          <div className="section-kicker">The strategy</div>
          <h2>MARKET NARRATIVE MEETS REWARD INFRASTRUCTURE.</h2>
          <div className="lore-copy">
            <p>HOOD Strategy combines the Robinhood memecoin narrative, HOOD stock momentum, and automated reward distribution into one clean holder system.</p>
            <p>Creator fees fund rewards. Eligible $HOOD holders are scored every epoch.</p>
            <p>Reward weight is based only on eligible $HOOD held. The more $HOOD a wallet holds, the larger its share.</p>
            <p>No claiming. No wallet connection. Just a public strategy dashboard backed by live reward data.</p>
          </div>
        </div>
      </div>
      <div className="container black-bull-timeline" aria-label="HOOD Strategy reward model">
        {["Creator fees", "Reward pool", "250K+ holder scan", "$HOOD weight", "Airdrop ledger"].map((item) => (
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
