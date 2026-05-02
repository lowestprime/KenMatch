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
          <stop offset="0" stopColor="var(--brand-dot-one)" />
          <stop offset="0.34" stopColor="var(--brand-dot-two)" />
          <stop offset="0.68" stopColor="var(--brand-dot-three)" />
          <stop offset="1" stopColor="var(--brand-dot-four)" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="60" height="60" rx="17" fill="var(--brand-mark-shell)" />
      <rect x="7.5" y="7.5" width="57" height="57" rx="15.5" fill="none" stroke="url(#kenmatch-mark-gradient)" strokeWidth="3" />
      <g className={foregroundSelector}>
        <path d="M24 19v34h6.5V41.2l11.2 11.8H50L35.5 37.5 49 20h-8.5L30.5 33V19z" fill="var(--brand-mark-foreground)" />
        <circle cx="54" cy="20" r="3.6" fill="var(--brand-dot-one)" />
        <circle cx="54" cy="36" r="3.6" fill="var(--brand-dot-two)" />
        <circle cx="54" cy="52" r="3.6" fill="var(--brand-dot-three)" />
      </g>
    </svg>
  );
}
