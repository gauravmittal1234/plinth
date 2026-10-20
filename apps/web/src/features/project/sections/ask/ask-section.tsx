// "Ask Plinth anything" (WORK_BREAKDOWN §4 T20b; DESIGN §5b "Ask Plinth").
// The `ask` edge function is M5 (BUILD_PLAN §1), so this panel shows its
// disclosure line, the human handoff and two worked, cited examples straight
// from the contract's own schema-valid fixtures (ask/examples.ts) rather than
// wiring a call this build can't answer yet. The question box stays on the
// page, disabled, the same way the wait section's inputs wait for M3.
import type { AskAnswer } from "@plinth/contracts";
import { SectionBand } from "@plinth/web-ui";
import { ASK_EXAMPLES } from "./examples";

const ASK_COPY = {
  heading: "Ask Plinth anything",
  intro: "Type or speak, in English or Hinglish. Every answer cites the records it used.",
  disclosureExtra: "It can be wrong, so check them.",
  inputLabel: "Ask a question about Aurelia Heights, Phase 2",
  inputNote: "Ask Plinth isn't answering live in this preview; the AI answers are planned for M5.",
  triedHeading: "Try asking",
};

function Answer({ answer }: { answer: AskAnswer }) {
  return (
    <div className="flex flex-col gap-3">
      <ol role="list" className="m-0 flex list-none flex-col gap-2 p-0">
        {answer.sentences.map((sentence, i) => (
          <li key={i}>
            {sentence.text}
            {sentence.cite.length > 0 ? (
              <sup className="ml-0.5 text-caption text-ink2">[{sentence.cite.join(", ")}]</sup>
            ) : null}
          </li>
        ))}
      </ol>
      {answer.sources.length > 0 ? (
        <ol role="list" className="m-0 flex flex-col gap-1 p-0 text-small text-ink2">
          {answer.sources.map((source) => (
            <li key={source.n}>
              [{source.n}] {source.label}
            </li>
          ))}
        </ol>
      ) : null}
      {answer.as_of_line ? <p className="m-0 text-small text-ink2">{answer.as_of_line}</p> : null}
    </div>
  );
}

export function AskSection() {
  const first = ASK_EXAMPLES[0]!.answer;
  return (
    <SectionBand id="ask" tone="bg">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="m-0 max-w-[16ch] text-balance font-display text-section font-bold">
            {ASK_COPY.heading}
          </h2>
          <p className="m-0 max-w-measure text-lead">{ASK_COPY.intro}</p>
          <p className="m-0 max-w-measure text-small text-ink2">
            {first.disclosure_line} {ASK_COPY.disclosureExtra}
          </p>
          <p className="m-0 text-small text-ink2">
            {first.handoff.label} · {first.handoff.hours_line}
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="sr-only">{ASK_COPY.inputLabel}</span>
          <input
            type="text"
            disabled
            placeholder={ASK_COPY.inputLabel}
            aria-describedby="ask-input-note"
            className="h-13 rounded-pill bg-bg-solid px-5 text-body placeholder:text-ink2"
          />
          <span id="ask-input-note" className="text-small text-ink2">
            {ASK_COPY.inputNote}
          </span>
        </label>

        <div className="flex flex-col gap-6">
          <h3 className="m-0 text-small font-semibold text-ink2 uppercase">{ASK_COPY.triedHeading}</h3>
          {ASK_EXAMPLES.map(({ question, answer }) => (
            <div key={question} className="flex flex-col gap-3 rounded-panel bg-bg-solid p-5 sm:p-7">
              <p className="m-0 font-semibold">{question}</p>
              <Answer answer={answer} />
            </div>
          ))}
        </div>
      </div>
    </SectionBand>
  );
}
