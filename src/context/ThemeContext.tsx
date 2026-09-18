"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

export type ThemeMode = "light" | "dark" | "system";

export type ThemeClickEvent =
  | React.MouseEvent<HTMLElement>
  | MouseEvent
  | { clientX?: number; clientY?: number };

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  toggleTheme: (event?: ThemeClickEvent) => void;
  setTheme: (mode: ThemeMode, event?: ThemeClickEvent) => void;
}

const THEME_STORAGE_KEY = "manuview_theme_mode";

function getSystemPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function applyThemeToDom(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) || sessionStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved as ThemeMode;
      }
    } catch {}
    return "system";
  });

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    return getSystemPreference();
  });

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemIsDark ? "dark" : "light") : theme;

  // Immediate DOM synchronization whenever resolved theme or theme mode changes
  useEffect(() => {
    applyThemeToDom(resolvedTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      sessionStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme, resolvedTheme]);

  // Listen to live OS system appearance changes (both WebKit matchMedia and Tauri window event)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let mediaQuery: MediaQueryList | null = null;
    const handleSystemChange = (isDark: boolean) => {
      setSystemIsDark(isDark);
      if (theme === "system") {
        applyThemeToDom(isDark ? "dark" : "light");
      }
    };

    try {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      handleSystemChange(mediaQuery.matches);

      const mqlHandler = (e: MediaQueryListEvent | MediaQueryList) => {
        handleSystemChange(e.matches);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", mqlHandler);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(mqlHandler);
      }
    } catch {}

    // Support Tauri native window theme listener if running in desktop app
    let unlistenTauri: (() => void) | undefined;
    import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) => {
        const appWindow = getCurrentWindow();
        if (appWindow && typeof appWindow.theme === "function") {
          appWindow
            .theme()
            .then((currTheme) => {
              if (currTheme) {
                handleSystemChange(currTheme === "dark");
              }
            })
            .catch(() => {});
        }
        if (appWindow && typeof appWindow.onThemeChanged === "function") {
          appWindow
            .onThemeChanged(({ payload: newTheme }) => {
              handleSystemChange(newTheme === "dark");
            })
            .then((unlisten) => {
              unlistenTauri = unlisten;
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", handleSystemChange as any);
        } else if ((mediaQuery as any).removeListener) {
          (mediaQuery as any).removeListener(handleSystemChange as any);
        }
      }
      if (unlistenTauri) {
        unlistenTauri();
      }
    };
  }, [theme]);

  const runWaveTransition = (
    nextTheme: ThemeMode,
    nextResolvedTheme: "light" | "dark",
    event?: ThemeClickEvent
  ) => {
    if (typeof document === "undefined") return;

    // Check accessibility preference for reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || resolvedTheme === nextResolvedTheme) {
      applyThemeToDom(nextResolvedTheme);
      setThemeState(nextTheme);
      return;
    }

    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };

    // Native View Transitions API
    if (typeof doc.startViewTransition === "function") {
      try {
        const transition = doc.startViewTransition(() => {
          flushSync(() => {
            applyThemeToDom(nextResolvedTheme);
            setThemeState(nextTheme);
          });
        });

        const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
        const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;
        const x = event && typeof event.clientX === "number" && event.clientX > 0 ? event.clientX : 32;
        const y = event && typeof event.clientY === "number" && event.clientY > 0 ? event.clientY : windowHeight - 32;
        const endRadius = Math.hypot(Math.max(x, windowWidth - x), Math.max(y, windowHeight - y));

        transition.ready
          .then(() => {
            document.documentElement.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${endRadius}px at ${x}px ${y}px)`,
                ],
              },
              {
                duration: 500,
                easing: "cubic-bezier(0.4, 0, 0.15, 1)",
                pseudoElement: "::view-transition-new(root)",
              }
            );
          })
          .catch(() => {});
        return;
      } catch {
        applyThemeToDom(nextResolvedTheme);
        setThemeState(nextTheme);
        return;
      }
    }

    // Direct synchronous application
    applyThemeToDom(nextResolvedTheme);
    setThemeState(nextTheme);
  };

  const toggleTheme = (event?: ThemeClickEvent) => {
    const modes: ThemeMode[] = ["light", "dark", "system"];
    const nextIndex = (modes.indexOf(theme) + 1) % modes.length;
    const nextMode = modes[nextIndex];
    setTheme(nextMode, event);
  };

  const setTheme = (mode: ThemeMode, event?: ThemeClickEvent) => {
    // 1. Fresh read of current system appearance
    const currentSysDark = getSystemPreference();
    setSystemIsDark(currentSysDark);

    const nextResolved: "light" | "dark" =
      mode === "system" ? (currentSysDark ? "dark" : "light") : mode;

    // 2. Synchronize native Tauri window theme
    import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) => {
        const appWindow = getCurrentWindow();
        if (appWindow && typeof appWindow.setTheme === "function") {
          // Passing null instructs Tauri to follow OS system theme
          const tauriTheme = mode === "system" ? null : mode;
          appWindow.setTheme(tauriTheme as any).catch(() => {});
        }
      })
      .catch(() => {});

    // 3. Immediately apply to DOM and state
    applyThemeToDom(nextResolved);
    setThemeState(mode);

    // 4. Run transition effect if switching between opposite visual states
    if (resolvedTheme !== nextResolved) {
      runWaveTransition(mode, nextResolved, event);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
