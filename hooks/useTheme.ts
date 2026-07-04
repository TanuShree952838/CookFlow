"use client";

import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_KEY = "cookflow:theme:v1";

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

function getInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

/**
 * Dark-mode controller. The initial class is set by an inline script in the
 * document head (see layout) to avoid a flash of the wrong theme; this hook
 * keeps React state in sync and persists user choice.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        window.localStorage.setItem(THEME_KEY, next);
      } catch {
        // Ignore persistence failure.
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme, mounted };
}
