// The fixture world's signed-in operator (AGENTS.md "Fixture mode must work without
// Supabase"; DESIGN §5b fixture people). No accounts, no network: every visit to the
// admin shell in PLINTH_DATA=fixtures renders as this already-elevated admin, so the
// shell, /ops and the review-queue placeholders can be built and tested without a
// Supabase project.
import type { AdminSession } from "./types";

export const FIXTURE_ADMIN_SESSION: AdminSession = {
  email: "admin@plinth.test",
  roles: ["admin"],
  aal: "aal2",
};
