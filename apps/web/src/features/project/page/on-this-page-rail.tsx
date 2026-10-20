"use client";

// The sticky "On this page" chapter rail (fix-project2.md §1 G-18): the old
// 5-link header nav moved in here, now 10 anchors over the guided story, with
// an ink bar under whichever chapter is in view. A plain, non-floating bar
// (DESIGN §0: no floating pill navigation) that sticks under the site header.
import { useEffect, useRef, useState } from "react";
import { cx } from "./cx";
import { ON_THIS_PAGE_LABEL, PAGE_ANCHORS } from "./copy";

export function OnThisPageRail() {
  const [active, setActive] = useState<string>(PAGE_ANCHORS[0].id);
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const sections = PAGE_ANCHORS.map((a) => document.getElementById(a.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0 || typeof IntersectionObserver === "undefined") return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        }
        if (visible.size === 0) return;
        const top = [...visible.entries()].sort((a, b) => b[1] - a[1])[0];
        if (top) setActive(top[0]);
      },
      { rootMargin: "-112px 0px -70% 0px", threshold: [0, 0.5, 1] },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current?.querySelector(`[data-anchor="${active}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  return (
    <nav
      aria-label={ON_THIS_PAGE_LABEL}
      className="z-10 bg-track py-1 md:sticky md:top-18"
    >
      <ul
        ref={ref}
        role="list"
        className="m-0 flex list-none gap-x-5 overflow-x-auto px-4 py-2 sm:px-8"
      >
        {PAGE_ANCHORS.map((a) => {
          const on = a.id === active;
          return (
            <li key={a.id} data-anchor={a.id} className="shrink-0">
              <a
                href={`#${a.id}`}
                aria-current={on ? "true" : undefined}
                className={cx(
                  "block border-b-2 py-1.5 text-small whitespace-nowrap no-underline",
                  on ? "border-ink font-semibold text-ink" : "border-transparent text-ink2",
                )}
              >
                {a.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
