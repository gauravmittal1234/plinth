"use client";

// The 2-4 column table (WORK_BREAKDOWN T24 Build): add/remove, the pending
// block (every row renders generically from CompareRow, so the pending row's
// "On record now" line and its developer_says lane need no special fetch),
// and "Band withheld" (the column's own RiskChip already reads
// `chip.label` -- "Band withheld - facts only" -- straight from the contract;
// DESIGN "borderless everywhere" lives in RiskChip, not here).
//
// Ask Plinth stays off the page entirely while `ai_ask` is off (M5,
// INTEGRATION_NOTES): there is no composed-on-the-client AI answer to gate,
// so "hidden" here means this component renders nothing for it, the same
// choice AskSection (WebProject) and HeroSearch (WebHome) made.
import { RiskChip, Toast } from "@plinth/web-ui";
import type { Compare, CompareColumn, Slug } from "@plinth/contracts";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { refreshCompare } from "./actions";
import { AddProjectSheet } from "./add-project-sheet";
import { COPY } from "../page/copy";
import { cellText } from "../page/format";
import { comparePath } from "../page/pair";

const MIN_COLUMNS = 2;
const MAX_COLUMNS = 4;

export function CompareBoard({
  initialSlugs,
  initialData,
  aiAskOn,
}: {
  initialSlugs: readonly Slug[];
  initialData: Compare;
  aiAskOn: boolean;
}) {
  const router = useRouter();
  const [slugs, setSlugs] = useState<readonly Slug[]>(initialSlugs);
  const [data, setData] = useState<Compare>(initialData);
  const [notice, setNotice] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Void only to document the M5 gate at the one place a real caller would
  // read it; nothing in this file's markup depends on it yet.
  void aiAskOn;

  function commit(nextSlugs: readonly Slug[]) {
    startTransition(async () => {
      const load = await refreshCompare(nextSlugs);
      if (!load.ok) {
        setNotice(load.message);
        return;
      }
      setSlugs(load.slugs);
      setData(load.data);
      setSheetOpen(false);
      router.replace(comparePath(load.slugs), { scroll: false });
    });
  }

  const canRemove = slugs.length > MIN_COLUMNS;
  const canAdd = slugs.length < MAX_COLUMNS;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-separate border-spacing-0">
          <caption className="sr-only">Delivery risk and facts, side by side</caption>
          <thead>
            <tr>
              <th scope="col" className="w-48 min-w-48 text-left align-bottom">
                <span className="sr-only">Fact</span>
              </th>
              {data.columns.map((column) => (
                <ColumnHead
                  key={column.slug}
                  column={column}
                  canRemove={canRemove}
                  onRemove={() => commit(slugs.filter((s) => s !== column.slug))}
                />
              ))}
              {canAdd ? (
                <th scope="col" className="min-w-52 px-4 py-4 align-bottom">
                  <p className="m-0 font-display text-body font-bold text-ink">
                    {COPY.addSlotHeading}
                  </p>
                  <p className="m-0 mt-1 text-caption text-ink2">{COPY.addSlotHint}</p>
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="mt-3 inline-flex h-11 cursor-pointer items-center justify-center rounded-pill border-0 bg-chip-fill px-4.5 text-body font-semibold text-ink transition-transform duration-(--pl-motion-duration-press) ease-out active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    {COPY.addProject}
                  </button>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.key} data-compare-row={row.key}>
                <th scope="row" className="min-w-48 px-4 py-4 text-left align-top">
                  <p className="m-0 text-body font-semibold text-ink">{row.label}</p>
                  {row.source_line ? (
                    <p className="m-0 mt-1 text-caption text-ink2">{row.source_line}</p>
                  ) : null}
                </th>
                {data.columns.map((column, i) => {
                  const says = row.developer_says?.[i] ?? null;
                  return (
                    <td
                      key={column.slug}
                      data-compare-cell={`${row.key}-${column.slug}`}
                      className="min-w-44 px-4 py-4 align-top text-body text-ink"
                    >
                      <p className="m-0">{cellText(row.cells[i] ?? null)}</p>
                      {says ? (
                        <p className="m-0 mt-2 rounded-panel bg-claim-bg px-3 py-2.5 text-caption text-ink2">
                          {says}
                        </p>
                      ) : null}
                    </td>
                  );
                })}
                {canAdd ? <td className="px-4 py-4" /> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddProjectSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        excludeSlugs={slugs}
        onAdd={(slug) => commit([...slugs, slug])}
      />
      <Toast message={notice} onDismiss={() => setNotice(null)} />
      <span className="sr-only" aria-live="polite">
        {isPending ? "Updating the comparison…" : null}
      </span>
    </div>
  );
}

function ColumnHead({
  column,
  canRemove,
  onRemove,
}: {
  column: CompareColumn;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const withheld = column.chip.kind === "withheld";
  return (
    <th
      scope="col"
      data-compare-column={column.slug}
      className="min-w-52 px-4 py-4 text-left align-bottom"
    >
      {column.image_url ? (
        <div className="relative mb-3 h-20 w-full overflow-hidden rounded-tile bg-track">
          <Image src={column.image_url} alt="" fill sizes="220px" className="object-cover" />
          <span className="absolute top-2 right-2 rounded-pill bg-bg-solid/90 px-2.5 py-0.5 text-caption">
            {COPY.illustrativeImage}
          </span>
        </div>
      ) : null}
      <h2 className="m-0 font-sans text-row-title font-semibold text-ink">{column.name}</h2>
      <p className="m-0 mt-1 text-caption text-ink2">
        {[column.developer_name, column.locality_line].filter(Boolean).join(" · ")}
      </p>
      {column.price_line ? (
        <p className="m-0 mt-1 text-caption font-semibold text-ink">{column.price_line}</p>
      ) : null}
      <div className="mt-3 flex flex-col items-start gap-1.5">
        <span className="text-caption font-semibold text-ink2">{COPY.bandRowLabel}</span>
        <RiskChip chip={column.chip} />
        {withheld ? (
          <Link
            href={`/gurugram/projects/${column.slug}#risk`}
            className="text-caption text-ink underline underline-offset-[0.2em]"
          >
            {COPY.factsOnlySeeWhy}
          </Link>
        ) : null}
      </div>
      {canRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${COPY.remove} ${column.name} from this comparison`}
          className="mt-3 inline-flex h-9 cursor-pointer items-center justify-center rounded-pill border-0 bg-transparent px-0 text-caption font-semibold text-ink underline underline-offset-[0.2em] transition-opacity duration-(--pl-motion-duration-press) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {COPY.remove}
        </button>
      ) : null}
    </th>
  );
}
