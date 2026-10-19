# Fix pass: discovery, compare, cost, visualise and Ask Plinth (G-21 to G-39)

**Date:** 18 Oct 2026. **Owner:** principal product design, discovery and tools.
**Artboards:** `scratchpad/canvas/project/`. I edited only the 14 files I own and created `AppCostSheet.dc.html`. I didn't touch `canvas.json` or any other artboard, didn't publish and didn't open a browser. Untouched copies of the 14 files are in `scratchpad/tools2/backup/`.
**Rules applied:**
- DESIGN.md §0 (taste rules), §3–§4c, §5b, §6 and §7.
- PRD §17 (D1, D2) and §20 (D13 and the policy lines).
- The decisions in `fix-trust.md` §4 and `fix-broker.md` §5.
- Two coordinator follow-ups: "Band withheld" cells, and complaint rates. A third: AppYou alerts and digest default to ON.

**New facts went into DESIGN.md §5b first.** They sit under one sub-heading, "Discovery, cost and Ask Plinth (added 18 Oct 2026, fix-tools2)", and every screen below uses that wording (see §3).

---

## 1. Files

| File | Surface | Title | Size | `$preview` | Tweaks | Signature live thing | What changed, in one line |
|---|---|---|---|---|---|---|---|
| `WebHome.dc.html` | Web | Plinth web: Home | 97 KB | 1280 × **5160** (was 5040) | `theme`, `screen` (Risk card · Answer · Should I buy? · Unknown project · Noida · HARERA down) | Type a project name and its risk card assembles | Money ledger rebuilt; hero card matches §5b; four Ask Plinth edge answers; Golf Course Ext Rd planned for Dec 2026 |
| `WebSearch.dc.html` | Web | Plinth web: Search results | 64 KB | 1280 × **2480** (was 2340) | `theme`, `mode` (Scored · Facts-only), `screen` (Results · Zero results · Unknown project · Noida · HARERA down) | Ask Plinth's reading of your search, as tiles you can drop | All-in first; Low and Moderate as two tiles; zero-results fix; request and waitlist; Band withheld |
| `WebCompare.dc.html` | Web | Compare: 3 Dwarka Expressway projects | 65 KB | 1280 × **4100** (was 3400) | `theme`, `band`, `mode` (Scored · Facts-only) | Highlight differences, with a live "12 of 14 rows differ" | Carpet, loading, configurations and commute rows; complaint rates; Band withheld; share card |
| `WebCostSheet.dc.html` | Web | Cost sheet normaliser: What will I really pay? | 82 KB | 1280 × **8600** (was 6900) | `theme`, `step` | The all-in recalculates as you set buyer type and loan | New "What should I know before I negotiate?" and "What will moving in cost?" sections; "Often negotiable" tags; plain share card |
| `WebVisualise.dc.html` | Web | Picture it furnished: the full tool | 77 KB | 1280 × **4440** (was 4320) | `theme`, `step` (Preview · Which home · Your room · Style · Generating), `home` (Being built · Ready or resale), `start` (Floor plan · Sample flat) | Before/after compare | Starts with "Which home are you picturing?"; under-construction paths start from the floor plan or the sample flat; "AI-generated illustration" everywhere |
| `WebPrivacy.dc.html` | Web | Privacy centre | 47 KB | 1280 × 5550 | `theme` | The "who can reach me" count | D13 relay copy; Renew 30 days; the C-1018-11 relay-only line; Ask Plinth naming |
| `AppVoice.dc.html` | Android | Plinth app: Voice assistant | 64 KB | 390 × 844 | `theme`, `start`, `screen` (Conversation · Should I buy? · Unknown project · Noida · HARERA down · Offline) | Idle → listening waveform → thinking → streaming, cited answer | Named Ask Plinth; pending QPR fact; complaint rate; five designed edge answers |
| `AppScan.dc.html` | Android | Plinth app: Camera identify | 43 KB | 390 × 844 | `theme`, `screen` (Scan QR · Where am I? · Reading · Match · No match · Search by name) | QR frame tightening, then the result sheet rising | Prototype levers removed; real actions only; match sheet matches §5b; Request it on no match |
| `AppExplore.dc.html` | Android | Explore: home (phone) | 84 KB | 390 × 844 | `theme`, `screen` (Home · Request a project · Requested · Noida waitlist) | Ask out loud: the voice sheet | All-in first; hero theme toggle gone; scan card matches §5b; adviser label; request and waitlist sheets |
| `AppMap.dc.html` | Android | Map results: Dwarka Expressway (phone) | 61 KB | 390 × 844 | `theme` | Pins flip between price and risk | Pins show the all-in price with a legend; "Quoted" pins look different; cards lead with the all-in |
| `AppVisualiseCapture.dc.html` | Android | Plinth app: Picture it furnished, capture | 34 KB | 390 × 844 | `theme`, `screen` (Which home · Floor plan · Sample flat · Photo · Uploading) | Live camera guides (level, floor and window) | New "Which home" and "Floor plan" screens; camera only for a sample-flat photo or a ready/resale room |
| `AppVisualiseResult.dc.html` | Android | Plinth app: Picture it furnished, result | 36 KB | 390 × 844 | `theme`, `screen` (Result · Generating · From the floor plan) | Before/after compare | "show generating" switch removed; floor-plan result; "AI-generated illustration" labels; plain share text |
| `AppYou.dc.html` | Android | Plinth app: You tab | 45 KB | 390 × 844 | `theme`, `screen` (You · Consent history · Download my data) | The "who can reach me" count | "I'm an agent" row; consent history and data download screens; money lines; alerts and digest on |
| `WaCost.dc.html` | WhatsApp | WhatsApp cost sheet | 28 KB | 390 × **1460** (was 1400) | `theme` | The cost card | Ask Plinth naming; "Talk to an adviser" button; plain-English summary; move-in line |
| **`AppCostSheet.dc.html` (new)** | Android | Plinth app: Cost sheet, camera to line by line | 60 KB | 390 × 844 | `theme`, `screen` (Allow camera · Camera · Check photo · Reading · Line by line · Saved; default Line by line) | Lines land one by one and the running all-in counts up to ₹2.74 Cr | G-28: camera capture of a cost sheet, then a line-by-line read |

