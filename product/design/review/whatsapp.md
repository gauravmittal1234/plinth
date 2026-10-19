# Design review: WhatsApp group

**Screens:** WaRisk, WaCost and WaAlerts
**Reviewer:** principal conversation and mobile designer, WhatsApp group
**Date:** 18 Oct 2026
**Rules applied:** DESIGN.md §0 Taste Pass v1 first, then §2–§4c, §5 (fictional data only) and §7. From taste-skill v2 I used the house rules and laws, the redesign audit, `critique.md` and `tells.md`. WhatsApp platform limits were checked on every control (see the audit table at the end).

Following DESIGN.md, I judged each screen by reading its code as if it were a screenshot. No taste-skill scripts were run and no browser was opened. The chat chrome (header, ticks, list sheet, Flow components) is a neutral, generic frame and was left alone where it stands for WhatsApp's own UI. The house rules were applied to what we author: the **images we send** and the words in our bubbles.

## How the screens are scored

Each screen gets two scores, as in the app-core review:

- **Taste score, out of 10.** Weighted as in `critique.md`: design 40%, usability 30%, creativity 20% and content 10%. The caps apply. Any visible outlined box, decorative hairline, dashed guide or index numbering caps the overall score at **6.5**. An idea that would also work for the nearest competitor caps creativity at **7**.
- **DESIGN §8 gate, out of 50.** Ten criteria, each scored 1–5. A screen ships at 40 or more, with no criterion below 3, and with evidence, accessibility and trust each at 4 or more.

## Summary

| Screen | Size (before → after) | Taste before | Taste after | §8 before | §8 after | Signature live thing |
|---|---|---|---|---|---|---|
| WaRisk | 390×1400, unchanged | 6.5 (capped from 6.65) | **7.8** | 35 | **43** | The risk card: the `band` lever redraws the poster; the reply turns rise in as messages |
| WaCost | 390×1300 → **390×1400** | 6.5 (capped from 6.6) | **7.9** | 36 | **44** | Replay reading: the sheet is read page by page, then the ₹2.74 Cr card arrives |
| WaAlerts | 1400×920 → **1400×980** | 6.5 (capped from 6.65) | **7.6** | 39 | **44** | The band steps: the alert image's meter fills from Moderate to Elevated |

## The idea, and the card system shared by all three screens

**The idea:** *every image Plinth sends is a small plinth. The building (or the number) stands on a footer of evidence and the promise, so the picture can't travel without its proof.* In a family group, a forwarded image reaches people who never saw the chat and never saw the caption. Whatever must stay true therefore has to live *inside the pixels*: which project, the answer, one sentence of evidence, the date, the QR to the live version, and "No developer pays us. Ever."

**The format:** 1080×1350 PNG (4:5, the largest portrait ratio WhatsApp shows uncropped in the bubble). It is drawn at 288×360 in the artboards. There are three members of the family:

| Image | Drawn at | Masthead | Dominant element | Footer |
|---|---|---|---|---|
| Risk card (WaRisk) | 288×360 | Aurelia photo, with the name and RERA number on a neutral scrim | Band name at 52 px in band ink, above a full-width 5-segment meter | Same signature |
| Cost card (WaCost) | 288×360 | Project and unit type in type (no photo; the number is the picture) | ₹2.74 Cr at 56 px, above a stepped waterfall | Same signature |
| Visit pass (WaAlerts) | 262×346 | Aurelia photo, with the site office address | The visit date at 40 px, then the code 4821 | Same signature |
| Alert header (WaAlerts) | 282×148 (≈1.91:1, template header ratio) | Project and wordmark | "Elevated" at 44 px on a full field of the band's own fill | No promise line (Meta utility rules; see WaAlerts) |

**The signature footer**, identical on every card: the Plinth wordmark, then "No developer pays us. Ever.", then a date ("Data as of 14 Oct 2026 · v1.2", "Cost sheet of 18 Oct 2026", "Booked 18 Oct 2026"), then a disclaimer. On the right is a 56 px QR with a two-word label ("Live card", "Live costs", "Visit code"). This is the §0 "designed close", scaled down to a card.

