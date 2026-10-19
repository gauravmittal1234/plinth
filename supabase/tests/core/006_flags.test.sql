-- T04 · Feature flags and api.flags() (BUILD_PLAN §10; API_CONTRACTS §3.1).
-- Every R1 flag has a row; api.flags() returns { schema, flags: { key: boolean } }
-- for the caller's audience; server code reads ops.flag(key).
-- Values may be changed by the fixture seed, so audience rules use probe flags.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

select is(
  (
    select array_agg(k.key order by 1)
    from unnest(array[
      'bands_public', 'harera_live_fetch', 'ai_ask', 'ai_doc_check', 'ai_staging', 'wa_outbound',
      'wa_inbound', 'push_outbound', 'email_outbound', 'since_replay_slider', 'family_circle',
      'dev_workspace', 'visit_booking', 'broker_layer', 'buyer_signals', 'pro_paywall', 'map_tiles',
      'facts_only_global', 'maintenance_mode'
    ]) as k(key)
    where not exists (select 1 from ops.feature_flags f where f.key = k.key)
  ),
  null::text[],
  'all 19 R1 flags from BUILD_PLAN §10 have a row'
);

select ok(
  (select audience = 'internal' from ops.feature_flags where key = 'harera_live_fetch'),
  'harera_live_fetch is internal (pipelines only)'
);

insert into ops.feature_flags (key, enabled, rollout_pct, audience) values
  ('t04_probe_anon', true, 100, 'anon'),
  ('t04_probe_user', true, 100, 'user'),
  ('t04_probe_internal', true, 100, 'internal'),
  ('t04_probe_off', false, 100, 'anon'),
  ('t04_probe_none', true, 0, 'anon');

create temp table t04_flags (who text, flags jsonb);
grant all on t04_flags to public;

-- anon (publishable key, no JWT claims)
set local role anon;
select set_config('request.jwt.claims', '', true);
insert into t04_flags select 'anon', api.flags();
reset role;

-- a signed-in buyer
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000007a1","role":"authenticated","plinth_roles":["buyer"]}', true);
insert into t04_flags select 'buyer', api.flags();
-- admin without aal2 is just a signed-in user here
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000007a1","role":"authenticated","plinth_roles":["admin"],"aal":"aal1"}', true);
insert into t04_flags select 'admin_aal1', api.flags();
-- staff
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000007a1","role":"authenticated","plinth_roles":["support"]}', true);
insert into t04_flags select 'support', api.flags();
reset role;

-- an edge function with the secret key
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
insert into t04_flags select 'service', api.flags();
reset role;

select is(
  (select flags ->> 'schema' from t04_flags where who = 'anon'),
  'plinth.flags/1',
  'api.flags() carries the plinth.flags/1 envelope'
);
select is(
  (select (select count(*)::int from jsonb_object_keys(flags -> 'flags')) from t04_flags where who = 'anon'),
  (select count(*)::int from ops.feature_flags),
  'every flag key is present for every caller (true or false)'
);

create temp view t04_probe as
  select who, jsonb_object_agg(e.key, e.value) filter (where e.key like 't04_probe_%') as probes
  from t04_flags, jsonb_each(flags -> 'flags') as e
  group by who;

select is((select probes from t04_probe where who = 'anon'),
  '{"t04_probe_anon":true,"t04_probe_user":false,"t04_probe_internal":false,"t04_probe_off":false,"t04_probe_none":false}'::jsonb,
  'anon sees anon-audience flags only');
select is((select probes from t04_probe where who = 'buyer'),
  '{"t04_probe_anon":true,"t04_probe_user":true,"t04_probe_internal":false,"t04_probe_off":false,"t04_probe_none":false}'::jsonb,
  'a buyer sees anon + user flags');
select is((select probes from t04_probe where who = 'admin_aal1'),
  '{"t04_probe_anon":true,"t04_probe_user":true,"t04_probe_internal":false,"t04_probe_off":false,"t04_probe_none":false}'::jsonb,
  'admin without aal2 gets no internal flags');
select is((select probes from t04_probe where who = 'support'),
  '{"t04_probe_anon":true,"t04_probe_user":true,"t04_probe_internal":true,"t04_probe_off":false,"t04_probe_none":false}'::jsonb,
  'staff see internal flags');
select is((select probes from t04_probe where who = 'service'),
  '{"t04_probe_anon":true,"t04_probe_user":true,"t04_probe_internal":true,"t04_probe_off":false,"t04_probe_none":false}'::jsonb,
  'service_role (edge functions) sees internal flags');

select ok(ops.flag('t04_probe_internal') and not ops.flag('t04_probe_off') and not ops.flag('no_such_flag'),
  'ops.flag(key): the global switch for server code; unknown keys are off');

select ok(
  has_function_privilege('anon', 'api.flags()', 'EXECUTE')
    and has_function_privilege('authenticated', 'api.flags()', 'EXECUTE')
    and has_function_privilege('service_role', 'api.flags()', 'EXECUTE'),
  'anon, authenticated and service_role may execute api.flags()'
);
select ok(
  (select prosecdef and 'search_path=""' = any (proconfig) and provolatile = 's'
   from pg_catalog.pg_proc where oid = 'api.flags()'::regprocedure),
  'api.flags() is STABLE SECURITY DEFINER with search_path = '''' (GET-able through PostgREST)'
);

set local role anon;
select throws_ok($$select ops.flag('bands_public')$$, '42501', null, 'anon cannot call ops.* directly');
select throws_ok($$update ops.feature_flags set enabled = true where key = 'bands_public'$$, '42501', null, 'anon cannot change a flag');
reset role;

select * from finish();
rollback;
