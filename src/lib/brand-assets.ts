export function kenmatchIconSvg({ dark = false, size = 72 }: { dark?: boolean; size?: number } = {}) {
  const gradientId = dark ? "kmGradDark" : "kmGrad";
  const foreground = dark ? "#f4f8ff" : "#f4f8ff";
  const shell = "#000000";
  const firstStop = dark ? "#6ea8ff" : "#6ea8ff";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="${size}" height="${size}">
  <defs>
    <linearGradient id="${gradientId}" x1="8" y1="8" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${firstStop}"/>
      <stop offset="0.34" stop-color="#8b5cf6"/>
      <stop offset="0.68" stop-color="#ffd166"/>
      <stop offset="1" stop-color="#ff6b6b"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="68" height="68" rx="19" fill="${shell}"/>
  <rect x="6" y="6" width="60" height="60" rx="16" fill="none" stroke="url(#${gradientId})" stroke-width="3"/>
  <path d="M22 18v36h7.2V41.6l12 12.4h9.4L35.2 37.8 49.6 18.7h-9.2L29.2 33.3V18z" fill="${foreground}"/>
  <circle cx="54" cy="19" r="3.8" fill="#6ea8ff"/>
  <circle cx="54" cy="36" r="3.8" fill="#8b5cf6"/>
  <circle cx="54" cy="53" r="3.8" fill="#ffd166"/>
</svg>`;
}

export function kenmatchAppleIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <linearGradient id="kmGradApple" x1="20" y1="20" x2="160" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6ea8ff"/>
      <stop offset="0.34" stop-color="#8b5cf6"/>
      <stop offset="0.68" stop-color="#ffd166"/>
      <stop offset="1" stop-color="#ff6b6b"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="180" height="180" rx="48" fill="#020405"/>
  <rect x="14" y="14" width="152" height="152" rx="40" fill="none" stroke="url(#kmGradApple)" stroke-width="9"/>
  <path d="M56 45v90h18V104l30 31h23L88.5 94.5 124.5 47h-23L74 83V45z" fill="#f4f8ff"/>
  <circle cx="137" cy="47" r="9" fill="#6ea8ff"/>
  <circle cx="137" cy="90" r="9" fill="#8b5cf6"/>
  <circle cx="137" cy="133" r="9" fill="#ffd166"/>
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
