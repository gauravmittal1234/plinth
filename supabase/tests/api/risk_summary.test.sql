-- T12 · api.risk_summary on the §5b seed (API_CONTRACTS §2, §2.2; DATA_MODEL §12 inv. 1, 2, 8).
-- Grants; the canonical Aurelia object; every §2.2 variant (Kestrel, Sapphire re-scoring,
-- Coral stale, Laurel red flag, Juniper limited history, Heron Point not scored, Cedar Walk);
-- errors; and the firewall (published runs only). The deep comparison with
-- packages/fixtures/expected is `npm run -w @plinth/fixtures test:api` (ci-db runs both).
begin;
create extension if not exists pgtap with schema extensions;
select plan(64);

-- The function and its grants --------------------------------------------------------------
select ok(to_regprocedure('api.risk_summary(text)') is not null, 'api.risk_summary(text) exists');
select is(
  (select prorettype::regtype::text from pg_catalog.pg_proc where oid = 'api.risk_summary(text)'::regprocedure),
  'jsonb',
  'it returns jsonb'
);
select ok(
  (select prosecdef and provolatile = 's' from pg_catalog.pg_proc where oid = 'api.risk_summary(text)'::regprocedure),
  'it is SECURITY DEFINER and STABLE (PostgREST serves GET …/rpc/risk_summary?p_slug=…)'
);
select ok(
  has_function_privilege('anon', 'api.risk_summary(text)', 'EXECUTE')
    and has_function_privilege('authenticated', 'api.risk_summary(text)', 'EXECUTE')
    and has_function_privilege('service_role', 'api.risk_summary(text)', 'EXECUTE'),
  'anon, authenticated and service_role may execute it'
);
select ok(
  not exists (
    select 1 from aclexplode((select proacl from pg_catalog.pg_proc where oid = 'api.risk_summary(text)'::regprocedure)) a
    where a.grantee = 0
  ),
  'EXECUTE is never granted to PUBLIC'
);
select ok(
  not has_function_privilege('anon', 'core.risk_summary_json(uuid)', 'EXECUTE')
    and not has_function_privilege('authenticated', 'core.risk_summary_json(uuid)', 'EXECUTE'),
  'the core helper behind it stays private'
);

-- Every seeded phase, read as anon -----------------------------------------------------------
create temp table t12_rs (slug text primary key, j jsonb);
grant all on t12_rs to public;

set local role anon;
select set_config('request.jwt.claims', '', true);
insert into t12_rs
select s.slug, api.risk_summary(s.slug)
from (values ('aurelia-heights-phase-2'), ('kestrel-park'), ('sapphire-grove-phase-1'), ('coral-towers'),
             ('laurel-residency'), ('juniper-enclave'), ('heron-point-phase-2'), ('cedar-walk-phase-2')) as s(slug);
reset role;

select is((select count(*)::int from t12_rs where j ->> 'schema' = 'plinth.risk_summary/1'), 8, 'anon reads all 8 seeded phases');

