import { HeroCountdown, HowItWorks, LiveAnsemAirdrops, RecentAirdrops, RewardExplanation } from "./home-strategy-data";
import { MarketTicker } from "./market-ticker";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "Bullify";
const DEFAULT_CONTRACT_ADDRESS = "8Z12Faqh6vhekfFLiRHsaVGTMVDjumC5W1Qa5E3Tpump";
const DEFAULT_BUY_URL = `https://jup.ag/?sell=So11111111111111111111111111111111111111112&buy=${DEFAULT_CONTRACT_ADDRESS}`;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? DEFAULT_CONTRACT_ADDRESS;
const BUY_URL = process.env.NEXT_PUBLIC_BUY_URL ?? DEFAULT_BUY_URL;
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/Bullify_";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "BULLIFY";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "500K";
const LOGO_SRC = "/brand/bullify-logo.png";

function SideNav() {
  return (
    <aside className="nav ansemfy-nav" aria-label="Section navigation">
      <div className="nav-inner">
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#initiation">Initiation</a>
          <a href="#how">How it Works</a>
          <a href="#rewards">Rewards</a>
          <a href="#army">Army</a>
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
        <section className="hero ansemfy-hero ansemfication-hero bullify-hero" id="initiation">
          <div className="ansemfy-army-bg" aria-hidden="true" />
          <div className="ansemfy-aurora" aria-hidden="true" />
          <div className="ansemfy-grid" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />

          <div className="container ansemfication-hero-inner">
            <div className="ansemfication-copy">
              <div className="bullify-signal-card">
                <img className="ansemfication-hero-logo bullify-hero-logo" src={LOGO_SRC} alt="Bullify logo" />
                <div>
                  <span>Black Bull Army</span>
                  <strong>Bullification live</strong>
                </div>
              </div>
              <div className="section-kicker">Bulls only protocol</div>
              <h1>BULLIFICATION</h1>
              <p className="hero-subtitle">The initiation into the Black Bull Army.</p>
              <p className="hero-lead">
                Tag @Bullify_ on X. Receive your Bullified PFP. Upload it. Join the army. Earn {`$${REWARD_SYMBOL}`}.
              </p>
              <p className="hero-reward-note">
                Hold {ELIGIBILITY_LABEL}+ {SOURCE_LABEL}. Half of creator fees buy and airdrop {`$${REWARD_SYMBOL}`} every 10 minutes.
                Half is reserved for verified Black Bull Army members using their Bullified PFP.
              </p>
              <div className="bullify-brief-grid" aria-label="Bullify reward structure">
                <article>
                  <span>Holder floor</span>
                  <strong>{ELIGIBILITY_LABEL}+ {SOURCE_LABEL}</strong>
                </article>
                <article>
                  <span>Epoch</span>
                  <strong>10 minutes</strong>
                </article>
                <article>
                  <span>Split</span>
                  <strong>50 / 50</strong>
                </article>
              </div>
              <div className="ansemfication-steps" aria-label="Bullification flow">
                {[
                  ["01", "Tag @Bullify_"],
                  ["02", "Receive Bullified PFP"],
                  ["03", "Join the army"]
                ].map(([number, label]) => (
                  <article className="ansemfication-step" key={label}>
                    <span>{number}</span>
                    <strong>{label}</strong>
                  </article>
                ))}
              </div>
              <div className="hero-actions">
                <a className="cta" href={X_URL} target="_blank" rel="noreferrer">
                  Become Bullified
                </a>
                <a className="cta secondary" href="#airdrops">
                  View Airdrops
                </a>
              </div>
            </div>

            <HeroCountdown />
          </div>
        </section>
        <HowItWorks />
        <RewardExplanation />
        <BlackBullArmy />
        <LiveAnsemAirdrops />
        <RecentAirdrops />

        <section className="section faq-section ansemfy-faq" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Bullification mechanics.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body={`Hold at least ${ELIGIBILITY_LABEL} ${SOURCE_LABEL}. The live worker uses the Railway eligibility env as the source of truth.`} />
              <FaqItem title="What gets airdropped?" body={`50% of creator fees buy ${REWARD_SYMBOL}. Settled transfers are sent directly to eligible holders every 10 minutes.`} />
              <FaqItem title="What is the Bullified bonus pool?" body="The other 50% is reserved for verified members using their Bullified PFP. Manual fulfillment is supported while the X bot is being connected." />
              <FaqItem title="Do I need to claim?" body="No. Holder airdrops are automatic after each completed epoch." />
              <FaqItem title="What happens if I sell?" body={`A wallet that sells any amount of ${SOURCE_LABEL} during the epoch is ineligible for that epoch. Bulls only.`} />
              <FaqItem title="How do I become Bullified?" body="Tag or reply to @Bullify_ on X. The bot flow is prepared for automated replies, and manual fulfillment can run until the bot is live." />
            </div>
          </div>
        </section>

        <section className="section ansemfy-closing-section">
          <div className="container ansemfy-closing-copy">
            <h2>Join the Black Bull Army.</h2>
            <p>Tag. Transform. Hold. Earn. Bulls only.</p>
            <a className="cta" href={X_URL} target="_blank" rel="noreferrer">
              Become Bullified
            </a>
          </div>
        </section>
      </main>

      <footer className="footer ansemfy-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src={LOGO_SRC} alt={`${PROJECT_NAME} logo`} />
            <strong>Bullify</strong>
          </div>
          <p>Bullification for the Black Bull Army. 50/50 ANSEM holder rewards and Bullified PFP bonus pool.</p>
          <div className="footer-links">
            <a href="#initiation">Initiation</a>
            <a href="#how">How it Works</a>
            <a href="#rewards">Rewards</a>
            <a href="#army">Army</a>
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

function BlackBullArmy() {
  return (
    <section className="section bullify-army-section" id="army">
      <div className="container">
        <div className="section-kicker">Black Bull Army</div>
        <div className="section-head split-head">
          <h2>The army grows every epoch.</h2>
          <p>As holders become Bullified, their profile pictures will be added here. No fake avatars.</p>
        </div>
        <div className="bullify-army-grid" aria-label="Bullified profile placeholders">
          {Array.from({ length: 24 }, (_, index) => (
            <article className="bullify-army-card" key={index}>
              <span>🐂</span>
            </article>
          ))}
        </div>
        <div className="bullify-army-empty">
          <strong>The Black Bull Army is assembling.</strong>
          <p>Tag @Bullify_ and upload your Bullified profile picture to be added when verification is connected.</p>
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
