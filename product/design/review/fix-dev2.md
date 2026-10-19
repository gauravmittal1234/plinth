# Developer workspace, fix pass 2: the remaining developer gaps

Screens: three new boards (`WebDevOnboarding`, `AppDevCapture`, `WaDevAlerts`) and edits to `WebDevPortal`, `WebDeveloper`, `WebDevFacts`, `WebDevInbox` and `WebDevLiveRecord`. All of them are in `scratchpad/canvas/project/`.
Owner: principal B2B product design. Date: 18 Oct 2026.
Inputs:
- `product/evaluation/developer.md`: G08–G11, G13–G20, the value proposition and the missing-screens list.
- `fixpass-developer.md`, especially what it did not cover.
- DESIGN.md §0, §3–§4c, §5b and §7.
- PRD §6.2–§6.3, §12.1, §16 and §20.

**D1 holds everywhere.** Nothing added here is paid or tiered. Nothing feeds a band, a reason, search order or an AI answer. Every new board closes with "No developer pays us. Ever." or carries it in the copy.

**How it was checked.** I didn't open a browser, publish anything, or edit `canvas.json` or any board I don't own. Every file passed these checks:
- `tools/wf.py`: tag balance, quoted attributes, JS parse, `data-props` JSON, and root `min-height` equal to `$preview`.
- `tools/dccheck.py`: exactly one `support.js` and no non-dotted holes. Every `sc-if` and `sc-for` has its hint.
- `tools/smoke.js` and `tools/probe.js`, run in Day and Night across the key states, with every new handler clicked and its values read back.
- `tools/holecheck.py`: no undefined holes in any tested state.
- WebDeveloper's two new tweaks are props, not state, so they were also run through a small props harness (`fixdev2/propsmoke.js`).
- A grep for banned styles: glass, gradient washes, resting shadows, dashed boxes, uppercase and type under 13 px. The only hits are WebDeveloper's existing data hatches and photo scrim, and the one floating sheet in WaDevAlerts.

Backups of the five boards as they were before this pass are in `scratchpad/fixdev2_backup/`.

---

## Gap map: where each one is closed

