# Plinth API contracts (R1)

Status: R1 design, 19 Oct 2026 · Source of truth in code: `packages/contracts/schemas/*.json` (JSON Schema 2020-12) and `packages/contracts/openapi/plinth.yaml`. This document is the human version. If the two disagree, fix the schema first, then this doc.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| **Transport** | **RPC:** `POST {SUPABASE_URL}/rest/v1/rpc/<fn>` with headers `apikey`, `Authorization: Bearer <publishable key or user JWT>`, `Content-Profile: api`, `Accept-Profile: api`. Read-only (`STABLE`) functions also allow `GET …/rpc/<fn>?p_slug=…`. supabase-js: `supabase.schema('api').rpc('risk_summary', { p_slug })`. supabase_flutter: `supabase.schema('api').rpc(...)`. **Edge functions:** `POST {SUPABASE_URL}/functions/v1/<name>` |
| **Args** | Snake case with a `p_` prefix. Unknown args are rejected |
| **Envelope** | Every payload carries `"schema": "plinth.<type>/<major>"`. Changes are additive; a breaking change means a new function `<name>_v2`. Clients ignore unknown fields (the generated Dart and TS do) |
| **Errors** | Functions raise SQLSTATE `PT<http>` (PostgREST maps it to the HTTP status), `message` = a domain code, `details` = a human sentence in house copy. Codes: `not_found` 404, `not_in_coverage` 404, `invalid_input` 422, `auth_required` 401, `forbidden` 403, `consent_required` 409, `cap_reached` 409, `conflict` 409, `rate_limited` 429, `flag_off` 503. Edge functions return `{ "error": { "code", "message" } }` with the same codes |
| **Idempotency** | Mutations take `p_client_id uuid`. Replays return the first result, so the app's SyncQueue can retry safely |
| **Pagination** | Keyset: `p_cursor text`, `p_limit int ≤ 50` → `{ items, next_cursor }` |
| **Time** | `YYYY-MM-DD` dates; `YYYY-MM` for month precision; `YYYY-Qn` for quarters (calendar); ISO 8601 timestamps with offset. "Today" comes from `meta.generated_at` (honours the frozen fixture clock) |
| **Money** | `*_inr` integers (whole rupees) plus a server-formatted `*_label` ("₹2.74 Cr", "₹24.1 L", "₹1,67,20,000"). Areas carry their basis ("1,450 sq ft carpet") |
| **Copy from the server** | Every band name, frequency sentence, reason, pending marker, rate line and summary line arrives as a finished string (`*_line`, `sentence`, `label`). **Clients never compose risk copy.** Layout-only strings (buttons, headings) live in each app |
| **Lanes** | Every fact-bearing item has `lane`: `records_show`, `developer_says`, `from_developer`, `our_estimate`, `reported_unverified` or `buyer_upload`. Clients style by lane (DESIGN §0 tone fields) |
| **Auth levels** | `anon` (publishable key) · `buyer` (user JWT) · `org:<roles>` (developer member) · `agent` · `admin` (JWT with `aal2`) |
| **Fixture parity** | For every read function and fixture key there is `packages/fixtures/expected/<fn>/<key>.json`. CI asserts the live function returns it (ignoring `meta.generated_at` and ids). Web and app fixture modes serve these same files |

---

## 2. The canonical object: `RiskSummary` (`plinth.risk_summary/1`)

One object, served by `api.risk_summary(p_slug)`. It is embedded in `project_page`, search cards (as `chip`), compare, Following, Ask Plinth tool results, WhatsApp risk cards and the `/cards/risk/*` image. **Web, app and WhatsApp render this object and nothing else for risk.**

| Field | Type | Notes |
|---|---|---|
| `schema` | const `"plinth.risk_summary/1"` | |
| `phase` | `{ slug, name, short_code, rera_number, authority {code,name,url}, locality_line, units, developer {slug, name, claim {state, line, since}} }` | `claim.line` is either "claimed developer page, replies here" or "invited 24 Nov 2025 · not yet claimed" |
| `display` | `{ state, overlays[], bands_public }` | `state` ∈ `scored`, `limited_history`, `not_scored`, `facts_only`. `overlays` ⊂ `stale`, `rescoring`, `stalled`, `pending_change` |
| `band` | `null` or `{ code, label, step 1–5, since, set_by: "model"\|"red_flag_rule", rule: null\|{code, line} }` | **null** whenever state ≠ scored or bands are not public |
| `chip` | `{ kind: "band"\|"limited_history"\|"not_scored"\|"withheld", label, step, meter_filled }` | The borderless chip, identical everywhere. "Not enough history to score · no penalty"; "Band withheld · facts only" |
| `confidence` | `null` or `{ level: "high"\|"low", dots: 2\|1, line }` | Never part of the band name |
| `frequency` | `null` or `{ kind: "point"\|"range", low, high, sentence, reference_class_line, icon_array {filled, hatched, empty}, hatch_legend }` | null when a red-flag rule sets the band |
| `late12` | `{ original_completion "YYYY-MM", blanket_extension_months, late_after "YYYY-MM", line, oc_not_keys_line }` | Aurelia: late after **2029-04** |
| `reasons` | `Reason[]` (≤ 4) | `{ rank, factor, factor_label, text, sources: SourceRef[] }`. Empty unless scored |
| `what_would_change` | `string\|null` | |
| `pending` | `PendingFact[]` | Public facts that may move the band. **Never the proposed band** |
| `developer_response` | `null` or `{ text, signatory_title, published_on, check_by, line }` | |
| `progress` | `{ built_pct, sold_pct, time_used_pct, latest_qpr {quarter, label, filed_on, age_days}, line }` | |
| `price` | `null` or `{ all_in_inr, all_in_label, quoted_label, per_sqft_carpet_label, basis_line, display_line }` | `display_line` = "₹2.74 Cr all-in · quoted ₹2.35 Cr". Without a cost sheet: "Quoted ₹2.25 Cr · all-in not known yet" |
| `complaints` | `null` or `{ count_24m, per_100_units, units_base, median_count_similar, line }` | **Always count and rate together** |
| `withheld` | `null` or `{ since, line, explainer_line, explainer_url }` | Facts-only state only |
| `meta` | `{ data_as_of, model_version, score_run_id, generated_at, methodology_url, disclaimer_line, promise_line, live_url, short_url }` | |
| `share` | `{ card_url, card_alt, lines[≤3], source_line, caption }` | WhatsApp and F-05 |

**Shared sub-objects:**
- `SourceRef` = `{ label, fact_ids[], evidence_url, official_url, as_of }`.
- `PendingFact` = `{ code, line, since, developer_says: null|{ text, verified, said_on, check_by, line }, marker_line }`.

### 2.1 Example: Aurelia Heights, Phase 2 (frozen clock 18 Oct 2026, 12:00 IST)

