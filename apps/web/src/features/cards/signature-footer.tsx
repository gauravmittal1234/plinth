// The signature footer (whatsapp.md: "identical on every card: the Plinth
// wordmark, then 'No developer pays us. Ever.', then a date..., then a
// disclaimer. On the right is a 56 px QR with a two-word label."). "The
// accent is spent once, on the wordmark mark": every other line is ink, not
// accent.
//
// `lines` is text the caller already pulled from a server or fixture payload
// (RiskSummary.share, ProjectPage.meta, CostBreakdown's own lines) — this
// component only lays it out, never writes it.
import { ink } from "./colors";
import { QrMark } from "./qr";

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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <QrMark target={qrTarget} />
        <div style={{ fontFamily: "Mukta", fontWeight: 600, fontSize: 13, color: ink.ink2 }}>{qrLabel}</div>
      </div>
    </div>
  );
}
