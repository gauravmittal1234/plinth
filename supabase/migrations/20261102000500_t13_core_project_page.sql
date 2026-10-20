-- T13 · API reads B 5/7: the project page (API_CONTRACTS §4.2, plinth.project_page/1).
-- Sources: API_CONTRACTS §4.2, §4.13; DATA_MODEL §1–§4; DESIGN §5b (the 13-stage payment plan,
-- "Loan checks arrive in 2027", fixture decisions round 2); WORK_BREAKDOWN T13 (per-tower
-- progress, homes, From the developer, next steps with the lower-band-nearby rule,
-- afford_default, before-booking blocks).
--
-- Every line is composed here from the records, the developer's published content and
-- Plinth's editorial notes; clients render it and compose no risk copy (AGENTS §5, §7).
-- The risk block is T12's core.risk_summary_json(), unchanged, so the page and the risk card
-- can never disagree. Band-related lines appear only while buyers may see the band
-- (bands public, not facts-only, scored: DATA_MODEL §12 inv. 8).

-- ---------------------------------------------------------------------------
-- Hero: one summary line and the RERA badge
-- ---------------------------------------------------------------------------
create function core.pp_hero(p_view jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_parts text[] := '{}';
  v_overlays jsonb := coalesce(p_view -> 'overlays', '[]'::jsonb);
  v_stale boolean := v_overlays ? 'stale';
  v_show_all_in boolean;
  v_built text := p_view -> 'progress' ->> 'built_pct';
  v_tu numeric := (p_view -> 'progress' ->> 'time_used_pct')::numeric;
  v_orig date := (p_view ->> 'original_completion')::date;
  v_current date := (p_view ->> 'current_completion')::date;
  v_completion text;
begin
  v_parts := v_parts || case
    when p_view -> 'facts_only' is not null and p_view -> 'facts_only' <> 'null'::jsonb
      then 'Band withheld pending review, from ' || ops.fmt_date((p_view -> 'facts_only' ->> 'since')::date)
    when p_view ->> 'state' = 'not_scored' then 'Delivery risk: Not scored yet'
    when p_view ->> 'state' = 'limited_history'
      then 'Delivery risk: Limited history, not enough history to score · no penalty'
    when not (p_view ->> 'show_band')::boolean then 'Delivery risk: facts only for now'
    when p_view ->> 'set_by' = 'red_flag_rule'
      then 'Delivery risk: ' || (p_view ->> 'band_label') || ', set by a published rule'
    when v_overlays ? 'rescoring' then 'Delivery risk: ' || (p_view ->> 'band_label') || ', re-scoring now'
    else 'Delivery risk: ' || (p_view ->> 'band_label')
  end;
  if v_stale then
    v_parts := v_parts || ('Stale data, progress ' || (p_view -> 'progress' -> 'latest_qpr' ->> 'age_days') || ' days old');
  end if;
  if v_overlays ? 'stalled' then
    v_parts := v_parts || 'Stall flag'::text;
  end if;

  v_show_all_in := p_view -> 'price' ->> 'all_in_label' is not null
    and not (v_overlays ?| array['stale', 'stalled', 'rescoring']);
  if v_show_all_in then
    v_parts := v_parts || ('All-in ' || (p_view -> 'price' ->> 'all_in_label'));
  end if;
  if v_built is not null then
    v_parts := v_parts || (v_built || '% built');
    if not v_show_all_in and not v_stale and v_tu is not null and v_tu <= 100 then
      v_parts := v_parts || (core.fmt_num(v_tu) || '% of the time used');
    end if;
  elsif p_view ->> 'registered_on' is not null then
    v_parts := v_parts || ('Registered ' || ops.fmt_month((p_view ->> 'registered_on')::date));
  end if;
  if v_orig is not null then
    v_completion := 'Original completion ' || ops.fmt_month(v_orig);
    if (p_view ->> 'extensions')::integer > 0 and v_current > v_orig then
      v_completion := v_completion || ', extended to ' || ops.fmt_month(v_current);
    elsif (v_orig + interval '1 month')::date <= ops.today() then
      v_completion := v_completion || ', passed';
    end if;
    v_parts := v_parts || v_completion;
  end if;

  return pg_catalog.jsonb_build_object(
    'image_url', (core.editorial('phase', (p_view ->> 'id')::uuid, 'hero_image')).body ->> 'url',
    'image_caption', 'Images on this page are illustrative',
    'summary_line', pg_catalog.array_to_string(v_parts, ' · '),
    'rera_badge', case when p_view ->> 'rera_number' is not null then pg_catalog.jsonb_build_object(
      'number', p_view ->> 'rera_number', 'authority_url', p_view ->> 'authority_url', 'qr_url', null) end
  );
end
$$;
comment on function core.pp_hero(jsonb) is 'ProjectPage.hero: the image slot, the one summary line (band or state, overlay, all-in, built, time used, completion) and the RERA badge.';

-- ---------------------------------------------------------------------------
-- The truth panel: four records, each with its sources
-- ---------------------------------------------------------------------------
create function core.pp_truth_panel(p_view jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_phase_id uuid := (p_view ->> 'id')::uuid;
  v_url text := p_view ->> 'authority_url';
  v_reg core.rera_registrations%rowtype;
  v_items jsonb := '[]'::jsonb;
  v_ids uuid[];
  v_ext integer := (p_view ->> 'extensions')::integer;
  v_quarter text := p_view -> 'progress' -> 'latest_qpr' ->> 'quarter';
begin
  select * into v_reg from core.rera_registrations r where r.id = (p_view ->> 'reg_id')::uuid;
  if v_reg.id is not null then
    select pg_catalog.array_agg(x.id order by x.ord, x.seq) into v_ids
    from (
      select f.id, 1 as ord, 0 as seq from core.phase_facts(v_phase_id, 'registration.dates') f
      union all
      select f.id, 2, coalesce((f.value ->> 'seq')::integer, 0) from core.phase_facts(v_phase_id, 'registration.extension') f
    ) as x;
    v_items := v_items || pg_catalog.jsonb_build_object(
      'key', 'completion',
      'label', 'Original vs current completion',
      'value_line', ops.fmt_month(v_reg.original_completion) || case
        when v_ext > 0 then ' · extended to ' || ops.fmt_month(v_reg.current_completion)
          || ' (' || v_ext || case when v_ext = 1 then ' extension)' else ' extensions)' end
        else ' · no extensions' end,
      'lane', 'records_show',
      'sources', core.source_refs(coalesce(v_ids, '{}'::uuid[]), v_url));
  end if;

  if p_view -> 'progress' ->> 'built_pct' is not null and p_view -> 'progress' ->> 'time_used_pct' is not null then
    select pg_catalog.array_agg(x.id order by x.ord) into v_ids
    from (
      select f.id, 1 as ord from core.phase_facts(v_phase_id, 'qpr.progress') f where f.value ->> 'quarter' = v_quarter
      union all
      select f.id, 2 from core.phase_facts(v_phase_id, 'progress.time_used_pct') f
    ) as x;
    v_items := v_items || pg_catalog.jsonb_build_object(
      'key', 'progress',
      'label', 'Built vs time used',
      'value_line', (p_view -> 'progress' ->> 'built_pct') || '% built · '
        || (p_view -> 'progress' ->> 'time_used_pct') || '% of time used',
      'lane', 'records_show',
      'sources', core.source_refs(coalesce(v_ids, '{}'::uuid[]), v_url));
  end if;

  if p_view -> 'complaints' is not null and p_view -> 'complaints' <> 'null'::jsonb then
    select pg_catalog.array_agg(f.id) into v_ids
    from core.phase_facts(v_phase_id, 'orders.complaints_against_promoter_24m') f;
    v_items := v_items || pg_catalog.jsonb_build_object(
      'key', 'complaints',
      'label', 'Complaints decided',
      'value_line', p_view -> 'complaints' ->> 'line',
      'lane', 'records_show',
      'sources', core.source_refs(coalesce(v_ids, '{}'::uuid[]), v_url));
  end if;

  if v_reg.collection_bank is not null then
    select pg_catalog.array_agg(f.id) into v_ids
    from core.phase_facts(v_phase_id, 'registration.collection_account') f;
    v_items := v_items || pg_catalog.jsonb_build_object(
      'key', 'collection_account',
      'label', 'RERA collection account',
      'value_line', v_reg.collection_bank
        || coalesce(', ' || pg_catalog.regexp_replace(v_reg.collection_branch, ',\s*' || (p_view ->> 'city_name') || '$', ''), '')
        || coalesce(' · ending ' || pg_catalog.right(v_reg.collection_account_number, 4), ''),
      'lane', 'records_show',
      'sources', core.source_refs(coalesce(v_ids, '{}'::uuid[]), v_url));
  end if;
  return v_items;
end
$$;
comment on function core.pp_truth_panel(jsonb) is 'ProjectPage.truth_panel: original vs current completion, built vs time used, complaints decided and the RERA collection account, each with SourceRefs.';

-- ---------------------------------------------------------------------------
-- Progress: the replay by quarter, with tower slabs (the WebProject signature)
-- ---------------------------------------------------------------------------
create function core.quarter_end(p_quarter text)
returns date
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select (pg_catalog.make_date(pg_catalog.split_part(p_quarter, '-Q', 1)::integer,
                               pg_catalog.split_part(p_quarter, '-Q', 2)::integer * 3, 1)
          + interval '1 month' - interval '1 day')::date
$$;
comment on function core.quarter_end(text) is 'The last day of a calendar quarter: 2026-Q2 → 2026-06-30.';

create function core.band_on(p_phase_id uuid, p_on date)
returns text
language sql
stable
set search_path = ''
as $$
  with h as (
    select h.band, h.state, h.from_date
    from core.band_history h
    left join core.score_runs r on r.id = h.run_id
    where h.phase_id = p_phase_id
      and h.from_date <= ops.today()
      and (h.run_id is null or r.status in ('published', 'superseded'))
  )
  select coalesce(
    (select case when h.state = 'scored' then h.band end from h where h.from_date <= p_on order by h.from_date desc limit 1),
    (select case when h.state = 'scored' then h.band end from h order by h.from_date limit 1))
$$;
comment on function core.band_on(uuid, date) is 'The published band in force on a day; before the first published band, that first band (the replay starts from it). Null when not scored.';

create function core.pp_progress(p_view jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_phase_id uuid := (p_view ->> 'id')::uuid;
  v_show boolean := (p_view ->> 'show_band')::boolean;
  v_towers text[];
  v_floors integer[];
  v_latest text;
  v_demand core.editorial_notes%rowtype;
  v_demand_line text;
  v_quarters jsonb;
  v_register jsonb;
  v_late_line text;
begin
  select pg_catalog.array_agg(t.code order by t.code), pg_catalog.array_agg(t.floors_planned order by t.code)
    into v_towers, v_floors
  from core.towers t where t.phase_id = v_phase_id;

  select pg_catalog.max(q.quarter) into v_latest
  from core.qpr_filings q
  where q.registration_id = (p_view ->> 'reg_id')::uuid and (q.built_pct is not null or q.sold_pct is not null);

  select * into v_demand from core.editorial('phase', v_phase_id, 'demand');
  if v_demand.id is not null then
    v_demand_line := 'A demand for slab ' || (v_demand.body ->> 'slab_no') || ' went out on '
      || ops.fmt_date((v_demand.body ->> 'sent_on')::date) || '.';
  end if;

  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'quarter', q.quarter,
           'label', ops.fmt_quarter(q.quarter),
           'sold_pct', pg_catalog.trim_scale(q.sold_pct),
           'built_pct', pg_catalog.trim_scale(q.built_pct),
           'time_used_pct', pg_catalog.trim_scale(q.time_used_pct),
           'band_then', case when v_show then core.band_on(v_phase_id, core.quarter_end(q.quarter)) end,
           'towers', tw.towers,
           'filed_on', q.filed_on,
           'status', q.status,
           'note_line', nullif(pg_catalog.concat_ws(' ',
             coalesce((core.editorial('filing', q.id, 'note')).body ->> 'line',
               case when v_towers is not null and tw.towers is null
                 then 'This QPR reports ' || (p_view ->> 'label') || ' as a whole, not by tower.' end),
             case when q.quarter = v_latest and v_demand_line is not null
                   and (v_demand.body ->> 'sent_on')::date > coalesce(q.filed_on, core.quarter_end(q.quarter))
               then v_demand_line end), ''))
         order by q.quarter), '[]'::jsonb)
    into v_quarters
  from core.qpr_filings q
  left join lateral (
    select pg_catalog.jsonb_object_agg(t.code, tp.slab_reached) as towers
    from core.qpr_tower_progress tp
    join core.towers t on t.id = tp.tower_id
    where tp.filing_id = q.id and tp.slab_reached is not null
  ) as tw on true
  where q.registration_id = (p_view ->> 'reg_id')::uuid
    and (q.built_pct is not null or q.sold_pct is not null);

  -- Late filings, as the QPR register fact lists them.
  select f.value into v_register
  from core.phase_facts(v_phase_id, 'qpr.filing_record') f
  order by f.as_of desc nulls last
  limit 1;
  select 'Filed late: ' || core.list_join(pg_catalog.array_agg(
           ops.fmt_quarter(l ->> 'quarter') || ' (' || (l ->> 'days_late') || ' days)' order by l ->> 'quarter')) || '.'
    into v_late_line
  from pg_catalog.jsonb_array_elements(coalesce(v_register -> 'late', '[]'::jsonb)) as l
  having pg_catalog.count(*) > 0;

  return pg_catalog.jsonb_build_object(
    'floors_per_tower', v_floors[1],
    'towers', pg_catalog.to_jsonb(v_towers),
    'quarters', v_quarters,
    'today', pg_catalog.jsonb_build_object(
      'time_used_pct', p_view -> 'progress' -> 'time_used_pct',
      'band', case when v_show then p_view ->> 'band' end,
      'band_since_line', case when v_show and p_view ->> 'band_since' is not null
        then (p_view ->> 'band_label') || ' since ' || ops.fmt_date((p_view ->> 'band_since')::date) end),
    'late_filings_line', v_late_line
  );
