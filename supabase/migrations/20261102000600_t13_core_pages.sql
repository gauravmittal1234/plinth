-- T13 · API reads B 6/7: developer page, search, suggest, compare, methodology, about and the
-- evidence drawer in a page's context.
-- Sources: API_CONTRACTS §3.1, §4.3–§4.6; DATA_MODEL §1–§3; DESIGN §5b; WORK_BREAKDOWN T13
-- (deterministic query parsing: BHK, budget "2.5 cr", corridor synonyms, typos via pg_trgm;
-- "Low keeps Low and Moderate" with the hidden count; facts-only phases kept in results);
-- INTEGRATION_NOTES (canonical search: Kestrel, Cedar Walk Ph 2, Sapphire, Juniper; 2 hidden).
--
-- Order never follows money: search sorts by delivery risk (or another published key), never by
-- anything a developer pays for, and every filter says how many projects it hid.

-- ---------------------------------------------------------------------------
-- Shared bits
-- ---------------------------------------------------------------------------
create function core.listed_phase_ids()
returns setof uuid
language sql
stable
set search_path = ''
as $$
  select p.id
  from core.phases p
  where exists (
    select 1 from core.score_runs r
    where r.phase_id = p.id and r.status = 'published'
      and (r.published_at is null or ops.ist_date(r.published_at) <= ops.today()))
$$;
comment on function core.listed_phase_ids() is 'Phases a buyer can find: those with a published run (finished phases are track record only).';

create function core.data_as_of(p_phase_ids uuid[] default null)
returns date
language sql
stable
set search_path = ''
as $$
  select pg_catalog.max(r.data_cutoff)
  from core.score_runs r
  where r.status = 'published'
    and (r.published_at is null or ops.ist_date(r.published_at) <= ops.today())
    and (p_phase_ids is null or r.phase_id = any (p_phase_ids))
$$;
comment on function core.data_as_of(uuid[]) is 'The data cut-off of the published runs behind a page (all of them when no phases are given).';

create function core.place_preposition(p_name text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select case when p_name ~* '(expressway|road|highway|way)$' then 'on' else 'in' end
$$;
comment on function core.place_preposition(text) is '"on Dwarka Expressway", "in New Gurugram".';

create function core.list_join_comma(p_items text[])
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case when pg_catalog.cardinality(x.items) > 1
    then pg_catalog.array_to_string(x.items[1:pg_catalog.cardinality(x.items) - 1], ', ')
      || ', and ' || x.items[pg_catalog.cardinality(x.items)]
    else x.items[1] end
  from (select pg_catalog.array_remove(coalesce(p_items, '{}'::text[]), null) as items) as x
$$;
comment on function core.list_join_comma(text[]) is 'A list whose items carry their own clauses, with a comma before "and": "2,980 until Dec 2025, and 3,400 since …".';

create function core.company_name(p_legal_name text)
returns text
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.regexp_replace(p_legal_name, '\s+(Pvt\.? Ltd\.?|Private Limited)$', '', 'i')
$$;
comment on function core.company_name(text) is 'A company''s name without its legal suffix: Heronstone Projects Pvt Ltd → Heronstone Projects.';

create function core.card_developer_name(p_view jsonb)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when (core.editorial('phase', (p_view ->> 'id')::uuid, 'name_promoter')).id is not null
      and p_view ->> 'promoter_name' is not null
      then core.company_name(p_view ->> 'promoter_name') || ', a ' || (p_view ->> 'group_name') || ' company'
    else p_view ->> 'group_name'
  end
$$;
comment on function core.card_developer_name(jsonb) is 'The developer line on a card: the group, or "Heronstone Projects, a Northfield Estates company" when Plinth names the promoter company.';

-- ---------------------------------------------------------------------------
-- Developer page (API_CONTRACTS §4.4)
-- ---------------------------------------------------------------------------
create function core.group_half_years(p_group_id uuid, p_units_base integer, p_to date)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with o as (
    select pg_catalog.date_trunc('year', o.decided_on)::date
             + case when pg_catalog.date_part('month', o.decided_on) > 6 then interval '6 months' else interval '0' end as h
    from core.orders o
    join core.developers d on d.id = o.respondent_developer_id
    where d.group_id = p_group_id
      and o.order_type = 'complaint'
      and o.outcome = 'against_promoter'
      and o.decided_on > (p_to - interval '24 months')::date
      and o.decided_on <= p_to
  )
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'label', pg_catalog.to_char(x.h, 'Mon') || '–' || pg_catalog.to_char((x.h + interval '5 months')::date, 'Mon YYYY'),
           'count', x.n,
           'per_100_units', case when p_units_base > 0 then pg_catalog.round(100.0 * x.n / p_units_base, 2) end,
           'units_base', p_units_base) order by x.h), '[]'::jsonb)
  from (select o.h::date as h, pg_catalog.count(*)::integer as n from o group by o.h) as x
$$;
comment on function core.group_half_years(uuid, integer, date) is 'Complaint orders decided against the group''s companies, by half-year over 24 months, with the rate per 100 units (count and rate always together).';

