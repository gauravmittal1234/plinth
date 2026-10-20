-- T60 · M3 checks 1/4: the check tables, the review queue, and app.uploads for M3.
-- Sources: DATA_MODEL §7 (every check table), §10 (ops.review_tasks), §12 invariants 1, 3 and 5;
-- BUILD_PLAN §12.9 (uploads: 15 MB, 20 pages, no SVG), §12.10 (PII tags), §14 hard rule 1;
-- WORK_BREAKDOWN T60 and the M3 rules (top of Wave 6): "AI reads; rules decide", "Bank account
-- numbers become tokens before any reader call and are kept only as a salted hash plus the
-- last 4 digits", "Nothing is checked before the project is confirmed".
--
-- Posture (DATA_MODEL §0, §12 inv. 1): every table has RLS on and no grant to anon or
-- authenticated, so `api.*` SECURITY DEFINER functions are the only door. The policies below are
-- the second wall, owner-only and SELECT-only: nobody writes these tables directly, not even
-- their owner (writes go through the T68/T73–T75/T77 RPCs). A family-circle member reads none of
-- the owner's rows (inv. 5), because every policy names the owner alone.
--
-- No column can hold a full bank account number. app.payee_checks keeps `account_sha256` (a
-- salted HMAC, hex) and `account_last4` only, and the free-text and JSON columns of
-- app.payee_checks, app.extracted_claims and app.receipts refuse a run of digits as long as an
-- account number (app.has_digit_run: 9 or more digits, spaces and hyphens inside a run included;
-- 11 or more for claims that are not about an account, so an amount up to ₹999 Cr still fits).
--
-- 1. app.uploads (T53) gains its M3 columns by ALTER; T53's retention columns are unchanged.
-- 2. app.has_digit_run: the account-number guard.
-- 3. core.check_rules: the published rules every verdict names (rows arrive with T73–T75).
-- 4. app.doc_checks, ops.review_tasks, app.extracted_claims, app.claim_verdicts,
--    app.cost_sheet_reads, app.bookings, app.payee_checks, app.receipts.
-- 5. Invariant triggers: a verdict needs a confirmed check; matches/differs needs both readers
--    to have agreed (a single reader never produces differs).
-- 6. RLS, policies, audit triggers, lockdown.

-- ---------------------------------------------------------------------------
-- 1. app.uploads: the M3 columns (DATA_MODEL §7; WORK_BREAKDOWN T60). Every T53 column, index,
--    trigger and policy stays as it is. Rows written before M3 read as stored, channel unknown.
-- ---------------------------------------------------------------------------
alter table app.uploads
  add column channel text check (channel in ('web', 'app', 'whatsapp')),
  add column wa_message_id text check (wa_message_id is null or pg_catalog.length(wa_message_id) between 1 and 200),
  add column bytes integer check (bytes is null or bytes between 1 and 15728640),
  add column status text not null default 'stored' check (status in ('awaiting_file', 'stored', 'rejected')),
  add column rejected_reason text check (rejected_reason is null or rejected_reason ~ '^[a-z][a-z0-9_]{0,63}$'),
  add column stored_at timestamptz,
  add constraint uploads_rejected_has_reason check ((status = 'rejected') = (rejected_reason is not null));

-- A forwarded WhatsApp file is stored once, however often Meta redelivers it.
create unique index uploads_wa_message_idx on app.uploads (wa_message_id) where wa_message_id is not null;
create index uploads_wa_contact_idx on app.uploads (wa_contact_id) where wa_contact_id is not null;

comment on column app.uploads.channel is 'pii:C1 · web | app | whatsapp. Set on every upload from M3 (api.create_upload, T68); null on rows written before M3.';
comment on column app.uploads.wa_message_id is 'pii:C1 · Meta''s message id of a forwarded WhatsApp file (wamid.…): unique, so a redelivery never stores the file twice.';
comment on column app.uploads.bytes is 'pii:C1 · File size; at most 15 MB (BUILD_PLAN §12.9).';
comment on column app.uploads.status is 'pii:C1 · awaiting_file (signed upload URL issued) → stored, or rejected (size, type, pages). Rows written before M3 are stored.';
comment on column app.uploads.rejected_reason is 'pii:C1 · A code (too_large, bad_type, too_many_pages, …), set exactly when status = rejected.';
comment on column app.uploads.stored_at is 'pii:C1 · When the file landed in Storage.';
comment on column app.uploads.id is 'pii:C1';

