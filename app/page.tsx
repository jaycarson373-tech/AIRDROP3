import { HeroCountdown, HowItWorks, LiveAnsemAirdrops, RecentAirdrops, RewardExplanation } from "./home-strategy-data";
import { MarketTicker } from "./market-ticker";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "Bull Terminal";
const DEFAULT_CONTRACT_ADDRESS = "8Z12Faqh6vhekfFLiRHsaVGTMVDjumC5W1Qa5E3Tpump";
const DEFAULT_BUY_URL = `https://jup.ag/?sell=So11111111111111111111111111111111111111112&buy=${DEFAULT_CONTRACT_ADDRESS}`;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? DEFAULT_CONTRACT_ADDRESS;
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? DEFAULT_BUY_URL;
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/BULLTERM";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "BULLTERM";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "1M";
const LOGO_SRC = "/brand/bull-terminal-logo.svg";

function SideNav() {
  return (
    <aside className="nav ansemfy-nav" aria-label="Section navigation">
      <div className="nav-inner">
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#terminal">Terminal</a>
          <a href="#watchlist">Watchlist</a>
          <a href="#research">Research</a>
          <a href="#rewards">Rewards</a>
          <a href="#airdrops">Airdrops</a>
          <a href="#faq">FAQ</a>
        </nav>
      </div>
    </aside>
  );
}

