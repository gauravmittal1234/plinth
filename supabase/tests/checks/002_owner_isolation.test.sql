-- T60 · Owner-only rows and family privacy (DATA_MODEL §7, §10, §12 inv. 5).
-- Wall 1: anon and authenticated have no grant (001). Wall 2, tested here with temporary grants
-- (rolled back): a buyer reads only their own checks, claims, verdicts, cost-sheet reads,
-- bookings, payee checks and receipts; a member of the owner's family circle (Meera, in Rohan's
-- circle) and a stranger read none of them; nobody writes them directly, not even the owner.
-- The review queue and the AI log are admin-only (aal2).
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Two owners: Rohan (…24cf, owns the circle Meera joined) and Aman (…7fea). Aurelia Phase 2.
insert into core.check_rules (version, kind, claim_type, rule_code, params, text) values
  ('2026.10', 'claims', 'possession_date', 't60.test.possession_date', '{"confidence_bar": 0.8}', 'T60 test rule.');

insert into app.uploads (id, owner_user_id, kind, storage_key, sha256, mime, pages, channel, status) values
  ('00000000-0000-4000-8000-000000006001', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'flyer', 't60/r-flyer.pdf', repeat('1', 64), 'application/pdf', 1, 'web', 'stored'),
  ('00000000-0000-4000-8000-000000006002', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'cost_sheet', 't60/r-cost.pdf', repeat('2', 64), 'application/pdf', 2, 'app', 'stored'),
  ('00000000-0000-4000-8000-000000006101', '582a793f-ad80-5334-8d89-275221207fea', 'flyer', 't60/a-flyer.pdf', repeat('3', 64), 'application/pdf', 1, 'web', 'stored'),
  ('00000000-0000-4000-8000-000000006102', '582a793f-ad80-5334-8d89-275221207fea', 'cost_sheet', 't60/a-cost.pdf', repeat('4', 64), 'application/pdf', 2, 'web', 'stored');

