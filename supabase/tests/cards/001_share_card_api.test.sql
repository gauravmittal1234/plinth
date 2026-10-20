-- Lead · M2 gap: api.share_card, api.wa_match_share_card, api.resolve_short_link
-- (supabase/migrations/20261103000200_lead_share_card_api.sql). PR #76 (T46a)
-- consumes all three. Seeded card: ce57248d, Aurelia Heights Phase 2, issued
-- 30 Sep 2026 from the v1.1 Moderate run; the phase's latest published run is
-- v1.2 Elevated, 14 Oct 2026 (packages/fixtures/canonical/{people,scoring}.json).
begin;
create extension if not exists pgtap with schema extensions;
select plan(29);

update ops.runtime_settings set value = 'test' where key = 'env';
select set_config('plinth.fixed_now', '', true);

-- Existence and grants -------------------------------------------------------------
select ok(to_regprocedure('api.share_card(text)') is not null, 'api.share_card(text) exists');
select ok(to_regprocedure('api.wa_match_share_card(text)') is not null, 'api.wa_match_share_card(text) exists');
select ok(to_regprocedure('api.resolve_short_link(text)') is not null, 'api.resolve_short_link(text) exists');

select ok(
  (select prosecdef and provolatile = 's' from pg_catalog.pg_proc where oid = 'api.share_card(text)'::regprocedure)
    and has_function_privilege('anon', 'api.share_card(text)', 'EXECUTE')
    and not exists (select 1 from aclexplode((select proacl from pg_catalog.pg_proc where oid = 'api.share_card(text)'::regprocedure)) a where a.grantee = 0),
  'api.share_card: SECURITY DEFINER, STABLE, executable by anon, not by PUBLIC'
);
select ok(
  (select prosecdef and provolatile = 's' from pg_catalog.pg_proc where oid = 'api.resolve_short_link(text)'::regprocedure)
    and has_function_privilege('anon', 'api.resolve_short_link(text)', 'EXECUTE')
    and not exists (select 1 from aclexplode((select proacl from pg_catalog.pg_proc where oid = 'api.resolve_short_link(text)'::regprocedure)) a where a.grantee = 0),
  'api.resolve_short_link: SECURITY DEFINER, STABLE, executable by anon, not by PUBLIC'
);
select ok(
  (select prosecdef from pg_catalog.pg_proc where oid = 'api.wa_match_share_card(text)'::regprocedure)
    and has_function_privilege('service_role', 'api.wa_match_share_card(text)', 'EXECUTE')
    and not has_function_privilege('anon', 'api.wa_match_share_card(text)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'api.wa_match_share_card(text)', 'EXECUTE')
    and not exists (select 1 from aclexplode((select proacl from pg_catalog.pg_proc where oid = 'api.wa_match_share_card(text)'::regprocedure)) a where a.grantee = 0),
  'api.wa_match_share_card: SECURITY DEFINER, executable by service_role only -- not anon, not authenticated, not PUBLIC'
);

-- api.share_card: a found card, as anon would call it ------------------------------
create temp table t_card (j jsonb);
grant all on t_card to public;
set local role anon;
insert into t_card select api.share_card('CE57248D'); -- case-insensitive
reset role;

select is((select j ->> 'schema' from t_card), 'plinth.share_card/1', 'schema tag');
select is((select j ->> 'kind' from t_card), 'risk', 'kind: risk');
select is((select j -> 'phase' ->> 'slug' from t_card), 'aurelia-heights-phase-2', 'phase.slug');
select is((select j -> 'sent' ->> 'band' from t_card), 'moderate', 'sent.band: Moderate, as issued 30 Sep 2026');
select is((select j -> 'sent' ->> 'data_as_of' from t_card), '2026-09-30', 'sent.data_as_of: the card''s own stored column');
select is((select j -> 'sent' ->> 'model_version' from t_card), 'v1.1', 'sent.model_version');
select is(
  (select array_agg(l order by o) from t_card, jsonb_array_elements_text(j -> 'sent' -> 'lines') with ordinality as x(l, o)),
  array['Delivery risk: Moderate', 'Between 15 and 30 of 100 similar Gurugram projects got their OC more than 12 months late.'],
  'sent.lines: band + the issuing run''s own (never today''s) frequency'
);
select is((select j -> 'now' ->> 'band' from t_card), 'elevated', 'now.band: the live published run (v1.2, Elevated)');
select is((select j -> 'now' ->> 'data_as_of' from t_card), '2026-10-14', 'now.data_as_of: the live run''s cutoff');
select is((select (j ->> 'changed')::boolean from t_card), true, 'changed: true (band and data_as_of both moved)');
select is(
  (select j ->> 'headline_line' from t_card),
  'Changed since this card was sent: band Moderate → Elevated (2 Oct).',
  'headline_line names both bands and the date the new one took effect'
);
select ok(
  (select exists (
    select 1 from t_card, jsonb_array_elements(j -> 'changes') c
    where c ->> 'key' = 'band' and c ->> 'before_line' = 'Moderate' and c ->> 'after_line' = 'Elevated since 2 Oct 2026'
  )),
  'changes carries a band entry with real before/after lines'
);
select is((select j ->> 'live_url' from t_card), 'https://plinth.in/gurugram/projects/aurelia-heights-phase-2', 'live_url');

-- No personal fields: the payload''s own keys, never more than the contract -------
select is(
  (select array_agg(k order by k) from t_card, jsonb_object_keys(j) k),
  array['changed', 'changes', 'headline_line', 'kind', 'live_url', 'now', 'phase', 'schema', 'sent'],
  'top-level keys match plinth.share_card/1 exactly -- nothing extra, nothing personal'
);
select is(
  (select array_agg(k order by k) from t_card, jsonb_object_keys(j -> 'phase') k),
  array['name', 'slug'],
  'phase carries only slug and name -- no developer, no contact, no buyer data'
);

-- api.share_card: not_found ----------------------------------------------------------
select throws_ok(
  $$select api.share_card('zzzzzzzz')$$,
  'PT404', 'not_found',
  'an unknown share code is not_found'
);
select throws_ok(
  $$select api.share_card('')$$,
  'PT422', 'invalid_input',
  'an empty code is invalid_input'
);

-- api.wa_match_share_card: exact match on the stored hash ---------------------------
select core.issue_share_card(
  '6df6fbdc-d039-5189-ad91-d172d36b8f92'::uuid, 'risk', null, '2026-10-01'::date,
  x'00000000000000ff'::bit(64)
);
select is(
  (select api.wa_match_share_card('00000000000000ff' || pg_catalog.repeat('0', 48)) ->> 'short_code'),
  (select short_code from core.share_cards where phash = x'00000000000000ff'::bit(64)),
  'a forwarded image''s hash resolves to the card issued with that same hash'
);
select throws_ok(
  $$select api.wa_match_share_card(pg_catalog.repeat('a', 64))$$,
  'PT404', 'not_found',
  'a hash matching no card is not_found'
);
select throws_ok(
  $$select api.wa_match_share_card('not-a-hash')$$,
  'PT422', 'invalid_input',
  'a malformed hash is invalid_input'
);

-- api.resolve_short_link -------------------------------------------------------------
select is(
  (select api.resolve_short_link('ah2')),
  '{"schema": "plinth.short_link/1", "kind": "phase", "slug": "aurelia-heights-phase-2", "card_code": null}'::jsonb,
  'a project short code (case-insensitive) resolves to its slug'
);
select is(
  (select api.resolve_short_link('ce57248d')),
  '{"schema": "plinth.short_link/1", "kind": "card", "slug": null, "card_code": "ce57248d"}'::jsonb,
  'a share-card short code resolves to the card'
);
select throws_ok(
  $$select api.resolve_short_link('not-a-real-code')$$,
  'PT404', 'not_found',
  'an unknown code is not_found'
);

select * from finish();
rollback;
