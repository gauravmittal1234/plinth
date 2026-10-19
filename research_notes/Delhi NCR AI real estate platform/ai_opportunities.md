# AI Opportunities for an AI-first Delhi NCR Flat Marketplace (buyer, consumer-seller, developer-seller), as of October 2026

Research date: 17 October 2026. Read these caveats first:
- **Prices change fast.** Every price below is the list price on the cited page when it was fetched (Oct 2026) unless another date is given. Recheck them before building a budget.
- **Some model names were read by an automated tool, not by hand.** Names like "Gemini 3.8 Flash", "Nano Banana 2.1", "gpt-image-2.5" and "gpt-6.1-sol" were pulled from vendor pricing/docs pages by a page-extraction tool. Several are newer than the researcher's own knowledge. Check them on the vendor page before quoting them in a product spec.
- **The shared web-search budget ran out partway through.** Later findings came only from fetching known URLs. Coverage is thinner for: Vastu tools, interior BOQ tools, home-loan AI, Rightmove/Redfin/Bayut, and Indian KYC vendor pricing (Signzy/IDfy/HyperVerge/Karza). These are listed as gaps.
- **Exchange rate:** about ₹92 per US$. This comes from Bolna's own page, which lists 6.00¢ as ₹5.52 ([Bolna pricing](https://www.bolna.ai/pricing)).

---

## Q1. Per use case: state of the art, unit cost, latency and quality caveats in 2026

### Takeaway
- **Cheap enough now:** generative image editing, Indic speech and Indic document OCR. A virtually staged photo costs about $0.02–$0.13 (₹2–12) through Gemini's API. A minute of Hindi voice-agent calling costs about ₹4–6. A page of Indic OCR or extraction costs ₹0.5–1.
- **Still the hard part:** accuracy. That means geometry and scale in staged images, legal correctness in title analysis, and Indian-market data for valuations. Human-in-the-loop checks and disclosure are required, not optional.

### Cited Findings

#### UC1. Virtual staging / furnishing empty flats (generative image editing)

