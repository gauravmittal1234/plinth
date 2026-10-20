-- T53 · DPDP 3/4: account erasure with legal-hold rules (delete-account, retention-sweep).
-- Sources: BUILD_PLAN §13 ("Erasure within 30 days, with legal-hold exceptions"; retention
-- table: consent ledger and contact-share history "life of the account + 3 years, as proof of
-- consent", audit logs ≥ 2 years); API_CONTRACTS §3.5 (delete-account, pet_app pattern);
-- DATA_MODEL §5, §6, §12 inv. 3 (the ledger is insert-only); T45b api.account_delete_request.
--
-- The flow (the request row is the record, T45b api.account_delete_request under the buyer's
-- own JWT; support can also file one as admin):
--   1. api.dpdp_erasure_run(request): erases the request's own user's account data in one
--      transaction and writes app.dpdp_erasures (the erasure record). Idempotent: a retry
--      re-runs the deletes and keeps the first record.
--   2. The edge removes the user's files (uploads, voice notes, exports) through the Storage
--      API and soft-deletes the sign-in (auth.admin.deleteUser(id, true): GoTrue obfuscates the
--      phone and email, clears the metadata, ends every session and keeps the row).
--   3. api.dpdp_erasure_complete(request, storage_removed, identity_erased) records each step
--      and, once both are done, completes the request and drops the user id from every DPDP
--      request row.
--
-- Legal hold (app.dpdp_legal_holds): the consent ledger (app.consents, insert-only), its
-- withdrawals, the contact-share and relay history and the partner deletion requests stay as
-- proof of consent until 3 years after the erasure; they name no one once the profile, the
-- WhatsApp contact and the sign-in's phone are gone. ops.audit_log stays (≥ 2 years). Send
-- records in comms.outbox stay with their content cleared. Every live share ends
-- (ended_reason 'erased'), every open relay closes, and every consent is withdrawn, so each
-- partner that held anything gets a deletion request (T45b's trigger).

-- ---------------------------------------------------------------------------
-- app.dpdp_erasures: one record per erasure request.
-- ---------------------------------------------------------------------------
create table app.dpdp_erasures (
  request_id uuid primary key references app.data_requests (id),
  subject_id uuid not null,
  erased_at timestamptz not null default ops.now(),
  last_run_at timestamptz not null default ops.now(),
  runs integer not null default 1 check (runs >= 1),
  summary jsonb not null check (pg_catalog.jsonb_typeof(summary) = 'object'),
  storage_objects jsonb not null default '[]'::jsonb check (pg_catalog.jsonb_typeof(storage_objects) = 'array'),
  storage_removed_at timestamptz,
  identity_erased_at timestamptz,
  completed_at timestamptz,
  hold_until timestamptz not null,
  created_at timestamptz not null default now(),
  check (completed_at is null or (storage_removed_at is not null and identity_erased_at is not null))
);
create index dpdp_erasures_open_idx on app.dpdp_erasures (erased_at) where completed_at is null;
comment on table app.dpdp_erasures is 'The record of each account erasure (BUILD_PLAN §13): what was removed, what is kept under legal hold and until when, and when the files and the sign-in were removed. Edge and admin only; no client policy.';
comment on column app.dpdp_erasures.subject_id is 'pii:C1 · The erased account''s id. No FK: after the sign-in is soft-deleted the id names no one, and it is what the kept consent proof carries.';
comment on column app.dpdp_erasures.summary is 'pii:C0 · Counts removed and kept by class, and the legal holds applied. Never names or numbers.';
comment on column app.dpdp_erasures.storage_objects is 'pii:C1 · [{bucket, key}] still to remove from Storage; emptied once removed.';
comment on column app.dpdp_erasures.storage_removed_at is 'pii:C0';
comment on column app.dpdp_erasures.identity_erased_at is 'pii:C0 · When the sign-in was soft-deleted (phone and email obfuscated by GoTrue).';
comment on column app.dpdp_erasures.completed_at is 'pii:C0';
comment on column app.dpdp_erasures.hold_until is 'pii:C0 · erased_at + 3 years: the end of the consent-proof hold.';

create trigger dpdp_erasures_audit
  after insert or update on app.dpdp_erasures
  for each row execute function ops.audit_trigger();
create trigger dpdp_erasures_no_delete
  before delete on app.dpdp_erasures
  for each row execute function ops.forbid_mutation();
create trigger dpdp_erasures_no_truncate
  before truncate on app.dpdp_erasures
  for each statement execute function ops.forbid_mutation();

alter table app.dpdp_erasures enable row level security;
create policy admin_read on app.dpdp_erasures for select to authenticated
  using (
    coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'plinth_roles') ? 'admin', false)
    and nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal' = 'aal2'
  );

