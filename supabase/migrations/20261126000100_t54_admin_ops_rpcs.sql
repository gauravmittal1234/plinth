-- T54 · Admin shell: the admin_* read RPCs for /ops (API_CONTRACTS §3.4 Admin API;
-- BUILD_PLAN §11 Observability, §12.3 roles from JWT claims).
--
-- Every function here is admin-only: ops.has_role('admin') is false unless the caller's
-- JWT carries plinth_roles ∋ admin AND aal = aal2 (ops.has_role, T04). Deny by default:
-- EXECUTE is revoked from PUBLIC, anon and authenticated explicitly, then granted back to
-- authenticated only (the role check inside each function does the real gating) plus
-- service_role. No confirmation without a record: admin_flag_set performs the write itself
-- (not just a check), so the existing ops.feature_flags audit trigger (T04) logs it in the
-- same transaction, and the RPC returns the row that was actually written.
--
-- Soft dependency, unmerged (PR #63, "M2 wave 4 backend"): T42's comms.outbox table. admin_outbox
-- guards every reference with to_regclass() and a dynamic query (pg_catalog.format(), never a
-- literal "comms.outbox") so `supabase db lint` (plpgsql_check) never statically resolves a
-- table that may not exist yet (same pattern as T41's custom_access_token_hook), and so this
-- migration applies cleanly whether T42 has merged first or not. Column names below match T42's
-- current draft (id, channel, template_code, status, attempts, last_error, payload, created_at);
-- re-verify against the merged shape once #63 lands (handoff in the PR body).
--
-- ops.job_runs and ops.source_freshness (DATA_MODEL §10, documented R1·M1) were never created by
-- any merged migration, so admin_source_freshness computes freshness directly from T04's
-- core.sources and core.snapshots instead (both merged, both RLS'd api-only already).

-- ---------------------------------------------------------------------------
-- api.admin_outbox(): queue counts, recent failures and a "mail catcher" preview of
-- recent WhatsApp/email sends (BUILD_PLAN §11: "Admin /ops shows backlog, failures and
-- mock deliveries"). `available: false` with empty data until comms.outbox exists.
-- ---------------------------------------------------------------------------
create function api.admin_outbox()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_available boolean := pg_catalog.to_regclass('comms.outbox') is not null;
  v_data jsonb;
begin
  if not ops.has_role('admin') then
    perform ops.raise_api_error('forbidden', 'admin_outbox needs the admin role at aal2 (TOTP).');
  end if;

  if v_available then
    begin
      execute pg_catalog.format(
        $q$
          select jsonb_build_object(
            'counts', coalesce((
              select pg_catalog.jsonb_object_agg(s.status, s.n)
              from (select status::text, count(*)::int as n from %1$I.%2$I group by status) s
            ), '{}'::jsonb),
            'by_channel', coalesce((
              select pg_catalog.jsonb_object_agg(c.channel, c.n)
              from (select channel::text, count(*)::int as n from %1$I.%2$I group by channel) c
            ), '{}'::jsonb),
            'recent_failures', coalesce((
              select pg_catalog.jsonb_agg(f.row_json order by f.created_at desc)
              from (
                select o.created_at, pg_catalog.jsonb_build_object(
                  'id', o.id, 'channel', o.channel, 'template_code', o.template_code,
                  'attempts', o.attempts, 'last_error', o.last_error, 'created_at', o.created_at
                ) as row_json
                from %1$I.%2$I o
                where o.status = 'failed'
                order by o.created_at desc
                limit 20
              ) f
            ), '[]'::jsonb),
            'recent', coalesce((
              select pg_catalog.jsonb_agg(r.row_json order by r.created_at desc)
              from (
                select o.created_at, pg_catalog.jsonb_build_object(
                  'id', o.id, 'channel', o.channel, 'template_code', o.template_code,
                  'status', o.status, 'payload', o.payload, 'created_at', o.created_at
                ) as row_json
                from %1$I.%2$I o
                where o.channel in ('whatsapp_template', 'whatsapp_session', 'email')
                order by o.created_at desc
                limit 20
              ) r
            ), '[]'::jsonb)
          )
        $q$,
        'comms', 'outbox'
      )
      into v_data;
    exception when others then
      -- The merged shape of comms.outbox may differ from this draft (see header note):
      -- never 500 the /ops page over it, surface "available" so the UI can say so.
      v_available := false;
      v_data := null;
    end;
  end if;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.admin_outbox/1',
    'available', v_available,
    'counts', coalesce(v_data -> 'counts', '{}'::jsonb),
    'by_channel', coalesce(v_data -> 'by_channel', '{}'::jsonb),
    'recent_failures', coalesce(v_data -> 'recent_failures', '[]'::jsonb),
    'recent', coalesce(v_data -> 'recent', '[]'::jsonb)
  );
end
$$;
comment on function api.admin_outbox() is
  'Admin-only (API_CONTRACTS §3.4): comms.outbox counts by status and channel, recent failures, and a mock WhatsApp/email viewer. available=false with empty data before T42 (comms.outbox) merges.';

-- ---------------------------------------------------------------------------
-- api.admin_source_freshness(): per-source last fetch and age ÷ cadence, from T04's
-- core.sources and core.snapshots (both merged; no dependency on ops.job_runs/source_freshness).
-- ---------------------------------------------------------------------------
create function api.admin_source_freshness()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_sources jsonb;
begin
  if not ops.has_role('admin') then
    perform ops.raise_api_error('forbidden', 'admin_source_freshness needs the admin role at aal2 (TOTP).');
  end if;

  select coalesce(pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'code', s.code,
        'name', s.name,
        'cadence_seconds', pg_catalog.date_part('epoch', s.cadence)::bigint,
        'last_fetched_at', f.last_fetched_at,
        'snapshots_total', coalesce(f.total, 0),
        'age_seconds', case when f.last_fetched_at is null then null
          else pg_catalog.date_part('epoch', ops.now() - f.last_fetched_at)::bigint end,
        'stale', case when f.last_fetched_at is null or s.cadence is null then null
          else (ops.now() - f.last_fetched_at) > s.cadence end
      )
      order by s.code
    ), '[]'::jsonb)
  into v_sources
  from core.sources s
  left join (
    select source_id, max(fetched_at) as last_fetched_at, count(*) as total
    from core.snapshots
    group by source_id
  ) f on f.source_id = s.id;

  return pg_catalog.jsonb_build_object('schema', 'plinth.admin_source_freshness/1', 'sources', v_sources);
end
$$;
comment on function api.admin_source_freshness() is
  'Admin-only: per-source last snapshot and age ÷ cadence (BUILD_PLAN §11 "source freshness"), computed from core.sources/core.snapshots (T04).';

-- ---------------------------------------------------------------------------
-- api.admin_flags(): every ops.feature_flags row, for the /ops flags editor.
-- ---------------------------------------------------------------------------
create function api.admin_flags()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_flags jsonb;
begin
  if not ops.has_role('admin') then
    perform ops.raise_api_error('forbidden', 'admin_flags needs the admin role at aal2 (TOTP).');
  end if;

  select coalesce(pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'key', f.key, 'enabled', f.enabled, 'rollout_pct', f.rollout_pct,
        'audience', f.audience, 'surfaces', f.surfaces, 'note', f.note,
        'updated_at', f.updated_at
      )
      order by f.key
    ), '[]'::jsonb)
  into v_flags
  from ops.feature_flags f;

  return pg_catalog.jsonb_build_object('schema', 'plinth.admin_flags/1', 'flags', v_flags);
