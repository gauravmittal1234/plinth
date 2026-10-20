// The one place that builds a /search URL, so every interactive affordance
// (tiles, sort, the free-text editor) agrees on the query-string shape.
export function searchHref(q: string, sort?: string | null): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort && sort !== "lowest_risk") params.set("sort", sort);
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}
