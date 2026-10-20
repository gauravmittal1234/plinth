import Link from "next/link";
import { FOOTER_NAV } from "./nav";

/**
 * The footer slab, a designed close (DESIGN §0): the promise, the disclaimer,
 * a few links, then the name "Plinth" at full width on the slab, like the base
 * course a building stands on. Layout copy from WebMethodology / WebHome.
 */
export function SiteFooter() {
  return (
    <footer className="flex flex-col overflow-hidden bg-slab text-on-slab">
      <div className="mx-auto flex w-full max-w-[79rem] flex-col gap-10 px-4 pt-22 sm:px-8 sm:pt-30">
        <div className="flex flex-wrap items-end justify-between gap-x-16 gap-y-6">
          <p className="m-0 max-w-[15ch] font-display text-[2.25rem] leading-[1.08] font-extrabold tracking-[-0.03em]">
            No developer pays us. Ever.
          </p>
          <p className="m-0 max-w-[54ch] text-[1.0625rem] leading-[1.55] text-on-slab2">
            Our opinion, based on public records. Not a credit rating. Not issued by any RERA.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-[0.9375rem]">
          {FOOTER_NAV.map((l) => (
            <Link key={l.href} href={l.href} className="text-on-slab underline underline-offset-4">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <p
        aria-hidden="true"
        className="m-0 mt-14 translate-y-[0.06em] px-4 text-center font-display text-[length:clamp(7.5rem,36vw,32.5rem)] leading-[0.74] font-extrabold tracking-[-0.06em] whitespace-nowrap"
      >
        Plinth
      </p>
    </footer>
  );
}
