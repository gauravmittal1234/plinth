-- T13 · api.search_projects and api.suggest (API_CONTRACTS §3.1, §4.3; WORK_BREAKDOWN T13:
-- deterministic parsing of BHK, budget "2.5 cr", corridor synonyms and typos via pg_trgm; "Low
-- keeps Low and Moderate" with the hidden count; facts-only phases kept in results).
begin;
create extension if not exists pgtap with schema extensions;
select plan(42);

-- Functions, defaults and grants -----------------------------------------------------------------------
select ok(to_regprocedure('api.search_projects(text, jsonb, text, jsonb, text, integer)') is not null,
  'api.search_projects(p_q, p_filters, p_sort, p_bbox, p_cursor, p_limit) exists');
select is(
  (select pronargdefaults::int from pg_catalog.pg_proc where oid = 'api.search_projects(text, jsonb, text, jsonb, text, integer)'::regprocedure),
  6, 'every argument has a SQL default (clients send only what the buyer set)');
select ok(to_regprocedure('api.suggest(text)') is not null, 'api.suggest(text) exists');
select ok(
  (select bool_and(prosecdef and provolatile = 's') from pg_catalog.pg_proc
   where oid in ('api.search_projects(text, jsonb, text, jsonb, text, integer)'::regprocedure, 'api.suggest(text)'::regprocedure)),
  'both are SECURITY DEFINER and STABLE');
select ok(
  has_function_privilege('anon', 'api.search_projects(text, jsonb, text, jsonb, text, integer)', 'EXECUTE')
    and has_function_privilege('anon', 'api.suggest(text)', 'EXECUTE')
    and not exists (
      select 1 from pg_catalog.pg_proc p, aclexplode(p.proacl) a
      where p.oid in ('api.search_projects(text, jsonb, text, jsonb, text, integer)'::regprocedure, 'api.suggest(text)'::regprocedure)
        and a.grantee = 0),
  'anon may execute both; PUBLIC may not');

create temp table t13_s (k text primary key, j jsonb);
grant all on t13_s to public;
set local role anon;
insert into t13_s values
  ('none', api.search_projects()),
  ('canonical', api.search_projects(p_q => '3 bhk dwarka expresway under 2.5 cr low risk')),
  ('zero', api.search_projects(p_q => '4 bhk dwarka expressway low risk')),
  ('unknown', api.search_projects(p_q => 'Indigo Terraces')),
  ('noida', api.search_projects(p_q => '3 bhk noida')),
  ('name', api.search_projects(p_q => 'kestrel')),
  ('synonym', api.search_projects(p_q => 'flats in new gurgaon under 2 cr')),
  ('lakh', api.search_projects(p_q => '2bhk below 160 lakh')),
  ('filters', api.search_projects(p_filters => '{"bhk": [3], "bands": ["low", "moderate"]}'::jsonb)),
  ('page1', api.search_projects(p_limit => 3)),
  ('page2', api.search_projects(p_limit => 3, p_cursor => 'o:3')),
  ('price', api.search_projects(p_sort => 'lowest_all_in')),
  ('bbox', api.search_projects(p_bbox => '[76.9, 28.40, 76.96, 28.43]'::jsonb));
reset role;

-- Parsing ------------------------------------------------------------------------------------------------
select is((select j -> 'parsed' from t13_s where k = 'canonical'),
  '{"bhk": [3], "all_in_max_inr": 25000000, "corridors": ["dwarka-expressway"], "bands": ["low", "moderate"]}'::jsonb,
  '"3 bhk dwarka expresway under 2.5 cr low risk": BHK, budget, the corridor despite the typo, Low and Moderate');
select is((select j -> 'parsed' ->> 'corridors' from t13_s where k = 'synonym'), '["new-gurugram"]', '"new gurgaon" is New Gurugram (synonym)');
select is((select (j -> 'parsed' ->> 'all_in_max_inr')::bigint from t13_s where k = 'synonym'), 20000000::bigint, '"under 2 cr" is ₹2 Cr');
select is((select j -> 'parsed' from t13_s where k = 'lakh') - 'corridors' - 'bands',
  '{"bhk": [2], "all_in_max_inr": 16000000}'::jsonb, '"2bhk below 160 lakh"');
select is((select j -> 'parsed' from t13_s where k = 'none'), '{}'::jsonb, 'no query: nothing parsed');
select is((select j -> 'parsed' from t13_s where k = 'filters'),
  '{"bhk": [3], "all_in_max_inr": null, "corridors": null, "bands": ["low", "moderate"]}'::jsonb, 'structured filters are used as given');

-- The canonical search (INTEGRATION_NOTES: Kestrel, Cedar Walk Ph 2, Sapphire, Juniper; 2 hidden) ----
select is(
  (select array_agg(i ->> 'slug' order by o) from t13_s, jsonb_array_elements(j -> 'items') with ordinality as x(i, o) where k = 'canonical'),
  array['kestrel-park', 'cedar-walk-phase-2', 'sapphire-grove-phase-1', 'juniper-enclave'],
  'canonical: Kestrel, Cedar Walk Ph 2, Sapphire and Juniper, lowest delivery risk first');
select is((select (j ->> 'hidden_count')::int from t13_s where k = 'canonical'), 2, 'canonical: 2 projects hidden');
select is((select j -> 'hidden' from t13_s where k = 'canonical'),
  '[{"slug": "aurelia-heights-phase-2", "name": "Aurelia Heights, Phase 2", "why_line": "quoted ₹2.35 Cr, but ₹2.74 Cr all-in · delivery risk Elevated"},
    {"slug": "heron-point-phase-2", "name": "Heron Point, Phase 2", "why_line": "no price list with us"}]'::jsonb,
  'every hidden project says why (the all-in, not the quoted price, is what the budget checks)');
