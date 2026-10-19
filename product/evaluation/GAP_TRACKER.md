# Design gap tracker (from buyer, developer, broker evaluations)

The founder decided to close ALL gaps, backlog included, before coding. Status as of 19 Oct 2026: every package except C3 is closed (review notes in `product/design/review/`). Work packages:

| Package | Scope |
|---|---|
| **A** | Consistency, buyer project fixes, developer workspace |
| **B1** | Broker layer and all broker gaps |
| **B2** | Claims vs records (10x) |
| **B3** | Site-visit co-pilot and Pay-as-built (10x) |
| **B4** | Since you last looked and Family circle (10x) |
| **C1** | Trust, onboarding, pricing |
| **C2** | Project page round 2 |
| **C3** | Search, compare, cost, visualise and AI round 2 |
| **C4** | Developer round 2 |

G-26 (Hindi forwards) is handled under English-first by plain-English cards; it is flagged to the founder.



| Perspective | ID | Severity | Gap | Status |
|---|---|---|---|---|
| Buyer | G-01 | Critical | No "before you pay" check (F-41, in R1 scope) | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Buyer | G-02 | Critical | Project pages don't describe the homes | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Buyer | G-03 | Critical | Facts contradict each other across surfaces | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Buyer | G-04 | Critical | "Can we afford the wait?" is not answered (F-12, in R1 scope) | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Buyer | G-05 | High | Hard states have no designs | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Buyer | G-06 | High | The band isn't translated into "when do we get keys?" | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Buyer | G-07 | High | Pending facts and data age are hidden from buyers | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Buyer | G-08 | High | No "so what do we do?" after the band | Closed · fix-project2 |
| Buyer | G-09 | High | Nothing says who Plinth is or whether it has been right | Closed · fix-trust |
| Buyer | G-10 | High | The site visit is not a service yet | Closed · fix-visitpay |
| Buyer | G-11 | High | No sign-in, onboarding or account linking | Closed · fix-trust |
| Buyer | G-12 | High | The free/Pro line is undefined and already contradicts the screens | Closed · fix-trust |
| Buyer | G-13 | High | Families can't decide together | Closed · fix-since-family |
| Buyer | G-14 | High | No payment-plan or subvention explainer before booking | Closed · fix-project2 |
| Buyer | G-15 | High | Nothing about loans in R1, at a 75–80% loan | Closed · fix-project2 |
| Buyer | G-16 | High | Pre-RERA delivery history is invisible | Closed · fix-project2 |
| Buyer | G-17 | High | No path for an NRI | Closed · fix-project2 |
| Buyer | G-18 | High | Too much jargon and too much page | Closed · fix-project2 |
| Buyer | G-19 | Medium/Low | Follow can't tell a browser from a booked buyer | Closed · fix-since-family |
| Buyer | G-20 | Medium/Low | The R1 scope isn't stated; screens imply partners that don't exist yet | Closed · fix-trust |
| Buyer | G-21 | Medium/Low | The app shows the quoted price; the web shows all-in | C3 (running) |
| Buyer | G-22 | Medium/Low | The headline all-in is one unit's price, not the project's | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Buyer | G-23 | Medium/Low | Confidence and state labels are ambiguous | Closed · fix-project2 |
| Buyer | G-24 | Medium/Low | No designed AI answers for edge questions | C3 (running) |
| Buyer | G-25 | Medium/Low | Thin negotiation context | C3 (running) |
| Buyer | G-26 | Medium/Low | Hindi-only parents can't read forwards | C3 (running) |
| Buyer | G-27 | Medium/Low | Older parents struggle with the instruments | Closed · fix-project2 |
| Buyer | G-28 | Medium/Low | No cost-sheet upload in the app, although the PRD puts it in the R1 app | C3 (running) |
| Buyer | G-29 | Medium/Low | Compare covers half the decision | C3 (running) |
| Buyer | G-30 | Medium/Low | No way to request an uncovered project | C3 (running) |
| Buyer | G-31 | Medium/Low | The all-in leaves out costs paid at possession | C3 (running) |
| Buyer | G-32 | Medium/Low | WaCost gives two retention promises in one chat | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Buyer | G-33 | Medium/Low | Progress is per phase, but buyers pick a tower | Closed · fix-project2 |
| Buyer | G-34 | Medium/Low | Visualise assumes a bare room UC buyers rarely see | C3 (running) |
| Buyer | G-35 | Medium/Low | Flooding, a stated New Gurugram fear, is invisible | Closed · fix-project2 |
| Buyer | G-36 | Medium/Low | Search quietly widens "low delivery risk" to Low or Moderate | C3 (running) |
| Buyer | G-37 | Medium/Low | The AI has four names | C3 (running) |
| Buyer | G-38 | Medium/Low | Prototype controls sit inside the product UI | C3 (running) |
| Buyer | G-39 | Medium/Low | The 0-results state gives no guidance | C3 (running) |
| Buyer | G-40 | Medium/Low | Nothing about selling before possession | Closed · fix-project2 |
| Buyer | G-41 | Medium/Low | Possession expectations aren't set | Closed · fix-project2 |
| Developer | G01 | Critical | The portal is a dispute desk, not a workspace. A developer sees obligations only | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Developer | G02 | Critical | Consented enquiries and visits dead-end at the developer | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Developer | G03 | High | No route into the developer's CRM | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Developer | G04 | High | No showcase for good developers beyond "copy link" | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Developer | G05 | High | Advance notice applies only to moves into High or Severe. Other moves reach developer and buyers at the same moment | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Developer | G06 | High | Disputes are slow, narrow and capped regardless of size | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Developer | G07 | High | The project page carries none of the developer's product | Closed · fixpass-consistency / fixpass-buyer / fixpass-developer |
| Developer | G08 | High | No legal-notice intake and no designed facts-only fallback | Closed · fix-dev2 |
| Developer | G09 | High | Onboarding and claiming are not designed, yet S1 requires notice | Closed · fix-dev2 |
| Developer | G10 | High | Construction updates are deferred to R3, with no phone capture | Closed · fixpass-developer + fix-dev2 |
| Developer | G11 | Medium-High | Complaint counts are absolute, which penalises large developers on screen | Closed · fixpass-developer + fix-dev2 |
| Developer | G12 | Medium-High | No stated position on channel partners | Closed · fix-broker |
| Developer | G13 | Medium | No buyer signals or analytics | Closed · fix-dev2 |
| Developer | G14 | Medium | The tone toward developers reads as adversarial | Closed · fix-dev2 |
| Developer | G15 | Medium | No path back and no turnaround evidence | Closed · fix-dev2 |
| Developer | G16 | Medium | The developer can't respond where buyers hear the news | Closed · fix-dev2 |
| Developer | G17 | Medium | No launch support | Closed · fix-dev2 |
| Developer | G18 | Medium | Search and compare consequences are not explained to developers | Closed · fix-dev2 |
| Developer | G19 | Low-Med | Developer surfaces are desktop-only, with no WhatsApp notifications | Closed · fix-dev2 |
| Developer | G20 | Low | The public "unclaimed" or "no response" state is undesigned | Closed · fix-dev2 |
| Broker | BG-01 | Critical | R1 has no broker layer, but the plan needs brokers in R1 | Closed · fix-broker |
| Broker | BG-02 | Critical | UC visit booking bypasses the buyer's agent, and the R1 visit route is undecided | Closed · fix-broker |
| Broker | BG-03 | High | "Who pays whom" (F-23, R1) is undefined for agents | Closed · fix-broker |
| Broker | BG-04 | High | Agents lose contact with buyers mid-deal | Closed · fix-broker |
| Broker | BG-05 | High | The cap mechanics penalise agents and buyers | Closed · fix-broker |
| Broker | BG-06 | High | No published introduction or dispute rules | Closed · fix-broker |
| Broker | BG-07 | High | Resale-desk economics and payment are undefined | Closed · fix-broker |
| Broker | BG-08 | High | No mandate shield against Plinth's owner-direct channel or desk | Closed · fix-broker |
| Broker | BG-09 | High | Bands hit brokers' inventory, with no guidance or evidence route for agents | Closed · fix-broker |
| Broker | BG-10 | High | Agents get no consented buyer brief | Closed · fix-broker |
| Broker | BG-11 | Medium-High | The agent check and verification tiers are not designed | Closed · fix-broker |
| Broker | BG-12 | Medium | Copy casts brokers as the enemy and hides future broker revenue | Closed · fix-broker |
| Broker | BG-13 | Medium | "Talk to our team" implies an in-house brokerage | Closed · fix-broker |
| Broker | BG-14 | Medium | Keeping listings fresh is a heavy burden | Closed · fix-broker |
| Broker | BG-15 | Medium | No WhatsApp listing intake | Closed · fix-broker |
| Broker | BG-16 | Medium | No agent profile, badge or reviews | Closed · fix-broker |
| Broker | BG-17 | Medium | No rules or kit for agents sharing risk cards | Closed · fix-broker |
| Broker | BG-18 | Medium | No policy on agents listing bottom-band projects | Closed · fix-broker |
| Broker | BG-19 | Medium | How owner and agent listings are fed and ranked is unclear | Closed · fix-broker |
| Broker | BG-20 | Medium (High at R2) | No defences against brokers gaming the system | Closed · fix-broker |
| Broker | BG-21 | Medium | The supply plan's CP features don't survive D1 | Closed · fix-broker |
| Broker | BG-22 | Low | Agents who use Plinth in R1 can't identify themselves | Closed · fix-broker |
