# @plinth/calc

Slider-preview ports of the server calculators (BUILD_PLAN §1 rule 3): `emi`, `preEmi`,
`affordTheWait(inputs, plan)` and `capLimit` / `withinCap` (the 10% RERA s.13 cap), plus the
₹ preview formatter (`fmtInrExact`, `fmtInrShort`). The server (`core.afford_the_wait`,
`core.pre_emi`, `supabase/migrations/20261102000400_t13_core_calculators.sql`) stays
canonical — these run on every slider move for an instant preview, and the server's own
answer replaces the preview again the moment it returns. No risk copy, no user-facing lines
beyond the ₹ formatter: every band, reason, frequency and line is the server's.

Arrives in **M3**. Tested against the golden vectors in `packages/fixtures/vectors/`
(`afford_the_wait.json`, `cap.json`, `formatting.json`) — every vector reproduces exactly —
plus two property tests over seeded inputs: a higher rate never lowers the EMI, and a longer
delay never lowers the delay cost. No runtime dependency.

## `affordTheWait(inputs, plan)`

`plan` (`AffordTheWaitPlan`) is read once from the tower's first `AffordTheWait` server
answer, not recomputed on the client: `first_month`/`completion` are the first and last
non-delay `series[].month`, `now_pct`/`end_pct` are the first and last non-delay
`series[].paid_out_pct`. `inputs` (`AffordTheWaitInputs`) are the slider's own values plus
the unit's all-in price. The result mirrors the server's `AffordTheWait` shape
(`loan`, `now`, `by_completion`, `delay`, `delay_options`, `after_keys`, `series`) minus its
composed copy (`answer_line`, `assumptions`, `frequency_line`, `framing_line`) — a caller
formats the numbers it needs with `fmtInrExact`/`fmtInrShort`.
