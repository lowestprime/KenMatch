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
      <path d="M22 17v38h8V41l12 14h10L39 39l13-22H42L30 35V17z" fill="white" />
      <path d="M43 20l13 14-13 18" fill="none" stroke="rgba(255,255,255,0.82)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="56" cy="17" r="5" fill="rgba(255,255,255,0.96)" />
      <circle cx="56" cy="34" r="5" fill="rgba(255,255,255,0.88)" />
      <circle cx="56" cy="52" r="5" fill="rgba(255,255,255,0.76)" />
    </svg>
  );
}
