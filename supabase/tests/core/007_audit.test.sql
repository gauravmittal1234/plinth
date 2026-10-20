-- T04 · Audit (DATA_MODEL §10 ops.audit_log; BUILD_PLAN §11, §12.2).
-- ops.audit() and the audit trigger record actor, roles, request id and reason
-- in the same transaction; flags, score-run transitions and claim changes are audited.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-4000-8000-0000000008a1","role":"authenticated","plinth_roles":["admin","methodology"],"aal":"aal2"}', true);
select set_config('plinth.request_id', 'req-t04-audit', true);
select set_config('plinth.audit_reason', 'T04 audit test', true);

select ops.audit('publish', 'core.score_runs', 't04-run', '{"status":"draft"}'::jsonb, '{"status":"published"}'::jsonb, 'explicit reason');
select results_eq(
  $$select actor_user_id, actor_role, request_id, action, reason from ops.audit_log where entity_id = 't04-run'$$,
  $$values ('00000000-0000-4000-8000-0000000008a1'::uuid, 'admin,methodology'::text, 'req-t04-audit'::text, 'publish'::text, 'explicit reason'::text)$$,
  'ops.audit() records actor, plinth roles, request id, action and reason'
);

insert into ops.feature_flags (key, enabled, audience) values ('t04_audit_probe', false, 'anon');
update ops.feature_flags set enabled = true where key = 't04_audit_probe';
select results_eq(
  $$select action, before ->> 'enabled', after ->> 'enabled', reason from ops.audit_log
    where entity = 'ops.feature_flags' and entity_id = 't04_audit_probe' order by id$$,
  $$values ('insert'::text, null::text, 'false'::text, 'T04 audit test'::text), ('update', 'false', 'true', 'T04 audit test')$$,
  'flag changes are audited with before/after images and the session reason'
);
select ok(
  (select updated_at = now() from ops.feature_flags where key = 't04_audit_probe'),
  'updating a flag touches updated_at'
);

insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-0000000008b1', 't04-au-group', 'T04 Audit Group');
update core.developer_groups set facts_only_since = '2026-10-18', facts_only_line = 'probe' where id = '00000000-0000-4000-8000-0000000008b1';
select is(
  (select after ->> 'facts_only_since' from ops.audit_log where entity = 'core.developer_groups' and entity_id = '00000000-0000-4000-8000-0000000008b1'),
  '2026-10-18',
  'switching a group to facts-only is audited'
);

insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-0000000008b2', 't04-au-project', 'T04 Audit Project', '00000000-0000-4000-8000-0000000008b1');
insert into core.phases (id, project_id, slug, name) values ('00000000-0000-4000-8000-0000000008b3', '00000000-0000-4000-8000-0000000008b2', 't04-au-phase', 'T04 Audit Phase');
insert into core.score_models (version, status) values ('t04-au', 'draft');
insert into core.score_runs (id, phase_id, model_version, data_cutoff, status, state, band, set_by)
values ('00000000-0000-4000-8000-0000000008c1', '00000000-0000-4000-8000-0000000008b3', 't04-au', '2026-10-14', 'draft', 'scored', 'elevated', 'model');
select is(
  (select count(*)::int from ops.audit_log where entity = 'core.score_runs' and entity_id = '00000000-0000-4000-8000-0000000008c1'),
  0,
  'inserting a draft run is not audited (pipeline volume)'
);
update core.score_runs set status = 'published', published_at = '2026-10-14 18:00+05:30' where id = '00000000-0000-4000-8000-0000000008c1';
select results_eq(
  $$select before ->> 'status', after ->> 'status' from ops.audit_log where entity = 'core.score_runs' and entity_id = '00000000-0000-4000-8000-0000000008c1'$$,
  $$values ('draft'::text, 'published'::text)$$,
  'publishing a run is audited'
);

select set_config('request.jwt.claims', '', true);
insert into core.red_flag_rules (code, text) values ('T04_RF_PROBE', 'probe rule');
insert into core.red_flags (rule_code, subject_type, subject_id, triggered_on)
values ('T04_RF_PROBE', 'group', '00000000-0000-4000-8000-0000000008b1', '2026-10-18');
select is(
  (select actor_role from ops.audit_log where entity = 'core.red_flags' order by id desc limit 1),
  session_user::text,
  'without JWT claims the actor is the database role'
);

select ok(
  not has_table_privilege('authenticated', 'ops.audit_log', 'SELECT')
    and not has_table_privilege('pipeline_writer', 'ops.audit_log', 'SELECT,INSERT'),
  'nobody but the owner reads or writes ops.audit_log directly'
);

select * from finish();
rollback;
