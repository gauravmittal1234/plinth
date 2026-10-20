-- T59 · M2 exit gate, database side (BUILD_PLAN §3 "M2: Accounts, follow, alerts"; WORK_BREAKDOWN T59).
-- Runs on the §5b seed under the frozen clock (ci-db `supabase test db`, `npm run db:check`, and
-- ci-gate-m2, which also reads the `m2:` diag lines below for its Deno renders).
--
-- What already proves an M2 item, and is not repeated here (item → test):
--   1 Phone OTP sign-in      ci-gate-m2 (live: GoTrue test OTP through the web's sign-in form and
--                            the app's controller; e2e/gates/m2.spec.ts, test/gates/m2_test.dart);
--                            every seeded account readable by GoTrue: below (gate gap 8, closed);
--                            the fresh-code window on the wall clock: tests/dpdp/005;
--                            the access-token hook: tests/auth/001;
--                            WhatsApp follows merge only after the tap: tests/buyer_api/004,
--                            apps/web/e2e/sign-in.spec.ts ("Bring them here merges 2 follows").
--   2 Rohan's §5b world      `test:api` deep-equals following_feed, family_circle, alert_prefs,
--                            who_has_my_number and consent_history for Rohan (ci-db); the 5 events
--                            since 14 Oct 08:40: tests/events/001; following_feed as Rohan:
--                            tests/feed/003; the Sun 25 Oct 09:00 digest: tests/feed/002; Following
--                            shows 5 on web and app: ci-gate-m2 live, apps/web/e2e/following.spec.ts,
--                            apps/mobile/test/features/following.
--   3 25 Oct, Elevated→High  the 7-day notice and its settle rule: pipelines/tests/scoring/
--                            test_section5b.py (pending run, notice 18→25 Oct, withdrawn if the QPR
--                            lands); fan-out dedupe, quiet hours, STOP and push opt-out on synthetic
--                            rows: tests/feed/001; a fresh run's push + template rows: tests/feed/002;
--                            the dispatcher (quiet hours, template vs session, test-block refusal):
--                            supabase/functions/outbox-dispatch/logic.test.ts; the outbox is
--                            edge-only: tests/outbox/access.
--   4 JOIN AH2-7KQ           routing the recorded payload to family_join: wa-webhook/logic.test.ts;
--                            the handler: wa-webhook/handlers/family_join.test.ts; the RPC on
--                            synthetic rows: tests/buyer_api/003; RLS wall 2 for a circle member on
--                            synthetic rows: tests/family/001; wall 1 (no table grants):
--                            tests/rls/001. ci-gate-m2 posts the recorded payload to wa-webhook.
--   5 Who has my number      3 parties, refs and dates: tests/privacy_api/001; withdrawing
--                            C-1012-04 → 2 parties and Orbis's deletion request: tests/privacy_api/002;
--                            shares end and org members lose the row: tests/consent/003 (synthetic).
--   6 WaRisk, WaAlerts,      recorded-payload Deno tests: wa-webhook/handlers/{risk_card,card_changed,
--     WaDigest, cards        digest,prefs,family_join}.test.ts, wa-webhook/logic.test.ts; every
--                            template incl. band_change_alert, login_code and weekly_digest:
--                            _shared/wa/templates/templates.test.ts; login_code delivery:
--                            auth-sms-hook/logic.test.ts; card sizes: apps/web/test/cards/*.test.ts
--                            (and the served URLs: e2e/gates/m2.spec.ts).
--   7 Export and deletion    tests/dpdp/001 (payload with 5 refs), tests/dpdp/003 (erasure),
--                            export-data/*.test.ts, delete-account/logic.test.ts (Deno, fakes);
--                            ci-gate-m2 renders the ZIP from this file's live payload.
--
-- What this file adds (cross-cutting, on the real seed):
--   A. Rohan's world as his own JWT reads it: the unread count the clients show equals the
--      changes, the 4 follows, the Sunday digest, Meera in the circle, AH2-7KQ for Aurelia.
--   B. Export: the payload the builder renders lists the same 5 refs as consent history and
--      Who has my number (`m2:export_payload` diag for ci-gate-m2's ZIP render).
--   C. JOIN AH2-7KQ from the recorded payload's new contact (packages/fixtures/recorded/wa/
--      text-join-ah2-7kq.json): ingest, join, idempotent redelivery; then the seeded circle can
--      never read Rohan's cost sheets, visit passes, payment alerts, follow type or consents,
--      through the tables (wall 2) or any buyer read (the api).
--   D. Who has my number: the five C-MMDD-NN rows across both privacy reads; withdrawing
--      C-1012-04 hides the share from Orbis's site office in the same instant.
--   E. 25 Oct with the Jul–Sep QPR still missing: the seeded 7-day notice (sent 18 Oct) and its
--      pending run publish Elevated → High; one band_changed event; push and the WhatsApp
--      template for the follower, deferred by his quiet hours, claimable at 08:00; nothing for the
--      circle; the template row carries every variable (`m2:wa_claim` diag for ci-gate-m2's
--      mock WhatsApp body snapshot).
--   Gate gaps are marked `todo` (todo_start): see the T59 PR.
begin;
create extension if not exists pgtap with schema extensions;
select plan(53);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Fixture ids (packages/fixtures/canonical/people.json, generated by T03b).
create function pg_temp.rohan() returns uuid language sql immutable as $$ select 'bff1ee72-9910-5980-a875-96a9a00b24cf'::uuid $$;
create function pg_temp.meera() returns uuid language sql immutable as $$ select 'de38ce39-c6cc-5c35-b8a7-ecc1a480ff58'::uuid $$;
create function pg_temp.claims(p_sub uuid, p_extra jsonb default '{}'::jsonb) returns text language sql immutable as $$
  select (jsonb_build_object('sub', p_sub, 'role', 'authenticated') || p_extra)::text
$$;
create function pg_temp.aurelia() returns uuid language sql stable as $$
  select id from core.phases where slug = 'aurelia-heights-phase-2'
$$;
create function pg_temp.j(p_key text) returns jsonb language sql stable as $$
  select nullif(current_setting('m2.' || p_key, true), '')::jsonb
$$;
create function pg_temp.refs(p jsonb) returns text[] language sql immutable as $$
  select coalesce(array_agg(distinct m[1] order by m[1]), '{}') from regexp_matches(p::text, '(C-\d{4}-\d{2})', 'g') m
$$;

select is(ops.now(), '2026-10-18 12:00:00+05:30'::timestamptz, 'ops.now() is the frozen clock, 18 Oct 2026 12:00 IST');

-- Item 1, gate gap 8 (closed): Supabase Auth loads a user by reading every auth.users column into
-- a Go struct, so a NULL in a column it reads as a plain string or time ("converting NULL to
-- string is unsupported", then created_at's "unsupported Scan") fails every sign-in of that row
-- with "Database error finding user". Each seeded account must be written as GoTrue writes one:
-- those columns set, its instance id and audience, and for a phone account the confirmed phone
-- and its `phone` identity. Lists what is missing, per account (empty = every account readable).
create function pg_temp.auth_account_gaps() returns text[] language plpgsql as $$
declare v_cols text[]; v text[];
begin
  select array_agg(column_name::text order by column_name) into v_cols from information_schema.columns
   where table_schema = 'auth' and table_name = 'users'
     and column_name in ('aud', 'role', 'encrypted_password', 'confirmation_token', 'recovery_token',
                         'email_change_token_new', 'email_change', 'email_change_token_current',
                         'phone_change', 'phone_change_token', 'reauthentication_token',
                         'created_at', 'updated_at');
  execute 'select coalesce(array_agg(g order by g), ''{}'') from ('
    || (select string_agg(format('select u.id || '' %1$s is null'' as g from auth.users u where u.%1$I is null', c), ' union all ')
          from unnest(v_cols) c)
    || $q$
      union all select u.id || ' instance_id is not GoTrue''s' from auth.users u
        where u.instance_id is distinct from '00000000-0000-0000-0000-000000000000'::uuid
      union all select u.id || ' aud/role is not authenticated' from auth.users u
        where u.aud is distinct from 'authenticated' or u.role is distinct from 'authenticated'
      union all select u.id || ' phone not confirmed' from auth.users u
        where u.phone is not null and u.phone_confirmed_at is null
      union all select u.id || ' no phone identity' from auth.users u
        where u.phone is not null and not exists (
          select 1 from auth.identities i
           where i.user_id = u.id and i.provider = 'phone' and i.provider_id = u.id::text
             and i.identity_data ->> 'sub' = u.id::text and i.identity_data ->> 'phone' = u.phone
             and i.created_at is not null and i.updated_at is not null)
    ) gaps$q$ into v;
  return v;
end $$;
select is(
  pg_temp.auth_account_gaps(), '{}'::text[],
  'Supabase Auth can read every seeded account: no NULL string or time column, GoTrue''s instance and audience, a confirmed phone with its phone identity'
);

-- A. Rohan's world, as his own JWT reads it -----------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', pg_temp.claims(pg_temp.rohan()), true);
select set_config('m2.feed', api.following_feed()::text, true);
select set_config('m2.circle', api.family_circle()::text, true);
select set_config('m2.prefs', api.alert_prefs_get()::text, true);
select set_config('m2.who', api.who_has_my_number()::text, true);
select set_config('m2.history', api.consent_history()::text, true);
reset role;
select set_config('request.jwt.claims', '', true);

select is(pg_temp.j('feed') ->> 'since', '2026-10-14T08:40:00+05:30', 'Rohan''s last look is 14 Oct 2026, 08:40');
select is(jsonb_array_length(pg_temp.j('feed') -> 'changes'), 5, '5 unread changes since then');
select ok(
  pg_temp.j('feed') ->> 'last_looked_line' like '% · ' || jsonb_array_length(pg_temp.j('feed') -> 'changes') || ' unread',
  'the unread count in the last-looked line is the number of changes the clients list'
);
select is(
  array(select p ->> 'slug' from jsonb_array_elements(pg_temp.j('feed') -> 'projects') p order by 1),
  array(select ph.slug from app.follows f join core.phases ph on ph.id = f.phase_id where f.user_id = pg_temp.rohan() order by 1),
  'the feed lists his 4 follows, from his rows'
);
select is(
  (select count(*)::int from app.follows where user_id = pg_temp.rohan()), 4, 'he follows 4 projects'
);
select is(
  pg_temp.j('feed') -> 'digest',
  '{"cadence": "weekly_sun_9am", "next_line": "Next digest Sun 25 Oct, 9 am"}'::jsonb,
  'weekly digest on Sundays at 9 am; the next is Sun 25 Oct'
);
select is(
  pg_temp.j('prefs') -> 'prefs' -> 'whatsapp' ->> 'digest', pg_temp.j('feed') -> 'digest' ->> 'cadence',
  'Alert settings and the feed name the same digest cadence'
);
select is(
  array(select m ->> 'first_name' from jsonb_array_elements(pg_temp.j('circle') -> 'members') m),
  array['Meera'],
  'Meera is in his circle'
);
select is(
  (select i ->> 'scope_line' from jsonb_array_elements(pg_temp.j('circle') -> 'invites') i where i ->> 'code' = 'AH2-7KQ'),
  (select name from core.phases where id = pg_temp.aurelia()),
  'her father is invited with AH2-7KQ, for Aurelia only'
);

-- B. Download my data: the payload the export builder renders ------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', pg_temp.claims(pg_temp.rohan()), true);
select set_config('m2.export_req', api.data_export_request() ->> 'request_id', true);
reset role;
select set_config('request.jwt.claims', '', true);
set local role service_role;
select set_config('m2.export', api.dpdp_export_payload(current_setting('m2.export_req')::uuid)::text, true);
reset role;

select is(
  pg_temp.refs(pg_temp.j('export') -> 'consent_history'),
  pg_temp.refs(pg_temp.j('history')),
  'the export lists the consent refs that consent history shows'
);
select diag('m2:export_payload ' || current_setting('m2.export'));

-- C. JOIN AH2-7KQ from a new WhatsApp contact (recorded payload text-join-ah2-7kq.json) -----------
-- The sender, message id, time and text are the recorded payload's own; wa-webhook passes the
-- message object to api.wa_ingest_inbound, then routes "JOIN <code>" to api.whatsapp_family_join.
select is(
  (select count(*)::int from pii.wa_contacts where wa_id_e164 = '+919900000320'),
  0,
  'the recorded sender is a new WhatsApp contact'
);
set local role service_role;
select set_config('m2.ingest', api.wa_ingest_inbound(
  '919900000320', 'wamid.fixture.439a3653-529f-52b9-a5bd-5a77d069858f', 'text',
  '{"from": "919900000320", "id": "wamid.fixture.439a3653-529f-52b9-a5bd-5a77d069858f", "timestamp": "1792305000", "type": "text", "text": {"body": "JOIN AH2-7KQ"}}'::jsonb,
  to_timestamp(1792305000)
)::text, true);
select set_config('m2.join', api.whatsapp_family_join(
  (pg_temp.j('ingest') -> 'contact' ->> 'id')::uuid, 'AH2-7KQ', 'wamid.fixture.439a3653-529f-52b9-a5bd-5a77d069858f'
)::text, true);
reset role;

select is((pg_temp.j('ingest') ->> 'duplicate')::boolean, false, 'the message is stored once, under its own wamid');
select results_eq(
  $$select m.status, m.joined_via, m.member_user_id is null, c.wa_id_e164, c.utility_opt_in, m.scope_phase_ids
      from app.family_members m join pii.wa_contacts c on c.id = m.wa_contact_id
     where m.invite_code = 'AH2-7KQ'$$,
  $$values ('joined'::text, 'whatsapp'::text, true, '+919900000320'::text, true, array[pg_temp.aurelia()])$$,
  'JOIN AH2-7KQ makes the new contact a member of Rohan''s circle, for Aurelia, opted in to utility alerts'
);
select is(
  pg_temp.j('join') ->> 'member_id',
  (select id::text from app.family_members where invite_code = 'AH2-7KQ'),
  'the session reply''s record is the member row (AGENTS.md rule 9)'
);
set local role service_role;
select set_config('m2.ingest2', api.wa_ingest_inbound(
  '919900000320', 'wamid.fixture.439a3653-529f-52b9-a5bd-5a77d069858f', 'text', '{}'::jsonb, to_timestamp(1792305000)
)::text, true);
reset role;
select is(
  array[pg_temp.j('ingest2') ->> 'duplicate',
        (select count(*)::text from comms.wa_messages where wa_message_id = 'wamid.fixture.439a3653-529f-52b9-a5bd-5a77d069858f'),
        (select count(*)::text from app.family_members where wa_contact_id = (pg_temp.j('ingest') -> 'contact' ->> 'id')::uuid)],
  array['true', '1', '1'],
  'Meta''s redelivery is a duplicate (never routed again): one message, one member'
);
set local role authenticated;
select set_config('request.jwt.claims', pg_temp.claims(pg_temp.rohan()), true);
select set_config('m2.circle2', api.family_circle()::text, true);
reset role;
select set_config('request.jwt.claims', '', true);
select is(
  array[jsonb_array_length(pg_temp.j('circle2') -> 'members'),
        (select count(*)::int from jsonb_array_elements(pg_temp.j('circle2') -> 'invites') i where i ->> 'code' = 'AH2-7KQ')],
  array[2, 0],
  'Rohan''s circle now lists 2 members, and AH2-7KQ is no longer an open invite'
);
select ok(
  pg_temp.j('circle2')::text !~ '9900000320|99000\D*00320|••320',
  'the relative''s number appears nowhere in the circle Rohan reads'
);

-- C2. A circle member never reads cost sheets, visit passes, payment alerts, follow type or
-- consents. Rohan gets a saved cost sheet and a payment-stage alert on a booked follow (rolled
-- back). Wall 2: a temporary SELECT grant (as tests/family/001), so RLS alone decides.
update app.follows set follow_type = 'booked' where user_id = pg_temp.rohan() and phase_id = pg_temp.aurelia();
insert into app.alert_subscriptions (id, user_id, channel, kind, cadence, enabled)
  values ('00000000-0000-4000-8000-000000590001', pg_temp.rohan(), 'push', 'payment_stage', 'instant', true);
insert into app.uploads (id, owner_user_id, kind, storage_key, sha256, mime, pages, saved)
  values ('00000000-0000-4000-8000-000000590002', pg_temp.rohan(), 'cost_sheet', 't59/m2-gate-cost-sheet.pdf',
          repeat('5', 64), 'application/pdf', 2, true);

grant usage on schema app to authenticated;
grant select on app.follows, app.alert_subscriptions, app.consents, app.contact_shares,
  app.consent_withdrawals, app.relay_sessions, app.uploads, app.profiles to authenticated;

-- Every table that could hold a buyer's visit pass, booking, payment or cost sheet, now or when
-- M3–M5 add it (a probe by name, like tests/family/001's bookings probe), with its owner column.
create temp table m2_private (tbl regclass, owner_col text);
insert into m2_private
select format('%I.%I', c.table_schema, c.table_name)::regclass, c.column_name
  from information_schema.columns c
 where c.table_schema = 'app'
   and c.table_name ~ '(visit|pass|booking|payment|cost_sheet|upload)'
   and c.column_name in ('owner_user_id', 'user_id', 'buyer_user_id');
grant select on m2_private to authenticated;
do $$
declare r record;
begin
  for r in select tbl from m2_private loop
    execute format('grant select on %s to authenticated', r.tbl);
  end loop;
end $$;
create function pg_temp.m2_private_rows(p_owner uuid) returns text[] language plpgsql as $$
declare r record; n integer; v_out text[] := '{}';
begin
  for r in select tbl, owner_col from m2_private loop
    execute format('select count(*)::int from %s where %I = $1', r.tbl, r.owner_col) into n using p_owner;
    if n > 0 then v_out := v_out || (r.tbl::text || ':' || n); end if;
  end loop;
  return v_out;
end $$;
grant execute on function pg_temp.m2_private_rows(uuid) to authenticated;

select ok(
  (select count(*) from m2_private where tbl = 'app.uploads'::regclass) = 1,
  'the probe covers the cost sheets in app.uploads, and any visit-pass, booking or payment table that exists'
);

set local role authenticated;
select set_config('request.jwt.claims', pg_temp.claims(pg_temp.meera()), true);
select is(pg_temp.m2_private_rows(pg_temp.rohan()), '{}'::text[], 'Meera (circle member): none of Rohan''s cost sheets, visit passes, bookings or payments');
select is((select count(*)::int from app.alert_subscriptions where user_id = pg_temp.rohan()), 0, 'Meera: none of Rohan''s alerts, the payment-stage alert included');
select is((select count(*)::int from app.follows where user_id = pg_temp.rohan()), 0, 'Meera: none of Rohan''s follows, so never his follow type');
select is(
  (select count(*)::int from app.consents where principal_user_id = pg_temp.rohan())
    + (select count(*)::int from app.contact_shares where buyer_user_id = pg_temp.rohan())
    + (select count(*)::int from app.relay_sessions where buyer_user_id = pg_temp.rohan()),
  0,
  'Meera: none of Rohan''s consents, number shares or relays'
);
-- Wall 3: every buyer read Meera can make.
select set_config('m2.meera', jsonb_build_object(
  'me', api.me(),
  'following_feed', api.following_feed(),
  'family_circle', api.family_circle(),
  'alert_prefs_get', api.alert_prefs_get(),
  'saved_searches', api.saved_searches(),
  'who_has_my_number', api.who_has_my_number(),
  'consent_history', api.consent_history(),
  'link_whatsapp_follows', api.link_whatsapp_follows(false)
)::text, true);
reset role;
select set_config('request.jwt.claims', '', true);

select is(
  pg_temp.refs(pg_temp.j('meera')) && pg_temp.refs(pg_temp.j('history')),
  false,
  'none of Rohan''s consent refs in any read Meera can make'
);
select is(
  array(
    select k from unnest(array['9900000318', '00000000-0000-4000-8000-000000590001', '00000000-0000-4000-8000-000000590002',
                               't59/m2-gate-cost-sheet', repeat('5', 64)]) k
     where position(k in pg_temp.j('meera')::text) > 0
    union all
    select 'follow_type=' || (v ->> 'follow_type') from jsonb_path_query(pg_temp.j('meera'), 'lax $.**') v
     where jsonb_typeof(v) = 'object' and v ? 'follow_type' and v -> 'follow_type' <> 'null'::jsonb
  ),
  '{}'::text[],
  'nor his number, a payment alert, the cost sheet or his follow type'
);
select ok(
  (select member_user_id is null from app.family_members where invite_code = 'AH2-7KQ'),
  'the relative who joined on WhatsApp has no account, so no JWT reaches any table or buyer read'
);

-- D. Who has my number --------------------------------------------------------------------------
select is(pg_temp.j('who') ->> 'count_line', '3 parties can reach you', 'Who has my number: 3 parties can reach Rohan');
select is(
  array[cardinality(pg_temp.refs(pg_temp.j('history'))), cardinality(pg_temp.refs(pg_temp.j('who')))],
  array[5, 5],
  'five C-MMDD-NN rows in consent history, and Who has my number names the same five'
);
select is(pg_temp.refs(pg_temp.j('who')), pg_temp.refs(pg_temp.j('history')), '...the same refs');
-- Orbis Land's site office (the recipient of C-1012-04), as its workspace reads shares (wall 2).
select set_config('m2.orbis', pg_temp.claims(gen_random_uuid(), jsonb_build_object('org_roles', jsonb_build_object(
  (select recipient_org_id::text from app.consents where ref = 'C-1012-04' and principal_user_id = pg_temp.rohan()), 'site'))), true);
set local role authenticated;
select set_config('request.jwt.claims', current_setting('m2.orbis'), true);
select is(
  (select count(*)::int from app.contact_shares where buyer_user_id = pg_temp.rohan() and number_shared),
  1,
  'Orbis''s site office holds Rohan''s number through C-1012-04'
);
select set_config('request.jwt.claims', pg_temp.claims(pg_temp.rohan()), true);
select set_config('m2.withdraw', api.consent_withdraw('C-1012-04')::text, true);
select set_config('request.jwt.claims', current_setting('m2.orbis'), true);
select is(
  (select count(*)::int from app.contact_shares where buyer_user_id = pg_temp.rohan()),
  0,
  'withdrawing C-1012-04 ends Orbis''s access in the same instant: its workspace has no share left to unmask'
);
reset role;
select set_config('request.jwt.claims', '', true);
select results_eq(
  $$select s.ends_at = ops.now(), s.ended_reason from app.contact_shares s join app.consents c on c.id = s.consent_id where c.ref = 'C-1012-04'$$,
  $$values (true, 'withdrawn'::text)$$,
  'the share ended at the moment of the withdrawal'
);

-- E. 25 Oct 2026, the Jul–Sep QPR still missing: Elevated → High ---------------------------------
create temp table m2_run on commit drop as
select r.id as pending_run, n.id as notice, n.sent_at, n.effective_on,
       (select p.id from core.score_runs p where p.phase_id = r.phase_id and p.status = 'published' order by p.published_at desc limit 1) as published_run
  from core.score_runs r join core.band_notices n on n.proposed_run_id = r.id
 where r.phase_id = pg_temp.aurelia() and r.status = 'pending_notice';

select results_eq(
  $$select n.kind, n.from_band::text, n.to_band::text, n.sent_at, n.effective_on, n.status
      from core.band_notices n join m2_run m on m.notice = n.id$$,
  $$values ('notice_7day'::text, 'elevated'::text, 'high'::text, '2026-10-18 00:00+05:30'::timestamptz, '2026-10-25'::date, 'pending'::text)$$,
  'the developer''s 7-day notice went out on 18 Oct for Elevated → High, effective 25 Oct'
);
select is(
  api.risk_summary('aurelia-heights-phase-2') -> 'chip' ->> 'label', 'Elevated',
  'on 18 Oct buyers still see Elevated; the proposed band stays with the developer'
);

-- Advance the clock to 25 Oct, 03:15 IST: the daily QPR sweep's slot, inside Rohan's quiet hours.
select set_config('plinth.fixed_now', '2026-10-25T03:15:00+05:30', true);
select ops.sweep_qpr_missing();
select is(
  (select q.status from core.qpr_filings q where q.registration_id = (core.phase_registration(pg_temp.aurelia())).id and q.quarter = '2026-Q3'),
  'missing',
  'on 25 Oct the Jul–Sep 2026 QPR is still not on HARERA'
);
select todo_start('Gate gap: nothing publishes a pending_notice run on its notice''s effective date (no cron or ops function; pipelines'' settle_notice decides "effective" but writes nothing)');
select is(
  (core.published_run(pg_temp.aurelia())).id, (select pending_run from m2_run),
  'advancing the clock to 25 Oct (and running the jobs due by then) publishes the noticed run'
);
select todo_end();

-- The publish the notice promised (what a settle step would write): the noticed run goes
-- pending_notice → published, the Elevated run is superseded, the band history moves on 25 Oct.
select lives_ok($$
  do $p$
  begin
    update core.score_runs set status = 'superseded' where id = (select published_run from m2_run);
    update core.score_runs set status = 'published', published_at = ops.now() where id = (select pending_run from m2_run);
    update core.band_notices set status = 'effective' where id = (select notice from m2_run);
    update core.band_history set to_date = '2026-10-25' where phase_id = pg_temp.aurelia() and to_date is null;
    insert into core.band_history (phase_id, band, state, confidence, from_date, run_id, model_version)
      select r.phase_id, r.band, r.state, r.confidence, '2026-10-25', r.id, r.model_version
        from core.score_runs r where r.id = (select pending_run from m2_run);
  end $p$
$$, 'publish the noticed run on 25 Oct (pending_notice → published)');

select results_eq(
  $$select (core.published_run(pg_temp.aurelia())).id,
           api.risk_summary('aurelia-heights-phase-2') -> 'chip' ->> 'label',
           api.risk_summary('aurelia-heights-phase-2') -> 'meta' ->> 'generated_at'$$,
  $$select pending_run, 'High'::text, '2026-10-25T03:15:00+05:30'::text from m2_run$$,
  'buyers now read High, from the noticed run, as of 25 Oct'
);
select results_eq(
  $$select e.kind, e.occurred_on, e.before ->> 'band', e.after ->> 'band', e.public, e.run_id = m.pending_run
      from core.events e, m2_run m where e.phase_id = pg_temp.aurelia() and e.occurred_on = '2026-10-25'$$,
  $$values ('band_changed'::text, '2026-10-25'::date, 'elevated'::text, 'high'::text, true, true)$$,
  'one public band_changed event: Elevated → High on 25 Oct'
);
select set_config('m2.event', (select id::text from core.events where phase_id = pg_temp.aurelia() and occurred_on = '2026-10-25' and kind = 'band_changed'), true);

select results_eq(
  $$select user_id, channel, template_code from comms.outbox
     where dedupe_key like 'alert:' || current_setting('m2.event') || ':%' order by channel$$,
  $$values (pg_temp.rohan(), 'push'::text, null::text), (pg_temp.rohan(), 'whatsapp_template'::text, 'band_change_alert'::text)$$,
  'the follower gets push and the WhatsApp band_change_alert template, one row each'
);
-- What reaches the circle: never a payment stage or a project they were not given.
create temp table m2_circle_rows on commit drop as
select o.*, m.scope_all, m.scope_phase_ids, m.circle_id
  from comms.outbox o
  join app.family_members m on m.status = 'joined'
   and (o.user_id = m.member_user_id or o.contact_id = m.wa_contact_id);
select is(
  (select count(*)::int from m2_circle_rows r
    where r.payload ->> 'kind' = 'payment_stage' or r.payload::text ~ 'payment'
       or not (r.scope_all or exists (select 1 from core.phases ph
                                       where ph.id = any (r.scope_phase_ids)
                                         and r.payload ->> 'deep_link' = '/gurugram/projects/' || ph.slug))),
  0,
  'nothing private reaches the circle: no payment stage, and no project they were not given'
);
select todo_start('Gate gap: the JOIN reply promises "You''ll get the same alerts as Rohan" (purpose family_alerts), but ops.fan_out reads only app.follows, so a joined relative gets nothing (T43b handoff)');
select is(
  (select count(*)::int from m2_circle_rows r
    where r.dedupe_key like 'alert:' || current_setting('m2.event') || ':%'
      and r.contact_id = (pg_temp.j('ingest') -> 'contact' ->> 'id')::uuid and r.channel = 'whatsapp_template'),
  1,
  'the relative who joined for Aurelia gets its band-change template'
);
select todo_end();
select is(
  array(select distinct not_before from comms.outbox where dedupe_key like 'alert:' || current_setting('m2.event') || ':%'),
  array['2026-10-25 08:00:00+05:30'::timestamptz],
  'published at 03:15, inside his 22:00–08:00 quiet hours: both wait until 08:00 IST'
);
select ok(
  (select bool_and(n.sent_at <= r.published_at - interval '7 days')
     from core.band_notices n join m2_run m on m.notice = n.id join core.score_runs r on r.id = m.pending_run)
  and (select max(not_before) filter (where channel = 'push') <= min(not_before) filter (where channel = 'whatsapp_template')
         from comms.outbox where dedupe_key like 'alert:' || current_setting('m2.event') || ':%'),
  'the ladder: the developer heard 7 days before followers; push is never queued after WhatsApp'
);
select is(
  (select c.utility_opt_in and c.stopped_at is null and c.user_id = o.user_id
     from comms.outbox o join pii.wa_contacts c on c.id = o.contact_id
    where o.dedupe_key like 'alert:' || current_setting('m2.event') || ':%' and o.channel = 'whatsapp_template'),
  true,
  'the template goes to his own linked contact, opted in and not stopped'
);
select is(
  (select payload ->> 'deep_link' from comms.outbox
    where dedupe_key like 'alert:' || current_setting('m2.event') || ':%' and channel = 'push'),
  '/gurugram/projects/aurelia-heights-phase-2',
  'the push carries the project''s deep link'
);
select is(
  (select payload from comms.outbox where channel = 'revalidate' and basis = 'score_run:' || (select pending_run from m2_run)::text),
  '{"tags": ["phase:aurelia-heights-phase-2"]}'::jsonb,
  'the publish also queues the page revalidation for Aurelia'
);

-- The dispatcher's view: nothing of the alert is due at 03:15; both are at 08:00.
set local role service_role;
select set_config('m2.claim0315', api.outbox_claim_due(200)::text, true);
select set_config('plinth.fixed_now', '2026-10-25T08:00:00+05:30', true);
select set_config('m2.claim0800', api.outbox_claim_due(200)::text, true);
reset role;
select is(
  (select count(*)::int from jsonb_array_elements(pg_temp.j('claim0315')) x
    where x ->> 'dedupe_key' like 'alert:' || current_setting('m2.event') || ':%'),
  0,
  'outbox-dispatch claims neither alert during quiet hours'
);
select is(
  array(select x ->> 'channel' from jsonb_array_elements(pg_temp.j('claim0800')) x
         where x ->> 'dedupe_key' like 'alert:' || current_setting('m2.event') || ':%' order by 1),
  array['push', 'whatsapp_template'],
  'at 08:00 IST it claims both'
);
select set_config('m2.wa_row', (select x::text from jsonb_array_elements(pg_temp.j('claim0800')) x
  where x ->> 'dedupe_key' like 'alert:' || current_setting('m2.event') || ':%' and x ->> 'channel' = 'whatsapp_template'), true);
select is(
  array(select v from jsonb_array_elements_text(pg_temp.j('wa_row') -> 'template' -> 'variables') v
         where coalesce(pg_temp.j('wa_row') -> 'payload' ->> v, '') = ''),
  '{}'::text[],
  'the claimed template row fills every body variable comms.templates lists'
);
select is(
  array(select pg_temp.j('wa_row') -> 'payload' ->> v from jsonb_array_elements_text(pg_temp.j('wa_row') -> 'template' -> 'variables') v),
  array[(select name from core.phases where id = pg_temp.aurelia()), 'Elevated', 'High', 'new HARERA records', '25 Oct 2026'],
  'project, from band, to band, trigger and date, in the template''s order'
);
select todo_start('Gate gap: band_change_alert has an image header (comms.templates.header), but neither ops.fan_out''s payload nor outbox-dispatch''s buildWhatsAppRequest supplies the image');
select ok(
  pg_temp.j('wa_row') -> 'template' -> 'header' ->> 'type' <> 'image'
    or exists (select 1 from jsonb_each_text(pg_temp.j('wa_row') -> 'payload') p
                where p.value ~ '^(https?://[^ ]+|/cards/[^ ]+)\.png$'),
  'the row carries the header image the template requires'
);
select todo_end();
set local role service_role;
select set_config('m2.wa_contact', api.outbox_wa_contact((pg_temp.j('wa_row') ->> 'contact_id')::uuid)::text, true);
reset role;
select diag('m2:wa_claim ' || jsonb_build_object('row', pg_temp.j('wa_row'), 'contact', pg_temp.j('wa_contact'), 'now', ops.now())::text);

select * from finish();
rollback;
