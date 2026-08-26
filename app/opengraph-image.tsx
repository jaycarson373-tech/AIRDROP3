import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", padding: 72, alignItems: "center", justifyContent: "space-between", background: "#06110a", color: "#f4fff6", border: "18px solid #37ff73" }}>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 770 }}>
        <span style={{ color: "#37ff73", fontSize: 28, fontWeight: 800, letterSpacing: 8 }}>THE PUMP.FUN MONEY PRINTER</span>
        <strong style={{ fontSize: 126, lineHeight: 0.9, marginTop: 28 }}>PUMP<br />MONEY.</strong>
        <span style={{ fontSize: 34, marginTop: 30 }}>Ten wallets. Equal share. Every five minutes.</span>
      </div>
      <div style={{ width: 250, height: 250, display: "flex", alignItems: "center", justifyContent: "center", background: "#37ff73", color: "#06110a", borderRadius: 38, fontSize: 170, fontWeight: 1000 }}>$</div>
    </div>,
    size
  );
}
