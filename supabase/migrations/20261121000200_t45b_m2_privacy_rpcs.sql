-- T45b · Privacy 2/2 (m2_privacy): the buyer's privacy and rights RPCs.
-- api.who_has_my_number, api.consent_history, api.consent_withdraw, api.relay_renew,
-- api.data_export_request, api.account_delete_request.
-- Sources: API_CONTRACTS §1 (errors, envelope), §3.2 (Privacy and rights), §4.10;
-- BUILD_PLAN §12.2 (functions, not tables), §13 (DPDP by construction); DATA_MODEL §5, §6;
-- DESIGN §5b (Who has my number, Rohan's consent history, Download my data, relay lifetime);
-- packages/contracts schemas who_has_my_number, consent_history, data_export_request and
-- account_delete_request (the source of truth for the shapes).
--
-- Every function is SECURITY DEFINER with search_path = '', acts only for auth.uid() under a
-- buyer's own JWT (role authenticated), and is granted to authenticated only: never anon,
-- never the service role. The service role cannot act for a buyer even with a forged sub
-- (app.privacy_caller). Every reference, date and count in a payload is read from a row:
-- refs from app.consents, counts from app.number_holders, dates from the share, relay,
-- withdrawal and data-request rows.
--
-- Withdrawal goes through T40's triggers: api.consent_withdraw only inserts the
-- app.consent_withdrawals row; the triggers end the shares, close the relay, and (from
-- 20261121000100) queue the partner deletion request. Writes are audited by the tables'
-- audit triggers in the same transaction.
--
-- Errors (API_CONTRACTS §1): auth_required 401, forbidden 403, not_found 404,
-- consent_required 409, invalid_input 422.

-- ---------------------------------------------------------------------------
-- Helpers (app; never executable by anon or authenticated).
-- ---------------------------------------------------------------------------
create function app.privacy_caller()
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
    return v_uid;
  end if;
  if v_role in ('', 'anon') then
    perform ops.raise_api_error('auth_required', 'Sign in to see and change who can reach you.');
  end if;
  perform ops.raise_api_error('forbidden', 'Only you can do this, from your own signed-in account.');
  return null;
end
$$;
comment on function app.privacy_caller() is 'The buyer behind a privacy RPC: auth.uid() under role authenticated. No JWT or anon → auth_required; any other role (service_role, even with a sub) → forbidden.';

create function app.consent_party(p_consent app.consents)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    p_consent.party_label,
    case p_consent.recipient_kind
      when 'plinth' then 'Plinth'
      when 'agent' then (select a.name from core.agents a where a.id = p_consent.recipient_agent_id)
      else (
        select g.name
        from core.phases ph
        join core.projects pr on pr.id = ph.project_id
        join core.developer_groups g on g.id = pr.group_id
        where ph.id = p_consent.phase_id
      ) || case p_consent.recipient_kind when 'site_office' then ' site office' else ' sales office' end
    end,
    case p_consent.recipient_kind
      when 'agent' then 'Your agent'
      when 'site_office' then 'The site office'
      when 'sales_office' then 'The sales office'
      else 'Plinth'
    end
  )
$$;
comment on function app.consent_party(app.consents) is 'The party a consent names: party_label as shown at the tap; else the agent''s registry name, or the phase''s developer group + "site office"/"sales office".';

create function app.consent_detail(p_consent app.consents)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    p_consent.detail_line,
    (select ph.name from core.phases ph where ph.id = p_consent.phase_id),
    (select pu.description from app.purposes pu where pu.code = p_consent.purpose_code)
  )
$$;
comment on function app.consent_detail(app.consents) is 'What a consent was for: detail_line as shown at the tap; else the phase name; else the purpose text (app.purposes).';

