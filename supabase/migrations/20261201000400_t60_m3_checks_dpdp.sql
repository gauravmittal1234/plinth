-- T60 · M3 checks 4/4: "Download my data" and account erasure cover the M3 tables.
-- Sources: DESIGN §5b Download my data ("follows, alerts, saved cost sheets, questions to Ask
-- Plinth, consent history, who had your number"); BUILD_PLAN §13 (export, erasure with legal-hold
-- exceptions, retention); WORK_BREAKDOWN T60 ("extend T53's export (saved cost-sheet reads and
-- saved checks) and erasure (every new table) in this task's own migration, re-creating T53's
-- functions; never edit a merged migration").
--
-- Re-created here (CREATE OR REPLACE keeps their owner and grants; both stay app-internal):
--   * app.dpdp_export_json: plinth.data_export/1 gains saved_checks (each saved check with its
--     rows and verdicts), saved_cost_sheet_reads, bookings, payee_checks (account ending only,
--     never the hash) and receipts. Every T53 key is unchanged. A check is saved when the buyer
--     saved it (doc_checks.saved_at) or saved its file (uploads.saved, T53).
--   * app.dpdp_erase_user: also removes the user's checks (their claims, verdicts, cost-sheet
--     reads, payee checks and review tasks with them), bookings, payee checks and receipts, and
--     the uploads and checks that came from the user's WhatsApp number. Nothing kept names an
--     account digit: app.payee_checks and app.extracted_claims rows are deleted and neither table
--     has an audit row image. Every T53 step, count and legal hold is unchanged.
-- ops.ai_generations holds no user id (PII is stripped before the call and the output redacted),
-- so an erasure has nothing there to remove; its output is cleared after 12 months (2/4).

