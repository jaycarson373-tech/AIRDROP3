import { ArrowRight } from "lucide-react";
import { CopyCaButton } from "./copy-ca-button";
import {
  AirdroppedStat,
  BullBoard,
  HeroCountdown,
  HoodBonusSection,
  HolderLookup,
  LiveProtocolDashboard,
  MarketVolumeSection,
  PermanentEligibility,
  RecentAirdrops,
  RewardExplanation
} from "./home-strategy-data";

const PROJECT_NAME = "The Robin Hood";
const DEFAULT_CA = "G7cjRAF31V8K6r89pxHqLYrmG94TwxkJtfWg3AZapump";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? `https://pump.fun/coin/${DEFAULT_CA}`;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? DEFAULT_CA;
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/RobinHoodSol__";

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <img className="brand-logo" src="/logo.png" alt={`${PROJECT_NAME} logo`} />
          <span>
            The Robin Hood
            <small>HOOD rewards</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#dashboard">Live Data</a>
          <a href="#strategy">No Bridge</a>
          <a href="#how">Rewards</a>
          <a href="#hood-bonus">Reward Model</a>
          <a href="#hood-board">Board</a>
          <a href="#airdrops">Airdrops</a>
        </nav>
        <div className="nav-actions">
          {CONTRACT_ADDRESS ? (
            <CopyCaButton address={CONTRACT_ADDRESS} label={shortAddress(CONTRACT_ADDRESS)} />
          ) : null}
          {X_URL ? (
            <a className="mini-button x-button" href={X_URL} target="_blank" rel="noreferrer">
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
    <div className="page hood-strategy-page hood-bank-page">
      <div className="hood-bank-bg-rotator" aria-hidden="true">
        <span className="hood-bank-bg-layer bg-layer-one" />
      </div>
      <Navbar />

      <main>
        <section className="hero hood-hero" id="top">
          <div className="hero-shade" aria-hidden="true" />

          <div className="container hero-inner">
            <div className="hero-copy-stack">
              <div className="section-kicker">THE ROBIN HOOD</div>
              <h1>
                <span>The Robin</span>
                <span>Hood</span>
              </h1>
              <p className="hero-subtitle">
                Bullish on HOOD stock. Paid in HoodX.
              </p>
              <p className="hero-lead">
                The Robin Hood is for HOOD bulls who want HoodX stock rewards without bridging. Every 5 minutes, creator fees buy HOODx and airdrop it to eligible HOOD holders. Fully on-chain. Receipts included.
              </p>
              <div className="hero-actions">
                <a className="cta" href={BUY_URL} target="_blank" rel="noreferrer">
                  Buy HOOD <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="#airdrops">
                  View Rewards
                </a>
              </div>
            </div>
            <HeroCountdown />
          </div>
        </section>

        <section className="bank-statstrip" aria-label="The Robin Hood live rail">
          <div className="container bank-statstrip-inner">
            <div>
              <strong>100%</strong>
              <span>to HOODx</span>
            </div>
            <div>
              <strong>5 MIN</strong>
              <span>epochs</span>
            </div>
            <div>
              <strong>1M+</strong>
              <span>HOOD eligible</span>
            </div>
            <div>
              <AirdroppedStat />
            </div>
          </div>
        </section>

        <MarketVolumeSection />
        <LiveProtocolDashboard />
        <VaultSection />
        <RewardExplanation />
        <HoodBonusSection />
        <PermanentEligibility />
        <BullBoard />
        <RecentAirdrops />
        <HolderLookup />

        <section className="section faq-section" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Holder notes.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body="Hold at least 1,000,000 $HOOD and stay above that threshold." />
              <FaqItem title="How often are rewards sent?" body="Creator fees buy HOODx every 5 minutes when live conditions are met." />
              <FaqItem title="How does it work?" body="The backend claims fees, buys HOODx, scans eligible HOOD holders, and sends rewards automatically." />
              <FaqItem title="Who gets boosted?" body="The weighting skews toward smaller eligible HOOD bags and wallets with lower SOL balances." />
              <FaqItem title="Why HOOD?" body="This is a HOOD-native rewards token for people bullish on HOOD stock and HoodX, without the bridge headache." />
              <FaqItem title="Is there claiming?" body="No. The backend handles airdrops automatically. No wallet connection is required to receive rewards." />
            </div>
          </div>
        </section>

        <section className="section final-bull-section">
          <div className="final-bull-art" aria-hidden="true" />
          <div className="container final-bull-copy">
            <h2>THE ROBIN HOOD ONLINE. HOODx PAID. RECEIPTS LIVE.</h2>
            <p>Hold $HOOD.</p>
            <p>Skip the bridge.</p>
            <strong>Let the hood run.</strong>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/logo.png" alt={`${PROJECT_NAME} logo`} />
            <strong>The Robin Hood</strong>
          </div>
          <p>Hold HOOD. Get paid HOODx.</p>
          <div className="footer-links">
            <a href="#dashboard">Live Data</a>
            <a href="#strategy">No Bridge</a>
            <a href="#hood-bonus">Reward Model</a>
            <a href="#hood-board">Board</a>
            <a href="#airdrops">Airdrops</a>
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

function VaultSection() {
  return (
    <section className="section strategy-thesis-section" id="strategy">
      <div className="black-bull-glow" aria-hidden="true" />
      <div className="container black-bull-grid">
        <aside className="black-bull-card">
          <div className="black-bull-portrait">
            <img src="/logo.png" alt="The Robin Hood mark" />
          </div>
          <div className="black-bull-card-head">
            <span>HOOD stack</span>
            <strong>The Robin Hood</strong>
          </div>
          <div className="bull-signal-list">
            <span>Creator fees</span>
            <span>HOODx buys</span>
            <span>Holder scan</span>
            <span>Receipts live</span>
          </div>
        </aside>

        <div className="black-bull-copy">
          <div className="section-kicker">No bridge lane</div>
          <h2>FEES IN. HOODx OUT. RECEIPTS LIVE.</h2>
          <div className="lore-copy">
            <p>The Robin Hood turns creator fees into HoodX rewards for HOOD holders.</p>
            <p>Eligible wallets are scanned every 5 minutes and paid automatically when rewards are available.</p>
            <p>No bridge. No claiming. Just hold HOOD and read the receipts.</p>
          </div>
        </div>
      </div>
      <div className="container black-bull-timeline" aria-label="The Robin Hood reward model">
        {["Creator fees", "Buy HOODx", "Holder scan", "Airdrop", "Receipt ledger"].map((item) => (
          <span key={item}>{item}</span>
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
