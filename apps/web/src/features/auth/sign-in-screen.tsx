// The page's one async read (page.tsx wraps this in <Suspense>; Cache
// Components: reading `searchParams` elsewhere makes the whole route
// dynamic). `next`'s project, when it names one, comes from project_page,
// never invented here (AGENTS.md §5). The WhatsApp-follows scenario is read
// separately, only once the reader verifies a code (src/features/auth/
// actions.ts) — never fetched here, so hovering or prefetching this page
// never calls the (still write-shaped) link_whatsapp_follows function.
// PLINTH_DATA=supabase turns on live sign-in (Supabase Auth, ./session.ts);
// it returns to `next`, reduced to a same-origin path (resolve-next.ts).
import { dataMode, isDataError, projectPage } from "@/src/data";
import { GenericIntro } from "./generic-intro";
import { projectSlugFromNext, safeNextPath } from "./resolve-next";
import { SignInFlow } from "./sign-in-flow";
import { ValueCard } from "./value-card";

/** `next`'s project, or null when it doesn't name one our records have. */
async function loadNextProject(slug: string | null) {
  if (!slug) return null;
  try {
    return await projectPage(slug);
  } catch (e) {
    if (isDataError(e, "not_found")) return null;
    throw e;
  }
}

export async function SignInScreen({ next }: { next: string | string[] | undefined }) {
  const safeNext = safeNextPath(next);
  const slug = projectSlugFromNext(safeNext);
  const newProject = await loadNextProject(slug);

  return (
    <div className="mx-auto flex w-full max-w-[79rem] flex-wrap items-start gap-10 px-4 py-8 sm:gap-18 sm:px-8">
      {newProject ? <ValueCard page={newProject} /> : <GenericIntro />}
      <SignInFlow
        projectPage={newProject}
        notNowHref={safeNext}
        live={dataMode() === "supabase"}
        nextHref={safeNext}
      />
    </div>
  );
}