-- Aurelia Heights, Phase 2: the API_CONTRACTS §2.1 example ---------------------------------------
select is(
  (select (j -> 'phase') - 'authority' - 'developer' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"slug": "aurelia-heights-phase-2", "name": "Aurelia Heights, Phase 2", "short_code": "AH2",
    "rera_number": "GGM/673/405/2022/117", "locality_line": "Sector 37D, Dwarka Expressway", "units": 500}'::jsonb,
  'Aurelia: the phase block'
);
select is(
  (select j -> 'phase' -> 'developer' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"slug": "northfield-estates", "name": "Northfield Estates",
    "claim": {"state": "claimed", "line": "claimed developer page, replies here", "since": "2025-12-02"}}'::jsonb,
  'Aurelia: the developer and its claim line'
);
select is(
  (select j -> 'display' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"state": "scored", "overlays": ["pending_change"], "bands_public": true}'::jsonb,
  'Aurelia: scored, with the pending_change overlay'
);
select is(
  (select j -> 'band' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"code": "elevated", "label": "Elevated", "step": 3, "since": "2026-10-02", "set_by": "model", "rule": null}'::jsonb,
  'Aurelia: Elevated since 2 Oct 2026 (across the v1.1 → v1.2 re-run)'
);
select is(
  (select j -> 'chip' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"kind": "band", "label": "Elevated", "step": 3, "meter_filled": 3}'::jsonb,
  'Aurelia: the band chip'
);
select is(
  (select j -> 'confidence' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"level": "low", "dots": 1, "line": "We''re less certain about this one. Northfield has only 6 finished RERA projects to learn from, so we show a range, not one number."}'::jsonb,
  'Aurelia: low confidence on its own line, never in the band name'
);
select is(
  (select (j -> 'frequency') - 'reference_class_line' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"kind": "range", "low": 30, "high": 45,
    "sentence": "Between 30 and 45 of 100 similar Gurugram projects got their OC more than 12 months after the original RERA date.",
    "icon_array": {"filled": 30, "hatched": 15, "empty": 55},
    "hatch_legend": "Hatched: the 15 of 100 we''re less certain about"}'::jsonb,
  'Aurelia: "Between 30 and 45 of 100" with a hatched icon array'
);
select is(
  (select (j -> 'late12') - 'oc_not_keys_line' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"original_completion": "2027-12", "blanket_extension_months": 4, "late_after": "2029-04",
    "line": "Original completion Dec 2027. More than 12 months late here means an OC after Apr 2029, with the 4-month blanket extension of Jul 2026."}'::jsonb,
  'Aurelia: late after Apr 2029 (Dec 2027 + 4 + 12 months)'
);
select is(
  (select array_agg(r ->> 'text' order by (r ->> 'rank')::int) from t12_rs, jsonb_array_elements(j -> 'reasons') r
    where slug = 'aurelia-heights-phase-2'),
  array[
    '72% of units sold, 41% built.',
    '77% of the promised time used. QPRs filed late in 3 of the last 8 quarters.',
    '14 complaints decided against the promoter in 24 months · 2.8 per 100 units. Median count for similar projects: 3.',
    '2 of the group''s 6 finished RERA projects got OC more than 12 months late.'
  ],
  'Aurelia: the 4 reasons, ranked'
);
select is(
  (select j -> 'reasons' -> 0 -> 'sources' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '[{"label": "HARERA QPR · Apr–Jun 2026", "fact_ids": ["196cb4f5-27eb-57a5-99f8-e5ab1b599c93"],
     "evidence_url": "/evidence/196cb4f5-27eb-57a5-99f8-e5ab1b599c93", "official_url": "https://haryanarera.gov.in",
     "as_of": "2026-07-15"}]'::jsonb,
  'Aurelia: reason 1 cites the Apr–Jun 2026 QPR fact and opens its evidence drawer'
);
select is(
  (select j ->> 'what_would_change' from t12_rs where slug = 'aurelia-heights-phase-2'),
  'Two consecutive quarters with construction ahead of sales would move this to Moderate.',
  'Aurelia: what would change'
);
select is(
  (select (j -> 'pending' -> 0) - 'developer_says' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"code": "qpr_missing", "line": "The Jul–Sep 2026 QPR is not on HARERA yet. It was due 15 Oct 2026.",
    "since": "2026-10-15",
    "marker_line": "If it is still missing on 25 Oct 2026, this band may change; followers hear first."}'::jsonb,
  'Aurelia: the missing Jul–Sep 2026 QPR is a pending fact, with the notice''s public marker only'
);
select is(
  (select j -> 'progress' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"built_pct": 41, "sold_pct": 72, "time_used_pct": 77,
    "latest_qpr": {"quarter": "2026-Q2", "label": "Apr–Jun 2026", "filed_on": "2026-07-15", "age_days": 95},
    "line": "41% built · 77% of the promised time used · 72% sold"}'::jsonb,
  'Aurelia: progress from the Apr–Jun 2026 QPR, 77% of the time used today'
);
select is(
  (select (j -> 'price') - 'basis_line' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"all_in_inr": 27400400, "all_in_label": "₹2.74 Cr", "quoted_label": "₹2.35 Cr",
    "per_sqft_carpet_label": "₹18,900 per sq ft carpet", "display_line": "₹2.74 Cr all-in · quoted ₹2.35 Cr"}'::jsonb,
  'Aurelia: all-in ₹2.74 Cr first, quoted ₹2.35 Cr second'
);
select is(
  (select j -> 'complaints' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"count_24m": 14, "per_100_units": 2.8, "units_base": 500, "median_count_similar": 3,
    "line": "14 complaints · 2.8 per 100 units"}'::jsonb,
  'Aurelia: complaints as a count and a rate together'
);
select is(
  (select (j -> 'meta') - 'disclaimer_line' - 'promise_line' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '{"data_as_of": "2026-10-14", "model_version": "v1.2", "score_run_id": "f1bf715a-ccdc-57ca-afcc-b5dcda92abe3",
    "generated_at": "2026-10-18T12:00:00+05:30", "methodology_url": "/methodology",
    "live_url": "https://plinth.in/gurugram/projects/aurelia-heights-phase-2", "short_url": "https://plinth.in/r/AH2"}'::jsonb,
  'Aurelia: meta (frozen clock, the published v1.2 run, the AH2 short link)'
);
select is(
  (select j -> 'share' -> 'lines' from t12_rs where slug = 'aurelia-heights-phase-2'),
  '["Delivery risk: Elevated",
    "Between 30 and 45 of 100 similar Gurugram projects got their OC more than 12 months late.",
    "41% built with 77% of the promised time used."]'::jsonb,
  'Aurelia: the share card''s 3 lines (a band always with its natural frequency)'
);
select is(
  (select j -> 'share' ->> 'source_line' from t12_rs where slug = 'aurelia-heights-phase-2'),
  'HARERA records · data as of 14 Oct 2026 · v1.2',
  'Aurelia: the share card''s source-and-date line'
);
select ok(
  (select j::text !~ '(internal_points|p_late12|"to_band"|proposed_run)' from t12_rs where slug = 'aurelia-heights-phase-2'),
  'Aurelia: no internal score field, notice band or proposed run in the payload'
);

