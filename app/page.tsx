import { ArrowRight } from "lucide-react";
import { CopyCaButton } from "./copy-ca-button";
import {
  BullBoard,
  ConvictionSection,
  HeroCountdown,
  HolderLookup,
  LiveProtocolDashboard,
  PermanentEligibility,
  RecentFeedings,
  RewardExplanation
} from "./home-strategy-data";

const PROJECT_NAME = "The Final Bull";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "https://pump.fun";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_REWARD_TOKEN_MINT ?? "";
const ANSEM_X_URL = "https://x.com/blknoiz06?s=21";

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
          <a href="#bull-board">Final Standing</a>
          <a href="#feedings">Feedings</a>
          <a href="/fallen-bulls">Fallen Bulls</a>
        </nav>
        <div className="nav-actions">
          {CONTRACT_ADDRESS ? (
            <CopyCaButton address={CONTRACT_ADDRESS} label={shortAddress(CONTRACT_ADDRESS)} />
          ) : null}
          <a className="cta secondary" href="/dashboard">
            View Feedings
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
                The Final Bull rewards the holders who stay through the last great cycle. Hold BULL. Earn ANSEM. Do not get shaken out.
              </p>
              <div className="hero-actions">
                <a className="cta" href="#eligibility">
                  Become Eligible <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="#feedings">
                  View Feedings
                </a>
              </div>
            </div>
            <HeroCountdown />
          </div>
        </section>

        <LiveProtocolDashboard />
        <PathOfTheBull />
        <BlackBullSection />

        <RewardExplanation />
        <ConvictionSection />
        <PermanentEligibility />
        <BullBoard />
        <RecentFeedings />
        <HolderLookup />

        <section className="section faq-section" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Terms of conviction.</h2>
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
            <h2>The herd chases.</h2>
            <p>The Bull accumulates.</p>
            <p>Every feeding.</p>
            <strong>Forward.</strong>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/brand/nietzschean-crest.jpg" alt={`${PROJECT_NAME} logo`} />
            <strong>The Final Bull</strong>
          </div>
          <p>Hold. Accumulate. Build your hold time.</p>
          <div className="footer-links">
            <a href="#dashboard">Dashboard</a>
            <a href="#conviction">Multiplier</a>
            <a href="#eligibility">Eligibility</a>
            <a href="#bull-board">Final Standing</a>
            <a href="/fallen-bulls">Fallen Bulls</a>
            <a href="#feedings">Feedings</a>
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

function BlackBullSection() {
  return (
    <section className="section black-bull-section" id="black-bull">
      <div className="black-bull-glow" aria-hidden="true" />
      <div className="container black-bull-grid">
        <aside className="black-bull-card">
          <div className="black-bull-portrait">
            <img src="/brand/ansem-black-bull.jpg" alt="Ansem / The Black Bull" />
          </div>
          <div className="black-bull-card-head">
            <span>Ansem / The Black Bull</span>
            <a href={ANSEM_X_URL} target="_blank" rel="noreferrer">
              View X <ArrowRight size={15} />
            </a>
          </div>
          <div className="bull-signal-list">
            <span>Recent Virality</span>
            <span>Trenches revived</span>
            <span>Reward meta activated</span>
            <span>Bull season energy</span>
          </div>
        </aside>

        <div className="black-bull-copy">
          <div className="section-kicker">The inspiration</div>
          <h2>THE BLACK BULL</h2>
          <div className="lore-copy">
            <p>Before the herd saw it, the Black Bull was already moving.</p>
            <p>Ansem brought energy back to the timeline and made the bull feel alive again.</p>
            <p>The final market cycle rewards the holders who stay.</p>
            <p>The longer you hold, the larger your share becomes.</p>
          </div>
        </div>
      </div>
      <div className="container black-bull-timeline" aria-label="Black Bull lore timeline">
        {["Trenches revived", "Timeline energy", "Reward meta", "Bull season"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}

const bullPath = [
  {
    year: "2013",
    title: "The Bull is born.",
    body: "Early believers begin accumulating."
  },
  {
    year: "2017",
    title: "The first mania.",
    body: "Most chase euphoria. The Bull keeps walking."
  },
  {
    year: "2018",
    title: "The crash.",
    body: "Weak hands disappear. The Bull survives."
  },
  {
    year: "2020",
    title: "Global uncertainty.",
    body: "The Bull keeps accumulating."
  },
  {
    year: "2021",
    title: "Euphoria returns.",
    body: "Everyone wants the Bull. The Bull remains unchanged."
  },
  {
    year: "2022",
    title: "Another brutal bear market.",
    body: "Speculators leave. Conviction remains."
  },
  {
    year: "2024",
    title: "Institutions arrive.",
    body: "The Bull keeps moving."
  },
  {
    year: "Today",
    title: "The Final Bull moves forward.",
    body: "The final cycle belongs to holders who keep accumulating."
  }
];

function PathOfTheBull() {
  return (
    <section className="section path-section" id="path">
      <div className="path-parallax" aria-hidden="true" />
      <div className="container">
        <div className="section-kicker">The Bull's Journey</div>
        <div className="section-head split-head">
          <h2>Every cycle ended. This one decides who stayed.</h2>
          <p>The timeline remains the same: panic, euphoria, collapse, accumulation. The Final Bull keeps moving.</p>
        </div>
        <div className="bull-path" aria-label="The Bull's Journey timeline">
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
            <p>Build your hold time.</p>
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
