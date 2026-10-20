-- T45a · Buyer API 3/3: the family circle and the shared shortlist.
--   api.family_circle, api.family_invite_create, api.family_invite_cancel,
--   api.family_invite_preview (anon too: /j/[code]), api.family_member_remove,
--   api.family_member_undo, api.family_join (app path), api.shortlist_note_add,
--   ops.family_join_by_code + api.whatsapp_family_join (service role: the relative's own
--   WhatsApp "JOIN <code>").
-- Sources: API_CONTRACTS §3.2, §4.11; DATA_MODEL §5, §12 inv. 5; DESIGN §5b (Following, digest
-- and family: one person per code, 7 days, no phone number; the relative's own JOIN is the
-- opt-in; payment alerts, follow type, cost sheets, visit passes and "who has my number" stay
-- private to the owner); packages/contracts schemas family_circle, family_invite,
-- family_invite_preview and family_join.
--
-- A member row never carries a phone (T40). Nothing here reads the owner's follow type,
-- consents, shares, relays or payment alerts for a member. An expired, used, cancelled or
-- unknown code gets the same neutral not_found everywhere (no oracle on which).
-- Invite codes are 3 + 3 characters (DESIGN §5b: AH2-7KQ), so the preview and join paths should
-- be rate-limited at the edge and web layer (Handoff in the T45a PR).