**House rules on the cards:**
- No outlines, hairlines or dashed lines. The 1 px card border, the footer rule and the dashed waterfall connectors are gone.
- No gradients, except a neutral scrim under text on a photo, which §0 allows.
- Media is square and full-bleed to the card edge. WhatsApp rounds the bubble; the PNG itself is square.
- Three visible type sizes per card: 52–56, 15 and 13.
- The accent is spent once, on the wordmark mark. "Check the live version" is no longer green text.
- The meter keeps a grey edge on its *empty* segments only, because §3.2 makes that non-colour cue mandatory. It is the one line left on the cards, and it encodes data.

**Shared chat changes:**
- **Selected reply buttons** are a tone step (`pressed`, which is accentSoft) with no inset 1.5 px outline. WhatsApp itself shows no outline, and the outline was the one ring on the screen.
- **Motion layer.** It lives in the helmet `<style>`, as §0 allows:
  - `pl-rise` brings new messages in, rising 18 px with opacity once. The bot's reply follows the user's reply by 90 ms.
  - `.pl-press` scales every button and CTA link to 0.97 on press.
  - `pl-step` fills the alert meter.
  - `pl-sheet` brings up the WaCost list sheet.
  - A `prefers-reduced-motion` rule turns all of it off. Every animated element rests at its finished state.
- **A visible focus ring** (`:focus-visible`, 2 px) on every control.
- **Photos.** The cards use the existing `heroAurelia` image (`/_blob/c3b52e41d6da32356184bfa8fddea9b4`) with `object-fit: cover`. The risk card crops it to the lit façades and the visit pass to the entrance court. No new image requests.

---

## WaRisk

### Before: 6.5 (capped from 6.65) · §8 35/50

```
ROUND 0 (before)
Seen in one second: a white slip with a thumbnail-sized half-dial and a lot of 13 px grey text.
Idea (one sentence): none of its own; the web riskometer, shrunk.
Live thing: the reply buttons switch the turn; the band lever.
Layout words: card = stacked slip (logo row / title / dial + band / sentence / ruled footer).
Scores: design 6.0 · usability 7.5 · creativity 6.0 · content 8.0 → 6.65.
Caps applied: a 1 px outlined box around the card and a hairline rule above its footer → 6.5.
```

**Top three problems:**
1. **Nothing dominates.** The dial is 112×64 px and the band name is 26 px. The project name (19 px), the RERA number (13 px), the question (13 px grey), the sentence (14 px) and the footer (13 px) all sit in the same mid-grey band of sizes. Shrunk to a WhatsApp thumbnail on a parent's phone, it reads as "some form".
2. **The promise is not on the image.** "No developer pays us. Ever." lives in the caption. The caption is lost when the image is saved, screenshotted or re-shared from the gallery, which is how cards travel in family groups.
3. **There is no place in it.** A family sees a data slip, not *that building*. There is no photo. The only colour is the dial, and the accent is spent on the "Check the live version" text, which is not an action.

**Also:**
- The selected reply is drawn as a 1.5 px outlined pill.
- There is no motion at all: no message arrival and no press feedback.
- The chat content was already strong: the AI disclosure and "type human", the italic sources, 3 replies of 20 characters or fewer, and a frequency-capped opt-in.

§8 before: question 4 · evidence 4 · hierarchy 3 · readability 3 · accessibility 4 · trust 4 · India-fit 4 · consistency 3 · states 4 · delight 2.

### What changed

- **The card is now a 4:5 poster (288×360, from 280×350):**
  - **Masthead.** The Aurelia photo is 100 px tall and full-bleed. "Aurelia Heights, Phase 2" sits in Bricolage 19 px, with "Sector 37D · RERA GGM/673/405/2022/117" under it, on a neutral bottom scrim. "Illustrative image" sits top-right on a short neutral scrim.
  - **One dominant element.** The band name is Bricolage 800 at 52 px (−0.045em) in band ink, or ink for Low and Moderate, per §3.2. Under it is a full-width 5-segment meter, 12 px tall and filled cumulatively. That is the band by name *and* by meter, readable at thumbnail size.
  - **One line of metadata below,** not above: "Delivery risk · ●○ low confidence", with the dots drawn as CSS circles.
  - **One sentence at 15 px in full ink:** "Between **30 and 45 of 100** similar projects finished more than 12 months late."
  - **The signature footer:** wordmark, "No developer pays us. Ever.", "Data as of 14 Oct 2026 · v1.2", "Not a credit rating", and the QR labelled "Live card".
  - **Removed:** the 1 px card outline, the footer hairline, the small dial and the green "Check the live version".