| Gap | Closed in | What was built |
|---|---|---|
| **G08** Legal intake + facts-only fallback | `WebDevPortal` § "Need to send a formal notice?" (`#legal`); `WebDeveloper` tweak `mode = Facts-only` | **Intake** (the footer link "Legal notices and grievances" now points here):<br>• Three types: legal notice, grievance, and court or regulator order.<br>• Upload, an optional counsel reference, and "Sent as Ananya Rao, Admin". Only Admins can send.<br>• It routes to **counsel, not the scoring team**.<br>• On send, a case reference **LN-031** and a status timeline: acknowledged within **48 h** (by 20 Oct 2026), evidence pack within **5 working days** (by 23 Oct) with sources, snapshot hashes, method version and dispute history, and counsel's written reply within **15 working days** (by 6 Nov).<br>• It states that a notice doesn't pause a band, and that a court order switches the page to facts-only.<br>• Registered address, Grievance Officer and counsel are founder-to-fill placeholders, styled as on WebAbout.<br>**Facts-only state:**<br>• A hero pill: "Bands withheld pending review, from 18 Oct 2026".<br>• A band explaining "Why is there no band on this page?": what is still shown, what is withheld everywhere, and that it is not a finding.<br>• Every project chip reads "Band withheld · facts only".<br>• In the search preview the project shows "Band withheld" and stays in results whatever the risk filter. **⚑ Legal + founder** |
| **G09** Onboarding and claiming | `WebDevOnboarding` (new) | A pre-claim page for a developer new to Gurugram RERA, **Ashgrove Realty** (fictional, see Facts added). In order:<br>• **The 14-day notice**, switchable between email, registered post and WhatsApp. Its delivery log is kept as S1 gate evidence.<br>• **The claim**: claim code plus work email, matched to HARERA, with plain rejection reasons for a wrong code, a free-mail domain and a wrong domain.<br>• **Signatory verification**, three checks: a company-domain email code, a board resolution signed by 2 directors on MCA, and a HARERA contact match.<br>• **Group map**: accept or dispute each link, with "common directors only" flagged.<br>• **Team invites** with the five roles. Invites are locked until the signatory is verified, and only the company domain is accepted.<br>• **First-week checklist**: 7 items.<br>Signature: **the public line, live**. A sticky preview of the developer page as it will look on 30 Oct 2026. It reads "Invited 16 Oct 2026 · not yet claimed" and flips to "Claimed · verified signatory" only when all three checks pass. **⚑ Founder** (policy) |
| **G10** Phone capture | `AppDevCapture` (new); `WebDevFacts` "Construction updates" | A 390 × 844 phone web page that Pradeep Yadav (Site) opens from a one-time WhatsApp link valid for 24 h.<br>• A **boundary check** against the RERA footprint, plus a time check against network time.<br>• Live camera only; gallery uploads are off.<br>• Tags for tower and slab, with "Latest QPR on record: Tower A at slab 9" and an "ahead of the QPR" note.<br>• Sealing (SHA-256), then the buyer-facing result: **"Location-verified · from the developer"**, with "Progress not verified until the next QPR".<br>• What happens next: Arjun publishes, followers get at most one update a month (next 16 Nov), and a photo never moves a score.<br>The states are locating, inside, sealing, done and closed.<br>Signature: **the boundary check**. The GPS dot glides from outside the gate into the footprint next to Tower A, the accuracy ring tightens, and only then does the shutter become the primary action.<br>WebDevFacts now uses the same label and says the link arrives on WhatsApp. **⚑ Legal** (location data) |
| **G11** Normalised complaints | `WebDeveloper` § "What has HARERA decided on complaints?"; `WebDevPortal` projects table, notice, lanes and preview | **WebDeveloper:**<br>• The headline "7" now carries "or **0.23 per 100 units**".<br>• A third chart mode, **Per 100 units**, re-scales the bars, and every bar label and aria text gives both figures.<br>• The selected half-year reads "7 decided against the promoter, or 0.23 per 100 units on 2,980 units".<br>• A 24-month line: "24 decided against the group, or 0.7 per 100 units. Aurelia had 14, or 2.8 per 100 units on 500".<br>• A unit-base note, and "Units (HARERA)" added to every project's fact panel so the base can be checked.<br>**Portal:** the group line, the Legal fact in the lanes and the buyer-card preview all give count plus rate. "Similar projects: 3" is clarified as a median count. **⚑ Methodology** (denominator) |
| **G13** Buyer signals | `WebDevPortal` § "What did buyers look at last month?" (`#signals`) | A monthly panel with project and month pickers (Aug or Sep 2026). It shows:<br>• project-page visitors, against the previous month;<br>• the share who **saw the band**, with the band that was shown that month (Moderate in Aug–Sep, per §5b);<br>• new followers;<br>• top AI-clustered **buyer questions** and the **most-opened facts**, as bars.<br>**k-anonymity is stated and enforced in the data:** any count under 20 reads "fewer than 20", and suppressed rows are counted, never shown. Heron Point, Phase 2 demonstrates the suppression. There is a CSV of aggregates only. "Never sold" and "never feeds a score, search order or AI answer" are stated. **⚑ Founder + legal** |
| **G14** Tone | All developer boards | See "Tone changes" below |
| **G15** Path back | `WebDevPortal` § "What would improve this band?" (`#path-back`) | Per project (Aurelia Heights or Cedar Walk, Phase 2):<br>• today's band chip and the public "What would change this" line, word for word as on the buyer card;<br>• **three checkable steps**, each with its status pill and the record that proves it. For Aurelia: get the Jul–Sep QPR on record before 25 Oct; narrow the sold–built gap from 31 to ≤ 21 points across two QPRs; file both on time, which takes late filings from 3 of 8 to 2 of 8;<br>• the result line ("moves to Moderate when the Oct–Dec 2026 QPR is on record, due 15 Jan 2027");<br>• a **turnaround history** (15 Jul first scored, then 2 Oct, then the pending 25 Oct).<br>Steps update live when CL-202 is sent. It also says evidence never moves a band alone, and that recency weighting is on the v1.3 agenda. **⚑ Methodology** (thresholds) |
| **G16** Respond where buyers hear the news | `WaDevAlerts` (new); `WebDevPortal` § reply, "Where buyers will read it" | **Developer side:** Neha's (Compliance) phone shows D-127 acknowledged and today's **private heads-up**. Signature: **answer the heads-up in the chat**, via a WhatsApp Flow sheet that takes the receipt PDF and acknowledgement number, then returns "Received · CL-202, checking by 20 Oct". Vikram's (Sales) phone shows Ishita's enquiry with no number, Rohan's visit with code 4821, and "3 need a reply".<br>**Buyer side:** a follower's thread shows the 2 Oct alert and the **15 Oct "Northfield Estates replied to this change"** message, with the reply quoted word for word in the Developer-says tone field. After CL-202, a live line shows the card's new marker, and says followers get no message for a request, only for the outcome. **⚑ Founder** (follower messaging) |
| **G17** Launch support | `WebDevFacts` § "Launching a new phase?" (`#launch`) | A private draft for **Cedar Walk, Phase 3** (fictional):<br>• draft facts, which the register replaces and locks on the day;<br>• four approvals with honest status;<br>• a "publish the price list on the day" switch.<br>A two-state preview, "Today" or "The day HARERA registers it", shows the live page: **"Not scored yet"**, register facts as Public record, developer items in the "From the developer · not verified" tone field, and one follower alert, "registered a new project". Also stated: "No page, link, QR or price before the registration. Plinth never shows a project, takes an expression of interest or touches money before its RERA number." |
| **G18** How buyers find you | `WebDeveloper` § "How do buyers find Northfield's projects?" (`#find`) | Three plain rules:<br>• **Order never follows money.** Default sort is lowest delivery risk; lender fees never touch ranking.<br>• **Only verified facts count.** Developer content is labelled and never ranks, and claiming doesn't move a project.<br>• **Bands show in Compare.** The Low filter keeps Low and Moderate, and the hidden count is shown.<br>A small live **search preview** with a "Low delivery risk only" toggle shows Aurelia being hidden and the line buyers see ("1 project hidden by the buyer's filter"). In facts-only mode it shows "Band withheld" instead. **⚑ Founder** (reading of "verification affects ranking") |
| **G19** Not desktop-only | `AppDevCapture`; `WaDevAlerts`; `WebDevPortal` § Team | Phone capture and WhatsApp utility alerts as above. In the portal, the Team table gains a **WhatsApp alerts** column with a per-person on/off toggle and what each role receives: notices to Admin and Compliance, enquiries to Sales, today's visits and capture links to Site, stale price lists to Marketing. A line under the table states the **mobile-web** promise: every workspace page works at 390 px, and notices, the three lanes, enquiries and check-in are phone-first. WaDevAlerts repeats it, and every alert button opens the workspace on the phone it arrives on |
| **G20** Unclaimed / no response | `WebDeveloper` tweak `claim = Not claimed` + § "Who answers for Northfield here?" (`#claim`); `WebDevOnboarding` | The hero carries a white pill: "Claimed by Northfield · verified signatory", or "Invited 24 Nov 2025 · not yet claimed". The new section shows the same line as a specimen, a one-sentence statement ("That is all this line means…"), what claiming does and doesn't do, and "we never call anyone uncooperative". In the not-claimed state the reply section shows the neutral "We invited Northfield Estates to respond on 3 Oct 2026. No response yet." and hides the dispute counts. Onboarding shows the same line in its preview and in "What if you don't claim?" |
| **Fix** Missing Jul–Sep QPR is public now | `WebDevPortal` | The rules were already right; four places now make it explicit:<br>• a filled ink **"Public now · Jul–Sep 2026 QPR not on HARERA"** pill in the projects table;<br>• a **"Public now"** pill on the notice, which reads "Buyers see the missing QPR today: on the project page, in the app and in follower alerts. Only the band waits for this notice.";<br>• the buyer-card preview heads it "Public now · new on record";<br>• the held states say "Buyers still see the missing QPR". The old "Buyers see nothing yet" is gone; only the band change is private. |

