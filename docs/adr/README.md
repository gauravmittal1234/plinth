# Architecture decision records

Short records of decisions that are expensive to reverse. One file per decision: `NNNN-short-title.md`, numbered in order, using [0000-template.md](0000-template.md). Owner: the lead (T00 created this folder).

| ADR | Decision | Where |
|---|---|---|
| ADR-001 | The mobile app is Flutter, not Expo; web stays Next.js; one Supabase backend + Python pipelines; one contract and one token file | `product/inputs/platform_architecture.md` §ADR-001 (overrides its §2.1 and §9 for mobile) |
| [0002](0002-monorepo-npm-workspaces-turbo.md) | Monorepo with npm workspaces + Turborepo, one lockfile frozen after T00 | This folder |

Smaller calls live in [docs/engineering/DECISIONS.md](../engineering/DECISIONS.md) (E-1 …) and BUILD_PLAN §16 (D-1 …).
