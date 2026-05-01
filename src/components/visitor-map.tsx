"use client";

import { useMemo, useState } from "react";

import type { VisitorAggregate, VisitorStats } from "@/lib/types";
import { formatDateTime, formatPercent } from "@/lib/utils";

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

const COUNTRY_REGIONS: Record<string, { x: number; y: number; width: number; height: number }> = {
  CA: { x: 115, y: 68, width: 172, height: 82 },
  US: { x: 148, y: 154, width: 150, height: 58 },
  MX: { x: 190, y: 214, width: 74, height: 38 },
  BR: { x: 318, y: 284, width: 94, height: 100 },
  AR: { x: 330, y: 382, width: 48, height: 84 },
  CL: { x: 310, y: 356, width: 22, height: 104 },
  CO: { x: 286, y: 260, width: 46, height: 44 },
  PE: { x: 292, y: 304, width: 36, height: 58 },
  GB: { x: 470, y: 147, width: 24, height: 34 },
  IE: { x: 454, y: 152, width: 16, height: 24 },
  FR: { x: 492, y: 175, width: 34, height: 32 },
  DE: { x: 522, y: 156, width: 30, height: 34 },
  NL: { x: 510, y: 151, width: 14, height: 16 },
  ES: { x: 468, y: 203, width: 42, height: 32 },
  IT: { x: 532, y: 202, width: 26, height: 44 },
  SE: { x: 540, y: 96, width: 34, height: 58 },
  NO: { x: 514, y: 85, width: 30, height: 64 },
  FI: { x: 574, y: 98, width: 31, height: 46 },
  PL: { x: 552, y: 158, width: 34, height: 28 },
  UA: { x: 590, y: 170, width: 48, height: 28 },
  RU: { x: 610, y: 82, width: 260, height: 78 },
  TR: { x: 574, y: 216, width: 62, height: 26 },
  EG: { x: 552, y: 254, width: 42, height: 36 },
  NG: { x: 502, y: 302, width: 40, height: 34 },
  ZA: { x: 538, y: 390, width: 54, height: 44 },
  KE: { x: 594, y: 326, width: 28, height: 36 },
  SA: { x: 622, y: 258, width: 56, height: 48 },
  AE: { x: 678, y: 268, width: 18, height: 18 },
  IL: { x: 590, y: 238, width: 12, height: 18 },
  IN: { x: 710, y: 276, width: 58, height: 64 },
  CN: { x: 760, y: 188, width: 116, height: 78 },
  JP: { x: 900, y: 210, width: 26, height: 58 },
  KR: { x: 872, y: 214, width: 20, height: 28 },
  TH: { x: 778, y: 310, width: 28, height: 38 },
  VN: { x: 806, y: 310, width: 24, height: 48 },
  MY: { x: 778, y: 356, width: 42, height: 20 },
  SG: { x: 803, y: 374, width: 12, height: 10 },
  ID: { x: 804, y: 386, width: 96, height: 30 },
  PH: { x: 864, y: 330, width: 24, height: 44 },
  AU: { x: 812, y: 414, width: 108, height: 58 },
  NZ: { x: 930, y: 454, width: 38, height: 20 },
};

const LAND_PATHS = [
  "M114 76c38-31 113-31 159-6c34 19 25 45 65 55c31 8 44 31 22 55c-35 37-116 37-165 11c-42-23-85-4-105-43c-16-32-1-53 24-72z",
  "M266 252c35-17 88-7 116 27c30 37 20 98-18 153c-22 31-31 55-58 47c-30-9-10-62-31-98c-24-40-52-68-35-104c5-11 13-19 26-25z",
  "M456 112c42-38 125-42 178-5c36 25 70 24 118 17c63-8 143 9 170 45c23 31-4 55-66 56c-57 0-83 19-118 43c-51 35-136 19-174-13c-38-31-83-23-112-54c-26-27-22-66 4-89z",
  "M518 250c49-37 125-27 161 16c44 53 8 149-47 189c-37 27-71 15-80-23c-9-38-51-70-45-111c3-27-10-52 11-71z",
  "M781 314c43-22 93-3 112 34c16 32 15 87-11 115c-25 28-86 21-113-9c-30-34-27-116 12-140z",
];