All 15 files have `is_interactive: true`.

---

## 2. Where each gap and fix is closed

### Buyer gaps

| Gap | Where | How |
|---|---|---|
| **G-21** All-in price first | **WebSearch:** rows and pins. **AppExplore:** "Near you" rows and the scan card. **AppMap:** pins, cards and aria labels. **Also:** WebHome (corridor rows, answer cards), WebCompare (all-in cell), AppScan and AppVoice (cards), AppCostSheet. | **Rows:** "₹2.74 Cr all-in · quoted ₹2.35 Cr", with the quoted price in quieter type.<br>**Pins:** the all-in price alone, under the legend "Pins show all-in prices. 'Quoted' means no cost sheet yet." Pins without a cost sheet read "Quoted ₹2.25 Cr" on a lighter pin, so the difference doesn't rely on colour alone.<br>**Juniper and Laurel:** "Quoted ₹… · all-in not known yet". |
| **G-24** Ask Plinth edge answers | **AppVoice:** `screen` tweak, plus typed or spoken text and the "Should I buy here?" suggestion. **WebHome:** the Ask panel and its `screen` tweak. **WebSearch:** typed text and `screen`. | **"Should I buy?"** It refuses and redirects: "I can't tell you whether to buy. That's your call, and no developer pays us to steer it. Here's how to decide:" Four tappable checks follow: Afford the wait · the 4 reasons and what would change the band · lower-band projects nearby (Kestrel Park, Sapphire Grove Ph 1) · Before you pay.<br>**Unknown project ("Indigo Terraces"):** Request it, with an optional RERA number field → "Requested · R-1018-07. We'll message you by 1 Nov 2026."<br>**Noida:** "We don't cover Noida yet, so I won't guess…" → Join the Noida waitlist → "One WhatsApp message when Noida opens. Nothing else."<br>**HARERA unreachable:** a stale-data line on the answer: "…hasn't answered since 7:10 am today… our last full read, 17 Oct 2026, 11:40 pm. We retry every 30 minutes." Source chips keep their dates.<br>**Offline (app only):** a banner, saved cards for Aurelia and Kestrel as of 14 Oct 2026, the question queued, and the mic disabled with a reason.<br>Every answer keeps the AI disclosure and the adviser handoff. |
| **G-25** Before you negotiate | WebCostSheet, new section "What should I know before I negotiate?" (`#before-you-negotiate`). It sits on its own band after "What can you negotiate?" | Three columns, each built differently:<br>**Some agents give part of their fee back.** Channel partners sometimes pass back commission as a discount. "Plinth can't, and never will: no developer money reaches us… If you go direct, ask the developer for the same discount."<br>**EDC and IDC can go up later.** The charges sit inside the base price and the amount isn't shown. A claim-tone "From the developer · draft agreement for sale, 2 Oct 2026 · not verified" field says Northfield may bill a share of any increase by super area.<br>**Get these in writing**, in the agreement for sale or a signed addendum, not a WhatsApp message or side letter. A six-item checklist: final price and all-in; any PLC or club waiver; the EDC/IDC amount and who pays an increase; payment stages for your tower; parking slot number; the RERA completion date, Dec 2027.<br>**Also:** the PLC and club tags now read "Often negotiable" everywhere, to match WaCost and AppCostSheet. |
| **G-26** Share cards in plain English (English-first stays) | **WebCostSheet:** "What your family will see". **WebCompare:** Share with family. **WaCost:** the summary under the card. **AppCostSheet:** Saved. | **Format:** at most three short lines, then a source-and-date line, then "Plinth · No developer pays us. Ever."<br>**Wording:** acronyms get their meaning ("park-facing premium", "3-bedroom flat", carpet explained as "per sq ft you can use"). A band always comes with its natural frequency.<br>**No Hindi added.** |
| **G-28** Cost-sheet upload in the app | **New `AppCostSheet.dc.html`** | **Camera:** reuses AppVisualiseCapture's camera chrome, guide ticks, shutter, page steps and upload bar. Guidance: "Lay it flat in good light · All four corners in the frame · No glare · Page 1 of 2". Camera permission is asked just in time, with a file fallback.<br>**Check photo:** page 1 and 2 thumbnails with quality notes, then Retake page 2 or Read 2 pages.<br>**Reading (signature):** lines land one by one with their source page, and the all-in counts up to ₹2.74 Cr.<br>**Line by line:** every §5b line, with "Often negotiable" on PLC and club (₹4.4 L), "Set by law" on GST and stamp duty, EDC/IDC "Included in the base" and IFMS "Refundable deposit". Tapping a line opens a plain-English sheet with "Get any change in writing", Ask Plinth and the adviser.<br>**Below the list:** the move-in number and a "Before you negotiate" link.<br>**Saved:** a share card.<br>**Retention:** one rule throughout. |
| **G-29** Compare covers the whole decision | WebCompare table | **Four new rows for all 5 projects:** Carpet area (3 BHK); Loading ("38% · 2,000 super / 1,450 carpet"); Configurations (carpet and from-price per BHK, plus units); Commute to Cyber City at 9 am, with an IGI T3 line.<br>**Blanks:** Juniper's read "Not in our records yet".<br>**Source chips:** "Developer price list · Oct 2026" (From the developer, not verified) and "Plinth estimate · road distance, Oct 2026".<br>**Signature:** the rows fold into Highlight differences and its live count. Ask Plinth's explanation adds carpet, loading and commute. |
| **G-30** Request a project; Noida waitlist | **AppExplore:** "Can't find a project?" and "Looking in Noida?" rows, a Noida corridor chip ("Noida · from 2027"), Golf Course Ext Rd planned for Dec 2026 with Notify me, and two bottom sheets. **WebSearch:** unknown-project and Noida states. **Also:** AppVoice, AppScan (Request it on no match) and WebHome. | **Request:** name or RERA number (minimum 3 letters) and an unticked "Also tell me on WhatsApp" → "Requested · R-1018-07. We'll add Indigo Terraces, Sector 79 by 1 Nov 2026, or tell you why not." The published reasons for "not": no RERA registration, outside Gurugram, or a lapsed registration.<br>**Noida waitlist:** "planned for Jul–Sep 2027", then "One WhatsApp message… Nothing else", with Leave the list. |
| **G-31** Move-in number | WebCostSheet, new section "What will moving in cost?" (`#move-in`), the last band before the footer. Pointers from the hero note and the ledger's "Not in this total" row. **Also:** WaCost (one line), AppCostSheet (a row and its sheet). | **Label:** "Move-in number · Plinth estimate, Oct 2026". It is never added to the all-in.<br>**Items:** maintenance advance ₹2.8 L (24 months × ₹5/sq ft super × 2,000 + 18% GST) · IFMS already in the all-in, ₹0 more · connections and deposits ₹0.9–1.4 L · fit-outs ₹8–14 L, your choice.<br>**Total:** "₹12–18 L", "paid around the offer of possession". |
| **G-34** Reposition Visualise | **WebVisualise:** a new first step, "Which home are you picturing?", and a one-line path note under the stepper. **AppVisualiseCapture:** "Which home" and "Floor plan" screens. **AppVisualiseResult:** a "From the floor plan" state. | **A flat being built** (for under-construction projects like Aurelia Ph 2, where there's no room to photograph yet) starts in one of two ways:<br>• **The brochure floor plan.** `floorPlan3bhk` carries the pill "Brochure plan · From the developer, not verified". Pick a room with its §5b size: living + dining 22′ × 13′, master 14′ × 14′, bedroom 2 12′ × 14′, bedroom 3 12′ × 12′. The output is "Empty room, drawn from the plan", then styles. Caption: "Drawn from the brochure plan of 2 Oct 2026 · From the developer, not verified · your unit may differ".<br>• **Your photo of the sample flat**, which may not match your unit.<br>**A ready or resale flat** keeps the bare-room photo flow.<br>**Labels:** every staged image, alt text, share caption and About label says "AI-generated illustration". "Items are illustrative", "Structure is never altered" and the original-first default stay.<br>**Price:** the plan caption reads "₹2.74 Cr all-in · quoted ₹2.35 Cr". |
| **G-36** No silent widening | **WebSearch:** Ask Plinth's tiles, the filter row and the note. **AppMap:** filter chip. | **WebSearch:** "delivery risk [Low] [Moderate]" are two tiles, each removable and restorable. The filter row shows "Risk: Low" and "Risk: Moderate" separately. The note reads "I showed 'low delivery risk' as two tiles, Low and Moderate; remove either one."<br>**AppMap:** its single chip now says "Low or Moderate risk". |
| **G-37** One AI name: Ask Plinth | All 15 files | **Replaced:** "Home Advisor", "AI assistant", "I'm Plinth's AI assistant", "Ask AI", and the bare "Ask" nav links and tab labels.<br>**Disclosure line:** "Ask Plinth is an AI. It answers from public records like HARERA and shows its sources."<br>**WhatsApp:** the subtitle reads "Business account · Ask Plinth is an AI".<br>**Human handoff:** "Talk to a Plinth adviser" ("Talk to an adviser" on the 20-character WhatsApp button). |
| **G-38** No prototype levers in the UI | **AppScan:** "Simulate match", "Prototype: next scan…" and "Tap Simulate match" removed. **AppVisualiseResult:** "show generating" removed. **AppExplore:** hero theme toggle removed. **AppMap:** the dead flip-theme code removed. | **AppScan:** states move to the `screen` tweak. The real UI keeps real actions only: QR scans on its own, "Scan a QR from a photo", and "Check where I am".<br>**AppVisualiseResult:** moved to the `screen` tweak.<br>**AppExplore:** Night comes only from the `theme` tweak. |
| **G-39** Zero results gives a way out | WebSearch, the "4 BHK on Dwarka Expressway, low delivery risk" example. Reach it by Edit the words, or by `screen = Zero results` | "Drop *Low–Moderate* to see Aurelia Heights", with a one-tap "Drop Low and Moderate" button. The result: Aurelia, Elevated, "Quoted ₹3.38 Cr · all-in not known yet · 4 BHK, 2,100 sq ft carpet". In Facts-only mode the example returns Aurelia, with a note saying why. |

### Cross-file fixes

| Fix | Where | How |
|---|---|---|
| **1. WebHome money section** | WebHome `#money` ledger and footer | **Rows:**<br>• Free: "Bands, reasons, sources, compare and alerts. Alerts are always free."<br>• Pro: "₹999 per project · 12 months of written updates".<br>• Agents: "A published fee split, only when you choose them".<br>• Loans: "Loan checks arrive in 2027. No lender pays us today".<br>• Resale check: ₹6,999, planned Apr–Jun 2027, matching WebPricing.<br>• Developers: ₹0, "No developer pays us. Ever."<br>**Removed:** the live home-loan referral row and its ~0.35% fee.<br>**Footer:** adds "How we make money" and "Free and Pro".<br>**The same lines** now appear in AppYou's money block. |
| **2. AppVoice pending fact** | AppVoice Aurelia answer and risk card | **Records show:** "Not on HARERA yet: the Jul–Sep 2026 QPR, the quarterly progress report. It was due 15 Oct." Source: HARERA QPR register · 18 Oct 2026.<br>**Developer says · not yet verified:** "filed on 12 Oct 2026", in a claim-tone field.<br>**Then:** "The band may change after 25 Oct. We'll tell everyone who follows Aurelia on the same day."<br>**No new band is named or previewed.** The streamed answer carries the same three sentences, with source [5]. |
| **3. Hero card and scan card match §5b** | **WebHome:** hero card, plus the "How it works" dial and reasons. **AppExplore:** scan result sheet and followed card. **AppScan:** match sheet. | **The facts:** Elevated since 2 Oct 2026 (Moderate before) · 41% built · ₹2.74 Cr all-in · quoted ₹2.35 Cr · original completion Dec 2027 · OC after Apr 2029 is the "more than 12 months late" line · the Jul–Sep QPR not on HARERA · 14 complaints · 2.8 per 100 units.<br>**Confidence:** "Low confidence" no longer sits beside a band. A separate "We're less certain about this one…" sentence appears instead, and screen-reader text says "less certain".<br>**Corrections in passing:** WebHome's 8-quarter tape marked the wrong late quarter (Jun '24), now fixed to Sep '24, Mar '25 and Dec '25. An implausible "Tower B structure was completed in September 2026" claim is replaced by the canonical "filed on 12 Oct 2026". |
| **4. "Talk to our team" relabel** | **AppExplore:** voice sheet. **Also:** AppVoice header and handoff card, WebHome, WebCompare and WaCost. | **Label:** "Talk to a Plinth adviser · paid by you, never by developers".<br>**Scope line:** "Free to ask, Mon–Sat, 10 am–7 pm. Advisers explain records; they don't sell, book or negotiate."<br>**The AI stays "Ask Plinth"**, matching fix-broker BG-13. |
| **5. AppYou** | AppYou Account section, and the `screen` tweak | **"I'm an agent" row:** links to `#agent-onboarding` (the WhatsApp flow): "Verify your HARERA registration on WhatsApp. Saying you're an agent changes nothing you see on Plinth: same records, same bands, no previews."<br>**Consent history ("What did I say yes to?"):** the 5 §5b lines, newest first. C-1018-11 shows as relay only and isn't counted. Revoke opens the existing sheet, and status pills update.<br>**Download my data ("What do you hold about me?"):** six contents, ZIP with PDF and JSON, within 24 hours, link for 7 days after your sign-in code. "Prepare my file" leads to a Preparing state you can cancel.<br>**Also:** money lines; relay copy; Meridian site-office row gets its consent reference. |
| **Coordinator: alerts and digest default ON** | AppYou | **Defaults:** WhatsApp consent, WhatsApp alerts and Weekly digest all start ON.<br>**Consent line:** "You ticked this on 14 Sep 2026", the date Rohan's WhatsApp follow began.<br>**Digest:** "Sundays at 9 am".<br>**New "Family circle" row:** "Relatives you invite get the same project alerts, nothing more. Payment alerts, what you follow and why, cost sheets, visit passes and who has your number stay private to you." |
| **6. WebPrivacy relay copy (D13)** | WebPrivacy "How is my number masked?" › It ends; party rows; and a new note | **The rule:** "The relay stays alive while a deal is active, and ends 30 days after your last message unless you renew. A deal is active from your first visit to registration."<br>**Ended rows:** read "Ended 2 Oct 2026 · 30 days after your last message".<br>**Renew 30 days:** a new button on relay-only rows. After a tap: "Can reach you until 17 Nov 2026 · via relay · renewed today".<br>**New note:** the C-1018-11 relay-only Aurelia visit, not counted.<br>**Wording:** "never shared without your tap" is unchanged in all three places. AppYou carries the same rule. |
| **Coordinator: "Band withheld" for facts-only projects** | WebSearch and WebCompare: `mode` tweak (Scored · Facts-only), paired with WebDeveloper | **Chip:** Northfield's Aurelia shows a neutral `t.track` chip with an empty meter, "Band withheld · facts only", and a "Facts only: see why" link (`#facts-only`).<br>**Search:** it stays in risk-filtered results, listed with Not scored projects.<br>**Compare:** Aurelia's band and reason cells and its dial are neutral, and Ask Plinth's explanation omits its band. |
| **Coordinator: complaint rate** | WebCompare, AppVoice, AppScan, AppExplore | "14 complaints · 2.8 per 100 units", "2 · 0.5", "5 · 1.4". The explanations carry the rates too. |