end
$$;
comment on function core.pp_progress(jsonb) is 'ProjectPage.progress: every QPR with figures (sold, built, time used, tower slabs, the band then, a note), today, and the late filings the register lists.';

-- ---------------------------------------------------------------------------
-- Homes: configurations, amenities, getting around, reported waterlogging
-- ---------------------------------------------------------------------------
create function core.pp_homes(p_view jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_phase_id uuid := (p_view ->> 'id')::uuid;
  v_list ws.price_lists%rowtype;
  v_plan_doc ws.developer_documents%rowtype;
  v_brochure ws.developer_documents%rowtype;
  v_ga core.editorial_notes%rowtype;
  v_towers text[];
  v_floors integer[];
  v_slabs text[];
  v_units_line text;
  v_configs jsonb;
  v_reports jsonb;
  v_named boolean;
begin
  select * into v_list from ws.price_lists l
  where l.phase_id = v_phase_id and l.status = 'published' and l.published_on <= ops.today()
  order by l.published_on desc, l.version desc limit 1;
  select * into v_plan_doc from ws.developer_documents d
  where d.phase_id = v_phase_id and d.kind = 'floor_plan' and d.status = 'published' and d.dated <= ops.today()
  order by d.dated desc limit 1;
  select * into v_brochure from ws.developer_documents d
  where d.phase_id = v_phase_id and d.kind = 'brochure' and d.status = 'published' and d.dated <= ops.today()
  order by d.dated desc limit 1;
  select * into v_ga from core.editorial('phase', v_phase_id, 'getting_around');

  select pg_catalog.array_agg(t.code order by t.code), pg_catalog.array_agg(t.floors_planned order by t.code)
    into v_towers, v_floors
  from core.towers t where t.phase_id = v_phase_id;
  select pg_catalog.array_agg('Tower ' || ts.tower || ' at slab ' || ts.slab order by ts.tower) into v_slabs
  from core.tower_slabs(v_phase_id) ts;

  if v_towers is not null then
    v_units_line := 'Towers ' || core.list_join(v_towers)
      || case when v_floors[1] is not null and v_floors[1] = all (v_floors) then ', ' || v_floors[1] || ' floors each' else '' end
      || coalesce(', with ' || core.fmt_count((p_view ->> 'units_total')::bigint) || ' homes in ' || (p_view ->> 'label'), '')
      || '.' || coalesce(' Latest QPR: ' || pg_catalog.array_to_string(v_slabs, ', ') || '.', '');
  elsif p_view ->> 'units_total' is not null then
    v_units_line := core.fmt_count((p_view ->> 'units_total')::bigint) || ' homes in this phase.';
  end if;

  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'label', u.label,
           'carpet_line', case when u.carpet_sqft is not null
             then core.fmt_count(pg_catalog.round(u.carpet_sqft)::bigint) || ' sq ft carpet'
             else 'Carpet not in our records yet' end,
           'carpet_lane', case when u.carpet_sqft is not null then u.lane end,
           'super_line', case when u.super_sqft is not null
             then core.fmt_count(pg_catalog.round(u.super_sqft)::bigint) || ' sq ft super' end,
           'super_lane', case when u.super_sqft is not null then 'from_developer' end,
           'loading_line', case when u.super_sqft is not null and u.carpet_sqft is not null
             then pg_catalog.round((u.super_sqft / u.carpet_sqft - 1) * 100)::text || '% loading' end,
           'price_line', coalesce(
             'From ' || ops.fmt_inr_short(li.base_price_inr),
             'Quoted ' || ops.fmt_inr_short((qf.value ->> 'base_price_inr')::bigint)),
           'price_lane', 'from_developer',
           'all_in_line', case when af.value is not null
             then ops.fmt_inr_short((af.value ->> 'all_in_inr')::bigint) || ' all-in' end,
           'all_in_note', case when af.value is null then 'No ' || u.label || ' cost sheet, so no all-in yet.' end,
           'rooms', coalesce(v_plan_doc.summary -> 'rooms' -> u.label, '[]'::jsonb))
         order by u.label), '[]'::jsonb)
    into v_configs
  from core.unit_types u
  left join ws.price_list_items li on li.price_list_id = v_list.id and li.unit_type_id = u.id
  left join lateral (
    select f.value from core.phase_facts(v_phase_id, 'price.quoted') f where f.value ->> 'unit' = u.label
    order by f.as_of desc limit 1) as qf on true
  left join lateral (
    select f.value from core.phase_facts(v_phase_id, 'price.all_in') f where f.value ->> 'unit' = u.label
    order by f.as_of desc limit 1) as af on true
  where u.phase_id = v_phase_id;

  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'reported_on', i.reported_on,
           'line', i.place_text || ' · ' || case i.source_kind when 'news' then 'news report' else 'resident report' end
             || ', ' || ops.fmt_date(i.reported_on))
         order by i.reported_on desc),
         pg_catalog.bool_or(pg_catalog.strpos(pg_catalog.lower(i.place_text), pg_catalog.lower(p_view ->> 'project_word')) > 0)
    into v_reports, v_named
  from core.reported_incidents i
  join core.projects pr on pr.id = (p_view ->> 'project_id')::uuid
  where i.locality_id = pr.locality_id
    and i.kind = 'waterlogging'
    and i.reported_on <= ops.today();

  return pg_catalog.jsonb_build_object(
    'units_line', v_units_line,
    'configurations', v_configs,
    'amenities', case when v_brochure.summary ? 'amenities' then pg_catalog.jsonb_build_object(
      'lane', 'from_developer',
      'source_line', 'Developer says · brochure, ' || ops.fmt_date(v_brochure.dated),
      'items', v_brochure.summary -> 'amenities') end,
    'getting_around', case when v_ga.id is not null then pg_catalog.jsonb_build_object(
      'lane', coalesce(v_ga.lane, 'our_estimate'),
      'source_line', 'Our estimate · road distances' || coalesce(', ' || ops.fmt_month(v_ga.as_of), ''),
      'items', v_ga.body -> 'items') end,
    'waterlogging', case when v_reports is not null then pg_catalog.jsonb_build_object(
      'lane', 'reported_unverified',
      'reports', v_reports,
      'note_line', 'Reported, not verified by Plinth.'
        || case when not coalesce(v_named, false)
             then ' No report names the ' || (p_view ->> 'project_word') || ' site itself.' else '' end) end
  );