```json
{
  "schema": "plinth.risk_summary/1",
  "phase": {
    "slug": "aurelia-heights-phase-2", "name": "Aurelia Heights, Phase 2", "short_code": "AH2",
    "rera_number": "GGM/673/405/2022/117",
    "authority": { "code": "harera_ggm", "name": "HARERA Gurugram", "url": "https://haryanarera.gov.in" },
    "locality_line": "Sector 37D, Dwarka Expressway", "units": 500,
    "developer": { "slug": "northfield-estates", "name": "Northfield Estates",
      "claim": { "state": "claimed", "line": "claimed developer page, replies here", "since": "2025-12-02" } }
  },
  "display": { "state": "scored", "overlays": ["pending_change"], "bands_public": true },
  "band": { "code": "elevated", "label": "Elevated", "step": 3, "since": "2026-10-02", "set_by": "model", "rule": null },
  "chip": { "kind": "band", "label": "Elevated", "step": 3, "meter_filled": 3 },
  "confidence": { "level": "low", "dots": 1,
    "line": "We're less certain about this one. Northfield has only 6 finished RERA projects to learn from, so we show a range, not one number." },
  "frequency": { "kind": "range", "low": 30, "high": 45,
    "sentence": "Between 30 and 45 of 100 similar Gurugram projects got their OC more than 12 months after the original RERA date.",
    "reference_class_line": "Gurugram RERA phases registered 2017–2021 (illustrative backtest).",
    "icon_array": { "filled": 30, "hatched": 15, "empty": 55 },
    "hatch_legend": "Hatched: the 15 of 100 we're less certain about" },
  "late12": { "original_completion": "2027-12", "blanket_extension_months": 4, "late_after": "2029-04",
    "line": "Original completion Dec 2027. More than 12 months late here means an OC after Apr 2029, with the 4-month blanket extension of Jul 2026.",
    "oc_not_keys_line": "The OC is not the keys. Possession comes after it: the developer offers it, you pay the last 5% and register the sale deed." },
  "reasons": [
    { "rank": 1, "factor": "finances", "factor_label": "Finances", "text": "72% of units sold, 41% built.",
      "sources": [{ "label": "HARERA QPR · Apr–Jun 2026", "fact_ids": ["…"], "evidence_url": "/evidence/…", "official_url": "https://haryanarera.gov.in/…", "as_of": "2026-07-15" }] },
    { "rank": 2, "factor": "timeline", "factor_label": "Timeline",
      "text": "77% of the promised time used. QPRs filed late in 3 of the last 8 quarters.",
      "sources": [{ "label": "HARERA QPR register", "fact_ids": ["…"], "evidence_url": "/evidence/…", "official_url": "…", "as_of": "2026-10-14" }] },
    { "rank": 3, "factor": "legal", "factor_label": "Legal",
      "text": "14 complaints decided against the promoter in 24 months · 2.8 per 100 units. Median count for similar projects: 3.",
      "sources": [{ "label": "HARERA orders · 24 months", "fact_ids": ["…"], "evidence_url": "/evidence/…", "official_url": "…", "as_of": "2026-10-09" }] },
    { "rank": 4, "factor": "track_record", "factor_label": "Track record",
      "text": "2 of the group's 6 finished RERA projects got OC more than 12 months late.",
      "sources": [{ "label": "HARERA · DTCP OC records", "fact_ids": ["…"], "evidence_url": "/evidence/…", "official_url": "…", "as_of": "2026-10-14" }] }
  ],
  "what_would_change": "Two consecutive quarters with construction ahead of sales would move this to Moderate.",
  "pending": [
    { "code": "qpr_missing", "since": "2026-10-15",
      "line": "The Jul–Sep 2026 QPR is not on HARERA yet. It was due 15 Oct 2026.",
      "developer_says": { "text": "Filed on 12 Oct 2026.", "verified": false, "said_on": "2026-10-15", "check_by": "2026-11-05",
        "line": "Developer says: filed 12 Oct, not yet verified." },
      "marker_line": "If it is still missing on 25 Oct 2026, this band may change; followers hear first." }
  ],
  "developer_response": { "text": "…", "signatory_title": "Authorised signatory", "published_on": "2026-10-15",
    "check_by": "2026-11-05", "line": "Developer says · not yet verified · 15 Oct 2026 · we check it by 5 Nov 2026" },
  "progress": { "built_pct": 41, "sold_pct": 72, "time_used_pct": 77,
    "latest_qpr": { "quarter": "2026-Q2", "label": "Apr–Jun 2026", "filed_on": "2026-07-15", "age_days": 95 },
    "line": "41% built · 77% of the promised time used · 72% sold" },
  "price": { "all_in_inr": 27400400, "all_in_label": "₹2.74 Cr", "quoted_label": "₹2.35 Cr",
    "per_sqft_carpet_label": "₹18,900 per sq ft carpet",
    "basis_line": "3 BHK, 1,450 sq ft carpet, park-facing · cost sheet of 2 Oct 2026",
    "display_line": "₹2.74 Cr all-in · quoted ₹2.35 Cr" },
  "complaints": { "count_24m": 14, "per_100_units": 2.8, "units_base": 500, "median_count_similar": 3,
    "line": "14 complaints · 2.8 per 100 units" },
  "withheld": null,
  "meta": { "data_as_of": "2026-10-14", "model_version": "v1.2", "score_run_id": "…", "generated_at": "2026-10-18T12:00:00+05:30",
    "methodology_url": "/methodology",
    "disclaimer_line": "Our opinion, based on public records. Not a credit rating. Not issued by any RERA.",
    "promise_line": "No developer pays us. Ever.",
    "live_url": "https://plinth.in/gurugram/projects/aurelia-heights-phase-2", "short_url": "https://plinth.in/r/AH2" },
  "share": { "card_url": "https://plinth.in/cards/risk/aurelia-heights-phase-2.png?run=…",
    "card_alt": "Aurelia Heights, Phase 2: Delivery risk Elevated. Between 30 and 45 of 100 similar projects were more than 12 months late.",
    "lines": ["Delivery risk: Elevated", "Between 30 and 45 of 100 similar Gurugram projects got their OC more than 12 months late.", "41% built with 77% of the promised time used."],
    "source_line": "HARERA records · data as of 14 Oct 2026 · v1.2",
    "caption": "Plinth · No developer pays us. Ever." }
}
```

### 2.2 Variants (only the fields that differ)

| Phase (state) | `display` | `band` / `chip` | Other |
|---|---|---|---|
| Kestrel Park | scored | Low, step 1; confidence high (●●) | `frequency.kind = "point"`, "About 10 of 100…"; complaints "2 complaints · 0.5 per 100 units" |
| Sapphire Grove Ph 1 (re-scoring) | scored + `rescoring` | Moderate, high | `pending[0].code = "rescore_due"`: "The Jul–Sep 2026 QPR was filed 15 Oct and fetched 16 Oct, 7:40 pm. We update this by 19 Oct 2026, 7:40 pm." **No figures from the new filing** |
| Coral Towers (stale) | scored + `stale` | High, low | `progress.latest_qpr.age_days = 187`; pending lists the Apr–Jun and Jul–Sep QPRs as missing; "progress 187 days old" |
| Laurel Residency | scored + `stalled` | Severe; `set_by = red_flag_rule`, `rule.line` = "Set by red-flag rule 1, not our model: a group company was admitted to insolvency (NCLT order, 12 Mar 2023)." | `frequency = null`; `price.display_line` = "Quoted ₹1.48 Cr · all-in not known yet" |
| Juniper Enclave | limited_history | `band = null`; chip "Not enough history to score · no penalty" | reasons [], frequency null |
| Heron Point Ph 2 | not_scored | `band = null`; chip "Not scored" | `pending` = what to check; price "No price list with us" |
| Any phase with `bands_public = false` (S1) | `bands_public: false` | `band`, `frequency`, `reasons`, `what_would_change` = null | Truth-panel facts only |
| Northfield phase in facts-only mode | facts_only | chip "Band withheld · facts only" (no colour, no meter fill) | `withheld.line` = "Band withheld pending review, from 18 Oct 2026"; reasons and "of 100" withheld; sourced facts stay |

