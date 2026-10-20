// WebAbout's own read (T25; AGENTS.md "pages import only from @/src/data").
import "server-only";
import { about } from "@/src/data";
import type { About } from "@/src/data";

export async function loadAboutData(): Promise<About> {
  return about();
}
