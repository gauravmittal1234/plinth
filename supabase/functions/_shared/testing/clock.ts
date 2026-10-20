// A frozen clock for tests (AGENTS.md "Clock": 18 Oct 2026, 12:00 IST), movable on purpose.

import type { Clock } from "../core/clock.ts";
import { FROZEN_AT } from "../core/clock.ts";

export interface TestClock extends Clock {
  /** Moves the clock forward (or back, with a negative number) by milliseconds. */
  advance(ms: number): void;
  set(at: string | Date): void;
}

export const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export function frozenClock(at: string | Date = FROZEN_AT): TestClock {
  let ms = new Date(at).getTime();
  if (Number.isNaN(ms)) throw new Error(`frozenClock: not a timestamp: ${String(at)}`);
  return {
    now: () => new Date(ms),
    advance: (delta) => {
      ms += delta;
    },
    set: (to) => {
      ms = new Date(to).getTime();
    },
  };
}
