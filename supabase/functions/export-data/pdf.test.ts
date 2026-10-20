// pdf.ts. Run: npx --yes deno@2 task test (in supabase/functions).
import { assert, assertEquals, assertMatch } from "../_shared/testing/mod.ts";
import { pdfText, renderPdf, toWinAnsi, wrap } from "./pdf.ts";

const latin1 = new TextDecoder("latin1");

Deno.test("renderPdf: a well-formed PDF 1.4 whose xref offsets point at their objects", () => {
  const bytes = renderPdf([{ text: "Your Plinth data", style: "title" }, { text: "C-1018-11" }]);
  const src = latin1.decode(bytes);
  assert(src.startsWith("%PDF-1.4\n"));
  assert(src.endsWith("%%EOF\n"));
  const startxref = Number(/startxref\n(\d+)\n%%EOF\n$/.exec(src)![1]);
  assert(src.slice(startxref).startsWith("xref\n"));
  const rows = src.slice(startxref).split("\n").slice(3).filter((l) => / n $/.test(l));
  rows.forEach((row, i) => {
    const at = Number(row.slice(0, 10));
    assert(src.slice(at).startsWith(`${i + 1} 0 obj\n`), `object ${i + 1} at its xref offset`);
  });
  for (const m of src.matchAll(/<< \/Length (\d+) >>\nstream\n/g)) {
    const start = m.index! + m[0].length;
    assertEquals(src.slice(start + Number(m[1]), start + Number(m[1]) + 10), "\nendstream");
  }
});

Deno.test("renderPdf: the text reads back, house dashes and masked-number bullets included", () => {
  const text = pdfText(renderPdf([{ text: "Phone: +91 99••• ••318 · quiet 22:00–08:00" }]));
  assertEquals(text[0], "Phone: +91 99••• ••318 · quiet 22:00–08:00");
});

Deno.test("toWinAnsi: ₹ becomes Rs, unknown scripts become ?, control characters go", () => {
  assertEquals(String.fromCharCode(...toWinAnsi("₹1.95 Cr")), "Rs 1.95 Cr");
  assertEquals(String.fromCharCode(...toWinAnsi("घर")), "??");
  assertEquals(String.fromCharCode(...toWinAnsi("a\u0007b")), "ab");
});

Deno.test("wrap: long lines break on spaces; very long words are cut", () => {
  const lines = wrap(`${"word ".repeat(40)}${"x".repeat(200)}`, 10);
  assert(lines.length > 3);
  for (const l of lines) assert(l.length <= 87, `line of ${l.length} characters`);
});

Deno.test("renderPdf: many lines run onto more pages, each with 'page N of M'", () => {
  const lines = Array.from({ length: 150 }, (_, i) => ({ text: `Line ${i + 1}` }));
  const text = pdfText(renderPdf(lines, "Plinth · Your data"));
  const footers = text.filter((t) => t.startsWith("Plinth · Your data · page "));
  assert(footers.length >= 3);
  assertMatch(footers[0]!, new RegExp(`page 1 of ${footers.length}$`));
  assert(text.includes("Line 150"));
});
