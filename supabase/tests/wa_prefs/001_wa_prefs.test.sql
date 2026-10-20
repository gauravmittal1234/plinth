-- T46b · api.whatsapp_prefs_stop and api.whatsapp_digest_changes (20261123000100).
-- Service-role only, no user JWT (AGENTS.md §7: a withdrawal needs no re-proved consent).
-- User A is linked and has band_change + digest (weekly) whatsapp subscriptions; contact B has
-- no account (nothing to toggle, but STOP still works); phase P carries 2 public events in the
-- last 7 days and 1 outside the window, to show the cutoff and the non-public filter.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

update ops.runtime_settings set value = 'test' where key = 'env';

insert into auth.users (id, phone, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000046b01', null, '{"first_name":"T46b Asha"}');

insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-000000046b10', 't46b-group', 'T46b Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-000000046b11', 't46b-project', 'T46b Project', '00000000-0000-4000-8000-000000046b10');
insert into core.phases (id, project_id, slug, name) values
  ('00000000-0000-4000-8000-000000046b12', '00000000-0000-4000-8000-000000046b11', 't46b-one', 'T46b One, Phase 1');

insert into app.follows (user_id, phase_id, followed_at) values
  ('00000000-0000-4000-8000-000000046b01', '00000000-0000-4000-8000-000000046b12', '2026-07-01 10:00+05:30');

insert into app.alert_subscriptions (user_id, channel, kind, cadence) values
  ('00000000-0000-4000-8000-000000046b01', 'whatsapp', 'band_change', 'instant'),
  ('00000000-0000-4000-8000-000000046b01', 'whatsapp', 'price', 'instant'),
  ('00000000-0000-4000-8000-000000046b01', 'whatsapp', 'digest', 'weekly_sun_9am');

insert into pii.wa_contacts (id, wa_id_e164, user_id, utility_opt_in) values
  ('00000000-0000-4000-8000-000000046b02', '+919900000481', '00000000-0000-4000-8000-000000046b01', true),
  ('00000000-0000-4000-8000-000000046b03', '+919900000482', null, true);

-- Two events inside the last 7 days (ops.now() is frozen at 18 Oct 2026, 12:00 IST), one outside,
-- and one non-public (a re-score in progress: DATA_MODEL §12 inv. 2).
insert into core.events (phase_id, kind, occurred_on, detected_at, public, before, after) values
  ('00000000-0000-4000-8000-000000046b12', 'qpr_filed', '2026-10-15', '2026-10-15 12:00+05:30', true, null, null),
  ('00000000-0000-4000-8000-000000046b12', 'band_changed', '2026-10-16', '2026-10-16 12:00+05:30', true,
    '{"band":"moderate"}'::jsonb, '{"band":"elevated"}'::jsonb),
  ('00000000-0000-4000-8000-000000046b12', 'qpr_late', '2026-09-01', '2026-09-01 12:00+05:30', true, null, null),
  ('00000000-0000-4000-8000-000000046b12', 'rescore_started', '2026-10-17', '2026-10-17 12:00+05:30', false, null, null);

-- Lockdown ------------------------------------------------------------------------
select is(
  (
    select array_agg(r.role || ' → ' || p.oid::regprocedure::text order by 1)
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    cross join (values ('anon'), ('authenticated')) as r(role)
    where n.nspname = 'api' and p.proname in ('whatsapp_prefs_stop', 'whatsapp_digest_changes')
      and has_function_privilege(r.role, p.oid, 'EXECUTE')
  ),
  null::text[],
  'anon and authenticated cannot execute either new function'
);
select ok(
  has_function_privilege('service_role', 'api.whatsapp_prefs_stop(uuid, text)', 'EXECUTE')
    and has_function_privilege('service_role', 'api.whatsapp_digest_changes(uuid, integer)', 'EXECUTE'),
  'service_role can execute both'
);

-- whatsapp_prefs_stop: invalid input and unknown contact -------------------------
select throws_ok(
  $$select api.whatsapp_prefs_stop('00000000-0000-4000-8000-000000046b02', 'stop_everything')$$,
  'PT422', 'invalid_input', 'an action we don''t know is invalid_input'
);
select throws_ok(
  $$select api.whatsapp_prefs_stop('00000000-0000-4000-8000-00000000dead', 'stop_all')$$,
  'PT404', 'not_found', 'an unknown contact id is not_found'
);

-- stop_all: the one field every outbound check reads, works for an unlinked number too --------
select is(
  (api.whatsapp_prefs_stop('00000000-0000-4000-8000-000000046b03', 'stop_all') ->> 'stopped')::boolean,
  true,
  'STOP (stop_all) on an unlinked contact: stopped'
);
select is(
  (select k.utility_opt_in from pii.wa_contacts k where k.id = '00000000-0000-4000-8000-000000046b03'),
  false,
  'and utility_opt_in is now false'
);
select is(
  api.whatsapp_prefs_stop('00000000-0000-4000-8000-000000046b03', 'stop_all') ->> 'linked',
  'false',
  'replayed on an already-stopped contact: no error, still unlinked'
);

-- stop_alerts / stop_weekly on the linked contact --------------------------------
select is(
  api.whatsapp_prefs_stop('00000000-0000-4000-8000-000000046b02', 'stop_alerts') ->> 'band_change_on',
  'false',
  '"Stop alerts": band_change_on is now false'
);
select is(
  (select s.cadence from app.alert_subscriptions s
     where s.user_id = '00000000-0000-4000-8000-000000046b01' and s.channel = 'whatsapp' and s.kind = 'digest'),
  'weekly_sun_9am',
  '"Stop alerts" never touches the digest cadence'
);
select is(
  (select s.cadence from app.alert_subscriptions s
     where s.user_id = '00000000-0000-4000-8000-000000046b01' and s.channel = 'whatsapp' and s.kind = 'price'),
  'off',
  '"Stop alerts" also stops price-list alerts (ops.alert_kind_for_event, T43b fan-out)'
);
select is(
  api.whatsapp_prefs_stop('00000000-0000-4000-8000-000000046b02', 'stop_weekly') ->> 'digest_on',
  'false',
  '"Stop weekly" (the weekly_digest button): digest_on is now false'
);
select is(
  api.whatsapp_prefs_stop('00000000-0000-4000-8000-000000046b02', 'stop_weekly') ->> 'digest_on',
  'true',
  'the same button again ("Turn weekly on"): back on'
);
select is(
  (select s.cadence from app.alert_subscriptions s
     where s.user_id = '00000000-0000-4000-8000-000000046b01' and s.channel = 'whatsapp' and s.kind = 'digest'),
  'weekly_sun_9am',
  'back on at the weekly cadence, not daily'
);
select is(
  (api.whatsapp_prefs_stop('00000000-0000-4000-8000-000000046b02', 'stop_weekly') -> 'band_change_on')::text,
  (api.whatsapp_prefs_stop('00000000-0000-4000-8000-000000046b02', 'stop_alerts') -> 'band_change_on')::text,
  'band_change_on is read, not changed, by the digest actions'
);

-- whatsapp_digest_changes: the window and the non-public filter -----------------
select is(
  (api.whatsapp_digest_changes('00000000-0000-4000-8000-000000046b03') ->> 'change_count')::int,
  0,
  'an unlinked contact: an honest empty read, not an error'
);
select is(
  (api.whatsapp_digest_changes('00000000-0000-4000-8000-000000046b02') ->> 'change_count')::int,
  2,
  'the linked contact: 2 public events in the last 7 days (the 1 Sep and the non-public re-score are out)'
);
select is(
  (select pg_catalog.jsonb_array_length(api.whatsapp_digest_changes('00000000-0000-4000-8000-000000046b02', 60) -> 'lines')),
  3,
  'a 60-day window picks up the 1 Sep late filing too (still never the non-public re-score)'
);
select matches(
  (select l#>>'{}' from pg_catalog.jsonb_array_elements(
     api.whatsapp_digest_changes('00000000-0000-4000-8000-000000046b02') -> 'lines') l limit 1),
  '^T46b One Ph 1: ',
  'each line names the phase (short name), server-composed'
);

select * from finish();
rollback;
