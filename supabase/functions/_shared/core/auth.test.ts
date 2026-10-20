import { assertEquals, assertRejects, assertThrows, fakeRequest } from "../testing/mod.ts";
import { DISPATCH_SECRET_HEADER, requireBearer, verifyDispatchSecret } from "./auth.ts";
import { EnvError, Secret } from "./env.ts";
import { HttpError } from "./errors.ts";

// Generated per run: no dispatch secret is ever written into the repo.
const SECRET = new Secret(crypto.randomUUID());

Deno.test("the right dispatch secret passes", async () => {
  const req = fakeRequest("outbox-dispatch", {
    method: "POST",
    headers: { [DISPATCH_SECRET_HEADER]: SECRET.reveal() },
  });
  await verifyDispatchSecret(req, SECRET);
});

Deno.test("a missing header is auth_required, a wrong one forbidden", async () => {
  const missing = await assertRejects(
    () => verifyDispatchSecret(fakeRequest("outbox-dispatch", { method: "POST" }), SECRET),
    HttpError,
  );
  assertEquals([missing.code, missing.status], ["auth_required", 401]);
  const wrong = await assertRejects(
    () =>
      verifyDispatchSecret(
        fakeRequest("outbox-dispatch", {
          method: "POST",
          headers: { [DISPATCH_SECRET_HEADER]: `${SECRET.reveal()}x` },
        }),
        SECRET,
      ),
    HttpError,
  );
  assertEquals([wrong.code, wrong.status], ["forbidden", 403]);
});

Deno.test("an unset secret never lets a request through", async () => {
  const req = fakeRequest("outbox-dispatch", {
    method: "POST",
    headers: { [DISPATCH_SECRET_HEADER]: "" },
  });
  await assertRejects(() => verifyDispatchSecret(req, null), EnvError, "PLINTH_DISPATCH_SECRET");
  await assertRejects(() => verifyDispatchSecret(req, new Secret("")), EnvError);
});

Deno.test("requireBearer", () => {
  assertEquals(requireBearer(fakeRequest("x", { bearer: "user-token-2" })), "user-token-2");
  const e = assertThrows(() => requireBearer(fakeRequest("x")), HttpError);
  assertEquals(e.code, "auth_required");
});
