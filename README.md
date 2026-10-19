# Plinth

A buyer-side, AI-first home-buying platform for Gurugram (Delhi NCR). Its core is a **Delivery Risk band** for under-construction projects (Low · Moderate · Elevated · High · Severe), built from public RERA records. **No developer pays us. Ever.**

## Where things are

| Path | What |
|---|---|
| `reports/` | Phase 1 research: market, opportunities, risk-scoring method |
| `product/PRD.md` | Product requirements (v1.1, §20 has the R1 scope decisions D11–D15) |
| `product/FOUNDER_QUESTIONS.md` | Open founder, legal and CA questions, plus decisions taken as acting PM |
| `DESIGN.md` | Design system "Daylight Live", taste rules, and **§5b, the canonical fictional data set** used by every screen and by the seed data |
| `product/design/artboards/` | All R1 screens (web, Android, WhatsApp) as Design-canvas artboards |
| `product/evaluation/` | Buyer, developer and broker evaluations and the gap tracker |
| `docs/engineering/` | Build plan, data model, API contracts, work breakdown, founder setup, decisions |
| `scripts/` | Image generation (Gemini) and artboard helpers |

Code arrives in `apps/` (Next.js web and admin, Flutter mobile), `packages/` (tokens, contracts, fixtures), `supabase/` and `pipelines/`, following `docs/engineering/BUILD_PLAN.md`.

## Secrets

Keys live in `.env.local`, which is gitignored and never committed. See `docs/engineering/SETUP_FOR_FOUNDER.md`.
