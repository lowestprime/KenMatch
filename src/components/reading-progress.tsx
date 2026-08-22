"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { calculatePageProgress } from "@/lib/reading-progress";

export function ReadingProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const scrollingElement = document.scrollingElement ?? document.documentElement;
      setProgress(calculatePageProgress(window.scrollY, scrollingElement.scrollHeight, window.innerHeight));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);

    frame = window.requestAnimationFrame(update);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    resizeObserver?.observe(document.documentElement);
    const main = document.getElementById("main-content");
    if (main) resizeObserver?.observe(main);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resizeObserver?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return (
    <div
      className="reading-progress"
      role="progressbar"
      aria-label="Page progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      aria-valuetext={`${Math.round(progress)}% through page`}
    >
      <span className="reading-progress-value" style={{ transform: `scaleY(${progress / 100})` }} />
    </div>
  );
}
