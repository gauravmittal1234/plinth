# Design review: app-ai (Android)

**Screens:** AppScan, AppVoice, AppVisualiseCapture, AppVisualiseResult and AppYou
**Reviewer:** principal mobile product designer, app-ai group
**Date:** 18 Oct 2026
**Rules applied:** DESIGN.md §0 Taste Pass v1 first, then §2–§4c, §5 and §7. I also used taste-skill v2: the house rules and laws, the redesign audit, `critique.md`, `tells.md`, the mobile skill (Android-native premium mode, sections 13–15, 20–21 and 28–31) and the `motion.md` recipes, adapted to the artboard runtime. Material 3 conventions are kept where they help: 48 dp targets, the 64 dp nav bar, bottom sheets, filled text fields, switches and checkboxes.

Following DESIGN.md, I judged each screen by reading its code as if it were a screenshot. No taste-skill scripts were run and no browser was opened. For each file I checked that the HTML is well-formed and the `data-props` JSON parses, using Python. I also ran `renderVals()` in Node for Day and Night across the key states. Every state rendered without errors, and no template hole was left undefined.

The vocabulary matches the app-core pass (AppExplore, AppProject and AppRisk):
- the borderless risk chip;
- slab bars;
- filled tone pills, with the selected pill in inverse colours;
- square media, with "Illustrative image" as plain text;
- the "Developer says"-style tone field (`claimBg`) for status blocks;
- `nav` and `navInd` tokens on a tone step;
- the `pl-*` motion layer.

## How the screens are scored

The two scores work as in `app-core.md`.

- **Taste score, out of 10.** This uses the weighting in `critique.md`: design 40%, usability 30%, creativity 20% and content 10%. The caps apply. Any visible eyebrow, index number, decorative gradient, glow, shadow at rest or decorative hairline limits the overall score to **6.5**. For calibration, real Sites of the Day score about 7.5–8.
- **DESIGN §8 gate, out of 50.** Ten criteria, each scored 1–5. A screen ships at 40 or more, with no criterion below 3, and with evidence, accessibility and trust each at 4 or more.

## Summary

| Screen | Size | Taste before | Taste after | §8 before | §8 after | Signature live thing |
|---|---|---|---|---|---|---|
| AppScan | 390×844, unchanged | 6.5 (capped from 6.9) | **7.7** | 39 | **43** | Lock-on: the QR frame contracts and turns mint. The result sheet rises, and the Elevated meter fills one segment at a time |
| AppVoice | 390×844, unchanged | 6.5 (capped from 7.2) | **7.9** | 42 | **45** | The voice loop: live waveform and transcript, "thinking" shown as slabs filling, a streamed cited answer, then the evidence card with the needle sweep |
| AppVisualiseCapture | 390×844, unchanged | 6.5 (capped from 7.1) | **7.8** | 39 | **42** | The level line and guides tick off as the phone gets it right, until the chip turns mint: "Looks good. Hold still." |
| AppVisualiseResult | 390×844, unchanged | 6.5 (capped from 7.1) | **8.0** | 40 | **43** | The before/after wipe. It is now full-bleed and square, and peeks from the original to 50% on load |
| AppYou | 390×844, unchanged | 6.5 (capped from 7.0) | **7.8** (7.5 until `keysOnDeed` is generated) | 40 | **44** | "Who has my number?" A giant count of the parties who can reach you right now drops when you revoke one |

**New image request:** one, in `product/design/assets/requests_app-ai.json`. The slot is `keysOnDeed` (390×236): keys on a sale deed, for the designed close on the You tab.

## Changes shared by all five screens

1. **Motion layer.** Keyframes live in the helmet `<style>`, using the same names and timings as app-core:
   - `pl-rise` is the staggered entrance (22 px with opacity, 60–90 ms apart, once).
   - `pl-drift` is a 16 s, 1.04 scale drift. It is the moving picture on the camera feeds.
   - `pl-popA` and `pl-popB` alternate so that a pop restarts when the data changes.
   - `.pl-press:active { scale(.97) }` is on every button and key link.
   - The existing reduced-motion rule turns off all animation, and every animated element rests in its finished state.
   - Two new keyframes:
     - `pl-scan` moves the QR scan line with `transform` instead of animating `top` from a timer.
     - `pl-slab` gently pulses the slab that is currently filling.
2. **Layout properties no longer animate.**
   - The waveform bars use `scaleY`, not `height`.
   - The compare divider and handle use `translateX`, not `left`.
   - Progress bars use `scaleX`, not `width`.
   - The generating sweep uses `translateY`, not `top`.
   - Switch thumbs use `translate` and `scale`, not `left`, `width` and `height`.
3. **Glass and glow removed.**
   - All twelve `backdrop-filter` uses are gone: five in AppScan, five in AppVisualiseCapture and two in AppVisualiseResult.
   - The `glow` token and its radial gradients are deleted from AppVoice, AppVisualiseResult and AppYou.
   - Camera controls are solid `#111D19` circles. The camera chrome stays dark in both themes, as the brief allows.
4. **No hairlines or outlines.**
   - Removed from list rows, the dock, the nav, sheet action bars, suggestion cards, answer cards, style tiles and secondary buttons.
   - Secondary buttons are now filled tone pills (`t.track`).
   - Real form controls keep their conventions: the checkbox, the switch track, and the meter's empty segments, which encode data.
