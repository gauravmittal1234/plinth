-- T13 · api.methodology (API_CONTRACTS §3.1; WebMethodology): factor weights from the model's
-- config (pipelines/plinth/scoring/models/v1.2.yaml), bands with natural frequencies and an
-- example each, Late12, red-flag rules, the calibration table (36 of 100, 76/212) and the changelog.
begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

select ok(to_regprocedure('api.methodology()') is not null, 'api.methodology() exists');
select ok(
  (select prosecdef and provolatile = 's' from pg_catalog.pg_proc where oid = 'api.methodology()'::regprocedure)
    and has_function_privilege('anon', 'api.methodology()', 'EXECUTE')
    and not exists (select 1 from aclexplode((select proacl from pg_catalog.pg_proc where oid = 'api.methodology()'::regprocedure)) a
                    where a.grantee = 0),
  'SECURITY DEFINER, STABLE, executable by anon and not by PUBLIC'
);

create temp table t13_m (j jsonb);
grant all on t13_m to public;
set local role anon;
insert into t13_m select api.methodology();
reset role;

select is((select j ->> 'current_version' from t13_m), 'v1.2', 'the current model is v1.2');
select is(
  (select array_agg((f ->> 'factor') || ' ' || (f ->> 'weight_pct') order by o) from t13_m, jsonb_array_elements(j -> 'factors') with ordinality as x(f, o)),
  array['finances 30', 'track_record 30', 'timeline 20', 'legal 15', 'site 5'],
  'factor weights 30/30/20/15/5, from score_models.config (the v1.2 scorecard''s spreads)');
select is(
  (select jsonb_object_agg(f ->> 'factor', (f ->> 'weight_pct')::int) from t13_m, jsonb_array_elements(j -> 'factors') f),
  (select config -> 'factor_weights' from core.score_models where version = 'v1.2'),
  'the weights are the published model''s, not copied into the page');
select is(
  (select array_agg((b ->> 'code') || ':' || (b ->> 'example_slug') order by o) from t13_m, jsonb_array_elements(j -> 'bands') with ordinality as x(b, o)),
  array['low:kestrel-park', 'moderate:sapphire-grove-phase-1', 'elevated:aurelia-heights-phase-2', 'high:coral-towers', 'severe:laurel-residency'],
  'five bands, each with an example phase in it today');
select is((select j -> 'bands' -> 2 ->> 'sentence' from t13_m),
  'Between 30 and 45 of 100 similar Gurugram projects got their OC more than 12 months after the original RERA date.',
  'each band as a natural frequency');
select is((select j -> 'late12' -> 'example' ->> 'late_after' from t13_m), '2029-04', 'Late12: Aurelia, an OC after Apr 2029');
select is((select j -> 'calibration' -> 'base_rate' from t13_m), '{"n_projects": 212, "n_late": 76, "per_100": 36}'::jsonb,
  'the base rate: 36 of 100 (76 of 212)');
select is((select j -> 'calibration' -> 'rows' -> 1 ->> 'per_100' from t13_m), '31', 'Moderate: 31 of 100 in the backtest');
select is((select j -> 'red_flag_rules' -> 0 ->> 'title' from t13_m),
  'Insolvency (CIRP) admitted against the promoter or a group company', 'red-flag rule 1, by its published title');
select is((select j ->> 'red_flag_example_line' from t13_m),
  'Example: Laurel Residency, Sector 92. A group company of Elmstone Developers was admitted to insolvency by NCLT order of 12 Mar 2023.',
  'the red-flag example comes from the records');
select is((select array_agg(v ->> 'version' order by o) from t13_m, jsonb_array_elements(j -> 'versions') with ordinality as x(v, o)),
  array['v1.2', 'v1.1', 'v1.0'], 'the changelog, newest first');
select is((select j -> 'how_we_worked_this_out' -> 'afford_the_wait' ->> 0 from t13_m),
  'We round the all-in to the nearest ₹1 lakh before any loan arithmetic: ₹2,74,00,400 becomes ₹2,74,00,000.',
  'how Afford the wait is worked out, on the example''s own numbers');

select * from finish();
rollback;