-- ---------------------------------------------------------------------------
-- 2. The account-number guard.
-- ---------------------------------------------------------------------------
create function app.has_digit_run(p_text text, p_min integer)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  -- Before counting: drop UUIDs, SHA-256 digests (hex), IFSC codes and decimal numbers (0.93,
  -- 2.74), none of which is an account number; then join digit groups split by one space or
  -- hyphen (5020 0071 8244 17 → 50200071824417).
  select coalesce(
    pg_catalog.regexp_replace(
      pg_catalog.regexp_replace(
        pg_catalog.regexp_replace(
          pg_catalog.regexp_replace(
            pg_catalog.regexp_replace(
              p_text,
              '[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}', ' ', 'g'
            ),
            '[0-9A-Fa-f]{64}', ' ', 'g'
          ),
          '\m[A-Za-z]{4}0[A-Za-z0-9]{6}\M', ' ', 'g'
        ),
        '[0-9]+\.[0-9]+', ' ', 'g'
      ),
      '([0-9])[ -]([0-9])', '\1\2', 'g'
    ) ~ ('[0-9]{' || p_min::text || ',}'),
    false
  )
$$;
comment on function app.has_digit_run(text, integer) is 'True when the text holds a run of at least p_min digits (one space or hyphen inside a run counts as part of it), ignoring UUIDs, SHA-256 digests, IFSC codes and decimals. CHECK constraints use it so no column can hold a full bank account number.';

-- ---------------------------------------------------------------------------
-- 3. core.check_rules: the published rules (public, C0; read through api only).
-- ---------------------------------------------------------------------------
create table core.check_rules (
  id uuid primary key default gen_random_uuid(),
  version text not null check (version ~ '^[0-9]{4}\.[0-9]{2}$'),
  kind text not null check (kind in ('claims', 'cost_sheet', 'pay_as_built', 'before_you_pay', 'visit_recap')),
  claim_type text check (claim_type is null or claim_type in (
    'possession_date', 'price', 'all_in', 'area', 'rera_number', 'oc_status', 'sold_left', 'amenity',
    'demand_stage', 'plan_stage', 'amount', 'payee_name', 'account_number', 'ifsc', 'banned_phrase'
  )),
  rule_code text not null check (rule_code ~ '^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$' and pg_catalog.length(rule_code) <= 80),
  params jsonb not null default '{}'::jsonb check (pg_catalog.jsonb_typeof(params) = 'object'),
  text text not null check (pg_catalog.length(text) between 1 and 1000),
  source_line text check (source_line is null or pg_catalog.length(source_line) between 1 and 500),
  created_at timestamptz not null default now(),
  unique (version, rule_code)
);
create index check_rules_kind_idx on core.check_rules (version, kind, claim_type);
comment on table core.check_rules is 'The rules that decide every check (M3 rules: AI reads; rules decide). Version 2026.10; params hold the tolerances and the confidence bar both readers must clear. Public data, read through api functions only. Rows arrive with T73–T75. Every change is audited, and a verdict''s (version, rule_code) must exist here, so a rule a verdict names cannot be deleted; a new reading of the law gets a new version.';
comment on column core.check_rules.id is 'pii:C0';
comment on column core.check_rules.version is 'pii:C0 · e.g. 2026.10 (the doc_check payload''s rules_version).';
comment on column core.check_rules.kind is 'pii:C0 · The check kind the rule decides.';
comment on column core.check_rules.claim_type is 'pii:C0 · The claim type it compares; null for a rule about the whole document (e.g. the 10% cap).';
comment on column core.check_rules.rule_code is 'pii:C0 · Stable code a verdict names (app.claim_verdicts.rule_code).';
comment on column core.check_rules.params is 'pii:C0 · Tolerances and the confidence bar ({"confidence_bar": 0.8, …}).';
comment on column core.check_rules.text is 'pii:C0 · The rule in plain words ("How we checked").';
comment on column core.check_rules.source_line is 'pii:C0 · The law or record it rests on ("RERA s.13").';
comment on column core.check_rules.created_at is 'pii:C0';

