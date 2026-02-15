# Learnings Log - 26021401 vercel-env-manager-opentui-rebuild

Use this file as a prepend-only log.

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
