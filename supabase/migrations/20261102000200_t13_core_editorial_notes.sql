-- T13 · API reads B 2/6: core.editorial_notes, Plinth's own short notes on a record.
-- Sources: API_CONTRACTS §4.2–§4.4 (hero image, getting around, QPR notes, the developer
-- line on a card); DESIGN §4c (image slots), §5b (the values below); DATA_MODEL §0 (lanes).
--
-- Some lines on the M1 pages are neither a public record nor something a developer said:
-- Plinth's road-distance estimates, the illustrative image slot, a note on one QPR ("Tower A
-- slab 9 cast."), the demand a developer sent ahead of its filings, the number of companies
-- linked into a group. They live here, one row per subject and slot, each with its lane and
-- source, and never feed a band (core.score_* never reads this table). The admin editor
-- (M3) writes them; nothing else does.
--
-- R1 fixture rows (fixture = true). The §5b values below are the fixture world's notes. They
-- are keyed by the fixture ids (uuid v5 from packages/fixtures/canonical), so they never
-- attach to a real record, and core.editorial() returns them only in the fixture world
-- (ops.is_frozen_env()). Handoff T03: move them to canonical + a seedmap; a later migration
-- then deletes the rows where fixture is true.

create table core.editorial_notes (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('phase', 'group', 'filing', 'completion', 'pre_rera')),
  subject_id uuid not null,
  slot text not null check (slot in (
    'hero_image', 'getting_around', 'demand', 'move_in_estimate', 'name_promoter',
    'linked_companies', 'units_history', 'signatory_verified', 'note', 'year')),
  lane core.lane,
  body jsonb not null check (pg_catalog.jsonb_typeof(body) = 'object'),
  as_of date,
  source text not null,
  fixture boolean not null default false,
  created_at timestamptz not null default now(),
  unique (subject_type, subject_id, slot)
);
comment on table core.editorial_notes is 'Plinth''s own notes on a record (image slot, road-distance estimates, a QPR note, a demand ahead of the filings, linked companies, units history). One row per subject and slot, with lane and source. Never a band input. fixture = true rows are the R1 §5b world, read only when ops.is_frozen_env().';
comment on column core.editorial_notes.subject_type is 'pii:C0 · phase, group, filing (core.qpr_filings), completion (core.completion_events) or pre_rera (core.pre_rera_records).';
comment on column core.editorial_notes.subject_id is 'pii:C0 · The id of the subject row (no FK: notes may be written before the record they annotate is loaded).';
comment on column core.editorial_notes.slot is 'pii:C0 · What the note is: hero_image {url}, getting_around {items, commute}, demand {tower, slab_no, sent_on}, move_in_estimate {low_inr, high_inr}, name_promoter {}, linked_companies {count}, units_history {periods}, signatory_verified {}, note {line}, year {year}.';
comment on column core.editorial_notes.lane is 'pii:C0 · The tone lane the note is shown in (our_estimate for estimates; null for layout notes).';
comment on column core.editorial_notes.body is 'pii:C0 · The note''s fields (see slot).';
comment on column core.editorial_notes.as_of is 'pii:C0 · When the note was true (e.g. Oct 2026 for road distances).';
comment on column core.editorial_notes.source is 'pii:C0 · Where the note comes from (DESIGN §5b for fixture rows; the editor''s source otherwise).';
comment on column core.editorial_notes.fixture is 'pii:C0 · True for the R1 §5b fixture rows: read only in the fixture world.';

alter table core.editorial_notes enable row level security;
create trigger editorial_notes_audit
  after insert or update or delete on core.editorial_notes
  for each row execute function ops.audit_trigger();

create function core.editorial(p_subject_type text, p_subject_id uuid, p_slot text)
returns core.editorial_notes
language sql
stable
set search_path = ''
as $$
  select n.*
  from core.editorial_notes n
  where n.subject_type = p_subject_type
    and n.subject_id = p_subject_id
    and n.slot = p_slot
    and (not n.fixture or ops.is_frozen_env())
$$;
comment on function core.editorial(text, uuid, text) is 'The editorial note for a subject and slot, or a null row. Fixture rows only in the fixture world (ops.is_frozen_env()).';

