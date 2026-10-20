-- T41 · ops.custom_access_token_hook (API_CONTRACTS §5.4; BUILD_PLAN §12.3).
-- The hook adds plinth_roles and org_roles for a seeded admin and a developer member, keeps
-- every other claim, and only supabase_auth_admin may call it.
--
-- Seeds (rolled back): a fictional staff admin (no fixture persona exists for one), and the
-- fixture developer member Ananya Rao, Northfield Estates admin (packages/fixtures/canonical
-- people.json and workspace.json ids). app.user_roles comes from T40 and ws.org_members from the
-- M4 workspace task; while either is missing, this test creates a stand-in with the DATA_MODEL
-- columns inside its own transaction.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- Stand-ins (DATA_MODEL §4 ws.org_members, §5 app.user_roles) when the owner's table is absent.
do $$
begin
  if pg_catalog.to_regclass('app.user_roles') is null then
    create table app.user_roles (
      user_id uuid not null,
      role text not null,
      granted_by uuid,
      primary key (user_id, role)
    );
  end if;
  if pg_catalog.to_regclass('ws.org_members') is null then
    create table ws.org_members (
      id uuid primary key default gen_random_uuid(),
      org_id uuid not null,
      user_id uuid not null,
      role text not null,
      display_name text,
      invited_at timestamptz,
      accepted_at timestamptz,
      whatsapp_alerts boolean not null default false,
      unique (org_id, user_id)
    );
  end if;
end
$$;

-- Users (fictional; no phone numbers needed for the hook).
insert into auth.users (id, aud, role)
values
  ('a41d0000-0000-4000-8000-000000000001', 'authenticated', 'authenticated'),  -- staff admin
  ('6250f35f-2fc1-5f3e-b446-535b3fdf5b76', 'authenticated', 'authenticated'),  -- Ananya Rao
  ('bff1ee72-9910-5980-a875-96a9a00b24cf', 'authenticated', 'authenticated'),  -- Rohan (buyer)
  ('a41d0000-0000-4000-8000-000000000002', 'authenticated', 'authenticated'),  -- pending invitee
  ('a41d0000-0000-4000-8000-000000000003', 'authenticated', 'authenticated')   -- no roles
on conflict (id) do nothing;

-- Start from known rows: the people seed or a sign-up trigger may already have given roles.
delete from app.user_roles
where user_id in (
  'a41d0000-0000-4000-8000-000000000001', '6250f35f-2fc1-5f3e-b446-535b3fdf5b76',
  'bff1ee72-9910-5980-a875-96a9a00b24cf', 'a41d0000-0000-4000-8000-000000000002',
  'a41d0000-0000-4000-8000-000000000003'
);
insert into app.user_roles (user_id, role)
values
  ('a41d0000-0000-4000-8000-000000000001', 'admin'),
  ('a41d0000-0000-4000-8000-000000000001', 'methodology'),
  ('6250f35f-2fc1-5f3e-b446-535b3fdf5b76', 'developer_member'),
  ('bff1ee72-9910-5980-a875-96a9a00b24cf', 'buyer'),
  ('a41d0000-0000-4000-8000-000000000002', 'developer_member')
on conflict do nothing;

-- Northfield Estates (a3789e36…): Ananya is the accepted admin; a second org row for her is a
-- pending invite and must not count.
do $$
begin
  if pg_catalog.to_regclass('ws.orgs') is not null then
    execute $q$
      insert into ws.orgs (id, kind, name)
      values ('a3789e36-f6a8-5e75-b050-79d39f37193d', 'developer', 'Northfield Estates'),
             ('a178c305-2026-571c-a945-58acc7dcb26a', 'developer', 'Ashgrove Realty')
      on conflict do nothing
    $q$;
  end if;
