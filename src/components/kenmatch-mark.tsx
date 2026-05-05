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
  const glowId = `${idPrefix}-glow`;
  const glyphShadowId = `${idPrefix}-glyph-shadow`;
  const svgClassName = [className, "kenmatch-mark-themed", `kenmatch-mark-${variant}`].filter(Boolean).join(" ");

  return (
    <svg viewBox="0 0 72 72" aria-hidden="true" focusable="false" className={svgClassName} data-variant={variant} shapeRendering="geometricPrecision">
      <style>{`
        .kenmatch-mark-themed{
          --km-shell:#000000;
          --km-glyph-a:#ffffff;
          --km-glyph-b:#f8fafc;
          --km-glyph-c:#dbeafe;
          --km-core-shadow:#020617;
          --km-core-ring:#020617;
          --km-core-spark:#f8fafc;
          --km-glyph-shadow:#020617;
          --km-glyph-highlight:#ffffff;
        }
        html[data-theme="light"] .kenmatch-mark-auto,
        .kenmatch-mark-light{
          --km-shell:#ffffff;
          --km-glyph-a:#020617;
          --km-glyph-b:#030712;
          --km-glyph-c:#111827;
          --km-core-shadow:#f8fafc;
          --km-core-ring:#f8fafc;
          --km-core-spark:#020617;
          --km-glyph-shadow:#cbd5e1;
          --km-glyph-highlight:#020617;
        }
        .kenmatch-mark-dark,.kenmatch-mark-oled{
          --km-shell:#000000;
          --km-glyph-a:#ffffff;
          --km-glyph-b:#f8fafc;
          --km-glyph-c:#dbeafe;
          --km-core-shadow:#020617;
          --km-core-ring:#020617;
          --km-core-spark:#f8fafc;
          --km-glyph-shadow:#020617;
          --km-glyph-highlight:#ffffff;
        }
      `}</style>
      <defs>
        <linearGradient id={borderId} x1="8" y1="8" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2563eb" />
          <stop offset="0.36" stopColor="#7c3aed" />
          <stop offset="0.72" stopColor="#c29a13" />
          <stop offset="1" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id={glyphId} x1="22" y1="18" x2="51" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--km-glyph-a)" />
          <stop offset="0.56" stopColor="var(--km-glyph-b)" />
          <stop offset="1" stopColor="var(--km-glyph-c)" />
        </linearGradient>
        <radialGradient id={coreId} cx="35.65" cy="36" r="7.3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#c084fc" />
          <stop offset="0.22" stopColor="#7c3aed" />
          <stop offset="0.48" stopColor="#2563eb" />
          <stop offset="0.73" stopColor="#c29a13" />
          <stop offset="1" stopColor="#b91c1c" />
        </radialGradient>
        <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="0" stdDeviation="1.55" floodColor="#7c3aed" floodOpacity="0.34" />
        </filter>
        <filter id={glyphShadowId} x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="0.7" stdDeviation="0.72" floodColor="var(--km-glyph-shadow)" floodOpacity="0.48" />
        </filter>
      </defs>

      <rect x="6" y="6" width="60" height="60" rx="17" fill="var(--km-shell)" />
      <rect x="8" y="8" width="56" height="56" rx="15" fill="none" stroke={`url(#${borderId})`} strokeWidth="3.25" opacity="0.42" filter={`url(#${glowId})`} />
      <rect x="8" y="8" width="56" height="56" rx="15" fill="none" stroke={`url(#${borderId})`} strokeWidth="3.25" />

      <g opacity="0.98">
        <circle cx="35.65" cy="36" r="7.18" fill="var(--km-core-shadow)" opacity="0.92" />
        <circle cx="35.65" cy="36" r="6.12" fill={`url(#${coreId})`} />
        <circle cx="35.65" cy="36" r="5.58" fill="none" stroke="var(--km-core-ring)" strokeWidth="1.18" opacity="0.9" />
        <circle cx="35.65" cy="36" r="4.48" fill="none" stroke="#2563eb" strokeWidth="1.42" opacity="0.98" />
        <circle cx="35.65" cy="36" r="3.12" fill="none" stroke="#7c3aed" strokeWidth="1.25" opacity="0.98" />
        <circle cx="35.65" cy="36" r="2" fill="#7c3aed" opacity="0.96" />
        <circle cx="35.65" cy="36" r="0.9" fill="var(--km-core-spark)" opacity="0.42" />
        <path d="M31.25 40.95A6.35 6.35 0 0 0 40.12 41.05" fill="none" stroke="#b91c1c" strokeWidth="1.22" opacity="0.92" strokeLinecap="round" />
        <path d="M40.72 31.52A6.25 6.25 0 0 0 41.2 38.35" fill="none" stroke="#c29a13" strokeWidth="1.1" opacity="0.92" strokeLinecap="round" />
      </g>

      <rect x="22.25" y="18.75" width="8.4" height="34.5" fill={`url(#${glyphId})`} filter={`url(#${glyphShadowId})`} />
      <path
        d="M31.15 32.42L42.75 18.75H51L38.28 35.72C37.78 36.38 37.78 36.7 38.28 37.36L51.05 53.25H42.65L31.15 39.58L35.65 36ZM35.65 29.82A6.18 6.18 0 1 1 35.65 42.18A6.18 6.18 0 1 1 35.65 29.82Z"
        fill={`url(#${glyphId})`}
        fillRule="evenodd"
        filter={`url(#${glyphShadowId})`}
      />
      <path d="M38.05 35.7L51 18.75H46.25L34.7 33.05Z" fill="var(--km-glyph-highlight)" opacity="0.1" />
    </svg>
  );
}
