-- T04 · DB core 6/7: core.events and core.share_cards (DATA_MODEL §2).
-- Tables only. T43a owns the functions and triggers that derive events from
-- published runs, filings, extensions, orders, price lists and replies, and the
-- share-card issue/lookup functions.
-- RLS: api-only. pipeline_writer may read (public facts); it never writes here.

create table core.events (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  kind text not null check (kind in (
    'band_changed', 'qpr_filed', 'qpr_missing', 'qpr_late', 'extension_granted', 'order_decided',
    'price_list_published', 'oc_granted', 'cirp_admitted', 'rescore_started', 'developer_replied',
    'construction_update'
  )),
  occurred_on date not null,
  detected_at timestamptz not null default now(),
  public boolean not null default true,
  summary_text text,
  before jsonb,
  after jsonb,
  fact_ids uuid[] not null default '{}'::uuid[],
  run_id uuid references core.score_runs (id),
  created_at timestamptz not null default now()
);
create index events_phase_detected_idx on core.events (phase_id, detected_at);
create index events_kind_idx on core.events (kind);
comment on table core.events is 'What changed on a phase. Drives alerts, Since you last looked, the digest and the replay.';

create table core.share_cards (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  kind text not null check (kind in ('risk', 'cost', 'visit', 'digest')),
  run_id uuid references core.score_runs (id),
  issued_at timestamptz not null default now(),
  data_as_of date,
  model_version text references core.score_models (version),
  band core.band,
  phash bit(64),
  short_code text not null unique,
  created_at timestamptz not null default now()
);
create index share_cards_phase_idx on core.share_cards (phase_id);
comment on table core.share_cards is 'Issued cards, so an old forwarded card can answer "Changed since this card was sent". phash = 64-bit perceptual hash.';

alter table core.events enable row level security;
alter table core.share_cards enable row level security;

grant select on core.events, core.share_cards to pipeline_writer;
create policy pipeline_writer_read on core.events for select to pipeline_writer using (true);
create policy pipeline_writer_read on core.share_cards for select to pipeline_writer using (true);
