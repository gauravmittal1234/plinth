// The signature footer (whatsapp.md: "identical on every card: the Plinth
// wordmark, then 'No developer pays us. Ever.', then a date..., then a
// disclaimer. On the right is a 56 px QR with a two-word label."). "The
// accent is spent once, on the wordmark mark": every other line is ink, not
// accent.
//
// `lines` is text the caller already pulled from a server or fixture payload
// (RiskSummary.share, ProjectPage.meta, CostBreakdown's own lines) — this
// component only lays it out, never writes it.
//
// No QR yet (lead review of #47): a QR-shaped grid that doesn't scan looks
// real but does nothing, which the "no confirmation without a record" rule
// doesn't allow. Until the founder approves a QR dependency (package.json is
// frozen past T00), the right-hand slot shows the live link itself as plain
// text — still a genuine, working way to reach the card's live page.
import { ink } from "./colors";

/** `qrTarget` without its protocol, e.g. "https://plinth.in/r/AH2" → "plinth.in/r/AH2". */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

export function SignatureFooter({
  lines,
  qrTarget,
  qrLabel,
}: {
  lines: readonly string[];
  qrTarget: string;
  qrLabel: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingTop: 24,
        borderTop: `1px solid ${ink.line}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div
          style={{
            fontFamily: "Bricolage Grotesque",
            fontWeight: 800,
            fontSize: 15,
            color: ink.accent,
          }}
        >
          Plinth
        </div>
        {lines.map((line, i) => (
          <div key={i} style={{ fontFamily: "Mukta", fontWeight: 400, fontSize: 13, color: ink.muted }}>
            {line}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          maxWidth: 220,
        }}
      >
        <div style={{ fontFamily: "Mukta", fontWeight: 600, fontSize: 13, color: ink.ink2 }}>{qrLabel}</div>
        <div
          style={{
            fontFamily: "Mukta",
            fontWeight: 400,
            fontSize: 13,
            color: ink.ink,
            textAlign: "right",
            wordBreak: "break-all",
          }}
        >
          {displayUrl(qrTarget)}
        </div>
      </div>
    </div>
  );
}
