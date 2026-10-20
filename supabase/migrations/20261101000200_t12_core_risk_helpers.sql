-- T12 · API reads A 2/3: the composition helpers behind api.risk_summary and api.evidence.
-- Sources: API_CONTRACTS §1 ("copy from the server"), §2 (RiskSummary), §4.6 (Evidence);
-- DATA_MODEL §1–§4, §12 inv. 2 and 8; DESIGN §5b (copy and figures); score_models.config
-- (confidence, not-scored and re-score rules); contracts catalogues/reason_codes.json.
--
-- Every buyer-facing line is composed here, on the server, from the records: clients
-- render it and never compose risk copy (AGENTS §5, §7). Each helper is private to
-- `core` (no EXECUTE for anon or authenticated; the sweep at the end enforces it) and is
-- reached only through the SECURITY DEFINER api functions in 20261101000300. T13 reuses
-- core.risk_summary_json() for project_page.risk and the smaller helpers for its pages.
--
-- The firewall (DATA_MODEL §12 inv. 2): only published runs are ever read. Draft and
-- pending_notice runs, their reasons and a notice's to_band are never selected here.
-- All business dates come from ops.now() / ops.today() (the frozen clock in test and
-- fixture). Every function pins search_path = '' and qualifies its names.

-- ---------------------------------------------------------------------------
-- Formatting (DESIGN §2.7; API_CONTRACTS §1 "Time" and "Money")
-- ---------------------------------------------------------------------------
create function core.public_base_url()
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select 'https://plinth.in'
$$;
comment on function core.public_base_url() is 'The public site, for live_url, short_url and card_url.';

create function core.fmt_num(p_value numeric)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.trim_scale(p_value)::text
$$;
comment on function core.fmt_num(numeric) is 'A number without trailing zeros: 41.00 → 41; 2.80 → 2.8.';

create function core.fmt_count(p_value bigint)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.replace(ops.fmt_inr_exact(p_value), '₹', '')
$$;
comment on function core.fmt_count(bigint) is 'A count with Indian digit grouping: 1450 → 1,450; 250000 → 2,50,000.';

create function core.fmt_day_month(p_date date)
returns text
language sql
stable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.to_char(p_date, 'FMDD Mon')
$$;
comment on function core.fmt_day_month(date) is 'A day without its year: 2026-10-15 → 15 Oct.';

create function core.fmt_clock(p_at timestamptz)
returns text
language sql
stable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.to_char(p_at at time zone 'Asia/Kolkata', 'FMHH12:MI am')
$$;
comment on function core.fmt_clock(timestamptz) is 'The IST time of day: 2026-10-16 19:40 IST → 7:40 pm.';

create function core.fmt_timestamp(p_at timestamptz)
returns text
language sql
stable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.to_char(p_at at time zone 'Asia/Kolkata', 'YYYY-MM-DD"T"HH24:MI:SS') || '+05:30'
$$;
comment on function core.fmt_timestamp(timestamptz) is 'ISO 8601 in IST with its offset: 2026-10-18T12:00:00+05:30 (API_CONTRACTS §1).';

create function core.fmt_loose_date(p_value text)
returns text
language sql
stable
strict
parallel safe
set search_path = ''
as $$
  select case
    when p_value ~ '^\d{4}-\d{2}$' then ops.fmt_month((p_value || '-01')::date)
    when p_value ~ '^\d{4}-\d{2}-\d{2}$' then ops.fmt_date(p_value::date)
  end
$$;
comment on function core.fmt_loose_date(text) is 'A fact-value date that may be month-precise: 2023-03-12 → 12 Mar 2023; 2023-03 → Mar 2023.';

create function core.month_index(p_date date)
returns integer
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select (pg_catalog.date_part('year', p_date) * 12 + pg_catalog.date_part('month', p_date))::integer
$$;
comment on function core.month_index(date) is 'Months since year 0, for month-based arithmetic (time used counts months, BUILD_PLAN §7.1).';

