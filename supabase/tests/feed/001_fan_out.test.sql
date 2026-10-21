-- T43b · ops.fan_out: dedup, quiet hours, consent/pref gating, the circle
-- (WORK_BREAKDOWN T43b; DESIGN §5b C-32 quiet hours; AGENTS rule 9 ops.now()).
-- Synthetic fixtures (own phase/users), so the counts below are absolute, not
-- diffs against the §5b seed. Clock rule: ops.now() is frozen; this file moves
-- it forward with plinth.fixed_now like 001_events_core.test.sql does.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

update ops.runtime_settings set value = 'test' where key = 'env';
select set_config('plinth.fixed_now', '2026-10-18T12:00:00+05:30', true);

-- Fixture: a phase, a follower with push+whatsapp band_change subscriptions, a
-- second follower who has disabled push, a WhatsApp contact that later goes
-- quiet (STOP), and an unrelated family-circle member who never followed.
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-000000430001', 't43b-group', 'T43b Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-000000430002', 't43b-project', 'T43b Project', '00000000-0000-4000-8000-000000430001');
insert into core.phases (id, project_id, slug, name) values ('00000000-0000-4000-8000-000000430003', '00000000-0000-4000-8000-000000430002', 't43b-phase', 'T43b Phase');

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000430011', '{"first_name":"T43b Follower"}'),
  ('00000000-0000-4000-8000-000000430012', '{"first_name":"T43b NoPush"}'),
  ('00000000-0000-4000-8000-000000430013', '{"first_name":"T43b CircleMember"}');

insert into app.follows (id, user_id, phase_id, follow_type, followed_at) values
  ('00000000-0000-4000-8000-000000430021', '00000000-0000-4000-8000-000000430011', '00000000-0000-4000-8000-000000430003', 'watching', '2026-01-01T00:00:00+05:30'),
  ('00000000-0000-4000-8000-000000430022', '00000000-0000-4000-8000-000000430012', '00000000-0000-4000-8000-000000430003', 'watching', '2026-01-01T00:00:00+05:30');

insert into app.alert_subscriptions (id, user_id, channel, kind, cadence, enabled, quiet_from, quiet_to) values
  ('00000000-0000-4000-8000-000000430031', '00000000-0000-4000-8000-000000430011', 'push', 'band_change', 'instant', true, '22:00', '08:00'),
  ('00000000-0000-4000-8000-000000430032', '00000000-0000-4000-8000-000000430011', 'whatsapp', 'band_change', 'instant', true, '22:00', '08:00'),
  ('00000000-0000-4000-8000-000000430033', '00000000-0000-4000-8000-000000430012', 'push', 'band_change', 'instant', false, '22:00', '08:00');

insert into pii.wa_contacts (id, wa_id_e164, user_id, utility_opt_in) values
  ('00000000-0000-4000-8000-000000430041', '+919900043001', '00000000-0000-4000-8000-000000430011', true);

-- The circle member: joined, scope_all, but no app.follows of their own.
insert into app.family_circles (id, owner_user_id) values ('00000000-0000-4000-8000-000000430051', '00000000-0000-4000-8000-000000430011');
insert into app.family_members (id, circle_id, member_user_id, invite_code, scope_all, status, invited_at, expires_at, joined_at, joined_via) values
  ('00000000-0000-4000-8000-000000430052', '00000000-0000-4000-8000-000000430051', '00000000-0000-4000-8000-000000430013', 'T4B-001', true, 'joined', '2026-01-01T00:00:00+05:30', '2026-01-08T00:00:00+05:30', '2026-01-02T00:00:00+05:30', 'app');

-- ---------------------------------------------------------------------------
-- A band_changed event, right now (outside quiet hours): exactly one push row
-- and one whatsapp_template row for the one subscribed, enabled follower.
-- ---------------------------------------------------------------------------
insert into core.events (id, phase_id, kind, occurred_on, detected_at, public, before, after) values
  ('00000000-0000-4000-8000-000000430061', '00000000-0000-4000-8000-000000430003', 'band_changed', '2026-10-18', ops.now(), true,
   '{"band":"moderate"}'::jsonb, '{"band":"elevated"}'::jsonb);

