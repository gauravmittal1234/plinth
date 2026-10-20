-- T40 · Trigger 2, the number-holder cap (DATA_MODEL §6, §12 inv. 4; BUILD_PLAN §13).
-- At most 3 parties hold a buyer's number at once in any rolling 30 days. The cap
-- counts distinct active recipients (INTEGRATION_NOTES T40; CONFLICTS C-40): a
-- second share to a party that already holds the number is not a new holder; an
-- ended or expired share, a relay and a relay-only share do not count.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Fixture ----------------------------------------------------------------------
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000400201', '{"first_name":"T40 Capped"}'),
  ('00000000-0000-4000-8000-000000400202', '{"first_name":"T40 Other"}');
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-000000400211', 't40-c2-group', 'T40 C2 Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-000000400212', 't40-c2-project', 'T40 C2 Project', '00000000-0000-4000-8000-000000400211');
insert into core.phases (id, project_id, slug, name) values ('00000000-0000-4000-8000-000000400213', '00000000-0000-4000-8000-000000400212', 't40-c2-phase', 'T40 C2 Phase');

-- Orgs A ...221, B ...222, D ...224, E ...225; agent C ...223.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400201","role":"authenticated"}', true);
insert into app.consents (id, principal_user_id, purpose_code, recipient_kind, recipient_org_id, recipient_agent_id, phase_id, notice_version, evidence) values
  ('00000000-0000-4000-8000-000000400231', '00000000-0000-4000-8000-000000400201', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400221', null, '00000000-0000-4000-8000-000000400213', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c2-a"}'),
  ('00000000-0000-4000-8000-000000400232', '00000000-0000-4000-8000-000000400201', 'number_share', 'sales_office', '00000000-0000-4000-8000-000000400222', null, '00000000-0000-4000-8000-000000400213', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c2-b"}'),
  ('00000000-0000-4000-8000-000000400233', '00000000-0000-4000-8000-000000400201', 'number_share', 'agent', null, '00000000-0000-4000-8000-000000400223', '00000000-0000-4000-8000-000000400213', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c2-c"}'),
  ('00000000-0000-4000-8000-000000400234', '00000000-0000-4000-8000-000000400201', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400224', null, '00000000-0000-4000-8000-000000400213', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c2-d"}'),
  ('00000000-0000-4000-8000-000000400235', '00000000-0000-4000-8000-000000400201', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400221', null, '00000000-0000-4000-8000-000000400213', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c2-a2"}'),
  ('00000000-0000-4000-8000-000000400238', '00000000-0000-4000-8000-000000400201', 'visit_share', 'site_office', '00000000-0000-4000-8000-000000400224', null, '00000000-0000-4000-8000-000000400213', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c2-vd"}');
insert into app.consents (id, principal_user_id, purpose_code, recipient_kind, recipient_org_id, phase_id, notice_version, evidence, granted_at) values
  ('00000000-0000-4000-8000-000000400236', '00000000-0000-4000-8000-000000400201', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400225', '00000000-0000-4000-8000-000000400213', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c2-e"}', '2026-09-10 10:00+05:30');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400202","role":"authenticated"}', true);
insert into app.consents (id, principal_user_id, purpose_code, recipient_kind, recipient_org_id, phase_id, notice_version, evidence) values
  ('00000000-0000-4000-8000-000000400237', '00000000-0000-4000-8000-000000400202', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400224', '00000000-0000-4000-8000-000000400213', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c2-other"}');

-- Three holders -----------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400201","role":"authenticated"}', true);
select lives_ok(
  $$insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, recipient_agent_id, phase_id, number_shared) values
    ('00000000-0000-4000-8000-000000400241', '00000000-0000-4000-8000-000000400231', '00000000-0000-4000-8000-000000400201', '00000000-0000-4000-8000-000000400221', null, '00000000-0000-4000-8000-000000400213', true),
    ('00000000-0000-4000-8000-000000400242', '00000000-0000-4000-8000-000000400232', '00000000-0000-4000-8000-000000400201', '00000000-0000-4000-8000-000000400222', null, '00000000-0000-4000-8000-000000400213', true),
    ('00000000-0000-4000-8000-000000400243', '00000000-0000-4000-8000-000000400233', '00000000-0000-4000-8000-000000400201', null, '00000000-0000-4000-8000-000000400223', '00000000-0000-4000-8000-000000400213', true)$$,
  'three parties (two offices and an agent) can hold the number'
);
select is(cardinality(app.number_holders('00000000-0000-4000-8000-000000400201')), 3, '3 parties can reach the buyer');

select throws_ok(
  $$insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400244', '00000000-0000-4000-8000-000000400234', '00000000-0000-4000-8000-000000400201', '00000000-0000-4000-8000-000000400224', '00000000-0000-4000-8000-000000400213', true)$$,
  'PT409', 'cap_reached',
  'a 4th holder within 30 days fails'
);

select lives_ok(
  $$insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400245', '00000000-0000-4000-8000-000000400235', '00000000-0000-4000-8000-000000400201', '00000000-0000-4000-8000-000000400221', '00000000-0000-4000-8000-000000400213', true)$$,
  'a second share to a party that already holds the number is allowed'
);
select is(cardinality(app.number_holders('00000000-0000-4000-8000-000000400201')), 3, 'and is not a new holder (distinct recipients)');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400202","role":"authenticated"}', true);
select lives_ok(
  $$insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400246', '00000000-0000-4000-8000-000000400237', '00000000-0000-4000-8000-000000400202', '00000000-0000-4000-8000-000000400224', '00000000-0000-4000-8000-000000400213', true)$$,
  'the cap is per buyer: another buyer shares with D'
);

-- What does not count ------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400201","role":"authenticated"}', true);
select lives_ok(
  $$insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared, starts_at, ends_at)
    values ('00000000-0000-4000-8000-000000400247', '00000000-0000-4000-8000-000000400236', '00000000-0000-4000-8000-000000400201', '00000000-0000-4000-8000-000000400225', '00000000-0000-4000-8000-000000400213', true, '2026-09-10 10:00+05:30', '2026-10-10 10:00+05:30')$$,
  'a share whose 30 days already ran out is history, not a holder'
);
select is(cardinality(app.number_holders('00000000-0000-4000-8000-000000400201')), 3, 'an expired share does not count');

insert into app.relay_sessions (id, buyer_user_id, recipient_org_id, phase_id, opened_at)
values ('00000000-0000-4000-8000-000000400251', '00000000-0000-4000-8000-000000400201', '00000000-0000-4000-8000-000000400224', '00000000-0000-4000-8000-000000400213', '2026-10-18 10:00+05:30');
select lives_ok(
  $$insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared, relay_session_id)
    values ('00000000-0000-4000-8000-000000400248', '00000000-0000-4000-8000-000000400238', '00000000-0000-4000-8000-000000400201', '00000000-0000-4000-8000-000000400224', '00000000-0000-4000-8000-000000400213', false, '00000000-0000-4000-8000-000000400251')$$,
  'a relay-only share to D (over a relay) is allowed at the cap'
);
select is(cardinality(app.number_holders('00000000-0000-4000-8000-000000400201')), 3, 'a relay does not count toward the cap');

