# Final consistency sweep (R1 artboards)

**Date:** 19 Oct 2026. **Owner:** design QA lead.
**Source of truth:** DESIGN.md §5 and §5b, plus the lead's rulings in the sweep brief (Kestrel Park dates, "Ask Plinth", the adviser label, the 7-line cost sheet, the AppMap tiles, and the edge answers on WebProject). Format rules: §7.
**Scope:** all 53 non-archived boards in `canvas/project/` (web, Android, WhatsApp). The brief says 54, but 53 are on disk and in `canvas.json`. Main, DirectionB, DirectionC, LiveDay and LiveNight were skipped.
**Backups:** every board and `canvas.json` were copied, before any edit, to `scratchpad/sweep-backup/`.

## Summary

- **44 of 53 boards edited, 140 fixes (176 logged string edits).**
- **9 boards needed no change:** AppOnboarding, AppScan, AppVisualiseCapture, AppVisualiseResult, WebBeforePay, WebBrokerCheck, WebDevOnboarding, WebPrivacy and WebVisualise.
- **Fixes by category:**

  | Category | Fixes | Boards |
  |---|---|---|
  | 1. Kestrel Park original completion: Jun 2027 → Nov 2028 | 7 | 7 |
  | 2. AI naming: "Ask Plinth" in tabs, nav, buttons, headings and disclosures | 38 | 26 |
  | 3. Human handoff label: "Talk to a Plinth adviser · free · developers never pay us" | 17 | 14 |
  | 4. Cost sheet: 7 lines, the same figures and tags on all three cost boards | 6 | 3 |
  | 5. AppMap risk filter split into "Low" and "Moderate" tiles (and WebDeveloper's filter explainer) | 4 | 2 |
  | 6. WebProject Ask Plinth: the "Should I buy?" edge answer | 1 | 1 |
  | Confidence attached to a band ("low confidence", "High confidence") | 20 | 12 |
  | Retired timestamp 11:32 | 2 | 1 |
  | Loans are R2: lender fees, "eligibility checked", "Home-loan help" | 9 | 5 |
  | Complaint count shown without its per-100-unit rate | 4 | 3 |
  | QPR and dispute facts (D-118, Kestrel QPR source period) | 2 | 2 |
  | Who has my number: site offices reach Rohan through a relay | 2 | 1 |
  | Pro wording ("12 months of written updates", alerts free) | 1 | 1 |
  | G-38: prototype levers in visible UI | 19 | 14 |
  | Developer reply state (WebDevPortal) | 1 | 1 |
  | Visualise: "AI-generated illustration" label; floor plan or sample flat for an under-construction project | 4 | 2 |
  | Other facts (inbox "needs a reply", Laurel QPRs, register-check date) | 3 | 3 |
  | **Total** | **140** | **44** |

- **Checks run on all 53 boards after the last edit:** `sweep/wfcheck.py` passes on all 53. It checks:
  - balanced tags, with no self-closed non-void elements;
  - quoted attributes;
  - exactly one `<script src="./support.js"></script>`;
  - `data-props` parses as JSON;
  - only dotted holes;
  - hints on every `sc-if` and `sc-for`;
  - in node, `renderVals()` runs for Day and Night with every hole resolving (`sweep/smoke.js`).
- **Interactions exercised in node:**
  - WebProject: typed "Should I buy Aurelia?" and the fourth prompt chip.
  - WebCostSheet: the reading steps, done, and the 7-line ledger.
  - AppCostSheet: reading.
  - AppMap: the Low and Moderate tiles, singly and together.
  - WaAgentOnboarding: the `view` tweak.
- **Canvas heights:** no `h` change is needed in `canvas.json`, so `canvas.json` is untouched. The largest page changes are small:
  - WebCostSheet: about −150 px (one fewer document row, two fewer ledger rows) on an 8,600 px page.
  - WebProject: +64 px (a fourth prompt chip) on 9,100 px.
  - Phone and WhatsApp boards keep their fixed sizes.

## The six known items

### 1. Kestrel Park dates (registered Nov 2023, original completion Nov 2028; "63% built, 58% time used" kept)

| Board | Before | After |
|---|---|---|
| AppFollowing | allin: '₹2.44 Cr', orig: 'Jun 2027' | allin: '₹2.44 Cr', orig: 'Nov 2028' |
| AppMap | Original completion Jun 2027 | Original completion Nov 2028 |
| AppVoice | …: '₹2.44 Cr all-in · quoted ₹2.10 Cr', due: 'Jun 2027' | …: '₹2.44 Cr all-in · quoted ₹2.10 Cr', due: 'Nov 2028' |
| WebCompare | igi: '13 km, 20–30 min', date: 'Jun 2027' | igi: '13 km, 20–30 min', date: 'Nov 2028' |
| WebFollowing | Completion on record: Jun 2027. | Completion on record: Nov 2028. |
| WebHome | …riceNote: 'all-in · quoted ₹2.10 Cr', orig: 'Jun 2027' | …riceNote: 'all-in · quoted ₹2.10 Cr', orig: 'Nov 2028' |
| WebSearch | built: 63, time: 58, orig: 'Jun 2027' | built: 63, time: 58, orig: 'Nov 2028' |

WebCompare's computed lines ("Original completion dates run from … to …", "Spread of N months") recompute from the new date. No board shows a Kestrel registration date other than Nov 2023.

### 2. AI naming: "Ask Plinth" everywhere

| Board | Before | After |
|---|---|---|
| WebAbout | Top nav link "Ask" | "Ask Plinth" |
| WebClaims | Top nav link "Ask" | "Ask Plinth" |
| WebDeveloper | Top nav link "Ask" | "Ask Plinth" |
| WebFollowing | Top nav link "Ask" | "Ask Plinth" |
| WebMethodology | Top nav link "Ask" | "Ask Plinth" |
| WebPricing | Top nav link "Ask" | "Ask Plinth" |
| WebSignIn | Top nav link "Ask" | "Ask Plinth" |
| WebPayAsBuilt | Top nav link "Ask" | "Ask Plinth" |
| AppFamily | Bottom tab "Ask" | "Ask Plinth" |
| AppFollowing | Bottom tab "Ask" | "Ask Plinth" |
| WebProject | Ask anything | Ask Plinth anything |
| WebProject | ['records', 'Records'], ['ask', 'Ask']]; | ['records', 'Records'], ['ask', 'Ask Plinth']]; |
| WebProject | Hero button "Ask about it" | "Ask Plinth" |
| AppProject | Bottom action bar button "Ask about this" | "Ask Plinth" |
| AppProject | Ask sheet heading "Ask about this project" | "Ask Plinth" |
| AppProject | Aurelia Heights, Phase 2 · AI · answers cite public records | About Aurelia Heights, Phase 2 · answers cite public records |
| AppProject | I'm Plinth's AI assistant. I answer from public records like HARERA and show sources. I can make mistakes, so check them. I don't give legal, tax or investment advice. | Ask Plinth is an AI. It answers from public records like HARERA and shows its sources. It can make mistakes, so check them. It doesn't give legal, tax or investment advice. |
| AppProjectStates | Bottom action bar button "Ask about this" | "Ask Plinth" |
| AppRisk | Bottom action bar button "Ask why" | "Ask Plinth" |
| AppVisitPass | Bottom bar button "Ask about it" | "Ask Plinth" |
| WebProjectStates | Hero button "Ask about it" | "Ask Plinth" |
| AppVoice | <title>Plinth app: Voice assistant</title> | <title>Plinth app: Ask Plinth by voice</title> |
| WaBeforePay | I'm Plinth's AI assistant. {{confirmLead}} | This is Ask Plinth, an AI. {{confirmLead}} |
| WaBeforePay | 'Business account · AI assistant' | 'Business account · Ask Plinth is an AI' |
| WaClaims | I'm Plinth's AI assistant. I read 7 claims on this flyer. | This is Ask Plinth, an AI. I read 7 claims on this flyer. |
| WaClaims | 'Business account · AI assistant' | 'Business account · Ask Plinth is an AI' |
| WaVisitPass | 'Business account · AI assistant' | 'Business account · Ask Plinth is an AI' |
| WaDigest | >Business account · AI assistant | >Business account · Ask Plinth is an AI |
| WaRisk | >Business account · AI assistant | >Business account · Ask Plinth is an AI |
| WaRisk | I'm Plinth's AI assistant. I answer from public records like HARERA, with sources. I can make mistakes. Type human for a person. | Ask Plinth is an AI. It answers from public records like HARERA, with sources, and can make mistakes. Type human to talk to a Plinth adviser · free · developers never pay us. |
| WaClaims | {key: 'ask', label: 'Ask'} | {key: 'ask', label: 'Ask Plinth'} |
| WaClaims | (turn === 'ask' ? 'Ask' : 'See all claims') | (turn === 'ask' ? 'Ask Plinth' : 'See all claims') |
| AppExplore | Ask about any project, in English or Hinglish | Ask Plinth about any project, in Hinglish too |
| WebClaims | secondary: 'Ask about this project', sentNote: 'Opening Ask with Aurelia Heights, Phase 2.'} | secondary: 'Ask Plinth about this project', sentNote: 'Opening Ask Plinth with Aurelia Heights, Phase 2.'} |
| WebDeveloper | Ask about Northfield | Ask Plinth about Northfield |
| WebDevPortal | …nals never feed a score, search order or an AI answer. | …nals never feed a score, search order or an Ask Plinth answer. |
| WebDevInbox | …hing here changes a score, a ranking or what our AI says | …hing here changes a score, a ranking or what Ask Plinth says |
| WebDevFacts | In AI answers, except quoted and labelled “Develop | In Ask Plinth answers, except quoted and labelled “Develop |
| WebDevPortal | Questions are grouped by our AI from what buyers typed or said; | Questions are grouped by Ask Plinth from what buyers typed or said; |

