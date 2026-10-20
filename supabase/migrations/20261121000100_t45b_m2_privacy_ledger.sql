-- T45b · Privacy 1/2 (m2_privacy): what the buyer saw at the tap, and the partner deletion queue.
-- Sources: API_CONTRACTS §4.10; BUILD_PLAN §13 ("Withdrawal ends the share, … sends the partner
-- a deletion request (outbox) and closes the relay"); DATA_MODEL §6; WORK_BREAKDOWN T45b.
--
-- 1. app.consents gains party_label and detail_line: the party and the purpose exactly as the
--    screen the buyer tapped named them ("Orbis Land site office", "Kestrel Park site visit").
--    They are written with the consent, under the same principal-only, insert-only rules
--    (T40's triggers), so "Who has my number" and the consent history read them from the
--    ledger instead of composing them. Older rows without them fall back to the registry.
-- 2. app.partner_deletion_requests: one queued request per withdrawn consent that named a
--    partner, written by a trigger on app.consent_withdrawals, so every withdrawal path (the
--    app, the web, a WhatsApp STOP) queues one. The outbox (T42) and the developer inbox (M4)
--    deliver it; when it is sent, the withdrawal's partner_notified_at is stamped.
--
-- T40's withdrawal triggers stay the only way a share ends and a relay closes on withdrawal.

-- ---------------------------------------------------------------------------
-- 1. The labels shown at the tap.
-- ---------------------------------------------------------------------------
alter table app.consents
  add column party_label text check (party_label is null or pg_catalog.length(party_label) between 1 and 120),
  add column detail_line text check (detail_line is null or pg_catalog.length(detail_line) between 1 and 300);
comment on column app.consents.party_label is 'pii:C1 · The party as the buyer saw it at the tap ("Orbis Land site office"). Written with the consent; read by api.who_has_my_number and api.consent_history.';
comment on column app.consents.detail_line is 'pii:C1 · What the consent was for, as shown at the tap ("Kestrel Park site visit").';

-- ---------------------------------------------------------------------------
-- 2. app.partner_deletion_requests: the queue behind "We've asked them to delete it."
-- ---------------------------------------------------------------------------
create table app.partner_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  consent_id uuid not null unique references app.consents (id),
  withdrawal_id uuid not null unique references app.consent_withdrawals (id),
  buyer_user_id uuid not null references auth.users (id),
  recipient_kind text not null check (recipient_kind in ('site_office', 'sales_office', 'agent')),
  recipient_org_id uuid,
  recipient_agent_id uuid,
  number_shared boolean not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'confirmed')),
  queued_at timestamptz not null default ops.now(),
  sent_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  check (pg_catalog.num_nonnulls(recipient_org_id, recipient_agent_id) >= 1),
  check (status <> 'queued' or (sent_at is null and confirmed_at is null)),
  check (status = 'queued' or sent_at is not null),
  check ((status = 'confirmed') = (confirmed_at is not null))
);
create index partner_deletion_requests_buyer_idx on app.partner_deletion_requests (buyer_user_id);
create index partner_deletion_requests_queued_idx on app.partner_deletion_requests (status, queued_at);
comment on table app.partner_deletion_requests is 'Deletion requests to a partner after a withdrawal (BUILD_PLAN §13). Queued by a trigger on app.consent_withdrawals; the outbox and the developer inbox deliver them. Own read; status only moves forward.';
comment on column app.partner_deletion_requests.buyer_user_id is 'pii:C1';
comment on column app.partner_deletion_requests.recipient_kind is 'pii:C1 · site_office, sales_office or agent (a plinth consent names no partner).';
comment on column app.partner_deletion_requests.recipient_org_id is 'pii:C1 · ws.orgs (M4); no FK until that table lands.';
comment on column app.partner_deletion_requests.recipient_agent_id is 'pii:C1 · The agent of record; no FK (see app.consents).';
comment on column app.partner_deletion_requests.number_shared is 'pii:C1 · The partner held the number (a share with number_shared), so the request names it.';
comment on column app.partner_deletion_requests.status is 'pii:C1 · queued → sent → confirmed.';
comment on column app.partner_deletion_requests.queued_at is 'pii:C1 · = the withdrawal time.';
comment on column app.partner_deletion_requests.sent_at is 'pii:C1 · When the outbox delivered it (stamps the withdrawal''s partner_notified_at).';
comment on column app.partner_deletion_requests.confirmed_at is 'pii:C1 · When the partner confirmed the deletion.';

