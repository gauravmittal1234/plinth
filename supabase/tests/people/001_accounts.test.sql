-- T40 · Buyer accounts (DATA_MODEL §5, §6 reference tables; §12 inv. 1).
-- Every T40 table has RLS on. app.profiles is created by a trigger on auth.users
-- with a masked phone. Buyer tables are own-only (wall 2, temporary grant);
-- app.user_roles is admin-only and readable by the access-token hook's role.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

update ops.runtime_settings set value = 'test' where key = 'env';

select is(
  (select array_agg(c.relname::text order by c.relname)
     from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'app' and c.relkind = 'r' and c.relrowsecurity
      and c.relname = any (array[
        'profiles', 'user_roles', 'devices', 'follows', 'alert_subscriptions', 'saved_searches',
        'project_requests', 'family_circles', 'family_members', 'shortlist_notes', 'data_requests',
        'purposes', 'notice_versions', 'consents', 'consent_withdrawals', 'contact_shares', 'relay_sessions'
      ])),
  array[
    'alert_subscriptions', 'consent_withdrawals', 'consents', 'contact_shares', 'data_requests', 'devices',
    'family_circles', 'family_members', 'follows', 'notice_versions', 'profiles', 'project_requests',
    'purposes', 'relay_sessions', 'saved_searches', 'shortlist_notes', 'user_roles'
  ]::text[],
  'the 17 T40 tables exist with row level security on'
);

