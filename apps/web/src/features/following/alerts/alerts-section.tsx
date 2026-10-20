"use client";

// Alert settings (WORK_BREAKDOWN T49 Build: "alert settings (Daily 8 am /
// Weekly Sunday 9 am / Off)", "the number line"). The cadence choice calls
// the real api.alert_prefs_set; packages/fixtures/expected/alert_prefs_set
// only has payloads for the weekly ↔ off transition (Rohan's two seeded
// states), so picking Daily in fixture mode answers honestly rather than
// faking a save (actions.ts `setDigestCadenceAction`, same pattern as
// booked-section.tsx). `lines` and `number_line` are the server's own words,
// shown verbatim, never paraphrased.
import { SectionBand } from "@plinth/web-ui";
import type { Cadence } from "@plinth/contracts";
import type { AlertPrefs } from "@/src/data";
import Link from "next/link";
import { useState, useTransition } from "react";
import { setDigestCadenceAction } from "../actions";
import { ALERTS_COPY } from "../page/copy";

/** The digest's own cadence options (ALERTS_COPY.cadences); "instant" is for band_change/filings, never the digest. */
type DigestCadence = "daily_8am" | "weekly_sun_9am" | "off";

const CADENCES: readonly DigestCadence[] = ["daily_8am", "weekly_sun_9am", "off"];

function digestCadence(c: Cadence | undefined): DigestCadence {
  return c === "daily_8am" || c === "weekly_sun_9am" ? c : "off";
}

export function AlertsSection({ alertPrefs }: { alertPrefs: AlertPrefs | null }) {
  const [prefs, setPrefs] = useState(alertPrefs?.prefs ?? null);
  // The radio's own checked state: what the buyer picked, moves the instant
  // the input is clicked (ordinary radio behaviour). `prefs` only moves once
  // api.alert_prefs_set actually answers, and `status` says so either way —
  // never a confirmation the RPC didn't give (AGENTS.md rule 9).
  const [selected, setSelected] = useState(digestCadence(prefs?.whatsapp?.digest));
  const [status, setStatus] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <SectionBand id="alerts" tone="bg">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-h2 font-extrabold">{ALERTS_COPY.heading}</h2>
          <p className="m-0 max-w-[60ch] text-body text-ink2">{ALERTS_COPY.subheading}</p>
        </div>

        {prefs ? (
          <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
            <legend className="m-0 mb-1 font-semibold">{ALERTS_COPY.cadenceLabel}</legend>
            {CADENCES.map((option) => {
              const info = ALERTS_COPY.cadences[option];
              return (
                <label
                  key={option}
                  className="flex min-h-11 cursor-pointer items-start gap-3 rounded-panel bg-track p-4"
                >
                  <input
                    type="radio"
                    name="digest-cadence"
                    value={option}
                    checked={selected === option}
                    onChange={() => {
                      setSelected(option);
                      setStatus(null);
                      startTransition(async () => {
                        const result = await setDigestCadenceAction(prefs, option);
                        if (result.ok) setPrefs(result.value.prefs);
                        else setStatus(result.message);
                      });
                    }}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold">{info.name}</span>
                    <span className="block text-small text-ink2">{info.sub}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        ) : (
          <p className="m-0 text-body text-ink2">
            Fixture mode doesn&rsquo;t have your alert settings loaded yet.
          </p>
        )}

        {status ? (
          <p role="alert" className="m-0 text-small text-ink2">
            {status}
          </p>
        ) : null}

        {alertPrefs ? (
          <div className="flex flex-col gap-1">
            {alertPrefs.lines.map((line) => (
              <p key={line} className="m-0 text-small text-ink2">
                {line}
              </p>
            ))}
            {alertPrefs.number_line ? (
              <p className="m-0 text-small text-ink2">
                {alertPrefs.number_line}{" "}
                <Link href="/privacy" className="text-ink underline underline-offset-4">
                  {ALERTS_COPY.whoHasMyNumber}
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </SectionBand>
  );
}
