-- T13 · API reads B 4/7: core.all_in(), the cost breakdown and core.afford_the_wait().
-- Sources: API_CONTRACTS §4.13 (CostBreakdown, AffordTheWait); DATA_MODEL §1
-- (core.cost_rule_sets), §4 (cost sheets, payment plans); BUILD_PLAN D-6 (round the all-in to
-- the lakh before loan arithmetic); packages/fixtures/vectors/{cost,afford_the_wait}.json;
-- INTEGRATION_NOTES (T12 → T13: re-create core.risk_price once ws.cost_sheets exists).
--
-- Rules decide every number here; no AI and no client arithmetic (AGENTS §7). The M1 project
-- page shows them at the defaults (static); api.cost_breakdown and api.afford_the_wait (M3)
-- will call the same functions with the buyer's inputs.

-- ---------------------------------------------------------------------------
-- Cost rules and cost sheets
-- ---------------------------------------------------------------------------
create function core.rules_state(p_authority text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when coalesce(p_authority, 'harera_ggm') like 'harera%' then 'HR'
    when p_authority like 'uprera%' then 'UP'
    else pg_catalog.upper(pg_catalog.split_part(p_authority, '_', 1))
  end
$$;
comment on function core.rules_state(text) is 'The state whose cost rules apply to a registration authority: harera_ggm → HR.';

create function core.cost_rules_for(p_state text, p_on date)
returns core.cost_rule_sets
language sql
stable
set search_path = ''
as $$
  select r.*
  from core.cost_rule_sets r
  where r.state = p_state
    and (r.effective_from is null or r.effective_from <= coalesce(p_on, ops.today()))
  order by r.effective_from desc nulls last, r.version desc
  limit 1
$$;
comment on function core.cost_rules_for(text, date) is 'The cost rule set in force in a state on a day (the latest effective one).';

create function core.cost_sheet_for(p_phase_id uuid, p_unit text)
returns ws.cost_sheets
language sql
stable
set search_path = ''
as $$
  select s.*
  from ws.cost_sheets s
  join core.unit_types u on u.id = s.unit_type_id
  where s.phase_id = p_phase_id
    and u.label = p_unit
    and s.status = 'published'
    and s.dated <= ops.today()
  order by s.dated desc, s.created_at desc
  limit 1
$$;
comment on function core.cost_sheet_for(uuid, text) is 'The latest published cost sheet for a phase and unit type, dated today or earlier.';

-- The arithmetic of one cost sheet (vectors/cost.json): base + charges as the developer gives
-- them (waived codes left out), then GST and stamp duty + registration from the rules.
create function core.cost_compute(p_sheet_id uuid, p_buyer text default 'male', p_waive text[] default '{}'::text[])
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_sheet ws.cost_sheets%rowtype;
  v_rules core.cost_rule_sets%rowtype;
  v_base bigint;
  v_base_plus bigint;
  v_negotiable bigint;
  v_negotiable_names text[];
  v_gst bigint;
  v_stamp bigint;
  v_all_in bigint;
  v_stamp_pct numeric;
  v_round integer;
  v_lines jsonb;
  v_waive text[] := coalesce(p_waive, '{}'::text[]);
begin
  select * into v_sheet from ws.cost_sheets s where s.id = p_sheet_id;
  if not found then
    return null;
  end if;
  select * into v_rules from core.cost_rules_for(
    core.rules_state((select r.authority from core.phase_registration(v_sheet.phase_id) r)), v_sheet.dated);
  if v_rules.id is null then
    return null;
  end if;

  v_stamp_pct := coalesce((v_rules.stamp_duty_pct ->> coalesce(p_buyer, 'male'))::numeric,
                          (v_rules.stamp_duty_pct ->> 'male')::numeric);
  v_round := coalesce((v_rules.rounding ->> 'all_in_per_sqft_carpet_inr')::integer, 100);

  select
    coalesce(pg_catalog.sum(l.amount_inr) filter (where l.code = 'base'), 0),
    coalesce(pg_catalog.sum(l.amount_inr), 0),
    coalesce(pg_catalog.sum(l.amount_inr) filter (where l.tag = 'often_negotiable'), 0),
    pg_catalog.array_agg(
      case when core.first_word(l.label) = pg_catalog.upper(core.first_word(l.label))
        then core.first_word(l.label) else pg_catalog.lower(core.first_word(l.label)) end
      order by l.seq) filter (where l.tag = 'often_negotiable'),
    pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'code', l.code, 'label', l.label, 'amount_inr', l.amount_inr,
      'amount_label', ops.fmt_inr_short(l.amount_inr), 'tag', l.tag) order by l.seq)
  into v_base, v_base_plus, v_negotiable, v_negotiable_names, v_lines
  from ws.cost_sheet_lines l
  where l.cost_sheet_id = p_sheet_id
    and l.code not in ('gst', 'stamp_registration')
    and (l.code = 'base' or not (l.code = any (v_waive)));

  v_gst := pg_catalog.round(v_base_plus * v_rules.gst_uc_pct / 100);
  v_stamp := pg_catalog.round(v_base_plus * v_stamp_pct / 100) + v_rules.registration_fee_inr;
  v_all_in := v_base_plus + v_gst + v_stamp;

  v_lines := coalesce(v_lines, '[]'::jsonb) || pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object('code', 'gst', 'label', 'GST ' || core.fmt_num(v_rules.gst_uc_pct) || '%',
      'amount_inr', v_gst, 'amount_label', ops.fmt_inr_short(v_gst), 'tag', 'set_by_law'),
    pg_catalog.jsonb_build_object('code', 'stamp_registration', 'label', 'Stamp duty + registration',
      'amount_inr', v_stamp, 'amount_label', ops.fmt_inr_short(v_stamp), 'tag', 'set_by_law'));

  return pg_catalog.jsonb_build_object(
    'sheet_id', v_sheet.id,
    'phase_id', v_sheet.phase_id,
    'dated', v_sheet.dated,
    'option', v_sheet.unit_label,
    'carpet_sqft', v_sheet.carpet_sqft,
    'super_sqft', v_sheet.super_sqft,
    'edc_idc_line', v_sheet.edc_idc_line,
    'rules_version', v_rules.version,
    'afford_round_inr', coalesce((v_rules.rounding ->> 'afford_all_in_inr')::bigint, 100000),
    'base_inr', v_base,
    'base_plus_inr', v_base_plus,
    'charges_total_inr', v_base_plus - v_base,
    'gst_inr', v_gst,
    'stamp_registration_inr', v_stamp,
    'all_in_inr', v_all_in,
    'per_sqft_carpet_inr', case when v_sheet.carpet_sqft > 0
      then (pg_catalog.round(v_all_in / v_sheet.carpet_sqft / v_round) * v_round)::bigint end,
    'negotiable_inr', v_negotiable,
    'negotiable_names', pg_catalog.to_jsonb(coalesce(v_negotiable_names, '{}'::text[])),
    'lines', v_lines
  );
