"use client";

// "Have you booked any of these?" (WORK_BREAKDOWN T49 Build; fix-since-family
// §1 G-19): pick a followed project, then say whether you're just watching or
// have booked there. Choosing a side always reveals what booking adds (the
// payment/demand-letter/possession alerts, a real link to Pay-as-built, and
// the "What a booked buyer can do" explainer) — that's information, not a
// confirmation. Saving the choice is a separate, real write
// (api.set_follow_type); no packages/fixtures/expected/set_follow_type
// payload exists yet for any slug (a Handoff in this PR), so a fixture-mode
// save reports that honestly (actions.ts `setFollowTypeAction`) instead of
// claiming a save the server never made (AGENTS.md rule 9).
//
// INTEGRATION_NOTES.md asks T49 to "add the /guides/booked-buyer route", but
// apps/web/test/screens.test.ts enforces a closed, exactly-28-row SCREENS
// manifest ("needs a row here first, via the lead") and OWNERSHIP.md keeps
// apps/web/src/shell/** as T05's always — not a row this task can add
// itself. The explainer lives inline here instead (a native <details>, same
// disclosure pattern as records-section.tsx's pre-RERA history); a Handoff
// note asks the lead for the SCREENS row if a standalone URL is still wanted.
import { Button, Pill, SectionBand } from "@plinth/web-ui";
import type { FollowedProject, FollowType } from "@plinth/contracts";
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { setFollowTypeAction } from "../actions";
import { BOOKED_COPY } from "../page/copy";

export function BookedSection({ projects }: { projects: readonly FollowedProject[] }) {
  const [selected, setSelected] = useState<string | null>(projects[0]?.slug ?? null);
  const [chosen, setChosen] = useState<Record<string, FollowType>>(() =>
    Object.fromEntries(projects.map((p) => [p.slug, p.follow_type])),
  );
  const [saved, setSaved] = useState<Record<string, FollowType>>(chosen);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const groupId = useId();

  if (projects.length === 0) return null;
  const current = selected ? (chosen[selected] ?? "watching") : "watching";

  function choose(followType: FollowType) {
    if (!selected) return;
    setChosen((c) => ({ ...c, [selected]: followType }));
    setStatus(null);
    startTransition(async () => {
      const result = await setFollowTypeAction(selected, followType);
      if (result.ok) {
        setSaved((s) => ({ ...s, [selected]: result.value.follow_type }));
        setStatus(null);
      } else {
        setStatus(result.message);
      }
    });
  }

  return (
    <SectionBand id="booked" tone="bg">
      <div className="flex flex-col gap-6">
        <h2 className="m-0 font-display text-section font-bold">{BOOKED_COPY.heading}</h2>
        <p className="m-0 max-w-[60ch] text-body text-ink2">{BOOKED_COPY.subheading}</p>

        <div role="group" aria-label={BOOKED_COPY.heading} className="flex flex-wrap gap-2">
          {projects.map((p) => (
            <Pill
              key={p.slug}
              as="button"
              pressed={p.slug === selected}
              onClick={() => setSelected(p.slug)}
            >
              {p.name ?? p.slug}
              {saved[p.slug] === "booked" ? ` · ${BOOKED_COPY.bookedTitle}` : ""}
            </Pill>
          ))}
        </div>

        <div role="radiogroup" aria-labelledby={groupId} className="flex flex-col gap-3 sm:flex-row">
          <span id={groupId} className="sr-only">
            Follow type
          </span>
          {(
            [
              { value: "watching" as const, title: BOOKED_COPY.watchingTitle, sub: BOOKED_COPY.watchingSub },
              { value: "booked" as const, title: BOOKED_COPY.bookedTitle, sub: BOOKED_COPY.bookedSub },
            ] satisfies { value: FollowType; title: string; sub: string }[]
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={current === option.value}
              onClick={() => choose(option.value)}
              className="min-h-11 flex-1 rounded-panel bg-track p-4 text-left aria-checked:bg-inverse aria-checked:text-on-inverse"
            >
              <span className="block font-semibold">{option.title}</span>
              <span className="block text-small opacity-80">{option.sub}</span>
            </button>
          ))}
        </div>

        {current === "booked" ? (
          <div className="flex flex-col gap-3 rounded-panel bg-accent-soft p-5 text-on-accent-soft">
            <p className="m-0">{BOOKED_COPY.privateLine}</p>
            <p className="m-0">{BOOKED_COPY.familyLine}</p>
            <div className="mt-1">
              <Button asChild variant="tertiary">
                <Link href="/check/pay-as-built">{BOOKED_COPY.checkDemandLetter}</Link>
              </Button>
            </div>
            <details className="group">
              <summary className="cursor-pointer font-semibold">
                {BOOKED_COPY.whatABookedBuyerCanDo}
              </summary>
              <ul role="list" className="m-0 mt-3 flex flex-col gap-2 p-0 pl-5 [&>li]:list-disc">
                {BOOKED_COPY.whatABookedBuyerCanDoItems.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </details>
          </div>
        ) : null}

        <p role="status" aria-busy={isPending} className="m-0 text-small text-ink2">
          {status}
        </p>
      </div>
    </SectionBand>
  );
}
