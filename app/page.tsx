import {
  ArrowRight,
  BadgeDollarSign,
  Gift,
  Search,
  ShieldCheck,
  Sparkles,
  TimerReset,
  WalletCards,
  Zap
} from "lucide-react";

const stats = [
  ["5 min", "Reward cycle"],
  ["Top 50", "Holder snapshots"],
  ["5%+", "Whales excluded"],
  ["PUMP", "Reward token"]
];

const cards = [
  {
    icon: BadgeDollarSign,
    title: "Fees become rewards",
    body: "The worker claims Pump creator fees, swaps the available SOL into PUMP, and records every epoch in Supabase."
  },
  {
    icon: WalletCards,
    title: "Top holders get paid",
    body: "$AIRDROP holders with at least 1M tokens are ranked, whales above the cap are removed, and the top 50 split rewards by weight."
  },
  {
    icon: ShieldCheck,
    title: "Proof before send",
    body: "Every planned payout gets an idempotency key before tokens move, so redeploys do not duplicate airdrops."
  }
];

const tabs = ["Trending", "Airdrops", "Top holders", "New", "Live"];

const feed = [
  {
    symbol: "$AIRDROP",
    title: "Pump Airdrop",
    meta: "5m reward cycle",
    body: "Creator fees buy PUMP and send it to top holders automatically.",
    mc: "$ live soon"
  },
  {
    symbol: "PUMP",
    title: "Reward Asset",
    meta: "Jupiter route",
    body: "Treasury SOL swaps into PUMP before each holder-weighted send.",
    mc: "reward"
  },
  {
    symbol: "TOP 50",
    title: "Holder Snapshot",
    meta: "No 5%+ whales",
    body: "Eligible wallets are ranked by source-token balance every epoch.",
    mc: "proof"
  }
];

function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="/">
          <span className="coin">$</span>
          <span>Pump Airdrop</span>
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="#go">GO</a>
          <a href="#how">Communities</a>
          <a href="/dashboard">Live</a>
          <a href="#terminal">Terminal</a>
        </nav>
        <div className="nav-actions">
          <a className="mini-button" href="#go">
            Create
          </a>
          <a href="#proof">Proof</a>
          <a className="cta" href="/dashboard">
            Live Drops <ArrowRight size={17} />
          </a>
        </div>
      </div>
    </header>
  );
}

export default function Page() {
  return (
    <div className="page">
      <div className="grid-bg" />
      <Navbar />

      <main>
        <section className="hero" id="go">
          <div className="container hero-layout">
            <div>
              <div className="eyebrow">
                <span className="pulse" />
                Welcome to Pump Airdrop
              </div>
              <h1>
                Create the <span className="gradient">airdrop meta</span>.
              </h1>
              <p className="hero-copy">
                $AIRDROP is the live reward terminal for people tired of waiting. Fees come in, PUMP gets bought,
                holders get ranked, and the top wallets get paid on repeat.
              </p>
              <div className="search-shell">
                <Search size={18} />
                <span>Search for drops, holders, epochs...</span>
                <kbd>⌘K</kbd>
              </div>
              <div className="hero-actions">
                <a className="cta" href="/dashboard">
                  View Live Dashboard <ArrowRight size={18} />
                </a>
                <a className="cta secondary" href="#how">
                  How It Works
                </a>
              </div>
            </div>

            <div className="terminal pump-card" aria-label="Airdrop process preview" id="terminal">
              <div className="terminal-bar">
                <div className="dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span>pump.airdrop/live</span>
              </div>
              <div className="terminal-body">
                {[
                  ["1", "Claim creator fees", "Collect available Pump fees into treasury"],
                  ["2", "Swap to PUMP", "Use the safe SOL balance, leave gas reserve"],
                  ["3", "Snapshot $AIRDROP", "Top 50 holders, no 5%+ whales"],
                  ["4", "Airdrop rewards", "Proportional PUMP sends with proof rows"]
                ].map(([step, title, body]) => (
                  <div className="flow-row" key={step}>
                    <span className="step-dot">{step}</span>
                    <span>
                      <strong>{title}</strong>
                      <small>{body}</small>
                    </span>
                    <span className="tag">LIVE</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section explore">
          <div className="container">
            <div className="section-head compact">
              <div>
                <div className="eyebrow">
                  <Zap size={15} />
                  Trending now
                </div>
                <h2>Explore drops</h2>
              </div>
              <a className="mini-button" href="/dashboard">
                Grid / Table
              </a>
            </div>
            <div className="tabs" aria-label="Explore filters">
              {tabs.map((tab) => (
                <button type="button" key={tab}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="coin-feed">
              {feed.map((item) => (
                <article className="coin-card" key={item.symbol}>
                  <div className="coin-avatar">{item.symbol.slice(0, 2)}</div>
                  <div>
                    <div className="coin-title">
                      <strong>{item.title}</strong>
                      <span>{item.symbol}</span>
                    </div>
                    <p>{item.body}</p>
                    <small>{item.meta}</small>
                  </div>
                  <span className="mc">{item.mc}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="proof">
          <div className="container stats">
            {stats.map(([value, label]) => (
              <div className="stat" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="how">
          <div className="container">
            <div className="section-head">
              <h2>
                Cleaner than a promise.
                <br />
                Better than waiting.
              </h2>
              <p className="lead">
                The old game was hoping for a Pump airdrop. The new game is building the reward engine yourself:
                fees in, PUMP out, holders paid on-chain.
              </p>
            </div>

            <div className="cards">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className="card" key={card.title}>
                    <div className="icon">
                      <Icon size={22} />
                    </div>
                    <h3>{card.title}</h3>
                    <p>{card.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="terminal">
              <div className="terminal-body">
                <div className="section-head">
                  <div>
                    <div className="eyebrow">
                      <Sparkles size={15} />
                      $AIRDROP flywheel
                    </div>
                    <h2 style={{ marginTop: 18 }}>Every epoch compounds attention.</h2>
                  </div>
                  <p className="lead">
                    Holders can verify the drops, the project can show live stats, and every five-minute cycle gives
                    people a fresh reason to check back.
                  </p>
                </div>
                <div className="cards">
                  <div className="card">
                    <div className="icon">
                      <TimerReset size={22} />
                    </div>
                    <h3>Clockwork cadence</h3>
                    <p>Railway runs the worker every five minutes with overlap protection and idempotent epochs.</p>
                  </div>
                  <div className="card">
                    <div className="icon">
                      <Gift size={22} />
                    </div>
                    <h3>Real wallet sends</h3>
                    <p>Reward transfers use associated token accounts and store settled transaction signatures.</p>
                  </div>
                  <div className="card">
                    <div className="icon">
                      <ShieldCheck size={22} />
                    </div>
                    <h3>Launch safe gates</h3>
                    <p>Claim, buy, and airdrop all default off until env flags are explicitly turned on.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container nav-inner">
          <span>© 2026 Pump Airdrop. Ticker: $AIRDROP.</span>
          <span className="mono">claim - swap - snapshot - send</span>
        </div>
      </footer>
    </div>
  );
}
