-- T39 · M1 exit gate, database side (BUILD_PLAN §3 "M1: Know the builder"; WORK_BREAKDOWN T39).
--
-- What already proves an M1 item, and is not repeated here:
--   - Deep-equal of every expected/<fn>/<key>.json for risk_summary, project_page,
--     developer_page, search_projects and compare: `npm run -w @plinth/fixtures test:api`,
--     run by ci-db on Supabase Postgres 17 after the clock freeze (36/36 deep-equal).
--   - The seeded bands and Aurelia's band history: tests/seed/002_scoring.test.sql.
--   - S1 field by field for Aurelia, Laurel and Juniper: tests/api/risk_summary_states.test.sql;
--     the project page with bands off for Aurelia and Kestrel: tests/api/project_page_states.test.sql.
--   - Snapshot immutability on a synthetic snapshot: tests/core/003_immutability.test.sql.
--
-- What this file adds:
--   1. The frozen clock and the 8 seeded phases the deep-equal runs over, and `meta.generated_at`
--      equal to the frozen clock in every M1 read (the contract tests skip that field).
--   2. One contract: the RiskSummary inside project_page, and the chips in search, compare and
--      the developer page, equal api.risk_summary for the same phase.
--   3. S1 (bands_public = false) across every M1 read, not only risk_summary and project_page:
--      no band, frequency, confidence, reasons or what-would-change anywhere in risk_summary and
--      project_page (all 8 phases), search_projects, compare and developer_page (all 6
--      developers). The facts stay. The leak detector is checked against the bands-on payloads.
--   4. The seeded HARERA, DTCP and IBBI snapshots are fixtures (no live fetch) and immutable.
begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

create temp table m1_reads (w text, fn text, k text, j jsonb);
grant all on m1_reads to public;

-- The 8 seeded phases (DESIGN §5b; @plinth/fixtures PHASE_SLUGS) and their 6 developers.
create function pg_temp.m1_phases() returns text[] language sql immutable as $$
  select array['aurelia-heights-phase-2', 'cedar-walk-phase-2', 'coral-towers', 'heron-point-phase-2',
               'juniper-enclave', 'kestrel-park', 'laurel-residency', 'sapphire-grove-phase-1']
$$;
create function pg_temp.m1_developers() returns text[] language sql immutable as $$
  select array['elmstone-developers', 'halcyon-homes', 'meridian-habitat', 'northfield-estates',
               'orbis-land', 'vantage-buildcon']
$$;
-- The 6 phases with a band (Juniper is limited history, Heron Point is not scored).
create function pg_temp.m1_scored() returns text[] language sql immutable as $$
  select array['aurelia-heights-phase-2', 'cedar-walk-phase-2', 'coral-towers', 'kestrel-park',
               'laurel-residency', 'sapphire-grove-phase-1']
$$;

-- Every M1 read an anonymous visitor makes, with the request arguments of
-- packages/fixtures/expected/<fn>/_requests.json. `w` names the flag state.
create function pg_temp.m1_fill(p_w text) returns void language plpgsql as $$
declare
  v_phases text[] := pg_temp.m1_phases();
  v_developers text[] := pg_temp.m1_developers();
begin
  execute 'set local role anon';
  perform pg_catalog.set_config('request.jwt.claims', '', true);
  insert into m1_reads select p_w, 'risk_summary', s, api.risk_summary(s) from unnest(v_phases) s;
  insert into m1_reads select p_w, 'project_page', s, api.project_page(s) from unnest(v_phases) s;
  insert into m1_reads select p_w, 'developer_page', s, api.developer_page(p_slug => s)
    from unnest(v_developers) s;
  insert into m1_reads select p_w, 'search_projects', 'all-gurugram',
    api.search_projects(p_q => '', p_filters => null, p_sort => 'lowest_risk', p_bbox => null, p_cursor => null, p_limit => 20);
  insert into m1_reads select p_w, 'search_projects', 'canonical',
    api.search_projects(p_q => '3 bhk dwarka expresway under 2.5 cr low risk', p_filters => null,
                        p_sort => 'lowest_risk', p_bbox => null, p_cursor => null, p_limit => 20);
  insert into m1_reads select p_w, 'compare', 'aurelia-kestrel-sapphire-coral',
    api.compare(p_slugs => array['aurelia-heights-phase-2', 'kestrel-park', 'sapphire-grove-phase-1', 'coral-towers']);
  execute 'reset role';
end $$;

