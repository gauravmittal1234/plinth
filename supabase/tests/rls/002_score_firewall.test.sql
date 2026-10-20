-- T04 · The score firewall (DATA_MODEL §12 inv. 2; BUILD_PLAN §12.4).
-- Wall 1: authenticated has no grant on core at all.
-- Wall 2: the RLS policies. With a temporary grant (rolled back), support,
-- agent, developer and buyer roles read 0 draft or pending rows and their
-- reasons; methodology and admin (aal2 only) read them.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

-- Fixture: one phase with a published, a draft and a pending_notice run.
insert into core.developer_groups (id, slug, name)
values ('00000000-0000-4000-8000-0000000004a1', 't04-fw-group', 'T04 Firewall Group');
insert into core.projects (id, slug, name, group_id)
values ('00000000-0000-4000-8000-0000000004a2', 't04-fw-project', 'T04 Firewall Project', '00000000-0000-4000-8000-0000000004a1');
insert into core.phases (id, project_id, slug, name)
values ('00000000-0000-4000-8000-0000000004a3', '00000000-0000-4000-8000-0000000004a2', 't04-fw-phase', 'T04 Firewall Phase');
insert into core.score_models (version, status) values ('t04-fw', 'draft');
insert into core.score_runs (id, phase_id, model_version, data_cutoff, status, state, band, set_by, published_at) values
  ('00000000-0000-4000-8000-0000000004b1', '00000000-0000-4000-8000-0000000004a3', 't04-fw', '2026-10-14', 'published', 'scored', 'elevated', 'model', '2026-10-14 10:00+05:30'),
  ('00000000-0000-4000-8000-0000000004b2', '00000000-0000-4000-8000-0000000004a3', 't04-fw', '2026-10-25', 'draft', 'scored', 'high', 'model', null),
  ('00000000-0000-4000-8000-0000000004b3', '00000000-0000-4000-8000-0000000004a3', 't04-fw', '2026-10-25', 'pending_notice', 'scored', 'high', 'model', null);
insert into core.score_reasons (run_id, rank, factor, code, text, fact_ids) values
  ('00000000-0000-4000-8000-0000000004b1', 1, 'finances', 'T04_PUBLISHED', 'published reason', array[gen_random_uuid()]),
  ('00000000-0000-4000-8000-0000000004b2', 1, 'timeline', 'T04_DRAFT', 'draft reason', array[gen_random_uuid()]),
  ('00000000-0000-4000-8000-0000000004b3', 1, 'timeline', 'T04_PENDING', 'pending reason', array[gen_random_uuid()]);

-- Wall 1 -------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000004f1","role":"authenticated","plinth_roles":["methodology"]}', true);
select throws_ok(
  'select * from core.score_runs', '42501', null,
  'wall 1: even methodology cannot select core.score_runs directly (no grant)'
);
reset role;

-- Wall 2 (temporary grant, rolled back with the test) ----------------------------
grant usage on schema core to authenticated;
grant select on core.score_runs, core.score_reasons to authenticated;
set local role authenticated;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000004f1","role":"authenticated","plinth_roles":["buyer"]}', true);
select results_eq(
  $$select status from core.score_runs where phase_id = '00000000-0000-4000-8000-0000000004a3' order by status$$,
  $$values ('published'::text)$$,
  'buyer: only the published run'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000004f1","role":"authenticated","plinth_roles":["support"]}', true);
select results_eq(
  $$select status from core.score_runs where phase_id = '00000000-0000-4000-8000-0000000004a3' order by status$$,
  $$values ('published'::text)$$,
  'support: 0 draft or pending runs'
);
select results_eq(
  $$select code from core.score_reasons r join core.score_runs s on s.id = r.run_id where s.phase_id = '00000000-0000-4000-8000-0000000004a3'$$,
  $$values ('T04_PUBLISHED'::text)$$,
  'support: reasons of the published run only'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000004f1","role":"authenticated","plinth_roles":["agent"]}', true);
select is(
  (select count(*)::int from core.score_runs where phase_id = '00000000-0000-4000-8000-0000000004a3' and status in ('draft', 'pending_notice')),
  0,
  'agent: 0 draft or pending runs'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000004f1","role":"authenticated","plinth_roles":["developer_member"],"org_roles":{"00000000-0000-4000-8000-0000000004c1":"admin"}}', true);
select is(
  (select count(*)::int from core.score_runs where phase_id = '00000000-0000-4000-8000-0000000004a3' and status in ('draft', 'pending_notice')),
  0,
  'developer member (org admin): 0 draft or pending runs'
);
select is(
  (select count(*)::int from core.score_reasons where run_id in ('00000000-0000-4000-8000-0000000004b2', '00000000-0000-4000-8000-0000000004b3')),
  0,
  'developer member: 0 draft or pending reasons'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000004f1","role":"authenticated"}', true);
select is(
  (select count(*)::int from core.score_runs where phase_id = '00000000-0000-4000-8000-0000000004a3'),
  1,
  'no plinth_roles claim: the published run only'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000004f1","role":"authenticated","plinth_roles":["admin"],"aal":"aal1"}', true);
select is(
  (select count(*)::int from core.score_runs where phase_id = '00000000-0000-4000-8000-0000000004a3'),
  1,
  'admin without aal2: the published run only'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000004f1","role":"authenticated","plinth_roles":["admin"],"aal":"aal2"}', true);
select is(
  (select count(*)::int from core.score_runs where phase_id = '00000000-0000-4000-8000-0000000004a3'),
  3,
  'admin with aal2: all three runs'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000004f1","role":"authenticated","plinth_roles":["methodology"]}', true);
select results_eq(
  $$select status from core.score_runs where phase_id = '00000000-0000-4000-8000-0000000004a3' order by status$$,
  $$values ('draft'::text), ('pending_notice'::text), ('published'::text)$$,
  'methodology: draft, pending_notice and published'
);
select is(
  (select count(*)::int from core.score_reasons where run_id in ('00000000-0000-4000-8000-0000000004b1', '00000000-0000-4000-8000-0000000004b2', '00000000-0000-4000-8000-0000000004b3')),
  3,
  'methodology: every reason'
);
reset role;

set local role anon;
select throws_ok(
  'select * from core.score_runs', '42501', null,
  'anon: no access even while authenticated holds the temporary grant'
);
reset role;

select * from finish();
rollback;
