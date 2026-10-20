// Expected (golden) outputs of the M2–M3 reads (owner: T03b), built from the canonical fixtures.
// Shapes follow API_CONTRACTS.md §4.7–§4.14 and validate against @plinth/contracts. Copy is final
// here: clients never compose it. Facts come from DESIGN §5b through canonical/*.json.
import { fmtDate, inrExact, inrShort } from "./lib.mjs";
import { BANDS } from "./scoring.mjs";

const AH2 = "aurelia-heights-phase-2";
const KP = "kestrel-park";
const SG1 = "sapphire-grove-phase-1";
const CT = "coral-towers";
const BASE = "https://plinth.in";
const RETENTION =
  "We keep this file for 30 days, then delete it, unless you save it to your account.";
const NOT_ADVICE = "Not legal advice. We never certify title.";
const NEVER_MONEY = "Plinth never takes, holds or moves your money.";
const VERDICT_LABEL = {
  matches: "Matches",
  differs: "Differs",
  not_in_records: "Not in records",
  cant_check: "Can't check yet",
};

export function makeExpectedB({ cat, ev, sc, dc, vec, X, B }) {
  const H = X.helpers;
  const phase = (slug) => cat.phases.find((p) => p.slug === slug);
  const fact = (key) => {
    const f = ev.facts.find((x) => x.key === key);
    if (!f) throw new Error(`expected_b: no fact ${key}`);
    return f;
  };
  /** SourceRefs for evidence keys. Records go through T03's labels; "From the developer" facts
   *  carry the developer's paper as their label and no official URL (they are not records). */
  const DEV_LABEL = {
    "price.quoted": (f) => `Developer price list · ${fmtDate(f.as_of)}`,
    "price.all_in": (f) =>
      `Developer cost sheet · ${fmtDate(f.value.cost_sheet_dated)} · Plinth cost rules v${f.value.rules_version}`,
  };
  const srcRefs = (keys) => {
    const out = [];
    for (const k of keys) {
      const f = fact(k);
      if (f.lane === "from_developer") {
        out.push({
          label: DEV_LABEL[f.attribute](f),
          fact_ids: [f.id],
          evidence_url: `/evidence/${f.id}`,
          official_url: null,
          as_of: f.as_of,
        });
        continue;
      }
      for (const r of H.sourceRefKeys([k])) {
        const g = out.find((x) => x.label === r.label);
        if (!g) out.push(r);
        else {
          g.fact_ids.push(...r.fact_ids);
          if (r.as_of > g.as_of) g.as_of = r.as_of;
        }
      }
    }
    return out;
  };
  const chipOf = (slug) => H.chipFor(H.run(slug));
  const P = B.people;
  const K = B.consents;
  const F = B.family;
  const person = (key) => P.people.find((x) => x.key === key);

  // ------------------------------------------------------------- following_feed (§4.8)
  const followingFeed = () => {
    const fw = P.following;
    const since = fw.last_look_at;
    const sinceDay = since.slice(0, 10);
    const item = (e) => ({
      event_id: e.id,
      slug: e.phase,
      kind: e.kind,
      occurred_on: e.occurred_on,
      line: e.line,
      before_pill: e.before_pill,
      after_pill: e.after_pill,
      developer_says: e.developer_says_line ? { line: e.developer_says_line } : null,
      sources: srcRefs(e.facts),
    });
    // Newest first (R3 C-41; events are already authored newest-first, but sort explicitly so
    // the order is an invariant, not an accident of src/author/people.mjs's array order).
    const byNewest = (a, b) => b.occurred_on.localeCompare(a.occurred_on);
    const after = fw.events.filter((e) => e.occurred_on >= sinceDay).sort(byNewest);
    const before = fw.events.filter((e) => e.occurred_on < sinceDay).sort(byNewest);
    // The summary line is §5b copy; check it against the events it summarises.
    const n = (k) => after.filter((e) => e.summary_kind === k).length;
    const plural = (k, one, many) => `${n(k)} ${n(k) === 1 ? one : many}`;
    const composed = `${after.length} changes across your ${P.follows.length} projects: ${plural("extension", "extension", "extensions")}, ${plural("filing on time", "filing on time", "filings on time")}, ${plural("missing filing", "missing filing", "missing filings")} and ${plural("price change", "price change", "price changes")}. ${after.some((e) => e.kind === "band_changed") ? "A band moved." : "No band moved."}`;
    if (composed !== fw.summary_line)
      throw new Error(`following summary drifted: ${composed} vs ${fw.summary_line}`);
    const quiet = P.follows
      .map((f) => f.phase)
      .filter((s) => !after.some((e) => e.phase === s))
      .map((s) => ({ slug: s, line: `Nothing new for ${phase(s).name} since 14 Oct.` }));
    // Project rows, newest change first (AppFollowing). Row and freshness lines: WebFollowing and
    // AppFollowing artboards; every fact in them is §5b.
    const ROW = {
      [SG1]: [
        "New QPR in · re-score due by 19 Oct",
        "From the Apr–Jun 2026 QPR · the new one is being read",
      ],
      [CT]: [
        "Extended again on 14 Oct · 2 QPRs missing",
        "From the Jan–Mar 2026 QPR · 187 days old",
      ],
      [AH2]: [
        "Was Moderate until 2 Oct · Jul–Sep QPR not on HARERA yet",
        "From the Apr–Jun 2026 QPR",
      ],
      [KP]: ["QPR filed on time · no band change", "From the Jul–Sep 2026 QPR"],
    };
    const father = F.members.find((m) => m.member === "meera-father");
    const meera = F.members.find((m) => m.member === "meera" && m.status === "joined");
    const familyLine = (slug) => {
      const fatherHere = father?.status === "invited" && father.scope_phases.includes(slug);
      if (meera && fatherHere) return "Meera follows too · her father is invited";
      if (meera) return "Meera follows too";
      return null;
    };
    const projects = [SG1, CT, AH2, KP].map((slug) => {
      const f = P.follows.find((x) => x.phase === slug);
      return {
        slug,
        name: phase(slug).name,
        chip: chipOf(slug),
        follow_type: f.follow_type,
        row_line: ROW[slug][0],
        freshness_line: ROW[slug][1],
        family_line: familyLine(slug),
      };
    });
    const marks = [...fw.events]
      .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on) || a.key.localeCompare(b.key))
      .map((e) => ({ date: e.occurred_on, kind: e.kind, band: e.band }));
    return {
      schema: "plinth.following_feed/1",
      since,
      heading: "What changed since 14 Oct?",
      last_looked_line: `Last looked 14 Oct 2026, 8:40 am · ${fw.unread} unread`,
      summary_line: fw.summary_line,
      changes: after.map(item),
      quiet,
      projects,
      replay: {
        from: fw.followed_since,
        to: "2026-10-18",
        jump_chips: [
          { label: "Your last look · 14 Oct", date: "2026-10-14" },
          { label: "1 Oct", date: "2026-10-01" },
          { label: "1 Sep", date: "2026-09-01" },
          { label: "When you followed · 1 Jul", date: "2026-07-01" },
        ],
        marks,
      },
      record: before.map(item),
      digest: { cadence: fw.digest.cadence, next_line: fw.digest.next_line },
    };
  };

  // ------------------------------------------------------------- who_has_my_number (§4.10)
  const whoHasMyNumber = ({ withdrawn = null } = {}) => {
    const mine = K.consents.filter((c) => c.principal === "rohan");
    const day = (ts) => ts.slice(0, 10);
    const active = mine
      .filter((c) => c.number_shared && !c.ended_on && c.ref !== withdrawn)
      .sort((a, b) => a.granted_at.localeCompare(b.granted_at) || a.ref.localeCompare(b.ref));
    const ended = mine
      .filter((c) => c.number_shared && (c.ended_on || c.ref === withdrawn))
      .map((c) => ({
        ref: c.ref,
        party: c.party,
        detail: c.detail,
        ended_on: c.ref === withdrawn ? "2026-10-18" : c.ended_on,
      }))
      .sort((a, b) => b.ended_on.localeCompare(a.ended_on));
    return {
      schema: "plinth.who_has_my_number/1",
      count_line: `${active.length} parties can reach you`,
      rule_line: "Your number is never shared without your tap.",
      parties: active.map((c) => ({
        ref: c.ref,
        party: c.party,
        detail: c.detail,
        shared_on: day(c.granted_at),
        access_until: c.expires_at ? day(c.expires_at) : null,
        pays_line: c.pays_line,
        number_shared: true,
        status: "active",
      })),
      relays: mine
        .filter((c) => c.relay)
        .map((c) => ({
          ref: c.ref,
          party: c.party,
          line: `${c.detail}: the site office gets your first name and a relay, not your number.`,
          counts_toward_cap: false,
        })),
      ended,
      family_line: "Family in your circle can't see your number and aren't counted here.",
    };
  };

  // ------------------------------------------------------------- family_invite_preview (§4.11)
  const invitePreview = (code) => {
    const inv = F.invites.find((i) => i.code === code);
    const one = inv.rera_number != null;
    return {
      schema: "plinth.family_invite_preview/1",
      inviter_first_name: person("rohan").first_name,
      scope_line: one
        ? inv.scope_line
        : "4 projects: Aurelia Heights Ph 2, Kestrel Park, Sapphire Grove Ph 1 and Coral Towers",
      rera_number: inv.rera_number,
      what_you_get: [
        one
          ? "An alert when its band changes, a QPR is filed or missed, its date moves or an order is passed."
          : "An alert when a project's band changes, a QPR is filed or missed, its date moves or an order is passed.",
        "A short round-up on Sundays. Nothing between 10 pm and 8 am.",
        "Stop anytime: reply STOP, or leave from this page.",
      ],
      number_line: "Rohan sees that you joined, never your number.",
    };
  };

  // ------------------------------------------------------------- alert_prefs (§4.9)
  const alertPrefs = () => {
    const subs = P.alert_subscriptions.filter((s) => s.user === "rohan" && s.enabled);
    const prefs = {};
    for (const s of subs) (prefs[s.channel] ??= {})[s.kind] = s.cadence;
    prefs.quiet_hours = { from: subs[0].quiet_from, to: subs[0].quiet_to };
    const holders = whoHasMyNumber().parties.length;
    return {
      schema: "plinth.alert_prefs/1",
      prefs,
      whatsapp_optin: subs.some((s) => s.channel === "whatsapp"),
      lines: [
        "Utility alerts only. No offers, no ads, and nothing from developers.",
        "Reply STOP to end alerts.",
      ],
      number_line: `${holders} parties can reach you now. Family in your circle never see it.`,
    };
  };

  // ------------------------------------------------------------- share_card (§3.1, core.share_cards)
  const shareCard = () => {
    const card = P.share_cards[0];
    const rs = X.riskSummary(card.phase);
    const b = BANDS[card.band];
    const oldRun = sc.runs.find((r) => r.id === card.run);
    const counts = cat.complaint_counts.find((c) => c.subject === card.phase).count_history;
    // The count in effect on the card's data_as_of: the latest history entry at or before it
    // (count_history is ordered oldest to newest; R3 C-30 added entries before 30 Sep 2026).
    const was = [...counts].filter((h) => h.as_of <= card.data_as_of).at(-1);
    const now = counts.at(-1);
    return {
      schema: "plinth.share_card/1",
      kind: card.kind,
      phase: { slug: card.phase, name: phase(card.phase).name },
      sent: {
        issued_at: card.issued_at,
        data_as_of: card.data_as_of,
        model_version: card.model_version,
        band: card.band,
        chip: { kind: "band", label: b.label, step: b.step, meter_filled: b.step },
        lines: [
          `Delivery risk: ${b.label}`,
          `Between ${oldRun.freq_low} and ${oldRun.freq_high} of 100 similar Gurugram projects got their OC more than 12 months late.`,
        ],
        card_url: `${BASE}/cards/risk/${card.phase}.png?run=${card.run}`,
      },
      now: {
        issued_at: null,
        data_as_of: rs.meta.data_as_of,
        model_version: rs.meta.model_version,
        band: rs.band.code,
        chip: rs.chip,
        lines: rs.share.lines,
        card_url: rs.share.card_url,
      },
      changed: true,
      headline_line: `Changed since this card was sent: band ${b.label} → ${rs.band.label} (${fmtDate(rs.band.since).slice(0, -5)}).`,
      changes: [
        {
          key: "band",
          label: "Delivery risk",
          before_line: b.label,
          after_line: `${rs.band.label} since ${fmtDate(rs.band.since)}`,
        },
        {
          key: "complaints",
          label: "Complaints decided against the promoter in 24 months",
          before_line: `${was.count} complaints · ${was.per_100_units} per 100 units`,
          after_line: rs.complaints.line,
        },
        {
          key: "qpr_jul_sep_2026",
          label: "Jul–Sep 2026 QPR",
          before_line: "Not due yet",
          after_line: rs.pending[0].line,
        },
        {
          key: "data_as_of",
          label: "Data as of",
          before_line: fmtDate(card.data_as_of),
          after_line: fmtDate(rs.meta.data_as_of),
        },
      ].filter((c) => c.key !== "complaints" || now.count !== was.count),
      live_url: rs.meta.live_url,
    };
  };

  // ------------------------------------------------------------- doc_check (§4.12)
  const C = B.checks;
  const matchLine = (method, line, slug) => ({ slug, method, confirmed: true, line });
  const claimRows = (dcheck, saysLabel) =>
    dcheck.claims.map((c) => ({
      seq: c.seq,
      says_label: saysLabel,
      says_text: c.says_text,
      verdict: c.verdict,
      verdict_label: VERDICT_LABEL[c.verdict],
      records_line: c.records_line,
      how_checked: c.how_checked,
      sources: srcRefs(c.facts),
      broker_question: c.broker_question,
      page: 1,
      bbox: null,
      checkable_on: null,
      developer_says: c.developer_says_line ? { line: c.developer_says_line } : null,
    }));
  const visitQuestions = B.visits.pass.questions.map((q) => q.question);
  const docCheck = (key) => {
    const base = { schema: "plinth.doc_check/1", rules_version: "2026.10" };
    if (key === "flyer" || key === "flyer--confirm-project") {
      const d = C.doc_checks.find((x) => x.doc_kind === "flyer");
      if (key === "flyer--confirm-project")
        return {
          ...base,
          id: d.id,
          kind: d.kind,
          status: "confirm_project",
          doc_label: d.doc_label,
          project_match: { ...matchLine(d.match_method, d.match_line, d.phase), confirmed: false },
          summary_line: null,
          breakdown_line: null,
          rows: [],
          actions: null,
          notes: [NOT_ADVICE, RETENTION],
        };
      return {
        ...base,
        id: d.id,
        kind: d.kind,
        status: "done",
        doc_label: d.doc_label,
        project_match: matchLine(d.match_method, d.match_line, d.phase),
        summary_line: d.summary_line,
        breakdown_line: d.breakdown_line,
        rows: claimRows(d, "Flyer says"),
        actions: {
          share_text: `4 of 7 claims on this flyer differ from the records for ${phase(d.phase).name}.`,
          broker_questions: [
            visitQuestions[0],
            visitQuestions[1],
            visitQuestions[3],
            visitQuestions[4],
          ],
        },
        notes: [NOT_ADVICE, RETENTION],
      };
    }
    if (key === "hoarding") {
      const d = C.doc_checks.find((x) => x.doc_kind === "hoarding_photo");
      return {
        ...base,
        id: d.id,
        kind: d.kind,
        status: "done",
        doc_label: d.doc_label,
        project_match: matchLine(d.match_method, d.match_line, d.phase),
        summary_line: d.summary_line,
        breakdown_line: d.breakdown_line,
        rows: claimRows(d, "Hoarding says"),
        actions: {
          share_text: `1 of 3 claims on this hoarding differs from the records for ${phase(d.phase).name}.`,
          broker_questions: [visitQuestions[3]],
        },
        notes: [
          "A matching RERA number shows the project is registered. It doesn't make the other claims true.",
          NOT_ADVICE,
          RETENTION,
        ],
      };
    }
    if (key === "demand-letter") {
      const d = C.doc_checks.find((x) => x.doc_kind === "demand_letter");
      const bk = C.bookings.find((x) => x.id === d.booking);
      return {
        ...base,
        id: d.id,
        kind: d.kind,
        status: "done",
        doc_label: d.doc_label,
        project_match: matchLine(
          "user_pick",
          `You picked ${phase(d.phase).name}, where you booked ${bk.unit_no}.`,
          d.phase,
        ),
        summary_line: d.summary_line,
        breakdown_line: d.breakdown_line,
        rows: d.rows.map((r) => ({
          seq: r.seq,
          says_label: "Letter says",
          says_text: r.says_text,
          verdict: r.verdict,
          verdict_label: VERDICT_LABEL[r.verdict],
          records_line: r.records_line,
          how_checked: null,
          sources: srcRefs(r.facts),
          broker_question: null,
          page: 1,
          bbox: null,
          checkable_on: null,
          developer_says: null,
        })),
        actions: {
          share_text: d.summary_line,
          broker_questions: [
            "Can I see the architect's or engineer's certificate that Tower A slab 12 is cast?",
          ],
        },
        notes: [
          "If the stage is reached, pay on time: RERA s.19(6). Interest for delay: s.19(7).",
          NOT_ADVICE,
          RETENTION,
        ],
      };
    }
    if (key === "payment-request" || key === "booking-form") {
      const pc = C.payee_checks.find(
        (x) => x.purpose_line.includes("booking form") === (key === "booking-form"),
      );
      const pr = payeeCheck(pc);
      const says = key === "booking-form" ? "Booking form says" : "Message says";
      return {
        ...base,
        id: pc.doc_check,
        kind: "before_you_pay",
        status: "done",
        doc_label: key === "booking-form" ? "Booking form" : "Payment request",
        project_match: matchLine(
          "name_sector",
          `We matched the project named in the ${key === "booking-form" ? "form" : "message"}: ${phase(pc.phase).name}.`,
          pc.phase,
        ),
        summary_line: `${pc.matched} of ${pc.of} match the account registered with HARERA.`,
        breakdown_line: pr.cap.line,
        rows: pr.payee.rows.map((r, i) => ({
          seq: i + 1,
          says_label: says,
          says_text: r.entered_line,
          verdict: r.result,
          verdict_label: VERDICT_LABEL[r.result],
          records_line: r.registered_line,
          how_checked: "Compared with the RERA collection account on the HARERA registration.",
          sources: srcRefs([`${pc.phase}/collection-account`]),
          broker_question: null,
          page: 1,
          bbox: null,
          checkable_on: null,
          developer_says: null,
        })),
        actions: {
          share_text: `${pc.matched} of ${pc.of} payee details ${key === "booking-form" ? "on this form" : "in this message"} match the account registered with HARERA for ${phase(pc.phase).name}.`,
          broker_questions: [],
        },
        notes: [NEVER_MONEY, RETENTION],
        payee: pr.payee,
      };
    }
    if (key === "visit-recap") {
      const rc = B.visits.recap_check;
      const items = rc.items;
      const count = (v) => items.filter((i) => i.verdict === v).length;
      return {
        ...base,
        id: rc.check,
        kind: "visit_recap",
        status: "done",
        doc_label: "Your visit recap",
        project_match: matchLine(
          "user_pick",
          `Your visit to ${phase(AH2).name}, Sat 24 Oct 2026, 11 am.`,
          AH2,
        ),
        summary_line: rc.headline,
        breakdown_line: `${count("matches")} matches. ${count("not_in_records")} isn't in any record we read. ${count("cant_check")} can't be checked yet.`,
        rows: items.map((i) => ({
          seq: i.seq,
          says_label: "They said",
          says_text: i.said,
          verdict: i.verdict,
          verdict_label: VERDICT_LABEL[i.verdict],
          records_line: i.records_line,
          how_checked: null,
          sources: srcRefs(i.facts),
          broker_question: null,
          page: null,
          bbox: null,
          checkable_on: null,
          developer_says: null,
        })),
        actions: {
          share_text: rc.headline,
          broker_questions: ["Can you put the PLC and club waiver in writing, in the agreement?"],
        },
        notes: [
          `Saved privately as ${rc.saved_as}. ${rc.rule}`,
          "The audio is deleted after transcription.",
        ],
      };
    }
    throw new Error(`unknown doc_check key ${key}`);
  };

  // ------------------------------------------------------------- payee_check (§4.14)
  function payeeCheck(pc) {
    const cap = vec.cap;
    const reg = pc.registered;
    const row = (field, entered, registered, same) => ({
      field,
      entered_line: entered,
      registered_line: registered,
      result: same ? "matches" : "differs",
    });
    const rows = [
      row(
        "payee_name",
        pc.entered.payee_name,
        reg.payee_name,
        reg.payee_name.includes(pc.entered.payee_name),
      ),
      row(
        "account",
        `ending ${pc.entered.account_last4}`,
        `ending ${reg.account_last4}`,
        pc.entered.account_last4 === reg.account_last4,
      ),
      row(
        "ifsc",
        `${pc.entered.ifsc} · ${pc.entered.bank}`,
        `${reg.ifsc} · ${reg.bank}`,
        pc.entered.ifsc === reg.ifsc,
      ),
    ];
    const matched = rows.filter((r) => r.result === "matches").length;
    if (matched !== pc.matched)
      throw new Error(`payee check ${pc.id}: ${matched} vs ${pc.matched}`);
    const within = pc.paid_so_far_inr + pc.amount_inr <= cap.expected.limit_inr;
    return {
      schema: "plinth.payee_check/1",
      payee: {
        matched,
        of: rows.length,
        verdict: matched === rows.length ? "matches" : "differs",
        verdict_line:
          matched === rows.length
            ? "Matches the account registered with HARERA"
            : "Doesn't match the account registered with HARERA",
        rows,
        advice:
          matched === rows.length
            ? []
            : [
                "Pause.",
                "Ask for written confirmation on letterhead.",
                "Call the number on HARERA, not one from a message.",
              ],
      },
      cap: {
        limit_inr: cap.expected.limit_inr,
        limit_label: cap.expected.limit_label,
        basis_line: `10% of ${cap.expected.price_label} (base + charges, cost sheet of 2 Oct 2026), RERA s.13`,
        within,
        line: `${inrExact(pc.amount_inr)} is ${within ? "within" : "over"} the ${cap.expected.limit_label} limit before a registered agreement.`,
      },
      method: { ok: true, line: null },
      never_line: NEVER_MONEY,
    };
  }

  // ------------------------------------------------------------- cost_breakdown, afford_the_wait (§4.13)
  const costBreakdown = (waive = []) => {
    const full = H.costOf(AH2);
    if (!waive.length) return full;
    const c = vec.cost.cases.find((x) => x.waive.join() === waive.join()).expected;
    const cs = dc.cost_sheets.find((x) => x.phase === AH2);
    const lines = cs.lines
      .filter((l) => !waive.includes(l.code))
      .map((l) => {
        const amount =
          l.code === "gst"
            ? c.gst_inr
            : l.code === "stamp_registration"
              ? c.stamp_registration_inr
              : l.amount_inr;
        return {
          code: l.code,
          label: l.label,
          amount_inr: amount,
          amount_label: inrShort(amount),
          tag: l.tag,
        };
      });
    return {
      ...full,
      lines,
      charges_total_label: inrShort(c.charges_total_inr),
      all_in_inr: c.all_in_inr,
      all_in_label: c.all_in_label,
      per_sqft_carpet_label: `${inrExact(c.per_sqft_carpet_inr)} per sq ft carpet`,
      vs_quoted_line: `${c.vs_quoted_pct}% more than quoted`,
      negotiable_line: null,
      waived: waive,
      waived_line: `${c.saving_label} less`,
    };
  };
  const affordTheWait = (delay) => {
    const a = H.affordOf(AH2, false);
    if (delay === a.delay.months) return a;
    const opt = a.delay_options.find((d) => d.months === delay);
    const last = a.series.at(-1);
    const extra = [];
    let m = last.month;
    for (let i = 0; i < delay - a.delay.months; i++) {
      const [y, mm] = m.split("-").map(Number);
      m = mm === 12 ? `${y + 1}-01` : `${y}-${String(mm + 1).padStart(2, "0")}`;
      extra.push({ ...last, month: m });
    }
    return {
      ...a,
      inputs: { ...a.inputs, delay_months: delay },
      delay: opt,
      series: [...a.series, ...extra],
    };
  };

  // ------------------------------------------------------------- M2 write answers (T17 handoff)
  // What each buyer write RPC returns in the fixture world (API_CONTRACTS §3.2, §4.7, §4.9–§4.11),
  // so the web and app fixture layers answer writes from files, as they answer reads.
  const follow = (slug) => {
    const f = P.follows.find((x) => x.user === "rohan" && x.phase === slug);
    return {
      schema: "plinth.follow/1",
      slug,
      follow_type: f.follow_type,
      followed_at: f.followed_at,
      alerts_line: "Band changes, filings, orders and extensions. Utility alerts only.",
      private_line: "Your family circle doesn't see your follow type.",
    };
  };
  const OK = { ok: true };
  const alertPrefsSet = (digest) => {
    const a = alertPrefs();
    if (digest === a.prefs.whatsapp.digest) return a;
    return { ...a, prefs: { ...a.prefs, whatsapp: { ...a.prefs.whatsapp, digest } } };
  };
  const inviteCreate = (code) => {
    const inv = F.invites.find((i) => i.code === code);
    const what =
      inv.rera_number != null
        ? `${phase(AH2).name} on Plinth`
        : "4 projects on Plinth: Aurelia Heights Ph 2, Kestrel Park, Sapphire Grove Ph 1 and Coral Towers";
    return {
      schema: "plinth.family_invite/1",
      code,
      link: inv.link,
      expires_on: inv.expires_on,
      scope_line: invitePreview(code).scope_line,
      share_text: `Rohan invited you to follow ${what}. You'll get the same alerts. Your number stays yours. Tap to join: ${inv.link.replace("https://", "")}`,
      rules: ["Works for one person for 7 days.", "Carries no phone number."],
      private_line:
        "Stays private to you: cost sheets, visit passes, payment alerts and who has your number.",
    };
  };
  const consentWithdraw = (ref) => {
    const c = K.consents.find((x) => x.ref === ref && x.principal === "rohan");
    if (!c?.number_shared || c.ended_on) throw new Error(`no active number share ${ref}`);
    const left = whoHasMyNumber({ withdrawn: ref }).parties.length;
    return {
      ref,
      withdrawn_at: "2026-10-18T12:00:00+05:30",
      effects: [
        `${c.party} can no longer see your number.`,
        "We've asked them to delete it.",
        `${left} parties can reach you.`,
      ],
    };
  };

  return {
    writes: { follow, OK, alertPrefsSet, inviteCreate, consentWithdraw },
    followingFeed,
    whoHasMyNumber,
    invitePreview,
    alertPrefs,
    shareCard,
    docCheck,
    payeeCheck: (key) =>
      payeeCheck(
        C.payee_checks.find(
          (x) => x.purpose_line.includes("booking form") === (key === "aurelia-booking-form"),
        ),
      ),
    costBreakdown,
    affordTheWait,
  };
}
