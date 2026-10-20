-- T41 · ops.rate_limits and api.rate_limit_hit (T29 handoff; BUILD_PLAN §12.8).
-- The edge limiter's shared counter: one row per (bucket, key_hash, window), +1 per hit,
-- service role only, pruned daily. Keys are pseudonyms (64 hex chars), never a phone or an IP.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

select has_table('ops', 'rate_limits', 'ops.rate_limits exists');
select ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'ops.rate_limits'::regclass),
  'RLS is enabled on ops.rate_limits'
);
select ok(
  has_function_privilege('service_role', 'api.rate_limit_hit(text, text, timestamptz)', 'EXECUTE'),
  'service_role can call api.rate_limit_hit'
);
select ok(
  not has_function_privilege('anon', 'api.rate_limit_hit(text, text, timestamptz)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'api.rate_limit_hit(text, text, timestamptz)', 'EXECUTE'),
  'anon and authenticated cannot call api.rate_limit_hit'
);
select ok(
  not has_function_privilege('anon', 'ops.rate_limits_prune(interval)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'ops.rate_limits_prune(interval)', 'EXECUTE'),
  'nobody outside the owner can prune'
);

-- Counting ----------------------------------------------------------------------------------
select is(
  api.rate_limit_hit('otp_phone_hour', repeat('a', 64), '2026-10-18 06:00:00+00'),
  1,
  'the first hit in a window counts 1'
);
select is(
  api.rate_limit_hit('otp_phone_hour', repeat('a', 64), '2026-10-18 06:00:00+00'),
  2,
  'the second hit in the same window counts 2'
);
select is(
  api.rate_limit_hit('otp_phone_hour', repeat('a', 64), '2026-10-18 07:00:00+00'),
  1,
  'the next window starts again at 1'
);
select is(
  api.rate_limit_hit('otp_phone_day', repeat('a', 64), '2026-10-18 00:00:00+00'),
  1,
  'buckets count separately'
);
select throws_ok(
  $$select api.rate_limit_hit('otp_phone_hour', '+919900000318', '2026-10-18 06:00:00+00')$$,
  '23514', null,
  'a raw phone number is refused as a key: only a 64-hex pseudonym is stored'
);

-- Pruning ------------------------------------------------------------------------------------
delete from ops.rate_limits;
insert into ops.rate_limits (bucket, key_hash, window_start, count)
values ('otp_phone_hour', repeat('b', 64), now() - interval '3 days', 4),
       ('otp_phone_hour', repeat('b', 64), now() - interval '1 hour', 1);
select is(ops.rate_limits_prune(), 1, 'ops.rate_limits_prune() deletes the window older than 2 days');
select is(
  (select count(*)::integer from ops.rate_limits where key_hash = repeat('b', 64)),
  1,
  'and keeps the recent one'
);

select * from finish();
rollback;
