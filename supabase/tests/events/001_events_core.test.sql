-- T43a · Event engine core: events derived from facts and score runs
-- (DATA_MODEL §2 core.events; fix-since-family.md §1-2; DESIGN §5b). Clock
-- rule (AGENTS.md): frozen at 18 Oct 2026, 12:00 IST; nothing here depends on
-- when the seed happened to load, only on the fact dates it carries.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

update ops.runtime_settings set value = 'test' where key = 'env';
select set_config('plinth.fixed_now', '', true);

create temporary table rohan_phases (slug text);
insert into rohan_phases values
  ('aurelia-heights-phase-2'), ('kestrel-park'), ('sapphire-grove-phase-1'), ('coral-towers');

-- "Since 14 Oct 08:40" (Rohan's last look): exactly 5 events ------------------------
select is(
  (select count(*)::int from core.events e
     join core.phases ph on ph.id = e.phase_id
    where ph.slug in (select slug from rohan_phases)
      and e.detected_at > '2026-10-14 08:40:00+05:30'::timestamptz
      and e.detected_at <= ops.now()),
  5,
  '5 events on Rohan''s 4 followed phases since his last look (14 Oct 2026, 8:40 am)'
);

select results_eq(
  $$select e.kind, pg_catalog.count(*)::int from core.events e
      join core.phases ph on ph.id = e.phase_id
     where ph.slug in ('aurelia-heights-phase-2','kestrel-park','sapphire-grove-phase-1','coral-towers')
       and e.detected_at > '2026-10-14 08:40:00+05:30'::timestamptz
       and e.detected_at <= ops.now()
     group by e.kind order by e.kind$$,
  $$values ('extension_granted'::text, 1), ('price_list_published', 1), ('qpr_filed', 1), ('qpr_missing', 2)$$,
  '1 extension, 1 on-time filing, 2 missing filings and 1 price change (fix-since-family.md §1)'
);

-- The 2 missing filings: Aurelia's and Coral's Jul-Sep 2026 QPRs, due 15 Oct,
-- logged the next day by the cron sweep ---------------------------------------------
select results_eq(
  $$select ph.slug, e.occurred_on, (e.detected_at at time zone 'Asia/Kolkata')::date
      from core.events e join core.phases ph on ph.id = e.phase_id
     where e.kind = 'qpr_missing' and e.detected_at > '2026-10-14 08:40:00+05:30'::timestamptz
     order by ph.slug$$,
  $$values ('aurelia-heights-phase-2'::text, '2026-10-15'::date, '2026-10-16'::date),
           ('coral-towers', '2026-10-15'::date, '2026-10-16'::date)$$,
  'both missing Jul–Sep 2026 QPRs: due 15 Oct, detected missing 16 Oct (due date + 1)'
);

select results_eq(
  $$select ph.slug, e.occurred_on, e.detected_at from core.events e
      join core.phases ph on ph.id = e.phase_id
     where e.kind = 'qpr_filed' and e.detected_at > '2026-10-14 08:40:00+05:30'::timestamptz$$,
  $$values ('sapphire-grove-phase-1'::text, '2026-10-15'::date, '2026-10-16T19:40:00+05:30'::timestamptz)$$,
  'Sapphire''s Jul–Sep 2026 QPR: filed on time 15 Oct, detected when fetched from HARERA, 16 Oct 7:40 pm'
);

select is(
  (select ph.slug from core.events e join core.phases ph on ph.id = e.phase_id
     where e.kind = 'extension_granted' and e.detected_at > '2026-10-14 08:40:00+05:30'::timestamptz),
  'coral-towers',
  'Coral''s second extension (granted 14 Oct 2026) is the one extension event since the last look'
);
select is(
  (select e.after ->> 'to_completion' from core.events e join core.phases ph on ph.id = e.phase_id
     where e.kind = 'extension_granted' and ph.slug = 'coral-towers' and e.occurred_on = '2026-10-14'),
  '2029-08-01',
  '...moving completion to Aug 2029'
);
select is(
  (select e.before ->> 'to_completion' from core.events e join core.phases ph on ph.id = e.phase_id
     where e.kind = 'extension_granted' and ph.slug = 'coral-towers' and e.occurred_on = '2026-10-14'),
  '2029-02-01',
  '...from Feb 2029, where Coral''s first extension (granted 20 Jan 2026) left it'
);

select is(
  (select ph.slug from core.events e join core.phases ph on ph.id = e.phase_id
     where e.kind = 'price_list_published' and e.detected_at > '2026-10-14 08:40:00+05:30'::timestamptz),
  'sapphire-grove-phase-1',
  'Sapphire''s 16 Oct 2026 price list is the one price change since the last look'
);
select is(
  (select e.after ->> 'published_on' from core.events e join core.phases ph on ph.id = e.phase_id
     where e.kind = 'price_list_published' and ph.slug = 'sapphire-grove-phase-1' and e.occurred_on = '2026-10-16'),
  '2026-10-16',
  '...carrying the price list''s own id/date for a reader to join ws.price_list_items against'
);

-- No band moved since the last look (the hero reads "No band moved") ---------------
select is(
  (select count(*)::int from core.events e join core.phases ph on ph.id = e.phase_id
     where ph.slug in (select slug from rohan_phases) and e.kind = 'band_changed'
       and e.detected_at > '2026-10-14 08:40:00+05:30'::timestamptz),
  0,
  'no band_changed event since the last look'
);

-- The 2 Oct 2026 band change is on record, outside that window ---------------------
select results_eq(
  $$select ph.slug, e.occurred_on, e.before ->> 'band', e.after ->> 'band'
      from core.events e join core.phases ph on ph.id = e.phase_id
     where e.kind = 'band_changed'$$,
  $$values ('aurelia-heights-phase-2'::text, '2026-10-02'::date, 'moderate'::text, 'elevated'::text)$$,
  'the only band_changed event on record: Aurelia, Moderate → Elevated, 2 Oct 2026'
);

-- Older history (before the last look) is kept, not pruned -------------------------
select is(
  (select count(*)::int from core.events e join core.phases ph on ph.id = e.phase_id
     where ph.slug = 'kestrel-park' and e.kind = 'qpr_filed' and e.occurred_on = '2026-10-12'),
  1,
  'Kestrel''s 12 Oct on-time filing is recorded (before the last look, so outside the 5)'
);
select is(
  (select count(*)::int from core.events e join core.phases ph on ph.id = e.phase_id
     where ph.slug = 'coral-towers' and e.kind = 'qpr_missing' and e.occurred_on = '2026-07-15'),
  1,
  'Coral''s older Apr–Jun 2026 missing QPR (due 15 Jul) is also on record'
);

-- No rescore_started or developer_replied noise from this seed ---------------------
select is(
  (select count(*)::int from core.events where kind in ('rescore_started', 'developer_replied')),
  0,
  'no rescore_started or developer_replied event: no draft run and no run-linked reply in the seed'
);

-- The sweep: an overdue not_yet_due filing becomes missing and is logged -----------
insert into core.qpr_filings (id, registration_id, quarter, due_on, status)
values ('11111111-1111-1111-1111-111111111111'::uuid, '4af467c7-b246-5df9-9dbc-e3359d4b4f6a'::uuid, '2026-Q4', '2026-10-17'::date, 'not_yet_due');

select is(ops.sweep_qpr_missing(), 1, 'the sweep flips exactly the one overdue not_yet_due filing');
select is(
  (select e.kind::text from core.events e
     where e.phase_id = '5ddd2261-7682-53da-86ae-b011d465a066'::uuid and e.occurred_on = '2026-10-17'),
  'qpr_missing',
  'the sweep''s status change logs a qpr_missing event through the qpr_filings trigger'
);

select * from finish();
rollback;
