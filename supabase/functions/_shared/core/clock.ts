// Clocks (T29; BUILD_PLAN §9, AGENTS.md "Clock").
//
// Two kinds of time, never mixed:
//   wall time      real time: latency, timeouts, webhook timestamp tolerance, rate-limit windows.
//                  Always systemClock in a function; a fixed clock in tests.
//   business time  "today" for anything a buyer sees as a fact. In the fixture world
//                  (PLINTH_ENV test | fixture) it is frozen at 18 Oct 2026 12:00 IST, like
//                  ops.now() in SQL. Prefer the date the API returns (meta.generated_at); use
//                  businessClock only where the edge itself decides by date (quiet hours, digests).

import type { PlinthEnv } from "./env.ts";
import { isFrozenEnv } from "./env.ts";

export interface Clock {
  now(): Date;
}

/** The design "today" (DESIGN §5b; data as of 14 Oct 2026, model v1.2). */
export const FROZEN_AT = "2026-10-18T12:00:00+05:30";

export const systemClock: Clock = { now: () => new Date() };

/** A clock that always reads the same instant. */
export function fixedClock(at: string | Date = FROZEN_AT): Clock {
  const ms = new Date(at).getTime();
  if (Number.isNaN(ms)) throw new Error(`fixedClock: not a timestamp: ${String(at)}`);
  return { now: () => new Date(ms) };
}

/** Business time for an environment: frozen in the fixture world, real elsewhere. */
export function businessClock(env: PlinthEnv): Clock {
  return isFrozenEnv(env) ? fixedClock(FROZEN_AT) : systemClock;
}

const IST_OFFSET_MS = 330 * 60 * 1000;

/** The calendar date in India (IST, no DST) of an instant: YYYY-MM-DD. */
export function istDate(at: Date): string {
  return new Date(at.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Minutes since midnight IST (0–1439), for quiet hours. */
export function istMinuteOfDay(at: Date): number {
  const d = new Date(at.getTime() + IST_OFFSET_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}
