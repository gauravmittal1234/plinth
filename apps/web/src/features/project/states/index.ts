// Stub (T20a creates it; T20c fills it in — WORK_BREAKDOWN §4 T20c, OWNERSHIP.md).
// WebProjectStates: Severe, Stalled, Limited history, Not scored, Stale,
// Re-scoring and Facts-only, previewed on the project route with `?state=`
// (WORK_BREAKDOWN §2.1 "WebProjectStates"). T16's fixture adapter already
// understands a `fixtureState` option on `projectPage`/`riskSummary` (e.g.
// `{ fixtureState: "facts_only" }`, INTEGRATION_NOTES); this folder is where
// T20c reads `searchParams.state` and renders each state's own instrument.
export {};
