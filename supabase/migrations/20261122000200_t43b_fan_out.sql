-- T43b · Alert fan-out 2/5: ops.fan_out(event) and the score-publish → revalidate
-- bridge (API_CONTRACTS §5.5; WORK_BREAKDOWN T43b). Sources: AGENTS.md rule 9
-- (ops.now() clock), rule 10 (risk copy comes from the server — every line below
-- is built from the row's own before/after jsonb and formatters, never a §5b
-- worked example); DESIGN §5b C-32 (22:00-08:00 IST quiet hours default).
--
-- Fan-out is per app.follows + app.alert_subscriptions of the event's own phase:
-- a family circle member who has not followed the phase themselves (no
-- app.follows row of their own) never reaches this join, so the circle's
-- private kinds (payment_stage, DATA_MODEL app.alert_subscriptions.kind comment)
-- and every other kind alike never produce a row for them. T45a's family RPCs
-- land after this task; wiring a family member's own channel into fan-out is a
-- PR handoff, not invented here.
--
-- Dedup: dedupe_key = 'alert:<event_id>:<subscription_id>' (one row per
-- subscription per event; comms.outbox's own unique constraint makes a second
-- call a no-op via ON CONFLICT DO NOTHING — T42's table, read through its path).
-- Every function pins search_path = '' and qualifies every name (BUILD_PLAN §12.2).

-- ---------------------------------------------------------------------------
-- comms.outbox.channel gains 'revalidate' (API_CONTRACTS §5.5 "outbox revalidate
-- job"): a score publish enqueues one, T42's outbox-dispatch (its own path, not
-- touched here — see the PR Handoff) makes the POST /api/revalidate call.
-- ---------------------------------------------------------------------------
alter table comms.outbox drop constraint outbox_channel_check;
alter table comms.outbox add constraint outbox_channel_check
  check (channel in ('push', 'whatsapp_template', 'whatsapp_session', 'email', 'sms', 'revalidate'));

-- A revalidate job addresses no person (no user_id/contact_id/org_member_id):
-- it is an ISR tag list, not a send. Relax the recipient check for it alone.
alter table comms.outbox drop constraint outbox_has_recipient;
alter table comms.outbox add constraint outbox_has_recipient check (
  channel = 'revalidate' or user_id is not null or contact_id is not null or org_member_id is not null
);

-- ---------------------------------------------------------------------------
-- Quiet hours (DESIGN §5b C-32: 22:00-08:00 IST default; a row's own
-- quiet_from/quiet_to override it). Mirrors outbox-dispatch's
-- deferForQuietHours (supabase/functions/outbox-dispatch/logic.ts) so a row
-- already carries its deferred not_before at enqueue time, provable in pgTAP
-- without the edge function; the dispatcher re-checks at send time too.
-- ---------------------------------------------------------------------------
create function ops.quiet_defer(p_from time, p_to time, p_now timestamptz default null)
returns timestamptz
language plpgsql
stable
set search_path = ''
as $$
declare
  v_now timestamptz := coalesce(p_now, ops.now());
  v_from time := coalesce(p_from, time '22:00');
  v_to time := coalesce(p_to, time '08:00');
  v_ist timestamp := v_now at time zone 'Asia/Kolkata';
  v_minute integer := pg_catalog.date_part('hour', v_ist)::integer * 60 + pg_catalog.date_part('minute', v_ist)::integer;
  v_from_min integer := pg_catalog.date_part('hour', v_from)::integer * 60 + pg_catalog.date_part('minute', v_from)::integer;
  v_to_min integer := pg_catalog.date_part('hour', v_to)::integer * 60 + pg_catalog.date_part('minute', v_to)::integer;
  v_overnight boolean := v_from_min > v_to_min;
  v_in_quiet boolean;
  v_today date := ops.ist_date(v_now);
  v_end_date date;
begin
  v_in_quiet := case
    when v_overnight then v_minute >= v_from_min or v_minute < v_to_min
    else v_minute >= v_from_min and v_minute < v_to_min
  end;
  if not v_in_quiet then
    return null;
  end if;
  v_end_date := case when v_minute >= v_from_min then v_today + 1 else v_today end;
  return (v_end_date::text || ' ' || pg_catalog.to_char(v_to, 'HH24:MI') || ':00+05:30')::timestamptz;
end
$$;
comment on function ops.quiet_defer(time, time, timestamptz) is 'null when p_now (default ops.now()) is outside the quiet window (send now); else the IST instant the window ends. Mirrors outbox-dispatch''s deferForQuietHours.';

-- ---------------------------------------------------------------------------
-- core.events.kind → app.alert_subscriptions.kind. oc_granted, cirp_admitted,
-- developer_replied and rescore_started carry no alert bucket of their own
-- (DATA_MODEL app.alert_subscriptions.kind enum: band_change, filings, orders,
-- extensions, price, digest, payment_stage) — they still show in
-- api.following_feed (which reads core.events directly), they just never fan
-- out to push/WhatsApp. Nothing here invents a bucket the schema doesn't have.
-- ---------------------------------------------------------------------------
create function ops.alert_kind_for_event(p_kind text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case p_kind
    when 'band_changed' then 'band_change'
    when 'qpr_filed' then 'filings'
    when 'qpr_late' then 'filings'
    when 'qpr_missing' then 'filings'
    when 'extension_granted' then 'extensions'
    when 'order_decided' then 'orders'
    when 'price_list_published' then 'price'
  end
$$;
comment on function ops.alert_kind_for_event(text) is 'The app.alert_subscriptions.kind an event kind fans out under, or null when none exists (the event still appears in api.following_feed).';

-- The WhatsApp utility template for an alert kind (packages/contracts/catalogues/
-- wa_templates.json; API_CONTRACTS §5.2). Only band_change_alert and
-- filing_alert are approved in R1 — extensions, orders and price reuse
-- filing_alert (a project-change notice), the closest approved shape; there is
-- no payment_stage template yet (push only until one lands).
create function ops.wa_template_for_kind(p_alert_kind text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case p_alert_kind
    when 'band_change' then 'band_change_alert'
    when 'filings' then 'filing_alert'
    when 'extensions' then 'filing_alert'
    when 'orders' then 'filing_alert'
    when 'price' then 'filing_alert'
  end
$$;

-- A short, honest line of what happened, read from the event's own before/after
-- (never a hard-coded §5b example): filing_alert's event_line and the push
-- payload's summary.
create function ops.alert_event_line(p_kind text, p_after jsonb, p_before jsonb)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_quarter text := p_after ->> 'quarter';
begin
  return case p_kind
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
comment on function ops.alert_event_line(text, jsonb, jsonb) is 'filing_alert''s event_line and the push summary: a short, data-only line from the event''s own before/after.';

-- ---------------------------------------------------------------------------
-- ops.fan_out(p_event_id): one outbox row per matching (follower, channel)
-- subscription. Returns the number of rows it queued (0 when the event carries
-- no public alert, e.g. a draft re-score or a kind with no alert bucket).
-- ---------------------------------------------------------------------------
create function ops.fan_out(p_event_id uuid)
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
  v_n integer := 0;
  v_dedupe text;
  v_not_before timestamptz;
  v_deep_link text;
  v_line text;
  v_contact record;
  v_template text;
  v_wa_payload jsonb;
begin
  select * into v_event from core.events e where e.id = p_event_id;
  if not found or not v_event.public then
    return 0;
  end if;

  -- A freshness guard: only a just-happened event fans out. Without it, every
  -- historical fact the seed (or a restore) loads would redeliver as if it
  -- happened this second — a real backfill-storm risk, not merely a seed-time
  -- nuisance. 48h comfortably covers "detected a little after it occurred"
  -- (the QPR sweep's +1 day, a fetched_at a few hours after filing) while
  -- excluding anything genuinely historical.
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
  v_line := ops.alert_event_line(v_event.kind, v_event.after, v_event.before);

  for v_sub in
    select s.id, s.user_id, s.channel, s.quiet_from, s.quiet_to, f.follow_type
    from app.alert_subscriptions s
    join app.follows f on f.user_id = s.user_id and f.phase_id = v_phase.id
    where s.kind = v_alert_kind
      and s.enabled
      and s.cadence = 'instant'
      and s.channel in ('push', 'whatsapp')
      -- Defence in depth: payment_stage never reaches a watching follow, and
      -- never the family circle (app.alert_subscriptions.kind comment) — the
      -- circle has no row of its own to join through in the first place.
      and (v_alert_kind <> 'payment_stage' or f.follow_type = 'booked')
  loop
    v_not_before := coalesce(ops.quiet_defer(v_sub.quiet_from, v_sub.quiet_to), ops.now());
    v_dedupe := 'alert:' || p_event_id::text || ':' || v_sub.id::text;

    if v_sub.channel = 'push' then
      insert into comms.outbox (dedupe_key, user_id, channel, template_code, payload, basis, not_before)
      values (
        v_dedupe, v_sub.user_id, 'push', null,
        pg_catalog.jsonb_build_object(
          'deep_link', v_deep_link,
          'kind', v_event.kind,
          'project_name', v_phase.name,
          'line', v_line
        ),
        v_sub.id::text, v_not_before
      )
      on conflict (dedupe_key) do nothing;
      if found then
        v_n := v_n + 1;
      end if;

    elsif v_sub.channel = 'whatsapp' then
      select c.id as contact_id, c.stopped_at into v_contact
      from pii.wa_contacts c
      where c.user_id = v_sub.user_id;

      -- No linked WhatsApp contact, or the contact replied STOP (withdrawn
      -- consent): queue nothing, rather than enqueue a send that can never go
      -- out (pgTAP "withdrawn consent ... gets nothing").
      if v_contact.contact_id is null or v_contact.stopped_at is not null then
        continue;
      end if;

      v_template := ops.wa_template_for_kind(v_alert_kind);
      if v_template is null then
        continue;
      end if;

      v_wa_payload := case v_alert_kind
        when 'band_change' then pg_catalog.jsonb_build_object(
          'project', v_phase.name,
          'from_band', core.band_label(v_event.before ->> 'band'),
          'to_band', core.band_label(v_event.after ->> 'band'),
          'trigger', 'new HARERA records',
          'date', ops.fmt_date(v_event.occurred_on),
          'session_text', v_line,
          'deep_link', v_deep_link
        )
        else pg_catalog.jsonb_build_object(
          'project', v_phase.name,
          'event_line', v_line,
          'date', ops.fmt_date(v_event.occurred_on),
          'session_text', v_line,
          'deep_link', v_deep_link
        )
      end;

      insert into comms.outbox (dedupe_key, user_id, contact_id, channel, template_code, payload, basis, not_before)
      values (v_dedupe, v_sub.user_id, v_contact.contact_id, 'whatsapp_template', v_template, v_wa_payload, v_sub.id::text, v_not_before)
      on conflict (dedupe_key) do nothing;
      if found then
        v_n := v_n + 1;
      end if;
    end if;
  end loop;

  return v_n;
end
$$;
comment on function ops.fan_out(uuid) is 'Fans a public core.events row out to comms.outbox: one row per matching, enabled, instant-cadence push/whatsapp app.alert_subscriptions of the phase''s own app.follows rows. Quiet hours defer not_before; a stopped or missing WhatsApp contact queues nothing. Idempotent per (event, subscription) via dedupe_key.';

create function ops.fan_out_on_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform ops.fan_out(new.id);
  return new;
end
$$;
comment on function ops.fan_out_on_event() is 'core.events AFTER INSERT: fans the new row out (ops.fan_out). One trigger for every event-emitting table in the system, present and future.';

create trigger events_fan_out
  after insert on core.events
  for each row execute function ops.fan_out_on_event();

-- ---------------------------------------------------------------------------
-- Score publish → revalidate (API_CONTRACTS §5.5: "Score publish |
-- ops.on_run_published() → core.events → fan-out → outbox revalidate job →
-- POST /api/revalidate"). core.events/fan-out for a band change already runs
-- through core.band_history's own trigger (T43a); this is the other half of
-- that row: the ISR tag for the phase that just published. A run can be
-- inserted already published (a historical/bulk load, same allowance as
-- core.events_from_rescore_start), so this fires on INSERT or on the UPDATE
-- transition, whichever the publish actually is.
-- ---------------------------------------------------------------------------
create function ops.on_run_published()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text;
begin
  if new.status <> 'published' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'published' then
    return new;
  end if;
  -- Same freshness guard as ops.fan_out: a historical bulk load (the seed)
  -- inserts runs already published; only a just-published one revalidates.
  if new.published_at is null or new.published_at <= ops.now() - interval '48 hours' then
    return new;
  end if;

  select p.slug into v_slug from core.phases p where p.id = new.phase_id;
  if v_slug is null then
    return new;
  end if;

  insert into comms.outbox (dedupe_key, channel, payload, basis, not_before)
  values (
    'revalidate:run:' || new.id::text,
    'revalidate',
    pg_catalog.jsonb_build_object('tags', pg_catalog.jsonb_build_array('phase:' || v_slug)),
    'score_run:' || new.id::text,
    ops.now()
  )
  on conflict (dedupe_key) do nothing;

  return new;
end
$$;
comment on function ops.on_run_published() is 'core.score_runs AFTER INSERT OR UPDATE OF status: on a publish, enqueues a comms.outbox revalidate job for phase:<slug> (API_CONTRACTS §5.5). comms.outbox has no user_id/contact_id/org_member_id for this row by design (outbox_has_recipient is satisfied below by relaxing it for channel=revalidate).';

create trigger score_runs_publish_revalidate
  after insert or update of status on core.score_runs
  for each row execute function ops.on_run_published();
