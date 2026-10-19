# apps/admin: Plinth operations console (Next.js App Router)

Review queues, publishing gates, notices, disputes, the WhatsApp inbox and `/ops`. Separate Vercel project and domain, behind email OTP + TOTP (`aal2`).

```bash
npm run dev -w @plinth/admin    # http://localhost:3001
npm run -w @plinth/admin lint
npm run -w @plinth/admin typecheck
npm run -w @plinth/admin test
npm run -w @plinth/admin build
```

Owned by T54 (see `/OWNERSHIP.md`). Next.js 16 differs from older versions: read `AGENTS.md` in this folder first.
