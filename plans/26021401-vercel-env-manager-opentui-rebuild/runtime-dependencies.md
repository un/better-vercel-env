# OpenTUI Runtime Dependencies

## Added for rebuild
- `@opentui/core`
  - Purpose: Terminal renderer, layout primitives, and input components for the app runtime.
  - Notes: Runs on Bun runtime and uses `bun:ffi` internals.

## Explicitly deferred
- `@opentui/react`
  - Deferred by strategy decision in `binding-strategy.md`.

## Type compatibility note
- Added local declaration shim `src/types/bun-ffi.d.ts` so TypeScript checks remain stable under Node-oriented tooling while Bun-only imports exist in dependency declarations.
