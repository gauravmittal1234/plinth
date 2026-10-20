-- T12 · api.evidence(p_fact_id): the evidence drawer (API_CONTRACTS §4.6, F-06).
-- Grants; the drawer for Aurelia's 4 reason facts; Developer says on a fact; corrections;
-- errors; buyer uploads and not-yet-learned facts never show; reasons are named only where
-- buyers see them. The deep comparison with expected/evidence is `test:api`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(27);

-- The function and its grants --------------------------------------------------------------
select ok(to_regprocedure('api.evidence(text)') is not null, 'api.evidence(text) exists (fact ids are opaque strings)');
select ok(
  (select prosecdef and provolatile = 's' and prorettype = 'jsonb'::regtype
   from pg_catalog.pg_proc where oid = 'api.evidence(text)'::regprocedure),
  'it is SECURITY DEFINER, STABLE and returns jsonb'
);
select ok(
  has_function_privilege('anon', 'api.evidence(text)', 'EXECUTE')
    and has_function_privilege('authenticated', 'api.evidence(text)', 'EXECUTE')
    and has_function_privilege('service_role', 'api.evidence(text)', 'EXECUTE'),
  'anon, authenticated and service_role may execute it'
);
select ok(
  not exists (
    select 1 from aclexplode((select proacl from pg_catalog.pg_proc where oid = 'api.evidence(text)'::regprocedure)) a
    where a.grantee = 0
  ),
  'EXECUTE is never granted to PUBLIC'
);
select ok(
  not has_function_privilege('anon', 'core.evidence_json(uuid)', 'EXECUTE'),
  'the core helper behind it stays private'
);

create temp table t12_ev (k text primary key, j jsonb);
grant all on t12_ev to public;

-- The developer's claim about the missing Jul–Sep 2026 QPR (canonical/developer_content.json).
insert into ws.developer_claims (id, phase_id, text, said_on, check_by, verified_state, linked_fact_id, public)
values ('2fd1909d-9db4-50e4-ac53-12e5bb604ad4', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'Filed on 12 Oct 2026.',
        '2026-10-15', '2026-11-05', 'unverified', 'bc3ff166-6be3-5805-8401-0dbd4260c1ea', true)
on conflict (id) do nothing;

set local role anon;
select set_config('request.jwt.claims', '', true);
insert into t12_ev select 'qpr', api.evidence('196cb4f5-27eb-57a5-99f8-e5ab1b599c93');
insert into t12_ev select 'register', api.evidence('dff74c62-2384-5736-88b1-02fac3a33a69');
insert into t12_ev select 'orders', api.evidence('d56b2adf-6ea3-598a-8cef-cbd1b0c74895');
insert into t12_ev select 'track', api.evidence('145c288f-31dd-5955-9677-170f82ffd80c');
insert into t12_ev select 'missing', api.evidence('bc3ff166-6be3-5805-8401-0dbd4260c1ea');
insert into t12_ev select 'upper', api.evidence('196CB4F5-27EB-57A5-99F8-E5AB1B599C93');
reset role;

-- Reason 1: the Apr–Jun 2026 QPR (API_CONTRACTS §4.6) ------------------------------------------
select is(
  (select (j - 'snapshot' - 'report_error') from t12_ev where k = 'qpr'),
  '{"schema": "plinth.evidence/1", "fact_id": "196cb4f5-27eb-57a5-99f8-e5ab1b599c93",
    "chip": "HARERA QPR · Apr–Jun 2026", "lane": "records_show",
    "document": "HARERA · Quarterly Progress Report · Apr–Jun 2026 · Aurelia Heights, Phase 2",
    "dates_line": "Filed 15 Jul 2026 · we fetched it 16 Jul 2026 · last checked live 14 Oct 2026",
    "page": "p. 3", "extract": "Units booked: 72% of total. Physical progress, all towers: 41%.",
    "read_line": "Read by two AI extractors; they matched. Checked by a person on 16 Jul 2026.",
    "used_in": ["Reason 1 of Delivery risk", "Records → QPR filings"], "developer_says": null,
    "corrections_line": "No corrections.", "official_url": "https://haryanarera.gov.in", "view_label": "View on HARERA"}'::jsonb,
  'the QPR drawer: source, document, dates, page, extract, how it was read, where it is used'
);
select is(
  (select j -> 'snapshot' from t12_ev where k = 'qpr'),
  '{"sha256_short": "095ac484…0e4c2844", "fetched_at": "2026-07-16T00:00:00+05:30"}'::jsonb,
  'the sealed snapshot: short hash and fetch time (IST)'
);
select is(
  (select j -> 'report_error' from t12_ev where k = 'qpr'),
  '{"ref_prefix": "E", "sla_line": "We answer within 15 working days."}'::jsonb,
  '"Report an error in this row" opens an E- reference'
);
select is((select j from t12_ev where k = 'upper'), (select j from t12_ev where k = 'qpr'), 'a fact id is matched case-insensitively');