- **Caption.** It now leads with the band: "**Elevated** delivery risk for Aurelia Heights, Phase 2, low confidence". The two numbered facts and the italic source follow. The promise moved onto the card, so the caption no longer repeats it.
- **Accessible name.** The card's `aria-label` now carries everything printed on it: the photo, the RERA number, the band and step, confidence, the sentence, the promise, the date, the disclaimer and the QR.
- **Chat.** The card bubble and the reply buttons widen to 296 px. Reply turns rise in (user first, bot 90 ms later). Selected replies are a tone. Every button and the "See all sources" link have press feedback.
- **Code.** The unused dial maths (`arcs`, `needle`) was removed. All behaviour is kept: Start over, the 3 replies, the Why / Cost / Follow turns, the follow opt-in with its 2 replies, the `band` lever and the Day/Night theme (the card stays light in Night, because it is a PNG).

### After: 7.8 · §8 43/50

```
ROUND 1 (after)
Seen in one second: "Elevated", big and orange-brown, under a photo of the towers.
Idea: the building stands on its evidence; the promise is the signature.
Live thing: the band lever redraws the poster; turns arrive as messages.
Scores: design 8.0 · usability 8.0 · creativity 7.0 (capped: a competitor could also send a photo plus score card) · content 8.5 → 7.85, reported as 7.8.
```

§8 after: question 4 · evidence 4 · hierarchy 5 · readability 4 · accessibility 4 · trust 5 · India-fit 4 · consistency 5 · states 4 · delight 4.

### Remaining issues

- **The scrims cover most of the photo.** Two neutral scrims on a 100 px photo leave the towers recognisable but dim. Test a 1080×1350 export in a real phone gallery. If the top caption can move into the bottom line once we have our own photos, drop the top scrim.
- **Wrapping is estimated, not measured.** The sentence wraps to 2 lines by type metrics and still fits at 3. The footer promise is sized to fit one line. Check both first in the canvas.
- **Captions don't follow the lever.** The `band` lever changes the card, but the caption facts stay Aurelia's. That is fine as a lever and wrong as data.
- **The card no longer asks the question.** It reads "Delivery risk: Elevated" rather than "Will it be delivered on time?". For a family audience the noun is clearer, but it departs from the question-led rule.

### 10x ideas

1. **Auto-read broker forwards ("claims vs records").**
   - **The idea:** the buyer forwards whatever the broker sent (a brochure PDF, a "NEW LAUNCH" price image, even a voice note) with no typing. Plinth identifies the project and replies with the risk card and one line per claim it can check. For example: "Flyer says possession Dec 2026. The RERA date is Dec 2027 (HARERA, checked 14 Oct 2026)."
   - **Why 10x:** most property information in Gurugram arrives as broker forwards on WhatsApp. This answers it where it lands, at zero effort, and turns the broker's own marketing into our acquisition loop.
   - **How it works:**
     - The media webhook feeds OCR and vision: we read the RERA number, the name plus sector and any map pin.
     - The match runs against our RERA index.
     - Below a confidence threshold, we ask "Is it one of these?" as a list message of up to 10 rows.
     - Claims are parsed (possession date, carpet vs super area, "RERA approved") and compared with filings.
   - **Feasibility:** M.
   - **Main risk:** misidentification (we always show the match basis and ask before answering), and tone (we state records and never characterise the broker). Forwards carry third parties' phone numbers, so we strip them and never store them; media is deleted after 30 days. Meta's 2026 policy allows this because the bot stays property-specific.