### Tone changes (G14)

| Where | Before | After |
|---|---|---|
| WebDeveloper complaints heading | "Are buyers going to HARERA?" | "What has HARERA decided on complaints?" |
| WebDeveloper reply label | "Developer says · not yet verified · … · 15 Oct 2026" (open-ended) | "… · 15 Oct 2026 · we check it by 5 Nov 2026" |
| WebDeveloper complaints | Absolute counts only | Count plus rate, and "A bigger group isn't penalised for its size." |
| WebDevPortal evidence lane | "Photos must carry location and time." | "Photos need their location and time." |
| WebDevPortal path back | (new) | "…so you know exactly what would move the band, and when." The first draft's "can't be argued into a better band" was cut |
| WebDevPortal held notice | "Buyers see nothing yet." | "Only you see this: the proposed change… The missing QPR below stays public." |
| WebDevOnboarding | (new) | "We never call a developer 'not cooperating'." The phrase "no response" was removed, because the reply state legitimately uses "No response yet." |
| WaDevAlerts buyer alert | (new) | "Northfield had a heads-up 48 hours earlier." |
| All new copy | (new) | Respectful second person: "Facts change scores; arguments don't" appears once, in the heads-up. Formal-notice copy promises a reply clock and does not warn. Positive outcomes get equal weight ("if the register confirms the filing, they hear that, as they heard the change") |

