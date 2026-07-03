import { CopyCaButton } from "./copy-ca-button";
import { HeroCountdown, HowItWorks, LiveAnsemAirdrops, RecentAirdrops, RewardExplanation } from "./home-strategy-data";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "ANSEMFIFICATION";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "";
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/Ansemfy_";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "ANSEMFY";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "1M";

function Navbar() {
  return (
    <header className="nav ansemfy-nav">
      <div className="container nav-inner">
        <a className="brand ansemfy-brand" href="/">
          <img className="brand-logo" src="/brand/ansemfy-logo.jpg" alt={`${PROJECT_NAME} logo`} />
          <span>
            ANSEMFY
            <small>Join the army</small>
          </span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#initiation">Initiation</a>
          <a href="#how">How it Works</a>
          <a href="#rewards">Rewards</a>
          <a href="#airdrops">Airdrops</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="nav-actions">
          {CONTRACT_ADDRESS ? <CopyCaButton address={CONTRACT_ADDRESS} label={shortAddress(CONTRACT_ADDRESS)} /> : null}
          <a className="cta secondary nav-x-button" href={X_URL} target="_blank" rel="noreferrer" aria-label="Open ANSEMFY on X">
            X
          </a>
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
    <div className="page ansemfy-page">
      <Navbar />

      <main>
        <section className="hero ansemfy-hero ansemfication-hero" id="initiation">
          <div className="ansemfy-army-bg" aria-hidden="true" />
          <div className="ansemfy-aurora" aria-hidden="true" />
          <div className="ansemfy-grid" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />

          <div className="container ansemfication-hero-inner">
            <div className="ansemfication-copy">
              <img className="ansemfication-hero-logo" src="/brand/ansemfy-logo.jpg" alt="ANSEMFY logo" />
              <div className="section-kicker">The trenches made Ansem</div>
              <h1>ANSEMFIFICATION</h1>
              <p className="hero-subtitle">The initiation into the Cult of Ansem.</p>
              <p className="hero-lead">
                Tag @Ansemfy_ on X. Receive your Ansemified profile picture. Upload it. Join the army.
              </p>
              <div className="ansemfication-steps" aria-label="ANSEMFIFICATION flow">
                {[
                  ["01", "Tag @Ansemfy_"],
                  ["02", "Receive your Ansemified PFP"],
                  ["03", "Become the cult"]
                ].map(([number, label]) => (
                  <article className="ansemfication-step" key={label}>
                    <span>{number}</span>
                    <strong>{label}</strong>
                  </article>
                ))}
              </div>
              <div className="hero-actions">
                <a className="cta" href={X_URL} target="_blank" rel="noreferrer">
                  Tag @Ansemfy_
                </a>
                <a className="cta secondary" href="#airdrops">
                  View Airdrops
                </a>
              </div>
            </div>

            <HeroCountdown />
          </div>
        </section>
        <RewardExplanation />
        <HowItWorks />
        <LiveAnsemAirdrops />
        <RecentAirdrops />

        <section className="section faq-section ansemfy-faq" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Simple mechanics.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body={`Hold at least ${ELIGIBILITY_LABEL} ${SOURCE_LABEL}. The live worker uses the Railway eligibility env as the source of truth.`} />
              <FaqItem title="What gets airdropped?" body={`Creator fees buy ${REWARD_SYMBOL}. Settled transfers are sent directly to eligible holders.`} />
              <FaqItem title="Do I need to claim?" body="No. Airdrops are automatic after each completed epoch." />
              <FaqItem title="How does ANSEMFIFICATION work?" body="Tag @Ansemfy_ on X. The bot flow returns an Ansemified profile picture for you to use on your profile." />
              <FaqItem title="What is the PFP bonus?" body="The brand system reserves a creator-fee slice for holders using an Ansemified profile picture once verification is connected." />
              <FaqItem title="What should I tag?" body="Mention @Ansemfy_ on X to start the initiation." />
            </div>
          </div>
        </section>

        <section className="section ansemfy-closing-section">
          <div className="container ansemfy-closing-copy">
            <h2>The trenches made Ansem. Now Ansem saves the trenches.</h2>
            <p>Hold {SOURCE_LABEL}. Tag the account. Wear the face. Join the army.</p>
            <a className="cta" href={X_URL} target="_blank" rel="noreferrer">
              Start the initiation
            </a>
          </div>
        </section>
      </main>

      <footer className="footer ansemfy-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src="/brand/ansemfy-logo.jpg" alt={`${PROJECT_NAME} logo`} />
            <strong>ANSEMFY</strong>
          </div>
          <p>The trenches made Ansem. Now Ansem builds the trenches.</p>
          <div className="footer-links">
            <a href="#initiation">Initiation</a>
            <a href="#how">How it Works</a>
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
