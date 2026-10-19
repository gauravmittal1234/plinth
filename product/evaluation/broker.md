# Plinth R1 design: the broker's view

**Reviewers:** a channel strategist who has run broker and channel-partner (CP) networks in Delhi NCR, working with a product designer.
**Date:** 18 Oct 2026.
**Scope:** the completed R1 design (29 artboards), plus PRD v1.0 §4, §7.3, §8.3, §8.7, §8.8, §12, §13, §15. Inputs: supply-side, international scout and competitor teardown.

All names are fictional. Our judgement is marked **[J]**. Evidence cites the artboard and element, or "no screen".

---

## 1. Verdict

1. **R1 has nothing for brokers, and its copy leans hostile.** The one broker-shaped flow, the WhatsApp site-visit booking for under-construction (UC) projects, sends the buyer straight to the developer's site office with a Plinth visit code. That can cost a CP the tag on a client they brought in. [J]
2. **Reactions differ by broker type:**
   - Resale dealers like Sunil ignore R1 and will see R2 as a threat: owner-direct listings, the 1% resale desk and permanent masking.
   - New-launch CPs like Priya see a threat with no upside, because D1 rules out any CP role for Plinth.
   - Young registered agents like Kabir see early value: credibility, content to share, and rivals can't outspend them.
3. **The buyer-first rules are not the problem.** An exclusive, consented, capped introduction is the best lead a broker ever gets. The problem is that the rules were written only from the buyer's side. Brokers are left with no way to stay in touch past 30 days, no money rules and no protection for their mandates. [J]
4. **The plan's own targets need brokers before R2:**
   - ≥10 partner brokers by day 90 (§14);
   - the resale desk at M4–M6 (§13.2);
   - WhatsApp broker intake listed as R1 (§11).

   So a thin broker layer has to come forward into R1.
5. **Brokers will partner only if seven things exist.** Most are policy and copy, not code:
   - the agent of record on visit bookings;
   - honest "who pays whom" labels;
   - a way to stay in touch with buyers;
   - cap rules that don't penalise agents;
   - published introduction and split rules, with payment within 7 days;
   - a mandate shield;
   - a way to talk about risk bands with clients.

---

## 2. Personas: reactions and needs

### 2.1 Sunil Arora (46): independent resale dealer, six Golf Course Extension Road societies

**Profile [J]:** office at a society gate; 30–50 live listings; WhatsApp broadcast groups; informal co-broking. Charges about 1% + GST per side and pays portals whose leads go to 4–15 brokers (teardown). Probably not HARERA-registered.

**Reaction today:** Plinth doesn't matter to him in R1, which covers UC projects only. From R2 he will see it as a threat unless the value shows up first. His instinct: *"If I give you my owner's number for an OTP, next month your desk is selling that flat."*

**What hurts him in the current design:**
- **Masked numbers, forever.** WebPrivacy says "Your own number is never shown or sent". He closes deals over 6–10 weeks of calls from his own phone and WhatsApp.
- **The relay dies after 30 days** (WebPrivacy, "It ends… after 30 days"). The ownership window is 60 days, so he loses the client mid-deal.
- **The 3-party cap.** A buyer seeing four flats from four dealers runs out of slots (WebPrivacy: "next free slot 11 Nov 2026").
- **Owner OTP plus Plinth's own owner-direct channel** (§7.3, F-60, F-70) and a 1% desk (§13.2), with no rule against poaching his owners.
- **Upkeep:** 14-day re-confirmation plus a geofenced flat-number photo (F-22) for each of 40 listings.

**What helps him:**
- Only one partner per buyer and property, so there is no 15-way lead auction.
- Proof of introduction answers his biggest money leak: "the buyer went straight to the owner after my visit".
- Verified listings outrank unverified ones whoever pays, so honest dealers beat bait listings.
- Buyers arrive with title and transferability checks done (R2), so fewer deals die at the NOC.