-- Reason 2: the QPR register, with an upheld correction ------------------------------------------
select is(
  (select j ->> 'corrections_line' from t12_ev where k = 'register'),
  'Corrected 3 Sep 2026 after dispute D-118 (upheld): the Apr–Jun 2026 QPR was first marked late; it was filed 15 Jul 2026, on time.',
  'an upheld dispute shows as a dated correction line'
);
select is(
  (select jsonb_build_object('document', j -> 'document', 'dates', j -> 'dates_line', 'used_in', j -> 'used_in')
   from t12_ev where k = 'register'),
  '{"document": "HARERA · QPR filing register for this project · every quarter since registration (Dec 2022)",
    "dates": "Register checked live 14 Oct 2026",
    "used_in": ["Reason 2 of Delivery risk", "Records → QPR filings"]}'::jsonb,
  'the register drawer'
);

-- Reason 3: complaint orders, with a dispute under review --------------------------------------
select is(
  (select j ->> 'corrections_line' from t12_ev where k = 'orders'),
  'No corrections. A dispute about this count, D-127 (10 Oct 2026), is under review.',
  'an open dispute is named after "No corrections."'
);
select is(
  (select jsonb_build_object('document', j -> 'document', 'dates', j -> 'dates_line', 'used_in', j -> 'used_in')
   from t12_ev where k = 'orders'),
  '{"document": "HARERA · complaint orders for this RERA number · Oct 2024 to Oct 2026",
    "dates": "Orders search run 14 Oct 2026 · latest order 9 Oct 2026",
    "used_in": ["Reason 3 of Delivery risk"]}'::jsonb,
  'the orders drawer: a 24-month window and the latest order'
);

-- Reason 4: the group's track record (a group fact cited by two phases) --------------------------
select is(
  (select jsonb_build_object('chip', j -> 'chip', 'document', j -> 'document', 'dates', j -> 'dates_line',
                             'used_in', j -> 'used_in', 'official_url', j -> 'official_url')
   from t12_ev where k = 'track'),
  '{"chip": "HARERA · DTCP OC records",
    "document": "HARERA project pages and DTCP occupation certificates · 6 Northfield Estates group projects",
    "dates": "Checked 14 Oct 2026",
    "used_in": ["Reason 4 of Delivery risk", "Developer track record"],
    "official_url": "https://haryanarera.gov.in"}'::jsonb,
  'the track-record drawer names its use on the most severe phase that cites it (Aurelia, not Cedar Walk)'
);

-- Developer says on the fact it is about -----------------------------------------------------
select is(
  (select j -> 'developer_says' from t12_ev where k = 'missing'),
  '{"text": "Filed on 12 Oct 2026.", "verified": false, "said_on": "2026-10-15", "check_by": "2026-11-05",
    "line": "Developer says: filed 12 Oct, not yet verified."}'::jsonb,
  'the missing-QPR drawer carries the developer''s claim, as a claim'
);
select is(
  (select jsonb_build_object('chip', j -> 'chip', 'document', j -> 'document', 'dates', j -> 'dates_line', 'used_in', j -> 'used_in')
   from t12_ev where k = 'missing'),
  '{"chip": "HARERA QPR register", "document": "HARERA · QPR filing register for this project · Jul–Sep 2026",
    "dates": "Register checked live 18 Oct 2026", "used_in": ["Records → QPR filings"]}'::jsonb,
  'the missing-QPR drawer (a pending fact, not a reason)'
);

