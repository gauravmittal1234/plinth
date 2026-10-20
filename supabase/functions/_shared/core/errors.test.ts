import { assertApiError, assertEquals, assertNotMatch } from "../testing/mod.ts";
import {
  DEFAULT_MESSAGE,
  ERROR_STATUS,
  fromRpcError,
  HttpError,
  isEdgeErrorCode,
} from "./errors.ts";
import { errorResponse } from "./http.ts";
import { checkContract } from "./validate.ts";

const CONTRACTS = new URL("../../../../packages/contracts/", import.meta.url);
const errorSchema = JSON.parse(
  await Deno.readTextFile(new URL("schemas/error.schema.json", CONTRACTS)),
);

Deno.test("codes and statuses match the contract (error.schema.json)", () => {
  const codes: string[] = errorSchema.$defs.ApiErrorCode.enum;
  assertEquals(
    Object.keys(ERROR_STATUS).filter((c) => c !== "internal").sort(),
    [...codes].sort(),
  );
  // RpcError's if/then rules pin each code to one PT<status>.
  for (const rule of errorSchema.$defs.RpcError.allOf) {
    const code = rule.if.properties.message.const as keyof typeof ERROR_STATUS;
    const pt = rule.then.properties.code.const as string;
    assertEquals(`PT${ERROR_STATUS[code]}`, pt, code);
  }
  assertEquals(ERROR_STATUS.internal, 500);
});

Deno.test("default messages are plain sentences without banned trust words", () => {
  for (const [code, msg] of Object.entries(DEFAULT_MESSAGE)) {
    assertNotMatch(
      msg,
      /\b(safe|guaranteed|fraud|scam|avoid|unlock|seamless|get started|learn more)\b/i,
      code,
    );
    assertEquals(/[.]$/.test(msg), true, code);
  }
});

Deno.test("an HttpError renders as the contract's ApiError", async () => {
  const res = errorResponse(new HttpError("not_found", "We can't find a project at that address."));
  const message = await assertApiError(res, "not_found");
  assertEquals(message, "We can't find a project at that address.");
  checkContract("ApiError", { error: { code: "not_found", message } });
});

Deno.test("contract RPC errors keep their code and sentence", () => {
  const example = JSON.parse(
    Deno.readTextFileSync(new URL("examples/rpc_error/valid/not-found.json", CONTRACTS)),
  );
  const e = fromRpcError(example);
  assertEquals([e.code, e.status, e.message], [
    "not_found",
    404,
    "We can't find a project at that address.",
  ]);
  const limited = fromRpcError({ code: "PT429", message: "rate_limited", details: "" });
  assertEquals([limited.code, limited.message], ["rate_limited", DEFAULT_MESSAGE.rate_limited]);
});

Deno.test("anything else from PostgREST is internal, with the cause kept for the log", () => {
  const raw = { code: "PGRST202", message: "Could not find the function api.nope" };
  const e = fromRpcError(raw);
  assertEquals([e.code, e.status, e.message], ["internal", 500, DEFAULT_MESSAGE.internal]);
  assertEquals(e.cause, raw);
  assertEquals(fromRpcError({ code: "PT404", message: "made_up_code" }).code, "internal");
  assertEquals(isEdgeErrorCode("flag_off"), true);
  assertEquals(isEdgeErrorCode("toString"), false);
});

Deno.test("extra headers ride on the error response", () => {
  const res = errorResponse(
    new HttpError("rate_limited", undefined, { headers: { "retry-after": "30" } }),
  );
  assertEquals(res.headers.get("retry-after"), "30");
  assertEquals(res.status, 429);
});