---

## 3. Endpoint catalogue

### 3.1 Public read API (`anon`, cacheable)

| Function | Returns | M |
|---|---|---|
| `api.risk_summary(p_slug)` | RiskSummary | M1 |
| `api.project_page(p_slug)` | ProjectPage (§4.2) | M1 |
| `api.search_projects(p_q, p_filters, p_sort, p_bbox, p_cursor, p_limit)` | SearchResults | M1 |
| `api.suggest(p_q)` | ≤ 8 typo- and Hinglish-tolerant name/RERA/sector matches (pg_trgm + synonyms) | M1 |
| `api.developer_page(p_slug)` | DeveloperPage | M1 |
| `api.compare(p_slugs text[])` | Compare (2–4 phases) | M1 |
| `api.evidence(p_fact_id)` | EvidenceItem | M1 |
| `api.methodology()` | Model versions, factor weights, red-flag rules, calibration table, changelog | M1 |
| `api.about()` | Coverage today/next, response-time board, holdings register, grievance officer (placeholders until supplied) | M1 |
| `api.flags()` | `{ "schema": "plinth.flags/1", "flags": { key: boolean } }` for the caller's audience (19 R1 flags; `bands_public` defaults off) | M0 |
| `api.share_card(p_code)` | The original card + "Changed since this card was sent" diff | M2 |
| `api.digest_card(p_code)` | `plinth.digest_card/1` for `/cards/digest/<token>.png` (1080×570): the weekly digest's heading and one floor per followed project, by the unguessable card token `ops.enqueue_digests` put in that digest's row. Personal, so never cached. Schema pending | M2 |
| `api.family_invite_preview(p_code)` | Inviter first name, scope, the RERA number. **No phone** | M2 |
| `api.cost_breakdown(p_slug, p_unit, p_buyer, p_waive)` | CostBreakdown | M3 |
| `api.afford_the_wait(...)` | AffordTheWait | M3 |
| `api.before_you_pay_check(...)` | PayeeCheck (rate-limited) | M3 |
| `api.live_record(p_code)` | Phase slug for a `/r/` redirect; increments the placement's daily count | M4 |
| `api.dispute_log(p_group_slug)` | The public, redacted dispute log | M4 |
| `api.agent_check(p_q)` | HARERA/UP RERA agent registry matches: Found, Not found, Ended | M5 |
| `api.agent_profile(p_slug)` | Public agent profile (registration, who pays, coverage) | M5 |
| `api.visit_slots(p_slug, p_from)` | Open slots with capacity | M5 |

### 3.2 Buyer API (`buyer` JWT)

- **Account and devices:** `api.me()`, `api.device_register(p_token, p_platform, p_app_version)`.
- **Follows** (M2): `api.follow`, `api.unfollow`, `api.set_follow_type`, `api.following_feed`, `api.mark_following_seen`, `api.link_whatsapp_follows(p_accept)` ("Bring them here").
- **Alerts and saved searches** (M2): `api.alert_prefs_get`, `api.alert_prefs_set`, `api.saved_search_save`, `api.saved_search_delete`.
- **Family circle** (M2): `api.family_circle`, `api.family_invite_create`, `api.family_invite_cancel`, `api.family_member_remove`, `api.family_member_undo`, `api.family_join(p_code)` (app path), `api.shortlist_note_add`.
- **Privacy and rights** (M2): `api.who_has_my_number`, `api.consent_history`, `api.consent_withdraw(p_ref)`, `api.relay_renew(p_relay_id)`, `api.data_export_request`, `api.account_delete_request`.
- **Uploads and checks** (M3): `api.create_upload(p_kind, p_mime, p_bytes, p_sha256)` → signed upload URL; `api.doc_check(p_id)`, `api.doc_check_confirm(p_id, p_slug)`, `api.doc_check_save(p_id)`.
- **Bookings and receipts** (M3): `api.booking_save`, `api.receipt_add`.
- **Visits and enquiries** (M5): `api.visit_book(...)`, `api.visit_cancel`, `api.share_my_number(p_visit_id)` (the only path to `number_shared = true`), `api.enquiry_create` (M4/M5).
- **Agents** (M5): `api.agent_connect(p_agent_slug, p_fields)`.
- **Other:** `api.request_project(p_name, p_rera)` → R-MMDD-NN (M2); `api.pro_*` (M6, behind a flag).

### 3.3 Developer workspace API (`org:<roles>`, M4)

| Area | Functions |
|---|---|
| Claim and team | `ws_claim_start(p_code, p_email)`, `ws_signatory_submit(p_kind, p_upload_id)`, `ws_group_link_respond(p_link_id, p_accept)`, `ws_team_invite`, `ws_team_set_whatsapp` |
| Workspace home | `ws_overview()` (bands, coming changes, waiting items) |
| Inbox and visits | `ws_inbox(p_filter)` (masked unless shared), `ws_check_in(p_code)`, `ws_reply(p_record_id, p_text)` (via relay), `ws_slots_set` |
| CRM hand-off | `ws_crm_settings_set`, `ws_csv_export` (`consent_ref` column; a phone only when shared) |
| From the developer | `ws_facts_draft_save`, `ws_facts_publish` (price list, plan, plans, docs) |
| Disputes and reply | `ws_dispute_create(p_lane, p_fact_id, p_text, p_upload_ids)` → CL-/D-/EV-; `ws_disputes`; `ws_reply_publish` |
| Notices and legal | `ws_notices()` (incl. `to_band` for admin/compliance), `ws_legal_intake_create` → LN- |
| Live Record and capture | `ws_live_record()`, `ws_capture_link_create(p_member_id, p_phase)` |
| Signals and launches | `ws_signals(p_slug, p_month)` (k ≥ 20), `ws_draft_phase_*` |

### 3.4 Admin API (`admin`, `aal2`, M3–M6)

`admin_review_queue`, `admin_task_resolve`, `admin_run_publish`, `admin_notice_send|withdraw`, `admin_dispute_decide`, `admin_fact_correct` (supersede + audit), `admin_set_facts_only(p_group, p_on, p_line)`, `admin_flag_set`, `admin_takedown`, `admin_outbox`, `admin_wa_inbox`, `admin_wa_reply`, `admin_entity_merge`.

### 3.5 Edge functions

| Function | Method · auth | Purpose | M |
|---|---|---|---|
| `health` | GET · none | Liveness + DB ping | M1 |
| `auth-sms-hook` | POST · Standard Webhooks signature (Supabase Auth hook) | Sends the OTP via the WhatsApp auth template or MSG91 SMS. Logs only in mock mode | M2 |
| `wa-webhook` | GET verify · POST with `X-Hub-Signature-256` | Inbound messages and statuses → router (§5) | M2 |
| `wa-flows` | POST · Meta-encrypted payload | WhatsApp Flows data exchange (visit booking, agent onboarding, dev receipt) | M2 skeleton, M5 |
| `outbox-dispatch` | POST · dispatch secret (pg_cron/pg_net) | Delivers `comms.outbox`: FCM, WhatsApp, email | M2 |
| `doc-check` | POST · buyer JWT, or internal from wa-webhook | OCR → classify → 2 readers → rules → `app.doc_checks` | M3 |
| `ask` | POST · anon (rate-limited) or buyer JWT | Ask Plinth | M5 (stub M2 for WhatsApp fallback) |
| `export-data` | POST · buyer JWT + fresh OTP | DPDP export ZIP (PDF + JSON), 7-day link | M2 |
| `delete-account` | POST · buyer JWT + a sign-in code from the last 10 minutes (else 401 `insufficient_user_authentication`; lead decision, T53) | Erasure with legal-hold exceptions (pet_app pattern); consent rows kept, pointing at an anonymised subject | M2 |
| `retention-sweep` | POST · dispatch secret, daily | Deletes expired uploads, voice and exports; anonymises old messages | M2 |
| `capture` | POST · capture token | Site photo: time check, footprint check (PostGIS), SHA-256 seal | M4 |
| `stage-room` | POST · buyer JWT | Visualise: Gemini image, structure check, label, C2PA | M5 |

