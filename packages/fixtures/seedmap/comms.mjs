// Seedmap: canonical/people.json -> supabase/seed/53_comms.sql (DATA_MODEL §9).
// Rohan's WhatsApp contact, linked to his account with utility alerts on (§5b: his WhatsApp
// alerts and digest are ON on every surface). Nothing is queued in comms.outbox: the 25 Oct
// digest is enqueued by ops.enqueue_digests when the clock reaches it (T43b). Meera's father has
// no contact until he sends JOIN AH2-7KQ himself.
// Waits for T42 (`m2_comms`) and T44 (20261114, pii.wa_contacts). Owner: T03b.
export const output = "53_comms.sql";
export const requires = ["m2_comms", "20261114"];

export function build({ load, sql }) {
  const p = load("people");
  const { q, ts, insert } = sql;
  const subs = new Set(
    p.alert_subscriptions.filter((s) => s.channel === "whatsapp" && s.enabled).map((s) => s.user),
  );
  const contacts = p.people.filter((x) => x.account && subs.has(x.key));
  return insert(
    "pii.wa_contacts",
    ["id", "wa_id_e164", "user_id", "utility_opt_in", "last_inbound_at", "stopped_at"],
    contacts.map((x) => [
      q(x.wa_contact_id),
      q(x.test_phone_e164),
      q(x.id),
      "true",
      ts(null),
      ts(null),
    ]),
  );
}