-- ---------------------------------------------------------------------------
-- R1 fixture rows (DESIGN §5b). Ids: packages/fixtures/canonical (catalogue.json).
-- ---------------------------------------------------------------------------
insert into core.editorial_notes (subject_type, subject_id, slot, lane, body, as_of, source, fixture) values
  -- Image slots (DESIGN §4c): illustrative hero images; Cedar Walk, Phase 2 has none.
  ('phase', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'hero_image', null, '{"url": "/media/heroAurelia.jpg"}', null, 'DESIGN §4c image slots', true),
  ('phase', '5ddd2261-7682-53da-86ae-b011d465a066', 'hero_image', null, '{"url": "/media/heroKestrel.jpg"}', null, 'DESIGN §4c image slots', true),
  ('phase', '6df6fbdc-d039-5189-ad91-d172d36b8f92', 'hero_image', null, '{"url": "/media/heroSapphire.jpg"}', null, 'DESIGN §4c image slots', true),
  ('phase', '2181fcaf-bddf-527d-ab21-a0c822239003', 'hero_image', null, '{"url": "/media/heroCoral.jpg"}', null, 'DESIGN §4c image slots', true),
  ('phase', '4d3facc3-fa9a-54d9-bc87-f59b8c2fdd39', 'hero_image', null, '{"url": "/media/heroLaurel.jpg"}', null, 'DESIGN §4c image slots', true),
  ('phase', 'f9d6975e-1ee5-539e-8a4a-8d3ac9adc709', 'hero_image', null, '{"url": "/media/heroJuniper.jpg"}', null, 'DESIGN §4c image slots', true),
  ('phase', '24792397-b6d0-5253-92f4-5184a56bd2fc', 'hero_image', null, '{"url": "/media/heroHeron.jpg"}', null, 'DESIGN §4c image slots', true),

  -- Getting around: Plinth estimate, road distance, Oct 2026 (DESIGN §5b).
  ('phase', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'getting_around', 'our_estimate',
   '{"items": ["Dwarka Expressway: 0.8 km", "Cyber City: 18 km, 35–55 min at 9 am", "IGI Airport T3: 22 km, 30–45 min", "Schools: 3 within 3 km · metro: none within 5 km"], "commute": "18 km, 35–55 min"}',
   '2026-10-01', 'DESIGN §5b (Aurelia getting around)', true),
  ('phase', '5ddd2261-7682-53da-86ae-b011d465a066', 'getting_around', 'our_estimate',
   '{"items": ["Cyber City: 19 km, 35–50 min at 9 am", "IGI Airport T3: 13 km, 20–30 min"], "commute": "19 km, 35–50 min"}',
   '2026-10-01', 'DESIGN §5b (getting around)', true),
  ('phase', '6df6fbdc-d039-5189-ad91-d172d36b8f92', 'getting_around', 'our_estimate',
   '{"items": ["Cyber City: 20 km, 40–60 min at 9 am", "IGI Airport T3: 16 km, 25–40 min"], "commute": "20 km, 40–60 min"}',
   '2026-10-01', 'DESIGN §5b (getting around)', true),
  ('phase', '2181fcaf-bddf-527d-ab21-a0c822239003', 'getting_around', 'our_estimate',
   '{"items": ["Cyber City: 24 km, 45–70 min at 9 am", "IGI Airport T3: 27 km, 40–60 min"], "commute": "24 km, 45–70 min"}',
   '2026-10-01', 'DESIGN §5b (getting around)', true),
  ('phase', 'f9d6975e-1ee5-539e-8a4a-8d3ac9adc709', 'getting_around', 'our_estimate',
   '{"items": ["Cyber City: 19 km, 40–55 min at 9 am", "IGI Airport T3: 15 km, 25–35 min"], "commute": "19 km, 40–55 min"}',
   '2026-10-01', 'DESIGN §5b (getting around)', true),

  -- A demand ahead of the filings: Tower A slab 12 demanded on 10 Oct 2026 (latest QPR: slab 9).
  ('phase', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'demand', 'from_developer',
   '{"tower": "A", "slab_no": 12, "sent_on": "2026-10-10"}', '2026-10-10', 'DESIGN §5b (demand for slab 12, 10 Oct 2026)', true),
  -- Plinth's move-in estimate around the offer of possession (cost sheet of 2 Oct 2026).
  ('phase', '4da0daeb-835b-54d5-9c09-a23ee9cb4b36', 'move_in_estimate', 'our_estimate',
   '{"low_inr": 1200000, "high_inr": 1800000}', '2026-10-02', 'DESIGN §5b (about ₹12–18 L at possession)', true),
  -- Cards name the promoter company of a group phase that is not scored yet (DESIGN §5b: Heron Point, Phase 2).
  ('phase', '24792397-b6d0-5253-92f4-5184a56bd2fc', 'name_promoter', null, '{}', null, 'DESIGN §5b (Heronstone Projects, a Northfield Estates group company)', true),

  -- Northfield Estates: 9 linked companies, a verified signatory, the units base history (C-12).
  ('group', '685d5493-be17-5e27-9b3b-50503a89d0cd', 'linked_companies', 'records_show', '{"count": 9}', '2026-10-14', 'DESIGN §5 (9 linked companies)', true),
  ('group', '685d5493-be17-5e27-9b3b-50503a89d0cd', 'signatory_verified', null, '{}', '2025-12-02', 'DESIGN §5b (claimed by Northfield, verified signatory)', true),
  ('group', '685d5493-be17-5e27-9b3b-50503a89d0cd', 'units_history', 'records_show',
   '{"periods": [{"units": 2980, "to": "2025-12"}, {"units": 3400, "from_phase_id": "24792397-b6d0-5253-92f4-5184a56bd2fc"}]}',
   '2026-10-14', 'DESIGN §5b · Fixture decisions, round 2 (C-12)', true),

  -- Notes on single QPR filings (DESIGN §5b quarter table and filing dates).
  ('filing', '32164a6d-0346-5214-b288-8a6ae9d05393', 'note', null, '{"line": "Filed 38 days late, on 22 Feb 2026."}', '2026-02-22', 'DESIGN §5b (Aurelia Oct–Dec 2025 QPR)', true),
  ('filing', '53193a8e-911b-5a57-ad05-cb9be591ed86', 'note', null, '{"line": "Tower A slab 9 cast."}', '2026-03-31', 'DESIGN §5b (Aurelia Jan–Mar 2026 QPR)', true),
  ('filing', '497cec88-bfca-5820-8bbf-b528ce648338', 'note', null, '{"line": "Filed 15 Jul 2026, on time."}', '2026-07-15', 'DESIGN §5b (Aurelia Apr–Jun 2026 QPR)', true),
  ('filing', '251d34ed-8582-5ddd-978e-2b13633712eb', 'note', null, '{"line": "Filed 27 Jul 2026, 12 days late."}', '2026-07-27', 'DESIGN §5b (Sapphire Apr–Jun 2026 QPR)', true),
  ('filing', 'cc08d422-ed8f-5ec1-8c5b-3d2118101720', 'note', null, '{"line": "Filed 12 Oct 2026, on time."}', '2026-10-12', 'DESIGN §5b (Kestrel Jul–Sep 2026 QPR)', true),
  ('filing', 'b3830de5-3245-520f-af08-ba79481e6381', 'note', null, '{"line": "Filed 14 Apr 2026. The Apr–Jun and Jul–Sep 2026 QPRs are not on HARERA."}', '2026-10-18', 'DESIGN §5b (Coral stale QPRs)', true),

  -- Aurelia Heights, Phase 1: the COVID extension (DESIGN §5b track record table).
  ('completion', '6f466dd5-cb2e-5ec5-b4ea-51f27c39ccf3', 'note', null, '{"line": "That is 21 months after the 6-month COVID extension."}', '2023-03-01', 'DESIGN §5b (27 months late, 21 after the 6-month COVID extension)', true),
  -- Larch Enclave, Sector 21: built in 2004 (pre-RERA list).
  ('pre_rera', '922dea8f-1084-5308-abe2-76af9b7a9fa4', 'year', null, '{"year": "2004"}', null, 'DESIGN §5b (pre-RERA list)', true);

-- PII tags (DATA_MODEL §0).
do $$
declare
  r record;
begin
  for r in
    select a.attname, pg_catalog.col_description(c.oid, a.attnum) as note
    from pg_catalog.pg_attribute a
    join pg_catalog.pg_class c on c.oid = a.attrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'core' and c.relname = 'editorial_notes'
      and a.attnum > 0 and not a.attisdropped
      and coalesce(pg_catalog.col_description(c.oid, a.attnum), '') !~ '^pii:C[0-3]'
  loop
    execute format('comment on column core.editorial_notes.%I is %L', r.attname,
      case when r.note is null then 'pii:C0' else 'pii:C0 · ' || r.note end);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Lockdown sweep (T04 pattern, BUILD_PLAN §12.1), then the explicit api grants.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all sequences in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;
revoke all on all functions in schema core, ws, app, comms, pii, ops, api from public, anon, authenticated;

grant execute on function api.flags() to anon, authenticated, service_role;
grant execute on function api.risk_summary(text) to anon, authenticated, service_role;
grant execute on function api.evidence(text) to anon, authenticated, service_role;