insert into app.doc_checks (id, upload_id, user_id, kind, channel, status, phase_id, match_method, confirmed_at, rules_version, summary) values
  ('00000000-0000-4000-8000-000000006011', '00000000-0000-4000-8000-000000006001', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'claims', 'web', 'done',
   '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'rera_number', '2026-10-18 11:00+05:30', '2026.10', '{"line": "T60 test summary."}'),
  ('00000000-0000-4000-8000-000000006012', '00000000-0000-4000-8000-000000006002', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'cost_sheet', 'app', 'done',
   '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'user_pick', '2026-10-18 11:00+05:30', '2026.10', null),
  ('00000000-0000-4000-8000-000000006111', '00000000-0000-4000-8000-000000006101', '582a793f-ad80-5334-8d89-275221207fea', 'claims', 'web', 'done',
   '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'rera_number', '2026-10-18 11:00+05:30', '2026.10', null),
  ('00000000-0000-4000-8000-000000006112', '00000000-0000-4000-8000-000000006102', '582a793f-ad80-5334-8d89-275221207fea', 'cost_sheet', 'web', 'done',
   '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'user_pick', '2026-10-18 11:00+05:30', '2026.10', null);

insert into app.extracted_claims (id, check_id, seq, claim_type, raw_text, value, confidence, reader_a, reader_b, agreed) values
  ('00000000-0000-4000-8000-000000006021', '00000000-0000-4000-8000-000000006011', 1, 'possession_date', 'T60 POSSESSION LINE',
   '{"month": "2026-12"}', 0.95, '{"value": "2026-12", "confidence": 0.95}', '{"value": "2026-12", "confidence": 0.97}', true),
  ('00000000-0000-4000-8000-000000006121', '00000000-0000-4000-8000-000000006111', 1, 'possession_date', 'T60 POSSESSION LINE',
   '{"month": "2027-06"}', 0.91, '{"value": "2027-06", "confidence": 0.91}', '{"value": "2027-06", "confidence": 0.93}', true);
insert into app.claim_verdicts (claim_id, verdict, records_text, how_checked, rule_code, rule_version) values
  ('00000000-0000-4000-8000-000000006021', 'differs', 'T60 records line.', 'T60 how checked.', 't60.test.possession_date', '2026.10'),
  ('00000000-0000-4000-8000-000000006121', 'matches', 'T60 records line.', 'T60 how checked.', 't60.test.possession_date', '2026.10');
insert into app.cost_sheet_reads (check_id, lines, all_in_inr, rules_version) values
  ('00000000-0000-4000-8000-000000006012', '[{"code": "base", "amount_inr": 100}]', 100, '2026.10'),
  ('00000000-0000-4000-8000-000000006112', '[{"code": "base", "amount_inr": 200}]', 200, '2026.10');
insert into app.bookings (id, user_id, phase_id, unit_no, price_inr, booked_on) values
  ('00000000-0000-4000-8000-000000006031', 'bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'T-0001', 1000, '2026-09-01'),
  ('00000000-0000-4000-8000-000000006131', '582a793f-ad80-5334-8d89-275221207fea', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'T-0002', 2000, '2026-09-02');
insert into app.payee_checks (id, user_id, phase_id, payee_name, account_last4, account_sha256, ifsc, amount_inr, stage, method, result) values
  ('00000000-0000-4000-8000-000000006041', 'bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'T60 Payee LLP', '0001', repeat('a', 64), 'TEST0000001', 100, 'before_agreement', 'transfer', '{"matched": 0}'),
  ('00000000-0000-4000-8000-000000006141', '582a793f-ad80-5334-8d89-275221207fea', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'T60 Payee LLP', '0002', repeat('b', 64), 'TEST0000002', 200, 'after_agreement', 'cheque', '{"matched": 3}');
insert into app.receipts (id, user_id, phase_id, booking_id, amount_inr, paid_on, utr_last4) values
  ('00000000-0000-4000-8000-000000006051', 'bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '00000000-0000-4000-8000-000000006031', 100, '2026-09-01', '0001'),
  ('00000000-0000-4000-8000-000000006151', '582a793f-ad80-5334-8d89-275221207fea', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '00000000-0000-4000-8000-000000006131', 200, '2026-09-02', '0002');
insert into ops.review_tasks (id, kind, entity, entity_id, check_id, user_id, priority) values
  ('00000000-0000-4000-8000-000000006061', 'extraction_disagreement', 'app.extracted_claims', '00000000-0000-4000-8000-000000006021',
   '00000000-0000-4000-8000-000000006011', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 1);
insert into ops.ai_generations (task, mode, tier, status, model_calls) values ('t60.test@1', 'recorded', 'free', 'ok', 0);

-- Temporary grants (rolled back): the policies are what is under test.
grant usage on schema app, ops to authenticated;
grant select on app.doc_checks, app.extracted_claims, app.claim_verdicts, app.cost_sheet_reads, app.bookings,
  app.payee_checks, app.receipts, app.uploads, ops.review_tasks, ops.ai_generations, ops.ai_task_budgets to authenticated;
grant insert, update, delete on app.doc_checks, app.bookings, app.payee_checks, app.receipts, app.claim_verdicts to authenticated;

create temp table t60_seen (who text, tbl text, own integer, others integer);
grant all on t60_seen to public;

create function pg_temp.t60_look(p_who text, p_uid uuid)
returns void
language plpgsql
as $$
declare
  t text;
  v_own integer;
  v_all integer;
begin
  foreach t in array array['doc_checks', 'extracted_claims', 'claim_verdicts', 'cost_sheet_reads', 'bookings', 'payee_checks', 'receipts'] loop
    execute pg_catalog.format('select count(*)::int from app.%I', t) into v_all;
    execute pg_catalog.format(
      case t
        when 'doc_checks' then 'select count(*)::int from app.%I where user_id = $1'
        when 'extracted_claims' then 'select count(*)::int from app.%I x where x.check_id in (select id from app.doc_checks where user_id = $1)'
        when 'claim_verdicts' then 'select count(*)::int from app.%I v where v.claim_id in (select x.id from app.extracted_claims x join app.doc_checks c on c.id = x.check_id where c.user_id = $1)'
        when 'cost_sheet_reads' then 'select count(*)::int from app.%I r where r.check_id in (select id from app.doc_checks where user_id = $1)'
        else 'select count(*)::int from app.%I where user_id = $1'
      end, t) into v_own using p_uid;
    insert into t60_seen values (p_who, t, v_own, v_all - v_own);
  end loop;
end
$$;
grant execute on function pg_temp.t60_look(text, uuid) to public;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select pg_temp.t60_look('rohan', 'bff1ee72-9910-5980-a875-96a9a00b24cf');
select set_config('request.jwt.claims', '{"sub":"582a793f-ad80-5334-8d89-275221207fea","role":"authenticated"}', true);
select pg_temp.t60_look('aman', '582a793f-ad80-5334-8d89-275221207fea');
-- Meera is a joined member of Rohan's circle; Kabir is a stranger.
select set_config('request.jwt.claims', '{"sub":"de38ce39-c6cc-5c35-b8a7-ecc1a480ff58","role":"authenticated"}', true);
select pg_temp.t60_look('meera', 'bff1ee72-9910-5980-a875-96a9a00b24cf');
select set_config('request.jwt.claims', '{"sub":"a9cd0930-a3ed-590f-b037-0c0f57fe535f","role":"authenticated"}', true);
select pg_temp.t60_look('kabir', 'bff1ee72-9910-5980-a875-96a9a00b24cf');
reset role;
select set_config('request.jwt.claims', '', true);

select ok(
  exists (select 1 from app.family_members m join app.family_circles c on c.id = m.circle_id
          where c.owner_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'
            and m.member_user_id = 'de38ce39-c6cc-5c35-b8a7-ecc1a480ff58' and m.status = 'joined'),
  'fixture: Meera is a joined member of Rohan''s family circle'
);
select results_eq(
  $$select tbl, own, others from t60_seen where who = 'rohan' order by tbl$$,
  $$values ('bookings'::text, 1, 0), ('claim_verdicts', 1, 0), ('cost_sheet_reads', 1, 0), ('doc_checks', 2, 0),
           ('extracted_claims', 1, 0), ('payee_checks', 1, 0), ('receipts', 1, 0)$$,
  'Rohan reads his own checks, claims, verdicts, cost-sheet read, booking, payee check and receipt, and none of Aman''s'
);
select results_eq(
  $$select tbl, own, others from t60_seen where who = 'aman' order by tbl$$,
  $$values ('bookings'::text, 1, 0), ('claim_verdicts', 1, 0), ('cost_sheet_reads', 1, 0), ('doc_checks', 2, 0),
           ('extracted_claims', 1, 0), ('payee_checks', 1, 0), ('receipts', 1, 0)$$,
  'Aman reads his own rows, and none of Rohan''s'
);
select is((select own from t60_seen where who = 'meera' and tbl = 'doc_checks'), 0, 'circle member: none of the owner''s checks');
select is((select own from t60_seen where who = 'meera' and tbl = 'extracted_claims'), 0, 'circle member: none of the owner''s claims');
select is((select own from t60_seen where who = 'meera' and tbl = 'claim_verdicts'), 0, 'circle member: none of the owner''s verdicts');
select is((select own from t60_seen where who = 'meera' and tbl = 'cost_sheet_reads'), 0, 'circle member: none of the owner''s cost sheets');
select is((select own from t60_seen where who = 'meera' and tbl = 'bookings'), 0, 'circle member: none of the owner''s bookings');
select is((select own from t60_seen where who = 'meera' and tbl = 'payee_checks'), 0, 'circle member: none of the owner''s payee checks');
select is((select own from t60_seen where who = 'meera' and tbl = 'receipts'), 0, 'circle member: none of the owner''s receipts');
select is(
  (select sum(own + others)::int from t60_seen where who in ('meera', 'kabir')),
  0,
  'the circle member and a stranger read nothing at all in the seven tables'
);

-- No direct writes, even for the owner and even with a grant: there is no write policy.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select throws_ok(
  $$insert into app.bookings (user_id, phase_id, unit_no, created_at) values ('bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'T-0009', now())$$,
  '42501', null,
  'the owner cannot insert a booking directly'
);
select throws_ok(
  $$insert into app.doc_checks (user_id, kind, channel, created_at) values ('bff1ee72-9910-5980-a875-96a9a00b24cf', 'claims', 'web', now())$$,
  '42501', null,
  'the owner cannot open a check directly'
);
select throws_ok(
  $$insert into app.payee_checks (user_id, phase_id) values ('bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36')$$,
  '42501', null,
  'the owner cannot write a payee check directly'
);
update app.bookings set price_inr = 1 where id = '00000000-0000-4000-8000-000000006031';
update app.claim_verdicts set verdict = 'matches' where claim_id = '00000000-0000-4000-8000-000000006021';
update app.doc_checks set status = 'reading' where id = '00000000-0000-4000-8000-000000006011';
delete from app.receipts where id = '00000000-0000-4000-8000-000000006051';
delete from app.payee_checks where id = '00000000-0000-4000-8000-000000006041';
reset role;
select set_config('request.jwt.claims', '', true);
select results_eq(
  $$select (select price_inr from app.bookings where id = '00000000-0000-4000-8000-000000006031'),
           (select verdict::text from app.claim_verdicts where claim_id = '00000000-0000-4000-8000-000000006021'),
           (select status from app.doc_checks where id = '00000000-0000-4000-8000-000000006011'),
           (select count(*)::int from app.receipts where id = '00000000-0000-4000-8000-000000006051'),
           (select count(*)::int from app.payee_checks where id = '00000000-0000-4000-8000-000000006041')$$,
  $$values (1000::bigint, 'differs'::text, 'done'::text, 1, 1)$$,
  'the owner''s own UPDATE and DELETE change nothing (no write policy): booking, verdict, check, receipt and payee check stand'
);

-- The review queue and the AI log: admin with aal2 only.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select is((select count(*)::int from ops.review_tasks), 0, 'a buyer reads no review task, not even one about their own check');
select is((select count(*)::int from ops.ai_generations), 0, 'a buyer reads no AI log row');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000060ad","role":"authenticated","plinth_roles":["reviewer"],"aal":"aal2"}', true);
select is((select count(*)::int from ops.review_tasks) + (select count(*)::int from ops.ai_generations), 0, 'a reviewer role alone reads neither (admin only)');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000060ad","role":"authenticated","plinth_roles":["admin"],"aal":"aal1"}', true);
select is((select count(*)::int from ops.review_tasks) + (select count(*)::int from ops.ai_generations), 0, 'an admin without aal2 reads neither');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000060ad","role":"authenticated","plinth_roles":["admin"],"aal":"aal2"}', true);
select is((select count(*)::int from ops.review_tasks where id = '00000000-0000-4000-8000-000000006061'), 1, 'an admin with aal2 reads the review queue');
select is((select count(*)::int from ops.ai_generations where task = 't60.test@1'), 1, 'an admin with aal2 reads the AI log');
select is(
  (select count(*)::int from app.doc_checks) + (select count(*)::int from app.bookings),
  0,
  'an admin JWT reads no buyer''s checks or bookings directly (owner-only policies; admin tools use RPCs)'
);
reset role;
select set_config('request.jwt.claims', '', true);

set local role anon;
select throws_ok($$select count(*) from app.doc_checks$$, '42501', null, 'anon: app.doc_checks → permission denied, even with the authenticated grants');
select throws_ok($$select count(*) from ops.ai_generations$$, '42501', null, 'anon: ops.ai_generations → permission denied');
reset role;

select * from finish();
rollback;
