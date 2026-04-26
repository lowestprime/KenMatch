import type { VisitorAggregate } from "@/lib/types";

const COUNTRY_POSITIONS: Record<string, { lat: number; lon: number }> = {
  US: { lat: 39.5, lon: -98.35 },
  CA: { lat: 56.13, lon: -106.34 },
  MX: { lat: 23.63, lon: -102.55 },
  GB: { lat: 55.37, lon: -3.43 },
  IE: { lat: 53.41, lon: -8.24 },
  DE: { lat: 51.17, lon: 10.45 },
  FR: { lat: 46.23, lon: 2.21 },
  ES: { lat: 40.46, lon: -3.75 },
  IT: { lat: 41.87, lon: 12.57 },
  NL: { lat: 52.13, lon: 5.29 },
  BE: { lat: 50.5, lon: 4.47 },
  CH: { lat: 46.82, lon: 8.23 },
  AT: { lat: 47.52, lon: 14.55 },
  SE: { lat: 60.13, lon: 18.64 },
  NO: { lat: 60.47, lon: 8.47 },
  FI: { lat: 61.92, lon: 25.75 },
  DK: { lat: 56.26, lon: 9.5 },
  PL: { lat: 51.92, lon: 19.15 },
  CZ: { lat: 49.82, lon: 15.47 },
  PT: { lat: 39.4, lon: -8.22 },
  GR: { lat: 39.07, lon: 21.82 },
  IS: { lat: 64.96, lon: -19.02 },
  AU: { lat: -25.27, lon: 133.77 },
  NZ: { lat: -40.9, lon: 174.89 },
  JP: { lat: 36.2, lon: 138.25 },
  KR: { lat: 35.9, lon: 127.77 },
  CN: { lat: 35.86, lon: 104.19 },
  IN: { lat: 20.59, lon: 78.96 },
  SG: { lat: 1.35, lon: 103.82 },
  HK: { lat: 22.32, lon: 114.17 },
  TW: { lat: 23.69, lon: 120.96 },
  MY: { lat: 4.21, lon: 101.98 },
  TH: { lat: 15.87, lon: 100.99 },
  VN: { lat: 14.05, lon: 108.27 },
  ID: { lat: -0.79, lon: 113.92 },
  PH: { lat: 12.88, lon: 121.77 },
  BR: { lat: -14.24, lon: -51.93 },
  AR: { lat: -38.42, lon: -63.62 },
  CL: { lat: -35.68, lon: -71.54 },
  CO: { lat: 4.57, lon: -74.3 },
  PE: { lat: -9.19, lon: -75.02 },
  ZA: { lat: -30.56, lon: 22.94 },
  NG: { lat: 9.08, lon: 8.68 },
  EG: { lat: 26.82, lon: 30.8 },
  KE: { lat: -0.02, lon: 37.91 },
  IL: { lat: 31.05, lon: 34.85 },
  AE: { lat: 23.42, lon: 53.85 },
  SA: { lat: 23.89, lon: 45.08 },
  TR: { lat: 38.96, lon: 35.24 },
  RU: { lat: 61.52, lon: 105.32 },
  UA: { lat: 48.38, lon: 31.17 },
};

function project(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

export function VisitorMap({ aggregates }: { aggregates: VisitorAggregate[] }) {
  const total = aggregates.reduce((sum, item) => sum + item.visitorCount, 0);
  const mapped = aggregates
    .map((aggregate) => {
      const code = aggregate.countryCode ?? "";
      const position =
        (aggregate.latitude !== null && aggregate.longitude !== null
          ? { lat: aggregate.latitude, lon: aggregate.longitude }
          : null) ?? COUNTRY_POSITIONS[code];
      if (!position) return null;
      const { x, y } = project(position.lat, position.lon);
      return { ...aggregate, x, y };
    })
    .filter((value): value is NonNullable<typeof value> => value !== null);
  const topCountries = [...mapped]
    .sort((a, b) => b.visitorCount - a.visitorCount)
    .slice(0, 6);

  return (
    <div className="visitor-map-shell" role="region" aria-label="Visitor geography">
      <svg viewBox="0 0 1000 500" className="visitor-map" aria-hidden="true">
        <rect x="0" y="0" width="1000" height="500" fill="url(#visitor-map-grid)" />
        <defs>
          <pattern id="visitor-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.6" />
          </pattern>
          <radialGradient id="visitor-pulse-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-warm)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent-warm)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g stroke="currentColor" strokeOpacity="0.22" fill="none" strokeWidth="0.6">
          <path d="M 0 250 Q 250 100 500 250 Q 750 400 1000 250" />
          <path d="M 0 200 Q 500 60 1000 200" opacity="0.4" />
          <path d="M 0 330 Q 500 470 1000 330" opacity="0.4" />
        </g>
        {mapped.map((point) => {
          const radius = Math.min(22, 4 + Math.sqrt(point.visitorCount) * 3);
          return (
            <g key={point.countryCode ?? `${point.x}-${point.y}`} transform={`translate(${point.x}, ${point.y})`}>
              <title>{`${point.countryName ?? point.countryCode ?? "Unknown"}: ${point.visitorCount} visitor${point.visitorCount === 1 ? "" : "s"}`}</title>
              <circle className="visitor-pulse-ring" r={radius + 6} />
              <circle className="visitor-pulse" r={radius} />
            </g>
          );
        })}
      </svg>
      <div className="visitor-map-legend">
        <span>{total} unique visitors across {aggregates.length} countries</span>
        <span className="micro-pill">Data anonymized via salted hash</span>
      </div>
      {topCountries.length > 0 ? (
        <div className="visitor-country-list" aria-label="Top visitor countries">
          {topCountries.map((country) => (
            <span key={country.countryCode ?? country.countryName ?? "unknown"}>
              <strong>{country.countryName ?? country.countryCode ?? "Unknown"}</strong> {country.visitorCount}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
