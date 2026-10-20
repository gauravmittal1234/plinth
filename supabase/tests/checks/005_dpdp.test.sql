-- T60 · "Download my data" and account erasure cover the M3 tables (DESIGN §5b; BUILD_PLAN §13;
-- WORK_BREAKDOWN T60 Accept: "an export for a user with a saved cost-sheet read includes it;
-- erasure removes the user's checks and keeps no account digits"). Runs on the §5b seed with
-- T53's flow: Rohan's own JWT asks, the builder (service role) reads, and the erasure runs only
-- after he confirms with a fresh sign-in code. Aman's rows are the control.
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

update ops.runtime_settings set value = 'test' where key = 'env';

insert into core.check_rules (version, kind, claim_type, rule_code, params, text) values
  ('2026.10', 'claims', 'possession_date', 't60.test.possession_date', '{"confidence_bar": 0.8}', 'T60 test rule.');

-- Rohan (…24cf): a saved cost sheet (its file saved) with its read; a check he saved; a check he
-- did not save; a "Before you pay" from his WhatsApp number; a booking, a payee check, a receipt,
-- a review task on his claim and an adviser request. Aman (…7fea): a check and a booking.
insert into app.uploads (id, owner_user_id, wa_contact_id, kind, storage_key, sha256, mime, pages, saved, channel) values
  ('00000000-0000-4000-8000-000000006501', 'bff1ee72-9910-5980-a875-96a9a00b24cf', null, 'cost_sheet', 't60/r1.pdf', repeat('1', 64), 'application/pdf', 2, true, 'app'),
  ('00000000-0000-4000-8000-000000006502', 'bff1ee72-9910-5980-a875-96a9a00b24cf', null, 'flyer', 't60/r2.pdf', repeat('2', 64), 'application/pdf', 1, false, 'web'),
  ('00000000-0000-4000-8000-000000006503', 'bff1ee72-9910-5980-a875-96a9a00b24cf', null, 'flyer', 't60/r3.pdf', repeat('3', 64), 'application/pdf', 1, false, 'web'),
  ('00000000-0000-4000-8000-000000006504', null, '3ef22e92-2c14-549f-9e68-a69b03cb8fa8', 'payment_request', 't60/r4.jpg', repeat('4', 64), 'image/jpeg', 1, false, 'whatsapp'),
  ('00000000-0000-4000-8000-000000006505', '582a793f-ad80-5334-8d89-275221207fea', null, 'flyer', 't60/a1.pdf', repeat('5', 64), 'application/pdf', 1, true, 'web');

insert into app.doc_checks (id, upload_id, user_id, wa_contact_id, kind, channel, status, phase_id, match_method, confirmed_at, saved_at, rules_version, summary) values
  ('00000000-0000-4000-8000-000000006511', '00000000-0000-4000-8000-000000006501', 'bff1ee72-9910-5980-a875-96a9a00b24cf', null, 'cost_sheet', 'app', 'done',
   '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'user_pick', '2026-10-18 10:00+05:30', null, '2026.10', '{"line": "T60 cost summary."}'),
  ('00000000-0000-4000-8000-000000006512', '00000000-0000-4000-8000-000000006502', 'bff1ee72-9910-5980-a875-96a9a00b24cf', null, 'claims', 'web', 'done',
   '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'rera_number', '2026-10-18 10:00+05:30', '2026-10-18 11:00+05:30', '2026.10', '{"line": "T60 claims summary."}'),
  ('00000000-0000-4000-8000-000000006513', '00000000-0000-4000-8000-000000006503', 'bff1ee72-9910-5980-a875-96a9a00b24cf', null, 'claims', 'web', 'done',
   '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'rera_number', '2026-10-18 10:00+05:30', null, '2026.10', null),
  ('00000000-0000-4000-8000-000000006514', '00000000-0000-4000-8000-000000006504', null, '3ef22e92-2c14-549f-9e68-a69b03cb8fa8', 'before_you_pay', 'whatsapp', 'reading',
   null, null, null, null, null, null),
  ('00000000-0000-4000-8000-000000006515', '00000000-0000-4000-8000-000000006505', '582a793f-ad80-5334-8d89-275221207fea', null, 'claims', 'web', 'done',
   '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'rera_number', '2026-10-18 10:00+05:30', '2026-10-18 11:00+05:30', '2026.10', null);

insert into app.cost_sheet_reads (check_id, lines, all_in_inr, per_sqft_carpet_inr, loading_pct, negotiable_inr, rules_version) values
  ('00000000-0000-4000-8000-000000006511', '[{"code": "base", "amount_inr": 23500000}]', 27400400, 18900, 37.93, 440000, '2026.10');
insert into app.extracted_claims (id, check_id, seq, claim_type, raw_text, value, confidence, agreed) values
  ('00000000-0000-4000-8000-000000006521', '00000000-0000-4000-8000-000000006512', 1, 'possession_date', 'T60 POSSESSION LINE', '{"month": "2026-12"}', 0.95, true),
  ('00000000-0000-4000-8000-000000006522', '00000000-0000-4000-8000-000000006512', 2, 'account_number', 'A/c [ACCOUNT_1]',
   jsonb_build_object('token', '[ACCOUNT_1]', 'last4', '8082', 'sha256', repeat('e', 64)), 0.6, false),
  ('00000000-0000-4000-8000-000000006523', '00000000-0000-4000-8000-000000006513', 1, 'possession_date', 'T60 POSSESSION LINE', '{"month": "2027-01"}', 0.95, true),
  ('00000000-0000-4000-8000-000000006524', '00000000-0000-4000-8000-000000006515', 1, 'possession_date', 'T60 POSSESSION LINE', '{"month": "2027-06"}', 0.95, true);
insert into app.claim_verdicts (claim_id, verdict, records_text, how_checked, rule_code, rule_version) values
  ('00000000-0000-4000-8000-000000006521', 'differs', 'T60 records line.', 'T60 how checked.', 't60.test.possession_date', '2026.10'),
  ('00000000-0000-4000-8000-000000006524', 'matches', 'T60 records line.', 'T60 how checked.', 't60.test.possession_date', '2026.10');
insert into ops.review_tasks (id, kind, entity, entity_id, check_id, user_id, priority, request_note) values
  ('00000000-0000-4000-8000-000000006531', 'low_confidence_claim', 'app.extracted_claims', '00000000-0000-4000-8000-000000006522',
   '00000000-0000-4000-8000-000000006512', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 2, null),
  ('00000000-0000-4000-8000-000000006532', 'adviser_request', 'app.doc_checks', '00000000-0000-4000-8000-000000006513',
   null, 'bff1ee72-9910-5980-a875-96a9a00b24cf', 3, 'T60 please call me about this flyer.');
insert into app.bookings (id, user_id, phase_id, unit_no, price_inr, booked_on, paid_to_date_inr) values
  ('00000000-0000-4000-8000-000000006541', 'bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'T-6541', 16720000, '2026-03-01', 8778000),
  ('00000000-0000-4000-8000-000000006542', '582a793f-ad80-5334-8d89-275221207fea', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'T-6542', 15000000, '2026-04-01', 0);
insert into app.payee_checks (id, user_id, wa_contact_id, check_id, phase_id, payee_name, account_last4, account_sha256, ifsc, amount_inr, stage, method, result) values
  ('00000000-0000-4000-8000-000000006551', 'bff1ee72-9910-5980-a875-96a9a00b24cf', null, null, '4da0daeb-835b-54d5-9c09-a23ee9cb4b36',
   'T60 Payee LLP', '8082', repeat('e', 64), 'TEST0000912', 1100000, 'before_agreement', 'transfer', '{"payee": {"matched": 0, "of": 3}}'),
  ('00000000-0000-4000-8000-000000006552', null, '3ef22e92-2c14-549f-9e68-a69b03cb8fa8', '00000000-0000-4000-8000-000000006514', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36',
   'T60 Payee LLP', '7777', repeat('f', 64), 'TEST0000912', 500000, 'after_agreement', 'transfer', '{"payee": {"matched": 1, "of": 3}}');
insert into app.receipts (id, user_id, phase_id, booking_id, amount_inr, paid_on, utr_last4) values
  ('00000000-0000-4000-8000-000000006561', 'bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36',
   '00000000-0000-4000-8000-000000006541', 1100000, '2026-03-01', '7731');

-- Export --------------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t60.exp', api.data_export_request() ->> 'request_id', true);
reset role;
select set_config('request.jwt.claims', '', true);
set local role service_role;
select set_config('t60.p', api.dpdp_export_payload(current_setting('t60.exp')::uuid)::text, true);
reset role;

select results_eq(
  $$select x ->> 'check_id', (x ->> 'all_in_inr')::bigint, x ->> 'slug', x -> 'lines' -> 0 ->> 'code'
      from jsonb_array_elements(current_setting('t60.p')::jsonb -> 'saved_cost_sheet_reads') as x$$,
  $$values ('00000000-0000-4000-8000-000000006511'::text, 27400400::bigint, 'aurelia-heights-phase-2'::text, 'base'::text)$$,
  'the export carries his saved cost-sheet read (₹2.74 Cr all-in, its lines)'
);
select is(
  array(select x ->> 'check_id' from jsonb_array_elements(current_setting('t60.p')::jsonb -> 'saved_checks') as x),
  array['00000000-0000-4000-8000-000000006511', '00000000-0000-4000-8000-000000006512']::text[],
  'saved checks: the cost sheet (its file saved) and the check he saved; not the unsaved one, nor anyone else''s'
);
select results_eq(
  $$select r ->> 'seq', r ->> 'claim_type', r ->> 'says', r ->> 'verdict', r ->> 'rule'
      from jsonb_array_elements(current_setting('t60.p')::jsonb -> 'saved_checks') as c,
           jsonb_array_elements(c -> 'rows') as r
     where c ->> 'check_id' = '00000000-0000-4000-8000-000000006512'
     order by (r ->> 'seq')::int$$,
  $$values ('1'::text, 'possession_date'::text, 'T60 POSSESSION LINE'::text, 'differs'::text, 't60.test.possession_date'::text),
           ('2', 'account_number', 'A/c [ACCOUNT_1]', null, null)$$,
  'a saved check lists what it read and what the rules decided'
);
select results_eq(
  $$select x ->> 'unit_no', (x ->> 'price_inr')::bigint, (x ->> 'paid_to_date_inr')::bigint
      from jsonb_array_elements(current_setting('t60.p')::jsonb -> 'bookings') as x$$,
  $$values ('T-6541'::text, 16720000::bigint, 8778000::bigint)$$,
  'his booking'
);
select is(
  array(select x ->> 'account_ending' from jsonb_array_elements(current_setting('t60.p')::jsonb -> 'payee_checks') as x order by 1),
  array['7777', '8082']::text[],
  'his payee checks, the one from his WhatsApp number included, with the account ending only'
);
select ok(
  position(repeat('e', 64) in current_setting('t60.p')) = 0 and position(repeat('f', 64) in current_setting('t60.p')) = 0,
  'the export never carries the account hash'
);
select results_eq(
  $$select (x ->> 'amount_inr')::bigint, x ->> 'utr_ending', x ->> 'paid_on'
      from jsonb_array_elements(current_setting('t60.p')::jsonb -> 'receipts') as x$$,
  $$values (1100000::bigint, '7731'::text, '2026-03-01'::text)$$,
  'his receipt'
);
select is(
  jsonb_array_length(current_setting('t60.p')::jsonb -> 'consent_history' -> 'items'),
  5,
  'T53''s keys are unchanged (his 5 consents)'
);

-- Erasure ---------------------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t60.req', api.account_delete_request() ->> 'request_id', true);
select set_config('request.jwt.claims', json_build_object(
  'sub', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'role', 'authenticated',
  'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint - 60))
)::text, true);
select api.dpdp_erasure_confirm(current_setting('t60.req')::uuid);
reset role;
select set_config('request.jwt.claims', '', true);
select set_config('t60.audit_from', (select coalesce(max(id), 0)::text from ops.audit_log), true);
set local role service_role;
select set_config('t60.r1', api.dpdp_erasure_run(current_setting('t60.req')::uuid, 'app')::text, true);
reset role;

select is(
  (select summary -> 'removed' from app.dpdp_erasures where request_id = current_setting('t60.req')::uuid)
    - array['profile', 'follows', 'alert_subscriptions', 'saved_searches', 'devices', 'roles', 'uploads', 'family_circles',
            'family_memberships', 'shortlist_notes', 'project_requests_unlinked', 'whatsapp_contacts', 'outbox_cleared'],
  '{"doc_checks": 4, "extracted_claims": 3, "claim_verdicts": 1, "cost_sheet_reads": 1, "review_tasks": 2,
    "bookings": 1, "payee_checks": 2, "receipts": 1}'::jsonb,
  'the erasure record counts the M3 rows removed: 4 checks, 3 claims, 1 verdict, 1 cost-sheet read, 2 review tasks, 1 booking, 2 payee checks, 1 receipt'
);
select is(
  (select count(*)::int from app.doc_checks where id::text like '00000000-0000-4000-8000-00000000651_' and id <> '00000000-0000-4000-8000-000000006515')
  + (select count(*)::int from app.extracted_claims where id <> '00000000-0000-4000-8000-000000006524' and id::text like '00000000-0000-4000-8000-00000000652_')
  + (select count(*)::int from app.claim_verdicts where claim_id = '00000000-0000-4000-8000-000000006521')
  + (select count(*)::int from app.cost_sheet_reads where check_id = '00000000-0000-4000-8000-000000006511'),
  0,
  'his checks go, with their claims, verdicts and cost-sheet read'
);
select is(
  (select count(*)::int from app.doc_checks where wa_contact_id = '3ef22e92-2c14-549f-9e68-a69b03cb8fa8' or id = '00000000-0000-4000-8000-000000006514')
  + (select count(*)::int from app.payee_checks where id = '00000000-0000-4000-8000-000000006552'),
  0,
  'the check and payee check sent from his WhatsApp number go too'
);
select is(
  (select count(*)::int from app.bookings where user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf')
  + (select count(*)::int from app.payee_checks where user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf')
  + (select count(*)::int from app.receipts where user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  0,
  'his booking, payee check and receipt are removed'
);
select is(
  (select count(*)::int from ops.review_tasks where id in ('00000000-0000-4000-8000-000000006531', '00000000-0000-4000-8000-000000006532')),
  0,
  'the review task on his claim and his adviser request (with his note) are removed'
);
select ok(
  (select count(*) from app.payee_checks where account_last4 in ('8082', '7777') or account_sha256 in (repeat('e', 64), repeat('f', 64))) = 0
  and (select count(*) from app.extracted_claims where value::text like '%' || repeat('e', 64) || '%' or value ->> 'last4' = '8082') = 0,
  'no account ending or hash of his is kept in app.payee_checks or app.extracted_claims'
);
select is(
  (select count(*)::int from ops.audit_log a
    where a.id > current_setting('t60.audit_from')::bigint
      and (coalesce(a.before::text, '') || coalesce(a.after::text, '') || coalesce(a.reason, '')) ~ (repeat('e', 64) || '|' || repeat('f', 64) || '|8082|7777|T60 please call')),
  0,
  'the erasure leaves no account digits, hash or adviser note in the audit log'
);
select results_eq(
  $$select u.id, u.deleted_at is not null, u.owner_user_id, u.wa_contact_id from app.uploads u
     where u.id::text like '00000000-0000-4000-8000-00000000650_' and u.id <> '00000000-0000-4000-8000-000000006505' order by u.id$$,
  $$values ('00000000-0000-4000-8000-000000006501'::uuid, true, null::uuid, null::uuid),
           ('00000000-0000-4000-8000-000000006502'::uuid, true, null::uuid, null::uuid),
           ('00000000-0000-4000-8000-000000006503'::uuid, true, null::uuid, null::uuid),
           ('00000000-0000-4000-8000-000000006504'::uuid, true, null::uuid, null::uuid)$$,
  'his uploads, the WhatsApp one included, are marked deleted and name no one'
);
select ok(
  (current_setting('t60.r1')::jsonb -> 'storage_objects') @> '[{"bucket": "uploads", "key": "t60/r1.pdf"}, {"bucket": "uploads", "key": "t60/r4.jpg"}]'::jsonb
  and not ((current_setting('t60.r1')::jsonb -> 'storage_objects') @> '[{"key": "t60/a1.pdf"}]'::jsonb),
  'the files to remove include his saved cost sheet and the file from his WhatsApp number, and not Aman''s'
);
select results_eq(
  $$select (select count(*)::int from app.doc_checks where id = '00000000-0000-4000-8000-000000006515'),
           (select count(*)::int from app.claim_verdicts where claim_id = '00000000-0000-4000-8000-000000006524'),
           (select count(*)::int from app.bookings where id = '00000000-0000-4000-8000-000000006542'),
           (select deleted_at is null from app.uploads where id = '00000000-0000-4000-8000-000000006505')$$,
  $$values (1, 1, 1, true)$$,
  'Aman''s check, verdict, booking and file are untouched'
);
select is(
  (select summary -> 'kept' ->> 'consents' from app.dpdp_erasures where request_id = current_setting('t60.req')::uuid),
  '5',
  'T53''s legal hold is unchanged: his 5 consents are kept as proof'
);

-- A retry is safe and finds nothing more.
set local role service_role;
select lives_ok($$select api.dpdp_erasure_run(current_setting('t60.req')::uuid, 'app')$$, 'a retry runs safely');
reset role;
select is(
  (select summary -> 'last_run' -> 'removed' ->> 'doc_checks' from app.dpdp_erasures where request_id = current_setting('t60.req')::uuid),
  '0',
  'and removes no more checks'
);

select * from finish();
rollback;
