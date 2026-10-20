-- T04 · Formatters against the §5b vectors (DESIGN §2.7 and §5b; API_CONTRACTS §1 "Money").
-- ₹ in lakh/crore with Indian grouping, "18 Oct 2026", "Dec 2027", "Apr–Jun 2026".
-- When T03's packages/fixtures/vectors land, their format vectors join this file.
begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

-- Short rupees ---------------------------------------------------------------------
select is(ops.fmt_inr_short(27400400), '₹2.74 Cr', 'all-in ₹2,74,00,400 → ₹2.74 Cr');
select is(ops.fmt_inr_short(23500000), '₹2.35 Cr', 'quoted base → ₹2.35 Cr');
select is(ops.fmt_inr_short(21000000), '₹2.10 Cr', 'Kestrel quoted → ₹2.10 Cr (keeps the trailing zero)');
select is(ops.fmt_inr_short(19000000), '₹1.90 Cr', 'Coral all-in → ₹1.90 Cr');
select is(ops.fmt_inr_short(2440000), '₹24.4 L', '10% cap → ₹24.4 L');
select is(ops.fmt_inr_short(2410000), '₹24.1 L', '12-month delay → ₹24.1 L');
select is(ops.fmt_inr_short(4810000), '₹48.1 L', '24-month delay → ₹48.1 L');
select is(ops.fmt_inr_short(290000), '₹2.9 L', 'PLC → ₹2.9 L');
select is(ops.fmt_inr_short(300000), '₹3.0 L', 'transfer fee → ₹3.0 L (one decimal always)');
select is(ops.fmt_inr_short(490000), '₹4.9 L', 'PLC + club waived → ₹4.9 L');
select is(ops.fmt_inr_short(9995000), '₹1.00 Cr', '₹99.95 L rounds up into crore, never "₹100.0 L"');
select is(ops.fmt_inr_short(55000), '₹55,000', 'below a lakh the exact amount is shown');

-- Exact rupees (Indian grouping) ------------------------------------------------------
select is(ops.fmt_inr_exact(16720000), '₹1,67,20,000', 'booking price → ₹1,67,20,000');
select is(ops.fmt_inr_exact(27400400), '₹2,74,00,400', 'all-in exact → ₹2,74,00,400');
select is(ops.fmt_inr_exact(118077), '₹1,18,077', 'rent + pre-EMI → ₹1,18,077');
select is(ops.fmt_inr_exact(1100000), '₹11,00,000', 'EOI → ₹11,00,000');
select is(ops.fmt_inr_exact(18900), '₹18,900', 'per sq ft → ₹18,900');
select is(ops.fmt_inr_exact(999), '₹999', 'Pro price → ₹999');
select is(ops.fmt_inr_exact(0), '₹0', 'zero → ₹0');

-- Dates, months, quarters ---------------------------------------------------------------
select is(ops.fmt_date('2026-10-18'::date), '18 Oct 2026', 'design today → 18 Oct 2026');
select is(ops.fmt_date('2026-10-02'::date), '2 Oct 2026', 'no leading zero → 2 Oct 2026');
select is(ops.fmt_month('2027-12-01'::date), 'Dec 2027', 'original completion → Dec 2027');
select is(ops.fmt_date_precision('2027-12-01'::date, 'month'), 'Dec 2027', 'month precision → Dec 2027');
select is(ops.fmt_quarter('2026-Q2'), 'Apr–Jun 2026', '2026-Q2 → Apr–Jun 2026 (en dash)');
select is(ops.fmt_quarter('2026-Q3'), 'Jul–Sep 2026', '2026-Q3 → Jul–Sep 2026');
select is(ops.fmt_quarter('2024-Q4'), 'Oct–Dec 2024', '2024-Q4 → Oct–Dec 2024');
select is(ops.quarter_of('2026-05-10'::date), '2026-Q2', 'quarter_of(10 May 2026) → 2026-Q2');
select throws_ok($$select ops.fmt_quarter('2026-Q5')$$, '22023', null, 'a malformed quarter key is rejected');

select * from finish();
rollback;