select is(
  (select count(*)::int from comms.outbox where basis = '00000000-0000-4000-8000-000000430031'),
  1, 'exactly one push row for the follower''s own subscription'
);
select is(
  (select count(*)::int from comms.outbox where basis = '00000000-0000-4000-8000-000000430032'),
  1, 'exactly one whatsapp_template row for the follower''s own subscription'
);
select is(
  (select count(*)::int from comms.outbox where basis = '00000000-0000-4000-8000-000000430033'),
  0, 'the disabled push subscription gets nothing'
);
select is(
  (select status from comms.outbox where basis = '00000000-0000-4000-8000-000000430031'),
  'queued', 'outside quiet hours: the row queues normally'
);
select ok(
  (select not_before <= ops.now() from comms.outbox where basis = '00000000-0000-4000-8000-000000430031'),
  'outside quiet hours: not_before is now, not deferred'
);
select is(
  (select count(*)::int from comms.outbox
    where user_id = '00000000-0000-4000-8000-000000430013'
       or contact_id in (select id from pii.wa_contacts where user_id = '00000000-0000-4000-8000-000000430013')),
  0, 'the family circle member (joined, no follow of their own) gets nothing'
);

-- Re-running fan_out for the same event is a no-op (dedupe_key): still exactly
-- one row per subscription, never two.
select ops.fan_out('00000000-0000-4000-8000-000000430061'::uuid);
select is(
  (select count(*)::int from comms.outbox where basis in ('00000000-0000-4000-8000-000000430031', '00000000-0000-4000-8000-000000430032')),
  2, 'calling ops.fan_out twice for the same event still queues exactly one row per subscription'
);

-- ---------------------------------------------------------------------------
-- Quiet hours: the same subscriptions, a new event detected at 23:00 IST,
-- defer to 08:00 the next morning.
-- ---------------------------------------------------------------------------
select set_config('plinth.fixed_now', '2026-10-19T23:00:00+05:30', true);
insert into core.events (id, phase_id, kind, occurred_on, detected_at, public, before, after) values
  ('00000000-0000-4000-8000-000000430062', '00000000-0000-4000-8000-000000430003', 'band_changed', '2026-10-19', ops.now(), true,
   '{"band":"elevated"}'::jsonb, '{"band":"high"}'::jsonb);
select is(
  (select not_before > ops.now() from comms.outbox where basis = '00000000-0000-4000-8000-000000430031' and dedupe_key like '%430062%'),
  true, 'quiet hours (22:00-08:00 IST): a push row queued at 23:00 is deferred past now'
);
select is(
  (select not_before::date from comms.outbox where basis = '00000000-0000-4000-8000-000000430031' and dedupe_key like '%430062%'),
  '2026-10-20'::date, 'deferred to 08:00 the next IST morning'
);

-- ---------------------------------------------------------------------------
-- Withdrawn consent (WhatsApp STOP): the whatsapp row stops; push is untouched.
-- ---------------------------------------------------------------------------
update pii.wa_contacts set stopped_at = ops.now() where id = '00000000-0000-4000-8000-000000430041';
insert into core.events (id, phase_id, kind, occurred_on, detected_at, public, before, after) values
  ('00000000-0000-4000-8000-000000430063', '00000000-0000-4000-8000-000000430003', 'band_changed', '2026-10-19', ops.now(), true,
   '{"band":"high"}'::jsonb, '{"band":"severe"}'::jsonb);
select is(
  (select count(*)::int from comms.outbox where basis = '00000000-0000-4000-8000-000000430032' and dedupe_key like '%430063%'),
  0, 'a WhatsApp contact that replied STOP (withdrawn consent) gets no whatsapp row'
);
select is(
  (select count(*)::int from comms.outbox where basis = '00000000-0000-4000-8000-000000430031' and dedupe_key like '%430063%'),
  1, '...but their push subscription is unaffected'
);

-- An unsubscribed pref (enabled = false, set after the fact) also gets nothing.
update app.alert_subscriptions set enabled = false where id = '00000000-0000-4000-8000-000000430031';
insert into core.events (id, phase_id, kind, occurred_on, detected_at, public, before, after) values
  ('00000000-0000-4000-8000-000000430064', '00000000-0000-4000-8000-000000430003', 'band_changed', '2026-10-19', ops.now(), true,
   '{"band":"severe"}'::jsonb, '{"band":"high"}'::jsonb);
select is(
  (select count(*)::int from comms.outbox where basis = '00000000-0000-4000-8000-000000430031' and dedupe_key like '%430064%'),
  0, 'an unsubscribed pref (enabled = false) gets nothing'
);

-- A non-public event (e.g. a re-score in progress) never fans out.
insert into core.events (id, phase_id, kind, occurred_on, detected_at, public, after) values
  ('00000000-0000-4000-8000-000000430065', '00000000-0000-4000-8000-000000430003', 'rescore_started', '2026-10-19', ops.now(), false, '{}'::jsonb);
select is(
  (select count(*)::int from comms.outbox where dedupe_key like '%430065%'),
  0, 'a non-public event (rescore_started) never fans out'
);

select * from finish();
rollback;
