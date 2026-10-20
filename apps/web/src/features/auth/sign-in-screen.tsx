// The page's one async read (page.tsx wraps this in <Suspense>; Cache
// Components: reading `searchParams` elsewhere makes the whole route
// dynamic). `next`'s project, when it names one, plus the fixed WhatsApp
// scenario (DESIGN.md §5b "WebSignIn") always come from project_page, never
// invented here (AGENTS.md §5).
import { isDataError, projectPage } from "@/src/data";
import { buildWaFollows } from "./data";
import { GenericIntro } from "./generic-intro";
import { projectSlugFromNext, safeNextPath } from "./resolve-next";
import { SignInFlow } from "./sign-in-flow";
import { ValueCard } from "./value-card";

// The 2 projects DESIGN.md §5b fixes for the "We found your WhatsApp
// follows" scenario; canonical fixtures, always present in fixture mode.
const AURELIA_SLUG = "aurelia-heights-phase-2";
const KESTREL_SLUG = "kestrel-park";

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

  const [newProject, aurelia, kestrel] = await Promise.all([
    loadNextProject(slug),
    projectPage(AURELIA_SLUG),
    projectPage(KESTREL_SLUG),
  ]);

  const waFollows = buildWaFollows(aurelia, kestrel);

  return (
    <div className="mx-auto flex w-full max-w-[79rem] flex-wrap items-start gap-10 px-4 py-8 sm:gap-18 sm:px-8">
      {newProject ? <ValueCard page={newProject} /> : <GenericIntro />}
      <SignInFlow
        projectPage={newProject}
        waProjects={[waFollows[0], waFollows[1]]}
        waFollows={waFollows}
        notNowHref={safeNext}
      />
    </div>
  );
}