**What's missing before he joins and keeps listings fresh:**
- A WhatsApp-only workflow: forward a broadcast to create a listing, and one weekly availability roll-call.
- A mandate shield.
- A published split and payment within 7 days.
- A dispute desk.
- Help with HARERA registration.

### 2.2 Priya Khanna (38): CP firm owner, 35 staff, new launches on Dwarka Expressway

**Profile [J]:** empanelled with about 12 developers on 2–3.5% slabs, paid late against collection milestones, with clawbacks. Runs Meta ads and site-visit cabs, and tags clients in each developer's CP app.

**Reaction:** Plinth is a threat from R1 onwards. The design gives her these reasons:
- **Her projects carry public bands, and buyers check them on site.** AppScan asks "Standing at a project site?" and shows the band in seconds, in the middle of her visit. A High or Severe band (AppMap: Coral Towers, Laurel Residency) ends her pitch on the spot.
- **The visit flow strips her tag.** WaAlerts › Book a site visit sends "first name and visit time" to "Northfield Estates' site office", and the buyer shows visit code 4821. Sales galleries log that buyer as a direct walk-in. If she sourced the client, she loses the commission and will say *"Plinth stole my client."* [J]
- **"Talk to our team"** (AppProject, AppExplore) reads to her as in-house advisors on UC.
- **Founder-led "The Truth About [Project]" videos** (§13.3) target her inventory.
- **D1 removes every CP role for Plinth.** The supply plan's CP economics no longer exist. Those were the platform acting as the empanelled CP and passing 70–80% to sub-CPs, plus a ledger spanning developers that needed developer payout data. Nothing in today's plan earns her money.

**What helps her:**
- On her Low and Moderate projects, an independent card closes faster: *"Don't trust me, check Plinth."*
- **Delivery Risk also predicts CP payout risk.** Stalled developers pay CPs late and claw back. She can use bands to choose which developers to empanel with. [J] This is the strongest honest hook for CPs.
- Buyers who arrive knowing the all-in cost mean fewer fights over the cost sheet.
- F-08 "Is this broker registered?" makes her registered firm look better than unregistered freelancers.

**What's missing:**
- An agent-of-record step in the visit flow.
- A neutral "paid by the developer if you book" label.
- A rule that Plinth never registers itself as a lead source with any developer.
- A bulk "follow my empanelled projects" option.

Priya will never be a revenue partner under D1. **The aim is neutrality:** Plinth must not hurt her when her client uses it, and buyers who want her must be able to name her. [J]

### 2.3 Kabir Malhotra (29): HARERA-registered agent building a personal brand

**Profile [J]:** about 40k Instagram followers; project Reels; resale plus some new launches; registered with HARERA partly to look credible.

**Reaction:** cautious value. He is the earliest adopter.

**What hurts:**
- Plinth's founder videos chase the same "truth about this project" audience.
- Masking stops him building his own client list.
- If he has promoted a project now rated Elevated, Plinth contradicts him in public.

**What helps:**
- Risk cards as content.
- F-08 as proof of his registration.
- An earned badge.
- An "I only sell Low and Moderate projects" positioning that nobody can buy.
- "No paid placement" (WebSearch), so bigger firms can't outspend him.

**What's missing:**
- A public profile URL for his bio.
- A share kit for risk cards, with rules.
- A visible badge.
- Introductions from buyers who choose him.
- A way for the buyer to share their real number after a visit.

---

## 3. Gaps, ranked

Severity: Critical, High, Medium or Low. Priority: **Fix before coding** (policy or copy that the R1 build bakes in), **R1**, **R2** or **Later**.

### BG-01 · Critical · R1 has no broker layer, but the plan needs brokers in R1

- **Evidence:**
  - No broker screen exists.
  - §14 sets "≥10 partner brokers" at day 90.
  - §13.2 puts the resale desk at M4–M6.
  - §11 lists WhatsApp "seller and broker intake (WhatsApp Flows)" as R1.
  - F-66 is R2 (M5–7).
  - The society playbook needs inventory at L2 within 30 days.