### 3.6 Web routes that act as API (apps/web)

| Route | Purpose | Auth |
|---|---|---|
| `GET /cards/{risk,cost,visit,digest,changed}/[id].png` | `next/og` card images (1080×1350; digest header 1080×570) | Public; cache keyed on run id |
| `POST /api/revalidate` | Called by the outbox on publish with `{ tags[] }` | `x-plinth-revalidate-secret` |
| `GET /r/[code]` | Live Record → logs the placement scan (count only) → 302 to the project page | Public |
| `GET /c/[code]` | Landing for a shared or old card | Public |
| `GET /j/[code]` | Family opt-in page (relative) | Public |
| `GET /.well-known/assetlinks.json` | Android App Links | Public |
| `GET /api/health` | Synthetic checks | Public |

---

## 4. The top 15 endpoints: request and response shapes

Shapes are abbreviated with `…` where a sub-object is defined elsewhere. Exact values come from §5b.

### 4.1 `api.risk_summary`: see §2

### 4.2 `api.project_page(p_slug)` → `plinth.project_page/1`

```json
{
  "schema": "plinth.project_page/1",
  "risk": { "…": "RiskSummary" },
  "hero": { "image_url": "…/heroAurelia.jpg", "image_caption": "Images on this page are illustrative",
    "summary_line": "Delivery risk: Elevated · All-in ₹2.74 Cr · 41% built · Original completion Dec 2027",
    "rera_badge": { "number": "GGM/673/405/2022/117", "authority_url": "https://haryanarera.gov.in", "qr_url": "…" } },
  "truth_panel": [
    { "key": "completion", "label": "Original vs current completion", "value_line": "Dec 2027 · no extensions", "lane": "records_show", "sources": ["…"] },
    { "key": "progress", "label": "Built vs time used", "value_line": "41% built · 77% of time used", "lane": "records_show", "sources": ["…"] },
    { "key": "complaints", "label": "Complaints decided", "value_line": "14 complaints · 2.8 per 100 units", "lane": "records_show", "sources": ["…"] },
    { "key": "collection_account", "label": "RERA collection account", "value_line": "Peepal Bank, Golf Course Road · ending 4417", "lane": "records_show", "sources": ["…"] }
  ],
  "progress": {
    "floors_per_tower": 20, "towers": ["A", "B", "C"],
    "quarters": [
      { "quarter": "2023-Q2", "label": "Apr–Jun 2023", "sold_pct": 24, "built_pct": 6, "time_used_pct": 10, "band_then": "moderate", "towers": null, "note_line": "This QPR reports Phase 2 as a whole, not by tower." },
      { "quarter": "2026-Q2", "label": "Apr–Jun 2026", "sold_pct": 72, "built_pct": 41, "time_used_pct": 70, "band_then": "moderate", "towers": { "A": 9, "B": 7, "C": 5 }, "filed_on": "2026-07-15", "note_line": "Filed 15 Jul 2026, on time. A demand for slab 12 went out on 10 Oct 2026." }
    ],
    "today": { "time_used_pct": 77, "band": "elevated", "band_since_line": "Elevated since 2 Oct 2026" },
    "late_filings_line": "Filed late: Jul–Sep 2024 (12 days), Jan–Mar 2025 (41 days) and Oct–Dec 2025 (38 days)."
  },
  "homes": { "configurations": [ { "label": "3 BHK", "carpet_line": "1,450 sq ft carpet", "carpet_lane": "records_show",
      "super_line": "2,000 sq ft super", "super_lane": "from_developer", "price_line": "From ₹2.35 Cr", "all_in_line": "₹2.74 Cr all-in", "rooms": ["…"] },
      { "label": "4 BHK", "carpet_line": "2,100 sq ft carpet", "price_line": "From ₹3.38 Cr", "all_in_line": null, "all_in_note": "No 4 BHK cost sheet, so no all-in yet." } ],
    "amenities": { "lane": "from_developer", "items": ["…"] }, "getting_around": { "lane": "our_estimate", "items": ["…"] },
    "waterlogging": { "lane": "reported_unverified", "reports": ["…"], "note_line": "Reported, not verified by Plinth. No report names the Aurelia site itself." } },
  "from_developer": { "label": "From the developer · not verified by Plinth", "price_lists": ["…"], "payment_plan": { "stages": ["…"] }, "transfer_policy": "…" },
  "cost": { "…": "CostBreakdown (§4.13)" },
  "wait_defaults": { "take_home_inr": 450000, "rent_inr": 55000, "down_pct": 20, "rate_pct": 8.5, "tenure_years": 20 },
  "afford_default": { "…": "AffordTheWait at the defaults (§4.13). Static in M1; interactive from M3" },
  "next_steps": { "intro_line": "We never say buy or don't buy. At Elevated, these steps keep less of your money at stake.", "steps": ["…"],
    "base_rate_line": "About 36 of 100 Gurugram projects got their OC more than 12 months late. Elevated sits around that.",
    "lower_band_nearby": [ { "slug": "kestrel-park", "chip": "…", "price_line": "₹2.44 Cr all-in" }, { "slug": "sapphire-grove-phase-1", "chip": "…", "price_line": "₹2.27 Cr all-in" } ],
    "rule_line": "Same corridor, lower band, all-in within 20%. Nobody pays to appear." },
  "before_booking": { "payment_plans": "…", "loans": { "line": "Loan checks arrive in 2027" }, "nri": "…", "selling_before_possession": "…" },
  "pre_rera": { "line": "None of this counts in the band.", "items": ["…"] },
  "records": [ "…EvidenceSummary" ],
  "meta": { "…": "as RiskSummary.meta" }
}
```

### 4.3 `api.search_projects` → `plinth.search_results/1`

Request:
```json
{ "p_q": "3 bhk dwarka expresway under 2.5 cr low risk",
  "p_filters": { "bhk": [3], "all_in_max_inr": 25000000, "corridors": ["dwarka-expressway"], "bands": ["low"], "possession_by": null },
  "p_sort": "lowest_risk", "p_bbox": null, "p_cursor": null, "p_limit": 20 }
```
Response:
```json
{ "schema": "plinth.search_results/1",
  "parsed": { "bhk": [3], "all_in_max_inr": 25000000, "corridors": ["dwarka-expressway"], "bands": ["low", "moderate"] },
  "notes": ["“Low delivery risk” shows Low and Moderate.", "1 project hidden by your filter."],
  "sort_line": "Sorted by lowest delivery risk. Order never follows money.",
  "items": [
    { "slug": "kestrel-park", "name": "Kestrel Park", "locality_line": "Sector 113, Dwarka Expressway", "developer_name": "Orbis Land",
      "chip": { "kind": "band", "label": "Low", "step": 1, "meter_filled": 1 }, "state": "scored",
      "price_line": "₹2.44 Cr all-in · quoted ₹2.10 Cr", "pin_label": "₹2.44 Cr", "built_line": "63% built",
      "completion_line": "Original completion Nov 2028", "image_url": "…", "centroid": [77.034, 28.527] }
  ],
  "hidden_count": 1, "next_cursor": null, "zero_results": null }
```
Facts-only phases stay in risk-filtered results, listed with Not scored ones, never hidden. `zero_results` carries the WebSearch guidance (e.g. "Aurelia is the only Dwarka Expressway project here with a 4 BHK").