-- ---------------------------------------------------------------------------
-- Helpers (app; never executable by anon or authenticated).
-- ---------------------------------------------------------------------------
create function app.first_name_of(p_uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.first_name from app.profiles p where p.id = p_uid
$$;
comment on function app.first_name_of(uuid) is 'A buyer''s first name (app.profiles), or null.';

create function app.circle_owner(p_circle_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.owner_user_id from app.family_circles c where c.id = p_circle_id
$$;
comment on function app.circle_owner(uuid) is 'The owner of a family circle.';

-- The phases an invite names: its own list (with scope_all, the owner's follows when it was made).
create function app.invite_phase_ids(p_member app.family_members)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when pg_catalog.cardinality(p_member.scope_phase_ids) > 0 then p_member.scope_phase_ids
    else app.followed_phase_ids(app.circle_owner(p_member.circle_id))
  end
$$;
comment on function app.invite_phase_ids(app.family_members) is 'The phases an invite names, in order: scope_phase_ids, else (scope_all without a snapshot) the owner''s follows.';

create function app.invite_scope_line(p_member app.family_members)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when not p_member.scope_all and pg_catalog.cardinality(ids.v) = 1
      then (app.phase_names(ids.v, false))[1]
    else pg_catalog.cardinality(ids.v)::text
      || case when pg_catalog.cardinality(ids.v) = 1 then ' project: ' else ' projects: ' end
      || app.name_list(app.phase_names(ids.v, true))
  end
  from (select app.invite_phase_ids(p_member) as v) ids
$$;
comment on function app.invite_scope_line(app.family_members) is '"Aurelia Heights, Phase 2" for one phase; "4 projects: Aurelia Heights Ph 2, Kestrel Park, Sapphire Grove Ph 1 and Coral Towers" otherwise (DESIGN §5b invites).';

-- What a member gets alerts for, as a short phrase: "your 4 projects" or "Aurelia Heights Ph 2".
create function app.member_scope_phrase(p_member app.family_members)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_member.scope_all then
      'your ' || n.c::text || case when n.c = 1 then ' project' else ' projects' end
    else app.name_list(app.phase_names(p_member.scope_phase_ids, true))
  end
  from (select pg_catalog.cardinality(app.followed_phase_ids(app.circle_owner(p_member.circle_id))) as c) n
$$;
comment on function app.member_scope_phrase(app.family_members) is 'scope_all → "your N projects" (the owner''s follows now); else the short names of the shared phases.';

create function app.invite_what_you_get(p_member app.family_members)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_array(
    case when not p_member.scope_all and pg_catalog.cardinality(app.invite_phase_ids(p_member)) = 1
      then 'An alert when its band changes, a QPR is filed or missed, its date moves or an order is passed.'
      else 'An alert when a project''s band changes, a QPR is filed or missed, its date moves or an order is passed.'
    end,
    'A short round-up on Sundays. Nothing between 10 pm and 8 am.',
    'Stop anytime: reply STOP, or leave from this page.'
  )
$$;
comment on function app.invite_what_you_get(app.family_members) is 'The /j/[code] "what you get" lines (API_CONTRACTS §4.11).';

-- plinth.family_invite/1
create function app.family_invite_json(p_member app.family_members)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'schema', 'plinth.family_invite/1',
    'code', p_member.invite_code,
    'link', v.link,
    'expires_on', ops.ist_date(p_member.expires_at),
    'scope_line', app.invite_scope_line(p_member),
    'share_text',
      coalesce(v.first_name || ' invited you', 'You''re invited') || ' to follow '
      || case
           when not p_member.scope_all and pg_catalog.cardinality(v.ids) = 1
             then (app.phase_names(v.ids, false))[1] || ' on Plinth'
           else pg_catalog.cardinality(v.ids)::text || ' projects on Plinth: ' || app.name_list(app.phase_names(v.ids, true))
         end
      || '. You''ll get the same alerts. Your number stays yours. Tap to join: '
      || pg_catalog.regexp_replace(v.link, '^https?://', ''),
    'rules', pg_catalog.jsonb_build_array('Works for one person for 7 days.', 'Carries no phone number.'),
    'private_line', 'Stays private to you: cost sheets, visit passes, payment alerts and who has your number.'
  )
  from (
    select core.public_base_url() || '/j/' || p_member.invite_code as link,
           app.first_name_of(app.circle_owner(p_member.circle_id)) as first_name,
           app.invite_phase_ids(p_member) as ids
  ) v
$$;
comment on function app.family_invite_json(app.family_members) is 'plinth.family_invite/1 for an invite row (API_CONTRACTS §4.11).';

-- plinth.family_invite_preview/1
create function app.family_invite_preview_json(p_member app.family_members)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'schema', 'plinth.family_invite_preview/1',
    'inviter_first_name', v.name,
    'scope_line', app.invite_scope_line(p_member),
    'rera_number', case
      when not p_member.scope_all and pg_catalog.cardinality(v.ids) = 1
        then (core.phase_registration(v.ids[1])).rera_number
    end,
    'what_you_get', app.invite_what_you_get(p_member),
    'number_line', v.name || ' sees that you joined, never your number.'
  )
  from (
    select coalesce(app.first_name_of(app.circle_owner(p_member.circle_id)), 'Your relative') as name,
           app.invite_phase_ids(p_member) as ids
  ) v
$$;
comment on function app.family_invite_preview_json(app.family_members) is 'plinth.family_invite_preview/1: who invited, to what, and what the relative gets. Never a phone number.';

-- plinth.family_join/1
create function app.family_join_json(p_member app.family_members)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'schema', 'plinth.family_join/1',
    'member_id', p_member.id,
    'inviter_first_name', v.name,
    'scope_line', app.invite_scope_line(p_member),
    'joined_on', ops.ist_date(p_member.joined_at),
    'can_add_notes', p_member.can_add_notes,
    'joined_line', 'You''ll get the same alerts as ' || v.name || ' for ' || app.invite_scope_line(p_member) || '.',
    'what_you_get', app.invite_what_you_get(p_member),
    'number_line', v.name || ' sees that you joined, never your number.'
  )
  from (
    select coalesce(app.first_name_of(app.circle_owner(p_member.circle_id)), 'Your relative') as name
  ) v
$$;
comment on function app.family_join_json(app.family_members) is 'plinth.family_join/1: the relative''s join, as the app screen and the WhatsApp reply say it.';