-- ---------------------------------------------------------------------------
-- 4a. app.doc_checks: one check of one document (or forwarded text).
-- ---------------------------------------------------------------------------
create table app.doc_checks (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid references app.uploads (id),
  user_id uuid references auth.users (id) on delete set null,
  wa_contact_id uuid references pii.wa_contacts (id) on delete set null,
  kind text not null check (kind in ('claims', 'cost_sheet', 'pay_as_built', 'before_you_pay', 'visit_recap')),
  channel text not null check (channel in ('web', 'app', 'whatsapp')),
  status text not null default 'reading' check (status in (
    'reading', 'confirm_project', 'checking', 'done', 'unreadable', 'partly_readable', 'no_claims', 'outside_coverage'
  )),
  status_detail text check (status_detail is null or pg_catalog.length(status_detail) between 1 and 200),
  phase_id uuid references core.phases (id),
  match_method text check (match_method is null or match_method in ('rera_number', 'name_sector', 'user_pick')),
  project_candidates jsonb not null default '[]'::jsonb check (pg_catalog.jsonb_typeof(project_candidates) = 'array'),
  confirmed_at timestamptz,
  summary jsonb check (summary is null or pg_catalog.jsonb_typeof(summary) = 'object'),
  rules_version text check (rules_version is null or rules_version ~ '^[0-9]{4}\.[0-9]{2}$'),
  recheck jsonb check (recheck is null or pg_catalog.jsonb_typeof(recheck) in ('object', 'array')),
  saved_at timestamptz,
  created_at timestamptz not null default ops.now(),
  updated_at timestamptz not null default now(),
  -- "Nothing is checked before the project is confirmed" (M3 rules).
  constraint doc_checks_confirmed_before_checking check (
    status not in ('checking', 'done') or (confirmed_at is not null and phase_id is not null)
  ),
  constraint doc_checks_confirm_names_project check (confirmed_at is null or phase_id is not null)
);
create index doc_checks_upload_idx on app.doc_checks (upload_id);
create index doc_checks_status_idx on app.doc_checks (status);
create index doc_checks_user_idx on app.doc_checks (user_id, created_at) where user_id is not null;
create index doc_checks_wa_contact_idx on app.doc_checks (wa_contact_id) where wa_contact_id is not null;
create index doc_checks_phase_idx on app.doc_checks (phase_id) where phase_id is not null;
comment on table app.doc_checks is 'One check of one document (DATA_MODEL §7): claims, cost_sheet, pay_as_built, before_you_pay, visit_recap. Lifecycle reading → confirm_project → checking → done (or unreadable, partly_readable, no_claims, outside_coverage); nothing is checked before the buyer confirms the project. Written by the T68 lifecycle RPCs only. Own read; never the family circle.';
comment on column app.doc_checks.id is 'pii:C1';
comment on column app.doc_checks.upload_id is 'pii:C1 · The file; null for forwarded WhatsApp text (no file is stored).';
comment on column app.doc_checks.user_id is 'pii:C1 · The owner (the upload''s owner). Null for a WhatsApp-only sender.';
comment on column app.doc_checks.wa_contact_id is 'pii:C1 · The WhatsApp sender, when it came in on WhatsApp.';
comment on column app.doc_checks.kind is 'pii:C1';
comment on column app.doc_checks.channel is 'pii:C1 · web | app | whatsapp.';
comment on column app.doc_checks.status is 'pii:C1 · API_CONTRACTS §4.12 states.';
comment on column app.doc_checks.status_detail is 'pii:C1 · Why a check ended unreadable or partly_readable (a code or a short line; never document text).';
comment on column app.doc_checks.phase_id is 'pii:C1 · The project the buyer confirmed (or the best match before that).';
comment on column app.doc_checks.match_method is 'pii:C1 · rera_number | name_sector | user_pick.';
comment on column app.doc_checks.project_candidates is 'pii:C1 · [{phase_id, slug, method, score}] offered on confirm_project (api.doc_check_match).';
comment on column app.doc_checks.confirmed_at is 'pii:C1 · When the buyer confirmed the project. Required before checking or done.';
comment on column app.doc_checks.summary is 'pii:C2 · The decided summary ("4 of 7 claims differ…"), written by the deciders.';
comment on column app.doc_checks.rules_version is 'pii:C0 · core.check_rules version the verdicts came from.';
comment on column app.doc_checks.recheck is 'pii:C2 · Re-check history after new filings (T77): earlier summaries and the events that changed them.';
comment on column app.doc_checks.saved_at is 'pii:C1 · The buyer saved this check to their account (it is then in "Download my data"; its upload is kept past 30 days).';
comment on column app.doc_checks.created_at is 'pii:C1';
comment on column app.doc_checks.updated_at is 'pii:C1';

create trigger doc_checks_touch
  before update on app.doc_checks
  for each row execute function ops.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4b. ops.review_tasks: the review queue (DATA_MODEL §10, plus adviser_request).