---

## 3. Facts added to DESIGN.md §5b

They sit under one sub-heading, "Discovery, cost and Ask Plinth (added 18 Oct 2026, fix-tools2; buyer gaps G-21 to G-39)". All are fictional.

- **Price display rule:** all-in first, quoted second. Pins show the all-in alone with a legend. Projects with no cost sheet read "Quoted ₹X · all-in not known yet".
- **Homes, size and units for the other projects:**

  | Project | Homes | 3 BHK super | Loading | Units |
  |---|---|---|---|---|
  | Kestrel Park | 2 BHK 1,050 sq ft from ₹1.58 Cr; 3 BHK 1,400 from ₹2.10 Cr | 1,880 | 34% | 420 |
  | Sapphire Grove Ph 1 | 3 BHK 1,400 from ₹1.95 Cr; 3 BHK + study 1,620 from ₹2.26 Cr | 1,960 | 40% | 360 |
  | Coral Towers | 2 BHK 980 from ₹1.28 Cr; 3 BHK 1,240 from ₹1.62 Cr | 1,750 | 41% | 640 |
  | Juniper Enclave | carpet not in our records | — | — | 280 |

  Aurelia is the only 4 BHK on the corridor.
- **Complaint rates:** Kestrel 2 · 0.5 per 100 units; Sapphire 5 · 1.4 per 100 units. Coral and Juniper: not in our records.
- **Commute** (Cyber City at 9 am · IGI T3) for all five projects. Aurelia's figures are unchanged.
- **Facts-only search and compare state:** "Band withheld · facts only" and "Facts only: see why".
- **Request a project:** 14 days or a written reason why not. A request on 18 Oct reads "by 1 Nov 2026". References use `R-MMDD-NN`; the example is R-1018-07, "Indigo Terraces, Sector 79".
- **Coverage:** Golf Course Ext Rd planned for Dec 2026. Noida and GNW R3, Jul–Sep 2027, with a one-message waitlist.
- **Ask Plinth naming:** the name, the disclosure line and the adviser handoff label.
- **Five edge answers**, including the HARERA-down example: unreachable since 7:10 am, last full read 17 Oct 2026, 11:40 pm, retried every 30 minutes.
- **Before you negotiate:** CP pass-back (D1), the EDC/IDC escalation clause in the draft agreement (From the developer, not verified), and the six-item writing list.
- **Move-in number:** ₹2.8 L + ₹0 + ₹0.9–1.4 L + ₹8–14 L, so about ₹12–18 L.
- **Cost-sheet photo:** the tags, and the one retention rule.
- **Relay lifetime (D13):** the exact sentence, with "a deal is active from your first visit to registration".
- **Rohan's consent history:** 5 lines, including C-1018-11 as relay only.
- **Download my data:** contents and timings.
- **Money lines.**
- **Share-card rule.**
- **Visualise UC rule.**

