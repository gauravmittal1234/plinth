// WebFollowing (T49; WORK_BREAKDOWN §4 T49, OWNERSHIP.md): the signed-in
// "Since you last looked" page. A buyer read (`following_feed`) runs at
// request time (Cache Components: a session read can't join the static
// shell), so the caller wraps this in <Suspense> — see app/page.tsx.
import { AlertsSection } from "../alerts/alerts-section";
import { BookedSection } from "../booked/booked-section";
import { DigestSection } from "../digest/digest-section";
import { FamilySection } from "../family/family-section";
import { ProjectsSection } from "../projects/projects-section";
import { SavedSearchesSection } from "../saved-searches/saved-searches-section";
import { SinceYouLastLooked } from "../since/since-section";
import { loadFollowing } from "./load-following";

export async function FollowingPage() {
  const load = await loadFollowing();

  if (!load.ok) {
    return (
      <div className="mx-auto flex max-w-[48rem] flex-col gap-4 px-4 py-16 sm:px-8">
        <h1 className="m-0 font-display text-h2 font-bold text-ink">Following</h1>
        <p className="m-0 text-body text-ink2">{load.message}</p>
      </div>
    );
  }

  const { feed, alertPrefs, sliderOn } = load;

  return (
    <>
      <SinceYouLastLooked feed={feed} sliderOn={sliderOn} />
      <ProjectsSection projects={feed.projects} />
      <BookedSection projects={feed.projects} />
      <FamilySection projects={feed.projects} />
      <SavedSearchesSection />
      <DigestSection feed={feed} />
      <AlertsSection alertPrefs={alertPrefs} />
    </>
  );
}
