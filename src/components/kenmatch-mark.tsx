export function KenMatchMark({
  className = "",
  variant = "auto",
}: {
  className?: string;
  variant?: "auto" | "light" | "dark" | "oled";
}) {
  const foregroundSelector = variant === "auto" ? "kenmatch-k-auto" : `kenmatch-k-${variant}`;
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="kenmatch-mark-gradient" x1="8" y1="8" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--accent-strong)" />
          <stop offset="0.55" stopColor="var(--accent-glow)" />
          <stop offset="1" stopColor="var(--accent-warm)" />
        </linearGradient>
        <filter id="kenmatch-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <rect
        x="4"
        y="4"
        width="64"
        height="64"
        rx="18"
        fill="url(#kenmatch-mark-gradient)"
      />
      <g className={foregroundSelector}>
        <path
          d="M24 19v34h6.5V41.2l11.2 11.8H50L35.5 37.5 49 20h-8.5L30.5 33V19z"
          fill="white"
        />
        <circle cx="54" cy="20" r="3.6" fill="white" fillOpacity="0.94" />
        <circle cx="54" cy="36" r="3.6" fill="white" fillOpacity="0.8" />
        <circle cx="54" cy="52" r="3.6" fill="white" fillOpacity="0.66" />
      </g>
    </svg>
  );
}
