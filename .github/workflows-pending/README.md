# Workflows waiting for a token with the `workflow` scope

These are T00's GitHub Actions workflows, final and reviewed in the T00 PR. They are parked here because GitHub refuses any push that creates or changes a file under `.github/workflows/` unless the pushing token has the **`workflow`** scope, and the agents' `gh` token has only `repo`, `read:org` and `gist`.

| File | Goes to |
|---|---|
| `ci-guard.yml` | `.github/workflows/ci-guard.yml` |
| `nightly.yml` | `.github/workflows/nightly.yml` |
| `deploy-dev.yml` | `.github/workflows/deploy-dev.yml` (manual only, needs founder secrets) |

To activate them (the founder, once, in their own terminal):

```bash
gh auth refresh -h github.com -s workflow     # adds the scope; opens a browser to approve
git mv .github/workflows-pending/*.yml .github/workflows/
git rm .github/workflows-pending/README.md
git commit -m "Activate T00 workflows" && git push
```

Or create each file in the GitHub web UI (Add file → Create new file → `.github/workflows/<name>.yml`, paste the content).

Every wave-1 task that owns a workflow (`ci-tokens`, `ci-contracts`, `ci-db`, `ci-web`, `ci-mobile`) hits the same wall until the scope is added.
