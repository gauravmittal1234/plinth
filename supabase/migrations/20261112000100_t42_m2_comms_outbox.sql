-- T42 · Outbox and notify router 1/2: comms.templates, comms.outbox and the service-only RPCs
-- the outbox-dispatch edge function calls through them.
-- Sources: BUILD_PLAN §13, §15; API_CONTRACTS §5.2, §5.5; DATA_MODEL comms.templates/comms.outbox.
--
-- pg_cron and the pg_net insert trigger live in the next file (20261112000200), marked
-- `pglite: skip`, because PGlite has neither extension (supabase/tools/pglite-check.mjs).
--
-- Forward references (T40/T44 build in parallel; brief's explicit allowance for T40's tables
-- extends the same way to T44's): api.outbox_wa_contact() reads pii.wa_contacts and
-- api.outbox_record_wa_send() writes comms.wa_messages, both owned by T44 (migration prefix
-- 20261114, DATA_MODEL shape). Neither table exists yet on this branch, so each function is
-- created with `check_function_bodies = off` (the same switch pg_dump uses for forward
-- references) and is never called by this file's own tests. See the PR body Handoff note.

-- ---------------------------------------------------------------------------
-- comms.templates: mirrors packages/contracts/catalogues/wa_templates.json (API_CONTRACTS §5.2).
-- Seeded here with the M2 rows only; M4/M5 rows land with the tasks that use them.
-- ---------------------------------------------------------------------------
create table comms.templates (
  code text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'email', 'sms')),
  meta_name text not null,
  category text not null check (category in ('utility', 'authentication')),
  language text not null default 'en',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  header jsonb not null default '{"type": "none"}'::jsonb,
  variables text[] not null default '{}',
  buttons jsonb not null default '[]'::jsonb check (jsonb_typeof(buttons) = 'array'),
  subscription text,
  artboard text,
  milestone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table comms.templates is 'The WhatsApp template catalogue (admin-managed; edge functions read it to shape outbound sends). Mirrors catalogues/wa_templates.json.';
comment on column comms.templates.code is 'pii:C0';
comment on column comms.templates.channel is 'pii:C0';
comment on column comms.templates.meta_name is 'pii:C0 · the name Meta has approved, usually = code';
comment on column comms.templates.category is 'pii:C0';
comment on column comms.templates.language is 'pii:C0';
comment on column comms.templates.status is 'pii:C0 · draft = not yet submitted to Meta';
comment on column comms.templates.header is 'pii:C0';
comment on column comms.templates.variables is 'pii:C0 · ordered variable names the body fills in';
comment on column comms.templates.buttons is 'pii:C0';
comment on column comms.templates.subscription is 'pii:C0 · the app.alert_subscriptions kind this template fulfils, or null';
comment on column comms.templates.artboard is 'pii:C0';
comment on column comms.templates.milestone is 'pii:C0';
comment on column comms.templates.created_at is 'pii:C0';
comment on column comms.templates.updated_at is 'pii:C0';

alter table comms.templates enable row level security;

create trigger templates_touch
  before update on comms.templates
  for each row execute function ops.touch_updated_at();

