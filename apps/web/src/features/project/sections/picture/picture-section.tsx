// "Picture yourself here" (WORK_BREAKDOWN §4 T20b; DESIGN §4b "Picture it
// furnished"; DESIGN §5b "Visualise: under construction"). The real AI
// furnishing (Gemini, `stage-room`) is M5 (BUILD_PLAN §1); this section
// builds the signature drag-to-compare mechanic and the "AI-generated
// illustration" labelling rule now, over the two illustrative placeholder
// panes the shell itself uses (DESIGN §4 "every photo spot is an empty
// placeholder element" until the real asset lands). Structure is never
// claimed to move; style names come from DESIGN §4's token table, and their
// budgets are explicitly rough, same as the artboard's own framing.
//
// Only the drag-to-compare range needs the client, so it is the one piece
// that ships JS (compare-slider.tsx); this section itself stays
// server-rendered (project-page JS budget, lighthouserc.cjs).
import { SectionBand } from "@plinth/web-ui";
import { CompareSlider } from "./compare-slider";

const PICTURE_COPY = {
  heading: "Picture yourself here",
  intro:
    "Start from the brochure floor plan, or photograph the sample flat on your site visit. AI furnishes it to scale. Walls, windows and floors never move.",
  note: "AI-staged: furniture added. The original photo always shows first. Prices are rough furnishing budgets; items are illustrative.",
  stylesHeading: "Styles",
};

const STYLES = [
  { name: "Modern Indian", budget: "Rough furnishing budget: ₹3–5 L" },
  { name: "Minimal", budget: "Rough furnishing budget: ₹2–3.5 L" },
  { name: "Warm wood", budget: "Rough furnishing budget: ₹4–6 L" },
] as const;

export function PictureSection() {
  return (
    <SectionBand id="picture" tone="bg">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h2 className="m-0 max-w-[16ch] text-balance font-display text-section font-bold">
            {PICTURE_COPY.heading}
          </h2>
          <p className="m-0 max-w-measure text-lead">{PICTURE_COPY.intro}</p>
        </div>

        <CompareSlider />

        <div className="flex flex-col gap-3">
          <h3 className="m-0 text-small font-semibold text-ink2 uppercase">
            {PICTURE_COPY.stylesHeading}
          </h3>
          <ul role="list" className="m-0 flex flex-wrap gap-3 p-0">
            {STYLES.map((style) => (
              <li
                key={style.name}
                className="flex min-w-[12rem] flex-col gap-1 rounded-panel bg-bg-solid px-4 py-3"
              >
                <span className="font-semibold">{style.name}</span>
                <span className="text-small text-ink2">{style.budget}</span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-small text-ink2">{PICTURE_COPY.note}</p>
        </div>
      </div>
    </SectionBand>
  );
}