WhatsApp headers now read "Business account · Ask Plinth is an AI", as WaCost already did. The first WhatsApp bubble of each flow says "This is Ask Plinth, an AI." The in-product disclosure is the §5b line: "Ask Plinth is an AI. It answers from public records like HARERA and shows its sources."

### 3. Human handoff: "Talk to a Plinth adviser · free · developers never pay us"

| Board | Before | After |
|---|---|---|
| WebProject | I’m Plinth’s AI assistant. I can be wrong, so I show my sources. Talk to a Plinth adviser · paid by you, never by developers | Ask Plinth is an AI. It answers from public records like HARERA and shows its sources. It can be wrong, so check them. Talk to a Plinth adviser · free · developers never pay us |
| AppProject | Talk to a Plinth adviser · paid by you, never by developers | Talk to a Plinth adviser · free · developers never pay us |
| WaBeforePay | Read by AI, checked by rules. Type human for a person.' | Read by AI, checked by rules. Type human to talk to a Plinth adviser · free · developers never pay us.' (×2) |
| WaBeforePay | ['human', 'Talk to a person'] | ['human', 'Talk to an adviser'] (×3) |
| WaBeforePay | human: 'Talk to a person'}; | human: 'Talk to an adviser'}; |
| WaBeforePay | var HUMAN = {lead: 'A person from our team will take over this chat.', | var HUMAN = {lead: 'A Plinth adviser will take over this chat · free · developers never pay us.', |
| WaClaims | Read by AI; I can make mistakes. Type human for a person. I removed | Read by AI; I can make mistakes. Type human to talk to a Plinth adviser · free · developers never pay us. I removed |
| WaVisitPass | Read by AI; I can make mistakes. Type human for a person. | Read by AI; I can make mistakes. Type human to talk to a Plinth adviser · free · developers never pay us. |
| AppCostSheet | Talk to a Plinth adviser · paid by you, never by developers. Free to ask. | Talk to a Plinth adviser · free · developers never pay us . |
| AppExplore | Talk to a Plinth adviser · paid by you, never by developers . Free to ask, Mon–Sat, 10 am–7 pm. | Talk to a Plinth adviser · free · developers never pay us . Mon–Sat, 10 am–7 pm. |
| AppVoice | Free to ask. Advisers are paid by you, never by developers. They explain records; | Free · developers never pay us. Advisers explain records; |
| WaCost | Connecting you to a Plinth adviser: paid by you, never by developers. Free to ask, Mon–Sat, 10 am–7 pm IST, | Connecting you to a Plinth adviser · free · developers never pay us. They reply Mon–Sat, 10 am–7 pm IST, |
| WebCompare | Talk to a Plinth adviser , paid by you, never by developers. Free to ask. | Talk to a Plinth adviser · free · developers never pay us . |
| WebSearch | Talk to a Plinth adviser , paid by you, never by developers. Free to ask. | Talk to a Plinth adviser · free · developers never pay us . (×2) |
| WebHome | Talk to a Plinth adviser on WhatsApp , paid by you, never by developers. Free to ask, Mon–Sat 10 am–7 pm. | Talk to a Plinth adviser · free · developers never pay us on WhatsApp, Mon–Sat 10 am–7 pm. |
| WebPayAsBuilt | Talk to a person | Talk to a Plinth adviser · free · developers never pay us |
| WebClaims | secondary: 'Ask a person to read it', sentNote: "Sent to our team. A person will read it and reply on this page, usually | secondary: 'Ask a Plinth adviser to read it', sentNote: "Sent to a Plinth adviser · free · developers never pay us. They will read it and reply on this page, usually |

Two compact controls keep a short label, and the message they open carries the full one:

- **WhatsApp quick replies** (WaCost, WaBeforePay) keep "Talk to an adviser", as §5b specifies, because of WhatsApp's 20-character button limit.
- **AppVoice's header button** keeps "Talk to an adviser". The handoff panel it opens now reads "Free · developers never pay us."

WaAgentOnboarding's "Talk to a person" is the partner team for agents, not the buyer adviser, so it was left.

### 4. Cost sheet: 7 lines, the same figures on WaCost, WebCostSheet and AppCostSheet

The 7 lines are base ₹2.35 Cr, PLC ₹2.9 L, club ₹1.5 L, parking ₹3.5 L, IFMS ₹1.3 L, GST ₹12.2 L, and stamp duty + registration ₹17.6 L. All-in is ₹2.74 Cr (₹18,900/sq ft carpet), and the charges subtotal is ₹9.2 L. EDC and IDC are a note ("Included in the base"), not a line. The sheet's own total (₹2,56,41,000) is a check, not a line.

| Board | Before | After |
|---|---|---|
| WebCostSheet | The scan read 10 rows, including "Power backup, 5 kVA · Included", which is not on the §5b sheet. Counter: "N of 10 lines"; done state: "Done. All 10 lines read and checked" | The scan reads 9 rows in the AppCostSheet order: base, PLC, club, parking, IFMS, EDC/IDC note, GST, the sheet's total, stamp duty + registration. Counter: "N of 7 lines"; done state: "Done. All 7 lines read and checked". Timer, progress bar and scan line are re-indexed to 9 rows. Row notes carry the §5b tags (Often negotiable, Refundable deposit, Set by law, Included in the base) |
| WebCostSheet | "Every line" ledger: 7 developer rows, including Power backup "Included" and EDC/IDC "Included", plus stamp duty (₹17,09,400) and the registration fee (₹50,000) as two separate rows | 5 developer rows. The EDC/IDC note moves into the base row. Tags: Often negotiable, Refundable deposit, Set by law. GST and one "Stamp duty and registration" row (₹17,59,400 at 7%, with the ₹50,000 inside its note) make 7 lines. "Not in this total" (move-in, TDS) is unchanged |
| WebCostSheet | "Parking and IFMS are standard on this sheet. EDC, IDC and power backup are already in the base price." | "… EDC and IDC are already in the base price." |
| AppCostSheet | "Done. 9 of 9 read, and the sheet's total adds up." / "Reading page 1 · 3 of 9" | "Done. All 7 lines read, and the sheet's total adds up." / "Reading page 1 · 3 of 7 lines". The count skips the EDC/IDC note and the total check. The line-by-line view already showed 7 lines plus the ₹9.2 L "Charges total" subtotal row |
| WaCost | "Your sheet has 7 lines. Tap one to ask about it." | "Your all-in has 7 lines: 6 from your sheet, plus stamp duty and registration, which we add. Tap one to ask about it." Stamp duty is not on the developer's sheet, so "your sheet has 7" was wrong |

WaCost line tags, aligned with AppCostSheet and WebCostSheet (§5b "Tags match"):

| Board | Before | After |
|---|---|---|
| WaCost | …at is ₹16,207/sq ft carpet before any extras.'} | …at is ₹16,207/sq ft carpet before any extras. EDC and IDC, the government development charges, are included in the base on your sheet.'} |
| WaCost | desc: '₹1.3 L · maintenance security' | desc: '₹1.3 L · refundable deposit' |
| WaCost | desc: '₹12.2 L · on price and charges' | desc: '₹12.2 L · set by law' |
| WaCost | …'GST is 5% of the price and charges: ₹12.2 L.'} | …'GST is 5% of the price and charges: ₹12.2 L. It is set by law, so it can’t be negotiated.'} |
| WaCost | desc: '₹17.6 L · our estimate, not on your sheet' | desc: '₹17.6 L · set by law · our estimate, not on your sheet' |

