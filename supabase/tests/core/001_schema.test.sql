-- T04 · Core schema shape: schemas, the 42 T04 tables, RLS on every table,
-- domains, and the constraints that encode DATA_MODEL rules.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

select is(
  (
    select array_agg(s.nsp order by 1)
    from (values ('core'), ('ws'), ('app'), ('comms'), ('pii'), ('ops'), ('api')) as s(nsp)
    where not exists (select 1 from pg_catalog.pg_namespace n where n.nspname = s.nsp)
  ),
  null::text[],
  'schemas core, ws, app, comms, pii, ops, api exist'
);

select is(
  (
    select array_agg(t.name order by 1)
    from unnest(array[
      'core.sources', 'core.snapshots', 'core.facts',
      'core.localities', 'core.developer_groups', 'core.developers', 'core.developer_aliases',
      'core.group_links', 'core.directors', 'core.director_links', 'core.projects', 'core.phases',
      'core.rera_registrations', 'core.towers', 'core.unit_types', 'core.qpr_filings',
      'core.qpr_tower_progress', 'core.extensions', 'core.blanket_extensions', 'core.orders',
      'core.recovery_certificates', 'core.insolvency_events', 'core.licences', 'core.completion_events',
      'core.reported_incidents', 'core.pre_rera_records', 'core.agents',
      'core.score_models', 'core.red_flag_rules', 'core.score_runs', 'core.score_reasons',
      'core.reason_templates', 'core.red_flags', 'core.band_history', 'core.band_notices',
      'core.calibration', 'core.methodology_changelog', 'core.events', 'core.share_cards',
      'ops.ref_counters', 'ops.audit_log', 'ops.feature_flags', 'ops.runtime_settings'
    ]) as t(name)
    where to_regclass(t.name) is null
  ),
  null::text[],
  'all 43 T04 tables exist (DATA_MODEL §1–§3, the three M0 ops tables and ops.runtime_settings)'
);

select is(
  (
    select array_agg(n.nspname || '.' || c.relname order by 1)
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('core', 'ws', 'app', 'comms', 'pii', 'ops')
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  ),
  null::text[],
  'RLS is enabled on every table in core, ws, app, comms, pii, ops'
);

select is(
  (
    select array_agg(d.name order by 1)
    from unnest(array['core.band', 'core.lane', 'core.factor', 'core.score_state', 'app.verdict', 'core.date_precision']) as d(name)
    where to_regtype(d.name) is null
  ),
  null::text[],
  'domains core.band, core.lane, core.factor, core.score_state, app.verdict, core.date_precision exist'
);

select lives_ok($$select 'elevated'::core.band, 'records_show'::core.lane, 'track_record'::core.factor, 'limited_history'::core.score_state, 'cant_check'::app.verdict$$,
  'domains accept their documented values');
select throws_ok($$select 'purple'::core.band$$, '23514', null, 'core.band rejects an unknown band');
select throws_ok($$select 'gossip'::core.lane$$, '23514', null, 'core.lane rejects an unknown lane');
select throws_ok($$select 'vibes'::core.factor$$, '23514', null, 'core.factor rejects an unknown factor');
select throws_ok($$select 'rescoring'::core.score_state$$, '23514', null, 'core.score_state: rescoring is an overlay, not a state');
select throws_ok($$select 'maybe'::app.verdict$$, '23514', null, 'app.verdict rejects an unknown verdict');

-- Constraints that carry DATA_MODEL rules -------------------------------------------
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-000000000501', 't04-sc-group', 'T04 Schema Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-000000000502', 't04-sc-project', 'T04 Schema Project', '00000000-0000-4000-8000-000000000501');
insert into core.phases (id, project_id, slug, name, units_total) values ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000502', 't04-sc-phase', 'T04 Schema Phase', 500);
insert into core.rera_registrations (id, phase_id, authority, rera_number, registered_on, original_completion)
values ('00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000503', 'harera_ggm', 'T04/SCHEMA/1', '2022-12-01', '2027-12-01');
insert into core.qpr_filings (registration_id, quarter, due_on, filed_on, status) values
  ('00000000-0000-4000-8000-000000000504', '2024-Q3', '2024-10-15', '2024-10-27', 'late'),
  ('00000000-0000-4000-8000-000000000504', '2026-Q2', '2026-07-15', '2026-07-15', 'on_time'),
  ('00000000-0000-4000-8000-000000000504', '2026-Q3', '2026-10-15', null, 'missing');