create function core.developer_page_json(p_group_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_group core.developer_groups%rowtype;
  v_facts_only jsonb := core.group_facts_only(p_group_id);
  v_brand text := core.group_brand(p_group_id);
  v_linked integer;
  v_claim jsonb;
  v_tr core.facts%rowtype;
  v_tr_line text;
  v_projects jsonb;
  v_ongoing jsonb;
  v_ongoing_n integer;
  v_phase_ids uuid[];
  v_complaints jsonb;
  v_units core.editorial_notes%rowtype;
  v_units_line text;
  v_insolvency text;
  v_reply jsonb;
  v_city text := 'gurugram';
  v_base text := core.public_base_url();
begin
  select * into v_group from core.developer_groups g where g.id = p_group_id;
  if not found then
    return null;
  end if;
  v_linked := ((core.editorial('group', p_group_id, 'linked_companies')).body ->> 'count')::integer;
  v_claim := case v_group.claim_state
    when 'claimed' then pg_catalog.jsonb_build_object(
      'state', 'claimed',
      'line', case when (core.editorial('group', p_group_id, 'signatory_verified')).id is not null
        then 'Claimed by ' || v_brand || ' · verified signatory' else 'Claimed developer page · replies here' end,
      'since', v_group.claimed_on)
    when 'invited' then pg_catalog.jsonb_build_object(
      'state', 'invited',
      'line', coalesce('invited ' || ops.fmt_date(v_group.invited_on) || ' · not yet claimed', 'invited · not yet claimed'),
      'since', v_group.invited_on)
    else pg_catalog.jsonb_build_object('state', 'unclaimed', 'line', 'Not yet claimed', 'since', null)
  end;

  -- Ongoing phases: open items first (a missing QPR, a re-score, a pending notice, what an
  -- unscored phase waits for), then by delivery risk, then by name.
  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'slug', x.v ->> 'slug', 'name', x.v ->> 'name', 'state', x.v ->> 'display_state', 'chip', x.v -> 'chip',
           'price_line', x.v -> 'price' ->> 'display_line', 'progress_line', x.v -> 'progress' ->> 'line')
         order by x.open_items desc, (x.v ->> 'rank')::integer, x.v ->> 'name'),
         pg_catalog.count(*)::integer,
         pg_catalog.array_agg((x.v ->> 'id')::uuid)
    into v_ongoing, v_ongoing_n, v_phase_ids
  from (
    select core.phase_view(l.id) as v,
      pg_catalog.jsonb_array_length(coalesce(core.risk_summary_json(l.id) -> 'pending', '[]'::jsonb)) > 0 as open_items
    from core.listed_phase_ids() as l(id)
    where core.phase_group_id(l.id) = p_group_id
  ) as x;
  select coalesce(core.phase_view(v_phase_ids[1]) ->> 'city_slug', v_city) into v_city;

  select * into v_tr from core.current_fact('group', p_group_id, 'track_record.late12');
  if v_tr.id is not null then
    v_tr_line := case when coalesce((v_tr.value ->> 'finished')::integer, 0) = 0
      then v_group.name || ' is a new developer with no finished RERA project yet. We don''t guess, and it never counts against them.'
      else (v_tr.value ->> 'late') || ' of the group''s ' || (v_tr.value ->> 'finished')
        || ' finished RERA projects got OC more than 12 months late.' end;
  end if;

  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'slug', t.slug, 'name', t.name, 'rera_number', t.rera_number,
           'promoter_name', t.promoter_name,
           'promised', pg_catalog.to_char(t.promised, 'YYYY-MM'),
           'oc_on', pg_catalog.to_char(t.oc_on, 'YYYY-MM'),
           'months_late', t.months_late,
           'late', t.months_late > 12,
           'line', case
               when t.months_late is null then null
               when t.months_late < 0 then 'OC came ' || -t.months_late || case when t.months_late = -1 then ' month' else ' months' end
                 || ' before the original RERA date.'
               when t.months_late = 0 then 'OC came in the month of the original RERA date.'
               else 'OC came ' || t.months_late || case when t.months_late = 1 then ' month' else ' months' end
                 || ' after the original RERA date.' end
             || coalesce(' ' || ((core.editorial('completion', t.event_id, 'note')).body ->> 'line'), ''),
           'sources', core.source_refs(coalesce(t.fact_ids, '{}'::uuid[]), 'https://haryanarera.gov.in'))
         order by t.promised nulls last, t.rera_number), '[]'::jsonb)
    into v_projects
  from (
    select p.slug, p.name, r.rera_number, d.legal_name as promoter_name, r.original_completion as promised,
      ce.granted_on as oc_on, ce.id as event_id,
      case when ce.granted_on is not null and r.original_completion is not null
        then core.month_diff(r.original_completion, ce.granted_on) end as months_late,
      (select pg_catalog.array_agg(f.id) from core.phase_facts(p.id, 'completion.oc') f) as fact_ids
    from core.phases p
    left join core.developers d on d.id = p.promoter_id
    left join lateral (select x.* from core.phase_registration(p.id) x) as r on true
    left join lateral (
      select e.id, e.granted_on from core.completion_events e
      where e.phase_id = p.id and e.kind = 'oc' and e.granted_on <= ops.today()
      order by e.granted_on limit 1) as ce on true
    where p.status = 'completed' and core.phase_group_id(p.id) = p_group_id
  ) as t;

  v_complaints := core.risk_complaints('group', p_group_id);
  if v_complaints is not null then
    select * into v_units from core.editorial('group', p_group_id, 'units_history');
    if v_units.id is not null then
      select 'Per 100 units uses the units in the group''s RERA registrations: ' || core.list_join_comma(pg_catalog.array_agg(
               core.fmt_count((pd ->> 'units')::bigint) || case
                 when pd ? 'to' then ' until ' || core.fmt_loose_date(pd ->> 'to')
                 when pd ? 'from_phase_id' then ' since ' || (
                   select p.name || ' was registered in ' || ops.fmt_month(r.registered_on)
                   from core.phases p, core.phase_registration(p.id) r where p.id = (pd ->> 'from_phase_id')::uuid)
                 when pd ? 'from' then ' since ' || core.fmt_loose_date(pd ->> 'from')
                 else '' end order by o)) || '.'
        into v_units_line
      from pg_catalog.jsonb_array_elements(v_units.body -> 'periods') with ordinality as e(pd, o);
    end if;
    v_complaints := pg_catalog.jsonb_build_object(
      'count_24m', v_complaints -> 'count_24m',
      'per_100_units', v_complaints -> 'per_100_units',
      'units_base', v_complaints -> 'units_base',
      'line_24m', (v_complaints ->> 'count_24m') || ' decided against the group, or ' || (v_complaints ->> 'per_100_units')
        || ' per 100 units.',
      'half_years', core.group_half_years(p_group_id, (v_complaints ->> 'units_base')::integer,
        coalesce(core.data_as_of(v_phase_ids), ops.today())),
      'units_line', v_units_line,
      'fairness_line', 'A bigger group isn''t penalised for its size.');
  end if;

  select case
      when f.attribute = 'insolvency.admitted' then 'A group company of ' || v_group.name || ' was admitted to insolvency by '
        || coalesce(f.value ->> 'forum', 'NCLT') || ' order on ' || core.fmt_loose_date(f.value ->> 'order_on') || '.'
      when (f.value ->> 'found')::boolean then 'Insolvency proceedings found (checked ' || ops.fmt_date(f.as_of) || ').'
      else 'No insolvency found (checked ' || ops.fmt_date(f.as_of) || ').' end
    into v_insolvency
  from core.facts f
  where f.attribute in ('insolvency.admitted', 'insolvency.search')
    and f.superseded_by is null and f.lane <> 'buyer_upload' and f.learned_at <= ops.now()
    and ((f.subject_type = 'group' and f.subject_id = p_group_id)
      or (f.subject_type = 'developer' and f.subject_id in (select d.id from core.developers d where d.group_id = p_group_id)))
  order by (f.attribute = 'insolvency.admitted') desc, f.as_of desc
  limit 1;

  -- The group's signed reply (scope = group), next to the record it answers.
  select pg_catalog.jsonb_build_object(
           'text', d.text,
           'signatory_title', d.signatory_title,
           'signed_line', coalesce(d.signatory_name || ', ' || pg_catalog.lower(d.signatory_title), d.signatory_title)
             || ', ' || v_group.name,
           'records_line', (
             select p.name || ' got OC in ' || ops.fmt_month(e.granted_on) || ', '
               || core.month_diff(r.original_completion, e.granted_on) || ' months '
               || case when core.month_diff(r.original_completion, e.granted_on) < 0 then 'before' else 'after' end
               || ' its original RERA date.'
             from core.phases p
             join core.completion_events e on e.phase_id = p.id and e.kind = 'oc'
             cross join lateral core.phase_registration(p.id) r
             where p.id = d.phase_id and e.granted_on <= ops.today()
             order by e.granted_on limit 1),
           'published_on', ops.ist_date(d.published_at),
           'check_by', d.check_by,
           'line', 'Developer says · not yet verified · ' || ops.fmt_date(ops.ist_date(d.published_at))
             || coalesce(' · we check it by ' || ops.fmt_date(d.check_by), ''))
    into v_reply
  from ws.developer_replies d
  where d.scope = 'group' and d.status = 'published' and d.published_at <= ops.now()
    and core.phase_group_id(d.phase_id) = p_group_id
  order by d.published_at desc
  limit 1;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.developer_page/1',
    'group', pg_catalog.jsonb_build_object(
      'slug', v_group.slug, 'name', v_group.name, 'linked_companies', v_linked, 'claim', v_claim,
      'mode', case when v_facts_only is not null then 'facts_only' else 'scored' end),
    'summary_line', case when v_linked is not null and v_tr.id is not null then
      'A developer group of ' || v_linked || ' linked companies. ' || (v_tr.value ->> 'late') || ' of its '
      || (v_tr.value ->> 'finished') || ' finished projects got OC more than 12 months late. '
      || coalesce(v_ongoing_n, 0) || case when coalesce(v_ongoing_n, 0) = 1 then ' project is ongoing.' else ' projects are ongoing.' end
      end,
    'facts_only', case when v_facts_only is not null then pg_catalog.jsonb_build_object(
      'since', v_facts_only -> 'since',
      'line', 'Bands withheld pending review, from ' || ops.fmt_date((v_facts_only ->> 'since')::date),
      'anchor', 'facts-only',
      'explainer_lines', pg_catalog.jsonb_build_array(
        'Since ' || ops.fmt_date((v_facts_only ->> 'since')::date) || ' we show facts only for ' || core.possessive(v_brand)
          || ' projects' || case when v_facts_only ->> 'scope' = 'group'
            then ', while a court considers an application about our bands for this group' else '' end
          || '. Every record below is unchanged and carries its source.',
        'Still here: dates, progress reports, complaints, OC orders and company links, each with its source.',
        'Withheld everywhere: the band, its reasons and the “of 100 similar projects” figure, on this page, in search, '
          || 'Compare, alerts and the Live Record.',
        'Not a finding: this says nothing about ' || v_brand || ', and no record has changed.')) end,
    'track_record', pg_catalog.jsonb_build_object(
      'finished', v_tr.value -> 'finished',
      'late', v_tr.value -> 'late',
      'line', v_tr_line,
      'projects', v_projects,
      'sources', case when v_tr.id is not null
        then core.source_refs(array[v_tr.id], 'https://haryanarera.gov.in') else '[]'::jsonb end),
    'ongoing', coalesce(v_ongoing, '[]'::jsonb),
    'complaints', v_complaints,
    'insolvency_line', v_insolvency,
    'pre_rera', core.pre_rera_json(p_group_id),
    'reply', v_reply,
    'claim_explainer_line', 'Claiming lets a developer correct facts, reply next to the records and hear from buyers who '
      || 'ask. It never changes a band. A developer that hasn''t claimed is shown as “Invited” with the date, and we '
      || 'never call anyone uncooperative.',
    'how_buyers_find_you', pg_catalog.jsonb_build_object('rules', pg_catalog.jsonb_build_array(
      'Order never follows money. The default sort is lowest delivery risk first. No developer pays us, and no fee we '
        || 'earn ever touches ranking. Nobody can buy a place, above or below anyone.',
      'Only verified facts count. Bands, dates and costs come from records we have matched to HARERA, DTCP or MCA. A '
        || 'price list or photo a developer adds is shown and labelled as theirs, but never used to rank. Claiming a '
        || 'page doesn''t move it either.',
      'Bands show in Compare. Buyers see each band side by side with the all-in cost and progress. A buyer who asks for '
        || 'low delivery risk gets two tiles, Low and Moderate, and can remove either. Buyers always see how many '
        || 'projects their filters hid.')),
    'meta', pg_catalog.jsonb_build_object(
      'data_as_of', coalesce(core.data_as_of(v_phase_ids), core.data_as_of()),
      'model_version', (core.current_model()).version,
      'generated_at', core.fmt_timestamp(ops.now()),
      'methodology_url', '/methodology',
      'disclaimer_line', 'Our opinion, based on public records. Not a credit rating. Not issued by any RERA.',
      'promise_line', 'No developer pays us. Ever.',
      'live_url', v_base || '/' || v_city || '/developers/' || v_group.slug)
  );
end
$$;
comment on function core.developer_page_json(uuid) is 'plinth.developer_page/1 (API_CONTRACTS §4.4): the group, its claim (claimed, or invited with the date), the promised-vs-actual track record, ongoing phases with their chips, complaints (count and rate together), insolvency, pre-RERA, the signed group reply and the three ranking rules. Facts-only groups keep every record and lose only bands.';

-- ---------------------------------------------------------------------------
-- Search (API_CONTRACTS §4.3): a deterministic parser, then filters that say what they hid
-- ---------------------------------------------------------------------------
create function core.search_places()
returns table (term text, kind text, slug text, name text, plan_line text, plan_when text)
language sql
stable
set search_path = ''
as $$
  -- Corridors in coverage: their own names, then the synonyms buyers type.
  select pg_catalog.lower(l.name), 'corridor', l.slug, l.name, null::text, null::text
  from core.localities l where l.kind in ('corridor', 'zone')
  union all
  select s.term, 'corridor', s.slug, l.name, null, null
  from (values
    ('dwarka exp', 'dwarka-expressway'), ('dwarka e-way', 'dwarka-expressway'), ('dwarka eway', 'dwarka-expressway'),
    ('dxp', 'dwarka-expressway'), ('nh 248bb', 'dwarka-expressway'), ('northern peripheral road', 'dwarka-expressway'),
    ('new gurgaon', 'new-gurugram'), ('naya gurgaon', 'new-gurugram'), ('naya gurugram', 'new-gurugram'),
    ('golf course ext', 'golf-course-extension-road'), ('golf course extn', 'golf-course-extension-road'),
    ('gcer', 'golf-course-extension-road'), ('gce road', 'golf-course-extension-road')
  ) as s(term, slug)
  join core.localities l on l.slug = s.slug
  union all
  -- The city in coverage (no filter).
  select s.term, 'city', 'gurugram', 'Gurugram', null, null
  from (values ('gurugram'), ('gurgaon'), ('ggn')) as s(term)
  union all
  -- Places outside coverage, with the plan when there is one (WebAbout coverage, DESIGN §5b).
  select s.term, 'outside', s.slug, s.name, s.plan_line, s.plan_when
  from (values
    ('noida', 'noida', 'Noida', 'Noida and Greater Noida West', 'Jul–Sep 2027'),
    ('greater noida west', 'noida', 'Noida', 'Noida and Greater Noida West', 'Jul–Sep 2027'),
    ('greater noida', 'noida', 'Noida', 'Noida and Greater Noida West', 'Jul–Sep 2027'),
    ('noida extension', 'noida', 'Noida', 'Noida and Greater Noida West', 'Jul–Sep 2027'),
    ('gnw', 'noida', 'Noida', 'Noida and Greater Noida West', 'Jul–Sep 2027'),
    ('faridabad', 'faridabad', 'Faridabad', null, null),
    ('ghaziabad', 'ghaziabad', 'Ghaziabad', null, null),
    ('new delhi', 'delhi', 'Delhi', null, null),
    ('delhi', 'delhi', 'Delhi', null, null)
  ) as s(term, slug, name, plan_line, plan_when)
$$;
comment on function core.search_places() is 'Place words the search parser knows: corridors in coverage (names and synonyms), the city, and places outside coverage with their plan.';

