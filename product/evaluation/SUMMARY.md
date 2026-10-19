# Design evaluation: decision summary (18 Oct 2026)

Inputs:
- `consumer.md`: 41 gaps (4 Critical, 14 High)
- `developer.md`: 20 gaps
- `broker.md`: 22 gaps
- `10x_shortlist.md`: 105 ideas merged into 47, then ranked

All evaluations read the copy and code of the 24 R1 artboards. Nothing was user-tested; severities are expert judgement.

## One line per perspective

| Perspective | Verdict |
|---|---|
| **Buyer** | Plinth answers "Is this builder risky?" better than anything in the market. It stops short of "So what do we do, and can we afford the wait?", and it goes quiet at the money moments (EOI, booking, payment plan, loan). The once-burned buyer is the most likely to adopt it and to pay for it. |
| **Developer (pitch)** | A strong due-process console but a weak developer product. It answers "Can you hurt me unfairly?" and barely answers "What do I get?" The champion (good delivery, weak brand) would claim its profile but would list actively only with a printable live record and buyer enquiries flowing into its CRM. The big brand would monitor, not list. The developer with legacy delays would push back legally. |
| **Broker** | R1 has nothing for brokers, and some flows unintentionally work against them. The site-visit flow can cost a CP their commission tag, and the copy treats brokers as the enemy. Seven fixes are needed, mostly policy and copy. |

## Fix before coding (critical across all three)

| # | Fix | Source |
|---|---|---|
| 1 | **One canonical event timeline** in DESIGN.md §5 that every screen uses. Today Aurelia's band-change date, QPR filing date, one cost-sheet line, and the "who has my number" parties disagree across screens | Buyer G-03, Developer G05 |
| 2 | **"Before you pay" check** (F-41 is in R1 scope but has no screen): the payee matches the RERA collection account, the 10% cap before a registered agreement, EOI refund terms, and receipts | Buyer G-01 |
| 3 | **Project pages describe the homes:** configurations, carpet sizes, floor plans, towers, amenities, location, plus a labelled "From the developer" section (dated price list and its history, payment plans) | Buyer G-02, Developer G07 |
| 4 | **"Can we afford the wait?"** Rent + pre-EMI during construction, plus the cost of a 12- or 24-month delay, in rupees (F-12 extended) | Buyer G-04, 10x #10 |
| 5 | **Hard states designed:** project pages for Severe (red flag), Limited history, Not scored and Stalled, plus "if you've already booked here" guidance | Buyer G-05 |
| 6 | **Band → keys copy:** explain that OC is not keys, and that "within 12 months" can still mean 11 months late | Buyer G-06 |
| 7 | **Show public facts immediately** (e.g. a missing QPR); only the band change waits for the 7-day developer notice | Buyer G-07 |
| 8 | **Agent of record in visit booking:** a "Working with an agent?" step. Plinth never registers itself as a lead source with a developer | Broker BG-02 |
| 9 | **Honest labels:** who pays each agent. Remove broker-hostile copy | Broker BG-03 |
| 10 | **Developer heads-up on every band change** (not only moves into High/Severe), plus a 2-day clerical-error lane | Developer G05–G06 |

## Proposed R1 additions (need your call on scope)

| Package | What it includes | Effort (judgement) |
|---|---|---|
| **A. Free Developer workspace** (D1-compatible) | Claim profile · consented enquiry and visit inbox · CRM hand-off by email/CSV (webhook in R2) · "Live Record" QR and link kit · "From the developer" facts · heads-up and clerical lane | ~4–6 engineer-weeks |
| **B. Thin broker layer** | "For agents" page · 3-step WhatsApp onboarding with a live HARERA agent check · "Is this broker registered?" · agent of record on visits · agent labels · cap counts only parties who can contact the buyer · introductions logged from day 1 | ~1–2 engineer-weeks |
| **C. Top 10x ideas** | 1. **Claims vs records:** forward any brochure, flyer, voice note or hoarding photo and get "Brochure says / Records show" (build first; others reuse its pipeline). 2. **Site-visit co-pilot:** questions from the records on the visit pass; your voice recap is checked afterwards. 3. **Since you last looked.** 4. **Pay-as-built guard:** demand letters vs slabs filed, in present tense only. 5. **Watch the condition:** "what would change this" ticks off at each QPR | ~13–18 engineer-weeks + 4 design-weeks |
| **D. Family circle (slice)** | A relative taps a link and opts into the same alerts | Small |

The shortlist suggests moving **Visualise (AI staging)** to R2, or keeping it web-only, to make room. None of its 13 ideas made the top 15. It was the founder's own idea, so that is the founder's call.

## Policy decisions surfaced

1. **Buyer contact vs brokers.** Keep the buyer–agent relay alive through an active deal, and let the buyer share their number after a confirmed visit. The copy changes from "never shown" to "never without your tap".
2. **No cut of CP commission, ever.** Taking a share of developer-paid CP commission would be developer money through a third party, so it breaks D1.
3. **Dropped 10x ideas:**
   - live listening to salespeople (third-party voice without consent);
   - becoming a DPDP Consent Manager (conflict of interest);
   - an open CC-BY dataset (government terms, IT Act s.43);
   - AR walk-throughs;
   - the sound/air snapshot;
   - furnishing "top-up loans".

## Next step

1. A fix pass on the designs for items 1–10, plus whatever of A–D the founder approves.
2. Then Phase 4 (code).
