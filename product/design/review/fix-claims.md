# Claims vs records (F-90): design notes

**Screens:** `WebClaims`, `WaClaims` and `AppClaims` (new), in `scratchpad/canvas/project/`.
**Designer:** principal product design. **Date:** 18 Oct 2026.
**Rules applied:** DESIGN.md §0 (taste pass v1) first, then §2–§4c, §5b (canonical timeline) and §7; PRD §12 (never certify title, label AI, cite sources) and §20 (F-90); the "Claims vs records" spec in `evaluation/10x_shortlist.md`.
**Checks run on every file:** an HTML tag-balance and attribute-quoting parse; a check that every image slot is an empty `<div>`; a scan for banned patterns (glass, glow, banned fonts, "lie", "fraud", "misleading"); `data-props` JSON parse; and a Node run of `renderVals()` for every tweak combination in Day and Night. That run also fires every handler, drains every timer, and resolves every `{{hole}}`, including the ones inside nested loops. All three files are clean. No browser was opened, so line wraps are estimated from type metrics.

## Summary

| Screen | Size | Tweaks | Signature live thing |
|---|---|---|---|
| WebClaims | 1280 × 5900, `expand: fill` (Result). Drop and Reading set `min-height` 2000 | theme · step (Result, Drop, Reading) · case (Flyer, Which project?, No claims found, Unreadable file) | **Claims light up as they're checked.** A mint highlighter sweeps across each claim on the flyer as its record is checked, and a verdict tag lands on it. The ledger row beside it turns from "Waiting to check" to "Checking against the HARERA registration", then to its verdict. The giant count ticks from "0 of 7" to "4 of 7", and a 7-segment strip fills in verdict tones |
| WaClaims | 390 × 1340 | theme · stage (Card, Reading, Confirm) | The claims card (an image) with "Flyer says / Records show" rows. Its 7-segment strip fills one claim at a time when the card arrives |
| AppClaims | 390 × 844 | theme · entry (Share sheet, Camera) · screen (Result, Entry, Reading) · sheet (Closed, Open) | The same light-up on the shared flyer or the hoarding photo, then the per-claim bottom sheet, with Previous and Next |

**Suggested `canvas.json` entries** (I did not edit it; other groups are adding boards, so check x first):
- `WebClaims.dc.html`: page `web`, x 21760, y 0, w 1280, h 5900, `expand: fill`, title "Claims vs records", `is_interactive: true`.
- `AppClaims.dc.html`: page `android`, x 5170, y 0, w 390, h 844, title "Claims vs records", `is_interactive: true`.
- `WaClaims.dc.html`: page `whatsapp`, x 2420, y 0, w 390, h 1340, title "WhatsApp · claims check", `is_interactive: true`.

**Images (generated and wired):**
- `brokerFlyer` (`/_blob/023b51857001b445b116f446985c7d2f`, 896×1200) and `hoardingClaim` (`/_blob/3c7757ac9408c879276b6d26d70432cd`, 928×1152) are now real `<img data-slot>` elements in all three files. The original prompts are in `product/design/assets/requests_claims.json`.
- **The flyer image is greeked:** every text block is a plain bar. The claims are set as HTML type on those bars:
  - heavy navy and gold Mukta;
  - positions measured from the image's pixels, as percentages;
  - sizes in `cqw`, so the type scales from the 1280 web section down to the 170 px WhatsApp thumbnail.
- **The hoarding's blurred text** is covered by a navy quad cut to the panel's perspective (`clip-path`). Its lines are set with a per-line `skewY` that follows the hoarding's slant.
- **Doc boxes use each image's exact aspect ratio** (896/1200 and 928/1152), so the type and the claim highlights stay registered.
- **Claim highlights are re-measured to the real bars:**
  - The round "Only 20 flats left" sticker gets a round highlight.
  - The hoarding highlights are skewed to match its type.
  - Each verdict tag has an anchor (`out-r`, `below-l`, `below-c`, `in-r`, `in-mr`, `out-rt`) so it never covers its own claim.
- **Checked by rendering** the real `renderVals()` styles over both images with a Quick Look thumbnail, at web (440 px) and app (240 and 256 px) sizes.
- **The flyer's wording is now in DESIGN.md §5b**, under "Claims vs records example". The fine print "Stamp duty and registration extra." is new; the price row's evidence now cites it.

Existing photos reused: `heroAurelia` (project confirm and project row), `filingsStack` ("Where do the answers come from?") and `roomMinimal` (the "no claims found" brochure page).

---

## 1. The flow

One pipeline, three doors.

