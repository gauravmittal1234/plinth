// Regenerates BricolageGrotesque-Display.ttf from the brand's variable font
// (apps/mobile/assets/fonts/bricolage-grotesque/BricolageGrotesque-Variable.ttf).
//
// next/og's bundled font parser (next/dist/compiled/@vercel/og, a trimmed
// opentype.js) throws `Cannot read properties of undefined (reading '256')`
// in parseFvarAxis on this file: it reads the font's `name` table to label
// each fvar axis (nameID 256+) but doesn't have that table parsed yet at
// that point, for this font. This strips the variable-font tables
// (fvar/gvar/avar/STAT/HVAR/MVAR/cvar) so the file loads as the plain static
// font satori actually needs (the cards use one weight, never animate the
// axis) — same glyph outlines, same look, just without the table the parser
// trips on. Re-run after the source TTF changes:
//   node strip-variable-tables.mjs \
//     ../../../../../../mobile/assets/fonts/bricolage-grotesque/BricolageGrotesque-Variable.ttf \
//     BricolageGrotesque-Display.ttf
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
const buf = readFileSync(inPath);

const DROP = new Set(["fvar", "gvar", "avar", "STAT", "HVAR", "MVAR", "cvar"]);

const numTables = buf.readUInt16BE(4);
const tables = [];
for (let i = 0; i < numTables; i++) {
  const recOffset = 12 + i * 16;
  const tag = buf.toString("ascii", recOffset, recOffset + 4);
  const offset = buf.readUInt32BE(recOffset + 8);
  const length = buf.readUInt32BE(recOffset + 12);
  tables.push({ tag, data: buf.subarray(offset, offset + length) });
}

const kept = tables.filter((t) => !DROP.has(t.tag));
console.log(
  "Dropping:",
  tables.filter((t) => DROP.has(t.tag)).map((t) => t.tag),
);
console.log("Keeping", kept.length, "of", tables.length, "tables");

// Table directory must be sorted by tag for a well-formed sfnt.
kept.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

function pad4(n) {
  return (n + 3) & ~3;
}

function checksum(data) {
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const b0 = data[i] ?? 0;
    const b1 = data[i + 1] ?? 0;
    const b2 = data[i + 2] ?? 0;
    const b3 = data[i + 3] ?? 0;
    sum = (sum + ((b0 << 24) | (b1 << 16) | (b2 << 8) | b3)) >>> 0;
  }
  return sum >>> 0;
}

const n = kept.length;
let searchRange = 1;
let entrySelector = 0;
while (searchRange * 2 <= n) {
  searchRange *= 2;
  entrySelector++;
}
searchRange *= 16;
const rangeShift = n * 16 - searchRange;

const headerSize = 12 + n * 16;
let dataOffset = headerSize;
const layout = kept.map((t) => {
  const start = dataOffset;
  dataOffset += pad4(t.data.length);
  return { ...t, start };
});

const out = Buffer.alloc(dataOffset);
out.writeUInt32BE(0x00010000, 0); // version 1.0
out.writeUInt16BE(n, 4);
out.writeUInt16BE(searchRange, 6);
out.writeUInt16BE(entrySelector, 8);
out.writeUInt16BE(rangeShift, 10);

layout.forEach((t, i) => {
  const recOffset = 12 + i * 16;
  out.write(t.tag, recOffset, "ascii");
  out.writeUInt32BE(checksum(t.data), recOffset + 4);
  out.writeUInt32BE(t.start, recOffset + 8);
  out.writeUInt32BE(t.data.length, recOffset + 12);
  t.data.copy(out, t.start);
});

writeFileSync(outPath, out);
console.log("Wrote", outPath, out.length, "bytes");
