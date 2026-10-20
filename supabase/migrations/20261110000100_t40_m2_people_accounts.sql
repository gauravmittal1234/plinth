-- T40 · DB people 1/3 (m2_people): buyer accounts.
-- app.profiles (+ its trigger on auth.users), app.user_roles, app.devices, app.follows,
-- app.alert_subscriptions, app.saved_searches, app.project_requests, app.data_requests.
-- Sources: DATA_MODEL §0 (conventions, refs, PII tags), §5, §12 inv. 1 and 5.
-- Every table: RLS on, no grant to anon/authenticated (api.* RPCs are the door,
-- wall 1); the policies below are wall 2 and are tested with a temporary grant.
-- Policies read claims inline (authenticated has no USAGE on ops).
-- Every function pins `search_path = ''` and qualifies every name (BUILD_PLAN §12.2).

-- ---------------------------------------------------------------------------
-- app.profiles: one per auth user, created by a trigger (the pet_app pattern).
-- ---------------------------------------------------------------------------
create table app.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text check (first_name is null or pg_catalog.length(first_name) between 1 and 60),
  phone_masked text,
  following_seen_at timestamptz,
  adult_attested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table app.profiles is 'A buyer''s profile (DATA_MODEL §5). Created by app.handle_new_user() on auth.users insert; own read and update.';
comment on column app.profiles.id is 'pii:C1 · = auth.users.id';
comment on column app.profiles.first_name is 'pii:C1 · The only name a site office ever sees (with a visit consent).';
comment on column app.profiles.phone_masked is 'pii:C1 · "+91 99••• ••318". The number itself lives only in auth.users / pii.';
comment on column app.profiles.following_seen_at is 'pii:C1 · Last look at Following ("Since you last looked").';
comment on column app.profiles.adult_attested_at is 'pii:C1 · When the user confirmed they are 18 or over.';
comment on column app.profiles.created_at is 'pii:C1';
comment on column app.profiles.updated_at is 'pii:C1';

create trigger profiles_touch
  before update on app.profiles
  for each row execute function ops.touch_updated_at();

create function app.mask_phone(p_phone text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when v.d is null or v.d = '' then null
    when v.d ~ '^91[0-9]{10}$'
      then '+91 ' || pg_catalog.substr(v.d, 3, 2) || '••• ••' || pg_catalog.right(v.d, 3)
    when pg_catalog.length(v.d) >= 6 then '••• ••' || pg_catalog.right(v.d, 3)
    else null
  end
  from (select pg_catalog.regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') as d) as v
$$;
comment on function app.mask_phone(text) is 'GoTrue phone (digits, no +) → "+91 99••• ••318" for Indian numbers, "••• ••318" otherwise, null when absent.';

create function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into app.profiles (id, first_name, phone_masked)
  values (
    new.id,
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'first_name'), ''),
    app.mask_phone(new.phone)
  )
  on conflict (id) do nothing;
  return new;
end
$$;
comment on function app.handle_new_user() is 'AFTER INSERT on auth.users: creates app.profiles with the first name from user metadata and a masked phone.';

create function app.handle_user_phone_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update app.profiles set phone_masked = app.mask_phone(new.phone) where id = new.id;
  return new;
end
$$;
comment on function app.handle_user_phone_change() is 'AFTER UPDATE OF phone on auth.users: re-masks app.profiles.phone_masked.';

create trigger on_auth_user_created_app_profile
  after insert on auth.users
  for each row execute function app.handle_new_user();
create trigger on_auth_user_phone_app_profile
  after update of phone on auth.users
  for each row when (old.phone is distinct from new.phone)
  execute function app.handle_user_phone_change();

