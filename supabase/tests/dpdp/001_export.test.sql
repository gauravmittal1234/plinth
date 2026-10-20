-- T53 · Download my data (DESIGN §5b; BUILD_PLAN §13; API_CONTRACTS §3.5 export-data).
-- Runs on the §5b seed. Accept: "Rohan's export contains his 5 consent refs". The builder
-- (service role) reads only the request's own user; the stored ZIP gets a 7-day link and an
-- export_ready notification; the buyer opens it only with their own JWT and a sign-in code
-- from the last 10 minutes; every outcome is audited.
begin;
create extension if not exists pgtap with schema extensions;
select plan(35);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Rohan and Aman ask for their data (their own JWTs, T45b).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t53.req', api.data_export_request() ->> 'request_id', true);
select set_config('request.jwt.claims', '{"sub":"582a793f-ad80-5334-8d89-275221207fea","role":"authenticated"}', true);
select set_config('t53.areq', api.data_export_request() ->> 'request_id', true);

-- Walls: a buyer cannot reach the builder; anon and the service role cannot open a download.
select throws_ok(
  $$select api.dpdp_export_payload(current_setting('t53.req')::uuid)$$, '42501', null,
  'a buyer has no EXECUTE on the builder''s payload (not even for a request id they know)'
);
select throws_ok($$select api.dpdp_export_pending(10)$$, '42501', null, 'a buyer cannot list export requests');
select throws_ok(
  $$select api.dpdp_export_complete(current_setting('t53.req')::uuid, 'x', 1, repeat('a', 64))$$, '42501', null,
  'a buyer cannot mark an export stored'
);
reset role;
set local role anon;
select throws_ok($$select api.dpdp_export_link(gen_random_uuid())$$, '42501', null, 'anon cannot open a download');
reset role;
set local role service_role;
select throws_ok(
  $$select api.dpdp_export_link(current_setting('t53.req')::uuid)$$, '42501', null,
  'the service role cannot open a buyer''s download'
);

-- The builder ------------------------------------------------------------------------------
select ok(
  exists (
    select 1 from jsonb_array_elements(api.dpdp_export_pending(10)) as x
    where x ->> 'request_id' = current_setting('t53.req')
  ),
  'the builder sees Rohan''s open request'
);
select set_config('t53.p', api.dpdp_export_payload(current_setting('t53.req')::uuid)::text, true);
select throws_ok(
  $$select api.dpdp_export_payload(gen_random_uuid())$$, 'PT404', 'not_found',
  'an id that is not an open export request has no payload'
);
reset role;
select set_config('request.jwt.claims', '', true);

