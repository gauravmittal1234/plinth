# Fix pass: consistency and copy (R1 artboards)

**Date:** 18 Oct 2026. **Owner:** design QA and UX writing.
**Source of truth:** DESIGN.md §5b (canonical timeline), §0 (taste rules), §7 (format). PRD §20 (D13). Evaluation findings: consumer G-03, G-06, G-07 and the quick wins; broker BG-02, BG-03, BG-04, BG-05, BG-12 and BG-13.
**Scope:** the 21 product artboards in `canvas/project/`. Excluded: WebProject, AppProject and WebDevPortal (other owners) and the archive files Main, DirectionB, DirectionC, LiveDay and LiveNight.

## Summary

- **16 artboards edited, with 79 fixes.** Five artboards needed no change: AppMap, AppVisualiseCapture, AppVisualiseResult, WebSearch and WebVisualise.
- Every edit was targeted, either a string replacement or a small data change. Layout, taste-pass styling and behaviour are unchanged, apart from four small additions:
  - WebFollowing and AppFollowing each gained one feed row.
  - AppRisk gained one line on the card.
  - The WebCompare risk cell gained a pending-fact block.
- **Checks run on all 21 artboards:**
  - tags balanced;
  - `data-props` parses;
  - `<script src="./support.js"></script>` appears exactly once;
  - the logic script passes `node --check`;
  - `renderVals()` runs, and every top-level `{{hole}}` resolves.
- **Interactions exercised:**
  - AppYou and WebPrivacy: revoke;
  - WebCompare: AI answer and add Coral;
  - WebFollowing: reveal, before and after;
  - WebCostSheet: waive PLC and club. This gives ₹4.9 L less, which is the ₹4.4 L plus GST and stamp duty on it.
- **Copy rules applied across files:**
  - **Frequency sentence:** "…got their OC more than 12 months after the original RERA date." Where the sentence has room, it adds "OC usually comes before keys, often by a few months."
  - **Privacy:** "Your number is never shared without your tap."
  - **Relay:** "While a deal is active, from first visit to registration, the relay stays on."
  - **Agent label:** "Agent · paid by the developer or you, never by Plinth."
  - **Pending fact:** "Jul–Sep 2026 QPR not on HARERA yet (due 15 Oct)", always paired with "Developer says: filed 12 Oct, not yet verified." No screen shows a High band.

## Changes by file

### WaAlerts

| # | Old | New | Why |
|---|---|---|---|
| 1 | Alert image and its aria label: "Was Moderate until 14 Oct 2026" | "Was Moderate until 2 Oct 2026" | §5b band history (G-03) |
| 2 | "…moved from Moderate to Elevated on 14 Oct 2026. Main reason: 72% sold, 41% built (HARERA QPR, Apr–Jun 2026)." | "…on 2 Oct 2026. Trigger: new records, the Apr–Jun 2026 QPR (72% sold, 41% built) and new HARERA complaint orders." | §5b date. The alert now names its trigger (G-03 fix) |
| 3 | "Why Elevated now? 72% of units are sold but 41% is built (HARERA QPR, Apr–Jun 2026)." | "Why Elevated now? New records: 72% of units are sold but 41% is built (HARERA QPR, Apr–Jun 2026), and new complaint orders went against the promoter." | §5b trigger |
| 4 | "Site office · Sector 37D", "· site office", "Phase 2 site office", "Show it at the site office…" (visible copy and pass aria) | "Sales gallery" / "sales gallery" | §5b visit pass: "sales gallery". The consent party stays "Northfield Estates' site office" |
| 5 | "Your number stays masked; the site team sees only your first name." | "Your number is never shared without your tap. The site team sees only your first name." | D13 |
| 6 | Pass footer: "Your number stays masked" | "Never shared without your tap" | D13 |
| 7 | Pass aria label: "Your number stays masked." | "Your number is never shared without your tap." | D13 |

