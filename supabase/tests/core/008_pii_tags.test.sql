-- T04 · PII tags (DATA_MODEL §0; BUILD_PLAN §12.10).
-- Every column whose name looks like personal data (phone, email, pan, aadhaar,
-- address, name as a word of the column name) carries 'pii:C0|C1|C2|C3'. This
-- covers tables later tasks add. T04's own tables tag every column.
begin;
create extension if not exists pgtap with schema extensions;
select plan(2);

select is(
  (
    select array_agg(format('%s.%s.%s', n.nspname, c.relname, a.attname) order by 1)
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('core', 'ws', 'app', 'comms', 'pii', 'ops')
      and c.relkind in ('r', 'p')
      and a.attnum > 0
      and not a.attisdropped
      and a.attname ~ '(^|_)(phone|phones|email|emails|pan|aadhaar|address|addresses|name|names)(_|$)'
      and coalesce(col_description(c.oid, a.attnum), '') !~ '^pii:C[0-3]'
  ),
  null::text[],
  'every PII-looking column carries a pii:C0–C3 tag'
);

select is(
  (
    select array_agg(format('%s.%s.%s', n.nspname, c.relname, a.attname) order by 1)
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where (n.nspname || '.' || c.relname) = any (array[
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
    ])
      and a.attnum > 0
      and not a.attisdropped
      and coalesce(col_description(c.oid, a.attnum), '') !~ '^pii:C[0-3]'
  ),
  null::text[],
  'every column of the 43 T04 tables carries a pii tag'
);

select * from finish();
rollback;
