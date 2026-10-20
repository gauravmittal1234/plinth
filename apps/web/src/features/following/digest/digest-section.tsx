// "What lands every Sunday?" (WORK_BREAKDOWN T49 Build: "digest preview").
// There is no separate digest-content RPC, so the preview is built from the
// same dated events the hero already shows (page/events.ts), filtered to
// the last 7 days ending on the replay window's `to` (the fixture clock,
// never the device, AGENTS.md "Clock") — every line still the server's own.
import { SectionBand } from "@plinth/web-ui";
import type { FollowingFeed } from "@plinth/contracts";
import { DIGEST_COPY } from "../page/copy";
import { allEvents, eventsSince } from "../page/events";
import { formatDate, shiftDate } from "../page/format";

export function DigestSection({ feed }: { feed: FollowingFeed }) {
  const events = allEvents(feed.changes, feed.record);
  const today = feed.replay?.to ?? events[0]?.occurred_on ?? null;
  const weekStart = today ? shiftDate(today, -6) : null;
  const week = today && weekStart ? eventsSince(events, weekStart) : [];

  return (
    <SectionBand id="digest" tone="track">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-h2 font-extrabold">{DIGEST_COPY.heading}</h2>
          <p className="m-0 max-w-[60ch] text-body text-ink2">{DIGEST_COPY.subheading}</p>
        </div>

        {today && weekStart ? (
          <div className="flex flex-col gap-4 rounded-panel bg-bg-solid p-5 sm:p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="m-0 font-display text-h4 font-extrabold">{DIGEST_COPY.weekHeading}</h3>
              <p className="m-0 text-small text-ink2">
                {`${formatDate(weekStart)} – ${formatDate(today)} · ${DIGEST_COPY.weekCount(week.length)}`}
              </p>
            </div>
            {week.length > 0 ? (
              <ul role="list" className="m-0 flex flex-col gap-3 p-0">
                {week.map((event) => (
                  <li key={event.event_id} className="text-body text-ink">
                    {event.line}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="m-0 text-small text-ink2">{DIGEST_COPY.utilityLine}</p>
          </div>
        ) : null}

        {feed.digest?.next_line ? (
          <p className="m-0 text-body text-ink">{feed.digest.next_line}</p>
        ) : null}
      </div>
    </SectionBand>
  );
}
