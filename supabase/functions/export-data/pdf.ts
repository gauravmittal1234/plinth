// A small text-only PDF writer for the readable half of the DPDP export (DESIGN §5b "a readable
// PDF"). A4 pages, Helvetica and Helvetica-Bold (two of the 14 standard fonts, so nothing is
// embedded), WinAnsi text written as hex strings, simple word wrap, "page N of M" footers.
//
// WinAnsi covers English, the house dashes and the bullets in a masked number; anything outside
// it is transliterated (₹ → "Rs") or shown as "?". The JSON file in the same ZIP keeps the exact
// text, so nothing is lost; the PDF says so on its first page.

import type { Bytes } from "../_shared/core/crypto.ts";

export type PdfStyle = "title" | "heading" | "body" | "muted";

export interface PdfLine {
  text: string;
  style?: PdfStyle;
  /** Extra points of space above the line. */
  gap?: number;
}

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 56;
const FOOTER_Y = 32;

const STYLES: Readonly<Record<PdfStyle, { font: "F1" | "F2"; size: number; lead: number }>> = {
  title: { font: "F2", size: 18, lead: 26 },
  heading: { font: "F2", size: 12, lead: 18 },
  body: { font: "F1", size: 10, lead: 14 },
  muted: { font: "F1", size: 8, lead: 11 },
};

// Unicode → Windows-1252 for the 0x80–0x9F block (the rest of Latin-1 maps to itself).
const CP1252: ReadonlyMap<number, number> = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

const TRANSLITERATE: ReadonlyMap<string, string> = new Map([
  ["₹", "Rs "],
  ["′", "'"],
  ["″", '"'],
  ["≈", "~"],
  ["→", "->"],
  ["←", "<-"],
  ["≥", ">="],
  ["≤", "<="],
  ["−", "-"],
  [" ", " "],
  [" ", " "],
  [" ", " "],
]);

/** Windows-1252 codes for a string: transliterated where needed, "?" for the rest. */
export function toWinAnsi(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const swap = TRANSLITERATE.get(ch);
    if (swap !== undefined) {
      for (const c of swap) out.push(c.charCodeAt(0));
      continue;
    }
    const cp = ch.codePointAt(0)!;
    if (cp === 0x09) out.push(0x20);
    else if (cp < 0x20 || cp === 0x7f) continue;
    else if (cp < 0x80 || (cp >= 0xa0 && cp <= 0xff)) out.push(cp);
    else out.push(CP1252.get(cp) ?? 0x3f);
  }
  return out;
}

function hex(codes: readonly number[]): string {
  return codes.map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase();
}

/** Word wrap by an average Helvetica width (0.55 em), breaking words longer than a line. */
export function wrap(text: string, size: number, width = PAGE_W - 2 * MARGIN): string[] {
  const max = Math.max(8, Math.floor(width / (size * 0.55)));
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      let w = word;
      while (w.length > max) {
        if (line) {
          lines.push(line);
          line = "";
        }
        lines.push(w.slice(0, max));
        w = w.slice(max);
      }
      if (!line) line = w;
      else if (line.length + 1 + w.length <= max) line += ` ${w}`;
      else {
        lines.push(line);
        line = w;
      }
    }
    lines.push(line);
  }
  return lines;
}

interface Placed {
  font: "F1" | "F2";
  size: number;
  y: number;
  text: string;
}

/** Lays the lines out on A4 pages. */
function layout(lines: readonly PdfLine[]): Placed[][] {
  const pages: Placed[][] = [[]];
  let y = PAGE_H - MARGIN;
  for (const line of lines) {
    const style = STYLES[line.style ?? "body"];
    const parts = wrap(line.text, style.size);
    // Keep a heading with at least one line after it.
    const need = style.lead * (line.style === "heading" ? 2 : 1) + (line.gap ?? 0);
    if (y - need < MARGIN + 12 && pages[pages.length - 1]!.length) {
      pages.push([]);
      y = PAGE_H - MARGIN;
    } else {
      y -= line.gap ?? 0;
    }
    for (const text of parts) {
      if (y - style.lead < MARGIN + 12) {
        pages.push([]);
        y = PAGE_H - MARGIN;
      }
      y -= style.lead;
      pages[pages.length - 1]!.push({ font: style.font, size: style.size, y, text });
    }
  }
  return pages;
}

/** A text-only PDF (1.4) of the lines. Deterministic: the same lines give the same bytes. */
export function renderPdf(lines: readonly PdfLine[], footer = "Plinth"): Bytes {
  const pages = layout(lines);
  const objects: string[] = [];
  const pageIds = pages.map((_, i) => 6 + 2 * i);

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${
    pageIds.map((id) => `${id} 0 R`).join(" ")
  }] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[4] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  objects[5] = `<< /Title <${hex(toWinAnsi("Your Plinth data"))}> /Producer (Plinth) >>`;

  pages.forEach((placed, i) => {
    const ops: string[] = [];
    for (const p of placed) {
      ops.push(
        `BT /${p.font} ${p.size} Tf ${MARGIN} ${p.y.toFixed(2)} Td <${
          hex(toWinAnsi(p.text))
        }> Tj ET`,
      );
    }
    const foot = `${footer} · page ${i + 1} of ${pages.length}`;
    ops.push(`BT /F1 8 Tf ${MARGIN} ${FOOTER_Y} Td <${hex(toWinAnsi(foot))}> Tj ET`);
    const stream = ops.join("\n");
    objects[6 + 2 * i] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${7 + 2 * i} 0 R >>`;
    objects[7 + 2 * i] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  // Every byte is ASCII (text is hex-encoded), so string length = byte length for the offsets.
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = out.length;
    out += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefAt = out.length;
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) {
    out += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  out +=
    `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

/** The text a PDF from renderPdf shows, line by line (tests and debugging). */
export function pdfText(bytes: Uint8Array): string[] {
  const winAnsi = new TextDecoder("windows-1252");
  const src = winAnsi.decode(bytes);
  const out: string[] = [];
  for (const m of src.matchAll(/<([0-9A-F]+)> Tj/g)) {
    const h = m[1]!;
    const codes = new Uint8Array(h.length / 2);
    for (let i = 0; i < codes.length; i++) codes[i] = parseInt(h.slice(2 * i, 2 * i + 2), 16);
    out.push(winAnsi.decode(codes));
  }
  return out;
}