5. **Risk chip.** It is now borderless (band fill, mini meter, name) and exposes an `sr` label. It matches `chip()` in AppRisk.
6. **Accent discipline.**
   - Links are ink with an underline.
   - Accent stays on:
     - the one primary action in each state (Simulate match, Follow, the mic, Use photo, Share, Notify me);
     - data (the built bars and the base price);
     - control on-states on the You tab;
     - the nav indicator.
   - User chat bubbles, source chips, check icons, lock icons and "Matched from" lines all moved off accent.
7. **Media.**
   - Every image is square, the hero images run full-bleed, and all `src` values are kept.
   - "Illustrative image" is plain text: white on the dark camera chrome and scrims, `ink2` elsewhere. It is no longer a frosted pill.
   - The required AI labels stay as solid pills: "AI-generated preview" is black and "Original photo" is white. These are labels, not ornament.
8. **Type.** Each screen now has one very large size: 34–46 px on result screens and 40–88 px on tab roots, with tracking from −0.035 to −0.05em. There are about five sizes per screen, down from 7–10. Running text is in full ink at 15–19 px, and `muted` is kept for genuinely secondary notes.
9. **New tokens:**
   - `inverse` / `onInverse` for selected pills;
   - `slabOff` for empty slab tracks;
   - `claimBg` for status tone fields;
   - `nav` / `navBg` and `navInd`;
   - `segOn` for the selected segment in Night, replacing the 1 px outline hack;
   - `shadow`, used only on sheets.
10. **Sheet motion.** Sheets enter with `cubic-bezier(.22,1,.36,1)` and leave in 260 ms with the ease-in-out token. The `ease-in` exit is gone.

---

## AppScan: Camera identify

### Before: 6.5 (capped from 6.85) · §8 39/50

- **One second:** a viewfinder with a QR frame. The focal point is right, but seven floating things compete on the photo: the close button, title, torch, mode switch, privacy pill, status pill and "Illustrative image" pill.
- **Tells:**
  - five glass and blur controls;
  - camera media with rounded 28 px bottom corners, and a sheet image with 20 px corners;
  - outlined controls: the gallery button, the source chips (in accent), "Open project", "Scan again" and "Try Where am I?";
  - hairlines on every record row, every search result and the sheet action bar;
  - a risk chip with a 1 px border;
  - the eyebrow "No match found" above the no-match heading;
  - hairline rings and a dashed polygon in the "Where am I?" drawing.
  - Accent appeared in 7 places, including the "41%" figure and every source chip.
- **Type:** about 10 sizes, and no large one. The risk band was only a 28 px chip inside the sheet.
- **Motion:** the scan line animated `top` from a `setInterval`. There was no press feedback and no entrance, and sheets left with `ease-in`.
- **Scores:** design 6.0, usability 7.5, creativity 7.0, content 8.0, giving 6.85, capped to 6.5.
- **§8 (out of 5 each):** question 4, evidence 4, hierarchy 3, readability 4, accessibility 4, trust 5, India-fit 4, consistency 3, states 5, delight 3.

### What changed

1. **The viewfinder is the one dominant thing.**
   - It is square and full-bleed at 390×620 and carries the slow `pl-drift`, so the "live feed" breathes.
   - The QR frame moved up to 184–440. The mask stays (it is functional).
   - On reading, the frame does a **lock-on**: it contracts to 0.92 scale and the corners turn mint.
2. **The chrome went from seven floating elements to four, with no blur.**
   - The top bar holds a solid close button, then the title "Identify a project" at 21 px with "Illustrative image" under it, then a solid torch button.
   - The privacy promise is now plain white 15 px text with a lock icon at the top of the viewfinder. It still changes with the mode: camera, then location asked, then location used once.
   - The status line is plain white 17 px text under the frame, still announced through `aria-live`.
   - The mode switch moved down to sit just above the bottom panel, as a camera-mode row. The selected mode is a white pill and the other a solid dark pill.
3. **Bottom panel.**
   - The gallery button is a filled tone circle and "Simulate match" is the single accent.
   - "Can't scan? Search by name" is an ink link with an underline.
   - The prototype switch is unchanged.
4. **The result sheet, recomposed:**
   - a "Matched from the RERA QR" toolbar line in ink;
   - a full-bleed square image, 390×188, with a plain "Illustrative image" caption;
   - the project name at 34 px;
   - a **Risk header (M)**: a 5 × 16×12 meter and "Elevated" at 46 px in band ink. The meter segments pop in one at a time after the sheet lands. This is the signature move.
   - Then the confidence dots, the frequency sentence, and the verified RERA number on a tone field instead of accent-soft.
   - "What do the records show?" is 24 px. Its rows are separated by space, with 34 px ink figures and filled tone source pills that have 48 px targets.
   - The action bar sits on the `nav` tone step: "Open project" is tone-filled and Follow is the accent.
   - The content rises in a stagger each time the sheet opens. A style hole switches the animation off on close and back on at the next open.
