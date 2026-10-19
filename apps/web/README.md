# apps/web: Plinth public site and buyer web (Next.js App Router)

Next.js 16 + React 19 + Tailwind CSS 4, fed only by `@plinth/tokens`.

```bash
PLINTH_DATA=fixtures npm run dev -w @plinth/web   # http://localhost:3000, no accounts, no network
npm run -w @plinth/web lint
npm run -w @plinth/web typecheck
npm run -w @plinth/web test
npm run -w @plinth/web build
```

- Owned by T05 (skeleton). Route and feature folders pass to the tasks in WORK_BREAKDOWN §2.1 (see `/OWNERSHIP.md`).
- Next.js 16 differs from older versions: read `AGENTS.md` in this folder and `node_modules/next/dist/docs/`.
- Public client config is limited to `NEXT_PUBLIC_*` names in `/.env.example`. No secret key ever reaches this app.
