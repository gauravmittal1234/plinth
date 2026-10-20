"use client";

// "Who has my number?" and "Consent history" (T51 Build): the one record of
// who can reach the buyer, with a one-tap withdraw that shows its real
// consequences (the `effects` lines `api.consent_withdraw` returns), never a
// locally-invented "done". Every ref is the fixture's own C-MMDD-NN
// (API_CONTRACTS §4.10); nothing here composes a new one.
import { Button, Pill, Sheet, Toast } from "@plinth/web-ui";
import type { ContactParty, WhoHasMyNumber } from "@plinth/contracts";
import { useMemo, useState, useTransition } from "react";
import { withdrawConsentAction } from "./actions";
import { formatDate } from "./format";

type Withdrawal = { effects: readonly string[]; withdrawnAt: string };

type HistoryRow = {
  ref: string;
  date: string;
  who: string;
  what: string;
  status: "active" | "withdrawn" | "ended";
  note: string | null;
};

export function ConsentSection({ numbers }: { numbers: WhoHasMyNumber }) {
  const [withdrawn, setWithdrawn] = useState<Readonly<Record<string, Withdrawal>>>({});
  const [confirmTarget, setConfirmTarget] = useState<ContactParty | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeParties = useMemo(
    () => numbers.parties.filter((p) => !withdrawn[p.ref]),
    [numbers.parties, withdrawn],
  );
  const activeCount = activeParties.length;
  const capReached = activeCount >= 3;
  const nextFreeSlot = useMemo(() => {
    if (!capReached) return null;
    const dates = activeParties.map((p) => p.access_until).filter((d): d is string => d !== null);
    if (dates.length === 0) return null;
    return dates.reduce((min, d) => (d < min ? d : min));
  }, [activeParties, capReached]);

  const history = useMemo<HistoryRow[]>(() => {
    const rows: HistoryRow[] = [];
    for (const p of numbers.parties) {
      const w = withdrawn[p.ref];
      rows.push(
        w
          ? { ref: p.ref, date: w.withdrawnAt, who: p.party, what: p.detail, status: "withdrawn", note: w.effects.join(" ") }
          : { ref: p.ref, date: p.shared_on, who: p.party, what: p.detail, status: "active", note: null },
      );
    }
    // Relays carry no date in `who_has_my_number` (API_CONTRACTS §4.10): they
    // stay in their own "not counted" note above, never mixed into a sorted
    // list by a date this payload doesn't give.
    for (const e of numbers.ended) {
      rows.push({ ref: e.ref, date: e.ended_on, who: e.party, what: e.detail, status: "ended", note: null });
    }
    return rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [numbers.parties, numbers.ended, withdrawn]);

  function confirmWithdraw() {
    const target = confirmTarget;
    if (!target) return;
    startTransition(async () => {
      const result = await withdrawConsentAction(target.ref);
      setConfirmTarget(null);
      if (result.ok) {
        setWithdrawn((prev) => ({
          ...prev,
          [target.ref]: { effects: result.withdrawal.effects, withdrawnAt: result.withdrawal.withdrawn_at },
        }));
        setToast(result.withdrawal.effects[0] ?? "Access revoked.");
      } else {
        setToast(result.message);
      }
    });
  }

  return (
    <>
      <section aria-labelledby="who-h" className="flex flex-col gap-6">
        <h2 id="who-h" className="m-0 font-sans text-h3 font-bold">
          Who has it, and why?
        </h2>
        <p className="m-0 max-w-measure text-body text-ink2">
          Every share needed your tap. Each one has a purpose, a date and a consent reference.
        </p>

        <p className="m-0 font-semibold" data-testid="active-count">
          {activeCount} {activeCount === 1 ? "party" : "parties"} can reach you right now
          {numbers.relays.some((r) => !r.counts_toward_cap) ? "; a relay doesn't count." : "."}
        </p>

        <ul role="list" className="m-0 flex flex-col gap-3 p-0" data-testid="party-list">
          {activeParties.map((party) => (
            <li
              key={party.ref}
              className="flex flex-wrap items-start justify-between gap-3 rounded-panel bg-bg-solid px-5 py-4"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="font-semibold">{party.party}</span>
                <span className="text-small text-ink2">{party.pays_line}</span>
                <span className="text-small text-ink2">{party.detail}</span>
                <span className="text-small text-ink2">
                  Shared {formatDate(party.shared_on)}
                  {party.access_until ? ` · access until ${formatDate(party.access_until)}` : ""} · consent{" "}
                  <span data-ref={party.ref}>{party.ref}</span>
                </span>
              </div>
              <Button
                variant="secondary"
                onClick={() => setConfirmTarget(party)}
                aria-label={`Revoke ${party.party}'s access to your number`}
              >
                Revoke
              </Button>
            </li>
          ))}
        </ul>

        {numbers.relays.map((relay) => (
          <p key={relay.ref} className="m-0 text-small text-ink2">
            Not counted: {relay.party} — {relay.line} (consent <span data-ref={relay.ref}>{relay.ref}</span>)
          </p>
        ))}

        {capReached && nextFreeSlot ? (
          <p className="m-0 text-small text-ink2">
            No more than 3 new parties can reach you in any 30 days. Your next free slot opens{" "}
            {formatDate(nextFreeSlot)}.
          </p>
        ) : null}

        {numbers.ended.length > 0 ? (
          <ul role="list" className="m-0 flex flex-col gap-2 p-0">
            {numbers.ended.map((ended) => (
              <li key={ended.ref} className="text-small text-ink2">
                {ended.party} ({ended.detail}) · ended {formatDate(ended.ended_on)} · consent{" "}
                <span data-ref={ended.ref}>{ended.ref}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="m-0 text-small text-ink2">{numbers.family_line}</p>
      </section>

      <section aria-labelledby="history-h" className="flex flex-col gap-4">
        <h2 id="history-h" className="m-0 font-sans text-h3 font-bold">
          What did I say yes to?
        </h2>
        <p className="m-0 max-w-measure text-body text-ink2">
          Every line is a tap you made, newest first. References use the form C-MMDD-NN, so you can
          quote one to us or to the site office.
        </p>
        <ul role="list" className="m-0 flex flex-col gap-2 p-0" data-testid="history-list">
          {history.map((row) => (
            <li
              key={row.ref}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-panel bg-track px-5 py-3"
            >
              <span className="min-w-0">
                <Pill size="s">
                  Consent <span data-ref={row.ref}>{row.ref}</span>
                </Pill>{" "}
                <span className="font-semibold">{row.who}</span>
                {" — "}
                <span className="text-ink2">{row.note ?? row.what}</span>
              </span>
              <span className="text-small text-ink2">{row.status}</span>
            </li>
          ))}
        </ul>
      </section>

      <Sheet
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        modal
        closeLabel="Keep sharing"
        title={confirmTarget ? `Stop sharing your number with ${confirmTarget.party}?` : ""}
        description={
          confirmTarget
            ? `You shared your number with them on ${formatDate(confirmTarget.shared_on)}, and a shared number can't be recalled, so ask them to delete it.`
            : undefined
        }
      >
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setConfirmTarget(null)}>
            Keep sharing
          </Button>
          <Button variant="primary" onClick={confirmWithdraw} disabled={isPending}>
            Stop sharing
          </Button>
        </div>
      </Sheet>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </>
  );
}
