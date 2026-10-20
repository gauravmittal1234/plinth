-- T43a · Event engine 3/5: band changes and re-score starts (DATA_MODEL §2;
-- WORK_BREAKDOWN T43a: "functions and triggers deriving core.events from
-- published runs (band_changed) … and re-score starts").
--
-- band_changed is derived from core.band_history, not from core.score_runs.status:
-- a run can be inserted already superseded (a bulk historical load, as the §5b
-- seed does), so there is no moment where a trigger would see it pass through
-- "published". core.band_history's from_date/to_date segments are gapless and
-- non-overlapping (seed/002_scoring.test.sql), so comparing a new segment with
-- the one immediately before it is a reliable, fact-only way to tell a real
-- band change from a same-band re-score (every phase but Aurelia was re-run
-- under v1.2 on 14 Oct 2026 with no band change at all).

create function core.events_from_band_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prior_band core.band;
  v_prior_state core.score_state;
  v_detected timestamptz;
begin
  select h.band, h.state into v_prior_band, v_prior_state
    from core.band_history h
   where h.phase_id = new.phase_id and h.to_date = new.from_date;

  if not found then
    return new; -- the phase's first scored segment: an initial state, not a change.
  end if;
  if v_prior_band is not distinct from new.band and v_prior_state is not distinct from new.state then
    return new; -- same band (and state): a re-score, not a change.
  end if;

  select r.published_at into v_detected from core.score_runs r where r.id = new.run_id;

  perform core._emit_event(
    p_phase_id := new.phase_id,
    p_kind := 'band_changed',
    p_occurred_on := new.from_date,
    p_detected_at := coalesce(v_detected, ops.ist_noon(new.from_date)),
    p_before := pg_catalog.jsonb_build_object('band', v_prior_band, 'state', v_prior_state),
    p_after := pg_catalog.jsonb_build_object('band', new.band, 'state', new.state),
    p_fact_ids := case when new.run_id is not null then array[new.run_id] else '{}'::uuid[] end,
    p_run_id := new.run_id
  );
  return new;
end
$$;
comment on function core.events_from_band_history() is 'core.band_history AFTER INSERT: logs band_changed when the new segment''s band/state differs from the segment it follows (Aurelia: Moderate → Elevated, 2 Oct 2026).';

create trigger band_history_events
  after insert on core.band_history
  for each row execute function core.events_from_band_history();

-- ---------------------------------------------------------------------------
-- core.score_runs → rescore_started, on a fresh draft run (a re-score in
-- progress; the firewall keeps the draft itself hidden from buyers, DATA_MODEL
-- §12 inv. 2 — this event only announces that a re-score has begun).
-- ---------------------------------------------------------------------------
create function core.events_from_rescore_start()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'draft' then
    return new;
  end if;
  perform core._emit_event(
    p_phase_id := new.phase_id,
    p_kind := 'rescore_started',
    p_occurred_on := (new.computed_at at time zone 'Asia/Kolkata')::date,
    p_detected_at := new.computed_at,
    p_before := null,
    p_after := pg_catalog.jsonb_build_object('model_version', new.model_version, 'data_cutoff', new.data_cutoff),
    p_fact_ids := array[new.id],
    p_run_id := new.id,
    p_public := false
  );
  return new;
end
$$;
comment on function core.events_from_rescore_start() is 'core.score_runs AFTER INSERT: logs rescore_started for a fresh draft run. public = false: a re-score in progress is not itself a published fact (DATA_MODEL §12 inv. 2).';

create trigger score_runs_rescore_events
  after insert on core.score_runs
  for each row execute function core.events_from_rescore_start();