end
$$;
comment on function api.admin_flags() is
  'Admin-only: every ops.feature_flags row (key, enabled, rollout_pct, audience, surfaces, note, updated_at) for the /ops flags editor.';

-- ---------------------------------------------------------------------------
-- api.admin_flag_set(): the only write here. Flips one flag; ops.feature_flags'
-- existing feature_flags_touch and feature_flags_audit triggers (T04) set updated_at and
-- write ops.audit_log in the same transaction — the confirmation the UI shows is the row
-- the database actually wrote, not a claim the client composed (AGENTS.md §7 "No
-- confirmation without a record").
-- ---------------------------------------------------------------------------
create function api.admin_flag_set(p_key text, p_enabled boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_row ops.feature_flags;
begin
  if not ops.has_role('admin') then
    perform ops.raise_api_error('forbidden', 'admin_flag_set needs the admin role at aal2 (TOTP).');
  end if;
  if p_key is null or p_enabled is null then
    perform ops.raise_api_error('invalid_input', 'admin_flag_set needs p_key and p_enabled.');
  end if;

  update ops.feature_flags
    set enabled = p_enabled,
        updated_by = nullif(ops.claims() ->> 'sub', '')::uuid
    where key = p_key
    returning * into v_row;

  if v_row is null then
    perform ops.raise_api_error('not_found', pg_catalog.format('No flag %L.', p_key));
  end if;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.admin_flag/1',
    'key', v_row.key, 'enabled', v_row.enabled, 'rollout_pct', v_row.rollout_pct,
    'audience', v_row.audience, 'surfaces', v_row.surfaces, 'note', v_row.note,
    'updated_at', v_row.updated_at
  );
end
$$;
comment on function api.admin_flag_set(text, boolean) is
  'Admin-only write: flips ops.feature_flags.enabled for p_key and returns the written row. Audited by the existing feature_flags_audit trigger (T04).';

-- ---------------------------------------------------------------------------
-- Grants. Scoped to exactly these four functions (never a schema-wide sweep): T40–T53
-- (M2, unmerged) grant their own functions the same way, and a schema-wide "revoke all on
-- all functions" here would revoke theirs once they merge ahead of this file. Explicit
-- revoke-then-grant per function instead (PostgreSQL grants EXECUTE to PUBLIC by default on
-- CREATE FUNCTION, so the revoke is not optional).
-- ---------------------------------------------------------------------------
revoke all on function api.admin_outbox() from public, anon, authenticated;
revoke all on function api.admin_source_freshness() from public, anon, authenticated;
revoke all on function api.admin_flags() from public, anon, authenticated;
revoke all on function api.admin_flag_set(text, boolean) from public, anon, authenticated;

grant execute on function api.admin_outbox() to authenticated, service_role;
grant execute on function api.admin_source_freshness() to authenticated, service_role;
grant execute on function api.admin_flags() to authenticated, service_role;
grant execute on function api.admin_flag_set(text, boolean) to authenticated, service_role;