1. **In.**
   - **Web:** drop or choose a file, take a photo, paste a link, or try the sample flyer.
   - **WhatsApp:** forward the image, PDF or voice note to Plinth.
   - **App:** "Share to Plinth" from any app's share sheet, or the camera's new **Check claims** mode, next to RERA QR and Where am I?
2. **Read.** OCR, then the claim extractor, runs top to bottom. Each claim appears as it's found: in the web ledger as "Found. Waiting to check", on the doc as a faint mark, and as a live count. Phone numbers are masked in our copy at this step.
3. **Confirm the project (mandatory).** The doc is matched to a project by the RERA number on it (on the sample flyer it sits in the fine print). If there is no number, we match on name plus sector.
   - The buyer always confirms: "Is this Aurelia Heights, Phase 2?" with **Yes, check it** or **No, pick the project**.
   - Nothing is checked before this tap.
   - On WhatsApp the two answers are reply buttons ("Yes, that one", "No, another one").
4. **Check.** Each claim is compared with its own record by a rule. Claims light up on the doc one by one; this is the signature moment. The count runs "3 of 7 checked · 2 differ so far".
5. **Result.**
   - The answer comes first, as a sentence: **"4 of 7 claims differ from the records."** A breakdown follows: "1 matches. 1 isn't in any record we read. 1 can't be checked until the Jul–Sep QPR is filed."
   - Next comes the doc beside a **Flyer says / Records show** ledger. The left column takes the document's type: "Brochure says", "Flyer says", "Hoarding says", "Cost sheet says", "Voice note says".
   - Every row, and every mark on the doc, opens the evidence. On the web it expands inline; in the app it opens a bottom sheet. The evidence shows:
     - how we checked;
     - the quoted extract from the record;
     - source chips;
     - "Developer says" where the developer has replied;
     - **one question to ask the broker**;
     - "Report an error in this row".
6. **Act.**
   - **Share with family** sends only our summary, never the file.
   - **Save to project** files it next to the project's records.
   - **Follow** gets the Jul–Sep QPR alert that would settle the "can't check" row.
   - **What should I ask the broker?** offers 4 ready questions, one per difference, to copy or send to your WhatsApp.

