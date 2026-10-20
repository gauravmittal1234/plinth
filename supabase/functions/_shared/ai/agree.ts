// Reader A vs reader B, field by field (T63; the M3 rule "A single reader never produces differs").
//
// agree(a, b, spec) compares two readers' outputs after per-type normalisation:
//   inr      "₹2.74 Cr", "Rs 11,00,000", "₹24.1 L", "INR 5,00,000/-", 1100000   → integer rupees
//   date     "18 Oct 2026", "2026-10-18", "18/10/2026", "Oct 2026", "10/2026"      → "2026-10"
//   area     "1,450 sq ft carpet", { value, unit, basis }                         → { sqft, basis }
//   percent  "38%", 38                                                             → 38
//   number   "1,450", 1450                                                         → 1450
//   text     case, spacing and punctuation folded;  enum: also "_" and "-" as spaces
// A field is agreed when both readers give values that normalise to the same thing. It is a
// disagreement when they differ, when only one reader gives it, or when a value cannot be read.
// The agreement carries the lower of the two confidences; the overall confidence is the lowest
// agreed one. Whether that is high enough is the rules' call (core.check_rules), never this file's.
//
// Output shapes: flat ({ field: value }) or a list of items (spec.items = "claims") matched by key
// fields (spec.key = ["type"]); the nth item with the same key pairs with the nth. A field value
// may be a scalar or { value, confidence?, unit?, basis? }; confidence also comes from the item or
// the output (`confidence`), and is 0 when no reader states one.

export type FieldKind = "inr" | "date" | "area" | "percent" | "number" | "text" | "enum";

export interface AgreeSpec {
  /** Field name → kind. Only these fields are compared. */
  fields: Readonly<Record<string, FieldKind>>;
  /** The output's array of items (e.g. "claims"); absent for a flat output. */
  items?: string;
  /** Item fields whose normalised values identify an item (items only). */
  key?: readonly string[];
}

export type Normalised = string | number | { sqft: number; basis: string | null };

export interface AgreedField {
  /** The item key ("rera_number#1"), or null for a flat output. */
  key: string | null;
  field: string;
  value: Normalised;
  a: unknown;
  b: unknown;
  confidence: number;
}

export interface Disagreement {
  key: string | null;
  field: string;
  a: unknown;
  b: unknown;
  reason: "differs" | "only_a" | "only_b" | "unreadable";
}

export interface Agreement {
  agreed: AgreedField[];
  disagreements: Disagreement[];
  /** The lowest agreed confidence; null when nothing agreed. */
  confidence: number | null;
  /** agreed / (agreed + disagreements); null when neither reader gave anything. */
  rate: number | null;
}

const CRORE = /^(?:cr|crs|crore|crores)$/;
const LAKH = /^(?:l|lac|lacs|lakh|lakhs|lk)$/;
const THOUSAND = /^(?:k|thousand)$/;

function plainNumber(raw: string): number | null {
  const t = raw.replace(/,/g, "").trim();
  if (!/^\d+(?:\.\d+)?$/.test(t)) return null;
  return Number(t);
}

