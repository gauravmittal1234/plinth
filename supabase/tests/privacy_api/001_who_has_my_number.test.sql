-- T45b · api.who_has_my_number and the privacy RPCs' doors (API_CONTRACTS §4.10; BUILD_PLAN §12.2).
-- Runs on the §5b seed (Rohan: 3 number holders, a Northfield relay, an ended Meridian share).
-- Every privacy RPC is SECURITY DEFINER with search_path = '', executable by authenticated
-- only, and acts only for auth.uid(). Refs and counts in the payload are read from rows.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

update ops.runtime_settings set value = 'test' where key = 'env';

-- The doors -----------------------------------------------------------------------------
select is(
  (select array_agg(p.oid::regprocedure::text order by p.oid::regprocedure::text)
     from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and p.proname in ('who_has_my_number', 'consent_history', 'consent_withdraw', 'relay_renew',
                        'data_export_request', 'account_delete_request')
      and p.prosecdef
      and 'search_path=""' = any (p.proconfig)),
  array[
    'api.account_delete_request()', 'api.consent_history()', 'api.consent_withdraw(text,text)',
    'api.data_export_request()', 'api.relay_renew(uuid)', 'api.who_has_my_number()'
  ]::text[],
  'the six privacy RPCs are SECURITY DEFINER with search_path = '''''
);
select is(
  (select array_agg(p.proname::text order by p.proname::text)
     from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'api'
      and p.proname in ('who_has_my_number', 'consent_history', 'consent_withdraw', 'relay_renew',
                        'data_export_request', 'account_delete_request')
      and has_function_privilege('authenticated', p.oid, 'EXECUTE')),
  array['account_delete_request', 'consent_history', 'consent_withdraw', 'data_export_request',
        'relay_renew', 'who_has_my_number']::text[],
  'authenticated can execute all six'
);
select is(
  (select count(*)::int
     from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     cross join (values ('anon'), ('service_role')) as r(role)
    where n.nspname = 'api'
      and p.proname in ('who_has_my_number', 'consent_history', 'consent_withdraw', 'relay_renew',
                        'data_export_request', 'account_delete_request')
      and has_function_privilege(r.role, p.oid, 'EXECUTE')),
  0,
  'neither anon nor the service role can execute any of them'
);
select is(
  (select count(*)::int
     from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'app'
      and p.proname in ('privacy_caller', 'consent_party', 'consent_detail', 'who_has_my_number_json',
                        'consent_history_json', 'relay_backing_consent', 'partner_deletion_enqueue')
      and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE'))),
  0,
  'the app helpers are not callable from outside'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select api.who_has_my_number()$$, '42501', null, 'anon is refused (no EXECUTE)');
reset role;

select set_config('request.jwt.claims', '', true);
select throws_ok($$select api.who_has_my_number()$$, 'PT401', 'auth_required', 'no JWT at all: auth_required');
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"service_role"}', true);
select throws_ok($$select api.who_has_my_number()$$, 'PT403', 'forbidden', 'a service-role JWT with Rohan''s sub is forbidden');

-- Rohan ---------------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated"}', true);
select set_config('t45b.rohan', api.who_has_my_number()::text, true);
reset role;

select is(
  current_setting('t45b.rohan')::jsonb ->> 'schema', 'plinth.who_has_my_number/1', 'the envelope'
);
select is(
  current_setting('t45b.rohan')::jsonb ->> 'count_line',
  cardinality(app.number_holders('bff1ee72-9910-5980-a875-96a9a00b24cf'))::text || ' parties can reach you',
  'the count line is the number of distinct holders (app.number_holders)'
);
select is(
  current_setting('t45b.rohan')::jsonb ->> 'count_line', '3 parties can reach you', '3 parties can reach Rohan'
);
select is(
  array(select x ->> 'ref' from jsonb_array_elements(current_setting('t45b.rohan')::jsonb -> 'parties') as x),
  array(
    select c.ref
    from app.contact_shares s join app.consents c on c.id = s.consent_id
    where s.buyer_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf'
      and s.number_shared and s.ended_reason is null and (s.ends_at is null or s.ends_at > ops.now())
    order by s.starts_at, c.ref
  ),
  'the parties are the live number shares in the ledger, by ref'
);
select is(
  array(select x ->> 'ref' from jsonb_array_elements(current_setting('t45b.rohan')::jsonb -> 'parties') as x),
  array['C-1012-04', 'C-1012-05', 'C-1015-02']::text[],
  'Orbis Land (C-1012-04), Larkspur Realty (C-1012-05), Meridian Habitat site office (C-1015-02)'
);
select is(
  array(select x ->> 'party' from jsonb_array_elements(current_setting('t45b.rohan')::jsonb -> 'parties') as x),
  array(select c.party_label from app.consents c where c.ref in ('C-1012-04', 'C-1012-05', 'C-1015-02')
         and c.principal_user_id = 'bff1ee72-9910-5980-a875-96a9a00b24cf' order by c.granted_at, c.ref),
  'each party is the label the ledger recorded at the tap'
);
select results_eq(
  $$select x ->> 'shared_on', x ->> 'access_until'
      from jsonb_array_elements(current_setting('t45b.rohan')::jsonb -> 'parties') as x
     where x ->> 'ref' = 'C-1012-04'$$,
  $$select to_char(ops.ist_date(s.starts_at), 'YYYY-MM-DD'), to_char(ops.ist_date(s.ends_at), 'YYYY-MM-DD')
      from app.contact_shares s join app.consents c on c.id = s.consent_id where c.ref = 'C-1012-04'$$,
  'shared_on and access_until are the share''s own dates'
);
select is(
  (select (x ->> 'access_until') is null
     from jsonb_array_elements(current_setting('t45b.rohan')::jsonb -> 'parties') as x
    where x ->> 'ref' = 'C-1012-05'),
  true,
  'Larkspur''s share has no end, so no access_until'
);
select is(
  current_setting('t45b.rohan')::jsonb -> 'relays' -> 0 ->> 'ref',
  (select c.ref from app.consents c where c.id = app.relay_backing_consent('db21720c-ebb7-5578-a2ab-457ff4cb7ce8')),
  'the relay is listed under the visit consent that backs it'
);
select is(
  current_setting('t45b.rohan')::jsonb -> 'relays' -> 0,
  '{"ref": "C-1018-11", "party": "Northfield Estates site office", "line": "Aurelia visit Sat 24 Oct, 11 am, code 4821: the site office gets your first name and a relay, not your number.", "counts_toward_cap": false}'::jsonb,
  'the Northfield relay: first name and a relay, not counted'
);
select is(
  current_setting('t45b.rohan')::jsonb -> 'ended',
  '[{"ref": "C-0902-01", "party": "Meridian Habitat sales office", "detail": "Price list", "ended_on": "2026-10-02"}]'::jsonb,
  'the Meridian sales office share ended on 2 Oct 2026'
);

-- Another buyer sees only their own ------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"582a793f-ad80-5334-8d89-275221207fea","role":"authenticated"}', true);
select set_config('t45b.aman', api.who_has_my_number()::text, true);
reset role;

select is(current_setting('t45b.aman')::jsonb ->> 'count_line', 'No party can reach you', 'Aman: no number holders');
select is(jsonb_array_length(current_setting('t45b.aman')::jsonb -> 'parties'), 0, 'Aman sees no parties');
select ok(
  position('C-1012-04' in current_setting('t45b.aman')) = 0
    and position('C-1018-11' in current_setting('t45b.aman')) = 0
    and position('Orbis' in current_setting('t45b.aman')) = 0,
  'none of Rohan''s refs or parties appear in Aman''s payload'
);

-- One holder ------------------------------------------------------------------------------
select is(app.reach_line(1), '1 party can reach you', 'one holder reads "1 party"');
select is(app.reach_line(2), '2 parties can reach you', 'two holders read "2 parties"');

select * from finish();
rollback;
