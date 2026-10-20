-- T12 · api.risk_summary display states (DATA_MODEL §12 inv. 2 and 8; API_CONTRACTS §2.2).
--   - bands_public = false (S1): band, frequency, reasons, what-would-change and confidence are null;
--   - facts-only (the group's facts_only_since, or the facts_only_global switch): the same, plus
--     the withheld block and the neutral chip; sourced facts stay;
--   - a pending notice's band never appears in any state, only its public marker;
--   - Developer says: public claims next to their pending fact; the project reply; never a draft,
--     a private claim or a group reply.
begin;
create extension if not exists pgtap with schema extensions;
select plan(36);

create temp table t12_st (k text primary key, j jsonb);
grant all on t12_st to public;

-- Every string anywhere in a payload (for "never shows" checks).
create function pg_temp.t12_strings(p jsonb) returns setof text language sql immutable as $$
  select v #>> '{}' from jsonb_path_query(p, 'lax $.**') v where jsonb_typeof(v) = 'string'
$$;

-- The developer's claim and reply on Aurelia (canonical/developer_content.json). The generated
-- seed carries them once T13's tables exist; inserting here keeps this test independent of that.
insert into ws.developer_claims (id, phase_id, text, said_on, check_by, verified_state, linked_fact_id, public)
values ('2fd1909d-9db4-50e4-ac53-12e5bb604ad4', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'Filed on 12 Oct 2026.',
        '2026-10-15', '2026-11-05', 'unverified', 'bc3ff166-6be3-5805-8401-0dbd4260c1ea', true)
on conflict (id) do nothing;
insert into ws.developer_replies (id, phase_id, text, signatory_title, signatory_name, scope, published_at, check_by, status)
values ('944f86c1-af0b-5868-9d9f-16be9d905477', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36',
        'Tower B structure was completed in September 2026. The QPR for Jul–Sep 2026 was filed on 12 October.',
        'Authorised signatory', 'Ananya Rao', 'project', '2026-10-15 00:00:00+05:30', '2026-11-05', 'published')
on conflict (id) do nothing;

-- Probes: a private claim and a verified claim on Coral's missing QPRs; a group reply on Cedar
-- Walk Ph 2 and a draft reply on Kestrel.
insert into ws.developer_claims (phase_id, text, said_on, check_by, verified_state, linked_fact_id, public) values
  ('2181fcaf-bddf-527d-ab21-a0c822239003', 'Filed on 20 Jul 2026.', '2026-10-16', '2026-11-06', 'unverified',
   '966624b0-fb07-53f5-9cd3-aaaf740a5257', false),
  ('2181fcaf-bddf-527d-ab21-a0c822239003', 'Filed on 14 Oct 2026.', '2026-10-16', '2026-11-06', 'verified',
   'bb180ccb-bb22-558c-b834-e70deec8f7b3', true);
insert into ws.developer_replies (phase_id, text, signatory_title, signatory_name, scope, published_at, check_by, status) values
  ('e05bb4c3-dfd6-5639-b96a-ef81b152385e', 'T12 probe: a group reply.', 'Authorised signatory', 'Ananya Rao', 'group',
   '2026-10-15 00:00:00+05:30', '2026-11-05', 'published'),
  ('5ddd2261-7682-53da-86ae-b011d465a066', 'T12 probe: a draft reply.', 'Authorised signatory', null, 'project',
   null, null, 'draft');

-- Normal state (bands public) ----------------------------------------------------------------------
set local role anon;
insert into t12_st select 'aurelia', api.risk_summary('aurelia-heights-phase-2');
insert into t12_st select 'coral', api.risk_summary('coral-towers');
insert into t12_st select 'cedar', api.risk_summary('cedar-walk-phase-2');
insert into t12_st select 'kestrel', api.risk_summary('kestrel-park');
reset role;

select is(
  (select j -> 'pending' -> 0 -> 'developer_says' from t12_st where k = 'aurelia'),
  '{"text": "Filed on 12 Oct 2026.", "verified": false, "said_on": "2026-10-15", "check_by": "2026-11-05",
    "line": "Developer says: filed 12 Oct, not yet verified."}'::jsonb,
  'Developer says sits next to the missing QPR it is about, as a claim (not verified)'
);
select is(
  (select j -> 'developer_response' from t12_st where k = 'aurelia'),
  '{"text": "Tower B structure was completed in September 2026. The QPR for Jul–Sep 2026 was filed on 12 October.",
    "signatory_title": "Authorised signatory", "published_on": "2026-10-15", "check_by": "2026-11-05",
    "line": "Developer says · not yet verified · 15 Oct 2026 · we check it by 5 Nov 2026"}'::jsonb,
  'the project reply is developer_response (signatory title only; the name stays off the risk card)'
);
select is(
  (select jsonb_agg(p -> 'developer_says' order by p ->> 'since') from t12_st, jsonb_array_elements(j -> 'pending') p where k = 'coral'),
  '[null, {"text": "Filed on 14 Oct 2026.", "verified": true, "said_on": "2026-10-16", "check_by": "2026-11-06",
           "line": "Developer says: filed 14 Oct, verified."}]'::jsonb,
  'a private claim never shows; a verified public claim says so'
);
select is((select j -> 'developer_response' from t12_st where k = 'cedar'), 'null'::jsonb, 'a group reply is not a project''s developer_response');
select is((select j -> 'developer_response' from t12_st where k = 'kestrel'), 'null'::jsonb, 'a draft reply never shows');

