# Vercel Better Env - Local Matrix Editor Plan

## Metadata
- Date: 2026-02-13
- Plan ID: 26021301
- Plan slug: vercel-env-manager-local-ui
- Product working name: Vercel Better Env
- Primary objective: Make Vercel project environment variables manageable as a single key-first matrix across multiple environments.

## Problem Statement
Vercel's current environment variable management UI is record-oriented rather than key-oriented. In practice:
- The dashboard displays one long list of env var records, including repeated keys.
- It is hard to reason about one key across many environments.
- Assigning different values per environment requires creating multiple records manually.
- Repeated keys are not always visually grouped, which creates operational mistakes and review friction.

The proposed tool fixes this by presenting one row per key and allowing explicit environment-to-value assignment from a value pool.

## Product Vision
Create a local-first web app launched via `npx` that gives users a matrix editor for Vercel env vars:
- Run once from terminal, opens local web app on `127.0.0.1:6969`.
- User pastes Vercel token (session-only).
- User selects org/team, then project.
- User edits env vars in a deduplicated table: one key row, multiple environments.
- User reviews a generated "change order list" (explicit operations).
- User can undo individual changes before apply.
- User confirms with explicit phrase and applies changes.
- Tool reports success/failure/skipped actions.

## Confirmed Product Decisions
- Auth mode for v1: user-generated Vercel token, session-only (not persisted).
- Token help link shown in onboarding: `https://vercel.com/account/settings/tokens`.
- Frontend stack: Next.js + Tailwind CSS + shadcn/ui + Vercel fonts (`geist`).
- Runtime posture: all operations local on the user's machine; no hosted backend.

## Goals
1. Make multi-environment env management understandable at a glance.
2. Normalize repeated Vercel rows into a single key-centric editing model.
3. Generate minimal, deterministic Vercel updates (no noisy rewrites).
4. Give users safe control via change list, undo, and explicit confirmation.
5. Ship as easy-install CLI entrypoint (`npm` install and `npx` run).

## Non-Goals (v1)
- Persisting credentials between runs.
- Team-wide collaborative editing or realtime multi-user sessions.
- Managing branch-specific preview variables (`gitBranch`) beyond read-only visibility.
- Automatic secret rotation workflows.
- Cloud-hosted service mode.

## Users and Primary Jobs
- Solo developer managing dev/preview/prod keys.
- Team lead maintaining consistent config across multiple projects.
- Platform engineer reducing config drift and accidental env mismatches.

Primary jobs to be done:
- "Show me one key across all environments."
- "Let me assign environments to shared or distinct values quickly."
- "Tell me exactly what will change before anything is written."

## High-Level UX Flow
1. User runs CLI command (via `npx`).
2. Local app starts on port `6969`; terminal prints local URL and token-generation URL.
3. User opens app, pastes token, validates session.
4. User sees org/team list and project list.
5. User selects a project.
6. App renders environment matrix editor.
7. User edits key rows, value pools, and environment mappings.
8. Change order list updates in real time.
9. User optionally undoes specific changes.
10. User clicks confirm, types exact phrase: `i confirm I am not an agent`.
11. App applies plan, shows progress and final report.

## Information Architecture
- `/` - onboarding / token entry.
- `/projects` - org/team + project browser.
- `/projects/[projectId]/env` - matrix editor + change order panel.
- modal/dialog components for confirm/apply/report.

## Technical Architecture

### Runtime Model
- Next.js app runs locally (Node runtime).
- Browser UI calls Next route handlers.
- Route handlers call Vercel APIs using `@vercel/sdk`.
- Token stays session-only in memory or short-lived HTTP-only session state.

### Recommended Project Layout (initial)
- `app/` - App Router pages and layouts.
- `app/api/` - route handlers for auth/session, orgs/projects, env fetch, plan/apply.
- `components/` - matrix UI, change list, dialogs.
- `lib/vercel/` - Vercel client wrappers.
- `lib/env-model/` - normalization, diff planner, action execution.
- `lib/session/` - session-only token handling.
- `bin/` - CLI launcher script.
- `styles/` - globals and theme tokens.

## Domain Model

### Raw Vercel Record (source of truth)
Each Vercel env row includes (not exhaustive):
- `id`
- `key`
- `value`
- `type`
- `target[]` (`production`, `preview`, `development`)
- `customEnvironmentIds[]`
- `comment`
- `gitBranch`

### UI-Normalized Model
One row per key:
- `key`
- `values[]` (pool entries: `valueId`, `content`, metadata)
- `assignments[environmentId] => valueId | null`
- derived display labels (`Value 1`, `Value 2`, ...)

### Environment Identity Model
Use canonical IDs for columns:
- built-ins: `production`, `preview`, `development`
- custom: `custom:<customEnvironmentId>`

### Change Order Item
- `id`
- `kind` (`create_env`, `update_env`, `delete_env`, `rename_key`, `retarget`)
- `summary`
- `before` snapshot
- `after` snapshot
- `undoToken` or invertible patch metadata

## Normalization Strategy (Vercel -> Matrix)
1. Fetch all env rows for project.
2. Group rows by `key`.
3. Inside each key group, cluster rows by value identity (value + type + comment + gitBranch constraints).
4. Build value pool entries from clusters.
5. For each environment column, map to selected value pool entry or `null`.
6. Preserve references to original row IDs for diffing and minimal updates.

