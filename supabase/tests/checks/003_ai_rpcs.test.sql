-- T60 · The AI gateway's RPCs (T63 handoff, PR #90; BUILD_PLAN §11, §13; AGENTS rule 12).
-- api.ai_generation_log and api.ai_budget_status are executable by service_role only (granted by
-- name). The log writes one ops.ai_generations row per call; the budget counts today's live
-- calls and ₹ for the task, where "today" is the IST day of ops.now(): at 00:10 IST the count
-- starts again, though the UTC day has not turned. Caps come from ops.ai_task_budgets, null when
-- unset. Outputs expire after 12 months; the input hash stays.
begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

update ops.runtime_settings set value = 'test' where key = 'env';

-- Grants ---------------------------------------------------------------------------------------
select ok(not has_function_privilege('anon', 'api.ai_budget_status(text)', 'EXECUTE'), 'anon cannot execute api.ai_budget_status');
select ok(not has_function_privilege('authenticated', 'api.ai_budget_status(text)', 'EXECUTE'), 'authenticated cannot execute api.ai_budget_status');
select ok(has_function_privilege('service_role', 'api.ai_budget_status(text)', 'EXECUTE'), 'service_role executes api.ai_budget_status');
select ok(
  not has_function_privilege('anon', 'api.ai_generation_log(text, text, text, text, text, text, text, text, text, jsonb, integer, integer, numeric, integer, integer, text)', 'EXECUTE'),
  'anon cannot execute api.ai_generation_log'
);
select ok(
  not has_function_privilege('authenticated', 'api.ai_generation_log(text, text, text, text, text, text, text, text, text, jsonb, integer, integer, numeric, integer, integer, text)', 'EXECUTE'),
  'authenticated cannot execute api.ai_generation_log'
);
select ok(
  has_function_privilege('service_role', 'api.ai_generation_log(text, text, text, text, text, text, text, text, text, jsonb, integer, integer, numeric, integer, integer, text)', 'EXECUTE'),
  'service_role executes api.ai_generation_log'
);
select is(
  (
    select array_agg(g.who order by g.who)
    from (
      select case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end as who
      from pg_catalog.pg_proc p, aclexplode(p.proacl) a
      where p.oid in ('api.ai_budget_status(text)'::regprocedure,
                      'api.ai_generation_log(text, text, text, text, text, text, text, text, text, jsonb, integer, integer, numeric, integer, integer, text)'::regprocedure)
        and a.privilege_type = 'EXECUTE'
    ) as g
    where g.who in ('PUBLIC', 'anon', 'authenticated', 'service_role')
  ),
  array['service_role', 'service_role']::text[],
  'of PUBLIC, anon, authenticated and service_role, only service_role holds EXECUTE on either RPC'
);

set local role anon;
select throws_ok($$select api.ai_budget_status('extract.marketing_claims@1')$$, '42501', null, 'anon is refused api.ai_budget_status');
select throws_ok(
  $$select api.ai_generation_log('extract.marketing_claims@1', null, null, 'recorded', 'free', 'ok', null, null, null, null, null, null, 0, 1, 0, 't60-anon')$$,
  '42501', null, 'anon is refused api.ai_generation_log'
);
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"bff1ee72-9910-5980-a875-96a9a00b24cf","role":"authenticated","plinth_roles":["admin"],"aal":"aal2"}', true);
select throws_ok($$select api.ai_budget_status('extract.marketing_claims@1')$$, '42501', null, 'authenticated (even an admin) is refused api.ai_budget_status');
select throws_ok(
  $$select api.ai_generation_log('extract.marketing_claims@1', null, null, 'recorded', 'free', 'ok', null, null, null, null, null, null, 0, 1, 0, 't60-auth')$$,
  '42501', null, 'authenticated (even an admin) is refused api.ai_generation_log'
);
reset role;
select set_config('request.jwt.claims', '', true);

