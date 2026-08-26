import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#37ff73", color: "#07140b", fontSize: 280, fontWeight: 1000, border: "28px solid #07140b" }}>$</div>,
    size
  );
}