end
$$;
comment on function core.pp_homes(jsonb) is 'ProjectPage.homes: towers and units, each configuration (carpet from records, super from the developer, the latest price list, all-in), the brochure''s amenities, Plinth''s road-distance estimate and reported waterlogging nearby.';

-- ---------------------------------------------------------------------------
-- From the developer: price lists, the payment plan, transfer policy, draft agreement
-- ---------------------------------------------------------------------------
create function core.plan_tower_dues(p_phase_id uuid, p_plan_id uuid)
returns table (tower text, slab integer, due_pct numeric)
language sql
stable
set search_path = ''
as $$
  select ts.tower, ts.slab, core.plan_due_pct(p_plan_id, ts.slab)
  from core.tower_slabs(p_phase_id) ts
  order by ts.tower
$$;
comment on function core.plan_tower_dues(uuid, uuid) is 'For each tower: its latest slab and the share due by the registered agreement for a buyer booking today.';

create function core.pp_from_developer(p_view jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_phase_id uuid := (p_view ->> 'id')::uuid;
  v_brand text := p_view ->> 'group_brand';
  v_plan ws.payment_plans%rowtype;
  v_lists jsonb;
  v_stages jsonb;
  v_booking numeric;
  v_max_due numeric;
  v_by_tower text[];
  v_demand core.editorial_notes%rowtype;
  v_demand_slab integer;
  v_tp ws.developer_documents%rowtype;
  v_da ws.developer_documents%rowtype;
  v_super numeric;
  v_updated date;
  v_plan_json jsonb;
begin
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'published_on', l.published_on,
           'label', case
             when l.note is not null then l.note || ', ' || ops.fmt_date_precision(l.published_on, l.published_precision)
             else ops.fmt_date_precision(l.published_on, l.published_precision) end,
           'items', (
             select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
                      'unit_label', u.label,
                      'base_price_inr', li.base_price_inr,
                      'price_line', 'from ' || ops.fmt_inr_short(li.base_price_inr),
                      'per_sqft_line', case when li.per_sqft_carpet_inr is not null
                        then ops.fmt_inr_exact(li.per_sqft_carpet_inr) || ' per sq ft carpet' end)
                    order by u.label), '[]'::jsonb)
             from ws.price_list_items li
             join core.unit_types u on u.id = li.unit_type_id
             where li.price_list_id = l.id))
         order by l.published_on desc, l.version desc), '[]'::jsonb)
    into v_lists
  from ws.price_lists l
  where l.phase_id = v_phase_id and l.status = 'published' and l.published_on <= ops.today();

  select * into v_plan from core.phase_plan(v_phase_id);
  if pg_catalog.jsonb_array_length(v_lists) = 0 and v_plan.id is null then
    return null;
  end if;

  select * into v_tp from ws.developer_documents d
  where d.phase_id = v_phase_id and d.kind = 'transfer_policy' and d.status = 'published' and d.dated <= ops.today()
  order by d.dated desc limit 1;
  select * into v_da from ws.developer_documents d
  where d.phase_id = v_phase_id and d.kind = 'draft_agreement' and d.status = 'published' and d.dated <= ops.today()
  order by d.dated desc limit 1;
  select pg_catalog.max(x.d) into v_updated
  from (
    select d.dated as d from ws.developer_documents d
    where d.phase_id = v_phase_id and d.status = 'published' and d.dated <= ops.today()
    union all
    select v_plan.published_on
  ) as x;

  if v_plan.id is not null then
    select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
             'seq', s.seq, 'label', s.label, 'stage_kind', s.stage_kind, 'slab_no', s.slab_no,
             'pct', pg_catalog.trim_scale(s.pct)) order by s.seq),
           pg_catalog.sum(s.pct) filter (where s.stage_kind = 'booking')
      into v_stages, v_booking
    from ws.payment_plan_stages s where s.plan_id = v_plan.id;
    select pg_catalog.max(d.due_pct),
           pg_catalog.array_agg(core.fmt_num(d.due_pct) || '% in Tower ' || d.tower order by d.tower)
      into v_max_due, v_by_tower
    from core.plan_tower_dues(v_phase_id, v_plan.id) d;
    if v_max_due is null then
      v_max_due := core.plan_due_pct(v_plan.id, null);
    end if;
    select * into v_demand from core.editorial('phase', v_phase_id, 'demand');
    select ts.slab into v_demand_slab from core.tower_slabs(v_phase_id) ts where ts.tower = v_demand.body ->> 'tower';

    v_plan_json := pg_catalog.jsonb_build_object(
      'kind', v_plan.kind,
      'name', v_plan.name,
      'published_on', v_plan.published_on,
      'stages', coalesce(v_stages, '[]'::jsonb),
      'line', case v_plan.kind
          when 'construction_linked' then 'You pay as the building rises. '
          when 'down_payment' then 'You pay most of the price early. '
          when 'possession_linked' then 'You pay most of the price at possession. '
          else 'The bank pays the developer early. ' end
        || 'A buyer booking today pays ' || core.fmt_num(coalesce(v_booking, 0))
        || '%, then, once the agreement for sale is registered, every stage already on record: '
        || core.fmt_num(v_max_due) || '% in all.',
      'by_tower_line', case when v_by_tower is not null
        then 'Booking today, by registration you would pay ' || core.list_join(v_by_tower) || '.' end,
      'demand_line', case when v_demand.id is not null
        then 'A demand for Tower ' || (v_demand.body ->> 'tower') || ' slab ' || (v_demand.body ->> 'slab_no')
          || ' went out on ' || ops.fmt_date((v_demand.body ->> 'sent_on')::date)
          || coalesce(', while the latest QPR shows slab ' || v_demand_slab, '') || '.' end
    );
  end if;

  select u.super_sqft into v_super from core.unit_types u where u.phase_id = v_phase_id and u.label = '3 BHK';

  return pg_catalog.jsonb_build_object(
    'label', 'From the developer · not verified by Plinth',
    'updated_line', case when v_updated is not null
      then (p_view ->> 'group_name') || ' · updated ' || ops.fmt_date(v_updated) end,
    'note_line', v_brand || ' added this in its free Plinth workspace. We show it as given and date every change. '
      || 'It is not a public record, and it never moves the delivery risk.',
    'price_lists', v_lists,
    'price_basis_line', 'Base prices, before charges, GST and stamp duty.',
    'payment_plan', v_plan_json,
    'transfer_policy', core.transfer_policy_line(v_tp.summary, v_super),
    'draft_agreement_line', case when v_da.summary ? 'edc_idc_increase'
      then 'The draft agreement for sale (' || ops.fmt_date(v_da.dated) || ') '
        || pg_catalog.regexp_replace(pg_catalog.btrim(v_da.summary ->> 'edc_idc_increase'), '^(.+?) may ', 'lets \1 ') end
  );
