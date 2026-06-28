import {
  ArrowRight,
  Gift,
  Leaf,
  MessageCircle,
  ShieldCheck,
  Timer,
  Trophy,
  WalletCards,
} from "lucide-react";
import { ParallaxBackground } from "./parallax-background";
import { BlackBullTreasuryCard, StrategyDataSections } from "./home-strategy-data";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "GRASS";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "ANSEM";
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "GRASS";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "https://pump.fun";

function Navbar() {
  const xUrl = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com";
  const ca = process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "";
  const shortCa = ca ? `${ca.slice(0, 4)}...${ca.slice(-4)}` : "CA Coming Soon";

  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <img className="brand-logo" src="/logo.png" alt={`${PROJECT_NAME} logo`} />
          <span>
            GRASS
            <small>BLACK BULL REWARDS</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#strategy">GRASS</a>
          <a href="#how">How It Works</a>
          <a href="#tweet">Tweet</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
        <div className="nav-actions">
          <a className="mini-button" href={xUrl} target="_blank" rel="noreferrer">
            X
          </a>
          <a
            className="mini-button mono"
            href={ca ? `https://solscan.io/token/${ca}` : "#"}
            target={ca ? "_blank" : undefined}
            rel={ca ? "noreferrer" : undefined}
          >
            {shortCa}
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
      <div className="grid-bg" />
      <div className="grass-particles" />
      <Navbar />

      <main>
        <section className="hero" id="strategy">
          <div className="container hero-layout">
            <div>
              <div className="eyebrow">
                <span className="pulse" />
                The Black Bull is hungry
              </div>
              <h1>
                GRASS
              </h1>
              <p className="hero-copy">
                Grass-fed rewards for Ansem holders.
                <strong>Bulls eat grass. Hold ANSEM. Get GRASS.</strong>
              </p>
              <div className="utility-row">
                <span>Hold ${SOURCE_SYMBOL}</span>
                <span>50 random winners every 5 mins</span>
                <span>One lucky bonus drop</span>
              </div>
              <div className="proof-list">
                <span>
                  <Leaf size={18} />
                  Bulls eat grass.
                </span>
                <span>
                  <WalletCards size={18} />
                  ANSEM holders enter.
                </span>
                <span>
                  <ShieldCheck size={18} />
                  No fake payout data.
                </span>
              </div>
              <div className="hero-actions">
                <a className="cta" href={BUY_URL} target="_blank" rel="noreferrer">
                  Buy {REWARD_SYMBOL} <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="#how">
                  How It Works
                </a>
              </div>
            </div>

            <div className="hero-side">
              <img className="hero-bull-art" src="/brand/grass-bull-field.webp" alt="Black bull in a dark green grass field" />
              <BlackBullTreasuryCard sourceSymbol={SOURCE_SYMBOL} rewardSymbol={REWARD_SYMBOL} />
            </div>
          </div>
        </section>

        <section className="section" id="how">
          <div className="container">
            <div className="section-head">
              <h2>How It Works</h2>
              <p className="lead">
                Fast launch, clean mechanics. Every epoch, ANSEM holders line up. The bull keeps eating.
              </p>
            </div>

            <div className="cards">
              {[
                {
                  icon: WalletCards,
                  title: "Hold ANSEM",
                  body: "The Black Bull ecosystem starts with ANSEM holders."
                },
                {
                  icon: ShieldCheck,
                  title: "Stay Eligible",
                  body: "Hold before the epoch and stay in the grass-fed queue."
                },
                {
                  icon: Timer,
                  title: "Five Minutes",
                  body: "Every 5 minutes, 50 random eligible holders receive GRASS."
                },
                {
                  icon: Trophy,
                  title: "Lucky Winner",
                  body: "One holder gets the bonus drop when the bull finds the good patch."
                },
                {
                  icon: Gift,
                  title: "Keep Eating",
                  body: "Bulls eat grass. The loop stays simple."
                }
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <article className="card" key={card.title}>
                    <div className="icon">
                      <Icon size={22} />
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </article>
                );
              })}
            </div>
            <div className="sell-warning">BULLS EAT GRASS</div>
          </div>
        </section>

        <section className="section" id="tweet">
          <div className="container split-section tweet-section">
            <div>
              <div className="eyebrow">
                <MessageCircle size={16} />
                Origin tweet
              </div>
              <h2>The Tweet That Fed The Bull</h2>
              <p className="lead">Link/embed the Ansem tweet here.</p>
            </div>
            <div className="tweet-card">
              <span>Tweet embed placeholder</span>
              <strong>ANSEM tweet goes here</strong>
            </div>
          </div>
        </section>

        <StrategyDataSections sourceSymbol={SOURCE_SYMBOL} rewardSymbol={REWARD_SYMBOL} />
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/logo.png" alt={`${PROJECT_NAME} logo`} />
            <strong>GRASS</strong>
          </div>
          <p>
            Bulls eat grass. Hold {SOURCE_SYMBOL}. Get {REWARD_SYMBOL}.
          </p>
          <div className="footer-links">
            <a href="#strategy">GRASS</a>
            <a href="#how">How It Works</a>
            <a href="#tweet">Tweet</a>
            <a href="#leaderboard">Leaderboard</a>
            <a href={process.env.NEXT_PUBLIC_X_URL ?? "https://x.com"} target="_blank" rel="noreferrer">X</a>
            <span>Telegram</span>
          </div>
          <div className="footer-ca">
            <span>CA:</span>
            <strong>{process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ? shortAddress(process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT) : "Coming Soon"}</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
