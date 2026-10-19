-- T04 · DB core 2/7: domains, the clock, refs, formatters, roles from claims,
-- audit and immutability triggers, and the three M0 ops tables.
-- Sources: DATA_MODEL §0 (enums, refs), §10 (ops.audit_log, ops.ref_counters,
-- ops.feature_flags), §12 inv. 3; BUILD_PLAN §9 (clock), §12 (2, 3, 6); API_CONTRACTS §1 (errors).
-- Every function pins `search_path = ''` and qualifies every name (BUILD_PLAN §12.2).

-- ---------------------------------------------------------------------------
-- Domains (DATA_MODEL §0): text + CHECK, easier to extend than enums.
-- ---------------------------------------------------------------------------
create domain core.band as text
  check (value in ('low', 'moderate', 'elevated', 'high', 'severe'));
create domain core.lane as text
  check (value in ('records_show', 'developer_says', 'from_developer', 'our_estimate', 'reported_unverified', 'buyer_upload'));
create domain core.factor as text
  check (value in ('finances', 'track_record', 'timeline', 'legal', 'site'));
create domain core.score_state as text
  check (value in ('scored', 'limited_history', 'not_scored'));
create domain app.verdict as text
  check (value in ('matches', 'differs', 'not_in_records', 'cant_check'));

comment on domain core.band is 'Delivery-risk band, low → severe (steps 1–5).';
comment on domain core.lane is 'Whose voice a fact is in. Clients style by lane (DESIGN §0 tone fields).';
comment on domain core.factor is 'Scorecard factor; published weights 30/30/20/15/5 (finances, track_record, timeline, legal, site).';
comment on domain core.score_state is 'scored · limited_history (< 3 finished projects) · not_scored (< 6 months registered).';
comment on domain app.verdict is 'Claims-vs-records verdict, set by rules, never by AI.';

-- ---------------------------------------------------------------------------
-- The clock (BUILD_PLAN §9). All business-date logic calls ops.now().
-- It honours plinth.fixed_now only when plinth.env is test or fixture; with
-- no fixed_now set it freezes at the design "today", 18 Oct 2026 12:00 IST.
-- In any other env (or none) it is pg_catalog.now().
-- ---------------------------------------------------------------------------
create function ops.now()
returns timestamptz
language sql
stable
parallel safe
set search_path = ''
as $$
  select case
    when coalesce(pg_catalog.current_setting('plinth.env', true), '') in ('test', 'fixture')
      then coalesce(
        nullif(pg_catalog.current_setting('plinth.fixed_now', true), '')::timestamptz,
        timestamptz '2026-10-18 12:00:00+05:30'
      )
    else pg_catalog.now()
  end
$$;
comment on function ops.now() is 'Business clock. Frozen (plinth.fixed_now, default 2026-10-18 12:00 IST) only when plinth.env ∈ {test, fixture}.';

create function ops.ist_date(p_at timestamptz)
returns date
language sql
immutable
strict
parallel safe
set search_path = ''
as $$
  select (p_at at time zone 'Asia/Kolkata')::date
$$;
comment on function ops.ist_date(timestamptz) is 'The calendar date in India (IST) of a timestamp.';

create function ops.today()
returns date
language sql
stable
parallel safe
set search_path = ''
as $$
  select ops.ist_date(ops.now())
$$;
comment on function ops.today() is 'Today in IST, from ops.now().';

-- ---------------------------------------------------------------------------
-- Contract errors (API_CONTRACTS §1): SQLSTATE PT<http>, message = domain code,
-- detail = a human sentence. PostgREST maps PTxyz to HTTP xyz.
-- ---------------------------------------------------------------------------
create function ops.raise_api_error(p_code text, p_details text default null)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  v_http text := case p_code
    when 'not_found' then '404'
    when 'not_in_coverage' then '404'
    when 'invalid_input' then '422'
    when 'auth_required' then '401'
    when 'forbidden' then '403'
    when 'consent_required' then '409'
    when 'cap_reached' then '409'
    when 'conflict' then '409'
    when 'rate_limited' then '429'
    when 'flag_off' then '503'
    else '500'
  end;
begin
  raise exception using
    errcode = 'PT' || v_http,
    message = coalesce(p_code, 'internal'),
    detail = coalesce(p_details, '');
end
$$;
comment on function ops.raise_api_error(text, text) is 'Raise a contract error: SQLSTATE PT<http>, message = code (not_found, invalid_input, forbidden, …), detail = house-copy sentence.';

