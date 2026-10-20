"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";
import { DEFAULT_THEME, THEME_ATTRIBUTE, applyTheme, readTheme, type Theme } from "./theme";

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: [THEME_ATTRIBUTE],
  });
  return () => observer.disconnect();
}

const getServerTheme = (): Theme => DEFAULT_THEME;

/**
 * The Night toggle in the header. A toggle button (aria-pressed) with one fixed
 * name, so screen readers hear "Night theme, toggle button, pressed/not pressed".
 * It reads the theme from <html>, which the head script set before paint, so
 * the icon is right on hydration without a mismatch.
 */
export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerTheme);
  const night = theme === "night";
  return (
    <button
      type="button"
      aria-pressed={night}
      aria-label="Night theme"
      onClick={() => applyTheme(night ? "day" : "night")}
      className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-pill bg-track text-ink transition-transform duration-150 ease-out active:scale-[0.97]"
    >
      {night ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
