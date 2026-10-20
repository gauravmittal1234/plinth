// Typed access to catalogues/*.json (flags, events, reason codes, WhatsApp
// templates, AI tasks, purposes, reference formats).
import aiTasks from "../catalogues/ai_tasks.json";
import events from "../catalogues/events.json";
import flags from "../catalogues/flags.json";
import purposes from "../catalogues/purposes.json";
import reasonCodes from "../catalogues/reason_codes.json";
import refFormats from "../catalogues/ref_formats.json";
import waTemplates from "../catalogues/wa_templates.json";

export const catalogues = {
  flags,
  events,
  reason_codes: reasonCodes,
  wa_templates: waTemplates,
  ai_tasks: aiTasks,
  purposes,
  ref_formats: refFormats,
} as const;

export type CatalogueName = keyof typeof catalogues;

/** Feature flag keys, in catalogue order. An absent key in api.flags() reads as false. */
export const FLAG_KEYS: readonly string[] = flags.flags.map((f) => f.key);

/** Seeded default of a flag (catalogues/flags.json), or undefined for an unknown key. */
export function flagDefault(key: string): boolean | undefined {
  return flags.flags.find((f) => f.key === key)?.default;
}

export type RefPrefix = "C" | "R" | "CL" | "D" | "EV" | "LN" | "E" | "G";

const REF_PATTERNS = new Map<string, RegExp>(
  refFormats.formats.map((f) => [f.prefix, new RegExp(f.regex)]),
);

/** The anchored regex of a human reference format, e.g. C-MMDD-NN. */
export function refPattern(prefix: RefPrefix): RegExp {
  const re = REF_PATTERNS.get(prefix);
  if (!re) throw new Error(`unknown reference prefix ${prefix}`);
  return re;
}

/** True when `value` is a well-formed reference of that prefix ("C-1018-11"). */
export function isRef(prefix: RefPrefix, value: string): boolean {
  return refPattern(prefix).test(value);
}

/**
 * Fills a catalogue template ("{sold_pct}% of units sold, …"). Every
 * placeholder must have a value; values are already formatted by the server.
 */
export function fillTemplate(
  template: string,
  params: Readonly<Record<string, string | undefined>>,
): string {
  return template.replace(/\{([a-z][a-z0-9_]*)\}/g, (_, key: string) => {
    const v = params[key];
    if (v === undefined) throw new Error(`missing template parameter ${key}`);
    return v;
  });
}
