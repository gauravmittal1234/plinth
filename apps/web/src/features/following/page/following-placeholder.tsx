// The Suspense fallback while the buyer read resolves (Cache Components:
// "a session read can't be prerendered into the static shell" —
// node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md).
export function FollowingPlaceholder() {
  return (
    <div className="mx-auto max-w-[79rem] px-4 py-16 sm:px-8">
      <p className="m-0 text-body text-ink2">Loading what changed since you last looked…</p>
    </div>
  );
}
