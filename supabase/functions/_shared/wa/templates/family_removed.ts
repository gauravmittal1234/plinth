// _shared/wa/templates/family_removed: a relative's own circle membership ended (AppFamily;
// API_CONTRACTS §5.2). No header, no buttons; inviter first name / project, catalogue order.

import type { TemplateMirror } from "./shared.ts";
import { bodyComponent, templateMessage } from "./shared.ts";

export const FAMILY_REMOVED: TemplateMirror = {
  code: "family_removed",
  metaName: "family_removed",
  category: "UTILITY",
  language: "en",
  variables: ["inviter_first_name", "project"],
  buttons: [],
};

export interface FamilyRemovedVars {
  inviterFirstName: string;
  project: string;
}

export function renderFamilyRemoved(vars: FamilyRemovedVars) {
  return templateMessage(FAMILY_REMOVED, [
    bodyComponent(vars.inviterFirstName, vars.project),
  ]);
}
