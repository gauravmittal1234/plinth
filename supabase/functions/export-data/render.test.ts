// export-data/render: the PDF lines read from plinth.data_export/1 (lead, T59 PR #89 nits: the
// project name printed twice, and "Joined" printed a load date). Run: npx --yes deno@2 task test.
import { assertEquals } from "../_shared/testing/mod.ts";
import type { ExportPayload } from "./render.ts";
import { exportPdfLines, place } from "./render.ts";

function payload(over: Record<string, unknown> = {}): ExportPayload {
  return {
    schema: "plinth.data_export/1",
    request_id: "00000000-0000-4000-8000-0000000053a1",
    generated_at: "2026-10-18T12:00:00+05:30",
    ...over,
  };
}

const texts = (p: ExportPayload) => exportPdfLines(p).map((l) => l.text);

Deno.test("place: a phase named after its project prints once; a bare phase name keeps the project", () => {
  assertEquals(place("Test Towers", "Test Towers, Phase 2"), "Test Towers, Phase 2");
  assertEquals(place("Test Towers", "test towers, Phase 2"), "test towers, Phase 2");
  assertEquals(place("Test Towers", "Phase 2"), "Test Towers, Phase 2");
  assertEquals(place("Test Towers", ""), "Test Towers");
  assertEquals(place(null, "Phase 2"), "Phase 2");
});

Deno.test("the PDF names a followed phase and a note's phase once", () => {
  const lines = texts(payload({
    follows: [{ project: "Test Towers", phase: "Test Towers, Phase 2", follow_type: "watching" }],
    family: {
      notes: [{
        project: "Test Towers",
        phase: "Test Towers, Phase 2",
        body: "A dated note.",
        written_on: "2026-10-12",
      }],
    },
  }));
  const follow = lines.find((l) => l.startsWith("Test Towers"));
  assertEquals(follow, "Test Towers, Phase 2 · watching");
  assertEquals(lines.some((l) => l.includes("Test Towers, Test Towers")), false);
  assertEquals(lines.includes("12 Oct 2026, Test Towers, Phase 2: A dated note."), true);
});

Deno.test('"Joined" is printed from account.joined_on, and left out when the payload has none', () => {
  const joined = texts(payload({ account: { first_name: "Test", joined_on: "2026-07-01" } }));
  assertEquals(joined.includes("Joined 1 Jul 2026"), true);
  const none = texts(payload({ account: { first_name: "Test", joined_on: null } }));
  assertEquals(none.some((l) => l.startsWith("Joined")), false);
});
