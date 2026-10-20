// Email (T42): mock only in R1 — WORK_BREAKDOWN T42 routes "push, then WhatsApp template/
// session, then email (mock)"; there is no real provider wired up yet. Still returns a provider
// message id, so the comms.outbox row carries the same DPDP evidence shape as the other channels.

export interface EmailSendResult {
  ok: boolean;
  providerMessageId: string;
}

export function sendEmailMock(): Promise<EmailSendResult> {
  return Promise.resolve({ ok: true, providerMessageId: `mock_${crypto.randomUUID()}` });
}
