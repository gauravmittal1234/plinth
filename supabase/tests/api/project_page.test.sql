-- T13 · api.project_page on the §5b seed (API_CONTRACTS §4.2; DATA_MODEL §12 inv. 2, 8).
-- Grants; the risk block is api.risk_summary; Aurelia's hero, truth panel, replay, homes,
-- From the developer, cost, Afford the wait, next steps (the lower-band-nearby rule) and
-- before booking ("Loan checks arrive in 2027"); the other phases' variants; the evidence
-- drawer opened from a page (p_slug); errors. The deep comparison with
-- packages/fixtures/expected is `npm run -w @plinth/fixtures test:api` (ci-db runs both).
begin;
create extension if not exists pgtap with schema extensions;
select plan(55);

-- The function and its grants --------------------------------------------------------------
select ok(to_regprocedure('api.project_page(text)') is not null, 'api.project_page(text) exists');
select ok(
  (select prosecdef and provolatile = 's' and prorettype = 'jsonb'::regtype
   from pg_catalog.pg_proc where oid = 'api.project_page(text)'::regprocedure),
  'it is SECURITY DEFINER, STABLE and returns jsonb'
);
select ok(
  has_function_privilege('anon', 'api.project_page(text)', 'EXECUTE')
    and has_function_privilege('authenticated', 'api.project_page(text)', 'EXECUTE')
    and has_function_privilege('service_role', 'api.project_page(text)', 'EXECUTE'),
  'anon, authenticated and service_role may execute it'
);
select ok(
  not exists (
    select 1 from aclexplode((select proacl from pg_catalog.pg_proc where oid = 'api.project_page(text)'::regprocedure)) a
    where a.grantee = 0),
  'EXECUTE is never granted to PUBLIC'
);
select is(
  (select array_agg(p.proname::text order by p.proname)
   from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'core'
     and p.proname in ('project_page_json', 'phase_view', 'all_in', 'afford_the_wait', 'cost_breakdown_json', 'editorial')
     and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE'))),
  null::text[],
  'the core helpers behind it stay private'
);

-- Every seeded phase, read as anon -----------------------------------------------------------
create temp table t13_pp (slug text primary key, j jsonb, rs jsonb);
grant all on t13_pp to public;
set local role anon;
select set_config('request.jwt.claims', '', true);
insert into t13_pp
select s.slug, api.project_page(s.slug), api.risk_summary(s.slug)
from (values ('aurelia-heights-phase-2'), ('kestrel-park'), ('sapphire-grove-phase-1'), ('coral-towers'),
             ('laurel-residency'), ('juniper-enclave'), ('heron-point-phase-2'), ('cedar-walk-phase-2')) as s(slug);
reset role;

select is((select count(*)::int from t13_pp where j ->> 'schema' = 'plinth.project_page/1'), 8, 'anon reads all 8 seeded project pages');
select is((select count(*)::int from t13_pp where j -> 'risk' = rs), 8, 'each page''s risk block is exactly api.risk_summary');
select is((select count(*)::int from t13_pp where j -> 'meta' = rs -> 'meta'), 8, 'meta is the risk summary''s meta');

-- Aurelia Heights, Phase 2 -----------------------------------------------------------------------
select is(
  (select j -> 'hero' ->> 'summary_line' from t13_pp where slug = 'aurelia-heights-phase-2'),
  'Delivery risk: Elevated · All-in ₹2.74 Cr · 41% built · Original completion Dec 2027',
  'Aurelia: the hero summary line'
);
select is(
  (select j -> 'hero' -> 'rera_badge' from t13_pp where slug = 'aurelia-heights-phase-2'),
  '{"number": "GGM/673/405/2022/117", "authority_url": "https://haryanarera.gov.in", "qr_url": null}'::jsonb,
  'Aurelia: the RERA badge'
);
select is(
  (select array_agg(t ->> 'value_line' order by o) from t13_pp, jsonb_array_elements(j -> 'truth_panel') with ordinality as x(t, o)
   where slug = 'aurelia-heights-phase-2'),
  array['Dec 2027 · no extensions', '41% built · 77% of time used', '14 complaints · 2.8 per 100 units',
        'Peepal Bank, Golf Course Road · ending 4417'],
  'Aurelia: the truth panel'
);
select is(
  (select j -> 'progress' -> 'towers' from t13_pp where slug = 'aurelia-heights-phase-2'),
  '["A", "B", "C"]'::jsonb,
  'Aurelia: towers A, B and C on the replay'
);
select is(
  (select jsonb_array_length(j -> 'progress' -> 'quarters') from t13_pp where slug = 'aurelia-heights-phase-2'),
  8,
  'Aurelia: the 8 §5b quarters with figures (no invented quarters)'
);
select ok(
  (select bool_and(q ->> 'band_then' = 'moderate') from t13_pp, jsonb_array_elements(j -> 'progress' -> 'quarters') q
   where slug = 'aurelia-heights-phase-2'),
  'the replay never shows Elevated before the Jun 2026 stop'
);
select is(
  (select j -> 'progress' -> 'today' from t13_pp where slug = 'aurelia-heights-phase-2'),
  '{"time_used_pct": 77, "band": "elevated", "band_since_line": "Elevated since 2 Oct 2026"}'::jsonb,
  'Aurelia: today, Elevated since 2 Oct 2026'
);
select is(
  (select q -> 'towers' from t13_pp, jsonb_array_elements(j -> 'progress' -> 'quarters') q
   where slug = 'aurelia-heights-phase-2' and q ->> 'quarter' = '2026-Q2'),
  '{"A": 9, "B": 7, "C": 5}'::jsonb,
  'Aurelia: Apr–Jun 2026, Tower A at slab 9'
);
select is(
  (select q ->> 'note_line' from t13_pp, jsonb_array_elements(j -> 'progress' -> 'quarters') q
   where slug = 'aurelia-heights-phase-2' and q ->> 'quarter' = '2026-Q2'),
  'Filed 15 Jul 2026, on time. A demand for slab 12 went out on 10 Oct 2026.',
  'Aurelia: the latest QPR notes the demand ahead of the filings'
);
select is(
  (select j -> 'progress' ->> 'late_filings_line' from t13_pp where slug = 'aurelia-heights-phase-2'),
  'Filed late: Jul–Sep 2024 (12 days), Jan–Mar 2025 (41 days) and Oct–Dec 2025 (38 days).',
  'Aurelia: the late filings from the QPR register'
);
select is(
  (select j -> 'homes' ->> 'units_line' from t13_pp where slug = 'aurelia-heights-phase-2'),
  'Towers A, B and C, 20 floors each, with 500 homes in Phase 2. Latest QPR: Tower A at slab 9, Tower B at slab 7, Tower C at slab 5.',
  'Aurelia: towers and units'
);
select is(
  (select c - 'rooms' from t13_pp, jsonb_array_elements(j -> 'homes' -> 'configurations') c
   where slug = 'aurelia-heights-phase-2' and c ->> 'label' = '4 BHK'),
  '{"label": "4 BHK", "carpet_line": "2,100 sq ft carpet", "carpet_lane": "records_show", "super_line": null,
    "super_lane": null, "loading_line": null, "price_line": "From ₹3.38 Cr", "price_lane": "from_developer",
    "all_in_line": null, "all_in_note": "No 4 BHK cost sheet, so no all-in yet."}'::jsonb,
  'Aurelia: a 4 BHK without a cost sheet says so instead of guessing an all-in'
);
select is(
  (select j -> 'homes' -> 'getting_around' ->> 'source_line' from t13_pp where slug = 'aurelia-heights-phase-2'),
  'Our estimate · road distances, Oct 2026',
  'Aurelia: getting around is Plinth''s estimate, dated'
);
select is(
  (select j -> 'homes' -> 'waterlogging' ->> 'note_line' from t13_pp where slug = 'aurelia-heights-phase-2'),
  'Reported, not verified by Plinth. No report names the Aurelia site itself.',
  'Aurelia: waterlogging is reported, not verified'
);
select is(
  (select array_agg(l ->> 'label' order by o) from t13_pp, jsonb_array_elements(j -> 'from_developer' -> 'price_lists') with ordinality as x(l, o)
   where slug = 'aurelia-heights-phase-2'),
  array['2 Oct 2026', '1 Apr 2026', '1 Jul 2025', 'Launch, Jan 2023'],
  'Aurelia: every dated price list, newest first'
);
select is(
  (select jsonb_array_length(j -> 'from_developer' -> 'payment_plan' -> 'stages') from t13_pp where slug = 'aurelia-heights-phase-2'),
  13,
  'Aurelia: the 13-stage construction-linked plan'
);
select is(
  (select sum((s ->> 'pct')::numeric) from t13_pp, jsonb_array_elements(j -> 'from_developer' -> 'payment_plan' -> 'stages') s
   where slug = 'aurelia-heights-phase-2'),
  100::numeric,
  'Aurelia: the stages add up to 100%'
);
select is(
  (select j -> 'from_developer' -> 'payment_plan' ->> 'by_tower_line' from t13_pp where slug = 'aurelia-heights-phase-2'),
  'Booking today, by registration you would pay 52.5% in Tower A, 45% in Tower B and 37.5% in Tower C.',
  'Aurelia: what is due by registration, per tower'
);
select is(
  (select (j -> 'cost' ->> 'all_in_inr')::bigint from t13_pp where slug = 'aurelia-heights-phase-2'),
  27400400::bigint,
  'Aurelia: cost all-in ₹2,74,00,400'
);
select is(
  (select j -> 'afford_default' -> 'now' from t13_pp where slug = 'aurelia-heights-phase-2'),
  '{"monthly_inr": 118077, "share_pct": 26}'::jsonb,
  'Aurelia: Afford the wait at the defaults, ₹1,18,077 a month now'
);
select is(
  (select j -> 'wait_defaults' from t13_pp where slug = 'aurelia-heights-phase-2'),
  '{"take_home_inr": 450000, "rent_inr": 55000, "down_pct": 20, "rate_pct": 8.5, "tenure_years": 20}'::jsonb,
  'the §5b defaults'
);
select is(
  (select array_agg(n ->> 'slug' order by o) from t13_pp, jsonb_array_elements(j -> 'next_steps' -> 'lower_band_nearby') with ordinality as x(n, o)
   where slug = 'aurelia-heights-phase-2'),
  array['kestrel-park', 'sapphire-grove-phase-1'],
  'lower band nearby: same corridor, lower band, all-in within 20%, lowest band first'
);
select is(
  (select j -> 'next_steps' -> 'steps' -> 2 ->> 'body' from t13_pp where slug = 'aurelia-heights-phase-2'),
  'If keys come 12 months after Dec 2027, rent and pre-EMI cost about ₹24.1 L more on our default loan.',
  'Elevated: the rent buffer step uses Afford the wait''s 12-month delay'
);
select is(
  (select j -> 'next_steps' ->> 'base_rate_line' from t13_pp where slug = 'aurelia-heights-phase-2'),
  'About 36 of 100 Gurugram projects got their OC more than 12 months late. Elevated sits around that.',
  'the base rate, and where the band sits against it'
);
select is(
  (select j -> 'before_booking' -> 'loans' ->> 'line' from t13_pp where slug = 'aurelia-heights-phase-2'),
  'Loan checks arrive in 2027',
  'loans: "Loan checks arrive in 2027"'
);
select is(
  (select j -> 'before_booking' -> 'loans' -> 'paras' -> 2 from t13_pp where slug = 'aurelia-heights-phase-2'),
  '{"lead": "Developer says · brochure, 2 Oct 2026 · not verified:", "text": "“Approved by major banks.”", "tone": "developer_says"}'::jsonb,
  'the brochure''s lender claim is a Developer says line, not a record'
);
select is(
  (select r ->> 'chip' from t13_pp, jsonb_array_elements(j -> 'records') r
   where slug = 'aurelia-heights-phase-2' and r ->> 'fact_id' = 'bc3ff166-6be3-5805-8401-0dbd4260c1ea'),
  'HARERA QPR register · 18 Oct 2026',
  'records: the missing Jul–Sep 2026 QPR, as of today'
);
select is(
  (select count(*)::int from t13_pp, jsonb_array_elements(j -> 'records') r
   where slug = 'aurelia-heights-phase-2' and r ->> 'evidence_url' = '/evidence/' || (r ->> 'fact_id')),
  16,
  'records: 16 public facts, each opening its evidence drawer'
);

