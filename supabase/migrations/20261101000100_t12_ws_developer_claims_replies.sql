-- T12 · API reads A 1/3: ws.developer_claims and ws.developer_replies (DATA_MODEL §4).
-- Sources: WORK_BREAKDOWN T12 ("created here"); DATA_MODEL §4 and §12 inv. 2, 6;
-- INTEGRATION_NOTES (a developer reply carries a signatory name and a project or
-- group scope); fixtures CONFLICTS C-19.
--
-- Both tables hold what a developer says. They are shown in the "Developer says"
-- tone, never as a record, and they never feed a band: pipeline_writer has no
-- privilege on `ws` (T04), so scoring cannot read them.
-- RLS: api-only for now (no anon/authenticated grants, no policies). The developer
-- workspace (M4) adds org(...) policies and the ws_* RPCs that write them.

-- ---------------------------------------------------------------------------
-- ws.developer_claims: a developer's claim about a public fact, e.g. "Filed on
-- 12 Oct 2026." against the missing Jul–Sep 2026 QPR. api.risk_summary shows a
-- public claim next to the pending fact it is linked to (PendingFact.developer_says),
-- and api.evidence next to the fact itself.
-- ---------------------------------------------------------------------------
create table ws.developer_claims (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  text text not null check (pg_catalog.length(pg_catalog.btrim(text)) > 0),
  said_on date not null,
  check_by date,
  verified_state text not null default 'unverified'
    check (verified_state in ('unverified', 'verified', 'contradicted')),
  linked_fact_id uuid references core.facts (id),
  public boolean not null default false,
  created_at timestamptz not null default now(),
  constraint developer_claims_check_after_said check (check_by is null or check_by >= said_on)
);
create index developer_claims_unverified_idx on ws.developer_claims (phase_id) where verified_state = 'unverified';
create index developer_claims_linked_fact_idx on ws.developer_claims (linked_fact_id) where linked_fact_id is not null;
comment on table ws.developer_claims is 'What a developer says about a public fact ("filed on 12 Oct 2026"). Shown as the Developer says tone field, never as a record; never a band input. Public rows only reach buyers, through api.risk_summary and api.evidence.';
comment on column ws.developer_claims.text is 'pii:C0 · The claim as the developer made it, e.g. "Filed on 12 Oct 2026." Public once public = true.';
comment on column ws.developer_claims.said_on is 'pii:C0 · The day the developer made the claim.';
comment on column ws.developer_claims.check_by is 'pii:C0 · The day Plinth checks the claim against the records by.';
comment on column ws.developer_claims.verified_state is 'pii:C0 · unverified, verified (the records now show it) or contradicted (the records show otherwise).';
comment on column ws.developer_claims.linked_fact_id is 'pii:C0 · The public fact the claim is about (e.g. the qpr.missing fact). The buyer sees the claim next to it.';
comment on column ws.developer_claims.public is 'pii:C0 · Only public claims reach a buyer surface.';

-- ---------------------------------------------------------------------------
-- ws.developer_replies: the developer's signed right of reply. A project reply is
-- RiskSummary.developer_response; a group reply speaks for the whole group and is
-- shown on the developer page (T13), never on a project's risk card. A group reply
-- is still filed against one phase (C-19: Heron Point Ph 1 for the fire NOC).
-- ---------------------------------------------------------------------------
create table ws.developer_replies (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  run_id uuid references core.score_runs (id),
  scope text not null default 'project' check (scope in ('project', 'group')),
  text text not null check (pg_catalog.length(pg_catalog.btrim(text)) > 0),
  signatory_title text not null,
  signatory_name text,
  published_at timestamptz,
  check_by date,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  constraint developer_replies_published_has_time check (status <> 'published' or published_at is not null)
);
create index developer_replies_phase_published_idx on ws.developer_replies (phase_id, published_at);
comment on table ws.developer_replies is 'The developer''s signed reply. scope = project: RiskSummary.developer_response of its phase. scope = group: the developer page''s group reply (T13). Drafts never reach a buyer.';
comment on column ws.developer_replies.scope is 'pii:C0 · project (this phase''s risk card) or group (the developer page; it speaks for every phase of the group).';
comment on column ws.developer_replies.text is 'pii:C0 · The published reply, in the developer''s words.';
comment on column ws.developer_replies.signatory_title is 'pii:C0 · e.g. "Authorised signatory". Shown on every surface.';
comment on column ws.developer_replies.signatory_name is 'pii:C1 · The person who signed it (Ananya Rao). Shown with the group reply ("Ananya Rao, authorised signatory, Northfield Estates"); never on the risk card. Required by the workspace RPC (M4); nullable until the generated seed carries it (Handoff T03).';
comment on column ws.developer_replies.run_id is 'pii:C0 · The published run the reply answers, when it answers one.';
comment on column ws.developer_replies.check_by is 'pii:C0 · The day Plinth checks the reply against the records by.';

-- ---------------------------------------------------------------------------
-- RLS (no policies: only SECURITY DEFINER api functions read them) and audit.
-- ---------------------------------------------------------------------------
alter table ws.developer_claims enable row level security;
alter table ws.developer_replies enable row level security;

create trigger developer_claims_audit
  after insert or update or delete on ws.developer_claims
  for each row execute function ops.audit_trigger();
create trigger developer_replies_audit
  after insert or update or delete on ws.developer_replies
  for each row execute function ops.audit_trigger();

-- PII tags (DATA_MODEL §0): every column of the two tables carries pii:C0–C3.
do $$
declare
  r record;
begin
  for r in
    select c.relname, a.attname, pg_catalog.col_description(c.oid, a.attnum) as note
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'ws'
      and c.relname in ('developer_claims', 'developer_replies')
      and a.attnum > 0
      and not a.attisdropped
      and coalesce(pg_catalog.col_description(c.oid, a.attnum), '') !~ '^pii:C[0-3]'
  loop
    execute format(
      'comment on column ws.%I.%I is %L',
      r.relname, r.attname,
      case when r.note is null then 'pii:C0' else 'pii:C0 · ' || r.note end
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Lockdown sweep (T04 pattern, BUILD_PLAN §12.1), then the explicit api grants.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
