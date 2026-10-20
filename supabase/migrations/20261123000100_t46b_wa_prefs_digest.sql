-- T46b · WhatsApp prefs and digest: the two service-only RPCs the prefs and digest handlers
-- need that no earlier task exposed.
-- Sources: AGENTS.md §7 "Consent is a database constraint" (a withdrawal needs no user JWT:
-- T40); API_CONTRACTS §5.1 (the intent router: "STOP", "Stop alerts", "Stop weekly" → prefs.stop;
-- "See changes" → digest), §5.2 (weekly_digest / daily_digest buttons); DATA_MODEL §2 core.events
-- ("drives alerts … and the digest").
--
-- Handoff (see the T46b PR body): OWNERSHIP.md's migration-prefix table had no row for T46b (the
-- brief's "Owns" line names only the handler and template files). STOP arrives as plain typed
-- text, not a button tap (packages/fixtures/recorded/wa/text-stop.json), so it cannot mint the
-- tap JWT (_shared/wa/verify.ts isTap/mintTapToken refuse a non-tap message) and api.alert_prefs_set
-- cannot be called by the service role (app.buyer_caller requires role authenticated). Nothing
-- exposed pii.wa_contacts.stopped_at, and nothing read core.events for a buyer's followed phases,
-- through the `api` schema PostgREST exposes to edge functions. This migration adds exactly those
-- two reads/writes, scoped to the WhatsApp contact the inbound message came from, and no more.
-- The lead may prefer a different prefix or home for these; flagged for review.
--
-- api.whatsapp_prefs_stop(contact_id, action): STOP (stop_all), "Stop alerts", "Stop weekly",
-- "Stop daily", and their resume — the WaDigest "Turn weekly on" reuses the same button id as
-- "Stop weekly" (API_CONTRACTS §5.1 names one prefs.stop rule), so the handler asks this RPC to
-- toggle, and it answers what is now true. stop_all sets pii.wa_contacts (the one field every
-- outbound check already reads: api.outbox_wa_contact, T42); it alone is enough to stop every
-- WhatsApp send (app.whatsapp_ready), so it never has to touch app.alert_subscriptions. The three
-- partial actions touch app.alert_subscriptions only for a linked number (an unlinked WhatsApp
-- sender has no per-kind row to change) and follow api.alert_prefs_set's own convention: "off" is
-- a cadence value, not enabled = false (app.alert_prefs_json reads enabled rows' cadence).
--
-- api.whatsapp_digest_changes(contact_id, days): the change lines for "See changes" — core.events on
-- the linked buyer's followed phases in the last p_days (default 7), one generic sentence per
-- event built from its own kind/occurred_on/before/after (app.wa_event_line), never a line composed
-- in the edge function (AGENTS.md rule 10). An unlinked number has no followed phases: an honest
-- empty read, not an error.

-- ---------------------------------------------------------------------------
-- app.wa_event_line: one generic sentence for a core.events row. Driven only by the row's own
-- kind/occurred_on/before/after — never a project name, count or fact invented here.
-- ---------------------------------------------------------------------------
create function app.wa_event_line(p_kind text, p_on date, p_before jsonb, p_after jsonb)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case p_kind
    when 'band_changed' then 'delivery risk moved from '
      || pg_catalog.initcap(coalesce(p_before ->> 'band', 'its band')) || ' to '
      || pg_catalog.initcap(coalesce(p_after ->> 'band', 'a new band')) || ' on ' || ops.fmt_date(p_on)
    when 'qpr_filed' then 'a quarterly report was filed on time, ' || ops.fmt_date(p_on)
    when 'qpr_late' then 'a quarterly report was filed late, ' || ops.fmt_date(p_on)
    when 'qpr_missing' then 'a quarterly report is not on HARERA yet, due ' || ops.fmt_date(p_on)
    when 'extension_granted' then 'the completion date moved, order of ' || ops.fmt_date(p_on)
    when 'order_decided' then 'a new HARERA order was passed on ' || ops.fmt_date(p_on)
    when 'price_list_published' then 'a new price list was published on ' || ops.fmt_date(p_on)
    when 'oc_granted' then 'the occupation certificate was granted on ' || ops.fmt_date(p_on)
    when 'cirp_admitted' then 'an insolvency case was admitted on ' || ops.fmt_date(p_on)
    when 'developer_replied' then 'the developer replied on ' || ops.fmt_date(p_on)
    when 'construction_update' then 'a construction update was recorded on ' || ops.fmt_date(p_on)
    when 'rescore_started' then 're-scoring started on ' || ops.fmt_date(p_on)
    else 'something changed on ' || ops.fmt_date(p_on)
  end
$$;
comment on function app.wa_event_line(text, date, jsonb, jsonb) is 'One generic "See changes" sentence for a core.events row (WaDigest; api.whatsapp_digest_changes). No project name, count or band word is invented: those come from the row itself.';

-- ---------------------------------------------------------------------------
-- api.whatsapp_prefs_stop
-- ---------------------------------------------------------------------------
create function api.whatsapp_prefs_stop(p_contact_id uuid, p_action text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_contact pii.wa_contacts;
  v_row app.alert_subscriptions;
  v_want_cadence text;
  v_band_on boolean := false;
  v_digest_on boolean := false;
  v_digest_cadence text;
begin
  if p_action not in ('stop_all', 'stop_alerts', 'stop_weekly', 'stop_daily') then
    perform ops.raise_api_error('invalid_input', 'That isn''t a WhatsApp preference we know.');
  end if;

  select k.* into v_contact from pii.wa_contacts k where k.id = p_contact_id for update;
  if not found then
    perform ops.raise_api_error('not_found', 'We have no WhatsApp contact with this id.');
  end if;

  if p_action = 'stop_all' and v_contact.stopped_at is null then
    update pii.wa_contacts k set utility_opt_in = false, stopped_at = ops.now()
      where k.id = v_contact.id
      returning * into v_contact;
    perform ops.audit('opt_out', 'pii.wa_contacts', v_contact.id::text,
      pg_catalog.jsonb_build_object('utility_opt_in', true, 'stopped_at', null),
      pg_catalog.jsonb_build_object('utility_opt_in', false, 'stopped_at', v_contact.stopped_at),
      'STOP');
  end if;

  if v_contact.user_id is not null then
    if p_action = 'stop_alerts' then
      update app.alert_subscriptions s set cadence = 'off'
        where s.user_id = v_contact.user_id and s.channel = 'whatsapp'
          and s.kind in ('band_change', 'filings', 'orders', 'extensions', 'price') and s.cadence <> 'off';
    elsif p_action in ('stop_weekly', 'stop_daily') then
      v_want_cadence := case when p_action = 'stop_weekly' then 'weekly_sun_9am' else 'daily_8am' end;
      select s.* into v_row from app.alert_subscriptions s
        where s.user_id = v_contact.user_id and s.channel = 'whatsapp' and s.kind = 'digest'
        for update;
      if not found then
        insert into app.alert_subscriptions (user_id, channel, kind, cadence, enabled)
        values (v_contact.user_id, 'whatsapp', 'digest', v_want_cadence, true);
      elsif v_row.cadence = v_want_cadence then
        update app.alert_subscriptions s set cadence = 'off' where s.id = v_row.id;
      else
        update app.alert_subscriptions s set cadence = v_want_cadence where s.id = v_row.id;
      end if;
    end if;

    select coalesce(pg_catalog.bool_or(s.cadence <> 'off'), false) into v_band_on
      from app.alert_subscriptions s
      where s.user_id = v_contact.user_id and s.channel = 'whatsapp' and s.kind = 'band_change';
    select s.cadence into v_digest_cadence from app.alert_subscriptions s
      where s.user_id = v_contact.user_id and s.channel = 'whatsapp' and s.kind = 'digest';
    v_digest_on := coalesce(v_digest_cadence, 'off') <> 'off';
  end if;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.wa_prefs_stop/1',
    'action', p_action,
    'linked', v_contact.user_id is not null,
    'stopped', v_contact.stopped_at is not null,
    'band_change_on', v_band_on,
    'digest_on', v_digest_on,
    'digest_cadence', v_digest_cadence
  );
end
$$;
comment on function api.whatsapp_prefs_stop(uuid, text) is 'wa-webhook prefs handler (service_role, T46b): STOP (stop_all: pii.wa_contacts, enough on its own to stop every WhatsApp send), "Stop alerts", "Stop weekly", "Stop daily" (app.alert_subscriptions, a linked number only). stop_weekly/stop_daily toggle: run again (WaDigest "Turn weekly on") to turn the same cadence back on. Needs no user JWT: a withdrawal is never gated behind re-proving consent (AGENTS.md §7). { action, linked, stopped, band_change_on, digest_on, digest_cadence }.';

-- ---------------------------------------------------------------------------
-- api.whatsapp_digest_changes
-- ---------------------------------------------------------------------------
create function api.whatsapp_digest_changes(p_contact_id uuid, p_days integer default 7)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_contact pii.wa_contacts;
  v_since timestamptz;
  v_lines text[] := '{}';
  v_row record;
begin
  select k.* into v_contact from pii.wa_contacts k where k.id = p_contact_id;
  if not found then
    perform ops.raise_api_error('not_found', 'We have no WhatsApp contact with this id.');
  end if;
  if v_contact.user_id is null then
    return pg_catalog.jsonb_build_object(
      'schema', 'plinth.wa_digest_changes/1', 'change_count', 0, 'lines', '[]'::jsonb, 'since', null
    );
  end if;

  v_since := ops.now() - pg_catalog.make_interval(days => greatest(coalesce(p_days, 7), 1));

  for v_row in
    select app.phase_short_name(p.name) as phase_short, e.kind, e.occurred_on, e.before, e.after
      from core.events e
      join core.phases p on p.id = e.phase_id
     where e.phase_id = any (app.followed_phase_ids(v_contact.user_id))
       and e.public
       and e.detected_at >= v_since
     order by e.detected_at, e.id
  loop
    v_lines := v_lines
      || (v_row.phase_short || ': ' || app.wa_event_line(v_row.kind, v_row.occurred_on, v_row.before, v_row.after));
  end loop;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.wa_digest_changes/1',
    'change_count', pg_catalog.cardinality(v_lines),
    'lines', pg_catalog.to_jsonb(v_lines),
    'since', ops.ist_date(v_since)
  );
end
$$;
comment on function api.whatsapp_digest_changes(uuid, integer) is 'wa-webhook digest handler (service_role, T46b): "See changes" — core.events on the linked buyer''s followed phases in the last p_days (default 7), one line per event (app.wa_event_line). An unlinked contact reads as zero changes, not an error. { change_count, lines, since }.';

-- ---------------------------------------------------------------------------
-- Grants: service_role only (same pattern as T44's api.wa_* functions, 20261114000200).
-- ---------------------------------------------------------------------------
revoke all on function api.whatsapp_prefs_stop(uuid, text) from public, anon, authenticated;
revoke all on function api.whatsapp_digest_changes(uuid, integer) from public, anon, authenticated;

grant execute on function api.whatsapp_prefs_stop(uuid, text) to service_role;
grant execute on function api.whatsapp_digest_changes(uuid, integer) to service_role;

-- Lockdown sweep for `app` (a new SQL function grants EXECUTE to PUBLIC by default; see 20261110000100).
revoke all on all functions in schema app from public, anon, authenticated;