end
$$;
delete from ws.org_members
where user_id in ('6250f35f-2fc1-5f3e-b446-535b3fdf5b76', 'a41d0000-0000-4000-8000-000000000002');
insert into ws.org_members (org_id, user_id, role, display_name, invited_at, accepted_at)
values
  ('a3789e36-f6a8-5e75-b050-79d39f37193d', '6250f35f-2fc1-5f3e-b446-535b3fdf5b76', 'admin',
   'Ananya Rao', '2025-11-24 10:00:00+05:30', '2025-12-02 10:00:00+05:30'),
  ('a178c305-2026-571c-a945-58acc7dcb26a', '6250f35f-2fc1-5f3e-b446-535b3fdf5b76', 'sales',
   'Ananya Rao', '2026-10-18 10:00:00+05:30', null),
  ('a3789e36-f6a8-5e75-b050-79d39f37193d', 'a41d0000-0000-4000-8000-000000000002', 'sales',
   'Pending invitee', '2026-10-18 10:00:00+05:30', null);

-- The event Auth sends (claims trimmed to the required ones).
create temp table t41_event (who text primary key, event jsonb not null);
insert into t41_event (who, event)
select who, jsonb_build_object(
  'user_id', uid,
  'authentication_method', 'otp',
  'claims', jsonb_build_object(
    'aud', 'authenticated', 'exp', 1792310400, 'iat', 1792306800, 'sub', uid,
    'role', 'authenticated', 'aal', 'aal1', 'session_id', 's-' || who, 'is_anonymous', false,
    'phone', '', 'email', ''))
