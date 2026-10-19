# Developer workspace: fix pass (D12)

Screens: `WebDevPortal` (now the workspace home), plus three new pages: `WebDevInbox`, `WebDevLiveRecord` and `WebDevFacts`. All four are in `scratchpad/canvas/project/`.
Owner: principal B2B product design. Date: 18 Oct 2026.
Inputs: DESIGN.md §0, §3–§4c, §5b and §7; PRD §6.2, §12.1 and §20 (F-63+, D12, D13); `product/evaluation/developer.md` (G01–G20, §4 value proposition, §5 missing screens).
Rule held throughout: **D1.** Nothing in the workspace is paid, and nothing in it reads into a band, a reason, ranking or AI answers. Every page says "Free, forever. Payments never affect scores." in the side navigation, and the footer slab closes with "No developer pays us. Ever."

**How it was checked.** No browser was opened, nothing was published, and `canvas.json` was not edited. Each file passed the following checks:
- `tools/wf.py`: tag balance, unquoted attributes, JS parse, `data-props` JSON, and root `min-height` equal to `$preview`.
- `dccheck.py`: exactly one `support.js`, no banned patterns or emoji, and `renderVals()` runs in Day and Night.
- `tools/smoke.js` and `tools/probe.js`: every handler was clicked across the key states, and the resulting values were read back.
- `tools/holecheck.py`: every `{{hole}}`, including loop items, resolves in every state tested.
- A grep for banned copy and styles: glass, gradients, shadows on resting surfaces, dashed boxes, eyebrows, uppercase and sub-13px type.

The pre-edit portal is backed up at `scratchpad/fixpass_dev_backup/WebDevPortal.dc.html`.

---

## Canvas entries to add or update (please mirror in `canvas.json`)

All four are web pages: `"expand":"fill"`, `w` 1280, `is_interactive: true`, `page: "web"`. The heights are estimated from the layout arithmetic, so adjust them after one look.

| File | Title | h | Suggested x, y |
|---|---|---|---|
| `WebDevPortal.dc.html` | Developer workspace · Overview | **8200** (was 5250) | 12240, 0 (unchanged) |
| `WebDevInbox.dc.html` | Developer workspace · Enquiries & visits | 4400 | 14960, 0 |
| `WebDevLiveRecord.dc.html` | Developer workspace · Live Record kit | 4300 | 16320, 0 |
| `WebDevFacts.dc.html` | Developer workspace · From the developer | 3200 | 17680, 0 |

If another fix pass has already claimed those x positions, put the three new boards in a row under `WebDevPortal` instead.

---

## The shared shell (all four pages)

The four pages share one shell:
- **Header:** a plain sticky bar with the wordmark, "Northfield Estates · Workspace", Help, the signed-in person and their role, Sign out, the theme toggle and **one action named for what it does**: *Correct a fact*, *Send to your CRM*, *Download print files* or *Publish changes*.
- **Side navigation, identical everywhere:** Overview · Enquiries & visits · Projects & facts · Live Record · Evidence & disputes · Team. The current page has `aria-current="page"`. Badges show 3 enquiries needing a reply and 1 notice.
- **Footer:** the designed slab. "No developer pays us. Ever." is followed by what this page stands on, then the links (Developer Charter, Methodology, How we make money, and on the home page "Legal notices and grievances"). "Plinth" closes at full width.

The signed-in person changes by page to show the roles at work (G09): Ananya Rao (Admin, authorised signatory) on Overview; Vikram Sethi (Sales) on the inbox; Arjun Mehta (Marketing) on the Live Record kit and the facts editor.

---

## 1. `WebDevPortal`: the workspace home ("What do buyers see, and what's waiting for you?")

**Signature live thing:** the correction flow with the live buyer-card preview. It is kept from the taste-passed portal and now runs in three lanes.