-- ---------------------------------------------------------------------------
create table ops.review_tasks (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in (
    'extraction_disagreement', 'low_confidence_claim', 'dispute', 'clerical', 'notice', 'legal', 'capture',
    'entity_merge', 'demand_check', 'adviser_request'
  )),
  entity text not null check (entity ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  entity_id uuid not null,
  check_id uuid references app.doc_checks (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  wa_contact_id uuid references pii.wa_contacts (id) on delete cascade,
  priority numeric(8, 4) not null default 0 check (priority >= 0),
  status text not null default 'open' check (status in ('open', 'assigned', 'resolved', 'dismissed')),
  assignee uuid references auth.users (id) on delete set null,
  request_note text check (request_note is null or pg_catalog.length(request_note) between 1 and 1000),
  resolution jsonb check (resolution is null or pg_catalog.jsonb_typeof(resolution) = 'object'),
  resolved_by uuid references auth.users (id) on delete set null,
  resolved_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default ops.now(),
  updated_at timestamptz not null default now(),
  constraint review_tasks_closed_has_time check ((status in ('resolved', 'dismissed')) = (resolved_at is not null))
);
-- One open task per thing to review: a disagreement opens exactly one task, however often the
-- reading is ingested again.
create unique index review_tasks_one_open_idx on ops.review_tasks (kind, entity, entity_id)
  where status in ('open', 'assigned');
create index review_tasks_status_priority_idx on ops.review_tasks (status, priority desc);
create index review_tasks_check_idx on ops.review_tasks (check_id) where check_id is not null;
create index review_tasks_user_idx on ops.review_tasks (user_id) where user_id is not null;
comment on table ops.review_tasks is 'The review queue (DATA_MODEL §10): readings the two AI readers disagreed on or read below the bar, adviser requests, disputes and other human work. Priority = impact × uncertainty (T77). Service (through api RPCs) and admin (aal2) only.';
comment on column ops.review_tasks.id is 'pii:C1';
comment on column ops.review_tasks.kind is 'pii:C0';
comment on column ops.review_tasks.entity is 'pii:C0 · The table the task is about (app.extracted_claims, app.doc_checks, …).';
comment on column ops.review_tasks.entity_id is 'pii:C1 · The row in that table.';
comment on column ops.review_tasks.check_id is 'pii:C1 · The buyer''s check, when the task is about one (removed with it).';
comment on column ops.review_tasks.user_id is 'pii:C1 · The buyer who asked (adviser requests) or owns the check.';
comment on column ops.review_tasks.wa_contact_id is 'pii:C1 · The WhatsApp sender, for a request that came in on WhatsApp.';
comment on column ops.review_tasks.priority is 'pii:C0 · Impact × uncertainty; higher first.';
comment on column ops.review_tasks.status is 'pii:C0 · open | assigned | resolved | dismissed.';
comment on column ops.review_tasks.assignee is 'pii:C1 · The staff member working it.';
comment on column ops.review_tasks.request_note is 'pii:C2 · What the buyer wrote with an adviser request.';
comment on column ops.review_tasks.resolution is 'pii:C2 · {choice: reader_a | reader_b | manual | unreadable, value, note} (T77). Never a full account number.';
comment on column ops.review_tasks.resolved_by is 'pii:C1';
comment on column ops.review_tasks.resolved_at is 'pii:C0';
comment on column ops.review_tasks.due_at is 'pii:C0 · Adviser requests: the same working day (Mon–Sat 10 am–7 pm IST).';
comment on column ops.review_tasks.created_at is 'pii:C0';
comment on column ops.review_tasks.updated_at is 'pii:C0';

create trigger review_tasks_touch
  before update on ops.review_tasks
  for each row execute function ops.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4c. app.extracted_claims: what the two readers read, line by line.
-- ---------------------------------------------------------------------------
create table app.extracted_claims (
  id uuid primary key default gen_random_uuid(),
  check_id uuid not null references app.doc_checks (id) on delete cascade,
  seq smallint not null check (seq between 1 and 500),
  claim_type text not null check (claim_type in (
    'possession_date', 'price', 'all_in', 'area', 'rera_number', 'oc_status', 'sold_left', 'amenity',
    'demand_stage', 'plan_stage', 'amount', 'payee_name', 'account_number', 'ifsc', 'banned_phrase'
  )),
  raw_text text not null check (pg_catalog.length(raw_text) between 1 and 2000),
  value jsonb,
  unit text check (unit is null or unit ~ '^[a-z_]{1,16}$'),
  qualifier text check (qualifier is null or qualifier in ('super', 'carpet', 'all_in', 'base')),
  bbox jsonb check (bbox is null or pg_catalog.jsonb_typeof(bbox) = 'array'),
  page smallint check (page is null or page between 1 and 20),
  line_ids text[] not null default '{}'::text[] check (pg_catalog.cardinality(line_ids) <= 200),
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  reader_a jsonb,
  reader_b jsonb,
  agreed boolean not null default false,
  review_task_id uuid references ops.review_tasks (id) on delete set null,
  created_at timestamptz not null default ops.now(),
  unique (check_id, seq),
  -- No full account number, in any column a reader or the OCR fills: an account claim carries
  -- the token, the last 4 and the salted hash only (M3 rules: PII before models).
  constraint extracted_claims_no_account_number check (
    not app.has_digit_run(
      pg_catalog.concat_ws(' | ', raw_text, value::text, reader_a::text, reader_b::text, bbox::text,
        pg_catalog.array_to_string(line_ids, ' | ')),
      case when claim_type = 'account_number' then 9 else 11 end
    )
  )
);
create index extracted_claims_check_idx on app.extracted_claims (check_id);
create index extracted_claims_review_idx on app.extracted_claims (review_task_id) where review_task_id is not null;
comment on table app.extracted_claims is 'What the readers read (DATA_MODEL §7): each claim with both readers'' values, whether they agreed, the lower confidence and the OCR line ids (bounding boxes come from the OCR lines, never a reader). A disagreement or a confidence under the rule''s bar links a review task. Third-party phone numbers are masked and account numbers tokenised before ingest; a CHECK refuses a full account number. Own read; never the family circle.';
comment on column app.extracted_claims.id is 'pii:C1';
comment on column app.extracted_claims.check_id is 'pii:C1';
comment on column app.extracted_claims.seq is 'pii:C1 · Row order on the page (1 = first).';
comment on column app.extracted_claims.claim_type is 'pii:C1';
comment on column app.extracted_claims.raw_text is 'pii:C2 · The claim as printed ("POSSESSION DEC 2026"), PII-stripped.';
comment on column app.extracted_claims.value is 'pii:C2 · The agreed, normalised value (₹ as integer rupees, dates to the month, areas with basis). Account claims: {token, last4, sha256} only.';
comment on column app.extracted_claims.unit is 'pii:C1 · inr | sqft | month | pct | …';
comment on column app.extracted_claims.qualifier is 'pii:C1 · super | carpet | all_in | base.';
comment on column app.extracted_claims.bbox is 'pii:C1 · [x0, y0, x1, y1] on the page, 0–1, from the OCR lines.';
comment on column app.extracted_claims.page is 'pii:C1';
comment on column app.extracted_claims.line_ids is 'pii:C1 · The OCR line ids the readers cited.';
comment on column app.extracted_claims.confidence is 'pii:C1 · The lower of the two readers'' confidences, 0–1.';
comment on column app.extracted_claims.reader_a is 'pii:C2 · Reader A''s value and confidence, as returned (PII-stripped).';
comment on column app.extracted_claims.reader_b is 'pii:C2 · Reader B''s value and confidence, as returned (PII-stripped).';
comment on column app.extracted_claims.agreed is 'pii:C1 · Both readers agreed (or a person resolved it). Only an agreed claim can be matches or differs.';
comment on column app.extracted_claims.review_task_id is 'pii:C1 · The open review task for this row, if any.';
comment on column app.extracted_claims.created_at is 'pii:C1';

-- ---------------------------------------------------------------------------
-- 4d. app.claim_verdicts: what the rules decided (never AI).
-- ---------------------------------------------------------------------------
create table app.claim_verdicts (
  claim_id uuid primary key references app.extracted_claims (id) on delete cascade,
  verdict app.verdict not null,
  records_label text check (records_label is null or pg_catalog.length(records_label) between 1 and 60),
  records_text text check (records_text is null or pg_catalog.length(records_text) between 1 and 1000),
  how_checked text check (how_checked is null or pg_catalog.length(how_checked) between 1 and 500),
  fact_ids uuid[] not null default '{}'::uuid[],
  checkable_on date,
  broker_question text check (broker_question is null or pg_catalog.length(broker_question) between 1 and 300),
  rule_code text not null,
  rule_version text not null,
  decided_at timestamptz not null default ops.now(),
  foreign key (rule_version, rule_code) references core.check_rules (version, rule_code)
);
create index claim_verdicts_rule_idx on app.claim_verdicts (rule_version, rule_code);
comment on table app.claim_verdicts is 'One verdict per claim (DATA_MODEL §7): matches, differs, not_in_records or cant_check, set by a rule in core.check_rules (rules, not AI). Only for a confirmed check; matches/differs only for a claim both readers agreed on. Re-deciding replaces the row; the audit log keeps the history. Own read; never the family circle.';
comment on column app.claim_verdicts.claim_id is 'pii:C1';
comment on column app.claim_verdicts.verdict is 'pii:C1 · app.verdict.';
comment on column app.claim_verdicts.records_label is 'pii:C0 · Optional lane label ("Records show", "Price list shows", "Your plan shows").';
comment on column app.claim_verdicts.records_text is 'pii:C1 · What the records show ("Original completion Dec 2027, no extensions; 41% built.").';
comment on column app.claim_verdicts.how_checked is 'pii:C0 · "Date compared with the HARERA registration."';
comment on column app.claim_verdicts.fact_ids is 'pii:C0 · The core.facts behind records_text.';
comment on column app.claim_verdicts.checkable_on is 'pii:C0 · When a cant_check row can be checked (the next filing), if known.';
comment on column app.claim_verdicts.broker_question is 'pii:C0 · The question to ask the broker.';
comment on column app.claim_verdicts.rule_code is 'pii:C0 · The deciding rule (core.check_rules).';
comment on column app.claim_verdicts.rule_version is 'pii:C0';
comment on column app.claim_verdicts.decided_at is 'pii:C1';

-- ---------------------------------------------------------------------------
-- 4e. app.cost_sheet_reads: the arithmetic of a cost-sheet check.
-- ---------------------------------------------------------------------------
create table app.cost_sheet_reads (
  check_id uuid primary key references app.doc_checks (id) on delete cascade,
  lines jsonb not null default '[]'::jsonb check (pg_catalog.jsonb_typeof(lines) = 'array'),
  all_in_inr bigint check (all_in_inr is null or all_in_inr >= 0),
  per_sqft_carpet_inr bigint check (per_sqft_carpet_inr is null or per_sqft_carpet_inr >= 0),
  loading_pct numeric(5, 2) check (loading_pct is null or loading_pct between 0 and 999.99),
  negotiable_inr bigint check (negotiable_inr is null or negotiable_inr >= 0),
  rules_version text check (rules_version is null or rules_version ~ '^[0-9]{4}\.[0-9]{2}$'),
  created_at timestamptz not null default ops.now()
);
comment on table app.cost_sheet_reads is 'A cost-sheet check''s result (DATA_MODEL §7): the lines and the all-in, per sq ft carpet, loading and often-negotiable totals, by rules version. Own read; never the family circle. Exported in "Download my data" when the check is saved.';
comment on column app.cost_sheet_reads.check_id is 'pii:C1';
comment on column app.cost_sheet_reads.lines is 'pii:C2 · [{code, label, amount_inr, tag}] as read and classified.';
comment on column app.cost_sheet_reads.all_in_inr is 'pii:C2';
comment on column app.cost_sheet_reads.per_sqft_carpet_inr is 'pii:C2';
comment on column app.cost_sheet_reads.loading_pct is 'pii:C2';
comment on column app.cost_sheet_reads.negotiable_inr is 'pii:C2';
comment on column app.cost_sheet_reads.rules_version is 'pii:C0';
comment on column app.cost_sheet_reads.created_at is 'pii:C1';

-- ---------------------------------------------------------------------------
-- 4f. app.bookings: the flat a buyer booked (Pay-as-built). Never visible to the family circle.
-- ---------------------------------------------------------------------------
create table app.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phase_id uuid not null references core.phases (id),
  tower_id uuid references core.towers (id),
  unit_no text not null check (unit_no ~ '^[A-Za-z0-9][A-Za-z0-9 /-]{0,15}$'),
  price_inr bigint check (price_inr is null or price_inr between 1 and 10000000000),
  booked_on date,
  agreement_registered_on date,
  paid_to_date_inr bigint check (paid_to_date_inr is null or paid_to_date_inr between 0 and 10000000000),
  plan_id uuid references ws.payment_plans (id) on delete set null,
  created_at timestamptz not null default ops.now(),
  updated_at timestamptz not null default now(),
  constraint bookings_one_per_unit unique nulls not distinct (user_id, phase_id, tower_id, unit_no)
);
create index bookings_user_idx on app.bookings (user_id);
comment on table app.bookings is 'A buyer''s booked flat (DATA_MODEL §7): unit, price, dates, paid to date and payment plan. Written by api.booking_save only. Own read; never visible to the family circle (inv. 5).';
comment on column app.bookings.id is 'pii:C2';
comment on column app.bookings.user_id is 'pii:C2';
comment on column app.bookings.phase_id is 'pii:C2';
comment on column app.bookings.tower_id is 'pii:C2';
comment on column app.bookings.unit_no is 'pii:C2 · e.g. A-1104.';
comment on column app.bookings.price_inr is 'pii:C2';
comment on column app.bookings.booked_on is 'pii:C2';
comment on column app.bookings.agreement_registered_on is 'pii:C2 · Null before the agreement is registered (the 10% cap applies).';
comment on column app.bookings.paid_to_date_inr is 'pii:C2';
comment on column app.bookings.plan_id is 'pii:C2 · ws.payment_plans the booking follows.';
comment on column app.bookings.created_at is 'pii:C2';
comment on column app.bookings.updated_at is 'pii:C2';