select is((select j -> 'notes' from t13_s where k = 'canonical'),
  '["“Low delivery risk” shows Low and Moderate.", "2 projects hidden by your filters."]'::jsonb,
  '"Low keeps Low and Moderate", and the hidden count');
select is((select j -> 'items' -> 0 ->> 'price_line' from t13_s where k = 'canonical'), '₹2.44 Cr all-in · quoted ₹2.10 Cr',
  'Kestrel: all-in first, then the quoted price');
select is((select j ->> 'sort_line' from t13_s where k = 'canonical'), 'Sorted by lowest delivery risk. Order never follows money.',
  'order never follows money');
select is((select j -> 'items' -> 0 -> 'centroid' from t13_s where k = 'canonical'), '[77.034, 28.527]'::jsonb,
  'the sector pin as [lng, lat]');

-- Zero results, unknown project, outside coverage ---------------------------------------------------------
select is((select j -> 'zero_results' -> 'action' from t13_s where k = 'zero'),
  '{"kind": "drop_filter", "label": "Risk: add Elevated", "drop": "bands", "brings_back": ["aurelia-heights-phase-2"]}'::jsonb,
  '4 BHK on Dwarka Expressway, low risk: nothing fits; adding Elevated brings Aurelia back');
select is((select j -> 'zero_results' ->> 'detail_line' from t13_s where k = 'zero'),
  'It''s the only Dwarka Expressway project here with a 4 BHK: 2,100 sq ft carpet, quoted from ₹3.38 Cr, all-in not known yet. Its delivery risk is Elevated.',
  'the zero-results guidance names what Aurelia has and misses');
select is((select (j ->> 'hidden_count')::int from t13_s where k = 'zero'), 6, 'zero results still count what was hidden');
select is((select j -> 'zero_results' ->> 'line' from t13_s where k = 'unknown'),
  'We can''t find Indigo Terraces in our records. If it has a Gurugram RERA number, we''ll add it by 1 Nov 2026 or tell you why not.',
  'an unknown project: we add it within 14 days or say why not');
select is((select j -> 'zero_results' ->> 'kind' from t13_s where k = 'noida'), 'outside_coverage', 'Noida is outside coverage');
select is((select j -> 'parsed' from t13_s where k = 'noida'), '{"bhk": [3], "place": "noida"}'::jsonb, 'and we never guess a Noida result');

