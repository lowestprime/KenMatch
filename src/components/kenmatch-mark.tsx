export function KenMatchMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="kenmatch-mark-gradient" x1="12" y1="10" x2="60" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--accent-strong)" />
          <stop offset="0.5" stopColor="var(--accent-glow)" />
          <stop offset="1" stopColor="var(--accent-warm)" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="60" height="60" rx="20" fill="url(#kenmatch-mark-gradient)" />
      <path d="M22 18v36h8V40l14 14h10L38 37l15-19H42L30 34V18z" fill="white" />
      <circle cx="56" cy="18" r="5" fill="rgba(255,255,255,0.95)" />
      <circle cx="56" cy="54" r="5" fill="rgba(255,255,255,0.75)" />
      <path d="M56 23v26" stroke="rgba(255,255,255,0.82)" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}
