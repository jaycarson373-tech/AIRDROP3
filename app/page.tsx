import { ArrowRight } from "lucide-react";
import { CopyCaButton } from "./copy-ca-button";
import {
  BullBoard,
  HeroCountdown,
  HoodBonusSection,
  HolderLookup,
  LiveProtocolDashboard,
  PermanentEligibility,
  RecentAirdrops,
  RewardExplanation
} from "./home-strategy-data";

const PROJECT_NAME = "HoodBank";
const DEFAULT_CA = "8u3oshsLdVmkLnGi4WuPUZVYLLzHccXFajHKQYNzpump";
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? "https://pump.fun";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? DEFAULT_CA;

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <img className="brand-logo" src="/brand/hood-strategy-logo.png" alt={`${PROJECT_NAME} logo`} />
          <span>
            HoodBank
            <small>HOODx vault</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#dashboard">Live Data</a>
          <a href="#strategy">Vault</a>
          <a href="#how">Rewards</a>
          <a href="#hood-bonus">Bank Model</a>
          <a href="#hood-board">Board</a>
          <a href="#airdrops">Airdrops</a>
        </nav>
        <div className="nav-actions">
          {CONTRACT_ADDRESS ? (
            <CopyCaButton address={CONTRACT_ADDRESS} label={shortAddress(CONTRACT_ADDRESS)} />
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
      <div className="market-tape" aria-hidden="true">
        <div className="market-tape-track">
          {Array.from({ length: 2 }).map((_, index) => (
            <div className="market-tape-set" key={index}>
              <span><b>HOODBANK</b> ONLINE</span>
              <span>CLAIM FEES</span>
              <span><b>BUY HOODx</b></span>
              <span>PAY HOLDERS</span>
              <span><b>250K+</b> ELIGIBLE</span>
              <span>ON-CHAIN RECEIPTS</span>
            </div>
          ))}
        </div>
      </div>
      <Navbar />

      <main>
        <section className="hero hood-hero" id="top">
          <div className="hero-art hero-mountains" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />

          <div className="container hero-inner">
            <div className="hero-copy-stack">
              <div className="section-kicker">HOODBANK</div>
              <h1>
                <span>Hood</span>
                <span>Bank</span>
              </h1>
              <p className="hero-subtitle">
                Hold HoodBank. Get paid HOODx.
              </p>
              <p className="hero-lead">
                Every epoch the machine claims creator fees, buys HOODx, and airdrops it to eligible holders. Proportional to your bag. Fully on-chain. Receipts included.
              </p>
              <div className="hero-actions">
                <a className="cta" href="#strategy">
                  Enter Bank <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="#airdrops">
                  View Rewards
                </a>
              </div>
            </div>
            <HeroCountdown />
          </div>
        </section>

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
            <h2>Vault notes.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body="Hold at least 250,000 $HOOD and stay above that threshold." />
              <FaqItem title="How often are rewards sent?" body="Creator fees buy HOODx every epoch when live conditions are met." />
              <FaqItem title="How does the bank work?" body="The backend claims fees, buys HOODx, scans eligible holders, and sends rewards automatically." />
              <FaqItem title="Does supply still matter?" body="Yes. Holder balance is the base weight, so larger holders can still earn more." />
              <FaqItem title="Is there claiming?" body="No. The backend handles airdrops automatically. No wallet connection is required to receive rewards." />
            </div>
          </div>
        </section>

        <section className="section final-bull-section">
          <div className="final-bull-art" aria-hidden="true" />
          <div className="container final-bull-copy">
            <h2>HOODBANK ONLINE. HOODx PAID. RECEIPTS LIVE.</h2>
            <p>Hold $HOOD.</p>
            <p>Track the engine.</p>
            <strong>Let the bank run.</strong>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/brand/hood-strategy-logo.png" alt={`${PROJECT_NAME} logo`} />
            <strong>HoodBank</strong>
          </div>
          <p>Hold HoodBank. Get paid HOODx.</p>
          <div className="footer-links">
            <a href="#dashboard">Live Data</a>
            <a href="#strategy">Vault</a>
            <a href="#hood-bonus">Bank Model</a>
            <a href="#hood-board">Board</a>
            <a href="#airdrops">Airdrops</a>
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

function VaultSection() {
  return (
    <section className="section strategy-thesis-section" id="strategy">
      <div className="black-bull-glow" aria-hidden="true" />
      <div className="container black-bull-grid">
        <aside className="black-bull-card">
          <div className="black-bull-portrait">
            <img src="/brand/hood-strategy-logo.png" alt="HoodBank mark" />
          </div>
          <div className="black-bull-card-head">
            <span>Vault stack</span>
            <strong>HoodBank</strong>
          </div>
          <div className="bull-signal-list">
            <span>Airdrop tech</span>
            <span>Retail meta</span>
            <span>HOOD stock thesis</span>
            <span>Trenches redistribution</span>
          </div>
        </aside>

        <div className="black-bull-copy">
          <div className="section-kicker">The bank</div>
          <h2>FEES IN. HOODx OUT. RECEIPTS LIVE.</h2>
          <div className="lore-copy">
            <p>HoodBank turns creator fees into a live HOODx reward vault.</p>
            <p>Eligible holders are scanned every epoch and paid automatically when the vault has rewards.</p>
            <p>No claiming. No wallet connection. Just hold, watch the bank, and read the receipts.</p>
          </div>
        </div>
      </div>
      <div className="container black-bull-timeline" aria-label="HoodBank reward model">
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
