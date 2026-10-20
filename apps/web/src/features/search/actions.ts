"use server";

// The one write WebSearch needs (api.request_project), reached from a client
// component through a Server Action: `@/src/data` is `server-only`, so the
// request form can't call it directly.
import { isDataError, requestProject } from "@/src/data";

export type RequestProjectResult = { ok: true } | { ok: false; code: string };

export async function requestProjectAction(
  name: string,
  rera: string | null,
): Promise<RequestProjectResult> {
  try {
    await requestProject(name, rera);
    return { ok: true };
  } catch (e) {
    if (isDataError(e)) return { ok: false, code: e.code };
    throw e;
  }
}
