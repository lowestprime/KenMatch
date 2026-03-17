"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "kenmatch-theme";

function detectTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(nextTheme: Theme) {
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  window.localStorage.setItem(STORAGE_KEY, nextTheme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(detectTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-panel/90 px-4 py-2 text-sm font-semibold text-ink transition hover:border-accent hover:text-accent"
      aria-label="Toggle light and dark mode"
    >
      <span className="text-base">{theme === "light" ? "◐" : "◑"}</span>
      <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}