create trigger bookings_touch
  before update on app.bookings
  for each row execute function ops.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4g. app.payee_checks: "Before you pay". The account number is hashed, never stored.
-- ---------------------------------------------------------------------------
create table app.payee_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  wa_contact_id uuid references pii.wa_contacts (id) on delete set null,
  check_id uuid references app.doc_checks (id) on delete cascade,
  phase_id uuid not null references core.phases (id),
  payee_name text check (payee_name is null or (pg_catalog.length(payee_name) between 1 and 200 and not app.has_digit_run(payee_name, 9))),
  account_last4 varchar(4) check (account_last4 is null or account_last4 ~ '^[0-9]{4}$'),
  account_sha256 varchar(64) check (account_sha256 is null or account_sha256 ~ '^[0-9a-f]{64}$'),
  ifsc varchar(11) check (ifsc is null or ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  amount_inr bigint check (amount_inr is null or amount_inr between 1 and 10000000000),
  stage text check (stage is null or stage in ('before_agreement', 'after_agreement')),
  method text check (method is null or method in ('transfer', 'cheque', 'cash')),
  result jsonb not null default '{}'::jsonb check (pg_catalog.jsonb_typeof(result) = 'object' and not app.has_digit_run(result::text, 9)),
  created_at timestamptz not null default ops.now(),
  constraint payee_checks_account_pair check ((account_last4 is null) = (account_sha256 is null))
);
create index payee_checks_user_idx on app.payee_checks (user_id) where user_id is not null;
create index payee_checks_wa_contact_idx on app.payee_checks (wa_contact_id) where wa_contact_id is not null;
create index payee_checks_check_idx on app.payee_checks (check_id) where check_id is not null;
comment on table app.payee_checks is 'A "Before you pay" check (DATA_MODEL §7; API_CONTRACTS §4.14): the payee, account and IFSC compared with the collection account registered with HARERA, and the 10% cap. The full account number is never stored: only a salted HMAC-SHA256 (account_sha256) and the last 4 digits, since the registered one is in core. No column can hold a full account number. Own read; never the family circle.';
comment on column app.payee_checks.id is 'pii:C2';
comment on column app.payee_checks.user_id is 'pii:C2 · Null for a WhatsApp-only sender (signed-out checks write no row).';
comment on column app.payee_checks.wa_contact_id is 'pii:C2 · The WhatsApp sender, when it came in on WhatsApp.';
comment on column app.payee_checks.check_id is 'pii:C2 · The demand letter or payment request it was read from, if any.';
comment on column app.payee_checks.phase_id is 'pii:C2';
comment on column app.payee_checks.payee_name is 'pii:C2 · The payee as entered or read (a company, never a buyer).';
comment on column app.payee_checks.account_last4 is 'pii:C2 · The last 4 digits only ("ending 8082").';
comment on column app.payee_checks.account_sha256 is 'pii:C2 · Salted HMAC-SHA256 of the account number, hex. The number itself is never stored.';
comment on column app.payee_checks.ifsc is 'pii:C2';
comment on column app.payee_checks.amount_inr is 'pii:C2';
comment on column app.payee_checks.stage is 'pii:C2 · before_agreement | after_agreement.';
comment on column app.payee_checks.method is 'pii:C2 · transfer | cheque | cash.';
comment on column app.payee_checks.result is 'pii:C2 · Per-field matches and the cap check (plinth.payee_check/1 payee and cap blocks). Never a full account number.';
comment on column app.payee_checks.created_at is 'pii:C2';

