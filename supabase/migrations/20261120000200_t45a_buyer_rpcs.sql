-- T45a · Buyer API 2/3: account, follows, alerts, saved searches, project requests and
-- WhatsApp follow linking.
--   api.me, api.device_register,
--   api.follow, api.unfollow, api.set_follow_type,
--   api.alert_prefs_get, api.alert_prefs_set,
--   api.saved_searches, api.saved_search_save, api.saved_search_delete,
--   api.request_project,
--   api.link_whatsapp_follows ("Bring them here"),
--   api.whatsapp_follow_record (service role: a WhatsApp "Follow project" tap from an unlinked number).
-- Sources: API_CONTRACTS §1, §3.2, §4.7, §4.9; DATA_MODEL §5, §9; DESIGN §5b (Request a project:
-- added within 14 days, R-MMDD-NN); packages/contracts schemas me, follow, alert_prefs,
-- saved_search, saved_searches, request_project and link_whatsapp_follows (the shapes).
--
-- Every buyer RPC is SECURITY DEFINER with search_path = '', acts only for auth.uid() under the
-- buyer's own JWT (app.buyer_caller), and is granted to authenticated only. A WhatsApp tap JWT
-- (T44's mintTapToken, amr whatsapp_tap) is accepted by api.me, api.follow, api.unfollow,
-- api.set_follow_type, api.alert_prefs_get, api.alert_prefs_set and api.request_project; the
-- others refuse it. Mutations taking p_client_id return the first result on a replay
-- (app.rpc_replays, or the row's own client_id). Writes are audited by the tables' triggers.
--
-- Errors (API_CONTRACTS §1): auth_required 401, forbidden 403, not_found 404, conflict 409,
-- consent_required 409, invalid_input 422.

-- ---------------------------------------------------------------------------
-- api.me → plinth.me/1
-- ---------------------------------------------------------------------------
create function api.me()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(true);
  v_profile app.profiles;
  v_roles jsonb;
begin
  select p.* into v_profile from app.profiles p where p.id = v_uid;
  select coalesce(pg_catalog.jsonb_agg(r.role order by r.role), '[]'::jsonb) into v_roles
  from (select distinct ur.role from app.user_roles ur where ur.user_id = v_uid) r;
  -- Every account is at least a buyer (T41's access-token hook says the same).
  if v_roles = '[]'::jsonb then
    v_roles := '["buyer"]'::jsonb;
  end if;
  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.me/1',
    'user_id', v_uid,
    'first_name', v_profile.first_name,
    'phone_masked', v_profile.phone_masked,
    'adult_attested_at', case when v_profile.adult_attested_at is not null then core.fmt_timestamp(v_profile.adult_attested_at) end,
    'roles', v_roles
  );
end
$$;
comment on function api.me() is 'plinth.me/1: the signed-in account (app.profiles, app.user_roles). The number itself never leaves auth: only the masked form. Errors: auth_required, forbidden.';

-- ---------------------------------------------------------------------------
-- api.device_register → Ok
-- ---------------------------------------------------------------------------
create function api.device_register(p_token text, p_platform text, p_app_version text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
  v_token text := pg_catalog.btrim(coalesce(p_token, ''));
begin
  if v_token = '' or pg_catalog.length(v_token) > 4096 then
    perform ops.raise_api_error('invalid_input', 'The device token is missing.');
  end if;
  if p_platform is null or p_platform not in ('android', 'ios', 'web') then
    perform ops.raise_api_error('invalid_input', 'The platform is android, ios or web.');
  end if;
  if p_app_version is not null and pg_catalog.length(p_app_version) > 40 then
    perform ops.raise_api_error('invalid_input', 'The app version is too long.');
  end if;
  -- A token belongs to the device's current account: signing in on a device moves it.
  insert into app.devices as d (user_id, fcm_token, platform, app_version, last_seen)
  values (v_uid, v_token, p_platform, nullif(pg_catalog.btrim(p_app_version), ''), pg_catalog.now())
  on conflict (fcm_token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform,
        app_version = excluded.app_version,
        last_seen = excluded.last_seen;
  return pg_catalog.jsonb_build_object('ok', true);
end
$$;
comment on function api.device_register(text, text, text) is 'Ok: registers the caller''s push token (app.devices). A token already registered moves to the caller (the device signed in again). Errors: auth_required, forbidden, invalid_input.';

-- ---------------------------------------------------------------------------
-- Follows → plinth.follow/1 (API_CONTRACTS §4.7)
-- ---------------------------------------------------------------------------
create function app.follow_json(p_follow app.follows)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
      'schema', 'plinth.follow/1',
      'slug', (select p.slug from core.phases p where p.id = p_follow.phase_id),
      'follow_type', p_follow.follow_type,
      'followed_at', core.fmt_timestamp(p_follow.followed_at),
      'alerts_line', case p_follow.follow_type
        when 'booked' then 'Band changes, filings, orders and extensions, plus payment-stage alerts. Utility alerts only.'
        else 'Band changes, filings, orders and extensions. Utility alerts only.'
      end,
      'private_line', 'Your family circle doesn''t see your follow type.'
    )
    || case when p_follow.follow_type = 'booked' then pg_catalog.jsonb_build_object(
      'links', pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('label', 'Pay-as-built', 'href', '/check/pay-as-built'),
        pg_catalog.jsonb_build_object('label', 'What a booked buyer can do', 'href', '/guides/booked-buyer')
      )
    ) else '{}'::jsonb end
$$;
comment on function app.follow_json(app.follows) is 'plinth.follow/1 for a follow row. Booked adds payment-stage alerts and the Pay-as-built and booked-buyer links (DESIGN §5b C-39).';

-- Booked buyers get payment-stage alerts (§4.7). Never sent to the family circle (DATA_MODEL §12 inv. 5).
create function app.ensure_payment_alerts(p_uid uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into app.alert_subscriptions (user_id, channel, kind, cadence, quiet_from, quiet_to)
  select p_uid, 'push', 'payment_stage', 'instant', q.quiet_from, q.quiet_to
  from (select null::int as x) one
  left join lateral (
    select s.quiet_from, s.quiet_to from app.alert_subscriptions s
    where s.user_id = p_uid and s.quiet_from is not null
    order by s.created_at limit 1
  ) q on true
  on conflict (user_id, channel, kind) do nothing
$$;
comment on function app.ensure_payment_alerts(uuid) is 'Adds a push payment_stage subscription (instant) unless the buyer already chose one.';

create function api.follow(
  p_slug text,
  p_follow_type text default 'watching',
  p_source text default 'web',
  p_client_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(true);
  v_source text := p_source;
  v_phase core.phases;
  v_row app.follows;
  v_out jsonb;
begin
  v_out := app.replay_get(v_uid, 'follow', p_client_id);
  if v_out is not null then
    return v_out;
  end if;
  if p_follow_type is null or p_follow_type not in ('watching', 'booked') then
    perform ops.raise_api_error('invalid_input', 'A follow is watching or booked.');
  end if;
  if app.buyer_is_tap() then
    v_source := 'whatsapp';
  elsif v_source is null or v_source not in ('web', 'app', 'family') then
    perform ops.raise_api_error('invalid_input', 'A follow comes from the web, the app or the family circle.');
  end if;
  v_phase := app.phase_by_slug(p_slug);

  insert into app.follows (user_id, phase_id, follow_type, source, followed_at)
  values (v_uid, v_phase.id, p_follow_type, v_source, ops.now())
  on conflict (user_id, phase_id) do nothing
  returning * into v_row;
  if v_row.id is null then
    -- Already followed: the follow keeps its date and type (api.set_follow_type changes the type).
    select f.* into v_row from app.follows f where f.user_id = v_uid and f.phase_id = v_phase.id;
  elsif v_row.follow_type = 'booked' then
    perform app.ensure_payment_alerts(v_uid);
  end if;
  return app.replay_put(v_uid, 'follow', p_client_id, app.follow_json(v_row));
end
$$;
comment on function api.follow(text, text, text, uuid) is 'plinth.follow/1 (API_CONTRACTS §4.7): follow a phase. Following again returns the existing follow. Idempotent on p_client_id. A WhatsApp tap JWT records source whatsapp. Errors: auth_required, forbidden, invalid_input, not_found.';

create function api.unfollow(p_slug text, p_client_id uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(true);
  v_phase core.phases;
  v_out jsonb;
begin
  v_out := app.replay_get(v_uid, 'unfollow', p_client_id);
  if v_out is not null then
    return v_out;
  end if;
  v_phase := app.phase_by_slug(p_slug);
  delete from app.follows f where f.user_id = v_uid and f.phase_id = v_phase.id;
  return app.replay_put(v_uid, 'unfollow', p_client_id, pg_catalog.jsonb_build_object('ok', true));
end
$$;
comment on function api.unfollow(text, uuid) is 'Ok: the caller no longer follows the phase (already not following is fine). Idempotent on p_client_id. Errors: auth_required, forbidden, invalid_input, not_found.';

create function api.set_follow_type(p_slug text, p_follow_type text, p_client_id uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(true);
  v_phase core.phases;
  v_row app.follows;
  v_out jsonb;
begin
  v_out := app.replay_get(v_uid, 'set_follow_type', p_client_id);
  if v_out is not null then
    return v_out;
  end if;
  if p_follow_type is null or p_follow_type not in ('watching', 'booked') then
    perform ops.raise_api_error('invalid_input', 'A follow is watching or booked.');
  end if;
  v_phase := app.phase_by_slug(p_slug);
  select f.* into v_row from app.follows f where f.user_id = v_uid and f.phase_id = v_phase.id for update;
  if not found then
    perform ops.raise_api_error('not_found', 'You don''t follow this project. Follow it first.');
  end if;
  if v_row.follow_type <> p_follow_type then
    update app.follows f set follow_type = p_follow_type where f.id = v_row.id returning * into v_row;
  end if;
  if v_row.follow_type = 'booked' then
    perform app.ensure_payment_alerts(v_uid);
  end if;
  return app.replay_put(v_uid, 'set_follow_type', p_client_id, app.follow_json(v_row));
end
$$;
comment on function api.set_follow_type(text, text, uuid) is 'plinth.follow/1: watching or booked. Booked adds payment-stage alerts and the Pay-as-built links (§4.7). Never visible to the family circle. Idempotent on p_client_id. Errors: auth_required, forbidden, invalid_input, not_found.';

-- ---------------------------------------------------------------------------
-- Alerts → plinth.alert_prefs/1 (API_CONTRACTS §4.9)
-- ---------------------------------------------------------------------------
create function app.alert_prefs_json(p_uid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_prefs jsonb;
  v_quiet jsonb;
  v_ready boolean := app.whatsapp_ready(p_uid);
begin
  select coalesce(pg_catalog.jsonb_object_agg(c.channel, c.kinds), '{}'::jsonb) into v_prefs
  from (
    select s.channel, pg_catalog.jsonb_object_agg(s.kind, s.cadence) as kinds
    from app.alert_subscriptions s
    where s.user_id = p_uid and s.enabled
    group by s.channel
  ) c;
  select pg_catalog.jsonb_build_object(
           'from', pg_catalog.to_char(s.quiet_from, 'HH24:MI'),
           'to', pg_catalog.to_char(s.quiet_to, 'HH24:MI'))
    into v_quiet
  from app.alert_subscriptions s
  where s.user_id = p_uid and s.enabled and s.quiet_from is not null
  order by s.updated_at desc, s.created_at desc
  limit 1;
  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.alert_prefs/1',
    'prefs', v_prefs || pg_catalog.jsonb_build_object('quiet_hours', v_quiet),
    'whatsapp_optin', v_ready,
    'lines', pg_catalog.to_jsonb(
      array['Utility alerts only. No offers, no ads, and nothing from developers.']
      || case when v_ready then array['Reply STOP to end alerts.'] else '{}'::text[] end
    ),
    'number_line', app.number_line(p_uid)
  );
end
$$;
comment on function app.alert_prefs_json(uuid) is 'plinth.alert_prefs/1 for a buyer: cadence per channel and kind (app.alert_subscriptions), quiet hours (IST), WhatsApp opt-in, the number line.';

create function api.alert_prefs_get()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(true);
begin
  return app.alert_prefs_json(v_uid);
end
$$;
comment on function api.alert_prefs_get() is 'plinth.alert_prefs/1 (API_CONTRACTS §4.9): the caller''s alert settings. Errors: auth_required, forbidden.';

create function api.alert_prefs_set(p_prefs jsonb, p_client_id uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(true);
  v_out jsonb;
  v_channel text;
  v_kinds jsonb;
  v_kind text;
  v_cadence jsonb;
  v_quiet jsonb;
  v_from time;
  v_to time;
  v_has_quiet boolean;
begin
  v_out := app.replay_get(v_uid, 'alert_prefs_set', p_client_id);
  if v_out is not null then
    return v_out;
  end if;
  if p_prefs is null or pg_catalog.jsonb_typeof(p_prefs) <> 'object' then
    perform ops.raise_api_error('invalid_input', 'Send the alert settings as an object.');
  end if;

  -- Validate everything first: nothing is written unless the whole request is valid.
  for v_channel, v_kinds in select e.key, e.value from pg_catalog.jsonb_each(p_prefs) e loop
    if v_channel = 'quiet_hours' then
      continue;
    end if;
    if v_channel not in ('push', 'whatsapp', 'email') then
      perform ops.raise_api_error('invalid_input', 'Alerts go by push, WhatsApp or email.');
    end if;
    if pg_catalog.jsonb_typeof(v_kinds) <> 'object' then
      perform ops.raise_api_error('invalid_input', 'Each channel lists alert kinds and how often.');
    end if;
    for v_kind, v_cadence in select k.key, k.value from pg_catalog.jsonb_each(v_kinds) k loop
      if v_kind not in ('band_change', 'filings', 'orders', 'extensions', 'price', 'digest', 'payment_stage') then
        perform ops.raise_api_error('invalid_input', 'That alert kind is not one we send.');
      end if;
      if pg_catalog.jsonb_typeof(v_cadence) <> 'string'
         or (v_cadence #>> '{}') not in ('instant', 'daily_8am', 'weekly_sun_9am', 'off') then
        perform ops.raise_api_error('invalid_input', 'How often is instant, daily_8am, weekly_sun_9am or off.');
      end if;
      if v_channel = 'whatsapp' and (v_cadence #>> '{}') <> 'off' and not app.whatsapp_ready(v_uid) then
        perform ops.raise_api_error(
          'consent_required',
          'WhatsApp alerts need your WhatsApp first: message Plinth on WhatsApp and tap the button to get alerts there.'
        );
      end if;
    end loop;
  end loop;

  v_has_quiet := p_prefs ? 'quiet_hours';
  v_quiet := p_prefs -> 'quiet_hours';
  if v_has_quiet and pg_catalog.jsonb_typeof(v_quiet) = 'object' then
    if coalesce(v_quiet ->> 'from', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or coalesce(v_quiet ->> 'to', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
      perform ops.raise_api_error('invalid_input', 'Quiet hours are from and to, as HH:MM in India time.');
    end if;
    v_from := (v_quiet ->> 'from')::time;
    v_to := (v_quiet ->> 'to')::time;
  elsif v_has_quiet and pg_catalog.jsonb_typeof(v_quiet) <> 'null' then
    perform ops.raise_api_error('invalid_input', 'Quiet hours are from and to, as HH:MM in India time.');
  elsif not v_has_quiet then
    -- Unchanged: a new row takes the quiet hours the buyer already has.
    select s.quiet_from, s.quiet_to into v_from, v_to
    from app.alert_subscriptions s
    where s.user_id = v_uid and s.quiet_from is not null
    order by s.updated_at desc, s.created_at desc
    limit 1;
  end if;

  for v_channel, v_kinds in select e.key, e.value from pg_catalog.jsonb_each(p_prefs) e where e.key <> 'quiet_hours' loop
    for v_kind, v_cadence in select k.key, k.value from pg_catalog.jsonb_each(v_kinds) k loop
      insert into app.alert_subscriptions as s (user_id, channel, kind, cadence, quiet_from, quiet_to, enabled)
      values (v_uid, v_channel, v_kind, v_cadence #>> '{}', v_from, v_to, true)
      on conflict (user_id, channel, kind) do update
        set cadence = excluded.cadence, enabled = true
        where s.cadence is distinct from excluded.cadence or not s.enabled;
    end loop;
  end loop;

  if v_has_quiet then
    update app.alert_subscriptions s
       set quiet_from = v_from, quiet_to = v_to
     where s.user_id = v_uid
       and (s.quiet_from is distinct from v_from or s.quiet_to is distinct from v_to);
  end if;

  return app.replay_put(v_uid, 'alert_prefs_set', p_client_id, app.alert_prefs_json(v_uid));
end
$$;
comment on function api.alert_prefs_set(jsonb, uuid) is 'plinth.alert_prefs/1 (API_CONTRACTS §4.9): sets the cadence of each channel and kind given (others are unchanged; "off" stops one) and, when present, the quiet hours (null clears them). WhatsApp needs a linked, opted-in contact: otherwise consent_required. Idempotent on p_client_id. Errors: auth_required, forbidden, invalid_input, consent_required.';

-- ---------------------------------------------------------------------------
-- Saved searches → plinth.saved_search/1, plinth.saved_searches/1
-- ---------------------------------------------------------------------------
create function app.saved_search_item_json(p_row app.saved_searches)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'id', p_row.id,
    'name', p_row.label,
    'query', p_row.filters,
    'in_digest', p_row.in_digest,
    'saved_at', core.fmt_timestamp(p_row.created_at),
    'updated_at', core.fmt_timestamp(p_row.updated_at)
  )
$$;
comment on function app.saved_search_item_json(app.saved_searches) is 'SavedSearchItem: one saved search.';

create function api.saved_searches()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
begin
  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.saved_searches/1',
    'items', coalesce((
      select pg_catalog.jsonb_agg(app.saved_search_item_json(s) order by s.created_at desc, s.id)
      from app.saved_searches s
      where s.user_id = v_uid
    ), '[]'::jsonb),
    'max_items', 25
  );
end
$$;
comment on function api.saved_searches() is 'plinth.saved_searches/1: the caller''s saved searches, newest first (at most 25). Errors: auth_required, forbidden.';

create function api.saved_search_save(
  p_query jsonb,
  p_name text default null,
  p_in_digest boolean default false,
  p_id uuid default null,
  p_client_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
  v_label text := nullif(pg_catalog.btrim(coalesce(p_name, '')), '');
  v_row app.saved_searches;
  v_out jsonb;
begin
  v_out := app.replay_get(v_uid, 'saved_search_save', p_client_id);
  if v_out is not null then
    return v_out;
  end if;
  if p_query is null or pg_catalog.jsonb_typeof(p_query) <> 'object'
     or pg_catalog.length(p_query::text) > 4000 then
    perform ops.raise_api_error('invalid_input', 'Send the search to save as an object of filters.');
  end if;
  if v_label is not null and pg_catalog.length(v_label) > 80 then
    perform ops.raise_api_error('invalid_input', 'Keep the name under 80 characters.');
  end if;

  if p_id is not null then
    update app.saved_searches s
       set filters = p_query, label = v_label, in_digest = coalesce(p_in_digest, false)
     where s.id = p_id and s.user_id = v_uid
    returning * into v_row;
    if v_row.id is null then
      perform ops.raise_api_error('not_found', 'We have no saved search with this id.');
    end if;
  else
    -- The same filters saved again update the one saved search.
    select s.* into v_row from app.saved_searches s
    where s.user_id = v_uid and s.filters = p_query
    order by s.created_at limit 1 for update;
    if found then
      update app.saved_searches s
         set label = coalesce(v_label, s.label), in_digest = coalesce(p_in_digest, false)
       where s.id = v_row.id
      returning * into v_row;
    else
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('app.saved_searches:' || v_uid::text, 0));
      if (select count(*) from app.saved_searches s where s.user_id = v_uid) >= 25 then
        perform ops.raise_api_error('conflict', 'You can save up to 25 searches. Delete one to save another.');
      end if;
      insert into app.saved_searches (user_id, filters, label, in_digest)
      values (v_uid, p_query, v_label, coalesce(p_in_digest, false))
      returning * into v_row;
    end if;
  end if;

  return app.replay_put(v_uid, 'saved_search_save', p_client_id, pg_catalog.jsonb_build_object(
    'schema', 'plinth.saved_search/1',
    'search', app.saved_search_item_json(v_row),
    'line', case when v_row.in_digest then 'Saved. New matches go in your digest.' else 'Saved.' end
  ));
end
$$;
comment on function api.saved_search_save(jsonb, text, boolean, uuid, uuid) is 'plinth.saved_search/1: saves a search (the same filters update the one saved search; p_id edits one). At most 25. Idempotent on p_client_id. Errors: auth_required, forbidden, invalid_input, not_found, conflict.';

create function api.saved_search_delete(p_id uuid, p_client_id uuid default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
  v_out jsonb;
begin
  v_out := app.replay_get(v_uid, 'saved_search_delete', p_client_id);
  if v_out is not null then
    return v_out;
  end if;
  if p_id is null then
    perform ops.raise_api_error('invalid_input', 'Say which saved search to delete.');
  end if;
  -- Only the caller's own row; an unknown or already deleted id leaves nothing saved either way.
  delete from app.saved_searches s where s.id = p_id and s.user_id = v_uid;
  return app.replay_put(v_uid, 'saved_search_delete', p_client_id, pg_catalog.jsonb_build_object('ok', true));
end
$$;
comment on function api.saved_search_delete(uuid, uuid) is 'Ok: the saved search is not in the caller''s list any more. Never touches another buyer''s row. Idempotent. Errors: auth_required, forbidden, invalid_input.';

-- ---------------------------------------------------------------------------
-- Request a project → plinth.request_project/1 (DESIGN §5b: R-MMDD-NN, added within 14 days)
-- ---------------------------------------------------------------------------
create function app.project_request_json(p_row app.project_requests)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'schema', 'plinth.request_project/1',
    'ref', p_row.ref,
    'name', p_row.name_text,
    'rera', p_row.rera_text,
    'requested_on', ops.ist_date(p_row.requested_at),
    'due_on', p_row.due_on,
    'status', p_row.status,
    'line', case p_row.status
      when 'open' then 'We''ll add it by ' || ops.fmt_date(p_row.due_on) || ' or tell you why not.'
      when 'added' then 'We added it. Search for it to open its page.'
      else 'We didn''t add it' || coalesce(': ' || nullif(pg_catalog.btrim(p_row.reason), ''), '') || '.'
    end,
    'whatsapp_line', case when p_row.notify_whatsapp then 'We''ll tell you on WhatsApp too.' end
  )
$$;
comment on function app.project_request_json(app.project_requests) is 'plinth.request_project/1 for a request row: "We''ll add it by 1 Nov 2026 or tell you why not." (DESIGN §5b).';

create function api.request_project(
  p_name text,
  p_rera text default null,
  p_whatsapp_consent boolean default false,
  p_client_id uuid default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(true);
  v_name text := nullif(pg_catalog.regexp_replace(pg_catalog.btrim(coalesce(p_name, '')), '\s+', ' ', 'g'), '');
  v_rera text := nullif(pg_catalog.upper(pg_catalog.btrim(coalesce(p_rera, ''))), '');
  v_notify boolean := coalesce(p_whatsapp_consent, false);
  v_row app.project_requests;
begin
  if p_client_id is not null then
    select r.* into v_row from app.project_requests r where r.user_id = v_uid and r.client_id = p_client_id;
    if found then
      return app.project_request_json(v_row);
    end if;
  end if;
  if v_name is null and v_rera is null then
    perform ops.raise_api_error('invalid_input', 'Give the project''s name or its RERA number.');
  end if;
  if pg_catalog.length(v_name) > 200 or pg_catalog.length(v_rera) > 100 then
    perform ops.raise_api_error('invalid_input', 'That name or RERA number is too long.');
  end if;
  if v_rera is not null and exists (
    select 1 from core.rera_registrations r where pg_catalog.upper(r.rera_number) = v_rera
  ) then
    perform ops.raise_api_error('conflict', 'We already have this project. Search for its RERA number to open its page.');
  end if;
  if v_notify and not app.whatsapp_ready(v_uid) then
    perform ops.raise_api_error(
      'consent_required',
      'To hear back on WhatsApp, message Plinth on WhatsApp first and tap the button to get alerts there.'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('app.project_requests:' || v_uid::text, 0));
  -- The same open request again returns the one reference (and keeps a WhatsApp ask).
  select r.* into v_row from app.project_requests r
  where r.user_id = v_uid and r.status = 'open'
    and pg_catalog.lower(coalesce(r.name_text, '')) = pg_catalog.lower(coalesce(v_name, ''))
    and coalesce(pg_catalog.upper(r.rera_text), '') = coalesce(v_rera, '')
  order by r.requested_at limit 1;
  if found then
    if v_notify and not v_row.notify_whatsapp then
      update app.project_requests r set notify_whatsapp = true where r.id = v_row.id returning * into v_row;
    end if;
    return app.project_request_json(v_row);
  end if;

  insert into app.project_requests (user_id, name_text, rera_text, client_id, notify_whatsapp)
  values (v_uid, v_name, v_rera, p_client_id, v_notify)
  returning * into v_row;
  return app.project_request_json(v_row);
end
$$;
comment on function api.request_project(text, text, boolean, uuid) is 'plinth.request_project/1 (DESIGN §5b): records "Request a project" with a reference R-MMDD-NN, due in 14 days. p_whatsapp_consent (the buyer''s own tap) adds a WhatsApp answer and needs a linked, opted-in contact. The same open request returns its reference. Idempotent on p_client_id. Errors: auth_required, forbidden, invalid_input, conflict (already in our records), consent_required.';

-- ---------------------------------------------------------------------------
-- "Bring them here" → plinth.link_whatsapp_follows/1
-- ---------------------------------------------------------------------------
create function app.wa_follows_json(p_contact_id uuid, p_linked_user uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(pg_catalog.jsonb_agg(
           pg_catalog.jsonb_build_object('slug', p.slug, 'since', ops.ist_date(w.followed_at))
           order by w.followed_at, p.slug), '[]'::jsonb)
  from app.wa_follows w
  join core.phases p on p.id = w.phase_id
  where w.wa_contact_id = p_contact_id
    and case when p_linked_user is null then w.linked_at is null else w.linked_user_id = p_linked_user end
$$;
comment on function app.wa_follows_json(uuid, uuid) is 'A WhatsApp number''s follows: those not brought yet (p_linked_user null) or those brought into that account.';

create function api.link_whatsapp_follows(p_accept boolean)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.buyer_caller(false);
  v_phone text;
  v_contact pii.wa_contacts;
  v_after pii.wa_contacts;
  v_accept boolean := coalesce(p_accept, false);
  v_follows jsonb := '[]'::jsonb;
begin
  -- The WhatsApp number is the account's own verified phone (phone OTP sign-in).
  select pg_catalog.ltrim(u.phone, '+') into v_phone
  from auth.users u where u.id = v_uid and u.phone_confirmed_at is not null;
  if coalesce(v_phone, '') <> '' then
    select k.* into v_contact from pii.wa_contacts k where k.wa_id_e164 = '+' || v_phone for update;
  end if;

  -- No WhatsApp history for this number, or it belongs to another account: nothing to bring.
  if v_contact.id is null or (v_contact.user_id is not null and v_contact.user_id <> v_uid) then
    return pg_catalog.jsonb_build_object(
      'schema', 'plinth.link_whatsapp_follows/1',
      'accepted', v_accept,
      'linked', false,
      'follows', '[]'::jsonb,
      'cost_sheets', '[]'::jsonb
    );
  end if;

  if not v_accept then
    v_follows := app.wa_follows_json(v_contact.id, null);
  else
    if v_contact.user_id is null then
      update pii.wa_contacts k set user_id = v_uid where k.id = v_contact.id returning * into v_after;
      perform ops.audit('link', 'pii.wa_contacts', v_contact.id::text,
        pg_catalog.jsonb_build_object('user_id', null),
        pg_catalog.jsonb_build_object('user_id', v_uid),
        'Bring them here: the buyer''s own tap');
      v_contact := v_after;
    end if;
    insert into app.follows (user_id, phase_id, follow_type, source, followed_at)
    select v_uid, w.phase_id, 'watching', 'whatsapp', w.followed_at
    from app.wa_follows w
    where w.wa_contact_id = v_contact.id and w.linked_at is null
    on conflict (user_id, phase_id) do nothing;
    update app.wa_follows w
       set linked_user_id = v_uid, linked_at = ops.now()
     where w.wa_contact_id = v_contact.id and w.linked_at is null;
    v_follows := app.wa_follows_json(v_contact.id, v_uid);
  end if;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.link_whatsapp_follows/1',
    'accepted', v_accept,
    'linked', v_contact.user_id is not distinct from v_uid,
    'follows', v_follows,
    -- Cost sheets saved on WhatsApp are uploads (app.uploads, M3): none can be listed before then.
    'cost_sheets', '[]'::jsonb
  );
end
$$;
comment on function api.link_whatsapp_follows(boolean) is 'plinth.link_whatsapp_follows/1 ("Bring them here", API_CONTRACTS §3.2): p_accept false lists what the caller''s own verified number follows on WhatsApp, changing nothing; true (the buyer''s tap) links that WhatsApp contact to the account and moves its follows into app.follows (source whatsapp). A number linked to another account is never touched. Idempotent. Errors: auth_required, forbidden.';

-- ---------------------------------------------------------------------------
-- api.whatsapp_follow_record (service role): "Follow project" tapped by an unlinked number.
-- A linked number follows through api.follow under the tap JWT instead.
-- ---------------------------------------------------------------------------
create function api.whatsapp_follow_record(p_contact_id uuid, p_slug text, p_wa_message_id text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_contact pii.wa_contacts;
  v_phase core.phases;
  v_row app.wa_follows;
begin
  select k.* into v_contact from pii.wa_contacts k where k.id = p_contact_id;
  if not found then
    perform ops.raise_api_error('not_found', 'We have no WhatsApp contact with this id.');
  end if;
  if not exists (
    select 1 from comms.wa_messages m
    where m.wa_message_id = p_wa_message_id and m.contact_id = p_contact_id
      and m.direction = 'in' and m.type in ('interactive', 'button')
      and m.created_at >= pg_catalog.now() - interval '15 minutes'
  ) then
    perform ops.raise_api_error('forbidden', 'Only the number''s own recent tap can follow a project.');
  end if;
  if v_contact.user_id is not null then
    perform ops.raise_api_error('conflict', 'This number is linked to an account: follow with api.follow under the tap token.');
  end if;
  v_phase := app.phase_by_slug(p_slug);
  insert into app.wa_follows (wa_contact_id, phase_id, wa_message_id)
  values (p_contact_id, v_phase.id, p_wa_message_id)
  on conflict (wa_contact_id, phase_id) do nothing
  returning * into v_row;
  if v_row.id is null then
    select w.* into v_row from app.wa_follows w where w.wa_contact_id = p_contact_id and w.phase_id = v_phase.id;
  end if;
  return pg_catalog.jsonb_build_object('slug', v_phase.slug, 'since', ops.ist_date(v_row.followed_at), 'linked', v_row.linked_at is not null);
end
$$;
comment on function api.whatsapp_follow_record(uuid, text, text) is 'wa-webhook (service_role, T46a): records "Follow project" tapped by a WhatsApp number with no account (app.wa_follows), once per phase. The tap must be an inbound button/interactive message from that contact, received in the last 15 minutes (as comms.is_wa_tap). { slug, since, linked }. Errors: not_found, forbidden, conflict (linked number).';

-- ---------------------------------------------------------------------------
-- Grants. Buyer RPCs: authenticated only (never PUBLIC, anon or the service role).
-- ---------------------------------------------------------------------------
revoke all on function api.me() from public, anon, service_role;
revoke all on function api.device_register(text, text, text) from public, anon, service_role;
revoke all on function api.follow(text, text, text, uuid) from public, anon, service_role;
revoke all on function api.unfollow(text, uuid) from public, anon, service_role;
revoke all on function api.set_follow_type(text, text, uuid) from public, anon, service_role;
revoke all on function api.alert_prefs_get() from public, anon, service_role;
revoke all on function api.alert_prefs_set(jsonb, uuid) from public, anon, service_role;
revoke all on function api.saved_searches() from public, anon, service_role;
revoke all on function api.saved_search_save(jsonb, text, boolean, uuid, uuid) from public, anon, service_role;
revoke all on function api.saved_search_delete(uuid, uuid) from public, anon, service_role;
revoke all on function api.request_project(text, text, boolean, uuid) from public, anon, service_role;
revoke all on function api.link_whatsapp_follows(boolean) from public, anon, service_role;
revoke all on function api.whatsapp_follow_record(uuid, text, text) from public, anon, authenticated;

grant execute on function api.me() to authenticated;
grant execute on function api.device_register(text, text, text) to authenticated;
grant execute on function api.follow(text, text, text, uuid) to authenticated;
grant execute on function api.unfollow(text, uuid) to authenticated;
grant execute on function api.set_follow_type(text, text, uuid) to authenticated;
grant execute on function api.alert_prefs_get() to authenticated;
grant execute on function api.alert_prefs_set(jsonb, uuid) to authenticated;
grant execute on function api.saved_searches() to authenticated;
grant execute on function api.saved_search_save(jsonb, text, boolean, uuid, uuid) to authenticated;
grant execute on function api.saved_search_delete(uuid, uuid) to authenticated;
grant execute on function api.request_project(text, text, boolean, uuid) to authenticated;
grant execute on function api.link_whatsapp_follows(boolean) to authenticated;
grant execute on function api.whatsapp_follow_record(uuid, text, text) to service_role;

-- Lockdown sweep for `app` (see 20261110000100): the helpers above are never callable directly.
revoke all on all functions in schema app from public, anon, authenticated;
