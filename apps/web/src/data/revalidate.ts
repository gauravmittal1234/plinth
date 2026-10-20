// POST /api/revalidate (API_CONTRACTS §3.6, §5.5): the outbox's revalidate job
// sends `{ "tags": [...] }` with the shared secret in `x-plinth-revalidate-secret`
// after a score publish, a correction or a flag change. This file checks the
// request; app/api/revalidate/route.ts expires the tags.
//
// Errors use the edge-function body `{ "error": { "code", "message" } }`:
//   401 auth_required  the secret header is missing or wrong (never says which)
//   422 invalid_input  the body is not { tags: [1–64 tags of tags.ts] }
//   503 flag_off       REVALIDATE_SECRET is not set here, so nothing is accepted
import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { isCacheTag, normalizeTag, type CacheTag } from "./tags";

export const REVALIDATE_SECRET_HEADER = "x-plinth-revalidate-secret";
export const MAX_TAGS = 64;

export type RevalidateCheck =
  | { ok: true; tags: CacheTag[] }
  | {
      ok: false;
      status: 401 | 422 | 503;
      code: "auth_required" | "invalid_input" | "flag_off";
      message: string;
    };

/** Constant-time comparison of two secrets of any length. */
export function sameSecret(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export async function checkRevalidate(
  request: Request,
  secret: string | undefined = process.env.REVALIDATE_SECRET,
): Promise<RevalidateCheck> {
  if (!secret) {
    return {
      ok: false,
      status: 503,
      code: "flag_off",
      message: "Revalidation is off on this server: REVALIDATE_SECRET is not set.",
    };
  }
  const given = request.headers.get(REVALIDATE_SECRET_HEADER);
  if (!given || !sameSecret(given, secret)) {
    return { ok: false, status: 401, code: "auth_required", message: "Wrong or missing secret." };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalid("The body is not JSON.");
  }
  const tags = (body as { tags?: unknown } | null)?.tags;
  if (!Array.isArray(tags) || tags.length === 0 || tags.length > MAX_TAGS) {
    return invalid(`Send { "tags": [...] } with 1 to ${MAX_TAGS} tags.`);
  }
  const unknownTags = tags.filter((t) => !isCacheTag(t));
  if (unknownTags.length > 0) {
    return invalid(`Unknown tags: ${unknownTags.slice(0, 5).map(String).join(", ")}.`);
  }
  return { ok: true, tags: [...new Set((tags as CacheTag[]).map(normalizeTag))] };
}

function invalid(message: string): RevalidateCheck {
  return { ok: false, status: 422, code: "invalid_input", message };
}