-- ---------------------------------------------------------------------------
-- The legal holds (BUILD_PLAN §13 retention table).
-- ---------------------------------------------------------------------------
create function app.dpdp_legal_holds()
returns jsonb
language sql
immutable
parallel safe
set search_path = ''
as $$
  select pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object(
      'class', 'consent_proof',
      'tables', pg_catalog.jsonb_build_array(
        'app.consents', 'app.consent_withdrawals', 'app.contact_shares', 'app.relay_sessions',
        'app.partner_deletion_requests'
      ),
      'kept_for', 'Life of the account + 3 years, as proof of consent',
      'line', 'Proof of the consents you gave and of who had your number stays for 3 years, without your name or number.'
    ),
    pg_catalog.jsonb_build_object(
      'class', 'audit',
      'tables', pg_catalog.jsonb_build_array('ops.audit_log'),
      'kept_for', 'At least 2 years',
      'line', 'Our audit log keeps a record of changes for at least 2 years.'
    ),
    pg_catalog.jsonb_build_object(
      'class', 'send_records',
      'tables', pg_catalog.jsonb_build_array('comms.outbox'),
      'kept_for', 'With the consent proof',
      'line', 'Records of the alerts we sent you stay, with their content removed.'
    ),
    pg_catalog.jsonb_build_object(
      'class', 'requests',
      'tables', pg_catalog.jsonb_build_array('app.data_requests', 'app.dpdp_erasures'),
      'kept_for', 'With the consent proof',
      'line', 'This erasure request stays on record, without your account.'
    )
  )
$$;
comment on function app.dpdp_legal_holds() is 'What an erasure keeps, why and for how long (BUILD_PLAN §13): consent proof (3 years), audit (≥ 2 years), send records (content cleared), the request record.';

