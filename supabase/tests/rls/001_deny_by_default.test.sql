-- T04 · Deny by default (DATA_MODEL §12 inv. 1; BUILD_PLAN §12.1–12.2).
-- anon and authenticated hold no privilege on any table, sequence or private
-- schema, and get "permission denied" on every table. api functions are the only
-- door: EXECUTE is never granted to PUBLIC and search_path is pinned.
-- These checks cover tables later tasks add too.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

-- Catalogue checks --------------------------------------------------------------
select is(
  (
    select array_agg(r.role || ' → ' || n.nspname || '.' || c.relname order by 1)
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    cross join (values ('anon'), ('authenticated')) as r(role)
    where n.nspname in ('core', 'ws', 'app', 'comms', 'pii', 'ops', 'api', 'public')
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
      and not (n.nspname = 'api' and c.relkind = 'v')
      and (
        has_table_privilege(r.role, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
        or has_any_column_privilege(r.role, c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')
      )
  ),
  null::text[],
  'anon and authenticated hold no table or column privilege in any Plinth schema'
);

select is(
  (
    select array_agg(r.role || ' → ' || n.nspname || '.' || c.relname order by 1)
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    cross join (values ('anon'), ('authenticated')) as r(role)
    where n.nspname in ('core', 'ws', 'app', 'comms', 'pii', 'ops', 'api', 'public')
      and c.relkind = 'S'
      and has_sequence_privilege(r.role, c.oid, 'USAGE,SELECT,UPDATE')
  ),
  null::text[],
  'anon and authenticated hold no sequence privilege'
);

select is(
  (
    select array_agg(r.role || ' → ' || s.nsp order by 1)
    from (values ('core'), ('ws'), ('app'), ('comms'), ('pii'), ('ops')) as s(nsp)
    cross join (values ('anon'), ('authenticated')) as r(role)
    where has_schema_privilege(r.role, s.nsp, 'USAGE') or has_schema_privilege(r.role, s.nsp, 'CREATE')
  ),
  null::text[],
  'anon and authenticated have no USAGE or CREATE on core, ws, app, comms, pii, ops'
);

select ok(
  has_schema_privilege('anon', 'api', 'USAGE') and has_schema_privilege('authenticated', 'api', 'USAGE')
    and not has_schema_privilege('anon', 'api', 'CREATE') and not has_schema_privilege('authenticated', 'api', 'CREATE'),
  'api is the one schema anon and authenticated can use (USAGE, not CREATE)'
);

select is(
  (
    select array_agg(r.role || ' → ' || p.oid::regprocedure::text order by 1)
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    cross join (values ('anon'), ('authenticated')) as r(role)
    where n.nspname in ('core', 'ws', 'app', 'comms', 'pii', 'ops')
      and has_function_privilege(r.role, p.oid, 'EXECUTE')
  ),
  null::text[],
  'no function in a private schema is executable by anon or authenticated'
);

select is(
  (
    select array_agg(p.oid::regprocedure::text order by 1)
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and (p.proacl is null or exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0))
  ),
  null::text[],
  'every api function grants EXECUTE explicitly (never to PUBLIC)'
);

select is(
  (
    select array_agg(p.oid::regprocedure::text order by 1)
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
  ),
  null::text[],
  'every api function pins search_path (BUILD_PLAN §12.2)'
);

select is(
  (
    select array_agg(c.relname::text order by 1)
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm', 'f')
  ),
  null::text[],
  'the public schema holds no tables or views'
);

-- Live probes: every table answers "permission denied" ---------------------------
create temp table t04_probe (role text, tbl text, outcome text);
grant all on t04_probe to public;

set local role anon;
do $$
declare
  r record;
begin
  for r in
    select n.nspname, c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('core', 'ws', 'app', 'comms', 'pii', 'ops', 'public')
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
  loop
    begin
      execute format('select 1 from %I.%I limit 0', r.nspname, r.relname);
      insert into t04_probe values (current_user, r.nspname || '.' || r.relname, 'readable');
    exception
      when insufficient_privilege then
        insert into t04_probe values (current_user, r.nspname || '.' || r.relname, 'denied');
    end;
  end loop;
end
$$;
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000004f1","role":"authenticated","plinth_roles":["admin","methodology"],"aal":"aal2"}',
  true
);
do $$
declare
  r record;
begin
  for r in
    select n.nspname, c.relname
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('core', 'ws', 'app', 'comms', 'pii', 'ops', 'public')
      and c.relkind in ('r', 'p', 'v', 'm', 'f')
  loop
    begin
      execute format('select 1 from %I.%I limit 0', r.nspname, r.relname);
      insert into t04_probe values (current_user, r.nspname || '.' || r.relname, 'readable');
    exception
      when insufficient_privilege then
        insert into t04_probe values (current_user, r.nspname || '.' || r.relname, 'denied');
    end;
  end loop;
end
$$;
reset role;

select is(
  (select array_agg(role || ' read ' || tbl order by 1) from t04_probe where outcome = 'readable'),
  null::text[],
  'SELECT on every table in every Plinth schema is denied to anon and to authenticated (even with staff claims)'
);

select is(
  (
    select array_agg(r.role order by 1)
    from (values ('anon'), ('authenticated')) as r(role)
    where (select count(*) from t04_probe p where p.role = r.role and p.outcome = 'denied') < 43
  ),
  null::text[],
  'the probe really ran: at least the 43 T04 tables were denied to each role'
);

set local role anon;
select throws_ok('select * from core.phases', '42501', null, 'anon: select core.phases → permission denied');
select throws_ok(
  $$insert into core.facts (subject_type, subject_id, attribute, value) values ('phase', gen_random_uuid(), 'x', '1')$$,
  '42501', null, 'anon: insert core.facts → permission denied'
);
select throws_ok('select * from ops.feature_flags', '42501', null, 'anon: select ops.feature_flags → permission denied');
reset role;

set local role authenticated;
select throws_ok('select * from core.score_runs', '42501', null, 'authenticated: select core.score_runs → permission denied');
select throws_ok('delete from ops.audit_log', '42501', null, 'authenticated: delete ops.audit_log → permission denied');
reset role;

select * from finish();
rollback;
