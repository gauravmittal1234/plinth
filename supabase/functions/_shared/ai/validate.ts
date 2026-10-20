// Output validation (T63; BUILD_PLAN §14 hard rule 4).
//
// A model answer is text. checkOutput() parses it as JSON and validates it against the task's
// response schema with ajv (2020-12, strict; core/validate.ts compiles it once per isolate).
// withOneRetry() runs an attempt, and when its output fails, runs exactly one more; a second
// failure is `schema_mismatch` and the output is discarded. The issue text names a path and a
// keyword, never a value, so it is safe to log.

import { compileSchema, describeIssues } from "../core/validate.ts";
import { AiError } from "./errors.ts";
import type { JsonSchema } from "./schema.ts";

export type OutputCheck =
  | { ok: true; output: unknown }
  | { ok: false; issue: string };

/** Parses the model text (or takes an already-parsed value) and validates it. */
export async function checkOutput(
  schema: JsonSchema,
  answer: { text?: string; output?: unknown },
): Promise<OutputCheck> {
  let value: unknown;
  if (answer.output !== undefined) value = answer.output;
  else {
    const text = (answer.text ?? "").trim().replace(/^```(?:json)?\s*\n([\s\S]*)\n```$/, "$1");
    if (text === "") return { ok: false, issue: "the answer is empty" };
    try {
      value = JSON.parse(text);
    } catch {
      return { ok: false, issue: "the answer is not JSON" };
    }
  }
  const validate = await compileSchema(schema);
  if (validate(value)) return { ok: true, output: value };
  return { ok: false, issue: describeIssues(validate.errors) };
}

/** The outcome of up to two attempts; `attempts` holds every raw answer, in order. */
export type Attempted<A> =
  | { ok: true; output: unknown; attempts: A[] }
  | { ok: false; error: AiError; attempts: A[] };

/**
 * Runs `attempt(n)` (n = 0, then 1) until its answer passes the schema: one retry, then a
 * schema_mismatch error (returned, so the caller can still log what the attempts cost).
 * `attempt` may throw (a provider error, a recorded miss); that error is returned the same way.
 */
export async function withOneRetry<A extends { text?: string; output?: unknown }>(
  schema: JsonSchema,
  attempt: (n: number) => Promise<A>,
  onMismatch?: (n: number, issue: string) => void,
): Promise<Attempted<A>> {
  const attempts: A[] = [];
  let issue = "";
  for (let n = 0; n < 2; n++) {
    let answer: A;
    try {
      answer = await attempt(n);
    } catch (err) {
      const error = err instanceof AiError
        ? err
        : new AiError("provider_error", "the model call failed", { cause: err });
      return { ok: false, error, attempts };
    }
    attempts.push(answer);
    const checked = await checkOutput(schema, answer);
    if (checked.ok) return { ok: true, output: checked.output, attempts };
    issue = checked.issue;
    onMismatch?.(n, issue);
  }
  const error = new AiError("schema_mismatch", `output failed the response schema twice: ${issue}`);
  return { ok: false, error, attempts };
}