-- ---------------------------------------------------------------------------
-- plinth.data_export/1 (T53's function, extended with the M3 tables).
-- ---------------------------------------------------------------------------
create or replace function app.dpdp_export_json(p_uid uuid, p_request_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'schema', 'plinth.data_export/1',
    'request_id', p_request_id,
    'generated_at', core.fmt_timestamp(ops.now()),
    'account', (
      select pg_catalog.jsonb_build_object(
        'first_name', p.first_name,
        'phone_masked', p.phone_masked,
        'joined_on', pg_catalog.to_char(ops.ist_date(p.created_at), 'YYYY-MM-DD'),
        'adult_attested_on', pg_catalog.to_char(ops.ist_date(p.adult_attested_at), 'YYYY-MM-DD'),
        'roles', coalesce(
          (select pg_catalog.jsonb_agg(r.role order by r.role) from app.user_roles r where r.user_id = p_uid),
          '[]'::jsonb
        )
      )
      from app.profiles p
      where p.id = p_uid
    ),
    'follows', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'project', pr.name,
          'phase', ph.name,
          'slug', ph.slug,
          'follow_type', f.follow_type,
          'source', f.source,
          'followed_on', pg_catalog.to_char(ops.ist_date(f.followed_at), 'YYYY-MM-DD')
        )
        order by f.followed_at, ph.slug
      )
      from app.follows f
      join core.phases ph on ph.id = f.phase_id
      join core.projects pr on pr.id = ph.project_id
      where f.user_id = p_uid
    ), '[]'::jsonb),
    'alerts', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'channel', s.channel,
          'kind', s.kind,
          'cadence', s.cadence,
          'enabled', s.enabled,
          'quiet_from', pg_catalog.to_char(s.quiet_from, 'HH24:MI'),
          'quiet_to', pg_catalog.to_char(s.quiet_to, 'HH24:MI')
        )
        order by s.channel, s.kind
      )
      from app.alert_subscriptions s
      where s.user_id = p_uid
    ), '[]'::jsonb),
    'saved_searches', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'label', s.label,
          'filters', s.filters,
          'in_digest', s.in_digest,
          'saved_on', pg_catalog.to_char(ops.ist_date(s.created_at), 'YYYY-MM-DD')
        )
        order by s.created_at, s.id
      )
      from app.saved_searches s
      where s.user_id = p_uid
    ), '[]'::jsonb),
    'saved_cost_sheets', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'upload_id', u.id,
          'uploaded_on', pg_catalog.to_char(ops.ist_date(u.created_at), 'YYYY-MM-DD'),
          'mime', u.mime,
          'pages', u.pages
        )
        order by u.created_at, u.id
      )
      from app.uploads u
      where u.owner_user_id = p_uid and u.kind = 'cost_sheet' and u.saved and u.deleted_at is null
    ), '[]'::jsonb),
    -- M3 (T60): the arithmetic of each saved cost-sheet check.
    'saved_cost_sheet_reads', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'check_id', r.check_id,
          'upload_id', d.upload_id,
          'project', pr.name,
          'phase', ph.name,
          'slug', ph.slug,
          'read_on', pg_catalog.to_char(ops.ist_date(r.created_at), 'YYYY-MM-DD'),
          'all_in_inr', r.all_in_inr,
          'per_sqft_carpet_inr', r.per_sqft_carpet_inr,
          'loading_pct', r.loading_pct,
          'negotiable_inr', r.negotiable_inr,
          'rules_version', r.rules_version,
          'lines', r.lines
        )
        order by r.created_at, r.check_id
      )
      from app.cost_sheet_reads r
      join app.doc_checks d on d.id = r.check_id
      left join core.phases ph on ph.id = d.phase_id
      left join core.projects pr on pr.id = ph.project_id
      where (d.user_id = p_uid or d.wa_contact_id in (select w.id from pii.wa_contacts w where w.user_id = p_uid))
        and (d.saved_at is not null
             or exists (select 1 from app.uploads u where u.id = d.upload_id and u.saved and u.deleted_at is null))
    ), '[]'::jsonb),
    -- M3 (T60): each saved check, with what it read and what the rules decided.
    'saved_checks', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'check_id', d.id,
          'kind', d.kind,
          'channel', d.channel,
          'status', d.status,
          'project', pr.name,
          'phase', ph.name,
          'slug', ph.slug,
          'checked_on', pg_catalog.to_char(ops.ist_date(d.created_at), 'YYYY-MM-DD'),
          'confirmed_on', pg_catalog.to_char(ops.ist_date(d.confirmed_at), 'YYYY-MM-DD'),
          'saved_on', pg_catalog.to_char(ops.ist_date(d.saved_at), 'YYYY-MM-DD'),
          'rules_version', d.rules_version,
          'summary', d.summary,
          'rows', coalesce((
            select pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'seq', x.seq,
                'claim_type', x.claim_type,
                'says', x.raw_text,
                'verdict', v.verdict,
                'records', v.records_text,
                'how_checked', v.how_checked,
                'broker_question', v.broker_question,
                'rule', v.rule_code
              )
              order by x.seq
            )
            from app.extracted_claims x
            left join app.claim_verdicts v on v.claim_id = x.id
            where x.check_id = d.id
          ), '[]'::jsonb)
        )
        order by d.created_at, d.id
      )
      from app.doc_checks d
      left join core.phases ph on ph.id = d.phase_id
      left join core.projects pr on pr.id = ph.project_id
      where (d.user_id = p_uid or d.wa_contact_id in (select w.id from pii.wa_contacts w where w.user_id = p_uid))
        and (d.saved_at is not null
             or exists (select 1 from app.uploads u where u.id = d.upload_id and u.saved and u.deleted_at is null))
    ), '[]'::jsonb),
    -- M3 (T60): bookings, payee checks (the account's last 4 only) and recorded payments.
    'bookings', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'project', pr.name,
          'phase', ph.name,
          'slug', ph.slug,
          'tower', t.code,
          'unit_no', b.unit_no,
          'price_inr', b.price_inr,
          'booked_on', pg_catalog.to_char(b.booked_on, 'YYYY-MM-DD'),
          'agreement_registered_on', pg_catalog.to_char(b.agreement_registered_on, 'YYYY-MM-DD'),
          'paid_to_date_inr', b.paid_to_date_inr,
          'plan', pp.name
        )
        order by b.created_at, b.id
      )
      from app.bookings b
      join core.phases ph on ph.id = b.phase_id
      join core.projects pr on pr.id = ph.project_id
      left join core.towers t on t.id = b.tower_id
      left join ws.payment_plans pp on pp.id = b.plan_id
      where b.user_id = p_uid
    ), '[]'::jsonb),
    'payee_checks', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'project', pr.name,
          'phase', ph.name,
          'slug', ph.slug,
          'payee_name', c.payee_name,
          'account_ending', c.account_last4,
          'ifsc', c.ifsc,
          'amount_inr', c.amount_inr,
          'stage', c.stage,
          'method', c.method,
          'result', c.result,
          'checked_on', pg_catalog.to_char(ops.ist_date(c.created_at), 'YYYY-MM-DD')
        )
        order by c.created_at, c.id
      )
      from app.payee_checks c
      join core.phases ph on ph.id = c.phase_id
      join core.projects pr on pr.id = ph.project_id
      where c.user_id = p_uid or c.wa_contact_id in (select w.id from pii.wa_contacts w where w.user_id = p_uid)
    ), '[]'::jsonb),
    'receipts', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'project', pr.name,
          'phase', ph.name,
          'slug', ph.slug,
          'amount_inr', r.amount_inr,
          'paid_on', pg_catalog.to_char(r.paid_on, 'YYYY-MM-DD'),
          'utr_ending', r.utr_last4,
          'checks', r.checks,
          'added_on', pg_catalog.to_char(ops.ist_date(r.created_at), 'YYYY-MM-DD')
        )
        order by r.paid_on, r.created_at, r.id
      )
      from app.receipts r
      join core.phases ph on ph.id = r.phase_id
      join core.projects pr on pr.id = ph.project_id
      where r.user_id = p_uid
    ), '[]'::jsonb),
    -- Ask Plinth threads (app.ask_messages) arrive with M5; until then there is nothing to export
    -- (PR Handoff: M5 adds them here).
    'ask_questions', '[]'::jsonb,
    'consent_history', app.consent_history_json(p_uid),
    'who_has_my_number', app.who_has_my_number_json(p_uid),
    'number_shares', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'ref', c.ref,
          'party', app.consent_party(c),
          'detail', app.consent_detail(c),
          'from', pg_catalog.to_char(ops.ist_date(s.starts_at), 'YYYY-MM-DD'),
          'until', pg_catalog.to_char(ops.ist_date(s.ends_at), 'YYYY-MM-DD'),
          'ended_reason', s.ended_reason,
          'live', s.ended_reason is null and (s.ends_at is null or s.ends_at > ops.now())
        )
        order by s.starts_at, c.ref
      )
      from app.contact_shares s
      join app.consents c on c.id = s.consent_id and c.principal_user_id = p_uid
      where s.buyer_user_id = p_uid and s.number_shared
    ), '[]'::jsonb),
    'partner_deletion_requests', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'ref', c.ref,
          'party', app.consent_party(c),
          'status', d.status,
          'queued_on', pg_catalog.to_char(ops.ist_date(d.queued_at), 'YYYY-MM-DD'),
          'sent_on', pg_catalog.to_char(ops.ist_date(d.sent_at), 'YYYY-MM-DD'),
          'confirmed_on', pg_catalog.to_char(ops.ist_date(d.confirmed_at), 'YYYY-MM-DD')
        )
        order by d.queued_at, c.ref
      )
      from app.partner_deletion_requests d
      join app.consents c on c.id = d.consent_id and c.principal_user_id = p_uid
      where d.buyer_user_id = p_uid
    ), '[]'::jsonb),
    'family', pg_catalog.jsonb_build_object(
      -- Members are listed without names: a relative's name is their data, not the owner's.
      'circle', (
        select pg_catalog.jsonb_build_object(
          'created_on', pg_catalog.to_char(ops.ist_date(fc.created_at), 'YYYY-MM-DD'),
          'members', coalesce((
            select pg_catalog.jsonb_agg(
              pg_catalog.jsonb_build_object(
                'status', m.status,
                'invited_on', pg_catalog.to_char(ops.ist_date(m.invited_at), 'YYYY-MM-DD'),
                'joined_on', pg_catalog.to_char(ops.ist_date(m.joined_at), 'YYYY-MM-DD'),
                'all_projects', m.scope_all,
                'project_count', pg_catalog.cardinality(m.scope_phase_ids),
                'can_add_notes', m.can_add_notes
              )
              order by m.invited_at, m.invite_code
            )
            from app.family_members m
            where m.circle_id = fc.id
          ), '[]'::jsonb)
        )
        from app.family_circles fc
        where fc.owner_user_id = p_uid
      ),
      'memberships', coalesce((
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'status', m.status,
            'joined_on', pg_catalog.to_char(ops.ist_date(m.joined_at), 'YYYY-MM-DD'),
            'all_projects', m.scope_all,
            'project_count', pg_catalog.cardinality(m.scope_phase_ids)
          )
          order by m.invited_at, m.invite_code
        )
        from app.family_members m
        where m.member_user_id = p_uid
      ), '[]'::jsonb),
      'notes', coalesce((
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'project', pr.name,
            'phase', ph.name,
            'body', n.body,
            'written_on', pg_catalog.to_char(ops.ist_date(n.created_at), 'YYYY-MM-DD')
          )
          order by n.created_at, n.id
        )
        from app.shortlist_notes n
        join core.phases ph on ph.id = n.phase_id
        join core.projects pr on pr.id = ph.project_id
        where n.author_user_id = p_uid
      ), '[]'::jsonb)
    ),
    'project_requests', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'ref', r.ref,
          'name', r.name_text,
          'rera', r.rera_text,
          'requested_on', pg_catalog.to_char(ops.ist_date(r.requested_at), 'YYYY-MM-DD'),
          'due_on', pg_catalog.to_char(r.due_on, 'YYYY-MM-DD'),
          'status', r.status,
          'reason', r.reason
        )
        order by r.requested_at, r.ref
      )
      from app.project_requests r
      where r.user_id = p_uid
    ), '[]'::jsonb),
    'data_requests', coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'kind', d.kind,
          'requested_at', core.fmt_timestamp(d.requested_at),
          'due_at', core.fmt_timestamp(d.due_at),
          'completed_at', core.fmt_timestamp(d.completed_at)
        )
        order by d.requested_at, d.id
      )
      from app.data_requests d
      where d.user_id = p_uid
    ), '[]'::jsonb),
    'whatsapp', (
      select pg_catalog.jsonb_build_object(
        'number_masked', app.mask_phone(w.wa_id_e164),
        'utility_opt_in', w.utility_opt_in,
        'first_seen_on', pg_catalog.to_char(ops.ist_date(w.first_seen), 'YYYY-MM-DD'),
        'stopped_on', pg_catalog.to_char(ops.ist_date(w.stopped_at), 'YYYY-MM-DD'),
        'message_count', (select pg_catalog.count(*)::integer from comms.wa_messages m where m.contact_id = w.id)
      )
      from pii.wa_contacts w
      where w.user_id = p_uid
      order by w.first_seen
      limit 1
    )
  )