-- ---------------------------------------------------------------------------
-- 4h. app.receipts: typed in R1 (amount, date, last 4 of the UTR; FOUNDER_QUESTIONS M3-12).
-- ---------------------------------------------------------------------------
create table app.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phase_id uuid not null references core.phases (id),
  booking_id uuid references app.bookings (id) on delete set null,
  upload_id uuid references app.uploads (id) on delete set null,
  amount_inr bigint not null check (amount_inr between 1 and 10000000000),
  paid_on date not null,
  utr_last4 varchar(4) check (utr_last4 is null or utr_last4 ~ '^[A-Za-z0-9]{4}$'),
  checks jsonb not null default '{}'::jsonb check (pg_catalog.jsonb_typeof(checks) = 'object' and not app.has_digit_run(checks::text, 9)),
  created_at timestamptz not null default ops.now()
);
create index receipts_user_idx on app.receipts (user_id);
comment on table app.receipts is 'A payment the buyer recorded (DATA_MODEL §7), typed in R1: amount, date and the last 4 of the UTR. Kept until the user deletes it. Own read; never the family circle.';
comment on column app.receipts.id is 'pii:C2';
comment on column app.receipts.user_id is 'pii:C2';
comment on column app.receipts.phase_id is 'pii:C2';
comment on column app.receipts.booking_id is 'pii:C2';
comment on column app.receipts.upload_id is 'pii:C2 · A photo of the receipt, if the buyer added one.';
comment on column app.receipts.amount_inr is 'pii:C2';
comment on column app.receipts.paid_on is 'pii:C2';
comment on column app.receipts.utr_last4 is 'pii:C2 · The last 4 characters of the UTR only ("…7731").';
comment on column app.receipts.checks is 'pii:C2 · What the rules found (within the cap, paid to the registered account).';
comment on column app.receipts.created_at is 'pii:C2';

