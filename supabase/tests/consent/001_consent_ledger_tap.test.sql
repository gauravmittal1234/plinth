-- T40 · The consent ledger and Trigger 1 (DATA_MODEL §6, §12 inv. 3 and 4; BUILD_PLAN §13).
-- app.consents is insert-only and written only under the principal's own JWT.
-- app.contact_shares.number_shared = true needs the buyer's own JWT (role
-- authenticated, sub = buyer) and a number_share consent carrying a tap_event_id.
-- Every other path fails, the service role included.
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Fixture ----------------------------------------------------------------------
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000400101', '{"first_name":"T40 Buyer"}'),
  ('00000000-0000-4000-8000-000000400102', '{"first_name":"T40 Other"}');
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-000000400111', 't40-c1-group', 'T40 C1 Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-000000400112', 't40-c1-project', 'T40 C1 Project', '00000000-0000-4000-8000-000000400111');
insert into core.phases (id, project_id, slug, name) values ('00000000-0000-4000-8000-000000400113', '00000000-0000-4000-8000-000000400112', 't40-c1-phase', 'T40 C1 Phase');

-- As the buyer: a visit_share consent (relay only) and a number_share consent whose
-- evidence is a WhatsApp message id, not a tap.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400101","role":"authenticated"}', true);
insert into app.consents (id, principal_user_id, purpose_code, recipient_kind, recipient_org_id, phase_id, notice_version, evidence) values
  ('00000000-0000-4000-8000-000000400132', '00000000-0000-4000-8000-000000400101', 'visit_share', 'site_office', '00000000-0000-4000-8000-000000400121', '00000000-0000-4000-8000-000000400113', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c1-tap-visit"}'),
  ('00000000-0000-4000-8000-000000400133', '00000000-0000-4000-8000-000000400101', 'number_share', 'sales_office', '00000000-0000-4000-8000-000000400122', '00000000-0000-4000-8000-000000400113', 'Privacy notice v1.0, 1 Oct 2026', '{"wa_message_id":"wamid.t40-c1"}');

-- The consent ledger ---------------------------------------------------------------
select lives_ok(
  $$insert into app.consents (id, principal_user_id, purpose_code, recipient_kind, recipient_org_id, phase_id, notice_version, evidence)
    values ('00000000-0000-4000-8000-000000400131', '00000000-0000-4000-8000-000000400101', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400121', '00000000-0000-4000-8000-000000400113', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c1-tap-1"}')$$,
  'the principal records a consent under their own JWT'
);
select ok(
  (select ref ~ '^C-1018-[0-9]{2,}$' and ref_year = 2026 and channel = 'web' and granted_at = ops.now()
     from app.consents where id = '00000000-0000-4000-8000-000000400131'),
  'a new consent gets a C-MMDD-NN ref for the IST day, its year, and is granted now'
);

select set_config('request.jwt.claims', '', true);
select throws_ok(
  $$insert into app.consents (principal_user_id, purpose_code, recipient_kind, recipient_org_id, notice_version, evidence)
    values ('00000000-0000-4000-8000-000000400101', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400121', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c1-x"}')$$,
  'PT403', 'forbidden',
  'a consent without any JWT is rejected'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400102","role":"authenticated"}', true);
select throws_ok(
  $$insert into app.consents (principal_user_id, purpose_code, recipient_kind, recipient_org_id, notice_version, evidence)
    values ('00000000-0000-4000-8000-000000400101', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400121', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c1-x"}')$$,
  'PT403', 'forbidden',
  'nobody records a consent for someone else'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400101","role":"service_role"}', true);
select throws_ok(
  $$insert into app.consents (principal_user_id, purpose_code, recipient_kind, recipient_org_id, notice_version, evidence)
    values ('00000000-0000-4000-8000-000000400101', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400121', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-c1-x"}')$$,
  'PT403', 'forbidden',
  'service-role claims cannot record a consent, even naming the buyer as sub'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400101","role":"authenticated"}', true);
select throws_ok(
  $$insert into app.consents (principal_user_id, purpose_code, recipient_kind, recipient_org_id, notice_version, evidence)
    values ('00000000-0000-4000-8000-000000400101', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400121', 'Privacy notice v1.0, 1 Oct 2026', '{}')$$,
  '23514', null,
  'a consent needs evidence: a tap_event_id or a wa_message_id'
);
select throws_ok(
  $$update app.consents set scope = '{"first_name":true}' where id = '00000000-0000-4000-8000-000000400131'$$,
  'PT409', null,
  'app.consents rejects UPDATE (insert-only)'
);
select throws_ok(
  $$delete from app.consents where id = '00000000-0000-4000-8000-000000400131'$$,
  'PT409', null,
  'app.consents rejects DELETE (insert-only)'
);

-- Trigger 1: number_shared = true ------------------------------------------------------
select set_config('request.jwt.claims', '', true);
grant usage on schema app to service_role;
grant insert on app.contact_shares to service_role;
set local role service_role;
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
select throws_ok(
  $$insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared, starts_at)
    values ('00000000-0000-4000-8000-000000400149', '00000000-0000-4000-8000-000000400131', '00000000-0000-4000-8000-000000400101', '00000000-0000-4000-8000-000000400121', '00000000-0000-4000-8000-000000400113', true, '2026-10-18 12:00+05:30')$$,
  'PT403', 'forbidden',
  'a service-role insert of number_shared = true fails, even with table privileges'
);
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400101","role":"service_role"}', true);
select throws_ok(
  $$insert into app.contact_shares (consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400131', '00000000-0000-4000-8000-000000400101', '00000000-0000-4000-8000-000000400121', '00000000-0000-4000-8000-000000400113', true)$$,
  'PT403', 'forbidden',
  'service-role claims naming the buyer as sub are still rejected'
);
select set_config('request.jwt.claims', '', true);
select throws_ok(
  $$insert into app.contact_shares (consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400131', '00000000-0000-4000-8000-000000400101', '00000000-0000-4000-8000-000000400121', '00000000-0000-4000-8000-000000400113', true)$$,
  'PT403', 'forbidden',
  'no JWT (a migration, a cron job, the table owner): rejected'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400102","role":"authenticated"}', true);
select throws_ok(
  $$insert into app.contact_shares (consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400131', '00000000-0000-4000-8000-000000400101', '00000000-0000-4000-8000-000000400121', '00000000-0000-4000-8000-000000400113', true)$$,
  'PT403', 'forbidden',
  'another signed-in user cannot share the buyer''s number'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400101","role":"authenticated"}', true);
select throws_ok(
  $$insert into app.contact_shares (consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400133', '00000000-0000-4000-8000-000000400101', '00000000-0000-4000-8000-000000400122', '00000000-0000-4000-8000-000000400113', true)$$,
  'PT409', 'consent_required',
  'the buyer''s JWT alone is not enough: the consent must carry a tap_event_id'
);
select throws_ok(
  $$insert into app.contact_shares (consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400132', '00000000-0000-4000-8000-000000400101', '00000000-0000-4000-8000-000000400121', '00000000-0000-4000-8000-000000400113', true)$$,
  'PT409', 'consent_required',
  'a visit_share consent never carries the number (purpose must be number_share)'
);
select throws_ok(
  $$insert into app.contact_shares (consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400131', '00000000-0000-4000-8000-000000400101', '00000000-0000-4000-8000-000000400122', '00000000-0000-4000-8000-000000400113', true)$$,
  'PT409', 'consent_required',
  'the number goes only to the party the consent names'
);
select lives_ok(
  $$insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400141', '00000000-0000-4000-8000-000000400131', '00000000-0000-4000-8000-000000400101', '00000000-0000-4000-8000-000000400121', '00000000-0000-4000-8000-000000400113', true)$$,
  'the buyer''s own JWT plus a tap-backed number_share consent shares the number'
);

select set_config('request.jwt.claims', '', true);
select lives_ok(
  $$insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400142', '00000000-0000-4000-8000-000000400132', '00000000-0000-4000-8000-000000400101', '00000000-0000-4000-8000-000000400121', '00000000-0000-4000-8000-000000400113', false)$$,
  'a relay-only share (number_shared = false) needs no tap'
);
select throws_ok(
  $$update app.contact_shares set number_shared = true where id = '00000000-0000-4000-8000-000000400142'$$,
  'PT403', 'forbidden',
  'flipping a share to number_shared = true is Trigger 1 too (no path around it)'
);
select throws_ok(
  $$insert into app.contact_shares (consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared)
    values ('00000000-0000-4000-8000-000000400132', '00000000-0000-4000-8000-000000400102', '00000000-0000-4000-8000-000000400121', '00000000-0000-4000-8000-000000400113', false)$$,
  'PT422', 'invalid_input',
  'a share belongs to the consent''s principal'
);
select is(
  (select count(*)::int from app.contact_shares where buyer_user_id = '00000000-0000-4000-8000-000000400101' and number_shared),
  1,
  'exactly one number share exists: the tap-backed one'
);
select throws_ok(
  $$update app.contact_shares set number_shared = false where id = '00000000-0000-4000-8000-000000400141'$$,
  'PT409', null,
  'a number share cannot be rewritten as never shared (end it instead)'
);

select * from finish();
rollback;