### WebFollowing

| # | Old | New | Why |
|---|---|---|---|
| 1 | Feed: "22 Aug 2026 · QPR for Apr–Jun 2026 filed 38 days late · Late QPRs 2 → 3 · Due 15 Jul 2026, filed 22 Aug 2026" | "15 Jul 2026 · QPR for Apr–Jun 2026 filed on time · Built 38% → 41% · Filed on the due date. 72% of units sold; Tower A at slab 9. Earlier late filings: Apr–Jun 2024 (41 days), Jul–Sep 2024 (12 days) and Oct–Dec 2025 (38 days)." | §5b QPR table and the list of late QPRs (G-03) |
| 2 | (none) | New feed row: "15 Oct 2026 · Jul–Sep 2026 QPR not on HARERA yet · ~~Due 15 Oct~~ → Not on HARERA as of 18 Oct · Developer says: filed 12 Oct, not yet verified. New records are under review, so this band may change." The source is "HARERA QPR register · checked 18 Oct 2026". "Mark all as read" includes it | §5b pending public fact (G-07) |
| 3 | Band row: body "The latest QPR shows 41% built…"; sources "HARERA QPR · Apr–Jun 2026", "Method v1.2" | "Trigger: new records. The Apr–Jun 2026 QPR shows 72% of units sold but 41% built, and new complaint orders went against the promoter." Sources: "HARERA QPR · Apr–Jun 2026", "HARERA complaint orders", "Method v1.1" | §5b trigger. v1.2 was published on 14 Oct, so the 2 Oct change ran on v1.1 (G-03) |
| 4 | Reveal caption: "After 2 Oct: scored on the Apr–Jun 2026 QPR, filed 22 Aug" | "…scored on the Apr–Jun 2026 QPR (filed 15 Jul) and new complaint orders" | §5b |
| 5 | Reveal "Before 2 Oct" bars: sold 66%, time used 70% | sold 70%, time used 65% (the Jan–Mar 2026 QPR row) | §5b QPR table |
| 6 | "Sales ahead of building by 28 points. QPRs late in 2 of the last 8 quarters." / "…by 31 points. QPRs late in 3 of the last 8 quarters." | "Built 27 points behind the time used. QPRs late in 3 of the last 8 quarters." / "Built 36 points behind the time used, and new complaint orders went against the promoter." | The old gap numbers didn't match §5b. On §5b figures the sales gap narrowed (32 → 31), so it can't explain the move |
| 7 | "Between 15 and 30 / 30 and 45 of 100 similar projects finished more than 12 months late." | "…got their OC more than 12 months late. OC usually comes before keys, often by a few months." | G-06 |
| 8 | (none) | Band detail: "Records show: the Jul–Sep 2026 QPR is not on HARERA yet (due 15 Oct). Checked 18 Oct 2026. New records are under review, so this band may change." It sits just above the "Developer says" field | G-07, paired with the claim |
| 9 | "Your number is masked. Only Plinth has it; no developer or broker does." | "Your number is never shared without your tap. 3 parties can reach you now." | D13. §5b count. The old line contradicted Who has my number and cast brokers as the enemy |
| 10 | WhatsApp channel: "+91 98••• ••421" | "+91 98••• ••721" | One masked number everywhere (WebPrivacy "ends in 4721") |
| 11 | WhatsApp preview: "Phase 2 · 2 Oct 2026. The latest QPR shows 41% built with 77% of time used." | "Phase 2 · 2 Oct 2026. Trigger: the Apr–Jun 2026 QPR (72% sold, 41% built) and new complaint orders." | Alerts name their trigger (G-03) |

### AppFollowing

