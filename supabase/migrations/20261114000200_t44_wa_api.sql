-- T44 · WhatsApp 2/3: the service-only api.wa_* functions and the tap check.
-- Sources: API_CONTRACTS §5.1 (POST steps, statuses, sweeper), §5.2 (mock_sent);
-- DATA_MODEL §6 (consents need the principal's own JWT), §9.
--
-- Every api.wa_* function is SECURITY DEFINER with a pinned search_path and is executable by
-- service_role only: wa-webhook calls them with the secret key after it has verified Meta's
-- signature. anon and authenticated cannot reach them (supabase/tests/wa/001).
--
-- comms.is_wa_tap / comms.current_wa_tap are for the consent RPCs of T46a/T46b: a consent that
-- starts on WhatsApp is written under a short-lived user JWT that wa-webhook mints after it has
-- verified the tap (_shared/wa/verify.ts mintTapToken). Those RPCs call comms.current_wa_tap() to
-- check that the JWT names a real inbound tap from the same user's linked number.

-- ---------------------------------------------------------------------------
-- Helpers.
-- ---------------------------------------------------------------------------
create function comms.wa_status_rank(p_status text)
returns smallint
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case p_status
    when 'mock_sent' then 0
    when 'sent' then 1
    when 'delivered' then 2
    when 'read' then 3
    when 'failed' then 4
    else -1
  end::smallint
$$;
comment on function comms.wa_status_rank(text) is 'Outbound status order: a status callback only moves a message forward.';

create function comms.wa_contact_json(p_contact pii.wa_contacts)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'id', p_contact.id,
    'wa_id', pg_catalog.ltrim(p_contact.wa_id_e164, '+'),
    'user_id', p_contact.user_id,
    'utility_opt_in', p_contact.utility_opt_in,
    'stopped_at', p_contact.stopped_at,
    'last_inbound_at', p_contact.last_inbound_at
  )
$$;
comment on function comms.wa_contact_json(pii.wa_contacts) is 'The contact as wa-webhook reads it (edge only; the number never leaves the edge).';

