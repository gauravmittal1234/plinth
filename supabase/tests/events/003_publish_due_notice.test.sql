-- Lead · M2 gate gap 1: ops.publish_due_notice_runs publishes a noticed run on its effective date
-- (migration 20261127000300). On the §5b seed: Aurelia Heights Ph 2's 7-day notice (Elevated →
-- High, sent 18 Oct, effective 25 Oct) and its pending_notice run. Clock rule: ops.now() is
-- frozen; this file moves it with plinth.fixed_now, as 001_events_core.test.sql does.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

update ops.runtime_settings set value = 'test' where key = 'env';

create function pg_temp.aurelia() returns uuid language sql stable as $$
  select id from core.phases where slug = 'aurelia-heights-phase-2'
$$;
create temp table t_due on commit drop as
select n.id as notice, r.id as run,
       (select p.id from core.score_runs p where p.phase_id = r.phase_id and p.status = 'published') as was_published
  from core.band_notices n join core.score_runs r on r.id = n.proposed_run_id
 where n.phase_id = pg_temp.aurelia() and r.status = 'pending_notice' and n.status = 'pending';

select is(
  (select schedule from cron.job where jobname = 'publish-due-notice-runs'),
  '35 18 * * *',
  'pg_cron runs the publish job daily at 18:35 UTC = 00:05 IST'
);
select is((select count(*)::int from t_due), 1, 'the seed has one pending notice with its pending_notice run');

-- 24 Oct, 23:59 IST: not due yet.
select set_config('plinth.fixed_now', '2026-10-24T23:59:00+05:30', true);
select is(ops.publish_due_notice_runs(), 0, '24 Oct: nothing is due, nothing is published');
select is((core.published_run(pg_temp.aurelia())).id, (select was_published from t_due), '...buyers still read the Elevated run');

-- 25 Oct, 00:05 IST: a notice that is held (or withdrawn) is never published by the job.
select set_config('plinth.fixed_now', '2026-10-25T00:05:00+05:30', true);
update core.band_notices set status = 'held' where id = (select notice from t_due);
select is(ops.publish_due_notice_runs(), 0, 'a held notice is not published, even on its effective date');
update core.band_notices set status = 'pending' where id = (select notice from t_due);

select is(ops.publish_due_notice_runs(), 1, '25 Oct 00:05: the job publishes the one due notice');
select results_eq(
  $$select (core.published_run(pg_temp.aurelia())).id, r.published_at, n.status, o.status
      from t_due t join core.score_runs r on r.id = t.run join core.band_notices n on n.id = t.notice
      join core.score_runs o on o.id = t.was_published$$,
  $$select run, '2026-10-25T00:05:00+05:30'::timestamptz, 'effective'::text, 'superseded'::text from t_due$$,
  'the noticed run is published at the job''s time, its notice effective, the Elevated run superseded'
);
select results_eq(
  $$select band::text, from_date, to_date, run_id from core.band_history
     where phase_id = pg_temp.aurelia() and from_date >= '2026-10-14' order by from_date$$,
  $$values ('elevated'::text, '2026-10-14'::date, '2026-10-25'::date, (select was_published from t_due)),
           ('high'::text, '2026-10-25'::date, null::date, (select run from t_due))$$,
  'the band history moves on 25 Oct: Elevated closes, High opens, from the noticed run'
);
select results_eq(
  $$select kind, before ->> 'band', after ->> 'band', run_id from core.events
     where phase_id = pg_temp.aurelia() and occurred_on = '2026-10-25'$$,
  $$select 'band_changed'::text, 'elevated'::text, 'high'::text, run from t_due$$,
  'the same path as any publish: one band_changed event, from the band history'
);
select ok(
  exists (select 1 from comms.outbox where channel = 'revalidate' and basis = 'score_run:' || (select run from t_due)::text)
    and exists (select 1 from comms.outbox o join core.events e on o.dedupe_key like 'alert:' || e.id::text || ':%'
                 where e.phase_id = pg_temp.aurelia() and e.occurred_on = '2026-10-25'),
  '...which queues the page revalidation and fans the alert out'
);

select is(ops.publish_due_notice_runs(), 0, 'running the job again publishes nothing (idempotent)');
select throws_ok(
  format('select ops.publish_score_run(%L::uuid)', (select was_published from t_due)),
  'PT409', null,
  'ops.publish_score_run refuses a run that is not draft or pending_notice'
);

select * from finish();
rollback;
