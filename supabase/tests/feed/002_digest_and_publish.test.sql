-- T43b · The brief's two named scenarios (WORK_BREAKDOWN T43b Accept), against
-- the real §5b seed (Rohan, Aurelia Heights Ph 2, Meera's family circle).
-- Clock rule: ops.now() is frozen at 18 Oct 2026, 12:00 IST by default; this
-- file advances it with plinth.fixed_now, same as 001_events_core.test.sql.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

update ops.runtime_settings set value = 'test' where key = 'env';

-- ---------------------------------------------------------------------------
-- "Advancing the clock to Sun 25 Oct 09:00 enqueues Rohan's weekly digest
-- only": comms.outbox starts empty (the seed's own historical events are all
-- older than ops.fan_out's 48h freshness guard, supabase/tests/outbox/access.
-- test.sql's probe row confirms nothing else lands there by default).
-- ---------------------------------------------------------------------------
select set_config('plinth.fixed_now', '2026-10-25T09:00:00+05:30', true);
select is((select count(*)::int from comms.outbox), 0, 'comms.outbox is empty before Sunday''s digest cron runs');

select ops.enqueue_digests('weekly_sun_9am');
select is(
  (select count(*)::int from comms.outbox where channel = 'whatsapp_template' and template_code = 'weekly_digest'),
  1, 'Sun 25 Oct 09:00: exactly one weekly_digest row'
);
select is(
  (select user_id from comms.outbox where template_code = 'weekly_digest'),
  'bff1ee72-9910-5980-a875-96a9a00b24cf'::uuid, '...and it is nobody but Rohan'
) ;
select is(
  (select contact_id from comms.outbox where template_code = 'weekly_digest'),
  '3ef22e92-2c14-549f-9e68-a69b03cb8fa8'::uuid, '...sent to his own WhatsApp contact'
);

select ops.enqueue_digests('daily_8am');
select is(
  (select count(*)::int from comms.outbox where template_code = 'daily_digest'),
  0, '...and only the weekly one: nobody in the seed has a daily digest subscription'
);

-- Re-running the same cadence the same IST day is a no-op (dedupe_key).
select ops.enqueue_digests('weekly_sun_9am');
select is(
  (select count(*)::int from comms.outbox where template_code = 'weekly_digest'),
  1, 'enqueue_digests is idempotent per (user, cadence, day): still exactly one row'
);

-- ---------------------------------------------------------------------------
-- "Advancing to 25 Oct with the QPR still missing and running publish
-- produces push + WhatsApp-template outbox rows for followers and no row for
-- the circle's private kinds": a fresh band_changed on Aurelia Heights Ph 2
-- (Rohan's push + whatsapp band_change subscriptions are both instant).
-- ---------------------------------------------------------------------------
select is(
  (select status from core.qpr_filings where registration_id = '7b5598db-eb62-52c5-ae7e-63fa3ed3af23' and quarter = '2026-Q3'),
  'missing', 'the Jul–Sep 2026 QPR is still missing on 25 Oct'
);

update core.score_runs set status = 'superseded' where id = 'f1bf715a-ccdc-57ca-afcc-b5dcda92abe3';
update core.band_history set to_date = '2026-10-25'
  where phase_id = '4da0daeb-835b-54d5-9c09-a23ee9cb4b36' and to_date is null;
insert into core.score_runs (id, phase_id, model_version, data_cutoff, computed_at, status, state, band, set_by, confidence, freq_low, freq_high, supersedes_run_id, published_at) values
  ('00000000-0000-4000-8000-000000430071', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'v1.2', '2026-10-25', ops.now(), 'published', 'scored', 'high', 'model', 'low', 45, 65, 'f1bf715a-ccdc-57ca-afcc-b5dcda92abe3', ops.now());
insert into core.band_history (phase_id, band, state, confidence, from_date, run_id, model_version) values
  ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'high', 'scored', 'low', '2026-10-25', '00000000-0000-4000-8000-000000430071', 'v1.2');

select is(
  (select count(*)::int from comms.outbox where basis = '96e28ecd-b8a4-5fb5-807b-5db93fc61fdf'), -- Rohan: push/band_change
  1, 'the publish produces a push outbox row for the follower''s push/band_change subscription'
);
select is(
  (select count(*)::int from comms.outbox where basis = '22269732-6aaf-56ec-a74c-3285d3cf25f4'), -- Rohan: whatsapp/band_change
  1, 'the publish produces a whatsapp_template outbox row for the follower''s whatsapp/band_change subscription'
);
select is(
  (select channel from comms.outbox where basis = '22269732-6aaf-56ec-a74c-3285d3cf25f4'),
  'whatsapp_template', '...sent as an approved utility template, not a session message'
);

-- The circle: Meera (joined, scope_all) has no alert_subscriptions or follow
-- of her own, so fan-out — which only ever reads a follower's own subscription
-- (20261122000200's header) — never reaches her, "private" payment_stage kind
-- or otherwise.
select is(
  (select count(*)::int from comms.outbox
    where user_id = 'de38ce39-c6cc-5c35-b8a7-ecc1a480ff58'
       or contact_id in (select id from pii.wa_contacts where user_id = 'de38ce39-c6cc-5c35-b8a7-ecc1a480ff58')),
  0, 'no row at all for Meera, the circle member — payment_stage or any other kind'
);

select * from finish();
rollback;
