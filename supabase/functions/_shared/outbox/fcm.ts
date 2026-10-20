// FCM HTTP v1 push (T42; copied and adapted from pet_app's supabase/functions/_shared/fcm.ts,
// AGENTS.md §4). Messages are always data-only (buildFcmMessage in outbox-dispatch/logic.ts never
// sets `notification`): the app wakes on the data payload and routes from `data.deep_link`
// (BUILD_PLAN §13, §5.3 "push ... wrapped so the app always opens").
//
//   const send = fcmSender(env.fcmServiceAccount?.reveal() ?? null);
//   await send(deviceToken, message);    // "ok" | "gone" (drop the token) | "error" | "not_configured"
//
// FCM_SERVICE_ACCOUNT (a Firebase service-account JSON) is read by the caller (index.ts) via
// readSecret, never here directly — this file never touches Deno.env (AGENTS.md §6, testability).

export interface FcmServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

/** Parses FCM_SERVICE_ACCOUNT's JSON; null for anything missing the three fields it needs. */
export function parseServiceAccount(raw: string | null | undefined): FcmServiceAccount | null {
  if (!raw) return null;
  let sa: Partial<FcmServiceAccount>;
  try {
    sa = JSON.parse(raw) as Partial<FcmServiceAccount>;
  } catch {
    return null;
  }
  if (!sa.project_id || !sa.client_email || !sa.private_key) return null;
  return { project_id: sa.project_id, client_email: sa.client_email, private_key: sa.private_key };
}

/** One FCM v1 message without its token: data-only (no `notification`). */
export interface FcmMessage {
  data: Record<string, string>;
}

export type FcmOutcome = "ok" | "gone" | "error" | "not_configured";

function b64url(data: ArrayBuffer | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface FcmSenderOptions {
  /** Injected in tests; defaults to the global fetch. */
  fetch?: typeof fetch;
}

/** A sender bound to one service account (or none: every call then answers "not_configured"). */
export function fcmSender(
  serviceAccountJson: string | null | undefined,
  opts: FcmSenderOptions = {},
): (token: string, message: FcmMessage) => Promise<FcmOutcome> {
  const sa = parseServiceAccount(serviceAccountJson);
  const fetchImpl = opts.fetch ?? fetch;
  let cached: { token: string; exp: number } | null = null;

  async function accessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (cached && cached.exp - 60 > now) return cached.token;
    const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const claims = b64url(
      JSON.stringify({
        iss: sa!.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      }),
    );
    const pem = sa!.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
    const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "pkcs8",
      der,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(`${header}.${claims}`),
    );
    const res = await fetchImpl("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${header}.${claims}.${b64url(sig)}`,
      }),
    });
    if (!res.ok) throw new Error(`fcm oauth ${res.status}`);
    const payload = await res.json() as { access_token: string; expires_in?: number };
    cached = { token: payload.access_token, exp: now + (payload.expires_in ?? 3600) };
    return cached.token;
  }

  return async (token, message) => {
    if (!sa) return "not_configured";
    try {
      const res = await fetchImpl(
        `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${await accessToken()}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({ message: { token, ...message } }),
        },
      );
      if (res.ok) return "ok";
      const body = await res.text();
      if (res.status === 404 || body.includes("UNREGISTERED")) return "gone";
      return "error";
    } catch {
      // The OAuth exchange failed, or the network is unreachable: the caller retries later.
      return "error";
    }
  };
}
