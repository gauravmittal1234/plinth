// "What does {name} say?" (Build: "reply"). Reuses WebProject's
// `DeveloperSaysField` (@plinth/web-ui) — the same claim-tone field, quote
// mark and `line` the kit uses everywhere a developer's words appear. A
// group that hasn't replied gets a plain line, never an invented date.
import type { DeveloperPage, DeveloperResponse } from "@plinth/contracts";
import { DeveloperSaysField, SectionBand } from "@plinth/web-ui";
import { REPLY_COPY } from "../../page/copy";
import { formatDate } from "../../page/format";
import { strField } from "../../page/safe";

/** Reshapes the open `DeveloperPageReply` into the kit's closed `DeveloperResponse`, nothing invented. */
function asResponse(reply: NonNullable<DeveloperPage["reply"]>): DeveloperResponse | null {
  if (!reply.text || !reply.published_on) return null;
  const signatory = strField(reply, "signed_line") ?? strField(reply, "signatory_title") ?? "";
  return {
    text: reply.text,
    signatory_title: signatory,
    published_on: reply.published_on,
    check_by: typeof reply.check_by === "string" ? reply.check_by : null,
    line: reply.line,
  };
}

export function ReplySection({ name, reply }: { name: string; reply: DeveloperPage["reply"] }) {
  const response = reply ? asResponse(reply) : null;
  const recordsLine = reply ? strField(reply, "records_line") : null;

  return (
    <SectionBand id="reply" tone="track">
      <div className="flex flex-col gap-6">
        <h2 className="m-0 max-w-[20ch] text-balance font-display text-section font-bold">
          {REPLY_COPY.heading(name)}
        </h2>

        {response ? (
          <DeveloperSaysField says={response}>
            <p className="m-0 text-small">
              Under review since {formatDate(response.published_on)}.
              {response.check_by ? ` Decision due by ${formatDate(response.check_by)}.` : null}
            </p>
            {recordsLine ? (
              <p className="m-0 text-small text-ink2">
                <strong className="font-semibold">{REPLY_COPY.recordsShow}:</strong> {recordsLine}
              </p>
            ) : null}
          </DeveloperSaysField>
        ) : reply ? (
          <p className="m-0 max-w-measure text-body text-ink2">{reply.line}</p>
        ) : (
          <p className="m-0 max-w-measure text-body text-ink2">{REPLY_COPY.noReply(name)}</p>
        )}
      </div>
    </SectionBand>
  );
}