create function core.search_parse(p_q text)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_q text := pg_catalog.lower(pg_catalog.btrim(pg_catalog.regexp_replace(coalesce(p_q, ''), '\s+', ' ', 'g')));
  v_rest text;
  v_bhk integer[];
  v_budget bigint;
  v_m text[];
  v_bands text[];
  v_risk text;
  v_corridors text[];
  v_out_term text;
  v_out_slug text;
  v_out_name text;
  v_out_plan text;
  v_out_when text;
  v_name text;
  v_words text[];
begin
  if v_q = '' then
    return pg_catalog.jsonb_build_object('empty', true);
  end if;
  v_rest := ' ' || v_q || ' ';

  -- BHK: "3 bhk", "3bhk", "3-bhk".
  select pg_catalog.array_agg(distinct m[1]::integer order by m[1]::integer) into v_bhk
  from pg_catalog.regexp_matches(v_q, '(\d)\s*-?\s*bhk', 'g') as m;
  v_rest := pg_catalog.regexp_replace(v_rest, '\d\s*-?\s*bhk', ' ', 'g');

  -- Budget: "under 2.5 cr", "below 90 lakh", "2.5cr", "₹1.8 crore".
  v_m := pg_catalog.regexp_match(v_q,
    '(?:under|below|upto|up to|less than|within|max|<)?\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|l|lakh|lakhs|lac|lacs)(?![a-z])');
  if v_m is not null then
    v_budget := pg_catalog.round(v_m[1]::numeric * case when v_m[2] like 'c%' then 10000000 else 100000 end)::bigint;
    v_rest := pg_catalog.regexp_replace(v_rest,
      '(?:under|below|upto|up to|less than|within|max|<)?\s*(?:₹|rs\.?|inr)?\s*\d+(?:\.\d+)?\s*(?:cr|crore|crores|l|lakh|lakhs|lac|lacs)(?![a-z])',
      ' ', 'g');
  end if;

  -- Risk: "low risk", "low delivery risk". Low keeps Low and Moderate (WebSearch).
  v_m := pg_catalog.regexp_match(v_q, '(low|moderate|elevated|high|severe)(?:\s+delivery)?\s+risk');
  if v_m is not null then
    v_risk := v_m[1];
    v_bands := case v_risk
      when 'low' then array['low', 'moderate']
      when 'moderate' then array['low', 'moderate']
      when 'elevated' then array['low', 'moderate', 'elevated']
      when 'high' then array['low', 'moderate', 'elevated', 'high']
      else array['low', 'moderate', 'elevated', 'high', 'severe'] end;
    v_rest := pg_catalog.regexp_replace(v_rest, '(low|moderate|elevated|high|severe)(\s+delivery)?\s+risk', ' ', 'g');
  end if;

  -- Places: exact words first; long names also match with a typo (pg_trgm).
  select pg_catalog.array_agg(distinct p.slug order by p.slug) into v_corridors
  from core.search_places() p
  where p.kind = 'corridor'
    and (v_rest ~ ('(^|\s)' || pg_catalog.regexp_replace(p.term, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g') || '(\s|$)')
         or (pg_catalog.length(p.term) >= 8 and extensions.word_similarity(p.term, v_rest) >= 0.75));
  select p.term, p.slug, p.name, p.plan_line, p.plan_when
    into v_out_term, v_out_slug, v_out_name, v_out_plan, v_out_when
  from core.search_places() p
  where p.kind = 'outside'
    and (v_rest ~ ('(^|\s)' || p.term || '(\s|$)')
         or (pg_catalog.length(p.term) >= 8 and extensions.word_similarity(p.term, v_rest) >= 0.8))
  order by pg_catalog.length(p.term) desc
  limit 1;

  -- What is left, once the known words are gone, may name a project.
  select pg_catalog.array_agg(w order by o) into v_words
  from pg_catalog.regexp_split_to_table(pg_catalog.btrim(v_rest), '\s+') with ordinality as t(w, o)
  where w <> ''
    and w !~ '^\d+(\.\d+)?$'
    and w not in ('bhk', 'flat', 'flats', 'apartment', 'apartments', 'home', 'homes', 'house', 'houses', 'project',
      'projects', 'in', 'near', 'on', 'at', 'the', 'a', 'an', 'for', 'with', 'and', 'or', 'of', 'under', 'below', 'upto',
      'up', 'to', 'less', 'than', 'within', 'max', 'risk', 'delivery', 'ready', 'possession', 'new', 'sector', 'sec',
      'cr', 'crore', 'lakh', 'budget', 'price', 'buy', 'show', 'me', 'find', 'best', 'top', 'good', 'gurugram',
      'gurgaon', 'ggn', 'dwarka', 'expressway', 'road', 'extension', 'golf', 'course', 'noida', 'greater', 'west')
    and not exists (select 1 from core.search_places() p where p.term = w);
  if v_words is not null and v_bhk is null and v_budget is null and v_bands is null and v_corridors is null
     and v_out_term is null then
    -- Keep the words as typed ("Indigo Terraces").
    v_name := pg_catalog.btrim(pg_catalog.regexp_replace(coalesce(p_q, ''), '\s+', ' ', 'g'));
  elsif v_words is not null then
    v_name := pg_catalog.array_to_string(v_words, ' ');
  end if;

  return pg_catalog.jsonb_build_object(
    'bhk', pg_catalog.to_jsonb(v_bhk),
    'all_in_max_inr', v_budget,
    'corridors', pg_catalog.to_jsonb(v_corridors),
    'bands', pg_catalog.to_jsonb(v_bands),
    'low_note', v_risk = 'low',
    'place', v_out_slug,
    'place_name', v_out_name,
    'plan_line', v_out_plan,
    'plan_when', v_out_when,
    'name', v_name,
    'name_only', v_words is not null and v_bhk is null and v_budget is null and v_bands is null
      and v_corridors is null and v_out_term is null);
end
$$;
comment on function core.search_parse(text) is 'The deterministic query parser (runs before any AI): BHK, budget ("under 2.5 cr"), risk ("low risk" keeps Low and Moderate), corridors by name, synonym or typo (pg_trgm), places outside coverage, and leftover words that may name a project.';

create function core.search_card(p_view jsonb, p_bhk integer)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_unit core.unit_types%rowtype;
  v_tu numeric := (p_view -> 'progress' ->> 'time_used_pct')::numeric;
  v_built text := p_view -> 'progress' ->> 'built_pct';
  v_note text;
  v_rule jsonb;
  v_months integer;
begin
  select * into v_unit from core.unit_types u
  where u.phase_id = (p_view ->> 'id')::uuid
    and (u.label = coalesce(p_bhk, 3) || ' BHK')
  limit 1;

  v_note := case
    when p_view -> 'facts_only' is not null and p_view -> 'facts_only' <> 'null'::jsonb
      then 'Band withheld pending review, from ' || ops.fmt_date((p_view -> 'facts_only' ->> 'since')::date) || '.'
    when p_view ->> 'state' = 'not_scored' then null
    when p_view ->> 'state' = 'limited_history' then 'Not enough history to score. No penalty.'
    when not (p_view ->> 'bands_public')::boolean then 'Bands are not published yet.'
    when p_view ->> 'set_by' = 'red_flag_rule' then null
    else case
        when (p_view ->> 'extensions')::integer > 0
          then (p_view ->> 'extensions') || case when (p_view ->> 'extensions')::integer = 1 then ' extension' else ' extensions' end
        when (p_view ->> 'band_since')::date >= ops.today() - 30
          then 'Since ' || ops.fmt_date((p_view ->> 'band_since')::date)
        else 'Delivery risk · as of ' || ops.fmt_date((p_view ->> 'data_cutoff')::date) end
      || case when p_view ->> 'confidence' = 'low' then '. We''re less certain about this one.' else '' end
  end;
  if p_view ->> 'state' = 'not_scored' and p_view ->> 'registered_on' is not null then
    v_months := (select (m.config -> 'not_scored' ->> 'min_months_registered')::integer
                 from core.score_models m where m.version = p_view ->> 'model_version');
    v_note := 'Registered ' || ops.fmt_month((p_view ->> 'registered_on')::date)
      || case when (p_view ->> 'registered_on')::date > (ops.today() - pg_catalog.make_interval(months => coalesce(v_months, 6)))::date
           then ', less than ' || coalesce(v_months, 6) || ' months ago' else '' end || '.';
  elsif p_view ->> 'set_by' = 'red_flag_rule' and (p_view ->> 'show_band')::boolean then
    select f.value into v_rule
    from core.red_flags rf
    join core.facts f on f.id = rf.fact_ids[1]
    where rf.rule_code = p_view ->> 'rule_code' and rf.cleared_on is null
      and (rf.subject_id = (p_view ->> 'id')::uuid or rf.subject_id = (p_view ->> 'group_id')::uuid
        or rf.subject_id in (select d.id from core.developers d where d.group_id = (p_view ->> 'group_id')::uuid))
    order by rf.triggered_on desc limit 1;
    v_note := 'Red-flag rule · ' || coalesce(v_rule ->> 'forum', 'NCLT') || ' order'
      || coalesce(', ' || core.fmt_loose_date(v_rule ->> 'order_on'), '');
  end if;

  return pg_catalog.jsonb_build_object(
    'slug', p_view ->> 'slug',
    'name', p_view ->> 'name',
    'locality_line', p_view ->> 'locality_line',
    'developer_name', core.card_developer_name(p_view),
    'chip', p_view -> 'chip',
    'state', p_view ->> 'display_state',
    'chip_note', v_note,
    'price_line', p_view -> 'price' ->> 'display_line',
    'pin_label', p_view -> 'price' ->> 'all_in_label',
    'built_line', case when v_built is not null then v_built || '% built' end,
    'progress_line', case when v_built is not null and v_tu is not null then v_built || '% built · '
      || case when v_tu > 100 then 'past original date' else core.fmt_num(v_tu) || '% of time used' end end,
    'built_pct', p_view -> 'progress' -> 'built_pct',
    'time_used_pct', p_view -> 'progress' -> 'time_used_pct',
    'config_line', case when v_unit.id is not null then v_unit.label || ', ' || case when v_unit.carpet_sqft is not null
      then core.fmt_count(pg_catalog.round(v_unit.carpet_sqft)::bigint) || ' sq ft carpet'
      else 'carpet not in our records yet' end end,
    'completion_line', case when p_view ->> 'original_completion' is not null
      then 'Original completion ' || ops.fmt_month((p_view ->> 'original_completion')::date) end,
    'image_url', (core.editorial('phase', (p_view ->> 'id')::uuid, 'hero_image')).body ->> 'url',
    'centroid', p_view -> 'centroid'
  );
end
$$;
comment on function core.search_card(jsonb, integer) is 'ProjectCard for search and the map: chip and its note, price (all-in first), progress, the requested BHK''s carpet, completion, image and the sector pin.';

create function core.search_json(
  p_q text,
  p_filters jsonb,
  p_sort text,
  p_bbox jsonb,
  p_cursor text,
  p_limit integer
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_parse jsonb := core.search_parse(p_q);
  v_f jsonb := coalesce(p_filters, '{}'::jsonb);
  v_bhk integer[];
  v_budget bigint;
  v_corridors text[];
  v_bands text[];
  v_parsed jsonb;
  v_notes jsonb := '[]'::jsonb;
  v_sort text := coalesce(p_sort, 'lowest_risk');
  v_offset integer := 0;
  v_limit integer := coalesce(p_limit, 20);
  v_rows jsonb;
  v_items jsonb;
  v_hidden jsonb;
  v_hidden_n integer;
  v_total integer;
  v_zero jsonb;
  v_area_name text;
  v_back jsonb;
  v_back_labels text[];
  v_one jsonb;
  v_unit_label text;
  v_unit_carpet numeric;
  v_unit_price bigint;
  v_unit_all_in bigint;
  v_meta jsonb;
begin
  v_meta := pg_catalog.jsonb_build_object(
    'data_as_of', core.data_as_of(),
    'model_version', (core.current_model()).version,
    'generated_at', core.fmt_timestamp(ops.now()));

  if p_cursor is not null and p_cursor ~ '^o:\d+$' then
    v_offset := pg_catalog.substr(p_cursor, 3)::integer;
  end if;

  -- Structured filters win over the words of the query.
  select pg_catalog.array_agg(x::integer) into v_bhk
  from pg_catalog.jsonb_array_elements_text(coalesce(
    case when pg_catalog.jsonb_typeof(v_f -> 'bhk') = 'array' then v_f -> 'bhk' end,
    case when pg_catalog.jsonb_typeof(v_parse -> 'bhk') = 'array' then v_parse -> 'bhk' end, '[]'::jsonb)) as x;
  v_budget := coalesce((v_f ->> 'all_in_max_inr')::bigint, (v_parse ->> 'all_in_max_inr')::bigint);
  select pg_catalog.array_agg(x) into v_corridors
  from pg_catalog.jsonb_array_elements_text(coalesce(
    case when pg_catalog.jsonb_typeof(v_f -> 'corridors') = 'array' then v_f -> 'corridors' end,
    case when pg_catalog.jsonb_typeof(v_parse -> 'corridors') = 'array' then v_parse -> 'corridors' end, '[]'::jsonb)) as x;
  select pg_catalog.array_agg(x) into v_bands
  from pg_catalog.jsonb_array_elements_text(coalesce(
    case when pg_catalog.jsonb_typeof(v_f -> 'bands') = 'array' then v_f -> 'bands' end,
    case when pg_catalog.jsonb_typeof(v_parse -> 'bands') = 'array' then v_parse -> 'bands' end, '[]'::jsonb)) as x;

  -- A place we don't cover yet: say so, never guess.
  if v_parse ->> 'place' is not null and v_corridors is null then
    return pg_catalog.jsonb_build_object(
      'schema', 'plinth.search_results/1', 'query', p_q,
      'parsed', pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
        'bhk', pg_catalog.to_jsonb(v_bhk), 'place', v_parse ->> 'place')),
      'notes', '[]'::jsonb,
      'sort_line', 'Sorted by lowest delivery risk. Order never follows money.',
      'legend_line', 'Pins show all-in prices',
      'items', '[]'::jsonb, 'hidden_count', 0, 'hidden', '[]'::jsonb, 'next_cursor', null,
      'zero_results', pg_catalog.jsonb_build_object(
        'kind', 'outside_coverage',
        'line', 'We don''t cover ' || (v_parse ->> 'place_name') || ' yet, so we won''t guess. Plinth covers Gurugram today.'
          || coalesce(' ' || (v_parse ->> 'plan_line') || ' are planned for ' || (v_parse ->> 'plan_when') || '.', ''),
        'action', pg_catalog.jsonb_build_object('kind', 'waitlist', 'label', 'Join the ' || (v_parse ->> 'place_name') || ' waitlist'),
        'detail_line', 'One WhatsApp message when ' || (v_parse ->> 'place_name') || ' opens'
          || coalesce(', planned for ' || (v_parse ->> 'plan_when'), '') || '. Nothing else.'),
      'meta', v_meta);
  end if;

  if v_sort not in ('lowest_risk', 'lowest_all_in', 'most_built', 'soonest_completion') then
    perform ops.raise_api_error('invalid_input', 'Sort by lowest_risk, lowest_all_in, most_built or soonest_completion.');
  end if;
  if v_limit < 1 or v_limit > 50 then
    perform ops.raise_api_error('invalid_input', 'Ask for between 1 and 50 projects at a time.');
  end if;

  -- Every listed phase, with what each filter thinks of it.
  select pg_catalog.jsonb_agg(r) into v_rows
  from (
    select pg_catalog.jsonb_build_object(
        'v', x.v,
        'in_area', (v_corridors is null or x.v ->> 'corridor_slug' = any (v_corridors))
          and (p_bbox is null or pg_catalog.jsonb_array_length(p_bbox) <> 4 or x.v -> 'centroid' is null
               or x.v -> 'centroid' = 'null'::jsonb
               or ((x.v -> 'centroid' ->> 0)::numeric between (p_bbox ->> 0)::numeric and (p_bbox ->> 2)::numeric
                   and (x.v -> 'centroid' ->> 1)::numeric between (p_bbox ->> 1)::numeric and (p_bbox ->> 3)::numeric)),
        'name_match', (v_parse ->> 'name') is null or v_parse ->> 'name_only' = 'false'
          or extensions.similarity(pg_catalog.lower(x.v ->> 'name'), pg_catalog.lower(v_parse ->> 'name')) >= 0.3
          or pg_catalog.lower(x.v ->> 'name') ~ ('\m' || pg_catalog.regexp_replace(pg_catalog.lower(v_parse ->> 'name'), '[^a-z0-9 ]', '', 'g')),
        'units', x.units,
        'pass_bhk', v_bhk is null or exists (select 1 from pg_catalog.unnest(x.units) n where n = any (v_bhk)),
        'price', x.price,
        'pass_budget', v_budget is null or (x.price is not null and x.price <= v_budget),
        'pass_risk', v_bands is null or not (x.v ->> 'show_band')::boolean or x.v ->> 'band' = any (v_bands)) as r
    from (
      select v.v,
        (select pg_catalog.array_agg(distinct pg_catalog.substring(u.label, '^(\d+)')::integer)
           from core.unit_types u where u.phase_id = l.id and u.label ~ '^\d') as units,
        coalesce(
          (select (f.value ->> 'all_in_inr')::bigint from core.phase_facts(l.id, 'price.all_in') f
            where f.value ->> 'unit' = coalesce(v_bhk[1], 3) || ' BHK' order by f.as_of desc limit 1),
          (select (f.value ->> 'base_price_inr')::bigint from core.phase_facts(l.id, 'price.quoted') f
            where f.value ->> 'unit' = coalesce(v_bhk[1], 3) || ' BHK' order by f.as_of desc limit 1)) as price
      from core.listed_phase_ids() as l(id)
      cross join lateral (select core.phase_view(l.id) as v) as v
    ) as x
  ) as y;

  -- A query that only names a project matches by name and filters nothing else.
  if v_parse ->> 'name_only' = 'true'
     and not exists (select 1 from pg_catalog.jsonb_array_elements(coalesce(v_rows, '[]'::jsonb)) r where (r ->> 'name_match')::boolean) then
    return pg_catalog.jsonb_build_object(
      'schema', 'plinth.search_results/1', 'query', p_q,
      'parsed', pg_catalog.jsonb_build_object('name', v_parse ->> 'name'),
      'notes', '[]'::jsonb,
      'sort_line', 'Sorted by lowest delivery risk. Order never follows money.',
      'legend_line', 'Pins show all-in prices',
      'items', '[]'::jsonb, 'hidden_count', 0, 'hidden', '[]'::jsonb, 'next_cursor', null,
      'zero_results', pg_catalog.jsonb_build_object(
        'kind', 'unknown_project',
        'line', 'We can''t find ' || (v_parse ->> 'name') || ' in our records. If it has a Gurugram RERA number, we''ll add it by '
          || ops.fmt_date(ops.today() + 14) || ' or tell you why not.',
        'action', pg_catalog.jsonb_build_object('kind', 'request_project', 'label', 'Request it'),
        'detail_line', 'We add any Gurugram project with a RERA number within 14 days, or say why not in writing: no RERA '
          || 'registration, outside Gurugram, or registration lapsed.'),
      'meta', v_meta);
  end if;

  v_parsed := case
    when (v_parse ->> 'empty')::boolean and p_filters is null then '{}'::jsonb
    when v_parse ->> 'name_only' = 'true' and p_filters is null then '{}'::jsonb
    else pg_catalog.jsonb_build_object(
      'bhk', pg_catalog.to_jsonb(v_bhk), 'all_in_max_inr', v_budget,
      'corridors', pg_catalog.to_jsonb(v_corridors), 'bands', pg_catalog.to_jsonb(v_bands))
      || case when v_f ? 'possession_by' then pg_catalog.jsonb_build_object('possession_by', v_f -> 'possession_by') else '{}'::jsonb end
  end;

  -- Hidden: in the area, but some filter left it out; each says why.
  select coalesce(pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'slug', r -> 'v' ->> 'slug', 'name', r -> 'v' ->> 'name',
           'why_line', pg_catalog.array_to_string(array[
             case
               when not (r ->> 'pass_bhk')::boolean then case when r -> 'units' <> 'null'::jsonb
                 then 'no ' || v_bhk[1] || ' BHK' else 'no price list with us' end
               when not (r ->> 'pass_budget')::boolean then case
                 when r -> 'v' -> 'price' ->> 'all_in_label' is not null
                   then 'quoted ' || (r -> 'v' -> 'price' ->> 'quoted_label') || ', but '
                     || (r -> 'v' -> 'price' ->> 'all_in_label') || ' all-in'
                 when r -> 'v' -> 'price' ->> 'quoted_label' is not null then 'quoted ' || (r -> 'v' -> 'price' ->> 'quoted_label')
                 else 'no price list with us' end
             end,
             case when not (r ->> 'pass_risk')::boolean then 'delivery risk ' || (r -> 'v' ->> 'band_label') end], ' · '))
         order by (r -> 'v' ->> 'rank')::integer, r -> 'v' ->> 'name'), '[]'::jsonb),
         pg_catalog.count(*)::integer
    into v_hidden, v_hidden_n
  from pg_catalog.jsonb_array_elements(coalesce(v_rows, '[]'::jsonb)) r
  where (r ->> 'in_area')::boolean and (r ->> 'name_match')::boolean
    and not ((r ->> 'pass_bhk')::boolean and (r ->> 'pass_budget')::boolean and (r ->> 'pass_risk')::boolean);

  select pg_catalog.count(*)::integer,
         pg_catalog.jsonb_agg(core.search_card(s.r -> 'v', v_bhk[1]) order by s.k1, s.k2, s.name)
           filter (where s.n > v_offset and s.n <= v_offset + v_limit)
    into v_total, v_items
  from (
    select r, k1, k2, r -> 'v' ->> 'name' as name,
      pg_catalog.row_number() over (order by k1, k2, r -> 'v' ->> 'name') as n
    from (
      select r,
        case v_sort
          when 'lowest_risk' then (r -> 'v' ->> 'rank')::numeric
          when 'lowest_all_in' then coalesce((r ->> 'price')::numeric, 1e15)
          when 'most_built' then -coalesce((r -> 'v' -> 'progress' ->> 'built_pct')::numeric, -1)
          else coalesce(core.month_index((r -> 'v' ->> 'original_completion')::date), 999999)::numeric end as k1,
        (r -> 'v' ->> 'rank')::numeric as k2
      from pg_catalog.jsonb_array_elements(coalesce(v_rows, '[]'::jsonb)) r
      where (r ->> 'in_area')::boolean and (r ->> 'name_match')::boolean
        and (r ->> 'pass_bhk')::boolean and (r ->> 'pass_budget')::boolean and (r ->> 'pass_risk')::boolean
    ) as q
  ) as s;

  if v_parse ->> 'low_note' = 'true' and v_bands @> array['low', 'moderate'] then
    v_notes := v_notes || '["“Low delivery risk” shows Low and Moderate."]'::jsonb;
  end if;
  if v_hidden_n > 0 then
    v_notes := v_notes || pg_catalog.to_jsonb(case when v_hidden_n = 1 then '1 project hidden by your filter.'
      else v_hidden_n || ' projects hidden by your filters.' end);
  end if;

  -- Nothing fits: name the filter that would bring something back (risk first, never the size).
  if coalesce(v_total, 0) = 0 then
    select l.name into v_area_name from core.localities l where l.slug = v_corridors[1];
    v_area_name := coalesce(v_area_name, 'Gurugram');
    select pg_catalog.jsonb_agg(r -> 'v' ->> 'slug' order by (r -> 'v' ->> 'rank')::integer, r -> 'v' ->> 'name'),
           pg_catalog.array_agg(distinct r -> 'v' ->> 'band_label')
      into v_back, v_back_labels
    from pg_catalog.jsonb_array_elements(coalesce(v_rows, '[]'::jsonb)) r
    where (r ->> 'in_area')::boolean and (r ->> 'pass_bhk')::boolean and (r ->> 'pass_budget')::boolean
      and not (r ->> 'pass_risk')::boolean;
    if v_back is not null and pg_catalog.jsonb_array_length(v_back) = 1 then
      select r -> 'v' as v into v_one
      from pg_catalog.jsonb_array_elements(v_rows) r where r -> 'v' ->> 'slug' = v_back ->> 0;
      select u.label, u.carpet_sqft, li.base_price_inr,
             (select (f.value ->> 'all_in_inr')::bigint from core.phase_facts(u.phase_id, 'price.all_in') f
               where f.value ->> 'unit' = u.label order by f.as_of desc limit 1)
        into v_unit_label, v_unit_carpet, v_unit_price, v_unit_all_in
      from core.unit_types u
      left join lateral (
        select li.base_price_inr from ws.price_list_items li join ws.price_lists pl on pl.id = li.price_list_id
        where li.unit_type_id = u.id and pl.status = 'published' and pl.published_on <= ops.today()
        order by pl.published_on desc limit 1) as li on true
      where u.phase_id = (v_one ->> 'id')::uuid and u.label = coalesce(v_bhk[1], 3) || ' BHK';
    end if;
    v_zero := pg_catalog.jsonb_build_object(
      'kind', 'no_match',
      'line', 'Nothing ' || core.place_preposition(v_area_name) || ' ' || v_area_name
        || ' fits every word above. The list below says what each project misses.',
      'action', case when v_back is not null then pg_catalog.jsonb_build_object(
        'kind', 'drop_filter', 'label', 'Risk: add ' || core.list_join(v_back_labels), 'drop', 'bands',
        'brings_back', v_back) end,
      'detail_line', case
        when v_one is not null and v_bhk is not null and v_unit_label is not null then
          'It''s the only ' || v_area_name || ' project here with a ' || v_unit_label || ': '
          || coalesce(core.fmt_count(pg_catalog.round(v_unit_carpet)::bigint) || ' sq ft carpet, ', '')
          || coalesce('quoted from ' || ops.fmt_inr_short(v_unit_price) || ', ', '')
          || coalesce(ops.fmt_inr_short(v_unit_all_in) || ' all-in', 'all-in not known yet')
          || '. Its delivery risk is ' || (v_one ->> 'band_label') || '.'
        when v_back is not null then pg_catalog.jsonb_array_length(v_back) || ' projects come back if you add '
          || core.list_join(v_back_labels) || '.'
      end);
  end if;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.search_results/1',
    'query', p_q,
    'parsed', v_parsed,
    'notes', v_notes,
    'sort_line', case v_sort
      when 'lowest_all_in' then 'Sorted by lowest all-in price. Order never follows money.'
      when 'most_built' then 'Sorted by most built. Order never follows money.'
      when 'soonest_completion' then 'Sorted by soonest original completion. Order never follows money.'
      else 'Sorted by lowest delivery risk. Order never follows money.' end,
    'legend_line', 'Pins show all-in prices',
    'items', coalesce(v_items, '[]'::jsonb),
    'hidden_count', coalesce(v_hidden_n, 0),
    'hidden', coalesce(v_hidden, '[]'::jsonb),
    'next_cursor', case when coalesce(v_total, 0) > v_offset + v_limit then 'o:' || (v_offset + v_limit) end,
    'zero_results', v_zero,
    'meta', v_meta
  );
