"use server";

// The one write WebSearch needs (api.request_project), reached from a client
// component through a Server Action: `@/src/data` is `server-only`, so the
// request form can't call it directly.
import { isDataError, requestProject } from "@/src/data";

export type RequestProjectResult =
  | { ok: true; ref: string; line: string | null }
  | { ok: false; code: string };

export async function requestProjectAction(
  name: string,
  rera: string | null,
): Promise<RequestProjectResult> {
  try {
    // API_CONTRACTS §3.2: api.request_project(p_name, p_rera) → R-MMDD-NN.
    // plinth.request_project/1 (T45a): { ref: "R-MMDD-NN", line: the server's own promise, ... }.
    const out = (await requestProject(name, rera)) as unknown;
    if (out && typeof out === "object" && typeof (out as { ref?: unknown }).ref === "string") {
      const { ref, line } = out as { ref: string; line?: unknown };
      return { ok: true, ref, line: typeof line === "string" ? line : null };
    }
    return { ok: false, code: "bad_response" };
  } catch (e) {
    if (isDataError(e)) return { ok: false, code: e.code };
    throw e;
  }
}