-- Profiles ----------------------------------------------------------------------------
insert into auth.users (id, phone, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000400601', '919900000390', '{"first_name":"Tara"}'),
  ('00000000-0000-4000-8000-000000400602', null, '{}');
select results_eq(
  $$select first_name, phone_masked from app.profiles where id = '00000000-0000-4000-8000-000000400601'$$,
  $$values ('Tara'::text, '+91 99••• ••390'::text)$$,
  'signing up creates the profile: first name and a masked phone, never the number'
);
select results_eq(
  $$select first_name, phone_masked from app.profiles where id = '00000000-0000-4000-8000-000000400602'$$,
  $$values (null::text, null::text)$$,
  'no name or phone yet: the profile still exists'
);
update auth.users set phone = '919900000392' where id = '00000000-0000-4000-8000-000000400601';
select is(
  (select phone_masked from app.profiles where id = '00000000-0000-4000-8000-000000400601'),
  '+91 99••• ••392',
  'a phone change re-masks the profile'
);

-- Own rows -------------------------------------------------------------------------
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-000000400611', 't40-p1-group', 'T40 P1 Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-000000400612', 't40-p1-project', 'T40 P1 Project', '00000000-0000-4000-8000-000000400611');
insert into core.phases (id, project_id, slug, name) values ('00000000-0000-4000-8000-000000400613', '00000000-0000-4000-8000-000000400612', 't40-p1-phase', 'T40 P1 Phase');
insert into app.follows (user_id, phase_id) values
  ('00000000-0000-4000-8000-000000400601', '00000000-0000-4000-8000-000000400613'),
  ('00000000-0000-4000-8000-000000400602', '00000000-0000-4000-8000-000000400613');
insert into app.devices (user_id, fcm_token, platform) values
  ('00000000-0000-4000-8000-000000400601', 't40-fcm-1', 'android'),
  ('00000000-0000-4000-8000-000000400602', 't40-fcm-2', 'ios');
insert into app.alert_subscriptions (user_id, channel, kind) values
  ('00000000-0000-4000-8000-000000400601', 'whatsapp', 'band_change'),
  ('00000000-0000-4000-8000-000000400602', 'whatsapp', 'band_change');
insert into app.saved_searches (user_id, filters, label) values
  ('00000000-0000-4000-8000-000000400601', '{"all_in_max_inr":25000000}', 'T40 search'),
  ('00000000-0000-4000-8000-000000400602', '{}', 'T40 other search');
insert into app.data_requests (user_id, kind) values
  ('00000000-0000-4000-8000-000000400601', 'export'),
  ('00000000-0000-4000-8000-000000400602', 'export');
insert into app.project_requests (user_id, name_text) values
  ('00000000-0000-4000-8000-000000400601', 'T40 Towers, Sector 1'),
  ('00000000-0000-4000-8000-000000400602', 'T40 Heights, Sector 2');
insert into app.user_roles (user_id, role) values ('00000000-0000-4000-8000-000000400601', 'buyer');

select ok(
  (select ref ~ '^R-1018-[0-9]{2,}$' and ref_year = 2026 and due_on = date '2026-11-01' and status = 'open'
     from app.project_requests where name_text = 'T40 Towers, Sector 1'),
  'a project request gets an R-MMDD-NN ref and is due in 14 days (1 Nov 2026)'
);
select ok(
  (select follow_type = 'watching' and source = 'web' and followed_at = ops.now()
     from app.follows where user_id = '00000000-0000-4000-8000-000000400601'),
  'a follow defaults to watching, from the web, now'
);

grant usage on schema app to authenticated, anon;
grant select on app.profiles, app.follows, app.devices, app.alert_subscriptions, app.saved_searches,
  app.data_requests, app.project_requests, app.user_roles, app.purposes, app.notice_versions to authenticated;
grant select on app.purposes, app.notice_versions to anon;
grant insert on app.follows to authenticated;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400601","role":"authenticated","plinth_roles":["buyer"]}', true);
select results_eq(
  $$select 'profiles', count(*)::int from app.profiles
    union all select 'follows', count(*)::int from app.follows
    union all select 'devices', count(*)::int from app.devices
    union all select 'alert_subscriptions', count(*)::int from app.alert_subscriptions
    union all select 'saved_searches', count(*)::int from app.saved_searches
    union all select 'data_requests', count(*)::int from app.data_requests
    union all select 'project_requests', count(*)::int from app.project_requests$$,
  $$values ('profiles', 1), ('follows', 1), ('devices', 1), ('alert_subscriptions', 1), ('saved_searches', 1),
           ('data_requests', 1), ('project_requests', 1)$$,
  'a buyer reads exactly their own rows'
);
select is(
  (select count(*)::int from app.follows where user_id <> '00000000-0000-4000-8000-000000400601'),
  0,
  'and nobody else''s follows'
);
select throws_ok(
  $$insert into app.follows (id, user_id, phase_id, followed_at)
    values (gen_random_uuid(), '00000000-0000-4000-8000-000000400602', '00000000-0000-4000-8000-000000400613', '2026-10-18 12:00+05:30')$$,
  '42501', null,
  'a buyer cannot follow on someone else''s behalf'
);
select is((select count(*)::int from app.user_roles), 0, 'a buyer cannot read app.user_roles, not even their own');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000004006a1","role":"authenticated","plinth_roles":["admin"],"aal":"aal1"}', true);
select is((select count(*)::int from app.user_roles where user_id = '00000000-0000-4000-8000-000000400601'), 0, 'admin without aal2 reads no roles');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000004006a1","role":"authenticated","plinth_roles":["admin"],"aal":"aal2"}', true);
select is((select count(*)::int from app.user_roles where user_id = '00000000-0000-4000-8000-000000400601'), 1, 'admin (aal2) reads roles');
select is((select count(*)::int from app.purposes), 9, 'the 9 purposes are readable (the privacy page lists them)');
reset role;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is(
  (select published_at from app.notice_versions where version = 'Privacy notice v1.0, 1 Oct 2026'),
  '2026-10-01 00:00+05:30'::timestamptz,
  'the notice version in force is public: Privacy notice v1.0, 1 Oct 2026'
);
reset role;
select set_config('request.jwt.claims', '', true);

select ok(
  has_schema_privilege('supabase_auth_admin', 'app', 'USAGE')
    and has_table_privilege('supabase_auth_admin', 'app.user_roles', 'SELECT')
    and not has_table_privilege('supabase_auth_admin', 'app.user_roles', 'INSERT')
    and exists (select 1 from pg_catalog.pg_policies
                 where schemaname = 'app' and tablename = 'user_roles' and 'supabase_auth_admin' = any (roles)),
  'the access-token hook role (supabase_auth_admin) can read app.user_roles, and only read'
);

-- Shape and uniqueness ---------------------------------------------------------------
select results_eq(
  $$select code, retention_class from app.purposes where code in ('number_share', 'family_alerts') order by code$$,
  $$values ('family_alerts'::text, 'account_life'::text), ('number_share', 'consent_proof')$$,
  'purposes carry their retention class (packages/contracts/catalogues/purposes.json)'
);
select throws_ok(
  $$insert into app.follows (user_id, phase_id) values ('00000000-0000-4000-8000-000000400601', '00000000-0000-4000-8000-000000400613')$$,
  '23505', null,
  'one follow per user and phase'
);
select throws_ok(
  $$insert into app.follows (user_id, phase_id, follow_type) values ('00000000-0000-4000-8000-000000400602', '00000000-0000-4000-8000-000000400613', 'booking')$$,
  '23514', null,
  'follow_type is watching or booked'
);
select throws_ok(
  $$insert into app.alert_subscriptions (user_id, channel, kind) values ('00000000-0000-4000-8000-000000400601', 'whatsapp', 'band_change')$$,
  '23505', null,
  'one alert row per user, channel and kind'
);
select throws_ok(
  $$insert into app.devices (user_id, fcm_token, platform) values ('00000000-0000-4000-8000-000000400602', 't40-fcm-1', 'android')$$,
  '23505', null,
  'an FCM token belongs to one device row'
);

select * from finish();
rollback;
