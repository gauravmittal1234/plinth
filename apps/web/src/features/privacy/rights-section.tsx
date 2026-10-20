"use client";

// "Download my data" and "Delete my account" (T51 Build). Neither api.* call
// has a fixture answer yet (packages/fixtures/expected has no
// `data_export_request` or `account_delete_request` payload: T45b has not
// shipped the real RPC), so AGENTS.md rule 9 applies: the button tries the
// real call and the result names what actually happened, never a staged
// "Preparing…" sequence invented on the client.
import { Button } from "@plinth/web-ui";
import { useId, useState, useTransition } from "react";
import { requestAccountDeletionAction, requestDataExportAction, type NoticeResult } from "./actions";

export function RightsSection({
  downloadPromise,
}: {
  downloadPromise: string;
}) {
  const [exportResult, setExportResult] = useState<NoticeResult | null>(null);
  const [deleteResult, setDeleteResult] = useState<NoticeResult | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [ack, setAck] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ackId = useId();

  function runExport() {
    startTransition(async () => setExportResult(await requestDataExportAction()));
  }

  function runDelete() {
    startTransition(async () => {
      const result = await requestAccountDeletionAction();
      setDeleteResult(result);
      setConfirmingDelete(false);
      setAck(false);
    });
  }

  return (
    <section aria-labelledby="rights-h" className="flex flex-col gap-8">
      <h2 id="rights-h" className="m-0 font-display text-h3 font-extrabold">
        Can I take my data, or delete it?
      </h2>
      <p className="m-0 max-w-measure text-body text-ink2">
        Yes, both, at any time. Neither needs an email or a phone call.
      </p>

      <div className="flex flex-col gap-3 rounded-panel bg-bg-solid px-6 py-5" data-testid="download-panel">
        <p className="m-0 font-semibold">Download my data</p>
        <p className="m-0 text-body text-ink2">
          Saved projects, alerts, consent history and who had your number. One ZIP with a PDF and a
          JSON file. {downloadPromise}
        </p>
        <Button variant="secondary" onClick={runExport} disabled={isPending} className="self-start">
          Prepare download
        </Button>
        {exportResult ? (
          <p className="m-0 text-small text-ink2" role="status">
            {exportResult.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-panel bg-bg-solid px-6 py-5" data-testid="delete-panel">
        <p className="m-0 font-semibold">Delete my account</p>
        <p className="m-0 text-body text-ink2">
          We close it now and erase your data within 30 days. Every party loses your relay number at
          once.
        </p>
        <Button
          variant="secondary"
          onClick={() => setConfirmingDelete(true)}
          disabled={isPending}
          className="self-start"
        >
          Delete my account
        </Button>
        {confirmingDelete ? (
          <div className="flex flex-col gap-3 rounded-panel bg-track px-5 py-4">
            <p className="m-0 font-semibold">Delete your account?</p>
            <p className="m-0 text-small text-ink2">
              Your account closes today. Every party loses access to your relay number at once. We
              erase your profile, saved projects, alerts and AI chats within 30 days. We keep consent
              records and any invoices only as long as the law requires.
            </p>
            <label className="flex items-center gap-2 text-small" htmlFor={ackId}>
              <input
                id={ackId}
                type="checkbox"
                checked={ack}
                onChange={(e) => setAck(e.target.checked)}
              />
              I understand this can&rsquo;t be undone.
            </label>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmingDelete(false);
                  setAck(false);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={runDelete} disabled={!ack || isPending}>
                Yes, delete my account
              </Button>
            </div>
          </div>
        ) : null}
        {deleteResult ? (
          <p className="m-0 text-small text-ink2" role="status">
            {deleteResult.message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
