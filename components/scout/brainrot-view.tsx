"use client";

import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { projectConfig } from "./project-config";

const CHARACTERS = [
  {
    name: "PATRICK BRAINROT",
    era: "FOREVER ONLINE",
    note: "brain activity: no. aura: catastrophic.",
    image: "/brand/brainrot-logo.jpg",
    className: "is-patrick"
  },
  {
    name: "TRALALERO TRALALA",
    era: "ITALIAN ROT",
    note: "three shoes. zero explanations. bellissimo.",
    image: "/brand/tralalero.png",
    className: "is-tralalero"
  },
  {
    name: "BOMBARDIRO CROCODILO",
    era: "AIRBORNE NONSENSE",
    note: "the timeline requested air support. huge mistake.",
    image: "/brand/bombardiro.png",
    className: "is-bombardiro"
  },
  {
    name: "TUNG TUNG TUNG SAHUR",
    era: "MAXIMUM AURA",
    note: "heard three knocks. the lore entered with a bat.",
    image: "/brand/tung-tung.png",
    className: "is-tung"
  },
  {
    name: "BALLERINA CAPPUCCINA",
    era: "ESPRESSO ARC",
    note: "serving pirouettes, caffeine and irreversible damage.",
    image: "/brand/ballerina.png",
    className: "is-ballerina"
  },
  {
    name: "SIX SEVEN",
    era: "THE NUMBER INCIDENT",
    note: "math left the chat. the children understood everything.",
    image: null,
    className: "is-sixty-seven"
  }
] as const;

const LORE = [
  {
    date: "2023",
    title: "JOHN PORK CALLS",
    copy: "humanity picked up the phone. the old world ended.",
    image: "/brand/john-pork-calling.jpg",
    stamp: "INCOMING"
  },
  {
    date: "FEB 2023",
    title: "SKIBIDI ESCAPES",
    copy: "eleven seconds of toilet cinema defeats traditional media.",
    image: "/brand/brainrot-logo.jpg",
    stamp: "SIGNAL LOST"
  },
  {
    date: "DEC 2024",
    title: "THE WORD BECOMES OFFICIAL",
    copy: "oxford names brain rot word of the year. scholars confirm we are cooked.",
    image: "/brand/tung-tung.png",
    stamp: "CERTIFIED"
  },
  {
    date: "2025",
    title: "ITALIAN BRAINROT",
    copy: "animals, objects and fake italian collide. cinema reaches its final form.",
    image: "/brand/tralalero.png",
    stamp: "BELLISSIMO"
  },
  {
    date: "2025",
    title: "6-7 DETECTED",
    copy: "two numbers become a complete language. every generation somehow gets it.",
    image: null,
    stamp: "ROT CRITICAL"
  }
] as const;

type CallPhase = "ringing" | "answering" | "done";

function JohnPorkCallIntro() {
  const [phase, setPhase] = useState<CallPhase>("ringing");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const answerTimer = window.setTimeout(() => setPhase("answering"), reducedMotion ? 200 : 2600);
    const revealTimer = window.setTimeout(() => setPhase("done"), reducedMotion ? 500 : 3350);
    return () => {
      window.clearTimeout(answerTimer);
      window.clearTimeout(revealTimer);
    };
  }, []);

  const answerNow = () => {
    if (phase !== "ringing") return;
    setPhase("answering");
    window.setTimeout(() => setPhase("done"), 650);
  };

  return (
    <div className={`brainrot-call-gate is-${phase}`} role="dialog" aria-label="John Pork incoming call" aria-hidden={phase === "done"}>
      <p className="brainrot-call-gate__status">{phase === "ringing" ? "JOHN PORK IS ON THE LINE..." : "CALL ACCEPTED. CINEMA. ✓"}</p>
      <div className="brainrot-call-phone">
        <img src="/brand/john-pork-calling.jpg" alt="John Pork is calling" />
        <button className="brainrot-call-answer" type="button" onClick={answerNow} aria-label="Accept John Pork call"><span aria-hidden="true" /></button>
        {phase === "answering" ? <i className="brainrot-call-tap" aria-hidden="true">☝</i> : null}
      </div>
      <p className="brainrot-call-gate__hint">pick up bro. the lore depends on it.</p>
    </div>
  );
}