-- Names, sorting, pagination, the map box ----------------------------------------------------------------
select is((select j -> 'items' -> 0 ->> 'slug' from t13_s where k = 'name'), 'kestrel-park', 'a project name finds that project');
select is((select jsonb_array_length(j -> 'items') from t13_s where k = 'none'), 8, 'no filters: all 8 phases');
select is(
  (select array_agg(i ->> 'slug' order by o) from t13_s, jsonb_array_elements(j -> 'items') with ordinality as x(i, o) where k = 'none'),
  array['kestrel-park', 'cedar-walk-phase-2', 'sapphire-grove-phase-1', 'aurelia-heights-phase-2', 'coral-towers', 'laurel-residency',
        'juniper-enclave', 'heron-point-phase-2'],
  'Low → Severe, then limited history, then not scored');
select is((select j ->> 'next_cursor' from t13_s where k = 'page1'), 'o:3', 'a page of 3 has a next cursor');
select is(
  (select array_agg(i ->> 'slug' order by o) from t13_s, jsonb_array_elements(j -> 'items') with ordinality as x(i, o) where k = 'page2'),
  array['aurelia-heights-phase-2', 'coral-towers', 'laurel-residency'], 'the next page continues the order');
select is((select j -> 'items' -> 0 ->> 'slug' from t13_s where k = 'price'), 'laurel-residency',
  'lowest all-in sort (Laurel quoted ₹1.48 Cr)');
select is(
  (select array_agg(i ->> 'slug' order by i ->> 'slug') from t13_s, jsonb_array_elements(j -> 'items') i where k = 'bbox'),
  array['coral-towers', 'laurel-residency'], 'the map box keeps the pins inside it');
select throws_ok($$select api.search_projects(p_limit => 51)$$, 'PT422', 'invalid_input', 'at most 50 per page');
select throws_ok($$select api.search_projects(p_sort => 'promoted_first')$$, 'PT422', 'invalid_input', 'no paid or unknown sort order');

-- Facts-only phases stay in risk-filtered results, listed with Not scored ones, never hidden ----------
update core.developer_groups set facts_only_since = '2026-10-18' where slug = 'northfield-estates';
set local role anon;
insert into t13_s select 'facts_only', api.search_projects(p_q => 'dwarka expressway low risk');
reset role;
select ok(
  (select bool_and(i -> 'chip' ->> 'kind' = 'withheld') from t13_s, jsonb_array_elements(j -> 'items') i
   where k = 'facts_only' and i ->> 'slug' in ('aurelia-heights-phase-2', 'cedar-walk-phase-2')),
  'facts-only phases are in the low-risk results, with the withheld chip');
select is((select (j ->> 'hidden_count')::int from t13_s where k = 'facts_only'), 0, 'and nothing is hidden for its band');

-- Suggest ---------------------------------------------------------------------------------------------------
set local role anon;
insert into t13_s values
  ('s_aure', api.suggest('aure')), ('s_typo', api.suggest('aurelia hieghts')), ('s_rera', api.suggest('GGM/781/513')),
  ('s_sector', api.suggest('sector 37d')), ('s_group', api.suggest('northfield')), ('s_a', api.suggest('a'));
reset role;
select is((select j -> 'items' -> 0 from t13_s where k = 's_aure'),
  '{"kind": "phase", "slug": "aurelia-heights-phase-2", "label": "Aurelia Heights, Phase 2", "detail_line": "Sector 37D, Dwarka Expressway · GGM/673/405/2022/117", "matched_on": "name"}'::jsonb,
  '"aure" suggests Aurelia first');
select is((select j -> 'items' -> 0 ->> 'slug' from t13_s where k = 's_typo'), 'aurelia-heights-phase-2', 'typo-tolerant (pg_trgm)');
select is((select j -> 'items' -> 0 ->> 'matched_on' from t13_s where k = 's_rera'), 'rera_number', 'by RERA number');
select is((select j -> 'items' -> 0 ->> 'slug' from t13_s where k = 's_sector'), 'sector-37d', 'by sector');
select is((select j -> 'items' -> 0 ->> 'kind' from t13_s where k = 's_group'), 'developer', 'developer groups too');
select ok((select jsonb_array_length(j -> 'items') <= 8 from t13_s where k = 's_a'), 'never more than 8');
select throws_ok($$select api.suggest('')$$, 'PT422', 'invalid_input', 'an empty query is invalid_input');

select * from finish();
rollback;