-- ---------------------------------------------------------------------------
-- app.user_roles: read by the access-token hook (T41), written by admin.
-- ---------------------------------------------------------------------------
create table app.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('buyer', 'agent', 'developer_member', 'reviewer', 'methodology', 'admin', 'support')),
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);
comment on table app.user_roles is 'Platform roles (DATA_MODEL §5). The access-token hook (T41) copies them into plinth_roles. Admin only.';
comment on column app.user_roles.user_id is 'pii:C1';
comment on column app.user_roles.role is 'pii:C1';
comment on column app.user_roles.granted_by is 'pii:C1';
comment on column app.user_roles.granted_at is 'pii:C1';

create trigger user_roles_audit
  after insert or update or delete on app.user_roles
  for each row execute function ops.audit_trigger();

-- ---------------------------------------------------------------------------
-- app.devices, app.follows, app.alert_subscriptions, app.saved_searches
-- ---------------------------------------------------------------------------
create table app.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fcm_token text not null unique,
  platform text not null check (platform in ('android', 'ios', 'web')),
  app_version text,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index devices_user_idx on app.devices (user_id);
comment on table app.devices is 'Push targets (DATA_MODEL §5). Own.';
comment on column app.devices.user_id is 'pii:C1';
comment on column app.devices.fcm_token is 'pii:C1 · Device push token.';
comment on column app.devices.platform is 'pii:C1';
comment on column app.devices.app_version is 'pii:C1';
comment on column app.devices.last_seen is 'pii:C1';

create table app.follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phase_id uuid not null references core.phases (id),
  follow_type text not null default 'watching' check (follow_type in ('watching', 'booked')),
  source text not null default 'web' check (source in ('web', 'app', 'whatsapp', 'family')),
  followed_at timestamptz not null default ops.now(),
  created_at timestamptz not null default now(),
  unique (user_id, phase_id)
);
create index follows_phase_idx on app.follows (phase_id);
comment on table app.follows is 'A buyer follows a phase (DATA_MODEL §5). Own. follow_type is never visible to circle members (§12 inv. 5).';
comment on column app.follows.user_id is 'pii:C1';
comment on column app.follows.follow_type is 'pii:C1 · watching or booked. Never shown to the family circle.';
comment on column app.follows.source is 'pii:C1';
comment on column app.follows.followed_at is 'pii:C1';

create table app.alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  channel text not null check (channel in ('push', 'whatsapp', 'email')),
  kind text not null check (kind in ('band_change', 'filings', 'orders', 'extensions', 'price', 'digest', 'payment_stage')),
  cadence text not null default 'instant' check (cadence in ('instant', 'daily_8am', 'weekly_sun_9am', 'off')),
  quiet_from time,
  quiet_to time,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, channel, kind),
  check ((quiet_from is null) = (quiet_to is null))
);
comment on table app.alert_subscriptions is 'Alert preferences per channel and kind (DATA_MODEL §5). Own. Quiet hours are IST wall-clock times.';
comment on column app.alert_subscriptions.user_id is 'pii:C1';
comment on column app.alert_subscriptions.kind is 'pii:C1 · payment_stage alerts are never sent to the family circle.';

create trigger alert_subscriptions_touch
  before update on app.alert_subscriptions
  for each row execute function ops.touch_updated_at();

create table app.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  filters jsonb not null default '{}'::jsonb check (pg_catalog.jsonb_typeof(filters) = 'object'),
  label text check (label is null or pg_catalog.length(label) <= 80),
  in_digest boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index saved_searches_user_idx on app.saved_searches (user_id);
comment on table app.saved_searches is 'Saved searches (DATA_MODEL §5). Own. Matches go in the digest, never as utility alerts.';
comment on column app.saved_searches.user_id is 'pii:C1';
comment on column app.saved_searches.filters is 'pii:C1';
comment on column app.saved_searches.label is 'pii:C1';

create trigger saved_searches_touch
  before update on app.saved_searches
  for each row execute function ops.touch_updated_at();

