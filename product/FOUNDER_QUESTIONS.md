# Founder questions and legal checks (open)

Collected while closing the design gaps (18 Oct 2026). None of these block design or the first build: screens use clearly marked placeholders. Decisions I took as acting PM are listed so you can overturn them.

## Decisions taken as acting PM (overturn any)

| # | Decision | Why |
|---|---|---|
| P1 | **Loans are R2** (PRD F-13). R1 shows no lender party, loan referral or lender fee. The "who has my number" example now lists Meridian Habitat's site office (Sapphire Grove visit) instead of Tamarind Home Finance | The PRD put loans in R2; three screens contradicted it |
| P2 | **Pro is "12 months of written updates"**, not "alerts". Alerts stay free for everyone | Selling alerts contradicts "every band, reason and alert is free" |
| P3 | **Price tests run one after another, one public price at a time**, never split by visitor | Splitting prices by visitor breaks the "the price is the price" promise and is risky under the CCPA dark-pattern rules |
| P4 | **One consent-reference format**, `C-MMDD-NN`, on every screen | The developer inbox had invented a second format |
| P5 | **Flyers and letters in images are greeked** (placeholder bars), with the real claim text overlaid as live type | AI images produced half-readable nonsense text |

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

## For the lawyer (copy currently states these as fact)
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
