// api.suggest in fixture mode, until packages/fixtures/expected/suggest exists:
// a plain lookup over the fixture world's own payloads (the 8 phases of
// expected/risk_summary, the 6 groups of expected/developer_page). Names,
// slugs, RERA numbers and localities come from those files; nothing is added.
// The live function (T13) is typo- and Hinglish-tolerant (pg_trgm + synonyms);
// this one matches word prefixes, the RERA number and the slug only.
import "server-only";
import type { SuggestResults } from "@plinth/contracts";

/** What the lookup reads: the fixture index and a payload loader (fixtures.ts). */
export type FixtureReader = {
  readonly keys: (dir: string) => readonly string[];
  readonly load: (dir: string, key: string) => Promise<unknown>;
};

type Suggestion = SuggestResults["items"][number];
type Candidate = Suggestion & { rank: number };

const MAX_ITEMS = 8;
const VARIANT = "--";

const words = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9/]+/)
    .filter(Boolean);
const startsAWord = (text: string, q: string) => {
  const ws = words(text);
  const qs = words(q);
  if (qs.length === 0) return false;
  // Every query word starts a word of the text, in order ("aurelia ph" → "Aurelia Heights, Phase 2").
  let from = 0;
  for (const part of qs) {
    const i = ws.findIndex((w, idx) => idx >= from && w.startsWith(part));
    if (i < 0) return false;
    from = i + 1;
  }
  return true;
};

type Obj = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : null);

export async function emulateSuggest(
  rawQ: string,
  fixtures: FixtureReader,
): Promise<SuggestResults> {
  const q = rawQ.trim().replace(/\s+/g, " ");
  const items: Candidate[] = [];
  if (q !== "") {
    const lower = q.toLowerCase();

    for (const key of fixtures.keys("risk_summary")) {
      if (key.includes(VARIANT)) continue;
      const phase = ((await fixtures.load("risk_summary", key)) as Obj | undefined)?.phase as
        Obj | undefined;
      const slug = str(phase?.slug);
      const name = str(phase?.name);
      if (!slug || !name) continue;
      const rera = str(phase?.rera_number);
      const locality = str(phase?.locality_line);
      const detail = [locality, rera].filter(Boolean).join(" · ") || null;
      const base = { kind: "phase" as const, slug, label: name, detail_line: detail };
      if (startsAWord(name, q) || slug.startsWith(lower)) {
        items.push({ ...base, matched_on: "name", rank: 0 });
      } else if (rera && rera.toLowerCase().includes(lower)) {
        items.push({ ...base, matched_on: "rera_number", rank: 1 });
      } else if (locality && startsAWord(locality, q)) {
        items.push({ ...base, matched_on: "sector", rank: 2 });
      }
    }

    for (const key of fixtures.keys("developer_page")) {
      if (key.includes(VARIANT)) continue;
      const group = ((await fixtures.load("developer_page", key)) as Obj | undefined)?.group as
        Obj | undefined;
      const slug = str(group?.slug);
      const name = str(group?.name);
      if (!slug || !name) continue;
      if (startsAWord(name, q) || slug.startsWith(lower)) {
        items.push({
          kind: "developer",
          slug,
          label: name,
          detail_line: null,
          matched_on: "name",
          rank: 0,
        });
      }
    }
  }

  const ordered = items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => a.item.rank - b.item.rank || a.i - b.i)
    .slice(0, MAX_ITEMS)
    .map(({ item }) => {
      const { rank, ...suggestion } = item;
      void rank;
      return suggestion;
    });
  return { schema: "plinth.suggest/1", q, items: ordered };
}
