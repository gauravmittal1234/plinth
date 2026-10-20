-- T54 · Admin shell: api.admin_outbox, api.admin_source_freshness, api.admin_flags,
-- api.admin_flag_set (API_CONTRACTS §3.4; BUILD_PLAN §11, §12.3). Accept: "Without aal2,
-- every admin RPC returns forbidden."
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- Catalogue checks: SECURITY DEFINER, search_path pinned, never granted to PUBLIC,
-- granted to authenticated (BUILD_PLAN §12.1-12.2) ------------------------------------
select ok(to_regprocedure('api.admin_outbox()') is not null, 'api.admin_outbox() exists');
select ok(to_regprocedure('api.admin_source_freshness()') is not null, 'api.admin_source_freshness() exists');
select ok(to_regprocedure('api.admin_flags()') is not null, 'api.admin_flags() exists');
select ok(to_regprocedure('api.admin_flag_set(text,boolean)') is not null, 'api.admin_flag_set(text, boolean) exists');

select is(
  (
    select array_agg(p.oid::regprocedure::text order by 1)
    from pg_catalog.pg_proc p
    where p.oid in (
      'api.admin_outbox()'::regprocedure, 'api.admin_source_freshness()'::regprocedure,
      'api.admin_flags()'::regprocedure, 'api.admin_flag_set(text,boolean)'::regprocedure
    )
    and (
      not p.prosecdef
      or not exists (select 1 from pg_catalog.unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
      or exists (select 1 from pg_catalog.aclexplode(p.proacl) a where a.grantee = 0)
      or not has_function_privilege('authenticated', p.oid, 'EXECUTE')
      or has_function_privilege('anon', p.oid, 'EXECUTE')
    )
  ),
  null::text[],
  'every admin_* function is SECURITY DEFINER, pins search_path, is never granted to PUBLIC or anon, and is granted to authenticated'
);

-- Fixture: one source with a stale snapshot (core.sources / core.snapshots, T04) ------
insert into core.sources (id, code, name, cadence) values
  ('00000000-0000-4000-8000-0000005400c1', 't54-src', 'T54 Fixture Source', interval '1 day');
insert into core.snapshots (id, source_id, url, fetched_at, sha256, bytes) values
  ('00000000-0000-4000-8000-0000005400c2', '00000000-0000-4000-8000-0000005400c1',
   'https://example.test/t54', ops.now() - interval '3 days',
   pg_catalog.repeat('a', 64), 10);

-- A real auth.users row for the FK on ops.feature_flags.updated_by -------------------
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000005400a1', 't54-admin@example.test');

-- anon: no grant at all, 42501 before any logic runs --------------------------------
set local role anon;
select throws_ok('select api.admin_outbox()', '42501', null, 'anon: admin_outbox is permission denied');
select throws_ok('select api.admin_flags()', '42501', null, 'anon: admin_flags is permission denied');
select throws_ok($$select api.admin_flag_set('bands_public', true)$$, '42501', null, 'anon: admin_flag_set is permission denied');
reset role;

-- authenticated, no plinth_roles claim: forbidden, not a crash ----------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000005400a1","role":"authenticated"}', true);
select throws_ok('select api.admin_outbox()', 'PT403', 'forbidden', 'no plinth_roles claim: admin_outbox is forbidden');
reset role;

-- authenticated buyer: forbidden -----------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000005400a1","role":"authenticated","plinth_roles":["buyer"]}', true);
select throws_ok('select api.admin_source_freshness()', 'PT403', 'forbidden', 'buyer: admin_source_freshness is forbidden');
select throws_ok($$select api.admin_flag_set('bands_public', true)$$, 'PT403', 'forbidden', 'buyer: admin_flag_set is forbidden');
reset role;

-- authenticated admin at aal1 (TOTP not yet done): forbidden on every RPC -----------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000005400a1","role":"authenticated","plinth_roles":["admin"],"aal":"aal1"}', true);
select throws_ok('select api.admin_outbox()', 'PT403', 'forbidden', 'admin at aal1: admin_outbox is forbidden (TOTP first)');
select throws_ok('select api.admin_source_freshness()', 'PT403', 'forbidden', 'admin at aal1: admin_source_freshness is forbidden');
select throws_ok('select api.admin_flags()', 'PT403', 'forbidden', 'admin at aal1: admin_flags is forbidden');
select throws_ok($$select api.admin_flag_set('bands_public', true)$$, 'PT403', 'forbidden', 'admin at aal1: admin_flag_set is forbidden');
reset role;

-- authenticated admin at aal2: every RPC works ---------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000005400a1","role":"authenticated","plinth_roles":["admin"],"aal":"aal2"}', true);

select is(api.admin_outbox() ->> 'schema', 'plinth.admin_outbox/1', 'admin at aal2: admin_outbox returns its schema tag');
select is(api.admin_outbox() ->> 'available', 'true', 'admin_outbox: comms.outbox (T42) exists and its columns match, so available is true');
select is(api.admin_outbox() -> 'recent_failures', '[]'::jsonb, 'admin_outbox: no failed sends in the seeded outbox');

select is(
  (select s ->> 'code' from jsonb_array_elements(api.admin_source_freshness() -> 'sources') s where s ->> 'code' = 't54-src'),
  't54-src',
  'admin_source_freshness: the fixture source is listed'
);
select is(
  (select (s ->> 'stale')::boolean from jsonb_array_elements(api.admin_source_freshness() -> 'sources') s where s ->> 'code' = 't54-src'),
  true,
  'admin_source_freshness: a 3-day-old snapshot against a 1-day cadence is stale'
);

select ok(
  (select exists (select 1 from jsonb_array_elements(api.admin_flags() -> 'flags') f where f ->> 'key' = 'bands_public')),
  'admin_flags: lists the seeded bands_public flag (T04)'
);

select throws_ok(
  $$select api.admin_flag_set('t54-no-such-flag', true)$$, 'PT404', 'not_found',
  'admin at aal2: admin_flag_set on an unknown key is not_found'
);

select is(
  (api.admin_flag_set('since_replay_slider', true) ->> 'enabled')::boolean, true,
  'admin at aal2: admin_flag_set turns the flag on and returns the written row'
);
reset role;

-- Direct table/audit checks run as the base role: `authenticated` has no USAGE on
-- ops (deny by default, rls/001), so admin_flag_set's own write is verified from here,
-- not by querying ops.* while still SET LOCAL ROLE authenticated.
select is(
  (select enabled from ops.feature_flags where key = 'since_replay_slider'), true,
  'admin_flag_set actually wrote ops.feature_flags.enabled'
);
select is(
  (select updated_by from ops.feature_flags where key = 'since_replay_slider'),
  '00000000-0000-4000-8000-0000005400a1'::uuid,
  'admin_flag_set recorded who made the change'
);
select ok(
  (
    select count(*) > 0
    from ops.audit_log
    where entity = 'ops.feature_flags' and entity_id = 'since_replay_slider' and action = 'update'
  ),
  'no confirmation without a record: the flip is in ops.audit_log (feature_flags_audit trigger, T04)'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000005400a1","role":"authenticated","plinth_roles":["admin"],"aal":"aal2"}', true);
select is(
  (api.admin_flag_set('since_replay_slider', false) ->> 'enabled')::boolean, false,
  'admin_flag_set can flip it back'
);
reset role;

select * from finish();
rollback;
