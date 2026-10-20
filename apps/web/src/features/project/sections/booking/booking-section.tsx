// Stub (T20a creates it; T20b fills it in — WORK_BREAKDOWN §4 T20b, OWNERSHIP.md).
// "What else before booking?": payment plans, home loans, NRI and selling-
// before-possession (ProjectPage.before_booking).
import { StubSection } from "../../page/stub-section";

export function BookingSection() {
  return <StubSection id="book" heading="What else before booking?" task="T20b" tone="track" />;
}