-- The log --------------------------------------------------------------------------------------
set local role service_role;
select set_config('t60.g1', api.ai_generation_log(
  'extract.marketing_claims@1', 'a@1', 'gemini-flash-test', 'live', 'free', 'ok', null,
  repeat('a', 64), repeat('b', 64), '{"claims": [{"seq": 1, "type": "price", "value": "[ACCOUNT_1]"}]}',
  1200, 300, 0.5, 850, 1, 't60-req-1'
)::text, true);
select throws_ok(
  $$select api.ai_generation_log('extract.marketing_claims@1', 'a@1', null, 'replay', 'free', 'ok', null, null, null, null, null, null, 0, 1, 0, null)$$,
  'PT422', 'invalid_input', 'mode is live or recorded'
);
select throws_ok(
  $$select api.ai_generation_log('extract.marketing_claims@1', 'a@1', null, 'live', 'gold', 'ok', null, null, null, null, null, null, 0, 1, 0, null)$$,
  'PT422', 'invalid_input', 'tier is free or paid'
);
select throws_ok(
  $$select api.ai_generation_log('extract.marketing_claims@1', null, null, 'live', 'free', 'refused', null, null, null, null, null, null, null, 1, 0, null)$$,
  'PT422', 'invalid_input', 'a refused call carries its error code'
);
select throws_ok(
  $$select api.ai_generation_log('extract.marketing_claims@1', null, null, 'live', 'free', 'ok', null, 'not-a-sha', null, null, null, null, null, 1, 1, null)$$,
  'PT422', 'invalid_input', 'SHA-256 values are 64 hex characters'
);
select throws_ok(
  $$select api.ai_generation_log('extract.marketing_claims@1', null, null, 'live', 'free', 'ok')$$,
  'PT422', 'invalid_input', 'model_calls is required'
);
select lives_ok(
  $$select api.ai_generation_log('no.such_task@9', null, null, 'live', 'free', 'refused', 'unknown_task', p_model_calls => 0, p_request_id => 't60-unknown')$$,
  'an unknown task is logged as asked (no foreign key on task); a caller may drop null fields'
);
reset role;

select results_eq(
  $$select task, prompt_version, model, mode, tier, status, error_code, input_sha256 = repeat('a', 64), source_sha256 = repeat('b', 64),
           output -> 'claims' -> 0 ->> 'value', tokens_in, tokens_out, cost_inr, latency_ms, model_calls::int, request_id,
           core.fmt_timestamp(created_at)
      from ops.ai_generations where id = current_setting('t60.g1')::uuid$$,
  $$values ('extract.marketing_claims@1'::text, 'a@1'::text, 'gemini-flash-test'::text, 'live'::text, 'free'::text, 'ok'::text, null::text,
            true, true, '[ACCOUNT_1]'::text, 1200, 300, 0.5::numeric, 850, 1, 't60-req-1'::text, '2026-10-18T12:00:00+05:30'::text)$$,
  'the log writes one row with every field, at ops.now()'
);
select results_eq(
  $$select status, error_code, model_calls::int, prompt_version from ops.ai_generations where request_id = 't60-unknown'$$,
  $$values ('refused'::text, 'unknown_task'::text, 0, null::text)$$,
  'a refusal before the prompt is known is logged with nulls'
);

-- The budget across the IST day boundary ------------------------------------------------------
delete from ops.ai_generations where task in ('extract.marketing_claims@1', 'classify.document@1');
set local role service_role;
select results_eq(
  $$select x ->> 'task', x ->> 'day', (x ->> 'calls_today')::int, (x ->> 'cost_inr_today')::numeric, x -> 'daily_call_cap', x -> 'budget_inr_per_day'
      from api.ai_budget_status('extract.marketing_claims@1') as x$$,
  $$values ('extract.marketing_claims@1'::text, '2026-10-18'::text, 0, 0::numeric, 'null'::jsonb, 'null'::jsonb)$$,
  'no calls yet: zero, and no caps set'
);

-- 23:50 IST on 18 Oct (18:20 UTC).
select set_config('plinth.fixed_now', '2026-10-18 23:50:00+05:30', true);
select api.ai_generation_log('extract.marketing_claims@1', 'a@1', 'm', 'live', 'free', 'ok', null, null, null, null, 10, 5, 0.5, 100, 1, 't60-b1');
select api.ai_generation_log('extract.marketing_claims@1', 'a@1', 'm', 'live', 'free', 'ok', null, null, null, null, 10, 5, 0.75, 100, 2, 't60-b2');
select api.ai_generation_log('extract.marketing_claims@1', 'a@1', 'm', 'recorded', 'free', 'ok', null, null, null, null, 10, 5, 0, 1, 0, 't60-b3');
select api.ai_generation_log('extract.marketing_claims@1', null, null, 'live', 'free', 'refused', 'budget_exhausted', null, null, null, null, null, null, 1, 0, 't60-b4');
select api.ai_generation_log('extract.marketing_claims@1', 'a@1', 'm', 'live', 'paid', 'ok', null, null, null, null, 10, 5, null, 100, 1, 't60-b5');
select api.ai_generation_log('classify.document@1', 'v1', 'm', 'live', 'free', 'ok', null, null, null, null, 10, 5, 9, 100, 1, 't60-b6');
select results_eq(
  $$select x ->> 'day', (x ->> 'calls_today')::int, (x ->> 'cost_inr_today')::numeric from api.ai_budget_status('extract.marketing_claims@1') as x$$,
  $$values ('2026-10-18'::text, 4, 1.25::numeric)$$,
  '23:50 IST: live model calls 1 + 2 + 1 (a refusal adds 0, recorded rows and other tasks never count); ₹0.50 + ₹0.75 (no price adds ₹0)'
);
select results_eq(
  $$select (x ->> 'calls_today')::int, (x ->> 'cost_inr_today')::numeric from api.ai_budget_status('classify.document@1') as x$$,
  $$values (1, 9::numeric)$$,
  'each task has its own count'
);

