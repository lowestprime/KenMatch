export function KenMatchMark({
  className = "",
  variant = "auto",
}: {
  className?: string;
  variant?: "auto" | "light" | "dark" | "oled";
}) {
  const idPrefix = `kenmatch-mark-${variant}-${className || "default"}`.replace(/[^A-Za-z0-9_-]+/g, "-");
  const borderId = `${idPrefix}-border`;
  const glyphId = `${idPrefix}-glyph`;
  const coreId = `${idPrefix}-core`;
  const coreClipId = `${idPrefix}-core-clip`;
  const glowId = `${idPrefix}-glow`;
  const glyphShadowId = `${idPrefix}-glyph-shadow`;

  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" focusable="false" className={className} data-variant={variant} shapeRendering="geometricPrecision">
      <defs>
        <linearGradient id={borderId} x1="8" y1="8" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="0.36" stopColor="#7c3aed" />
          <stop offset="0.72" stopColor="#c29a13" />
          <stop offset="1" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id={glyphId} x1="22" y1="18" x2="50" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.52" stopColor="#f8fafc" />
          <stop offset="1" stopColor="#dbeafe" />
        </linearGradient>
        <radialGradient id={coreId} cx="35.85" cy="36" r="7.4" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c084fc" />
          <stop offset="0.22" stopColor="#7c3aed" />
          <stop offset="0.48" stopColor="#2563eb" />
          <stop offset="0.72" stopColor="#c29a13" />
          <stop offset="1" stopColor="#b91c1c" />
        </radialGradient>
        <clipPath id={coreClipId}>
          <circle cx="35.85" cy="36" r="5.85" />
        </clipPath>
        <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="0" stdDeviation="1.55" floodColor="#7c3aed" floodOpacity="0.34" />
        </filter>
        <filter id={glyphShadowId} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="0.65" stdDeviation="0.65" floodColor="#020617" floodOpacity="0.42" />
        </filter>
      </defs>

      <rect x="6" y="6" width="60" height="60" rx="17" fill="#000000" />
      <rect x="8" y="8" width="56" height="56" rx="15" fill="none" stroke={`url(#${borderId})`} strokeWidth="3.25" opacity="0.42" filter={`url(#${glowId})`} />
      <rect x="8" y="8" width="56" height="56" rx="15" fill="none" stroke={`url(#${borderId})`} strokeWidth="3.25" />

      <circle cx="35.85" cy="36" r="17.8" fill="#7c3aed" opacity="0.055" />
      <path
        d="M22.45 18.65H30.55V31.45L41.35 18.65H50.35L37.55 35.78L50.6 53.35H41.45L30.55 40.35V53.35H22.45ZM30.55 32.3L35.22 36L30.55 39.7ZM35.85 30.15A5.85 5.85 0 1 1 35.85 41.85A5.85 5.85 0 1 1 35.85 30.15Z"
        fill={`url(#${glyphId})`}
        fillRule="evenodd"
        filter={`url(#${glyphShadowId})`}
      />
      <path d="M37.35 35.82L50.35 18.65H45.65L34.35 33.15Z" fill="#ffffff" opacity="0.1" />

      <g clipPath={`url(#${coreClipId})`}>
        <circle cx="35.85" cy="36" r="5.85" fill={`url(#${coreId})`} />
        <circle cx="35.85" cy="36" r="5.55" fill="none" stroke="#020617" strokeWidth="1.15" opacity="0.82" />
        <circle cx="35.85" cy="36" r="4.38" fill="none" stroke="#2563eb" strokeWidth="1.45" opacity="0.96" />
        <circle cx="35.85" cy="36" r="3.08" fill="none" stroke="#7c3aed" strokeWidth="1.25" opacity="0.96" />
        <circle cx="35.85" cy="36" r="1.92" fill="#7c3aed" opacity="0.95" />
        <circle cx="35.85" cy="36" r="0.88" fill="#f8fafc" opacity="0.42" />
        <path d="M31.35 40.95A6.4 6.4 0 0 0 40.72 40.95" fill="none" stroke="#b91c1c" strokeWidth="1.22" opacity="0.9" strokeLinecap="round" />
        <path d="M40.95 31.55A6.25 6.25 0 0 0 41.45 38.4" fill="none" stroke="#c29a13" strokeWidth="1.1" opacity="0.92" strokeLinecap="round" />
      </g>
    </svg>
  );
}
