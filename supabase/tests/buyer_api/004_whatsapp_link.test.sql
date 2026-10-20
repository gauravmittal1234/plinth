-- T45a · "Bring them here": WhatsApp follows of an unlinked number (api.whatsapp_follow_record,
-- service role) and api.link_whatsapp_follows (DATA_MODEL §9: a contact is linked only after the
-- buyer's own tap). The peek changes nothing; the tap links the caller's own number only; a number
-- linked to another account is never touched.
-- Users: L ...45a011 (+91 99000 00386), M ...45a012 (+91 99000 00387), N ...45a013 (+91 99000 00388),
-- X ...45a014 (no phone).
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

update ops.runtime_settings set value = 'test' where key = 'env';

insert into auth.users (id, phone, phone_confirmed_at, raw_user_meta_data) values
  ('00000000-0000-4000-8000-00000045a011', '919900000386', now(), '{"first_name":"T45a Lata"}'),
  ('00000000-0000-4000-8000-00000045a012', '919900000387', now(), '{"first_name":"T45a Mona"}'),
  ('00000000-0000-4000-8000-00000045a013', '919900000388', now(), '{"first_name":"T45a Neel"}'),
  ('00000000-0000-4000-8000-00000045a014', null, null, '{"first_name":"T45a Xavi"}');
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-00000045a101', 't45a-w1-group', 'T45a W1 Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-00000045a102', 't45a-w1-project', 'T45a W1 Project', '00000000-0000-4000-8000-00000045a101');
insert into core.phases (id, project_id, slug, name) values
  ('00000000-0000-4000-8000-00000045a103', '00000000-0000-4000-8000-00000045a102', 't45a-one', 'T45a One'),
  ('00000000-0000-4000-8000-00000045a104', '00000000-0000-4000-8000-00000045a102', 't45a-two', 'T45a Two');

create temp table t45a_out (k text primary key, v jsonb);
grant all on t45a_out to public;

select ok(
  has_function_privilege('service_role', 'api.whatsapp_follow_record(uuid, text, text)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'api.whatsapp_follow_record(uuid, text, text)', 'EXECUTE')
    and not has_function_privilege('anon', 'api.whatsapp_follow_record(uuid, text, text)', 'EXECUTE'),
  'whatsapp_follow_record: service role only'
);
select ok(
  has_function_privilege('authenticated', 'api.link_whatsapp_follows(boolean)', 'EXECUTE')
    and not has_function_privilege('anon', 'api.link_whatsapp_follows(boolean)', 'EXECUTE')
    and not has_function_privilege('service_role', 'api.link_whatsapp_follows(boolean)', 'EXECUTE'),
  'link_whatsapp_follows: authenticated only'
);

-- L's number follows two phases on WhatsApp, before L has linked it ---------------------
set local role service_role;
select api.wa_ingest_inbound('919900000386', 'wamid.t45a.l-tap-1', 'interactive', '{"interactive": {"type": "button_reply"}}'::jsonb);
select api.wa_ingest_inbound('919900000386', 'wamid.t45a.l-text-1', 'text', '{"text": {"body": "follow"}}'::jsonb);
select api.wa_ingest_inbound('919900000388', 'wamid.t45a.n-tap-1', 'button', '{"button": {"payload": "follow"}}'::jsonb);
reset role;
insert into t45a_out select 'l_contact', to_jsonb(id) from pii.wa_contacts where wa_id_e164 = '+919900000386';
insert into t45a_out select 'n_contact', to_jsonb(id) from pii.wa_contacts where wa_id_e164 = '+919900000388';
set local role service_role;
select is(
  api.whatsapp_follow_record((select (v #>> '{}')::uuid from t45a_out where k = 'l_contact'), 't45a-one', 'wamid.t45a.l-tap-1'),
  '{"slug": "t45a-one", "since": "2026-10-18", "linked": false}'::jsonb,
  'a tap from an unlinked number records a WhatsApp follow'
);
select lives_ok(
  $$select api.whatsapp_follow_record((select (v #>> '{}')::uuid from t45a_out where k = 'l_contact'), 't45a-two', 'wamid.t45a.l-tap-1')$$,
  'a second follow'
);
select lives_ok(
  $$select api.whatsapp_follow_record((select (v #>> '{}')::uuid from t45a_out where k = 'l_contact'), 't45a-one', 'wamid.t45a.l-tap-1')$$,
  'the same follow again is a no-op'
);
select throws_ok(
  $$select api.whatsapp_follow_record((select (v #>> '{}')::uuid from t45a_out where k = 'l_contact'), 't45a-one', 'wamid.t45a.l-text-1')$$,
  'PT403', 'forbidden', 'typed text is not a tap'
);
select throws_ok(
  $$select api.whatsapp_follow_record((select (v #>> '{}')::uuid from t45a_out where k = 'l_contact'), 't45a-one', 'wamid.t45a.n-tap-1')$$,
  'PT403', 'forbidden', 'another number''s tap never follows for L''s number'
);
reset role;
-- N's number already belongs to X's account.
update pii.wa_contacts set user_id = '00000000-0000-4000-8000-00000045a014' where wa_id_e164 = '+919900000388';
insert into app.wa_follows (wa_contact_id, phase_id, wa_message_id)
select id, '00000000-0000-4000-8000-00000045a103', 'wamid.t45a.n-tap-1' from pii.wa_contacts where wa_id_e164 = '+919900000388';
set local role service_role;
select throws_ok(
  $$select api.whatsapp_follow_record((select (v #>> '{}')::uuid from t45a_out where k = 'n_contact'), 't45a-two', 'wamid.t45a.n-tap-1')$$,
  'PT409', 'conflict', 'a linked number follows through api.follow under its tap token instead'
);

-- The peek -----------------------------------------------------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a011","role":"authenticated"}', true);
select is(
  api.link_whatsapp_follows(false),
  '{"schema": "plinth.link_whatsapp_follows/1", "accepted": false, "linked": false, "cost_sheets": [],
    "follows": [{"slug": "t45a-one", "since": "2026-10-18"}, {"slug": "t45a-two", "since": "2026-10-18"}]}'::jsonb,
  'the peek lists what L''s own number follows on WhatsApp'
);
reset role;
select is(
  (select coalesce(user_id::text, 'unlinked') || ':' || (select count(*) from app.follows where user_id = '00000000-0000-4000-8000-00000045a011')::text
   from pii.wa_contacts where wa_id_e164 = '+919900000386'),
  'unlinked:0',
  'the peek changes nothing'
);

-- Other accounts see nothing of L's number --------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a012","role":"authenticated"}', true);
select is(
  api.link_whatsapp_follows(true),
  '{"schema": "plinth.link_whatsapp_follows/1", "accepted": true, "linked": false, "follows": [], "cost_sheets": []}'::jsonb,
  'M (no WhatsApp history) brings nothing, and never L''s follows'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a013","role":"authenticated"}', true);
select is(
  api.link_whatsapp_follows(true) -> 'linked',
  'false'::jsonb,
  'N''s number belongs to another account: nothing is linked'
);
reset role;
select is(
  (select user_id::text from pii.wa_contacts where wa_id_e164 = '+919900000388'),
  '00000000-0000-4000-8000-00000045a014',
  'and that account keeps it'
);
select is(
  (select count(*)::int from app.follows where user_id = '00000000-0000-4000-8000-00000045a013'),
  0,
  'N got none of X''s WhatsApp follows'
);

-- "Bring them here" -------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a011","role":"authenticated"}', true);
insert into t45a_out values ('bring', api.link_whatsapp_follows(true));
select is(
  (select v from t45a_out where k = 'bring'),
  '{"schema": "plinth.link_whatsapp_follows/1", "accepted": true, "linked": true, "cost_sheets": [],
    "follows": [{"slug": "t45a-one", "since": "2026-10-18"}, {"slug": "t45a-two", "since": "2026-10-18"}]}'::jsonb,
  'the tap links L''s number and lists the follows brought'
);
select is(api.link_whatsapp_follows(true), (select v from t45a_out where k = 'bring'), 'bringing again gives the same answer');
select is(api.link_whatsapp_follows(false) -> 'follows', '[]'::jsonb, 'nothing is left to bring');
reset role;
select is(
  (select array_agg(source order by phase_id) from app.follows where user_id = '00000000-0000-4000-8000-00000045a011'),
  array['whatsapp', 'whatsapp'],
  'L now follows both, recorded as from WhatsApp, once each'
);
select is(
  (select user_id::text from pii.wa_contacts where wa_id_e164 = '+919900000386'),
  '00000000-0000-4000-8000-00000045a011',
  'the contact is linked to L'
);
select ok(
  exists (select 1 from ops.audit_log where entity = 'pii.wa_contacts' and action = 'link'
            and actor_user_id = '00000000-0000-4000-8000-00000045a011'),
  'the link is audited under L'
);

-- An unconfirmed phone links nothing ------------------------------------------------------
reset role;
insert into auth.users (id, phone, raw_user_meta_data) values
  ('00000000-0000-4000-8000-00000045a015', '919900000389', '{"first_name":"T45a Unconfirmed"}');
insert into pii.wa_contacts (wa_id_e164) values ('+919900000389');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a015","role":"authenticated"}', true);
select is(
  api.link_whatsapp_follows(true) -> 'linked',
  'false'::jsonb,
  'a phone the account never confirmed by code links no WhatsApp number'
);

-- A tap token cannot link a number --------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'role', 'authenticated', 'sub', '00000000-0000-4000-8000-00000045a011',
  'amr', jsonb_build_array(jsonb_build_object('method', 'whatsapp_tap', 'timestamp', 1792305000)),
  'wa_message_id', 'wamid.t45a.l-tap-1')::text, true);
select throws_ok($$select api.link_whatsapp_follows(true)$$, 'PT403', 'forbidden', 'only a signed-in session links a number, never a tap token');

select * from finish();
rollback;
