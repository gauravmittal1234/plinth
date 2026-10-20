-- T45a · Buyer API 1/3: what the buyer RPCs need beyond T40's tables, and shared helpers.
-- Sources: API_CONTRACTS §1 (idempotency on p_client_id, errors), §3.2, §4.7, §4.9, §4.11;
-- DATA_MODEL §5, §9, §12 inv. 1 and 5; BUILD_PLAN §12.2 (functions, not tables; audited).
--
-- New:
--   app.rpc_replays   the idempotency log: (user, p_client_id) → the first result of a mutation.
--   app.wa_follows    follows a WhatsApp number made by its own tap before it had an account;
--                     "Bring them here" (api.link_whatsapp_follows) moves them into app.follows.
--   family_members.client_id / removed_at, project_requests.client_id / notify_whatsapp.
--   Audit triggers on the buyer tables T40 left without one.
-- Every table: RLS on, no policy, no grant (the api.* RPCs are the only door).
-- Helpers live in `app` and are never executable by anon or authenticated.

-- ---------------------------------------------------------------------------
-- app.rpc_replays: "Replays return the first result" (API_CONTRACTS §1).
-- ---------------------------------------------------------------------------
create table app.rpc_replays (
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null,
  fn text not null check (fn ~ '^[a-z_]{1,64}$'),
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, client_id)
);
create index rpc_replays_created_idx on app.rpc_replays (created_at);
comment on table app.rpc_replays is 'Idempotency log of the buyer mutations (API_CONTRACTS §1): a replayed p_client_id returns the stored first result and changes nothing. Pruned after 30 days (ops.rpc_replays_prune). No policy: RPCs only.';
comment on column app.rpc_replays.user_id is 'pii:C1';
comment on column app.rpc_replays.client_id is 'pii:C1 · The caller''s p_client_id (SyncQueue de-duplication key).';
comment on column app.rpc_replays.fn is 'pii:C0 · The api function the id was first used with.';
comment on column app.rpc_replays.result is 'pii:C1 · The first result, returned verbatim on a replay.';
comment on column app.rpc_replays.created_at is 'pii:C0';
alter table app.rpc_replays enable row level security;

create function ops.rpc_replays_prune(p_older_than interval default interval '30 days')
returns integer
language sql
volatile
security definer
set search_path = ''
as $$
  with gone as (
    delete from app.rpc_replays where created_at < pg_catalog.now() - p_older_than returning 1
  )
  select count(*)::integer from gone
$$;
comment on function ops.rpc_replays_prune(interval) is 'Deletes idempotency records older than p_older_than (default 30 days; the app''s SyncQueue retries for far less). Scheduled daily (pg_cron job ops_rpc_replays_prune).';
revoke all on function ops.rpc_replays_prune(interval) from public, anon, authenticated;
select cron.schedule('ops_rpc_replays_prune', '23 3 * * *', 'select ops.rpc_replays_prune()');

-- ---------------------------------------------------------------------------
-- app.wa_follows: a WhatsApp number's own follows before it is linked to an account.
-- ---------------------------------------------------------------------------
create table app.wa_follows (
  id uuid primary key default gen_random_uuid(),
  wa_contact_id uuid not null references pii.wa_contacts (id) on delete cascade,
  phase_id uuid not null references core.phases (id),
  wa_message_id text not null check (pg_catalog.length(wa_message_id) between 1 and 256),
  followed_at timestamptz not null default ops.now(),
  linked_user_id uuid references auth.users (id) on delete set null,
  linked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (wa_contact_id, phase_id)
);
create index wa_follows_linked_user_idx on app.wa_follows (linked_user_id) where linked_user_id is not null;
comment on table app.wa_follows is 'Follows a WhatsApp number made by its own tap ("Follow project") before it had an account (DATA_MODEL §9: a contact is linked only after "Bring them here"). api.link_whatsapp_follows(true) moves them into app.follows (source whatsapp). Written by api.whatsapp_follow_record (service role). No policy.';
comment on column app.wa_follows.wa_contact_id is 'pii:C1 · pii.wa_contacts.';
comment on column app.wa_follows.phase_id is 'pii:C1';
comment on column app.wa_follows.wa_message_id is 'pii:C1 · The inbound tap that made the follow (the buyer''s own act).';
comment on column app.wa_follows.followed_at is 'pii:C1';
comment on column app.wa_follows.linked_user_id is 'pii:C1 · The account it was brought into.';
comment on column app.wa_follows.linked_at is 'pii:C1 · When "Bring them here" moved it.';
comment on column app.wa_follows.created_at is 'pii:C1';
alter table app.wa_follows enable row level security;

-- ---------------------------------------------------------------------------
-- Columns the RPCs need on T40's tables.
-- ---------------------------------------------------------------------------
alter table app.family_members
  add column client_id uuid,
  add column removed_at timestamptz;
