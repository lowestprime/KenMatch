"use client";

import { useId, useState, type KeyboardEvent } from "react";

import {
  KEN_LIFECYCLE_SIGNALS,
  KEN_LIFECYCLE_STAGES,
  lifecycleStageForTask,
} from "@/lib/allocation-policy";
import type { TaskStage } from "@/lib/types";

type LifecycleDensity = "explainer" | "compact" | "progress";

export function KenLifecycleMap({
  id,
  density = "explainer",
  currentTaskStage,
  title = "From proposal to audited output",
  eyebrow = "How the board works",
}: {
  id?: string;
  density?: LifecycleDensity;
  currentTaskStage?: TaskStage;
  title?: string;
  eyebrow?: string;
}) {
  const instanceId = useId().replaceAll(":", "");
  const currentStageId = currentTaskStage ? lifecycleStageForTask(currentTaskStage) : null;
  const currentIndex = currentStageId
    ? KEN_LIFECYCLE_STAGES.findIndex((stage) => stage.id === currentStageId)
    : 0;
  const [activeIndex, setActiveIndex] = useState(Math.max(currentIndex, 0));
  const activeStage = KEN_LIFECYCLE_STAGES[activeIndex] ?? KEN_LIFECYCLE_STAGES[0];
  const activeSignals = KEN_LIFECYCLE_SIGNALS.filter((signal) =>
    signal.stageIds.includes(activeStage.id),
  );
  const headingId = `${instanceId}-lifecycle-heading`;
  const detailId = `${instanceId}-lifecycle-detail`;

  function focusStage(index: number) {
    const boundedIndex = (index + KEN_LIFECYCLE_STAGES.length) % KEN_LIFECYCLE_STAGES.length;
    setActiveIndex(boundedIndex);
    requestAnimationFrame(() => {
      document.getElementById(`${instanceId}-stage-${boundedIndex}`)?.focus();
    });
  }

  function handleStageKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusStage(index + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusStage(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusStage(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusStage(KEN_LIFECYCLE_STAGES.length - 1);
    }
  }

  return (
    <section
      id={id}
      className={`panel ken-lifecycle-map is-${density}`}
      aria-labelledby={headingId}
      data-current-stage={currentStageId ?? undefined}
    >
      <header className="ken-lifecycle-header">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2 id={headingId}>{title}</h2>
        </div>
        <p>
          Select a numbered stage for its public gate. Arrow keys move between stages.
        </p>
      </header>

      <p className="sr-only">
        A Ken moves through eight public stages: draft, intake review, public signal,
        board approval, monitored run, checkpoint review, public delivery, and
        post-run audit. Sponsorship never changes rank.
      </p>

      <div className="ken-lifecycle-rail-wrap">
        <svg
          className="ken-lifecycle-flow"
          viewBox="0 0 800 44"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M20 22 H780" pathLength="100" />
        </svg>
        <ol className="ken-lifecycle-rail" aria-label="Ken lifecycle stages">
          {KEN_LIFECYCLE_STAGES.map((stage, index) => {
            const progressState = currentStageId
              ? index < currentIndex
                ? "complete"
                : index === currentIndex
                  ? currentTaskStage === "blocked"
                    ? "blocked"
                    : "current"
                  : "upcoming"
              : "explore";
            return (
              <li
                key={stage.id}
                className={`lifecycle-stage tone-${stage.tone}`}
                data-active={index === activeIndex}
                data-progress={progressState}
              >
                <button
                  id={`${instanceId}-stage-${index}`}
                  type="button"
                  className="lifecycle-stage-button"
                  aria-controls={detailId}
                  aria-expanded={index === activeIndex}
                  aria-current={progressState === "current" ? "step" : undefined}
                  aria-label={`${stage.label}. ${stage.summary} Public gate: ${stage.publicGate}`}
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => handleStageKeyDown(event, index)}
                >
                  <span className="lifecycle-step-number" aria-hidden="true">{stage.step}</span>
                  <span className="lifecycle-step-label">{stage.shortLabel}</span>
                  {currentStageId ? (
                    <span className="lifecycle-progress-label">
                      {progressState === "complete"
                        ? "Complete"
                        : progressState === "current"
                          ? "Current"
                          : progressState === "blocked"
                            ? "Blocked"
                            : "Upcoming"}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <article
        id={detailId}
        className={`ken-lifecycle-detail tone-${activeStage.tone}`}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="ken-lifecycle-detail-copy">
          <span className="lifecycle-detail-step">Stage {activeStage.step} of {KEN_LIFECYCLE_STAGES.length}</span>
          <h3>{activeStage.shortLabel}</h3>
          <p>{activeStage.summary}</p>
          <p className="lifecycle-public-gate">
            <strong>Public gate</strong>
            <span>{activeStage.publicGate}</span>
          </p>
        </div>
        <div className="ken-lifecycle-signals" aria-label={`Mechanisms at ${activeStage.shortLabel}`}>
          {activeSignals.map((signal) => (
            <div key={signal.id} className="lifecycle-signal">
              <span className="lifecycle-signal-marker" aria-hidden="true">{signal.marker}</span>
              <div>
                <strong>{signal.label}</strong>
                <p>{signal.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </article>

      <ol className="ken-lifecycle-print-narrative" aria-label="Printable Ken lifecycle">
        {KEN_LIFECYCLE_STAGES.map((stage) => (
          <li key={stage.id}>
            <strong>{stage.label}</strong>
            <span>{stage.summary}</span>
            <small>Public gate: {stage.publicGate}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}
