-- T07 · M0 gate: the §5b scoring seed (DESIGN §5b; BUILD_PLAN §3 M0 exit).
-- Band history (Aurelia Moderate until 2 Oct 2026, then Elevated; never
-- Elevated before 2 Oct), the current bands, Laurel's red flag and the two
-- Aurelia notices (heads-up 30 Sep; 7-day notice 18 Oct → 25 Oct).
begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

-- Current bands --------------------------------------------------------------------------
select results_eq(
  $$select ph.slug, r.state::text, r.band::text from core.score_runs r
      join core.phases ph on ph.id = r.phase_id
    where r.status = 'published' order by ph.slug$$,
  $$values ('aurelia-heights-phase-2'::text, 'scored'::text, 'elevated'::text),
           ('cedar-walk-phase-2', 'scored', 'moderate'),
           ('coral-towers', 'scored', 'high'),
           ('heron-point-phase-2', 'not_scored', null),
           ('juniper-enclave', 'limited_history', null),
           ('kestrel-park', 'scored', 'low'),
           ('laurel-residency', 'scored', 'severe'),
           ('sapphire-grove-phase-1', 'scored', 'moderate')$$,
  'the published band of every seeded phase (model v1.2, data as of 14 Oct 2026)'
);
select is(
  (select array_agg(distinct model_version) from core.score_runs where status = 'published'),
  array['v1.2']::text[],
  'every published run is model v1.2'
);
select is(
  (select array_agg(distinct data_cutoff) from core.score_runs where status = 'published'),
  array['2026-10-14'::date],
  'with data as of 14 Oct 2026'
);

-- Aurelia's band history ------------------------------------------------------------------
select results_eq(
  $$select h.band::text, h.from_date, h.to_date, h.model_version from core.band_history h
      join core.phases ph on ph.id = h.phase_id
    where ph.slug = 'aurelia-heights-phase-2' order by h.from_date$$,
  $$values ('moderate'::text, '2026-07-15'::date, '2026-09-02'::date, 'v1.0'::text),
           ('moderate', '2026-09-02'::date, '2026-10-02'::date, 'v1.1'),
           ('elevated', '2026-10-02'::date, '2026-10-14'::date, 'v1.1'),
           ('elevated', '2026-10-14'::date, null::date, 'v1.2')$$,
  'Aurelia: Moderate from 15 Jul 2026 until 2 Oct 2026, then Elevated'
);
select is(
  (select count(*)::int from core.band_history h
     join core.phases ph on ph.id = h.phase_id
   where ph.slug = 'aurelia-heights-phase-2' and h.band = 'elevated' and h.from_date < '2026-10-02'),
  0,
  'no Elevated row before 2 Oct 2026'
);
select is(
  (select count(*)::int from core.band_history h
     join core.phases ph on ph.id = h.phase_id
   where ph.slug = 'aurelia-heights-phase-2' and h.band <> 'moderate' and h.from_date < '2026-10-02'),
  0,
  'every Aurelia row before 2 Oct 2026 is Moderate'
);
select is(
  (select count(*)::int from core.band_history h1
     join core.band_history h2 on h2.phase_id = h1.phase_id and h2.id <> h1.id
   where daterange(h1.from_date, h1.to_date) && daterange(h2.from_date, h2.to_date)),
  0,
  'no phase has two band-history rows covering the same day'
);
select is(
  (select count(*)::int from core.band_history where to_date is null),
  8,
  'each seeded phase has exactly one open (current) band-history row'
);
select ok(
  not exists (
    select 1 from core.band_history h
      join core.score_runs r on r.phase_id = h.phase_id and r.status = 'published'
    where h.to_date is null and h.band is distinct from r.band
  ),
  'the open band-history row matches the published run'
);

-- Laurel's red flag ----------------------------------------------------------------------
select results_eq(
  $$select f.rule_code, f.subject_type, g.slug, f.triggered_on, f.cleared_on from core.red_flags f
      join core.developer_groups g on g.id = f.subject_id
    where f.subject_type = 'group'$$,
  $$values ('RF1_GROUP_CIRP'::text, 'group'::text, 'elmstone-developers'::text, '2023-03-12'::date, null::date)$$,
  'RF1 (group insolvency) stands on the Elmstone group since 12 Mar 2023, not cleared'
);
select results_eq(
  $$select r.band::text, r.set_by, r.rule_code, r.stall from core.score_runs r
      join core.phases ph on ph.id = r.phase_id
    where ph.slug = 'laurel-residency' and r.status = 'published'$$,
  $$values ('severe'::text, 'red_flag_rule'::text, 'RF1_GROUP_CIRP'::text, true)$$,
  'Laurel Residency is Severe, set by the RF1 rule, and stalled'
);
select is(
  (select count(*)::int from core.score_runs where status = 'published' and set_by = 'red_flag_rule'),
  1,
  'Laurel is the only phase whose band a red-flag rule sets'
);

-- Aurelia's notices ------------------------------------------------------------------------
select results_eq(
  $$select n.kind, n.from_band::text, n.to_band::text, (n.sent_at at time zone 'Asia/Kolkata')::date,
           n.effective_on, n.status
      from core.band_notices n join core.phases ph on ph.id = n.phase_id
     where ph.slug = 'aurelia-heights-phase-2' order by n.sent_at$$,
  $$values ('heads_up_48h'::text, 'moderate'::text, 'elevated'::text, '2026-09-30'::date, '2026-10-02'::date, 'effective'::text),
           ('notice_7day', 'elevated', 'high', '2026-10-18'::date, '2026-10-25'::date, 'pending')$$,
  'heads-up sent 30 Sep 2026 (effective 2 Oct); 7-day notice sent 18 Oct 2026, effective 25 Oct'
);
select is(
  (select public_marker_text from core.band_notices where kind = 'notice_7day' and status = 'pending'),
  'If it is still missing on 25 Oct 2026, this band may change; followers hear first.',
  'the pending notice''s public marker'
);
select results_eq(
  $$select r.status, r.band::text from core.band_notices n
      join core.score_runs r on r.id = n.proposed_run_id
     where n.kind = 'notice_7day'$$,
  $$values ('pending_notice'::text, 'high'::text)$$,
  'the 7-day notice proposes a pending (unpublished) High run'
);
select is(
  (select r.notice_id from core.score_runs r
     join core.phases ph on ph.id = r.phase_id
   where ph.slug = 'aurelia-heights-phase-2' and r.band = 'elevated' and r.data_cutoff = '2026-09-30'),
  (select id from core.band_notices where kind = 'heads_up_48h'),
  'the 2 Oct Elevated run went out after the 30 Sep heads-up'
);
select is(
  (select count(*)::int from core.band_notices where status = 'pending'),
  1,
  'one pending notice in the fixture world'
);

select * from finish();
rollback;
