// The fixture adapter's in-memory flag overrides: every admin_flag_set call a
// fixture-mode server accepted, kept on globalThis so a dev-server reload keeps them
// (apps/web's src/data/adapters/fixture-session.ts, scoped down to one RPC).
import "server-only";

const KEY = Symbol.for("plinth.admin.fixtureFlagOverrides");
type Holder = { [KEY]?: Map<string, boolean> };

function overrides(): Map<string, boolean> {
  const holder = globalThis as Holder;
  holder[KEY] ??= new Map();
  return holder[KEY];
}

export function flagOverride(key: string): boolean | undefined {
  return overrides().get(key);
}

export function setFlagOverride(key: string, enabled: boolean): void {
  overrides().set(key, enabled);
}

export function resetFlagOverrides(): void {
  overrides().clear();
}