### 4.4 `api.developer_page(p_slug)` → `plinth.developer_page/1`

```json
{ "schema": "plinth.developer_page/1",
  "group": { "slug": "northfield-estates", "name": "Northfield Estates", "linked_companies": 9,
    "claim": { "state": "claimed", "line": "Claimed by Northfield · verified signatory" }, "mode": "scored" },
  "track_record": { "finished": 6, "late": 2, "line": "2 of the group's 6 finished RERA projects got OC more than 12 months late.",
    "projects": [ { "name": "Cedar Walk", "promised": "…", "oc_on": "…", "late": false } ] },
  "ongoing": [ { "slug": "aurelia-heights-phase-2", "chip": "…" }, { "slug": "cedar-walk-phase-2", "chip": "…" }, { "slug": "heron-point-phase-2", "chip": { "kind": "not_scored" } } ],
  "complaints": { "line_24m": "24 decided against the group, or 0.7 per 100 units.", "half_years": [ { "label": "Jan–Jun 2025", "count": 7, "per_100_units": 0.23, "units_base": 2980 } ],
    "fairness_line": "A bigger group isn't penalised for its size." },
  "insolvency_line": "No insolvency found (checked 14 Oct 2026).",
  "pre_rera": { "…": "…" }, "reply": { "…": "…" }, "how_buyers_find_you": { "…": "three rules" }, "meta": { "…": "…" } }
```

### 4.5 `api.compare(p_slugs)` → `plinth.compare/1`

```json
{ "schema": "plinth.compare/1",
  "columns": [ { "slug": "aurelia-heights-phase-2", "name": "Aurelia Heights, Phase 2", "chip": "…", "state": "scored" } ],
  "rows": [
    { "key": "frequency", "label": "Out of 100 similar projects", "cells": ["Between 30 and 45 were more than 12 months late"] },
    { "key": "all_in", "label": "All-in, 3 BHK", "cells": ["₹2.74 Cr · ₹18,900 per sq ft carpet"] },
    { "key": "built", "label": "Built vs time used", "cells": ["41% built · 77% of time used"] },
    { "key": "complaints", "label": "Complaints, 24 months", "cells": ["14 · 2.8 per 100 units"] },
    { "key": "pending", "label": "On record now", "cells": ["Jul–Sep 2026 QPR not on HARERA yet (due 15 Oct)"] }
  ],
  "notes": ["Facts-only projects show “Band withheld · facts only”."] }
```

### 4.6 `api.evidence(p_fact_id)` → `plinth.evidence/1` (the evidence drawer, F-06)

```json
{ "schema": "plinth.evidence/1", "chip": "HARERA QPR · Apr–Jun 2026", "lane": "records_show",
  "document": "HARERA · Quarterly Progress Report · Apr–Jun 2026 · Aurelia Heights, Phase 2",
  "dates_line": "Filed 15 Jul 2026 · we fetched it 16 Jul 2026 · last checked live 14 Oct 2026",
  "page": "p. 3", "extract": "Units booked: 72% of total. Physical progress, all towers: 41%.",
  "read_line": "Read by two AI extractors; they matched. Checked by a person on 16 Jul 2026.",
  "used_in": ["Reason 1 of Delivery risk", "Records → QPR filings"],
  "developer_says": null, "corrections_line": "No corrections.",
  "snapshot": { "sha256_short": "91f4c6a2…5e0d7b38", "fetched_at": "2026-07-16T…" },
  "official_url": "https://haryanarera.gov.in/…", "view_label": "View on HARERA",
  "report_error": { "ref_prefix": "E", "sla_line": "We answer within 15 working days." } }
```

### 4.7 `api.follow(p_slug, p_follow_type, p_source, p_client_id)` → `plinth.follow/1`

```json
// request
{ "p_slug": "aurelia-heights-phase-2", "p_follow_type": "watching", "p_source": "web", "p_client_id": "6f0e…" }
// response
{ "schema": "plinth.follow/1", "slug": "aurelia-heights-phase-2", "follow_type": "watching", "followed_at": "2026-07-01T10:12:00+05:30",
  "alerts_line": "Band changes, filings, orders and extensions. Utility alerts only.",
  "private_line": "Your family circle doesn't see your follow type." }
```
`api.set_follow_type(p_slug, "booked")` adds payment-stage alerts and returns links to Pay-as-built and "What a booked buyer can do". `api.unfollow(p_slug)` returns `{ ok: true }`.

### 4.8 `api.following_feed(p_since timestamptz default null)` → `plinth.following_feed/1` (F-93)

```json
{ "schema": "plinth.following_feed/1",
  "since": "2026-10-14T08:40:00+05:30", "heading": "What changed since 14 Oct?",
  "last_looked_line": "Last looked 14 Oct 2026, 8:40 am · 5 unread",
  "summary_line": "5 changes across your 4 projects: 1 extension, 1 filing on time, 2 missing filings and 1 price change. No band moved.",
  "changes": [
    { "event_id": "…", "slug": "coral-towers", "kind": "extension_granted", "occurred_on": "2026-10-14",
      "line": "Coral Towers got a second extension, to Aug 2029.", "before_pill": "Feb 2029", "after_pill": "Aug 2029", "sources": ["…"] },
    { "event_id": "…", "slug": "aurelia-heights-phase-2", "kind": "qpr_missing", "occurred_on": "2026-10-15",
      "line": "The Jul–Sep 2026 QPR is not on HARERA yet. It was due 15 Oct 2026.",
      "developer_says": { "line": "Developer says: filed 12 Oct, not yet verified." }, "sources": ["…"] }
  ],
  "quiet": [ { "slug": "kestrel-park", "line": "Nothing new for Kestrel Park since 14 Oct." } ],
  "projects": [ { "slug": "sapphire-grove-phase-1", "chip": "…", "follow_type": "watching", "row_line": "New QPR in · re-score due by 19 Oct",
      "freshness_line": "…the new one is being read", "family_line": "Meera follows too" } ],
  "replay": { "from": "2026-07-01", "to": "2026-10-18",
    "jump_chips": [ { "label": "Your last look · 14 Oct", "date": "2026-10-14" }, { "label": "1 Oct", "date": "2026-10-01" }, { "label": "When you followed · 1 Jul", "date": "2026-07-01" } ],
    "marks": [ { "date": "2026-10-02", "kind": "band_changed", "band": "elevated" } ] },
  "record": [ "…ChangeItem before the replay date (11 events)" ],
  "digest": { "cadence": "weekly_sun_9am", "next_line": "Next digest Sun 25 Oct, 9 am" } }
```
`api.mark_following_seen()` sets `following_seen_at = ops.now()`.

