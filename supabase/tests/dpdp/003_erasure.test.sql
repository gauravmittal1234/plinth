-- T53 · Account erasure with legal-hold rules (BUILD_PLAN §13; API_CONTRACTS §3.5 delete-account).
-- Accept: "delete removes the profile and keeps consent proof rows anonymised". Runs on the
-- §5b seed: Rohan (5 consents, 3 parties holding his number, a relay, a family circle with
-- Meera, a WhatsApp contact) asks to delete his account. The ledger rows stay exactly as they
-- were (insert-only), but nothing joins them to his name or number any more; every share ends,
-- every partner gets a deletion request, and the erasure record says what was kept and why.
-- The sign-in's soft delete (GoTrue obfuscates the phone) is the edge's step (delete-account,
-- Deno tests); this file checks the database side and the completion record.
begin;
create extension if not exists pgtap with schema extensions;
select plan(41);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Extras: an unsaved upload, a stored export, a queued push.
insert into app.uploads (id, owner_user_id, kind, storage_key, sha256, mime, pages) values
  ('00000000-0000-4000-8000-0000000053e1', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'cost_sheet',
   't53/00000000-0000-4000-8000-0000000053e1.pdf', repeat('e', 64), 'application/pdf', 1);
insert into comms.outbox (id, dedupe_key, user_id, channel, payload) values
  ('00000000-0000-4000-8000-0000000053f1', 't53-erasure-queued', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'push',
   '{"deep_link": "/following", "project": "Aurelia Heights"}');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t53.exp', api.data_export_request() ->> 'request_id', true);
reset role;
set local role service_role;
select api.dpdp_export_complete(current_setting('t53.exp')::uuid, current_setting('t53.exp') || '/plinth-my-data.zip', 2048, repeat('b', 64));
reset role;

-- The ledger as it stands before the erasure.
select set_config('t53.ledger', (
  select jsonb_agg(to_jsonb(c) order by c.ref)::text
  from app.consents c where c.principal_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'
), true);

-- Rohan asks (his JWT, T45b); Aman too.
set local role authenticated;
select set_config('t53.req', api.account_delete_request() ->> 'request_id', true);
select throws_ok(
  $$select api.dpdp_erasure_run(current_setting('t53.req')::uuid)$$, '42501', null,
  'a buyer cannot run an erasure directly'
);
select throws_ok(
  $$select api.dpdp_erasure_complete(current_setting('t53.req')::uuid, true, true)$$, '42501', null,
  'a buyer cannot mark an erasure complete'
);
select set_config('request.jwt.claims', '{"sub":"582a793f-ad80-5334-8d89-275221207fea","role":"authenticated"}', true);
select set_config('t53.areq', api.account_delete_request() ->> 'request_id', true);
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok($$select api.dpdp_erasure_pending(10)$$, '42501', null, 'anon cannot list erasures');
reset role;

-- The run -------------------------------------------------------------------------------------
set local role service_role;
select throws_ok(
  $$select api.dpdp_erasure_run(current_setting('t53.req')::uuid, 'whatsapp')$$, 'PT422', 'invalid_input',
  'the channel is web or app'
);
select throws_ok(
  $$select api.dpdp_erasure_run(current_setting('t53.exp')::uuid)$$, 'PT404', 'not_found',
  'an export request is not an erasure request'
);
select throws_ok(
  $$select api.dpdp_erasure_complete(current_setting('t53.areq')::uuid, true, true)$$, 'PT409', 'conflict',
  'an erasure cannot be completed before it has run'
);
select set_config('t53.r1', api.dpdp_erasure_run(current_setting('t53.req')::uuid, 'app')::text, true);
reset role;

select results_eq(
  $$select x ->> 'user_id', x ->> 'status', x -> 'record' ->> 'status' from (select current_setting('t53.r1')::jsonb as x) as v$$,
  $$values ('bff1ee72-9910-5980-a875-96a9a00b24cf'::text, 'erasing'::text, 'erasing'::text)$$,
  'the run names the request''s own user, for the sign-in soft delete'
);
select is(
  current_setting('t53.r1')::jsonb -> 'storage_objects',
  jsonb_build_array(
    jsonb_build_object('bucket', 'exports', 'key', current_setting('t53.exp') || '/plinth-my-data.zip'),
    jsonb_build_object('bucket', 'uploads', 'key', 't53/00000000-0000-4000-8000-0000000053e1.pdf')
  ),
  'his files to remove: the export ZIP and the upload'
);