end
$$;
comment on function core.search_json(text, jsonb, text, jsonb, text, integer) is 'plinth.search_results/1 (API_CONTRACTS §4.3): the parsed filters, the results (lowest delivery risk first; facts-only and unscored phases are never hidden by a risk filter), every hidden project with why, and guidance when nothing matches, a project is unknown or a place is outside coverage.';

-- ---------------------------------------------------------------------------
-- Suggest: up to 8 name, RERA number and sector matches (typo-tolerant)
-- ---------------------------------------------------------------------------
create function core.suggest_json(p_q text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with q as (
    select pg_catalog.lower(pg_catalog.btrim(pg_catalog.regexp_replace(p_q, '\s+', ' ', 'g'))) as t,
      pg_catalog.regexp_replace(pg_catalog.lower(p_q), '[^a-z0-9]', '', 'g') as compact
  ),
  phases as (
    select v.v,
      case
        when q.compact <> '' and pg_catalog.length(q.compact) >= 3
          and pg_catalog.regexp_replace(pg_catalog.lower(v.v ->> 'rera_number'), '[^a-z0-9]', '', 'g') like '%' || q.compact || '%'
          then 'rera_number'
        when pg_catalog.lower(v.v ->> 'name') ~ ('\m' || pg_catalog.regexp_replace(q.t, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g'))
          or extensions.similarity(pg_catalog.lower(v.v ->> 'name'), q.t) >= 0.3
          or extensions.word_similarity(q.t, pg_catalog.lower(v.v ->> 'name')) >= 0.6
          then 'name'
        when q.t ~ '^(sector|sec|s)\s*\d+[a-z]?$' and pg_catalog.lower(v.v ->> 'sector_name')
             = 'sector ' || pg_catalog.substring(q.t, '(\d+[a-z]?)$')
          then 'sector'
      end as matched_on,
      greatest(extensions.similarity(pg_catalog.lower(v.v ->> 'name'), q.t),
               case when pg_catalog.lower(v.v ->> 'name') like q.t || '%' then 1 else 0 end) as score
    from core.listed_phase_ids() as l(id)
    cross join lateral (select core.phase_view(l.id) as v) as v
    cross join q
  ),
  groups as (
    select g.slug, g.name,
      greatest(extensions.similarity(pg_catalog.lower(g.name), q.t),
               case when pg_catalog.lower(g.name) like q.t || '%' then 1 else 0 end) as score,
      (select pg_catalog.count(*) from core.listed_phase_ids() as l(id) where core.phase_group_id(l.id) = g.id) as ongoing
    from core.developer_groups g, q
    where pg_catalog.lower(g.name) ~ ('\m' || pg_catalog.regexp_replace(q.t, '([.^$*+?()\[\]{}|\\-])', '\\\1', 'g'))
       or extensions.similarity(pg_catalog.lower(g.name), q.t) >= 0.3
  ),
  places as (
    select l.slug, l.name, l.kind, coalesce(p.name, 'Gurugram') as parent_name,
      case when l.kind = 'sector' then 'sector' when pg_catalog.lower(l.name) = q.t then 'name' else 'synonym' end as matched_on
    from core.localities l
    left join core.localities p on p.id = l.parent_id
    cross join q
    where l.kind in ('sector', 'corridor', 'zone')
      and (pg_catalog.lower(l.name) = q.t
        or (l.kind = 'sector' and q.t ~ '^(sector|sec|s)\s*\d+[a-z]?$'
            and pg_catalog.lower(l.name) = 'sector ' || pg_catalog.substring(q.t, '(\d+[a-z]?)$'))
        or (l.kind <> 'sector' and exists (
            select 1 from core.search_places() s
            where s.slug = l.slug and (s.term = q.t or (pg_catalog.length(s.term) >= 8 and extensions.similarity(s.term, q.t) >= 0.6)))))
  ),
  items as (
    select 1 as grp, p.score, p.v ->> 'name' as label, pg_catalog.jsonb_build_object(
      'kind', 'phase', 'slug', p.v ->> 'slug', 'label', p.v ->> 'name',
      'detail_line', pg_catalog.concat_ws(' · ', p.v ->> 'locality_line', p.v ->> 'rera_number'),
      'matched_on', p.matched_on) as item
    from phases p where p.matched_on is not null
    union all
    select 2, g.score, g.name, pg_catalog.jsonb_build_object(
      'kind', 'developer', 'slug', g.slug, 'label', g.name,
      'detail_line', 'Developer · ' || g.ongoing || case when g.ongoing = 1 then ' ongoing project' else ' ongoing projects' end,
      'matched_on', 'name')
    from groups g
    union all
    select 3, 1, pl.name, pg_catalog.jsonb_build_object(
      'kind', 'locality', 'slug', pl.slug, 'label', pl.name,
      'detail_line', case when pl.kind = 'sector' then pl.parent_name else 'Corridor · ' || pl.parent_name end,
      'matched_on', pl.matched_on)
    from places pl
  )
  select pg_catalog.jsonb_build_object(
    'schema', 'plinth.suggest/1',
    'q', p_q,
    'items', coalesce((
      select pg_catalog.jsonb_agg(x.item order by x.score desc, x.grp, x.label)
      from (select i.* from items i order by i.score desc, i.grp, i.label limit 8) as x), '[]'::jsonb))
$$;
comment on function core.suggest_json(text) is 'plinth.suggest/1: up to 8 phases (name word-prefix or typo via pg_trgm, RERA number, sector), developer groups and places (sectors, corridors and their synonyms). Best match first.';

-- ---------------------------------------------------------------------------
-- Compare (API_CONTRACTS §4.5): 2–4 phases, every row naming its source
-- ---------------------------------------------------------------------------
create function core.compare_pending_cell(p_view jsonb)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_missing text[];
  v_years text[];
  v_due date;
  v_latest core.qpr_filings%rowtype;
  v_hours integer;
  v_label text;
begin
  select pg_catalog.array_agg(q.quarter order by q.quarter), pg_catalog.array_agg(distinct pg_catalog.split_part(q.quarter, '-', 1)),
         pg_catalog.max(q.due_on)
    into v_missing, v_years, v_due
  from core.qpr_filings q
  where q.registration_id = (p_view ->> 'reg_id')::uuid and q.status = 'missing' and q.due_on <= ops.today();

  if v_missing is not null then
    if pg_catalog.cardinality(v_missing) = 1 then
      v_label := ops.fmt_quarter(v_missing[1]) || ' QPR not on ' || (p_view ->> 'authority_short') || ' yet (due '
        || core.fmt_day_month(v_due) || ')';
    else
      v_label := case when pg_catalog.cardinality(v_years) = 1
          then core.list_join(array(select pg_catalog.split_part(ops.fmt_quarter(m), ' ', 1) from pg_catalog.unnest(v_missing) m))
            || ' ' || v_years[1]
          else core.list_join(array(select ops.fmt_quarter(m) from pg_catalog.unnest(v_missing) m)) end
        || ' QPRs not on ' || (p_view ->> 'authority_short') || ' yet';
    end if;
    if (p_view ->> 'stale')::boolean and p_view -> 'progress' -> 'latest_qpr' ->> 'age_days' is not null then
      v_label := v_label || ' · progress ' || (p_view -> 'progress' -> 'latest_qpr' ->> 'age_days') || ' days old';
    end if;
    return v_label;
  end if;

  select * into v_latest from core.qpr_filings q
  where q.registration_id = (p_view ->> 'reg_id')::uuid and q.due_on <= ops.today() and q.filed_on is not null
  order by q.quarter desc limit 1;
  if v_latest.id is null then
    return null;
  end if;
  if v_latest.fetched_at > (p_view ->> 'computed_at')::timestamptz and v_latest.fetched_at <= ops.now() then
    select (m.config ->> 'rescore_hours')::integer into v_hours from core.score_models m where m.version = p_view ->> 'model_version';
    return ops.fmt_quarter(v_latest.quarter) || ' QPR filed ' || ops.fmt_date(v_latest.filed_on) || ' · re-score due by '
      || ops.fmt_date(ops.ist_date(v_latest.fetched_at + pg_catalog.make_interval(hours => coalesce(v_hours, 72)))) || ', '
      || core.fmt_clock(v_latest.fetched_at + pg_catalog.make_interval(hours => coalesce(v_hours, 72)));
  end if;
  return ops.fmt_quarter(v_latest.quarter) || ' QPR filed '
    || case when v_latest.status = 'late' then v_latest.days_late || ' days late' else 'on time' end
    || ', ' || ops.fmt_date(v_latest.filed_on);
end
$$;
comment on function core.compare_pending_cell(jsonb) is 'Compare "On record now": missing QPRs (with the due date when one), a filing waiting for its re-score, or the latest filing.';

create function core.compare_json(p_phase_ids uuid[])
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_views jsonb;
  v_model core.score_models%rowtype := core.current_model();
  v_rules core.cost_rule_sets%rowtype;
  v_carpet_src text[];
  v_commute_as_of date;
begin
  select pg_catalog.jsonb_agg(core.phase_view(x.id) order by x.ord) into v_views
  from pg_catalog.unnest(p_phase_ids) with ordinality as x(id, ord);
  select * into v_rules from core.cost_rules_for('HR', ops.today());

  -- Where each 3 BHK carpet comes from: the registration (records) or the developer's price lists.
  select pg_catalog.array_agg(s.src order by s.o) into v_carpet_src
  from (
    select pg_catalog.min(x.o) as o, x.src
    from (
      select e.ord as o,
        case when u.lane = 'records_show'
          then (v ->> 'authority_short') || ' registration (' || (v ->> 'project_word') || ')'
          else 'developer price lists' || coalesce(', ' || (
            select ops.fmt_month(pl.published_on) from ws.price_lists pl
            where pl.phase_id = (v ->> 'id')::uuid and pl.status = 'published' and pl.published_on <= ops.today()
            order by pl.published_on desc limit 1), '') end as src
      from pg_catalog.jsonb_array_elements(v_views) with ordinality as e(v, ord)
      join core.unit_types u on u.phase_id = (v ->> 'id')::uuid and u.label = '3 BHK' and u.carpet_sqft is not null
    ) as x
    group by x.src
  ) as s;
  select pg_catalog.max(n.as_of) into v_commute_as_of
  from pg_catalog.jsonb_array_elements(v_views) as e(v)
  cross join lateral core.editorial('phase', (v ->> 'id')::uuid, 'getting_around') as n;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.compare/1',
    'columns', (select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'slug', v ->> 'slug', 'name', v ->> 'name', 'chip', v -> 'chip', 'state', v ->> 'display_state',
        'locality_line', v ->> 'locality_line', 'developer_name', v ->> 'group_name',
        'price_line', v -> 'price' ->> 'display_line',
        'image_url', (core.editorial('phase', (v ->> 'id')::uuid, 'hero_image')).body ->> 'url') order by ord)
      from pg_catalog.jsonb_array_elements(v_views) with ordinality as e(v, ord)),
    'rows', pg_catalog.jsonb_build_array(
      core.compare_row(v_views, 'frequency', 'Out of 100 similar projects',
        'Methodology ' || v_model.version || ' · ' || ops.fmt_date(v_model.released_on)),
      core.compare_row(v_views, 'all_in', 'All-in, 3 BHK', 'Cost sheets + rules v' || coalesce(v_rules.version, '')),
      core.compare_row(v_views, 'built', 'Built vs time used', 'Latest HARERA QPR for each project'),
      core.compare_row(v_views, 'carpet', 'Carpet area, 3 BHK', coalesce(pg_catalog.array_to_string(v_carpet_src, ' · '), 'Developer price lists')),
      core.compare_row(v_views, 'loading', 'Loading, 3 BHK (super vs carpet)', 'Developer cost sheets'),
      core.compare_row(v_views, 'completion', 'Original completion (RERA)', 'HARERA registration certificates'),
      core.compare_row(v_views, 'complaints', 'Complaints, 24 months',
        'HARERA orders · to ' || ops.fmt_date(core.data_as_of(p_phase_ids))),
      core.compare_row(v_views, 'commute', 'Commute to Cyber City, 9 am',
        'Plinth estimate · road distance' || coalesce(', ' || ops.fmt_month(v_commute_as_of), '')),
      core.compare_row(v_views, 'top_reason', 'Top reason for the band', 'Methodology ' || v_model.version),
      core.compare_row(v_views, 'track_record', 'Developer track record', 'HARERA + DTCP OC records'),
      core.compare_row(v_views, 'pending', 'On record now', 'HARERA QPR register · ' || ops.fmt_date(ops.today()))),
    'notes', pg_catalog.jsonb_build_array(
      '3 BHK on each. Every row names its source.',
      'Facts-only projects show “Band withheld · facts only”.',
      'Blank cells say “Not in our records yet” rather than guess.'),
    'meta', pg_catalog.jsonb_build_object(
      'data_as_of', core.data_as_of(p_phase_ids),
      'model_version', v_model.version,
      'generated_at', core.fmt_timestamp(ops.now()),
      'disclaimer_line', 'Our opinion, based on public records. Not a credit rating. Not issued by any RERA.',
      'promise_line', 'No developer pays us. Ever.')
  );