### 4.9 `api.alert_prefs_set(p_prefs)` → `plinth.alert_prefs/1`

```json
// request
{ "p_prefs": { "push": { "band_change": "instant", "filings": "instant" },
    "whatsapp": { "band_change": "instant", "digest": "weekly_sun_9am" },
    "quiet_hours": { "from": "22:00", "to": "08:00" } }, "p_client_id": "…" }
// response
{ "schema": "plinth.alert_prefs/1", "prefs": { "…": "…" }, "whatsapp_optin": true,
  "lines": ["Utility alerts only. No offers, no ads, and nothing from developers.", "Reply STOP to end alerts."],
  "number_line": "3 parties can reach you now. Family in your circle never see it." }
```
Turning WhatsApp on for a user without a linked WhatsApp contact returns `consent_required`, and the client opens the WhatsApp opt-in.

### 4.10 `api.who_has_my_number()` and `api.consent_withdraw(p_ref)` → `plinth.who_has_my_number/1`

```json
{ "schema": "plinth.who_has_my_number/1",
  "count_line": "3 parties can reach you", "rule_line": "Your number is never shared without your tap.",
  "parties": [
    { "ref": "C-1012-04", "party": "Orbis Land site office", "detail": "Kestrel Park site visit", "shared_on": "2026-10-12",
      "access_until": "2026-11-11", "pays_line": "Developer · pays us nothing", "number_shared": true, "status": "active" },
    { "ref": "C-1012-05", "party": "Larkspur Realty", "detail": "Your agent of record for Kestrel Park (you added them; shared by your tap after the visit)",
      "shared_on": "2026-10-12", "access_until": null, "pays_line": "Agent · paid by the developer or you, never by Plinth", "number_shared": true, "status": "active" },
    { "ref": "C-1015-02", "party": "Meridian Habitat site office", "detail": "Sapphire Grove Ph 1 site visit", "shared_on": "2026-10-15",
      "access_until": "2026-11-14", "pays_line": "Developer · pays us nothing", "number_shared": true, "status": "active" }
  ],
  "relays": [ { "ref": "C-1018-11", "party": "Northfield Estates site office", "line": "Aurelia visit Sat 24 Oct, 11 am, code 4821: the site office gets your first name and a relay, not your number.", "counts_toward_cap": false } ],
  "ended": [ { "ref": "C-0902-01", "party": "Meridian Habitat sales office", "detail": "Price list", "ended_on": "2026-10-02" } ],
  "family_line": "Family in your circle can't see your number and aren't counted here." }
```
`api.consent_withdraw("C-1012-04")` →
```json
{ "ref": "C-1012-04", "withdrawn_at": "…", "effects": ["Orbis Land site office can no longer see your number.", "We've asked them to delete it.", "2 parties can reach you."] }
```

### 4.11 Family circle: `api.family_invite_create(p_scope)` (app/web) and WhatsApp "JOIN <code>"

```json
// request
{ "p_scope": { "slugs": ["aurelia-heights-phase-2"] } }
// response
{ "schema": "plinth.family_invite/1", "code": "AH2-7KQ", "link": "https://plinth.in/j/AH2-7KQ", "expires_on": "2026-10-25",
  "scope_line": "Aurelia Heights, Phase 2", "share_text": "…", "rules": ["Works for one person for 7 days.", "Carries no phone number."],
  "private_line": "Stays private to you: cost sheets, visit passes, payment alerts and who has your number." }
```
The relative's WhatsApp message `JOIN AH2-7KQ` → `wa-webhook` → `ops.family_join_by_code(code, wa_contact)` → session reply "You've joined…" (the relative messaged first, so no template is needed). An expired, used or unknown code gives a neutral reply. `api.family_invite_preview("AH2-7KQ")` powers `/j/[code]`: `{ inviter_first_name: "Rohan", scope_line, rera_number, what_you_get[], number_line: "Rohan sees that you joined, never your number." }`.

### 4.12 `doc-check` (edge) + `api.doc_check(p_id)` → `plinth.doc_check/1` (F-90, F-10, F-92, F-94, F-91)

Start (after `api.create_upload` returns a signed upload URL and the file is PUT):
```json
// POST /functions/v1/doc-check
{ "upload_id": "…", "kind": "claims", "channel": "web", "phase_hint": null }
// 202
{ "check_id": "…", "status": "reading", "poll_after_ms": 1500 }
```
Poll `api.doc_check(p_id)` until `status` ∈ {`confirm_project`, `done`, `unreadable`, `no_claims`, `partly_readable`, `outside_coverage`}. Nothing is checked before the buyer confirms (`api.doc_check_confirm(p_id, p_slug)`):
```json
{ "schema": "plinth.doc_check/1", "id": "…", "kind": "claims", "status": "done", "doc_label": "Flyer",
  "project_match": { "slug": "aurelia-heights-phase-2", "method": "rera_number", "confirmed": true,
    "line": "We matched the RERA number on the flyer: GGM/673/405/2022/117." },
  "summary_line": "4 of 7 claims differ from the records.",
  "breakdown_line": "1 matches. 1 isn't in any record we read. 1 can't be checked until the Jul–Sep QPR is filed.",
  "rows": [
    { "seq": 1, "says_label": "Flyer says", "says_text": "POSSESSION DEC 2026", "verdict": "differs", "verdict_label": "Differs",
      "records_line": "Original completion Dec 2027, no extensions; 41% built.", "how_checked": "Date compared with the HARERA registration.",
      "sources": ["…"], "broker_question": "Which completion date will my agreement carry?", "page": 1, "bbox": [0.08, 0.31, 0.62, 0.38] },
    { "seq": 2, "says_text": "Structure up to 12th floor", "verdict": "cant_check", "verdict_label": "Can't check yet",
      "records_line": "Slab 9 at the last filing. The Jul–Sep QPR, due 15 Oct, is not on HARERA.", "checkable_on": null,
      "developer_says": { "line": "Developer says “filed 12 Oct”, not verified." } }
  ],
  "actions": { "share_text": "…summary only, never the file…", "broker_questions": ["…4…"] },
  "notes": ["Not legal advice. We never certify title.", "We keep this file for 30 days, then delete it, unless you save it to your account."],
  "rules_version": "2026.10" }
```
Other kinds reuse the same shape:
- `pay_as_built`: rows are stage, plan, amount and payee. Headline "The latest filing shows slab 9. This letter asks for the slab 12 instalment."
- `cost_sheet`: adds `cost` (CostBreakdown).
- `before_you_pay`: adds `payee` (§4.14).
- `visit_recap`: "1 of 5 things they told you differs from the records."

Verdict labels are only Matches · Differs · Not in records · Can't check yet. `DocCheckRow` may carry an optional `records_label` ("Records show", "Price list shows", "Your plan shows").

### 4.13 Calculators: `api.cost_breakdown` and `api.afford_the_wait`

