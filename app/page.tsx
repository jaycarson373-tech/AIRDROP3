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
              <FaqItem title="How do I qualify?" body="Hold 1,000,000+ BULL and remain continuously eligible." />
              <FaqItem title="How often are distributions?" body="The worker runs on five-minute epochs and distributes ANSEM automatically when live backend conditions are met." />
              <FaqItem title="Why is selling permanent?" body="The mechanic is designed to reward continuous conviction, not temporary participation." />
              <FaqItem title="How do conviction multipliers work?" body="Longer uninterrupted holding periods increase reward weight, up to the 10x maximum." />
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
          <p>Permanent eligibility. Automatic ANSEM distributions. Conviction over noise.</p>
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
