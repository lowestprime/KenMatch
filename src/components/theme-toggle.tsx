"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

type ThemeValue = "light" | "oled";

function normalize(value: string | null): ThemeValue {
  if (value === "light") return "light";
  return "oled";
}

function getInitialTheme(): ThemeValue {
  if (typeof document !== "undefined") {
    const current = document.documentElement.dataset.theme ?? null;
    if (current === "light") return "light";
    if (current === "oled" || current === "dark") return "oled";
  }
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("kenmatch-theme");
    if (stored) return normalize(stored);
  }
  return "oled";
}

function applyTheme(theme: ThemeValue) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
  window.localStorage.setItem("kenmatch-theme", theme);
}

function subscribeTheme(callback: () => void) {
  const notify = () => callback();
  window.addEventListener("storage", notify);
  window.addEventListener("kenmatch-theme-change", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("kenmatch-theme-change", notify);
  };
}

function getServerTheme(): ThemeValue {
  return "oled";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getInitialTheme, getServerTheme);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    applyTheme(theme);
    if (buttonRef.current) {
      buttonRef.current.dataset.theme = theme;
    }
  }, [theme]);

  const next: ThemeValue = theme === "light" ? "oled" : "light";
  const label = theme === "light" ? "Switch to OLED theme" : "Switch to Light theme";

  return (
    <button
      type="button"
      ref={buttonRef}
      className="theme-toggle"
      aria-label={label}
      aria-pressed={theme === "oled"}
      onClick={() => {
        applyTheme(next);
        window.dispatchEvent(new Event("kenmatch-theme-change"));
      }}
    >
      <span className="theme-toggle-thumb" aria-hidden="true">
        {theme === "light" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M5.4 18.6l1.4-1.4M17.2 6.8l1.4-1.4" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 14.5A8 8 0 1 1 9.5 4 7 7 0 0 0 20 14.5z" />
          </svg>
        )}
      </span>
    </button>
  );
}