end
$$;

create function core.compare_cell(p_view jsonb, p_key text)
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  v_phase_id uuid := (p_view ->> 'id')::uuid;
  v_withheld boolean := p_view -> 'facts_only' is not null and p_view -> 'facts_only' <> 'null'::jsonb;
  v_unit core.unit_types%rowtype;
  v_ext text[];
  v_count integer;
  v_tr jsonb;
begin
  case p_key
  when 'frequency' then
    if v_withheld then
      return 'Band withheld · facts only';
    elsif (p_view ->> 'show_band')::boolean and p_view ->> 'set_by' = 'red_flag_rule' then
      return 'Set by a published red-flag rule';
    elsif (p_view ->> 'freq_short') is not null then
      return pg_catalog.regexp_replace(p_view ->> 'freq_short', ' of 100$', '') || ' were more than 12 months late';
    end if;
    return null;
  when 'all_in' then
    return (p_view -> 'price' ->> 'all_in_label') || ' · ' || (p_view -> 'price' ->> 'per_sqft_carpet_label');
  when 'built' then
    if p_view -> 'progress' ->> 'built_pct' is null then
      return null;
    end if;
    return (p_view -> 'progress' ->> 'built_pct') || '% built · ' || (p_view -> 'progress' ->> 'time_used_pct') || '% of time used';
  when 'carpet', 'loading' then
    select * into v_unit from core.unit_types u where u.phase_id = v_phase_id and u.label = '3 BHK';
    if p_key = 'carpet' then
      return core.fmt_count(pg_catalog.round(v_unit.carpet_sqft)::bigint) || ' sq ft';
    end if;
    return pg_catalog.round((v_unit.super_sqft / v_unit.carpet_sqft - 1) * 100)::text || '% · '
      || core.fmt_count(pg_catalog.round(v_unit.super_sqft)::bigint) || ' sq ft super';
  when 'completion' then
    if p_view ->> 'original_completion' is null then
      return null;
    end if;
    select pg_catalog.array_agg(ops.fmt_month(e.to_completion) order by e.granted_on) into v_ext
    from core.extensions e where e.registration_id = (p_view ->> 'reg_id')::uuid;
    select (f.value ->> 'count')::integer into v_count from core.phase_facts(v_phase_id, 'registration.extensions') f limit 1;
    return ops.fmt_month((p_view ->> 'original_completion')::date) || case
      when v_ext is not null then ' · extended ' || case pg_catalog.cardinality(v_ext) when 1 then 'once' when 2 then 'twice'
          else pg_catalog.cardinality(v_ext) || ' times' end || ': ' || pg_catalog.array_to_string(v_ext, ', then ')
      when v_count = 0 then ' · no extensions so far'
      else '' end;
  when 'complaints' then
    if p_view -> 'complaints' is null or p_view -> 'complaints' = 'null'::jsonb then
      return null;
    end if;
    return (p_view -> 'complaints' ->> 'count_24m') || ' · ' || (p_view -> 'complaints' ->> 'per_100_units') || ' per 100 units';
  when 'commute' then
    return (core.editorial('phase', v_phase_id, 'getting_around')).body ->> 'commute';
  when 'top_reason' then
    if v_withheld then
      return 'Band withheld · facts only';
    elsif not (p_view ->> 'show_band')::boolean then
      return null;
    end if;
    return (select sr.text from core.score_reasons sr where sr.run_id = (p_view ->> 'run_id')::uuid order by sr.rank limit 1);
  when 'track_record' then
    v_tr := core.group_track_record((p_view ->> 'group_id')::uuid);
    if v_tr is null then
      return null;
    elsif coalesce((v_tr ->> 'finished')::integer, 0) = 0 then
      return 'No finished RERA project yet';
    end if;
    return (v_tr ->> 'late') || ' of ' || (v_tr ->> 'finished') || ' finished projects got OC more than 12 months late';
  when 'pending' then
    return core.compare_pending_cell(p_view);
  else
    return null;
  end case;
