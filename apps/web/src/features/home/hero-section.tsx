// Hero (product/design/artboards/WebHome.dc.html; DESIGN §4a.5). A full-bleed
// photo, the two-line display headline, and the hero's signature (HeroSearch).
import type { RiskSummary } from "@/src/data";
import Link from "next/link";
import Image from "next/image";
import { HeroSearch } from "./hero-search";
import { HERO_PHOTO } from "./images";

export function HeroSection({ defaultSummary }: { defaultSummary: RiskSummary }) {
  return (
    <section aria-labelledby="hero-h" className="relative flex min-h-[55rem] items-end overflow-hidden bg-track">
      <Image
        src={HERO_PHOTO.src}
        alt={HERO_PHOTO.alt}
        priority
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,12,0.10)_0%,rgba(8,14,12,0.30)_38%,rgba(8,14,12,0.86)_100%)]"
      />
      <span className="absolute top-5 right-7 rounded-pill bg-bg-solid/90 px-3 py-1 text-caption">
        Illustrative image
      </span>

      <div className="relative z-10 mx-auto flex w-full max-w-[79rem] flex-wrap items-end justify-between gap-10 px-4 pt-36 pb-16 sm:px-8">
        {/*
         * `text-on-slab` (DESIGN §3 "slab"/"on-slab"): the near-white the
         * kit already uses for light text on a dark ink ground (the
         * footer). The tokens theme resets Tailwind's own palette
         * (`--color-*: initial`), so a literal `text-white` resolves to
         * nothing and the text falls back to inherited `ink` — dark text
         * on a photo scrim is the bug this avoids.
         */}
        <div className="flex min-w-0 flex-1 basis-[36rem] flex-col gap-6 text-on-slab">
          <h1
            id="hero-h"
            className="m-0 font-display text-[clamp(3.5rem,7.5vw,7rem)] leading-[0.94] font-extrabold tracking-[-0.045em]"
          >
            Know before
            <br />
            you book.
          </h1>
          <p className="m-0 max-w-[36ch] text-lead">
            We read every HARERA filing and order for Gurugram. You get the delivery risk and the
            all-in price, with sources.
          </p>

          <HeroSearch defaultSummary={defaultSummary} />

          <p className="m-0 text-body">
            <strong className="font-bold">No developer pays us. Ever.</strong>{" "}
            <Link href="#money" className="font-medium underline underline-offset-[0.2em]">
              How we make money
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