-- ---------------------------------------------------------------------------
-- Roles from JWT claims (BUILD_PLAN §12.3). The access-token hook (T41) adds
-- plinth_roles[] and org_roles {org_id: role}. `admin` also needs aal2 (TOTP).
-- These run inside SECURITY DEFINER api functions. RLS policies inline the same
-- expression instead, because anon/authenticated have no USAGE on `ops`.
-- ---------------------------------------------------------------------------
create function ops.claims()
returns jsonb
language sql
stable
parallel safe
set search_path = ''
as $$
  select coalesce(nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;
comment on function ops.claims() is 'The caller''s JWT claims (request.jwt.claims), or {} when there are none.';

create function ops.has_role(p_role text)
returns boolean
language sql
stable
parallel safe
set search_path = ''
as $$
  select coalesce(
    pg_catalog.jsonb_typeof(ops.claims() -> 'plinth_roles') = 'array'
      and (ops.claims() -> 'plinth_roles') ? p_role
      and (p_role <> 'admin' or ops.claims() ->> 'aal' = 'aal2'),
    false
  )
$$;
comment on function ops.has_role(text) is 'True when plinth_roles in the JWT contains the role. admin additionally requires aal = aal2.';

create function ops.has_any_role(p_roles text[])
returns boolean
language sql
stable
parallel safe
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.unnest(p_roles) as r(role) where ops.has_role(r.role))
$$;
comment on function ops.has_any_role(text[]) is 'True when the caller has at least one of the roles (ops.has_role rules).';

-- ---------------------------------------------------------------------------
-- Formatters (DESIGN §2.7, API_CONTRACTS §1 "Money"): ₹ in lakh/crore with
-- Indian digit grouping; dates as "18 Oct 2026"; months as "Dec 2027";
-- quarters as "Apr–Jun 2026" (en dash). Vectors: DESIGN §5b and
-- packages/fixtures/vectors (T03).
-- ---------------------------------------------------------------------------
create function ops.fmt_inr_exact(p_inr bigint)
returns text
language plpgsql
immutable
strict
parallel safe
set search_path = ''
as $$
declare
  v_digits text := pg_catalog.abs(p_inr)::text;
  v_head text;
  v_out text;
begin
  if pg_catalog.length(v_digits) <= 3 then
    v_out := v_digits;
  else
    v_out := pg_catalog.right(v_digits, 3);
    v_head := pg_catalog.left(v_digits, pg_catalog.length(v_digits) - 3);
    while pg_catalog.length(v_head) > 2 loop
      v_out := pg_catalog.right(v_head, 2) || ',' || v_out;
      v_head := pg_catalog.left(v_head, pg_catalog.length(v_head) - 2);
    end loop;
    v_out := v_head || ',' || v_out;
  end if;
  return case when p_inr < 0 then '-' else '' end || '₹' || v_out;
end
$$;
comment on function ops.fmt_inr_exact(bigint) is 'Whole rupees with Indian grouping: 16720000 → ₹1,67,20,000; 118077 → ₹1,18,077.';

create function ops.fmt_inr_short(p_inr bigint)
returns text
language plpgsql
stable
strict
parallel safe
set search_path = ''
as $$
declare
  v_abs numeric := pg_catalog.abs(p_inr::numeric);
  v_sign text := case when p_inr < 0 then '-' else '' end;
  v_lakh numeric;
begin
  if v_abs < 100000 then
    return v_sign || ops.fmt_inr_exact(pg_catalog.abs(p_inr));
  end if;
  v_lakh := pg_catalog.round(v_abs / 100000, 1);
  if v_lakh < 100 then
    return v_sign || '₹' || pg_catalog.to_char(v_lakh, 'FM990.0') || ' L';
  end if;
  return v_sign || '₹' || pg_catalog.to_char(pg_catalog.round(v_abs / 10000000, 2), 'FM999,999,990.00') || ' Cr';
end
$$;
comment on function ops.fmt_inr_short(bigint) is 'Short rupees: ≥ 1 Cr → ₹2.74 Cr (2 dp); ≥ 1 L → ₹24.4 L (1 dp); below → exact. Half-up rounding; 99.95 L rounds to ₹1.00 Cr.';

create function ops.fmt_date(p_date date)
returns text
language sql
stable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.to_char(p_date, 'FMDD Mon YYYY')
$$;
comment on function ops.fmt_date(date) is 'A day: 2026-10-18 → 18 Oct 2026; 2026-10-02 → 2 Oct 2026.';

