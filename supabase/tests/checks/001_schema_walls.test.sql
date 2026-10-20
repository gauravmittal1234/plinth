-- T60 · The M3 check tables: shape and walls (DATA_MODEL §0, §7, §10, §12 inv. 1; BUILD_PLAN §12.10).
-- Every new table has RLS on, no grant to anon or authenticated (a live probe gets "permission
-- denied"), a pii: tag on every column, and owner-only SELECT policies (no write policy at all:
-- RPCs only). The queue and the AI log are admin-only; core.check_rules has no policy (api only).
-- app.uploads keeps T53's columns and gains the M3 ones. Every T60 function pins search_path.
begin;
create extension if not exists pgtap with schema extensions;
select plan(16);

create temp table t60_tables (name text primary key);
insert into t60_tables values
  ('core.check_rules'), ('app.doc_checks'), ('app.extracted_claims'), ('app.claim_verdicts'),
  ('app.cost_sheet_reads'), ('app.bookings'), ('app.payee_checks'), ('app.receipts'),
  ('ops.review_tasks'), ('ops.ai_generations'), ('ops.ai_task_budgets');
grant select on t60_tables to public;

select is(
  (select array_agg(t.name order by 1) from t60_tables t where to_regclass(t.name) is null),
  null::text[],
  'all 11 T60 tables exist'
);

select is(
  (
    select array_agg(t.name order by 1)
    from t60_tables t
    join pg_catalog.pg_class c on c.oid = to_regclass(t.name)
    where not c.relrowsecurity
  ),
  null::text[],
  'RLS is on for every T60 table'
);

