# Vercel Better Env - OpenTUI Rebuild Plan

## Metadata
- Date: 2026-02-14
- Plan ID: 26021401
- Plan slug: vercel-env-manager-opentui-rebuild
- Product working name: Better Vercel Env (TUI)
- Primary objective: Rebuild the current app as a terminal-native UI using OpenTUI instead of Next.js.

## Problem Statement
The current product is web-first (Next.js pages + API routes), but the desired experience is terminal-native while keeping the same core capabilities:
- CLI-managed Vercel auth
- Scope and project selection
- Key-first env matrix editing
- Deterministic planning + safe apply
- Per-operation reporting

We need a full UI/runtime pivot from browser/HTTP boundaries to an in-process TUI event loop.

## Target Outcome
Ship a single terminal app (OpenTUI) that runs locally, reads/writes Vercel env vars via Vercel CLI, and preserves safety semantics from the current implementation.

## Confirmed Constraints
- UI stack must use OpenTUI (`https://opentui.com/`).
- Runtime integrations remain Vercel CLI-based (no `@vercel/sdk`).
- Never log plaintext secrets.
- Preserve confirm gate + baseline conflict checks + per-item apply status.
- Reserved/runtime env keys must stay hidden and ignored.

## Goals
1. Replace all Next.js page/route UX with OpenTUI screens and keyboard flows.
2. Keep existing domain model behavior (normalize, planner, apply semantics) where correct.
3. Match Vercel topology representation (including split target groups for same key).
4. Keep strict TypeScript and automated verification quality gates.
5. Provide a clean CLI package experience for local execution.

## Non-Goals
- Running both web UI and TUI permanently in parallel.
- Introducing remote services or hosted backend.
- Adding new product features unrelated to parity (templates, multi-project batch editing, etc.).

## Proposed Architecture (OpenTUI)

### Runtime
- Single process terminal app with OpenTUI renderer.
- No HTTP server or Next route handlers.
- Data calls happen in-process via existing `src/lib/vercel-cli/*` modules.

### State
- Central app state store (screen state + data state + editor draft state).
- Existing env-model modules reused with minimal adaptation.
- Explicit finite screen states (auth, scope/project picker, editor, confirm/apply, report).

### UI Composition
- OpenTUI layout primitives (`Box`, `Text`, `Input`, `Select`, `ScrollBox`).
- Keyboard-first navigation with focus management and command hints.
- Split-pane editor layout on wide terminals, stacked layout on narrow terminals.

### Integration Layer
- Reuse and harden current CLI adapters:
  - auth status
  - scopes/projects/env topology
  - env pull + parse + reserved-key filter
  - apply command execution with redaction

## UX Flow (Terminal)
1. Start app (`better-vercel-env` command).
2. Auth status screen (`vercel whoami` health + remediation hints).
3. Scope picker and project picker.
4. Snapshot load into matrix editor.
5. Edit keys/values/assignments.
6. Live change log (latest first).
7. Confirm phrase gate.
8. Apply execution + grouped report.
9. Snapshot refresh and continue editing.

## Workstreams

### A) Platform Pivot
- Remove Next.js runtime dependencies and page/route assumptions.
- Add OpenTUI runtime and CLI entrypoint changes.

### B) TUI UI System
- Screen framework, focus management, keyboard shortcuts, status banners.
- Matrix table rendering and editing interactions.

### C) Domain + Data Parity
- Preserve planner minimality and topology parity.
- Keep reserved-key filtering and hidden-key policy.
- Keep apply lock, baseline hash validation, deterministic ordering.

### D) Quality + Packaging
- Unit/integration tests for parser/planner/executor behavior.
- Smoke scripts for safe add/remove cycles on test project.
- Updated docs for terminal usage and troubleshooting.

## Risks and Mitigations
- OpenTUI runtime/tooling drift: pin versions and add minimal starter spike first.
- Keyboard UX complexity: define explicit keymap + focus model early.
- Terminal layout constraints: design responsive terminal breakpoints.
- Behavior regressions from web-to-tui pivot: reuse tested env-model modules and expand fixture tests.

## Acceptance Criteria
- App runs entirely in terminal via OpenTUI.
- No Next.js pages/routes required for core flow.
- Auth/scope/project/editor/apply/report flow works end-to-end.
- `npm run verify` (or equivalent updated verify script) passes.
- Manual smoke against `wiggy` confirms read/write parity and safe cleanup.

## Deliverables
- OpenTUI app runtime and components.
- Updated CLI launcher and package scripts.
- Updated tests and docs.
- Migration notes for removed web stack.
