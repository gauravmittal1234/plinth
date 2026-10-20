"use client";

// The Free/Pro switch on the Aurelia sample (T26 Build, the task's
// "signature"). The left half (`data-sample-left`) is drawn once from the
// RiskSummary payload and never depends on `view`, so it is byte-identical
// whichever tab is picked — e2e/pricing.spec.ts snapshots its DOM across a
// toggle to prove it. Only the right half (`data-sample-right`) changes.
// Client JS here is one bit of state (the tab) plus a toast; everything else
// is server data passed in as props.
import type { RiskSummary } from "@/src/data";
import type { Reason } from "@plinth/contracts";
import { Button, DisclaimerLine, Pill, ReasonList, RiskHeader, Toast } from "@plinth/web-ui";
import { useState } from "react";
import { PRO_ITEMS, SAMPLE_COPY } from "../copy";
import { formatDate } from "../format";

type View = "free" | "pro";

export function FreeProSample({
  sample,
  proPaywallOn,
}: {
  sample: RiskSummary;
  proPaywallOn: boolean;
}) {
  const [view, setView] = useState<View>("free");
  const [whatsApp, setWhatsApp] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const pro = view === "pro";

  // Source chips stay on this page (no evidence drawer on a sample): plain,
  // inert labels rather than a link to a page that doesn't exist yet. The
  // `as` keeps the tuple shape (sources has at least one entry); the map
  // only ever clears a field, never changes the count.
  const reasons: readonly Reason[] = sample.reasons.map((reason) => ({
    ...reason,
    sources: reason.sources.map((source) => ({
      ...source,
      evidence_url: null,
    })) as Reason["sources"],
  }));

  function buy() {
    setView("pro");
    setToast(proPaywallOn ? SAMPLE_COPY.paywallOnToast : SAMPLE_COPY.buyToast);
  }

  function notNow() {
    setToast(SAMPLE_COPY.notNowToast);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Pill tone="chip">{SAMPLE_COPY.sampleTag}</Pill>
        <div
          role="group"
          aria-label="Show the free view, or the Pro view"
          className="inline-flex gap-1.5 rounded-pill bg-track p-1"
        >
          <Pill as="button" pressed={!pro} data-testid="pricing-tab-free" onClick={() => setView("free")}>
            {SAMPLE_COPY.freeTab}
          </Pill>
          <Pill as="button" pressed={pro} data-testid="pricing-tab-pro" onClick={() => setView("pro")}>
            {SAMPLE_COPY.proTab}
          </Pill>
        </div>
      </div>

      <p className="m-0 max-w-measure text-body">
        <strong className="font-semibold">
          {pro ? SAMPLE_COPY.diffLeadPro : SAMPLE_COPY.diffLeadFree}
        </strong>{" "}
        {pro ? SAMPLE_COPY.diffTextPro : SAMPLE_COPY.diffTextFree}
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_1fr] lg:items-start">
        <div data-sample-left="" data-testid="sample-left" className="flex flex-col gap-5 rounded-panel bg-bg-solid p-6">
          <Pill tone="accent">{SAMPLE_COPY.sameTag}</Pill>
          <div>
            <p className="m-0 font-semibold">{sample.phase.name}</p>
            <p className="m-0 text-small text-ink2">
              {sample.phase.developer.name} · {sample.phase.locality_line} · RERA{" "}
              {sample.phase.rera_number}
            </p>
          </div>

          <RiskHeader
            risk={sample}
            size="l"
            srPrefix="Delivery risk: "
            caption={
              <>
                Delivery risk · data as of {formatDate(sample.meta.data_as_of)} ·{" "}
                {sample.meta.model_version}
              </>
            }
          />

          {sample.frequency ? (
            <div className="flex flex-col gap-1">
              <p className="m-0 text-body">{sample.frequency.sentence}</p>
              <p className="m-0 text-small text-ink2">{sample.late12.oc_not_keys_line}</p>
            </div>
          ) : null}

          {reasons.length ? <ReasonList reasons={reasons} surface="track" /> : null}

          {sample.what_would_change ? (
            <div className="rounded-panel bg-track px-5 py-4">
              <p className="m-0 font-semibold">What would change this</p>
              <p className="m-0 mt-1 text-body text-ink2">{sample.what_would_change}</p>
            </div>
          ) : null}

          <DisclaimerLine meta={sample.meta} />
        </div>

        <div data-sample-right="" data-testid="sample-right" className="flex flex-col gap-5 rounded-panel bg-track p-6">
          {pro ? (
            <>
              <h3 className="m-0 font-display text-h4 font-extrabold">
                {SAMPLE_COPY.yourProReport}
              </h3>
              <ol role="list" className="m-0 flex flex-col gap-4 p-0">
                {PRO_ITEMS.map((item) => (
                  <li key={item.title}>
                    <p className="m-0 font-semibold">{item.title}</p>
                    <p className="m-0 mt-1 text-body text-ink2">{item.text}</p>
                  </li>
                ))}
              </ol>
              <p className="m-0 text-small text-ink2">{SAMPLE_COPY.refundLine}</p>
              <Button
                variant="secondary"
                surface="track"
                data-testid="pricing-back-to-free"
                onClick={() => setView("free")}
                className="self-start"
              >
                {SAMPLE_COPY.backToFree}
              </Button>
            </>
          ) : (
            <>
              <h3 className="m-0 font-display text-h4 font-extrabold">
                {SAMPLE_COPY.proForThisProject}
              </h3>
              <ol role="list" className="m-0 flex flex-col gap-4 p-0">
                {PRO_ITEMS.map((item) => (
                  <li key={item.title}>
                    <p className="m-0 font-semibold">{item.title}</p>
                    <p className="m-0 mt-1 text-body text-ink2">{item.text}</p>
                  </li>
                ))}
              </ol>

              <label className="flex items-start gap-2.5 text-body">
                <input
                  type="checkbox"
                  data-testid="pricing-whatsapp-checkbox"
                  checked={whatsApp}
                  onChange={(e) => setWhatsApp(e.target.checked)}
                  className="mt-0.5 size-5"
                />
                {SAMPLE_COPY.whatsAppLabel}
              </label>

              <Button variant="primary" size="lg" data-testid="pricing-buy" onClick={buy} className="self-start">
                {SAMPLE_COPY.buyLabel}
              </Button>
              <p className="m-0 text-small text-ink2">{SAMPLE_COPY.refundLine}</p>

              <Button
                variant="tertiary"
                data-testid="pricing-not-now"
                onClick={notNow}
                className="self-start"
              >
                {SAMPLE_COPY.notNowLabel}
              </Button>
            </>
          )}
        </div>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
