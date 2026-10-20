// The Suspense fallback both compare routes use while `searchParams`/`params`
// resolve (Cache Components: "await params/searchParams inside <Suspense>" --
// node_modules/next/dist/docs/01-app/02-guides/migrating-to-cache-components.md).
// Brief, with no heading: CompareScreen owns the page's one <h1>.
export function ComparePlaceholder() {
  return (
    <div className="mx-auto max-w-[79rem] px-4 py-10 sm:px-8">
      <p className="m-0 text-body text-ink2">Loading the comparison…</p>
    </div>
  );
}
