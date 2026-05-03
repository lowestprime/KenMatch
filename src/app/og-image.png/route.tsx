import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "KenMatch public allocation preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          color: "#f8fafc",
          padding: "56px 64px",
          fontFamily: "Arial, Helvetica, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 18, borderRadius: 42, border: "4px solid #6d28d9" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: 520, height: 520, borderRadius: 520, background: "rgba(109,40,217,.28)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", right: -120, bottom: -140, width: 520, height: 520, borderRadius: 520, background: "rgba(153,27,27,.24)", filter: "blur(48px)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 22, zIndex: 2 }}>
          <svg width="88" height="88" viewBox="4 4 64 64">
            <rect x="6" y="6" width="60" height="60" rx="17" fill="#000000" />
            <rect x="8" y="8" width="56" height="56" rx="15" fill="none" stroke="#6d28d9" strokeWidth="3.25" />
            <path d="M24 19v34h6.5V41.2l11.2 11.8H50L35.5 37.5 49 20h-8.5L30.5 33V19z" fill="#f8fafc" />
            <circle cx="54" cy="20" r="3.8" fill="#1d4ed8" />
            <circle cx="54" cy="36" r="3.8" fill="#6d28d9" />
            <circle cx="54" cy="52" r="3.8" fill="#b08d1a" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-0.035em" }}>KenMatch</div>
            <div style={{ fontSize: 23, color: "#d8d2e8" }}>Transparent allocation of frontier AI compute</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 880, zIndex: 2 }}>
          <div style={{ fontSize: 76, lineHeight: .94, fontWeight: 900, letterSpacing: "-0.065em" }}>
            Rank sustained AI work by public value, not private access.
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.28, color: "#d8d2e8", maxWidth: 840 }}>
            Kens are public work orders: scoped problems, evidence, lanes, checkpoints, discussion, and review trails for long-horizon AI-assisted work.
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, zIndex: 2 }}>
          {[
            ["Public board", "#1d4ed8"],
            ["Money separate from rank", "#6d28d9"],
            ["Safety review", "#991b1b"],
            ["Dark-gold audit trail", "#b08d1a"],
          ].map(([label, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(216,210,232,.26)", borderRadius: 18, padding: "12px 16px", background: "rgba(0,0,0,.72)", fontSize: 20, fontWeight: 700 }}>
              <div style={{ width: 12, height: 12, borderRadius: 12, background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