function RotFeed() {
  return (
    <section className="fever-feed" id="rot-feed">
      <header>
        <span>LIVE FROM THE DAMAGED PART OF THE INTERNET</span>
        <h2>BRAINROT INDEX</h2>
        <strong>ROT LEVEL: ██████████ 100%</strong>
      </header>
      <div className="fever-feed__viewport">
        <div className="fever-feed__track">
          {[...CHARACTERS, ...CHARACTERS].map((character, index) => (
            <article className={`fever-card ${character.className}`} aria-hidden={index >= CHARACTERS.length} key={`${character.name}-${index}`}>
              <div className="fever-card__warning">{index % 2 ? "⚠ DO NOT THINK" : "100% REAL LORE"}</div>
              {character.image ? (
                <img src={character.image} alt={index < CHARACTERS.length ? character.name : ""} />
              ) : (
                <div className="fever-card__67" aria-label="Six seven">67</div>
              )}
              <span>{character.era}</span>
              <h3>{character.name}</h3>
              <p>{character.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrainrotView() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const launchUrl = projectConfig.buyUrl || projectConfig.stonkUrl;

  useEffect(() => {
    const popupTimer = window.setTimeout(() => setPopupOpen(true), 4700);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => window.clearTimeout(popupTimer);

    let frame = 0;
    const update = (event: PointerEvent) => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - .5) * 18;
        const y = (event.clientY / window.innerHeight - .5) * 14;
        rootRef.current?.style.setProperty("--mouse-x", `${x}px`);
        rootRef.current?.style.setProperty("--mouse-y", `${y}px`);
      });
    };
    window.addEventListener("pointermove", update, { passive: true });
    return () => {
      window.clearTimeout(popupTimer);
      window.removeEventListener("pointermove", update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="brainrot-fever" ref={rootRef}>
      <JohnPorkCallIntro />

      {popupOpen ? (
        <aside className="fever-popup" role="status">
          <div><span>brain_scan.exe</span><button type="button" onClick={() => setPopupOpen(false)} aria-label="Close brain scan popup"><X size={15} /></button></div>
          <strong>⚠ CRITICAL ROT DETECTED</strong>
          <p>good news: ur early<br />bad news: brain gone</p>
          <button type="button" onClick={() => setPopupOpen(false)}>ok lol</button>
        </aside>
      ) : null}

      <section className="fever-hero" id="top">
        <div className="fever-scanlines" aria-hidden="true" />
        <div className="fever-hero__copy">
          <span className="fever-kicker">WORLD WIDE WEB // CONDITION: TERMINAL</span>
          <h1 data-text="BRAINROT">BRAINROT</h1>
          <h2>THE INTERNET HAS A CONDITION.</h2>
          <p>HOLD $BRAINROT. GET $NEURALP.</p>
          <a className="fever-cta" href={launchUrl} target="_blank" rel="noopener noreferrer">ENTER THE ROT ↗</a>
        </div>

        <div className="fever-collage" aria-label="Brainrot character collage">
          <img className="fever-char fever-char--tralalero" src="/brand/tralalero.png" alt="Tralalero Tralala" />
          <img className="fever-char fever-char--bombardiro" src="/brand/bombardiro.png" alt="Bombardiro Crocodilo" />
          <img className="fever-char fever-char--tung" src="/brand/tung-tung.png" alt="Tung Tung Tung Sahur" />
          <img className="fever-char fever-char--ballerina" src="/brand/ballerina.png" alt="Ballerina Cappuccina" />
          <div className="fever-char fever-char--patrick">
            <img src="/brand/brainrot-logo.jpg" alt="Patrick Brainrot" />
            <b>PATRICK.BRAINROT</b>
          </div>
          <strong className="fever-67" aria-label="Six seven">67</strong>
        </div>

        <div className="fever-system fever-system--one"><b>brain activity</b><span>none detected</span><i><em /></i></div>
        <div className="fever-system fever-system--two"><b>rot level</b><span>CRITICAL</span><i><em /></i></div>
        <div className="fever-sticker fever-sticker--one">SIGNAL LOST</div>
        <div className="fever-sticker fever-sticker--two">67 DETECTED</div>
        <div className="fever-sticker fever-sticker--three">NO THOUGHTS<br />HEAD EMPTY</div>
      </section>

      <div className="fever-marquee" aria-label="Brainrot status feed"><div>
        {Array.from({ length: 2 }, (_, group) => (
          <span key={group}>ROT ROT ROT // JOHN PORK CALLING // SKIBIDI // TUNG TUNG TUNG // 67 // AURA +6900 // BRAIN OFF //&nbsp;</span>
        ))}
      </div></div>

      <RotFeed />

      <section className="fever-rewards" id="rewards">
        <div className="fever-alert">THIS COULD HAVE BEEN AN EMAIL</div>
        <h2>HOLD BRAINROT.<br />GET NEURALP.<br /><span>BRAIN OFF.</span></h2>
        <div className="fever-pipeline" aria-label="BRAINROT holder reward pipeline">
          <div className="fever-orb fever-orb--brainrot"><img src="/brand/brainrot-logo.jpg" alt="BRAINROT" /><b>HOLD</b></div>
          <div className="fever-wire"><i /><i /><i /><strong>STONK<br />DOES<br />THING</strong></div>
          <div className="fever-brain" aria-hidden="true">🧠<span>⚡</span></div>
          <div className="fever-wire fever-wire--reverse"><i /><i /><i /></div>
          <div className="fever-orb fever-orb--neural"><b>$NEURALP</b><small>REWARD</small></div>
        </div>
        <div className="fever-reward-links">
          <a href={projectConfig.stonkUrl} target="_blank" rel="noopener noreferrer">STONKFUN <ExternalLink size={15} /></a>
          <Link href="/rewards">REAL RECEIPTS ONLY →</Link>
        </div>
      </section>

      <section className="fever-lore" id="timeline">
        <header>
          <span>ARCHIVE CORRUPTED SUCCESSFULLY</span>
          <h2>THE ROT<br />TIMELINE</h2>
          <p>2023 → NOW // history but the textbook is deep fried</p>
        </header>
        <div className="fever-lore__wall">
          {LORE.map((item, index) => (
            <article className={`fever-lore-item fever-lore-item--${index + 1}`} key={item.title}>
              <div className="fever-tape" aria-hidden="true" />
              {item.image ? <img src={item.image} alt="" /> : <div className="fever-lore-67">67</div>}
              <time>{item.date}</time>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <strong>{item.stamp}</strong>
            </article>
          ))}
          <aside className="fever-error-box">
            <b>Internet Explorer</b>
            <p>the internet has stopped responding.</p>
            <button type="button">wait for the lore</button>
          </aside>
        </div>
      </section>

      <section className="fever-pair" id="pair">
        <span>UNAUTHORIZED CROSSOVER EVENT</span>
        <h2>BRAINROT + NEURALP</h2>
        <div className="fever-collision">
          <div className="fever-collision__token fever-collision__token--rot"><img src="/brand/brainrot-logo.jpg" alt="BRAINROT" /><b>$BRAINROT</b></div>
          <strong>×</strong>
          <div className="fever-collision__brain"><i>🧠</i><b>$NEURALP</b></div>
          <em>BOOM</em>
        </div>
        <h3>NO BRAIN MEETS MAXIMUM BRAIN.</h3>
        <p>the prophecy is complete. the browser is overheating. please remain extremely online.</p>
      </section>
    </div>
  );
}
