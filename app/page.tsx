import { HallOfBulls, HeroCountdown, HowItWorks, LatestHoodActivity, LiveAnsemAirdrops, RewardExplanation } from "./home-strategy-data";
import { CopyCaButton } from "./copy-ca-button";
import { MarketTicker } from "./market-ticker";

const PROJECT_NAME = "Hood Strategy";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "soon";
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/HOODSTR_";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "HOOD";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "HOOD";
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "1M";
const LOGO_SRC = "/brand/robin-hood-logo.svg";

function compactAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Page() {
  return (
    <div className="page ansemfy-page robin-page hood-page has-market-ticker">
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
                <img className="ansemfication-hero-logo bullify-hero-logo" src={LOGO_SRC} alt="Hood Strategy logo" />
                <div>
                  <em><span aria-hidden="true">●</span> Live</em>
                  <span>Hood Strategy on Sol</span>
                  <strong>HOOD rewards live</strong>
                </div>
              </div>
              <div className="bullify-history-punch" aria-label="Hood Strategy thesis">
                <span>Hood stock rewards</span>
                <span>Verified holder draws</span>
                <span>Every 5 minutes</span>
                <span>1M+ holders</span>
                <span>5%+ wallets excluded</span>
              </div>
              <div className="section-kicker">Hood Strategy protocol</div>
              <h1>HOOD STRATEGY</h1>
              <p className="hero-subtitle">Real airdrops. Verified holders. Neon proof.</p>
              <p className="hero-lead">
                Hood Strategy turns creator fees into live HOOD rewards for the timeline and the chain.
                <br />
                <br />
                50% of usable rewards automatically airdrops to {ELIGIBILITY_LABEL}+ {SOURCE_LABEL} holders.
                <br />
                <br />
                The other 50% funds verified Hood memecoin holders, early movers and live draw prizes. Winners have 24 hours to claim and prove wallet ownership through X.
                <br />
                <br />
                Hold, stay active on X, verify ownership, and let the Hood Board show the receipts.
              </p>
              <div className="bullify-brief-grid" aria-label="Hood Strategy reward structure">
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
                  <strong>50 / 50</strong>
                </article>
              </div>
              <div className="ansemfication-steps" aria-label="Hood Strategy flow">
                {[
                  ["01", `Hold ${SOURCE_LABEL}`],
                  ["02", "Verify on X"],
                  ["03", "Live draws settle"]
                ].map(([number, label]) => (
                  <article className="ansemfication-step" key={label}>
                    <span>{number}</span>
                    <strong>{label}</strong>
                  </article>
                ))}
              </div>
              <div className="hero-actions">
                <a className="cta" href={X_URL} target="_blank" rel="noreferrer">
                  Join Hood Strategy
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
            <h2>Hood Strategy mechanics.</h2>
            <div className="faq-grid bullify-faq-grid">
              <FaqItem title="How do I qualify?" body={`Hold ${ELIGIBILITY_LABEL}+ ${SOURCE_LABEL}, stay under the 5% wallet cap, and keep ownership provable from that wallet.`} />
              <FaqItem title="What gets airdropped?" body={`50% of usable rewards buys back ${REWARD_SYMBOL} for automatic holder drops. 50% funds verified Hood holders and live draw prizes.`} />
              <FaqItem title="What is the Hood Board?" body="The Hood Board is the live proof layer for holders, drops, reward totals and transaction receipts." />
              <FaqItem title="Do I need to claim?" body="Automatic holder drops do not need a claim. Live draw winners must respond on X within 24 hours and prove wallet ownership." />
              <FaqItem title="Who is excluded?" body="Wallets holding more than 5% of supply are excluded from reward snapshots." />
              <FaqItem title="Who gets verified rewards?" body="Verified Hood memecoin holders, early movers and active X community members can be queued for claimable draws." />
              <FaqItem title="Where is proof?" body="Latest reward rounds, holder transfers and Solscan links appear in the live airdrop section." />
            </div>
          </div>
        </section>

      </main>

      <footer className="footer ansemfy-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img className="brand-logo" src={LOGO_SRC} alt={`${PROJECT_NAME} logo`} />
            <strong>Hood Strategy</strong>
          </div>
          <p>Hood Strategy on Sol. 50/50 HOOD airdrops with proof on every drop and draw.</p>
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
          <p>Hood Strategy rewards stay scarce by removing wallets that sell from the airdrop queue.</p>
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
