// International codes at sign-in (DESIGN §5b "WebSignIn"; fix-trust.md G-17),
// so NRIs can sign in. +91 is the only code with a strict 10-digit pattern;
// the others just need enough digits once the code is dropped.

export type Country = { readonly code: string; readonly label: string };

export const COUNTRIES: readonly Country[] = [
  { code: "+91", label: "+91 IN" },
  { code: "+971", label: "+971 AE" },
  { code: "+1", label: "+1 US" },
  { code: "+44", label: "+44 GB" },
  { code: "+65", label: "+65 SG" },
];

export const DEFAULT_COUNTRY_CODE = "+91";