-- plinth.family_circle/1
create function app.family_circle_json(p_uid uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with circle as (
    select c.id from app.family_circles c where c.owner_user_id = p_uid
  )
  select pg_catalog.jsonb_build_object(
    'schema', 'plinth.family_circle/1',
    'members', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
          'id', m.id,
          'first_name', app.first_name_of(m.member_user_id),
          'scope_all', m.scope_all,
          'joined_on', ops.ist_date(m.joined_at),
          'joined_via', m.joined_via,
          'can_add_notes', m.can_add_notes,
          'line', 'Joined ' || ops.fmt_date(ops.ist_date(m.joined_at)) || ' · same alerts for '
            || app.member_scope_phrase(m)
            || case when m.can_add_notes then ' · can add notes' else '' end
        ) order by m.joined_at, m.id)
      from app.family_members m
      where m.circle_id in (select id from circle) and m.status = 'joined'
    ), '[]'::jsonb),
    'invites', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
          'id', m.id,
          'code', m.invite_code,
          'link', core.public_base_url() || '/j/' || m.invite_code,
          'scope_line', app.invite_scope_line(m),
          'invited_on', ops.ist_date(m.invited_at),
          'expires_on', ops.ist_date(m.expires_at),
          'line', 'Invited '
            || case when ops.ist_date(m.invited_at) = ops.today() then 'today' else ops.fmt_date(ops.ist_date(m.invited_at)) end
            || ' · ' || app.member_scope_phrase(m) || ' · hasn''t tapped the link yet'
        ) order by m.invited_at desc, m.invite_code)
      from app.family_members m
      where m.circle_id in (select id from circle) and m.status = 'invited' and m.expires_at > ops.now()
    ), '[]'::jsonb),
    'member_of', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
          'member_id', m.id,
          'owner_first_name', app.first_name_of(app.circle_owner(m.circle_id)),
          'scope_line', app.invite_scope_line(m),
          'joined_on', ops.ist_date(m.joined_at),
          'can_add_notes', m.can_add_notes
        ) order by m.joined_at, m.id)
      from app.family_members m
      where m.member_user_id = p_uid and m.status = 'joined'
    ), '[]'::jsonb),
    'rules', pg_catalog.jsonb_build_array('Works for one person for 7 days.', 'Carries no phone number.'),
    'private_line', 'Stays private to you: cost sheets, visit passes, payment alerts and who has your number.',
    'number_line', 'Family in your circle never see your number.'
  )
$$;
comment on function app.family_circle_json(uuid) is 'plinth.family_circle/1: the caller''s circle (joined members, open invites) and the circles they joined. Never a phone number, follow type or payment alert.';

-- An invite code: the phase's short code (AH2) for one phase; else the owner's initial, C and
-- the count (RC4, "all 4"); then 3 characters that are never confused (no 0, O, 1 or I).
create function app.invite_code_prefix(p_owner uuid, p_phase_ids uuid[], p_all boolean)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_phase core.phases;
  v_words text[];
  v_out text := '';
  v_letter text;
begin
  if p_all or pg_catalog.cardinality(p_phase_ids) <> 1 then
    v_letter := pg_catalog.upper(pg_catalog.left(coalesce(app.first_name_of(p_owner), ''), 1));
    if v_letter !~ '^[A-Z]$' then
      v_letter := 'P';
    end if;
    return v_letter || 'C' || least(pg_catalog.cardinality(p_phase_ids), 9)::text;
  end if;
  select p.* into v_phase from core.phases p where p.id = p_phase_ids[1];
  if coalesce(v_phase.short_code, '') ~ '^[A-Z0-9]{3}$' then
    return v_phase.short_code;
  end if;
  v_words := pg_catalog.regexp_split_to_array(
    pg_catalog.btrim(pg_catalog.regexp_replace(pg_catalog.upper(coalesce(v_phase.name, '')), '[^A-Z0-9]+|\mPHASE\M', ' ', 'g')),
    '\s+'
  );
  select coalesce(pg_catalog.string_agg(pg_catalog.left(w, 1), '' order by o), '') into v_out
  from pg_catalog.unnest(v_words) with ordinality as x(w, o) where w <> '';
  if pg_catalog.length(v_out) < 3 and pg_catalog.cardinality(v_words) > 0 then
    v_out := v_out || pg_catalog.substr(v_words[pg_catalog.cardinality(v_words)], 2);
  end if;
  return pg_catalog.rpad(pg_catalog.left(v_out, 3), 3, 'X');
end
$$;
comment on function app.invite_code_prefix(uuid, uuid[], boolean) is 'The first half of an invite code: AH2 (the phase''s short code, or its initials), or RC4 (owner''s initial, C, number of projects).';

create function app.new_invite_code(p_prefix text)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_bytes bytea;
  v_code text;
