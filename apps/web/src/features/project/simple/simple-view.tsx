"use client";

// Simple view (WORK_BREAKDOWN §4 T20b; fix-project2.md §1 G-27). Large type —
// 24 px body on web, 21 px on phone — behind the header's "Simple view"
// toggle (HERO_COPY.simpleView; the toggle itself and the route's `?view=`
// switch are a handoff to whoever wires project-page.tsx, noted in this PR).
// Six blocks: the band and one sentence, the keys range, why it's less
// certain (the hatching's text alternative), 3 reasons, how much is built
// (with Earlier/Later buttons instead of the replay drag) and what we can
// do, then Follow and a link back to the full page. "Read this aloud" steps
// through the same six blocks with the Web Speech API, highlighting the one
// being read, and stops on a second tap — no server round trip, no fixture.
import type { BandRange, ProjectPage } from "@plinth/contracts";
import { Button, ConfidenceDots, Meter } from "@plinth/web-ui";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const COPY = {
  heading: "Will it be delivered on time?",
  keysHeading: "When might we get the keys?",
  whyHeading: "Why",
  builtHeading: "How much is built?",
  earlier: "Earlier report",
  later: "Later report",
  nextHeading: "What can we do?",
  follow: "Follow",
  back: "Back to the full page",
  read: "Read this aloud",
  stop: "Stop reading",
  englishLabel: "English",
};

type Block = { id: string; speech: string };

function useReadAloud(blocks: readonly Block[]) {
  const [reading, setReading] = useState<number | null>(null);
  const cancelledRef = useRef(false);

  const stop = () => {
    cancelledRef.current = true;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setReading(null);
  };

  const start = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    cancelledRef.current = false;
    window.speechSynthesis.cancel();
    const speakFrom = (index: number) => {
      if (cancelledRef.current || index >= blocks.length) {
        setReading(null);
        return;
      }
      setReading(index);
      const utterance = new SpeechSynthesisUtterance(blocks[index]!.speech);
      utterance.lang = "en-IN";
      utterance.onend = () => speakFrom(index + 1);
      utterance.onerror = () => setReading(null);
      window.speechSynthesis.speak(utterance);
    };
    speakFrom(0);
  };

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  return { reading, toggle: () => (reading === null ? start() : stop()) };
}

export function SimpleView({
  page,
  bands,
}: {
  page: ProjectPage;
  bands: readonly BandRange[];
}) {
  const { risk, next_steps: nextSteps } = page;
  const bandLabel = risk.band?.label ?? risk.chip.label;
  const step = risk.band?.step ?? null;
  const first = bands[0];
  const last = bands.at(-1);

  const quarters = page.progress.quarters;
  const [index, setIndex] = useState(Math.max(0, quarters.length - 1));
  const atToday = index >= quarters.length;
  const quarter = atToday ? null : quarters[index];
  const builtLine = atToday
    ? risk.progress.line
    : (quarter?.note_line ?? `${quarter?.built_pct ?? 0}% built, ${quarter?.sold_pct ?? 0}% sold.`);

  const reasons = risk.reasons.slice(0, 3);
  const steps = nextSteps.steps.slice(0, 3);

  const blocks: Block[] = [
    {
      id: "band",
      speech: step
        ? `Delivery risk: ${bandLabel}. Step ${step} of our five, from ${first?.label} to ${last?.label}.`
        : `Delivery risk: ${bandLabel}.`,
    },
    { id: "keys", speech: risk.late12.line },
    { id: "why-certain", speech: risk.confidence?.line ?? "" },
    {
      id: "reasons",
      speech: reasons.map((r) => r.text).join(" "),
    },
    { id: "built", speech: builtLine },
    {
      id: "next",
      speech: [nextSteps.intro_line, ...steps.map((s) => `${s.heading} ${s.body}`)].join(" "),
    },
  ];
  const { reading, toggle } = useReadAloud(blocks);

  const blockClass = (i: number) =>
    reading === i ? "rounded-panel bg-accent-soft p-4 -mx-4" : "p-4 -mx-4";

  return (
    <main className="mx-auto flex w-full max-w-[40rem] flex-col gap-10 px-4 py-10 text-[21px] leading-[1.5] sm:text-[24px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="m-0 text-[15px] text-ink2">
          {page.risk.phase.name} · {page.risk.phase.locality_line}, Gurugram · large-text view
        </p>
        <Button variant="secondary" size="md" onClick={toggle} aria-pressed={reading !== null}>
          {reading !== null ? COPY.stop : COPY.read}
          <span className="text-[15px] text-ink2">· {COPY.englishLabel}</span>
        </Button>
      </div>

      <section className={blockClass(0)}>
        <h1 className="m-0 font-display text-h2 font-bold">{COPY.heading}</h1>
        <div className="mt-4 flex items-center gap-4">
          <Meter chip={risk.chip} size="l" />
          <span className="font-display text-h2 font-bold">{bandLabel}</span>
        </div>
        {step ? (
          <p className="mt-3 mb-0">
            Step {step} of our five, from {first?.label} to {last?.label}.
          </p>
        ) : null}
      </section>

      <section className={blockClass(1)}>
        <h2 className="m-0 font-sans text-h3 font-bold">{COPY.keysHeading}</h2>
        <p className="mt-3 mb-0">{risk.late12.line}</p>
        <p className="mt-3 mb-0">{risk.late12.oc_not_keys_line}</p>
      </section>

      {risk.confidence ? (
        <section className={blockClass(2)}>
          <ConfidenceDots confidence={risk.confidence} />
        </section>
      ) : null}

      {reasons.length > 0 ? (
        <section className={blockClass(3)}>
          <h2 className="m-0 font-sans text-h3 font-bold">
            {COPY.whyHeading} {bandLabel}?
          </h2>
          <ul role="list" className="m-0 mt-3 flex flex-col gap-4 p-0">
            {reasons.map((reason) => (
              <li key={reason.rank}>
                <p className="m-0">{reason.text}</p>
                <p className="m-0 text-[15px] text-ink2">Source: {reason.sources[0].label}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={blockClass(4)}>
        <h2 className="m-0 font-sans text-h3 font-bold">{COPY.builtHeading}</h2>
        <p className="mt-3 mb-0">{builtLine}</p>
        <div className="mt-4 flex gap-3">
          <Button
            variant="secondary"
            size="md"
            aria-disabled={index <= 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            {COPY.earlier}
          </Button>
          <Button
            variant="secondary"
            size="md"
            aria-disabled={index >= quarters.length}
            onClick={() => setIndex((i) => Math.min(quarters.length, i + 1))}
          >
            {COPY.later}
          </Button>
        </div>
      </section>

      <section className={blockClass(5)}>
        <h2 className="m-0 font-sans text-h3 font-bold">{COPY.nextHeading}</h2>
        <p className="mt-3 mb-0">{nextSteps.intro_line}</p>
        <ol role="list" className="m-0 mt-3 flex flex-col gap-3 p-0">
          {steps.map((s, i) => (
            <li key={i}>
              <p className="m-0 font-bold">{s.heading}</p>
              <p className="m-0">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Button size="lg" asChild>
          <Link href={`/sign-in?next=/gurugram/projects/${risk.phase.slug}`}>{COPY.follow}</Link>
        </Button>
        <Link href={`/gurugram/projects/${risk.phase.slug}`} className="text-ink underline">
          {COPY.back}
        </Link>
      </div>
    </main>
  );
}