create function app.party_pays_line(p_kind text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case p_kind
    when 'agent' then 'Agent · paid by the developer or you, never by Plinth'
    else 'Developer · pays us nothing'
  end
$$;
comment on function app.party_pays_line(text) is 'Who pays whom, by recipient kind (DESIGN §5b Who has my number, "Pays us?").';

create function app.reach_line(p_count integer)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when coalesce(p_count, 0) = 0 then 'No party can reach you'
    when p_count = 1 then '1 party can reach you'
    else p_count::text || ' parties can reach you'
  end
$$;
comment on function app.reach_line(integer) is '"3 parties can reach you" from a count of distinct number holders (app.number_holders).';

create function app.relay_line(p_detail text, p_kind text, p_purpose text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select p_detail || ': the '
    || case p_kind when 'sales_office' then 'sales office' when 'site_office' then 'site office' else 'party' end
    || case p_purpose
         when 'enquiry_share' then ' gets only the enquiry fields you ticked and a relay, not your number.'
         else ' gets your first name and a relay, not your number.'
       end
$$;
comment on function app.relay_line(text, text, text) is '"Aurelia visit Sat 24 Oct, 11 am, code 4821: the site office gets your first name and a relay, not your number."';

create function app.relay_backing_consent(p_relay_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id
  from app.relay_sessions r
  join app.consents c on c.principal_user_id = r.buyer_user_id
  cross join lateral (
    select exists (
      select 1 from app.contact_shares s where s.relay_session_id = r.id and s.consent_id = c.id
    ) as linked
  ) as l
  where r.id = p_relay_id
    and c.purpose_code in ('visit_share', 'enquiry_share')
    and (
      l.linked
      or (c.recipient_org_id = r.recipient_org_id
          and (c.phase_id is null or c.phase_id is not distinct from r.phase_id))
    )
    and (c.expires_at is null or c.expires_at > ops.now())
    and not exists (select 1 from app.consent_withdrawals w where w.consent_id = c.id)
  order by l.linked desc, c.granted_at desc, c.ref desc
  limit 1
$$;
comment on function app.relay_backing_consent(uuid) is 'The live visit or enquiry consent a relay rests on (one linked through a share first, else the newest for the same org and phase), as app.consent_withdrawals_apply decides when to close it. Null when none.';

-- ---------------------------------------------------------------------------
-- plinth.who_has_my_number/1 (API_CONTRACTS §4.10)
-- ---------------------------------------------------------------------------
create function app.who_has_my_number_json(p_uid uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with live as (
    select s.consent_id,
           pg_catalog.min(s.starts_at) as starts_at,
           case when pg_catalog.bool_or(s.ends_at is null) then null else pg_catalog.max(s.ends_at) end as ends_at
    from app.contact_shares s
    where s.buyer_user_id = p_uid
      and s.number_shared
      and s.ended_reason is null
      and (s.ends_at is null or s.ends_at > ops.now())
    group by s.consent_id
  ),
  ended as (
    select s.consent_id, pg_catalog.max(s.ends_at) as ends_at
    from app.contact_shares s
    where s.buyer_user_id = p_uid
      and s.number_shared
      and (s.ended_reason is not null or s.ends_at <= ops.now())
      and not exists (select 1 from live l where l.consent_id = s.consent_id)
    group by s.consent_id
  ),
  relays as (
    select r.id, r.opened_at, c.ref, app.consent_party(c) as party,
           app.relay_line(app.consent_detail(c), c.recipient_kind, c.purpose_code) as line
    from app.relay_sessions r
    join app.consents c on c.id = app.relay_backing_consent(r.id)
    where r.buyer_user_id = p_uid
      and r.closed_at is null
      and (r.closes_at is null or r.closes_at > ops.now())
  )
  select pg_catalog.jsonb_build_object(
    'schema', 'plinth.who_has_my_number/1',
    'count_line', app.reach_line(pg_catalog.cardinality(app.number_holders(p_uid))),
    'rule_line', 'Your number is never shared without your tap.',
    'parties', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'ref', c.ref,
          'party', app.consent_party(c),
          'detail', app.consent_detail(c),
          'shared_on', pg_catalog.to_char(ops.ist_date(l.starts_at), 'YYYY-MM-DD'),
          'access_until', pg_catalog.to_char(ops.ist_date(l.ends_at), 'YYYY-MM-DD'),
          'pays_line', app.party_pays_line(c.recipient_kind),
          'number_shared', true,
          'status', 'active'
        )
        order by l.starts_at, c.ref
      )
      from live l
      join app.consents c on c.id = l.consent_id and c.principal_user_id = p_uid
    ), '[]'::jsonb),
    'relays', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object('ref', x.ref, 'party', x.party, 'line', x.line, 'counts_toward_cap', false)
        order by x.opened_at desc, x.ref desc
      )
      from relays x
    ), '[]'::jsonb),
    'ended', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'ref', c.ref,
          'party', app.consent_party(c),
          'detail', app.consent_detail(c),
          'ended_on', pg_catalog.to_char(ops.ist_date(e.ends_at), 'YYYY-MM-DD')
        )
        order by e.ends_at desc, c.ref desc
      )
      from ended e
      join app.consents c on c.id = e.consent_id and c.principal_user_id = p_uid
    ), '[]'::jsonb),
    'family_line', 'Family in your circle can''t see your number and aren''t counted here.'
  )