-- Kestrel Park: Low, high confidence, a point frequency -------------------------------------------
select is((select j -> 'band' ->> 'code' from t12_rs where slug = 'kestrel-park'), 'low', 'Kestrel: Low');
select is(
  (select j -> 'confidence' from t12_rs where slug = 'kestrel-park'),
  '{"level": "high", "dots": 2, "line": "We''re more certain about this one. Orbis Land has 9 finished RERA projects to learn from."}'::jsonb,
  'Kestrel: high confidence (●●), 9 finished projects'
);
select is(
  (select j -> 'frequency' ->> 'sentence' from t12_rs where slug = 'kestrel-park'),
  'About 10 of 100 similar Gurugram projects got their OC more than 12 months after the original RERA date.',
  'Kestrel: "About 10 of 100"'
);
select is(
  (select j -> 'frequency' -> 'icon_array' from t12_rs where slug = 'kestrel-park'),
  '{"filled": 10, "hatched": 0, "empty": 90}'::jsonb,
  'Kestrel: a point frequency has no hatched icons'
);
select is(
  (select j -> 'complaints' ->> 'line' from t12_rs where slug = 'kestrel-park'),
  '2 complaints · 0.5 per 100 units',
  'Kestrel: "2 complaints · 0.5 per 100 units"'
);
select is(
  (select j -> 'display' -> 'overlays' from t12_rs where slug = 'kestrel-park'),
  '[]'::jsonb,
  'Kestrel: no overlays'
);
select is(
  (select j -> 'progress' -> 'latest_qpr' from t12_rs where slug = 'kestrel-park'),
  '{"quarter": "2026-Q3", "label": "Jul–Sep 2026", "filed_on": "2026-10-12", "age_days": 6}'::jsonb,
  'Kestrel: the Jul–Sep 2026 QPR filed on time on 12 Oct'
);

-- Sapphire Grove Ph 1: re-scoring, no figures from the new filing -------------------------------
select is(
  (select j -> 'display' -> 'overlays' from t12_rs where slug = 'sapphire-grove-phase-1'),
  '["rescoring"]'::jsonb,
  'Sapphire: the rescoring overlay'
);
select is(
  (select j -> 'pending' from t12_rs where slug = 'sapphire-grove-phase-1'),
  '[{"code": "rescore_due",
     "line": "The Jul–Sep 2026 QPR was filed 15 Oct and fetched 16 Oct, 7:40 pm. We update this by 19 Oct 2026, 7:40 pm.",
     "since": "2026-10-16", "developer_says": null,
     "marker_line": "If the new figures move the band, followers hear first, with what changed and why."}]'::jsonb,
  'Sapphire: rescore_due within 72 hours of the fetch'
);
select is(
  (select j -> 'progress' -> 'latest_qpr' ->> 'quarter' from t12_rs where slug = 'sapphire-grove-phase-1'),
  '2026-Q2',
  'Sapphire: progress still from the Apr–Jun 2026 QPR (no figures from the new filing)'
);
select is((select j -> 'band' ->> 'code' from t12_rs where slug = 'sapphire-grove-phase-1'), 'moderate', 'Sapphire: Moderate');

