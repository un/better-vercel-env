# Final Release Checklist

Date: 2026-02-14
Plan: `26021401-vercel-env-manager-opentui-rebuild`

## Verification Pipeline

- `npm run verify`: PASS
  - Lint: PASS
  - Typecheck: PASS
  - Tests: PASS (`21` files, `54` tests)
- `npm run build`: PASS
  - OpenTUI bundle built with Bun target and emitted assets under `dist/tui`.

## Manual Parity Walkthrough (`wiggy`)

Scope/project located and used:
- Scope: `user:mcadam`
- Project: `wiggy` (`prj_MzIvQETOnUo9cP1RRGeqSk0OoA34`)

Executed smoke sequence:
1. Loaded snapshot and confirmed initial no-op plan (`finalNoOpCount=0`).
2. Added temp key in preview only and applied successfully.
3. Verified partial-failure reporting with mixed done/failed results.
4. Retried failed subset only.
5. Cleaned up all temporary smoke keys and revalidated no residual drift.

Latest run summary (scripted):
- Add phase: `done`
- Partial phase: `done + failed` (expected)
- Retry phase: failed subset retried only
- Cleanup operations: `2`
- Final no-op check after cleanup: `0`

## Risks / Caveats

- Interactive keypress navigation was smoke-checked via startup path and non-interactive automation, but not exhaustively replayed with full human-driven terminal interaction in this run.
- Build assets under `dist/tui` are generated artifacts and should not be committed unless release packaging strategy changes.
- Custom environment writes remain intentionally unsupported and are reported as skipped.
