import { ArrowRight } from "lucide-react";
import { CopyCaButton } from "./copy-ca-button";
import {
  BullBoard,
  ConvictionSection,
  HeroCountdown,
  HolderLookup,
  LiveProtocolDashboard,
  PermanentEligibility,
  RecentAirdrops,
  RewardExplanation
} from "./home-strategy-data";

const PROJECT_NAME = "The Final Bull";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "https://pump.fun";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_REWARD_TOKEN_MINT ?? "";

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <img className="brand-logo" src="/brand/nietzschean-crest.jpg" alt={`${PROJECT_NAME} logo`} />
          <span>
            The Final Bull
            <small>Final Bull Protocol</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#dashboard">Dashboard</a>
          <a href="#conviction">Multiplier</a>
          <a href="#bull-board">Last Standing</a>
          <a href="#airdrops">Airdrops</a>
          <a href="/fallen-bulls">Fallen Bulls</a>
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
    <div className="page nietzschean-page">
      <Navbar />

      <main>
        <section className="hero nietzschean-hero" id="strategy">
          <div className="hero-art hero-mountains" aria-hidden="true" />
          <div className="hero-clouds" aria-hidden="true" />
          <div className="hero-fog" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />

          <div className="container hero-inner">
            <div className="hero-copy-stack">
              <div className="section-kicker">The final bull market</div>
              <h1>
                <span>The Final</span>
                <span>Bull</span>
              </h1>
              <p className="hero-subtitle">
                The final bull market won't reward the fastest. It will reward the last ones still standing.
              </p>
              <div className="hero-actions">
                <a className="cta" href="#eligibility">
                  Become Eligible <ArrowRight size={18} />
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
        <PathOfTheBull />
        <WhyAnsemSection />

        <RewardExplanation />
        <ConvictionSection />
        <PermanentEligibility />
        <BullBoard />
        <RecentAirdrops />
        <HolderLookup />

        <section className="section faq-section" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Rules for the last ones standing.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body="Hold at least 1,000,000 $BULL and stay above that threshold." />
              <FaqItem title="How often are distributions?" body="Creator fees buy ANSEM every five minutes, then the existing backend distributes it automatically when live conditions are met." />
              <FaqItem title="What removes eligibility?" body="Selling any $BULL or falling below 1,000,000 $BULL permanently removes eligibility from tracked distributions." />
              <FaqItem title="How do multipliers work?" body="Your multiplier rises with continuous hold time: 1×, 2×, 5×, then 10× after thirty minutes." />
              <FaqItem title="How is ANSEM purchased?" body="Creator fees are routed into ANSEM purchases by the existing backend flow, then distributed to eligible holders." />
            </div>
          </div>
        </section>

        <section className="section final-bull-section">
          <div className="final-bull-art" aria-hidden="true" />
          <div className="container final-bull-copy">
            <h2>THE LAST ONES STANDING</h2>
            <p>Every cycle leaves fewer believers.</p>
            <p>Every cycle creates fewer bulls.</p>
            <strong>The Final Bull rewards the wallets that never stopped accumulating.</strong>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/brand/nietzschean-crest.jpg" alt={`${PROJECT_NAME} logo`} />
            <strong>The Final Bull</strong>
          </div>
          <p>Outlast the herd. Stay standing.</p>
          <div className="footer-links">
            <a href="#dashboard">Dashboard</a>
            <a href="#conviction">Multiplier</a>
            <a href="#eligibility">Eligibility</a>
            <a href="#bull-board">Last Standing</a>
            <a href="/fallen-bulls">Fallen Bulls</a>
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

function WhyAnsemSection() {
  return (
    <section className="section ansem-section" id="why-ansem">
      <div className="black-bull-glow" aria-hidden="true" />
      <div className="container black-bull-grid">
        <aside className="black-bull-card">
          <div className="black-bull-portrait">
            <img src="/brand/backgrounds/bull-mountain-2.jpg" alt="ANSEM market thesis" />
          </div>
          <div className="black-bull-card-head">
            <span>ANSEM thesis</span>
            <strong>200K to 170M</strong>
          </div>
          <div className="bull-signal-list">
            <span>3 day expansion</span>
            <span>Trenches watching</span>
            <span>Final-cycle signal</span>
            <span>Airdrop utility</span>
          </div>
        </aside>

        <div className="black-bull-copy">
          <div className="section-kicker">Why ANSEM?</div>
          <h2>THE TOKEN THE MARKET STARTED WATCHING</h2>
          <div className="lore-copy">
            <p>Final Bull distributes ANSEM because it already carries the same final-cycle energy this site is built around.</p>
            <p>The token moved from roughly 200K to 170M in three days, and traders started pointing to it as a signal that the Final Bull could be beginning.</p>
            <p>The idea is simple: hold BULL, stay eligible, and receive the asset the trenches keep watching.</p>
            <p>No claiming. No wallet connection. Just automatic ANSEM airdrops for the last wallets still standing.</p>
          </div>
        </div>
      </div>
      <div className="container black-bull-timeline" aria-label="ANSEM thesis timeline">
        {["200K start", "170M breakout", "Trenches notice", "Final Bull airdrops"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

const bullPath = [
  {
    year: "2013",
    title: "The beginning.",
    body: "The first believers entered."
  },
  {
    year: "2017",
    title: "The first mania.",
    body: "The herd rushed in."
  },
  {
    year: "2021",
    title: "Everyone thought it would never end.",
    body: "The cycle reached fever pitch."
  },
  {
    year: "2022",
    title: "Most disappeared.",
    body: "The noise went quiet."
  },
  {
    year: "2024",
    title: "The survivors returned.",
    body: "The cycle began again."
  },
  {
    year: "Today",
    title: "The Final Bull.",
    body: "Only the last ones remain."
  }
];

function PathOfTheBull() {
  return (
    <section className="section path-section" id="path">
      <div className="path-parallax" aria-hidden="true" />
      <div className="container">
        <div className="section-kicker">Survive the cycle</div>
        <div className="section-head split-head">
          <h2>THE FINAL CYCLE</h2>
          <p>Most will leave. A few will remain.</p>
        </div>
        <div className="bull-path" aria-label="The Final Cycle timeline">
          {bullPath.map((milestone) => (
            <article className="path-card" key={milestone.year}>
              <span>{milestone.year}</span>
              <h3>{milestone.title}</h3>
              <p>{milestone.body}</p>
            </article>
          ))}
          <article className="path-card path-card-final">
            <span>Become the Bull.</span>
            <h3>Hold. Accumulate.</h3>
            <p>Outlast the herd.</p>
          </article>
        </div>
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