- **Recommendation:** bring forward a thin "Partner early access" layer (§4.3).
- **Priority:** R1.
- **Buyer-first conflict:** none.

### BG-02 · Critical · UC visit booking bypasses the buyer's agent, and the R1 visit route is undecided

- **Evidence:**
  - WaAlerts › Book a site visit 3/3 sends details to the developer's site office and issues visit code 4821.
  - For the same Kestrel Park visit, AppYou shows "Orbis Land's site office" but WebPrivacy shows "Larkspur Realty · Partner broker".
- **Recommendation:**
  - Make the R1 route the site office directly, with an optional step: "Working with an agent on this project?" The buyer enters a RERA agent number and it is checked.
  - The confirmation shows "Agent of record: …" and the site office receives it.
  - Publish a rule: Plinth never registers itself as a source with any developer.
  - Allow partner-agent routing for UC only from R2, and only with the paid-by label.
  - Align the WebPrivacy and AppYou samples.
- **Priority:** Fix before coding.
- **Buyer-first conflict:** low. The buyer can name an agent or skip the step, and Plinth must not nudge either way.

### BG-03 · High · "Who pays whom" (F-23, R1) is undefined for agents

- **Evidence:** WebPrivacy labels developers "free enquiry, pays us nothing" but labels Larkspur only "Partner broker · HARERA-registered agent", with no payer.
- **Recommendation:** give every agent one standard label, with the same visual weight as the developer label. It shows:
  - the agent's registration number and the date it was verified;
  - "Paid by the developer if you book" (new launch) or "Paid by the seller, and by you if you hire them" (resale);
  - "Pays Plinth: nothing" or "Shares our resale fee".
- **Priority:** Fix before coding.
- **Buyer-first conflict:** disclosure may push some buyers away from agents. Accept that; it is the brand.

### BG-04 · High · Agents lose contact with buyers mid-deal

- **Evidence:**
  - WebPrivacy says the relay ends "after 30 days" and that your number is "never shown or sent".
  - WebFollowing says "no developer or broker does" have your number.
  - Supply §5.3 planned to share the real number once the buyer agrees to a visit.
  - The ownership window is 60 days.
- **Recommendation:**
  - Keep the relay alive while a deal is active, from the first visit to registration.
  - At day 25, ask the buyer: "Keep [agent] connected?"
  - After a confirmed visit, let the buyer tap "Share my real number with [agent]". The option starts unticked, is logged, and states that a shared number can't be recalled.
  - The relay respects the buyer's quiet hours.
- **Priority:** Fix before coding (the privacy copy and F-80 policy).
- **Buyer-first conflict:** **yes, it touches the privacy promise.** Masking stays the default and sharing is buyer-initiated only. Reword "never" to "never without your tap".

### BG-05 · High · The cap mechanics penalise agents and buyers

- **Evidence:** in WebPrivacy, two developer information requests (a price list and a possession question) use up slots, so the next free slot is 11 Nov. AppYou shows "2 of 3 contacts used".
- **Recommendation:**
  - Count only parties who can contact the buyer.
  - Price lists and developer answers that Plinth delivers without a relay don't use a slot.
  - The buyer's chosen buyer-side agent takes one slot that covers every network listing.
  - Listing agents met through that agent don't count.
  - Keep "one partner per buyer and property".
- **Priority:** Fix before coding (F-80 is R1).
- **Buyer-first conflict:** the spirit holds, because no more than 3 people can reach you. The trade-off is that more parties sit behind one agent, so the ledger must show who they are.

### BG-06 · High · No published introduction or dispute rules

- **Evidence:** F-66 says only "60-day ownership window". There is no screen and no dispute type in F-86.
- **Recommendation:** publish "Introduction Rules v1":
  - Ownership comes from a consented contact plus a verified visit, for a specific property.
  - The window runs 60 days from the last verified visit, up to 90 days at most.
  - A claim of an earlier off-platform introduction needs dated evidence.
  - The buyer may switch agents at any time. The ledger then splits the fee between agents (default: 25% to the agent who introduced the buyer [J]), and the buyer never pays twice.
  - Disputes are decided in 7 days. Appeals go to a panel that includes one outside broker.