-- The other phases ---------------------------------------------------------------------------------
select is(
  (select array_agg(j -> 'hero' ->> 'summary_line' order by slug) from t13_pp
   where slug in ('coral-towers', 'heron-point-phase-2', 'juniper-enclave', 'laurel-residency', 'sapphire-grove-phase-1')),
  array[
    'Delivery risk: High · Stale data, progress 187 days old · 22% built · Original completion Aug 2028, extended to Aug 2029',
    'Delivery risk: Not scored yet · Registered Apr 2026 · Original completion Apr 2031',
    'Delivery risk: Limited history, not enough history to score · no penalty · 9% built · 31% of the time used · Original completion Dec 2029',
    'Delivery risk: Severe, set by a published rule · Stall flag · 34% built · Original completion Jun 2026, passed',
    'Delivery risk: Moderate, re-scoring now · 48% built · 55% of the time used · Original completion Mar 2028'],
  'the hero line names the state and the overlay instead of a price where they matter'
);
select is(
  (select count(*)::int from t13_pp where slug <> 'aurelia-heights-phase-2' and j -> 'cost' = 'null'::jsonb and j -> 'afford_default' = 'null'::jsonb),
  7,
  'without a cost sheet and a payment plan: no cost breakdown and no Afford the wait'
);
select is(
  (select j -> 'next_steps' ->> 'intro_line' from t13_pp where slug = 'heron-point-phase-2'),
  'Not scored yet. These are the records to read.',
  'Heron Point: not scored, so the records to read instead of steps by band'
);
select is(
  (select j -> 'next_steps' -> 'steps' -> 0 ->> 'body' from t13_pp where slug = 'heron-point-phase-2'),
  '2 of 6 finished projects late. Its ongoing phases: Aurelia Heights, Phase 2 (Elevated) and Cedar Walk, Phase 2 (Moderate).',
  'Heron Point: the group''s record and its ongoing phases'
);
select is(
  (select j -> 'next_steps' -> 'steps' -> 3 ->> 'body' from t13_pp where slug = 'juniper-enclave'),
  '9% built with 31% of the time used. Watch that the gap doesn''t widen.',
  'Juniper: limited history reads progress against time'
);
select is(
  (select j -> 'progress' -> 'quarters' from t13_pp where slug = 'heron-point-phase-2'),
  '[]'::jsonb,
  'Heron Point: no QPR yet, so no quarters'
);
select ok(
  (select bool_and(j -> 'pre_rera' <> 'null'::jsonb) from t13_pp
   where slug in ('aurelia-heights-phase-2', 'heron-point-phase-2', 'cedar-walk-phase-2'))
  and (select bool_and(j -> 'pre_rera' = 'null'::jsonb) from t13_pp
       where slug not in ('aurelia-heights-phase-2', 'heron-point-phase-2', 'cedar-walk-phase-2')),
  'pre-RERA shows on Northfield''s phases only'
);
select is(
  (select j -> 'pre_rera' ->> 'line' from t13_pp where slug = 'cedar-walk-phase-2'),
  'None of this counts in the band.',
  'pre-RERA never counts in the band'
);