-- What would put a band in front of a buyer: a band chip; a band, band_then, frequency,
-- confidence or what-would-change value; a reason; or text that names a phase's band or its
-- "N of 100 similar" frequency. Generic copy that explains the scale ("Low and Moderate" in a
-- filter legend) is not a leak.
create function pg_temp.m1_leaks(p jsonb) returns setof text language sql immutable as $$
  with nodes as (select v from jsonb_path_query(p, 'lax $.**') v)
  select 'chip: ' || (v ->> 'label') from nodes
   where jsonb_typeof(v) = 'object' and v ? 'meter_filled' and v ->> 'kind' = 'band'
  union all
  select k || ': ' || (v -> k)::text
    from nodes, unnest(array['band', 'band_then', 'frequency', 'confidence', 'what_would_change']) k
   where jsonb_typeof(v) = 'object' and v ? k and v -> k <> 'null'::jsonb
  union all
  select 'reasons: ' || jsonb_array_length(v -> 'reasons') from nodes
   where jsonb_typeof(v) = 'object' and jsonb_typeof(v -> 'reasons') = 'array'
     and jsonb_array_length(v -> 'reasons') > 0
  union all
  select 'text: ' || (v #>> '{}') from nodes
   where jsonb_typeof(v) = 'string'
     and ((v #>> '{}') in ('Low', 'Moderate', 'Elevated', 'High', 'Severe')
          or (v #>> '{}') ~* '\m\d+ of 100 similar'
          or (v #>> '{}') ~* 'delivery risk:? (low|moderate|elevated|high|severe)\M'
          or (v #>> '{}') ~* '\((low|moderate|elevated|high|severe)\)')
$$;

create function pg_temp.m1_rs(p_w text, p_slug text) returns jsonb language sql stable as $$
  select j from m1_reads where w = p_w and fn = 'risk_summary' and k = p_slug
$$;

-- 1. The frozen clock and the seeded world -------------------------------------------------------
select is(ops.now(), '2026-10-18 12:00:00+05:30'::timestamptz, 'ops.now() is the frozen clock, 18 Oct 2026 12:00 IST');
select is(
  (select array_agg(ph.slug order by ph.slug)::text[] from core.phases ph
     join core.score_runs r on r.phase_id = ph.id and r.status = 'published'),
  pg_temp.m1_phases(),
  'the 8 seeded phases, and only they, have a published score run'
);

select pg_temp.m1_fill('on');

select is(
  (select count(*)::int from m1_reads where w = 'on' and jsonb_typeof(j) = 'object'),
  25,
  'anon gets a payload from all 25 M1 reads (8 risk summaries, 8 project pages, 6 developer pages, 2 searches, 1 compare)'
);
select is(
  (select array_agg(distinct fn || ' ' || (j ->> 'schema') order by fn || ' ' || (j ->> 'schema')) from m1_reads where w = 'on'),
  array['compare plinth.compare/1', 'developer_page plinth.developer_page/1', 'project_page plinth.project_page/1',
        'risk_summary plinth.risk_summary/1', 'search_projects plinth.search_results/1'],
  'every payload carries its contract envelope'
);
select is(
  (select count(*)::int from m1_reads, jsonb_path_query(j, 'lax $.**.generated_at') g
    where w = 'on' and g <> '"2026-10-18T12:00:00+05:30"'::jsonb),
  0,
  'every meta.generated_at in every M1 read is the frozen clock'
);
select is(
  (select count(*)::int from m1_reads where w = 'on' and j #> '{meta,generated_at}' is not null),
  25,
  'and every M1 read has one'
);

-- 2. One contract: the same risk object everywhere ----------------------------------------------
select is(
  (select count(*)::int from m1_reads p where p.w = 'on' and p.fn = 'project_page' and p.j -> 'risk' = pg_temp.m1_rs('on', p.k)),
  8,
  'project_page.risk equals api.risk_summary for all 8 phases'
);
select set_eq(
  $$select i ->> 'slug' as slug, i -> 'chip' as chip from m1_reads, jsonb_array_elements(j -> 'items') i
     where w = 'on' and fn = 'search_projects' and k = 'all-gurugram'$$,
  $$select s as slug, pg_temp.m1_rs('on', s) -> 'chip' as chip from unnest(pg_temp.m1_phases()) s$$,
  'search (all of Gurugram) lists the 8 phases, each with its RiskSummary chip'
);
select results_eq(
  $$select c ->> 'slug' as slug, c -> 'chip' as chip from m1_reads, jsonb_array_elements(j -> 'columns') with ordinality c(c, n)
     where w = 'on' and fn = 'compare' order by n$$,
  $$select s as slug, pg_temp.m1_rs('on', s) -> 'chip' as chip from unnest(array['aurelia-heights-phase-2', 'kestrel-park',
     'sapphire-grove-phase-1', 'coral-towers']) with ordinality s(s, n) order by n$$,
  'compare keeps the requested order, each column with its RiskSummary chip'
);
select set_eq(
  $$select o ->> 'slug' as slug, o -> 'chip' as chip from m1_reads, jsonb_array_elements(j -> 'ongoing') o
     where w = 'on' and fn = 'developer_page' and o ->> 'slug' = any (pg_temp.m1_phases())$$,
  $$select s as slug, pg_temp.m1_rs('on', s) -> 'chip' as chip from unnest(pg_temp.m1_phases()) s$$,
  'each phase is on its developer''s page, with its RiskSummary chip'
);
select is(
  (select count(distinct k)::int from m1_reads, pg_temp.m1_leaks(j)
    where w = 'on' and fn = 'risk_summary' and k = any (pg_temp.m1_scored())),
  6,
  'control: with bands public, the leak check finds the band of each of the 6 scored phases'
);

-- 3. S1: bands_public = false -------------------------------------------------------------------
update ops.feature_flags set enabled = false where key = 'bands_public';
select pg_temp.m1_fill('off');

set local role anon;
select is((api.flags() -> 'flags' ->> 'bands_public')::boolean, false, 'S1: api.flags() tells clients bands are not public');
reset role;
select is(
  (select count(*)::int from m1_reads where w = 'off' and fn = 'risk_summary'
     and j -> 'display' -> 'bands_public' = 'false'::jsonb),
  8,
  'S1: every RiskSummary says bands are not public'
);
select is(
  (select array_agg(distinct j -> 'chip' ->> 'kind' || ' · ' || (j -> 'chip' ->> 'label')) from m1_reads
    where w = 'off' and fn = 'risk_summary' and k = any (pg_temp.m1_scored())),
  array['withheld · Facts only · bands not published yet'],
  'S1: each scored phase shows the neutral "Facts only · bands not published yet" chip'
);
select is(
  (select array_agg(k || ' ' || l) from m1_reads, pg_temp.m1_leaks(j) l where w = 'off' and fn = 'risk_summary'),
  null,
  'S1: no band, frequency, confidence, reason or what-would-change in any of the 8 risk summaries'
);
select is(
  (select array_agg(k || ' ' || l) from m1_reads, pg_temp.m1_leaks(j) l where w = 'off' and fn = 'project_page'),
  null,
  'S1: none anywhere on the 8 project pages (hero, replay, next steps, Afford the wait)'
);
select is(
  (select array_agg(k || ' ' || l) from m1_reads, pg_temp.m1_leaks(j) l where w = 'off' and fn = 'search_projects'),
  null,
  'S1: none in search results (all of Gurugram and the canonical query)'
);
select is(
  (select array_agg(l) from m1_reads, pg_temp.m1_leaks(j) l where w = 'off' and fn = 'compare'),
  null,
  'S1: none in compare (chips, frequency row, top reasons)'
);
select is(
  (select array_agg(k || ' ' || l) from m1_reads, pg_temp.m1_leaks(j) l where w = 'off' and fn = 'developer_page'),
  null,
  'S1: none on the 6 developer pages'
);
select is(
  (select count(*)::int from m1_reads p where p.w = 'off' and p.fn = 'project_page' and p.j -> 'risk' = pg_temp.m1_rs('off', p.k)),
  8,
  'S1: project_page.risk still equals api.risk_summary for all 8 phases'
);
select is(
  (select count(*)::int from unnest(pg_temp.m1_phases()) s
    where pg_temp.m1_rs('off', s) -> 'progress' = pg_temp.m1_rs('on', s) -> 'progress'
      and pg_temp.m1_rs('off', s) -> 'late12' = pg_temp.m1_rs('on', s) -> 'late12'
      and pg_temp.m1_rs('off', s) -> 'price' = pg_temp.m1_rs('on', s) -> 'price'),
  8,
  'S1: the facts stay: progress, the Late12 line and the price are unchanged for all 8 phases'
);

-- 4. Seeded evidence: fixture snapshots, immutable ----------------------------------------------
select ok((select count(*) from core.snapshots) > 0, 'the seed carries HARERA, DTCP and IBBI snapshots');
select is((select count(*)::int from core.snapshots where not fixture), 0,
  'every seeded snapshot is a saved fixture: nothing was fetched live');
select throws_ok(
  format($$update core.snapshots set url = 'fixture://changed' where id = %L$$,
         (select id from core.snapshots order by fetched_at, id limit 1)),
  'PT409', null,
  'a seeded snapshot cannot be updated'
);
select throws_ok(
  format($$delete from core.snapshots where id = %L$$, (select id from core.snapshots order by fetched_at, id limit 1)),
  'PT409', null,
  'a seeded snapshot cannot be deleted'
);

select * from finish();
rollback;
