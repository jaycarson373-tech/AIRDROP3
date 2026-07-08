import { HallOfBulls, HeroCountdown, HowItWorks, LatestHoodActivity, LiveAnsemAirdrops, RewardExplanation } from "./home-strategy-data";
import { CopyCaButton } from "./copy-ca-button";
import { MarketTicker } from "./market-ticker";

const PROJECT_NAME = "Robin Hood";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? "EtvM4ugrmpzpgYjbg2oxqNYKWgNDgh5c9TwbRz5mpump";
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/HOODSTR_";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "HOOD";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "500K";
const LOGO_SRC = "/brand/robin-hood-logo.svg";

function compactAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Page() {
  return (
    <div className="page ansemfy-page robin-page has-market-ticker">
      <MarketTicker
        logoSrc={LOGO_SRC}
        projectName={PROJECT_NAME}
        xUrl={X_URL}
        contractAddress={CONTRACT_ADDRESS}
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
                <img className="ansemfication-hero-logo bullify-hero-logo" src={LOGO_SRC} alt="Robin Hood logo" />
                <div>
                  <em><span aria-hidden="true">●</span> Live</em>
                  <span>Trench rewards</span>
                  <strong>Robin Hood live</strong>
                </div>
              </div>
              <div className="bullify-history-punch" aria-label="Robin Hood thesis">
                <span>Steal from the rich</span>
                <span>Give to the trenches</span>
                <span>Live reward epochs</span>
                <span>Holders eat</span>
              </div>
              <div className="section-kicker">Trench reward protocol</div>
              <h1>ROBIN HOOD</h1>
              <p className="hero-subtitle">Steal from the rich. Give to the trenches.</p>
              <p className="hero-lead">
                Robin Hood turns creator fees into live rewards for the holders still in the forest.
                <br />
                <br />
                Creator fees automatically buy and airdrop {`$${REWARD_SYMBOL}`} to eligible {SOURCE_LABEL} holders.
                <br />
                <br />
                The Hood Board tracks eligible wallets, proof, latest drops and every settled transaction.
                <br />
                <br />
                Hold {ELIGIBILITY_LABEL}+ {SOURCE_LABEL}. Stay eligible. Let the trenches eat.
              </p>
              <div className="bullify-brief-grid" aria-label="Robin Hood reward structure">
                <article>
                  <span>Holder floor</span>
                  <strong>{ELIGIBILITY_LABEL}+ {SOURCE_LABEL}</strong>
                </article>
                <article>
                  <span>Epoch</span>
                  <strong>Live drops</strong>
                </article>
                <article>
                  <span>Route</span>
                  <strong>Rewards</strong>
                </article>
              </div>
              <div className="ansemfication-steps" aria-label="Robin Hood flow">
                {[
                  ["01", `Hold ${SOURCE_LABEL}`],
                  ["02", "Fees buy rewards"],
                  ["03", "Trenches receive drops"]
                ].map(([number, label]) => (
                  <article className="ansemfication-step" key={label}>
                    <span>{number}</span>
                    <strong>{label}</strong>
                  </article>
                ))}
              </div>
              <div className="hero-actions">
                <a className="cta" href={X_URL} target="_blank" rel="noreferrer">
                  Join the Hood
                </a>
                <CopyCaButton address={CONTRACT_ADDRESS} label={compactAddress(CONTRACT_ADDRESS)} />
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
        <LatestHoodActivity />
        <LiveAnsemAirdrops />
        <FallenBulls />

        <section className="section faq-section ansemfy-faq" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Robin Hood mechanics.</h2>
            <div className="faq-grid bullify-faq-grid">
              <FaqItem title="How do I qualify?" body={`Hold ${ELIGIBILITY_LABEL}+ ${SOURCE_LABEL} and remain eligible at the snapshot.`} />
              <FaqItem title="What gets airdropped?" body={`Creator fees buy ${REWARD_SYMBOL}. Settled transfers are sent directly to eligible holders after each completed epoch.`} />
              <FaqItem title="What is the Hood Board?" body="The Hood Board is the live proof layer for holders, drops, reward totals and transaction receipts." />
              <FaqItem title="Do I need to claim?" body="No. Holder airdrops are automatic after each completed epoch." />
              <FaqItem title="Why Robin Hood?" body="Because the protocol routes reward energy back to the trenches instead of letting it disappear into the noise." />
              <FaqItem title="Where is proof?" body="Latest reward rounds, holder transfers and Solscan links appear in the live airdrop section." />
              <FaqItem title="What should holders watch?" body="Next epoch, eligible holders, total distributed and latest transaction proof." />
            </div>
          </div>
        </section>

      </main>

      <footer className="footer ansemfy-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src={LOGO_SRC} alt={`${PROJECT_NAME} logo`} />
            <strong>Robin Hood</strong>
          </div>
          <p>Steal from the rich. Give to the trenches. Live holder rewards with proof on every drop.</p>
          <div className="footer-links">
            <a href="#initiation">Protocol</a>
            <a href="#rewards">Rewards</a>
            <a href="#army">Hood Board</a>
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
        <div className="section-kicker">Out of the Hood</div>
        <div className="section-head split-head">
          <h2>Eligibility is earned every epoch.</h2>
          <p>Wallets that fall below the threshold leave the reward queue until they qualify again.</p>
        </div>
        <div className="bullify-fallen-empty">
          <strong>No wallets out of the hood yet.</strong>
          <p>Wallets removed by holder-state rules will appear here when Supabase records them.</p>
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
