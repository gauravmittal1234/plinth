-- T41 · Auth 2/2: shared rate-limit counters (T29 handoff; BUILD_PLAN §12.8; DATA_MODEL §10).
--
-- The edge rate limiter (_shared/core/ratelimit.ts, rpcRateLimitStore) counts hits per
-- (bucket, key_hash, fixed window) here, so every isolate shares one count. auth-sms-hook uses
-- it per phone number (buckets otp_phone_hour, otp_phone_day); per-IP limits on sign-in are
-- Auth's own ([auth.rate_limit] in config.toml). Other functions add their own buckets.
--
-- key_hash is an HMAC pseudonym keyed by PLINTH_HASH_SALT: the phone, IP or user id is never
-- stored. Windows are wall time (pg_catalog.now()), never the frozen business clock.
-- api.rate_limit_hit is service-role only; nothing here is reachable by anon or authenticated.

create table ops.rate_limits (
  bucket text not null check (bucket ~ '^[a-z][a-z0-9_.:-]{1,63}$'),
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  window_start timestamptz not null,
  count integer not null default 0 check (count >= 0),
  primary key (bucket, key_hash, window_start)
);
create index rate_limits_window_start_idx on ops.rate_limits (window_start);
alter table ops.rate_limits enable row level security;

comment on table ops.rate_limits is 'Fixed-window rate-limit counters for edge functions (T29 ratelimit.ts). Service role only, through api.rate_limit_hit. Pruned daily by ops.rate_limits_prune().';
comment on column ops.rate_limits.bucket is 'pii:C0';
comment on column ops.rate_limits.key_hash is 'pii:C1 (HMAC pseudonym of a phone, IP or user id; keyed by PLINTH_HASH_SALT)';
comment on column ops.rate_limits.window_start is 'pii:C0';
comment on column ops.rate_limits.count is 'pii:C0';

-- One hit: adds 1 to the window's count and returns the new count.
create function api.rate_limit_hit(p_bucket text, p_key_hash text, p_window_start timestamptz)
returns integer
language sql
volatile
security definer
set search_path = ''
as $$
  insert into ops.rate_limits as r (bucket, key_hash, window_start, count)
  values (p_bucket, p_key_hash, p_window_start, 1)
  on conflict (bucket, key_hash, window_start) do update set count = r.count + 1
  returning r.count
$$;
comment on function api.rate_limit_hit(text, text, timestamptz) is
  'Edge rate limiter (service role only): +1 on (bucket, key_hash, window_start), returns the count.';

-- Windows older than the longest rule (1 day) plus a margin are dropped.
create function ops.rate_limits_prune(p_older_than interval default interval '2 days')
returns integer
language sql
volatile
security definer
set search_path = ''
as $$
  with gone as (
    delete from ops.rate_limits
    where window_start < pg_catalog.now() - p_older_than
    returning 1
  )
  select count(*)::integer from gone
$$;
comment on function ops.rate_limits_prune(interval) is
  'Deletes rate-limit windows older than p_older_than (default 2 days). Scheduled daily (pg_cron job ops_rate_limits_prune).';

-- Explicit grants only (no schema-wide sweep: earlier api grants must survive this file).
revoke all on table ops.rate_limits from public, anon, authenticated;
revoke all on function api.rate_limit_hit(text, text, timestamptz) from public, anon, authenticated;
revoke all on function ops.rate_limits_prune(interval) from public, anon, authenticated;
grant execute on function api.rate_limit_hit(text, text, timestamptz) to service_role;

select cron.schedule('ops_rate_limits_prune', '17 3 * * *', 'select ops.rate_limits_prune()');