-- A pending notice's band never appears (Elevated → High proposed, effective 25 Oct 2026) -------
select is(
  (select count(*)::int from t12_st, pg_temp.t12_strings(j) s where k = 'aurelia' and s ~* '\mhigh\M'),
  0,
  'no string in Aurelia''s payload names the proposed band (High)'
);
select ok(
  (select j::text !~ '45 and 65' and j::text !~ '13e27e23-1998-5ccd-b886-36c8f74cee46' and j::text !~ 'to_band'
   from t12_st where k = 'aurelia'),
  'nor the pending run''s frequency, its id or the notice''s to_band'
);
select is(
  (select j -> 'pending' -> 0 ->> 'marker_line' from t12_st where k = 'aurelia'),
  (select public_marker_text from core.band_notices where id = '6b9b0ddb-1ab4-5e94-b438-da9d0c8e4285'),
  'buyers see the notice''s public marker text only'
);

-- S1: bands_public = false ----------------------------------------------------------------------
update ops.feature_flags set enabled = false where key = 'bands_public';
set local role anon;
insert into t12_st select 's1_aurelia', api.risk_summary('aurelia-heights-phase-2');
insert into t12_st select 's1_laurel', api.risk_summary('laurel-residency');
insert into t12_st select 's1_juniper', api.risk_summary('juniper-enclave');
reset role;
update ops.feature_flags set enabled = true where key = 'bands_public';

select is(
  (select jsonb_build_object('band', j -> 'band', 'frequency', j -> 'frequency', 'reasons', j -> 'reasons',
                             'what_would_change', j -> 'what_would_change', 'confidence', j -> 'confidence')
   from t12_st where k = 's1_aurelia'),
  '{"band": null, "frequency": null, "reasons": [], "what_would_change": null, "confidence": null}'::jsonb,
  'S1: band, frequency, reasons, what-would-change and confidence are null'
);
select is(
  (select j -> 'display' from t12_st where k = 's1_aurelia'),
  '{"state": "scored", "overlays": [], "bands_public": false}'::jsonb,
  'S1: display says bands are not public, and no pending_change overlay'
);
select is(
  (select j -> 'chip' ->> 'kind' from t12_st where k = 's1_aurelia'),
  'withheld',
  'S1: a neutral chip, no band'
);
select is(
  (select j -> 'pending' -> 0 -> 'marker_line' from t12_st where k = 's1_aurelia'),
  'null'::jsonb,
  'S1: no "this band may change" marker'
);
select is(
  (select count(*)::int from t12_st, pg_temp.t12_strings(j) s where k = 's1_aurelia' and s ~* '\m(elevated|high|between 30 and 45)\M'),
  0,
  'S1: no band name or "of 100" figure anywhere in the payload'
);
select is(
  (select j -> 'progress' ->> 'line' from t12_st where k = 's1_aurelia'),
  '41% built · 77% of the promised time used · 72% sold',
  'S1: the sourced facts stay (the truth panel)'
);
select is(
  (select jsonb_build_object('band', j -> 'band', 'rule_text', j::text ~ 'red-flag rule') from t12_st where k = 's1_laurel'),
  '{"band": null, "rule_text": false}'::jsonb,
  'S1: a red-flag band is withheld too'
);
select is(
  (select jsonb_build_object('chip', j -> 'chip' ->> 'kind', 'wwc', j -> 'what_would_change') from t12_st where k = 's1_juniper'),
  '{"chip": "limited_history", "wwc": null}'::jsonb,
  'S1: limited history keeps its chip; what-would-change is null'
);

