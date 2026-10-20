-- T45b · api.consent_history, api.relay_renew, api.data_export_request, api.account_delete_request
-- (API_CONTRACTS §3.2; BUILD_PLAN §13; DESIGN §5b Rohan's consent history, relay lifetime,
-- Download my data). Runs on the §5b seed. Each acts only for the caller; refs, dates and ids
-- in the payloads are the rows' own.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Consent history ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t45b.h', api.consent_history()::text, true);
select set_config('request.jwt.claims', '{"sub":"582a793f-ad80-5334-8d89-275221207fea","role":"authenticated"}', true);
select set_config('t45b.ha', api.consent_history()::text, true);
reset role;
select set_config('request.jwt.claims', '', true);

select is(
  array(select x ->> 'ref' from jsonb_array_elements(current_setting('t45b.h')::jsonb -> 'items') as x),
  array(select c.ref from app.consents c where c.principal_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'
         order by c.granted_at desc, c.ref desc),
  'Rohan''s history lists his ledger rows, newest first'
);
select is(
  array(select x ->> 'ref' from jsonb_array_elements(current_setting('t45b.h')::jsonb -> 'items') as x),
  array['C-1018-11', 'C-1015-02', 'C-1012-05', 'C-1012-04', 'C-0902-01']::text[],
  'C-1018-11, C-1015-02, C-1012-05, C-1012-04, C-0902-01 (DESIGN §5b)'
);
select is(current_setting('t45b.h')::jsonb ->> 'count_line', '3 parties can reach you', 'the count stays 3 (a relay does not count)');
select results_eq(
  $$select x ->> 'status', x ->> 'status_line', x ->> 'ended_on', x ->> 'granted_on'
      from jsonb_array_elements(current_setting('t45b.h')::jsonb -> 'items') as x where x ->> 'ref' = 'C-0902-01'$$,
  $$select 'ended'::text, 'Ended 2 Oct 2026'::text, to_char(ops.ist_date(c.expires_at), 'YYYY-MM-DD'),
           to_char(ops.ist_date(c.granted_at), 'YYYY-MM-DD')
      from app.consents c where c.ref = 'C-0902-01'$$,
  'the Meridian sales office consent ended on its expiry (2 Oct 2026)'
);
select results_eq(
  $$select x ->> 'status_line', x ->> 'access_until', (x ->> 'number_shared')::boolean
      from jsonb_array_elements(current_setting('t45b.h')::jsonb -> 'items') as x where x ->> 'ref' = 'C-1015-02'$$,
  $$values ('Number shared, until 14 Nov 2026'::text, '2026-11-14'::text, true)$$,
  'Meridian''s site office: number shared until 14 Nov 2026'
);
select is(
  (select x -> 'relay' ->> 'relay_id' from jsonb_array_elements(current_setting('t45b.h')::jsonb -> 'items') as x
    where x ->> 'ref' = 'C-1018-11'),
  (select r.id::text from app.relay_sessions r where r.buyer_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  'the Aurelia visit carries its relay''s id, for api.relay_renew'
);
select is(
  (select x ->> 'notice_version' from jsonb_array_elements(current_setting('t45b.h')::jsonb -> 'items') as x
    where x ->> 'ref' = 'C-1012-04'),
  (select c.notice_version from app.consents c where c.ref = 'C-1012-04'),
  'each item names the notice version the buyer saw'
);
select is(
  array(select x ->> 'ref' from jsonb_array_elements(current_setting('t45b.ha')::jsonb -> 'items') as x),
  array['C-1017-03']::text[],
  'Aman''s history holds only his own consent'
);

-- Relay renewal (D13: 30 days after the last message unless renewed) ----------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"582a793f-ad80-5334-8d89-275221207fea","role":"authenticated"}', true);
select throws_ok(
  $$select api.relay_renew('db21720c-ebb7-5578-a2ab-457ff4cb7ce8')$$,
  'PT404', 'not_found',
  'Aman cannot renew Rohan''s relay: not_found'
);
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t45b.r', api.relay_renew('db21720c-ebb7-5578-a2ab-457ff4cb7ce8')::text, true);
reset role;
select set_config('request.jwt.claims', '', true);
select is(
  current_setting('t45b.r')::jsonb,
  '{"relay_id": "db21720c-ebb7-5578-a2ab-457ff4cb7ce8", "ref": "C-1018-11", "closes_at": "2026-11-17T12:00:00+05:30", "line": "The relay with Northfield Estates site office stays open while your deal is active, and at least until 17 Nov 2026."}'::jsonb,
  'renewing keeps the Northfield relay open to 17 Nov 2026'
);
select is(
  (select core.fmt_timestamp(closes_at) from app.relay_sessions where id = 'db21720c-ebb7-5578-a2ab-457ff4cb7ce8'),
  current_setting('t45b.r')::jsonb ->> 'closes_at',
  'closes_at is the row''s, 30 days from now'
);