from (values
  ('admin', 'a41d0000-0000-4000-8000-000000000001'),
  ('ananya', '6250f35f-2fc1-5f3e-b446-535b3fdf5b76'),
  ('rohan', 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  ('pending', 'a41d0000-0000-4000-8000-000000000002'),
  ('nobody', 'a41d0000-0000-4000-8000-000000000003')
) as u(who, uid);

-- Auth calls the hook as supabase_auth_admin; the hook is SECURITY DEFINER, so the result is the
-- same for any caller (the grants are checked below without switching roles, which the test
-- user on Supabase Postgres may not be allowed to do).
create temp table t41_out (who text primary key, event jsonb not null);
insert into t41_out (who, event)
select who, ops.custom_access_token_hook(event) from t41_event;

-- Shape and access -----------------------------------------------------------------------
select has_function('ops', 'custom_access_token_hook', array['jsonb'], 'ops.custom_access_token_hook(jsonb) exists');
select is(
  (select prosecdef from pg_catalog.pg_proc where oid = 'ops.custom_access_token_hook(jsonb)'::regprocedure),
  true,
  'the hook is SECURITY DEFINER (needs no grant or RLS policy on the role tables)'
);
select ok(
  (select proconfig @> array['search_path=""'] from pg_catalog.pg_proc
   where oid = 'ops.custom_access_token_hook(jsonb)'::regprocedure),
  'the hook pins search_path to empty'
);
select ok(
  has_schema_privilege('supabase_auth_admin', 'ops', 'USAGE')
    and has_function_privilege('supabase_auth_admin', 'ops.custom_access_token_hook(jsonb)', 'EXECUTE'),
  'supabase_auth_admin can reach ops and execute the hook'
);
select ok(
  not has_function_privilege('anon', 'ops.custom_access_token_hook(jsonb)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'ops.custom_access_token_hook(jsonb)', 'EXECUTE')
    and not exists (
      select 1 from pg_catalog.pg_proc p, aclexplode(p.proacl) a
      where p.oid = 'ops.custom_access_token_hook(jsonb)'::regprocedure and a.grantee = 0
    ),
  'anon, authenticated and PUBLIC cannot execute the hook'
);

-- The seeded admin -----------------------------------------------------------------------
select is(
  (select event -> 'claims' -> 'plinth_roles' from t41_out where who = 'admin'),
  '["admin", "methodology"]'::jsonb,
  'admin: plinth_roles lists the user''s roles, sorted'
);
select is(
  (select event -> 'claims' -> 'org_roles' from t41_out where who = 'admin'),
  '{}'::jsonb,
  'admin: org_roles is {} without a membership'
);

-- The seeded developer member --------------------------------------------------------------
select is(
  (select event -> 'claims' -> 'plinth_roles' from t41_out where who = 'ananya'),
  '["developer_member"]'::jsonb,
  'developer member: plinth_roles = [developer_member]'
);
select is(
  (select event -> 'claims' -> 'org_roles' from t41_out where who = 'ananya'),
  '{"a3789e36-f6a8-5e75-b050-79d39f37193d": "admin"}'::jsonb,
  'developer member: org_roles maps Northfield''s org id to admin; the pending Ashgrove invite is left out'
);

-- Everyone else ----------------------------------------------------------------------------
select is(
  (select event -> 'claims' -> 'plinth_roles' from t41_out where who = 'rohan'),
  '["buyer"]'::jsonb,
  'buyer: plinth_roles = [buyer]'
);
select is(
  (select event -> 'claims' -> 'org_roles' from t41_out where who = 'pending'),
  '{}'::jsonb,
  'an invited, not accepted member gets no org role'
);
select is(
  (select event -> 'claims' -> 'plinth_roles' from t41_out where who = 'nobody'),
  '[]'::jsonb,
  'a user with no role rows gets plinth_roles = [] (no implicit role)'
);
select is(
  (select event -> 'claims' -> 'org_roles' from t41_out where who = 'nobody'),
  '{}'::jsonb,
  'and org_roles = {}'
);

-- Other claims and keys are kept ----------------------------------------------------------------
select is(
  (select (o.event -> 'claims') - 'plinth_roles' - 'org_roles' from t41_out o where o.who = 'ananya'),
  (select e.event -> 'claims' from t41_event e where e.who = 'ananya'),
  'every claim Auth sent is kept unchanged'
);
select is(
  (select o.event - 'claims' from t41_out o where o.who = 'ananya'),
  (select e.event - 'claims' from t41_event e where e.who = 'ananya'),
  'the event''s other keys (user_id, authentication_method) are kept'
);
select is(
  ops.custom_access_token_hook(jsonb_build_object(
    'user_id', 'a41d0000-0000-4000-8000-000000000001',
    'claims', jsonb_build_object('sub', 'x', 'plinth_roles', jsonb_build_array('admin', 'support'),
                                 'org_roles', jsonb_build_object('x', 'admin')))) -> 'claims',
  '{"sub": "x", "plinth_roles": ["admin", "methodology"], "org_roles": {}}'::jsonb,
  'incoming plinth_roles / org_roles are replaced, never merged'
);
select is(
  ops.custom_access_token_hook('{"user_id": "not-a-uuid", "claims": {"sub": "x"}}'::jsonb) -> 'claims',
  '{"sub": "x", "plinth_roles": [], "org_roles": {}}'::jsonb,
  'a malformed user_id gives empty roles instead of failing sign-in'
);

-- The claims work with ops.has_role (T04) -----------------------------------------------------
select set_config('request.jwt.claims', (select (event -> 'claims')::text from t41_out where who = 'ananya'), true);
select ok(ops.has_role('developer_member'), 'ops.has_role(developer_member) is true with Ananya''s token');
select ok(not ops.has_role('buyer'), 'and ops.has_role(buyer) is false');

select set_config('request.jwt.claims', (select (event -> 'claims')::text from t41_out where who = 'admin'), true);
select ok(not ops.has_role('admin'), 'admin at aal1: ops.has_role(admin) is false (TOTP first)');
select ok(ops.has_role('methodology'), 'methodology needs no aal2');
select set_config(
  'request.jwt.claims',
  (select (event -> 'claims' || '{"aal": "aal2"}'::jsonb)::text from t41_out where who = 'admin'),
  true
);
select ok(ops.has_role('admin'), 'admin at aal2: ops.has_role(admin) is true');
select set_config('request.jwt.claims', '', true);

select * from finish();
rollback;