---

## 4. Image requests

**File:** `product/design/assets/requests_tools2.json` (new).

| Slot | Aspect | Used in | Subject |
|---|---|---|---|
| `costSheetPage2` | 3:4 | AppCostSheet: page 2 viewfinder and thumbnail | Overhead photo of page 2 of a printed A4 cost sheet on a wooden desk. A greeked table and totals block made of placeholder bars, with no letters, numbers, logos, stamps or seals. The real lines are overlaid in HTML |

**Reused with their existing `src`:**
- costSheetDesk
- floorPlan3bhk
- roomBare, roomModernIndian, roomMinimal, roomWarmWood
- heroAurelia, heroKestrel, heroSapphire, heroCoral, heroLaurel, heroJuniper
- corridorAerial, cameraSite, salesGallery, keysOnDeed

---

## 5. `canvas.json` changes for the lead (I didn't edit it)

| File | Change |
|---|---|
| `AppCostSheet.dc.html` (new) | Android page: `{"x": 7050, "y": 0, "w": 390, "h": 844, "title": "Cost sheet · camera to line by line", "is_interactive": true, "page": "android"}`. AppFamily ends at x 6970, so 7050 is free |
| `WebHome.dc.html` | h 5040 → **5160** |
| `WebSearch.dc.html` | h 2340 → **2480** |
| `WebCompare.dc.html` | h 3400 → **4100** |
| `WebCostSheet.dc.html` | h 6900 → **8600** (Result step) |
| `WaCost.dc.html` | h 1400 → **1460** |
| `WebVisualise.dc.html` | h 4320 → **4440** (Preview step) |
| `AppVoice.dc.html` | title "Voice assistant (Ask)" → "Ask Plinth · voice" |