end
$$;
comment on function core.compare_cell(jsonb, text) is 'One Compare cell for a phase, or null (shown as "Not in our records yet").';

create function core.compare_row(p_views jsonb, p_key text, p_label text, p_source_line text)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select pg_catalog.jsonb_build_object(
      'key', p_key, 'label', p_label, 'source_line', p_source_line,
      'cells', pg_catalog.jsonb_agg(coalesce(core.compare_cell(v, p_key), 'Not in our records yet') order by ord))
    || case when p_key = 'pending' then pg_catalog.jsonb_build_object('developer_says', pg_catalog.jsonb_agg((
         select core.developer_says_for_fact(f.id) ->> 'line'
         from core.qpr_filings q
         join core.facts f on f.subject_type = 'registration' and f.subject_id = q.registration_id
           and f.attribute = 'qpr.missing' and f.value ->> 'quarter' = q.quarter
           and f.superseded_by is null and f.learned_at <= ops.now()
         where q.registration_id = (v ->> 'reg_id')::uuid and q.status = 'missing' and q.due_on <= ops.today()
           and core.developer_says_for_fact(f.id) is not null
         order by q.quarter desc limit 1) order by ord)) else '{}'::jsonb end
  from pg_catalog.jsonb_array_elements(p_views) with ordinality as e(v, ord)
