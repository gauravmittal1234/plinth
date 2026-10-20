// Stub (T20a creates it; T20b fills it in — WORK_BREAKDOWN §4 T20b, OWNERSHIP.md).
// "Before RERA · from court orders and news" (fix-project2.md §1 G-16): T20a's
// Records section (sections/records/records-section.tsx) already renders a
// working `<details>` expander straight from `ProjectPage.pre_rera`, so the
// page isn't missing this content. T20b owns this path to move that markup
// here if it wants the dedicated component, or to extend it (e.g. the AppRisk
// parity notes in fix-project2.md).
export function PreReraPlaceholder() {
  return null;
}
