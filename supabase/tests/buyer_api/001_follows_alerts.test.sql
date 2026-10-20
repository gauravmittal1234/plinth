-- T45a · Buyer API: follows, alerts, me and devices (API_CONTRACTS §3.2, §4.7, §4.9).
-- Every RPC acts only for auth.uid(): one buyer's calls never read or change another's rows.
-- A replayed p_client_id returns the first result and writes one row. A WhatsApp tap JWT is
-- accepted only where the function allows it and only for a real tap (T44).
-- Users ...45a001 (A), ...45a002 (B); test numbers +91 99000 00381/382 (the fixture-only block).
begin;
create extension if not exists pgtap with schema extensions;
select plan(46);

update ops.runtime_settings set value = 'test' where key = 'env';

insert into auth.users (id, phone, raw_user_meta_data) values
  ('00000000-0000-4000-8000-00000045a001', '919900000381', '{"first_name":"T45a Asha"}'),
  ('00000000-0000-4000-8000-00000045a002', '919900000382', '{"first_name":"T45a Bina"}');
insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-00000045a101', 't45a-f1-group', 'T45a F1 Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-00000045a102', 't45a-f1-project', 'T45a F1 Project', '00000000-0000-4000-8000-00000045a101');
insert into core.phases (id, project_id, slug, name) values
  ('00000000-0000-4000-8000-00000045a103', '00000000-0000-4000-8000-00000045a102', 't45a-one', 'T45a One'),
  ('00000000-0000-4000-8000-00000045a104', '00000000-0000-4000-8000-00000045a102', 't45a-two', 'T45a Two');

-- Grants ------------------------------------------------------------------------------
select is(
  (
    select array_agg(p.proname::text order by 1)
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and p.proname in ('me', 'device_register', 'follow', 'unfollow', 'set_follow_type', 'alert_prefs_get', 'alert_prefs_set')
      and (not has_function_privilege('authenticated', p.oid, 'EXECUTE')
           or has_function_privilege('anon', p.oid, 'EXECUTE')
           or has_function_privilege('service_role', p.oid, 'EXECUTE'))
  ),
  null::text[],
  'the follow, alert, me and device RPCs are granted to authenticated only'
);
select is(
  (
    select array_agg(p.proname::text order by 1)
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and p.proname in ('me', 'device_register', 'follow', 'unfollow', 'set_follow_type', 'alert_prefs_get', 'alert_prefs_set')
      and (not p.prosecdef or not exists (select 1 from unnest(p.proconfig) c where c = 'search_path=""'))
  ),
  null::text[],
  'each is SECURITY DEFINER with search_path pinned to empty'
);

create temp table t45a_out (k text primary key, v jsonb);
grant all on t45a_out to public;

-- No buyer, no call ------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '', true);
select throws_ok($$select api.follow('t45a-one')$$, '42501', null, 'anon cannot call a buyer RPC at all');
set local role authenticated;
select throws_ok($$select api.alert_prefs_get()$$, 'PT401', 'auth_required', 'no JWT claims: auth_required');
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"service_role"}', true);
select throws_ok($$select api.follow('t45a-one')$$, 'PT403', 'forbidden', 'the service role cannot act for a buyer, even with a sub');

-- A follows -------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
insert into t45a_out values ('a1', api.follow('t45a-one', 'watching', 'web', '00000000-0000-4000-8000-00000045ac01'));
select is((select v ->> 'schema' from t45a_out where k = 'a1'), 'plinth.follow/1', 'follow: plinth.follow/1');
select is((select v ->> 'followed_at' from t45a_out where k = 'a1'), '2026-10-18T12:00:00+05:30', 'follow: dated by the business clock, in IST');
select ok((select not (v ? 'links') from t45a_out where k = 'a1'), 'watching: no booked-buyer links');
select is(
  api.follow('t45a-one', 'watching', 'web', '00000000-0000-4000-8000-00000045ac01'),
  (select v from t45a_out where k = 'a1'),
  'a replayed p_client_id returns the first result'
);
select throws_ok(
  $$select api.unfollow('t45a-one', '00000000-0000-4000-8000-00000045ac01')$$,
  'PT409', 'conflict', 'a client id already used by another function is a conflict'
);
select throws_ok($$select api.follow('t45a-nowhere')$$, 'PT404', 'not_found', 'an unknown slug: not_found');
select throws_ok($$select api.follow('t45a-one', 'bought')$$, 'PT422', 'invalid_input', 'a follow is watching or booked');
select throws_ok($$select api.follow('t45a-one', 'watching', 'whatsapp')$$, 'PT422', 'invalid_input', 'only a WhatsApp tap records source whatsapp');