$$;
comment on function app.dpdp_export_json(uuid, uuid) is 'plinth.data_export/1 for one buyer: account, follows, alerts, saved searches, saved cost sheets and their reads, saved checks (rows and verdicts), bookings, payee checks (account ending only), receipts, Ask questions, consent history, who has (and had) the number, partner deletion requests, family, requests, WhatsApp. Read from the buyer''s own rows only; relatives appear without names.';

-- ---------------------------------------------------------------------------
-- The erasure (T53's function, extended with the M3 tables). Re-runnable.
-- ---------------------------------------------------------------------------
create or replace function app.dpdp_erase_user(p_uid uuid, p_channel text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := ops.now();
  v_objects jsonb;
  v_contacts uuid[];
  v_checks uuid[];
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
  n_doc_checks integer;
  n_claims integer;
  n_verdicts integer;
  n_cost_reads integer;
  n_review_tasks integer;
  n_bookings integer;
  n_payee_checks integer;
  n_receipts integer;
begin
  -- The user's WhatsApp contacts: their uploads and checks go with the account (M3).
  select coalesce(pg_catalog.array_agg(w.id), '{}'::uuid[]) into v_contacts
  from pii.wa_contacts w where w.user_id = p_uid;

  -- Files to remove through the Storage API (the edge does it; direct DELETE on
  -- storage.objects is refused by Supabase Storage).
  select coalesce(pg_catalog.jsonb_agg(o.obj order by o.obj ->> 'bucket', o.obj ->> 'key'), '[]'::jsonb)
  into v_objects
  from (
    select pg_catalog.jsonb_build_object('bucket', app.upload_bucket(u.kind), 'key', u.storage_key) as obj
    from app.uploads u
    where (u.owner_user_id = p_uid or u.wa_contact_id = any (v_contacts)) and u.deleted_at is null
    union
    select pg_catalog.jsonb_build_object('bucket', 'exports', 'key', d.export_key)
    from app.data_requests d
    where d.user_id = p_uid and d.kind = 'export' and d.export_key is not null
  ) as o;

  -- Checks (M3): the user's own, those sent from their WhatsApp number, and those of their files.
  select coalesce(pg_catalog.array_agg(c.id), '{}'::uuid[]) into v_checks
  from app.doc_checks c
  where c.user_id = p_uid
     or c.wa_contact_id = any (v_contacts)
     or c.upload_id in (
       select u.id from app.uploads u where u.owner_user_id = p_uid or u.wa_contact_id = any (v_contacts)
     );

  delete from app.claim_verdicts v
   where v.claim_id in (select x.id from app.extracted_claims x where x.check_id = any (v_checks));
  get diagnostics n_verdicts = row_count;
  delete from app.extracted_claims x where x.check_id = any (v_checks);
  get diagnostics n_claims = row_count;
  delete from app.cost_sheet_reads r where r.check_id = any (v_checks);
  get diagnostics n_cost_reads = row_count;
  delete from app.payee_checks p
   where p.user_id = p_uid or p.wa_contact_id = any (v_contacts) or p.check_id = any (v_checks);
  get diagnostics n_payee_checks = row_count;
  delete from ops.review_tasks t
   where t.check_id = any (v_checks) or t.user_id = p_uid or t.wa_contact_id = any (v_contacts);
  get diagnostics n_review_tasks = row_count;
  delete from app.receipts r where r.user_id = p_uid;
  get diagnostics n_receipts = row_count;
  delete from app.bookings b where b.user_id = p_uid;
  get diagnostics n_bookings = row_count;
  delete from app.doc_checks c where c.id = any (v_checks);
  get diagnostics n_doc_checks = row_count;

  -- Uploads: the row stays for later references but names no one; the files go (above).
  update app.uploads u
     set deleted_at = coalesce(u.deleted_at, v_now), owner_user_id = null, wa_contact_id = null
   where u.owner_user_id = p_uid or u.wa_contact_id = any (v_contacts);
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
      'outbox_cleared', n_outbox,
      'doc_checks', n_doc_checks,
      'extracted_claims', n_claims,
      'claim_verdicts', n_verdicts,
      'cost_sheet_reads', n_cost_reads,
      'review_tasks', n_review_tasks,
      'bookings', n_bookings,
      'payee_checks', n_payee_checks,
      'receipts', n_receipts
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
comment on function app.dpdp_erase_user(uuid, text) is 'Erases one user''s account data (profile, follows, alerts, searches, devices, roles, uploads, family, WhatsApp contact; outbox content cleared; M3: checks with their claims, verdicts, cost-sheet reads and review tasks, bookings, payee checks, receipts, and the uploads and checks from the user''s WhatsApp number), ends live shares (erased) and open relays, withdraws every consent. Keeps the consent proof. Returns counts and the files to remove. Re-runnable.';

-- Both stay app-internal (T53: never executable by anon or authenticated).
revoke all on function app.dpdp_export_json(uuid, uuid) from public, anon, authenticated;
revoke all on function app.dpdp_erase_user(uuid, text) from public, anon, authenticated;
