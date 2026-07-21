import { ImageResponse } from "next/og";

export const alt = "Runner — Momentum Terminal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#050505", color: "#f7f7f2", padding: "72px", fontFamily: "Arial, sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 72% 25%, rgba(140,255,114,.16), transparent 36%), linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "auto, 48px 48px, 48px 48px" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 28, fontWeight: 700, letterSpacing: 0 }}><span style={{ width: 46, height: 46, border: "3px solid #8cff72", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#8cff72" }}>•</span> RUNNER</div>
        <div style={{ display: "flex", flexDirection: "column" }}><div style={{ color: "#8cff72", fontSize: 22, textTransform: "uppercase", marginBottom: 20 }}>Live momentum. Updated every five minutes.</div><div style={{ fontSize: 76, fontWeight: 800, maxWidth: 940, lineHeight: 1.02, letterSpacing: 0 }}>Never miss a runner again.</div></div>
        <div style={{ fontSize: 25, color: "#8e8e88" }}>Own the runner. Don't chase it.</div>
      </div>
    </div>,
    size
  );
}
