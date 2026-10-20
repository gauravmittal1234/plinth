// The guided shell for both routes this task owns (`/compare?p=`,
// `/compare/[a]-vs-[b]`): one <h1>, the shared CompareBoard, and the
// disclaimer (DESIGN §4 item 10). A missing fixture key (load-compare.ts)
// still renders this shell with the gap named, never a 500 (AGENTS.md
// "Definition of done": every screen has a fixture-mode test, and this is
// the one the e2e smoke sample for `/compare/[pair]` exercises).
import { DisclaimerLine } from "@plinth/web-ui";
import type { Slug } from "@/src/data";
import { CompareBoard } from "../board/compare-board";
import { COPY } from "./copy";
import { formatDate } from "./format";
import { loadCompare } from "./load-compare";

export async function CompareScreen({ slugs }: { slugs: readonly Slug[] }) {
  const load = await loadCompare(slugs);

  if (!load.ok) {
    return (
      <div className="mx-auto flex max-w-[48rem] flex-col gap-4 px-4 py-16 sm:px-8">
        <h1 className="m-0 font-display text-h2 font-extrabold text-ink">
          {COPY.notAvailableHeading}
        </h1>
        <p className="m-0 text-body text-ink2">{load.message}</p>
      </div>
    );
  }

  const { data, aiAskOn } = load;
  const dataAsOf = formatDate(data.meta?.data_as_of ?? "");

  return (
    <div className="mx-auto flex max-w-[79rem] flex-col gap-8 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-h2 font-extrabold text-ink">
          {COPY.heading(data.columns.length)}
        </h1>
        <p className="m-0 text-lead text-ink2">{data.columns.map((c) => c.name).join(" vs ")}</p>
        <p className="m-0 text-body text-ink2">{COPY.intro(dataAsOf)}</p>
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
