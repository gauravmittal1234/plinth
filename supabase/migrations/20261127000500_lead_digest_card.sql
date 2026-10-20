-- Lead · M2 gate gap 5 (T59, PR #89): the weekly digest's 1080×570 image header had no URL.
--
-- weekly_digest's template has an image header (comms.templates: 1080x570, "one floor per
-- followed project"); apps/web/src/features/cards/digest-card.tsx draws it. A digest is
-- personal (which projects someone follows), so its card is never addressed by a person or a
-- guessable key: ops.enqueue_digests mints a random card_token per digest row (32 hex digits,
-- 122 random bits from gen_random_uuid) and puts the card's URL in the row,
--   header_image_url = https://plinth.in/cards/digest/<card_token>.png
-- the web's /cards/digest/<token>.png reads it back through api.digest_card(p_token), the same
-- way /cards/changed/<code>.png reads api.share_card(p_code). An unknown or malformed token is
-- one neutral not_found.
--
-- api.digest_card answers plinth.digest_card/1: the heading the card prints, composed here from
-- the row's own week_range and change_count (the numbers the template body carries, so the image
-- and the text agree; AGENTS rule 10, server copy), and one floor per followed project (slug, name
-- and the chip core.phase_view gives every surface). Never a follow type, a phone or a consent.
-- Re-creates ops.enqueue_digests (T43b) with the two new payload fields; nothing else changes.

create or replace function ops.enqueue_digests(p_cadence text)
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
  v_token text;
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

    v_token := pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', '');

    v_payload := case p_cadence
      when 'weekly_sun_9am' then pg_catalog.jsonb_build_object(
        'week_range', ops.fmt_week_range(v_from, v_today),
        'change_count', v_change_count,
        'band_moving_fact', ops.digest_band_moving_fact(v_sub.user_id),
        'card_token', v_token,
        'header_image_url', core.public_base_url() || '/cards/digest/' || v_token || '.png',
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
comment on function ops.enqueue_digests(text) is 'Queues one whatsapp_template outbox row (weekly_digest or daily_digest) per enabled, matching app.alert_subscriptions(kind=digest) with a live WhatsApp contact. A weekly row carries its header image: a fresh card_token and header_image_url /cards/digest/<card_token>.png. Idempotent per (user, cadence, IST day).';

create index outbox_digest_card_token_idx on comms.outbox ((payload ->> 'card_token'))
  where template_code = 'weekly_digest';

create function api.digest_card(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_token text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_token, '')));
  v_row record;
  v_n integer;
begin
  if v_token !~ '^[0-9a-f]{32}$' then
    perform ops.raise_api_error('not_found', 'We have no digest card at this link.');
  end if;

  select o.user_id, o.payload into v_row
  from comms.outbox o
  where o.template_code = 'weekly_digest' and o.payload ->> 'card_token' = v_token
  order by o.created_at desc
  limit 1;
  if not found or v_row.user_id is null then
    perform ops.raise_api_error('not_found', 'We have no digest card at this link.');
  end if;

  v_n := coalesce((v_row.payload ->> 'change_count')::integer, 0);
  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.digest_card/1',
    'heading_line', 'This week in your projects · ' || (v_row.payload ->> 'week_range') || ' · '
      || case v_n when 0 then 'nothing new on record' when 1 then '1 change on record' else v_n || ' changes on record' end,
    'projects', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object('slug', x.v ->> 'slug', 'name', x.v ->> 'name', 'chip', x.v -> 'chip')
        order by x.v ->> 'name', x.v ->> 'slug'
      )
      from app.follows f
      cross join lateral (select core.phase_view(f.phase_id) as v) x
      where f.user_id = v_row.user_id and x.v is not null
    ), '[]'::jsonb)
  );
end
$$;
comment on function api.digest_card(text) is 'plinth.digest_card/1: the weekly digest''s 1080×570 header for /cards/digest/<card_token>.png. The token is the unguessable card_token ops.enqueue_digests put in that digest''s row; the heading is the row''s own week range and change count; one floor per followed project (slug, name, chip). Errors: not_found (unknown or malformed token, one neutral answer).';

revoke all on function api.digest_card(text) from public;
grant execute on function api.digest_card(text) to anon, authenticated, service_role;
revoke all on function ops.enqueue_digests(text) from public, anon, authenticated;
grant execute on function ops.enqueue_digests(text) to service_role;
