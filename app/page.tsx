import { HallOfBulls, HeroCountdown, HowItWorks, LatestHoodActivity, LiveAnsemAirdrops, RewardExplanation } from "./home-strategy-data";
import { CopyCaButton } from "./copy-ca-button";
import { MarketTicker } from "./market-ticker";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "Robin Hood";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "soon";
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/RobinHoodSol";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "HOOD";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "HOOD";
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "100K";
const LOGO_SRC = "/brand/robin-hood-logo.png";

function compactAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Page() {
  return (
    <div className="page ansemfy-page robin-page hood-page cat-hood-page has-market-ticker">
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
                  <span>Robin Hood on Solana</span>
                  <strong>HOOD drops live</strong>
                </div>
              </div>
              <div className="bullify-history-punch" aria-label="Robin Hood thesis">
                <span>Steal from the rich</span>
                <span>Give to the trenches</span>
                <span>80% HOOD buybacks</span>
                <span>20% bagwork fund</span>
                <span>Hood belongs on Sol</span>
              </div>
              <div className="section-kicker">Robin Hood on Solana</div>
              <h1>ROBIN HOOD</h1>
              <p className="hero-subtitle">Steal from the rich. Give to the trenches.</p>
              <p className="hero-lead">
                Robin Hood belongs on Solana. Last year they removed SOL; now the trenches are taking the hood back.
                <br />
                <br />
                Every 5 minutes, creator fees buy {REWARD_SYMBOL} and airdrop it to eligible {SOURCE_LABEL} holders.
                <br />
                <br />
                The rich get clipped, the hood gets paid. Wallets above 5% are excluded and 20% is reserved for bagwork.
              </p>
              <div className="bullify-brief-grid" aria-label="Robin Hood reward structure">
                <article>
                  <span>Holder floor</span>
                  <strong>{ELIGIBILITY_LABEL}+ {SOURCE_LABEL}</strong>
                </article>
                <article>
                  <span>Epoch</span>
                  <strong>5 minutes</strong>
                </article>
                <article>
                  <span>Split</span>
                  <strong>80 / 20</strong>
                </article>
              </div>
              <div className="ansemfication-steps" aria-label="Robin Hood flow">
                {[
                  ["01", `Hold ${SOURCE_LABEL}`],
                  ["02", "Fees buy HOOD"],
                  ["03", "Drops settle"]
                ].map(([number, label]) => (
                  <article className="ansemfication-step" key={label}>
                    <span>{number}</span>
                    <strong>{label}</strong>
                  </article>
                ))}
              </div>
              <div className="hero-actions">
                <a className="cta" href={X_URL} target="_blank" rel="noreferrer">
                  Join Robin Hood
                </a>
                {CONTRACT_ADDRESS !== "soon" ? <CopyCaButton address={CONTRACT_ADDRESS} label={compactAddress(CONTRACT_ADDRESS)} /> : null}
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
              <FaqItem title="How do I qualify?" body={`Hold ${ELIGIBILITY_LABEL}+ ${SOURCE_LABEL} and stay under the 5% wallet cap.`} />
              <FaqItem title="What gets airdropped?" body={`Usable creator fees buy ${REWARD_SYMBOL}, then ${REWARD_SYMBOL} is distributed to eligible holders every 5 minutes.`} />
              <FaqItem title="What is the Hood Board?" body="The Hood Board is the live proof layer for holders, drops, reward totals and transaction receipts." />
              <FaqItem title="Do I need to claim?" body="No. Holder drops settle automatically after each epoch." />
              <FaqItem title="Who is excluded?" body="Wallets holding more than 5% of supply are excluded from reward snapshots." />
              <FaqItem title="How are rewards sized?" body={`Rewards are proportional to eligible ${SOURCE_LABEL} held at the snapshot.`} />
              <FaqItem title="Where is proof?" body="Latest reward rounds, holder transfers and Solscan links appear in the live airdrop section." />
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
          <p>Robin Hood on Solana. HOOD airdrops for eligible holders with proof on every drop.</p>
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
          <h2>Sell once. Out forever.</h2>
          <p>Robin Hood keeps the board clean by showing wallets removed by holder-state rules.</p>
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