2. **Family-group mode.**
   - **The idea:** a "Share with family" reply returns a forward-ready card plus a `wa.me` link ("Ask Plinth about Aurelia Heights"). Each relative who taps it opens their *own* chat, already in this project's context. As a later step, a business-created group (Meta's Groups API, small groups with invite-only joins) puts the family and Plinth in one room, scoped to the shortlist.
   - **Why 10x:** home purchases in India are family decisions. Today the card is a dead end in the family group. This turns every forward into an informed conversation with the person who actually signs the cheque.
   - **How it works:**
     - The deep link carries a project code but no personal identifier.
     - The original buyer optionally sees "2 family members asked about this", but only if those relatives agree.
     - In the group, the bot answers only about the shortlisted projects.
   - **Feasibility:** S for the deep links; L for groups.
   - **Main risk:** every member must opt in themselves, and we never add numbers on someone's behalf. Groups API availability and limits in India are unproven. The buyer's shortlist becomes visible to relatives. The bot in a group must stay property-specific.

3. **Voice-note answers in Hindi and Hinglish, for the parents.**
   - **The idea:** a parent sends "Aurelia time pe milega?" as a voice note. They get back a 30–40 second voice note in the same language, plus the card and a text transcript.
   - **Why 10x:** the people who fund the purchase often won't read a 4-reason list, but they will listen to a voice note, and forward it.
   - **How it works:**
     - Speech-to-text feeds the same cited-answer pipeline, then text-to-speech.
     - The AI disclosure is spoken first.
     - Numbers are spoken as natural frequencies ("100 mein se 30 se 45").
     - It closes with "our opinion from public records, not a credit rating".
   - **Feasibility:** M.
   - **Main risk:** text-to-speech mis-reading numbers (we speak only the band and the range; everything else stays in text). A voice sounds more authoritative than text. Meta requires AI disclosure, and the bot must stay property-specific.

4. **A card that knows it is stale.**
   - **The idea:** every card carries its issue date, and the QR resolves to "This card was issued 14 Oct 2026. Since then: QPR Jul–Sep 2026 filed; band unchanged." If someone sends an old forwarded card back to the bot, it answers with what changed.
   - **Why 10x:** images live for months in family groups, and a stale risk card is worse than none. This turns every old forward into an honest re-entry point.
   - **How it works:** a stable card URL per project and issue, plus a perceptual hash of the PNG so the bot recognises returned cards.
   - **Feasibility:** S.
   - **Main risk:** wording when a band worsens must stay calm ("the records changed on 2 Jan 2027"). The URLs must be permanent.

---

## WaCost

### Before: 6.5 (capped from 6.6) · §8 36/50

```
ROUND 0 (before)
Seen in one second: a small white slip with a 17 px question and grey bars; no number stands out.
Idea: a waterfall, the category default.
Live thing: "Replay reading" (pages read, typing, then the card).
Layout words: card = title row / label-bar-value grid / note.
Scores: design 5.5 · usability 7.5 · creativity 6.5 · content 8.5 → 6.6.
Caps applied: a 1 px outlined box, plus dashed connector lines (dashed guides) → 6.5.
```

**Top three problems:**
1. **The answer is the smallest thing on the card.** The card asks "What will I really pay?", and the answer, ₹2.74 Cr, is 13 px bold in the last grid row. A family member sees bars and has to hunt for the total.
2. **The colour is spent on the wrong things.**
   - The forest accent fills the *quoted* bar, a non-action that reads as "good".
   - The extras are `#5E5A52` grey, which reads as disabled: the part that matters looks switched off.
   - Dashed grey connectors (a tell) carry the step instead of position.
3. **The image is not self-standing.** It has no date, no promise and no QR. "From your cost sheet" means nothing once forwarded. The 6:5 slip (280×233) doesn't match the risk card, so the two images look like they come from different products.

**Also:** the content and states are excellent and are kept:
- the deletion policy;
- page-by-page reading progress;
- the typing indicator;
- the 7-row list (10 rows or fewer), with a disabled Send until a row is picked;
- the negotiable items;
- the TDS clarification.

§8 before: question 4 · evidence 3 · hierarchy 2 · readability 3 · accessibility 4 · trust 4 · India-fit 5 · consistency 3 · states 5 · delight 3.

### What changed

- **The card is a 4:5 poster (288×360, from 280×233), in the same family as the risk card:**
  - "Aurelia Heights, Phase 2 · 3 BHK" (15 px semibold).
  - **₹2.74 Cr in Bricolage 800 at 56 px**, the one dominant element.
  - One sentence: "All-in, 17% more than the quote."
  - The waterfall at 14 px: label · bar · value, 5 rows on 18 px pitch.
  - "Quoted bar shortened; extras to scale." The honest broken-axis note is kept.
  - The signature footer: wordmark, promise, "Cost sheet of 18 Oct 2026", "Estimate, not a quote", and the QR labelled "Live costs".