create unique index family_members_client_idx on app.family_members (circle_id, client_id)
  where client_id is not null;
comment on column app.family_members.client_id is 'pii:C1 · The p_client_id of the api.family_invite_create call that made the invite: a replay returns this invite.';
comment on column app.family_members.removed_at is 'pii:C1 · When the owner removed the member or cancelled the invite (status removed); api.family_member_undo restores it within an hour.';
comment on column app.family_members.scope_phase_ids is 'pii:C1 · The shared phases. With scope_all, the owner''s follows when the invite was made (what the invite text named), in that order.';

alter table app.project_requests
  add column client_id uuid,
  add column notify_whatsapp boolean not null default false;
create unique index project_requests_client_idx on app.project_requests (user_id, client_id)
  where client_id is not null and user_id is not null;
comment on column app.project_requests.client_id is 'pii:C1 · The p_client_id of the api.request_project call: a replay returns this request.';
comment on column app.project_requests.notify_whatsapp is 'pii:C1 · The buyer asked, by their own tap, to hear the outcome on WhatsApp too (needs a linked, opted-in WhatsApp contact).';

-- ---------------------------------------------------------------------------
-- Audit (BUILD_PLAN §12.2): every buyer write leaves a row in ops.audit_log.
-- T40 audited family_members, user_roles, data_requests, consents, shares and relays.
-- ---------------------------------------------------------------------------
create trigger follows_audit
  after insert or update or delete on app.follows
  for each row execute function ops.audit_trigger();
create trigger alert_subscriptions_audit
  after insert or update or delete on app.alert_subscriptions
  for each row execute function ops.audit_trigger();
create trigger saved_searches_audit
  after insert or update or delete on app.saved_searches
  for each row execute function ops.audit_trigger();
create trigger project_requests_audit
  after insert or update or delete on app.project_requests
  for each row execute function ops.audit_trigger();
create trigger shortlist_notes_audit
  after insert or update or delete on app.shortlist_notes
  for each row execute function ops.audit_trigger();
create trigger family_circles_audit
  after insert or update or delete on app.family_circles
  for each row execute function ops.audit_trigger();
create trigger devices_audit
  after insert or update or delete on app.devices
  for each row execute function ops.audit_trigger();
create trigger wa_follows_audit
  after insert or update or delete on app.wa_follows
  for each row execute function ops.audit_trigger();

-- ---------------------------------------------------------------------------
-- Helpers: who is calling.
-- ---------------------------------------------------------------------------
create function app.buyer_is_tap()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    pg_catalog.jsonb_typeof(ops.claims() -> 'amr') = 'array'
      and exists (
        select 1 from pg_catalog.jsonb_array_elements(ops.claims() -> 'amr') a(v)
        where a.v ->> 'method' = 'whatsapp_tap'
      ),
    false
  )
$$;
comment on function app.buyer_is_tap() is 'True when the JWT is a WhatsApp tap token (amr method whatsapp_tap, minted by wa-webhook after it verified the tap; T44).';

create function app.buyer_caller(p_allow_tap boolean default false)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text := coalesce(auth.role(), '');
begin
  if v_role = 'authenticated' and v_uid is not null then
    if app.buyer_is_tap() then
      if not p_allow_tap then
        perform ops.raise_api_error('forbidden', 'Do this in the Plinth app or on the website.');
      end if;
      if comms.current_wa_tap() is null then
        perform ops.raise_api_error('forbidden', 'That tap is too old to act on. Tap the button again.');
      end if;
    end if;
    return v_uid;
  end if;
  if v_role in ('', 'anon') then
    perform ops.raise_api_error('auth_required', 'Sign in to do this.');
  end if;
  perform ops.raise_api_error('forbidden', 'Only you can do this, from your own signed-in account.');
  return null;
end
$$;
comment on function app.buyer_caller(boolean) is 'The buyer behind a buyer RPC: auth.uid() under role authenticated. No JWT or anon → auth_required; any other role (service_role, even with a sub) → forbidden. A WhatsApp tap JWT is accepted only where p_allow_tap, and only for a real, recent tap from the user''s linked number (comms.current_wa_tap).';

-- ---------------------------------------------------------------------------
-- Helpers: idempotency.
-- ---------------------------------------------------------------------------
create function app.replay_get(p_uid uuid, p_fn text, p_client_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_row app.rpc_replays;
begin
  if p_client_id is null then
    return null;
  end if;
  -- Two calls with the same id wait for each other, so the second one sees the first's result.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('app.rpc_replays:' || p_uid::text || ':' || p_client_id::text, 0)
  );
  select r.* into v_row from app.rpc_replays r where r.user_id = p_uid and r.client_id = p_client_id;
  if not found then
    return null;
  end if;
  if v_row.fn <> p_fn then
    perform ops.raise_api_error('conflict', 'This request id was already used for another action.');
  end if;
  return v_row.result;
