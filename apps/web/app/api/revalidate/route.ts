// POST /api/revalidate (API_CONTRACTS §3.6): expires the ISR tags the outbox
// sends after a publish (src/data/tags.ts). Owner: T16.
//
//   curl -X POST /api/revalidate -H 'x-plinth-revalidate-secret: …' -d '{"tags":["phase:aurelia-heights-phase-2"]}'
//
// `{ expire: 0 }`: the next visitor gets the new band, never the old one
// (revalidateTag from a webhook, node_modules/next/dist/docs revalidateTag).
import { revalidateTag } from "next/cache";
import { checkRevalidate } from "@/src/data/revalidate";

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const check = await checkRevalidate(request);
  if (!check.ok) {
    return Response.json(
      { error: { code: check.code, message: check.message } },
      { status: check.status, headers: NO_STORE },
    );
  }
  for (const tag of check.tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: check.tags }, { headers: NO_STORE });
}
