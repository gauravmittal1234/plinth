# Engineering decisions log

Decided by the acting Head of Engineering / PM on 19 Oct 2026, while the founder was away. The founder can overturn any of them.

| # | Decision | Reason |
|---|---|---|
| E-1 | Design artboards are copied into the repo (`product/design/artboards/`) and committed. The canvas artifact stays the visual reference | The scratchpad is temporary |
| E-2 | The R1 relay is a WhatsApp text relay. A paid call-masking vendor is decided at M5 | No paid vendor before launch data |
| E-3 | Consent refs: display `C-MMDD-NN`; store the year and a sequence; widen the sequence past 99 in display | Keeps the screens, avoids collisions |
| E-4 | Fixture dates follow DESIGN.md §5b "Engineering fixture decisions": Kestrel Nov 2023 → Nov 2028, Laurel Nov 2020, Heron Point 28 Apr 2026 | Removes impossible timelines |
| E-5 | Afford the wait rounds the all-in to the nearest lakh before calculating | Reproduces the published figures |
| E-6 | CI runs on Node 22 (local Node 20 works). Database tests run on GitHub runners, which have Docker | No Docker locally |
| E-7 | Maps use MapLibre with open tiles, not Google Maps | No Google billing or account |
| E-8 | Gemini free tier, fictional data only, until the founder's paid key and DPA are in place | No real personal data goes to the AI before agreements exist |
| E-9 | Keep GitHub Actions lean (path filters, cancel superseded runs) to fit the free private-repo minutes | Cost |
| E-10 | `plinth.in` is a placeholder domain in copy and config (`PUBLIC_BASE_URL`) until the founder confirms it | Not yet registered |
