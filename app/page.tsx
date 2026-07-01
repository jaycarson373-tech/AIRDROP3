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

const PROJECT_NAME = "Robin Hood";
const DEFAULT_CA = "8u3oshsLdVmkLnGi4WuPUZVYLLzHccXFajHKQYNzpump";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "https://pump.fun";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? DEFAULT_CA;

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <img className="brand-logo" src="/brand/robin-hood-logo.jpg" alt={`${PROJECT_NAME} logo`} />
          <span>
            Robin Hood
            <small>Trench Rewards</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#dashboard">Dashboard</a>
          <a href="#hood-bonus">Hood Bonus</a>
          <a href="#hood-board">Hood Board</a>
          <a href="#airdrops">Airdrops</a>
          <a href="/fallen-bulls">Outlaws</a>
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
    <div className="page robin-page">
      <Navbar />

      <main>
        <section className="hero robin-hero" id="strategy">
          <div className="hero-art hero-mountains" aria-hidden="true" />
          <div className="hero-clouds" aria-hidden="true" />
          <div className="hero-fog" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />

          <div className="container hero-inner">
            <div className="hero-copy-stack">
              <div className="section-kicker">Steal from the rich</div>
              <h1>
                <span>Robin</span>
                <span>Hood</span>
              </h1>
              <p className="hero-subtitle">
                Steal from the rich. Give to the trenches.
              </p>
              <p className="hero-lead">
                Creator fees stay in SOL and airdrop every 5 minutes. Rewards remain primarily supply-weighted, with a Robin Hood boost that slightly favors smaller holders and lower-balance wallets.
              </p>
              <div className="hero-actions">
                <a className="cta" href="#eligibility">
                  Enter The Hood <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="#airdrops">
                  View Airdrops
                </a>
              </div>
            </div>
            <HeroCountdown />
          </div>
        </section>

        <LiveProtocolDashboard />
        <ForestCodeSection />
        <RewardExplanation />
        <HoodBonusSection />
        <PermanentEligibility />
        <BullBoard />
        <RecentAirdrops />
        <HolderLookup />

        <section className="section faq-section" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Rules of the Hood.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body="Hold at least 1,000,000 $HOOD and stay above that threshold." />
              <FaqItem title="How often are rewards sent?" body="Creator fees stay in SOL and are airdropped every five minutes when live conditions are met." />
              <FaqItem title="How does the Hood Score work?" body="Rewards remain primarily supply-weighted, with a Robin Hood boost that slightly favors smaller holders and lower-balance wallets." />
              <FaqItem title="What is the Hood Bonus?" body="One eligible wallet can receive the 5x Hood Bonus on a live airdrop." />
              <FaqItem title="Is there claiming?" body="No. The backend handles SOL airdrops automatically. No wallet connection is required to receive rewards." />
            </div>
          </div>
        </section>

        <section className="section final-bull-section">
          <div className="final-bull-art" aria-hidden="true" />
          <div className="container final-bull-copy">
            <h2>THE TRENCHES GET PAID</h2>
            <p>The forest watches.</p>
            <p>The fees keep moving.</p>
            <strong>Hold $HOOD. Let the protocol redistribute.</strong>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/brand/robin-hood-logo.jpg" alt={`${PROJECT_NAME} logo`} />
            <strong>Robin Hood</strong>
          </div>
          <p>Steal from the rich. Give to the trenches.</p>
          <div className="footer-links">
            <a href="#dashboard">Dashboard</a>
            <a href="#hood-bonus">Hood Bonus</a>
            <a href="#eligibility">Eligibility</a>
            <a href="#hood-board">Hood Board</a>
            <a href="/fallen-bulls">Outlaws</a>
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

function ForestCodeSection() {
  return (
    <section className="section ansem-section" id="forest-code">
      <div className="black-bull-glow" aria-hidden="true" />
      <div className="container black-bull-grid">
        <aside className="black-bull-card">
          <div className="black-bull-portrait">
            <img src="/brand/backgrounds/robin-forest.png" alt="Dark Solana forest" />
          </div>
          <div className="black-bull-card-head">
            <span>The forest code</span>
            <strong>Hood Score</strong>
          </div>
          <div className="bull-signal-list">
            <span>Hold $HOOD</span>
            <span>Fees stay SOL</span>
            <span>Smaller holders get a tilt</span>
            <span>Lower-balance wallets get a tilt</span>
            <span>5x Hood Bonus</span>
          </div>
        </aside>

        <div className="black-bull-copy">
          <div className="section-kicker">The Hood model</div>
          <h2>WEIGHTED FOR THE TRENCHES</h2>
          <div className="lore-copy">
            <p>Robin Hood keeps the math clear. The amount of $HOOD you hold is still the foundation.</p>
            <p>Creator fees are not swapped. They stay SOL and are distributed directly to eligible wallets.</p>
            <p>The Hood boost slightly favors smaller holders and wallets with lower SOL balances.</p>
            <p>No claiming. No wallet connection. Just automatic SOL airdrops from the live reward backend.</p>
          </div>
        </div>
      </div>
      <div className="container black-bull-timeline" aria-label="Robin Hood reward model">
        {["Creator fees", "Stay SOL", "Scan holders", "Score wallets", "5x Hood Bonus"].map((item) => (
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
