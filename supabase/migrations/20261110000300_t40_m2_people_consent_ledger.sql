-- T40 · DB people 3/3 (m2_people): the consent ledger, contact shares and the relay.
-- app.purposes, app.notice_versions, app.consents (insert-only), app.consent_withdrawals,
-- app.relay_sessions, app.contact_shares, and the triggers that make "never shared
-- without your tap" a database constraint.
-- Sources: DATA_MODEL §6, §12 inv. 3, 4, 5 and 7; BUILD_PLAN §13 (DPDP by construction);
-- INTEGRATION_NOTES T40 (cap = distinct active recipients; notice version).
--
-- Trigger 1: contact_shares.number_shared = true only when the caller's JWT is the
--   buyer's own (role authenticated, sub = buyer_user_id) and the share rests on the
--   buyer's live number_share consent for that same party carrying a tap_event_id.
--   Everything else is rejected: the service role, a forged sub, no JWT at all.
-- Trigger 2: at most 3 distinct active number holders per buyer. Number shares last
--   30 days (ends_at), so "3 in any rolling 30 days" is "3 at once"; a relay or a
--   relay-only share is not a holder.
-- Withdrawal: an app.consent_withdrawals row ends that consent's shares and closes
--   each relay no other live visit or enquiry consent still backs.
--
-- Errors are contract errors (ops.raise_api_error): forbidden PT403,
-- consent_required / cap_reached PT409, invalid_input PT422.

-- ---------------------------------------------------------------------------
-- Reference tables: purposes and notice versions (public through api).
-- ---------------------------------------------------------------------------
create table app.purposes (
  code text primary key check (code ~ '^[a-z][a-z0-9_]*$'),
  description text not null,
  retention_class text not null check (retention_class in (
    'account_life', 'consent_proof', 'partner_ledger_12m', 'conversations_24m', 'ai_generations_12m', 'analytics_pseudonymous'
  )),
  notice_section text not null,
  created_at timestamptz not null default now()
);
comment on table app.purposes is 'Why personal data is used (DATA_MODEL §6). Text from packages/contracts/catalogues/purposes.json. Read through api.purposes.';

-- packages/contracts/catalogues/purposes.json (version 1). The §5b seed inserts the same rows (on conflict do nothing).
insert into app.purposes (code, description, retention_class, notice_section) values
  ('account', 'Run your account: sign-in by phone code, your follows, saved cost sheets and settings.', 'account_life', 'account'),
  ('alerts', 'Send the utility alerts and digests you turned on, by push, WhatsApp or email.', 'conversations_24m', 'alerts'),
  ('family_alerts', 'Send a relative who joined your circle the same alerts for the projects you shared. They never see your number.', 'account_life', 'family'),
  ('visit_share', 'Give a site office your first name, the visit time and only the questions you chose to send ahead, with a relay instead of your number.', 'partner_ledger_12m', 'sharing'),
  ('enquiry_share', 'Send a developer''s office only the enquiry fields you ticked, with a relay instead of your number.', 'partner_ledger_12m', 'sharing'),
  ('agent_brief', 'Brief the agent you chose with the fields you picked; other fields read "Not shared".', 'partner_ledger_12m', 'sharing'),
  ('number_share', 'Share your phone number with one party, by your own tap. At most 3 parties in any 30 days.', 'consent_proof', 'sharing'),
  ('analytics', 'Measure how pages are used, with pseudonymous ids. No session replay on account pages.', 'analytics_pseudonymous', 'analytics'),
  ('ai_processing', 'Read your uploads and questions with an AI model, after phones, PAN, Aadhaar and emails are removed.', 'ai_generations_12m', 'ai')
on conflict (code) do nothing;