end
$$;
comment on function core.cost_compute(uuid, text, text[]) is 'One cost sheet''s arithmetic under the rules in force on its date: base + charges (waived codes out), GST and stamp duty + registration recomputed, all-in, ₹ per sq ft carpet, the often-negotiable total (vectors/cost.json).';

create function core.all_in(
  p_phase_id uuid,
  p_unit text default '3 BHK',
  p_buyer text default 'male',
  p_waive text[] default '{}'::text[]
)
returns bigint
language sql
stable
set search_path = ''
as $$
  select (core.cost_compute((core.cost_sheet_for(p_phase_id, p_unit)).id, p_buyer, p_waive) ->> 'all_in_inr')::bigint
$$;
comment on function core.all_in(uuid, text, text, text[]) is 'The all-in price of a unit from its latest published cost sheet: base + charges + GST + stamp duty + registration (Aurelia 3 BHK: ₹2,74,00,400). Null without a cost sheet.';

create function core.cost_breakdown_json(
  p_phase_id uuid,
  p_unit text default '3 BHK',
  p_buyer text default 'male',
  p_waive text[] default '{}'::text[]
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_sheet ws.cost_sheets%rowtype;
  v_c jsonb;
  v_full jsonb;
  v_quoted bigint;
  v_names text[];
  v_move core.editorial_notes%rowtype;
  v_out jsonb;
begin
  select * into v_sheet from core.cost_sheet_for(p_phase_id, p_unit);
  if v_sheet.id is null then
    return null;
  end if;
  v_c := core.cost_compute(v_sheet.id, p_buyer, p_waive);
  if v_c is null then
    return null;
  end if;
  v_quoted := (v_c ->> 'base_inr')::bigint;
  select pg_catalog.array_agg(x) into v_names from pg_catalog.jsonb_array_elements_text(v_c -> 'negotiable_names') as x;
  select * into v_move from core.editorial('phase', p_phase_id, 'move_in_estimate');

  v_out := pg_catalog.jsonb_build_object(
    'schema', 'plinth.cost_breakdown/1',
    'rules_version', v_c ->> 'rules_version',
    'basis_line', p_unit
      || coalesce(', ' || core.fmt_count(pg_catalog.round(v_sheet.carpet_sqft)::bigint) || ' sq ft carpet', '')
      || coalesce(' / ' || core.fmt_count(pg_catalog.round(v_sheet.super_sqft)::bigint) || ' super', '')
      || coalesce(' · ' || v_sheet.unit_label, '')
      || ' · cost sheet of ' || ops.fmt_date(v_sheet.dated),
    'lines', v_c -> 'lines',
    'charges_total_label', ops.fmt_inr_short((v_c ->> 'charges_total_inr')::bigint),
    'all_in_inr', (v_c ->> 'all_in_inr')::bigint,
    'all_in_label', ops.fmt_inr_short((v_c ->> 'all_in_inr')::bigint),
    'per_sqft_carpet_label', ops.fmt_inr_exact((v_c ->> 'per_sqft_carpet_inr')::bigint) || ' per sq ft carpet',
    'vs_quoted_line', case when v_quoted > 0
      then pg_catalog.round(((v_c ->> 'all_in_inr')::numeric / v_quoted - 1) * 100)::text || '% more than quoted' end,
    'negotiable_line', case when (v_c ->> 'negotiable_inr')::bigint > 0
      then 'Often negotiable: ' || core.list_join(v_names) || ' (' || ops.fmt_inr_short((v_c ->> 'negotiable_inr')::bigint) || ').' end,
    'edc_idc_line', case when v_sheet.edc_idc_line is not null
      then 'EDC and IDC: ' || core.lower_first(pg_catalog.regexp_replace(v_sheet.edc_idc_line, '\.+$', '')) || '.' end,
    'area_line', case when v_sheet.super_sqft is not null and v_sheet.carpet_sqft is not null
      then 'You pay for ' || core.fmt_count(pg_catalog.round(v_sheet.super_sqft)::bigint) || ' sq ft of super area. You can use '
        || core.fmt_count(pg_catalog.round(v_sheet.carpet_sqft)::bigint) || ' sq ft of carpet area. Loading is '
        || pg_catalog.round((v_sheet.super_sqft / v_sheet.carpet_sqft - 1) * 100)::text || '%.' end,
    'move_in_line', case when v_move.id is not null
      then 'About ' || core.fmt_inr_range_lakh((v_move.body ->> 'low_inr')::bigint, (v_move.body ->> 'high_inr')::bigint)
        || ' on top, around the offer of possession (Plinth estimate).' end
  );

  if pg_catalog.cardinality(coalesce(p_waive, '{}'::text[])) > 0 then
    v_full := core.cost_compute(v_sheet.id, p_buyer, '{}'::text[]);
    v_out := v_out || pg_catalog.jsonb_build_object(
      'waived', pg_catalog.to_jsonb(p_waive),
      'waived_line', ops.fmt_inr_short((v_full ->> 'all_in_inr')::bigint - (v_c ->> 'all_in_inr')::bigint) || ' less');
  end if;
  return v_out;
end
$$;
comment on function core.cost_breakdown_json(uuid, text, text, text[]) is 'plinth.cost_breakdown/1 for a phase and unit from its latest published cost sheet (API_CONTRACTS §4.13), or null without one. The project page shows it at the defaults; api.cost_breakdown (M3) passes the buyer''s inputs.';

-- ---------------------------------------------------------------------------
-- Payment plans: what is due by the registered agreement, per tower
-- ---------------------------------------------------------------------------
create function core.phase_plan(p_phase_id uuid)
returns ws.payment_plans
language sql
stable
set search_path = ''
as $$
  select p.*
  from ws.payment_plans p
  where p.phase_id = p_phase_id
    and p.status = 'published'
    and p.published_on <= ops.today()
  order by p.published_on desc, p.created_at desc
  limit 1
$$;
comment on function core.phase_plan(uuid) is 'The phase''s latest published payment plan.';

create function core.tower_slabs(p_phase_id uuid)
returns table (tower text, slab integer, quarter text)
language sql
stable
set search_path = ''
as $$
  select distinct on (t.code) t.code, tp.slab_reached, q.quarter
  from core.towers t
  join core.qpr_tower_progress tp on tp.tower_id = t.id
  join core.qpr_filings q on q.id = tp.filing_id
  where t.phase_id = p_phase_id
    and tp.slab_reached is not null
  order by t.code, q.quarter desc
$$;
comment on function core.tower_slabs(uuid) is 'Each tower''s slab on the latest QPR that reports it (Aurelia: A 9, B 7, C 5).';

create function core.plan_due_pct(p_plan_id uuid, p_slab integer)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce(pg_catalog.sum(s.pct), 0)
  from ws.payment_plan_stages s
  where s.plan_id = p_plan_id
    and (
      s.stage_kind in ('booking', 'agreement')
      or (s.stage_kind = 'foundation' and coalesce(p_slab, 0) >= 1)
      or (s.stage_kind = 'slab' and s.slab_no <= coalesce(p_slab, 0))
    )
$$;
comment on function core.plan_due_pct(uuid, integer) is 'Share of the price due by the registered agreement for a tower at a slab: booking, agreement, foundation and every slab stage already on record (Aurelia Tower A at slab 9: 52.5%).';

create function core.plan_before_possession_pct(p_plan_id uuid)
returns numeric
language sql
stable
set search_path = ''
as $$
  select coalesce(pg_catalog.sum(s.pct) filter (where s.stage_kind <> 'possession'), 0)
  from ws.payment_plan_stages s
  where s.plan_id = p_plan_id
$$;
comment on function core.plan_before_possession_pct(uuid) is 'Share of the price paid out before the offer of possession (all but the last stage): 95% on Aurelia''s plan.';

-- ---------------------------------------------------------------------------
-- Afford the wait (API_CONTRACTS §4.13; vectors/afford_the_wait.json)
-- ---------------------------------------------------------------------------
create function core.pre_emi(p_price_inr bigint, p_paid_pct numeric, p_down_inr bigint, p_rate_pct numeric)
returns bigint
language sql
immutable
parallel safe
set search_path = ''
as $$
  select greatest(pg_catalog.round((p_price_inr * p_paid_pct / 100 - p_down_inr) * p_rate_pct / 1200), 0)::bigint
$$;
comment on function core.pre_emi(bigint, numeric, bigint, numeric) is 'Pre-EMI for a month: interest only on what the bank has paid out (the share of the price due minus the down payment), at rate ÷ 12, rounded half up to the rupee (₹2,05,50,000 at 8.5% → ₹1,45,563).';

create function core.afford_the_wait(
  p_phase_id uuid,
  p_tower text,
  p_take_home_inr bigint default 450000,
  p_rent_inr bigint default 55000,
  p_down_pct numeric default 20,
  p_rate_pct numeric default 8.5,
  p_tenure_years integer default 20,
  p_delay_months integer default 12
)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_view jsonb;
  v_cost jsonb;
  v_plan ws.payment_plans%rowtype;
  v_tower text;
  v_slab integer;
  v_all_in bigint;
  v_round bigint;
  v_rounded bigint;
  v_down bigint;
  v_loan bigint;
  v_r numeric;
  v_n integer;
  v_g numeric;
  v_emi bigint;
  v_now_pct numeric;
  v_end_pct numeric;
  v_first date;
  v_completion date;
  v_steps integer;
  v_pct numeric;
  v_series jsonb := '[]'::jsonb;
  v_now_monthly bigint;
  v_end_monthly bigint;
  v_now_share integer;
  v_end_share integer;
  v_freq text;
begin
  v_view := core.phase_view(p_phase_id);
  v_cost := core.cost_compute((core.cost_sheet_for(p_phase_id, '3 BHK')).id, 'male', '{}'::text[]);
  select * into v_plan from core.phase_plan(p_phase_id);
  if v_view is null or v_cost is null or v_plan.id is null or (v_view ->> 'original_completion') is null then
    return null;
  end if;

  select ts.tower, ts.slab into v_tower, v_slab
  from core.tower_slabs(p_phase_id) ts
  where p_tower is null or ts.tower = pg_catalog.upper(p_tower)
  order by ts.tower
  limit 1;

  v_all_in := (v_cost ->> 'all_in_inr')::bigint;
  v_round := (v_cost ->> 'afford_round_inr')::bigint;
  v_rounded := (pg_catalog.round(v_all_in::numeric / v_round) * v_round)::bigint;
  v_down := pg_catalog.round(v_rounded * p_down_pct / 100)::bigint;
  v_loan := v_rounded - v_down;
  v_r := p_rate_pct / 100 / 12;
  v_n := p_tenure_years * 12;
  v_g := (1 + v_r) ^ v_n;
  v_emi := pg_catalog.round(v_loan * v_r * v_g / (v_g - 1))::bigint;

  v_now_pct := core.plan_due_pct(v_plan.id, v_slab);
  v_end_pct := core.plan_before_possession_pct(v_plan.id);
  v_first := (pg_catalog.date_trunc('month', ops.today()) + interval '1 month')::date;
  v_completion := (v_view ->> 'original_completion')::date;
  v_steps := greatest(core.month_diff(v_first, v_completion), 0);

  -- Paid out rises in equal monthly steps to completion; a delay holds the last level.
  for i in 0..v_steps loop
    v_pct := case when v_steps = 0 then v_end_pct else v_now_pct + (v_end_pct - v_now_pct) * i / v_steps end;
    v_series := v_series || pg_catalog.jsonb_build_object(
      'month', pg_catalog.to_char((v_first + pg_catalog.make_interval(months => i))::date, 'YYYY-MM'),
      'paid_out_pct', pg_catalog.trim_scale(pg_catalog.round(v_pct, 1)),
      'pre_emi_inr', core.pre_emi(v_rounded, v_pct, v_down, p_rate_pct),
      'rent_inr', p_rent_inr,
      'delay', false);
  end loop;
  for i in 1..greatest(p_delay_months, 0) loop
    v_series := v_series || pg_catalog.jsonb_build_object(
      'month', pg_catalog.to_char((v_completion + pg_catalog.make_interval(months => i))::date, 'YYYY-MM'),
      'paid_out_pct', pg_catalog.trim_scale(v_end_pct),
      'pre_emi_inr', core.pre_emi(v_rounded, v_end_pct, v_down, p_rate_pct),
      'rent_inr', p_rent_inr,
      'delay', true);
  end loop;

  v_now_monthly := core.pre_emi(v_rounded, v_now_pct, v_down, p_rate_pct) + p_rent_inr;
  v_end_monthly := core.pre_emi(v_rounded, v_end_pct, v_down, p_rate_pct) + p_rent_inr;
  v_now_share := pg_catalog.round(100.0 * v_now_monthly / p_take_home_inr)::integer;
  v_end_share := pg_catalog.round(100.0 * v_end_monthly / p_take_home_inr)::integer;

  if (v_view ->> 'show_band')::boolean and (v_view ->> 'freq_short') is not null then
    v_freq := (v_view ->> 'freq_short') || ' similar projects were more than 12 months late.';
  end if;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.afford_the_wait/1',
    'inputs', pg_catalog.jsonb_build_object(
      'tower', v_tower, 'take_home_inr', p_take_home_inr, 'rent_inr', p_rent_inr,
      'down_pct', pg_catalog.trim_scale(p_down_pct), 'rate_pct', pg_catalog.trim_scale(p_rate_pct),
      'tenure_years', p_tenure_years, 'delay_months', p_delay_months),
    'loan', pg_catalog.jsonb_build_object(
      'all_in_rounded_inr', v_rounded, 'down_payment_inr', v_down, 'loan_inr', v_loan),
    'answer_line', 'Rent and pre-EMI come to ' || ops.fmt_inr_exact(v_now_monthly) || ' a month now, rising to '
      || ops.fmt_inr_exact(v_end_monthly) || ' by ' || ops.fmt_month(v_completion)
      || ' (' || v_now_share || '% → ' || v_end_share || '% of take-home).',
    'now', pg_catalog.jsonb_build_object('monthly_inr', v_now_monthly, 'share_pct', v_now_share),
    'by_completion', pg_catalog.jsonb_build_object(
      'label', 'By ' || ops.fmt_month(v_completion), 'monthly_inr', v_end_monthly, 'share_pct', v_end_share),
    'delay', pg_catalog.jsonb_build_object(
      'months', p_delay_months, 'cost_inr', p_delay_months * v_end_monthly,
      'cost_label', ops.fmt_inr_short(p_delay_months * v_end_monthly)),
    'delay_options', (
      select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
               'months', d.m, 'cost_inr', d.m * v_end_monthly, 'cost_label', ops.fmt_inr_short(d.m * v_end_monthly))
             order by d.m)
      from (values (12), (24)) as d(m)),
    'after_keys', pg_catalog.jsonb_build_object('emi_inr', v_emi),
    'series', v_series,
    'frequency_line', v_freq,
    'assumptions', pg_catalog.jsonb_build_array(
      'Loan = ' || pg_catalog.trim_scale(100 - p_down_pct) || '% of the all-in (' || ops.fmt_inr_short(v_all_in)
        || ', rounded to the lakh).',
      'Payout follows the plan for ' || coalesce('Tower ' || v_tower, core.phase_label(v_view ->> 'name')) || '.',
      'The delay comes after finishing.',
      'RERA s.18 interest is left out.'),
    'framing_line', 'Arithmetic, not advice.'
  );
