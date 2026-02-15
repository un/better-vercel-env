# Manual Smoke Checklist

Target project: `wiggy`

## Preconditions
- `vercel` CLI is installed and authenticated (`vercel whoami` succeeds).
- You have write access to `wiggy` in the selected scope.
- Run from a clean shell with no production deployment automation running.

## 1) Auth and picker flow
- Start app: `npm run tui` (or `npx vercel-better-env`).
- Confirm auth screen reports authenticated status.
- Move through scope and project picker with keyboard only.
- Select `wiggy` and enter editor.

Success criteria:
- Auth status is correct.
- Scope/project selection works with hints.
- Snapshot loads without crash.

## 2) Read flow and topology sanity
- In editor, locate an existing key with assignments in at least two environments.
- Verify change log starts as empty (`No pending operations.`).
- Verify matrix highlights show no changes before edits.

Success criteria:
- No phantom operations on load.
- Rows/assignments appear consistent with Vercel dashboard.

## 3) Safe write cycle (add + apply)
- Choose a disposable key name: `VBE_SMOKE_TMP_KEY`.
- Add/edit value and assign to `preview` only.
- Press apply (`p`), type exact confirmation phrase, and submit.
- In report view, confirm grouped statuses are shown.

Verify externally:
- Run `vercel env ls --project wiggy --scope <scope>` and verify key appears only in preview.

Success criteria:
- Apply succeeds with per-item status.
- Snapshot refresh returns to clean pending state after success.

## 4) Retry flow (forced partial failure)
- Make a multi-operation draft change (for example value update + assignment change).
- Intentionally induce one failure (for example remove local permission/scope mismatch in a separate shell or target an unsupported op).
- Apply and confirm failures are grouped and visible.
- Retry and confirm only failed operations are retried by default.

Success criteria:
- Failed operations remain visible.
- Retry path does not blindly replay all previously successful operations.

## 5) Cleanup cycle (remove + verify)
- Remove `VBE_SMOKE_TMP_KEY` assignments and value.
- Apply again through confirm gate.
- Verify with `vercel env ls` that key is removed from all environments.

Success criteria:
- Cleanup apply succeeds.
- Project returns to pre-smoke env state.

## 6) Final checks
- Quit app with keyboard shortcut.
- Re-open app and reload `wiggy`; confirm no pending operations.

Success criteria:
- Terminal exits cleanly.
- No residual drift after full cycle.