## Editing Model
- User can add/remove value pool entries per key.
- User can assign each environment to one value entry or `null`.
- User can edit key name and value contents.
- User can stage new key rows.
- UI always recomputes change order from baseline + draft state.

## Diff Planner (Minimal-Noise Write Strategy)
Planner compares `baseline` vs `draft` and emits minimal operations:
1. Reuse existing rows where semantic match is possible.
2. Update rows only when key/value/targets truly changed.
3. Create rows only for newly required value-target combinations.
4. Delete rows only when no target references remain.
5. Skip everything unchanged.

Guardrails:
- Stable operation ordering for deterministic execution.
- Idempotency where feasible.
- No broad "rewrite all env vars" behavior.

## Apply Executor

### Pre-Apply
- Validate confirmation phrase exactly: `i confirm I am not an agent`.
- Revalidate token/session.
- Optional lightweight refresh check to detect baseline drift.

### Execution Order
1. Creates
2. Updates
3. Deletes

Rationale:
- Prioritize ensuring required records exist before removing old ones.
- Reduce risk of temporary missing values during transition.

### Result Report
For each operation:
- status: `done` | `failed` | `skipped`
- API response details (sanitized)
- human-readable message and retry hints

## Undo Behavior
- Change list item has explicit Undo action.
- Undo mutates local draft state back to prior snapshot.
- Undo removes corresponding change entry.
- Undo is local pre-apply only (no post-apply rollback in v1).

## Token Handling and Security
- Session-only token (never written to disk).
- Show token generation link in onboarding.
- Keep token server-side only (route handlers / session state).
- Redact token from logs, errors, and UI messages.
- Use localhost binding by default (`127.0.0.1`), configurable port fallback if occupied.

## CLI and Packaging Plan
- Provide executable bin for package.
- `npx <package-name>` starts Next server on `6969`.
- CLI prints:
  - app URL
  - token generation URL
  - brief next steps
- Optional: auto-open browser on supported platforms.

## UI Design Direction
- Use shadcn components for consistency and speed.
- Typography via Vercel font stack (`geist`).
- Table-focused layout with sticky header and horizontal scroll support.
- Change panel pinned (desktop) and drawer mode (mobile).
- Clear color semantics for add/update/delete/unchanged states.

## Accessibility and Usability Requirements
- Keyboard navigation for all table controls.
- Focus-visible states for interactive controls.
- Confirmation dialog fully keyboard operable.
- Clear error messages with actionable guidance.
- Responsive behavior for small screens.

## Edge Cases and Constraints
- Same key with many distinct values and many custom environments.
- Variables with `system=true` should be read-only or excluded.
- Variables tied to `gitBranch` may be read-only in v1 to avoid accidental branch drift.
- Large projects: optimize render performance and diff computation.
- Partial API failures: keep detailed per-item status and safe retry path.

## API Integration Notes
- Use `@vercel/sdk` wrappers where available.
- Required API capability buckets:
  - list teams/orgs
  - list projects per org/team
  - list project env vars
  - create/update/delete project env vars
  - list project custom environments (if SDK gaps, call REST directly)

## Testing Strategy

### Unit Tests
- normalization logic
- environment assignment model
- diff planner minimality guarantees
- undo inversion behavior

### Integration Tests
- mocked Vercel API interactions for create/update/delete flows
- apply executor ordering and partial failure handling

### UI Tests
- key row editing
- value pool add/remove
- environment dropdown mapping
- change order rendering and undo
- confirm phrase gating

## Observability (Local)
- Structured server logs with redaction.
- In-app operation report for apply phase.
- Optional debug panel behind a dev flag.

## Milestones
1. Scaffold app and design system foundations.
2. Implement token onboarding and local session state.
3. Implement org/project browser.
4. Implement env matrix rendering from live Vercel data.
5. Implement matrix editing + value pools.
6. Implement change order and undo.
7. Implement diff planner and apply executor.
8. Add confirmation gate and final report UX.
9. Package CLI for `npx` consumption.
10. Add tests and hardening pass.

## Acceptance Criteria (v1)
- User can run app locally via `npx` and open browser.
- User can paste token and load orgs/projects.
- User can edit env mappings in matrix format.
- User sees precise change order list before apply.
- User can undo any pending change item.
- Apply runs only after confirmation phrase.
- Only changed env records are sent to Vercel.
- Final report clearly marks done/failed/skipped operations.

## Risks and Mitigations
- API shape drift: isolate Vercel access behind adapter layer.
- Complex diff bugs: exhaustive unit tests + fixture-based scenarios.
- Large dataset performance: memoization, virtualization if needed.
- User trust/safety: explicit change previews + hard confirmation gate.

## Future Extensions (post-v1)
- Optional secure persistence via OS keychain.
- Branch-specific env variable editing.
- Import/export snapshots.
- Multi-project compare mode.
- Template-based key sets and drift detection.

## Summary
This plan delivers a local, safer, key-first environment management workflow for Vercel projects. It replaces row-level dashboard friction with a matrix editor, preserves operational control through explicit change planning and undo, and minimizes API noise with a deterministic diff-and-apply engine.
