"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

export function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("wda_theme") as ThemeMode | null) ?? "dark";
    setTheme(saved);
    document.documentElement.dataset.theme = saved;
  }, []);

  function toggle(): void {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("wda_theme", next);
    document.documentElement.dataset.theme = next;
  }

  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
      <span>{theme === "dark" ? "Dark" : "Light"}</span>
      <span className="dot" />
    </button>
  );
}
