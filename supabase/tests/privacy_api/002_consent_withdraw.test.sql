-- T45b · api.consent_withdraw (API_CONTRACTS §4.10; BUILD_PLAN §13; DATA_MODEL §6, §12 inv. 4, 7).
-- Runs on the §5b seed. Withdrawing Rohan's C-1012-04 leaves 2 parties and queues one
-- deletion request to Orbis Land's site office. The withdrawal goes through T40's triggers
-- (shares end, the relay closes); the service role cannot withdraw for a buyer; another
-- buyer's ref reads as not_found. Every ref, date and count is checked against the rows.
begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

update ops.runtime_settings set value = 'test' where key = 'env';

-- The service role cannot fake a buyer's withdrawal ---------------------------------------
set local role service_role;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"service_role"}', true);
select throws_ok(
  $$select api.consent_withdraw('C-1012-05')$$,
  '42501', null,
  'the service role has no EXECUTE on api.consent_withdraw'
);
reset role;
select throws_ok(
  $$select api.consent_withdraw('C-1012-05')$$,
  'PT403', 'forbidden',
  'even past the grant, a service-role JWT carrying Rohan''s sub is forbidden'
);
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"anon"}', true);
select throws_ok(
  $$select api.consent_withdraw('C-1012-05')$$,
  'PT401', 'auth_required',
  'an anon JWT with a forged sub is not a signed-in buyer'
);
select set_config('request.jwt.claims', '', true);
select is(
  (select count(*)::int from app.consent_withdrawals w join app.consents c on c.id = w.consent_id where c.ref = 'C-1012-05'),
  0,
  'no withdrawal was written for C-1012-05'
);

