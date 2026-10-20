// Shared helpers for the fixture authoring scripts (owner: T03).
// Plain Node, no dependencies. Every formatter here is mirrored by a golden vector.
import { createHash } from "node:crypto";

export const NS_URL = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

/** RFC 4122 UUID v5 (SHA-1) of `https://plinth.in/fixtures/<kind>/<key>` in the URL namespace. */
export function uuid5(kind, key) {
  const ns = Buffer.from(NS_URL.replace(/-/g, ""), "hex");
  const name = Buffer.from(`https://plinth.in/fixtures/${kind}/${key}`, "utf8");
  const h = createHash("sha1")
    .update(Buffer.concat([ns, name]))
    .digest();
  const b = Buffer.from(h.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const x = b.toString("hex");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}

export function sha256(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Indian digit grouping: 16720000 -> "1,67,20,000". */
export function groupIN(n) {
  const s = String(Math.trunc(Math.abs(n)));
  const sign = n < 0 ? "-" : "";
  if (s.length <= 3) return sign + s;
  const last3 = s.slice(-3);
  let rest = s.slice(0, -3);
  const parts = [];
  while (rest.length > 2) {
    parts.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  if (rest) parts.unshift(rest);
  return `${sign}${parts.join(",")},${last3}`;
}

export const inrExact = (n) => `₹${groupIN(n)}`;

/** "₹2.74 Cr" (2 dp, half up), "₹24.1 L" (1 dp, half up), else exact. */
export function inrShort(n) {
  if (n >= 1e7) return `₹${(Math.round(n / 1e5) / 100).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(Math.round(n / 1e4) / 10).toFixed(1)} L`;
  return inrExact(n);
}

export function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MON[m - 1]} ${y}`;
}
export function fmtMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  return `${MON[m - 1]} ${y}`;
}
export function fmtQuarter(q) {
  const [y, qq] = q.split("-Q").map(Number);
  const a = (qq - 1) * 3;
  return `${MON[a]}–${MON[a + 2]} ${y}`;
}
export function addMonths(ym, k) {
  const [y, m] = ym.split("-").map(Number);
  const t = y * 12 + (m - 1) + k;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}
export function monthsBetween(a, b) {
  const [ya, ma] = a.split("-").map(Number);
  const [yb, mb] = b.split("-").map(Number);
  return yb * 12 + mb - (ya * 12 + ma);
}
/** Month-based time used (BUILD_PLAN §7.1), rounded half up to a whole percent. */
export function timeUsedPct(registered, completion, ref) {
  return Math.round((monthsBetween(registered, ref) / monthsBetween(registered, completion)) * 100);
}
export function quarterEndMonth(q) {
  const [y, qq] = q.split("-Q").map(Number);
  return `${y}-${String(qq * 3).padStart(2, "0")}`;
}
/** Due date = the 15th of the month after the quarter ends (DESIGN §5b: Jul–Sep due 15 Oct). */
export function qprDue(q) {
  return `${addMonths(quarterEndMonth(q), 1)}-15`;
}
export function addDays(iso, k) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + k);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}
export function quartersRange(from, to) {
  const out = [];
  let [y, q] = from.split("-Q").map(Number);
  const [ty, tq] = to.split("-Q").map(Number);
  while (y < ty || (y === ty && q <= tq)) {
    out.push(`${y}-Q${q}`);
    q++;
    if (q > 4) {
      q = 1;
      y++;
    }
  }
  return out;
}

/** Stable JSON: insertion-ordered keys, 2-space indent, trailing newline. */
export function json(v) {
  return `${JSON.stringify(v, null, 2)}\n`;
}
