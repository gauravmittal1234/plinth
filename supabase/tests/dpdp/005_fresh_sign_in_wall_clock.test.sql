-- Lead (M2 gate, auth batch) · The fresh sign-in check behind account deletion and the export
-- download (app.dpdp_fresh_sign_in, used by api.dpdp_erasure_confirm and api.dpdp_export_link)
-- measures a sign-in code's age on the wall clock (pg_catalog.now()), never on the business
-- clock (ops.now()). A token's freshness is a security window; the business clock is frozen at
-- 18 Oct 2026 in test and fixture environments (plinth-dev), where it would refuse every real
-- code. The window stays 10 minutes (60 s skew). The edge's own look (requireFreshSignIn) is
-- Deno-tested on the wall clock in delete-account/logic.test.ts and export-data/logic.test.ts.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- Claims for Rohan, signed in with a code p_age_s seconds ago (wall time; the JWT's amr).
create function pg_temp.code_age(p_age_s numeric) returns text language sql volatile as $$
  select set_config('request.jwt.claims', json_build_object(
    'sub', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'role', 'authenticated',
    'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint - p_age_s))
  )::text, true)
$$;
-- Claims for Rohan, signed in with a code stamped at the business clock's "now".
create function pg_temp.code_at_business_now() returns text language sql volatile as $$
  select set_config('request.jwt.claims', json_build_object(
    'sub', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'role', 'authenticated',
    'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from ops.now())::bigint))
  )::text, true)
$$;

-- 1. The business clock frozen at 18 Oct 2026 (env test), days behind the wall clock.
update ops.runtime_settings set value = 'test' where key = 'env';
select ok(ops.now() < now() - interval '11 minutes', 'the business clock is frozen, more than 10 minutes behind the wall clock');
select pg_temp.code_age(120);
select ok(app.dpdp_fresh_sign_in(), 'frozen business clock: a code from 2 minutes ago is fresh');
select pg_temp.code_age(7200);
select ok(not app.dpdp_fresh_sign_in(), 'frozen business clock: a code from 2 hours ago is not');
select pg_temp.code_at_business_now();
select ok(not app.dpdp_fresh_sign_in(), 'a code stamped at the business clock''s "now" is days old on the wall clock: not fresh');

-- 2. The business clock ahead of the wall clock (a test advancing plinth.fixed_now).
select set_config('plinth.fixed_now', (now() + interval '3 hours')::text, true);
select pg_temp.code_age(120);
select ok(app.dpdp_fresh_sign_in(), 'business clock ahead: a code from 2 minutes ago is still fresh');
select pg_temp.code_age(7200);
select ok(not app.dpdp_fresh_sign_in(), 'business clock ahead: a code from 2 hours ago is still not');
select set_config('plinth.fixed_now', '', true);

-- 3. The live clock (env prod: ops.now() is now()). Same answers.
update ops.runtime_settings set value = 'prod' where key = 'env';
select pg_temp.code_age(120);
select ok(app.dpdp_fresh_sign_in(), 'live clock: a code from 2 minutes ago is fresh');
select pg_temp.code_age(7200);
select ok(not app.dpdp_fresh_sign_in(), 'live clock: a code from 2 hours ago is not');

-- 4. Deletion itself, under the frozen clock: Rohan's own erasure request, confirmed only with
--    a fresh code.
update ops.runtime_settings set value = 'test' where key = 'env';
set local role authenticated;
select pg_temp.code_age(7200);
select set_config('t.req', api.account_delete_request() ->> 'request_id', true);
select set_config('t.stale', api.dpdp_erasure_confirm(current_setting('t.req')::uuid)::text, true);
reset role;
select is(current_setting('t.stale')::jsonb ->> 'status', 'sign_in_required', 'deletion with a 2-hour-old code: asks for a fresh code');
select is(
  (select count(*)::int from app.dpdp_erasure_confirmations where request_id = current_setting('t.req')::uuid),
  0,
  'and records no confirmation'
);

set local role authenticated;
select pg_temp.code_age(120);
select set_config('t.fresh', api.dpdp_erasure_confirm(current_setting('t.req')::uuid)::text, true);
reset role;
select set_config('request.jwt.claims', '', true);
select is(current_setting('t.fresh')::jsonb ->> 'status', 'confirmed', 'deletion with a 2-minute-old code: confirmed, though the business clock reads 18 Oct');
select is(
  (select count(*)::int from app.dpdp_erasure_confirmations where request_id = current_setting('t.req')::uuid),
  1,
  'one confirmation on record'
);

select * from finish();
rollback;