export default function Page() {
  return (
    <div className="page ansemfy-page has-market-ticker">
      <MarketTicker
        logoSrc={LOGO_SRC}
        projectName={PROJECT_NAME}
        contractAddress={CONTRACT_ADDRESS}
        buyUrl={BUY_URL}
        xUrl={X_URL}
      />
      <SideNav />

      <main>
        <section className="hero ansemfy-hero ansemfication-hero terminal-hero" id="terminal">
          <div className="ansemfy-army-bg" aria-hidden="true" />
          <div className="ansemfy-aurora" aria-hidden="true" />
          <div className="ansemfy-grid" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />

          <div className="container ansemfication-hero-inner">
            <div className="ansemfication-copy">
              <img className="ansemfication-hero-logo terminal-hero-logo" src={LOGO_SRC} alt="Bull Terminal logo" />
              <div className="section-kicker">Bloomberg for the trenches</div>
              <h1>Bull Terminal</h1>
              <p className="hero-subtitle">Everything Ansem is bullish on.</p>
              <p className="hero-lead">
                Live market dashboard. AI research. Community conviction. Automated {`$${REWARD_SYMBOL}`} rewards for eligible {SOURCE_LABEL} holders.
              </p>
              <p className="hero-reward-note">
                100% of creator fees automatically buy and distribute {`$${REWARD_SYMBOL}`}. One terminal, every thesis, clean holder rewards.
              </p>
              <div className="ansemfication-steps" aria-label="Bull Terminal flow">
                {[
                  ["01", "Track Ansem theses"],
                  ["02", "Watch live catalysts"],
                  ["03", "Earn ANSEM rewards"]
                ].map(([number, label]) => (
                  <article className="ansemfication-step" key={label}>
                    <span>{number}</span>
                    <strong>{label}</strong>
                  </article>
                ))}
              </div>
              <div className="hero-actions">
                <a className="cta" href="#watchlist">
                  Open Terminal
                </a>
                <a className="cta secondary" href={BUY_URL} target="_blank" rel="noreferrer">
                  Buy {SOURCE_LABEL}
                </a>
              </div>
            </div>

            <HeroCountdown />
          </div>
        </section>
        <TerminalDashboard />
        <AiResearch />
        <ThesisTimeline />
        <RewardExplanation />
        <HowItWorks />
        <LiveAnsemAirdrops />
        <RecentAirdrops />

        <section className="section faq-section ansemfy-faq" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Terminal mechanics.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body={`Hold at least ${ELIGIBILITY_LABEL} ${SOURCE_LABEL}. The live worker uses the Railway eligibility env as the source of truth.`} />
              <FaqItem title="What gets airdropped?" body={`100% of creator fees buy ${REWARD_SYMBOL}. Settled transfers are sent directly to eligible holders.`} />
              <FaqItem title="Do I need to claim?" body="No. Airdrops are automatic after each completed epoch." />
              <FaqItem title="What is Bull Terminal?" body="A daily dashboard for Ansem-aligned theses: prices, catalysts, AI summaries, sentiment, and reward proof." />
              <FaqItem title="Are rewards split anywhere else?" body="No. The reward path is clean: creator fees buy ANSEM and distribute it to eligible holders." />
              <FaqItem title="What comes next?" body="Editable watchlists, pinned assets, community suggestions, wallet login, alerts, and deeper AI research." />
            </div>
          </div>
        </section>

        <section className="section ansemfy-closing-section">
          <div className="container ansemfy-closing-copy">
            <h2>Stop chasing. Start tracking.</h2>
            <p>One terminal. Every thesis. Conviction over noise.</p>
            <a className="cta" href="#watchlist">
              Open Terminal
            </a>
          </div>
        </section>
      </main>

      <footer className="footer ansemfy-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src={LOGO_SRC} alt={`${PROJECT_NAME} logo`} />
            <strong>Bull Terminal</strong>
          </div>
          <p>Bloomberg for the trenches. 100% creator-fee ANSEM rewards.</p>
          <div className="footer-links">
            <a href="#terminal">Terminal</a>
            <a href="#watchlist">Watchlist</a>
            <a href="#research">Research</a>
            <a href="#rewards">Rewards</a>
            <a href="#airdrops">Airdrops</a>
            <a href={X_URL} target="_blank" rel="noreferrer">
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

function TerminalDashboard() {
  const assets = [
    ["SOL", "Solana ecosystem", "Live", "Syncing", "Core thesis"],
    ["ANSEM", "Reward asset", "Live", "Syncing", "Distribution rail"],
    ["BTC", "Macro anchor", "Live", "Syncing", "Risk barometer"],
    ["ETH", "Liquidity hub", "Live", "Syncing", "Institutional beta"],
    ["HYPE", "Perp venue", "Live", "Syncing", "High conviction"],
    ["WIF", "Solana culture", "Live", "Syncing", "Liquidity signal"],
    ["BONK", "Solana beta", "Live", "Syncing", "Community pulse"],
    ["SPX", "Narrative asset", "Live", "Syncing", "Narrative strength"]
  ];

  return (
    <section className="section terminal-dashboard-section" id="watchlist">
      <div className="container">
        <div className="section-kicker">Ansem watchlist</div>
        <div className="section-head split-head">
          <h2>One terminal. Every thesis.</h2>
          <p>Track the assets, catalysts, sentiment, and conviction signals the trenches are watching.</p>
        </div>
        <div className="terminal-asset-grid">
          {assets.map(([symbol, thesis, price, change, note]) => (
            <article className="terminal-asset-card" key={symbol}>
              <div className="asset-card-top">
                <span>{symbol}</span>
                <strong>Calibrating</strong>
              </div>
              <p>{thesis}</p>
              <div className="asset-card-metrics">
                <div><span>Price</span><strong>{price}</strong></div>
                <div><span>24H</span><strong>{change}</strong></div>
                <div><span>7D</span><strong>Syncing</strong></div>
              </div>
              <div className="asset-card-footer">
                <span>Bull Score</span>
                <em>{note}</em>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiResearch() {
  const cards = [
    ["AI summaries", "Short thesis notes, recent catalysts, risks, and opportunities for every tracked asset."],
    ["Community sentiment", "Watch what the trenches are rotating into before the timeline gets loud."],
    ["Bull Score", "Momentum, volume, narrative strength, AI rating, and community conviction in one simple score."],
    ["Editable watchlists", "Pinned assets, filters, biggest movers, most bullish, and recently added assets."]
  ];

  return (
    <section className="section terminal-research-section" id="research">
      <div className="container">
        <div className="section-kicker">AI research</div>
        <div className="section-head split-head">
          <h2>Conviction over noise.</h2>
          <p>Stop doom scrolling CT. Open one dashboard and know what the bulls know.</p>
        </div>
        <div className="terminal-feature-grid">
          {cards.map(([title, body]) => (
            <article className="terminal-feature-card" key={title}>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ThesisTimeline() {
  const items = [
    ["SOL", "Current thesis", "Ecosystem strength, builder activity, and retail attention remain the center of the terminal."],
    ["ANSEM", "Reward rail", "Creator fees route back into ANSEM accumulation and direct holder distributions."],
    ["HYPE", "Market structure", "A tracked venue for perp volume, liquidity, and high-conviction rotations."],
    ["WIF", "Community beta", "Community velocity and Solana liquidity remain watchlist inputs."]
  ];

  return (
    <section className="section terminal-timeline-section">
      <div className="container">
        <div className="section-kicker">Thesis timeline</div>
        <div className="section-head split-head">
          <h2>Track the rotation.</h2>
          <p>Chronological thesis notes, performance context, catalysts, and AI summaries.</p>
        </div>
        <div className="terminal-timeline">
          {items.map(([asset, title, body]) => (
            <article className="terminal-timeline-card" key={asset}>
              <span>{asset}</span>
              <strong>{title}</strong>
              <p>{body}</p>
            </article>
          ))}
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
