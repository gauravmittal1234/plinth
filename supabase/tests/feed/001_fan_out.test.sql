-- T43b · ops.fan_out: dedup, quiet hours, consent/pref gating, the circle
-- (WORK_BREAKDOWN T43b; DESIGN §5b C-32 quiet hours; AGENTS rule 9 ops.now()).
-- Synthetic fixtures (own phase/users), so the counts below are absolute, not
-- diffs against the §5b seed. Clock rule: ops.now() is frozen; this file moves
-- it forward with plinth.fixed_now like 001_events_core.test.sql does.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

update ops.runtime_settings set value = 'test' where key = 'env';
select set_config('plinth.fixed_now', '2026-10-18T12:00:00+05:30', true);

-- Fixture: a phase, a follower with push+whatsapp band_change subscriptions, a
-- second follower who has disabled push, a WhatsApp contact that later goes
-- quiet (STOP), and the follower's family circle (lead, M2 gate gap 6): a member
-- with an account but no channel of their own, a WhatsApp-only relative who
-- joined for this phase, an account member (scope_all) with their own push
-- subscription, and a relative whose invite names another phase.
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-000000430001', 't43b-group', 'T43b Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-000000430002', 't43b-project', 'T43b Project', '00000000-0000-4000-8000-000000430001');
insert into core.phases (id, project_id, slug, name) values
  ('00000000-0000-4000-8000-000000430003', '00000000-0000-4000-8000-000000430002', 't43b-phase', 'T43b Phase'),
  ('00000000-0000-4000-8000-000000430004', '00000000-0000-4000-8000-000000430002', 't43b-phase-other', 'T43b Other Phase');

insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000430011', '{"first_name":"T43b Follower"}'),
  ('00000000-0000-4000-8000-000000430012', '{"first_name":"T43b NoPush"}'),
  ('00000000-0000-4000-8000-000000430013', '{"first_name":"T43b CircleMember"}'),
  ('00000000-0000-4000-8000-000000430014', '{"first_name":"T43b CirclePush"}');

insert into app.follows (id, user_id, phase_id, follow_type, followed_at) values
  ('00000000-0000-4000-8000-000000430021', '00000000-0000-4000-8000-000000430011', '00000000-0000-4000-8000-000000430003', 'watching', '2026-01-01T00:00:00+05:30'),
  ('00000000-0000-4000-8000-000000430022', '00000000-0000-4000-8000-000000430012', '00000000-0000-4000-8000-000000430003', 'watching', '2026-01-01T00:00:00+05:30');

insert into app.alert_subscriptions (id, user_id, channel, kind, cadence, enabled, quiet_from, quiet_to) values
  ('00000000-0000-4000-8000-000000430031', '00000000-0000-4000-8000-000000430011', 'push', 'band_change', 'instant', true, '22:00', '08:00'),
  ('00000000-0000-4000-8000-000000430032', '00000000-0000-4000-8000-000000430011', 'whatsapp', 'band_change', 'instant', true, '22:00', '08:00'),
  ('00000000-0000-4000-8000-000000430033', '00000000-0000-4000-8000-000000430012', 'push', 'band_change', 'instant', false, '22:00', '08:00'),
  ('00000000-0000-4000-8000-000000430034', '00000000-0000-4000-8000-000000430014', 'push', 'band_change', 'instant', true, '22:00', '08:00');

insert into pii.wa_contacts (id, wa_id_e164, user_id, utility_opt_in) values
  ('00000000-0000-4000-8000-000000430041', '+919900043001', '00000000-0000-4000-8000-000000430011', true),
  ('00000000-0000-4000-8000-000000430042', '+919900043002', null, true),
  ('00000000-0000-4000-8000-000000430043', '+919900043003', null, true);

-- The circle member: joined, scope_all, but no app.follows of their own.
insert into app.family_circles (id, owner_user_id) values ('00000000-0000-4000-8000-000000430051', '00000000-0000-4000-8000-000000430011');
insert into app.family_members (id, circle_id, member_user_id, invite_code, scope_all, status, invited_at, expires_at, joined_at, joined_via) values
  ('00000000-0000-4000-8000-000000430052', '00000000-0000-4000-8000-000000430051', '00000000-0000-4000-8000-000000430013', 'T4B-001', true, 'joined', '2026-01-01T00:00:00+05:30', '2026-01-08T00:00:00+05:30', '2026-01-02T00:00:00+05:30', 'app'),
  ('00000000-0000-4000-8000-000000430054', '00000000-0000-4000-8000-000000430051', '00000000-0000-4000-8000-000000430014', 'T4B-004', true, 'joined', '2026-01-01T00:00:00+05:30', '2026-01-08T00:00:00+05:30', '2026-01-02T00:00:00+05:30', 'app');
