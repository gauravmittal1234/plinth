-- T44 · WhatsApp store: tables, api.wa_* functions and the tap check (API_CONTRACTS §5.1–§5.2;
-- DATA_MODEL §9). Numbers are from the fixture-only block +91 99000 003NN (393, 394), which no
-- fixture person uses.
begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

-- Lockdown -----------------------------------------------------------------------
select is(
  (
    select array_agg(n.nspname || '.' || c.relname order by 1)
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where (n.nspname, c.relname) in (('pii', 'wa_contacts'), ('comms', 'wa_messages'), ('comms', 'wa_sessions'))
      and not c.relrowsecurity
  ),
  null::text[],
  'RLS is on for pii.wa_contacts, comms.wa_messages and comms.wa_sessions'
);

select is(
  (
    select array_agg(r.role || ' → ' || p.oid::regprocedure::text order by 1)
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    cross join (values ('anon'), ('authenticated')) as r(role)
    where n.nspname = 'api' and p.proname like 'wa\_%'
      and has_function_privilege(r.role, p.oid, 'EXECUTE')
  ),
  null::text[],
  'anon and authenticated cannot execute any api.wa_* function'
);

select is(
  (
    select count(*)::int
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api' and p.proname like 'wa\_%'
      and has_function_privilege('service_role', p.oid, 'EXECUTE')
  ),
  8,
  'service_role can execute the 8 api.wa_* functions'
);
-- 8, not T44's original 7: the lead's api.wa_match_share_card (M2 gap task, PR #76
-- Handoff -- "mirroring T44's wa_* service-RPC naming") is service_role-only too and
-- matches this same wildcard. Count only; the row above (no anon/authenticated
-- execute on any wa_* function) already covers it without a hardcoded name.

select is(
  (
    select array_agg(c.relname || '.' || a.attname order by 1)
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where (n.nspname, c.relname) in (('pii', 'wa_contacts'), ('comms', 'wa_messages'), ('comms', 'wa_sessions'))
      and a.attnum > 0 and not a.attisdropped
      and coalesce(col_description(c.oid, a.attnum), '') !~ '^pii:C[0-3]'
  ),
  null::text[],
  'every column of the WhatsApp tables carries a pii tag'
);

set local role anon;
select throws_ok('select * from pii.wa_contacts', '42501', null, 'anon: select pii.wa_contacts → permission denied');
reset role;
set local role authenticated;
select throws_ok('select * from comms.wa_messages', '42501', null, 'authenticated: select comms.wa_messages → permission denied');
select throws_ok(
  $$select api.wa_ingest_inbound('919900000393', 'wamid.t44.x', 'text', '{}'::jsonb)$$,
  '42501', null, 'authenticated: api.wa_ingest_inbound → permission denied'
);
reset role;

-- Ingest: contact upsert + idempotent insert ---------------------------------------
create temp table t44 (k text primary key, v jsonb);
grant all on t44 to public;

set local role service_role;
insert into t44 values ('first', api.wa_ingest_inbound(
  '919900000393', 'wamid.t44.text-1', 'text', '{"text": {"body": "aurelia"}}'::jsonb,
  timestamptz '2026-10-18 12:00:00+05:30'));
insert into t44 values ('again', api.wa_ingest_inbound(
  '919900000393', 'wamid.t44.text-1', 'text', '{"text": {"body": "aurelia"}}'::jsonb,
  timestamptz '2026-10-18 12:00:00+05:30'));
insert into t44 values ('older', api.wa_ingest_inbound(
  '919900000393', 'wamid.t44.text-0', 'text', '{"text": {"body": "hi"}}'::jsonb,
  timestamptz '2026-10-18 11:00:00+05:30'));
reset role;

