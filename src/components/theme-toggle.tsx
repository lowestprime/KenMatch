"use client";

import { useEffect, useState } from "react";

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "oled", label: "OLED" },
] as const;

type ThemeValue = (typeof themes)[number]["value"];

function isThemeValue(value: string | null): value is ThemeValue {
  return value === "light" || value === "dark" || value === "oled";
}

function getInitialTheme(): ThemeValue {
  if (typeof document !== "undefined") {
    const current = document.documentElement.dataset.theme ?? null;
    if (isThemeValue(current ?? null)) {
      return current as ThemeValue;
    }
  }

  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("kenmatch-theme");
    if (isThemeValue(stored)) {
      return stored;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }

  return "light";
}

function applyTheme(theme: ThemeValue) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
  window.localStorage.setItem("kenmatch-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeValue>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="theme-toggle" role="group" aria-label="Theme toggle">
      {themes.map((option) => (
        <button
          key={option.value}
          type="button"
          className={theme === option.value ? "is-active" : ""}
          onClick={() => setTheme(option.value)}
          aria-pressed={theme === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}


