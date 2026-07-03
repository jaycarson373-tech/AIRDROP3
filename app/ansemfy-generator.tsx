"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { Download, ImagePlus, Loader2, Send, Sparkles } from "lucide-react";

export function AnsemfyGenerator() {
  const [username, setUsername] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
        setGenerated(preview ?? "/brand/ansem-black-bull.jpg");
        setLoading(false);
      }, 900);
    } catch {
      setGenerated(preview ?? "/brand/ansem-black-bull.jpg");
      setLoading(false);
    }
  };

  return (
    <section className="section ansemfy-generator-section" id="generator">
      <div className="container ansemfy-generator-layout">
        <div className="section-copy">
          <div className="section-kicker">ANSEMFY generator</div>
          <h2>Become Ansem in seconds.</h2>
          <p className="lead">
            Upload a profile picture or paste an X username. The generation endpoint is staged for the future AI image pipeline.
          </p>
        </div>

        <form className="ansemfy-generator-card" onSubmit={handleSubmit}>
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
            <span>X username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="@username" />
          </label>

          <button className="cta ansemfy-generate-button" type="submit" disabled={loading}>
            {loading ? <Loader2 className="spin-icon" size={18} /> : <Sparkles size={18} />}
            Generate
          </button>

          <div className="ansemfy-preview-panel">
            <span>Preview</span>
            <div className="ansemfy-preview-window">
              {loading ? (
                <div className="ansemfy-loading-state">
                  <Loader2 className="spin-icon" size={28} />
                  Ansemfying
                </div>
              ) : generated ? (
                <img src={generated} alt="Generated Ansem-style profile preview" />
              ) : (
                <p>Generated PFP appears here.</p>
              )}
            </div>
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
