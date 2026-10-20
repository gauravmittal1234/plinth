-- T44 · WhatsApp 1/3: pii.wa_contacts, comms.wa_messages, comms.wa_sessions.
-- Sources: DATA_MODEL §9; API_CONTRACTS §5.1–§5.2; BUILD_PLAN §12.1, §12.10.
-- Edge only: RLS is on with no policies, and nothing is granted to anon or authenticated.
-- The wa-webhook function reaches these tables only through the api.wa_* functions
-- (20261114000200), which are executable by service_role alone.

-- ---------------------------------------------------------------------------
-- pii.wa_contacts: one row per WhatsApp sender. The number lives here and in
-- auth.users only. last_inbound_at opens the 24-hour session window (§5.2).
-- ---------------------------------------------------------------------------
create table pii.wa_contacts (
  id uuid primary key default gen_random_uuid(),
  wa_id_e164 text not null,
  user_id uuid null references auth.users (id) on delete set null,
  first_seen timestamptz not null default now(),
  last_inbound_at timestamptz null,
  utility_opt_in boolean not null default false,
  stopped_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wa_contacts_wa_id_e164_key unique (wa_id_e164),
  constraint wa_contacts_wa_id_e164_format check (wa_id_e164 ~ '^\+[1-9][0-9]{7,14}$')
);
create index wa_contacts_user_idx on pii.wa_contacts (user_id) where user_id is not null;
create trigger wa_contacts_touch
  before update on pii.wa_contacts
  for each row execute function ops.touch_updated_at();

comment on table pii.wa_contacts is 'WhatsApp senders (DATA_MODEL §9). Linked to an account only after the user taps "Bring them here".';
comment on column pii.wa_contacts.id is 'pii:C1';
comment on column pii.wa_contacts.wa_id_e164 is 'pii:C1 · The WhatsApp number, E.164 with "+". Never logged, never shown unmasked.';
comment on column pii.wa_contacts.user_id is 'pii:C1 · The linked account, or null.';
comment on column pii.wa_contacts.first_seen is 'pii:C1';
comment on column pii.wa_contacts.last_inbound_at is 'pii:C1 · Last inbound message (Meta timestamp); opens the 24-hour session window.';
comment on column pii.wa_contacts.utility_opt_in is 'pii:C1 · Utility templates allowed (a subscription the user turned on).';
comment on column pii.wa_contacts.stopped_at is 'pii:C1 · Set by STOP (prefs handler).';
comment on column pii.wa_contacts.created_at is 'pii:C1';
comment on column pii.wa_contacts.updated_at is 'pii:C1';

-- ---------------------------------------------------------------------------
-- comms.wa_messages: every inbound and outbound message. Idempotent on
-- wa_message_id (Meta redelivers). Inbound rows carry the routing bookkeeping
-- the sweeper needs: route, route_attempts, route_claimed_at, routed_at.
-- ---------------------------------------------------------------------------
create table comms.wa_messages (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references pii.wa_contacts (id) on delete cascade,
  direction text not null,
  wa_message_id text not null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  template_code text null,
  status text not null,
  status_at timestamptz null,
  error jsonb null,
  context_wa_message_id text null,
  route text null,
  route_attempts smallint not null default 0,
  route_claimed_at timestamptz null,
  routed_at timestamptz null,
  route_error text null,
  created_at timestamptz not null default now(),
  retain_until timestamptz not null default (now() + interval '24 months'),
  constraint wa_messages_wa_message_id_key unique (wa_message_id),
  constraint wa_messages_wa_message_id_len check (pg_catalog.length(wa_message_id) between 1 and 256),
  constraint wa_messages_direction check (direction in ('in', 'out')),
  constraint wa_messages_type check (type ~ '^[a-z_]{1,40}$'),
  constraint wa_messages_status check (status in ('received', 'sent', 'delivered', 'read', 'failed', 'mock_sent')),
  constraint wa_messages_status_direction check ((direction = 'in') = (status = 'received')),
  constraint wa_messages_payload_object check (pg_catalog.jsonb_typeof(payload) = 'object'),
  constraint wa_messages_route check (route is null or route ~ '^[a-z_]{1,40}$'),
  constraint wa_messages_route_attempts check (route_attempts >= 0)
);
create index wa_messages_contact_created_idx on comms.wa_messages (contact_id, created_at);
create index wa_messages_unrouted_idx on comms.wa_messages (created_at)
  where direction = 'in' and routed_at is null;

