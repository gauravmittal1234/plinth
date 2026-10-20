// plinth.data_export/1 → the ZIP a buyer downloads (DESIGN §5b "Download my data": one ZIP with
// a readable PDF and a JSON file). Every name, date, ref and line in the PDF is read from the
// payload (api.dpdp_export_payload); the headings are layout. Pure: no I/O.

import type { Bytes } from "../_shared/core/crypto.ts";
import { sha256Hex, utf8 } from "../_shared/core/crypto.ts";
import type { PdfLine } from "./pdf.ts";
import { renderPdf } from "./pdf.ts";
import { zipStore } from "./zip.ts";

export const EXPORT_SCHEMA = "plinth.data_export/1";
export const EXPORT_BASENAME = "plinth-my-data";
export const EXPORT_FILE_NAME = `${EXPORT_BASENAME}.zip`;

type Json = Record<string, unknown>;

/** The export payload as api.dpdp_export_payload returns it; sections are read defensively. */
export interface ExportPayload extends Json {
  schema: typeof EXPORT_SCHEMA;
  request_id: string;
  generated_at: string;
}

/** Narrows the RPC's answer, refusing anything that is not plinth.data_export/1. */
export function parseExportPayload(value: unknown, requestId: string): ExportPayload {
  const v = value as Json | null;
  if (!v || typeof v !== "object" || Array.isArray(v)) {
    throw new Error("api.dpdp_export_payload did not return an object");
  }
  if (v.schema !== EXPORT_SCHEMA) throw new Error("api.dpdp_export_payload: unexpected schema");
  if (v.request_id !== requestId) throw new Error("api.dpdp_export_payload: request id mismatch");
  if (typeof v.generated_at !== "string") {
    throw new Error("api.dpdp_export_payload: no generated_at");
  }
  return v as ExportPayload;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-18" or "2026-10-18T12:00:00+05:30" → "18 Oct 2026"; anything else as given. */
export function fmtDate(value: unknown): string {
  if (typeof value !== "string") return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/** "2026-10-18T12:00:00+05:30" → "18 Oct 2026, 12:00 pm" (the payload's own IST offset). */
export function fmtDateTime(value: unknown): string {
  if (typeof value !== "string") return "";
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!m) return fmtDate(value);
  const h = Number(m[2]);
  const clock = `${h % 12 === 0 ? 12 : h % 12}:${m[3]} ${h < 12 ? "am" : "pm"}`;
  return `${fmtDate(m[1])}, ${clock}`;
}

function words(value: unknown): string {
  return typeof value === "string" ? value.replace(/_/g, " ") : "";
}

function cap(text: string): string {
  return text ? text[0]!.toUpperCase() + text.slice(1) : text;
}

function str(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function list(value: unknown): Json[] {
  return Array.isArray(value)
    ? value.filter((x): x is Json => !!x && typeof x === "object" && !Array.isArray(x))
    : [];
}

function obj(value: unknown): Json | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Json : null;
}

function joinParts(parts: readonly string[]): string {
  return parts.filter((p) => p !== "").join(" · ");
}

/**
 * Where a row is: the phase's own name when it already starts with the project's (a phase is
 * named "<project>, Phase 2"), so the project never prints twice; else "<project>, <phase>".
 */
export function place(project: unknown, phase: unknown): string {
  const p = str(project);
  const ph = str(phase);
  if (p !== "" && ph.toLowerCase().startsWith(p.toLowerCase())) return ph;
  return [p, ph].filter((x) => x !== "").join(", ");
}

function section(lines: PdfLine[], heading: string, rows: readonly string[], empty: string): void {
  lines.push({ text: heading, style: "heading", gap: 10 });
  if (!rows.length) lines.push({ text: empty, style: "muted" });
  for (const r of rows) lines.push({ text: r });
}

/** The PDF's lines for one payload. */
export function exportPdfLines(p: ExportPayload): PdfLine[] {
  const lines: PdfLine[] = [
    { text: "Your Plinth data", style: "title" },
    {
      text: `Prepared ${fmtDateTime(p.generated_at)} IST · request ${p.request_id}`,
      style: "muted",
    },
    {
      text:
        "This PDF is the readable copy. The JSON file in the same ZIP holds the same data in full, with the exact text.",
      gap: 6,
    },
  ];

  const account = obj(p.account);
  section(
    lines,
    "Whose account is this?",
    account
      ? [
        joinParts([`First name: ${str(account.first_name) || "not given"}`]),
        joinParts([str(account.phone_masked) ? `Phone: ${str(account.phone_masked)}` : ""]),
        joinParts([account.joined_on ? `Joined ${fmtDate(account.joined_on)}` : ""]),
      ].filter(Boolean)
      : [],
    "No profile on this account.",
  );

  section(
    lines,
    "What do you follow?",
    list(p.follows).map((f) =>
      joinParts([
        place(f.project, f.phase),
        words(f.follow_type),
        f.followed_on ? `since ${fmtDate(f.followed_on)}` : "",
      ])
    ),
    "You follow no projects.",
  );

  section(
    lines,
    "Which alerts do you get?",
    list(p.alerts).map((a) =>
      joinParts([
        cap(words(a.channel)),
        words(a.kind),
        a.enabled === false ? "off" : words(a.cadence),
        a.quiet_from && a.quiet_to ? `quiet ${str(a.quiet_from)}–${str(a.quiet_to)}` : "",
      ])
    ),
    "No alerts are set.",
  );

  section(
    lines,
    "Which searches did you save?",
    list(p.saved_searches).map((s) =>
      joinParts([str(s.label) || "Saved search", s.saved_on ? `saved ${fmtDate(s.saved_on)}` : ""])
    ),
    "No saved searches.",
  );

  section(
    lines,
    "Which cost sheets did you save?",
    list(p.saved_cost_sheets).map((c) =>
      joinParts([
        `Uploaded ${fmtDate(c.uploaded_on)}`,
        str(c.mime),
        typeof c.pages === "number" ? `${c.pages} page${c.pages === 1 ? "" : "s"}` : "",
      ])
    ),
    "No saved cost sheets.",
  );

  section(
    lines,
    "What did you ask Plinth?",
    list(p.ask_questions).map((q) =>
      joinParts([fmtDate(q.asked_on), str(q.question) || str(q.text)])
    ),
    "No questions to Ask Plinth.",
  );

  const history = obj(p.consent_history);
  lines.push({ text: "Which consents did you give?", style: "heading", gap: 10 });
  if (history?.count_line) lines.push({ text: str(history.count_line) });
  const items = list(history?.items);
  if (!items.length) lines.push({ text: "No consents.", style: "muted" });
  for (const c of items) {
    lines.push({
      text: joinParts([str(c.ref), fmtDate(c.granted_on), str(c.party)]),
      gap: 4,
    });
    if (c.detail) lines.push({ text: str(c.detail) });
    lines.push({ text: joinParts([str(c.status_line), str(c.notice_version)]), style: "muted" });
  }

  section(
    lines,
    "Who had your number?",
    list(p.number_shares).map((s) =>
      joinParts([
        str(s.ref),
        str(s.party),
        `from ${fmtDate(s.from)}`,
        s.until ? `to ${fmtDate(s.until)}` : "no end date",
        s.live === true ? "can reach you now" : words(s.ended_reason),
      ])
    ),
    "No one has had your number.",
  );
  const who = obj(p.who_has_my_number);
  if (who?.count_line) lines.push({ text: str(who.count_line), style: "muted" });

  section(
    lines,
    "Whom did we ask to delete what you shared?",
    list(p.partner_deletion_requests).map((d) =>
      joinParts([
        str(d.ref),
        str(d.party),
        words(d.status),
        d.queued_on ? `asked ${fmtDate(d.queued_on)}` : "",
        d.confirmed_on ? `confirmed ${fmtDate(d.confirmed_on)}` : "",
      ])
    ),
    "No deletion requests.",
  );

  const family = obj(p.family);
  const circle = obj(family?.circle);
  section(
    lines,
    "Who is in your family circle?",
    list(circle?.members).map((m) =>
      joinParts([
        cap(words(m.status)),
        m.invited_on ? `invited ${fmtDate(m.invited_on)}` : "",
        m.joined_on ? `joined ${fmtDate(m.joined_on)}` : "",
        m.all_projects === true ? "all your projects" : `${str(m.project_count)} project(s)`,
        m.can_add_notes === true ? "can add notes" : "",
      ])
    ),
    circle ? "No one has been invited." : "You have no family circle.",
  );
  section(
    lines,
    "Which notes did you write?",
    list(family?.notes).map((n) =>
      `${fmtDate(n.written_on)}, ${place(n.project, n.phase)}: ${str(n.body)}`
    ),
    "No notes.",
  );

  section(
    lines,
    "Which projects did you ask us to add?",
    list(p.project_requests).map((r) =>
      joinParts([
        str(r.ref),
        str(r.name) || str(r.rera),
        words(r.status),
        `asked ${fmtDate(r.requested_on)}`,
      ])
    ),
    "No project requests.",
  );

  section(
    lines,
    "What have you asked of us about your data?",
    list(p.data_requests).map((d) =>
      joinParts([
        cap(words(d.kind)),
        `asked ${fmtDateTime(d.requested_at)}`,
        d.completed_at ? `done ${fmtDateTime(d.completed_at)}` : "open",
      ])
    ),
    "No requests.",
  );

  const wa = obj(p.whatsapp);
  section(
    lines,
    "What do we hold from WhatsApp?",
    wa
      ? [
        joinParts([
          str(wa.number_masked),
          wa.utility_opt_in === true ? "utility alerts on" : "utility alerts off",
          wa.stopped_on ? `STOP sent ${fmtDate(wa.stopped_on)}` : "",
          `${str(wa.message_count)} message(s)`,
        ]),
      ]
      : [],
    "No WhatsApp contact.",
  );
  return lines;
}

export interface BuiltExport {
  bytes: Bytes;
  sha256: string;
}

/** The ZIP: plinth-my-data.pdf and plinth-my-data.json, stamped with the payload's time. */
export async function buildExportZip(p: ExportPayload): Promise<BuiltExport> {
  const at = new Date(p.generated_at);
  const modified = Number.isNaN(at.getTime()) ? new Date(0) : at;
  const bytes = zipStore([
    { name: `${EXPORT_BASENAME}.pdf`, data: renderPdf(exportPdfLines(p), "Plinth · Your data") },
    { name: `${EXPORT_BASENAME}.json`, data: utf8(`${JSON.stringify(p, null, 2)}\n`) },
  ], modified);
  return { bytes, sha256: await sha256Hex(bytes) };
}
