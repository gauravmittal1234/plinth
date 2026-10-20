"use client";

// "Request a project" (DESIGN §5b, WORK_BREAKDOWN T21): any Gurugram project
// with a RERA number. Calls the real `api.request_project` write; see
// actions.ts for why fixture mode answers with the policy line rather than a
// fabricated reference number.
import { Button } from "@plinth/web-ui";
import { useId, useState, useTransition } from "react";
import { submitProjectRequest } from "./actions";

export function RequestProjectForm() {
  const [name, setName] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputId = useId();

  return (
    <form
      className="flex flex-col items-start gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          setResult(await submitProjectRequest(name));
        });
      }}
    >
      <label htmlFor={inputId} className="text-body font-semibold">
        Don&rsquo;t see a project? Request it.
      </label>
      <div className="flex flex-wrap gap-2.5">
        <input
          id={inputId}
          type="text"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Project name, e.g. Indigo Terraces, Sector 79"
          className="h-11 min-w-0 flex-1 rounded-pill bg-bg-solid px-4.5 font-sans text-body text-ink outline-none placeholder:text-ink2"
        />
        <Button type="submit" variant="secondary" disabled={isPending}>
          Request it
        </Button>
      </div>
      <p className="m-0 text-small text-ink2">
        We add any Gurugram project with a RERA number within 14 days, or say why not in writing: no
        RERA registration, outside Gurugram, or registration lapsed.
      </p>
      {result ? (
        <p role="status" className="m-0 text-body">
          {result.message}
        </p>
      ) : null}
    </form>
  );
}
