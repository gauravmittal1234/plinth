-- T04 · ops.runtime_settings and ops.env() (lead decision, 19 Oct 2026).
-- The table value wins over the plinth.env GUC; the GUC is the fallback only when
-- the row is absent; with neither the environment is prod. The table is locked
-- like everything else: no reads or writes for anon, authenticated or
-- pipeline_writer, owner-only writes, every change audited.
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

-- Shape and default ------------------------------------------------------------------
select has_table('ops', 'runtime_settings', 'ops.runtime_settings exists');
select is(
  (select after ->> 'value' from ops.audit_log
   where entity = 'ops.runtime_settings' and entity_id = 'env' and action = 'insert' order by id limit 1),
  'prod',
  'the migration seeded env = prod (CI and the fixture seed switch it later, audited)'
);
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'ops.runtime_settings'::regclass),
  'RLS is enabled on ops.runtime_settings'
);

-- The table value wins -----------------------------------------------------------------
update ops.runtime_settings set value = 'prod' where key = 'env';
select set_config('plinth.env', 'test', true);
select is(ops.env(), 'prod', 'table prod beats a plinth.env = test GUC');
select ok(not ops.is_frozen_env(), 'so the clock is not frozen');

update ops.runtime_settings set value = 'fixture' where key = 'env';
select set_config('plinth.env', 'prod', true);
select is(ops.env(), 'fixture', 'table fixture beats a plinth.env = prod GUC');
select ok(ops.is_frozen_env(), 'and the fixture world is frozen');

-- The fallback works (row absent) --------------------------------------------------------
delete from ops.runtime_settings where key = 'env';
select set_config('plinth.env', 'test', true);
select is(ops.env(), 'test', 'no env row: falls back to the plinth.env GUC');
select set_config('plinth.fixed_now', '', true);
select is(ops.now(), '2026-10-18 12:00:00+05:30'::timestamptz, 'no env row + GUC test: the clock is frozen');
select set_config('plinth.env', '', true);
select is(ops.env(), 'prod', 'no env row and no GUC: prod');
select is(ops.now(), now(), 'and the clock is real');
insert into ops.runtime_settings (key, value) values ('env', 'prod');

-- Values and audit ------------------------------------------------------------------------
select throws_ok(
  $$update ops.runtime_settings set value = 'Fixture' where key = 'env'$$,
  '23514', null,
  'env accepts only local, test, fixture, dev, staging, prod'
);
select set_config('plinth.audit_reason', 'T04 runtime settings test', true);
update ops.runtime_settings set value = 'dev' where key = 'env';
select results_eq(
  $$select action, before ->> 'value', after ->> 'value', reason from ops.audit_log
    where entity = 'ops.runtime_settings' and entity_id = 'env' and reason = 'T04 runtime settings test'$$,
  $$values ('update'::text, 'prod'::text, 'dev'::text, 'T04 runtime settings test'::text)$$,
  'changing the env is audited with before and after'
);

-- Locked down ------------------------------------------------------------------------------
set local role anon;
select throws_ok('select * from ops.runtime_settings', '42501', null, 'anon cannot read ops.runtime_settings');
select throws_ok($$update ops.runtime_settings set value = 'test' where key = 'env'$$, '42501', null, 'anon cannot write ops.runtime_settings');
select throws_ok('select ops.env()', '42501', null, 'anon cannot call ops.env()');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000009a1","role":"authenticated","plinth_roles":["admin"],"aal":"aal2"}', true);
select throws_ok($$insert into ops.runtime_settings (key, value) values ('x', 'y')$$, '42501', null, 'authenticated (even admin) cannot write ops.runtime_settings directly');
select throws_ok('select * from ops.runtime_settings', '42501', null, 'authenticated cannot read ops.runtime_settings');
reset role;

set local role pipeline_writer;
select throws_ok($$update ops.runtime_settings set value = 'test' where key = 'env'$$, '42501', null, 'pipeline_writer cannot change the environment');
reset role;

select * from finish();
rollback;
