-- T45a · Family circle and shared shortlist (API_CONTRACTS §4.11; DATA_MODEL §5, §12 inv. 5;
-- DESIGN §5b: one person per code, 7 days, no phone; the relative's own JOIN is the opt-in).
-- An expired, used, cancelled or unknown code is the same neutral not_found everywhere. A member
-- adds a note only with can_add_notes. Owners, members and strangers never reach each other's rows.
-- Users: owner ...45a001 (A), member ...45a002 (B), stranger ...45a003 (C), note-taker ...45a004 (D).
-- WhatsApp relative: +91 99000 00385 (no account).
begin;
create extension if not exists pgtap with schema extensions;
select plan(52);

update ops.runtime_settings set value = 'test' where key = 'env';

insert into auth.users (id, phone, raw_user_meta_data) values
  ('00000000-0000-4000-8000-00000045a001', null, '{"first_name":"Tara"}'),
  ('00000000-0000-4000-8000-00000045a002', null, '{"first_name":"T45a Bina"}'),
  ('00000000-0000-4000-8000-00000045a003', null, '{"first_name":"T45a Chet"}'),
  ('00000000-0000-4000-8000-00000045a004', null, '{"first_name":"T45a Devi"}');
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-00000045a101', 't45a-c1-group', 'T45a C1 Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-00000045a102', 't45a-c1-project', 'T45a C1 Project', '00000000-0000-4000-8000-00000045a101');
insert into core.phases (id, project_id, slug, name, short_code) values
  ('00000000-0000-4000-8000-00000045a103', '00000000-0000-4000-8000-00000045a102', 't45a-one', 'T45a One, Phase 1', 'TA1'),
  ('00000000-0000-4000-8000-00000045a104', '00000000-0000-4000-8000-00000045a102', 't45a-two', 'T45a Two, Phase 2', null),
  ('00000000-0000-4000-8000-00000045a105', '00000000-0000-4000-8000-00000045a102', 't45a-three', 'T45a Three', null);
insert into core.rera_registrations (phase_id, authority, rera_number) values
  ('00000000-0000-4000-8000-00000045a103', 'harera_ggm', 'GGM/T45A/3/2026/01');
insert into app.follows (user_id, phase_id, followed_at) values
  ('00000000-0000-4000-8000-00000045a001', '00000000-0000-4000-8000-00000045a103', '2026-07-01 10:00+05:30'),
  ('00000000-0000-4000-8000-00000045a001', '00000000-0000-4000-8000-00000045a104', '2026-07-02 10:00+05:30');

create temp table t45a_out (k text primary key, v jsonb);
grant all on t45a_out to public;
-- The SQLSTATE, code and sentence of an error, to show every refused code gets the same answer.
create function pg_temp.t45a_err(p_sql text)
returns text
language plpgsql
as $$
declare
  v_detail text;
begin
  execute p_sql;
  return 'no error';
exception when others then
  get stacked diagnostics v_detail = pg_exception_detail;
  return sqlstate || ' ' || sqlerrm || ' · ' || v_detail;
end
$$;

select is(
  (
    select array_agg(p.proname::text order by 1)
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and p.proname in ('family_circle', 'family_invite_create', 'family_invite_cancel', 'family_member_remove',
                        'family_member_undo', 'family_join', 'shortlist_note_add')
      and (not has_function_privilege('authenticated', p.oid, 'EXECUTE')
           or has_function_privilege('anon', p.oid, 'EXECUTE')
           or has_function_privilege('service_role', p.oid, 'EXECUTE')
           or not p.prosecdef)
  ),
  null::text[],
  'family RPCs: SECURITY DEFINER, authenticated only'
);
select ok(
  has_function_privilege('anon', 'api.family_invite_preview(text)', 'EXECUTE')
    and has_function_privilege('authenticated', 'api.family_invite_preview(text)', 'EXECUTE'),
  'the invite preview (/j/[code]) is open to anyone holding the code'
);
select ok(
  has_function_privilege('service_role', 'api.whatsapp_family_join(uuid, text, text)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'api.whatsapp_family_join(uuid, text, text)', 'EXECUTE')
    and not has_function_privilege('anon', 'api.whatsapp_family_join(uuid, text, text)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'ops.family_join_by_code(text, uuid)', 'EXECUTE'),
  'WhatsApp JOIN runs only through the service role'
);

-- The owner invites ---------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
insert into t45a_out values ('one', api.family_invite_create('{"slugs": ["t45a-one"]}'::jsonb, '00000000-0000-4000-8000-00000045ac21'));
select matches((select v ->> 'code' from t45a_out where k = 'one'), '^TA1-[2-9A-HJ-NP-Z]{3}$', 'one phase: its short code, then 3 unambiguous characters');
select is((select v ->> 'expires_on' from t45a_out where k = 'one'), '2026-10-25', 'valid 7 days');
select is((select v ->> 'scope_line' from t45a_out where k = 'one'), 'T45a One, Phase 1', 'one phase: its name');
select is(
  (select v ->> 'share_text' from t45a_out where k = 'one'),
  'Tara invited you to follow T45a One, Phase 1 on Plinth. You''ll get the same alerts. Your number stays yours. Tap to join: plinth.in/j/' || (select v ->> 'code' from t45a_out where k = 'one'),
  'the share text names the inviter and the link, never a number'
);
select is(
  api.family_invite_create('{"slugs": ["t45a-two"]}'::jsonb, '00000000-0000-4000-8000-00000045ac21'),
  (select v from t45a_out where k = 'one'),
  'a replayed p_client_id returns the first invite'
);
insert into t45a_out values ('two', api.family_invite_create('{"slugs": ["t45a-two"]}'::jsonb, null, true));
select matches((select v ->> 'code' from t45a_out where k = 'two'), '^TT2-', 'no short code: the initials, without "Phase"');
insert into t45a_out values ('all', api.family_invite_create('{"all": true}'::jsonb));
select matches((select v ->> 'code' from t45a_out where k = 'all'), '^TC2-', 'all projects: the owner''s initial, C and the count');
select is((select v ->> 'scope_line' from t45a_out where k = 'all'), '2 projects: T45a One Ph 1 and T45a Two Ph 2', 'all projects: the follows, oldest first');
select throws_ok($$select api.family_invite_create('{"slugs": ["t45a-three"]}'::jsonb)$$, 'PT422', 'invalid_input', 'only phases the owner follows');
select throws_ok($$select api.family_invite_create('{"slugs": ["t45a-one"], "all": true}'::jsonb)$$, 'PT422', 'invalid_input', 'some or all, not both');
reset role;
select is(
  (select count(*)::int from app.family_members m join app.family_circles c on c.id = m.circle_id
   where c.owner_user_id = '00000000-0000-4000-8000-00000045a001'),
  3,
  'three invites, one row for the replayed one'
);
select is(
  (select count(*)::int from app.family_members m join app.family_circles c on c.id = m.circle_id
   where c.owner_user_id = '00000000-0000-4000-8000-00000045a001'
     and pg_catalog.cardinality(m.scope_phase_ids) > 0),
  3,
  'every invite records the phases it named (the all-projects one too)'
);

-- The preview, for anyone holding the code ----------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '', true);
insert into t45a_out values ('prev', api.family_invite_preview(lower((select v ->> 'code' from t45a_out where k = 'one'))));
select is(
  (select v - 'what_you_get' from t45a_out where k = 'prev'),
  '{"schema": "plinth.family_invite_preview/1", "inviter_first_name": "Tara", "scope_line": "T45a One, Phase 1", "rera_number": "GGM/T45A/3/2026/01", "number_line": "Tara sees that you joined, never your number."}'::jsonb,
  'preview: who invited, to what, the RERA number; never a phone number'
);
select throws_ok($$select api.family_invite_preview('ZZ9-ZZZ')$$, 'PT404', 'not_found', 'an unknown code: not_found');
reset role;
update app.family_members set expires_at = '2026-10-18 11:00+05:30'
where invite_code = (select v ->> 'code' from t45a_out where k = 'two');
set local role anon;
select is(
  pg_temp.t45a_err(format('select api.family_invite_preview(%L)', (select v ->> 'code' from t45a_out where k = 'two'))),
  pg_temp.t45a_err($$select api.family_invite_preview('ZZ9-ZZZ')$$),
  'an expired code: the same neutral answer as an unknown one'
);

-- Joining from the app ----------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
select throws_ok(
  format('select api.family_join(%L)', (select v ->> 'code' from t45a_out where k = 'one')),
  'PT422', 'invalid_input', 'the owner cannot join their own circle'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a002","role":"authenticated"}', true);
select throws_ok(
  format('select api.family_join(%L)', (select v ->> 'code' from t45a_out where k = 'two')),
  'PT404', 'not_found', 'an expired code cannot be joined'
);
insert into t45a_out values ('join', api.family_join((select v ->> 'code' from t45a_out where k = 'one'), '00000000-0000-4000-8000-00000045ac22'));
select is((select v ->> 'schema' from t45a_out where k = 'join'), 'plinth.family_join/1', 'family_join: plinth.family_join/1');
select is(
  (select v ->> 'joined_line' from t45a_out where k = 'join'),
  'You''ll get the same alerts as Tara for T45a One, Phase 1.',
  'the join says whose alerts, for what'
);
select is(
  api.family_join((select v ->> 'code' from t45a_out where k = 'one'), '00000000-0000-4000-8000-00000045ac22'),
  (select v from t45a_out where k = 'join'),
  'a replayed join returns the first result'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a003","role":"authenticated"}', true);
select throws_ok(
  format('select api.family_join(%L)', (select v ->> 'code' from t45a_out where k = 'one')),
  'PT404', 'not_found', 'a used code works for one person only'
);
set local role anon;
select throws_ok(
  format('select api.family_invite_preview(%L)', (select v ->> 'code' from t45a_out where k = 'one')),
  'PT404', 'not_found', 'a used code no longer previews'
);

-- Reading the circle ------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
insert into t45a_out values ('circle', api.family_circle());
select is(
  (select jsonb_path_query_array(v, '$.members[*].first_name') from t45a_out where k = 'circle'),
  '["T45a Bina"]'::jsonb,
  'the owner sees the member who joined'
);
select is(
  (select v #>> '{members,0,line}' from t45a_out where k = 'circle'),
  'Joined 18 Oct 2026 · same alerts for T45a One Ph 1',
  'the member line: when, and for what'
);
select is(
  (select jsonb_path_query_array(v, '$.invites[*].code') from t45a_out where k = 'circle'),
  jsonb_build_array((select v ->> 'code' from t45a_out where k = 'all')),
  'open invites only: not the used or the expired one'
);
select is(
  (select v #>> '{invites,0,line}' from t45a_out where k = 'circle'),
  'Invited today · your 2 projects · hasn''t tapped the link yet',
  'the invite line'
);
select ok(
  (select (v -> 'members')::text || (v -> 'invites')::text !~ '(phone|\+91|follow_type|booked|payment)' from t45a_out where k = 'circle'),
  'the circle never carries a number, a follow type or a payment alert'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a002","role":"authenticated"}', true);
select is(
  (select jsonb_build_object('members', c -> 'members', 'invites', c -> 'invites', 'owners', jsonb_path_query_array(c, '$.member_of[*].owner_first_name'))
   from (select api.family_circle() as c) x),
  '{"members": [], "invites": [], "owners": ["Tara"]}'::jsonb,
  'the member sees whose circle they joined, never its members or invites'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a003","role":"authenticated"}', true);
select is(
  (select jsonb_build_object('members', c -> 'members', 'invites', c -> 'invites', 'member_of', c -> 'member_of')
   from (select api.family_circle() as c) x),
  '{"members": [], "invites": [], "member_of": []}'::jsonb,
  'a stranger sees nothing of the circle'
);

-- Notes: only with can_add_notes --------------------------------------------------------
select throws_ok($$select api.shortlist_note_add('t45a-one', 'A stranger''s note.')$$, 'PT404', 'not_found', 'a stranger has no circle to note in');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a002","role":"authenticated"}', true);
select throws_ok($$select api.shortlist_note_add('t45a-one', 'Bina has no right to add notes.')$$, 'PT403', 'forbidden', 'a member without can_add_notes cannot add a note');
reset role;
update app.family_members set expires_at = '2026-10-25 12:00+05:30'
where invite_code = (select v ->> 'code' from t45a_out where k = 'two');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a004","role":"authenticated"}', true);
select lives_ok(format('select api.family_join(%L)', (select v ->> 'code' from t45a_out where k = 'two')), 'D joins with the notes invite');
select is(
  api.shortlist_note_add('t45a-two', 'Ask about the Tower B slab.', '00000000-0000-4000-8000-00000045ac23'),
  '{"ok": true}'::jsonb,
  'a member with can_add_notes adds a note'
);
select lives_ok(
  $$select api.shortlist_note_add('t45a-two', 'Ask about the Tower B slab.', '00000000-0000-4000-8000-00000045ac23')$$,
  'the note replayed'
);
select throws_ok($$select api.shortlist_note_add('t45a-one', 'Not shared with D.')$$, 'PT422', 'invalid_input', 'only on the phases shared with the member');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
select lives_ok($$select api.shortlist_note_add('t45a-one', 'The owner''s own note.')$$, 'the owner adds a note');
reset role;
select is(
  (select array_agg(s.author_user_id::text || ':' || s.body order by s.created_at, s.body) from app.shortlist_notes s
   join app.family_circles c on c.id = s.circle_id where c.owner_user_id = '00000000-0000-4000-8000-00000045a001'),
  array['00000000-0000-4000-8000-00000045a004:Ask about the Tower B slab.', '00000000-0000-4000-8000-00000045a001:The owner''s own note.'],
  'one row per replayed note; nothing from B or C'
);

-- Remove, undo, cancel ------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a003","role":"authenticated"}', true);
select throws_ok(
  format('select api.family_member_remove(%L)', (select v ->> 'member_id' from t45a_out where k = 'join')),
  'PT404', 'not_found', 'a stranger cannot remove someone from another''s circle'
);
select throws_ok(
  format('select api.family_invite_cancel(%L)', (select v ->> 'code' from t45a_out where k = 'all')),
  'PT404', 'not_found', 'a stranger cannot cancel another''s invite'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
select is(api.family_member_remove((select (v ->> 'member_id')::uuid from t45a_out where k = 'join')), '{"ok": true}'::jsonb, 'the owner removes B');
select is(api.family_member_undo((select (v ->> 'member_id')::uuid from t45a_out where k = 'join')), '{"ok": true}'::jsonb, 'and undoes it');
reset role;
select is(
  (select status from app.family_members where id = (select (v ->> 'member_id')::uuid from t45a_out where k = 'join')),
  'joined',
  'B is back in the circle'
);
update app.family_members set status = 'removed', removed_at = '2026-10-18 10:00+05:30'
where id = (select (v ->> 'member_id')::uuid from t45a_out where k = 'join');
set local role authenticated;
select throws_ok(
  format('select api.family_member_undo(%L)', (select v ->> 'member_id' from t45a_out where k = 'join')),
  'PT409', 'conflict', 'two hours later it is too late to undo'
);
select is(api.family_invite_cancel((select v ->> 'code' from t45a_out where k = 'all')), '{"ok": true}'::jsonb, 'the owner cancels the open invite');
set local role anon;
select is(
  pg_temp.t45a_err(format('select api.family_invite_preview(%L)', (select v ->> 'code' from t45a_out where k = 'all'))),
  'PT404 not_found · This invite link isn''t valid any more. Ask for a new one.',
  'a cancelled code: the same neutral not_found'
);

-- JOIN on WhatsApp (service role) ------------------------------------------------------
reset role;
set local role service_role;
select api.wa_ingest_inbound('919900000385', 'wamid.t45a.join-1', 'text', '{"text": {"body": "JOIN"}}'::jsonb);
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
insert into t45a_out values ('wa', api.family_invite_create('{"slugs": ["t45a-one"]}'::jsonb));
reset role;
insert into t45a_out select 'contact', to_jsonb(id) from pii.wa_contacts where wa_id_e164 = '+919900000385';
select set_config('request.jwt.claims', '', true);
set local role service_role;
select throws_ok(
  format('select api.whatsapp_family_join(%L, %L, %L)',
    (select v #>> '{}' from t45a_out where k = 'contact'), (select v ->> 'code' from t45a_out where k = 'wa'), 'wamid.t45a.someone-else'),
  'PT403', 'forbidden', 'only the relative''s own message can join'
);
select is(
  api.whatsapp_family_join((select (v #>> '{}')::uuid from t45a_out where k = 'contact'), (select v ->> 'code' from t45a_out where k = 'wa'), 'wamid.t45a.join-1') ->> 'inviter_first_name',
  'Tara',
  'JOIN <code> from WhatsApp joins the circle'
);
reset role;
select is(
  (select m.status || ':' || m.joined_via || ':' || (m.member_user_id is null)::text || ':' || k.utility_opt_in::text
   from app.family_members m join pii.wa_contacts k on k.id = m.wa_contact_id
   where m.invite_code = (select v ->> 'code' from t45a_out where k = 'wa')),
  'joined:whatsapp:true:true',
  'a WhatsApp-only member: no account, no phone on the row, and their JOIN is their opt-in'
);
set local role service_role;
select is(
  pg_temp.t45a_err(format('select api.whatsapp_family_join(%L, %L, %L)',
    (select v #>> '{}' from t45a_out where k = 'contact'), (select v ->> 'code' from t45a_out where k = 'two'), 'wamid.t45a.join-1')),
  'PT404 not_found · This invite link isn''t valid any more. Ask for a new one.',
  'a used code over WhatsApp: the same neutral not_found'
);

select * from finish();
rollback;
