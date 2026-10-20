// The fixture adapter's in-memory session: every write a fixture-mode server
// accepted, in order, plus the first result of each client id (API_CONTRACTS §1
// "Idempotency": a replay returns the first result).
//
// One session per server process, kept on globalThis so a dev-server reload
// keeps it. It starts empty: the fixture world's own follows, prefs and
// consents are read-only expected payloads (T03b), and a write never edits them.
import "server-only";
import { FIXED_NOW } from "@plinth/fixtures";
import type { RpcArgs, RpcName } from "../registry";

export type FixtureWrite = {
  readonly rpc: RpcName;
  readonly args: RpcArgs;
  readonly result: unknown;
  /** The frozen fixture clock (AGENTS.md "Clock"). */
  readonly at: string;
};

type Session = {
  writes: FixtureWrite[];
  replays: Map<string, unknown>;
};

const KEY = Symbol.for("plinth.web.fixtureSession");
type Holder = { [KEY]?: Session };

function session(): Session {
  const holder = globalThis as Holder;
  holder[KEY] ??= { writes: [], replays: new Map() };
  return holder[KEY];
}

const replayKey = (rpc: RpcName, clientId: string) => `${rpc}:${clientId}`;

/** The first result recorded for this client id, or undefined. */
export function replayOf(rpc: RpcName, clientId: string | null): unknown {
  return clientId === null ? undefined : session().replays.get(replayKey(rpc, clientId));
}

export function recordWrite(rpc: RpcName, args: RpcArgs, result: unknown): void {
  const s = session();
  s.writes.push({ rpc, args, result, at: FIXED_NOW });
  const clientId = args.p_client_id;
  if (typeof clientId === "string") s.replays.set(replayKey(rpc, clientId), result);
}

export type FixtureSessionView = {
  readonly writes: readonly FixtureWrite[];
  /** Follows made in this session: slug → follow type (follow, set_follow_type, unfollow). */
  readonly follows: ReadonlyMap<string, string>;
};

/** What this session has written so far (tests and fixture-mode tooling). */
export function fixtureSession(): FixtureSessionView {
  const writes = [...session().writes];
  const follows = new Map<string, string>();
  for (const w of writes) {
    const slug = typeof w.args.p_slug === "string" ? w.args.p_slug : null;
    if (!slug) continue;
    if (w.rpc === "follow" || w.rpc === "set_follow_type") {
      follows.set(slug, String(w.args.p_follow_type));
    } else if (w.rpc === "unfollow") {
      follows.delete(slug);
    }
  }
  return { writes, follows };
}

export function resetFixtureSession(): void {
  const s = session();
  s.writes = [];
  s.replays.clear();
}
