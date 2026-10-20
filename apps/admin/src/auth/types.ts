// The admin session shape this app reads off the JWT (API_CONTRACTS §5.4; T41's
// ops.custom_access_token_hook, PR #63): plinth_roles[] and aal, plus the email we
// show in the shell ("Signed in as …"). Nothing else leaves the server read.

export type AdminSession = {
  readonly email: string | null;
  readonly roles: readonly string[];
  /** Authenticator assurance level. "admin" needs aal2 (TOTP done this session). */
  readonly aal: "aal1" | "aal2" | null;
};

export function isAdmin(session: AdminSession): boolean {
  return session.roles.includes("admin") && session.aal === "aal2";
}