-- ---------------------------------------------------------------------------
-- api.wa_ingest_inbound: steps 2 and 3 of API_CONTRACTS §5.1 in one call.
-- Upserts the contact (last_inbound_at only moves forward) and inserts the
-- message once. A redelivered wa_message_id returns duplicate = true and
-- inserts nothing. A new row is claimed for the fast path (route_attempts 1).
-- ---------------------------------------------------------------------------
create function api.wa_ingest_inbound(
  p_wa_id text,
  p_wa_message_id text,
  p_type text,
  p_payload jsonb,
  p_received_at timestamptz default null,
  p_context_wa_message_id text default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_e164 text := '+' || pg_catalog.ltrim(coalesce(p_wa_id, ''), '+');
  v_at timestamptz := coalesce(p_received_at, pg_catalog.now());
  v_contact pii.wa_contacts;
  v_message_id uuid;
begin
  if v_e164 !~ '^\+[1-9][0-9]{7,14}$' then
    perform ops.raise_api_error('invalid_input', 'The sender is not a WhatsApp number.');
  end if;
  if p_wa_message_id is null or pg_catalog.btrim(p_wa_message_id) = ''
    or pg_catalog.length(p_wa_message_id) > 256 then
    perform ops.raise_api_error('invalid_input', 'The message has no id.');
  end if;
  if p_type is null or p_type !~ '^[a-z_]{1,40}$' then
    perform ops.raise_api_error('invalid_input', 'The message type is not one we know.');
  end if;

  insert into pii.wa_contacts as c (wa_id_e164, first_seen, last_inbound_at)
  values (v_e164, v_at, v_at)
  on conflict (wa_id_e164) do update
    set last_inbound_at = greatest(c.last_inbound_at, excluded.last_inbound_at)
  returning * into v_contact;

  insert into comms.wa_messages (
    contact_id, direction, wa_message_id, type, payload, status,
    context_wa_message_id, route_attempts, route_claimed_at
  )
  values (
    v_contact.id, 'in', p_wa_message_id, p_type,
    case when pg_catalog.jsonb_typeof(p_payload) = 'object' then p_payload else '{}'::jsonb end,
    'received', p_context_wa_message_id, 1, pg_catalog.now()
  )
  on conflict (wa_message_id) do nothing
  returning id into v_message_id;

  return pg_catalog.jsonb_build_object(
    'duplicate', v_message_id is null,
    'message_id', v_message_id,
    'contact', comms.wa_contact_json(v_contact)
  );
end
$$;
comment on function api.wa_ingest_inbound(text, text, text, jsonb, timestamptz, text) is
  'wa-webhook (service_role): upsert the sender, insert the message once. { duplicate, message_id, contact }.';

-- ---------------------------------------------------------------------------
-- api.wa_apply_status: Meta's sent | delivered | read | failed callbacks.
-- Moves comms.wa_messages forward only, and comms.outbox (T42) when that table
-- exists: read maps to delivered there, and failed records last_error.
-- ---------------------------------------------------------------------------
create function api.wa_apply_status(
  p_wa_message_id text,
  p_status text,
  p_at timestamptz default null,
  p_error jsonb default null
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_at timestamptz := coalesce(p_at, pg_catalog.now());
  v_messages integer := 0;
  v_outbox integer := null;
begin
  if p_status is null or p_status not in ('sent', 'delivered', 'read', 'failed') then
    perform ops.raise_api_error('invalid_input', 'The status is not one Meta sends.');
  end if;

  update comms.wa_messages m
     set status = p_status,
         status_at = v_at,
         error = case when p_status = 'failed' then p_error else m.error end
   where m.wa_message_id = p_wa_message_id
     and m.direction = 'out'
     and comms.wa_status_rank(p_status) > comms.wa_status_rank(m.status);
  get diagnostics v_messages = row_count;

  if pg_catalog.to_regclass('comms.outbox') is not null then
    begin
      execute $sql$
        update comms.outbox o
           set status = $1,
               last_error = case when $1 = 'failed' then coalesce($3::text, o.last_error) else o.last_error end
         where o.provider_message_id = $2
           and (case $1 when 'sent' then 2 when 'delivered' then 3 when 'failed' then 4 else -1 end)
             > (case o.status when 'queued' then 0 when 'sending' then 1 when 'sent' then 2
                  when 'delivered' then 3 when 'failed' then 4 else 9 end)
      $sql$
      using case when p_status = 'read' then 'delivered' else p_status end, p_wa_message_id, p_error;
      get diagnostics v_outbox = row_count;
    exception
      when undefined_column or undefined_table or datatype_mismatch or invalid_text_representation
        or check_violation then
        raise warning 'T44 wa_apply_status: comms.outbox has an unexpected shape (%)', sqlerrm;
        v_outbox := null;
    end;
  end if;

  return pg_catalog.jsonb_build_object('messages', v_messages, 'outbox', v_outbox);
end
$$;
comment on function api.wa_apply_status(text, text, timestamptz, jsonb) is
  'wa-webhook (service_role): apply a status callback to comms.wa_messages and comms.outbox. { messages, outbox }.';

-- ---------------------------------------------------------------------------
-- api.wa_mark_routed: a handler finished (p_error null) or failed (p_error set:
-- the claim is released so the sweeper retries).
-- ---------------------------------------------------------------------------
create function api.wa_mark_routed(p_message_id uuid, p_route text, p_error text default null)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_route is not null and p_route !~ '^[a-z_]{1,40}$' then
    perform ops.raise_api_error('invalid_input', 'The route name is not valid.');
  end if;
  update comms.wa_messages m
     set route = coalesce(p_route, m.route),
         routed_at = case when p_error is null then pg_catalog.now() else null end,
         route_error = pg_catalog.left(p_error, 200),
         route_claimed_at = case when p_error is null then m.route_claimed_at else null end
   where m.id = p_message_id
     and m.direction = 'in'
     and m.routed_at is null;
end
$$;
comment on function api.wa_mark_routed(uuid, text, text) is
  'wa-webhook (service_role): record the route; an error releases the claim for the sweeper.';

-- ---------------------------------------------------------------------------
-- api.wa_claim_unrouted: the 1-minute sweeper. Claims inbound messages that no
-- router finished, whose claim is older than p_stale_seconds, below
-- p_max_attempts. SKIP LOCKED lets two sweepers run without taking the same row.
-- ---------------------------------------------------------------------------
create function api.wa_claim_unrouted(
  p_limit integer default 25,
  p_max_attempts integer default 5,
  p_stale_seconds integer default 60
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_out jsonb;
begin
  with picked as (
    select m.id
      from comms.wa_messages m
     where m.direction = 'in'
       and m.routed_at is null
       and m.route_attempts < greatest(p_max_attempts, 1)
       and (m.route_claimed_at is null
            or m.route_claimed_at < pg_catalog.now() - pg_catalog.make_interval(secs => greatest(p_stale_seconds, 1)))
     order by m.created_at
     limit least(greatest(coalesce(p_limit, 25), 1), 100)
       for update skip locked
  ),
  claimed as (
    update comms.wa_messages m
       set route_attempts = m.route_attempts + 1,
           route_claimed_at = pg_catalog.now()
      from picked
     where m.id = picked.id
    returning m.*
  )
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'message_id', c.id,
           'wa_message_id', c.wa_message_id,
           'type', c.type,
           'payload', c.payload,
           'context_wa_message_id', c.context_wa_message_id,
           'attempt', c.route_attempts,
           'contact', comms.wa_contact_json(k)
         ) order by c.created_at), '[]'::jsonb)
    into v_out
    from claimed c
    join pii.wa_contacts k on k.id = c.contact_id;
  return v_out;
