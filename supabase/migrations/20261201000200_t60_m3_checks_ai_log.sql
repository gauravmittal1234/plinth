-- T60 · M3 checks 2/4: the AI log, per-task budget caps, and the AI gateway's two RPCs.
-- Sources: DATA_MODEL §10 (ops.ai_generations: "Admin. 12-month retention"); BUILD_PLAN §11 (AI
-- budgets: alert at 80%, kill switch at 100%), §13 (AI generations: redacted output 12 months,
-- input hash kept), §14; FOUNDER_QUESTIONS M3-13 (AI calls capped per task per day);
-- T63's handoff (PR #90): the exact signatures below.
--
-- The gateway (supabase/functions/_shared/ai, T63):
--   * before every live call reads api.ai_budget_status(task) and applies the stricter of its
--     caps and the catalogue's (ai_tasks.json); no cap at all refuses the call (budget_unset);
--   * after every call (answered, refused or failed; live or recorded) writes exactly one
--     ops.ai_generations row through api.ai_generation_log, with the output already redacted.
--
-- Caps (the simplest store): ops.ai_task_budgets, one optional row per task key, written by an
-- admin (SQL editor or a later admin RPC). It is an operator override on top of the catalogue:
-- no row (the default) means both caps come back null and the catalogue's apply alone. Lowering
-- a cap here takes effect on the next call, without a deploy.
--
-- "Today" is the IST calendar day of ops.now() (frozen in tests), from 00:00 to 24:00 IST.
-- calls_today = sum(model_calls) and cost_inr_today = sum(cost_inr) over that day's rows for the
-- task with mode = 'live'; recorded replays cost nothing and never count.
--
-- Both RPCs are SECURITY DEFINER with search_path = '' and are executable by service_role only,
-- granted by name (AGENTS rule 12). The AI log holds no user id: the input is PII-stripped and
-- the output redacted before it gets here, so an account erasure has nothing to remove; outputs
-- are cleared after 12 months and the input hash is kept (ops.ai_generations_expire, daily).