end
$$;
comment on function core.afford_the_wait(uuid, text, bigint, bigint, numeric, numeric, integer, integer) is 'plinth.afford_the_wait/1: rent + pre-EMI now and by completion, the cost of a delay and the EMI after keys, from the cost sheet''s all-in (rounded to the lakh) and the payment plan for a tower (vectors/afford_the_wait.json: ₹1,18,077 → ₹2,00,563; 12 months ₹24.1 L; 24 months ₹48.1 L; EMI ₹1,90,227). Null without a cost sheet or plan.';

-- ---------------------------------------------------------------------------
-- core.risk_price, re-created now that ws.cost_sheets exists (T12 → T13 handoff): the basis
-- line names the cost sheet's option ("3 BHK, 1,450 sq ft carpet, park-facing · cost sheet of
-- 2 Oct 2026"). The price still comes from the published price facts (M3 swaps in core.all_in()).
-- ---------------------------------------------------------------------------
create or replace function core.risk_price(p_phase_id uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_quoted jsonb;
  v_all_in jsonb;
  v_unit text;
  v_carpet numeric;
  v_option text;
  v_quoted_label text;
  v_all_in_label text;
  v_dated date;
begin
  select f.value into v_quoted from core.current_fact('phase', p_phase_id, 'price.quoted') f where f.id is not null;
  select f.value into v_all_in from core.current_fact('phase', p_phase_id, 'price.all_in') f where f.id is not null;

  if v_quoted is null and v_all_in is null then
    return pg_catalog.jsonb_build_object(
      'all_in_inr', null, 'all_in_label', null, 'quoted_label', null,
      'per_sqft_carpet_label', null, 'basis_line', null,
      'display_line', 'No price list with us');
  end if;

  v_unit := coalesce(v_all_in ->> 'unit', v_quoted ->> 'unit', 'Home');
  v_quoted_label := ops.fmt_inr_short((v_quoted ->> 'base_price_inr')::bigint);

  if v_all_in is null then
    return pg_catalog.jsonb_build_object(
      'all_in_inr', null, 'all_in_label', null, 'quoted_label', v_quoted_label,
      'per_sqft_carpet_label', null,
      'basis_line', v_unit || ' quoted price · no cost sheet with us',
      'display_line', 'Quoted ' || coalesce(v_quoted_label, '') || ' · all-in not known yet');
  end if;

  v_dated := (v_all_in ->> 'cost_sheet_dated')::date;
  select u.carpet_sqft into v_carpet from core.unit_types u where u.phase_id = p_phase_id and u.label = v_unit;

  -- The option the cost sheet prices (ws.cost_sheets.unit_label) for this phase, unit and date.
  select s.unit_label into v_option
  from ws.cost_sheets s
  join core.unit_types u on u.id = s.unit_type_id
  where s.phase_id = p_phase_id
    and u.label = v_unit
    and s.status = 'published'
    and s.dated = v_dated
  order by s.created_at desc
  limit 1;

  v_all_in_label := ops.fmt_inr_short((v_all_in ->> 'all_in_inr')::bigint);
  return pg_catalog.jsonb_build_object(
    'all_in_inr', v_all_in -> 'all_in_inr',
    'all_in_label', v_all_in_label,
    'quoted_label', v_quoted_label,
    'per_sqft_carpet_label', ops.fmt_inr_exact((v_all_in ->> 'per_sqft_carpet_inr')::bigint) || ' per sq ft carpet',
    'basis_line', v_unit
      || coalesce(', ' || core.fmt_count(pg_catalog.round(v_carpet)::bigint) || ' sq ft carpet', '')
      || coalesce(', ' || v_option, '')
      || case when v_dated is not null then ' · cost sheet of ' || ops.fmt_date(v_dated) else ' · developer cost sheet' end,
    'display_line', v_all_in_label || ' all-in' || coalesce(' · quoted ' || v_quoted_label, ''));
end
$$;
comment on function core.risk_price(uuid) is 'RiskSummary.price from the published price facts (all-in first, quoted second), naming the cost sheet''s option from ws.cost_sheets (T13). M3 swaps in core.all_in(); without a cost sheet: "Quoted ₹2.25 Cr · all-in not known yet".';

-- ---------------------------------------------------------------------------
-- Lockdown sweep (T04 pattern, BUILD_PLAN §12.1), then the explicit api grants.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
grant execute on function api.risk_summary(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text) to anon, authenticated, service_role;
