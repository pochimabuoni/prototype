import { ImageResponse } from "next/og";

export const alt = "Pochi Ma Buoni — A private sports community in New York";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#0d1f3c", color: "#ffffff", padding: 80, fontFamily: "serif" }}>
        <div style={{ fontSize: 22, letterSpacing: 8, color: "#7f9fd0", textTransform: "uppercase", fontFamily: "sans-serif" }}>Private members · New York City</div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 120, letterSpacing: 10 }}>
          POCHI<span style={{ fontSize: 56, fontStyle: "italic", color: "#7f9fd0", margin: "0 28px", letterSpacing: 0 }}>ma</span>BUONI
        </div>
        <div style={{ fontSize: 40, fontStyle: "italic", color: "#e3eaf5" }}>A better way to play. A better circle to belong to.</div>
      </div>
    ),
    size,
  );
}
