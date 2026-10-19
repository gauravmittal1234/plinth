-- T04 · DB core 4/7: the catalogue — developers, projects, phases, RERA (DATA_MODEL §1).
-- Not here: core.cost_rule_sets (created by T13 with core.all_in()).
-- Conventions (DATA_MODEL §0): uuid ids; money bigint *_inr; percentages numeric(5,2)
-- *_pct; areas numeric(8,1) *_sqft; a date that may be month-precise is the 1st of the
-- month plus a <col>_precision column of domain core.date_precision ('day' | 'month').
-- Geography uses PostGIS in `extensions` (SRID 4326).
-- RLS: api-only. pipeline_writer reads, inserts and updates the public record;
-- it never deletes, and it cannot change claim or facts-only state.

create table core.localities (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('city', 'zone', 'corridor', 'sector')),
  name text not null,
  slug text not null unique,
  parent_id uuid references core.localities (id),
  geom extensions.geography(MultiPolygon, 4326),
  created_at timestamptz not null default now()
);
create index localities_geom_idx on core.localities using gist (geom);
create index localities_parent_idx on core.localities (parent_id);
comment on table core.localities is 'Gurugram → corridors (Dwarka Expressway, New Gurugram, Golf Course Ext Rd, Sohna Road) → sectors.';
comment on column core.localities.name is 'pii:C0';

create table core.developer_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  claim_state text not null default 'unclaimed' check (claim_state in ('unclaimed', 'invited', 'claimed')),
  invited_on date,
  claimed_on date,
  facts_only_since date,
  facts_only_line text,
  created_at timestamptz not null default now()
);
create index developer_groups_name_trgm_idx on core.developer_groups using gin (name extensions.gin_trgm_ops);
comment on table core.developer_groups is 'The brand a buyer knows (Northfield Estates). Facts-only is data on the group (facts_only_since), not a flag.';
comment on column core.developer_groups.name is 'pii:C0';

create table core.developers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references core.developer_groups (id),
  legal_name text not null,
  cin text,
  llpin text,
  kind text,
  status text not null default 'active' check (status in ('active', 'struck_off', 'cirp', 'liquidation')),
  name_norm text,
  created_at timestamptz not null default now()
);
create unique index developers_cin_key on core.developers (cin) where cin is not null;
create index developers_group_idx on core.developers (group_id);
create index developers_name_norm_trgm_idx on core.developers using gin (name_norm extensions.gin_trgm_ops);
comment on table core.developers is 'Promoter companies and SPVs (Northfield Estates Pvt Ltd, Heronstone Projects …).';
comment on column core.developers.kind is 'Legal form, e.g. company, llp, spv.';
comment on column core.developers.legal_name is 'pii:C0';
comment on column core.developers.name_norm is 'pii:C0';

create table core.developer_aliases (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references core.developers (id),
  alias text not null,
  snapshot_id uuid references core.snapshots (id),
  confidence numeric(4, 3) check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);
create index developer_aliases_developer_idx on core.developer_aliases (developer_id);
create index developer_aliases_alias_trgm_idx on core.developer_aliases using gin (alias extensions.gin_trgm_ops);
comment on table core.developer_aliases is 'Name variants seen in records ("VATIKA LTD").';

create table core.group_links (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references core.developer_groups (id),
  developer_id uuid not null references core.developers (id),
  link_type text not null check (link_type in ('spv', 'common_director', 'shareholding', 'collaboration')),
  status text not null default 'proposed' check (status in ('proposed', 'accepted', 'disputed')),
  fact_id uuid references core.facts (id),
  confidence numeric(4, 3) check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (group_id, developer_id, link_type)
);
comment on table core.group_links is 'Group membership evidence. A merge that would move a published score needs a person (ops.review_tasks); pipelines only propose.';

create table core.directors (
  din text primary key,
  name text not null,
  created_at timestamptz not null default now()
);
comment on table core.directors is 'Directors by DIN. Never phones or addresses, though HARERA shows them.';
comment on column core.directors.name is 'pii:C0 (public record)';

create table core.director_links (
  din text not null references core.directors (din),
  developer_id uuid not null references core.developers (id),
  from_date date,
  to_date date,
  primary key (din, developer_id),
  check (to_date is null or from_date is null or to_date >= from_date)
);
comment on table core.director_links is 'Directorships. DATA_MODEL calls the dates `from`/`to`; they are from_date/to_date here to avoid reserved words.';