-- Coral Towers: stale ---------------------------------------------------------------------------
select is(
  (select j -> 'display' -> 'overlays' from t12_rs where slug = 'coral-towers'),
  '["stale"]'::jsonb,
  'Coral: the stale overlay'
);
select is(
  (select j -> 'progress' ->> 'line' from t12_rs where slug = 'coral-towers'),
  '22% built · 70% of the promised time used · progress 187 days old',
  'Coral: progress 187 days old'
);
select is(
  (select array_agg(p ->> 'line' order by p ->> 'since') from t12_rs, jsonb_array_elements(j -> 'pending') p
    where slug = 'coral-towers'),
  array['The Apr–Jun 2026 QPR is not on HARERA yet. It was due 15 Jul 2026.',
        'The Jul–Sep 2026 QPR is not on HARERA yet. It was due 15 Oct 2026.'],
  'Coral: both missing QPRs are pending facts'
);
select is(
  (select j -> 'confidence' ->> 'line' from t12_rs where slug = 'coral-towers'),
  'We''re less certain about this one. Vantage Buildcon''s record is short, and the old building figures widen the range.',
  'Coral: low confidence from a short record and old figures'
);
select is((select j -> 'complaints' from t12_rs where slug = 'coral-towers'), 'null'::jsonb, 'Coral: no complaints count on record → null');

-- Laurel Residency: Severe by red-flag rule 1 ---------------------------------------------------
select is(
  (select j -> 'band' from t12_rs where slug = 'laurel-residency'),
  '{"code": "severe", "label": "Severe", "step": 5, "since": "2026-07-15", "set_by": "red_flag_rule",
    "rule": {"code": "RF1_GROUP_CIRP",
             "line": "Set by red-flag rule 1, not our model: a group company was admitted to insolvency (NCLT order, 12 Mar 2023)."}}'::jsonb,
  'Laurel: Severe, set by red-flag rule 1, not the model'
);
select is((select j -> 'frequency' from t12_rs where slug = 'laurel-residency'), 'null'::jsonb, 'Laurel: no natural frequency when a rule sets the band');
select is((select j -> 'display' -> 'overlays' from t12_rs where slug = 'laurel-residency'), '["stalled"]'::jsonb, 'Laurel: the stalled overlay');
select is(
  (select j -> 'price' ->> 'display_line' from t12_rs where slug = 'laurel-residency'),
  'Quoted ₹1.48 Cr · all-in not known yet',
  'Laurel: quoted price only, no all-in'
);
select is(
  (select j -> 'share' -> 'lines' from t12_rs where slug = 'laurel-residency'),
  '["Delivery risk: Severe, set by red-flag rule 1",
    "A group company of Elmstone Developers was admitted to insolvency (NCLT order, 12 Mar 2023).",
    "34% built. The original date, Jun 2026, has passed."]'::jsonb,
  'Laurel: the share card names the rule'
);

-- Juniper Enclave: limited history --------------------------------------------------------------
select is(
  (select jsonb_build_object('state', j -> 'display' -> 'state', 'band', j -> 'band', 'frequency', j -> 'frequency',
                             'confidence', j -> 'confidence', 'reasons', j -> 'reasons')
   from t12_rs where slug = 'juniper-enclave'),
  '{"state": "limited_history", "band": null, "frequency": null, "confidence": null, "reasons": []}'::jsonb,
  'Juniper: limited history → no band, frequency, confidence or reasons'
);
select is(
  (select j -> 'chip' from t12_rs where slug = 'juniper-enclave'),
  '{"kind": "limited_history", "label": "Not enough history to score · no penalty", "step": null, "meter_filled": 0}'::jsonb,
  'Juniper: "Not enough history to score · no penalty"'
);
select is(
  (select j ->> 'what_would_change' from t12_rs where slug = 'juniper-enclave'),
  'Halcyon Homes'' first finished projects. Each one adds to the record we score from.',
  'Juniper: keeps its what-would-change line'
);