-- ---------------------------------------------------------------------------
-- app.project_requests (R-MMDD-NN) and app.data_requests (DPDP rights)
-- ---------------------------------------------------------------------------
create table app.project_requests (
  id uuid primary key default gen_random_uuid(),
  ref text not null default ops.next_ref('R') check (ref ~ '^R-[0-9]{4}-[0-9]{2,}$'),
  ref_year integer not null default ops.ref_year(),
  user_id uuid references auth.users (id) on delete set null,
  name_text text check (name_text is null or pg_catalog.length(name_text) between 1 and 200),
  rera_text text check (rera_text is null or pg_catalog.length(rera_text) between 1 and 100),
  requested_at timestamptz not null default ops.now(),
  due_on date not null default (ops.today() + 14),
  status text not null default 'open' check (status in ('open', 'added', 'declined')),
  reason text,
  created_at timestamptz not null default now(),
  unique (ref_year, ref),
  check (name_text is not null or rera_text is not null)
);
create index project_requests_user_idx on app.project_requests (user_id);
comment on table app.project_requests is '"Request a project" (DATA_MODEL §5): added by due_on (+14 days) or told why not. Own + admin.';
comment on column app.project_requests.user_id is 'pii:C1 · Null for an anonymous request.';
comment on column app.project_requests.name_text is 'pii:C0 · The project name as the buyer typed it.';
comment on column app.project_requests.rera_text is 'pii:C0';
comment on column app.project_requests.reason is 'pii:C0 · Why it was declined.';

create table app.data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  kind text not null check (kind in ('export', 'erasure', 'correction')),
  requested_at timestamptz not null default ops.now(),
  due_at timestamptz,
  completed_at timestamptz,
  export_key text,
  link_expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index data_requests_user_idx on app.data_requests (user_id);
comment on table app.data_requests is 'DPDP requests (DATA_MODEL §5). Export within 24 h, link valid 7 days. Own + admin. user_id is kept null after an erasure completes.';
comment on column app.data_requests.user_id is 'pii:C1';
comment on column app.data_requests.export_key is 'pii:C1 · Storage key of the export in the private exports bucket.';

create trigger data_requests_audit
  after insert or update or delete on app.data_requests
  for each row execute function ops.audit_trigger();

-- ---------------------------------------------------------------------------
-- RLS (wall 2). own = user_id = auth.uid(); admin = plinth_roles ∋ admin with aal2.
-- ---------------------------------------------------------------------------
alter table app.profiles enable row level security;
alter table app.user_roles enable row level security;
alter table app.devices enable row level security;
alter table app.follows enable row level security;
alter table app.alert_subscriptions enable row level security;
alter table app.saved_searches enable row level security;
alter table app.project_requests enable row level security;
alter table app.data_requests enable row level security;

create policy own_read on app.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy own_update on app.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare
  t text;
begin
  foreach t in array array['devices', 'follows', 'alert_subscriptions', 'saved_searches'] loop
    execute format(
      'create policy own_all on app.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t
    );
  end loop;
  foreach t in array array['project_requests', 'data_requests'] loop
    execute format('create policy own_read on app.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format('create policy own_insert on app.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
  end loop;
  foreach t in array array['user_roles', 'project_requests', 'data_requests'] loop
    execute format(
      $p$create policy admin_all on app.%I for all to authenticated
         using (
           coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'plinth_roles') ? 'admin', false)
           and nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal' = 'aal2'
         )
         with check (
           coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'plinth_roles') ? 'admin', false)
           and nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal' = 'aal2'
         )$p$,
      t
    );
  end loop;
end
$$;

-- The access-token hook (T41) runs as supabase_auth_admin and reads roles only.
grant usage on schema app to supabase_auth_admin;
grant select on app.user_roles to supabase_auth_admin;
create policy auth_hook_read on app.user_roles for select to supabase_auth_admin using (true);

-- ---------------------------------------------------------------------------
-- Lockdown sweep for the schema this migration touches (BUILD_PLAN §12.1).
-- Only `app`: sweeping `api` here would drop other tasks' function grants.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema app from public, anon, authenticated;
revoke all on all sequences in schema app from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;
