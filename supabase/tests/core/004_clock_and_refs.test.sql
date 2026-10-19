-- T04 · The clock and human refs (BUILD_PLAN §9; DATA_MODEL §0 refs; decision D-4/E-3).
-- ops.now() is frozen only when plinth.env ∈ {test, fixture}; ops.next_ref('C')
-- gives C-1018-01 under the fixed clock and widens past 99.
begin;
create extension if not exists pgtap with schema extensions;
select plan(21);

-- Clock -------------------------------------------------------------------------
select set_config('plinth.env', '', true);
select set_config('plinth.fixed_now', '2026-10-18 12:00:00+05:30', true);
select is(ops.now(), now(), 'no plinth.env: ops.now() is the real clock, even with fixed_now set');

select set_config('plinth.env', 'production', true);
select is(ops.now(), now(), 'plinth.env = production: the real clock');

select set_config('plinth.env', 'test', true);
select set_config('plinth.fixed_now', '', true);
select is(ops.now(), '2026-10-18 12:00:00+05:30'::timestamptz, 'plinth.env = test: frozen at 18 Oct 2026, 12:00 IST by default');
select is(ops.today(), '2026-10-18'::date, 'ops.today() is 18 Oct 2026 under the frozen clock');

select set_config('plinth.env', 'fixture', true);
select set_config('plinth.fixed_now', '2026-10-25 09:00:00+05:30', true);
select is(ops.now(), '2026-10-25 09:00:00+05:30'::timestamptz, 'plinth.env = fixture: honours plinth.fixed_now (advancing the clock)');

select set_config('plinth.fixed_now', '2026-10-18 20:00:00+00', true);
select is(ops.today(), '2026-10-19'::date, 'ops.today() is the IST date (20:00 UTC on 18 Oct is 19 Oct in India)');

-- Refs (counters cleared inside this transaction, so seeded refs do not matter) -----
select set_config('plinth.env', 'test', true);
select set_config('plinth.fixed_now', '', true);
delete from ops.ref_counters;

select is(ops.next_ref('C'), 'C-1018-01', 'ops.next_ref(''C'') = C-1018-01 under the fixed clock');
select is(ops.next_ref('C'), 'C-1018-02', 'the next consent ref the same day is C-1018-02');
select is(ops.next_ref('R'), 'R-1018-01', 'project requests count separately: R-1018-01');

update ops.ref_counters set last = 99 where prefix = 'C';
select is(ops.next_ref('C'), 'C-1018-100', 'NN widens past 99: C-1018-100');

select is(ops.next_ref('CL'), 'CL-001', 'clerical disputes: CL-001');
select is(ops.next_ref('D'), 'D-001', 'fact disputes: D-001');
select is(ops.next_ref('EV'), 'EV-001', 'evidence submissions: EV-001');
select is(ops.next_ref('LN'), 'LN-001', 'legal notices: LN-001');
select is(ops.next_ref('E'), 'E-0001', 'error reports: E-0001');
select is(ops.next_ref('G'), 'G-0001', 'grievances: G-0001');

select set_config('plinth.fixed_now', '2026-10-19 10:00:00+05:30', true);
select is(ops.next_ref('C'), 'C-1019-01', 'a new IST day starts a new C sequence');
select is(ops.next_ref('CL'), 'CL-002', 'running prefixes do not reset by day');
select is(ops.ref_year(), 2026, 'ops.ref_year() is the IST year stored next to the ref');

select throws_ok($$select ops.next_ref('X')$$, 'PT422', 'invalid_input', 'an unknown prefix raises invalid_input (PT422)');

update ops.ref_counters set last = 7 where prefix = 'R' and scope_date = '2026-10-18';
select set_config('plinth.fixed_now', '2026-10-18 12:00:00+05:30', true);
select is(ops.next_ref('R'), 'R-1018-08', 'a seed that bumps the counter makes the next live ref follow it (R-1018-07 → R-1018-08)');

select * from finish();
rollback;