5. **The no-match sheet.**
   - The eyebrow is gone, and the close button shares a row with the heading.
   - The DESIGN §4b copy is kept word for word but split: the heading "We couldn't match this." and the body "Search by name instead. The QR may be damaged…", so the heading stays within two lines.
   - The search field is a filled 56 px pill.
   - Results are separated by space, use borderless chips and rise in one by one. "Scan again" and "Try Where am I?" are tone-filled.
6. **"Where am I?" drawing.** The hairline rings are gone. The project footprint is a filled mint shape with a solid 2 px edge, with a "you are here" dot inside it. The heading is 28 px, and the heading and body rise in.

### After: 7.7 · §8 43/50

- **One second:** a hoarding through a scanner frame, with one action under it.
- **Layout by state:** scan = full-bleed viewfinder over a control panel; result = sheet with media, statement, instrument and list; no match = sheet with field and list.
- **Scores:** design 7.6, usability 8.0, creativity 7.5, content 8.0. No caps apply.
- **§8:** question 4, evidence 5, hierarchy 4, readability 4, accessibility 4, trust 5, India-fit 4, consistency 4, states 5, delight 4.

### Remaining issues

- "Simulate match" and the "next scan finds no match" switch are prototype levers inside the product UI. In production, detection is automatic and the bottom primary action becomes "Enter RERA number".
- "Where am I?" is still a drawing. A real map tile of Sector 37D with the HARERA boundary would be truer. That needs map data, not a generated image.
- The result sheet has no "Developer says" field. If Northfield has replied on the project, the sheet should show it.
- The live camera is a single still image. On a device, the drift must give way to the real feed.

### 10x ideas

| Idea | Why it's 10x for a Gurugram buyer | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **Slab count: the camera checks the QPR.** Point at a tower under construction. Plinth counts the cast slabs it can see and sets them against the latest filing: "You can see about 13–15 cast slabs on Tower B. The Apr–Jun 2026 QPR says 18 floors cast." | On a Sunday site visit to Sector 37D, a buyer can check the developer's own filing against the concrete. No portal can do that, and it makes the plinth idea physical: the filing's floors next to the real ones. | GPS, compass and the HARERA site plan say which tower you are facing. An on-device segmentation model finds horizontal slab edges and formwork, and the result is a range with a confidence level. The observation is saved to your timeline. Sharing a photo is opt-in, with faces and number plates blurred on the device. | L | Accuracy (podium levels, occlusion, steep angles) and defamation. Copy must say "you can see about", show the range, and never call the filing wrong. Low-confidence counts are not shown. |
| **Cost-sheet and allotment-letter scanner.** Photograph the cost sheet or the builder-buyer agreement the sales team hands you. Plinth reads every line and flags what does not match the records: "PLC ₹4.5 L is not in the price list registered with HARERA", "Delay compensation clause: 5% a year; the RERA model agreement uses SBI MCLR + 2%." | It catches the money and the clauses on the day you sign. Gurugram buyers routinely find these charges after the booking cheque has cleared. | On-device OCR, then an LLM extracts line items into the existing all-in cost model. Clauses are matched against the Haryana RERA model agreement. Each flag cites a page and line, and the document never leaves the phone unless you send it. | M | Accuracy and legal advice. Show "differs from the model agreement", never "illegal". Offer the human team or a lawyer handoff. Sensitive documents stay on the device by default. |
| **Buyers' progress ledger.** Every opt-in scan at a site adds a dated, geo-verified photo to a per-tower timeline that sits next to the QPR timeline: "9 buyer photos in Sep 2026 · latest 14 Sep". | Between quarterly filings, buyers are blind for 90 days. A crowd of buyers becomes a monthly, independent progress record that no developer controls. | Photos are verified for location (inside the RERA footprint) and time, and de-duplicated by perceptual hash. People and vehicles are blurred on the device. Moderation runs before anything is published, and a developer can reply on the same timeline. | M–L | Manipulation by staged or old photos, privacy, and developer pushback. Never infer progress from the crowd alone. It sits beside the QPR, labelled "buyer photos", and is never used in the band. |
| **"Identify" as a Quick Settings tile.** One swipe from the lock screen opens the scanner straight in QR mode, so a hoarding can be scanned from a moving auto in two seconds. | Hoardings pass in seconds on the expressway. Removing the unlock-and-find step is the difference between using the feature and not. | An Android `TileService` that opens this screen. The scan works without login, and the result offers Follow after unlock. | S | Low. Nothing is stored before the unlock. |

---

## AppVoice: Home Advisor (Ask tab)

### Before: 6.5 (capped from 7.15) · §8 42/50

- **One second:** a headline, three outlined cards and a large mic dock. The dock is right; the rest is the chat-app default.
- **Tells:**
  - a radial glow behind the header;
  - three identical outlined suggestion cards;
  - outlined answer cards (risk, cost and compare) with hairlines inside;
  - **numbered badges "1", "2"** on the reasons in the risk card;
  - outlined "Show sources", follow-up, handoff, keyboard and speaker buttons;
  - hairlines under the source rows, on the dock and on the nav.
  - Accent was on the user bubble, the cite chips, the sparkle icons, the links, the checks, the waveform, the mic and the nav.
  - A generic circular spinner, and waveform bars that animated `height`.
