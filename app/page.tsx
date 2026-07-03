import { Bot, UploadCloud } from "lucide-react";
import { AnsemfyGenerator } from "./ansemfy-generator";
import { CopyCaButton } from "./copy-ca-button";
import { LatestGeneratedProfiles, LiveAnsemAirdrops, RecentAirdrops, RewardExplanation } from "./home-strategy-data";

const PROJECT_NAME = process.env.NEXT_PUBLIC_PROJECT_NAME ?? "ANSEMFY";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CA ?? process.env.NEXT_PUBLIC_SOURCE_TOKEN_MINT ?? "";
const BUY_URL = CONTRACT_ADDRESS
  ? `https://jup.ag/?sell=So11111111111111111111111111111111111111112&buy=${CONTRACT_ADDRESS}`
  : "https://jup.ag/";
const X_URL = process.env.NEXT_PUBLIC_X_URL ?? "https://x.com/Ansemfy_";
const SOURCE_SYMBOL = process.env.NEXT_PUBLIC_SOURCE_SYMBOL ?? "ANSEMFY";
const SOURCE_LABEL = `$${SOURCE_SYMBOL}`;
const REWARD_SYMBOL = process.env.NEXT_PUBLIC_REWARD_SYMBOL ?? "ANSEM";
const ELIGIBILITY_LABEL = process.env.NEXT_PUBLIC_ELIGIBILITY_LABEL ?? "500K";

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
          <a href="#generator">Generator</a>
          <a href="#how">How it Works</a>
          <a href="#gallery">Profiles</a>
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
        <AnsemfyGenerator hero />
        <RewardExplanation />
        <LatestGeneratedProfiles />
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
              <FaqItem title="How does ANSEMFY work?" body="Upload a profile picture or paste an X username. The placeholder UI is live now; the image edit endpoint is ready to be wired to the future AI backend." />
              <FaqItem title="What is the PFP bonus?" body="The brand system reserves a creator-fee slice for holders using an Ansemified profile picture once verification is connected." />
              <FaqItem title="What should I tag?" body="Post your generated PFP on X and tag @Ansemfy_." />
            </div>
          </div>
        </section>

        <section className="section ansemfy-closing-section">
          <div className="container ansemfy-closing-copy">
            <Bot size={28} />
            <h2>The trenches made Ansem. Now Ansem saves the trenches.</h2>
            <p>Hold {SOURCE_LABEL}. Generate the PFP. Join the movement.</p>
            <a className="cta" href="#generator">
              Start Ansemfying <UploadCloud size={18} />
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
            <a href="#generator">Generator</a>
            <a href="#how">How it Works</a>
            <a href="#gallery">Profiles</a>
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