create table core.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  group_id uuid references core.developer_groups (id),
  locality_id uuid references core.localities (id),
  footprint extensions.geography(Polygon, 4326),
  centroid extensions.geography(Point, 4326),
  created_at timestamptz not null default now()
);
create index projects_group_idx on core.projects (group_id);
create index projects_locality_idx on core.projects (locality_id);
create index projects_footprint_idx on core.projects using gist (footprint);
create index projects_centroid_idx on core.projects using gist (centroid);
create index projects_name_trgm_idx on core.projects using gin (name extensions.gin_trgm_ops);
comment on table core.projects is 'Umbrella project (Aurelia Heights). Scoring is per phase.';
comment on column core.projects.name is 'pii:C0';

create table core.phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references core.projects (id),
  slug text not null unique,
  name text not null,
  promoter_id uuid references core.developers (id),
  units_total integer check (units_total >= 0),
  status text not null default 'registered' check (status in ('registered', 'under_construction', 'completed', 'stalled', 'lapsed', 'revoked')),
  short_code text unique,
  created_at timestamptz not null default now()
);
create index phases_project_idx on core.phases (project_id);
create index phases_promoter_idx on core.phases (promoter_id);
create index phases_name_trgm_idx on core.phases using gin (name extensions.gin_trgm_ops);
comment on table core.phases is 'The unit of a page, a score and a follow (slug aurelia-heights-phase-2, short_code AH2).';
comment on column core.phases.name is 'pii:C0';

