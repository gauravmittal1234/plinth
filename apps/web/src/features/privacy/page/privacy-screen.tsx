// WebPrivacy (T51 Build: who has my number, consent history, one-tap
// withdraw, download my data, delete account, money lines). The interactive
// parts (revoke, export, delete) are small client components; this shell
// stays a server component so the page's one read happens once, at request
// time (AGENTS.md "Signed-in pages use the fixture session").
import { SectionBand } from "@plinth/web-ui";
import { ConsentSection } from "../consent-section";
import { RightsSection } from "../rights-section";
import type { PrivacyData } from "./load-privacy";

export function PrivacyScreen({ data }: { data: PrivacyData }) {
  const { numbers, money, grievance, downloadPromise } = data;
  return (
    <>
      <SectionBand tone="bg" innerClassName="flex flex-col gap-4">
        <p className="m-0 text-small text-ink2">Privacy centre</p>
        <h1 className="m-0 font-display text-h1 font-bold">Who has my number?</h1>
        <p className="m-0 max-w-measure text-lead text-ink2">
          Your number is never shared without your tap. You choose who can reach you and why, and
          you can take it back anytime.
        </p>
      </SectionBand>

      <SectionBand tone="track" innerClassName="flex flex-col gap-10">
        <ConsentSection numbers={numbers} />
      </SectionBand>

      <SectionBand tone="bg" innerClassName="flex flex-col gap-6">
        <RightsSection downloadPromise={downloadPromise} />
      </SectionBand>

      <SectionBand tone="track" innerClassName="flex flex-col gap-4">
        <h2 className="m-0 font-sans text-h3 font-bold">How do we make money?</h2>
        <p className="m-0 max-w-measure text-body text-ink2">
          {money.never_line} Not to agents, lenders, developers or anyone else. Others see a relay
          number unless you tap to share yours.
        </p>
        <ul role="list" className="m-0 flex flex-col gap-1 p-0 text-body text-ink2">
          {money.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </SectionBand>

      <SectionBand tone="bg" innerClassName="flex flex-col gap-2">
        <h2 className="m-0 font-sans text-h3 font-bold">
          Who do I contact if something goes wrong?
        </h2>
        <p className="m-0 max-w-measure text-body text-ink2">
          Our Grievance Officer, {grievance.officer}. Write to {grievance.contact}. {grievance.line}
        </p>
      </SectionBand>
    </>
  );
}
