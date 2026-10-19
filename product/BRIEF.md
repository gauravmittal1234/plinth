# Product brief: AI-first home buying & selling platform (working name: TBD)

Owner: Founder (Gaurav) · Product lead: Claude acting as senior PM · Phase 2 (product thinking), started 2026-10-18

## 1. Ambition

Build the platform that disrupts how flats are bought and sold in India. Launch in **Delhi NCR**. It will be a **web platform plus mobile apps (Android first, iOS)** and use AI throughout, not as a bolt-on. The bar is Apple/Google-level product quality: few, deep, delightful flows; trust by default; obvious value on the first visit.

## 2. Who we serve

| Side | Actor | Notes |
|---|---|---|
| Demand | Buyer of an **under-construction** flat (primary) | Biggest anxiety is delivery risk: delay, stall, fraud, registry |
| Demand | Buyer of a **resale** flat | Needs title/OC/registry clarity, fair price, a real and available listing |
| Demand | NRI buyer | Buys remotely, carries more risk and needs a power of attorney |
| Supply | **Individual (consumer) seller** of a resale flat | Gets spam, has to guess the price, does paperwork, needs qualified buyers |
| Supply | **Developer/builder** selling new projects | High cost per booking, poor lead quality, reliance on channel partners (CPs), trust deficit |
| Supply/intermediary | **Brokers & channel partners** | Control much of the supply and pay the portals; we should work with them, not fight them |

## 3. Founder's non-negotiables

1. **Risk scores as the core differentiator.** A credit-score-like **Delivery Risk** rating for developers and their under-construction projects. It predicts the probability and severity of delay or stall, and explains the reasons: developer, site, timeline, finances, legal. Extend the same idea to other buyer pain points where a score helps, such as transferability/title, waterlogging, society health and fair price.
2. **Heavy, visible AI.** Examples: AI virtual staging of empty flats (Google "Nano Banana" image models) so buyers can picture living there; conversational search; AI document due diligence; future value, resale value and rental income estimates; AI agents for developers and brokers.
3. **Neglected buyer questions answered.** Future value, resale value and liquidity, rental income, total cost, regulatory and legal checks.
4. **Better journeys for both buyers and sellers**, through better UI and through AI.

## 4. What Phase 1 research concluded (read the reports for evidence)

- Win on **trust and closing**, not traffic. Incumbents (99acres, MagicBricks, Housing.com/Aurum, NoBroker, Square Yards) have identical search features, Trustpilot scores of 1.1–1.2, and sell each enquiry to 4–15 brokers.
- Suggested launch: 2–3 **Gurugram** corridors (₹1.5–5 cr; Dwarka Expressway, Golf Course Ext Rd, New Gurugram) plus **Noida / Greater Noida West resale** with a registry-verified badge. Delhi resale comes later.
- Money is in transactions and home loans, not listings. Avoid iBuying (buying homes to resell) and full-stack interiors. Work with brokers.
- Regulation: a deal-facilitating platform is likely a **RERA agent** (Haryana/UP/Delhi) and a **PMLA/FIU-IND reporting entity**. **DPDP** obligations apply in full from 13 May 2027. The **IT Rules (Feb 2026)** require labels on AI-generated images, so virtual staging must be labelled. CCPA **dark-pattern** rules apply.
- Risk-score research: HARERA publishes rich, scrapable project data (forms, quarterly progress reports with escrow and collections, complaints, 17.9k orders). UP RERA is usable. Credit-rating agencies use committed receivables vs cost, collection efficiency, inventory and leverage. A UP RERA × CRISIL grading framework was proposed in 2020. NSW iCIRT is a model to learn from. Public warning signs preceded NCR failures by 15 months to 6+ years. **Legal guidance:** don't call it a "credit rating" or use AAA–D. Build it from documented facts, publish the methodology, give developers a right of reply, never let developers pay to influence it, and use bands plus natural frequencies ("~38 of 100 similar projects were >12 months late").

## 5. Constraints

- The founder may start **solo or with a very small team**. Prefer product-led solutions in which AI automates operations. Flag anything that needs heavy field operations, a licence or a lot of capital.
- India realities: mobile-first; **English-first** (the target buyers are comfortable in English, and the AI should still understand Hinglish input); **WhatsApp is the default channel**; trust deficit; price sensitivity.
- Every claim we make to users must be defensible: cite the source, show confidence, never certify title. A human signs off where liability is high.

## 6. Source material (read what is relevant to your role)

Reports:
- `/Users/macbook/code/Real Estate/reports/Delhi NCR AI real estate platform.md` (Phase 1 synthesis)
- `/Users/macbook/code/Real Estate/reports/Developer and project risk scoring.md` (risk-score synthesis; may still be in progress, so use the notes below if it is missing)

Phase 1 notes, `/Users/macbook/code/Real Estate/research_notes/Delhi NCR AI real estate platform/`:
`market_size_and_dynamics.md`, `competitive_benchmark.md`, `buyer_journey.md`, `seller_journeys.md`, `regulatory_legal_tax.md`, `valuation_and_data.md`, `ai_opportunities.md`, `business_model_gtm_risks.md`

Risk-score notes, `/Users/macbook/code/Real Estate/research_notes/Developer and project risk scoring/`:
`rating_precedents_methodologies.md`, `ncr_risk_data_sources.md`, `delay_drivers_and_failure_signals.md`, `additional_buyer_risk_scores.md`, `legal_risk_and_score_ux.md`

## 7. Phase 2 deliverable

The specialist inputs live in `/Users/macbook/code/Real Estate/product/inputs/`. The senior PM synthesises them into `/Users/macbook/code/Real Estate/product/PRD.md`, which contains:
- vision and principles
- personas
- journeys
- feature set (prioritised P0/P1/P2, with web vs app)
- the risk score specification
- AI features
- compliance requirements
- business model
- MVP scope and roadmap
- metrics
- open decisions

Phase 3 (UI design) and Phase 4 (code) build on the PRD.