| # | Old | New | Why |
|---|---|---|---|
| 1 | Complaint update: "HARERA order · 7 Oct 2026" | "HARERA order · 9 Oct 2026" | §5b latest order |
| 2 | Band update source: "HARERA QPR · 2 Oct 2026" | "HARERA QPR · Apr–Jun 2026 · changed 2 Oct 2026" | No QPR was filed on 2 Oct |
| 3 | (none) | New first update: "Jul–Sep 2026 QPR not on HARERA yet · Aurelia Heights, Phase 2 · due 15 Oct. Developer says: filed 12 Oct, not yet verified. · HARERA QPR register · checked 18 Oct 2026" (Filings) | G-07 |
| 4 | Compare: Sapphire "15–30 of 100", Kestrel "5–15 of 100" (both high confidence) | "About 20 of 100", "About 10 of 100" | §5 high-confidence copy |
| 5 | Compare label: "Late by more than 12 months, in similar projects" | "OC more than 12 months late, in similar projects (keys usually follow the OC)" | G-06 |
| 6 | Compare, Coral original completion: "Extended twice" | "Aug 2028, now Aug 2029" | §5b Coral |

### AppRisk

| # | Old | New | Why |
|---|---|---|---|
| 1 | (none) | Under "Was Moderate until 2 Oct 2026": "**Jul–Sep 2026 QPR not on HARERA yet** (due 15 Oct). Developer says: filed 12 Oct, not yet verified. Under review, so this band may change." Shown only when the band lever is Elevated | G-07, quick win 6 |
| 2 | "…finished more than 12 months after their original RERA date. The rest, X to Y, finished within 12 months." | "…got their OC more than 12 months after the original RERA date. The rest, X to Y, got it within 12 months: some on time, some up to a year late. OC usually comes before keys, often by a few months." | G-06, quick win 3 |
| 3 | Legend: "Finished more than 12 months late" / "Finished within 12 months" | "OC more than 12 months late" / "OC within 12 months" | G-06 |
| 4 | "…Based on 212 projects. This describes a pattern, not a forecast for this project." | "…Based on 212 projects." | Quick win 3: the line undercut the card's question |
| 5 | Icon-array aria, share card and share aria: "finished more than 12 months late" | "got their OC more than 12 months late" | G-06 |
| 6 | Evidence 2: source "…· Jul 2024 to Jun 2026"; extract "Longest delay: 38 days (Oct–Dec 2025)." | Source "…· every quarter since registration (Dec 2022)". Extract: "Filed after the due date in 3 of the last 8 quarters: Apr–Jun 2024 (41 days late), Jul–Sep 2024 (12 days) and Oct–Dec 2025 (38 days). Longest delay: 41 days." | §5b late QPRs (see open issue 1) |
| 7 | Developer field footnote: "Under review since 15 Oct 2026; we'll check it against the Jul–Sep 2026 QPR." | "HARERA doesn't show the Jul–Sep 2026 QPR yet (checked 18 Oct 2026)." | Pairs the claim with the public fact |

### WaRisk

| # | Old | New | Why |
|---|---|---|---|
| 1 | Card and card aria: "…similar projects finished more than 12 months late." | "…got their OC more than 12 months late." | G-06 |
| 2 | (none) | Caption: "**Not on HARERA yet:** the Jul–Sep 2026 QPR, due 15 Oct. Developer says: filed 12 Oct, not yet verified." | G-07 |
| 3 | (none) | Caption: "The card counts OC dates. OC usually comes before keys, often by a few months." The timestamp moved to this line | G-06 |

### WebCompare