**Sample data (fictional; extends DESIGN §5b's claims example).** The flyer makes 7 claims. The **Records show** column uses only §5b facts. The flyer's wording has been added to §5b.

| Flyer says | Verdict | Records show | Sources |
|---|---|---|---|
| Possession Dec 2026 | Differs | Original completion Dec 2027, no extensions; 41% built | HARERA registration · Dec 2022; QPR Apr–Jun 2026 |
| Structure up to 12th floor | Can't check | Slab 9 at the last filing; the Jul–Sep QPR, due 15 Oct, is not on HARERA. Developer says "filed 12 Oct" (not verified) | QPR Apr–Jun 2026; QPR register · 18 Oct 2026 |
| Only 20 flats left | Differs | 72% of 500 units booked at the last filing, so about 140 unbooked | QPR Apr–Jun 2026 |
| ₹11,999/sq ft all-inclusive | Differs | All-in ₹18,900 per sq ft carpet (cost sheet of 2 Oct 2026 plus GST, stamp duty and registration). The base alone is ₹11,750 per sq ft super | Developer cost sheet · 2 Oct 2026; Plinth cost rules v2026.10 |
| 3 BHK · 2,000 sq ft | Differs | 1,450 sq ft carpet as registered; 2,000 is the super area | HARERA registration · unit sizes |
| 40,000 sq ft clubhouse | Not in records | No filing we read gives a size; the approved building plan may | Searched HARERA · 14 Oct 2026 |
| RERA GGM/673/405/2022/117 | Matches | Registered Dec 2022 to Northfield Estates for this project | HARERA registration |

The hoarding (app camera path) makes 3 claims:
- "Possession Dec 2026" (Differs);
- "3 BHK from ₹2.35 Cr" (Matches the **developer's price list**, and is labelled so; the all-in is ₹2.74 Cr);
- the RERA number (Matches).

That gives "1 of 3 claims differs", which shows the feature isn't a machine for saying no.

**The verdict vocabulary** is four words, each with its own icon and tone and never an alarm colour. The risk ramp appears only on the project's band chip.
- **Differs:** ink fill and a not-equal icon. It is the strongest tone, but it is not red.
- **Matches:** a stone tone and a tick.
- **Not in records:** the warm claim tone and a magnifier.
- **Can't check:** a hatched tone and a clock. The hatch is the same "uncertain" pattern as the icon array.

Copy always says "differs from the records", never "false", "lie", "fraud" or "misleading". A Match always carries the note: "A matching RERA number shows the project is registered. It doesn't make the other claims true."

## 2. States

| State | What triggers it | What the buyer sees | Where it's drawn |
|---|---|---|---|
| **Reading** | Any upload | Doc with a scan line; claims appear one by one; "You can leave this page. We'll keep reading." | Web step Reading; App screen Reading; WA stage Reading (typing indicator, "Reading the flyer") |
| **Confirm project** | A RERA number or name match | Photo, name, developer, sector and band chip, plus "We matched the RERA number on the flyer…"; **Yes, check it** / **No, pick the project** | Web, App, WA (stage Confirm) |
| **Project not identified → pick project** | No readable RERA number, or a name with several matches ("Aurelia Heights" has 2 phases) | "Which project is this flyer for?", with a reason ("The RERA number on the flyer is too blurred to read…"), radio options, a search field and "Check against [project]". The RERA row then becomes **Can't check**: "The number on the flyer is too blurred to read. You picked … its number is …" | Web case **Which project?**; App via **Pick another**; WA via **No, another one** ("Which project is it? Type its name or RERA number") |
| **Claims we can't check** | (a) the record isn't public yet, e.g. a missing QPR; (b) a forecast or opinion ("prices rise 10% after Diwali", "best investment"); (c) a fact no register holds | (a) and (b) get **Can't check**, with the reason and, where one exists, the date it can be checked, plus Follow to hear when. (c) gets **Not in records**, with what we searched and which document would settle it | Every surface, in the sample's slab and clubhouse rows |
| **No claims found** | Lifestyle pages, floor plans, amenity pages | "0 claims we can check on this page", with "We read the whole page…" and the list of what we can check. Buttons: **Try another page**, **Ask about this project** | Web case **No claims found** (doc = a brochure page photo) |
| **Unreadable file** | Blur, glare, crop, a password-protected PDF, a corrupt file | "We couldn't read this photo", with how to retake it (flat, daylight, whole page) and "a screenshot of a locked PDF works". Buttons: **Try another photo**, **Ask a person to read it** (concierge lane; "usually the same day"). Nothing is saved | Web case **Unreadable file** (doc shown blurred) |
| **Partly readable** (notes only) | Some regions unreadable | Rows for what was read, plus one "We couldn't read the bottom strip" row with a retake prompt; never a guessed claim | Spec for build |
| **Outside coverage** (notes only) | A project outside Gurugram, or not RERA-registered | "We cover Gurugram for now." If the number doesn't exist on HARERA, the RERA row is **Differs**: "No project with this number on HARERA (searched 18 Oct 2026)" | Spec for build |
| **Voice note** (notes only) | WA or app audio | Transcribed, then shown as "Voice note says"; the audio is deleted after transcription | Shares the F-91 recap path |
| **Same flyer again** (notes only) | Same file hash | The earlier check, re-run against today's records, with "Checked again 18 Oct 2026; 1 row changed" (feeds F-93 "Since you last looked") | Spec for build |

## 3. Data and AI it needs

**Records (deterministic, already in the platform):**
- **HARERA registration:** RERA number to project and developer, original completion date, extensions, carpet areas by configuration, number of units.
- **QPRs and the QPR register:** built %, booked %, slab reached, filing dates, and missing or late filings.
- **Developer papers:** the cost sheet and price list from the developer workspace (F-63+) or from buyer uploads. They are always labelled "Developer cost sheet" or "Developer price list", never "records".
- **Plinth cost rules** (v2026.10), for all-in and per-sq-ft-carpet figures (F-11).
- **DTCP OC and licence registers**, for "ready to move" and "OC received" claims.
- **HARERA orders**, for "zero complaints" style claims.
- **A project alias table**, mapping marketing names to RERA projects and phases, for the no-number match.
- **The banned-phrase register** (register row 5), for phrases like "RERA approved" or "assured returns". These get a plain note, not a verdict word.

**AI, behind the model gateway, schema-locked and with no tool access:**
- **OCR** (reuse F-10) with bounding boxes, plus a light pass for Hindi and Hinglish.
- **`extract.marketing_claims@1`.** It returns `{type, raw_text, value, unit, qualifier (super/carpet/all-in/base), bbox, confidence}` for six types: possession or completion date; price or all-in; area; RERA number and status; OC or "ready to move"; sold or "only N left". A **second reader** runs independently; where the two disagree, or confidence is low, the row goes to a person. That is concierge-first for the first ~500 forwards (§18).
- **The matcher.** A RERA-number regex and lookup comes first; failing that, a fuzzy name-plus-sector match on the alias table. The confirm step is always shown.
- **Verdicts are rules, not AI.** One comparator per type does the work: date compare, cost-rules normalisation (super vs carpet, base vs all-in), area compare, booked % to units, register lookup. Each has tolerances, and when unsure it falls to **Can't check**.
- **The "ask the broker" questions and share text** are templates filled from the verdict rows. No generated prose is shown as fact.
- **Speech-to-text** for voice notes. This is shared with F-91.

**Pipeline reuse.** The same extractor and ledger power:
- **F-91 site-visit recap:** the transcript of the buyer's own voice recap becomes "Sales office says / Records show". It is filed as an unverified "Developer says".
- **F-92 pay-as-built:** a demand letter becomes "Demand says slab 12 / Records show slab 9". It is the same row component with a new claim type, `demand_stage`.

Build F-90 first, as the shortlist says.

**Measures before launch:**
- claim-extraction precision and recall on a labelled set of about 300 real Gurugram flyers;
- verdict accuracy, reviewed by a person;
- the **false "Differs" rate** (target near zero), because it is the costliest error;
- time to result (target under 30 seconds on web, under 1 minute on WhatsApp);
- the share-to-family rate, as the acquisition loop.

## 4. Risks

1. **A wrong "Differs".** This is the largest risk: it carries reputational and legal exposure (lawyer Q2 on s.10(c) and "false grade").
   - **Mitigations:** verdicts come from rules, not AI. Both sides are always shown, with the record's date. Uncertainty is phrased "at the last filing". When in doubt, the row is **Can't check**. Every row has a "Report an error" link. Developers and brokers get the existing evidence and dispute lane; nothing they say changes a verdict without a record.
2. **Wrong project.** A Gurugram name often covers several phases.
   - **Mitigations:** the confirm step is mandatory, the RERA number comes first, and the RERA row turns **Can't check** when we had to ask.
3. **Stale records.** QPRs are quarterly; "only 20 left" may be true today.
   - **Mitigations:** every comparison names its filing date. "Sales since 30 Jun 2026 aren't public yet" sits in the evidence. A Follow nudge offers the next filing.
4. **Developer paper presented as a record.**
   - **Mitigation:** price list and cost sheet sources keep their developer label, and the hoarding row says "Price list shows", not "Records show".
5. **Privacy and copyright.**
   - The broker's number and other third-party numbers are masked in our copy.
   - The flyer is never republished, and shares carry only our summary.
   - Media is deleted after 30 days unless saved. DPDP notices apply.
   - We never name or rate the broker (no broker scoring in R1).
6. **Prompt injection in images.** Flyer text such as "ignore previous instructions" can't act: the extractor returns a fixed schema and has no tools.
7. **WhatsApp policy.**
   - Replies are session messages inside the 24-hour window, and the card is an image we send in reply.
   - Every label is within limits:
     - reply buttons: "Yes, that one" (13), "No, another one" (15), "See all claims" (14), "Follow project" (14), "Ask" (3), "Yes, alert me" (13), "Not now" (7);
     - CTA URL button: "Open full check" (15).
8. **Reading as an accusation.** Copy is calm and factual ("differs from the records"), the risk ramp is never used on verdicts, and Matches is shown as plainly as Differs. "Not legal advice. We never certify title." sits under every ledger.
9. **Cost and latency.** Two readers per forward plus OCR. Mitigations: cache by file hash, run the second reader only above a claim count or below a confidence, and keep the human queue small after the first 500.
10. **Build cost.** Highlight boxes need OCR bounding boxes mapped to the rendered image, including PDFs with several pages; the web doc column then needs a page switcher.

## 5. Self-critique (not measured in a browser)

| Screen | Taste (critique.md weighting) | §8 gate (/50) | Lowest scores and what to do next |
|---|---|---|---|
| WebClaims | **7.6**: design 7.5 · usability 8 · creativity 7.5 · content 8 | **44**: question 5, evidence 5, hierarchy 4, readability 4, accessibility 4, trust 5, India-fit 4, consistency 4, states 5, delight 4 | 1. The ledger is long with 7 rows plus open evidence; consider a "Show only the 4 that differ" filter. 2. Type sizes run past the house limit of five (152, 88, 64, 36, 30, 22, 19 and smaller); fold 30 into 22 inside the confirm panel. 3. On phone the doc stacks above a long ledger, so a sticky mini-doc would keep the light-up visible. 4. At 240 px (app), the verdict tags are large relative to the flyer; consider 12 px tags inside the doc only |
| WaClaims | **7.4** | **42**: evidence 4 (sources sit on the card footer and in "See all claims", not under each row) | The reply buttons under the confirm message disappear after answering; real WhatsApp keeps them visible but spent. The card shows only the 4 differences, so the other 3 rows are one tap away |
| AppClaims | **7.6** | **43** | The first screen fits the summary, project row and annotated doc above the bottom bar, but the list starts below the fold. The share-sheet entry draws generic system UI (labelled illustrative); check it against Android 14/15 sharesheet spacing |
