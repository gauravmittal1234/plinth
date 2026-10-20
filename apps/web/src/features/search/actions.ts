"use server";

// The one write WebSearch needs (api.request_project), reached from a client
// component through a Server Action: `@/src/data` is `server-only`, so the
// request form can't call it directly.
import { isDataError, requestProject } from "@/src/data";

export type RequestProjectResult = { ok: true; ref: string } | { ok: false; code: string };

export async function requestProjectAction(
  name: string,
  rera: string | null,
): Promise<RequestProjectResult> {
  try {
    // API_CONTRACTS §3.2: api.request_project(p_name, p_rera) → R-MMDD-NN.
    const ref = await requestProject(name, rera);
    return typeof ref === "string" ? { ok: true, ref } : { ok: false, code: "bad_response" };
  } catch (e) {
    if (isDataError(e)) return { ok: false, code: e.code };
    throw e;
  }
}