$$;
comment on function app.who_has_my_number_json(uuid) is 'plinth.who_has_my_number/1 for one buyer: live number shares (one per consent), open relays (not counted), ended number shares. The count is app.number_holders.';

create function api.who_has_my_number()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.privacy_caller();
begin
  return app.who_has_my_number_json(v_uid);
end
$$;
comment on function api.who_has_my_number() is 'plinth.who_has_my_number/1 (API_CONTRACTS §4.10): who can reach the caller, by consent ref. Buyer JWT only. Errors: auth_required, forbidden.';

-- ---------------------------------------------------------------------------
-- plinth.consent_history/1: every consent the buyer gave, newest first.
-- ---------------------------------------------------------------------------
create function app.consent_history_json(p_uid uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with history as (
    select c.ref, c.granted_at,
      pg_catalog.jsonb_build_object(
        'ref', c.ref,
        'granted_on', pg_catalog.to_char(ops.ist_date(c.granted_at), 'YYYY-MM-DD'),
        'party', app.consent_party(c),
        'detail', app.consent_detail(c),
        'purpose', c.purpose_code,
        'purpose_line', pu.description,
        'channel', c.channel,
        'notice_version', c.notice_version,
        'status', st.status,
        'status_line', st.status_line,
        'number_shared', coalesce(sh.number_live, false) and st.status = 'active',
        'access_until', case when st.status = 'active' and sh.number_live
                          then pg_catalog.to_char(ops.ist_date(sh.live_until), 'YYYY-MM-DD') end,
        'ended_on', pg_catalog.to_char(st.ended_on, 'YYYY-MM-DD'),
        'withdrawn_at', case when w.id is not null then core.fmt_timestamp(w.withdrawn_at) end,
        'can_withdraw', w.id is null,
        'relay', rl.relay
      ) as item
    from app.consents c
    join app.purposes pu on pu.code = c.purpose_code
    left join app.consent_withdrawals w on w.consent_id = c.id
    left join lateral (
      select
        pg_catalog.bool_or(s.number_shared) as number_ever,
        pg_catalog.bool_or(s.number_shared and s.ended_reason is null and (s.ends_at is null or s.ends_at > ops.now())) as number_live,
        case
          when pg_catalog.bool_or(s.number_shared and s.ended_reason is null and s.ends_at is null) then null
          else pg_catalog.max(s.ends_at) filter (where s.number_shared and s.ended_reason is null and s.ends_at > ops.now())
        end as live_until,
        pg_catalog.max(s.ends_at) filter (where s.number_shared) as last_end
      from app.contact_shares s
      where s.consent_id = c.id
    ) as sh on true
    left join lateral (
      select pg_catalog.jsonb_build_object(
        'relay_id', r.id,
        'open', r.closed_at is null and (r.closes_at is null or r.closes_at > ops.now()),
        'closes_on', pg_catalog.to_char(ops.ist_date(coalesce(r.closed_at, r.closes_at)), 'YYYY-MM-DD'),
        'counts_toward_cap', false
      ) as relay
      from app.relay_sessions r
      where r.buyer_user_id = p_uid
        and app.relay_backing_consent(r.id) = c.id
      order by r.opened_at desc, r.id
      limit 1
    ) as rl on true
    cross join lateral (
      select
        case
          when w.id is not null then 'withdrawn'
          when c.expires_at is not null and c.expires_at <= ops.now() then 'ended'
          when sh.number_ever and not sh.number_live then 'ended'
          else 'active'
        end as status,
        case
          when w.id is not null then ops.ist_date(w.withdrawn_at)
          when c.expires_at is not null and c.expires_at <= ops.now() then ops.ist_date(c.expires_at)
          when sh.number_ever and not sh.number_live then ops.ist_date(sh.last_end)
        end as ended_on
    ) as st0
    cross join lateral (
      select st0.status, st0.ended_on,
        case st0.status
          when 'withdrawn' then 'Withdrawn ' || ops.fmt_date(st0.ended_on)
          when 'ended' then 'Ended ' || ops.fmt_date(st0.ended_on)
          else case
            when sh.number_live and sh.live_until is not null
              then 'Number shared, until ' || ops.fmt_date(ops.ist_date(sh.live_until))
            when sh.number_live then 'Number shared by your tap'
            when c.purpose_code = 'visit_share' then 'First name and a relay, not your number'
            when c.purpose_code = 'enquiry_share' then 'The enquiry fields you ticked and a relay, not your number'
            when c.purpose_code = 'agent_brief' then 'The brief fields you picked, not your number'
            else 'Active'
          end
        end as status_line
    ) as st
    where c.principal_user_id = p_uid
  )
  select pg_catalog.jsonb_build_object(
    'schema', 'plinth.consent_history/1',
    'count_line', app.reach_line(pg_catalog.cardinality(app.number_holders(p_uid))),
    'rule_line', 'Your number is never shared without your tap.',
    'items', coalesce((select pg_catalog.jsonb_agg(r.item order by r.granted_at desc, r.ref desc) from history r), '[]'::jsonb)
  )
$$;
comment on function app.consent_history_json(uuid) is 'plinth.consent_history/1 for one buyer: each consent with its party, purpose, notice version, status (active, ended, withdrawn) and relay, newest first.';

create function api.consent_history()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.privacy_caller();
begin
  return app.consent_history_json(v_uid);
end
$$;
comment on function api.consent_history() is 'plinth.consent_history/1: the caller''s consent ledger, newest first (DESIGN §5b Rohan''s consent history). Buyer JWT only. Errors: auth_required, forbidden.';

-- ---------------------------------------------------------------------------
-- api.consent_withdraw(p_ref) → ConsentWithdrawal (an acknowledgement, no envelope)
-- ---------------------------------------------------------------------------
create function api.consent_withdraw(p_ref text, p_channel text default 'web')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.privacy_caller();
  v_ref text := pg_catalog.upper(pg_catalog.btrim(coalesce(p_ref, '')));
  v_consent app.consents%rowtype;
  v_withdrawal app.consent_withdrawals%rowtype;
  v_party text;
  v_number boolean;
  v_relay_closed boolean;
  v_effects text[] := '{}'::text[];
begin
  if v_ref !~ '^C-[0-9]{4}-[0-9]{2,}$' then
    perform ops.raise_api_error('invalid_input', 'A consent reference looks like C-1012-04.');
  end if;
  if p_channel is null or p_channel not in ('web', 'app') then
    perform ops.raise_api_error('invalid_input', 'Withdraw from the web or the app; on WhatsApp, reply STOP.');
  end if;

  -- Only the caller's own consent. Another person's ref reads exactly like an unknown one.
  select c.* into v_consent
  from app.consents c
  where c.ref = v_ref and c.principal_user_id = v_uid
  order by c.ref_year desc
  limit 1;
  if not found then
    perform ops.raise_api_error('not_found', 'We have no consent with this reference on your account.');
  end if;

  -- The withdrawal row; T40's triggers end the shares and close the relay, and the
  -- 20261121000100 trigger queues the partner deletion request. A replay returns the
  -- first withdrawal.
  select w.* into v_withdrawal from app.consent_withdrawals w where w.consent_id = v_consent.id;
  if not found then
    insert into app.consent_withdrawals (consent_id, channel)
    values (v_consent.id, p_channel)
    on conflict (consent_id) do nothing;
    select w.* into v_withdrawal from app.consent_withdrawals w where w.consent_id = v_consent.id;
  end if;

  v_party := app.consent_party(v_consent);
  v_number := exists (
    select 1 from app.contact_shares s where s.consent_id = v_consent.id and s.number_shared
  );
  v_relay_closed := exists (
    select 1
    from app.relay_sessions r
    where r.buyer_user_id = v_uid
      and r.closed_reason = 'withdrawn'
      and r.closed_at = v_withdrawal.withdrawn_at
      and (
        r.id in (select s.relay_session_id from app.contact_shares s
                  where s.consent_id = v_consent.id and s.relay_session_id is not null)
        or (r.recipient_org_id = v_consent.recipient_org_id
            and (v_consent.phase_id is null or r.phase_id is not distinct from v_consent.phase_id))
      )
  );

  if v_number then
    v_effects := v_effects || (v_party || ' can no longer see your number.');
  end if;
  if v_relay_closed then
    v_effects := v_effects || ('Your relay with ' || v_party || ' is closed.');
  end if;
  if not v_number and not v_relay_closed then
    v_effects := v_effects || case
      when v_consent.recipient_kind = 'plinth' then 'We''ve stopped using your data for this.'
      else v_party || ' can no longer use what you shared.'
    end;
  end if;
  if exists (select 1 from app.partner_deletion_requests d where d.consent_id = v_consent.id) then
    v_effects := v_effects || case
      when v_number then 'We''ve asked them to delete it.'
      else 'We''ve asked them to delete what you shared.'
    end;
  end if;
  v_effects := v_effects || (app.reach_line(pg_catalog.cardinality(app.number_holders(v_uid))) || '.');

  return pg_catalog.jsonb_build_object(
    'ref', v_consent.ref,
    'withdrawn_at', core.fmt_timestamp(v_withdrawal.withdrawn_at),
    'effects', pg_catalog.to_jsonb(v_effects)
  );
end
$$;
comment on function api.consent_withdraw(text, text) is 'ConsentWithdrawal (API_CONTRACTS §4.10): withdraws one of the caller''s consents by C-MMDD-NN ref. Inserts app.consent_withdrawals; T40''s triggers end the shares and close the relay; a trigger queues the partner deletion request. Replays return the first withdrawal. Errors: auth_required, forbidden, invalid_input, not_found.';

-- ---------------------------------------------------------------------------
-- api.relay_renew(p_relay_id) → RelayRenewal (an acknowledgement, no envelope)
-- ---------------------------------------------------------------------------
create function api.relay_renew(p_relay_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.privacy_caller();
  v_relay app.relay_sessions%rowtype;
  v_open app.relay_sessions%rowtype;
  v_consent app.consents%rowtype;
  v_until timestamptz := ops.now() + interval '30 days';
begin
  if p_relay_id is null then
    perform ops.raise_api_error('invalid_input', 'Say which relay to renew.');
  end if;
  select r.* into v_relay from app.relay_sessions r where r.id = p_relay_id and r.buyer_user_id = v_uid;
  if not found then
    perform ops.raise_api_error('not_found', 'We have no relay with this id on your account.');
  end if;

  select c.* into v_consent from app.consents c where c.id = app.relay_backing_consent(v_relay.id);
  if not found then
    perform ops.raise_api_error(
      'consent_required',
      'This relay rested on a visit or an enquiry that has ended or that you withdrew. Book a visit or send an enquiry to open a new one.'
    );
  end if;

  if v_relay.closed_at is null and (v_relay.closes_at is null or v_relay.closes_at > ops.now()) then
    update app.relay_sessions r
       set closes_at = greatest(coalesce(r.closes_at, v_until), v_until)
     where r.id = v_relay.id
    returning r.* into v_relay;
  else
    -- A closed relay stays closed (T40); renewing opens a new session for the same parties,
    -- or renews the one an earlier renewal opened.
    select r.* into v_open
    from app.relay_sessions r
    where r.buyer_user_id = v_uid
      and r.recipient_org_id = v_relay.recipient_org_id
      and r.phase_id is not distinct from v_relay.phase_id
      and r.closed_at is null
      and (r.closes_at is null or r.closes_at > ops.now())
    order by r.opened_at desc
    limit 1;
    if found then
      update app.relay_sessions r
         set closes_at = greatest(coalesce(r.closes_at, v_until), v_until)
       where r.id = v_open.id
      returning r.* into v_relay;
    else
      if v_relay.closed_at is null then
        update app.relay_sessions r
           set closed_at = r.closes_at, closed_reason = 'expired', deal_active = false
         where r.id = v_relay.id;
      end if;
      insert into app.relay_sessions (buyer_user_id, recipient_org_id, phase_id, channel, deal_active, opened_at, closes_at)
      values (v_uid, v_relay.recipient_org_id, v_relay.phase_id, v_relay.channel, false, ops.now(), v_until)
      returning * into v_relay;
    end if;
  end if;

  return pg_catalog.jsonb_build_object(
    'relay_id', v_relay.id,
    'ref', v_consent.ref,
    'closes_at', core.fmt_timestamp(v_relay.closes_at),
    'line', 'The relay with ' || app.consent_party(v_consent)
      || case when v_relay.deal_active then ' stays open while your deal is active, and at least until '
              else ' stays open until ' end
      || ops.fmt_date(ops.ist_date(v_relay.closes_at)) || '.'
  );
end
$$;
comment on function api.relay_renew(uuid) is 'RelayRenewal: keeps the caller''s relay open 30 more days from now (D13), or opens a new session for the same parties when it has closed, while a live visit or enquiry consent backs it. Errors: auth_required, forbidden, invalid_input, not_found, consent_required.';

-- ---------------------------------------------------------------------------
-- DPDP rights: export (24 h, link valid 7 days) and erasure (30 days). The request row
-- is the record; export-data and delete-account (T53) fulfil it.
-- ---------------------------------------------------------------------------
create function api.data_export_request()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.privacy_caller();
  v_req app.data_requests%rowtype;
  v_ready boolean;
begin
  -- One open export at a time: a replay returns the request already open.
  select d.* into v_req
  from app.data_requests d
  where d.user_id = v_uid
    and d.kind = 'export'
    and (d.completed_at is null or d.link_expires_at > ops.now())
  order by d.requested_at desc, d.created_at desc
  limit 1;
  if not found then
    insert into app.data_requests (user_id, kind, requested_at, due_at)
    values (v_uid, 'export', ops.now(), ops.now() + interval '24 hours')
    returning * into v_req;
  end if;
  v_ready := v_req.completed_at is not null and v_req.link_expires_at > ops.now();

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.data_export_request/1',
    'request_id', v_req.id,
    'status', case when v_ready then 'ready' else 'preparing' end,
    'requested_at', core.fmt_timestamp(v_req.requested_at),
    'due_at', core.fmt_timestamp(v_req.due_at),
    'link_expires_at', case when v_ready then core.fmt_timestamp(v_req.link_expires_at) end,
    'status_line', case
      when v_ready then 'Ready. The link works until ' || ops.fmt_date(ops.ist_date(v_req.link_expires_at)) || '.'
      else 'Ready by ' || ops.fmt_date(ops.ist_date(v_req.due_at)) || ', ' || core.fmt_clock(v_req.due_at) || '.'
    end,
    'lines', pg_catalog.jsonb_build_array(
      'One ZIP with a readable PDF and a JSON file: follows, alerts, saved cost sheets, questions to Ask Plinth, consent history and who had your number.',
      'The link works for 7 days and opens only after your sign-in code.'
    )
  );
end
$$;
comment on function api.data_export_request() is 'plinth.data_export_request/1: records the caller''s DPDP export request (app.data_requests kind export, due in 24 hours; DESIGN §5b Download my data). One open request at a time. Errors: auth_required, forbidden.';

create function api.account_delete_request()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.privacy_caller();
  v_req app.data_requests%rowtype;
begin
  -- One open erasure request: a replay returns it.
  select d.* into v_req
  from app.data_requests d
  where d.user_id = v_uid and d.kind = 'erasure' and d.completed_at is null
  order by d.requested_at desc, d.created_at desc
  limit 1;
  if not found then
    insert into app.data_requests (user_id, kind, requested_at, due_at)
    values (v_uid, 'erasure', ops.now(), ops.now() + interval '30 days')
    returning * into v_req;
  end if;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.account_delete_request/1',
    'request_id', v_req.id,
    'status', 'requested',
    'requested_at', core.fmt_timestamp(v_req.requested_at),
    'due_at', core.fmt_timestamp(v_req.due_at),
    'due_line', 'We''ll erase your account by ' || ops.fmt_date(ops.ist_date(v_req.due_at)) || '.',
    'lines', pg_catalog.jsonb_build_array(
      'Some records stay where the law requires them, such as proof of the consents you gave.'
    )
  );