select lives_ok(
  $$insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400249', '00000000-0000-4000-8000-000000400234', '00000000-0000-4000-8000-000000400201', '00000000-0000-4000-8000-000000400224', '00000000-0000-4000-8000-000000400213', false)$$,
  'a not-yet-shared row for D is allowed'
);
select throws_ok(
  $$update app.contact_shares set number_shared = true where id = '00000000-0000-4000-8000-000000400249'$$,
  'PT409', 'cap_reached',
  'flipping it to number_shared = true at the cap fails too (no path around the cap)'
);

-- Withdrawal frees a slot -----------------------------------------------------------
select lives_ok(
  $$insert into app.consent_withdrawals (consent_id, channel) values ('00000000-0000-4000-8000-000000400232', 'app')$$,
  'the buyer withdraws B''s consent'
);
select is(cardinality(app.number_holders('00000000-0000-4000-8000-000000400201')), 2, 'B no longer holds the number');
select lives_ok(
  $$insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-00000040024a', '00000000-0000-4000-8000-000000400234', '00000000-0000-4000-8000-000000400201', '00000000-0000-4000-8000-000000400224', '00000000-0000-4000-8000-000000400213', true)$$,
  'D can now hold the number'
);
select is(
  array(select h from unnest(app.number_holders('00000000-0000-4000-8000-000000400201')) as h order by 1),
  array[
    '00000000-0000-4000-8000-000000400221', '00000000-0000-4000-8000-000000400223', '00000000-0000-4000-8000-000000400224'
  ]::uuid[],
  'the 3 holders are A, the agent C and D'
);

select * from finish();
rollback;
