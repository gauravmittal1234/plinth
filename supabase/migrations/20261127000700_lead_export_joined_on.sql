-- Lead · export PDF nits (T59 PR #89, "Minor"): "Joined <date>" printed the date the seed loaded.
-- plinth.data_export/1's account.joined_on came from app.profiles.created_at, which is when the
-- profile row was written: the account's sign-up for a real account, but the load time for a
-- seeded or migrated one. The account's real creation fact is Supabase Auth's own
-- auth.users.created_at; it is null when Auth has none, and the PDF then prints no "Joined" line
-- rather than a wrong date. (The other nit, the project name printed twice, is export-data's
-- render.ts.) Re-creates app.dpdp_export_json only (T53, 20261125000200); one line changes.

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
        -- The account's own creation, as Supabase Auth recorded it (auth.users.created_at), not
        -- when the profile row was written (a seeded or migrated profile carries its load time).
        'joined_on', pg_catalog.to_char(ops.ist_date((select u.created_at from auth.users u where u.id = p.id)), 'YYYY-MM-DD'),
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

revoke all on function app.dpdp_export_json(uuid, uuid) from public, anon, authenticated;
