// Which adapter serves data (BUILD_PLAN §9, AGENTS.md "Fixture mode"). A build-
// time mode, not a feature flag.
//
//   PLINTH_DATA=fixtures  packages/fixtures/expected, no accounts, no network
//   PLINTH_DATA=supabase  api.* RPCs with the publishable key / user session
//
// Unset means fixtures in development and tests, so a fresh clone runs with
// nothing configured. A production build or server (NODE_ENV=production)
// refuses an unset value: it must say which world it serves, so a deploy with
// a missing variable never quietly shows the fixture world (INTEGRATION_NOTES, T16).

export const DATA_MODES = ["fixtures", "supabase"] as const;
export type DataMode = (typeof DATA_MODES)[number];

export function dataMode(
  value: string | undefined = process.env.PLINTH_DATA,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): DataMode {
  if (value === "fixtures" || value === "supabase") return value;
  if (value === undefined || value === "") {
    if (nodeEnv === "production") {
      throw new Error(
        'PLINTH_DATA is not set. A production build or server must choose its data: "fixtures" or "supabase".',
      );
    }
    return "fixtures";
  }
  throw new Error(`PLINTH_DATA must be "fixtures" or "supabase", not "${value}"`);
}
