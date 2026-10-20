-- T43b · Alert fan-out 5/5: deterministic core.events ids, and a guard so a
-- backfilled earlier price list does not log its own feed event
-- (following_feed contract test: packages/fixtures/expected/following_feed/
-- rohan.json). Replaces two T43a functions (20261113000100, 20261113000200)
-- with CREATE OR REPLACE; T43a's migrations themselves are untouched
-- (AGENTS.md "never edit a merged migration").
--
-- core._emit_event (T43a) inserted with core.events.id's gen_random_uuid()
-- default, so the same underlying change (a QPR filing, a price list, a band
-- move, …) got a different id every time the row was derived — fine for the
-- live system, but it means the fixtures generator (packages/fixtures/src/
-- author/people.mjs, which authors the *expected* following_feed payload by
-- hand) could never predict an id ahead of the database computing it. This
-- migration makes the id a pure function of (kind, the triggering row's own
-- id) via core.uuid5 below, so both sides compute the same value with no
-- coordination, and re-deriving the same event twice is a harmless no-op
-- (`on conflict (id) do nothing`) rather than a duplicate — the dedupe/
-- idempotency AGENTS.md asks T43b to keep.
--
-- core.uuid5 reimplements RFC 4122 UUID v5 (SHA-1) with pgcrypto's digest()
-- (enabled at T04, 20261020000100) rather than the uuid-ossp extension:
-- uuid-ossp is not in this project's pinned extension set (AGENTS.md §3) and
-- `extensions.uuid_generate_v5` is unavailable in the PGlite check harness
-- (supabase/tools/pglite-check.mjs). The hash and namespace are identical to
-- packages/fixtures/src/author/lib.mjs uuid5(kind, key): UUID v5 of
-- "https://plinth.in/fixtures/<kind>/<key>" in the URL namespace
-- 6ba7b811-9dad-11d1-80b4-00c04fd430c8.
create function core.uuid5(p_kind text, p_key text)
returns uuid
language sql
immutable
parallel safe
set search_path = ''
as $$
  select (
    pg_catalog.substr(h, 1, 12) || '5' || pg_catalog.substr(h, 14, 3) ||
    pg_catalog.to_hex(8 + (pg_catalog.get_byte(
      pg_catalog.decode('0' || pg_catalog.substr(h, 17, 1), 'hex'), 0
    ) % 4)) ||
    pg_catalog.substr(h, 18, 15)
  )::uuid
  from (
    select pg_catalog.encode(
      extensions.digest(
        '\x6ba7b8119dad11d180b400c04fd430c8'::bytea
          || pg_catalog.convert_to('https://plinth.in/fixtures/' || p_kind || '/' || p_key, 'utf8'),
        'sha1'
      ),
      'hex'
    ) as h
  ) x
$$;
comment on function core.uuid5(text, text) is 'RFC 4122 UUID v5, bit for bit the same value packages/fixtures/src/author/lib.mjs uuid5(kind, key) computes in JS (same SHA-1 hash of the same namespace + name string), so a deterministic id computed here and one predicted by the fixtures generator are always equal.';