insert into comms.templates (code, channel, meta_name, category, header, variables, buttons, subscription, artboard, milestone) values
  ('login_code', 'whatsapp', 'login_code', 'authentication',
    '{"type": "none"}'::jsonb, array['code'],
    '[{"type": "copy_code", "text": "Copy code"}]'::jsonb, null, 'WaAlerts', 'M2'),
  ('band_change_alert', 'whatsapp', 'band_change_alert', 'utility',
    '{"type": "image", "aspect": "1.91:1"}'::jsonb, array['project', 'from_band', 'to_band', 'trigger', 'date'],
    '[{"type": "quick_reply", "text": "Open full card"}, {"type": "quick_reply", "text": "Stop alerts"}]'::jsonb,
    'band_change', 'WaAlerts', 'M2'),
  ('filing_alert', 'whatsapp', 'filing_alert', 'utility',
    '{"type": "none"}'::jsonb, array['project', 'event_line', 'date'],
    '[{"type": "quick_reply", "text": "Open full card"}, {"type": "quick_reply", "text": "Stop alerts"}]'::jsonb,
    'filings', 'WaAlerts', 'M2'),
  ('weekly_digest', 'whatsapp', 'weekly_digest', 'utility',
    '{"type": "image", "aspect": "1080x570"}'::jsonb, array['week_range', 'change_count', 'band_moving_fact'],
    '[{"type": "quick_reply", "text": "See changes"}, {"type": "quick_reply", "text": "Stop weekly"}]'::jsonb,
    'digest', 'WaDigest', 'M2'),
  ('daily_digest', 'whatsapp', 'daily_digest', 'utility',
    '{"type": "none"}'::jsonb, array['date', 'change_count'],
    '[{"type": "quick_reply", "text": "See changes"}, {"type": "quick_reply", "text": "Stop daily"}]'::jsonb,
    'digest', 'WaDigest', 'M2'),
  ('family_removed', 'whatsapp', 'family_removed', 'utility',
    '{"type": "none"}'::jsonb, array['inviter_first_name', 'project'], '[]'::jsonb,
    null, 'AppFamily', 'M2'),
  ('export_ready', 'whatsapp', 'export_ready', 'utility',
    '{"type": "none"}'::jsonb, array['expiry_date'],
    '[{"type": "cta_url", "text": null}]'::jsonb, null, 'AppYou', 'M2')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- comms.outbox (DATA_MODEL comms.outbox; API_CONTRACTS §5.2, §5.5). Every send is DPDP
-- evidence: rows are appended and updated by the dispatcher, never deleted here.
-- ---------------------------------------------------------------------------
create table comms.outbox (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null,
  user_id uuid references auth.users (id) on delete set null,
  -- Soft reference to pii.wa_contacts(id) (T44, migration 20261114): no FK yet, same reason as
  -- the header comment. api.outbox_wa_contact() reads it at send time.
  contact_id uuid,
  -- Soft reference to a future ws org-member table (no such table exists in R1 yet).
  org_member_id uuid,
  channel text not null check (channel in ('push', 'whatsapp_template', 'whatsapp_session', 'email', 'sms')),
  template_code text references comms.templates (code),
  payload jsonb not null default '{}'::jsonb,
  basis text,
  not_before timestamptz not null default ops.now(),
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'delivered', 'failed', 'suppressed')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outbox_has_recipient check (
    user_id is not null or contact_id is not null or org_member_id is not null
  ),
  unique (dedupe_key)
);
create index outbox_due_idx on comms.outbox (status, not_before);
create index outbox_contact_idx on comms.outbox (contact_id) where contact_id is not null;
comment on table comms.outbox is 'Every push, WhatsApp and email send, queued then resolved by outbox-dispatch. Edge only (service_role); DPDP evidence (BUILD_PLAN §13).';
comment on column comms.outbox.dedupe_key is 'pii:C0 · uniquely identifies the notification instance (e.g. band-change + phase + run); a second insert is a no-op (on conflict do nothing in the inserting code)';
comment on column comms.outbox.user_id is 'pii:C1';
comment on column comms.outbox.contact_id is 'pii:C1 · pii.wa_contacts(id), once T44 lands';
comment on column comms.outbox.org_member_id is 'pii:C1';
comment on column comms.outbox.channel is 'pii:C0';
comment on column comms.outbox.template_code is 'pii:C0';
comment on column comms.outbox.payload is 'pii:C2 · the rendered variables (names, project facts); never a phone number or document';
comment on column comms.outbox.basis is 'pii:C0 · the subscription id or consent ref this send is authorised by';
comment on column comms.outbox.not_before is 'pii:C0 · quiet hours and digest scheduling';
comment on column comms.outbox.status is 'pii:C0';
comment on column comms.outbox.attempts is 'pii:C0';
comment on column comms.outbox.last_error is 'pii:C0 · a short internal reason, never a secret or the caller''s content';
comment on column comms.outbox.provider_message_id is 'pii:C0';
comment on column comms.outbox.sent_at is 'pii:C0';
comment on column comms.outbox.created_at is 'pii:C0';
comment on column comms.outbox.updated_at is 'pii:C0';