`$preview` heights are estimates; nothing was rendered.

---

## 6. Follow-ups for other artboard owners (not edited by me)

- **Tab bars.** AppExplore, AppMap, AppYou and AppVoice now say "Ask Plinth" in the tab bar. AppProject, AppFollowing, AppRisk and any other app screen with a tab bar still say "Ask", and need the same label (G-37).
- **AppProject.** Its "Talk to our team" button should become "Talk to a Plinth adviser · paid by you, never by developers", as on AppExplore (fix-broker BG-13). Its in-page Ask should reuse AppVoice's five edge answers (G-24 names WebProject Ask as well).
- **WebProject.** Its Ask needs the same edge answers (G-24). Its PLC/club "Negotiable" tags should read "Often negotiable".
- **Cost-sheet line count.** WaCost says "Your sheet has 7 lines"; WebCostSheet's ledger shows 10 rows; AppCostSheet shows the 8 §5b lines plus a total check. Agree one count, or drop the count from WaCost.
- **Other privacy-side screens.** The relay rule now matches on WebPrivacy and AppYou. Any other screen that says "after 30 days with no active deal" should use the §5b sentence.

---

## 7. Open questions

1. **"Paid by you, never by developers" on a free adviser.** I added "Free to ask" beside it because the label alone can read as a fee. Approve the pair, or reword it as "Plinth is paid by buyers, never by developers"?
2. **Request SLA (14 days, written reason).** This is now a public promise on four screens. Who staffs it, and what happens when HARERA hasn't published a project's details yet?
3. **Noida waitlist.** It sends one WhatsApp message per person. It needs a utility template approved before launch, and a decision on whether waitlisting counts as consent to that one message. I treated it as yes, by the tap.
4. **Move-in number assumptions.** It uses 24 months of maintenance advance at ₹5 per sq ft super, 18% GST, and fit-out and connection ranges. These are Plinth estimates; please confirm or give a source before code. They are labelled "estimate" everywhere.
5. **EDC/IDC escalation clause.** It is shown as "From the developer · draft agreement, not verified", but no real draft agreement is on file for the fictional project. In product, it needs the uploaded agreement as its source.
6. **The HARERA-down example time (7:10 am; last read 11:40 pm on 17 Oct)** sits alongside the "HARERA synced 2 hours ago" strip on other screens. It only appears behind the `screen` tweak.
7. **AppMap's "Low or Moderate risk" chip** is honest, but it isn't the two-tile pattern WebSearch now uses. Split it in the next app pass?
8. **Facts-only placement.** Withheld projects stay in risk-filtered results (fix-dev2 decision 5, still open). I followed that.
9. **From the web discovery pass:**
   - fix-trust §4.2 suggested the loan row read "from R2, Jan–Mar 2027". §5b and the brief say "Loan checks arrive in 2027", and I used that.
   - Please confirm the share-card phrase "N of 100 like it finished over a year late" as the plain version of "OC more than 12 months late".
