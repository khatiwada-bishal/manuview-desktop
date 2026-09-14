/**
 * Application startup, theme initialization, and desktop splash screen management.
 * Extracted from index.html inline scripts to strictly adhere to Content Security Policy
 * (CSP: script-src 'self' without 'unsafe-inline').
 */

if (typeof window !== "undefined") {
  // Capability check: detect if running in native Tauri desktop container
  (window as any).__IS_DESKTOP__ = Boolean(
    (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__
  );

  // Initialize theme mode
  try {
    const sessionTheme = sessionStorage.getItem("manuview_theme_mode");
    if (sessionTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  } catch {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
  }

  // Setup splash screen
  const isDesktop = (window as any).__IS_DESKTOP__;
  const splash = document.getElementById("app-splash");

  if (!isDesktop) {
    if (splash) splash.remove();
  } else {
    if (splash) splash.style.display = "flex";
    document.body.classList.add("overflow-hidden", "select-none");

    const vid = document.getElementById("intro-video") as HTMLVideoElement | null;
    const skip = document.getElementById("intro-skip") as HTMLButtonElement | null;
    if (vid) {
      vid.autoplay = true;
      vid.muted = false;
      vid.volume = 1.0;
      const playPromise = vid.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          vid.muted = true;
          vid.play().catch(() => {});
          const unmute = () => {
            vid.muted = false;
            document.removeEventListener("pointerdown", unmute);
            document.removeEventListener("keydown", unmute);
          };
          document.addEventListener("pointerdown", unmute);
          document.addEventListener("keydown", unmute);
        });
      }
      vid.addEventListener("ended", () => {
        if ((window as any).__dismissSplash) (window as any).__dismissSplash(true);
      });
    }
    if (skip) {
      skip.addEventListener("click", (e) => {
        e.stopPropagation();
        if ((window as any).__dismissSplash) (window as any).__dismissSplash(true);
      });
    }
  }
}
