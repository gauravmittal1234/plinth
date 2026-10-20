// `/sign-in?next=` (WORK_BREAKDOWN §2.1): where to return to once signed in.
// A project's Follow button links here with
// `?next=/gurugram/projects/<slug>` (src/features/project/sections/hero);
// an account page (e.g. /following) links here with its own path once its
// own session check needs one. `next` is a redirect target a reader can put
// anything into, so it is treated as untrusted input, never as a trusted URL.
import type { Slug } from "@/src/data";

const PROJECT_PATH_RE = /^\/gurugram\/projects\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:[/?#].*)?$/;

/** The first value of a (possibly repeated) query param. */
function firstValue(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && v.length > 0 ? v : null;
}

/**
 * `next` reduced to a same-origin path, or "/" when it is missing, empty or
 * points off-site (an open-redirect guard: no scheme, no `//host`, no
 * backslash tricks a browser would still treat as a host boundary).
 */
export function safeNextPath(next: string | string[] | undefined): string {
  const raw = firstValue(next);
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || /^\/[\\]/.test(raw)) return "/";
  try {
    const url = new URL(raw, "https://plinth.invalid");
    if (url.origin !== "https://plinth.invalid") return "/";
    return `${url.pathname}${url.search}${url.hash}` || "/";
  } catch {
    return "/";
  }
}

/** The project slug `next` names, when it is a project page path, else null. */
export function projectSlugFromNext(next: string): Slug | null {
  const m = PROJECT_PATH_RE.exec(next);
  return m ? (m[1] as Slug) : null;
}
