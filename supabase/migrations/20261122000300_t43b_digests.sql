-- T43b · Alert fan-out 3/5: ops.enqueue_digests(cadence) and its pg_cron
-- schedule (WORK_BREAKDOWN T43b; API_CONTRACTS §5.5 "pg_cron Sun 09:00 IST /
-- daily 08:00 IST | ops.enqueue_digests(cadence) (SQL) → outbox"). Not
-- `pglite: skip` for the function itself (T42's 20261112000200 precedent: the
-- shim stubs cron.schedule well enough to apply); the `select cron.schedule`
-- call at the end is the only part Docker's real pg_cron actually runs.
--
-- A digest is a utility template reporting only on followed phases (comms.
-- templates weekly_digest / daily_digest, T42, channel whatsapp): saved-search
-- matches stay out of it (fix-since-family.md §3.5). Dedupe: one row per user
-- per cadence per IST day, so a cron fired twice (or a manual re-run) the same
-- day is a no-op.

create function ops.fmt_week_range(p_from date, p_to date)
returns text
language sql
stable
strict
set search_path = ''
as $$
  select case
    when pg_catalog.date_trunc('month', p_from) = pg_catalog.date_trunc('month', p_to)
      then pg_catalog.to_char(p_from, 'FMDD') || '–' || ops.fmt_date(p_to)
    when pg_catalog.date_part('year', p_from) = pg_catalog.date_part('year', p_to)
      then pg_catalog.to_char(p_from, 'FMDD Mon') || '–' || ops.fmt_date(p_to)
    else ops.fmt_date(p_from) || ' – ' || ops.fmt_date(p_to)
  end
$$;
comment on function ops.fmt_week_range(date, date) is 'A week range as the digest header reads it: 19–25 Oct 2026 (same month); 28 Sep–4 Oct 2026 (same year); else both full dates.';

-- The one fact that may move a band, across a user's followed phases (WaDigest,
-- fix-since-family.md): the soonest-sent pending public band notice, or null
-- when none is pending (an honest empty state, never invented).
create function ops.digest_band_moving_fact(p_user_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select n.public_marker_text
  from app.follows f
  join core.band_notices n on n.phase_id = f.phase_id
  where f.user_id = p_user_id
    and n.status = 'pending'
    and n.public_marker_text is not null
    and n.sent_at <= ops.now()
  order by n.sent_at desc nulls last
  limit 1
$$;
comment on function ops.digest_band_moving_fact(uuid) is 'weekly_digest''s band_moving_fact: the newest pending, public band notice across the user''s followed phases, or null.';

create function ops.enqueue_digests(p_cadence text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub record;
  v_n integer := 0;
  v_today date := ops.today();
  v_from date;
  v_contact record;
  v_change_count integer;
  v_template text;
  v_payload jsonb;
  v_dedupe text;
begin
  if p_cadence not in ('weekly_sun_9am', 'daily_8am') then
    perform ops.raise_api_error('invalid_input', 'p_cadence must be weekly_sun_9am or daily_8am.');
  end if;

  v_template := case p_cadence when 'weekly_sun_9am' then 'weekly_digest' else 'daily_digest' end;
  v_from := case p_cadence when 'weekly_sun_9am' then v_today - 6 else v_today end;

  for v_sub in
    select s.id, s.user_id
    from app.alert_subscriptions s
    where s.kind = 'digest'
      and s.cadence = p_cadence
      and s.enabled
      and s.channel = 'whatsapp'
  loop
    select c.id as contact_id, c.stopped_at into v_contact
    from pii.wa_contacts c
    where c.user_id = v_sub.user_id;

    if v_contact.contact_id is null or v_contact.stopped_at is not null then
      continue;
    end if;

    select pg_catalog.count(*)::integer into v_change_count
    from core.events e
    join app.follows f on f.phase_id = e.phase_id
    where f.user_id = v_sub.user_id
      and e.public
      and e.detected_at >= (v_from::timestamp at time zone 'Asia/Kolkata')
      and e.detected_at <= ops.now();

    v_payload := case p_cadence
      when 'weekly_sun_9am' then pg_catalog.jsonb_build_object(
        'week_range', ops.fmt_week_range(v_from, v_today),
        'change_count', v_change_count,
        'band_moving_fact', ops.digest_band_moving_fact(v_sub.user_id),
        'session_text', v_change_count || ' change' || case when v_change_count = 1 then '' else 's' end
          || ' this week across your followed projects.',
        'deep_link', '/following'
      )
      else pg_catalog.jsonb_build_object(
        'date', ops.fmt_date(v_today),
        'change_count', v_change_count,
        'session_text', v_change_count || ' change' || case when v_change_count = 1 then '' else 's' end
          || ' today across your followed projects.',
        'deep_link', '/following'
      )
    end;

    v_dedupe := 'digest:' || p_cadence || ':' || v_sub.user_id::text || ':' || v_today::text;

    insert into comms.outbox (dedupe_key, user_id, contact_id, channel, template_code, payload, basis, not_before)
    values (v_dedupe, v_sub.user_id, v_contact.contact_id, 'whatsapp_template', v_template, v_payload, v_sub.id::text, ops.now())
    on conflict (dedupe_key) do nothing;
    if found then
      v_n := v_n + 1;
    end if;
  end loop;

  return v_n;
end
$$;
comment on function ops.enqueue_digests(text) is 'Queues one whatsapp_template outbox row (weekly_digest or daily_digest) per enabled, matching app.alert_subscriptions(kind=digest) with a live WhatsApp contact. Idempotent per (user, cadence, IST day).';

grant execute on function ops.enqueue_digests(text) to service_role;

-- pg_cron: Sun 03:30 UTC = 09:00 IST; daily 02:30 UTC = 08:00 IST.
select cron.schedule('enqueue-digests-weekly', '30 3 * * 0', $cron$select ops.enqueue_digests('weekly_sun_9am')$cron$);
select cron.schedule('enqueue-digests-daily', '30 2 * * *', $cron$select ops.enqueue_digests('daily_8am')$cron$);

revoke all on all functions in schema ops from public, anon, authenticated;
