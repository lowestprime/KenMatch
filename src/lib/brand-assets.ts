export function kenmatchIconSvg({ dark = false, size = 72 }: { dark?: boolean; size?: number } = {}) {
  const gradientId = dark ? "kmGradDark" : "kmGrad";
  const foreground = dark ? "#f8fafc" : "#03020a";
  const shell = dark ? "#000000" : "#7c3aed";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="${size}" height="${size}">
  <defs>
    <linearGradient id="${gradientId}" x1="8" y1="8" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1d4ed8"/>
      <stop offset="0.34" stop-color="#6d28d9"/>
      <stop offset="0.68" stop-color="#b45309"/>
      <stop offset="1" stop-color="#991b1b"/>
    </linearGradient>
  </defs>
  <rect x="6" y="6" width="60" height="60" rx="17" fill="${shell}"/>
  <rect x="7.5" y="7.5" width="57" height="57" rx="15.5" fill="none" stroke="url(#${gradientId})" stroke-width="3"/>
  <path d="M22 18v36h7.2V41.6l12 12.4h9.4L35.2 37.8 49.6 18.7h-9.2L29.2 33.3V18z" fill="${foreground}"/>
  <circle cx="54" cy="19" r="3.8" fill="#1d4ed8"/>
  <circle cx="54" cy="36" r="3.8" fill="#6d28d9"/>
  <circle cx="54" cy="53" r="3.8" fill="#b45309"/>
</svg>`;
}

export function kenmatchAppleIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <linearGradient id="kmGradApple" x1="20" y1="20" x2="160" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1d4ed8"/>
      <stop offset="0.34" stop-color="#6d28d9"/>
      <stop offset="0.68" stop-color="#b45309"/>
      <stop offset="1" stop-color="#991b1b"/>
    </linearGradient>
  </defs>
  <rect x="12" y="12" width="156" height="156" rx="44" fill="#000000"/>
  <rect x="17" y="17" width="146" height="146" rx="38" fill="none" stroke="url(#kmGradApple)" stroke-width="9"/>
  <path d="M56 45v90h18V104l30 31h23L88.5 94.5 124.5 47h-23L74 83V45z" fill="#f8fafc"/>
  <circle cx="137" cy="47" r="9" fill="#1d4ed8"/>
  <circle cx="137" cy="90" r="9" fill="#6d28d9"/>
  <circle cx="137" cy="133" r="9" fill="#b45309"/>
</svg>`;
}

export function kenmatchManifest() {
  return {
    name: "KenMatch",
    short_name: "KenMatch",
    description:
      "Transparent allocation of frontier AI compute via quadratic voting, proof-of-value credits, and open checkpoints.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icon-dark.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any maskable" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any maskable" },
      { src: "/apple-touch-icon.png", type: "image/png", sizes: "180x180", purpose: "any maskable" },
      { src: "/favicon-96x96.png", type: "image/png", sizes: "96x96", purpose: "any" },
    ],
  } as const;
}

export function assetHeaders(contentType: string) {
  return {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    "X-Content-Type-Options": "nosniff",
  };
}
