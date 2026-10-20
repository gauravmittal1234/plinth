// The relative's own WhatsApp opt-in link (API_CONTRACTS §4.11, WORK_BREAKDOWN
// T52): "JOIN <code>" prefilled in a wa.me link. Sending it is the relative's
// own tap; the opt-in itself happens in wa-webhook → ops.family_join_by_code,
// never on this page, so no number reaches Rohan without that tap.
const NON_DIGIT = /\D/g;

/**
 * `https://wa.me/<digits>?text=JOIN%20<code>`. `NEXT_PUBLIC_WA_BUSINESS_NUMBER`
 * is the public E.164 business number (.env.example, SETUP_FOR_FOUNDER.md
 * §"Web"); it is unset outside a deploy that configures it, so this still
 * renders a (non-working) link rather than throwing in fixture/dev/test.
 */
export function whatsAppJoinLink(code: string): string {
  const number = (process.env.NEXT_PUBLIC_WA_BUSINESS_NUMBER ?? "").replace(NON_DIGIT, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(`JOIN ${code}`)}`;
}