-- Lockdown (BUILD_PLAN §12.1): a function created after 20261122000400_t43b_following_feed.sql's
-- schema-wide sweep starts with a fresh PUBLIC execute grant that sweep never touched (same T44/
-- T54 precedent that migration's own header cites). core.uuid5 is internal only (core._emit_event
-- calls it; no api.* function does), so it is revoked by name rather than re-run broadly.
revoke all on function core.uuid5(text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- core._emit_event: same signature and behaviour as T43a's, except the id is
-- core.uuid5('event', kind || '/' || the triggering row's own id) instead of
-- the table's gen_random_uuid() default. Every call site in 20261113* passes
-- exactly the triggering row's id as p_fact_ids[1] (qpr_filings.id,
-- extensions.id, ws.price_lists.id, score_runs.id via run_id, …), which is
-- itself already deterministic in the fixtures (packages/fixtures/src/author/
-- canonical.mjs, scoring.mjs: every source row's id is uuid5(kind, key) too),
-- so this composes into a stable id without this function needing to know
-- which table p_fact_ids[1] came from. The rare call with no fact id at all
-- (band_changed when run_id is null) falls back to phase + kind + date, still
-- deterministic, just not fact-anchored.
-- ---------------------------------------------------------------------------
create or replace function core._emit_event(
  p_phase_id uuid,
  p_kind text,
  p_occurred_on date,
  p_detected_at timestamptz,
  p_before jsonb,
  p_after jsonb,
  p_fact_ids uuid[],
  p_run_id uuid default null,
  p_public boolean default true,
  p_summary_text text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_key text;
begin
  v_key := case
    when p_fact_ids is not null and pg_catalog.array_length(p_fact_ids, 1) >= 1
      then p_fact_ids[1]::text
    else p_phase_id::text || '/' || p_occurred_on::text
  end;
  v_id := core.uuid5('event', p_kind || '/' || v_key);
  insert into core.events (id, phase_id, kind, occurred_on, detected_at, public, summary_text, before, after, fact_ids, run_id)
  values (v_id, p_phase_id, p_kind, p_occurred_on, p_detected_at, coalesce(p_public, true), p_summary_text,
          p_before, p_after, coalesce(p_fact_ids, '{}'::uuid[]), p_run_id)
  on conflict (id) do nothing;
  return v_id;
end
$$;
comment on function core._emit_event(uuid, text, date, timestamptz, jsonb, jsonb, uuid[], uuid, boolean, text) is 'Internal: inserts one core.events row with a stable id (core.uuid5 of the kind and the triggering row''s own id via p_fact_ids[1]), so re-deriving the same event twice is a no-op (on conflict do nothing) instead of a duplicate. Called only from the trigger functions in supabase/migrations/20261113*, never directly.';

-- ---------------------------------------------------------------------------
-- core.events_from_price_list: same as T43a's, plus a guard that only the
-- phase's newest published list logs an event. Without it, seeding a price
-- list dated earlier than one that already exists (exactly what adding
-- Sapphire Grove Ph 1's 1 Sep 2026 list, DESIGN.md §5b, does — it is a
-- backfill into a chronology the 16 Oct 2026 list already completes) would
-- also log its own price_list_published, which core.following_change_item
-- cannot render correctly: it always reads the phase's *current* price.quoted
-- fact (by design — a buyer should see today's price, not a stale one), so a
-- backfilled list's own event would show today's price under a historical
-- date. The 1 Sep list still does its job without an event of its own:
-- core.following_change_item's existing before-price fallback (an earlier
-- published ws.price_lists row for the same phase) finds it directly. A
-- phase whose only list is genuinely new (Kestrel Park, Coral Towers: no
-- earlier row to diff, nothing backfilled after it) is unaffected — nothing
-- "later" ever exists for it, so it logs exactly as before.
-- ---------------------------------------------------------------------------
create or replace function core.events_from_price_list()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'published' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'published' then
    return new;
  end if;
  if exists (
    select 1 from ws.price_lists later
    where later.phase_id = new.phase_id
      and later.status = 'published'
      and later.id <> new.id
      and later.published_on > new.published_on
  ) then
    return new;
  end if;
  perform core._emit_event(
    p_phase_id := new.phase_id,
    p_kind := 'price_list_published',
    p_occurred_on := new.published_on,
    p_detected_at := ops.ist_noon(new.published_on),
    p_before := null,
    p_after := pg_catalog.jsonb_build_object('price_list_id', new.id, 'published_on', new.published_on, 'version', new.version),
    p_fact_ids := array[new.id]
  );
  return new;
end
$$;
comment on function core.events_from_price_list() is 'ws.price_lists AFTER INSERT OR UPDATE: logs price_list_published once a list becomes published, but only when it is the phase''s newest published list (see header) — Sapphire Grove Ph 1, 16 Oct 2026; Kestrel Park and Coral Towers, 1 Oct 2026.';

-- The trigger must see every row from the same seed file's single transaction
-- (supabase/seed/35_developer_content.sql: begin … commit;) before deciding
-- whether a later published list exists, regardless of row order within that
-- file's multi-row insert — so it runs once, deferred to just before commit,
-- rather than immediately after each row.
drop trigger price_lists_events on ws.price_lists;
create constraint trigger price_lists_events
  after insert or update on ws.price_lists
  deferrable initially deferred
  for each row execute function core.events_from_price_list();