### 5. AppMap: "Low or Moderate" becomes two removable tiles

| Board | Before | After |
|---|---|---|
| AppMap | One toggle chip "Low or Moderate risk" (`riskOnly`) | Two independent chips, "Risk: Low" and "Risk: Moderate". Each has its own check mark, `aria-pressed` and handler (`riskLow`, `riskMod`). The map and list filter by whichever is on; with neither on, all are shown, as before. The Filters badge counts each tile. This is the WebSearch pattern ("Risk: Low", "Risk: Moderate") |
| AppMap | "1 projects · sorted by relevance …" (shown once a single tile is on) | "1 project · …" |
| WebDeveloper | "The “Low delivery risk” filter keeps Low and Moderate …" | "A buyer who asks for low delivery risk gets two tiles, Low and Moderate, and can remove either. Buyers always see how many projects their filters hid." |
| WebDeveloper | Toggle label "Low delivery risk only" (it kept Moderate too) | "Risk: Low and Moderate" |

### 6. WebProject Ask Plinth: edge answer added (small change)

| Board | Before | After |
|---|---|---|
| WebProject | Three prompt chips; no answer for "Should I buy?" (typed, it fell through to the progress answer) | A fourth chip, "Should I buy it?". Typed phrasings ("should I buy/book", "buy karu", "lena chahiye", "worth it") route to it. The answer is the §5b refusal, word for word: "I can’t tell you whether to buy. That’s your call, and no developer pays us to steer it. Here’s how to decide:". After it streams, a "How to decide" list shows the same four checks as AppVoice and WebHome: carry a 12–24-month delay (#wait); read the 4 reasons (#risk-detail); lower-band projects nearby, Kestrel Park (Low, ₹2.44 Cr) and Sapphire Grove Ph 1 (Moderate, ₹2.27 Cr) (#next); check the payee before you pay (#before-you-pay). No source chips: it is not a records answer |
| WebProject | Section heading "Ask anything"; disclosure "I’m Plinth’s AI assistant. I can be wrong, so I show my sources." | "Ask Plinth anything"; "Ask Plinth is an AI. It answers from public records like HARERA and shows its sources. It can be wrong, so check them." (also listed under item 2) |

## Cross-board audit

**Method.** Four scripts in `scratchpad/sweep/` do the audit:

- **`extract.py`** dumps every board's visible copy (text nodes, `aria-label`, `alt`, `placeholder` and JS strings) with line numbers to `sweep/text/`.
- **`audit2.py`** attributes each figure on a source line to the nearest project name (same line or the 8 lines above) and compares it with §5/§5b. It covers % built, % sold, % time used, all-in, quoted, original completion, registration and complaint counts.
- **`rules_audit.py`** greps all 53 boards for the following:
  - retired and banned copy;
  - confidence on a band;
  - the AI and adviser labels;
  - the cost-line count;
  - lender copy;
  - G-38 levers;
  - consent-ref format;
  - emoji.
- **`tg.py`, `g.py` and `freq.py`** gave frequency tables of every ₹ figure, ₹/sq ft, % phrase, filed/due date, RERA number, consent ref and developer name. The outliers were read by hand.

A helper agent audited the 11 developer and agent boards in parallel, logging to `sweep/edits_helper.log`. Those boards are WebDevPortal, WebDevInbox, WebDevFacts, WebDevLiveRecord, WebDevOnboarding, AppDevCapture, WaDevAlerts, WebForAgents, WebAgentProfile, WaAgentOnboarding and WebBrokerCheck.

**Final state.** `audit2.py --all` reports 7 hits, and all are false attributions: the sentence names another project before the Aurelia figure. `rules_audit.py` reports 6 hits, all of which are acceptable:

- a code comment;
- "no lender pays us" lines;
- WaAgentOnboarding's partner-team "Talk to a person".

### Confidence attached to a band ("the band name never carries low confidence")

| Board | Before | After |
|---|---|---|
| WebMethodology | {name: 'High confidence', where: 'Kestrel Park, Sector 113 · Orbis Land', band: 'Low', kind: 'band', label: 'Low', dots: 2, conf: 'High confidence', | {name: 'More certain', where: 'Kestrel Park, Sector 113 · Orbis Land', band: 'Low', kind: 'band', label: 'Low', dots: 2, conf: 'We’re more certain about this one', |
| WebMethodology | caption: 'Delivery risk · high confidence · data as of 14 Oct 2026 · v1.2'} | caption: 'Delivery risk · data as of 14 Oct 2026 · v1.2'} |
| WebMethodology | {name: 'Low confidence', where: 'Aurelia Heights, Phase 2, Sector 37D · Northfield Estates', band: 'Elevated', kind: 'band', label: 'Elevated', dots: 1, conf: 'Low confidence', | {name: 'Less certain', where: 'Aurelia Heights, Phase 2, Sector 37D · Northfield Estates', band: 'Elevated', kind: 'band', label: 'Elevated', dots: 1, conf: 'We’re less certain about this one', |
| WebMethodology | caption: 'Delivery risk · low confidence · data as of 14 Oct 2026 · v1.2'} | caption: 'Delivery risk · data as of 14 Oct 2026 · v1.2'} |
| WebMethodology | Every score carries a confidence label. When history is thin, we widen the range, or say we can’t score yet. | Every score says how sure we are. When history is thin, we widen the range, or say there’s not enough history to score. |
| WaRisk | low confidence | less certain |
| WaRisk | …}} delivery risk for Aurelia Heights, Phase 2, low confidence. | …}} delivery risk for Aurelia Heights, Phase 2. We're less certain about this one, so we show a range. |
| WaRisk | ', step ' + b.i + ' of 5, low confidence. Between ' | ', step ' + b.i + ' of 5; we are less certain about this one. Between ' |
| WaAlerts | Delivery risk Elevated, step 3 of 5, low confidence. Was Moderate | Delivery risk Elevated, step 3 of 5; we're less certain about this one. Was Moderate |
| WaAlerts | Delivery risk, low confidence | Delivery risk · less certain |
| AppClaims | sr: 'Delivery risk: Elevated, step 3 of 5, low confidence', | sr: 'Delivery risk: Elevated, step 3 of 5, we are less certain', |
| WebClaims | sr: 'Delivery risk: Elevated, step 3 of 5, low confidence', | sr: 'Delivery risk: Elevated, step 3 of 5, we are less certain', |
| WebDeveloper | label: 'Delivery risk: ' + band + ', low confidence'}; | label: 'Delivery risk: ' + band + ', we are less certain'}; |
| WebCompare | …in about this one, so it\u2019s a range.' : 'High confidence.' | …in about this one, so it\u2019s a range.' : 'We\u2019re more certain about this one.' |
| WebDevPortal | Low confidence · since 2 Oct 2026 | We’re less certain about this one · since 2 Oct 2026 |
| WebDevPortal | >Low confidence · 14 Oct 2026 · v1.2 | >We’re less certain about this one · data as of 14 Oct 2026 · v1.2 |
| WebDevPortal | now: 'Low confidence · since 2 Oct 2026 · a proposed move to High is pending' | now: 'Since 2 Oct 2026 · we’re less certain about this one · a proposed move to High is pending' |
| WebDevLiveRecord | Delivery risk · low confidence · data as of {{sc.asOf}} · v1.2 | Delivery risk · data as of {{sc.asOf}} · v1.2 |
| WaDevAlerts | sr: 'Delivery risk: Elevated, step 3 of 5, low confidence.' | sr: 'Delivery risk: Elevated, step 3 of 5; we’re less certain about this one.' |
| WebForAgents | High delivery risk · low confidence | High delivery risk |
| WebForAgents | got their OC more than 12 months late. High confidence.' | got their OC more than 12 months late.' (×2) |
| WebForAgents | got their OC more than 12 months late. Low confidence.' | got their OC more than 12 months late. We’re less certain about this one.' (×2) |

