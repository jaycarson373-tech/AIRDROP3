"use client";

import { CSSProperties, ChangeEvent, FormEvent, useRef, useState } from "react";
import { Download, ImagePlus, Loader2, Send, Sparkles } from "lucide-react";
import { HeroCountdown } from "./home-strategy-data";

export function AnsemfyGenerator({ hero = false }: { hero?: boolean }) {
  const [username, setUsername] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slider, setSlider] = useState(50);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextPreview = URL.createObjectURL(file);
    setPreview(nextPreview);
    setGenerated(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/ansemfy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, hasImage: Boolean(preview) })
      }).catch(() => null);
      window.setTimeout(() => {
        setGenerated("/brand/ansemfy-pfp-example.jpg");
        setLoading(false);
      }, 900);
    } catch {
      setGenerated("/brand/ansemfy-pfp-example.jpg");
      setLoading(false);
    }
  };

  const beforeImage = preview ?? "/brand/ansemfy-logo.jpg";
  const afterImage = generated ?? "/brand/ansemfy-pfp-example.jpg";

  return (
    <section className={hero ? "hero ansemfy-hero ansemfy-generator-section" : "section ansemfy-generator-section"} id="generator">
      {hero ? (
        <>
          <div className="ansemfy-army-bg" aria-hidden="true" />
          <div className="ansemfy-aurora" aria-hidden="true" />
          <div className="ansemfy-grid" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />
        </>
      ) : null}
      <div className="container ansemfy-generator-layout">
        <div className="section-copy">
          <div className="section-kicker">The trenches made Ansem</div>
          <h1>Become Ansem.</h1>
          <p className="hero-subtitle">Join the army.</p>
          <p className="lead hero-lead">
            Upload your profile picture, generate the Ansem version, download it, post it on X, and become part of the movement.
          </p>
          <div className="ansemfy-hero-steps" aria-label="ANSEMFY flow">
            {["Upload", "Become", "Download", "Post"].map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
          {hero ? <HeroCountdown /> : null}
        </div>

        <form className="ansemfy-generator-card" onSubmit={handleSubmit}>
          <div className="ansemfy-generator-card-head">
            <span>ANSEMFY AI</span>
            <strong>Profile generator</strong>
          </div>
          <button className="ansemfy-upload-zone" type="button" onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} />
            {preview ? (
              <img src={preview} alt="Uploaded profile preview" />
            ) : (
              <span>
                <ImagePlus size={28} />
                Drag image or click to upload
              </span>
            )}
          </button>

          <label className="ansemfy-username-field">
            <span>Or paste X username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="@username" />
          </label>

          <button className="cta ansemfy-generate-button" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin-icon" size={18} /> : <Sparkles size={18} />}
            Generate
          </button>

          <div className="ansemfy-preview-panel">
            <span>Before / After</span>
            <div className="ansemfy-preview-window ansemfy-before-after" style={{ "--split": `${slider}%` } as CSSProperties}>
              {loading ? (
                <div className="ansemfy-loading-state">
                  <Loader2 className="spin-icon" size={28} />
                  Ansemfying
                </div>
              ) : (
                <>
                  <img className="before-image" src={beforeImage} alt="Original profile preview" />
                  <img className="after-image" src={afterImage} alt="Ansemified profile preview" />
                  <span className="ansemfy-slider-handle" aria-hidden="true" />
                </>
              )}
            </div>
            <input
              className="ansemfy-slider"
              type="range"
              min="0"
              max="100"
              value={slider}
              onChange={(event) => setSlider(Number(event.target.value))}
              aria-label="Before after slider"
            />
            <div className="ansemfy-output-actions">
              <a className="cta secondary" href={generated ?? "#"} download aria-disabled={!generated}>
                <Download size={18} />
                Download
              </a>
              <a
                className="cta secondary"
                href={`https://x.com/intent/tweet?text=${encodeURIComponent("I just got Ansemfied. @Ansemfy_")}`}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={18} />
                Share to X
              </a>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
