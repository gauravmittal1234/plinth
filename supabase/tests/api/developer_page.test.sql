-- T13 · api.developer_page on the §5b seed (API_CONTRACTS §4.4; DATA_MODEL §12 inv. 8).
-- Grants; Northfield (claimed, verified signatory, the promised-vs-actual track record, the
-- signed group reply, complaints with the units base); invited groups; a new developer; the
-- facts-only mode; errors.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

select ok(to_regprocedure('api.developer_page(text)') is not null, 'api.developer_page(text) exists');
select ok(
  (select prosecdef and provolatile = 's' from pg_catalog.pg_proc where oid = 'api.developer_page(text)'::regprocedure),
  'it is SECURITY DEFINER and STABLE'
);
select ok(
  has_function_privilege('anon', 'api.developer_page(text)', 'EXECUTE')
    and has_function_privilege('authenticated', 'api.developer_page(text)', 'EXECUTE')
    and not exists (
      select 1 from aclexplode((select proacl from pg_catalog.pg_proc where oid = 'api.developer_page(text)'::regprocedure)) a
      where a.grantee = 0),
  'anon and authenticated may execute it; PUBLIC may not'
);

create temp table t13_dp (slug text primary key, j jsonb);
grant all on t13_dp to public;
set local role anon;
insert into t13_dp
select s.slug, api.developer_page(s.slug)
from (values ('northfield-estates'), ('orbis-land'), ('meridian-habitat'), ('vantage-buildcon'), ('elmstone-developers'),
             ('halcyon-homes'), ('ashgrove-realty')) as s(slug);
reset role;
select is((select count(*)::int from t13_dp where j ->> 'schema' = 'plinth.developer_page/1'), 7, 'anon reads every group''s page');

-- Northfield Estates ----------------------------------------------------------------------------------
select is((select j -> 'group' -> 'claim' from t13_dp where slug = 'northfield-estates'),
  '{"state": "claimed", "line": "Claimed by Northfield · verified signatory", "since": "2025-12-02"}'::jsonb,
  'Northfield: claimed by a verified signatory');
select is((select j ->> 'summary_line' from t13_dp where slug = 'northfield-estates'),
  'A developer group of 9 linked companies. 2 of its 6 finished projects got OC more than 12 months late. 3 projects are ongoing.',
  'Northfield: the summary line');
select is((select j -> 'track_record' ->> 'line' from t13_dp where slug = 'northfield-estates'),
  '2 of the group''s 6 finished RERA projects got OC more than 12 months late.', 'the track record line');
select is(
  (select array_agg((p ->> 'slug') || ':' || (p ->> 'months_late') || ':' || (p ->> 'late') order by o)
   from t13_dp, jsonb_array_elements(j -> 'track_record' -> 'projects') with ordinality as x(p, o) where slug = 'northfield-estates'),
  array['cedar-walk:-2:false', 'aurelia-heights-phase-1:27:true', 'wren-court:11:false', 'opaline-residences:11:false',
        'heron-point-phase-1:27:true', 'linden-square:9:false'],
  'promised vs actual: 6 finished projects by promised date, 2 more than 12 months late'
);
select is(
  (select p ->> 'line' from t13_dp, jsonb_array_elements(j -> 'track_record' -> 'projects') p
   where slug = 'northfield-estates' and p ->> 'slug' = 'aurelia-heights-phase-1'),
  'OC came 27 months after the original RERA date. That is 21 months after the 6-month COVID extension.',
  'Aurelia Heights, Phase 1: 27 months late, and the COVID extension noted'
);
select is(
  (select array_agg(o ->> 'slug' order by n) from t13_dp, jsonb_array_elements(j -> 'ongoing') with ordinality as x(o, n)
   where slug = 'northfield-estates'),
  array['aurelia-heights-phase-2', 'heron-point-phase-2', 'cedar-walk-phase-2'],
  'ongoing: open items first (a missing QPR, a phase waiting for reports), then by risk'
);
select is((select j -> 'complaints' ->> 'line_24m' from t13_dp where slug = 'northfield-estates'),
  '24 decided against the group, or 0.7 per 100 units.', 'complaints: count and rate together');
