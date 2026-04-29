import { formatCurrency, formatNumber } from "@/lib/utils";
import type { TaskSummary } from "@/lib/types";

export function KenSandboxStrip({ ken, compact = false }: { ken: Pick<TaskSummary, "sandboxCapitalUsd" | "sandboxApiSpendUsd" | "sandboxPilotUsers" | "modelLineup" | "simulationSummary" | "sampleOutcome" | "sponsorAppeal">; compact?: boolean }) {
  const hasSimulation = ken.sandboxCapitalUsd > 0 || ken.sandboxApiSpendUsd > 0 || ken.sandboxPilotUsers > 0 || ken.modelLineup.length > 0;
  if (!hasSimulation) {
    return null;
  }

  return (
    <section className={`sandbox-strip ${compact ? "is-compact" : ""}`}>
      <div className="sandbox-strip-head">
        <div>
          <div className="eyebrow">Sandbox demo · simulated data</div>
          <h3 className="sandbox-strip-title">{compact ? "What the simulated run looks like" : "What this Ken looks like in the public demo"}</h3>
        </div>
        <span className="micro-pill">No real capital · no real vendor bills</span>
      </div>
      <p className="sandbox-disclosure" role="note">
        All dollar values, pilot user counts, and backer interest shown below are simulated outputs from demo-mode long-context workflow estimates and are <strong>not</strong> real sponsorships, investments, or production outcomes.
      </p>
      <div className="sandbox-metric-grid">
        <SandboxMetric label="Sandbox backing" value={formatCurrency(ken.sandboxCapitalUsd)} />
        <SandboxMetric label="API spend" value={formatCurrency(ken.sandboxApiSpendUsd)} />
        <SandboxMetric label="Pilot users" value={formatNumber(ken.sandboxPilotUsers)} />
      </div>
      {ken.modelLineup.length > 0 ? (
        <div className="sandbox-chip-row" aria-label="Model lineup">
          {ken.modelLineup.map((label, index) => (
            <span key={`${index}-${label}`} className="tag">{label}</span>
          ))}
        </div>
      ) : null}
      <p className="text-sm leading-7 text-muted">{ken.simulationSummary}</p>
      <div className="sandbox-highlight-grid">
        <div className="sandbox-highlight">
          <div className="eyebrow">Sample result</div>
          <p className="mt-2 text-sm leading-7 text-muted">{ken.sampleOutcome}</p>
        </div>
        {!compact ? (
          <div className="sandbox-highlight">
            <div className="eyebrow">Why people might back it</div>
            <p className="mt-2 text-sm leading-7 text-muted">{ken.sponsorAppeal}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SandboxMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="sandbox-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