-- ---------------------------------------------------------------------------
-- ops.ai_generations (DATA_MODEL §10, plus status, error_code, source_sha256, model_calls, tier).
-- ---------------------------------------------------------------------------
create table ops.ai_generations (
  id uuid primary key default gen_random_uuid(),
  task text not null check (pg_catalog.length(task) between 1 and 100),
  prompt_version text check (prompt_version is null or pg_catalog.length(prompt_version) between 1 and 40),
  model text check (model is null or pg_catalog.length(model) between 1 and 100),
  mode text not null check (mode in ('live', 'recorded')),
  tier text not null check (tier in ('free', 'paid')),
  status text not null check (status in ('ok', 'refused', 'error')),
  error_code text check (error_code is null or error_code ~ '^[a-z][a-z0-9_]{0,63}$'),
  input_sha256 text check (input_sha256 is null or input_sha256 ~ '^[0-9a-f]{64}$'),
  source_sha256 text check (source_sha256 is null or source_sha256 ~ '^[0-9a-f]{64}$'),
  output jsonb,
  tokens_in integer check (tokens_in is null or tokens_in >= 0),
  tokens_out integer check (tokens_out is null or tokens_out >= 0),
  cost_inr numeric(12, 4) check (cost_inr is null or cost_inr >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  model_calls smallint not null default 0 check (model_calls between 0 and 10),
  cited_fact_ids uuid[],
  refusal_code text check (refusal_code is null or refusal_code ~ '^[a-z][a-z0-9_]{0,63}$'),
  request_id text check (request_id is null or pg_catalog.length(request_id) between 1 and 200),
  output_expired_at timestamptz,
  created_at timestamptz not null default ops.now(),
  constraint ai_generations_failure_has_code check (status = 'ok' or error_code is not null)
);
create index ai_generations_task_created_idx on ops.ai_generations (task, created_at);
create index ai_generations_expiry_idx on ops.ai_generations (created_at) where output is not null;
comment on table ops.ai_generations is 'One row per AI gateway call (DATA_MODEL §10): answered, refused or failed, live or recorded. Output is redacted before it is written and cleared after 12 months (the input hash stays). No user id. Written through api.ai_generation_log (service role); admin (aal2) reads.';
comment on column ops.ai_generations.id is 'pii:C0';
comment on column ops.ai_generations.task is 'pii:C0 · The requested task key (extract.marketing_claims@1), even when it is not in the catalogue.';
comment on column ops.ai_generations.prompt_version is 'pii:C0 · a@1, b@1, v1 …; null on a refusal before it is known.';
comment on column ops.ai_generations.model is 'pii:C0 · The pinned model id; null when refused before one was chosen.';
comment on column ops.ai_generations.mode is 'pii:C0 · live | recorded. Only live rows count against the budget.';
comment on column ops.ai_generations.tier is 'pii:C0 · free | paid (AI_PROVIDER_TIER).';
comment on column ops.ai_generations.status is 'pii:C0 · ok | refused | error.';
comment on column ops.ai_generations.error_code is 'pii:C0 · The gateway''s code (budget_exhausted, tier_refused, schema_mismatch, …); required unless ok.';
comment on column ops.ai_generations.input_sha256 is 'pii:C1 · SHA-256 of the normalised, PII-stripped input (the recorded-response key). Kept after the output expires.';
comment on column ops.ai_generations.source_sha256 is 'pii:C1 · SHA-256 of the source file (the free tier allows only the fictional sample manifest).';
comment on column ops.ai_generations.output is 'pii:C2 · The model''s answer, redacted (no account numbers, phones or e-mails). Cleared after 12 months.';
comment on column ops.ai_generations.tokens_in is 'pii:C0';
comment on column ops.ai_generations.tokens_out is 'pii:C0';
comment on column ops.ai_generations.cost_inr is 'pii:C0 · ₹ cost; 0 for recorded, null on the paid tier without a price.';
comment on column ops.ai_generations.latency_ms is 'pii:C0';
comment on column ops.ai_generations.model_calls is 'pii:C0 · Provider calls made: 0 refused or recorded, 1, or 2 with the retry. The budget counts these.';
comment on column ops.ai_generations.cited_fact_ids is 'pii:C0 · Facts an answer cites (Ask Plinth, M5).';
comment on column ops.ai_generations.refusal_code is 'pii:C0 · Ask Plinth''s refusal code (M5).';
comment on column ops.ai_generations.request_id is 'pii:C0 · The edge request id, to join with logs.';
comment on column ops.ai_generations.output_expired_at is 'pii:C0 · When the 12-month retention cleared the output.';
comment on column ops.ai_generations.created_at is 'pii:C0';

alter table ops.ai_generations enable row level security;
create policy admin_read on ops.ai_generations for select to authenticated
  using (
    coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'plinth_roles') ? 'admin', false)
    and nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal' = 'aal2'
  );

