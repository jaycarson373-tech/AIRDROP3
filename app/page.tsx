import {
  ArrowDown,
  ArrowRight,
  Leaf,
  Star,
  Timer,
  Users,
  WalletCards,
} from "lucide-react";
import { ParallaxBackground } from "./parallax-background";
import { BlackBullTreasuryCard, StrategyDataSections } from "./home-strategy-data";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "GRASS";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "ANSEM";
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "GRASS";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "https://pump.fun";
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CA ?? "5S9pB6aRE6am13z1VzUA9EfjEwLL3oCXi5E8dETtpump";
const CONTRACT_URL = `https://solscan.io/token/${CONTRACT_ADDRESS}`;

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <img className="brand-logo" src="/brand/grass-logo.webp" alt={`${PROJECT_NAME} logo`} />
          <span>
            GRASS
            <small>Rewards for ANSEM</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#strategy">Home</a>
          <a href="#how">How It Works</a>
          <a href="#status">Proof</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
        <div className="nav-actions">
          <a className="mini-button mono" href={CONTRACT_URL} target="_blank" rel="noreferrer">
            CA {shortAddress(CONTRACT_ADDRESS)}
          </a>
          <a className="mini-button" href={BUY_URL} target="_blank" rel="noreferrer">
            Buy {REWARD_SYMBOL}
          </a>
          <a className="cta" href="/dashboard">
            Dashboard <ArrowRight size={17} />
          </a>
        </div>
      </div>
    </header>
  );
}

export default function Page() {
  return (
    <div className="page">
      <ParallaxBackground />
      <div className="grass-particles" />
      <Navbar />

      <main>
        <section className="hero cinematic-hero" id="strategy">
          <div className="hero-art hero-art-hills" aria-hidden="true" />
          <div className="hero-art hero-art-grass" aria-hidden="true" />
          <div className="hero-fog" aria-hidden="true" />
          <div className="hero-rays" aria-hidden="true" />
          <div className="birds" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="container hero-inner">
            <div className="hero-copy-stack">
              <div className="eyebrow hero-eyebrow">
                <span className="pulse" />
                Grass-fed rewards
              </div>
              <h1>GRASS</h1>
              <p className="hero-subtitle">Grass-fed rewards for ANSEM holders.</p>
              <p className="hero-lines">
                <span>Bulls eat grass.</span>
                <span>Hold ANSEM.</span>
                <span>Get GRASS.</span>
              </p>
              <div className="hero-actions">
                <a className="cta" href={BUY_URL} target="_blank" rel="noreferrer">
                  Buy {REWARD_SYMBOL} <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="/dashboard">
                  Dashboard
                </a>
              </div>
              <div className="hero-microcopy">
                <span>Every 5 minutes</span>
                <span>50 random holders</span>
                <span>One lucky bonus</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section proof-section" id="proof">
          <div className="container proof-layout">
            <div className="proof-copy">
              <div className="eyebrow">
                <Leaf size={16} />
                Pasture protocol
              </div>
              <h2>The Black Bull keeps eating.</h2>
              <p className="lead">
                Peaceful on the surface. Live reward mechanics underneath. Eligible ANSEM holders enter the GRASS drop every epoch.
              </p>
              <div className="pasture-list">
                <span>Bulls eat grass.</span>
                <span>Real payouts only.</span>
                <span>No fake production data.</span>
              </div>
            </div>
            <BlackBullTreasuryCard sourceSymbol={SOURCE_SYMBOL} rewardSymbol={REWARD_SYMBOL} />
          </div>
        </section>

        <section className="section timeline-section" id="how">
          <div className="container">
            <div className="section-head">
              <h2>How It Works</h2>
              <p className="lead">
                Minimal mechanics. Clean pasture. The bull does the rest.
              </p>
            </div>

            <div className="timeline">
              {[
                {
                  icon: WalletCards,
                  title: "Hold ANSEM",
                  body: "Stay in the eligible holder set."
                },
                {
                  icon: Leaf,
                  title: "Bull Eats Grass",
                  body: "GRASS rewards the Black Bull ecosystem."
                },
                {
                  icon: Timer,
                  title: "Every 5 Minutes",
                  body: "Each epoch opens a fresh drop."
                },
                {
                  icon: Users,
                  title: "50 Random Holders",
                  body: "Eligible wallets are selected for GRASS."
                },
                {
                  icon: Star,
                  title: "Lucky Bonus Winner",
                  body: "One selected holder gets the bonus."
                }
              ].map((step, index, steps) => {
                const Icon = step.icon;
                return (
                  <article className="timeline-step" key={step.title}>
                    <div className="timeline-icon">
                      <Icon size={22} />
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                    {index < steps.length - 1 ? (
                      <div className="timeline-connector" aria-hidden="true">
                        <ArrowDown size={18} />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <StrategyDataSections sourceSymbol={SOURCE_SYMBOL} rewardSymbol={REWARD_SYMBOL} />
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/brand/grass-logo.webp" alt={`${PROJECT_NAME} logo`} />
            <strong>GRASS</strong>
          </div>
          <p>
            Bulls eat grass. Hold {SOURCE_SYMBOL}. Get {REWARD_SYMBOL}.
          </p>
          <div className="footer-links">
            <a href="#strategy">GRASS</a>
            <a href="#how">How It Works</a>
            <a href="#leaderboard">Leaderboard</a>
            <a href={process.env.NEXT_PUBLIC_X_URL ?? "https://x.com"} target="_blank" rel="noreferrer">X</a>
            <span>Telegram</span>
          </div>
          <div className="footer-ca">
            <span>CA:</span>
            <a href={CONTRACT_URL} target="_blank" rel="noreferrer">
              {CONTRACT_ADDRESS}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