-- Another buyer's ref is not_found ----------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"582a793f-ad80-5334-8d89-275221207fea","role":"authenticated"}', true);
select throws_ok(
  $$select api.consent_withdraw('C-1012-04')$$,
  'PT404', 'not_found',
  'Aman withdrawing Rohan''s C-1012-04 gets not_found'
);
select throws_ok($$select api.consent_withdraw('C-0101-99')$$, 'PT404', 'not_found', 'an unknown ref is not_found');
select throws_ok($$select api.consent_withdraw('1012-04')$$, 'PT422', 'invalid_input', 'a malformed ref is invalid_input');
select throws_ok(
  $$select api.consent_withdraw('C-1017-03', 'whatsapp_keyword')$$,
  'PT422', 'invalid_input',
  'the RPC withdraws from the web or the app; STOP is the WhatsApp path'
);
reset role;
select set_config('request.jwt.claims', '', true);
select is(
  (select count(*)::int from app.consent_withdrawals w join app.consents c on c.id = w.consent_id
    where c.principal_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  0,
  'Rohan''s ledger has no withdrawal'
);

-- Rohan withdraws C-1012-04 -----------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t45b.w', api.consent_withdraw('c-1012-04 ')::text, true);
select set_config('t45b.who', api.who_has_my_number()::text, true);
reset role;
select set_config('request.jwt.claims', '', true);

select is(
  current_setting('t45b.w')::jsonb,
  jsonb_build_object(
    'ref', 'C-1012-04',
    'withdrawn_at', '2026-10-18T12:00:00+05:30',
    'effects', jsonb_build_array(
      'Orbis Land site office can no longer see your number.',
      'We''ve asked them to delete it.',
      '2 parties can reach you.'
    )
  ),
  'the acknowledgement (API_CONTRACTS §4.10)'
);
select results_eq(
  $$select current_setting('t45b.w')::jsonb ->> 'ref', current_setting('t45b.w')::jsonb ->> 'withdrawn_at'$$,
  $$select c.ref, core.fmt_timestamp(w.withdrawn_at) from app.consent_withdrawals w join app.consents c on c.id = w.consent_id
     where c.ref = 'C-1012-04' and c.principal_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'$$,
  'the ref and withdrawn_at are the ledger''s own'
);
select results_eq(
  $$select w.channel, w.withdrawn_at = ops.now(), w.partner_notified_at is null
      from app.consent_withdrawals w join app.consents c on c.id = w.consent_id where c.ref = 'C-1012-04'$$,
  $$values ('web'::text, true, true)$$,
  'one withdrawal row, from the web, now, partner not told yet'
);
select is(
  (select ended_reason from app.contact_shares where id = '8e83e034-942f-5fda-b237-45dd05e9fab0'),
  'withdrawn',
  'T40''s trigger ended the Orbis share'
);
select is(cardinality(app.number_holders('bff1ee72-9910-5980-a875-96a9a00b24cf')), 2, '2 distinct holders remain');
select is(current_setting('t45b.who')::jsonb ->> 'count_line', '2 parties can reach you', 'Who has my number: 2 parties');
select is(
  array(select x ->> 'ref' from jsonb_array_elements(current_setting('t45b.who')::jsonb -> 'parties') as x),
  array['C-1012-05', 'C-1015-02']::text[],
  'Larkspur and Meridian''s site office remain'
);
select is(
  current_setting('t45b.who')::jsonb -> 'ended' -> 0,
  '{"ref": "C-1012-04", "party": "Orbis Land site office", "detail": "Kestrel Park site visit", "ended_on": "2026-10-18"}'::jsonb,
  'Orbis moves to Ended, on the day of the withdrawal'
);

-- A queued deletion request ----------------------------------------------------------------
select results_eq(
  $$select d.status, d.recipient_kind, d.recipient_org_id, d.recipient_agent_id, d.number_shared,
           d.queued_at = w.withdrawn_at, d.withdrawal_id = w.id, d.buyer_user_id
      from app.partner_deletion_requests d
      join app.consents c on c.id = d.consent_id
      join app.consent_withdrawals w on w.consent_id = c.id
     where c.ref = 'C-1012-04'$$,
  $$values ('queued'::text, 'site_office'::text, 'd27c1409-5f1e-5918-965a-0629e13f407f'::uuid, null::uuid, true,
            true, true, 'bff1ee72-9910-5980-a875-96a9a00b24cf'::uuid)$$,
  'one queued deletion request to Orbis Land''s site office, for the number'
);

-- A replay returns the first withdrawal ------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('plinth.fixed_now', '2026-10-18 15:00:00+05:30', true);
select is(
  api.consent_withdraw('C-1012-04') ->> 'withdrawn_at',
  '2026-10-18T12:00:00+05:30',
  'a replay three hours later returns the first withdrawal time'
);
select set_config('plinth.fixed_now', '', true);

-- The app channel, and the agent of record
select is(
  api.consent_withdraw('C-1012-05', 'app') -> 'effects',
  '["Larkspur Realty can no longer see your number.", "We''ve asked them to delete it.", "1 party can reach you."]'::jsonb,
  'withdrawing Larkspur from the app leaves 1 party'
);
reset role;
select set_config('request.jwt.claims', '', true);
select results_eq(
  $$select (select count(*)::int from app.consent_withdrawals w join app.consents c on c.id = w.consent_id where c.ref = 'C-1012-04'),
           (select count(*)::int from app.partner_deletion_requests d join app.consents c on c.id = d.consent_id where c.ref = 'C-1012-04')$$,
  $$values (1, 1)$$,
  'still one withdrawal and one deletion request for C-1012-04'
);
select results_eq(
  $$select w.channel, d.recipient_kind, d.recipient_agent_id
      from app.consent_withdrawals w join app.consents c on c.id = w.consent_id
      join app.partner_deletion_requests d on d.withdrawal_id = w.id
     where c.ref = 'C-1012-05'$$,
  $$values ('app'::text, 'agent'::text, 'ef484441-3db2-51ab-9e09-1c3773d1b69b'::uuid)$$,
  'the agent''s deletion request names the agent of record'
);

-- The visit consent: the relay closes; no number was shared ---------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select is(
  api.consent_withdraw('C-1018-11') -> 'effects',
  '["Your relay with Northfield Estates site office is closed.", "We''ve asked them to delete what you shared.", "1 party can reach you."]'::jsonb,
  'withdrawing the Aurelia visit closes the relay and asks Northfield to delete what was shared'
);
reset role;
select set_config('request.jwt.claims', '', true);
select results_eq(
  $$select closed_reason, closed_at = ops.now() from app.relay_sessions where id = 'db21720c-ebb7-5578-a2ab-457ff4cb7ce8'$$,
  $$values ('withdrawn'::text, true)$$,
  'T40''s trigger closed the Northfield relay'
);
select is(
  (select d.number_shared from app.partner_deletion_requests d join app.consents c on c.id = d.consent_id where c.ref = 'C-1018-11'),
  false,
  'the Northfield request is for the visit details, not a number'
);

-- A consent to Plinth itself names no partner -----------------------------------------------
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
insert into app.consents (id, principal_user_id, purpose_code, recipient_kind, notice_version, evidence)
values ('00000000-0000-4000-8000-00000045b201', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'analytics', 'plinth',
        'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t45b-analytics"}');
select set_config('t45b.plinth_ref', (select ref from app.consents where id = '00000000-0000-4000-8000-00000045b201'), true);
set local role authenticated;
select set_config('t45b.plinth', api.consent_withdraw(current_setting('t45b.plinth_ref'))::text, true);
reset role;
select set_config('request.jwt.claims', '', true);
select is(
  current_setting('t45b.plinth')::jsonb -> 'effects',
  '["We''ve stopped using your data for this.", "1 party can reach you."]'::jsonb,
  'withdrawing analytics stops it; there is no partner to ask'
);
select is(
  (select count(*)::int from app.partner_deletion_requests where consent_id = '00000000-0000-4000-8000-00000045b201'),
  0,
  'no deletion request for a Plinth consent'
);

-- The queue moves forward only, and stamps the withdrawal -------------------------------------
update app.partner_deletion_requests d set status = 'sent', sent_at = ops.now()
  from app.consents c where c.id = d.consent_id and c.ref = 'C-1012-04';
select is(
  (select w.partner_notified_at = ops.now() from app.consent_withdrawals w join app.consents c on c.id = w.consent_id where c.ref = 'C-1012-04'),
  true,
  'sending the request stamps the withdrawal''s partner_notified_at'
);
select throws_ok(
  $$update app.partner_deletion_requests d set status = 'queued', sent_at = null
      from app.consents c where c.id = d.consent_id and c.ref = 'C-1012-04'$$,
  'PT409', null,
  'a sent request cannot go back to queued'
);
select throws_ok(
  $$delete from app.partner_deletion_requests$$,
  'PT409', null,
  'a deletion request is never deleted'
);

-- Wall 2: the buyer reads only their own requests (temporary grant) -------------------------
grant usage on schema app to authenticated;
grant select on app.partner_deletion_requests to authenticated;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"582a793f-ad80-5334-8d89-275221207fea","role":"authenticated"}', true);
select is((select count(*)::int from app.partner_deletion_requests), 0, 'Aman reads none of Rohan''s deletion requests');
reset role;

select * from finish();
rollback;