10. **Visualise:**
    - Rooms are picked from a list beside the floor plan, not from hotspots, because the generated plan's room positions aren't fixed. Add hotspots once the plan image is final.
    - Bedrooms still use the living-room illustrations. Request bedroom slots?

---

## 8. Checks run (nothing rendered; no browser opened)

**Per file:** `scratchpad/tools2/check.py`, run on all 15 files. Text-input files ran with `EV` = "Noida", "Indigo Terraces" and "Should I buy?". It checks:
- HTML tag balance, unquoted attributes, and self-closing non-void elements;
- the exact `support.js` line, a valid `data-props` JSON, and the `theme` default (Day);
- that every `data-slot` div is empty;
- the consent-reference format (`C-MMDD-NN`);
- banned words (including "home advisor", "ai assistant", "simulate match", "prototype:", "loan referral", "12 months of alerts" and "too early to score"), plus emoji;
- a Node run of `renderVals()` in Day and Night under every enum tweak, firing every top-level and per-item handler for 3 rounds with timers flushed. Every `{{hole}}`, including loop items, must resolve with no `undefined` or `NaN`.

**Result:** all clean (`tag/attr errors: []`, `banned: []`, runtime `probs: []`). Two known false positives remain, both from older code:
- **WebPrivacy:** a computed `'C-1018-0' + n` reference, which produces C-1018-01 to C-1018-05.
- **WebCostSheet:** two separate loops that both use the alias `o`.