| # | Old | New | Why |
|---|---|---|---|
| 1 | (none) | Aurelia's cell in the delivery-risk row now shows "Jul–Sep 2026 QPR not on HARERA yet (due 15 Oct)." and, in a claim tone field, "Developer says: filed 12 Oct, not yet verified." Added the `claimBg` token (Day #F1ECE2 / Night #1D2621) | G-07, §0 claim field |
| 2 | (none) | AI answer adds: "Aurelia Phase 2's Jul–Sep 2026 QPR is not on HARERA yet; it was due 15 Oct. The developer says it filed on 12 Oct, which we have not verified [n]." | G-07 |
| 3 | Row label: "How often similar projects finished 12+ months late" | "How often similar projects got their OC 12+ months late". The row note reads "OC usually comes before keys, often by a few months." | G-06 |
| 4 | Built row source "HARERA QPR · Apr–Jun 2026"; AI cite "HARERA QPRs · Apr–Jun 2026"; footer "HARERA progress reports for Apr–Jun 2026" | "Latest HARERA QPR for each project"; "Latest HARERA QPRs"; "the latest HARERA progress reports" | Kestrel's 63% comes from its Jul–Sep 2026 QPR, filed 12 Oct (§5b, WebFollowing) |
| 5 | Coral column: "Not calculated yet · Carpet area not on file"; date "Extended twice · Original date is on the project page" | ₹15,300 per sq ft · 1,240 sq ft carpet; "Aug 2028 · Extended twice: Feb 2029, then Aug 2029" | §5 agreed figures and §5b extensions (WebSearch already showed ₹15,300) |

### AppYou

| # | Old | New | Why |
|---|---|---|---|
| 1 | Parties: "Orbis Land's site office · For your Kestrel Park site visit · Masked relay · shared 12 Oct 2026"; "Plinth home-loan adviser (a person) · Your number · shared 9 Oct 2026" | §5b list, word for word:<br>• **Orbis Land site office**: Kestrel Park site visit, shared 12 Oct 2026, consent C-1012-04, access until 11 Nov 2026 · *Developer · pays us nothing*<br>• **Larkspur Realty**: Your agent of record for Kestrel Park (you added them; shared by your tap after the visit, 12 Oct 2026) · *Agent · paid by the developer or you, never by Plinth*<br>• **Tamarind Home Finance**: Loan eligibility you asked for, 15 Oct 2026 · *Lender · pays us a referral fee only if you take the loan*<br>• **Meridian Habitat sales office**: Price list, Sep 2026 · *Ended* (no Revoke button) | §5b; BG-02, BG-03 (Larkspur was missing; the AppYou and WebPrivacy samples now match) |
| 2 | The count was the number of unrevoked parties (2) | The count is the parties that can reach you, excluding ended ones: **3** | §5b "3 parties can reach you" |
| 3 | "2 of 3 contacts used in the last 30 days" (2 bars) | "3 of 3 contacts used in the last 30 days · next free slot 11 Nov 2026" (3 bars) | Matches WebPrivacy and the §5b dates |
| 4 | "Developers and partners see a masked number unless you choose to share yours." | "Your number is never shared without your tap. While a deal is active, from your first visit to registration, the masked relay stays on." | D13, plus the one-line relay rule |
| 5 | "+91 98••• ••417" (aria "ending 417") | "+91 98••• ••721" (aria "ending 721") | One number across web and app |
| 6 | Revoke sheet: always "They won't be able to call or message you…"; toast "…can no longer contact you." | Larkspur gets its own note: "This ends their relay. You shared your real number with them on 12 Oct 2026, and a shared number can't be recalled, so ask them to delete it." The toast now ends "…can no longer reach you through Plinth." | BG-04: honest about a number already shared |

### WebPrivacy