- **Priority:** R1 (publish the rules and start logging); R2 (ledger visible to brokers).
- **Buyer-first conflict:** the buyer's freedom to switch is absolute. Agents settle between themselves through the ledger, never through the buyer.

### BG-07 · High · Resale-desk economics and payment are undefined

- **Evidence:**
  - §13.2 says "1% + GST on registration, buyer and/or seller".
  - Supply §7 proposes "20–25% of the buyer-side fee".
  - Dealers already charge about 1% per side.
  - There is no screen.
- **Recommendation:**
  - Publish the split table (§4.1) before onboarding.
  - Pay the partner's share within 7 days of registration, with TDS on commission deducted (old s.194H, now under s.393 of the Income-tax Act, 2025; CA to confirm) and a GST invoice.
  - Show the payment status on WhatsApp.
  - A buyer pays at most one buyer-side fee.
- **Priority:** R2 (decide by M3).
- **Buyer-first conflict:** the buyer must never pay twice. Competition law (CCI): publish Plinth's share only, never a market rate.

### BG-08 · High · No mandate shield against Plinth's owner-direct channel or desk

- **Evidence:**
  - §5.1 makes owner-direct a P0 channel.
  - In F-70, "the owner chooses to list with us or meet a verified broker".
  - The owner OTP hands the owner's details to Plinth.
- **Recommendation:**
  - While a verified mandate is active, and for 60 days after, Plinth doesn't approach that owner for a direct listing or a desk deal.
  - An owner who comes to Plinth directly sees "Mandated to [agent] until [date]".
  - The owner can end a mandate at any time.
  - Each flat gets one card that merges the owner's and the agent's listings.
- **Priority:** R1 (publish the rule); R2 (build it).
- **Buyer-first conflict:** none for buyers. The seller stays free, because Plinth simply doesn't poach.

### BG-09 · High · Bands hit brokers' inventory, with no guidance or evidence route for agents

- **Evidence:**
  - AppScan shows the band during a visit.
  - AppMap lists Laurel Residency (Severe, NCLT order) and Coral Towers (High).
  - WebFollowing tells the developer about changes "at the same time", but not agents.
- **Recommendation:**
  - Add a "For agents" explainer and a one-page guide, "How to discuss a band with a client".
  - Agents may submit evidence through "Report an error", labelled with who pays them.
  - Nobody gets a preview or early notice.
- **Priority:** R1.
- **Buyer-first conflict:** none. Score independence means agents get no special access.

### BG-10 · High · Agents get no consented buyer brief

- **Evidence:** no screen. WebPrivacy shows only a purpose line ("Arrange your site visit…").
- **Recommendation:**
  - Before the buyer consents, show an editable brief of what the agent will receive: the flat or project, budget band, timing, loan status and the buyer's questions.
  - The agent receives it on WhatsApp.
- **Priority:** R2 (set the consent pattern in R1).
- **Buyer-first conflict:** none, if handled through itemised DPDP consent where the buyer edits the fields.

### BG-11 · Medium-High · The agent check and verification tiers are not designed

- **Evidence:** F-08 "Is this broker registered?" is R1 scope but has no artboard. AppScan reads project QR codes only.
- **Recommendation:**
  - The F-08 screen: scan or type an agent number, then show:
    - the HARERA record;
    - whether the registration is valid;
    - whether the name matches;
    - "Plinth partner: yes/no", with the note "Partners are verified, never endorsed".
  - Onboarding asks for:
    - a HARERA number (required to market units in RERA-registered projects);
    - PAN and e-KYC;
    - an office address.
  - Make a policy decision on dealers who handle resale only and aren't registered (§6), and offer them help registering.
- **Priority:** R1 (F-08); R2 (tiers).
- **Buyer-first conflict:** excluding unregistered dealers shrinks resale supply.

### BG-12 · Medium · Copy casts brokers as the enemy and hides future broker revenue