```json
// api.cost_breakdown("aurelia-heights-phase-2", "3 BHK", "male", [])
{ "schema": "plinth.cost_breakdown/1", "rules_version": "2026.10", "basis_line": "3 BHK, 1,450 sq ft carpet / 2,000 super · park-facing · cost sheet of 2 Oct 2026",
  "lines": [
    { "code": "base", "label": "Base", "amount_inr": 23500000, "amount_label": "₹2.35 Cr", "tag": null },
    { "code": "plc", "label": "PLC (park-facing)", "amount_inr": 290000, "amount_label": "₹2.9 L", "tag": "often_negotiable" },
    { "code": "club", "label": "Club", "amount_inr": 150000, "amount_label": "₹1.5 L", "tag": "often_negotiable" },
    { "code": "parking", "label": "Parking", "amount_inr": 350000, "amount_label": "₹3.5 L", "tag": null },
    { "code": "ifms", "label": "IFMS", "amount_inr": 130000, "amount_label": "₹1.3 L", "tag": "refundable_deposit" },
    { "code": "gst", "label": "GST 5%", "amount_inr": 1221000, "amount_label": "₹12.2 L", "tag": "set_by_law" },
    { "code": "stamp_registration", "label": "Stamp duty + registration", "amount_inr": 1759400, "amount_label": "₹17.6 L", "tag": "set_by_law" }
  ],
  "charges_total_label": "₹9.2 L", "all_in_inr": 27400400, "all_in_label": "₹2.74 Cr", "per_sqft_carpet_label": "₹18,900 per sq ft carpet",
  "vs_quoted_line": "17% more than quoted", "negotiable_line": "Often negotiable: PLC and club (₹4.4 L).",
  "move_in_line": "About ₹12–18 L on top, around the offer of possession (Plinth estimate)." }
```
With `p_waive = ["plc","club"]` the all-in falls by ₹4,92,800 ("₹4.9 L less").

```json
// api.afford_the_wait(p_slug, p_tower "A", p_take_home_inr 450000, p_rent_inr 55000, p_down_pct 20, p_rate_pct 8.5, p_tenure_years 20, p_delay_months 12)
{ "schema": "plinth.afford_the_wait/1",
  "answer_line": "Rent and pre-EMI come to ₹1,18,077 a month now, rising to ₹2,00,563 by Dec 2027 (26% → 45% of take-home).",
  "now": { "monthly_inr": 118077, "share_pct": 26 }, "by_completion": { "label": "By Dec 2027", "monthly_inr": 200563, "share_pct": 45 },
  "delay": { "months": 12, "cost_inr": 2406756, "cost_label": "₹24.1 L" }, "after_keys": { "emi_inr": 190227 },
  "series": [ { "month": "2026-11", "pre_emi_inr": 63077, "rent_inr": 55000, "delay": false } ],
  "frequency_line": "Between 30 and 45 of 100 similar projects were more than 12 months late.",
  "assumptions": ["Loan = 80% of the all-in (₹2.74 Cr, rounded to the lakh).", "Payout follows the plan for Tower A.", "The delay comes after finishing.", "RERA s.18 interest is left out."],
  "framing_line": "Arithmetic, not advice." }
```
The golden vectors in `packages/fixtures/vectors/afford_the_wait.json` pin ₹1,18,077 / ₹2,00,563 / ₹24.1 L / ₹48.1 L (24 months) / ₹1,90,227.

### 4.14 `api.before_you_pay_check` → `plinth.payee_check/1` (F-94)

```json
// request (POST; the account number is hashed and never stored)
{ "p_slug": "aurelia-heights-phase-2", "p_payee_name": "Northfield Realty Services LLP", "p_account_number": "919020045118082",
  "p_ifsc": "MRGL0000912", "p_amount_inr": 1100000, "p_stage": "before_agreement", "p_paid_so_far_inr": 0, "p_method": "transfer" }
// response
{ "schema": "plinth.payee_check/1",
  "payee": { "matched": 0, "of": 3, "verdict": "differs", "verdict_line": "Doesn't match the account registered with HARERA",
    "rows": [
      { "field": "payee_name", "entered_line": "Northfield Realty Services LLP", "registered_line": "Aurelia Heights Ph 2 RERA Collection Account, Northfield Estates Pvt Ltd", "result": "differs" },
      { "field": "account", "entered_line": "ending 8082", "registered_line": "ending 4417", "result": "differs" },
      { "field": "ifsc", "entered_line": "MRGL0000912 · Marigold Bank", "registered_line": "PEPL0000418 · Peepal Bank", "result": "differs" } ],
    "advice": ["Pause.", "Ask for written confirmation on letterhead.", "Call the number on HARERA, not one from a message."] },
  "cap": { "limit_inr": 2442000, "limit_label": "₹24.4 L", "basis_line": "10% of ₹2.44 Cr (base + charges, cost sheet of 2 Oct 2026), RERA s.13",
    "within": true, "line": "₹11,00,000 is within the ₹24.4 L limit before a registered agreement." },
  "method": { "ok": true, "line": null },
  "never_line": "Plinth never takes, holds or moves your money." }
```
The booking-form case returns `matched: 3`, `verdict: "matches"`.

### 4.15 `ask` (edge) → `plinth.ask_answer/1` (Ask Plinth)

```json
// POST /functions/v1/ask
{ "question": "aurelia ka possession kab tak hoga?", "slug": "aurelia-heights-phase-2", "thread_id": null, "channel": "app", "voice": { "heard": "aurelia ka possession kab tak hoga" } }
// 200
{ "schema": "plinth.ask_answer/1", "thread_id": "…", "kind": "answer",
  "disclosure_line": "Ask Plinth is an AI. It answers from public records like HARERA and shows its sources.",
  "sentences": [
    { "text": "The original RERA completion date is Dec 2027, with no extensions so far.", "cite": [1] },
    { "text": "41% is built with 77% of the promised time used.", "cite": [2] },
    { "text": "Between 30 and 45 of 100 similar Gurugram projects got their OC more than 12 months late, which here means after Apr 2029.", "cite": [3] }
  ],
  "sources": [ { "n": 1, "label": "HARERA registration", "fact_id": "…" }, { "n": 2, "label": "HARERA QPR · Apr–Jun 2026", "fact_id": "…" }, { "n": 3, "label": "Plinth method v1.2", "fact_id": "…" } ],
  "cards": [ { "…": "ProjectCard" } ], "actions": [ { "label": "Follow this project", "action": "follow" } ],
  "refusal_code": null,
  "handoff": { "label": "Talk to a Plinth adviser · free · developers never pay us", "hours_line": "Mon–Sat 10 am–7 pm, usually within 4 working hours" },
  "as_of_line": "Records as of 14 Oct 2026" }
```
For a refusal: `kind: "refusal"`, a `refusal_code` (e.g. `advice_buy_sell`) and the §5b templated text ("I can't tell you whether to buy…" + the four checks). An offline app client queues the question (§5b offline line).

---

## 5. Webhooks and hooks

### 5.1 WhatsApp inbound: `GET/POST /functions/v1/wa-webhook`

- **Verify:** `GET ?hub.mode=subscribe&hub.verify_token=<WA_VERIFY_TOKEN>&hub.challenge=<n>` returns `<n>` when the token matches, otherwise 403.
- **POST:** 
  1. Verify `X-Hub-Signature-256 = sha256=HMAC(WA_APP_SECRET, raw body)`.
  2. Upsert `pii.wa_contacts` and set `last_inbound_at`.
  3. Insert `comms.wa_messages`, unique on `wa_message_id` (a duplicate returns 200 at once).
  4. Return **200 within ~1 s**. Routing runs in `EdgeRuntime.waitUntil`, and a 1-minute sweeper retries anything unrouted.
- **Statuses** (`sent|delivered|read|failed`) update `comms.outbox` and `comms.wa_messages`.