create function app.partner_deletion_enqueue()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_consent app.consents%rowtype;
begin
  select c.* into v_consent from app.consents c where c.id = new.consent_id;
  if not found or v_consent.recipient_kind = 'plinth'
     or (v_consent.recipient_org_id is null and v_consent.recipient_agent_id is null) then
    return null;
  end if;
  insert into app.partner_deletion_requests (
    consent_id, withdrawal_id, buyer_user_id, recipient_kind, recipient_org_id, recipient_agent_id,
    number_shared, queued_at
  )
  values (
    v_consent.id, new.id, v_consent.principal_user_id, v_consent.recipient_kind,
    v_consent.recipient_org_id, v_consent.recipient_agent_id,
    exists (select 1 from app.contact_shares s where s.consent_id = v_consent.id and s.number_shared),
    new.withdrawn_at
  )
  on conflict (consent_id) do nothing;
  return null;
end
$$;
comment on function app.partner_deletion_enqueue() is 'AFTER INSERT on app.consent_withdrawals: queues one deletion request to the partner the consent named (none for a plinth consent).';

create function app.partner_deletion_requests_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id <> old.id
     or new.consent_id <> old.consent_id
     or new.withdrawal_id <> old.withdrawal_id
     or new.buyer_user_id <> old.buyer_user_id
     or new.recipient_kind <> old.recipient_kind
     or new.recipient_org_id is distinct from old.recipient_org_id
     or new.recipient_agent_id is distinct from old.recipient_agent_id
     or new.number_shared <> old.number_shared
     or new.queued_at <> old.queued_at
     or new.created_at <> old.created_at
     or (old.sent_at is not null and new.sent_at is distinct from old.sent_at)
     or (old.confirmed_at is not null and new.confirmed_at is distinct from old.confirmed_at)
     or (old.status = 'sent' and new.status = 'queued')
     or (old.status = 'confirmed' and new.status <> 'confirmed') then
    raise exception using
      errcode = 'PT409',
      message = 'app.partner_deletion_requests: a request keeps its parties and only moves forward (queued → sent → confirmed)',
      hint = 'A deletion request is proof; it is never rewritten.';
  end if;
  return new;
end
$$;
comment on function app.partner_deletion_requests_guard() is 'BEFORE UPDATE on app.partner_deletion_requests: parties fixed; status queued → sent → confirmed, each time set once.';

create function app.partner_deletion_mark_notified()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update app.consent_withdrawals w
     set partner_notified_at = new.sent_at
   where w.id = new.withdrawal_id
     and w.partner_notified_at is null;
  return null;
end
$$;
comment on function app.partner_deletion_mark_notified() is 'AFTER UPDATE OF sent_at on app.partner_deletion_requests: stamps the withdrawal''s partner_notified_at once.';

create trigger consent_withdrawals_queue_partner_deletion
  after insert on app.consent_withdrawals
  for each row execute function app.partner_deletion_enqueue();
create trigger partner_deletion_requests_forward_only
  before update on app.partner_deletion_requests
  for each row execute function app.partner_deletion_requests_guard();
create trigger partner_deletion_requests_notified
  after update of sent_at on app.partner_deletion_requests
  for each row when (old.sent_at is null and new.sent_at is not null)
  execute function app.partner_deletion_mark_notified();
create trigger partner_deletion_requests_no_delete
  before delete on app.partner_deletion_requests
  for each row execute function ops.forbid_mutation();
create trigger partner_deletion_requests_no_truncate
  before truncate on app.partner_deletion_requests
  for each statement execute function ops.forbid_mutation();
create trigger partner_deletion_requests_audit
  after insert or update on app.partner_deletion_requests
  for each row execute function ops.audit_trigger();

-- RLS (wall 2): the buyer reads their own requests. No insert or update policy: the
-- withdrawal trigger writes them, the outbox (service role) moves them forward.
alter table app.partner_deletion_requests enable row level security;
create policy own_read on app.partner_deletion_requests for select to authenticated
  using (buyer_user_id = (select auth.uid()));

-- Lockdown sweep for `app` (see 20261110000100). Only `app`: sweeping `api` here would drop
-- other tasks' function grants.
revoke all on all tables in schema app from public, anon, authenticated;
revoke all on all sequences in schema app from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;
