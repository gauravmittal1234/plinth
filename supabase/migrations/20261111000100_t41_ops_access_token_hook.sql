-- T41 · Auth 1/2: the custom access-token hook (API_CONTRACTS §5.4; BUILD_PLAN §12.3).
--
-- Supabase Auth calls ops.custom_access_token_hook(event) as supabase_auth_admin before it
-- issues every access token (config.toml [auth.hook.custom_access_token]). It adds two claims:
--   plinth_roles  text[]               the user's rows in app.user_roles, sorted
--                                      (buyer, agent, developer_member, reviewer, methodology,
--                                      admin, support); ["buyer"] when a signed-in user has
--                                      none (every account is at least a buyer: lead, T40/T41)
--   org_roles     {org_id: role}       the user's active ws.org_members rows
--                                      (admin, sales, compliance, marketing, site); {} when none
-- Every other claim is kept as Auth sent it. ops.has_role() (T04) reads plinth_roles and still
-- requires aal2 for admin, so the token lists admin even before TOTP.
--
-- Active membership: accepted (accepted_at set), or added directly (no invited_at). A row that
-- was invited and not yet accepted grants nothing.
--
-- The tables arrive in parallel or later: app.user_roles with T40 (R1·M2) and ws.org_members
-- with the M4 workspace task. Both are read with dynamic SQL behind to_regclass(), so this
-- migration applies in any merge order and the hook answers [] / {} until a table exists. The
-- columns used are the DATA_MODEL ones: app.user_roles(user_id, role) and
-- ws.org_members(org_id, user_id, role, invited_at, accepted_at).
--
-- SECURITY DEFINER (owner postgres) so the hook needs no grant on those tables and no RLS
-- policy for supabase_auth_admin; EXECUTE goes to supabase_auth_admin only.

create function ops.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_claims jsonb;
  v_roles jsonb := '[]'::jsonb;
  v_org_roles jsonb := '{}'::jsonb;
begin
  v_claims := case
    when pg_catalog.jsonb_typeof(event -> 'claims') = 'object' then event -> 'claims'
    else '{}'::jsonb
  end;

  if coalesce(event ->> 'user_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    v_user_id := (event ->> 'user_id')::uuid;
  end if;

  if v_user_id is not null and pg_catalog.to_regclass('app.user_roles') is not null then
    execute $q$
      select coalesce(pg_catalog.jsonb_agg(r.role order by r.role), '[]'::jsonb)
      from (
        select distinct ur.role::text as role
        from app.user_roles ur
        where ur.user_id = $1
      ) r
    $q$
    into v_roles
    using v_user_id;
  end if;

  -- Sign-up creates no role row (T40's handle_new_user makes only the profile), so a
  -- signed-in user with none is a buyer. Explicit roles (admin, developer_member, ...) stand alone.
  if v_user_id is not null and v_roles = '[]'::jsonb then
    v_roles := '["buyer"]'::jsonb;
  end if;

  if v_user_id is not null and pg_catalog.to_regclass('ws.org_members') is not null then
    execute $q$
      select coalesce(pg_catalog.jsonb_object_agg(m.org_id::text, m.role::text), '{}'::jsonb)
      from ws.org_members m
      where m.user_id = $1
        and (m.accepted_at is not null or m.invited_at is null)
    $q$
    into v_org_roles
    using v_user_id;
  end if;

  v_claims := v_claims
    || pg_catalog.jsonb_build_object('plinth_roles', v_roles, 'org_roles', v_org_roles);

  return pg_catalog.jsonb_set(
    case when pg_catalog.jsonb_typeof(event) = 'object' then event else '{}'::jsonb end,
    '{claims}',
    v_claims
  );
end
$$;

comment on function ops.custom_access_token_hook(jsonb) is
  'Supabase custom access-token hook (API_CONTRACTS §5.4): adds plinth_roles (app.user_roles) and org_roles {org_id: role} (active ws.org_members) to the claims; keeps every other claim. Executable by supabase_auth_admin only.';

-- Only Auth may call it. Explicit revokes (no schema-wide sweep: T40's api grants run before
-- this file and must survive it).
revoke all on function ops.custom_access_token_hook(jsonb) from public, anon, authenticated;
grant usage on schema ops to supabase_auth_admin;
grant execute on function ops.custom_access_token_hook(jsonb) to supabase_auth_admin;