comment on table comms.wa_messages is 'WhatsApp messages in and out (DATA_MODEL §9). Idempotent on wa_message_id. Mock sends are status mock_sent.';
comment on column comms.wa_messages.id is 'pii:C2';
comment on column comms.wa_messages.contact_id is 'pii:C2';
comment on column comms.wa_messages.direction is 'pii:C2 · in | out';
comment on column comms.wa_messages.wa_message_id is 'pii:C2 · Meta''s message id (wamid.…); mock sends use wamid.mock.<uuid>.';
comment on column comms.wa_messages.type is 'pii:C2 · Meta''s message type (text, image, interactive, button, template …).';
comment on column comms.wa_messages.payload is 'pii:C2 · The message object, redacted: no sender number, no profile name.';
comment on column comms.wa_messages.template_code is 'pii:C2 · catalogues/wa_templates.json code for template sends.';
comment on column comms.wa_messages.status is 'pii:C2 · received (in) | sent | delivered | read | failed | mock_sent (out). Statuses only move forward.';
comment on column comms.wa_messages.status_at is 'pii:C2';
comment on column comms.wa_messages.error is 'pii:C2 · Meta''s error object on failed.';
comment on column comms.wa_messages.context_wa_message_id is 'pii:C2 · The message this one replies to (Meta context.id).';
comment on column comms.wa_messages.route is 'pii:C2 · The handler the router chose (inbound).';
comment on column comms.wa_messages.route_attempts is 'pii:C2 · Routing attempts so far (fast path + sweeper).';
comment on column comms.wa_messages.route_claimed_at is 'pii:C2 · When a router last claimed the row; the sweeper takes claims older than a minute.';
comment on column comms.wa_messages.routed_at is 'pii:C2 · Set when a handler finished; null = the sweeper retries.';
comment on column comms.wa_messages.route_error is 'pii:C2 · The last routing failure (an error code, never message text).';
comment on column comms.wa_messages.created_at is 'pii:C2';
comment on column comms.wa_messages.retain_until is 'pii:C2 · created_at + 24 months (retention-sweep anonymises after).';

-- ---------------------------------------------------------------------------
-- comms.wa_sessions: the conversation state machine (_shared/wa/session.ts owns
-- the states and transitions; the column only checks the shape).
-- ---------------------------------------------------------------------------
create table comms.wa_sessions (
  contact_id uuid primary key references pii.wa_contacts (id) on delete cascade,
  state text not null default 'idle',
  context jsonb not null default '{}'::jsonb,
  expires_at timestamptz null,
  updated_at timestamptz not null default now(),
  constraint wa_sessions_state check (state ~ '^[a-z_]{1,40}$'),
  constraint wa_sessions_context_object check (pg_catalog.jsonb_typeof(context) = 'object')
);
create trigger wa_sessions_touch
  before update on comms.wa_sessions
  for each row execute function ops.touch_updated_at();

comment on table comms.wa_sessions is 'WhatsApp conversation state per contact (DATA_MODEL §9). Edge only.';
comment on column comms.wa_sessions.contact_id is 'pii:C2';
comment on column comms.wa_sessions.state is 'pii:C2 · idle | card_shown | follow_offer | ask_open (session.ts).';
comment on column comms.wa_sessions.context is 'pii:C2 · e.g. { "slug": "aurelia-heights-phase-2" }.';
comment on column comms.wa_sessions.expires_at is 'pii:C2 · After this the session reads as idle.';
comment on column comms.wa_sessions.updated_at is 'pii:C2';

-- ---------------------------------------------------------------------------
-- RLS on, no policies: only SECURITY DEFINER api.wa_* functions reach the rows.
-- ---------------------------------------------------------------------------
alter table pii.wa_contacts enable row level security;
alter table comms.wa_messages enable row level security;
alter table comms.wa_sessions enable row level security;

-- Lockdown sweep of the schemas this migration touched (not api: that would drop
-- other tasks' function grants).
revoke all on all tables in schema comms, pii from public, anon, authenticated;
revoke all on all sequences in schema comms, pii from public, anon, authenticated;
revoke all on all functions in schema comms, pii from public, anon, authenticated;