/** ₹ amounts to integer rupees. */
export function normaliseInr(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? Math.round(v) : null;
  if (typeof v !== "string") return null;
  const t = v.toLowerCase()
    .replace(/₹|\binr\b|\brs\.?|\brupees?\b/g, " ")
    .replace(/\/-/g, " ")
    .replace(/\bonly\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const m = /^(\d[\d,]*(?:\.\d+)?)\s*([a-z]+)?/.exec(t);
  if (!m) return null;
  const n = plainNumber(m[1]!);
  if (n === null) return null;
  const unit = m[2] ?? "";
  const scale = CRORE.test(unit) ? 1e7 : LAKH.test(unit) ? 1e5 : THOUSAND.test(unit) ? 1e3 : 1;
  // Million and billion are not how Indian documents write amounts: unreadable, not guessed.
  if (/^(?:m|mn|million|b|bn|billion)$/.test(unit)) return null;
  return Math.round(n * scale);
}

const MONTHS: Readonly<Record<string, number>> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function ym(year: number, month: number): string | null {
  if (month < 1 || month > 12 || year < 1950 || year > 2100) return null;
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** Dates to month precision ("YYYY-MM"). Numeric dates are read day first (India). */
export function normaliseDate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().toLowerCase().replace(/(\d)(st|nd|rd|th)\b/g, "$1").replace(/,/g, " ")
    .replace(/\s+/g, " ");
  let m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?(?:t.*)?$/.exec(t);
  if (m) return ym(Number(m[1]), Number(m[2]));
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  if (m) return ym(Number(m[3]), Number(m[2]));
  m = /^(\d{1,2})[/.-](\d{4})$/.exec(t);
  if (m) return ym(Number(m[2]), Number(m[1]));
  m = /^(?:(\d{1,2})[ -])?([a-z]{3,9})\.?[ -](\d{4})$/.exec(t);
  if (m) {
    const month = MONTHS[m[2]!.slice(0, m[2]!.startsWith("sept") ? 4 : 3)];
    return month ? ym(Number(m[3]), month) : null;
  }
  return null;
}

const SQFT_PER: ReadonlyArray<readonly [RegExp, number]> = [
  [/^(?:sq\.? ?ft\.?|sqft|ft2|ft²|square ?feet|sq\.? ?feet|sft)$/, 1],
  [/^(?:sq\.? ?m\.?|sqm|m2|m²|square ?met(?:re|er)s?|sq\.? ?met(?:re|er)s?)$/, 10.7639],
  [/^(?:sq\.? ?yd\.?|sq\.? ?yards?|square ?yards?|gaj)$/, 9],
];

function areaBasis(text: string): string | null {
  const t = text.toLowerCase();
  if (/super/.test(t) || /saleable/.test(t)) return "super_area";
  if (/built[ -]?up|\bbua\b/.test(t)) return "built_up";
  if (/carpet/.test(t)) return "carpet";
  return null;
}

/** Areas to whole sq ft with their basis (carpet, built_up, super_area or null). */
export function normaliseArea(v: unknown): { sqft: number; basis: string | null } | null {
  let value: unknown = v;
  let unit = "";
  let basis: string | null = null;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const o = v as Record<string, unknown>;
    value = o.value;
    unit = typeof o.unit === "string" ? o.unit : "";
    basis = typeof o.basis === "string" ? areaBasis(o.basis) ?? o.basis.toLowerCase() : null;
  }
  let n: number | null = typeof value === "number" ? value : null;
  if (typeof value === "string") {
    const m = /^\s*(\d[\d,]*(?:\.\d+)?)\s*(.*)$/.exec(value);
    if (!m) return null;
    n = plainNumber(m[1]!);
    const rest = m[2]!.toLowerCase();
    basis ??= areaBasis(rest);
    const u =
      /(sq\.? ?ft\.?|sqft|ft2|ft²|square ?feet|sq\.? ?feet|sft|sq\.? ?m\.?|sqm|m2|m²|square ?met(?:re|er)s?|sq\.? ?met(?:re|er)s?|sq\.? ?yd\.?|sq\.? ?yards?|square ?yards?|gaj)/
        .exec(rest);
    if (u && !unit) unit = u[1]!;
    // Words that are neither a unit nor a basis ("hectares", "units") make the area unreadable.
    if (!u && /[a-z]/.test(rest) && areaBasis(rest) === null) return null;
  }
  if (n === null || !Number.isFinite(n) || n <= 0) return null;
  const u = unit.toLowerCase().trim() || "sq ft";
  const factor = SQFT_PER.find(([re]) => re.test(u))?.[1];
  if (factor === undefined) return null;
  return { sqft: Math.round(n * factor), basis };
}

export function normaliseNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
  if (typeof v !== "string") return null;
  const n = plainNumber(v);
  return n === null ? null : Math.round(n * 100) / 100;
}

export function normalisePercent(v: unknown): number | null {
  if (typeof v === "string") return normaliseNumber(v.replace(/\s*(?:%|per ?cent|pc)\s*$/i, ""));
  return normaliseNumber(v);
}

export function normaliseText(v: unknown, kind: "text" | "enum" = "text"): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  let t = String(v).normalize("NFKC").toLowerCase();
  if (kind === "enum") t = t.replace(/[_-]/g, " ");
  t = t.replace(/[^\p{L}\p{N}/.]+/gu, " ").replace(/\.(?!\d)/g, " ").replace(/\s+/g, " ").trim();
  return t === "" ? null : t;
}