create function ops.fmt_month(p_date date)
returns text
language sql
stable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.to_char(p_date, 'Mon YYYY')
$$;
comment on function ops.fmt_month(date) is 'A month-precision date: 2027-12-01 → Dec 2027.';

create function ops.fmt_date_precision(p_date date, p_precision text)
returns text
language sql
stable
parallel safe
set search_path = ''
as $$
  select case when p_precision = 'month' then ops.fmt_month(p_date) else ops.fmt_date(p_date) end
$$;
comment on function ops.fmt_date_precision(date, text) is 'Formats a date column with its *_precision column (day → 18 Oct 2026, month → Dec 2027).';

create function ops.quarter_of(p_date date)
returns text
language sql
stable
strict
parallel safe
set search_path = ''
as $$
  select pg_catalog.to_char(p_date, 'YYYY') || '-Q' || pg_catalog.to_char(p_date, 'Q')
$$;
comment on function ops.quarter_of(date) is 'Calendar quarter key of a date: 2026-05-10 → 2026-Q2.';

create function ops.fmt_quarter(p_quarter text)
returns text
language plpgsql
immutable
strict
parallel safe
set search_path = ''
as $$
declare
  v_parts text[] := pg_catalog.regexp_match(p_quarter, '^(\d{4})-Q([1-4])$');
begin
  if v_parts is null then
    raise exception using
      errcode = '22023',
      message = pg_catalog.format('ops.fmt_quarter: %L is not a quarter key like 2026-Q2', p_quarter);
  end if;
  return (array['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'])[v_parts[2]::int] || ' ' || v_parts[1];
end
$$;
comment on function ops.fmt_quarter(text) is 'Calendar quarter label: 2026-Q2 → Apr–Jun 2026 (en dash).';

-- ---------------------------------------------------------------------------
-- ops.ref_counters + ops.next_ref (DATA_MODEL §0 refs; BUILD_PLAN D-4, E-3).
-- ---------------------------------------------------------------------------
create table ops.ref_counters (
  prefix text not null check (prefix ~ '^[A-Z]{1,3}$'),
  scope_date date not null,
  last integer not null default 0 check (last >= 0),
  primary key (prefix, scope_date)
);
comment on table ops.ref_counters is 'One counter per prefix and IST day (C-, R-) or one running counter per prefix (scope_date 1970-01-01). Written only by ops.next_ref(); the T03b seed bumps it past seeded refs.';

create function ops.next_ref(p_prefix text)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_today date := ops.today();
  v_daily boolean;
  v_width integer;
  v_scope date;
  v_n integer;
begin
  case p_prefix
    when 'C', 'R' then v_daily := true; v_width := 2;
    when 'CL', 'D', 'EV', 'LN' then v_daily := false; v_width := 3;
    when 'E', 'G' then v_daily := false; v_width := 4;
    else
      perform ops.raise_api_error('invalid_input', pg_catalog.format('Unknown reference prefix %L.', p_prefix));
  end case;

  v_scope := case when v_daily then v_today else date '1970-01-01' end;

  insert into ops.ref_counters as c (prefix, scope_date, last)
  values (p_prefix, v_scope, 1)
  on conflict (prefix, scope_date) do update set last = c.last + 1
  returning c.last into v_n;

  return p_prefix
    || case when v_daily then '-' || pg_catalog.to_char(v_today, 'MMDD') else '' end
    || '-' || pg_catalog.lpad(v_n::text, greatest(v_width, pg_catalog.length(v_n::text)), '0');
end
$$;
comment on function ops.next_ref(text) is 'Next human ref. C/R: <P>-MMDD-NN per IST day (NN widens past 99: C-1018-100). CL/D/EV/LN: <P>-nnn; E/G: <P>-nnnn (running). Store ops.ref_year() alongside.';

create function ops.ref_year()
returns integer
language sql
stable
set search_path = ''
as $$
  select pg_catalog.date_part('year', ops.today())::integer
$$;
comment on function ops.ref_year() is 'The IST year stored next to a ref, since C-MMDD-NN carries no year (unique on (ref_year, ref)).';

