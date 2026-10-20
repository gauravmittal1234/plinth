// Shapes returned by the api.admin_* RPCs (supabase/migrations/20261126000100_t54_
// admin_ops_rpcs.sql). Kept local to this app: API_CONTRACTS §3.4 names the four
// functions but defines no JSON Schema for them yet, unlike the buyer-facing
// contracts in packages/contracts.

export type OutboxRow = {
  readonly id: string;
  readonly channel: string;
  readonly template_code: string | null;
  readonly status?: string;
  readonly attempts?: number;
  readonly last_error?: string | null;
  readonly payload?: unknown;
  readonly created_at: string;
};

export type AdminOutbox = {
  readonly schema: "plinth.admin_outbox/1";
  /** False until T42 (comms.outbox) merges (PR #63); every count and list is then empty. */
  readonly available: boolean;
  readonly counts: Readonly<Record<string, number>>;
  readonly by_channel: Readonly<Record<string, number>>;
  readonly recent_failures: readonly OutboxRow[];
  readonly recent: readonly OutboxRow[];
};

export type SourceFreshness = {
  readonly code: string;
  readonly name: string;
  readonly cadence_seconds: number | null;
  readonly last_fetched_at: string | null;
  readonly snapshots_total: number;
  readonly age_seconds: number | null;
  readonly stale: boolean | null;
};

export type AdminSourceFreshness = {
  readonly schema: "plinth.admin_source_freshness/1";
  readonly sources: readonly SourceFreshness[];
};

export type AdminFlag = {
  readonly key: string;
  readonly enabled: boolean;
  readonly rollout_pct: number;
  readonly audience: string;
  readonly surfaces: readonly string[];
  readonly note: string | null;
  readonly updated_at: string;
};

export type AdminFlags = {
  readonly schema: "plinth.admin_flags/1";
  readonly flags: readonly AdminFlag[];
};
