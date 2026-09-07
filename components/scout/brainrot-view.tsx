"use client";

import Link from "next/link";
import { ExternalLink, PhoneCall, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { projectConfig } from "./project-config";

const BRAINROT_TIMELINE = [
  {
    era: "2023",
    title: "JOHN PORK CALLS",
    signal: "the phone incident",
    body: "john pork called. society answered. everything got worse after this.",
    href: "https://johnpork.com/pages/about"
  },
  {
    era: "FEB 2023",
    title: "SKIBIDI ARRIVES",
    signal: "toilet cinema",
    body: "an eleven-second toilet video becomes an entire cinematic universe. normal media is cooked.",
    href: "https://www.youtube.com/shorts/6WS7_R3e6sY"
  },
  {
    era: "DEC 2024",
    title: "BRAIN ROT IS OFFICIAL",
    signal: "dictionary moment",
    body: "oxford names brain rot its word of the year. the disease receives accreditation.",
    href: "https://corp.oup.com/news/brain-rot-named-oxford-word-of-the-year-2024/"
  },
  {
    era: "JAN 2025",
    title: "ITALIAN BRAINROT",
    signal: "tralalero time",
    body: "ai animals get impossible names and the timeline develops irreversible pasta damage.",
    href: "https://knowyourmeme.com/memes/italian-brainrot-ai-italian-animals"
  },
  {
    era: "FEB 2025",
    title: "TRIPLE T",
    signal: "tung tung tung",
    body: "tung tung tung sahur walks into the global canon holding a baseball bat. very important history.",
    href: "https://www.mementumlab.com/wiki-tung-tung"
  },
  {
    era: "2025",
    title: "6-7",
    signal: "the number",
    body: "two integers stop meaning math. nobody can explain it. everyone understands it.",
    href: "https://www.youtube.com/watch?v=07xpV4ix2K8"
  }
] as const;

const ROT_WORDS = [
  "JOHN PORK IS CALLING",
  "67",
  "TRALALERO",
  "SKIBIDI",
  "TUNG TUNG TUNG",
  "BRUH",
  "BRAIN = OFFLINE",
  "$BRAINROT"
] as const;

type CallPhase = "ringing" | "answering" | "done";

function JohnPorkCallIntro() {
  const [phase, setPhase] = useState<CallPhase>("ringing");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const answerDelay = reducedMotion ? 250 : 2700;
    const revealDelay = reducedMotion ? 600 : 3500;
    const answerTimer = window.setTimeout(() => setPhase("answering"), answerDelay);
    const revealTimer = window.setTimeout(() => setPhase("done"), revealDelay);

    return () => {
      window.clearTimeout(answerTimer);
      window.clearTimeout(revealTimer);
    };
  }, []);

  const answerNow = () => {
    if (phase !== "ringing") return;
    setPhase("answering");
    window.setTimeout(() => setPhase("done"), 700);
  };

  return (
    <div
      className={`brainrot-call-gate is-${phase}`}
      role="dialog"
      aria-label="John Pork incoming call"
      aria-hidden={phase === "done"}
    >
      <p className="brainrot-call-gate__status">
        {phase === "ringing" ? "INCOMING BRAINROT..." : "CALL ACCEPTED ✓"}
      </p>
      <div className="brainrot-call-phone">
        <img src="/brand/john-pork-calling.jpg" alt="John Pork is calling" />
        <button className="brainrot-call-answer" type="button" onClick={answerNow} aria-label="Accept John Pork call">
          <span aria-hidden="true" />
        </button>
        {phase === "answering" ? <i className="brainrot-call-tap" aria-hidden="true">☝</i> : null}
      </div>
      <p className="brainrot-call-gate__hint">do not panic. he does this sometimes.</p>
    </div>
  );
}