- **Evidence:**
  - The PRD's positioning table (§2) contrasts Plinth with "Paid by developers and brokers" and "Traffic → leads sold to brokers".
  - AppYou says "We earn only from buyers, sellers and lenders".
  - The WebHome money list has no row for the desk or for brokers.
- **Recommendation:**
  - Aim the copy at lead reselling, not at brokers: "Your enquiry goes to one agent you choose, not fifteen."
  - Add a future row: "Partner agents: a share of our resale fee, and optional tools from 2027. Never affects ranking or bands."
- **Priority:** Fix before coding.
- **Buyer-first conflict:** none. It is more transparent.

### BG-13 · Medium · "Talk to our team" implies an in-house brokerage

- **Evidence:** AppProject and AppExplore say "Talk to our team". Supply open question 5 (salaried desk or broker network) is still undecided.
- **Recommendation:** decide and publish that Plinth staff explain records and coordinate the desk, but don't show flats or negotiate. Partner agents do the field work.
- **Priority:** Fix before coding (the decision).
- **Buyer-first conflict:** some buyers want Plinth to handle everything. The desk still serves them, through partners.

### BG-14 · Medium · Keeping listings fresh is a heavy burden

- **Evidence:** F-22 requires availability re-confirmed within 14 days and a geofenced photo with the flat number. Pings go out per listing.
- **Recommendation:**
  - One weekly WhatsApp roll-call per agent, listing all their flats with Available / On hold / Sold quick replies.
  - The owner re-confirms by OTP every 30 days.
  - Unconfirmed listings hide automatically, and compliance counts towards the badge.
- **Priority:** R2.
- **Buyer-first conflict:** none, as long as the owner check stays. It is the buyer's real protection.

### BG-15 · Medium · No WhatsApp listing intake

- **Evidence:** §11 promises broker intake through WhatsApp Flows in R1, but nothing is designed.
- **Recommendation:**
  - "Forward to list": AI turns a forwarded broadcast message and its photos into a draft listing against the Society Dictionary.
  - Blanks are marked "Not provided" (F-35).
  - The draft then triggers the owner's mandate OTP.
- **Priority:** R2 (run it by hand for founding partners in R1).
- **Buyer-first conflict:** none.

### BG-16 · Medium · No agent profile, badge or reviews

- **Evidence:** F-67 is R3. The scout rates a responsiveness badge as P0. There is no screen.
- **Recommendation:**
  - A public web profile showing registration, coverage, response time, listing accuracy and verified closings, with a link agents can put in their bio.
  - The badge is recomputed monthly, can be appealed, and starts with response time at R2, since the relay already measures it.
- **Priority:** R2.
- **Buyer-first conflict:** none, if the badge can never be bought. Broker Pro must never affect the badge or routing.

### BG-17 · Medium · No rules or kit for agents sharing risk cards

- **Evidence:** WebProject has "Share the live page". The growth wedge is the card spreading as a WhatsApp image (§13.3).
- **Recommendation:**
  - Agents share a live link plus a dated image with a QR code.
  - They may not crop out the band or claim "Plinth recommends".
  - An optional line on the share message reads "Shared by a HARERA-registered agent. Agents don't pay us to share."
  - Track referrals from shares from R1.
- **Priority:** R2 (tracking in R1).
- **Buyer-first conflict:** attribution could look like endorsement, so keep it on the message, never on the card.

### BG-18 · Medium · No policy on agents listing bottom-band projects

- **Evidence:** supply open question 2 is unresolved. AppMap shows Severe and High projects. Transfers of UC units are common on Dwarka Expressway [J].
- **Recommendation:**
  - Allow these listings, with the band pinned at the top.
  - The buyer acknowledges the band before contacting the agent.
  - No ranking boost.
  - The agent confirms "I've shown my client the band".
  - Any claim that contradicts the band earns a strike.
- **Priority:** R2.
- **Buyer-first conflict:** the friction lowers agent conversion. Accept that.

