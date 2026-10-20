// The Suspense fallback while the buyer's data resolves (Cache Components:
// `who_has_my_number` is a buyer read, so it calls `connection()` and must
// sit inside a <Suspense> boundary -- node_modules/next/dist/docs
// migrating-to-cache-components.md). Brief, with no heading: PrivacyScreen
// owns the page's one <h1> (compare/page/compare-placeholder.tsx precedent).
export function PrivacyPlaceholder() {
  return (
    <div className="mx-auto max-w-[79rem] px-4 py-10 sm:px-8">
      <p className="m-0 text-body text-ink2">Loading your privacy centre…</p>
    </div>
  );
}