-- ---------------------------------------------------------------------------
-- 5. Invariant triggers (M3 rules).
-- ---------------------------------------------------------------------------
create function app.claim_verdicts_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_confirmed timestamptz;
  v_agreed boolean;
begin
  select c.confirmed_at, x.agreed into v_confirmed, v_agreed
  from app.extracted_claims x
  join app.doc_checks c on c.id = x.check_id
  where x.id = new.claim_id;

  if v_confirmed is null then
    raise exception using
      errcode = 'PT409',
      message = 'conflict',
      detail = 'Nothing is checked before the buyer confirms the project.';
  end if;
  if new.verdict in ('matches', 'differs') and not coalesce(v_agreed, false) then
    raise exception using
      errcode = 'PT409',
      message = 'conflict',
      detail = 'Only a claim both readers agreed on can match or differ; a single reader never decides.';
  end if;
  return new;
end
$$;
comment on function app.claim_verdicts_guard() is 'BEFORE INSERT/UPDATE on app.claim_verdicts: refuses a verdict for an unconfirmed check, and matches/differs for a claim the readers did not agree on (PT409).';

create trigger claim_verdicts_guard
  before insert or update on app.claim_verdicts
  for each row execute function app.claim_verdicts_guard();

-- ---------------------------------------------------------------------------
-- 6. Audit, RLS and policies.
--    Row-image audit (ops.audit_trigger) only where the history is the point: the rules, the
--    check lifecycle and the verdicts ("re-deciding replaces the verdicts; the audit log keeps
--    the history", T68). Never on the tables that hold a buyer's money details or free text
--    (bookings, payee checks, receipts, claims, the review queue): an audit row image outlives an
--    erasure (legal hold, ≥ 2 years), so their RPCs audit the action with ops.audit() and counts.
-- ---------------------------------------------------------------------------
create trigger check_rules_audit
  after insert or update or delete on core.check_rules
  for each row execute function ops.audit_trigger();
create trigger doc_checks_audit
  after insert or update or delete on app.doc_checks
  for each row execute function ops.audit_trigger();
create trigger claim_verdicts_audit
  after insert or update or delete on app.claim_verdicts
  for each row execute function ops.audit_trigger();

alter table core.check_rules enable row level security;
alter table app.doc_checks enable row level security;
alter table app.extracted_claims enable row level security;
alter table app.claim_verdicts enable row level security;
alter table app.cost_sheet_reads enable row level security;
alter table app.bookings enable row level security;
alter table app.payee_checks enable row level security;
alter table app.receipts enable row level security;
alter table ops.review_tasks enable row level security;

-- Owner-only, SELECT-only (the second wall; there are no grants). No write policy: RPCs only.
create policy own_read on app.doc_checks for select to authenticated
  using (user_id = (select auth.uid()));
create policy own_read on app.extracted_claims for select to authenticated
  using (exists (
    select 1 from app.doc_checks c
    where c.id = check_id and c.user_id = (select auth.uid())
  ));
create policy own_read on app.claim_verdicts for select to authenticated
  using (exists (
    select 1 from app.extracted_claims x
    join app.doc_checks c on c.id = x.check_id
    where x.id = claim_id and c.user_id = (select auth.uid())
  ));
create policy own_read on app.cost_sheet_reads for select to authenticated
  using (exists (
    select 1 from app.doc_checks c
    where c.id = check_id and c.user_id = (select auth.uid())
  ));
create policy own_read on app.bookings for select to authenticated
  using (user_id = (select auth.uid()));
create policy own_read on app.payee_checks for select to authenticated
  using (user_id = (select auth.uid()));
create policy own_read on app.receipts for select to authenticated
  using (user_id = (select auth.uid()));

-- The queue: admin with aal2 (BUILD_PLAN §12.3); the service role works it through api RPCs.
create policy admin_read on ops.review_tasks for select to authenticated
  using (
    coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'plinth_roles') ? 'admin', false)
    and nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal' = 'aal2'
  );
-- core.check_rules: no policy at all (api-only, like the other public catalogue tables).

-- ---------------------------------------------------------------------------
-- Lockdown sweeps for the schemas this file touches (tables and functions only; never `api`,
-- AGENTS rule 12).
-- ---------------------------------------------------------------------------
revoke all on all tables in schema app from public, anon, authenticated;
revoke all on all sequences in schema app from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;
revoke all on table core.check_rules from public, anon, authenticated;
revoke all on table ops.review_tasks from public, anon, authenticated;
