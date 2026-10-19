-- T04 · Immutability (DATA_MODEL §12 inv. 3; BUILD_PLAN §12.6).
-- Snapshots, facts and the audit log reject UPDATE and DELETE (facts allow only
-- the one-time supersede link). Score runs allow only the status transitions
-- draft → pending_notice → published → superseded (or withdrawn). Errors are PT409.
begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- Fixture ----------------------------------------------------------------------
insert into core.sources (id, code, name) values ('00000000-0000-4000-8000-000000000601', 't04_im_source', 'T04 immutability source');
insert into core.snapshots (id, source_id, url, fetched_at, sha256, fixture)
values ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000601', 'fixture://t04-im', '2026-07-16 10:00+05:30', repeat('b', 64), true);
insert into core.facts (id, subject_type, subject_id, attribute, value, snapshot_id, lane)
values ('00000000-0000-4000-8000-000000000603', 'phase', gen_random_uuid(), 'qpr.built_pct', '38', '00000000-0000-4000-8000-000000000602', 'records_show'),
       ('00000000-0000-4000-8000-000000000604', 'phase', gen_random_uuid(), 'qpr.built_pct', '41', '00000000-0000-4000-8000-000000000602', 'records_show'),
       ('00000000-0000-4000-8000-000000000605', 'phase', gen_random_uuid(), 'qpr.built_pct', '42', '00000000-0000-4000-8000-000000000602', 'records_show');
select ops.audit('test', 't04.immutability', 't04', null, '{"x":1}'::jsonb, 'T04 test row');

insert into core.developer_groups (id, slug, name) values ('00000000-0000-4000-8000-000000000611', 't04-im-group', 'T04 Imm Group');
insert into core.projects (id, slug, name, group_id) values ('00000000-0000-4000-8000-000000000612', 't04-im-project', 'T04 Imm Project', '00000000-0000-4000-8000-000000000611');
insert into core.phases (id, project_id, slug, name) values ('00000000-0000-4000-8000-000000000613', '00000000-0000-4000-8000-000000000612', 't04-im-phase', 'T04 Imm Phase');
insert into core.score_models (version, status) values ('t04-im', 'draft');
insert into core.score_runs (id, phase_id, model_version, data_cutoff, status, state, band, set_by) values
  ('00000000-0000-4000-8000-000000000621', '00000000-0000-4000-8000-000000000613', 't04-im', '2026-10-14', 'draft', 'scored', 'elevated', 'model'),
  ('00000000-0000-4000-8000-000000000622', '00000000-0000-4000-8000-000000000613', 't04-im', '2026-10-25', 'draft', 'scored', 'high', 'model');
insert into core.score_reasons (run_id, rank, factor, code, text, fact_ids) values
  ('00000000-0000-4000-8000-000000000621', 1, 'finances', 'FIN_SOLD_AHEAD_BUILT', '72% of units sold, 41% built.', array['00000000-0000-4000-8000-000000000604'::uuid]),
  ('00000000-0000-4000-8000-000000000622', 1, 'timeline', 'TL_QPR_MISSING', 'draft text', array['00000000-0000-4000-8000-000000000604'::uuid]);

-- Snapshots ------------------------------------------------------------------------
select throws_ok($$update core.snapshots set url = 'fixture://changed' where id = '00000000-0000-4000-8000-000000000602'$$,
  'PT409', null, 'snapshots: UPDATE is refused');
select throws_ok($$delete from core.snapshots where id = '00000000-0000-4000-8000-000000000602'$$,
  'PT409', null, 'snapshots: DELETE is refused');

-- Facts ----------------------------------------------------------------------------
select throws_ok($$update core.facts set value = '99' where id = '00000000-0000-4000-8000-000000000603'$$,
  'PT409', null, 'facts: changing a value is refused');
select throws_ok($$delete from core.facts where id = '00000000-0000-4000-8000-000000000603'$$,
  'PT409', null, 'facts: DELETE is refused');
select lives_ok($$update core.facts set superseded_by = '00000000-0000-4000-8000-000000000604', valid_to = '2026-10-14' where id = '00000000-0000-4000-8000-000000000603'$$,
  'facts: the one-time supersede link is allowed');
select throws_ok($$update core.facts set superseded_by = '00000000-0000-4000-8000-000000000605' where id = '00000000-0000-4000-8000-000000000603'$$,
  'PT409', null, 'facts: a supersede link cannot be re-pointed');
select throws_ok($$update core.facts set superseded_by = '00000000-0000-4000-8000-000000000604', read_note = 'sneaky' where id = '00000000-0000-4000-8000-000000000605'$$,
  'PT409', null, 'facts: nothing else may change alongside the supersede link');

-- Audit log ---------------------------------------------------------------------------
select throws_ok($$update ops.audit_log set reason = 'changed' where entity = 't04.immutability'$$,
  'PT409', null, 'audit_log: UPDATE is refused');
select throws_ok($$delete from ops.audit_log where entity = 't04.immutability'$$,
  'PT409', null, 'audit_log: DELETE is refused');
select throws_ok($$truncate ops.audit_log$$,
  'PT409', null, 'audit_log: TRUNCATE is refused');

-- Score runs ---------------------------------------------------------------------------
select lives_ok($$update core.score_runs set status = 'pending_notice' where id = '00000000-0000-4000-8000-000000000621'$$,
  'score_runs: draft → pending_notice');
select lives_ok($$update core.score_runs set status = 'published', published_at = '2026-10-25 09:00+05:30' where id = '00000000-0000-4000-8000-000000000621'$$,
  'score_runs: pending_notice → published (with published_at)');
select throws_ok($$update core.score_runs set status = 'draft' where id = '00000000-0000-4000-8000-000000000621'$$,
  'PT409', null, 'score_runs: published → draft is refused');
select throws_ok($$update core.score_runs set band = 'low' where id = '00000000-0000-4000-8000-000000000621'$$,
  'PT409', null, 'score_runs: a published band cannot be edited');
select throws_ok($$update core.score_runs set status = 'superseded', p_late12 = 0.5 where id = '00000000-0000-4000-8000-000000000621'$$,
  'PT409', null, 'score_runs: a transition cannot smuggle in a number change');
select throws_ok($$delete from core.score_runs where id = '00000000-0000-4000-8000-000000000622'$$,
  'PT409', null, 'score_runs: DELETE is refused, even for drafts');
select throws_ok($$update core.score_runs set status = 'published', published_at = now() where id = '00000000-0000-4000-8000-000000000622'$$,
  '23505', null, 'score_runs: at most one published run per phase');
select lives_ok($$update core.score_runs set status = 'superseded' where id = '00000000-0000-4000-8000-000000000621'$$,
  'score_runs: published → superseded');
select throws_ok($$update core.score_runs set status = 'published' where id = '00000000-0000-4000-8000-000000000621'$$,
  'PT409', null, 'score_runs: superseded is final');

-- Score reasons -------------------------------------------------------------------------
select throws_ok($$update core.score_reasons set text = 'reworded' where run_id = '00000000-0000-4000-8000-000000000621'$$,
  'PT409', null, 'score_reasons: frozen once the run left draft');
select lives_ok($$update core.score_reasons set text = 'reworded draft' where run_id = '00000000-0000-4000-8000-000000000622'$$,
  'score_reasons: editable while the run is a draft');
select throws_ok($$insert into core.score_reasons (run_id, rank, factor, code, text, fact_ids) values ('00000000-0000-4000-8000-000000000622', 2, 'legal', 'X', 'no evidence', '{}')$$,
  '23514', null, 'score_reasons: every reason cites at least one fact');

select * from finish();
rollback;
