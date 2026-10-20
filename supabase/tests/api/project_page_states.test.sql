-- T13 · the project page in its display states (API_CONTRACTS §2.2; DATA_MODEL §12 inv. 8):
-- facts-only (the group's facts_only_since, CONFLICTS C-23: the expected --facts-only design
-- state) and bands not public (bands_public off). Band, frequency and reasons are withheld
-- everywhere on the page; every record stays.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

create function pg_temp.t13_strings(p jsonb) returns setof text language sql immutable as $$
  select v #>> '{}' from jsonb_path_query(p, 'lax $.**') v where jsonb_typeof(v) = 'string'
$$;
create temp table t13_st (k text primary key, j jsonb);
grant all on t13_st to public;

-- Facts-only: Northfield's bands withheld from 18 Oct 2026 (design state) ---------------------------
update core.developer_groups
set facts_only_since = '2026-10-18',
    facts_only_line = 'We''re not showing a band for this project while a court considers an application about our bands for the Northfield Estates group.'
where slug = 'northfield-estates';

set local role anon;
insert into t13_st select 'fo_aurelia', api.project_page('aurelia-heights-phase-2');
insert into t13_st select 'fo_kestrel', api.project_page('kestrel-park');
reset role;

select is(
  (select j -> 'hero' ->> 'summary_line' from t13_st where k = 'fo_aurelia'),
  'Band withheld pending review, from 18 Oct 2026 · All-in ₹2.74 Cr · 41% built · Original completion Dec 2027',
  'facts-only: the hero says the band is withheld and keeps the facts'
);
select is((select j -> 'risk' -> 'chip' ->> 'kind' from t13_st where k = 'fo_aurelia'), 'withheld', 'facts-only: the chip is withheld');
select ok(
  (select bool_and(q -> 'band_then' = 'null'::jsonb) from t13_st, jsonb_array_elements(j -> 'progress' -> 'quarters') q where k = 'fo_aurelia')
  and (select j -> 'progress' -> 'today' ->> 'band' is null from t13_st where k = 'fo_aurelia'),
  'facts-only: the replay shows no band, then or today'
);
select is((select j -> 'next_steps' ->> 'intro_line' from t13_st where k = 'fo_aurelia'),
  'Facts-only mode changes nothing about your rights. These are the records we keep watching.',
  'facts-only: next steps are the records we keep watching');
select is((select j -> 'next_steps' -> 'steps' -> 0 from t13_st where k = 'fo_aurelia'),
  '{"heading": "The Jul–Sep 2026 QPR", "body": "Due 15 Oct 2026, not on HARERA yet.", "source_label": "HARERA QPR register"}'::jsonb,
  'facts-only: the missing QPR is still on the page');
select is((select j -> 'afford_default' ->> 'frequency_line' from t13_st where k = 'fo_aurelia'), null,
  'facts-only: Afford the wait keeps its arithmetic and drops the band''s frequency');
select is((select (j -> 'cost' ->> 'all_in_inr')::bigint from t13_st where k = 'fo_aurelia'), 27400400::bigint,
  'facts-only: the cost breakdown is unchanged');
select is((select jsonb_array_length(j -> 'records') from t13_st where k = 'fo_aurelia'), 16, 'facts-only: every record stays');
select ok(
  not exists (select 1 from t13_st, pg_temp.t13_strings(j - 'risk') s
              where k = 'fo_aurelia' and (s ilike '%elevated%' or s ilike '%between 30 and 45%' or s ilike '%sits around%')),
  'facts-only: no band, frequency or band comparison anywhere on the page'
);
select is((select j -> 'next_steps' -> 'lower_band_nearby' from t13_st where k = 'fo_kestrel'), '[]'::jsonb,
  'another group''s phase keeps its band (Kestrel, Low) but Aurelia is no longer a lower-band comparison');
select is((select j -> 'hero' ->> 'summary_line' from t13_st where k = 'fo_kestrel'),
  'Delivery risk: Low · All-in ₹2.44 Cr · 63% built · Original completion Nov 2028',
  'facts-only is per group: Kestrel is unchanged');

-- Bands not public (S1, bands_public off) -----------------------------------------------------------
update core.developer_groups set facts_only_since = null, facts_only_line = null where slug = 'northfield-estates';
update ops.feature_flags set enabled = false where key = 'bands_public';
set local role anon;
insert into t13_st select 'off_aurelia', api.project_page('aurelia-heights-phase-2');
insert into t13_st select 'off_kestrel', api.project_page('kestrel-park');
reset role;

select is((select j -> 'hero' ->> 'summary_line' from t13_st where k = 'off_aurelia'),
  'Delivery risk: facts only for now · All-in ₹2.74 Cr · 41% built · Original completion Dec 2027',
  'bands off: the hero says facts only for now');
select is((select j -> 'risk' -> 'chip' ->> 'label' from t13_st where k = 'off_kestrel'), 'Facts only · bands not published yet',
  'bands off: the chip');
select is((select j -> 'next_steps' ->> 'intro_line' from t13_st where k = 'off_kestrel'),
  'Bands are not published yet. These are the records we keep watching.', 'bands off: next steps watch the records');
select ok(
  not exists (select 1 from t13_st, pg_temp.t13_strings(j - 'risk') s
              where k like 'off_%' and (s in ('Low', 'Elevated') or s ilike '%of 100 similar%' or s ilike '% sits %')),
  'bands off: no band, frequency or comparison anywhere'
);

select * from finish();
rollback;