- **Type:** 9 sizes, the largest 34 px.
- **Strength:** the most alive screen in the group. The states (idle, listening, thinking, answering and silent), the Hinglish support, the cited answers and the human handoff are excellent.
- **Scores:** design 6.0, usability 8.0, creativity 7.5, content 8.5, giving 7.15, capped to 6.5.
- **§8:** question 4, evidence 5, hierarchy 3, readability 4, accessibility 4, trust 5, India-fit 5, consistency 3, states 5, delight 4.

### What changed

1. **Welcome.**
   - "What do you want to know?" is set at 40 px, −0.045em, two lines. It is the screen's one very large size, and it rises in with the supporting line.
   - The three suggestions are **one grouped tone list** (`t.track`, radius 8) with 48 px rows, not three cards.
   - The AI disclosure is a tone field in full ink.
   - To fit the disclosure, welcome and suggestions in one view, the conversation area grew from 488 to 508 px and the dock shrank from 196 to 176 px.
2. **Conversation.**
   - The user bubble is ink with white text, so it reads as "you" without accent.
   - Thinking is shown as a **stack of three slabs** that fill as each records step completes, with the active slab pulsing. It replaces the spinner and carries the plinth idea into the AI's work.
   - The answer is set at 19 px. The disclosure "AI answer · checked against our records before showing" moved below the text as a quiet line, so it no longer reads as an eyebrow.
   - Cite chips are filled tone pills.
3. **Evidence cards.**
   - Tone fields replace outlined cards, and a 64 px square `heroAurelia` thumbnail is added to the risk and cost cards (existing image, with an "Illustrative image" caption).
   - Band and price are both 34 px.
   - Reasons drop the number badges and use the house sentence form: "**Finances:** 72% of units sold, 41% built." and "**Legal:** 14 complaints…".
   - The cost bar and legend use accent, ink, muted and line-strong. The values are labelled, so colour is not the only cue. The "17% more than quoted" line is no longer behind a hairline.
   - The compare rows are separated by space, with borderless chips and slab-style bars on `slabOff`.
   - Links are ink with an underline. The cards rise in when the answer finishes.
4. **After the answer.**
   - "Show sources" and the follow-up chips are filled tone pills.
   - Source rows rise in one by one, with no hairlines.
   - A selected thumbs-up or thumbs-down is inverse.
   - "Report a wrong fact" is ink with an underline.
   - The handoff block is a `claimBg` tone field.
5. **Dock and nav.**
   - The dock has no top rule.
   - The keyboard and speaker buttons are filled tone circles, and the mic is the only accent.
   - Waveform bars use `scaleY`.
   - The typing field is a filled pill.
   - The nav sits on the `nav` tone step with an ink-on-`navInd` indicator.

### After: 7.9 · §8 45/50

- **One second:** one big question, a mic, and a quiet list of things to say.
- **Layout by state:** welcome = statement and grouped list; listening = bubble and waveform; thinking = slab checklist; answer = streamed paragraph, then one instrument card, then actions.
- **Scores:** design 7.6, usability 8.2, creativity 7.8, content 8.5. No caps apply.
- **§8:** question 4, evidence 5, hierarchy 4, readability 5, accessibility 4, trust 5, India-fit 5, consistency 4, states 5, delight 4.

### Remaining issues

- The title "Home Advisor" and the nav label "Ask" still disagree. Pick one name; "Ask Plinth" would match the tab.
- The sparkle glyph still marks AI in two places. A plain waveform or speech glyph would be less generic.
- There is no offline or "couldn't reach HARERA" state, and no state for "I don't know that project yet".
- The welcome screen exactly fills 508 px. A longer disclosure in Hindi would scroll the top off. Test with real strings.

### 10x ideas