-- Removed.
select is((select count(*)::int from app.profiles where id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'), 0, 'the profile is removed');
select is(
  (select count(*)::int from app.follows where user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf')
  + (select count(*)::int from app.alert_subscriptions where user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf')
  + (select count(*)::int from app.user_roles where user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  0,
  'follows, alert settings and roles are removed'
);
select is(
  (select count(*)::int from app.family_circles where owner_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  0,
  'his family circle goes, with its invites and notes'
);
select is(
  (select count(*)::int from pii.wa_contacts where user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf')
  + (select count(*)::int from pii.wa_contacts where id = '3ef22e92-2c14-549f-9e68-a69b03cb8fa8'),
  0,
  'his WhatsApp contact (the number) is removed'
);
select results_eq(
  $$select deleted_at is not null, owner_user_id from app.uploads where id = '00000000-0000-4000-8000-0000000053e1'$$,
  $$values (true, null::uuid)$$,
  'the upload is marked deleted and names no one'
);
select results_eq(
  $$select export_key, link_expires_at <= ops.now() from app.data_requests where id = current_setting('t53.exp')::uuid$$,
  $$values (null::text, true)$$,
  'the export link is closed and its key cleared'
);
select results_eq(
  $$select status, payload, last_error from comms.outbox where id = '00000000-0000-4000-8000-0000000053f1'$$,
  $$values ('suppressed'::text, '{"erased": true}'::jsonb, 'account erased'::text)$$,
  'a queued alert is stopped and its content cleared'
);
select is(
  (select count(*)::int from comms.outbox
    where user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf' and payload <> '{"erased": true}'::jsonb),
  0,
  'every send record for him keeps only that it happened'
);

-- Kept, unchanged, and naming no one.
select is(
  (select jsonb_agg(to_jsonb(c) order by c.ref)::text
     from app.consents c where c.principal_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  current_setting('t53.ledger'),
  'the 5 consent rows are kept exactly as they were (the ledger is insert-only)'
);
select is(
  array(select ref from app.consents where principal_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf' order by ref),
  array['C-0902-01', 'C-1012-04', 'C-1012-05', 'C-1015-02', 'C-1018-11']::text[],
  'C-0902-01, C-1012-04, C-1012-05, C-1015-02, C-1018-11 stay as proof of consent'
);
select is(
  (select count(*)::int from app.consents c
     where c.principal_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'
       and (exists (select 1 from app.profiles p where p.id = c.principal_user_id)
            or exists (select 1 from pii.wa_contacts w where w.user_id = c.principal_user_id)
            or exists (select 1 from app.user_roles r where r.user_id = c.principal_user_id))),
  0,
  'anonymised: no profile, WhatsApp contact or role joins a kept consent to a name or number'
);
select ok(
  position('Rohan' in current_setting('t53.ledger')) = 0 and position('9900000318' in current_setting('t53.ledger')) = 0,
  'and the kept rows themselves carry neither his name nor his number'
);
select is(
  (select count(*)::int from app.consent_withdrawals w join app.consents c on c.id = w.consent_id
    where c.principal_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf' and w.channel = 'app'),
  5,
  'every consent is withdrawn, from the app'
);
select is(
  app.reach_line(cardinality(app.number_holders('bff1ee72-9910-5980-a875-96a9a00b24cf'))),
  'No party can reach you',
  'no party holds his number any more'
);
select results_eq(
  $$select ended_reason, count(*)::int from app.contact_shares
     where buyer_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf' group by ended_reason order by ended_reason$$,
  $$values ('erased'::text, 3), ('expired'::text, 1)$$,
  'the 3 live shares end as erased; the expired one keeps its history'
);
select is(
  (select count(*)::int from app.relay_sessions
    where buyer_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf' and closed_at is null),
  0,
  'his relay is closed'
);
select is(
  (select count(*)::int from app.partner_deletion_requests where buyer_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  5,
  'each of the 5 partners gets a deletion request'
);

-- Others are untouched.
select is((select first_name from app.profiles where id = 'de38ce39-c6cc-5c35-b8a7-ecc1a480ff58'), 'Meera', 'Meera''s profile stays');
select is(
  (select count(*)::int from app.consent_withdrawals w join app.consents c on c.id = w.consent_id
    where c.principal_user_id <> 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  0,
  'no one else''s consent is withdrawn'
);
select is(
  (select cardinality(app.number_holders('a9cd0930-a3ed-590f-b037-0c0f57fe535f'))),
  1,
  'Kabir''s share with Northfield is untouched'
);

-- The record.
select results_eq(
  $$select subject_id, core.fmt_timestamp(erased_at), core.fmt_timestamp(hold_until), (summary -> 'kept' ->> 'consents')::int,
           jsonb_array_length(summary -> 'holds')
      from app.dpdp_erasures where request_id = current_setting('t53.req')::uuid$$,
  $$values ('bff1ee72-9910-5980-a875-96a9a00b24cf'::uuid, '2026-10-18T12:00:00+05:30'::text, '2029-10-18T12:00:00+05:30'::text, 5, 4)$$,
  'the erasure record: when, what was kept (5 consents) and the hold to 18 Oct 2029'
);
select ok(
  position('Rohan' in (select summary::text from app.dpdp_erasures where request_id = current_setting('t53.req')::uuid)) = 0,
  'the record names no one'
);
select ok(
  exists (select 1 from ops.audit_log where action = 'dpdp_erasure_run' and entity_id = current_setting('t53.req')),
  'the run is audited'
);

-- A retry re-runs safely and keeps the files still owed.
set local role service_role;
select set_config('t53.r2', api.dpdp_erasure_run(current_setting('t53.req')::uuid, 'app')::text, true);
reset role;
select results_eq(
  $$select runs, jsonb_array_length(storage_objects), core.fmt_timestamp(erased_at) from app.dpdp_erasures
     where request_id = current_setting('t53.req')::uuid$$,
  $$values (2, 2, '2026-10-18T12:00:00+05:30'::text)$$,
  'a retry counts a second run and keeps both files owed and the first erasure time'
);

-- Completion: files first, then the sign-in.
set local role service_role;
select set_config('t53.c1', api.dpdp_erasure_complete(current_setting('t53.req')::uuid, true, false)::text, true);
reset role;
select results_eq(
  $$select x ->> 'status', d.completed_at is null, d.user_id
      from (select current_setting('t53.c1')::jsonb as x) as v
      join app.data_requests d on d.id = current_setting('t53.req')::uuid$$,
  $$values ('erasing'::text, true, 'bff1ee72-9910-5980-a875-96a9a00b24cf'::uuid)$$,
  'files removed but the sign-in not yet: still erasing, the request still open'
);
set local role service_role;
select set_config('t53.c2', api.dpdp_erasure_complete(current_setting('t53.req')::uuid, false, true)::text, true);
reset role;
select results_eq(
  $$select x ->> 'schema', x ->> 'status', x ->> 'status_line', jsonb_array_length(x -> 'kept_lines')
      from (select current_setting('t53.c2')::jsonb as x) as v$$,
  $$values ('plinth.account_erasure/1'::text, 'erased'::text, 'Your account was erased on 18 Oct 2026.'::text, 4)$$,
  'both steps done: erased, with what is kept and why'
);
select results_eq(
  $$select core.fmt_timestamp(completed_at), user_id from app.data_requests where id = current_setting('t53.req')::uuid$$,
  $$values ('2026-10-18T12:00:00+05:30'::text, null::uuid)$$,
  'the request is completed and no longer names the account'
);
select is(
  (select count(*)::int from app.data_requests where user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  0,
  'no DPDP request row names him any more'
);
select is(
  (select jsonb_array_length(storage_objects) from app.dpdp_erasures where request_id = current_setting('t53.req')::uuid),
  0,
  'no file is owed'
);
set local role service_role;
select results_eq(
  $$select x ->> 'status', x ->> 'user_id' from api.dpdp_erasure_run(current_setting('t53.req')::uuid) as x$$,
  $$values ('erased'::text, null::text)$$,
  'running a completed erasure returns its record and no user'
);

-- The sweep finishes what a delete-account call left (older than 15 minutes).
select is(
  (select count(*)::int from jsonb_array_elements(api.dpdp_erasure_pending(10)) as x where x ->> 'request_id' = current_setting('t53.areq')),
  0,
  'a request from this minute is left to its delete-account call'
);
select set_config('plinth.fixed_now', '2026-10-18 12:20:00+05:30', true);
select is(
  (select count(*)::int from jsonb_array_elements(api.dpdp_erasure_pending(10)) as x where x ->> 'request_id' = current_setting('t53.areq')),
  1,
  'after 15 minutes Aman''s open request is the sweep''s to finish'
);
select is(
  (select count(*)::int from jsonb_array_elements(api.dpdp_erasure_pending(10)) as x where x ->> 'request_id' = current_setting('t53.req')),
  0,
  'a completed erasure is not listed'
);
reset role;

select * from finish();
rollback;
