-- T60 · M3 invariants held by the database, the review queue's shape, app.uploads' M3 columns
-- and the doc_checks queue (M3 rules; DATA_MODEL §7, §10; BUILD_PLAN §5.4, §12.9).
--   * Nothing is checked before the project is confirmed: no verdict for an unconfirmed check,
--     and a check is never checking or done without a confirmed project.
--   * A single reader never produces differs: matches/differs need an agreed claim.
--   * Every verdict names a published rule (core.check_rules).
--   * A disagreement opens exactly one open review task.
--   * Uploads: 15 MB, a reason for every rejection, one row per forwarded WhatsApp file.
--   * pgmq has a doc_checks queue that no client role can touch (Postgres only; PGlite has a stub).
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

update ops.runtime_settings set value = 'test' where key = 'env';

insert into core.check_rules (version, kind, claim_type, rule_code, params, text) values
  ('2026.10', 'claims', 'possession_date', 't60.test.possession_date', '{"confidence_bar": 0.8}', 'T60 test rule.');
insert into app.uploads (id, owner_user_id, kind, storage_key, sha256, mime, pages) values
  ('00000000-0000-4000-8000-000000006601', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'flyer', 't60/i.pdf', repeat('6', 64), 'application/pdf', 1);
insert into app.doc_checks (id, upload_id, user_id, kind, channel, status, phase_id) values
  ('00000000-0000-4000-8000-000000006611', '00000000-0000-4000-8000-000000006601', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'claims', 'web',
   'confirm_project', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36');
insert into app.extracted_claims (id, check_id, seq, claim_type, raw_text, confidence, agreed) values
  ('00000000-0000-4000-8000-000000006621', '00000000-0000-4000-8000-000000006611', 1, 'possession_date', 'T60 AGREED LINE', 0.95, true),
  ('00000000-0000-4000-8000-000000006622', '00000000-0000-4000-8000-000000006611', 2, 'possession_date', 'T60 DISAGREED LINE', 0.40, false);

-- Nothing is checked before the project is confirmed ------------------------------------------------
select throws_ok(
  $$insert into app.claim_verdicts (claim_id, verdict, rule_code, rule_version)
    values ('00000000-0000-4000-8000-000000006621', 'cant_check', 't60.test.possession_date', '2026.10')$$,
  'PT409', 'conflict', 'no verdict, not even cant_check, before the buyer confirms the project'
);
select throws_ok(
  $$update app.doc_checks set status = 'done' where id = '00000000-0000-4000-8000-000000006611'$$,
  '23514', null, 'a check cannot be done before the project is confirmed'
);
select throws_ok(
  $$update app.doc_checks set confirmed_at = ops.now(), phase_id = null where id = '00000000-0000-4000-8000-000000006611'$$,
  '23514', null, 'a confirmation always names the project'
);
update app.doc_checks set confirmed_at = ops.now(), status = 'checking', match_method = 'rera_number'
 where id = '00000000-0000-4000-8000-000000006611';
select is(
  (select status from app.doc_checks where id = '00000000-0000-4000-8000-000000006611'),
  'checking',
  'once confirmed, the check moves to checking'
);

-- A single reader never produces differs ------------------------------------------------------------
select throws_ok(
  $$insert into app.claim_verdicts (claim_id, verdict, rule_code, rule_version)
    values ('00000000-0000-4000-8000-000000006622', 'differs', 't60.test.possession_date', '2026.10')$$,
  'PT409', 'conflict', 'differs is refused for a claim the readers did not agree on'
);
select throws_ok(
  $$insert into app.claim_verdicts (claim_id, verdict, rule_code, rule_version)
    values ('00000000-0000-4000-8000-000000006622', 'matches', 't60.test.possession_date', '2026.10')$$,
  'PT409', 'conflict', 'so is matches'
);
select lives_ok(
  $$insert into app.claim_verdicts (claim_id, verdict, records_text, rule_code, rule_version)
    values ('00000000-0000-4000-8000-000000006622', 'cant_check', 'T60 a person is checking this reading.', 't60.test.possession_date', '2026.10')$$,
  'the disagreed claim can be cant_check'
);
select lives_ok(
  $$insert into app.claim_verdicts (claim_id, verdict, records_text, rule_code, rule_version)
    values ('00000000-0000-4000-8000-000000006621', 'differs', 'T60 records line.', 't60.test.possession_date', '2026.10')$$,
  'an agreed claim on a confirmed check can differ'
);
select throws_ok(
  $$update app.claim_verdicts set verdict = 'differs' where claim_id = '00000000-0000-4000-8000-000000006622'$$,
  'PT409', 'conflict', 'and a re-decision cannot turn a disagreed claim into differs either'
);
select throws_ok(
  $$update app.claim_verdicts set rule_code = 't60.no_such_rule' where claim_id = '00000000-0000-4000-8000-000000006621'$$,
  '23503', null, 'every verdict names a rule in core.check_rules'
);
select is(
  (select count(*)::int from ops.audit_log where entity = 'app.claim_verdicts' and after ->> 'claim_id' = '00000000-0000-4000-8000-000000006621'),
  1,
  'verdicts are audited (the history survives a re-decision)'
);

-- The review queue: one open task per disagreement ---------------------------------------------------
insert into ops.review_tasks (id, kind, entity, entity_id, check_id, user_id, priority) values
  ('00000000-0000-4000-8000-000000006631', 'extraction_disagreement', 'app.extracted_claims', '00000000-0000-4000-8000-000000006622',
   '00000000-0000-4000-8000-000000006611', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 2);
select throws_ok(
  $$insert into ops.review_tasks (kind, entity, entity_id, check_id, priority)
    values ('extraction_disagreement', 'app.extracted_claims', '00000000-0000-4000-8000-000000006622', '00000000-0000-4000-8000-000000006611', 2)$$,
  '23505', null, 'a second open task for the same disagreement is refused'
);
select throws_ok(
  $$update ops.review_tasks set status = 'resolved' where id = '00000000-0000-4000-8000-000000006631'$$,
  '23514', null, 'a resolved task records when'
);
update ops.review_tasks set status = 'resolved', resolved_at = ops.now(), resolution = '{"choice": "reader_a"}'
 where id = '00000000-0000-4000-8000-000000006631';
select lives_ok(
  $$insert into ops.review_tasks (kind, entity, entity_id, check_id, priority)
    values ('extraction_disagreement', 'app.extracted_claims', '00000000-0000-4000-8000-000000006622', '00000000-0000-4000-8000-000000006611', 2)$$,
  'once resolved, a new reading can open a new task'
);
select lives_ok(
  $$insert into ops.review_tasks (kind, entity, entity_id, check_id, user_id, priority, request_note, due_at)
    values ('adviser_request', 'app.doc_checks', '00000000-0000-4000-8000-000000006611', '00000000-0000-4000-8000-000000006611',
            'bff1ee72-9910-5980-a875-96a9a00b24cf', 5, 'T60 note.', ops.now() + interval '7 hours')$$,
  'adviser_request is a review task kind'
);

-- app.uploads (M3 columns) ------------------------------------------------------------------------------
select throws_ok(
  $$insert into app.uploads (owner_user_id, kind, storage_key, sha256, mime, bytes, channel, status)
    values ('bff1ee72-9910-5980-a875-96a9a00b24cf', 'flyer', 't60/big.pdf', repeat('7', 64), 'application/pdf', 15728641, 'web', 'awaiting_file')$$,
  '23514', null, 'a file over 15 MB is refused'
);
select throws_ok(
  $$insert into app.uploads (owner_user_id, kind, storage_key, sha256, mime, channel, status)
    values ('bff1ee72-9910-5980-a875-96a9a00b24cf', 'flyer', 't60/bad.svg', repeat('8', 64), 'image/svg+xml', 'web', 'rejected')$$,
  '23514', null, 'a rejection carries its reason'
);
select throws_ok(
  $$insert into app.uploads (owner_user_id, kind, storage_key, sha256, mime, channel)
    values ('bff1ee72-9910-5980-a875-96a9a00b24cf', 'flyer', 't60/sms.pdf', repeat('9', 64), 'application/pdf', 'sms')$$,
  '23514', null, 'the channel is web, app or whatsapp'
);
insert into app.uploads (wa_contact_id, kind, storage_key, sha256, mime, channel, status, wa_message_id) values
  ('3ef22e92-2c14-549f-9e68-a69b03cb8fa8', 'flyer', 't60/wa1.jpg', repeat('a', 64), 'image/jpeg', 'whatsapp', 'awaiting_file', 'wamid.t60.1');
select throws_ok(
  $$insert into app.uploads (wa_contact_id, kind, storage_key, sha256, mime, channel, status, wa_message_id) values
    ('3ef22e92-2c14-549f-9e68-a69b03cb8fa8', 'flyer', 't60/wa2.jpg', repeat('a', 64), 'image/jpeg', 'whatsapp', 'awaiting_file', 'wamid.t60.1')$$,
  '23505', null, 'a redelivered WhatsApp file is stored once'
);
select results_eq(
  $$select status, channel, bytes, retain_until = created_at + interval '30 days'
      from app.uploads where id = '00000000-0000-4000-8000-000000006601'$$,
  $$values ('stored'::text, null::text, null::integer, true)$$,
  'a T53-style row (no M3 fields) still inserts: stored, channel unknown, T53''s 30-day retention intact'
);

-- The doc_checks queue (Postgres only) ---------------------------------------------------------------
select case
  when not exists (select 1 from pg_catalog.pg_extension where extname = 'pgmq')
    then skip('no pgmq here (PGlite has a stub); ci-db checks the queue', 2)
  else collect_tap(
    ok(to_regclass('pgmq.q_doc_checks') is not null, 'the pgmq queue doc_checks exists'),
    ok(
      not has_table_privilege('anon', to_regclass('pgmq.q_doc_checks'), 'SELECT,INSERT,UPDATE,DELETE')
        and not has_table_privilege('authenticated', to_regclass('pgmq.q_doc_checks'), 'SELECT,INSERT,UPDATE,DELETE'),
      'anon and authenticated cannot touch the queue table'
    )
  )
end;

select * from finish();
rollback;
