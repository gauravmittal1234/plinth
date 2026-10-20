-- T60 · M3 checks 3/4: the pgmq queue `doc_checks` (BUILD_PLAN §5.4: "pgmq queues hold
-- doc-checks and fan-out"; WORK_BREAKDOWN T76: start enqueues, pg_cron drains it so a dropped
-- EdgeRuntime.waitUntil still finishes).
--
-- pgmq is installed by T04 (20261020000100) on Supabase. PGlite has only a stub pgmq.create
-- (supabase/tests/shim), so there this block calls the stub and nothing is created; where pgmq
-- is absent altogether it is a no-op, as T53 does for `storage`. Creating the queue twice is
-- avoided by checking for its table first. No client role may touch the queue tables: the edge
-- reaches the queue with the secret key only (the RPCs for that are T68's; see the PR handoff).

do $$
begin
  if pg_catalog.to_regprocedure('pgmq.create(text)') is null then
    raise notice 'T60: no pgmq here; the doc_checks queue is created on Supabase only';
    return;
  end if;

  if pg_catalog.to_regclass('pgmq.q_doc_checks') is null then
    perform pgmq.create('doc_checks');
  end if;

  if pg_catalog.to_regclass('pgmq.q_doc_checks') is not null then
    execute 'revoke all on table pgmq.q_doc_checks from public, anon, authenticated';
  end if;
  if pg_catalog.to_regclass('pgmq.a_doc_checks') is not null then
    execute 'revoke all on table pgmq.a_doc_checks from public, anon, authenticated';
  end if;
end
$$;
