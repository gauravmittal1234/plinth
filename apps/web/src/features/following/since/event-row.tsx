// One dated change (ChangeItem): the server's own `line` verbatim, its
// before/after pill, a "Developer says" field when the fixture carries one,
// and every source chip. Nothing here composes a sentence — a band change's
// pills are the only ones re-drawn as real risk chips (events.ts
// `bandChipFromPill`), because a band name is "a server chip", never plain
// text (the brief's own rule for this page).
//
// A feed's `developer_says` is the contract's short form, `DeveloperSaysLine`
// (`{ line }` only) — not the full `DeveloperSays`/`DeveloperResponse` shape
// `@plinth/web-ui`'s `DeveloperSaysField` takes, so this renders the same
// claim-tone field by hand rather than widen that shared component's props
// (packages/web-ui is T14's).
import { Pill, RiskChip, SourceChip } from "@plinth/web-ui";
import type { ChangeItem } from "@plinth/contracts";
import { bandChipFromPill, isBandChange } from "../page/events";
import { formatDate } from "../page/format";

function DeveloperSaysNote({ line }: { line: string }) {
  return (
    <p data-lane="developer_says" className="m-0 rounded-panel bg-claim-bg px-4 py-3 text-ink2">
      {line}
    </p>
  );
}

export function EventRow({ event }: { event: ChangeItem }) {
  const band = isBandChange(event);
  const bandBefore = band ? bandChipFromPill(event.before_pill) : null;
  const bandAfter = band ? bandChipFromPill(event.after_pill) : null;
  const hasPills = Boolean(event.before_pill || event.after_pill);

  return (
    <li
      data-kind={event.kind}
      data-date={event.occurred_on}
      className="flex flex-col gap-2.5 rounded-panel bg-bg-solid p-5 sm:p-6"
    >
      <p className="m-0 text-small text-ink2">{formatDate(event.occurred_on)}</p>
      <p className="m-0 text-body text-ink">{event.line}</p>
      {bandBefore && bandAfter ? (
        <div className="flex flex-wrap items-center gap-2">
          <RiskChip chip={bandBefore} surface="track" />
          <span aria-hidden="true" className="text-ink2">
            →
          </span>
          <RiskChip chip={bandAfter} surface="track" />
        </div>
      ) : hasPills ? (
        <div className="flex flex-wrap items-center gap-2">
          {event.before_pill ? <Pill tone="track">{event.before_pill}</Pill> : null}
          {event.before_pill && event.after_pill ? (
            <span aria-hidden="true" className="text-ink2">
              →
            </span>
          ) : null}
          {event.after_pill ? <Pill tone="track">{event.after_pill}</Pill> : null}
        </div>
      ) : null}
      {event.developer_says ? <DeveloperSaysNote line={event.developer_says.line} /> : null}
      {event.sources.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {event.sources.map((source, i) => (
            <SourceChip key={`${source.label}-${i}`} source={source} surface="track" />
          ))}
        </div>
      ) : null}
    </li>
  );
}
