-- T13 · api.compare (API_CONTRACTS §4.5): 2–4 phases side by side, every row naming its source,
-- the pending block with what the developer says, "Band withheld · facts only" cells, errors.
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

select ok(to_regprocedure('api.compare(text[])') is not null, 'api.compare(text[]) exists');
select ok(
  (select prosecdef and provolatile = 's' from pg_catalog.pg_proc where oid = 'api.compare(text[])'::regprocedure)
    and has_function_privilege('anon', 'api.compare(text[])', 'EXECUTE')
    and not exists (select 1 from aclexplode((select proacl from pg_catalog.pg_proc where oid = 'api.compare(text[])'::regprocedure)) a
                    where a.grantee = 0),
  'SECURITY DEFINER, STABLE, executable by anon and not by PUBLIC'
);

create temp table t13_cmp (k text primary key, j jsonb);
grant all on t13_cmp to public;
set local role anon;
insert into t13_cmp values
  ('four', api.compare(array['aurelia-heights-phase-2', 'kestrel-park', 'sapphire-grove-phase-1', 'coral-towers'])),
  ('mixed', api.compare(array['Laurel-Residency', 'juniper-enclave', 'heron-point-phase-2']));
reset role;

create function pg_temp.t13_row(p jsonb, p_key text) returns jsonb language sql immutable as $$
  select r from jsonb_array_elements(p -> 'rows') r where r ->> 'key' = p_key
$$;

select is((select array_agg(c ->> 'slug' order by o) from t13_cmp, jsonb_array_elements(j -> 'columns') with ordinality as x(c, o) where k = 'four'),
  array['aurelia-heights-phase-2', 'kestrel-park', 'sapphire-grove-phase-1', 'coral-towers'], 'columns keep the order asked for');
select ok((select bool_and(r ->> 'source_line' <> '') from t13_cmp, jsonb_array_elements(j -> 'rows') r where k = 'four'),
  'every row names its source');
select is((select pg_temp.t13_row(j, 'frequency') -> 'cells' from t13_cmp where k = 'four'),
  '["Between 30 and 45 were more than 12 months late", "About 10 were more than 12 months late", "About 20 were more than 12 months late", "Between 45 and 65 were more than 12 months late"]'::jsonb,
  'natural frequencies, never percentages');
select is((select pg_temp.t13_row(j, 'pending') -> 'cells' ->> 3 from t13_cmp where k = 'four'),
  'Apr–Jun and Jul–Sep 2026 QPRs not on HARERA yet · progress 187 days old', 'Coral: progress 187 days old');
select is((select pg_temp.t13_row(j, 'pending') -> 'cells' ->> 0 from t13_cmp where k = 'four'),
  'Jul–Sep 2026 QPR not on HARERA yet (due 15 Oct)', 'Aurelia: the pending QPR line');
select is((select pg_temp.t13_row(j, 'pending') -> 'developer_says' from t13_cmp where k = 'four'),
  '["Developer says: filed 12 Oct, not yet verified.", null, null, null]'::jsonb, 'what the developer says sits beside it, as a claim');
select is((select pg_temp.t13_row(j, 'pending') -> 'cells' ->> 2 from t13_cmp where k = 'four'),
  'Jul–Sep 2026 QPR filed 15 Oct 2026 · re-score due by 19 Oct 2026, 7:40 pm', 'Sapphire: the re-score window');
select is((select pg_temp.t13_row(j, 'complaints') -> 'cells' ->> 3 from t13_cmp where k = 'four'), 'Not in our records yet',
  'a blank cell says "Not in our records yet" rather than guess');
select is((select pg_temp.t13_row(j, 'carpet') ->> 'source_line' from t13_cmp where k = 'four'),
  'HARERA registration (Aurelia) · developer price lists, Oct 2026', 'the carpet row names both its sources');
select is((select pg_temp.t13_row(j, 'frequency') -> 'cells' from t13_cmp where k = 'mixed'),
  '["Set by a published red-flag rule", "Not in our records yet", "Not in our records yet"]'::jsonb,
  'a red-flag band has no frequency; unscored phases have none either');

-- Facts-only cells ---------------------------------------------------------------------------------------
update core.developer_groups set facts_only_since = '2026-10-18' where slug = 'northfield-estates';
set local role anon;
insert into t13_cmp select 'facts_only', api.compare(array['aurelia-heights-phase-2', 'kestrel-park']);
reset role;
select is((select pg_temp.t13_row(j, 'frequency') -> 'cells' ->> 0 from t13_cmp where k = 'facts_only'), 'Band withheld · facts only',
  'facts-only: "Band withheld · facts only"');
select is((select j -> 'columns' -> 0 -> 'chip' ->> 'label' from t13_cmp where k = 'facts_only'), 'Band withheld · facts only',
  'facts-only: the column chip is withheld');

-- Errors ---------------------------------------------------------------------------------------------------
select throws_ok($$select api.compare(array['kestrel-park'])$$, 'PT422', 'invalid_input', 'one project is not a comparison');
select throws_ok($$select api.compare(array['kestrel-park', 'KESTREL-PARK'])$$, 'PT422', 'invalid_input',
  'the same project twice is not a comparison');
select throws_ok($$select api.compare(array['kestrel-park', 'no-such-project'])$$, 'PT404', 'not_found', 'an unknown project is not_found');

select * from finish();
rollback;