| File | States exercised |
|---|---|
| WebHome | 4,376 |
| WebSearch | 12,673 |
| WebCompare | 2,880 |
| WebCostSheet | 4,085 |
| WebVisualise | 14,233 |
| WebPrivacy | 662 |
| AppVoice | 3,756 |
| AppScan | 320 |
| AppExplore | 2,058 |
| AppMap | 50 |
| AppVisualiseCapture | 2,023 |
| AppVisualiseResult | 950 |
| AppYou | 2,735 |
| WaCost | 266 |
| AppCostSheet | 2,600 |

**Flows, stepped by script** (`scratchpad/tools2/flow.js`, `scratchpad/webdisc/flows.js`, `scratchpad/visflow/flow.js`, `scratchpad/flow_costsheet.js`):
- **AppScan:** "Search by name" → Request; Where am I? → Check where I am → match.
- **AppVoice:** typed "Is Saffron Vista Residences any good?" → request card with the extracted name; "noida me kya hai" → waitlist → joined; Offline → mic disabled, question queued; HARERA down → stale line, and the [5] source re-dated.
- **AppExplore:** Request a project with WhatsApp ticked → Requested; a 2-letter name is blocked; Noida waitlist → joined → closed; Golf Course → Notify me.
- **AppYou:** Consent history → revoke Meridian → the count drops to 2 and the status updates; Download → Preparing.
- **WebPrivacy:** Renew on Orbis → "until 17 Nov 2026 · renewed today".
- **WebHome, WebSearch, WebCompare:** 103 checks.
- **Visualise:** 192 checks.
- **AppCostSheet:** 59 checks.

