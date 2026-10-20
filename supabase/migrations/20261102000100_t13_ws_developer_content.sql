-- T13 · API reads B 1/6: "From the developer" tables and the cost rules (DATA_MODEL §1, §4).
-- Sources: WORK_BREAKDOWN T13 ("it creates ws.price_lists, price_list_items, payment_plans,
-- payment_plan_stages, cost_sheets, cost_sheet_lines, developer_documents and
-- core.cost_rule_sets"); DATA_MODEL §0 conventions, §12 inv. 6; API_CONTRACTS §4.2, §4.13;
-- packages/fixtures/seedmap/developer_content.mjs (the seed columns).
--
-- Everything in ws.* is what a developer says. It is shown as "From the developer · not
-- verified by Plinth" and never feeds a band: pipeline_writer has no privilege on `ws`
-- (T04), so scoring cannot read it. RLS is on with no policies and no grants: the rows
-- reach buyers only through the SECURITY DEFINER api functions (published rows only).
-- The developer workspace (M4) adds org(...) policies and the ws_* RPCs that write them.

-- ---------------------------------------------------------------------------
-- core.cost_rule_sets: the published arithmetic behind every all-in (GST, stamp duty,
-- registration, rounding). Versioned per state; a cost breakdown names its version.
-- ---------------------------------------------------------------------------
create table core.cost_rule_sets (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  state text not null,
  effective_from date,
  gst_uc_pct numeric(5, 2) not null check (gst_uc_pct >= 0 and gst_uc_pct <= 100),
  stamp_duty_pct jsonb not null check (pg_catalog.jsonb_typeof(stamp_duty_pct) = 'object'),
  registration_fee_inr bigint not null check (registration_fee_inr >= 0),
  rounding jsonb not null default '{}'::jsonb check (pg_catalog.jsonb_typeof(rounding) = 'object'),
  created_at timestamptz not null default now(),
  unique (version, state)
);
comment on table core.cost_rule_sets is 'Published cost rules (DATA_MODEL §1): GST on an under-construction home, stamp duty by buyer, the registration fee and rounding. core.all_in() reads the set in force on the cost sheet''s date. Reproduces ₹2,74,00,400 → ₹2.74 Cr, ₹18,900 per sq ft carpet.';
comment on column core.cost_rule_sets.version is 'pii:C0 · e.g. 2026.10; named in every cost breakdown (rules_version).';
comment on column core.cost_rule_sets.state is 'pii:C0 · The state whose rules these are (HR).';
comment on column core.cost_rule_sets.effective_from is 'pii:C0 · First day the set applies; null means it applies to every sheet until a later set.';
comment on column core.cost_rule_sets.gst_uc_pct is 'pii:C0 · GST on an under-construction home, % of base + charges.';
comment on column core.cost_rule_sets.stamp_duty_pct is 'pii:C0 · Stamp duty, % of base + charges, by buyer: {"male": 7, "female": 5, "joint": 6}.';
comment on column core.cost_rule_sets.registration_fee_inr is 'pii:C0 · The flat registration fee added to the stamp duty.';
comment on column core.cost_rule_sets.rounding is 'pii:C0 · Rounding units: all_in_per_sqft_carpet_inr (100), price_list_per_sqft_inr (1), afford_all_in_inr (1,00,000).';

-- ---------------------------------------------------------------------------
-- ws.price_lists and ws.price_list_items: dated base prices, never deleted.
-- ---------------------------------------------------------------------------
create table ws.price_lists (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  published_on date not null,
  published_precision core.date_precision not null default 'day',
  note text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  version integer not null default 1 check (version >= 1),
  lane core.lane not null default 'from_developer' check (lane = 'from_developer'),
  published_by uuid,
  created_at timestamptz not null default now()
);
create index price_lists_phase_published_idx on ws.price_lists (phase_id, published_on);
comment on table ws.price_lists is 'A developer''s dated price list (DATA_MODEL §4). Drafts: org(marketing, admin) in M4. Published lists reach buyers through api.project_page and are never deleted, so the price history stays.';
comment on column ws.price_lists.published_on is 'pii:C0 · The list''s date; read with published_precision (a month-precise list shows as "Oct 2026").';
comment on column ws.price_lists.published_precision is 'pii:C0 · day or month (DATA_MODEL §0 month-precision dates).';
comment on column ws.price_lists.note is 'pii:C0 · A label the list carries, e.g. "Launch" ("Launch, Jan 2023").';
comment on column ws.price_lists.status is 'pii:C0 · draft or published. Only published lists reach a buyer.';
comment on column ws.price_lists.version is 'pii:C0 · Revision of the same list.';
comment on column ws.price_lists.lane is 'pii:C0 · Always from_developer.';
comment on column ws.price_lists.published_by is 'pii:C1 · The workspace member who published it (M4).';

create table ws.price_list_items (
  price_list_id uuid not null references ws.price_lists (id) on delete cascade,
  unit_type_id uuid not null references core.unit_types (id),
  base_price_inr bigint not null check (base_price_inr > 0),
  per_sqft_carpet_inr bigint check (per_sqft_carpet_inr > 0),
  primary key (price_list_id, unit_type_id)
);
comment on table ws.price_list_items is 'Base price per unit type on a price list ("from ₹2.35 Cr", "₹16,207 per sq ft carpet").';
comment on column ws.price_list_items.base_price_inr is 'pii:C0 · Base price, before charges, GST and stamp duty.';
comment on column ws.price_list_items.per_sqft_carpet_inr is 'pii:C0 · Base price per sq ft of carpet, when the list states it.';

-- ---------------------------------------------------------------------------
-- ws.payment_plans and ws.payment_plan_stages (Aurelia: 13 stages, slabs 3/6/9/12/15/18/20).
-- ---------------------------------------------------------------------------
create table ws.payment_plans (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  kind text not null check (kind in ('construction_linked', 'down_payment', 'possession_linked', 'subvention')),
  name text not null,
  published_on date,
  status text not null default 'draft' check (status in ('draft', 'published')),
  lane core.lane not null default 'from_developer' check (lane = 'from_developer'),
  created_at timestamptz not null default now(),
  constraint payment_plans_published_has_date check (status <> 'published' or published_on is not null)
);
create index payment_plans_phase_idx on ws.payment_plans (phase_id);
comment on table ws.payment_plans is 'A developer''s payment plan for a phase (DATA_MODEL §4). Its stages drive Pay-as-built, the 10% cap check and Afford the wait''s payout.';
comment on column ws.payment_plans.kind is 'pii:C0 · construction_linked, down_payment, possession_linked or subvention.';
comment on column ws.payment_plans.name is 'pii:C0 · The plan''s own name ("Construction-linked plan").';
comment on column ws.payment_plans.published_on is 'pii:C0 · The day the developer published it.';
comment on column ws.payment_plans.status is 'pii:C0 · draft or published. Only published plans reach a buyer.';
comment on column ws.payment_plans.lane is 'pii:C0 · Always from_developer.';

create table ws.payment_plan_stages (
  plan_id uuid not null references ws.payment_plans (id) on delete cascade,
  seq integer not null check (seq >= 1),
  label text not null,
  stage_kind text not null check (stage_kind in ('booking', 'agreement', 'foundation', 'slab', 'brickwork', 'finishing', 'possession')),
  slab_no integer check (slab_no >= 1),
  pct numeric(5, 2) not null check (pct > 0 and pct <= 100),
  primary key (plan_id, seq),
  constraint payment_plan_stages_slab_has_number check ((stage_kind = 'slab') = (slab_no is not null))
);
comment on table ws.payment_plan_stages is 'The stages of a plan in order, each a share of the price. A slab stage names its slab.';
comment on column ws.payment_plan_stages.label is 'pii:C0 · The stage as the plan names it ("Slab 20 (top)").';
comment on column ws.payment_plan_stages.stage_kind is 'pii:C0 · booking, agreement, foundation, slab, brickwork, finishing or possession.';
comment on column ws.payment_plan_stages.slab_no is 'pii:C0 · The slab a slab stage pays for; compared with the QPR tower slabs.';
comment on column ws.payment_plan_stages.pct is 'pii:C0 · Share of the price due at this stage.';

-- ---------------------------------------------------------------------------
-- ws.cost_sheets and ws.cost_sheet_lines: the developer's cost sheet for one unit option.
-- GST and stamp duty lines are recomputed by core.all_in() from core.cost_rule_sets.
-- ---------------------------------------------------------------------------
create table ws.cost_sheets (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  unit_type_id uuid not null references core.unit_types (id),
  dated date not null,
  unit_label text,
  carpet_sqft numeric(8, 1) check (carpet_sqft > 0),
  super_sqft numeric(8, 1) check (super_sqft > 0),
  edc_idc_line text,
  status text not null default 'published' check (status in ('draft', 'published')),
  lane core.lane not null default 'from_developer' check (lane = 'from_developer'),
  created_at timestamptz not null default now()
);
create index cost_sheets_phase_dated_idx on ws.cost_sheets (phase_id, dated);
comment on table ws.cost_sheets is 'A developer cost sheet for one unit option (DATA_MODEL §4). Published through api.project_page (cost) and api.cost_breakdown (M3); other phases are summary-only (the price.all_in fact). The M4 workspace writes drafts explicitly.';
comment on column ws.cost_sheets.dated is 'pii:C0 · The sheet''s own date ("cost sheet of 2 Oct 2026").';
comment on column ws.cost_sheets.unit_label is 'pii:C0 · The option the sheet prices, e.g. "park-facing".';
comment on column ws.cost_sheets.carpet_sqft is 'pii:C0 · Carpet area on the sheet (basis: carpet).';
comment on column ws.cost_sheets.super_sqft is 'pii:C0 · Super area on the sheet (basis: super); loading = super ÷ carpet − 1.';
comment on column ws.cost_sheets.edc_idc_line is 'pii:C0 · How the sheet treats EDC and IDC, as it says it ("Included in the base").';
comment on column ws.cost_sheets.status is 'pii:C0 · draft or published. Only published sheets reach a buyer.';
comment on column ws.cost_sheets.lane is 'pii:C0 · Always from_developer.';

create table ws.cost_sheet_lines (
  cost_sheet_id uuid not null references ws.cost_sheets (id) on delete cascade,
  seq integer not null check (seq >= 1),
  code text not null check (code in ('base', 'plc', 'club', 'parking', 'ifms', 'edc_idc_included', 'power_backup', 'other', 'gst', 'stamp_registration')),
  label text not null,
  amount_inr bigint not null check (amount_inr >= 0),
  tag text check (tag in ('often_negotiable', 'set_by_law', 'included_in_base', 'refundable_deposit')),
  primary key (cost_sheet_id, seq)
);
comment on table ws.cost_sheet_lines is 'The lines of a cost sheet. base + charges are as the developer gives them; gst and stamp_registration are set by law and recomputed from core.cost_rule_sets.';
comment on column ws.cost_sheet_lines.code is 'pii:C0 · base, plc, club, parking, ifms, edc_idc_included, power_backup, other, gst or stamp_registration.';
comment on column ws.cost_sheet_lines.label is 'pii:C0 · The line as the sheet names it ("PLC (park-facing)").';
comment on column ws.cost_sheet_lines.amount_inr is 'pii:C0 · Whole rupees.';
comment on column ws.cost_sheet_lines.tag is 'pii:C0 · often_negotiable, set_by_law, included_in_base or refundable_deposit.';

-- ---------------------------------------------------------------------------
-- ws.developer_documents: floor plans, brochures, the transfer policy and the draft
-- agreement, with the few fields we show (summary).
-- ---------------------------------------------------------------------------
create table ws.developer_documents (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references core.phases (id),
  kind text not null check (kind in ('floor_plan', 'brochure', 'transfer_policy', 'draft_agreement')),
  dated date not null,
  storage_key text,
  summary jsonb not null default '{}'::jsonb check (pg_catalog.jsonb_typeof(summary) = 'object'),
  status text not null default 'published' check (status in ('draft', 'published')),
  lane core.lane not null default 'from_developer' check (lane = 'from_developer'),
  created_at timestamptz not null default now()
);
create index developer_documents_phase_idx on ws.developer_documents (phase_id);
comment on table ws.developer_documents is 'Documents a developer published in its workspace (DATA_MODEL §4): floor plan (rooms), brochure (amenities, its lender claim), transfer policy (₹150 per sq ft super), draft agreement (EDC/IDC clause). Shown as from_developer or Developer says, never as a record.';
comment on column ws.developer_documents.kind is 'pii:C0 · floor_plan, brochure, transfer_policy or draft_agreement.';
comment on column ws.developer_documents.dated is 'pii:C0 · The document''s own date.';
comment on column ws.developer_documents.storage_key is 'pii:C0 · The stored file (bucket key), when we keep one.';
comment on column ws.developer_documents.summary is 'pii:C0 · The fields we show, as given: rooms, amenities, lenders_claim, fee_per_sqft_super_inr, rules, edc_idc_increase.';
comment on column ws.developer_documents.status is 'pii:C0 · draft or published. Only published documents reach a buyer.';
comment on column ws.developer_documents.lane is 'pii:C0 · Always from_developer.';

-- ---------------------------------------------------------------------------
-- RLS (no policies: only SECURITY DEFINER api functions read them) and audit.
-- ---------------------------------------------------------------------------
alter table core.cost_rule_sets enable row level security;
alter table ws.price_lists enable row level security;
alter table ws.price_list_items enable row level security;
alter table ws.payment_plans enable row level security;
alter table ws.payment_plan_stages enable row level security;
alter table ws.cost_sheets enable row level security;
alter table ws.cost_sheet_lines enable row level security;
alter table ws.developer_documents enable row level security;

create trigger cost_rule_sets_audit
  after insert or update or delete on core.cost_rule_sets
  for each row execute function ops.audit_trigger();
create trigger price_lists_audit
  after insert or update or delete on ws.price_lists
  for each row execute function ops.audit_trigger();
create trigger payment_plans_audit
  after insert or update or delete on ws.payment_plans
  for each row execute function ops.audit_trigger();
create trigger cost_sheets_audit
  after insert or update or delete on ws.cost_sheets
  for each row execute function ops.audit_trigger();
create trigger developer_documents_audit
  after insert or update or delete on ws.developer_documents
  for each row execute function ops.audit_trigger();

-- A published price list is history: it is never deleted (DATA_MODEL §4).
create function ws.price_lists_keep_published()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'published' then
    raise exception using
      errcode = '42501',
      message = 'ws.price_lists: a published price list is never deleted',
      hint = 'Publish a new list instead; buyers see every dated list.';
  end if;
  return old;
end
$$;
comment on function ws.price_lists_keep_published() is 'BEFORE DELETE trigger: published price lists are history and are never deleted.';
create trigger price_lists_keep_published
  before delete on ws.price_lists
  for each row execute function ws.price_lists_keep_published();

-- PII tags (DATA_MODEL §0): every column of the new tables carries pii:C0–C3.
do $$
declare
  r record;
begin
  for r in
    select n.nspname, c.relname, a.attname, pg_catalog.col_description(c.oid, a.attnum) as note
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where (n.nspname, c.relname) in (
        ('core', 'cost_rule_sets'), ('ws', 'price_lists'), ('ws', 'price_list_items'), ('ws', 'payment_plans'),
        ('ws', 'payment_plan_stages'), ('ws', 'cost_sheets'), ('ws', 'cost_sheet_lines'), ('ws', 'developer_documents'))
      and a.attnum > 0
      and not a.attisdropped
      and coalesce(pg_catalog.col_description(c.oid, a.attnum), '') !~ '^pii:C[0-3]'
  loop
    execute format(
      'comment on column %I.%I.%I is %L',
      r.nspname, r.relname, r.attname,
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
grant execute on function api.risk_summary(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text) to anon, authenticated, service_role;