- **The waterfall reads by position and tone, not by lines:**
  - The quoted bar is stone (`#C9C4B9`) with the white break marks.
  - The extras are ink and step across to the right.
  - The all-in bar is the same stone segment plus one ink segment, so the eye sees "the quote, plus this much".
  - Bars are square, and the dashed connectors are gone. The accent no longer touches the data.
- **Caption.** It is tightened and leads with the bold total: "**₹2.74 Cr all-in**, 17% above the quoted ₹2.35 Cr. That is ₹18,900/sq ft carpet, with 38% loading." It then gives "**Often negotiable:** PLC and club membership, ₹4.4 L together", the TDS line, and "Estimate from your sheet. Not a quote."
- **Accessible name.** The card's `aria-label` lists every figure with its unit, plus the promise, the date and the QR.
- **Motion and states:**
  - The card bubble, the typing indicator, the reply turns, the asked-line pair, Save and the human handoff all rise in.
  - The list sheet rises from the bottom.
  - Selected replies are a tone, and every button has press feedback.
  - All behaviour is kept: Replay reading (2 timers, cleared on unmount), the 3 replies, the list sheet with radio rows, the disabled Send state and the asked-line answer.
- **Size: 390×1300 → 390×1400.** The taller card plus the asked-line pair would otherwise push the PDF bubble off the top.

### After: 7.9 · §8 44/50

```
ROUND 1 (after)
Seen in one second: "₹2.74 Cr".
Idea: the number stands on its own arithmetic; the promise is the signature.
Live thing: Replay reading, which ends with the card arriving.
Scores: design 8.0 · usability 8.0 · creativity 7.0 (capped) · content 9.0 → 7.9.
```

§8 after: question 4 · evidence 4 · hierarchy 5 · readability 4 · accessibility 4 · trust 5 · India-fit 5 · consistency 5 · states 5 · delight 3.

### Remaining issues

- **The waterfall is small.** At 106 px wide it is small at thumbnail size. The total carries the message and the bars only support it, which is right, but the stamp-duty bar is the one most people will want to point at. The "who owns it" idea below would make the bars the live thing.
- **The list sheet keeps WhatsApp's own row dividers.** These are native list chrome, left neutral on purpose.
- **"Cost sheet of 18 Oct 2026" doesn't say whose.** This is deliberate for privacy. If a buyer wants attribution, add their first name only on request.
- **The placeholder policy line** ("30-day file deletion, pending legal review") still needs legal sign-off.

### 10x ideas

1. **Payment-demand check.**
   - **The idea:** the buyer forwards the developer's demand letter (for example "On casting of 12th floor slab, 10% due: ₹23.5 L by 5 Nov"). Plinth answers with a "Demand vs records" card: "Your plan bills 10% at the 12th slab. The latest QPR (Apr–Jun 2026) shows 9 of 20 slabs. Ask for the architect's certificate before paying."
   - **Why 10x:** the most expensive moment in an under-construction purchase is paying ahead of construction, and today no one checks it for the buyer. This makes Plinth a 3–5 year companion, not a pre-purchase tool.
   - **How it works:**
     - Parse the demand letter.
     - Match the stage to the payment plan from the saved cost sheet.
     - Compare with the QPR's physical progress and the latest dated site photo.
     - Offer to save the result to the project.
   - **Feasibility:** M.
   - **Main risk:** QPRs lag by up to a quarter, so a legitimate demand can look early. We state the lag and never say "don't pay". It sits close to legal advice, so we keep to "records show" and offer the human handoff. Demand letters carry bank details; we redact them on ingest.

