-- T43b · Alert fan-out 1/5: the two event kinds T43a left out that already have
-- backing data (brief handoff 1): oc_granted (core.completion_events, R1·M0) and
-- cirp_admitted (core.insolvency_events, R1·M0). construction_update is NOT added
-- here: its source table, ws.construction_updates, is R1·M4 and does not exist on
-- this branch yet (no table, no fixture data) — never invent a fact or a table.
-- Same pattern as T43a (20261113000100/200): one AFTER INSERT trigger per source
-- table, calling core._emit_event with dates taken from the row. Every function
-- pins search_path = '' and qualifies every name (BUILD_PLAN §12.2).

-- ---------------------------------------------------------------------------
-- core.completion_events → oc_granted, only for an actual occupation certificate
-- (kind = 'oc'; part_oc and cc have no core.events kind of their own — DATA_MODEL
-- §2 lists only oc_granted, never part_oc_granted or cc_granted).
-- ---------------------------------------------------------------------------
create function core.events_from_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind <> 'oc' or new.granted_on is null then
    return new;
  end if;
  perform core._emit_event(
    p_phase_id := new.phase_id,
    p_kind := 'oc_granted',
    p_occurred_on := new.granted_on,
    p_detected_at := ops.ist_noon(new.granted_on),
    p_before := null,
    p_after := pg_catalog.jsonb_build_object('tower_id', new.tower_id, 'granted_on', new.granted_on),
    p_fact_ids := array[new.id]
  );
  return new;
end
$$;
comment on function core.events_from_completion() is 'core.completion_events AFTER INSERT: logs oc_granted for an occupation certificate (kind=oc). part_oc and cc carry no core.events kind of their own.';

create trigger completion_events_events
  after insert on core.completion_events
  for each row execute function core.events_from_completion();

-- ---------------------------------------------------------------------------
-- core.insolvency_events → cirp_admitted, only for kind = 'admitted' (petition,
-- withdrawn and resolved carry no core.events kind of their own). Developer-level
-- fact: every phase under that developer gets its own event row, since
-- core.events.phase_id is not null and a follow/alert is per phase.
-- ---------------------------------------------------------------------------
create function core.events_from_insolvency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phase_id uuid;
begin
  if new.kind <> 'admitted' then
    return new;
  end if;
  for v_phase_id in
    select p.id from core.phases p where p.promoter_id = new.developer_id
  loop
    perform core._emit_event(
      p_phase_id := v_phase_id,
      p_kind := 'cirp_admitted',
      p_occurred_on := new.event_on,
      p_detected_at := ops.ist_noon(new.event_on),
      p_before := null,
      p_after := pg_catalog.jsonb_build_object('forum', new.forum, 'case_ref', new.case_ref),
      p_fact_ids := array[new.id]
    );
  end loop;
  return new;
end
$$;
comment on function core.events_from_insolvency() is 'core.insolvency_events AFTER INSERT: logs cirp_admitted (kind=admitted only) on every phase of the admitted developer (Laurel, via the Elmstone group).';

create trigger insolvency_events_events
  after insert on core.insolvency_events
  for each row execute function core.events_from_insolvency();