| Change | Gap IDs |
|---|---|
| Reframed from a dispute desk into the **workspace home**. The H1 is the question itself; the old nav (Overview, Projects, Notices, Dispute a fact, Public reply, Dispute log) became the workspace nav | **G01** |
| "This workspace is free, forever. Payments never affect scores." stays as the slab directly under the H1, now adding "or a better place in search" and a link to the Developer Charter | G01, D1 |
| **"Which band does each project show?"**: every project with the borderless chip. Aurelia Heights Ph 2 is Elevated (low confidence) since 2 Oct 2026, Cedar Walk Ph 2 is Moderate, Heron Point Ph 2 is Not scored, and the 6 finished projects are counted in the track record. Columns: *Coming up* and *Buyers this week* | G01, G13 (counts only) |
| **"Which band changes are coming?"**: the policy line reads "You hear about every band change before buyers do". Moves into High or Severe get 7 days' notice; other moves get a private heads-up inside the 72-hour recompute window; red-flag rules publish at once | **G05** |
| The pending notice: **Elevated → High, would take effect 25 Oct 2026**. *Why:* the Jul–Sep 2026 QPR was due 15 Oct and is not on HARERA as of 18 Oct, which would make QPRs late in 4 of the last 9 quarters. "Buyers already see the missing QPR as a fact… The band waits for this notice. If the QPR is on record before 25 Oct 2026, the band stays Elevated." This matches §5b exactly | G05, §5b |
| The notice shows Northfield's own claim in the **"Developer says" tone field** ("filed on 12 October", not yet verified, with a check-by date of 5 Nov 2026). The primary action is **"Send the HARERA receipt"**, which opens the 2-day lane prefilled; "Dispute the fact instead" is secondary. The held state reads "Receipt received · CL-202. We check the HARERA register by 20 Oct 2026, before the change could take effect." | G05, G06, G14 |
| Tone: "This is not a negotiation of our opinion" is replaced by "Facts change scores; arguments don't." A "not yet verified" claim always carries a check-by date | **G14** |
| **Earlier band changes**: 2 Oct 2026, Moderate → Elevated, with its reason, plus "Heads-up sent to you 30 Sep 2026, 48 hours before buyers saw it." The page never shows Elevated before 2 Oct | G05, §5b |
| **"What's waiting for you this week?"** has two lists. *New enquiries and visits*: Rohan's visit with code 4821, Ishita's price-list request with her agent of record, Kabir's shared number, and Farah awaiting a reply. *Facts needing an update*: the Jul–Sep QPR, the Cedar Walk price list (128 days old, flagged as "over 120 days old"), the missing 4 BHK plan, and the next site-photo window | G01, G02, G07, G10 |
| **Three lanes** in Evidence & disputes:<br>1. **Clerical error**: 2 working days, an automatic register check, and no quota used if the error was ours.<br>2. **Dispute a fact**: 15 working days.<br>3. **Add evidence, no dispute**: escrow certificate, OC application, construction-finance letter and site photos, with no quota. It shows as "From the developer · not verified" until the evidence is matched to a record.<br>Each lane has its own inputs, its own SLA line, its own reference series (CL-, D-, EV-), its own status timeline and its own preview behaviour | **G06** |
| Disputes now cover **any published fact**, not just the 4 reasons: the missing QPR, the 4 reasons, cost-sheet charges, the registration and completion dates, and the group map | G06 |
| Quota scaled to scored phases: "Oct–Dec 2026: 1 of 12 disputes used (6 per scored phase). Clerical fixes and evidence don't count." | G06 |
| The legal reason now shows **per 100 units**: "14 complaints… 2.8 per 100 units. Similar projects: 3." | **G11** |
| Live preview: the buyer card now lists everything a correction can touch. It shows the missing QPR as "New on record", then the reasons, then "Also on the project page" (cost, dates, group). Markers and provenance chips appear per lane, and evidence with no linked fact goes in a "From the developer" block at the foot of the card | G06, G07 |
| **The public reply is now live, not a draft.** Other screens (WebProject, AppRisk, WebFollowing) already show Northfield's reply of 15 Oct 2026, so the portal now opens with it published. Its signature is "Head of Customer Relations" and its check-by date is 5 Nov 2026. An edit becomes "Publish update" | G14, G16, consistency |
| The empty-reply state keeps the neutral line "We invited Northfield Estates to respond on 3 Oct 2026. No response yet." | G20 |
| **Dispute log → "What have you raised so far?"** It now covers all lanes. The new CL-201 shows a clerical fix ("Fixed, our error"). **Data fix:** D-118 used to say "unit count corrected to 412", which contradicted §5b's 500 units; it now reads "Apr–Jun 2026 QPR marked late → upheld; filed 15 Jul 2026, on time" | G06, §5b |
| **"Who can act for Northfield?"** lists five roles (Admin, Sales, Compliance, Marketing, Site) and what each can do. Every action is logged | **G09** (roles only) |
| The footer adds a "Legal notices and grievances" link | G08 (entry point only) |