2. **"Who will own it?" stamp-duty saving.**
   - **The idea:** a list message asks "Who will be on the sale deed?" (man / woman / joint). The waterfall redraws its stamp-duty bar, for example "With a woman as owner: about ₹X L less stamp duty."
   - **Why 10x:** it is a real, legal saving worth lakhs on a ₹2 Cr flat, a conversation families have at the dinner table, and nobody shows it at the moment of the quote. The card becomes the one people forward to the person whose name might go on the deed.
   - **How it works:** a rate table per buyer type with the notification cited and dated, and the same card with the bar re-computed.
   - **Feasibility:** S.
   - **Main risk:** stamp-duty rates and concessions change and must be verified against the current Haryana notification before launch. It edges toward advice, so we frame it as arithmetic and note that ownership has legal consequences beyond tax.

3. **Negotiation note, ready to forward.**
   - **The idea:** a "Draft my ask" option writes a short, polite message to the sales manager in English or Hindi, naming the two negotiable lines and their amounts. The buyer forwards it from their own number.
   - **Why 10x:** it turns an insight into up to ₹4.4 L of possible savings in one tap.
   - **How it works:** a template filled from the parsed sheet, with a tone selector (it could replace "Save to project", or sit in the list to stay within 3 replies).
   - **Feasibility:** S.
   - **Main risk:** Plinth must never contact or negotiate with the developer itself; that is the "No developer pays us" line. The wording must not imply a guaranteed discount.

4. **Quote-drift diff.**
   - **The idea:** the buyer sends a second cost sheet weeks later, or two brokers' sheets for the same unit. The waterfall shows only what changed: "PLC +₹1.1 L; club membership added; base unchanged."
   - **Why 10x:** silent changes between the quote and the allotment letter are common and expensive.
   - **How it works:** line-item matching across sheets, with a "we couldn't match these lines" fallback to totals.
   - **Feasibility:** S/M.
   - **Main risk:** mismatched line names across developers' formats.

---

## WaAlerts

### Before: 6.5 (capped from 6.65) · §8 39/50

```
ROUND 0 (before)
Seen in one second: five thin outlined frames; a lot of small type; no picture anywhere.
Idea: none; a correct inventory of WhatsApp formats.
Live thing: the Flow (calendar, slot, visitors, consent, booking).
Layout words: board = left stack (chat, chat) / right row (flow, flow, flow).
Scores: design 6.0 · usability 7.5 · creativity 6.0 · content 8.0 → 6.65.
Caps applied: index lettering ("a ·", "b ·", "c ·"), 5 outlined frames, a hairline inside the summary panel and an outlined Start over → 6.5.
```

**Top three problems:**
1. **The alert has no picture.** It is the most important message Plinth will ever send unprompted, and it is a bold "Project alert" line and three paragraphs. It is the one moment the band *moves*, and nothing on screen moves or even shows a meter.
2. **The booking ends in plain text.** The visit is the moment a family physically goes to the site together. The confirmation ("Visit booked… code 4821…") is a grey bubble nobody will save, forward to the driver or show at the gate.
3. **Board tells.**
   - The "a ·, b ·, c ·" index letters before question headings.
   - 1 px outlines on every frame, even though the frames already sit on a different tone.
   - An outlined Start over pill.
   - A rule inside the Flow summary panel.

**Also:** the platform craft is excellent and is kept:
- the utility template with quick replies (desktop-safe);
- the authentication template with fixed wording and Copy code;
- a 3-screen Flow with one task per screen;
- a calendar bounded to 19 Oct–17 Nov;
- a full slot shown as Full;
- an unticked consent box naming Northfield Estates' site office;
- a masked number;
- an inline error;
- a booked state with Reschedule and Cancel.

§8 before: question 4 · evidence 4 · hierarchy 3 · readability 4 · accessibility 5 · trust 5 · India-fit 4 · consistency 3 · states 5 · delight 2.

### What changed

- **The alert gets an image header** (utility templates allow one header; image replaces the old text header).
  - **Format:** 282×148 (≈1.91:1). The ground is a full field of the band's own fill (Elevated `#FBE6D8`); the fill only carries the band, so no other use of the ramp colours.
  - **Content:**
    - "Aurelia Heights, Phase 2" and the wordmark.
    - **"Elevated" at 44 px** in band ink.
    - A 5-segment meter in which segment 3 fills in once (`pl-step`, 0.6 s delay): the same "band steps" moment as AppFollowing, so the signature is one move across channels.
    - "Delivery risk, low confidence" and "Was Moderate until 14 Oct 2026".
    - A QR to the live card.
  - **Body text** is tightened to one paragraph that states the change, the date, the main reason and the source, so the lock-screen preview carries the full message.
  - **The promise line is deliberately left off this one image** (see Remaining issues).
