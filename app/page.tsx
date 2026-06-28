import {
  ArrowRight,
  Gift,
  Shield,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { ParallaxBackground } from "./parallax-background";
import { BlackBullTreasuryCard, StrategyDataSections } from "./home-strategy-data";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "Ansem Strategy";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "ANSEMSTR";
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "https://pump.fun";

function Navbar() {
  const xUrl = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/ANSEMSTR_";
  const ca = process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "";
  const shortCa = ca ? `${ca.slice(0, 4)}...${ca.slice(-4)}` : "CA Coming Soon";

  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <img className="brand-logo" src="/logo.png" alt={`${PROJECT_NAME} logo`} />
          <span>
            ANSEM
            <small>STRATEGY</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#strategy">Strategy</a>
          <a href="#how">How It Works</a>
          <a href="#history">Airdrops</a>
          <a href="#leaderboard">Leaderboard</a>
          <a href="/dashboard">Dashboard</a>
        </nav>
        <div className="nav-actions">
          <a className="mini-button buy-mini" href={BUY_URL} target="_blank" rel="noreferrer">
            Buy ${SOURCE_SYMBOL}
          </a>
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
            Treasury <ArrowRight size={17} />
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
      <Navbar />

      <main>
        <section className="hero" id="strategy">
          <div className="container hero-layout">
            <div>
              <div className="eyebrow">
                <span className="pulse" />
                The Black Bull Strategy
              </div>
              <h1>
                Follow The <span className="gradient">Strategy.</span>
              </h1>
              <p className="hero-copy">
                Every trade accumulates ${REWARD_SYMBOL}. Every 5 minutes, eligible holders receive ${REWARD_SYMBOL}.
              </p>
              <div className="utility-row">
                <span>Hold 1M+ ${SOURCE_SYMBOL}</span>
                <span>Receive ${REWARD_SYMBOL} every 5 mins</span>
                <span className="danger-text">Sell anytime = permanently ineligible</span>
              </div>
              <div className="proof-list">
                <span>
                  <Shield size={18} />
                  No claiming.
                </span>
                <span>
                  <WalletCards size={18} />
                  No wallet connect.
                </span>
                <span>
                  <ShieldCheck size={18} />
                  Just hold.
                </span>
              </div>
              <div className="hero-actions">
                <a className="cta" href={BUY_URL} target="_blank" rel="noreferrer">
                  Buy ${SOURCE_SYMBOL} <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="#status">
                  View Treasury
                </a>
              </div>
            </div>

            <BlackBullTreasuryCard sourceSymbol={SOURCE_SYMBOL} rewardSymbol={REWARD_SYMBOL} />
          </div>
        </section>

        <section className="section" id="how">
          <div className="container">
            <div className="section-head">
              <h2>How It Works</h2>
              <p className="lead">
                Ansem Strategy is the Black Bull accumulation strategy. Every trade fuels the treasury. Every
                epoch sends ${REWARD_SYMBOL} to eligible holders.
              </p>
            </div>

            <div className="cards">
              {[
                {
                  icon: WalletCards,
                  title: "Accumulate",
                  body: "Every trade adds to the Black Bull treasury."
                },
                {
                  icon: Gift,
                  title: "Distribute",
                  body: `Every 5 minutes, eligible holders receive ${REWARD_SYMBOL}.`
                },
                {
                  icon: ShieldCheck,
                  title: "Conviction",
                  body: "Selling anytime removes eligibility permanently."
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
            <div className="sell-warning">SELL = FOREVER INELIGIBLE</div>
          </div>
        </section>

        <StrategyDataSections sourceSymbol={SOURCE_SYMBOL} rewardSymbol={REWARD_SYMBOL} />
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/logo.png" alt={`${PROJECT_NAME} logo`} />
            <strong>ANSEM STRATEGY</strong>
          </div>
          <p>
            The Black Bull accumulation strategy. Hold ${SOURCE_SYMBOL}. Receive ${REWARD_SYMBOL}. Never sell.
          </p>
          <div className="footer-links">
            <a href="#strategy">Strategy</a>
            <a href="#history">Airdrops</a>
            <a href="#leaderboard">Leaderboard</a>
            <a href={process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/ANSEMSTR_"} target="_blank" rel="noreferrer">X</a>
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
