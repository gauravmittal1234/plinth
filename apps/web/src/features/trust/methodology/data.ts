// WebMethodology's own read (T25; AGENTS.md "pages import only from @/src/data").
import "server-only";
import { methodology } from "@/src/data";
import type { Methodology } from "@/src/data";

export async function loadMethodologyData(): Promise<Methodology> {
  return methodology();
}
