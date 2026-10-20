-- T40 · The family circle (DATA_MODEL §5, §12 inv. 5).
-- Wall 1: authenticated has no grant on app (supabase/tests/rls/001). Wall 2, tested
-- here with a temporary grant (rolled back): a circle member reads the shared
-- shortlist notes and their own member row, and never the owner's consents, shares,
-- relays, follows (so never follow_type), alert subscriptions (payment alerts),
-- profile or bookings. A member row carries no phone.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Fixture: owner ...501, joined member ...502, invited (not joined) ...503, stranger ...504.
insert into auth.users (id, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000400501', '{"first_name":"T40 Owner"}'),
  ('00000000-0000-4000-8000-000000400502', '{"first_name":"T40 Member"}'),
  ('00000000-0000-4000-8000-000000400503', '{"first_name":"T40 Invited"}'),
  ('00000000-0000-4000-8000-000000400504', '{"first_name":"T40 Stranger"}');
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-000000400511', 't40-f1-group', 'T40 F1 Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-000000400512', 't40-f1-project', 'T40 F1 Project', '00000000-0000-4000-8000-000000400511');
insert into core.phases (id, project_id, slug, name) values ('00000000-0000-4000-8000-000000400513', '00000000-0000-4000-8000-000000400512', 't40-f1-phase', 'T40 F1 Phase');

insert into app.family_circles (id, owner_user_id) values ('00000000-0000-4000-8000-000000400531', '00000000-0000-4000-8000-000000400501');
insert into app.family_members (id, circle_id, member_user_id, invite_code, scope_all, status, invited_at, expires_at, joined_at, joined_via, can_add_notes) values
  ('00000000-0000-4000-8000-000000400541', '00000000-0000-4000-8000-000000400531', '00000000-0000-4000-8000-000000400502', 'T4A-1AA', true, 'joined', '2026-10-10 10:00+05:30', '2026-10-17 10:00+05:30', '2026-10-11 10:00+05:30', 'whatsapp', true),
  ('00000000-0000-4000-8000-000000400542', '00000000-0000-4000-8000-000000400531', '00000000-0000-4000-8000-000000400503', 'T4A-1AB', true, 'invited', '2026-10-18 10:00+05:30', '2026-10-25 10:00+05:30', null, null, false);

-- The owner's private data: a booked follow, a payment-stage alert, a consent, a share, a relay.
insert into app.follows (id, user_id, phase_id, follow_type, source, followed_at) values
  ('00000000-0000-4000-8000-000000400551', '00000000-0000-4000-8000-000000400501', '00000000-0000-4000-8000-000000400513', 'booked', 'app', '2026-10-01 10:00+05:30');
insert into app.alert_subscriptions (id, user_id, channel, kind, cadence) values
  ('00000000-0000-4000-8000-000000400552', '00000000-0000-4000-8000-000000400501', 'push', 'payment_stage', 'instant');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400501","role":"authenticated"}', true);
insert into app.consents (id, principal_user_id, purpose_code, recipient_kind, recipient_org_id, phase_id, notice_version, evidence) values
  ('00000000-0000-4000-8000-000000400553', '00000000-0000-4000-8000-000000400501', 'number_share', 'site_office', '00000000-0000-4000-8000-000000400521', '00000000-0000-4000-8000-000000400513', 'Privacy notice v1.0, 1 Oct 2026', '{"tap_event_id":"t40-f1"}');
insert into app.relay_sessions (id, buyer_user_id, recipient_org_id, phase_id, opened_at) values
  ('00000000-0000-4000-8000-000000400555', '00000000-0000-4000-8000-000000400501', '00000000-0000-4000-8000-000000400521', '00000000-0000-4000-8000-000000400513', '2026-10-18 10:00+05:30');
insert into app.contact_shares (id, consent_id, buyer_user_id, recipient_org_id, phase_id, number_shared) values
  ('00000000-0000-4000-8000-000000400554', '00000000-0000-4000-8000-000000400553', '00000000-0000-4000-8000-000000400501', '00000000-0000-4000-8000-000000400521', '00000000-0000-4000-8000-000000400513', true);
select set_config('request.jwt.claims', '', true);
insert into app.shortlist_notes (id, circle_id, phase_id, author_user_id, body, created_at) values
  ('00000000-0000-4000-8000-000000400561', '00000000-0000-4000-8000-000000400531', '00000000-0000-4000-8000-000000400513', '00000000-0000-4000-8000-000000400501', 'T40 note by the owner.', '2026-10-15 10:00+05:30'),
  ('00000000-0000-4000-8000-000000400562', '00000000-0000-4000-8000-000000400531', '00000000-0000-4000-8000-000000400513', '00000000-0000-4000-8000-000000400502', 'T40 note by the member.', '2026-10-16 10:00+05:30');

-- Bookings land in M3 (app.bookings, DATA_MODEL §7). Probe it as the member if it exists.
create temp table t40_bookings_probe (visible integer);
do $$
declare
  v integer;
begin
  if pg_catalog.to_regclass('app.bookings') is null then
    insert into t40_bookings_probe values (null);
  else
    execute 'grant usage on schema app to authenticated';
    execute 'grant select on app.bookings to authenticated';
    perform pg_catalog.set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400502","role":"authenticated"}', true);
    execute 'set local role authenticated';
    execute 'select count(*)::int from app.bookings where user_id = $1' into v using '00000000-0000-4000-8000-000000400501'::uuid;
    execute 'reset role';
    perform pg_catalog.set_config('request.jwt.claims', '', true);
    insert into t40_bookings_probe values (v);
  end if;
end
$$;
select ok(
  (select coalesce(visible, 0) = 0 from t40_bookings_probe),
  'member: none of the owner''s bookings (placeholder until app.bookings lands in M3; the M2 booking marker is follow_type = booked, hidden below)'
);

grant usage on schema app to authenticated;
grant select on app.consents, app.consent_withdrawals, app.contact_shares, app.relay_sessions, app.follows,
  app.alert_subscriptions, app.profiles, app.family_circles, app.family_members, app.shortlist_notes to authenticated;
grant insert on app.shortlist_notes to authenticated;

-- As the joined member ----------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400502","role":"authenticated"}', true);
select is((select count(*)::int from app.consents where principal_user_id = '00000000-0000-4000-8000-000000400501'), 0, 'member: none of the owner''s consents');
select is((select count(*)::int from app.contact_shares where buyer_user_id = '00000000-0000-4000-8000-000000400501'), 0, 'member: none of the owner''s contact shares');
select is((select count(*)::int from app.relay_sessions where buyer_user_id = '00000000-0000-4000-8000-000000400501'), 0, 'member: none of the owner''s relays');
select is((select count(*)::int from app.follows where user_id = '00000000-0000-4000-8000-000000400501'), 0, 'member: none of the owner''s follows, so never follow_type');
select is((select count(*)::int from app.alert_subscriptions where user_id = '00000000-0000-4000-8000-000000400501'), 0, 'member: none of the owner''s alerts (payment_stage included)');
select is((select count(*)::int from app.profiles where id = '00000000-0000-4000-8000-000000400501'), 0, 'member: not the owner''s profile');
select is((select count(*)::int from app.shortlist_notes where circle_id = '00000000-0000-4000-8000-000000400531'), 2, 'member: reads the shared shortlist notes');
select results_eq(
  $$select id from app.family_members$$,
  $$values ('00000000-0000-4000-8000-000000400541'::uuid)$$,
  'member: reads only their own member row'
);
select lives_ok(
  $$insert into app.shortlist_notes (id, circle_id, phase_id, author_user_id, body, created_at)
    values ('00000000-0000-4000-8000-000000400563', '00000000-0000-4000-8000-000000400531', '00000000-0000-4000-8000-000000400513', '00000000-0000-4000-8000-000000400502', 'T40 second note.', '2026-10-18 10:00+05:30')$$,
  'member with can_add_notes adds a note'
);

-- As the invited (not joined) relative and a stranger ------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400503","role":"authenticated"}', true);
select is((select count(*)::int from app.shortlist_notes), 0, 'invited, not joined: no notes');
select throws_ok(
  $$insert into app.shortlist_notes (circle_id, phase_id, author_user_id, body, created_at)
    values ('00000000-0000-4000-8000-000000400531', '00000000-0000-4000-8000-000000400513', '00000000-0000-4000-8000-000000400503', 'T40 not allowed.', '2026-10-18 10:00+05:30')$$,
  '42501', null,
  'invited, not joined: cannot add a note'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400504","role":"authenticated"}', true);
select is(
  (select count(*)::int from app.family_circles) + (select count(*)::int from app.family_members where circle_id = '00000000-0000-4000-8000-000000400531')
    + (select count(*)::int from app.shortlist_notes where circle_id = '00000000-0000-4000-8000-000000400531'),
  0,
  'a stranger sees no circle, member or note'
);

-- As the owner -----------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000400501","role":"authenticated"}', true);
select is((select count(*)::int from app.family_members where circle_id = '00000000-0000-4000-8000-000000400531'), 2, 'owner: manages both member rows');
select is((select count(*)::int from app.shortlist_notes where circle_id = '00000000-0000-4000-8000-000000400531'), 3, 'owner: reads every note');
select results_eq(
  $$select follow_type from app.follows$$,
  $$values ('booked'::text)$$,
  'owner: reads their own follow_type'
);
reset role;
select set_config('request.jwt.claims', '', true);

-- Shape ------------------------------------------------------------------------------
select is(
  (select array_agg(column_name::text) from information_schema.columns
    where table_schema = 'app' and table_name = 'family_members' and column_name ~ '(phone|e164|wa_id)'),
  null::text[],
  'a member row carries no phone'
);
select throws_ok(
  $$insert into app.family_members (circle_id, invite_code, scope_all) values ('00000000-0000-4000-8000-000000400531', 'bad code', true)$$,
  '23514', null,
  'invite codes look like AH2-7KQ'
);
select throws_ok(
  $$insert into app.family_members (circle_id, invite_code, scope_all, scope_phase_ids) values ('00000000-0000-4000-8000-000000400531', 'T4A-1AC', false, '{}')$$,
  '23514', null,
  'a member shares all projects or at least one'
);
select throws_ok(
  $$insert into app.family_members (circle_id, invite_code, scope_all, status) values ('00000000-0000-4000-8000-000000400531', 'T4A-1AD', true, 'joined')$$,
  '23514', null,
  'a joined member names who joined, and when'
);

select * from finish();
rollback;