-- ---------------------------------------------------------------------------
-- The erasure itself: one user's account data, in one transaction. Re-runnable.
-- ---------------------------------------------------------------------------
create function app.dpdp_erase_user(p_uid uuid, p_channel text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := ops.now();
  v_objects jsonb;
  v_contacts uuid[];
  n_follows integer;
  n_alerts integer;
  n_searches integer;
  n_devices integer;
  n_roles integer;
  n_uploads integer;
  n_circles integer;
  n_memberships integer;
  n_notes integer;
  n_project_requests integer;
  n_wa_contacts integer;
  n_outbox integer;
  n_shares_ended integer;
  n_relays_closed integer;
  n_withdrawals integer;
  n_profile integer;
begin
  -- Files to remove through the Storage API (the edge does it; direct DELETE on
  -- storage.objects is refused by Supabase Storage).
  select coalesce(pg_catalog.jsonb_agg(o.obj order by o.obj ->> 'bucket', o.obj ->> 'key'), '[]'::jsonb)
  into v_objects
  from (
    select pg_catalog.jsonb_build_object('bucket', app.upload_bucket(u.kind), 'key', u.storage_key) as obj
    from app.uploads u
    where u.owner_user_id = p_uid and u.deleted_at is null
    union
    select pg_catalog.jsonb_build_object('bucket', 'exports', 'key', d.export_key)
    from app.data_requests d
    where d.user_id = p_uid and d.kind = 'export' and d.export_key is not null
  ) as o;

  -- Uploads: the row stays for later references (doc checks, M3) but names no one.
  update app.uploads u
     set deleted_at = coalesce(u.deleted_at, v_now), owner_user_id = null, wa_contact_id = null
   where u.owner_user_id = p_uid;
  get diagnostics n_uploads = row_count;
  -- Exports: the files go (above); an export still being prepared is closed, so the builder
  -- never packs an erased account.
  update app.data_requests d
     set export_key = null,
         completed_at = coalesce(d.completed_at, v_now),
         link_expires_at = least(coalesce(d.link_expires_at, v_now), v_now)
   where d.user_id = p_uid and d.kind = 'export'
     and (d.export_key is not null or d.completed_at is null or d.link_expires_at > v_now);

  -- Shares and relays end now; then every consent is withdrawn, which (T40, T45b triggers)
  -- queues a deletion request to each partner the consent named.
  update app.contact_shares s
     set ends_at = greatest(s.starts_at, v_now), ended_reason = 'erased'
   where s.buyer_user_id = p_uid
     and s.ended_reason is null
     and (s.ends_at is null or s.ends_at > v_now);
  get diagnostics n_shares_ended = row_count;
  update app.relay_sessions r
     set closed_at = v_now, closed_reason = 'buyer_ended', deal_active = false
   where r.buyer_user_id = p_uid and r.closed_at is null;
  get diagnostics n_relays_closed = row_count;
  insert into app.consent_withdrawals (consent_id, withdrawn_at, channel)
  select c.id, v_now, p_channel
  from app.consents c
  where c.principal_user_id = p_uid
    and not exists (select 1 from app.consent_withdrawals w where w.consent_id = c.id)
  on conflict (consent_id) do nothing;
  get diagnostics n_withdrawals = row_count;

  -- Account data.
  delete from app.follows f where f.user_id = p_uid;
  get diagnostics n_follows = row_count;
  delete from app.alert_subscriptions s where s.user_id = p_uid;
  get diagnostics n_alerts = row_count;
  delete from app.saved_searches s where s.user_id = p_uid;
  get diagnostics n_searches = row_count;
  delete from app.devices d where d.user_id = p_uid;
  get diagnostics n_devices = row_count;
  delete from app.user_roles r where r.user_id = p_uid;
  get diagnostics n_roles = row_count;

  -- Family: the buyer's own circle goes with its invites and notes; in other circles the
  -- buyer leaves and their notes are removed.
  delete from app.shortlist_notes n
   where n.author_user_id = p_uid
     and not exists (select 1 from app.family_circles fc where fc.id = n.circle_id and fc.owner_user_id = p_uid);
  get diagnostics n_notes = row_count;
  update app.family_members m
     set status = case when m.status in ('invited', 'joined') then 'left' else m.status end,
         member_user_id = null
   where m.member_user_id = p_uid;
  get diagnostics n_memberships = row_count;
  delete from app.family_circles fc where fc.owner_user_id = p_uid;
  get diagnostics n_circles = row_count;

  update app.project_requests r set user_id = null where r.user_id = p_uid;
  get diagnostics n_project_requests = row_count;

  -- WhatsApp: the contact (the number) goes, with its messages and session (FK cascade).
  -- Queued sends are stopped and every send record keeps only that it happened.
  select coalesce(pg_catalog.array_agg(w.id), '{}'::uuid[]) into v_contacts
  from pii.wa_contacts w where w.user_id = p_uid;
  update comms.outbox o
     set status = case when o.status in ('queued', 'sending') then 'suppressed' else o.status end,
         last_error = case when o.status in ('queued', 'sending') then 'account erased' else o.last_error end,
         payload = '{"erased": true}'::jsonb
   where (o.user_id = p_uid or o.contact_id = any (v_contacts))
     and o.payload is distinct from '{"erased": true}'::jsonb;
  get diagnostics n_outbox = row_count;
  update app.family_members m set wa_contact_id = null where m.wa_contact_id = any (v_contacts);
  delete from pii.wa_contacts w where w.id = any (v_contacts);
  get diagnostics n_wa_contacts = row_count;

  delete from app.profiles p where p.id = p_uid;
  get diagnostics n_profile = row_count;

  return pg_catalog.jsonb_build_object(
    'storage_objects', v_objects,
    'removed', pg_catalog.jsonb_build_object(
      'profile', n_profile,
      'follows', n_follows,
      'alert_subscriptions', n_alerts,
      'saved_searches', n_searches,
      'devices', n_devices,
      'roles', n_roles,
      'uploads', n_uploads,
      'family_circles', n_circles,
      'family_memberships', n_memberships,
      'shortlist_notes', n_notes,
      'project_requests_unlinked', n_project_requests,
      'whatsapp_contacts', n_wa_contacts,
      'outbox_cleared', n_outbox
    ),
    'ended', pg_catalog.jsonb_build_object(
      'shares', n_shares_ended,
      'relays', n_relays_closed,
      'consents_withdrawn', n_withdrawals
    ),
    'kept', pg_catalog.jsonb_build_object(
      'consents', (select pg_catalog.count(*)::integer from app.consents c where c.principal_user_id = p_uid),
      'consent_withdrawals', (
        select pg_catalog.count(*)::integer from app.consent_withdrawals w
        join app.consents c on c.id = w.consent_id where c.principal_user_id = p_uid
      ),
      'contact_shares', (select pg_catalog.count(*)::integer from app.contact_shares s where s.buyer_user_id = p_uid),
      'relay_sessions', (select pg_catalog.count(*)::integer from app.relay_sessions r where r.buyer_user_id = p_uid),
      'partner_deletion_requests', (
        select pg_catalog.count(*)::integer from app.partner_deletion_requests d where d.buyer_user_id = p_uid
      )
    )
  );
end
$$;
comment on function app.dpdp_erase_user(uuid, text) is 'Erases one user''s account data (profile, follows, alerts, searches, devices, roles, uploads, family, WhatsApp contact; outbox content cleared), ends live shares (erased) and open relays, withdraws every consent. Keeps the consent proof. Returns counts and the files to remove. Re-runnable.';

-- ---------------------------------------------------------------------------
-- Service: run, complete, and list unfinished erasures.
-- ---------------------------------------------------------------------------
create function app.dpdp_erasure_json(p_rec app.dpdp_erasures)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'schema', 'plinth.account_erasure/1',
    'request_id', p_rec.request_id,
    'status', case when p_rec.completed_at is not null then 'erased' else 'erasing' end,
    'erased_at', core.fmt_timestamp(p_rec.erased_at),
    'completed_at', core.fmt_timestamp(p_rec.completed_at),
    'hold_until', core.fmt_timestamp(p_rec.hold_until),
    'status_line', case
      when p_rec.completed_at is not null
        then 'Your account was erased on ' || ops.fmt_date(ops.ist_date(p_rec.completed_at)) || '.'
      else 'We are erasing your account.'
    end,
    'kept_lines', coalesce(
      (select pg_catalog.jsonb_agg(h.value ->> 'line') from pg_catalog.jsonb_array_elements(app.dpdp_legal_holds()) as h(value)),
      '[]'::jsonb
    )
  )
