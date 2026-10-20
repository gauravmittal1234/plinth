-- lead · Free at launch (founder decision, 20 Oct 2026): no Pro plan, no agent fee split.
-- Replaces core.about_json()'s money lines only; everything else in the function body is
-- copied unchanged from 20261102000600_t13_core_pages.sql (never edit a merged migration).
-- Sources: DESIGN.md §5b "Money lines" (restated); OWNERSHIP.md migration-prefix table
-- (this file's 20261103 prefix is "lead").
create or replace function core.about_json()
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_model core.score_models%rowtype := core.current_model();
  v_base jsonb := core.base_rate();
  v_rows jsonb;
  v_illustrative boolean;
  v_brier numeric;
  v_baseline numeric;
begin
  select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
           'band', c.band, 'label', core.band_label(c.band), 'said_low', pg_catalog.trim_scale(c.range_low),
           'said_high', pg_catalog.trim_scale(c.range_high), 'n_projects', c.n_projects, 'n_late', c.n_late,
           'per_100', pg_catalog.trim_scale(c.per_100),
           'inside_range', c.per_100 between c.range_low and c.range_high) order by core.band_step(c.band)),
         pg_catalog.bool_or(c.illustrative), pg_catalog.max(c.brier), pg_catalog.max(c.brier_baseline)
    into v_rows, v_illustrative, v_brier, v_baseline
  from core.calibration c where c.model_version = v_model.version;

  return pg_catalog.jsonb_build_object(
    'schema', 'plinth.about/1',
    'identity', pg_catalog.jsonb_build_object(
      'placeholder_note', 'Founder details are placeholders until the founder supplies them.',
      'photo_line', 'A real photo, supplied by the founder. Never AI-generated.',
      'register', pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('label', 'Company', 'value', '[COMPANY NAME] Private Limited'),
        pg_catalog.jsonb_build_object('label', 'Company number', 'value', 'CIN [CIN]'),
        pg_catalog.jsonb_build_object('label', 'Registered office', 'value', '[REGISTERED ADDRESS], Gurugram, Haryana [PIN]'),
        pg_catalog.jsonb_build_object('label', 'GST', 'value', 'GSTIN [GSTIN]'),
        pg_catalog.jsonb_build_object('label', 'Founder and director', 'value', '[FOUNDER NAME]'),
        pg_catalog.jsonb_build_object('label', 'Who funds us', 'value', '[FUNDING: the founder, or investor names]. No '
          || 'developer owns any part of Plinth, and none ever will.'),
        pg_catalog.jsonb_build_object('label', 'HARERA agent number', 'value', 'None yet. We don''t broker any sale.'))),
    'calibration', pg_catalog.jsonb_build_object(
      'pill', case when v_illustrative then 'Illustrative numbers' end,
      'rows', coalesce(v_rows, '[]'::jsonb),
      'base_rate', v_base || pg_catalog.jsonb_build_object(
        'line', 'About ' || (v_base ->> 'per_100') || ' of 100 past Gurugram projects got their OC more than 12 months '
          || 'late (' || (v_base ->> 'n_late') || ' of ' || (v_base ->> 'n_projects') || ').'),
      'brier_line', 'With a Brier score: ' || core.fmt_num(v_brier) || ' on these ' || (v_base ->> 'n_projects')
        || ' projects. Lower is better. Saying “' || (v_base ->> 'per_100') || ' of 100” for every project would score '
        || core.fmt_num(v_baseline) || '.',
      'first_public_bands_on', (select pg_catalog.min(m.released_on) from core.score_models m)),
    'money', pg_catalog.jsonb_build_object(
      'never_line', 'No developer pays us. Ever.',
      'lines', pg_catalog.jsonb_build_array(
        'Buyers: free. Every band, reason, source, alert and comparison costs nothing while we launch.',
        'Agents: no fee to us. We earn nothing when you choose an agent.',
        'Loans: Loan checks arrive in 2027. No lender pays us in R1.')),
    'response_times', pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object('what', 'Report an error, from any page', 'promise_line', 'We answer within 15 working days.', 'ref_prefix', 'E'),
      pg_catalog.jsonb_build_object('what', 'Clerical fix, for developers', 'promise_line', 'Fix in 2 working days.', 'ref_prefix', 'CL'),
      pg_catalog.jsonb_build_object('what', 'Grievance', 'promise_line', 'Acknowledge in 24 hours. Resolve in 7 days.', 'ref_prefix', 'G'),
      pg_catalog.jsonb_build_object('what', 'Download my data', 'promise_line', 'Ready within 24 hours; the link works for 7 days.', 'ref_prefix', null)),
    'grievance', pg_catalog.jsonb_build_object(
      'officer', '[NAME]', 'contact', '[GRIEVANCE EMAIL]',
      'line', 'We acknowledge within 24 hours and resolve within 7 days.'),
    'coverage', pg_catalog.jsonb_build_object(
      'today', pg_catalog.jsonb_build_object(
        'line', 'Gurugram today.',
        'items', pg_catalog.jsonb_build_array(
          'Gurugram, under-construction RERA projects on Dwarka Expressway and in New Gurugram.')),
      'next', pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object('name', 'Golf Course Extension Road', 'when_line', 'Planned for Dec 2026', 'notify', true),
        pg_catalog.jsonb_build_object('name', 'Loans', 'when_line', 'Loan checks arrive in 2027', 'notify', true),
        pg_catalog.jsonb_build_object('name', 'Resale and transfer checks', 'when_line', 'R2 · planned for Apr–Jun 2027', 'notify', true),
        pg_catalog.jsonb_build_object('name', 'Help at possession: OC, final demand, delay interest',
          'when_line', 'R3 · planned for Jul–Sep 2027', 'notify', true),
        pg_catalog.jsonb_build_object('name', 'Noida and Greater Noida West', 'when_line', 'R3 · planned for Jul–Sep 2027', 'notify', true))),
    'meta', pg_catalog.jsonb_build_object(
      'data_as_of', core.data_as_of(),
      'generated_at', core.fmt_timestamp(ops.now()),
      'promise_line', 'No developer pays us. Ever.',
      'disclaimer_line', 'Our opinion, based on public records. Not a credit rating. Not issued by any RERA.')
  );
end
$$;
comment on function core.about_json() is 'plinth.about/1 (WebAbout): the identity register (founder placeholders until supplied), the calibration table with the base rate and Brier scores, how we make money (free at launch: no Pro plan, no agent fee; "Loan checks arrive in 2027"), response times, the grievance officer and coverage today and next.';
