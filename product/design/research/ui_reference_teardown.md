# UI reference teardown: world's top real estate platforms → patterns for our R1

| | |
|---|---|
| **Purpose** | Phase 3 input. Which proven UI patterns to adopt for the R1 screens in PRD §19, and how to adapt them for a buyer-side, evidence-led Delhi NCR product |
| **Date** | 18 Oct 2026 (all sources accessed 18 Oct 2026 unless stated) |
| **Method** | (1) Live inspection in a browser at 1440×900 and 375×812, with computed styles read from the DOM, of Zillow, Rightmove, Airbnb, Bayut, Property Finder, Funda and Housing.com. (2) Desk research on design posts, release notes, app-store listings and research papers. (3) PRD v1.0 §1, 2, 5, 6.4, 7, 8, 10, 11 |
| **Tags** | **[L]** = observed live by us on 18 Oct 2026. **[J]** = our judgement. **[gap]** = not verified in this pass. Numbers in brackets such as [S3] point to the source list at the end |
| **Coverage gaps** | Redfin and Zillow detail pages showed bot challenges, so we stopped; Zillow *search* loaded. realestate.com.au and Domain were blocked. Those sections rely on press releases, help pages and app-store listings. Indian portal pages mostly blocked fetches; facts marked as search-engine snippets in the sources are lower confidence. See §9 |

---

## 0. The ten patterns most worth copying