A scan of the developer surfaces for adversarial words (must, failure, violation, penalty, refuse, uncooperative, not a negotiation) finds no remaining hits in developer-facing copy.

---

## Open decisions (⚑)

**Founder**
1. **New-developer notice.** A developer new to Plinth gets 14 days' notice before its *first* page goes public (S1 rule, extended). Later phases of a claimed developer publish on registration day through the launch kit, with no wait. Confirm both.
2. **Follower message when a developer replies.** WaDevAlerts sends followers one utility message ("Northfield Estates replied to this change") when a public reply lands after an alert. It needs a frequency cap: we propose one reply message per band change. It also needs Meta template approval as utility. The alternative is to attach the reply only to the *next* alert.
3. **G18 reading.** I read "verification affects ranking" as "only verified records feed ranking; claiming or publishing never does". If you meant that claimed or verified developers rank higher, we advise against it: it becomes a lever and contradicts "Ranking never reads anything you publish here".
4. **Buyer signals.** The k threshold (20, as in the brief), the "saw the band" viewport metric (which needs analytics consent wording in WebPrivacy), and the CSV export. All are free and identical for everyone.
5. **Facts-only search placement.** Withheld projects stay in risk-filtered results, listed with Not scored projects and never hidden. The alternative is to exclude them from risk filters.

**Legal**
1. **Facts-only wording.** "while a court considers an application about our bands for this group". Should a page disclose that litigation exists, and who can trigger facts-only (a court order only, or our own decision)?
2. **Notice SLAs.** 48 h acknowledgement, a 5-working-day evidence pack and a 15-working-day reply from counsel. The registered address, Grievance Officer and counsel names are placeholders.
3. **Site capture location data.** It covers employees' GPS and time. We need the DPDP notice for site staff, the retention period for raw location (we keep only "inside/outside" plus accuracy, not the track), and the hash-sealing description.
4. **Board-resolution check.** Two directors listed on MCA, with unclear signatures going to a person within 2 working days.

