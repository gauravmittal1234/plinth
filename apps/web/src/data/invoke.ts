// One api.* call through the active adapter, with the contract checks around
// it (dev and test). No Next.js APIs here: cache.ts adds caching, index.ts
// decides what is cached.
import "server-only";
import type { DataMode } from "./mode";
import type { RpcArgs, RpcName } from "./registry";
import { checkRequest, checkResponse } from "./validate";

export type InvokeOptions = {
  /** A design-state fixture key (fixture mode only, see types.ts FixtureState). */
  readonly fixtureState?: string | null;
};

export async function invoke(
  mode: DataMode,
  rpc: RpcName,
  args: RpcArgs,
  options: InvokeOptions = {},
): Promise<unknown> {
  await checkRequest(rpc, args);
  const payload = await adapterCall(mode, rpc, args, options.fixtureState ?? null);
  await checkResponse(rpc, payload);
  return payload;
}

/**
 * Each adapter loads only in its own mode: a fixture server never starts a
 * Supabase client, and a live server never reads the fixtures.
 */
async function adapterCall(
  mode: DataMode,
  rpc: RpcName,
  args: RpcArgs,
  fixtureState: string | null,
): Promise<unknown> {
  if (mode === "fixtures") {
    const { fixtureCall } = await import("./adapters/fixtures");
    return fixtureCall(rpc, args, fixtureState);
  }
  const { supabaseCall } = await import("./adapters/supabase");
  return supabaseCall(rpc, args);
}