end
$$;

create function core.transfer_policy_line(p_summary jsonb, p_super_sqft numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  select case when p_summary ? 'fee_per_sqft_super_inr' then
    ops.fmt_inr_exact((p_summary ->> 'fee_per_sqft_super_inr')::bigint) || ' per sq ft of super area'
    || coalesce(', so ' || ops.fmt_inr_short(((p_summary ->> 'fee_per_sqft_super_inr')::numeric * p_super_sqft)::bigint)
         || ' on a ' || core.fmt_count(pg_catalog.round(p_super_sqft)::bigint) || ' sq ft 3 BHK', '')
    || '.'
    || coalesce(' ' || (select pg_catalog.string_agg(r, ' ' order by o)
                        from pg_catalog.jsonb_array_elements_text(p_summary -> 'rules') with ordinality as x(r, o)), '')
  end
$$;
comment on function core.transfer_policy_line(jsonb, numeric) is 'The transfer policy as one line: "₹150 per sq ft of super area, so ₹3.0 L on a 2,000 sq ft 3 BHK. All dues to date first. …".';
comment on function core.pp_from_developer(jsonb) is 'ProjectPage.from_developer: every published price list (dated), the payment plan with what is due by registration per tower and any demand ahead of the filings, the transfer policy and the draft agreement''s EDC/IDC clause. Null when the developer has published nothing.';

-- ---------------------------------------------------------------------------
-- Next steps: house copy by band; records to read when there is no band
-- ---------------------------------------------------------------------------
create function core.base_rate_line(p_view jsonb)
returns text
language sql
stable
set search_path = ''
as $$
  with b as (select core.base_rate() as r, core.current_model() as m)
  select 'About ' || (b.r ->> 'per_100') || ' of 100 ' || coalesce(p_view ->> 'city_name', 'Gurugram')
    || ' projects got their OC more than 12 months late.'
    || case when (p_view ->> 'show_band')::boolean then
         ' ' || (p_view ->> 'band_label') || ' sits ' || case
           when ((b.m).config -> 'band_ranges' -> (p_view ->> 'band') ->> 'high')::numeric < (b.r ->> 'per_100')::numeric then 'below'
           when ((b.m).config -> 'band_ranges' -> (p_view ->> 'band') ->> 'low')::numeric > (b.r ->> 'per_100')::numeric then 'above'
           else 'around' end || ' that.'
       else '' end
  from b
  where b.r is not null
$$;
comment on function core.base_rate_line(jsonb) is 'The base rate in words, and where the phase''s band sits against it (below, around, above): "About 36 of 100 Gurugram projects got their OC more than 12 months late. Elevated sits around that."';

create function core.lower_band_nearby(p_view jsonb)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with mine as (
    select (f.value ->> 'all_in_inr')::numeric as all_in
    from core.phase_facts((p_view ->> 'id')::uuid, 'price.all_in') f
    where f.value ->> 'unit' = '3 BHK'
    order by f.as_of desc limit 1
  ),
  cand as (
    select core.phase_view(p.id) as v
    from core.phases p
    where p.id <> (p_view ->> 'id')::uuid
      and exists (select 1 from core.score_runs r where r.phase_id = p.id and r.status = 'published')
  )
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'slug', c.v ->> 'slug', 'name', c.v ->> 'name', 'chip', c.v -> 'chip',
           'price_line', c.v -> 'price' ->> 'all_in_label' || ' all-in')
         order by (c.v ->> 'band_step')::integer, c.v ->> 'name'), '[]'::jsonb)
  from cand c, mine
  where (p_view ->> 'show_band')::boolean
    and p_view ->> 'corridor_id' is not null
    and (c.v ->> 'show_band')::boolean
    and c.v ->> 'corridor_id' = p_view ->> 'corridor_id'
    and (c.v ->> 'band_step')::integer < (p_view ->> 'band_step')::integer
    and (c.v -> 'price' ->> 'all_in_inr') is not null
    and pg_catalog.abs((c.v -> 'price' ->> 'all_in_inr')::numeric - mine.all_in) <= 0.2 * mine.all_in
$$;
comment on function core.lower_band_nearby(jsonb) is 'Same corridor, lower band, all-in within 20%, lowest band first. Nobody pays to appear.';

