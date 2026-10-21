-- Lead · M2 gate gaps 3, 4 and 6 (T59, PR #89), and the claim order. Re-creates only what changes:
--
--   ops.alert_event_line  gains band_changed (gap 4): "<project>: delivery risk moved from
--                         Elevated to High", read from the event's own before/after and the
--                         phase's own name, never from an artboard or §5b example (AGENTS rule 10).
--                         A fourth argument (the project) is added, so the 3-argument form is
--                         dropped; ops.fan_out is its only caller.
--   ops.fan_out           (a) band_change_alert's payload carries header_image_url, the phase's
--                         RiskSummary card (the same share.card_url api.risk_summary hands out),
--                         so the template's required image header can be sent (gap 3);
--                         (b) a session alert names the project (session_text);
--                         (c) the family circle (gap 6; lead decision on PR #89, DESIGN §5b "Meera
--                         joined 6 Oct 2026, with the same alerts on all 4 projects"): a joined
--                         member whose invite covers the phase gets band changes, filings, orders
--                         and extensions through their own opted-in channels. Never price,
--                         payment-stage or digest kinds, never follow type, cost sheets or consents.
--   api.outbox_claim_due  orders by not_before, then a channel rank (push, then WhatsApp, then
--                         email), so at the same instant push is always claimed first (lead
--                         decision on PR #89); its template object also names the row's code.
--
-- A circle member's channels, in order:
--   1. With an account: their own enabled, instant push/whatsapp app.alert_subscriptions of the
--      kind (the follower path's own row shape and dedupe key, 'alert:<event>:<subscription>', so
--      a member who also follows the phase still gets one row per subscription).
--   2. Their WhatsApp contact (app.family_members.wa_contact_id, else the account's own), when it
--      is opted in to utility alerts and not stopped: their "JOIN <code>" was that opt-in
--      (ops.family_join_by_code). Skipped when the account has its own whatsapp subscription row
--      for the kind (their own setting decides) or a row for this event already went to that
--      contact. Dedupe 'alert:<event>:member:<member id>'; default quiet hours (DESIGN §5b C-32).
-- Every function pins search_path = '' and qualifies every name (BUILD_PLAN §12.2).

drop function ops.alert_event_line(text, jsonb, jsonb);

create function ops.alert_event_line(p_kind text, p_after jsonb, p_before jsonb, p_project text default null)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_quarter text := p_after ->> 'quarter';
  v_to text := core.band_label(p_after ->> 'band');
  v_from text := core.band_label(p_before ->> 'band');
begin
  return case p_kind
    when 'band_changed' then
      coalesce(p_project || ': d', 'D') || 'elivery risk '
        || case
             when v_to is not null then 'moved' || coalesce(' from ' || v_from, '') || ' to ' || v_to
             else 'is no longer shown as a band'
           end
    when 'qpr_missing' then 'The ' || ops.fmt_quarter(v_quarter) || ' QPR is not on HARERA yet'
    when 'qpr_late' then 'The ' || ops.fmt_quarter(v_quarter) || ' QPR filed ' || (p_after ->> 'days_late') || ' days late'
    when 'qpr_filed' then 'The ' || ops.fmt_quarter(v_quarter) || ' QPR filed on time'
    when 'extension_granted' then 'Completion extended to ' || ops.fmt_month((p_after ->> 'to_completion')::date)
    when 'order_decided' then 'A new ' || coalesce(p_after ->> 'order_type', 'order') || ' decided'
    when 'price_list_published' then 'A new price list was published'
    else 'Something changed'
  end;
end
$$;
comment on function ops.alert_event_line(text, jsonb, jsonb, text) is 'The push summary, filing_alert''s event_line and (with the project) a band change''s session line: a short, data-only line from the event''s own before/after and the phase''s own name.';

create or replace function ops.fan_out(p_event_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event core.events%rowtype;
  v_phase core.phases%rowtype;
  v_view jsonb;
  v_alert_kind text;
  v_sub record;
  v_member record;
  v_n integer := 0;
  v_dedupe text;
  v_not_before timestamptz;
  v_deep_link text;
  v_line text;
  v_card_url text;
  v_contact record;
  v_template text;
  v_wa_payload jsonb;
  v_push_payload jsonb;
begin
  select * into v_event from core.events e where e.id = p_event_id;
  if not found or not v_event.public then
    return 0;
  end if;

  -- The freshness guard (T43b): only a just-happened event fans out, never a historical load.
  if v_event.detected_at <= ops.now() - interval '48 hours' then
    return 0;
  end if;

  select * into v_phase from core.phases p where p.id = v_event.phase_id;
  if not found then
    return 0;
  end if;

  v_alert_kind := ops.alert_kind_for_event(v_event.kind);
  if v_alert_kind is null then
    return 0;
  end if;

  v_view := core.phase_view(v_phase.id);
  v_deep_link := '/' || coalesce(v_view ->> 'city_slug', 'gurugram') || '/projects/' || v_phase.slug;
  v_line := ops.alert_event_line(v_event.kind, v_event.after, v_event.before, v_phase.name);
  v_template := ops.wa_template_for_kind(v_alert_kind);

  v_push_payload := pg_catalog.jsonb_build_object(
    'deep_link', v_deep_link,
    'kind', v_event.kind,
    'project_name', v_phase.name,
    'line', v_line
  );

  v_wa_payload := case v_alert_kind
    when 'band_change' then pg_catalog.jsonb_build_object(
      'project', v_phase.name,
      'from_band', core.band_label(v_event.before ->> 'band'),
      'to_band', core.band_label(v_event.after ->> 'band'),
      'trigger', 'new HARERA records',
      'date', ops.fmt_date(v_event.occurred_on),
      -- The template's image header: the phase's RiskSummary card as api.risk_summary hands it
      -- out (share.card_url), for the run published right now.
      'header_image_url', core.public_base_url() || '/cards/risk/' || v_phase.slug || '.png'
        || coalesce('?run=' || (core.published_run(v_phase.id)).id::text, ''),
      'session_text', v_line,
      'deep_link', v_deep_link
    )
    else pg_catalog.jsonb_build_object(
      'project', v_phase.name,
      'event_line', v_line,
      'date', ops.fmt_date(v_event.occurred_on),
      'session_text', v_phase.name || ': ' || v_line,
      'deep_link', v_deep_link
    )
  end;

  -- Followers: one row per matching (follower, channel) subscription of the phase's own follows.
  for v_sub in
    select s.id, s.user_id, s.channel, s.quiet_from, s.quiet_to, f.follow_type
    from app.alert_subscriptions s
    join app.follows f on f.user_id = s.user_id and f.phase_id = v_phase.id
    where s.kind = v_alert_kind
      and s.enabled
      and s.cadence = 'instant'
      and s.channel in ('push', 'whatsapp')
      -- Defence in depth: payment_stage only ever reaches a booked follow.
      and (v_alert_kind <> 'payment_stage' or f.follow_type = 'booked')
  loop
    v_not_before := coalesce(ops.quiet_defer(v_sub.quiet_from, v_sub.quiet_to), ops.now());
    v_dedupe := 'alert:' || p_event_id::text || ':' || v_sub.id::text;

    if v_sub.channel = 'push' then
      insert into comms.outbox (dedupe_key, user_id, channel, template_code, payload, basis, not_before)
      values (v_dedupe, v_sub.user_id, 'push', null, v_push_payload, v_sub.id::text, v_not_before)
      on conflict (dedupe_key) do nothing;
      if found then
        v_n := v_n + 1;
      end if;

    elsif v_sub.channel = 'whatsapp' and v_template is not null then
      select c.id as contact_id, c.stopped_at into v_contact
      from pii.wa_contacts c
      where c.user_id = v_sub.user_id;

      -- No linked contact, or STOP (withdrawn consent): queue nothing that can never go out.
      if v_contact.contact_id is null or v_contact.stopped_at is not null then
        continue;
      end if;

      insert into comms.outbox (dedupe_key, user_id, contact_id, channel, template_code, payload, basis, not_before)
      values (v_dedupe, v_sub.user_id, v_contact.contact_id, 'whatsapp_template', v_template, v_wa_payload, v_sub.id::text, v_not_before)
      on conflict (dedupe_key) do nothing;
      if found then
        v_n := v_n + 1;
      end if;
    end if;
  end loop;

  -- The family circle: the public kinds only, for the phases the member's invite covers (its
  -- own phases, or with scope_all every phase the circle's owner follows).
  if v_alert_kind not in ('band_change', 'filings', 'orders', 'extensions') then
    return v_n;
  end if;

  for v_member in
    select m.id, m.member_user_id, m.wa_contact_id
    from app.family_members m
    join app.family_circles c on c.id = m.circle_id
    where m.status = 'joined'
      and (
        v_phase.id = any (m.scope_phase_ids)
        or (m.scope_all and exists (
          select 1 from app.follows f where f.user_id = c.owner_user_id and f.phase_id = v_phase.id))
      )
    order by m.joined_at, m.id
  loop
    -- 1. A member with an account: their own subscriptions of this kind.
    if v_member.member_user_id is not null then
      for v_sub in
        select s.id, s.user_id, s.channel, s.quiet_from, s.quiet_to
        from app.alert_subscriptions s
        where s.user_id = v_member.member_user_id
          and s.kind = v_alert_kind
          and s.enabled
          and s.cadence = 'instant'
          and s.channel in ('push', 'whatsapp')
      loop
        v_not_before := coalesce(ops.quiet_defer(v_sub.quiet_from, v_sub.quiet_to), ops.now());
        v_dedupe := 'alert:' || p_event_id::text || ':' || v_sub.id::text;
        if v_sub.channel = 'push' then
          insert into comms.outbox (dedupe_key, user_id, channel, template_code, payload, basis, not_before)
          values (v_dedupe, v_sub.user_id, 'push', null, v_push_payload, v_sub.id::text, v_not_before)
          on conflict (dedupe_key) do nothing;
          if found then
            v_n := v_n + 1;
          end if;
        elsif v_template is not null then
          select c.id as contact_id, c.stopped_at into v_contact
          from pii.wa_contacts c
          where c.user_id = v_sub.user_id;
          if v_contact.contact_id is null or v_contact.stopped_at is not null then
            continue;
          end if;
          insert into comms.outbox (dedupe_key, user_id, contact_id, channel, template_code, payload, basis, not_before)
          values (v_dedupe, v_sub.user_id, v_contact.contact_id, 'whatsapp_template', v_template, v_wa_payload, v_sub.id::text, v_not_before)
          on conflict (dedupe_key) do nothing;
          if found then
            v_n := v_n + 1;
          end if;
        end if;
      end loop;

      -- Their own WhatsApp setting for this kind decides; step 2 never overrides it.
      if exists (
        select 1 from app.alert_subscriptions s
        where s.user_id = v_member.member_user_id and s.kind = v_alert_kind and s.channel = 'whatsapp'
      ) then
        continue;
      end if;
    end if;

    -- 2. Their WhatsApp contact, opted in by their own JOIN and not stopped.
    if v_template is null then
      continue;
    end if;
    select c.id as contact_id, c.stopped_at, c.utility_opt_in into v_contact
    from pii.wa_contacts c
    where c.id = v_member.wa_contact_id
       or (v_member.wa_contact_id is null and v_member.member_user_id is not null and c.user_id = v_member.member_user_id)
    order by (c.id = v_member.wa_contact_id) desc nulls last
    limit 1;
    if v_contact.contact_id is null or not v_contact.utility_opt_in or v_contact.stopped_at is not null then
      continue;
    end if;
    if exists (
      select 1 from comms.outbox o
      where o.contact_id = v_contact.contact_id
        and o.dedupe_key like 'alert:' || p_event_id::text || ':%'
    ) then
      continue;
    end if;

    insert into comms.outbox (dedupe_key, user_id, contact_id, channel, template_code, payload, basis, not_before)
    values (
      'alert:' || p_event_id::text || ':member:' || v_member.id::text,
      v_member.member_user_id, v_contact.contact_id, 'whatsapp_template', v_template, v_wa_payload,
      'family_member:' || v_member.id::text,
      coalesce(ops.quiet_defer(null, null), ops.now())
    )
    on conflict (dedupe_key) do nothing;
    if found then
      v_n := v_n + 1;
    end if;
  end loop;

  return v_n;
end
$$;
comment on function ops.fan_out(uuid) is 'Fans a public core.events row out to comms.outbox: one row per matching, enabled, instant push/whatsapp app.alert_subscriptions of the phase''s own follows, then the family circle (band changes, filings, orders and extensions only) through each joined member''s own subscriptions or opted-in WhatsApp contact. Quiet hours defer not_before; a stopped or missing WhatsApp contact queues nothing. band_change_alert rows carry header_image_url (the RiskSummary card). Idempotent per (event, subscription or member) via dedupe_key.';

-- ---------------------------------------------------------------------------
-- api.outbox_claim_due: the same claim, ordered by not_before, then push, WhatsApp, email.
-- ---------------------------------------------------------------------------
create function ops.outbox_channel_rank(p_channel text)
returns integer
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case p_channel
    when 'push' then 1
    when 'whatsapp_template' then 2
    when 'whatsapp_session' then 2
    when 'email' then 3
    else 4
  end
$$;
comment on function ops.outbox_channel_rank(text) is 'api.outbox_claim_due''s tie-break at the same not_before: push (1), then WhatsApp (2), then email (3), then anything else.';

create or replace function api.outbox_claim_due(p_limit integer default 25)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows jsonb;
begin
  if p_limit is null or p_limit < 1 or p_limit > 200 then
    perform ops.raise_api_error('invalid_input', 'p_limit must be between 1 and 200.');
  end if;

  with claimed as (
    update comms.outbox o
    set status = 'sending'
    where o.id in (
      select q.id from comms.outbox q
      where q.status = 'queued' and q.not_before <= ops.now()
      order by q.not_before, ops.outbox_channel_rank(q.channel), q.created_at, q.id
      limit p_limit
      for update skip locked
    )
    returning o.*
  )
  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', c.id,
        'dedupe_key', c.dedupe_key,
        'user_id', c.user_id,
        'contact_id', c.contact_id,
        'org_member_id', c.org_member_id,
        'channel', c.channel,
        'template_code', c.template_code,
        'payload', c.payload,
        'basis', c.basis,
        'attempts', c.attempts,
        'created_at', c.created_at,
        'template', case when t.code is null then null else pg_catalog.jsonb_build_object(
          'code', t.code,
          'meta_name', t.meta_name,
          'category', t.category,
          'language', t.language,
          'header', t.header,
          'variables', t.variables,
          'buttons', t.buttons
        ) end
      )
      order by c.not_before, ops.outbox_channel_rank(c.channel), c.created_at, c.id
    ),
    '[]'::jsonb
  )
  into v_rows
  from claimed c
  left join comms.templates t on t.code = c.template_code;

  return v_rows;
end;
$$;
comment on function api.outbox_claim_due(integer) is 'Service-only. Claims up to p_limit queued, due comms.outbox rows (SKIP LOCKED), ordered by not_before then channel (push, WhatsApp, email), and returns them joined with their template.';

revoke all on function ops.alert_event_line(text, jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function ops.fan_out(uuid) from public, anon, authenticated;
revoke all on function ops.outbox_channel_rank(text) from public, anon, authenticated;
revoke all on function api.outbox_claim_due(integer) from public, anon, authenticated;
grant execute on function api.outbox_claim_due(integer) to service_role;
