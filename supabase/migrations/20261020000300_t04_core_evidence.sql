-- T04 · DB core 3/7: evidence base — sources, snapshots, facts (DATA_MODEL §2).
-- core.events and core.share_cards (also §2) reference score runs, so they are
-- created after scoring, in 20261020000600.
-- RLS: api-only (no anon/authenticated grants). pipeline_writer reads and
-- inserts; snapshots are immutable and facts change only by superseding.

create table core.sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  base_url text,
  cadence interval,
  terms_note text,
  created_at timestamptz not null default now()
);
comment on table core.sources is 'Where evidence comes from. Codes: harera_registration, harera_qpr, harera_qpr_register, harera_orders, harera_corrigendum, dtcp_oc, ibbi, news, developer_workspace.';
comment on column core.sources.cadence is 'Expected refresh interval; ops.source_freshness compares age ÷ cadence.';
comment on column core.sources.name is 'pii:C0';

create table core.snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references core.sources (id),
  url text not null,
  method text not null default 'GET',
  params jsonb,
  fetched_at timestamptz not null,
  http_status integer,
  sha256 char(64) not null check (sha256 ~ '^[0-9a-f]{64}$'),
  storage_key text,
  content_type text,
  bytes bigint check (bytes >= 0),
  parser_version text,
  fixture boolean not null default false,
  created_at timestamptz not null default now(),
  unique (sha256, url)
);
create index snapshots_source_fetched_idx on core.snapshots (source_id, fetched_at);
comment on table core.snapshots is 'Raw captures (HTML/PDF/JSON) by content hash. Immutable: triggers block UPDATE, DELETE and TRUNCATE; bucket `snapshots` is write-once.';

create trigger snapshots_append_only
  before update or delete on core.snapshots
  for each row execute function ops.forbid_mutation();
create trigger snapshots_no_truncate
  before truncate on core.snapshots
  for each statement execute function ops.forbid_mutation();

create table core.facts (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('phase', 'developer', 'group', 'tower', 'registration')),
  subject_id uuid not null,
  attribute text not null,
  value jsonb not null,
  as_of date,
  valid_from date,
  valid_to date,
  learned_at timestamptz not null default now(),
  snapshot_id uuid references core.snapshots (id),
  page_ref text,
  extract_text text,
  method text not null default 'parser' check (method in ('parser', 'llm_x2', 'manual', 'developer')),
  method_version text,
  read_note text,
  confidence numeric(4, 3) check (confidence between 0 and 1),
  reviewer_id uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  lane core.lane not null default 'records_show',
  superseded_by uuid references core.facts (id),
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);
create index facts_current_idx on core.facts (subject_type, subject_id, attribute) where superseded_by is null;
create index facts_snapshot_idx on core.facts (snapshot_id);
create index facts_superseded_by_idx on core.facts (superseded_by) where superseded_by is not null;
comment on table core.facts is 'Bitemporal facts with their evidence (api.evidence). Superseded, never updated: the only allowed UPDATE links superseded_by once.';
comment on column core.facts.subject_id is 'Polymorphic: core.phases / developers / developer_groups / towers / rera_registrations id, per subject_type.';
comment on column core.facts.attribute is 'Dotted attribute name, e.g. qpr.built_pct.';
comment on column core.facts.read_note is 'Shown in the evidence drawer, e.g. "Read by two AI extractors; they matched. Checked by a person on 16 Jul 2026."';
comment on column core.facts.reviewer_id is 'pii:C1';
comment on column core.facts.extract_text is 'pii:C0 (public-record text; the PII stripper runs before insert)';

create trigger facts_supersede_only
  before update or delete on core.facts
  for each row execute function ops.facts_guard();
create trigger facts_no_truncate
  before truncate on core.facts
  for each statement execute function ops.forbid_mutation();

-- RLS and grants ------------------------------------------------------------
alter table core.sources enable row level security;
alter table core.snapshots enable row level security;
alter table core.facts enable row level security;

grant select on core.sources to pipeline_writer;
grant select, insert on core.snapshots to pipeline_writer;
grant select, insert, update on core.facts to pipeline_writer;

create policy pipeline_writer_read on core.sources for select to pipeline_writer using (true);
create policy pipeline_writer_read on core.snapshots for select to pipeline_writer using (true);
create policy pipeline_writer_insert on core.snapshots for insert to pipeline_writer with check (true);
create policy pipeline_writer_read on core.facts for select to pipeline_writer using (true);
create policy pipeline_writer_insert on core.facts for insert to pipeline_writer with check (true);
create policy pipeline_writer_supersede on core.facts for update to pipeline_writer using (true) with check (true);