alter table comms.outbox enable row level security;

create trigger outbox_touch
  before update on comms.outbox
  for each row execute function ops.touch_updated_at();

-- ---------------------------------------------------------------------------
-- api.outbox_claim_due: atomically claims up to p_limit due rows (SKIP LOCKED, so the 10 s
-- pg_cron poll and the pg_net insert trigger never double-claim the same row), joining the
-- template shape the dispatcher needs to build the WhatsApp request.
-- ---------------------------------------------------------------------------
create function api.outbox_claim_due(p_limit integer default 25)
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
      select id from comms.outbox
      where status = 'queued' and not_before <= ops.now()
      order by not_before
      limit p_limit
      for update skip locked
    )
    returning o.*
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
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
        'template', case when t.code is null then null else jsonb_build_object(
          'meta_name', t.meta_name,
          'category', t.category,
          'language', t.language,
          'header', t.header,
          'variables', t.variables,
          'buttons', t.buttons
        ) end
      )
      order by c.not_before
    ),
    '[]'::jsonb
  )
  into v_rows
  from claimed c
  left join comms.templates t on t.code = c.template_code;

  return v_rows;
end;
$$;
comment on function api.outbox_claim_due(integer) is 'Service-only. Claims up to p_limit queued, due comms.outbox rows (SKIP LOCKED) and returns them joined with their template.';

