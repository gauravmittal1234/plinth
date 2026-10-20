-- T13 · api.about (API_CONTRACTS §3.1; WebAbout): the identity register with founder
-- placeholders, the calibration table with the "Illustrative numbers" pill, money (never from
-- developers; "Loan checks arrive in 2027"), response times and coverage.
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

select ok(to_regprocedure('api.about()') is not null, 'api.about() exists');
select ok(
  (select prosecdef and provolatile = 's' from pg_catalog.pg_proc where oid = 'api.about()'::regprocedure)
    and has_function_privilege('anon', 'api.about()', 'EXECUTE')
    and not exists (select 1 from aclexplode((select proacl from pg_catalog.pg_proc where oid = 'api.about()'::regprocedure)) a
                    where a.grantee = 0),
  'SECURITY DEFINER, STABLE, executable by anon and not by PUBLIC'
);

create temp table t13_a (j jsonb);
grant all on t13_a to public;
set local role anon;
insert into t13_a select api.about();
reset role;

select is((select j -> 'identity' ->> 'photo_line' from t13_a), 'A real photo, supplied by the founder. Never AI-generated.',
  'the founder placeholder, never an AI face');
select is((select j -> 'calibration' ->> 'pill' from t13_a), 'Illustrative numbers', 'the calibration is labelled illustrative');
select is((select j -> 'calibration' -> 'base_rate' ->> 'line' from t13_a),
  'About 36 of 100 past Gurugram projects got their OC more than 12 months late (76 of 212).', 'the base rate, 36 of 100 (76/212)');
select is((select r -> 'inside_range' from t13_a, jsonb_array_elements(j -> 'calibration' -> 'rows') r where r ->> 'band' = 'moderate'),
  'false'::jsonb, 'Moderate said 15–30 and was 31: shown, not hidden');
select is((select j -> 'calibration' ->> 'brier_line' from t13_a),
  'With a Brier score: 0.19 on these 212 projects. Lower is better. Saying “36 of 100” for every project would score 0.23.',
  'the Brier score against the base rate');
select is((select j -> 'calibration' ->> 'first_public_bands_on' from t13_a), '2026-07-15', 'first public bands: 15 Jul 2026 (v1.0)');
select is((select j -> 'money' ->> 'never_line' from t13_a), 'No developer pays us. Ever.', 'no developer pays us');
select ok((select j -> 'money' -> 'lines' ? 'Loans: Loan checks arrive in 2027. No lender pays us in R1.' from t13_a),
  'loans: "Loan checks arrive in 2027", no lender paid in R1');

select * from finish();
rollback;
