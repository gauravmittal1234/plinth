// The <Suspense> fallback while the session check (reads cookies) resolves.
export function AdminLoading() {
  return (
    <p className="px-6 py-8 text-body" role="status">
      Checking your session…
    </p>
  );
}
