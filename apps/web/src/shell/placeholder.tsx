import type { Metadata } from "next";
import { Fragment, type ReactNode } from "react";
import { screenByName, type ScreenName } from "./screens";

/**
 * The stub every §2.1 route renders until its task replaces it (WORK_BREAKDOWN
 * §1 rule 4: stubs, then fill). It names the artboard, the routes and the task,
 * so a reviewer can open any URL and see what belongs there.
 */
export function Placeholder({
  artboard,
  standalone = false,
  children,
}: {
  artboard: ScreenName;
  /** True for top-level routes outside a route group: renders its own <main>. */
  standalone?: boolean;
  /** A gate's minimal real content, shown under the heading (the M0 risk chip). */
  children?: ReactNode;
}) {
  const screen = screenByName(artboard);
  const Root = standalone ? "main" : "div";
  const source = screen.artboard ? ` from the ${screen.name} artboard` : "";
  const tasks = screen.task?.split(", ") ?? [];
  const plan = screen.task
    ? `${tasks.join(" and ")} ${tasks.length > 1 ? "build" : "builds"} this page${source} in ${screen.milestone}.`
    : `Planned for ${screen.milestone}. Its task is assigned when ${screen.milestone} is broken down.`;

  return (
    <Root
      id={standalone ? "main" : undefined}
      data-screen={screen.name}
      className="mx-auto w-full max-w-[79rem] px-4 py-16 sm:px-8 sm:py-30"
    >
      <h1 className="m-0 font-display text-h1 font-bold">{screen.name}</h1>
      {children}
      <p className="mt-5 mb-0 max-w-measure text-lead">Placeholder. {plan}</p>
      <dl className="mt-10 mb-0 grid max-w-measure gap-x-8 gap-y-3 text-body sm:grid-cols-[max-content_1fr]">
        <dt className="text-ink2">{screen.routes.length > 1 ? "Routes" : "Route"}</dt>
        <dd className="m-0 flex flex-wrap gap-x-6 [overflow-wrap:anywhere]">
          {screen.routes.map((r) => (
            <code key={r.pattern}>{r.pattern}</code>
          ))}
        </dd>
        {screen.artboard ? (
          <>
            <dt className="text-ink2">Artboard</dt>
            <dd className="m-0 [overflow-wrap:anywhere]">
              <code>product/design/artboards/{screen.artboard}</code>
            </dd>
          </>
        ) : null}
        {screen.variants?.map((v) => (
          <Fragment key={v.name}>
            <dt className="text-ink2">{v.name}</dt>
            <dd className="m-0">
              {v.note} ({v.task}).
            </dd>
          </Fragment>
        ))}
      </dl>
    </Root>
  );
}

/** Page metadata for a stub: titled after the artboard and kept out of search. */
export function placeholderMetadata(artboard: ScreenName): Metadata {
  return {
    title: `${artboard} (placeholder)`,
    robots: { index: false, follow: false },
  };
}