end
$$;
comment on function api.wa_claim_unrouted(integer, integer, integer) is
  'wa-webhook sweeper (service_role): claim unrouted inbound messages. [{ message_id, wa_message_id, type, payload, context_wa_message_id, attempt, contact }].';

-- ---------------------------------------------------------------------------
-- Sessions (_shared/wa/session.ts decides; these only persist).
-- ---------------------------------------------------------------------------
create function api.wa_session_get(p_contact_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'state', s.state,
    'context', s.context,
    'expires_at', s.expires_at,
    'updated_at', s.updated_at
  )
  from comms.wa_sessions s
  where s.contact_id = p_contact_id
$$;
comment on function api.wa_session_get(uuid) is 'wa-webhook (service_role): the stored session, or null.';

create function api.wa_session_put(
  p_contact_id uuid,
  p_state text,
  p_context jsonb,
  p_expires_at timestamptz
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if p_state is null or p_state !~ '^[a-z_]{1,40}$' then
    perform ops.raise_api_error('invalid_input', 'The session state is not valid.');
  end if;
  insert into comms.wa_sessions as s (contact_id, state, context, expires_at)
  values (
    p_contact_id, p_state,
    case when pg_catalog.jsonb_typeof(p_context) = 'object' then p_context else '{}'::jsonb end,
    p_expires_at
  )
  on conflict (contact_id) do update
    set state = excluded.state,
        context = excluded.context,
        expires_at = excluded.expires_at;
end
$$;
comment on function api.wa_session_put(uuid, text, jsonb, timestamptz) is 'wa-webhook (service_role): store the session.';

-- ---------------------------------------------------------------------------
-- api.wa_record_outbound: what the Graph client sent (sent) or, in mock mode,
-- would have sent (mock_sent; API_CONTRACTS §5.2 snapshot tests).
-- ---------------------------------------------------------------------------
create function api.wa_record_outbound(
  p_contact_id uuid,
  p_wa_message_id text,
  p_type text,
  p_payload jsonb,
  p_status text,
  p_template_code text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_status is null or p_status not in ('sent', 'mock_sent', 'failed') then
    perform ops.raise_api_error('invalid_input', 'An outbound record is sent, mock_sent or failed.');
  end if;
  if p_type is null or p_type !~ '^[a-z_]{1,40}$' then
    perform ops.raise_api_error('invalid_input', 'The message type is not one we know.');
  end if;
  insert into comms.wa_messages (contact_id, direction, wa_message_id, type, payload, status, template_code, status_at)
  values (
    p_contact_id, 'out', p_wa_message_id, p_type,
    case when pg_catalog.jsonb_typeof(p_payload) = 'object' then p_payload else '{}'::jsonb end,
    p_status, p_template_code, pg_catalog.now()
  )
  on conflict (wa_message_id) do nothing
  returning id into v_id;
  return v_id;
end
$$;
comment on function api.wa_record_outbound(uuid, text, text, jsonb, text, text) is
  'wa-webhook / Graph client (service_role): record an outbound message (sent | mock_sent | failed).';

-- ---------------------------------------------------------------------------
-- Tap checks for consent RPCs (T46a/T46b). Not in api: called from api
-- SECURITY DEFINER functions only.
-- ---------------------------------------------------------------------------
create function comms.is_wa_tap(
  p_wa_message_id text,
  p_user_id uuid,
  p_max_age interval default interval '15 minutes'
)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
      from comms.wa_messages m
      join pii.wa_contacts k on k.id = m.contact_id
     where m.wa_message_id = p_wa_message_id
       and m.direction = 'in'
       and m.type in ('interactive', 'button')
       and k.user_id = p_user_id
       and p_user_id is not null
       and m.created_at >= pg_catalog.now() - p_max_age
  )
$$;
comment on function comms.is_wa_tap(text, uuid, interval) is
  'True when p_wa_message_id is an inbound button/interactive tap from p_user_id''s linked WhatsApp number, received within p_max_age.';

create function comms.current_wa_tap()
returns text
language sql
stable
set search_path = ''
as $$
  select c ->> 'wa_message_id'
    from (select ops.claims() as c) j
   where c ->> 'role' = 'authenticated'
     and pg_catalog.jsonb_typeof(c -> 'amr') = 'array'
     and exists (
       select 1 from pg_catalog.jsonb_array_elements(c -> 'amr') a(v)
        where a.v ->> 'method' = 'whatsapp_tap'
     )
     and comms.is_wa_tap(
       c ->> 'wa_message_id',
       case
         when (c ->> 'sub') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
           then (c ->> 'sub')::uuid
       end
     )
$$;
comment on function comms.current_wa_tap() is
  'The wa_message_id of the verified WhatsApp tap behind the current JWT (amr whatsapp_tap), or null. For consent evidence.';

-- ---------------------------------------------------------------------------
-- Grants: service_role only. Lockdown of comms and pii (not api: see 000100).
-- ---------------------------------------------------------------------------
revoke all on function api.wa_ingest_inbound(text, text, text, jsonb, timestamptz, text) from public, anon, authenticated;
revoke all on function api.wa_apply_status(text, text, timestamptz, jsonb) from public, anon, authenticated;
revoke all on function api.wa_mark_routed(uuid, text, text) from public, anon, authenticated;
revoke all on function api.wa_claim_unrouted(integer, integer, integer) from public, anon, authenticated;
revoke all on function api.wa_session_get(uuid) from public, anon, authenticated;
revoke all on function api.wa_session_put(uuid, text, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function api.wa_record_outbound(uuid, text, text, jsonb, text, text) from public, anon, authenticated;

grant execute on function api.wa_ingest_inbound(text, text, text, jsonb, timestamptz, text) to service_role;
grant execute on function api.wa_apply_status(text, text, timestamptz, jsonb) to service_role;
grant execute on function api.wa_mark_routed(uuid, text, text) to service_role;
grant execute on function api.wa_claim_unrouted(integer, integer, integer) to service_role;
grant execute on function api.wa_session_get(uuid) to service_role;
grant execute on function api.wa_session_put(uuid, text, jsonb, timestamptz) to service_role;
grant execute on function api.wa_record_outbound(uuid, text, text, jsonb, text, text) to service_role;

revoke all on all tables in schema comms, pii from public, anon, authenticated;
revoke all on all sequences in schema comms, pii from public, anon, authenticated;
revoke all on all functions in schema comms, pii from public, anon, authenticated;
