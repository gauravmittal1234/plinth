// GET /api/health (API_CONTRACTS §3.6): the synthetic-check endpoint. Owner: T05.
// Always rendered at request time, never cached, and it reveals nothing beyond
// the service name and the data mode.
import { connection } from "next/server";
import { dataMode } from "@/src/data/mode";

export async function GET() {
  await connection();
  return Response.json(
    { status: "ok", service: "plinth-web", data: dataMode() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
