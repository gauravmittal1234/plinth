-- T53 · DPDP 2/4: "Download my data" (export-data).
-- Sources: DESIGN §5b Download my data ("one ZIP with a readable PDF and a JSON file: follows,
-- alerts, saved cost sheets, questions to Ask Plinth, consent history and who had your number.
-- Ready within 24 hours; the link works for 7 days and opens only after your sign-in code");
-- BUILD_PLAN §12.7, §13; API_CONTRACTS §3.5 (export-data: buyer JWT + fresh OTP).
--
-- The flow (the request row is the record, T45b api.data_export_request):
--   1. pg_cron → export-data/build (dispatch secret) → api.dpdp_export_pending lists open
--      requests; api.dpdp_export_payload returns plinth.data_export/1 for ONE request's own user
--      (the service role names a request, never a user, and only an open export request the
--      buyer created under their own JWT has a payload); the edge renders the ZIP, stores it in
--      the private `exports` bucket at app.dpdp_export_key(request), and
--      api.dpdp_export_complete records it: completed_at, export_key, link_expires_at = +7 days,
--      and queues the export_ready notification (comms.outbox).
--   2. The buyer opens the link → export-data (their JWT) → api.dpdp_export_link checks that the
--      request is theirs and ready and that the JWT carries a sign-in code from the last
--      10 minutes (amr), then the edge mints a 5-minute signed URL. Every outcome is audited.
--   3. retention-sweep removes the file once the 7 days are over (20261125000400).
--
-- Every function is SECURITY DEFINER with search_path = ''. api.dpdp_export_link is granted to
-- authenticated only (app.privacy_caller: never anon, never the service role); the others to
-- service_role only. Errors (API_CONTRACTS §1): auth_required, forbidden, not_found,
-- conflict, invalid_input.

-- ---------------------------------------------------------------------------
-- Helpers (app; never executable by anon or authenticated).
-- ---------------------------------------------------------------------------
create function app.dpdp_export_key(p_request_id uuid)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select p_request_id::text || '/plinth-my-data.zip'
$$;
comment on function app.dpdp_export_key(uuid) is 'The one object key an export request may point at in the exports bucket: <request_id>/plinth-my-data.zip (export-data uses the same rule).';

-- A sign-in code is fresh when the JWT's amr carries an OTP sign-in from the last p_max_age_s
-- seconds. Wall time (now()), not the business clock: this is a security window, like a
-- webhook timestamp tolerance (_shared/core/clock.ts).
create function app.dpdp_fresh_sign_in(p_max_age_s integer default 600)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select pg_catalog.max((a.value ->> 'timestamp')::numeric)
      from pg_catalog.jsonb_array_elements(
        case when pg_catalog.jsonb_typeof(auth.jwt() -> 'amr') = 'array' then auth.jwt() -> 'amr' else '[]'::jsonb end
      ) as a(value)
      where pg_catalog.jsonb_typeof(a.value) = 'object'
        and a.value ->> 'method' in ('otp', 'sms/signup')
        and (a.value ->> 'timestamp') ~ '^[0-9]{1,12}(\.[0-9]+)?$'
    ) between extract(epoch from pg_catalog.now()) - p_max_age_s
          and extract(epoch from pg_catalog.now()) + 60,
    false
  )
$$;
comment on function app.dpdp_fresh_sign_in(integer) is 'True when the caller''s JWT amr holds an OTP sign-in (otp, sms/signup) at most p_max_age_s seconds old (wall clock, 60 s skew). Gates the export download.';

-- ---------------------------------------------------------------------------
-- plinth.data_export/1: everything Plinth holds about one buyer, read from their rows.
-- ---------------------------------------------------------------------------
create function app.dpdp_export_json(p_uid uuid, p_request_id uuid)
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
comment on function app.dpdp_export_json(uuid, uuid) is 'plinth.data_export/1 for one buyer: account, follows, alerts, saved searches, saved cost sheets, Ask questions, consent history, who has (and had) the number, partner deletion requests, family, requests, WhatsApp. Read from the buyer''s own rows only; relatives appear without names.';

