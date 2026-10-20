// The promised-vs-actual timeline (Build: "the promised-vs-actual timeline
// (signature)"): one track per finished project, a dot at its original RERA
// date and a bar to its OC, coloured by whether that OC was late. The bar is
// decorative (`aria-hidden`); the project's own `line` ("OC came 27 months
// after the original RERA date…") already carries the fact in words, so a
// screen reader loses nothing.
import type { TrackRecordProject } from "@plinth/contracts";
import { bandStyle, SourceChip } from "@plinth/web-ui";
import { TRACK_RECORD_COPY } from "../../page/copy";
import { formatMonth, monthFraction } from "../../page/format";
import { sourceRefs, strField } from "../../page/safe";

type Span = { startPct: number; endPct: number } | null;

function spanOf(promised: string | null, ocOn: string | null, min: number, scale: number): Span {
  const p = monthFraction(promised);
  const o = monthFraction(ocOn);
  if (p === null || o === null || scale <= 0) return null;
  return { startPct: ((p - min) / scale) * 100, endPct: ((o - min) / scale) * 100 };
}

function TimelineRow({
  project,
  min,
  scale,
}: {
  project: TrackRecordProject;
  min: number;
  scale: number;
}) {
  const rera = strField(project, "rera_number");
  const line = strField(project, "line");
  const sources = sourceRefs(project, "sources");
  const span = spanOf(project.promised, project.oc_on, min, scale);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 font-semibold text-ink">{project.name}</p>
        {rera ? <p className="m-0 text-caption text-ink2">RERA {rera}</p> : null}
      </div>

      {span ? (
        <div aria-hidden="true" className="relative h-2 w-full rounded-full bg-track">
          <span
            className="absolute top-0 h-2 rounded-full bg-(--ui-band-fill)"
            style={{
              left: `${Math.min(span.startPct, span.endPct)}%`,
              width: `${Math.max(Math.abs(span.endPct - span.startPct), 0.8)}%`,
              ...bandStyle(project.late ? "high" : "low"),
            }}
          />
          <span
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-bg"
            style={{ left: `${span.startPct}%` }}
          />
        </div>
      ) : null}

      <p className="m-0 text-small text-ink2">
        {project.promised ? (
          <>
            {TRACK_RECORD_COPY.promisedLabel}: {formatMonth(project.promised)}
          </>
        ) : null}
        {project.promised && project.oc_on ? " · " : null}
        {project.oc_on ? (
          <>
            {TRACK_RECORD_COPY.ocLabel}: {formatMonth(project.oc_on)}
          </>
        ) : null}
      </p>

      {line ? <p className="m-0 text-body">{line}</p> : null}

      {sources.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sources.map((s, i) => (
            <SourceChip key={i} source={s} surface="track" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Timeline({ projects }: { projects: readonly TrackRecordProject[] }) {
  const fractions = projects
    .flatMap((p) => [monthFraction(p.promised), monthFraction(p.oc_on)])
    .filter((n): n is number => n !== null);
  const min = fractions.length > 0 ? Math.min(...fractions) : 0;
  const max = fractions.length > 0 ? Math.max(...fractions) : 1;
  const scale = Math.max(max - min, 1 / 12);

  return (
    <ol className="m-0 flex flex-col gap-6 p-0">
      {projects.map((p, i) => (
        <li key={`${p.name}-${i}`}>
          <TimelineRow project={p} min={min} scale={scale} />
        </li>
      ))}
    </ol>
  );
}
