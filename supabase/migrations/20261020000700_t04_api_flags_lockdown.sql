-- T04 · DB core 7/7: api.flags() with the R1 flag rows, then the lockdown sweep.
-- Sources: BUILD_PLAN §10 (flags), §12.1–12.2; API_CONTRACTS §3.1 (`api.flags()` →
-- `{ key: boolean }` for the caller's audience); DATA_MODEL §0 (PII tags), §12 inv. 1.

-- ---------------------------------------------------------------------------
-- R1 flags. Defaults are production-safe: anything that publishes risk or
-- reaches outside is off until its gate; kill switches are on (= allowed).
-- The §5b fixture world sets what it needs in its seed (T03) with UPDATEs: bands_public on;
-- ai_ask, ai_doc_check and ai_staging off until M5 (DESIGN §5b C-29).
-- Re-running never overwrites an operator's value (on conflict do nothing).
-- ---------------------------------------------------------------------------
insert into ops.feature_flags (key, enabled, rollout_pct, audience, surfaces, note) values
  ('bands_public',        false, 100, 'anon',     '{web,app,whatsapp}', 'S1 → S2 gate. Off: api.risk_summary nulls band, frequency, reasons and what_would_change (DATA_MODEL §12 inv. 8).'),
  ('harera_live_fetch',   false, 100, 'internal', '{pipelines}',        'Live HARERA fetch. Also needs HARERA_LIVE_FETCH_APPROVED=yes; off until the legal memo (BUILD_PLAN §1 rule 8).'),
  ('ai_ask',              true,  100, 'anon',     '{web,app,whatsapp}', 'Kill switch: Ask Plinth. Allowed by default; the §5b fixture world turns it off until M5 (DESIGN §5b C-29).'),
  ('ai_doc_check',        true,  100, 'anon',     '{web,app,whatsapp}', 'Kill switch: doc-check (claims, cost sheet, pay-as-built, before you pay). The fixture world turns it off until M5 (C-29).'),
  ('ai_staging',          true,  100, 'anon',     '{web,app}',          'Kill switch: Visualise (AI room staging). The fixture world turns it off until M5 (C-29).'),
  ('wa_outbound',         true,  100, 'internal', '{edge}',             'Kill switch: WhatsApp sends from the outbox.'),
  ('wa_inbound',          true,  100, 'internal', '{edge}',             'Kill switch: WhatsApp webhook processing.'),
  ('push_outbound',       true,  100, 'internal', '{edge}',             'Kill switch: FCM push from the outbox.'),
  ('email_outbound',      true,  100, 'internal', '{edge}',             'Kill switch: email from the outbox.'),
  ('since_replay_slider', false, 100, 'anon',     '{web,app}',          'Since you last looked: the replay slider (jump chips always show).'),
  ('family_circle',       false, 100, 'anon',     '{web,app,whatsapp}', 'Family circle (JOIN codes). On at the M2 gate.'),
  ('dev_workspace',       false, 100, 'anon',     '{web}',              'Developer workspace. On at the M4 gate.'),
  ('visit_booking',       false, 100, 'anon',     '{web,app,whatsapp}', 'Visit booking. On at the M5 gate.'),
  ('broker_layer',        false, 100, 'anon',     '{web}',              'Thin agent layer (For agents, agent of record). On at the M5 gate.'),
  ('buyer_signals',       false, 100, 'user',     '{web}',              'Developer buyer signals (k ≥ 20). On at the M4 gate.'),
  ('pro_paywall',         false, 100, 'anon',     '{web,app}',          'Paid Pro report. Off until a payment partner exists.'),
  ('map_tiles',           false, 100, 'anon',     '{web,app}',          'Hosted PMTiles basemap. Off: background + project pins only.'),
  ('facts_only_global',   false, 100, 'anon',     '{web,app,whatsapp}', 'Emergency switch: every page facts-only (band, reasons and "of 100" withheld).'),
  ('maintenance_mode',    false, 100, 'anon',     '{web,app,whatsapp}', 'Read-only maintenance banner; writes refused.')
on conflict (key) do nothing;

create trigger feature_flags_audit
  after insert or update or delete on ops.feature_flags
  for each row execute function ops.audit_trigger();

-- ---------------------------------------------------------------------------
-- api.flags(): every flag key → boolean for this caller. A flag is true only
-- when enabled, aimed at the caller's audience and inside its rollout.
--   anon → audience anon · authenticated → anon + user ·
--   staff roles (admin with aal2, methodology, reviewer, support) and service_role → all.
-- ---------------------------------------------------------------------------
create function api.flags()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with caller as (
    select coalesce(nullif(ops.claims() ->> 'role', ''), nullif(pg_catalog.current_setting('role', true), 'none'), 'anon') as db_role
  ),
  aud as (
    select case
      when ops.has_any_role(array['admin', 'methodology', 'reviewer', 'support']) or c.db_role = 'service_role'
        then array['anon', 'user', 'internal']
      when c.db_role = 'authenticated'
        then array['anon', 'user']
      else array['anon']
    end as audiences
    from caller c
  )
  select pg_catalog.jsonb_build_object(
    'schema', 'plinth.flags/1',
    'flags', coalesce(
      (
        select pg_catalog.jsonb_object_agg(
          f.key,
          f.enabled and f.audience = any (a.audiences) and ops.flag_in_rollout(f.key, f.rollout_pct)
        )
        from ops.feature_flags f
      ),
      '{}'::jsonb
    )
  )
  from aud a
$$;
comment on function api.flags() is 'plinth.flags/1: { schema, flags: { key: boolean } } for the caller''s audience. Cache 60 s at the edge.';

-- ---------------------------------------------------------------------------
-- RLS on the ops tables (no policies: only SECURITY DEFINER functions reach them).
-- ---------------------------------------------------------------------------
alter table ops.ref_counters enable row level security;
alter table ops.audit_log enable row level security;
alter table ops.feature_flags enable row level security;
alter table ops.runtime_settings enable row level security;

-- ---------------------------------------------------------------------------
-- PII tags (DATA_MODEL §0; BUILD_PLAN §12.10): every column carries pii:C0–C3.
-- PII-looking columns were tagged by hand above; everything else T04 created in
-- core and ops is public record or operational data → C0. Descriptive column
-- comments keep their text after the tag ("pii:C0 · …").
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select n.nspname, c.relname, a.attname, pg_catalog.col_description(c.oid, a.attnum) as note
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('core', 'ops')
      and c.relkind in ('r', 'p')
      and a.attnum > 0
      and not a.attisdropped
      and coalesce(pg_catalog.col_description(c.oid, a.attnum), '') !~ '^pii:C[0-3]'
  loop
    execute format(
      'comment on column %I.%I.%I is %L',
      r.nspname, r.relname, r.attname,
      case when r.note is null then 'pii:C0' else 'pii:C0 · ' || r.note end
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Lockdown sweep (BUILD_PLAN §12.1). Belt and braces: whatever the defaults,
-- anon/authenticated hold nothing in the private schemas, and api functions are
-- executable only where granted explicitly. Later DB tasks: end each migration
-- with the same sweep (supabase/tests/rls checks it on every PR).
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
