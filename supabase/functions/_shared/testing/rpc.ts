// A fake RpcClient (core/supabase.ts) answering api.* calls from a table, recording each call.

import type { PostgrestErrorLike } from "../core/errors.ts";
import type { RpcBuilder, RpcClient, RpcResult } from "../core/supabase.ts";

export interface RpcCall {
  fn: string;
  args: Record<string, unknown>;
  get: boolean;
}

/** An answer: data, a PostgREST error ({ error }), or a function of the call. */
export type RpcAnswer =
  | { data: unknown }
  | { error: PostgrestErrorLike }
  | ((call: RpcCall) => RpcResult | Promise<RpcResult>);

export interface FakeRpc extends RpcClient {
  calls: RpcCall[];
}

export function fakeRpc(answers: Record<string, RpcAnswer>): FakeRpc {
  const calls: RpcCall[] = [];
  return {
    calls,
    rpc(fn, args = {}, options): RpcBuilder {
      const call: RpcCall = { fn, args, get: options?.get === true };
      calls.push(call);
      const answer = answers[fn];
      const result = (async (): Promise<RpcResult> => {
        if (!answer) {
          return {
            data: null,
            error: { code: "PGRST202", message: `Could not find the function api.${fn}` },
          };
        }
        if (typeof answer === "function") return await answer(call);
        if ("error" in answer) return { data: null, error: answer.error };
        return { data: answer.data, error: null };
      })();
      return { then: result.then.bind(result) };
    },
  };
}