**Methodology committee**
1. **Complaints denominator.** Registered units at the end of each half-year. This gives 2,980 for 2023–2025 and 3,400 from 2026.
2. **Path back thresholds.** "Construction ahead of sales" is shown as the sold–built gap narrowing to ≤ 21 points over two QPRs. That number is illustrative engine output and must come from the real v1.2 scorecard, consistent with the public "What would change this" line.

---

## Follow-ups for other owners (not in my files)

1. **WaAlerts:** "The developer was told at the same time" should become "Northfield had a heads-up 48 hours earlier", as WaDevAlerts shows. This is the G05 mismatch from the last pass. Separately, WaAlerts (x 940, w 1400) overlaps WaClaims (x 1410) on the canvas.
2. **WebProject, WebProjectStates and AppProject:** add the **facts-only project state** ("Band withheld pending review, from [date]", truth panel only), using the WebDeveloper copy. Also add the neutral **"Invited [date] · not yet claimed"** line to the developer block when a developer hasn't claimed.
3. **Buyer reason line (G11 everywhere):** WebProject, AppRisk, WaRisk, AppVoice, WebCompare and WebMethodology still say "14 complaints … median 3" without the rate. Add "2.8 per 100 units" next to the count.
4. **WebSearch and WebCompare:** a "Band withheld" cell for facts-only projects.
5. **WebPrivacy:** an analytics line for the "saw the band" metric (G13).
6. **DESIGN.md §5b:** add the facts below if they are accepted.

---

## Canvas entries to add or update (please mirror in `canvas.json`)

| File | Title | Page | w × h | Suggested x, y |
|---|---|---|---|---|
| `WebDevOnboarding.dc.html` | Developer workspace · Claim and verify | web | 1280 × **7300**, `expand: fill` | 27200, 0 (after WebClaims), or under WebDevPortal |
| `AppDevCapture.dc.html` | Site capture · phone web (developer) | android | 390 × **844** | 6110, 0 |
| `WaDevAlerts.dc.html` | WhatsApp · developer alerts | whatsapp | 390 × **1880** | 2420, 0 (clear of WaAlerts) |
| `WebDevPortal.dc.html` | Developer workspace · Overview | web | h **11400** (was 8200) | unchanged |
| `WebDeveloper.dc.html` | Developer · Northfield Estates | web | h **9000** (was 6860) | unchanged |
| `WebDevFacts.dc.html` | Developer workspace · From the developer | web | h **4400** (was 3200) | unchanged |

All are `is_interactive: true`. The heights are estimated from the layout arithmetic, not rendered.

WaDevAlerts is **1880 px tall, not about 1200**. It needs the room for:
- a developer thread with two role views and the Flow sheet (about 700 px);
- a buyer thread long enough to show the alert *and* the reply without clipping (640 px);
- headings and notes.
Shorter would mean dropping the buyer thread or going below 16 px chat text.

WebDeveloper has two new tweaks: `mode` (Scored or Facts-only) and `claim` (Claimed or Not claimed).

---

## Facts added (artboard assumptions; add to DESIGN.md §5b if accepted)

**Northfield group (G11, G20)**
- Units per project: Cedar Walk Ph 1 320, Aurelia Heights Ph 1 440, Wren Court 260, Opaline Residences 380, Heron Point Ph 1 420, Linden Square 300, Cedar Walk Ph 2 360, **Aurelia Heights Ph 2 500 (canonical)**, Heron Point Ph 2 420.
- Unit base: 2,980 before Apr 2026, and 3,400 from then.
- Complaints decided against the group: **24 in the 24 months to 14 Oct 2026, or 0.7 per 100 units**. Aurelia Ph 2 accounts for 14 of them. Half-year rates run from 0.07 to 0.23 (Jan–Jun 2025: 7 complaints, or 0.23).
- Claim history: invited 24 Nov 2025 (S1 notice), claimed 2 Dec 2025. This fits the dispute log, whose entries start in Jan 2026.
- Cedar Walk Ph 2: the Jul–Sep 2026 QPR was filed on time.
- Cedar Walk, Phase 3 (Sector 69, Towers D–E, 288 units, 3 BHK 1,380 sq ft from ₹2.18 Cr, 4 BHK 1,960 sq ft from ₹3.05 Cr) is a **private draft, not registered**.

