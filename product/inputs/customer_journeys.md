# Customer journeys, personas and the moments that matter

Input to the PRD (Phase 2). Prepared 18 Oct 2026 by the customer-journey and service-design specialist. Scope: Delhi NCR launch (Gurugram under-construction, Noida/Greater Noida West resale, NRI), with six actors.

**How to read this document**
- **[E#]** = new evidence gathered for this document. URLs and access dates are in Appendix A.
- **[P1-BJ] / [P1-SJ] / [P1-R]** = reused from Phase 1 notes and report: buyer journey, seller journeys, synthesis report. **[RS-AB] / [RS-DD] / [RS-UX] / [RS-DS]** = reused from the risk-score notes. Original URLs are in those files (paths in Appendix B).
- **[J]** = my own judgement. Personas are composite archetypes [J] anchored on the cited survey data.
- Severity is scored 1–5, where 5 means financial loss or a deal-breaker. "MoT" = moment of truth.
- **Evidence limits.** Reddit (www and old), Quora, Hindustan Times and Times of India blocked the fetch tools (403 or domain block). WebSearch was exhausted. Bing returned irrelevant results, and DuckDuckGo and Mojeek returned a CAPTCHA or a 403, so I stopped trying them. Fresh first-person evidence therefore comes from Trustpilot (Oct 2026), consumercomplaints.in, ThePrint and Tribune ground reports, and court/RERA orders. Quotes were pulled with an automated fetch-and-extract tool, and a few are truncated ("…"). **Verify the wording before any external use.** Forum mining (r/gurgaon, r/noida, Team-BHP) and 20–30 interviews remain the biggest research gap.

---

## 1. Summary

1. **The two demand journeys peak at different times.** For the under-construction (UC) buyer, the pain comes up front at builder choice and then turns into a 3–5-year "is it on track?" anxiety. For the resale buyer, it is packed into the 2–10 weeks from first visit to registry: availability, transferability, price and paperwork. So UC needs a long-running *Project Watch* relationship, and resale needs a short, high-stakes *deal room*.
2. **Two decisions are changed most by the scores.** **Delivery Risk** matters at shortlist/EOI (which builder, which payment plan). **Transferability** matters before the token (walk away, renegotiate, or demand a document). These are moments #1 and #3 of the top 15.
3. **Fresh evidence confirms that trust in the incumbents has collapsed.** On Trustpilot in Oct 2026, 99acres scores 1.2, MagicBricks 1.1 and Housing.com 1.1. Sellers write "Zero property visits. Zero meaningful buyer leads", and a buyer wrote "100% of properties i selected and contacted are FAKE LISTED PROPERTIES" [E7–E9]. Removing spam and ghost listings is the minimum, not a differentiator.
4. **Paper is not ground truth.** Gurugram's OC audit, plus residents saying "Everything looks perfect on paper… but on the ground we struggle for basic facilities" [E1], means every score must fuse documents with ground evidence (photos, resident reports, satellite).
5. **Possession is not the end of the journey.** Maintenance can jump 90% in two years, builders control RWAs ("we do not have the right to make decisions in our own society") and buyers keep their right to delay interest after taking possession [E2, E5, E6]. Society Health and post-possession support extend the relationship and build the data moat.
6. **Resale fraud is rare, severe and preventable.** In one case a ₹1.10 cr Gurugram flat was sold with a ₹35.7 lakh loan hidden behind forged foreclosure documents [E4]. A lender payoff and CERSAI check belongs in the P0 checklist.
7. **Sellers need a gate, not more leads.** A masked number, an AI pre-qualification agent, a Fair Price range and a net-proceeds/tax calculator together make a cheap, high-intent MVP wedge on the supply side.
8. **Developers and CPs share one pain: lead speed and attribution.** AI pre-sales plus an attribution ledger opens B2B revenue, but the scores must be firewalled from it.
9. **NRIs are the highest-value persona with the thinnest evidence.** Their extra moments, POA scope and remote verification, need a human or field layer, so they are P1.
10. **P0 set (§5):** the Delivery Risk report, an all-in cost normaliser, a Transferability check, verified availability, the seller gate with pricing and tax tools, Project Watch, a Hinglish WhatsApp assistant, a loan pre-check and a developer right-of-reply.

---

## 2. Personas and jobs to be done

### 2.1 Under-construction buyer, Gurugram (₹1.5–5 cr)
Anchors [P1-BJ]: 98% of buyers want assurance of timely completion. 54% would pay up to a 20% premium for a brand. More than 50% of NCR buyers prefer a 3BHK. Buyers' average age is now 32–40. About 50% of under-30s accept construction risk, against about 36% of over-30s (Colliers 2026). NCR EMI-to-income is 67% (Knight Frank H1 2026) [RS-AB].

| Persona [J] | Profile | Motivations | Fears | Digital behaviour and language |
|---|---|---|---|---|
| **A1 Dual-income upgrader**: Rohan (34) and Meera (32) | Tech/consulting, ₹45–60 LPA, renting on Sohna Rd. Target: 3BHK at ₹2.2–3 cr on Dwarka Expressway or SPR, 75–80% loan | Own a home before the kids start school; lock in today's price; amenities | Paying EMI plus rent on a stalled project; hidden costs; 41% loading; monsoon flooding in New Gurugram | YouTube corridor walkthroughs, Instagram reels, project WhatsApp groups, Reddit lurker. Researches at night on the phone, decides at weekend visits. English/Hinglish |
| **A2 Business-family investor**: Sanjay Aggarwal (49) | Delhi trader (Rohini). Buys 2 units at ₹3–5 cr in Golf Course Extension Road launches through a trusted CP; 30–50% own funds | Appreciation; exit before possession; EOI priority | Capital stuck; transfer/endorsement fees; oversupply (Gurugram holds 57% of NCR's unsold stock) | WhatsApp voice notes, relies on the CP, little patience for forms. Hindi/Hinglish |
| **A3 Once-burned second-timer**: Neeraj Khanna (46) | Waited 8+ years in a 2010-era Gurugram project (the pattern in [E12]). Now buying at ₹2.5–4 cr, only top brands near completion | Certainty over price | Repeat of the first project; silence once paid: "once you are done with the payment nobody bothers to answer your query" [E15] | Reads HARERA orders and buyer-association groups; wants evidence, not brochures. English |

### 2.2 Resale buyer, Noida / Greater Noida West (₹60 L–1.5 cr)
Anchors: resale is about 40% of roughly 30,000 Noida/GN registrations, and about 75,000 flats are unregistered [P1-R; RS-AB]. All-in costs for resale run about 10–15% [P1-BJ].

| Persona [J] | Profile | Motivations | Fears | Digital behaviour and language |
|---|---|---|---|---|
| **B1 First-home couple**: Ankit (30) and Pooja (29) | Salaried, ₹18–24 LPA, renting in GNW. Target: ready 2/3BHK at ₹70–95 L in a registered society near the metro, 80% loan | Stop paying rent; stability; school access | Unregistered flat; overpaying; fake listings; broker games | Portals, NoBroker, society Facebook/WhatsApp groups, YouTube. Hinglish, UPI-native |
| **B2 Chain mover**: Rajesh Sharma (44) | SME owner in Indirapuram. Sells the old flat to buy a 3BHK at ₹1.2–1.5 cr on Noida Expressway | Upgrade without a gap between the two deals | TM/NOC surprises; demands for cash; one deal collapsing and taking the other with it | Phone and WhatsApp; relies on a local dealer. Hindi-first |
| **B3 Yield investor or parent-buyer**: Sunita Gupta (56) | Retired teacher buying a ₹60–75 L 2BHK to rent out, or for her son | Steady rent (gross yield 3.2–3.9% [RS-AB]) | Maintenance hikes; tenant default; society disputes | Relies on family; Hindi. Wants a single "is this safe" answer |

### 2.3 NRI buyer

| Persona [J] | Profile | Motivations | Fears | Digital behaviour and language |
|---|---|---|---|---|
| **C1 Gulf return-planner**: Amit Malhotra (39) | IT manager in Dubai; family in Faridabad. Target: 3BHK at ₹2.5–3.5 cr on Dwarka Expressway, NRE funds plus an NRI loan (70–85% LTV [P1-BJ]); his brother holds the POA | A home for his parents now and for his own return in about 5 years | POA misuse; never seeing the site; relatives or CP "managing" him; no way to do snagging | WhatsApp and video calls in the evening IST. Hindi/English |
| **C2 US investor-retiree**: Neha Kapoor (45) | Bay Area. Buying a ₹4–5 cr luxury flat on Golf Course Extension Road as an investment and a retirement option | Appreciation, rental income, a future option to return | Negative carry; repatriation; TDS; unreliable property managers: "Once I agreed with single tenant, they stopped taking calls" [E17] | Email and app, a 12.5-hour time difference; wants institution-grade reports and audit trails. English |

### 2.4 Supply-side archetypes (brief) [J]
- **Seller:** D1 *upgrading Noida owner* (selling into a chained deal); D2 *NRI exiting* (46% of NRI owners "want to sell now" [P1-R]); D3 *investor exiting a GNW unit* (price-sensitive, often tenant-occupied).
- **Developer:** E1 *VP Sales at a Tier-1 brand* (allocation, CP attribution, collections); E2 *Head of Sales and Marketing at a Tier-2 developer* (lead quality, cost per booking, CP dependency, trust deficit); E3 *CRM/post-sales manager* (demand letters, construction updates, possession).
- **Broker/CP:** F1 *large CP firm* (20–100 staff, Gurugram launches); F2 *society dealer* (GNW resale, about 1% from each side, WhatsApp groups); F3 *NRI-focused advisor*.

### 2.5 Jobs to be done

| Actor | Functional job | Emotional job | Social job | "Hires" today | "Fires" when |
|---|---|---|---|---|---|
| UC buyer | "When I'm about to hand a builder ₹20–50 L for a flat I'll get in 4 years, tell me whether they will deliver, what I will really pay, and warn me early if it goes wrong." | Not become "another Jaypee story" | Be seen as a smart buyer by family | CP, YouTube reviewer, relatives | Silence after payment; surprises at possession |
| Resale buyer | "Prove this flat is real, available, transferable with a loan and fairly priced, then get me from token to registry without surprises." | Avoid being cheated | Not overpay compared with neighbours | Local dealer, portal, lawyer | Ghost listings; hidden dues; deals collapsing |
| NRI buyer | "Let me buy and own a flat 5,000 km away as safely as if I were there, without giving anyone unlimited power." | Control from a distance | Provide for parents; return with dignity | Relatives, CP, NoBroker NRI | POA misuse; unreachable service |
| Seller | "Sell at a fair price to a real, financed buyer without my phone being flooded, and get my money cleanly." | Feel in control; not be taken for a ride | Not undersell compared with the society | Dealers, portal plans | Paid plans that deliver nothing [E7–E10] |
| Developer team | "Turn marketing spend into bookings and collections at a lower cost, stay RERA-compliant and keep buyers calm." | Look credible against NCR's legacy | Win the corridor | CRM, CPs, telecallers, portals | Leaked leads; CP disputes; fines |
| Broker/CP | "Get real clients and inventory, close faster, get paid on time and look credible." | Stop losing the race to the first call | Professional reputation | Portal packages, WhatsApp groups | Shared junk leads; payouts withheld |

---

## 3. Journey maps

Column key: **Goal** → **Actions and touchpoints** → **Thoughts and emotions** → **Pain points (evidence · severity)** → **MoT** → **Product opportunity (feature; where a score or AI fits)** → **Success signal**.

### 3.1 Under-construction flat buyer (Gurugram, ₹1.5–5 cr)

| Stage | Goal | Actions and touchpoints | Thoughts and emotions | Pain points (evidence · sev) | MoT | Product opportunity | Success signal |
|---|---|---|---|---|---|---|---|
| 1 Trigger and budget | Decide buy vs rent; set a safe budget | Online EMI calculators, bank eligibility, parents' advice | FOMO: "prices up 12%, buy now or regret" [P1-BJ] | EMI/income at 67%; the all-in cost 20–35% above base is not yet visible; repo raised 7 Oct 2026 [RS-AB] · 4 | — | **Affordability stress test** (+100/+200 bp) and an all-in budget translator; 5-question Hinglish intake on WhatsApp | Budget set *including* all-in costs; returns within 14 days |
| 2 Discovery | Find credible projects in a corridor | YouTube, Instagram ads, CP cold calls, portals, launch broadcasts, EOI events | Overwhelmed: "every project is luxury and near the metro" [J] | The same project pushed by 10 CPs; ads missing RERA numbers (UP-RERA fined 91 developers) [P1-SJ] · 3 | First reply: is anyone straight with me? | **Conversational search** ("3BHK under 3 cr, Dwarka Expwy, low delivery risk, no waterlogging"); a **Delivery Risk band on every card** | Search → report click-through; WhatsApp opt-in |
| 3 Shortlist and builder due diligence | Know whether the builder and project will deliver | Google "builder + delay", HARERA site (hard to use), ask the CP, friends | Anxiety: "is this another Revanta?"; distrust of the CP's opinion | Warning signs appear 15 months to 6+ years before failures, but are scattered [RS-DD]. 158 Gurugram registrations are flagged "QPR not uploaded" and 200 have lapsed [RS-DS]. Remedies are slow: ₹446 cr of RCs unexecuted [RS-DD] · **5** | **MoT 1: builder choice before EOI** | **Delivery Risk report:** band plus natural frequency ("~38 of 100 similar projects >12 months late"), top 4 reasons, evidence links, "what would change this", right-of-reply status. **AI summary of HARERA orders.** Side-by-side comparison of 3 projects | % of shortlists that change after viewing; reports shared with a spouse or parent |
| 4 Visit and negotiation | Verify the product; get the best price and plan | Experience centre, sample flat, CP present, "only 3 units at this price", EOI cheque ₹1–5 L | Excitement under pressure; "the sample flat felt huge" [J] | 41% loading (super vs carpet). PLC, floor rise and parking are negotiable but opaque [P1-BJ] · 4 | **MoT 2: cost sheet in hand** | **Cost-sheet normaliser:** photo of the quote → all-in ₹ per *carpet* sq ft, loading %, benchmark per line item, "items you can negotiate". **Labelled AI staging** of the actual carpet plan | % of visits with a cost sheet uploaded; median ₹ of "surprises" flagged |
| 5 Booking, allotment and BBA | Lock in the unit safely | Booking 10–15%, allotment letter, BBA within 30–60 days, choice of CLP/PLP/flexi/subvention plan | Relief, then fear of the fine print | **Subvention trap:** "told at the time of booking… m3m will pay the emi until possession but… i am paying the e[mi]" [E14]; 22 CBI FIRs [P1-BJ]. BBAs deviate from the RERA model agreement · **5** | **MoT 3: payment plan and signature** | **Payment-plan simulator** (cash out vs construction risk, scaled by Delivery Risk); **BBA clause checker** against the model agreement (flags only; lawyer upsell); subvention explainer; **loan pre-check** (lender-approved project) | No subvention booking without lender confirmation; % using the BBA check |
| 6 Loan and milestone payments | Pay only for real progress | Tripartite agreement, emailed demand letters, bank disbursements, GST | "Am I paying ahead of construction?" | Banks disbursed 70–80% without milestone checks in subvention cases [P1-BJ] · 4 | Each demand letter | **Demand-letter verifier:** compares each demand with QPR, photos and satellite data; cash-flow planner | % of demands verified; mismatches flagged |
| 7 Construction wait (3–5 years) | Know it is on track; act early if not | Builder app/emails, weekend site visits, buyer WhatsApp groups (rumours), QPR (rarely read) | Chronic, low-grade anxiety; feels powerless | Information asymmetry; GRAP stoppages; 21 months with no work at 16 Supertech NCR sites (Sep 2026 protest) [P1-BJ] · **5** | **MoT 4: "is my project on track?" each quarter** | **Project Watch:** QPR parsing, satellite and buyer-photo timeline, delay-probability trend, alerts (QPR missed, extension filed, NCLT petition, rating downgrade), collective view for the buyer group. Open to buyers who booked *elsewhere* (acquisition hook) | Monthly active watchers; alert open rate; NPS during the wait |
| 8 Possession and snagging | Take an OC-valid, finished flat; pay only what is due | Offer of possession; final demand (maintenance, IFMS, DG, electrification); pre-delivery inspection | Joy mixed with doubt: "Everything looks perfect on paper and even in the Occupancy Certificate, but on the ground we struggle for basic facilities" [E1] | 14 of 22 inspected OC buildings were still under construction [RS-AB]. Snags; ₹ lakhs of advance maintenance. Delay interest goes unclaimed, although accepting possession does not bar the claim [E5]; HARERA awarded 10.8% [E6] · **5** | **MoT 5: possession day** | **Possession assistant:** check the OC against the audit list; AI snag list from photos and video; check the final demand against the BBA; **delay-interest calculator** and complaint draft; partner snagging inspector | % of possessions with a snag report; ₹ of delay interest identified |
| 9 Registry, mutation and society | Own it on paper; get a say in the society | Conveyance deed (Haryana paperless, HARIS slot, biometrics), Jamabandi mutation, RWA/AOA | Anger at builder-run RWAs: "We have invested… our lifetime savings, yet we do not have the right to make decisions in our own society" [E2] | 7,585 mutations pending (Aug 2026) [P1-BJ]; RWA membership disputes [E2]; CAM up 90% at The Westerlies [E19] · 4 | First maintenance bill or AGM | Registry/mutation tracker; **Society Health** profile (residents add bills and outages); RWA governance guide | Society profiles claimed; resident contributions per month |

### 3.2 Resale flat buyer (Noida / Greater Noida West, ₹60 L–1.5 cr)

| Stage | Goal | Actions and touchpoints | Thoughts and emotions | Pain points (evidence · sev) | MoT | Product opportunity | Success signal |
|---|---|---|---|---|---|---|---|
| 1 Trigger and budget | Buy vs rent; loan size | Bank apps, relatives, rent comparison | "Rent is gone every month" [J] | All-in resale cost 10–15% above price; affordability · 3 | — | Affordability test; resale all-in calculator (stamp duty, TM, brokerage, TDS) | Budget includes all-in costs |
| 2 Search and availability | Find real, available flats in registered societies | Portals, NoBroker, society Facebook/WhatsApp groups, local dealers | Irritation and cynicism: "Ghost Listings" [E7]; "100% … FAKE LISTED PROPERTIES with FAKE numbers" [E9] | Stale or ghost listings; brokers posing as owners; each enquiry sold to 4–15 brokers [P1-R] · 4 | **MoT 1: first call — is it real?** | **Verified-availability badge** (owner reconfirms every ≤7 days via WhatsApp; listings auto-expire); "Owner / authorised broker" label; capped contact sharing; filter by **Transferability** (registry status) | "Already sold" on first call <5% |
| 3 Visits and society evaluation | Judge the flat *and* the society | Weekend visits with a dealer; guard/RWA; look at the basement; talk to residents | "Looks fine in October. What about the monsoon?" | Waterlogging and outages are invisible off-season (51-hour outage at a Sector 107 society) [RS-AB]; maintenance hikes; RWA fights [E2] · 4 | **MoT 2: which society?** | **Waterlogging** evidence panel; **Society Health** (maintenance trend, AOA status, lift/fire compliance, resident reviews); AI visit checklist; labelled virtual staging of empty flats | % of visits with a society report viewed |
| 4 Document and title check | Confirm the flat can be transferred and financed | Ask for the chain (allotment → sale deed), OC, society NOC, TM status, loan statement; lawyer ₹10–50k; bank legal | Dread: "I can't even sell this flat because no one will buy an unregistered flat" [E3] | About 75k unregistered flats; builder dues block registry [RS-AB]; GPA chains; **forged foreclosure documents hid a ₹35.7 L loan** [E4]; builder resale NOC raised from ₹60k to ₹2.5 L [E11] · **5** | **MoT 3: before the token** | **Transferability check:** project-level flags (registry permission, authority dues, OC audit) plus a unit checklist with **AI document reading** (name/area/date mismatches), a **lender payoff letter and CERSAI step**, TM and NOC cost estimate. States are "OK / issue found / not checked", **never "title clear"**; lawyer sign-off tier | % of deals with a pre-token report; issues found per 100 |
| 5 Price and negotiation | Pay a fair price | Compare portal asks, the dealer's "rate", circle rate; offer and counter | "Am I being taken for a ride?" | Asking ≠ transaction price (Noida: listed ₹92 L, closed ₹85 L) [P1-SJ]; cash-component pressure (unquantified); the 110% circle-rate rule · 4 | **MoT 4: making the offer** | **Fair Price** range with comparables and confidence (no estimate where data is thin); negotiation brief (days on market, TM, repairs); flag below-circle or cash requests (PMLA) | Offers inside the range; acceptance rate |
| 6 Token and ATS | Secure the deal safely | Token (often 1–2% [unsourced]); ATS on stamp paper from the dealer's template | Fear the seller backs out or the token is lost | Token forfeiture disputes; ATS missing timelines and contingencies · 3 | Handing over the token | **ATS generator** with standard clauses (timeline, refund on title defect, loan contingency); escrow later (P2) | Fall-through after token |
| 7 Loan | Sanction and disbursal on time | Bank legal and technical checks, valuation | Worry about a valuation gap | Valuation below price; loans refused on unregistered or GPA flats [P1-BJ] · 4 | Sanction letter | **Loan pre-check** (registry status and valuation band); multi-lender (subject to LSP rules) | Days to sanction |
| 8 Registration and transfer | Become the owner in the Authority's books | Stamp duty via igrsup; TDS on Form 141 (formerly 26QB); Noida TM; society transfer; utilities | Relief, then "the flat's yours on paper but not in the Authority's books" [P1-BJ] | TM charges (2.5%+ of allotment price); TDS form changes from 1 Apr 2026; society fees [P1-SJ] · 3 | Registry day | **Deal room tracker**; TDS form helper; TM and society-transfer checklist | Days from token to registry; TM done within 30 days |

### 3.3 NRI buyer

| Stage | Goal | Actions and touchpoints | Thoughts and emotions | Pain points (evidence · sev) | MoT | Product opportunity | Success signal |
|---|---|---|---|---|---|---|---|
| 1 Decide remotely | Why buy, where, how much | Family calls, Gulf/US news, WhatsApp forwards | Nostalgia plus "I'll be cheated because I'm not there" [J] | Dependence on relatives and CPs · 3 | — | NRI primer (FEMA channels, TDS, repatriation of 2 properties) [P1-BJ] | Primer → shortlist |
| 2 Remote shortlist | A credible shortlist | YouTube, CP video calls, NRI expos | Fatigue across time zones | NRIs are "paying more… and getting less space" (41% loading) [P1-BJ] · 4 | — | **Delivery Risk** + **Transferability** reports; an async concierge in the user's time zone (English/Hinglish) | Reports per NRI session |
| 3 Verify remotely | Confidence without visiting | Relatives visit; CP videos | "Who do I trust?" | CP "site videos" are sales material; no independent check · 4 | **MoT 1: independent eyes on site** | **Verified video site visit** (time-stamped, geotagged, by a field partner); satellite progress | Paid verification uptake |
| 4 India trip and booking | Finish in a 2-week trip | Visits, booking, BBA, bank, all within days | Rushed | BBAs signed without review; pressure decisions · 4 | **MoT 2: booking during the trip** | Trip planner: documents pre-checked, BBA reviewed *before the flight*, bank slots | BBA reviewed pre-trip |
| 5 Payments and loan | Pay through compliant channels | NRE/NRO transfers; NRI loan; no cash allowed [P1-BJ] | "Did the builder receive it? Is it FEMA-compliant?" | Tracking payments across currencies; escrow not visible · 3 | Each remittance | **Payment ledger** matched to demand letters; FIRC and receipt vault | Unmatched payments = 0 |
| 6 POA and registration | Sign without travelling | Special POA, apostille or consulate, registration in India | "POA misuse is one of the most common ways NRIs lose money" [P1-BJ] | POA too broad, no expiry, misused · **5** | **MoT 3: POA scope** | **POA builder:** scoped, time-limited template, revoke reminders, activity log; consulate/notary guide (legal partner) | % of POAs scoped and time-limited |
| 7 Construction and possession by proxy | Track the build and take possession remotely | Builder emails, relatives; snagging impossible in person | "I am an NRI… I have paid up and have been chasing to get the allotment…" [E16] | Slow builder responses; remote snagging · 4 | **MoT 4: possession by proxy** | **Project Watch** + remote snagging (partner inspector, video report) | Snag report before handover |
| 8 Own, rent, exit | Rent it out, maintain, repatriate | PM firms at 8–10% of rent; 30% TDS on rent; 15CA/CB | "Once I agreed with single tenant, they stopped taking calls" [E17] | PM accountability; tax compliance · 3 | — | Rental estimate; vetted PM partners with proof of work; tax document vault; LDC reminder at exit | Retention; PM referrals |

### 3.4 Individual resale seller

| Stage | Goal | Actions and touchpoints | Thoughts and emotions | Pain points (evidence · sev) | MoT | Product opportunity | Success signal |
|---|---|---|---|---|---|---|---|
| 1 Decide and estimate net proceeds | Know what I'll actually pocket | Call a CA or dealer; check loan outstanding | "What do I get after loan, tax and brokerage?" | Two LTCG options (12.5% flat vs 20% indexed); 54/54EC deadlines; NRI withholding on the full value [P1-SJ] · 3 | — | **Net-proceeds and tax calculator** (LTCG comparison, 54/54EC, 1% TDS, NRI LDC flag) | Calculator → listing conversion |
| 2 Pricing | Set an asking price that sells | Dealers' "rate", portal asks, neighbours | Anchors on new-launch prices (+12% YoY) [P1-SJ] | Overpricing leaves it stale for months; underpricing loses lakhs · 4 | **MoT 1: setting the ask** | **Fair Price** (seller view) with comparables; later "expected time to sell at price X" | % of listings within the band |
| 3 Prepare and list | A complete, attractive listing | Phone photos; free portal listing; keys handed to 3–10 dealers | Low effort, low expectations [J] | Empty flats photograph badly; documents scattered · 2 | — | **AI listing builder:** enhanced photos plus *labelled* staging, floor plan, **document-readiness score** (pre-empts the buyer's Transferability check) | Listing completeness; readiness score |
| 4 Enquiries | Talk only to genuine buyers | Calls and WhatsApp | Harassed: "Free Ad Trap Zero Buyer Leads, Infinite Sales Team Harassment"; "They call ten times a day" [E7] | Owner contacts sold to brokers (99acres BOSS) [P1-SJ]; mismatched leads: "valued at ₹2.30 crore, several leads… had budgets of just ₹50 lakh to ₹1 crore" [E10] · 4 | **MoT 2: the first 48 hours after listing** | **Masked number + AI WhatsApp gatekeeper** (budget, loan pre-approval, timeline); brokers routed to a co-broke lane with the seller's consent | Share of genuine buyers in conversations; spam reports |
| 5 Showings | Few, productive visits | Weekend coordination; often tenant-occupied | Wasted weekends; worries about safety | Unproductive walk-throughs [P1-SJ] · 3 | — | Slot booking; OTP-verified visitors; video or 3D pre-tour to filter | Visits per offer |
| 6 Negotiation, token and ATS | Close at a fair price, safely | Calls via brokers; token; ATS | Fear of a lowball offer or the buyer backing out | Lowballs pushed by brokers [P1-SJ]; token disputes · 3 | **MoT 3: accepting an offer** | Offer comparison (price, loan status, timeline); ATS template | Time from offer to token |
| 7 Closing | Get paid; complete the transfer | Foreclose the loan, retrieve originals (RBI: 30 days or ₹5,000/day), society NOC (7–15 days), builder NOC, TDS, registry | Stress from juggling 6–10 parties | Builder NOC fee rose from ₹60k to ₹2.5 L: "We feel looted and cheated" [E11]; lost documents; TDS credit mismatches · 4 | **MoT 4: token to registry** | **Deal room:** shared checklist and timeline; RBI ₹5,000/day reminder; AI-drafted NOC request letters | Days from token to registry; fall-through |
| 8 Post-sale | Tax and reinvestment | ITR, 54/54EC, Form 16B/132 | "Did the TDS show up in my 26AS?" | Missed deadlines · 3 | — | Tax reminders; reinvestment journey (the seller becomes a buyer) | Rate of buying again |

### 3.5 Developer sales and marketing team

| Stage | Goal | Actions and touchpoints | Thoughts and emotions | Pain points (evidence · sev) | MoT | Product opportunity | Success signal |
|---|---|---|---|---|---|---|---|
| 1 Launch planning | Price, position, register | RERA registration, pricing, EOI design, CP briefing | Pressure on sales velocity and collections | NCR launches −14% YoY and Signature Global bookings −20%; the legacy trust deficit [P1-SJ] · 4 | — | Aggregated, anonymised demand signals from platform search (P2) | — |
| 2 Campaigns and compliance | Generate demand within the rules | Meta/Google, portal packages, CP creatives, hoardings | — | UP-RERA fined 91 developers ₹2.66 cr; HARERA opened suo motu proceedings in 2026; CPs make their own ads [P1-SJ] · 3 | — | **RERA-ad compliance checker** (AI D-06) | Fines = 0 |
| 3 Lead capture and pre-sales | Respond and qualify fast | CRM (Sell.Do, LeadSquared), telecallers at ₹15–25k/month, WhatsApp | "Leads leak" | 4–6 h to first response; 5-minute contact said to convert 8–10x better (vendor claim); duplicates [P1-SJ] · 4 | **MoT 1: the first 5 minutes** | **AI Hinglish voice/WhatsApp pre-sales agent**, de-duplication, CRM push, consent log (DPDP/TRAI) (AI D-01/D-03) | Median response time; qualified-lead % |
| 4 CP management | Use CPs without leakage or disputes | CP portal registration, attribution windows, payouts tied to collections | Friction with CPs | Attribution conflicts; opaque payouts make CPs "deprioritize projects" [P1-SJ] · 4 | **MoT 2: who owns this buyer?** | **Attribution ledger** (timestamped, visible to both sides) | Disputes per 100 bookings |
| 5 Site visit and closing | Convert visits | Experience centre, cab pickups, sample flat, closing managers | Frustrated by buyer suspicion | Buyers ask for proof of delivery that the developer cannot show credibly [J] · 3 | **MoT 3: "why should I trust you?"** | **Developer trust page**, earned and not bought (on-time history, QPR compliance, right of reply) (AI D-09) | Visit → booking |
| 6 Booking, KYC and BBA | Book cleanly | KYC/PMLA, allotment, BBA | — | Manual KYC; cancellations; CP clawbacks · 3 | — | e-KYC; document Q&A bot | Days from booking to BBA |
| 7 Post-booking | Collect on time; keep buyers calm | Demand letters, QPR filings, construction updates | Swamped by "is it stalled?" calls | Late payments; QPR penalties; anxious buyers [P1-SJ] · 4 | **MoT 4: every demand letter** | **AI construction digests with photo evidence**, payment links, QPR filing assistant (AI D-07/D-08) | Collection efficiency; inbound queries per booking |
| 8 Possession and handover | Deliver, get the OC, hand over to the RWA | OC, possession offers, snagging, registry, AOA handover | Exposure to complaints | Delay-interest orders (10.8% to 26 buyers) [E6]; OC audit scrutiny; maintenance disputes · 4 | **MoT 5: possession** | Snag ticketing; handover data room | Snags closed within SLA |

### 3.6 Broker / channel partner

| Stage | Goal | Actions and touchpoints | Thoughts and emotions | Pain points (evidence · sev) | MoT | Product opportunity | Success signal |
|---|---|---|---|---|---|---|---|
| 1 Supply sourcing | Inventory and mandates | Developer empanelment (RERA agent registration), owner listings, society networks, paid owner-contact unlocks | Competitive scramble | Open mandates; owners hostile after spam · 3 | — | Broker workspace: verified listings with co-broke terms (AI C-01/C-06) | Listings per broker |
| 2 Lead generation | Buyers | Portal packages at ₹4k–60k/month, Meta ads, WhatsApp groups | Cynical about portals: "47 leads that were all labourers or wrong numbers" [E18] | Each lead sold to 4–15 brokers; 1–4% conversion [E18] · 4 | — | **Capped-share leads** (≤2 brokers) or pay per qualified visit (P1) | Cost per qualified visit |
| 3 Lead handling | Reach the buyer first and qualify | Calls, WhatsApp | "The one who calls in two minutes usually wins it" [E18] | Speed race; no CRM · 4 | **MoT 1: the first 2 minutes** | AI assistant replies instantly for the broker and books the visit (AI C-03/C-04) | Response time |
| 4 Client management and visits | Keep the client; avoid poaching | Register the client with the developer; accompany visits | Fear the developer or another CP will take the client | Attribution windows; clients going direct [P1-SJ] · 4 | **MoT 2: client registration** | Timestamped client registration and visit proof (shared ledger with the developer) | Disputes |
| 5 Advisory and closing | Help the client decide; close | Compare projects; negotiate | "Clients think I'm biased" [J] | Trust deficit · 3 | **MoT 3: client asks "is this builder safe?"** | **Shareable, uneditable Delivery Risk / Transferability reports**, cost normaliser, co-branded comparison sheets | Close rate |
| 6 Commission | Get paid | Invoice; payout tied to collection milestones; clawback on cancellation; GST/TDS | Cash-flow stress | Payout delays and opacity; clawbacks [P1-SJ] · 4 | **MoT 4: payout** | **Payout tracker** (milestones, expected date). Needs developer integration | Days to payout |
| 7 Repeat business and reputation | Referrals | WhatsApp status, informal reviews | — | No portable reputation · 2 | — | Verified broker profile with a record of closed deals and client reviews | Referral share |

**Evidence gaps by journey:** No first-person CP voices on payout disputes were found (consumercomplaints.in searches returned nothing relevant). NRI first-person evidence is thin (two complaint snippets). Developer-team pains rest on vendor blogs. All three are priorities for interviews.

---

## 4. Cross-journey views

### 4.1 Top 15 moments to delight or prevent harm

Score = Severity × Frequency (across our target users) × Ability to solve with product, data and AI (each 1–5). All scores are [J], informed by the evidence cited in §3.

| # | Moment | Actor(s) | S | F | A | Score | Product response | Key evidence |
|---|---|---|---|---|---|---|---|---|
| 1 | Choosing the builder/project before EOI or booking | UC, NRI | 5 | 5 | 4 | **100** | Delivery Risk report + comparison + HARERA-order summaries | 98% want delivery assurance; warning signs come 15 months–6 years early [RS-DD] |
| 2 | Seeing the true all-in cost when the cost sheet is in hand | UC, NRI | 4 | 5 | 5 | **100** | Cost-sheet normaliser (₹/carpet sq ft, loading, negotiable items) | 20–35% above base; 41% loading [P1-BJ] |
| 3 | Is this flat transferable, before the token? | Resale, NRI, seller | 5 | 4 | 4 | **80** | Transferability check + document AI + CERSAI/payoff step | 75k unregistered; forged foreclosure [E3, E4] |
| 4 | "Is my project on track?" (quarterly) | UC, NRI | 4 | 5 | 4 | **80** | Project Watch: QPR + satellite + alerts | 158 "QPR not uploaded" [RS-DS]; [E15] |
| 5 | The first 48 hours after a seller lists | Seller | 3 | 5 | 5 | **75** | Masked number + AI gatekeeper | [E7, E8, E10] |
| 6 | The first 2–5 minutes after a lead arrives | Developer, CP | 3 | 5 | 5 | **75** | AI pre-sales/broker assistant | 4–6 h response time; "calls in two minutes" [E18] |
| 7 | Possession day: OC, snags, final demand, delay interest | UC, NRI | 4 | 4 | 4 | **64** | Possession assistant + delay-interest calculator | [E1, E5, E6] |
| 8 | Token to registry: NOCs, loan release, TDS, TM | Resale, seller | 4 | 4 | 4 | **64** | Deal room + checklist | 13 hand-offs; NOC ₹2.5 L [E11] |
| 9 | CP client registration and attribution | Developer, CP | 4 | 4 | 4 | **64** | Shared attribution ledger | [P1-SJ] |
| 10 | Loan eligibility and lender-approved project before committing | UC, resale | 4 | 4 | 4 | **64** | Loan pre-check; subvention explainer | Subvention scam; unregistered flats refused loans |
| 11 | Agreeing the price (buyer's offer, seller's ask) | Resale, seller | 4 | 5 | 3 | **60** | Fair Price range + negotiation brief | ₹92 L asked → ₹85 L closed [P1-SJ] |
| 12 | Is this listing real and available? | Resale | 3 | 5 | 4 | **60** | Verified-availability badge | "Ghost Listings"; "FAKE LISTED" [E7, E9] |
| 13 | Choosing the payment plan (CLP/flexi/subvention) | UC | 5 | 3 | 4 | **60** | Payment-plan simulator scaled by Delivery Risk | [E14]; 22 CBI FIRs |
| 14 | Which society? (flooding, maintenance, governance) | Resale, UC at possession | 4 | 5 | 3 | **60** | Waterlogging + Society Health profiles | 51-hour outage; +90% CAM; RWA fights [E2, E19] |
| 15 | Net proceeds and tax (incl. NRI LDC) | Seller | 3 | 4 | 5 | **60** | Net-proceeds and tax calculator | [P1-SJ] |

Just outside the top 15: NRI POA scope (5×3×3 = 45; P1 because it needs a legal partner), RERA-ad pre-flight (40), labelled virtual staging as a *delight* moment (2×4×5 = 40; cheap and visible, so still P0), delay-interest claim after possession (36; folded into #7), CP payout tracking (36).

### 4.2 Where the risk scores appear and which decision each one changes

| Score | UC buyer | Resale buyer | NRI | Seller | Developer | Broker/CP | Decision it changes |
|---|---|---|---|---|---|---|---|
| **Delivery Risk** (developer + project) | Search card → project report (S3) → payment-plan simulator (S5) → Project Watch trend and alerts (S7) → possession forecast (S8) | Recent projects only (registry/OC context); resale of UC allotments | As UC, with email digests and higher alert sensitivity | Seller of an allotment: price impact and disclosure | Developer profile, right-of-reply portal, "what would improve this" | Shareable, uneditable report in client conversations | Which builder to shortlist; UC vs ready-to-move; CLP vs flexi vs subvention; exit or complain early when the trend worsens |
| **Transferability** | At possession/registry: conveyance readiness, authority dues | Listing filter (project level) → pre-token report (unit level) → loan pre-check | Before signing the POA and remitting | Document-readiness score before listing | (Registry permission status of their projects) | Listing-quality badge | Pay the token or walk away; renegotiate (deduct TM, NOC, dues); demand specific documents; choose a lender |
| **Waterlogging** | Project report for corridor sectors with pending drainage (e.g., Sectors 68–115, single-source claim [RS-AB]) | Society page and map layer; visit checklist ("ask about Sep 2025") | Same | Right of reply: upload mitigation (raised switchgear, sump pumps) | Mitigation disclosure | — | Which society, tower or floor; basement parking; budgeting for power backup |
| **Society Health** | First maintenance bill, RWA handover (S9) | Core at S3 | Remote landlords: running costs | Price narrative; residents can correct it | Handover quality reflects on the developer's score | — | Which society; budgeting running costs; whether and how to organise the RWA |
| **Fair Price** | Launch price vs resale in the same corridor; effective price after incentives | Offer (S5) | Same | Ask (S2) | (Aggregate only) | Pitching clients | Offer and ask price; walk away; time-to-sell trade-off |

Guardrails for every score, from the risk-score research [RS-UX]:
- **Format.** Show bands with labels, a natural frequency, up to 4 reasons, a "not enough data" state and the model version.
- **Wording.** Never say "certified" or "title clear".
- **Independence.** No developer can pay to influence a score, there is a published dispute route, and same-day notice is given on downgrades.
- **AI imagery.** Staging and AI images always carry a label (IT Rules 2026).

---

## 5. Product recommendations

Priority: P0 = MVP, P1 = next, P2 = later. Effort: S ≈ under 4 weeks, M ≈ 1–3 months, L ≈ over 3 months for a very small team [J]. "AI x-nn" refers to feature IDs in `ai_product_strategy.md`.

| ID | Recommendation | User/actor | Problem solved | Priority | Platform | Effort | Dependencies / risks |
|---|---|---|---|---|---|---|---|
| CJ-01 | **Delivery Risk report** per developer/project: band, natural frequency, 4 reasons, evidence links, "what would change it", right-of-reply status | UC, NRI, CP | Builder choice blind spot (MoT #1) | P0 | Both | L | HARERA/UP RERA pipeline; published methodology; lawyer review; defamation and conflict-of-interest firewall |
| CJ-02 | **Cost-sheet normaliser**: photo or PDF of the quote → all-in ₹/carpet sq ft, loading %, negotiable items | UC, NRI, CP | 20–35% hidden cost (#2) | P0 | Both + WhatsApp | S | Rates table maintenance; OCR accuracy (AI B-06) |
| CJ-03 | **Transferability check**: project-level flags + unit document checklist + AI document reading + CERSAI/payoff step; "not checked" states; optional lawyer sign-off | Resale, NRI, seller | Unregistered or encumbered flats; fraud (#3) | P0 | Both | M | Authority dues lists; lawyer partner network; liability wording; PI insurance (AI B-05) |
| CJ-04 | **Verified availability and identity on listings**: weekly WhatsApp reconfirmation, auto-expiry, owner vs authorised-broker label | Resale, seller, CP | Ghost listings (#12) | P0 | Both + WhatsApp | M | Owner responsiveness; broker co-operation |
| CJ-05 | **Seller gate**: masked number + AI WhatsApp pre-qualification (budget, loan status, timeline) + co-broke lane | Seller | Spam and junk leads (#5) | P0 | WhatsApp + app | M | DPDP consent; WhatsApp template costs (AI S-04) |
| CJ-06 | **Fair Price range** (buyer and seller views) with comparables, confidence and refusal when data is thin | Resale, seller | Mispricing (#11) | P0 in GNW/Noida if data is licensed, else P1 | Both | L | PropEquity/Liases Foras licence; back-testing; Zillow-style overconfidence risk (AI S-01, B-07) |
| CJ-07 | **Project Watch**: QPR parsing, satellite and photo timeline, delay trend, alerts; open to buyers who booked anywhere | UC, NRI, CP | Chronic anxiety; late warning (#4) | P0 | App + WhatsApp | M | QPR coverage; satellite cadence; alert fatigue (AI B-10/B-11) |
| CJ-08 | **Hinglish WhatsApp assistant** grounded in our data, with a human handoff | All demand actors | Language and channel fit; instant answers | P0 | WhatsApp + both | M | Groundedness bar; Meta policy (AI B-01/B-02) |
| CJ-09 | **Affordability stress test and resale all-in calculator** | UC, resale | EMI shock after the rate hike | P0 | Both | S | Framed as arithmetic, not advice |
| CJ-10 | **Loan pre-check**: eligibility, lender-approved project, registry/valuation risk, subvention explainer | UC, resale, NRI | Loan refusal; subvention traps (#10, #13) | P0 | Both | M | Lender/DSA partnerships; RBI digital-lending/LSP rules |
| CJ-11 | **Seller net-proceeds and tax calculator** (LTCG options, 54/54EC, TDS, NRI LDC flag) | Seller, NRI seller | Unknown net proceeds (#15) | P0 | Web (SEO) + app | S | Tax-rule versioning (IT Act 2025 renumbering) |
| CJ-12 | **Developer right-of-reply and correction portal** (submit evidence; cannot pay to change a score) | Developer | Legal defensibility; trust | P0 | Web | M | Editorial process; SLA; audit log |
| CJ-13 | **Labelled AI staging and listing builder** for sellers, plus a document-readiness score | Seller, CP | Poor listings; slow diligence | P0 (staging), P1 (readiness) | App | S | IT Rules labelling; before/after toggle (AI B-03, S-02/S-03) |
| CJ-14 | **Shareable, uneditable report links for brokers** (co-branded) | CP | Credibility gap; viral distribution | P0 | Both + WhatsApp | S | Brokers must not be able to cherry-pick or alter |
| CJ-15 | **Deal room**: token-to-registry checklist and timeline per authority (Noida TM, society NOC, RBI release, Form 141), shared with parties | Resale, seller, CP | 13 hand-offs; fall-through (#8) | P0 checklist; P1 multi-party | Both | M | Authority processes change; human coordinator for disputes (AI S-07, C-05) |
| CJ-16 | **Payment-plan simulator and BBA clause checker** against the RERA model agreement | UC, NRI | Plan and contract traps (#13) | P1 | Web | M | Flags only; lawyer upsell; liability |
| CJ-17 | **Possession assistant**: OC check against the audit list, AI snag list, final-demand check, delay-interest calculator and complaint draft | UC, NRI | Possession-day harm (#7) | P1 | App | M | Partner snagging inspectors; "information, not legal advice" (AI B-09) |
| CJ-18 | **Waterlogging and Society Health profiles** (evidence-led; residents contribute bills and outages) | Resale, UC, seller | Invisible running costs and flood risk (#14) | P1 (waterlogging panel for launch societies at P0) | Both | M | Seller/RWA pushback; dispute process; moderation |
| CJ-19 | **Developer AI pre-sales agent** (Hinglish voice/WhatsApp, CRM push, consent log) | Developer | Leaked leads (#6) | P1 | Web console + WhatsApp/voice | M | B2B sales cycle; TRAI/DPDP; must sit outside the scoring team (AI D-01) |
| CJ-20 | **Broker copilot**: instant replies, capped-share leads, pipeline, follow-ups | CP | Junk shared leads; speed race (#6) | P1 | App + WhatsApp | M | Lead economics; broker adoption (AI C-02–C-04) |
| CJ-21 | **NRI remote kit**: verified video site visit, scoped POA builder, payment ledger, remote snagging | NRI | Remote verification; POA misuse | P1 | Both | M | Field-partner network (ops-heavy); legal partner |
| CJ-22 | **Attribution ledger and payout tracker** shared by developer and CP | Developer, CP | Disputes; payout opacity (#9) | P2 | Web | L | Developer integration; CRM APIs |
| CJ-23 | **RERA-ad compliance checker** | Developer, CP | Fines | P1 | Web | S | Rules differ by state (AI D-06) |
| CJ-24 | **AI construction digests for developers' buyers** | Developer | Post-booking anxiety load | P2 | WhatsApp | M | Must not be confused with our independent Project Watch (AI D-07) |
| CJ-25 | **Future value, rental and liquidity estimates** with ranges | UC, NRI, B3 | Neglected investment questions | P1 | Both | L | Data; model risk; no personalised advice (AI B-07) |
| CJ-26 | **Visit scheduler with OTP-verified visitors** | Seller | Unproductive or unsafe showings | P1 | App + WhatsApp | S | KYC-lite friction (AI S-05) |

---

## 6. Open questions for the founder

1. **What is our role in the deal?** If we act as a RERA agent paid commission on developer inventory, buyers will question Delivery Risk scores on the projects that pay us. Will we commit publicly to "scores are never sold", disclose commissions on every report and separate the teams?
2. **Which journey leads at launch:** Gurugram UC (MoT #1/#2, Project Watch) or GNW resale (MoT #3/#12, deal room)? They need different supply, data and trust proofs.
3. **Where do humans sign off?** Do we hire an in-house lawyer or build a partner panel for Transferability and BBA checks, and at what price (e.g., ₹2–5k per report [J])? Who carries liability, and do we buy professional indemnity cover?
4. **Field operations:** do we accept a thin field layer (video site visits, snagging inspectors, document pickup) for NRIs and possession, or partner and stay asset-light?
5. **Brokers:** capped-share leads, co-broking on owner listings, a free broker workspace? Do we allow brokers to list, and on what verification terms?
6. **Seller monetisation:** a success fee (e.g., 0.5–1% [J]) vs free tools plus a loan or legal upsell? Prepaid plans are what sellers resent most [E7–E10].
7. **Data budget:** will we license transaction data for Fair Price at launch, or hide Fair Price until coverage is adequate?
8. **Off-book cash:** will we refuse to facilitate deals with a cash component, given PMLA reporting-entity status?
9. **Stalled-project owners:** serve them (claims, NCLT tracking, resale of stuck allotments) as an early high-engagement segment, or exclude them to avoid distress-sale liability?
10. **Language at launch:** a full Hindi UI, or Hinglish chat only with an English UI?
11. **Resident data:** do we pursue RWA partnerships at launch to seed Society Health and waterlogging, accepting pushback from builder-controlled RWAs [E2]?
12. **Research gap:** will you fund 20–30 interviews (UC buyers, GNW buyers, sellers, CPs, 2 developers) and a manual Reddit/Team-BHP review before PRD sign-off? First-person forum evidence is still missing after two research phases.

---

## Appendix A. New evidence register (all accessed 18 Oct 2026)

| ID | Source and date | What it shows |
|---|---|---|
| E1 | ThePrint ground report, 31 Jul 2026: https://theprint.in/ground-reports/gurugrams-oc-scam-how-an-official-certificate-leaves-buyers-stuck-in-unfinished-homes/3001654/ | Subroto Biswas (Sector 102, booked 2019, possession 2024): "Everything looks perfect on paper and even in the Occupancy Certificate, but on the ground we struggle for basic facilities". Another resident: "Builders and authorities know that residents cannot fight for a long time" |
| E2 | ThePrint ground report, 18 Aug 2026: https://theprint.in/ground-reports/own-a-flat-but-have-no-say-gurugram-residents-are-fighting-for-rwa-membership/3017820/ | Satyanand Shukla (Urban Homes 2, Sector 86): "We have invested so much money and our lifetime savings, yet we do not have the right to make decisions in our own society". 1,045 owners without membership |
| E3 | ThePrint, 17 Dec 2024: https://theprint.in/the-fineprint/noida-greater-noida-home-buyers-struggle-for-registry-big-players-remain-shy/2406593/ | Pankaj Rai (Ajnara Homes, GNW; ₹80 L, 6 years unregistered): "I can't even sell this flat because no one will buy an unregistered flat"; "this will be the last" high-rise |
| E4 | ThePrint/PTI, 19 Aug 2026: https://theprint.in/india/delhi-couple-arrested-for-selling-rs-1-10-cr-gurugram-flat-using-forged-documents/3019769/ | A ₹1.10 cr Gurugram flat sold with forged foreclosure documents and a fake bank NOC; ₹35.7 L loan still outstanding; detected by the buyer's bank |
| E5 | ThePrint, 24 Sep 2026: https://theprint.in/india/accepting-delayed-flat-possession-does-not-bar-homebuyer-from-claiming-interest-allahabad-hc/3051815/ | Antriksh Golf View (Sector 78, Noida): due Nov 2012, possession offered May 2017. Allahabad HC held that accepting possession does not bar a claim for delay interest |
| E6 | The Tribune, order of 29 Sep 2026: https://www.tribuneindia.com/news/gurugram/gurugram-harera-directs-builder-to-pay-10-8-delay-interest-to-26-kavyam-homebuyers/ | HARERA: Agrante's Kavyam (Sector 108; due Aug 2023) to pay 10.8% delay interest to 26 buyers; COVID/ban defences rejected |
| E7 | Trustpilot, 99acres (1.2/5, 134 reviews): https://www.trustpilot.com/review/99acres.com | Oct 2026 reviews: "Free Ad Trap Zero Buyer Leads, Infinite Sales Team Harassment"; "They call ten times a day"; "Ghost Listings" |
| E8 | Trustpilot, MagicBricks (1.1/5, 291 reviews): https://www.trustpilot.com/review/magicbricks.com | 8 Oct 2026: "Zero property visits. Zero meaningful buyer leads. Zero proactive communication." Free listings throttled to force upgrades |
| E9 | Trustpilot, Housing.com (1.1/5, 165 reviews): https://www.trustpilot.com/review/housing.com | 7 Aug 2026: "100% of properties i selected and contacted are FAKE LISTED PROPERTIES with FAKE numbers"; Aug 2026: "almost two months… ZERO properties that match my requirements" |
| E10 | Trustpilot, NoBroker (rating removed for guideline breach; 4,574 reviews): https://www.trustpilot.com/review/nobroker.in | Seller, Oct 2026: "Despite the property being valued at ₹2.30 crore, several leads shared had budgets of just ₹50 lakh to ₹1 crore"; "waiting 50 days, not even a single property visit" |
| E11 | consumercomplaints.in, 9 Jun 2022: https://www.consumercomplaints.in/panchsheel-group-abnormal-charges-on-issuing-noc-c3211052 | Panchsheel Hynish (GNW): builder NOC for resale raised from about ₹60k to ₹2.5 L; "We feel looted and cheated" |
| E12 | consumercomplaints.in search "possession delay gurgaon" (70 complaints): https://www.consumercomplaints.in/?search=possession+delay+gurgaon | A recurring pattern from 2010–2026: BPTP Spacio (booked 2010), Imperia Esfera, Raheja Revanta, Ansal Fernhill, a Vatika plot (Feb 2026) |
| E13 | consumercomplaints.in, Imperia: https://www.consumercomplaints.in/imperia-structures-limited-b103050 | 30 Oct 2025: invested in 2015, no possession and no assured returns; Jul 2023: maintenance billed before allocation or possession |
| E14 | consumercomplaints.in, M3M (undated): https://www.consumercomplaints.in/bycompany/m3m-india-pvt-ltd-a397559/page/2 | "It was told at the time of booking the unit that m3m will pay the emi until possession but the fact is i am paying the e[mi]…" (subvention) |
| E15 | consumercomplaints.in, Godrej Summit, 5 Dec 2017: https://www.consumercomplaints.in/godrej-properties-b109276/page/30 | "once you are done with the payment nobody bothers to answer your query" (older; pattern evidence) |
| E16 | consumercomplaints.in search "NRI gurgaon flat" (undated): https://www.consumercomplaints.in/?search=NRI+gurgaon+flat | "I am an NRI and purchased a 3 BHK flat in DLF NTH 86, Gurgaon. I have paid up and have been chasing to get the allotment…" |
| E17 | consumercomplaints.in, NoBroker NRI PMS plan, 12 Apr 2024: https://www.consumercomplaints.in/nobroker-b115732/page/13 | NRI paid ₹19,308; after one tenant was agreed, "they stopped taking calls" (excerpt truncated) |
| E18 | ClosingFox, 31 Jul 2026: https://closingfox.com/for-business-owners/99acres-vs-magicbricks-vs-housing/ | Broker reports: 4–15 brokers per lead; 1–4% conversion; "47 leads that were all labourers or wrong numbers"; "The one who calls in two minutes usually wins it" |
| E19 | Lapaas Voice, 5 Oct 2026: https://lapaasvoice.com/gurugram-township-maintenance-fee-rises-90 | The Westerlies (Sector 108): CAM ₹10 → ₹19 (+90%); 15-day RWA ultimatum demanding audited accounts |

Not usable: reddit.com and old.reddit.com (tool domain block), quora.com (403), hindustantimes.com and timesofindia.indiatimes.com (blocked), Bing (irrelevant results), DuckDuckGo (CAPTCHA, not attempted further), Mojeek (403). YouTube comments are not in page HTML. I did not use third-party Reddit mirrors.

## Appendix B. Reused research notes
- [P1-BJ] `/Users/macbook/code/Real Estate/research_notes/Delhi NCR AI real estate platform/buyer_journey.md`
- [P1-SJ] `/Users/macbook/code/Real Estate/research_notes/Delhi NCR AI real estate platform/seller_journeys.md`
- [P1-R] `/Users/macbook/code/Real Estate/reports/Delhi NCR AI real estate platform.md`
- [RS-AB] `/Users/macbook/code/Real Estate/research_notes/Developer and project risk scoring/additional_buyer_risk_scores.md`
- [RS-DD] `.../delay_drivers_and_failure_signals.md`; [RS-UX] `.../legal_risk_and_score_ux.md`; [RS-DS] `.../ncr_risk_data_sources.md` (same folder)