- **The booking confirmation becomes a visit pass,** an artefact of the subject's world (a ticket), using the Aurelia photo.
  - **Masthead:** the project and "Site office · Sector 37D, Gurugram" on a scrim.
  - **The date as the dominant element:** "Sat 24 Oct" at 40 px, computed from the chosen date.
  - The slot and the number of visitors, then **4821** at 30 px with "Your visit code. Show it at the site office instead of your number."
  - **The signature footer:** "Booked 18 Oct 2026", "Your number stays masked", and the QR labelled "Visit code".
  - The full text confirmation stays in the caption for accessibility and notifications.
- **Board:**
  - The "a / b / c" index letters are removed; order is shown by position.
  - Frame outlines are removed, and the frames sit on their tone. In Night, the chat ground moves to `#111C17` so the step survives without a line.
  - Start over is a filled tone pill.
  - The summary panel's inner rule is replaced by space.
- **Motion:** messages rise in, the alert meter steps, and every button, day cell and link has press feedback. There is a focus ring and a reduced-motion fallback.
- **All behaviour is kept:**
  - the See why / Stop alerts turns;
  - the month paging;
  - the date, slot (with Full) and visitor choices;
  - the name input, the consent toggle, the error and the confirm → booked state;
  - Copy code with its 1.6 s revert;
  - Start over.
- **Size: 1400×920 → 1400×980.**
  - The alert frame is 510 px (was 420) to hold the image header.
  - The login frame is 234 px (was 260), trimmed to its content.
  - The Flow frames are 814 px (was 750), so the left and right columns end on one line.

### After: 7.6 · §8 44/50

```
ROUND 1 (after)
Seen in one second: the orange-brown "Elevated" field in the alert, then the photo-topped visit pass.
Idea: the project's moments (band moved, visit booked) arrive as objects you can keep and forward.
Live thing: the band steps in the alert image.
Scores: design 7.5 · usability 8.0 · creativity 7.0 (capped) · content 8.5 → 7.65, reported as 7.6.
```

§8 after: question 4 · evidence 4 · hierarchy 4 · readability 4 · accessibility 5 · trust 5 · India-fit 4 · consistency 5 · states 5 · delight 4.

### Remaining issues

- **Why the promise is not on the alert image.** Utility templates must be non-promotional. A value-proposition line inside a utility header image is the kind of content Meta can use to reclassify a template as marketing, at several times the per-message price, with opt-in consequences. The alert keeps the wordmark only. The promise travels on the full risk card, one tap away via "See why". Revisit if Meta's review accepts it.
- **The image header needs approval, and it moves in the mock only.** It has to be approved with a sample at template creation and is sent per message. The `pl-step` move previews a still PNG; real motion would ship as a short MP4 header (see 10x idea 1).
- **The panels aren't native Flow components.** The Flow screens keep WhatsApp's native chrome (header rules, outlined radio rows), left neutral on purpose. The summary panel and the masked-number panel are *not* native Flow components; at build time they become TextBody or RichText, or an Image component.
- **The board is still presentation small print.** The 13 px notes under each heading are meta for reviewers, not product UI.

### 10x ideas

