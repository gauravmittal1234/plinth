// @plinth/calc: TS slider-preview ports of the server's calculators (BUILD_PLAN §1 rule 3)
// — EMI, pre-EMI, Afford the wait and the 10% cap — plus the ₹ preview formatter. No runtime
// dependency; tested against packages/fixtures/vectors/{afford_the_wait,cap,formatting}.json.
// The server stays canonical: these previews update a slider instantly, and the server's own
// answer replaces the preview the moment it returns.
export {
  affordTheWait,
  type AffordTheWaitDelay,
  type AffordTheWaitInputs,
  type AffordTheWaitLevel,
  type AffordTheWaitLoan,
  type AffordTheWaitPlan,
  type AffordTheWaitResult,
  type AffordTheWaitSeriesPoint,
  type YearMonth,
} from "./afford-the-wait";
export { capLimit, withinCap } from "./cap-limit";
export { emi } from "./emi";
export { fmtInrExact, fmtInrShort } from "./money";
export { preEmi } from "./pre-emi";