select is((select v ->> 'duplicate' from t44 where k = 'first'), 'false', 'a new wa_message_id is not a duplicate');
select is((select v ->> 'duplicate' from t44 where k = 'again'), 'true', 'the same wa_message_id again is a duplicate');
select is(
  (select count(*)::int from comms.wa_messages where wa_message_id = 'wamid.t44.text-1'),
  1,
  'a redelivered message is stored once'
);
select is(
  (select count(*)::int from pii.wa_contacts where wa_id_e164 = '+919900000393'),
  1,
  'one contact per number, stored as E.164 with +'
);
select is(
  (select last_inbound_at from pii.wa_contacts where wa_id_e164 = '+919900000393'),
  timestamptz '2026-10-18 12:00:00+05:30',
  'last_inbound_at only moves forward (an older message does not pull it back)'
);
select is(
  (select route_attempts::int from comms.wa_messages where wa_message_id = 'wamid.t44.text-1'),
  1,
  'a new inbound row is claimed by the fast path (route_attempts 1)'
);
select ok(
  (select (v -> 'contact' ->> 'user_id') is null and (v -> 'contact' ->> 'wa_id') = '919900000393' from t44 where k = 'first'),
  'the result carries the contact (unlinked) for the router'
);

set local role service_role;
select throws_ok(
  $$select api.wa_ingest_inbound('not-a-number', 'wamid.t44.bad', 'text', '{}'::jsonb)$$,
  'PT422', 'invalid_input', 'a sender that is not a number → invalid_input'
);
reset role;

