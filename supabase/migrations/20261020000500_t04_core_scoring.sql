-- T04 · DB core 5/7: scoring and governance (DATA_MODEL §3).
-- The score firewall (BUILD_PLAN §12.4; DATA_MODEL §12 inv. 2): draft and
-- pending_notice runs, and their reasons, are visible only to methodology and
-- admin (aal2). Buyers see published runs through api.* functions only.
-- anon/authenticated have no table grants at all; the `firewall` policies below
-- are the second wall, so a future grant can never leak a draft.
-- pipeline_writer inserts draft runs and their reasons and never publishes:
-- publishing, notices and corrections are admin/methodology RPCs.

create table core.score_models (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  released_on date,
  status text not null default 'draft',
  config jsonb not null default '{}'::jsonb,
  config_sha char(64) check (config_sha is null or config_sha ~ '^[0-9a-f]{64}$'),
  changelog text,
  created_at timestamptz not null default now()
);
comment on table core.score_models is 'Scorecard versions (v1.0 15 Jul 2026 … v1.2 14 Oct 2026): bins, WoE, coefficients, band thresholds, confidence rules, factor weights 30/30/20/15/5.';
comment on column core.score_models.status is 'Lifecycle, e.g. draft, released, retired.';

create table core.red_flag_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  text text not null,
  published_on date,
  created_at timestamptz not null default now()
);
comment on table core.red_flag_rules is 'Published red-flag rules: RF1_GROUP_CIRP, RF2_REGISTRATION_REVOKED, RF3_STOP_SALE, RF4_GROUP_DEFAULT.';

create table core.score_runs (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  model_version text not null references core.score_models (version),
  data_cutoff date not null,
  computed_at timestamptz not null default now(),
  code_commit text,
  status text not null default 'draft' check (status in ('draft', 'pending_notice', 'published', 'superseded', 'withdrawn')),
  state core.score_state not null,
  band core.band,
  set_by text check (set_by in ('model', 'red_flag_rule')),
  rule_code text references core.red_flag_rules (code),
  confidence text check (confidence in ('high', 'low')),
  p_late12 numeric(6, 5) check (p_late12 between 0 and 1),
  freq_low integer check (freq_low between 0 and 100),
  freq_high integer check (freq_high between 0 and 100),
  freq_point integer check (freq_point between 0 and 100),
  internal_points numeric,
  stall boolean not null default false,
  stale boolean not null default false,
  what_would_change text,
  supersedes_run_id uuid references core.score_runs (id),
  published_at timestamptz,
  notice_id uuid,
  created_at timestamptz not null default now(),
  constraint score_runs_band_iff_scored check ((state = 'scored') = (band is not null)),
  constraint score_runs_rule_has_code check (set_by is distinct from 'red_flag_rule' or rule_code is not null),
  constraint score_runs_freq_range check (freq_low is null or freq_high is null or freq_low <= freq_high),
  constraint score_runs_published_has_time check (status <> 'published' or published_at is not null)
);
create index score_runs_phase_status_idx on core.score_runs (phase_id, status);
create unique index score_runs_one_published_key on core.score_runs (phase_id) where status = 'published';
comment on table core.score_runs is 'One scoring of one phase. Firewall: draft/pending_notice rows only for methodology and admin. Only status transitions are allowed after insert; never deleted.';
comment on column core.score_runs.internal_points is 'Never exposed by any api function.';

create trigger score_runs_transitions_only
  before update or delete on core.score_runs
  for each row execute function ops.score_runs_guard();
create trigger score_runs_no_truncate
  before truncate on core.score_runs
  for each statement execute function ops.forbid_mutation();
create trigger score_runs_audit
  after update on core.score_runs
  for each row execute function ops.audit_trigger();

create table core.score_reasons (
  run_id uuid not null references core.score_runs (id),
  rank smallint not null check (rank between 1 and 4),
  factor core.factor not null,
  code text not null,
  text text not null,
  contribution numeric,
  fact_ids uuid[] not null check (cardinality(fact_ids) >= 1),
  primary key (run_id, rank)
);
comment on table core.score_reasons is 'Top reasons of a run (≤ 4), catalogue text, each citing ≥ 1 fact. Firewall inherits the run.';

create trigger score_reasons_frozen
  before update or delete on core.score_reasons
  for each row execute function ops.score_reasons_guard();

create table core.reason_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  factor core.factor not null,
  template_en text not null,
  version text not null,
  created_at timestamptz not null default now(),
  unique (code, version)
);
comment on table core.reason_templates is 'Reason catalogue (FIN_SOLD_AHEAD_BUILT …). An LLM never adds facts.';

create table core.red_flags (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null references core.red_flag_rules (code),
  subject_type text not null check (subject_type in ('phase', 'developer', 'group')),
  subject_id uuid not null,
  triggered_on date not null,
  cleared_on date,
  fact_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now()
);
create index red_flags_active_idx on core.red_flags (subject_type, subject_id) where cleared_on is null;
comment on table core.red_flags is 'Triggered red flags (Laurel via the Elmstone group).';