### BG-19 · Medium · How owner and agent listings are fed and ranked is unclear

- **Evidence:** F-32 has an owner/agent filter. Supply §4.3 proposes a "separate feed".
- **Recommendation:**
  - One feed, with the poster type labelled and a filter allowed.
  - Rank only by verification level and freshness.
  - One card per flat.
- **Priority:** R2.
- **Buyer-first conflict:** buyers may filter agents out, and that is their right.

### BG-20 · Medium (High at R2) · No defences against brokers gaming the system

F-82 names detection of brokers posing as owners, but no flows are designed. Controls are in §6. **R2.** No conflict.

### BG-21 · Medium · The supply plan's CP features don't survive D1

- **Evidence:** the ledger spanning developers needs a developer payout feed. Supply §4.3 has Plinth as the empanelled CP.
- **Recommendation:**
  - Drop the CP commission ledger and team accounts for now.
  - Give CPs value through the agent of record, honest labels and a risk watchlist for empanelment decisions.
- **Priority:** Later.
- **Buyer-first conflict:** D1 applies. **Never take a share of CP commission**, because it is developer money passed through a third party.

### BG-22 · Low · Agents who use Plinth in R1 can't identify themselves

AppYou has no profile type. Add an optional "I'm an agent" flag that links to the For-agents page and changes nothing the agent sees. **R1.** No conflict.

---

## 4. Value proposition and partner programme

### 4.1 One-page pitch for agents (draft)

> **Plinth Partner Agents: one buyer, one agent, proof, and paid in 7 days.**
>
> **What you get**
> 1. **Buyers who chose you.** Each buyer picks at most one agent per flat. We never sell or broadcast an enquiry, so you aren't in a 15-way race.
> 2. **Buyers who already know.** They have seen the delivery risk, the all-in cost and the paperwork status. That means fewer wasted visits and fewer deals that die at the NOC.
> 3. **Proof you introduced them.** Every consented contact and verified visit is time-stamped. If a buyer goes around you, the ledger settles it.
> 4. **Paid within 7 days of registration** on desk deals, with the TDS and GST paperwork done.
> 5. **Your mandates are safe.** While your mandate is active, we won't approach your owner.
> 6. **Nobody can outspend you.** Rank comes from verification and freshness. Nobody can buy a spot, and that includes you.
> 7. **A reputation you earn:** response time, accurate listings and closings, shown on your public profile.
> 8. **Free core tools on WhatsApp:** list by forwarding a message, a weekly availability roll-call, visit check-ins and payments.
>
> **What we ask:** your HARERA number and KYC, the owner's OTP for every mandate, honest availability, respect for a buyer's STOP and quiet hours, and telling buyers who pays you.
>
> **What we never do:** sell your leads or data, take developer money, give anyone a preview of a band, or charge for the badge.

**Published split rules [J, to test in 5 societies]:**

| Deal | Who pays whom | Plinth's share |
|---|---|---|
| Two partner agents matched through the network | Each charges their own client | **₹0 in year 1** |
| A buyer who found you through Plinth hires you | You charge your client as usual | 20% of your buyer-side fee, on registration only |
| A buyer hires Plinth's desk (1%), and you do the field work | Plinth invoices the buyer | You get 75% of the desk fee within 7 days |
| You are the listing agent in any of the above | You charge the seller as usual | **Nothing taken** |
| New launch (UC), any route | The developer pays you, if anyone does | **₹0, ever** (D1) |

### 4.2 The programme

- **Founding Partners:**
  - 2–4 dealers in each of 15–25 target societies, plus 5–10 corridor agents for UC visits. That is 40–60 in total, against the PRD's 30–50.
  - Onboarding is a WhatsApp Flow plus one session in each society (the playbook allows about a day per society).
  - "Founding" is a dated fact on the profile. It gives no ranking advantage.
- **Rules:**
  - The published constitution: Introduction Rules v1, the mandate shield, caps, labels and band etiquette.
  - Strikes for stale listings, posing as an owner, ignoring STOP, or poaching off-platform. Three strikes mean a 90-day suspension [J].
  - Disputes are decided in 7 days, with an appeal panel.
