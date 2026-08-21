import type { AdminSmtpSettings } from "@/lib/types";
import {
  ANALYTICS_BUCKET_OPTIONS,
  ANALYTICS_RANGE_OPTIONS,
  comparisonPercent,
  type AdminHistoricalAnalytics,
  type AnalyticsPoint,
} from "@/lib/admin-analytics";
import { formatDateTime, formatNumber, formatPercent } from "@/lib/utils";

type TrendKey =
  | "uniqueVisitors"
  | "pageViews"
  | "newAccounts"
  | "firstTimeVisitors"
  | "returningVisitors"
  | "notificationsSent"
  | "notificationsFailed"
  | "notificationsSkipped";

interface TrendSeries {
  key: TrendKey;
  label: string;
  color: "blue" | "purple" | "gold" | "red";
}

const trafficSeries: TrendSeries[] = [
  { key: "uniqueVisitors", label: "Unique visitors", color: "blue" },
  { key: "pageViews", label: "Page views", color: "purple" },
];

const visitorMixSeries: TrendSeries[] = [
  { key: "firstTimeVisitors", label: "First-time", color: "gold" },
  { key: "returningVisitors", label: "Returning", color: "blue" },
];

const notificationSeries: TrendSeries[] = [
  { key: "notificationsSent", label: "Sent", color: "blue" },
  { key: "notificationsSkipped", label: "Not configured", color: "gold" },
  { key: "notificationsFailed", label: "Failed", color: "red" },
];

function formatAnalyticsDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`));
}

function comparisonCopy(current: number, previous: number) {
  const percent = comparisonPercent(current, previous);
  if (percent === null) return "New baseline; previous period was zero";
  if (percent === 0) return "Unchanged from previous period";
  return `${Math.abs(percent).toFixed(0)}% ${percent > 0 ? "higher" : "lower"} than previous period`;
}

function comparisonTone(current: number, previous: number) {
  if (current === previous) return "neutral";
  return current > previous ? "up" : "down";
}

function SummaryMetric({
  label,
  current,
  previous,
  note,
}: {
  label: string;
  current: number;
  previous: number;
  note?: string;
}) {
  return (
    <article className="analytics-summary-card">
      <span>{label}</span>
      <strong>{formatNumber(current)}</strong>
      <small data-tone={comparisonTone(current, previous)}>{comparisonCopy(current, previous)}</small>
      {note ? <em>{note}</em> : null}
    </article>
  );
}

function seriesValue(point: AnalyticsPoint, key: TrendKey) {
  return point[key];
}

function chartX(index: number, count: number, width: number) {
  if (count <= 1) return width / 2;
  return 12 + (index / (count - 1)) * (width - 24);
}

function chartY(value: number, max: number, height: number) {
  return 12 + (1 - value / Math.max(1, max)) * (height - 24);
}

function ChartLegend({ series }: { series: TrendSeries[] }) {
  return (
    <div className="analytics-chart-legend" aria-label="Chart legend">
      {series.map((item) => (
        <span key={item.key}>
          <i data-color={item.color} aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function ChartDateRange({ points }: { points: AnalyticsPoint[] }) {
  const first = points[0];
  const middle = points[Math.floor((points.length - 1) / 2)];
  const last = points.at(-1);
  return (
    <div className="analytics-chart-dates" aria-hidden="true">
      <span>{first?.label ?? "Start"}</span>
      {middle && middle !== first && middle !== last ? <span>{middle.label}</span> : <span />}
      <span>{last?.label ?? "End"}</span>
    </div>
  );
}

function LineChart({
  id,
  title,
  description,
  points,
  series,
}: {
  id: string;
  title: string;
  description: string;
  points: AnalyticsPoint[];
  series: TrendSeries[];
}) {
  const width = 720;
  const height = 220;
  const max = Math.max(1, ...points.flatMap((point) => series.map((item) => seriesValue(point, item.key))));
  return (
    <figure className="analytics-chart-card">
      <figcaption>
        <strong id={`${id}-heading`}>{title}</strong>
        <span>{description}</span>
      </figcaption>
      <ChartLegend series={series} />
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-heading ${id}-description`}>
        <desc id={`${id}-description`}>{description}. Exact values follow in the activity data table.</desc>
        <g className="analytics-plot-grid" aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line key={ratio} x1="12" x2={width - 12} y1={12 + ratio * (height - 24)} y2={12 + ratio * (height - 24)} />
          ))}
        </g>
        {series.map((item) => {
          const coordinates = points.map((point, index) => ({
            point,
            x: chartX(index, points.length, width),
            y: chartY(seriesValue(point, item.key), max, height),
          }));
          return (
            <g key={item.key} className="analytics-line-series" data-color={item.color}>
              <polyline points={coordinates.map(({ x, y }) => `${x},${y}`).join(" ")} />
              {coordinates.map(({ point, x, y }) => (
                <circle key={point.key} cx={x} cy={y} r="4">
                  <title>{`${point.label}: ${formatNumber(seriesValue(point, item.key))} ${item.label.toLowerCase()}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <ChartDateRange points={points} />
    </figure>
  );
}

function BarChart({
  id,
  title,
  description,
  points,
  series,
}: {
  id: string;
  title: string;
  description: string;
  points: AnalyticsPoint[];
  series: TrendSeries[];
}) {
  const width = 720;
  const height = 220;
  const totals = points.map((point) => series.reduce((sum, item) => sum + seriesValue(point, item.key), 0));
  const max = Math.max(1, ...totals);
  const slot = (width - 24) / Math.max(1, points.length);
  const barWidth = Math.max(2, Math.min(34, slot * 0.62));
  return (
    <figure className="analytics-chart-card">
      <figcaption>
        <strong id={`${id}-heading`}>{title}</strong>
        <span>{description}</span>
      </figcaption>
      <ChartLegend series={series} />
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-heading ${id}-description`}>
        <desc id={`${id}-description`}>{description}. Exact values follow in the activity data table.</desc>
        <g className="analytics-plot-grid" aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line key={ratio} x1="12" x2={width - 12} y1={12 + ratio * (height - 24)} y2={12 + ratio * (height - 24)} />
          ))}
        </g>
        {points.map((point, index) => {
          let accumulated = 0;
          const x = 12 + index * slot + (slot - barWidth) / 2;
          return (
            <g key={point.key}>
              {series.map((item) => {
                const value = seriesValue(point, item.key);
                const segmentHeight = (value / max) * (height - 24);
                accumulated += segmentHeight;
                return (
                  <rect
                    key={item.key}
                    className="analytics-bar-segment"
                    data-color={item.color}
                    x={x}
                    y={height - 12 - accumulated}
                    width={barWidth}
                    height={Math.max(value > 0 ? 2 : 0, segmentHeight)}
                    rx="2"
                  >
                    <title>{`${point.label}: ${formatNumber(value)} ${item.label.toLowerCase()}`}</title>
                  </rect>
                );
              })}
            </g>
          );
        })}
      </svg>
      <ChartDateRange points={points} />
    </figure>
  );
}

function CountryDistribution({ data }: { data: AdminHistoricalAnalytics }) {
  const countries = data.countries.slice(0, 12);
  const max = Math.max(1, ...countries.flatMap((country) => [country.currentVisitors, country.previousVisitors]));
  return (
    <div className="analytics-country-panel">
      <div className="analytics-section-heading">
        <div>
          <h3>Country distribution</h3>
          <p>Current and equal-length previous periods. Unknown country traffic remains explicit.</p>
        </div>
        <div className="analytics-chart-legend">
          <span><i data-color="blue" aria-hidden="true" />Current</span>
          <span><i data-color="purple" aria-hidden="true" />Previous</span>
        </div>
      </div>
      {countries.length > 0 ? (
        <ol className="analytics-country-bars">
          {countries.map((country) => (
            <li key={country.countryCode}>
              <div>
                <strong>{country.countryName}</strong>
                <span>{formatNumber(country.currentVisitors)} current · {formatNumber(country.previousVisitors)} previous</span>
              </div>
              <span className="analytics-country-track" aria-hidden="true">
                <i data-color="blue" style={{ width: `${(country.currentVisitors / max) * 100}%` }} />
                <i data-color="purple" style={{ width: `${(country.previousVisitors / max) * 100}%` }} />
              </span>
              <small>{formatPercent(country.share)} current share</small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="analytics-empty">No country-level activity is available for this period.</p>
      )}
    </div>
  );
}

function ActivityTable({ points }: { points: AnalyticsPoint[] }) {
  return (
    <details className="analytics-data-disclosure">
      <summary>Open complete activity data table</summary>
      <div className="analytics-table-scroll">
        <table>
          <caption>Historical activity by selected time bucket</caption>
          <thead>
            <tr>
              <th scope="col">Period</th>
              <th scope="col">Unique visitors</th>
              <th scope="col">Page views</th>
              <th scope="col">First-time</th>
              <th scope="col">Returning</th>
              <th scope="col">Unknown country</th>
              <th scope="col">New accounts</th>
              <th scope="col">Email sent</th>
              <th scope="col">Email not configured</th>
              <th scope="col">Email failed</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.key}>
                <th scope="row">{point.label}</th>
                <td>{formatNumber(point.uniqueVisitors)}</td>
                <td>{formatNumber(point.pageViews)}</td>
                <td>{formatNumber(point.firstTimeVisitors)}</td>
                <td>{formatNumber(point.returningVisitors)}</td>
                <td>{formatNumber(point.unknownCountryVisitors)}</td>
                <td>{formatNumber(point.newAccounts)}</td>
                <td>{formatNumber(point.notificationsSent)}</td>
                <td>{formatNumber(point.notificationsSkipped)}</td>
                <td>{formatNumber(point.notificationsFailed)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function CountryTable({ data }: { data: AdminHistoricalAnalytics }) {
  return (
    <details className="analytics-data-disclosure">
      <summary>Open complete country comparison table</summary>
      <div className="analytics-table-scroll">
        <table>
          <caption>Country-level visitors in current and previous periods</caption>
          <thead>
            <tr>
              <th scope="col">Country</th>
              <th scope="col">Current visitors</th>
              <th scope="col">Previous visitors</th>
              <th scope="col">Page views</th>
              <th scope="col">Current share</th>
              <th scope="col">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {data.countries.map((country) => (
              <tr key={country.countryCode}>
                <th scope="row">{country.countryName}</th>
                <td>{formatNumber(country.currentVisitors)}</td>
                <td>{formatNumber(country.previousVisitors)}</td>
                <td>{formatNumber(country.pageViews)}</td>
                <td>{formatPercent(country.share)}</td>
                <td>{formatDateTime(country.lastSeenAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function preserveAdminParams(params: Record<string, string>) {
  return Object.entries(params).filter(([key, value]) => (
    value !== ""
    && key !== "analyticsRange"
    && key !== "analyticsBucket"
  ));
}

export function AdminHistoricalAnalyticsPanel({
  data,
  smtp,
  params,
}: {
  data: AdminHistoricalAnalytics;
  smtp: Pick<AdminSmtpSettings, "source" | "lastTestStatus">;
  params: Record<string, string>;
}) {
  const notification = data.notificationHealth;
  const hasActivity = data.points.some((point) => point.uniqueVisitors || point.pageViews || point.newAccounts);
  const accountSeries: TrendSeries[] = [{ key: "newAccounts", label: "New accounts", color: "gold" }];

  return (
    <section id="historical-analytics" className="panel analytics-panel scroll-mt-28">
      <div className="analytics-panel-heading">
        <div>
          <span className="eyebrow">Privacy-safe operations</span>
          <h2>Historical traffic and delivery health</h2>
          <p>
            Country-level aggregate trends from salted visitor signatures. Page views are requests observed by the visitor beacon, not sessions, and no raw IP address, user-agent string, or precise location is retained.
          </p>
        </div>
        <form className="analytics-controls" action="/admin#historical-analytics">
          {preserveAdminParams(params).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <label>
            <span>Date range</span>
            <select className="field" name="analyticsRange" defaultValue={data.filters.rangeDays}>
              {ANALYTICS_RANGE_OPTIONS.map((days) => <option key={days} value={days}>Last {days} days</option>)}
            </select>
          </label>
          <label>
            <span>Time bucket</span>
            <select className="field" name="analyticsBucket" defaultValue={data.filters.bucket}>
              {ANALYTICS_BUCKET_OPTIONS.map((bucket) => <option key={bucket} value={bucket}>By {bucket}</option>)}
            </select>
          </label>
          <button className="cta-secondary cta-compact" type="submit">Update view</button>
        </form>
      </div>

      <div className="analytics-period-note">
        <strong>{formatAnalyticsDate(data.period.startDate)} to {formatAnalyticsDate(data.period.endDate)}</strong>
        <span>Compared with {formatAnalyticsDate(data.period.previousStartDate)} to {formatAnalyticsDate(data.period.previousEndDate)}</span>
      </div>

      <div className="analytics-summary-grid">
        <SummaryMetric label="Unique visitors" current={data.current.uniqueVisitors} previous={data.previous.uniqueVisitors} />
        <SummaryMetric label="Page views" current={data.current.pageViews} previous={data.previous.pageViews} note="Not sessions" />
        <SummaryMetric label="New accounts" current={data.current.newAccounts} previous={data.previous.newAccounts} />
        <SummaryMetric label="Countries" current={data.current.countries} previous={data.previous.countries} />
        <SummaryMetric label="First-time visitors" current={data.current.firstTimeVisitors} previous={data.previous.firstTimeVisitors} />
        <SummaryMetric label="Returning visitors" current={data.current.returningVisitors} previous={data.previous.returningVisitors} />
      </div>

      {!hasActivity ? (
        <p className="analytics-empty">
          No historical activity has been collected in this range. The lifetime visitor map remains available above; this time series starts only when the privacy-safe daily aggregate table begins recording visits.
        </p>
      ) : null}

      <div className="analytics-chart-grid">
        <LineChart
          id="traffic-trend"
          title="Traffic over time"
          description="Unique visitors and page views by selected bucket"
          points={data.points}
          series={trafficSeries}
        />
        <BarChart
          id="visitor-mix"
          title="First-time and returning visitors"
          description="A first-time visitor has a coarse salted signature whose first observed day falls in the selected bucket"
          points={data.points}
          series={visitorMixSeries}
        />
        <BarChart
          id="account-trend"
          title="New accounts over time"
          description="Accounts created in each selected bucket"
          points={data.points}
          series={accountSeries}
        />
        <BarChart
          id="delivery-trend"
          title="Notification delivery over time"
          description="Transactional email attempts by recorded transport outcome"
          points={data.points}
          series={notificationSeries}
        />
      </div>

      <CountryDistribution data={data} />

      <div className="analytics-health-grid">
        <article>
          <span>SMTP transport</span>
          <strong>{smtp.source === "none" ? "Not configured" : `Configured via ${smtp.source}`}</strong>
          <small>Last test: {smtp.lastTestStatus}</small>
        </article>
        <article>
          <span>Current-period delivery</span>
          <strong>{formatNumber(notification.sent)} sent · {formatNumber(notification.failed)} failed</strong>
          <small>{formatNumber(notification.skipped)} skipped because SMTP was unavailable</small>
        </article>
        <article>
          <span>Previous-period delivery</span>
          <strong>{formatNumber(notification.previousSent)} sent · {formatNumber(notification.previousFailed)} failed</strong>
          <small>{formatNumber(notification.previousSkipped)} not configured</small>
        </article>
        <article>
          <span>Latest delivery event</span>
          <strong>{formatDateTime(notification.latestAt)}</strong>
          <small>No recipients, subjects, or message contents are stored in telemetry</small>
        </article>
      </div>

      <div className="analytics-telemetry-note">
        <strong>Collection and retention</strong>
        <span>
          Historical aggregates started {formatDateTime(data.telemetry.collectionStartedAt)}; latest activity {formatDateTime(data.telemetry.latestActivityAt)}. Daily visitor and delivery aggregates are retained for {data.telemetry.retainedDays} days.
        </span>
        {data.telemetry.hasPreUpgradeGap ? (
          <span>
            Lifetime visitor totals include activity from before historical aggregation began, so earlier daily, weekly, and monthly values are unknown and are not reconstructed.
          </span>
        ) : null}
        <span>
          Unknown country means Cloudflare supplied no usable country code. Returning means the same coarse, purpose-salted network/browser signature was observed before the selected bucket. It is an operational estimate, not a person-level identity, and this analytics layer adds no fingerprint inputs.
        </span>
      </div>

      <ActivityTable points={data.points} />
      <CountryTable data={data} />
    </section>
  );
}