-- The firewall: a pending notice''s band never appears ---------------------------------------------
create function pg_temp.t13_strings(p jsonb) returns setof text language sql immutable as $$
  select v #>> '{}' from jsonb_path_query(p, 'lax $.**') v where jsonb_typeof(v) = 'string'
$$;
select ok(
  not exists (select 1 from t13_pp, pg_temp.t13_strings(j) s
              where slug = 'aurelia-heights-phase-2' and (s = 'high' or s ilike '%between 45 and 65%' or s = '13e27e23-1998-5ccd-b886-36c8f74cee46')),
  'Aurelia: the pending notice''s High band, frequency and run never appear on the page'
);

-- The evidence drawer opened from a page (optional p_slug) ----------------------------------------
select ok(to_regprocedure('api.evidence(text, text)') is not null and to_regprocedure('api.evidence(text)') is not null,
  'api.evidence keeps its one-argument form and gains (p_fact_id, p_slug)');
select ok(
  has_function_privilege('anon', 'api.evidence(text, text)', 'EXECUTE')
    and not exists (
      select 1 from aclexplode((select proacl from pg_catalog.pg_proc where oid = 'api.evidence(text, text)'::regprocedure)) a
      where a.grantee = 0),
  'anon may execute api.evidence(text, text); PUBLIC may not'
);
set local role anon;
select is(
  api.evidence('145c288f-31dd-5955-9677-170f82ffd80c', 'cedar-walk-phase-2') -> 'used_in',
  '["Reason 2 of Delivery risk", "Developer track record"]'::jsonb,
  'a group fact opened from Cedar Walk, Phase 2 names Cedar Walk''s reason'
);
select is(
  api.evidence('145c288f-31dd-5955-9677-170f82ffd80c', 'aurelia-heights-phase-2') -> 'used_in',
  '["Reason 4 of Delivery risk", "Developer track record"]'::jsonb,
  'the same fact opened from Aurelia names Aurelia''s reason'
);
select is(
  api.evidence('145c288f-31dd-5955-9677-170f82ffd80c', 'aurelia-heights-phase-2') - 'used_in',
  api.evidence('145c288f-31dd-5955-9677-170f82ffd80c') - 'used_in',
  'everything else in the drawer is the same as without p_slug'
);
select throws_ok($$select api.evidence('145c288f-31dd-5955-9677-170f82ffd80c', 'no-such-project')$$, 'PT404', 'not_found',
  'an unknown page is not_found');
reset role;

-- Errors ---------------------------------------------------------------------------------------------
select throws_ok($$select api.project_page('no-such-project')$$, 'PT404', 'not_found', 'an unknown slug is not_found');
select throws_ok($$select api.project_page('aurelia-heights-phase-1')$$, 'PT404', 'not_found',
  'a finished phase without a published run has no project page');
select throws_ok($$select api.project_page('')$$, 'PT422', 'invalid_input', 'an empty slug is invalid_input');
select throws_ok($$select api.project_page(null)$$, 'PT422', 'invalid_input', 'a null slug is invalid_input');

select * from finish();
rollback;
