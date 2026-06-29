import { ArrowDown, ArrowRight, Crown, Landmark, Shield, Timer, WalletCards } from "lucide-react";
import {
  AirdropHistory,
  ConvictionSection,
  HeroCountdown,
  HolderLookup,
  LiveProtocolDashboard,
  PermanentEligibility
} from "./home-strategy-data";

const PROJECT_NAME = "The Nietzschean Bull";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "https://pump.fun";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_REWARD_TOKEN_MINT ?? "";
const CONTRACT_URL = CONTRACT_ADDRESS ? `https://solscan.io/token/${CONTRACT_ADDRESS}` : "https://solscan.io";
const ANSEM_X_URL = "https://x.com/blknoiz06?s=21";

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <img className="brand-logo" src="/brand/nietzschean-logo.webp" alt={`${PROJECT_NAME} logo`} />
          <span>
            The Nietzschean Bull
            <small>Conviction Protocol</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#dashboard">Dashboard</a>
          <a href="#path">Path</a>
          <a href="#black-bull">Black Bull</a>
          <a href="#conviction">Conviction</a>
          <a href="#eligibility">Eligibility</a>
          <a href="#airdrops">Airdrops</a>
        </nav>
        <div className="nav-actions">
          {CONTRACT_ADDRESS ? (
            <a className="mini-button mono" href={CONTRACT_URL} target="_blank" rel="noreferrer">
              CA {shortAddress(CONTRACT_ADDRESS)}
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
              <div className="section-kicker">Ancient reward protocol</div>
              <h1>
                <span>The Nietzschean</span>
                <span>Bull</span>
              </h1>
              <p className="hero-subtitle">
                The Nietzschean Bull rewards conviction. Weak hands leave. Strong hands inherit the Black Bull.
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
        <BlackBullSection />

        <section className="section mechanics-section" id="how">
          <div className="container">
            <div className="section-kicker">How it works</div>
            <div className="section-head split-head">
              <h2>No claiming. No wallet interaction.</h2>
              <p>Simply hold. The protocol repeats every five minutes.</p>
            </div>
            <div className="flow">
              {[
                { icon: Landmark, title: "Creator Fees" },
                { icon: ArrowDown, title: "100% Buy ANSEM" },
                { icon: Crown, title: "Conviction Multiplier Applied" },
                { icon: WalletCards, title: "Eligible BULL Holders" },
                { icon: Shield, title: "Automatic Distribution" },
                { icon: Timer, title: "Repeat Every Five Minutes" }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article className="flow-step" key={item.title}>
                    <Icon size={22} />
                    <span>{item.title}</span>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <ConvictionSection />
        <PermanentEligibility />
        <HolderLookup />
        <AirdropHistory />

        <section className="section philosophy-section">
          <div className="container philosophy-grid">
            <h2>The herd follows.</h2>
            <div>
              <p>The Bull endures.</p>
              <p>Weak hands seek certainty.</p>
              <p>Strong hands embrace conviction.</p>
              <p>Every distribution rewards patience.</p>
            </div>
          </div>
        </section>

        <section className="section faq-section" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Terms of conviction.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body="Hold at least 1,000,000 BULL and remain eligible through each five-minute epoch." />
              <FaqItem title="How often are distributions?" body="The worker runs on five-minute epochs and distributes ANSEM automatically when live backend conditions are met." />
              <FaqItem title="What resets my streak?" body="Selling any BULL or falling below 1,000,000 BULL resets your consecutive eligible epoch streak to 0." />
              <FaqItem title="How do conviction multipliers work?" body="Your multiplier increases as your consecutive eligible epoch streak grows. Reach 2,016 epochs, or one week, to unlock 10x." />
              <FaqItem title="How is ANSEM purchased?" body="Creator fees are routed into ANSEM purchases by the existing backend flow, then distributed to eligible holders." />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/brand/nietzschean-logo.webp" alt={`${PROJECT_NAME} logo`} />
            <strong>The Nietzschean Bull</strong>
          </div>
          <p>Hold. Accumulate. Advance your epoch streak.</p>
          <div className="footer-links">
            <a href="#dashboard">Dashboard</a>
            <a href="#conviction">Conviction</a>
            <a href="#eligibility">Eligibility</a>
            <a href="#airdrops">Airdrops</a>
            <a href={process.env.NEXT_PUBLIC_X_URL ?? "https://x.com"} target="_blank" rel="noreferrer">
              X
            </a>
          </div>
          {CONTRACT_ADDRESS ? (
            <div className="footer-ca">
              <span>CA:</span>
              <a href={CONTRACT_URL} target="_blank" rel="noreferrer">
                {CONTRACT_ADDRESS}
              </a>
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
        <div className="black-bull-copy">
          <div className="section-kicker">The inspiration</div>
          <h2>THE BLACK BULL</h2>
          <div className="lore-copy">
            <p>Before the herd saw it, the Black Bull was already moving.</p>
            <p>
              From early crypto cycles to the current trenches, Ansem became one of the voices people watched when the
              market needed direction.
            </p>
            <p>He called attention back to the trenches. He brought energy back to the timeline. He made the bull feel alive again.</p>
            <p>The Nietzschean Bull is built around that same idea:</p>
            <p>do not chase the herd. do not panic. do not sell the first shakeout.</p>
            <p>Accumulate. Hold. Survive the epoch. Become harder to shake out.</p>
          </div>
        </div>

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
            <span>Airdrop meta activated</span>
            <span>Bull season energy</span>
          </div>
          <div className="tweet-placeholder">
            <span>The Tweet That Started It</span>
            <p>Placeholder for embedded X post.</p>
          </div>
        </aside>
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
    title: "The Nietzschean Bull continues forward.",
    body: "Never rushing. Never reacting. Only accumulating."
  }
];

function PathOfTheBull() {
  return (
    <section className="section path-section" id="path">
      <div className="path-parallax" aria-hidden="true" />
      <div className="container">
        <div className="section-kicker">The Path of the Bull</div>
        <div className="section-head split-head">
          <h2>Markets collapse. The Bull advances.</h2>
          <p>Part history, part philosophy: a record of conviction moving through every cycle.</p>
        </div>
        <div className="bull-path" aria-label="The Path of the Bull timeline">
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
            <p>Advance your epoch streak.</p>
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