- **Voice:** a quarterly partner council of five agents gives feedback on rules and tools, never on scores.
- **Exit:** agents can leave at any time and export their own listings.
- **CPs:** what Plinth offers CPs is protection as the agent of record, honest labels and a developer risk watchlist. Plinth takes no commission share. Say this plainly to Priya.

### 4.3 Minimum broker scope to bring into R1

All of it is small. It is mostly copy and policy, plus one WhatsApp Flow and one buyer screen. Our rough estimate is 2–3 designer-days and 1–2 engineer-weeks [J].

1. **"For agents" page** on the web, in English and Hindi. It covers the promise, the rules (introductions, mandate shield, caps, labels, how bands work and that there are no previews), and a waitlist by society.
2. **WhatsApp agent onboarding Flow** with three screens:
   - an instant check of the HARERA agent number;
   - PAN and coverage;
   - a follow-up call from a person.

   The result is the status "Verified agent", with no listings yet.
3. **The F-08 agent check** (already in R1 scope).
4. **The visit flow:** the "Working with an agent?" step, with the agent of record shown and passed to the site office (BG-02).
5. **F-23 agent labels and copy fixes** (BG-03, BG-12, BG-13), with the WebPrivacy and AppYou samples made consistent.
6. **F-80 policy:** count slots only for parties who can contact the buyer, offer a relay extension prompt, and add the copy for buyer-initiated number sharing (BG-04, BG-05).
7. **Introduction events logged from day 1:** consent, visit booked, check-in and agent of record. R2 then starts with a history.
8. **An optional "I'm an agent" profile flag.**

Not in R1: listings, co-broking, the commission ledger, the badge, a CRM or Broker Pro.

---

## 5. Broker screens and flows to design

| ID | Surface | Screen or flow | One-line spec | Release |
|---|---|---|---|---|
| W-B1 | Web | For agents | The promise, the rules, the split table, how bands work, the waitlist; English and Hindi | R1 |
| W-B2 | Web | Agent check (F-08, buyer-facing) | Number or QR → HARERA record, validity, name match, partner yes/no; "verified, never endorsed" | R1 |
| WA-B1 | WhatsApp | Agent onboarding Flow | 3 screens: identity, HARERA number checked live, coverage and segment → "Verified agent" plus a call booking | R1 |
| B-V1 | WhatsApp (buyer) | Visit flow: agent of record | Optional step "Working with an agent?" → number check → confirmation names the agent, and the site office sees it | R1 |
| B-P1 | Web and app (buyer) | Who has my number: agent row | Paid-by label, "real number shared" state, relay-extension prompt, quiet hours | R1 |
| WA-B2 | WhatsApp | Forward to list | Forward a broadcast and photos → AI draft against the Society Dictionary → fill the blanks → send the owner OTP | R2 |
| WA-B3 | WhatsApp (owner) | Mandate confirmation | "[Agent] wants to list your flat at ₹X. Confirm?" plus "We won't approach you to list directly while this is active" | R2 |
| WA-B4 | WhatsApp | Weekly roll-call | One message per agent listing every flat; Available / On hold / Sold; unconfirmed flats hide | R2 |
| WA-B5 | WhatsApp | New introduction | The buyer's approved brief, relay call and message buttons, and "propose 3 visit slots" | R2 |
| WA-B6 | WhatsApp and app | Visit check-in and outcome | The buyer's OTP at the flat plus a geofence → logged to the ledger; one-tap next step | R2 |
| WA-B7 | WhatsApp | Payment notices | "Registration done · your share ₹X · TDS ₹Y · paid [date]" with the invoice PDF | R2 |
| WA-B8 | WhatsApp and web | Raise a dispute | Pick the deal, attach evidence; 7-day SLA and an appeal | R2 |
| W-B3 | Web (mobile) | Agent workspace | Listings with verification level and expiry, introductions with a window countdown, deals, payments, strikes | R2 |
| W-B4 | Web | Introduction ledger detail | A timeline of consent, visits and offers for each buyer and property; exportable as evidence | R2 |
| W-B5 | Web (mobile) | Co-broking board | Network listings in my societies, request a co-broke, preview of the published split | R2 |
| W-B6 | Web | Public agent profile | Registration, coverage, response time, accuracy, closings, verified-visit reviews; link for a bio | R2 |
| B-C1 | Web and app (buyer) | Choose who helps you | Listing owner or agent / one agent you pick (up to 3 suggested on quality) / Plinth desk; labels and brief preview | R2 |
| A-B1 | Android | Agent mode: verified capture | Geofenced, time-stamped photos and video of the door or tower plate for L3; no other app features | R2 |
| W-B7 | Web | Agent share kit | Live link plus a dated card image with a QR code; rules shown before sharing | R2 |

