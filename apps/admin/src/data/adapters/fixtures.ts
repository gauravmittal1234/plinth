// The fixtures adapter (PLINTH_DATA=fixtures): no accounts, no network. Serves the
// canned payloads in src/data/fixtures/*, with admin_flag_set applying to the small
// in-memory override map (fixture-session.ts) so a toggle in the UI sticks.
import "server-only";
import { FIXTURE_FLAGS } from "../fixtures/flags";
import { FIXTURE_OUTBOX } from "../fixtures/outbox";
import { FIXTURE_SOURCE_FRESHNESS } from "../fixtures/source-freshness";
import type { AdminFlag, AdminFlags, AdminOutbox, AdminSourceFreshness } from "../types";
import { flagOverride, setFlagOverride } from "./fixture-session";

export function fixtureAdminOutbox(): AdminOutbox {
  return FIXTURE_OUTBOX;
}

export function fixtureAdminSourceFreshness(): AdminSourceFreshness {
  return FIXTURE_SOURCE_FRESHNESS;
}

function withOverride(flag: AdminFlag): AdminFlag {
  const override = flagOverride(flag.key);
  return override === undefined ? flag : { ...flag, enabled: override };
}

export function fixtureAdminFlags(): AdminFlags {
  return { schema: "plinth.admin_flags/1", flags: FIXTURE_FLAGS.map(withOverride) };
}

export class FixtureAdminError extends Error {
  constructor(readonly code: "not_found" | "invalid_input", message: string) {
    super(message);
  }
}

export function fixtureAdminFlagSet(key: string, enabled: boolean): AdminFlag {
  const found = FIXTURE_FLAGS.find((f) => f.key === key);
  if (!found) throw new FixtureAdminError("not_found", `No flag "${key}".`);
  setFlagOverride(key, enabled);
  return { ...found, enabled };
}
