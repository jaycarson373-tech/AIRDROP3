import { ArrowRight, BarChart3, Flame, ShieldCheck, TrendingUp } from "lucide-react";
import { CopyCaButton } from "./copy-ca-button";
import {
  BullBoard,
  BuybackBurnSection,
  HeroCountdown,
  HolderLookup,
  LiveMarketDashboard,
  LiveProtocolDashboard,
  PermanentEligibility,
  RecentAirdrops,
  RewardExplanation,
  SolLongStrategy
} from "./home-strategy-data";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "Bull Strategy";
const DEFAULT_CA = "YLkZ3NSYF1Xyj4eEzhg4PDjda1wJkr3zYXuNCpCpump";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? DEFAULT_CA;
const BUY_URL =
  process.env.NEXT_PUBLIC_BUY_URL ??
  (CONTRACT_ADDRESS
    ? `https://jup.ag/?sell=So11111111111111111111111111111111111111112&buy=${CONTRACT_ADDRESS}`
    : "https://jup.ag/");
const DEX_URL =
  process.env.NEXT_PUBLIC_DEX_URL ??
  (CONTRACT_ADDRESS ? `https://dexscreener.com/solana/${CONTRACT_ADDRESS}` : "");
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "BULLSTRAT";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "500K";
const engineSteps = [
  { value: "50%", label: "ANSEM AIRDROPS", Icon: BarChart3 },
  { value: "50%", label: "SOL LONG RESERVE", Icon: TrendingUp },
  { value: "PROFIT", label: "BUYBACKS", Icon: Flame },
  { value: "BURN", label: "SUPPLY REDUCTION", Icon: ShieldCheck }
];

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand bull-brand" href="/">
          <img className="brand-logo" src="/brand/black-bull-logo.png" alt={`${PROJECT_NAME} logo`} />
          <span>
            Bull Strategy
            <small>{SOURCE_SYMBOL} market engine</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#dashboard">Dashboard</a>
          <a href="#strategy">Strategy</a>
          <a href="#markets">Markets</a>
          <a href="#airdrops">Airdrops</a>
          <a href="#long">SOL Long</a>
          <a href="#burns">Burns</a>
        </nav>
        <div className="nav-actions">
          {CONTRACT_ADDRESS ? <CopyCaButton address={CONTRACT_ADDRESS} label={shortAddress(CONTRACT_ADDRESS)} /> : null}
          {DEX_URL ? (
            <a className="cta secondary nav-x-button" href={DEX_URL} target="_blank" rel="noreferrer" aria-label={`Open ${SOURCE_SYMBOL} chart on DexScreener`}>
              DEX
            </a>
          ) : null}
          {X_URL ? (
            <a className="cta secondary nav-x-button" href={X_URL} target="_blank" rel="noreferrer" aria-label="Open Bull Strategy on X">
              X
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
    <div className="page bull-strategy-page">
      <Navbar />

      <main>
        <section className="hero bull-hero" id="top">
          <div className="hero-art hero-wall-street" aria-hidden="true" />
          <div className="bull-market-grid" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />

          <div className="container hero-inner">
            <div className="hero-copy-stack">
              <div className="section-kicker">Automated bull-market engine</div>
              <h1>
                <span>BULL</span>
                <span>STRATEGY</span>
              </h1>
              <p className="hero-subtitle">Long SOL. Accumulate ANSEM. Burn {SOURCE_LABEL}.</p>
              <p className="hero-lead">
                Bull Strategy splits creator fees into two engines: 50% buys and airdrops ${REWARD_SYMBOL} to eligible holders, while 50% funds a scaled SOL perpetual long. Realized profits from the long buy back and burn {SOURCE_LABEL}.
              </p>
              <div className="hero-actions">
                <a className="cta" href={BUY_URL} target="_blank" rel="noreferrer">
                  Buy {SOURCE_LABEL} <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="#airdrops">
                  View Airdrops
                </a>
                <a className="cta ghost" href="#burns">
                  View Burns
                </a>
              </div>
            </div>
            <div className="hero-terminal-stack">
              <div className="hero-bull-window">
                <img src="/brand/black-bull-logo.png" alt="" />
                <div>
                  <span>Strategy split</span>
                  <strong>50 / 50</strong>
                </div>
              </div>
              <HeroCountdown />
            </div>
          </div>
        </section>

        <LiveProtocolDashboard />
        <StrategySection />
        <RewardExplanation />
        <LiveMarketDashboard />
        <PermanentEligibility />
        <BullBoard />
        <RecentAirdrops />
        <SolLongStrategy />
        <BuybackBurnSection />
        <HolderLookup />

        <section className="section faq-section" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Strategy notes.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body={`Hold at least ${ELIGIBILITY_LABEL} ${SOURCE_LABEL}. The live backend can override the threshold through envs.`} />
              <FaqItem title="What gets airdropped?" body={`The ANSEM side buys ${REWARD_SYMBOL} and sends settled airdrops directly to eligible ${SOURCE_SYMBOL} holders.`} />
              <FaqItem title="What happens to the other 50%?" body="It is reserved for the SOL long strategy side. Realized SOL long profits are the only funds intended for buyback and burn." />
              <FaqItem title="Does the worker risk the whole wallet?" body="No. The worker keeps the permanent SOL reserve and transaction buffer before calculating usable strategy funds." />
              <FaqItem title="Is there claiming?" body="No wallet connection is required to receive airdrops. The backend handles settled transfers automatically." />
            </div>
          </div>
        </section>

        <section className="section final-bull-section bull-closing-section">
          <div className="final-bull-art" aria-hidden="true" />
          <div className="container final-bull-copy">
            <h2>FEES FUEL THE THESIS.</h2>
            <p>Long SOL.</p>
            <p>Accumulate ANSEM.</p>
            <strong>Burn {SOURCE_SYMBOL}.</strong>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/brand/black-bull-logo.png" alt={`${PROJECT_NAME} logo`} />
            <strong>Bull Strategy</strong>
          </div>
          <p>50% ANSEM airdrops. 50% SOL long reserve. Realized profits reduce supply.</p>
          <div className="footer-links">
            <a href="#dashboard">Dashboard</a>
            <a href="#strategy">Strategy</a>
            <a href="#markets">Markets</a>
            <a href="#airdrops">Airdrops</a>
            <a href="#long">SOL Long</a>
            <a href="#burns">Burns</a>
            {DEX_URL ? (
              <a href={DEX_URL} target="_blank" rel="noreferrer">
                DEX
              </a>
            ) : null}
            {X_URL ? (
              <a href={X_URL} target="_blank" rel="noreferrer">
                X
              </a>
            ) : null}
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

function StrategySection() {
  return (
    <section className="section strategy-thesis-section bull-thesis-section" id="strategy">
      <div className="bull-strategy-glow" aria-hidden="true" />
      <div className="container black-bull-grid">
        <aside className="black-bull-card bull-engine-card">
          <div className="black-bull-portrait">
            <img src="/brand/black-bull-logo.png" alt="Bull Strategy mark" />
          </div>
          <div className="black-bull-card-head">
            <span>Two-engine strategy</span>
            <strong>Bull Strategy</strong>
          </div>
          <div className="bull-signal-list">
            <span>50% ANSEM accumulation</span>
            <span>50% SOL long reserve</span>
            <span>Eligible {SOURCE_SYMBOL} holders</span>
            <span>Realized profit burns</span>
          </div>
        </aside>

        <div className="black-bull-copy">
          <div className="section-kicker">The bull strategy</div>
          <h2>LONG SOL. ACCUMULATE ANSEM. REDUCE SUPPLY.</h2>
          <div className="lore-copy">
            <p>Ansem has been bullish on SOL and ANSEM. Bull Strategy turns that thesis into an automated on-chain engine.</p>
            <p>Every live epoch, usable creator fees are split into two sides after reserves are protected.</p>
            <p>Half buys {REWARD_SYMBOL} for eligible {SOURCE_LABEL} holders. Half stays allocated to the SOL long strategy side.</p>
            <p>Only realized SOL long profits are intended for buyback and burn. No fake burn numbers are shown before live integration.</p>
          </div>
        </div>
      </div>
      <div className="container black-bull-timeline bull-engine-strip" aria-label="Bull Strategy engines">
        {engineSteps.map(({ value, label, Icon }) => (
          <span key={label}>
            <Icon size={18} />
            <b>{value}</b>
            {label}
          </span>
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