begin
  for i in 1..25 loop
    v_bytes := extensions.gen_random_bytes(3);
    v_code := p_prefix || '-'
      || pg_catalog.substr(v_alphabet, (pg_catalog.get_byte(v_bytes, 0) % 32) + 1, 1)
      || pg_catalog.substr(v_alphabet, (pg_catalog.get_byte(v_bytes, 1) % 32) + 1, 1)
      || pg_catalog.substr(v_alphabet, (pg_catalog.get_byte(v_bytes, 2) % 32) + 1, 1);
    if not exists (select 1 from app.family_members m where m.invite_code = v_code) then
      return v_code;
    end if;
  end loop;
  perform ops.raise_api_error('conflict', 'We couldn''t make a new invite code. Try again.');
  return null;
end
$$;
comment on function app.new_invite_code(text) is 'A fresh, unused invite code <prefix>-XXX from an unambiguous alphabet (pgcrypto random bytes).';

-- The live invite behind a code, locked; null when the code is unknown, used, cancelled or expired.
create function app.live_invite(p_code text)
returns app.family_members
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')));
  v_member app.family_members;
begin
  if v_code !~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$' then
    return null;
  end if;
  select m.* into v_member from app.family_members m where m.invite_code = v_code for update;
  if not found or v_member.status <> 'invited' or v_member.expires_at <= ops.now() then
    return null;
  end if;
  return v_member;
end
$$;
comment on function app.live_invite(text) is 'The open invite for a code (locked for update), or null for an unknown, used, cancelled or expired one.';

create function app.neutral_code_error()
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  perform ops.raise_api_error('not_found', 'This invite link isn''t valid any more. Ask for a new one.');
end
$$;
comment on function app.neutral_code_error() is 'The one answer for an unknown, used, cancelled or expired invite code.';

-- The caller's own circle, as owner: a row in app.family_members by id, locked.
create function app.own_member(p_uid uuid, p_member_id uuid)
returns app.family_members
language sql
volatile
security definer
set search_path = ''
as $$
  select m.* from app.family_members m
  join app.family_circles c on c.id = m.circle_id
  where m.id = p_member_id and c.owner_user_id = p_uid
  for update of m
$$;
comment on function app.own_member(uuid, uuid) is 'A member or invite row of the caller''s own circle (locked), or null.';

-- ---------------------------------------------------------------------------
-- Reads.
-- ---------------------------------------------------------------------------
create function api.family_circle()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
begin
  return app.family_circle_json(v_uid);
end
$$;
comment on function api.family_circle() is 'plinth.family_circle/1: the caller''s family circle (joined members, open invites) and the circles they joined. Errors: auth_required, forbidden.';

