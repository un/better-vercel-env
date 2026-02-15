# Learnings Log - 26021401 vercel-env-manager-opentui-rebuild

Use this file as a prepend-only log.

## 2026-02-14 20:35 - Step 30 - Defend reserved-key policy at editor ingress and key edits
- Context: Ensuring reserved runtime env keys stay hidden and non-applicable in TUI.
- Learning: Filtering reserved keys only in apply path is not enough; snapshot ingest and key-rename interactions should also enforce the same policy.
- Impact: Keep reserved-key checks in snapshot normalization boundary, rename validation, and apply action building.

## 2026-02-14 20:34 - Step 29 - Retry set should default to failed operation IDs
- Context: Preserving draft context after partial apply failures.
- Learning: Keep a failed-operation ID set and retry that subset by default so already successful operations are not re-submitted unnecessarily.
- Impact: Maintain `failedOperationIds` alongside pending operations and intersect on subsequent draft recomputations.

## 2026-02-14 20:33 - Step 28 - Refresh only on fully successful apply runs
- Context: Auto-reloading snapshot and resetting draft after apply.
- Learning: Snapshot refresh/reset should run only when no apply results are failed; otherwise retain current draft for correction and retry.
- Impact: Gate post-apply baseline reset on `failed` status absence.

## 2026-02-14 20:32 - Step 27 - Keep report grouping formatter pure and testable
- Context: Rendering grouped done/failed/skipped apply results in TUI report view.
- Learning: Extracting report grouping/line formatting to a pure helper keeps status semantics testable without OpenTUI runtime coupling.
- Impact: Add formatter tests for grouped statuses and failure reason visibility whenever report shape changes.

## 2026-02-14 20:32 - Step 26 - Scope-aware apply lock key
- Context: Enforcing single in-flight apply for a project/scope context.
- Learning: Apply lock must key on both `projectId` and `scopeId`; project-only locks can block unrelated scope operations and scope-only locks can allow conflicting project writes.
- Impact: Keep lock acquisition at apply orchestration entry with project+scope identity.

## 2026-02-14 20:31 - Step 25 - Hash revalidation must happen before action build execution
- Context: Adding baseline conflict protection in the TUI apply path.
- Learning: Reloading snapshot hash at apply time and comparing to the loaded baseline must run before any CLI write action executes.
- Impact: Keep conflict checks as the first gate in apply orchestration so drifted drafts never produce writes.

## 2026-02-14 20:30 - Step 24 - Execute apply inside workspace lock boundary
- Context: Wiring confirm flow to build CLI actions and execute `vercel env` mutations.
- Learning: The same workspace lock boundary should wrap link + apply execution to keep deterministic command ordering and avoid concurrent workspace state races.
- Impact: Keep all CLI write phases in one `withWorkspaceLock` section for future apply retries/refresh flows.

## 2026-02-14 20:28 - Step 23 - Reuse shared confirm phrase source
- Context: Implementing confirm screen typing gate before apply actions.
- Learning: Use the shared `isApplyConfirmPhraseValid` helper and phrase constant to avoid drift in exact-phrase semantics between web and TUI flows.
- Impact: Keep confirm-gate source-of-truth centralized and call it directly from TUI apply preparation.

## 2026-02-14 20:26 - Step 22 - Undo must normalize cursor indices
- Context: Wiring row-level undo to restore baseline rows or remove draft-only rows.
- Learning: After undo removes or reshapes a row, selection indices (row/value/environment) must be clamped immediately to avoid stale cursor references.
- Impact: Always normalize editor indices after any undo mutation before re-rendering.

## 2026-02-14 20:25 - Step 21 - Keep testable UI formatters decoupled from OpenTUI
- Context: Adding change-log formatting tests for latest-first ordering and empty state copy.
- Learning: Helper functions imported by Vitest should live in modules that do not import `@opentui/core`; otherwise Node test runtime can fail on Bun-specific dependencies.
- Impact: Keep screen-rendering code and pure text-formatting helpers split for stable unit testing.

## 2026-02-14 20:23 - Step 20 - Runtime import paths in TUI helper tests
- Context: Adding live planner wrapper tests under `src/tui/editor`.
- Learning: Runtime imports from new test-executed helpers should use relative module paths; alias-based runtime imports in this area can fail in Vitest even when type-only alias imports pass.
- Impact: Prefer relative runtime imports for new TUI helper modules and reserve alias imports for app/runtime entrypoints.

## 2026-02-14 20:21 - Step 19 - Terminal-safe change highlighting
- Context: Adding changed-row and changed-cell cues in the matrix without color dependencies.
- Learning: Symbol-based indicators (`!` for changed, `*` for active selection) are reliable across terminals and keep diffs readable even without ANSI styling.
- Impact: Keep baseline-vs-draft highlighting text-based until palette/theming is formalized.

## 2026-02-14 20:20 - Step 18 - Assignment edit capability gates
- Context: Adding terminal controls for set/unset environment assignments.
- Learning: Assignment edits must share the same lock rules as web parity: block when row has encrypted values, block branch-scoped rows when branch writes are unsupported, and block custom environments when custom writes are unsupported.
- Impact: Reuse one permission check path for assignment actions and future cell-level edit UX.

## 2026-02-14 20:18 - Step 17 - Value ID allocation after deletions
- Context: Implementing add/remove value pool editing in the terminal editor.
- Learning: Generating new value IDs from `values.length + 1` can create duplicate IDs after deleting non-tail values; allocation must use max existing numeric suffix + 1.
- Impact: Keep value ID generation collision-safe before assignment editing and planner wiring steps.

## 2026-02-14 19:52 - Step 4 - Entrypoint smoke output behavior
- Context: Running a one-shot OpenTUI initialization smoke test.
- Learning: Even short-lived renderer startup emits terminal control sequences; smoke checks should use a dedicated env flag and can redirect output in automation.
- Impact: Keep `VBE_TUI_SMOKE=1` path and avoid noisy terminal assertions in verify.

## 2026-02-14 19:50 - Step 3 - TypeScript compatibility for Bun-only deps
- Context: Verifying project typecheck after adding `@opentui/core`.
- Learning: OpenTUI dependency declarations reference `bun:ffi`; Node-oriented `tsc --noEmit` needs a local module shim to keep strict checks passing without switching global type roots.
- Impact: Keep `src/types/bun-ffi.d.ts` in place until the toolchain is fully Bun-native.

## 2026-02-14 19:45 - Step 2 - OpenTUI build command details
- Context: Validating OpenTUI core spike compilation with Bun.
- Learning: `bun build` must use `--target bun` for OpenTUI (`bun:ffi` imports), and `--outdir` instead of single `--outfile` due emitted assets.
- Impact: Use Bun-targeted build commands and outdir outputs for all OpenTUI compile checks.

## Operating protocol for sub-agents
- Before starting any step, read this file completely.
- After finishing a step, prepend any new learnings at the top using the template below.
- Only add a learning when it changes how future steps should be executed.
- Keep entries short, concrete, and actionable.

## Entry template
```
## YYYY-MM-DD HH:MM - Step <serial> - <short title>
- Context: <what was being done>
- Learning: <what was discovered>
- Impact: <what future steps should do differently>
```
