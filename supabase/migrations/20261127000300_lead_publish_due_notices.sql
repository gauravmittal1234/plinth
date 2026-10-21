-- Lead · M2 gate gap 1 (T59, PR #89): nothing published a noticed run on its effective date.
--
-- The 7-day notice (PRD §6.2; DESIGN §5b: Aurelia Elevated → High, sent 18 Oct, effective
-- 25 Oct) parks the proposed run as `pending_notice`. pipeline_writer can never publish
-- (DATA_MODEL §12 inv. 6; pipelines/plinth/core/db.py), so the database owns the publish:
-- ops.publish_due_notice_runs() runs daily just after midnight IST (pg_cron) and publishes
-- every pending_notice run whose notice is still pending and effective_on <= today (IST).
--
-- A notice that no longer holds (DESIGN §5b: "if the Jul–Sep QPR lands before 25 Oct, the
-- proposal is withdrawn") is settled before that: pipelines/plinth/scoring/runs.py's
-- settle_notice re-scores, and a "withdrawn" answer moves the notice off `pending` (methodology
-- or admin), so this job never sees it. Only status = 'pending' notices publish here.
--
-- ops.publish_score_run(run) is the one publish path: the phase's published run is superseded,
-- this run is published at ops.now(), and core.band_history moves on today. Those writes fire
-- the existing triggers, exactly as any publish does:
--   core.score_runs  → ops.on_run_published   → comms.outbox revalidate job (T43b)
--   core.band_history → core.events_from_band_history → core.events band_changed (T43a)
--                     → ops.fan_out_on_event → comms.outbox alerts (T43b, this batch's 000400)
-- Every function pins search_path = '' and qualifies every name (BUILD_PLAN §12.2).

create function ops.publish_score_run(p_run_id uuid)
returns core.score_runs
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_run core.score_runs;
  v_today date := ops.ist_date(ops.now());
begin
  select r.* into v_run from core.score_runs r where r.id = p_run_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'ops.publish_score_run: no such run';
  end if;
  if v_run.status not in ('draft', 'pending_notice') then
    raise exception using errcode = 'PT409',
      message = pg_catalog.format('ops.publish_score_run: a %s run cannot be published', v_run.status);
  end if;

  -- One published run per phase (score_runs_one_published_key): the current one steps aside.
  update core.score_runs r
     set status = 'superseded'
   where r.phase_id = v_run.phase_id and r.status = 'published' and r.id <> v_run.id;

  update core.score_runs r
     set status = 'published', published_at = ops.now()
   where r.id = v_run.id
  returning * into v_run;

  -- The replay: close the open segment today, open the new band from today. The new segment's
  -- insert is what logs band_changed (and so fans out) when the band or state moved.
  update core.band_history h
     set to_date = v_today
   where h.phase_id = v_run.phase_id and h.to_date is null;
  insert into core.band_history (phase_id, band, state, confidence, from_date, run_id, model_version)
  values (v_run.phase_id, v_run.band, v_run.state, v_run.confidence, v_today, v_run.id, v_run.model_version);

  return v_run;
end
$$;
comment on function ops.publish_score_run(uuid) is 'The one publish path for a score run: supersedes the phase''s published run, publishes this one at ops.now(), and moves core.band_history on today. Its writes fire the revalidate job and, on a band change, the band_changed event and the alert fan-out.';

create function ops.publish_due_notice_runs()
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_today date := ops.ist_date(ops.now());
  v_due record;
  v_n integer := 0;
begin
  for v_due in
    select n.id as notice_id, r.id as run_id
      from core.band_notices n
      join core.score_runs r on r.id = n.proposed_run_id
     where n.status = 'pending'
       and r.status = 'pending_notice'
       and n.effective_on is not null
       and n.effective_on <= v_today
     order by n.effective_on, n.sent_at, n.id
       for update of n
  loop
    perform ops.publish_score_run(v_due.run_id);
    update core.band_notices n set status = 'effective' where n.id = v_due.notice_id;
    v_n := v_n + 1;
  end loop;
  return v_n;
end
$$;
comment on function ops.publish_due_notice_runs() is 'pg_cron, daily 00:05 IST: publishes every pending_notice run whose notice is still pending and effective_on <= today (IST) through ops.publish_score_run, and marks the notice effective. Returns how many it published. Idempotent: a published run is no longer pending_notice.';

revoke all on function ops.publish_score_run(uuid) from public, anon, authenticated;
revoke all on function ops.publish_due_notice_runs() from public, anon, authenticated;
grant execute on function ops.publish_score_run(uuid) to service_role;
grant execute on function ops.publish_due_notice_runs() to service_role;

-- pg_cron runs in UTC: 18:35 UTC = 00:05 IST, just after the effective date begins.
do $$
begin
  if pg_catalog.to_regnamespace('cron') is not null then
    execute $sql$select cron.schedule('publish-due-notice-runs', '35 18 * * *', $c$select ops.publish_due_notice_runs()$c$)$sql$;
  end if;
end
$$;
