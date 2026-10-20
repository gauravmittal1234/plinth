// Day / Night (DESIGN §3.2b, §0). Day is the default; Night is a full dark mode
// on a flat ground. @plinth/tokens keys every colour off `data-theme` on <html>
// ("day" | "night"), so switching is one attribute and no re-render.

export const THEMES = ["day", "night"] as const;
export type Theme = (typeof THEMES)[number];

export const DEFAULT_THEME: Theme = "day";
export const THEME_ATTRIBUTE = "data-theme";
export const THEME_STORAGE_KEY = "plinth-theme";

/**
 * Runs in <head> before the first paint and applies a saved Night choice, so a
 * Night reader never sees a flash of Day (Next guide: preventing flash before
 * hydration). It only ever writes "day" or "night".
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="night"||t==="day")document.documentElement.setAttribute("${THEME_ATTRIBUTE}",t)}catch(e){}})();`;

export function isTheme(value: unknown): value is Theme {
  return value === "day" || value === "night";
}

/** The theme currently on <html>. Day when unset or unknown. */
export function readTheme(root: HTMLElement = document.documentElement): Theme {
  const t = root.getAttribute(THEME_ATTRIBUTE);
  return isTheme(t) ? t : DEFAULT_THEME;
}

/** Sets the theme on <html> and remembers it for the next visit. */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  root.setAttribute(THEME_ATTRIBUTE, theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode or storage disabled: the choice lasts for this page only.
  }
}