create function core.pp_next_steps(p_view jsonb, p_afford jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_phase_id uuid := (p_view ->> 'id')::uuid;
  v_band text := p_view ->> 'band';
  v_steps jsonb;
  v_demand core.editorial_notes%rowtype;
  v_slab integer;
  v_missing record;
  v_marker text;
  v_rule_line text := 'Same corridor, lower band, all-in within 20%. Nobody pays to appear.';
  v_track jsonb;
  v_others text[];
begin
  if p_view -> 'facts_only' is not null and p_view -> 'facts_only' <> 'null'::jsonb
     or not (p_view ->> 'bands_public')::boolean then
    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
             'heading', 'The ' || ops.fmt_quarter(q.quarter) || ' QPR',
             'body', 'Due ' || ops.fmt_date(q.due_on) || ', not on ' || (p_view ->> 'authority_short') || ' yet.',
             'source_label', (p_view ->> 'authority_short') || ' QPR register') order by q.quarter), '[]'::jsonb)
      into v_steps
    from core.qpr_filings q
    where q.registration_id = (p_view ->> 'reg_id')::uuid and q.status = 'missing' and q.due_on <= ops.today();
    v_steps := v_steps || pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'heading', 'This page',
      'body', case when (p_view ->> 'bands_public')::boolean then 'We note the day the review ends.'
        else 'We note the day bands are published.' end,
      'source_label', null));
    return pg_catalog.jsonb_build_object(
      'intro_line', case when (p_view ->> 'bands_public')::boolean
        then 'Facts-only mode changes nothing about your rights. These are the records we keep watching.'
        else 'Bands are not published yet. These are the records we keep watching.' end,
      'steps', v_steps,
      'base_rate_line', core.base_rate_line(p_view),
      'lower_band_nearby', '[]'::jsonb,
      'rule_line', v_rule_line);
  end if;

  if (p_view ->> 'show_band')::boolean then
    select * into v_demand from core.editorial('phase', v_phase_id, 'demand');
    select ts.slab into v_slab from core.tower_slabs(v_phase_id) ts where ts.tower = v_demand.body ->> 'tower';
    select q.quarter, q.due_on, (
             select f.id from core.facts f
             where f.subject_type = 'registration' and f.subject_id = q.registration_id
               and f.attribute = 'qpr.missing' and f.value ->> 'quarter' = q.quarter
               and f.superseded_by is null and f.learned_at <= ops.now()
             order by f.learned_at desc limit 1) as fact_id
      into v_missing
    from core.qpr_filings q
    where q.registration_id = (p_view ->> 'reg_id')::uuid and q.status = 'missing' and q.due_on <= ops.today()
    order by q.quarter desc limit 1;
    if v_missing.quarter is not null then
      select n.public_marker_text into v_marker
      from core.band_notices n
      where n.phase_id = v_phase_id and n.status = 'pending' and n.public_marker_text is not null
        and v_missing.fact_id = any (n.trigger_fact_ids)
      order by n.sent_at desc nulls last limit 1;
    end if;

    v_steps := case v_band
      when 'low' then pg_catalog.jsonb_build_array(
        core.step('Keep to 10% until the agreement is registered.', 'That is the RERA limit before an agreement for sale (s.13).'),
        core.step('Pay only for stages on record.', 'Check every demand letter against the latest QPR with Pay-as-built.'),
        core.step('Follow it.', 'We tell you the day a QPR is late or the band moves.'))
      when 'moderate' then pg_catalog.jsonb_build_array(
        core.step('Ask for it in writing.', 'The CA certificate on escrow withdrawals, filed with each QPR.'),
        core.step('Prefer a plan that pays as it''s built.', 'Construction-linked, and only for stages on record.'),
        core.step('Keep a rent buffer.', 'About 12 months of rent and pre-EMI, in case keys come late.'),
        core.step('Follow it.', 'Late filings and new orders reach you first.'))
      when 'elevated' then pg_catalog.jsonb_build_array(
        core.step('Ask for it in writing.',
          'The slab schedule for your tower, and the CA certificate on escrow withdrawals with the latest QPR.'),
        core.step('Prefer a plan that pays as it''s built.',
          'Construction-linked, and only for stages on record.'
          || case when v_demand.id is not null and v_slab is not null
               then ' Tower ' || (v_demand.body ->> 'tower') || ' is at slab ' || v_slab || ', but a demand for slab '
                 || (v_demand.body ->> 'slab_no') || ' went out on ' || ops.fmt_date((v_demand.body ->> 'sent_on')::date) || '.'
               else '' end),
        core.step('Keep a rent buffer.', case when p_afford is not null
          then 'If keys come ' || (p_afford -> 'delay' ->> 'months') || ' months after '
            || ops.fmt_month((p_view ->> 'original_completion')::date) || ', rent and pre-EMI cost about '
            || (p_afford -> 'delay' ->> 'cost_label') || ' more on our default loan.'
          else 'About 12 months of rent and pre-EMI, in case keys come late.' end),
        core.step('Watch the next QPR.', case when v_missing.quarter is not null
          then ops.fmt_quarter(v_missing.quarter) || ' is not on ' || (p_view ->> 'authority_short') || ' yet.'
            -- The step names the marker's condition only; the risk card says who hears first.
            || coalesce(' ' || pg_catalog.regexp_replace(v_marker, '\s*;[^;]*$', '.'), '')
          else 'We tell you the day it is filed, or the day it is late.' end))
      when 'high' then pg_catalog.jsonb_build_array(
        core.step('Ask for it in writing.', 'The slab schedule, the CA escrow certificate and any extension application.'),
        core.step('Pay no more than the law allows.', '10% before a registered agreement; after that, only stages on record.'),
        core.step('Keep a longer buffer.', 'About 24 months of rent and pre-EMI, in case keys come late.'),
        core.step('Read the complaint orders.', 'They show what buyers before you went through, and what HARERA decided.'))
      else pg_catalog.jsonb_build_array(
        core.step('Read the reason first.', 'A published rule or the record sets this band. Open its source.'),
        core.step('If you''ve paid already,',
          'your RERA rights to a refund or delay interest still stand. See “If you''ve already booked here”.'),
        core.step('Before paying anything more,', 'ask for the project''s status in writing, and keep every receipt.'))
    end;
    return pg_catalog.jsonb_build_object(
      'intro_line', 'We never say buy or don''t buy. At ' || (p_view ->> 'band_label')
        || ', these steps keep less of your money at stake.',
      'steps', v_steps,
      'base_rate_line', core.base_rate_line(p_view),
      'lower_band_nearby', core.lower_band_nearby(p_view),
      'rule_line', v_rule_line);
  end if;

  -- No band to act on: the records to read instead.
  if p_view ->> 'state' = 'limited_history' then
    v_steps := pg_catalog.jsonb_build_array(
      core.step('Who is behind it', core.possessive(p_view ->> 'group_name')
        || ' directors, and their other companies in MCA filings.', 'MCA company records'),
      core.step('The licence', 'The DTCP licence for the ' || coalesce((p_view ->> 'sector_name') || ' ', '')
        || 'site, and that it is in force.', 'DTCP licence register'),
      core.step('The escrow account', 'A CA certificate with each QPR on money taken out of the project account.',
        (p_view ->> 'authority_short') || ' Form 3 · with each QPR'),
      core.step('Progress against time', case when p_view -> 'progress' ->> 'built_pct' is not null
        then (p_view -> 'progress' ->> 'built_pct') || '% built with ' || (p_view -> 'progress' ->> 'time_used_pct')
          || '% of the time used. Watch that the gap doesn''t widen.'
        else 'The first QPRs show whether building keeps pace with time.' end,
        (p_view ->> 'authority_short') || ' QPR · latest'));
  else
    v_track := core.group_track_record((p_view ->> 'group_id')::uuid);
    select pg_catalog.array_agg((o.v ->> 'name') || ' (' || (o.v ->> 'band_label') || ')' order by o.v ->> 'name')
      into v_others
    from (
      select core.phase_view(p.id) as v
      from core.phases p
      where p.id <> v_phase_id and core.phase_group_id(p.id) = (p_view ->> 'group_id')::uuid
    ) as o
    where (o.v ->> 'show_band')::boolean;
    v_steps := pg_catalog.jsonb_build_array(
      core.step('The group''s record', case
          when coalesce((v_track ->> 'finished')::integer, 0) > 0
            then (v_track ->> 'late') || ' of ' || (v_track ->> 'finished') || ' finished projects late.'
          else 'No finished RERA project yet.' end
        || coalesce(' Its ongoing phases: ' || core.list_join(v_others) || '.', ''),
        (p_view ->> 'authority_short') || ' + DTCP OC records'),
      core.step('The registration', 'Approved plans, the DTCP licence and the promised date, all filed with '
        || (p_view ->> 'authority_short') || '.',
        (p_view ->> 'authority_short') || ' registration' || coalesce(' · ' || ops.fmt_month((p_view ->> 'registered_on')::date), '')),
      core.step('The escrow account', 'A CA certificate with each QPR on money taken out of the project account.',
        (p_view ->> 'authority_short') || ' Form 3 · with each QPR'),
      core.step('The first QPRs', 'Due 15 days after each quarter ends. They show whether building starts on time.',
        (p_view ->> 'authority_short') || ' QPR register'));
  end if;
  return pg_catalog.jsonb_build_object(
    'intro_line', case when p_view ->> 'state' = 'limited_history'
      then 'Not enough history to score. These are the records to read.'
      else 'Not scored yet. These are the records to read.' end,
    'steps', v_steps,
    'base_rate_line', core.base_rate_line(p_view),
    'lower_band_nearby', '[]'::jsonb,
    'rule_line', v_rule_line);
