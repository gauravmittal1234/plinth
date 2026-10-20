-- T13 · API reads B 3/6: shared helpers and the phase view behind every M1 page.
-- Sources: API_CONTRACTS §1 (copy from the server), §2 (chip, display state, overlays),
-- §4.2–§4.5; DATA_MODEL §1–§3, §12 inv. 2 and 8; INTEGRATION_NOTES (T11: the published band
-- is the latest run with published_on ≤ today; a pending_notice run never surfaces).
--
-- core.phase_view(phase_id) gathers, once, what every page needs about a phase: names and
-- places, the registration, the published run (never a draft or a pending_notice run), what a
-- buyer may see (bands public, not facts-only, scored; DATA_MODEL §12 inv. 8), the chip, the
-- overlays, progress, price and complaints. It reuses T12's helpers (core.risk_progress,
-- core.risk_price, core.risk_complaints, core.group_facts_only, core.band_since …) so a chip or
-- a price line reads the same on the risk card, the project page, search, compare and the
-- developer page. Every function is private to `core`, pins search_path = '' and reads the
-- clock from ops.now() / ops.today().

-- ---------------------------------------------------------------------------
-- Small formatters
-- ---------------------------------------------------------------------------
create function core.list_join(p_items text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case pg_catalog.cardinality(x.items)
    when 0 then null
    when 1 then x.items[1]
    else pg_catalog.array_to_string(x.items[1:pg_catalog.cardinality(x.items) - 1], ', ')
      || ' and ' || x.items[pg_catalog.cardinality(x.items)]
  end
  from (select pg_catalog.array_remove(coalesce(p_items, '{}'::text[]), null) as items) as x
$$;
comment on function core.list_join(text[]) is 'An English list: {A} → A; {A,B} → A and B; {A,B,C} → A, B and C. Nulls are dropped; empty → null.';

create function core.phase_label(p_name text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select coalesce(pg_catalog.substring(p_name, ',\s*(.+)$'), p_name)
$$;
comment on function core.phase_label(text) is 'How copy names a phase within its project: "Aurelia Heights, Phase 2" → "Phase 2"; "Kestrel Park" → "Kestrel Park".';

create function core.first_word(p_text text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.split_part(pg_catalog.btrim(p_text), ' ', 1)
$$;
comment on function core.first_word(text) is 'The first word: "Aurelia Heights" → "Aurelia" (a project''s short name in copy).';

create function core.month_diff(p_from date, p_to date)
returns integer
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select core.month_index(p_to) - core.month_index(p_from)
$$;
comment on function core.month_diff(date, date) is 'Whole calendar months from one date''s month to another''s: Dec 2020 → Mar 2023 = 27.';

create function core.fmt_inr_range_lakh(p_low bigint, p_high bigint)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select '₹' || pg_catalog.trim_scale(pg_catalog.round(p_low / 100000.0, 1))::text
    || '–' || pg_catalog.trim_scale(pg_catalog.round(p_high / 100000.0, 1))::text || ' L'
$$;
comment on function core.fmt_inr_range_lakh(bigint, bigint) is 'A rupee range in lakh: 12,00,000–18,00,000 → ₹12–18 L.';

-- A centroid as [lng, lat] (GeoJSON order, API_CONTRACTS §4.3). Postgres + PostGIS prints a
-- geography as hex EWKB; PGlite (no PostGIS) stores the seed's EWKT text as bytea. Both reach
-- here as text, so no PostGIS function is needed (and the same SQL runs on both).
create function core.point_lnglat(p_value text)
returns jsonb
language plpgsql
immutable
parallel safe
set search_path = ''
as $$
declare
  v_bytes bytea;
  v_text text;
  v_m text[];
  v_off integer;
  v_le boolean;
  v_type bigint;
  v_xy numeric[] := '{}';
  v_bits numeric;
  v_sign integer;
  v_exp integer;
  v_mant numeric;
begin
  if p_value is null or p_value = '' then
    return null;
  end if;
  if pg_catalog.left(p_value, 2) = '\x' then
    v_bytes := pg_catalog.decode(pg_catalog.substr(p_value, 3), 'hex');
  elsif p_value ~* '^[0-9a-f]+$' then
    v_bytes := pg_catalog.decode(p_value, 'hex');
  else
    v_text := p_value;
  end if;
  if v_text is null and pg_catalog.get_byte(v_bytes, 0) not in (0, 1) then
    v_text := pg_catalog.convert_from(v_bytes, 'UTF8');
  end if;

  if v_text is not null then
    v_m := pg_catalog.regexp_match(v_text, 'POINT\s*\(\s*(-?[0-9.]+)\s+(-?[0-9.]+)\s*\)', 'i');
    if v_m is null then
      return null;
    end if;
    return pg_catalog.jsonb_build_array(pg_catalog.trim_scale(v_m[1]::numeric), pg_catalog.trim_scale(v_m[2]::numeric));
  end if;

  -- (E)WKB point: byte order, type (with the SRID flag 0x20000000), [SRID], X, Y as float8.
  v_le := pg_catalog.get_byte(v_bytes, 0) = 1;
  v_type := 0;
  for i in 0..3 loop
    v_type := v_type + pg_catalog.get_byte(v_bytes, 1 + i)::bigint
      * (256::bigint ^ (case when v_le then i else 3 - i end))::bigint;
  end loop;
  v_off := case when (v_type & 536870912) <> 0 then 9 else 5 end;
  for k in 0..1 loop
    v_bits := 0;
    for i in 0..7 loop
      v_bits := v_bits + pg_catalog.get_byte(v_bytes, v_off + 8 * k + i)::numeric
        * (256::numeric ^ (case when v_le then i else 7 - i end));
    end loop;
    v_sign := case when v_bits >= 9223372036854775808 then -1 else 1 end;
    if v_sign < 0 then
      v_bits := v_bits - 9223372036854775808;
    end if;
    v_exp := pg_catalog.floor(v_bits / 4503599627370496)::integer;
    v_mant := v_bits - v_exp::numeric * 4503599627370496;
    v_xy := v_xy || (v_sign * (1 + v_mant / 4503599627370496) * (2::numeric ^ (v_exp - 1023)));
  end loop;
  return pg_catalog.jsonb_build_array(
    pg_catalog.trim_scale(pg_catalog.round(v_xy[1], 6)),
    pg_catalog.trim_scale(pg_catalog.round(v_xy[2], 6)));
end
$$;
comment on function core.point_lnglat(text) is 'A point (hex EWKB from PostGIS, or EWKT text) as [lng, lat], rounded to 6 decimals.';

-- ---------------------------------------------------------------------------
-- Models, runs, the base rate
-- ---------------------------------------------------------------------------
create function core.current_model()
returns core.score_models
language sql
stable
set search_path = ''
as $$
  select m.*
  from core.score_models m
  where m.released_on <= ops.today()
  order by (m.status = 'current') desc, m.released_on desc
  limit 1
$$;
comment on function core.current_model() is 'The model in use today (status current; else the latest released).';

create function core.published_run(p_phase_id uuid)
returns core.score_runs
language sql
stable
set search_path = ''
as $$
  select r.*
  from core.score_runs r
  where r.phase_id = p_phase_id
    and r.status = 'published'
    and (r.published_at is null or ops.ist_date(r.published_at) <= ops.today())
  order by r.published_at desc nulls last
  limit 1
$$;
comment on function core.published_run(uuid) is 'The phase''s published run as of today (published_on ≤ today). Never a draft or a pending_notice run (DATA_MODEL §12 inv. 2).';

create function core.base_rate()
returns jsonb
language sql
stable
set search_path = ''
as $$
  select case when pg_catalog.sum(c.n_projects) > 0 then pg_catalog.jsonb_build_object(
    'n_projects', pg_catalog.sum(c.n_projects)::integer,
    'n_late', pg_catalog.sum(c.n_late)::integer,
    'per_100', pg_catalog.round(100.0 * pg_catalog.sum(c.n_late) / pg_catalog.sum(c.n_projects))::integer) end
  from core.calibration c
  where c.model_version = (core.current_model()).version
$$;
comment on function core.base_rate() is 'The base rate of the current model''s calibration: about 36 of 100 Gurugram projects got OC more than 12 months late (76 of 212).';

-- ---------------------------------------------------------------------------
-- Groups: the brand word, the developer line on a card
-- ---------------------------------------------------------------------------
create function core.group_brand(p_group_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when coalesce(((core.editorial('group', g.id, 'linked_companies')).body ->> 'count')::integer, 0) > 1
      then core.group_short_name(g.name)
    else g.name
  end
  from core.developer_groups g
  where g.id = p_group_id
$$;
comment on function core.group_brand(uuid) is 'How copy names a group: the brand word of a multi-company group ("Northfield"), else its name ("Halcyon Homes").';

-- ---------------------------------------------------------------------------
-- Facts about a phase (its own, its registrations'' and its towers'')
-- ---------------------------------------------------------------------------
create function core.phase_facts(p_phase_id uuid, p_attribute text)
returns setof core.facts
language sql
stable
set search_path = ''
as $$
  select f.*
  from core.facts f
  where f.attribute = p_attribute
    and f.superseded_by is null
    and f.lane <> 'buyer_upload'
    and f.learned_at <= ops.now()
    and (f.valid_to is null or f.valid_to > ops.today())
    and (
      (f.subject_type = 'phase' and f.subject_id = p_phase_id)
      or (f.subject_type = 'registration' and f.subject_id in (select r.id from core.rera_registrations r where r.phase_id = p_phase_id))
      or (f.subject_type = 'tower' and f.subject_id in (select t.id from core.towers t where t.phase_id = p_phase_id))
    )
$$;
comment on function core.phase_facts(uuid, text) is 'Current public facts of one attribute about a phase, its registrations or its towers (not superseded, still valid, learned by ops.now(), never buyer uploads).';

-- ---------------------------------------------------------------------------
-- The phase view
-- ---------------------------------------------------------------------------
create function core.phase_view(p_phase_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_phase core.phases%rowtype;
  v_project core.projects%rowtype;
  v_group core.developer_groups%rowtype;
  v_promoter core.developers%rowtype;
  v_reg core.rera_registrations%rowtype;
  v_run core.score_runs%rowtype;
  v_sector core.localities%rowtype;
  v_corridor core.localities%rowtype;
  v_city jsonb;
  v_bands_public boolean := ops.flag('bands_public');
  v_facts_only jsonb;
  v_band_visible boolean;
  v_show_band boolean;
  v_overlays jsonb := '[]'::jsonb;
  v_chip jsonb;
  v_rank integer;
  v_label text;
  v_step integer;
  v_freq_short text;
  v_display text;
  v_ext integer;
  v_progress jsonb;
begin
  select * into v_phase from core.phases p where p.id = p_phase_id;
  if not found then
    return null;
  end if;
  select * into v_project from core.projects pr where pr.id = v_phase.project_id;
  select * into v_group from core.developer_groups g where g.id = core.phase_group_id(p_phase_id);
  select * into v_promoter from core.developers d where d.id = v_phase.promoter_id;
  select * into v_reg from core.phase_registration(p_phase_id);
  select * into v_run from core.published_run(p_phase_id);

  select * into v_sector from core.localities l where l.id = v_project.locality_id;
  if v_sector.kind in ('corridor', 'zone') then
    v_corridor := v_sector;
  else
    select * into v_corridor from core.localities l where l.id = v_sector.parent_id and l.kind in ('corridor', 'zone');
  end if;
  v_city := core.locality_city(v_project.locality_id);

  select pg_catalog.count(*)::integer into v_ext from core.extensions e where e.registration_id = v_reg.id;

  v_facts_only := core.group_facts_only(v_group.id);
  v_band_visible := v_bands_public and v_facts_only is null;
  v_show_band := v_band_visible and v_run.state = 'scored' and v_run.band is not null;
  v_progress := case when v_reg.id is not null then core.risk_progress(p_phase_id, v_reg.id, coalesce(v_run.stale, false)) end;

  if v_run.id is not null and v_facts_only is null then
    if v_run.stale then
      v_overlays := v_overlays || '["stale"]'::jsonb;
    end if;
    if exists (
      select 1 from core.qpr_filings q
      where q.registration_id = v_reg.id and q.fetched_at > v_run.computed_at and q.fetched_at <= ops.now()
    ) then
      v_overlays := v_overlays || '["rescoring"]'::jsonb;
    end if;
    if v_run.stall then
      v_overlays := v_overlays || '["stalled"]'::jsonb;
    end if;
    if v_band_visible and exists (
      select 1 from core.band_notices n where n.phase_id = p_phase_id and n.status = 'pending'
    ) then
      v_overlays := v_overlays || '["pending_change"]'::jsonb;
    end if;
  end if;

  if v_show_band then
    v_label := core.band_label(v_run.band);
    v_step := core.band_step(v_run.band);
    if v_run.set_by is distinct from 'red_flag_rule' then
      v_freq_short := case
        when v_run.freq_point is not null then 'About ' || v_run.freq_point || ' of 100'
        when v_run.freq_low is not null and v_run.freq_high is not null
          then 'Between ' || v_run.freq_low || ' and ' || v_run.freq_high || ' of 100'
      end;
    end if;
  end if;

  -- The chip (identical to RiskSummary.chip) and the search rank: bands first (Low → Severe),
  -- then limited history, then not scored with facts-only and bands-off phases (never hidden).
  v_chip := case
    when v_run.id is null then null
    when v_facts_only is not null then pg_catalog.jsonb_build_object(
      'kind', 'withheld', 'label', 'Band withheld · facts only', 'step', null, 'meter_filled', 0)
    when v_run.state = 'limited_history' then pg_catalog.jsonb_build_object(
      'kind', 'limited_history', 'label', 'Not enough history to score · no penalty', 'step', null, 'meter_filled', 0)
    when v_run.state = 'not_scored' then pg_catalog.jsonb_build_object(
      'kind', 'not_scored', 'label', 'Not scored', 'step', null, 'meter_filled', 0)
    when not v_bands_public then pg_catalog.jsonb_build_object(
      'kind', 'withheld', 'label', 'Facts only · bands not published yet', 'step', null, 'meter_filled', 0)
    else pg_catalog.jsonb_build_object('kind', 'band', 'label', v_label, 'step', v_step, 'meter_filled', v_step)
  end;
  v_rank := case
    when v_show_band then v_step
    when v_band_visible and v_run.state = 'limited_history' then 6
    else 7
  end;
  v_display := case when v_facts_only is not null then 'facts_only' else v_run.state::text end;

  return pg_catalog.jsonb_build_object(
    'id', v_phase.id,
    'slug', v_phase.slug,
    'name', v_phase.name,
    'label', core.phase_label(v_phase.name),
    'units_total', v_phase.units_total,
    'status', v_phase.status,
    'short_code', v_phase.short_code,
    'project_id', v_project.id,
    'project_name', v_project.name,
    'project_word', core.first_word(v_project.name),
    'centroid', core.point_lnglat(v_project.centroid::text),
    'group_id', v_group.id,
    'group_slug', v_group.slug,
    'group_name', v_group.name,
    'group_brand', core.group_brand(v_group.id),
    'promoter_name', v_promoter.legal_name,
    'locality_line', coalesce(core.locality_line(v_project.locality_id), v_city ->> 'name'),
    'sector_name', case when v_sector.kind = 'sector' then v_sector.name end,
    'corridor_id', v_corridor.id,
    'corridor_slug', v_corridor.slug,
    'corridor_name', v_corridor.name,
    'city_slug', v_city ->> 'slug',
    'city_name', v_city ->> 'name'
  ) || pg_catalog.jsonb_build_object(
    'reg_id', v_reg.id,
    'authority', v_reg.authority,
    'authority_short', core.authority_short(v_reg.authority),
    'authority_url', core.authority_json(v_reg.authority, v_reg.official_url) ->> 'url',
    'rera_number', v_reg.rera_number,
    'registered_on', v_reg.registered_on,
    'registered_precision', v_reg.registered_on_precision,
    'original_completion', v_reg.original_completion,
    'current_completion', v_reg.current_completion,
    'extensions', v_ext,
    'run_id', v_run.id,
    'state', v_run.state,
    'band', v_run.band,
    'set_by', v_run.set_by,
    'rule_code', v_run.rule_code,
    'confidence', v_run.confidence,
    'freq_low', v_run.freq_low,
    'freq_high', v_run.freq_high,
    'freq_point', v_run.freq_point,
    'stale', coalesce(v_run.stale, false),
    'stall', coalesce(v_run.stall, false),
    'computed_at', v_run.computed_at,
    'data_cutoff', v_run.data_cutoff,
    'model_version', v_run.model_version
  ) || pg_catalog.jsonb_build_object(
    'facts_only', v_facts_only,
    'bands_public', v_bands_public,
    'band_visible', v_band_visible,
    'show_band', v_show_band,
    'display_state', v_display,
    'band_label', v_label,
    'band_step', v_step,
    'band_since', case when v_show_band
      then coalesce(core.band_since(p_phase_id, v_run.band, v_run.state), ops.ist_date(v_run.published_at)) end,
    'freq_short', v_freq_short,
    'chip', v_chip,
    'rank', v_rank,
    'overlays', v_overlays,
    'progress', v_progress,
    'price', core.risk_price(p_phase_id),
    'complaints', core.risk_complaints('phase', p_phase_id)
  );
end
$$;
comment on function core.phase_view(uuid) is 'Everything the M1 pages need about a phase, from its published run only: names, places, registration, what buyers may see (bands public, not facts-only, scored), chip, rank, overlays, progress, price, complaints. Null for an unknown phase.';

-- ---------------------------------------------------------------------------
-- Lockdown sweep (T04 pattern, BUILD_PLAN §12.1), then the explicit api grants.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
grant execute on function api.risk_summary(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text) to anon, authenticated, service_role;
