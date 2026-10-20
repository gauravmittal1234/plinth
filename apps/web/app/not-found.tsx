import Link from "next/link";
import { SiteShell } from "@/src/shell/site-shell";

// The 404 page (T05), inside the site shell.
export default function NotFound() {
  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-[79rem] px-4 py-16 sm:px-8 sm:py-30">
        <h1 className="m-0 font-display text-h1 font-extrabold">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-5 mb-0 max-w-measure text-lead">
          The link may be old, or we don&apos;t cover that project yet.{" "}
          <Link href="/search" className="underline">
            Search projects
          </Link>
        </p>
      </div>
    </SiteShell>
  );
}
