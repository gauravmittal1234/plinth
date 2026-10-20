-- T45a · Buyer API: saved searches and "Request a project" (API_CONTRACTS §3.2; DESIGN §5b:
-- R-MMDD-NN, added within 14 days). Cross-user isolation, one row per replayed p_client_id,
-- and the WhatsApp ask that needs the buyer's linked, opted-in contact.
-- Users ...45a001 (A), ...45a002 (B); test numbers +91 99000 00383/384.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

update ops.runtime_settings set value = 'test' where key = 'env';

insert into auth.users (id, phone, raw_user_meta_data) values
  ('00000000-0000-4000-8000-00000045a001', '919900000383', '{"first_name":"T45a Asha"}'),
  ('00000000-0000-4000-8000-00000045a002', '919900000384', '{"first_name":"T45a Bina"}');
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-00000045a101', 't45a-s1-group', 'T45a S1 Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-00000045a102', 't45a-s1-project', 'T45a S1 Project', '00000000-0000-4000-8000-00000045a101');
insert into core.phases (id, project_id, slug, name) values
  ('00000000-0000-4000-8000-00000045a103', '00000000-0000-4000-8000-00000045a102', 't45a-one', 'T45a One');
insert into core.rera_registrations (phase_id, authority, rera_number) values
  ('00000000-0000-4000-8000-00000045a103', 'harera_ggm', 'GGM/T45A/1/2026/01');

create temp table t45a_out (k text primary key, v jsonb);
grant all on t45a_out to public;

select is(
  (
    select array_agg(p.proname::text order by 1)
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and p.proname in ('saved_searches', 'saved_search_save', 'saved_search_delete', 'request_project')
      and (not has_function_privilege('authenticated', p.oid, 'EXECUTE')
           or has_function_privilege('anon', p.oid, 'EXECUTE')
           or has_function_privilege('service_role', p.oid, 'EXECUTE')
           or not p.prosecdef)
  ),
  null::text[],
  'saved-search and request RPCs: SECURITY DEFINER, authenticated only'
);

-- Saved searches ----------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
insert into t45a_out values ('s1', api.saved_search_save(
  '{"p_q": "3 bhk dwarka expressway", "p_sort": "lowest_risk"}'::jsonb, 'Dwarka 3 BHK', false, null,
  '00000000-0000-4000-8000-00000045ac11'));
