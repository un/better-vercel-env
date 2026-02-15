# Parity Inventory

## Core user-facing flow
- CLI launch starts local runtime and exposes onboarding flow.
- Auth screen checks local Vercel CLI session (`vercel whoami`).
- Scope/project picker loads personal + team scopes and projects.
- Editor loads env snapshot and renders key-first matrix.
- Change log updates live and supports per-row undo.
- Apply is gated by exact confirmation phrase.
- Apply report shows done/failed/skipped per operation.

## Safety invariants to preserve
- Runtime env operations use Vercel CLI, not SDK.
- Baseline hash must match before apply; mismatch blocks writes.
- Apply lock blocks concurrent apply for same project/scope.
- Sensitive output is redacted in errors/log paths.
- Reserved runtime keys are hidden and ignored:
  - Prefix: `VERCEL_`
  - Exact: `VERCEL`, `NX_DAEMON`, `TURBO_CACHE`, `TURBO_DOWNLOAD_LOCAL_ENABLED`, `TURBO_REMOTE_ONLY`, `TURBO_RUN_SUMMARY`
- Confirm gate phrase remains exact: `i confirm I am not an agent`.

## Data model parity requirements
- Snapshot combines `vercel env pull` values with `vercel env ls` topology rows.
- Target-group topology is preserved for same key (for example split rows like dev vs prod+preview).
- Planner emits minimal deterministic operations.
- Initial load must produce no pending changes for unchanged state.

## Current known quirks and regressions to avoid
- Sending `\n` in `stdin` for `vercel env add` creates trailing-newline value drift.
- Collapsing topology by key/value alone causes Vercel/app mismatch for grouped targets.
- Non-layered global CSS reset (`* { margin/padding:0 }`) can break utility spacing.