end
$$;

create function core.step(p_heading text, p_body text, p_source_label text default null)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object('heading', p_heading, 'body', p_body, 'source_label', p_source_label)
$$;
comment on function core.step(text, text, text) is 'A NextStep {heading, body, source_label}.';
comment on function core.pp_next_steps(jsonb, jsonb) is 'ProjectPage.next_steps: "We never say buy or don''t buy." Steps by band (with the phase''s own demand, delay cost and missing QPR where it has them), the base rate, lower-band projects nearby; records to read for a phase without a band; records we keep watching in facts-only.';

-- ---------------------------------------------------------------------------
-- Before booking: payment plans, loans ("Loan checks arrive in 2027"), NRI, selling
-- ---------------------------------------------------------------------------
create function core.para(p_lead text, p_text text, p_tone text default 'body')
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object('lead', p_lead, 'text', p_text, 'tone', p_tone)
$$;
comment on function core.para(text, text, text) is 'A BookingPara {lead, text, tone}.';

create function core.pp_before_booking(p_view jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_phase_id uuid := (p_view ->> 'id')::uuid;
  v_brand text := p_view ->> 'group_brand';
  v_plan ws.payment_plans%rowtype;
  v_first record;
  v_last record;
  v_n integer;
  v_demand core.editorial_notes%rowtype;
  v_slab integer;
  v_by_tower text[];
  v_brochure ws.developer_documents%rowtype;
  v_tp ws.developer_documents%rowtype;
  v_super numeric;
  v_plans jsonb := '[]'::jsonb;
  v_loans jsonb;
  v_selling jsonb;
begin
  select * into v_plan from core.phase_plan(v_phase_id);
  select * into v_demand from core.editorial('phase', v_phase_id, 'demand');
  select ts.slab into v_slab from core.tower_slabs(v_phase_id) ts where ts.tower = v_demand.body ->> 'tower';
  select * into v_brochure from ws.developer_documents d
  where d.phase_id = v_phase_id and d.kind = 'brochure' and d.status = 'published' and d.dated <= ops.today()
  order by d.dated desc limit 1;
  select * into v_tp from ws.developer_documents d
  where d.phase_id = v_phase_id and d.kind = 'transfer_policy' and d.status = 'published' and d.dated <= ops.today()
  order by d.dated desc limit 1;
  select u.super_sqft into v_super from core.unit_types u where u.phase_id = v_phase_id and u.label = '3 BHK';

  if v_plan.id is not null then
    select pg_catalog.count(*)::integer into v_n from ws.payment_plan_stages s where s.plan_id = v_plan.id;
    select s.label, s.pct into v_first from ws.payment_plan_stages s where s.plan_id = v_plan.id order by s.seq limit 1;
    select s.label, s.pct into v_last from ws.payment_plan_stages s where s.plan_id = v_plan.id order by s.seq desc limit 1;
    select pg_catalog.array_agg(core.fmt_num(d.due_pct) || '% in Tower ' || d.tower order by d.tower) into v_by_tower
    from core.plan_tower_dues(v_phase_id, v_plan.id) d;
    v_plans := v_plans || core.para(null,
      core.possessive(v_brand) || ' plan for ' || (p_view ->> 'label') || ' is '
      || pg_catalog.replace(v_plan.kind, '_', '-') || ': ' || v_n || ' stages, from '
      || core.fmt_num(v_first.pct) || '% on ' || pg_catalog.lower(v_first.label) || ' to '
      || core.fmt_num(v_last.pct) || '% on ' || pg_catalog.lower(v_last.label)
      || '. It is under “From the developer” in Homes.');
  end if;
  v_plans := v_plans || pg_catalog.jsonb_build_array(
    core.para('Construction-linked.', 'You pay each stage once it is built, so your money follows the building. '
      || case when v_demand.id is not null and v_slab is not null
           then 'Watch for demands ahead of the filings: ' || v_brand || ' asked for Tower ' || (v_demand.body ->> 'tower')
             || ' slab ' || (v_demand.body ->> 'slab_no') || ' on ' || ops.fmt_date((v_demand.body ->> 'sent_on')::date)
             || ', and the latest QPR shows slab ' || v_slab || '.'
           else 'Check each demand against the latest QPR.' end),
    core.para('Down payment.', 'You pay most of the price early, often for a discount. If the project is late, more of '
      || 'your money waits with it. Before a registered agreement, the law still caps you at 10%.'),
    core.para('Subvention, or “no EMI till possession”.', 'The bank pays the developer early, and the developer promises '
      || 'to pay your pre-EMI. You are still the borrower: if the developer stops paying, the bank collects from you.'),
    core.para('Before a subvention booking,', 'get the lender''s confirmation in writing: what it pays out, when, and who '
      || 'pays the pre-EMI if the developer stops.', 'key'));
  if v_by_tower is not null then
    v_plans := v_plans || core.para('Slab stages follow your tower.',
      'Booking today, by registration you would pay ' || core.list_join(v_by_tower) || '.');
  end if;

  v_loans := pg_catalog.jsonb_build_array(
    core.para('Loan checks arrive in 2027.', 'Plinth doesn''t arrange loans or pass your number to any lender today.'),
    core.para('Check now:', 'is this project approved by your bank? Ask the bank, in writing, not the developer.', 'key'));
  if v_brochure.summary ? 'lenders_claim' then
    v_loans := v_loans || core.para(
      'Developer says · brochure, ' || ops.fmt_date(v_brochure.dated) || ' · not verified:',
      '“' || pg_catalog.upper(pg_catalog.left(v_brochure.summary ->> 'lenders_claim', 1))
        || pg_catalog.substr(v_brochure.summary ->> 'lenders_claim', 2) || '.”',
      'developer_says');
  end if;
  v_loans := v_loans || core.para('Banks usually don''t lend for stamp duty or registration.',
    'Plan for those from your own money.');

  v_selling := pg_catalog.jsonb_build_array(core.para(null,
    'Selling before possession means transferring your allotment. The developer endorses the new buyer on your '
    || 'agreement and issues a no-objection certificate (NOC).'));
  if v_tp.id is not null then
    v_selling := v_selling || core.para(
      'From the developer · not verified by Plinth · transfer policy, ' || ops.fmt_date(v_tp.dated) || ':',
      core.transfer_policy_line(v_tp.summary, v_super), 'from_developer');
  end if;
  v_selling := v_selling || pg_catalog.jsonb_build_array(
    core.para('Under RERA,', 'whoever takes your allotment becomes the allottee, with your rights, including delay '
      || 'interest (s.2(d)).'),
    core.para('Ask a CA', 'about capital-gains tax, and a lawyer about stamp duty on the transfer.'),
    core.para(null, 'Our resale and transfer checks are planned for Apr–Jun 2027.'));

  return pg_catalog.jsonb_build_object(
    'intro_line', 'Four things buyers ask about before the first cheque, with the rules behind them.',
    'note_line', 'General information, not legal, tax or financial advice.',
    'payment_plans', pg_catalog.jsonb_build_object(
      'title', 'Which payment plan?',
      'sub', 'Construction-linked, down payment or subvention, and what each one risks.',
      'paras', v_plans),
    'loans', pg_catalog.jsonb_build_object(
      'line', 'Loan checks arrive in 2027',
      'title', 'Home loans',
      'sub', 'Loan checks arrive in 2027. What to check with your bank now.',
      'paras', v_loans),
    'nri', pg_catalog.jsonb_build_object(
      'title', 'Buying from abroad (NRI)',
      'sub', 'Paying from NRE or NRO, a power of attorney, and FEMA basics.',
      'paras', pg_catalog.jsonb_build_array(
        core.para('Paying.', 'From an NRE, FCNR(B) or NRO account, or money sent to India through a bank. FEMA doesn''t '
          || 'allow paying in foreign currency notes or traveller''s cheques.'),
        core.para('Loans.', 'Indian banks lend to NRIs. EMIs come from an NRE or NRO account.'),
        core.para('TDS.', 'Like any buyer, you deduct 1% from each instalment when the price is ₹50 L or more '
          || '(s.194-IA). You need a PAN.'),
        core.para('Power of attorney.', 'Make it specific to this flat, and list what your relative may sign: booking '
          || 'form, agreement, payments, registration. One signed abroad is attested at an Indian mission or '
          || 'apostilled, then stamped in India within 3 months.'))),
    'selling_before_possession', pg_catalog.jsonb_build_object(
      'title', 'Selling before possession',
      'sub', 'Transfer charges, the builder''s NOC and what RERA says.',
      'paras', v_selling)
  );
end
$$;
comment on function core.pp_before_booking(jsonb) is 'ProjectPage.before_booking: payment plans (with this phase''s plan, its demands and its per-tower dues), loans ("Loan checks arrive in 2027"; no lender is named or paid), NRI basics and selling before possession (with the developer''s transfer policy). General information, not advice.';

-- ---------------------------------------------------------------------------
-- Pre-RERA record (never counted in a band)
-- ---------------------------------------------------------------------------
create function core.pre_rera_json(p_group_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select case when pg_catalog.count(r.id) > 0 then pg_catalog.jsonb_build_object(
    'line', 'None of this counts in the band.',
    'intro_line', 'The track record counts RERA-era projects only, registered 2017 or later. '
      || core.group_brand(p_group_id) || ' built before that too.',
    'coverage_line', 'Before May 2017 there was no public register of promised dates, so this list may be incomplete.',
    'items', pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'name', r.project_name || coalesce(', ' || r.sector, '')
        || coalesce(' (' || ((core.editorial('pre_rera', r.id, 'year')).body ->> 'year') || ')', ''),
      'line', case
        when r.promised is not null then 'Promised ' || ops.fmt_month(r.promised) || '.'
          || coalesce(' OC ' || ops.fmt_month(r.oc_on)
               || case when r.months_late > 12 then ', about ' || r.months_late || ' months late' else '' end || '.', '')
        else 'No court order or news found. Absence is not proof.' end,
      'sources', coalesce(r.sources, '[]'::jsonb))
      order by r.promised nulls last, r.project_name)) end
  from core.pre_rera_records r
  where r.group_id = p_group_id