### Retired copy: 11:32

| Board | Before | After |
|---|---|---|
| WebDevInbox | ' · 18 Oct 2026, 11:32'; | ' · 18 Oct 2026, 11:34'; |
| WebDevInbox | prepared 18 Oct 2026, 11:32' | prepared 18 Oct 2026, 11:34' |

These are WebDevInbox's CRM-send and CSV timestamps, not Rohan's booking, which stays at 09:15. They were changed to keep the retired value off every board.

### Loans are R2 ("Loan checks arrive in 2027"; no lender fee or loan check live in R1)

| Board | Before | After |
|---|---|---|
| WebDeveloper | No developer pays us, and the fees we earn from lenders never touch ranking. | No developer pays us, and no fee we earn ever touches ranking. |
| WebAbout | We earn from services you choose to buy. From 2027, lenders pay us too, only if you take a loan through us. | We earn from services you choose to buy. Loan checks arrive in 2027; no lender pays us today. |
| WebPricing | {k: 'loan', name: 'Home-loan help', | {k: 'loan', name: 'Loan checks', |
| WebAbout | {what: 'Home-loan help', when: 'R2 · planned for Jan–Mar 2027', note: 'Until then, no lender pays us anything.'} | …k: 'loans', what: 'Loan checks', when: 'R2 · planned for Jan–Mar 2027', note: 'Loan checks arrive in 2027. Until then, no lender pays us anything.'} |
| WebDevInbox | ['Home loan', 'Eligibility checked, lender not shared'] | ['Home loan', 'Will need a loan'] |
| WebDevInbox | ['Home loan', 'Eligibility checked']] | ['Home loan', 'Will need a loan']] |
| WebDevInbox | ['home_loan', 'Eligibility checked', 'Self-funded'] | ['home_loan', 'Will need a loan', 'Self-funded'] |
| WebAgentProfile | ['loan', 'Home loan', 'Eligibility checked; lender not shared'] | ['loan', 'Home loan', 'Will need a loan'] |
| WebAgentProfile | ['Home loan', 'Eligibility checked; lender not shared', true] | ['Home loan', 'Will need a loan', true] |

