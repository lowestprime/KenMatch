export function kenmatchIconSvg({ dark = false, size = 72 }: { dark?: boolean; size?: number } = {}) {
  const gradientId = dark ? "kmGradDark" : "kmGrad";
  const foreground = dark ? "#04070a" : "#ffffff";
  const firstStop = dark ? "#5ff5dc" : "#18b6a4";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="${size}" height="${size}">
  <defs>
    <linearGradient id="${gradientId}" x1="8" y1="8" x2="64" y2="64" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${firstStop}"/>
      <stop offset="0.55" stop-color="#4f8dff"/>
      <stop offset="1" stop-color="#ff8f49"/>
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="64" height="64" rx="18" fill="url(#${gradientId})"/>
  <path d="M24 19v34h6.5V41.2l11.2 11.8H50L35.5 37.5 49 20h-8.5L30.5 33V19z" fill="${foreground}"/>
  <circle cx="54" cy="20" r="3.6" fill="${foreground}" fill-opacity="0.94"/>
  <circle cx="54" cy="36" r="3.6" fill="${foreground}" fill-opacity="0.8"/>
  <circle cx="54" cy="52" r="3.6" fill="${foreground}" fill-opacity="0.66"/>
</svg>`;
}

export function kenmatchAppleIconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="180" height="180">
  <defs>
    <linearGradient id="kmGradApple" x1="20" y1="20" x2="160" y2="160" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#18b6a4"/>
      <stop offset="0.55" stop-color="#4f8dff"/>
      <stop offset="1" stop-color="#ff8f49"/>
    </linearGradient>
  </defs>
  <rect x="10" y="10" width="160" height="160" rx="45" fill="url(#kmGradApple)"/>
  <path d="M60 47v86h16.25V103l28 30H125L88.75 93.75 122.5 50h-21.25L76.25 82.5V47z" fill="#ffffff"/>
  <circle cx="135" cy="50" r="9" fill="#ffffff" fill-opacity="0.94"/>
  <circle cx="135" cy="90" r="9" fill="#ffffff" fill-opacity="0.8"/>
  <circle cx="135" cy="130" r="9" fill="#ffffff" fill-opacity="0.66"/>
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
    theme_color: "#0d7d74",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/icon-dark.svg", type: "image/svg+xml", sizes: "any", purpose: "any" },
      { src: "/apple-touch-icon.svg", type: "image/svg+xml", sizes: "180x180", purpose: "any maskable" },
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