-- Facts-only: Northfield's group (DESIGN §5b facts-only example) ----------------------------------
update core.developer_groups
   set facts_only_since = '2026-10-18',
       facts_only_line = 'We''re not showing a band for this project while a court considers an application about our bands for the Northfield Estates group.'
 where slug = 'northfield-estates';
set local role anon;
insert into t12_st select 'fo_aurelia', api.risk_summary('aurelia-heights-phase-2');
insert into t12_st select 'fo_cedar', api.risk_summary('cedar-walk-phase-2');
insert into t12_st select 'fo_kestrel', api.risk_summary('kestrel-park');
reset role;

select is(
  (select j -> 'display' from t12_st where k = 'fo_aurelia'),
  '{"state": "facts_only", "overlays": [], "bands_public": true}'::jsonb,
  'facts-only: display.state facts_only, no overlays'
);
select is(
  (select jsonb_build_object('band', j -> 'band', 'frequency', j -> 'frequency', 'reasons', j -> 'reasons',
                             'what_would_change', j -> 'what_would_change', 'confidence', j -> 'confidence')
   from t12_st where k = 'fo_aurelia'),
  '{"band": null, "frequency": null, "reasons": [], "what_would_change": null, "confidence": null}'::jsonb,
  'facts-only: band, frequency, reasons, what-would-change and confidence are null'
);
select is(
  (select j -> 'chip' from t12_st where k = 'fo_aurelia'),
  '{"kind": "withheld", "label": "Band withheld · facts only", "step": null, "meter_filled": 0}'::jsonb,
  'facts-only: "Band withheld · facts only" (no colour, no meter fill)'
);
select is(
  (select j -> 'withheld' from t12_st where k = 'fo_aurelia'),
  '{"since": "2026-10-18", "line": "Band withheld pending review, from 18 Oct 2026",
    "explainer_line": "We''re not showing a band for this project while a court considers an application about our bands for the Northfield Estates group.",
    "explainer_url": "/gurugram/developers/northfield-estates#facts-only"}'::jsonb,
  'facts-only: the withheld block links to the group''s explainer'
);
select is(
  (select j -> 'pending' -> 0 -> 'marker_line' from t12_st where k = 'fo_aurelia'),
  'null'::jsonb,
  'facts-only: the missing QPR stays, without the band marker'
);
select is(
  (select jsonb_build_object('built', j -> 'progress' -> 'built_pct', 'all_in', j -> 'price' -> 'all_in_inr',
                             'complaints', j -> 'complaints' -> 'count_24m', 'late_after', j -> 'late12' -> 'late_after',
                             'reply', j -> 'developer_response' ->> 'published_on')
   from t12_st where k = 'fo_aurelia'),
  '{"built": 41, "all_in": 27400400, "complaints": 14, "late_after": "2029-04", "reply": "2026-10-15"}'::jsonb,
  'facts-only: sourced facts and the developer''s reply stay'
);
select is(
  (select j -> 'share' -> 'lines' from t12_st where k = 'fo_aurelia'),
  '["Delivery risk: band withheld · facts only", "Band withheld pending review, from 18 Oct 2026.",
    "41% built with 77% of the promised time used."]'::jsonb,
  'facts-only: the share card withholds the band and the "of 100" figure'
);
select is(
  (select count(*)::int from t12_st, pg_temp.t12_strings(j) s where k = 'fo_aurelia' and s ~* '\m(elevated|high|of 100)\M'),
  0,
  'facts-only: no band name and no "of 100" anywhere'
);
select is((select j -> 'display' ->> 'state' from t12_st where k = 'fo_cedar'), 'facts_only', 'facts-only covers every phase of the group');
select is((select j -> 'band' ->> 'code' from t12_st where k = 'fo_kestrel'), 'low', 'other groups keep their bands');