-- B follows the same phase, then leaves; A is untouched ---------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a002","role":"authenticated"}', true);
select lives_ok($$select api.follow('t45a-one', 'watching', 'app', '00000000-0000-4000-8000-00000045ac01')$$, 'B may use the same client id: ids are per buyer');
select throws_ok($$select api.set_follow_type('t45a-two', 'booked')$$, 'PT404', 'not_found', 'set_follow_type needs the caller''s own follow');
select is((api.unfollow('t45a-one') ->> 'ok')::boolean, true, 'B unfollows');
reset role;
select is(
  (select array_agg(user_id::text || ':' || source order by user_id) from app.follows where phase_id = '00000000-0000-4000-8000-00000045a103'),
  array['00000000-0000-4000-8000-00000045a001:web'],
  'one row per replayed follow, and B''s unfollow left A''s follow alone'
);
select is(
  (select count(*)::int from ops.audit_log where entity = 'app.follows' and actor_user_id = '00000000-0000-4000-8000-00000045a002'),
  2,
  'B''s follow and unfollow are audited under B'
);

-- Booked ------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
insert into t45a_out values ('booked', api.set_follow_type('t45a-one', 'booked', '00000000-0000-4000-8000-00000045ac02'));
select is((select v ->> 'follow_type' from t45a_out where k = 'booked'), 'booked', 'set_follow_type: booked');
select is(
  (select pg_catalog.jsonb_path_query_array(v, '$.links[*].href') from t45a_out where k = 'booked'),
  '["/check/pay-as-built", "/guides/booked-buyer"]'::jsonb,
  'booked: the Pay-as-built and booked-buyer links'
);
select is(
  (select v ->> 'followed_at' from t45a_out where k = 'booked'),
  (select v ->> 'followed_at' from t45a_out where k = 'a1'),
  'changing the type keeps the follow''s date'
);
reset role;
select is(
  (select array_agg(user_id::text || ':' || channel || ':' || kind) from app.alert_subscriptions
   where user_id in ('00000000-0000-4000-8000-00000045a001', '00000000-0000-4000-8000-00000045a002')),
  array['00000000-0000-4000-8000-00000045a001:push:payment_stage'],
  'booked adds payment-stage alerts for A only'
);

-- Alerts ------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
select throws_ok(
  $$select api.alert_prefs_set('{"whatsapp": {"band_change": "instant"}}'::jsonb)$$,
  'PT409', 'consent_required', 'WhatsApp alerts without a linked WhatsApp contact: consent_required'
);
select throws_ok(
  $$select api.alert_prefs_set('{"push": {"band_change": "hourly"}}'::jsonb)$$,
  'PT422', 'invalid_input', 'an unknown cadence: invalid_input'
);
select throws_ok(
  $$select api.alert_prefs_set('{"push": {"band_change": "instant"}, "pager": {"digest": "instant"}}'::jsonb)$$,
  'PT422', 'invalid_input', 'an unknown channel: invalid_input, and nothing is written'
);
insert into t45a_out values ('p1', api.alert_prefs_set(
  '{"push": {"band_change": "instant", "digest": "weekly_sun_9am"}, "quiet_hours": {"from": "22:00", "to": "08:00"}}'::jsonb,
  '00000000-0000-4000-8000-00000045ac03'));
select is(
  (select v -> 'prefs' from t45a_out where k = 'p1'),
  '{"push": {"band_change": "instant", "digest": "weekly_sun_9am", "payment_stage": "instant"}, "quiet_hours": {"from": "22:00", "to": "08:00"}}'::jsonb,
  'alert_prefs_set: cadences per kind and the quiet hours (IST)'
);
select is((select v ->> 'whatsapp_optin' from t45a_out where k = 'p1'), 'false', 'no linked WhatsApp: whatsapp_optin false');
select is((select v -> 'lines' from t45a_out where k = 'p1'), '["Utility alerts only. No offers, no ads, and nothing from developers."]'::jsonb, 'no STOP line without WhatsApp');
select is((select v ->> 'number_line' from t45a_out where k = 'p1'), 'No party can reach you now. Family in your circle never see it.', 'the number line counts A''s holders');
select lives_ok($$select api.alert_prefs_set('{"push": {"digest": "off"}, "quiet_hours": null}'::jsonb)$$, 'a later change: digest off, quiet hours cleared');
select is(
  api.alert_prefs_set('{"push": {"band_change": "instant"}}'::jsonb, '00000000-0000-4000-8000-00000045ac03'),
  (select v from t45a_out where k = 'p1'),
  'a late replay returns the first result and does not undo the later change'
);
select is(
  api.alert_prefs_get() -> 'prefs',
  '{"push": {"band_change": "instant", "digest": "off", "payment_stage": "instant"}, "quiet_hours": null}'::jsonb,
  'alert_prefs_get: the latest settings'
);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a002","role":"authenticated"}', true);
select is(api.alert_prefs_get() -> 'prefs', '{"quiet_hours": null}'::jsonb, 'B sees none of A''s alert settings');