-- ---------------------------------------------------------------------------
-- ops.audit_log (DATA_MODEL §10): insert-only, ≥ 2 years.
-- ---------------------------------------------------------------------------
create table ops.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_user_id uuid,
  actor_role text,
  request_id text,
  action text not null,
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  reason text
);
create index audit_log_entity_idx on ops.audit_log (entity, entity_id);
create index audit_log_at_idx on ops.audit_log (at);
comment on table ops.audit_log is 'Append-only audit trail (triggers block UPDATE, DELETE and TRUNCATE). Written by ops.audit_trigger() and ops.audit(); admin reads.';
comment on column ops.audit_log.actor_user_id is 'pii:C1';
comment on column ops.audit_log.actor_role is 'pii:C0';
comment on column ops.audit_log.request_id is 'pii:C0';
comment on column ops.audit_log.before is 'pii:C2 (row images may carry account data)';
comment on column ops.audit_log.after is 'pii:C2 (row images may carry account data)';
comment on column ops.audit_log.reason is 'pii:C1';

-- Who is acting: JWT sub and roles when called through PostgREST, else the DB role.
create function ops.actor_role()
returns text
language sql
stable
set search_path = ''
as $$
  select coalesce(
    case
      when pg_catalog.jsonb_typeof(ops.claims() -> 'plinth_roles') = 'array'
        and pg_catalog.jsonb_array_length(ops.claims() -> 'plinth_roles') > 0
      then (
        select pg_catalog.string_agg(r.value, ',' order by r.value)
        from pg_catalog.jsonb_array_elements_text(ops.claims() -> 'plinth_roles') as r(value)
      )
    end,
    nullif(ops.claims() ->> 'role', ''),
    nullif(pg_catalog.current_setting('role', true), 'none'),
    session_user::text
  )
$$;
comment on function ops.actor_role() is 'plinth_roles (comma-joined), else the JWT role, else the SET ROLE, else the session user.';

create function ops.audit(
  p_action text,
  p_entity text,
  p_entity_id text,
  p_before jsonb default null,
  p_after jsonb default null,
  p_reason text default null
)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into ops.audit_log (actor_user_id, actor_role, request_id, action, entity, entity_id, before, after, reason)
  values (
    nullif(ops.claims() ->> 'sub', '')::uuid,
    ops.actor_role(),
    nullif(pg_catalog.current_setting('plinth.request_id', true), ''),
    p_action,
    p_entity,
    p_entity_id,
    p_before,
    p_after,
    coalesce(p_reason, nullif(pg_catalog.current_setting('plinth.audit_reason', true), ''))
  )
$$;
comment on function ops.audit(text, text, text, jsonb, jsonb, text) is 'Write one audit row from an RPC, in the same transaction (BUILD_PLAN §12.2).';

create function ops.audit_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_row jsonb;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    v_before := pg_catalog.to_jsonb(old);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    v_after := pg_catalog.to_jsonb(new);
  end if;
  v_row := coalesce(v_after, v_before);
  perform ops.audit(
    pg_catalog.lower(tg_op),
    tg_table_schema || '.' || tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'key', v_row ->> 'code', v_row ->> 'version'),
    v_before,
    v_after,
    null
  );
  return null;
end
$$;
comment on function ops.audit_trigger() is 'AFTER row trigger: logs INSERT/UPDATE/DELETE with before/after images, actor, request id (plinth.request_id) and reason (plinth.audit_reason).';

-- ---------------------------------------------------------------------------
-- Immutability (DATA_MODEL §12 inv. 3; BUILD_PLAN §12.6). SQLSTATE PT409.
-- ---------------------------------------------------------------------------
create function ops.forbid_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception using
    errcode = 'PT409',
    message = pg_catalog.format('%I.%I is append-only: %s is not allowed', tg_table_schema, tg_table_name, tg_op),
    hint = 'Insert a new row (supersede) instead of changing history.';
end
$$;
comment on function ops.forbid_mutation() is 'BEFORE UPDATE/DELETE (row) and BEFORE TRUNCATE (statement) trigger for append-only tables.';

-- Facts are bitemporal: the only allowed change is linking an old fact to the
-- fact that supersedes it (superseded_by null → id, optionally closing valid_to).
create function ops.facts_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and old.superseded_by is null
    and new.superseded_by is not null
    and new.superseded_by <> old.id
    and (old.valid_to is null or new.valid_to is not distinct from old.valid_to)
    and (pg_catalog.to_jsonb(new) - 'superseded_by' - 'valid_to') = (pg_catalog.to_jsonb(old) - 'superseded_by' - 'valid_to')
  then
    return new;
  end if;
  raise exception using
    errcode = 'PT409',
    message = pg_catalog.format('core.facts is append-only: %s is not allowed (only superseded_by null → id and valid_to may be set, once)', tg_op),
    hint = 'Insert a new fact and point the old one at it.';
end
$$;
comment on function ops.facts_guard() is 'core.facts: blocks DELETE and every UPDATE except the one-time supersede link.';

