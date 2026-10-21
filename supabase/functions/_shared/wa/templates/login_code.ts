// _shared/wa/templates/login_code: the AUTHENTICATION template (API_CONTRACTS §5.2).
// Meta writes the body and security line itself; the send carries only the code, once for the
// body and once for the copy-code button (the exact shape T41's _shared/otp/whatsapp.ts already
// sends for sign-in; this renderer is the same template through outbox-dispatch's catalogue path).

import type { TemplateMirror } from "./shared.ts";
import { bodyComponent, templateMessage, urlButton } from "./shared.ts";

export const LOGIN_CODE: TemplateMirror = {
  code: "login_code",
  metaName: "login_code",
  category: "AUTHENTICATION",
  language: "en",
  variables: ["code"],
  buttons: [{ type: "copy_code", text: "Copy code" }],
};

export interface LoginCodeVars {
  code: string;
}

export function renderLoginCode(vars: LoginCodeVars) {
  return templateMessage(LOGIN_CODE, [
    bodyComponent(vars.code),
    urlButton(0, vars.code),
  ]);
}
