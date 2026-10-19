# Broker fix pass: closing BG-01 to BG-22 and G12

**Owner:** principal product designer, broker and channel-partner side. **Date:** 18 Oct 2026.
**Inputs:** `product/evaluation/broker.md` (BG-01 to BG-22, §4 pitch and split table, §4.3 minimum R1 scope, §5 screens, §6 risks); `product/evaluation/developer.md` G12; DESIGN.md §0, §3–§4c, §5b and §7; PRD §12, §13 and §20 (D13; Plinth never registers as a lead source and never takes any share of CP commission).
**Artboards:** `scratchpad/canvas/project/`. I edited only `WaAlerts.dc.html` and created four new files. I did not touch `canvas.json` or any other artboard, did not publish, and did not open a browser.

---

## 1. Files

| File | Surface | Size | `$preview` | Tweaks | Signature live thing | What it does |
|---|---|---|---|---|---|---|
| `WebForAgents.dc.html` | Web page, "For agents: work with Plinth" | 86 KB | 1280 × 13200 | `theme`, `deal` | **Split calculator.** The published split table is the control: pick a deal row, set the price and your own fee, and toggle "buyer switched agents". A bar shows where the buyer's single fee goes (you, the other agent, Plinth), with the 7-day payment and TDS note | The published rules: introductions, money, the mandate shield, the CP position, band etiquette, the share kit, bottom-band listings, ranking, strikes and a waitlist by society |
| `WaAgentOnboarding.dc.html` | WhatsApp, 390 × 1300 | 54 KB | 390 × 1300 | `theme`, `view` (Onboarding / Listing intake R2) | **The live HARERA check** on Flow step 1, with found and not-found results | R1: "I'm an agent", then a 3-step Flow (HARERA number check; PAN and coverage; call booking) ending in "Verified agent". R2 preview: forward a listing, AI draft, owner OTP, mandate, 14-day roll-call |
| `WebAgentProfile.dc.html` | Web page | 58 KB | 1280 × 5600 (Public); the Briefs view needs about 3500 | `theme`, `view` (Public profile / Briefs and ledger) | **Badge month by month.** Pick a computation month and the verdict, the reason and the table highlight all update | Public: registration, who-pays label, coverage, the earned badge, verified reviews and the brief-consent pattern. Agent view: consented briefs, relay status (D13), the introduction ledger with window countdown, and payments |
| `WebBrokerCheck.dc.html` | Web page, "Is this broker registered?" | 27 KB | 1280 × 3900 | `theme`, `result` (Empty / Found / Not found / Lapsed) | **Search as you type** across the HARERA and UP RERA registers | F-08 for buyers: Found, Not found and lapsed states, partner status ("verified, never endorsed"), neutral next steps and "Who pays the agent?" |
| `WaAlerts.dc.html` (edit) | WhatsApp board | 50 → 67 KB | **1400 × 980 → 1400 × 1600** | `theme` | Unchanged (the alert meter step) | The visit Flow has 4 screens now. New screen 3, "Working with an agent?", plus cap copy, an agent-of-record row on the confirmation, an agent line on the pass, and a new "What does the site office get?" panel |

All five files have `is_interactive: true`.

**`canvas.json` entries the lead needs to add or change** (I did not edit the file):
- Web page: `WebForAgents.dc.html` w 1280, h 13200, `expand: fill`, title "For agents · work with Plinth".
- Web page: `WebAgentProfile.dc.html` w 1280, h 5600, `expand: fill`, title "Agent profile · public and briefs".
- Web page: `WebBrokerCheck.dc.html` w 1280, h 3900, `expand: fill`, title "Is this broker registered?".
- WhatsApp page: `WaAgentOnboarding.dc.html` w 390, h 1300, title "WhatsApp · agent onboarding". WaAlerts spans x 940–2340, so x 2420 is free.
- WhatsApp page: `WaAlerts.dc.html`, change **h 980 → 1600** and set the title to "WhatsApp · alerts, visit booking with agent, login code".

