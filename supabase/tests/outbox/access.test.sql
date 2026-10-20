-- T42 · comms.outbox and comms.templates are edge-only (DATA_MODEL §0; BUILD_PLAN §12.1).
-- Accept: "pgTAP: only service_role can read the outbox."
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

-- A row to probe against (the migration owner can write it directly).
insert into comms.outbox (id, dedupe_key, contact_id, channel, payload)
values (
  '00000000-0000-4000-8000-0000000042a1', 't42-probe-dedupe-key',
  '00000000-0000-4000-8000-0000000042b1', 'whatsapp_session', '{}'::jsonb
);

-- anon --------------------------------------------------------------------------
set local role anon;
select throws_ok('select * from comms.outbox', '42501', null, 'anon: select comms.outbox → permission denied');
select throws_ok('select * from comms.templates', '42501', null, 'anon: select comms.templates → permission denied');
select throws_ok(
  $$select api.outbox_claim_due(5)$$, '42501', null,
  'anon: api.outbox_claim_due → permission denied (not granted)'
);
reset role;

-- authenticated -------------------------------------------------------------------
set local role authenticated;
select throws_ok('select * from comms.outbox', '42501', null, 'authenticated: select comms.outbox → permission denied');
select throws_ok(
  $$select api.outbox_resolve('00000000-0000-4000-8000-0000000042a1', 'sent')$$, '42501', null,
  'authenticated: api.outbox_resolve → permission denied (not granted)'
);
reset role;

-- pipeline_writer (no privilege at all on comms, DATA_MODEL §12 inv. 6) -----------
set local role pipeline_writer;
select throws_ok('select * from comms.outbox', '42501', null, 'pipeline_writer: select comms.outbox → permission denied');
reset role;

-- service_role: the one role that can read and resolve the outbox ----------------
set local role service_role;
select lives_ok(
  $$select 1 from comms.outbox where id = '00000000-0000-4000-8000-0000000042a1'$$,
  'service_role: select comms.outbox → allowed'
);
select lives_ok('select 1 from comms.templates', 'service_role: select comms.templates → allowed');
select is(
  (select status from comms.outbox where id = '00000000-0000-4000-8000-0000000042a1'),
  'queued',
  'the probe row starts queued'
);
select lives_ok(
  $$select api.outbox_claim_due(5)$$,
  'service_role: api.outbox_claim_due → allowed'
);
reset role;

select is(
  (select status from comms.outbox where id = '00000000-0000-4000-8000-0000000042a1'),
  'sending',
  'the claim flipped the probe row to sending (SKIP LOCKED path exercised)'
);

select * from finish();
rollback;
