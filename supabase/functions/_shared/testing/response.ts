// Response assertions shared by function tests.

import { ERROR_STATUS } from "../core/errors.ts";
import type { EdgeErrorCode } from "../core/errors.ts";
import { assertEquals, assertMatch } from "./deps.ts";

/** The response body parsed as JSON, after checking the content type. */
export async function readBody<T = unknown>(res: Response): Promise<T> {
  assertMatch(res.headers.get("content-type") ?? "", /^application\/json\b/);
  return await res.json() as T;
}

/** Asserts the contract error shape, the code and the code's status; returns the message. */
export async function assertApiError(res: Response, code: EdgeErrorCode): Promise<string> {
  assertEquals(res.status, ERROR_STATUS[code], `status for ${code}`);
  const body = await readBody<{ error: { code: string; message: string } }>(res);
  assertEquals(Object.keys(body), ["error"]);
  assertEquals(Object.keys(body.error).sort(), ["code", "message"]);
  assertEquals(body.error.code, code);
  return body.error.message;
}