-- Outbound record + status callbacks -------------------------------------------------
insert into t44 select 'cid', to_jsonb(id) from pii.wa_contacts where wa_id_e164 = '+919900000393';
insert into t44 select 'mid', to_jsonb(id) from comms.wa_messages where wa_message_id = 'wamid.t44.text-1';
set local role service_role;
select api.wa_record_outbound(
  (select (v #>> '{}')::uuid from t44 where k = 'cid'),
  'wamid.t44.out-1', 'interactive', '{"interactive": {"type": "button"}}'::jsonb, 'sent');
insert into t44 values ('delivered', api.wa_apply_status('wamid.t44.out-1', 'delivered'));
insert into t44 values ('sent-late', api.wa_apply_status('wamid.t44.out-1', 'sent'));
insert into t44 values ('inbound', api.wa_apply_status('wamid.t44.text-1', 'read'));
reset role;

select is((select (v ->> 'messages')::int from t44 where k = 'delivered'), 1, 'delivered moves an outbound message forward');
select is(
  (select status from comms.wa_messages where wa_message_id = 'wamid.t44.out-1'),
  'delivered',
  'a late "sent" does not move delivered back'
);
select is((select (v ->> 'messages')::int from t44 where k = 'inbound'), 0, 'statuses never touch inbound rows');

-- Sweeper claims ---------------------------------------------------------------------
set local role service_role;
insert into t44 values ('claim-fresh', api.wa_claim_unrouted(25, 5, 60));
reset role;
select is(
  (select count(*)::int from jsonb_array_elements((select v from t44 where k = 'claim-fresh')) e(x)
    where x ->> 'wa_message_id' like 'wamid.t44.%'),
  0,
  'the sweeper leaves rows the fast path claimed under a minute ago'
);

update comms.wa_messages set route_claimed_at = now() - interval '2 minutes'
 where wa_message_id = 'wamid.t44.text-1';
set local role service_role;
insert into t44 values ('claim-stale', api.wa_claim_unrouted(25, 5, 60));
insert into t44 values ('claim-again', api.wa_claim_unrouted(25, 5, 60));
reset role;
select is(
  (select x ->> 'attempt' from jsonb_array_elements((select v from t44 where k = 'claim-stale')) e(x)
    where x ->> 'wa_message_id' = 'wamid.t44.text-1'),
  '2',
  'a stale claim is taken by the sweeper (attempt 2), with the contact'
);
select is(
  (select count(*)::int from jsonb_array_elements((select v from t44 where k = 'claim-again')) e(x)
    where x ->> 'wa_message_id' = 'wamid.t44.text-1'),
  0,
  'a row the sweeper just claimed is not claimed twice'
);

set local role service_role;
select api.wa_mark_routed((select (v #>> '{}')::uuid from t44 where k = 'mid'), 'risk_card', 'internal');
reset role;
select ok(
  (select routed_at is null and route_claimed_at is null and route_error = 'internal'
     from comms.wa_messages where wa_message_id = 'wamid.t44.text-1'),
  'a failed route releases the claim for the next sweep'
);
set local role service_role;
select api.wa_mark_routed((select (v #>> '{}')::uuid from t44 where k = 'mid'), 'risk_card');
insert into t44 values ('claim-done', api.wa_claim_unrouted(25, 5, 60));
reset role;
select is(
  (select count(*)::int from jsonb_array_elements((select v from t44 where k = 'claim-done')) e(x)
    where x ->> 'wa_message_id' = 'wamid.t44.text-1'),
  0,
  'a routed message is never claimed again'
);

-- Sessions ---------------------------------------------------------------------------
set local role service_role;
select api.wa_session_put(
  (select (v #>> '{}')::uuid from t44 where k = 'cid'),
  'card_shown', '{"slug": "aurelia-heights-phase-2"}'::jsonb, timestamptz '2026-10-19 12:00:00+05:30');
insert into t44 values ('session', api.wa_session_get((select (v #>> '{}')::uuid from t44 where k = 'cid')));
reset role;
select is(
  (select v ->> 'state' || ' ' || (v -> 'context' ->> 'slug') from t44 where k = 'session'),
  'card_shown aurelia-heights-phase-2',
  'a session round-trips'
);

-- Tap checks for consent RPCs ----------------------------------------------------------
insert into auth.users (id, phone) values ('7a7a0000-0000-4000-8000-000000000394', '919900000394');
set local role service_role;
select api.wa_ingest_inbound('919900000394', 'wamid.t44.tap-1', 'interactive',
  '{"interactive": {"type": "button_reply", "button_reply": {"id": "yes_alert_me"}}}'::jsonb);
select api.wa_ingest_inbound('919900000394', 'wamid.t44.text-2', 'text', '{"text": {"body": "yes"}}'::jsonb);
reset role;
update pii.wa_contacts set user_id = '7a7a0000-0000-4000-8000-000000000394' where wa_id_e164 = '+919900000394';

select ok(
  comms.is_wa_tap('wamid.t44.tap-1', '7a7a0000-0000-4000-8000-000000000394'),
  'a button tap from the linked number is a tap'
);
select ok(
  not comms.is_wa_tap('wamid.t44.text-2', '7a7a0000-0000-4000-8000-000000000394')
    and not comms.is_wa_tap('wamid.t44.tap-1', '7a7a0000-0000-4000-8000-000000000999'),
  'typed text is not a tap, and a tap never counts for another user'
);

select set_config('request.jwt.claims', jsonb_build_object(
  'role', 'authenticated', 'sub', '7a7a0000-0000-4000-8000-000000000394',
  'amr', jsonb_build_array(jsonb_build_object('method', 'whatsapp_tap', 'timestamp', 1792305000)),
  'wa_message_id', 'wamid.t44.tap-1')::text, true);
select is(comms.current_wa_tap(), 'wamid.t44.tap-1', 'a whatsapp_tap JWT for a real tap names the tap');
select set_config('request.jwt.claims', jsonb_build_object(
  'role', 'authenticated', 'sub', '7a7a0000-0000-4000-8000-000000000394',
  'amr', jsonb_build_array(jsonb_build_object('method', 'otp', 'timestamp', 1792305000)),
  'wa_message_id', 'wamid.t44.tap-1')::text, true);
select is(comms.current_wa_tap(), null, 'an ordinary session JWT is not a WhatsApp tap');

select * from finish();
rollback;
