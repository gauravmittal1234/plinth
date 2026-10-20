// Contract checks with ajv (BUILD_PLAN §5.2: "ajv validates responses against
// contract schemas in dev and test"). Arguments are checked too where the
// contract has a *Request type, so a page bug fails here with the same code
// the server would give (invalid_input).
//
// The standalone validators are about 1 MB (INTEGRATION_NOTES): they load
// lazily, in development and tests only, and never in a production build
// (the `NODE_ENV` test below is inlined at build time, so the import is
// dropped). Production relies on the API's own contract tests (T12/T13).
import "server-only";
import type { ErrorObject } from "ajv";
import { DataError } from "./errors";
import { apiFunction, type RpcArgs, type RpcName } from "./registry";

type ValidatorsModule = typeof import("@plinth/contracts/validators");

let validators: Promise<ValidatorsModule> | null = null;

function loadValidators(): Promise<ValidatorsModule> {
  // Folded at build time: a production bundle has no path to the validators.
  if (process.env.NODE_ENV === "production") {
    return Promise.reject(new Error("Contract checks are off in production."));
  }
  validators ??= import("@plinth/contracts/validators");
  return validators;
}

/** One line per broken rule, for logs and test output. */
export function formatErrors(errors: readonly ErrorObject[] | null | undefined): string {
  if (!errors?.length) return "invalid";
  return errors
    .slice(0, 5)
    .map((e) => `${e.instancePath || "/"} ${e.message ?? e.keyword}`)
    .join("; ");
}

/** Rejects with invalid_input when the arguments break the function's *Request contract. */
export async function checkRequest(rpc: RpcName, args: RpcArgs): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  const name = apiFunction(rpc).request;
  if (!name) return;
  const { VALIDATORS } = await loadValidators();
  const validate = VALIDATORS[name];
  if (!validate(args)) {
    throw new DataError(
      "invalid_input",
      rpc,
      `api.${rpc} arguments break the ${name} contract: ${formatErrors(validate.errors)}`,
    );
  }
}

/** Rejects with bad_response when a payload breaks the function's response contract. */
export async function checkResponse(rpc: RpcName, payload: unknown): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  const name = apiFunction(rpc).returns;
  if (!name) return;
  const { VALIDATORS } = await loadValidators();
  const validate = VALIDATORS[name];
  if (!validate(payload)) {
    throw new DataError(
      "bad_response",
      rpc,
      `api.${rpc} returned a payload that breaks the ${name} contract: ${formatErrors(validate.errors)}`,
    );
  }
}