$$;
comment on function core.compare_row(jsonb, text, text, text) is 'A Compare row {key, label, source_line, cells}; the pending row adds what each developer says about it.';
comment on function core.compare_json(uuid[]) is 'plinth.compare/1 (API_CONTRACTS §4.5): 2–4 phases side by side, 3 BHK on each, every row naming its source; blanks say "Not in our records yet".';

-- ---------------------------------------------------------------------------
-- Methodology (API_CONTRACTS §3.1; WebMethodology)
-- ---------------------------------------------------------------------------
create function core.methodology_json()
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_model core.score_models%rowtype := core.current_model();
  v_base jsonb := core.base_rate();
  v_city text := 'Gurugram';
  v_bands jsonb;
  v_example jsonb;
  v_example_id uuid;
  v_blanket core.blanket_extensions%rowtype;
  v_afford jsonb;
  v_rf jsonb;
  v_rf_example text;
  v_cal jsonb;
  v_versions jsonb;
  v_views jsonb;
begin
  select pg_catalog.jsonb_agg(core.phase_view(l.id)) into v_views from core.listed_phase_ids() as l(id);

  -- Each band, its natural frequency and an example phase in it today.
  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'code', b.code, 'label', core.band_label(b.code), 'step', core.band_step(b.code),
           'low', (b.r ->> 'low')::integer, 'high', (b.r ->> 'high')::integer,
           'sentence', 'Between ' || (b.r ->> 'low') || ' and ' || (b.r ->> 'high') || ' of 100 similar ' || v_city
             || ' projects got their OC more than 12 months after the original RERA date.',
           'example_slug', (
             select v ->> 'slug' from pg_catalog.jsonb_array_elements(coalesce(v_views, '[]'::jsonb)) v
             where (v ->> 'show_band')::boolean and v ->> 'band' = b.code
             order by (v ->> 'confidence' = 'high') desc nulls last, v ->> 'slug' limit 1))
         order by core.band_step(b.code))
    into v_bands
  from pg_catalog.jsonb_each(v_model.config -> 'band_ranges') as b(code, r);

  -- The worked Late12 example: the example phase of the band that holds the base rate.
  select (v ->> 'id')::uuid into v_example_id
  from pg_catalog.jsonb_array_elements(coalesce(v_views, '[]'::jsonb)) v
  where (v ->> 'show_band')::boolean
    and v ->> 'slug' = (select x ->> 'example_slug' from pg_catalog.jsonb_array_elements(v_bands) x
                        where (x ->> 'low')::numeric <= (v_base ->> 'per_100')::numeric
                          and (x ->> 'high')::numeric >= (v_base ->> 'per_100')::numeric
                        order by (x ->> 'step')::integer limit 1);
  if v_example_id is not null then
    v_example := pg_catalog.jsonb_build_object('slug', (select p.slug from core.phases p where p.id = v_example_id))
      || core.risk_late12((core.phase_registration(v_example_id)).id, coalesce((v_model.config ->> 'blanket_extensions')::boolean, true));
    v_afford := core.afford_the_wait(v_example_id, null);
  end if;
  select * into v_blanket from core.blanket_extensions b where b.advisory_on <= ops.today() order by b.advisory_on desc limit 1;

  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'code', r.code, 'n', pg_catalog.substring(r.code, '^RF(\d+)')::integer,
           -- The published rule text is "<title>. <how it applies>".
           'title', pg_catalog.split_part(r.text, '. ', 1),
           'line', pg_catalog.substr(r.text, pg_catalog.length(pg_catalog.split_part(r.text, '. ', 1)) + 3)) order by pg_catalog.substring(r.code, '^RF(\d+)')::integer)
    into v_rf
  from core.red_flag_rules r;

  -- A red-flag example from the records: a phase whose band a rule set.
  select 'Example: ' || (v ->> 'name') || coalesce(', ' || (v ->> 'sector_name'), '') || '. A group company of '
      || (v ->> 'group_name') || ' was admitted to insolvency by ' || coalesce(f.value ->> 'forum', 'NCLT') || ' order of '
      || core.fmt_loose_date(f.value ->> 'order_on') || '.'
    into v_rf_example
  from pg_catalog.jsonb_array_elements(coalesce(v_views, '[]'::jsonb)) v
  join core.red_flags rf on rf.rule_code = v ->> 'rule_code' and rf.cleared_on is null
  join core.facts f on f.id = rf.fact_ids[1]
  where (v ->> 'show_band')::boolean and v ->> 'set_by' = 'red_flag_rule' and v ->> 'rule_code' = 'RF1_GROUP_CIRP'
  order by v ->> 'slug' limit 1;

  select pg_catalog.jsonb_build_object(
           'illustrative', coalesce(pg_catalog.bool_or(c.illustrative), false),
           'rows', pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
             'band', c.band, 'label', core.band_label(c.band), 'range_low', pg_catalog.trim_scale(c.range_low),
             'range_high', pg_catalog.trim_scale(c.range_high), 'n_projects', c.n_projects, 'n_late', c.n_late,
             'per_100', pg_catalog.trim_scale(c.per_100)) order by core.band_step(c.band)),
           'base_rate', v_base,
           'brier', pg_catalog.trim_scale(pg_catalog.max(c.brier)),
           'brier_baseline', pg_catalog.trim_scale(pg_catalog.max(c.brier_baseline)))
    into v_cal
  from core.calibration c where c.model_version = v_model.version;

  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'version', m.version, 'released_on', m.released_on,
           'title', (pg_catalog.string_to_array(m.changelog, E'\n'))[1],
           'items', pg_catalog.to_jsonb(coalesce((pg_catalog.string_to_array(m.changelog, E'\n'))
              [2:greatest(pg_catalog.cardinality(pg_catalog.string_to_array(m.changelog, E'\n')) - 1, 1)], '{}'::text[])),
           'note', case when pg_catalog.cardinality(pg_catalog.string_to_array(m.changelog, E'\n')) > 2
             then (pg_catalog.string_to_array(m.changelog, E'\n'))[pg_catalog.cardinality(pg_catalog.string_to_array(m.changelog, E'\n'))] end,
           'current', m.version = v_model.version) order by m.released_on desc)
    into v_versions
  from core.score_models m where m.released_on <= ops.today();

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.methodology/1',
    'current_version', v_model.version,
    'published_on', v_model.released_on,
    'question_line', 'One question for every RERA phase in ' || v_city || ': will the OC arrive more than 12 months late?',
    'bands', v_bands,
    'bands_note_line', case when (v_cal ->> 'illustrative')::boolean
      then 'Ranges are provisional until our first calibration backtest is published.' end,
    'similar_line', v_city || ' RERA phases registered 2017–2021, of comparable size, by developers with a comparable '
      || 'number of finished projects.',
    'late12', pg_catalog.jsonb_build_object(
      'line', 'Whether a phase gets its OC more than 12 months after its original RERA date. We call this Late12.',
      'extensions_line', 'We add extensions given to every project, such as COVID'
        || coalesce(' and the ' || v_blanket.months || '-month MoHUA extension of ' || ops.fmt_month(v_blanket.advisory_on), '')
        || '. We don''t add extensions granted to one project. Those are part of the delay we predict.',
      'example', v_example),
    'factors', (
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
               'factor', f.key, 'label', core.factor_label(f.key), 'weight_pct', (f.value #>> '{}')::integer)
             order by (f.value #>> '{}')::integer desc,
               pg_catalog.array_position(array['finances', 'track_record', 'timeline', 'legal', 'site'], f.key))
      from pg_catalog.jsonb_each(v_model.config -> 'factor_weights') as f),
    'factors_note_line', 'These are starting weights. We refit them after each backtest and publish the change.',
    'how_line', 'Red-flag rules come first. Then an interpretable scorecard adds up the five groups. Each score lists up '
      || 'to 4 reasons, ranked by how much they moved it. No AI ever sets a score.',
    'red_flag_rules', coalesce(v_rf, '[]'::jsonb),
    'red_flag_example_line', v_rf_example,
    'confidence', pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('level', 'high', 'dots', 2, 'line', 'We''re more certain about this one. Many comparable '
        || 'finished projects, in ' || v_city || ' and in this group, so the range we show is narrow.'),
      pg_catalog.jsonb_build_object('level', 'low', 'dots', 1, 'line', 'We''re less certain about this one. Fewer comparable '
        || 'projects, so we show a wider range. The uncertain part is hatched.'),
      pg_catalog.jsonb_build_object('level', 'limited_history', 'dots', 0, 'line', 'Not enough history to score · no penalty. '
        || 'We score a group once it has ' || coalesce(v_model.config -> 'limited_history' ->> 'min_finished', '3')
        || ' finished RERA projects.'),
      pg_catalog.jsonb_build_object('level', 'not_scored', 'dots', 0, 'line', 'Not scored: we always say why on the card, '
        || 'for example registered less than ' || coalesce(v_model.config -> 'not_scored' ->> 'min_months_registered', '6')
        || ' months ago.')),
    'data_rules', pg_catalog.jsonb_build_object(
      'rescore_hours', (v_model.config ->> 'rescore_hours')::integer,
      'stale_days', (v_model.config ->> 'stale_days')::integer,
      'line', 'We recompute within ' || (v_model.config ->> 'rescore_hours') || ' hours of a new filing or order. Data more '
        || 'than ' || (v_model.config ->> 'stale_days') || ' days old gets a stale flag.'),
    'calibration', v_cal,
    'versions', coalesce(v_versions, '[]'::jsonb),
    'how_we_worked_this_out', pg_catalog.jsonb_build_object('afford_the_wait', case when v_afford is not null then
      pg_catalog.jsonb_build_array(
        'We round the all-in to the nearest ₹1 lakh before any loan arithmetic: '
          || ops.fmt_inr_exact(core.all_in(v_example_id)) || ' becomes '
          || ops.fmt_inr_exact((v_afford -> 'loan' ->> 'all_in_rounded_inr')::bigint) || '.',
        'The bank pays out in step with the payment plan, after your down payment. The paid-out share rises in equal '
          || 'monthly steps from ' || (v_afford -> 'series' -> 0 ->> 'paid_out_pct') || '% in '
          || ops.fmt_month(((v_afford -> 'series' -> 0 ->> 'month') || '-01')::date) || ' to '
          || (select s ->> 'paid_out_pct' from pg_catalog.jsonb_array_elements(v_afford -> 'series') s
              where not (s ->> 'delay')::boolean order by s ->> 'month' desc limit 1) || '% in '
          || pg_catalog.replace(v_afford -> 'by_completion' ->> 'label', 'By ', '') || '.',
        'Pre-EMI is interest only on what the bank has paid out. Each month''s outgo is pre-EMI plus your rent.',
        'If keys come late, the ' || pg_catalog.replace(v_afford -> 'by_completion' ->> 'label', 'By ', '')
          || ' outgo carries on. A delay costs the number of months times that outgo.',
        'RERA s.18 interest for delay is left out: HARERA orders take months.')
      else '[]'::jsonb end),
    'never_line', 'No developer pays us. Ever. And no one can pay to change, hide, delay or preview a score.',
    'meta', pg_catalog.jsonb_build_object(
      'data_as_of', core.data_as_of(),
      'model_version', v_model.version,
      'generated_at', core.fmt_timestamp(ops.now()),
      'disclaimer_line', 'Our opinion, based on public records. Not a credit rating. Not issued by any RERA.',
      'promise_line', 'No developer pays us. Ever.')
  );