$$;
comment on function core.pre_rera_json(uuid) is 'The group''s pre-RERA record (DESIGN §5b): promised and OC dates where a court order or news report gives them. Shown, never counted in a band. Null when there is none.';

-- ---------------------------------------------------------------------------
-- Records: the evidence list (EvidenceSummary[])
-- ---------------------------------------------------------------------------
create function core.pp_records(p_view jsonb)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with ctx as (
    select (p_view ->> 'id')::uuid as phase_id, (p_view ->> 'group_id')::uuid as group_id,
      p_view ->> 'authority_short' as auth, p_view ->> 'label' as label,
      (p_view ->> 'computed_at')::timestamptz as computed_at
  ),
  reg as (select r.* from core.rera_registrations r where r.id = (p_view ->> 'reg_id')::uuid),
  towers as (select pg_catalog.array_agg(t.code order by t.code) as codes from core.towers t, ctx where t.phase_id = ctx.phase_id),
  rec_units as (
    select core.list_join(pg_catalog.array_agg(u.label || ' ' || core.fmt_count(pg_catalog.round(u.carpet_sqft)::bigint) || ' sq ft'
                                                order by u.label)) as line
    from core.unit_types u, ctx
    where u.phase_id = ctx.phase_id and u.lane = 'records_show' and u.carpet_sqft is not null
  ),
  missing_count as (
    select pg_catalog.count(*)::integer as n from core.qpr_filings q, reg
    where q.registration_id = reg.id and q.status = 'missing' and q.due_on <= ops.today()
  ),
  phase_rows as (
    -- 1. The registration.
    select 1 as ord, '' as k, f.id, f.lane, f.as_of,
      ctx.auth || ' registration · ' || pg_catalog.to_char(reg.registered_on, 'YYYY') as chip,
      'Registered ' || ops.fmt_date_precision(reg.registered_on, reg.registered_on_precision)
        || '. Original completion date: ' || ops.fmt_month(reg.original_completion) || '.'
        || case when towers.codes is not null and rec_units.line is not null
             then ' Towers ' || towers.codes[1] || '–' || towers.codes[pg_catalog.cardinality(towers.codes)]
               || coalesce(', ' || core.fmt_count((p_view ->> 'units_total')::bigint) || ' homes', '')
               || ': ' || rec_units.line || ' carpet.'
             else '' end as line
    from core.phase_facts((p_view ->> 'id')::uuid, 'registration.dates') f, ctx, reg, towers, rec_units
    union all
    -- 2. Extensions on record (the count), then each extension order.
    select 2, '', f.id, f.lane, f.as_of, ctx.auth || ' extension orders',
      case when coalesce((f.value ->> 'count')::integer, 0) = 0
        then 'No Section 6 extension found for ' || ctx.label || '.'
        else (f.value ->> 'count') || ' Section 6 extensions on record.' end
    from core.phase_facts((p_view ->> 'id')::uuid, 'registration.extensions') f, ctx
    union all
    select 3, pg_catalog.lpad(coalesce(f.value ->> 'seq', '0'), 4, '0'), f.id, f.lane, f.as_of,
      core.fact_source_label(f.attribute, f.value),
      'Extension ' || (f.value ->> 'seq') || ' moved the date from ' || core.fmt_loose_date(f.value ->> 'from_completion')
        || ' to ' || core.fmt_loose_date(f.value ->> 'to_completion') || '.'
    from core.phase_facts((p_view ->> 'id')::uuid, 'registration.extension') f
    union all
    -- 3. Every QPR with figures.
    select 4, f.value ->> 'quarter', f.id, f.lane, f.as_of, core.fact_source_label(f.attribute, f.value),
      case when f.value ? 'sold_pct'
        then (f.value ->> 'sold_pct') || '% of units sold, ' || (f.value ->> 'built_pct') || '% built.'
        else (f.value ->> 'built_pct') || '% built.' end
    from core.phase_facts((p_view ->> 'id')::uuid, 'qpr.progress') f
    union all
    -- 4. The QPR register: late filings in the window.
    select 5, '', f.id, f.lane, f.as_of, ctx.auth || ' QPR register',
      case when coalesce((f.value ->> 'late_in_last_8')::integer, 0) > 0
        then 'QPRs filed late in ' || (f.value ->> 'late_in_last_8') || ' of the last 8 quarters.'
          || coalesce(' Longest delay: ' || (f.value ->> 'longest_days_late') || ' days.', '')
        else 'QPRs filed on time in each of the last 8 quarters.' end
    from core.phase_facts((p_view ->> 'id')::uuid, 'qpr.filing_record') f, ctx
    union all
    -- 5. QPRs not on the portal yet.
    select 6, f.value ->> 'quarter', f.id, f.lane, f.as_of,
      ctx.auth || ' QPR register · ' || ops.fmt_date(f.as_of),
      'The ' || ops.fmt_quarter(f.value ->> 'quarter') || ' QPR is not on ' || ctx.auth || ' yet.'
        || case when missing_count.n = 1 and f.value ? 'due_on'
             then ' It was due ' || ops.fmt_date((f.value ->> 'due_on')::date) || '.' else '' end
    from core.phase_facts((p_view ->> 'id')::uuid, 'qpr.missing') f, ctx, missing_count
    union all
    -- 6. A filing in since the published run, being read now (no figures until the re-score).
    select 7, f.value ->> 'quarter', f.id, f.lane, f.as_of,
      core.fact_source_label('qpr.progress', f.value) || coalesce(' · filed ' || ops.fmt_date(q.filed_on), ''),
      coalesce('Filed ' || ops.fmt_date(q.filed_on) || case when q.status = 'late'
        then ', ' || q.days_late || ' days late.' else ', on time.' end || ' ', '')
        || 'We fetched it ' || ops.fmt_date(ops.ist_date(q.fetched_at)) || ', ' || core.fmt_clock(q.fetched_at)
        || ', and are reading it now.'
    from core.phase_facts((p_view ->> 'id')::uuid, 'qpr.filing_status') f
    join reg on true
    join ctx on true
    join core.qpr_filings q on q.registration_id = reg.id and q.quarter = f.value ->> 'quarter'
    where q.fetched_at > ctx.computed_at and q.fetched_at <= ops.now()
    union all
    -- 7. Complaints decided against the promoter.
    select 8, '', f.id, f.lane, f.as_of, core.fact_source_label(f.attribute, f.value),
      (f.value ->> 'count') || case when (f.value ->> 'count') = '1' then ' complaint' else ' complaints' end
        || ' decided against the promoter in 24 months · ' || (f.value ->> 'per_100_units') || ' per 100 units ('
        || core.fmt_count((f.value ->> 'units_base')::bigint) || ' units).'
        || coalesce(' Median count for similar projects: ' || (f.value ->> 'median_count_similar') || '.', '')
    from core.phase_facts((p_view ->> 'id')::uuid, 'orders.complaints_against_promoter_24m') f
  ),
  group_facts as (
    select f.*
    from core.facts f, ctx
    where f.superseded_by is null and f.lane <> 'buyer_upload' and f.learned_at <= ops.now()
      and ((f.subject_type = 'group' and f.subject_id = ctx.group_id)
        or (f.subject_type = 'developer' and f.subject_id in (select d.id from core.developers d where d.group_id = ctx.group_id)))
  ),
  group_rows as (
    -- 8. The group's track record, then its insolvency checks.
    select 9 as ord, '' as k, f.id, f.lane, f.as_of, core.fact_source_label(f.attribute, f.value) as chip,
      (f.value ->> 'late') || ' of the group''s ' || (f.value ->> 'finished')
        || ' finished RERA projects got OC more than 12 months late.' as line
    from group_facts f
    where f.attribute = 'track_record.late12' and coalesce((f.value ->> 'finished')::integer, 0) > 0
    union all
    select 10, '', f.id, f.lane, f.as_of, core.fact_source_label(f.attribute, f.value),
      case when f.attribute = 'insolvency.search'
        then case when (f.value ->> 'found')::boolean then 'Insolvency proceedings found for the ' || g.name || ' group.'
               else 'No insolvency found for the ' || g.name || ' group.' end
        else 'A group company of ' || g.name || ' was admitted to insolvency by '
          || coalesce(f.value ->> 'forum', 'NCLT') || ' order on ' || core.fmt_loose_date(f.value ->> 'order_on') || '.' end
    from group_facts f
    join core.developer_groups g on g.id = (p_view ->> 'group_id')::uuid
    where f.attribute in ('insolvency.search', 'insolvency.admitted')
  ),
  account_rows as (
    -- 9. The RERA collection account (public record; it feeds the payee check).
    select 11 as ord, '' as k, f.id, f.lane, f.as_of,
      ctx.auth || ' registration · collection account' as chip,
      'RERA collection account: ' || (f.value ->> 'bank') || coalesce(', ' || (f.value ->> 'branch'), '')
        || ', account ending ' || coalesce(f.value ->> 'account_last4', pg_catalog.right(f.value ->> 'account_number', 4))
        || coalesce(', IFSC ' || (f.value ->> 'ifsc'), '') || '.' as line
    from core.phase_facts((p_view ->> 'id')::uuid, 'registration.collection_account') f, ctx
  )
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'fact_id', x.id, 'chip', x.chip, 'line', x.line, 'lane', x.lane, 'as_of', x.as_of,
           'evidence_url', '/evidence/' || x.id)
         order by x.ord, x.k, x.as_of, x.id), '[]'::jsonb)
  from (select * from phase_rows union all select * from group_rows union all select * from account_rows) as x
