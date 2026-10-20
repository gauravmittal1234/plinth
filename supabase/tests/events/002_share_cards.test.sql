-- T43a · Event engine core: core.share_cards issue and lookup, and the
-- perceptual-hash (phash) search (DATA_MODEL §2; fix-since-family.md §1 "old
-- card"; fixtures C-37).
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

update ops.runtime_settings set value = 'test' where key = 'env';
select set_config('plinth.fixed_now', '', true);

-- Issuing a card -------------------------------------------------------------------
select throws_ok(
  $$select core.issue_share_card('5ddd2261-7682-53da-86ae-b011d465a066'::uuid, 'visit', null, null, null)$$,
  'PT422', 'invalid_input',
  'issuing a card with no run_id and no data_as_of is rejected'
);
select throws_ok(
  $$select core.issue_share_card('5ddd2261-7682-53da-86ae-b011d465a066'::uuid, 'not_a_kind', null, '2026-10-18'::date, null)$$,
  'PT422', 'invalid_input',
  'an unknown share-card kind is rejected'
);
select ok(
  (select c.short_code = pg_catalog.left(c.id::text, 8)
     from core.issue_share_card('5ddd2261-7682-53da-86ae-b011d465a066'::uuid, 'visit', null, '2026-10-18'::date, null) c),
  'short_code is the card''s own id, first 8 hex characters (fixtures C-37 convention)'
);
select results_eq(
  $$select c.phase_id, c.kind, c.model_version, c.band::text, c.data_as_of
      from core.issue_share_card('6df6fbdc-d039-5189-ad91-d172d36b8f92'::uuid, 'risk', '0cbf78fd-3b74-5440-bb85-2cefde33f927'::uuid, null, null) c$$,
  $$values ('6df6fbdc-d039-5189-ad91-d172d36b8f92'::uuid, 'risk'::text, 'v1.2'::text, 'moderate'::text, '2026-10-14'::date)$$,
  'model_version, band and data_as_of come from the published run given, never a caller value'
);

-- Lookup by short code --------------------------------------------------------------
select is(
  (select c.phase_id from core.find_share_card('ce57248d') c),
  '4da0daeb-835b-54d5-9c09-a23ee9cb4b36'::uuid,
  'the seeded old card (ce57248d, Aurelia, 30 Sep 2026, v1.1 Moderate) is found by its short code'
);
select is(
  (select c.band::text from core.find_share_card('ce57248d') c),
  'moderate',
  '...still showing the Moderate band it carried when issued, so it can answer for itself'
);
select is(
  (select count(*)::int from core.find_share_card('zzzzzzzz')),
  0,
  'an unknown short code finds nothing'
);

-- Lookup by perceptual hash (a forwarded image with no readable short code) --------
select core.issue_share_card('4da0daeb-835b-54d5-9c09-a23ee9cb4b36'::uuid, 'risk', null, '2026-09-20'::date, (pg_catalog.repeat('0', 60) || '1010')::bit(64));
select core.issue_share_card('5ddd2261-7682-53da-86ae-b011d465a066'::uuid, 'visit', null, '2026-09-21'::date, (pg_catalog.repeat('0', 60) || '1010')::bit(64));
select core.issue_share_card('6df6fbdc-d039-5189-ad91-d172d36b8f92'::uuid, 'cost', null, '2026-09-22'::date, (pg_catalog.repeat('1', 32) || pg_catalog.repeat('0', 28) || '1010')::bit(64));

select is(
  (select count(*)::int from core.find_share_cards_by_phash((pg_catalog.repeat('0', 60) || '1010')::bit(64), 0)),
  2,
  'two cards share the exact same perceptual hash (Hamming distance 0)'
);
select is(
  (select count(*)::int from core.find_share_cards_by_phash((pg_catalog.repeat('0', 60) || '1010')::bit(64), 2)),
  2,
  'a card 32 bits different is excluded at max_distance 2'
);
select is(
  (select count(*)::int from core.find_share_cards_by_phash((pg_catalog.repeat('0', 60) || '1010')::bit(64), 40)),
  3,
  '...but included once max_distance covers the 32-bit difference'
);

select * from finish();
rollback;