end
$$;
comment on function core.methodology_json() is 'plinth.methodology/1: the question, the bands with natural frequencies and an example each, Late12 with a worked example, factor weights (score_models.config), red-flag rules, confidence states, data rules, the calibration table and base rate, the changelog, and how Afford the wait is worked out.';

-- ---------------------------------------------------------------------------
-- About (WebAbout): who we are, the calibration table, money, response times, coverage
-- ---------------------------------------------------------------------------
create function core.about_json()
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_model core.score_models%rowtype := core.current_model();
  v_base jsonb := core.base_rate();
  v_rows jsonb;
  v_illustrative boolean;
  v_brier numeric;
  v_baseline numeric;
begin
  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'band', c.band, 'label', core.band_label(c.band), 'said_low', pg_catalog.trim_scale(c.range_low),
           'said_high', pg_catalog.trim_scale(c.range_high), 'n_projects', c.n_projects, 'n_late', c.n_late,
           'per_100', pg_catalog.trim_scale(c.per_100),
           'inside_range', c.per_100 between c.range_low and c.range_high) order by core.band_step(c.band)),
         pg_catalog.bool_or(c.illustrative), pg_catalog.max(c.brier), pg_catalog.max(c.brier_baseline)
    into v_rows, v_illustrative, v_brier, v_baseline
  from core.calibration c where c.model_version = v_model.version;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.about/1',
    'identity', pg_catalog.jsonb_build_object(
      'placeholder_note', 'Founder details are placeholders until the founder supplies them.',
      'photo_line', 'A real photo, supplied by the founder. Never AI-generated.',
      'register', pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('label', 'Company', 'value', '[COMPANY NAME] Private Limited'),
        pg_catalog.jsonb_build_object('label', 'Company number', 'value', 'CIN [CIN]'),
        pg_catalog.jsonb_build_object('label', 'Registered office', 'value', '[REGISTERED ADDRESS], Gurugram, Haryana [PIN]'),
        pg_catalog.jsonb_build_object('label', 'GST', 'value', 'GSTIN [GSTIN]'),
        pg_catalog.jsonb_build_object('label', 'Founder and director', 'value', '[FOUNDER NAME]'),
        pg_catalog.jsonb_build_object('label', 'Who funds us', 'value', '[FUNDING: the founder, or investor names]. No '
          || 'developer owns any part of Plinth, and none ever will.'),
        pg_catalog.jsonb_build_object('label', 'HARERA agent number', 'value', 'None yet. We don''t broker any sale.'))),
    'calibration', pg_catalog.jsonb_build_object(
      'pill', case when v_illustrative then 'Illustrative numbers' end,
      'rows', coalesce(v_rows, '[]'::jsonb),
      'base_rate', v_base || pg_catalog.jsonb_build_object(
        'line', 'About ' || (v_base ->> 'per_100') || ' of 100 past Gurugram projects got their OC more than 12 months '
          || 'late (' || (v_base ->> 'n_late') || ' of ' || (v_base ->> 'n_projects') || ').'),
      'brier_line', 'With a Brier score: ' || core.fmt_num(v_brier) || ' on these ' || (v_base ->> 'n_projects')
        || ' projects. Lower is better. Saying “' || (v_base ->> 'per_100') || ' of 100” for every project would score '
        || core.fmt_num(v_baseline) || '.',
      'first_public_bands_on', (select pg_catalog.min(m.released_on) from core.score_models m)),
    'money', pg_catalog.jsonb_build_object(
      'never_line', 'No developer pays us. Ever.',
      'lines', pg_catalog.jsonb_build_array(
        'Pro: ₹999 per project · 12 months of written updates. Alerts are always free.',
        'Loans: Loan checks arrive in 2027. No lender pays us in R1.',
        'Agents: a published fee split, only when you choose them.')),
    'response_times', pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('what', 'Report an error, from any page', 'promise_line', 'We answer within 15 working days.', 'ref_prefix', 'E'),
      pg_catalog.jsonb_build_object('what', 'Clerical fix, for developers', 'promise_line', 'Fix in 2 working days.', 'ref_prefix', 'CL'),
      pg_catalog.jsonb_build_object('what', 'Grievance', 'promise_line', 'Acknowledge in 24 hours. Resolve in 7 days.', 'ref_prefix', 'G'),
      pg_catalog.jsonb_build_object('what', 'Download my data', 'promise_line', 'Ready within 24 hours; the link works for 7 days.', 'ref_prefix', null)),
    'grievance', pg_catalog.jsonb_build_object(
      'officer', '[NAME]', 'contact', '[GRIEVANCE EMAIL]',
      'line', 'We acknowledge within 24 hours and resolve within 7 days.'),
    'coverage', pg_catalog.jsonb_build_object(
      'today', pg_catalog.jsonb_build_object(
        'line', 'Gurugram today.',
        'items', pg_catalog.jsonb_build_array(
          'Gurugram, under-construction RERA projects on Dwarka Expressway and in New Gurugram.')),
      'next', pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('name', 'Golf Course Extension Road', 'when_line', 'Planned for Dec 2026', 'notify', true),
        pg_catalog.jsonb_build_object('name', 'Loans', 'when_line', 'Loan checks arrive in 2027', 'notify', true),
        pg_catalog.jsonb_build_object('name', 'Resale and transfer checks', 'when_line', 'R2 · planned for Apr–Jun 2027', 'notify', true),
        pg_catalog.jsonb_build_object('name', 'Help at possession: OC, final demand, delay interest',
          'when_line', 'R3 · planned for Jul–Sep 2027', 'notify', true),
        pg_catalog.jsonb_build_object('name', 'Noida and Greater Noida West', 'when_line', 'R3 · planned for Jul–Sep 2027', 'notify', true))),
    'meta', pg_catalog.jsonb_build_object(
      'data_as_of', core.data_as_of(),
      'generated_at', core.fmt_timestamp(ops.now()),
      'promise_line', 'No developer pays us. Ever.',
      'disclaimer_line', 'Our opinion, based on public records. Not a credit rating. Not issued by any RERA.')
  );
end
$$;
comment on function core.about_json() is 'plinth.about/1 (WebAbout): the identity register (founder placeholders until supplied), the calibration table with the base rate and Brier scores, how we make money (never from developers; "Loan checks arrive in 2027"), response times, the grievance officer and coverage today and next.';

-- ---------------------------------------------------------------------------
-- The evidence drawer in a page's context (T12 → T13: the optional p_slug)
-- ---------------------------------------------------------------------------
create function core.evidence_in_context(p_fact_id uuid, p_phase_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_out jsonb := core.evidence_json(p_fact_id);
  v_run_id uuid;
  v_used jsonb;
  v_section text;
begin
  if v_out is null or p_phase_id is null then
    return v_out;
  end if;
  -- Name the reasons of the phase the drawer was opened from, where buyers see that band.
  select r.id into v_run_id from core.published_run(p_phase_id) r
  where r.id is not null and core.phase_shows_band(p_phase_id);
  select coalesce(pg_catalog.jsonb_agg('Reason ' || sr.rank || ' of Delivery risk' order by sr.rank), '[]'::jsonb)
    into v_used
  from core.score_reasons sr
  where sr.run_id = v_run_id and p_fact_id = any (sr.fact_ids);
  select x into v_section
  from pg_catalog.jsonb_array_elements_text(v_out -> 'used_in') as x
  where x !~ '^Reason \d+ of '
  limit 1;
  if v_section is not null then
    v_used := v_used || pg_catalog.to_jsonb(v_section);
  end if;
  return v_out || pg_catalog.jsonb_build_object('used_in', v_used);
end
$$;
comment on function core.evidence_in_context(uuid, uuid) is 'plinth.evidence/1 for a fact as seen from one phase''s page: used_in names that phase''s reasons (a group fact cited by two phases names the reason on the page it was opened from).';

-- ---------------------------------------------------------------------------
-- Lockdown sweep (T04 pattern, BUILD_PLAN §12.1), then the explicit api grants.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
grant execute on function api.risk_summary(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text) to anon, authenticated, service_role;