select is(
  (
    select array_agg(r.role || ' → ' || t.name order by 1)
    from t60_tables t
    cross join (values ('anon'), ('authenticated')) as r(role)
    where has_table_privilege(r.role, to_regclass(t.name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
       or has_any_column_privilege(r.role, to_regclass(t.name), 'SELECT,INSERT,UPDATE,REFERENCES')
  ),
  null::text[],
  'anon and authenticated hold no privilege on any T60 table'
);

-- Live probes: every T60 table answers "permission denied" to anon and to authenticated.
create temp table t60_probe (role text, tbl text, outcome text);
grant all on t60_probe to public;

set local role anon;
do $$
declare
  r record;
begin
  for r in select t.name from t60_tables t loop
    begin
      execute pg_catalog.format('select 1 from %s limit 0', r.name);
      insert into t60_probe values (current_user, r.name, 'readable');
    exception
      when insufficient_privilege then
        insert into t60_probe values (current_user, r.name, 'denied');
    end;
  end loop;
end
$$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated","plinth_roles":["admin"],"aal":"aal2"}', true);
do $$
declare
  r record;
begin
  for r in select t.name from t60_tables t loop
    begin
      execute pg_catalog.format('select 1 from %s limit 0', r.name);
      insert into t60_probe values (current_user, r.name, 'readable');
    exception
      when insufficient_privilege then
        insert into t60_probe values (current_user, r.name, 'denied');
    end;
  end loop;
end
$$;
reset role;
select set_config('request.jwt.claims', '', true);

select is(
  (select array_agg(role || ' read ' || tbl order by 1) from t60_probe where outcome = 'readable'),
  null::text[],
  'SELECT on every T60 table is denied to anon and to authenticated (even an admin with aal2)'
);
select is(
  (select count(*)::int from t60_probe where outcome = 'denied'),
  22,
  'the probe ran: 11 tables × 2 roles denied'
);

-- PII tags on every column (BUILD_PLAN §12.10), and on the new app.uploads columns.
select is(
  (
    select array_agg(t.name || '.' || a.attname order by 1)
    from t60_tables t
    join pg_catalog.pg_attribute a on a.attrelid = to_regclass(t.name)
    where a.attnum > 0 and not a.attisdropped
      and coalesce(col_description(a.attrelid, a.attnum), '') !~ '^pii:C[0-3]'
  ),
  null::text[],
  'every column of every T60 table carries a pii:C0–C3 tag'
);
select is(
  (
    select array_agg(a.attname::text order by 1)
    from pg_catalog.pg_attribute a
    where a.attrelid = 'app.uploads'::regclass and a.attnum > 0 and not a.attisdropped
      and coalesce(col_description(a.attrelid, a.attnum), '') !~ '^pii:C[0-3]'
  ),
  null::text[],
  'every column of app.uploads (T53''s and the M3 ones) carries a pii tag'
);

-- Policies: owner-only SELECT on the buyer tables; admin-only SELECT on ops; none on the rules.
select is(
  (
    select array_agg(p.schemaname || '.' || p.tablename || ':' || p.policyname || ':' || p.cmd
                     order by p.schemaname || '.' || p.tablename || ':' || p.policyname)
    from pg_catalog.pg_policies p
    where p.schemaname || '.' || p.tablename in (select name from t60_tables)
  ),
  array[
    'app.bookings:own_read:SELECT', 'app.claim_verdicts:own_read:SELECT', 'app.cost_sheet_reads:own_read:SELECT',
    'app.doc_checks:own_read:SELECT', 'app.extracted_claims:own_read:SELECT', 'app.payee_checks:own_read:SELECT',
    'app.receipts:own_read:SELECT', 'ops.ai_generations:admin_read:SELECT', 'ops.ai_task_budgets:admin_read:SELECT',
    'ops.review_tasks:admin_read:SELECT'
  ]::text[],
  'policies: own_read on the seven buyer tables, admin_read on the three ops tables, SELECT only; none on core.check_rules'
);
select is(
  (
    select array_agg(distinct r order by r)
    from pg_catalog.pg_policies p, unnest(p.roles) as r
    where p.schemaname || '.' || p.tablename in (select name from t60_tables)
  ),
  array['authenticated']::name[],
  'every T60 policy is for authenticated only (anon gets none)'
);
select is(
  (
    select array_agg(p.tablename::text order by 1)
    from pg_catalog.pg_policies p
    where p.schemaname = 'app' and p.policyname = 'own_read'
      and p.tablename in ('doc_checks', 'extracted_claims', 'claim_verdicts', 'cost_sheet_reads', 'bookings', 'payee_checks', 'receipts')
      and coalesce(p.qual, '') !~ 'auth\.uid\(\)'
  ),
  null::text[],
  'every buyer-table policy is keyed on the caller''s own auth.uid()'
);

-- app.uploads: ALTERed, not re-created.
select is(
  (
    select array_agg(c.column_name::text order by c.ordinal_position)
    from information_schema.columns c
    where c.table_schema = 'app' and c.table_name = 'uploads'
  ),
  array[
    'id', 'owner_user_id', 'wa_contact_id', 'kind', 'storage_key', 'sha256', 'mime', 'pages', 'saved',
    'retain_until', 'deleted_at', 'created_at', 'channel', 'wa_message_id', 'bytes', 'status',
    'rejected_reason', 'stored_at'
  ]::text[],
  'app.uploads keeps T53''s columns in place and adds channel, wa_message_id, bytes, status, rejected_reason, stored_at'
);
select is(
  (select column_default from information_schema.columns
    where table_schema = 'app' and table_name = 'uploads' and column_name = 'status'),
  '''stored''::text',
  'rows written before M3 read as stored'
);
select ok(
  exists (select 1 from pg_catalog.pg_indexes where schemaname = 'app' and tablename = 'uploads'
           and indexname = 'uploads_wa_message_idx' and indexdef ~* 'unique')
  and exists (select 1 from pg_catalog.pg_policies where schemaname = 'app' and tablename = 'uploads' and policyname = 'own_read'),
  'a forwarded WhatsApp file is stored once (unique wa_message_id); T53''s own_read policy stays'
);

-- Functions: definer functions pin search_path = ''; the AI RPCs are definer.
select is(
  (
    select array_agg(p.oid::regprocedure::text order by 1)
    from pg_catalog.pg_proc p
    where p.oid in (
      'app.has_digit_run(text, integer)'::regprocedure,
      'app.claim_verdicts_guard()'::regprocedure,
      'ops.ai_generations_expire(integer)'::regprocedure,
      'api.ai_budget_status(text)'::regprocedure,
      'api.ai_generation_log(text, text, text, text, text, text, text, text, text, jsonb, integer, integer, numeric, integer, integer, text)'::regprocedure,
      'app.dpdp_export_json(uuid, uuid)'::regprocedure,
      'app.dpdp_erase_user(uuid, text)'::regprocedure
    )
    and not (coalesce(p.proconfig, '{}') @> array['search_path=""'])
  ),
  null::text[],
  'every T60 function (and the two re-created T53 ones) sets search_path = '''''
);
select ok(
  (select bool_and(p.prosecdef) from pg_catalog.pg_proc p where p.oid in (
    'api.ai_budget_status(text)'::regprocedure,
    'api.ai_generation_log(text, text, text, text, text, text, text, text, text, jsonb, integer, integer, numeric, integer, integer, text)'::regprocedure,
    'app.dpdp_export_json(uuid, uuid)'::regprocedure,
    'app.dpdp_erase_user(uuid, text)'::regprocedure
  )),
  'the AI RPCs and the DPDP functions are SECURITY DEFINER'
);
select is(
  (
    select array_agg(p.oid::regprocedure::text order by 1)
    from pg_catalog.pg_proc p
    cross join (values ('anon'), ('authenticated')) as r(role)
    where p.oid in (
      'app.has_digit_run(text, integer)'::regprocedure,
      'app.claim_verdicts_guard()'::regprocedure,
      'ops.ai_generations_expire(integer)'::regprocedure,
      'app.dpdp_export_json(uuid, uuid)'::regprocedure,
      'app.dpdp_erase_user(uuid, text)'::regprocedure
    )
    and has_function_privilege(r.role, p.oid, 'EXECUTE')
  ),
  null::text[],
  'no private T60 function is executable by anon or authenticated'
);

select * from finish();
rollback;