$$;
comment on function core.pp_records(jsonb) is 'ProjectPage.records: the evidence list, one line per public fact (registration, extensions, QPRs, the register, missing QPRs, a filing being read, complaints, the group''s track record and insolvency checks, the collection account), each opening its evidence drawer.';

-- ---------------------------------------------------------------------------
-- The project page
-- ---------------------------------------------------------------------------
create function core.project_page_json(p_phase_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_view jsonb;
  v_risk jsonb;
  v_afford jsonb;
  v_tower text;
begin
  v_view := core.phase_view(p_phase_id);
  if v_view is null or v_view ->> 'run_id' is null then
    return null;
  end if;
  v_risk := core.risk_summary_json(p_phase_id);
  if v_risk is null then
    return null;
  end if;
  select ts.tower into v_tower from core.tower_slabs(p_phase_id) ts order by ts.tower limit 1;
  v_afford := core.afford_the_wait(p_phase_id, v_tower, 450000, 55000, 20, 8.5, 20, 12);

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.project_page/1',
    'risk', v_risk,
    'hero', core.pp_hero(v_view),
    'truth_panel', core.pp_truth_panel(v_view),
    'progress', core.pp_progress(v_view),
    'homes', core.pp_homes(v_view),
    'from_developer', core.pp_from_developer(v_view),
    'cost', core.cost_breakdown_json(p_phase_id, '3 BHK', 'male', '{}'::text[]),
    'wait_defaults', pg_catalog.jsonb_build_object(
      'take_home_inr', 450000, 'rent_inr', 55000, 'down_pct', 20, 'rate_pct', 8.5, 'tenure_years', 20),
    'afford_default', v_afford,
    'next_steps', core.pp_next_steps(v_view, v_afford),
    'before_booking', core.pp_before_booking(v_view),
    'pre_rera', core.pre_rera_json((v_view ->> 'group_id')::uuid),
    'records', core.pp_records(v_view),
    'meta', v_risk -> 'meta'
  );
end
$$;
comment on function core.project_page_json(uuid) is 'plinth.project_page/1 (API_CONTRACTS §4.2): the RiskSummary plus hero, truth panel, progress replay, homes, From the developer, cost, Afford the wait at the defaults (DESIGN §5b: ₹4.5 L take-home, ₹55,000 rent, 20% down, 8.5%, 20 years), next steps, before booking, pre-RERA and records. Null for a phase with no published run.';

-- ---------------------------------------------------------------------------
-- Lockdown sweep (T04 pattern, BUILD_PLAN §12.1), then the explicit api grants.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
grant execute on function api.risk_summary(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text) to anon, authenticated, service_role;
