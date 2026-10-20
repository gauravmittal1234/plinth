# Founder questions and legal checks (open)

Collected while closing the design gaps (18 Oct 2026). None of these block design or the first build: screens use clearly marked placeholders. Decisions I took as acting PM are listed so you can overturn them.

## Needed from you to unblock coding
1. **Merging (20 Oct 2026).** The auto-mode safety check still blocks `gh pr merge` for me, despite the settings grant. Until you re-allow it, merge the PRs on the lead's ready list, which have green CI and a lead review. Anything touching money or legal copy is flagged for your own read.
2. ~~Let CI workflows be pushed.~~ **Done 19 Oct 2026:** the `workflow` scope was granted and the T00 workflows are active on PR #1.

## Decisions taken as acting PM (overturn any)

| # | Decision | Why |
|---|---|---|
| P1 | **Loans are R2** (PRD F-13). R1 shows no lender party, loan referral or lender fee. The "who has my number" example now lists Meridian Habitat's site office (Sapphire Grove visit) instead of Tamarind Home Finance | The PRD put loans in R2; three screens contradicted it |
| P2 | **Pro is "12 months of written updates"**, not "alerts". Alerts stay free for everyone | Selling alerts contradicts "every band, reason and alert is free" |
| P3 | **Price tests run one after another, one public price at a time**, never split by visitor | Splitting prices by visitor breaks the "the price is the price" promise and is risky under the CCPA dark-pattern rules |
| P4 | **One consent-reference format**, `C-MMDD-NN`, on every screen | The developer inbox had invented a second format |
| P5 | **Flyers and letters in images are greeked** (placeholder bars), with the real claim text overlaid as live type | AI images produced half-readable nonsense text |
| P6 | **No confirmation without a record.** A screen confirms only what the server confirmed. "Notify me" and "Join the waitlist" now say "Waitlists aren't open yet, so nothing was saved" until a waitlist API exists. Request references (R-MMDD-NN) come only from the API's answer | M1 screens had shown "On the waitlist" and a fixed R-1018-07 without recording anything (#36, #38) |
| P7 | **Free at launch, no revenue at all** (founder, 20 Oct 2026). No Pro plan and no agent fee; developers never pay; loans stay "arrive in 2027". `/pricing` becomes a "Plinth is free" page; `pro_paywall` stays off. This supersedes P2 for launch | Founder decision |
| P8 | **Legal and compliance reviews are post-launch** (founder, 20 Oct 2026): the legal memo, the HARERA permission letter and the lawyer list below. They never gate code, live data or launch. Live HARERA fetch keeps its two-key kill switch | Founder decision: "once platform is live and people have started using it we will do all such things" |
| P9 | **Google Cloud and live HARERA data come last** (founder, 20 Oct 2026). The GCP project is a running cost, so it waits until M6, just before launch. M2–M5 run on fixtures. `scripts/gcp/bootstrap.sh` (#54) sets it up in one command when needed | Founder decision: keep running costs down until they are needed |
| P10 | **Fonts: Figtree text + Bricolage titles** (founder, 20 Oct 2026, after the Thapki benchmark). Figtree for all text, buttons and labels on app and web; Bricolage Grotesque for display, title and section headings only, at 700; Noto Sans stays as the Hindi fallback; Mukta retired. Spec: `product/design/review/benchmark-thapki.md` | Founder decision: the UI must beat Thapki's on cleanliness, type, icons and interactive elements |

## M3: money and claims checks (21 Oct 2026; none of these block the build)

The M3 plan is WORK_BREAKDOWN.md waves 6–8b (T60–T90, gate T99). Each question has the default the agents build with. Overturn any of them and the lead updates the affected tasks.

| # | Question | Default we build with |
|---|---|---|
| M3-1 | **OCR provider.** Which service reads the page? | Gemini's vision model through the one AI gateway, so there is one vendor and one budget. The Android app reads the page on the phone first (ML Kit) and sends the text, so most app checks skip the OCR call. Google Document AI (paid) only if OCR misses its eval gates on real documents |
| M3-2 | **AI models.** Which models read the claims and the money documents? | Reader A is Gemini Flash-class, reader B is Flash-Lite-class with a different prompt; OCR uses Flash vision and classifying uses Flash-Lite. Exact model versions are pinned after a one-day bake-off on the eval set (free tier, fictional documents). One vendor until launch |
| M3-3 | **When may AI see a real buyer's document?** | Only after a paid Gemini key (or Vertex AI in Mumbai) with a data-processing agreement, planned for staging in M6. Until then the gateway runs `AI_PROVIDER_TIER=free` and refuses anything that isn't one of our fictional sample documents (DECISIONS E-8) |
| M3-4 | **Cost-rule sources (rules v2026.10).** Whose reading of the law do we publish? | Haryana stamp duty (7% man, 5% woman, 6% joint) and the ₹50,000 registration fee; GST 5% on an under-construction home; TDS 1% under Income-tax Act 2025 s.393(1), shown as withheld, not added; the 10% cap before a registered agreement (RERA s.13). Published as "Plinth's reading of the rules, Oct 2026" with each source named on the page. A chartered accountant's review joins the post-launch legal list (P8) |
| M3-5 | **Circle rates.** Stamp duty is due on the circle rate when it is higher than the price | Not used in R1: the page states the rule without a number. Gurugram collector rates join the M6 data track |
| M3-6 | **Who answers the review queue and "Talk to a Plinth adviser"?** | You, Mon–Sat 10 am–7 pm IST, the same working day (the hours already on the screens) |
| M3-7 | **Concierge-first.** Should a person check every reading before the buyer sees it? | No. Rows the two AI readers disagree on, or read with low confidence, show "Can't check yet" with "A person is checking this reading" and go to the queue; everything else shows at once. The first 500 checks also get a spot check that never blocks the buyer, to grow the test sets |
| M3-8 | **Checks without an account.** | The sample checks work signed out. Checking your own file on web or app needs the sign-in code, because a file needs an owner for deletion and export. WhatsApp needs nothing extra: the number is the account |
| M3-9 | **Consent for AI reading.** | The first upload records an `ai_processing` consent (a C-MMDD-NN ref in the consent history) from the buyer's tap. On WhatsApp the forwarded file is the request, and the first reply says "This is Ask Plinth, an AI". The lawyer confirms the wording post-launch (P8) |
| M3-10 | **"Or paste a link to an ad or a listing"** (WebClaims). | No link fetching in R1: fetching arbitrary pages and listing sites is a legal and security risk. The box asks for a screenshot instead |
| M3-11 | **Re-check alerts.** When a new filing changes a check (Kavya's slab 12), do we message the buyer? | Yes: one WhatsApp utility message (`check_updated`, which needs Meta approval like the other templates) or a push, once per check per filing, inside quiet hours and only for people who turned WhatsApp alerts on |
| M3-12 | **Receipts.** Read the receipt with AI, or have the buyer type it? | Typed in R1: amount, date and the last 4 digits of the UTR. No AI on receipts |
| M3-13 | **Limits.** | 15 MB and 20 pages per file (BUILD_PLAN §12.9). At most 20 checks per person per day. AI calls capped per task per day at the free tier's limits, with the kill switch at 100% |

**Paid switches for later** (nothing here is needed before launch; M3 runs on recorded AI in CI and the free tier with fictional documents in dev):
- **Gemini paid tier or Vertex AI (Mumbai) with a DPA:** set `AI_PROVIDER_TIER=paid` and `AI_MODE=live` in staging and prod. Needed before the first real buyer document (M3-3).
- **Google Document AI:** only if OCR misses its gates on real documents (M3-1).
- **Meta approval of `check_updated`:** free, but needs the verified business account (M3-11).
- **Supabase Pro:** storage and egress for uploads at launch, already in the M6 environment plan.

## Start this week (long lead times; steps in `docs/engineering/SETUP_FOR_FOUNDER.md`)
- **Meta Business verification**, needed for the WhatsApp Business API and its templates.
- **D-U-N-S number**, needed for a Google Play *organisation* account.
- **TRAI DLT registration**, needed for the SMS fallback for sign-in codes.
- ~~**Legal memo**~~ Post-launch (P8).
- **Domain:** confirm `plinth.in`. It is a placeholder everywhere.
- **Accounts:** Supabase (dev project, free tier is fine), Vercel, a Gemini paid key with a DPA before any real data. Keys go in `.env.local`; never paste them in chat.

## Identity (WebAbout placeholders)
- Company name, CIN, registered address and PIN, GSTIN.
- Founder: name, a real photo, a profile link, a quote of 40 words or fewer.
- Team size, the methodology lead, the external committee member, funding and investors.
- Holdings declarations for founder, staff and investors, with dates.
- Insurer, policy number and validity.
- Grievance officer: name, email, phone. Legal-notices email.

## Scope and dates
- Confirm the planned dates on WebAbout:
  - Golf Course Extension Road: Dec 2026.
  - Resale, Verified Flat Check and iOS: Apr–Jun 2027.
  - Noida/GNW: Jul–Sep 2027.
- Pro:
  - Is it on sale at R1 launch, and who is the payment partner?
  - The 7-day full refund.
  - Approve the public line "If it's free today, it stays free".
  - Should Verified Flat Check show ₹6,999 before R2?
- Publish the real calibration counts for 212 past projects, and commit to a first public check in Jul 2027?
- Publish our own response times, misses included?

## Sign-in and messaging
- SMS fallback needs TRAI DLT registration. The WhatsApp code template needs Meta approval.
- Accept international numbers in R1 (+971, +1, +44, +65)?
- What happens to an account when the person changes their number?

## Broker layer (drafts published as "Split rules v1"; details in `product/design/review/fix-broker.md` §4)
- **Splits:**
  - ₹0 between partner agents in year 1.
  - 20% of the *buyer-side* fee when a buyer found the agent on Plinth.
  - Desk deals: 1% fee, split 75/25.
  - ₹0 ever on new launches. That keeps D1 intact, since CP commission is developer money.
- **Is "never will be a channel partner" a permanent public promise?**
- **Unregistered resale dealers:** a "registration help" path with no Verified badge, or exclude them?
- **Rule numbers:**
  - introduction window 60 days, hard cap 90;
  - mandate shield;
  - strikes: 3 in 12 months gives a 90-day pause;
  - badge thresholds.
- **Ops promises:**
  - pay agents within 7 days;
  - a person replies within 2 working hours;
  - onboarding calls in English and Hindi.
- **Broker Pro:** publish its price and timing now, or later?

## Developer workspace (details in `fix-dev2.md`)
- **Notice and auto-publishing:** 14 days' notice before a new developer's first public page. A claimed developer's new phases auto-publish on registration day.
- **Reply alerts:** send followers one alert when a developer replies (needs a frequency cap and a Meta utility template).
- **Ranking rule:** "only verified records rank; claiming a page never does".
- **Buyer signals:** the k ≥ 20 threshold and the "saw the band" metric (WebPrivacy needs a line for it).
- **Facts-only projects:** do they stay in risk-filtered search?
- **Methodology committee:**
  - the complaint denominator (registered units, per half-year);
  - the path-back threshold, from the v1.2 scorecard.

## Project pages (details in `fix-project2.md`)
- **"Lower band nearby".** The project page shows the line "Lower band nearby: Kestrel Park, Sapphire Grove Ph 1". I kept it as a neutral, rule-based list ("No one pays to appear here"). Drop it if it reads as steering buyers.
- **Northfield's pre-RERA projects.** Is it acceptable to name them from court orders and news, with coverage limits stated?
- **International WhatsApp numbers.** Are alerts on them a firm commitment?
- **Possession help.** Screens say Jul–Sep 2027. Confirm that date.
- **Data team.** Do HARERA QPRs report slabs by tower? If not, the tower picker falls back to the whole phase.

## Search, cost and Ask Plinth (details in `fix-tools2.md`)
- **"Request a project".** We promise an answer within 14 days. Who staffs that queue? The Noida waitlist also needs a WhatsApp utility template approved.
- **Adviser label.** I set "Talk to a Plinth adviser · free · developers never pay us". Confirm that an adviser is free in R1.
- **Move-in estimate.** It assumes 24 months of maintenance at ₹5/sq ft plus ranges for fit-out and utility connections. It is labelled as an estimate; confirm or replace the assumptions.
- **Waitlists (new, 20 Oct 2026).**
  - Home, Search and About offer "Notify me" / "Join the Noida waitlist", but no API records them.
  - Proposal: an `api.waitlist_join(area, WhatsApp consent)` in M2 with the T45 buyer writes, sending one WhatsApp utility message on opening.
  - Confirm the scope.
- ~~**Pricing copy (#38).**~~ Moot: free at launch (P7).

## For the lawyer, post-launch (P8; copy currently states these as fact)
- Pay-as-built and the site-visit recap: 10 flags in `fix-visitpay.md` §4. They include the s.19(6)/(7) wording, the draft letter the buyer sends themselves, and how we label what a salesperson said.
- The explainers for payment plans and subvention, loans, NRIs (FEMA routes, s.194-IA TDS, POA), and selling before possession (RERA s.2(d)). Each panel carries `data-review="legal"`.
- **Broker money:** may Plinth earn a resale referral share or desk fee before or after its own HARERA agent registration, and how are GST, invoicing and TDS handled (CA)?
- **Competition law:** is an example fee in the split calculator a CCI risk?
- **Agents' data duties** once they hold a buyer's number (DPDP).
- **Facts-only mode:** the wording, who can trigger it, and whether a court application is disclosed.
- **Formal notices:** the 48 h / 5 / 15 working-day SLA.
- **Site staff:** the DPDP notice and retention for their GPS data.
- **Board resolutions:** the rule for checking one.
- RERA ss. 3, 13, 18, 19(6) and 31.
- Haryana's interest rate (SBI MCLR + 2%).
- HARERA Forms CRA and CAO.
- HARERA Gurugram's 2018 earnest-money rule.
- Homebuyers as financial creditors under the IBC.
- Whether selling Pro reports alone needs HARERA agent registration (WebAbout says "HARERA agent number: none yet").
- The NRI section (NRE/NRO, POA, FEMA), once drafted.
- The Pay-as-built guard's wording (never "don't pay").