export function BrainrotView() {
  const [introRun, setIntroRun] = useState(0);
  const launchUrl = projectConfig.buyUrl || projectConfig.stonkUrl;

  return (
    <div className="brainrot-chaos-home">
      <JohnPorkCallIntro key={introRun} />

      <section className="brainrot-chaos-hero" id="top">
        <div className="brainrot-chaos-hero__noise" aria-hidden="true" />
        <div className="brainrot-floater brainrot-floater--one" aria-hidden="true">67</div>
        <div className="brainrot-floater brainrot-floater--two" aria-hidden="true">bruh</div>
        <div className="brainrot-floater brainrot-floater--three" aria-hidden="true">???</div>
        <div className="brainrot-floater brainrot-floater--four" aria-hidden="true">brain=offline</div>

        <div className="brainrot-chaos-hero__copy">
          <p className="brainrot-scribble">launched on stonkfun • paired with $NEURAL</p>
          <h1>BRAINROT</h1>
          <h2>the word of our generation <em>(unfortunately)</em></h2>
          <p>
            brainrot ate the entire internet so we gave it a coin. it launches through StonkFun,
            pairs with tokenized Neuralink exposure, and this is probably what technology was for.
          </p>
          <div className="brainrot-chaos-actions">
            <a href={launchUrl} target="_blank" rel="noopener noreferrer">
              BUY THE ROT <Zap size={17} aria-hidden="true" />
            </a>
            <a href="#stonk">wait how money happen</a>
          </div>
          <button className="brainrot-replay-call" type="button" onClick={() => setIntroRun((run) => run + 1)}>
            <PhoneCall size={15} aria-hidden="true" /> make john pork call again
          </button>
        </div>

        <div className="brainrot-patrick-card">
          <span>LIVE BRAIN SCAN (REAL)</span>
          <img src="/brand/brainrot-logo.jpg" alt="BRAINROT Patrick logo" />
          <strong>brain activity: basically none</strong>
          <small>he is trying his best</small>
        </div>
      </section>

      <div className="brainrot-chaos-marquee" aria-label="Brainrot cultural feed">
        <div>
          {[...ROT_WORDS, ...ROT_WORDS].map((word, index) => <span key={`${word}-${index}`}>{word}</span>)}
        </div>
      </div>

      <section className="brainrot-stonk-thing" id="stonk">
        <div className="brainrot-sticker">NO TIMER LOL</div>
        <div>
          <p className="brainrot-section-label">the money part (boring but important)</p>
          <h2>stonk does the stonk thing.</h2>
          <p>
            $BRAINROT is paired with $NEURAL on StonkFun. Trading activity builds the platform reward pot.
            StonkFun handles holder rewards using its own mechanics whenever the pot clears.
          </p>
          <p className="brainrot-honesty">no fake countdown. no claim button. no pretending we know the exact second.</p>
          <div className="brainrot-chaos-actions">
            <a href={projectConfig.stonkUrl} target="_blank" rel="noopener noreferrer">
              OPEN STONKFUN <ExternalLink size={15} aria-hidden="true" />
            </a>
            <Link href="/rewards">SEE REAL RECEIPTS</Link>
          </div>
        </div>
        <aside aria-label="BRAINROT and Neural pairing">
          <b>BRAINROT</b>
          <i>+</i>
          <b>NEURAL</b>
          <i>=</i>
          <strong>more brain?</strong>
        </aside>
      </section>

      <section className="brainrot-lore" id="timeline">
        <header>
          <p className="brainrot-section-label">important human achievements since 2023</p>
          <h2>the rot expanded.</h2>
          <p>historians will hate this page. historians are not our target demographic.</p>
        </header>
        <div className="brainrot-lore-grid">
          {BRAINROT_TIMELINE.map((entry, index) => (
            <a href={entry.href} target="_blank" rel="noopener noreferrer" key={entry.title} style={{ "--tilt": `${index % 2 ? 1.2 : -1.2}deg` } as React.CSSProperties}>
              <span>{entry.era}</span>
              <small>{entry.signal}</small>
              <h3>{entry.title}</h3>
              <p>{entry.body}</p>
              <b>inspect the lore ↗</b>
            </a>
          ))}
        </div>
      </section>

      <section className="brainrot-neural">
        <img src="/brand/neural-logo.png" alt="NEURAL token logo" />
        <div>
          <p className="brainrot-section-label">brainrot x neuralink-ish</p>
          <h2>we paired no brain with more brain.</h2>
          <p>
            $NEURAL is a tokenized Neuralink exposure asset, not Neuralink stock. BRAINROT is independent
            and not endorsed by Neuralink, PreStocks, or StonkFun. yes the lawyers made us type this. they are right.
          </p>
        </div>
      </section>
    </div>
  );
}
