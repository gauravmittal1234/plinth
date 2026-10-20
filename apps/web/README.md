# apps/web: Plinth public site and buyer web (Next.js App Router)

Next.js 16 + React 19 + Tailwind CSS 4, fed only by `@plinth/tokens`.

```bash
PLINTH_DATA=fixtures npm run dev -w @plinth/web   # http://localhost:3000, no accounts, no network
npm run -w @plinth/web lint        # ESLint (incl. plinth/no-hex-colour) + copy lint
npm run -w @plinth/web typecheck   # next typegen + tsc
npm run -w @plinth/web test        # Vitest (jsdom): shell, manifest, data signatures, API routes
npm run -w @plinth/web build       # fixture build
npm run -w @plinth/web e2e:smoke   # Playwright @smoke on the build: every route + axe
npm run -w @plinth/web lhci        # Lighthouse CI budgets on the build
```

Playwright needs a browser once: `npx playwright install chromium`.

## Layout

| Path | What | Owner |
|---|---|---|
| `app/layout.tsx`, `app/globals.css` | Root: fonts, Day default + Night toggle (`data-theme`), tokens CSS | T05 |
| `app/(public\|account\|auth\|workspace)/layout.tsx` | Route groups; each wraps its pages in the site shell | T05 |
| `app/**/page.tsx` | One stub per WORK_BREAKDOWN §2.1 route, rendering `<Placeholder artboard="…"/>` | T05 stubs; the task in §2.1 replaces each |
| `src/shell/` | Header, footer slab, theme toggle, fonts, the Placeholder and `screens.ts` (§2.1 as data) | T05 |
| `src/data/` | One typed function per M1–M2 `api.*` function (API_CONTRACTS §3.1–§3.2); signatures only | T05 stubs, T16 implements |
| `src/server/` | Server helpers for T05's non-page routes | T05 |
| `app/api/health`, `app/.well-known/assetlinks.json` | Synthetic check; Android App Links | T05 |
| `test/` (Vitest), `e2e/` (Playwright) | Unit and route smoke tests | T05 + each page's task |

`src/shell/screens.ts` is the single list of web screens: the Placeholder, the smoke test and the manifest test all read it. Replacing a stub keeps the smoke row green as long as the page's `<h1>` still names the screen, or the task updates its row.

## Rules

- Owned by T05 (skeleton). Route and feature folders pass to the tasks in WORK_BREAKDOWN §2.1 (see `/OWNERSHIP.md`); `src/shell/**` and the layouts stay T05's.
- Colours only from `@plinth/tokens` (Tailwind classes such as `bg-panel`, `text-ink`, or `var(--pl-color-…)`). ESLint's `plinth/no-hex-colour` and `test/no-hex-css.test.ts` fail on hex.
- Until T01 merges, `globals.css` parks the `@plinth/tokens/theme.css` import as a comment and the token utilities resolve to nothing (the M0 gate wires it).
- Next.js 16 differs from older versions: read `AGENTS.md` in this folder and `node_modules/next/dist/docs/`.
- Public client config is limited to `NEXT_PUBLIC_*` names in `/.env.example`. No secret key ever reaches this app.
