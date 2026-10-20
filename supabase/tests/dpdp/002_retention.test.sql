-- T53 · The daily retention sweep (BUILD_PLAN §13 retention table; API_CONTRACTS §5.5).
-- Accept: "the sweep with the clock advanced 31 days deletes an unsaved upload and keeps a
-- saved one". Also: voice notes at 24 h, export ZIPs after their 7-day link, WhatsApp messages
-- anonymised 24 months after the conversation's last activity. The SQL side lists what is due
-- and marks rows only after Storage removed the files (retention-sweep does the removal).
begin;
create extension if not exists pgtap with schema extensions;
select plan(24);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Fixtures (18 Oct 2026, 12:00 IST): Rohan's unsaved and saved cost sheets and a voice note.
insert into app.uploads (id, owner_user_id, kind, storage_key, sha256, mime, pages, saved) values
  ('00000000-0000-4000-8000-0000000053a1', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'cost_sheet',
   't53/00000000-0000-4000-8000-0000000053a1.pdf', repeat('1', 64), 'application/pdf', 2, false),
  ('00000000-0000-4000-8000-0000000053a2', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'cost_sheet',
   't53/00000000-0000-4000-8000-0000000053a2.pdf', repeat('2', 64), 'application/pdf', 2, true),
  ('00000000-0000-4000-8000-0000000053a3', 'bff1ee72-9910-5980-a875-96a9a00b24cf', 'voice_note',
   't53/00000000-0000-4000-8000-0000000053a3.ogg', repeat('3', 64), 'audio/ogg', null, false);

-- WhatsApp: a contact silent since Sep 2024, and Rohan's contact with an old and a recent message.
insert into pii.wa_contacts (id, wa_id_e164, utility_opt_in) values
  ('00000000-0000-4000-8000-0000000053c1', '+919900000390', false);
insert into comms.wa_messages (id, contact_id, direction, wa_message_id, type, payload, status, created_at, retain_until) values
  ('00000000-0000-4000-8000-0000000053d1', '00000000-0000-4000-8000-0000000053c1', 'in', 'wamid.t53.silent', 'text',
   '{"text": {"body": "Is Aurelia on time?"}}', 'received', '2024-09-01 10:00+05:30', '2026-09-01 10:00+05:30'),
  ('00000000-0000-4000-8000-0000000053d2', '3ef22e92-2c14-549f-9e68-a69b03cb8fa8', 'in', 'wamid.t53.old', 'text',
   '{"text": {"body": "Hi"}}', 'received', '2024-08-01 10:00+05:30', '2026-08-01 10:00+05:30'),
  ('00000000-0000-4000-8000-0000000053d3', '3ef22e92-2c14-549f-9e68-a69b03cb8fa8', 'in', 'wamid.t53.recent', 'text',
   '{"text": {"body": "Kestrel"}}', 'received', '2026-10-10 10:00+05:30', '2028-10-10 10:00+05:30');

-- Rohan's export, stored today (link to 25 Oct).
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t53.req', api.data_export_request() ->> 'request_id', true);
reset role;
select set_config('request.jwt.claims', '', true);

set local role service_role;
select lives_ok(
  $$select api.dpdp_export_complete(current_setting('t53.req')::uuid, current_setting('t53.req') || '/plinth-my-data.zip', 2048, repeat('b', 64))$$,
  'the export is stored'
);

-- Day 0: nothing of these is due yet.
select is(
  (select count(*)::int from jsonb_array_elements(api.retention_due(500)) as x
    where x ->> 'id' in ('00000000-0000-4000-8000-0000000053a1', '00000000-0000-4000-8000-0000000053a2',
                          '00000000-0000-4000-8000-0000000053a3', current_setting('t53.req'))),
  0,
  'day 0: no upload, voice note or export is due'
);

-- Messages: the silent conversation is anonymised; Rohan's live one is not.
select is(api.retention_anonymise_messages(5000) ->> 'messages', '1', 'one message is past 24 months of silence');
reset role;
select results_eq(
  $$select id::text, payload from comms.wa_messages where id::text like '00000000-0000-4000-8000-0000000053d%' order by id$$,
  $$values ('00000000-0000-4000-8000-0000000053d1'::text, '{"anonymised": true}'::jsonb),
           ('00000000-0000-4000-8000-0000000053d2'::text, '{"text": {"body": "Hi"}}'::jsonb),
           ('00000000-0000-4000-8000-0000000053d3'::text, '{"text": {"body": "Kestrel"}}'::jsonb)$$,
  'the silent contact''s message loses its content; a conversation active this month keeps its history'
);
select is(
  (select count(*)::int from comms.wa_messages where id = '00000000-0000-4000-8000-0000000053d1' and wa_message_id = 'wamid.t53.silent'),
  1,
  'the anonymised row stays (Meta id, direction, dates), so redeliveries stay idempotent'
);

-- Day 1, 13:00: the voice note is past its 24 h.
select set_config('plinth.fixed_now', '2026-10-19 13:00:00+05:30', true);
set local role service_role;
select set_config('t53.d1', api.retention_due(500)::text, true);
reset role;
select is(
  array(select x ->> 'kind' || ' ' || (x ->> 'bucket') from jsonb_array_elements(current_setting('t53.d1')::jsonb) as x
         where x ->> 'id' like '00000000-0000-4000-8000-0000000053a%'),
  array['voice voice-tmp']::text[],
  'after 24 h the voice note is due (bucket voice-tmp); the uploads are not'
);

