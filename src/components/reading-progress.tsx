"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  calculateReadingProgress,
  isLongReadingPath,
  qualifiesAsLongReadingSurface,
} from "@/lib/reading-progress";

export function ReadingProgress() {
  const pathname = usePathname();
  const routeEligible = isLongReadingPath(pathname);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!routeEligible) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const surface = document.querySelector<HTMLElement>(".long-reading-route");
      if (!surface) {
        setVisible(false);
        return;
      }
      const viewportHeight = window.innerHeight;
      const contentHeight = surface.scrollHeight;
      const contentTop = surface.getBoundingClientRect().top + window.scrollY;
      setVisible(qualifiesAsLongReadingSurface(contentHeight, viewportHeight));
      setProgress(calculateReadingProgress(window.scrollY, contentTop, contentHeight, viewportHeight));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [routeEligible]);

  if (!routeEligible || !visible) return null;

  return (
    <div
      className="reading-progress"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-valuetext={`${Math.round(progress)}% read`}
    >
      <span className="reading-progress-value" style={{ height: `${progress}%` }} />
    </div>
  );
}
