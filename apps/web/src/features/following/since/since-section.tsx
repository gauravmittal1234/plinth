"use client";

// "Since you last looked" (F-93, WebFollowing hero) and its sibling record
// section (fix-since-family.md §2 item 6: "the record splits at the replay
// date, so each change appears once"). One client island because the two
// sections share the replay's `cursor`: moving it slides events from the
// record up into the hero and back, never recomputing a sentence — only
// which of the server's own `line`s are shown (see page/events.ts).
//
// Jump chips are always on; the day-by-day slider only mounts when
// `since_replay_slider` is on (WORK_BREAKDOWN T49, flags.json: "R1 ships
// jump chips; the slider is optional").
import { Button, Pill, ReplaySlider, SectionBand } from "@plinth/web-ui";
import type { FollowingFeed } from "@plinth/contracts";
import { useMemo, useState, useTransition } from "react";
import { markSeenAction } from "../actions";
import { HERO_COPY, RECORD_COPY } from "../page/copy";
import { allEvents, eventsBefore, eventsSince } from "../page/events";
import { dateOnly, daysBetween, formatDate } from "../page/format";
import { EventRow } from "./event-row";

export function SinceYouLastLooked({
  feed,
  sliderOn,
}: {
  feed: FollowingFeed;
  sliderOn: boolean;
}) {
  const events = useMemo(() => allEvents(feed.changes, feed.record), [feed.changes, feed.record]);
  const replay = feed.replay;
  const days = useMemo(() => (replay ? daysBetween(replay.from, replay.to) : []), [replay]);
  const defaultCursor =
    (feed.since ? dateOnly(feed.since) : null) ?? replay?.to ?? events[0]?.occurred_on ?? "";

  const [cursor, setCursor] = useState(defaultCursor);
  const [seen, setSeen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visible = eventsSince(events, cursor);
  const earlier = eventsBefore(events, cursor);
  const unread = seen ? 0 : feed.changes.length;
  const atDefault = cursor === defaultCursor;
  const sliderIndex = days.indexOf(cursor);

  return (
    <>
      <SectionBand id="since" tone="bg">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="m-0 max-w-[22ch] text-balance font-display text-h1 font-bold">
              {feed.heading}
            </h1>
            <Button
              variant="secondary"
              disabled={isPending || unread === 0}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await markSeenAction();
                  if (result.ok) setSeen(true);
                  else setError(result.message);
                });
              }}
            >
              {HERO_COPY.markSeen}
            </Button>
          </div>

          <p className="m-0 max-w-[65ch] text-lead text-ink2">{feed.summary_line}</p>

          <div className="flex flex-wrap items-center gap-3">
            {feed.last_looked_line ? (
              <p className="m-0 text-small text-ink2">{feed.last_looked_line}</p>
            ) : null}
            <Pill tone={unread > 0 ? "accent" : "track"} data-testid="unread-badge">
              {unread > 0 ? HERO_COPY.unread(unread) : HERO_COPY.seen}
            </Pill>
            <a href="#record" className="text-small text-ink underline underline-offset-4">
              {HERO_COPY.openRecord}
            </a>
          </div>
          {error ? (
            <p role="alert" className="m-0 text-small text-ink2">
              {error}
            </p>
          ) : null}

          {replay ? (
            <div className="flex flex-col gap-4 rounded-panel bg-track p-5 sm:p-7">
              <h2 className="m-0 font-display text-h4 font-bold">
                {HERO_COPY.replayHeading}
              </h2>
              <p className="m-0 text-small text-ink2">{HERO_COPY.replayCaption}</p>
              <div
                role="group"
                aria-label={HERO_COPY.replayHeading}
                className="flex flex-wrap gap-2"
              >
                {replay.jump_chips.map((chip) => (
                  <Pill
                    key={chip.date}
                    as="button"
                    pressed={chip.date === cursor}
                    onClick={() => setCursor(chip.date)}
                  >
                    {chip.label}
                  </Pill>
                ))}
              </div>
              {sliderOn && sliderIndex >= 0 ? (
                <ReplaySlider
                  stops={days.map((d) => ({ label: formatDate(d) }))}
                  value={sliderIndex}
                  onChange={(i) => {
                    const next = days[i];
                    if (next) setCursor(next);
                  }}
                  label={<span>{HERO_COPY.replaySince(formatDate(cursor))}</span>}
                  previousLabel={HERO_COPY.earlier}
                  nextLabel={HERO_COPY.later}
                  showEnds={false}
                  surface="track"
                />
              ) : (
                <p className="m-0 text-small text-ink2">{HERO_COPY.replaySince(formatDate(cursor))}</p>
              )}
            </div>
          ) : null}

          {visible.length > 0 ? (
            <ul role="list" className="m-0 flex flex-col gap-4 p-0">
              {visible.map((event) => (
                <EventRow key={event.event_id} event={event} />
              ))}
            </ul>
          ) : null}

          {atDefault && feed.quiet.length > 0 ? (
            <ul role="list" className="m-0 flex flex-col gap-2 p-0">
              {feed.quiet.map((q) => (
                <li key={q.slug} className="text-body text-ink2">
                  {q.line}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </SectionBand>

      <SectionBand id="record" tone="track">
        <div className="flex flex-col gap-6">
          <h2 className="m-0 font-display text-section font-bold">
            {RECORD_COPY.heading(formatDate(cursor))}
          </h2>
          {earlier.length > 0 ? (
            <ul role="list" className="m-0 flex flex-col gap-4 p-0">
              {earlier.map((event) => (
                <EventRow key={event.event_id} event={event} />
              ))}
            </ul>
          ) : (
            <p className="m-0 text-body text-ink2">{RECORD_COPY.empty}</p>
          )}
        </div>
      </SectionBand>
    </>
  );
}
