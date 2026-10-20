// The guided shell for both routes this task owns (`/compare?p=`,
// `/compare/[a]-vs-[b]`): one <h1>, the shared CompareBoard, and the
// disclaimer (DESIGN §4 item 10). A missing fixture key (load-compare.ts)
// still renders this shell with the gap named, never a 500 (AGENTS.md
// "Definition of done": every screen has a fixture-mode test, and this is
// the one the e2e smoke sample for `/compare/[pair]` exercises).
import { DisclaimerLine } from "@plinth/web-ui";
import { notFound } from "next/navigation";
import type { Slug } from "@/src/data";
import { CompareBoard } from "../board/compare-board";
import { COPY } from "./copy";
import { formatDate } from "./format";
import { loadCompare } from "./load-compare";

export async function CompareScreen({
  slugs,
  unknownIs404 = false,
}: {
  slugs: readonly Slug[];
  /** The SEO route answers an unknown project with a real 404, not a 200 page (no soft 404s). */
  unknownIs404?: boolean;
}) {
  const load = await loadCompare(slugs);

  if (!load.ok) {
    if (unknownIs404 && load.reason === "not_found") notFound();
    return (
      <div className="mx-auto flex max-w-[48rem] flex-col gap-4 px-4 py-16 sm:px-8">
        <h1 className="m-0 font-display text-h2 font-bold text-ink">
          {COPY.notAvailableHeading}
        </h1>
        <p className="m-0 text-body text-ink2">{load.message}</p>
      </div>
    );
  }

  const { data, aiAskOn } = load;
  const dataAsOf = data.meta ? formatDate(data.meta.data_as_of) : null;

  return (
    <div className="mx-auto flex max-w-[79rem] flex-col gap-8 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-h2 font-bold text-ink">
          {COPY.heading(data.columns.length)}
        </h1>
        <p className="m-0 text-lead text-ink2">{data.columns.map((c) => c.name).join(" vs ")}</p>
        <p className="m-0 text-body text-ink2">
          {dataAsOf ? COPY.intro(dataAsOf) : COPY.introNoDate}
        </p>
      </header>

      <CompareBoard initialSlugs={load.slugs} initialData={data} aiAskOn={aiAskOn} />

      {data.meta ? (
        <DisclaimerLine
          meta={{ disclaimer_line: `${COPY.disclaimerPrefix}${data.meta.disclaimer_line ?? ""}` }}
          trailing={`${
            data.meta.model_version ? `model ${data.meta.model_version} · ` : ""
          }${COPY.noPaidPlacement}`}
        />
      ) : null}
    </div>
  );
}