select results_eq(
  $$select quarter, days_late from core.qpr_filings where registration_id = '00000000-0000-4000-8000-000000000504' order by quarter$$,
  $$values ('2024-Q3'::text, 12), ('2026-Q2'::text, 0), ('2026-Q3'::text, null::int)$$,
  'qpr_filings.days_late is generated: 12 days late, on time = 0, missing = null'
);
select throws_ok(
  $$insert into core.qpr_filings (registration_id, quarter, due_on, status) values ('00000000-0000-4000-8000-000000000504', '2026-07', '2026-10-15', 'missing')$$,
  '23514', null,
  'qpr_filings.quarter must look like 2026-Q3'
);
select throws_ok(
  $$insert into core.rera_registrations (phase_id, authority, rera_number) values ('00000000-0000-4000-8000-000000000503', 'harera_ggm', 'T04/SCHEMA/1')$$,
  '23505', null,
  'a RERA number is unique per authority'
);
select results_eq(
  $$select registered_on_precision::text, original_completion_precision::text, current_completion_precision::text
    from core.rera_registrations where id = '00000000-0000-4000-8000-000000000504'$$,
  $$values ('day'::text, 'month'::text, 'month'::text)$$,
  'registered_on defaults to day precision; completion dates to month precision'
);
select is(
  (
    select array_agg(format('%s.%s', c.relname, a.attname) order by 1)
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'core' and a.attnum > 0 and not a.attisdropped
      and a.attname like '%\_precision'
      and a.atttypid <> 'core.date_precision'::regtype
  ),
  null::text[],
  'every *_precision column uses the core.date_precision domain'
);
select ok(
  to_regclass('core.extensions') is not null
    and exists (select 1 from pg_catalog.pg_attribute where attrelid = 'core.extensions'::regclass and attname = 'granted_on_precision')
    and exists (select 1 from pg_catalog.pg_attribute where attrelid = 'core.rera_registrations'::regclass and attname = 'registered_on_precision'),
  'extensions.granted_on_precision and rera_registrations.registered_on_precision exist (C-28)'
);
select throws_ok(
  $$update core.rera_registrations set registered_on_precision = 'year' where id = '00000000-0000-4000-8000-000000000504'$$,
  '23514', null,
  'a precision is day or month'
);

insert into core.score_models (version, status) values ('t04-sc', 'draft');
insert into core.score_runs (id, phase_id, model_version, data_cutoff, state, band, set_by)
values ('00000000-0000-4000-8000-000000000505', '00000000-0000-4000-8000-000000000503', 't04-sc', '2026-10-14', 'scored', 'moderate', 'model');
select throws_ok(
  $$insert into core.score_runs (phase_id, model_version, data_cutoff, state, band) values ('00000000-0000-4000-8000-000000000503', 't04-sc', '2026-10-14', 'scored', null)$$,
  '23514', null,
  'a scored run must carry a band'
);
select throws_ok(
  $$insert into core.score_runs (phase_id, model_version, data_cutoff, state, band) values ('00000000-0000-4000-8000-000000000503', 't04-sc', '2026-10-14', 'limited_history', 'moderate')$$,
  '23514', null,
  'limited history never carries a band (no penalty, no band)'
);
select throws_ok(
  $$insert into core.score_runs (phase_id, model_version, data_cutoff, state, band, set_by) values ('00000000-0000-4000-8000-000000000503', 't04-sc', '2026-10-14', 'scored', 'severe', 'red_flag_rule')$$,
  '23514', null,
  'a band set by a red-flag rule names the rule'
);
select throws_ok(
  $$insert into core.score_reasons (run_id, rank, factor, code, text, fact_ids)
    values ('00000000-0000-4000-8000-000000000505', 5, 'legal', 'X', 'fifth reason', array[gen_random_uuid()])$$,
  '23514', null,
  'at most 4 reasons (rank 1–4)'
);
select throws_ok(
  $$insert into core.reported_incidents (kind, reported_on, source_kind, lane) values ('waterlogging', '2026-07-28', 'news', 'records_show')$$,
  '23514', null,
  'reported incidents stay in the reported_unverified lane'
);

select lives_ok(
  $$insert into core.facts (subject_type, subject_id, attribute, value, method, method_version)
    values ('phase', '00000000-0000-4000-8000-000000000503', 'progress.time_used_pct', '77', 'rules', 'time-used rule v1.2')$$,
  'facts accept method = rules (time used, all-in) with corrections defaulting to []'
);

select * from finish();
rollback;
