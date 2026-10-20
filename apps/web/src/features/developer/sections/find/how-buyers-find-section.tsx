// "How do buyers find {name}'s projects?" (Build). The three published rules
// (`HowBuyersFindYou.rules`) are shown unchanged and in order; nothing here
// ranks or ever could move a page (BUILD_PLAN/DESIGN: order never follows
// money, claiming doesn't move it either).
import type { HowBuyersFindYou } from "@plinth/contracts";
import { SectionBand } from "@plinth/web-ui";
import { FIND_COPY } from "../../page/copy";

export function HowBuyersFindSection({ name, data }: { name: string; data: HowBuyersFindYou }) {
  return (
    <SectionBand id="how-buyers-find" tone="bg">
      <div className="flex flex-col gap-6">
        <h2 className="m-0 max-w-[24ch] text-balance font-display text-section font-bold">
          {FIND_COPY.heading(name)}
        </h2>
        {data.line ? <p className="m-0 max-w-measure text-lead">{data.line}</p> : null}
        <ul role="list" className="m-0 flex flex-col gap-4 p-0">
          {data.rules.map((rule, i) => (
            <li key={i} className="rounded-panel bg-bg-solid p-5 sm:p-6">
              <p className="m-0 max-w-measure text-body">{rule}</p>
            </li>
          ))}
        </ul>
      </div>
    </SectionBand>
  );
}