-- 00:10 IST on 19 Oct (still 18 Oct, 18:40 UTC): a new IST day.
select set_config('plinth.fixed_now', '2026-10-19 00:10:00+05:30', true);
select results_eq(
  $$select x ->> 'day', (x ->> 'calls_today')::int, (x ->> 'cost_inr_today')::numeric from api.ai_budget_status('extract.marketing_claims@1') as x$$,
  $$values ('2026-10-19'::text, 0, 0::numeric)$$,
  '00:10 IST: the count starts again on the IST day, although the UTC date is still 18 Oct'
);
select api.ai_generation_log('extract.marketing_claims@1', 'b@1', 'm', 'live', 'free', 'ok', null, null, null, null, 10, 5, 0.25, 100, 1, 't60-b7');
select results_eq(
  $$select (x ->> 'calls_today')::int, (x ->> 'cost_inr_today')::numeric from api.ai_budget_status('extract.marketing_claims@1') as x$$,
  $$values (1, 0.25::numeric)$$,
  '00:10 IST: one new live call counts today'
);

-- 05:40 IST on 19 Oct (00:10 UTC): the UTC date turns; the IST day does not.
select set_config('plinth.fixed_now', '2026-10-19 05:40:00+05:30', true);
select results_eq(
  $$select x ->> 'day', (x ->> 'calls_today')::int from api.ai_budget_status('extract.marketing_claims@1') as x$$,
  $$values ('2026-10-19'::text, 1)$$,
  '05:40 IST (UTC midnight has passed): still the same IST day, still 1 call'
);
-- 23:59:59 IST on 19 Oct, and 00:00 IST on 20 Oct.
select set_config('plinth.fixed_now', '2026-10-19 23:59:59+05:30', true);
select is((api.ai_budget_status('extract.marketing_claims@1') ->> 'calls_today')::int, 1, '23:59:59 IST: the last second of the day still counts it');
select set_config('plinth.fixed_now', '2026-10-20 00:00:00+05:30', true);
select is((api.ai_budget_status('extract.marketing_claims@1') ->> 'calls_today')::int, 0, '00:00 IST: midnight starts the next day');
reset role;

-- Caps ------------------------------------------------------------------------------------------
insert into ops.ai_task_budgets (task, daily_call_cap, budget_inr_per_day, note)
values ('extract.marketing_claims@1', 40, 25, 'T60 test cap');
set local role service_role;
select results_eq(
  $$select (x -> 'daily_call_cap')::int, (x -> 'budget_inr_per_day')::numeric from api.ai_budget_status('extract.marketing_claims@1') as x$$,
  $$values (40, 25::numeric)$$,
  'caps come from ops.ai_task_budgets'
);
select results_eq(
  $$select x -> 'daily_call_cap', x -> 'budget_inr_per_day' from api.ai_budget_status('classify.document@1') as x$$,
  $$values ('null'::jsonb, 'null'::jsonb)$$,
  'a task without a row has null caps (the catalogue''s apply)'
);
select throws_ok($$select api.ai_budget_status('')$$, 'PT422', 'invalid_input', 'the task key is required');
reset role;
select set_config('plinth.fixed_now', '', true);

-- Retention: output 12 months, input hash kept ---------------------------------------------------
insert into ops.ai_generations (id, task, mode, tier, status, model_calls, input_sha256, output, created_at) values
  ('00000000-0000-4000-8000-0000000060e1', 'extract.cost_sheet@1', 'live', 'free', 'ok', 1, repeat('c', 64), '{"lines": []}', '2025-09-01 10:00+05:30'),
  ('00000000-0000-4000-8000-0000000060e2', 'extract.cost_sheet@1', 'live', 'free', 'ok', 1, repeat('d', 64), '{"lines": []}', '2025-11-01 10:00+05:30');
select ok(ops.ai_generations_expire() >= 1, 'the retention job clears outputs older than 12 months');
select results_eq(
  $$select id, output is null, input_sha256 = repeat('c', 64) or input_sha256 = repeat('d', 64), output_expired_at is not null
      from ops.ai_generations where id in ('00000000-0000-4000-8000-0000000060e1', '00000000-0000-4000-8000-0000000060e2') order by id$$,
  $$values ('00000000-0000-4000-8000-0000000060e1'::uuid, true, true, true),
           ('00000000-0000-4000-8000-0000000060e2'::uuid, false, true, false)$$,
  '13 months old: output cleared, input hash kept; 11 months old: untouched'
);
select ok(
  not has_function_privilege('anon', 'ops.ai_generations_expire(integer)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'ops.ai_generations_expire(integer)', 'EXECUTE'),
  'the retention job is not executable by anon or authenticated'
);

select * from finish();
rollback;