-- An expired relay: renewing opens a new session for the same parties, once.
update app.relay_sessions set closed_at = ops.now() - interval '1 day', closed_reason = 'expired', deal_active = false
 where id = 'db21720c-ebb7-5578-a2ab-457ff4cb7ce8';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t45b.r2', api.relay_renew('db21720c-ebb7-5578-a2ab-457ff4cb7ce8')::text, true);
select set_config('t45b.r3', api.relay_renew('db21720c-ebb7-5578-a2ab-457ff4cb7ce8')::text, true);
reset role;
select set_config('request.jwt.claims', '', true);
select results_eq(
  $$select r.id::text, r.closed_at is null, core.fmt_timestamp(r.closes_at), r.recipient_org_id, r.phase_id
      from app.relay_sessions r
     where r.buyer_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf' and r.id <> 'db21720c-ebb7-5578-a2ab-457ff4cb7ce8'$$,
  $$values (current_setting('t45b.r2')::jsonb ->> 'relay_id', true, '2026-11-17T12:00:00+05:30'::text,
            'a3789e36-f6a8-5e75-b050-79d39f37193d'::uuid, '4da0daeb-835b-54d5-9c09-a23ee9cb4b36'::uuid)$$,
  'one new open session with Northfield for Aurelia, and the closed one stays closed'
);
select is(
  current_setting('t45b.r3')::jsonb ->> 'relay_id',
  current_setting('t45b.r2')::jsonb ->> 'relay_id',
  'renewing the old id again renews that new session instead of opening a third'
);

-- Withdrawn: nothing backs the relay any more.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select lives_ok($$select api.consent_withdraw('C-1018-11')$$, 'Rohan withdraws the Aurelia visit');
select throws_ok(
  $$select api.relay_renew('db21720c-ebb7-5578-a2ab-457ff4cb7ce8')$$,
  'PT409', 'consent_required',
  'a relay with no live visit or enquiry behind it cannot be renewed'
);
reset role;
select set_config('request.jwt.claims', '', true);

-- Download my data ----------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t45b.e1', api.data_export_request()::text, true);
select set_config('t45b.e2', api.data_export_request()::text, true);
select set_config('request.jwt.claims', '{"sub":"582a793f-ad80-5334-8d89-275221207fea","role":"authenticated"}', true);
select set_config('t45b.ea', api.data_export_request()::text, true);
reset role;
select set_config('request.jwt.claims', '', true);
select results_eq(
  $$select d.id::text, d.kind, core.fmt_timestamp(d.requested_at), core.fmt_timestamp(d.due_at)
      from app.data_requests d where d.user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'$$,
  $$select x ->> 'request_id', 'export'::text, x ->> 'requested_at', x ->> 'due_at'
      from (select current_setting('t45b.e1')::jsonb as x) as v$$,
  'one export request row for Rohan; the payload''s id and times are its own'
);
select results_eq(
  $$select x ->> 'status', x ->> 'due_at', x ->> 'status_line' from (select current_setting('t45b.e1')::jsonb as x) as v$$,
  $$values ('preparing'::text, '2026-10-19T12:00:00+05:30'::text, 'Ready by 19 Oct 2026, 12:00 pm.'::text)$$,
  'ready within 24 hours'
);
select is(
  current_setting('t45b.e2')::jsonb ->> 'request_id',
  current_setting('t45b.e1')::jsonb ->> 'request_id',
  'asking again returns the open request'
);
select isnt(
  current_setting('t45b.ea')::jsonb ->> 'request_id',
  current_setting('t45b.e1')::jsonb ->> 'request_id',
  'Aman gets his own request, never Rohan''s'
);
select is(
  (select count(*)::int from ops.audit_log a
    where a.entity = 'app.data_requests' and a.action = 'insert'
      and a.entity_id = current_setting('t45b.e1')::jsonb ->> 'request_id'
      and a.actor_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  1,
  'the request is audited with Rohan as the actor'
);

-- Delete my account -----------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t45b.d1', api.account_delete_request()::text, true);
select set_config('t45b.d2', api.account_delete_request()::text, true);
reset role;
select set_config('request.jwt.claims', '', true);
select results_eq(
  $$select d.id::text, core.fmt_timestamp(d.due_at) from app.data_requests d
     where d.user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf' and d.kind = 'erasure'$$,
  $$select x ->> 'request_id', x ->> 'due_at' from (select current_setting('t45b.d1')::jsonb as x) as v$$,
  'one erasure request row; the payload''s id and due date are its own'
);
select results_eq(
  $$select x ->> 'schema', x ->> 'status', x ->> 'due_at', x ->> 'due_line' from (select current_setting('t45b.d1')::jsonb as x) as v$$,
  $$values ('plinth.account_delete_request/1'::text, 'requested'::text, '2026-11-17T12:00:00+05:30'::text,
            'We''ll erase your account by 17 Nov 2026.'::text)$$,
  'erasure within 30 days: by 17 Nov 2026'
);
select is(
  current_setting('t45b.d2')::jsonb ->> 'request_id',
  current_setting('t45b.d1')::jsonb ->> 'request_id',
  'asking again returns the open erasure request'
);

select * from finish();
rollback;