-- Score runs move only along draft → pending_notice → published → superseded
-- (or withdrawn). Nothing else on a run ever changes after insert.
create function ops.score_runs_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ok boolean;
begin
  if tg_op = 'UPDATE' then
    v_ok := (old.status, new.status) in (
        ('draft', 'pending_notice'), ('draft', 'published'), ('draft', 'withdrawn'), ('draft', 'superseded'),
        ('pending_notice', 'published'), ('pending_notice', 'withdrawn'), ('pending_notice', 'superseded'),
        ('published', 'superseded'), ('published', 'withdrawn')
      )
      and (pg_catalog.to_jsonb(new) - 'status' - 'published_at' - 'notice_id')
        = (pg_catalog.to_jsonb(old) - 'status' - 'published_at' - 'notice_id')
      and (new.published_at is not distinct from old.published_at or (old.published_at is null and new.status = 'published'))
      and (new.notice_id is not distinct from old.notice_id or (old.notice_id is null and new.status in ('pending_notice', 'published')));
    if v_ok then
      return new;
    end if;
  end if;
  raise exception using
    errcode = 'PT409',
    message = pg_catalog.format('core.score_runs: %s is not allowed (%s)', tg_op,
      case when tg_op = 'UPDATE' then old.status || ' → ' || new.status || ' or a frozen column changed' else 'runs are never deleted' end),
    hint = 'Allowed: draft → pending_notice → published → superseded, or → withdrawn. Insert a new run for new numbers.';
end
$$;
comment on function ops.score_runs_guard() is 'core.score_runs: only status transitions (plus published_at / notice_id when they happen); no deletes.';

-- Reasons are frozen once their run leaves draft.
create function ops.score_reasons_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from core.score_runs r where r.id = old.run_id and r.status = 'draft') then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  raise exception using
    errcode = 'PT409',
    message = pg_catalog.format('core.score_reasons: %s is not allowed once the run has left draft', tg_op);
end
$$;
comment on function ops.score_reasons_guard() is 'core.score_reasons: editable only while the run is a draft.';

create trigger audit_log_append_only
  before update or delete on ops.audit_log
  for each row execute function ops.forbid_mutation();
create trigger audit_log_no_truncate
  before truncate on ops.audit_log
  for each statement execute function ops.forbid_mutation();

-- ---------------------------------------------------------------------------
-- ops.feature_flags (DATA_MODEL §10; BUILD_PLAN §10). Rows are seeded in the
-- api.flags() migration. Adding a flag = a catalogue entry
-- (packages/contracts/catalogues/flags.json) + a migration row.
-- ---------------------------------------------------------------------------
create table ops.feature_flags (
  key text primary key check (key ~ '^[a-z][a-z0-9_]*$'),
  enabled boolean not null default false,
  rollout_pct smallint not null default 100 check (rollout_pct between 0 and 100),
  audience text not null default 'anon' check (audience in ('anon', 'user', 'internal')),
  surfaces text[] not null default '{}'::text[],
  note text,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
comment on table ops.feature_flags is 'Runtime flags. Admin writes (admin_flag_set, T54); clients read api.flags(); server code reads ops.flag(key). Data states (facts-only, stale) are not flags.';
comment on column ops.feature_flags.audience is 'anon = everyone; user = signed-in buyers and up; internal = staff roles and service_role.';
comment on column ops.feature_flags.updated_by is 'pii:C1';

create function ops.flag(p_key text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select f.enabled from ops.feature_flags f where f.key = p_key), false)
$$;
comment on function ops.flag(text) is 'Server-side switch: the flag''s global enabled value (no audience or rollout). Unknown keys are off.';

create function ops.flag_in_rollout(p_key text, p_rollout_pct smallint)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when p_rollout_pct >= 100 then true
    when p_rollout_pct <= 0 then false
    when nullif(ops.claims() ->> 'sub', '') is null then false
    else pg_catalog.abs(pg_catalog.hashtext((ops.claims() ->> 'sub') || ':' || p_key)) % 100 < p_rollout_pct
  end
$$;
comment on function ops.flag_in_rollout(text, smallint) is 'Stable per-user bucket for partial rollouts; anonymous callers only see 100% flags.';

create function ops.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end
$$;
comment on function ops.touch_updated_at() is 'BEFORE UPDATE trigger: sets updated_at.';

create trigger feature_flags_touch
  before update on ops.feature_flags
  for each row execute function ops.touch_updated_at();