/** Normalises a value of a kind; null when it cannot be read. */
export function normalise(kind: FieldKind, v: unknown): Normalised | null {
  switch (kind) {
    case "inr":
      return normaliseInr(v);
    case "date":
      return normaliseDate(v);
    case "area":
      return normaliseArea(v);
    case "percent":
      return normalisePercent(v);
    case "number":
      return normaliseNumber(v);
    case "text":
    case "enum":
      return normaliseText(v, kind);
  }
}

/** A stable text for a normalised value (comparison and fact keys). */
export function normalisedKey(v: Normalised): string {
  return typeof v === "object" ? `${v.sqft} sqft ${v.basis ?? "-"}` : String(v);
}

function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null;
}

/** A field's value and confidence: { value, confidence } objects are unwrapped (areas keep shape). */
function fieldOf(
  holder: Record<string, unknown>,
  field: string,
  kind: FieldKind,
  fallbackConfidence: number | null,
): { value: unknown; confidence: number } {
  const raw = holder[field];
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "value" in raw) {
    const o = raw as Record<string, unknown>;
    const confidence = num(o.confidence) ?? fallbackConfidence ?? 0;
    if (kind === "area") return { value: o, confidence };
    return { value: o.value, confidence };
  }
  return { value: raw, confidence: fallbackConfidence ?? 0 };
}

type Holder = { key: string | null; record: Record<string, unknown>; confidence: number | null };

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
}

/** The holders (items or the whole output) of one reader's output, keyed. */
export function holdersOf(output: unknown, spec: AgreeSpec): Holder[] {
  const root = asRecord(output);
  const rootConfidence = num(root.confidence);
  if (!spec.items) return [{ key: null, record: root, confidence: rootConfidence }];
  const list = Array.isArray(root[spec.items]) ? root[spec.items] as unknown[] : [];
  const seen = new Map<string, number>();
  return list.map((item) => {
    const record = asRecord(item);
    const base = (spec.key ?? []).map((k) => {
      const kind = spec.fields[k] ?? "enum";
      const n = normalise(kind, fieldOf(record, k, kind, null).value);
      return n === null ? "?" : normalisedKey(n).replace(/ /g, "_");
    }).join("|") || "item";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return { key: `${base}#${n}`, record, confidence: num(record.confidence) ?? rootConfidence };
  });
}

/** Compares two readers' outputs field by field. */
export function agree(a: unknown, b: unknown, spec: AgreeSpec): Agreement {
  const ha = new Map(holdersOf(a, spec).map((h) => [h.key ?? "", h]));
  const hb = new Map(holdersOf(b, spec).map((h) => [h.key ?? "", h]));
  const keys = [...new Set([...ha.keys(), ...hb.keys()])];
  const agreed: AgreedField[] = [];
  const disagreements: Disagreement[] = [];
  for (const k of keys) {
    const key = spec.items ? k : null;
    const xa = ha.get(k);
    const xb = hb.get(k);
    for (const [field, kind] of Object.entries(spec.fields)) {
      const fa = xa ? fieldOf(xa.record, field, kind, xa.confidence) : null;
      const fb = xb ? fieldOf(xb.record, field, kind, xb.confidence) : null;
      const va = fa?.value;
      const vb = fb?.value;
      if (isBlank(va) && isBlank(vb)) continue;
      if (isBlank(vb)) {
        disagreements.push({ key, field, a: va, b: null, reason: "only_a" });
        continue;
      }
      if (isBlank(va)) {
        disagreements.push({ key, field, a: null, b: vb, reason: "only_b" });
        continue;
      }
      const na = normalise(kind, va);
      const nb = normalise(kind, vb);
      if (na === null || nb === null) {
        disagreements.push({ key, field, a: va, b: vb, reason: "unreadable" });
      } else if (normalisedKey(na) !== normalisedKey(nb)) {
        disagreements.push({ key, field, a: va, b: vb, reason: "differs" });
      } else {
        agreed.push({
          key,
          field,
          value: na,
          a: va,
          b: vb,
          confidence: Math.min(fa!.confidence, fb!.confidence),
        });
      }
    }
  }
  const total = agreed.length + disagreements.length;
  return {
    agreed,
    disagreements,
    confidence: agreed.length ? Math.min(...agreed.map((f) => f.confidence)) : null,
    rate: total ? agreed.length / total : null,
  };
}