-- Errors (API_CONTRACTS §1) ------------------------------------------------------------------------
set local role anon;
select throws_ok($$select api.evidence('00000000-0000-4000-8000-000000000000')$$, 'PT404', 'not_found', 'an unknown fact id is not_found');
select throws_ok($$select api.evidence('not-a-fact')$$, 'PT404', 'not_found', 'a malformed id is not_found (ids are opaque)');
select throws_ok($$select api.evidence('')$$, 'PT422', 'invalid_input', 'an empty id is invalid_input');
select throws_ok($$select api.evidence(null)$$, 'PT422', 'invalid_input', 'a null id is invalid_input');
select throws_ok($$select 1 from core.facts limit 1$$, '42501', null, 'anon still cannot read core.facts directly');
reset role;

-- Private and future facts never show --------------------------------------------------------
insert into core.facts (id, subject_type, subject_id, attribute, value, as_of, learned_at, method, lane)
values
  ('00000000-0000-4000-8000-0000000012a1', 'phase', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'buyer.receipt',
   '{"amount_inr": 1100000}', '2026-10-18', '2026-10-18 09:00:00+05:30', 'manual', 'buyer_upload'),
  ('00000000-0000-4000-8000-0000000012a2', 'phase', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'qpr.missing',
   '{"quarter": "2026-Q4", "due_on": "2027-01-15"}', '2027-01-16', '2027-01-16 09:00:00+05:30', 'parser', 'records_show');
set local role anon;
select throws_ok(
  $$select api.evidence('00000000-0000-4000-8000-0000000012a1')$$, 'PT404', 'not_found',
  'a buyer upload is never shown in the public drawer'
);
select throws_ok(
  $$select api.evidence('00000000-0000-4000-8000-0000000012a2')$$, 'PT404', 'not_found',
  'a fact learned after ops.now() is not shown yet'
);
reset role;

-- Reasons are named only where buyers see them ---------------------------------------------------
update ops.feature_flags set enabled = false where key = 'bands_public';
select is(
  api.evidence('145c288f-31dd-5955-9677-170f82ffd80c') -> 'used_in',
  '["Developer track record"]'::jsonb,
  'bands not public: the drawer names no Delivery risk reason'
);
update ops.feature_flags set enabled = true where key = 'bands_public';

update core.developer_groups set facts_only_since = '2026-10-18' where slug = 'northfield-estates';
select is(
  api.evidence('196cb4f5-27eb-57a5-99f8-e5ab1b599c93') -> 'used_in',
  '["Records → QPR filings"]'::jsonb,
  'facts-only: the drawer names no Delivery risk reason; the fact itself stays'
);
update core.developer_groups set facts_only_since = null where slug = 'northfield-estates';

-- Every reason source opens a drawer -----------------------------------------------------------
select is(
  (select count(*)::int
   from core.score_runs r
   join core.score_reasons sr on sr.run_id = r.id
   cross join lateral unnest(sr.fact_ids) as f(id)
   where r.status = 'published'
     and api.evidence(f.id::text) ->> 'schema' is distinct from 'plinth.evidence/1'),
  0,
  'every fact cited by a published reason has an evidence drawer'
);
select is(
  (select count(*)::int
   from core.score_runs r
   join core.score_reasons sr on sr.run_id = r.id
   cross join lateral unnest(sr.fact_ids) as f(id)
   where r.status = 'published'
     and not (api.evidence(f.id::text) -> 'used_in') ? ('Reason ' || sr.rank || ' of Delivery risk')
     and r.phase_id = (select phase_id from core.score_runs x
                       join core.score_reasons y on y.run_id = x.id
                       where x.status = 'published' and f.id = any (y.fact_ids)
                       order by core.band_step(x.band) desc nulls last,
                                (select slug from core.phases where id = x.phase_id)
                       limit 1)),
  0,
  'each drawer names the reason that cites it (on its most severe phase)'
);

select * from finish();
rollback;
