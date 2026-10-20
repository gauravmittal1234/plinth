import { assertEquals, assertRejects, assertThrows } from "../testing/mod.ts";
import { AiError } from "./errors.ts";
import { fileManifestLoader, fileRecordedStore, parseManifest, parseRecorded } from "./recorded.ts";

const TESTDATA = new URL("./testdata/", import.meta.url);
const TOY_SHA = "ab".repeat(32);

Deno.test("fileRecordedStore reads <dir>/<sha>.json and answers null for a miss", async () => {
  const store = fileRecordedStore(TESTDATA);
  const hit = await store.get("recorded/extract.toy", TOY_SHA);
  assertEquals(hit?.attempts[0]?.output, { label: "flyer" });
  assertEquals(await store.get("recorded/extract.toy", "cd".repeat(32)), null);
  assertEquals(await store.get("recorded/extract.toy", "not-a-sha"), null);
  const e = await assertRejects(() => store.get("../outside", TOY_SHA), AiError);
  assertEquals(e.aiCode, "config");
});

Deno.test("parseRecorded refuses files that are not plinth.ai_recorded/1", () => {
  assertThrows(() => parseRecorded({ format: "x" }, "f"), AiError);
  assertThrows(
    () =>
      parseRecorded({
        format: "plinth.ai_recorded/1",
        task: "t@1",
        prompt_version: "v1",
        input_sha256: TOY_SHA,
        attempts: [],
      }, "f"),
    AiError,
  );
});

Deno.test("the manifest lists file and page SHAs; a non-fictional file is never allowed", async () => {
  const shas = await fileManifestLoader(new URL("manifest.json", TESTDATA))();
  assertEquals([...shas].sort(), ["1".repeat(64), "3".repeat(64)]);
  assertThrows(() => parseManifest({ format: "plinth.sample_docs/1", files: [{ sha256: "xyz" }] }));
  assertThrows(() => parseManifest({ files: [] }));
});

Deno.test("no manifest file yet (before T62) allows nothing on the free tier", async () => {
  const shas = await fileManifestLoader(new URL("no-such-manifest.json", TESTDATA))();
  assertEquals(shas.size, 0);
});