create trigger red_flags_audit
  after insert or update or delete on core.red_flags
  for each row execute function ops.audit_trigger();

create table core.band_history (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  band core.band,
  state core.score_state not null,
  confidence text check (confidence in ('high', 'low')),
  from_date date not null,
  to_date date,
  run_id uuid references core.score_runs (id),
  model_version text references core.score_models (version),
  created_at timestamptz not null default now(),
  check (to_date is null or to_date >= from_date)
);
create index band_history_phase_from_idx on core.band_history (phase_id, from_date);
comment on table core.band_history is 'Published bands over time (the replay). Aurelia: Moderate 15 Jul → 2 Oct 2026; Elevated from 2 Oct.';

create table core.band_notices (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  kind text not null check (kind in ('notice_7day', 'heads_up_48h', 'red_flag_immediate')),
  from_band core.band,
  to_band core.band,
  proposed_run_id uuid references core.score_runs (id),
  reason_text text,
  trigger_fact_ids uuid[] not null default '{}'::uuid[],
  sent_at timestamptz,
  effective_on date,
  public_marker_text text,
  status text not null default 'pending' check (status in ('pending', 'held', 'effective', 'withdrawn', 'superseded')),
  created_at timestamptz not null default now()
);
create index band_notices_phase_status_idx on core.band_notices (phase_id, status);
comment on table core.band_notices is 'Developer notices before a band change. to_band is readable only by the group''s org admin/compliance, methodology and admin; buyers see public_marker_text only.';

create trigger band_notices_audit
  after insert or update or delete on core.band_notices
  for each row execute function ops.audit_trigger();

alter table core.score_runs
  add constraint score_runs_notice_id_fkey foreign key (notice_id) references core.band_notices (id);

create table core.calibration (
  id uuid primary key default gen_random_uuid(),
  model_version text not null references core.score_models (version),
  band core.band not null,
  range_low integer,
  range_high integer,
  n_projects integer check (n_projects >= 0),
  n_late integer check (n_late >= 0),
  per_100 numeric(5, 1),
  illustrative boolean not null default true,
  brier numeric(6, 4),
  brier_baseline numeric(6, 4),
  created_at timestamptz not null default now(),
  unique (model_version, band)
);
comment on table core.calibration is 'Calibration by band (the illustrative 212-phase table; base rate 36 of 100).';

create table core.methodology_changelog (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  published_on date not null,
  summary text not null,
  minutes_url text,
  created_at timestamptz not null default now()
);
comment on table core.methodology_changelog is 'Public methodology changes (api.methodology).';

create trigger score_models_audit
  after insert or update or delete on core.score_models
  for each row execute function ops.audit_trigger();

-- RLS ------------------------------------------------------------------------
alter table core.score_models enable row level security;
alter table core.red_flag_rules enable row level security;
alter table core.score_runs enable row level security;
alter table core.score_reasons enable row level security;
alter table core.reason_templates enable row level security;
alter table core.red_flags enable row level security;
alter table core.band_history enable row level security;
alter table core.band_notices enable row level security;
alter table core.calibration enable row level security;
alter table core.methodology_changelog enable row level security;

-- The firewall (dormant while authenticated has no grant; tested with a
-- temporary grant in supabase/tests/rls). Claims are read inline because
-- authenticated has no USAGE on `ops`.
create policy firewall on core.score_runs for select to authenticated
using (
  status in ('published', 'superseded')
  or coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'plinth_roles') ? 'methodology', false)
  or (
    coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'plinth_roles') ? 'admin', false)
    and nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal' = 'aal2'
  )
);
-- A reason is visible exactly when its run is (the subquery runs under the run's policy).
create policy firewall on core.score_reasons for select to authenticated
using (exists (select 1 from core.score_runs r where r.id = score_reasons.run_id));

-- pipeline_writer: read the record, write drafts.
do $$
declare
  t text;
begin
  foreach t in array array[
    'score_models', 'red_flag_rules', 'score_runs', 'score_reasons', 'reason_templates',
    'red_flags', 'band_history', 'calibration', 'methodology_changelog'
  ] loop
    execute format('grant select on core.%I to pipeline_writer', t);
    execute format('create policy pipeline_writer_read on core.%I for select to pipeline_writer using (true)', t);
  end loop;
end
$$;

grant insert on core.score_runs to pipeline_writer;
create policy pipeline_writer_draft on core.score_runs for insert to pipeline_writer
  with check (status = 'draft' and published_at is null and notice_id is null);

grant insert on core.score_reasons to pipeline_writer;
create policy pipeline_writer_draft on core.score_reasons for insert to pipeline_writer
  with check (exists (select 1 from core.score_runs r where r.id = score_reasons.run_id and r.status = 'draft'));

grant insert, update (cleared_on) on core.red_flags to pipeline_writer;
create policy pipeline_writer_insert on core.red_flags for insert to pipeline_writer with check (true);
create policy pipeline_writer_clear on core.red_flags for update to pipeline_writer using (true) with check (true);
-- core.band_notices: no pipeline_writer access (to_band is notice-only information).
