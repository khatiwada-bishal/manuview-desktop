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
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let mediaQuery: MediaQueryList | null = null;
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemIsDark(e.matches);
    };

    try {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setSystemIsDark(mediaQuery.matches);
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handler);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(handler);
      }
    } catch {}

    // Support Tauri native window theme listener if available in desktop app
    let unlistenTauri: (() => void) | undefined;
    import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) => {
        const appWindow = getCurrentWindow();
        if (appWindow && typeof appWindow.theme === "function") {
          appWindow
            .theme()
            .then((currTheme) => {
              if (currTheme) {
                setSystemIsDark(currTheme === "dark");
              }
            })
            .catch(() => {});
        }
        if (appWindow && typeof appWindow.onThemeChanged === "function") {
          appWindow
            .onThemeChanged(({ payload: newTheme }) => {
              setSystemIsDark(newTheme === "dark");
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
          mediaQuery.removeEventListener("change", handler);
        } else if ((mediaQuery as any).removeListener) {
          (mediaQuery as any).removeListener(handler);
        }
      }
      if (unlistenTauri) {
        unlistenTauri();
      }
    };
  }, []);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemIsDark ? "dark" : "light") : theme;

  const isTransitioningRef = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      sessionStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme, resolvedTheme]);

  const runWaveTransition = (nextTheme: ThemeMode, nextResolvedTheme: "light" | "dark", event?: ThemeClickEvent) => {
    if (typeof document === "undefined") return;

    if (isTransitioningRef.current) return;

    // Check accessibility preference for reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || resolvedTheme === nextResolvedTheme) {
      setThemeState(nextTheme);
      return;
    }

    // Determine the wave's origin point (defaulting to bottom-left sidebar area if clicked there)
    const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    const x =
      event && typeof event.clientX === "number" && event.clientX > 0
        ? event.clientX
        : 32;
    const y =
      event && typeof event.clientY === "number" && event.clientY > 0
        ? event.clientY
        : windowHeight - 32;

    const endRadius = Math.hypot(
      Math.max(x, windowWidth - x),
      Math.max(y, windowHeight - y)
    );

    const doc = document as Document & {
      startViewTransition?: (callback: () => void) => {
        ready: Promise<void>;
        finished: Promise<void>;
      };
    };

    // 1. Native View Transitions API
    if (typeof doc.startViewTransition === "function") {
      isTransitioningRef.current = true;

      const transition = doc.startViewTransition(() => {
        flushSync(() => {
          const root = document.documentElement;
          if (nextResolvedTheme === "dark") {
            root.classList.add("dark");
            root.style.colorScheme = "dark";
          } else {
            root.classList.remove("dark");
            root.style.colorScheme = "light";
          }
          setThemeState(nextTheme);
        });
      });

      transition.ready
        .then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ];

          document.documentElement.animate(
            {
              clipPath: clipPath,
            },
            {
              duration: 1000,
              easing: "cubic-bezier(0.4, 0, 0.15, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {})
        .finally(() => {
          transition.finished.finally(() => {
            isTransitioningRef.current = false;
          });
        });
      return;
    }

    // 2. High-Fidelity Wave Overlay Fallback
    isTransitioningRef.current = true;
    const overlay = document.createElement("div");
    overlay.className = "theme-water-wave-fallback";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.zIndex = "999999";
    overlay.style.pointerEvents = "none";
    overlay.style.backgroundColor = nextResolvedTheme === "dark" ? "#080B11" : "#FFFFFF";
    overlay.style.clipPath = `circle(0px at ${x}px ${y}px)`;
    overlay.style.transition = "clip-path 1000ms cubic-bezier(0.4, 0, 0.15, 1)";
    document.body.appendChild(overlay);

    void overlay.offsetHeight;
    overlay.style.clipPath = `circle(${endRadius}px at ${x}px ${y}px)`;

    setTimeout(() => {
      setThemeState(nextTheme);
      setTimeout(() => {
        overlay.remove();
        isTransitioningRef.current = false;
      }, 50);
    }, 980);
  };

  const toggleTheme = (event?: ThemeClickEvent) => {
    const modes: ThemeMode[] = ["light", "dark", "system"];
    const nextIndex = (modes.indexOf(theme) + 1) % modes.length;
    const nextMode = modes[nextIndex];
    setTheme(nextMode, event);
  };

  const setTheme = (mode: ThemeMode, event?: ThemeClickEvent) => {
    if (mode === theme) return;
    const nextResolved = mode === "system" ? (systemIsDark ? "dark" : "light") : mode;
    runWaveTransition(mode, nextResolved, event);
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