The payload is Meta's standard `{ "object": "whatsapp_business_account", "entry": [ { "changes": [ { "value": { "messages": [...], "statuses": [...], "contacts": [...] } } ] } ] }`. Recorded fixtures live in `packages/fixtures/recorded/wa/*.json` (text, image, document, audio, interactive button_reply/list_reply, nfm_reply, status).

**Intent router** (first match wins):

| Inbound | Handler | Reply | Artboard | M |
|---|---|---|---|---|
| `JOIN <code>` | family.join | Session text + "You'll get the same alerts…" | AppFamily / WaDigest | M2 |
| `STOP`, "Stop alerts", "Stop weekly" | prefs.stop | Confirms what still comes ("Band changes still come") | WaAlerts / WaDigest | M2 |
| Project name, RERA number or a plinth.in link | risk.card | Risk card image + caption + buttons "Why this band" · "Follow project" · "Ask" | WaRisk | M2 |
| A forwarded card image (pHash match) | card.changed | "Changed since this card was sent" card | WaDigest | M2 |
| Image/PDF → classified as flyer, brochure or hoarding | claims | "Reading the flyer" → confirm buttons "Yes, that one" · "No, another one" → claims card + "See all claims" | WaClaims | M3 |
| Image/PDF → cost sheet | cost | Cost card + list "See each line" (≤ 10 rows) + "Talk to an adviser" | WaCost | M3 |
| Image/PDF/text → payment request or demand letter | before_pay / pay_as_built | Payee check or stage check card | WaBeforePay | M3 |
| Audio | transcribe → recap (if a visit was today) or ask | "1 of 5 things they told you differs…" or an answer | WaVisitPass | M5 |
| "Book a visit" button, or a visit intent | flows.visit_booking | WhatsApp Flow (4 screens incl. "Working with an agent?") → pass card | WaAlerts / WaVisitPass | M5 |
| "I'm an agent" | flows.agent_onboarding | 3-step Flow with a live HARERA check → "Verified agent" | WaAgentOnboarding | M5 |
| Sender is a developer org member | dev.* | Heads-up acknowledgement, receipt Flow (CL-), today's visits | WaDevAlerts | M4 |
| Anything else | ask | Ask Plinth answer (English) or a templated refusal | — | M2 (templates) / M5 (AI) |

### 5.2 WhatsApp outbound (`outbox-dispatch` → Graph API `POST /{WA_PHONE_NUMBER_ID}/messages`)

**Rules:**
- A session message is sent only if `last_inbound_at` is within 24 h. Otherwise an **approved utility template** is sent, and only for a subscription the user turned on.
- Quiet hours delay non-urgent sends (`not_before`). Dedupe keys stop repeats.
- At most 1 "developer replied" message per band change.
- No marketing templates in R1.
- In mock mode, request bodies are written to `comms.wa_messages` with status `mock_sent` and are snapshot-tested.

**Template catalogue** (`packages/contracts/catalogues/wa_templates.json`; language `en`):

| Code (Meta name) | Category | Header | Variables | Buttons | Artboard | M |
|---|---|---|---|---|---|---|
| `login_code` | AUTHENTICATION | — | code | Copy code | WaAlerts | M2 |
| `band_change_alert` | UTILITY | Image 1.91:1 (band on its fill) | project, from band, to band, trigger, date | Quick reply "Open full card", "Stop alerts" | WaAlerts | M2 |
| `filing_alert` | UTILITY | — | project, event line, date | "Open full card", "Stop alerts" | WaAlerts | M2 |
| `weekly_digest` | UTILITY | Image 1080×570 (one floor per project) | week range, n changes, the one fact that may move a band | "See changes", "Stop weekly" | WaDigest | M2 |
| `daily_digest` | UTILITY | — | date, n changes | "See changes", "Stop daily" | WaDigest | M2 |
| `developer_replied` | UTILITY | — | developer, project, date | "Read the reply" | WaDevAlerts (buyer side) | M4 |
| `family_removed` | UTILITY | — | inviter first name, project | — | AppFamily | M2 |
| `export_ready` | UTILITY | — | expiry date | CTA URL | AppYou | M2 |
| `visit_booked`, `visit_reminder`, `visit_recap_prompt` | UTILITY | Image (pass) | project, date/time, code | "Directions", "Cancel visit" / "Send recap" | WaVisitPass | M5 |
| `relay_message` | UTILITY | — | party, project | "Reply" | WebDevInbox ↔ buyer | M4 |
| `dev_heads_up`, `dev_notice_7day`, `dev_new_enquiry`, `dev_visits_today`, `dev_capture_link`, `dev_stale_price_list` | UTILITY | — | project, dates, refs | CTA URL to the workspace | WaDevAlerts | M4 |
| `agent_verified` | UTILITY | — | agent name, registration | CTA URL | WaAgentOnboarding | M5 |

**Interactive limits** (enforced by Deno tests): ≤ 3 reply buttons, each ≤ 20 chars; one CTA URL button ≤ 20 chars; list ≤ 10 rows with titles ≤ 24 chars. The card image is a 1080×1350 PNG from `/cards/…`; Meta fetches the URL.

### 5.3 WhatsApp Flows: `POST /functions/v1/wa-flows`

Meta's encrypted data exchange is `{ encrypted_flow_data, encrypted_aes_key, initial_vector }`. We RSA-OAEP-decrypt the AES key with `WA_FLOWS_PRIVATE_KEY`, AES-GCM-decrypt the payload, route on `{ action, screen, data, flow_token }`, and return the response encrypted with the flipped IV.

| Flow | Screens | M |
|---|---|---|
| `visit_booking` | Slot → visitors → "Working with an agent?" (Larkspur / another agent with a HARERA check / no agent; **nothing preselected**) → confirm with consent line | M5 |
| `agent_onboarding` | HARERA number check → PAN (format + name match; masked PAN only stored) and coverage → call booking | M5 |
| `dev_receipt` | Receipt PDF + acknowledgement number → "Received · CL-202, checking by 20 Oct" | M4 |

### 5.4 Auth hooks (Supabase)

| Hook | Contract |
|---|---|
| Send SMS hook → `auth-sms-hook` | In: `{ user: { phone }, sms: { otp } }` (Standard Webhooks signed). The channel defaults to WhatsApp (`login_code`), falling back to SMS (MSG91, DLT template, sender "PLINTH"). The code lasts 10 min, resend after 30 s. Mock mode logs `otp` only when `PLINTH_ENV=local` |
| Custom access token hook → `ops.custom_access_token_hook(event jsonb)` | Adds `plinth_roles[]` and `org_roles {org_id: role}` to claims. Pure SQL, tested in pgTAP |
| Test OTP | `config.toml [auth.sms.test_otp]`: fixture numbers such as Rohan `+919900000318 = 123456`. They exist in local, CI and dev only |

### 5.5 Internal triggers

| Caller | Target | Auth |
|---|---|---|
| pg_cron (every 10 s) and an insert trigger via pg_net | `outbox-dispatch` | `x-plinth-dispatch-secret` from Vault |
| pg_cron Sun 09:00 IST / daily 08:00 IST | `ops.enqueue_digests(cadence)` (SQL) → outbox | — |
| pg_cron daily 02:30 IST | `retention-sweep` | Dispatch secret |
| Score publish | `ops.on_run_published()` → `core.events` → fan-out → outbox `revalidate` job → `POST /api/revalidate` | Revalidate secret |
| Payments (M6, `pro_paywall`) | `payments-webhook` (provider signature) → `app.pro_purchases` | Provider HMAC |
