-- T60 · No column can hold a full bank account number (M3 rules: "kept only as a salted hash plus
-- the last 4 digits"; WORK_BREAKDOWN T60 Accept). Catalogue: the only account-named columns are
-- account_sha256 and account_last4 (and receipts.utr_last4), the last-4 columns are 4 wide, and
-- every free-text or JSON column of app.payee_checks and app.extracted_claims sits under a CHECK
-- that refuses an account-length run of digits. Behaviour: a full number is refused in each of
-- them, spaced or not, while ₹ amounts, decimals, IFSC codes, UUIDs and hashes still fit.
begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Catalogue ---------------------------------------------------------------------------------------
select is(
  (
    select array_agg((c.table_schema || '.' || c.table_name || '.' || c.column_name)::text
                     order by (c.table_schema || '.' || c.table_name || '.' || c.column_name)::text)
    from information_schema.columns c
    where (c.table_schema, c.table_name) in (
        ('app', 'doc_checks'), ('app', 'extracted_claims'), ('app', 'claim_verdicts'), ('app', 'cost_sheet_reads'),
        ('app', 'bookings'), ('app', 'payee_checks'), ('app', 'receipts'), ('app', 'uploads'),
        ('ops', 'review_tasks'), ('ops', 'ai_generations'), ('core', 'check_rules'))
      and c.column_name ~* '(^|_)(account|accounts|acct|ac|acno|bank|iban|utr|number)(_|$)'
  ),
  array['app.payee_checks.account_last4', 'app.payee_checks.account_sha256', 'app.receipts.utr_last4']::text[],
  'the only account-named columns are account_last4, account_sha256 (payee checks) and utr_last4 (receipts)'
);
select is(
  (
    select string_agg(a.attname || ':' || pg_catalog.format_type(a.atttypid, a.atttypmod), ', ' order by a.attname)
    from pg_catalog.pg_attribute a
    where (a.attrelid, a.attname) in (
      ('app.payee_checks'::regclass, 'account_last4'), ('app.payee_checks'::regclass, 'account_sha256'),
      ('app.receipts'::regclass, 'utr_last4'))
  ),
  'account_last4:character varying(4), account_sha256:character varying(64), utr_last4:character varying(4)',
  'the last-4 columns are 4 characters wide; the hash column is a 64-character string'
);
select ok(
  exists (
    select 1 from pg_catalog.pg_constraint k
    where k.conrelid = 'app.payee_checks'::regclass and k.contype = 'c'
      and pg_catalog.pg_get_constraintdef(k.oid) ~ 'account_sha256' and pg_catalog.pg_get_constraintdef(k.oid) ~ '\[0-9a-f\]\{64\}'
  ),
  'account_sha256 is lower-case hex only (a SHA-256 digest, not a number)'
);
select is(
  (
    select array_agg(a.attname::text order by a.attname)
    from pg_catalog.pg_attribute a
    where a.attrelid = 'app.extracted_claims'::regclass and a.attnum > 0 and not a.attisdropped
      and pg_catalog.format_type(a.atttypid, a.atttypmod) in ('text', 'jsonb', 'text[]')
      and not exists (
        select 1 from pg_catalog.pg_constraint k
        where k.conrelid = a.attrelid and k.contype = 'c' and a.attnum = any (k.conkey)
          and (pg_catalog.pg_get_constraintdef(k.oid) ~ 'has_digit_run'
               or (a.attname in ('claim_type', 'qualifier', 'unit')))
      )
  ),
  null::text[],
  'every text, JSON and array column of app.extracted_claims is under the digit-run CHECK (claim_type, qualifier and unit are closed lists)'
);
select is(
  (
    select array_agg(a.attname::text order by a.attname)
    from pg_catalog.pg_attribute a
    where a.attrelid = 'app.payee_checks'::regclass and a.attnum > 0 and not a.attisdropped
      and pg_catalog.format_type(a.atttypid, a.atttypmod) in ('text', 'jsonb')
      and not exists (
        select 1 from pg_catalog.pg_constraint k
        where k.conrelid = a.attrelid and k.contype = 'c' and a.attnum = any (k.conkey)
          and (pg_catalog.pg_get_constraintdef(k.oid) ~ 'has_digit_run'
               or (a.attname in ('stage', 'method')))
      )
  ),
  null::text[],
  'every unbounded text or JSON column of app.payee_checks (payee_name, result) is under the digit-run CHECK; stage and method are closed lists'
);
select is(
  (
    select array_agg(a.attname::text order by a.attname)
    from pg_catalog.pg_attribute a
    where a.attrelid in ('app.payee_checks'::regclass, 'app.extracted_claims'::regclass)
      and a.attnum > 0 and not a.attisdropped
      and pg_catalog.format_type(a.atttypid, a.atttypmod) in ('bigint', 'numeric')
      and not exists (
        select 1 from pg_catalog.pg_constraint k
        where k.conrelid = a.attrelid and k.contype = 'c' and a.attnum = any (k.conkey)
          and pg_catalog.pg_get_constraintdef(k.oid) ~ '(<=|BETWEEN).*(10000000000|1\.0|1\))'
      )
  ),
  null::text[],
  'every numeric column of the two tables is bounded (≤ ₹1,000 Cr, or 0–1), too small for an 11+ digit number'
);

-- The guard itself ----------------------------------------------------------------------------------
select ok(app.has_digit_run('A/c No. 50200071824417', 9), 'a 14-digit account number is a run');
select ok(app.has_digit_run('A/c 5020 0071 8244 17', 9), 'spaced in groups, it is still a run');
select ok(app.has_digit_run('A/c 5020-0071-8244-17', 9), 'and with hyphens');
select ok(app.has_digit_run('A/c No.919020045118082', 9), 'right after "No." too');
select ok(not app.has_digit_run('Pay ₹11,00,000 to A/c [ACCOUNT_1] ending 4417, IFSC MRGL0000912', 9), 'a token, the last 4, an Indian-grouped amount and an IFSC are not');
select ok(not app.has_digit_run('{"inr": 120000000, "confidence": 0.9312345678901}', 11), 'a ₹12 Cr amount and a long decimal fit under the 11-digit bar');
select ok(not app.has_digit_run('bff1ee72-9910-5980-a875-96a9a00b24cf ' || repeat('1', 64), 9), 'UUIDs and SHA-256 digests are not account numbers');
select ok(not app.has_digit_run(null, 9), 'null holds nothing');

-- Behaviour: extracted claims -----------------------------------------------------------------------
insert into app.uploads (id, owner_user_id, kind, storage_key, sha256, mime, pages) values
  ('00000000-0000-4000-8000-000000006401', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'payment_request', 't60/pay.pdf', repeat('5', 64), 'application/pdf', 1);
insert into app.doc_checks (id, upload_id, user_id, kind, channel) values
  ('00000000-0000-4000-8000-000000006411', '00000000-0000-4000-8000-000000006401', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'before_you_pay', 'web');

select throws_ok(
  $$insert into app.extracted_claims (check_id, seq, claim_type, raw_text) values
    ('00000000-0000-4000-8000-000000006411', 1, 'account_number', 'A/c No. 50200071824417')$$,
  '23514', null, 'an account claim with the number in its text is refused'
);
select throws_ok(
  $$insert into app.extracted_claims (check_id, seq, claim_type, raw_text, value) values
    ('00000000-0000-4000-8000-000000006411', 1, 'account_number', 'A/c No. [ACCOUNT_1]', '{"account": "5020 0071 8244 17"}')$$,
  '23514', null, 'an account claim with the number in its value is refused, spaced or not'
);
select throws_ok(
  $$insert into app.extracted_claims (check_id, seq, claim_type, raw_text, reader_a, reader_b) values
    ('00000000-0000-4000-8000-000000006411', 1, 'account_number', 'A/c No. [ACCOUNT_1]',
     '{"value": "[ACCOUNT_1]"}', '{"value": "919020045118082"}')$$,
  '23514', null, 'a reader''s raw answer with the number is refused'
);
select throws_ok(
  $$insert into app.extracted_claims (check_id, seq, claim_type, raw_text, value) values
    ('00000000-0000-4000-8000-000000006411', 1, 'payee_name', 'Payee: Northfield Realty Services LLP 919020045118082', null)$$,
  '23514', null, 'a long run of digits in any claim type is refused (11 or more)'
);
select throws_ok(
  $$insert into app.extracted_claims (check_id, seq, claim_type, raw_text, bbox) values
    ('00000000-0000-4000-8000-000000006411', 1, 'amount', 'Rs 11,00,000', '[919020045118082, 0, 1, 1]')$$,
  '23514', null, 'even the bounding box cannot carry one'
);
select lives_ok(
  $$insert into app.extracted_claims (check_id, seq, claim_type, raw_text, value, reader_a, reader_b, line_ids, bbox, confidence, agreed) values
    ('00000000-0000-4000-8000-000000006411', 1, 'account_number', 'A/c No. [ACCOUNT_1], IFSC MRGL0000912',
     jsonb_build_object('token', '[ACCOUNT_1]', 'last4', '8082', 'sha256', repeat('e', 64)),
     '{"value": "[ACCOUNT_1]", "confidence": 0.97}', '{"value": "[ACCOUNT_1]", "confidence": 0.95}',
     array['p1.l14'], '[0.08, 0.31, 0.62, 0.38]', 0.95, true)$$,
  'an account claim as tokenised (token, last 4, hash) is stored'
);
select lives_ok(
  $$insert into app.extracted_claims (check_id, seq, claim_type, raw_text, value) values
    ('00000000-0000-4000-8000-000000006411', 2, 'price', 'Starting ₹12 Cr', '{"inr": 120000000}')$$,
  'a ₹12 Cr price (9 digits) is stored'
);

-- Behaviour: payee checks ------------------------------------------------------------------------------
select throws_ok(
  $$insert into app.payee_checks (user_id, phase_id, account_last4, account_sha256) values
    ('bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '18082', repeat('e', 64))$$,
  '22001', null, 'account_last4 cannot take a fifth digit'
);
select throws_ok(
  $$insert into app.payee_checks (user_id, phase_id, account_last4, account_sha256) values
    ('bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '8082', '919020045118082')$$,
  '23514', null, 'account_sha256 takes a digest, not the number'
);
select throws_ok(
  $$insert into app.payee_checks (user_id, phase_id, payee_name) values
    ('bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'Northfield 919020045118082')$$,
  '23514', null, 'the payee name cannot carry the number'
);
select throws_ok(
  $$insert into app.payee_checks (user_id, phase_id, result) values
    ('bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '{"entered_line": "9190 2004 5118 082"}')$$,
  '23514', null, 'the result cannot carry the number'
);
select throws_ok(
  $$insert into app.payee_checks (user_id, phase_id, amount_inr) values
    ('bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 919020045118082)$$,
  '23514', null, 'nor can the amount'
);
select throws_ok(
  $$insert into app.payee_checks (user_id, phase_id, account_last4) values
    ('bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '8082')$$,
  '23514', null, 'the last 4 always comes with its hash'
);
select lives_ok(
  $$insert into app.payee_checks (user_id, phase_id, payee_name, account_last4, account_sha256, ifsc, amount_inr, stage, method, result) values
    ('bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'Northfield Realty Services LLP', '8082',
     repeat('e', 64), 'MRGL0000912', 1100000, 'before_agreement', 'transfer',
     '{"payee": {"matched": 0, "of": 3, "rows": [{"field": "account", "entered_line": "ending 8082", "registered_line": "ending 4417"}]}, "cap": {"limit_inr": 2442000}}')$$,
  'a payee check as specified (name, last 4, hash, IFSC, amount, result) is stored'
);
select throws_ok(
  $$insert into app.receipts (user_id, phase_id, amount_inr, paid_on, utr_last4) values
    ('bff1ee72-9910-5980-a875-96a9a00b24cf', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 1100000, '2026-10-01', 'UTR0007731')$$,
  '22001', null, 'a receipt keeps only the last 4 of the UTR'
);

select * from finish();
rollback;
