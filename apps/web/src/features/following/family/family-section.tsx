"use client";

// "Who's deciding with you?" (WORK_BREAKDOWN T49 Build; fix-since-family §1
// G-13/F-98): invite family by link, and a shared-shortlist note composer.
// Both call real writes (api.family_invite_create, api.shortlist_note_add).
//
// There is no api.family_circle fixture or contract schema yet (src/data
// still types it `Untyped`, with no packages/fixtures/expected folder), so
// this page cannot list who has already joined or what notes already exist
// — that read is a Handoff in this PR, not something to invent. What's
// already real: the per-project `family_line` the hero/projects sections
// show ("Meera follows too · her father is invited"), the static "they
// can/can't" rules the artboard writes, and these two working actions.
import { Button, Pill, SectionBand, Toast } from "@plinth/web-ui";
import type { FamilyInvite, FollowedProject } from "@plinth/contracts";
import { useId, useState, useTransition } from "react";
import { addShortlistNoteAction, createFamilyInviteAction } from "../actions";
import { FAMILY_COPY } from "../page/copy";
import { formatDate } from "../page/format";

const DEMO_NOTE = "Visit on Sat 24 Oct, 11 am. Ask why the Jul–Sep QPR isn't on HARERA.";

function InviteCard({
  projects,
}: {
  projects: readonly FollowedProject[];
}) {
  const [scope, setScope] = useState<"one" | "all">("one");
  // Defaults to the one project family_invite_create has a fixture for
  // (AH2-7KQ); any other single-project scope is a real request fixture
  // mode just can't answer yet (createFamilyInviteAction below).
  const [slug, setSlug] = useState(
    projects.find((p) => p.slug === "aurelia-heights-phase-2")?.slug ?? projects[0]?.slug ?? "",
  );
  const [invite, setInvite] = useState<FamilyInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectId = useId();

  function send() {
    setError(null);
    startTransition(async () => {
      const result = await createFamilyInviteAction(
        scope === "all" ? { all: true } : { slugs: [slug as FollowedProject["slug"]] },
      );
      if (result.ok) setInvite(result.value);
      else setError(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-panel bg-bg-solid p-5 sm:p-7">
      <div role="radiogroup" aria-label="Who to invite them to follow" className="flex flex-wrap gap-2">
        <Pill as="button" pressed={scope === "one"} onClick={() => setScope("one")}>
          {FAMILY_COPY.inviteThisProject}
        </Pill>
        <Pill as="button" pressed={scope === "all"} onClick={() => setScope("all")}>
          {FAMILY_COPY.inviteAllProjects}
        </Pill>
      </div>
      {scope === "one" ? (
        <>
          <label htmlFor={selectId} className="sr-only">
            Which project to invite them to
          </label>
          <select
            id={selectId}
            value={slug}
            onChange={(e) => setSlug(e.currentTarget.value)}
            className="h-11 w-full max-w-sm rounded-pill bg-track px-4 text-body text-ink"
          >
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name ?? p.slug}
              </option>
            ))}
          </select>
        </>
      ) : null}
      <div>
        <Button variant="secondary" disabled={isPending} onClick={send}>
          Invite someone
        </Button>
      </div>
      {error ? (
        <p role="alert" className="m-0 text-small text-ink2">
          {error}
        </p>
      ) : null}
      {invite ? (
        <div className="flex flex-col gap-3">
          <p role="status" className="m-0 text-body text-ink">
            {`${invite.scope_line}. Expires ${formatDate(invite.expires_on)}.`}
          </p>
          <div className="flex flex-wrap gap-3">
            {/* Opens the buyer's own WhatsApp with the message ready; nothing is sent on their behalf. */}
            <Button asChild variant="secondary">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(invite.share_text)}`}
                target="_blank"
                rel="noreferrer"
              >
                {FAMILY_COPY.shareOnWhatsApp}
              </a>
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(invite.link);
                  setToast(FAMILY_COPY.linkCopied);
                } catch {
                  // Clipboard access can be denied; the link is still visible below.
                }
              }}
            >
              {FAMILY_COPY.copyLink}
            </Button>
          </div>
          <p className="m-0 text-small text-ink2">{invite.link}</p>
          <p className="m-0 text-small text-ink2">{invite.private_line}</p>
        </div>
      ) : (
        <p className="m-0 text-small text-ink2">{FAMILY_COPY.privateLine}</p>
      )}
      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function NoteComposer({ projects }: { projects: readonly FollowedProject[] }) {
  // Defaults to the one project shortlist_note_add has a fixture for, with
  // its exact seeded note text — any other project or wording is a real
  // note fixture mode just can't save yet (addShortlistNoteAction below).
  const [slug, setSlug] = useState(
    projects.find((p) => p.slug === "aurelia-heights-phase-2")?.slug ?? projects[0]?.slug ?? "",
  );
  const [text, setText] = useState(slug === "aurelia-heights-phase-2" ? DEMO_NOTE : "");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const selectId = useId();
  const textId = useId();

  return (
    <form
      className="flex flex-col gap-3 rounded-panel bg-bg-solid p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await addShortlistNoteAction(slug as FollowedProject["slug"], text);
          setResult(r.ok ? { ok: true, message: "Note added." } : { ok: false, message: r.message });
        });
      }}
    >
      <h3 className="m-0 font-display text-h4 font-bold">{FAMILY_COPY.shortlistHeading}</h3>
      <p className="m-0 text-small text-ink2">{FAMILY_COPY.shortlistSub}</p>
      <label htmlFor={selectId} className="text-small font-semibold">
        {FAMILY_COPY.noteLabel}
      </label>
      <select
        id={selectId}
        value={slug}
        onChange={(e) => {
          const next = e.currentTarget.value;
          setSlug(next);
          setText(next === "aurelia-heights-phase-2" ? DEMO_NOTE : "");
        }}
        className="h-11 w-full max-w-sm rounded-pill bg-track px-4 text-body text-ink"
      >
        {projects.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name ?? p.slug}
          </option>
        ))}
      </select>
      <label htmlFor={textId} className="sr-only">
        Your note
      </label>
      <textarea
        id={textId}
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        rows={3}
        placeholder="Your note"
        className="min-h-20 w-full rounded-panel bg-track p-4 text-body text-ink outline-none"
      />
      <div>
        <Button type="submit" variant="secondary" disabled={isPending}>
          {FAMILY_COPY.addNote}
        </Button>
      </div>
      {result ? (
        <p role="status" className="m-0 text-small text-ink2">
          {result.message}
        </p>
      ) : null}
    </form>
  );
}

export function FamilySection({ projects }: { projects: readonly FollowedProject[] }) {
  if (projects.length === 0) return null;
  return (
    <SectionBand id="family" tone="track">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 font-display text-section font-bold">{FAMILY_COPY.heading}</h2>
          <p className="m-0 max-w-[60ch] text-body text-ink2">{FAMILY_COPY.subheading}</p>
        </div>

        <InviteCard projects={projects} />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="m-0 font-semibold">{FAMILY_COPY.canSeeHeading}</h3>
            <ul role="list" className="m-0 flex flex-col gap-1 p-0 text-body text-ink2">
              {FAMILY_COPY.canSee.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="m-0 font-semibold">{FAMILY_COPY.cannotChangeHeading}</h3>
            <ul role="list" className="m-0 flex flex-col gap-1 p-0 text-body text-ink2">
              {FAMILY_COPY.cannotChange.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>

        <NoteComposer projects={projects} />
      </div>
    </SectionBand>
  );
}
