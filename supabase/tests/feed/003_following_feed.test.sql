-- T43b · api.following_feed / api.mark_following_seen, called as Rohan (the
-- brief's own Accept line: `npm run -w @plinth/fixtures test:api -- --only
-- following_feed` deep-equals packages/fixtures/expected/following_feed/
-- rohan.json). That harness always calls every RPC as anon with no JWT
-- claims (packages/fixtures/scripts/api-contract-test.mjs, T12-owned, line
-- "perform pg_catalog.set_config('request.jwt.claims', '', true);" before
-- every case) — it has no path for an authenticated, per-user RPC, so
-- following_feed and mark_following_seen fail there on auth_required before
-- either function body ever runs (PR Handoff). pgTAP can set a real JWT, so
-- this file is this task's actual proof the RPCs work, exercised the
-- supported way (auth.uid()), against the same seed the JS fixture targets.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

update ops.runtime_settings set value = 'test' where key = 'env';
select set_config('plinth.fixed_now', '', true);

grant usage on schema api to authenticated;
grant execute on function api.following_feed(timestamptz) to authenticated;
grant execute on function api.mark_following_seen() to authenticated;
grant usage on schema app to authenticated;
grant update on app.profiles to authenticated;

select throws_ok(
  $$select api.following_feed(null)$$, 'PT401', null,
  'anon (no JWT): auth_required'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);

select is(
  (select (api.following_feed(null)) ->> 'schema'),
  'plinth.following_feed/1', 'the envelope'
);
select is(
  (select (api.following_feed(null)) ->> 'heading'),
  'What changed since 14 Oct?', 'heading reads Rohan''s last look'
);
select is(
  (select (api.following_feed(null)) ->> 'last_looked_line'),
  'Last looked 14 Oct 2026, 8:40 am · 5 unread', 'last_looked_line: 5 unread, matching fix-since-family.md'
);
select is(
  (select (api.following_feed(null)) ->> 'summary_line'),
  '5 changes across your 4 projects: 1 extension, 1 filing on time, 2 missing filings and 1 price change. No band moved.',
  'summary_line matches packages/fixtures/expected/following_feed/rohan.json'
);
select is(
  (select pg_catalog.jsonb_array_length(api.following_feed(null) -> 'changes')),
  5, 'exactly 5 changes, same as the pgTAP events test (supabase/tests/events/001_events_core.test.sql)'
);
select is(
  (select pg_catalog.jsonb_array_length(api.following_feed(null) -> 'projects')),
  4, 'his 4 followed projects'
);
select is(
  (select (api.following_feed(null) -> 'digest' ->> 'cadence')),
  'weekly_sun_9am', 'digest.cadence: his own whatsapp/digest subscription'
);
select is(
  (select (api.following_feed(null) -> 'digest' ->> 'next_line')),
  'Next digest Sun 25 Oct, 9 am', 'next_line names the coming Sunday'
);
-- The "following feed lists changes newest first" invariant (INTEGRATION_NOTES
-- "T43b"): every change's occurred_on is non-increasing down the list.
select ok(
  (with f as (select api.following_feed(null) as j),
        c as (
          select (item ->> 'occurred_on')::date as d, ord
          from f, pg_catalog.jsonb_array_elements(f.j -> 'changes') with ordinality as t(item, ord)
        )
   select not exists (select 1 from c a join c b on b.ord = a.ord + 1 where b.d > a.d)),
  'changes are ordered newest first'
);

select is(api.mark_following_seen(), '{"ok": true}'::jsonb, 'mark_following_seen acknowledges');

reset role;
select set_config('request.jwt.claims', '', true);
select is(
  (select following_seen_at from app.profiles where id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  ops.now(), 'mark_following_seen sets following_seen_at = ops.now()'
);

select * from finish();
rollback;