-- Day 8: the export link has expired.
select set_config('plinth.fixed_now', '2026-10-26 12:00:00+05:30', true);
set local role service_role;
select set_config('t53.d8', api.retention_due(500)::text, true);
select is(
  (select x ->> 'bucket' || ' ' || (x ->> 'key') from jsonb_array_elements(current_setting('t53.d8')::jsonb) as x
    where x ->> 'id' = current_setting('t53.req')),
  'exports ' || current_setting('t53.req') || '/plinth-my-data.zip',
  'after 7 days the export ZIP is due'
);
select is(
  api.retention_mark_deleted((select jsonb_agg(x) from jsonb_array_elements(current_setting('t53.d8')::jsonb) as x
                               where x ->> 'id' = current_setting('t53.req'))) ->> 'exports',
  '1',
  'marking it clears one export'
);
reset role;
select results_eq(
  $$select export_key, completed_at is not null from app.data_requests where id = current_setting('t53.req')::uuid$$,
  $$values (null::text, true)$$,
  'the request keeps its record, without a key'
);

-- Day 29: the unsaved upload is not due yet.
select set_config('plinth.fixed_now', '2026-11-16 12:00:00+05:30', true);
set local role service_role;
select is(
  (select count(*)::int from jsonb_array_elements(api.retention_due(500)) as x
    where x ->> 'id' = '00000000-0000-4000-8000-0000000053a1'),
  0,
  'day 29: the unsaved upload is still within its 30 days'
);

-- Day 31: the sweep.
select set_config('plinth.fixed_now', '2026-11-18 12:00:00+05:30', true);
select set_config('t53.d31', api.retention_due(500)::text, true);
reset role;
select is(
  array(select x ->> 'id' from jsonb_array_elements(current_setting('t53.d31')::jsonb) as x
         where x ->> 'id' like '00000000-0000-4000-8000-0000000053a%' order by 1),
  array['00000000-0000-4000-8000-0000000053a1', '00000000-0000-4000-8000-0000000053a3']::text[],
  'day 31: the unsaved upload and the voice note are due; the saved upload is not'
);
select is(
  (select x ->> 'bucket' || ' ' || (x ->> 'key') from jsonb_array_elements(current_setting('t53.d31')::jsonb) as x
    where x ->> 'id' = '00000000-0000-4000-8000-0000000053a1'),
  'uploads t53/00000000-0000-4000-8000-0000000053a1.pdf',
  'the unsaved upload is named by its bucket and key, for the Storage API'
);

set local role service_role;
select is(
  api.retention_mark_deleted(current_setting('t53.d31')::jsonb),
  '{"uploads": 1, "voice_notes": 1, "exports": 0}'::jsonb,
  'the sweep marks one upload and one voice note'
);
select is(
  api.retention_mark_deleted(current_setting('t53.d31')::jsonb),
  '{"uploads": 0, "voice_notes": 0, "exports": 0}'::jsonb,
  'a replay marks nothing twice'
);
select is(
  api.retention_mark_deleted('[{"kind": "upload", "id": "00000000-0000-4000-8000-0000000053a2", "key": "t53/00000000-0000-4000-8000-0000000053a2.pdf"}]'::jsonb),
  '{"uploads": 0, "voice_notes": 0, "exports": 0}'::jsonb,
  'naming the saved upload marks nothing: only rows still due are marked'
);
select throws_ok(
  $$select api.retention_mark_deleted('[{"kind": "profile", "id": "x"}]'::jsonb)$$,
  'PT422', 'invalid_input',
  'anything but {kind, id, key} items is refused'
);
reset role;

select ok(
  (select deleted_at is not null from app.uploads where id = '00000000-0000-4000-8000-0000000053a1'),
  'the unsaved upload is deleted (deleted_at set)'
);
select results_eq(
  $$select deleted_at is null, saved from app.uploads where id = '00000000-0000-4000-8000-0000000053a2'$$,
  $$values (true, true)$$,
  'the saved upload is kept'
);
select ok(
  (select deleted_at is not null from app.uploads where id = '00000000-0000-4000-8000-0000000053a3'),
  'the voice note is deleted'
);
select ok(
  (select count(*) >= 2 from ops.audit_log where action = 'retention_delete'),
  'each marking pass is audited (counts only)'
);
select ok(
  exists (select 1 from ops.audit_log where action = 'retention_anonymise' and (after ->> 'messages')::int = 1),
  'the anonymising pass is audited'
);

-- Walls and schedule.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select throws_ok($$select api.retention_due(10)$$, '42501', null, 'a buyer cannot list what is due');
select throws_ok($$select api.retention_anonymise_messages(10)$$, '42501', null, 'a buyer cannot run the sweep');
reset role;
select set_config('request.jwt.claims', '', true);

select results_eq(
  $$select jobname::text, schedule::text from cron.job where jobname in ('dpdp-retention-sweep', 'dpdp-export-build') order by jobname$$,
  $$values ('dpdp-export-build'::text, '*/15 * * * *'::text), ('dpdp-retention-sweep'::text, '0 21 * * *'::text)$$,
  'pg_cron: the export builder every 15 minutes, the sweep daily at 21:00 UTC (02:30 IST)'
);

select * from finish();
rollback;