create table core.rera_registrations (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  authority text not null,
  rera_number text not null,
  registered_on date,
  registered_on_precision core.date_precision not null default 'day',
  original_completion date,
  original_completion_precision core.date_precision not null default 'month',
  current_completion date,
  current_completion_precision core.date_precision not null default 'month',
  status text not null default 'valid' check (status in ('valid', 'lapsed', 'revoked', 'deregistered', 'abeyance')),
  collection_account_name text,
  collection_bank text,
  collection_branch text,
  collection_account_number text,
  collection_ifsc text check (collection_ifsc is null or collection_ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  official_url text,
  snapshot_id uuid references core.snapshots (id),
  created_at timestamptz not null default now(),
  unique (authority, rera_number)
);
create index rera_registrations_phase_idx on core.rera_registrations (phase_id);
comment on table core.rera_registrations is 'RERA registrations (authority harera_ggm …). The collection account is public record and feeds the payee check.';
comment on column core.rera_registrations.registered_on_precision is 'pii:C0 · day (HARERA certificate date) or month (registered Dec 2022 → 2022-12-01).';
comment on column core.rera_registrations.collection_account_name is 'pii:C0 (public record)';
comment on column core.rera_registrations.collection_account_number is 'pii:C0 (public record on HARERA)';

create table core.towers (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  code text not null,
  floors_planned integer check (floors_planned >= 0),
  units integer check (units >= 0),
  created_at timestamptz not null default now(),
  unique (phase_id, code)
);
comment on table core.towers is 'Towers of a phase (Aurelia A–C, 20 floors each).';

create table core.unit_types (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  label text not null,
  carpet_sqft numeric(8, 1) check (carpet_sqft > 0),
  super_sqft numeric(8, 1) check (super_sqft > 0),
  units integer check (units >= 0),
  lane core.lane not null default 'records_show',
  created_at timestamptz not null default now(),
  unique (phase_id, label)
);
comment on table core.unit_types is 'Configurations (3 BHK). Carpet from records; super from the developer''s cost sheet.';

create table core.qpr_filings (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references core.rera_registrations (id),
  quarter text not null check (quarter ~ '^\d{4}-Q[1-4]$'),
  due_on date not null,
  filed_on date,
  appeared_on date,
  fetched_at timestamptz,
  status text not null check (status in ('on_time', 'late', 'missing', 'not_yet_due')),
  days_late integer generated always as (
    case when filed_on is null then null else greatest(filed_on - due_on, 0) end
  ) stored,
  sold_pct numeric(5, 2),
  built_pct numeric(5, 2),
  time_used_pct numeric(5, 2),
  collections_inr bigint,
  escrow_withdrawn_inr bigint,
  validation_flags text[] not null default '{}'::text[],
  snapshot_id uuid references core.snapshots (id),
  created_at timestamptz not null default now(),
  unique (registration_id, quarter)
);
create index qpr_filings_missing_idx on core.qpr_filings (status) where status = 'missing';
comment on table core.qpr_filings is 'Quarterly progress reports. Progress values only where records have them (no invented figures). Collections may be negative in dirty records; validation_flags say so.';
comment on column core.qpr_filings.quarter is 'Calendar quarter key, e.g. 2026-Q2 (Apr–Jun 2026).';
comment on column core.qpr_filings.days_late is 'filed_on − due_on, floored at 0; null while not filed.';

create table core.qpr_tower_progress (
  filing_id uuid not null references core.qpr_filings (id),
  tower_id uuid not null references core.towers (id),
  slab_reached integer check (slab_reached >= 0),
  built_pct numeric(5, 2),
  primary key (filing_id, tower_id)
);
comment on table core.qpr_tower_progress is 'Per-tower slab progress from a QPR (Apr–Jun 2026: A 9 / B 7 / C 5).';

create table core.extensions (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references core.rera_registrations (id),
  kind text not null check (kind in ('section6', 'force_majeure')),
  granted_on date,
  granted_on_precision core.date_precision not null default 'day',
  from_completion date,
  from_completion_precision core.date_precision not null default 'month',
  to_completion date,
  to_completion_precision core.date_precision not null default 'month',
  order_ref text,
  snapshot_id uuid references core.snapshots (id),
  created_at timestamptz not null default now()
);
create index extensions_registration_idx on core.extensions (registration_id);
comment on table core.extensions is 'Completion-date extensions on a registration (Coral: Jan 2026 → Feb 2029; 14 Oct 2026 → Aug 2029).';
comment on column core.extensions.granted_on_precision is 'pii:C0 · day (order date) or month (granted Jan 2026 → 2026-01-01).';

create table core.blanket_extensions (
  id uuid primary key default gen_random_uuid(),
  authority text not null,
  advisory_on date not null,
  applies_from_completion date not null,
  applies_to_completion date,
  months integer not null check (months > 0),
  source_url text,
  created_at timestamptz not null default now()
);
comment on table core.blanket_extensions is 'Blanket extensions (MoHUA advisory of 31 Jul 2026: +4 months for completions on or after 28 Feb 2026).';

create table core.orders (
  id uuid primary key default gen_random_uuid(),
  authority text not null,
  case_no text not null,
  decided_on date,
  respondent_developer_id uuid references core.developers (id),
  phase_id uuid references core.phases (id),
  order_type text not null check (order_type in ('complaint', 'execution', 'refund', 'compensation', 'extension', 'sale_ban')),
  outcome text check (outcome in ('against_promoter', 'for_promoter', 'withdrawn', 'other')),
  snapshot_id uuid references core.snapshots (id),
  extract_method text,
  created_at timestamptz not null default now(),
  unique (authority, case_no)
);
create index orders_phase_decided_idx on core.orders (phase_id, decided_on);
create index orders_respondent_idx on core.orders (respondent_developer_id);
comment on table core.orders is 'Authority orders. Complaint rates are always shown as count and rate together.';

create table core.recovery_certificates (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references core.developers (id),
  amount_inr bigint check (amount_inr >= 0),
  issued_on date,
  executed boolean,
  snapshot_id uuid references core.snapshots (id),
  created_at timestamptz not null default now()
);
create index recovery_certificates_developer_idx on core.recovery_certificates (developer_id);
comment on table core.recovery_certificates is 'Recovery certificates (developer-level red-flag input). R1·M6.';

create table core.insolvency_events (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references core.developers (id),
  kind text not null check (kind in ('petition', 'admitted', 'withdrawn', 'resolved')),
  event_on date not null,
  forum text,
  case_ref text,
  snapshot_id uuid references core.snapshots (id),
  created_at timestamptz not null default now()
);
create index insolvency_events_developer_idx on core.insolvency_events (developer_id);
comment on table core.insolvency_events is 'IBC events (Elmstone group company admitted, NCLT, 12 Mar 2023).';

create table core.licences (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid references core.phases (id),
  authority text not null,
  licence_no text not null,
  valid_to date,
  status text,
  created_at timestamptz not null default now(),
  unique (authority, licence_no)
);
create index licences_phase_idx on core.licences (phase_id);
comment on table core.licences is 'Land licences (authority dtcp).';

create table core.completion_events (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  tower_id uuid references core.towers (id),
  kind text not null check (kind in ('oc', 'part_oc', 'cc')),
  granted_on date,
  granted_on_precision core.date_precision not null default 'day',
  audit_flag boolean not null default false,
  snapshot_id uuid references core.snapshots (id),
  created_at timestamptz not null default now()
);
create index completion_events_phase_idx on core.completion_events (phase_id);
comment on table core.completion_events is 'Occupation and completion certificates: the outcome labels (Northfield: 6 finished, 2 late).';
comment on column core.completion_events.granted_on_precision is 'pii:C0 · day (certificate date) or month (OC Apr 2019 → 2019-04-01).';

create table core.reported_incidents (
  id uuid primary key default gen_random_uuid(),
  locality_id uuid references core.localities (id),
  kind text not null,
  reported_on date not null,
  place_text text,
  source_kind text not null check (source_kind in ('news', 'resident')),
  url text,
  lane core.lane not null default 'reported_unverified' check (lane = 'reported_unverified'),
  created_at timestamptz not null default now()
);
create index reported_incidents_locality_idx on core.reported_incidents (locality_id);
comment on table core.reported_incidents is 'Reported, unverified local incidents (waterlogging, Sector 37D). Never a band input.';

create table core.pre_rera_records (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references core.developer_groups (id),
  project_name text not null,
  sector text,
  promised date,
  promised_precision core.date_precision not null default 'month',
  oc_on date,
  months_late integer,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index pre_rera_records_group_idx on core.pre_rera_records (group_id);
comment on table core.pre_rera_records is 'Pre-RERA history (Northfield Greens, Alder Court, Larch Enclave). Never counted in a band.';
comment on column core.pre_rera_records.project_name is 'pii:C0';

create table core.agents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('firm', 'individual')),
  principal_name text,
  rera_agent_no text not null,
  authority text not null,
  valid_to date,
  status text not null default 'active' check (status in ('active', 'ended')),
  office_locality_id uuid references core.localities (id),
  verified_since date,
  badge_since date,
  partner boolean not null default false,
  created_at timestamptz not null default now(),
  unique (authority, rera_agent_no)
);
create index agents_name_trgm_idx on core.agents using gin (name extensions.gin_trgm_ops);
comment on table core.agents is 'RERA agent registry (api.agent_check). R1·M5.';
comment on column core.agents.name is 'pii:C0 (public registry)';
comment on column core.agents.principal_name is 'pii:C0 (public registry)';