-- me ----------------------------------------------------------------------------------
select is(
  api.me() - 'adult_attested_at',
  '{"schema": "plinth.me/1", "user_id": "00000000-0000-4000-8000-00000045a002", "first_name": "T45a Bina", "phone_masked": "+91 99••• ••382", "roles": ["buyer"]}'::jsonb,
  'me: the caller''s own profile, a masked number and the buyer role'
);

-- Devices -----------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a001","role":"authenticated"}', true);
select is(api.device_register('t45a-token-1', 'android', '1.0.0'), '{"ok": true}'::jsonb, 'device_register: ok');
select lives_ok($$select api.device_register('t45a-token-2', 'ios')$$, 'a second device');
select throws_ok($$select api.device_register('t45a-token-3', 'blackberry')$$, 'PT422', 'invalid_input', 'an unknown platform: invalid_input');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-00000045a002","role":"authenticated"}', true);
select lives_ok($$select api.device_register('t45a-token-1', 'android', '1.0.1')$$, 'B signs in on A''s old phone');
reset role;
select is(
  (select array_agg(fcm_token || ':' || user_id::text order by fcm_token) from app.devices where fcm_token like 't45a-token-%'),
  array['t45a-token-1:00000000-0000-4000-8000-00000045a002', 't45a-token-2:00000000-0000-4000-8000-00000045a001'],
  'the token moves to B; A''s other device is untouched'
);

-- A WhatsApp tap JWT ------------------------------------------------------------------
set local role service_role;
select api.wa_ingest_inbound('919900000381', 'wamid.t45a.tap-1', 'button', '{"button": {"payload": "follow"}}'::jsonb);
reset role;
update pii.wa_contacts set user_id = '00000000-0000-4000-8000-00000045a001', utility_opt_in = true where wa_id_e164 = '+919900000381';
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'role', 'authenticated', 'sub', '00000000-0000-4000-8000-00000045a001',
  'amr', jsonb_build_array(jsonb_build_object('method', 'whatsapp_tap', 'timestamp', 1792305000)),
  'wa_message_id', 'wamid.t45a.tap-1')::text, true);
select lives_ok($$select api.follow('t45a-two', 'watching', 'web')$$, 'a tap JWT may follow');
select throws_ok($$select api.device_register('t45a-token-4', 'android')$$, 'PT403', 'forbidden', 'a tap JWT cannot register a device');
select ok((api.alert_prefs_get() ->> 'whatsapp_optin')::boolean, 'a tap JWT may read alert settings; the linked, opted-in contact shows');
select set_config('request.jwt.claims', jsonb_build_object(
  'role', 'authenticated', 'sub', '00000000-0000-4000-8000-00000045a001',
  'amr', jsonb_build_array(jsonb_build_object('method', 'whatsapp_tap', 'timestamp', 1792305000)),
  'wa_message_id', 'wamid.t45a.not-a-tap')::text, true);
select throws_ok($$select api.follow('t45a-one')$$, 'PT403', 'forbidden', 'a tap JWT naming no real tap is refused');
select set_config('request.jwt.claims', jsonb_build_object(
  'role', 'authenticated', 'sub', '00000000-0000-4000-8000-00000045a002',
  'amr', jsonb_build_array(jsonb_build_object('method', 'whatsapp_tap', 'timestamp', 1792305000)),
  'wa_message_id', 'wamid.t45a.tap-1')::text, true);
select throws_ok($$select api.follow('t45a-one')$$, 'PT403', 'forbidden', 'A''s tap never acts for B');
reset role;
select is(
  (select source from app.follows where user_id = '00000000-0000-4000-8000-00000045a001' and phase_id = '00000000-0000-4000-8000-00000045a104'),
  'whatsapp',
  'a follow made by a tap is recorded as from WhatsApp'
);
select is(
  (select count(*)::int from app.rpc_replays where user_id = '00000000-0000-4000-8000-00000045a001'),
  3,
  'the replay log holds A''s three client ids (follow, set_follow_type, alert_prefs_set)'
);

select * from finish();
rollback;