**Signals (G13), Aurelia, Sep 2026**
- 4,860 visitors (Aug 3,920; Jul 3,410).
- 93% saw the band (4,520 of 4,860, Moderate).
- 312 new followers (Aug 245).
- Questions: 186, 152, 97, 58 and 31, with 6 suppressed.
- Facts opened: Apr–Jun QPR 1,240, orders 610, price list of 1 Apr 2026 540, completion 402, group 288.
- Cedar Walk and Heron Point sets are in the file.

**Legal intake (G08):** case reference LN-031.

**WhatsApp (G16):**
- The reply message to followers was sent 15 Oct 2026 at 6:10 pm.
- The CL-202 confirmation came at 9:14 am today.
- The receipt file is `QPR-JulSep2026-acknowledgement.pdf`.

**Capture (G10):** the shared facts list it: 18 Oct 2026, 10:42 and 10:44, Tower A · slab 12, ±8 m, sealed, link opened 10:31 and valid 24 h.

**Onboarding (G09), all fictional**
- **Ashgrove Realty Pvt Ltd**, new to Gurugram RERA.
- Ashgrove Meadows, Phase 1: Sector 79, New Gurugram, RERA GGM/918/650/2026/41, registered 7 Oct 2026, original completion Sep 2031.
- Notice sent Fri 16 Oct 2026; first public page Fri 30 Oct 2026.
- Claim code ASH-7Q4K-2M, valid 30 days.
- Domain `ashgrove-realty.example`.
- Claimant Sanjana Malik.
- Directors Kunal Bhatia and Ritu Sehgal.
- Linked companies: Ashgrove Meadows LLP, and AGR Infraprojects Pvt Ltd (common director only).
- Invitees: Rahul Verma (Sales), Priya Nair (Marketing), Imran Qureshi (Site).

**Consent references:** WebDevInbox now uses the buyer-screen format `C-MMDD-NN` (C-1018-11 Rohan, C-1017-03 Aman, C-1017-05 Nisha, C-1017-06 Ishita, C-1016-04 Farah, C-1016-08 Kabir, C-1015-07 Dev), per the coordinator.

---

## Images

**New requests** (empty `data-slot` divs), in `product/design/assets/requests_dev2.json`:

| Slot | Aspect | Used on |
|---|---|---|
| `slabDeckA` | 4:5 | AppDevCapture: the live camera view, the tray thumbnails and the result card. A freshly cast upper slab with rebar starters and a crane; no text, logos or markings |
| `heroAshgrove` | 16:9 | WebDevOnboarding: the developer-page preview. A site at excavation stage behind a plain hoarding; no text, logos or QR |

**Swapped in, per the coordinator:** `hoardingQrPanel` in WebDevLiveRecord (cover) and `floorPlan3bhk` in WebDevFacts (contain, on warm white, in two places).

---

## Self-critique (DESIGN §8, scored by reading the code)

| Screen | Question | Evidence | Hierarchy | Readability | A11y | Trust | India | Consistency | States | Delight | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Claim and verify | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 5 | 5 | 4 | **45** |
| Site capture (phone) | 5 | 5 | 4 | 4 | 4 | 5 | 5 | 5 | 4 | 5 | **46** |
| WhatsApp developer alerts | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 4 | 5 | 4 | **44** |
| Workspace Overview (edited) | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **45** |
| Developer page (edited) | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **45** |

**Known soft spots**
- The Overview is now about 11,400 px. Signals, path back and the legal intake each fit a nav item of their own when this is built.
- The path-back thresholds and all signal numbers are illustrative.
- The heights are estimates, made without rendering.
