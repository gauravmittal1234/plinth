// Project rows (WORK_BREAKDOWN T49 Build: "follow type, family faces,
// freshness lines"). Every row is already the server's own FollowedProject:
// the risk chip, the follow-type pill, `row_line` and `freshness_line` (what
// changed and how old the data behind the chip is) and `family_line` (the
// family faces, F-98) are all server text, rendered as given.
import { RiskChip, SectionBand } from "@plinth/web-ui";
import type { FollowedProject } from "@plinth/contracts";
import Link from "next/link";
import { PROJECTS_COPY } from "../page/copy";

const FOLLOW_TYPE_LABEL: Record<FollowedProject["follow_type"], string> = {
  watching: "Watching",
  booked: "Booked",
};

function ProjectRow({ project }: { project: FollowedProject }) {
  return (
    <li className="flex flex-col gap-3 rounded-card bg-bg-solid p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Link
          href={`/gurugram/projects/${project.slug}`}
          className="m-0 font-display text-section font-bold text-ink no-underline hover:underline"
        >
          {project.name ?? project.slug}
        </Link>
        <RiskChip chip={project.chip} srPrefix="Delivery risk: " />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-small text-ink2">
        <span className="rounded-pill bg-chip-fill-on-track px-3 py-1 font-semibold text-ink">
          {FOLLOW_TYPE_LABEL[project.follow_type]}
        </span>
        {project.family_line ? <span>{project.family_line}</span> : null}
      </div>
      <p className="m-0 text-body text-ink">{project.row_line}</p>
      {project.freshness_line ? (
        <p className="m-0 text-small text-ink2">{project.freshness_line}</p>
      ) : null}
    </li>
  );
}

export function ProjectsSection({ projects }: { projects: readonly FollowedProject[] }) {
  if (projects.length === 0) return null;
  return (
    <SectionBand id="projects" tone="bg">
      <div className="flex flex-col gap-6">
        <h2 className="m-0 font-display text-section font-bold">{PROJECTS_COPY.heading}</h2>
        <ul role="list" className="m-0 grid grid-cols-1 gap-4 p-0 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectRow key={project.slug} project={project} />
          ))}
        </ul>
      </div>
    </SectionBand>
  );
}