select is((select v ->> 'schema' from t45a_out where k = 's1'), 'plinth.saved_search/1', 'saved_search_save: plinth.saved_search/1');
select is((select v #>> '{search,name}' from t45a_out where k = 's1'), 'Dwarka 3 BHK', 'the name is kept');
select is(
  api.saved_search_save('{"p_q": "anything else"}'::jsonb, null, false, null, '00000000-0000-4000-8000-00000045ac11'),
  (select v from t45a_out where k = 's1'),
  'a replayed p_client_id returns the first result'
);
select is(
  api.saved_search_save('{"p_q": "3 bhk dwarka expressway", "p_sort": "lowest_risk"}'::jsonb, null, true) #>> '{search,id}',
  (select v #>> '{search,id}' from t45a_out where k = 's1'),
  'the same query saved again updates the one saved search'
);
select is(jsonb_array_length(api.saved_searches() -> 'items'), 1, 'A has one saved search');
select throws_ok($$select api.saved_search_save('"text"'::jsonb)$$, 'PT422', 'invalid_input', 'the query is an object');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a002","role":"authenticated"}', true);
select is(api.saved_searches() -> 'items', '[]'::jsonb, 'B sees none of A''s saved searches');
select is(
  api.saved_search_delete((select (v #>> '{search,id}')::uuid from t45a_out where k = 's1')),
  '{"ok": true}'::jsonb,
  'B deleting A''s id answers ok (nothing of B''s is saved under it)'
);
select throws_ok(
  format($$select api.saved_search_save('{"p_q": "x"}'::jsonb, null, false, %L)$$, (select v #>> '{search,id}' from t45a_out where k = 's1')),
  'PT404', 'not_found', 'B cannot edit A''s saved search'
);
reset role;
select is(
  (select count(*)::int from app.saved_searches where user_id = '00000000-0000-4000-8000-00000045a001'),
  1,
  'A''s saved search is still there, one row'
);
insert into app.saved_searches (user_id, filters)
select '00000000-0000-4000-8000-00000045a002', jsonb_build_object('p_q', 'search ' || g) from generate_series(1, 25) g;
set local role authenticated;
select throws_ok($$select api.saved_search_save('{"p_q": "the 26th"}'::jsonb)$$, 'PT409', 'conflict', 'at most 25 saved searches');

-- Request a project -----------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
insert into t45a_out values ('r1', api.request_project('T45a Terraces,  Sector 99', null, false, '00000000-0000-4000-8000-00000045ac12'));
select matches((select v ->> 'ref' from t45a_out where k = 'r1'), '^R-1018-[0-9]{2,}$', 'request_project: R-MMDD-NN on the IST day');
select is((select v ->> 'due_on' from t45a_out where k = 'r1'), '2026-11-01', 'due 14 days later');
select is((select v ->> 'line' from t45a_out where k = 'r1'), 'We''ll add it by 1 Nov 2026 or tell you why not.', 'the DESIGN §5b promise');
select is((select v ->> 'name' from t45a_out where k = 'r1'), 'T45a Terraces, Sector 99', 'the name as typed, spaces tidied');
select is(
  api.request_project('Something else', null, false, '00000000-0000-4000-8000-00000045ac12'),
  (select v from t45a_out where k = 'r1'),
  'a replayed p_client_id returns the first request'
);
select is(
  api.request_project('t45a terraces, sector 99') ->> 'ref',
  (select v ->> 'ref' from t45a_out where k = 'r1'),
  'the same open request again returns the same reference'
);
select throws_ok($$select api.request_project(null, null)$$, 'PT422', 'invalid_input', 'a name or a RERA number is needed');
select throws_ok($$select api.request_project(null, 'ggm/t45a/1/2026/01')$$, 'PT409', 'conflict', 'a RERA number already in our records: conflict');
select throws_ok(
  $$select api.request_project('T45a Heights', null, true)$$,
  'PT409', 'consent_required', 'hearing back on WhatsApp needs a linked, opted-in contact'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a002","role":"authenticated"}', true);
insert into t45a_out values ('r2', api.request_project('T45a Terraces, Sector 99'));
select isnt((select v ->> 'ref' from t45a_out where k = 'r2'), (select v ->> 'ref' from t45a_out where k = 'r1'), 'B''s request is B''s own, with its own reference');
reset role;
select is(
  (select count(*)::int from app.project_requests where user_id = '00000000-0000-4000-8000-00000045a001'),
  1,
  'one row for A''s request, however often it was sent'
);
select is(
  (select count(*)::int from ops.audit_log where entity = 'app.project_requests' and actor_user_id = '00000000-0000-4000-8000-00000045a002'),
  1,
  'B''s request is audited under B'
);

-- With a linked, opted-in WhatsApp contact ------------------------------------------------
insert into pii.wa_contacts (wa_id_e164, user_id, utility_opt_in) values ('+919900000384', '00000000-0000-4000-8000-00000045a002', true);
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a002","role":"authenticated"}', true);
select is(
  api.request_project('T45a Terraces, Sector 99', null, true) ->> 'whatsapp_line',
  'We''ll tell you on WhatsApp too.',
  'B asks to hear back on WhatsApp: the same request now says so'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
select is(
  (api.request_project('t45a terraces, sector 99') ->> 'whatsapp_line'),
  null::text,
  'B''s WhatsApp ask never reaches A''s request'
);
reset role;
select is(
  (select array_agg(notify_whatsapp order by user_id) from app.project_requests where name_text = 'T45a Terraces, Sector 99'),
  array[false, true],
  'notify_whatsapp is set on B''s row only'
);

select * from finish();
rollback;