end
$$;
comment on function app.replay_get(uuid, text, uuid) is 'The stored first result of (user, p_client_id), or null. Serialises calls with the same id; an id reused for another function is a conflict.';

create function app.replay_put(p_uid uuid, p_fn text, p_client_id uuid, p_result jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_client_id is not null then
    insert into app.rpc_replays (user_id, client_id, fn, result)
    values (p_uid, p_client_id, p_fn, p_result)
    on conflict (user_id, client_id) do nothing;
  end if;
  return p_result;
end
$$;
comment on function app.replay_put(uuid, text, uuid, jsonb) is 'Records the first result of (user, p_client_id) and returns it.';

-- ---------------------------------------------------------------------------
-- Helpers: phases, names, lists.
-- ---------------------------------------------------------------------------
create function app.phase_by_slug(p_slug text)
returns core.phases
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_phase core.phases;
begin
  if p_slug is null or pg_catalog.btrim(p_slug) = '' then
    perform ops.raise_api_error('invalid_input', 'Give the project''s page name, for example aurelia-heights-phase-2.');
  end if;
  select p.* into v_phase from core.phases p where p.slug = pg_catalog.lower(pg_catalog.btrim(p_slug));
  if not found then
    perform ops.raise_api_error('not_found', 'We have no project at this address.');
  end if;
  return v_phase;
end
$$;
comment on function app.phase_by_slug(text) is 'The phase behind a slug. invalid_input when empty, not_found when unknown.';

create function app.phase_short_name(p_name text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select pg_catalog.regexp_replace(p_name, ',\s*Phase\s+', ' Ph ', 'g')
$$;
comment on function app.phase_short_name(text) is 'Aurelia Heights, Phase 2 → Aurelia Heights Ph 2 (DESIGN §5b lists).';

create function app.name_list(p_names text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when p_names is null or pg_catalog.cardinality(p_names) = 0 then ''
    when pg_catalog.cardinality(p_names) = 1 then p_names[1]
    else pg_catalog.array_to_string(p_names[1:pg_catalog.cardinality(p_names) - 1], ', ')
      || ' and ' || p_names[pg_catalog.cardinality(p_names)]
  end
$$;
comment on function app.name_list(text[]) is '{A} → A; {A,B} → A and B; {A,B,C} → A, B and C.';

create function app.phase_names(p_phase_ids uuid[], p_short boolean)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    pg_catalog.array_agg(
      case when p_short then app.phase_short_name(p.name) else p.name end
      order by x.ord
    ),
    '{}'::text[]
  )
  from pg_catalog.unnest(p_phase_ids) with ordinality as x(id, ord)
  join core.phases p on p.id = x.id
$$;
comment on function app.phase_names(uuid[], boolean) is 'Phase names in the array''s order (short names when p_short).';

create function app.followed_phase_ids(p_uid uuid)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(pg_catalog.array_agg(f.phase_id order by f.followed_at, f.created_at, p.name), '{}'::uuid[])
  from app.follows f
  join core.phases p on p.id = f.phase_id
  where f.user_id = p_uid
$$;
comment on function app.followed_phase_ids(uuid) is 'The phases a buyer follows, oldest follow first (ties by name).';

-- ---------------------------------------------------------------------------
-- Helpers: WhatsApp and the number line.
-- ---------------------------------------------------------------------------
create function app.wa_contact_of(p_uid uuid)
returns pii.wa_contacts
language sql
stable
security definer
set search_path = ''
as $$
  select k.* from pii.wa_contacts k where k.user_id = p_uid order by k.created_at limit 1
$$;
comment on function app.wa_contact_of(uuid) is 'The WhatsApp contact linked to an account (after "Bring them here"), or null.';

create function app.whatsapp_ready(p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from pii.wa_contacts k
    where k.user_id = p_uid and k.utility_opt_in and k.stopped_at is null
  )
$$;
comment on function app.whatsapp_ready(uuid) is 'True when the account has a linked WhatsApp contact that opted in to utility messages and has not sent STOP. WhatsApp alerts need it (API_CONTRACTS §4.9: otherwise consent_required).';

create function app.number_line(p_uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case n
      when 0 then 'No party can reach you now.'
      when 1 then '1 party can reach you now.'
      else n::text || ' parties can reach you now.'
    end || ' Family in your circle never see it.'
  from (select pg_catalog.cardinality(app.number_holders(p_uid)) as n) c
$$;
comment on function app.number_line(uuid) is '"3 parties can reach you now. Family in your circle never see it." (API_CONTRACTS §4.9; the count is app.number_holders).';

-- Lockdown sweep for `app` and the ops helper (see 20261110000100).
revoke all on all tables in schema app from public, anon, authenticated;
revoke all on all sequences in schema app from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;