function project(lat: number, lon: number) {
  const x = ((lon + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

type MappedAggregate = VisitorAggregate & { x: number; y: number; radius: number; share: number };

export function VisitorMap({ aggregates, stats }: { aggregates: VisitorAggregate[]; stats?: VisitorStats }) {
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const total = aggregates.reduce((sum, item) => sum + item.visitorCount, 0);
  const byCode = useMemo(() => new Map(aggregates.map((item) => [item.countryCode ?? "", item])), [aggregates]);
  const maxCount = aggregates.reduce((max, item) => Math.max(max, item.visitorCount), 1);
  const mapped = useMemo(() => aggregates
    .map((aggregate) => {
      const code = aggregate.countryCode ?? "";
      const position =
        (aggregate.latitude !== null && aggregate.longitude !== null
          ? { lat: aggregate.latitude, lon: aggregate.longitude }
          : null) ?? COUNTRY_POSITIONS[code];
      if (!position) return null;
      const { x, y } = project(position.lat, position.lon);
      const radius = 5 + Math.sqrt(aggregate.visitorCount / maxCount) * 22;
      return { ...aggregate, x, y, radius, share: total ? aggregate.visitorCount / total : 0 };
    })
    .filter((value): value is MappedAggregate => value !== null), [aggregates, maxCount, total]);

  const topCountries = [...mapped].sort((a, b) => b.visitorCount - a.visitorCount).slice(0, 8);
  const active = activeCode ? mapped.find((item) => item.countryCode === activeCode) ?? null : topCountries[0] ?? null;

  return (
    <div className="visitor-map-shell" role="region" aria-label="Interactive visitor geography">
      <div className="visitor-map-stage">
        <svg viewBox="0 0 1000 500" className="visitor-map" role="img" aria-label="Country-level visitor map">
          <defs>
            <linearGradient id="visitor-land" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="var(--accent-glow)" stopOpacity="0.22" />
              <stop offset="0.55" stopColor="var(--accent-gold)" stopOpacity="0.11" />
              <stop offset="1" stopColor="var(--accent-warm)" stopOpacity="0.18" />
            </linearGradient>
            <radialGradient id="visitor-dot" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="var(--accent-gold)" />
              <stop offset="0.48" stopColor="var(--accent-glow)" />
              <stop offset="1" stopColor="var(--accent-warm)" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="1000" height="500" className="visitor-map-ocean" />
          <g className="visitor-map-graticule" aria-hidden="true">
            {Array.from({ length: 9 }, (_, index) => <path key={`lat-${index}`} d={`M0 ${70 + index * 45}H1000`} />)}
            {Array.from({ length: 13 }, (_, index) => <path key={`lon-${index}`} d={`M${80 + index * 70} 0V500`} />)}
          </g>
          <g className="visitor-land-mass" aria-hidden="true">
            {LAND_PATHS.map((path, index) => <path key={index} d={path} />)}
          </g>
          <g className="visitor-country-layer">
            {Object.entries(COUNTRY_REGIONS).map(([code, region]) => {
              const aggregate = byCode.get(code);
              const intensity = aggregate ? Math.max(0.2, aggregate.visitorCount / maxCount) : 0;
              const isActive = activeCode === code;
              return (
                <rect
                  key={code}
                  className="visitor-country-shape"
                  data-visited={Boolean(aggregate)}
                  data-active={isActive || undefined}
                  x={region.x}
                  y={region.y}
                  width={region.width}
                  height={region.height}
                  rx={Math.min(region.width, region.height) * 0.28}
                  opacity={aggregate ? 0.28 + intensity * 0.58 : 0.12}
                  onMouseEnter={() => aggregate?.countryCode && setActiveCode(aggregate.countryCode)}
                  onFocus={() => aggregate?.countryCode && setActiveCode(aggregate.countryCode)}
                  tabIndex={aggregate ? 0 : -1}
                />
              );
            })}
          </g>
          <g className="visitor-flow-layer" aria-hidden="true">
            {topCountries.slice(0, 5).map((point) => (
              <path key={`arc-${point.countryCode ?? point.countryName}`} d={`M500 250 Q ${(500 + point.x) / 2} ${Math.min(point.y, 250) - 60} ${point.x} ${point.y}`} />
            ))}
          </g>
          <g className="visitor-bubble-layer">
            {mapped.map((point) => {
              const key = point.countryCode ?? `${point.x}-${point.y}`;
              const isActive = active?.countryCode === point.countryCode;
              return (
                <g
                  key={key}
                  transform={`translate(${point.x}, ${point.y})`}
                  className="visitor-bubble-hit"
                  tabIndex={0}
                  role="button"
                  aria-label={`${point.countryName ?? point.countryCode ?? "Unknown"}: ${point.visitorCount} unique visitors`}
                  onMouseEnter={() => setActiveCode(point.countryCode)}
                  onFocus={() => setActiveCode(point.countryCode)}
                  onClick={() => setActiveCode(point.countryCode)}
                >
                  <circle className="visitor-pulse-ring" r={point.radius + 8} />
                  <circle className="visitor-pulse" data-active={isActive || undefined} r={point.radius} />
                  <circle className="visitor-bubble-core" r={Math.max(3, point.radius * 0.34)} />
                </g>
              );
            })}
          </g>
        </svg>
        {active ? (
          <div className="visitor-popover" style={{ left: `${Math.min(66, Math.max(34, active.x / 10))}%`, top: `${Math.min(78, Math.max(8, active.y / 5))}%` }}>
            <div className="eyebrow">{active.countryCode ?? "Country"}</div>
            <strong>{active.countryName ?? active.countryCode ?? "Unknown"}</strong>
            <span>{active.visitorCount} unique visitor{active.visitorCount === 1 ? "" : "s"} · {formatPercent(active.share)} share</span>
            <span>Last seen {formatDateTime(active.lastSeenAt)}</span>
          </div>
        ) : null}
      </div>
      <div className="visitor-map-legend">
        <span>{total} unique visitors across {stats?.countries ?? aggregates.length} countries</span>
        <span className="micro-pill">Country-level only</span>
        <span className="micro-pill">Salted hash privacy</span>
      </div>
      {stats ? (
        <div className="visitor-stat-grid" aria-label="Visitor summary">
          <span><strong>{stats.recent24h}</strong> last 24h</span>
          <span><strong>{stats.recent7d}</strong> last 7d</span>
          <span><strong>{stats.accountCreated}</strong> created accounts</span>
          <span><strong>{stats.countries}</strong> countries</span>
        </div>
      ) : null}
      {topCountries.length > 0 ? (
        <div className="visitor-country-list" aria-label="Top visitor countries">
          {topCountries.map((country) => (
            <button
              key={country.countryCode ?? country.countryName ?? "unknown"}
              type="button"
              className={active?.countryCode === country.countryCode ? "is-active" : undefined}
              onClick={() => setActiveCode(country.countryCode)}
            >
              <strong>{country.countryName ?? country.countryCode ?? "Unknown"}</strong> {country.visitorCount}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
