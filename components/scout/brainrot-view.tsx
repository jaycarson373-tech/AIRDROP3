"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { projectConfig } from "./project-config";

const CHARACTERS = [
  {
    name: "PATRICK BRAINROT",
    era: "2026 // NO RECOVERY",
    note: "brain activity: no. aura: catastrophic.",
    image: "/brand/brainrot-logo.jpg",
    className: "is-patrick"
  },
  {
    name: "TRALALERO TRALALA",
    era: "2025 // ITALIAN ROT",
    note: "three shoes. zero explanations. bellissimo.",
    image: "/brand/tralalero.png",
    className: "is-tralalero"
  },
  {
    name: "BOMBARDIRO CROCODILO",
    era: "2025 // AIRBORNE NONSENSE",
    note: "the timeline requested air support. huge mistake.",
    image: "/brand/bombardiro.png",
    className: "is-bombardiro"
  },
  {
    name: "TUNG TUNG TUNG SAHUR",
    era: "2025 // MAXIMUM AURA",
    note: "heard three knocks. the lore entered with a bat.",
    image: "/brand/tung-tung.png",
    className: "is-tung"
  },
  {
    name: "BALLERINA CAPPUCCINA",
    era: "2025 // ESPRESSO ARC",
    note: "serving pirouettes, caffeine and irreversible damage.",
    image: "/brand/ballerina.png",
    className: "is-ballerina"
  },
  {
    name: "SIX SEVEN",
    era: "2025 // THE NUMBER INCIDENT",
    note: "math left the chat. the children understood everything.",
    image: null,
    className: "is-sixty-seven"
  }
] as const;

const LORE = [
  {
    date: "2023",
    title: "PHONE BRAIN",
    copy: "humanity picked up the phone. the old world ended.",
    image: "/brand/john-pork-calling.jpg",
    stamp: "INCOMING"
  },
  {
    date: "2024",
    title: "THE ANIMALS STARTED TALKING",
    copy: "the feed developed wildlife. the wildlife developed opinions.",
    image: "/brand/bombardiro.png",
    stamp: "SIGNAL LOST"
  },
  {
    date: "2025",
    title: "67",
    copy: "math left the chat. language became two numbers and a hand motion.",
    image: null,
    stamp: "ROT CRITICAL"
  },
  {
    date: "2026",
    title: "NO RECOVERY",
    copy: "the internet melted. we tokenized the condition. probably bullish.",
    image: "/brand/brainrot-logo.jpg",
    stamp: "BRAIN OFF"
  }
] as const;

type CallPhase = "ringing" | "answering" | "done";

