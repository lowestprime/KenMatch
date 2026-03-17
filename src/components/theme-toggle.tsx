"use client";

import { useEffect, useState } from "react";

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

type ThemeValue = (typeof themes)[number]["value"];

function getInitialTheme(): ThemeValue {
  if (typeof document !== "undefined" && document.documentElement.dataset.theme === "dark") {
    return "dark";
  }
  if (typeof window !== "undefined" && window.localStorage.getItem("kenmatch-theme") === "dark") {
    return "dark";
  }
  return "light";
}

function applyTheme(theme: ThemeValue) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
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
        <button key={option.value} type="button" className={theme === option.value ? "is-active" : ""} onClick={() => setTheme(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}