update core.developer_groups set facts_only_since = '2026-10-25' where slug = 'northfield-estates';
select is(
  (select r -> 'band' ->> 'code' from (select api.risk_summary('aurelia-heights-phase-2') as r) x),
  'elevated',
  'a facts-only date in the future does not withhold the band yet'
);
update core.developer_groups set facts_only_since = null, facts_only_line = null where slug = 'northfield-estates';

-- The global switch (facts_only_global) -----------------------------------------------------------
update ops.feature_flags set enabled = true where key = 'facts_only_global';
set local role anon;
insert into t12_st select 'g_kestrel', api.risk_summary('kestrel-park');
reset role;
update ops.feature_flags set enabled = false where key = 'facts_only_global';

select is(
  (select jsonb_build_object('state', j -> 'display' ->> 'state', 'band', j -> 'band', 'chip', j -> 'chip' ->> 'kind',
                             'url', j -> 'withheld' ->> 'explainer_url')
   from t12_st where k = 'g_kestrel'),
  '{"state": "facts_only", "band": null, "chip": "withheld", "url": "/methodology"}'::jsonb,
  'facts_only_global withholds every band and explains on the methodology page'
);
select ok(
  (select (j -> 'withheld' ->> 'since') is not null from t12_st where k = 'g_kestrel'),
  'facts_only_global: withheld.since is the day the switch was set'
);

-- The clock: overlays and markers follow ops.now() -------------------------------------------------
select set_config('plinth.fixed_now', '2026-10-14 12:00:00+05:30', true);
select is(
  (select jsonb_build_object('pending', jsonb_array_length(r -> 'pending'), 'overlays', r -> 'display' -> 'overlays')
   from (select api.risk_summary('sapphire-grove-phase-1') as r) x),
  '{"pending": 0, "overlays": []}'::jsonb,
  'on 14 Oct (before the Jul–Sep filing was fetched) Sapphire is not re-scoring'
);
select is(
  (select r -> 'pending' from (select api.risk_summary('aurelia-heights-phase-2') as r) x),
  '[]'::jsonb,
  'on 14 Oct the Jul–Sep QPR is not yet due, so nothing is pending'
);
select set_config('plinth.fixed_now', '', true);

-- Draft runs and pending_notice runs are invisible in every state -------------------------------
select is(
  (select count(*)::int from t12_st, pg_temp.t12_strings(j) s where s ~* '\mhigh\M' and k like '%aurelia'),
  0,
  'Aurelia never shows High: normal, S1 or facts-only'
);
select is(
  (select array_agg(distinct j -> 'meta' ->> 'score_run_id') from t12_st where k like '%aurelia'),
  array['f1bf715a-ccdc-57ca-afcc-b5dcda92abe3'],
  'every Aurelia payload is built from the one published run'
);

-- Invariant 8 across all seeded phases, both switches ---------------------------------------------
update ops.feature_flags set enabled = false where key = 'bands_public';
select is(
  (select count(*)::int from core.phases p
     join core.score_runs r on r.phase_id = p.id and r.status = 'published',
     lateral (select api.risk_summary(p.slug) as j) x
   where x.j -> 'band' <> 'null'::jsonb or x.j -> 'frequency' <> 'null'::jsonb or x.j -> 'reasons' <> '[]'::jsonb
      or x.j -> 'what_would_change' <> 'null'::jsonb),
  0,
  'bands_public = false: no phase returns a band, frequency, reasons or what-would-change'
);
update ops.feature_flags set enabled = true where key = 'bands_public';
select is(
  (select count(*)::int from core.phases p
     join core.score_runs r on r.phase_id = p.id and r.status = 'published',
     lateral (select api.risk_summary(p.slug) as j) x
   where r.state <> 'scored' and (x.j -> 'band' <> 'null'::jsonb or x.j -> 'frequency' <> 'null'::jsonb or x.j -> 'reasons' <> '[]'::jsonb)),
  0,
  'a phase that is not scored never returns a band, frequency or reasons'
);
select is(
  (select count(*)::int from core.phases p
     join core.score_runs r on r.phase_id = p.id and r.status = 'published',
     lateral (select api.risk_summary(p.slug) as j) x
   where r.state = 'scored' and x.j -> 'band' ->> 'code' is distinct from r.band::text),
  0,
  'with bands public, every scored phase shows exactly its published band'
);
select * from finish();
rollback;