**Google Gemini image models (Nano Banana family)**
- Model timeline:
  - Gemini 2.5 Flash Image ("Nano Banana") was released 26 Aug 2025 — [Gemini API changelog](https://ai.google.dev/gemini-api/docs/changelog). It is now "Legacy". The pricing page marks it "Deprecated Oct 2, 2026" — [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing); [Gemini image-generation docs](https://ai.google.dev/gemini-api/docs/image-generation)
  - Gemini 3 Pro Image ("Nano Banana Pro"): preview 20 Nov 2025, GA 28 May 2026 — [changelog](https://ai.google.dev/gemini-api/docs/changelog)
  - Gemini 3.1 Flash Image ("Nano Banana 2"): preview 26 Feb 2026, GA 28 May 2026 — [changelog](https://ai.google.dev/gemini-api/docs/changelog)
  - Gemini 3.1 Flash Lite Image ("Nano Banana 2 Lite"): GA 30 Jun 2026 — [changelog](https://ai.google.dev/gemini-api/docs/changelog)
  - "Gemini Nano Banana 2.1": GA 6 Oct 2026, with "better visual quality, prompt adherence, character consistency". It deprecates gemini-3.1-flash-image — [changelog](https://ai.google.dev/gemini-api/docs/changelog)
- Per-image list prices (standard tier, Oct 2026) — [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing):

| Model | Standard price per image | Batch (50% off) |
|---|---|---|
| Nano Banana (2.5 Flash Image) | $0.039 | $0.0195 |
| Nano Banana 2 (3.1 Flash Image) | $0.045 (512px), $0.067 (1K), $0.101 (2K), $0.151 (4K) | $0.022–$0.076 |
| Nano Banana 2 Lite | $0.0336 (1K) | $0.0168 |
| Nano Banana 2.1 | $0.0336 (1K), $0.0504 (2K), $0.113 (4K) | 50% off |
| Nano Banana Pro (3 Pro Image) | $0.134 (1K/2K), $0.24 (4K) | 50% via Batch/Flex |

- Capabilities from the Gemini docs — [Gemini image-generation docs](https://ai.google.dev/gemini-api/docs/image-generation):
  - Multi-turn conversational editing (via `previous_interaction_id`) on Nano Banana 2.1, 3.1 Flash Image and 3 Pro Image. The Flash Lite model is "not optimized" for multi-turn editing.
  - Reference images: Nano Banana 2.1 and 3.1 Flash accept up to 10 object images, 5 character-consistency images and 3 style references. 3 Pro Image accepts up to 6 object images.
  - Output up to 4K, except Lite, which is 1K only.
  - Grounding with Google Search.
  - Thinking mode is on by default.
  - "All generated images include a SynthID watermark."
- Nano Banana 2 adds:
  - A 512px tier and new aspect ratios (4:1, 1:4, 8:1, 1:8) — [Google developers blog, 26 Feb 2026](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-nano-banana-2/)
  - A partner-reported "74–76% reduction in latency" — [same blog](https://blog.google/innovation-and-ai/technology/developers-tools/build-with-nano-banana-2/)
  - It became the default image engine in the Gemini app, AI Mode, Lens, Google Ads and Flow. Reports say it ranked #1 on the Artificial Analysis text-to-image arena at roughly half the API price of Nano Banana Pro — [ALM Corp guide (secondary)](https://almcorp.com/blog/google-nano-banana-2-gemini-31-flash-image-complete-guide/); [Google Workspace Updates](https://workspaceupdates.googleblog.com/2026/02/introducing-nano-banana-2-in-gemini-app.html)

**OpenAI image models**
- OpenAI prices image models per token — [OpenAI API pricing](https://developers.openai.com/api/docs/pricing):
  - gpt-image-1: image output $40 per 1M tokens
  - gpt-image-1-mini: $8 per 1M
  - gpt-image-1.5: $32 per 1M
  - gpt-image-2 and gpt-image-2.5 ("sunburst"/"flare" variants): $30 per 1M image-output tokens and $8 per 1M image-input tokens
  - Batch: 50% off
- Replicate's Sept 2025 comparison measured gpt-image-1 at $0.01–$0.25 per image and about 40 s inference, with "character consistency" issues on perspective edits — [Replicate blog, 23 Sep 2025](https://replicate.com/blog/compare-image-editing-models)

**Open and alternative editing models** (Replicate comparison, Sept 2025) — [Replicate blog](https://replicate.com/blog/compare-image-editing-models)

| Model | Price per image | Inference time | Notes |
|---|---|---|---|
| FLUX.1 Kontext [pro] | $0.04 | 4.4 s | |
| Nano Banana | $0.039 | 10 s | Best at preserving text and resemblance in style transfer (with Seedream) |
| Qwen-Image-Edit | $0.03 | 2.9 s | Excelled at object removal (with SeedEdit) |
| SeedEdit 3.0 | $0.03 | 13 s | Excelled at object removal |
| Seedream 4 | $0.03 | 14 s | ByteDance models best at background edits with "natural lighting" |

  - Kontext [pro] failed one object-removal test ("left the two towers in place").
  - Third-party resellers price Seedream 4 and Qwen-Image-Edit anywhere from $0.03 to $0.13 per image — [search aggregation incl. fal.ai/Together listings](https://fal.ai/models/fal-ai/flux-pro/kontext)

**Dedicated staging SaaS (Oct 2026 comparison)**
This comparison was published by Roomagen, a competing vendor, so treat it as potentially biased — [Roomagen comparison, updated 3 Oct 2026](https://roomagen.com/blog/best-ai-virtual-staging-software-2026-comparison).

| Tool | Price | Turnaround | Notes |
|---|---|---|---|
| Virtual Staging AI | $16–79/mo ($0.53–2.67/image) | 10–15 s | API only on Enterprise |
| Collov AI | $19–127/mo ($0.24–0.33/image) | about 10 s | Has a "one-click disclaimer"; Trustpilot 2.8 |
| REimagineHome | $14–99/mo ($0.15–0.47/image) | 2–5 min per batch | "Real Products" (shoppable), chat editing, "Structural Lock" |
| Apply Design | $7–10 per coin | 10–15 min | 18,000+ furniture pieces, multi-angle consistency, 360° staging |
| Pedra | €0.14–0.29/image | seconds | Video, 360° tours and floor plans included |
| BoxBrownie (human) | US$24–30/image | under 48 h | |
| Styldod (human) | $16–23/image | 24–48 h | |

  - A second source gives similar REimagineHome tiers ($19/30 images to $119/1,200) and Collov tiers ($16/60) — [AI Tools Bakery (secondary)](https://aitoolsbakery.com/blog/virtual-staging-ai-cost/)
- **Known failure modes**
  - Furniture drawn "20% too large", rugs floating above the floor, chairs merging into walls, lamps without shadows, a nine-foot sectional in a twelve-foot room — [VirtuallyStage blog (vendor)](https://www.virtuallystage.com/blog/why-ai-virtual-staging-looks-fake)
  - Generative models "improve" the room with new flooring, altered window frames and phantom pot lights — [same](https://www.virtuallystage.com/blog/why-ai-virtual-staging-looks-fake)
  - Real US cases (Dec 2025): bedroom windows that don't exist, oversized sectionals, "distorted, melting lines surrounding doors or windows", altered lighting — [Yahoo Finance](https://finance.yahoo.com/news/weary-homebuyers-have-a-new-headache-misleading-ai-listing-photos-130020137.html)

#### UC2. Floor-plan intelligence and 3D capture
- **CubiCasa (phone-scan floor plans):** base floor plans are free and unlimited in the US. Plans with fixed furniture cost $15 per scan, and scans over 5,000 sq ft carry a surcharge from $25 — [GetApp/CubiCasa listing (search summary)](https://www.getapp.com/industries-software/a/cubicasa/)
- **Getfloorplan (2D plan to 3D and 360° tour):** $25 for a 2D + 3D plan, $45 with a 360° virtual tour, $69 for all features. Delivered within 24 h, with optional human review — [Creati.ai listing (secondary)](https://creati.ai/ai-tools/getfloorplan/)
- **Gaussian splatting:**
  - Zillow launched SkyTour in July 2025. It uses Gaussian splatting on drone footage and was the first major portal feature built on the technique. CoStar's Apartments.com responded with Matterport 3D Exteriors — [R2U technical guide](https://r2u.io/en/blog/gaussian-splatting-real-estate-visualization/)
  - Typical professional 3DGS projects cost $2,250–5,000 per property. Viewers render at 30–120 fps in the browser via WebGPU, with no app needed — [R2U](https://r2u.io/en/blog/gaussian-splatting-real-estate-visualization/)
  - A few minutes of phone or drone video can be turned into a photoreal walk-through scene — [R2U](https://r2u.io/en/blog/gaussian-splatting-real-estate-visualization/)

#### UC3. Conversational search, buyer-advisor agents and Indic voice
- **Text LLM costs (Oct 2026 list prices):**
  - Sarvam 105B: ₹15 input / ₹60 output per 1M tokens — [Sarvam API pricing](https://www.sarvam.ai/api-pricing)
  - OpenAI "gpt-6-luna": $0.10 / $0.50 per 1M tokens; "gpt-6.1-sol": $2 / $10; "gpt-6-astra": $10 / $50 — [OpenAI pricing](https://developers.openai.com/api/docs/pricing)
  - The Gemini pricing page lists a "Gemini 3.8 Flash" at $0.75 / $3.75 per 1M tokens — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- **Indic speech (Sarvam)** — [Sarvam API pricing](https://www.sarvam.ai/api-pricing):
  - Speech-to-text: ₹0.49/min pay-as-you-go, ₹0.41/min on Growth/Business
  - Text-to-speech: Bulbul V4 Flash ₹1.70–2.00 per 1,000 characters; Bulbul V3 ₹2.70–3.00
  - Translation: ₹1.50–2.00 per 1,000 characters
  - Plans: free pay-as-you-go, ₹2,000/mo Pro, ₹10,000/mo Growth, ₹50,000/mo Business
- **Bolna (Indian voice-agent platform):**
  - 6.00¢/min (₹5.52) standard, about 4.51¢ at volume. Pilot plan: $300 for 6,500 min or $500 for 12,000 min (about 4.2¢ ≈ ₹4/min), billed in 30-second pulses, 25 concurrent calls. The rate bundles STT, LLM and TTS. Supports 10+ Indian languages including Hinglish. Bring-your-own-keys is available — [Bolna pricing](https://www.bolna.ai/pricing)
  - A third-party blog says telephony and a $0.02/min platform fee are billed separately when you bring your own provider keys — [Dograh blog](https://blog.dograh.com/bolna-ai-pricing-breakdown-and-how-open-source-saves-70/). This is unresolved: confirm with Bolna what telephony costs on top.
  - Bolna's Indic speech is reportedly "powered substantially by Sarvam" — [Indiafintech substack (secondary)](https://indiafintech.substack.com/p/the-hundred-buyer-problem-the-complete)
- **ElevenLabs:** agents at $0.08/min; TTS Flash/Turbo $0.04 and v3 Multilingual $0.08 per 1,000 characters; Scribe v2 STT $0.22/hour — [ElevenLabs API pricing](https://elevenlabs.io/pricing/api)
- **OpenAI realtime voice:** gpt-realtime costs $32/$64 per 1M audio input/output tokens; gpt-realtime-mini $10/$20. Transcription costs $0.003–0.017/min — [OpenAI pricing](https://developers.openai.com/api/docs/pricing)
- **Gemini Live:** the pricing page lists "Gemini 3.8 Live" audio at about $0.005/min input and $0.018/min output — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing). "gemini-3.8-live" went GA on 15 Sep 2026 as the default low-latency voice-agent model — [changelog](https://ai.google.dev/gemini-api/docs/changelog)
- **Zillow ChatGPT app** (live 6 Oct 2025, the first real-estate app inside ChatGPT):
  - Natural-language queries such as "townhouses with two bedrooms… under $800,000 in Seattle". Returns listing facts, neighbourhood and affordability info, with links back to Zillow. Available on Free, Plus and Pro plans in the US — [Real Estate News](https://www.realestatenews.com/2025/10/22/zillows-chatgpt-integration-forces-industry-reckoning)
  - Zillow's SVP of AI said engagement is "pretty consistent with what we see on Zillow". He also said OpenAI does not want customer PII, and that prompts are checked for fair-housing compliance — [The AI Innovator, 29 Nov 2025](https://theaiinnovator.com/zillows-svp-of-ai-on-launching-inside-chatgpt/)
- **Housing.com (REA India)** launched native property search inside ChatGPT on 11 Jun 2026, covering conversational discovery, refinement and comparison — [Realty N More](https://realtynmore.com/housing-com-launches-property-search-on-chatgpt/)
- **Homes.com (CoStar)** launched an AI home-search experience built on Microsoft Azure OpenAI — [HousingWire headline](https://www.housingwire.com/articles/homes-ai-launch-openai/); [CoStar IR headline](https://investors.costargroup.com/news-releases/news-release-details/costar-group-launches-transformative-ai-experience-homescom). The page body could not be fetched (403).

#### UC4. Document intelligence for due diligence
- **Sarvam document pricing:** digitisation ₹0.50 per page; extraction ₹1.00 per page (₹0.80 on Business) — [Sarvam API pricing](https://www.sarvam.ai/api-pricing)
- **Sarvam Vision 2.1** (24 Sep 2026) — [Sarvam blog](https://www.sarvam.ai/blogs/sarvam-vision-2-1):
  - 93.52% Hindi accuracy on Sarvam's own Indic OCR Bench
  - 91.9% on olmOCR-Bench, versus 82.4% for "Gemini 3.6 Flash" and 81.8% for "GPT 6 Astra" (vendor-run benchmark)
  - Handles multi-page tables and Indic handwriting across 22 languages
  - Stamps and seals are not explicitly mentioned
- **Earlier Sarvam Vision:** 95.91% Hindi word accuracy on Sarvam Indic OCR Bench (6,909 samples from newspapers, brochures, textbooks and historical documents, 1800–present). Outputs tables as HTML/Markdown plus page-level JSON — [Sarvam Vision blog](https://www.sarvam.ai/blogs/sarvam-vision). The Hindi figures for v1 and v2.1 differ and may use different metrics; the conflict is unresolved.
- **Landeed** (YC-backed, about $16.3M raised in total) — [Tracxn](https://tracxn.com/d/companies/landeed/__WFZqG7Kk3p1tb8ocWi4RjZd-7kuz8ioJC33nM39EDY8):
  - Launched **Terra** on 9 Jun 2026. Users ask natural-language questions about ownership, title, encumbrances, litigation and transactions. Answers come from a corpus of more than 773 million land and property documents, covering 26 states and 4 UTs. Sources: state portals, sub-registrars, revenue departments, municipal systems and court databases. Uses domain-specific OCR plus "on-ground verification networks". Targets banks, NBFCs, developers, lawyers and brokers. Pricing is not disclosed — [Realty N More](https://realtynmore.com/landeed-launches-terra-to-transform-fragmented/)
  - Landeed was selected for the Anthropic + AWS Agentic AI Accelerator — [search summary of Landeed coverage](https://www.ghar.tv/blog/landeed-the-startup-trying-to-give-every-indian-property-a-blue-tick/artid8224)
- **Academic stress test:** an arXiv paper asks "Can OCR-VLMs Read Devanagari?", which signals that Devanagari OCR still needs post-correction — [arXiv 2606.29213](https://arxiv.org/pdf/2606.29213). Title only; the content was not reviewed.

#### UC5. Listing quality and trust
- **What counts as synthetic under India's IT Rules (Feb 2026):** "good-faith editing or technical corrections (such as formatting, colour adjustment, noise reduction, or compression)" and enhancements for "clarity… without altering substantive content" are excluded from the definition of synthetically generated information (SGI). Basic photo enhancement therefore does not trigger SGI labelling — [Herbert Smith Freehills Kramer (HLC)](https://www.hlc.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content)
- **NAR 2025:** buyers' agents rated these as important to clients: photos 73%, physical staging 57%, videos 48%, virtual tours 43%. For sellers' agents: photos 88%, videos 47% — [NAR 2025 Profile of Home Staging (PDF)](https://cms.nar.realtor/sites/default/files/2025-06/2025-profile-of-home-staging-report-06-26-2025.pdf)
- **Dedicated tools found:** only the image-enhancement features bundled in the staging SaaS above (e.g., Roomagen enhancement and day-to-dusk; Collov enhancement on Advanced plans) — [Roomagen comparison](https://roomagen.com/blog/best-ai-virtual-staging-software-2026-comparison)

#### UC6. Valuation (brief; another researcher covers data)
- **Zestimate accuracy (2026):** median error 1.74% for on-market homes and 7.20% for off-market homes, roughly $35k on a $500k home — [Houwzer](https://houwzer.com/blog/the-zillow-zestimate-can-it-be-trusted/). Other sites report 1.9% and 7.06–7.49% — [Irina Norrell](https://irinanorrell.com/how-accurate-is-zillows-zestimate/)
- **India:** 99acres, MagicBricks and Housing.com have all deployed AI valuation models giving automated price estimates — [SirfBroker (secondary)](https://sirfbroker.io/proptech-ai-real-estate-broker-india-2026/). No accuracy figures were published.

#### UC7. Developer-side AI
- **Voice/lead agents:** ConvoZen (NoBroker's spin-out) offers a real-estate voice agent:
  - Qualifies on project, budget, location and timeline; confirms and reschedules site visits; syncs to CRM; works across voice, WhatsApp and email
  - Handles Hindi-English code-switching through its own "Akshara" STT; transfers to humans over SIP; audits 100% of calls for quality and compliance
  — [ConvoZen real-estate page](https://convozen.ai/products/ai-voice-agent-for-real-estate)
- **WhatsApp Business API (India, Meta list price before BSP fees and 18% GST):**
  - Marketing template ₹0.8631/message (up about 10% from ₹0.7846); utility and authentication ₹0.1150 — [MyOperator](https://myoperator.com/blog/whatsapp-business-api-pricing-india-2026); [Amomic](https://amomic.in/blog/whatsapp-business-api-pricing-india)
  - One aggregation reports that from 1 Oct 2026 service replies are billed at ₹0.1150 after 1,000 free per number per month. This is single-source and unverified — [search aggregation](https://chatmaxima.com/whatsapp-api-pricing/india/)
- **AI video (Veo 3.1)** per second of output — [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing):
  - Standard: $0.40/s (720p/1080p), $0.60/s (4K)
  - Fast: $0.10–0.30/s
  - Lite: $0.05–0.08/s
  - Veo 3.1 (preview Oct 2025) supports video extension, interpolation and multiple input images. Veo 3.1 Lite (Mar 2026) is the "most cost-efficient" — [changelog](https://ai.google.dev/gemini-api/docs/changelog)
- **Construction progress monitoring:**
  - DroneDeploy Progress AI (launched July 2025) identifies "what has been built, where, and by whom" from any drone or 360° camera feed, without needing a BIM model — [DroneDeploy](https://www.dronedeploy.com/product/progress-ai); [DroneLife](https://dronelife.com/2025/07/22/dronedeploy-launches-progress-ai-to-automate-construction-tracking/)
  - In April 2026, Chennai developer DRA adopted an AI construction-intelligence platform covering quality inspection, site monitoring, safety analytics and delay prediction — [The Realty Today](https://therealtytoday.com/news/technology/ai-and-drones-are-making-construction-progress-more-visible-and-accountable/)
  - Indian drone-survey firms offer monthly progress reports and RERA compliance documentation — [Aeroyantra](https://www.aeroyantra.com/services/drone-construction-survey)

#### UC8. Seller-side AI
- **Zillow's current consumer AI set:**
  - Virtual staging (AI restyling of empty rooms), SkyTour, the BuyAbility affordability tool, verified pre-approval, and smart agent messages built from behavioural signals — [The AI Innovator](https://theaiinnovator.com/zillows-svp-of-ai-on-launching-inside-chatgpt/)
- **Turning one walk-through into many assets:** Gemini's newer image models support video-to-image input (Nano Banana 2.1, 3.1 Flash, 3.1 Flash Lite) — [Gemini image docs](https://ai.google.dev/gemini-api/docs/image-generation)
  - Pedra bundles video, 360° tours and floor plans with staging — [Roomagen comparison](https://roomagen.com/blog/best-ai-virtual-staging-software-2026-comparison)

#### UC9. Neighbourhood intelligence
- **Google Maps Platform list prices** (per 1,000 events, after the free monthly cap) — [Google Maps Platform pricing](https://developers.google.com/maps/billing-and-pricing/pricing):

| API | Free monthly cap | Price per 1,000 events |
|---|---|---|
| Air Quality | 10k | $5.00 down to $0.25 at volume |
| Solar Building Insights (sun exposure / roof modelling) | 10k | $10.00–3.50 |
| Solar Data Layers | 1k | $75 |
| Routes Compute Route Matrix (commute times), Essentials | 10k | $5.00–0.38 |
| Routes Compute Route Matrix, Pro | 5k | $10–0.75 |
| Places Nearby Search, Pro | 5k | $32–2.40 |
| Aerial View | 5k | $16–1.20 |
| Pollen | 5k | $10–0.50 |
| Street View Static | 5k | $14–1.05 |
| Photorealistic 3D Tiles | 1k | $6–2.40 |

  - The page also references separate "India pricing", but the India rates were not captured.

#### UC10. Post-purchase AI
- **Shoppable staging:** REimagineHome's "Real Products" feature lets staged images use real, purchasable items — [Roomagen comparison](https://roomagen.com/blog/best-ai-virtual-staging-software-2026-comparison)
- **Interiors pre-sales:** NoBroker Interiors used ConvoZen voice agents for interiors pre-sales and reported +9% pre-sales conversion — [ConvoZen NoBroker Interiors case](https://convozen.ai/success-stories/nobroker-interiors)

### Inferences

**Catalogue summary.** These are my judgements, built from the cited unit costs above.

| # | Use case | 2026 maturity | Indicative unit cost | Key caveat |
|---|---|---|---|---|
| 1 | Virtual staging (generative edit) | **Production-ready for visuals; not for dimensions** | $0.017–0.134 per image via Gemini; $0.15–0.53 via SaaS; $16–30 human | Scale and structure hallucination; must be labelled |
| 2 | Plan → 3D, room-dimension extraction | Mature for plan → 3D renders (getfloorplan $25–69); phone-LiDAR scan is mature (CubiCasa) | $0–69 per flat | Carpet-area "verification" from a brochure plan is only as good as the plan; needs a physical measure |
| 2b | Gaussian-splat walk-throughs | Early mainstream (Zillow SkyTour 2025) | $2.25k–5k professional; much cheaper with DIY phone capture | Not measurement-grade; heavy files on low-end Android |
| 3 | NL search + Hindi/Hinglish advisor | Production-ready (Zillow, Housing.com inside ChatGPT) | Under ₹0.5 per conversation on Flash-class or Sarvam LLMs | Hallucinated facts; fair-housing-style discrimination filters; must ground answers in listing database |
| 3b | Hindi voice agent | Production-ready (NoBroker: 30–35% of conversations) | ₹4–7.4/min (Bolna, ElevenLabs) + telephony | Latency, accents, consent and DND (TRAI) rules; disclose it is AI |
| 4 | Title/RERA/OC document AI | OCR is mature; legal reasoning is assistive only | ₹0.5–1 per page (Sarvam) + LLM, so likely under ₹100 per property machine cost | Stamps, handwriting and missing links in the title chain; lawyer sign-off needed |
| 5 | Listing trust (dedupe, fake detection, enhancement) | Mature building blocks; little India-specific evidence found | Under ₹1 per listing (embedding similarity + LLM checks) | Adversarial brokers; verification must tie to physical evidence |
| 6 | AVM / forecasting | Mature in the US (1.7% on-market error); weak in India because transaction data is opaque | Low compute; data is the cost | Overconfidence; show ranges |
| 7 | Developer AI (voice/WhatsApp agents, ads, video, progress monitoring) | Voice/WhatsApp: production. AI video: production for mood films, risky for depicting units. Progress AI: production abroad, early in India | Veo Lite about $0.40–0.64 per 8-s clip; Standard $3.20 per 8-s clip | RERA advertisement accuracy; WhatsApp marketing message costs |
| 8 | Seller AI (price estimate, video → listing, decluttering) | Production-ready components | Pennies per listing | Decluttering and removal cross into "altered image" territory |
| 9 | Neighbourhood intel (AQI, commute, sun) | Production-ready APIs | $5–10 per 1k calls; cache per society/sector | "Day-in-the-life" generative previews risk misrepresentation; keep them clearly illustrative |
| 10 | Interiors with BOQ, loan matching | Interiors visual: production. BOQ costing: immature (no reliable source found). Loan eligibility: rules-based plus bank APIs | Low | Shoppable links need catalogue APIs (Pepperfry/IKEA/Livspace not verified) |

**Unit economics examples**
- **Staging a 3BHK listing:** 8 rooms × 3 style variants × about 2 retries = 48 Nano Banana 2.1 images at 1K, about $1.61 (≈₹150). The batch tier halves this. Nano Banana Pro at 2K would cost about $6.4 (≈₹590). Even at Pro prices, free staging for every listing is affordable.
- **Hindi voice qualification:** a 3-minute call costs about ₹12–17 on Bolna (excluding telephony). That is cheap next to an Indian tele-caller's loaded cost per call. Exact comparator data was not found.
- **Title/document pack:** 40 pages × ₹1 extraction plus an LLM pass is under ₹100 per property in machine cost. The real cost is the lawyer review.
- **gpt-image per-image cost** depends on the output token count, which was not retrieved. At $30 per 1M output tokens, an image of about 1,000–4,000 tokens would cost about $0.03–0.12. This is an estimate.

**Model choice.** Google's model line-up changed four times in 12 months. Build behind a model-abstraction layer, and expect deprecations roughly every 6–9 months (2.5 Flash Image was deprecated about 13 months after launch).

### Gaps
- Per-image token counts for gpt-image-2 / 2.5 (needed for exact per-image prices) were not shown on the pricing page.
- Pricing not found for: Google Document AI (page truncated), Matterport plans (404), Polycam/Luma, Interior AI/RoomGPT, Planner 5D AI, Floorfy.
- No India-specific evidence found for: Vastu-analysis AI tools; AI carpet-area verification; Indian interior AI with BOQ (Livspace, HomeLane, Pepperfry, IKEA India APIs). The search budget was exhausted.
- India rates for Google Maps Platform were not captured.
- No published accuracy figure was found for Indian portal AVMs (99acres, MagicBricks, Housing.com, Square Yards).
- Latency for Hindi voice-agent pipelines (end-to-end turn latency) was not found in primary sources.

---

## Q2. Who has shipped these, and with what measurable results?

### Takeaway
- **Evidence is strongest for:**
  - Immersive media: Zillow says 3D tours lift views, saves and sale speed.
  - Staging: NAR finds a modest price and time-on-market effect.
  - India voice AI: NoBroker/ConvoZen reports +8% site visits and +9% pre-sales conversion.
- **Evidence is weakest for:** conversational/ChatGPT search. Zillow reports no engagement change. India-specific outcome data is sparse and mostly self-reported by vendors.

### Cited Findings

**Staging (US, NAR 2025)** — [NAR 2025 Profile of Home Staging](https://cms.nar.realtor/sites/default/files/2025-06/2025-profile-of-home-staging-report-06-26-2025.pdf)
- 19% of sellers' agents reported a 1–5% increase in the dollar value offered for staged homes, compared with similar homes.
- 30% of sellers' agents said staging slightly reduced time on market.
- 83% of buyers' agents said staging makes it easier to visualise the property as a future home.
- 38% of buyers' agents rated virtual staging "of less importance".
- Median spend on a staging service was $1,500, versus $500 when the agent staged personally.
- Rooms most commonly staged: living room, primary bedroom, kitchen.
- NAR's press release headline: 29% of agents saw a 1–10% increase in offers, and 49% of sellers' agents saw shorter time on market — [NAR press release](https://www.nar.realtor/press-releases/nar-report-reveals-home-staging-boosts-sale-prices-and-reduces-time-on-market); [KBB summary](https://kbbonline.com/business-people-news/nar-2025-profile-of-home-staging-released/161855/)
- These press figures differ from the per-question figures in the PDF text above. They are likely aggregates across ranges, so cite the PDF figures for precision.
- A secondary source reports 16–18% of agents using or testing virtual staging tools — [AIHomeDesign (vendor)](https://aihomedesign.com/blog/real-estate/nars-home-staging-statistics/). This was not verified in the PDF text.
- Share of agents staging all listings fell from 38% (2017) to 21% (2025) — [search summary of NAR coverage](https://chicagoagentmagazine.com/2025/05/09/nar-staging-home-increases-sale-price/)

**3D tours and splats (US)**
- Zillow-reported figures for 3D Home tours — [Zillow resources page](https://www.zillow.com/resources/stay-informed/virtual-tours-home-sell-faster/) (403; figures from search snippets); [Virtuance](https://www.virtuance.com/zillow-3d-tours/):
  - Homes sold about 14% faster (another figure: 10%).
  - 60% more views and 79% more saves.
  - 46% sold within 30 days, versus 38% without a tour.
  - Several versions of these figures circulate.
- Zillow SkyTour listings reportedly saw 79% more views, 76% more saves and 91% more shares — [RealHorizons (secondary; not confirmed in primary source)](https://realhorizons.ai/blog/gaussian-splatting-for-real-estate/)

**Conversational search**
- **Zillow:** the ChatGPT app is live; engagement is "pretty consistent… we haven't seen a number change one way or another" — [The AI Innovator](https://theaiinnovator.com/zillows-svp-of-ai-on-launching-inside-chatgpt/)
- **Housing.com:** ChatGPT app launched June 2026; no metrics published — [Realty N More](https://realtynmore.com/housing-com-launches-property-search-on-chatgpt/)

**India voice AI (NoBroker/ConvoZen)**
- **Builders arm** — [ConvoZen real estate](https://convozen.ai/products/ai-voice-agent-for-real-estate):
  - +8% site visits per month
  - 12.5% of rejected customers revived through re-qualification
  - 6% of business handled by voice agents
  - Call auditing went from about 3–4% of calls to systematic review
- **Interiors arm:** +9% pre-sales conversion, +25% compliance score, 4% additional business from bot-qualified leads — [ConvoZen NoBroker Interiors](https://convozen.ai/success-stories/nobroker-interiors)
- **Scale:** about 30–35% of NoBroker's 6–6.5 lakh daily conversations are handled by voice AI. ConvoZen handles over 2M conversations a day across more than 50 enterprises, growing 40–50% month-on-month. About 80% of routine interactions are automatable. It has its own STT ("Akshara") and TTS ("Ragini") models — [Business Today, 24 Feb 2026](https://www.businesstoday.in/latest/corporate/story/how-convozen-is-emerging-as-nobrokers-new-growth-engine-517791-2026-02-24)

**India document intelligence**
- Landeed says its app makes title searches 10x faster than traditional methods — [search summary of Landeed coverage](https://india.entrepreneur.com/news-and-trends/property-title-search-innovator-landeed-raises-usd-5-mn/485979)
- Terra corpus: more than 773M documents — [Realty N More](https://realtynmore.com/landeed-launches-terra-to-transform-fragmented/)

**AVM:** Zillow's off-market median error of about 7% versus about 1.7% on-market shows that AVMs work best where listing prices are available as anchors — [Houwzer](https://houwzer.com/blog/the-zillow-zestimate-can-it-be-trusted/)

### Inferences
- **Highest-confidence wins for an Indian marketplace:**
  - Voice and WhatsApp lead qualification for developer inventory (proven in-market by NoBroker).
  - Immersive media (3D, splats, staging) for engagement metrics such as views and saves.
- **ChatGPT-app search** is a distribution and brand play (both Housing.com and Zillow did it), not a proven conversion lever.
- **NAR staging gains are modest:** 1–5% on offers for a minority of agents. Indian under-construction and new-launch flats are already sold with show flats and renders, so the uplift is likely highest for **resale empty flats** in Delhi NCR, which are often unfurnished or poorly photographed. This is a hypothesis to A/B test.

### Gaps
- Not found, because search budget ran out:
  - Measured outcomes for Housing.com, 99acres, MagicBricks or Square Yards AI features (CTR, leads)
  - Rightmove, Redfin or Bayut AI results
  - Bayut TruCheck verification uplift (page returned 503)
- No controlled study found that isolates *virtual* (as opposed to physical) staging's effect on sale price.

---

## Q3. Failure modes, legal and ethical issues, and mitigations

### Takeaway
- **What is now required:**
  - India: since 20 Feb 2026, India's amended IT Rules require visible labels and permanent provenance metadata on synthetic visuals hosted by intermediaries. That covers virtual staging and AI walk-throughs on a listings platform.
  - California: AB 723 (from 1 Jan 2026) has made "label it plus link to the original" the global norm.
  - DPDP compliance becomes fully enforceable on 13 May 2027.
- **The core mitigation pattern:** disclosure badges, a before/after toggle, a ban on structural edits, and keeping the original image.

### Cited Findings

**India: IT (Intermediary Guidelines) Amendment Rules 2026**
- Notified 10 Feb 2026; in force 20 Feb 2026 — [HLC](https://www.hlc.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content); [Legal500](https://www.legal500.com/intelligence/india/media-telecoms-it-entertainment/2026-it-rules-amendments-ai-content-labelling-and-intermediary-obligations)
- **Definition:** SGI is audio, visual or audio-visual content "artificially or algorithmically created, generated, modified, or altered" that appears authentic. Good-faith colour adjustment, noise reduction and compression are excluded — [HLC](https://www.hlc.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content)
- **Labelling:** permitted SGI must carry a prominent visible label plus "permanent metadata or provenance markers, including unique identifiers". Platforms must not allow their removal — [HLC](https://www.hlc.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content)
- **All intermediaries:** must use automated tools to prevent unlawful SGI, take content down within 3 hours of being flagged (previously 36 hours), and notify users quarterly — [HLC](https://www.hlc.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content)
- **Significant social media intermediaries (5M+ users):** must also collect user declarations of SGI and verify them — [HLC](https://www.hlc.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content)
- **Timing of labels:** labels must show before engagement (likes, shares, forwards); audio markers must play in the first part of the clip — [search summary of IT Rules coverage](https://veritect.ai/digital-data-ai-law/it-rules-synthetic-media-amendment-feb-2026)

**India: DPDP Rules 2025** (notified 13 Nov 2025) — [DPDP timeline](https://www.dpdpactindia.com/timeline.html); [GLOCERT](https://www.glocertinternational.com/resources/guides/dpdp-rules-2025-compliance-timeline/)
- Consent Manager framework from 13 Nov 2026.
- Core obligations (notice, consent, security, breach reporting, data-principal rights, cross-border transfer, children's data) from 13 May 2027.

**US and global staging disclosure**
- **California AB 723** (signed 10 Oct 2025, in force 1 Jan 2026) — [WAV Group](https://www.wavgroup.com/2025/11/19/californias-new-photo-disclosure-law-and-what-it-means-for-mlss-and-brokerages/):
  - Requires a "clear and conspicuous disclosure" plus a link, URL or QR code to the unaltered original for any image that adds, removes or changes fixtures, furniture, flooring, paint, landscaping or neighbouring properties.
  - Lighting, white balance, cropping and straightening are exempt.
  - Applies to listing agents and brokers, not portals.
  - Violations are a misdemeanour.
- **NAR Code of Ethics, Article 12** ("true picture") is interpreted as requiring clear disclosure of virtual staging. Many MLSs require the label on or next to the photo, at least one unstaged photo, and a note in the remarks. Permanent features must not be altered and defects must not be hidden — [Bella Virtual (vendor)](https://www.bellavirtual.com/blogs/news/how-to-disclose-virtual-staging-mls-nar-and-best-practices); [Homes.com guide](https://www.homes.com/learn/virtual-home-staging/)
- **New York:** the State Department of State warned in November 2025 about a "significant rise in artificially generated pictures" — [Yahoo Finance](https://finance.yahoo.com/news/weary-homebuyers-have-a-new-headache-misleading-ai-listing-photos-130020137.html)

**Buyer trust and fairness**
- Buyers describe AI-altered photos as "being lied to". Fake-looking furniture makes buyers ask "what else in this listing is misleading?" — [FastExpert/BAM search summary](https://nowbam.com/has-ai-staging-gone-too-far-heres-what-buyers-are-saying/); [VirtuallyStage](https://www.virtuallystage.com/blog/why-ai-virtual-staging-looks-fake)
- Brightened photos can hide poor natural light — [Globe and Mail via search summary](https://www.theglobeandmail.com/investing/personal-finance/article-reality-check-how-ai-altered-images-are-duping-buyers-hunting-for/)
- Zillow screens ChatGPT prompts for fair-housing compliance and keeps customer PII away from OpenAI — [The AI Innovator](https://theaiinnovator.com/zillows-svp-of-ai-on-launching-inside-chatgpt/)

**Built-in provenance and disclosure features**
- Every Gemini-generated image carries a SynthID watermark — [Gemini image docs](https://ai.google.dev/gemini-api/docs/image-generation)
- Collov offers a "one-click disclaimer"; REimagineHome offers "Structural Lock" — [Roomagen comparison](https://roomagen.com/blog/best-ai-virtual-staging-software-2026-comparison)

### Inferences
**Mitigations for an Indian launch**
- **Label every AI-staged image.** Put a non-removable "AI-furnished – virtual" badge on the image itself. Add C2PA/IPTC metadata alongside SynthID, which by itself is only machine-detectable. This meets the IT Rules' visible-label plus metadata requirement.
- **Show the original.** Default to a "Show original" before/after toggle, and require at least one as-is photo per room (the AB 723 and MLS pattern).
- **Restrict the prompt to movable items.** Lock structure (walls, windows, floors, views) and allow only furniture and décor. Run an automated structural-diff check: segmentation or edge-map comparison against the original, rejecting edits that change window or door masks. Do not allow sky, view or lighting changes beyond simple exposure correction.
- **Scale furniture correctly.** Use room dimensions from a CubiCasa- or LiDAR-type scan, or from user-entered carpet-area data, to choose furniture by real dimensions. Also use the multi-reference capability (up to 10 object images) to supply real catalogue SKUs. This also enables budget-linked shoppable links.
- **Keep staging uses honest.**
  - Do not stage *under-construction* units as if they were built, unless the image is clearly labelled as an artist's impression.
  - RERA rules on advertisement accuracy (see Gaps) make developer-side misrepresentation a regulatory risk, not just a reputational one.
- **AI video:**
  - Label it on screen at the start.
  - Never generate "walk-throughs" that invent layouts. Generate only from real capture (splat or video) or from approved plans, labelled "illustrative".
- **Voice AI:**
  - Disclose that the caller is an AI at the start of the call.
  - Record consent; honour DND/TRAI telemarketing rules (not researched).
  - Keep minimal PII in prompts, with DPDP-ready consent logs ahead of May 2027.
  - Prefer Indian-hosted models (e.g., Sarvam) for data-localisation comfort.
- **Document AI:**
  - Present findings as "red flags to verify" with page citations, not as a "clear title" verdict.
  - Require a lawyer to sign off before any "verified" badge.
- **Fairness:** filter conversational search against discriminatory queries (e.g., religion- or caste-based "society preference"). This is an India-specific analogue of US fair-housing rules. Not legally researched here.

### Gaps
- Could not fetch the RERA Act text (India Code returned 403). The researcher's background knowledge, unverified here, is that Section 12 makes promoters liable to compensate buyers for loss caused by false advertisement content, and Section 2(k) defines "carpet area". Verify before relying on it.
- No guidance found on whether ASCI or the CCPA (Consumer Protection Act misleading-advertisement rules) have issued AI-specific real-estate ad rules.
- Not found: TRAI/DND rules for AI outbound calls and any 2026 updates.
- Unclear whether a property-listing portal counts as a "significant social media intermediary" under the IT Rules. It probably does not, but all-intermediary duties still apply. Needs a legal opinion.

---

## Q4. Build vs buy, and an indicative tech stack

### Takeaway
- **Buy:** the model layer, using foundation-model APIs and Indic speech/OCR APIs. Also buy the voice-agent orchestration at first.
- **Build:** the parts that create trust and data moats — dimension-aware staging with structural guards, the grounded listing search agent, verification workflows and Delhi NCR data integrations.
- **Abstract everything.** Model line-ups and prices changed several times between Aug 2025 and Oct 2026.

### Cited Findings
- **Model line-up churn:** Gemini image models went from 2.5 Flash Image (Aug 2025), to Pro (Nov 2025), to Nano Banana 2 (Feb 2026), to 2 Lite (Jun 2026), to 2.1 (Oct 2026). Preview IDs were shut down on 25 Jun 2026 — [changelog](https://ai.google.dev/gemini-api/docs/changelog)
- **Indic stack in one vendor:** Sarvam provides LLM, STT, TTS, translation and document AI with INR plans (₹0–50,000/mo) — [Sarvam API pricing](https://www.sarvam.ai/api-pricing)
- **Bolna:** bundles STT, LLM and TTS with bring-your-own-keys, 25 concurrent calls on Pilot, and 10+ Indian languages — [Bolna pricing](https://www.bolna.ai/pricing)
- **ConvoZen:** a ready-made real-estate voice and WhatsApp agent with CRM integration and SIP transfer — [ConvoZen](https://convozen.ai/products/ai-voice-agent-for-real-estate)
- **Staging SaaS vs raw API:** SaaS costs $0.15–2.67 per image; raw Gemini API costs $0.017–0.134 per image — [Roomagen](https://roomagen.com/blog/best-ai-virtual-staging-software-2026-comparison); [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing)
- **Landeed Terra:** an India-wide property-records layer for title intelligence, available to developers, brokers and lenders — [Realty N More](https://realtynmore.com/landeed-launches-terra-to-transform-fragmented/)
- **Distribution via ChatGPT:** Zillow (US) and Housing.com (India) already ship ChatGPT apps — [Real Estate News](https://www.realestatenews.com/2025/10/22/zillows-chatgpt-integration-forces-industry-reckoning); [Realty N More](https://realtynmore.com/housing-com-launches-property-search-on-chatgpt/)
- **Neighbourhood data:** Google Maps Platform has pay-as-you-go APIs for AQI, solar, routes and places, with free caps of 1k–10k per month — [Google Maps pricing](https://developers.google.com/maps/billing-and-pricing/pricing)

### Inferences

**Build vs buy by component**

| Component | Recommendation | Rationale |
|---|---|---|
| Virtual staging | **Build a thin layer on raw APIs.** Gemini Nano Banana 2.1 or Lite as default, Pro for hero images, FLUX Kontext or Qwen-Image-Edit as fallback. Add your own structure guard, labelling and SKU catalogue. Buy a SaaS (REimagineHome/Collov API) only for a fast pilot | API is 3–10x cheaper per image than SaaS. Disclosure and structure-lock are core trust IP. Indian-style furniture catalogues are not supported out of the box |
| Floor plans and 3D | **Buy/partner.** CubiCasa-type phone scans or getfloorplan for plan → 3D. Splat capture via Polycam, Luma or Matterport-like tools (pricing not verified). Build only the viewer integration | Commodity, and capture hardware varies widely |
| Conversational search | **Build.** LLM function-calling over your own listings database (structured filters plus geo), with Hindi/Hinglish handled by the LLM. Publish a ChatGPT app for distribution | Grounding in proprietary inventory is the moat. Model cost is negligible |
| Voice / WhatsApp agents | **Buy to start** (Bolna, ConvoZen, or similar). **Build later** with your own orchestration on Sarvam/Gemini Live/OpenAI realtime once volume justifies it | Telephony, barge-in and latency engineering is hard. Vendors are proven in India |
| Document due diligence | **Hybrid.** Sarvam Vision / Gemini for OCR and extraction, plus Landeed-type records APIs, plus in-house Delhi/Haryana/UP checklists and a lawyer network | Legal liability needs human sign-off. State-record integrations are hard to build from scratch |
| Listing trust | **Build.** Image perceptual-hash and embedding dedupe, LLM consistency checks (price vs AVM band, area vs plan), geotagged and timestamped in-app video capture, owner KYC via a vendor (Signzy/IDfy/HyperVerge; not priced here) | Core to the trust brand |
| AVM / forecasts | **Build** on proprietary and registration data (see the data-sources researcher) | Differentiator; data-dependent |
| Developer tools (ads, video, brochures) | **Buy APIs** (Veo 3.1 Lite/Fast; Nano Banana for creatives). Wrap them in a self-serve developer console with RERA-number and disclaimer stamping | Low cost per asset; compliance wrapper is the value |
| Construction progress | **Partner** (DroneDeploy-type or Indian drone firms). Surface their verified progress on listing pages | Specialised computer vision; not core to v1 |
| Neighbourhood intel | **Build** on Google Maps APIs plus open data (CPCB AQI, DMRC/NCRTC metro, flood maps — not researched). Cache per sector or society | Cache to control per-call costs |

**Indicative 2026 stack**
- **Apps:** a React Native or Flutter app plus a Next.js web app, designed **WhatsApp-first** (WhatsApp Cloud API through a BSP). Utility messages cost about ₹0.115 each; avoid marketing-template spam at ₹0.86 each.
- **LLM layer:** a router across a cheap tier (gpt-6-luna, Gemini Flash-class or Sarvam 105B) for search and chat, and a reasoning tier for document analysis.
- **Prompt and eval tooling:** an observability and eval harness with a Hindi/Hinglish test set.
- **Image layer:** Gemini Nano Banana 2.1 (batch tier for bulk), with fallbacks. Pipeline: SynthID plus C2PA stamping, then a structure-diff check, then human QA sampling.
- **Voice:** Bolna or ConvoZen at first; later your own stack on Sarvam STT/TTS plus Gemini Live or gpt-realtime-mini.
- **Documents:** Sarvam Vision (₹0.5–1 per page), then structured extraction schemas (sale deed, conveyance deed, RERA certificate, OC/CC, encumbrance certificate, allotment letter, builder-buyer agreement), then rules plus LLM red-flag checks, then lawyer review.
- **Data:** Postgres with PostGIS plus a vector index for listing and document embeddings. Event analytics to A/B test each AI feature (staged vs unstaged CTR, lead-to-visit rate).
- **Compliance:** a DPDP consent ledger (target readiness before 13 May 2027), an SGI-label service, and a 3-hour takedown workflow.

**Priority order for an MVP** (my judgement)
1. Grounded Hinglish search and advisor (WhatsApp plus app)
2. Labelled, dimension-aware virtual staging with an "original" toggle
3. A seller "video walk-through to listing" flow (auto photos, description, enhancement, staging)
4. A voice/WhatsApp lead-qualification agent for developer projects
5. A document red-flag report, sold as a paid add-on with lawyer review
6. Neighbourhood cards (AQI, commute, sun orientation)
7. Splat tours and AVM ranges later, once data accumulates

### Gaps
- No pricing found for Indian KYC and verification vendors (Signzy, IDfy, HyperVerge, Karza/Perfios). No public Landeed/Terra API pricing either.
- No public API or affiliate terms verified for Pepperfry, IKEA India or Livspace (needed for shoppable staging).
- Krutrim's voice/LLM API status and pricing were not researched.
- Not found: open-data availability and quality for Delhi NCR flood risk, noise maps, and CPCB AQI APIs.
