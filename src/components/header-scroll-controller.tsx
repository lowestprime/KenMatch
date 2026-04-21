"use client";

import { useEffect } from "react";

export function HeaderScrollController() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    const siteHeader = header;
    let lastY = window.scrollY;
    let ticking = false;

    function update() {
      const currentY = window.scrollY;
      const scrollingDown = currentY > lastY + 8;
      const scrollingUp = currentY < lastY - 8;
      if (currentY < 90 || scrollingUp) {
        siteHeader.dataset.hidden = "false";
      } else if (scrollingDown) {
        siteHeader.dataset.hidden = "true";
      }
      lastY = currentY;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