create table app.notice_versions (
  version text primary key,
  published_at timestamptz not null,
  url text,
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  language text not null default 'en' check (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  created_at timestamptz not null default now()
);
comment on table app.notice_versions is 'Privacy notice versions (DATA_MODEL §6). Every consent names the version shown. Public read.';
comment on column app.notice_versions.url is 'Where the text of this version is published (set when the privacy page ships).';

-- DESIGN §5b C-38; INTEGRATION_NOTES T40.
insert into app.notice_versions (version, published_at, language)
values ('Privacy notice v1.0, 1 Oct 2026', '2026-10-01 00:00:00+05:30', 'en')
on conflict (version) do nothing;

-- ---------------------------------------------------------------------------
-- app.consents: the ledger. Insert-only, and only under the principal's JWT.
-- ---------------------------------------------------------------------------
create table app.consents (
  id uuid primary key default gen_random_uuid(),
  ref text not null default ops.next_ref('C') check (ref ~ '^C-[0-9]{4}-[0-9]{2,}$'),
  ref_year integer not null default ops.ref_year(),
  principal_user_id uuid not null references auth.users (id),
  purpose_code text not null references app.purposes (code),
  recipient_kind text not null check (recipient_kind in ('site_office', 'sales_office', 'agent', 'plinth')),
  recipient_org_id uuid,
  recipient_agent_id uuid,
  phase_id uuid references core.phases (id),
  notice_version text not null references app.notice_versions (version),
  channel text not null default 'web' check (channel in ('web', 'app', 'whatsapp')),
  evidence jsonb not null check (
    pg_catalog.jsonb_typeof(evidence) = 'object'
    and (coalesce(evidence ->> 'tap_event_id', '') <> '' or coalesce(evidence ->> 'wa_message_id', '') <> '')
  ),
  scope jsonb check (scope is null or pg_catalog.jsonb_typeof(scope) in ('object', 'null')),
  granted_at timestamptz not null default ops.now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (ref_year, ref),
  check (expires_at is null or expires_at > granted_at),
  check (case recipient_kind
           when 'plinth' then recipient_org_id is null and recipient_agent_id is null
           when 'agent' then recipient_agent_id is not null
           else recipient_org_id is not null and recipient_agent_id is null
         end)
);
create index consents_principal_idx on app.consents (principal_user_id);
create index consents_recipient_org_idx on app.consents (recipient_org_id);
comment on table app.consents is 'The consent ledger, C-MMDD-NN (DATA_MODEL §6; BUILD_PLAN §13). Insert-only (§12 inv. 3), written only under the principal''s own JWT. Own read.';
comment on column app.consents.ref is 'pii:C1 · C-MMDD-NN (IST day). Unique with ref_year.';
comment on column app.consents.principal_user_id is 'pii:C1';
comment on column app.consents.recipient_org_id is 'pii:C1 · ws.orgs (M4); no FK until that table lands.';
comment on column app.consents.recipient_agent_id is 'pii:C1 · The agent of record (core.agents / ws.orgs agent firms); no FK, as agent firms land in M5.';
comment on column app.consents.channel is 'pii:C1 · web, app or whatsapp.';
comment on column app.consents.evidence is 'pii:C1 · {tap_event_id} or {wa_message_id}: the buyer''s own act.';
comment on column app.consents.scope is 'pii:C1 · The fields the buyer chose to share (first name, brief fields).';

create function app.consents_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is distinct from new.principal_user_id
     or coalesce(auth.role(), '') <> 'authenticated' then
    perform ops.raise_api_error(
      'forbidden',
      'A consent is recorded only from the person''s own signed-in action.'
    );
  end if;
  return new;
end
$$;
comment on function app.consents_guard() is 'BEFORE INSERT on app.consents: the JWT must be the principal''s own (role authenticated, sub = principal_user_id).';

create trigger consents_principal_only
  before insert on app.consents
  for each row execute function app.consents_guard();
create trigger consents_append_only
  before update or delete on app.consents
  for each row execute function ops.forbid_mutation();
create trigger consents_no_truncate
  before truncate on app.consents
  for each statement execute function ops.forbid_mutation();
create trigger consents_audit
  after insert on app.consents
  for each row execute function ops.audit_trigger();

-- ---------------------------------------------------------------------------
-- app.consent_withdrawals: one per consent; only partner_notified_at changes later.
-- ---------------------------------------------------------------------------
create table app.consent_withdrawals (
  id uuid primary key default gen_random_uuid(),
  consent_id uuid not null unique references app.consents (id),
  withdrawn_at timestamptz not null default ops.now(),
  channel text not null default 'web' check (channel in ('web', 'app', 'whatsapp_keyword')),
  partner_notified_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table app.consent_withdrawals is 'Withdrawals (DATA_MODEL §6). A row ends the consent''s shares and closes the relay (app.consent_withdrawals_apply). Own.';
comment on column app.consent_withdrawals.channel is 'pii:C1 · web, app or a WhatsApp keyword (STOP).';
comment on column app.consent_withdrawals.partner_notified_at is 'pii:C1 · When the outbox sent the partner the deletion request.';

-- ---------------------------------------------------------------------------
-- app.relay_sessions: a WhatsApp text relay instead of the number.
-- ---------------------------------------------------------------------------
create table app.relay_sessions (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references auth.users (id),
  recipient_org_id uuid not null,
  phase_id uuid references core.phases (id),
  channel text not null default 'whatsapp_text' check (channel in ('whatsapp_text')),
  deal_active boolean not null default true,
  opened_at timestamptz not null default ops.now(),
  last_message_at timestamptz,
  closes_at timestamptz,
  closed_at timestamptz,
  closed_reason text check (closed_reason in ('withdrawn', 'expired', 'deal_ended', 'buyer_ended')),
  created_at timestamptz not null default now(),
  check ((closed_at is null) = (closed_reason is null))
);
create index relay_sessions_buyer_idx on app.relay_sessions (buyer_user_id);
comment on table app.relay_sessions is 'Relays (DATA_MODEL §6; D13): alive while a deal is active, then until closes_at (last message + 30 days unless renewed). Not a cap party. Own; org via the inbox RPC. call_mask is R2.';
comment on column app.relay_sessions.buyer_user_id is 'pii:C1';
comment on column app.relay_sessions.recipient_org_id is 'pii:C1 · ws.orgs (M4); no FK until that table lands.';

-- ---------------------------------------------------------------------------
-- app.contact_shares: who can reach the buyer, and how.
-- ---------------------------------------------------------------------------
create table app.contact_shares (
  id uuid primary key default gen_random_uuid(),
  consent_id uuid not null references app.consents (id),
  buyer_user_id uuid not null references auth.users (id),
  recipient_org_id uuid,
  recipient_agent_id uuid,
  phase_id uuid references core.phases (id),
  number_shared boolean not null default false,
  relay_session_id uuid references app.relay_sessions (id),
  starts_at timestamptz not null default ops.now(),
  ends_at timestamptz,
  ended_reason text check (ended_reason in ('expired', 'withdrawn', 'deal_ended', 'erased')),
  created_at timestamptz not null default now(),
  check (pg_catalog.num_nonnulls(recipient_org_id, recipient_agent_id) >= 1),
  check (ends_at is null or ends_at >= starts_at),
  check (ended_reason is null or ends_at is not null)
);
create index contact_shares_buyer_starts_idx on app.contact_shares (buyer_user_id, starts_at);
create index contact_shares_consent_idx on app.contact_shares (consent_id);
create index contact_shares_recipient_org_idx on app.contact_shares (recipient_org_id);
comment on table app.contact_shares is 'Who can reach the buyer (DATA_MODEL §6). number_shared = true only by the buyer''s own tap (Trigger 1); ≤ 3 distinct active holders (Trigger 2). Own read; org read masked through api.ws_inbox.';
comment on column app.contact_shares.buyer_user_id is 'pii:C1';
comment on column app.contact_shares.recipient_org_id is 'pii:C1 · ws.orgs (M4); no FK until that table lands.';
comment on column app.contact_shares.recipient_agent_id is 'pii:C1 · The agent of record; no FK (see app.consents).';
comment on column app.contact_shares.number_shared is 'pii:C1 · The party may see the number (only while the share is live and not withdrawn, §12 inv. 7).';
comment on column app.contact_shares.ended_reason is 'pii:C1 · expired, withdrawn, deal_ended or erased.';

-- The distinct parties holding the buyer's number now. The holder key is the agent
-- when there is one, else the org: the cap counts distinct active recipients.
create function app.number_holders(p_buyer uuid, p_except_share uuid default null)
returns uuid[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(pg_catalog.array_agg(distinct coalesce(s.recipient_agent_id, s.recipient_org_id)), '{}'::uuid[])
  from app.contact_shares s
  where s.buyer_user_id = p_buyer
    and s.number_shared
    and s.ended_reason is null
    and (s.ends_at is null or s.ends_at > ops.now())
    and (p_except_share is null or s.id <> p_except_share)
$$;
comment on function app.number_holders(uuid, uuid) is 'Distinct active number holders of a buyer at ops.now() (agent id, else org id). Ended, expired and relay-only shares are not holders. Trigger 2 caps it at 3; "Who has my number" counts it.';

create function app.contact_shares_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consent app.consents%rowtype;
  v_now timestamptz := ops.now();
  v_holder uuid := coalesce(new.recipient_agent_id, new.recipient_org_id);
  v_holders uuid[];
  v_becomes_shared boolean;
begin
  -- History is fixed: who, for which consent, to whom, from when. A share can only end.
  if tg_op = 'UPDATE' then
    if new.id <> old.id
       or new.consent_id <> old.consent_id
       or new.buyer_user_id <> old.buyer_user_id
       or new.recipient_org_id is distinct from old.recipient_org_id
       or new.recipient_agent_id is distinct from old.recipient_agent_id
       or new.phase_id is distinct from old.phase_id
       or new.starts_at <> old.starts_at
       or (old.number_shared and not new.number_shared)
       or (old.ended_reason is not null and new.ended_reason is distinct from old.ended_reason)
       or (old.ends_at is not null and (new.ends_at is null or new.ends_at > old.ends_at)) then
      raise exception using
        errcode = 'PT409',
        message = 'app.contact_shares: a share can only end (set ends_at earlier, ended_reason once) or gain a relay',
        hint = 'Create a new share from a new consent instead.';
    end if;
  end if;

  select c.* into v_consent from app.consents c where c.id = new.consent_id;
  if not found then
    perform ops.raise_api_error('consent_required', 'A share needs the buyer''s consent.');
  end if;
  if v_consent.principal_user_id <> new.buyer_user_id then
    perform ops.raise_api_error('invalid_input', 'A share belongs to the person who gave the consent.');
  end if;

  v_becomes_shared := new.number_shared and (tg_op = 'INSERT' or not old.number_shared);

  -- Trigger 1: only the buyer's own JWT, on a tap-backed number_share consent.
  if v_becomes_shared then
    if auth.uid() is distinct from new.buyer_user_id
       or coalesce(auth.role(), '') <> 'authenticated' then
      perform ops.raise_api_error('forbidden', 'Only your own tap can share your number.');
    end if;
    if v_consent.purpose_code <> 'number_share'
       or coalesce(v_consent.evidence ->> 'tap_event_id', '') = ''
       or v_consent.recipient_org_id is distinct from new.recipient_org_id
       or v_consent.recipient_agent_id is distinct from new.recipient_agent_id
       or new.starts_at < v_consent.granted_at
       or (v_consent.expires_at is not null and v_consent.expires_at <= new.starts_at)
       or exists (select 1 from app.consent_withdrawals w where w.consent_id = v_consent.id) then
      perform ops.raise_api_error(
        'consent_required',
        'Sharing your number needs your own tap on a live number-share consent for this party.'
      );
    end if;
  end if;

  -- Trigger 2: at most 3 distinct active holders. Serialised per buyer.
  if v_becomes_shared and new.ended_reason is null and (new.ends_at is null or new.ends_at > v_now) then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('app.number_holders:' || new.buyer_user_id::text, 0));
    v_holders := app.number_holders(new.buyer_user_id, new.id);
    if not (v_holder = any (v_holders)) and pg_catalog.cardinality(v_holders) >= 3 then
      perform ops.raise_api_error(
        'cap_reached',
        '3 parties can already reach you. End one of those shares before you share your number with another.'
      );
    end if;
  end if;

  return new;
end
$$;
comment on function app.contact_shares_guard() is 'BEFORE INSERT/UPDATE on app.contact_shares: Trigger 1 (number_shared needs the buyer''s own JWT and a tap-backed number_share consent for that party), Trigger 2 (≤ 3 distinct active holders), and shares can only end.';

create trigger contact_shares_consent_guard
  before insert or update on app.contact_shares
  for each row execute function app.contact_shares_guard();
create trigger contact_shares_audit
  after insert or update or delete on app.contact_shares
  for each row execute function ops.audit_trigger();

-- ---------------------------------------------------------------------------
-- Withdrawal: end the shares, close the relay.
-- ---------------------------------------------------------------------------
create function app.consent_withdrawals_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
     or new.consent_id <> old.consent_id
     or new.withdrawn_at <> old.withdrawn_at
     or new.channel <> old.channel
     or new.created_at <> old.created_at
     or (old.partner_notified_at is not null and new.partner_notified_at is distinct from old.partner_notified_at) then
    raise exception using
      errcode = 'PT409',
      message = 'app.consent_withdrawals is append-only: only partner_notified_at may be set, once',
      hint = 'A withdrawal is proof; it is never rewritten.';
  end if;
  return new;
end
$$;
comment on function app.consent_withdrawals_guard() is 'BEFORE UPDATE on app.consent_withdrawals: only partner_notified_at may be set (once).';

create function app.consent_withdrawals_apply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consent app.consents%rowtype;
begin
  select c.* into v_consent from app.consents c where c.id = new.consent_id;

  -- End every live share of the consent at the moment of withdrawal.
  update app.contact_shares s
     set ends_at = new.withdrawn_at, ended_reason = 'withdrawn'
   where s.consent_id = new.consent_id
     and s.ended_reason is null
     and (s.ends_at is null or s.ends_at > new.withdrawn_at);

  -- Close each relay this consent backed (linked from its shares, or the same buyer,
  -- org and phase) unless another live visit or enquiry consent still backs it.
  update app.relay_sessions r
     set closed_at = new.withdrawn_at, closed_reason = 'withdrawn', deal_active = false
   where r.buyer_user_id = v_consent.principal_user_id
     and r.closed_at is null
     and (
       r.id in (select s.relay_session_id from app.contact_shares s
                 where s.consent_id = new.consent_id and s.relay_session_id is not null)
       or (r.recipient_org_id = v_consent.recipient_org_id
           and (v_consent.phase_id is null or r.phase_id is not distinct from v_consent.phase_id))
     )
     and not exists (
       select 1 from app.consents o
       where o.id <> v_consent.id
         and o.principal_user_id = v_consent.principal_user_id
         and o.purpose_code in ('visit_share', 'enquiry_share')
         and o.recipient_org_id = r.recipient_org_id
         and (o.phase_id is null or o.phase_id is not distinct from r.phase_id)
         and (o.expires_at is null or o.expires_at > new.withdrawn_at)
         and not exists (select 1 from app.consent_withdrawals w where w.consent_id = o.id)
     );

  return null;
end
$$;
comment on function app.consent_withdrawals_apply() is 'AFTER INSERT on app.consent_withdrawals: ends the consent''s shares (ended_reason withdrawn) and closes the relays it alone backed.';

create trigger consent_withdrawals_only_notify
  before update on app.consent_withdrawals
  for each row execute function app.consent_withdrawals_guard();
create trigger consent_withdrawals_no_delete
  before delete on app.consent_withdrawals
  for each row execute function ops.forbid_mutation();
create trigger consent_withdrawals_no_truncate
  before truncate on app.consent_withdrawals
  for each statement execute function ops.forbid_mutation();
create trigger consent_withdrawals_end_shares
  after insert on app.consent_withdrawals
  for each row execute function app.consent_withdrawals_apply();
create trigger consent_withdrawals_audit
  after insert or update on app.consent_withdrawals
  for each row execute function ops.audit_trigger();

-- A closed relay stays closed (a renewal opens a new session).
create function app.relay_sessions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
     or new.buyer_user_id <> old.buyer_user_id
     or new.recipient_org_id <> old.recipient_org_id
     or new.phase_id is distinct from old.phase_id
     or (old.closed_at is not null and (new.closed_at is distinct from old.closed_at or new.closed_reason is distinct from old.closed_reason)) then
    raise exception using
      errcode = 'PT409',
      message = 'app.relay_sessions: a relay keeps its parties, and a closed relay stays closed',
      hint = 'Open a new relay session instead.';
  end if;
  return new;
end
$$;
comment on function app.relay_sessions_guard() is 'BEFORE UPDATE on app.relay_sessions: parties are fixed; a closed relay cannot reopen.';

create trigger relay_sessions_closed_stays_closed
  before update on app.relay_sessions
  for each row execute function app.relay_sessions_guard();
create trigger relay_sessions_audit
  after insert or update or delete on app.relay_sessions
  for each row execute function ops.audit_trigger();

-- ---------------------------------------------------------------------------
-- RLS (wall 2). Org policies read org_roles {org_id: role} from the JWT (T41's hook)
-- and see only live rows naming their org (§12 inv. 7); the inbox RPC masks fields.
-- No insert policies on shares or relays: they are written by api RPCs only.
-- ---------------------------------------------------------------------------
alter table app.purposes enable row level security;
alter table app.notice_versions enable row level security;
alter table app.consents enable row level security;
alter table app.consent_withdrawals enable row level security;
alter table app.relay_sessions enable row level security;
alter table app.contact_shares enable row level security;

create policy public_read on app.purposes for select to anon, authenticated using (true);
create policy public_read on app.notice_versions for select to anon, authenticated using (true);

create policy own_read on app.consents for select to authenticated
  using (principal_user_id = (select auth.uid()));
create policy own_insert on app.consents for insert to authenticated
  with check (principal_user_id = (select auth.uid()));

create policy own_read on app.consent_withdrawals for select to authenticated
  using (exists (select 1 from app.consents c where c.id = consent_withdrawals.consent_id and c.principal_user_id = (select auth.uid())));
create policy own_insert on app.consent_withdrawals for insert to authenticated
  with check (exists (select 1 from app.consents c where c.id = consent_withdrawals.consent_id and c.principal_user_id = (select auth.uid())));

create policy own_read on app.contact_shares for select to authenticated
  using (buyer_user_id = (select auth.uid()));
create policy org_read_live on app.contact_shares for select to authenticated
  using (
    recipient_org_id is not null
    and ended_reason is null
    and (nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'org_roles' ->> recipient_org_id::text)
        in ('sales', 'site', 'admin')
  );

create policy own_read on app.relay_sessions for select to authenticated
  using (buyer_user_id = (select auth.uid()));
create policy org_read_open on app.relay_sessions for select to authenticated
  using (
    closed_at is null
    and (nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'org_roles' ->> recipient_org_id::text)
        in ('sales', 'site', 'admin')
  );

-- Lockdown sweep for `app` (see 20261110000100).
revoke all on all tables in schema app from public, anon, authenticated;
revoke all on all sequences in schema app from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;