## 2. `WebDevInbox` (new): "Which buyers asked to hear from you?"

**Signature live thing:** the **site-office check-in by visit code**. It is a phone-width page preview for Sat 24 Oct 2026. Type 4821 and Find; Rohan's visit rises in (2 visitors, 11 am, no agent of record), then Confirm arrival. After check-in the page says that Rohan may now choose to share a number, and Plinth won't ask on the developer's behalf (D13). Code 5190 finds Aman; 3376 says it belongs to the Cedar Walk site office; any other code offers "welcome them as a walk-in".

| Change | Gap IDs |
|---|---|
| A consented **enquiry and visit inbox** with 7 records (3 enquiries, 4 visits), filters (All, Enquiries, Visits, Needs a reply) and a list-and-detail layout | **G02** |
| A **buyer brief the buyer chose to share**: configuration, all-in budget band, timeline, home-loan status ("Not shared" where withheld) and the questions asked in full | G02 |
| **Never a phone number unless the buyer tapped.** Relay records say "number stays hidden; the relay stays open while this enquiry is active". Visit records show only the code. Kabir's record shows a number because he tapped to share it after his visit on 16 Oct (D13) | G02, D13 |
| **Agent of record** appears only when the buyer named one (Ishita: Larkspur Realty; Nisha: Bluegate Homes), with "HARERA agent registration checked". Every record also says: "Plinth is never the lead source or a channel partner, and takes no share of any commission." The side navigation links to "Plinth and channel partners" | **G12**, F-66a, §20 policy |
| A **DPDP consent line on every record**: reference, purpose, date given, the buyer's right to withdraw, and the Act | G02 (needs care: DPDP) |
| **Visit slots**: one site office, one week, 4 slots a day with capacity 3. Tap to open or close a slot; a booked slot refuses to close and explains why. Rescheduling and no-shows are noted | G02 (developer.md §5 #14) |
| **CRM hand-off**: *Email each new record* (with a test send), *Download CSV*, and *Signed webhook · Coming in R2*. All are "identical for every developer. No paid integrations, no tiers and no fee per record." A two-row CSV preview shows the columns, including `consent_ref`, and a phone number only when shared. Withdrawn consent triggers a deletion request for that row | **G03**, F-63+ |
| Copy: "costs you nothing, owes no brokerage" | §4.3 lever 2 |

## 3. `WebDevLiveRecord` (new): "Where will buyers check your record?"

**Signature live thing:** **one printed QR, three scan days.** Pick *Today, 18 Oct*, *25 Oct with the QPR still missing* or *25 Oct with the QPR on record*. The buyer's phone card behind the QR changes: the borderless chip eases from Elevated to High, the meter refills with a stagger, "Changed from Elevated on 25 Oct 2026" rises in, and the natural-frequency sentence and QPR line update. The print never changes.

| Change | Gap IDs |
|---|---|
| A **preview of the live card** a buyer sees: photo, project, RERA number, band chip with confidence and date, natural frequency, three records, Northfield's reply in the "Developer says" tone field, **"All 9 RERA projects by Northfield Estates"** (so nobody can cherry-pick one project), "No developer pays us. Ever." and the disclaimer with "not an endorsement" | **G04** |
| A **print preview of an A1 hoarding panel** (594 × 841 mm, true A ratio): "Check this project's record, live.", an illustrative QR, `plinth.in/r/AH2`, the RERA number and HARERA site, and "No developer pays Plinth. This is not an endorsement." **No band is ever printed.** The formats are A1 hoarding, A4 brochure insert, square social tile and WhatsApp link, each with its own placement code | G04 |
| **Where is it shown?**: scans per placement, as counts only, never who scanned | G04, G13 |
| **Usage rules.** You can: print it on hoardings and brochures, share the link, and place it next to the RERA number. You can't: print or post a band, screenshot or static badge; call it a rating, approval, certificate or award; or crop out the group line or the disclaimer. **Misuse gets a public correction note, not revocation** ("a kit we could switch off would become a lever"). The terms were accepted on 2 Sep 2026 | G04, §4.4 #5 |
| **What happens when a band changes**: you hear first; the QR opens the new band from publication with nothing to reprint; followers get an alert with your reply linked; a facts-only review shows the facts-only record | G04, G05, G16, G08 (state named) |

## 4. `WebDevFacts` (new): the "From the developer" editor

**Signature live thing:** the **project-page preview**. It mirrors WebProject's "From the developer" section and updates as you type. Change the 3 BHK base and four things follow:
- a dated draft row appears in the version history;
- the preview's history bars re-scale;
- the ₹ per sq ft carpet figure recalculates;
- the all-in on Plinth's cost sheet recalculates (₹2.35 Cr gives ₹2.74 Cr and ₹18,900 per sq ft carpet, matching §5b).

The state tag flips to "Draft · not public yet" and the header action becomes *Publish changes*.

| Change | Gap IDs |
|---|---|
| Tabs for **Configurations** (prices editable; carpet areas and unit counts locked from HARERA, with clerical-lane help), **Price list** (charges, then every version, never deleted; the history matches WebProject), **Payment plan** (11 stages, each matched to the QPR; slab 12 is flagged against the latest QPR, slab 9; an optional possession-linked 20:80 plan can be added), **Floor plans** (3 BHK on file; add the 4 BHK; carpet area checked against the register) and **Construction updates** | **G07**, F-97, F-63+ |
| **Photo upload with location check.** Photos are tagged by tower and slab. Each one shows "Inside the RERA footprint · time · sealed" or "No location in the file · not posted, retake with the capture link". Followers hear about at most one update a month (next: 16 Nov 2026), and a photo never moves a score | **G10** |
| **Labelling.** The whole section is the claim tone field, labelled "From the developer · not verified". Items matched to a public record carry a filled ink pill instead: carpet areas from the HARERA registration, slabs on record from the QPR | G07 (keep "Records show" pure) |
| A borderless Elevated chip heads the preview, with "records and risk sit above this section and never read from it" | G07, D1 |
| **"Where does your content never appear?"**: the band, its reasons or confidence; search order or Compare; AI answers, except quoted as "Developer says". A correction note is published if content proves false | G07, §4.4 #4, risk table |
| Publishing alerts followers once and the developer chooses when (the Meridian objection) | G07, persona (b) |

---

## Gaps not closed by these four screens

| Gap | Status |
|---|---|
| G08 legal and grievance intake; facts-only display state | There is a footer entry point, and the Live Record names the state. The intake form and the facts-only project and developer pages still need their own screens |
| G09 invite, claim, verify signatory, confirm group map | Only roles are shown (Team section, per-page signed-in person). Screens 1–3 of developer.md §5 remain |
| G10 phone capture flow | The editor shows the capture link and its results; the 390 px capture page itself is still to design |
| G13 Buyer signals panel | Only counts are shown (per-project enquiries and visits, placement scans). The monthly panel with k ≥ 20 is not designed |
| G15 Path back, G17 Launch kit, G18 How buyers find you | R2, not designed |
| G19 developer WhatsApp templates | Not designed. The check-in page is phone-width |
| G05 date mismatch in WaAlerts ("14 Oct" vs 2 Oct; "told at the same time") | Not in my files; the WaAlerts owner should align it with the heads-up policy |
| G11 on WebDeveloper ("7 decided against the group" as an absolute count) | Not in my files |

**Follow-ups for other owners:**
1. WebProject's "From the developer · Northfield Estates · updated 2 Oct 2026" label should add "· not verified", to match the editor preview and the brief.
2. WebPrivacy's relay copy ("stops working… after 30 days") should follow D13 ("stays alive while a deal is active"), as the inbox does.

---

## Facts added (artboard assumptions; please add to DESIGN.md §5b if accepted)

**Heads-up and team**
- The heads-up for the 2 Oct 2026 Moderate → Elevated move was sent on 30 Sep 2026.
- Team (fictional): Ananya Rao (Admin, authorised signatory), Vikram Sethi (Sales), Neha Kapoor (Compliance), Arjun Mehta (Marketing), Pradeep Yadav (Site, Sector 37D sales gallery).

**Inbox records**

| Buyer | Record | Consent ref. |
|---|---|---|
| Rohan | Visit, Aurelia Heights Ph 2, Sat 24 Oct 2026, 11 am, 2 visitors, code 4821, booked 18 Oct 09:15, no agent | PLN-C-261018-0207 |
| Aman | Visit, Aurelia Heights Ph 2, Sat 24 Oct, 3 pm, 3 visitors, code 5190 | PLN-C-261017-0098 |
| Nisha | Visit, Cedar Walk Ph 2, Sun 25 Oct, 4 pm, code 3376, agent Bluegate Homes | PLN-C-261017-0512 |
| Ishita | Price-list enquiry, 17 Oct, 3 BHK, ₹2.6–2.9 Cr, agent Larkspur Realty | PLN-C-261017-0623 |
| Farah | Payment-plan enquiry, Cedar Walk Ph 2, 16 Oct | PLN-C-261016-0341 |
| Kabir | Visited 16 Oct; shared +91 90000 12412 by his tap | PLN-C-261016-0388 |
| Dev | 4 BHK enquiry, 15 Oct; replied 16 Oct | PLN-C-261015-0177 |

Consent references follow WebPrivacy's `PLN-C-yymmdd-nnnn` format.

**Disputes and data**
- Disputes: CL-201 (6 Oct 2026, "Tower A shown with 21 floors", fixed 7 Oct as our error). D-118 was rewritten (see the data fix above). The quota is 6 per scored phase, so 12 for Northfield.
- The Cedar Walk Ph 2 price list is dated 12 Jun 2026.

**Live Record kit**
- Short link `plinth.in/r/AH2`; placement codes AH2-H1, AH2-B3 and AH2-W, with 214, 61 and 138 scans in October.
- Brand-use terms accepted on 2 Sep 2026.

**Taken from WebProject, unchanged**
- Price history: ₹2.35 / 3.38 Cr (2 Oct 2026), ₹2.24 / 3.22 Cr (1 Apr 2026), ₹2.03 / 2.92 Cr (1 Jul 2025), ₹1.58 / 2.27 Cr (Jan 2023, launch).
- The 11-stage payment plan.
- The demand of 10 Oct 2026 for slab 12.

**All-in arithmetic.** The editor uses (base + ₹9.2 L charges) × 1.1221, which reproduces §5b's ₹2.74 Cr.

---

## Image requests

These are in `product/design/assets/requests_fix-dev.json`:

| Slot | Aspect | Used on | Prompt in brief |
|---|---|---|---|
| `hoardingQrPanel` | 4:5 | WebDevLiveRecord, print section | A Gurugram construction hoarding with one blank A-proportion panel where the QR goes. No text, logos, emblems or QR |
| `floorPlan3bhk` | 4:3 | WebDevFacts, floor-plan tab and preview thumbnail | A clean line-drawn 3 BHK plan. No labels, numbers or dimensions |

Reused slots: `heroAurelia` (Live Record card), `salesGallery` (check-in panel), `towerBSite` (evidence photo, capture results, preview) and `siteProgress` (capture results).

---

## Self-critique (DESIGN §8, scored by reading the code)

| Screen | Question | Evidence | Hierarchy | Readability | A11y | Trust | India | Consistency | States | Delight | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Workspace · Overview | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **45** |
| Enquiries & visits | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 4 | 5 | 4 | **44** |
| Live Record kit | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 5 | 4 | 5 | **46** |
| From the developer | 4 | 5 | 4 | 4 | 4 | 5 | 5 | 5 | 4 | 4 | **44** |

**Known soft spots:**
- The Overview is long (8200 px) because it carries the home, the lanes, the reply, the log and Team. Moving the log and Team to their own pages in code is easy, since the navigation already exists.
- The QR is illustrative, not a real encoding.
- The preview heights were estimated without rendering.
