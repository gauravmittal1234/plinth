-- T13 · the tables behind the project page (DATA_MODEL §1, §4; §12 inv. 1 and 6):
-- ws.price_lists, price_list_items, payment_plans, payment_plan_stages, cost_sheets,
-- cost_sheet_lines, developer_documents, core.cost_rule_sets and core.editorial_notes.
-- RLS on, no grants: anon, authenticated and pipeline_writer cannot touch them, so developer
-- content reaches buyers only through api.* and never reaches scoring. Seeded from §5b.
begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

create temp table t13_tables (tbl text primary key);
insert into t13_tables values
  ('core.cost_rule_sets'), ('core.editorial_notes'), ('ws.price_lists'), ('ws.price_list_items'), ('ws.payment_plans'),
  ('ws.payment_plan_stages'), ('ws.cost_sheets'), ('ws.cost_sheet_lines'), ('ws.developer_documents');

select is((select count(*)::int from t13_tables where to_regclass(tbl) is not null), 9, 'the 9 T13 tables exist');
select ok(
  (select bool_and(c.relrowsecurity) from t13_tables t join pg_catalog.pg_class c on c.oid = to_regclass(t.tbl)),
  'RLS is enabled on every one'
);
select is(
  (select array_agg(r.role || ' → ' || t.tbl order by 1)
   from t13_tables t cross join (values ('anon'), ('authenticated'), ('pipeline_writer')) as r(role)
   where has_table_privilege(r.role, t.tbl, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')),
  null::text[],
  'anon, authenticated and pipeline_writer hold no privilege on any of them'
);
set local role anon;
select throws_ok('select 1 from ws.price_lists limit 0', '42501', null, 'anon: select ws.price_lists → permission denied');
select throws_ok('select 1 from ws.cost_sheets limit 0', '42501', null, 'anon: select ws.cost_sheets → permission denied');
select throws_ok('select 1 from core.editorial_notes limit 0', '42501', null, 'anon: select core.editorial_notes → permission denied');
reset role;
select is(
  (select array_agg(t.tbl || '.' || a.attname order by 1)
   from t13_tables t join pg_catalog.pg_attribute a on a.attrelid = to_regclass(t.tbl)
   where a.attnum > 0 and not a.attisdropped and coalesce(col_description(a.attrelid, a.attnum), '') !~ '^pii:C[0-3]'),
  null::text[],
  'every column carries a pii:C0–C3 tag'
);
select is(
  (select array_agg(c.relname::text order by 1)
   from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where (n.nspname || '.' || c.relname) in ('core.cost_rule_sets', 'core.editorial_notes', 'ws.price_lists', 'ws.payment_plans',
                                             'ws.cost_sheets', 'ws.developer_documents')
     and not exists (select 1 from pg_catalog.pg_trigger tg where tg.tgrelid = c.oid and tg.tgname like '%_audit')),
  null::text[],
  'the parent tables are audited'
);

-- The §5b seed --------------------------------------------------------------------------------------
select is((select count(*)::int from ws.price_lists where phase_id = '4da0daeb-835b-54d5-9c09-a23ee9cb4b36' and status = 'published'), 4,
  'Aurelia: price lists of Jan 2023, 1 Jul 2025, 1 Apr 2026 and 2 Oct 2026');
select is(
  (select array_agg(slab_no order by seq) filter (where stage_kind = 'slab') from ws.payment_plan_stages s
   join ws.payment_plans p on p.id = s.plan_id where p.phase_id = '4da0daeb-835b-54d5-9c09-a23ee9cb4b36'),
  array[3, 6, 9, 12, 15, 18, 20],
  'Aurelia: 13 stages, slabs 3/6/9/12/15/18/20 at 7.5%'
);
select is(
  (select stamp_duty_pct from core.cost_rule_sets where version = '2026.10' and state = 'HR'),
  '{"male": 7, "female": 5, "joint": 6}'::jsonb,
  'rules v2026.10 (HR): stamp duty by buyer'
);
select is((select unit_label from ws.cost_sheets where phase_id = '4da0daeb-835b-54d5-9c09-a23ee9cb4b36'), 'park-facing',
  'the cost sheet prices the park-facing 3 BHK');
select is(
  (select (summary ->> 'fee_per_sqft_super_inr')::int from ws.developer_documents
   where phase_id = '4da0daeb-835b-54d5-9c09-a23ee9cb4b36' and kind = 'transfer_policy'),
  150,
  'the transfer policy: ₹150 per sq ft of super area'
);

-- Constraints ----------------------------------------------------------------------------------------
select throws_ok(
  $$insert into ws.payment_plan_stages (plan_id, seq, label, stage_kind, slab_no, pct)
    select id, 99, 'Slab ?', 'slab', null, 1 from ws.payment_plans limit 1$$,
  '23514', null, 'a slab stage must name its slab');
select throws_ok(
  $$insert into ws.price_lists (phase_id, published_on, lane) values ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '2026-10-18', 'records_show')$$,
  '23514', null, 'developer content is always from_developer, never a record');
select throws_ok(
  $$delete from ws.price_lists where id = 'f42c1bf3-d48f-554c-a72c-c0e8a7284110'$$,
  '42501', 'ws.price_lists: a published price list is never deleted', 'a published price list is history: never deleted');
select lives_ok(
  $$with d as (insert into ws.price_lists (phase_id, published_on) values ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '2026-10-18') returning id)
    delete from ws.price_lists where id in (select id from d)$$,
  'a draft price list may be deleted');
select throws_ok(
  $$insert into ws.payment_plans (phase_id, kind, name, status) values ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'subvention', 'x', 'published')$$,
  '23514', null, 'a published plan has a date');
select is(
  (select count(*)::int from ops.audit_log where entity = 'ws.price_lists' and action = 'insert'
     and (after ->> 'published_on') = '2026-10-18'),
  1,
  'writes to ws.price_lists are audited'
);

-- Editorial notes: Plinth's own notes, fixture rows only in the fixture world ------------------------
select is(
  (core.editorial('phase', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'getting_around')).lane::text,
  'our_estimate',
  'getting around is Plinth''s estimate (our_estimate lane)'
);
select ok(
  (select bool_and(fixture and source <> '') from core.editorial_notes),
  'every R1 note is a fixture row with its source'
);
update ops.runtime_settings set value = 'prod' where key = 'env';
select is(
  (core.editorial('phase', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'getting_around')).id,
  null::uuid,
  'outside the fixture world (env = prod) the fixture notes are never read'
);
update ops.runtime_settings set value = 'fixture' where key = 'env';
select ok(
  not exists (
    select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'core' and p.proname like 'score%' and pg_catalog.pg_get_functiondef(p.oid) like '%editorial_notes%'),
  'no scoring function reads the editorial notes'
);

select * from finish();
rollback;
