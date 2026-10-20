-- T40 · Withdrawal (DATA_MODEL §6, §12 inv. 4 and 7; BUILD_PLAN §13).
-- An app.consent_withdrawals row ends every share of that consent and closes the
-- relay once no other live visit or enquiry consent backs it. Withdrawals are
-- append-only except partner_notified_at. Org members (sales, site, admin) see a
-- share naming their org only while it is live (RLS wall 2, temporary grant).
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Fixture ----------------------------------------------------------------------
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000400301', '{"first_name":"T40 Withdraws"}'),
  ('00000000-0000-4000-8000-000000400302', '{"first_name":"T40 Stranger"}');
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-000000400311', 't40-c3-group', 'T40 C3 Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-000000400312', 't40-c3-project', 'T40 C3 Project', '00000000-0000-4000-8000-000000400311');
insert into core.phases (id, project_id, slug, name) values ('00000000-0000-4000-8000-000000400313', '00000000-0000-4000-8000-000000400312', 't40-c3-phase', 'T40 C3 Phase');

-- Org A ...321 (number share + visit with a relay), org D ...324 (enquiry with a relay).
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400301","role":"authenticated"}', true);
insert into app.consents (id, principal_user_id, purpose_code, recipient_kind, recipient_org_id, phase_id, notice_version, evidence) values
  ('00000000-0000-4000-8000-000000400331', '00000000-0000-4000-8000-000000400301', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400321', '00000000-0000-4000-8000-000000400313', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c3-a"}'),
  ('00000000-0000-4000-8000-000000400332', '00000000-0000-4000-8000-000000400301', 'visit_share', 'site_office', '00000000-0000-4000-8000-000000400321', '00000000-0000-4000-8000-000000400313', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c3-v"}'),
  ('00000000-0000-4000-8000-000000400333', '00000000-0000-4000-8000-000000400301', 'enquiry_share', 'sales_office', '00000000-0000-4000-8000-000000400324', '00000000-0000-4000-8000-000000400313', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c3-e"}');
insert into app.relay_sessions (id, buyer_user_id, recipient_org_id, phase_id, opened_at) values
  ('00000000-0000-4000-8000-000000400341', '00000000-0000-4000-8000-000000400301', '00000000-0000-4000-8000-000000400321', '00000000-0000-4000-8000-000000400313', '2026-10-17 10:00+05:30'),
  ('00000000-0000-4000-8000-000000400342', '00000000-0000-4000-8000-000000400301', '00000000-0000-4000-8000-000000400324', '00000000-0000-4000-8000-000000400313', '2026-10-17 10:00+05:30');
insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared, relay_session_id) values
  ('00000000-0000-4000-8000-000000400351', '00000000-0000-4000-8000-000000400331', '00000000-0000-4000-8000-000000400301', '00000000-0000-4000-8000-000000400321', '00000000-0000-4000-8000-000000400313', true, null),
  ('00000000-0000-4000-8000-000000400352', '00000000-0000-4000-8000-000000400332', '00000000-0000-4000-8000-000000400301', '00000000-0000-4000-8000-000000400321', '00000000-0000-4000-8000-000000400313', false, '00000000-0000-4000-8000-000000400341'),
  ('00000000-0000-4000-8000-000000400353', '00000000-0000-4000-8000-000000400333', '00000000-0000-4000-8000-000000400301', '00000000-0000-4000-8000-000000400324', '00000000-0000-4000-8000-000000400313', false, '00000000-0000-4000-8000-000000400342');
select set_config('request.jwt.claims', '', true);

-- Who sees the shares while they are live (wall 2) ------------------------------------
grant usage on schema app to authenticated;
grant select on app.contact_shares, app.relay_sessions to authenticated;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400301","role":"authenticated"}', true);
select is((select count(*)::int from app.contact_shares), 3, 'the buyer reads their own 3 shares');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400302","role":"authenticated"}', true);
select is((select count(*)::int from app.contact_shares where buyer_user_id = '00000000-0000-4000-8000-000000400301'), 0, 'another buyer reads none of them');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000004003a1","role":"authenticated","org_roles":{"00000000-0000-4000-8000-000000400321":"sales"}}', true);
select is((select count(*)::int from app.contact_shares where number_shared), 1, 'org A sales sees the live number share naming org A');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000004003a2","role":"authenticated","org_roles":{"00000000-0000-4000-8000-000000400324":"sales"}}', true);
select results_eq(
  $$select id from app.contact_shares$$,
  $$values ('00000000-0000-4000-8000-000000400353'::uuid)$$,
  'org D sales sees only the share naming org D'
);
reset role;
select set_config('request.jwt.claims', '', true);

-- Withdrawal ends the share ----------------------------------------------------------
select lives_ok(
  $$insert into app.consent_withdrawals (consent_id, channel) values ('00000000-0000-4000-8000-000000400331', 'app')$$,
  'the buyer withdraws the number share for org A'
);
select results_eq(
  $$select ended_reason, ends_at = ops.now() from app.contact_shares where id = '00000000-0000-4000-8000-000000400351'$$,
  $$values ('withdrawn'::text, true)$$,
  'withdrawal ends the share, at the moment of withdrawal'
);
select is(cardinality(app.number_holders('00000000-0000-4000-8000-000000400301')), 0, 'nobody holds the number any more');
select ok(
  (select closed_at is null from app.relay_sessions where id = '00000000-0000-4000-8000-000000400341'),
  'the relay with org A stays open: the visit consent still backs it'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000004003a1","role":"authenticated","org_roles":{"00000000-0000-4000-8000-000000400321":"sales"}}', true);
select is((select count(*)::int from app.contact_shares where number_shared), 0, 'org A no longer sees a number share (inv. 7)');
reset role;
select set_config('request.jwt.claims', '', true);

-- Withdrawal closes the relay ------------------------------------------------------
select lives_ok(
  $$insert into app.consent_withdrawals (consent_id, channel) values ('00000000-0000-4000-8000-000000400332', 'whatsapp_keyword')$$,
  'the buyer withdraws the visit consent (a WhatsApp keyword, no JWT needed to withdraw)'
);
select results_eq(
  $$select closed_at = ops.now(), closed_reason, deal_active from app.relay_sessions where id = '00000000-0000-4000-8000-000000400341'$$,
  $$values (true, 'withdrawn'::text, false)$$,
  'the relay with org A is closed'
);
select is(
  (select ended_reason from app.contact_shares where id = '00000000-0000-4000-8000-000000400352'),
  'withdrawn',
  'and the visit share is ended'
);
select lives_ok(
  $$insert into app.consent_withdrawals (consent_id, channel) values ('00000000-0000-4000-8000-000000400333', 'web')$$,
  'the buyer withdraws the enquiry'
);
select ok(
  (select closed_at is not null from app.relay_sessions where id = '00000000-0000-4000-8000-000000400342'),
  'the relay with org D is closed'
);

-- No way back ------------------------------------------------------------------------
select throws_ok(
  $$insert into app.consent_withdrawals (consent_id, channel) values ('00000000-0000-4000-8000-000000400331', 'app')$$,
  '23505', null,
  'a consent is withdrawn once'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400301","role":"authenticated"}', true);
select throws_ok(
  $$insert into app.contact_shares (consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400331', '00000000-0000-4000-8000-000000400301', '00000000-0000-4000-8000-000000400321', '00000000-0000-4000-8000-000000400313', true)$$,
  'PT409', 'consent_required',
  'a withdrawn consent cannot share the number again'
);
select set_config('request.jwt.claims', '', true);
select throws_ok(
  $$update app.consent_withdrawals set withdrawn_at = withdrawn_at + interval '1 day' where consent_id = '00000000-0000-4000-8000-000000400331'$$,
  'PT409', null,
  'the withdrawal time cannot be rewritten'
);
select lives_ok(
  $$update app.consent_withdrawals set partner_notified_at = ops.now() where consent_id = '00000000-0000-4000-8000-000000400331'$$,
  'the outbox records when the partner was told'
);
select throws_ok(
  $$delete from app.consent_withdrawals where consent_id = '00000000-0000-4000-8000-000000400331'$$,
  'PT409', null,
  'a withdrawal cannot be deleted'
);
select throws_ok(
  $$update app.contact_shares set ended_reason = null where id = '00000000-0000-4000-8000-000000400351'$$,
  'PT409', null,
  'an ended share cannot be revived'
);
select throws_ok(
  $$update app.relay_sessions set closed_at = null where id = '00000000-0000-4000-8000-000000400341'$$,
  'PT409', null,
  'a closed relay cannot be reopened'
);

select * from finish();
rollback;