$$;
comment on function app.dpdp_erasure_json(app.dpdp_erasures) is 'plinth.account_erasure/1: the erasure record as delete-account returns it (status erasing | erased, dates, what is kept and why).';

create function api.dpdp_erasure_run(p_request_id uuid, p_channel text default 'app')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req app.data_requests%rowtype;
  v_rec app.dpdp_erasures%rowtype;
  v_result jsonb;
  v_now timestamptz := ops.now();
begin
  if p_channel is null or p_channel not in ('web', 'app') then
    perform ops.raise_api_error('invalid_input', 'p_channel is web or app.');
  end if;
  select d.* into v_req from app.data_requests d where d.id = p_request_id and d.kind = 'erasure' for update;
  if not found then
    perform ops.raise_api_error('not_found', 'There is no erasure request with this id.');
  end if;
  select e.* into v_rec from app.dpdp_erasures e where e.request_id = v_req.id for update;

  if v_req.completed_at is not null or (found and v_rec.completed_at is not null) then
    return pg_catalog.jsonb_build_object(
      'request_id', v_req.id, 'user_id', null, 'status', 'erased',
      'storage_objects', '[]'::jsonb, 'record', app.dpdp_erasure_json(v_rec)
    );
  end if;
  if v_req.user_id is null then
    perform ops.raise_api_error('conflict', 'This erasure request no longer names an account.');
  end if;

  v_result := app.dpdp_erase_user(v_req.user_id, p_channel);

  if v_rec.request_id is null then
    insert into app.dpdp_erasures (request_id, subject_id, erased_at, last_run_at, runs, summary, storage_objects, hold_until)
    values (
      v_req.id, v_req.user_id, v_now, v_now, 1,
      pg_catalog.jsonb_build_object(
        'removed', v_result -> 'removed', 'ended', v_result -> 'ended', 'kept', v_result -> 'kept',
        'holds', app.dpdp_legal_holds()
      ),
      v_result -> 'storage_objects',
      v_now + interval '3 years'
    )
    returning * into v_rec;
  else
    -- A retry: keep the first counts, add what this run found, keep every file still owed.
    update app.dpdp_erasures e
       set last_run_at = v_now,
           runs = e.runs + 1,
           summary = e.summary || pg_catalog.jsonb_build_object('last_run', pg_catalog.jsonb_build_object(
             'removed', v_result -> 'removed', 'ended', v_result -> 'ended')),
           storage_objects = (
             select coalesce(pg_catalog.jsonb_agg(distinct x.value), '[]'::jsonb)
             from pg_catalog.jsonb_array_elements(e.storage_objects || (v_result -> 'storage_objects')) as x(value)
           )
     where e.request_id = v_req.id
    returning * into v_rec;
  end if;

  perform ops.audit(
    'dpdp_erasure_run', 'app.data_requests', v_req.id::text, null,
    pg_catalog.jsonb_build_object('removed', v_result -> 'removed', 'ended', v_result -> 'ended',
      'kept', v_result -> 'kept', 'files', pg_catalog.jsonb_array_length(v_rec.storage_objects)),
    'DPDP erasure: account data removed; consent proof kept under legal hold'
  );

  return pg_catalog.jsonb_build_object(
    'request_id', v_req.id,
    'user_id', v_req.user_id,
    'status', 'erasing',
    'storage_objects', v_rec.storage_objects,
    'record', app.dpdp_erasure_json(v_rec)
  );