| # | Old | New | Why |
|---|---|---|---|
| 1 | Parties: "Larkspur Realty · Partner broker · HARERA-registered agent · Arrange your site visit…"; "Tamarind · Partner lender · home loans"; "Northfield Estates · Developer · free enquiry…"; "Meridian Habitat · …possession question" | Same four parties as AppYou and §5b: Orbis Land site office (*Developer · pays us nothing*, ref C-1012-04, until 11 Nov 2026); Larkspur Realty (*Agent · paid by the developer or you, never by Plinth*, agent of record, number shared by your tap); Tamarind Home Finance (*Lender · pays us a referral fee only if you take the loan*); Meridian Habitat sales office (Price list, Sep 2026, *Ended 2 Oct 2026 · 30 days, no active deal*) | §5b; BG-03 labels; R2 parties removed (quick win 10) |
| 2 | Status for every active party: "Can reach you until … · via relay" | Larkspur: "Can reach you while your Kestrel Park deal is active · your number, shared by your tap". If revoked: "…relay stopped. They still have the number you shared; ask them to delete it." | D13, BG-04 |
| 3 | "…each for one purpose, through a relay." | "…each for one purpose. Only Larkspur Realty has your own number, because you tapped to share it." | Accurate after the agent share |
| 4 | Hero: "Your number stays masked. … take it back in one tap." | "Your number is never shared without your tap. … take it back anytime." | D13 |
| 5 | Breadcrumb: "Your number ends in 4721 and is masked" | "…and is never shared without your tap" | D13 |
| 6 | "No more than 3 new parties can get your relay number in any 30 days. Only one partner per property." | "No more than 3 new parties can reach you in any 30 days, and only parties who can contact you count. Only one agent per property." | BG-05 |
| 7 | "Not to brokers, lenders, developers or anyone else. Partners see a relay number, never yours." | "Not to agents, lenders, developers or anyone else. Others see a relay number unless you tap to share yours." | D13. The copy targets lead selling, not brokers (BG-12) |
| 8 | "The other side never sees yours." / "Your own number is never shown or sent." / "It ends. When you revoke, or after 30 days…" | "…never sees yours unless you tap to share it." / "…never shared without your tap; after a confirmed visit you can tap Share my number." / "The relay stops when you revoke, or after 30 days with no active deal. While a deal is active, from first visit to registration, it stays on." | D13, BG-04 (the old relay died after 30 days, mid-deal) |
| 9 | Call demo: "Larkspur Realty · Partner broker · via your Plinth relay"; "What the broker sees"; ref PLN-C-261012-0417 | "Orbis Land site office · Developer · via your Plinth relay"; "What the site office sees"; ref C-1012-04 | Larkspur now holds the real number, so the relay demo uses the site office |
| 10 | Delete copy: "Partners lose…", "Every partner loses…", "partners can no longer reach you" | "Every party loses…", "no one can reach you through Plinth" | Accurate wording for developers and agents |
| 11 | Consent refs "PLN-C-26xxxx-xxxx" | "C-MMDD-NN" format, matching §5b C-1012-04 | One reference format |

### WaCost

| # | Old | New | Why |
|---|---|---|---|
| 1 | Card and aria: "Cost sheet of 18 Oct 2026" | "Cost sheet of 2 Oct 2026" | §5b cost-sheet date (G-03) |
| 2 | "We keep this file for 30 days, then delete it." | "…then delete it, unless you save it to your account." | Quick win 10: one retention rule, matching the later "Saved to…" message |

### WebCostSheet

The sheet total, ₹9.2 L of charges, was already right, but the lines did not match §5b.

| # | Old | New | Why |
|---|---|---|---|
| 1 | PLC ₹2,50,000 (₹125/sq ft super), in the reading, ledger, negotiable toggle and waiver maths | ₹2,90,000 (₹145/sq ft super) | §5b PLC ₹2.9 L; PLC plus club = ₹4.4 L negotiable |
| 2 | Parking ₹2,00,000; IFMS ₹1,00,000 | ₹3,50,000; ₹1,30,000 | §5b |
| 3 | EDC and IDC ₹1,80,000; power backup ₹40,000 | "Included" (in the base price on this sheet). The 10-line reading animation keeps its count | §5b charges = PLC + club + parking + IFMS = ₹9.2 L |
| 4 | Charges note "PLC, parking, club, EDC and IDC, IFMS, power backup"; "Why only these two?" copy | "PLC, parking, club and IFMS"; "GST, stamp duty and registration are set by law, and EDC and IDC by the government…" / "Parking and IFMS are standard on this sheet. EDC, IDC and power backup are already in the base price." | Consistency with the new lines |

