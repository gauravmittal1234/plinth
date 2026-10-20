-- T43b · Alert fan-out 4/5: api.following_feed and api.mark_following_seen
-- (API_CONTRACTS §4.8; WORK_BREAKDOWN T43b; fix-since-family.md §1 "the following
-- feed lists changes newest first", INTEGRATION_NOTES). Reuses T12/T13's helpers
-- wherever the shape already exists (core.phase_view for the chip, core.
-- risk_progress for the freshness line, core.source_refs/core.fact_source_label
-- for sources, core.developer_says_for_fact, core.band_label, core.list_join,
-- ops.fmt_quarter/fmt_date/fmt_month) instead of recomposing them (AGENTS rule 10:
-- every line is read from the row's own facts, never a §5b worked example).
--
-- order_decided has a core.events kind and a trigger (T43a, core.events_from_
-- order on core.orders), but core.orders carries no seed rows yet (R1 data
-- awaits the pipeline); the complaint count buyers see instead comes from a
-- core.facts supersession chain (attribute orders.complaints_against_promoter_
-- 24m). core.following_fact_changes bridges that chain into the feed so a real,
-- dated change (13 → 14 complaints, 9 Oct 2026) is not silently dropped; once
-- T18/the pipeline populates core.orders this bridge and the trigger will both
-- fire for the same fact and should be reconciled (PR Handoff).

-- ---------------------------------------------------------------------------
-- Kind labels (summary_line's natural-language count list).
-- ---------------------------------------------------------------------------
create function core.following_count_label(p_kind text, p_n integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select p_n || ' ' || case
    when p_kind = 'band_changed' then 'band move' || case when p_n = 1 then '' else 's' end
    when p_kind = 'qpr_late' then 'late filing' || case when p_n = 1 then '' else 's' end
    when p_kind = 'qpr_filed' then 'filing on time' || case when p_n = 1 then '' else 's' end
    when p_kind = 'qpr_missing' then 'missing filing' || case when p_n = 1 then '' else 's' end
    when p_kind = 'extension_granted' then 'extension' || case when p_n = 1 then '' else 's' end
    when p_kind = 'order_decided' then 'order' || case when p_n = 1 then '' else 's' end
    when p_kind = 'price_list_published' then 'price change' || case when p_n = 1 then '' else 's' end
    when p_kind = 'oc_granted' then 'occupation certificate' || case when p_n = 1 then '' else 's' end
    when p_kind = 'cirp_admitted' then 'insolvency filing' || case when p_n = 1 then '' else 's' end
    else 'change' || case when p_n = 1 then '' else 's' end
  end
$$;
comment on function core.following_count_label(text, integer) is 'summary_line''s per-kind count phrase: "1 extension", "2 missing filings".';

-- The fixed (not chronological) order summary_line lists kinds in.
create function core.following_kind_rank(p_kind text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_kind
    when 'band_changed' then 1
    when 'extension_granted' then 2
    when 'qpr_filed' then 3
    when 'qpr_late' then 4
    when 'qpr_missing' then 5
    when 'price_list_published' then 6
    when 'order_decided' then 7
    when 'oc_granted' then 8
    when 'cirp_admitted' then 9
    else 10
  end
$$;

-- ---------------------------------------------------------------------------
-- core.following_fact_changes: synthesized ChangeItems for a fact-level change
-- that has no core.events row to read (today, only the complaint-count
-- supersession — see the header). Same ChangeItem shape as core.events rows.
-- ---------------------------------------------------------------------------
create function core.following_fact_changes(p_phase_ids uuid[], p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(pg_catalog.jsonb_agg(
    pg_catalog.jsonb_build_object(
      'event_id', f.id,
      'slug', ph.slug,
      'kind', 'order_decided',
      'occurred_on', f.as_of,
      'line', 'One more complaint decided against the promoter. That makes '
        || (f.value ->> 'count') || ' in 24 months · ' || (f.value ->> 'per_100_units') || ' per 100 units.'
        || coalesce(' Median count for similar projects: ' || (f.value ->> 'median_count_similar') || '.', ''),
      'before_pill', prior.value ->> 'count',
      'after_pill', f.value ->> 'count',
      'developer_says', null,
      'sources', core.source_refs(array[f.id], (core.phase_registration(ph.id)).official_url),
      '_detected_at', f.learned_at
    )
    order by f.learned_at desc
  ), '[]'::jsonb)
  from core.facts f
  join core.phases ph on ph.id = f.subject_id and f.subject_type = 'phase'
  left join core.facts prior on prior.superseded_by = f.id
  where ph.id = any (p_phase_ids)
    and f.attribute = 'orders.complaints_against_promoter_24m'
    and f.superseded_by is null
    and prior.id is not null
    and f.learned_at > p_from
    and f.learned_at <= p_to
$$;
comment on function core.following_fact_changes(uuid[], timestamptz, timestamptz) is 'order_decided ChangeItems bridged from the orders.complaints_against_promoter_24m supersession chain (see header); only a fact that actually superseded an earlier count, so a phase''s first-ever count never shows as a change.';

-- ---------------------------------------------------------------------------
-- core.following_change_item: one event → one ChangeItem. Scalar parameters
-- (not a core.events row) so the caller never needs a risky record→composite
-- cast when the source query also carries the phase's slug and registration.
-- ---------------------------------------------------------------------------
create function core.following_change_item(
  p_event_id uuid,
  p_kind text,
  p_occurred_on date,
  p_detected_at timestamptz,
  p_before jsonb,
  p_after jsonb,
  p_run_id uuid,
  p_phase_id uuid,
  p_slug text,
  p_reg_id uuid,
  p_official_url text
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_quarter text := p_after ->> 'quarter';
  v_line text;
  v_before_pill text;
  v_after_pill text;
  v_fact_ids uuid[] := '{}'::uuid[];
  v_developer_says jsonb;
  v_notice core.band_notices%rowtype;
  v_due date;
  v_rescore_hours integer;
  v_pending boolean;
  v_run_computed_at timestamptz;
  v_qpr_fact uuid;
  v_progress_fact uuid;
  v_time_used numeric;
  v_reg_registered_on date;
  v_reg_original_completion date;
  v_ext_count integer;
  v_price_list_id uuid;
  v_all_in_fact uuid;
  v_all_in_value jsonb;
  v_quoted_value jsonb;
  v_sources jsonb;
  v_other_missing text[];
  v_latest_filed_on date;
  v_unit_id uuid;
  v_unit_label text;
  v_after_price bigint;
  v_before_price bigint;
  v_fact_id uuid;
begin
  if p_kind = 'band_changed' then
    select n.* into v_notice
    from core.score_runs r
    join core.band_notices n on n.id = r.notice_id
    where r.id = p_run_id;
    v_line := 'Delivery risk moved from ' || core.band_label(p_before ->> 'band')
      || ' to ' || core.band_label(p_after ->> 'band')
      || case when v_notice.reason_text is not null
           then '. The trigger: ' || core.lower_first(v_notice.reason_text)
           else '.' end;
    v_before_pill := core.band_label(p_before ->> 'band');
    v_after_pill := core.band_label(p_after ->> 'band');
    v_fact_ids := coalesce(v_notice.trigger_fact_ids, '{}'::uuid[]);

  elsif p_kind in ('qpr_filed', 'qpr_late') then
    select f.id into v_qpr_fact from core.facts f
    where f.subject_type = 'registration' and f.subject_id = p_reg_id
      and f.attribute = 'qpr.filing_status' and f.value ->> 'quarter' = v_quarter
      and f.superseded_by is null
    order by f.learned_at desc limit 1;
    if v_qpr_fact is not null then
      v_fact_ids := array[v_qpr_fact];
      v_developer_says := case when core.developer_says_for_fact(v_qpr_fact) is not null then pg_catalog.jsonb_build_object('line', core.developer_says_for_fact(v_qpr_fact) ->> 'line') end;
    end if;

    select r.computed_at into v_run_computed_at
    from core.score_runs r
    where r.phase_id = p_phase_id and r.status = 'published'
    order by r.published_at desc nulls last limit 1;
    v_pending := v_run_computed_at is null or p_detected_at > v_run_computed_at;

    if v_pending then
      select (m.config ->> 'rescore_hours')::integer into v_rescore_hours
      from core.score_runs r join core.score_models m on m.version = r.model_version
      where r.phase_id = p_phase_id and r.status = 'published'
      order by r.published_at desc nulls last limit 1;
      v_rescore_hours := coalesce(v_rescore_hours, 72);

      select q.due_on into v_due from core.qpr_filings q
      where q.registration_id = p_reg_id and q.quarter = v_quarter;

      v_before_pill := 'Due ' || core.fmt_day_month(v_due);
      v_after_pill := 'Filed ' || core.fmt_day_month(p_occurred_on)
        || case when p_kind = 'qpr_late' then ', ' || (p_after ->> 'days_late') || ' days late' else ', on time' end;
      v_line := 'The ' || ops.fmt_quarter(v_quarter) || ' QPR was filed '
        || case when p_kind = 'qpr_late' then (p_after ->> 'days_late') || ' days late' else 'on time' end
        || ' on ' || core.fmt_day_month(p_occurred_on) || ' and is on HARERA since '
        || core.fmt_day_month(ops.ist_date(p_detected_at)) || '. We update the band by '
        || ops.fmt_date(ops.ist_date(p_detected_at + pg_catalog.make_interval(hours => v_rescore_hours)))
        || ', ' || core.fmt_clock(p_detected_at + pg_catalog.make_interval(hours => v_rescore_hours)) || '.';
    else
      v_before_pill := case when p_before ->> 'built_pct' is not null
        then core.fmt_num((p_before ->> 'built_pct')::numeric) || '%' end;
      v_after_pill := case when p_after ->> 'built_pct' is not null
        then core.fmt_num((p_after ->> 'built_pct')::numeric) || '%' end;

      -- time_used_pct: the stored column when the pipeline filled it, else the
      -- same month-based fallback core.risk_progress uses, evaluated as of
      -- this filing's own date (not today).
      select q.time_used_pct, r.registered_on, r.original_completion
        into v_time_used, v_reg_registered_on, v_reg_original_completion
      from core.qpr_filings q
      join core.rera_registrations r on r.id = q.registration_id
      where q.registration_id = p_reg_id and q.quarter = v_quarter;
      if v_time_used is null and v_reg_registered_on is not null and v_reg_original_completion is not null then
        v_time_used := pg_catalog.round(100.0 * (core.month_index(p_occurred_on) - core.month_index(v_reg_registered_on))
          / nullif(core.month_index(v_reg_original_completion) - core.month_index(v_reg_registered_on), 0));
      end if;

      select f.id into v_progress_fact from core.facts f
      where f.subject_type = 'registration' and f.subject_id = p_reg_id
        and f.attribute = 'qpr.progress' and f.value ->> 'quarter' = v_quarter
        and f.superseded_by is null
      order by f.learned_at desc limit 1;
      if v_progress_fact is not null then
        v_fact_ids := v_fact_ids || v_progress_fact;
      end if;

      v_line := 'The ' || ops.fmt_quarter(v_quarter) || ' QPR was filed '
        || case when p_kind = 'qpr_late' then (p_after ->> 'days_late') || ' days late' else 'on time' end
        || case when p_after ->> 'built_pct' is not null
             then ': ' || core.fmt_num((p_after ->> 'built_pct')::numeric) || '% built'
             else '' end
        || case when v_time_used is not null then ', ' || core.fmt_num(v_time_used) || '% of the promised time used' else '' end
        || '.';
    end if;

  elsif p_kind = 'qpr_missing' then
    select f.id into v_qpr_fact from core.facts f
    where f.subject_type = 'registration' and f.subject_id = p_reg_id
      and f.attribute = 'qpr.missing' and f.value ->> 'quarter' = v_quarter
      and f.superseded_by is null
    order by f.learned_at desc limit 1;
    if v_qpr_fact is not null then
      v_fact_ids := array[v_qpr_fact];
      v_developer_says := case when core.developer_says_for_fact(v_qpr_fact) is not null then pg_catalog.jsonb_build_object('line', core.developer_says_for_fact(v_qpr_fact) ->> 'line') end;
    end if;
    select q.due_on into v_due from core.qpr_filings q
    where q.registration_id = p_reg_id and q.quarter = v_quarter;
    v_due := coalesce(v_due, p_occurred_on);
    v_before_pill := 'Due ' || core.fmt_day_month(v_due);
    v_after_pill := 'Not on HARERA as of ' || core.fmt_day_month(ops.today());
    v_line := 'The ' || ops.fmt_quarter(v_quarter) || ' QPR is not on HARERA yet. It was due '
      || ops.fmt_date(v_due) || '.';

    -- Another currently-missing quarter on the same registration: say so, and
    -- how old the newest real figures now are (the latest filing with built_pct).
    select pg_catalog.array_agg(q2.quarter order by q2.quarter) into v_other_missing
    from core.qpr_filings q2
    where q2.registration_id = p_reg_id and q2.status = 'missing' and q2.due_on <= ops.today() and q2.quarter <> v_quarter;
    if v_other_missing is not null and pg_catalog.cardinality(v_other_missing) > 0 then
      select q3.filed_on into v_latest_filed_on from core.qpr_filings q3
      where q3.registration_id = p_reg_id and q3.built_pct is not null
      order by q3.quarter desc limit 1;
      if v_latest_filed_on is not null then
        v_line := v_line || ' The ' || pg_catalog.split_part(ops.fmt_quarter(v_other_missing[1]), ' ', 1)
          || ' QPR is missing too, so the newest figures are '
          || (ops.today() - v_latest_filed_on) || ' days old.';
      end if;
    end if;

  elsif p_kind = 'extension_granted' then
    v_before_pill := case when p_before ->> 'to_completion' is not null
      then ops.fmt_month((p_before ->> 'to_completion')::date) end;
    v_after_pill := ops.fmt_month((p_after ->> 'to_completion')::date);
    select f.id into v_fact_id from core.facts f
    where f.subject_type = 'registration' and f.subject_id = p_reg_id
      and f.attribute = 'registration.extension' and f.value ->> 'granted' = p_occurred_on::text
      and f.superseded_by is null
    limit 1;
    if v_fact_id is not null then
      v_fact_ids := array[v_fact_id];
    end if;
    select pg_catalog.count(*)::integer into v_ext_count
    from core.extensions e where e.registration_id = p_reg_id and e.granted_on <= p_occurred_on;
    v_line := (select name from core.phases where id = p_phase_id) || ' got '
      || case v_ext_count
           when 1 then 'an extension'
           when 2 then 'a second extension'
           when 3 then 'a third extension'
           when 4 then 'a fourth extension'
           when 5 then 'a fifth extension'
           else 'another extension'
         end
      || ', to ' || v_after_pill || '.';

  elsif p_kind = 'price_list_published' then
    v_price_list_id := (p_after ->> 'price_list_id')::uuid;

    -- The current quoted price is the fact (never a guess at "the" unit from
    -- ws.price_list_items): price.quoted/price.all_in carry the unit and
    -- figures the developer actually quoted.
    select f.id, f.value into v_fact_id, v_quoted_value from core.facts f
    where f.subject_type = 'phase' and f.subject_id = p_phase_id
      and f.attribute = 'price.quoted' and f.superseded_by is null
    order by f.learned_at desc limit 1;

    select f.value into v_all_in_value from core.facts f
    where f.subject_type = 'phase' and f.subject_id = p_phase_id
      and f.attribute = 'price.all_in' and f.superseded_by is null
    order by f.learned_at desc limit 1;

    v_unit_label := v_quoted_value ->> 'unit';
    v_after_price := (v_quoted_value ->> 'base_price_inr')::bigint;

    -- "Before": a superseded price.quoted fact if one exists, else an earlier
    -- published price list for the same unit label.
    select (prior.value ->> 'base_price_inr')::bigint into v_before_price
    from core.facts prior where prior.superseded_by = v_fact_id;
    if v_before_price is null then
      select i.base_price_inr into v_before_price
      from ws.price_lists pl
      join ws.price_list_items i on i.price_list_id = pl.id
      join core.unit_types u on u.id = i.unit_type_id and u.label = v_unit_label
      where pl.phase_id = p_phase_id and pl.status = 'published' and pl.published_on < p_occurred_on
      order by pl.published_on desc
      limit 1;
    end if;

    v_after_pill := ops.fmt_inr_short(v_after_price);
    v_before_pill := case when v_before_price is not null then ops.fmt_inr_short(v_before_price) end;
    v_line := 'New price list from the developer: ' || coalesce(v_unit_label, 'the unit') || ' quoted ' || v_after_pill || '.'
      || case when v_all_in_value is not null
           then ' All-in is now about ' || ops.fmt_inr_short((v_all_in_value ->> 'all_in_inr')::bigint) || '.'
           else '' end;

    v_sources := case when v_fact_id is not null then pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'label', 'Developer price list · ' || ops.fmt_date(p_occurred_on),
      'fact_ids', pg_catalog.jsonb_build_array(v_fact_id),
      'evidence_url', '/evidence/' || v_fact_id,
      'official_url', null,
      'as_of', p_occurred_on
    )) else '[]'::jsonb end;

  else
    v_line := 'Something changed.';
  end if;

  return pg_catalog.jsonb_build_object(
    'event_id', p_event_id,
    'slug', p_slug,
    'kind', p_kind,
    'occurred_on', p_occurred_on,
    'line', v_line,
    'before_pill', v_before_pill,
    'after_pill', v_after_pill,
    'developer_says', v_developer_says,
    'sources', coalesce(v_sources, core.source_refs(v_fact_ids, p_official_url)),
    '_detected_at', p_detected_at
  );
end
$$;
comment on function core.following_change_item(uuid, text, date, timestamptz, jsonb, jsonb, uuid, uuid, text, uuid, text) is 'One core.events row → ChangeItem (API_CONTRACTS §4.8). band_changed cites its core.band_notices.trigger_fact_ids; qpr_*/extension_granted/price_list_published resolve the matching core.facts row by its own natural key (same convention as core.risk_pending). "_detected_at" is stripped before the payload leaves api.following_feed.';

-- ---------------------------------------------------------------------------
-- core.following_changes: every ChangeItem (events + the facts bridge) for a
-- set of phases in a window (p_from, p_to], newest first (INTEGRATION_NOTES
-- "T43b: the following feed lists changes newest first").
-- ---------------------------------------------------------------------------
create function core.following_changes(p_phase_ids uuid[], p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_items jsonb := '[]'::jsonb;
  v_row record;
  v_reg core.rera_registrations%rowtype;
begin
  for v_row in
    select e.id, e.kind, e.occurred_on, e.detected_at, e.before, e.after, e.run_id, e.phase_id, ph.slug
    from core.events e
    join core.phases ph on ph.id = e.phase_id
    where e.phase_id = any (p_phase_ids)
      and e.public
      and e.detected_at > p_from
      and e.detected_at <= p_to
  loop
    v_reg := core.phase_registration(v_row.phase_id);
    v_items := v_items || pg_catalog.jsonb_build_array(
      core.following_change_item(
        v_row.id, v_row.kind, v_row.occurred_on, v_row.detected_at, v_row.before, v_row.after,
        v_row.run_id, v_row.phase_id, v_row.slug, v_reg.id, v_reg.official_url
      )
    );
  end loop;

  v_items := v_items || core.following_fact_changes(p_phase_ids, p_from, p_to);

  return coalesce((
    -- event_id last: two changes found by the same run (same day, same detected_at, e.g. Coral's
    -- and Aurelia's missing Jul-Sep QPRs) must not depend on row order; the ids are stable uuid5s.
    select pg_catalog.jsonb_agg(x.item order by (x.item ->> 'occurred_on')::date desc, (x.item ->> '_detected_at')::timestamptz desc, x.item ->> 'event_id' desc nulls last)
    from pg_catalog.jsonb_array_elements(v_items) as x(item)
  ), '[]'::jsonb);
end
$$;
comment on function core.following_changes(uuid[], timestamptz, timestamptz) is 'Every public ChangeItem for these phases with detected_at in (p_from, p_to], newest first.';

create function core.following_strip_internal(p_items jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(pg_catalog.jsonb_agg(x.item - '_detected_at'), '[]'::jsonb)
  from pg_catalog.jsonb_array_elements(p_items) as x(item)
$$;
comment on function core.following_strip_internal(jsonb) is 'Drops the ordering-only _detected_at key before a ChangeItem[] leaves the api layer.';

-- ---------------------------------------------------------------------------
-- core.following_project_row: one FollowedProject (API_CONTRACTS §4.8).
-- ---------------------------------------------------------------------------
create function core.following_project_row(p_phase_id uuid, p_user_id uuid, p_circle_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_phase core.phases%rowtype;
  v_view jsonb;
  v_follow app.follows%rowtype;
  v_reg core.rera_registrations%rowtype;
  v_latest_qpr jsonb;
  v_freshness text;
  v_row_line text;
  v_family_line text;
  v_missing_quarters text[];
  v_latest_ext core.extensions%rowtype;
  v_ext_count integer;
  v_band_since date;
  v_current_band text;
  v_current_state text;
  v_pending_fetched_at timestamptz;
  v_rescore_hours integer;
  v_prior_band text;
begin
  select * into v_phase from core.phases p where p.id = p_phase_id;
  select * into v_follow from app.follows f where f.phase_id = p_phase_id and f.user_id = p_user_id;
  v_view := core.phase_view(p_phase_id);
  v_reg := core.phase_registration(p_phase_id);
  v_latest_qpr := v_view -> 'progress' -> 'latest_qpr';

  v_freshness := case
    when v_latest_qpr is null then null
    when v_view -> 'overlays' ? 'rescoring' then 'From the ' || (v_latest_qpr ->> 'label') || ' QPR · the new one is being read'
    when v_view -> 'overlays' ? 'stale' then 'From the ' || (v_latest_qpr ->> 'label') || ' QPR · ' || (v_latest_qpr ->> 'age_days') || ' days old'
    else 'From the ' || (v_latest_qpr ->> 'label') || ' QPR'
  end;

  select pg_catalog.array_agg(q.quarter order by q.quarter)
    into v_missing_quarters
  from core.qpr_filings q
  where q.registration_id = v_reg.id and q.status = 'missing' and q.due_on <= ops.today();

  -- The start of the current band's unbroken run (core.band_since already
  -- walks back across same-band re-scores, e.g. Aurelia's v1.1→v1.2 re-run on
  -- 14 Oct that did not change the band), and whatever band preceded it.
  select h.band, h.state into v_current_band, v_current_state
  from core.band_history h where h.phase_id = p_phase_id and h.to_date is null;
  if v_current_band is not null then
    v_band_since := core.band_since(p_phase_id, v_current_band, v_current_state);
    select h2.band into v_prior_band
    from core.band_history h2 where h2.phase_id = p_phase_id and h2.to_date = v_band_since;
  end if;
  if v_prior_band is null or v_prior_band is not distinct from v_current_band then
    v_band_since := null;
  end if;

  select * into v_latest_ext from core.extensions e
  where e.registration_id = v_reg.id
  order by e.granted_on desc nulls last
  limit 1;
  select pg_catalog.count(*)::integer into v_ext_count from core.extensions e where e.registration_id = v_reg.id;

  -- row_line's headline, in priority order: a band move, else an extension,
  -- else a filing pending re-score, else the latest filing's own status.
  if v_band_since is not null then
    v_row_line := 'Was ' || core.band_label(v_prior_band) || ' until ' || core.fmt_day_month(v_band_since);
  elsif v_latest_ext.id is not null then
    v_row_line := 'Extended' || case when v_ext_count > 1 then ' again' else '' end
      || ' on ' || core.fmt_day_month(v_latest_ext.granted_on);
  elsif v_view -> 'overlays' ? 'rescoring' then
    select q.fetched_at into v_pending_fetched_at
    from core.qpr_filings q
    where q.registration_id = v_reg.id
      and q.fetched_at > (v_view ->> 'computed_at')::timestamptz and q.fetched_at <= ops.now()
    order by q.fetched_at desc
    limit 1;
    select (m.config ->> 'rescore_hours')::integer into v_rescore_hours
    from core.score_models m where m.version = v_view ->> 'model_version';
    v_rescore_hours := coalesce(v_rescore_hours, 72);
    v_row_line := 'New QPR in · re-score due by ' || core.fmt_day_month(
      ops.ist_date(coalesce(v_pending_fetched_at, ops.now()) + pg_catalog.make_interval(hours => v_rescore_hours)));
  elsif v_latest_qpr is not null then
    v_row_line := 'QPR filed on time · no band change';
  else
    v_row_line := 'No report with us yet';
  end if;

  if v_missing_quarters is not null and pg_catalog.cardinality(v_missing_quarters) > 0 then
    if pg_catalog.cardinality(v_missing_quarters) = 1 then
      v_row_line := v_row_line || ' · ' || pg_catalog.split_part(ops.fmt_quarter(v_missing_quarters[1]), ' ', 1) || ' QPR not on HARERA yet';
    else
      v_row_line := v_row_line || ' · ' || pg_catalog.cardinality(v_missing_quarters) || ' QPRs missing';
    end if;
  end if;

  select pr.first_name || ' follows too' || case when exists (
      -- A narrowly-scoped pending invite (never a reusable scope_all link, which
      -- names no one project in particular): "her father is invited" to THIS one.
      select 1 from app.family_members m2 where m2.circle_id = p_circle_id and m2.status = 'invited'
        and not m2.scope_all and p_phase_id = any (m2.scope_phase_ids)
    ) then ' · her father is invited' else '' end
  into v_family_line
  from app.family_members m
  join app.profiles pr on pr.id = m.member_user_id
  where m.circle_id = p_circle_id and m.status = 'joined'
    and (m.scope_all or p_phase_id = any (m.scope_phase_ids))
  order by m.joined_at
  limit 1;

  return pg_catalog.jsonb_build_object(
    'slug', v_phase.slug,
    'name', v_phase.name,
    'chip', v_view -> 'chip',
    'follow_type', v_follow.follow_type,
    'row_line', v_row_line,
    'freshness_line', v_freshness,
    'family_line', v_family_line
  );
end
$$;
comment on function core.following_project_row(uuid, uuid, uuid) is 'FollowedProject (API_CONTRACTS §4.8): chip from core.phase_view; row_line''s priority is a band move, else an extension, else a pending re-score, else the latest filing, with the current missing-QPR state folded in. family_line names a joined (or, for the owner''s own invite scope, invited) family circle member.';

-- ---------------------------------------------------------------------------
-- core.following_replay: jump chips and marks (API_CONTRACTS §4.8 Replay).
-- Chips: the last look, the current and previous calendar month's 1st (once
-- reached and not already shown), and the follow date.
-- ---------------------------------------------------------------------------
create function core.following_replay(p_phase_ids uuid[], p_followed_at date, p_since timestamptz)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with bounds as (
    select pg_catalog.date_trunc('month', ops.today())::date as cur_month,
      (pg_catalog.date_trunc('month', ops.today()) - interval '1 month')::date as prev_month,
      case when p_since is not null then ops.ist_date(p_since) end as since_date
  ),
  chips as (
    select 1 as ord, 'Your last look · ' || core.fmt_day_month(b.since_date) as label, b.since_date as date
    from bounds b where b.since_date is not null
    union all
    select 2, core.fmt_day_month(b.cur_month), b.cur_month
    from bounds b where b.cur_month > p_followed_at and b.cur_month is distinct from b.since_date
    union all
    select 3, core.fmt_day_month(b.prev_month), b.prev_month
    from bounds b where b.prev_month > p_followed_at and b.prev_month is distinct from b.since_date
    union all
    select 4, 'When you followed · ' || core.fmt_day_month(p_followed_at), p_followed_at
  ),
  -- Marks: every public core.events row, plus the order_decided facts bridge
  -- (core.following_fact_changes' source query, see that function's header).
  marks as (
    select e.occurred_on as d, e.detected_at as ord, e.kind,
      case when e.kind = 'band_changed' then e.after ->> 'band' end as band
    from core.events e
    where e.phase_id = any (p_phase_ids) and e.public
      and e.detected_at > (p_followed_at::timestamp at time zone 'Asia/Kolkata')
      and e.detected_at <= ops.now()
    union all
    select f.as_of, f.learned_at, 'order_decided', null
    from core.facts f
    join core.phases ph on ph.id = f.subject_id and f.subject_type = 'phase'
    join core.facts prior on prior.superseded_by = f.id
    where ph.id = any (p_phase_ids)
      and f.attribute = 'orders.complaints_against_promoter_24m'
      and f.superseded_by is null
      and f.learned_at > (p_followed_at::timestamp at time zone 'Asia/Kolkata')
      and f.learned_at <= ops.now()
  )
  select pg_catalog.jsonb_build_object(
    'from', p_followed_at,
    'to', ops.today(),
    'jump_chips', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('label', c.label, 'date', c.date) order by c.ord) from chips c), '[]'::jsonb),
    'marks', coalesce((
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('date', m.d, 'kind', m.kind, 'band', m.band) order by m.d, m.ord)
      from marks m
    ), '[]'::jsonb)
  )
$$;
comment on function core.following_replay(uuid[], date, timestamptz) is 'Replay.jump_chips (last look, this month''s and last month''s 1st once past the follow date, when followed) and Replay.marks (every public event since the follow date, plus the order_decided facts bridge).';

-- ---------------------------------------------------------------------------
-- api.following_feed (API_CONTRACTS §4.8).
-- ---------------------------------------------------------------------------
create function api.following_feed(p_since timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_profile app.profiles%rowtype;
  v_since timestamptz;
  v_phase_ids uuid[];
  v_followed_at date;
  v_changes jsonb;
  v_record jsonb;
  v_quiet jsonb;
  v_projects jsonb;
  v_replay jsonb;
  v_digest jsonb;
  v_counts text[];
  v_total integer;
  v_band_moved boolean;
  v_summary text;
  v_circle_id uuid;
  v_digest_sub app.alert_subscriptions%rowtype;
  v_floor_from timestamptz;
begin
  if v_user is null or coalesce(auth.role(), '') <> 'authenticated' then
    perform ops.raise_api_error('auth_required', 'Sign in to see your Following feed.');
  end if;

  select * into v_profile from app.profiles p where p.id = v_user;
  select c.id into v_circle_id from app.family_circles c where c.owner_user_id = v_user;

  select pg_catalog.array_agg(f.phase_id), ops.ist_date(pg_catalog.min(f.followed_at))
    into v_phase_ids, v_followed_at
  from app.follows f where f.user_id = v_user;
  v_phase_ids := coalesce(v_phase_ids, '{}'::uuid[]);
  v_floor_from := case when v_followed_at is not null
    then (v_followed_at::timestamp at time zone 'Asia/Kolkata') - interval '1 second' end;

  v_since := coalesce(p_since, v_profile.following_seen_at);

  v_changes := core.following_changes(v_phase_ids, coalesce(v_since, v_floor_from), ops.now());
  v_record := case when v_since is not null and v_floor_from is not null
    then core.following_changes(v_phase_ids, v_floor_from, v_since)
    else '[]'::jsonb end;

  v_total := pg_catalog.jsonb_array_length(v_changes);

  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'slug', q.slug,
      'line', 'Nothing new for ' || q.name || ' since ' || core.fmt_day_month(ops.ist_date(v_since)) || '.'
    )), '[]'::jsonb)
    into v_quiet
  from (
    select ph.slug, ph.name
    from core.phases ph
    where ph.id = any (v_phase_ids)
      and v_since is not null
      and not exists (
        select 1 from pg_catalog.jsonb_array_elements(v_changes) c
        where c ->> 'slug' = ph.slug
      )
  ) q;

  select pg_catalog.array_agg(core.following_count_label(x.kind, x.n) order by core.following_kind_rank(x.kind))
    into v_counts
  from (
    select c ->> 'kind' as kind, pg_catalog.count(*)::integer as n
    from pg_catalog.jsonb_array_elements(v_changes) c
    group by c ->> 'kind'
  ) x;

  v_band_moved := exists (select 1 from pg_catalog.jsonb_array_elements(v_changes) c where c ->> 'kind' = 'band_changed');

  v_summary := v_total || ' change' || case when v_total = 1 then '' else 's' end
    || ' across your ' || pg_catalog.cardinality(v_phase_ids) || ' project' || case when pg_catalog.cardinality(v_phase_ids) = 1 then '' else 's' end
    || case when v_total > 0 then ': ' || core.list_join(v_counts) || '.' else '.' end
    || ' ' || case when v_band_moved then 'The band moved.' else 'No band moved.' end;

  -- Rows reorder newest change first (fix-since-family.md AppFollowing #3:
  -- "Sapphire, Coral, Aurelia, Kestrel"): a phase's rank is where it first
  -- appears in "changes" (already newest-first), so same-day ties keep
  -- whatever order the change list itself settled on; a phase with nothing
  -- new falls back to its slug for a stable order.
  select coalesce(pg_catalog.jsonb_agg(
      core.following_project_row(ph.id, v_user, v_circle_id)
      order by earliest.rn nulls last, ph.slug
    ), '[]'::jsonb)
    into v_projects
  from core.phases ph
  left join lateral (
    select pg_catalog.min(c.rn) as rn
    from pg_catalog.jsonb_array_elements(v_changes) with ordinality as c(item, rn)
    where c.item ->> 'slug' = ph.slug
  ) earliest on true
  where ph.id = any (v_phase_ids);

  v_replay := core.following_replay(v_phase_ids, v_followed_at, v_since);

  select * into v_digest_sub from app.alert_subscriptions s
  where s.user_id = v_user and s.kind = 'digest' and s.enabled
  order by case s.cadence when 'weekly_sun_9am' then 1 when 'daily_8am' then 2 else 3 end
  limit 1;

  v_digest := case when v_digest_sub.id is not null then pg_catalog.jsonb_build_object(
    'cadence', v_digest_sub.cadence,
    'next_line', case v_digest_sub.cadence
      when 'weekly_sun_9am' then 'Next digest Sun ' || core.fmt_day_month(
        ops.today() + (case when pg_catalog.date_part('dow', ops.today()) = 0 then 7
                             else (7 - pg_catalog.date_part('dow', ops.today())::integer) end)
      ) || ', 9 am'
      when 'daily_8am' then 'Next digest ' || core.fmt_day_month(ops.today() + 1) || ', 8 am'
    end
  ) end;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.following_feed/1',
    'since', core.fmt_timestamp(v_since),
    'heading', 'What changed since ' || coalesce(core.fmt_day_month(ops.ist_date(v_since)), 'you started following') || '?',
    'last_looked_line', case when v_since is not null
      then 'Last looked ' || ops.fmt_date(ops.ist_date(v_since)) || ', ' || core.fmt_clock(v_since) || ' · ' || v_total || ' unread' end,
    'summary_line', v_summary,
    'changes', core.following_strip_internal(v_changes),
    'quiet', v_quiet,
    'projects', v_projects,
    'replay', v_replay,
    'record', core.following_strip_internal(v_record),
    'digest', v_digest
  );