end
$$;
comment on function api.dpdp_erasure_run(uuid, text) is 'Service-only. Erases the account data of this erasure request''s own user (app.dpdp_erase_user) and writes app.dpdp_erasures. Returns the user id (for the sign-in soft delete) and the files to remove. Re-runnable; a completed request returns its record. Errors: invalid_input, not_found, conflict.';

create function api.dpdp_erasure_complete(
  p_request_id uuid,
  p_storage_removed boolean,
  p_identity_erased boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rec app.dpdp_erasures%rowtype;
  v_now timestamptz := ops.now();
begin
  select e.* into v_rec from app.dpdp_erasures e where e.request_id = p_request_id for update;
  if not found then
    perform ops.raise_api_error('conflict', 'Run the erasure before completing it.');
  end if;
  if v_rec.completed_at is not null then
    return app.dpdp_erasure_json(v_rec);
  end if;

  update app.dpdp_erasures e
     set storage_removed_at = case when coalesce(p_storage_removed, false) then coalesce(e.storage_removed_at, v_now) else e.storage_removed_at end,
         storage_objects = case when coalesce(p_storage_removed, false) then '[]'::jsonb else e.storage_objects end,
         identity_erased_at = case when coalesce(p_identity_erased, false) then coalesce(e.identity_erased_at, v_now) else e.identity_erased_at end
   where e.request_id = v_rec.request_id
  returning * into v_rec;

  if v_rec.storage_removed_at is not null and v_rec.identity_erased_at is not null then
    update app.dpdp_erasures e set completed_at = v_now where e.request_id = v_rec.request_id
    returning * into v_rec;
    update app.data_requests d set completed_at = v_now where d.id = v_rec.request_id and d.completed_at is null;
    -- "user_id is kept null after an erasure completes" (DATA_MODEL §5): every DPDP request row
    -- of the erased account stops naming it.
    update app.data_requests d set user_id = null where d.user_id = v_rec.subject_id;
  end if;

  perform ops.audit(
    'dpdp_erasure_complete', 'app.data_requests', v_rec.request_id::text, null,
    pg_catalog.jsonb_build_object(
      'storage_removed', v_rec.storage_removed_at is not null,
      'identity_erased', v_rec.identity_erased_at is not null,
      'completed', v_rec.completed_at is not null
    ),
    'DPDP erasure: files and sign-in steps recorded'
  );
  return app.dpdp_erasure_json(v_rec);
end
$$;
comment on function api.dpdp_erasure_complete(uuid, boolean, boolean) is 'Service-only. Records that the files were removed and the sign-in soft-deleted; when both are done, completes the request and nulls user_id on the account''s DPDP requests. Returns plinth.account_erasure/1. Errors: conflict.';

create function api.dpdp_erasure_pending(p_limit integer default 10)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 50 then
    perform ops.raise_api_error('invalid_input', 'p_limit must be between 1 and 50.');
  end if;
  -- Older than 15 minutes, so the sweep never races a delete-account call still in flight.
  return coalesce((
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('request_id', x.id) order by x.requested_at, x.id)
    from (
      select d.id, d.requested_at
      from app.data_requests d
      where d.kind = 'erasure' and d.completed_at is null
        and (d.user_id is not null or exists (select 1 from app.dpdp_erasures e where e.request_id = d.id))
        and d.requested_at <= ops.now() - interval '15 minutes'
      order by d.requested_at, d.id
      limit p_limit
    ) as x
  ), '[]'::jsonb);
end
$$;
comment on function api.dpdp_erasure_pending(integer) is 'Service-only. Erasure requests not yet completed and older than 15 minutes, for retention-sweep to finish.';

-- ---------------------------------------------------------------------------
-- Grants: service_role only, explicit per function.
-- ---------------------------------------------------------------------------
revoke all on function api.dpdp_erasure_run(uuid, text) from public, anon, authenticated;
revoke all on function api.dpdp_erasure_complete(uuid, boolean, boolean) from public, anon, authenticated;
revoke all on function api.dpdp_erasure_pending(integer) from public, anon, authenticated;

grant execute on function api.dpdp_erasure_run(uuid, text) to service_role;
grant execute on function api.dpdp_erasure_complete(uuid, boolean, boolean) to service_role;
grant execute on function api.dpdp_erasure_pending(integer) to service_role;

-- Lockdown sweep for `app` (see 20261110000100).
revoke all on all tables in schema app from public, anon, authenticated;
revoke all on all sequences in schema app from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;