insert into app.family_members (id, circle_id, wa_contact_id, invite_code, scope_phase_ids, status, invited_at, expires_at, joined_at, joined_via) values
  ('00000000-0000-4000-8000-000000430053', '00000000-0000-4000-8000-000000430051', '00000000-0000-4000-8000-000000430042', 'T4B-003', array['00000000-0000-4000-8000-000000430003']::uuid[], 'joined', '2026-01-01T00:00:00+05:30', '2026-01-08T00:00:00+05:30', '2026-01-02T00:00:00+05:30', 'whatsapp'),
  ('00000000-0000-4000-8000-000000430055', '00000000-0000-4000-8000-000000430051', '00000000-0000-4000-8000-000000430043', 'T4B-005', array['00000000-0000-4000-8000-000000430004']::uuid[], 'joined', '2026-01-01T00:00:00+05:30', '2026-01-08T00:00:00+05:30', '2026-01-02T00:00:00+05:30', 'whatsapp');

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
  0, 'a circle member with no channel of their own (no subscription, no WhatsApp contact) gets nothing'
);

-- The circle (gap 6): the same alerts as the owner, through each member's own opted-in channel.
select results_eq(
  $$select dedupe_key, channel, template_code, user_id is null, basis from comms.outbox
     where contact_id = '00000000-0000-4000-8000-000000430042'$$,
  $$values ('alert:00000000-0000-4000-8000-000000430061:member:00000000-0000-4000-8000-000000430053'::text,
            'whatsapp_template'::text, 'band_change_alert'::text, true, 'family_member:00000000-0000-4000-8000-000000430053'::text)$$,
  'a WhatsApp-only relative who joined for the phase gets its band_change_alert template, on their own contact'
);
select is(
  (select payload from comms.outbox where contact_id = '00000000-0000-4000-8000-000000430042'),
  (select payload from comms.outbox where basis = '00000000-0000-4000-8000-000000430032'),
  '...the same payload the follower''s template carries'
);
select is(
  (select count(*)::int from comms.outbox where basis = '00000000-0000-4000-8000-000000430034' and channel = 'push'),
  1, 'an account member (scope_all, the owner follows the phase) gets a push through their own subscription'
);
select is(
  (select count(*)::int from comms.outbox where contact_id = '00000000-0000-4000-8000-000000430043'),
  0, 'a relative whose invite names another phase gets nothing for this one'
);
select is(
  (select payload ->> 'header_image_url' from comms.outbox where basis = '00000000-0000-4000-8000-000000430032'),
  core.public_base_url() || '/cards/risk/t43b-phase.png',
  'band_change_alert carries its image header: the phase''s risk card (no published run yet, so no run param)'
);
select is(
  (select payload ->> 'session_text' from comms.outbox where basis = '00000000-0000-4000-8000-000000430032'),
  'T43b Phase: delivery risk moved from Moderate to Elevated',
  'a session alert names the project and the new band, from the event''s own before/after'
);

-- Re-running fan_out for the same event is a no-op (dedupe_key): still exactly
-- one row per subscription, never two.
select ops.fan_out('00000000-0000-4000-8000-000000430061'::uuid);
select is(
  (select count(*)::int from comms.outbox where basis in ('00000000-0000-4000-8000-000000430031', '00000000-0000-4000-8000-000000430032')),
  2, 'calling ops.fan_out twice for the same event still queues exactly one row per subscription'
);
select is(
  (select count(*)::int from comms.outbox where contact_id = '00000000-0000-4000-8000-000000430042'),
  1, '...and exactly one row per circle member'
);

-- Orders reach the circle (filing_alert); a price list never does (not a circle kind).
insert into core.events (id, phase_id, kind, occurred_on, detected_at, public, before, after) values
  ('00000000-0000-4000-8000-000000430066', '00000000-0000-4000-8000-000000430003', 'order_decided', '2026-10-18', ops.now(), true,
   null, '{"order_type":"complaint order"}'::jsonb),
  ('00000000-0000-4000-8000-000000430067', '00000000-0000-4000-8000-000000430003', 'price_list_published', '2026-10-18', ops.now(), true,
   null, '{}'::jsonb);
select is(
  array(select template_code from comms.outbox
         where contact_id = '00000000-0000-4000-8000-000000430042' and dedupe_key like '%430066%'),
  array['filing_alert'],
  'an order decided on the phase reaches the relative as filing_alert'
);
select is(
  (select count(*)::int from comms.outbox
    where dedupe_key like '%430067%'
      and (contact_id in ('00000000-0000-4000-8000-000000430042', '00000000-0000-4000-8000-000000430043')
           or user_id in ('00000000-0000-4000-8000-000000430013', '00000000-0000-4000-8000-000000430014'))),
  0, 'a price list never reaches the circle (only band changes, filings, orders and extensions do)'
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
update pii.wa_contacts set stopped_at = ops.now()
 where id in ('00000000-0000-4000-8000-000000430041', '00000000-0000-4000-8000-000000430042');
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
select is(
  (select count(*)::int from comms.outbox where contact_id = '00000000-0000-4000-8000-000000430042' and dedupe_key like '%430063%'),
  0, 'a circle relative who replied STOP gets nothing either'
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
