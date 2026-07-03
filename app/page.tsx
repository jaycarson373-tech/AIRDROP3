import { CopyCaButton } from "./copy-ca-button";
import { HeroCountdown, HowItWorks, LiveAnsemAirdrops, RecentAirdrops, RewardExplanation } from "./home-strategy-data";
import { MarketTicker } from "./market-ticker";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "ANSEMFIFICATION";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "";
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/Ansemfy_";
const COMMUNITY_URL = process.env.NEXT_PUBLIC_COMMUNITY_URL ?? X_URL;
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "ANSEMFY";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "1M";
const avatarTiles = Array.from({ length: 32 }, (_, index) => index + 1);

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
    <div className="page ansemfy-page has-market-ticker">
      <MarketTicker />
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
              <div className="section-kicker">The supercycle finally has a main character</div>
              <h1>ANSEMFIFICATION</h1>
              <p className="hero-subtitle">The initiation into the Cult of Ansem.</p>
              <p className="hero-lead">
                The supercycle finally has a main character. Tag @Ansemfy_. Receive your Ansemified profile picture. Wear it. Join the army.
                Hold {SOURCE_LABEL} to earn automated {`$${REWARD_SYMBOL}`} airdrops.
              </p>
              <p className="hero-reward-note">
                80% of rewards go to all eligible holders. 20% is reserved for holders proudly using an Ansemified profile picture.
              </p>
              <div className="ansemfication-steps" aria-label="ANSEMFIFICATION flow">
                {[
                  ["01", "Tag @Ansemfy_"],
                  ["02", "Receive your Ansemified PFP"],
                  ["03", "Wear it. Join the army."]
                ].map(([number, label]) => (
                  <article className="ansemfication-step" key={label}>
                    <span>{number}</span>
                    <strong>{label}</strong>
                  </article>
                ))}
              </div>
              <div className="hero-actions">
                <a className="cta" href={X_URL} target="_blank" rel="noreferrer">
                  Become Ansem
                </a>
                <a className="cta secondary" href={COMMUNITY_URL} target="_blank" rel="noreferrer">
                  Join Community
                </a>
              </div>
              <p className="hero-community-note">
                The 20% bonus pool is community driven. Post your Ansemified PFP. Raid with the community. Participate. When community reward campaigns happen, eligible wallet addresses are collected from participants for the bonus pool.
              </p>
            </div>

            <HeroCountdown />
          </div>
        </section>
        <WhyAnsem />
        <LatestAnsemifiedProfiles />
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

function WhyAnsem() {
  const moments = [
    ["Solana", "Called Solana before it became mainstream."],
    ["WIF", "Helped drive one of the strongest WIF communities."],
    ["Culture", "Built one of crypto's largest cult followings."],
    ["Trenches", "Continues pushing builders, creators and the trenches forward."]
  ];

  return (
    <section className="section why-ansem-section" id="why-ansem">
      <div className="container">
        <div className="section-kicker">Why Ansem?</div>
        <div className="section-head split-head">
          <h2>Conviction became culture.</h2>
          <p>
            The trenches needed someone willing to take conviction trades publicly. Ansem became one of the defining voices of this cycle by backing ideas before they became obvious.
          </p>
        </div>
        <div className="why-ansem-timeline">
          {moments.map(([title, body]) => (
            <article className="why-ansem-card" key={title}>
              <span>{title}</span>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="why-ansem-tribute">Ansemification is our tribute to that movement.</div>
      </div>
    </section>
  );
}

function LatestAnsemifiedProfiles() {
  return (
    <section className="section latest-ansemified-section">
      <div className="container">
        <div className="section-kicker">Latest Ansemified Profiles</div>
        <div className="section-head split-head">
          <h2>The army is forming.</h2>
          <p>Every profile becomes another signal that the trenches are moving together.</p>
        </div>
        <div className="ansemfy-avatar-wall" aria-hidden="true">
          <div className="ansemfy-avatar-track">
            {[...avatarTiles, ...avatarTiles].map((tile, index) => (
              <span className={`ansemfy-avatar-tile variant-${(tile % 9) + 1} avatar-pos-${(tile % 16) + 1}`} key={`row-a-${tile}-${index}`} />
            ))}
          </div>
          <div className="ansemfy-avatar-track">
            {[...avatarTiles.slice().reverse(), ...avatarTiles.slice().reverse()].map((tile, index) => (
              <span className={`ansemfy-avatar-tile variant-${(tile % 9) + 1} avatar-pos-${(tile % 16) + 1}`} key={`row-b-${tile}-${index}`} />
            ))}
          </div>
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

function shortAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
