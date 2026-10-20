// A fake fetch: answers from a route function and records every call. Nothing leaves the process.
// Pass it to a client factory (supabase.ts `fetch` option) or any adapter that takes a fetch.

export interface RecordedCall {
  url: URL;
  method: string;
  headers: Headers;
  body: string | null;
}

export type Route = (call: RecordedCall) => Response | Promise<Response>;

export interface FakeFetch {
  fetch: typeof fetch;
  calls: RecordedCall[];
}

export function fakeFetch(route: Route): FakeFetch {
  const calls: RecordedCall[] = [];
  const fn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const req = new Request(input, init);
    const call: RecordedCall = {
      url: new URL(req.url),
      method: req.method,
      headers: req.headers,
      body: req.body ? await req.text() : null,
    };
    calls.push(call);
    return await route(call);
  };
  return { fetch: fn as typeof fetch, calls };
}

/** A JSON response for a route. */
export function jsonResponse(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  const h = new Headers(headers);
  h.set("content-type", "application/json");
  return new Response(JSON.stringify(body), { status, headers: h });
}

/** A route that fails the test if anything is fetched. */
export const noNetwork: Route = (call) => {
  throw new Error(
    `unexpected fetch in a test: ${call.method} ${call.url.origin}${call.url.pathname}`,
  );
};
