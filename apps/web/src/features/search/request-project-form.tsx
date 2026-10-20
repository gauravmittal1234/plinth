"use client";

// "Request it" (G-30): name or RERA number, then the server's own reference
// ("Requested · R-MMDD-NN…", DESIGN §5b). The reference is only ever the one
// api.request_project returned; fixture mode has no request_project payload
// yet, so it says so instead of showing a reference no system issued.
// Handoff: "Also tell me on WhatsApp" (artboard) needs a consent parameter on
// api.request_project before it can be offered; the contract has none today.
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
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const reraId = useId();

  if (status === "done" && message) {
    return (
      <p role="status" className="m-0 text-body font-semibold">
        {message}
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
          if (result.ok) {
            setMessage(SEARCH_COPY.requested(result.ref));
            setStatus("done");
          } else if (result.code === "fixture_missing") {
            setMessage(SEARCH_COPY.requestFixtureMode);
            setStatus("done");
          } else {
            setMessage(SEARCH_COPY.requestFailed);
            setStatus("error");
          }
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
      {status === "error" && message ? (
        <p role="alert" className="m-0 text-small">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={status === "sending"}>
        {SEARCH_COPY.requestIt}
      </Button>
    </form>
  );
}
