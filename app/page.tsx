import { CatPfpConveyor, HallOfBulls, HeroCountdown, HowItWorks, LatestHoodActivity, LiveAnsemAirdrops, RewardExplanation } from "./home-strategy-data";
import { CopyCaButton } from "./copy-ca-button";
import { MarketTicker } from "./market-ticker";

const PROJECT_NAME = "Cat in Hood";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? "EtvM4ugrmpzpgYjbg2oxqNYKWgNDgh5c9TwbRz5mpump";
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/CatInHood";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "CAT";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "HOODx";
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "1M";
const LOGO_SRC = "/brand/cat-in-hood-logo.png";

function compactAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Page() {
  return (
    <div className="page ansemfy-page robin-page cat-hood-page has-market-ticker">
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
                <img className="ansemfication-hero-logo bullify-hero-logo" src={LOGO_SRC} alt="Cat in Hood logo" />
                <div>
                  <em><span aria-hidden="true">●</span> Live</em>
                  <span>Hood rewards</span>
                  <strong>Cat in Hood live</strong>
                </div>
              </div>
              <div className="bullify-history-punch" aria-label="Cat in Hood thesis">
                <span>HOODx Stock drops</span>
                <span>Every 5 minutes</span>
                <span>1M+ holders</span>
                <span>5%+ wallets excluded</span>
              </div>
              <div className="section-kicker">Hood reward protocol</div>
              <h1>CAT IN HOOD</h1>
              <p className="hero-subtitle">The hooded cat pays the holders.</p>
              <p className="hero-lead">
                Cat in Hood turns creator fees into live HOODx Stock rewards.
                <br />
                <br />
                Every 5 minutes, creator fees automatically buy and airdrop {`$${REWARD_SYMBOL}`} to eligible {SOURCE_LABEL} holders.
                <br />
                <br />
                Rewards are proportional to eligible holder balance, with 5%+ wallets excluded from the snapshot.
                <br />
                <br />
                Hold {ELIGIBILITY_LABEL}+ {SOURCE_LABEL}. Stay below the whale cap. Let the hood eat.
              </p>
              <div className="bullify-brief-grid" aria-label="Cat in Hood reward structure">
                <article>
                  <span>Holder floor</span>
                  <strong>{ELIGIBILITY_LABEL}+ {SOURCE_LABEL}</strong>
                </article>
                <article>
                  <span>Epoch</span>
                  <strong>5 minutes</strong>
                </article>
                <article>
                  <span>Whale cap</span>
                  <strong>5% max</strong>
                </article>
              </div>
              <div className="ansemfication-steps" aria-label="Cat in Hood flow">
                {[
                  ["01", `Hold ${SOURCE_LABEL}`],
                  ["02", `Fees buy ${REWARD_SYMBOL}`],
                  ["03", "Holders receive drops"]
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
        <CatPfpConveyor />
        <RewardExplanation />
        <HallOfBulls />
        <LatestHoodActivity />
        <LiveAnsemAirdrops />
        <FallenBulls />

        <section className="section faq-section ansemfy-faq" id="faq">
          <div className="container">
            <div className="section-kicker">FAQ</div>
            <h2>Cat in Hood mechanics.</h2>
            <div className="faq-grid bullify-faq-grid">
              <FaqItem title="How do I qualify?" body={`Hold ${ELIGIBILITY_LABEL}+ ${SOURCE_LABEL} and remain eligible at the snapshot.`} />
              <FaqItem title="What gets airdropped?" body={`Creator fees buy ${REWARD_SYMBOL} Stock. Settled transfers are sent directly to eligible holders every 5 minutes.`} />
              <FaqItem title="What is the Hood Board?" body="The Hood Board is the live proof layer for holders, drops, reward totals and transaction receipts." />
              <FaqItem title="Do I need to claim?" body="No. Holder airdrops are automatic after each completed epoch." />
              <FaqItem title="Who is excluded?" body="Wallets holding more than 5% of supply are excluded from reward snapshots." />
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
            <strong>Cat in Hood</strong>
          </div>
          <p>Hooded cat energy. 5-minute HOODx Stock airdrops with proof on every drop.</p>
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
