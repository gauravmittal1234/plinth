-- T04 · pipeline_writer least privilege (DATA_MODEL §12 inv. 6; BUILD_PLAN §12.5).
-- It reads and writes core evidence and score drafts, never publishes, never
-- deletes, and has no privilege at all on ws, app, comms or pii — so developer
-- content cannot reach scoring.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

select ok(
  (select rolcanlogin and not rolsuper and not rolbypassrls and not rolcreaterole and not rolcreatedb
   from pg_catalog.pg_roles where rolname = 'pipeline_writer'),
  'pipeline_writer exists as a plain login role (no superuser, bypassrls, createrole, createdb)'
);

select is(
  (
    select array_agg(s.nsp order by 1)
    from (values ('ws'), ('app'), ('comms'), ('pii')) as s(nsp)
    where has_schema_privilege('pipeline_writer', s.nsp, 'USAGE') or has_schema_privilege('pipeline_writer', s.nsp, 'CREATE')
  ),
  null::text[],
  'pipeline_writer has no USAGE or CREATE on ws, app, comms, pii'
);

select is(
  (
    select array_agg(n.nspname || '.' || c.relname order by 1)
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('ws', 'app', 'comms', 'pii')
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
      and (
        has_table_privilege('pipeline_writer', c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        or has_any_column_privilege('pipeline_writer', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')
      )
  ),
  null::text[],
  'pipeline_writer holds no privilege on any ws, app, comms or pii table'
);

-- Probe tables (rolled back) stand in for tables later tasks add.
create table ws.t04_probe (id int);
create table app.t04_probe (id int);
create table pii.t04_probe (id int);
create table comms.t04_probe (id int);

-- Fixture rows, as the migration owner.
insert into core.sources (id, code, name) values ('00000000-0000-4000-8000-0000000004d1', 't04_source', 'T04 source');
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-0000000004d2', 't04-pw-group', 'T04 PW Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-0000000004d3', 't04-pw-project', 'T04 PW Project', '00000000-0000-4000-8000-0000000004d2');
insert into core.phases (id, project_id, slug, name) values ('00000000-0000-4000-8000-0000000004d4', '00000000-0000-4000-8000-0000000004d3', 't04-pw-phase', 'T04 PW Phase');
insert into core.score_models (version, status) values ('t04-pw', 'draft');
insert into core.developers (id, legal_name) values ('00000000-0000-4000-8000-0000000004d5', 'T04 PW Developer Pvt Ltd');

set local role pipeline_writer;

select throws_ok('select * from ws.t04_probe', '42501', null, 'pipeline_writer: select ws → permission denied');
select throws_ok('select * from app.t04_probe', '42501', null, 'pipeline_writer: select app → permission denied');
select throws_ok('select * from pii.t04_probe', '42501', null, 'pipeline_writer: select pii → permission denied');
select throws_ok('select * from comms.t04_probe', '42501', null, 'pipeline_writer: select comms → permission denied');

select lives_ok(
  $$insert into core.snapshots (source_id, url, fetched_at, sha256, fixture)
    values ('00000000-0000-4000-8000-0000000004d1', 'fixture://t04', '2026-10-14 10:00+05:30', repeat('a', 64), true)$$,
  'pipeline_writer: insert a snapshot'
);
insert into core.facts (id, subject_type, subject_id, attribute, value)
values ('00000000-0000-4000-8000-0000000004e1', 'phase', '00000000-0000-4000-8000-0000000004d4', 'qpr.built_pct', '38'),
       ('00000000-0000-4000-8000-0000000004e2', 'phase', '00000000-0000-4000-8000-0000000004d4', 'qpr.built_pct', '41');
select lives_ok(
  $$update core.facts set superseded_by = '00000000-0000-4000-8000-0000000004e2' where id = '00000000-0000-4000-8000-0000000004e1'$$,
  'pipeline_writer: insert facts and link the supersede chain'
);
select lives_ok(
  $$insert into core.score_runs (phase_id, model_version, data_cutoff, status, state, band, set_by)
    values ('00000000-0000-4000-8000-0000000004d4', 't04-pw', '2026-10-14', 'draft', 'scored', 'moderate', 'model')$$,
  'pipeline_writer: insert a draft score run'
);
select throws_ok(
  $$insert into core.score_runs (phase_id, model_version, data_cutoff, status, state, band, set_by, published_at)
    values ('00000000-0000-4000-8000-0000000004d4', 't04-pw', '2026-10-14', 'published', 'scored', 'moderate', 'model', now())$$,
  '42501', null,
  'pipeline_writer: cannot insert a published run (row-level security)'
);
select throws_ok(
  $$update core.score_runs set status = 'published', published_at = now() where phase_id = '00000000-0000-4000-8000-0000000004d4'$$,
  '42501', null,
  'pipeline_writer: cannot publish (no UPDATE on score_runs)'
);
select throws_ok('select * from core.band_notices', '42501', null, 'pipeline_writer: cannot read band notices (to_band)');
select throws_ok('select * from ops.audit_log', '42501', null, 'pipeline_writer: cannot read ops.audit_log');
select throws_ok('update ops.feature_flags set enabled = true', '42501', null, 'pipeline_writer: cannot change flags');
select throws_ok(
  $$delete from core.phases where id = '00000000-0000-4000-8000-0000000004d4'$$,
  '42501', null,
  'pipeline_writer: cannot delete the public record'
);
select throws_ok(
  $$update core.developer_groups set claim_state = 'claimed' where id = '00000000-0000-4000-8000-0000000004d2'$$,
  '42501', null,
  'pipeline_writer: cannot change claim state (column privilege)'
);
select throws_ok(
  $$insert into core.group_links (group_id, developer_id, link_type, status)
    values ('00000000-0000-4000-8000-0000000004d2', '00000000-0000-4000-8000-0000000004d5', 'spv', 'accepted')$$,
  '42501', null,
  'pipeline_writer: can only propose group links, not accept them'
);

reset role;

select * from finish();
rollback;