function JohnPorkCallIntro() {
  const [phase, setPhase] = useState<CallPhase>("ringing");

  useEffect(() => {
    if (phase === "done") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setPhase(phase === "ringing" ? "answering" : "done"), reducedMotion ? 200 : phase === "ringing" ? 3000 : 450);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const answerNow = () => {
    if (phase !== "ringing") return;
    setPhase("answering");
  };

  if (phase === "done") return null;

  return (
    <div className={`brainrot-call-gate is-${phase}`} role="dialog" aria-modal="true" aria-label="John Pork incoming call" onKeyDown={(event) => { if (event.key === "Escape") setPhase("done"); if (event.key === "Tab") event.preventDefault(); }}>
      <div className="brainrot-call-phone">
        <img src="/brand/john-pork-calling.jpg" alt="John Pork is calling" />
        <button className="brainrot-call-answer" type="button" autoFocus onClick={answerNow} aria-label="Accept John Pork call"><span aria-hidden="true" /></button>
      </div>
    </div>
  );
}

function RotFeed() {
  const [paused, setPaused] = useState(false);
  return (
    <section className="fever-feed" id="rot-feed">
      <header>
        <span>LIVE FROM THE DAMAGED PART OF THE INTERNET</span>
        <h2>BRAINROT INDEX</h2>
        <strong>ROT LEVEL: ██████████ 100%</strong>
        <button className="fever-feed__control" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "RESUME THE ROT" : "PAUSE THE ROT"}</button>
        <p className="fever-feed__hint">SWIPE FOR MORE DAMAGE</p>
      </header>
      <div className="fever-feed__viewport" tabIndex={0} role="region" aria-label="Brainrot characters — swipe or use arrow keys to explore">
        <div className={`fever-feed__track${paused ? " is-paused" : ""}`}>
          {[...CHARACTERS, ...CHARACTERS].map((character, index) => (
            <article className={`fever-card ${character.className}`} aria-hidden={index >= CHARACTERS.length} key={`${character.name}-${index}`}>
              <div className="fever-card__warning">{index % 2 ? "⚠ DO NOT THINK" : "100% REAL LORE"}</div>
              {character.image ? (
                <img src={character.image} alt={index < CHARACTERS.length ? character.name : ""} loading="lazy" decoding="async" />
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

function ScreenTimeReport() {
  const days = ["M", "T", "W", "T", "F", "S", "NOW"];
  const doomPosts = [
    "one more video bro",
    "john pork called again",
    "67 DETECTED",
    "tralalero posted",
    "screen time limit ignored",
    "brain loading... 0%",
    "you are still scrolling",
    "there is no bottom"
  ];

  return (
    <section className="fever-screentime" id="screen-time">
      <img className="fever-screentime__invader" src="/brand/tung-tung.png" alt="Tung Tung Tung Sahur invading the screen-time report" loading="lazy" decoding="async" />
      <div className="fever-screentime__copy">
        <span>WEEKLY DEVICE REPORT // VERY CONCERNING</span>
        <h2>SCREEN TIME<br /><em>OFF THE CHARTS</em></h2>
        <p>the green rot has breached containment. please put the phone down after this next video.</p>
        <strong>DOOMSCROLL STATUS: NO BOTTOM FOUND</strong>
      </div>

      <div className="fever-phone-report">
        <div className="fever-phone-report__top"><i /> SCREEN TIME <b>● LIVE</b></div>
        <p>DAILY AVERAGE</p>
        <h3>13h 37m</h3>
        <strong>UP 420% FROM LAST WEEK</strong>
        <div className="fever-screen-chart" aria-label="Screen time chart showing usage increasing beyond the chart">
          {days.map((day, index) => (
            <div className={index === days.length - 1 ? "is-today" : ""} key={`${day}-${index}`}>
              <i><em /></i><span>{day}</span>
            </div>
          ))}
          <b>HELP</b>
        </div>
        <div className="fever-phone-report__stats">
          <span><b>667</b> pickups</span>
          <span><b>∞</b> refreshes</span>
          <span><b>0m</b> outside</span>
        </div>
      </div>

      <div className="fever-doomscroll" aria-label="Infinite doomscroll parody">
        <header><b>FOR YOU</b><span>doom feed</span></header>
        <div>
          {[0, 1].map((group) => <div className="fever-doomscroll__group" key={group} aria-hidden={group === 1}>
            {doomPosts.map((post, index) => <article key={post}><i>{index % 3 === 0 ? "67" : index % 3 === 1 ? "🧠" : "?!"}</i><p>{post}</p><span>♡ {6900 - index * 67}</span></article>)}
          </div>)}
        </div>
        <footer>YOU HAVE SCROLLED 14.7 KM TODAY</footer>
      </div>
    </section>
  );
}

export function BrainrotView() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [fateAccepted, setFateAccepted] = useState(false);

  useEffect(() => {
    const popupTimer = window.setTimeout(() => setPopupOpen(true), 4700);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => window.clearTimeout(popupTimer);

    let pointerFrame = 0;
    let scrollFrame = 0;
    const update = (event: PointerEvent) => {
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      pointerFrame = window.requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - .5) * 18;
        const y = (event.clientY / window.innerHeight - .5) * 14;
        rootRef.current?.style.setProperty("--parallax-bg-x", `${x * -.25}px`);
        rootRef.current?.style.setProperty("--parallax-bg-y", `${y * -.25}px`);
        rootRef.current?.style.setProperty("--parallax-title-x", `${x * .18}px`);
        rootRef.current?.style.setProperty("--parallax-title-y", `${y * .12}px`);
        rootRef.current?.style.setProperty("--parallax-collage-x", `${x * -.34}px`);
        rootRef.current?.style.setProperty("--parallax-collage-y", `${y * -.2}px`);
      });
    };
    const updateScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        rootRef.current?.style.setProperty("--scroll-drift", `${Math.min(window.scrollY * .04, 80)}px`);
      });
    };
    updateScroll();
    window.addEventListener("pointermove", update, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      window.clearTimeout(popupTimer);
      window.removeEventListener("pointermove", update);
      window.removeEventListener("scroll", updateScroll);
      if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
      if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
    };
  }, []);

  useEffect(() => {
    if (!popupOpen) return;
    const timer = window.setTimeout(() => setPopupOpen(false), 6000);
    return () => window.clearTimeout(timer);
  }, [popupOpen]);

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
          <h1 data-text="BRAINROT" aria-label="BRAINROT">BRAINROT</h1>
          <h2>THE INTERNET HAS A CONDITION.</h2>
          <p>HOLD $BRAINROT. GET $NEURALINK.</p>
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

      <ScreenTimeReport />

      <section className="fever-rewards" id="rewards">
        <div className="fever-alert">THIS COULD HAVE BEEN AN EMAIL</div>
        <h2>HOLD BRAINROT.<br />GET NEURALINK.<br /><span>BRAIN OFF.</span></h2>
        <div className="fever-pipeline" aria-label="BRAINROT holder reward pipeline">
          <div className="fever-orb fever-orb--brainrot"><img src="/brand/brainrot-logo.jpg" alt="BRAINROT" /><b>HOLD</b></div>
          <div className="fever-wire"><i /><i /><i /><strong>STONK<br />DOES<br />THING</strong></div>
          <div className="fever-brain" aria-hidden="true">🧠<span>⚡</span></div>
          <div className="fever-wire fever-wire--reverse"><i /><i /><i /></div>
          <div className="fever-orb fever-orb--neural"><b>$NEURALINK</b><small>REWARD</small></div>
        </div>
        <div className="fever-reward-links">
          <a href={projectConfig.stonkUrl} target="_blank" rel="noopener noreferrer">STONKFUN</a>
          <Link href="/rewards">REAL RECEIPTS ONLY</Link>
        </div>
      </section>

      <section className="fever-lore" id="timeline">
        <header>
          <span>ARCHIVE CORRUPTED SUCCESSFULLY</span>
          <h2>THE TIMELINE<br />GOT WORSE</h2>
          <p>2023: PHONE BRAIN // 2024: TALKING ANIMALS // 2025: 67 // 2026: NO RECOVERY</p>
        </header>
        <div className="fever-lore__wall">
          {LORE.map((item, index) => (
            <article className={`fever-lore-item fever-lore-item--${index + 1}`} key={item.title}>
              <div className="fever-tape" aria-hidden="true" />
              {item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" /> : <div className="fever-lore-67">67</div>}
              <time>{item.date}</time>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
              <strong>{item.stamp}</strong>
            </article>
          ))}
          <aside className="fever-error-box">
            <b>Internet Explorer</b>
            <p role="status">{fateAccepted ? "fate accepted. welcome to the damaged part of the internet." : "recovery.exe was not found. the condition is permanent."}</p>
            <button type="button" disabled={fateAccepted} onClick={() => setFateAccepted(true)}>{fateAccepted ? "brain successfully uninstalled ✓" : "accept fate"}</button>
          </aside>
        </div>
      </section>

      <section className="fever-pair" id="pair">
        <span>UNAUTHORIZED CROSSOVER EVENT</span>
        <h2>BRAINROT + NEURALINK</h2>
        <div className="fever-collision">
          <div className="fever-collision__token fever-collision__token--rot"><img src="/brand/brainrot-logo.jpg" alt="BRAINROT" /><b>$BRAINROT</b></div>
          <strong>×</strong>
          <div className="fever-collision__brain"><i>🧠</i><b>$NEURALINK</b></div>
          <em>BOOM</em>
        </div>
        <h3>NO BRAIN MEETS MAXIMUM BRAIN.</h3>
        <p>the prophecy is complete. the browser is overheating. please remain extremely online.</p>
      </section>
    </div>
  );
}