-- RLS and grants ------------------------------------------------------------
do $$
declare
  t text;
  rw text[] := array[
    'localities', 'developers', 'developer_aliases', 'directors', 'director_links',
    'projects', 'phases', 'rera_registrations', 'towers', 'unit_types', 'qpr_filings',
    'qpr_tower_progress', 'extensions', 'blanket_extensions', 'orders',
    'recovery_certificates', 'insolvency_events', 'licences', 'completion_events',
    'reported_incidents', 'pre_rera_records', 'agents'
  ];
begin
  foreach t in array rw || array['developer_groups', 'group_links'] loop
    execute format('alter table core.%I enable row level security', t);
    execute format('create policy pipeline_writer_read on core.%I for select to pipeline_writer using (true)', t);
  end loop;
  foreach t in array rw loop
    execute format('grant select, insert, update on core.%I to pipeline_writer', t);
    execute format('create policy pipeline_writer_insert on core.%I for insert to pipeline_writer with check (true)', t);
    execute format('create policy pipeline_writer_update on core.%I for update to pipeline_writer using (true) with check (true)', t);
  end loop;
end
$$;

-- Groups: the pipeline may create one and fix its name; claim and facts-only
-- state belong to admin RPCs.
grant select, insert, update (name) on core.developer_groups to pipeline_writer;
create policy pipeline_writer_insert on core.developer_groups for insert to pipeline_writer
  with check (claim_state = 'unclaimed' and facts_only_since is null);
create policy pipeline_writer_update on core.developer_groups for update to pipeline_writer using (true) with check (true);

-- Group links: the pipeline only proposes; a person accepts (ops.review_tasks).
grant select, insert on core.group_links to pipeline_writer;
create policy pipeline_writer_propose on core.group_links for insert to pipeline_writer
  with check (status = 'proposed');

-- Claim and facts-only changes are audited.
create trigger developer_groups_audit
  after update on core.developer_groups
  for each row execute function ops.audit_trigger();
create trigger group_links_audit
  after update on core.group_links
  for each row execute function ops.audit_trigger();