Plinth should not build a separate broker Android app before R3. WhatsApp plus mobile web is enough, except for capture, which needs the camera [J]. This resolves the clash between F-66 ("WA, W (mobile)") and supply §6 ("Android first").

---

## 6. Risks and mitigations

| Risk | Mitigation |
|---|---|
| **Dealer boycott or cartel at a society gate** (refusing to show flats to Plinth buyers, telling owners not to list) | Win 2–4 dealers per society, not all of them. The owner-direct channel and the RWA programme keep supply independent. The mandate shield removes the fear of poaching. Agent-to-agent deals are free in year 1 |
| **CP narrative war** ("Plinth is paid by rival developers") | Public methodology and sources, "No developer pays us. Ever.", the For-agents explainer, and CPs selling Low and Moderate projects as natural allies |
| **Brokers posing as owners** | Owner e-KYC with a name match to the sale deed or allotment letter. The mandate OTP must go to the e-KYC-linked mobile, not to any number. A number graph flags one number behind several "owner" listings. Strike on the first proven case |
| **Fake availability or bait prices** | Weekly roll-call plus owner re-confirmation. Flag prices that are outliers against the society median. One-tap "not available" report from buyers, then automatic hiding and a strike |
| **Planted introductions, badge and review gaming** | Ownership needs the buyer's own OTP-verified number and a verified visit (OTP plus geofence). Earlier-introduction claims need dated evidence. Only buyers with a verified visit can review |
| **Duplicate listings and hoarding** | One card per flat from the Society Dictionary. Listing rights go to the mandated agents. Relisting without a mandate is blocked |
| **Off-platform closing to avoid the fee** | Keep the share small, make payment fast, use the ledger as evidence, and give strikes for proven bypass. Accept some leakage rather than over-policing [J] |
| **RERA agent rules** | Plinth registers as a HARERA agent before any fee and keeps the quarterly commission register. Check partners' registration and expiry monthly. Render the agent number on every listing (extend F-85). Units in RERA projects need a registered agent. **Lawyer questions Q1(d) and Q5 (resale brokerage) are still open, and the founder dropped the pre-build memo. Don't start any broker money flow before counsel signs off** |
| **PMLA/FIU-IND** | KYC/CDD on deals, no cash, an STR queue and sanctions screening (F-87) before the first fee-earning deal |
| **Competition law** | Publish Plinth's own share, never a "standard" commission. Don't coordinate dealers' rates (the Idealista/CNMC lesson in the scout) |
| **Data protection once an agent holds a real number** | The agent becomes its own data fiduciary. Partner terms: use the number only for the stated purpose, no adding to broadcast groups without the buyer's opt-in, delete on request. A breach earns a strike. Tell the buyer this before they share |
| **Buyer trust drifts as agents dominate supply** | Track the counter-metric "partners contacting each buyer ≤1" (§14). Set a target share of owner-direct listings. Labels on every card. No paid placement for anyone |
| **D1 leakage through CPs** | Never take a referral share of CP commission on new launches. Broker Pro, if CPs buy it, is a flat tool fee, disclosed, and never affects routing or bands |