create function core.lower_first(p_text text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.lower(pg_catalog.left(p_text, 1)) || pg_catalog.substr(p_text, 2)
$$;
comment on function core.lower_first(text) is 'Lower-cases the first letter only: "Filed on …" → "filed on …".';

create function core.possessive(p_name text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select case when p_name ~ 's$' then p_name || '''' else p_name || '''s' end
$$;
comment on function core.possessive(text) is 'English possessive: Vantage Buildcon → Vantage Buildcon''s; Halcyon Homes → Halcyon Homes''.';

-- ---------------------------------------------------------------------------
-- Labels: bands, factors, authorities, groups
-- ---------------------------------------------------------------------------
create function core.band_label(p_band text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.initcap(p_band)
$$;
comment on function core.band_label(text) is 'The band name shown everywhere: elevated → Elevated.';

create function core.band_step(p_band text)
returns integer
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select case p_band when 'low' then 1 when 'moderate' then 2 when 'elevated' then 3 when 'high' then 4 when 'severe' then 5 end
$$;
comment on function core.band_step(text) is 'Meter step of a band, 1 (low) to 5 (severe).';

create function core.factor_label(p_factor text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select case p_factor
    when 'finances' then 'Finances'
    when 'track_record' then 'Track record'
    when 'timeline' then 'Timeline'
    when 'legal' then 'Legal'
    when 'site' then 'Site'
    else pg_catalog.initcap(pg_catalog.replace(p_factor, '_', ' '))
  end
$$;
comment on function core.factor_label(text) is 'Factor label (contracts catalogues/reason_codes.json factors).';

-- R1 covers HARERA Gurugram only (BUILD_PLAN §2); a fact with no registration (a group's
-- track record) is read against it.
create function core.authority_short(p_code text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case coalesce(p_code, 'harera_ggm')
    when 'harera_ggm' then 'HARERA'
    else pg_catalog.upper(pg_catalog.replace(p_code, '_', ' '))
  end
$$;
comment on function core.authority_short(text) is 'The short authority name used in copy ("not on HARERA yet"). Null → harera_ggm (R1 coverage).';

create function core.authority_json(p_code text, p_url text)
returns jsonb
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case coalesce(p_code, 'harera_ggm')
    when 'harera_ggm' then pg_catalog.jsonb_build_object(
      'code', 'harera_ggm', 'name', 'HARERA Gurugram', 'url', coalesce(p_url, 'https://haryanarera.gov.in'))
    else pg_catalog.jsonb_build_object(
      'code', p_code, 'name', core.authority_short(p_code), 'url', coalesce(p_url, ''))
  end
$$;
comment on function core.authority_json(text, text) is 'RiskSummary.phase.authority {code, name, url}.';

create function core.group_short_name(p_name text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.regexp_replace(
    p_name,
    '\s+(Estates|Developers|Realty|Realtors|Buildcon|Builders|Homes|Projects|Infra|Infratech|Properties|Group)$',
    ''
  )
$$;
comment on function core.group_short_name(text) is 'The brand word of a group, used where §5b copy does ("Northfield has only 6 …"): Northfield Estates → Northfield.';

create function core.group_claim_json(p_group_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select case g.claim_state
    when 'claimed' then pg_catalog.jsonb_build_object(
      'state', 'claimed', 'line', 'claimed developer page, replies here', 'since', g.claimed_on)
    when 'invited' then pg_catalog.jsonb_build_object(
      'state', 'invited',
      'line', coalesce('invited ' || ops.fmt_date(g.invited_on) || ' · not yet claimed', 'invited · not yet claimed'),
      'since', g.invited_on)
    else pg_catalog.jsonb_build_object('state', 'unclaimed', 'line', 'not yet claimed', 'since', null)
  end
  from core.developer_groups g
  where g.id = p_group_id
$$;
comment on function core.group_claim_json(uuid) is 'DeveloperRef.claim: "claimed developer page, replies here" or "invited 24 Nov 2025 · not yet claimed" (DESIGN §5b).';

-- ---------------------------------------------------------------------------
-- Places
-- ---------------------------------------------------------------------------
create function core.locality_line(p_locality_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when l.kind = 'sector' and p.kind in ('corridor', 'zone') then l.name || ', ' || p.name
    else l.name
  end
  from core.localities l
  left join core.localities p on p.id = l.parent_id
  where l.id = p_locality_id
$$;
comment on function core.locality_line(uuid) is 'Sector and corridor: "Sector 37D, Dwarka Expressway".';

-- R1 covers Gurugram only: a project without a locality is read as Gurugram.
create function core.locality_city(p_locality_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with recursive up as (
    select l.id, l.parent_id, l.kind, l.slug, l.name, 0 as depth
    from core.localities l
    where l.id = p_locality_id
    union all
    select p.id, p.parent_id, p.kind, p.slug, p.name, up.depth + 1
    from core.localities p
    join up on p.id = up.parent_id
    where up.depth < 10
  )
  select coalesce(
    (select pg_catalog.jsonb_build_object('slug', up.slug, 'name', up.name) from up where up.kind = 'city' order by up.depth limit 1),
    pg_catalog.jsonb_build_object('slug', 'gurugram', 'name', 'Gurugram')
  )
$$;
comment on function core.locality_city(uuid) is 'The city of a locality, {slug, name}: the URL segment (/gurugram/…) and the reference class ("similar Gurugram projects").';

-- ---------------------------------------------------------------------------
-- Phases, groups, facts
-- ---------------------------------------------------------------------------
create function core.phase_group_id(p_phase_id uuid)
returns uuid
language sql
stable
set search_path = ''
as $$
  select coalesce(pr.group_id, d.group_id)
  from core.phases p
  join core.projects pr on pr.id = p.project_id
  left join core.developers d on d.id = p.promoter_id
  where p.id = p_phase_id
$$;
comment on function core.phase_group_id(uuid) is 'The developer group of a phase: its project''s group, else its promoter''s.';

create function core.phase_registration(p_phase_id uuid)
returns core.rera_registrations
language sql
stable
set search_path = ''
as $$
  select r.*
  from core.rera_registrations r
  where r.phase_id = p_phase_id
  order by (r.status = 'valid') desc, r.registered_on desc nulls last, r.created_at desc
  limit 1
$$;
comment on function core.phase_registration(uuid) is 'The RERA registration a phase is read against (the valid one first).';

create function core.current_fact(p_subject_type text, p_subject_id uuid, p_attribute text)
returns core.facts
language sql
stable
set search_path = ''
as $$
  select f.*
  from core.facts f
  where f.subject_type = p_subject_type
    and f.subject_id = p_subject_id
    and f.attribute = p_attribute
    and f.superseded_by is null
    and f.lane <> 'buyer_upload'
    and f.learned_at <= ops.now()
  order by f.valid_from desc nulls last, f.as_of desc nulls last, f.learned_at desc, f.id
  limit 1
$$;
comment on function core.current_fact(text, uuid, text) is 'The current public fact for a subject and attribute (not superseded, already learned by ops.now()). A null row when there is none.';

create function core.group_track_record(p_group_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select f.value from core.current_fact('group', p_group_id, 'track_record.late12') f where f.id is not null
$$;
comment on function core.group_track_record(uuid) is 'The group''s track_record.late12 fact value {finished, late, …}, or null when we have none.';

create function core.group_facts_only(p_group_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select case
    when g.facts_only_since is not null and g.facts_only_since <= ops.today()
      then pg_catalog.jsonb_build_object('scope', 'group', 'since', g.facts_only_since, 'line', g.facts_only_line)
    when ops.flag('facts_only_global')
      then pg_catalog.jsonb_build_object(
        'scope', 'global',
        'since', (select ops.ist_date(f.updated_at) from ops.feature_flags f where f.key = 'facts_only_global'),
        'line', null)
  end
  from (select 1) as one
  left join core.developer_groups g on g.id = p_group_id
$$;
comment on function core.group_facts_only(uuid) is 'Facts-only state of a group {scope, since, line}, or null. Data on the group (facts_only_since ≤ today) or the facts_only_global switch; never a band input.';

create function core.phase_shows_band(p_phase_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select ops.flag('bands_public')
    and core.group_facts_only(core.phase_group_id(p_phase_id)) is null
    and exists (
      select 1 from core.score_runs r
      where r.phase_id = p_phase_id and r.status = 'published' and r.state = 'scored'
    )
$$;
comment on function core.phase_shows_band(uuid) is 'True when buyers see this phase''s band, reasons and frequency: bands public, not facts-only, a published scored run (DATA_MODEL §12 inv. 8).';

create function core.band_since(p_phase_id uuid, p_band text, p_state text)
returns date
language sql
stable
set search_path = ''
as $$
  with h as (
    select h.from_date,
      (h.band is not distinct from p_band and h.state = p_state) as same,
      pg_catalog.row_number() over (order by h.from_date desc, h.created_at desc) as rn
    from core.band_history h
    left join core.score_runs r on r.id = h.run_id
    where h.phase_id = p_phase_id
      and h.from_date <= ops.today()
      and (h.run_id is null or r.status in ('published', 'superseded'))
  )
  select pg_catalog.min(h.from_date)
  from h
  where h.rn < coalesce((select pg_catalog.min(x.rn) from h x where not x.same), 2147483647)
$$;
comment on function core.band_since(uuid, text, text) is 'The first day of the current unbroken stretch of this band and state in the published band history (Aurelia: Elevated since 2 Oct 2026, across the v1.1 → v1.2 re-run).';

-- ---------------------------------------------------------------------------
-- Sources (SourceRef) for reasons and the evidence chip
-- ---------------------------------------------------------------------------
create function core.fact_source_label(p_attribute text, p_value jsonb)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_attribute in ('qpr.progress', 'qpr.tower_slabs')
      then 'HARERA QPR' || coalesce(' · ' || ops.fmt_quarter(p_value ->> 'quarter'), '')
    when p_attribute in ('qpr.filing_record', 'qpr.filing_status', 'qpr.missing')
      then 'HARERA QPR register'
    when p_attribute = 'orders.complaints_against_promoter_24m'
      then 'HARERA orders · 24 months'
    when p_attribute = 'track_record.late12'
      then 'HARERA · DTCP OC records'
    when p_attribute in ('progress.time_used_pct', 'registration.dates', 'registration.collection_account',
                         'registration.extensions', 'tower.floors_planned')
      then 'HARERA registration'
    when p_attribute = 'registration.extension'
      then 'HARERA order · Extension ' || coalesce(p_value ->> 'seq', '')
        || coalesce(' · ' || core.fmt_loose_date(p_value ->> 'granted'), '')
    when p_attribute = 'insolvency.admitted'
      then 'IBBI · ' || coalesce(p_value ->> 'forum', 'NCLT') || ' order'
        || coalesce(' ' || core.fmt_loose_date(p_value ->> 'order_on'), '')
    when p_attribute = 'insolvency.search'
      then 'IBBI · NCLT search'
    when p_attribute = 'completion.oc'
      then 'DTCP OC order' || coalesce(' · ' || core.fmt_loose_date(p_value ->> 'oc'), '')
    else p_attribute
  end
$$;
comment on function core.fact_source_label(text, jsonb) is 'The source chip of a fact ("HARERA QPR · Apr–Jun 2026"): SourceRef.label and Evidence.chip.';

create function core.source_refs(p_fact_ids uuid[], p_official_url text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with f as (
    select u.ord, fa.id, core.fact_source_label(fa.attribute, fa.value) as label,
      coalesce(fa.as_of, fa.valid_from, ops.ist_date(fa.learned_at)) as as_of
    from pg_catalog.unnest(p_fact_ids) with ordinality as u(id, ord)
    join core.facts fa on fa.id = u.id
    where fa.lane <> 'buyer_upload'
  ),
  g as (
    select f.label, pg_catalog.min(f.ord) as first_ord,
      pg_catalog.array_agg(f.id order by f.ord) as ids,
      pg_catalog.max(f.as_of) as as_of
    from f
    group by f.label
  )
  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'label', g.label,
        'fact_ids', pg_catalog.to_jsonb(g.ids),
        'evidence_url', '/evidence/' || g.ids[1],
        'official_url', p_official_url,
        'as_of', g.as_of
      )
      order by g.first_ord
    ),
    '[]'::jsonb
  )
  from g
$$;
comment on function core.source_refs(uuid[], text) is 'SourceRef[] for a reason: its facts grouped by source label in citation order; evidence_url opens the first fact''s drawer.';

-- ---------------------------------------------------------------------------
-- Developer says (DeveloperSays): a public claim, never a record
-- ---------------------------------------------------------------------------
create function core.claim_short(p_text text, p_said_on date)
returns text
language sql
stable
set search_path = ''
as $$
  select pg_catalog.regexp_replace(
    pg_catalog.regexp_replace(
      core.lower_first(pg_catalog.regexp_replace(pg_catalog.btrim(p_text), '\.+$', '')),
      '\mon (\d{1,2} [A-Z][a-z]{2})', '\1', 'g'
    ),
    '(\d{1,2} [A-Z][a-z]{2}) ' || coalesce(pg_catalog.to_char(p_said_on, 'YYYY'), '') || '\M', '\1', 'g'
  )
$$;
comment on function core.claim_short(text, date) is 'A claim in the short Developer says form: "Filed on 12 Oct 2026." said in 2026 → "filed 12 Oct".';

create function core.developer_says_for_fact(p_fact_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'text', c.text,
    'verified', c.verified_state = 'verified',
    'said_on', c.said_on,
    'check_by', c.check_by,
    'line', 'Developer says: ' || core.claim_short(c.text, c.said_on)
      || case c.verified_state
           when 'verified' then ', verified.'
           when 'contradicted' then ', not what the records show.'
           else ', not yet verified.'
         end
  )
  from ws.developer_claims c
  where c.linked_fact_id = p_fact_id
    and c.public
    and c.said_on <= ops.today()
  order by c.said_on desc, c.created_at desc
  limit 1
$$;
comment on function core.developer_says_for_fact(uuid) is 'The latest public developer claim about a fact, as DeveloperSays ("Developer says: filed 12 Oct, not yet verified."), or null.';

-- ---------------------------------------------------------------------------
-- RiskSummary parts
-- ---------------------------------------------------------------------------
create function core.risk_late12(p_registration_id uuid, p_blanket boolean)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'original_completion', pg_catalog.to_char(reg.orig, 'YYYY-MM'),
    'blanket_extension_months', coalesce(be.months, 0),
    'late_after', pg_catalog.to_char(reg.orig + pg_catalog.make_interval(months => coalesce(be.months, 0) + 12), 'YYYY-MM'),
    'line', 'Original completion ' || ops.fmt_month(reg.orig)
      || '. More than 12 months late here means an OC after '
      || ops.fmt_month((reg.orig + pg_catalog.make_interval(months => coalesce(be.months, 0) + 12))::date)
      || coalesce(', with the ' || be.months || '-month blanket extension of ' || ops.fmt_month(be.advisory_on), '')
      || '.',
    'oc_not_keys_line', 'The OC is not the keys. Possession comes after it: the developer offers it, you pay the last 5% and register the sale deed.'
  )
  from (
    select r.original_completion as orig
    from core.rera_registrations r
    where r.id = p_registration_id and r.original_completion is not null
  ) as reg
  left join lateral (
    select b.months, b.advisory_on
    from core.blanket_extensions b
    where p_blanket
      and reg.orig >= b.applies_from_completion
      and (b.applies_to_completion is null or reg.orig <= b.applies_to_completion)
      and b.advisory_on <= ops.today()
    order by b.advisory_on desc
    limit 1
  ) as be on true
$$;
comment on function core.risk_late12(uuid, boolean) is 'RiskSummary.late12: original RERA completion + blanket extension (when the model applies them) + 12 months (DESIGN §5b: Aurelia → Apr 2029).';

create function core.risk_progress(p_phase_id uuid, p_registration_id uuid, p_stale boolean)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with lf as (
    select q.quarter, q.filed_on, pg_catalog.trim_scale(q.built_pct) as built, pg_catalog.trim_scale(q.sold_pct) as sold
    from core.qpr_filings q
    where q.registration_id = p_registration_id and q.built_pct is not null
    order by q.quarter desc
    limit 1
  ),
  reg as (
    select r.registered_on, r.original_completion
    from core.rera_registrations r
    where r.id = p_registration_id
  ),
  tu as (
    select coalesce(
      (select pg_catalog.trim_scale((f.value #>> '{}')::numeric)
         from core.current_fact('phase', p_phase_id, 'progress.time_used_pct') f
        where f.id is not null),
      -- Rule fallback (month-based, as the pipeline computes it): months since
      -- registration over the months promised.
      (select pg_catalog.round(100.0 * (core.month_index(ops.today()) - core.month_index(reg.registered_on))
                / nullif(core.month_index(reg.original_completion) - core.month_index(reg.registered_on), 0))
         from reg)
    ) as pct
  )
  select pg_catalog.jsonb_build_object(
    'built_pct', lf.built,
    'sold_pct', lf.sold,
    'time_used_pct', tu.pct,
    'latest_qpr', case when lf.quarter is not null then pg_catalog.jsonb_build_object(
      'quarter', lf.quarter,
      'label', ops.fmt_quarter(lf.quarter),
      'filed_on', lf.filed_on,
      'age_days', ops.today() - lf.filed_on
    ) end,
    'line', case
      when lf.built is null and tu.pct is not null
        then coalesce('Registered ' || ops.fmt_month(reg.registered_on) || ' · ', '')
          || core.fmt_num(tu.pct) || '% of the promised time used'
      when lf.built is not null and tu.pct is not null
        then core.fmt_num(lf.built) || '% built · ' || core.fmt_num(tu.pct) || '% of the promised time used'
          || coalesce(' · ' || core.fmt_num(lf.sold) || '% sold', '')
          || case when p_stale and lf.filed_on is not null
               then ' · progress ' || (ops.today() - lf.filed_on) || ' days old' else '' end
      when lf.built is not null
        then core.fmt_num(lf.built) || '% built'
      else 'No progress report with us yet'
    end
  )
  from tu
  left join lf on true
  left join reg on true
$$;
comment on function core.risk_progress(uuid, uuid, boolean) is 'RiskSummary.progress from the latest QPR with figures and the time-used fact. A stale run adds "progress N days old"; a re-scoring filing adds no figures until its run is published.';

create function core.risk_price(p_phase_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_quoted jsonb;
  v_all_in jsonb;
  v_unit text;
  v_carpet numeric;
  v_option text;
  v_quoted_label text;
  v_all_in_label text;
  v_dated date;
begin
  select f.value into v_quoted from core.current_fact('phase', p_phase_id, 'price.quoted') f where f.id is not null;
  select f.value into v_all_in from core.current_fact('phase', p_phase_id, 'price.all_in') f where f.id is not null;

  if v_quoted is null and v_all_in is null then
    return pg_catalog.jsonb_build_object(
      'all_in_inr', null, 'all_in_label', null, 'quoted_label', null,
      'per_sqft_carpet_label', null, 'basis_line', null,
      'display_line', 'No price list with us');
  end if;

  v_unit := coalesce(v_all_in ->> 'unit', v_quoted ->> 'unit', 'Home');
  v_quoted_label := ops.fmt_inr_short((v_quoted ->> 'base_price_inr')::bigint);

  if v_all_in is null then
    return pg_catalog.jsonb_build_object(
      'all_in_inr', null, 'all_in_label', null, 'quoted_label', v_quoted_label,
      'per_sqft_carpet_label', null,
      'basis_line', v_unit || ' quoted price · no cost sheet with us',
      'display_line', 'Quoted ' || coalesce(v_quoted_label, '') || ' · all-in not known yet');
  end if;

  v_dated := (v_all_in ->> 'cost_sheet_dated')::date;
  select u.carpet_sqft into v_carpet from core.unit_types u where u.phase_id = p_phase_id and u.label = v_unit;

  -- The cost sheet's option (e.g. "park-facing") lives in ws.cost_sheets, which T13 creates.
  -- T13 replaces this function to read it (ws.cost_sheets.unit_label for this phase, unit and
  -- date) into v_option. Until then the basis line names the unit, its carpet area and the
  -- sheet's date. No dynamic SQL here: plpgsql_check (`supabase db lint`) checks every query.
  v_option := null;

  v_all_in_label := ops.fmt_inr_short((v_all_in ->> 'all_in_inr')::bigint);
  return pg_catalog.jsonb_build_object(
    'all_in_inr', v_all_in -> 'all_in_inr',
    'all_in_label', v_all_in_label,
    'quoted_label', v_quoted_label,
    'per_sqft_carpet_label', ops.fmt_inr_exact((v_all_in ->> 'per_sqft_carpet_inr')::bigint) || ' per sq ft carpet',
    'basis_line', v_unit
      || coalesce(', ' || core.fmt_count(pg_catalog.round(v_carpet)::bigint) || ' sq ft carpet', '')
      || coalesce(', ' || v_option, '')
      || case when v_dated is not null then ' · cost sheet of ' || ops.fmt_date(v_dated) else ' · developer cost sheet' end,
    'display_line', v_all_in_label || ' all-in' || coalesce(' · quoted ' || v_quoted_label, ''));
end
$$;
comment on function core.risk_price(uuid) is 'RiskSummary.price from the seeded price facts (all-in first, quoted second). M3 swaps in core.all_in(); without a cost sheet: "Quoted ₹2.25 Cr · all-in not known yet".';

create function core.risk_complaints(p_subject_type text, p_subject_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
    'count_24m', f.value -> 'count',
    'per_100_units', f.value -> 'per_100_units',
    'units_base', f.value -> 'units_base',
    'median_count_similar', f.value -> 'median_count_similar',
    'line', (f.value ->> 'count')
      || case when (f.value ->> 'count') = '1' then ' complaint' else ' complaints' end
      || ' · ' || (f.value ->> 'per_100_units') || ' per 100 units'
  )
  from core.current_fact(p_subject_type, p_subject_id, 'orders.complaints_against_promoter_24m') f
  where f.id is not null
$$;
comment on function core.risk_complaints(text, uuid) is 'Complaints decided against the promoter in 24 months: always count and rate together ("14 complaints · 2.8 per 100 units").';

create function core.risk_pending(
  p_phase_id uuid,
  p_registration_id uuid,
  p_run_computed_at timestamptz,
  p_state text,
  p_band_visible boolean,
  p_rescore_hours integer,
  p_min_months integer
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with reg as (
    select r.authority, r.registered_on, r.registered_on_precision
    from core.rera_registrations r
    where r.id = p_registration_id
  ),
  missing as (
    select q.quarter, q.due_on,
      (select f.id from core.facts f
        where f.subject_type = 'registration' and f.subject_id = p_registration_id
          and f.attribute = 'qpr.missing' and f.value ->> 'quarter' = q.quarter
          and f.superseded_by is null and f.learned_at <= ops.now()
        order by f.learned_at desc limit 1) as fact_id
    from core.qpr_filings q
    where q.registration_id = p_registration_id
      and q.status = 'missing'
      and q.due_on <= ops.today()
  ),
  items as (
    -- 1. A QPR that was due is not on the authority's portal (with the developer's claim, if any).
    select 1 as grp, m.quarter as sort_key, pg_catalog.jsonb_build_object(
      'code', 'qpr_missing',
      'line', 'The ' || ops.fmt_quarter(m.quarter) || ' QPR is not on '
        || core.authority_short((select reg.authority from reg)) || ' yet. It was due ' || ops.fmt_date(m.due_on) || '.',
      'since', m.due_on,
      'developer_says', core.developer_says_for_fact(m.fact_id),
      'marker_line', case when p_band_visible then (
        select n.public_marker_text from core.band_notices n
        where n.phase_id = p_phase_id and n.status = 'pending'
          and n.public_marker_text is not null and m.fact_id = any (n.trigger_fact_ids)
        order by n.sent_at desc nulls last
        limit 1) end
    ) as item
    from missing m

    union all
    -- 2. A new filing is in: the re-score is due within the model's window. No figures yet.
    select 2, pg_catalog.to_char(q.fetched_at, 'YYYYMMDDHH24MISS'), pg_catalog.jsonb_build_object(
      'code', 'rescore_due',
      'line', 'The ' || ops.fmt_quarter(q.quarter) || ' QPR was '
        || coalesce('filed ' || core.fmt_day_month(q.filed_on) || ' and ', '')
        || 'fetched ' || core.fmt_day_month(ops.ist_date(q.fetched_at)) || ', ' || core.fmt_clock(q.fetched_at)
        || '. We update this by '
        || ops.fmt_date(ops.ist_date(q.fetched_at + pg_catalog.make_interval(hours => p_rescore_hours)))
        || ', ' || core.fmt_clock(q.fetched_at + pg_catalog.make_interval(hours => p_rescore_hours)) || '.',
      'since', ops.ist_date(q.fetched_at),
      'developer_says', null,
      'marker_line', case when p_band_visible
        then 'If the new figures move the band, followers hear first, with what changed and why.' end
    )
    from core.qpr_filings q
    where q.registration_id = p_registration_id
      and q.fetched_at > p_run_computed_at
      and q.fetched_at <= ops.now()

    union all
    -- 3. Not scored yet: what we are waiting for.
    select 3, '', pg_catalog.jsonb_build_object(
      'code', 'not_enough_reports',
      'line', 'Registered ' || ops.fmt_date_precision(reg.registered_on, reg.registered_on_precision)
        || case when reg.registered_on > (ops.today() - pg_catalog.make_interval(months => p_min_months))::date
             then ', less than ' || p_min_months || ' months ago' else '' end
        || '. We score once there are enough quarterly reports to compare building with time.',
      'since', reg.registered_on,
      'developer_says', null,
      'marker_line', null
    )
    from reg
    where p_state = 'not_scored' and reg.registered_on is not null

    union all
    -- 4. A pending band notice whose trigger is not one of the facts above: buyers see
    --    its public marker only. Never the proposed band.
    select 4, pg_catalog.to_char(n.sent_at, 'YYYYMMDDHH24MISS'), pg_catalog.jsonb_build_object(
      'code', 'band_review',
      'line', n.public_marker_text,
      'since', ops.ist_date(n.sent_at),
      'developer_says', null,
      'marker_line', null
    )
    from core.band_notices n
    where p_band_visible
      and n.phase_id = p_phase_id
      and n.status = 'pending'
      and n.public_marker_text is not null
      and n.sent_at <= ops.now()
      and not exists (select 1 from missing m where m.fact_id = any (n.trigger_fact_ids))
  )
  select coalesce(pg_catalog.jsonb_agg(items.item order by items.grp, items.sort_key), '[]'::jsonb)
  from items
$$;
comment on function core.risk_pending(uuid, uuid, timestamptz, text, boolean, integer, integer) is 'RiskSummary.pending: public facts that may move the band (missing QPRs with the developer''s claim, a re-score due, what a not-scored phase waits for). Markers only while the band is visible; never the proposed band.';

create function core.risk_red_flag(p_phase_id uuid, p_rule_code text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with ctx as (
    select p.promoter_id, core.phase_group_id(p.id) as group_id
    from core.phases p
    where p.id = p_phase_id
  ),
  flag as (
    select rf.fact_ids, rf.triggered_on
    from core.red_flags rf, ctx
    where rf.rule_code = p_rule_code
      and rf.cleared_on is null
      and rf.triggered_on <= ops.today()
      and (
        (rf.subject_type = 'phase' and rf.subject_id = p_phase_id)
        or (rf.subject_type = 'group' and rf.subject_id = ctx.group_id)
        or (rf.subject_type = 'developer'
            and rf.subject_id in (select d.id from core.developers d where d.group_id = ctx.group_id))
      )
    order by rf.triggered_on desc
    limit 1
  ),
  ev as (
    select f.value, f.subject_type, f.subject_id
    from flag, core.facts f
    where f.id = flag.fact_ids[1]
  ),
  parts as (
    select
      pg_catalog.substring(p_rule_code, '^RF(\d+)')::integer as num,
      g.name as group_name,
      coalesce((select ev.value ->> 'forum' from ev), 'NCLT') as forum,
      coalesce(core.fmt_loose_date((select ev.value ->> 'order_on' from ev)),
               (select ops.fmt_date(flag.triggered_on) from flag)) as on_date,
      coalesce((select ev.subject_type = 'developer' and ev.subject_id = ctx.promoter_id from ev), false) as is_promoter
    from ctx
    left join core.developer_groups g on g.id = ctx.group_id
  )
  select pg_catalog.jsonb_build_object(
    'number', parts.num,
    'rule_line', 'Set by red-flag rule ' || parts.num || ', not our model'
      || case when p_rule_code = 'RF1_GROUP_CIRP'
           then ': ' || case when parts.is_promoter then 'the promoter was' else 'a group company was' end
             || ' admitted to insolvency (' || parts.forum || ' order, ' || coalesce(parts.on_date, '') || ')'
           else '' end
      || '.',
    'share_line', case when p_rule_code = 'RF1_GROUP_CIRP'
      then case when parts.is_promoter then 'The promoter' else 'A group company of ' || coalesce(parts.group_name, 'the group') end
        || ' was admitted to insolvency (' || parts.forum || ' order, ' || coalesce(parts.on_date, '') || ').'
      end
  )
  from parts
$$;
comment on function core.risk_red_flag(uuid, text) is 'Copy for a band set by a red-flag rule: Band.rule.line ("Set by red-flag rule 1, not our model: a group company was admitted to insolvency (NCLT order, 12 Mar 2023).") and the share card line.';

create function core.risk_confidence_line(
  p_level text,
  p_group_name text,
  p_track_record jsonb,
  p_min_finished integer,
  p_stale boolean
)
returns text
language sql
immutable
set search_path = ''
as $$
  with t as (select (p_track_record ->> 'finished')::integer as finished)
  select case
    when p_level = 'high' then
      'We''re more certain about this one.'
        || coalesce(' ' || p_group_name || ' has ' || t.finished || ' finished RERA projects to learn from.', '')
    when t.finished > 0 and t.finished < p_min_finished then
      'We''re less certain about this one. ' || core.group_short_name(p_group_name) || ' has only ' || t.finished
        || ' finished RERA ' || case when t.finished = 1 then 'project' else 'projects' end
        || ' to learn from, so we show a range, not one number.'
    when coalesce(t.finished, 0) = 0 then
      'We''re less certain about this one. ' || core.possessive(coalesce(p_group_name, 'This developer')) || ' record is short'
        || case when p_stale then ', and the old building figures widen the range.'
             else ', so we show a range, not one number.' end
    else
      'We''re less certain about this one'
        || case when p_stale then '. The old building figures widen the range.'
             else ', so we show a range, not one number.' end
  end
  from t
$$;
comment on function core.risk_confidence_line(text, text, jsonb, integer, boolean) is 'The separate "less/more certain" line (DESIGN §5b confidence copy); never part of the band name. High needs ≥ min_finished finished projects (score_models.config).';

-- ---------------------------------------------------------------------------
-- The RiskSummary (API_CONTRACTS §2): one object for web, app, WhatsApp and the card.
-- ---------------------------------------------------------------------------
create function core.risk_summary_json(p_phase_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_phase core.phases%rowtype;
  v_project core.projects%rowtype;
  v_group core.developer_groups%rowtype;
  v_reg core.rera_registrations%rowtype;
  v_run core.score_runs%rowtype;
  v_config jsonb;
  v_city jsonb;
  v_auth jsonb;
  v_auth_short text;
  v_base text := core.public_base_url();
  v_bands_public boolean := ops.flag('bands_public');
  v_facts_only jsonb;
  v_band_visible boolean;
  v_show_band boolean;
  v_label text;
  v_step integer;
  v_track_record jsonb;
  v_red_flag jsonb;
  v_rule_number integer;
  v_freq_short text;
  v_illustrative boolean;
  v_progress jsonb;
  v_progress_line text;
  v_overlays jsonb := '[]'::jsonb;
  v_band jsonb;
  v_chip jsonb;
  v_confidence jsonb;
  v_frequency jsonb;
  v_reasons jsonb := '[]'::jsonb;
  v_reply jsonb;
  v_withheld jsonb;
  v_lines text[];
  v_alt text;
  v_group_line text;
begin
  select * into v_phase from core.phases p where p.id = p_phase_id;
  if not found then
    return null;
  end if;

  -- The firewall: the one published run, never a draft or a pending_notice run.
  select * into v_run from core.score_runs r
  where r.phase_id = p_phase_id and r.status = 'published'
  order by r.published_at desc
  limit 1;
  if not found then
    return null;
  end if;

  select * into v_project from core.projects pr where pr.id = v_phase.project_id;
  select * into v_group from core.developer_groups g where g.id = core.phase_group_id(p_phase_id);
  select * into v_reg from core.phase_registration(p_phase_id);
  select m.config into v_config from core.score_models m where m.version = v_run.model_version;
  v_config := coalesce(v_config, '{}'::jsonb);

  v_city := core.locality_city(v_project.locality_id);
  v_auth := core.authority_json(v_reg.authority, v_reg.official_url);
  v_auth_short := core.authority_short(v_reg.authority);

  -- What buyers may see (DATA_MODEL §12 inv. 8): bands public, not facts-only, scored.
  v_facts_only := core.group_facts_only(v_group.id);
  v_band_visible := v_bands_public and v_facts_only is null;
  v_show_band := v_band_visible and v_run.state = 'scored';
  v_track_record := core.group_track_record(v_group.id);

  v_progress := core.risk_progress(p_phase_id, v_reg.id, v_run.stale);
  if v_progress ->> 'built_pct' is not null and v_progress ->> 'time_used_pct' is not null then
    v_progress_line := (v_progress ->> 'built_pct') || '% built with '
      || (v_progress ->> 'time_used_pct') || '% of the promised time used.';
  end if;

  -- Overlays (none in the facts-only state; nothing band-related while bands are hidden).
  if v_facts_only is null then
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

  -- Band, confidence, frequency and reasons: only when the band is shown.
  if v_show_band then
    v_label := core.band_label(v_run.band);
    v_step := core.band_step(v_run.band);
    if v_run.set_by = 'red_flag_rule' then
      v_red_flag := core.risk_red_flag(p_phase_id, v_run.rule_code);
      v_rule_number := (v_red_flag ->> 'number')::integer;
    end if;
    v_band := pg_catalog.jsonb_build_object(
      'code', v_run.band,
      'label', v_label,
      'step', v_step,
      'since', coalesce(core.band_since(p_phase_id, v_run.band, v_run.state), ops.ist_date(v_run.published_at)),
      'set_by', coalesce(v_run.set_by, 'model'),
      'rule', case when v_run.set_by = 'red_flag_rule'
        then pg_catalog.jsonb_build_object('code', v_run.rule_code, 'line', v_red_flag ->> 'rule_line') end
    );

    if v_run.confidence is not null then
      v_confidence := pg_catalog.jsonb_build_object(
        'level', v_run.confidence,
        'dots', case when v_run.confidence = 'high' then 2 else 1 end,
        'line', core.risk_confidence_line(
          v_run.confidence, v_group.name, v_track_record,
          coalesce((v_config -> 'confidence' ->> 'min_finished')::integer, 8),
          v_run.stale)
      );
    end if;

    if v_run.set_by is distinct from 'red_flag_rule'
      and (v_run.freq_point is not null or (v_run.freq_low is not null and v_run.freq_high is not null)) then
      v_illustrative := exists (
        select 1 from core.calibration c where c.model_version = v_run.model_version and c.illustrative
      );
      if v_run.freq_point is not null then
        v_freq_short := 'About ' || v_run.freq_point || ' of 100';
        v_frequency := pg_catalog.jsonb_build_object(
          'kind', 'point', 'low', v_run.freq_point, 'high', v_run.freq_point,
          'icon_array', pg_catalog.jsonb_build_object('filled', v_run.freq_point, 'hatched', 0, 'empty', 100 - v_run.freq_point),
          'hatch_legend', null);
      else
        v_freq_short := 'Between ' || v_run.freq_low || ' and ' || v_run.freq_high || ' of 100';
        v_frequency := pg_catalog.jsonb_build_object(
          'kind', 'range', 'low', v_run.freq_low, 'high', v_run.freq_high,
          'icon_array', pg_catalog.jsonb_build_object(
            'filled', v_run.freq_low, 'hatched', v_run.freq_high - v_run.freq_low, 'empty', 100 - v_run.freq_high),
          'hatch_legend', 'Hatched: the ' || (v_run.freq_high - v_run.freq_low) || ' of 100 we''re less certain about');
      end if;
      v_frequency := v_frequency || pg_catalog.jsonb_build_object(
        'sentence', v_freq_short || ' similar ' || (v_city ->> 'name')
          || ' projects got their OC more than 12 months after the original RERA date.',
        'reference_class_line', (v_city ->> 'name') || ' RERA phases registered 2017–2021'
          || case when v_illustrative then ' (illustrative backtest)' else '' end || '.');
    end if;

    select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
             'rank', sr.rank,
             'factor', sr.factor,
             'factor_label', core.factor_label(sr.factor),
             'text', sr.text,
             'sources', core.source_refs(sr.fact_ids, v_auth ->> 'url')
           ) order by sr.rank), '[]'::jsonb)
      into v_reasons
      from core.score_reasons sr
     where sr.run_id = v_run.id;
  end if;

  -- The chip: identical on every surface.
  v_chip := case
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

  -- The developer's project reply (a group reply belongs to the developer page).
  select pg_catalog.jsonb_build_object(
           'text', d.text,
           'signatory_title', d.signatory_title,
           'published_on', ops.ist_date(d.published_at),
           'check_by', d.check_by,
           'line', 'Developer says · not yet verified · ' || ops.fmt_date(ops.ist_date(d.published_at))
             || coalesce(' · we check it by ' || ops.fmt_date(d.check_by), ''))
    into v_reply
    from ws.developer_replies d
   where d.phase_id = p_phase_id
     and d.scope = 'project'
     and d.status = 'published'
     and d.published_at <= ops.now()
   order by d.published_at desc
   limit 1;

  if v_facts_only is not null then
    v_withheld := pg_catalog.jsonb_build_object(
      'since', v_facts_only -> 'since',
      'line', 'Band withheld pending review, from ' || ops.fmt_date((v_facts_only ->> 'since')::date),
      'explainer_line', coalesce(v_facts_only ->> 'line',
        'We''re not showing a band for this project while we review it. The sourced facts stay.'),
      'explainer_url', case when v_facts_only ->> 'scope' = 'group'
        then '/' || (v_city ->> 'slug') || '/developers/' || v_group.slug || '#facts-only'
        else '/methodology' end);
  end if;

  -- The share card (F-05): at most 3 short lines; a band always with its natural frequency.
  if v_facts_only is not null then
    v_lines := array[
      'Delivery risk: band withheld · facts only',
      'Band withheld pending review, from ' || ops.fmt_date((v_facts_only ->> 'since')::date) || '.',
      v_progress_line];
    v_alt := v_phase.name || ': delivery risk band withheld pending review. Facts only.';
  elsif v_run.state = 'limited_history' then
    v_group_line := case
      when coalesce((v_track_record ->> 'finished')::integer, 0) = 0
        then v_group.name || ' has no finished RERA project yet.'
      else v_group.name || ' has ' || (v_track_record ->> 'finished') || ' finished RERA '
        || case when (v_track_record ->> 'finished') = '1' then 'project' else 'projects' end || ' so far.'
    end;
    v_lines := array['Delivery risk: not enough history to score · no penalty', v_group_line, v_progress_line];
    v_alt := v_phase.name || ': not enough history to score, no penalty.';
  elsif v_run.state = 'not_scored' then
    v_group_line := case
      when coalesce((v_track_record ->> 'finished')::integer, 0) > 0
        then 'Part of the ' || v_group.name || ' group: ' || (v_track_record ->> 'late') || ' of its '
          || (v_track_record ->> 'finished') || ' finished RERA projects got OC more than 12 months late.'
      when v_track_record is not null
        then v_group.name || ' has no finished RERA project yet.'
    end;
    v_lines := array[
      'Delivery risk: not scored yet' || coalesce(', registered ' || ops.fmt_month(v_reg.registered_on), ''),
      v_group_line,
      'Original completion ' || ops.fmt_month(v_reg.original_completion) || '.'];
    v_alt := v_phase.name || ': not scored yet' || coalesce(', registered ' || ops.fmt_month(v_reg.registered_on), '') || '.';
  elsif not v_bands_public then
    v_lines := array['Delivery risk: facts only for now', v_progress_line];
    v_alt := v_phase.name || ': facts only for now.';
  elsif v_run.set_by = 'red_flag_rule' then
    v_lines := array[
      'Delivery risk: ' || v_label || ', set by red-flag rule ' || v_rule_number,
      v_red_flag ->> 'share_line',
      case
        when v_reg.original_completion is not null
          and (v_reg.original_completion + pg_catalog.make_interval(months => 1))::date <= ops.today()
          and v_progress ->> 'built_pct' is not null
          then (v_progress ->> 'built_pct') || '% built. The original date, '
            || ops.fmt_month(v_reg.original_completion) || ', has passed.'
        else v_progress_line
      end];
    v_alt := v_phase.name || ': Delivery risk ' || v_label || ', set by red-flag rule ' || v_rule_number || ', not our model.';
  else
    v_lines := array[
      'Delivery risk: ' || v_label,
      v_freq_short || ' similar ' || (v_city ->> 'name') || ' projects got their OC more than 12 months late.',
      v_progress_line];
    v_alt := v_phase.name || ': Delivery risk ' || v_label
      || coalesce('. ' || v_freq_short || ' similar projects were more than 12 months late', '') || '.';
  end if;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.risk_summary/1',
    'phase', pg_catalog.jsonb_build_object(
      'slug', v_phase.slug,
      'name', v_phase.name,
      'short_code', v_phase.short_code,
      'rera_number', v_reg.rera_number,
      'authority', v_auth,
      'locality_line', coalesce(core.locality_line(v_project.locality_id), v_city ->> 'name'),
      'units', v_phase.units_total,
      'developer', pg_catalog.jsonb_build_object(
        'slug', v_group.slug,
        'name', v_group.name,
        'claim', core.group_claim_json(v_group.id))),
    'display', pg_catalog.jsonb_build_object(
      'state', case when v_facts_only is not null then 'facts_only' else v_run.state::text end,
      'overlays', v_overlays,
      'bands_public', v_bands_public),
    'band', v_band,
    'chip', v_chip,
    'confidence', v_confidence,
    'frequency', v_frequency,
    'late12', core.risk_late12(v_reg.id, coalesce((v_config ->> 'blanket_extensions')::boolean, true)),
    'reasons', v_reasons,
    'what_would_change', case when v_band_visible then v_run.what_would_change end,
    'pending', core.risk_pending(
      p_phase_id, v_reg.id, v_run.computed_at, v_run.state, v_band_visible,
      coalesce((v_config ->> 'rescore_hours')::integer, 72),
      coalesce((v_config -> 'not_scored' ->> 'min_months_registered')::integer, 6)),
    'developer_response', v_reply,
    'progress', v_progress,
    'price', core.risk_price(p_phase_id),
    'complaints', core.risk_complaints('phase', p_phase_id),
    'withheld', v_withheld,
    'meta', pg_catalog.jsonb_build_object(
      'data_as_of', v_run.data_cutoff,
      'model_version', v_run.model_version,
      'score_run_id', v_run.id,
      'generated_at', core.fmt_timestamp(ops.now()),
      'methodology_url', '/methodology',
      'disclaimer_line', 'Our opinion, based on public records. Not a credit rating. Not issued by any RERA.',
      'promise_line', 'No developer pays us. Ever.',
      'live_url', v_base || '/' || (v_city ->> 'slug') || '/projects/' || v_phase.slug,
      'short_url', case when v_phase.short_code is not null then v_base || '/r/' || v_phase.short_code end),
    'share', pg_catalog.jsonb_build_object(
      'card_url', v_base || '/cards/risk/' || v_phase.slug || '.png?run=' || v_run.id,
      'card_alt', v_alt,
      'lines', pg_catalog.to_jsonb(pg_catalog.array_remove(v_lines, null)),
      'source_line', v_auth_short || ' records · data as of ' || ops.fmt_date(v_run.data_cutoff) || ' · ' || v_run.model_version,
      'caption', 'Plinth · No developer pays us. Ever.')
  );
end
$$;
comment on function core.risk_summary_json(uuid) is 'plinth.risk_summary/1 for a phase, from its published run only, or null when it has none. api.risk_summary wraps it; T13 embeds it in project_page.';

-- ---------------------------------------------------------------------------
-- The evidence drawer (API_CONTRACTS §4.6, F-06)
-- ---------------------------------------------------------------------------
create function core.evidence_json(p_fact_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_fact core.facts%rowtype;
  v_snap core.snapshots%rowtype;
  v_source core.sources%rowtype;
  v_reg core.rera_registrations%rowtype;
  v_phase_id uuid;
  v_phase_name text;
  v_group_id uuid;
  v_group_name text;
  v_auth_short text;
  v_quarter text;
  v_filed_on date;
  v_fetched date;
  v_data_as_of date;
  v_chip text;
  v_document text;
  v_dates text;
  v_run_id uuid;
  v_used_in jsonb;
  v_section text;
  v_corrections text;
  v_official_url text;
begin
  -- Buyer uploads are private, and a fact is not shown before it was learned.
  select * into v_fact from core.facts f
  where f.id = p_fact_id and f.lane <> 'buyer_upload' and f.learned_at <= ops.now();
  if not found then
    return null;
  end if;

  if v_fact.snapshot_id is not null then
    select * into v_snap from core.snapshots s where s.id = v_fact.snapshot_id;
    select * into v_source from core.sources so where so.id = v_snap.source_id;
  end if;

  -- The phase and group the fact is about.
  if v_fact.subject_type = 'phase' then
    v_phase_id := v_fact.subject_id;
  elsif v_fact.subject_type = 'registration' then
    select r.phase_id into v_phase_id from core.rera_registrations r where r.id = v_fact.subject_id;
  elsif v_fact.subject_type = 'tower' then
    select t.phase_id into v_phase_id from core.towers t where t.id = v_fact.subject_id;
  end if;
  if v_fact.subject_type = 'registration' then
    select * into v_reg from core.rera_registrations r where r.id = v_fact.subject_id;
  elsif v_phase_id is not null then
    select * into v_reg from core.phase_registration(v_phase_id);
  end if;
  if v_fact.subject_type = 'group' then
    v_group_id := v_fact.subject_id;
  elsif v_fact.subject_type = 'developer' then
    select d.group_id into v_group_id from core.developers d where d.id = v_fact.subject_id;
  elsif v_phase_id is not null then
    v_group_id := core.phase_group_id(v_phase_id);
  end if;
  select p.name into v_phase_name from core.phases p where p.id = v_phase_id;
  select g.name into v_group_name from core.developer_groups g where g.id = v_group_id;

  v_auth_short := core.authority_short(v_reg.authority);
  v_quarter := v_fact.value ->> 'quarter';
  v_fetched := ops.ist_date(coalesce(v_snap.fetched_at, v_fact.learned_at));
  select pg_catalog.max(r.data_cutoff) into v_data_as_of
    from core.score_runs r
   where r.status = 'published' and (v_phase_id is null or r.phase_id = v_phase_id);
  if v_quarter is not null and v_reg.id is not null then
    select q.filed_on into v_filed_on from core.qpr_filings q where q.registration_id = v_reg.id and q.quarter = v_quarter;
  end if;

  v_chip := core.fact_source_label(v_fact.attribute, v_fact.value);

  v_document := case
    when v_fact.attribute in ('qpr.progress', 'qpr.tower_slabs') then
      v_auth_short || ' · Quarterly Progress Report' || coalesce(' · ' || ops.fmt_quarter(v_quarter), '')
        || coalesce(' · ' || v_phase_name, '')
    when v_fact.attribute = 'qpr.filing_record' then
      v_auth_short || ' · QPR filing register for this project · every quarter since registration'
        || coalesce(' (' || ops.fmt_month(v_reg.registered_on) || ')', '')
    when v_fact.attribute in ('qpr.filing_status', 'qpr.missing') then
      v_auth_short || ' · QPR filing register for this project' || coalesce(' · ' || ops.fmt_quarter(v_quarter), '')
    when v_fact.attribute = 'orders.complaints_against_promoter_24m' then
      v_auth_short || ' · complaint orders for '
        || case when v_fact.subject_type = 'group' then 'the group''s RERA numbers' else 'this RERA number' end
        || coalesce(' · ' || ops.fmt_month((v_fact.as_of - pg_catalog.make_interval(months => 24))::date)
             || ' to ' || ops.fmt_month(v_fact.as_of), '')
    when v_fact.attribute = 'track_record.late12' then
      v_auth_short || ' project pages and DTCP occupation certificates · '
        || coalesce((v_fact.value ->> 'finished') || ' ', '') || coalesce(v_group_name || ' group ', '') || 'projects'
    else
      coalesce(v_source.name, v_chip) || coalesce(' · ' || coalesce(v_phase_name, v_group_name), '')
  end;

  v_dates := case
    when v_fact.attribute = 'qpr.progress' then
      coalesce('Filed ' || ops.fmt_date(v_filed_on) || ' · we fetched it ', 'We fetched it ') || ops.fmt_date(v_fetched)
        || coalesce(' · last checked live ' || ops.fmt_date(v_data_as_of), '')
    when v_fact.attribute in ('qpr.filing_record', 'qpr.filing_status', 'qpr.missing') then
      'Register checked live ' || ops.fmt_date(v_fetched)
    when v_fact.attribute = 'orders.complaints_against_promoter_24m' then
      'Orders search run ' || ops.fmt_date(v_fetched)
        || coalesce(' · latest order ' || core.fmt_loose_date(v_fact.value ->> 'latest_order_on'), '')
    else
      'Checked ' || ops.fmt_date(v_fetched)
  end;

  -- Where the fact is used. A phase fact names its own phase's reasons; a group fact
  -- (no page context in the contract) names the most severe phase that cites it. Reasons
  -- are named only where buyers see them (bands public, not facts-only).
  select r.id into v_run_id
    from core.score_runs r
    join core.phases p on p.id = r.phase_id
   where r.status = 'published'
     and (v_phase_id is null or r.phase_id = v_phase_id)
     and exists (select 1 from core.score_reasons sr where sr.run_id = r.id and p_fact_id = any (sr.fact_ids))
     and core.phase_shows_band(r.phase_id)
   order by core.band_step(r.band) desc nulls last, p.slug
   limit 1;
  select coalesce(pg_catalog.jsonb_agg('Reason ' || sr.rank || ' of Delivery risk' order by sr.rank), '[]'::jsonb)
    into v_used_in
    from core.score_reasons sr
   where sr.run_id = v_run_id and p_fact_id = any (sr.fact_ids);
  v_section := case
    when v_fact.attribute like 'qpr.%' then 'Records → QPR filings'
    when v_fact.attribute in ('track_record.late12', 'completion.oc') then 'Developer track record'
  end;
  if v_section is not null then
    v_used_in := v_used_in || pg_catalog.jsonb_build_array(v_section);
  end if;

  -- Corrections: decided lines first (or "No corrections."), then open disputes.
  select coalesce(pg_catalog.string_agg(e.c ->> 'line', ' ' order by e.ord)
                    filter (where (e.c ->> 'outcome') is distinct from 'under_review'), 'No corrections.')
         || coalesce(' ' || pg_catalog.string_agg(e.c ->> 'line', ' ' order by e.ord)
                    filter (where (e.c ->> 'outcome') = 'under_review'), '')
    into v_corrections
    from pg_catalog.jsonb_array_elements(v_fact.corrections) with ordinality as e(c, ord);

  v_official_url := coalesce(v_source.base_url, v_reg.official_url, core.authority_json(v_reg.authority, null) ->> 'url');

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.evidence/1',
    'fact_id', v_fact.id,
    'chip', v_chip,
    'lane', v_fact.lane,
    'document', v_document,
    'dates_line', v_dates,
    'page', v_fact.page_ref,
    'extract', v_fact.extract_text,
    'read_line', v_fact.read_note,
    'used_in', v_used_in,
    'developer_says', core.developer_says_for_fact(p_fact_id),
    'corrections_line', coalesce(v_corrections, 'No corrections.'),
    'snapshot', case when v_snap.id is not null then pg_catalog.jsonb_build_object(
      'sha256_short', pg_catalog.left(v_snap.sha256::text, 8) || '…' || pg_catalog.right(v_snap.sha256::text, 8),
      'fetched_at', core.fmt_timestamp(v_snap.fetched_at)) end,
    'official_url', v_official_url,
    'view_label', case
      when v_official_url like 'https://haryanarera.gov.in%' then 'View on HARERA'
      when v_official_url is not null and v_official_url <> '' then 'View the source'
    end,
    'report_error', pg_catalog.jsonb_build_object('ref_prefix', 'E', 'sla_line', 'We answer within 15 working days.')
  );
end
$$;
comment on function core.evidence_json(uuid) is 'plinth.evidence/1 for a fact (the evidence drawer): source, document, dates, page, extract, how it was read, where it is used, corrections and the snapshot. Null for an unknown or private fact.';

-- ---------------------------------------------------------------------------
-- Lockdown sweep (T04 pattern, BUILD_PLAN §12.1), then the explicit api grants.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