### AppVoice

| # | Old | New | Why |
|---|---|---|---|
| 1 | Risk card: "…finished more than 12 months late." | "…got their OC more than 12 months late. OC usually comes before keys, often by a few months." | G-06 |
| 2 | AI answer: "…finished more than 12 months late [3]." | "…got their OC more than 12 months late [3]. Keys usually come a few months after the OC." | G-06 |
| 3 | "cost sheet of 14 Oct 2026"; source "Developer cost sheet · 14 Oct 2026" | "2 Oct 2026" | §5b (G-03) |
| 4 | Compare sources: "HARERA QPR · Kestrel Park · Apr–Jun 2026", "Developer cost sheets · 14 Oct 2026" | "…Jul–Sep 2026", "Developer cost sheets · Oct 2026" | Kestrel's latest QPR was filed 12 Oct (§5b) |

### WebHome

| # | Old | New | Why |
|---|---|---|---|
| 1 | Hero card frequency, all 4 scored projects: "…finished more than 12 months after their original RERA date." | "…got their OC more than 12 months after the original RERA date. OC usually comes before keys, often by a few months." | G-06 |
| 2 | "How does Plinth know?" example: same sentence | Same fix | G-06 |
| 3 | Aurelia card source: "Developer cost sheet · Sep 2026" | "Developer cost sheet · 2 Oct 2026" | §5b (G-03) |
| 4 | QPR tape labels: "…Jun '24, Dec '24, Jun '25…" (hatched: Jun '24, Dec '24, Dec '25) | "…Jun '24, Sep '24, Jun '25…" | The 3 hatched slabs are now exactly the §5b late filings |
| 5 | "Prefer a person? Talk to our team on WhatsApp" | "Prefer a person? Talk to a person on WhatsApp. We explain records. We don't book units, negotiate or take payments." | BG-13, quick win 9 |
| 6 | "Never for sale: … or your number to more than one partner per property." | "…a place in results, or your number. It is never shared without your tap." | D13 |

### WebMethodology

| # | Old | New | Why |
|---|---|---|---|
| 1 | "…finished more than 12 months after their original RERA date. The rest finished within 12 months." | "…got their OC more than 12 months after the original RERA date. The rest got it within 12 months." It is followed by a new 19 px line: "'Within 12 months' still includes projects up to a year late. OC usually comes before keys, often by a few months." | G-06. The large statement stays short |
| 2 | Legend: "More than 12 months late" / "Within 12 months" | "OC more than 12 months late" / "OC within 12 months" | G-06 |
| 3 | Band-picker and icon-array aria: "finished…" | "got their OC…" | G-06 |
| 4 | Dispute log: "D-118 … Upheld 3 Sep 2026: unit count corrected to 412." | "…unit count corrected to 500." | §5b: 500 units |

### AppScan, AppExplore, WebDeveloper

| File | Old | New | Why |
|---|---|---|---|
| AppScan | "…finished more than 12 months after their original RERA date." | "…got their OC more than 12 months after the original RERA date. OC usually comes before keys, often by a few months." | G-06 |
| AppExplore | "Want a person to check? Talk to our team · Mon–Sat, 10 am–7 pm" | "Want a person to explain the records? Talk to a person · Mon–Sat, 10 am–7 pm. We don't sell homes or negotiate." | BG-13, quick win 9 |
| WebDeveloper | "Follow Northfield… Your number stays masked." | "…Your number is never shared without your tap." | D13 |

## Open issues: contradictions found but not resolved

1. **§5b contradicts itself on late QPRs.** It says "3 of the last 8 quarters", but its three late quarters (Apr–Jun 2024, Jul–Sep 2024, Oct–Dec 2025) span 9 quarters if the window ends at the latest filed QPR, Apr–Jun 2026. I followed the list as written: AppRisk evidence, the WebFollowing feed and the WebHome tape now name those three. AppRisk's evidence window now reads "every quarter since registration" rather than "Jul 2024 to Jun 2026". **Lead to decide:** either say "3 of the last 9 quarters", or move the first late filing inside Jul 2024–Jun 2026 (for example Oct–Dec 2024). Then update the three screens.
2. **The blanket extension isn't in §5b.** WebMethodology says v1.2 adds "the 4-month MoHUA extension of Jul 2026" to every original date. That puts Aurelia's Late12 line at Apr 2029. §5b says "No extensions so far" and is silent on blanket extensions. The G-06 template ("…got their OC after Dec 2028") would then be wrong by 4 months. Add the blanket extension to §5b or remove it from WebMethodology.
3. **WebDevPortal (excluded) contradicts §5b.** Its notice lists "QPR for Jul–Sep 2026 not on HARERA" under "In the downgrade notice, not public yet". §5b says buyers see that fact now. It also says "late in 4 of the last 9 quarters". Its owner should align it.
4. **WebProject and AppProject (excluded) still need this pass:**
   - the frequency sentence with OC and the keys line (G-06);
   - the pending fact next to Northfield's "filed on 12 October" claim (G-07);
   - the cost-sheet evidence dated "Sep 2026" (G-03);
   - "Talk to our team" (BG-13);
   - any "masked" privacy copy (D13).
5. **I invented consent references to fill gaps in §5b.** §5b gives only C-1012-04 (Orbis). I used C-1012-05 (Larkspur), C-1015-02 (Tamarind) and C-0902-01 (Meridian), plus C-1018-0x for consent toggles. I also kept these WebPrivacy details: Tamarind's access until 14 Nov 2026, and Meridian shared 2 Sep and ended 2 Oct 2026. Add them to §5b or replace them.
6. **The 2 Oct band change ran on method v1.1.** WebMethodology publishes v1.2 on 14 Oct, so the WebFollowing band row now cites "Method v1.1". Suggest adding to §5b: "The 2 Oct change was made under v1.1; still Elevated after the v1.2 recalculation on 14 Oct."
7. **The visit booking has no agent-of-record step (BG-02).** The WhatsApp Flow still has no "Working with an agent on this project?" step. That needs a new Flow screen, not a copy fix. Larkspur now appears as agent of record in Who has my number, so the flow and the ledger disagree on how an agent gets added.
8. **Money copy (BG-12) needs a founder decision.** AppYou ("We earn only from buyers, sellers and lenders…") and the WebHome money ledger don't mention future partner-agent revenue. The R2 wording isn't decided, so I left both unchanged.
9. **The WebHome Pro tier contradicts the free tier (quick win 10).** "Risk Report Pro: deep dive, compare, 12 months of alerts, ₹999" clashes with "Everyone: … alerts … Free". It matches PRD M2, so the PM needs to decide.
10. **The live strip says "next QPR due 15 Jan 2027" and I left it.** That is true for the Oct–Dec 2026 quarter and doesn't contradict §5b. Quick win 6 asks for it to match the pending fact. If we change it, change every strip at once, WebProject and AppProject included.
11. **Some canvas heights may now be too small.** I didn't edit canvas.json. Check these captures:
    - **AppRisk** (fixed at 3840): about 100 px more content.
    - **WebFollowing** (6700): one more feed row and one paragraph in the band detail, about 250 px.
    - **WebCompare**: the Aurelia cell grew by about 70 px.
    - **WaRisk and WaAlerts**: the chats are bottom-anchored, so the earliest bubbles move up.
    - **WaAlerts pass footer**: "Never shared without your tap" may wrap in its 166 px column.
12. **Partial Aurelia views don't show the pending fact.** AppVoice (risk card and answers), the WebHome hero card and the AppExplore scan card show a short version of Aurelia's risk without it. They weren't in the task list. Consider adding the fact for consistency.
