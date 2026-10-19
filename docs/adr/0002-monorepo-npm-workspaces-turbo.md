# 0002: Monorepo with npm workspaces and Turborepo

- Status: accepted
- Date: 19 Oct 2026
- Deciders: Head of Engineering (T00), per BUILD_PLAN §4–§5

## Context

Web, admin, the shared packages, the Flutter app, the database and the pipelines must stay in step on one contract (BUILD_PLAN §1 rule 2), and many agents work in parallel with exclusive file ownership (rule 6). The founder's Mac has Node 20 and npm, no pnpm and no Docker.

## Decision

- One repository. JS workspaces are `apps/web`, `apps/admin` and `packages/*`, managed by **npm 10 workspaces** with one root `package-lock.json`. **Turborepo 2** runs `build`, `lint`, `typecheck`, `test` and `gen` across them.
- Flutter (`apps/mobile`, `packages/*/dart`), Python (`pipelines/`, `packages/contracts/python`) and Supabase (`supabase/`) sit beside the workspaces with their own toolchains. `scripts/ci/verify.mjs` drives all of them and skips a tool that is missing locally.
- Dependencies are **frozen after T00**: root and workspace dependencies, `package-lock.json`, `turbo.json`, pubspec dependency lines and `pubspec.lock`, `pyproject.toml` and `uv.lock` change only through the lead's integrator PR.
- CI is one GitHub Actions workflow per area, path-filtered, with `ci-guard` required on every PR.

## Consequences

- Parallel tasks never fight over lockfiles; a task that needs a package writes a Handoff note.
- npm hoists one copy of shared tools (TypeScript, Vitest, ESLint) to the root.
- Turborepo may share its local cache across git worktrees; that is safe because tasks are hashed by inputs.
- Moving to pnpm later is possible but not planned; it would need a new lockfile and an integrator PR.