**Audit across files** (`scratchpad/tools2/audit.py`): none of the 15 files contains "Home Advisor", "AI assistant", "Talk to a person", "Talk to our team", "too early to score", Tamarind, a loan referral, "12 months of alerts", a prototype lever or "AI-generated preview". Every required string is present in each file.

**Headlines.** Every new or changed heading was checked by arithmetic (characters × size × 0.55 ≤ 2 × column width). One heading failed and was fixed: WebCostSheet's "What will moving in cost?" had a 12ch cap that would have run to three lines.

## 9. Critique gate (§8; 1–5 each)

| Screen | Q | Ev | Hi | Rd | A11y | Trust | India | Cons | States | Delight | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WebHome | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **44** |
| WebSearch | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **44** |
| WebCompare | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 5 | 4 | 4 | **44** |
| WebCostSheet | 5 | 4 | 4 | 4 | 4 | 5 | 5 | 5 | 4 | 4 | **44** |
| WebVisualise | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 5 | **45** |
| WebPrivacy | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 4 | 4 | **43** |
| AppVoice | 5 | 5 | 4 | 4 | 4 | 5 | 5 | 5 | 5 | 4 | **46** |
| AppScan | 5 | 5 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **45** |
| AppExplore | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **44** |
| AppMap | 4 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 4 | 4 | **42** |
| AppVisualiseCapture | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **44** |
| AppVisualiseResult | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 4 | 5 | **44** |
| AppYou | 5 | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **44** |
| WaCost | 5 | 4 | 4 | 5 | 4 | 5 | 5 | 5 | 4 | 4 | **45** |
| AppCostSheet | 5 | 5 | 4 | 4 | 4 | 5 | 5 | 5 | 5 | 5 | **47** |

**Known weaknesses:**
- **WebCostSheet** is now about 8,600 px. "Before you negotiate" and "Move-in number" each answer a separate question, but the page is long. A later pass could fold the TDS band into the ledger.
- **AppMap's risk chip** doesn't use the two-tile pattern yet.
- **Visualise bedrooms** still reuse the living-room images.