select is((select j -> 'complaints' ->> 'units_line' from t13_dp where slug = 'northfield-estates'),
  'Per 100 units uses the units in the group''s RERA registrations: 2,980 until Dec 2025, and 3,400 since Heron Point, Phase 2 was registered in Apr 2026.',
  'complaints: the units base and when it changed');
select is((select j ->> 'insolvency_line' from t13_dp where slug = 'northfield-estates'),
  'No insolvency found (checked 14 Oct 2026).', 'insolvency: none found, with the check date');
select is((select j -> 'reply' ->> 'signed_line' from t13_dp where slug = 'northfield-estates'),
  'Ananya Rao, authorised signatory, Northfield Estates', 'the group reply is signed by name');
select is((select j -> 'reply' ->> 'records_line' from t13_dp where slug = 'northfield-estates'),
  'Heron Point, Phase 1 got OC in Jun 2025, 27 months after its original RERA date.', 'the reply sits next to the record it answers');
select is((select jsonb_array_length(j -> 'how_buyers_find_you' -> 'rules') from t13_dp where slug = 'northfield-estates'), 3,
  'the three ranking rules');

-- Other groups ------------------------------------------------------------------------------------------
select is((select j -> 'group' -> 'claim' ->> 'line' from t13_dp where slug = 'vantage-buildcon'),
  'invited 24 Nov 2025 · not yet claimed', 'not claimed: "invited 24 Nov 2025 · not yet claimed", never "uncooperative"');
select is((select j -> 'group' -> 'claim' ->> 'line' from t13_dp where slug = 'orbis-land'),
  'Claimed developer page · replies here', 'claimed without a verified signatory');
select is((select j -> 'track_record' ->> 'line' from t13_dp where slug = 'halcyon-homes'),
  'Halcyon Homes is a new developer with no finished RERA project yet. We don''t guess, and it never counts against them.',
  'a new developer: no track record, no penalty');
select is((select j ->> 'insolvency_line' from t13_dp where slug = 'elmstone-developers'),
  'A group company of Elmstone Developers was admitted to insolvency by NCLT order on 12 Mar 2023.', 'Elmstone: the NCLT order');
select is((select j -> 'track_record' from t13_dp where slug = 'vantage-buildcon'),
  '{"finished": null, "late": null, "line": null, "projects": [], "sources": []}'::jsonb,
  'no track record with us: nothing invented');
select is((select j -> 'ongoing' from t13_dp where slug = 'ashgrove-realty'), '[]'::jsonb, 'Ashgrove: no project with us yet');

-- Facts-only (design state, CONFLICTS C-23) ---------------------------------------------------------
update core.developer_groups set facts_only_since = '2026-10-18' where slug = 'northfield-estates';
set local role anon;
insert into t13_dp select 'fo', api.developer_page('northfield-estates');
reset role;
select is((select j -> 'group' ->> 'mode' from t13_dp where slug = 'fo'), 'facts_only', 'facts-only: the page mode');
select ok(
  (select bool_and(o -> 'chip' ->> 'label' = 'Band withheld · facts only' and o ->> 'state' = 'facts_only')
   from t13_dp, jsonb_array_elements(j -> 'ongoing') o where slug = 'fo'),
  'facts-only: "Band withheld · facts only" on every project chip'
);
select is((select j -> 'track_record' from t13_dp where slug = 'fo'),
  (select j -> 'track_record' from t13_dp where slug = 'northfield-estates'), 'facts-only: every record stays');

-- Errors ------------------------------------------------------------------------------------------------
select throws_ok($$select api.developer_page('no-such-group')$$, 'PT404', 'not_found', 'an unknown group is not_found');
select throws_ok($$select api.developer_page(' ')$$, 'PT422', 'invalid_input', 'a blank slug is invalid_input');

select * from finish();
rollback;