create function api.family_invite_preview(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')));
  v_member app.family_members;
begin
  if v_code ~ '^[A-Z0-9]{3}-[A-Z0-9]{3}$' then
    select m.* into v_member from app.family_members m where m.invite_code = v_code;
  end if;
  if v_member.id is null or v_member.status <> 'invited' or v_member.expires_at <= ops.now() then
    perform app.neutral_code_error();
  end if;
  return app.family_invite_preview_json(v_member);
end
$$;
comment on function api.family_invite_preview(text) is 'plinth.family_invite_preview/1 (API_CONTRACTS §4.11): powers /j/[code]. Anyone holding the code may read it. An unknown, used, cancelled or expired code: not_found, the same neutral answer.';

-- ---------------------------------------------------------------------------
-- The owner's writes.
-- ---------------------------------------------------------------------------
create function api.family_invite_create(
  p_scope jsonb,
  p_client_id uuid default null,
  p_can_add_notes boolean default false
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
  v_member app.family_members;
  v_all boolean;
  v_slugs jsonb;
  v_ids uuid[] := '{}'::uuid[];
  v_slug text;
  v_phase core.phases;
  v_circle uuid;
begin
  if p_client_id is not null then
    -- Two calls with the same id wait for each other; the second returns the first's invite.
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('app.family_invite_create:' || v_uid::text || ':' || p_client_id::text, 0)
    );
    select m.* into v_member from app.family_members m
    join app.family_circles c on c.id = m.circle_id
    where c.owner_user_id = v_uid and m.client_id = p_client_id;
    if found then
      return app.family_invite_json(v_member);
    end if;
  end if;
  if p_scope is null or pg_catalog.jsonb_typeof(p_scope) <> 'object'
     or coalesce(pg_catalog.jsonb_typeof(p_scope -> 'all'), 'null') not in ('boolean', 'null') then
    perform ops.raise_api_error('invalid_input', 'Say which projects to share: some of them, or all.');
  end if;
  v_all := coalesce((p_scope ->> 'all')::boolean, false);
  v_slugs := p_scope -> 'slugs';
  if v_all = (v_slugs is not null and pg_catalog.jsonb_typeof(v_slugs) <> 'null') then
    perform ops.raise_api_error('invalid_input', 'Share some projects (slugs) or all of them, not both.');
  end if;

  if v_all then
    v_ids := app.followed_phase_ids(v_uid);
    if pg_catalog.cardinality(v_ids) = 0 then
      perform ops.raise_api_error('invalid_input', 'Follow a project first, then invite someone to it.');
    end if;
  else
    if pg_catalog.jsonb_typeof(v_slugs) <> 'array' or pg_catalog.jsonb_array_length(v_slugs) = 0
       or pg_catalog.jsonb_array_length(v_slugs) > 50 then
      perform ops.raise_api_error('invalid_input', 'Share between 1 and 50 projects.');
    end if;
    for v_slug in select pg_catalog.jsonb_array_elements_text(v_slugs) loop
      v_phase := app.phase_by_slug(v_slug);
      if not exists (select 1 from app.follows f where f.user_id = v_uid and f.phase_id = v_phase.id) then
        perform ops.raise_api_error('invalid_input', 'You can share only projects you follow.');
      end if;
      if not (v_phase.id = any (v_ids)) then
        v_ids := v_ids || v_phase.id;
      end if;
    end loop;
  end if;

  insert into app.family_circles (owner_user_id) values (v_uid)
  on conflict (owner_user_id) do nothing;
  select c.id into v_circle from app.family_circles c where c.owner_user_id = v_uid for update;
  if (
    select count(*) from app.family_members m
    where m.circle_id = v_circle and m.status = 'invited' and m.expires_at > ops.now()
  ) >= 10 then
    perform ops.raise_api_error('conflict', 'You have 10 open invites. Cancel one before you make another.');
  end if;

  insert into app.family_members (
    circle_id, invite_code, scope_phase_ids, scope_all, status, invited_at, expires_at, can_add_notes, client_id
  )
  values (
    v_circle, app.new_invite_code(app.invite_code_prefix(v_uid, v_ids, v_all)), v_ids, v_all, 'invited',
    ops.now(), ops.now() + interval '7 days', coalesce(p_can_add_notes, false), p_client_id
  )
  returning * into v_member;
  return app.family_invite_json(v_member);
end
$$;
comment on function api.family_invite_create(jsonb, uuid, boolean) is 'plinth.family_invite/1 (API_CONTRACTS §4.11): a code for one relative, valid 7 days, carrying no phone number, for some of the caller''s followed phases or all of them. p_can_add_notes lets the relative add shortlist notes. At most 10 open invites. Idempotent on p_client_id. Errors: auth_required, forbidden, invalid_input, not_found, conflict.';

create function api.family_invite_cancel(p_code text, p_client_id uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
  v_code text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_code, '')));
  v_member app.family_members;
  v_out jsonb;
begin
  v_out := app.replay_get(v_uid, 'family_invite_cancel', p_client_id);
  if v_out is not null then
    return v_out;
  end if;
  select m.* into v_member from app.family_members m
  join app.family_circles c on c.id = m.circle_id
  where c.owner_user_id = v_uid and m.invite_code = v_code
  for update of m;
  if not found then
    perform ops.raise_api_error('not_found', 'You have no invite with this code.');
  end if;
  if v_member.status = 'joined' then
    perform ops.raise_api_error('invalid_input', 'Someone joined with this code. Remove them from your circle instead.');
  end if;
  if v_member.status = 'invited' then
    update app.family_members m set status = 'removed', removed_at = ops.now() where m.id = v_member.id;
  end if;
  return app.replay_put(v_uid, 'family_invite_cancel', p_client_id, pg_catalog.jsonb_build_object('ok', true));