select is(current_setting('t53.p')::jsonb ->> 'schema', 'plinth.data_export/1', 'plinth.data_export/1');
select is(current_setting('t53.p')::jsonb ->> 'request_id', current_setting('t53.req'), 'the payload names its request');
select is(
  jsonb_array_length(current_setting('t53.p')::jsonb -> 'consent_history' -> 'items'),
  5,
  'Rohan''s export carries 5 consents'
);
select is(
  array(select x ->> 'ref' from jsonb_array_elements(current_setting('t53.p')::jsonb -> 'consent_history' -> 'items') as x order by 1),
  array(select c.ref from app.consents c where c.principal_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf' order by 1),
  'the 5 refs are his ledger rows'
);
select is(
  array(select x ->> 'ref' from jsonb_array_elements(current_setting('t53.p')::jsonb -> 'consent_history' -> 'items') as x order by 1),
  array['C-0902-01', 'C-1012-04', 'C-1012-05', 'C-1015-02', 'C-1018-11']::text[],
  'C-0902-01, C-1012-04, C-1012-05, C-1015-02, C-1018-11 (DESIGN §5b)'
);
select ok(
  position('C-1017-03' in current_setting('t53.p')) = 0 and position('C-1016-08' in current_setting('t53.p')) = 0,
  'no other buyer''s consent appears (Aman''s C-1017-03, Kabir''s C-1016-08)'
);
select is(
  jsonb_array_length(current_setting('t53.p')::jsonb -> 'follows'),
  (select count(*)::int from app.follows where user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  'his follows, from his rows'
);
select is(
  jsonb_array_length(current_setting('t53.p')::jsonb -> 'alerts'),
  (select count(*)::int from app.alert_subscriptions where user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  'his alert settings, from his rows'
);
select is(
  array(select x ->> 'ref' from jsonb_array_elements(current_setting('t53.p')::jsonb -> 'number_shares') as x order by 1),
  array(select c.ref from app.contact_shares s join app.consents c on c.id = s.consent_id
         where s.buyer_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf' and s.number_shared order by 1),
  'who had his number: every number share, ended ones included'
);
select is(
  current_setting('t53.p')::jsonb -> 'who_has_my_number' ->> 'count_line',
  '3 parties can reach you',
  'who has his number now (T45b''s payload)'
);
select is(
  jsonb_array_length(current_setting('t53.p')::jsonb -> 'family' -> 'notes'),
  (select count(*)::int from app.shortlist_notes where author_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  'his own shortlist notes only, not Meera''s'
);
select ok(
  position('Meera' in current_setting('t53.p')) = 0 and position('9900000318' in current_setting('t53.p')) = 0,
  'no relative''s name and never the full phone number'
);
select is(
  current_setting('t53.p')::jsonb -> 'whatsapp' ->> 'number_masked',
  (select phone_masked from app.profiles where id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  'the WhatsApp number is masked like the profile''s'
);
select is(
  (select count(*)::int from ops.audit_log a
    where a.action = 'dpdp_export_read' and a.entity_id = current_setting('t53.req')),
  1,
  'reading the payload is audited'
);

-- Stored: a 7-day link and the export_ready notification -----------------------------------
set local role service_role;
select throws_ok(
  $$select api.dpdp_export_complete(current_setting('t53.req')::uuid, current_setting('t53.areq') || '/plinth-my-data.zip', 100, repeat('a', 64))$$,
  'PT422', 'invalid_input',
  'a request can point only at its own key (never another buyer''s file)'
);
select set_config('t53.c', api.dpdp_export_complete(
  current_setting('t53.req')::uuid, current_setting('t53.req') || '/plinth-my-data.zip', 2048, repeat('b', 64)
)::text, true);
select set_config('t53.c2', api.dpdp_export_complete(
  current_setting('t53.req')::uuid, current_setting('t53.req') || '/plinth-my-data.zip', 4096, repeat('c', 64)
)::text, true);
reset role;
select results_eq(
  $$select x ->> 'status', x ->> 'link_expires_at', d.export_key, core.fmt_timestamp(d.link_expires_at)
      from (select current_setting('t53.c')::jsonb as x) as v
      join app.data_requests d on d.id = (x ->> 'request_id')::uuid$$,
  $$values ('ready'::text, '2026-10-25T12:00:00+05:30'::text, current_setting('t53.req') || '/plinth-my-data.zip',
            '2026-10-25T12:00:00+05:30'::text)$$,
  'stored: the link works for 7 days, to 25 Oct 2026'
);
select is(current_setting('t53.c2')::jsonb, current_setting('t53.c')::jsonb, 'a replay returns the first record');
select results_eq(
  $$select channel, template_code, payload ->> 'expiry_date', payload ->> 'deep_link'
      from comms.outbox where basis = 'data_request:' || current_setting('t53.req') order by channel$$,
  $$values ('push'::text, 'export_ready'::text, '25 Oct 2026'::text, '/privacy'::text),
           ('whatsapp_template'::text, 'export_ready'::text, '25 Oct 2026'::text, '/privacy'::text)$$,
  'export_ready is queued once per channel (push, and WhatsApp as he opted in)'
);

-- The buyer opens it ------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select is(api.data_export_request() ->> 'status', 'ready', 'T45b now reads ready');
select set_config('t53.l0', api.dpdp_export_link(current_setting('t53.req')::uuid)::text, true);
select set_config('request.jwt.claims', json_build_object(
  'sub', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'role', 'authenticated',
  'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint - 3600))
)::text, true);
select set_config('t53.l1', api.dpdp_export_link(current_setting('t53.req')::uuid)::text, true);
select set_config('request.jwt.claims', json_build_object(
  'sub', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'role', 'authenticated',
  'amr', json_build_array(json_build_object('method', 'token_refresh', 'timestamp', extract(epoch from now())::bigint))
)::text, true);
select set_config('t53.l2', api.dpdp_export_link(current_setting('t53.req')::uuid)::text, true);
select set_config('request.jwt.claims', json_build_object(
  'sub', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'role', 'authenticated',
  'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint - 60))
)::text, true);
select set_config('t53.l3', api.dpdp_export_link(current_setting('t53.req')::uuid)::text, true);

select set_config('request.jwt.claims', json_build_object(
  'sub', '582a793f-ad80-5334-8d89-275221207fea', 'role', 'authenticated',
  'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint - 60))
)::text, true);
select throws_ok(
  $$select api.dpdp_export_link(current_setting('t53.req')::uuid)$$, 'PT404', 'not_found',
  'Aman cannot open Rohan''s download, even with a fresh code'
);
select set_config('t53.la', api.dpdp_export_link(current_setting('t53.areq')::uuid)::text, true);
reset role;
select set_config('request.jwt.claims', '', true);

select results_eq(
  $$select x ->> 'status', x ->> 'export_key' from (select current_setting('t53.l0')::jsonb as x) as v$$,
  $$values ('sign_in_required'::text, null::text)$$,
  'no sign-in code in the JWT: sign_in_required, and no key'
);
select results_eq(
  $$select x ->> 'status', x ->> 'line', x ->> 'export_key' from (select current_setting('t53.l1')::jsonb as x) as v$$,
  $$values ('sign_in_required'::text, 'Enter a fresh sign-in code to open your download.'::text, null::text)$$,
  'a code from an hour ago is not fresh'
);
select is(current_setting('t53.l2')::jsonb ->> 'status', 'sign_in_required', 'a refreshed token is not a sign-in code');
select results_eq(
  $$select x ->> 'status', x ->> 'export_key', x ->> 'link_expires_at', x ->> 'line' from (select current_setting('t53.l3')::jsonb as x) as v$$,
  $$values ('ready'::text, current_setting('t53.req') || '/plinth-my-data.zip', '2026-10-25T12:00:00+05:30'::text,
            'The link works until 25 Oct 2026.'::text)$$,
  'a code from a minute ago opens it: ready, with his key'
);
select results_eq(
  $$select x ->> 'status', x ->> 'line', x ->> 'export_key' from (select current_setting('t53.la')::jsonb as x) as v$$,
  $$values ('preparing'::text, 'Ready by 19 Oct 2026, 12:00 pm.'::text, null::text)$$,
  'Aman''s own request is still being prepared'
);
select is(
  (select count(*)::int from ops.audit_log a
    where a.action = 'dpdp_export_link' and a.entity_id = current_setting('t53.req')
      and a.actor_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'),
  4,
  'every attempt to open it is audited, with Rohan as the actor'
);

-- Day 8: the link has expired.
select set_config('plinth.fixed_now', '2026-10-26 12:00:00+05:30', true);
set local role authenticated;
select set_config('request.jwt.claims', json_build_object(
  'sub', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'role', 'authenticated',
  'amr', json_build_array(json_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint - 30))
)::text, true);
select results_eq(
  $$select x ->> 'status', x ->> 'export_key' from api.dpdp_export_link(current_setting('t53.req')::uuid) as x$$,
  $$values ('expired'::text, null::text)$$,
  'after 7 days the link is expired, fresh code or not'
);
select isnt(
  api.data_export_request() ->> 'request_id',
  current_setting('t53.req'),
  'and asking again opens a new request'
);
reset role;
select set_config('request.jwt.claims', '', true);

select * from finish();
rollback;