**WaAlerts layout change.** Four Flow screens (4 × 304 + gaps = 1276 px) don't fit beside the old left column at 1400 px. So the Flow now runs across the top row, and the alert chat, the login code and the new site-office panel sit side by side underneath. All existing content, copy and behaviour is kept. The only changes are the 3 → 4 renumbering and two copy strings that are now computed: the consent line and the error line.

---

## 2. Where each gap is closed

"Remaining" lists what still needs another artboard's owner, a later release or a decision (see §4).

| Gap | Closed in | How |
|---|---|---|
| **BG-01** No broker layer in R1 | All five files | The thin R1 layer from broker.md §4.3 is designed end to end: For-agents page with waitlist → WhatsApp onboarding → "Verified agent" → F-08 check → agent of record in the visit Flow → introductions logged (WebAgentProfile ledger) |
| **BG-02** Visit booking bypasses the agent | `WaAlerts` › Flow screen 3; screen 4; pass; site-office panel | Screen 3, "Working with an agent?", offers **Larkspur Realty** ("your agent for Kestrel Park"), **Another agent** (HARERA number with a Check tap: found = Kabir Malhotra; not found shows neutral copy) and **No agent**. **Nothing is preselected**, and the copy says "Either answer is fine; we earn nothing from this visit." The confirmation shows an "Agent" row, and the consent line adds "and agent of record" only when one is named. The pass and the bubble say "Agent of record: …" or "No agent of record: you're booked as a direct visitor. Plinth is never listed as your source." The new site-office panel shows the notice Northfield receives, with "Agent of record" and "Plinth is not a channel partner and is never this buyer's source." **Remaining:** partner-agent routing for UC stays R2 (not designed, by policy). WebPrivacy and AppYou already agree on Larkspur as agent of record for Kestrel Park, and WebDevInbox's code 4821 ("No agent of record") matches the "No agent" path |
| **BG-03** "Who pays whom" undefined for agents | `WebAgentProfile` hero; `WebForAgents` › bottom-band listing card; `WebBrokerCheck` › "Who pays the agent?"; `WaAlerts` › site-office notice | One standard label on a tone field, with the same weight as the developer label: **Registration** (number, valid until, checked date) · **Paid by** ("On a new launch, the developer, if you book. On a resale, the seller; and you, if you hire them.") · **Pays Plinth** ("Nothing to appear here. On resale deals through our desk, Larkspur shares our fee for the field work."). **Remaining:** WebPrivacy and AppYou say "never by Plinth". That stops being true once desk shares start (R2), so those owners need a reword then |
| **BG-04** Agents lose contact mid-deal | `WebAgentProfile` › Briefs and ledger › relay block per buyer | The four D13 states, as the agent sees them. **Rohan**: number shared by his tap after the visit, with partner terms (use it only for this purchase, no broadcast groups without his opt-in, delete on request). **Ishita**: relay active, her hours 8 am–9 pm; if there's no visit by day 25 (11 Nov), Plinth asks whether to keep Larkspur connected. **Meera**: active deal, so the relay stays on until registration; she switched calls off. **Tanvi**: she ended it, and her brief was removed. Buyer-side copy already lives in WebPrivacy |
| **BG-05** Cap mechanics penalise agents | `WaAlerts` › screen 3 cap note (changes with the choice) and screen 4 summary; `WebAgentProfile` › "Want Larkspur's help?"; `WebForAgents` › introductions section | "Your cap counts only people who can reach you: at most 3 new ones in 30 days. One agent you choose covers every listing they show you." Per choice: Larkspur "already holds your one agent slot"; naming another agent "shares nothing and uses no slot… your next opens 11 Nov 2026" (matches WebPrivacy); No agent: "No one new can reach you." Screen 4 says "Uses none of your 3 contact slots." The agent-side copy says listing agents you co-broke with don't count |
| **BG-06** No introduction or dispute rules | `WebForAgents` › "Who owns an introduction?"; `WebAgentProfile` › ledger | Introduction Rules v1, all six rules, in an expander: consented contact plus verified visit (buyer's OTP plus location), 60 days from the last visit and never past 90 from the first, dated evidence for earlier claims, the buyer may switch (25% of the agent share to the introducer, the buyer pays once), disputes decided in 7 days with an appeal panel that includes one outside broker, and ledger export. A worked timeline example runs 2 Oct → 15 Dec 2026, hard stop 7 Jan 2027. The agent view shows the ledger with consent references, a window countdown (Meera: until 8 Dec 2026, 51 days left), "Download this ledger (PDF)" and "Raise a dispute · decided in 7 days" |
| **BG-07** Resale-desk economics undefined | `WebForAgents` › "What does a deal pay you?" (signature); `WebAgentProfile` › Payments; `WaAgentOnboarding` › PAN note | The five-row split table from broker.md §4.1 is the calculator's control. Pay within 7 days of registration, TDS deducted and shown (2% today), a GST invoice if registered, "a buyer never pays two buyer-side fees", and "We publish only Plinth's own share… We never suggest a rate" (CCI). "Desk deals start once our HARERA agent registration is in place." The agent payments table shows a desk share paid in 6 days with the TDS line, and a found-on-Plinth deal with the 20% invoiced after registration |
| **BG-08** No mandate shield | `WebForAgents` › "Will we poach your owners?"; `WaAgentOnboarding` › R2 owner-OTP message | The rule covers the active mandate plus 60 days after it ends. "What an owner sees": "Mandated to Arora Estates until 16 Jan 2027… You can end it anytime." One flat, one card, and no relisting without a mandate. The owner's OTP request repeats the promise word for word |
| **BG-09** No band guidance or evidence route | `WebForAgents` › "How do I explain a band?" | Pick a band (Low to Severe; borderless chips) to get a talk track for a canonical project: the natural frequency, "Records show" with a source chip, "You could say …", "Ask the site office together…" and "Don't promise an outcome… a contradicting claim is a strike." Under it: **"No previews, for anyone"**. The one exception is stated honestly: the developer gets 7 days' notice on its own project, and that notice is never shared. **"Think a record is wrong?"** sends evidence through Report an error, labelled with who pays you. The CP section adds bands as an empanelment signal |
| **BG-10** No consented buyer brief | `WebAgentProfile` › "Want Larkspur's help?" (buyer side) and Briefs and ledger (agent side) | Buyer side: four brief fields, **all unticked**, plus an optional question, and a live "Larkspur will see: your first name; …" preview before Connect. Agent side: "What {buyer} chose to share", with withheld fields shown as *Not shared*, questions in the buyer's words, and consent references in the ledger |
| **BG-11** Agent check and tiers undesigned | `WebBrokerCheck`; `WaAgentOnboarding` › Flow steps 1–2 | F-08 searches by name or number across HARERA and UP RERA. States: Found (exact or partial name/number match), **registration ended** (Northgate Realtors) and Not found (neutral: "That alone doesn't mean anything is wrong…"), with next steps: ask for the number, check the regulator's site, pay only the seller or the RERA collection account. It shows partner status ("Verified, never endorsed"). Onboarding: the HARERA number is checked on tap, with "Is this you?" on a match. Step 2 takes PAN (format plus name match), segment, corridors, societies and office address. Unregistered dealers get a **"Registration help"** path with no Verified status (decision D-4) |
| **BG-12** Copy casts brokers as the enemy | `WebForAgents` throughout | "We compete with lead reselling, not with you." "Your enquiry goes to one agent the buyer chose, not fifteen." "How Plinth earns from agents: a share of our resale fee… optional tools later for a flat monthly fee. Neither ever touches a band, a ranking or your badge." **Remaining (other owners):** PRD §2 positioning table, the WebHome money list (add a "Partner agents" row) and AppYou ("We earn only from buyers, sellers and lenders") |
| **BG-13** "Talk to our team" implies in-house brokerage | `WebForAgents` › "What our own staff do" | "Plinth's staff explain records and handle desk paperwork. They don't show flats or negotiate. The field work is yours." **Remaining:** relabel the AppProject and AppExplore buttons (suggestion: "Ask about the records"). That is not my artboard. Decision D-11 |
| **BG-14** Freshness burden | `WebForAgents` › ranking; `WaAgentOnboarding` › R2 roll-call | One weekly WhatsApp roll-call for all flats (Available / On hold / Sold as quick replies). A flat unconfirmed for 14 days hides until confirmed. The owner re-confirms by OTP every 30 days ("next on 17 Nov") |
| **BG-15** No WhatsApp listing intake | `WaAgentOnboarding` › view "Listing intake · R2" | A forwarded broadcast plus photos becomes an AI draft matched to the society dictionary, with blanks marked *Not provided* and nothing guessed. Then: fill the blanks → the owner's e-KYC mobile → the OTP request (with the mandate-shield line) → "Live… level 2 of 4 · mandate until 16 Jan 2027". Marked "Preview: arrives with resale listings (R2)" |
| **BG-16** No profile, badge or reviews | `WebAgentProfile` › public view | Registration verified and dated; coverage (societies, plus new launches where buyers named the agent); **earned badge** with three bars (median reply ≤ 2 h; listing accuracy ≥ 95%; ≥ 2 verified closings in 12 months), recomputed on the 1st, with a 6-month table, misses underlined (non-colour cue) and appeal; "Nobody can buy them, and paid tools never touch them." Reviews come only from verified visits, with one public reply and no removal, plus "17 of 17 say Larkspur showed them the band" |
| **BG-17** No share rules or kit | `WebForAgents` › "Can I share a risk card?" | **Live link only.** Pick a project to preview the WhatsApp message with its link card. The optional message line reads "Shared by a HARERA-registered agent. Agents don't pay Plinth to share." The rules: no screenshots or cropping, no "Plinth recommends", your logo never goes on the card, and opens are counted for the agent but never affect a band or ranking |
| **BG-18** Bottom-band projects | `WebForAgents` › "What if the band is High?" | Listing is allowed. The example is Coral Towers, High: the band sits above the photo, and the buyer must tick "I've read why this project is High" before Contact works. The agent confirms "I've shown my client the band". No boost, no hiding, and a strike for contradicting the band |
| **BG-19** Feed and ranking unclear | `WebForAgents` › "How are listings ranked?" | One feed with the poster labelled and filters allowed; one card per flat. Rank is by verification level, then freshness, nothing else. The F-22 ladder is drawn as stacked slabs: identity, then ownership plus mandate OTP, then available ≤ 14 days with on-site photo, then registry/OC checked by a person. "What never counts": paid tools, ads, volume, tenure, founding status |
| **BG-20** No anti-gaming defences | `WebForAgents` › "What gets a strike?"; `WaAgentOnboarding` › owner OTP | A real table of 7 behaviours, how each is spotted and what happens (posing as owner, bait prices, planted introductions, fake reviews, ignoring STOP or quiet hours, contradicting a band, closing around the ledger). Three strikes in 12 months means a 90-day pause. Appeals go to a panel with an outside broker, and the partner council never reviews scores. The owner OTP goes only to the e-KYC mobile |
| **BG-21** CP features don't survive D1 | `WebForAgents` › "Are we a channel partner?" and the calculator's "New launch" row; `WebAgentProfile` › UC notes and Payments | "No, and we never will be. We never take any part of a commission a developer pays you." "Keep every empanelment you have." The calculator's new-launch row reads "₹0, ever" and its bar note says "We never see the amount, never touch it." The agent payments table says "New-launch commissions never appear here." The CP ledger and team accounts are dropped (not designed, by policy) |
| **BG-22** Agents can't identify themselves | `WaAgentOnboarding` › opening chat; `WebForAgents` › waitlist; `WebBrokerCheck` › header action "I'm an agent" | "I'm an agent" → "Saying you're an agent changes nothing you see on Plinth: same records, same bands, no previews." **Remaining:** the optional flag row on AppYou (AppYou owner) |
| **G12** No stated CP position | `WebForAgents` › "Are we a channel partner?"; `WaAlerts` › site-office notice; `WebAgentProfile` › UC notes | Covered: not a CP; never anyone's lead source ("A buyer who names no agent is booked as a direct visitor"); "Tagging stays between you and the developer. We don't decide who tagged a client first"; the **dated first-contact receipt** the buyer may share (R2); "The developer is the seller, not our partner." |

---

## 3. Fictional facts I introduced (please add to DESIGN.md §5b)

DESIGN.md §5b says new facts go there first. I didn't edit DESIGN.md, so here they are for the lead. Everything below is fictional.

- **Larkspur Realty** (principal Priya Khanna): HARERA agent reg. **RC/REA/HARERA/GGM/2023/487**, valid until 21 Jun 2028, office Sector 102. Verified agent since **6 Apr 2026**. Coverage: resale in Cobalt Square (Sector 104) and Larchwood Residency (Sector 109), plus Dwarka Expressway new launches. Badge held from 1 Sep 2026.
  - Badge data:

    | Computed | Median reply | Accuracy | Closings |
    |---|---|---|---|
    | 1 May | 58 min | 94% | 0 |
    | 1 Jun | 52 min | 96% | 0 |
    | 1 Jul | 47 min | 96% | 0 |
    | 1 Aug | 44 min | 97% | 1 |
    | 1 Sep | 39 min | 98% | 2 |
    | 1 Oct | 41 min | 97% | 2 |

  - 17 verified reviews.
  - Closings:
    - Cobalt Square 2 BHK, registered 14 Jul 2026. Found on Plinth; Plinth's 20% share was ₹31,000.
    - Larchwood Residency 3 BHK, registered 28 Aug 2026. Desk deal: 1% of ₹2.24 Cr = ₹2,24,000; Larkspur's 75% = ₹1,68,000; TDS ₹3,360; paid 3 Sep 2026.
- **Kabir Malhotra:** individual agent, RC/REA/HARERA/GGM/2024/1187, valid until 14 Mar 2029, Sector 56. Verified agent since 18 Oct 2026 (the onboarding artboard).
- **Arora Estates** (Sunil Arora): RC/REA/HARERA/GGM/2026/1342, valid until 2 Sep 2031, Sector 66. Verified since 20 Sep 2026. Mandate on **Amberwood Greens T4-902** (3 BHK, 1,650 sq ft super / 1,210 carpet, ₹2.45 Cr): confirmed by the owner's OTP on 18 Oct 2026 and valid until **16 Jan 2027**.
- **Other agents:** Bluegate Homes (already in WebDevInbox): RC/REA/HARERA/GGM/2022/233, not a partner. Northgate Realtors: RC/REA/HARERA/GGM/2021/061, **ended 30 Jun 2026**. Meadowline Realty: UPRERAAGT10457 (UP RERA).
- **Larkspur's briefs:**
  - **Ishita**, Aurelia Ph 2: brief consent PLN-C-261017-0624, relay active, day-25 check 11 Nov.
  - **Rohan**, Kestrel Park: C-1012-04 and C-1012-05, number shared 12 Oct.
  - **Meera**, Cobalt Square T-B 1203: connected 7 Oct, consent PLN-C-261007-0415; verified visit 9 Oct 2026, so the window runs to 8 Dec 2026 and never past 7 Jan 2027.
  - **Tanvi**, Sapphire Grove Ph 1: consent PLN-C-261002-0219, ended 14 Oct 2026, ledger kept until 14 Oct 2027.
- **Societies** (resale, fictional):
  - Golf Course Ext Road: Amberwood Greens (Sector 66), Wrenfield Towers (65), Palisade Court (62), Saffron Crest (70A).
  - Dwarka Expressway: Cobalt Square (104), Larchwood Residency (109).
  - New Gurugram: Marigold Enclave (82).
  - Sohna Road: Hollybrook Residency (49).
- **Registration number format:** the HARERA agent format above is a plausible placeholder. Confirm the real HARERA and UP RERA formats before build.
- **Consent references:** two formats are now in use, §5b's `C-1012-05` and WebDevInbox's `PLN-C-261017-0623`. I kept each record's existing format. Pick one when the ledger spec is written.

---

## 4. Decisions needed (founder, legal, CA)

The page publishes these as "Partner rules v1" / "Split rules v1". Each number below comes from broker.md and is marked [J] there, so it's a draft until decided.

| # | Decision | Where it shows | Who |
|---|---|---|---|
| D-1 | **Split percentages:**<ul><li>₹0 on agent-to-agent deals in year 1;</li><li>20% of the buyer-side fee when a buyer found the agent on Plinth;</li><li>desk 1% + GST, split 75% to the agent and 25% to Plinth;</li><li>nothing from listing fees;</li><li>₹0 ever on new launches;</li><li>25% of the agent share to the introducer when a buyer switches.</li></ul>broker.md says to test these in 5 societies. Publish only after sign-off | WebForAgents calculator, WebAgentProfile payments | Founder |
| D-2 | **Lawyer Q1(d) and Q5:** does resale brokerage (the desk, and Plinth's 20% referral share) need agent registration, and is it allowed with GST and invoicing as drawn? The founder dropped the pre-build memo. broker.md §6 says **don't start any broker money flow before counsel signs off.** The page says desk deals start only after Plinth's HARERA registration | WebForAgents split, WebAgentProfile payments | Legal |
| D-3 | **TDS and GST:** the section and rate for commission paid to agents under the Income-tax Act, 2025 (old s.194H; reportedly s.393; the page says "2% today"). Also GST on Plinth invoicing agents its 20% | Calculator note, payments table | CA |
| D-4 | **Unregistered resale-only dealers** (BG-11, supply §6): I designed a "Registration help" path. They can onboard but get no Verified status or partner badge until HARERA registers them. Excluding them shrinks resale supply | WaAgentOnboarding step 1 | Founder |
| D-5 | **Introduction window and disputes:** 60 days from the last verified visit, 90-day hard cap, 7-day decisions, an appeal panel with one outside broker | WebForAgents rules, ledger | Founder, Legal |
| D-6 | **Mandate shield:** active mandate + 60 days. I used a 90-day mandate in the example; confirm the standard mandate length and owner re-confirmation every 30 days | WebForAgents shield, WaAgentOnboarding R2 | Founder |
| D-7 | **Strikes:** 3 in 12 months → a 90-day pause; which behaviours count; the quarterly partner council | WebForAgents strikes | Founder |
| D-8 | **Badge thresholds:** reply ≤ 2 h median, accuracy ≥ 95%, ≥ 2 verified closings in 12 months, monthly recompute, appeals published | WebAgentProfile badge | Founder |
| D-9 | **"Never will be" a channel partner:** a permanent public commitment (G12, BG-21). It goes beyond D1's wording, so get explicit sign-off | WebForAgents CP section | Founder |
| D-10 | **"No previews for anyone"** next to the developer's private 7-day notice. The page states the exception openly. Confirm the wording with counsel (PRD §12.1 says no one can *pay* to preview) | WebForAgents bands | Founder, Legal |
| D-11 | **Desk staffing (supply open question 5):** staff explain records and do paperwork, partners do field work. This is now public copy | WebForAgents promise | Founder |
| D-12 | **Broker Pro:** the page says only "optional tools later for a flat monthly fee". Decide whether to publish ₹999–2,999/month and the 2027 timing, and confirm it never touches the badge, routing or bands | WebForAgents split notes | Founder |
| D-13 | **Promising the first-contact receipt (R2) publicly in R1** (G12) | WebForAgents CP section | Founder |
| D-14 | **Partner data terms:** an agent holding a buyer's real number becomes their own data fiduciary. That covers purpose limits, no broadcast groups without opt-in, deletion on request, and keeping the ledger for 12 months after a buyer ends a relay (DPDP retention) | WebAgentProfile relay and ledger | Legal |
| D-15 | **Competition law (CCI):** the calculator starts from an example fee. Copy says "Only an example. We never suggest a rate." Counsel to confirm that's enough, or switch to a blank fee input | WebForAgents calculator | Legal |
| D-16 | **Ops commitments:** pay within 7 days; a person replies within 2 working hours on WhatsApp; onboarding calls staffed in English and Hindi; monthly re-check of HARERA registrations | Several | Founder |

---

## 5. Follow-ups for other artboard owners (not edited by me)

- **WebPrivacy and AppYou:** the agent label "paid by the developer or you, never by Plinth" needs an R2 variant once desk shares exist (BG-03). Their Kestrel and Larkspur rows already match §5b.
- **AppYou:** add the optional "I'm an agent" row linking to WebForAgents and the WhatsApp onboarding (BG-22). Also reword "We earn only from buyers, sellers and lenders" (BG-12).
- **WebHome:** add the money-list row "Partner agents: a share of our resale fee, and optional tools later. Never affects ranking or bands." (BG-12).
- **AppProject and AppExplore:** relabel "Talk to our team" (BG-13).
- **PRD §2** positioning table: aim it at lead reselling, not brokers (BG-12).
- **WebDevInbox:** no change needed. Visit 4821, "No agent of record", is the "No agent" path. If the lead wants the canvas to show the agent case, Ishita's record already carries "Agent of record: Larkspur Realty".
- **Hindi:** the For-agents page links "हिन्दी में पढ़ें" (broker.md asks for English and Hindi). The translation is still to do.

---

## 6. Image requests

Three new empty slots, appended to `product/design/assets/requests_broker.json`. All have no logos, emblems or legible text.

| Slot | Aspect | Used on | Subject |
|---|---|---|---|
| `agentSocietyGate` | 4:5 | WebForAgents hero | An agent's glass kiosk at a society gate in the morning, towers behind; the agent seen from behind |
| `agentVisitingCards` | 4:5 | WebBrokerCheck, "Who pays the agent?" | A hand holding three completely blank visiting cards in a site office |
| `agentLarkspurOffice` | 4:5 | WebAgentProfile hero | A tidy small agent's office on Dwarka Expressway, cranes through the window, no people |

**Reused with existing `src`:**
- `deedKeys`, `salesGallery`, `phoneSiteVisit`, `heroCoral`, `heroKestrel`, `heroAurelia` (WebForAgents);
- `corridorAerial`, `heroKestrel`, `heroAurelia` (WebAgentProfile);
- `roomBare` (forwarded photo in WaAgentOnboarding).

WebForAgents and WebAgentProfile each carry at least 4 pictures. WebBrokerCheck is a small utility page with 1 picture.

---

## 7. Checks run

The same checks run on every file (`scratchpad/broker/check.py`):
- HTML tag balance, plus a scan for unquoted attributes and self-closing non-void elements.
- Exactly one `<script src="./support.js"></script>`, and `data-props` that parses as JSON.
- A banned-pattern scan: glass/blur, radial glow, shadows at rest, banned fonts, `<iframe>`, emoji, stock phrases, and judgement words such as "safe" and "guarantee".
- A Node run of `renderVals()` in Day and Night and under every enum tweak, then every top-level and per-item handler fired over 3 rounds with timers flushed. Every `{{hole}}`, including nested loop items, resolves with no `undefined` or `NaN`.

**Result:** all five files clean (states exercised: WebForAgents 5,005; WaAgentOnboarding 6,532; WebAgentProfile 1,228; WaAlerts 3,278; WebBrokerCheck 438).

I also stepped through the key flows by script:
- WaAlerts: confirm blocked until screen 3 is answered; a typo gives not found; 1187 gives Kabir; booking carries the agent to the pass, the bubble and the site-office notice; No agent and Larkspur give their cap notes.
- Onboarding: typo → not found → match → "Is this you?" → PAN → coverage → call → Verified agent.
- Intake: owner number validation → masked number → OTP confirmed → roll-call reply.

Nothing was rendered in a browser, so `$preview` heights are estimates from the layout arithmetic. Adjust them after one look on the canvas.
