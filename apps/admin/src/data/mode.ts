// Which adapter serves /ops data, and whether auth itself runs for real (AGENTS.md
// "Fixture mode", BUILD_PLAN §9). A build-time mode, not a feature flag, shared with
// apps/web's PLINTH_DATA:
//
//   PLINTH_DATA=fixtures  no accounts, no network: every page renders as a fixture
//                         admin (admin role, aal2) with mock /ops data below.
//   PLINTH_DATA=supabase  real email OTP + TOTP sign-in; api.admin_* RPCs with the
//                         operator's session.
//
// Unset means fixtures in development and tests, so a fresh clone runs with nothing
// configured. A production build or server (NODE_ENV=production) refuses an unset
// value, same as apps/web/src/data/mode.ts.

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