### Complaint count always with its rate (14 · 2.8 per 100 units)

| Board | Before | After |
|---|---|---|
| WebPricing | …nts decided against the promoter in 24 months. Median for similar projects: 3. | …nts decided against the promoter in 24 months · 2.8 per 100 units. Median count for similar projects: 3. |
| WebFollowing | That makes 14 in 24 months; the median is 3. | That makes 14 in 24 months, or 2.8 per 100 units; the median count is 3. |
| AppFollowing | …relia Heights, Phase 2 · 14 in 24 months now (median 3)' | …relia Heights, Phase 2 · 14 in 24 months now · 2.8 per 100 units (median 3)' |
| WebFollowing | …against the promoter, with delay interest. The median is 3.' | …against the promoter, with delay interest. That makes 14 in 24 months, or 2.8 per 100 units; the median count is 3.' |

### QPR and dispute facts

| Board | Before | After |
|---|---|---|
| WebMethodology | …· Aurelia Heights, Phase 2. Filed 14 Aug 2026. Upheld 3 Sep 2026: unit count corrected to 500. | …· Aurelia Heights, Phase 2. Filed 14 Aug 2026: the Apr–Jun 2026 QPR was marked late. Upheld 3 Sep 2026: it was filed 15 Jul 2026, on time. |
| WebProject | doc: 'Quarterly Progress Report, Apr–Jun 2026, Kestrel Park', d1: '11 Jul 2026', snap: '16 Jul 2026', | doc: 'Quarterly Progress Report, Jul–Sep 2026, Kestrel Park', d1: '12 Oct 2026', snap: '14 Oct 2026', |
| WebProject | kestrelQpr: {chip: 'HARERA QPR · Kestrel Park', | kestrelQpr: {chip: 'HARERA QPR · Kestrel Park · Jul–Sep 2026', |

D-118 now reads the same on WebMethodology, WebAbout and WebDevPortal. Kestrel's 63% comes from its Jul–Sep 2026 QPR (filed 12 Oct). The Apr–Jun 2026 QPR showed 59%.

### Who has my number (identical on web and app)

| Board | Before | After |
|---|---|---|
| AppYou | what: 'Sapphire Grove Ph 1 visit. You shared your number.' | what: 'Sapphire Grove Ph 1 visit. You let them reach you, through a relay.' |
| AppYou | what: 'Kestrel Park visit. You shared your number.' | what: 'Kestrel Park visit. You let them reach you, through a relay.' |

WebPrivacy already modelled the two site offices as reaching Rohan through a relay, with "Only Larkspur Realty has your own number". AppYou's revoke note for Larkspur implied the same, but its consent history said "You shared your number" for both site offices. AppYou now matches WebPrivacy. The count stays at **3 parties can reach you**, and no lender is listed.

### Pro wording

| Board | Before | After |
|---|---|---|
| WebAbout | Risk Report Pro for one project, paid by you. Bands, reasons and sources stay free. | Risk Report Pro for one project, paid by you: 12 months of written updates. Bands, reasons, sources and alerts stay free. |

Every other Pro mention already used "₹999 per project · 12 months of written updates" with "alerts always free": WebHome, AppYou and WebPricing ("A written update every month until Oct 2027").

### G-38: no prototype levers in visible UI

| Board | Before | After |
|---|---|---|
| AppBeforePay, AppPayAsBuilt, AppVisitPass, AppDevCapture | A Day/Night flip icon button in the app's top bar | Removed. The `theme` tweak drives Night, as fix-tools2 did for AppExplore |
| AppClaims | Share sheet, another app picked: "Prototype: only Plinth is wired here." | "That opens {app}. To check the claims on this flyer, share it to Plinth." |
| AppClaims, WebClaims | Wrong project picked: "In this prototype, only Aurelia Heights, Phase 2 has a sample check." | "The RERA number on this flyer (file) is Aurelia Heights, Phase 2’s. Pick it, or check a flyer (file) for the other project." |
| WebClaims | "Replay the check" button after a result | Removed ("Check another file" stays) |
| WaCost, WaClaims, WaBeforePay, WaVisitPass | "Replay reading" / "Replay the check" / "Replay" in the "WhatsApp conversation (illustrative)" strip | Removed. Each board's `stage`/`message` tweak, or a reload, replays it |
| WaVisitPass | A three-button "Show the conversation on" stage switcher above the chat | Removed (duplicated the existing `stage` tweak) |
| WaRisk, WaDigest, WaAgentOnboarding | "Start over" in the strip above the chat | Removed |
| WaAgentOnboarding | A "Which flow" radio group (Onboarding · R1 / Listing intake · R2) | Removed (duplicated the existing `view` tweak); the `view` tweak was checked in node |
| AppDevCapture | "Start over" stayed visible after "Link closed" (helper) | Shown only during active capture |
| WebDevInbox | Check-in page hint "Preview: Rohan’s pass shows 4821." | "The buyer shows a 4-digit code on their pass. Their number isn’t on it." |

### Developer reply state

| Board | Before | After |
|---|---|---|
| WebDevPortal | We invited Northfield Estates to respond on 3 Oct 2026. No response yet. | Your reply published on 15 Oct 2026 stays live until you publish an update. |

This is the preview shown when Northfield clears its draft. A reply has been live since 15 Oct 2026 (§5b).

### Visualise and other facts

| Board | Before | After |
|---|---|---|
| AppProject | AI-generated preview | AI-generated illustration (×3) |
| AppProject | …ing the original photo. Drag to reveal the AI preview. Images are illustrative.' | …ing the original photo. Drag to reveal the AI-generated illustration. Images are illustrative.' |
| AppProject | …Drag to compare the original photo and the AI preview. Images are illustrative.' | …Drag to compare the original photo and the AI-generated illustration. Images are illustrative.' |
| WebProject | style. AI-generated preview." | style. AI-generated illustration." (×3) |
| WebProject | AI-generated preview | AI-generated illustration |
| WebProject | …drag to compare the original photo and the AI preview | …drag to compare the original photo and the AI-generated illustration |
| AppProject | Snap a bare room on your site visit. AI furnishes it to scale | Start from the brochure plan, or snap the sample flat on your site visit. AI furnishes it to scale |
| WebProject | alt="Empty 3 BHK living room, original photo. Illustrative image." | alt="Empty 3 BHK living room in the sample flat, original photo. Illustrative image." |
| WebProject | Photograph a bare room on your site visit. AI furnishes it to scale | Start from the brochure floor plan, or photograph the sample flat on your site visit. AI furnishes it to scale |
| WaDevAlerts | 3 enquiries need a reply. The oldest is Farah’s, from 16 Oct 2026. | 3 buyers need a reply. The oldest is Kabir’s, from 16 Oct 2026. |
| WebForAgents | No progress filed for 4 quarters; past its Jun 2026 date. | No QPR progress for 4 quarters; past its Jun 2026 date. |
| WebAgentProfile | valid until 21 Jun 2028 · checked 1 Oct 2026</dd> | valid until 21 Jun 2028 · checked 14 Oct 2026</dd> |

The visualise changes follow two §5b rules:

- **The label:** every staged image carries "AI-generated illustration".
- **The starting point:** an under-construction project starts from the brochure floor plan or a photo of the sample flat. Bare-room staging from your own photo is for ready and resale flats only.

## Checked and consistent (no change needed)

- **Aurelia replay and timelines:** every quarter before Oct 2026 shows Moderate; WebProject's "now" step reads "Elevated since 2 Oct 2026". The figures match the §5b QPR table: 24/6/10 to 72/41/70, today 77% of time used.
- **Late QPRs:**
  - 3 of the last 8: Jul–Sep 2024 by 12 days, Jan–Mar 2025 by 41 days, Oct–Dec 2025 by 38 days (due 15 Jan 2026, filed 22 Feb 2026).
  - Apr–Jun 2026 was filed 15 Jul on time.
  - Jul–Sep 2026 was due 15 Oct and is not on HARERA; the developer says it filed on 12 Oct.
  - Sapphire's Apr–Jun 2026 QPR was filed 27 Jul, 12 days late. Coral's newest QPR on HARERA is 187 days old (filed 14 Apr).
- **The Late12 line** is "after Apr 2029" everywhere. "Dec 2028" appears only as a slider tick on WebMethodology.
- **Coral's extensions:** Aug 2028 → Feb 2029 → Aug 2029, with Extension 2 granted 14 Oct 2026. Every other project's original date matches §5.
- **Prices and per-sq-ft figures:**
  - every ₹ figure and ₹/sq ft, including ₹16,207, ₹16,095, ₹11,750 super, the ₹11,999 flyer and ₹18,900;
  - the 10% cap of ₹24.4 L;
  - the demand letter (₹13,16,700, due 30 Oct);
  - the EOI of ₹11,00,000.
- **Visit pass:** Sat 24 Oct 2026, 11 am, code 4821, booked 18 Oct at 9:15 am, consent C-1018-11, no agent of record. Reminders Fri 6 pm and Sat 9 am.
- **Consent refs:** all `C-MMDD-NN` and mapped to the right party. WebPrivacy builds C-1018-01/02 for its own toggles.
- **RERA numbers:**
  - Aurelia GGM/673/405/2022/117 and Heron Point GGM/902/634/2026/12;
  - Ashgrove GGM/918/650/2026/41;
  - Northfield's past projects, on WebDeveloper only;
  - the agent numbers per §5b.
- **Developer and agent names** match §5 and §5b. The group companies on WebDeveloper (Cedarline, Wrenfield, Opaline, Linden, Heronstone, Northfield Buildtech) are the "9 linked companies".
- **Retired and banned copy:** none left of "credit score", "guaranteed", "safe to buy", "too early to score", Tamarind, PLN-C-, "Apr–Jun 2024 (41 days)" or emoji. "Not a credit rating" appears only as the disclaimer. "Credit-rating level" on WebMethodology is an input factor (published ratings), not a claim.
- **"Loan checks arrive in 2027"** is used on AppProject, WebProject, AppYou and WebHome.

## Unresolved, with recommendations

1. **DESIGN.md disagrees with this sweep's rulings.** It was not edited; the owner should update it so engineering reads one source.
   - §5b, line 526: the handoff says "Talk to a Plinth adviser · paid by you, never by developers". Change it to "Talk to a Plinth adviser · free · developers never pay us". Add that WhatsApp quick replies and other compact buttons say "Talk to an adviser" and the message they open carries the full label.
   - §6: "AI: disclose it ('I'm Plinth's AI assistant…')" should become "Ask Plinth is an AI. It answers from public records like HARERA and shows its sources."
   - §4 item 1 (web nav "Following, Ask") and item 16 (Android tabs "Explore · Following · Ask · You") should both say "Ask Plinth".
   - §4 item 5: the risk header caption "Delivery risk · low confidence · 14 Oct 2026" conflicts with §5b's confidence copy. Use "Delivery risk · data as of 14 Oct 2026", with the separate "We're less certain about this one" line.
   - §4b "Picture it furnished" says "AI-generated preview"; §5b says "AI-generated illustration". Keep §5b.
   - §5b cost sheet: state that it has 7 lines, that EDC/IDC is an "Included in the base" note, that the sheet's own total is a check, and that "Charges total ₹9.2 L" is a subtotal.
   - §5b "Who has my number": "number shared" for the Orbis and Meridian site offices reads as if they hold Rohan's own number. The boards now say those offices reach him through a relay and only Larkspur holds his number. Confirm, then reword §5b.
   - §5b disputes list only CL-201 and D-118, but the boards also show:
     - D-127 (10 Oct, complaint count, under review, due 30 Oct);
     - D-104 (Oct–Dec 2025 QPR, not upheld);
     - D-097 (registration month);
     - CL-196 and CL-202.

     Add them to §5b or cut them.
2. **Board-level reviewer controls were left outside the product frames.** Recommend one shared "Design review controls" label, or moving them to tweaks:
   - WaAlerts: "Start over", and the annotation "prototype: on screen 3, add agent number 1187 (found) or 1817 (not found)";
   - WaDevAlerts: the "Whose phone to show" switcher and "Start over";
   - WaAgentOnboarding: "Fill a match / Fill a typo / Fill this step", after a prototype strip note.
3. **The R2 lender model is visible as planned:**
   - WebAbout: "~0.35% of a home loan, paid by the lender … From Jan–Mar 2027";
   - WebPricing: the "Loan checks" card text;
   - WebPrivacy: a "Let one partner lender call me" toggle, off, labelled "Loan checks arrive in 2027".

   None is live, so none breaks "Loans are R2". The founder should decide whether R1 shows the future lender fee at all. If not, cut the 0.35% row and the WebPrivacy toggle.
4. **A developer claim looks implausible.** WebDeveloper shows Northfield's reply, "the Tower B structure was completed in September 2026" (Developer says, not verified), next to records showing Tower B at slab 7 of 20 in Apr–Jun 2026. It is correctly labelled as a claim, but it is implausible on its face. Consider a milder claim, such as "Tower B reached slab 10 in September 2026".
5. **Nothing was rendered in a browser, as the brief asked.** The edits are copy or small structural changes, and no canvas height changes. A visual pass should still check four things:
   - AppExplore's longer Ask pill text;
   - the WaRisk, WaClaims and WaVisitPass bubbles, each one line longer (the chats are bottom-anchored, so the top message clips sooner);
   - WebCostSheet's shorter document and ledger;
   - WebProject's fourth prompt chip.

## Files and scripts

- **Edited boards (44):**
  - AppBeforePay, AppClaims, AppCostSheet, AppDevCapture, AppExplore, AppFamily, AppFollowing, AppMap, AppPayAsBuilt, AppProject, AppProjectStates, AppRisk, AppVisitPass, AppVoice, AppYou;
  - WaAgentOnboarding, WaAlerts, WaBeforePay, WaClaims, WaCost, WaDevAlerts, WaDigest, WaRisk, WaVisitPass;
  - WebAbout, WebAgentProfile, WebClaims, WebCompare, WebCostSheet, WebDevFacts, WebDevInbox, WebDevLiveRecord, WebDevPortal, WebDeveloper, WebFollowing, WebForAgents, WebHome, WebMethodology, WebPayAsBuilt, WebPricing, WebProject, WebProjectStates, WebSearch, WebSignIn.
- **Edit logs:** every string edit, with board, category, old text, new text and count, is in `scratchpad/sweep/edits.log` and `scratchpad/sweep/edits_helper.log`.
- **Scripts** (in `scratchpad/sweep/`): `wfcheck.py` and `smoke.js` (format and Day/Night render), `extract.py`, `audit2.py`, `rules_audit.py`, `tg.py`, `g.py`, `freq.py`, and `rep.py` (the logged replacer).
- **Backups:** `scratchpad/sweep-backup/` holds all 53 boards and `canvas.json`.