-- ---------------------------------------------------------------------------
-- ops.ai_task_budgets: optional per-task caps (the operator override; see the header).
-- ---------------------------------------------------------------------------
create table ops.ai_task_budgets (
  task text primary key check (task ~ '^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*@[0-9]+$'),
  daily_call_cap integer check (daily_call_cap is null or daily_call_cap >= 0),
  budget_inr_per_day numeric(12, 2) check (budget_inr_per_day is null or budget_inr_per_day >= 0),
  note text check (note is null or pg_catalog.length(note) between 1 and 300),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
comment on table ops.ai_task_budgets is 'Optional daily caps per AI task key, read by api.ai_budget_status. The gateway applies the stricter of these and the catalogue''s (ai_tasks.json); no row means the catalogue alone. A cap of 0 stops the task. Admin writes; audited.';
comment on column ops.ai_task_budgets.task is 'pii:C0 · Task key, e.g. extract.marketing_claims@1.';
comment on column ops.ai_task_budgets.daily_call_cap is 'pii:C0 · Model calls per IST day (sum of model_calls); null = no cap here.';
comment on column ops.ai_task_budgets.budget_inr_per_day is 'pii:C0 · ₹ per IST day; null = no cap here.';
comment on column ops.ai_task_budgets.note is 'pii:C0 · Why (e.g. "free-tier limit, M3-13").';
comment on column ops.ai_task_budgets.updated_by is 'pii:C1';
comment on column ops.ai_task_budgets.updated_at is 'pii:C0';
comment on column ops.ai_task_budgets.created_at is 'pii:C0';

create trigger ai_task_budgets_touch
  before update on ops.ai_task_budgets
  for each row execute function ops.touch_updated_at();
create trigger ai_task_budgets_audit
  after insert or update or delete on ops.ai_task_budgets
  for each row execute function ops.audit_trigger();

alter table ops.ai_task_budgets enable row level security;
create policy admin_read on ops.ai_task_budgets for select to authenticated
  using (
    coalesce((nullif(current_setting('request.jwt.claims', true), '')::jsonb -> 'plinth_roles') ? 'admin', false)
    and nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal' = 'aal2'
  );

-- ---------------------------------------------------------------------------
-- api.ai_budget_status(p_task): today's live use and the caps (service role only).
-- ---------------------------------------------------------------------------
create function api.ai_budget_status(p_task text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_day date := ops.today();
  v_from timestamptz;
  v_to timestamptz;
  v_calls bigint;
  v_cost numeric;
  v_cap integer;
  v_budget numeric;
begin
  if p_task is null or pg_catalog.length(p_task) not between 1 and 100 then
    perform ops.raise_api_error('invalid_input', 'p_task is the task key, e.g. extract.marketing_claims@1.');
  end if;

  -- The IST day: 00:00 to 24:00 in Asia/Kolkata, as instants.
  v_from := v_day::timestamp at time zone 'Asia/Kolkata';
  v_to := (v_day + 1)::timestamp at time zone 'Asia/Kolkata';

  select coalesce(pg_catalog.sum(g.model_calls), 0), coalesce(pg_catalog.sum(g.cost_inr), 0)
  into v_calls, v_cost
  from ops.ai_generations g
  where g.task = p_task
    and g.mode = 'live'
    and g.created_at >= v_from
    and g.created_at < v_to;

  select b.daily_call_cap, b.budget_inr_per_day
  into v_cap, v_budget
  from ops.ai_task_budgets b
  where b.task = p_task;

  return pg_catalog.jsonb_build_object(
    'task', p_task,
    'day', pg_catalog.to_char(v_day, 'YYYY-MM-DD'),
    'calls_today', v_calls::integer,
    'cost_inr_today', v_cost,
    'daily_call_cap', v_cap,
    'budget_inr_per_day', v_budget
  );
end
$$;
comment on function api.ai_budget_status(text) is 'Service-only (AI gateway). {task, day (IST, YYYY-MM-DD), calls_today = sum(model_calls), cost_inr_today = sum(cost_inr) over today''s live rows for the task, daily_call_cap, budget_inr_per_day (null when ops.ai_task_budgets has no cap)}. Errors: invalid_input.';

-- ---------------------------------------------------------------------------
-- api.ai_generation_log(...): one row per gateway call (service role only).
-- Every parameter after p_task defaults to null, so a caller that drops a null field still
-- reaches this function; the required ones are checked below.
-- ---------------------------------------------------------------------------
create function api.ai_generation_log(
  p_task text,
  p_prompt_version text default null,
  p_model text default null,
  p_mode text default null,
  p_tier text default null,
  p_status text default null,
  p_error_code text default null,
  p_input_sha256 text default null,
  p_source_sha256 text default null,
  p_output jsonb default null,
  p_tokens_in integer default null,
  p_tokens_out integer default null,
  p_cost_inr numeric default null,
  p_latency_ms integer default null,
  p_model_calls integer default null,
  p_request_id text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_task is null or pg_catalog.length(p_task) not between 1 and 100 then
    perform ops.raise_api_error('invalid_input', 'p_task is the requested task key (1 to 100 characters).');
  end if;
  if p_mode is null or p_mode not in ('live', 'recorded') then
    perform ops.raise_api_error('invalid_input', 'p_mode is live or recorded.');
  end if;
  if p_tier is null or p_tier not in ('free', 'paid') then
    perform ops.raise_api_error('invalid_input', 'p_tier is free or paid.');
  end if;
  if p_status is null or p_status not in ('ok', 'refused', 'error') then
    perform ops.raise_api_error('invalid_input', 'p_status is ok, refused or error.');
  end if;
  if p_status <> 'ok' and p_error_code is null then
    perform ops.raise_api_error('invalid_input', 'A refused or failed call carries its error code.');
  end if;
  if p_error_code is not null and p_error_code !~ '^[a-z][a-z0-9_]{0,63}$' then
    perform ops.raise_api_error('invalid_input', 'p_error_code is a snake_case code.');
  end if;
  if (p_input_sha256 is not null and p_input_sha256 !~ '^[0-9a-f]{64}$')
     or (p_source_sha256 is not null and p_source_sha256 !~ '^[0-9a-f]{64}$') then
    perform ops.raise_api_error('invalid_input', 'SHA-256 values are 64 lower-case hex characters.');
  end if;
  if p_model_calls is null or p_model_calls not between 0 and 10 then
    perform ops.raise_api_error('invalid_input', 'p_model_calls is the number of provider calls made (0 to 10).');
  end if;
  if coalesce(p_tokens_in, 0) < 0 or coalesce(p_tokens_out, 0) < 0 or coalesce(p_latency_ms, 0) < 0
     or coalesce(p_cost_inr, 0) < 0 then
    perform ops.raise_api_error('invalid_input', 'Tokens, latency and cost are never negative.');
  end if;
  if p_output is not null and pg_catalog.octet_length(p_output::text) > 262144 then
    perform ops.raise_api_error('invalid_input', 'The logged output is at most 256 KB.');
  end if;
  if (p_prompt_version is not null and pg_catalog.length(p_prompt_version) not between 1 and 40)
     or (p_model is not null and pg_catalog.length(p_model) not between 1 and 100)
     or (p_request_id is not null and pg_catalog.length(p_request_id) not between 1 and 200) then
    perform ops.raise_api_error('invalid_input', 'prompt_version, model or request_id is too long.');
  end if;

  insert into ops.ai_generations (
    task, prompt_version, model, mode, tier, status, error_code, input_sha256, source_sha256, output,
    tokens_in, tokens_out, cost_inr, latency_ms, model_calls, request_id
  )
  values (
    p_task, p_prompt_version, p_model, p_mode, p_tier, p_status, p_error_code, p_input_sha256, p_source_sha256,
    p_output, p_tokens_in, p_tokens_out, p_cost_inr, p_latency_ms, p_model_calls::smallint, p_request_id
  )
  returning id into v_id;

  return v_id;
end
$$;
comment on function api.ai_generation_log(text, text, text, text, text, text, text, text, text, jsonb, integer, integer, numeric, integer, integer, text) is 'Service-only (AI gateway). Writes one ops.ai_generations row (output already redacted) and returns its id. mode live | recorded; tier free | paid; status ok | refused | error (error_code required unless ok); model_calls 0–10. Errors: invalid_input.';

-- ---------------------------------------------------------------------------
-- Retention (BUILD_PLAN §13): redacted output 12 months, input hash kept. Daily, pg_cron.
-- ---------------------------------------------------------------------------
create function ops.ai_generations_expire(p_limit integer default 10000)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := ops.now();
  v_n integer;
begin
  if p_limit is null or p_limit < 1 or p_limit > 100000 then
    raise exception using errcode = '22023', message = 'ops.ai_generations_expire: p_limit must be between 1 and 100000';
  end if;
  with due as (
    select g.id
    from ops.ai_generations g
    where g.output is not null
      and g.created_at < v_now - interval '12 months'
    order by g.created_at, g.id
    limit p_limit
  )
  update ops.ai_generations g
     set output = null, output_expired_at = v_now
    from due
   where g.id = due.id;
  get diagnostics v_n = row_count;
  return v_n;
end
$$;
comment on function ops.ai_generations_expire(integer) is 'Clears the output of AI log rows older than 12 months (the row, its input hash and its counts stay). Returns the count. pg_cron daily (ai-generations-retention).';

do $$
begin
  if pg_catalog.to_regnamespace('cron') is not null then
    -- 21:40 UTC = 03:10 IST (pg_cron runs in UTC).
    execute $sql$select cron.schedule('ai-generations-retention', '40 21 * * *', $c$select ops.ai_generations_expire()$c$)$sql$;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Grants: by name (AGENTS rule 12). The gateway's RPCs: service_role only.
-- ---------------------------------------------------------------------------
revoke all on function api.ai_budget_status(text) from public, anon, authenticated;
revoke all on function api.ai_generation_log(text, text, text, text, text, text, text, text, text, jsonb, integer, integer, numeric, integer, integer, text)
  from public, anon, authenticated;
grant execute on function api.ai_budget_status(text) to service_role;
grant execute on function api.ai_generation_log(text, text, text, text, text, text, text, text, text, jsonb, integer, integer, numeric, integer, integer, text)
  to service_role;

revoke all on table ops.ai_generations, ops.ai_task_budgets from public, anon, authenticated;
revoke all on function ops.ai_generations_expire(integer) from public, anon, authenticated;
