"use client";

import type { MouseEvent } from "react";

export function SkipLink() {
  function activate(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const target = document.getElementById("main-content");
    if (!target) return;
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#main-content`);
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  }

  return <a href="#main-content" className="skip-link" onClick={activate}>Skip to content</a>;
}