-- Heron Point Ph 2: not scored --------------------------------------------------------------------
select is(
  (select j -> 'chip' from t12_rs where slug = 'heron-point-phase-2'),
  '{"kind": "not_scored", "label": "Not scored", "step": null, "meter_filled": 0}'::jsonb,
  'Heron Point: "Not scored"'
);
select is(
  (select j -> 'pending' -> 0 ->> 'line' from t12_rs where slug = 'heron-point-phase-2'),
  'Registered 28 Apr 2026, less than 6 months ago. We score once there are enough quarterly reports to compare building with time.',
  'Heron Point: what scoring waits for'
);
select is(
  (select j -> 'price' ->> 'display_line' from t12_rs where slug = 'heron-point-phase-2'),
  'No price list with us',
  'Heron Point: "No price list with us"'
);
select is(
  (select j -> 'progress' from t12_rs where slug = 'heron-point-phase-2'),
  '{"built_pct": null, "sold_pct": null, "time_used_pct": 10, "latest_qpr": null,
    "line": "Registered Apr 2026 · 10% of the promised time used"}'::jsonb,
  'Heron Point: no QPR yet, 10% of the promised time used'
);

-- Cedar Walk Ph 2 ---------------------------------------------------------------------------------
select is(
  (select j -> 'progress' -> 'latest_qpr' from t12_rs where slug = 'cedar-walk-phase-2'),
  '{"quarter": "2026-Q2", "label": "Apr–Jun 2026", "filed_on": null, "age_days": null}'::jsonb,
  'Cedar Walk: a QPR with no filing date on record has no age'
);
select is((select j -> 'band' ->> 'code' from t12_rs where slug = 'cedar-walk-phase-2'), 'moderate', 'Cedar Walk: Moderate');

-- Errors (API_CONTRACTS §1) -------------------------------------------------------------------------
set local role anon;
select throws_ok($$select api.risk_summary('no-such-project')$$, 'PT404', 'not_found', 'an unknown slug is not_found (404)');
select throws_ok($$select api.risk_summary('')$$, 'PT422', 'invalid_input', 'an empty slug is invalid_input (422)');
select throws_ok($$select api.risk_summary(null)$$, 'PT422', 'invalid_input', 'a null slug is invalid_input (422)');
select throws_ok(
  $$select api.risk_summary('cedar-walk')$$, 'PT404', 'not_found',
  'a finished phase with no published run is not_found'
);
select is(
  api.risk_summary('  Kestrel-Park ') -> 'phase' ->> 'slug',
  'kestrel-park',
  'slugs are matched trimmed and lower-cased'
);
select throws_ok($$select 1 from core.score_runs limit 1$$, '42501', null, 'anon still cannot read core.score_runs directly');
reset role;

-- The firewall: a newer draft run never shows (DATA_MODEL §12 inv. 2) ----------------------------
with draft as (
  insert into core.score_runs (phase_id, model_version, data_cutoff, status, state, band, set_by, confidence,
                               freq_low, freq_high, what_would_change)
  select p.id, 'v1.2', '2026-10-18', 'draft', 'scored', 'severe', 'model', 'low', 65, 80, 'T12 probe: draft only.'
  from core.phases p where p.slug = 'kestrel-park'
  returning id
)
insert into core.score_reasons (run_id, rank, factor, code, text, fact_ids)
select draft.id, 1, 'legal', 'T12_PROBE', 'T12 probe reason, draft only.', array['f2e68492-eb48-5e45-9c35-97a9733db42f']::uuid[]
from draft;

set local role anon;
select is(
  (select jsonb_build_object('band', r -> 'band' ->> 'code', 'run', r -> 'meta' ->> 'score_run_id', 'wwc', r ->> 'what_would_change')
   from (select api.risk_summary('kestrel-park') as r) x),
  '{"band": "low", "run": "dc43680a-c18b-58cc-a963-c89938bdd127",
    "wwc": "Low is the lowest band. Late QPRs, an extension or more complaints decided against the promoter would move it up."}'::jsonb,
  'a newer draft run (Severe) changes nothing: the published run only'
);
select ok(
  api.risk_summary('kestrel-park')::text !~ 'T12 probe',
  'no text from the draft run or its reasons reaches the payload'
);
reset role;

select * from finish();
rollback;
