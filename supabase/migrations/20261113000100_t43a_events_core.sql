-- T43a · Event engine 1/5: the clock helper, the shared event writer, and the
-- QPR filing trigger (DATA_MODEL §2 core.events; fix-since-family.md §1-2).
-- Sources: WORK_BREAKDOWN T43a ("functions and triggers deriving core.events
-- from … filings (filed / late / missing at the due date + 1 via cron) …");
-- DESIGN §5b (QPR dates); T04's core.events table comment (T43a owns the
-- derivation). Every function pins search_path = '' and qualifies every name
-- (BUILD_PLAN §12.2).
--
-- Clock rule (AGENTS.md): an event's detected_at/occurred_on always comes from
-- the fact's own date columns (due_on, filed_on, fetched_at, granted_on, …),
-- never from ops.now(). ops.now() is "today" for the cron sweep's comparison
-- only; it is never written into a row, so seeding a fact out of real time
-- (as the fixtures do) still produces the dates fix-since-family.md expects.

create function ops.ist_noon(p_date date)
returns timestamptz
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select (p_date::timestamp + interval '12 hours') at time zone 'Asia/Kolkata'
$$;
comment on function ops.ist_noon(date) is 'A date-only fact''s detected_at: noon IST on that day, so it reliably falls after an early-morning "last looked" timestamp on the same day and before one later that day.';

-- ---------------------------------------------------------------------------
-- core._emit_event: the one place every trigger in this task writes a row.
-- security definer so a role with no grant on core.events (every role but the
-- function owner; DATA_MODEL "RLS: api-only") can still log a fact it caused.
-- ---------------------------------------------------------------------------
create function core._emit_event(
  p_phase_id uuid,
  p_kind text,
  p_occurred_on date,
  p_detected_at timestamptz,
  p_before jsonb,
  p_after jsonb,
  p_fact_ids uuid[],
  p_run_id uuid default null,
  p_public boolean default true,
  p_summary_text text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into core.events (phase_id, kind, occurred_on, detected_at, public, summary_text, before, after, fact_ids, run_id)
  values (p_phase_id, p_kind, p_occurred_on, p_detected_at, coalesce(p_public, true), p_summary_text,
          p_before, p_after, coalesce(p_fact_ids, '{}'::uuid[]), p_run_id)
  returning id into v_id;
  return v_id;
end
$$;
comment on function core._emit_event(uuid, text, date, timestamptz, jsonb, jsonb, uuid[], uuid, boolean, text) is 'Internal: inserts one core.events row. Called only from the trigger functions in this task, never directly.';

-- ---------------------------------------------------------------------------
-- core.qpr_filings → qpr_filed / qpr_late / qpr_missing.
-- Fires on insert (a pipeline sync that already knows the outcome) and on the
-- status transition an update makes (the cron sweep below: not_yet_due → missing;
-- a late arrival: not_yet_due/missing → late/on_time). before/after carry the
-- built share either side of this filing, the only figure fix-since-family.md
-- quotes ("built 59% → 63%"); nothing else about the filing is invented.
-- ---------------------------------------------------------------------------
create function core.events_from_qpr_filing()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phase_id uuid;
  v_prior_built numeric(5, 2);
  v_kind text;
  v_occurred date;
  v_detected timestamptz;
begin
  if new.status not in ('on_time', 'late', 'missing') then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status is not distinct from new.status then
    return new;
  end if;

  select r.phase_id into v_phase_id from core.rera_registrations r where r.id = new.registration_id;
  if v_phase_id is null then
    return new;
  end if;

  select f.built_pct into v_prior_built
    from core.qpr_filings f
   where f.registration_id = new.registration_id and f.due_on < new.due_on
   order by f.due_on desc
   limit 1;

  if new.status = 'missing' then
    v_kind := 'qpr_missing';
    v_occurred := new.due_on;
    v_detected := ops.ist_noon(new.due_on + 1);
  else
    -- A historical row may carry a status with no filed_on (the exact filing
    -- day was never recorded for an old quarter); due_on is the fact we do have.
    v_kind := case when new.status = 'late' then 'qpr_late' else 'qpr_filed' end;
    v_occurred := coalesce(new.filed_on, new.due_on);
    v_detected := coalesce(new.fetched_at, ops.ist_noon(coalesce(new.filed_on, new.due_on)));
  end if;

  perform core._emit_event(
    p_phase_id := v_phase_id,
    p_kind := v_kind,
    p_occurred_on := v_occurred,
    p_detected_at := v_detected,
    p_before := case when v_prior_built is not null then pg_catalog.jsonb_build_object('built_pct', v_prior_built) else null end,
    p_after := pg_catalog.jsonb_build_object('status', new.status, 'built_pct', new.built_pct, 'quarter', new.quarter, 'days_late', new.days_late),
    p_fact_ids := array[new.id]
  );
  return new;
end
$$;
comment on function core.events_from_qpr_filing() is 'core.qpr_filings AFTER INSERT OR UPDATE: logs qpr_filed/qpr_late/qpr_missing on a status change (DATA_MODEL §2).';

create trigger qpr_filings_events
  after insert or update on core.qpr_filings
  for each row execute function core.events_from_qpr_filing();

-- ---------------------------------------------------------------------------
-- The daily sweep (brief: "missing at the due date + 1 via cron"). Flips a
-- not_yet_due filing to missing once its due date has passed; the trigger
-- above then logs the event the same way it would for a pipeline-synced row.
-- Scheduled by a separate migration (cron.schedule needs the real pg_cron
-- extension, unavailable in the PGlite check).
-- ---------------------------------------------------------------------------
create function ops.sweep_qpr_missing()
returns integer
language sql
volatile
security definer
set search_path = ''
as $$
  with updated as (
    update core.qpr_filings
       set status = 'missing'
     where status = 'not_yet_due'
       and due_on < ops.today()
    returning 1
  )
  select pg_catalog.count(*)::integer from updated
$$;
comment on function ops.sweep_qpr_missing() is 'Daily cron job: not_yet_due QPRs whose due date has passed become missing, which logs a qpr_missing event through qpr_filings_events. Returns the number of filings swept.';

grant execute on function ops.sweep_qpr_missing() to pipeline_writer;
