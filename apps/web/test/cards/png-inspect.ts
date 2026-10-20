// Test-only PNG inspection: reads a card's exact pixel dimensions from its
// IHDR chunk, and reduces its pixels to a small perceptual hash so a
// snapshot test can catch an unintended visual change without committing
// a binary fixture. No new dependency: just the PNG chunk format and
// node:zlib, both already available.
import { inflateSync } from "node:zlib";

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export type PngDimensions = { width: number; height: number };

function chunks(png: Buffer): { type: string; data: Buffer }[] {
  if (!png.subarray(0, 8).equals(SIGNATURE)) throw new Error("Not a PNG (bad signature)");
  const out: { type: string; data: Buffer }[] = [];
  let offset = 8;
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    out.push({ type, data });
    offset += 12 + length; // length + type + data + crc
  }
  return out;
}

/** Width and height from the PNG's IHDR chunk (T27 accept: "PNG dimensions are exact"). */
export function pngDimensions(png: Buffer): PngDimensions {
  const ihdr = chunks(png).find((c) => c.type === "IHDR");
  if (!ihdr) throw new Error("No IHDR chunk");
  return { width: ihdr.data.readUInt32BE(0), height: ihdr.data.readUInt32BE(4) };
}

function unfilter(raw: Buffer, width: number, height: number, bpp: number): Buffer {
  const stride = width * bpp;
  const out = Buffer.alloc(stride * height);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[pos];
    pos += 1;
    const rowStart = y * stride;
    const prevStart = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const raw8 = raw[pos + x]!;
      const a = x >= bpp ? out[rowStart + x - bpp]! : 0;
      const b = y > 0 ? out[prevStart + x]! : 0;
      const c = y > 0 && x >= bpp ? out[prevStart + x - bpp]! : 0;
      let value: number;
      switch (filter) {
        case 0:
          value = raw8;
          break;
        case 1:
          value = raw8 + a;
          break;
        case 2:
          value = raw8 + b;
          break;
        case 3:
          value = raw8 + ((a + b) >> 1);
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
          value = raw8 + pr;
          break;
        }
        default:
          throw new Error(`Unknown PNG filter type ${filter}`);
      }
      out[rowStart + x] = value & 0xff;
    }
    pos += stride;
  }
  return out;
}

/**
 * A stable 64-bit perceptual hash (an 8×8 average-hash over luminance), as a
 * 16-character hex string. Two renders of the same card should match
 * exactly; `hammingDistance` gives the tolerance a flaky font-hinting
 * difference might need.
 */
export function perceptualHash(png: Buffer): string {
  const all = chunks(png);
  const ihdr = all.find((c) => c.type === "IHDR");
  if (!ihdr) throw new Error("No IHDR chunk");
  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data[8];
  const colorType = ihdr.data[9];
  if (bitDepth !== 8 || (colorType !== 6 && colorType !== 2)) {
    throw new Error(`perceptualHash only supports 8-bit RGB(A) PNGs, got depth ${bitDepth} colorType ${colorType}`);
  }
  const bpp = colorType === 6 ? 4 : 3;

  const idat = Buffer.concat(all.filter((c) => c.type === "IDAT").map((c) => c.data));
  const raw = unfilter(inflateSync(idat), width, height, bpp);

  const grid = 8;
  const sums = new Float64Array(grid * grid);
  const counts = new Float64Array(grid * grid);
  for (let y = 0; y < height; y++) {
    const cellY = Math.min(grid - 1, Math.floor((y / height) * grid));
    for (let x = 0; x < width; x++) {
      const cellX = Math.min(grid - 1, Math.floor((x / width) * grid));
      const i = (y * width + x) * bpp;
      const luminance = (raw[i]! * 299 + raw[i + 1]! * 587 + raw[i + 2]! * 114) / 1000;
      const cell = cellY * grid + cellX;
      sums[cell]! += luminance;
      counts[cell]! += 1;
    }
  }
  const averages = Array.from(sums, (sum, i) => sum / (counts[i] || 1));
  const mean = averages.reduce((a, b) => a + b, 0) / averages.length;

  let bits = "";
  let hex = "";
  for (let i = 0; i < averages.length; i++) {
    bits += averages[i]! >= mean ? "1" : "0";
    if (bits.length === 4) {
      hex += parseInt(bits, 2).toString(16);
      bits = "";
    }
  }
  return hex;
}

/** Bits that differ between two same-length hex hashes (0 = identical). */
export function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i]!, 16) ^ parseInt(b[i]!, 16);
    while (x) {
      distance += x & 1;
      x >>= 1;
    }
  }
  return distance;
}
