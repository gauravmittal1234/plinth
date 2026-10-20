// A small ZIP writer (stored entries, no compression) for the DPDP export, and the matching
// reader the tests use. No dependency: the export is one PDF and one JSON file, a few hundred KB
// at most, so compression is not worth a third-party package (AGENTS.md §1, frozen lockfiles).
//
//   zipStore([{ name: "a.json", data }], at)   → the ZIP bytes (UTF-8 names, IST timestamps)
//   readZip(bytes)                              → Map<name, bytes>, CRC-checked

import type { Bytes } from "../_shared/core/crypto.ts";

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

/** CRC-32 (IEEE 802.3), as ZIP stores it. */
export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const IST_OFFSET_MS = 330 * 60 * 1000;

/** MS-DOS date and time fields of an instant, in IST wall time (what a buyer's unzip shows). */
export function dosDateTime(at: Date): { date: number; time: number } {
  const d = new Date(at.getTime() + IST_OFFSET_MS);
  const year = Math.min(Math.max(d.getUTCFullYear(), 1980), 2107);
  return {
    date: ((year - 1980) << 9) | ((d.getUTCMonth() + 1) << 5) | d.getUTCDate(),
    time: (d.getUTCHours() << 11) | (d.getUTCMinutes() << 5) | Math.floor(d.getUTCSeconds() / 2),
  };
}

const UTF8_FLAG = 0x0800;

function concat(parts: readonly Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** A ZIP of stored (uncompressed) entries. Entry names must be unique, relative and non-empty. */
export function zipStore(entries: readonly ZipEntry[], modified: Date): Bytes {
  const encoder = new TextEncoder();
  const { date, time } = dosDateTime(modified);
  const seen = new Set<string>();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    if (!entry.name || entry.name.startsWith("/") || entry.name.includes("..")) {
      throw new Error("zipStore: entry names are relative and non-empty");
    }
    if (seen.has(entry.name)) throw new Error("zipStore: duplicate entry name");
    seen.add(entry.name);

    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const size = entry.data.length;

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); // version needed: 2.0
    lv.setUint16(6, UTF8_FLAG, true);
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, time, true);
    lv.setUint16(12, date, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true);
    local.set(name, 30);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // made by: 2.0
    cv.setUint16(6, 20, true);
    cv.setUint16(8, UTF8_FLAG, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true);
    cv.setUint16(14, date, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);

    locals.push(local, entry.data);
    centrals.push(central);
    offset += local.length + size;
  }

  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  return concat([...locals, ...centrals, end]);
}

/** Reads a ZIP of stored entries (what zipStore writes) and checks every CRC. */
export function readZip(bytes: Uint8Array): Map<string, Uint8Array> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("readZip: no end of central directory");
  const count = view.getUint16(eocd + 10, true);
  let at = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const out = new Map<string, Uint8Array>();
  for (let i = 0; i < count; i++) {
    if (view.getUint32(at, true) !== 0x02014b50) throw new Error("readZip: bad central header");
    const method = view.getUint16(at + 10, true);
    const crc = view.getUint32(at + 16, true);
    const size = view.getUint32(at + 20, true);
    const nameLen = view.getUint16(at + 28, true);
    const extraLen = view.getUint16(at + 30, true);
    const commentLen = view.getUint16(at + 32, true);
    const localAt = view.getUint32(at + 42, true);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLen));
    if (method !== 0) throw new Error("readZip: only stored entries are supported");
    if (view.getUint32(localAt, true) !== 0x04034b50) throw new Error("readZip: bad local header");
    const dataAt = localAt + 30 + view.getUint16(localAt + 26, true) +
      view.getUint16(localAt + 28, true);
    const data = bytes.subarray(dataAt, dataAt + size);
    if (crc32(data) !== crc) throw new Error(`readZip: CRC mismatch in ${name}`);
    out.set(name, data);
    at += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}
