-- T12 · ws.developer_claims and ws.developer_replies, the Developer says sources of
-- api.risk_summary (DATA_MODEL §4, §12 inv. 1 and 6; INTEGRATION_NOTES: a reply carries a
-- signatory name and a project or group scope).
-- RLS on, no grants: anon, authenticated and pipeline_writer cannot touch them, so developer
-- content reaches buyers only through api.* and never reaches scoring.
begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

select ok(to_regclass('ws.developer_claims') is not null, 'ws.developer_claims exists');
select ok(to_regclass('ws.developer_replies') is not null, 'ws.developer_replies exists');
select ok(
  (select bool_and(c.relrowsecurity) from pg_catalog.pg_class c
   where c.oid in ('ws.developer_claims'::regclass, 'ws.developer_replies'::regclass)),
  'RLS is enabled on both'
);
select is(
  (select array_agg(r.role || ' → ' || t.tbl order by 1)
   from (values ('ws.developer_claims'), ('ws.developer_replies')) as t(tbl)
   cross join (values ('anon'), ('authenticated'), ('pipeline_writer')) as r(role)
   where has_table_privilege(r.role, t.tbl, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')),
  null::text[],
  'anon, authenticated and pipeline_writer hold no privilege on either table'
);
select ok(
  not has_schema_privilege('pipeline_writer', 'ws', 'USAGE'),
  'pipeline_writer cannot even see ws: developer content cannot feed a band'
);

set local role anon;
select throws_ok('select 1 from ws.developer_claims limit 0', '42501', null, 'anon: select ws.developer_claims → permission denied');
select throws_ok('select 1 from ws.developer_replies limit 0', '42501', null, 'anon: select ws.developer_replies → permission denied');
reset role;

-- Columns and constraints ------------------------------------------------------------------------
select is(
  (select array_agg(a.attname::text order by a.attnum) from pg_catalog.pg_attribute a
   where a.attrelid = 'ws.developer_replies'::regclass and a.attnum > 0 and not a.attisdropped),
  array['id', 'phase_id', 'run_id', 'scope', 'text', 'signatory_title', 'signatory_name', 'published_at', 'check_by', 'status', 'created_at'],
  'a reply has a signatory name and a scope'
);
select is(
  (select col_description('ws.developer_replies'::regclass, a.attnum) ~ '^pii:C1'
   from pg_catalog.pg_attribute a where a.attrelid = 'ws.developer_replies'::regclass and a.attname = 'signatory_name'),
  true,
  'signatory_name is tagged pii:C1'
);
select is(
  (select count(*)::int from pg_catalog.pg_attribute a
   where a.attrelid in ('ws.developer_claims'::regclass, 'ws.developer_replies'::regclass)
     and a.attnum > 0 and not a.attisdropped
     and coalesce(col_description(a.attrelid, a.attnum), '') !~ '^pii:C[0-3]'),
  0,
  'every column of both tables carries a pii tag'
);

select throws_ok(
  $$insert into ws.developer_replies (phase_id, text, signatory_title, scope, status)
    values ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'x', 'Authorised signatory', 'tower', 'draft')$$,
  '23514', null, 'scope is project or group'
);
select throws_ok(
  $$insert into ws.developer_replies (phase_id, text, signatory_title, status)
    values ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'x', 'Authorised signatory', 'published')$$,
  '23514', null, 'a published reply needs published_at'
);
with x as (
  insert into ws.developer_replies (phase_id, text, signatory_title)
  values ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'T12 probe', 'Authorised signatory')
  returning scope, status
)
select is(x.scope || ' ' || x.status, 'project draft', 'a reply is a project draft unless it says otherwise') from x;
select throws_ok(
  $$insert into ws.developer_claims (phase_id, text, said_on, verified_state)
    values ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'x', '2026-10-15', 'maybe')$$,
  '23514', null, 'verified_state is unverified, verified or contradicted'
);
select throws_ok(
  $$insert into ws.developer_claims (phase_id, text, said_on, check_by)
    values ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'x', '2026-10-15', '2026-10-01')$$,
  '23514', null, 'check_by cannot be before the claim'
);
select throws_ok(
  $$insert into ws.developer_claims (phase_id, text, said_on)
    values ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '   ', '2026-10-15')$$,
  '23514', null, 'a claim has text'
);
with x as (
  insert into ws.developer_claims (phase_id, text, said_on)
  values ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'T12 probe claim.', '2026-10-15')
  returning public, verified_state
)
select is(x.public::text || ' ' || x.verified_state, 'false unverified', 'a claim is private and unverified until changed') from x;
select throws_ok(
  $$insert into ws.developer_claims (phase_id, text, said_on, linked_fact_id)
    values ('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'x', '2026-10-15', '00000000-0000-4000-8000-000000000000')$$,
  '23503', null, 'a claim links to a real fact'
);

-- Audit (BUILD_PLAN §12.2) -------------------------------------------------------------------------
select is(
  (select count(*)::int from ops.audit_log where entity = 'ws.developer_replies' and action = 'insert' and after ->> 'text' = 'T12 probe'),
  1,
  'inserting a reply writes an audit row'
);
update ws.developer_claims set public = true where text = 'T12 probe claim.';
select is(
  (select count(*)::int from ops.audit_log
   where entity = 'ws.developer_claims' and action = 'update'
     and before ->> 'public' = 'false' and after ->> 'public' = 'true'),
  1,
  'publishing a claim is audited with before and after'
);

select * from finish();
rollback;
