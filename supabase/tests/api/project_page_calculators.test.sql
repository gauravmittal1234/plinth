-- T13 · core.all_in(), the cost breakdown and core.afford_the_wait() against the golden vectors
-- (packages/fixtures/vectors/cost.json and afford_the_wait.json; API_CONTRACTS §4.13;
-- BUILD_PLAN D-6: round the all-in to the lakh before any loan arithmetic). Also the risk card's
-- price basis line, which now names the cost sheet's option (T12 → T13 handoff).
begin;
create extension if not exists pgtap with schema extensions;
select plan(33);

-- Aurelia Heights, Phase 2 (fixture id) and its 3 BHK cost sheet of 2 Oct 2026.
create temp table t13_c (k text primary key, j jsonb);
insert into t13_c values
  ('cost', core.cost_breakdown_json('4da0daeb-835b-54d5-9c09-a23ee9cb4b36')),
  ('waived', core.cost_breakdown_json('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '3 BHK', 'male', array['plc', 'club'])),
  ('afford', core.afford_the_wait('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'A', 450000, 55000, 20, 8.5, 20, 12)),
  ('afford24', core.afford_the_wait('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'A', 450000, 55000, 20, 8.5, 20, 24));

-- The all-in ----------------------------------------------------------------------------------------
select is(core.all_in('4da0daeb-835b-54d5-9c09-a23ee9cb4b36'), 27400400::bigint, 'core.all_in(aurelia) = 27400400');
select is(core.all_in('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '3 BHK', 'male', array['plc', 'club']), 26907600::bigint,
  'waiving PLC and club: ₹2,69,07,600');
select is(core.all_in('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '3 BHK', 'female', '{}'),
  (24420000 + 1221000 + 1221000 + 50000)::bigint, 'a woman buyer pays 5% stamp duty');
select is(core.all_in('4da0daeb-835b-54d5-9c09-a23ee9cb4b36', '4 BHK'), null::bigint, 'no 4 BHK cost sheet: no all-in');
select is(core.all_in('5ddd2261-7682-53da-86ae-b011d465a066'), null::bigint, 'Kestrel Park has no cost sheet with us');

select is(
  (select jsonb_object_agg(l ->> 'code', (l ->> 'amount_inr')::bigint) from t13_c, jsonb_array_elements(j -> 'lines') l where k = 'cost'),
  '{"base": 23500000, "plc": 290000, "club": 150000, "parking": 350000, "ifms": 130000, "gst": 1221000, "stamp_registration": 1759400}'::jsonb,
  'the seven lines; GST and stamp duty + registration recomputed from the rules'
);
select is((select j ->> 'charges_total_label' from t13_c where k = 'cost'), '₹9.2 L', 'charges ₹9.2 L');
select is((select j ->> 'all_in_label' from t13_c where k = 'cost'), '₹2.74 Cr', 'all-in ₹2.74 Cr');
select is((select j ->> 'per_sqft_carpet_label' from t13_c where k = 'cost'), '₹18,900 per sq ft carpet', '₹18,900 per sq ft carpet (rounded to ₹100)');
select is((select j ->> 'vs_quoted_line' from t13_c where k = 'cost'), '17% more than quoted', '17% more than quoted');
select is((select j ->> 'negotiable_line' from t13_c where k = 'cost'), 'Often negotiable: PLC and club (₹4.4 L).', 'PLC and club are often negotiable: ₹4.4 L');
select is((select j ->> 'basis_line' from t13_c where k = 'cost'),
  '3 BHK, 1,450 sq ft carpet / 2,000 super · park-facing · cost sheet of 2 Oct 2026', 'the basis names the option and the sheet''s date');
select is((select j ->> 'rules_version' from t13_c where k = 'cost'), '2026.10', 'rules v2026.10');
select is((select (j ->> 'all_in_inr')::bigint from t13_c where k = 'waived'), 26907600::bigint, 'the waived breakdown''s all-in');
select is((select j ->> 'waived_line' from t13_c where k = 'waived'), '₹4.9 L less', 'waiving PLC and club: ₹4.9 L less');
select ok((select not (j ? 'waived') from t13_c where k = 'cost'), 'nothing waived: no waived fields');

-- Afford the wait (vectors/afford_the_wait.json) -----------------------------------------------------
select is((select j -> 'loan' from t13_c where k = 'afford'),
  '{"all_in_rounded_inr": 27400000, "down_payment_inr": 5480000, "loan_inr": 21920000}'::jsonb,
  'the all-in rounded to the lakh; 20% down; the loan');
select is((select j -> 'now' from t13_c where k = 'afford'), '{"monthly_inr": 118077, "share_pct": 26}'::jsonb, 'now: ₹1,18,077, 26% of take-home');
select is((select j -> 'by_completion' from t13_c where k = 'afford'),
  '{"label": "By Dec 2027", "monthly_inr": 200563, "share_pct": 45}'::jsonb, 'by Dec 2027: ₹2,00,563, 45%');
select is((select j -> 'delay' from t13_c where k = 'afford'),
  '{"months": 12, "cost_inr": 2406756, "cost_label": "₹24.1 L"}'::jsonb, '12 months late: ₹24.1 L');
select is((select j -> 'delay' from t13_c where k = 'afford24'),
  '{"months": 24, "cost_inr": 4813512, "cost_label": "₹48.1 L"}'::jsonb, '24 months late: ₹48.1 L');
select is((select j -> 'delay_options' from t13_c where k = 'afford'),
  '[{"months": 12, "cost_inr": 2406756, "cost_label": "₹24.1 L"}, {"months": 24, "cost_inr": 4813512, "cost_label": "₹48.1 L"}]'::jsonb,
  'the page offers 12 and 24 months');
select is((select (j -> 'after_keys' ->> 'emi_inr')::bigint from t13_c where k = 'afford'), 190227::bigint, 'EMI after keys ₹1,90,227');
select is((select j ->> 'answer_line' from t13_c where k = 'afford'),
  'Rent and pre-EMI come to ₹1,18,077 a month now, rising to ₹2,00,563 by Dec 2027 (26% → 45% of take-home).',
  'the answer line');
select is((select j ->> 'frequency_line' from t13_c where k = 'afford'),
  'Between 30 and 45 of 100 similar projects were more than 12 months late.', 'the band''s natural frequency');
select is(
  (select array_agg(row(s ->> 'month', (s ->> 'paid_out_pct')::numeric, (s ->> 'pre_emi_inr')::bigint, (s ->> 'rent_inr')::bigint,
                        (s ->> 'delay')::boolean)::text order by o)
   from t13_c, jsonb_array_elements(j -> 'series') with ordinality as x(s, o) where k = 'afford'),
  (select array_agg(row(v.m, v.p, v.e, v.r, v.d)::text order by v.m) from (values
    ('2026-11', 52.5, 63077::bigint, 55000::bigint, false), ('2026-12', 55.8, 69422, 55000, false),
    ('2027-01', 59, 75767, 55000, false), ('2027-02', 62.3, 82112, 55000, false), ('2027-03', 65.6, 88457, 55000, false),
    ('2027-04', 68.8, 94802, 55000, false), ('2027-05', 72.1, 101147, 55000, false), ('2027-06', 75.4, 107492, 55000, false),
    ('2027-07', 78.7, 113837, 55000, false), ('2027-08', 81.9, 120182, 55000, false), ('2027-09', 85.2, 126527, 55000, false),
    ('2027-10', 88.5, 132872, 55000, false), ('2027-11', 91.7, 139217, 55000, false), ('2027-12', 95, 145563, 55000, false),
    ('2028-01', 95, 145563, 55000, true), ('2028-02', 95, 145563, 55000, true), ('2028-03', 95, 145563, 55000, true),
    ('2028-04', 95, 145563, 55000, true), ('2028-05', 95, 145563, 55000, true), ('2028-06', 95, 145563, 55000, true),
    ('2028-07', 95, 145563, 55000, true), ('2028-08', 95, 145563, 55000, true), ('2028-09', 95, 145563, 55000, true),
    ('2028-10', 95, 145563, 55000, true), ('2028-11', 95, 145563, 55000, true), ('2028-12', 95, 145563, 55000, true)
  ) as v(m, p, e, r, d)),
  'the 26-month series matches the vector exactly (paid out 52.5% → 95%, then the delay)'
);
select is(core.pre_emi(27400000, 95, 5480000, 8.5), 145563::bigint, 'pre-EMI rounds half up: ₹1,45,562.50 → ₹1,45,563');
select is(core.plan_due_pct((select p.id from ws.payment_plans p where p.phase_id = '4da0daeb-835b-54d5-9c09-a23ee9cb4b36'), 9),
  52.5::numeric, 'due by registration at slab 9 (Tower A): 52.5%');
select is(core.plan_before_possession_pct((select p.id from ws.payment_plans p where p.phase_id = '4da0daeb-835b-54d5-9c09-a23ee9cb4b36')),
  95::numeric, 'paid out before the offer of possession: 95%');
select is(core.afford_the_wait('5ddd2261-7682-53da-86ae-b011d465a066', null), null::jsonb,
  'no cost sheet or plan: no Afford the wait');

-- The risk card's price basis now names the cost sheet's option ---------------------------------------
select is(core.risk_price('4da0daeb-835b-54d5-9c09-a23ee9cb4b36') ->> 'basis_line',
  '3 BHK, 1,450 sq ft carpet, park-facing · cost sheet of 2 Oct 2026', 'Aurelia''s price basis: park-facing, cost sheet of 2 Oct 2026');
select is(core.risk_price('5ddd2261-7682-53da-86ae-b011d465a066') ->> 'basis_line',
  '3 BHK, 1,400 sq ft carpet · developer cost sheet', 'Kestrel''s basis is unchanged (summary-only)');

-- A cost sheet is only published content: a draft is never priced ------------------------------------
update ws.cost_sheets set status = 'draft' where phase_id = '4da0daeb-835b-54d5-9c09-a23ee9cb4b36';
select is(core.all_in('4da0daeb-835b-54d5-9c09-a23ee9cb4b36'), null::bigint, 'a draft cost sheet gives no all-in');

select * from finish();
rollback;
