"use client";

// prefers-reduced-motion, read without a hydration mismatch: the server and the
// first client render assume motion is allowed, then the real value applies.
// The CSS side needs no JavaScript: @plinth/tokens zeroes every motion duration
// under the same media query, so animations land on their final state at once.
import { useSyncExternalStore } from "react";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function query(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

function subscribe(onChange: () => void): () => void {
  const mql = query();
  if (!mql) return () => {};
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getSnapshot = (): boolean => query()?.matches ?? false;
const getServerSnapshot = (): boolean => false;

/** True when the reader asked for reduced motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
