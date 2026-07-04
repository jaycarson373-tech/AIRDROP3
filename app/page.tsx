import { HallOfBulls, HeroCountdown, HowItWorks, LiveAnsemAirdrops, RecentAirdrops, RewardExplanation } from "./home-strategy-data";
import { MarketTicker } from "./market-ticker";

const PROJECT_NAME = "Bullify";
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/i/communities/2028470502415835347";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "BULLIFY";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "500K";
const LOGO_SRC = "/brand/bullify-logo.png";

export default function Page() {
  return (
    <div className="page ansemfy-page has-market-ticker">
      <MarketTicker
        logoSrc={LOGO_SRC}
        projectName={PROJECT_NAME}
        xUrl={X_URL}
      />

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
              <div className="bullify-history-punch" aria-label="Bullify thesis">
                <span>History was made.</span>
                <span>Ansem airdropped 10M+.</span>
                <span>Black Bull ran to 350M.</span>
                <span>Bullification is the next chapter.</span>
              </div>
              <div className="section-kicker">Bulls only protocol</div>
              <h1>BULLIFICATION</h1>
              <p className="hero-subtitle">The initiation into the Black Bull Army.</p>
              <p className="hero-lead">
                Tag @Bullification_ on X. Receive your Bullified PFP. Upload it. Join the army. Earn {`$${REWARD_SYMBOL}`}.
              </p>
              <p className="hero-reward-note">
                Hold {ELIGIBILITY_LABEL}+ {SOURCE_LABEL}. No selling ever. Once a connected wallet sells, it loses eligibility for both
                10-minute {`$${REWARD_SYMBOL}`} drops and Bullified PFP bonus drops.
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
                  ["01", "Tag @Bullification_"],
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
        <HallOfBulls />
        <FallenBulls />
        <LiveAnsemAirdrops />
        <RecentAirdrops />

        <section className="section faq-section ansemfy-faq" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Bullification mechanics.</h2>
            <div className="faq-grid">
              <FaqItem title="How do I qualify?" body={`Hold ${ELIGIBILITY_LABEL}+ ${SOURCE_LABEL}. No selling ever.`} />
              <FaqItem title="What gets airdropped?" body={`50% of creator fees buy ${REWARD_SYMBOL}. Settled transfers are sent directly to eligible holders every 10 minutes.`} />
              <FaqItem title="What is the Bullified bonus pool?" body="The other 50% is reserved for verified members using their Bullified PFP. Manual fulfillment is supported while the X bot is being connected." />
              <FaqItem title="Do I need to claim?" body="No. Holder airdrops are automatic after each completed epoch." />
              <FaqItem title="What happens if I sell?" body={`Once a connected wallet sells any ${SOURCE_LABEL}, it loses eligibility for both 10-minute ${REWARD_SYMBOL} drops and Bullified PFP bonus drops.`} />
              <FaqItem title="How do I become Bullified?" body="Tag or reply to @Bullification_ on X. The bot flow is prepared for automated replies, and manual fulfillment can run until the bot is live." />
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
            <a href="#rewards">Rewards</a>
            <a href="#army">Army</a>
            <a href="#airdrops">Proof</a>
            <a href={X_URL} target="_blank" rel="noreferrer">
              X
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FallenBulls() {
  return (
    <section className="section bullify-fallen-section" id="fallen">
      <div className="container">
        <div className="section-kicker">Fallen Bulls</div>
        <div className="section-head split-head">
          <h2>Once a bull sells, they fall.</h2>
          <p>No 10-minute drops. No Bullified PFP bonus pool.</p>
        </div>
        <div className="bullify-fallen-empty">
          <strong>No fallen bulls yet.</strong>
          <p>Wallets that sell after connecting will appear here when Supabase records the fall.</p>
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
