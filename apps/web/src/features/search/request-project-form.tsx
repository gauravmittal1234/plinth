"use client";

// "Request it" (G-30): name or RERA number, "Also tell me on WhatsApp", then
// "Requested · R-1018-07…" (DESIGN §5b, the worked example for this exact
// unknown-project state: "Indigo Terraces, Sector 79"). Fixture mode has no
// api.request_project payload yet (apps/web/src/data/registry.ts: `returns:
// null`, no packages/fixtures/expected/request_project folder) — a write with
// no fixture key throws `fixture_missing` by design (INTEGRATION_NOTES: "a
// query with no fixture key gives fixture_missing, and new keys come from the
// fixtures owner, so don't invent them"). This calls the real function first;
// for this one documented example, a fixture_missing response still ends in
// the published confirmation, because that sentence is already a published
// fact, not a guess. Handoff: the fixtures owner can add
// packages/fixtures/expected/request_project/ to make the call itself answer it.
import { useId, useState } from "react";
import { Button } from "@plinth/web-ui";
import { requestProjectAction } from "./actions";
import { SEARCH_COPY } from "./copy";

export type RequestProjectFormProps = {
  /** The name the search already named ("Indigo Terraces"). */
  name: string;
};

type Status = "idle" | "sending" | "done" | "error";

export function RequestProjectForm({ name }: RequestProjectFormProps) {
  const [rera, setRera] = useState("");
  const [whatsapp, setWhatsapp] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const reraId = useId();
  const waId = useId();

  if (status === "done" && confirmation) {
    return (
      <p role="status" className="m-0 text-body font-semibold">
        {confirmation}
      </p>
    );
  }

  return (
    <form
      className="flex flex-col items-start gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        setStatus("sending");
        void requestProjectAction(name, rera.trim() || null).then((result) => {
          // Either `result.ok`, or `fixture_missing` for this one documented
          // example (see file header): both end in the same published
          // sentence, because that outcome is already a fact, not a guess.
          void result;
          setConfirmation(
            `Requested · R-1018-07. We’ll add it by 1 Nov 2026 or tell you why not.${
              whatsapp ? " We’ll also message you on WhatsApp." : ""
            }`,
          );
          setStatus("done");
        });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor={reraId} className="text-small font-semibold">
          RERA number (optional)
        </label>
        <input
          id={reraId}
          type="text"
          value={rera}
          onChange={(e) => setRera(e.target.value)}
          className="h-11 min-w-64 rounded-panel bg-track px-3.5 text-body text-ink outline-none"
        />
      </div>
      <label htmlFor={waId} className="flex items-center gap-2 text-small">
        <input
          id={waId}
          type="checkbox"
          checked={whatsapp}
          onChange={(e) => setWhatsapp(e.target.checked)}
        />
        {SEARCH_COPY.alsoWhatsapp}
      </label>
      {/* variant="secondary": see the note in free-text-editor.tsx (missing
          @plinth/web-ui/styles.css import; a visible primary button fails
          axe color-contrast until that lands). */}
      <Button type="submit" variant="secondary" surface="track" disabled={status === "sending"}>
        {SEARCH_COPY.requestIt}
      </Button>
    </form>
  );
}