1. **A sticky decision card** on the project page (Airbnb booking card [L]). It holds the band, all-in cost and possession dates, and "Follow" is the main action, not "Contact".
2. **Blanks shown, not hidden** (Rightmove "Ask agent" [L]). Ours reads "Not filed with HARERA".
3. **Dated, expiring verification** (Bayut TruCheck [L, S42]). Every fact carries a date.
4. **A ranking disclosure beside the result count** (Funda [L]). Ours: "No paid placement."
5. **Total price by default** (Airbnb, worldwide since Apr 2025 [S12]). Ours is the all-in cost.
6. **An off-plan timeline and payment tiles** (Property Finder [L]), plus our original-vs-revised dates.
7. **A list + map split; map + standard bottom sheet on mobile** (Airbnb, Zillow [L, S10]).
8. **Editable affordability maths inline** (Rightmove [L]), and personal affordability tags (Redfin [S35]).
9. **AI as chips, suggested questions and a sourced compare** (Rightmove's Summarise chip and Comparison Assistant "Sources" [L, S38]), never an AI-only page.
10. **Filter pills, with "Save search" as the filled primary button** (Zillow [L]).

---

## 1. Starred platforms

### 1.1 Zillow (US)

| Area | What we found |
|---|---|
| **Navigation** | Web now has a 78px **left rail**: Search · Updates · Favorites · Plan · Inbox [L]. It mirrors the app tabs: Search · Updates · Saved Homes · Home Loans · Inbox (partly verified) [S31]. "Updates" is a first-class alerts destination |
| **Search results** | Map **left**, 2-column list **right**. At 1440px the list is ≈52% and the map ≈42% [L]. Filter row: search box, For Sale, Price, Beds & Baths, Home Type, Filters (40px, 12px radius), then **"Save search"** filled #0041D9 [L]. "3,115 results · Sort: Homes for You" [L]. Keyword search matches strictly, so "3 bed" matched "3 CAR GARAGE" [S30]. Multi-shape draw-on-map and school attendance-zone search [S31] |
| **Card** | 12px radius, shadow `0 8px 20px rgba(0,0,0,.15)`, photo ≈1.89:1, white pill badges at 12px/700 ("Open: Sun 1–3pm", "Showcase"), heart top-right. Price 20px/700. Facts line "4 bds \| 3 ba \| 3,670 sqft \| Active", then address and MLS attribution [L]. Other badges: Price cut, **BuyAbility** (within your budget), Preview (pre-market) [S31] |
| **Detail page** | Live view blocked. The Oct 2023 redesign moved to a single scroll with media on top and larger key facts (sq ft, Zestimate, lot, type). iOS groups the page into "What's Special / Market Value / Monthly Cost / Neighborhood" [S2]. Since then: Offer Insights (acceptance odds by offer amount), SkyTour, and **AI Virtual Staging** with 7 styles, re-roll and a before/after slider (Showcase listings only) [S31] |
| **Estimates and risk** | Zestimate median error is reported at 1.83% on-market and 7.01% off-market [S30]. First Street climate scores (flood, fire, wind, heat, air, each colour-coded with a map) were added in Sep 2024, then **removed from mid-Nov 2025** after the California MLS disputed the flood model and agents said they lost sales. Only a link out to First Street remains [S32] |
| **Saved and tools** | **Homes to Compare**: ≤5 saved homes, 70+ details, notes, share link. Shared collections. A buyer hub (budget → find → offer → close). Inbox threads per listing. **BuyAbility**: income, credit, debts and down payment → likely price, budget ceiling, odds of qualifying. AI mode beta (Mar 2026) [S31] |
| **Visual language** | **Object Sans** for headings and prices (H1 20px/900) [L]. Inter for body; blue for actions only; near-black on white; 4px grid. Design system: **Constellation** (web, iOS, Android, email) [S33, unofficial] |
| **Ratings** | iOS 4.8 from 7.2M; Google Play ~4.8 from 1.6M. Negative reviews in 2026 cluster on agent-contact spam, map/UI, AI search replacing autocomplete, data accuracy and filters [S34] |

### 1.2 Redfin (US)

| Area | What we found |
|---|---|
| **Search** | Bot challenge on the live site [L]. Conversational search ("describe what you're looking for") opens from the search bar on home, map and listing pages. Users view about twice as many listings and are 47% more likely to request a tour; 50% of queries need things filters can't express [S35]. Results refresh on pan. A sortable **Table view**. "Draw" at the bottom of the map [S35] |
| **Card signals** | **Hot Home** pin and photo banner (≥70% chance of an accepted offer within 2 weeks). **Buying-power badges** based on debt-to-income: **Affordable** (0–36%) · **Stretch** (37–50%) · **Ambitious** (>50%) [S35]. Card sash colours were changed in 2017 so brand red next to for-sale green would not confuse colour-blind users [S36] |
| **Detail page** | **Climate section**: First Street Flood, Fire, Heat, Wind and Air, shown as a preview that you click into, with factor scores 1–10, FEMA zone and 30-year projections. Normal click-through is ~3.5%, peaking at 16.3% in Florida during a hurricane [S35]. **Redfin Estimate** with a value-history chart and a published accuracy page (median error 1.90% on-market, 7.45% off-market) [S35]. **Ask Redfin** Q&A with handoff to an agent [S35] |
| **Saved, nav, look** | Favorites lists (≤100) with a co-editing "search partner"; no dedicated compare. **Redfin Redesign** AI restyling [S35]. iOS tabs: Find Homes · For You · Favorites · My Redfin [S35]. Libre Franklin and brand red [S36]. iOS 4.8 from 1.6M ratings; criticised for steering buyers to its own agents [S34] |
| **For us [J]** | (1) The climate section's structure (factor → plain level → named source → drill-in) is the closest analogue to our Delivery Risk card. (2) Affordable / Stretch / Ambitious is a ready model for a *personal* affordability tag (F-12), kept visually distinct from the risk band |

### 1.3 Rightmove (UK)

| Area | What we found |
|---|---|
| **Home** | Three tabs **Buy / Rent / Sold** above one "area, postcode or station" box. Some users see a **Classic / AI** search toggle [S37] |
| **Search results** | Navy filter bar: location, radius, Min/Max price, Min/Max beds, Type, Filters. Then **"Save Search"** and **"Create Alert"**, "60,513 results", sort, and a **"Map view"** toggle. List is the default; map is a separate view [L]. "+ Add keyword" ranks matches first. Draw-a-Search with saved named areas [S37] |
| **Card** | Horizontal, 8px radius, 1px #C3C4C9 border, **no shadow**, photo ≈1.39:1. Price qualifier ("Guide Price", "Offers Over") then price at 24px/500. Address 16/500 navy; type, beds and baths icons; excerpt; "NEW HOME" pill; **"Added on 15/10/2026"** or "Reduced on"; agent logo and phone; Contact; Save [L, S37]. Paid tiers get banners and a 1+2 mosaic ("FEATURED NEW HOME – PREMIUM LISTING") [L, S37]. Image rules ban text or borders on photos [S37] |
| **Detail page, in order** | 1+2 gallery with "1/28" → pill → address → price (i) → **"Can you afford it?"** → Added on → key facts in uppercase micro-labels: PROPERTY TYPE · BEDROOMS · BATHROOMS · SIZE (sq ft *and* sq m) · TENURE (i) → Key features → **AI chip "Summarise property details"** → Description → ungated brochures → **material information** (council tax, parking, garden, accessibility, EPC, utilities, rights & restrictions; blanks read **"Ask agent"**) → **suggested questions** → map with Street View, **My places** travel time, Stations, Schools → **editable affordability** (deposit, rate, term) → broadband → sale history and nearby sold → agent → **private Notes** ("only you can see them") → fraud advice → disclaimer [L, S4]. Sticky right: "Marketed by" with mint "Call agent" and "Request details" [L] |
| **Alerts and AI** | Up to 20 alerts (Instantly / Daily / 3 days / 7 days), named and shared lists, and an app **Activity Centre** for matches and price cuts [S37]. **Ask Rightmove**: a floating pill [L]. Its **Comparison Assistant** (Oct 2026) compares ≤5 homes, lets users add rows and has a **"Sources"** button. Reported effect: 40% longer on site, 2x saves, 2x leads [S38] |
| **Visual language** | **Effra**. Slate body #4F5064, navy headings #000433. Mint **#00DEB6** used sparingly (Sign-in border, CTA fills). Hairline borders, 8px radii [L]. Component library **Kanso**. The teal was rebuilt for accessibility and dark mode in 2026 [S39] |
| **Ratings** | iOS 4.8 from 179K; Google Play 4.8. Complaints: Street View freezes, weak filters, map bugs [S37] |

### 1.4 realestate.com.au (Australia)

| Area | What we found |
|---|---|
| **Coverage** | Live view blocked [L]; web card anatomy is unverified |
| **App and results** | A vertical video discovery feed on app home (Nov 2025). Paid tiers buy size and position: Premiere is double-size, rotates to the top and gets ~2.2x enquiries [S40] |
| **Listing** | **AI "property highlights"**, walkthrough videos, in-app building & pest reports, a **"Make an offer"** button (editable or withdrawable), an inspection planner, government school data, synced notes, and a loan calculator **including upfront costs** [S40] |
| **Estimates and owners** | **realEstimate** shows a **High / Medium / Low confidence** level. My Properties tracks 5.2M owner homes, and the owner dashboard drives >50% of seller leads [S40, PRD]. 21% of AI Assistant sessions convert to a high-value action [S40] |
| **Look and ratings** | REA Group type: Pangea / Pangea Text [S40]. iOS 4.8 from 296K ratings, featured in "Apps We Love" [S40] |
| **For us [J]** | A confidence level beside an estimate is exactly our "Scored (low confidence)" state. Offer and inspection tools are R2+ Deal Room ideas |

### 1.5 Airbnb (the benchmark for search, map and listing UX)

| Area | What we found |
|---|---|
| **Home** | Tabs All · Homes · Experiences · Services over one rounded bar (Where · When · Who) with a pink round search button. Below it, place carousels [S5, S6]. The May 2025 release brought a "dimensional", animated interface with 3D icons [S7] |
| **Search results** | List left, map right [S10]. At 1440px the map is ≈46% of the viewport and the list is a 2-column grid [L]. "Filters" button plus 34px quick chips (pill, 1px #DDD, 12px). "Over 1,000 homes". **"Prices include all fees"** sits beside the count [L]. Total price became the default worldwide on 21 Apr 2025 [S12] |
| **Card** | **4:3** photo with dots, heart and a white "Guest favourite" pill; title 15px/500 #222; rooms; dates; struck-through price beside the **total** "for 5 nights"; "Free cancellation" [L] |
| **Map research** | Price-oval pins; lower-priority results become price-less mini-pins with 8x lower click-through; attention peaks at the map centre; 95% of users click ≤12 pins [S10] |
| **Mobile** | Map on top with a **standard bottom sheet** resting at about half height, chips under the search pill [L]. Apps use a bottom nav on iOS and Android: Explore · Wishlists · Trips · Messages · Profile (Wishlists inferred) [S7, S11] |
| **Listing, in order** | Title (26px/500) with Share and Save → **1+4 mosaic** with "Show all photos" → type and capacity → rating → host → highlights → description → sleeping → amenities → calendar → reviews (6 categories) → location → host → things to know [L, S6]. **Sticky booking card**: 372px, 12px radius, shadow `0 6px 16px rgba(0,0,0,.12)`, sticky at 80px; a 48px pill **Reserve** button; "You won't be charged yet" [L, S6]. The skeleton loader mirrors the final layout [L] |
| **Saved and compare** | Wishlists (≤100) with collaborator notes and votes [S8]. **Side-by-side compare with AI summaries** (Fall 2026, US) [S9] |
| **Visual language** | **Airbnb Cereal** (Dalton Maag 2018, 6 weights) [S13]. Rausch #FF385C as the single accent on greys #222 / #6A6A6A / #DDD / #F7F7F7. Radii 12 (cards), 8 (inputs), pill. 4px spacing base [S14, unofficial]. DLS principles: Unified, Universal, Iconic, Conversational [S11] |
| **Ratings** | iOS 4.8 from 703K, Editors' Choice; Google Play ~4.6 [S16]. Material Design Award 2016 [S11] |

---

## 2. Other references (distinctive patterns only)

| Platform | Pattern worth noting | Use for us |
|---|---|---|
| **Compass** (US) | Price is paired with "Est: $9,157/mo". In-page tabs: Overview · Location · Property Info · **Public Records** · Schools. A **"Last updated: 10/17/2026 01:31 PM"** timestamp. Payment calculator. Redesign on 22 Sep 2026 [S17]. iOS 4.8 from 14K ratings [S17] | A "Public records" tab is a direct precedent for our truth panel. Timestamp every fact block |
| **Bayut** (UAE) | All/Ready/Off-Plan control; toggles "TruCheck listings first", "Properties with floor plans" [L]. **TruCheck** needs an agent photo shoot within 500 m of the flat. The badge carries a **timestamp**, shows lines like "Property authenticity was validated on 15th of October", and **expires** (45 days for off-plan) [L, S42]. **DLD transaction history** on listings and a right-rail "Recent sale transactions" table [L, S42]. New-project filters for "% Completion" and "Handover By" [S42]. Paid PRIME/SIGNATURE tags; promo modal on arrival [L] | Copy expiring, dated verification and official transactions as context. Reject paid tiers and arrival modals |
| **Property Finder** (UAE) | New-project cards: "Off-Plan", "Delivery Date: Q2 2031", **"Construction progress: 23%"**, launch price, "3 Payment Plans", developer logo, a Compare checkbox, WhatsApp [L, S43]. The project page has **sticky anchor tabs**, Key information (delivery date, payment plan 5/50/45, government fee 2%), **payment-plan tiles** and a **timeline stepper** (announced → construction started → expected completion) [L]. Verified badges expire (90 days for sale); SuperAgent is recomputed monthly from response time and quality [S43] | The closest analogue to our project page. We add *original vs revised* dates, QPR filing history and sources, none of which it shows. Progress % appears only next to time elapsed |
| **Funda** (NL) | Filters include "Days on Funda" [L]. A labelled paid carousel plus the disclosure **"The order of the results depends partly on paid placement options"** [L]. Price suffix "k.k." (buyer pays costs) or "v.o.n." (costs included) [L, S44]. The energy label is a graphic with a **"What does this mean?"** link [S44]. Research found 75% of visitors clicked photos first, which led to a photo-led single page with no tabs [S44]. In 2026, AI-staged photos misrepresenting room sizes drew press criticism [S44]. Equal-weight "Disagree and close" cookie choice [L] | Ranking disclosure, cost-basis suffix (ours: "all-in"), and a rating graphic with a "What does this mean?" link. A cautionary tale for Visualise |
| **Indian portals** | **Housing.com** [L]: festive hero, floating video ad, ad slot, locality chips; project cards "₹1.79 Cr – 3.58 Cr", BHK list, sector, "by <developer>", **Contact**; a grid of "Show Contact" broker cards; no RERA ID or possession on cards. **Square Yards**: "Starting from ₹3.12 Cr" + **"+ Charges"**; a status pill before possession ("Under Construction · Possession Mar 2031"); **RERA number with a verification QR**; developer box "12 Total Projects · 1 Delivered" [S45]. **99acres**: "View Phone Number" needs a form + OTP, then sends your details to the advertiser [S45]. Play ratings sit at 4.4–4.7, but reviews centre on spam calls and fake listings [S45] | Keep the local mental model (₹ Cr/L, BHK, Sector, possession month). Copy RERA + QR and delivered-vs-total counts. Reject contact harvesting and "+ Charges" |
| **Domain** (AU) | iOS 4.7 from 118K ratings. Shortlist with an **inspection view** (pick the times you will attend, then navigate to each). Off-market alerts, collaborative shortlists, "critical perils" hazard data, and Vision Pro compare. Paid Silver/Gold/Platinum tiers buy bigger cards [S41] | The shortlist-to-visits flow is a model for WhatsApp visit booking (F-44) |
| **Idealista** (ES/IT/PT) | Reduced listings show the **previous price and the drop %**; shared lists with view-only or collaborate permissions; Discarded and Notes menus. Play 4.8 from ~515K reviews [S46] | Show change history on price and dates the same way: old → new, with the delta |

---

## 3. Pattern library for our R1 screens

### 3.1 Web

| R1 screen | Adopt (reference) | Adapt for us |
|---|---|---|
| **Home** | Single location-first search (Rightmove, Airbnb pill [L]); live inventory count (Property Finder [L]); locality chips (Housing [L]) | H1 promise ("Know before you book"); one natural-language search box; a second entry, "Check a builder or RERA ID"; three corridor chips with live counts; a trust strip ("No developer pays us. Ever. · How we make money"). Below the fold, "What changed this week" (band changes, extensions, orders) shows the data is alive. No carousels, banners, ads or install sheets [J] |
| **Search results (list + map)** | Airbnb/Zillow split; Zillow/Funda pill filters; Airbnb filter modal; Bayut "TruCheck first" toggle; Funda ranking disclosure [L] | List on the left (≈58%), map on the right (≈42%). List-first, because our cards carry text evidence [J]. Filters: Budget (all-in) · BHK · Possession by · Delivery Risk · More filters, then **Save search** as the filled primary. A "Hide High & Severe" toggle chip. Under the count: "No paid placement. How ranking works". Map pins are price pills plus a band glyph (letter or shape, never colour alone [S24]). Empty state suggests relaxations with counts ("Include Elevated: +12 projects") [J] |
| **Project page** | Airbnb mosaic + sticky card; Property Finder anchor tabs + timeline + payment tiles; Rightmove key-facts row, material info, AI summary chip, private notes; Zillow single scroll with larger facts [L, S2] | **Order:** title block (name, developer link, sector, "RERA ID verified live ✓", Share, Save) → key-facts row (BHK · Carpet area · All-in from · Possession (RERA) · Towers/units) → **Delivery Risk card** → **Truth panel** (facts with source chips; blanks shown as "Not filed") → **All-in cost** → **Visualise** entry → floor plans with dimensions → location → developer track record (summary) → developer's response → disclosures. Photo labels: "Developer render" vs "Site photo · dated". **Sticky decision card** (≈360–380px): band chip, all-in range, possession original → current, primary "Follow this project", secondary "Get my all-in cost", tertiary "Book a visit on WhatsApp" [J] |
| **Developer page** | Compass "Public Records" tab [S17]; Bayut transactions table [L] | Header: group name, SPV count, Track Record band. A ledger of past RERA projects with promised vs actual dates as a **dumbbell chart**. Filters: Delivered on time / Late / Stalled. An SPV tree. Right-of-reply box [J] |
| **Compare (2–4)** | Zillow Homes to Compare (≤5, notes, share link) [S31]; Rightmove Comparison Assistant (≤5, user-added rows, "Sources" button) [S38]; Airbnb wishlist compare with AI summaries [S9]; NN/g [S23] | Entry from Saved. Sticky project headers, a fixed row order (band → natural frequency → all-in per carpet sq ft → possession reliability → top reasons), a "Show differences only" toggle, ≤4 columns on desktop. The AI summary is labelled and has a Sources button, as Rightmove's does. A share link for family (F-05) |
| **Cost-sheet normaliser** | Rightmove inline editable affordability [L]; Funda cost-basis suffix [L]; Airbnb total price [S12] | Upload → **extraction review** (each line item with page citation and editable) → result as a **waterfall** from quoted price to all-in, with ₹ per carpet sq ft, loading % and negotiable items flagged. Assumptions stay visible and editable [J] |
| **Visualise** | Zillow / Redfin staging [PRD] | Original first; before/after slider; burned-in "AI-staged" label; Indian style presets as chips; a "Structure locked" note; downloads keep the label and provenance |
| **Alerts centre** | Zillow "Updates" destination [L]; Rightmove alert frequencies (Instantly / Daily / 3 days / 7 days) and app Activity Centre [S37] | Grouped by followed project. Each alert says what changed, gives source and date, and states the effect on the band. A channel × frequency matrix (WhatsApp / push / email × instant / weekly) |
| **Methodology** | Redfin Estimate page (median error, update cadence, coverage) [S35] | Version + changelog, factor weights, the calibration table behind "38 of 100", the override rules, governance and the dispute log |
| **Evidence & Reply portal** | No direct real-estate precedent [J] | Claim → submit evidence (labelled by provenance) → status stepper with SLA (Acknowledged ≤48h → Decided ≤15 working days) → a preview of the published response exactly as buyers will see it |
| **Privacy centre** | Rightmove "only you can see them" notes [L] | A **"Who has my number"** ledger: party, project, date, purpose, masked relay, and a **Revoke** button per row. Plus consent history, download and delete [J] |

### 3.2 Android

| Screen | Adopt | Adapt |
|---|---|---|
| **Home / search** | Material 3 nav bar: 3–5 destinations, 80dp [S20]; Airbnb pill search [L] | **Search · Saved · Alerts · Ask · Profile**, with labels always on. The search pill opens a full-screen search with natural language and voice |
| **Map results + sheet** | Airbnb mobile map + standard sheet [L]; MDC sheet states [S20] | A **standard** (non-modal) sheet with peek (count + sort), half (2 cards; `halfExpandedRatio` 0.5) and full (list). Drag handle with a 48dp touch target; max width 640dp. Back collapses the sheet first. A floating Map/List pill |
| **Project detail** | Airbnb mobile listing; Zillow app categorised sections [S2] | Full-bleed swipe gallery. **Sticky bottom bar**: band chip + "Follow" + "All-in cost". Sections in the same order as web |
| **Risk card detail** | Harding Center fact box [S25]; icon arrays | A full-screen route, not a stacked sheet [S23b]. Contents: band, 10×10 icon array, ≤4 reasons with source chips, what would change it, confidence, "Data as of", developer response |
| **Compare** | NN/g: ≤2 side by side on mobile [S23] | Two visible columns, swipe for the 3rd and 4th, sticky row labels |
| **Visualise camera** | — | Capture with a level/grid guide → style chips → result with before/after slider and burned-in label → share. The original is always one tap away |
| **Alerts inbox** | Zillow Updates [L] | Grouped by project, with an unread dot and a severity tag (text + icon) |
| **AI concierge** | Ask Rightmove [L]; BayutGPT [L] | Citation chips under every answer, suggested questions, "Talk to a person" handoff, and an AI disclosure line |
| **Profile / privacy** | — | The same ledger as web, with one-tap revoke |

---

## 4. Presenting the Delivery Risk card: borrowed mechanics

| Mechanic | Reference | How we apply it to §6.4 of the PRD |
|---|---|---|
| A score next to a named data source, previewed then drilled into | Redfin climate section: 5 factors, 1–10 scores, First Street named, a preview that opens a detail view [S35] | "Data as of 14 Oct 2026 · v1.2 · Sources: HARERA, IBBI" sits on the card itself, not in a footnote. The preview on the card opens the full card |
| Confidence shown beside an estimate; accuracy published | realEstimate High/Medium/Low confidence [S40]; Redfin Estimate's published median error [S35] | Confidence state: "Scored (low confidence)" shows a wider frequency band ("30–46 of 100") [J]. The methodology page publishes calibration |
| A score that can be bent will be | Zillow removed its climate scores after MLS and agent pressure [S32] | No-developer-money rule (D1); overrides based only on documented events; a public dispute log |
| A natural-frequency fact box | Harding Center fact boxes [S25]; Gigerenzer: absolute frequencies, not relative risk [S47] | "About 38 of 100 similar NCR projects finished >12 months late", with a 10×10 icon array (filled icons grouped, not scattered) [J] |
| Icon arrays change perceived seriousness | Galesic et al. 2009: arrays aid comprehension at all numeracy levels, but risks shown as arrays feel *less* serious; 1,000-icon arrays feel more serious than 100 [S47] | Use a 100-icon array, always paired with the band word and the number. Never show the array alone |
| A rating graphic with a plain-language explainer | Funda energy label + "What does this mean?" [S44] | "What does Elevated mean?" link on every band chip, opening the methodology anchor |
| Blanks shown, not hidden | Rightmove "Ask agent" [L] | "QPR not uploaded (Jun 2026)" is shown as a reason, never left blank |
| Dated verification | Bayut "validated on" [L] | Each reason ends with a source chip: "HARERA QPR · Jun 2026 ↗" |
| A timeline | Property Finder stepper [L] | Original date → each Section 6 extension → current date, drawn on one axis |
| Not colour alone | WCAG 1.4.1, 1.4.11 [S24] | The band name in text, a 5-segment position meter and an icon. Colour reinforces the band but never carries it alone |
| Progressive disclosure ≤2 levels | NN/g [S26] | Level 1: band, frequency and the top reason on cards. Level 2: the full card. The evidence drawer is the deepest level |

---

## 5. Concrete layout specs worth copying

| Spec | Value | Source |
|---|---|---|
| Desktop list : map | Airbnb ≈51:46; Zillow 52:42 + 78px rail. **Ours: 58:42, list left** | [L]; ours [J] |
| Card photo ratio | Airbnb 4:3; Rightmove ≈7:5; Zillow ≈1.9:1. **Ours: 4:3 thumbnail in horizontal desktop cards; 3:2 in vertical mobile cards** | [L]; ours [J] |
| Card radius / elevation | Airbnb and Zillow 12px; Rightmove 8px + 1px border, no shadow. **Ours: 12px cards, 8px inputs and buttons, hairline borders, shadow only on sticky or floating layers** | [L, S14]; ours [J] |
| Sticky side card | Airbnb 372px, sticky at top 80px | [L] |
| Primary CTA height | Airbnb 48px; Material 48dp minimum touch target | [L, S20] |
| Filter chips | Airbnb 34px pill, 1px #DDD, 12px text; Zillow 40px, radius 12. **Ours: 36px visual, 48dp hit area on Android** | [L]; ours [J] |
| Price typography | Zillow 20/700; Rightmove 24/500; Funda 20/600. **Ours: 20–24px semibold with tabular figures** | [L]; ours [J] |
| Key-facts row | Rightmove uppercase 11–12px labels over values; area in two units | [L] |
| Spacing base | Airbnb 4px base. **Ours: 4px base on an 8-pt rhythm** | [S14]; ours [J] |
| Bottom sheet | Drag handle ≥48dp, max width 640dp, half-expanded ratio 0.5, top corners extra-large; modal vs standard | [S20] |
| Bottom nav | 3–5 destinations; 80dp (M3) | [S20] |
| Compare | ≤5 items (dynamic 3–4); ≤2 side by side on mobile; sticky headers; "show differences" | [S23] |
| Disclosure depth | ≤2 levels | [S26] |
| Contrast | Text 4.5:1 (large 3:1); UI and graphics 3:1; never colour alone | [S24] |
| Performance | Report pages <150KB JS, LCP <2.5s on throttled 4G | PRD §11 |

---

## 6. Anti-patterns to avoid

| Anti-pattern | Seen at | Our rule |
|---|---|---|
| Interruptive modal on arrival | Bayut "TruBroker Stories" promo [L]; Airbnb "Translation on" and price explainer modals [L] | No modal before the user acts. Put explainers inline next to the thing they explain |
| App-install sheet over results | Airbnb mobile web [L] | A one-line banner at most, and never over content |
| Ads and campaigns above the fold | Housing.com festive hero, floating TVC video, large ad slot [L]; Rightmove display ad under the sticky card [L] | No display ads, ever (PRD principle 2) |
| Paid tiers that look like ranking | Rightmove "PREMIUM LISTING" band [L]; Bayut PRIME/SIGNATURE [L]; Funda Topposities (at least disclosed) [L] | No paid placement. Say so next to the result count |
| "Contact" as the only action; broker contact grids | Housing.com "Contact" and "Show Contact" [L] | The primary action is Follow or Get all-in cost. Contact is opt-in, masked and capped at 3 (F-80) |
| Price ranges without charges | Housing.com "₹1.79 Cr – 3.58 Cr" [L]; Square Yards "+ Charges" [S45]. Drip pricing is one of the patterns in India's 2023 dark-pattern guidelines [S48] | All-in price on cards, with the basis stated |
| Developer copy presented as fact | "75% sold – limited remaining" in a listing description [L] | A "Developer says" container, kept visually separate from "Records show" |
| Platform disowning its own data | Rightmove disclaimer: "makes no warranty as to the accuracy" [L] | Every fact is sourced and dated. A correction route exists (F-84) |
| Floating chat bubble that competes with CTAs | BayutGPT, Ask Rightmove pills [L] | "Ask" lives in the nav and as an inline prompt on the page, not as a floating overlay over evidence [J] |
| Lost context between pages | Airbnb header resets to "Anywhere · Anytime" on the listing page [S6] | Keep the search context in the header and the back state |
| OTP walls that release your number | 99acres "View Phone Number" form + OTP shares details with the advertiser [S45]; pre-ticked consent [PRD §2] | OTP only to save or follow, never as a toll for information. Ungated brochures (as Rightmove does [L]); consents unticked |
| Unlabelled or size-distorting AI photos | Funda 2026 AI-staging controversy [S44] | Burned-in label, structure lock, scale check, original first (F-24) |
| Modelled scores without observed events | Zillow climate-score removal [S32] | Overrides and reasons come only from documented events |

---

## 7. Visual direction

**Character: "a calm instrument"**: a warm, well-made research tool, not a marketplace. Buyers spending ₹1.5–5 cr should feel it is precise, unhurried and on their side [J].

| Decision | Recommendation | Borrow from |
|---|---|---|
| **Typography** | One humanist or grotesk sans for UI with **tabular lining figures** and a well-drawn ₹ glyph; check ₹ and lakh/crore grouping before choosing. Optionally a restrained serif for page-level headlines and the methodology page, to signal editorial seriousness. Prices 20–24px semibold. Micro-labels uppercase, 11–12px, tracked | Rightmove (Effra, uppercase fact labels) [L]; Airbnb Cereal (tall x-height, legible at small sizes) [S13]; Zillow's larger key facts [S2] |
| **Colour** | A neutral-dominant UI (ink on warm off-white) with **one brand accent reserved for actions**. The **risk-band palette is a separate token set** that the brand never uses, so the brand can never be mistaken for a band. Avoid brand red (Severe) and brand green (Low). [J] An ink-indigo or deep-teal accent works best. Bands run Low → Severe on an ordinal ramp checked for colour-blind safety, always paired with text and position | Rightmove mint used sparingly [L]; Airbnb single accent on neutral greys [S14]; WCAG [S24] |
| **Shape and density** | 12px cards, 8px controls, pill chips; hairline borders rather than shadows. Moderate density on evidence surfaces (Rightmove-like), generous on home and marketing (Airbnb-like) | Rightmove and Airbnb [L] |
| **Photography** | Real site photos, dated and labelled. Developer renders badged "Developer render". AI staging carries a burned-in label. No stock lifestyle imagery | PRD principle 7; Bayut dated verification [L] |
| **Data visualisation** | Icon arrays (natural frequency), dumbbells (promised vs actual), timelines (extensions), waterfalls (all-in cost). Source chips on every chart | Harding fact boxes [S25]; Property Finder timeline [L] |
| **Iconography** | One outline set, 24px grid, 1.5–2px stroke; badges always icon + text | [J] |
| **Motion** | Functional only, 150–250ms: sheet transitions, the before/after slider, band-change emphasis. No 3D or celebratory motion around risk | Airbnb's shared-element transitions [S11] for navigation only |
| **Voice** | Plain English with numbers, no superlatives. "Records show…" vs "Developer says…" | PRD §2, §6.4 |

Lean hardest on **Rightmove** (clarity, honest blanks, editable maths), **Airbnb** (layout, sticky card, map/sheet, total price), **Property Finder** (off-plan anatomy), **Bayut** (dated verification) and **Funda** (ranking disclosure). Zillow helps with nav-rail IA and filters; Redfin with the shape of a risk section.

---

## 8. Open questions for Phase 3 [J]

1. Horizontal or vertical result cards on desktop. Prototype both with the full R1 evidence load.
2. Whether the band appears on map pins at all, given that Airbnb's attention research [S10] suggests pins should stay minimal.
3. Whether "Ask" sits in the Android nav bar (5 items) or as an inline entry point (4 items).
4. Typeface shortlist and a ₹-glyph test.

## 9. Coverage gaps to close in a follow-up pass

- **Live visual detail** of the Redfin and Zillow detail pages, and of REA and Domain web, all blocked by bot walls. Exact section order and CTA labels came from desk sources. Screenshots from a signed-in designer's own browser would close this.
- **Mobile gestures and bottom-sheet behaviour** in the Zillow, Redfin and REA apps (unverified); confirmed tab labels for Airbnb and REA.
- **Housing.com and MagicBricks** card anatomy and badge rules; brochure gating; Bayut badge visuals (fetches blocked).
- **India's 2023 dark-pattern guidelines (13 patterns):** fetch the official text and map it to the F-89 checklist. The ASCI 2024 audit found deceptive patterns in 52 of 53 top Indian apps [S48]. Real estate was not in the sample.
- Unofficial token sources ([S14], [S33]) should be treated as approximations, not specs.

---

## Sources (all accessed 18 Oct 2026)

- [S1] Zillow search, Seattle (live): https://www.zillow.com/seattle-wa/
- [S2] Zillow, "Zillow unveils a new look for property pages…", PR Newswire, 23 Oct 2023: https://www.prnewswire.com/news-releases/zillow-unveils-a-new-look-for-property-pages-their-biggest-redesign-in-5-years-301964364.html
- [S3] Rightmove results, London (live): https://www.rightmove.co.uk/property-for-sale/find.html?locationIdentifier=REGION%5E87490
- [S4] Rightmove property page (live): https://www.rightmove.co.uk/properties/94342974
- [S5] Airbnb search, Lisbon (live, en): https://www.airbnb.co.in/s/Lisbon--Portugal/homes ; Goa results: https://www.airbnb.com/s/Goa--India/homes
- [S6] Airbnb listing pages (live): https://www.airbnb.co.in/rooms/1765879455249604033 ; https://www.airbnb.com/rooms/1776251138275048654 ; teardown, 18 Sep 2026: https://typenorm.com/articles/airbnb-ux-teardown
- [S7] Airbnb 2025 Summer Release: https://news.airbnb.com/airbnb-2025-summer-release
- [S8] Airbnb Help, Wishlists: https://www.airbnb.com/help/article/1236
- [S9] Airbnb 2026 Fall Update: https://news.airbnb.com/airbnb-2026-fall-update
- [S10] Airbnb, map search ranking (KDD 2024): https://arxiv.org/html/2407.00091 ; https://medium.com/airbnb-engineering/improving-search-ranking-for-maps-13b03f2c2cca
- [S11] Google Design, "Airbnb invites you in": https://design.google/library/airbnb-invites-you-in
- [S12] Skift, total price display standard worldwide, 21 Apr 2025: https://skift.com/2025/04/21/airbnb-makes-total-price-display-standard-on-listings-worldwide/
- [S13] Dezeen, Airbnb Cereal, 16 May 2018: https://www.dezeen.com/2018/05/16/airbnb-new-scaleable-typeface-dalton-maag-design/
- [S14] Airbnb token reconstructions (community, not official): https://styles.refero.design/style/c2325884-4391-4688-85cd-e143f5107517 ; https://superdesign.dev/blog/airbnb-design-system
- [S15] Lottie: https://airbnb.tech/opensource/lottie/ ; Lava icon analysis (third party): https://medium.com/@waldobear002/airbnbs-new-lava-icon-format-a-technical-deep-dive-b2604626c7e0
- [S16] Airbnb on the App Store: https://apps.apple.com/us/app/airbnb/id401626263 ; Google Play: https://play.google.com/store/apps/details?id=com.airbnb.android
- [S17] Compass home, listing and redesign release: https://www.compass.com/ ; https://www.compass.com/homedetails/173-36-47th-Ave-Queens-NY-11358/20FV98_pid/ ; https://www.compass.com/newsroom/press-releases/BEsYKFmQg2fTbIFTgqDgJ/ ; App Store: https://apps.apple.com/us/app/id692766504
- [S18] Bayut, Dubai Marina (live): https://www.bayut.com/for-sale/apartments/dubai/dubai-marina/
- [S19] Property Finder new projects and project page (live): https://www.propertyfinder.ae/en/new-projects ; https://www.propertyfinder.ae/en/new-projects/aldar-properties-pjsc/al-ghadeer-gardens
- [S20] Material Components Android: BottomSheet, BottomNavigation, NavigationRail docs: https://github.com/material-components/material-components-android/tree/master/docs/components
- [S21] Funda, Amsterdam (live): https://www.funda.nl/en/zoeken/koop?selected_area=%5B%22amsterdam%22%5D
- [S22] Housing.com, Gurgaon projects (live): https://housing.com/in/buy/projects-in-gurgaon
- [S23] NN/g, Comparison tables: https://www.nngroup.com/articles/comparison-tables/ ; [S23b] NN/g, Bottom sheets: https://www.nngroup.com/articles/bottom-sheet/
- [S24] W3C, WCAG 2.1 (1.4.1, 1.4.3, 1.4.11): https://www.w3.org/TR/WCAG21/
- [S25] Harding Center, Fact boxes: https://www.hardingcenter.de/en/transfer-and-impact/fact-boxes
- [S26] NN/g, Progressive disclosure: https://www.nngroup.com/articles/progressive-disclosure/
- [S30] Zestimate error and keyword UX (secondary): https://listwithclever.com/real-estate-blog/how-accurate-is-a-zillow-zestimate-5-things-to-know/ ; https://romansorin.com/blog/zillows-confusing-keyword-ux
- [S31] Zillow newsroom and help: AI search (4 Sep 2024) https://zillow.mediaroom.com/2024-09-04-Zillows-AI-powered-home-search-gets-smarter-with-new-natural-language-features ; BuyAbility (19 Nov 2024) https://zillow.mediaroom.com/2024-11-19-Zillows-real-time-affordability-tool-helps-shoppers-quickly-find-homes-within-their-budget ; summer features (15 Jul 2025) https://zillow.mediaroom.com/2025-07-15-Summer-just-got-hotter-Zillow-debuts-five-powerful-new-features ; Virtual Staging (10 Sep 2025) https://zillow.mediaroom.com/2025-09-10-Zillow-brings-AI-powered-Virtual-Staging-to-Showcase-listings ; ChatGPT app (6 Oct 2025) https://zillow.mediaroom.com/2025-10-06-Zillow-debuts-the-only-real-estate-app-in-ChatGPT ; messaging (28 Oct 2025) https://zillow.mediaroom.com/2025-10-28-Zillow-launches-messaging,-a-new-way-for-home-shoppers-to-collaborate-within-the-Zillow-app ; AI mode (25 Mar 2026) https://zillow.mediaroom.com/2026-03-25-Zillow-debuts-AI-mode,-bringing-guided-intelligence-to-every-step-of-the-housing-journey ; buyer hub (23 Jun 2026) https://zillow.mediaroom.com/2026-06-23-Zillow-launches-a-personalized-hub-that-guides-home-buyers-from-first-search-to-closing ; Preview (17 Sep 2026) https://zillow.mediaroom.com/2026-09-17-Zillow-PreviewSM-listings-are-now-live-on-Realtor-com-R-,-offering-the-same-early-access-on-the-two-most-visited-real-estate-platforms-in-the-country ; Homes to Compare https://www.zillow.com/learn/home-comparison-tool-zillow-app/ ; school search https://zillow.mediaroom.com/2023-10-11-Search-by-school-on-Zillow-makes-house-hunting-as-easy-as-ABC ; draw https://www.zillow.com/news/new-draw-your-own-search-on-zillow-com/
- [S32] Zillow climate data added (26 Sep 2024) https://zillow.mediaroom.com/2024-09-26-Zillow-introduces-First-Streets-comprehensive-climate-risk-data-on-for-sale-listings-across-the-US ; removed: https://www.housingwire.com/articles/zillow-removes-climate-risk-data/ ; https://techcrunch.com/2025/12/01/zillow-drops-climate-risk-scores-after-agents-complained-of-lost-sales
- [S33] Zillow tokens and system (unofficial): https://fudge.design/share/zillow.com-design ; https://skills.lc/mikem-zg/zillowlabs/mikem-zg-zillowlabs-skills-constellation-design-system-skill-md
- [S34] App Store listings: Zillow https://apps.apple.com/us/app/zillow-real-estate-rentals/id310738695 ; Redfin https://apps.apple.com/us/app/redfin-buy-sell-rent-homes/id327962480 ; review analyses: https://unstar.app/blog/zillow-app-problems-removed-features-listing-data-2026 ; https://unstar.app/blog/zillow-redfin-realtor-trulia-home-search-apps-ranked-2026
- [S35] Redfin newsroom and pages: conversational search https://www.redfin.com/news/redfin-debuts-conversational-search/ ; iOS https://www.redfin.com/news/conversational-search-is-now-available-on-the-redfin-iphone-app/ ; Hot Homes https://www.redfin.com/news/redfin-hot-homes/ ; buying power https://www.redfin.com/news/new-on-redfin-see-your-buying-power-while-you-search/ ; climate engagement https://www.redfin.com/news/how-homebuyers-engage-with-climate-risk-data/ ; Redfin Estimate https://www.redfin.com/redfin-estimate ; Ask Redfin https://www.redfin.com/news/introducing-ask-redfin/ ; Favorites lists https://www.redfin.com/news/redfin-launches-favorites-lists-to-help-organize-your-home-search/ ; Redesign https://www.redfin.com/news/introducing-redfin-redesign-ai-tool/ ; draw https://www.redfin.com/news/draw-your-own-search-on-the-redfin-iphone-app/ ; table view (secondary) https://www.homelight.com/blog/redfin-vs-zillow/
- [S36] Redfin typography and design language: https://careyspies.design/typography ; https://www.redfin.com/news/its-a-red-red-red-red-world/
- [S37] Rightmove: home https://www.rightmove.co.uk/ ; FAQs (AI search, keyword sort, draw-a-search, alerts, My Rightmove) https://faq.rightmove.co.uk/support/solutions/articles/7000100087-ai-search-and-ask-rightmove- ; https://faq.rightmove.co.uk/support/solutions/articles/7000048756-keyword-sort ; https://faq.rightmove.co.uk/support/solutions/articles/7000048757-draw-a-search ; https://faq.rightmove.co.uk/support/solutions/articles/7000048758-how-to-register-for-property-alerts ; technical guidelines PDF https://media.rightmove.co.uk/pdf/rightmove_technical_guidelines.pdf ; paid tiers https://www.propertyinvestmentproject.co.uk/blog/rightmove-premium-and-featured-listings/ ; App Store https://apps.apple.com/gb/app/rightmove-property-search/id323822803
- [S38] Rightmove AI: https://www.rightmove.co.uk/press-centre/rightmove-adds-ai-powered-comparison-assistant-to-search-results/ ; https://www.rightmove.co.uk/press-centre/rightmove-unveils-ai-tools-to-enhance-home-search-experience/
- [S39] Rightmove identity and system: https://theteam.co.uk/work/rightmove-rebrand-brand-identity/ ; https://rightmove.blog/why-teal-isnt-tealing/
- [S40] REA: AGM address, 8 Oct 2026 https://rea3.irmau.com/site/pdf/b7b43e76-7414-4309-b527-5479be2d922d/Platform/ListPage/Chairman-and-CEO-AGM-Addresses-and-Market-Update.pdf ; spring 2025 features https://eliteagent.com/five-fresh-features-realestate-com-au-drops-smarter-more-immersive-app-experience-for-spring/ ; video feed https://eliteagent.com/realestate-com-au-launches-first-to-market-video-in-app/ ; tiers https://buymyplace.com.au/on-the-market/why-your-online-property-search-results-matter ; realEstimate PDF https://rea3.irmau.com/site/pdf/193c6f8f-54d2-4f20-870a-9b02e8158c28/realestatecomau-empowering-property-owners-with-realEstimate.pdf ; confidence https://www.propertynow.com.au/blog/what-s-the-most-accurate-property-value-estimator/ ; typeface https://fontsinuse.com/uses/53982/rea-group-brand-identity-and-websites ; App Store https://apps.apple.com/au/app/realestate-com-au-property/id404667893
- [S41] Domain on the App Store: https://apps.apple.com/au/app/domain-real-estate-property/id319908646
- [S42] Bayut: TruCheck https://www.bayut.com/mybayut/trucheck-bayut-uae/ ; off-plan badge validity https://www.bayut.com/agentportal/your-guide-to-the-checked-and-trucheck-badge-for-off-plan-property-listings/ ; Dubai Transactions https://www.bayut.com/mybayut/dubai-transactions-feature-bayut/ ; new projects https://www.bayut.com/new-projects/dubai/
- [S43] Property Finder: new projects (Business Bay) https://www.propertyfinder.ae/en/new-projects/lp/dubai/business-bay ; verified listings https://www.propertyfinder.ae/partnerhub/get-more-leads-by-verifying-your-listing/ ; SuperAgent https://www.propertyfinder.ae/partnerhub/super-agent/
- [S44] Funda: rebrand https://blog.funda.nl/rebranding-at-scale-how-we-sharpened-fundas-visual-identity-across-the-platform/ ; 2025 highlights https://blog.funda.nl/2025-at-funda-highlights-from-our-colleagues/ ; saved searches https://blog.funda.nl/from-design-to-release-how-did-we-work-together-to-bring-the-multiple-saved-searches-feature-to-life/ ; redesign research (snippet) https://medium.com/@valsplat/the-funda-redesign-making-a-great-site-better-40ee2aafbf3c ; listing conventions https://reefapi.com/funda-api ; AI photos https://nltimes.nl/2026/02/10/ai-images-misleading-home-seekers-funda
- [S45] India: Square Yards https://www.squareyards.com/new-projects-in-gurgaon ; https://www.squareyards.com/gurgaon-residential-property/smart-world-natures-court/342513/project ; NoBroker https://www.nobroker.in/new-projects-in-gurgaon ; 99acres contact FAQ (snippet) https://www.99acres.com/faq/how-do-i-contact-a-property-owner-seller-on-99acres.html ; Play listings (snippets): https://play.google.com/store/apps/details?id=com.locon.housing , https://play.google.com/store/apps/details?id=com.nnacres.app , https://play.google.com/store/apps/details?id=com.timesgroup.magicbricks , https://play.google.com/store/apps/details?id=com.nobroker.app
- [S46] Idealista: https://www.idealista.fr/en/applications ; https://apps.apple.com/us/app/idealista/id465958311 ; card fields (scraper schema, unofficial) https://apify.com/webdata_labs/idealista-price-drop-scraper
- [S47] Gigerenzer et al. 2007, https://doi.org/10.1111/j.1539-6053.2008.00033.x ; Galesic, García-Retamero & Gigerenzer 2009, https://doi.org/10.1037/a0014474
- [S48] ASCI & Parallel, Conscious Patterns report (Aug 2024): https://www.ascionline.in/wp-content/uploads/2024/08/Consious-Patterns-Report-Summary.pdf ; Department of Consumer Affairs guidelines, 30 Nov 2023 (press release, not fetched): https://pib.gov.in/PressReleasePage.aspx?PRID=1981413
- [PRD] `product/PRD.md` v1.0 (§2, §6, §10, §11), citing [INT], [CT]
