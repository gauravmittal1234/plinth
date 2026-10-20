// GET /.well-known/assetlinks.json (API_CONTRACTS §3.6): Android App Links, so
// plinth.in links open the app. Owner: T05. Read at request time, so a new
// signing key needs an env change, not a rebuild.
import { connection } from "next/server";
import { assetLinks, parseFingerprints } from "@/src/server/assetlinks";

export async function GET() {
  await connection();
  const body = assetLinks(parseFingerprints(process.env.ANDROID_SHA256_CERT_FINGERPRINTS));
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