-- ---------------------------------------------------------------------------
-- api.outbox_resolve: the one write-back the dispatcher makes once it knows the outcome of a
-- claimed row. p_outcome:
--   sent        status=sent, records the actual channel used and the provider message id.
--   failed      attempts += 1; status becomes 'failed' at p_max_attempts, else 'queued' again
--               at p_not_before (the caller's backoff).
--   suppressed  a terminal no-send (a stopped contact, a disabled channel flag): status=suppressed.
--   deferred    not a failure: requeued at p_not_before without spending an attempt (quiet hours).
-- ---------------------------------------------------------------------------
create function api.outbox_resolve(
  p_id uuid,
  p_outcome text,
  p_channel text default null,
  p_provider_message_id text default null,
  p_error text default null,
  p_not_before timestamptz default null,
  p_max_attempts integer default 6
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_outcome not in ('sent', 'failed', 'suppressed', 'deferred') then
    perform ops.raise_api_error('invalid_input', 'p_outcome must be sent, failed, suppressed or deferred.');
  end if;

  if p_outcome = 'sent' then
    update comms.outbox
    set status = 'sent',
        channel = coalesce(p_channel, channel),
        provider_message_id = p_provider_message_id,
        sent_at = ops.now(),
        last_error = null
    where id = p_id;
  elsif p_outcome = 'suppressed' then
    update comms.outbox
    set status = 'suppressed', last_error = p_error
    where id = p_id;
  elsif p_outcome = 'deferred' then
    update comms.outbox
    set status = 'queued', not_before = coalesce(p_not_before, ops.now())
    where id = p_id;
  else
    update comms.outbox
    set attempts = attempts + 1,
        last_error = p_error,
        status = case when attempts + 1 >= coalesce(p_max_attempts, 6) then 'failed' else 'queued' end,
        not_before = coalesce(p_not_before, ops.now())
    where id = p_id;
  end if;
end;
$$;
comment on function api.outbox_resolve(uuid, text, text, text, text, timestamptz, integer) is 'Service-only. Writes back the outcome of a claimed comms.outbox row.';

-- ---------------------------------------------------------------------------
-- api.outbox_wa_contact: the 24-hour-window read, "at runtime" (API_CONTRACTS §5.2, WORK_BREAKDOWN
-- T42). Forward reference to pii.wa_contacts (T44) — see the header comment.
-- ---------------------------------------------------------------------------
set check_function_bodies = off;

create function api.outbox_wa_contact(p_contact_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v jsonb;
begin
  if p_contact_id is null then
    return null;
  end if;

  select jsonb_build_object(
    'wa_id_e164', c.wa_id_e164,
    'last_inbound_at', c.last_inbound_at,
    'utility_opt_in', c.utility_opt_in,
    'stopped_at', c.stopped_at
  )
  into v
  from pii.wa_contacts c
  where c.id = p_contact_id;

  return v;
end;
$$;
comment on function api.outbox_wa_contact(uuid) is 'Service-only. The contact fields outbox-dispatch needs to pick template vs. session and to address the send (pii.wa_contacts, T44 — see 20261112000100''s header comment).';

-- ---------------------------------------------------------------------------
-- api.outbox_record_wa_send: writes the outbound WhatsApp request into comms.wa_messages
-- (status mock_sent under META_MODE=mock), idempotent on wa_message_id. Forward reference to
-- comms.wa_messages (T44) — see the header comment.
-- ---------------------------------------------------------------------------
create function api.outbox_record_wa_send(
  p_contact_id uuid,
  p_wa_message_id text,
  p_type text,
  p_payload jsonb,
  p_template_code text,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into comms.wa_messages
    (contact_id, direction, wa_message_id, type, payload, template_code, status, created_at)
  values
    (p_contact_id, 'outbound', p_wa_message_id, p_type, p_payload, p_template_code, p_status, ops.now())
  on conflict (wa_message_id) do nothing;
end;
$$;
comment on function api.outbox_record_wa_send(uuid, text, text, jsonb, text, text) is 'Service-only. Records an outbound WhatsApp send (comms.wa_messages, T44 — see 20261112000100''s header comment); status=mock_sent under META_MODE=mock.';

set check_function_bodies = on;

-- ---------------------------------------------------------------------------
-- Lockdown sweep (BUILD_PLAN §12.1; every DB task repeats this, supabase/tests/rls checks it).
-- The sweep revokes EXECUTE on every function in these schemas (Postgres grants it to PUBLIC on
-- CREATE FUNCTION), so every earlier task's api grants are re-asserted here too, not just T42's.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
grant execute on function api.risk_summary(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text, text) to anon, authenticated, service_role;
grant execute on function api.project_page(text) to anon, authenticated, service_role;
grant execute on function api.developer_page(text) to anon, authenticated, service_role;
grant execute on function api.search_projects(text, jsonb, text, jsonb, text, integer) to anon, authenticated, service_role;
grant execute on function api.suggest(text) to anon, authenticated, service_role;
grant execute on function api.compare(text[]) to anon, authenticated, service_role;
grant execute on function api.methodology() to anon, authenticated, service_role;
grant execute on function api.about() to anon, authenticated, service_role;

-- comms.outbox and comms.templates are edge-only (DATA_MODEL §0): service_role alone, no RLS
-- policy needed (RLS stays on with no policy, matching the core/ops pattern, since BYPASSRLS is
-- what actually lets service_role through). The grants below are what supabase/tests/outbox
-- proves. (No prior migration granted USAGE on schema comms to anyone; T04 only did `api`.)
grant usage on schema comms to service_role;
grant select, insert, update on comms.outbox to service_role;
grant select on comms.templates to service_role;

grant execute on function api.outbox_claim_due(integer) to service_role;
grant execute on function api.outbox_resolve(uuid, text, text, text, text, timestamptz, integer) to service_role;
grant execute on function api.outbox_wa_contact(uuid) to service_role;
grant execute on function api.outbox_record_wa_send(uuid, text, text, jsonb, text, text) to service_role;
