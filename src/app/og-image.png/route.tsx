import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "KenMatch — rank sustained AI work with public checkpoints, review, and backing.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function BrandMark() {
  return (
    <svg width="112" height="112" viewBox="0 0 1024 1024" aria-hidden="true">
      <defs>
        <linearGradient id="border" x1="64" y1="960" x2="960" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1d4ed8" />
          <stop offset="0.25" stopColor="#4c1d95" />
          <stop offset="0.5" stopColor="#b08d1a" />
          <stop offset="0.75" stopColor="#991b1b" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="sector" x1="612" y1="512" x2="784" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e9d5ff" />
          <stop offset="0.18" stopColor="#2563eb" />
          <stop offset="0.36" stopColor="#4c1d95" />
          <stop offset="0.54" stopColor="#b08d1a" />
          <stop offset="0.74" stopColor="#991b1b" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
        <radialGradient id="orb" cx="456" cy="512" r="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#f8fafc" />
          <stop offset="0.74" stopColor="#525252" />
          <stop offset="1" stopColor="#000000" />
        </radialGradient>
      </defs>
      <path d="M304 0h416c167.9 0 304 136.1 304 304v416c0 167.9-136.1 304-304 304H304C136.1 1024 0 887.9 0 720V304C0 136.1 136.1 0 304 0Zm0 48h416c141.4 0 256 114.6 256 256v416c0 141.4-114.6 256-256 256H304C162.6 976 48 861.4 48 720V304C48 162.6 162.6 48 304 48Z" fill="url(#border)" fillRule="evenodd" />
      <path d="M304 48h416c141.4 0 256 114.6 256 256v416c0 141.4-114.6 256-256 256H304C162.6 976 48 861.4 48 720V304C48 162.6 162.6 48 304 48Z" fill="#000000" />
      <rect x="278" y="192" width="148" height="640" fill="#ffffff" />
      <polygon points="456,512 612,512 767,832 604,832" fill="#ffffff" />
      <polygon points="604,192 767,192 612,512 456,512" fill="#ffffff" />
      <path d="M612 512a178 178 0 0 0 0-178l155-142a358 358 0 0 1 0 640Z" fill="url(#sector)" opacity="0.93" />
      <circle cx="456" cy="512" r="36" fill="url(#orb)" />
    </svg>
  );
}

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          color: "#ffffff",
          padding: "72px 78px 58px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <BrandMark />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 54, lineHeight: 1, fontWeight: 800, letterSpacing: 1.2 }}>KenMatch</div>
            <div style={{ color: "#8b5cf6", fontSize: 29, fontWeight: 800, letterSpacing: 1.4 }}>
              Transparent allocation of frontier AI compute
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1080, fontSize: 74, lineHeight: 1.08, fontWeight: 900, letterSpacing: 1.2 }}>
          Rank sustained AI work with public checkpoints, review, and backing.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <div style={{ width: 260, height: 14, borderRadius: 999, background: "#7c3aed" }} />
            <div style={{ width: 150, height: 14, borderRadius: 999, background: "#b08d1a" }} />
            <div style={{ width: 150, height: 14, borderRadius: 999, background: "#991b1b" }} />
            <div style={{ width: 150, height: 14, borderRadius: 999, background: "#1d4ed8" }} />
          </div>
          <div style={{ display: "flex", gap: 30, color: "#ffffff", fontSize: 25, lineHeight: 1, fontWeight: 800, letterSpacing: 4 }}>
            <span>public board</span>
            <span>|</span>
            <span>transparent rules</span>
            <span>|</span>
            <span>accountable outputs</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
