// Which adapter serves data (BUILD_PLAN §9, AGENTS.md "Fixture mode"). A build-
// time mode, not a feature flag. Stub from T05; T16 owns src/data/**.
//
//   PLINTH_DATA=fixtures  packages/fixtures/expected, no accounts, no network
//   PLINTH_DATA=supabase  api.* RPCs with the publishable key / user session
//
// Unset means fixtures, so a fresh clone runs with nothing configured.

export const DATA_MODES = ["fixtures", "supabase"] as const;
export type DataMode = (typeof DATA_MODES)[number];

export function dataMode(value: string | undefined = process.env.PLINTH_DATA): DataMode {
  if (value === undefined || value === "" || value === "fixtures") return "fixtures";
  if (value === "supabase") return "supabase";
  throw new Error(`PLINTH_DATA must be "fixtures" or "supabase", not "${value}"`);
}
