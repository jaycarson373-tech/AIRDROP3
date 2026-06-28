import {
  ArrowRight,
  BadgeDollarSign,
  Gift,
  Shield,
  ShieldCheck,
  Sparkles,
  TimerReset,
  WalletCards,
} from "lucide-react";
import { ParallaxBackground } from "./parallax-background";
import { RewardRoundPanel } from "./reward-round-panel";
import { SiteLiveStats } from "./site-live-stats";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "Ansem Strategy";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "ANSEMSTR";
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "https://pump.fun";

function Navbar() {
  const xUrl = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com";
  const ca = process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "";
  const shortCa = ca ? `${ca.slice(0, 4)}...${ca.slice(-4)}` : "CA";

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
          <a href="#rewards">Airdrops</a>
          <a href="#proof">Proof</a>
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
            Live Airdrops <ArrowRight size={17} />
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
                Hold ${SOURCE_SYMBOL}. Every five minutes, eligible holders receive The Black Bull token,
                ${REWARD_SYMBOL}. No claiming. No wallet connect. Just hold.
              </p>
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
                  Sell and the strategy stops.
                </span>
              </div>
              <div className="hero-actions">
                <a className="cta" href={BUY_URL} target="_blank" rel="noreferrer">
                  Buy ${SOURCE_SYMBOL} <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="/dashboard">
                  View Strategy
                </a>
              </div>
            </div>

            <div className="hero-bull-art" aria-hidden="true">
              <img src="/brand/black-bull.png" alt="" />
            </div>

            <RewardRoundPanel />
          </div>
        </section>

        <section className="section explore" id="rewards">
          <div className="container">
            <div className="section-head compact">
              <div>
                <div className="eyebrow">
                  <Sparkles size={15} />
                  Reward engine
                </div>
                <h2>What happens each epoch</h2>
              </div>
              <a className="mini-button" href="/dashboard">
                View Dashboard
              </a>
            </div>
            <div className="coin-feed">
              {[
                {
                  symbol: `$${SOURCE_SYMBOL}`,
                  title: "Fees Accumulate",
                  meta: "5m reward cycle",
                  body: "Creator fees are collected into the treasury before each reward cycle.",
                  mc: "step 1"
                },
                {
                  symbol: `$${REWARD_SYMBOL}`,
                  title: "Black Bull Bought",
                  meta: "Jupiter route",
                  body: `The worker swaps available SOL into ${REWARD_SYMBOL} through Jupiter.`,
                  mc: "step 2"
                },
                {
                  symbol: "TOP 50",
                  title: "Airdrop Holders",
                  meta: "No 5%+ whales",
                  body: `Top eligible $${SOURCE_SYMBOL} holders split the ${REWARD_SYMBOL} rewards proportionally.`,
                  mc: "step 3"
                }
              ].map((item, index) => (
                <article className="coin-card" key={item.title}>
                  <div className="coin-avatar">{index + 1}</div>
                  <div>
                    <div className="coin-title">
                      <strong>{item.title}</strong>
                      <span>{item.symbol}</span>
                    </div>
                    <p>{item.body}</p>
                    <small>{item.meta}</small>
                  </div>
                  <span className="mc">{item.mc}</span>
                </article>
              ))}
            </div>
            <div className="golden-callout">
              <span>Black Bull Bonus</span>
              Every epoch, one random eligible holder wins 10x their normal reward.
            </div>
          </div>
        </section>

        <section className="section" id="proof">
          <SiteLiveStats />
        </section>

        <section className="section" id="how">
          <div className="container">
            <div className="section-head">
              <h2>
                No claiming.
                <br />
                No wallet connect.
              </h2>
              <p className="lead">
                Ansem Strategy runs on a simple loop: fees accumulate, Black Bull gets bought, eligible holders
                are snapshotted, and rewards are sent on-chain.
              </p>
            </div>

            <div className="cards">
              {[
                {
                  icon: BadgeDollarSign,
                  title: "Fees become rewards",
                  body: `The worker claims creator fees, swaps the available SOL into ${REWARD_SYMBOL}, and records every epoch in Supabase.`
                },
                {
                  icon: WalletCards,
                  title: "Top holders get paid",
                  body: `$${SOURCE_SYMBOL} holders with at least 1M tokens are ranked, whales above the cap are removed, and the top 50 split rewards by weight.`
                },
                {
                  icon: ShieldCheck,
                  title: "Proof before send",
                  body: "Every planned payout gets an idempotency key before tokens move, so redeploys do not duplicate airdrops."
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
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="terminal">
              <div className="terminal-body">
                  <div className="section-head">
                  <div>
                    <div className="eyebrow">
                      <Sparkles size={15} />
                      ${SOURCE_SYMBOL} flywheel
                    </div>
                    <h2 style={{ marginTop: 18 }}>Every epoch compounds attention.</h2>
                  </div>
                  <p className="lead">
                    Holders can verify the drops, the project can show live stats, and every five-minute cycle gives
                    people a fresh reason to check back.
                  </p>
                </div>
                <div className="cards">
                  <div className="card">
                    <div className="icon">
                      <TimerReset size={22} />
                    </div>
                    <h3>Clockwork cadence</h3>
                    <p>Railway runs the worker every five minutes with overlap protection and idempotent epochs.</p>
                  </div>
                  <div className="card">
                    <div className="icon">
                      <Gift size={22} />
                    </div>
                    <h3>Real wallet sends</h3>
                    <p>Reward transfers use associated token accounts and store settled transaction signatures.</p>
                  </div>
                  <div className="card">
                    <div className="icon">
                      <ShieldCheck size={22} />
                    </div>
                    <h3>Launch safe gates</h3>
                    <p>Claim, buy, and airdrop all default off until env flags are explicitly turned on.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <footer className="footer">
        <div className="container nav-inner">
          <span>© 2026 {PROJECT_NAME}. Ticker: ${SOURCE_SYMBOL}.</span>
          <span className="mono">claim - swap - snapshot - send ${REWARD_SYMBOL}</span>
        </div>
      </footer>
    </div>
  );
}