-- ---------------------------------------------------------------------------
-- Service: the builder (export-data/build, dispatch secret).
-- ---------------------------------------------------------------------------
create function api.dpdp_export_pending(p_limit integer default 10)
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
  return coalesce((
    select pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'request_id', x.id,
        'requested_at', core.fmt_timestamp(x.requested_at),
        'due_at', core.fmt_timestamp(x.due_at)
      )
      order by x.requested_at, x.id
    )
    from (
      select d.id, d.requested_at, d.due_at
      from app.data_requests d
      where d.kind = 'export' and d.completed_at is null and d.user_id is not null
      order by d.requested_at, d.id
      limit p_limit
    ) as x
  ), '[]'::jsonb);
end
$$;
comment on function api.dpdp_export_pending(integer) is 'Service-only. Open export requests, oldest first (ids and times only).';

create function api.dpdp_export_payload(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req app.data_requests%rowtype;
  v_payload jsonb;
begin
  select d.* into v_req
  from app.data_requests d
  where d.id = p_request_id and d.kind = 'export' and d.completed_at is null and d.user_id is not null;
  if not found then
    perform ops.raise_api_error('not_found', 'There is no open export request with this id.');
  end if;

  v_payload := app.dpdp_export_json(v_req.user_id, v_req.id);
  perform ops.audit(
    'dpdp_export_read', 'app.data_requests', v_req.id::text, null,
    pg_catalog.jsonb_build_object(
      'follows', pg_catalog.jsonb_array_length(v_payload -> 'follows'),
      'consents', pg_catalog.jsonb_array_length(v_payload -> 'consent_history' -> 'items'),
      'number_shares', pg_catalog.jsonb_array_length(v_payload -> 'number_shares')
    ),
    'DPDP export: payload read for the request''s own user'
  );
  return v_payload;
end
$$;
comment on function api.dpdp_export_payload(uuid) is 'Service-only. plinth.data_export/1 for the user who made this open export request, and no one else. Audited (counts only). Errors: not_found.';

create function api.dpdp_export_complete(
  p_request_id uuid,
  p_export_key text,
  p_bytes integer,
  p_sha256 text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req app.data_requests%rowtype;
  v_now timestamptz := ops.now();
begin
  select d.* into v_req from app.data_requests d where d.id = p_request_id and d.kind = 'export' for update;
  if not found then
    perform ops.raise_api_error('not_found', 'There is no export request with this id.');
  end if;
  if p_export_key is distinct from app.dpdp_export_key(v_req.id) then
    perform ops.raise_api_error('invalid_input', 'An export is stored only under its own request''s key.');
  end if;
  if p_bytes is null or p_bytes < 1 or p_sha256 is null or p_sha256 !~ '^[0-9a-f]{64}$' then
    perform ops.raise_api_error('invalid_input', 'Give the stored file''s size and SHA-256.');
  end if;

  if v_req.completed_at is null then
    if v_req.user_id is null then
      perform ops.raise_api_error('conflict', 'This account was erased; there is nothing to send.');
    end if;
    update app.data_requests d
       set completed_at = v_now, export_key = p_export_key, link_expires_at = v_now + interval '7 days'
     where d.id = v_req.id
    returning * into v_req;

    insert into comms.outbox (dedupe_key, user_id, channel, template_code, payload, basis)
    values (
      'export_ready:push:' || v_req.id::text, v_req.user_id, 'push', 'export_ready',
      pg_catalog.jsonb_build_object(
        'deep_link', '/privacy',
        'expiry_date', ops.fmt_date(ops.ist_date(v_req.link_expires_at)),
        'request_id', v_req.id
      ),
      'data_request:' || v_req.id::text
    )
    on conflict (dedupe_key) do nothing;
    insert into comms.outbox (dedupe_key, user_id, contact_id, channel, template_code, payload, basis)
    select 'export_ready:wa:' || v_req.id::text, v_req.user_id, w.id, 'whatsapp_template', 'export_ready',
           pg_catalog.jsonb_build_object(
             'deep_link', '/privacy',
             'expiry_date', ops.fmt_date(ops.ist_date(v_req.link_expires_at)),
             'request_id', v_req.id
           ),
           'data_request:' || v_req.id::text
    from pii.wa_contacts w
    where w.user_id = v_req.user_id and w.utility_opt_in and w.stopped_at is null
    order by w.first_seen
    limit 1
    on conflict (dedupe_key) do nothing;

    perform ops.audit(
      'dpdp_export_stored', 'app.data_requests', v_req.id::text, null,
      pg_catalog.jsonb_build_object('bytes', p_bytes, 'sha256', p_sha256,
        'link_expires_at', core.fmt_timestamp(v_req.link_expires_at)),
      'DPDP export: ZIP stored in the private exports bucket'
    );
  end if;

  -- export_key is the key this request now records: when it is not the file just stored (the
  -- request was closed meanwhile, e.g. by an erasure), the builder removes that file.
  return pg_catalog.jsonb_build_object(
    'request_id', v_req.id,
    'status', case when v_req.link_expires_at > v_now and v_req.export_key is not null then 'ready' else 'expired' end,
    'export_key', v_req.export_key,
    'completed_at', core.fmt_timestamp(v_req.completed_at),
    'link_expires_at', core.fmt_timestamp(v_req.link_expires_at)
  );
end
$$;
comment on function api.dpdp_export_complete(uuid, text, integer, text) is 'Service-only. Records a stored export: completed_at, export_key (must be app.dpdp_export_key), link_expires_at = +7 days; queues export_ready (push, and WhatsApp when opted in). A replay returns the first record; export_key tells the builder whether its file is the one on record. Errors: not_found, invalid_input, conflict.';

-- ---------------------------------------------------------------------------
-- Buyer: open the download (export-data, buyer JWT + a fresh sign-in code).
-- ---------------------------------------------------------------------------
create function api.dpdp_export_link(p_request_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := app.privacy_caller();
  v_req app.data_requests%rowtype;
  v_status text;
  v_line text;
begin
  if p_request_id is null then
    perform ops.raise_api_error('invalid_input', 'Say which download to open.');
  end if;
  -- Only the caller's own request. Another person's id reads exactly like an unknown one.
  select d.* into v_req
  from app.data_requests d
  where d.id = p_request_id and d.user_id = v_uid and d.kind = 'export';
  if not found then
    perform ops.raise_api_error('not_found', 'We have no download with this id on your account.');
  end if;

  if v_req.completed_at is null then
    v_status := 'preparing';
    v_line := 'Ready by ' || ops.fmt_date(ops.ist_date(v_req.due_at)) || ', ' || core.fmt_clock(v_req.due_at) || '.';
  elsif v_req.export_key is null or v_req.link_expires_at is null or v_req.link_expires_at <= ops.now() then
    v_status := 'expired';
    v_line := 'This download link has expired. Request a new download.';
  elsif not app.dpdp_fresh_sign_in() then
    v_status := 'sign_in_required';
    v_line := 'Enter a fresh sign-in code to open your download.';
  else
    v_status := 'ready';
    v_line := 'The link works until ' || ops.fmt_date(ops.ist_date(v_req.link_expires_at)) || '.';
  end if;

  perform ops.audit(
    'dpdp_export_link', 'app.data_requests', v_req.id::text, null,
    pg_catalog.jsonb_build_object('status', v_status),
    'DPDP export: the buyer asked to open the download'
  );

  return pg_catalog.jsonb_build_object(
    'request_id', v_req.id,
    'status', v_status,
    'line', v_line,
    'export_key', case when v_status = 'ready' then v_req.export_key end,
    'link_expires_at', case when v_status in ('ready', 'sign_in_required') then core.fmt_timestamp(v_req.link_expires_at) end
  );
end
$$;
comment on function api.dpdp_export_link(uuid) is 'The caller''s own export, if it may be opened now: status preparing | expired | sign_in_required | ready (export_key only when ready: the JWT must carry an OTP sign-in from the last 10 minutes). Every outcome is audited. Buyer JWT only. Errors: auth_required, forbidden, invalid_input, not_found.';

-- ---------------------------------------------------------------------------
-- Grants: explicit per function (never a schema-wide api sweep, which would drop other tasks'
-- grants). The builder is service-only; the download is the buyer's JWT only.
-- ---------------------------------------------------------------------------
revoke all on function api.dpdp_export_pending(integer) from public, anon, authenticated;
revoke all on function api.dpdp_export_payload(uuid) from public, anon, authenticated;
revoke all on function api.dpdp_export_complete(uuid, text, integer, text) from public, anon, authenticated;
revoke all on function api.dpdp_export_link(uuid) from public, anon, service_role;

grant execute on function api.dpdp_export_pending(integer) to service_role;
grant execute on function api.dpdp_export_payload(uuid) to service_role;
grant execute on function api.dpdp_export_complete(uuid, text, integer, text) to service_role;
grant execute on function api.dpdp_export_link(uuid) to authenticated;

-- Lockdown sweep for `app` (see 20261110000100).
revoke all on all functions in schema app from public, anon, authenticated;
