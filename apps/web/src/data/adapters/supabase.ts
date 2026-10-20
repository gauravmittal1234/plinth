// The supabase adapter (PLINTH_DATA=supabase): `supabase.schema("api").rpc(fn, args)`
// (API_CONTRACTS §1 "Transport"). PostgREST receives POST /rest/v1/rpc/<fn>
// with `Content-Profile: api` and the `p_` args as the JSON body. Public reads
// use the publishable key with no session; the buyer API uses the session in
// this request's cookies. Errors become DataErrors (errors.ts).
import "server-only";
import { publicClient, sessionClient } from "@/src/lib/supabase/server";
import { DataError, fromPostgrestError } from "../errors";
import { apiFunction, type RpcArgs, type RpcName } from "../registry";

export async function supabaseCall(rpc: RpcName, args: RpcArgs): Promise<unknown> {
  const client = apiFunction(rpc).audience === "anon" ? publicClient() : await sessionClient();
  let response: { data: unknown; error: unknown; status: number };
  try {
    response = await client.schema("api").rpc(rpc, args);
  } catch (e) {
    throw new DataError(
      "unavailable",
      rpc,
      `api.${rpc} could not be reached: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  if (response.error) {
    throw fromPostgrestError(
      rpc,
      response.error as Parameters<typeof fromPostgrestError>[1],
      response.status,
    );
  }
  return response.data;
}
