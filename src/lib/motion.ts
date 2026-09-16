import { useState, useEffect } from "react";

/**
 * Standard Motion Tokens
 * Fast, purposeful, and GPU-friendly durations and cubic-bezier easings.
 */
export const DURATION = {
  instant: 100, // micro toggles, checkbox
  fast: 150,    // tooltips, button hover, icon micro-interactions
  base: 220,    // cards, accordion, tab indicator
  slow: 320,    // modals, drawers, major view transitions
  ambient: 600, // progress bars, chart draw-in sweeps
} as const;

export const EASING = {
  // Standard curve for elements moving on-screen
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  // Decelerate curve for elements entering the screen
  decelerate: "cubic-bezier(0, 0, 0, 1)",
  // Tactile spring curve for micro accents
  spring: "cubic-bezier(0.34, 1.45, 0.64, 1)",
} as const;

/**
 * Hook to detect whether the user has requested reduced motion.
 * Respects system accessibility preferences and dynamically responds to changes.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  return prefersReducedMotion;
}

export interface UseCountUpOptions {
  end: number;
  start?: number;
  duration?: number; // ms, defaults to 400ms
  decimals?: number;
  enabled?: boolean;
}

/**
 * Animates a numeric value from start to end using ease-out interpolation.
 * Automatically completes instantly if prefers-reduced-motion is active.
 */
export function useCountUp({
  end,
  start = 0,
  duration = 400,
  decimals = 0,
  enabled = true,
}: UseCountUpOptions): number {
  const reducedMotion = usePrefersReducedMotion();
  const [value, setValue] = useState<number>(() => (reducedMotion || !enabled ? end : start));

  useEffect(() => {
    if (reducedMotion || !enabled || duration <= 0) {
      setValue(end);
      return;
    }

    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic formula: 1 - (1 - t)^3
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * easeOut;

      const factor = Math.pow(10, decimals);
      setValue(Math.round(current * factor) / factor);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, start, duration, decimals, enabled, reducedMotion]);

  return value;
}
