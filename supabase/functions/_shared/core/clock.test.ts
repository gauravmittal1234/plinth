import { assertEquals, assertThrows, DAY, frozenClock, HOUR } from "../testing/mod.ts";
import {
  businessClock,
  fixedClock,
  FROZEN_AT,
  istDate,
  istMinuteOfDay,
  systemClock,
} from "./clock.ts";

Deno.test("the frozen instant is 18 Oct 2026, 12:00 IST", () => {
  assertEquals(fixedClock().now().toISOString(), "2026-10-18T06:30:00.000Z");
  assertEquals(istDate(new Date(FROZEN_AT)), "2026-10-18");
  assertEquals(istMinuteOfDay(new Date(FROZEN_AT)), 12 * 60);
  assertThrows(() => fixedClock("not a date"));
});

Deno.test("business time is frozen in test and fixture, real elsewhere", () => {
  assertEquals(businessClock("test").now().toISOString(), "2026-10-18T06:30:00.000Z");
  assertEquals(businessClock("fixture").now().toISOString(), "2026-10-18T06:30:00.000Z");
  assertEquals(businessClock("prod"), systemClock);
  assertEquals(businessClock("dev"), systemClock);
});

Deno.test("IST dates roll over at 18:30 UTC", () => {
  assertEquals(istDate(new Date("2026-10-18T18:29:59Z")), "2026-10-18");
  assertEquals(istDate(new Date("2026-10-18T18:30:00Z")), "2026-10-19");
  assertEquals(istMinuteOfDay(new Date("2026-10-18T02:30:00Z")), 8 * 60);
});

Deno.test("the test clock moves only when told", () => {
  const c = frozenClock();
  const t0 = c.now().getTime();
  c.advance(7 * DAY + 3 * HOUR);
  assertEquals(c.now().getTime() - t0, 7 * DAY + 3 * HOUR);
  c.set("2026-10-25T09:00:00+05:30");
  assertEquals(istDate(c.now()), "2026-10-25");
});