end
$$;
comment on function api.following_feed(timestamptz) is 'plinth.following_feed/1 (API_CONTRACTS §4.8): since you last looked, the replay and the digest line. Own data only (auth.uid()).';

create function api.mark_following_seen()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or coalesce(auth.role(), '') <> 'authenticated' then
    perform ops.raise_api_error('auth_required', 'Sign in to mark Following as seen.');
  end if;
  update app.profiles set following_seen_at = ops.now() where id = auth.uid();
  return pg_catalog.jsonb_build_object('ok', true);
end
$$;
comment on function api.mark_following_seen() is 'Sets app.profiles.following_seen_at = ops.now() for the caller (API_CONTRACTS §4.8).';

-- ---------------------------------------------------------------------------
-- Lockdown (BUILD_PLAN §12.1). Scoped to the schemas this task actually added
-- functions to (the T44/T54 precedent, 20261114000200/20261126000100): a
-- function created in a later migration starts with a fresh PUBLIC execute
-- grant that no earlier sweep touched, but sweeping the whole `api` schema
-- here would also strip every earlier task's anon/authenticated grants
-- (risk_summary, project_page, …), which this file would then have to
-- re-assert. core/ops never had anon/authenticated grants to begin with, so
-- that sweep is safe broadly; the two new api functions are revoked by name.
-- ---------------------------------------------------------------------------
revoke all on all functions in schema core, ops from public, anon, authenticated;

-- api.following_feed/mark_following_seen are reached by anon too (PostgREST
-- calls every api.* function as anon or authenticated); the auth_required
-- check inside each is the real gate, the same shape as every other
-- SECURITY DEFINER api function in this codebase.
revoke execute on function api.following_feed(timestamptz) from public;
revoke execute on function api.mark_following_seen() from public;
grant execute on function api.following_feed(timestamptz) to anon, authenticated, service_role;
grant execute on function api.mark_following_seen() to anon, authenticated, service_role;
