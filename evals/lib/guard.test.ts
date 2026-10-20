import { assertEquals } from "../../supabase/functions/_shared/testing/mod.ts";
import { offendingLines, scanWorkflows } from "./guard.ts";

Deno.test("guard: live, expressions and shell assignments offend; recorded and comments do not", () => {
  const yml = [
    "env:",
    "  AI_MODE: recorded",
    "  # AI_MODE: live (commented out)",
    "      - run: AI_MODE=live npm test",
    "        env:",
    "          AI_MODE: 'live'",
    "          AI_MODE: ${{ inputs.mode }}",
    "      - run: export AI_MODE=recorded",
  ].join("\n");
  assertEquals(offendingLines("x.yml", yml).map((o) => o.line), [4, 6, 7]);
});

Deno.test("guard: the repo's workflows set live AI only in nightly.yml", async () => {
  assertEquals(await scanWorkflows(), []);
});