end
$$;
comment on function api.account_delete_request() is 'plinth.account_delete_request/1: records the caller''s DPDP erasure request (app.data_requests kind erasure, due in 30 days, BUILD_PLAN §13). One open request at a time. Errors: auth_required, forbidden.';

-- ---------------------------------------------------------------------------
-- Grants: the buyer's JWT only. Never PUBLIC, anon or the service role.
-- ---------------------------------------------------------------------------
revoke all on function api.who_has_my_number() from public, anon, service_role;
revoke all on function api.consent_history() from public, anon, service_role;
revoke all on function api.consent_withdraw(text, text) from public, anon, service_role;
revoke all on function api.relay_renew(uuid) from public, anon, service_role;
revoke all on function api.data_export_request() from public, anon, service_role;
revoke all on function api.account_delete_request() from public, anon, service_role;

grant execute on function api.who_has_my_number() to authenticated;
grant execute on function api.consent_history() to authenticated;
grant execute on function api.consent_withdraw(text, text) to authenticated;
grant execute on function api.relay_renew(uuid) to authenticated;
grant execute on function api.data_export_request() to authenticated;
grant execute on function api.account_delete_request() to authenticated;

-- Lockdown sweep for `app` (see 20261110000100): the helpers above are never callable directly.
revoke all on all functions in schema app from public, anon, authenticated;