| Idea | Why it's 10x for a Gurugram buyer | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **Sales-gallery copilot.** In the sales meeting, the buyer switches on "Pitch check". As the salesperson makes claims ("possession by Dec 2026", "only 4 units left", "all-inclusive ₹2.35 Cr"), Plinth checks each one quietly on the phone or in one earbud: "RERA date is Dec 2027. Price list shows 41 unsold 3 BHKs." It ends with a one-page summary of the claims made against the records. | The sales gallery is where Gurugram buyers commit, often with a same-day booking cheque. That is the moment the information gap is widest, and Plinth closes it in the room. | Two modes. In *notes mode*, the buyer murmurs or types the claim. In *listen mode*, on-device speech-to-text runs with a visible recording state, and claims are extracted by a small on-device model and checked against the cited-answer pipeline. Audio is never stored, only the claims as text. | L | Consent and law. Listening to others needs care: default to notes mode, show "Recording only while the mic is on", and advise telling the salesperson. Real-time misfires are also a risk, so every check shows its source and is phrased "records show". |
| **Rehearse the negotiation.** "Practise with Plinth": a voice role-play in which Plinth plays the sales manager using this project's real numbers. It pushes back, offers a "festive discount", insists on the PLC, and then debriefs: "You gave up the parking ask too early. Records show 72% sold, so they have less room than they claim." | Most first-time buyers negotiate a ₹2 Cr purchase once in their life, unprepared. Ten minutes of practice is worth lakhs. | An LLM persona constrained to the project's records and the cost model. The buyer's own budget comes from on-device memory. After the debrief comes a checklist of asks: PLC waiver, parking, floor-rise and payment plan. | M | It could read as advice or as coaching to mislead. Keep it to arithmetic and records, never say "you'll get X off", and disclose that it is a simulation. |
| **What changed overnight, read aloud.** An opt-in 30-second spoken brief, on a morning notification or Android Auto on the commute: "Aurelia Heights filed its Jul–Sep QPR last night: 46% built, up from 41%. Band unchanged. Kestrel Park: no change." | Buyers follow 3–6 projects for months, and the change, not the snapshot, is what matters. A spoken brief fits the Gurugram commute. | The HARERA sync diff goes through the cited-answer template, then text-to-speech (English, Hinglish or Hindi). The notification carries the text, and Android Auto gets a media session. | S–M | Notification fatigue. It is weekly by default, sends nothing when nothing changed, and has a one-tap mute. |
| **Ask about anything on your screen.** From any app (a portal listing, a broker's PDF, a YouTube walkthrough), share the content or long-press "Ask Plinth": "Is this the Aurelia tower? Is that price all-in?" The answer is anchored to the content being shown. | Buyers' research is spread across ten apps. Plinth becomes the second opinion over all of them without copy-pasting. | Android share-intent and screen-context capture, opt-in each time. On-device OCR and a multimodal model match the content to the project index, then the cited-answer pipeline answers. | M | Privacy, because other apps' content is visible. Process it only on an explicit share and keep nothing after the answer. Wrong project matching is also a risk, so ask "Is this Aurelia Heights, Phase 2?" before answering. |

---

## AppVisualiseCapture: Picture it furnished, capture

### Before: 6.5 (capped from 7.1) · §8 39/50

- **One second:** an empty room under a stack of frosted chips and a frosted checklist.
- **Tells:**
  - five glass and blur elements: close, the structure promise, the check chip, the review chip and the guides panel;
  - a **"Beta" outlined pill badge** beside the title;
  - a rule-of-thirds grid drawn as four 1 px hairlines;
  - media with rounded 28 px bottom corners;
  - **"Step 1 of 3 · What room is this?"**, which is index numbering;
  - outlined room chips with an accent selected state;
  - outlined gallery, lens and Retake buttons;
  - a progress bar that animated `width`.
- **Strength:** excellent capture guidance. The live level line, the floor-and-window checks, the honest review checks ("The phone was tilted. Lines may look bent.") and "Photos stay on this phone".
- **Scores:** design 6.0, usability 8.0, creativity 7.5, content 8.0, giving 7.1, capped to 6.5.
- **§8:** question 4, evidence 3, hierarchy 3, readability 4, accessibility 4, trust 5, India-fit 4, consistency 3, states 5, delight 4.

### What changed

1. **The viewfinder.**
   - It is square and full-bleed at 390×576, with `pl-drift` on the feed.
   - The neutral scrims are stronger (0.70 at the top, 0.78 at the bottom) so that plain white text reads without any panel.
   - The thirds grid is removed: the level line and the guides already do that job.
2. **The chrome, all solid or plain.**
   - The top bar holds a solid close button, then "Picture it furnished" with **"Beta · Illustrative image"** as a quiet line under it. The badge is gone.
   - "We never move walls, windows or floors." is plain white 16 px text with a lock icon.
   - The live check chip is solid dark, then turns mint at "Looks good. Hold still." It is the signature moment.
   - The guides are a plain white list over the bottom scrim, at 16 px. Each check pops in as it is met.
3. **Capture panel.**
   - A real heading, "What room is this?" (24 px), sits beside a **three-slab progress mark** read as "Step 1 of 3" by screen readers. Order is shown by position, not numerals.
   - Room chips are filled tone pills, with the selected one in inverse.
   - The gallery and lens buttons are filled tone circles, with the lens button inverse when wide is on.
   - The shutter's inner disc is the one accent.
4. **Review and sending.**
   - "Use this photo?" is 32 px and rises in. The checks use ink icons and 16 px text.
   - Retake is tone-filled and Use photo is the accent, with the primary on the right in a 1 : 1.4 split.
   - The sending title is 30 px.
   - The progress bar is a slab bar filled by `scaleX`.
   - "Only this photo is sent…" is in full ink.

### After: 7.8 · §8 42/50

- **One second:** an empty room, a level line and a shutter.
- **Layout by state:** live = full-bleed viewfinder with plain overlays, then a control panel; review = heading, checks and a two-button bar; sending = heading, slab bar and actions.
- **Scores:** design 7.5, usability 8.2, creativity 7.5, content 8.0. No caps apply.
- **§8:** question 4, evidence 4, hierarchy 4, readability 4, accessibility 4, trust 5, India-fit 4, consistency 4, states 5, delight 4.

### Remaining issues

- The guides list and the check chip say similar things. In production, merge them: the chip announces the next unmet guide.
- Room chips scroll sideways: about three and a half of the five show at 390 px. The cut-off chip signals the scroll, but consider wrapping, or naming the room after capture.
- The camera feed is a still image, so tilt is simulated by a timer. Test on a device with the real gyroscope.

### 10x ideas

| Idea | Why it's 10x for a Gurugram buyer | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **Measure while you shoot.** The same capture measures the room: "This living room is about 11.6 × 15.1 ft. The 3 BHK plan filed with HARERA says 12 × 16 ft." The total runs across all rooms against the 1,450 sq ft carpet area. | Carpet against super area (38% loading on Aurelia) is the biggest money issue in Gurugram, and sample flats are often not built to the plan. The camera turns the sample-flat visit into a check. | The ARCore Depth API and plane detection measure wall-to-wall at floor level, shown as a range. Room dimensions are extracted from the RERA plan PDF. At possession, the same flow measures the real unit. | M–L | Accuracy (±3–5%, more with furniture in the way). Label it "about", never a certificate. Sample flats may differ legitimately, so the copy compares and does not accuse. |
| **Sun and heat through the window.** Point at a window; an AR sun path shows where the sun will be through the year: "This window faces west-south-west. Direct sun from 2 to 6 pm in May." | Orientation decides comfort and power bills in a 45 °C Gurugram summer, and no brochure states it honestly. | Compass heading plus GPS give the solar position by month and hour, drawn as an AR arc. The buyer confirms their unit's facing, because the sample flat may face another way. | M | Compass error indoors near steel. Calibrate, show it as approximate, and let the buyer correct the facing. |
| **Bring your own furniture.** Photograph your current sofa, dining table or almirah at home. Plinth measures each piece and places your actual furniture, at scale, into the captured room and the RERA plan: "Your 3-seater (84 in) fits the long wall with 26 in to spare. The almirah won't clear the bedroom door." | Indian families move with heavy furniture, and "will our things fit?" is a real, unanswered question. | ARCore measures the bounding box of each piece, which is saved to the on-device profile. The furnished-preview model gets fixed-size objects as constraints, and a 2D fit check runs on the plan. | M–L | Scale accuracy. Photos of your home stay on the device by default. |
| **Sound and air snapshot.** While capturing, record 10 seconds of ambient noise as a dB level only (no audio kept), and pull the nearest CPCB air-quality reading: "Living room, windows open, 4 pm: about 58 dB. Nearest AQI station: Sector 51, 182 today." | Noise from the expressway and Gurugram's air quality are daily life, yet invisible at a sample-flat visit. | Microphone RMS turned into an approximate dB level, plus the public CPCB API. Results are stored per visit so mornings and evenings can be compared. | S–M | One reading is not representative, and phone mics vary. Present it as a snapshot with a time stamp, never as a rating. |

---

## AppVisualiseResult: Picture it furnished, result

### Before: 6.5 (capped from 7.1) · §8 40/50

- **One second:** a rounded photo inset 16 px, with three pills on it and a glow behind.
- **Tells:**
  - a radial glow;
  - media with 24 px corners, and share thumbnails with 16 px corners;
  - two frosted status pills;
  - three identical **outlined style tiles** with an accent-soft selected state;
  - outlined Save, Cancel, "More apps" and Done buttons;
  - hairline rows in the "How was this made?" sheet;
  - accent on the lock icons, the checks, "Report a problem", the selected tile, Notify and the spinners;
  - a generic spinner;
  - a sweep line animating `top`, and progress bars animating `width`.
- **Strength:** the right signature. A before/after compare that peeks to 50% on load, with structure locked, content credentials and the original always attached.
- **Scores:** design 6.2, usability 7.8, creativity 7.5, content 8.0, giving 7.12, capped to 6.5.
- **§8:** question 3, evidence 4, hierarchy 4, readability 4, accessibility 4, trust 5, India-fit 4, consistency 3, states 5, delight 4.

### What changed

1. **The compare is the hero.**
   - It is full-bleed, square and 390×400.
   - The divider and handle move with `translateX` on the in-out token, so the 50% peek reads as a deliberate wipe.
   - The labels "Original photo" (white) and "AI-generated preview" (black) are solid pills.
   - "Illustrative image" is plain white text on a neutral bottom scrim.
   - The generating overlay uses a solid status pill with a **three-slab stage mark** (mint on dark), the same device as Voice's thinking.
   - "Restyling · walls and windows stay locked" carries a lock icon and rises in.
2. **Controls.**
   - The view segmented control uses `segOn`, which fixes the Night outline hack.
   - The lock line is in full ink.
   - The style tiles are filled tone fields (radius 8). The selected tile is inverse, with the budget in `onInverse`.
   - Save is tone-filled and Share is the accent.
3. **Generating panel.**
   - "Furnishing your room" is 30 px.
   - The slab progress bar fills by `scaleX`.
   - The current stage is a pulsing ink dot instead of a spinner.
   - "Notify me when ready" is the accent, and inverse once set. Cancel is tone-filled.
4. **Sheets.**
   - Share: the thumbnails are square and full-bleed in the sheet (150 px), the caption is a radius-8 tone field, "More apps" is tone-filled and "Share on WhatsApp" is the accent.
   - About: rows are separated by space, with ink checks and 16 px body in full ink. Done is tone-filled.
   - Both headings are 28 px.
5. "Report a problem" is ink with an underline. The toast radius is 8.

### After: 8.0 · §8 43/50

- **One second:** the same room, half empty and half furnished.
- **Layout by state:** result = full-bleed instrument, then a segmented control, a choice row and a two-button bar; generating = instrument with an overlay, then a heading, slab bar and checklist; sheets = media pair, promise and caption.
- **Scores:** design 7.8, usability 8.2, creativity 8.0, content 8.5. No caps apply.
- **§8:** question 3, evidence 4, hierarchy 5, readability 4, accessibility 4, trust 5, India-fit 4, consistency 4, states 5, delight 5.

### Remaining issues

- The header "Living room, furnished" is a label, not a buyer question. "Will our life fit here?" or "How could this room look?" would follow §2. Question clarity stays at 3 until the founder picks the line.
- The style tiles are still three equal boxes. That is acceptable as a choice control, but a horizontal row of square style thumbnails (the three generated images at 96 px) would be more visual.
- The "Prototype: show generating" switch is a design-review lever in the product UI.
- The budget ranges (₹5–14 L) have no source line. Add "Based on 2026 Gurugram retail prices · v1".

### 10x ideas

| Idea | Why it's 10x for a Gurugram buyer | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **Possession-day diff.** At possession, the app guides you back to the exact spot of your sample-flat photo, matching the saved image's features and pose. It then compares the delivered flat with the sample flat and the HARERA plan: "Window 1 is about 20% narrower. Flooring differs (vitrified, not wood laminate). False ceiling missing." The result becomes a snag list for the possession letter. | Possession snagging is painful and usually unprepared. The evidence trail now starts the day you saw the sample flat, two years earlier. | Visual relocalisation from the saved capture, then a structural comparison with segmentation and depth, plus a check against plan dimensions. The output is a dated PDF snag list with paired photos. | M–L | Accuracy, and its use as evidence. It is a checklist, not an inspection certificate. Wording is neutral ("differs from"), and the developer can reply. |
| **Furnishing joins the all-in.** One tap adds the chosen style's budget to the project's all-in and EMI: "With Modern Indian furnishing (about ₹10 L), your all-in is about ₹2.84 Cr and the EMI is ₹1.96 L at 8.5%." | Furnishing is the cost buyers forget when they stretch for a bigger flat. It belongs inside the "What will I really pay?" maths. | The style budget feeds the existing cost and EMI models, and the result is saved to the shortlist. Item ranges come from a disclosed retail price panel. No affiliate links in v1. | S–M | Commercial bias if affiliate links come later. Disclose any partner, keep "items are illustrative", and keep ranges, never quotes. |
| **Walk in it, at scale.** Turn the furnished preview into a short parallax walk-through, or place it as an AR room in your current home, to feel the size of the 1,450 sq ft carpet area against where you live now. | Buyers in rented 2 BHKs cannot judge a 3 BHK from photos. Standing inside it at true scale is a new kind of proof. | Depth from the capture plus a generated 3D scene (Gaussian splat or depth-warped layers), labelled "AI-generated" on every frame. AR placement uses the measured room dimensions. | L | Invented geometry. The structure must stay locked to the capture, with the "AI-generated" label and the original always one tap away. Compute cost is high. |
| **Orientation facts layer (opt-in).** Show each room's compass facing on the preview and the plan: "Entrance faces north-east · Kitchen faces south-east · Main bedroom faces south-west". | Many Gurugram families weigh vastu heavily, and brokers answer it loosely. Plinth can state the fact without the belief. | Compass at capture plus the plan's north arrow, cross-checked. A simple overlay with no scoring and no "good/bad". | S–M | Seen as endorsing a belief system. Keep it opt-in, factual, and never use it in any rating. |

---

## AppYou: You tab

### Before: 6.5 (capped from 6.95) · §8 40/50

- **One second:** a 36 px "You", a generic avatar circle, and then a long settings list cut by hairlines.
- **Tells:**
  - a radial glow;
  - a generic person-icon avatar circle;
  - an accent-soft "Masked number" pill;
  - hairlines between every party, link, checkbox and switch row, and between the money links (line-strong);
  - an outlined "deletion requested" card (radius 18);
  - outlined Revoke and sheet buttons;
  - a nav rule;
  - the Night segment drawn with a 1 px outline;
  - switch thumbs animating `left`, `width` and `height`.
- **Order:** the order buried the point. "How should Plinth look?" came before "Who has my number?", which is the trust feature §2.5 requires.
- **Strength:** the content is exemplary: masked number, contact quota, revoke flow, unticked consents, grievance SLA, and "No developer pays us. Ever."
- **Scores:** design 6.0, usability 8.0, creativity 6.5, content 8.5, giving 6.95, capped to 6.5.
- **§8:** question 4, evidence 4, hierarchy 3, readability 4, accessibility 4, trust 5, India-fit 5, consistency 3, states 5, delight 3.

### What changed

1. **The order now leads with privacy:**
   - You;
   - **Who has my number?**;
   - What have I agreed to?;
   - How should we tell you?;
   - How should Plinth look?;
   - Account;
   - then a designed close.
2. **The signature is a live count.** Under "Who has my number?" sits a giant **88 px count of the parties who can reach you right now** ("2 parties can contact you right now.").
   - Revoking one makes it drop to 1 with a pop (`pl-popA` and `pl-popB` alternate).
   - The sentence is announced through `aria-live`.
   - At zero: "Nobody can contact you right now."
   - The quota line "2 of 3 contacts used in the last 30 days" stays, drawn as three slabs.
3. **Identity.**
   - The avatar is gone, and "You" is 40 px.
   - The masked number is 22 px, with a tone "Masked number" pill.
   - "Verified 2 Oct 2026" is folded into the sentence.
4. **Lists without rules.**
   - Party rows are separated by 20 px, with tone-filled Revoke buttons and "Revoked today" rising in.
   - "Consent history" and "Download my data" form one grouped tone list.
   - The checkboxes and switches keep their form-control edges. Their on-state is the accent, and thumbs move with `transform`.
   - All section questions are 28 px.
   - The theme control uses `segOn`.
5. **The designed close.** It sits on a full-bleed `t.track` band:
   - a new square picture, `keysOnDeed` (390×236, an empty slot plus a request);
   - "Plinth" at 120 px;
   - "No developer pays us. Ever." at 28 px;
   - the paragraph in full ink;
   - three ink links with underlines and no rules;
   - the disclaimer.
   - This matches the AppRisk footer, so the promise ends every long screen.
6. **Status and sheets.**
   - "Deletion requested" is a `claimBg` tone field with an ink link.
   - The sheets have tone-filled "Keep" buttons, keep the ink-filled destructive buttons, and use 26 px headings.
   - The nav sits on the tone step with no rule.

### After: 7.8 (7.5 until `keysOnDeed` is generated) · §8 44/50

- **One second:** a big "2" and the question "Who has my number?"
- **Layout by section:** identity = statement; who = big figure, slab quota and list; agreed = checkboxes; tell = switches; look = segmented control; account = single row; close = full-bleed picture, wordmark and promise.
- **Scores:** design 7.6, usability 8.2, creativity 7.5, content 8.5. The empty `keysOnDeed` slot caps content at 5 until it is generated, which gives 7.5.
- **§8:** question 4, evidence 4, hierarchy 4, readability 5, accessibility 4, trust 5, India-fit 5, consistency 4, states 5, delight 4.

### Remaining issues

- The 88 px count and the 120 px wordmark are two very large moments on one scrolling screen. They are far apart (first screen and last), but watch it.
- The theme control here and the theme toggle on the Explore hero (noted in app-core) duplicate each other. This one should be the only one.
- "Download my data" and "Consent history" have no destination designs yet.
- The artboard is 390×844 with internal scroll, so the close band is only visible by scrolling. A 390×2000 scrolling capture would show the whole composition on the canvas, but that needs a `canvas.json` change by the lead.

### 10x ideas

| Idea | Why it's 10x for a Gurugram buyer | How it works | Feasibility | Main risk |
|---|---|---|---|---|
| **A number per party, killable.** Every party you share with (a site office, a loan adviser) gets its own relay number that forwards to you. "Who has my number?" shows real activity: "Orbis Land site office · 3 calls · last 16 Oct". Revoke kills that relay instantly, and every relay auto-expires after 30 days. | One portal enquiry in Gurugram brings 30–40 broker calls for months. This makes Plinth the only safe way to enquire, a reason to stay that no portal funded by developers can copy. | Cloud telephony relay numbers, with masked WhatsApp via the Business API relay. The quota of 3 parties in 30 days is enforced at the relay. | M | Cost per number, telecom rules (TRAI/DLT registration for business calls), and relay abuse. Rate-limit calls and log abuse reports. |
| **Leak detector.** When someone you never shared with calls about property, tap "I didn't share with them" on the call screen. Plinth checks whether that number links to a party you did share with, and publishes aggregated leak counts per partner: "2 leak reports in 90 days". | It turns the "who has my number" view from a promise into enforcement, and makes data leaks cost the leaker. | The Android call-screening API gives an in-call action. Reports are matched against partner number registries, and only counts past a threshold of reports are published. | M | False attribution and defamation. Publish only counts across many reports, let partners reply, and never name an individual. |
| **Withdraw everywhere (DPDP).** One tap sends a withdrawal and deletion request, under India's DPDP Act 2023, to every party that holds your data through Plinth. Each one's acknowledgement is tracked against the 24 h / 7 day clock, shown as slabs filling. | Today, getting a developer's CRM to forget you is impossible. A visible, timed withdrawal is a new kind of buyer power. | A consent ledger (already implied by "Consent history"), partner APIs or email workflows, and grievance-officer escalation when a clock runs out. | M | Partner compliance and legal precision. Say "requested" and "acknowledged", never "deleted", until a partner confirms. |
| **Your buying brief stays on the phone.** Budget, loan pre-approval, must-haves and family decision-makers, kept encrypted on the device. The AI uses it locally: "Within your ₹2.5 Cr all-in, Kestrel Park fits and Aurelia Heights doesn't." Nothing leaves the phone unless you share a brief. | Personal answers with no data shared, the opposite of every portal's lead form. | An on-device store, with on-device personalisation in a small local model, or brief facts injected into the prompt only on the device. An "Export my brief" card can be shared with family. | M | On-device model limits, and unclear boundaries. Every answer that uses the brief says "using your brief (on this phone)". |
| **A "Who can reach me" widget.** A 2×1 home-screen widget shows "1 party can reach you · 0 leak reports". Tapping it opens this section. | Trust you can see every day. It is the masked number made into a habit. | Jetpack Glance, refreshed on relay events. | S | Low. Show only counts on the home screen, never names. |