end
$$;
comment on function api.family_invite_cancel(text, uuid) is 'Ok: the code stops working (status removed). An invite already cancelled or expired is fine. Errors: auth_required, forbidden, not_found (not the caller''s), invalid_input (already used).';

create function api.family_member_remove(p_member_id uuid, p_client_id uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
  v_member app.family_members;
  v_out jsonb;
begin
  v_out := app.replay_get(v_uid, 'family_member_remove', p_client_id);
  if v_out is not null then
    return v_out;
  end if;
  v_member := app.own_member(v_uid, p_member_id);
  if v_member.id is null then
    perform ops.raise_api_error('not_found', 'There is no one with this id in your circle.');
  end if;
  if v_member.status in ('joined', 'invited') then
    update app.family_members m set status = 'removed', removed_at = ops.now() where m.id = v_member.id;
  end if;
  return app.replay_put(v_uid, 'family_member_remove', p_client_id, pg_catalog.jsonb_build_object('ok', true));
end
$$;
comment on function api.family_member_remove(uuid, uuid) is 'Ok: the member (or open invite) leaves the caller''s circle; their alerts for it stop. Undo within an hour with api.family_member_undo. Errors: auth_required, forbidden, not_found.';

create function api.family_member_undo(p_member_id uuid, p_client_id uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
  v_member app.family_members;
  v_out jsonb;
begin
  v_out := app.replay_get(v_uid, 'family_member_undo', p_client_id);
  if v_out is not null then
    return v_out;
  end if;
  v_member := app.own_member(v_uid, p_member_id);
  if v_member.id is null then
    perform ops.raise_api_error('not_found', 'There is no one with this id in your circle.');
  end if;
  if v_member.status = 'removed' then
    if v_member.removed_at is null or v_member.removed_at <= ops.now() - interval '1 hour' then
      perform ops.raise_api_error('conflict', 'It''s too late to undo. Invite them again.');
    end if;
    begin
      update app.family_members m
         set status = case
               when m.joined_at is not null then 'joined'
               when m.expires_at > ops.now() then 'invited'
               else 'expired'
             end,
             removed_at = null
       where m.id = v_member.id;
    exception when unique_violation then
      perform ops.raise_api_error('conflict', 'They are already in your circle again.');
    end;
  end if;
  return app.replay_put(v_uid, 'family_member_undo', p_client_id, pg_catalog.jsonb_build_object('ok', true));
end
$$;
comment on function api.family_member_undo(uuid, uuid) is 'Ok: undoes api.family_member_remove or api.family_invite_cancel within an hour (a member who is still in the circle is fine). Errors: auth_required, forbidden, not_found, conflict (too late).';

-- ---------------------------------------------------------------------------
-- Joining: the relative's own act (the app, or their own WhatsApp "JOIN <code>").
-- ---------------------------------------------------------------------------
create function api.family_join(p_code text, p_client_id uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
  v_member app.family_members;
  v_existing app.family_members;
  v_out jsonb;
begin
  v_out := app.replay_get(v_uid, 'family_join', p_client_id);
  if v_out is not null then
    return v_out;
  end if;
  v_member := app.live_invite(p_code);
  if v_member.id is null then
    perform app.neutral_code_error();
  end if;
  if app.circle_owner(v_member.circle_id) = v_uid then
    perform ops.raise_api_error('invalid_input', 'This is your own circle. Send the link to the person you want to invite.');
  end if;
  -- Already in this circle: the code stays unused and the existing membership answers.
  select m.* into v_existing from app.family_members m
  where m.circle_id = v_member.circle_id and m.member_user_id = v_uid and m.status = 'joined';
  if found then
    return app.replay_put(v_uid, 'family_join', p_client_id, app.family_join_json(v_existing));
  end if;
  update app.family_members m
     set member_user_id = v_uid,
         wa_contact_id = coalesce(m.wa_contact_id, (app.wa_contact_of(v_uid)).id),
         status = 'joined',
         joined_at = ops.now(),
         joined_via = 'app'
   where m.id = v_member.id
  returning * into v_member;
  return app.replay_put(v_uid, 'family_join', p_client_id, app.family_join_json(v_member));
end
$$;
comment on function api.family_join(text, uuid) is 'plinth.family_join/1: the signed-in relative joins with a code (the app path; their own tap is the opt-in). One person per code. Errors: auth_required, forbidden, not_found (unknown, used, cancelled or expired code: one neutral answer), invalid_input (own circle).';

create function ops.family_join_by_code(p_code text, p_wa_contact_id uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_contact pii.wa_contacts;
  v_member app.family_members;
  v_existing app.family_members;
begin
  select k.* into v_contact from pii.wa_contacts k where k.id = p_wa_contact_id for update;
  if not found then
    perform ops.raise_api_error('not_found', 'We have no WhatsApp contact with this id.');
  end if;
  v_member := app.live_invite(p_code);
  if v_member.id is null then
    perform app.neutral_code_error();
  end if;
  if v_contact.user_id is not null and app.circle_owner(v_member.circle_id) = v_contact.user_id then
    perform ops.raise_api_error('invalid_input', 'This is your own circle. Send the link to the person you want to invite.');
  end if;
  select m.* into v_existing from app.family_members m
  where m.circle_id = v_member.circle_id and m.status = 'joined'
    and (m.wa_contact_id = v_contact.id or (v_contact.user_id is not null and m.member_user_id = v_contact.user_id));
  if found then
    return app.family_join_json(v_existing);
  end if;

  update app.family_members m
     set wa_contact_id = v_contact.id,
         member_user_id = v_contact.user_id,
         status = 'joined',
         joined_at = ops.now(),
         joined_via = 'whatsapp'
   where m.id = v_member.id
  returning * into v_member;

  -- "JOIN <code>" is the relative's own opt-in to the utility alerts the circle sends.
  if not v_contact.utility_opt_in or v_contact.stopped_at is not null then
    update pii.wa_contacts k set utility_opt_in = true, stopped_at = null where k.id = v_contact.id;
    perform ops.audit('opt_in', 'pii.wa_contacts', v_contact.id::text,
      pg_catalog.jsonb_build_object('utility_opt_in', v_contact.utility_opt_in, 'stopped_at', v_contact.stopped_at),
      pg_catalog.jsonb_build_object('utility_opt_in', true, 'stopped_at', null),
      'JOIN ' || v_member.invite_code);
  end if;
  return app.family_join_json(v_member);
end
$$;
comment on function ops.family_join_by_code(text, uuid) is 'The relative''s own WhatsApp "JOIN <code>" (API_CONTRACTS §4.11): joins them to the circle by their WhatsApp contact (and account, if linked) and records the message as their opt-in to utility alerts. plinth.family_join/1. Errors: not_found (neutral for unknown, used, cancelled or expired codes), invalid_input (own circle).';

create function api.whatsapp_family_join(p_contact_id uuid, p_code text, p_wa_message_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from comms.wa_messages m
    where m.wa_message_id = p_wa_message_id and m.contact_id = p_contact_id and m.direction = 'in'
      and m.created_at >= pg_catalog.now() - interval '24 hours'
  ) then
    perform ops.raise_api_error('forbidden', 'Only the relative''s own message can join a circle.');
  end if;
  return ops.family_join_by_code(p_code, p_contact_id);
end
$$;
comment on function api.whatsapp_family_join(uuid, text, text) is 'wa-webhook (service_role, T46b): "JOIN <code>" from p_contact_id, whose inbound message p_wa_message_id (received in the last 24 hours, the session window) is the evidence. Calls ops.family_join_by_code. plinth.family_join/1.';

-- ---------------------------------------------------------------------------
-- The shared shortlist: a dated note from the owner or a member allowed to add notes.
-- ---------------------------------------------------------------------------
create function api.shortlist_note_add(
  p_slug text,
  p_text text,
  p_client_id uuid default null,
  p_circle_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
  v_body text := pg_catalog.btrim(coalesce(p_text, ''));
  v_phase core.phases;
  v_circle uuid;
  v_owner uuid;
  v_member app.family_members;
  v_out jsonb;
begin
  v_out := app.replay_get(v_uid, 'shortlist_note_add', p_client_id);
  if v_out is not null then
    return v_out;
  end if;
  if pg_catalog.length(v_body) < 1 or pg_catalog.length(v_body) > 1000 then
    perform ops.raise_api_error('invalid_input', 'Write a note of up to 1,000 characters.');
  end if;
  v_phase := app.phase_by_slug(p_slug);

  if p_circle_id is null then
    -- The caller's own circle; otherwise the one circle they joined.
    select c.id into v_circle from app.family_circles c where c.owner_user_id = v_uid;
    if v_circle is null then
      select pg_catalog.min(m.circle_id::text)::uuid into v_circle from app.family_members m
      where m.member_user_id = v_uid and m.status = 'joined'
      having count(distinct m.circle_id) = 1;
    end if;
  else
    select c.id into v_circle from app.family_circles c
    where c.id = p_circle_id
      and (c.owner_user_id = v_uid or exists (
        select 1 from app.family_members m
        where m.circle_id = c.id and m.member_user_id = v_uid and m.status = 'joined'));
  end if;
  if v_circle is null then
    perform ops.raise_api_error('not_found', 'Join a family circle, or invite someone to yours, to share notes.');
  end if;

  v_owner := app.circle_owner(v_circle);
  if v_owner = v_uid then
    if not exists (select 1 from app.follows f where f.user_id = v_uid and f.phase_id = v_phase.id) then
      perform ops.raise_api_error('invalid_input', 'Add notes to projects you follow.');
    end if;
  else
    select m.* into v_member from app.family_members m
    where m.circle_id = v_circle and m.member_user_id = v_uid and m.status = 'joined';
    if v_member.id is null or not v_member.can_add_notes then
      perform ops.raise_api_error('forbidden', 'Only members who were given the right to add notes can add one.');
    end if;
    if not coalesce(
      (v_member.scope_all and exists (select 1 from app.follows f where f.user_id = v_owner and f.phase_id = v_phase.id))
      or v_phase.id = any (v_member.scope_phase_ids),
      false
    ) then
      perform ops.raise_api_error('invalid_input', 'Add notes to the projects shared with you.');
    end if;
  end if;

  insert into app.shortlist_notes (circle_id, phase_id, author_user_id, body, created_at)
  values (v_circle, v_phase.id, v_uid, v_body, ops.now());
  return app.replay_put(v_uid, 'shortlist_note_add', p_client_id, pg_catalog.jsonb_build_object('ok', true));
end
$$;
comment on function api.shortlist_note_add(text, text, uuid, uuid) is 'Ok: a dated note on the shared shortlist, by the circle owner (on a phase they follow) or a joined member with can_add_notes (on a shared phase). p_circle_id picks the circle when the caller is in more than one. Idempotent on p_client_id. Errors: auth_required, forbidden (no right to add notes), invalid_input, not_found.';

-- ---------------------------------------------------------------------------
-- Grants.
-- ---------------------------------------------------------------------------
revoke all on function api.family_circle() from public, anon, service_role;
revoke all on function api.family_invite_preview(text) from public, service_role;
revoke all on function api.family_invite_create(jsonb, uuid, boolean) from public, anon, service_role;
revoke all on function api.family_invite_cancel(text, uuid) from public, anon, service_role;
revoke all on function api.family_member_remove(uuid, uuid) from public, anon, service_role;
revoke all on function api.family_member_undo(uuid, uuid) from public, anon, service_role;
revoke all on function api.family_join(text, uuid) from public, anon, service_role;
revoke all on function api.shortlist_note_add(text, text, uuid, uuid) from public, anon, service_role;
revoke all on function api.whatsapp_family_join(uuid, text, text) from public, anon, authenticated;
revoke all on function ops.family_join_by_code(text, uuid) from public, anon, authenticated;

grant execute on function api.family_circle() to authenticated;
grant execute on function api.family_invite_preview(text) to anon, authenticated;
grant execute on function api.family_invite_create(jsonb, uuid, boolean) to authenticated;
grant execute on function api.family_invite_cancel(text, uuid) to authenticated;
grant execute on function api.family_member_remove(uuid, uuid) to authenticated;
grant execute on function api.family_member_undo(uuid, uuid) to authenticated;
grant execute on function api.family_join(text, uuid) to authenticated;
grant execute on function api.shortlist_note_add(text, text, uuid, uuid) to authenticated;
grant execute on function api.whatsapp_family_join(uuid, text, text) to service_role;

-- Lockdown sweep for `app` (see 20261110000100).
revoke all on all functions in schema app from public, anon, authenticated;