1. **The tower grows in the alert.**
   - **The idea:** each new QPR filing triggers a utility alert whose header is a 3-second MP4. It shows the 3D tower adding the slabs just reported, with the sold line, ending on the band meter.
   - **Why 10x:** a filing is invisible and boring, while a building that grows (or doesn't) is the most honest and most forwardable picture of progress. It is our signature visual, travelling.
   - **How it works:** a server-side render per project per quarter, cached, under the media limit, sent as the template video header. The same slab data drives the app's replay tower.
   - **Feasibility:** M.
   - **Main risk:** Meta may read visually rich alerts as marketing, so they must stay strictly factual, be triggered by the user's Follow and come at most once a quarter per project. There is also render cost.

2. **Site-visit co-pilot.**
   - **The idea:** the visit pass carries five project-specific questions to ask at the site office, drawn from the records. For example: "Why was the Oct–Dec 2025 QPR filed 38 days late?" and "When will Tower B apply for OC?" Two hours after the slot, a utility follow-up asks "What did they tell you?" The buyer replies with a voice note.
   - **Why 10x:** it turns the sales theatre of a site visit into evidence-gathering. Families walk in prepared and walk out with notes.
   - **How it works:**
     - The voice note is transcribed and filed on the buyer's private card as "Developer says (sales office, unverified, 24 Oct 2026)".
     - It is checked against the records, and the bot replies with what matches and what doesn't.
   - **Feasibility:** M.
   - **Main risk:**
     - The buyer records their own recollection, never the salesperson.
     - Unverified claims stay labelled as such.
     - The follow-up is tied to the booking, which makes it a legitimate utility message.

3. **Family alerts with self opt-in.**
   - **The idea:** "Add a family member to these alerts" gives the buyer a link to share. The relative taps it, opens their own chat and opts in themselves. Alerts then reach both, and "See why" from either answers in the same project context.
   - **Why 10x:** the decision-makers get the same evidence on the same day, with no more "forward me that thing".
   - **How it works:** a `wa.me` link with a project-and-follow code; a per-number opt-in record; a "who gets these alerts" list on plinth.in/you.
   - **Feasibility:** S.
   - **Main risk:** Meta requires the recipient's own opt-in, which this design respects; we never message a number that hasn't messaged us. Utility costs double. Relatives must never see each other's cost sheets.

4. **No-typing login.**
   - **The idea:** the authentication template uses one-tap or zero-tap autofill on Android. On the web, "Continue with WhatsApp" opens a chat with a signed one-time token, and the bot confirms the sign-in.
   - **Why 10x:** login friction on patchy 4G disappears, and WhatsApp becomes the identity the buyer already trusts.
   - **How it works:** autofill buttons with the app signature hash; on the web, a signed token in the prefilled message, matched to the session.
   - **Feasibility:** S.
   - **Main risk:** auth template rules (fixed wording, no URLs). Phishing look-alikes: we never ask for a code in chat and say so in the template.

---

## WhatsApp limits audit (after)

| Control | Type | Count | Longest label | Limit | OK |
|---|---|---|---|---|---|
| WaRisk replies | Reply buttons | 3 | "Why this band" (13) | ≤3, ≤20 chars | Yes |
| WaRisk follow opt-in | Reply buttons | 2 | "Yes, alert me" (13) | ≤3, ≤20 | Yes |
| WaRisk "See all sources" | CTA URL button | 1 | 15 | ≤20 | Yes |
| WaCost replies | Reply buttons | 3 | "Talk to a person" (16) | ≤3, ≤20 | Yes |
| WaCost "See each line" | List message | 7 rows | row title "Stamp duty, registration" (24) | ≤10 rows, title ≤24 | Yes |
| WaAlerts alert | Utility template, image header, quick replies | 2 | "Stop alerts" (11) | ≤25 | Yes |
| WaAlerts "Open full card" | CTA URL (session) | 1 | 14 | ≤20 | Yes |
| WaAlerts login | Authentication template, copy code | 1 | "Copy code" | Fixed wording | Yes |
| WaAlerts booked | Reply buttons (session) | 2 | "Cancel visit" (12) | ≤3, ≤20 | Yes |

**Policy notes:**
- Utility templates are used only for alerts the user asked for (Follow, the booking reminders and the visit follow-up).
- The visit pass and the cards are session messages inside the 24-hour window.
- The bot answers only about properties and projects. Every 10x idea above keeps it that way.

## Notes for the lead

- **Canvas sizes to update in `canvas.json`** (I did not edit it): WaCost h 1300 → **1400**; WaAlerts h 920 → **980**. WaRisk is unchanged at 390×1400.
- **Backups** of the three originals are in the scratchpad at `wa-backup/`.
- **Checks run:**
  - a Python tag-balance and attribute-quoting check on all three files: clean;
  - `node --check` on each component script: clean;
  - a stub run of `renderVals` that fires every handler in Day and Night: no errors.
- **Not measured.** No browser and no taste-skill scripts were run, so line wraps are estimated from type metrics. Look first at the WaRisk card sentence and the footers' promise line.
- **No new image slots.** Every card uses the existing `heroAurelia` blob.
