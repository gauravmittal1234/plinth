// ISR cache tags (BUILD_PLAN §5.2: `phase:<slug>`, `developer:<slug>`, `search`).
// Every cached public read (cache.ts) carries the tags below; the outbox's
// revalidate job (API_CONTRACTS §5.5) posts them to POST /api/revalidate.
//
//   all                  every cached read (facts_only_global, maintenance_mode, a model release)
//   phase:<slug>         any read that shows the phase: risk_summary, project_page,
//                        search and compare results, its developer's page, share cards
//   developer:<slug>     developer_page, and the project pages of its phases
//   search               search_projects, suggest
//   compare              compare
//   evidence:<fact_id>   evidence (a correction supersedes the fact)
//   card:<code>          share_card
//   methodology, about, flags
//
// A score publish needs only `phase:<slug>`: every page that shows the phase
// carries that tag, because reads also tag the phases found in their payloads.
import type { RpcArgs, RpcName } from "./registry";

export const SINGLETON_TAGS = [
  "all",
  "search",
  "compare",
  "methodology",
  "about",
  "flags",
] as const;
export const TAG_KINDS = ["phase", "developer", "evidence", "card"] as const;

export type CacheTag = (typeof SINGLETON_TAGS)[number] | `${(typeof TAG_KINDS)[number]}:${string}`;

const KEYED_TAG = /^(phase|developer|evidence|card):[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/;

/** True for a tag of the vocabulary above (POST /api/revalidate accepts nothing else). */
export function isCacheTag(tag: unknown): tag is CacheTag {
  if (typeof tag !== "string") return false;
  return (SINGLETON_TAGS as readonly string[]).includes(tag) || KEYED_TAG.test(tag);
}

/** A tag as the reads write it: keyed values are lower case (`card:AH2` → `card:ah2`). */
export function normalizeTag(tag: CacheTag): CacheTag {
  const i = tag.indexOf(":");
  return i < 0 ? tag : (`${tag.slice(0, i)}:${tag.slice(i + 1).toLowerCase()}` as CacheTag);
}

/** Slugs as the server reads them (`lower(btrim(p_slug))`). */
const norm = (v: unknown): string | null =>
  typeof v === "string" && v.trim() !== "" ? v.trim().toLowerCase() : null;

export const phaseTag = (slug: string): CacheTag => `phase:${slug}`;
export const developerTag = (slug: string): CacheTag => `developer:${slug}`;

function keyed(kind: (typeof TAG_KINDS)[number], value: unknown): CacheTag[] {
  const v = norm(value);
  const tag = v ? `${kind}:${v}` : null;
  return tag && isCacheTag(tag) ? [tag as CacheTag] : [];
}

/** Tags known before the call: from the function and its arguments. */
export function tagsForCall(rpc: RpcName, args: RpcArgs): CacheTag[] {
  const tags: CacheTag[] = ["all"];
  switch (rpc) {
    case "risk_summary":
    case "project_page":
      tags.push(...keyed("phase", args.p_slug));
      break;
    case "developer_page":
      tags.push(...keyed("developer", args.p_slug));
      break;
    case "search_projects":
    case "suggest":
      tags.push("search");
      break;
    case "compare":
      tags.push("compare");
      if (Array.isArray(args.p_slugs))
        for (const s of args.p_slugs) tags.push(...keyed("phase", s));
      break;
    case "evidence":
      tags.push(...keyed("evidence", args.p_fact_id));
      break;
    case "share_card":
      tags.push(...keyed("card", args.p_code));
      break;
    case "methodology":
    case "about":
    case "flags":
      tags.push(rpc);
      break;
    default:
      break;
  }
  return unique(tags);
}

type Obj = Record<string, unknown>;
const obj = (v: unknown): Obj | null =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null;
const list = (v: unknown): Obj[] =>
  Array.isArray(v) ? v.map(obj).filter((o): o is Obj => o !== null) : [];

/** Tags found in a payload: the phases and developer it shows. */
export function tagsForPayload(rpc: RpcName, payload: unknown): CacheTag[] {
  const p = obj(payload);
  if (!p) return [];
  const tags: CacheTag[] = [];
  const phaseOf = (o: Obj | null) => tags.push(...keyed("phase", o?.slug));
  switch (rpc) {
    case "risk_summary":
      tags.push(...keyed("developer", obj(obj(p.phase)?.developer)?.slug));
      break;
    case "project_page":
      tags.push(...keyed("developer", obj(obj(obj(p.risk)?.phase)?.developer)?.slug));
      break;
    case "developer_page":
      tags.push(...keyed("developer", obj(p.group)?.slug));
      list(p.ongoing).forEach(phaseOf);
      break;
    case "search_projects":
      list(p.items).forEach(phaseOf);
      list(p.hidden).forEach(phaseOf);
      break;
    case "compare":
      list(p.columns).forEach(phaseOf);
      break;
    case "share_card":
      phaseOf(obj(p.phase));
      break;
    default:
      break;
  }
  return unique(tags);
}

function unique(tags: CacheTag[]): CacheTag[] {
  return [...new Set(tags)];
}
