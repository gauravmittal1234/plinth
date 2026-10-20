// The @plinth/web-ui showcase (T14): every kit component on the four fixtures
// T14's acceptance names (Aurelia, Laurel, Juniper and Aurelia in facts-only
// mode), in Day and Night. Dev only: it renders a 404 in a production build.
//
// Next treats `_`-prefixed folders as private, so `app/__kit` is not routed by
// itself. To open it at /__kit, the lead adds a dev-only route that re-exports
// this page (see the T14 PR's handoff notes).
import type { Evidence, Methodology, ProjectPage } from "@plinth/contracts";
import aureliaFactsOnly from "@plinth/fixtures/expected/project_page/aurelia-heights-phase-2--facts-only.json";
import aurelia from "@plinth/fixtures/expected/project_page/aurelia-heights-phase-2.json";
import juniper from "@plinth/fixtures/expected/project_page/juniper-enclave.json";
import laurel from "@plinth/fixtures/expected/project_page/laurel-residency.json";
import ev1 from "@plinth/fixtures/expected/evidence/145c288f-31dd-5955-9677-170f82ffd80c.json";
import ev2 from "@plinth/fixtures/expected/evidence/196cb4f5-27eb-57a5-99f8-e5ab1b599c93.json";
import ev3 from "@plinth/fixtures/expected/evidence/d56b2adf-6ea3-598a-8cef-cbd1b0c74895.json";
import ev4 from "@plinth/fixtures/expected/evidence/dff74c62-2384-5736-88b1-02fac3a33a69.json";
import methodology from "@plinth/fixtures/expected/methodology/default.json";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KitShowcase } from "./kit-showcase";
import "./kit.css";

export const metadata: Metadata = {
  title: "Web UI kit",
  robots: { index: false, follow: false },
};

const PAGES = [aurelia, laurel, juniper, aureliaFactsOnly] as unknown as ProjectPage[];
const EVIDENCE = [ev1, ev2, ev3, ev4] as unknown as Evidence[];

export default function KitPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <KitShowcase
      pages={PAGES}
      bands={(methodology as unknown as Methodology).bands}
      evidence={EVIDENCE}
    />
  );
}
